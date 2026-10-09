# Lab 4 Test Plan and Traceability Matrix: TokTickIT Actions Taken, Role Dashboards, Ticket Lifecycle & Resolution Gate, and Final Regression

## 1. Test Strategy

This document defines the comprehensive Test Strategy, Planned Test Matrix, and Dual Traceability Matrix (AC & BR) for **TokTickIT Lab 4 (Sprint 4)** in accordance with the course specification.

The test plan is established **prior to implementation** (Test-Driven Development / Specification-Driven Development) to ensure that every business rule, role boundary, parent-child Actions Taken relationship, resolution gate enforcement, optimistic concurrency check, dashboard aggregation, responsive layout, visual styling rule, and regression invariant is verified through automated tests.

---

### 1.1 Test Levels & Methodology

- **Unit Testing (Server)**:
  - Framework: Vitest.
  - Scope: Isolated business logic functions, input validation routines, state machine status transition validators, dashboard query builder helpers, and timestamp comparison utilities.
  - Invariants Tested: Non-empty string validation for `followUpNote` when `followUpRequired = true`, state machine validation for all 18 permitted transitions across 8 statuses, terminal state guards, and exact millisecond/ISO-8601 stale update detection logic.
- **API & Integration Testing (Server)**:
  - Framework: Supertest with Vitest on the Node.js/Express backend.
  - Scope: REST API contracts under `/api/v1/tickets/:id/actions-taken`, `/api/v1/tickets/:id/status`, `/api/v1/tickets/:id/resolve-indicator`, `/api/v1/dashboard/requester`, and `/api/v1/dashboard/staff`.
  - Invariants Tested: HTTP status codes (`200`, `201`, `400`, `401`, `403`, `404`, `409`), Bearer token validation, role authorization guards (`REQUESTER`, `IT_STAFF`, `ADMIN`), automatic actor binding (`performedById`), follow-up note validation, inactive actor rejection (on both create and update), full status transition matrix enforcement, resolution gate rules, optimistic concurrency checking (`expectedUpdatedAt`, `expectedTicketUpdatedAt`), and backend SQL aggregation calculations.
- **Performance-Smoke Testing (Server)**:
  - Framework: Vitest with high-resolution timer assertions (`performance.now()`).
  - Scope: Execution latency benchmarks for representative seed datasets on Requester Dashboard, Staff Dashboard, and Actions Taken CRUD endpoints.
  - Invariants Tested: Verifying that database aggregations complete within project-defined engineering smoke thresholds ($< 300\text{ms}$ for dashboards, $< 200\text{ms}$ for Actions Taken) with zero unindexed table scans or runtime errors. *(Note: These thresholds are project-defined engineering smoke targets for regression detection, not course-mandated performance targets).*
- **UI Component & Interaction Testing (Client)**:
  - Framework: React Testing Library with Vitest and jsdom.
  - Scope: Actions Taken section on Ticket Detail, Create/Edit Action Taken modals, status transition selector and confirmation, Requester advisory resolution button, Requester Dashboard (4 metric cards, recent tickets, recently resolved tickets), IT Staff Dashboard (6 metric cards, priority strip, my recent actions, recent queue tickets), Admin Dashboard user metrics panel, and drill-down navigation links.
  - Invariants Tested: Input validation, mandatory follow-up note gating, modal open/close lifecycle, form state preservation on error, double-click prevention on submissions, empty/loading/error states, and role-based element rendering.
- **UI Style & Visual Invariants Testing**:
  - Scope: Strict adherence to the Zen Green design tokens (Primary Green `#006B3C`, Secondary Green `#0B7A46`, Pale Green `#EAF6EF`, Neutral Canvas `#F5F7F6`, Neutral White `#FFFFFF`, Neutral Border `#D5DDD8`, Readonly Field `#F0F4F2`), badge color fidelity for Statuses and Priorities, Amber follow-up required badge styling, visible keyboard focus indicators (`#0B7A46`), and absence of text clipping or overlapping elements.
- **Responsive Viewport Testing**:
  - Scope: Automated viewport assertions on Desktop ($\ge 1280\text{px}$), Tablet ($768\text{px} - 1024\text{px}$), and Mobile ($375\text{px} - 480\text{px}$), asserting grid-to-card transformations, minimum touch targets ($\ge 44 \times 44\text{px}$), and zero unintended horizontal scrolling (`document.documentElement.scrollWidth <= window.innerWidth`).
- **Database Migration, Backfill & Data Preservation Testing**:
  - Scope: Verifying that Prisma migrations apply cleanly, existing ticket and user data from Labs 1–3 are preserved with zero loss, legacy tickets with 0 Actions Taken return `actionsTaken: []` without crashing, idempotent seed data correctly populates diverse test tickets across all 8 statuses, and rollback procedures are sound.
- **Role-Based Security & Authorization Testing**:
  - Invariants Tested: Server-side RBAC enforcement ensuring Requesters cannot create or edit Actions Taken, cannot access staff/admin dashboards, and cannot transition ticket statuses directly. IT Staff cannot view Admin user metrics. Unauthenticated callers are rejected with HTTP 401 across all endpoints.
- **Concurrency & Stale-Update Conflict Testing**:
  - Scope: Verifying that concurrent modifications to ticket status, advisory resolution, or Actions Taken supplying stale `expectedUpdatedAt` / `expectedTicketUpdatedAt` timestamps fail with HTTP 409 `STALE_UPDATE_CONFLICT`, preserving data consistency and avoiding race conditions.
- **End-to-End (E2E) Workflow Testing**:
  - Framework: Playwright multi-role browser automation.
  - Scope: Complete user journeys covering Actions Taken creation and edit, Ticket status transition and resolution gate enforcement, Requester advisory resolution flow, Requester Dashboard navigation and drill-down, IT Staff Dashboard metrics and quick actions, and Admin system metrics verification.

---

## 2. Planned Tests Catalog

### 2.1 Server Unit Tests (`server/tests/lab-04/`)

| Test ID | Level | AC / BR Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **UNIT-01** | Unit | BR-05 | Validation function for `followUpRequired` and `followUpNote` combinations | Rejects empty or whitespace notes when `followUpRequired = true`; allows null/omitted when `false` | `server/tests/lab-04/actions-taken.unit.test.ts` | `Passing` |
| **UNIT-02** | Unit | BR-08, BR-09, BR-11 | State machine status transition matrix helper validating all 18 permitted transitions | Returns `true` for all 18 valid transitions; returns `false` for all disallowed or terminal transitions | `server/tests/lab-04/ticket-workflow.unit.test.ts` | `Passing` |
| **UNIT-03** | Unit | BR-13, BR-14, BR-16 | Dashboard SQL aggregation query builders for Requester and Staff metrics | Generates correct Prisma `where` / `groupBy` clauses matching status, ownership, and role rules | `server/tests/lab-04/dashboard-metrics.unit.test.ts` | `Planned` |
| **UNIT-04** | Unit | BR-17 | Concurrency timestamp comparator helper | Accurately detects timestamp mismatch between client ISO string and DB `updatedAt` date | `server/tests/lab-04/actions-taken.unit.test.ts` | `Passing` |

---

### 2.2 Server API Tests (`server/tests/lab-04/`)

#### Actions Taken Endpoints (`server/tests/lab-04/actions-taken.api.test.ts`)

