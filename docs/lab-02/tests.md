# Lab 2 Planned Test Strategy & Execution Verification

## 1. Test Strategy Overview
This document outlines the planned automated test suite for TokTickIT Requester MVP. Tests cover Unit logic, API Endpoints, UI Components, and End-to-End (E2E) workflows aligned with Acceptance Criteria (AC-01 through AC-05) and Business Rules (BR-01 through BR-08).

## 2. Planned Test Strategy Matrix

| Test ID | Level | AC Ref | What It Tests (Description) | Expected Result | Automated Test File | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST-UNIT-01** | Unit | AC-01, BR-01 | Ticket number format generation (`TKT-YYYY-XXXXXX`) | Generates correct pattern with leading zeros | `src/utils/ticketNo.test.ts` | `[Pending]` |
| **TEST-UNIT-02** | Unit | BR-05, BR-06 | File validation logic (type check & size check <= 5MB) | Rejects disallowed extensions and oversized files | `src/utils/attachment.test.ts` | `[Pending]` |
| **TEST-API-01** | API | AC-02, BR-03, BR-04 | Requester context is required for requester-scoped ticket endpoints | Returns a validation error when requesterId is missing or invalid | `tests/api/requester-context.test.ts` | `[Pending]` |
| **TEST-API-02** | API | AC-03, BR-04 | Requester B accessing Requester A's ticket details | Returns HTTP 403 Forbidden with standard error payload | `tests/api/ownership.test.ts` | `[Pending]` |
| **TEST-API-03** | API | AC-01, FR-02 | Creating a new ticket via `POST /api/v1/tickets` | Creates ticket record with initial status `NEW` and ticket number | `tests/api/ticket-create.test.ts` | `[Pending]` |
| **TEST-API-04** | API | FR-05, BR-04 | Filtering and searching tickets via `GET /api/v1/tickets` | Returns paginated list containing only requester's tickets | `tests/api/ticket-list.test.ts` | `[Pending]` |
| **TEST-API-05** | API | AC-04, BR-05 | Uploading invalid attachment type (EXE) or >5MB | Returns HTTP 400 Bad Request with field validation error | `tests/api/attachment-upload.test.ts` | `[Pending]` |
| **TEST-API-06** | API | AC-05, BR-07 | Soft removing attachment via `DELETE /api/v1/attachments/:id` | Sets `removedAt` & `removalReason`; download link returns HTTP 404 Not Found | `tests/api/attachment-soft-remove.test.ts` | `[Pending]` |
| **TEST-API-07** | API | FR-02, AC-01 | Creating ticket with invalid or missing required fields | Returns HTTP 400 Bad Request with field-level validation errors | `tests/api/ticket-create-validation.test.ts` | `[Pending]` |
| **TEST-API-08** | API | AC-04, BR-05 | Uploading a valid attachment (JPG/PNG/WEBP/PDF <= 5MB) | Creates attachment metadata and returns HTTP 201 Created | `tests/api/attachment-upload.test.ts` | `[Pending]` |
| **TEST-UI-01** | UI | FR-01, BR-08 | Dev Requester Selector component rendering and LocalStorage state | Active requesters loaded, inactive hidden, selection persisted | `src/components/RequesterSelector.test.tsx` | `[Pending]` |
| **TEST-UI-02** | UI | FR-02, BR-05 | Create Ticket form client-side validation errors | Highlights invalid fields in dark red beneath inputs | `src/pages/CreateTicket.test.tsx` | `[Pending]` |
| **TEST-E2E-01** | E2E | AC-01 to AC-05 | Full Requester journey: Select User -> Create Ticket -> Upload Attachment -> View Ticket List -> View Ticket Detail -> Download Attachment -> Soft Remove Attachment | The complete requester journey completes successfully, including attachment upload, download, and soft removal, without cross-user leakage. | `e2e/requester-journey.spec.ts` | `[Pending]` |

## 3. Final Test Execution Results
*Note: Terminal log outputs from Vitest/Playwright will be appended here upon completion of implementation in Phase 5.*[cite: 1]

```text
[Pending - To be executed after implementation]
