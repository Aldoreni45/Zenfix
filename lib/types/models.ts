// ============================================================================
// USER TYPES
// ============================================================================

export const UserRole = {
  OWNER: 'owner',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
} as const;

export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

export const ClientStatus = {
  LEAD: 'lead',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  CHURNED: 'churned',
} as const;

export type ClientStatus = typeof ClientStatus[keyof typeof ClientStatus];

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  role_name: string;
  department?: string | null;
  department_name?: string | null;
  avatar?: string;
  status: UserStatus;
  status_name: string;
  is_active: boolean;
  last_login?: string;
  reports_to?: number | null;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  access: string;
}

export interface PasswordChangeRequest {
  old_password: string;
  new_password: string;
}

// ============================================================================
// DEPARTMENT TYPES
// ============================================================================

export interface Department {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CLIENT TYPES
// ============================================================================

export interface Client {
  id: number;
  name: string;
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  description?: string;
  address?: string;
  instagram_username?: string;
  instagram_url?: string;
  notes?: string;
  status: ClientStatus;
  status_name: string;
  assigned_manager?: number | null;
  manager_name?: string | null;
  manager_email?: string | null;
  manager_id?: number | null;
  assigned_team: number[];
  start_date?: string | null;
  end_date?: string | null;
  monthly_video_target: number;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TASK TYPES
// ============================================================================

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];

export const TaskStatus = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  BLOCKED: 'blocked',
  SUBMITTED: 'submitted',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  OVERDUE: 'overdue',
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export const VideoStage = {
  IDEA: 'idea',
  SCRIPT: 'script',
  SHOOTING: 'shooting',
  EDITING: 'editing',
  INTERNAL_REVIEW: 'internal_review',
  CLIENT_REVIEW: 'client_review',
  REVISION: 'revision',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  OWNER_REVIEW: 'owner_review',
  POSTED: 'posted',
} as const;

export type VideoStage = typeof VideoStage[keyof typeof VideoStage];

export const VideoPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type VideoPriority = typeof VideoPriority[keyof typeof VideoPriority];

export interface Task {
  id: number;
  task_id: string;
  title: string;
  description?: string;
  client?: number | null;
  client_name?: string | null;
  video?: number | null;
  video_code?: string | null;
  assigned_to?: number | null;
  assigned_to_name?: string | null;
  assigned_by?: number | null;
  assigned_manager?: number | null;
  assigned_manager_name?: string | null;
  created_by?: number | null;
  created_by_name?: string | null;
  department?: number | null;
  priority: TaskPriority;
  priority_name: string;
  status: TaskStatus;
  status_name: string;
  due_date?: string | null;
  original_due_date?: string | null;
  due_time?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  submitted_at?: string | null;
  submitted_by_name?: string | null;
  parent_task?: number | null;
  carried_forward_from?: number | null;
  carry_forward_count: number;
  notes?: string;
  attachments: string[];
  estimated_hours: number;
  actual_hours?: number | null;
  rejection_reason?: string;
  rejection_count: number;
  task_type: string;
  task_type_name: string;
  video_stage?: number | null;
  video_stage_id?: number | null;
  drive_link?: string;
  completion_notes?: string;
  is_overdue: boolean;
  comments?: TaskComment[];
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: number;
  task: number;
  author: number;
  author_name: string;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface TaskBulkCreateRequest {
  tasks: Partial<Task>[];
  global?: Partial<Task>;
}

export interface TaskCarryForwardRequest {
  new_due_date?: string;
}

// ============================================================================
// VIDEO TYPES
// ============================================================================

export interface Video {
  id: number;
  video_code: string;
  title: string;
  description?: string;
  client?: number | null;
  client_name?: string | null;
  assigned_to?: number | null;
  assigned_to_name?: string | null;
  created_by?: number | null;
  created_by_name?: string | null;
  stage: VideoStage;
  status: VideoStage;
  status_name: string;
  priority: VideoPriority;
  priority_name: string;
  deadline?: string | null;
  script?: string;
  video_url?: string;
  thumbnail_url?: string;
  feedback?: string;
  monthly_target?: number | null;
  shoot_date?: string | null;
  edit_due_date?: string | null;
  approval_date?: string | null;
  posted_date?: string | null;
  shooter?: number | null;
  shooter_name?: string | null;
  editor?: number | null;
  editor_name?: string | null;
  social_media_handler?: number | null;
  raw_footage_urls: string[];
  edited_video_url?: string;
  final_video_url?: string;
  duration?: number | null;
  format?: string;
  rejection_reason?: string;
  rejection_count: number;
  instagram_caption?: string;
  instagram_hashtags: string[];
  instagram_post_url?: string;
  is_overdue: boolean;
  assets?: VideoAsset[];
  created_at: string;
  updated_at: string;
}

export interface VideoAsset {
  id: number;
  video: number;
  uploaded_by?: number | null;
  file_url: string;
  kind: string;
  uploaded_at: string;
  created_at: string;
}

export type SocialPostPlatform = 'instagram' | 'facebook' | 'youtube' | 'tiktok';
export type SocialPostStatus = 'draft' | 'scheduled' | 'posted' | 'failed';

export interface SocialPost {
  id: number;
  video?: number | null;
  video_code?: string | null;
  client_name?: string | null;
  platform: SocialPostPlatform;
  platform_name: string;
  post_type: string;
  status: SocialPostStatus;
  status_name: string;
  caption?: string;
  hashtags: string[];
  mention_users: string[];
  scheduled_date?: string | null;
  posted_date?: string | null;
  post_url?: string;
  assigned_to?: number | null;
  assigned_to_name?: string | null;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// APPROVAL TYPES
// ============================================================================

export const ApprovalStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CHANGES_REQUESTED: 'changes_requested',
} as const;

export type ApprovalStatus = typeof ApprovalStatus[keyof typeof ApprovalStatus];

export interface Approval {
  id: number;
  content_type: string;
  object_id: string;
  video?: number | null;
  video_code?: string | null;
  client_name?: string | null;
  task?: number | null;
  approval_type: string;
  approval_type_name: string;
  requested_by?: number | null;
  requested_by_name?: string | null;
  reviewed_by?: number | null;
  reviewer?: number | null;
  reviewer_name?: string | null;
  status: ApprovalStatus;
  status_name: string;
  comments?: string;
  reviewer_comments?: string;
  requested_at: string;
  reviewed_at?: string | null;
  client_contact?: string;
  client_email?: string;
  change_requests: any[];
  created_at: string;
  updated_at: string;
}

export interface ApprovalDecisionRequest {
  comments?: string;
  reason?: string;
  change_requests?: any[];
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

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
  related_entity_type: string;
  related_entity_id: string;
  created_at: string;
  read_at?: string | null;
}

export interface NotificationCountResponse {
  total: number;
  unread: number;
  urgent: number;
}

// ============================================================================
// ACTIVITY LOG TYPES
// ============================================================================

export const ActivityAction = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  ASSIGN: 'ASSIGN',
  STATUS_CHANGE: 'STATUS_CHANGE',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  SUBMIT: 'SUBMIT',
  ROLE_CHANGE: 'ROLE_CHANGE',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  CARRY_FORWARD: 'CARRY_FORWARD',
} as const;

export type ActivityAction = typeof ActivityAction[keyof typeof ActivityAction];

export interface ActivityLog {
  id: number;
  user?: number | null;
  user_email?: string | null;
  user_name?: string | null;
  action: ActivityAction;
  action_name: string;
  entity: string;
  entity_name: string;
  entity_id: string;
  details: any;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  created_at: string;
}

// ============================================================================
// MONTHLY TARGET TYPES
// ============================================================================

export type TargetType = 'videos_target' | 'posts_target' | 'reels_target' | 'seo_target' | 'tasks_target' | 'leads_target';

export interface MonthlyTarget {
  id: number;
  user?: number | null;
  department?: number | null;
  client?: number | null;
  client_name?: string | null;
  month: number;
  year: number;
  target_type: TargetType;
  target_value: number;
  achieved_value: number;
  target_videos: number;
  completed_videos: number;
  posted_videos: number;
  pending_videos: number;
  in_production_videos: number;
  waiting_approval_videos: number;
  remaining_videos: number;
  progress_percentage: number;
  year_month: string;
  notes?: string;
  start_date?: string | null;
  end_date?: string | null;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// VIDEO PROTOCOL TYPES
// ============================================================================

export type ProtocolStatus = 'active' | 'completed' | 'archived';
export type VideoProtocolStageType = 'shoot' | 'edit' | 'review' | 'client_approval' | 'instagram_post';
export type VideoProtocolStageStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'rejected';

export interface MonthlyVideoProtocol {
  id: number;
  numeric_id: number;
  client: number;
  client_name: string;
  month: number;
  year: number;
  target_videos: number;
  status: ProtocolStatus;
  workflow_progress: number;
  completed_stages: number;
  total_stages: number;
  fully_completed_videos: number;
  stage_counts: Record<string, { completed: number; total: number }>;
  video_status_counts: { not_started: number; in_progress: number; posted: number };
  videos?: VideoRecord[];
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface VideoRecord {
  id: number;
  numeric_id: number;
  protocol: number;
  video_number: number;
  title?: string;
  current_status: string;
  current_stage_name: string;
  current_stage_type: string;
  completion_percentage: number;
  stages?: VideoProtocolStage[];
  created_at: string;
  updated_at: string;
}

export interface VideoProtocolStage {
  id: number;
  numeric_id: number;
  video: number;
  stage_type: VideoProtocolStageType;
  stage_display: string;
  status: VideoProtocolStageStatus;
  status_display: string;
  assigned_to?: number | null;
  assigned_to_detail?: {
    id: number;
    numeric_id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
  started_at?: string | null;
  completed_at?: string | null;
  due_date?: string | null;
  notes?: string;
  rejection_reason?: string;
  drive_link: string;
  completion_notes: string;
  instagram_url?: string;
  caption?: string;
  submitted_by_name?: string | null;
  is_locked: boolean;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProtocolCreateRequest {
  client: number;
  month: number;
  year: number;
  target_videos: number;
}

export interface TargetUpdateRequest {
  target_videos: number;
  confirm_reduction?: boolean;
}

export interface StageActionRequest {
  assigned_to?: number | null;
  notes?: string;
  due_date?: string | null;
  drive_link?: string;
  completion_notes?: string;
  instagram_url?: string;
  caption?: string;
}

export interface StageRejectRequest {
  rejection_reason: string;
  reject_to_stage?: VideoProtocolStageType;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardResponse {
  role: UserRole;
  today_tasks: number;
  completed_today: number;
  in_progress_today: number;
  pending_today: number;
  pending_previous: number;
  pending_tasks: number;
  overdue_tasks: number;
  unread_notifications: number;
  waiting_approval?: number | null;
  videos_completed?: number | null;
  videos_posted?: number | null;
  videos_remaining?: number | null;
  total_users?: number;
  managers?: number;
  employees?: number;
  total_clients?: number;
  active_clients?: number;
  tasks?: number;
  pending_approvals?: number;
  video_workflow?: {
    total: number;
    approved: number;
    posted: number;
    waiting: number;
  };
  client_progress?: Array<{
    numeric_id: number;
    name: string;
    company_name: string;
  }>;
  total_monthly_target?: number;
  assigned_clients?: number;
  team_members?: number;
  approvals?: number;
  workflow_statistics?: {
    total: number;
    approved: number;
    posted: number;
    waiting: number;
  };
  workload?: {
    total: number;
    assigned_clients: number;
    employees: Array<{
      id: number;
      name: string;
      role: string;
      pending_tasks: number;
    }>;
  };
  own_tasks?: number;
  completed_tasks?: number;
  assigned_videos?: number;
}

export interface TaskSummaryResponse {
  total: number;
  by_status: {
    pending: number;
    in_progress: number;
    completed: number;
    rejected: number;
    cancelled: number;
  };
}

// ============================================================================
// TASK HISTORY TYPES
// ============================================================================

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
  role: UserRole;
  role_name: string;
  department?: number | null;
  department_name?: string | null;
  assigned: number;
  completed: number;
  pending: number;
  in_progress: number;
  rejected: number;
  overdue: number;
  completion_rate: number;
}

export interface TaskHistoryDaily {
  date: string;
  total: number;
  completed: number;
  pending: number;
  in_progress: number;
  rejected: number;
  overdue: number;
}

export interface TaskHistoryTasks {
  count: number;
  page: number;
  page_size: number;
  items: Task[];
}

export interface TaskHistoryUserDetail {
  user: {
    id: number;
    username: string;
    name: string;
    email: string;
    role: UserRole;
    role_name: string;
    department?: number | null;
    department_name?: string | null;
    status: UserStatus;
  };
  counts: TaskHistorySummary;
  recent_tasks: Task[];
  activity: ActivityLog[];
  all_time: {
    assigned: number;
    completed: number;
    pending: number;
    overdue: number;
  };
}

export interface TaskHistoryTaskDetail {
  task: Task;
  timeline: ActivityLog[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

export interface ListResponse<T> {
  count: number;
  page: number;
  page_size: number;
  items: T[];
}
