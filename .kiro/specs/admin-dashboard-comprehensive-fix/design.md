# Admin Dashboard Comprehensive Fix — Bugfix Design

## Overview

The ZenFix admin dashboard has six confirmed bug groups plus missing advanced features. The bugs range from silent data-loss (wrong field name in a Mongoose create call) to broken navigation (wrong href), invalid Tailwind v4 utility classes causing un-styled UI elements, a hardcoded string preventing real task completion notes, two missing API endpoints, and a completely non-functional user-actions dropdown. Advanced features (auto-refresh, overdue filter, PDF export, activity strip) are also missing.

The fix is targeted: each change is scoped to the minimal set of lines required. No existing models, auth logic, or passing navigation entries are touched.

---

## Glossary

- **Bug_Condition (C)**: The set of inputs and code paths that trigger one of the confirmed bugs — e.g., calling `createTask` with a valid payload (triggers the `recipient` field bug), or requesting a page that uses `from-electric-cyan` (triggers the invalid CSS class bug).
- **Property (P)**: The desired correct behavior for each buggy code path — notifications are saved, navigation resolves, styles render, notes are user-supplied, APIs respond, dropdown works.
- **Preservation**: All existing behavior that must remain unchanged after the fix — other notification calls using `receiver`, worker/manager navigation, valid Tailwind classes already in use, passing API endpoints (DELETE /api/users/[id]), task actions, etc.
- **`createTask`**: Server action in `lib/actions/task.ts` that creates a Task document, then creates a Notification document for the assigned worker. Currently uses `recipient` instead of `receiver`.
- **`adminNavigation`**: Array in `app/(admin)/adminzenfix/(dashboard)/layout.tsx` that drives the sidebar links shown to admin users. Currently has the wrong href for Activity Logs and is missing the Calendar entry.
- **`electric-cyan` / `purple` utilities**: Tailwind utility class suffixes (e.g., `text-electric-cyan`, `from-electric-cyan`, `to-purple`) that appear in several admin pages. These correspond to `@theme inline` CSS variables (`--color-electric-cyan`, `--color-purple`) in `globals.css`. Tailwind v4 generates utilities from these variables, but the `bg-surface/50` opacity variant does NOT work because `surface` is not a registered Tailwind color in the standard way. The safe replacement is standard Tailwind palette values (`cyan-400`, `cyan-500`, `violet-500`, `slate-800`).
- **`handleCompleteTask`**: Function in `tasks/[id]/page.tsx` that hard-codes `completionNotes: "Task completed successfully"` instead of accepting user input.
- **PATCH /api/users/[id]**: Missing HTTP method handler. Only DELETE exists currently.
- **Activity logs search**: The `search` query param sent by the activity-logs page is received but silently ignored by the API route handler.
- **MoreVertical dropdown**: The `<Button variant="ghost" size="icon">` in the users table Actions column has no `onClick`, no state, and no menu — it is completely inert.

---

## Bug Details

### Bug Condition

Each bug group has its own triggering condition.

**Group A — Notification Field Mismatch**

```
FUNCTION isBugCondition_A(serverAction, notificationPayload)
  INPUT: serverAction = name of the action being called
         notificationPayload = object passed to Notification.create()
  OUTPUT: boolean

  RETURN serverAction = "createTask"
         AND notificationPayload has key "recipient"
         AND notificationPayload does NOT have key "receiver"
END FUNCTION
```

**Group B — Sidebar Navigation Broken**

```
FUNCTION isBugCondition_B(navEntry)
  INPUT: navEntry = one item from adminNavigation array
  OUTPUT: boolean

  RETURN (navEntry.name = "Activity Logs" AND navEntry.href = "/adminzenfix/activity")
         OR (adminNavigation does NOT contain entry with name = "Calendar")
END FUNCTION
```

**Group C — Invalid Tailwind v4 CSS Classes**

```
FUNCTION isBugCondition_C(cssClass)
  INPUT: cssClass = a Tailwind utility class string used in JSX
  OUTPUT: boolean

  RETURN cssClass IN [
    "from-electric-cyan", "to-purple", "border-electric-cyan",
    "bg-surface/50", "text-electric-cyan", "bg-electric-cyan/20",
    "text-purple", "bg-purple/20"
  ]
END FUNCTION
```

**Group D — Hardcoded Completion Notes**

```
FUNCTION isBugCondition_D(formDataValue)
  INPUT: formDataValue = value of "completionNotes" appended to FormData
                         in handleCompleteTask()
  OUTPUT: boolean

  RETURN formDataValue = "Task completed successfully"
         AND value was NOT entered by the user
END FUNCTION
```

