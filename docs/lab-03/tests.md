# Lab 3 Test Plan and Traceability Matrix: TokTickIT Users, Roles, IT Staff Ticketing, and Admin Screens

## 1. Test Strategy

This document defines the comprehensive Test Strategy, Planned Test Matrix, and Dual Traceability Matrix (AC & BR) for **TokTickIT Lab 3 (Sprint 3)** in accordance with the course specification (Sections 9, 10, 12, and 14 Part 3).

The test plan is established **before implementation** (Test-Driven Development / Spec DD) to guarantee that every business rule, role boundary, API endpoint, security invariant, UI component, UI styling rule, responsive viewport, migration behavior, and end-to-end user workflow is thoroughly verified by automated tests.

---

### 1.1 Test Levels & Methodology

- **API & Integration Testing (Server)**:
  - Framework: Supertest with Vitest.
  - Scope: REST API contracts under `/api/v1/auth/*`, `/api/v1/tickets/*`, `/api/v1/staff/*`, and `/api/v1/admin/*`.
  - Invariants Tested: HTTP status codes (`200`, `201`, `400`, `401`, `403`, `404`, `405`, `409`), Bearer token validation, role authorization guards, server-side logout revocation, first-login password change gating, safe error payloads, and database state transitions.
- **UI Component & Interaction Testing (Client)**:
  - Framework: React Testing Library with Vitest and jsdom.
  - Scope: Authentication forms, password policy checklist, role navigation header, IT Staff Queue table/cards, operational ticket detail controls, public comments feed, internal notes tab, and Administrator user management modal.
  - Invariants Tested: Input validation, button busy/disabled states, error banner display, debounced search, filter synchronization, modal confirmation dialogues, and component lifecycle.
- **UI Style & Visual Invariants Testing**:
  - Scope: Strict adherence to the Zen Green Theme token palette (Primary Green `#006B3C`, Secondary Green `#0B7A46`, Pale Green `#EAF6EF`, Readonly `#F0F4F2`), status/priority/role badge styling contrast, visible keyboard focus rings, and absence of text clipping or overlap.
- **Responsive Viewport Testing**:
  - Scope: Automated viewport assertions on Desktop ($\ge 1280\text{px}$), Tablet ($768\text{px} - 1024\text{px}$), and Mobile ($375\text{px} - 480\text{px}$), asserting table-to-card transformation, minimum touch targets ($\ge 44\text{px}$), and zero unintended horizontal scrolling/overflow.
- **Migration & Regression Testing**:
  - Scope: Verifying that Development Requesters migrate cleanly into `User` entities, preserving existing ticket foreign keys, ownership associations, attachment files, and soft-removal metadata with zero data loss, while verifying all Lab 2 Requester APIs continue to function seamlessly using authenticated identity.
- **Role-Based Security & Authorization Testing**:
  - Invariants Tested: Strict server-side enforcement of the Authorization Matrix. Verification that Requesters cannot access other users' tickets, cannot query or post Internal Notes, cannot view the IT queue, and cannot access Admin user management. Verification that Administrators cannot deactivate themselves or eliminate the last active Administrator.
- **End-to-End (E2E) Workflow Testing**:
  - Framework: Playwright.
  - Scope: Complete multi-role user journeys across Login $\rightarrow$ First-login password change $\rightarrow$ Requester ticket creation defaults $\rightarrow$ IT Staff queue pickup & status transition $\rightarrow$ Public comment & internal note conversation $\rightarrow$ Admin user management $\rightarrow$ Server-side logout invalidation.

---

## 2. Planned Tests Catalog

### 2.1 Server API Tests (`server/tests/lab-03/`)

