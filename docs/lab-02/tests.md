# Lab 2 Test Plan and Results

## 1. Test Strategy

This document defines the comprehensive Test Plan and Execution Evidence for the **TokTickIT Requester Ticketing MVP (Lab 2)** in accordance with the Lab 2 Handout (Sections 9, 12, 14 Part 3, and 16 Appendix B). The test strategy employs Test-Driven Development (TDD) and Spec-Driven Development (Spec DD) to guarantee that every business rule and acceptance criterion is verified by automated tests.

### Test Levels
- **Unit & Logic Testing**: Verifies utility functions such as unique ticket number generation (`TKT-YYYY-XXXXXX`) and file validation constraints (allowed MIME types, max 5 MiB size, path traversal sanitization).
- **API Contract Testing**: Verifies REST endpoints using Supertest and Vitest. Covers HTTP status codes (`200`, `201`, `400`, `403`, `404`, `409`, `413`, `415`, `500`), request payload validation, requester context enforcement, ownership guards, and response schemas.
- **UI Component & Integration Testing**: Verifies React components using React Testing Library and Vitest. Covers user interactions, live character counters, form validation errors, disabled/busy submit button states, modal confirmation dialogs, and responsive layouts across screens.
- **Requester Ownership & Security Testing**: Enforces that resources (tickets, attachments, downloads) belonging to Requester A are strictly inaccessible to Requester B, returning `403 FORBIDDEN` or scoped query filters.
- **Responsive & Visual Inspection**: Ensures responsive behavior at Desktop (≥992px), Tablet (768–991px), and Mobile (<768px) viewports with strict adherence to the Zen Green Theme palette.

---

## 2. Planned Tests