| Test ID | Level | AC / BR Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **API-01** | API | AC-01, BR-01, BR-02, BR-03 | IT Staff creates valid Action Taken on accessible ticket | HTTP 201 Created; record persisted; `performedById` auto-bound to auth user | `server/tests/lab-04/actions-taken.api.test.ts` | `Passing` |
| **API-02** | API | AC-02, BR-05 | Create Action Taken with `followUpRequired = true` and empty `followUpNote` | HTTP 400 Bad Request with code `FOLLOWUP_NOTE_REQUIRED` | `server/tests/lab-04/actions-taken.api.test.ts` | `Passing` |
| **API-02b** | API | BR-05 | Create Action Taken with `followUpRequired = true` and whitespace-only `followUpNote` | HTTP 400 Bad Request with code `FOLLOWUP_NOTE_REQUIRED` | `server/tests/lab-04/actions-taken.api.test.ts` | `Passing` |
| **API-02c** | API | BR-05 | Create Action Taken with `followUpRequired = false` and omitting `followUpNote` | HTTP 201 Created; `followUpNote` saved as null/undefined | `server/tests/lab-04/actions-taken.api.test.ts` | `Passing` |
| **API-03** | API | AC-03, BR-07 | Requester attempts to create Action Taken (`POST /actions-taken`) | HTTP 403 Forbidden with code `FORBIDDEN` | `server/tests/lab-04/actions-taken.api.test.ts` | `Passing` |
| **API-04** | API | AC-03, BR-07 | Requester attempts to update Action Taken (`PATCH /actions-taken/:id`) | HTTP 403 Forbidden with code `FORBIDDEN` | `server/tests/lab-04/actions-taken.api.test.ts` | `Passing` |
| **API-05** | API | AC-06, BR-03 | IT Staff updates Action Taken description/result | HTTP 200 OK; updated fields persisted; original `performedById` immutable | `server/tests/lab-04/actions-taken.api.test.ts` | `Passing` |
| **API-05b** | API | AC-06, BR-05 | IT Staff updates Action Taken to `followUpRequired = true` with valid `followUpNote` | HTTP 200 OK; follow-up note persisted | `server/tests/lab-04/actions-taken.api.test.ts` | `Passing` |
| **API-05c** | API | AC-06, BR-05 | IT Staff updates Action Taken to `followUpRequired = true` with empty note | HTTP 400 Bad Request with code `FOLLOWUP_NOTE_REQUIRED` | `server/tests/lab-04/actions-taken.api.test.ts` | `Passing` |
| **API-06** | API | AC-07, BR-12 | IT Staff attempts to add Action Taken to `CLOSED` or `CANCELLED` ticket | HTTP 400 Bad Request with code `TICKET_LOCKED` | `server/tests/lab-04/actions-taken.api.test.ts` | `Passing` |
| **API-07** | API | BR-17 | Create Action Taken with stale `expectedTicketUpdatedAt` timestamp | HTTP 409 Conflict with code `STALE_UPDATE_CONFLICT` | `server/tests/lab-04/actions-taken.api.test.ts` | `Passing` |
| **API-07b** | API | BR-17 | Update Action Taken with stale `expectedUpdatedAt` timestamp | HTTP 409 Conflict with code `STALE_UPDATE_CONFLICT` | `server/tests/lab-04/actions-taken.api.test.ts` | `Passing` |
| **API-08** | API | FR-05, BR-04 | Inactive IT Staff member attempts to create Action Taken | HTTP 400 Bad Request with code `INACTIVE_ACTOR_REJECTED` | `server/tests/lab-04/actions-taken.api.test.ts` | `Passing` |
| **API-08b** | API | FR-05, BR-04 | Inactive IT Staff member attempts to update an existing Action Taken | HTTP 400 Bad Request with code `INACTIVE_ACTOR_REJECTED` | `server/tests/lab-04/actions-taken.api.test.ts` | `Passing` |
| **API-09** | API | AC-04, AC-05, BR-06, BR-07 | Requester retrieves Actions Taken for owned ticket (`GET /actions-taken`) | HTTP 200 OK; returns actions list in chronological order (`actionDate ASC`) | `server/tests/lab-04/actions-taken.api.test.ts` | `Passing` |
| **API-10** | API | BR-07 | Requester attempts to retrieve Actions Taken for another requester's ticket | HTTP 403 Forbidden with code `FORBIDDEN` | `server/tests/lab-04/actions-taken.api.test.ts` | `Passing` |
| **API-11** | API | BR-01, Data Decision | Retrieve Actions Taken for legacy ticket with zero actions | HTTP 200 OK; returns empty array `[]` without error | `server/tests/lab-04/actions-taken.api.test.ts` | `Passing` |
| **API-12** | API | AC-22 | Unauthenticated caller attempts to query or mutate Actions Taken | HTTP 401 Unauthorized with code `SESSION_INVALID` | `server/tests/lab-04/actions-taken.api.test.ts` | `Passing` |

#### Ticket Lifecycle & Resolution Workflow (`server/tests/lab-04/ticket-workflow.api.test.ts`)

