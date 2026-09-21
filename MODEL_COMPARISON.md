# Django Models vs MongoDB Models Comparison

## Overview

**Django:** 11 models with django-mongodb-backend
**MongoDB:** 10 model classes (with 3 embedded models without endpoints)

## Model-by-Model Comparison

### 1. User Model

**Django Model:** `backend/users/models.py - User`
**MongoDB Model:** `lib/mongodb/models/user.ts - UserDocument`

| Field | Django | MongoDB | Status |
|-------|--------|---------|--------|
| numeric_id | ✅ Auto-generated | ✅ Auto-generated | ✅ Match |
| username | ✅ Unique | ✅ | ✅ Match |
| email | ✅ Unique | ✅ | ✅ Match |
| first_name | ✅ | ✅ | ✅ Match |
| last_name | ✅ | ✅ | ✅ Match |
| password | ✅ Hashed | ✅ Hashed | ✅ Match |
| phone | ✅ | ✅ | ✅ Match |
| avatar | ✅ | ✅ | ✅ Match |
| role | ✅ OWNER/MANAGER/EMPLOYEE | ✅ OWNER/MANAGER/EMPLOYEE | ✅ Match |
| status | ✅ ACTIVE/INACTIVE/SUSPENDED | ✅ ACTIVE/INACTIVE/SUSPENDED | ✅ Match |
| department | ✅ ForeignKey | ✅ department_id (number) | ⚠️ Different type |
| reports_to | ✅ ForeignKey | ✅ reports_to_id (number) | ⚠️ Different type |
| is_active | ✅ Computed from status | ✅ Computed from status | ✅ Match |
| is_staff | ✅ Computed from role | ✅ Computed from role | ✅ Match |
| is_superuser | ✅ Computed from role | ✅ Computed from role | ✅ Match |
| last_login | ✅ | ✅ | ✅ Match |
| created_at | ✅ auto_now_add | ✅ | ✅ Match |
| updated_at | ✅ auto_now | ✅ | ✅ Match |

**Issue:** Django uses ForeignKey for department/reports_to, MongoDB uses numeric_id (number)

### 2. Department Model

**Django Model:** `backend/departments/models.py - Department`
**MongoDB Model:** `lib/mongodb/models/department.ts - DepartmentDocument`

| Field | Django | MongoDB | Status |
|-------|--------|---------|--------|
| numeric_id | ✅ Auto-generated | ✅ Auto-generated | ✅ Match |
| name | ✅ Unique | ✅ | ✅ Match |
| slug | ✅ Unique | ✅ | ✅ Match |
| description | ✅ | ✅ | ✅ Match |
| is_active | ✅ default True | ✅ default True | ✅ Match |
| created_at | ✅ auto_now_add | ✅ | ✅ Match |
| updated_at | ✅ auto_now | ✅ | ✅ Match |

**Status:** ✅ Fully Matched

### 3. Client Model

**Django Model:** `backend/clients/models.py - Client`
**MongoDB Model:** `lib/mongodb/models/client.ts - ClientDocument`

| Field | Django | MongoDB | Status |
|-------|--------|---------|--------|
| numeric_id | ✅ Auto-generated | ✅ Auto-generated | ✅ Match |
| name | ✅ | ✅ | ✅ Match |
| company_name | ✅ | ✅ | ✅ Match |
| contact_person | ✅ | ✅ | ✅ Match |
| email | ✅ | ✅ | ✅ Match |
| phone | ✅ | ✅ | ✅ Match |
| website | ✅ | ✅ | ✅ Match |
| industry | ✅ | ✅ | ✅ Match |
| description | ✅ | ✅ | ✅ Match |
| address | ✅ | ✅ | ✅ Match |
| instagram_username | ✅ | ✅ | ✅ Match |
| instagram_url | ✅ | ✅ | ✅ Match |
| notes | ✅ | ✅ | ✅ Match |
| status | ✅ LEAD/ACTIVE/PAUSED/COMPLETED/ARCHIVED/INACTIVE | ✅ LEAD/ACTIVE/PAUSED/COMPLETED/ARCHIVED/INACTIVE | ✅ Match |
| assigned_manager | ✅ ForeignKey | ✅ assigned_manager_id (number) | ⚠️ Different type |
| assigned_team | ✅ ManyToMany | ✅ assigned_team_ids (number[]) | ⚠️ Different type |
| start_date | ✅ | ✅ | ✅ Match |
| end_date | ✅ | ✅ | ✅ Match |
| monthly_video_target | ✅ default 5 | ✅ default 5 | ✅ Match |
| created_by | ✅ ForeignKey | ✅ created_by_id (number) | ⚠️ Different type |
| created_at | ✅ auto_now_add | ✅ | ✅ Match |
| updated_at | ✅ auto_now | ✅ | ✅ Match |

