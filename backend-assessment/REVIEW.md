# Code Review — VeeLion Backend Assessment

This document captures findings from reviewing the Tasks API, Activity Log API, and shared utilities.

## Contents

### [Positive Findings](#positive-findings)

What the codebase already does well and should be kept during refactoring.

### [Refactoring Principles](#refactoring-principles)

Rules followed while improving the project without breaking existing behavior.

### [Findings to Address](#findings-to-address)

Issues grouped by impact — Bugs, Performance, Maintainability, Security, and Code Quality.

### [Future Recommendations](#future-recommendations)

Improvements deferred beyond this assessment scope.

### [Applied Fixes](#applied-fixes)

What was implemented and which findings each change resolves.

---

**How to read this doc**

- Each finding is listed under the category that best describes its **impact** (not always where the code lives).
- When multiple findings share the same fix, each stays separate. Headers list **all** earlier items in that fix group across the whole doc, plus the root — e.g. _(same fix as Performance #1, Maintainability #2, #3, Code Quality #1, #2, and Bug #3)_.

| Category            | What belongs here                                |
| ------------------- | ------------------------------------------------ |
| **Bugs**            | Broken or incorrect behavior, data loss, crashes |
| **Performance**     | Speed, blocking, scalability of reads/writes     |
| **Maintainability** | Architecture, patterns, integration, deployment  |
| **Security**        | Tampering, abuse, information disclosure         |
| **Code Quality**    | Naming, duplication, style, readability          |

---

## Positive Findings

- **Layered Tasks module** — `routes` → `controller` → `service`.
- `jsonStore.js` — reusable async JSON file helper.
- `HttpError` **+** `errorHandler` **+** `asyncHandler` — error pipeline in Tasks.
- `taskValidator.js` — well-structured validation (unused, but correct design).
- `createId()` — UUID-based IDs in Tasks.
- **Global 404 handler** in `app.js`.

---

## Refactoring Principles

- **Do not rewrite everything from scratch** — extend existing patterns.
- **Maintain existing functionality** — current endpoints must keep working.
- **Prefer consistency** — Activity should follow Tasks conventions.

---

## Findings to Address

### Bugs

#### 1. Mass assignment on task update

**Where:** `src/modules/tasks/services/tasks.service.js` — `updateTask`

```javascript
const updatedTask = {
  ...existingTask,
  ...updates,
  updatedAt: new Date().toISOString(),
};
```

**What is wrong:** Only `title` and `completed` should be updatable, but the code spreads the entire request body. Extra fields like `id` and `createdAt` can be overwritten.

**Why it is a problem:** Server-owned data can be changed by the client. IDs and timestamps become unreliable.

**How to improve:** Whitelist fields via `taskValidator.js` before calling the service.

```javascript
const { validateUpdateTask } = require("../utils/taskValidator");

async function patchTask(req, res) {
  const updates = validateUpdateTask(req.body);
  const task = await tasksService.updateTask(req.params.id, updates);
  res.status(200).json({ data: task });
}
```

---

#### 2. Inconsistent title validation (create vs update, misleading PATCH errors)

**Where:**

- `src/modules/tasks/controllers/tasks.controller.js` — `createTask`, `patchTask`
- `src/modules/tasks/services/tasks.service.js` — `createTask`, `updateTask`

```javascript
// create — only checks non-empty
if (!payload.title) { ... }

// update — requires length >= 2
if (typeof updates.title === "string" && updates.title.length < 2) {
  throw new HttpError(400, "Title is too short.");
}

// patch — trims but does not reject empty
if (typeof updates.title === "string") {
  updates.title = updates.title.trim();
}
```

**What is wrong:**

- Create allows a 1-character title (`"A"`); update rejects it.
- `PATCH { "title": "   " }` becomes `""` and returns `"Title is too short."` instead of `"title cannot be empty."`

**Why it is a problem:** Confusing API behavior and inconsistent rules across endpoints.

**How to improve:** Enforce all title rules once in `taskValidator.js` for create and update.

```javascript
const trimmedTitle = payload.title.trim();
if (!trimmedTitle) {
  throw new HttpError(400, '"title" cannot be empty.');
}
if (trimmedTitle.length < 2) {
  throw new HttpError(400, '"title" must be at least 2 characters.');
}
normalized.title = trimmedTitle;
```

---

#### 3. Activity module crashes on corrupted JSON

**Where:** `src/modules/activity/services/activity.service.js` — `loadDataA` / `loadDataB`

```javascript
let raw = fs.readFileSync(fp, "utf8");
return JSON.parse(raw);
```

**What is wrong:** Invalid `activity.json` makes `JSON.parse` throw. Activity routes don't use `asyncHandler`, so the error is not handled cleanly.

**Why it is a problem:** A broken file can crash Activity endpoints instead of returning a proper error response.

**How to improve:** Use async `jsonStore` for file I/O. Wrap all Activity routes with `asyncHandler` so errors reach the global `errorHandler` (same as Tasks).

```javascript
// activity.service.js
async function getAllActivity() {
  return readJsonArray(ACTIVITY_FILE_PATH);
}
```

```javascript
// activity.routes.js
activityRouter.get("/", asyncHandler(activityController.listActivity));
```

---

#### 4. Activity ID collisions under concurrent requests

**Where:** `src/modules/activity/services/activity.service.js` — `createNewActivity`

```javascript
id: String(Date.now()),
```

**What is wrong:** Two requests in the same millisecond get the same ID.

**Why it is a problem:** Duplicate IDs break uniqueness and can skew Reports counts.

**How to improve:** Use `createId()` like Tasks.

```javascript
id: createId(),
```

---

#### 5. Activity creates records with undefined fields

**Where:** `src/modules/activity/services/activity.service.js` — `createNewActivity`

```javascript
action: b.action, // no validation
info: b.info,     // no validation
```

**What is wrong:** `POST /activity` with `{}` stores `action: undefined` and `info: undefined`.

**Why it is a problem:** Polluted activity data breaks reliable reporting.

**How to improve:** Validate required string fields before persisting.

```javascript
if (!payload.action || typeof payload.action !== "string") {
  throw new HttpError(400, '"action" is required and must be a string.');
}
```

---

#### 6. `jsonStore` silently treats non-array JSON as empty array

**Where:** `src/utils/jsonStore.js` — `readJsonArray`

```javascript
return Array.isArray(parsed) ? parsed : [];
```

**What is wrong:** If the file is `{}` or `null`, the function returns `[]`. The next write overwrites and deletes all data.

**Why it is a problem:** Silent data loss instead of a clear error.

**How to improve:** Throw when the parsed value is not an array.

```javascript
if (!Array.isArray(parsed)) {
  throw new HttpError(500, "Data file is corrupted: expected a JSON array.");
}
```

---

#### 7. Task domain model doesn't match Reports API contract

**Where:** `data/tasks.json` / Tasks service vs Reports requirement

```json
{ "id": "...", "title": "...", "completed": true }
```

```json
"byStatus": { "todo": 5, "in-progress": 10, "done": 5 }
```

**What is wrong:** Tasks use `completed` boolean. Reports expects `status` with three values.

**Why it is a problem:** `byStatus` cannot be accurate without extending the model.

**How to improve:** Add and validate a `status` field on tasks.

```javascript
status: payload.status ?? "todo",
```

---

#### 8. `createTask` in service mutates the input payload

**Where:** `src/modules/tasks/services/tasks.service.js` — `createTask`

```javascript
if (payload.completed === undefined) {
  payload.completed = false;
}
```

**What is wrong:** The service modifies the object passed in instead of building a new one.

**Why it is a problem:** Callers logging or reusing `req.body` after the call see unexpected changes.

**How to improve:** Build a new object or normalize in `taskValidator.js` before the service runs.

```javascript
const taskData = {
  title: payload.title,
  completed: payload.completed ?? false,
};
```

---

### Performance

#### 1. Activity module blocks the Node.js event loop (sync I/O) _(same fix as Bug #3)_

**Where:** `src/modules/activity/services/activity.service.js`

```javascript
fs.existsSync(fp);
fs.readFileSync(fp, "utf8");
fs.writeFileSync(fp, JSON.stringify(list, null, 2));
```

**What is wrong:** Synchronous file I/O blocks the event loop during disk access.

**Why it is a problem:** Other requests wait while Activity reads or writes.

**How to improve:** Migrate Activity to async `jsonStore`.

```javascript
async function getAllActivity() {
  return readJsonArray(ACTIVITY_FILE_PATH);
}
```

---

#### 2. Full file read on every single operation

**Where:** Both modules — all CRUD operations

```javascript
const tasks = await readJsonArray(TASKS_FILE_PATH);
const task = tasks.find((item) => item.id === taskId);
```

**What is wrong:** Every request loads the entire JSON file, even to find one record.

**Why it is a problem:** Performance degrades as data grows. Acceptable for this assessment, not for production scale.

**How to improve:** Document the limitation now. Long-term: database with indexes or in-memory cache with invalidation on write.

---

#### 3. No pagination on list endpoints

**Where:** `GET /tasks`, `GET /activity`

```javascript
res.status(200).json({ data: tasks });
```

**What is wrong:** Full dataset returned on every list request.

**Why it is a problem:** Response size and memory grow unbounded.

**How to improve:** Add optional `page` and `limit` query parameters.

```javascript
const page = Number(req.query.page) || 1;
const limit = Number(req.query.limit) || 20;
const paginated = tasks.slice((page - 1) * limit, page * limit);
res
  .status(200)
  .json({ data: paginated, meta: { page, limit, total: tasks.length } });
```

---

### Maintainability

#### 1. Tasks validation is scattered; `taskValidator.js` is unused

**Where:**

- `src/modules/tasks/utils/taskValidator.js` — not imported
- `src/modules/tasks/controllers/tasks.controller.js` — inline validation + manual `res.status(400)`
- `src/modules/tasks/services/tasks.service.js` — duplicate validation

```javascript
// controller — manual error, bypasses errorHandler
return res
  .status(400)
  .json({ error: { message: "title is required and must be string" } });

// service — same check, different message
throw new HttpError(400, "Invalid title.");
```

| Location              | Message                                  |
| --------------------- | ---------------------------------------- |
| Controller create     | `"title is required and must be string"` |
| Controller patch      | `"title should be string"`               |
| Service               | `"Invalid title."`                       |
| Validator             | `'"title" must be a string.'`            |
| Controller patch body | `"bad body type"`                        |

**What is wrong:** A complete validator exists but is unused. Validation, normalization, and errors are split across controller and service with different rules and messages.

**Why it is a problem:** Two sources of truth drift apart (see Bug #2). `error.details` only works when errors go through `HttpError` → `errorHandler`.

**How to improve:** Validate once in the controller via `taskValidator.js`. Service handles business logic only.

```javascript
async function createTask(req, res) {
  const payload = validateCreateTask(req.body);
  const task = await tasksService.createTask(payload);
  res.status(201).json({ data: task });
}
```

---

#### 2. Two modules follow completely different patterns _(same fix as Performance #1 and Bug #3)_

**Where:** Tasks module vs Activity module

```javascript
tasksRouter.get("/", asyncHandler(tasksController.listTasks));
activityRouter.get("/", c.get_activity);
```

| Concern    | Tasks                        | Activity            |
| ---------- | ---------------------------- | ------------------- |
| I/O        | async `jsonStore`            | sync `fs`           |
| Errors     | `asyncHandler` + `HttpError` | none                |
| IDs        | `createId()` (UUID)          | `Date.now()`        |
| Response   | `{ data: ... }`              | raw array/object    |
| Naming     | `listTasks`, `tasksService`  | see Code Quality #2 |
| Validation | controller + service         | none                |
| Routes     | `asyncHandler`               | direct handler      |

**What is wrong:** No shared conventions between modules.

**Why it is a problem:** New features (Reports) have no clear pattern to follow.

**How to improve:** Refactor Activity to mirror Tasks — async service, `asyncHandler`, `HttpError`, `createId()`, `{ data }` wrapper.

---

#### 3. Inconsistent API response format _(same fix as Performance #1, Maintainability #2, and Bug #3)_

**Where:** Tasks vs Activity controllers

`GET /tasks`:

```json
{
  "data": [
    {
      "id": "aeccf602-2809-4802-985b-70ff86942377",
      "title": "Test task",
      "completed": true,
      "createdAt": "2026-04-08T09:39:57.432Z",
      "updatedAt": "2026-04-08T09:39:57.579Z"
    }
  ]
}
```

`GET /activity`:

```json
[
  {
    "id": "1775641197587",
    "action": "demo",
    "info": "smoke",
    "when": "2026-04-08T09:39:57.587Z"
  }
]
```

`POST /activity`:

```json
{
  "id": "1775641197587",
  "action": "demo",
  "info": "smoke",
  "when": "2026-04-08T09:39:57.587Z"
}
```

**What is wrong:** Tasks wrap payloads in `data` and errors in `error.message`. Activity returns raw arrays/objects with no consistent error shape.

**Why it is a problem:** Frontend must parse different response structures per endpoint.

**How to improve:** Standardize Activity on the Tasks format.

```javascript
res.status(200).json({ data: activities });
res.status(201).json({ data: activity });
```

---

#### 4. Tasks and Activity are not integrated

**Where:** Task mutations do not write to the activity log.

**What is wrong:** Create/update/delete task does not log activity. Clients must manually `POST /activity`.

**Why it is a problem:** `recentActivityCount` in Reports may not reflect real task changes.

**How to improve:** Call activity service after task mutations.

```javascript
await activityService.createActivity({
  action: "task.created",
  info: newTask.id,
});
```

---

#### 5. `server.js` doesn't bind to `0.0.0.0`

**Where:** `src/server.js`

```javascript
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

**What is wrong:** No explicit host binding.

**Why it is a problem:** Service may be unreachable on Docker, Render, etc.

**How to improve:**

```javascript
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
```

---

### Security

#### 1. Mass assignment on task update _(same fix as Bug #1)_

**Where:** `src/modules/tasks/services/tasks.service.js` — `updateTask`

**What is wrong:** Clients can tamper with protected fields (`id`, `createdAt`) via the PATCH body.

**Why it is a problem:** Untrusted input can overwrite server-controlled data.

**How to improve:** Reject unknown fields with `ensureNoUnknownFields` in `taskValidator.js`.

```javascript
if (unknownFields.length > 0) {
  throw new HttpError(400, "Body contains unsupported fields.", {
    unsupportedFields: unknownFields,
  });
}
```

---

#### 2. Unbounded `action` / `info` / `title` string length

**Where:** All create and update endpoints in both modules.

**What is wrong:** No max length on string fields.

**Why it is a problem:** Large payloads can fill disk and cause DoS.

**How to improve:** Add max-length checks in validators.

```javascript
if (trimmedTitle.length > 200) {
  throw new HttpError(400, '"title" must be at most 200 characters.');
}
```

---

#### 3. 404 handler exposes internal route details

**Where:** `src/app.js`

```javascript
next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
```

**What is wrong:** 404 response includes full method and URL.

**Why it is a problem:** Minor information disclosure of routes and query params.

**How to improve:** Generic client message; log details server-side.

```javascript
console.warn(`404: ${req.method} ${req.originalUrl}`);
next(new HttpError(404, "Route not found."));
```

---

#### 4. Errors bypass the global error handler _(same fix as Maintainability #1 and Bug #3)_

**Where:** Tasks controller (manual `res.status(400)`); Activity module (no error handling).

**What is wrong:** Not all errors flow through `errorHandler`.

**Why it is a problem:** Inconsistent error responses; 500 details and `error.details` behave differently per endpoint.

**How to improve:** All routes use `asyncHandler`; all validation throws `HttpError`.

```javascript
activityRouter.post("/", asyncHandler(activityController.createActivity));
```

---

### Code Quality

#### 1. Duplicate loaders and pointless `getAllActivity` wrapper in Activity _(same fix as Performance #1, Maintainability #2, #3, and Bug #3)_

**Where:** `src/modules/activity/services/activity.service.js`

```javascript
function loadDataA() {
  /* read file */
}
function loadDataB() {
  /* identical read file */
}

function getAllActivity() {
  const arr = loadDataA();
  return arr;
}
```

**What is wrong:** The same file-reading logic is copy-pasted in `loadDataA` and `loadDataB`. `getAllActivity` only calls `loadDataA` and returns the result — no added logic.

**Why it is a problem:** Duplicate code risks inconsistent fixes; the wrapper adds unnecessary indirection.

**How to improve:** Single `readJsonArray` call from `jsonStore.js`.

```javascript
async function getAllActivity() {
  return readJsonArray(ACTIVITY_FILE_PATH);
}
```

---

#### 2. Poor naming in Activity module _(same fix as Performance #1, Maintainability #2, #3, Code Quality #1, and Bug #3)_

**Where:** `activity.service.js`, `activity.controller.js`, `activity.routes.js`

```javascript
const fp = path.join(process.cwd(), "data", "activity.json");
const aSvc = require("../services/activity.service");
const c = require("../controllers/activity.controller");
function get_activity(req, res) {
  const x = aSvc.getAllActivity();
}
```

**What is wrong:** Abbreviated names (`fp`, `aSvc`, `c`, `x`) and snake_case `get_activity` in a camelCase codebase.

**Why it is a problem:** Harder to read and review.

**How to improve:** Match Tasks naming (`activityService`, `listActivity`).

---

#### 3. Inconsistent explicit HTTP status codes in Activity _(same fix as Performance #1, Maintainability #2, #3, Code Quality #1, #2, and Bug #3)_

**Where:** `activity.controller.js`

```javascript
res.json(x); // GET — implicit 200
res.status(201).json(made); // POST — explicit 201
```

**What is wrong:** GET does not set status explicitly; Tasks always does.

**Why it is a problem:** Harder to audit response behavior.

**How to improve:**

```javascript
res.status(200).json({ data: activities });
```

---

## Future Recommendations

Not blockers for this refactor, but needed before production.

### Authentication and authorization

**Where:** All routes in `src/app.js`

**What is wrong:** All endpoints are public.

**Why it is a problem:** Anyone can read, create, update, and delete data.

**How to improve:** Add auth middleware before route handlers.

---

### Rate limiting

**Where:** All endpoints

**What is wrong:** No request throttling.

**Why it is a problem:** Amplifies file-write race conditions and enables abuse.

**How to improve:** `express-rate-limit` at app level.

---

### Pagination _(same fix as Performance #3)_

**Where:** `GET /tasks`, `GET /activity`

**What is wrong:** Full dataset on every list request.

**How to improve:** See Performance #3.

---

### Database migration

**Where:** `data/tasks.json`, `data/activity.json`

**What is wrong:** JSON files don't support concurrent writes, indexes, or transactions.

**How to improve:** PostgreSQL or MongoDB; keep service-layer interface.

---

### Automated tests

**Where:** `package.json` — no test script.

**What is wrong:** No automated regression checks after refactoring.

**How to improve:** Integration tests for tasks CRUD, activity, and reports.

---

## Applied Fixes

Summary of what was implemented during the refactor and which findings it addresses. Listed by change, not by review category.

### Phase 1 — Shared utilities

#### Fail fast on corrupted data files instead of silent data loss

**Fixes:** Bug #6

**Where:** `src/utils/jsonStore.js` — `readJsonArray`

**What we did:** If a JSON file parses but is not an array, throw an error instead of returning `[]` (which could overwrite all data on the next write).

```javascript
const parsed = JSON.parse(raw);
if (!Array.isArray(parsed)) {
  throw new HttpError(500, "Data file is corrupted: expected a JSON array.");
}
return parsed;
```

---

#### Hide route details from 404 responses

**Fixes:** Security #3

**Where:** `src/app.js` — 404 catch-all middleware

**What we did:** Return a generic message to the client; log the full method and URL only on the server.

```javascript
app.use((req, res, next) => {
  console.warn(`404: ${req.method} ${req.originalUrl}`);
  next(new HttpError(404, "Route not found."));
});
```

---

#### Bind server to all network interfaces for deployment

**Fixes:** Maint #5

**Where:** `src/server.js`

**What we did:** Listen on `0.0.0.0` so the app is reachable on Docker, Render, and similar hosts (not only localhost).

```javascript
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
```

---

### Phase 2 — Activity module

#### Replace sync file I/O with async `jsonStore`

**Fixes:** Bug #3, Bug #4, Performance #1, Code Quality #1

**Where:** `src/modules/activity/services/activity.service.js`

**What we did:** Removed sync `fs`, duplicate loaders, and `Date.now()` IDs. Activity now uses async `jsonStore` and `createId()` like Tasks.

```javascript
async function getAllActivity() {
  return readJsonArray(ACTIVITY_FILE_PATH);
}

async function createActivity(payload) {
  const activities = await readJsonArray(ACTIVITY_FILE_PATH);
  const activity = buildActivityRecord(payload);
  activities.push(activity);
  await writeJsonArray(ACTIVITY_FILE_PATH, activities);
  return activity;
}
```

---

#### Validate activity input in a dedicated validator

**Fixes:** Bug #5, Security #2 (activity fields)

**Where:** `src/modules/activity/utils/activityValidator.js` (new)

**What we did:** Require non-empty `action` and `info` strings, reject unknown fields, and enforce a max length before persisting.

```javascript
const payload = validateCreateActivity(req.body);
const activity = await activityService.createActivity(payload);
```

---

#### Align controller and routes with Tasks conventions

**Fixes:** Maint #2, #3, Security #4, Code Quality #2, #3

**Where:** `src/modules/activity/controllers/activity.controller.js`, `src/modules/activity/routes/activity.routes.js`

**What we did:** Renamed handlers (`listActivity`, `createActivity`), wrapped routes in `asyncHandler`, return `{ data }` responses, and set explicit status codes.

```javascript
activityRouter.get("/", asyncHandler(activityController.listActivity));
activityRouter.post("/", asyncHandler(activityController.createActivity));
```

```javascript
async function listActivity(req, res) {
  const activities = await activityService.getAllActivity();
  res.status(200).json({ data: activities });
}
```

**Tested:** `GET /activity` and `POST /activity` — both returned expected `{ data }` responses; empty body correctly returns `400`.
