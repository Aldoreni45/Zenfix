# Next.js API Inventory

Generated from app/api/ Next.js backend source.

## Authentication Endpoints

### Login (`/api/auth/login`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | /api/auth/login | Public | - | Login with username/password |

**Response Structure:**
- `{ user, access }` + cookies (zenfix_access_token, zenfix_refresh_token)
- Login activity logged to ActivityLog

**Cookie Settings:**
- zenfix_access_token: 60 min, NOT HttpOnly, SameSite=lax
- zenfix_refresh_token: 7 days, NOT HttpOnly, SameSite=lax

### Refresh (`/api/auth/refresh`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | /api/auth/refresh | Public | - | Refresh access token |

**Response:** `{ access }` + updated cookies

### Token Refresh (Duplicate) (`/api/auth/token/refresh`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | /api/auth/token/refresh | Public | - | Refresh access token (duplicate of /refresh) |

### Logout (`/api/auth/logout`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | /api/auth/logout | Public | - | Logout and clear cookies |

### Password Change (`/api/auth/password-change`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | /api/auth/password-change | Auth | Any | Change password |

### CSRF (`/api/auth/csrf`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/auth/csrf | Public | - | Get CSRF token |

## User Endpoints

### Users (`/api/users`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/users | Auth | Owner/Manager/Employee | List users (role-filtered) |
| POST | /api/users | Auth | Owner | Create user |

**RBAC:**
- Owner: See all, create
- Manager: See managers/employees
- Employee: See self only

**Filters:** role, status, department
**Search:** username, email, first_name, last_name

### User by ID (`/api/users/[id]`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/users/{id} | Auth | Owner/Manager/Self | Get user by ID |
| PATCH | /api/users/{id} | Auth | Owner/Self | Update user |
| DELETE | /api/users/{id} | Auth | Owner | Delete user |

**RBAC:**
- Owner: Full access
- Manager: View only
- Employee: View/update self only

### Current User (`/api/users/me`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/users/me | Auth | Any | Get current user |

### Managers (`/api/users/managers`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/users/managers | Auth | Any | List managers |

### Employees (`/api/users/employees`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/users/employees | Auth | Any | List employees |

## Department Endpoints

### Departments (`/api/departments`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/departments | Auth | Owner | List departments |
| POST | /api/departments | Auth | Owner | Create department |

**RBAC:** Owner only (requireOwner middleware)

### Department by ID (`/api/departments/[id]`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/departments/{id} | Auth | Owner | Get department |
| PATCH | /api/departments/{id} | Auth | Owner | Update department |
| DELETE | /api/departments/{id} | Auth | Owner | Delete department |

## Client Endpoints

### Clients (`/api/clients`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/clients | Auth | Owner/Manager | List clients |
| POST | /api/clients | Auth | Owner/Manager | Create client |

**RBAC:**
- Owner/Manager: Full access
- Employee: No access (empty filter)

**Filters:** status
**Search:** name, company_name, contact_person, email

### Client by ID (`/api/clients/[id]`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/clients/{id} | Auth | Any | Get client |
| PATCH | /api/clients/{id} | Auth | Owner/Manager | Update client |
| DELETE | /api/clients/{id} | Auth | Owner | Delete client |

## Task Endpoints

### Tasks (`/api/tasks`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/tasks | Auth | Owner/Manager/Employee | List tasks |
| POST | /api/tasks | Auth | Owner/Manager | Create task |

**RBAC:**
- Owner/Manager: See all
- Employee: See assigned only

**Filters:** status, priority, department, client, assigned_to
**Search:** title, task_id, description

### Task by ID (`/api/tasks/[id]`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/tasks/{id} | Auth | Any | Get task |
| PATCH | /api/tasks/{id} | Auth | Owner/Manager/Assignee | Update task |
| DELETE | /api/tasks/{id} | Auth | Owner/Manager | Delete task |

**RBAC:**
- Owner/Manager: Full access
- Employee: View/update assigned only (limited fields)

### Task Actions

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/tasks/today | Auth | Any | Today's tasks |
| GET | /api/tasks/pending | Auth | Any | Pending tasks |
| GET | /api/tasks/overdue | Auth | Any | Overdue tasks |
| GET | /api/tasks/pending_previous | Auth | Any | Previous day pending |
| POST | /api/tasks/bulk-create | Auth | Owner/Manager | Bulk create tasks |
| GET | /api/tasks/my-tasks | Auth | Any | My assigned tasks |
| GET | /api/tasks/my_tasks | Auth | Any | My assigned tasks (duplicate) |
| POST | /api/tasks/{id}/start | Auth | Assignee | Start task |
| POST | /api/tasks/{id}/complete | Auth | Assignee | Complete task |

**Task Status Values:**
- pending, assigned, in_progress, blocked, submitted, completed, rejected, cancelled, overdue

**Task Priority Values:**
- low, medium, high, urgent

## Task History Endpoints

### Task History (`/api/task-history`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/task-history | Auth | Owner | Task history summary |

**RBAC:** Owner only (requireOwner middleware)

