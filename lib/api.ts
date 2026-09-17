// API client for the Django REST backend, reached via the Next.js /api proxy.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// JWT token storage keys (browser-only, guarded for SSR)
const ACCESS_TOKEN_KEY = 'zenfix_access_token';
const REFRESH_TOKEN_KEY = 'zenfix_refresh_token';

// Production-level cookie settings
const isProduction = process.env.NODE_ENV === 'production';
const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '';
const ACCESS_TOKEN_MAX_AGE = 60 * 60; // 1 hour (access token)
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (refresh token)

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: number;
}

/**
 * Get access token from HTTP-only cookie
 */
export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${ACCESS_TOKEN_KEY}=`))
      ?.split('=')[1] || null;
    console.log('getStoredAccessToken:', token ? `${token.substring(0, 20)}...` : 'null');
    return token;
  } catch {
    return null;
  }
}

/**
 * Get refresh token from HTTP-only cookie
 */
export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${REFRESH_TOKEN_KEY}=`))
      ?.split('=')[1] || null;
    console.log('getStoredRefreshToken:', token ? `${token.substring(0, 20)}...` : 'null');
    return token;
  } catch {
    return null;
  }
}

/**
 * Store JWT tokens in cookies with production-level security
 * - HttpOnly: Prevents JavaScript access (XSS protection)
 * - Secure: Only sent over HTTPS (production)
 * - SameSite: CSRF protection
 * 
 * Note: Since HttpOnly cookies cannot be set by JavaScript, the backend
 * handles setting these cookies in the login and refresh responses.
 * This function is kept for compatibility but does nothing.
 */
export function storeTokens(access: string, refresh: string): void {
  // Backend sets HttpOnly cookies, so we don't need to set them here
  // The tokens are already set by the backend in the login/refresh response
  console.log('Tokens stored by backend in HttpOnly cookies');
}

/**
 * Clear JWT tokens from cookies
 */