**Group E1 — Missing PATCH /api/users/[id]**

```
FUNCTION isBugCondition_E1(request)
  INPUT: request = HTTP request to /api/users/[id]
  OUTPUT: boolean

  RETURN request.method = "PATCH"
         AND no PATCH handler exists in route.ts
END FUNCTION
```

**Group E2 — Activity Logs Search Ignored**

```
FUNCTION isBugCondition_E2(request)
  INPUT: request = GET /api/activity-logs?search=...
  OUTPUT: boolean

  RETURN request.searchParams.has("search")
         AND route handler does NOT filter by search value
END FUNCTION
```

**Group F — User Actions Dropdown Inert**

```
FUNCTION isBugCondition_F(buttonEvent)
  INPUT: buttonEvent = click on MoreVertical button in users table
  OUTPUT: boolean

  RETURN button has no onClick handler
         AND no dropdown state exists
         AND no menu is rendered
END FUNCTION
```

### Examples

- **A**: `createTask("Fix login bug", workerId)` → Notification.create is called with `{ recipient: workerId, ... }` → Mongoose throws validation error (required field `receiver` missing) → notification silently fails; worker never sees the assignment notification.
- **B**: Admin clicks "Activity Logs" in sidebar → navigates to `/adminzenfix/activity` → Next.js 404 page. Admin also cannot find Calendar in the sidebar because the entry is absent.
- **C**: `<Button className="bg-gradient-to-r from-electric-cyan to-purple">` → gradient does not render; button appears unstyled. `border-electric-cyan` → spinner border has no color. `bg-surface/50` → input has no background.
- **D**: Worker clicks "Complete Task" → `formData.append('completionNotes', 'Task completed successfully')` → database stores `"Task completed successfully"` regardless of what actually happened; completion notes are meaningless.
- **E1**: Admin UI (once dropdown is fixed) calls `PATCH /api/users/someId` → 405 Method Not Allowed → user status/role cannot be changed.
- **E2**: Activity logs page sends `?search=john` → API returns all logs unfiltered → admin cannot search logs by user name or action.
- **F**: Admin clicks ⋮ next to any user → nothing happens → edit/delete/status-change is inaccessible from the UI.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `approveTask`, `rejectTask`, `markNotCompleted`, `completeTask`, and `addComment` all already use `receiver` in their `Notification.create` calls — these MUST remain unchanged.
- Worker sidebar navigation (Dashboard, My Tasks, Calendar, Notifications, Profile) must continue to work.
- Manager sidebar navigation (Dashboard, Tasks, Assign Tasks, Calendar, Reports, Notifications, Profile) must continue to work.
- All admin navigation entries that are currently correct (Dashboard, Users, Managers, Workers, Tasks, Reports, Analytics, Settings, Notifications, Profile) must continue to work.
- All valid Tailwind utility classes already in use (`bg-slate-900`, `text-white`, `border-white/10`, `text-cyan-400`, `bg-green-500/20`, `from-cyan-500`, `to-purple-600`, etc.) must continue to render correctly.
- `DELETE /api/users/[id]` must continue to work exactly as before.
- `GET /api/activity-logs` without a `search` param must continue to return all logs (admin sees all; non-admin sees own).
- `glass-card` CSS class must continue to render correctly.
- Task detail page's load, display, and all non-Complete actions (Start, Cannot Complete, Approve, Reject, Add Comment) must continue to work.
- The `handleCompleteTask` function signature and the `completeTask` server action interface must remain backward-compatible.

**Scope:**
Inputs that do NOT trigger any bug condition above are completely unaffected. The fix changes at most one field name (A), two nav entries (B), a targeted set of CSS class names (C), one UI interaction pattern (D), adds one new handler (E1), adds one filter step (E2), and adds state + JSX for the dropdown (F).

---

## Hypothesized Root Cause

**Group A** — Copy-paste inconsistency. The `createTask` notification was likely written at a different time or by a different developer than the other notification calls. All other calls in the file use `receiver`; only `createTask` uses `recipient`. The Notification model has never had a `recipient` field.

**Group B** — Typo in the href value (`/activity` instead of `/activity-logs`), and the Calendar entry was simply never added to `adminNavigation` when it was added to `workerNavigation` and `managerNavigation`.

