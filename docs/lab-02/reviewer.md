# Lab 2 — Peer Review Record

**Author:** Pilaiwan Churdchu — 67070503492 — GitHub: [@Pilaiwan3492](https://github.com/Pilaiwan3492)  
**Peer Reviewer:** Aphichaya Klinhual — 67070503447 — GitHub: [@Apichaya251400](https://github.com/Apichaya251400)  
**Author Repository:** [https://github.com/Pilaiwan3492/TokTickIT](https://github.com/Pilaiwan3492/TokTickIT)  
**Partner Repository:** [https://github.com/Apichaya251400/TokTickIT](https://github.com/Apichaya251400/TokTickIT)  
**Target Release:** `lab2-staging` → `main`

---

## 1. Pull Requests I Authored (Reviewed by @Apichaya251400)

**Repository:** [https://github.com/Pilaiwan3492/TokTickIT](https://github.com/Pilaiwan3492/TokTickIT)

| PR | Feature Branch | Issue Title / Scope | Reviewer Verdict |
| :---: | :--- | :--- | :---: |
| [#33](https://github.com/Pilaiwan3492/TokTickIT/pull/33) | `feature/5-create-specification-doc` | PR 5: docs specification with attachment flow and api contracts | Approved |
| [#34](https://github.com/Pilaiwan3492/TokTickIT/pull/34) | `feature/6-api-spec-docs` | PR 6: docs api specification for requester mvp | Approved |
| [#35](https://github.com/Pilaiwan3492/TokTickIT/pull/35) | `feature/7-ui-spec-docs` | PR 7: docs ui specification for requester mvp | Approved |
| [#36](https://github.com/Pilaiwan3492/TokTickIT/pull/36) | `feature/8-planned-test-strategy` | PR 8: docs planned test strategy for requester mvp | Approved |
| [#37](https://github.com/Pilaiwan3492/TokTickIT/pull/37) | `feature/9-prisma-schema` | PR 9: feat update prisma schema and run migrations | Approved |
| [#38](https://github.com/Pilaiwan3492/TokTickIT/pull/38) | `feature/10-seed-data` | PR 10: feat seed initial data for categories requesters and related systems | Approved |
| [#39](https://github.com/Pilaiwan3492/TokTickIT/pull/39) | `feature/11-requester-selector-ui` | PR 11: feat implement requester selector UI and context persistence | Approved |
| [#40](https://github.com/Pilaiwan3492/TokTickIT/pull/40) | `feature/12-ticket-ownership-guard` | PR 12: feat implement backend ticket ownership guard and requester context validation | Approved |
| [#41](https://github.com/Pilaiwan3492/TokTickIT/pull/41) | `feature/13-create-ticket-feature` | PR 13: feat implement create ticket feature with validation and test cases | Approved |
| [#42](https://github.com/Pilaiwan3492/TokTickIT/pull/42) | `feature/14-my-ticket-page` | PR 14: feat implement my tickets list with search, filter, sort, and pagination | Approved |
| [#43](https://github.com/Pilaiwan3492/TokTickIT/pull/43) | `feature/15-ticket-detail` | PR 15: feat implement ticket detail read-only view and UI refactoring | Approved |
| [#44](https://github.com/Pilaiwan3492/TokTickIT/pull/44) | `feature/16-attachment-upload` | PR 16: feat implement attachment upload and validation for tickets | Approved |
| [#45](https://github.com/Pilaiwan3492/TokTickIT/pull/45) | `feature/17-attachment-soft-removal` | PR 17: feat implement attachment download, soft removal, and confirmation modal | Approved |
| [#46](https://github.com/Pilaiwan3492/TokTickIT/pull/46) | `feature/18-test-suite-evidence` | PR 18: test restructure test suites and finalize test evidence | Approved |
| [#47](https://github.com/Pilaiwan3492/TokTickIT/pull/47) | `feature/19-peer-review-submission` | PR 19: Peer Review & Submission Package (docs) | Open / Approved |

---

### Detailed Review Dialogue on PRs I Authored

#### PR #33: docs specification with attachment flow and api contracts
- **Reviewer Comment (@Apichaya251400):**  
  > *"Hey @Pilaiwan3492 just went through the Lab 2 spec, honestly really solid. Easy to follow and covers everything from the handout, nothing missing.*  
  > *Stuff I liked:*  
  > *- Ticket numbering, default status, and the attachment rules (5MB, 5 files, allowed types) are all clear, no guessing needed*  
  > *- All 20 ACs use Given-When-Then properly so it’s super clear what each flow should do*  
  > *- Data/API design looks good too, the indexing makes sense for the queries and error codes are covered.*  
  > *One thing to watch when implementing: the `/api/v1/` prefix in section 8. Just make sure the client side (`api.ts`) and the server routes actually match, easy for those to drift if you’re not careful.*  
  > *Overall approving this, good to merge into lab2-staging. Nice work!"*
- **Author Response (@Pilaiwan3492):**  
  > *"@Apichaya251400 Thank you for the review and the heads-up about the `/api/v1/` prefix in Section 8! I'll definitely keep that in mind during implementation."*

#### PR #34: docs api specification for requester mvp
- **Reviewer Comment (@Apichaya251400):**  
  > *"@Pilaiwan3492 went through the Lab 2 spec, solid work! Covers everything, clear to follow, no complaints. Approving this, good to merge into lab2-staging. Nice job!"*
- **Author Response (@Pilaiwan3492):**  
  > *"Thank you! 🎉"*

#### PR #35: docs ui specification for requester mvp
- **Reviewer Comment (@Apichaya251400):**  
  > *"@Pilaiwan3492 went through the UI spec, this is really well done. Color tokens, spacing, responsive breakpoints, all spelled out so there's no ambiguity when building this out. The mobile table-to-card conversion for My Tickets is a nice touch too, saves a headache later.*  
  > *Liked how the 2-step create flow is broken down (ticket first, then attachments), and the soft-removal modal requiring a reason matches what's in the API spec so nothing's out of sync there. Approving, good to merge into lab2-staging."*
- **Author Response (@Pilaiwan3492):**  
  > *"@Apichaya251400 Thank for ur comment !!!!"*

#### PR #36: docs planned test strategy for requester mvp
- **Reviewer Comment (@Apichaya251400):**  
  > *"Great work ! The planned test strategy in `docs/lab-02/tests.md` is clean, well-structured, and covers all the required test levels and key workflows.*  
  > *Everything looks clear and traceable, and the [Pending] status is appropriate for the planning stage. Approved and ready to merge into lab2-staging! LGTM"*
- **Author Response (@Pilaiwan3492):**  
  > *"Thank!!!! @Apichaya251400"*

#### PR #37: feat update prisma schema and run migrations
- **Reviewer Comment (@Apichaya251400):**  
  > *"Excellent work ! The Prisma schema and migration are clean, well-structured, and fully aligned with the Lab 2 requirements.*  
  > *The entity coverage, enums, foreign key relationships, composite indexes, and soft-removal fields are all implemented correctly. The migration also looks consistent with the schema and previous specifications.*  
  > *Approved and ready to merge into lab2-staging! LGTM"*
- **Author Response (@Pilaiwan3492):**  
  > *"Thank!!!! @Apichaya251400"*

#### PR #38: feat seed initial data for categories requesters and related systems
- **Reviewer Comment (@Apichaya251400 - Changes Requested):**  
  > *"The `upsert` logic in `seed.ts` is super clean and works well idempotently!*  
  > *I took a quick look at **Labsheet 2 (Page 6, Section 5.3)** and noticed a couple of minor details that still need to be added:*  
  > *1. **Requesters:** The labsheet asks for at least 4 active users + 1 inactive user (`isActive: false`) for testing the dropdown filter. We currently have 3 active users, so could you add a 4th active user and 1 inactive user?*  
  > *2. **Related Systems:** The labsheet specifies at least 6 systems. You currently have 5, so could you add one more?*  
  > *Once these are added, it should be good to go!"*
- **Author Response (@Pilaiwan3492):**  
  > *"Thanks for the review! I've updated `seed.ts`:*  
  > *- Fixed `isActive` logic for requesters (Eve is now set to inactive properly).*  
  > *- Added `update: { isActive: true }` for categories.*  
  > *- Confirmed total data counts (4 active + 1 inactive users, 6 related systems).*  
  > *Could you please check it again when you have time?"*
- **Reviewer Approval (@Apichaya251400):**  
  > *"Thank you so much for the quick updates! I re-checked `server/prisma/seed.ts` against **Section 5.3 of the Lab 2 Labsheet**:*  
  > *✅ **Categories:** 4 required categories seeded using `upsert`.*  
  > *✅ **Requesters:** 4 active requesters (`Alice`, `Bob`, `Charlie`, `David`) + 1 inactive requester (`Eve` with `isActive: false`).*  
  > *✅ **Related Systems:** 6 systems seeded using `upsert`.*  
  > *✅ **Idempotency & Teardown:** Script uses `upsert` cleanly and properly closes the Prisma connection in `finally()`.*  
  > *Everything strictly satisfies the Lab 2 seed requirements. Approved and ready to merge into `lab2-staging`! LGTM"*

#### PR #39: feat implement requester selector UI and context persistence
- **Reviewer Comment (@Apichaya251400):**  
  > *"I checked the changes against **Section 8.1 of the Lab 2 Labsheet**:*  
  > *✅ **Context Persistence:** Properly stores the active requester in `localStorage` under `toktickit_selected_requester`.*  
  > *✅ **Active Filtering:** Fetches active users via `GET /api/v1/requesters/active` with `isActive: true` filtering.*  
  > *✅ **UX & State Management:** Handles loading spinner, error states with retry, and includes the "Authentication coming in Lab 3" notice.*  
  > *✅ **Header Integration:** Renders current requester identity with working `Change Requester` action.*  
  > *✅ **Zen Green Theme:** Perfectly uses brand colors (`#006B3C`, `#EAF6EF`, `#F5F7F6`).*  
  > *Everything looks great and fully satisfies the Section 8.1 requirements. Approved and ready to merge into `lab2-staging`! LGTM"*
- **Author Response (@Pilaiwan3492):**  
  > *"Thank for your comment!!!! @Apichaya251400"*

#### PR #40: feat implement backend ticket ownership guard and requester context validation
- **Reviewer Comment (@Apichaya251400):**  
  > *"Everything looks good! Just noticed that the non-owner ticket response should be 404 instead of 403, and the API spec uses X-Requester-Id as the primary requester context. Just wanted to point that out!"*
- **Author Response (@Pilaiwan3492):**  
  > *"Thanks for the review! I checked the latest Lab 2 specification again.*  
  > *1. Non-owner Ticket Detail should return 403 Forbidden, not 404. The Lab 2 ownership rule explicitly requires 403 when the ticket belongs to another Requester.*  
  > *2. Lab 2 uses `requesterId` as the requester context. For Ticket Detail, it is provided as a query parameter (`?requesterId=...`), not `X-Requester-Id`.*  
  > *So the current implementation follows the Lab 2 contract."*
- **Reviewer Approval (@Apichaya251400):**  
  > *"my bad! Please ignore my previous comment. I re-checked our official Lab 2 handout and testing guidelines again:*  
  > *- `requesterId` in query/body parameter (`?requesterId=1`) is 100% correct.*  
  > *- Returning `403 Forbidden` for non-owner ticket access is 100% correct.*  
  > *Your original implementation in PR #40 was completely right all along! No changes needed at all. Approved and ready to merge into `lab2-staging`! Sorry for the confusion and great job!"*

#### PR #41: feat implement create ticket feature with validation and test cases
- **Reviewer Comment (@Apichaya251400):**  
  > *"The changes look good. The `/api/v1/categories` and `/api/v1/related-systems` reference endpoints are implemented correctly, and the ID validation has been refined appropriately. The Create Ticket form now loads categories and related systems dynamically from PostgreSQL, and the reference error handling is solid. All Vitest tests pass. Approved and ready to merge into lab2-staging. LGTM!"*
- **Author Comment (@Pilaiwan3492):**  
  > *"Hey @Apichaya251400 ! I have fixed some bugs in Issue 13 and updated the code:*  
  > *Quick summary: Backend: Added active categories/systems endpoints & integer ID validation. Frontend: Fixed router setup and wired up useRequester context. Mind giving it another review? Thanks!"*

#### PR #42: feat implement my tickets list with search, filter, sort, and pagination
- **Reviewer Comment (@Apichaya251400):**  
  > *"Outstanding implementation of the My Tickets page, search, filtering, sorting, and pagination. Approved and ready to merge into `lab2-staging`! LGTM"*
- **Author Response (@Pilaiwan3492):**  
  > *"Thank you! Merging into lab2-staging."*

#### PR #43: feat implement ticket detail read-only view and UI refactoring
- **Reviewer Comment (@Apichaya251400):**  
  > *"Approved and ready to merge into `lab2-staging`! LGTM"*
- **Author Response (@Pilaiwan3492):**  
  > *"Merged into lab2-staging."*

#### PR #44: feat implement attachment upload and validation for tickets
- **Reviewer Comment (@Apichaya251400):**  
  > *"Everything looks good and aligns with the Lab 2 requirements. Approved! LGTM"*
- **Author Response (@Pilaiwan3492):**  
  > *"Merged into lab2-staging."*

#### PR #45: feat implement attachment download, soft removal, and confirmation modal
- **Reviewer Comment (@Apichaya251400):**  
  > *"Great work on PR 17! Everything looks good and aligns with the Lab 2 requirements. The attachment download, soft removal, confirmation modal, and tests all look solid. Approved! LGTM"*
- **Author Response (@Pilaiwan3492):**  
  > *"Merged into lab2-staging."*

#### PR #46: test restructure test suites and finalize test evidence
- **Reviewer Comment (@Apichaya251400):**  
  > *"LGTM. Good to merge into lab2-staging!"*  
  > *(Feedback on code review: 1) ใน `my-tickets.api.test.ts` แนะนำเพิ่ม assertion ลำดับ Priority และ Deterministic Secondary Sorting `id_desc` ให้ AC-11 มีหลักฐานจริง 2) เปลี่ยน `if (...) return` ใน test เป็น assertion เพื่อป้องกัน False Positive)*
- **Author Response (@Pilaiwan3492):**  
  > *"Updated `my-tickets.api.test.ts` with Priority rank assertions (`LOW <= MEDIUM <= HIGH` and `HIGH >= MEDIUM >= LOW`), added test for secondary sorting `id_desc`, and replaced all `if return` with hard assertions. All 96 tests passing with 100% pass rate!"*

#### PR #47: PR 19 : Peer Review & Submission Package (docs)
- **Scope:** Complete submission package documentation, peer review records, AI reflection, updated setup instructions, and 96 automated tests evidence.
- **Reviewer Status (@Apichaya251400):** Ready for merge into `lab2-staging`.
- **Author Notes (@Pilaiwan3492):** Synchronized all review records from both repositories. 100% test suite passing (62 server + 34 client).

---

## 2. Pull Requests I Reviewed for My Partner (@Apichaya251400)

**Repository:** [https://github.com/Apichaya251400/TokTickIT](https://github.com/Apichaya251400/TokTickIT)

| PR | Feature Branch | Scope Reviewed | Verdict |
| :---: | :--- | :--- | :---: |
| [#21](https://github.com/Apichaya251400/TokTickIT/pull/21) | `feat/issue-20-reference-data` | feat(db): extend Prisma models and reference data | Approved |
| [#22](https://github.com/Apichaya251400/TokTickIT/pull/22) | `docs/lab-02-contract` | docs(lab-02): finalize engineering contract | Approved |
| [#24](https://github.com/Apichaya251400/TokTickIT/pull/24) | `feat/issue-23-ticket-creation` | feat(lab-02): implement requester context and ticket creation | Approved |
| [#31](https://github.com/Apichaya251400/TokTickIT/pull/31) | `feat/issue-25-ticket-detail` | feat(lab-02): implement ticket detail ownership protection | Approved |
| [#32](https://github.com/Apichaya251400/TokTickIT/pull/32) | `feat/issue-26-attachments` | feat(lab-02): implement attachment lifecycle | Approved |
| [#33](https://github.com/Apichaya251400/TokTickIT/pull/33) | `feat/issue-27-my-tickets` | feat(lab-02): implement my tickets API | Approved |
| [#35](https://github.com/Apichaya251400/TokTickIT/pull/35) | `feat/issue-34-requester-selector` | feat(lab-02): implement requester selection and context | Approved |
| [#36](https://github.com/Apichaya251400/TokTickIT/pull/36) | `feat/issue-28-create-ticket-ui` | feat(lab-02): implement Create Ticket requester UI | Approved |
| [#37](https://github.com/Apichaya251400/TokTickIT/pull/37) | `feat/issue-29-my-tickets-ticket-detail-ui` | feat(lab-02): implement my tickets and ticket detail UI | Approved |
| [#38](https://github.com/Apichaya251400/TokTickIT/pull/38) | `feat/issue-30-e2e-requester-workflow` | test(lab-02): add requester E2E workflow | Approved |
| [#40](https://github.com/Apichaya251400/TokTickIT/pull/40) | `fix/issue-31-ui-background` | fix(lab-02): align global page background with UI spec | Approved |

---

### Detailed Review Dialogue on Partner's PRs

#### Partner PR #21: feat(db): extend Prisma models and reference data
- **My Review Comment (@Pilaiwan3492):**  
  > *"Looks good overall! The Prisma schema, migration, seed data, reference APIs, and tests cover the requirements of Issue #20."*
- **Partner's Response (@Apichaya251400):**  
  > *"@Pilaiwan3492 Thx kha"*

#### Partner PR #22: docs(lab-02): finalize engineering contract
- **My Review Comment (@Pilaiwan3492):**  
  > *"The documentation looks good and covers the main Lab 2 requirements.*  
  > *I only have a few small things that could be clarified before merging:*  
  > *- Clarify how duplicate ticket submissions are detected.*  
  > *- Add an example request body for `removalReason` in the attachment delete API.*  
  > *- Make sure the required seed data includes at least 4 active Requesters and 1 inactive Requester.*  
  > *- Check the E2E test mapping so that each Acceptance Criterion is linked to the appropriate test.*  
  > *Other than these points, the overall structure and coverage look good."*
- **Partner's Response (@Apichaya251400):**  
  > *"Thanks for the feedback! I’ve addressed all four points, updated the documentation, and pushed the changes. Could you take another look when you have time?"*
- **My Follow-up Comment (@Pilaiwan3492):**  
  > *"A few small updates are needed :*  
  > *- `docs/lab-02/tests.md` — Add a Final Status column to the planned test table.*  
  > *- `docs/lab-02/tests.md` — Add Final Results and Known Limitations / Deferred Tests sections.*  
  > *- `docs/lab-02/specification.md` — Add a business rule explaining that the Lab 2 requester selection is temporary and will be replaced by real authentication in Lab 3.*  
  > *After these updates, it should be good to go!"*
- **Partner's Response (@Apichaya251400):**  
  > *"Thanks for the feedback! I’ve made all the suggested updates and did a final check across the four docs. Everything should be good to go now!🥹"*
- **My Final Approval (@Pilaiwan3492):**  
  > *"Everything looks good and matches the main Lab 2 requirements. The API, UI, and test specifications are clear and well organized. Good job! Approved."*
- **Partner's Response (@Apichaya251400):**  
  > *"THX NAAAA"*

#### Partner PR #24: feat(lab-02): implement requester context and ticket creation
- **My Review Comment (@Pilaiwan3492):**  
  > *"The ticket creation flow and tests look good overall.*  
  > *- One thing to address is ticket number uniqueness: using `prisma.ticket.count() + 1` can generate the same ticket number when different requests are created concurrently.*  
  > *- Please consider a database-safe unique sequence/constraint so BR-01 is guaranteed."*
- **Partner's Response (@Apichaya251400):**  
  > *"Thanks for pointing this out! I’ve replaced the `count() + 1` approach with a PostgreSQL atomic sequence and added a concurrency test to make sure ticket numbers stay unique when requests are created at the same time.*  
  > *All tests are passing (28/28), and the migration has been applied successfully. THANK YOU TOO MUCH SO MUCH VERY MUCH~"*
- **My Final Approval (@Pilaiwan3492):**  
  > *"Looks good overall. Approve!!!"*

#### Partner PR #31: feat(lab-02): implement ticket detail ownership protection
- **My Review Comment (@Pilaiwan3492):**  
  > *"The implementation is consistent with the Lab 2 requirements and the related tests look appropriate. Approve!"*

#### Partner PR #32: feat(lab-02): implement attachment lifecycle
- **My Review Comment (@Pilaiwan3492 - Changes Requested):**  
  > *"Changes requested:*  
  > *1. `server/src/routes/ticket.routes.ts` — multipart field name is not validated:*  
  > *- The API contract requires the uploaded file to be sent using the `file` form field.*  
  > *- Please reject multipart parts using other field names and add a test for this case.*  
  > *2. `server/src/routes/ticket.routes.ts` — missing attachment file returns HTTP 200 with zero-filled data:*  
  > *- If the DB record exists but the physical file is missing, this is not a successful download.*  
  > *- Please return an appropriate server error instead of 200 with `Buffer.alloc(...)`, and add a regression test.*  
  > *🟢 Everything else looks good."*
- **Partner's Response (@Apichaya251400):**  
  > *"Fixed both review comments and added regression tests. All 57 tests are passing. Ready for re-review."*
- **My Final Approval (@Pilaiwan3492):**  
  > *"The attachment lifecycle implementation and related tests look consistent with the Lab 2 requirements. Approve!!!!"*

#### Partner PR #33: feat(lab-02): implement my tickets API
- **My Review Comment (@Pilaiwan3492):**  
  > *"No changes requested!!!!!*  
  > *The My Tickets API implementation is consistent with the Lab 2 requirements and the current `api-spec.md`.*  
  > *- Requester validation and ownership scoping are implemented correctly.*  
  > *- Search, filtering, sorting, and pagination are supported as specified.*  
  > *- Priority severity sorting and deterministic `id` DESC secondary sorting are handled correctly.*  
  > *- The API tests cover the main required behaviors and edge cases."*

#### Partner PR #35: feat(lab-02): implement requester selection and context
- **My Review Comment (@Pilaiwan3492 - Changes Requested):**  
  > *"Changes requested:*  
  > *1. `client/src/App.tsx` — `loadTicketsForRequester(requesterId)` does not use the provided requester ID:*  
  > *- The function receives `requesterId` but `fetchMyTickets()` reads the requester context separately from LocalStorage.*  
  > *- Please make the requester context explicit in the ticket-loading flow so the selected requester is the one being reloaded.*  
  > *2. `client/src/App.tsx` — Application Shell navigation is incomplete:*  
  > *- The Lab 2 UI specification requires My Tickets and Create Ticket navigation tabs with an active-page indicator.*  
  > *- Please add the required navigation, or confirm that this part is intentionally implemented in a separate PR.*  
  > *The requester selection, LocalStorage context, requester switching, loading state, and related tests otherwise look good."*
- **Partner's Response (@Apichaya251400):**  
  > *"Thanks for the feedback! I’ve fixed both comments and also added a regression test for the requester-switching race condition.*  
  > *The changes are in `c0099ec`, with all tests passing (15/15 client, 71/71 server).*  
  > *Could you please take another look when you have time?"*
- **My Final Approval (@Pilaiwan3492):**  
  > *"The implementation is consistent with the Lab 2 requirements for Development Requester Selection, requester context, LocalStorage persistence, requester-specific ticket refresh, application shell navigation, and related UI states.*  
  > *The related client tests also cover the main requester-selection and switching scenarios. Approve!!!"*

#### Partner PR #36: feat(lab-02): implement Create Ticket requester UI
- **My Review Comment (@Pilaiwan3492 - Changes Requested):**  
  > *"Changes requested:*  
  > *1. `client/src/App.tsx` — Attachment upload failure retry can create a duplicate ticket.*  
  > *- After ticket creation succeeds but attachment upload fails, submitting again calls `createTicket()` again.*  
  > *- Lab 2 BR-18 requires keeping the created ticket and allowing attachment retry without creating another ticket.*  
  > *- Please retain the created ticket ID and retry `uploadAttachment()` for that existing ticket (or continue to Ticket Detail for retry).*  
  > *2. `client/src/App.tsx` — Remove the hard-coded ticket number fallback.*  
  > *- 'TKT-2026-000001' must not be generated/displayed by the client.*  
  > *- Lab 2 requires the backend to generate the unique `ticketNumber`.*  
  > *- Please treat a missing ticketNumber in a successful response as an invalid response instead of using a fake fallback.*  
  > *Fighting!!!!"*
- **Partner's Response (@Apichaya251400):**  
  > *"Thanks for the review! I’ve fixed both issues.*  
  > *Attachment retry now keeps the created ticket ID and retries the upload without creating a duplicate ticket.*  
  > *Removed the hard-coded ticket number fallback. The client now requires the backend-generated ticketNumber and shows an error if it’s missing.*  
  > *I also added regression tests for both cases, and all tests, typecheck, and build are passing. Fix commit: `06d11ce`"*
- **My Second Review Comment (@Pilaiwan3492 - Changes Requested):**  
  > *"The two previous issues are fixed: duplicate Ticket creation on attachment retry is prevented, and the hard-coded Ticket Number fallback has been removed.*  
  > *Very Good. But i found 'Retry'. This might mean the successfully uploaded attachment was repeated.*  
  > *Changes requested:*  
  > *1. `client/src/App.tsx` — Attachment retry can re-upload files that already succeeded.*  
  > *- If multiple attachments are selected and only some uploads fail, the current retry loops through all selectedFiles again.*  
  > *- This can create duplicate attachment records for files that were already uploaded successfully.*  
  > *- Please retain the failed/pending attachments separately and retry only those files.*  
  > *Everything else looks good and is consistent with the Lab 2 requirements."*
- **Partner's Response (@Apichaya251400):**  
  > *"Thanks for the review! I’ve fixed the attachment retry issue.*  
  > *Each attachment now keeps its own upload status, and Retry only retries the failed/pending attachments. Successfully uploaded attachments will not be uploaded again when only some uploads fail.*  
  > *I also added regression tests for partial attachment upload failures, retrying only failed attachments, and duplicate filenames being tracked independently.*  
  > *Verification: Create Ticket tests: 23/23 passed, Full client tests: 38/38 passed, TypeScript: 0 errors, Production build: passed. Fix commit: `5b62229`"*
- **My Third Review Comment (@Pilaiwan3492 - Changes Requested):**  
  > *"Changes requested:*  
  > *1. `client/src/App.tsx` — Reference data loading/error state is not rendered.*  
  > *- `refDataLoading` and `refDataError` are set but never displayed in the Create Ticket UI.*  
  > *- Lab 2 requires a visible loading state while fetching Category/Related System and a safe failure state if the request fails.*  
  > *- Please render the loading/error feedback and prevent submission while reference data is unavailable.*  
  > *2. `client/src/App.tsx` — Success state is missing the required next action.*  
  > *- After successful ticket creation, the UI only shows the success banner.*  
  > *- Lab 2 UI Spec requires [View Ticket Detail] or [Create Another Ticket].*  
  > *- Please add at least one of these actions.*  
  > *3. `client/src/App.tsx` — Create Ticket retry state is not cleared when changing Requester.*  
  > *- `retainedCreatedTicket` and `attachmentItems` can remain from the previous requester.*  
  > *- Switching Requester after an attachment failure can cause the new requester to retry the previous requester's ticket.*  
  > *- Please clear the retained ticket and attachment retry state when changing Requester.*  
  > *4. `client/src/App.tsx` — Missing 'Development Mode - Testing Context Only' badge.*  
  > *- Lab 2 requires the current requester identity to be clearly labeled as a testing context, not authentication.*  
  > *- Please add the required badge to the Application Shell."*
- **My Final Approval (@Pilaiwan3492):**  
  > *"Looks good!*  
  > *I rechecked the latest changes against the Lab 2 requirements. The 4 requested issues have been fixed, and I didn’t find any other MUST FIX issues.*  
  > *Reference data loading/error state ✅*  
  > *Success action added ✅*  
  > *Requester change clears previous retry state ✅*  
  > *Development Mode testing context badge added ✅*  
  > *Everything looks good now. Nice work!!!!"*

#### Partner PR #37: feat(lab-02): implement my tickets and ticket detail UI
- **My Review Approval (@Pilaiwan3492):**  
  > *"I rechecked the latest PR against the Lab 2 requirements. My Tickets, Ticket Detail, requester isolation, filtering/sorting/pagination, attachment download/removal, and the related tests all look good. Good to go! 🔥🔥🔥"*

#### Partner PR #38: test(lab-02): add requester E2E workflow
- **My First Review Comment (@Pilaiwan3492 - Changes Requested):**  
  > *"Changes requested:*  
  > *1. `e2e/lab-02/requester-ticket-flow.spec.ts` — AC-06 should test combined filtering*  
  > *- Current test only filters by Category.*  
  > *- Please add Related System + Priority + Status filters and verify the result.*  
  > *2. `e2e/lab-02/requester-ticket-flow.spec.ts` — AC-03 non-owner access is not fully tested*  
  > *- Switching to Bob and checking that Alice's ticket is not listed is not enough.*  
  > *- Please open Alice's ticket detail as Bob and verify the 404 / 'Ticket not found' state.*  
  > *3. `e2e/lab-02/requester-ticket-flow.spec.ts` — active attachment download is only checked for button visibility*  
  > *- Please actually trigger the Download action and verify that the file is downloaded.*  
  > *Everything else looks good."*
- **Partner's Response (@Apichaya251400):**  
  > *"Thanks for the review! I’ve fixed all 3 comments: AC-06 now checks the combined Category + Related System + Priority + Status filters; AC-03 now opens the actual ticket detail as Bob and verifies the 404 / 'Ticket not found' state; The attachment test now triggers the actual download and verifies the downloaded filename. Reran Playwright tests on desktop and mobile, 2/2 passed. Pushed in `23a46ea`."*
- **My Second Review Comment (@Pilaiwan3492 - Changes Requested):**  
  > *"Changes requested:*  
  > *1. `e2e/lab-02/requester-ticket-flow.spec.ts` — AC-03 UI non-owner test:*  
  > *- The API 404 check is correct, but the UI test currently accesses React internals via `__reactFiber$` and `hook.queue.dispatch()`.*  
  > *- Please test the non-owner Ticket Detail through the actual UI/routing flow instead, then verify that 'Ticket not found.' is displayed.*  
  > *🟢 AC-06 combined filtering and the active attachment download test are fixed and look good. Everything else looks good!"*
- **Technical Architecture Discussion:**  
  > **@Apichaya251400:** *"Thanks for the clarification! I removed the React internal state manipulation and tried to implement the AC-03 check using normal browser routing with the actual ticket UUID. However, I found an architecture limitation in the current Lab 2 implementation: Ticket Detail is controlled by the in-memory `selectedTicketId` state in App.tsx, and the application does not currently implement client-side URL routing. Therefore, navigating to `/tickets/<ticketUuid>` reloads the SPA without selecting the ticket. Since Bob cannot see Alice's ticket in My Tickets, there is no user-facing View Details action for Bob to open Alice's ticket. The backend ownership check is working correctly and returns 404. Should we keep the API 404 assertion and note the UI limitation, or treat URL-based routing as a separate production-scope change?"*  
  > **@Pilaiwan3492:** *"Yeah, I agree! I think adding routing just for this test might be unnecessary since Lab 2 doesn’t require it. Let’s avoid React internals and extra production changes if possible. If there’s no clean way to test the UI state with the current flow, I think we can keep the API 404 test and mention the UI limitation."*
- **My Final Approval (@Pilaiwan3492):**  
  > *"Thanks for the clarification. The API 404 test covers the ownership requirement, and the UI limitation is noted. Good to go!"*

#### Partner PR #40: fix(lab-02): align global page background with UI spec
- **My Review Approval (@Pilaiwan3492):**  
  > *"Looks good! The scope is clean with no unnecessary changes. Good to go!"*

