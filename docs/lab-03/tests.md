# Lab 3 Test Plan and Traceability Matrix: TokTickIT Users, Roles, IT Staff Ticketing, and Admin Screens

## 1. Test Strategy

This document defines the comprehensive Test Strategy, Planned Test Matrix, and Acceptance Criteria Traceability for **TokTickIT Lab 3 (Sprint 3)** in accordance with the course specification (Sections 9, 10, 12, and 14 Part 3).

The test plan is established **before implementation** (Test-Driven Development / Spec DD) to guarantee that every business rule, role boundary, API endpoint, security invariant, UI component, and end-to-end user workflow is thoroughly verified by automated tests.

---

### 1.1 Test Levels & Methodology

- **API & Integration Testing (Server)**:
  - Framework: Supertest with Vitest.
  - Scope: REST API contracts under `/api/v1/auth/*`, `/api/v1/tickets/*`, `/api/v1/staff/*`, and `/api/v1/admin/*`.
  - Invariants Tested: HTTP status codes (`200`, `201`, `400`, `401`, `403`, `404`, `409`), Bearer token validation, role authorization guards, server-side logout revocation, first-login password change gating, safe error payloads, and database state transitions.
- **UI Component & Interaction Testing (Client)**:
  - Framework: React Testing Library with Vitest and jsdom.
  - Scope: Authentication forms, password policy checklist, role navigation header, IT Staff Queue table/cards, operational ticket detail controls, public comments feed, internal notes tab, and Administrator user management modal.
  - Invariants Tested: Input validation, button busy/disabled states, error banner display, debounced search, filter synchronization, modal confirmation dialogues, and responsive breakpoint rendering.
- **Role-Based Security & Authorization Testing**:
  - Invariants Tested: Strict server-side enforcement of the Authorization Matrix. Verification that Requesters cannot access other users' tickets, cannot query or post Internal Notes, cannot view the IT queue, and cannot access Admin user management. Verification that Administrators cannot deactivate themselves or eliminate the last active Administrator.
- **Requester Regression Testing**:
  - Invariants Tested: Ensuring 100% of Lab 2 ticket and attachment operations continue to function properly using the authenticated Requester identity without the legacy Development Requester selector.
- **End-to-End (E2E) Workflow Testing**:
  - Framework: Playwright.
  - Scope: Complete multi-role user journeys across Login $\rightarrow$ First-login password change $\rightarrow$ Requester ticket creation $\rightarrow$ IT Staff queue pickup & status transition $\rightarrow$ Public comment & internal note conversation $\rightarrow$ Admin user management $\rightarrow$ Server-side logout invalidation.
- **Visual Inspection & Responsive Verification**:
  - Verification across Desktop ($\ge 1280\text{px}$), Tablet ($768\text{px} - 1024\text{px}$), and Mobile ($375\text{px} - 480\text{px}$) with zero horizontal scrolling, no overlapping badges, visible focus rings, and fidelity to Zen Green tokens.

---

## 2. Planned Tests Catalog

### 2.1 Server API Tests (`server/tests/lab-03/`)

