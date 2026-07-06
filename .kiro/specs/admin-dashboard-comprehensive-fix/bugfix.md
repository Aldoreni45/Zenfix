# Bugfix Requirements Document

## Introduction

The ZenFix admin dashboard has multiple critical bugs that break core functionality for admin users. These span three categories: **data integrity bugs** (notification field mismatch causing silent failures), **navigation bugs** (broken sidebar links and missing nav entries causing 404s), and **UI/styling bugs** (undefined Tailwind v4 utility classes and broken CSS gradients causing visual breakage). Additionally, missing API endpoints prevent user management actions and API-driven task updates from working. Together these bugs make the admin dashboard largely non-functional in production.

---

## Bug Analysis

### Current Behavior (Defect)

**Bug Group A — Notification Field Mismatch (Silent Data Loss)**

1.1 WHEN `createTask` is called and a notification is created for the assigned worker THEN the system uses `recipient` as the field name, but the Notification model schema requires `receiver`, causing the notification to fail Mongoose validation and not be saved to the database

1.2 WHEN `approveTask`, `rejectTask`, `markNotCompleted`, or `addComment` is called and a notification is created THEN the system uses `receiver` correctly for some actions but `recipient` for `createTask`, creating inconsistency and silent notification failures for task assignment events

**Bug Group B — Admin Sidebar Navigation Broken**

1.3 WHEN an admin clicks "Activity Logs" in the sidebar THEN the system navigates to `/adminzenfix/activity` which does not exist, resulting in a 404 page (the actual page is at `/adminzenfix/activity-logs`)

1.4 WHEN an admin views the sidebar navigation THEN the system does not show a "Calendar" link in `adminNavigation`, making the existing admin calendar page at `/adminzenfix/calendar` unreachable from the navigation

**Bug Group C — CSS Classes Undefined in Tailwind v4**

1.5 WHEN pages using `from-electric-cyan` or `to-purple` Tailwind gradient utility classes are rendered THEN the system applies no gradient styling because these utility class names do not exist in Tailwind v4 (the colors are defined as `--color-electric-cyan` and `--color-purple` CSS variables under `@theme inline`, but utility classes in v4 require the `--color-` prefix stripped, so valid class names are `from-electric-cyan` and `to-purple` only if registered — currently the gradient does not render on the Export button and other elements)

1.6 WHEN the loading spinner in `reports/page.tsx` and `tasks/[id]/page.tsx` uses `border-electric-cyan` THEN the system renders no colored border because `border-electric-cyan` is not a valid Tailwind v4 utility

1.7 WHEN the `bg-surface` class is applied in `activity-logs/page.tsx` inputs and selects THEN the system applies no background color because `bg-surface` is not a valid Tailwind v4 utility (the CSS variable is `--color-surface`)

1.8 WHEN `text-electric-cyan` and `bg-electric-cyan/20` classes are applied in `users/page.tsx` stat cards and filter buttons THEN the system applies no styling because these class names are not valid Tailwind v4 utilities

**Bug Group D — Task Completion Uses Hardcoded Notes**

1.9 WHEN a worker clicks "Complete Task" on the task detail page THEN the system submits `completionNotes` with the hardcoded static string `"Task completed successfully"` regardless of any actual notes the worker may want to provide, preventing workers from entering meaningful completion documentation

**Bug Group E — Missing API Endpoints**

1.10 WHEN the admin attempts to update a user's status or role from the users page THEN the system has no PATCH handler in `/api/users/[id]/route.ts` (only DELETE exists), making it impossible to update user data via the API

1.11 WHEN the activity logs page sends a `search` query parameter to `/api/activity-logs` THEN the system ignores the search parameter entirely because the route handler only filters by `action` and `entity` exact match, returning unfiltered results regardless of the search input

**Bug Group F — User Actions Column Non-Functional**

1.12 WHEN an admin clicks the MoreVertical (⋮) action button in the Users table Actions column THEN the system does nothing because the button has no click handler, dropdown, or menu attached to it, making edit/delete/status-change operations inaccessible from the UI

---

### Expected Behavior (Correct)

**Bug Group A — Notification Field Mismatch**

2.1 WHEN `createTask` creates a notification for the assigned worker THEN the system SHALL use `receiver` as the field name (matching the Notification model schema), so the notification is successfully saved to the database and the worker receives the assignment notification

2.2 WHEN any task server action (`createTask`, `approveTask`, `rejectTask`, `markNotCompleted`, `addComment`) creates a notification THEN the system SHALL consistently use `receiver` for all notification documents, matching the Notification model's required field

