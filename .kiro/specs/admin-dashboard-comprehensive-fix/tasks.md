# Implementation Plan

- [ ] 1. Write bug condition exploration tests (BEFORE implementing any fix)
  - **Property 1: Bug Condition** - Admin Dashboard Multi-Bug Exploration
  - **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms each bug exists
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: These tests encode expected behavior — they will validate the fix when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate each of the 7 bug groups exists
  - **Scoped PBT Approach**: For deterministic bugs, scope each property to the concrete failing case(s) for reproducibility

  **Group A — Notification field mismatch:**
  - Assert that in `lib/actions/task.ts`, the `Notification.create` call inside `createTask` uses `receiver` (not `recipient`) and `type: 'task_assigned'` (not `type: 'task'`)
  - On unfixed code: `recipient` is found → test FAILS (confirms bug A exists)

  **Group B — Sidebar navigation broken:**
  - Assert `adminNavigation` entry named `"Activity Logs"` has `href === "/adminzenfix/activity-logs"`
  - Assert `adminNavigation` contains an entry with `name === "Calendar"` and `href === "/adminzenfix/calendar"`
  - On unfixed code: href is `"/adminzenfix/activity"` and Calendar is absent → test FAILS (confirms bug B exists)

  **Group C — Invalid Tailwind v4 CSS classes:**
  - For each invalid class (`from-electric-cyan`, `to-purple`, `border-electric-cyan`, `bg-surface/50`, `text-electric-cyan`, `bg-electric-cyan/20`, `text-purple`, `bg-purple/20`), assert it does NOT appear in the JSX of any affected page
  - On unfixed code: all these classes are found in JSX → test FAILS (confirms bug C exists)

  **Group D — Hardcoded completion notes:**
  - Assert that `handleCompleteTask` in `tasks/[id]/page.tsx` does NOT contain the hardcoded string `"Task completed successfully"` in the `formData.append` call
  - Assert `showCompleteModal` state exists in the component
  - On unfixed code: hardcoded string is present and no modal state exists → test FAILS (confirms bug D exists)

  **Group E1 — Missing PATCH handler:**
  - Assert that `app/api/users/[id]/route.ts` exports a `PATCH` function
  - On unfixed code: no PATCH export → test FAILS (confirms bug E1 exists)

  **Group E2 — Activity logs search ignored:**
  - Assert that `app/api/activity-logs/route.ts` contains logic referencing `searchParams.get('search')` and filters the logs array
  - On unfixed code: search param is not used → test FAILS (confirms bug E2 exists)

  **Group F — User actions dropdown inert:**
  - Assert that `users/page.tsx` contains `openDropdownId` state
  - Assert that the MoreVertical button has an `onClick` handler
  - On unfixed code: no dropdown state, no onClick → test FAILS (confirms bug F exists)

  - Run all exploration tests on UNFIXED code
  - **EXPECTED OUTCOME**: All tests FAIL (this is correct — it proves each bug exists)
  - Document all counterexamples found to understand root causes
  - Mark task complete when tests are written, run, and all failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12_