### Task History Sub-routes

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/task-history/summary | Auth | Owner | Summary statistics |
| GET | /api/task-history/daily | Auth | Owner | Daily breakdown |
| GET | /api/task-history/tasks | Auth | Owner | Task list with pagination |
| GET | /api/task-history/users | Auth | Owner | User statistics |

## Video Endpoints

### Videos (`/api/videos`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/videos | Auth | Owner/Manager/Employee | List videos |
| POST | /api/videos | Auth | Owner/Manager | Create video |

**RBAC:**
- Owner/Manager: See all
- Employee: See assigned only

**Filters:** stage, status, priority, client, assigned_to
**Search:** title, video_code, description

**Video Stage Values:**
- idea, script, shooting, editing, internal_review, client_review, revision, approved, published, rejected, scheduled, in_progress, owner_review, posted

## Approval Endpoints

### Approvals (`/api/approvals`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/approvals | Auth | Owner/Manager/Employee | List approvals |
| POST | /api/approvals | Auth | Owner/Manager | Request approval |

**RBAC:**
- Owner/Manager: See all
- Employee: See own requests

**Filters:** status, type, reviewer

### Approval by ID (`/api/approvals/[id]`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/approvals/{id} | Auth | Any | Get approval |
| PATCH | /api/approvals/{id} | Auth | Any | Update approval |

### Approval Actions

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/approvals/pending | Auth | Owner/Manager | Pending approvals |
| GET | /api/approvals/personal | Auth | Any | My approvals |
| POST | /api/approvals/{id}/approve | Auth | Any | Approve |
| POST | /api/approvals/{id}/reject | Auth | Any | Reject |

## Notification Endpoints

### Notifications (`/api/notifications`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/notifications | Auth | Any | My notifications |

**Filters:** type, priority

### Notification by ID (`/api/notifications/[id]`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/notifications/{id} | Auth | Any | Get notification |
| PATCH | /api/notifications/{id} | Auth | Any | Update notification |

### Notification Actions

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/notifications/count | Auth | Any | Notification counts |
| GET | /api/notifications/unread | Auth | Any | Unread notifications |
| GET | /api/notifications/urgent | Auth | Any | Urgent notifications |
| POST | /api/notifications/mark-read | Auth | Any | Mark all as read |

**Response for count:** `{ total, unread, urgent }`

## Activity Log Endpoints

### Activity Logs (`/api/activity-logs`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/activity-logs | Auth | Owner/Manager/Employee | List logs |

**RBAC:**
- Owner/Manager: See all
- Employee: See own logs

**Filters:** action, entity_type
**Limit:** Default 100

### Activity Log Actions

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/activity-logs/my_logs | Auth | Any | My activity logs |
| GET | /api/activity-logs/personal | Auth | Any | Personal logs |
| GET | /api/activity-logs/recent | Auth | Owner/Manager | Recent logs |

## Dashboard Endpoints

### Dashboard (`/api/dashboard`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/dashboard | Auth | Any | Dashboard data |

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
  // Role-specific fields:
  // Owner: total_users, managers, employees, total_clients, activeClients, tasks, pending_approvals, video_workflow
  // Manager: assigned_clients, team_members, approvals, workflow_statistics, workload
  // Employee: own_tasks, completed_tasks, assigned_videos
}
```

## Monthly Target Endpoints

### Monthly Targets (`/api/targets`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/targets | Auth | Owner/Manager/Employee | List targets |
| POST | /api/targets | Auth | Owner/Manager | Create target |

**RBAC:**
- Owner/Manager: Full access
- Employee: View own

**Filters:** year, month, type, user, department, client

**Target Types:** videos, posts, reels, seo, tasks, leads

## Health Endpoints

### Health (`/api/health`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/health | Public | Health check |

**Response:** `{ success, data: { status, database } }` or `{ success, error }`

## Video Protocol Endpoints

### Video Protocols (`/api/video-protocol/protocols`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /api/video-protocol/protocols | Auth | Any | List protocols |
| POST | /api/video-protocol/protocols | Auth | Owner/Manager | Create protocol |

**Filters:** client_id, month, year, status

**Protocol Response includes:**
- workflow_progress
- completed_stages
- total_stages
- fully_completed_videos
- stage_counts
- video_status_counts

## Summary

**Total Next.js Endpoints:** ~65+ endpoints across 12 resource groups

**Key Observations:**
- JWT authentication with cookie-based tokens (same as Django)
- Role-based access control (Owner, Manager, Employee)
- Activity logging for all actions
- Notification system
- Task workflow with carry-forward
- Video protocol with stage-based workflow
- Monthly targets and progress tracking
- Approval workflow
- Dashboard with role-specific data

**Missing Compared to Django:**
- No dedicated CommentViewSet (comments embedded in tasks)
- No VideoAssetViewSet
- No SocialPostViewSet
- No dedicated task actions: carry_forward_all_pending, reject, assign (some may be in task updates)
- No video actions: my_videos, workflow_stats, update_status, advance_workflow, reject
- No approval action: request_changes
- No notification actions: bulk_mark_read
- No client actions: active, all_progress, progress, monthly_target, monthly_protocol
- No user actions: change_password (separate endpoint), status, role
- No video protocol actions: dashboard, update-target, reports, video-records, video-stages with actions
- No task history actions: carry_forward (may be in task updates)
