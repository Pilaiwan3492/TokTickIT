# Lab 2 Planned Test Strategy & Execution Verification

## 1. Test Strategy Overview
This document outlines the planned automated test suite for TokTickIT Requester MVP. Tests cover Unit logic, API Endpoints, UI Components, and End-to-End (E2E) workflows aligned with Acceptance Criteria (AC-01 through AC-05) and Business Rules (BR-01 through BR-08)[cite: 1].

## 2. Planned Test Strategy Matrix

| Test ID | Level | AC Ref | What It Tests (Description) | Expected Result | Automated Test File | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST-UNIT-01** | Unit | AC-01, BR-01 | Ticket number format generation (`TKT-YYYY-XXXXXX`)[cite: 1] | Generates correct pattern with leading zeros[cite: 1] | `src/utils/ticketNo.test.ts` | `[Pending]` |
| **TEST-UNIT-02** | Unit | BR-05, BR-06 | File validation logic (type check & size check <= 5MB)[cite: 1] | Rejects disallowed extensions and oversized files[cite: 1] | `src/utils/attachment.test.ts` | `[Pending]` |
| **TEST-API-01** | API | AC-02, BR-03 | Requesting ticket endpoints without active requester context[cite: 1] | Redirects or returns unauthorized response[cite: 1] | `tests/api/auth.test.ts` | `[Pending]` |
| **TEST-API-02** | API | AC-03, BR-04 | Requester B accessing Requester A's ticket details[cite: 1] | Returns HTTP 403 Forbidden with standard error payload[cite: 1, 2] | `tests/api/ownership.test.ts` | `[Pending]` |
| **TEST-API-03** | API | AC-01, FR-02 | Creating a new ticket via `POST /api/v1/tickets`[cite: 1] | Creates ticket record with initial status `NEW` and ticket number[cite: 1] | `tests/api/ticket-create.test.ts` | `[Pending]` |
| **TEST-API-04** | API | FR-05, BR-04 | Filtering and searching tickets via `GET /api/v1/tickets`[cite: 1] | Returns paginated list containing only requester's tickets[cite: 1] | `tests/api/ticket-list.test.ts` | `[Pending]` |
| **TEST-API-05** | API | AC-04, BR-05 | Uploading invalid attachment type (EXE) or >5MB[cite: 1] | Returns HTTP 400 with field validation error[cite: 1] | `tests/api/attachment-upload.test.ts` | `[Pending]` |
| **TEST-API-06** | API | AC-05, BR-07 | Soft removing attachment via `DELETE /api/v1/attachments/:id`[cite: 1] | Sets `removedAt` & `removalReason`; download link returns 404/403[cite: 1] | `tests/api/attachment-soft-remove.test.ts` | `[Pending]` |
| **TEST-UI-01** | UI | FR-01, BR-08 | Dev Requester Selector component rendering and LocalStorage state[cite: 1] | Active requesters loaded, inactive hidden, selection persisted[cite: 1] | `src/components/RequesterSelector.test.tsx` | `[Pending]` |
| **TEST-UI-02** | UI | FR-02, BR-05 | Create Ticket form client-side validation errors[cite: 1] | Highlights invalid fields in dark red beneath inputs[cite: 1] | `src/pages/CreateTicket.test.tsx` | `[Pending]` |
| **TEST-E2E-01** | E2E | AC-01 to AC-05 | Full Requester journey: Select User -> Create Ticket -> View List -> Soft Remove Attachment[cite: 1] | End-to-end user flow completes successfully without cross-user leakage[cite: 1] | `e2e/requester-journey.spec.ts` | `[Pending]` |

## 3. Final Test Execution Results
*Note: Terminal log outputs from Vitest/Playwright will be appended here upon completion of implementation in Phase 5.*[cite: 1]

```text
[Pending - To be executed after implementation]