| Test ID | Level | AC / BR Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **API-01** | API | AC-01, BR-01 | Valid login with active account credentials | HTTP 200 OK; returns valid JWT Bearer token and safe user profile | `server/tests/lab-03/auth.api.test.ts` | `Planned` |
| **API-02** | API | AC-06, BR-01 | Login with incorrect password | HTTP 401 Unauthorized with code `INVALID_CREDENTIALS` | `server/tests/lab-03/auth.api.test.ts` | `Planned` |
| **API-03** | API | AC-06, BR-01 | Login with unregistered email address | HTTP 401 Unauthorized with safe code `INVALID_CREDENTIALS` | `server/tests/lab-03/auth.api.test.ts` | `Planned` |
| **API-04** | API | AC-05, BR-01, BR-27 | Login attempt for inactive account (`isActive: false`) | HTTP 401 Unauthorized with code `ACCOUNT_INACTIVE` | `server/tests/lab-03/auth.api.test.ts` | `Planned` |
| **API-05** | API | AC-02, BR-02 | User with `mustChangePassword: true` invoking normal API | HTTP 403 Forbidden with code `PASSWORD_CHANGE_REQUIRED` | `server/tests/lab-03/auth.api.test.ts` | `Planned` |
| **API-06** | API | AC-02, BR-06 | Change password with valid credentials meeting policy | HTTP 200 OK; updates password hash and sets `mustChangePassword: false` | `server/tests/lab-03/auth.api.test.ts` | `Planned` |
| **API-07** | API | AC-02, BR-06 | Change password where new password matches initial password | HTTP 400 Bad Request with validation error | `server/tests/lab-03/auth.api.test.ts` | `Planned` |
| **API-08** | API | AC-02, BR-06 | Change password failing complexity rule (< 8 chars, no symbol) | HTTP 400 Bad Request with validation details | `server/tests/lab-03/auth.api.test.ts` | `Planned` |
| **API-09** | API | FR-04, BR-03 | Retrieve profile of authenticated user (`GET /api/v1/auth/me`) | HTTP 200 OK with authenticated user ID, name, email, role | `server/tests/lab-03/auth.api.test.ts` | `Planned` |
| **API-10** | API | AC-07, BR-28 | Invoke logout (`POST /api/v1/auth/logout`) with active Bearer token | HTTP 200 OK; server adds `jti` to revoked token store | `server/tests/lab-03/auth.api.test.ts` | `Planned` |
| **API-11** | API | AC-07, BR-28 | Request protected endpoint using a revoked token | HTTP 401 Unauthorized with code `SESSION_REVOKED` | `server/tests/lab-03/auth.api.test.ts` | `Planned` |
| **API-12** | API | BR-05, BR-28 | Request protected endpoint with expired or forged JWT | HTTP 401 Unauthorized with code `SESSION_EXPIRED` | `server/tests/lab-03/auth.api.test.ts` | `Planned` |
| **API-13** | API | AC-03, BR-03 | Requester ticket operation ignoring client-provided `requesterId` | HTTP 200/201; server enforces `requesterId` from session token | `server/tests/lab-03/authorization.api.test.ts` | `Planned` |
| **API-14** | API | AC-03, BR-12 | Requester attempts to access another Requester's ticket | HTTP 403 Forbidden (or 404); cross-requester access blocked | `server/tests/lab-03/authorization.api.test.ts` | `Planned` |
| **API-15** | API | AC-08, BR-24 | Requester attempts to query IT Staff Queue (`/api/v1/staff/*`) | HTTP 403 Forbidden with code `INSUFFICIENT_PERMISSIONS` | `server/tests/lab-03/authorization.api.test.ts` | `Planned` |
| **API-16** | API | AC-08, BR-24 | Requester attempts to access Admin User API (`/api/v1/admin/*`) | HTTP 403 Forbidden with code `INSUFFICIENT_PERMISSIONS` | `server/tests/lab-03/authorization.api.test.ts` | `Planned` |
| **API-17** | API | BR-24 | IT Staff attempts to access Admin User API (`/api/v1/admin/*`) | HTTP 403 Forbidden with code `INSUFFICIENT_PERMISSIONS` | `server/tests/lab-03/authorization.api.test.ts` | `Planned` |
| **API-18** | API | BR-24 | Administrator accesses IT Staff ticket operations | HTTP 200 OK; authorized per approved Authorization Matrix | `server/tests/lab-03/authorization.api.test.ts` | `Planned` |
| **API-19** | API | AC-13, BR-23 | IT Staff retrieves Ticket Queue with default pagination and sorting | HTTP 200 OK; returns ticket list and pagination metadata | `server/tests/lab-03/staff-queue.api.test.ts` | `Planned` |
| **API-20** | API | AC-14, FR-11 | Search Ticket Queue by ticket number, summary, or requester | HTTP 200 OK; returns only matching records | `server/tests/lab-03/staff-queue.api.test.ts` | `Planned` |
| **API-21** | API | AC-14, FR-11 | Filter Ticket Queue by status (single or comma-separated) | HTTP 200 OK; returns tickets matching requested statuses | `server/tests/lab-03/staff-queue.api.test.ts` | `Planned` |
| **API-22** | API | AC-14, FR-11 | Filter Ticket Queue by priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) | HTTP 200 OK; returns tickets matching IT Priority | `server/tests/lab-03/staff-queue.api.test.ts` | `Planned` |
| **API-23** | API | AC-14, FR-11 | Filter Ticket Queue by ownership: `ALL`, `UNASSIGNED`, `ASSIGNED_TO_ME` | HTTP 200 OK; correctly filters by `ownerId` | `server/tests/lab-03/staff-queue.api.test.ts` | `Planned` |
| **API-24** | API | AC-14, BR-23 | Queue deterministic secondary sorting by `id desc` on duplicate dates | HTTP 200 OK; asserts deterministic ordering | `server/tests/lab-03/staff-queue.api.test.ts` | `Planned` |
| **API-25** | API | AC-13, FR-12 | IT Staff retrieves single ticket detail with operational metadata | HTTP 200 OK; returns full ticket, comments, and notes | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | `Planned` |
| **API-26** | API | AC-15, BR-13 | IT Staff claims unassigned ticket (`PATCH /assignment` with own ID) | HTTP 200 OK; `ownerId` updated to current user | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | `Planned` |
| **API-27** | API | AC-16, BR-13 | IT Staff reassigns ticket to another active IT Staff / Admin | HTTP 200 OK; `ownerId` updated to target user | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | `Planned` |
| **API-28** | API | BR-13 | Assign ticket to inactive user or user with `REQUESTER` role | HTTP 400 Bad Request; invalid owner rejected | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | `Planned` |
| **API-29** | API | AC-17, BR-14 | IT Staff updates IT Priority independently of Requested Priority | HTTP 200 OK; `itPriority` updated, `requestedPriority` unchanged | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | `Planned` |
| **API-30** | API | AC-18, BR-16 | Permitted status transition (e.g. `NEW` $\rightarrow$ `OPEN`, `OPEN` $\rightarrow$ `IN_PROGRESS`) | HTTP 200 OK; status updated in database | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | `Planned` |
| **API-31** | API | AC-19, BR-16 | Invalid status transition (e.g. `NEW` $\rightarrow$ `RESOLVED`, `CLOSED` $\rightarrow$ `OPEN`) | HTTP 400 Bad Request with code `INVALID_STATUS_TRANSITION` | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | `Planned` |
| **API-32** | API | AC-11, BR-07 | Requester posts Public Comment on owned ticket | HTTP 201 Created; author set to requester ID; visible in feed | `server/tests/lab-03/comments-notes.api.test.ts` | `Planned` |
| **API-33** | API | BR-07, BR-09 | IT Staff posts Public Comment on any ticket | HTTP 201 Created; author set to IT staff ID; timestamp recorded | `server/tests/lab-03/comments-notes.api.test.ts` | `Planned` |
| **API-34** | API | BR-10 | Post Public Comment with empty or whitespace-only content | HTTP 400 Bad Request with validation error | `server/tests/lab-03/comments-notes.api.test.ts` | `Planned` |
| **API-35** | API | AC-04, BR-25 | Requester attempts to view Internal Notes (`GET /api/v1/tickets/:id/notes`) | HTTP 403 Forbidden; zero note data returned | `server/tests/lab-03/comments-notes.api.test.ts` | `Planned` |
| **API-36** | API | AC-04, BR-25 | Requester attempts to create Internal Note (`POST /api/v1/tickets/:id/notes`) | HTTP 403 Forbidden; note creation rejected | `server/tests/lab-03/comments-notes.api.test.ts` | `Planned` |
| **API-37** | API | AC-20, BR-07 | IT Staff / Admin creates and retrieves Internal Notes | HTTP 200/201; returns internal note payload with author & time | `server/tests/lab-03/comments-notes.api.test.ts` | `Planned` |
| **API-38** | API | AC-12, BR-11 | Requester marks ticket as "Problem Appears Resolved" | HTTP 200 OK; sets `isRequesterResolved: true`, status unchanged | `server/tests/lab-03/comments-notes.api.test.ts` | `Planned` |
| **API-39** | API | AC-21, FR-18 | Administrator retrieves user list with search by name/email & role | HTTP 200 OK; returns list of users with safe fields | `server/tests/lab-03/users-admin.api.test.ts` | `Planned` |
| **API-40** | API | AC-22, BR-04 | Administrator creates new user with one role and initial password | HTTP 201 Created; hashes password, sets `mustChangePassword: true` | `server/tests/lab-03/users-admin.api.test.ts` | `Planned` |
| **API-41** | API | AC-23, BR-20 | Administrator attempts to create user with existing duplicate email | HTTP 409 Conflict with code `DUPLICATE_EMAIL` | `server/tests/lab-03/users-admin.api.test.ts` | `Planned` |
| **API-42** | API | AC-24, FR-21 | Administrator updates user name, email, role, and active status | HTTP 200 OK; updates persisted | `server/tests/lab-03/users-admin.api.test.ts` | `Planned` |
| **API-43** | API | FR-22, BR-23 | Administrator resets initial password for user | HTTP 200 OK; sets new hash and `mustChangePassword = true` | `server/tests/lab-03/users-admin.api.test.ts` | `Planned` |
| **API-44** | API | AC-24, BR-21 | Administrator attempts to deactivate their own account | HTTP 400 Bad Request with code `CANNOT_DEACTIVATE_SELF` | `server/tests/lab-03/users-admin.api.test.ts` | `Planned` |
| **API-45** | API | AC-25, BR-22 | Administrator attempts to deactivate or reassign the last active Admin | HTTP 400 Bad Request with code `LAST_ACTIVE_ADMIN_PROTECTED` | `server/tests/lab-03/users-admin.api.test.ts` | `Planned` |