**Group C** — These class names were likely copied from a Tailwind v3 project where custom colors were configured in `tailwind.config.js` and generated utility classes automatically. In Tailwind v4, colors declared under `@theme inline` as CSS variables do generate utilities, but the opacity modifier syntax (`/50`) only works for colors registered via the new config API — `bg-surface/50` fails because `surface` is not in the default Tailwind palette. Additionally, there may be a naming conflict: Tailwind v4 may not correctly resolve `from-electric-cyan` as a gradient stop. The safest fix is to replace all custom-color utilities with standard Tailwind v4 palette classes that visually match.

**Group D** — The "Complete Task" flow was prototyped quickly with a hardcoded placeholder and the modal/input step was never implemented, unlike the "Cannot Complete" flow which already has a full modal with a textarea.

**Group E1** — The `/api/users/[id]` route was created with only a DELETE handler when initially scaffolded. The PATCH handler was never written.

**Group E2** — The activity-logs route was written to handle `action` and `entity` filters but the `search` parameter was planned and wired in the frontend without being implemented in the backend.

**Group F** — The MoreVertical button was added as a visual placeholder. No click handler, state variable, or dropdown component was ever attached to it.

---

## Correctness Properties

Property 1: Bug Condition A — Notification Field Consistency

_For any_ call to `createTask` with a valid task payload and an existing assignee user ID, the fixed `createTask` server action SHALL call `Notification.create` with `receiver` (not `recipient`) as the field name, so the notification passes Mongoose schema validation and is persisted to the database.

**Validates: Requirements 2.1, 2.2**

Property 2: Bug Condition B — Admin Sidebar Navigation Resolution

_For any_ admin user who clicks "Activity Logs" or "Calendar" in the sidebar, the fixed `adminNavigation` array SHALL resolve to `/adminzenfix/activity-logs` and `/adminzenfix/calendar` respectively, loading the correct pages without 404 errors.

**Validates: Requirements 2.3, 2.4**

Property 3: Bug Condition C — Valid Tailwind v4 Utility Classes

_For any_ JSX element in the affected pages that previously used an invalid Tailwind v4 utility class (`from-electric-cyan`, `to-purple`, `border-electric-cyan`, `bg-surface/50`, `text-electric-cyan`, `bg-electric-cyan/20`, `text-purple`, `bg-purple/20`), the fixed code SHALL use a valid Tailwind v4 utility class that produces the intended visual result (gradient, border color, background, or text color).

**Validates: Requirements 2.5, 2.6, 2.7, 2.8**

Property 4: Bug Condition D — User-Provided Completion Notes

_For any_ worker who clicks "Complete Task" and submits the completion modal, the fixed `handleCompleteTask` function SHALL submit the user-entered notes string (which may be empty) as `completionNotes`, never submitting the hardcoded string `"Task completed successfully"`.

**Validates: Requirement 2.9**

Property 5: Bug Condition E1 — PATCH /api/users/[id] Responds

_For any_ authenticated admin PATCH request to `/api/users/[id]` with a valid body containing `status`, `role`, `department`, `name`, or `phone`, the fixed route SHALL update the user document in MongoDB, log the activity, and return the updated user with HTTP 200.

**Validates: Requirement 2.10**

Property 6: Bug Condition E2 — Activity Logs Search Filters Results

_For any_ GET request to `/api/activity-logs?search=X` where X is a non-empty string, the fixed handler SHALL return only log entries where the populated user's `name` contains X (case-insensitive) OR the `action` field contains X (case-insensitive).

**Validates: Requirement 2.11**

Property 7: Bug Condition F — Users Table Dropdown Is Functional

_For any_ admin click on the MoreVertical button in the users table, the fixed component SHALL toggle a dropdown menu containing "Edit Status", "Change Role", and "Delete" options. Selecting a status/role option SHALL call `PATCH /api/users/[id]` and re-fetch the users list. Selecting "Delete" SHALL prompt for confirmation, call `DELETE /api/users/[id]`, and re-fetch.

**Validates: Requirement 2.12**

Property 8: Preservation — All Non-Buggy Behaviors Unchanged

_For any_ input that does NOT trigger one of the bug conditions above (C(X) is false), the fixed codebase SHALL produce exactly the same behavior as the original codebase — existing notification calls using `receiver`, worker/manager sidebar navigation, valid Tailwind classes, task action functions, DELETE user endpoint, activity logs without search param, and `glass-card` styling all remain unaffected.

**Validates: Requirements 3.1–3.10**

---

## Fix Implementation

### Changes Required

#### File: `lib/actions/task.ts`