**Issue:** Django uses ForeignKey/ManyToMany, MongoDB uses numeric_id/number[]

### 4. Task Model

**Django Model:** `backend/tasks/models.py - Task`
**MongoDB Model:** `lib/mongodb/models/task.ts - TaskDocument`

| Field | Django | MongoDB | Status |
|-------|--------|---------|--------|
| numeric_id | ✅ Auto-generated | ✅ Auto-generated | ✅ Match |
| task_id | ✅ Auto-generated | ✅ Auto-generated (T-XXXXXX) | ✅ Match |
| title | ✅ | ✅ | ✅ Match |
| description | ✅ | ✅ | ✅ Match |
| client | ✅ ForeignKey | ✅ client_id (number) | ⚠️ Different type |
| video | ✅ ForeignKey | ✅ video_id (number) | ⚠️ Different type |
| assigned_to | ✅ ForeignKey | ✅ assigned_to_id (number) | ⚠️ Different type |
| assigned_by | ✅ ForeignKey | ✅ assigned_by_id (number) | ⚠️ Different type |
| assigned_manager | ✅ ForeignKey | ✅ assigned_manager_id (number) | ⚠️ Different type |
| created_by | ✅ ForeignKey | ✅ created_by_id (number) | ⚠️ Different type |
| department | ✅ ForeignKey | ✅ department_id (number) | ⚠️ Different type |
| priority | ✅ LOW/MEDIUM/HIGH/URGENT | ✅ LOW/MEDIUM/HIGH/URGENT | ✅ Match |
| status | ✅ PENDING/ASSIGNED/IN_PROGRESS/BLOCKED/SUBMITTED/COMPLETED/REJECTED/CANCELLED/OVERDUE | ✅ PENDING/ASSIGNED/IN_PROGRESS/BLOCKED/SUBMITTED/COMPLETED/REJECTED/CANCELLED/OVERDUE | ✅ Match |
| due_date | ✅ | ✅ | ✅ Match |
| original_due_date | ✅ | ✅ | ✅ Match |
| due_time | ✅ | ✅ | ✅ Match |
| started_at | ✅ | ✅ | ✅ Match |
| completed_at | ✅ | ✅ | ✅ Match |
| parent_task | ✅ ForeignKey | ✅ parent_task_id (number) | ⚠️ Different type |
| carried_forward_from | ✅ ForeignKey | ✅ carried_forward_from_id (number) | ⚠️ Different type |
| carry_forward_count | ✅ default 0 | ✅ default 0 | ✅ Match |
| notes | ✅ | ✅ | ✅ Match |
| attachments | ✅ JSONField | ✅ string[] | ⚠️ Different type |
| estimated_hours | ✅ default 0 | ✅ default 0 | ✅ Match |
| actual_hours | ✅ | ✅ | ✅ Match |
| rejection_reason | ✅ | ✅ | ✅ Match |
| rejection_count | ✅ default 0 | ✅ default 0 | ✅ Match |
| task_type | ✅ default 'general' | ✅ default 'general' | ✅ Match |
| drive_link | ✅ | ✅ | ✅ Match |
| completion_notes | ✅ | ✅ | ✅ Match |
| video_stage | ✅ ForeignKey | ✅ video_stage_id (number) | ⚠️ Different type |
| created_at | ✅ auto_now_add | ✅ | ✅ Match |
| updated_at | ✅ auto_now | ✅ | ✅ Match |