| Test ID | Level | AC / BR Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **API-01** | API | AC-01, BR-01, BR-05 | Valid login with active account credentials | HTTP 200 OK; returns valid JWT Bearer token and safe user profile | `server/tests/lab-03/auth.api.test.ts` | `Passing` |
| **API-02** | API | AC-06, BR-01, BR-26 | Login with incorrect password | HTTP 401 Unauthorized with safe code `INVALID_CREDENTIALS` | `server/tests/lab-03/auth.api.test.ts` | `Passing` |
| **API-03** | API | AC-06, BR-01, BR-26 | Login with unregistered email address | HTTP 401 Unauthorized with safe code `INVALID_CREDENTIALS` | `server/tests/lab-03/auth.api.test.ts` | `Passing` |
| **API-04** | API | AC-05, BR-01, BR-27 | Login attempt for inactive account (`isActive: false`) | HTTP 401 Unauthorized with code `ACCOUNT_INACTIVE` | `server/tests/lab-03/auth.api.test.ts` | `Passing` |
| **API-05** | API | AC-02, BR-02 | User with `mustChangePassword: true` invoking normal API | HTTP 403 Forbidden with code `PASSWORD_CHANGE_REQUIRED` | `server/tests/lab-03/auth.api.test.ts` | `Passing` |
| **API-06** | API | AC-02, BR-05, BR-06 | Change password with valid credentials meeting policy | HTTP 200 OK; updates password hash and sets `mustChangePassword: false` | `server/tests/lab-03/auth.api.test.ts` | `Passing` |
| **API-07** | API | AC-02, BR-06 | Change password where new password matches initial password | HTTP 400 Bad Request with validation error | `server/tests/lab-03/auth.api.test.ts` | `Passing` |
| **API-08** | API | AC-02, BR-06 | Change password failing complexity rule (< 8 chars, no symbol) | HTTP 400 Bad Request with validation details | `server/tests/lab-03/auth.api.test.ts` | `Passing` |
| **API-09** | API | FR-04, BR-03 | Retrieve profile of authenticated user (`GET /api/v1/auth/me`) | HTTP 200 OK with authenticated user ID, name, email, role | `server/tests/lab-03/auth.api.test.ts` | `Passing` |
| **API-10** | API | AC-07, BR-28 | Invoke logout (`POST /api/v1/auth/logout`) with active Bearer token | HTTP 200 OK; server adds `jti` to revoked token registry | `server/tests/lab-03/auth.api.test.ts` | `Passing` |
| **API-10b** | API | AC-07, BR-28 | Repeated logout invocation with already revoked token | HTTP 401 Unauthorized with code `SESSION_REVOKED` (intercepted by `requireAuth`) | `server/tests/lab-03/auth.api.test.ts` | `Passing` |
| **API-11** | API | AC-07, BR-28 | Request protected endpoint using a revoked token | HTTP 401 Unauthorized with code `SESSION_REVOKED` | `server/tests/lab-03/auth.api.test.ts` | `Passing` |
| **API-12a** | API | BR-05, BR-28 | Request protected endpoint with expired JWT | HTTP 401 Unauthorized with code `SESSION_EXPIRED` | `server/tests/lab-03/auth.api.test.ts` | `Passing` |
| **API-12b** | API | BR-05, BR-28 | Request protected endpoint with forged or tampered JWT | HTTP 401 Unauthorized with code `SESSION_INVALID` | `server/tests/lab-03/auth.api.test.ts` | `Passing` |
| **API-13** | API | AC-03, BR-03 | Requester ticket operation ignoring client-provided `requesterId` | HTTP 200/201; server enforces `userId` from session token | `server/tests/lab-03/auth.api.test.ts` | `Passing` |
| **API-14** | API | AC-03, BR-12 | Requester attempts to access another Requester's ticket | HTTP 403 Forbidden; cross-requester access blocked | `server/tests/lab-03/auth.api.test.ts` | `Passing` |
| **SECURITY-01** | API | BR-05, Security | Ticket Detail response excludes user `passwordHash` and `tokenVersion` | HTTP 200 OK; response payload excludes sensitive credentials and internal security fields | `server/tests/lab-03/auth.api.test.ts` | `Passing` |
| **API-15** | API | AC-08, BR-24 | Requester attempts to query IT Staff Queue (`/api/v1/staff/*`) | HTTP 403 Forbidden with code `INSUFFICIENT_PERMISSIONS` | `server/tests/lab-03/authorization.api.test.ts` | `Passing` |
| **API-16** | API | AC-08, BR-24 | Requester attempts to access Admin User API (`/api/v1/admin/*`) | HTTP 403 Forbidden with code `INSUFFICIENT_PERMISSIONS` | `server/tests/lab-03/authorization.api.test.ts` | `Passing` |
| **API-17** | API | BR-24 | IT Staff attempts to access Admin User API (`/api/v1/admin/*`) | HTTP 403 Forbidden with code `INSUFFICIENT_PERMISSIONS` | `server/tests/lab-03/authorization.api.test.ts` | `Passing` |
| **API-18** | API | BR-24 | Administrator accesses IT Staff ticket operations | HTTP 200 OK; authorized per approved Authorization Matrix | `server/tests/lab-03/authorization.api.test.ts` | `Passing` |
| **API-19** | API | AC-13, BR-15, BR-23 | IT Staff retrieves Ticket Queue with default pagination and sorting | HTTP 200 OK; returns ticket list and pagination metadata | `server/tests/lab-03/staff-queue.api.test.ts` | `Passing` |
| **API-20** | API | AC-14, FR-11 | Search Ticket Queue by ticket number, summary, or requester name | HTTP 200 OK; returns only matching records | `server/tests/lab-03/staff-queue.api.test.ts` | `Passing` |
| **API-20b** | API | AC-14, FR-11 | Search Ticket Queue by requester email address | HTTP 200 OK; returns only matching records by email | `server/tests/lab-03/staff-queue.api.test.ts` | `Passing` |
| **API-21** | API | AC-14, FR-11 | Filter Ticket Queue by status (single or comma-separated) | HTTP 200 OK; returns tickets matching requested statuses | `server/tests/lab-03/staff-queue.api.test.ts` | `Passing` |
| **API-22** | API | AC-14, FR-11 | Filter Ticket Queue by priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) | HTTP 200 OK; returns tickets matching IT Priority | `server/tests/lab-03/staff-queue.api.test.ts` | `Passing` |
| **API-23** | API | AC-14, FR-11 | Filter Ticket Queue by ownership: `ALL`, `UNASSIGNED`, `ASSIGNED_TO_ME` | HTTP 200 OK; correctly filters by `ownerId` | `server/tests/lab-03/staff-queue.api.test.ts` | `Passing` |
| **API-24** | API | AC-14, BR-23 | Queue deterministic secondary sorting by `id desc` on duplicate dates | HTTP 200 OK; asserts deterministic ordering | `server/tests/lab-03/staff-queue.api.test.ts` | `Passing` |
| **API-24b** | API | AC-14, FR-11 | Combined filters: Search + Priority + Status + Ownership simultaneously | HTTP 200 OK; applies all filter criteria without overwriting | `server/tests/lab-03/staff-queue.api.test.ts` | `Passing` |
| **API-25** | API | AC-13, FR-12 | IT Staff retrieves single ticket detail with operational metadata | HTTP 200 OK; returns full ticket, comments, and notes | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | `Passing` |
| **API-26** | API | AC-15, BR-13 | IT Staff claims unassigned ticket (`PATCH /assignment` with own ID) | HTTP 200 OK; `ownerId` updated to current user | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | `Passing` |
| **API-27** | API | AC-16, BR-13 | IT Staff reassigns ticket to another active IT Staff / Admin | HTTP 200 OK; `ownerId` updated to target user | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | `Passing` |
| **API-28** | API | BR-13 | Assign ticket to inactive user or user with `REQUESTER` role | HTTP 400 Bad Request; invalid owner rejected | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | `Passing` |
| **API-29** | API | AC-17, BR-14 | IT Staff updates IT Priority independently of Requested Priority | HTTP 200 OK; `itPriority` updated, `requestedPriority` unchanged | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | `Passing` |
| **API-30** | API | AC-18, BR-15, BR-16, BR-17, BR-18 | Permitted status transition (e.g. `NEW` $\rightarrow$ `OPEN`, `OPEN` $\rightarrow$ `IN_PROGRESS`) | HTTP 200 OK; status updated in database | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | `Passing` |
| **API-31** | API | AC-19, BR-16, BR-17 | Invalid status transition (e.g. `NEW` $\rightarrow$ `RESOLVED`, `CLOSED` $\rightarrow$ `OPEN`) | HTTP 400 Bad Request with code `INVALID_STATUS_TRANSITION` | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | `Passing` |
| **API-32** | API | AC-11, BR-07, BR-08, BR-09 | Requester posts Public Comment on owned ticket | HTTP 201 Created; author set to requester ID; visible in feed | `server/tests/lab-03/comments-notes.api.test.ts` | `Passing` |
| **API-33** | API | BR-07, BR-09 | IT Staff posts Public Comment on any ticket | HTTP 201 Created; author set to IT staff ID; timestamp recorded | `server/tests/lab-03/comments-notes.api.test.ts` | `Passing` |
| **API-34** | API | BR-10 | Post Public Comment with empty or whitespace-only content | HTTP 400 Bad Request with validation error | `server/tests/lab-03/comments-notes.api.test.ts` | `Passing` |
| **API-35** | API | AC-04, BR-25 | Requester attempts to view Internal Notes (`GET /api/v1/tickets/:id/notes`) | HTTP 403 Forbidden; zero note data returned | `server/tests/lab-03/comments-notes.api.test.ts` | `Passing` |
| **API-36** | API | AC-04, BR-25 | Requester attempts to create Internal Note (`POST /api/v1/tickets/:id/notes`) | HTTP 403 Forbidden; note creation rejected | `server/tests/lab-03/comments-notes.api.test.ts` | `Passing` |
| **API-37** | API | AC-20, BR-07, BR-08, BR-09 | IT Staff / Admin creates and retrieves Internal Notes | HTTP 200/201; returns internal note payload with author & time | `server/tests/lab-03/comments-notes.api.test.ts` | `Passing` |
| **API-38** | API | AC-12, BR-11 | Requester marks ticket as "Problem Appears Resolved" | HTTP 200 OK; sets `isRequesterResolved: true`, status unchanged | `server/tests/lab-03/comments-notes.api.test.ts` | `Passing` |
| **API-39** | API | AC-21, FR-18, FR-19 | Administrator retrieves user list with search by name/email & role | HTTP 200 OK; returns list of users with safe fields | `server/tests/lab-03/users-admin.api.test.ts` | `Passing` |
| **API-40** | API | AC-22, BR-04, BR-05, BR-23 | Administrator creates new user with one role and initial password | HTTP 201 Created; hashes password, sets `mustChangePassword: true` | `server/tests/lab-03/users-admin.api.test.ts` | `Passing` |
| **API-41** | API | AC-23, BR-20 | Administrator attempts to create user with existing duplicate email | HTTP 409 Conflict with code `DUPLICATE_EMAIL` | `server/tests/lab-03/users-admin.api.test.ts` | `Passing` |
| **API-42** | API | AC-24, BR-19, FR-21 | Administrator updates user name, email, role, and active status | HTTP 200 OK; updates persisted | `server/tests/lab-03/users-admin.api.test.ts` | `Passing` |
| **API-43** | API | FR-22, BR-23 | Administrator resets initial password for user | HTTP 200 OK; sets new hash and `mustChangePassword = true` | `server/tests/lab-03/users-admin.api.test.ts` | `Passing` |
| **API-44** | API | AC-24, BR-21 | Administrator attempts to deactivate their own account | HTTP 400 Bad Request with code `CANNOT_DEACTIVATE_SELF` | `server/tests/lab-03/users-admin.api.test.ts` | `Passing` |
| **API-45** | API | AC-25, BR-22 | Administrator attempts to deactivate or reassign the last active Admin | HTTP 400 Bad Request with code `LAST_ACTIVE_ADMIN_PROTECTED` | `server/tests/lab-03/users-admin.api.test.ts` | `Passing` |
| **API-46** | API | AC-09, BR-03, BR-13, BR-14, BR-15 | Requester creates Ticket with authenticated identity | HTTP 201 Created; asserts `status: "NEW"`, `itPriority: requestedPriority`, `ownerId: null`, `requesterId: session.userId` | `server/tests/lab-03/create-ticket-defaults.api.test.ts` | `Planned` |
| **API-47** | API | BR-26 | Repeated failed login attempts (5+ consecutive invalid attempts) | HTTP 401 `INVALID_CREDENTIALS` on each attempt; asserts no account lockout or persistent lock state | `server/tests/lab-03/auth.api.test.ts` | `Planned` |
| **API-48** | API | BR-19 | Direct HTTP DELETE on user endpoint (`DELETE /api/v1/admin/users/:id`) | HTTP 405 Method Not Allowed (or 404); user deletion is prohibited, deactivation is exclusive removal | `server/tests/lab-03/users-admin.api.test.ts` | `Passing` |

