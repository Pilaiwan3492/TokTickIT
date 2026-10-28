# Lab 4 — Peer Review Record

**Author:** Pilaiwan Churdchu — 67070503492 — GitHub: [@Pilaiwan3492](https://github.com/Pilaiwan3492)  
**Peer Reviewer:** Aphichaya Klinhual — 67070503447 — GitHub: [@Apichaya251400](https://github.com/Apichaya251400)  
**Author Repository:** [https://github.com/Pilaiwan3492/TokTickIT](https://github.com/Pilaiwan3492/TokTickIT)  
**Partner Repository:** [https://github.com/Apichaya251400/TokTickIT](https://github.com/Apichaya251400/TokTickIT)  
**Target Release:** `lab4-staging` → `main`

---

## 1. Pull Requests I Authored (Reviewed by @Apichaya251400)

**Repository:** [https://github.com/Pilaiwan3492/TokTickIT](https://github.com/Pilaiwan3492/TokTickIT)

| PR | Feature Branch | Issue Title / Scope | Reviewer Verdict | Status |
| :---: | :--- | :--- | :---: | :---: |
| [#82](https://github.com/Pilaiwan3492/TokTickIT/pull/82) | `feature/31-specification-test-plan` | Issue 31: Sprint 4 Engineering Specification, Contract Decomposition & Test Strategy | Approved | Merged |
| [#83](https://github.com/Pilaiwan3492/TokTickIT/pull/83) | `feature/32-schema-migration-seed` | Issue 32: Database Schema Migration, Idempotent Seed Data & Backward Compatibility | Approved | Merged |
| [#84](https://github.com/Pilaiwan3492/TokTickIT/pull/84) | `feature/33-actions-taken-backend-api` | Issue 33: Actions Taken Backend REST API, Concurrency Control & Role Boundaries | Approved | Merged |
| [#85](https://github.com/Pilaiwan3492/TokTickIT/pull/85) | `feature/34-ticket-workflow-resolution-gate-api` | Issue 34: Ticket Lifecycle State Machine, Resolution Gate & Concurrency API | Approved | Merged |
| [#86](https://github.com/Pilaiwan3492/TokTickIT/pull/86) | `feature/35-actions-taken-frontend-react` | Issue 35: Actions Taken Frontend React Section, Modals & Visual Fidelity | Approved | Merged |
| [#87](https://github.com/Pilaiwan3492/TokTickIT/pull/87) | `feature/36-dashboard-backend-sql` | Issue 36: Role Dashboards Backend SQL Aggregation API & Performance Benchmarks | Approved | Merged |
| [#89](https://github.com/Pilaiwan3492/TokTickIT/pull/89) | `feature/37-dashboard-react-frontend` | Issue 37: Role Dashboards React Frontend UI, Metric Cards & Drill-Down Navigation | Changes Requested → Approved | Merged |
| [#90](https://github.com/Pilaiwan3492/TokTickIT/pull/90) | `feature/38-playwright-e2e-responsive` | Issue 38: Playwright E2E Multi-Device Testing, Responsive Layouts & Accessibility | Changes Requested → Approved | Merged |
| [#91](https://github.com/Pilaiwan3492/TokTickIT/pull/91) | `feature/39-final-regression-submission` | Issue 39: Final Product Hardening, Full Regression, AI Reflection & Submission Package | Approved | Ready to Merge |

---

## 2. Detailed Review Dialogue on PRs I Authored

### PR #82: Issue 31 — Sprint 4 Engineering Specification, Contract Decomposition & Test Strategy
- **Feature Branch:** `feature/31-specification-test-plan`
- **Review Summary:** Established canonical engineering architecture and dual-traceability contracts for TokTickIT Lab 4 (Sprint 4) in `docs/lab-04/specification.md` and `docs/lab-04/tests.md`. Specified 20 Functional Requirements (`FR-01` to `FR-20`), 19 Business Rules (`BR-01` to `BR-19`), 25 Acceptance Criteria (`AC-01` to `AC-25`), complete state transition matrix (18 permitted transitions across 8 statuses), optimistic concurrency protocols (`expectedUpdatedAt`, `expectedTicketUpdatedAt`), and pre-implementation test catalog.
- **Reviewer Verdict:** `APPROVED` (2026-10-04T16:30:15Z)
- **Reviewer Comment (@Apichaya251400):**  
  > PR #82 looks comprehensive and well-architected! The 11 sections in `specification.md` and the test catalog in `tests.md` establish crystal-clear boundaries for Actions Taken, the Resolution Gate, and Role Dashboards. All ACs and BRs are mapped cleanly. Approved and ready to merge to `lab4-staging`!
- **Resolution:** Merged into `lab4-staging`.

---

### PR #83: Issue 32 — Database Schema Migration, Idempotent Seed Data & Backward Compatibility
- **Feature Branch:** `feature/32-schema-migration-seed`
- **Review Summary:** Extended Prisma schema with `ActionTaken` model linked to `Ticket` and `User` (`performedBy`), added composite indices (`ticketId`, `actionDate`), and established idempotent seeding covering all 8 statuses (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`). Verified zero data loss on legacy tickets (`actionsTaken: []`) and backward compatibility for all Lab 1–3 models.
- **Reviewer Verdict:** `APPROVED` (2026-10-04T18:45:22Z)
- **Reviewer Comment (@Apichaya251400):**  
  > Verified Prisma migration and seeding scripts locally. Re-running the seed script is truly idempotent without duplicating rows or breaking existing tickets. All 22 migration & regression tests pass! Approved to merge.
- **Resolution:** Merged into `lab4-staging`.

---

### PR #84: Issue 33 — Actions Taken Backend REST API, Concurrency Control & Role Boundaries
- **Feature Branch:** `feature/33-actions-taken-backend-api`
- **Review Summary:** Implemented RESTful endpoints under `/api/v1/tickets/:id/actions-taken` with strict role guards (`IT_STAFF` and `ADMIN` can create/edit; `REQUESTER` has read-only visibility on owned tickets and 403 on other tickets). Implemented mandatory `followUpNote` validation when `followUpRequired = true`, inactive actor rejection (`INACTIVE_ACTOR_REJECTED`), optimistic concurrency detection (`expectedTicketUpdatedAt`), and locked ticket validation (`CLOSED`/`CANCELLED`).
- **Reviewer Verdict:** `APPROVED` (2026-10-05T14:12:08Z)
- **Reviewer Comment (@Apichaya251400):**  
  > Tested the Actions Taken API suite with Vitest. Role boundaries and HTTP status codes (`201`, `400`, `403`, `409`) match the specification perfectly. The optimistic concurrency check on `expectedTicketUpdatedAt` works seamlessly. Approved!
- **Resolution:** Merged into `lab4-staging`.

---

### PR #85: Issue 34 — Ticket Lifecycle State Machine, Resolution Gate & Concurrency API
- **Feature Branch:** `feature/34-ticket-workflow-resolution-gate-api`
- **Review Summary:** Implemented the complete 18 permitted status transition matrix in `ticket-workflow.validator.ts`, backend Resolution Gate enforcement, Requester advisory resolution endpoint (`POST /api/v1/tickets/:id/resolve-indicator` setting `isResolvedByUser: true` without altering formal status), and optimistic concurrency guard returning HTTP 409 `STALE_UPDATE_CONFLICT` on stale `expectedUpdatedAt`.
- **Reviewer Verdict:** `APPROVED` (2026-10-05T19:20:45Z)
- **Reviewer Comment (@Apichaya251400):**  
  > Checked the state machine transition tests and the Resolution Gate logic. Disallowed jumps correctly return HTTP 400 `INVALID_STATUS_TRANSITION`, while closed/cancelled tickets return `TICKET_LOCKED`. Concurrency conflict tests pass 100%. Approved!
- **Resolution:** Merged into `lab4-staging`.

---

### PR #86: Issue 35 — Actions Taken Frontend React Section, Modals & Visual Fidelity
- **Feature Branch:** `feature/35-actions-taken-frontend-react`
- **Review Summary:** Developed `ActionsTakenSection`, `ActionTakenModal`, and chronological listing with Zen Green styling, Amber follow-up badges (`#D97706` / `#FEF3C7`), auto-attributed read-only performer, mandatory follow-up validation, form state preservation on error, and double-click submission prevention.
- **Reviewer Verdict:** `APPROVED` (2026-10-06T15:35:10Z)
- **Reviewer Comment (@Apichaya251400):**  
  > Frontend components for Actions Taken look fantastic. The Zen Green theme is consistent, the follow-up note validation triggers reliably, and the modal handles edit mode pre-population smoothly. All 20 client tests in `ActionsTaken.test.tsx` pass!
- **Resolution:** Merged into `lab4-staging`.

---

### PR #87: Issue 36 — Role Dashboards Backend SQL Aggregation API & Performance Benchmarks
- **Feature Branch:** `feature/36-dashboard-backend-sql`
- **Review Summary:** Built `/api/v1/dashboard/requester` and `/api/v1/dashboard/staff` endpoints utilizing optimized SQL database aggregations (`groupBy`, `count`). Implemented 4 Requester metric cards, 6 Staff metric cards, Priority strip (`urgentCount`, `highCount`), current-user recent actions (max 5), Admin user stats (`activeUsers`, `activeStaff`, `activeAdmins`), and latency smoke tests ($< 300\text{ms}$).
- **Reviewer Verdict:** `APPROVED` (2026-10-06T20:10:40Z)
- **Reviewer Comment (@Apichaya251400):**  
  > Backend dashboard endpoints return clean, aggregated numbers directly from the database with zero N+1 queries. Performance-smoke tests execute well within the 300ms threshold. Approved!
- **Resolution:** Merged into `lab4-staging`.

---

### PR #89: Issue 37 — Role Dashboards React Frontend UI, Metric Cards & Drill-Down Navigation
- **Feature Branch:** `feature/37-dashboard-react-frontend`
- **Review Summary:** Implemented `RequesterDashboard.tsx` and `StaffDashboard.tsx` with responsive metric cards, greeting header, priority attention badges, recent actions list, and accessible drill-down navigation linking directly to filtered views (`/my-tickets?status=...` and `/staff/tickets?status=...`).
- **Reviewer Verdict 1 (@Apichaya251400) — `COMMENTED / CHANGES REQUESTED` (2026-10-07T14:22:15Z):**  
  > Great work on the dashboard cards and drill-down routing! However, there are two points before approval:
  > 1. In `docs/lab-04/tests.md`, please resolve the merge conflict with `origin/lab4-staging` while preserving test documentation updates.
  > 2. In `dashboards.spec.ts`, the keyboard navigation test calls `openTicketsLink.focus()` directly before pressing Enter. To genuinely prove accessible keyboard navigation, please adjust the test to press `Tab` sequentially until reaching the target link, and assert focus without calling `.focus()`.
- **Author Response (@Pilaiwan3492) (2026-10-07T16:05:30Z):**  
  > Thank you @Apichaya251400 for the sharp review! Addressed both points:
  > 1. Resolved the merge conflict in `docs/lab-04/tests.md` cleanly against `lab4-staging`.
  > 2. Updated `dashboards.spec.ts` keyboard test to sequentially press `Tab` until the first interactive card link receives focus naturally, verifying `page.locator(':focus')` matches the target element and asserting the visible `#0B7A46` focus ring.
- **Reviewer Verdict 2 (@Apichaya251400) — `APPROVED` (2026-10-07T16:45:00Z):**  
  > Verified both updates! Conflict is resolved and the keyboard Tab test is authentic and passes reliably. Approved!
- **Resolution:** Merged into `lab4-staging`.

---

### PR #90: Issue 38 — Playwright E2E Multi-Device Testing, Responsive Layouts & Accessibility
- **Feature Branch:** `feature/38-playwright-e2e-responsive`
- **Review Summary:** Implemented complete Playwright multi-role E2E suites covering Actions Taken lifecycle (`E2E-01`..`E2E-03`), Resolution Gate flow (`E2E-04`..`E2E-06`), Role Dashboards (`E2E-07`..`E2E-09`), Multi-Device Responsive layouts (`RESP-01`..`RESP-04`), touch targets $\ge 44\text{px}$, and visual inspections (`VIS-01`..`VIS-04`), capturing 24 organized screenshot artifacts.
- **Reviewer Verdict 1 (@Apichaya251400) — `COMMENTED / CHANGES REQUESTED` (2026-10-08T18:15:30Z):**  
  > Excellent E2E coverage! Two recommendations to address:
  > 1. In `specification.md` AC-23, Tablet is defined as width 768px, whereas Playwright config had Tablet set to 820px. Please align the tablet test viewport to 768px to strictly adhere to AC-23.
  > 2. In `seed.ts` Ticket 8 has a comment saying "Unassigned" but `ownerId` was assigned to David Lee. Please ensure comments and seed data are fully consistent.
  > 3. Note: E2E-10 full regression across Labs 1–3 should remain Planned for Issue 39.
- **Author Response (@Pilaiwan3492) (2026-10-08T20:30:15Z):**  
  > Thank you @Apichaya251400! Both points resolved:
  > 1. Configured Playwright Tablet project and responsive tests to 768x1024px matching AC-23 strictly, running all responsive assertions at 768px.
  > 2. Corrected Ticket 8 in `seed.ts` and `db-reset.ts` so owner and comment are consistent.
  > 3. E2E-10 is kept as Planned for Issue 39.
- **Reviewer Verdict 2 (@Apichaya251400) — `APPROVED` (2026-10-08T21:10:00Z):**  
  > Perfect! All 45 E2E tests pass across Desktop, Tablet, and Mobile, and all 24 screenshot artifacts match Zen Green token requirements. Approved!
- **Resolution:** Merged into `lab4-staging`.

---

### PR #91: Issue 39 — Final Product Hardening, Full Regression, AI Reflection & Submission Package
- **Feature Branch:** `feature/39-final-regression-submission`
- **Review Summary:** Implemented the full regression test suite across Labs 1–3 (`E2E-10` in `e2e/lab-04/regression.spec.ts` with 12 tests across Desktop, Tablet, and Mobile), client test coverage for Ticket Workflow & Resolution Gate (`UI-09` through `UI-15` in `client/tests/lab-04/TicketWorkflow.test.tsx`), updated `docs/lab-04/tests.md` to 100% Passed, authored `docs/lab-04/reviewer.md` and `docs/lab-04/ai-use.md`, updated `README.md`, and compiled the complete 9-part submission package (`docs/lab-04/submission-package.md`).
- **Reviewer Verdict:** `APPROVED` (2026-10-09T14:30:00Z)
- **Reviewer Comment (@Apichaya251400):**  
  > Exceptional final submission package! E2E-10 regression suite runs flawlessly across all three viewports without a single failure across Labs 1–3 features. The TicketWorkflow client tests provide 100% coverage for the Resolution Gate. All 9 Answer Parts are meticulously formatted per Handout Section 14. Ready to merge to `lab4-staging` and release to `main`!
- **Resolution:** Ready for final merge into `lab4-staging` and `main`.

---

## 3. Pull Requests I Reviewed (Authored by @Apichaya251400)

**Partner Repository:** [https://github.com/Apichaya251400/TokTickIT](https://github.com/Apichaya251400/TokTickIT)

| PR | Feature Branch | Issue Title / Scope | My Verdict | Status |
| :---: | :--- | :--- | :---: | :---: |
| [#81](https://github.com/Apichaya251400/TokTickIT/pull/81) | `feature/31-specification-test-plan` | Issue 31: Sprint 4 Engineering Specification & Test Traceability | Approved | Merged |
| [#82](https://github.com/Apichaya251400/TokTickIT/pull/82) | `feature/32-schema-migration-seed` | Issue 32: Database Schema Migration, Idempotent Seed Data | Approved | Merged |
| [#83](https://github.com/Apichaya251400/TokTickIT/pull/83) | `feature/33-actions-taken-backend-api` | Issue 33: Actions Taken Backend REST API & Concurrency Control | Approved | Merged |
| [#84](https://github.com/Apichaya251400/TokTickIT/pull/84) | `feature/34-ticket-workflow-resolution-gate-api` | Issue 34: Ticket Lifecycle State Machine & Resolution Gate API | Approved | Merged |
| [#85](https://github.com/Apichaya251400/TokTickIT/pull/85) | `feature/35-actions-taken-frontend-react` | Issue 35: Actions Taken React Section, Modals & Visual Styling | Changes Requested → Approved | Merged |
| [#86](https://github.com/Apichaya251400/TokTickIT/pull/86) | `feature/36-dashboard-backend-sql` | Issue 36: Role Dashboards Backend SQL Aggregation API | Approved | Merged |
| [#87](https://github.com/Apichaya251400/TokTickIT/pull/87) | `feature/37-dashboard-react-frontend` | Issue 37: Role Dashboards React Frontend UI & Drill-Downs | Approved | Merged |
| [#88](https://github.com/Apichaya251400/TokTickIT/pull/88) | `feature/38-playwright-e2e-responsive` | Issue 38: Playwright E2E Multi-Device Testing & Visual Inspection | Changes Requested → Approved | Merged |
| [#89](https://github.com/Apichaya251400/TokTickIT/pull/89) | `feature/39-final-regression-submission` | Issue 39: Final Regression, AI Reflection & Submission Package | Approved | Ready to Merge |

---

## 4. Detailed Review Dialogue on PRs I Reviewed

### Partner PR #81: Issue 31 — Sprint 4 Engineering Specification & Test Traceability
- **Author:** @Apichaya251400
- **My Verdict:** `APPROVED` (2026-10-04T17:15:00Z)
- **My Review Comment (@Pilaiwan3492):**  
  > I reviewed `docs/lab-04/specification.md` and `docs/lab-04/tests.md` on branch `feature/31-specification-test-plan`. The 11 sections are clearly written, the state transition matrix accurately specifies all 18 permitted transitions, and the dual traceability table maps all 25 ACs and 19 BRs to planned automated tests. Approved to merge to `lab4-staging`!

---

### Partner PR #82: Issue 32 — Database Schema Migration, Idempotent Seed Data
- **Author:** @Apichaya251400
- **My Verdict:** `APPROVED` (2026-10-04T19:30:00Z)
- **My Review Comment (@Pilaiwan3492):**  
  > Pulled and executed the migration and seed scripts locally. Existing ticket data and requester records from Lab 3 are preserved without corruption. Running the seed multiple times produces identical clean data. All migration tests pass! Approved.

---

### Partner PR #83: Issue 33 — Actions Taken Backend REST API & Concurrency Control
- **Author:** @Apichaya251400
- **My Verdict:** `APPROVED` (2026-10-05T15:40:00Z)
- **My Review Comment (@Pilaiwan3492):**  
  > The Actions Taken API implementation is solid. RBAC rules properly reject Requesters with HTTP 403, mandatory follow-up notes are strictly validated when `followUpRequired = true`, and optimistic concurrency returns HTTP 409 `STALE_UPDATE_CONFLICT` on mismatched timestamps. Approved!

---

### Partner PR #84: Issue 34 — Ticket Lifecycle State Machine & Resolution Gate API
- **Author:** @Apichaya251400
- **My Verdict:** `APPROVED` (2026-10-05T20:45:00Z)
- **My Review Comment (@Pilaiwan3492):**  
  > Verified the status transition state machine. All 18 valid transitions work correctly and illegal status jumps are rejected with HTTP 400 `INVALID_STATUS_TRANSITION`. Terminal closed/cancelled tickets are immutable. Approved!

---

### Partner PR #85: Issue 35 — Actions Taken React Section, Modals & Visual Styling
- **Author:** @Apichaya251400
- **My Verdict 1:** `COMMENTED / CHANGES REQUESTED` (2026-10-06T16:20:00Z)
- **My Review Comment (@Pilaiwan3492):**  
  > Overall the component structure is very clean. One recommendation: when `followUpRequired` is unchecked, please ensure the `followUpNote` input is cleared or disabled so stale text is not accidentally submitted.
- **Author Response (@Apichaya251400):**  
  > Thanks for catching that! Added a reset handler that clears `followUpNote` to an empty string whenever `followUpRequired` is toggled off.
- **My Verdict 2:** `APPROVED` (2026-10-06T17:10:00Z)
- **My Review Comment (@Pilaiwan3492):**  
  > Verified the fix! Form behavior is now completely clean and foolproof. Approved!

---

### Partner PR #86: Issue 36 — Role Dashboards Backend SQL Aggregation API
- **Author:** @Apichaya251400
- **My Verdict:** `APPROVED` (2026-10-06T21:30:00Z)
- **My Review Comment (@Pilaiwan3492):**  
  > The dashboard SQL queries are well-structured using Prisma `groupBy` and count aggregations. Scoping rules correctly isolate Requester metrics to the calling user, while Staff metrics provide full operational queue visibility. Smoke tests pass within latency limits. Approved!

---

### Partner PR #87: Issue 37 — Role Dashboards React Frontend UI & Drill-Downs
- **Author:** @Apichaya251400
- **My Verdict:** `APPROVED` (2026-10-07T18:00:00Z)
- **My Review Comment (@Pilaiwan3492):**  
  > Tested the dashboard UI components in browser and Vitest. Metric cards render cleanly with Zen Green primary accents, and clicking cards routes directly to filtered tables with active status filters. Approved!

---

### Partner PR #88: Issue 38 — Playwright E2E Multi-Device Testing & Visual Inspection
- **Author:** @Apichaya251400
- **My Verdict 1:** `COMMENTED / CHANGES REQUESTED` (2026-10-08T19:00:00Z)
- **My Review Comment (@Pilaiwan3492):**  
  > Great E2E tests! In `responsive.spec.ts`, please verify that the horizontal scroll assertion `assertNoHorizontalOverflow()` is called on both Mobile (375px) and Tablet (768px) for the Staff Dashboard when tables contain wide columns.
- **Author Response (@Apichaya251400):**  
  > Updated the test helper and added container overflow containment (`overflow-x-auto`) with assertions asserting zero document-level horizontal overflow on both viewports.
- **My Verdict 2:** `APPROVED` (2026-10-08T20:15:00Z)
- **My Review Comment (@Pilaiwan3492):**  
  > Verified on all viewports. Zero horizontal overflow confirmed and touch targets meet $\ge 44\text{px}$. Approved!

---

### Partner PR #89: Issue 39 — Final Regression, AI Reflection & Submission Package
- **Author:** @Apichaya251400
- **My Verdict:** `APPROVED` (2026-10-09T15:00:00Z)
- **My Review Comment (@Pilaiwan3492):**  
  > Reviewed the final submission package, full regression suite (E2E-10), and AI reflection document. All requirements across Labs 1 through 4 are verified with zero regressions. Excellent collaboration throughout Sprint 4! Approved!

---

## 5. Overall Peer Review Reflection & Partnership Impact

The collaborative peer review partnership between Pilaiwan Churdchu (@Pilaiwan3492) and Aphichaya Klinhual (@Apichaya251400) throughout Lab 4 (Sprint 4) was critical in upholding high engineering quality, catching edge cases early, and ensuring strict compliance with course standards:

1. **Active Code Inspection over Rubber-Stamping**: Rather than passively approving PRs, both partners conducted deep code reviews with concrete test reproductions. For instance, in PR #89, @Apichaya251400 pointed out that synthetic `.focus()` calls in keyboard navigation tests do not prove authentic keyboard accessibility, prompting an update to real sequential `Tab` key navigation. In PR #90, viewport definition discrepancies between AC-23 (768px) and Playwright config (820px) were detected and harmonized before merging.
2. **Synchronized Quality Gates**: Both repositories maintained identical branching structures (`lab4-staging` $\rightarrow$ `main`), identical PR conventions, and 100% automated test coverage. This reciprocal rigor ensured that both partners delivered zero-regression, production-ready software packages.
