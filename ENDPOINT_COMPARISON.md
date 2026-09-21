# Django vs Next.js Endpoint Comparison

## Overview

**Django Backend:** ~120+ endpoints across 15 ViewSets
**Next.js Backend:** ~65+ endpoints across 12 resource groups

**Gap:** ~55+ endpoints missing from Next.js backend

## Critical Missing Endpoints

### 1. Comment Endpoints (Django: CommentViewSet)

| Django Path | Method | Next.js Status | Impact |
|-------------|--------|----------------|--------|
| /api/comments | GET | ❌ Missing | Cannot list comments |
| /api/comments | POST | ❌ Missing | Cannot create comments |
| /api/comments/{id} | GET | ❌ Missing | Cannot view comment |
| /api/comments/{id} | PUT/PATCH | ❌ Missing | Cannot update comment |
| /api/comments/{id} | DELETE | ❌ Missing | Cannot delete comment |
| /api/tasks/{id}/comments | GET | ❌ Missing | Cannot get task comments |
| /api/tasks/{id}/comments | POST | ❌ Missing | Cannot add comment |

**Workaround:** Comments embedded in task response as empty array `[]` in Next.js

### 2. Video Asset Endpoints (Django: VideoAssetViewSet)

| Django Path | Method | Next.js Status | Impact |
|-------------|--------|----------------|--------|
| /api/video-assets | GET | ❌ Missing | Cannot list assets |
| /api/video-assets | POST | ❌ Missing | Cannot upload assets |
| /api/video-assets/{id} | GET | ❌ Missing | Cannot view asset |
| /api/video-assets/{id} | PUT/PATCH | ❌ Missing | Cannot update asset |
| /api/video-assets/{id} | DELETE | ❌ Missing | Cannot delete asset |
| /api/video-assets/my_uploads | GET | ❌ Missing | Cannot view uploads |

**Workaround:** Assets embedded in video response as empty array `[]` in Next.js

### 3. Social Post Endpoints (Django: SocialPostViewSet)

| Django Path | Method | Next.js Status | Impact |
|-------------|--------|----------------|--------|
| /api/social-posts | GET | ❌ Missing | Cannot list posts |
| /api/social-posts | POST | ❌ Missing | Cannot create post |
| /api/social-posts/{id} | GET | ❌ Missing | Cannot view post |
| /api/social-posts/{id} | PUT/PATCH | ❌ Missing | Cannot update post |
| /api/social-posts/{id} | DELETE | ❌ Missing | Cannot delete post |
| /api/social-posts/scheduled | GET | ❌ Missing | Cannot view scheduled |
| /api/social-posts/my_posts | GET | ❌ Missing | Cannot view my posts |
| /api/social-posts/{id}/mark_posted | POST | ❌ Missing | Cannot mark posted |

**Impact:** Social media posting workflow completely missing

### 4. Task Actions (Django: TaskViewSet actions)

| Django Path | Method | Next.js Status | Impact |
|-------------|--------|----------------|--------|
| /api/tasks/carry_forward_all_pending | POST | ❌ Missing | Cannot carry forward all |
| /api/tasks/{id}/reject | POST | ❌ Missing | Cannot reject task |
| /api/tasks/{id}/assign | POST | ❌ Missing | Cannot assign task |
| /api/tasks/{id}/carry_forward | POST | ❌ Missing | Cannot carry forward task |
| /api/tasks/upcoming | GET | ❌ Missing | Cannot view upcoming |

**Workaround:** Some actions may be available via PATCH on task, but not verified

### 5. Video Actions (Django: VideoViewSet actions)

| Django Path | Method | Next.js Status | Impact |
|-------------|--------|----------------|--------|
| /api/videos/my_videos | GET | ❌ Missing | Cannot view my videos |
| /api/videos/workflow_stats | GET | ❌ Missing | Cannot view workflow stats |
| /api/videos/{id}/update_status | POST | ❌ Missing | Cannot update status |
| /api/videos/{id}/advance_workflow | POST | ❌ Missing | Cannot advance workflow |
| /api/videos/{id}/reject | POST | ❌ Missing | Cannot reject video |

**Impact:** Video workflow management severely limited

### 6. Approval Actions (Django: ApprovalViewSet actions)

| Django Path | Method | Next.js Status | Impact |
|-------------|--------|----------------|--------|
| /api/approvals/{id}/request_changes | POST | ❌ Missing | Cannot request changes |

**Impact:** Limited approval workflow

### 7. Notification Actions (Django: NotificationViewSet actions)