---

### 2.2 Client Component Tests (`client/tests/lab-03/`)

| Test ID | Level | AC / BR Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **UI-01** | UI | AC-01, FR-01 | Login screen initial render in Zen Green style | Renders email, password inputs, password toggle, and submit button | `client/tests/lab-03/Login.test.tsx` | `Passing` |
| **UI-02** | UI | AC-06, BR-26 | Client validation on empty email or password | Prevents API dispatch, displays field validation indicators | `client/tests/lab-03/Login.test.tsx` | `Passing` |
| **UI-03** | UI | AC-06, BR-01 | Login error banner on `INVALID_CREDENTIALS` | Displays `"Invalid email or password. Please try again."` | `client/tests/lab-03/Login.test.tsx` | `Passing` |
| **UI-04** | UI | AC-05, BR-27 | Login error banner on `ACCOUNT_INACTIVE` | Displays `"Your account is currently inactive. Please contact an administrator."` | `client/tests/lab-03/Login.test.tsx` | `Passing` |
| **UI-05** | UI | AC-06, BR-26 | Form submission busy state | Submit button disabled and shows spinner while request is in-flight | `client/tests/lab-03/Login.test.tsx` | `Passing` |
| **UI-06** | UI | AC-01, FR-06 | Successful login navigates to role landing page | Stores token, sets user state, redirects to `/tickets` or `/queue` | `client/tests/lab-03/Login.test.tsx` | `Passing` |
| **UI-06a** | UI | AC-01, FR-06 | Successful login for IT_STAFF role | Stores token, navigates to `/queue` | `client/tests/lab-03/Login.test.tsx` | `Passing` |
| **UI-06b** | UI | AC-01, FR-06 | Successful login for ADMIN role | Stores token, navigates to `/queue` | `client/tests/lab-03/Login.test.tsx` | `Passing` |
| **UI-06c** | UI | AC-02, BR-02 | Login for user requiring password change | Sets state, redirects to `/change-password` | `client/tests/lab-03/Login.test.tsx` | `Passing` |
| **UI-06d** | UI | FR-01 | Password visibility toggle on login form | Toggles input type between password and text | `client/tests/lab-03/Login.test.tsx` | `Passing` |
| **UI-07** | UI | AC-02, BR-02 | Mandatory change password screen rendering | Renders current, new, confirm password fields, blocks normal navigation | `client/tests/lab-03/ChangePassword.test.tsx` | `Passing` |
| **UI-08** | UI | AC-02, BR-06 | Real-time password complexity rule checklist | Checklist items turn green as user satisfies length, case, number/symbol | `client/tests/lab-03/ChangePassword.test.tsx` | `Passing` |
| **UI-09** | UI | AC-02, BR-06 | Password confirmation mismatch validation | Displays mismatch error and keeps Submit button disabled | `client/tests/lab-03/ChangePassword.test.tsx` | `Passing` |
| **UI-10** | UI | AC-02, BR-02 | Successful password change unblocks user | Dispatches change API, clears gating, transitions into main application | `client/tests/lab-03/ChangePassword.test.tsx` | `Passing` |
| **UI-10a** | UI | FR-02 | Password visibility toggles on change password form | Toggles visibility independently on current, new, and confirm inputs | `client/tests/lab-03/ChangePassword.test.tsx` | `Passing` |
| **UI-11** | UI | AC-08, FR-06 | Application Header role navigation rendering | Displays role badge, role-filtered navigation items, removes dev selector | `client/tests/lab-03/AppShell.test.tsx` | `Passing` |
| **UI-11a** | UI | AC-08, FR-06 | Header role navigation for IT_STAFF | Renders Ticket Queue link; excludes + Create Ticket link | `client/tests/lab-03/AppShell.test.tsx` | `Passing` |
| **UI-11b** | UI | AC-08, FR-06 | Header role navigation for ADMIN | Renders Ticket Queue and User Management links | `client/tests/lab-03/AppShell.test.tsx` | `Passing` |
| **UI-11c** | UI | FR-06 | Profile dropdown menu toggling and items | Displays user email, Change Password link, and Sign Out action | `client/tests/lab-03/AppShell.test.tsx` | `Passing` |
| **UI-12** | UI | AC-07, BR-28 | User clicks Sign Out action in header | Calls logout API, clears local storage token, redirects to `/login` | `client/tests/lab-03/AppShell.test.tsx` | `Passing` |
| **UI-12a** | UI | AC-07, BR-28 | Sign Out action closes profile dropdown | Closes dropdown menu and triggers session termination | `client/tests/lab-03/AppShell.test.tsx` | `Passing` |
| **UI-13** | UI | AC-13, FR-10 | IT Staff Ticket Queue desktop table render | Table renders Ticket No, Date, Summary, Priority & Status badges, Owner | `client/tests/lab-03/StaffTicketQueue.test.tsx` | `Passing` |
| **UI-14** | UI | AC-14, FR-11 | Ticket Queue search box input | Debounced search triggers API reload with query parameter | `client/tests/lab-03/StaffTicketQueue.test.tsx` | `Passing` |
| **UI-15** | UI | AC-14, FR-11 | Ticket Queue Status and Priority filter dropdowns | Selecting filters updates API parameters and reloads table | `client/tests/lab-03/StaffTicketQueue.test.tsx` | `Passing` |
| **UI-16** | UI | AC-14, FR-11 | Ticket Queue Ownership filter (All / Unassigned / Mine) | Toggling ownership reloads queue with respective scope | `client/tests/lab-03/StaffTicketQueue.test.tsx` | `Passing` |
| **UI-17** | UI | AC-14, BR-23 | Ticket Queue pagination bar navigation | Clicking next/previous/page numbers reloads page with correct offset | `client/tests/lab-03/StaffTicketQueue.test.tsx` | `Passing` |
| **UI-18** | UI | AC-14, FR-11 | Ticket Queue empty and no-results states | Renders clear feedback when queue has no items or no search matches | `client/tests/lab-03/StaffTicketQueue.test.tsx` | `Passing` |
| **UI-19** | UI | AC-15, AC-16, BR-13 | IT Staff Ticket Detail: Claim button & Owner dropdown | Clicking Claim sets owner; selecting new owner triggers reassignment | `client/tests/lab-03/StaffTicketDetail.test.tsx` | `Passing` |
| **UI-20** | UI | AC-17, BR-14 | IT Staff Ticket Detail: IT Priority dropdown | Changing priority sends patch request and updates badge immediately | `client/tests/lab-03/StaffTicketDetail.test.tsx` | `Passing` |
| **UI-21** | UI | AC-18, BR-16 | IT Staff Ticket Detail: Status dropdown options | Dropdown only presents valid next statuses according to transition matrix | `client/tests/lab-03/StaffTicketDetail.test.tsx` | `Passing` |
| **UI-22** | UI | AC-11, BR-07 | Public Comments tab render and submit | Displays chronological comments and post form with character counter | `client/tests/lab-03/RequesterTicketDetail.test.tsx` | `Passing` |
| **UI-23** | UI | AC-20, BR-07 | Internal Notes tab with amber distinction styling | Displays amber distinction banner, private notes list, and note form | `client/tests/lab-03/StaffTicketDetail.test.tsx` | `Passing` |
| **UI-24** | UI | AC-12, BR-11 | Requester Ticket Detail: "Problem Appears Resolved" button | Clicking button shows confirmed indicator; official status unchanged | `client/tests/lab-03/RequesterTicketDetail.test.tsx` | `Passing` |
| **UI-25** | UI | AC-04, BR-25 | Requester Ticket Detail: Internal Notes tab absence | Internal Notes tab is completely hidden from Requester view | `client/tests/lab-03/RequesterTicketDetail.test.tsx` | `Passing` |
| **UI-26** | UI | AC-21, FR-18 | Administrator User Management table render | Displays user rows with Name, Email, Role badge, Status dot, Edit button | `client/tests/lab-03/UserManagement.test.tsx` | `Passing` |
| **UI-27** | UI | AC-22, BR-20 | Admin Create User modal validation & submission | Validates email, role, initial password; handles duplicate email error | `client/tests/lab-03/UserManagement.test.tsx` | `Passing` |
| **UI-28** | UI | AC-24, BR-21 | Admin Edit User modal: Self-deactivation disabled | Active toggle disabled with safety tooltip when editing own account | `client/tests/lab-03/UserManagement.test.tsx` | `Passing` |
| **UI-29** | UI | AC-25, BR-22 | Admin Edit User modal: Last admin deactivation disabled | Active toggle disabled with safety tooltip when editing last admin | `client/tests/lab-03/UserManagement.test.tsx` | `Passing` |
| **UI-30** | UI | FR-22, BR-23 | Admin Reset Initial Password modal flow | Displays confirmation modal and dispatches reset request | `client/tests/lab-03/UserManagement.test.tsx` | `Passing` |
| **CLIENT-AUTH-01** | UI | AC-03, AC-10, BR-03 | MyTickets requests `/api/v1/tickets` with Bearer header and omits `requesterId` | HTTP 200; uses session token; zero `requesterId` in query | `client/tests/lab-03/BusinessPagesAuth.test.tsx` | `Passing` |
| **CLIENT-AUTH-02** | UI | AC-03, AC-09, BR-03 | CreateTicket posts ticket with Bearer header and omits `requesterId` from body | HTTP 201; server enforces `userId` from token; body excludes `requesterId` | `client/tests/lab-03/BusinessPagesAuth.test.tsx` | `Passing` |
| **CLIENT-AUTH-03** | UI | AC-03, AC-10, BR-12 | TicketDetail loads ticket using Bearer token and omits `requesterId` from GET url | HTTP 200; retrieves ticket via session token | `client/tests/lab-03/BusinessPagesAuth.test.tsx` | `Passing` |
| **CLIENT-AUTH-04** | UI | BR-12, Migration | Attachment actions (upload, download, remove) use Bearer authentication | Dispatches requests with Bearer token; zero `requesterId` query params | `client/tests/lab-03/BusinessPagesAuth.test.tsx` | `Passing` |
| **CLIENT-AUTH-05** | UI | AC-02, BR-02 | HTTP 403 `PASSWORD_CHANGE_REQUIRED` dispatches `password-change-required` event | `apiFetch` detects 403 code; fires window event; flags `mustChangePassword` | `client/tests/lab-03/BusinessPagesAuth.test.tsx` | `Passing` |

