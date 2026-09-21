# Endpoint Catalog: Django vs Next.js

## Django Endpoints (Source of Truth)

### AuthViewSet (/api/auth)
- GET /api/auth/csrf - CSRF token
- POST /api/auth/login - Login
- POST /api/auth/logout - Logout
- POST /api/auth/token/refresh - Token refresh
- POST /api/auth/password-change - Password change
- POST /api/auth/password-reset - Password reset
- POST /api/auth/password-reset-confirm - Password reset confirm

### UserViewSet (/api/users)
- GET /api/users - List users
- POST /api/users - Create user
- GET /api/users/{id} - Get user
- PATCH /api/users/{id} - Update user
- DELETE /api/users/{id} - Delete user

### DepartmentViewSet (/api/departments)
- GET /api/departments - List departments
- POST /api/departments - Create department
- GET /api/departments/{id} - Get department
- PATCH /api/departments/{id} - Update department
- DELETE /api/departments/{id} - Delete department

### ClientViewSet (/api/clients)
- GET /api/clients - List clients
- POST /api/clients - Create client
- GET /api/clients/{id} - Get client
- PATCH /api/clients/{id} - Update client
- DELETE /api/clients/{id} - Delete client

### TaskViewSet (/api/tasks)
- GET /api/tasks - List tasks
- POST /api/tasks - Create task
- GET /api/tasks/{id} - Get task
- PATCH /api/tasks/{id} - Update task
- DELETE /api/tasks/{id} - Delete task
- GET /api/tasks/my_tasks - My tasks
- GET /api/tasks/pending - Pending tasks
- GET /api/tasks/overdue - Overdue tasks
- GET /api/tasks/today - Today's tasks
- GET /api/tasks/upcoming - Upcoming tasks
- GET /api/tasks/pending_previous - Pending previous
- POST /api/tasks/bulk_create - Bulk create tasks
- POST /api/tasks/carry_forward_all_pending - Carry forward all pending
- POST /api/tasks/{id}/start - Start task
- POST /api/tasks/{id}/complete - Complete task
- POST /api/tasks/{id}/reject - Reject task
- POST /api/tasks/{id}/assign - Assign task
- POST /api/tasks/{id}/carry_forward - Carry forward task
- GET /api/tasks/{id}/comments - Get task comments
- POST /api/tasks/{id}/comments - Add task comment

### CommentViewSet (/api/comments)
- GET /api/comments - List comments
- POST /api/comments - Create comment
- GET /api/comments/{id} - Get comment
- PATCH /api/comments/{id} - Update comment
- DELETE /api/comments/{id} - Delete comment

### VideoViewSet (/api/videos)
- GET /api/videos - List videos
- POST /api/videos - Create video
- GET /api/videos/{id} - Get video
- PATCH /api/videos/{id} - Update video
- DELETE /api/videos/{id} - Delete video
- GET /api/videos/my_videos - My videos
- GET /api/videos/workflow_stats - Workflow statistics
- POST /api/videos/{id}/update_status - Update video status
- POST /api/videos/{id}/advance_workflow - Advance workflow
- POST /api/videos/{id}/reject - Reject video

### VideoAssetViewSet (/api/video-assets)
- GET /api/video-assets - List video assets
- POST /api/video-assets - Create video asset
- GET /api/video-assets/{id} - Get video asset
- PATCH /api/video-assets/{id} - Update video asset
- DELETE /api/video-assets/{id} - Delete video asset

### ApprovalViewSet (/api/approvals)
- GET /api/approvals - List approvals
- POST /api/approvals - Create approval
- GET /api/approvals/{id} - Get approval
- PATCH /api/approvals/{id} - Update approval
- DELETE /api/approvals/{id} - Delete approval
- GET /api/approvals/pending - Pending approvals
- GET /api/approvals/my_approvals - My approvals
- POST /api/approvals/{id}/approve - Approve
- POST /api/approvals/{id}/reject - Reject
- POST /api/approvals/{id}/request_changes - Request changes

### NotificationViewSet (/api/notifications)
- GET /api/notifications - List notifications
- GET /api/notifications/{id} - Get notification
- GET /api/notifications/unread - Unread notifications
- GET /api/notifications/count - Notification count
- GET /api/notifications/urgent - Urgent notifications
- POST /api/notifications/{id}/mark_read - Mark as read
- PATCH /api/notifications/{id}/read - Mark as read (alias)
- POST /api/notifications/mark-all-read - Mark all as read
- POST /api/notifications/bulk_mark_read - Bulk mark as read

### ActivityLogViewSet (/api/activity-logs)
- GET /api/activity-logs - List activity logs
- GET /api/activity-logs/{id} - Get activity log
- GET /api/activity-logs/my_logs - My logs
- GET /api/activity-logs/recent - Recent logs