| Test ID | Level | AC / BR Ref | What It Tests (Description) | Expected Result | Automated Test File | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **API-01** | API | AC-01, BR-01, BR-02 | Create a valid ticket with summary, description, category, and related system | HTTP 201 Created; returns unique `TKT-YYYY-XXXXXX` ticket number and status `NEW` | `server/tests/lab-02/create-ticket.api.test.ts` | `Pass` |
| **API-02** | API | AC-01, BR-05 | Create ticket with missing or invalid fields (summary < 5 chars, desc < 10 chars) | HTTP 400 Bad Request with field-level validation errors | `server/tests/lab-02/create-ticket.api.test.ts` | `Pass` |
| **API-03** | API | AC-02, BR-03, BR-04 | Ticket creation without valid requesterId | HTTP 400 Bad Request with `INVALID_REFERENCE` error code | `server/tests/lab-02/create-ticket.api.test.ts` | `Pass` |
| **API-04** | API | AC-06, BR-04 | Retrieve paginated tickets list scoped to the selected Requester | HTTP 200 OK; returns array of owned tickets and pagination metadata (`meta`) | `server/tests/lab-02/my-tickets.api.test.ts` | `Pass` |
| **API-05** | API | AC-06, BR-04 | Filter tickets by search query across ticketNo, summary, and description | HTTP 200 OK; returns only matching records owned by requester | `server/tests/lab-02/my-tickets.api.test.ts` | `Pass` |
| **API-06** | API | AC-06, BR-04 | Filter tickets by category and requested priority | HTTP 200 OK; returns filtered subset matching criteria | `server/tests/lab-02/my-tickets.api.test.ts` | `Pass` |
| **API-07** | API | AC-10, BR-04 | Pagination parameters (`page`, `limit` = 10, 20, 50) and page bounds | HTTP 200 OK; returns requested page; empty array if page exceeds totalPages | `server/tests/lab-02/my-tickets.api.test.ts` | `Pass` |
| **API-08** | API | AC-14, BR-04 | Invalid query parameters (status != NEW, search > 100 chars, limit != 10/20/50) | HTTP 400 Bad Request with `INVALID_QUERY` error code | `server/tests/lab-02/my-tickets.api.test.ts` | `Pass` |
| **API-09** | API | AC-01, BR-04 | Retrieve single owned ticket detail by UUID | HTTP 200 OK; returns complete ticket detail with category, relatedSystem, and attachments | `server/tests/lab-02/ticket-detail.api.test.ts` | `Pass` |
| **API-10** | API | AC-03, BR-04 | Requester B attempts to access Requester A's ticket detail | HTTP 403 Forbidden with `FORBIDDEN` error payload; no data returned | `server/tests/lab-02/ticket-detail.api.test.ts` | `Pass` |
| **API-11** | API | AC-03, BR-04 | Access ticket detail with non-existent UUID | HTTP 404 Not Found with `TICKET_NOT_FOUND` error payload | `server/tests/lab-02/ticket-detail.api.test.ts` | `Pass` |
| **API-12** | API | AC-03, BR-04 | Access ticket detail with invalid non-UUID identifier | HTTP 400 Bad Request with `VALIDATION_ERROR` error code | `server/tests/lab-02/ticket-detail.api.test.ts` | `Pass` |
| **API-13** | API | AC-04, BR-05 | Upload valid attachment (PNG/JPEG/WEBP/PDF <= 5 MiB) to owned ticket | HTTP 201 Created; returns attachment metadata with no internal `filePath` | `server/tests/lab-02/attachments.api.test.ts` | `Pass` |
| **API-14** | API | AC-04, BR-05 | Upload unsupported file extension or MIME type (e.g. `.exe`) | HTTP 415 Unsupported Media Type with `UNSUPPORTED_FILE_TYPE` error code | `server/tests/lab-02/attachments.api.test.ts` | `Pass` |
| **API-15** | API | AC-04, BR-05 | Upload attachment exceeding 5 MiB (5,242,880 bytes) | HTTP 413 Payload Too Large with `FILE_TOO_LARGE` error code | `server/tests/lab-02/attachments.api.test.ts` | `Pass` |
| **API-16** | API | AC-07, BR-06 | Upload 6th active attachment when ticket already has 5 active attachments | HTTP 409 Conflict with `ATTACHMENT_LIMIT_REACHED` error code | `server/tests/lab-02/attachments.api.test.ts` | `Pass` |
| **API-17** | API | AC-03, BR-04 | Upload attachment to a ticket owned by another requester | HTTP 403 Forbidden with `FORBIDDEN` error payload | `server/tests/lab-02/attachments.api.test.ts` | `Pass` |
| **API-18** | API | AC-05, BR-07 | Download active attachment belonging to owned ticket | HTTP 200 OK with correct `Content-Type` and `Content-Disposition` headers | `server/tests/lab-02/attachments.api.test.ts` | `Pass` |
| **API-19** | API | AC-05, BR-07 | Download soft-removed attachment | HTTP 404 Not Found with `ATTACHMENT_NOT_AVAILABLE` error code | `server/tests/lab-02/attachments.api.test.ts` | `Pass` |
| **API-20** | API | AC-16, BR-04 | Download attachment belonging to another requester | HTTP 403 Forbidden with `FORBIDDEN` error code | `server/tests/lab-02/attachments.api.test.ts` | `Pass` |
| **API-21** | API | AC-05, BR-07 | Soft-remove active attachment with valid `removalReason` (3–255 chars) | HTTP 200 OK; sets `removedAt` and `removalReason`; record retained in database | `server/tests/lab-02/attachments.api.test.ts` | `Pass` |
| **API-22** | API | AC-17, BR-07 | Soft-remove attachment with missing, empty, or whitespace-only `removalReason` | HTTP 400 Bad Request with `VALIDATION_ERROR` error code | `server/tests/lab-02/attachments.api.test.ts` | `Pass` |
| **API-23** | API | AC-17, BR-07 | Soft-remove attachment with reason < 3 characters | HTTP 400 Bad Request with `VALIDATION_ERROR` error code | `server/tests/lab-02/attachments.api.test.ts` | `Pass` |
| **API-24** | API | AC-05, BR-07 | Soft-remove already removed attachment | HTTP 409 Conflict with `ATTACHMENT_ALREADY_REMOVED` error code | `server/tests/lab-02/attachments.api.test.ts` | `Pass` |
| **API-25** | API | AC-03, BR-04 | Comprehensive cross-requester ownership guards across all ticket endpoints | HTTP 403 Forbidden across GET, POST attachment, and DELETE attachment | `server/tests/lab-02/ownership.test.ts` | `Pass` |
| **API-26** | API | AC-11, BR-04 | Sort tickets by createdAt ascending (`sort=createdAt_asc`) and verify timestamp ordering | HTTP 200 OK; asserts `t[i].createdAt <= t[i+1].createdAt` for all items | `server/tests/lab-02/my-tickets.api.test.ts` | `Pass` |
| **API-27** | API | AC-11, BR-04 | Sort tickets by createdAt descending (`sort=createdAt_desc`) as default and verify ordering | HTTP 200 OK; asserts `t[i].createdAt >= t[i+1].createdAt` for all items | `server/tests/lab-02/my-tickets.api.test.ts` | `Pass` |
| **API-28** | API | AC-11, BR-04 | Sort tickets by ticketNo ascending (`sort=ticketNo_asc`) and descending (`sort=ticketNo_desc`) | HTTP 200 OK; asserts deterministic alphabetical/reverse order | `server/tests/lab-02/my-tickets.api.test.ts` | `Pass` |
| **API-29** | API | AC-11, BR-04 | Sort tickets by priority ascending (`sort=priority_asc`) and descending (`sort=priority_desc`) | HTTP 200 OK; asserts rank `LOW <= MEDIUM <= HIGH` and `HIGH >= MEDIUM >= LOW` | `server/tests/lab-02/my-tickets.api.test.ts` | `Pass` |
| **API-30** | API | AC-11, BR-04 | Apply deterministic secondary sorting by id descending (`id_desc`) when primary sort keys match | HTTP 200 OK; asserts identical timestamp records are sorted by UUID descending | `server/tests/lab-02/my-tickets.api.test.ts` | `Pass` |
| **API-31** | API | AC-11, BR-04 | Reject invalid sort parameter (e.g. `sort=unknown_field_asc`) | HTTP 400 Bad Request with `INVALID_QUERY` error code | `server/tests/lab-02/my-tickets.api.test.ts` | `Pass` |
| **UI-01** | UI | AC-01, AC-09 | Create Ticket form initial render with reference data from API | Dropdowns populated, summary/description inputs visible, counters at 0 | `client/tests/lab-02/CreateTicket.test.tsx` | `Pass` |
| **UI-02** | UI | AC-09, BR-05 | Client-side validation: submit empty form or invalid lengths | Field-level error messages displayed below inputs; API not called | `client/tests/lab-02/CreateTicket.test.tsx` | `Pass` |
| **UI-03** | UI | AC-01, AC-20 | Submit valid form data in Create Ticket | Displays success screen with official Ticket Number and action buttons | `client/tests/lab-02/CreateTicket.test.tsx` | `Pass` |
| **UI-04** | UI | AC-02, BR-03 | My Tickets renders table with owned tickets and pagination | Displays ticket list, column headers, status badges, and pagination | `client/tests/lab-02/MyTickets.test.tsx` | `Pass` |
| **UI-05** | UI | AC-06, BR-04 | Search tickets by keyword in My Tickets | Debounced search parameter sent to API; table updates with matches | `client/tests/lab-02/MyTickets.test.tsx` | `Pass` |
| **UI-06** | UI | AC-06, BR-04 | Filter tickets by Category, Priority, and Status in My Tickets | Filter parameters sent to API; table reloads with filtered records | `client/tests/lab-02/MyTickets.test.tsx` | `Pass` |
| **UI-07** | UI | AC-08, BR-04 | Switching Development Requester context | Tickets list reloads and displays only the new Requester's tickets | `client/tests/lab-02/MyTickets.test.tsx` | `Pass` |
| **UI-08** | UI | AC-12, AC-13 | Empty state when requester has no tickets; no-results state on search | Meaningful empty state and clear no-results message displayed | `client/tests/lab-02/MyTickets.test.tsx` | `Pass` |
| **UI-09** | UI | AC-01, AC-03 | Ticket Detail screen read-only view for ticket owner | Displays all ticket header fields, read-only styling, back navigation link | `client/tests/lab-02/RequesterTicketDetail.test.tsx` | `Pass` |
| **UI-10** | UI | AC-03, BR-04 | Ticket Detail unauthorized access error (HTTP 403) | Displays user-friendly permission error without internal stack traces | `client/tests/lab-02/RequesterTicketDetail.test.tsx` | `Pass` |
| **UI-11** | UI | AC-03, BR-04 | Ticket Detail non-existent ticket error (HTTP 404) | Displays "Ticket not found" notification | `client/tests/lab-02/RequesterTicketDetail.test.tsx` | `Pass` |
| **UI-12** | UI | AC-04, BR-05 | Attachment drag-and-drop dropzone rendering and constraints label | Shows allowed file types, 5 MB size limit, and max 5 files notice | `client/tests/lab-02/AttachmentSection.test.tsx` | `Pass` |
| **UI-13** | UI | AC-04, BR-05 | Client validation rejecting unsupported file extension (.exe) and oversized file | Displays immediate inline error messages | `client/tests/lab-02/AttachmentSection.test.tsx` | `Pass` |
| **UI-14** | UI | AC-07, BR-06 | Max 5 active attachments limit in Ticket Detail | `+ Add Attachment` button disabled and limit notice shown when 5 active files | `client/tests/lab-02/AttachmentSection.test.tsx` | `Pass` |
| **UI-15** | UI | AC-05, BR-07 | Active attachment action buttons | Displays `Download` and `Remove` buttons on active attachments | `client/tests/lab-02/AttachmentSection.test.tsx` | `Pass` |
| **UI-16** | UI | AC-05, BR-07 | Soft-removed attachment presentation | Displays `Status: Removed`, timestamp, and reason; hides action buttons | `client/tests/lab-02/AttachmentSection.test.tsx` | `Pass` |
| **UI-17** | UI | AC-17, BR-07 | Remove Confirmation Dialog Modal validation | Modal opens on Remove; validates mandatory reason (3–255 chars); cancel closes | `client/tests/lab-02/AttachmentSection.test.tsx` | `Pass` |
| **UI-18** | UI | AC-05, BR-07 | Remove Attachment submit flow | Calls DELETE API with reason; displays success alert; refreshes detail state | `client/tests/lab-02/AttachmentSection.test.tsx` | `Pass` |
| **UI-19** | UI | AC-11, BR-04 | Change Sort dropdown in MyTickets UI triggers API call with corresponding sort parameter | Dropdown selection changes sort query param (`sort=createdAt_asc`, `sort=ticketNo_asc`) | `client/tests/lab-02/MyTickets.test.tsx` | `Pass` |