---

### 2.3 End-to-End Test Scenarios (`e2e/lab-03/`)

| Test ID | Level | AC / BR Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **E2E-01** | E2E | AC-01, AC-08, BR-01 | Valid login journey across Requester, IT Staff, and Admin | Each role lands on permitted home view with correct navigation | `e2e/lab-03/authentication.spec.ts` | `Passing` |
| **E2E-02** | E2E | AC-02, BR-02, BR-06 | Seeded user with initial password performs mandatory change | App forces password change; user enters app only after valid change | `e2e/lab-03/authentication.spec.ts` | `Passing` |
| **E2E-03** | E2E | AC-05, BR-27 | Inactive user attempts login | Login rejected with `"Your account is currently inactive"` banner | `e2e/lab-03/authentication.spec.ts` | `Passing` |
| **E2E-04** | E2E | AC-07, BR-28 | User logs out; back-button navigation blocked | Server revokes token; protected views redirect to `/login` | `e2e/lab-03/authentication.spec.ts` | `Passing` |
| **E2E-05** | E2E | AC-13, AC-15, AC-17 | IT Staff searches queue, claims ticket, updates IT Priority | Ownership updates to IT Staff; IT priority badge updates | `e2e/lab-03/staff-ticket-flow.spec.ts` | `Passing` |
| **E2E-06** | E2E | AC-18, BR-16, BR-17 | IT Staff transitions ticket through status lifecycle | `NEW` $\rightarrow$ `OPEN` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED` verified | `e2e/lab-03/staff-ticket-flow.spec.ts` | `Passing` |
| **E2E-07** | E2E | AC-11, AC-20, BR-07 | Requester & IT Staff Public Comment conversation + Private Note | Public comment visible to both; private note visible only to IT Staff | `e2e/lab-03/staff-ticket-flow.spec.ts` | `Passing` |
| **E2E-08** | E2E | AC-21, AC-22, BR-04 | Admin creates new IT Staff user; new user logs in and changes pass | Full lifecycle verified from account provisioning to successful entry | `e2e/lab-03/user-administration.spec.ts` | `Passing` |
| **E2E-09** | E2E | AC-24, AC-25, BR-21 | Admin safety rules: self-deactivation and last admin protection | Deactivation blocked on UI and API; safety feedback displayed | `e2e/lab-03/user-administration.spec.ts` | `Passing` |
| **E2E-10** | E2E | AC-09, BR-13, BR-14, BR-15 | Requester creates ticket via UI; asserts initial defaults | Ticket created with status `NEW`, matching IT Priority, unassigned | `e2e/lab-03/user-administration.spec.ts` | `Passing` |

---

### 2.4 UI Style & Visual Invariant Tests (`VIS-01` to `VIS-04`)

| Test ID | Level | Requirement Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **VIS-01** | Style | Section 7, Section 2 | Zen Green token fidelity across buttons, header, and inputs | Computed styles match `#006B3C`, `#0B7A46`, `#EAF6EF`, `#F0F4F2` | `client/tests/lab-03/ui-style.test.tsx` | `Passing` |
| **VIS-02** | Style | Section 7, Section 2 | Badge color consistency for Status, Priority, and Roles | Badges conform to color token specifications and meet WCAG contrast | `client/tests/lab-03/ui-style.test.tsx` | `Passing` |
| **VIS-03** | Style | Section 7, Section 6 | Keyboard focus rings and interactive outline indicators | Active focus indicators clearly visible on all inputs, tabs, and buttons | `client/tests/lab-03/accessibility.test.tsx` | `Passing` |
| **VIS-04** | Style | Section 7, Section 6 | Zero text clipping and element overlap on dense data | Long summaries, user emails, and ticket numbers wrap/truncate cleanly | `e2e/helpers/visual-check.ts` | `Passing` |