### DashboardViewSet (/api/dashboard)
- GET /api/dashboard - Dashboard data
- GET /api/dashboard/task-summary - Task summary
- GET /api/dashboard/company-overview - Company overview

### MonthlyTargetViewSet (/api/monthly-targets)
- GET /api/monthly-targets - List monthly targets
- POST /api/monthly-targets - Create monthly target
- GET /api/monthly-targets/{id} - Get monthly target
- PATCH /api/monthly-targets/{id} - Update monthly target
- DELETE /api/monthly-targets/{id} - Delete monthly target

### SocialPostViewSet (/api/social-posts)
- GET /api/social-posts - List social posts
- POST /api/social-posts - Create social post
- GET /api/social-posts/{id} - Get social post
- PATCH /api/social-posts/{id} - Update social post
- DELETE /api/social-posts/{id} - Delete social post

### TaskHistoryViewSet (/api/task-history)
- GET /api/task-history - List task history
- POST /api/task-history - Query task history

### VideoProtocolViewSet (/api/video-protocol/protocols)
- GET /api/video-protocol/protocols - List protocols
- POST /api/video-protocol/protocols - Create protocol
- GET /api/video-protocol/protocols/{id} - Get protocol
- PATCH /api/video-protocol/protocols/{id} - Update protocol
- DELETE /api/video-protocol/protocols/{id} - Delete protocol
- GET /api/video-protocol/protocols/{id}/dashboard - Protocol dashboard

### VideoRecordViewSet (/api/video-protocol/video-records)
- GET /api/video-protocol/video-records - List video records
- POST /api/video-protocol/video-records - Create video record
- GET /api/video-protocol/video-records/{id} - Get video record
- PATCH /api/video-protocol/video-records/{id} - Update video record
- DELETE /api/video-protocol/video-records/{id} - Delete video record

### VideoStageViewSet (/api/video-protocol/video-stages)
- GET /api/video-protocol/video-stages - List video stages
- POST /api/video-protocol/video-stages - Create video stage
- GET /api/video-protocol/video-stages/{id} - Get video stage
- PATCH /api/video-protocol/video-stages/{id} - Update video stage
- DELETE /api/video-protocol/video-stages/{id} - Delete video stage
- POST /api/video-protocol/video-stages/{id}/assign - Assign stage
- POST /api/video-protocol/video-stages/{id}/start - Start stage
- POST /api/video-protocol/video-stages/{id}/complete - Complete stage
- POST /api/video-protocol/video-stages/{id}/reject - Reject stage

### Health
- GET /api/health/ - Health check
- GET /api/health/ready/ - Readiness check

**Total Django Endpoints: ~110**

---

## Next.js Endpoints (To Be Verified)

### Auth (/api/auth)
- GET /api/auth/csrf
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh
- POST /api/auth/password-change
- POST /api/auth/password-reset
- POST /api/auth/password-reset-confirm
- POST /api/auth/token/refresh

### Users (/api/users)
- GET /api/users
- POST /api/users
- GET /api/users/[id]
- PATCH /api/users/[id]
- DELETE /api/users/[id]

### Departments (/api/departments)
- GET /api/departments
- POST /api/departments
- GET /api/departments/[id]
- PATCH /api/departments/[id]
- DELETE /api/departments/[id]

### Clients (/api/clients)
- GET /api/clients
- POST /api/clients
- GET /api/clients/[id]
- PATCH /api/clients/[id]
- DELETE /api/clients/[id]
- GET /api/clients/active
- GET /api/clients/all_progress
- GET /api/clients/[id]/progress
- GET /api/clients/[id]/monthly_target
- GET /api/clients/[id]/monthly_protocol

### Tasks (/api/tasks)
- GET /api/tasks
- POST /api/tasks
- GET /api/tasks/[id]
- PATCH /api/tasks/[id]
- DELETE /api/tasks/[id]
- GET /api/tasks/my-tasks
- GET /api/tasks/pending
- GET /api/tasks/overdue
- GET /api/tasks/today
- GET /api/tasks/upcoming
- POST /api/tasks/bulk-create
- POST /api/tasks/carry-forward-all-pending
- POST /api/tasks/[id]/start
- POST /api/tasks/[id]/complete
- POST /api/tasks/[id]/reject
- POST /api/tasks/[id]/assign
- POST /api/tasks/[id]/carry-forward
- GET /api/tasks/[id]/comments
- POST /api/tasks/[id]/comments

### Comments (/api/comments)
- GET /api/comments
- POST /api/comments
- GET /api/comments/[id]
- PATCH /api/comments/[id]
- DELETE /api/comments/[id]

### Videos (/api/videos)
- GET /api/videos
- POST /api/videos
- GET /api/videos/[id]
- PATCH /api/videos/[id]
- DELETE /api/videos/[id]
- GET /api/videos/my-videos
- GET /api/videos/workflow-stats
- POST /api/videos/[id]/update-status
- POST /api/videos/[id]/advance-workflow
- POST /api/videos/[id]/reject