- [ ] 2. Write preservation property tests (BEFORE implementing any fix)
  - **Property 2: Preservation** - Baseline Behavior for Non-Buggy Code Paths
  - **IMPORTANT**: Follow observation-first methodology
  - **Observe behavior on UNFIXED code for all non-buggy inputs, then encode as properties**

  **Preservation: Other task action notifications:**
  - Observe: `approveTask`, `rejectTask`, `markNotCompleted`, `completeTask`, `addComment` all call `Notification.create` with `receiver`
  - Write property-based test: for all task action notifications that are NOT `createTask`, the `receiver` field is always used (never `recipient`)
  - Verify test PASSES on UNFIXED code

  **Preservation: Worker navigation entries:**
  - Observe the 5 `workerNavigation` entries (Dashboard, My Tasks, Calendar, Notifications, Profile) and their hrefs/icons
  - Write test asserting all 5 entries are unchanged (exact href and icon matches)
  - Verify test PASSES on UNFIXED code

  **Preservation: Manager navigation entries:**
  - Observe the `managerNavigation` entries (Dashboard, Tasks, Assign Tasks, Calendar, Reports, Notifications, Profile) and their hrefs/icons
  - Write test asserting all entries are unchanged
  - Verify test PASSES on UNFIXED code

  **Preservation: Correct admin navigation entries:**
  - Observe all currently correct admin nav entries (Dashboard, Users, Managers, Workers, Tasks, Reports, Analytics, Settings, Notifications, Profile) and their hrefs/icons
  - Write test asserting these entries remain unchanged after the fix
  - Verify test PASSES on UNFIXED code

  **Preservation: Valid CSS classes already in use:**
  - Observe valid classes already in affected files: `bg-slate-900`, `text-white`, `border-white/10`, `from-cyan-500`, `to-purple-600`, `bg-green-500/20`, `text-cyan-400`, `glass-card`
  - Write test asserting each of these classes still appears in the files where they currently exist
  - Verify test PASSES on UNFIXED code

  **Preservation: DELETE /api/users/[id] handler:**
  - Observe DELETE export exists in `app/api/users/[id]/route.ts`
  - Write test asserting DELETE export still present and unchanged after PATCH is added
  - Verify test PASSES on UNFIXED code

  **Preservation: Activity logs GET without search param:**
  - Observe: GET `/api/activity-logs` without `search` returns all logs for admin
  - Write property-based test: for any admin GET request without `search`, result contains all available log entries
  - Verify test PASSES on UNFIXED code

  **Preservation: Task server actions (startTask, approveTask, rejectTask):**
  - Observe: these functions return `{ success: true }` for valid authorized inputs
  - Write test asserting they return success and do not error after the fix
  - Verify test PASSES on UNFIXED code

  - Run all preservation tests on UNFIXED code
  - **EXPECTED OUTCOME**: All tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [ ] 3. Fix Group A — Notification field mismatch in `createTask`

  - [ ] 3.1 Fix `recipient` → `receiver` and `type: 'task'` → `type: 'task_assigned'` in `lib/actions/task.ts`
    - Open `lib/actions/task.ts` and locate the `Notification.create` call inside `createTask`
    - Change `recipient: validatedFields.data.assignedTo` → `receiver: validatedFields.data.assignedTo`
    - Change `type: 'task'` → `type: 'task_assigned'`
    - Verify no other field name changes are made in this file
    - _Bug_Condition: isBugCondition_A — `createTask` notification payload has `recipient` field instead of `receiver`, and `type: 'task'` instead of `type: 'task_assigned'`_
    - _Expected_Behavior: Notification.create is called with `receiver` field and `type: 'task_assigned'`, document passes Mongoose validation and is saved_
    - _Preservation: `approveTask`, `rejectTask`, `markNotCompleted`, `completeTask`, `addComment` already use `receiver` — MUST NOT be changed_
    - _Requirements: 2.1, 2.2, 3.1, 3.5_

  - [ ] 3.2 Verify bug condition exploration test (Group A) now passes
    - **Property 1: Expected Behavior** - Notification Field Fixed in createTask
    - **IMPORTANT**: Re-run the SAME test from task 1 (Group A section) — do NOT write a new test
    - Run the exploration test that asserts `Notification.create` uses `receiver` and `type: 'task_assigned'`
    - **EXPECTED OUTCOME**: Test PASSES (confirms Group A bug is fixed)
    - _Requirements: 2.1, 2.2_

  - [ ] 3.3 Verify preservation tests (Group A) still pass
    - **Property 2: Preservation** - Other Task Action Notifications Unchanged
    - **IMPORTANT**: Re-run the SAME preservation tests from task 2 — do NOT write new tests
    - Run preservation tests for `approveTask`, `rejectTask`, `markNotCompleted`, `completeTask`, `addComment` notification calls
    - **EXPECTED OUTCOME**: All tests PASS (confirms no regressions in other notification calls)