| Test ID | Level | AC / BR Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **API-13** | API | AC-08, BR-08, BR-09, BR-11 | **Complete Permitted Status Transition Matrix** — Verifies all 18 valid transitions:<br>• `NEW` $\rightarrow$ `OPEN`, `CANCELLED`<br>• `OPEN` $\rightarrow$ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`<br>• `IN_PROGRESS` $\rightarrow$ `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`<br>• `WAITING_FOR_REQUESTER` $\rightarrow$ `IN_PROGRESS`, `RESOLVED`, `CANCELLED`<br>• `RESOLVED` $\rightarrow$ `CLOSED`, `REOPENED`<br>• `REOPENED` $\rightarrow$ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED` | HTTP 200 OK; each permitted status transition successfully persists in the database | `server/tests/lab-04/ticket-workflow.api.test.ts` | `Passing` |
| **API-13b** | API | AC-08, BR-09, BR-11 | **Valid Resolution Gate Transition** — Active IT Staff/Admin transitions eligible ticket (`OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`) to `RESOLVED` with matching `expectedUpdatedAt` | HTTP 200 OK; status updated to `RESOLVED` | `server/tests/lab-04/ticket-workflow.api.test.ts` | `Passing` |
| **API-13c** | API | AC-08, AC-11, BR-09, BR-11 | **Resolution Gate Rejection (Unauthorized Role)** — Requester attempts transition to `RESOLVED` (`PATCH /api/v1/tickets/:id/status`) | HTTP 403 Forbidden with code `FORBIDDEN` | `server/tests/lab-04/ticket-workflow.api.test.ts` | `Passing` |
| **API-13d** | API | AC-12, BR-11, BR-17 | **Resolution Gate Rejection (Concurrency)** — Resolution attempt with stale `expectedUpdatedAt` timestamp | HTTP 409 Conflict with code `STALE_UPDATE_CONFLICT` | `server/tests/lab-04/ticket-workflow.api.test.ts` | `Passing` |
| **API-13e** | API | AC-08, AC-09, BR-09, BR-11 | **Resolution Gate Rejection (Ineligible Status)** — Authorized IT Staff/Admin attempts transition to `RESOLVED` from ineligible status (e.g. `NEW`, `CANCELLED`, `CLOSED`) | HTTP 400 Bad Request with code `INVALID_STATUS_TRANSITION` | `server/tests/lab-04/ticket-workflow.api.test.ts` | `Passing` |
| **API-14** | API | AC-09, BR-09, BR-11 | **Invalid Status Transition Matrix** — Verifies rejection of all prohibited transitions:<br>• Direct jumps from `NEW` to `RESOLVED`, `CLOSED`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`<br>• Backward jumps from `OPEN` to `NEW`, `CLOSED`, `REOPENED`<br>• Jumps from `IN_PROGRESS` to `NEW`, `OPEN`, `CLOSED`<br>• Jumps from `WAITING_FOR_REQUESTER` to `NEW`, `OPEN`, `CLOSED`<br>• Disallowed transitions from `RESOLVED` to `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `CANCELLED`<br>• Any transition from terminal `CLOSED` or `CANCELLED` | HTTP 400 Bad Request with code `INVALID_STATUS_TRANSITION` | `server/tests/lab-04/ticket-workflow.api.test.ts` | `Passing` |
| **API-15** | API | AC-10, BR-10, BR-11 | Requester indicates "Problem Appears Resolved" (`POST /resolve-indicator`) | HTTP 200 OK; sets `isResolvedByUser: true`; formal `status` remains unchanged | `server/tests/lab-04/ticket-workflow.api.test.ts` | `Passing` |
| **API-16** | API | BR-10 | Requester attempts advisory resolution on another user's ticket | HTTP 403 Forbidden with code `FORBIDDEN` | `server/tests/lab-04/ticket-workflow.api.test.ts` | `Passing` |
| **API-17** | API | AC-11, BR-09, BR-11 | Requester attempts direct status change (`PATCH /api/v1/tickets/:id/status`) | HTTP 403 Forbidden with code `FORBIDDEN` | `server/tests/lab-04/ticket-workflow.api.test.ts` | `Passing` |
| **API-18** | API | AC-12, BR-17 | Status transition with stale `expectedUpdatedAt` timestamp | HTTP 409 Conflict with code `STALE_UPDATE_CONFLICT` | `server/tests/lab-04/ticket-workflow.api.test.ts` | `Passing` |
| **API-18b** | API | BR-17 | Advisory resolution indicator with stale `expectedUpdatedAt` timestamp | HTTP 409 Conflict with code `STALE_UPDATE_CONFLICT` | `server/tests/lab-04/ticket-workflow.api.test.ts` | `Passing` |
| **API-19** | API | AC-13, BR-09, BR-12 | IT Staff transitions ticket from `RESOLVED` to `CLOSED` | HTTP 200 OK; status updated to terminal `CLOSED` | `server/tests/lab-04/ticket-workflow.api.test.ts` | `Passing` |
| **API-20** | API | AC-13, BR-09, BR-12 | Transition attempt from terminal status `CLOSED` or `CANCELLED` | HTTP 400 Bad Request with code `TICKET_LOCKED` | `server/tests/lab-04/ticket-workflow.api.test.ts` | `Passing` |
| **API-21** | API | AC-14, BR-09 | IT Staff transitions ticket from `RESOLVED` to `REOPENED` | HTTP 200 OK; status updated to `REOPENED` | `server/tests/lab-04/ticket-workflow.api.test.ts` | `Passing` |
| **API-22** | API | AC-14, BR-09 | Transition from `REOPENED` back into workflow (`IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`) | HTTP 200 OK; each permitted transition successfully persists | `server/tests/lab-04/ticket-workflow.api.test.ts` | `Passing` |

#### Requester Dashboard (`server/tests/lab-04/requester-dashboard.api.test.ts`)

| Test ID | Level | AC / BR Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **API-23** | API | AC-15, BR-13, BR-16 | Requester Dashboard returns authoritative counts (`openTickets`, `waitingForRequester`, `resolved`, `closed`) scoped to caller | HTTP 200 OK; accurate counts matching database records | `server/tests/lab-04/requester-dashboard.api.test.ts` | `Planned` |
| **API-24** | API | AC-16, BR-13 | Requester Dashboard for user with zero tickets | HTTP 200 OK; returns counts = 0, `recentTickets: []`, `recentlyResolvedTickets: []` | `server/tests/lab-04/requester-dashboard.api.test.ts` | `Planned` |
| **API-25** | API | BR-13 | Requester Dashboard recently resolved list limited to max 5 records | HTTP 200 OK; returns at most 5 records ordered by `updatedAt DESC` | `server/tests/lab-04/requester-dashboard.api.test.ts` | `Planned` |
| **API-26** | API | AC-22 | Unauthenticated caller requests Requester Dashboard | HTTP 401 Unauthorized with code `SESSION_INVALID` | `server/tests/lab-04/requester-dashboard.api.test.ts` | `Planned` |

#### IT Staff & Administrator Dashboards (`server/tests/lab-04/staff-dashboard.api.test.ts`)

| Test ID | Level | AC / BR Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **API-27** | API | AC-17, BR-14, BR-16 | Staff Dashboard returns 6 primary operational metrics (`newCount`, `openCount`, `inProgressCount`, `waitingForRequesterCount`, `myAssignedCount`, `unassignedCount`) | HTTP 200 OK; counts match database aggregations | `server/tests/lab-04/staff-dashboard.api.test.ts` | `Planned` |
| **API-28** | API | AC-17, BR-14 | Staff Dashboard returns priority attention counts (`urgentCount`, `highCount`) | HTTP 200 OK; accurate active counts matching priority filter | `server/tests/lab-04/staff-dashboard.api.test.ts` | `Planned` |
| **API-29** | API | BR-14 | Staff Dashboard returns current-user Actions Taken (`myActionsCount`, `myRecentActions` max 5) | HTTP 200 OK; returns actions where `performedById = callerId`, limited to 5 | `server/tests/lab-04/staff-dashboard.api.test.ts` | `Planned` |
| **API-29b** | API | AC-17, BR-14 | Staff Dashboard with zero matching operational records | HTTP 200 OK; all metric counts return 0, `myRecentActions = []`, `recentQueueTickets = []` | `server/tests/lab-04/staff-dashboard.api.test.ts` | `Planned` |
| **API-30** | API | AC-20, BR-14, BR-07 | Requester attempts to access Staff Dashboard (`GET /api/v1/dashboard/staff`) | HTTP 403 Forbidden with code `FORBIDDEN` | `server/tests/lab-04/staff-dashboard.api.test.ts` | `Planned` |
| **API-31** | API | AC-18, BR-15 | Administrator retrieves Staff Dashboard | HTTP 200 OK; includes staff metrics plus `userMetrics` (`activeUsers`, `activeStaff`, `activeAdmins`) | `server/tests/lab-04/staff-dashboard.api.test.ts` | `Planned` |
| **API-32** | API | BR-14, BR-15 | IT Staff retrieves Staff Dashboard | HTTP 200 OK; `userMetrics` is null or omitted from response | `server/tests/lab-04/staff-dashboard.api.test.ts` | `Planned` |
| **API-33** | API | AC-22 | Unauthenticated caller requests Staff Dashboard | HTTP 401 Unauthorized with code `SESSION_INVALID` | `server/tests/lab-04/staff-dashboard.api.test.ts` | `Planned` |

---

### 2.3 Performance-Smoke Tests (`server/tests/lab-04/performance-smoke.test.ts`)

> [!NOTE]
> Latency thresholds ($< 300\text{ms}$ for dashboards, $< 150\text{ms} / 200\text{ms}$ for Actions Taken) are project-defined engineering smoke thresholds intended for automated regression and bottleneck detection, rather than course-mandated performance targets.

| Test ID | Level | AC / BR Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **PERF-01** | Performance-Smoke | BR-13, BR-14, BR-16 | Requester and Staff Dashboard response times under representative seed dataset | Requester Dashboard latency $< 300\text{ms}$; Staff Dashboard latency $< 300\text{ms}$ (project-defined smoke thresholds) with zero SQL query errors | `server/tests/lab-04/performance-smoke.test.ts` | `Planned` |
| **PERF-02** | Performance-Smoke | BR-01, BR-06 | Actions Taken list query and create response latency under representative dataset | List retrieval $< 150\text{ms}$; creation $< 200\text{ms}$ (project-defined smoke thresholds) | `server/tests/lab-04/performance-smoke.test.ts` | `Planned` |

