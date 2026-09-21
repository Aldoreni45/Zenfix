# Django API Inventory

Generated from backend/ Django source of truth.

## Authentication Endpoints

### AuthViewSet (`/api/auth`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/auth/csrf | Public | - | Get CSRF token |
| POST | /api/auth/login | Public | - | Login with username/password |
| POST | /api/auth/logout | Public | - | Logout and clear cookies |
| POST | /api/auth/refresh | Public | - | Refresh access token |
| POST | /api/auth/token/refresh | Public | - | Refresh access token (duplicate) |
| POST | /api/auth/password-change | Auth | Any | Change password |
| POST | /api/auth/password-reset | Public | - | Request password reset |
| POST | /api/auth/password-reset-confirm | Public | - | Confirm password reset |

**Response Structure:**
- Login: `{ user, access }` + cookies (zenfix_access_token, zenfix_refresh_token)
- Refresh: `{ access }` + updated cookies
- Logout: `{ success: true }` + cleared cookies

**Cookie Settings:**
- zenfix_access_token: 60 min, NOT HttpOnly, SameSite=Lax
- zenfix_refresh_token: 7 days, NOT HttpOnly, SameSite=Lax

## User Endpoints

### UserViewSet (`/api/users`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/users | Auth | Owner/Manager | List users (role-filtered) |
| POST | /api/users | Auth | Owner | Create user |
| GET | /api/users/{id} | Auth | Owner/Manager/Self | Get user by ID |
| PUT/PATCH | /api/users/{id} | Auth | Owner/Self | Update user |
| DELETE | /api/users/{id} | Auth | Owner | Delete user |
| GET | /api/users/me | Auth | Any | Get current user |
| GET | /api/users/managers | Auth | Any | List managers |
| GET | /api/users/employees | Auth | Any | List employees |
| PATCH | /api/users/{id}/status | Auth | Owner | Change user status |
| PATCH | /api/users/{id}/role | Auth | Owner | Change user role |
| POST | /api/users/change_password | Auth | Any | Change password |

**RBAC:**
- Owner: Full access
- Manager: View all, create/update self only
- Employee: View self only

**Filters:** role, status, department
**Search:** username, email, first_name, last_name
**Ordering:** username, created_at, role

## Department Endpoints

### DepartmentViewSet (`/api/departments`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/departments | Auth | Any | List departments |
| POST | /api/departments | Auth | Owner | Create department |
| GET | /api/departments/{id} | Auth | Any | Get department |
| PUT/PATCH | /api/departments/{id} | Auth | Owner | Update department |
| DELETE | /api/departments/{id} | Auth | Owner | Delete department |

**RBAC:** Owner only for create/update/delete

## Client Endpoints

### ClientViewSet (`/api/clients`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/clients | Auth | Owner/Manager/Employee | List clients |
| POST | /api/clients | Auth | Owner/Manager | Create client |
| GET | /api/clients/{id} | Auth | Owner/Manager/Employee | Get client |
| PUT/PATCH | /api/clients/{id} | Auth | Owner/Manager | Update client |
| DELETE | /api/clients/{id} | Auth | Owner | Delete client |
| GET | /api/clients/active | Auth | Any | List active clients |
| GET | /api/clients/all_progress | Auth | Any | All clients with progress |
| GET | /api/clients/{id}/progress | Auth | Any | Client progress |
| GET | /api/clients/{id}/monthly_target | Auth | Any | Client monthly target |
| GET | /api/clients/{id}/monthly_protocol | Auth | Any | Client monthly protocol |

**RBAC:**
- Owner: Full access
- Manager: Full access except delete
- Employee: View assigned or related

**Filters:** status, assigned_manager
**Search:** name, company_name, email, contact_person
**Ordering:** created_at, name

## Task Endpoints