---

### 2.2 Client Component Tests (`client/tests/lab-03/`)

| Test ID | Level | AC / BR Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **UI-01** | UI | AC-01, FR-01 | Login screen initial render in Zen Green style | Renders email, password inputs, password toggle, and submit button | `client/tests/lab-03/Login.test.tsx` | `Planned` |
| **UI-02** | UI | AC-06, BR-26 | Client validation on empty email or password | Prevents API dispatch, displays field validation indicators | `client/tests/lab-03/Login.test.tsx` | `Planned` |
| **UI-03** | UI | AC-06, BR-01 | Login error banner on `INVALID_CREDENTIALS` | Displays `"Invalid email or password. Please try again."` | `client/tests/lab-03/Login.test.tsx` | `Planned` |
| **UI-04** | UI | AC-05, BR-27 | Login error banner on `ACCOUNT_INACTIVE` | Displays `"Your account is currently inactive. Please contact an administrator."` | `client/tests/lab-03/Login.test.tsx` | `Planned` |
| **UI-05** | UI | AC-06, BR-26 | Form submission busy state | Submit button disabled and shows spinner while request is in-flight | `client/tests/lab-03/Login.test.tsx` | `Planned` |
| **UI-06** | UI | AC-01, FR-06 | Successful login navigates to role landing page | Stores token, sets user state, redirects to `/my-tickets` or `/queue` | `client/tests/lab-03/Login.test.tsx` | `Planned` |
| **UI-07** | UI | AC-02, BR-02 | Mandatory change password screen rendering | Renders current, new, confirm password fields, blocks normal navigation | `client/tests/lab-03/ChangePassword.test.tsx` | `Planned` |
| **UI-08** | UI | AC-02, BR-06 | Real-time password complexity rule checklist | Checklist items turn green as user satisfies length, case, number/symbol | `client/tests/lab-03/ChangePassword.test.tsx` | `Planned` |
| **UI-09** | UI | AC-02, BR-06 | Password confirmation mismatch validation | Displays mismatch error and keeps Submit button disabled | `client/tests/lab-03/ChangePassword.test.tsx` | `Planned` |
| **UI-10** | UI | AC-02, BR-02 | Successful password change unblocks user | Dispatches change API, clears gating, transitions into main application | `client/tests/lab-03/ChangePassword.test.tsx` | `Planned` |
| **UI-11** | UI | AC-08, FR-06 | Application Header role navigation rendering | Displays role badge, role-filtered navigation items, removes dev selector | `client/tests/lab-03/AppShell.test.tsx` | `Planned` |
| **UI-12** | UI | AC-07, BR-28 | User clicks Sign Out action in header | Calls logout API, clears local storage token, redirects to `/login` | `client/tests/lab-03/AppShell.test.tsx` | `Planned` |
| **UI-13** | UI | AC-13, FR-10 | IT Staff Ticket Queue desktop table render | Table renders Ticket No, Date, Summary, Priority & Status badges, Owner | `client/tests/lab-03/StaffTicketQueue.test.tsx` | `Planned` |
| **UI-14** | UI | AC-14, FR-11 | Ticket Queue search box input | Debounced search triggers API reload with query parameter | `client/tests/lab-03/StaffTicketQueue.test.tsx` | `Planned` |
| **UI-15** | UI | AC-14, FR-11 | Ticket Queue Status and Priority filter dropdowns | Selecting filters updates API parameters and reloads table | `client/tests/lab-03/StaffTicketQueue.test.tsx` | `Planned` |
| **UI-16** | UI | AC-14, FR-11 | Ticket Queue Ownership filter (All / Unassigned / Mine) | Toggling ownership reloads queue with respective scope | `client/tests/lab-03/StaffTicketQueue.test.tsx` | `Planned` |
| **UI-17** | UI | AC-14, BR-23 | Ticket Queue pagination bar navigation | Clicking next/previous/page numbers reloads page with correct offset | `client/tests/lab-03/StaffTicketQueue.test.tsx` | `Planned` |
| **UI-18** | UI | AC-14, FR-11 | Ticket Queue empty and no-results states | Renders clear feedback when queue has no items or no search matches | `client/tests/lab-03/StaffTicketQueue.test.tsx` | `Planned` |
| **UI-19** | UI | AC-15, AC-16 | IT Staff Ticket Detail: Claim button & Owner dropdown | Clicking Claim sets owner; selecting new owner triggers reassignment | `client/tests/lab-03/StaffTicketDetail.test.tsx` | `Planned` |
| **UI-20** | UI | AC-17, BR-14 | IT Staff Ticket Detail: IT Priority dropdown | Changing priority sends patch request and updates badge immediately | `client/tests/lab-03/StaffTicketDetail.test.tsx` | `Planned` |
| **UI-21** | UI | AC-18, BR-16 | IT Staff Ticket Detail: Status dropdown options | Dropdown only presents valid next statuses according to transition matrix | `client/tests/lab-03/StaffTicketDetail.test.tsx` | `Planned` |
| **UI-22** | UI | AC-11, BR-07 | Public Comments tab render and submit | Displays chronological comments and post form with character counter | `client/tests/lab-03/StaffTicketDetail.test.tsx` | `Planned` |
| **UI-23** | UI | AC-20, BR-07 | Internal Notes tab with amber distinction styling | Displays amber distinction banner, private notes list, and note form | `client/tests/lab-03/StaffTicketDetail.test.tsx` | `Planned` |
| **UI-24** | UI | AC-12, BR-11 | Requester Ticket Detail: "Problem Appears Resolved" button | Clicking button shows confirmed indicator; official status unchanged | `client/tests/lab-03/RequesterTicketDetail.test.tsx` | `Planned` |
| **UI-25** | UI | AC-04, BR-25 | Requester Ticket Detail: Internal Notes tab absence | Internal Notes tab is completely hidden from Requester view | `client/tests/lab-03/RequesterTicketDetail.test.tsx` | `Planned` |
| **UI-26** | UI | AC-21, FR-18 | Administrator User Management table render | Displays user rows with Name, Email, Role badge, Status dot, Edit button | `client/tests/lab-03/UserManagement.test.tsx` | `Planned` |
| **UI-27** | UI | AC-22, BR-20 | Admin Create User modal validation & submission | Validates email, role, initial password; handles duplicate email error | `client/tests/lab-03/UserManagement.test.tsx` | `Planned` |
| **UI-28** | UI | AC-24, BR-21 | Admin Edit User modal: Self-deactivation disabled | Active toggle disabled with safety tooltip when editing own account | `client/tests/lab-03/UserManagement.test.tsx` | `Planned` |
| **UI-29** | UI | AC-25, BR-22 | Admin Edit User modal: Last admin deactivation disabled | Active toggle disabled with safety tooltip when editing last admin | `client/tests/lab-03/UserManagement.test.tsx` | `Planned` |
| **UI-30** | UI | FR-22, BR-23 | Admin Reset Initial Password modal flow | Displays confirmation modal and dispatches reset request | `client/tests/lab-03/UserManagement.test.tsx` | `Planned` |