---

## 3. Acceptance-Criterion Traceability Matrix

| AC ID | Acceptance Criterion Summary | Relevant Automated Test IDs | Verification Status |
| :--- | :--- | :--- | :--- |
| **AC-01** | Create ticket with valid data, receive unique Ticket Number (`TKT-YYYY-XXXXXX`), and display success state | `API-01`, `API-09`, `UI-01`, `UI-03`, `UI-09` | **Pass** |
| **AC-02** | Redirect to Development Requester Selection screen if no requester is selected | `UI-04`, `API-03` | **Pass** |
| **AC-03** | Prevent cross-requester ticket access; return HTTP 403 Forbidden | `API-10`, `API-17`, `API-25`, `UI-10` | **Pass** |
| **AC-04** | Reject invalid attachment types (.exe) and oversized files (> 5 MiB) | `API-14`, `API-15`, `UI-12`, `UI-13` | **Pass** |
| **AC-05** | Soft-remove attachment with reason; retain metadata; prevent download of removed file | `API-18`, `API-19`, `API-21`, `API-24`, `UI-15`, `UI-16`, `UI-18` | **Pass** |
| **AC-06** | Search by keyword and filter by category/priority on My Tickets scoped to requester | `API-04`, `API-05`, `API-06`, `UI-05`, `UI-06` | **Pass** |
| **AC-07** | Enforce maximum of 5 active attachments per ticket; soft-removed files do not count | `API-16`, `UI-14` | **Pass** |
| **AC-08** | Switching requester context reloads and scopes data to the new requester | `UI-07`, `API-04`, `API-25` | **Pass** |
| **AC-09** | Field-level validation on Summary (5–150 chars) and Description (10–2000 chars) | `API-02`, `UI-02` | **Pass** |
| **AC-10** | Paginated ticket list with deterministic page sizing and metadata | `API-04`, `API-07`, `UI-04` | **Pass** |
| **AC-11** | Sorting tickets by supported fields with deterministic secondary sorting and verified order | `API-26`, `API-27`, `API-28`, `API-29`, `API-30`, `API-31`, `UI-19` | **Pass** |
| **AC-12** | Display meaningful empty state when requester has 0 tickets | `UI-08` | **Pass** |
| **AC-13** | Display clear no-results state when search/filter returns 0 matches | `API-05`, `UI-08` | **Pass** |
| **AC-14** | Display safe error states without exposing internal infrastructure on API failures | `API-08`, `UI-10`, `UI-11` | **Pass** |
| **AC-15** | Two-step submit resilience: retain form values and ticket if attachment upload fails | `API-13`, `UI-01`, `UI-13` | **Pass** |
| **AC-16** | Cross-requester attachment download and removal forbidden (HTTP 403) | `API-20`, `API-25` | **Pass** |
| **AC-17** | Mandatory removal reason (3–255 characters after trimming) on attachment soft removal | `API-22`, `API-23`, `UI-17` | **Pass** |
| **AC-18** | Responsive layout across Desktop (≥992px), Tablet (768–991px), and Mobile (<768px) | Visual Checklist, `UI-01`, `UI-04`, `UI-09` | **Pass** |
| **AC-19** | Accessibility labels, keyboard navigation, and visible focus indicators | `UI-01`, `UI-04`, `UI-17` | **Pass** |
| **AC-20** | Submit button shows busy state and prevents duplicate submission | `UI-01`, `UI-03` | **Pass** |