export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  try {
    const secureFlag = isProduction ? '; Secure' : '';
    const domainFlag = COOKIE_DOMAIN ? `; Domain=${COOKIE_DOMAIN}` : '';
    
    document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0${secureFlag}${domainFlag}`;
    document.cookie = `${REFRESH_TOKEN_KEY}=; path=/; max-age=0${secureFlag}${domainFlag}`;
  } catch (error) {
    // Ignore errors when clearing cookies
  }
}

/**
 * Turn a raw ApiResponse into a human-friendly message.
 * The MongoDB backend returns errors as `{ detail: string }` (or field maps),
 * so we unwrap the first message.
 */
export function extractApiErrorMessage(response: ApiResponse<unknown>): string {
  if (!response.error) return 'Unexpected error';
  if (response.status === 401) return 'Session expired. Please sign in again.';
  if (response.status === 403) return 'You do not have permission to perform this action.';
  if (response.status === 429) return 'Too many requests. Please try again later.';
  if (response.status === 0 || response.status === undefined) return 'Network error. Please check your connection.';

  try {
    const parsed = JSON.parse(response.error);
    if (typeof parsed === 'string') return parsed;
    if (parsed && typeof parsed.detail === 'string') return parsed.detail;
    if (parsed && parsed.error && typeof parsed.error.message === 'string') return parsed.error.message;
    if (parsed && typeof parsed === 'object') {
      const firstValue = Object.values(parsed)[0];
      if (Array.isArray(firstValue)) return String(firstValue[0]);
      if (typeof firstValue === 'string') return firstValue;
      if (firstValue && typeof firstValue === 'object') {
        const nested = Object.values(firstValue)[0];
        if (Array.isArray(nested)) return String(nested[0]);
        if (typeof nested === 'string') return nested;
      }
    }
  } catch {
    // Body was not valid JSON — fall through to raw text.
  }

  const trimmed = response.error.trim();
  if (trimmed) return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
  return `Request failed (${response.status})`;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1] || '') : null;
}

function unwrapEnvelope<T>(payload: any): T {
  if (!payload) return payload as T;
  
  // Handle DRF envelope format with success flag
  if (typeof payload === 'object' && payload.success === true && 'data' in payload) {
    const inner = payload.data;
    if (inner && typeof inner === 'object' && Array.isArray(inner.results)) {
      return inner.results as T;
    }
    return inner as T;
  }
  
  // Handle DRF envelope format without success flag
  if (typeof payload === 'object' && 'data' in payload) {
    const inner = payload.data;
    if (inner && typeof inner === 'object' && Array.isArray(inner.results)) {
      return inner.results as T;
    }
    return inner as T;
  }
  
  // Handle direct results array
  if (typeof payload === 'object' && Array.isArray(payload.results)) {
    return payload.results as T;
  }
  
  // Return payload as-is for direct responses
  return payload as T;
}

class ApiClient {
  private baseUrl: string;
  private csrfToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async ensureCsrf(): Promise<string | null> {
    if (this.csrfToken) return this.csrfToken;
    try {
      const response = await fetch(`${this.baseUrl}/auth/csrf`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.csrfToken;
        return this.csrfToken;
      }
    } catch {
      // Ignore CSRF errors
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const accessToken = getStoredAccessToken();
      const csrf = await this.ensureCsrf();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(csrf ? { 'X-CSRFToken': csrf } : {}),
        ...options.headers,
      };
      
      // Add JWT token to Authorization header
      if (accessToken) {
        (headers as any)['Authorization'] = `Bearer ${accessToken}`;
        console.log(`Request to ${endpoint} with token: ${accessToken.substring(0, 20)}...`);
      } else {
        console.log(`Request to ${endpoint} without token`);
      }
      
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers,
      });

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401) {
        console.log(`401 on ${endpoint}, attempting token refresh`);
        const refreshResult = await this.refreshToken();
        if (refreshResult) {
          // Retry request with new token
          const newAccessToken = getStoredAccessToken();
          if (newAccessToken) {
            (headers as any)['Authorization'] = `Bearer ${newAccessToken}`;
            console.log(`Retrying ${endpoint} with new token`);
            const retryResponse = await fetch(url, {
              ...options,
              credentials: 'include',
              headers,
            });
            
            if (!retryResponse.ok) {
              const errorText = await retryResponse.text();
              return {
                error: errorText || `Request failed with status ${retryResponse.status}`,
                status: retryResponse.status,
              };
            }
            
            if (retryResponse.status === 204) {
              return { data: undefined as T };
            }
            
            const payload = await retryResponse.json();
            return { data: unwrapEnvelope<T>(payload), status: retryResponse.status };
          }
        }
        
        // Refresh failed, clear tokens and return error
        console.log(`Token refresh failed for ${endpoint}, clearing tokens`);
        clearTokens();
        const errorText = await response.text();
        return {
          error: errorText || `Request failed with status ${response.status}`,
          status: response.status,
        };
      }

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: errorText || `Request failed with status ${response.status}`,
          status: response.status,
        };
      }

      if (response.status === 204) {
        return { data: undefined as T };
      }

      const payload = await response.json();
      return { data: unwrapEnvelope<T>(payload), status: response.status };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  private async refreshToken(): Promise<boolean> {
    // If a refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Start a new refresh
    this.refreshPromise = (async () => {
      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) {
        return false;
      }
      
      try {
        console.log('Attempting token refresh...');
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });
        
        if (!response.ok) {
          console.log('Token refresh failed:', response.status);
          return false;
        }
        
        const data = await response.json();
        if (data.access && data.refresh) {
          storeTokens(data.access, data.refresh);
          console.log('Token refresh successful');
          return true;
        }
        console.log('Token refresh response missing tokens');
        return false;
      } catch (error) {
        console.log('Token refresh error:', error);
        return false;
      } finally {
        // Clear the promise after completion
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// API client instance
export const api = new ApiClient(API_BASE_URL);

// Specific API endpoints
export const apiEndpoints = {
  // Auth
  login: '/auth/login',
  logout: '/auth/logout',
  refresh: '/auth/refresh',
  csrf: '/auth/csrf',
  meAuth: '/auth/me',
  
  // Users
  users: '/users',
  user: (id: number) => `/users/${id}`,
  managers: '/users/managers',
  employees: '/users/employees',
  me: '/users/me',
  
  // Clients
  clients: '/clients',
  client: (id: number) => `/clients/${id}`,
  clientProgress: (id: number) => `/clients/${id}/progress`,
  clientMonthlyTarget: (id: number) => `/clients/${id}/monthly_target`,
  allClientProgress: '/clients/all_progress',
  
  // Monthly Targets
  monthlyTargets: '/monthly-targets',
  monthlyTarget: (id: number) => `/monthly-targets/${id}`,
  
  // Videos
  videos: '/videos',
  video: (id: number) => `/videos/${id}`,
  myVideos: '/videos/my_videos',
  videoStatus: (id: number) => `/videos/${id}/update_status`,
  videoAdvance: (id: number) => `/videos/${id}/advance_workflow`,
  videoReject: (id: number) => `/videos/${id}/reject`,
  videoStats: '/videos/workflow_stats',
  
  // Video Assets
  videoAssets: '/video-assets',
  videoAsset: (id: number) => `/video-assets/${id}`,
  myUploads: '/video-assets/my_uploads',
  
  // Tasks
  tasks: '/tasks',
  task: (id: number) => `/tasks/${id}`,
  myTasks: '/tasks/my_tasks',
  pendingTasks: '/tasks/pending',
  overdueTasks: '/tasks/overdue',
  todayTasks: '/tasks/today',
  upcomingTasks: '/tasks/upcoming',
  pendingPreviousTasks: '/tasks/pending_previous',
  bulkCreateTasks: '/tasks/bulk_create',
  assignTask: (id: number) => `/tasks/${id}/assign`,
  startTask: (id: number) => `/tasks/${id}/start`,
  completeTask: (id: number) => `/tasks/${id}/complete`,
  carryForwardTask: (id: number) => `/tasks/${id}/carry_forward`,
  rejectTask: (id: number) => `/tasks/${id}/reject`,
  carryForwardAllPending: '/tasks/carry_forward_all_pending',
  
  // Approvals
  approvals: '/approvals',
  approval: (id: number) => `/approvals/${id}`,
  approveApproval: (id: number) => `/approvals/${id}/approve`,
  rejectApproval: (id: number) => `/approvals/${id}/reject`,
  requestChangesApproval: (id: number) => `/approvals/${id}/request_changes`,
  pendingApprovals: '/approvals/pending',
  myApprovals: '/approvals/my_approvals',
  
  // Social Posts
  socialPosts: '/social-posts',
  socialPost: (id: number) => `/social-posts/${id}`,
  markPosted: (id: number) => `/social-posts/${id}/mark_posted`,
  scheduledPosts: '/social-posts/scheduled',
  myPosts: '/social-posts/my_posts',
  
  // Activity Logs
  activityLogs: '/activity-logs',
  activityLog: (id: number) => `/activity-logs/${id}`,
  myLogs: '/activity-logs/my_logs',
  recentLogs: '/activity-logs/recent',
  
  // Notifications
  notifications: '/notifications',
  notification: (id: number) => `/notifications/${id}`,
  unreadNotifications: '/notifications/unread',
  urgentNotifications: '/notifications/urgent',
  markRead: (id: number) => `/notifications/${id}/mark_read`,
  markAllRead: '/notifications/mark_all_read',
  bulkMarkRead: '/notifications/bulk_mark_read',
  notificationCount: '/notifications/count',
  
  // Dashboard
  dashboard: '/dashboard',
  taskSummary: '/dashboard/task-summary',
  companyOverview: '/dashboard/company-overview',
};

// Type definitions based on Django models
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  role: 'owner' | 'manager' | 'employee';
  role_name: string;
  department?: string;
  department_name?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
  status_name: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  name: string;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address?: string;
  instagram_username?: string;
  instagram_url?: string;
  status: 'active' | 'inactive' | 'archived';
  status_name: string;
  assigned_manager?: number;
  manager_name?: string;
  manager_email?: string;
  notes?: string;
  current_month_target?: any;
  current_progress?: any;
  created_at: string;
  updated_at: string;
}

export interface MonthlyTarget {
  id: number;
  client: number;
  client_name: string;
  year: number;
  month: number;
  year_month: string;
  target_videos: number;
  completed_videos: number;
  posted_videos: number;
  pending_videos: number;
  in_production_videos: number;
  waiting_approval_videos: number;
  remaining_videos: number;
  progress_percentage: number;
  start_date: string;
  end_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: number;
  video_code: string;
  client: number;
  client_name: string;
  monthly_target?: number;
  title: string;
  description?: string;
  status: string;
  status_name: string;
  priority: string;
  priority_name: string;
  shoot_date?: string;
  edit_due_date?: string;
  approval_date?: string;
  posted_date?: string;
  shooter?: number;
  shooter_name?: string;
  editor?: number;
  editor_name?: string;
  social_media_handler?: number;
  social_media_handler_name?: string;
  raw_footage_urls: string[];
  edited_video_url?: string;
  final_video_url?: string;
  duration?: number;
  format?: string;
  rejection_reason?: string;
  rejection_count: number;
  instagram_caption?: string;
  instagram_hashtags: string[];
  instagram_post_url?: string;
  created_by?: number;
  created_by_name?: string;
  is_overdue: boolean;
  assets?: any[];
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  task_id: string;
  video?: number;
  video_code?: string;
  client?: number;
  client_name?: string;
  task_type: string;
  task_type_name: string;
  title: string;
  description?: string;
  assigned_to?: number;
  assigned_to_name?: string;
  assigned_manager?: number;
  assigned_manager_name?: string;
  created_by?: number;
  created_by_name?: string;
  priority: string;
  priority_name: string;
  status: string;
  status_name: string;
  due_date: string;
  due_time?: string;
  completed_at?: string;
  parent_task?: number;
  carried_forward_from?: number;
  notes?: string;
  attachments: string[];
  estimated_hours: number;
  actual_hours?: number;
  rejection_reason?: string;
  rejection_count: number;
  is_overdue: boolean;
  comments?: any[];
  created_at: string;
  updated_at: string;
}

export interface Approval {
  id: number;
  video: number;
  video_code: string;
  client_name: string;
  approval_type: string;
  approval_type_name: string;
  status: string;
  status_name: string;
  reviewer?: number;
  reviewer_name?: string;
  reviewer_comments?: string;
  reviewed_at?: string;
  client_contact?: string;
  client_email?: string;
  change_requests: string[];
  requested_by?: number;
  requested_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface SocialPost {
  id: number;
  video: number;
  video_code: string;
  client_name: string;
  platform: string;
  platform_name: string;
  post_type: string;
  post_type_name: string;
  status: string;
  status_name: string;
  caption: string;
  hashtags: string[];
  mention_users: string[];
  scheduled_date: string;
  posted_date?: string;
  post_url?: string;
  engagement_stats: any;
  assigned_to?: number;
  assigned_to_name?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  user: number;
  user_email: string;
  user_name: string;
  action: string;
  action_name: string;
  entity: string;
  entity_name: string;
  entity_id: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export interface Notification {
  id: number;
  receiver: number;
  receiver_email: string;
  receiver_name: string;
  title: string;
  message: string;
  type: string;
  type_name: string;
  priority: string;
  priority_name: string;
  read: boolean;
  link?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at: string;
}

export interface DashboardData {
  total_clients?: number;
  total_users?: number;
  total_monthly_target?: number;
  videos_completed?: number;
  videos_remaining?: number;
  videos_posted?: number;
  pending_tasks?: number;
  overdue_tasks?: number;
  waiting_approval?: number;
  client_progress?: any[];
  assigned_clients?: number;
  today_tasks?: number;
  completed_today?: number;
  in_progress_today?: number;
  pending_today?: number;
  pending_previous?: number;
  workload?: any;
}