**Issue:** Django uses ForeignKey for relations, MongoDB uses numeric_id
**Issue:** attachments is JSONField in Django, string[]MongoDB

### Task Comment Model

**Django Model:** `backend/tasks/models.py - TaskComment`
**MongoDB Model:** `lib/mongodb/models/task.ts - TaskCommentDocument`

| Field | Django | MongoDB | Status |
|-------|--------|---------|--------|
| numeric_id | ✅ Auto-generated | ✅ Auto-generated | ✅ Match |
| task | ✅ ForeignKey | ✅ task_id (number) | ⚠️ Different type |
| author | ✅ ForeignKey | ✅ author_id (number) | ⚠️ Different type |
| comment | ✅ | ✅ | ✅ Match |
| created_at | ✅ auto_now_add | ✅ | ✅ Match |
| updated_at | ✅ auto_now | ✅ | ✅ Match |

**Status:** ✅ Matched (but no API endpoints in Next.js)

### 5. Video Model

**Django Model:** `backend/videos/models.py - Video`
**MongoDB Model:** `lib/mongodb/models/video.ts - VideoDocument`

| Field | Django | MongoDB | Status |
|-------|--------|---------|--------|
| numeric_id | ✅ Auto-generated | ✅ Auto-generated | ✅ Match |
| video_code | ✅ Auto-generated | ✅ Auto-generated (ZF-XXXX) | ✅ Match |
| title | ✅ | ✅ | ✅ Match |
| description | ✅ | ✅ | ✅ Match |
| client | ✅ ForeignKey | ✅ client_id (number) | ⚠️ Different type |
| assigned_to | ✅ ForeignKey | ✅ assigned_to_id (number) | ⚠️ Different type |
| created_by | ✅ ForeignKey | ✅ created_by_id (number) | ⚠️ Different type |
| stage | ✅ IDEA/SCRIPT/SHOOTING/EDITING/INTERNAL_REVIEW/CLIENT_REVIEW/REVISION/APPROVED/PUBLISHED/REJECTED/SCHEDULED/IN_PROGRESS/OWNER_REVIEW/POSTED | ✅ Same values | ✅ Match |
| status | ✅ Same as stage | ✅ Same as stage | ✅ Match |
| priority | ✅ LOW/MEDIUM/HIGH/URGENT | ✅ LOW/MEDIUM/HIGH/URGENT | ✅ Match |
| deadline | ✅ | ✅ | ✅ Match |
| script | ✅ | ✅ | ✅ Match |
| video_url | ✅ | ✅ | ✅ Match |
| thumbnail_url | ✅ | ✅ | ✅ Match |
| feedback | ✅ | ✅ | ✅ Match |
| monthly_target | ✅ ForeignKey | ✅ monthly_target_id (number) | ⚠️ Different type |
| shoot_date | ✅ | ✅ | ✅ Match |
| edit_due_date | ✅ | ✅ | ✅ Match |
| approval_date | ✅ | ✅ | ✅ Match |
| posted_date | ✅ | ✅ | ✅ Match |
| shooter | ✅ ForeignKey | ✅ shooter_id (number) | ⚠️ Different type |
| editor | ✅ ForeignKey | ✅ editor_id (number) | ⚠️ Different type |
| social_media_handler | ✅ ForeignKey | ✅ social_media_handler_id (number) | ⚠️ Different type |
| raw_footage_urls | ✅ JSONField | ✅ string[] | ⚠️ Different type |
| edited_video_url | ✅ | ✅ | ✅ Match |
| final_video_url | ✅ | ✅ | ✅ Match |
| duration | ✅ | ✅ | ✅ Match |
| format | ✅ | ✅ | ✅ Match |
| rejection_reason | ✅ | ✅ | ✅ Match |
| rejection_count | ✅ default 0 | ✅ default 0 | ✅ Match |
| instagram_caption | ✅ | ✅ | ✅ Match |
| instagram_hashtags | ✅ JSONField | ✅ string[] | ⚠️ Different type |
| instagram_post_url | ✅ | ✅ | ✅ Match |
| created_at | ✅ auto_now_add | ✅ | ✅ Match |
| updated_at | ✅ auto_now | ✅ | ✅ Match |