### TaskViewSet (`/api/tasks`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/tasks | Auth | Owner/Manager/Employee | List tasks |
| POST | /api/tasks | Auth | Owner/Manager | Create task |
| GET | /api/tasks/{id} | Auth | Any | Get task |
| PUT/PATCH | /api/tasks/{id} | Auth | Owner/Manager/Assignee | Update task |
| DELETE | /api/tasks/{id} | Auth | Owner/Manager | Delete task |
| GET | /api/tasks/my_tasks | Auth | Any | My assigned tasks |
| GET | /api/tasks/pending | Auth | Any | Pending tasks |
| GET | /api/tasks/overdue | Auth | Any | Overdue tasks |
| GET | /api/tasks/today | Auth | Any | Today's tasks |
| GET | /api/tasks/upcoming | Auth | Any | Upcoming tasks |
| GET | /api/tasks/pending_previous | Auth | Any | Previous day pending |
| POST | /api/tasks/bulk_create | Auth | Owner/Manager | Bulk create tasks |
| POST | /api/tasks/carry_forward_all_pending | Auth | Owner/Manager | Carry forward all |
| POST | /api/tasks/{id}/start | Auth | Assignee | Start task |
| POST | /api/tasks/{id}/complete | Auth | Assignee | Complete task |
| POST | /api/tasks/{id}/reject | Auth | Owner/Manager | Reject task |
| POST | /api/tasks/{id}/assign | Auth | Owner/Manager | Assign task |
| POST | /api/tasks/{id}/carry_forward | Auth | Owner/Manager | Carry forward task |
| GET | /api/tasks/{id}/comments | Auth | Any | Get task comments |
| POST | /api/tasks/{id}/comments | Auth | Any | Add comment |

**RBAC:**
- Owner: Full access
- Manager: Full access except delete
- Employee: View/Update assigned only, limited fields

**Filters:** status, priority, department, client, assigned_to
**Search:** title, task_id, description
**Ordering:** due_date, created_at, priority, status

**Task Status Values:**
- pending, assigned, in_progress, blocked, submitted, completed, rejected, cancelled, overdue

**Task Priority Values:**
- low, medium, high, urgent

### CommentViewSet (`/api/comments`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/comments | Auth | Any | List comments |
| POST | /api/comments | Auth | Any | Create comment |
| GET | /api/comments/{id} | Auth | Any | Get comment |
| PUT/PATCH | /api/comments/{id} | Auth | Author/Owner | Update comment |
| DELETE | /api/comments/{id} | Auth | Author/Owner | Delete comment |

## Task History Endpoints

### TaskHistoryViewSet (`/api/task-history`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/task-history | Auth | Any | List task history |
| GET | /api/task-history/{id} | Auth | Any | Get history entry |

## Video Endpoints

### VideoViewSet (`/api/videos`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/videos | Auth | Owner/Manager/Employee | List videos |
| POST | /api/videos | Auth | Owner/Manager | Create video |
| GET | /api/videos/{id} | Auth | Any | Get video |
| PUT/PATCH | /api/videos/{id} | Auth | Owner/Manager | Update video |
| DELETE | /api/videos/{id} | Auth | Owner | Delete video |
| GET | /api/videos/my_videos | Auth | Any | My assigned videos |
| GET | /api/videos/workflow_stats | Auth | Any | Workflow statistics |
| POST | /api/videos/{id}/update_status | Auth | Any | Update video status |
| POST | /api/videos/{id}/advance_workflow | Auth | Any | Advance workflow |
| POST | /api/videos/{id}/reject | Auth | Owner/Manager | Reject video |

**RBAC:**
- Owner: Full access
- Manager: View created/assigned/managed
- Employee: View assigned/shoot/edit/social

**Filters:** stage, status, priority, client, assigned_to
**Search:** title, video_code, description
**Ordering:** deadline, created_at

**Video Stage Values:**
- idea, script, shooting, editing, internal_review, client_review, revision, approved, published, rejected, scheduled, in_progress, owner_review, posted

### VideoAssetViewSet (`/api/video-assets`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/video-assets | Auth | Any | List assets |
| POST | /api/video-assets | Auth | Any | Upload asset |
| GET | /api/video-assets/{id} | Auth | Any | Get asset |
| PUT/PATCH | /api/video-assets/{id} | Auth | Any | Update asset |
| DELETE | /api/video-assets/{id} | Auth | Any | Delete asset |
| GET | /api/video-assets/my_uploads | Auth | Any | My uploads |

