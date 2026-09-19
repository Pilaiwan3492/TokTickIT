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
| [#67](https://github.com/Pilaiwan3492/TokTickIT/pull/67) | `feature/26-it-staff-queue-processing` | Issue 26: IT Staff Queue & Operational Ticket Processing | Approved | Merged |
| [#68](https://github.com/Pilaiwan3492/TokTickIT/pull/68) | `feature/27-admin-user-management` | Issue 27: Administrator User Management & Safety Guards | Commented (Changes Requested) → Approved | Merged |
| [#69](https://github.com/Pilaiwan3492/TokTickIT/pull/69) | `feature/28-e2e-test-suite` | Issue 28: End-to-End Test Suite & Responsive Visual Evidence | Approved | Merged |
| [#70](https://github.com/Pilaiwan3492/TokTickIT/pull/70) | `feature/29-peer-review-submission` | Issue 29: Final Integration, AI Reflection & Submission Package | Approved | Merged |

---

## 2. Detailed Review Dialogue on PRs I Authored

### PR #61: Issue 20 — Sprint 3 Engineering Specification, UI-Spec & API Contracts
- **Feature Branch:** `feature/20-spec-dd-contracts`
- **Review Summary:** Established canonical architecture specifications for TokTickIT Lab 3 (Sprint 3), defining three discrete roles (`REQUESTER`, `IT_STAFF`, `ADMIN`), 8 ticket statuses, token-based session invalidation (`RevokedToken`), password policies, public comments vs. internal notes boundaries, and comprehensive UI/API contracts.
- **Reviewer Verdict:** `APPROVED` (2026-09-13T13:44:01Z)
- **Reviewer Comment (@Apichaya251400):**  
  > PR #61 is good to go! Everything in the spec docs looks clean and complete. Approved, merge away!
- **Resolution:** Merged into `lab3-staging`.

---

### PR #62: Issue 21 — Planned Test Strategy, Test Matrix & AC/BR Traceability
- **Feature Branch:** `feature/21-planned-test-strategy`
- **Review Summary:** Authored complete pre-implementation test plan in `docs/lab-03/tests.md`, cataloging 48 server API tests (`API-01` to `API-48`), 35 client component tests (`UI-01` to `UI-30`, `CLIENT-AUTH-01` to `05`), 10 end-to-end scenarios (`E2E-01` to `E2E-10`), visual invariants (`VIS-01` to `VIS-04`), and responsive test suites with complete AC-01 to AC-25 and BR-01 to BR-28 dual traceability matrices.
- **Reviewer Verdict:** `APPROVED` (2026-09-13T17:35:51Z)
- **Reviewer Comment (@Apichaya251400):**  
  > LGTM! Checked docs/lab-03/tests.md in PR #62. The planned test strategy and traceability matrices for AC-01..25 and BR-01..28 are super thorough and 100% complete! Approved and ready to merge to lab3-staging!
- **Resolution:** Merged into `lab3-staging`.

---

### PR #63: Issue 22 — Database Schema Evolution, Migration & Idempotent Seed Data
- **Feature Branch:** `feature/22-database-schema-seed`
- **Review Summary:** Evolved Prisma schema with new enums (`Role`, `Priority.URGENT`, 8 `TicketStatus`), new models (`User`, `Comment`, `InternalNote`, `RevokedToken`), and database triggers for database-enforced status validation and case-insensitive email uniqueness. Idempotent seed script preserved existing Lab 2 tickets while upgrading requester records to full User credentials.
- **Reviewer Verdict:** `APPROVED` (2026-09-13T18:22:18Z)
- **Reviewer Comment (@Apichaya251400):**  
  > LGTM! Database schema evolution, pure SQL migration, and seed data in PR #63 look super solid! Verified zero data loss, exact enum/model alignment, and idempotent seeding. All 96 tests pass! Approved and ready to merge to lab3-staging!
- **Resolution:** Merged into `lab3-staging`.

---

### PR #64: Issue 23 — Authentication Foundation, Session Invalidation & API Protection
- **Feature Branch:** `feature/23-auth-foundation`
- **Review Summary:** Implemented backend JWT authentication, bcrypt password hashing, server-side token revocation (`POST /api/v1/auth/logout`), first-login password change gating (`mustChangePassword: true` returning HTTP 403 `PASSWORD_CHANGE_REQUIRED`), startup validation for `JWT_SECRET` (>= 32 chars), and secured all existing ticket and attachment endpoints using authenticated user identity. Excluded `passwordHash` and `tokenVersion` from ticket detail queries to eliminate sensitive credential leakage.
- **Reviewer Verdict:** `APPROVED` (2026-09-14T17:49:03Z)
- **Reviewer Comment (@Apichaya251400):**  
  > LGTM! Authentication foundation, token revocation, and auth guards in PR #64 are super solid and secure. Verified fail-secure JWT secret check, server-side token revocation, credential omission, and 129/129 passing tests! Approved and ready to merge to lab3-staging!
- **Author Response (@Pilaiwan3492):**  
  > Thank!!!!!
- **Resolution:** Merged into `lab3-staging`.

---

### PR #65: Issue 24 — Client Authentication, Mandatory Password Change & App Shell
- **Feature Branch:** `feature/24-client-auth-appshell`
- **Review Summary:** Replaced development requester selector with real authentication state (`AuthContext`). Implemented Login form with password toggle, mandatory Change Password screen with real-time complexity checklist, role-aware Header navigation, session expiration/revocation interception (`apiClient`), and migrated all business pages (`MyTickets`, `CreateTicket`, `TicketDetail`, attachments) to authenticated Bearer sessions with zero reliance on client-provided `requesterId`.
- **Reviewer Verdict:** `APPROVED` (2026-09-14T20:03:11Z)
- **Reviewer Comment (@Apichaya251400):**  
  > Just ran the client tests and build locally on pr-65, all 75 client tests passed and tsc && vite build compiled with zero errors! Everything looks super clean. Approved and ready to merge to lab3-staging!
- **Author Response (@Pilaiwan3492):**  
  > Thank kub 🔥🔥🔥
- **Resolution:** Merged into `lab3-staging`.

---

### PR #66: Issue 25 — Requester Regression, Public Comments & Problem Resolution Indicator
- **Feature Branch:** `feature/25-requester-regression-comments`
- **Review Summary:** Implemented Public Comments (`GET/POST /api/v1/tickets/:id/comments`), Internal Notes role boundary enforcement strictly restricted to `IT_STAFF` and `ADMIN` with zero data leakage (`GET/POST /api/v1/tickets/:id/notes`), "Problem Appears Resolved" indicator endpoint (`POST /api/v1/tickets/:id/resolve-indicator`), pre-query ticket detail ownership guard, and enhanced Requester Ticket Detail UI.
- **Reviewer Verdict:** `APPROVED` (2026-09-15T17:18:47Z)
- **Reviewer Comment (@Apichaya251400):**  
  > Checked PR #66 public comments look great and the internal notes guard is super solid. All 187 tests pass too. Good to merge!
- **Resolution:** Merged into `lab3-staging`.

---

### PR #67: Issue 26 — IT Staff Queue & Operational Ticket Processing
- **Feature Branch:** `feature/26-it-staff-queue-processing`
- **Review Summary:** Implemented IT Staff Shared Queue (`GET /api/v1/staff/tickets`) with debounced search, status/priority filters, ownership filter, and deterministic secondary sort. Implemented Operational Ticket Detail (`GET /api/v1/staff/tickets/:id`), ticket assignment/reassignment (`PATCH /assignment`), independent IT Priority management (`PATCH /priority`), strict BR-16 status transition matrix (`PATCH /status`), and responsive UI with tabbed communications and amber internal notes styling.
- **Reviewer Verdict:** `APPROVED` (2026-09-15T18:51:51Z)
- **Reviewer Comment (@Apichaya251400):**  
  > Checked PR #67 for you! The IT Queue and status transition code looks great, all tests passed locally, and the mobile layout looks really nice. Go ahead and merge into lab3-staging!
- **Resolution:** Merged into `lab3-staging`.

---

### PR #68: Issue 27 — Administrator User Management & Safety Guards
- **Feature Branch:** `feature/27-admin-user-management`
- **Review Summary:** Implemented server-side Admin authorization, safe user projections, self-deactivation guard, last active admin protection, case-insensitive email uniqueness, prohibited user deletion, token versioning session invalidation, bidirectional RequesterUser synchronization, and responsive User Management UI.
- **Reviewer Verdict 1 (@Apichaya251400) — `COMMENTED` (2026-09-16T18:24:37Z):**  
  > > Overall, the Administrator implementation looks good! The main parts are covered, including server-side ADMIN authorization, user listing/search/filtering, creating and editing users, password reset/session invalidation, self-deactivation protection, last-active-admin protection, RequesterUser synchronization, and the responsive User Management UI.
  > >
  > > Before approving, I just have a few things I’d like to see improved:
  > >
  > > 1. **Add an API test for deactivation/reactivation.**
  > >    `API-42` currently tests updating `isActive` to `true`, but it doesn’t actually test deactivating and reactivating a user. Please add a test for `true → false → true` to make sure both cases work correctly.
  > >
  > > 2. **Add a test for deactivating the last active Administrator.**
  > >    `API-45` currently checks the last-admin demotion case. Please also test `{ isActive: false }` and make sure it returns `400 LAST_ACTIVE_ADMIN_PROTECTED`.
  > >
  > > 3. **Please align UI-29 with `tests.md`.**
  > >    `tests.md` says UI-29 checks that the last active admin cannot be deactivated, but the current test checks that another staff user’s Active toggle is enabled. Please either add the actual last-admin UI test or update the `tests.md` description so the test and documentation match.
  > >
  > > 4. **One small UI improvement:**
  > >    `activeAdminCount` is currently calculated from the filtered `users` list. When a search or filter is applied, the UI might incorrectly think there is only one active Administrator. The backend protection is already correct, but it would be safer to get the active-admin count from the full user list or from the backend.
  > >
  > > Other than these points, the overall structure looks good.
- **Author Response (@Pilaiwan3492) (2026-09-16T19:00:27Z):**  
  > Thank you @Apichaya251400  for the thoughtful and precise review! I have addressed all 4 points:
  > 
  > 1. **Deactivation/Reactivation API Test (`true → false → true`)**:
  >    - Updated `API-42` in `users-admin.api.test.ts` to test both deactivation (`isActive: false`) and subsequent reactivation (`isActive: true`), verifying database states at each step.
  > 
  > 2. **Last Active Admin Deactivation Test (`{ isActive: false }`)**:
  >    - Re-ordered the Last Active Admin Guard ahead of the Self-Deactivation Guard in `admin.controller.ts`.
  >    - Added Case B in `API-45` verifying that sending `{ isActive: false }` against the last active administrator returns HTTP 400 `LAST_ACTIVE_ADMIN_PROTECTED`.
  > 
  > 3. **Aligned UI-29 with `tests.md`**:
  >    - Separated into distinct `UI-28` (self-deactivation disabled on own account) and `UI-29` (last active administrator disabled with `LAST_ACTIVE_ADMIN_PROTECTED` warning notice) tests in `UserManagement.test.tsx`, fully matching `docs/lab-03/tests.md`.
  > 
  > 4. **Independent `activeAdminCount` Calculation**:
  >    - Updated `UserManagement.tsx` to compute `activeAdminCount` independently via `refreshActiveAdminCount()` querying all administrators without being skewed by active search or role filters.
- **Reviewer Verdict 2 (@Apichaya251400) — `APPROVED` (2026-09-16T19:14:21Z):**  
  > Thanks for addressing all the review comments. I checked the latest changes, and the requested test coverage, UI traceability, and active-admin handling are now covered.
  > 
  > Everything looks good to me. Approved!
- **Resolution:** Merged into `lab3-staging`.

---

### PR #69: Issue 28 — End-to-End Test Suite & Responsive Visual Evidence
- **Feature Branch:** `feature/28-e2e-test-suite`
- **Review Summary:** Implemented Playwright multi-device configuration (Desktop, Tablet, Mobile), 10 end-to-end user journeys (`E2E-01` to `E2E-10`), captured 26 high-resolution responsive screenshots, and verified responsive invariants (zero horizontal scroll, touch targets >= 44px, Zen Green / Amber tokens).
- **Reviewer Verdict:** `APPROVED` (2026-09-17T09:54:37Z)
- **Reviewer Comment (@Apichaya251400):**  
  > Approved! ✅
  > The E2E test coverage and responsive visual evidence look good overall. The latest changes also address the touch-target checks and add the missing tablet screenshots.
  > 
  > Everything looks good to me. Nice work!
- **Resolution:** Merged into `lab3-staging`.

---

### PR #70: Issue 29 — Final Integration, AI Reflection & Submission Package
- **Feature Branch:** `feature/29-peer-review-submission`
- **Review Summary:** Authored AI usage & reflection documentation (`docs/lab-03/ai-use.md`), updated complete peer review record (`docs/lab-03/reviewer.md`), compiled full submission package with 9 answer parts, responsive screenshot embeds, and verification evidence.
- **Reviewer Verdict (@Apichaya251400):** `APPROVED` (2026-09-19T12:15:11Z)
- **Reviewer Comment (@Apichaya251400):**  
  > Looks good to me. Approved!  Nice work!
- **Resolution:** Merged into `lab3-staging` by @Apichaya251400 (Merge commit `dec842f`).

---

## 3. Pull Requests I Reviewed for My Partner (@Apichaya251400)

**Partner Repository:** [https://github.com/Apichaya251400/TokTickIT](https://github.com/Apichaya251400/TokTickIT)  
**Partner Name:** Apichaya Rattanapan  
**Partner GitHub:** [@Apichaya251400](https://github.com/Apichaya251400)  
**Reviewer:** Pilaiwan Churdchu ([@Pilaiwan3492](https://github.com/Pilaiwan3492))

### Summary Table of Reviewed Pull Requests

| PR | Feature Branch | Scope Reviewed | Verdict | Reviewer Feedback | Author Resolution |
| :---: | :--- | :--- | :---: | :--- | :--- |
| [#60](https://github.com/Apichaya251400/TokTickIT/pull/60) | `feature/lab3-spec-dd` | Sprint 3 Engineering Specifications (specification.md, ui-spec.md, api-spec.md) | Approved | Specs are comprehensive, operation-level authorization matrix and status transitions are thorough. | Merged into `lab3-staging` |
| [#61](https://github.com/Apichaya251400/TokTickIT/pull/61) | `feature/lab3-test-dd` | Planned Test Strategy & Traceability (tests.md) | Approved | Traceability matrices cover all ACs (AC-01..25) and BRs (BR-01..28) with 100% test file mapping. | Merged into `lab3-staging` |
| [#62](https://github.com/Apichaya251400/TokTickIT/pull/62) | `feature/lab3-db-migration` | Schema Evolution, Migration & Idempotent Seed Data | Changes Requested → Approved | Verified double-seed execution test and ticket/attachment relationship preservation across all statuses. | Merged into `lab3-staging` |
| [#63](https://github.com/Apichaya251400/TokTickIT/pull/63) | `feat/lab3-auth` | Auth Foundation, Token Revocation & API Tests | Approved | Fail-secure JWT secret check, server-side token revocation, and auth tests pass cleanly. | Merged into `lab3-staging` |
| [#64](https://github.com/Apichaya251400/TokTickIT/pull/64) | `feature/lab3-client-auth-ui` | Client Auth, Password Change & App Shell Navigation | Changes Requested → Approved | Added Ticket Lookup to Admin navigation alongside User Management; auth flow verified. | Merged into `lab3-staging` |
| [#65](https://github.com/Apichaya251400/TokTickIT/pull/65) | `feature/lab3-requester-regression` | Requester Public Comments, Signalling & Notes Security | Approved | Public comments chronological display verified; zero leakage of internal notes to requester confirmed. | Merged into `lab3-staging` |
| [#66](https://github.com/Apichaya251400/TokTickIT/pull/66) | `feature/lab3-staff-queue` | IT Staff Ticket Queue REST API & Responsive Interface | Approved | Debounced search, status/priority filtering, and responsive mobile card layout verified. | Merged into `lab3-staging` |
| [#67](https://github.com/Apichaya251400/TokTickIT/pull/67) | `feature/lab3-staff-ticket-detail` | IT Staff Ticket Detail & Operational Controls | Approved | Ticket claim, reassign, status transition lifecycle, and amber internal notes styling look great. | Merged into `lab3-staging` |
| [#68](https://github.com/Apichaya251400/TokTickIT/pull/68) | `feature/lab3-admin-user-mgmt` | Administrator User Management & Safety Guards | Commented → Approved | Addressed concurrent Last Active Administrator test with 2 distinct Admin accounts and tokens. | Merged into `lab3-staging` |
| [#69](https://github.com/Apichaya251400/TokTickIT/pull/69) | `feature/lab3-e2e-tests` | Playwright End-to-End Test Suite & Mandatory Assertions | Commented → Approved | Updated AC-ADMIN-05 to use two separate Admin accounts for last active admin test. | Merged into `lab3-staging` |
| [#70](https://github.com/Apichaya251400/TokTickIT/pull/70) | `feature/lab3-visual-qa` | Visual QA & Responsive Design Verification | Commented → Approved | Separated Playwright E2E and screenshot capture; fixed AC-ADMIN-05 and direct unauthenticated access test. | Merged into `lab3-staging` |

---

### Detailed Review Dialogue on Partner's PRs

#### PR #60: Sprint 3 Engineering Specifications
- **Feature Branch:** `feature/lab3-spec-dd`
- **Scope Reviewed:** `docs/lab-03/specification.md`, `docs/lab-03/ui-spec.md`, `docs/lab-03/api-spec.md`
- **Reviewer Verdict (@Pilaiwan3492):** `APPROVED` (2026-09-15T13:52:25Z)
- **Reviewer Comment (@Pilaiwan3492):**  
  > Approved 
  > 
  > I reviewed this PR against the Lab 3 Spec DD requirements. The specification, API contract, UI specification, functional requirements, business rules, authorization rules, and acceptance criteria are clearly defined and aligned with the Lab 3 requirements.
  > 
  > The PR looks complete and is ready to proceed to the next Lab 3 implementation steps. Good job! 
- **Resolution:** Merged into `lab3-staging`.

---

#### PR #61: Planned Test Strategy & Traceability
- **Feature Branch:** `feature/lab3-test-dd`
- **Scope Reviewed:** `docs/lab-03/tests.md`
- **Reviewer Verdict (@Pilaiwan3492):** `APPROVED` (2026-09-15T17:43:29Z)
- **Reviewer Comment (@Pilaiwan3492):**  
  > Looks good! 
  > I checked this PR against the Lab 3 Test DD requirements. The test plan, AC/BR traceability, planned test cases, test file paths, and the coverage for API, UI, authorization, regression, responsive, and E2E are all clearly defined and match the Lab 3 requirements.
  > 
  > Approved Nice work! 
- **Resolution:** Merged into `lab3-staging`.

---

#### PR #62: Database Schema Evolution, Migration & Idempotent Seed Data
- **Feature Branch:** `feature/lab3-db-migration`
- **Scope Reviewed:** Prisma schema evolution, pure SQL migrations, idempotent `seedDatabase()`, `tests/lab-03/migration.test.ts`
- **Reviewer Verdict 1 (@Pilaiwan3492) — `CHANGES_REQUESTED`:**  
  > Just a few things I think we should improve before merging:
  > 
  > * Add a migration test to confirm existing Lab 2 Tickets and Attachments are preserved correctly.
  > * For the idempotent seed test, actually run the seed more than once and verify that it does not create duplicates.
  > * Add a few more realistic seeded Tickets with different statuses, priorities, Requesters, and assigned/unassigned ownership.
  > 
  > The overall structure looks good, so these are mainly to make the migration evidence stronger and match the Lab 3 requirements more completely. Nice work so far!
- **Author Response 1 (@Apichaya251400) (2026-09-16T13:04:22Z):**  
  > Thank you for the detailed review and feedback @Pilaiwan3492! I have updated the branch with all 3 requested improvements:
  > 1. **Lab 2 Ticket & Attachment Preservation (`API-MIG-03`)**: Enhanced `server/tests/lab-03/migration.test.ts` to verify that migrated tickets, attachments, and relations (`requesterId`, `ownerId`, `category`, `relatedSystem`, `attachments`, `comments`, `notes`) remain completely intact post-migration across all 8 statuses.
  > 2. **Empirical Double Seed Execution Test (`API-MIG-02`)**: Updated `server/tests/lab-03/migration.test.ts` to execute `seedDatabase()` twice in sequence during the test and assert that record counts (Users, Categories, Systems, Tickets) match before vs. after the second run, proving zero duplicate record creation.
  > 3. **Diverse Ticket Seed Data**: Expanded `server/prisma/seed.ts` from 3 to 8 sample tickets covering all 8 `CurrentStatus` values (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`), all priority levels (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), multiple Requesters, and both assigned (`ownerId`) and unassigned (`ownerId: null`) tickets.
  > All changes have been committed and pushed to `feature/lab3-db-migration` (commit `527f942`). Ready for your re-review and approval!
- **Reviewer Verdict 2 (@Pilaiwan3492) — `CHANGES_REQUESTED`:**  
  > I checked the latest version of this PR against the Lab 3 database and migration requirements. The schema, roles, ticket statuses, seed data, comments/notes, ownership fields, and idempotent seed test all look good and are aligned with the Lab 3 requirements.
  > 
  > There are just two things I recommend fixing before approval:
  > 
  > * **Existing Lab 2 Requester passwords:** The migration moves existing `RequesterUser` records into `User`, but the migration does not clearly define or test how those existing users receive their initial passwords. Lab 3 requires this to be documented and tested. Please make sure the initial password behavior for migrated Requesters is clearly defined and that they can actually log in with it.
  > 
  > * **Attachment preservation test:** The migration appears to preserve the existing Ticket/Attachment relationships, but `API-MIG-03` currently only verifies that attachments can be queried. It would be better to explicitly test that an existing Lab 2 Attachment remains linked to the same Ticket after migration.
  > 
  > Everything else looks good so far. Once these two migration details are covered, I think this PR will be ready for approval.
- **Author Response 2 (@Apichaya251400) (2026-09-16T15:23:17Z):**  
  > @Pilaiwan3492 Thank you for the detailed code review! We have addressed both feedback items in commit 801b351:
  > 
  > 1. **Migrated Requester Passwords & Authentication Verification (`API-MIG-01`)**:
  >    - Updated the migration SQL and `seedDatabase()` to generate a valid bcrypt password hash (`InitialPassword123!`) for migrated `RequesterUser` records and set `requiresPasswordChange = true`.
  >    - Enhanced `tests/lab-03/migration.test.ts` (`API-MIG-01`) to explicitly verify using `bcrypt.compareSync("InitialPassword123!", u.passwordHash)` for all migrated and seeded users.
  > 
  > 2. **Attachment Linkage & Relationship Preservation (`API-MIG-03`)**:
  >    - Updated `API-MIG-03` to explicitly test that each `Attachment` record remains linked to its parent `Ticket` (`attachment.ticketId === ticket.id`) post-migration, alongside verifying original metadata (`fileName`, `fileSize`, `filePath`).
  > 
  > All migration and idempotent seed tests (`tests/lab-03/migration.test.ts`) are now passing cleanly!
- **Reviewer Verdict 3 (@Pilaiwan3492) — `APPROVED` (2026-09-16T15:51:32Z):**  
  > Approved!!!
  > 
  > I re-checked the latest PR against the Lab 3 DB Migration requirements. The schema evolution, pure SQL migration, requester-to-User migration, password hashing, seed data, idempotency checks, ticket relationships, comments/notes, and migration test coverage are aligned with the Lab 3 requirements.
  > 
  > Overall, this PR is good to go for lab3-staging. Nice work!
- **Resolution:** Merged into `lab3-staging`.

---

#### PR #63: Authentication Foundation, Token Revocation & API Tests
- **Feature Branch:** `feat/lab3-auth`
- **Scope Reviewed:** POST `/api/v1/auth/login`, POST `/api/v1/auth/change-password`, POST `/api/v1/auth/logout`, fail-secure startup check on `JWT_SECRET`, server-side token revocation
- **Reviewer Verdict (@Pilaiwan3492):** `APPROVED` (2026-09-16T17:42:24Z)
- **Reviewer Comment (@Pilaiwan3492):**  
  > Overall, this PR looks good and is ready to move forward to lab3-staging. Nice work!
- **Resolution:** Merged into `lab3-staging`.

---

#### PR #64: Client Authentication, Mandatory Password Change & App Shell Navigation
- **Feature Branch:** `feature/lab3-client-auth-ui`
- **Scope Reviewed:** Login screen, mandatory first-login password change flow, role badge in App Shell, logout session clearing, protected route navigation guards, and removal of legacy Development Requester Selector
- **Reviewer Verdict 1 (@Pilaiwan3492) — `CHANGES_REQUESTED` (2026-09-16T18:40:22Z):**  
  > The main authentication flow, password-change flow, role badges, logout, role-based navigation, and removal of the legacy Development Requester Selector look good and are aligned with the Lab 3 requirements. 
  > 
  > One requirement is still missing:
  > 
  > - Administrator navigation should include both User Management and Ticket Lookup.
  > - The current AppHeader only shows User Management for Administrators.
  > - Please also add/update the corresponding Ticket Lookup navigation test.
  > 
  > After adding Ticket Lookup for Administrators and updating the test, this should be good to go. Nice work!
- **Author Response (@Apichaya251400) (2026-09-16T18:53:35Z):**  
  > Fixed in commit `8996a5c`.
  > 
  > * Added **Ticket Lookup** to the Administrator navigation alongside **User Management**.
  > * Added the corresponding `ticket-lookup` handling in `App.tsx`.
  > * Updated `AppHeader.test.tsx` to test that Administrators can see **Ticket Lookup**.
  > 
  > Thanks for the review and feedback!
- **Reviewer Verdict 2 (@Pilaiwan3492) — `APPROVED` (2026-09-16T19:02:42Z):**  
  > I re-checked the latest changes against the Lab 3 Authentication, Mandatory Password Change, App Shell, and UI requirements.
  > 
  > Overall, this PR looks good and is ready to move forward to lab3-staging. Nice work!
- **Resolution:** Merged into `lab3-staging`.

---

#### PR #65: Requester Public Comments, Signalling & Notes Security
- **Feature Branch:** `feature/lab3-requester-regression`
- **Scope Reviewed:** Public comments submission and timeline display, problem resolution indicator, internal notes zero-leakage security boundary on Requester ticket view
- **Reviewer Verdict (@Pilaiwan3492):** `APPROVED` (2026-09-16T19:42:01Z)
- **Reviewer Comment (@Pilaiwan3492):**  
  > Approved !!!
  > 
  > I checked this PR against the Lab 3 Requester Regression, Public Comments, Internal Notes, and Requester Signalling requirements.
  > 
  > Overall, this PR looks good and is ready to move forward to lab3-staging. Nice work!
- **Resolution:** Merged into `lab3-staging`.

---

#### PR #66: IT Staff Ticket Queue REST API & Responsive Interface
- **Feature Branch:** `feature/lab3-staff-queue`
- **Scope Reviewed:** GET `/api/v1/tickets/queue` endpoint, debounced search, status/priority filtering, unassigned ticket filter, pagination controls, responsive desktop table and mobile cards
- **Reviewer Verdict (@Pilaiwan3492):** `APPROVED` (2026-09-16T20:23:14Z)
- **Reviewer Comment (@Pilaiwan3492):**  
  > I checked this PR against the Lab 3 IT Staff Ticket Queue requirements and Issue #54.
  > 
  > Overall, this PR looks good and is ready to move forward to lab3-staging. Nice work! 
- **Resolution:** Merged into `lab3-staging`.

---

#### PR #67: IT Staff Ticket Detail & Operational Controls
- **Feature Branch:** `feature/lab3-staff-ticket-detail`
- **Scope Reviewed:** Ticket detail view, claim ticket action, reassign ticket action, independent IT Priority adjustment, strict status transition lifecycle, amber-themed private internal notes
- **Reviewer Verdict (@Pilaiwan3492):** `APPROVED` (2026-09-17T05:45:22Z)
- **Reviewer Comment (@Pilaiwan3492):**  
  > I checked this PR against the Lab 3 IT Staff Ticket Detail & Operations requirements.
  > 
  > Overall, this PR looks good and is ready to move forward to lab3-staging. Nice work!
- **Resolution:** Merged into `lab3-staging`.

---

#### PR #68: Administrator User Management & Safety Guards
- **Feature Branch:** `feature/lab3-admin-user-mgmt`
- **Scope Reviewed:** User CRUD management, search and role filter, initial password reset, self-deactivation guard, last active admin protection with atomic safety
- **Reviewer Verdict 1 (@Pilaiwan3492) — `COMMENTED` (2026-09-17T10:48:25Z):**  
  > Please fix the concurrent Last Active Administrator test.
  > 
  > Currently, both concurrent requests use the same adminToken, so the test triggers the self-demotion protection instead of actually testing the race condition between two different Administrators.
  > 
  > Please update the test to:
  > 
  > Create 2 different active Administrators  
  > Use 2 different Administrator tokens  
  > Have each request target the other Administrator's account  
  > Verify that the system still prevents the number of active Administrators from becoming 0  
  > 
  > This is needed so the test actually proves the Lab 3 last-active-Administrator concurrency protection works correctly.
- **Author Response (@Apichaya251400) (2026-09-17T11:01:57Z):**  
  > Fixed in the latest commit.
  > 
  > The concurrent test now uses two different active Administrators with separate tokens, with each request targeting the other Administrator. It also verifies that the system prevents the active Administrator count from reaching 0.
  > 
  > This now properly covers the intended race condition.
- **Reviewer Verdict 2 (@Pilaiwan3492) — `APPROVED` (2026-09-17T11:07:23Z):**  
  > This fixes the previous test coverage issue and properly validates the concurrent safety guard.
  > 
  > Looks good to me!
- **Resolution:** Merged into `lab3-staging`.

---

#### PR #69: Playwright End-to-End Test Suite & Mandatory Assertions
- **Feature Branch:** `feature/lab3-e2e-tests`
- **Scope Reviewed:** Multi-viewport E2E test suite across Desktop, Tablet, and Mobile; dual-admin concurrency verification; deterministic database cleanup
- **Reviewer Verdict 1 (@Pilaiwan3492) — `COMMENTED` (2026-09-17T16:29:00Z):**  
  > Could you please adjust the AC-ADMIN-05 test? 
  > 
  > Right now it tests self-deactivation, not the last active Administrator case. Please use 2 different Admin accounts and have one try to deactivate/demote the other when they are the last active Admin.
  > 
  > Then verify the action is rejected and at least one active Admin remains.
- **Author Response (@Apichaya251400) (2026-09-17T17:04:46Z):**  
  > Fixed in the latest commit.
  > 
  > - Updated AC-ADMIN-05 to use two different Administrator accounts and separate browser contexts.
  > - Added concurrent deactivation attempts targeting the other Administrator.
  > - Verified the expected `[200, 400]` result and `INVALID_ADMIN_ACTION` for the rejected request.
  > - Verified that at least one active Administrator remains after the operation.
  > - Added deterministic cleanup to restore the test state.
  > 
  > Thanks for the feedback!
- **Reviewer Verdict 2 (@Pilaiwan3492) — `APPROVED` (2026-09-17T17:12:26Z):**  
  > Approved 
  > 
  > Looks good! I re-checked the AC-ADMIN-05 test, and it now correctly uses 2 different Admin accounts to test the last active Administrator case concurrently.
  > 
  > The test also verifies the rejected request and that at least one active Admin remains. Nice fix!
- **Resolution:** Merged into `lab3-staging`.

---

#### PR #70: Visual QA & Responsive Design Verification
- **Feature Branch:** `feature/lab3-visual-qa`
- **Scope Reviewed:** 21 responsive visual QA screenshots, visual checklist verification, touch targets >= 44px, zero horizontal overflow, separating scratch screenshot test from main E2E suite
- **Reviewer Verdict 1 (@Pilaiwan3492) — `COMMENTED` (2026-09-18T05:15:50Z):**  
  > Please update playwright.config.ts so the default test run only targets e2e/**/*.spec.ts.
  > 
  > The scratch/ screenshot test should be run separately to avoid mixing visual capture with the main E2E suite.
- **Reviewer Verdict 2 (@Pilaiwan3492) — `COMMENTED` (2026-09-18T14:17:49Z):**  
  > I found 2 E2E cases that need to be adjusted before approval:
  > 
  > 1. Last Active Administrator test
  >     AC-ADMIN-05 currently deactivates admin2 and then tries to demote the currently logged-in admin@toktick.it. This triggers the self-deactivation protection, so it does not independently prove the last active Administrator protection.
  >     Please test this with two different Administrator accounts: have Admin A attempt to deactivate/demote Admin B when Admin B is the last active Administrator, and verify the operation is rejected and Admin B remains an active Administrator.
  > 2. Direct unauthenticated access test
  >     AC-AUTH-05 currently only checks the login screen at /. Please update it to actually navigate directly to at least one protected view/URL while unauthenticated and verify that access is blocked.
  > 
  > The rest of the E2E coverage looks good from the current PR.
- **Author Response (@Apichaya251400) (2026-09-18T16:39:03Z):**  
  > Thanks for catching these! I’ve fixed both cases and pushed the changes:
  > 
  > Updated AC-ADMIN-05 to properly test the last active Administrator case using two different Admin accounts.
  > Updated AC-AUTH-05 to directly access a protected view while unauthenticated and verify that access is blocked.
  > 
  > Could you please check them again when you have a chance? Thanks!
- **Reviewer Verdict 3 (@Pilaiwan3492) — `APPROVED` (2026-09-18T16:44:24Z):**  
  > Looks good! I re-checked the latest changes, and the Playwright E2E and screenshot capture are now properly separated.
  > 
  > The 21 responsive screenshots, visual checklist, and reviewer documentation are also updated correctly.
  > 
  > Everything looks good to me. Nice work!
- **Resolution:** Merged into `lab3-staging`.