---

### 2.5 Responsive Viewport Tests (`RESP-01` to `RESP-04`)

| Test ID | Level | Viewport Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **RESP-01** | Responsive | Desktop ($\ge 1280\text{px}$) | Multi-column table, toolbar, and side-by-side operational panels | Full desktop layouts render without truncation or misalignment | `playwright.config.ts` (Desktop) | `Passing` |
| **RESP-02** | Responsive | Tablet ($768\text{px} - 1024\text{px}$) | 2-column form grids, condensed table layout, sticky header | Tablet layout preserves readability and filter accessibility | `playwright.config.ts` (Tablet) | `Passing` |
| **RESP-03** | Responsive | Mobile & Tablet ($375 - 480px / $768 - 1024px) | Tables transform to stacked cards; minimum touch targets $\ge 44\text{px}$ | Cards render cleanly; buttons, inputs, and selects meet minimum 44 × 44px hit-area targets | `e2e/helpers/visual-check.ts` | `Passing` |
| **RESP-04** | Responsive | Mobile & Tablet | Zero unintended horizontal scrolling / page overflow | `document.documentElement.scrollWidth <= window.innerWidth` asserts true | `e2e/helpers/visual-check.ts` | `Passing` |

---

### 2.6 Migration & Regression Tests (`MIG-01` to `MIG-04`)