- [ ] 4. Fix Group B — Admin sidebar navigation

  - [ ] 4.1 Fix Activity Logs href, icon, and add Calendar entry in `app/(admin)/adminzenfix/(dashboard)/layout.tsx`
    - Add `Activity` to the lucide-react import list (import alongside existing `Calendar`, `Bell`, etc.)
    - In `adminNavigation`, find the entry `{ name: 'Activity Logs', href: '/adminzenfix/activity', icon: Bell }`
    - Change `href` to `'/adminzenfix/activity-logs'`
    - Change `icon` to `Activity`
    - Insert a new entry `{ name: 'Calendar', href: '/adminzenfix/calendar', icon: Calendar }` after the Analytics entry in the array
    - Verify `workerNavigation` and `managerNavigation` arrays are NOT modified
    - _Bug_Condition: isBugCondition_B — Activity Logs href is `/adminzenfix/activity` and Calendar entry is absent_
    - _Expected_Behavior: Activity Logs resolves to `/adminzenfix/activity-logs`, Calendar entry navigates to `/adminzenfix/calendar`_
    - _Preservation: All existing nav entries for Dashboard, Users, Managers, Workers, Tasks, Reports, Analytics, Settings, Notifications, Profile must retain their original href and icon_
    - _Requirements: 2.3, 2.4, 3.2, 3.3, 3.8_

  - [ ] 4.2 Verify bug condition exploration test (Group B) now passes
    - **Property 1: Expected Behavior** - Sidebar Navigation Fixed
    - Re-run the Group B exploration tests from task 1
    - **EXPECTED OUTCOME**: Tests PASS (Activity Logs href is correct and Calendar entry exists)
    - _Requirements: 2.3, 2.4_

  - [ ] 4.3 Verify preservation tests (Group B) still pass
    - **Property 2: Preservation** - Navigation Entries Unchanged
    - Re-run worker nav, manager nav, and existing admin nav preservation tests from task 2
    - **EXPECTED OUTCOME**: All tests PASS (no existing nav entries were altered)

- [ ] 5. Fix Group C — Invalid Tailwind v4 CSS classes

  - [ ] 5.1 Replace invalid classes in `app/(admin)/adminzenfix/(dashboard)/reports/page.tsx`
    - Replace all occurrences: `from-electric-cyan`→`from-cyan-500`, `to-purple`→`to-purple-600`, `border-electric-cyan`→`border-cyan-400`, `bg-surface/50`→`bg-slate-800/50`, `text-electric-cyan`→`text-cyan-400`, `bg-electric-cyan/20`→`bg-cyan-500/20`, `text-purple`→`text-violet-500`, `bg-purple/20`→`bg-violet-500/20`
    - Add "Export PDF" button next to the existing CSV export button (calls `window.print()`)
    - Add `<style media="print">` block hiding nav elements and buttons during print
    - _Bug_Condition: isBugCondition_C — invalid Tailwind v4 utility classes present in JSX_
    - _Expected_Behavior: All gradient, border, background, and text classes render correctly using standard Tailwind v4 palette_
    - _Preservation: Valid classes like `bg-slate-900`, `text-white`, `border-white/10`, `from-cyan-500`, `to-purple-600`, `glass-card` must remain unchanged_
    - _Requirements: 2.5, 2.6, 2.7, 2.8, 3.4, 3.9_

  - [ ] 5.2 Replace invalid classes in `app/(admin)/adminzenfix/(dashboard)/tasks/page.tsx`
    - Apply the same class substitution map as step 5.1
    - Add `'overdue'` to the filter tabs array
    - When `filter === 'overdue'`, fetch all tasks and client-side filter: `task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed'`
    - Change `canCreateTask` check from `userRole === 'admin'` to `['admin', 'manager'].includes(userRole)`
    - _Bug_Condition: isBugCondition_C — invalid Tailwind v4 classes in tasks list page_
    - _Requirements: 2.5, 2.6, 2.7, 2.8, 3.4_

  - [ ] 5.3 Replace invalid classes in `app/(admin)/adminzenfix/(dashboard)/tasks/[id]/page.tsx`
    - Apply the same class substitution map as step 5.1 (this file is also modified in task 6 for the completion modal — coordinate carefully)
    - _Bug_Condition: isBugCondition_C — invalid Tailwind v4 classes in task detail page_
    - _Requirements: 2.5, 2.6, 2.7, 2.8, 3.4_

  - [ ] 5.4 Replace invalid classes in `app/(admin)/adminzenfix/(dashboard)/users/page.tsx`
    - Apply the same class substitution map as step 5.1 (this file is also modified in task 7 for the dropdown — coordinate carefully)
    - _Bug_Condition: isBugCondition_C — invalid Tailwind v4 classes in users list page_
    - _Requirements: 2.5, 2.6, 2.7, 2.8, 3.4_

  - [ ] 5.5 Replace invalid classes in `app/(admin)/adminzenfix/(dashboard)/users/create/page.tsx`
    - Apply the same class substitution map as step 5.1
    - _Bug_Condition: isBugCondition_C — invalid Tailwind v4 classes in create user page_
    - _Requirements: 2.5, 2.6, 2.7, 2.8, 3.4_

  - [ ] 5.6 Replace invalid classes in `app/(admin)/adminzenfix/(dashboard)/activity-logs/page.tsx`
    - Apply the same class substitution map as step 5.1 (paying attention to `bg-surface/50` on inputs/selects)
    - _Bug_Condition: isBugCondition_C — invalid Tailwind v4 classes in activity logs page_
    - _Requirements: 2.5, 2.6, 2.7, 2.8, 3.4_

  - [ ] 5.7 Check and fix remaining pages for any invalid class occurrences
    - Check `app/(admin)/adminzenfix/(dashboard)/tasks/create/page.tsx` — replace any `from-electric-cyan`, `to-purple`, `border-electric-cyan`, `bg-surface` occurrences
    - Check `app/(admin)/adminzenfix/(dashboard)/users/managers/page.tsx` — same substitutions
    - Check `app/(admin)/adminzenfix/(dashboard)/users/workers/page.tsx` — same substitutions
    - Check `app/(admin)/adminzenfix/(dashboard)/settings/page.tsx` — same substitutions
    - Check `app/(admin)/adminzenfix/(dashboard)/profile/page.tsx` — same substitutions
    - _Requirements: 2.5, 2.6, 2.7, 2.8, 3.4_

  - [ ] 5.8 Verify bug condition exploration tests (Group C) now pass
    - **Property 1: Expected Behavior** - No Invalid Tailwind v4 Classes Remain
    - Re-run the Group C exploration tests from task 1
    - **EXPECTED OUTCOME**: Tests PASS (no invalid class names appear in any affected file)
    - _Requirements: 2.5, 2.6, 2.7, 2.8_

  - [ ] 5.9 Verify preservation tests (Group C) still pass
    - **Property 2: Preservation** - Valid CSS Classes Still Present
    - Re-run the CSS preservation tests from task 2 (check `bg-slate-900`, `text-white`, `from-cyan-500`, `glass-card`, etc.)
    - **EXPECTED OUTCOME**: All tests PASS (valid classes are untouched)