### Social Posts (/api/social-posts)
- GET /api/social-posts
- POST /api/social-posts
- GET /api/social-posts/my-posts
- GET /api/social-posts/scheduled

### Approvals (/api/approvals)
- GET /api/approvals
- POST /api/approvals
- GET /api/approvals/[id]
- PATCH /api/approvals/[id]
- DELETE /api/approvals/[id]
- GET /api/approvals/pending
- GET /api/approvals/personal
- POST /api/approvals/[id]/approve
- POST /api/approvals/[id]/reject
- POST /api/approvals/[id]/request_changes

### Notifications (/api/notifications)
- GET /api/notifications
- GET /api/notifications/[id]
- GET /api/notifications/unread
- GET /api/notifications/count
- GET /api/notifications/urgent
- POST /api/notifications/[id]/read
- POST /api/notifications/mark-read
- POST /api/notifications/mark-all-read
- POST /api/notifications/bulk_mark_read

### Activity Logs (/api/activity-logs)
- GET /api/activity-logs
- GET /api/activity-logs/[id]
- GET /api/activity-logs/my_logs
- GET /api/activity-logs/recent
- GET /api/activity-logs/personal

### Dashboard (/api/dashboard)
- GET /api/dashboard
- GET /api/dashboard/task-summary
- GET /api/dashboard/company-overview

### Targets (/api/targets)
- GET /api/targets
- POST /api/targets
- GET /api/targets/[id]
- PATCH /api/targets/[id]
- DELETE /api/targets/[id]

### Task History (/api/task-history)
- GET /api/task-history
- POST /api/task-history
- GET /api/task-history/daily
- GET /api/task-history/summary
- GET /api/task-history/tasks
- GET /api/task-history/users

### Video Protocol (/api/video-protocol)
- GET /api/video-protocol/protocols
- POST /api/video-protocol/protocols
- GET /api/video-protocol/protocols/[id]
- PATCH /api/video-protocol/protocols/[id]
- DELETE /api/video-protocol/protocols/[id]
- GET /api/video-protocol/protocols/[id]/dashboard
- POST /api/video-protocol/protocols/[id]/update-target
- GET /api/video-protocol/video-records
- POST /api/video-protocol/video-records
- GET /api/video-protocol/video-records/[id]
- PATCH /api/video-protocol/video-records/[id]
- DELETE /api/video-protocol/video-records/[id]
- GET /api/video-protocol/video-stages
- POST /api/video-protocol/video-stages
- GET /api/video-protocol/video-stages/[id]
- PATCH /api/video-protocol/video-stages/[id]
- DELETE /api/video-protocol/video-stages/[id]
- POST /api/video-protocol/video-stages/[id]/assign
- POST /api/video-protocol/video-stages/[id]/start
- POST /api/video-protocol/video-stages/[id]/complete
- POST /api/video-protocol/video-stages/[id]/reject

### Health
- GET /api/health

**Total Next.js Endpoints: ~110**

---

## Testing Status

| Category | Django | Next.js | Status |
|----------|--------|---------|--------|
| Auth | 7 | 8 | Pending |
| Users | 5 | 5 | Pending |
| Departments | 5 | 5 | Pending |
| Clients | 5 | 9 | Pending |
| Tasks | 19 | 18 | Pending |
| Comments | 5 | 5 | Pending |
| Videos | 9 | 9 | Pending |
| Video Assets | 5 | 0 | Missing |
| Approvals | 9 | 9 | Pending |
| Notifications | 9 | 9 | Pending |
| Activity Logs | 4 | 5 | Pending |
| Dashboard | 3 | 3 | Pending |
| Monthly Targets | 5 | 5 | Pending |
| Social Posts | 5 | 3 | Pending |
| Task History | 2 | 6 | Pending |
| Video Protocol | 15 | 15 | Pending |
| Health | 2 | 1 | Pending |
| **TOTAL** | **110** | **110** | **0% Tested** |

---

## Missing/Extra Endpoints

### Missing in Next.js:
- /api/video-assets (CRUD) - 5 endpoints

### Extra in Next.js:
- /api/clients/active (extra)
- /api/clients/all_progress (extra)
- /api/clients/[id]/progress (extra)
- /api/clients/[id]/monthly_target (extra)
- /api/clients/[id]/monthly_protocol (extra)
- /api/activity-logs/personal (extra)
- /api/task-history/daily (extra)
- /api/task-history/summary (extra)
- /api/task-history/tasks (extra)
- /api/task-history/users (extra)
- /api/social-posts/my-posts (extra)
- /api/social-posts/scheduled (extra)
- /api/video-protocol/protocols/[id]/update-target (extra)
- /api/auth/token/refresh (duplicate of /api/auth/refresh)

### Missing in Django:
- None (Django is source of truth)
