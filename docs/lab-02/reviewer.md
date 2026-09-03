# Lab 2 — Peer Review Record

**Author:** Pilaiwan Churdchu — 67070503492 — GitHub: [@Pilaiwan3492](https://github.com/Pilaiwan3492)  
**Peer Reviewer:** Aphichaya Klinhual — 67070503447 — GitHub: [@Apichaya251400](https://github.com/Apichaya251400)  
**Repository:** [https://github.com/Pilaiwan3492/TokTickIT](https://github.com/Pilaiwan3492/TokTickIT)  
**Target Release:** `lab2-staging` → `main`

---

## 1. Pull Requests I Authored (Reviewed by Peer Reviewer)

| PR | Feature Branch | Issue Scope | Reviewer Verdict |
| :---: | :--- | :--- | :---: |
| [#33](https://github.com/Pilaiwan3492/TokTickIT/pull/33) | `feature/5-create-specification-doc` | ISSUE 5: Sprint 2 Engineering Specification (`specification.md`) | Approved |
| [#34](https://github.com/Pilaiwan3492/TokTickIT/pull/34) | `feature/6-api-spec-docs` | ISSUE 6: REST API Specification (`api-spec.md`) | Approved |
| [#35](https://github.com/Pilaiwan3492/TokTickIT/pull/35) | `feature/7-ui-spec-docs` | ISSUE 7: Zen Green UI Specification (`ui-spec.md`) | Approved |
| [#36](https://github.com/Pilaiwan3492/TokTickIT/pull/36) | `feature/8-planned-test-strategy` | ISSUE 8: Test Strategy & AC Traceability (`tests.md`) | Approved |
| [#37](https://github.com/Pilaiwan3492/TokTickIT/pull/37) | `feature/9-prisma-schema` | ISSUE 9: Prisma Schema & PostgreSQL Migrations | Approved |
| [#38](https://github.com/Pilaiwan3492/TokTickIT/pull/38) | `feature/10-seed-data` | ISSUE 10: Idempotent Seed Data (Requesters, Categories, Systems) | Approved |
| [#39](https://github.com/Pilaiwan3492/TokTickIT/pull/39) | `feature/11-requester-selector-ui` | ISSUE 11: Development Requester Context & Selector Screen | Approved |
| [#40](https://github.com/Pilaiwan3492/TokTickIT/pull/40) | `feature/12-ticket-ownership-guard` | ISSUE 12: Ticket Ownership Guard Middleware (HTTP 403) | Approved |
| [#41](https://github.com/Pilaiwan3492/TokTickIT/pull/41) | `feature/13-create-ticket-feature` | ISSUE 13: Create Ticket Form with Live Counters & Validation | Approved |
| [#42](https://github.com/Pilaiwan3492/TokTickIT/pull/42) | `feature/14-my-ticket-page` | ISSUE 14: My Tickets Page with Search, Filtering & Pagination | Approved |
| [#43](https://github.com/Pilaiwan3492/TokTickIT/pull/43) | `feature/15-ticket-detail` | ISSUE 15: Read-Only Ticket Detail Screen | Approved |
| [#44](https://github.com/Pilaiwan3492/TokTickIT/pull/44) | `feature/16-attachment-upload` | ISSUE 16: Attachment Upload & 5-File Limit Validation | Approved |
| [#45](https://github.com/Pilaiwan3492/TokTickIT/pull/45) | `feature/17-attachment-soft-removal` | ISSUE 17: Attachment Soft Removal & Mandatory Reason | Approved |
| [#46](https://github.com/Pilaiwan3492/TokTickIT/pull/46) | `feature/18-test-suite-evidence` | ISSUE 18: Full Test Suite Re-alignment & Evidence | Approved |

---

## 2. Review Comments Received & Actions Taken

### Issue 13 — Create Ticket Form (#41)
- **Reviewer Comment Received:**  
  *"Form looks great with Zen Green styling, but when creating a ticket with summary less than 5 characters or description less than 10 characters, does the frontend block submission immediately before calling the API?"*
- **How I Responded:**  
  *Added client-side validation logic in `CreateTicket.tsx` checking `trimmedSummary.length >= 5` and `trimmedDescription.length >= 10`. Form now displays inline field error messages and prevents API submission immediately.*

### Issue 16 — Attachment Upload & Validation (#44)
- **Reviewer Comment Received:**  
  *"Make sure that when a user selects a file over 5 MB or an invalid type like .exe, the dropzone displays an immediate warning and doesn't submit a broken request to the backend."*
- **How I Responded:**  
  *Added pre-upload file inspection in `AttachmentDropzone` and `CreateTicket.tsx` that checks MIME type and `file.size <= 5242880` bytes. Shows instant error alert banner and excludes invalid files from being uploaded.*

### Issue 17 — Attachment Soft Removal (#45)
- **Reviewer Comment Received:**  
  *"The soft-removal confirmation modal should enforce that the removal reason cannot be blank or just spaces, otherwise someone could bypass the mandatory reason rule."*
- **How I Responded:**  
  *Updated `TicketDetail.tsx` and `attachment.controller.ts` to require `removalReason.trim().length >= 3 && <= 255`. If empty or shorter than 3 characters, the modal displays a validation error and the DELETE request is rejected.*

### Issue 18 — Test Suite Re-alignment & Evidence (#46)
- **Reviewer Comment Received:**  
  *"1) ใน `my-tickets.api.test.ts` เทสต์ priority sorting ตอนนี้เช็กแค่ status 200 กับ array แต่ยังไม่ได้ assert ลำดับจริง (LOW <= MEDIUM <= HIGH) ค่ะ และ secondary sorting `id_desc` ยังไม่มีเทสต์ตรง ๆ เพื่อยืนยันตาม AC-11  
  2) เปลี่ยน `if (...) return` ในเทสต์ให้เป็น assertion (เช่น `expect(...).not.toBeNull()`) ทั้งหมด เพื่อป้องกันไม่ให้เทสต์ผ่านแบบ False Positive เมื่อไม่มีข้อมูลค่ะ"*
- **How I Responded:**  
  *1) อัปเดต `my-tickets.api.test.ts` โดยเพิ่ม Priority Ranking assertion ตรวจสอบว่าลำดับ `LOW <= MEDIUM <= HIGH` (สำหรับ `priority_asc`) และ `HIGH >= MEDIUM >= LOW` (สำหรับ `priority_desc`) เรียงถูกต้องจริง พร้อมทั้งเพิ่มเทสต์ทดสอบ Deterministic Secondary Sorting `id_desc` โดยจำลองตั๋ว 2 ใบที่มี `createdAt` ตรงกันแล้ว assert ว่าตั๋วที่มีค่า `id` มากกว่าจะถูกเรียงขึ้นมาก่อน  
  2) ลบ `if (...) return;` ออกจากทุกไฟล์ทดสอบ แล้วเปลี่ยนเป็น `expect(item).not.toBeNull()` พร้อม seed ข้อมูลใน `beforeAll` เพื่อป้องกัน False Positive 100%*

---

## 3. Pull Requests I Reviewed for My Partner

| Partner's PR | Scope Reviewed | My Review Comment | Partner's Response |
| :---: | :--- | :--- | :--- |
| **#33** | Sprint 2 Engineering Specification | All 11 required sections are well-structured. Scope clearly excludes Lab 3 authentication and IT staff workflows. Acceptance Criteria follow Given-When-Then format. Approve ✅ | Thank you! Document finalized. |
| **#34** | REST API Specification | Endpoint parameters, status codes (200, 201, 400, 403, 404, 409, 413, 415), and error schemas are comprehensive. Approve ✅ | - |
| **#35** | Zen Green UI Specification | Color tokens match `#006B3C`, `#0B7A46`, and `#EAF6EF`. Responsive layout requirements for Desktop, Tablet, and Mobile are clearly defined. Approve ✅ | - |
| **#36** | Planned Test Strategy | Matrix covers AC-01 through AC-20. Test levels (Unit, API, UI, Responsive) are mapped to actual test file paths. Approve ✅ | - |
| **#37** | Prisma Schema & Migrations | Schema includes `RequesterUser`, `Category`, `RelatedSystem`, `Ticket`, and `Attachment` with correct cascade rules and indexes. Approve ✅ | - |
| **#38** | Seed Data | Idempotent upserts for 4 categories, 6 related systems, and active/inactive requesters verified. Safe to run repeatedly. Approve ✅ | - |
| **#39** | Requester Selector UI | Dropdown properly excludes inactive requesters and stores selection in `localStorage`. Context provider wraps application cleanly. Approve ✅ | - |
| **#40** | Ownership Guard Middleware | Verified that cross-requester access returns HTTP 403 Forbidden without leaking resource data. Approve ✅ | - |
| **#41** | Create Ticket Screen | Form validation, character counter (0/150 and 0/2000), and busy button state on submit work properly. Approve ✅ | Added live validation feedback. |
| **#42** | My Tickets Screen | Filter by category/priority/status, search with debounce, pagination, and ownership scoping are verified. Approve ✅ | - |
| **#43** | Ticket Detail Screen | Read-only presentation with soft gray-green styling clearly distinguishes it from editable forms. Back navigation works properly. Approve ✅ | - |
| **#44** | Attachment Upload Feature | Multer storage, allowed MIME types, 5 MB size limit, and max 5 active attachments limit enforced. Approve ✅ | - |
| **#45** | Attachment Soft Removal | Verified that removed files cannot be downloaded (404), metadata is preserved, and removal reason is required. Approve ✅ | Added confirmation modal validation. |
| **#46** | Test Evidence & Suite Run | All 96 tests passing. Added explicit sorting and secondary sorting assertions. 0 tests skipped. Approve ✅ | All tests verified. |