**Bug Group B — Admin Sidebar Navigation**

2.3 WHEN an admin clicks "Activity Logs" in the sidebar THEN the system SHALL navigate to `/adminzenfix/activity-logs` (the correct path), loading the existing activity logs page without a 404

2.4 WHEN an admin views the sidebar navigation THEN the system SHALL display a "Calendar" link pointing to `/adminzenfix/calendar` in the `adminNavigation` array, giving admins access to the calendar page

**Bug Group C — CSS Classes in Tailwind v4**

2.5 WHEN gradient classes are needed for the Export button, action buttons, avatars, and other elements THEN the system SHALL use valid Tailwind v4 utility class names: `from-[#06B6D4]` and `to-[#7C3AED]` as arbitrary values, or replace inline gradients with valid named utilities that reference the `@theme inline` registered colors

2.6 WHEN loading spinners use a branded color border THEN the system SHALL use `border-cyan-400` or the equivalent valid Tailwind v4 class instead of `border-electric-cyan`

2.7 WHEN inputs and selects need a surface background THEN the system SHALL use `bg-slate-800/50` or `bg-[#0F172A]/50` as a valid Tailwind v4 class instead of `bg-surface/50`

2.8 WHEN role/status badge and filter button styling references `electric-cyan` or `purple` utilities THEN the system SHALL use `text-cyan-400`, `bg-cyan-500/20`, `text-violet-400`, `bg-violet-500/20` or valid equivalents

**Bug Group D — Task Completion Notes**

2.9 WHEN a worker clicks "Complete Task" THEN the system SHALL present an input field allowing the worker to enter actual completion notes before submitting, and SHALL submit those user-provided notes as `completionNotes` instead of a hardcoded string

**Bug Group E — Missing API Endpoints**

2.10 WHEN a PATCH request is sent to `/api/users/[id]` with a valid admin session and a body containing `status` or `role` fields THEN the system SHALL update the user record accordingly and return the updated user, enabling role and status changes from the UI

2.11 WHEN the activity logs API receives a `search` query parameter THEN the system SHALL filter results by performing a case-insensitive text match against the populated user's `name` field and the `action` field, returning only matching log entries

**Bug Group F — User Actions Column**

2.12 WHEN an admin clicks the MoreVertical (⋮) action button in the Users table THEN the system SHALL display a dropdown menu with options to Edit (update role/status/department), Delete (with confirmation), and Activate/Suspend the user, and SHALL call the corresponding API endpoints when an action is selected

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN `approveTask`, `rejectTask`, `markNotCompleted`, or `addComment` creates a notification using the existing `receiver` field THEN the system SHALL CONTINUE TO create those notifications successfully without any change in behavior

3.2 WHEN a worker navigates to their own pages (Dashboard, My Tasks, Calendar, Notifications, Profile) via the worker sidebar navigation THEN the system SHALL CONTINUE TO resolve all navigation links correctly

3.3 WHEN a manager navigates via the manager sidebar navigation THEN the system SHALL CONTINUE TO resolve all navigation links correctly including Dashboard, Tasks, Calendar, Reports, Notifications, and Profile

3.4 WHEN Tailwind CSS classes that are already valid (e.g., `bg-slate-900`, `text-white`, `border-white/10`, `text-cyan-400`, standard Tailwind colors) are used throughout the admin dashboard THEN the system SHALL CONTINUE TO render those classes correctly after the CSS fix

3.5 WHEN task actions (startTask, approveTask, rejectTask, deleteTask) are called by authorized users THEN the system SHALL CONTINUE TO work correctly without any regression in authorization logic or database writes

3.6 WHEN the DELETE handler in `/api/users/[id]` is called by an admin THEN the system SHALL CONTINUE TO delete the user and log the activity as before, with no change to the delete behavior

3.7 WHEN the activity logs API is called without a `search` parameter THEN the system SHALL CONTINUE TO return all logs (filtered by role: admins see all, non-admins see their own) as before

3.8 WHEN the admin navigates to Users, Tasks, Reports, Analytics, Settings, Notifications, and Profile pages via the sidebar THEN the system SHALL CONTINUE TO resolve those navigation links correctly

3.9 WHEN the `glass-card` CSS class is applied to page containers and cards throughout the admin dashboard THEN the system SHALL CONTINUE TO render the glass morphism effect correctly (this class is already defined in `globals.css` and is NOT broken)

3.10 WHEN the task detail page loads task data via `/api/tasks/[id]` THEN the system SHALL CONTINUE TO display task information, comments, and role-appropriate action buttons correctly