---

### 2.3 End-to-End Test Scenarios (`e2e/lab-03/`)

| Test ID | Level | AC / BR Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **E2E-01** | E2E | AC-01, AC-08 | Valid login journey across Requester, IT Staff, and Admin | Each role lands on permitted home view with correct navigation | `e2e/lab-03/authentication.spec.ts` | `Planned` |
| **E2E-02** | E2E | AC-02, BR-02 | Seeded user with initial password performs mandatory change | App forces password change; user enters app only after valid change | `e2e/lab-03/authentication.spec.ts` | `Planned` |
| **E2E-03** | E2E | AC-05, BR-27 | Inactive user attempts login | Login rejected with `"Your account is currently inactive"` banner | `e2e/lab-03/authentication.spec.ts` | `Planned` |
| **E2E-04** | E2E | AC-07, BR-28 | User logs out; back-button navigation blocked | Server revokes token; protected views redirect to `/login` | `e2e/lab-03/authentication.spec.ts` | `Planned` |
| **E2E-05** | E2E | AC-13, AC-15 | IT Staff searches queue, claims ticket, updates IT Priority | Ownership updates to IT Staff; IT priority badge updates | `e2e/lab-03/staff-ticket-flow.spec.ts` | `Planned` |
| **E2E-06** | E2E | AC-18, BR-16 | IT Staff transitions ticket through status lifecycle | `NEW` $\rightarrow$ `OPEN` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED` verified | `e2e/lab-03/staff-ticket-flow.spec.ts` | `Planned` |
| **E2E-07** | E2E | AC-11, AC-20 | Requester & IT Staff Public Comment conversation + Private Note | Public comment visible to both; private note visible only to IT Staff | `e2e/lab-03/staff-ticket-flow.spec.ts` | `Planned` |
| **E2E-08** | E2E | AC-21, AC-22 | Admin creates new IT Staff user; new user logs in and changes pass | Full lifecycle verified from account provisioning to successful entry | `e2e/lab-03/user-administration.spec.ts` | `Planned` |
| **E2E-09** | E2E | AC-24, AC-25 | Admin safety rules: self-deactivation and last admin protection | Deactivation blocked on UI and API; safety feedback displayed | `e2e/lab-03/user-administration.spec.ts` | `Planned` |

---

## 3. Acceptance Criteria Traceability Matrix

Every Acceptance Criterion (AC-01 through AC-25) and Business Rule (BR-01 through BR-28) from `docs/lab-03/specification.md` is strictly mapped to automated tests across test levels:

| Acceptance Criterion | Description Summary | Primary Automated Tests | Test Level |
| :--- | :--- | :--- | :--- |
| **AC-01** | Valid authentication & role return | `API-01`, `UI-01`, `UI-06`, `E2E-01` | API, UI, E2E |
| **AC-02** | Mandatory password change gating | `API-05`, `API-06`, `UI-07`, `UI-10`, `E2E-02` | API, UI, E2E |
| **AC-03** | Server-side requester identity enforcement | `API-13`, `API-14` | API |
| **AC-04** | Internal Notes forbidden to Requester | `API-35`, `API-36`, `UI-25`, `E2E-07` | API, UI, E2E |
| **AC-05** | Inactive user rejected with safe feedback | `API-04`, `UI-04`, `E2E-03` | API, UI, E2E |
| **AC-06** | Invalid credentials safe failure | `API-02`, `API-03`, `UI-02`, `UI-03` | API, UI |
| **AC-07** | Server-side logout invalidation (`SESSION_REVOKED`) | `API-10`, `API-11`, `UI-12`, `E2E-04` | API, UI, E2E |
| **AC-08** | Role-filtered navigation in application shell | `API-15`, `API-16`, `UI-11`, `E2E-01` | API, UI, E2E |
| **AC-09** | Requester ticket creation defaults (`NEW`, unassigned) | `API-13`, `E2E-07` | API, E2E |
| **AC-10** | Requester My Tickets regression (owned only) | `API-13`, `API-14` | API |
| **AC-11** | Public Comment posting & visibility | `API-32`, `API-33`, `UI-22`, `E2E-07` | API, UI, E2E |
| **AC-12** | "Problem Appears Resolved" indication | `API-38`, `UI-24` | API, UI |
| **AC-13** | IT Staff shared Ticket Queue & Detail view | `API-19`, `API-25`, `UI-13`, `E2E-05` | API, UI, E2E |
| **AC-14** | Queue search, filters, pagination, secondary sort | `API-20`, `API-21`, `API-22`, `API-23`, `API-24`, `UI-14`, `UI-15`, `UI-16`, `UI-17` | API, UI |
| **AC-15** | IT Staff claims unassigned ticket | `API-26`, `UI-19`, `E2E-05` | API, UI, E2E |
| **AC-16** | IT Staff reassigns ticket ownership | `API-27`, `UI-19` | API, UI |
| **AC-17** | IT Priority updated independently | `API-29`, `UI-20`, `E2E-05` | API, UI, E2E |
| **AC-18** | Permitted status transitions per matrix | `API-30`, `UI-21`, `E2E-06` | API, UI, E2E |
| **AC-19** | Invalid status transition rejected (HTTP 400) | `API-31` | API |
| **AC-20** | Internal Notes created & viewed by Staff/Admin | `API-37`, `UI-23`, `E2E-07` | API, UI, E2E |
| **AC-21** | Administrator user list with search & role filter | `API-39`, `UI-26`, `E2E-08` | API, UI, E2E |
| **AC-22** | Administrator creates user with initial password | `API-40`, `UI-27`, `E2E-08` | API, UI, E2E |
| **AC-23** | Duplicate email registration rejected (HTTP 409) | `API-41`, `UI-27` | API, UI |
| **AC-24** | Admin edits user & self-deactivation prevented | `API-42`, `API-44`, `UI-28`, `E2E-09` | API, UI, E2E |
| **AC-25** | Last active administrator protected from removal | `API-45`, `UI-29`, `E2E-09` | API, UI, E2E |

---

## 4. Test Execution Instructions

### 4.1 Server API Tests
```bash
cd server
npm test -- tests/lab-03/
```

### 4.2 Client Component Tests
```bash
cd client
npm test -- tests/lab-03/
```

### 4.3 End-to-End (E2E) Tests
```bash
npx playwright test e2e/lab-03/
```

### 4.4 Full Regression Suite (Lab 1 + Lab 2 + Lab 3)
```bash
# Run server test suites
npm --prefix server test

# Run client test suites
npm --prefix client test
```