---

### 2.4 Client Component Tests (`client/tests/lab-04/`)

#### Actions Taken Component (`client/tests/lab-04/ActionsTakenSection.test.tsx`)

| Test ID | Level | AC / BR Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **UI-01** | UI | AC-01, FR-01 | Render "Add Action Taken" button on Ticket Detail for IT Staff | Button is visible and enabled for IT Staff and Admin | `client/tests/lab-04/ActionsTakenSection.test.tsx` | `Planned` |
| **UI-01b** | UI | FR-05, BR-04 | Add Action Taken button disabled if actor is inactive | Button disabled with safety tooltip indicating inactive account | `client/tests/lab-04/ActionsTakenSection.test.tsx` | `Planned` |
| **UI-01c** | UI | FR-05, BR-04 | Edit Action Taken button disabled if actor is inactive | Edit button disabled with safety tooltip indicating inactive account | `client/tests/lab-04/ActionsTakenSection.test.tsx` | `Planned` |
| **UI-02** | UI | AC-02, BR-05 | Create Action Taken form validates mandatory follow-up note when checkbox checked | Submit disabled or error rendered if `followUpRequired = true` and note is empty | `client/tests/lab-04/ActionsTakenSection.test.tsx` | `Planned` |
| **UI-03** | UI | AC-24, BR-18 | Form values preserved upon submission validation or network error | Input fields retain entered description, result, and notes; no data loss | `client/tests/lab-04/ActionsTakenSection.test.tsx` | `Planned` |
| **UI-04** | UI | AC-01, BR-03 | Modal displays authenticated user as Performer (read-only) | Performer field automatically displays current user's name | `client/tests/lab-04/ActionsTakenSection.test.tsx` | `Planned` |
| **UI-05** | UI | AC-05, BR-06 | Actions Taken list renders entries chronologically with badges | Renders date, description, result, contributor badge, and follow-up pill | `client/tests/lab-04/ActionsTakenSection.test.tsx` | `Planned` |
| **UI-06** | UI | AC-03, AC-04, BR-07 | Actions Taken section rendered for Requester on owned ticket | Actions list renders read-only; "Add Action Taken" and edit buttons are hidden | `client/tests/lab-04/ActionsTakenSection.test.tsx` | `Planned` |
| **UI-07** | UI | AC-06, BR-03 | Edit Action Taken modal pre-populates existing data and submits | Opens modal with populated fields; submits PATCH request successfully | `client/tests/lab-04/ActionsTakenSection.test.tsx` | `Planned` |
| **UI-08** | UI | AC-07, BR-12 | Actions Taken creation disabled on `CLOSED` or `CANCELLED` tickets | "Add Action Taken" button hidden or disabled with "Ticket is closed" message | `client/tests/lab-04/ActionsTakenSection.test.tsx` | `Planned` |

#### Ticket Lifecycle & Resolution Gate (`client/tests/lab-04/TicketResolution.test.tsx`)

| Test ID | Level | AC / BR Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **UI-09** | UI | AC-08, BR-09, BR-11 | Status dropdown displays only permitted next statuses per matrix | Dropdown contains only valid options according to current status | `client/tests/lab-04/TicketResolution.test.tsx` | `Planned` |
| **UI-10** | UI | AC-09, BR-09 | Status dropdown excludes invalid transition jumps | Disallowed statuses (e.g. `RESOLVED` from `NEW`) are omitted from options | `client/tests/lab-04/TicketResolution.test.tsx` | `Planned` |
| **UI-11** | UI | AC-10, BR-10 | Requester "Problem Appears Resolved" button action | Displays advisory confirmation banner; status badge remains unchanged | `client/tests/lab-04/TicketResolution.test.tsx` | `Planned` |
| **UI-12** | UI | AC-11, BR-09 | Requester view hides direct status change controls | Status change dropdown and save buttons are hidden from Requesters | `client/tests/lab-04/TicketResolution.test.tsx` | `Planned` |
| **UI-13** | UI | AC-12, BR-17 | Stale-update conflict banner displayed on HTTP 409 response | Displays warning banner with "Refresh Ticket" CTA; prevents silent override | `client/tests/lab-04/TicketResolution.test.tsx` | `Planned` |
| **UI-14** | UI | AC-13, BR-12 | Ticket detail in `CLOSED` status displays read-only banner | All operational editing controls are disabled/hidden | `client/tests/lab-04/TicketResolution.test.tsx` | `Planned` |
| **UI-15** | UI | AC-14, BR-09 | Status dropdown for `RESOLVED` ticket displays `CLOSED` and `REOPENED` | Only `CLOSED` and `REOPENED` appear as permitted choices | `client/tests/lab-04/TicketResolution.test.tsx` | `Planned` |

#### Requester Dashboard (`client/tests/lab-04/RequesterDashboard.test.tsx`)

| Test ID | Level | AC / BR Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **UI-16** | UI | AC-15, BR-13 | Requester Dashboard renders 4 primary metric cards | Displays `My Open Tickets`, `Waiting for Requester`, `Resolved`, `Closed` | `client/tests/lab-04/RequesterDashboard.test.tsx` | `Planned` |
| **UI-17** | UI | AC-16, BR-13 | Requester Dashboard empty state when ticket count is 0 | Renders 0 count cards, accessible empty state message, and "+ Create Ticket" CTA | `client/tests/lab-04/RequesterDashboard.test.tsx` | `Planned` |
| **UI-21** | UI | AC-19, BR-13 | Clicking Requester metric card navigates to filtered My Tickets | Card click routes to `/my-tickets?status=...` with corresponding filter | `client/tests/lab-04/RequesterDashboard.test.tsx` | `Planned` |

#### IT Staff & Administrator Dashboards (`client/tests/lab-04/StaffDashboard.test.tsx`)

| Test ID | Level | AC / BR Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **UI-18** | UI | AC-17, BR-14 | Staff Dashboard renders 6 primary operational metric cards | Displays `New`, `Open`, `In Progress`, `Waiting Req`, `My Assigned`, `Unassigned` | `client/tests/lab-04/StaffDashboard.test.tsx` | `Planned` |
| **UI-19** | UI | AC-17, BR-14 | Staff Dashboard renders Priority Attention strip and My Recent Actions | Displays `Urgent` and `High` count badges; renders current user's recent actions table | `client/tests/lab-04/StaffDashboard.test.tsx` | `Planned` |
| **UI-20** | UI | AC-18, BR-15 | Admin view renders System User Metrics panel | Displays `Active Users`, `Active Staff`, `Active Admins` cards for Admin role | `client/tests/lab-04/StaffDashboard.test.tsx` | `Planned` |
| **UI-22** | UI | AC-19, BR-14 | Clicking Staff metric card navigates to filtered Ticket Queue | Card click routes to `/staff/tickets?status=...` or `?ownership=...` | `client/tests/lab-04/StaffDashboard.test.tsx` | `Planned` |
| **UI-23** | UI | AC-20, BR-14, BR-07 | Non-staff user attempting to access `/dashboard` as staff | Redirects or displays 403 Forbidden screen | `client/tests/lab-04/StaffDashboard.test.tsx` | `Planned` |
| **UI-24** | UI | AC-22 | Unauthenticated user accessing `/dashboard` | Redirects to `/login` with redirect parameter | `client/tests/lab-04/StaffDashboard.test.tsx` | `Planned` |
| **UI-25** | UI | AC-24, BR-18 | Network error banner renders on dashboard fetch failure | Displays retry button without unhandled crash | `client/tests/lab-04/StaffDashboard.test.tsx` | `Planned` |
| **UI-26** | UI | AC-25, BR-19 | Double-click prevention on Action Taken submission and status change | Submit button disables and displays spinner while request is in-flight | `client/tests/lab-04/ActionsTakenSection.test.tsx` | `Planned` |