| Django Path | Method | Next.js Status | Impact |
|-------------|--------|----------------|--------|
| /api/notifications/{id}/read | PATCH | ❌ Missing | Cannot mark read (alt) |
| /api/notifications/mark-all-read | POST | ❌ Missing | Cannot mark all read |
| /api/notifications/bulk_mark_read | POST | ❌ Missing | Cannot bulk mark read |

**Workaround:** `/api/notifications/mark-read` exists but may not be equivalent

### 8. Client Actions (Django: ClientViewSet actions)

| Django Path | Method | Next.js Status | Impact |
|-------------|--------|----------------|--------|
| /api/clients/active | GET | ❌ Missing | Cannot view active clients |
| /api/clients/all_progress | GET | ❌ Missing | Cannot view all progress |
| /api/clients/{id}/progress | GET | ❌ Missing | Cannot view client progress |
| /api/clients/{id}/monthly_target | GET | ❌ Missing | Cannot view monthly target |
| /api/clients/{id}/monthly_protocol | GET | ❌ Missing | Cannot view monthly protocol |

**Impact:** Client progress tracking and reporting missing

### 9. User Actions (Django: UserViewSet actions)

| Django Path | Method | Next.js Status | Impact |
|-------------|--------|----------------|--------|
| /api/users/{id}/status | PATCH | ❌ Missing | Cannot change status |
| /api/users/{id}/role | PATCH | ❌ Missing | Cannot change role |
| /api/users/change_password | POST | ⚠️ Separate | Exists at /api/auth/password-change |

**Impact:** User management limited to full PATCH

### 10. Video Protocol Actions (Django: VideoProtocolViewSet actions)

| Django Path | Method | Next.js Status | Impact |
|-------------|--------|----------------|--------|
| /api/video-protocol/protocols/{id}/dashboard | GET | ❌ Missing | Cannot view dashboard |
| /api/video-protocol/protocols/{id}/update-target | PUT | ❌ Missing | Cannot update target |
| /api/video-protocol/protocols/{id}/reports | GET | ❌ Missing | Cannot view reports |

### 11. Video Record Endpoints (Django: VideoRecordViewSet)

| Django Path | Method | Next.js Status | Impact |
|-------------|--------|----------------|--------|
| /api/video-protocol/video-records | GET | ❌ Missing | Cannot list video records |
| /api/video-protocol/video-records | POST | ❌ Missing | Cannot create record |
| /api/video-protocol/video-records/{id} | GET | ❌ Missing | Cannot view record |
| /api/video-protocol/video-records/{id} | PUT/PATCH | ❌ Missing | Cannot update record |
| /api/video-protocol/video-records/{id} | DELETE | ❌ Missing | Cannot delete record |
| /api/video-protocol/video-records/{id}/update-title | POST | ❌ Missing | Cannot update title |

**Impact:** Video protocol records management completely missing

### 12. Video Stage Actions (Django: VideoStageViewSet actions)

| Django Path | Method | Next.js Status | Impact |
|-------------|--------|----------------|--------|
| /api/video-protocol/video-stages | GET | ❌ Missing | Cannot list stages |
| /api/video-protocol/video-stages | POST | ❌ Missing | Cannot create stage |
| /api/video-protocol/video-stages/{id} | GET | ❌ Missing | Cannot view stage |
| /api/video-protocol/video-stages/{id} | PUT/PATCH | ❌ Missing | Cannot update stage |
| /api/video-protocol/video-stages/{id} | DELETE | ❌ Missing | Cannot delete stage |
| /api/video-protocol/video-stages/{id}/start | POST | ❌ Missing | Cannot start stage |
| /api/video-protocol/video-stages/{id}/complete | POST | ❌ Missing | Cannot complete stage |
| /api/video-protocol/video-stages/{id}/reject | POST | ❌ Missing | Cannot reject stage |
| /api/video-protocol/video-stages/{id}/assign | POST | ❌ Missing | Cannot assign stage |
| /api/video-protocol/video-stages/my_tasks | GET | ❌ Missing | Cannot view my stage tasks |

**Impact:** Video protocol stage workflow completely missing

### 13. Dashboard Actions (Django: DashboardViewSet actions)

| Django Path | Method | Next.js Status | Impact |
|-------------|--------|----------------|--------|
| /api/dashboard/task-summary | GET | ❌ Missing | Cannot view task summary |
| /api/dashboard/company-overview | GET | ❌ Missing | Cannot view company overview |

**Impact:** Limited dashboard data

## Response Format Differences