| Test ID | Level | Migration Ref | What It Tests (Description) | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **MIG-01** | Migration | Section 5.2, BR-02 | Development Requester migration to `User` entities | Preserves user IDs, hashes initial passwords, sets `mustChangePassword = true` | `server/tests/lab-03/migration-regression.test.ts` | `Planned` |
| **MIG-02** | Migration | Section 5.1, Section 5.2 | Ticket ownership preservation post-migration | Pre-migration tickets retain identical `requesterId` pointing to valid `User` | `server/tests/lab-03/migration-regression.test.ts` | `Planned` |
| **MIG-03** | Migration | Section 5.1 | Attachment file and metadata continuity post-migration | All attachments remain linked to tickets; download and soft-removal intact | `server/tests/lab-03/migration-regression.test.ts` | `Planned` |
| **MIG-04** | Regression | Section 1, Section 5.2 | Lab 2 Requester API regression under authenticated session | My Tickets, Create Ticket, Attachment upload/removal work with token | `server/tests/lab-03/migration-regression.test.ts` | `Planned` |

---

## 3. Dual Traceability Matrix

### 3.1 Acceptance Criteria Traceability Matrix (AC-01 through AC-25)

Every Acceptance Criterion is strictly mapped to its primary automated tests:

| Acceptance Criterion | Description Summary | Primary Automated Tests | Test Level |
| :--- | :--- | :--- | :--- |
| **AC-01** | Valid authentication & role return | `API-01`, `UI-01`, `UI-06`, `E2E-01` | API, UI, E2E |
| **AC-02** | Mandatory password change gating | `API-05`, `API-06`, `API-07`, `API-08`, `UI-07`, `UI-08`, `UI-09`, `UI-10`, `E2E-02` | API, UI, E2E |
| **AC-03** | Server-side requester identity enforcement | `API-13`, `API-14`, `MIG-02` | API, Migration |
| **AC-04** | Internal Notes forbidden to Requester | `API-35`, `API-36`, `UI-25`, `E2E-07` | API, UI, E2E |
| **AC-05** | Inactive user rejected with safe feedback | `API-04`, `UI-04`, `E2E-03` | API, UI, E2E |
| **AC-06** | Invalid credentials safe failure | `API-02`, `API-03`, `UI-02`, `UI-03` | API, UI |
| **AC-07** | Server-side logout invalidation (`SESSION_REVOKED`) | `API-10`, `API-11`, `UI-12`, `E2E-04` | API, UI, E2E |
| **AC-08** | Role-filtered navigation in application shell | `API-15`, `API-16`, `UI-11`, `E2E-01` | API, UI, E2E |
| **AC-09** | Requester ticket creation defaults (`NEW`, unassigned) | `API-46`, `E2E-10` | API, E2E |
| **AC-10** | Requester My Tickets regression (owned only) | `API-13`, `API-14`, `MIG-04` | API, Regression |
| **AC-11** | Public Comment posting & visibility | `API-32`, `API-33`, `UI-22`, `E2E-07` | API, UI, E2E |
| **AC-12** | "Problem Appears Resolved" indication | `API-38`, `UI-24` | API, UI |
| **AC-13** | IT Staff shared Ticket Queue & Detail view | `API-19`, `API-25`, `UI-13`, `E2E-05` | API, UI, E2E |
| **AC-14** | Queue search, filters, pagination, secondary sort | `API-20`, `API-21`, `API-22`, `API-23`, `API-24`, `UI-14`, `UI-15`, `UI-16`, `UI-17`, `UI-18` | API, UI |
| **AC-15** | IT Staff claims unassigned ticket | `API-26`, `UI-19`, `E2E-05` | API, UI, E2E |
| **AC-16** | IT Staff reassigns ticket ownership | `API-27`, `UI-19` | API, UI |
| **AC-17** | IT Priority updated independently | `API-29`, `UI-20`, `E2E-05` | API, UI, E2E |
| **AC-18** | Permitted status transitions per matrix | `API-30`, `UI-21`, `E2E-06` | API, UI, E2E |
| **AC-19** | Invalid status transition rejected (HTTP 400) | `API-31` | API |
| **AC-20** | Internal Notes created & viewed by Staff/Admin | `API-37`, `UI-23`, `E2E-07` | API, UI, E2E |
| **AC-21** | Administrator user list with search & role filter | `API-39`, `UI-26`, `E2E-08` | API, UI, E2E |
| **AC-22** | Administrator creates user with initial password | `API-40`, `UI-27`, `E2E-08` | API, UI, E2E |
| **AC-23** | Duplicate email registration rejected (HTTP 409) | `API-41`, `UI-27` | API, UI |
| **AC-24** | Admin edits user & self-deactivation prevented | `API-42`, `API-42b`, `API-42c`, `API-44`, `UI-28`, `E2E-09` | API, UI, E2E |
| **AC-25** | Last active administrator protected from removal | `API-45`, `API-45b`, `UI-29`, `E2E-09` | API, UI, E2E |