---

## 4. Responsive and Visual Checklist

| Viewport / Element | Inspection Item | Verification Method | Status |
| :--- | :--- | :--- | :--- |
| **Desktop (≥ 992px)** | Multi-column layout with centered container (max-width 768px/1200px) | Automated UI tests & Browser view | **Verified** |
| **Tablet (768–991px)** | Two-column classification fields; Summary and Description receive sufficient width | Browser responsive mode inspection | **Verified** |
| **Mobile (< 768px)** | Vertical field stacking; buttons full-width or touch-friendly (min 44px height); no horizontal scrolling | Browser mobile simulation (375px) | **Verified** |
| **All Viewports** | No clipped labels, overlapping text, hidden action buttons, or unreadable badges | Layout inspection across all pages | **Verified** |
| **Zen Green Palette** | Primary `#006B3C`, Secondary `#0B7A46`, Pale Green `#EAF6EF`, Background `#F5F7F6` / `#F8FAFC` | Computed style assertions | **Verified** |
| **Form Controls** | White background with neutral border (`#cbd5e1`); red asterisk (`#dc2626`) on required fields | CSS inspection in CreateTicket | **Verified** |
| **Read-Only Fields** | Soft gray-green shading (`#F0F4F2`) distinctly differentiated from editable fields | CSS inspection in TicketDetail | **Verified** |
| **Status Badges** | Distinct colors for Priority (High: Red, Medium: Amber, Low: Green) and Status (New: Light Blue) | Badge rendering assertions | **Verified** |

