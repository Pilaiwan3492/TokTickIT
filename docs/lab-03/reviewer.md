# Lab 3 — Peer Review Record

**Author:** Pilaiwan Churdchu — 67070503492 — GitHub: [@Pilaiwan3492](https://github.com/Pilaiwan3492)  
**Peer Reviewer:** Aphichaya Klinhual — 67070503447 — GitHub: [@Apichaya251400](https://github.com/Apichaya251400)  
**Author Repository:** [https://github.com/Pilaiwan3492/TokTickIT](https://github.com/Pilaiwan3492/TokTickIT)  
**Partner Repository:** [https://github.com/Apichaya251400/TokTickIT](https://github.com/Apichaya251400/TokTickIT)  
**Target Release:** `lab3-staging` → `main`

---

## 1. Pull Requests I Authored (Reviewed by @Apichaya251400)

**Repository:** [https://github.com/Pilaiwan3492/TokTickIT](https://github.com/Pilaiwan3492/TokTickIT)

| PR | Feature Branch | Issue Title / Scope | Reviewer Verdict | Status |
| :---: | :--- | :--- | :---: | :---: |
| [#61](https://github.com/Pilaiwan3492/TokTickIT/pull/61) | `feature/20-spec-dd-contracts` | Issue 20: Sprint 3 Engineering Specification, UI-Spec & API Contracts | Approved | Merged |
| [#62](https://github.com/Pilaiwan3492/TokTickIT/pull/62) | `feature/21-planned-test-strategy` | Issue 21: Planned Test Strategy, Test Matrix & AC/BR Traceability | Approved | Merged |
| [#63](https://github.com/Pilaiwan3492/TokTickIT/pull/63) | `feature/22-database-schema-seed` | Issue 22: Database Schema Evolution, Migration & Idempotent Seed Data | Approved | Merged |
| [#64](https://github.com/Pilaiwan3492/TokTickIT/pull/64) | `feature/23-auth-foundation` | Issue 23: Authentication Foundation, Session Invalidation & API Protection | Approved | Merged |
| [#65](https://github.com/Pilaiwan3492/TokTickIT/pull/65) | `feature/24-client-auth-appshell` | Issue 24: Client Authentication, Mandatory Password Change & App Shell | Approved | Merged |
| [#66](https://github.com/Pilaiwan3492/TokTickIT/pull/66) | `feature/25-requester-regression-comments` | Issue 25: Requester Regression, Public Comments & Problem Resolution Indicator | Approved | Merged |
| [#67](https://github.com/Pilaiwan3492/TokTickIT/pull/67) | `feature/26-it-staff-queue-processing` | Issue 26: IT Staff Queue & Operational Ticket Processing | In Review | Open |

---

## 2. Detailed Review Dialogue on PRs I Authored

### PR #61: Issue 20 — Sprint 3 Engineering Specification, UI-Spec & API Contracts
- **Feature Branch:** `feature/20-spec-dd-contracts`
- **Review Summary:** Established canonical architecture specifications for TokTickIT Lab 3 (Sprint 3), defining three discrete roles (`REQUESTER`, `IT_STAFF`, `ADMIN`), 8 ticket statuses, token-based session invalidation (`RevokedToken`), password policies, public comments vs. internal notes boundaries, and comprehensive UI/API contracts.
- **Reviewer Comment (@Apichaya251400):**  
  > *"Thorough specification! The authorization matrix and safe error contracts provide clear guidance for implementation without ambiguity. Approved for merge to lab3-staging."*
- **Author Response (@Pilaiwan3492):**  
  > *"Thank you! Merged into lab3-staging."*

---

### PR #62: Issue 21 — Planned Test Strategy, Test Matrix & AC/BR Traceability
- **Feature Branch:** `feature/21-planned-test-strategy`
- **Review Summary:** Authored complete pre-implementation test plan in `docs/lab-03/tests.md`, cataloging 48 server API tests (`API-01` to `API-48`), 35 client component tests (`UI-01` to `UI-30`, `CLIENT-AUTH-01` to `05`), 10 end-to-end scenarios (`E2E-01` to `E2E-10`), visual invariants (`VIS-01` to `VIS-04`), and responsive test suites with complete AC-01 to AC-25 and BR-01 to BR-28 dual traceability matrices.
- **Reviewer Comment (@Apichaya251400):**  
  > *"The dual traceability matrix is very clear and covers every requirement from the labsheet. Approved!"*
- **Author Response (@Pilaiwan3492):**  
  > *"Thank you! Merged into lab3-staging."*

---

### PR #63: Issue 22 — Database Schema Evolution, Migration & Idempotent Seed Data
- **Feature Branch:** `feature/22-database-schema-seed`
- **Review Summary:** Evolved Prisma schema with new enums (`Role`, `Priority.URGENT`, 8 `TicketStatus`), new models (`User`, `Comment`, `InternalNote`, `RevokedToken`), and SQLite triggers for database-enforced status validation and case-insensitive email uniqueness. Idempotent seed script preserved existing Lab 2 tickets while upgrading requester records to full User credentials.
- **Reviewer Comment (@Apichaya251400):**  
  > *"Schema evolution and seed script work cleanly. The SQL triggers and state-preserving migrations ensure data integrity without loss of Lab 2 test records. Approved!"*
- **Author Response (@Pilaiwan3492):**  
  > *"Thank you! Merged into lab3-staging."*

---

### PR #64: Issue 23 — Authentication Foundation, Session Invalidation & API Protection
- **Feature Branch:** `feature/23-auth-foundation`
- **Review Summary:** Implemented backend JWT authentication, bcrypt password hashing, server-side token revocation (`POST /api/v1/auth/logout`), first-login password change gating (`mustChangePassword: true` returning HTTP 403 `PASSWORD_CHANGE_REQUIRED`), startup validation for `JWT_SECRET` (>= 32 chars), and secured all existing ticket and attachment endpoints using authenticated user identity. Excluded `passwordHash` and `tokenVersion` from ticket detail queries to eliminate sensitive credential leakage.
- **Reviewer Comment (@Apichaya251400):**  
  > *"Great attention to detail on the security safeguards, especially eliminating passwordHash leaks and validating JWT secret length at startup. Approved!"*
- **Author Response (@Pilaiwan3492):**  
  > *"Thank you! Merged into lab3-staging."*

---

### PR #65: Issue 24 — Client Authentication, Mandatory Password Change & App Shell
- **Feature Branch:** `feature/24-client-auth-appshell`
- **Review Summary:** Replaced development requester selector with real authentication state (`AuthContext`). Implemented Login form with password toggle, mandatory Change Password screen with real-time complexity checklist, role-aware Header navigation, session expiration/revocation interception (`apiClient`), and migrated all business pages (`MyTickets`, `CreateTicket`, `TicketDetail`, attachments) to authenticated Bearer sessions with zero reliance on client-provided `requesterId`.
- **Reviewer Comment (@Apichaya251400):**  
  > *"Client authentication flow and role-based app shell look polished. The handling of 403 PASSWORD_CHANGE_REQUIRED and Bearer token propagation across all pages works seamlessly. Approved!"*
- **Author Response (@Pilaiwan3492):**  
  > *"Thank you! Merged into lab3-staging."*

---

### PR #66: Issue 25 — Requester Regression, Public Comments & Problem Resolution Indicator
- **Feature Branch:** `feature/25-requester-regression-comments`
- **Issue Reference:** GitHub Issue #54 (Sprint 3 / Lab 3)
- **Scope & Changes:**
  1. **Public Comments Implementation:**
     - Created `server/src/controllers/comment.controller.ts` (`GET /api/v1/tickets/:id/comments`, `POST /api/v1/tickets/:id/comments`).
     - Comments validate non-empty trimmed text between 1 and 2,000 characters (BR-10).
     - Author identity is derived authoritatively from `req.user.id` (BR-09).
     - Requesters can only access/create comments on tickets they own; IT Staff and Admins can access comments across all tickets.
     - Comments are strictly append-only (BR-08).
  2. **Internal Notes Role Boundary Enforcement (Zero Data Leakage):**
     - Created `server/src/controllers/note.controller.ts` (`GET /api/v1/tickets/:id/notes`, `POST /api/v1/tickets/:id/notes`).
     - Restricted strictly to `IT_STAFF` and `ADMIN` via `requireRole(["IT_STAFF", "ADMIN"])` (AC-04, BR-25).
     - Role authorization check executes BEFORE any database query to ensure zero data leakage.
     - Requester access attempts return HTTP 403 `INSUFFICIENT_PERMISSIONS`.
  3. **"Problem Appears Resolved" Indicator:**
     - Created endpoint `POST /api/v1/tickets/:id/resolve-indicator` in `server/src/controllers/ticket.controller.ts` (AC-12, BR-11).
     - Idempotently updates `isRequesterResolved = true` for the ticket owner.
     - Strictly preserves official ticket status (`currentStatus`) without alteration.
     - Accessible exclusively to the Requester who owns the ticket.
  4. **Pre-Query Ticket Detail Ownership Guard (Zero Data Leakage):**
     - Refactored `getTicketDetailHandler` in `server/src/controllers/ticket.controller.ts` to perform a lightweight lookup (`select: { id, userId, requesterId }`) first.
     - Performs Requester ownership check immediately; returns HTTP 403 `FORBIDDEN` before executing any query on ticket summary, description, comments, attachments, or user relations.
     - Verified with tests asserting response body contains zero ticket details on 403.
  5. **Requester Ticket Detail UI Enhancements:**
     - Enhanced `client/src/pages/TicketDetail.tsx` with Public Comments feed displaying author avatar, author name, role badge, timestamp, and content.
     - Added comment creation form with live character counter (`0 / 2000`), validation, and busy state.
     - Added "Problem Appears Resolved" action button and confirmed green banner indicator.
     - Verified complete absence of Internal Notes tab, header, or notes content for Requester users (UI-25).
     - Expanded `renderStatusBadge` to support all 8 Lab 3 ticket statuses (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `CANCELLED`, `REOPENED`).
  6. **Verification & Test Coverage:**
     - Server API tests: `server/tests/lab-03/comments-notes.api.test.ts` (13/13 passing, covering `API-32` through `API-38`).
     - Client component tests: `client/tests/lab-03/RequesterTicketDetail.test.tsx` (4/4 passing, covering `UI-22`, `UI-24`, `UI-25`, and pre-resolved ticket state).
     - Server suite: **9 test files, 108/108 tests passing.**
     - Client suite: **12 test files, 79/79 tests passing.**
     - Server build (`tsc`) and Client build (`tsc && vite build`) compile with **0 errors**.
- **Reviewer Comment (@Apichaya251400):**  
  > *"Public comments and problem resolution indicator work properly. The pre-query ownership check in getTicketDetailHandler guarantees zero data leakage on unauthorized requests. Approved!"*
- **Author Response (@Pilaiwan3492):**  
  > *"Thank you! Merged into lab3-staging."*

---

### PR #67: Issue 26 — IT Staff Queue & Operational Ticket Processing
- **Feature Branch:** `feature/26-it-staff-queue-processing`
- **Issue Reference:** GitHub Issue #55 (Sprint 3 / Lab 3)
- **Scope & Changes:**
  1. **IT Staff Shared Queue Endpoint (`GET /api/v1/staff/tickets`):**
     - Implemented in `server/src/controllers/staff.controller.ts` with comprehensive filter combination (AND array chaining: status, priority, ownership: `ALL`, `UNASSIGNED`, `ASSIGNED_TO_ME`), debounced search (by ticketNo, summary, requester name, and requester email), and pagination.
     - Resolved filter collision: all filters combine seamlessly without any condition overwriting (API-24b).
     - Deterministic secondary sort on `id desc` when `createdAt` dates are equal (API-24, BR-23).
     - Guarded by `requireRole(["IT_STAFF", "ADMIN"])`. Requesters are blocked with HTTP 403 `INSUFFICIENT_PERMISSIONS` before any ticket queries execute (API-15, BR-24).
  2. **Operational Ticket Detail Endpoint (`GET /api/v1/staff/tickets/:id`):**
     - Returns full operational ticket details including requester profile, category, related system, attachments, public comments, and internal notes (API-25).
     - Pre-query role authorization ensures zero ticket metadata or internal notes leak to Requesters.
  3. **Ticket Assignment & Reassignment (`PATCH /api/v1/staff/tickets/:id/assignment`):**
     - Allows claiming ticket (`ownerId: "me"` or self ID), reassigning to another active IT Staff / Admin, or unassigning (`ownerId: null`) (API-26, API-27, BR-13).
     - Strictly validates assignee role and active status; rejects assignment to inactive users or users with `REQUESTER` role with HTTP 400 `INVALID_OWNER` (API-28, BR-13).
  4. **Independent IT Priority Management (`PATCH /api/v1/staff/tickets/:id/priority`):**
     - Updates `itPriority` independently while preserving `requestedPriority` unchanged (API-29, BR-14).
  5. **Strict Status Transition Matrix (100% compliant with BR-16):**
     - Endpoint `PATCH /api/v1/staff/tickets/:id/status` validates all status changes strictly against the BR-16 state machine:
       - `NEW` $\rightarrow$ `OPEN`, `CANCELLED`
       - `OPEN` $\rightarrow$ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `CANCELLED`
       - `IN_PROGRESS` $\rightarrow$ `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
       - `WAITING_FOR_REQUESTER` $\rightarrow$ `IN_PROGRESS`, `RESOLVED`, `CANCELLED`
       - `RESOLVED` $\rightarrow$ `CLOSED`, `REOPENED`
       - `REOPENED` $\rightarrow$ `IN_PROGRESS`, `CANCELLED`
       - `CLOSED` $\rightarrow$ Terminal (0 transitions)
       - `CANCELLED` $\rightarrow$ Terminal (0 transitions)
     - Disallowed transitions return HTTP 400 `INVALID_STATUS_TRANSITION` (API-31).
  6. **Staff Assignees Endpoint (`GET /api/v1/staff/assignees`):**
     - Returns active IT Staff and Admin users for ticket assignment dropdowns.
  7. **Client UI — IT Staff Queue (`StaffTicketQueue.tsx`):**
     - Responsive layout: desktop table ($\ge 1024\text{px}$) with Ticket No, Date, Summary, Priority & Status badges, Owner, and Actions; mobile cards ($< 1024\text{px}$) with minimum 44px touch targets (UI-13).
     - Search input with 300ms debounce (UI-14), Status and Priority dropdown filters (UI-15), Ownership filter toggle buttons (`All`, `Unassigned`, `Assigned to Me`) (UI-16), pagination controls (UI-17), and empty / no-results states (UI-18).
  8. **Client UI — Operational Ticket Detail (`StaffTicketDetail.tsx`):**
     - Prominent Operational Controls header card: Claim shortcut button, Owner assignment dropdown, IT Priority dropdown, and Status transition dropdown strictly presenting only permitted next states (UI-19, UI-20, UI-21).
     - Replaced browser `alert()` popups with consistent inline error toast notifications.
     - Core ticket read-only information card with Requester information, Category, Related System, and Requester resolution banner indicator.
     - Tabbed communication interface: Public Comments tab, Attachments tab, and Internal Notes tab with distinct amber styling (`#854D0E` text/border, `#FFFBEB` card, `#FEFCE8` banner) clearly marking internal notes as private from requesters (UI-23).
  9. **Client Routing & Shell Navigation (`App.tsx`, `Header.tsx`):**
     - `/queue` route for Ticket Queue, `/queue/:id` for Staff Ticket Detail.
     - Role-aware `/tickets/:id` dispatcher: routes IT Staff and Admins to `/queue/:id` while preserving Requester view for Requesters.
  10. **Test Coverage & Verification:**
      - Server tests:
        - `server/tests/lab-03/authorization.api.test.ts` (4/4 passing: `API-15`..`API-18`)
        - `server/tests/lab-03/staff-queue.api.test.ts` (8/8 passing: `API-19`..`API-24`, `API-20b`, `API-24b`)
        - `server/tests/lab-03/staff-ticket-detail.api.test.ts` (7/7 passing: `API-25`..`API-31`)
      - Client tests:
        - `client/tests/lab-03/StaffTicketQueue.test.tsx` (6/6 passing: `UI-13`..`UI-18`)
        - `client/tests/lab-03/StaffTicketDetail.test.tsx` (6/6 passing: `UI-19`..`UI-21`, `UI-23`)
      - Full suites:
        - Server: **12 test files, 127/127 tests passing.**
        - Client: **14 test files, 91/91 tests passing.**
      - Production builds: Server (`tsc`) and Client (`tsc && vite build`) compile with **0 errors**.
- **Reviewer Comment (@Apichaya251400):**  
  > *[Pending Review of updated fix]*
- **Author Response (@Pilaiwan3492):**  
  > *"Addressed Changes Requested: refactored where clause to use AND array chaining for Search + Priority + Status + Ownership without overwriting, added email search, replaced browser alerts with error toast notifications, and added API-20b and API-24b combination filter tests."*

---

### PR #68: Issue 27 — Administrator User Management & Safety Guards
- **Feature Branch:** `feature/27-admin-user-management`
- **Issue Reference:** GitHub Issue #56 (Sprint 3 / Lab 3)
- **Scope & Changes:**
  1. **Strict Server-Side Authorization Guard (BR-24):**
     - All `/api/v1/admin/*` endpoints (`admin.routes.ts`) enforce `requireAuth` followed by `requireRole(["ADMIN"])`.
     - Requesters and IT Staff receive HTTP 403 `INSUFFICIENT_PERMISSIONS`. Unauthenticated requests receive HTTP 401 `SESSION_INVALID`.
  2. **Canonical Roles & Safe User Projection (BR-04, BR-05):**
     - Exactly three canonical roles: `REQUESTER`, `IT_STAFF`, `ADMIN`.
     - User responses project only safe fields: `id`, `name`, `email`, `role`, `isActive`, `mustChangePassword`, `createdAt`. Zero exposure of `passwordHash`, session secrets, or internal security fields.
  3. **Safety Guard: Self-Deactivation Prohibited (BR-21):**
     - Administrators cannot deactivate their own account (`isActive: false` $\rightarrow$ HTTP 400 `CANNOT_DEACTIVATE_SELF`).
     - Client UI disables the active account toggle for the current admin with clear explanatory guidance.
  4. **Safety Guard: Last Active Administrator Protection (BR-22):**
     - The system enforces maintaining at least one active Administrator at all times.
     - Deactivation or role demotion of the last active Administrator returns HTTP 400 `LAST_ACTIVE_ADMIN_PROTECTED`.
     - Protected both before and inside the atomic Prisma database transaction to guarantee concurrency safety.
     - Client UI provides real-time warning indicators when viewing the last active Administrator.
  5. **Case-Insensitive Email Uniqueness (BR-20):**
     - Emails are normalized via `.trim().toLowerCase()`.
     - Duplicate email creations or updates return HTTP 409 `DUPLICATE_EMAIL`.
  6. **Prohibited User Deletion (BR-19):**
     - Direct `DELETE /api/v1/admin/users/:id` returns HTTP 405 `METHOD_NOT_ALLOWED`. Deactivation is the exclusive removal mechanism.
  7. **Canonical Session Invalidation on Deactivation & Password Reset (BR-27, BR-28):**
     - Resetting initial password or deactivating an account registers a user-wide revocation record in the `RevokedToken` registry.
     - `requireAuth` validates tokens against both specific `jti` and user-wide revocations (`createdAt > tokenIssuedAt`), immediately rejecting old tokens with HTTP 401 `SESSION_REVOKED`.
     - Upon subsequent successful login with the new credentials, obsolete revocation markers are cleanly purged.
  8. **Legacy RequesterUser Compatibility:**
     - When creating or updating a user with role `REQUESTER`, the corresponding legacy `RequesterUser` record is created or updated within the same transaction to ensure backwards compatibility with legacy fixtures.
  9. **Client UI — Administrator User Management (`UserManagement.tsx`):**
     - Zen Green styling (`#006B3C`, `#EAF6EF`, `#DCFCE7`).
     - Responsive design: desktop table ($\ge 1024\text{px}$) and mobile cards ($< 1024\text{px}$) with touch-friendly controls ($\ge 44\text{px}$ touch targets).
     - Search with 300ms debounce and single-role filter dropdown.
     - Create User Modal with real-time password complexity checklist ($\ge 8$ chars, uppercase, lowercase, number, symbol). Newly created users are flagged with `mustChangePassword = true`.
     - Edit User Modal with self-deactivation disabled and last-admin protections.
     - Reset Initial Password Modal with complexity requirements and clear notice of session invalidation.
  10. **Test Coverage & Verification:**
      - Server tests: `server/tests/lab-03/users-admin.api.test.ts` (10/10 passing: `API-39`..`API-48`).
      - Client tests: `client/tests/lab-03/UserManagement.test.tsx` (6/6 passing: `UI-26`..`UI-30` + role access control).
      - Full suites:
        - Server: **13 test files, 137/137 tests passing.**
        - Client: **15 test files, 97/97 tests passing.**
      - Production builds: Server (`tsc`) and Client (`tsc && vite build`) compile with **0 errors**.
- **Reviewer Comment (@Apichaya251400):**  
  > *[Pending Review]*
- **Author Response (@Pilaiwan3492):**  
  > *"Implemented comprehensive Administrator User Management with strict server-side authorization guards, self-deactivation prevention, last-active-admin protection with concurrency safety, session invalidation via RevokedToken, and full client UI in Zen Green theme."*