---

### 3.2 Business Rules Traceability Matrix (BR-01 through BR-28)

Every Business Rule from `docs/lab-03/specification.md` is mapped to its automated verification tests:

| BR ID | Business Rule Summary | Automated Verification Tests | Test Level |
| :--- | :--- | :--- | :--- |
| **BR-01** | Active account credentials authentication; inactive returns `ACCOUNT_INACTIVE` | `API-01`, `API-02`, `API-03`, `API-04`, `UI-03`, `UI-04`, `E2E-01` | API, UI, E2E |
| **BR-02** | Mandatory password change gating before normal app access | `API-05`, `API-06`, `UI-07`, `UI-10`, `E2E-02`, `MIG-01` | API, UI, E2E, Mig |
| **BR-03** | Server-side identity determines Requester ownership, ignoring client ID | `API-09`, `API-13`, `API-46`, `MIG-02` | API, Migration |
| **BR-04** | Exactly one permitted role per user (`REQUESTER`, `IT_STAFF`, `ADMIN`) | `API-40`, `UI-27`, `E2E-08` | API, UI, E2E |
| **BR-05** | Bcrypt password hashing ($\ge 10$ rounds); never stored in plaintext | `API-01`, `API-06`, `API-12a`, `API-12b`, `API-40`, `MIG-01` | API, Migration |
| **BR-06** | Password complexity ($\ge 8$ chars, upper, lower, symbol, diff from temp) | `API-06`, `API-07`, `API-08`, `UI-08`, `UI-09`, `E2E-02` | API, UI, E2E |
| **BR-07** | Public Comments visible to all; Internal Notes restricted to Staff/Admin | `API-32`, `API-33`, `API-37`, `UI-22`, `UI-23`, `E2E-07` | API, UI, E2E |
| **BR-08** | Append-only architecture for comments & notes; no editing or deletion | `API-32`, `API-37` | API |
| **BR-09** | Backend authoritative author and timestamp recording | `API-32`, `API-33`, `API-37` | API |
| **BR-10** | Content validation: non-empty, 1–2,000 characters | `API-34` | API |
| **BR-11** | Requester problem resolution indication; no direct status change | `API-38`, `UI-24` | API, UI |
| **BR-12** | Requesters view and manage only owned tickets & attachments | `API-14`, `MIG-04` | API, Regression |
| **BR-13** | Zero or one primary owner; active IT Staff/Admin only; initial unassigned | `API-26`, `API-27`, `API-28`, `API-46`, `UI-19`, `E2E-05`, `E2E-10` | API, UI, E2E |
| **BR-14** | IT Priority copies Requested Priority initially; modified independently | `API-29`, `API-46`, `UI-20`, `E2E-05`, `E2E-10` | API, UI, E2E |
| **BR-15** | 8 permitted ticket statuses (`NEW` through `CANCELLED`) | `API-19`, `API-30`, `API-46`, `E2E-10` | API, E2E |
| **BR-16** | Permitted status transition matrix enforcement | `API-30`, `API-31`, `UI-21`, `E2E-06` | API, UI, E2E |
| **BR-17** | Only active IT Staff & Administrators can transition ticket status | `API-30`, `API-31`, `E2E-06` | API, E2E |
| **BR-18** | Status resolution without Actions Taken verification (deferred to Lab 4) | `API-30`, `E2E-06` | API, E2E |
| **BR-19** | User deletion prohibited; deactivation used exclusively; HTTP DELETE rejected | `API-42`, `API-48`, `UI-28` | API, UI |
| **BR-20** | Globally unique email addresses; duplicate returns HTTP 409 Conflict | `API-41`, `UI-27` | API, UI |
| **BR-21** | Administrator self-deactivation prevention | `API-44`, `UI-28`, `E2E-09` | API, UI, E2E |
| **BR-22** | Last active administrator protection | `API-45`, `UI-29`, `E2E-09` | API, UI, E2E |
| **BR-23** | Initial password provisioning flags `mustChangePassword = true` | `API-40`, `API-43`, `E2E-08` | API, E2E |
| **BR-24** | Direct non-admin access to `/api/v1/admin/*` returns HTTP 403 Forbidden | `API-15`, `API-16`, `API-17`, `API-18` | API |
| **BR-25** | Direct Requester access to internal notes returns HTTP 403 with no leak | `API-35`, `API-36`, `UI-25` | API, UI |
| **BR-26** | Failed login safe generic error; no persistent lock counter or lockout | `API-02`, `API-03`, `API-47`, `UI-02`, `UI-05` | API, UI |
| **BR-27** | Deactivated account tokens rejected; login returns `ACCOUNT_INACTIVE` | `API-04`, `UI-04`, `E2E-03` | API, UI, E2E |
| **BR-28** | Server-side logout token revocation; subsequent requests return `SESSION_REVOKED` | `API-10`, `API-11`, `UI-12`, `E2E-04` | API, UI, E2E |

---

## 4. Test Execution Instructions

### 4.1 Server API & Migration Tests
```bash
cd server
npm test -- tests/lab-03/
```

### 4.2 Client Component & Style Tests
```bash
cd client
npm test -- tests/lab-03/
```

### 4.3 End-to-End & Responsive Playwright Tests
```bash
npx playwright test e2e/lab-03/
```