---

## 5. Test Commands

### Backend Test Suite
```bash
cd server
npm test
```
Runs all 7 test suites via Vitest, covering health, categories, ownership guards, create ticket, my tickets (including AC-11 primary & secondary sorting tests), ticket detail, and attachments.

### Frontend Test Suite
```bash
cd client
npm test
```
Runs all 5 test suites via Vitest, covering App, CreateTicket, MyTickets (including AC-11 sort selector test), RequesterTicketDetail, and AttachmentSection.

### Production Type-Check & Build
```bash
cd server && npm run build
cd ../client && npm run build
```
Executes TypeScript compiler (`tsc`) and Vite production bundler to verify zero compile or type errors.

---

## 6. Final Results

Both test suites executed with **100% pass rate (96/96 tests passing)** and zero errors or warnings.

### Backend Execution Log
```text
> toktickit-server@1.0.0 test
> vitest run

 RUN  v2.1.9 C:/Users/Acer/Desktop/TokTickIT/server

 ✓ tests/lab-01/health.test.ts (1 test) 33ms
 ✓ tests/lab-01/categories.test.ts (1 test) 66ms
 ✓ tests/lab-02/ownership.test.ts (5 tests) 161ms
 ✓ tests/lab-02/ticket-detail.api.test.ts (5 tests) 153ms
 ✓ tests/lab-02/create-ticket.api.test.ts (6 tests) 197ms
 ✓ tests/lab-02/my-tickets.api.test.ts (20 tests) 402ms
 ✓ tests/lab-02/attachments.api.test.ts (24 tests) 542ms

 Test Files  7 passed (7)
      Tests  62 passed (62)
   Start at  21:26:44
   Duration  1.43s (transform 300ms, setup 0ms, collect 2.84s, tests 1.55s, environment 1ms, prepare 993ms)
```

