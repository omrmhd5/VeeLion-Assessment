# Code Review — VeeLion Frontend Assessment

This document captures findings from reviewing the Task Dashboard, Activity Feed, shared utilities, and API integration layer.

## Contents

### [Positive Findings](#positive-findings)

What the codebase already does well and should be kept during refactoring.

### [Refactoring Principles](#refactoring-principles)

Rules followed while improving the project without breaking existing behavior.

### [Findings to Address](#findings-to-address)

Issues grouped by impact — Performance, Maintainability, UX, Code Quality, and React Best Practices.

### [Future Recommendations](#future-recommendations)

Improvements deferred beyond this assessment scope.

### [Applied Fixes](#applied-fixes)

What was implemented and which findings each change resolves.

---

**How to read this doc**

- Each finding is listed under the category that best describes its **impact** (not always where the code lives).
- When multiple findings share the same fix, each stays separate. Headers list **all** earlier items in that fix group across the whole doc, plus the root — e.g. _(same fix as Performance #1, #2, #3, Maintainability #1, #2, UX #1, and React Best Practices #1)_.
- **API response shapes** (`GET /tasks` returns `{ data }`, `GET /activity` returns a raw array) match the provided backend and `docs/backend-endpoints.md`. The frontend correctly mirrors that contract in `backendApi.ts` — not treated as a finding here.

| Category                 | What belongs here                                        |
| ------------------------ | -------------------------------------------------------- |
| **Performance**          | Unnecessary re-renders, duplicate work, wasted cycles    |
| **Maintainability**      | Architecture, patterns, shared utilities, file structure |
| **UX**                   | Loading, errors, empty states, navigation, clarity       |
| **Code Quality**         | Naming, duplication, types, magic values, readability    |
| **React Best Practices** | State design, hooks, effects, component boundaries       |

---

## Positive Findings

- **Layered Tasks module** — thin page (`app/tasks/page.tsx`) → `TaskDashboard` → `TaskList` / `TaskItem` / `StatusFilter`.
- **`useTasks` hook** — encapsulates fetch, filter, update, loading, and error state with `useCallback` and `useMemo`.
- **`requestJson` helper** in `useTasks` — checks `response.ok` and parses `{ error: { message } }` consistently.
- **Loading, error, and retry UI** in `TaskDashboard` — user gets feedback when things go wrong.
- **Empty state** in `TaskList` when no tasks match the active filter.
- **API route proxies** under `app/api/*` — frontend talks to Next.js routes, which call `backendApi.ts`.
- **`backendApi.ts`** — centralizes backend URL and error parsing for server-side fetches.
- **TypeScript types** in `types/api.ts` — `Task`, `ActivityLog`, and response wrappers are defined.
- **Accessibility basics in Tasks** — `aria-label` on task list, `aria-pressed` on filter buttons, `aria-label` on toggle buttons in `TaskItem`.
- **CSS variables** in `globals.css` — consistent tokens for colors, radius, and spacing.

---

## Refactoring Principles

- **Do not rewrite everything from scratch** — extend existing patterns.
- **Maintain existing functionality** — current pages and flows must keep working.
- **Prefer consistency** — Activity should follow Tasks conventions (hook, components, loading/error states).
- **Do not modify the provided backend** — `frontend-assessment/backend/` stays as-is; frontend adapts to its API contract.
- **UI polish is a dedicated phase** — visual and layout improvements (home page, shared nav, CSS classes) ship after core refactors.

---

## Findings to Address

### Performance

#### 1. Activity page runs a timer that re-renders every 1.4 seconds for no reason

**Where:** `frontend/app/activity/page.tsx` — `setInterval` + `tick` state

```tsx
useEffect(() => {
  const id = setInterval(() => {
    setTick((value) => value + 1);
  }, 1400);

  return () => clearInterval(id);
}, []);
```

**What is wrong:** `tick` updates on a fixed interval even when nothing in the data has changed. The interval uses an unexplained magic number (`1400` ms) with no comment or constant name.

**Why it is a problem:** Triggers re-renders and re-runs dependent `useEffect`s constantly. Wastes CPU and can cause unnecessary list reconciliation. The magic number looks arbitrary or debug-related.

**How to improve:** Remove the timer entirely — do not document or name the `1400` value. Only recompute when `query` or `allActivity` changes, like `useTasks` does with `useMemo`:

```tsx
const filteredTasks = useMemo(() => {
  if (filter === "completed") {
    return tasks.filter((task) => task.completed);
  }
  if (filter === "pending") {
    return tasks.filter((task) => !task.completed);
  }
  return tasks;
}, [tasks, filter]);
```

---

#### 2. Filter runs twice in a row with identical logic _(same fix as Performance #1)_

**Where:** `frontend/app/activity/page.tsx` — `applyFilterA` then `applyFilterB`

```tsx
useEffect(() => {
  const a = applyFilterA(allActivity, query);
  const b = applyFilterB(a, query);
  setShownActivity(b);
}, [query, allActivity, tick]);
```

**What is wrong:** `applyFilterA` and `applyFilterB` do the same thing. The list is filtered twice on every update.

**Why it is a problem:** Doubles work on every keystroke and every timer tick for zero benefit.

**How to improve:** One filter function, one pass, inside `useMemo`:

```tsx
const filteredActivity = useMemo(() => {
  if (!query) return allActivity;
  const lower = query.toLowerCase();
  return allActivity.filter(
    (item) =>
      (item.action || "").toLowerCase().includes(lower) ||
      (item.info || "").toLowerCase().includes(lower),
  );
}, [allActivity, query]);
```

---

#### 3. `forcedList` copies the array on every tick for no reason _(same fix as Performance #1, and #2)_

**Where:** `frontend/app/activity/page.tsx`

```tsx
useEffect(() => {
  if (tick % 2 === 0) {
    setForcedList([...shownActivity]);
  } else {
    setForcedList(shownActivity.map((item) => ({ ...item })));
  }
}, [shownActivity, tick]);
```

**What is wrong:** Alternates between a shallow copy and a per-item object copy on every tick.

**Why it is a problem:** Allocates new arrays/objects constantly and forces React to treat the list as changed even when the data is the same.

**How to improve:** Render the filtered list directly. React keys on `item.id` are sufficient — same as `TaskList`:

```tsx
{
  tasks.map((task) => (
    <TaskItem
      key={task.id}
      task={task}
      busy={updatingTaskId === task.id}
      onToggle={onToggle}
    />
  ));
}
```

---

#### 4. Activity search filter runs on every keystroke _(same fix as Performance #2, #3, Maintainability #1, #2, and #3)_

**Where:** `frontend/app/activity/page.tsx` — search input + filter effect

```tsx
<input
  className="input"
  placeholder="Search activity"
  value={query}
  onChange={(event) => setQuery(event.target.value)}
/>
```

**What is wrong:** Each character typed immediately triggers a re-filter (and, today, a full effect chain including the timer).

**Why it is a problem:** Unnecessary work on fast typing. Becomes noticeable as the activity list grows.

**How to improve:** Debounce the search value before filtering — `useDeferredValue` or a small debounce hook (~200ms):

```tsx
const deferredQuery = useDeferredValue(query);

const filteredActivity = useMemo(() => {
  if (!deferredQuery) return allActivity;
  const lower = deferredQuery.toLowerCase();
  return allActivity.filter(
    (item) =>
      (item.action || "").toLowerCase().includes(lower) ||
      (item.info || "").toLowerCase().includes(lower),
  );
}, [allActivity, deferredQuery]);
```

---

### Maintainability

#### 1. Activity module is one giant page; Tasks is properly split _(same fix as Performance #1, #2, and #3)_

**Where:** `frontend/app/activity/page.tsx` (~130 lines) vs Tasks architecture

**What is wrong:** Activity has fetch, filter, format, and render logic all in one fat `"use client"` page component. Tasks uses a thin server page → `TaskDashboard` (client) → `TaskList` / `TaskItem` / `StatusFilter`, with logic in `useTasks`.

**Why it is a problem:** Hard to test, reuse, or change one concern without touching everything. Misses the Next.js App Router pattern of thin pages + focused client components. Two modules in the same app follow completely different structures.

**How to improve:** Mirror the Tasks layout — keep `app/activity/page.tsx` as a server component wrapper:

```
hooks/useActivity.ts
components/activity/ActivityFeed.tsx
components/activity/ActivityItem.tsx
components/activity/ActivitySearch.tsx
app/activity/page.tsx  → thin wrapper
```

```tsx
// app/activity/page.tsx — server component
import { ActivityFeed } from "@/components/activity/ActivityFeed";

export default function ActivityPage() {
  return (
    <main className="stack">
      <nav>...</nav>
      <ActivityFeed />
    </main>
  );
}
```

Same pattern as Tasks:

```tsx
// app/tasks/page.tsx
export default function TasksPage() {
  return (
    <main className="stack">
      <nav>...</nav>
      <TaskDashboard />
    </main>
  );
}
```

---

#### 2. Duplicate helper functions and duplicate timestamp rendering _(same fix as Performance #1, #2, #3, and Maintainability #1)_

**Where:** `frontend/app/activity/page.tsx`

```tsx
function formatTimeA(value: string) {
  return new Date(value).toLocaleString();
}

function formatTimeB(value: string) {
  return new Date(value).toLocaleString();
}

function applyFilterA(items: ActivityLog[], text: string) { ... }
function applyFilterB(items: ActivityLog[], text: string) { ... }
```

The same timestamp is also rendered twice per row in JSX:

```tsx
<small style={{ color: "var(--muted)" }}>{formatTimeA(item.when)}</small>
<br />
<small style={{ color: "var(--muted)" }}>{formatTimeB(item.when)}</small>
```

**What is wrong:** `A` / `B` suffixes suggest copy-paste, not purpose. Both filter pairs and both formatters are identical. The UI renders the formatted time twice on every row.

**Why it is a problem:** Future readers cannot tell which helper to use or change. Extra DOM nodes and render work for duplicate visible content.

**How to improve:** One named formatter, one line in the template — like `TaskItem`:

```tsx
function formatActivityTime(iso: string) {
  return new Date(iso).toLocaleString();
}

// in JSX:
<small style={{ color: "var(--muted)" }}>
  {formatActivityTime(item.when)}
</small>;
```

---

#### 3. Three state variables for essentially the same data _(same fix as Performance #1, #2, #3, Maintainability #1, and #2)_

**Where:** `frontend/app/activity/page.tsx`

```tsx
const [allActivity, setAllActivity] = useState<ActivityLog[]>([]);
const [shownActivity, setShownActivity] = useState<ActivityLog[]>([]);
const [query, setQuery] = useState("");
const [tick, setTick] = useState(0);
const [forcedList, setForcedList] = useState<ActivityLog[]>([]);
```

**What is wrong:** `shownActivity` and `forcedList` are derived from `allActivity` + `query`. They should not be separate state.

**Why it is a problem:** State can drift out of sync. Requires extra `useEffect`s to keep values aligned. Harder to reason about.

**How to improve:** Store only source state; derive the rest — like `useTasks`:

```tsx
const [tasks, setTasks] = useState<Task[]>([]);
const [filter, setFilter] = useState<TaskFilter>("all");
// filteredTasks computed via useMemo — not stored in state
```

---

#### 4. Inconsistent data-fetching patterns between modules

**Where:** Activity inline `fetch` vs `useTasks` → `requestJson`

```tsx
// activity/page.tsx
fetch("/api/activity")
  .then((response) => response.json())
  .then((data: ActivityLog[]) => { ... })
```

vs

```tsx
// hooks/useTasks.ts
const body = await requestJson<TasksResponse>("/api/tasks", { method: "GET" });
setTasks(body.data);
```

**What is wrong:** Tasks has typed `requestJson`, checks `response.ok`, and parses errors. Activity uses raw `fetch().then().json()` with no status check.

**Why it is a problem:** Activity will not surface API errors correctly. Two patterns to maintain across hooks.

**How to improve:** Extract `requestJson` to a shared `lib/apiClient.ts` and use it in `useTasks`, `useActivity`, and future `useReports`:

```tsx
async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ... } });
  if (!response.ok) {
    const body = (await response.json()) as ErrorResponse;
    throw new Error(body.error?.message || `Request failed with ${response.status}`);
  }
  return (await response.json()) as T;
}
```

---

#### 5. Inline styles everywhere instead of reusable CSS classes

**Where:** Activity page, `TaskDashboard`, `TaskItem`, `TaskList`, `app/page.tsx`

```tsx
<section className="card" style={{ padding: "1rem" }}>
  <h1 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Activity Feed</h1>
```

**What is wrong:** Same `padding: "1rem"`, `marginTop: 0`, and grid layouts are repeated across JSX files.

**Why it is a problem:** UI changes require editing many files. Hard to keep spacing and typography consistent.

**How to improve:** Extend `globals.css` with reusable classes (e.g. `.card-body`, `.page-title`, `.muted`) and use them across all pages. **Planned for the UI polish phase** (same fix group as UX #4 and UX #7).

---

#### 6. `requestJson` is private to `useTasks` — not shared _(same fix as Maintainability #4)_

**Where:** `frontend/hooks/useTasks.ts`

**What is wrong:** `requestJson` and `getErrorMessage` live inside the hook file. Activity cannot reuse them without duplicating.

**Why it is a problem:** Copy-paste risk when adding `useActivity` and `useReports`.

**How to improve:** Move to `lib/apiClient.ts` and import from all hooks.

---

#### 7. Dead code in `stats` useMemo

**Where:** `frontend/app/activity/page.tsx`

```tsx
const stats = useMemo(() => {
  return {
    total: allActivity.length,
    visible: shownActivity.length,
    everySecondTick: tick,
  };
}, [allActivity.length, shownActivity.length, tick]);
```

**What is wrong:** `everySecondTick` is computed but never rendered in the UI. It depends on `tick`, which only exists because of the pointless timer (Performance #1) — but cleaning up `stats` is a separate maintainability concern even after the timer is removed.

**Why it is a problem:** Looks like leftover debug code. Adds noise for reviewers.

**How to improve:** Remove unused fields, or remove `stats` entirely if only `total` and `visible` are needed.

---

### UX

#### 1. Activity has no loading state _(same fix as Performance #1, #2, #3, Maintainability #1, #2, and #3)_

**Where:** `frontend/app/activity/page.tsx`

**What is wrong:** The page renders empty sections, then data pops in when the fetch completes.

**Why it is a problem:** The user cannot tell if data is loading or if the feed is genuinely empty. Feels broken.

**How to improve:** Match `TaskDashboard`:

```tsx
{
  loading ? (
    <section className="card" style={{ padding: "1rem" }}>
      <p style={{ margin: 0 }}>Loading tasks...</p>
    </section>
  ) : null;
}
```

---

#### 2. Activity silently fails on API errors _(same fix as Maintainability #4, and #6)_

**Where:** `frontend/app/activity/page.tsx`

```tsx
.catch(() => {
  setAllActivity([]);
  setShownActivity([]);
  setForcedList([]);
});
```

**What is wrong:** Errors are swallowed. The UI shows an empty list with no explanation.

**Why it is a problem:** The user thinks there is no activity when the backend is down or the proxy failed.

**How to improve:** Match the Tasks error + retry pattern:

```tsx
{
  error ? (
    <section
      className="card"
      style={{
        padding: "1rem",
        borderColor: "#e3b4c0",
        background: "#fff8fa",
      }}>
      <p
        style={{
          marginTop: 0,
          marginBottom: "0.75rem",
          color: "var(--danger)",
        }}>
        {error}
      </p>
      <button type="button" className="button" onClick={fetchActivity}>
        Retry
      </button>
    </section>
  ) : null;
}
```

---

#### 3. Activity has no empty state when search returns nothing _(same fix as Performance #1, #2, #3, Maintainability #1, #2, #3, and UX #1)_

**Where:** `frontend/app/activity/page.tsx`

**What is wrong:** When the search filter matches zero items, the list area is blank with no message.

**Why it is a problem:** The user cannot distinguish "no results for this search" from "no data at all".

**How to improve:** Match `TaskList`:

```tsx
if (tasks.length === 0) {
  return (
    <section className="card" style={{ padding: "1rem" }}>
      <p style={{ margin: 0, color: "var(--muted)" }}>
        No tasks match this filter.
      </p>
    </section>
  );
}
```

---

#### 4. Home page cards are bare — no descriptions or visual hierarchy _(same fix as Maintainability #5)_

**Where:** `frontend/app/page.tsx`

```tsx
<Link
  href="/tasks"
  className="card"
  style={{ padding: "1rem", display: "block" }}>
  <h2 style={{ marginTop: 0 }}>Task Dashboard</h2>
</Link>
```

**What is wrong:** Title only — no description, no visual affordance, no Reports link.

**Why it is a problem:** The landing page does not orient the user. README requires styling the pages beautifully.

**How to improve:** Add short descriptions, hover states, and a Reports card once built. **Planned for the UI polish phase.**

---

#### 5. Retry on Tasks refetches with full-page loading flash

**Where:** `frontend/hooks/useTasks.ts` — `fetchTasks` sets `loading: true`

```tsx
const fetchTasks = useCallback(async () => {
  try {
    setLoading(true);
    setError("");
    // ...
```

**What is wrong:** On retry, the entire task list disappears and shows "Loading tasks..." again.

**Why it is a problem:** Jarring UX — the user loses context of what they were viewing.

**How to improve:** Separate `isInitialLoading` from `isRefreshing`, or keep showing stale data while retrying (spinner near the error banner instead of replacing the list).

---

#### 6. Filter terminology does not match the task status model

**Where:** `frontend/components/tasks/StatusFilter.tsx`, `frontend/types/api.ts`

```tsx
const FILTERS = [
  { label: "All", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
];
```

```ts
export type Task = {
  id: string;
  title: string;
  completed: boolean;
  // no status field
};
```

**What is wrong:** Filters by `completed` boolean only (`pending` / `completed`). The Reports API groups by `status` (`todo`, `in-progress`, `done`).

**Why it is a problem:** Dashboard and Reports will show inconsistent groupings. Users cannot filter `in-progress` tasks.

**How to improve:** Add `status` to the `Task` type and align filters with backend status values when the Reports module is built. See also Code Quality #1.

---

#### 7. No shared navigation — duplicated "Back" link on every page _(same fix as Maintainability #5, and UX #4)_

**Where:** `frontend/app/tasks/page.tsx`, `frontend/app/activity/page.tsx`, and all module pages

```tsx
<nav>
  <Link href="/" className="button">
    Back
  </Link>
</nav>
```

**What is wrong:** Identical back-navigation is copy-pasted on every module page. The user must go Home → pick a module; cannot jump Tasks ↔ Activity directly. No links to Reports.

**Why it is a problem:** Poor app-like UX for a multi-module system. Adding new pages means copying nav again.

**How to improve:** Shared `AppShell` or persistent top nav in `layout.tsx`:

```tsx
<nav>
  <Link href="/tasks">Tasks</Link>
  <Link href="/activity">Activity</Link>
  <Link href="/reports">Reports</Link>
</nav>
```

**Planned for the UI polish phase** (same fix group as Maintainability #5 and UX #4).

---

#### 8. Task toggle waits for API response before updating the UI

**Where:** `frontend/hooks/useTasks.ts` — `updateTaskStatus`

```tsx
const updateTaskStatus = useCallback(async (taskId: string, completed: boolean) => {
  try {
    setUpdatingTaskId(taskId);
    setError("");

    const body = await requestJson<TaskResponse>(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    });

    setTasks((previous) =>
      previous.map((task) => (task.id === taskId ? body.data : task))
    );
```

**What is wrong:** The list only updates after the PATCH completes. The button shows "Saving..." but the task status does not change until the network round-trip finishes.

**Why it is a problem:** Feels sluggish on slow networks. Users expect instant feedback when toggling a task.

**How to improve:** Update local state immediately; roll back on error:

```tsx
const previousTasks = tasks;
setTasks((current) =>
  current.map((task) =>
    task.id === taskId ? { ...task, completed, status: completed ? "done" : "todo" } : task
  )
);

try {
  const body = await requestJson<TaskResponse>(`/api/tasks/${taskId}`, { ... });
  setTasks((current) =>
    current.map((task) => (task.id === taskId ? body.data : task))
  );
} catch (error) {
  setTasks(previousTasks);
  setError(getErrorMessage(error, "Could not update task status."));
}
```

---

### Code Quality

#### 1. `Task` type is incomplete — missing `status` _(same fix as UX #6)_

**Where:** `frontend/types/api.ts`

```ts
export type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};
```

**What is wrong:** No `status` field. Reports API and backend data use `todo | in-progress | done`.

**Why it is a problem:** TypeScript will not catch status-related bugs. Reports UI cannot be fully typed.

**How to improve:**

```ts
export type TaskStatus = "todo" | "in-progress" | "done";

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};
```

---

#### 2. Activity fetch does not check `response.ok` _(same fix as Maintainability #4, #6, and UX #2)_

**Where:** `frontend/app/activity/page.tsx`

```tsx
fetch("/api/activity")
  .then((response) => response.json())
  .then((data: ActivityLog[]) => {
```

**What is wrong:** A `500` response still gets parsed as JSON and treated as a successful load.

**Why it is a problem:** Error payloads may be mishandled or rendered as activity data.

**How to improve:** Use the shared `requestJson` helper that checks `response.ok` before parsing — same as `useTasks`.

---

### React Best Practices

#### 1. Derived data stored in state and synced via chained `useEffect`s (anti-pattern) _(same fix as Performance #1, #2, #3, Maintainability #1, #2, #3, UX #1, and #3)_

**Where:** `frontend/app/activity/page.tsx` — `shownActivity`, `forcedList` synced from `allActivity` / `query` / `tick`

```tsx
// Effect 1: fetch
// Effect 2: setInterval tick
// Effect 3: applyFilterA → applyFilterB → setShownActivity
// Effect 4: copy shownActivity → forcedList
```

**What is wrong:** Computed values are stored in state and kept in sync through four chained `useEffect`s. Each effect can trigger the next, causing a cascade of renders.

**Why it is a problem:** Extra renders, effect ordering bugs, harder to debug. React docs recommend computing during render, not syncing derived state in effects.

**How to improve:** One fetch effect + `useMemo` for filtering. Match `useTasks`:

```tsx
useEffect(() => {
  fetchActivity();
}, [fetchActivity]);

const filteredActivity = useMemo(() => {
  // derive from allActivity + query
}, [allActivity, query]);
```

---

#### 2. No memoization in Activity; `useTasks` uses `useCallback` / `useMemo` correctly _(same fix as Performance #1, #2, #3, Maintainability #1, #2, #3, UX #1, #3, and React Best Practices #1)_

**Where:** `frontend/hooks/useTasks.ts` vs `frontend/app/activity/page.tsx`

**What is wrong:** Tasks memoizes filtered results and stabilizes callbacks. Activity re-creates filter functions every render and drives updates through effects.

**Why it is a problem:** Inconsistent quality across modules. Extracted Activity child components would re-render unnecessarily.

**How to improve:** Extract `useActivity` with the same patterns as `useTasks`:

```tsx
const fetchActivity = useCallback(async () => { ... }, []);
const filteredActivity = useMemo(() => { ... }, [allActivity, query]);
```

---

## Future Recommendations

Not blockers for this assessment, but needed before production.

### Authentication and route protection

**Where:** All pages and `app/api/*` route handlers

**What is wrong:** No auth. Anyone with the URL can read and mutate tasks.

**Why it is a problem:** Not acceptable for a real production app.

**How to improve:** Add session or token auth; protect API routes and pages.

---

### Frontend testing (unit, integration, E2E)

**Where:** `frontend/package.json` — no test script or testing libraries

**What is wrong:** No automated checks for hooks, components, or user flows.

**Why it is a problem:** Regressions after refactoring Activity or adding Reports will not be caught automatically.

**How to improve:** React Testing Library for hooks/components; Playwright or Cypress for E2E flows (tasks CRUD, activity feed, reports page).

---

### Server Components where possible _(same fix as Maintainability #1)_

**Where:** Module pages that are fully `"use client"` today

**What is wrong:** Pages that only compose children do not need to be client components.

**Why it is a problem:** Larger client bundle than necessary.

**How to improve:** Keep pages as server components; mark only interactive leaves with `"use client"` — covered by the Activity refactor in Maintainability #1.

---

## Applied Fixes

Summary of what was implemented during the refactor and which findings it addresses. Listed by change, not by review category.

### Phase 1 — Shared utilities

#### Extract shared `apiClient` for client-side fetches

**Fixes:** Maintainability #4, Maintainability #6

**Where:** `frontend/lib/apiClient.ts` (new), `frontend/hooks/useTasks.ts`

**What we did:** Moved `requestJson` and `getErrorMessage` out of `useTasks` into a shared module. `useTasks` now imports from `@/lib/apiClient` — behavior unchanged. Future hooks (`useActivity`, `useReports`) can reuse the same client.

```typescript
import { getErrorMessage, requestJson } from "@/lib/apiClient";

const body = await requestJson<TasksResponse>("/api/tasks", { method: "GET" });
setTasks(body.data);
```

```typescript
export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ... } });
  if (!response.ok) {
    const body = (await response.json()) as ErrorResponse;
    throw new Error(body.error?.message || `Request failed with ${response.status}`);
  }
  return (await response.json()) as T;
}
```

**Tested:** `npm run build` passes. Tasks hook still uses `requestJson` for `GET /api/tasks` and `PATCH /api/tasks/:id` with the same error parsing as before.

---

### Phase 2 — Activity module

#### Add `useActivity` hook with shared `apiClient`

**Fixes:** Performance #1, #2, #3, #4, Maintainability #3, Maintainability #7, UX #1, UX #2, Code Quality #2, React Best Practices #1, React Best Practices #2

**Where:** `frontend/hooks/useActivity.ts` (new), `frontend/lib/activityUtils.ts` (new)

**What we did:** Replaced timer, duplicate filters, and redundant state with source state + `useMemo`. Search uses `useDeferredValue`. Fetches via `requestJson` with loading, error, and retry support. Removed dead `everySecondTick` from stats.

```typescript
// source state only — no tick, shownActivity, or forcedList
const [allActivity, setAllActivity] = useState<ActivityLog[]>([]);
const [query, setQuery] = useState("");
const deferredQuery = useDeferredValue(query);

const data = await requestJson<ActivityLog[]>("/api/activity", {
  method: "GET",
});
// catch → setError(...); ActivityFeed renders Retry button

const filteredActivity = useMemo(
  () => filterActivity(allActivity, deferredQuery),
  [allActivity, deferredQuery],
);

const stats = useMemo(
  () => ({ total: allActivity.length, visible: filteredActivity.length }),
  [allActivity.length, filteredActivity.length],
);
```

**Tested:** `GET /api/activity` returns activity array; hook surfaces errors instead of silently clearing data.

---

#### Split Activity into components

**Fixes:** Maintainability #1, Maintainability #2, UX #3, React Best Practices #2

**Where:** `frontend/components/activity/` — `ActivityFeed.tsx`, `ActivityList.tsx`, `ActivityItem.tsx`, `ActivitySearch.tsx`

**What we did:** Extracted feed layout, search input, list, and row into focused components. One `formatActivityTime` helper; no duplicate timestamp render.

```tsx
// ActivityFeed.tsx — layout + loading / error / list
<ActivitySearch value={query} onChange={setQuery} />;
{
  loading ? <p>Loading activity...</p> : null;
}
{
  error ? <button onClick={fetchActivity}>Retry</button> : null;
}
<ActivityList
  activities={filteredActivity}
  hasSearchQuery={query.trim().length > 0}
/>;
```

```tsx
// ActivityItem.tsx — single timestamp line
<small style={{ color: "var(--muted)" }}>{formatActivityTime(item.when)}</small>
```

**Tested:** Search filters by `action` / `info`; empty search shows "No activity matches this search."

---

#### Thin Activity page (server component wrapper)

**Fixes:** Maintainability #1, React Best Practices #2

**Where:** `frontend/app/activity/page.tsx`

**What we did:** Page is now a thin wrapper like Tasks — nav + `<ActivityFeed />`. All client logic lives in the hook and components.

```tsx
export default function ActivityPage() {
  return (
    <main className="stack">
      <nav>...</nav>
      <ActivityFeed />
    </main>
  );
}
```

**Tested:** `npm run build` passes; `/activity` returns 200.

---

### Phase 3 — Tasks module

#### Add `TaskStatus` type and normalize tasks on load

**Fixes:** Code Quality #1, UX #6

**Where:** `frontend/types/api.ts`, `frontend/lib/taskUtils.ts` (new)

**What we did:** Added optional `status` to `Task`. `normalizeTask` derives `todo` / `done` from `completed` when the API omits `status`. Filter labels updated to "To do" / "Done".

```typescript
export type TaskStatus = "todo" | "in-progress" | "done";

const status = task.status ?? (task.completed ? "done" : "todo");
```

**Tested:** Tasks from provided backend (boolean-only) get `status` derived on fetch.

---

#### Optimistic task toggle with rollback on error

**Fixes:** UX #8

**Where:** `frontend/hooks/useTasks.ts`

**What we did:** UI updates immediately on toggle; rolls back if PATCH fails.

```typescript
setTasks((current) => {
  previousTasks = current;
  return current.map((task) =>
    task.id === taskId ? applyCompleted(task, completed) : task,
  );
});
// catch → setTasks(previousTasks);
```

**Tested:** Toggle updates badge instantly; failed PATCH restores previous state.

---

#### Separate initial loading from retry refresh

**Fixes:** UX #5

**Where:** `frontend/hooks/useTasks.ts`, `frontend/components/tasks/TaskDashboard.tsx`

**What we did:** `isInitialLoading` only on first fetch. Retry sets `isRefreshing` and keeps the task list visible.

```typescript
const isRetry = hasLoadedRef.current;
if (isRetry) setIsRefreshing(true);
// TaskDashboard: show list when !isInitialLoading, even if error + stale data
```

**Tested:** Retry shows error banner + existing tasks; no full-page "Loading tasks..." flash.
