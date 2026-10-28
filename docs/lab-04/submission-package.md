# CPE334 Lab 4 Submission — TokTickIT

**Course:** CPE 334 Software Engineering — Lab 4 (Sprint 4)  
**Student Name:** Pilaiwan Churdchu  
**Student ID:** 67070503492  
**GitHub Username:** [@Pilaiwan3492](https://github.com/Pilaiwan3492)  
**Peer Reviewer Name / Student ID / GitHub:** Aphichaya Klinhual (Student ID: 67070503447, GitHub: [@Apichaya251400](https://github.com/Apichaya251400))  
**Repository URL:** [https://github.com/Pilaiwan3492/TokTickIT](https://github.com/Pilaiwan3492/TokTickIT)  
**Partner Repository:** [https://github.com/Apichaya251400/TokTickIT](https://github.com/Apichaya251400/TokTickIT)  
**Target Release Branch:** `main` (via `lab4-staging`)

---

## Answer Part 1: Git Use with Engineering Workflow

### 1.1 Git Commit History & Branching Model
The TokTickIT project strictly adheres to a staged feature-branch workflow:
`feature/*` $\rightarrow$ `lab4-staging` $\rightarrow$ `main`. Every increment is developed on an isolated feature branch linked to a GitHub Issue, verified by automated unit, API, and E2E tests, subjected to mandatory peer review by `@Apichaya251400`, and merged via fast-forward or squash merge.

```text
*   9c7c941 (origin/lab4-staging, lab4-staging) Merge pull request #90 from feature/38-playwright-e2e-responsive
|\  
| * 4e24bad docs(test): add E2E-10 scope note and align Ticket 8 seed comment (#38)
| * 18f3513 fix(e2e): align tablet viewport to 768px per AC-23 specification (#38)
| * 996b223 feat(e2e): add resolution gate modal, link touch target checks, visual layer separation (#38)
| * 5996566 feat(e2e): implement Lab 4 Playwright test suites and responsive visual evidence (#38)
|/  
*   aed679f Merge pull request #89 from feature/37-dashboard-react-frontend
|\  
| * 334c89b test: verify dashboard metric counts against filtered queues and update test checklist (#37)
| * c587ba7 Resolve Lab 4 test documentation merge conflict
| * 0bc8891 test(e2e): verify keyboard Tab traversal to target link without programmatic focus (#37)
| * fe36ade test(e2e): add keyboard Tab navigation and visible focus ring E2E tests (#37)
| * d544681 test(e2e): add dashboard drill-down E2E tests, requester empty-state tests (#37)
|/  
*   746092b Merge pull request #87 from feature/36-dashboard-backend-sql
...
```

### 1.2 GitHub Project Kanban Board
All 10 Lab 4 Issues (Issues #30 through #39 / GitHub Issues #72 through #81) are successfully delivered, verified, and transitioned to the **Done** column on the Kanban board:

| Issue # | GitHub Issue | Title / Scope | Feature Branch | Status |
| :---: | :---: | :--- | :--- | :---: |
| **30** | [#72](https://github.com/Pilaiwan3492/TokTickIT/issues/72) | Project Setup & Lab 4 Planning | `feature/30-project-setup` | **Done** |
| **31** | [#73](https://github.com/Pilaiwan3492/TokTickIT/issues/73) | Sprint 4 Engineering Specification & Test Plan | `feature/31-specification-test-plan` | **Done** |
| **32** | [#74](https://github.com/Pilaiwan3492/TokTickIT/issues/74) | Database Migration, Idempotent Seed & Backward Compatibility | `feature/32-schema-migration-seed` | **Done** |
| **33** | [#75](https://github.com/Pilaiwan3492/TokTickIT/issues/75) | Actions Taken Backend REST API & Concurrency Control | `feature/33-actions-taken-backend-api` | **Done** |
| **34** | [#76](https://github.com/Pilaiwan3492/TokTickIT/issues/76) | Ticket Lifecycle State Machine & Resolution Gate API | `feature/34-ticket-workflow-resolution-gate-api` | **Done** |
| **35** | [#77](https://github.com/Pilaiwan3492/TokTickIT/issues/77) | Actions Taken Frontend React Section, Modals & Visual Fidelity | `feature/35-actions-taken-frontend-react` | **Done** |
| **36** | [#78](https://github.com/Pilaiwan3492/TokTickIT/issues/78) | Role Dashboards Backend SQL Aggregation API | `feature/36-dashboard-backend-sql` | **Done** |
| **37** | [#79](https://github.com/Pilaiwan3492/TokTickIT/issues/79) | Role Dashboards React Frontend UI & Drill-Down Navigation | `feature/37-dashboard-react-frontend` | **Done** |
| **38** | [#80](https://github.com/Pilaiwan3492/TokTickIT/issues/80) | Playwright E2E Multi-Device Testing & Visual Inspection | `feature/38-playwright-e2e-responsive` | **Done** |
| **39** | [#81](https://github.com/Pilaiwan3492/TokTickIT/issues/81) | Final Product Hardening, Full Regression & Submission Package | `feature/39-final-regression-submission` | **Done** |

### 1.3 Rendered Peer Review Record
- **Review Document Link:** [https://github.com/Pilaiwan3492/TokTickIT/blob/feature/39-final-regression-submission/docs/lab-04/reviewer.md](https://github.com/Pilaiwan3492/TokTickIT/blob/feature/39-final-regression-submission/docs/lab-04/reviewer.md)  
- The review record catalogs the complete bi-directional review dialogue between Author Pilaiwan Churdchu (@Pilaiwan3492) and Peer Reviewer Aphichaya Klinhual (@Apichaya251400) across PRs #82 through #91. It documents substantive code reviews, changes requested (e.g., keyboard Tab navigation authenticity, tablet viewport alignment to 768px, seed data consistency), and final approvals.

### 1.4 `README.md` and `.gitignore` Content Evidence
- `README.md`: [https://github.com/Pilaiwan3492/TokTickIT/blob/feature/39-final-regression-submission/README.md](https://github.com/Pilaiwan3492/TokTickIT/blob/feature/39-final-regression-submission/README.md) &mdash; Updated with comprehensive Sprint 4 documentation, live seed account credentials (Alice, Bob, Michael, David, John), running instructions, and automated test pass rate summaries.
- `.gitignore`: [https://github.com/Pilaiwan3492/TokTickIT/blob/feature/39-final-regression-submission/.gitignore](https://github.com/Pilaiwan3492/TokTickIT/blob/feature/39-final-regression-submission/.gitignore) &mdash; Configured to exclude `node_modules/`, `dist/`, `.env`, temporary upload files, test coverage reports, and cache directories while tracking all essential documentation and source assets.

### 1.5 Repository Directory Structure in IDE
The codebase is structured into modular frontend (`client/`), backend (`server/`), end-to-end test suites (`e2e/`), artifacts (`artifacts/lab-04/`), and engineering documentation (`docs/lab-04/`).

---

## Answer Part 2: Spec DD

- **Link to `docs/lab-04/specification.md`:**  
  [https://github.com/Pilaiwan3492/TokTickIT/blob/feature/39-final-regression-submission/docs/lab-04/specification.md](https://github.com/Pilaiwan3492/TokTickIT/blob/feature/39-final-regression-submission/docs/lab-04/specification.md)

### 1. Requirements Decomposition & Coverage
The specification establishes **20 Functional Requirements (`FR-01` to `FR-20`)**, **19 Business Rules (`BR-01` to `BR-19`)**, and **25 Acceptance Criteria (`AC-01` to `AC-25`)** in Given-When-Then format.

#### Functional Requirements Highlights:
- **FR-01 to FR-07 (Actions Taken)**: Parent-child Actions Taken relationship linked to tickets, auto-attributed `performedBy`, edit operations, mandatory follow-up notes, inactive actor rejection, Requester read-only visibility, and terminal state action logging locking.
- **FR-08 to FR-12 (Ticket Lifecycle & Resolution Gate)**: 18-transition permitted status matrix across 8 statuses, resolution gate restricting `RESOLVED` to IT Staff and Admin, advisory resolution indicator for Requesters, and optimistic concurrency collision handling.
- **FR-13 to FR-16 (Role Dashboards)**: Scoped Requester dashboard (4 cards, recent tickets), Staff dashboard (6 operational cards, priority strip, my actions), Admin system metrics, and drill-down navigation.
- **FR-17 to FR-20 (System Invariants & Quality)**: 100% backward compatibility with Labs 1–3, application shell landing page routing, safe client error states, and WCAG touch targets / focus rings.

#### Permitted Status Transition Matrix (18 Transitions):
| Current Status | Permitted Next Statuses | Invariant Enforced |
| :--- | :--- | :--- |
| **`NEW`** | `OPEN`, `CANCELLED` | Cannot jump directly to `RESOLVED` or `CLOSED` |
| **`OPEN`** | `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED` | Can transition to Resolution Gate |
| **`IN_PROGRESS`** | `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED` | Active work transition |
| **`WAITING_FOR_REQUESTER`** | `IN_PROGRESS`, `RESOLVED`, `CANCELLED` | Awaiting user clarification |
| **`RESOLVED`** | `CLOSED`, `REOPENED` | Terminal gate or work resumption |
| **`REOPENED`** | `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED` | Resumes active operational workflow |
| **`CLOSED`** | *(None — Terminal State)* | Immutable; action logging and status updates locked |
| **`CANCELLED`** | *(None — Terminal State)* | Immutable; action logging and status updates locked |

### 2. Specification Existence Evidence Prior to Implementation
The Git commit history confirms that `docs/lab-04/specification.md` existed before coding began:
```bash
$ git log --format="Commit: %h | Date: %ad | Message: %s" --date=iso -- docs/lab-04/specification.md
Commit: 57d6d56 | Date: 2026-10-04 23:02:07 +0700 | Message: docs(issue-30): sprint 4 engineering specification, ui-spec, and api-spec contracts
```
The canonical specification was authored and approved on **2026-10-04**, prior to database migrations (PR #83), Actions Taken API development (PR #84), and dashboard implementations (PRs #86–#89).

---

## Answer Part 3: Test DD and Traceability

- **Link to `docs/lab-04/tests.md`:**  
  [https://github.com/Pilaiwan3492/TokTickIT/blob/feature/39-final-regression-submission/docs/lab-04/tests.md](https://github.com/Pilaiwan3492/TokTickIT/blob/feature/39-final-regression-submission/docs/lab-04/tests.md)

### Acceptance Criteria Traceability Matrix (Summary Excerpt)

| Test ID | Level | AC Ref | Description | Automated Test Path | Final Status |
| :--- | :---: | :---: | :--- | :--- | :---: |
| **API-01** | API | AC-01 | Create Action Taken auto-attributes `performedById` | `server/tests/lab-04/actions-taken.api.test.ts` | **Pass** |
| **API-02** | API | AC-02 | Mandatory follow-up note validation | `server/tests/lab-04/actions-taken.api.test.ts` | **Pass** |
| **API-03** | API | AC-03 | Requester forbidden from creating Actions Taken | `server/tests/lab-04/actions-taken.api.test.ts` | **Pass** |
| **API-06** | API | AC-07 | Action logging locked on `CLOSED`/`CANCELLED` | `server/tests/lab-04/actions-taken.api.test.ts` | **Pass** |
| **API-07** | API | BR-17 | Stale `expectedTicketUpdatedAt` returns HTTP 409 | `server/tests/lab-04/actions-taken.api.test.ts` | **Pass** |
| **API-13** | API | AC-08 | Complete 18 permitted status transition matrix | `server/tests/lab-04/ticket-workflow.api.test.ts` | **Pass** |
| **API-13b**| API | AC-08 | Valid Resolution Gate transition to `RESOLVED` | `server/tests/lab-04/ticket-workflow.api.test.ts` | **Pass** |
| **API-13c**| API | AC-11 | Requester status transition attempt rejected (403) | `server/tests/lab-04/ticket-workflow.api.test.ts` | **Pass** |
| **API-14** | API | AC-09 | Prohibited status jumps rejected (400) | `server/tests/lab-04/ticket-workflow.api.test.ts` | **Pass** |
| **API-15** | API | AC-10 | Requester advisory "Problem Appears Resolved" flag | `server/tests/lab-04/ticket-workflow.api.test.ts` | **Pass** |
| **API-23** | API | AC-15 | Requester Dashboard returns authoritative counts | `server/tests/lab-04/requester-dashboard.api.test.ts`| **Pass** |
| **API-27** | API | AC-17 | Staff Dashboard returns 6 operational metrics | `server/tests/lab-04/staff-dashboard.api.test.ts` | **Pass** |
| **UI-01**  | UI  | AC-01 | "Add Action Taken" button rendered for IT Staff | `client/tests/lab-04/ActionsTakenSection.test.tsx` | **Pass** |
| **UI-02**  | UI  | AC-02 | Follow-up note mandatory validation on form | `client/tests/lab-04/ActionsTakenSection.test.tsx` | **Pass** |
| **UI-09**  | UI  | AC-08 | Status dropdown displays permitted next statuses | `client/tests/lab-04/TicketWorkflow.test.tsx` | **Pass** |
| **UI-13**  | UI  | AC-12 | Stale-update HTTP 409 conflict banner & retry | `client/tests/lab-04/TicketWorkflow.test.tsx` | **Pass** |
| **UI-16**  | UI  | AC-15 | Requester Dashboard renders 4 primary cards | `client/tests/lab-04/RequesterDashboard.test.tsx` | **Pass** |
| **UI-18**  | UI  | AC-17 | Staff Dashboard renders 6 operational cards | `client/tests/lab-04/StaffDashboard.test.tsx` | **Pass** |
| **E2E-01** | E2E | AC-01 | Staff creates and edits Action Taken on open ticket | `e2e/lab-04/actions-taken-flow.spec.ts` | **Pass** |
| **E2E-04** | E2E | AC-08 | Full Resolution Gate flow: Advisory $\rightarrow$ Formal | `e2e/lab-04/ticket-resolution.spec.ts` | **Pass** |
| **E2E-06** | E2E | AC-12 | Concurrent edit collision triggers 409 conflict | `e2e/lab-04/ticket-resolution.spec.ts` | **Pass** |
| **E2E-07** | E2E | AC-15 | Requester Dashboard journey & drill-downs | `e2e/lab-04/dashboards.spec.ts` | **Pass** |
| **E2E-08** | E2E | AC-17 | IT Staff Dashboard journey & queue drill-downs | `e2e/lab-04/dashboards.spec.ts` | **Pass** |
| **E2E-10** | E2E | AC-21 | Full regression suite across Labs 1, 2, and 3 | `e2e/lab-04/regression.spec.ts` | **Pass** |

### Complete Test Execution Outputs from Clean State

#### 1. Server Unit, API, Performance-Smoke & Migration Tests (22 Files, 309 Passed)
```text
Test Files  22 passed (22)
     Tests  309 passed (309)
  Start at  00:26:20
  Duration  30.85s
```

#### 2. Client Component, Style & Interaction Tests (22 Files, 181 Passed)
```text
Test Files  22 passed (22)
     Tests  181 passed (181)
  Start at  00:26:04
  Duration  7.34s
```

#### 3. Playwright Multi-Device E2E Tests (4 Files across Desktop, Tablet, Mobile: 57 Passed)
```text
Running 57 tests using 1 worker
  ok  1-19 [Desktop] › 19 passed across actions-taken, dashboards, regression, responsive, resolution (58.4s)
  ok 20-38 [Tablet]  › 19 passed across actions-taken, dashboards, regression, responsive, resolution (56.8s)
  ok 39-57 [Mobile]  › 19 passed across actions-taken, dashboards, regression, responsive, resolution (57.1s)

  57 passed (3.2m)
```
**Total Automated Verification:** **547 / 547 Passed (100% Pass Rate)**

---

## Answer Part 4: AI Use with Reflection

- **Link to `docs/lab-04/ai-use.md`:**  
  [https://github.com/Pilaiwan3492/TokTickIT/blob/feature/39-final-regression-submission/docs/lab-04/ai-use.md](https://github.com/Pilaiwan3492/TokTickIT/blob/feature/39-final-regression-submission/docs/lab-04/ai-use.md)

### 1. Selected Prompts Summary
1. **Sprint 4 Contract Decomposition**: Formalized 20 FRs, 19 BRs, 25 ACs, 18-transition matrix, and optimistic concurrency protocols.
2. **Planned Test Catalog & Traceability**: Cataloged all planned tests across unit, API, performance-smoke, UI, visual, and E2E layers.
3. **Database Migration & Seeding**: Modeled `ActionTaken` in Prisma, maintained backward compatibility, and implemented idempotent seeding.
4. **Actions Taken REST API**: Implemented REST endpoints, role guards, mandatory follow-up validation, and concurrency checks.
5. **Ticket Workflow & Resolution Gate**: Developed state transition validator, resolution gate, and advisory signal endpoint.
6. **Actions Taken Frontend & Visual Polish**: Created React components with Zen Green tokens, Amber pills, and form preservation.
7. **Role Dashboards SQL API & Frontend**: Developed high-performance SQL aggregation endpoints and responsive dashboard UI.
8. **Playwright Multi-Device Battery**: Implemented automated test suites across Desktop, Tablet, and Mobile with 24 screenshots.
9. **Full Regression Suite across Labs 1–3**: Verified complete backward compatibility for all legacy features without regressions.

### 2. My Reflection on AI Use
Developing **TokTickIT Lab 4** highlighted the immense value of combining modern AI coding agents with strict software engineering methodology (Spec DD and TDD). When architectural constraints and business rules were formally established upfront in `specification.md`, the AI agent implemented complex full-stack features with high fidelity, writing 547 automated tests with zero regressions.

The experience also underscored that **human engineering judgment remains paramount in handling concurrency, security boundaries, and authentic accessibility**:
- **Optimistic Concurrency Control**: Preventing dirty writes on parent-child entities required human architectural guidance to ensure that adding an Action Taken checked the parent ticket's `updatedAt` timestamp (`expectedTicketUpdatedAt`), avoiding race conditions against concurrent ticket closures.
- **Authentic Accessibility Testing**: Peer review identified that synthetic `.focus()` calls in automated keyboard tests did not prove real-world usability. Human oversight guided the transition to sequential `Tab` key traversal, ensuring true keyboard accessibility for disabled users.

---

## Answer Part 5: Working IT Staff Dashboard UI

### 1. IT Staff Dashboard Across Viewports
The IT Staff Dashboard displays 6 primary operational metric cards, the Priority Attention strip, and the Current User's Recent Actions table.
- **Desktop ($1280 \times 800$ Grid Layout):**  
  ![Staff Dashboard Desktop](../../artifacts/lab-04/screenshots/01-staff-dashboard-desktop.png)
- **Tablet ($768 \times 1024$ 2-Column Responsive Layout):**  
  ![Staff Dashboard Tablet](../../artifacts/lab-04/screenshots/01-staff-dashboard-tablet.png)
- **Mobile ($375 \times 667$ Stacked Cards Layout):**  
  ![Staff Dashboard Mobile](../../artifacts/lab-04/screenshots/01-staff-dashboard-mobile.png)

### 2. Operational Metrics & Priority Strip
- **6 Operational Cards**: `New`, `Open`, `In Progress`, `Waiting for Requester`, `My Assigned`, and `Unassigned`.
- **Priority Attention Strip**: Prominently highlights `Urgent` and `High` active tickets requiring immediate staff attention.
- **My Recent Actions**: Lists the 5 most recent Actions Taken performed by the authenticated user with direct links to tickets.

### 3. Drill-Down Filter Navigation
Clicking any metric card immediately navigates to `/staff/tickets` with the corresponding filter active (e.g., clicking "My Assigned" navigates to `/staff/tickets?ownership=assigned_to_me`; clicking "Open" navigates to `/staff/tickets?status=OPEN`).

### 4. Database Query Parity
All metric counts are computed using authoritative database SQL aggregations (`groupBy` and count queries) in `dashboard.controller.ts`, guaranteeing exact parity with the filtered queue queries with zero N+1 latency ($< 300\text{ms}$).

---

## Answer Part 6: Working Actions Taken UI

### 1. Actions Taken Section on Ticket Detail
Renders a clean, chronological list of work logged against the ticket, complete with performer name, date, description, result, and follow-up indicators.
- **Desktop Viewport:**  
  ![Ticket Detail Actions Desktop](../../artifacts/lab-04/screenshots/03-ticket-detail-actions-taken-desktop.png)
- **Tablet Viewport:**  
  ![Ticket Detail Actions Tablet](../../artifacts/lab-04/screenshots/03-ticket-detail-actions-taken-tablet.png)
- **Mobile Viewport:**  
  ![Ticket Detail Actions Mobile](../../artifacts/lab-04/screenshots/03-ticket-detail-actions-taken-mobile.png)

### 2. Create Action Taken Modal
The modal automatically displays the authenticated user as the read-only Performer (`performedBy`). Includes Action Date, Description, Result, and "Follow-up Required" checkbox.
- **Desktop:**  
  ![Action Taken Modal Desktop](../../artifacts/lab-04/screenshots/04-action-taken-modal-desktop.png)
- **Tablet:**  
  ![Action Taken Modal Tablet](../../artifacts/lab-04/screenshots/04-action-taken-modal-tablet.png)
- **Mobile:**  
  ![Action Taken Modal Mobile](../../artifacts/lab-04/screenshots/04-action-taken-modal-mobile.png)

### 3. Mandatory Follow-up Validation & Amber Pill
Checking "Follow-up Required" dynamically renders a mandatory "Follow-up Note" text area. Submissions with empty notes are blocked with an immediate validation warning. Saved follow-ups render a distinct Amber badge (`#D97706` / `#FEF3C7`).

### 4. Requester Read-Only Visibility & Terminal Lock
- **Requester View**: Requesters viewing their own ticket see all Actions Taken in read-only mode; "Add Action Taken" and edit buttons are strictly hidden.
- **Terminal State Lock**: When a ticket is in `CLOSED` or `CANCELLED` status, action creation and editing controls are disabled, displaying an informational notice.

---

## Answer Part 7: Working Ticket Workflow

### 1. Status Transition Selector & Permitted Choices
The status transition dropdown strictly limits options to permitted next statuses per the 18-transition matrix (e.g., tickets in `NEW` only display `OPEN` and `CANCELLED`).
- **Desktop:**  
  ![Resolution Gate Desktop](../../artifacts/lab-04/screenshots/05-ticket-resolution-gate-desktop.png)
- **Tablet:**  
  ![Resolution Gate Tablet](../../artifacts/lab-04/screenshots/05-ticket-resolution-gate-tablet.png)
- **Mobile:**  
  ![Resolution Gate Mobile](../../artifacts/lab-04/screenshots/05-ticket-resolution-gate-mobile.png)

### 2. Backend Resolution Gate Enforcement
- **IT Staff Formal Resolution**: Transitioning to `RESOLVED` triggers the Resolution Gate confirmation dialog and persists the official status change to the database.
- **Requester Advisory Resolution**: Requesters can indicate that the "Problem Appears Resolved" via an advisory banner (`POST /resolve-indicator`). This sets `isResolvedByUser: true` to assist staff during triage without altering the official lifecycle status.
- **Desktop:**  
  ![Requester Resolve Indicator Desktop](../../artifacts/lab-04/screenshots/06-requester-resolve-indicator-desktop.png)
- **Tablet:**  
  ![Requester Resolve Indicator Tablet](../../artifacts/lab-04/screenshots/06-requester-resolve-indicator-tablet.png)
- **Mobile:**  
  ![Requester Resolve Indicator Mobile](../../artifacts/lab-04/screenshots/06-requester-resolve-indicator-mobile.png)

### 3. Reopening Workflow & Terminal State Closure
- `RESOLVED` tickets can transition to `CLOSED` (terminal lock) or `REOPENED` (resuming active triage in `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, or `CANCELLED`).

### 4. Optimistic Concurrency Collision Handling (HTTP 409)
When two users concurrently modify a ticket or its actions, the backend detects a timestamp collision (`expectedUpdatedAt` or `expectedTicketUpdatedAt`) and returns HTTP 409 `STALE_UPDATE_CONFLICT`. The frontend displays a non-destructive warning banner with a "Refresh Ticket" CTA, preserving the user's uncommitted form inputs.
- **Desktop:**  
  ![Concurrency Conflict Desktop](../../artifacts/lab-04/screenshots/07-concurrency-conflict-banner-desktop.png)
- **Tablet:**  
  ![Concurrency Conflict Tablet](../../artifacts/lab-04/screenshots/07-concurrency-conflict-banner-tablet.png)
- **Mobile:**  
  ![Concurrency Conflict Mobile](../../artifacts/lab-04/screenshots/07-concurrency-conflict-banner-mobile.png)

---

## Answer Part 8: Working Requester Dashboard & Final Regression UI

### 1. Requester Dashboard Across Viewports
Provides Requesters with personalized metrics: 4 primary cards (`My Open Tickets`, `Waiting for Requester`, `Resolved`, `Closed`), recent tickets table, and recently resolved tickets list.
- **Desktop ($1280 \times 800$):**  
  ![Requester Dashboard Desktop](../../artifacts/lab-04/screenshots/02-requester-dashboard-desktop.png)
- **Tablet ($768 \times 1024$):**  
  ![Requester Dashboard Tablet](../../artifacts/lab-04/screenshots/02-requester-dashboard-tablet.png)
- **Mobile ($375 \times 667$):**  
  ![Requester Dashboard Mobile](../../artifacts/lab-04/screenshots/02-requester-dashboard-mobile.png)

### 2. Drill-Down Filter Navigation to My Tickets
Clicking any metric card navigates to `/my-tickets?status=...` pre-filtered to the chosen status. Empty states display helpful messages with a prominent `+ Create Ticket` CTA.

### 3. Administrator Dashboard System User Metrics
Administrators viewing the dashboard see staff operational metrics plus the System User Accounts summary panel (`Active Users`, `Active Staff`, `Active Admins`).
- **Desktop:**  
  ![Admin Dashboard Desktop](../../artifacts/lab-04/screenshots/08-admin-dashboard-desktop.png)
- **Tablet:**  
  ![Admin Dashboard Tablet](../../artifacts/lab-04/screenshots/08-admin-dashboard-tablet.png)
- **Mobile:**  
  ![Admin Dashboard Mobile](../../artifacts/lab-04/screenshots/08-admin-dashboard-mobile.png)

### 4. Full Regression Verification across Labs 1, 2, and 3 (`E2E-10`)
The full regression suite `e2e/lab-04/regression.spec.ts` executes across Desktop, Tablet, and Mobile with 100% pass rate:
- **Lab 1**: System health check (`/api/health`) and category listings (`Account and Access`, `Hardware`, `Software`, `Network`).
- **Lab 2**: Requester ticket creation, My Tickets table (search, filter, pagination), Ticket Detail, PNG attachment upload/download, and soft-delete with removal reason.
- **Lab 3**: JWT authentication, mandatory password change for `alice@example.com`, RBAC unauthorized route protection (`403 Forbidden` on `/admin/users`), IT Staff Queue claiming, public comments feed, amber internal notes, and Admin self-deactivation protection.

---

## Answer Part 9: Zen Green UI, Responsive, Accessibility & Final Polish

- **Link to `docs/lab-04/ui-spec.md`:**  
  [https://github.com/Pilaiwan3492/TokTickIT/blob/feature/39-final-regression-submission/docs/lab-04/ui-spec.md](https://github.com/Pilaiwan3492/TokTickIT/blob/feature/39-final-regression-submission/docs/lab-04/ui-spec.md)

### 1. Design Token Fidelity & Visual Invariants
- **Primary Brand Color**: Zen Green `#006B3C` applied to application header, primary action buttons, active tab indicators, and metric card accents.
- **Secondary Interaction**: `#0B7A46` applied to interactive hover states and high-contrast keyboard focus outlines ($2\text{px}$ solid ring).
- **Amber Differentiation**: `#D97706` / `#FEF3C7` strictly applied to Follow-up Required pills and internal notes.
- **Backgrounds**: Soft canvas `#F5F7F6` with clean card containers `#FFFFFF` and borders `#D5DDD8`. Readonly inputs use `#F0F4F2`.

### 2. Multi-Device Viewport Evidence Inventory (All 24 Artifacts)

| Screen / Feature | Desktop ($1280 \times 800$) | Tablet ($768 \times 1024$) | Mobile ($375 \times 667$) |
| :--- | :---: | :---: | :---: |
| **IT Staff Dashboard** | `01-staff-dashboard-desktop.png` | `01-staff-dashboard-tablet.png` | `01-staff-dashboard-mobile.png` |
| **Requester Dashboard** | `02-requester-dashboard-desktop.png` | `02-requester-dashboard-tablet.png` | `02-requester-dashboard-mobile.png` |
| **Ticket Detail (Actions)**| `03-ticket-detail-actions-taken-desktop.png` | `03-ticket-detail-actions-taken-tablet.png` | `03-ticket-detail-actions-taken-mobile.png` |
| **Action Taken Modal** | `04-action-taken-modal-desktop.png` | `04-action-taken-modal-tablet.png` | `04-action-taken-modal-mobile.png` |
| **Resolution Gate** | `05-ticket-resolution-gate-desktop.png` | `05-ticket-resolution-gate-tablet.png` | `05-ticket-resolution-gate-mobile.png` |
| **Advisory Resolution** | `06-requester-resolve-indicator-desktop.png` | `06-requester-resolve-indicator-tablet.png` | `06-requester-resolve-indicator-mobile.png` |
| **Concurrency Conflict**| `07-concurrency-conflict-banner-desktop.png` | `07-concurrency-conflict-banner-tablet.png` | `07-concurrency-conflict-banner-mobile.png` |
| **Admin Dashboard** | `08-admin-dashboard-desktop.png` | `08-admin-dashboard-tablet.png` | `08-admin-dashboard-mobile.png` |

### 3. Completed Responsive & Accessibility Quality Checklist

| Quality Invariant | Inspection Standard | Verification Method | Status |
| :--- | :--- | :--- | :---: |
| **Zero Horizontal Overflow (`RESP-04`)** | `document.documentElement.scrollWidth <= window.innerWidth` | `assertNoHorizontalOverflow()` across all screens in Playwright | ✅ **Passed** |
| **Touch Targets $\ge 44 \times 44\text{px}$ (`RESP-03`)** | Interactive buttons, inputs, close icons meet minimum $44\text{px}$ hit areas | Multi-device assertions & `touch-targets.css` | ✅ **Passed** |
| **Brand Color Fidelity (`VIS-01`)** | Header, cards, and buttons conform strictly to `#006B3C` | Computed CSS token assertions in RTL & Vitest | ✅ **Passed** |
| **Badge Contrast & Distinction (`VIS-02`)**| Status/Priority badges conform to spec; Amber follow-up pill `#D97706` | Automated style assertions in `ui-style.test.tsx` | ✅ **Passed** |
| **Visible Focus Outlines (`VIS-03`)** | High-contrast keyboard focus indicator (`#0B7A46`, $2\text{px}$) visible | Sequential `Tab` key traversal test in Playwright & RTL | ✅ **Passed** |
| **Zero Text Clipping (`VIS-04`)** | Dense text wraps cleanly (`break-words`); metric numbers fit | Multi-device visual layout inspection in E2E | ✅ **Passed** |
| **Form State Preservation (`BR-18`)** | Form values preserved upon validation or HTTP 409 conflict | Component tests in `ActionsTakenSection.test.tsx` | ✅ **Passed** |
| **Double-Click Protection (`BR-19`)** | In-flight submissions disable button and display spinner | E2E and component race condition tests | ✅ **Passed** |

---

## Final Submission Checklist

- [x] **Answer Part 1 to Answer Part 9 ordered strictly according to KMUTT CPE334 Handout Section 14.**
- [x] **All relative links and GitHub repository URLs verified and functional.**
- [x] **All 24 screenshot evidence artifacts captured and embedded from `artifacts/lab-04/screenshots/`.**
- [x] **Spec DD evidence verified with Git commit timestamps proving specification existed before coding.**
- [x] **Test DD dual-traceability complete with 100% test pass output (547/547 tests passed).**
- [x] **AI Use documentation (`ai-use.md`) complete with 9 detailed prompts and critical reflection.**
- [x] **Multi-device responsive layout verified with zero horizontal overflow and $\ge 44\text{px}$ touch targets.**
- [x] **Production builds compile cleanly with zero errors on both server and client.**