### Frontend Execution Log
```text
> toktickit-client@1.0.0 test
> vitest run

 RUN  v2.1.9 C:/Users/Acer/Desktop/TokTickIT/client

 ✓ tests/lab-02/RequesterTicketDetail.test.tsx (3 tests) 147ms
 ✓ tests/lab-02/CreateTicket.test.tsx (4 tests) 299ms
 ✓ tests/lab-01/App.test.tsx (3 tests) 259ms
 ✓ tests/lab-02/AttachmentSection.test.tsx (10 tests) 452ms
 ✓ tests/lab-02/MyTickets.test.tsx (14 tests) 2142ms
   ✓ MyTickets - Lab 2 UI Tests > sends the search parameter when searching 652ms
   ✓ MyTickets - Lab 2 UI Tests > sends category, priority, and status filters 352ms

 Test Files  5 passed (5)
      Tests  34 passed (34)
   Start at  21:26:55
   Duration  3.54s (transform 332ms, setup 479ms, collect 1.20s, tests 3.30s, environment 2.89s, prepare 556ms)
```


---

## 7. Known Limitations or Deferred Tests

- **Authentication & Authorization**: Password login, JWT sessions, token refresh, and real role-based authorization are intentionally and explicitly excluded from Lab 2. They are scheduled for implementation in Lab 3. The Development Requester Selector simulates user context for Lab 2 verification.
- **IT Staff Workflow**: Assigning tickets, changing IT Priority, IT dashboard queues, and resolving/closing tickets are scheduled for later labs.
- **Collaboration**: Public comments, internal notes, and audit action logs are scheduled for later labs.
- **Deferred Tests**: **None**. All planned tests for the approved Lab 2 scope have been implemented and are actively passing in the test suite. No tests are skipped, disabled, or commented out.