**Issue:** Django uses ForeignKey for relations, MongoDB uses numeric_id
**Issue:** JSONField vs string[] for arrays

### Video Asset Model

**Django Model:** `backend/videos/models.py - VideoAsset`
**MongoDB Model:** `lib/mongodb/models/video.ts - VideoAssetDocument`

| Field | Django | MongoDB | Status |
|-------|--------|---------|--------|
| numeric_id | ✅ Auto-generated | ✅ Auto-generated | ✅ Match |
| video | ✅ ForeignKey | ✅ video_id (number) | ⚠️ Different type |
| uploaded_by | ✅ ForeignKey | ✅ uploaded_by_id (number) | ⚠️ Different type |
| file_url | ✅ | ✅ | ✅ Match |
| kind | ✅ | ✅ | ✅ Match |
| uploaded_at | ✅ auto_now_add | ✅ | ✅ Match |
| created_at | ✅ auto_now_add | ✅ | ✅ Match |
| updated_at | ✅ auto_now | ✅ | ✅ Match |

**Status:** ✅ Matched (but no API endpoints in Next.js)

### Social Post Model

**Django Model:** `backend/videos/models.py - SocialPost`
**MongoDB Model:** `lib/mongodb/models/video.ts - SocialPostDocument`

| Field | Django | MongoDB | Status |
|-------|--------|---------|--------|
| numeric_id | ✅ Auto-generated | ✅ Auto-generated | ✅ Match |
| video | ✅ ForeignKey | ✅ video_id (number) | ⚠️ Different type |
| platform | ✅ | ✅ | ✅ Match |
| post_type | ✅ | ✅ | ✅ Match |
| status | ✅ | ✅ | ✅ Match |
| caption | ✅ | ✅ | ✅ Match |
| hashtags | ✅ JSONField | ✅ string[] | ⚠️ Different type |
| mention_users | ✅ JSONField | ✅ string[] | ⚠️ Different type |
| scheduled_date | ✅ | ✅ | ✅ Match |
| posted_date | ✅ | ✅ | ✅ Match |
| post_url | ✅ | ✅ | ✅ Match |
| assigned_to | ✅ ForeignKey | ✅ assigned_to_id (number) | ⚠️ Different type |
| created_by | ✅ ForeignKey | ✅ created_by_id (number) | ⚠️ Different type |
| created_at | ✅ auto_now_add | ✅ | ✅ Match |
| updated_at | ✅ auto_now | ✅ | ✅ Match |

**Status:** ✅ Matched (but no API endpoints in Next.js)

### 6. Approval Model

**Django Model:** `backend/approvals/models.py - Approval`
**MongoDB Model:** `lib/mongodb/models/approval.ts - ApprovalDocument`