---

### 2.5 End-to-End Test Scenarios (`e2e/lab-04/`)

| Test ID | Level | AC / BR Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **E2E-01** | E2E | AC-01, AC-05, AC-06, BR-02, BR-03, BR-19 | IT Staff creates and edits Action Taken on open ticket; double-click guard | Entry appears chronologically; contributor name auto-attributed; edit updates row | `e2e/lab-04/actions-taken.spec.ts` | `Planned` |
| **E2E-02** | E2E | AC-02, BR-05 | IT Staff checks "Follow-up Required" in modal without entering note | Validation error displayed; submission blocked until note is entered | `e2e/lab-04/actions-taken.spec.ts` | `Planned` |
| **E2E-03** | E2E | AC-03, AC-04, BR-07 | Requester views owned ticket with multiple Actions Taken | Entries displayed clearly in read-only mode; write buttons strictly absent | `e2e/lab-04/actions-taken.spec.ts` | `Planned` |
| **E2E-04** | E2E | AC-08, AC-09, AC-10, AC-11, BR-09, BR-10, BR-11 | Full Resolution Gate flow: Requester advisory signal $\rightarrow$ IT Staff review $\rightarrow$ formal resolution | Requester indicates resolution; IT Staff reviews advisory badge and resolves ticket | `e2e/lab-04/ticket-workflow.spec.ts` | `Planned` |
| **E2E-05** | E2E | AC-07, AC-13, AC-14, BR-12 | Ticket closure and reopen cycle; action logging lock on closed ticket | Staff closes resolved ticket; further actions locked; staff reopens ticket | `e2e/lab-04/ticket-workflow.spec.ts` | `Planned` |
| **E2E-06** | E2E | AC-12, BR-17 | Concurrent edit collision simulation (stale `updatedAt`) | Second actor receives 409 conflict dialog; can refresh and preserve state | `e2e/lab-04/ticket-workflow.spec.ts` | `Planned` |
| **E2E-07** | E2E | AC-15, AC-16, AC-19, AC-20, BR-13 | Requester Dashboard journey: metric cards, recent tickets, drill-down | Cards show correct counts; clicking card filters My Tickets; zero-count empty state | `e2e/lab-04/dashboards.spec.ts` | `Planned` |
| **E2E-08** | E2E | AC-17, AC-19, BR-14 | IT Staff Dashboard journey: 6 metric cards, priority strip, my actions, drill-down | Displays queue counts; clicking card filters staff queue; my actions drill down | `e2e/lab-04/dashboards.spec.ts` | `Planned` |
| **E2E-09** | E2E | AC-18, BR-15 | Administrator Dashboard journey: staff metrics + user account summary | Admin view displays active user/staff/admin counters with navigation links | `e2e/lab-04/dashboards.spec.ts` | `Planned` |
| **E2E-10** | E2E | AC-21, FR-17 | **Full Regression Suite across Labs 1–3** under authenticated Sprint 4 system:<br>• **Lab 1**: Category listing, system health check, and base reference data<br>• **Lab 2**: Requester flow, ticket creation, My Tickets table (search, filter, pagination), Ticket Detail, and attachments (upload, download, soft-delete)<br>• **Lab 3**: JWT authentication, RBAC boundaries, mandatory password change, IT Staff Queue & claiming, public comments feed, amber internal notes, and Admin user management | All legacy workflows across Labs 1, 2, and 3 execute successfully with zero functional regressions, maintaining full backward compatibility | `e2e/lab-04/regression.spec.ts` | `Planned` |

---

### 2.6 UI Style & Visual Invariant Tests (`VIS-01` to `VIS-04`)

| Test ID | Level | Requirement Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **VIS-01** | Style | Section 9, Zen Green | Zen Green token fidelity across dashboard cards, header, and buttons | Computed styles match `#006B3C`, `#0B7A46`, `#EAF6EF`, `#D5DDD8` | `client/tests/lab-04/ui-style.test.tsx` | `Planned` |
| **VIS-02** | Style | Section 9, Badges | Status and Priority badge color tokens and Follow-up pill styling | Follow-up pill renders Amber (`#D97706` / `#FEF3C7`); badges conform to spec | `client/tests/lab-04/ui-style.test.tsx` | `Planned` |
| **VIS-03** | Style | Section 9, A11y | Keyboard focus outlines and active indicators on all dashboard cards and modal inputs | Visible `#0B7A46` focus ring ($2\text{px}$ offset) on keyboard tab focus | `client/tests/lab-04/accessibility.test.tsx` | `Planned` |
| **VIS-04** | Style | Section 9, Typography | Zero text clipping and element overlap on long descriptions and dense data | Long text wraps cleanly with `break-words`; metric numbers fit within cards | `e2e/helpers/visual-check.ts` | `Planned` |

---

### 2.7 Responsive Viewport Tests (`RESP-01` to `RESP-04`)

| Test ID | Level | Viewport Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **RESP-01** | Responsive | Desktop ($\ge 1280\text{px}$) | Multi-column grid on Dashboards (3-col / 6-col cards) and side-by-side Ticket Detail | Layout renders cleanly with multi-column alignment and zero wrapping defects | `e2e/lab-04/responsive.spec.ts` | `Planned` |
| **RESP-02** | Responsive | Tablet ($768\text{px} - 1024\text{px}$) | 2-column metric cards grid, condensed action rows, sticky headers | Cards adapt cleanly to 2 columns; table horizontal scroll contained | `e2e/lab-04/responsive.spec.ts` | `Planned` |
| **RESP-03** | Responsive | Mobile ($375\text{px} - 480\text{px}$) | 1-column stacked cards, full-width modals, touch targets $\ge 44 \times 44\text{px}$ | Stacked layout renders cleanly; buttons and form controls meet $44\text{px}$ touch target | `e2e/lab-04/responsive.spec.ts` | `Planned` |
| **RESP-04** | Responsive | Mobile & Tablet | Zero unintended horizontal scrolling / page overflow | `document.documentElement.scrollWidth <= window.innerWidth` asserts true on all views | `e2e/lab-04/responsive.spec.ts` | `Planned` |

---

### 2.8 Database Migration & Regression Tests (`MIG-01` to `MIG-04`)

| Test ID | Level | Migration Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **MIG-01** | Migration | Section 7.1, 7.3 | Prisma migration execution with zero data loss on existing tables | Existing `Ticket`, `User`, `Attachment`, `Comment`, `InternalNote` records preserved | `server/tests/lab-04/migration-regression.test.ts` | `Passing` |
| **MIG-02** | Migration | Section 7.3, BR-01 | Legacy ticket query tolerance with zero Actions Taken | Legacy tickets load cleanly without error; `actionsTaken` defaults to `[]` | `server/tests/lab-04/migration-regression.test.ts` | `Passing` |
| **MIG-03** | Migration | Section 7.4 | Idempotent seed script execution across multiple runs | Re-running seed preserves uniqueness, seeds all 8 statuses, and populates diverse actions | `server/tests/lab-04/migration-regression.test.ts` | `Passing` |
| **MIG-04** | Regression | Section 4.4, FR-17 | Full regression verification across Labs 1, 2, and 3 APIs | Requester tickets, attachments, comments, notes, and user admin pass 100% | `server/tests/lab-04/migration-regression.test.ts` | `Passing` |

---

