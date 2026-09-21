// API client for the Next.js backend (MongoDB + JWT authentication)

// When running in the same Next.js app, use relative /api path
// When running separately, set NEXT_PUBLIC_API_URL to the Next.js backend URL
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

// In-memory cache for short-lived access token
let inMemoryAccessToken: string | null = null;
const ACCESS_TOKEN_STORAGE_KEY = 'zenfix_access_token';

/**
 * Get current access token from memory, falling back to sessionStorage/localStorage.
 */
export function getStoredAccessToken(): string | null {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  if (typeof window !== 'undefined') {
    try {
      const stored = window.sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) ||
                     window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
      if (stored) {
        inMemoryAccessToken = stored;
        return stored;
      }
    } catch {
      // Storage access restricted
    }
  }
  return null;
}

/**
 * Set the access token in memory and frontend storage cache.
 */
export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        window.sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
        window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
      } else {
        window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
        window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
      }
    } catch {
      // Storage access restricted
    }
  }
}

/**
 * Store access token in frontend memory and storage.
 * Note: Refresh token is stored as an HttpOnly cookie managed by Next.js backend.
 */
export function storeTokens(access: string, _refresh?: string): void {
  setAccessToken(access);
}

/**
 * Refresh token is stored in an HttpOnly cookie managed by Next.js backend.
 * Kept only for API compatibility; always returns null.
 */
export function getStoredRefreshToken(): string | null {
  return null;
}

/**
 * Clear JWT tokens from memory and frontend storage.
 */