**Function**: `createTask`

**Change 1 — Rename `recipient` to `receiver`**:
In the `Notification.create` call inside `createTask`, change:
```ts
// BEFORE (buggy)
await Notification.create({
  recipient: validatedFields.data.assignedTo,
  title: 'New Task Assigned',
  message: `You have been assigned a new task: ${validatedFields.data.title}`,
  type: 'task',
  read: false,
});

// AFTER (fixed)
await Notification.create({
  receiver: validatedFields.data.assignedTo,
  title: 'New Task Assigned',
  message: `You have been assigned a new task: ${validatedFields.data.title}`,
  type: 'task_assigned',
  read: false,
});
```
Note: `type: 'task'` is also invalid per the Notification schema enum — it should be `'task_assigned'`.

---

#### File: `app/(admin)/adminzenfix/(dashboard)/layout.tsx`

**Change 2 — Fix Activity Logs href and add Calendar + Activity icon**:

1. Add `Activity` to the lucide-react import list.
2. In `adminNavigation`, change the Activity Logs entry:
   - `href: '/adminzenfix/activity'` → `href: '/adminzenfix/activity-logs'`
   - `icon: Bell` → `icon: Activity`
3. Insert a Calendar entry after Analytics:
   ```ts
   { name: 'Calendar', href: '/adminzenfix/calendar', icon: Calendar },
   ```
   (`Calendar` is already imported.)

---

#### Files with invalid Tailwind v4 CSS classes

Apply the following class substitutions globally across all affected files:

| Invalid class | Replacement |
|---|---|
| `from-electric-cyan` | `from-cyan-500` |
| `to-purple` | `to-purple-600` |
| `border-electric-cyan` | `border-cyan-400` |
| `bg-surface/50` | `bg-slate-800/50` |
| `text-electric-cyan` | `text-cyan-400` |
| `bg-electric-cyan/20` | `bg-cyan-500/20` |
| `text-purple` | `text-violet-500` |
| `bg-purple/20` | `bg-violet-500/20` |

Affected files:
- `app/(admin)/adminzenfix/(dashboard)/reports/page.tsx`
- `app/(admin)/adminzenfix/(dashboard)/tasks/page.tsx`
- `app/(admin)/adminzenfix/(dashboard)/tasks/[id]/page.tsx`
- `app/(admin)/adminzenfix/(dashboard)/users/page.tsx`
- `app/(admin)/adminzenfix/(dashboard)/users/create/page.tsx`
- `app/(admin)/adminzenfix/(dashboard)/activity-logs/page.tsx`

---

#### File: `app/(admin)/adminzenfix/(dashboard)/tasks/[id]/page.tsx`

**Change 4 — Completion notes modal (Bug Group D)**:

1. Add state variables:
   ```ts
   const [showCompleteModal, setShowCompleteModal] = useState(false);
   const [completionNotes, setCompletionNotes] = useState('');
   ```

2. Change the "Complete Task" button to open the modal instead of directly calling `handleCompleteTask`.

3. Refactor `handleCompleteTask` to read from `completionNotes` state:
   ```ts
   const handleCompleteTask = async () => {
     const formData = new FormData();
     formData.append('completionNotes', completionNotes);  // user-provided
     setActionLoading(true);
     try {
       const result = await completeTask(params.id as string, formData);
       if (result.error) {
         toast.error(result.error);
       } else {
         toast.success('Task marked as completed');
         setShowCompleteModal(false);
         setCompletionNotes('');
         fetchTask();
       }
     } catch (error) {
       toast.error('An error occurred');
     } finally {
       setActionLoading(false);
     }
   };
   ```

4. Add a completion modal JSX block (styled to match the existing `showNotCompletedModal` pattern):
   - Textarea for completion notes (optional, no minimum length)
   - "Submit" button (calls `handleCompleteTask`)
   - "Cancel" button (closes modal, resets notes)

---

#### File: `app/api/users/[id]/route.ts`

**Change 5 — Add PATCH handler (Bug Group E1)**:

```ts
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { status, role, department, name, phone } = body;

    const allowedUpdates: Record<string, any> = {};
    if (status !== undefined) allowedUpdates.status = status;
    if (role !== undefined) allowedUpdates.role = role;
    if (department !== undefined) allowedUpdates.department = department;
    if (name !== undefined) allowedUpdates.name = name;
    if (phone !== undefined) allowedUpdates.phone = phone;

    const user = await User.findByIdAndUpdate(id, allowedUpdates, { new: true });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await ActivityLog.create({
      user: (session.user as any).id,
      action: 'user_updated',
      entity: 'user',
      entityId: id,
      details: allowedUpdates,
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

#### File: `app/api/activity-logs/route.ts`

**Change 6 — Filter by search param (Bug Group E2)**:

After fetching and populating logs, add:
```ts
const search = searchParams.get('search');
// ...existing fetch...
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