## 3. Dual Traceability Matrix

### 3.1 Acceptance Criteria Traceability Matrix (AC-01 through AC-25)

Every Acceptance Criterion from `docs/lab-04/specification.md` is strictly mapped to its primary automated tests:

| Acceptance Criterion | Description Summary | Primary Automated Tests | Test Level |
| :--- | :--- | :--- | :--- |
| **AC-01** | Valid Action Taken creation with auto `performedBy` attribution | `UNIT-01`, `API-01`, `UI-01`, `UI-04`, `E2E-01` | Unit, API, UI, E2E |
| **AC-02** | Mandatory follow-up note validation when `followUpRequired = true` | `UNIT-01`, `API-02`, `API-02b`, `UI-02`, `E2E-02` | Unit, API, UI, E2E |
| **AC-03** | Requester forbidden from creating or updating Actions Taken | `API-03`, `API-04`, `UI-06`, `E2E-03` | API, UI, E2E |
| **AC-04** | Requester read-only view of Actions Taken on owned tickets | `API-09`, `UI-06`, `E2E-03` | API, UI, E2E |
| **AC-05** | Actions Taken record displays complete operational attributes | `API-09`, `UI-05`, `E2E-01` | API, UI, E2E |
| **AC-06** | IT Staff updates existing Action Taken details | `API-05`, `API-05b`, `UI-07`, `E2E-01` | API, UI, E2E |
| **AC-07** | Actions Taken creation locked on `CLOSED` or `CANCELLED` tickets | `UNIT-02`, `API-06`, `UI-08`, `E2E-05` | Unit, API, UI, E2E |
| **AC-08** | Permitted status transitions per matrix and valid resolution gate | `UNIT-02`, `API-13`, `API-13b`, `API-13c`, `UI-09`, `E2E-04` | Unit, API, UI, E2E |
| **AC-09** | Invalid status transition jump rejected (HTTP 400) | `UNIT-02`, `API-13e`, `API-14`, `UI-10`, `E2E-04` | Unit, API, UI, E2E |
| **AC-10** | Requester advisory "Problem Appears Resolved" indication | `API-15`, `UI-11`, `E2E-04` | API, UI, E2E |
| **AC-11** | Requester direct status transition attempt rejected (HTTP 403) | `API-13c`, `API-17`, `UI-12`, `E2E-04` | API, UI, E2E |
| **AC-12** | Stale status update rejected with HTTP 409 Conflict | `UNIT-04`, `API-13d`, `API-18`, `API-18b`, `UI-13`, `E2E-06` | Unit, API, UI, E2E |
| **AC-13** | Ticket closure terminal state enforcement | `UNIT-02`, `API-19`, `API-20`, `UI-14`, `E2E-05` | Unit, API, UI, E2E |
| **AC-14** | Reopening resolved ticket resumes active workflow | `UNIT-02`, `API-21`, `API-22`, `UI-15`, `E2E-05` | Unit, API, UI, E2E |
| **AC-15** | Requester Dashboard authoritative metrics for owned tickets | `UNIT-03`, `API-23`, `PERF-01`, `UI-16`, `E2E-07` | Unit, API, Perf, UI, E2E |
| **AC-16** | Requester Dashboard empty state with zero tickets | `API-24`, `UI-17`, `E2E-07` | API, UI, E2E |
| **AC-17** | IT Staff Dashboard operational metrics & my recent actions | `UNIT-03`, `API-27`, `API-28`, `API-29`, `API-29b`, `PERF-01`, `UI-18`, `UI-19`, `E2E-08` | Unit, API, Perf, UI, E2E |
| **AC-18** | Administrator Dashboard includes user account metrics | `API-31`, `UI-20`, `E2E-09` | API, UI, E2E |
| **AC-19** | Metric card drill-down navigation to filtered lists | `UI-21`, `UI-22`, `E2E-07`, `E2E-08` | UI, E2E |
| **AC-20** | Requester access to IT Staff Dashboard forbidden (HTTP 403) | `API-30`, `UI-23` | API, UI |
| **AC-21** | Zero regression across all Lab 1–3 functionality | `MIG-01`, `MIG-02`, `MIG-04`, `E2E-10` | Migration, E2E |
| **AC-22** | Unauthenticated requests rejected with HTTP 401 | `API-12`, `API-26`, `API-33`, `UI-24` | API, UI |
| **AC-23** | Responsive layouts across Mobile ($375\text{px}$) and Tablet ($768\text{px}$) with $\ge 44\text{px}$ targets | `RESP-01`, `RESP-02`, `RESP-03`, `RESP-04` | Responsive |
| **AC-24** | Form values preserved on submission validation or network failure | `UI-03`, `UI-25` | UI |
| **AC-25** | Double-click prevention on action logging and status updates | `UI-26`, `E2E-01` | UI, E2E |

---

### 3.2 Business Rules Traceability Matrix (BR-01 through BR-19)

Every Business Rule from `docs/lab-04/specification.md` is mapped to its automated verification tests:

| BR ID | Business Rule Summary | Automated Verification Tests | Test Level |
| :--- | :--- | :--- | :--- |
| **BR-01** | Action Taken belongs to exactly one Ticket (Parent-Child) | `API-01`, `API-11`, `PERF-02`, `MIG-01`, `MIG-02` | API, Perf, Migration |
| **BR-02** | Ticket Owner coordinates overall ticket; actions may be logged by different staff | `API-01`, `API-05`, `E2E-01` | API, E2E |
| **BR-03** | `performedById` is authoritative and immutable once created | `API-01`, `API-05`, `UI-04`, `E2E-01` | API, UI, E2E |
| **BR-04** | Calling actor must have active account (`isActive = true`) on create and update; historical contributors preserved | `API-08`, `API-08b`, `UI-01b`, `UI-01c` | API, UI |
| **BR-05** | Mandatory `followUpNote` when `followUpRequired = true`; optional when false | `UNIT-01`, `API-02`, `API-02b`, `API-02c`, `UI-02`, `E2E-02` | Unit, API, UI, E2E |
| **BR-06** | Actions Taken entries chronologically ordered by `actionDate ASC` | `API-09`, `PERF-02`, `UI-05`, `E2E-01` | API, Perf, UI, E2E |
| **BR-07** | Requesters possess read-only visibility on owned tickets; write actions and staff dashboard forbidden | `API-03`, `API-04`, `API-09`, `API-10`, `API-30`, `UI-06`, `UI-23`, `E2E-03` | API, UI, E2E |
| **BR-08** | Canonical ticket lifecycle supports 8 discrete statuses | `UNIT-02`, `API-13`, `API-14`, `UI-09`, `MIG-03` | Unit, API, UI, Migration |
| **BR-09** | Permitted status transitions strictly governed by transition matrix (all 18 transitions) | `UNIT-02`, `API-13`, `API-14`, `API-19`, `API-20`, `API-21`, `API-22`, `UI-09`, `UI-10`, `E2E-04`, `E2E-05` | Unit, API, UI, E2E |
| **BR-10** | Requester "Problem Appears Resolved" flag is strictly advisory | `API-15`, `API-16`, `UI-11`, `E2E-04` | API, UI, E2E |
| **BR-11** | Backend Resolution Gate rule: Authorized role, eligible status, decoupled indicator, concurrency guard | `UNIT-02`, `API-13b`, `API-13c`, `API-13d`, `API-14`, `API-15`, `API-17`, `API-18`, `UI-09`, `UI-11`, `E2E-04` | Unit, API, UI, E2E |
| **BR-12** | `CLOSED` and `CANCELLED` tickets are terminal and immutable | `UNIT-02`, `API-06`, `API-19`, `API-20`, `UI-08`, `UI-14`, `E2E-05` | Unit, API, UI, E2E |
| **BR-13** | Requester Dashboard authoritative metric calculations and deterministic limits (max 5) | `UNIT-03`, `API-23`, `API-24`, `API-25`, `PERF-01`, `UI-16`, `UI-17`, `E2E-07` | Unit, API, Perf, UI, E2E |
| **BR-14** | IT Staff Dashboard authoritative calculations: 6 cards, priority strip, my actions (max 5), staff authorization | `UNIT-03`, `API-27`, `API-28`, `API-29`, `API-29b`, `API-30`, `PERF-01`, `UI-18`, `UI-19`, `UI-23`, `E2E-08` | Unit, API, Perf, UI, E2E |
| **BR-15** | Administrator Dashboard inherits operational metrics + user account summary | `API-31`, `API-32`, `UI-20`, `E2E-09` | API, UI, E2E |
| **BR-16** | Backend-authoritative database SQL aggregations for dashboard metrics | `UNIT-03`, `API-23`, `API-27`, `API-31`, `PERF-01` | Unit, API, Perf |
| **BR-17** | Mandatory optimistic concurrency control (`expectedUpdatedAt` / `expectedTicketUpdatedAt`) | `UNIT-04`, `API-07`, `API-07b`, `API-18`, `API-18b`, `UI-13`, `E2E-06` | Unit, API, UI, E2E |
| **BR-18** | Client input forms preserve entered values upon validation or network error | `UI-03`, `UI-25` | UI |
| **BR-19** | Double-clicking submission buttons or rapid requests debounced/disabled | `UI-26`, `E2E-01` | UI, E2E |

