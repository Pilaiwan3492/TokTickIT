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
| [#66](https://github.com/Pilaiwan3492/TokTickIT/pull/66) | `feature/25-requester-regression-comments` | Issue 25: Requester Regression, Public Comments & Problem Resolution Indicator | In Review | Open |

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
  4. **Requester Ticket Detail UI Enhancements:**
     - Enhanced `client/src/pages/TicketDetail.tsx` with Public Comments feed displaying author avatar, author name, role badge, timestamp, and content.
     - Added comment creation form with live character counter (`0 / 2000`), validation, and busy state.
     - Added "Problem Appears Resolved" action button and confirmed green banner indicator.
     - Verified complete absence of Internal Notes tab, header, or notes content for Requester users (UI-25).
     - Expanded `renderStatusBadge` to support all 8 Lab 3 ticket statuses (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `CANCELLED`, `REOPENED`).
  5. **Verification & Test Coverage:**
     - Server API tests: `server/tests/lab-03/comments-notes.api.test.ts` (13/13 passing, covering `API-32` through `API-38`).
     - Client component tests: `client/tests/lab-03/RequesterTicketDetail.test.tsx` (4/4 passing, covering `UI-22`, `UI-24`, `UI-25`, and pre-resolved ticket state).
     - Server suite: **9 test files, 108/108 tests passing.**
     - Client suite: **12 test files, 79/79 tests passing.**
     - Server build (`tsc`) and Client build (`tsc && vite build`) compile with **0 errors**.
- **Reviewer Comment (@Apichaya251400):**  
  > *[Pending Review]*
- **Author Response (@Pilaiwan3492):**  
  > *[Pending Response]*