### Dashboard Response

**Django:**
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

**Next.js:**
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
  // Role-specific fields differ:
  // Owner: total_users, managers, employees, total_clients, activeClients, tasks, pending_approvals, video_workflow
  // Manager: assigned_clients, team_members, approvals, workflow_statistics, workload
  // Employee: own_tasks, completed_tasks, assigned_videos
}
```

**Issue:** Next.js adds role-specific fields but missing `waiting_approval`, `videos_completed`, `videos_posted`, `videos_remaining` from Django

### Task Response

**Django:** Comments embedded as separate endpoint
**Next.js:** Comments embedded as empty array `[]`

**Issue:** Comments not functional in Next.js

### Video Response

**Django:** Assets embedded as separate endpoint
**Next.js:** Assets embedded as empty array `[]`

**Issue:** Video assets not functional in Next.js

## Authentication Differences

### Cookie Settings

**Django:**
- zenfix_access_token: 60 min, NOT HttpOnly, SameSite=Lax
- zenfix_refresh_token: 7 days, NOT HttpOnly, SameSite=Lax

**Next.js:**
- zenfix_access_token: 60 min, NOT HttpOnly, SameSite=lax
- zenfix_refresh_token: 7 days, NOT HttpOnly, SameSite=lax

**Status:** ✅ Match

### Login Response

**Django:** `{ user, access }` + cookies
**Next.js:** `{ user, access }` + cookies

**Status:** ✅ Match

### Refresh Response

**Django:** `{ access }` + cookies
**Next.js:** `{ access }` + cookies

**Status:** ✅ Match

## RBAC Implementation Differences

### User Access

**Django:**
- Owner: Full access
- Manager: View all, create/update self only
- Employee: View self only

**Next.js:**
- Owner: Full access
- Manager: View managers/employees
- Employee: View self only

**Status:** ✅ Similar

### Task Access

**Django:**
- Owner/Manager: Full access
- Employee: View/Update assigned only, limited fields

**Next.js:**
- Owner/Manager: See all
- Employee: See assigned only

**Status:** ✅ Similar

### Video Access

**Django:**
- Owner: Full access
- Manager: View created/assigned/managed
- Employee: View assigned/shoot/edit/social

**Next.js:**
- Owner/Manager: See all
- Employee: See assigned only

**Issue:** Next.js missing shooter/editor/social_media_handler filtering for employees

## Business Logic Differences

### Task Carry Forward

**Django:** Dedicated endpoint `/api/tasks/carry_forward_all_pending` and `/api/tasks/{id}/carry_forward`
**Next.js:** Missing

**Impact:** Task carry-forward workflow not implemented

### Video Workflow

**Django:** Dedicated actions for `update_status`, `advance_workflow`, `reject`
**Next.js:** Missing

**Impact:** Video workflow transitions not implemented

### Video Protocol Stages

**Django:** Complete stage workflow with start/complete/reject/assign actions
**Next.js:** Missing VideoRecord and VideoStage endpoints entirely

**Impact:** Video protocol workflow not implemented

### Approval Workflow

**Django:** `request_changes` action for requesting changes
**Next.js:** Missing

**Impact:** Limited approval workflow

### Client Progress

**Django:** Multiple endpoints for progress tracking (`progress`, `monthly_target`, `monthly_protocol`)
**Next.js:** Missing

**Impact:** Client progress reporting not implemented

## Summary

### Critical Gaps (High Priority)

1. **Comment System** - Completely missing (7 endpoints)
2. **Video Protocol Workflow** - Completely missing (16 endpoints)
3. **Video Assets** - Completely missing (6 endpoints)
4. **Social Posts** - Completely missing (8 endpoints)
5. **Task Carry Forward** - Missing (3 endpoints)
6. **Video Workflow Actions** - Missing (5 endpoints)
7. **Client Progress Tracking** - Missing (5 endpoints)

### Medium Priority Gaps

8. **Notification Bulk Actions** - Missing (2 endpoints)
9. **User Status/Role Actions** - Missing (2 endpoints)
10. **Dashboard Summary Actions** - Missing (2 endpoints)
11. **Video My Videos** - Missing (1 endpoint)
12. **Approval Request Changes** - Missing (1 endpoint)

### Low Priority Gaps

13. **Task Upcoming** - Missing (1 endpoint)
14. **Video Workflow Stats** - Missing (1 endpoint)

### Total Missing Endpoints: ~55+

**Recommendation:** Prioritize implementing Critical Gaps first, as they represent complete missing functionality that the frontend may depend on.