---

### 3.3 Functional Requirements Traceability Matrix (FR-01 through FR-20)

| FR ID | Requirement Summary | Automated Verification Tests | Test Level |
| :--- | :--- | :--- | :--- |
| **FR-01** | IT Staff and Admin create Actions Taken under accessible tickets | `API-01`, `UI-01`, `E2E-01` | API, UI, E2E |
| **FR-02** | Automatic binding of `performedBy` to authenticated user session | `API-01`, `UI-04`, `E2E-01` | API, UI, E2E |
| **FR-03** | IT Staff and Admin update existing Actions Taken entries | `API-05`, `UI-07`, `E2E-01` | API, UI, E2E |
| **FR-04** | Mandatory `followUpNote` when `followUpRequired = true` | `UNIT-01`, `API-02`, `API-02b`, `UI-02`, `E2E-02` | Unit, API, UI, E2E |
| **FR-05** | Inactive user account rejected on create and update with `INACTIVE_ACTOR_REJECTED` | `API-08`, `API-08b`, `UI-01b`, `UI-01c` | API, UI |
| **FR-06** | Requester read-only view on owned tickets; write actions forbidden | `API-03`, `API-04`, `API-09`, `UI-06`, `E2E-03` | API, UI, E2E |
| **FR-07** | Prohibit recording Actions Taken on `CLOSED` or `CANCELLED` tickets | `UNIT-02`, `API-06`, `UI-08`, `E2E-05` | Unit, API, UI, E2E |
| **FR-08** | Enforce permitted status transitions across all 8 statuses | `UNIT-02`, `API-13`, `API-13b`, `UI-09`, `E2E-04` | Unit, API, UI, E2E |
| **FR-09** | Reject disallowed transitions with `INVALID_STATUS_TRANSITION` | `UNIT-02`, `API-14`, `UI-10`, `E2E-04` | Unit, API, UI, E2E |
| **FR-10** | Requester advisory resolution indicator (`isResolvedByUser = true`) | `API-15`, `UI-11`, `E2E-04` | API, UI, E2E |
| **FR-11** | Formal resolution transition executed exclusively by IT Staff / Admin | `API-13b`, `API-13c`, `API-17`, `UI-09`, `UI-12`, `E2E-04` | API, UI, E2E |
| **FR-12** | Optimistic concurrency collision returns `STALE_UPDATE_CONFLICT` | `UNIT-04`, `API-07`, `API-13d`, `API-18`, `UI-13`, `E2E-06` | Unit, API, UI, E2E |
| **FR-13** | Requester Dashboard endpoint returning scoped metrics and recent items | `UNIT-03`, `API-23`, `API-24`, `API-25`, `PERF-01`, `UI-16`, `E2E-07` | Unit, API, Perf, UI, E2E |
| **FR-14** | IT Staff Dashboard endpoint returning operational metrics and my actions | `UNIT-03`, `API-27`, `API-28`, `API-29`, `API-29b`, `PERF-01`, `UI-18`, `UI-19`, `E2E-08` | Unit, API, Perf, UI, E2E |
| **FR-15** | Admin Dashboard returning operational metrics plus user account summary | `API-31`, `UI-20`, `E2E-09` | API, UI, E2E |
| **FR-16** | Dashboard metric cards provide accessible drill-down filter navigation | `UI-21`, `UI-22`, `E2E-07`, `E2E-08` | UI, E2E |
| **FR-17** | 100% backward compatibility with Labs 1, 2, and 3 | `MIG-01`, `MIG-02`, `MIG-04`, `E2E-10` | Migration, E2E |
| **FR-18** | Application shell displays role navigation with Dashboard as landing page | `UI-16`, `UI-18`, `E2E-07`, `E2E-08` | UI, E2E |
| **FR-19** | Client handles loading, empty, forbidden, stale, and network errors safely | `UI-13`, `UI-17`, `UI-23`, `UI-25` | UI |
| **FR-20** | Interactive controls meet WCAG standards ($\ge 44\text{px}$ targets, focus rings) | `VIS-03`, `RESP-03`, `client/tests/lab-04/accessibility.test.tsx` | Style, Responsive |

---

## 4. Test Execution Instructions

### 4.1 Server Unit & Performance-Smoke Tests
```bash
# Run backend unit tests
cd server
npm test -- tests/lab-04/*.unit.test.ts

# Run performance-smoke tests
npm test -- tests/lab-04/performance-smoke.test.ts
```

### 4.2 Server API & Migration Tests
```bash
# Run all Lab 4 backend tests
cd server
npm test -- tests/lab-04/

# Run individual Lab 4 test suites
npm test -- tests/lab-04/actions-taken.api.test.ts
npm test -- tests/lab-04/ticket-workflow.api.test.ts
npm test -- tests/lab-04/requester-dashboard.api.test.ts
npm test -- tests/lab-04/staff-dashboard.api.test.ts
npm test -- tests/lab-04/migration-regression.test.ts
```

### 4.3 Client Component & Style Tests
```bash
# Run all Lab 4 frontend component tests
cd client
npm test -- tests/lab-04/

# Run individual Lab 4 test suites
npm test -- tests/lab-04/ActionsTakenSection.test.tsx
npm test -- tests/lab-04/TicketResolution.test.tsx
npm test -- tests/lab-04/RequesterDashboard.test.tsx
npm test -- tests/lab-04/StaffDashboard.test.tsx
npm test -- tests/lab-04/ui-style.test.tsx
npm test -- tests/lab-04/accessibility.test.tsx
```

### 4.4 End-to-End & Responsive Playwright Tests
```bash
# Run Playwright E2E tests for Lab 4
npx playwright test e2e/lab-04/

# Run specific E2E suites with visible browser
npx playwright test e2e/lab-04/actions-taken.spec.ts --headed
npx playwright test e2e/lab-04/ticket-workflow.spec.ts --headed
npx playwright test e2e/lab-04/dashboards.spec.ts --headed
npx playwright test e2e/lab-04/regression.spec.ts --headed

# Run responsive viewport tests across projects
npx playwright test e2e/lab-04/responsive.spec.ts --project=desktop
npx playwright test e2e/lab-04/responsive.spec.ts --project=tablet
npx playwright test e2e/lab-04/responsive.spec.ts --project=mobile
```