export function clearTokens(): void {
  setAccessToken(null);
  if (typeof window !== 'undefined') {
    try {
      document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0`;
      document.cookie = `${REFRESH_TOKEN_KEY}=; path=/; max-age=0`;
    } catch {
      // Ignore errors when clearing cookies
    }
  }
}

/**
 * Check if access token exists in cookies
 */
export function hasAccessToken(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const cookies = document.cookie.split('; ');
    return cookies.some(row => row.startsWith(`${ACCESS_TOKEN_KEY}=`));
  } catch {
    return false;
  }
}

/**
 * Check if refresh token exists in cookies
 */
export function hasRefreshToken(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const cookies = document.cookie.split('; ');
    return cookies.some(row => row.startsWith(`${REFRESH_TOKEN_KEY}=`));
  } catch {
    return false;
  }
}

/**
 * Turn a raw ApiResponse into a human-friendly message.
 * The Next.js backend returns errors in various formats, so we unwrap them.
 */
export function extractApiErrorMessage(response: ApiResponse<unknown>): string {
  if (!response.error) return 'Unexpected error';

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
    // Body was not valid JSON — fall through to status checks or raw text.
  }

  if (response.status === 401) return 'Invalid credentials or session expired.';
  if (response.status === 403) return 'You do not have permission to perform this action.';
  if (response.status === 404) return 'Requested endpoint or resource was not found.';
  if (response.status === 410) return 'This endpoint is deprecated or no longer available.';
  if (response.status === 429) return 'Too many requests. Please try again later.';
  if (response.status && response.status >= 500) return 'Server error. Please try again shortly.';
  if (response.status === 0 || response.status === undefined) return 'Network error. Please check your connection.';

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
  
  // Handle API envelope format with success flag
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
  private csrfPromise: Promise<string | null> | null = null;
  private refreshPromise: Promise<string | null> | null = null;
  // In-flight GET cache: if the same request is already in progress, concurrent
  // callers reuse the pending promise instead of starting a duplicate request.
  private inflightGets = new Map<string, Promise<ApiResponse<any>>>();
  private readonly STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  private readonly NO_REFRESH_ENDPOINTS = new Set(['/auth/login', '/auth/logout']);

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Acquire a CSRF token once and reuse it for the rest of the session.
   * Concurrency-safe: while a CSRF fetch is in flight all callers await the
   * same promise. Failures are best-effort and NEVER trigger retries/loops.
   */
  private ensureCsrf(): Promise<string | null> {
    if (this.csrfToken) return Promise.resolve(this.csrfToken);
    if (this.csrfPromise) return this.csrfPromise;

    this.csrfPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/auth/csrf`, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        if (response.ok) {
          const payload = await response.json();
          const token = payload?.csrfToken || payload?.data?.csrfToken || null;
          if (token) {
            this.csrfToken = token;
            return token;
          }
        }
      } catch {
        // Best-effort CSRF only. This API authenticates via JWT cookies and
        // does NOT enforce CSRF, so a missing token must never fail the request
        // or start a request -> CSRF -> request loop.
      }
      return null;
    })();

    const settled = this.csrfPromise.finally(() => {
      this.csrfPromise = null;
    });
    return settled.then(() => this.csrfToken);
  }

  public async refreshToken(): Promise<string | null> {
    // Shared refresh promise: if a refresh is already in progress, all concurrent requests await it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        // Browser automatically sends the refresh token cookie via credentials: 'include'
        let response = await fetch(`${this.baseUrl}/auth/token/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          // Fallback to /auth/refresh if needed
          response = await fetch(`${this.baseUrl}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }

        if (!response.ok) {
          clearTokens();
          return null;
        }

        const data = await response.json();
        const newAccessToken = data?.access || data?.data?.access;
        if (newAccessToken) {
          setAccessToken(newAccessToken);
          return newAccessToken;
        }
        clearTokens();
        return null;
      } catch (error) {
        console.error('Token refresh network error:', error);
        clearTokens();
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = (options.method || 'GET').toUpperCase();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    // CSRF is only relevant for state-changing methods. It is acquired lazily
    // ONCE per session and never on retries, so it can never recurse.
    if (
      !isRetry &&
      this.STATE_CHANGING_METHODS.has(method) &&
      !headers['X-CSRFToken']
    ) {
      const csrf = await this.ensureCsrf();
      if (csrf) headers['X-CSRFToken'] = csrf;
    }

    // Don't attach a stale access token to the login endpoint: an expired
    // cookie/header token previously caused CookieJWTAuthentication to abort
    // the request with 401 before AllowAny login logic could run.
    const accessToken = getStoredAccessToken();
    const isLogin = endpoint === '/auth/login';
    if (accessToken && !headers['Authorization'] && !isLogin) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers,
      });

      // Handle 401 Unauthorized - retry ONCE after token refresh.
      // Guaranteed not to loop: retries re-enter as isRetry=true and any 401
      // on a retry terminates immediately. Auth endpoints never trigger refresh.
      // Only attempt refresh if there's evidence of an existing session to avoid
      // unnecessary refresh attempts when there's no session at all.
      const hasAccess = hasAccessToken();
      const hasRefresh = hasRefreshToken();
      const sessionHint = hasAccess || hasRefresh || !!getStoredAccessToken();
      
      if (response.status === 401 && !isRetry && !this.NO_REFRESH_ENDPOINTS.has(endpoint) && sessionHint) {
        // If another concurrent request already refreshed the token, use the fresh one
        const currentToken = getStoredAccessToken();
        let activeToken = currentToken;

        if (!currentToken || currentToken === accessToken) {
          activeToken = await this.refreshToken();
        }

        if (activeToken) {
          // Retry original request exactly ONCE with the new access token
          const retryHeaders = {
            ...headers,
            'Authorization': `Bearer ${activeToken}`,
          };
          return this.request<T>(
            endpoint,
            {
              ...options,
              headers: retryHeaders,
            },
            true
          );
        }

        const errorText = await response.text();
        return {
          error: errorText || `Request failed with status 401`,
          status: 401,
        };
      }

      // If the retry itself returned 401, terminate without looping
      if (response.status === 401 && isRetry) {
        const errorText = await response.text();
        const body = errorText || 'Unauthorized';
        if (body.includes('token_not_valid')) {
          clearTokens();
        }
        return {
          error: body,
          status: 401,
        };
      }

      // Login failure: clear stale/expired tokens so the next attempt
      // starts with a clean slate.
      if (response.status === 401 && endpoint === '/auth/login') {
        clearTokens();
      }

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: errorText || `Request failed with status ${response.status}`,
          status: response.status,
        };
      }

      if (response.status === 204) {
        return { data: undefined as T, status: 204 };
      }

      const payload = await response.json();
      return { data: unwrapEnvelope<T>(payload), status: response.status };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const inflight = this.inflightGets.get(url);
    if (inflight) return inflight as Promise<ApiResponse<T>>;

    const promise = this.request<T>(endpoint, { method: 'GET' });
    promise.finally(() => {
      if (this.inflightGets.get(url) === promise) this.inflightGets.delete(url);
    });
    this.inflightGets.set(url, promise);
    return promise;
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
  refresh: '/auth/token/refresh',
  tokenRefresh: '/auth/token/refresh',
  csrf: '/auth/csrf',
  meAuth: '/auth/me',
  
  // Users
  users: '/users',
  user: (id: number) => `/users/${id}`,
  managers: '/users/managers',
  employees: '/users/employees',
  me: '/users/me',
  changePassword: '/users/change_password',
  
  // Clients
  clients: '/clients',
  client: (id: number) => `/clients/${id}`,
  clientProgress: (id: number) => `/clients/${id}/progress`,
  clientMonthlyTarget: (id: number) => `/clients/${id}/monthly_target`,
  clientMonthlyProtocol: (id: number) => `/clients/${id}/monthly_protocol`,
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

  // Task History (owner-only reports)
  taskHistory: '/task-history',
  taskHistorySummary: '/task-history/summary',
  taskHistoryUsers: '/task-history/users',
  taskHistoryUserDetail: (id: number) => `/task-history/users/${id}`,
  taskHistoryDaily: '/task-history/daily',
  taskHistoryTasks: '/task-history/tasks',
  taskHistoryTaskDetail: (id: number) => `/task-history/tasks/${id}`,
  
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

  // Video Protocol (new workflow system)
  protocols: '/video-protocol/protocols',
  protocol: (id: number) => `/video-protocol/protocols/${id}`,
  protocolDashboard: (id: number) => `/video-protocol/protocols/${id}/dashboard`,
  protocolUpdateTarget: (id: number) => `/video-protocol/protocols/${id}/update-target`,
  protocolReports: (id: number) => `/video-protocol/protocols/${id}/reports`,
  videoRecords: '/video-protocol/video-records',
  videoRecord: (id: number) => `/video-protocol/video-records/${id}`,
  videoStages: '/video-protocol/video-stages',
  videoStage: (id: number) => `/video-protocol/video-stages/${id}`,
  stageStart: (id: number) => `/video-protocol/video-stages/${id}/start`,
  stageComplete: (id: number) => `/video-protocol/video-stages/${id}/complete`,
  stageReject: (id: number) => `/video-protocol/video-stages/${id}/reject`,
  stageAssign: (id: number) => `/video-protocol/video-stages/${id}/assign`,
  myVideoTasks: '/video-protocol/video-stages/my_tasks',
};