---

#### File: `app/(admin)/adminzenfix/(dashboard)/users/page.tsx`

**Change 7 — User actions dropdown (Bug Group F)**:

1. Add `openDropdownId` state: `const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)`.
2. Add `useRef` and a click-outside handler to close the dropdown when clicking elsewhere.
3. Replace the inert `<Button variant="ghost" size="icon">` with a dropdown-trigger button that toggles `openDropdownId`.
4. Render an absolutely-positioned dropdown panel when `openDropdownId === user._id` containing:
   - **Edit Status** sub-menu or inline select: active / inactive / suspended → calls `PATCH /api/users/[user._id]` with `{ status }`.
   - **Change Role** sub-menu or inline select: worker / manager / admin → calls `PATCH /api/users/[user._id]` with `{ role }`.
   - **Delete** option: `window.confirm()` → calls `DELETE /api/users/[user._id]`.
5. After any successful action, call `fetchUsers()` to re-render the table.

---

### Advanced Features

#### Dashboard Auto-Refresh (30s)
In `app/(admin)/adminzenfix/(dashboard)/dashboard/page.tsx`, add a `setInterval` inside `useEffect` that calls `fetchDashboardData()` every 30 000 ms. Clear the interval on cleanup.

#### Tasks Overdue Filter Tab
In `app/(admin)/adminzenfix/(dashboard)/tasks/page.tsx`:
- Add `'overdue'` to the filter tabs array.
- In `fetchTasks`, when `filter === 'overdue'`, fetch all non-completed tasks and filter client-side where `new Date(task.deadline) < new Date()`.

#### Export PDF (Reports Page)
In `app/(admin)/adminzenfix/(dashboard)/reports/page.tsx`:
- Add a "Export PDF" button that calls `window.print()`.
- Add `<style media="print">` block (or a `@media print` section) that hides navigation, filters, and buttons, and makes charts and tables print-friendly.

#### Activity Summary Strip (Dashboard — Admin Only)
In the dashboard page, for admin users only:
- Fetch `GET /api/activity-logs?limit=5` in `fetchDashboardData`.
- Render a "Last 5 Activities" section below the stats grid.

---

## Testing Strategy

### Validation Approach

Two-phase: first run exploratory tests on the **unfixed** code to confirm the root cause (they will fail in expected ways), then verify all properties hold on the **fixed** code and that preservation tests still pass.

---

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate each bug BEFORE the fix. Confirm root cause analysis. If a test does not fail as expected, we must re-hypothesize.

**Test Cases**:

1. **Group A — Notification field**: Call `createTask` with a mock Mongoose environment; assert that `Notification.create` was called with `receiver` field. On unfixed code this will fail — `recipient` is passed instead.

2. **Group B — Activity Logs href**: Assert that the `adminNavigation` array entry named `"Activity Logs"` has `href === "/adminzenfix/activity-logs"`. On unfixed code this fails (actual value is `"/adminzenfix/activity"`).

3. **Group B — Calendar entry**: Assert that `adminNavigation` contains an entry with `name === "Calendar"`. On unfixed code this fails (entry does not exist).

4. **Group C — CSS class validity**: For each invalid class listed in Bug Condition C, assert it does NOT appear in the compiled JSX of the affected pages. On unfixed code, all these classes appear.

5. **Group D — Hardcoded notes**: Call `handleCompleteTask` and capture the `FormData` value for key `"completionNotes"`. On unfixed code, the value is `"Task completed successfully"` regardless of any user input.

6. **Group E1 — Missing PATCH**: Send a PATCH request to `/api/users/[id]`; assert HTTP status is 200. On unfixed code, returns 405.

7. **Group E2 — Search ignored**: Call the activity-logs GET handler with `?search=nonexistent`, capture the returned logs, assert `logs.length === 0`. On unfixed code, all logs are returned.

8. **Group F — Dropdown state**: Assert that `openDropdownId` state exists in the users page component. On unfixed code, no such state exists.