### SocialPostViewSet (`/api/social-posts`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/social-posts | Auth | Any | List posts |
| POST | /api/social-posts | Auth | Any | Create post |
| GET | /api/social-posts/{id} | Auth | Any | Get post |
| PUT/PATCH | /api/social-posts/{id} | Auth | Any | Update post |
| DELETE | /api/social-posts/{id} | Auth | Any | Delete post |
| GET | /api/social-posts/scheduled | Auth | Any | Scheduled posts |
| GET | /api/social-posts/my_posts | Auth | Any | My posts |
| POST | /api/social-posts/{id}/mark_posted | Auth | Any | Mark as posted |

## Approval Endpoints

### ApprovalViewSet (`/api/approvals`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/approvals | Auth | Owner/Manager/Employee | List approvals |
| POST | /api/approvals | Auth | Any | Request approval |
| GET | /api/approvals/{id} | Auth | Any | Get approval |
| PUT/PATCH | /api/approvals/{id} | Auth | Any | Update approval |
| DELETE | /api/approvals/{id} | Auth | Owner | Delete approval |
| GET | /api/approvals/pending | Auth | Owner/Manager | Pending approvals |
| GET | /api/approvals/my_approvals | Auth | Any | My approvals |
| POST | /api/approvals/{id}/approve | Auth | Any | Approve |
| POST | /api/approvals/{id}/reject | Auth | Any | Reject |
| POST | /api/approvals/{id}/request_changes | Auth | Any | Request changes |

**RBAC:**
- Owner: Full access
- Manager: View team/pending
- Employee: View own requests

## Notification Endpoints

### NotificationViewSet (`/api/notifications`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/notifications | Auth | Any | My notifications |
| GET | /api/notifications/{id} | Auth | Any | Get notification |
| GET | /api/notifications/unread | Auth | Any | Unread notifications |
| GET | /api/notifications/count | Auth | Any | Notification counts |
| GET | /api/notifications/urgent | Auth | Any | Urgent notifications |
| POST/PATCH | /api/notifications/{id}/mark_read | Auth | Any | Mark as read |
| PATCH | /api/notifications/{id}/read | Auth | Any | Mark as read (alt) |
| POST | /api/notifications/mark-all-read | Auth | Any | Mark all read |
| POST | /api/notifications/bulk_mark_read | Auth | Any | Bulk mark read |

**Response for count:** `{ total, unread, urgent }`

## Activity Log Endpoints

### ActivityLogViewSet (`/api/activity-logs`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/activity-logs | Auth | Owner/Manager/Employee | List logs |
| GET | /api/activity-logs/{id} | Auth | Any | Get log entry |
| GET | /api/activity-logs/my_logs | Auth | Any | My activity logs |
| GET | /api/activity-logs/recent | Auth | Owner/Manager | Recent logs |

**RBAC:**
- Owner: View all
- Manager: View team logs
- Employee: View own logs

**Filters:** action, entity_type, actor
**Ordering:** created_at

## Dashboard Endpoints

### DashboardViewSet (`/api/dashboard`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/dashboard | Auth | Any | Dashboard data |
| GET | /api/dashboard/task-summary | Auth | Any | Task summary |
| GET | /api/dashboard/company-overview | Auth | Any | Company overview |

**Dashboard Response:**
```json
{
  "role": "owner|manager|employee",
  "today_tasks": number,
  "completed_today": number,
  "in_progress_today": number,
  "pending_today": number,
  "pending_previous": number,
  "pending_tasks": number,
  "overdue_tasks": number,
  "unread_notifications": number,
  "waiting_approval": number|null,
  "videos_completed": number|null,
  "videos_posted": number|null,
  "videos_remaining": number|null
}
```

## Monthly Target Endpoints