### 4.4 Full Regression Suite (Lab 1 + Lab 2 + Lab 3)
```bash
# Run all backend test suites
npm --prefix server test

# Run all frontend test suites
npm --prefix client test

# Run all E2E test suites
npx playwright test
```

---

## 5. Responsive Visual Inspection Checklist & Screenshot Evidence

All screenshots are captured during Playwright E2E execution and stored under `artifacts/lab-03/screenshots/`.

### 5.1 Screenshot Inventory

| Category | Filename | Viewport / Dimensions | Description | Verification Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | `01-login-desktop.png` | Desktop ($1280 \times 800$) | Login screen with credentials form | Zen Green branding, centered card, clear inputs |
| **Authentication** | `01-login-tablet.png` | Tablet ($820 \times 1180$) | Login screen on tablet viewport | Full responsive width, centered card |
| **Authentication** | `01-login-mobile.png` | Mobile ($375 \times 667$) | Login screen on mobile viewport | Touch-friendly inputs, zero overflow |
| **Authentication** | `02-mandatory-password-change-desktop.png` | Desktop ($1280 \times 800$) | Forced password change view | Real-time complexity checklist indicators |
| **Authentication** | `02-mandatory-password-change-tablet.png` | Tablet ($820 \times 1180$) | Forced password change on tablet | Responsive form layout, accessible fields |
| **Authentication** | `02-mandatory-password-change-mobile.png` | Mobile ($375 \times 667$) | Forced password change on mobile | Vertical scrolling, accessible form fields |
| **Authentication** | `03-inactive-account-error.png` | Desktop ($1280 \times 800$) | Inactive account login attempt | Safe error banner: "Your account is currently inactive" |
| **Authentication** | `03-inactive-account-error-tablet.png` | Tablet ($820 \times 1180$) | Inactive account login attempt on tablet | Safe error banner, no clipping |
| **Staff Queue** | `04-queue-desktop.png` | Desktop ($1280 \times 800$) | Full IT Staff ticket queue table | Multi-column table with status/priority badges |
| **Staff Queue** | `04-queue-tablet.png` | Tablet ($820 \times 1180$) | Ticket queue on tablet viewport | Responsive cards, accessible filter buttons |
| **Staff Queue** | `04-queue-mobile.png` | Mobile ($375 \times 667$) | Ticket queue mobile card layout | Stacked card list, touch targets $\ge 44\text{px}$ |
| **Staff Queue** | `05-queue-filter-unassigned.png` | Desktop ($1280 \times 800$) | Queue scoped to "Unassigned" | Unassigned ownership filter active |
| **Ticket Detail** | `06-ticket-detail-desktop.png` | Desktop ($1280 \times 800$) | Staff ticket detail operational card | Prominent controls: owner, IT priority, status |
| **Ticket Detail** | `06-ticket-detail-tablet.png` | Tablet ($820 \times 1180$) | Staff ticket detail on tablet | Responsive stacked controls, no overflow |
| **Ticket Detail** | `06-ticket-detail-mobile.png` | Mobile ($375 \times 667$) | Staff ticket detail on mobile | Responsive stacked controls, zero overflow |
| **Ticket Detail** | `07-internal-notes-amber-theme.png` | Desktop ($1280 \times 800$) | Private internal notes tab | Amber border/badge visual distinction from comments |
| **Ticket Detail** | `07-internal-notes-amber-theme-tablet.png` | Tablet ($820 \times 1180$) | Private internal notes on tablet | Amber distinction remains visible |
| **Ticket Detail** | `08-status-transition-dropdown.png` | Desktop ($1280 \times 800$) | Status transition select | Only valid lifecycle transitions listed |
| **Ticket Detail** | `08-status-transition-dropdown-tablet.png` | Tablet ($820 \times 1180$) | Status transition select on tablet | Valid lifecycle options remain accessible |
| **User Management** | `09-user-management-desktop.png` | Desktop ($1280 \times 800$) | Admin user management table | Users list, role badges, action buttons |
| **User Management** | `09-user-management-tablet.png` | Tablet ($820 \times 1180$) | User management on tablet | Responsive user cards/table layout |
| **User Management** | `09-user-management-mobile.png` | Mobile ($375 \times 667$) | User management mobile cards | Touch-friendly edit/reset buttons $\ge 44\text{px}$ |
| **User Management** | `10-create-user-modal.png` | Desktop ($1280 \times 800$) | Provision new user modal | Role dropdown, password checklist |
| **User Management** | `10-create-user-modal-tablet.png` | Tablet ($820 \times 1180$) | Create User modal on tablet | Modal remains usable without clipping |
| **User Management** | `11-self-deactivation-guard-disabled.png` | Desktop ($1280 \times 800$) | Admin edit modal for self | Disabled Active switch, safety notice |
| **User Management** | `11-self-deactivation-guard-disabled-tablet.png` | Tablet ($820 \times 1180$) | Self-deactivation guard on tablet | Disabled switch and safety notice visible |

### 5.2 Responsive Visual Inspection Checklist

- [x] **Zero Horizontal Overflow (`RESP-04`)**: `document.documentElement.scrollWidth <= window.innerWidth` verified by `assertNoHorizontalOverflow()` across all screens in Desktop ($1280\text{px}$), Tablet ($820\text{px}$), and Mobile ($375\text{px}$).
- [x] **Touch Targets $\ge 44\text{px}$ (`RESP-03`)**: Buttons and inputs on mobile and tablet views meet or exceed $44 \times 44\text{px}$ touch targets.
- [x] **Brand Token Fidelity (`VIS-01`)**: Header, buttons, and primary accents conform to `#006B3C` (Zen Green).
- [x] **Internal Note Boundary (`VIS-02`)**: Amber theme (`#D97706` / `#FEF3C7`) clearly differentiates internal notes from public comments.
- [x] **Admin Protection Feedback (`BR-21`, `BR-22`)**: Self-deactivation and last active admin safety notices render with clear, visible warnings.

#### Issue 28 Visual Inspection Checklist

- [x] Layout alignment checked.
- [x] Status, Priority, and Role badge styling checked.
- [x] Keyboard focus states checked.
- [x] No text clipping or overlapping elements.
- [x] No horizontal page overflow.