| Field | Django | MongoDB | Status |
|-------|--------|---------|--------|
| numeric_id | ✅ Auto-generated | ✅ Auto-generated | ✅ Match |
| content_type | ✅ | ✅ | ✅ Match |
| object_id | ✅ | ✅ | ✅ Match |
| video | ✅ ForeignKey | ✅ video_id (number) | ⚠️ Different type |
| task | ✅ ForeignKey | ✅ task_id (number) | ⚠️ Different type |
| approval_type | ✅ | ✅ | ✅ Match |
| requested_by | ✅ ForeignKey | ✅ requested_by_id (number) | ⚠️ Different type |
| reviewed_by | ✅ ForeignKey | ✅ reviewed_by_id (number) | ⚠️ Different type |
| reviewer | ✅ ForeignKey | ✅ reviewer_id (number) | ⚠️ Different type |
| status | ✅ PENDING/APPROVED/REJECTED/CHANGES_REQUESTED | ✅ PENDING/APPROVED/REJECTED/CHANGES_REQUESTED | ✅ Match |
| comments | ✅ | ✅ | ✅ Match |
| reviewer_comments | ✅ | ✅ | ✅ Match |
| requested_at | ✅ auto_now_add | ✅ | ✅ Match |
| reviewed_at | ✅ | ✅ | ✅ Match |
| client_contact | ✅ | ✅ | ✅ Match |
| client_email | ✅ | ✅ | ✅ Match |
| change_requests | ✅ JSONField | ✅ any[] | ⚠️ Different type |
| created_at | ✅ auto_now_add | ✅ | ✅ Match |
| updated_at | ✅ auto_now | ✅ | ✅ Match |

**Issue:** Django uses ForeignKey, MongoDB uses numeric_id
**Issue:** change_requests type difference

### 7. Notification Model

**Django Model:** `backend/notifications/models.py - Notification`
**MongoDB Model:** `lib/mongodb/models/notification.ts - NotificationDocument`

| Field | Django | MongoDB | Status |
|-------|--------|---------|--------|
| numeric_id | ✅ Auto-generated | ✅ Auto-generated | ✅ Match |
| recipient | ✅ ForeignKey | ✅ recipient_id (number) | ⚠️ Different type |
| notification_type | ✅ | ✅ | ✅ Match |
| title | ✅ | ✅ | ✅ Match |
| message | ✅ | ✅ | ✅ Match |
| is_read | ✅ default False | ✅ default False | ✅ Match |
| related_object_type | ✅ | ✅ | ✅ Match |
| related_object_id | ✅ | ✅ | ✅ Match |
| link | ✅ | ✅ | ✅ Match |
| priority | ✅ | ✅ | ✅ Match |
| read_at | ✅ | ✅ | ✅ Match |
| created_at | ✅ auto_now_add | ✅ | ✅ Match |
| updated_at | ✅ auto_now | ✅ | ✅ Match |

**Issue:** Django uses ForeignKey, MongoDB uses numeric_id

### 8. Activity Log Model

**Django Model:** `backend/activity_logs/models.py - ActivityLog`
**MongoDB Model:** `lib/mongodb/models/activity-log.ts - ActivityLogDocument`

| Field | Django | MongoDB | Status |
|-------|--------|---------|--------|
| numeric_id | ✅ Auto-generated | ✅ Auto-generated | ✅ Match |
| actor | ✅ ForeignKey | ✅ actor_id (number) | ⚠️ Different type |
| action | ✅ | ✅ | ✅ Match |
| entity_type | ✅ | ✅ | ✅ Match |
| entity_id | ✅ | ✅ | ✅ Match |
| description | ✅ | ✅ | ✅ Match |
| metadata | ✅ JSONField | ✅ any | ⚠️ Different type |
| ip_address | ✅ | ✅ | ✅ Match |
| user_agent | ✅ | ✅ | ✅ Match |
| created_at | ✅ auto_now_add | ✅ | ✅ Match |
| updated_at | ✅ auto_now | ✅ | ✅ Match |

**Issue:** Django uses ForeignKey, MongoDB uses numeric_id
**Issue:** metadata type difference

### 9. Monthly Target Model

**Django Model:** `backend/targets/models.py - MonthlyTarget`
**MongoDB Model:** `lib/mongodb/models/monthly-target.ts - MonthlyTargetDocument`