- [ ] 6. Fix Group D — Task completion notes modal in `app/(admin)/adminzenfix/(dashboard)/tasks/[id]/page.tsx`

  - [ ] 6.1 Add completion notes modal state and refactor `handleCompleteTask`
    - Add state: `const [showCompleteModal, setShowCompleteModal] = useState(false)`
    - Add state: `const [completionNotes, setCompletionNotes] = useState('')`
    - Refactor `handleCompleteTask` to read from `completionNotes` state instead of hardcoded string:
      ```ts
      formData.append('completionNotes', completionNotes);
      ```
    - After success: call `setShowCompleteModal(false)` and `setCompletionNotes('')`
    - Change the "Complete Task" button `onClick` to `() => setShowCompleteModal(true)` instead of calling `handleCompleteTask` directly
    - _Bug_Condition: isBugCondition_D — `handleCompleteTask` appends `'Task completed successfully'` as hardcoded string; no modal exists_
    - _Expected_Behavior: Modal appears on click; `completionNotes` state value (which may be empty) is submitted; DB stores user-provided text_
    - _Preservation: The `completeTask` server action interface is unchanged; other task action buttons (Start, Cannot Complete, Approve, Reject, Add Comment) are unaffected_
    - _Requirements: 2.9, 3.10_

  - [ ] 6.2 Add completion modal JSX (matching existing `showNotCompletedModal` pattern)
    - Add a modal overlay (same structure as `showNotCompletedModal`) rendered when `showCompleteModal === true`:
      - Title: "Task Completion Notes"
      - Textarea with `placeholder="Describe what was accomplished..."` bound to `completionNotes` state (optional, no minimum length)
      - "Submit" button: `onClick={handleCompleteTask}`, disabled when `actionLoading === true`
      - "Cancel" button: `onClick={() => { setShowCompleteModal(false); setCompletionNotes(''); }}`
    - _Requirements: 2.9_

  - [ ] 6.3 Verify bug condition exploration test (Group D) now passes
    - **Property 1: Expected Behavior** - Completion Notes Modal Functional
    - Re-run the Group D exploration tests from task 1
    - **EXPECTED OUTCOME**: Tests PASS (no hardcoded string; modal state exists; user-provided value is submitted)
    - _Requirements: 2.9_

  - [ ] 6.4 Verify preservation tests (Group D) still pass
    - **Property 2: Preservation** - Task Detail Page Non-Complete Actions Unchanged
    - Re-run preservation tests confirming Start, Cannot Complete, Approve, Reject, Add Comment buttons remain functional
    - **EXPECTED OUTCOME**: All tests PASS