### 4.5 Full Regression Suite (Lab 1 + Lab 2 + Lab 3 + Lab 4)
```bash
# Run all server tests across all labs
npm --prefix server test

# Run all client tests across all labs
npm --prefix client test

# Run full end-to-end regression suite
npx playwright test
```

---

## 5. Responsive Visual Inspection Checklist & Screenshot Evidence

All screenshots will be captured during automated Playwright E2E execution and stored under `artifacts/lab-04/screenshots/`.

### 5.1 Screenshot Inventory

| Category | Filename | Viewport / Dimensions | Description | Verification Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **IT Staff Dashboard** | `01-staff-dashboard-desktop.png` | Desktop ($1280 \times 800$) | Full IT Staff Dashboard with 6 metric cards | Zen Green layout, 6 primary metric cards, Priority strip, My Actions table |
| **IT Staff Dashboard** | `01-staff-dashboard-tablet.png` | Tablet ($820 \times 1180$) | IT Staff Dashboard on tablet viewport | 2-column cards layout, responsive actions table |
| **IT Staff Dashboard** | `01-staff-dashboard-mobile.png` | Mobile ($375 \times 667$) | IT Staff Dashboard mobile stacked view | 1-column stacked cards, touch targets $\ge 44\text{px}$, zero overflow |
| **Requester Dashboard** | `02-requester-dashboard-desktop.png` | Desktop ($1280 \times 800$) | Requester Dashboard with 4 metric cards | 4 primary metric cards, Recent Tickets, Recently Resolved tickets |
| **Requester Dashboard** | `02-requester-dashboard-tablet.png` | Tablet ($820 \times 1180$) | Requester Dashboard on tablet viewport | 2-column cards, accessible filter links |
| **Requester Dashboard** | `02-requester-dashboard-mobile.png` | Mobile ($375 \times 667$) | Requester Dashboard mobile stacked view | 1-column cards, touch-friendly CTA buttons |
| **Ticket Detail (Actions)**| `03-ticket-detail-actions-taken-desktop.png` | Desktop ($1280 \times 800$) | Actions Taken section on Ticket Detail | Chronological actions list, Performer badge, Follow-up indicator, Add button |
| **Ticket Detail (Actions)**| `03-ticket-detail-actions-taken-tablet.png` | Tablet ($820 \times 1180$) | Actions Taken on tablet viewport | Responsive layout, visible badges, accessible edit trigger |
| **Ticket Detail (Actions)**| `03-ticket-detail-actions-taken-mobile.png` | Mobile ($375 \times 667$) | Actions Taken on mobile viewport | Stacked action items, touch targets $\ge 44\text{px}$, zero horizontal overflow |
| **Actions Taken Modal** | `04-action-taken-modal-desktop.png` | Desktop ($1280 \times 800$) | Create/Edit Action Taken modal | Modal overlay, Performer display, follow-up checklist & note input |
| **Actions Taken Modal** | `04-action-taken-modal-tablet.png` | Tablet ($820 \times 1180$) | Action Taken modal on tablet | Centered modal, form fields properly padded |
| **Actions Taken Modal** | `04-action-taken-modal-mobile.png` | Mobile ($375 \times 667$) | Action Taken modal on mobile | Full-width modal sheet, touch-friendly submit button |
| **Resolution Gate** | `05-ticket-resolution-gate-desktop.png` | Desktop ($1280 \times 800$) | Status transition dropdown with Resolution Gate | Only permitted next statuses shown; resolution confirmation dialog |
| **Resolution Gate** | `05-ticket-resolution-gate-tablet.png` | Tablet ($820 \times 1180$) | Resolution Gate controls on tablet | Accessible dropdown select, clear warning cues |
| **Resolution Gate** | `05-ticket-resolution-gate-mobile.png` | Mobile ($375 \times 667$) | Resolution Gate controls and modal on mobile | Full-width modal sheet, touch targets $\ge 44\text{px}$, zero overflow |
| **Advisory Resolution** | `06-requester-resolve-indicator-desktop.png` | Desktop ($1280 \times 800$) | Requester advisory "Problem Appears Resolved" | Advisory banner displayed; formal status remains unchanged |
| **Advisory Resolution** | `06-requester-resolve-indicator-tablet.png` | Tablet ($820 \times 1180$) | Advisory resolution banner on tablet | Responsive layout, visible advisory confirmation cues |
| **Advisory Resolution** | `06-requester-resolve-indicator-mobile.png` | Mobile ($375 \times 667$) | Advisory resolution button and banner on mobile | Touch-friendly action button $\ge 44\text{px}$, clear advisory text |
| **Concurrency Conflict**| `07-concurrency-conflict-banner-desktop.png` | Desktop ($1280 \times 800$) | Stale update HTTP 409 conflict banner | Non-destructive conflict banner with "Refresh" CTA; user input preserved |
| **Concurrency Conflict**| `07-concurrency-conflict-banner-tablet.png` | Tablet ($820 \times 1180$) | Stale update conflict banner on tablet | Accessible conflict notification and "Refresh" trigger without text truncation |
| **Concurrency Conflict**| `07-concurrency-conflict-banner-mobile.png` | Mobile ($375 \times 667$) | Stale update conflict banner on mobile | Full-width warning banner, preserved form fields, touch-friendly refresh CTA |
| **Admin Dashboard** | `08-admin-dashboard-desktop.png` | Desktop ($1280 \times 800$) | Administrator Dashboard with User Metrics | Staff operational metrics plus System User accounts summary panel |
| **Admin Dashboard** | `08-admin-dashboard-tablet.png` | Tablet ($820 \times 1180$) | Administrator Dashboard on tablet viewport | 2-column cards layout for staff metrics and system user summary |
| **Admin Dashboard** | `08-admin-dashboard-mobile.png` | Mobile ($375 \times 667$) | Administrator Dashboard on mobile viewport | 1-column stacked cards, legible user counters, zero horizontal scroll |

### 5.2 Responsive Visual Inspection Checklist

- [ ] **Zero Horizontal Overflow (`RESP-04`)**: `document.documentElement.scrollWidth <= window.innerWidth` verified by `assertNoHorizontalOverflow()` across all screens in Desktop ($1280\text{px}$), Tablet ($820\text{px}$), and Mobile ($375\text{px}$).
- [ ] **Touch Targets $\ge 44 \times 44\text{px}$ (`RESP-03`)**: Buttons, modal close triggers, and form inputs meet or exceed $44 \times 44\text{px}$ hit areas.
- [ ] **Brand Token Fidelity (`VIS-01`)**: Header, metric card accents, and primary action buttons conform to `#006B3C` (Zen Green).
- [ ] **Follow-up Pill Visual Distinction (`VIS-02`)**: Amber theme (`#D97706` / `#FEF3C7`) clearly differentiates Actions Taken requiring follow-up.
- [ ] **Visible Focus Rings (`VIS-03`)**: High-contrast keyboard focus indicators (`#0B7A46`, $2\text{px}$ ring) visible on all interactive elements.
- [ ] **Form State Preservation (`BR-18`, `UI-03`)**: Form inputs retain user input after validation errors or HTTP 409 stale-update conflicts.
- [ ] **Double-Click Protection (`BR-19`, `UI-26`)**: In-flight requests disable submit buttons to prevent duplicate database entries.