| Field | Django | MongoDB | Status |
|-------|--------|---------|--------|
| numeric_id | ✅ Auto-generated | ✅ Auto-generated | ✅ Match |
| user | ✅ ForeignKey | ✅ user_id (number) | ⚠️ Different type |
| department | ✅ ForeignKey | ✅ department_id (number) | ⚠️ Different type |
| client | ✅ ForeignKey | ✅ client_id (number) | ⚠️ Different type |
| month | ✅ | ✅ | ✅ Match |
| year | ✅ | ✅ | ✅ Match |
| target_type | ✅ VIDEOS/POSTS/REELS/SEO/TASKS/LEADS | ✅ VIDEOS/POSTS/REELS/SEO/TASKS/LEADS | ✅ Match |
| target_value | ✅ | ✅ | ✅ Match |
| achieved_value | ✅ default 0 | ✅ default 0 | ✅ Match |
| target_videos | ✅ | ✅ | ✅ Match |
| completed_videos | ✅ default 0 | ✅ default 0 | ✅ Match |
| posted_videos | ✅ default 0 | ✅ default 0 | ✅ Match |
| pending_videos | ✅ default 0 | ✅ default 0 | ✅ Match |
| in_production_videos | ✅ default 0 | ✅ default 0 | ✅ Match |
| waiting_approval_videos | ✅ default 0 | ✅ default 0 | ✅ Match |
| notes | ✅ | ✅ | ✅ Match |
| start_date | ✅ | ✅ | ✅ Match |
| end_date | ✅ | ✅ | ✅ Match |
| created_by | ✅ ForeignKey | ✅ created_by_id (number) | ⚠️ Different type |
| created_at | ✅ auto_now_add | ✅ | ✅ Match |
| updated_at | ✅ auto_now | ✅ | ✅ Match |

**Issue:** Django uses ForeignKey, MongoDB uses numeric_id

### 10. Video Protocol Models

**Django Models:** `backend/video_protocol/models.py`
**MongoDB Models:** `lib/mongodb/models/video-protocol.ts`

#### MonthlyVideoProtocol

| Field | Django | MongoDB | Status |
|-------|--------|---------|--------|
| numeric_id | ✅ Auto-generated | ✅ Auto-generated | ✅ Match |
| client | ✅ ForeignKey | ✅ client_id (number) | ⚠️ Different type |
| month | ✅ | ✅ | ✅ Match |
| year | ✅ | ✅ | ✅ Match |
| target_videos | ✅ | ✅ | ✅ Match |
| status | ✅ | ✅ | ✅ Match |
| workflow_progress | ✅ default 0 | ✅ default 0 | ✅ Match |
| completed_stages | ✅ default 0 | ✅ default 0 | ✅ Match |
| total_stages | ✅ default 0 | ✅ default 0 | ✅ Match |
| fully_completed_videos | ✅ default 0 | ✅ default 0 | ✅ Match |
| stage_counts | ✅ JSONField | ✅ Record<string, {completed, total}> | ⚠️ Different type |
| video_status_counts | ✅ JSONField | ✅ {not_started, in_progress, posted} | ⚠️ Different type |
| created_at | ✅ auto_now_add | ✅ | ✅ Match |
| updated_at | ✅ auto_now | ✅ | ✅ Match |

**Issue:** Django uses ForeignKey, MongoDB uses numeric_id
**Issue:** JSONField vs TypeScript types for counts

#### VideoRecord

| Field | Django | MongoDB | Status |
|-------|--------|---------|--------|
| numeric_id | ✅ Auto-generated | ✅ Auto-generated | ✅ Match |
| protocol | ✅ ForeignKey | ✅ protocol_id (number) | ⚠️ Different type |
| video_number | ✅ | ✅ | ✅ Match |
| title | ✅ | ✅ | ✅ Match |
| client | ✅ ForeignKey | ✅ client_id (number) | ⚠️ Different type |
| client_name | ✅ property | ✅ field | ⚠️ Different approach |
| month | ✅ | ✅ | ✅ Match |
| year | ✅ | ✅ | ✅ Match |
| target_videos | ✅ | ✅ | ✅ Match |
| status | ✅ | ✅ | ✅ Match |
| current_status | ✅ | ✅ | ✅ Match |
| current_stage_name | ✅ | ✅ | ✅ Match |
| completion_percentage | ✅ default 0 | ✅ default 0 | ✅ Match |
| created_at | ✅ auto_now_add | ✅ | ✅ Match |
| updated_at | ✅ auto_now | ✅ | ✅ Match |