- [ ] 7. Fix Group E1 — Add PATCH handler to `app/api/users/[id]/route.ts`

  - [ ] 7.1 Implement the PATCH export function
    - Import `ActivityLog` model (alongside existing imports for `User`, `auth`, `connectDB`, `NextResponse`)
    - Add `export async function PATCH(request, { params })` after the existing DELETE handler
    - Require admin session (return 401 if not admin)
    - Call `connectDB()` and `await params` to get `id`
    - Parse request body; whitelist fields: `status`, `role`, `department`, `name`, `phone`
    - Call `User.findByIdAndUpdate(id, allowedUpdates, { new: true })`; return 404 if not found
    - Create `ActivityLog` entry with `action: 'user_updated'`, `entity: 'user'`, `entityId: id`, `details: allowedUpdates`
    - Return `{ user }` with HTTP 200
    - Verify DELETE handler is NOT modified
    - _Bug_Condition: isBugCondition_E1 — PATCH request to `/api/users/[id]` returns 405 (no handler exists)_
    - _Expected_Behavior: Admin PATCH with valid body returns 200 with updated user; ActivityLog entry is created_
    - _Preservation: DELETE handler continues to work exactly as before_
    - _Requirements: 2.10, 3.6_

  - [ ] 7.2 Verify bug condition exploration test (Group E1) now passes
    - **Property 1: Expected Behavior** - PATCH Handler Responds Correctly
    - Re-run the Group E1 exploration test from task 1
    - **EXPECTED OUTCOME**: Test PASSES (PATCH export exists and responds with 200)
    - _Requirements: 2.10_

  - [ ] 7.3 Verify preservation tests (Group E1) still pass
    - **Property 2: Preservation** - DELETE Handler Unchanged
    - Re-run the DELETE preservation test from task 2
    - **EXPECTED OUTCOME**: Test PASSES (DELETE still works correctly)

- [ ] 8. Fix Group E2 — Add search filtering to `app/api/activity-logs/route.ts`

  - [ ] 8.1 Implement search filtering on the populated logs array
    - After the existing fetch and populate step, extract `search` from `searchParams`:
      ```ts
      const search = searchParams.get('search');
      ```
    - After populating, filter in JS:
      ```ts
      let result = logs;
      if (search) {
        const lower = search.toLowerCase();
        result = logs.filter(log =>
          (log.user?.name?.toLowerCase().includes(lower)) ||
          log.action.toLowerCase().includes(lower)
        );
      }
      return NextResponse.json({ logs: result });
      ```
    - Verify the un-filtered code path (no `search` param) is not changed — return all logs as before
    - _Bug_Condition: isBugCondition_E2 — GET `/api/activity-logs?search=X` returns all logs regardless of X_
    - _Expected_Behavior: Case-insensitive filter on `log.user.name` and `log.action`; empty `search` or absent param returns all logs_
    - _Preservation: GET without `search` param continues to return all logs (admin sees all; non-admin sees own)_
    - _Requirements: 2.11, 3.7_

  - [ ] 8.2 Verify bug condition exploration test (Group E2) now passes
    - **Property 1: Expected Behavior** - Activity Logs Search Filters Results
    - Re-run the Group E2 exploration test from task 1
    - **EXPECTED OUTCOME**: Test PASSES (`search=nonexistent` returns 0 results; `search=` known action returns only matching entries)
    - _Requirements: 2.11_

  - [ ] 8.3 Verify preservation tests (Group E2) still pass
    - **Property 2: Preservation** - Activity Logs Without Search Unchanged
    - Re-run the activity logs no-search preservation test from task 2
    - **EXPECTED OUTCOME**: Test PASSES (all logs still returned when no search param is present)