// Type definitions based on Next.js backend models
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
  monthly_video_target: number;
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
  drive_link?: string;
  completion_notes?: string;
  submitted_by_name?: string;
  submitted_at?: string;
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

// Task History (owner-only) types
export interface TaskHistorySummary {
  total: number;
  total_all_time: number;
  completed: number;
  pending: number;
  in_progress: number;
  overdue: number;
  rejected: number;
  cancelled: number;
  carried_forward: number;
  completion_rate: number;
  due_soon: number;
}

export interface TaskHistoryUser {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  role_name: string;
  department?: number;
  department_name?: string;
  assigned: number;
  completed: number;
  pending: number;
  in_progress: number;
  rejected: number;
  overdue: number;
  completion_rate: number;
}

export interface TaskHistoryDailyRow {
  date: string;
  total: number;
  completed: number;
  pending: number;
  in_progress: number;
  rejected: number;
  overdue: number;
}

export interface TaskHistoryItem {
  id: number;
  task_id: string;
  title: string;
  client_name?: string;
  assigned_to_name?: string;
  assigned_manager_name?: string;
  video_code?: string;
  priority: string;
  priority_name: string;
  status: string;
  status_name: string;
  due_date: string | null;
  due_time?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  carry_forward_count: number;
  rejection_count: number;
  is_overdue: boolean;
}

export interface TaskHistoryPage {
  count: number;
  page: number;
  page_size: number;
  items: TaskHistoryItem[];
}

export interface TaskHistoryUserDetail {
  user: TaskHistoryUser & { status: string };
  counts: TaskHistorySummary;
  recent_tasks: TaskHistoryItem[];
  activity: ActivityLog[];
  all_time: { assigned: number; completed: number; pending: number; overdue: number };
}

export interface TaskHistoryTaskDetail {
  task: Task;
  timeline: ActivityLog[];
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

// Video Protocol types
export interface VideoStage {
  id: number;
  numeric_id: number;
  video: number;
  stage_type: 'shoot' | 'edit' | 'review' | 'client_approval' | 'instagram_post';
  stage_display: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'rejected';
  status_display: string;
  assigned_to: number | null;
  assigned_to_detail?: {
    id: number;
    numeric_id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
  started_at: string | null;
  completed_at: string | null;
  due_date: string | null;
  notes: string;
  rejection_reason: string;
  drive_link: string;
  completion_notes: string;
  instagram_url: string;
  caption: string;
  submitted_by_name?: string;
  is_locked: boolean;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

export interface VideoRecord {
  id: number;
  numeric_id: number;
  protocol: number;
  video_number: number;
  title: string;
  stages: VideoStage[];
  current_status: string;
  current_stage_name: string;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface VideoProtocol {
  id: number;
  numeric_id: number;
  client: number;
  client_name: string;
  month: number;
  year: number;
  target_videos: number;
  status: string;
  videos: VideoRecord[];
  workflow_progress: number;
  completed_stages: number;
  total_stages: number;
  fully_completed_videos: number;
  stage_counts: Record<string, { completed: number; total: number }>;
  video_status_counts: { not_started: number; in_progress: number; posted: number };
  created_at: string;
  updated_at: string;
}

export interface VideoProtocolDashboard {
  protocol: VideoProtocol;
  video_summaries: VideoRecord[];
  stage_stats: Record<string, { completed: number; in_progress: number; total: number }>;
  employee_workload: {
    id: number;
    numeric_id: number;
    first_name: string;
    last_name: string;
    email: string;
    assigned_count: number;
    completed_count: number;
    in_progress_count: number;
  }[];
  counts: {
    target: number;
    posted: number;
    in_progress: number;
    not_started: number;
    remaining: number;
  };
}

export interface VideoProtocolReport {
  summary: {
    target: number;
    posted: number;
    in_progress: number;
    not_started: number;
    workflow_progress: number;
    fully_completed: number;
    total_stages: number;
    completed_stages: number;
    blocked_stages: number;
    overdue_stages: number;
  };
  stage_breakdown: Record<string, { completed: number; total: number }>;
  employee_productivity: {
    id: number;
    numeric_id: number;
    first_name: string;
    last_name: string;
    email: string;
    total_assigned: number;
    completed: number;
    in_progress: number;
  }[];
}