**Issue:** Django uses ForeignKey, MongoDB uses numeric_id
**Issue:** client_name is property in Django, field in MongoDB

#### VideoStage

| Field | Django | MongoDB | Status |
|-------|--------|---------|--------|
| numeric_id | ✅ Auto-generated | ✅ Auto-generated | ✅ Match |
| video_record | ✅ ForeignKey | ✅ video_record_id (number) | ⚠️ Different type |
| stage_type | ✅ | ✅ | ✅ Match |
| stage_display | ✅ property | ✅ field | ⚠️ Different approach |
| status | ✅ | ✅ | ✅ Match |
| status_display | ✅ property | ✅ field | ⚠️ Different approach |
| assigned_to | ✅ ForeignKey | ✅ assigned_to_id (number) | ⚠️ Different type |
| assigned_to_detail | ✅ property | ✅ field | ⚠️ Different approach |
| started_at | ✅ | ✅ | ✅ Match |
| completed_at | ✅ | ✅ | ✅ Match |
| due_date | ✅ | ✅ | ✅ Match |
| notes | ✅ | ✅ | ✅ Match |
| rejection_reason | ✅ | ✅ | ✅ Match |
| drive_link | ✅ | ✅ | ✅ Match |
| completion_notes | ✅ | ✅ | ✅ Match |
| instagram_url | ✅ | ✅ | ✅ Match |
| caption | ✅ | ✅ | ✅ Match |
| submitted_by_name | ✅ property | ✅ field | ⚠️ Different approach |
| is_locked | ✅ default False | ✅ default False | ✅ Match |
| is_overdue | ✅ property | ✅ field | ⚠️ Different approach |
| created_at | ✅ auto_now_add | ✅ | ✅ Match |
| updated_at | ✅ auto_now | ✅ | ✅ Match |

**Issue:** Django uses ForeignKey, MongoDB uses numeric_id
**Issue:** Many properties in Django are fields in MongoDB

## Summary of Differences

### 1. Foreign Keys vs Numeric IDs

**Django:** Uses ForeignKey for relationships
**MongoDB:** Uses numeric_id (number) for relationships

**Impact:** 
- Frontend must handle numeric IDs instead of object references
- No automatic cascade deletes in MongoDB
- Must manually fetch related objects

### 2. JSONField vs TypeScript Types

**Django:** Uses JSONField for arrays (attachments, hashtags, etc.)
**MongoDB:** Uses string[] or specific TypeScript types

**Impact:** 
- Type safety improved in MongoDB
- May need data migration if JSON structure differs

### 3. Properties vs Fields

**Django:** Uses @property for computed fields (client_name, stage_display, etc.)
**MongoDB:** Stores as fields in document

**Impact:**
- MongoDB stores redundant data
- Must manually update computed fields in MongoDB
- Django computes on-the-fly, MongoDB requires manual sync

### 4. Missing API Endpoints

**Models defined but no endpoints:**
- TaskCommentModel - No API endpoints
- VideoAssetModel - No API endpoints  
- SocialPostModel - No API endpoints
- VideoRecordModel - No API endpoints
- VideoStageModel - No API endpoints

**Impact:** These models exist in MongoDB but cannot be accessed via API

### 5. Collection Naming

**Django:** Uses table names (e.g., users_user)
**MongoDB:** Uses zf_ prefix (e.g., zf_users)

**Status:** ✅ Consistent naming convention

## Recommendations

1. **Keep numeric_id approach** - It's working and consistent across MongoDB
2. **Add API endpoints** for TaskComment, VideoAsset, SocialPost, VideoRecord, VideoStage
3. **Consider denormalization** - MongoDB approach of storing computed fields may be acceptable for read-heavy workloads
4. **Add data sync logic** - For computed fields that need updates (client_name, stage_display, etc.)
5. **Implement cascade deletes** - Add logic to delete related documents when parent is deleted