**Expected Counterexamples**:
- Notification saved with `recipient` key → Mongoose validation error or missing `receiver` required field error.
- Navigation href mismatch → 404 on click.
- CSS classes present in JSX that Tailwind v4 cannot resolve → unstyled elements.
- FormData contains literal `"Task completed successfully"`.
- PATCH endpoint returns 405 Method Not Allowed.
- Search param is present in request but results are not filtered.
- MoreVertical button has no event handler.

---

### Fix Checking

**Goal**: Verify that for all inputs where a bug condition holds, the fixed code produces the expected behavior (Properties 1–7).

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition_X(input) DO
  result := fixedCode(input)
  ASSERT expectedBehavior_X(result)
END FOR
```

**Test Cases** (on fixed code):
1. `createTask` notification uses `receiver` → Notification.create receives correct field → document is saved.
2. `adminNavigation["Activity Logs"].href === "/adminzenfix/activity-logs"` → page loads.
3. `adminNavigation` contains `{ name: "Calendar", href: "/adminzenfix/calendar" }`.
4. No invalid CSS class names appear in any affected file's JSX.
5. Completion modal appears on click; FormData `completionNotes` equals the textarea value.
6. PATCH /api/users/[id] with `{ status: "inactive" }` returns 200 with updated user.
7. GET /api/activity-logs?search=nonexistent returns 0 results; ?search=task_created returns only task_created logs.
8. MoreVertical click shows dropdown; selecting "Delete" + confirm calls DELETE endpoint + re-fetches users.

---

### Preservation Checking

**Goal**: Verify that for all inputs where NO bug condition holds, the fixed code produces the same result as the original code (Property 8).

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT fixedCode(input) = originalCode(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended because:
- It generates many random notification payloads, nav entries, and CSS class strings to confirm only the targeted items are changed.
- It catches accidental regressions in unrelated code paths.
- It provides strong guarantees that the preservation scope is respected.

**Test Cases**:
1. **Notification preservation**: Call `approveTask`, `rejectTask`, `markNotCompleted`, `completeTask`, `addComment` — assert all still create notifications with `receiver` field intact.
2. **Worker nav preservation**: Assert all 5 `workerNavigation` entries are unchanged in href and icon.
3. **Manager nav preservation**: Assert all 7 `managerNavigation` entries are unchanged.
4. **Admin nav preservation**: Assert all existing admin nav entries (Dashboard, Users, Managers, Workers, Tasks, Reports, Analytics, Settings, Notifications, Profile) retain their original href and icon values.
5. **Valid CSS class preservation**: Assert that `bg-slate-900`, `text-white`, `border-white/10`, `from-cyan-500`, `to-purple-600`, `bg-green-500/20`, `text-cyan-400` still appear in the files where they already exist.
6. **DELETE user preservation**: Send DELETE to /api/users/[id] — assert 200 + activity log created (unchanged behavior).
7. **Activity logs no-search preservation**: GET /api/activity-logs without `search` param — assert all logs returned (admin session).
8. **Task actions preservation**: Call `startTask`, `approveTask`, `rejectTask` — assert they return `{ success: true }`.

---

### Unit Tests

- Test `createTask` with a spy on `Notification.create` — verify field name is `receiver`.
- Test `adminNavigation` array: correct href for Activity Logs, Calendar entry present, Activity icon used.
- Test `handleCompleteTask` with mocked `completeTask` server action — verify FormData contains user-provided string.
- Test PATCH handler in `/api/users/[id]` — valid admin session, various field combinations.
- Test activity-logs GET with `search` param — filtered results with mock populated logs.
- Test users page dropdown — `openDropdownId` toggles on click, closes on outside click.

### Property-Based Tests

- Generate random notification payloads for all task actions; verify `receiver` is always used (never `recipient`).
- Generate random navigation arrays; verify the fix changes exactly two entries and adds exactly one.
- Generate random search strings for activity logs; verify the filter is case-insensitive and matches both `user.name` and `action`.
- Generate random user objects; verify PATCH handler accepts only the allowed fields.
- Generate random FormData values (including empty string); verify `handleCompleteTask` always uses the provided value.

### Integration Tests

- Full task creation flow: create task → verify worker notification exists in DB with `receiver` field.
- Admin sidebar render: mount layout as admin → verify Activity Logs link href and Calendar link presence.
- Task completion flow: click "Complete Task" → modal appears → enter notes → submit → verify `completionNotes` in DB matches entered text.
- User management flow: open dropdown → change status → verify API called → table re-renders with new status.
- Activity logs search: search for a known user name → verify filtered results; search for unknown string → verify empty results.