- [ ] 9. Fix Group F — Functional user actions dropdown in `app/(admin)/adminzenfix/(dashboard)/users/page.tsx`

  - [ ] 9.1 Add dropdown state, ref, and click-outside handler
    - Add `import { useRef, useEffect } from 'react'` if not already imported (or add `useRef`, `useEffect` to existing React import)
    - Add state: `const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)`
    - Add ref: `const dropdownRef = useRef<HTMLDivElement>(null)`
    - Add `useEffect` that registers a `mousedown` event listener on `document`; when the click target is outside `dropdownRef`, call `setOpenDropdownId(null)`; return cleanup
    - _Bug_Condition: isBugCondition_F — MoreVertical button has no onClick; `openDropdownId` state does not exist; no dropdown is rendered_
    - _Requirements: 2.12_

  - [ ] 9.2 Replace inert MoreVertical button with toggle button and render dropdown menu
    - Replace the inert `<Button variant="ghost" size="icon">` in the Actions column with a button that calls `setOpenDropdownId(openDropdownId === user._id ? null : user._id)`
    - Wrap the button and dropdown in a `relative` positioned container with `ref={dropdownRef}` (or per-row ref scoping)
    - Render an absolutely-positioned dropdown panel when `openDropdownId === user._id` containing:
      - **Activate** — calls `PATCH /api/users/${user._id}` with `{ status: 'active' }`
      - **Suspend** — calls `PATCH /api/users/${user._id}` with `{ status: 'suspended' }`
      - **Make Worker** — calls `PATCH /api/users/${user._id}` with `{ role: 'worker' }`
      - **Make Manager** — calls `PATCH /api/users/${user._id}` with `{ role: 'manager' }`
      - **Delete** — `window.confirm('Delete user?')` then calls `DELETE /api/users/${user._id}`
    - After any successful action: `setOpenDropdownId(null)` and call `fetchUsers()`
    - Show `toast.success` / `toast.error` feedback for each action
    - _Expected_Behavior: Click ⋮ toggles dropdown; selecting any option calls the correct API; table re-renders; toast confirms outcome_
    - _Preservation: Existing user table columns, sorting, filtering, and pagination must remain unaffected_
    - _Requirements: 2.12, 3.6_

  - [ ] 9.3 Verify bug condition exploration test (Group F) now passes
    - **Property 1: Expected Behavior** - Users Table Dropdown Is Functional
    - Re-run the Group F exploration test from task 1
    - **EXPECTED OUTCOME**: Test PASSES (`openDropdownId` state exists; MoreVertical button has onClick; dropdown renders on click)
    - _Requirements: 2.12_

  - [ ] 9.4 Verify preservation tests (Group F) still pass
    - **Property 2: Preservation** - Users Table Core Behavior Unchanged
    - Re-run user table preservation tests from task 2 (fetch, display, filter)
    - **EXPECTED OUTCOME**: All tests PASS

- [ ] 10. Add advanced features — Dashboard auto-refresh and activity summary

  - [ ] 10.1 Add 30-second auto-refresh to `app/(admin)/adminzenfix/(dashboard)/dashboard/page.tsx`
    - Inside the existing `useEffect` that calls `fetchDashboardData()`, add:
      ```ts
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
      ```
    - Ensure the interval is cleared on component unmount
    - _Requirements: 2.1 (advanced feature — no direct bug requirement, enhances UX)_

  - [ ] 10.2 Add admin-only "Recent Activity" section to `app/(admin)/adminzenfix/(dashboard)/dashboard/page.tsx`
    - Add `recentActivity` state: `const [recentActivity, setRecentActivity] = useState([])`
    - In `fetchDashboardData`, if `userRole === 'admin'`, also fetch `GET /api/activity-logs?limit=5` and set `recentActivity`
    - Render a "Recent Activity" section below the stats grid, shown only when `userRole === 'admin'`
    - Each entry displays: an icon based on the `action` value, the action label, the user name (`log.user?.name`), and a formatted timestamp
    - _Requirements: 2.1 (advanced feature)_

- [ ] 11. Checkpoint — Ensure all tests pass
  - Re-run the full exploration test suite (Property 1 tests) — all should now PASS
  - Re-run the full preservation test suite (Property 2 tests) — all should still PASS
  - Verify the application builds without TypeScript errors: `npm run build` (or `next build`)
  - Verify no linting errors: `npm run lint` (if configured)
  - Confirm each bug group is resolved by walking through each scenario:
    - Create a task and verify a notification is saved with `receiver` in MongoDB
    - Click "Activity Logs" in admin sidebar — confirm `/adminzenfix/activity-logs` loads
    - Click "Calendar" in admin sidebar — confirm `/adminzenfix/calendar` loads
    - Visit reports page and tasks page — confirm gradient buttons and spinners render correctly
    - Click "Complete Task" — confirm modal appears, notes input is present, submission uses entered text
    - Call PATCH `/api/users/[id]` — confirm 200 response and user is updated
    - Search activity logs — confirm filtered results match the search term
    - Click ⋮ in users table — confirm dropdown appears with action options
  - Ensure all tests pass; ask the user if any questions arise