### MonthlyTargetViewSet (`/api/monthly-targets`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/monthly-targets | Auth | Owner/Manager/Employee | List targets |
| POST | /api/monthly-targets | Auth | Owner/Manager | Create target |
| GET | /api/monthly-targets/{id} | Auth | Any | Get target |
| PUT/PATCH | /api/monthly-targets/{id} | Auth | Owner/Manager | Update target |
| DELETE | /api/monthly-targets/{id} | Auth | Owner | Delete target |

**RBAC:**
- Owner: Full access
- Manager: View own/department/assigned
- Employee: View own

**Filters:** year, month, target_type, user, department, client

**Target Types:** videos, posts, reels, seo, tasks, leads

## Video Protocol Endpoints

### MonthlyVideoProtocolViewSet (`/api/video-protocol/protocols`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/video-protocol/protocols | Auth | Any | List protocols |
| POST | /api/video-protocol/protocols | Auth | Owner/Manager | Create protocol |
| GET | /api/video-protocol/protocols/{id} | Auth | Any | Get protocol |
| PUT/PATCH | /api/video-protocol/protocols/{id} | Auth | Owner/Manager | Update protocol |
| DELETE | /api/video-protocol/protocols/{id} | Auth | Owner | Delete protocol |
| GET | /api/video-protocol/protocols/{id}/dashboard | Auth | Any | Protocol dashboard |
| PUT | /api/video-protocol/protocols/{id}/update-target | Auth | Owner/Manager | Update target |

**Filters:** client_id, month, year, status

**Protocol Response includes:**
- workflow_progress
- completed_stages
- total_stages
- fully_completed_videos
- stage_counts
- video_status_counts

### VideoRecordViewSet (`/api/video-protocol/video-records`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/video-protocol/video-records | Auth | Any | List video records |
| POST | /api/video-protocol/video-records | Auth | Owner/Manager | Create record |
| GET | /api/video-protocol/video-records/{id} | Auth | Any | Get record |
| PUT/PATCH | /api/video-protocol/video-records/{id} | Auth | Owner/Manager | Update record |
| DELETE | /api/video-protocol/video-records/{id} | Auth | Owner | Delete record |
| POST | /api/video-protocol/video-records/{id}/update-title | Auth | Owner/Manager | Update title |

### VideoStageViewSet (`/api/video-protocol/video-stages`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/video-protocol/video-stages | Auth | Any | List stages |
| POST | /api/video-protocol/video-stages | Auth | Owner/Manager | Create stage |
| GET | /api/video-protocol/video-stages/{id} | Auth | Any | Get stage |
| PUT/PATCH | /api/video-protocol/video-stages/{id} | Auth | Owner/Manager | Update stage |
| DELETE | /api/video-protocol/video-stages/{id} | Auth | Owner | Delete stage |
| POST | /api/video-protocol/video-stages/{id}/start | Auth | Any | Start stage |
| POST | /api/video-protocol/video-stages/{id}/complete | Auth | Any | Complete stage |
| POST | /api/video-protocol/video-stages/{id}/reject | Auth | Owner/Manager | Reject stage |
| POST | /api/video-protocol/video-stages/{id}/assign | Auth | Owner/Manager | Assign stage |
| GET | /api/video-protocol/video-stages/my_tasks | Auth | Any | My stage tasks |

**Stage Types:** shoot, edit, review, client_approval, instagram_post
**Stage Status:** not_started, in_progress, completed, blocked, rejected

**Stage Assignment auto-creates Task with notification**

## Health Endpoints

### HealthView (`/api/health`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/health/ | Public | Health check |
| GET | /api/health/ready/ | Public | Readiness check |

## Summary

**Total Django Endpoints:** ~120+ endpoints across 15 ViewSets

**Key Features:**
- JWT authentication with cookie-based tokens
- Role-based access control (Owner, Manager, Employee)
- Activity logging for all actions
- Notification system
- Task workflow with carry-forward
- Video protocol with stage-based workflow
- Monthly targets and progress tracking
- Approval workflow
- Dashboard with role-specific data
