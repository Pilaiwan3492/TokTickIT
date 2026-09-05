# Lab 2 — AI Agent Use and Reflection

**Author:** Pilaiwan Churdchu — 67070503492 — GitHub: [@Pilaiwan3492](https://github.com/Pilaiwan3492)  
**Primary LLM / AI Coding Agent:** Google Gemini (Gemini 2.0 Flash / Pro via Antigravity Agent)

---

## 1. Overview of AI Usage

Throughout the development of **Lab 2: TokTickIT Requester Ticketing MVP with UI Foundation**, AI agents were used in two distinct, disciplined roles:
1. **AI Specification Agent**: Guided the drafting and refinement of the sprint engineering contract (`specification.md`, `api-spec.md`, `ui-spec.md`, and `tests.md`) to establish clear business rules (BR-01 through BR-26) and acceptance criteria (AC-01 through AC-20) before writing any code.
2. **AI Coding Agent**: Executed targeted, single-issue feature implementations within isolated feature branches under a strict test-driven development (TDD) workflow, strictly adhering to the pre-approved specifications.

---

## 2. Table of Key Prompts (Selected 8 Prompts)

| # | Prompt Name | Key Prompt Text / Task Description | Target Deliverable / Scope | Engineering Outcome |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **Spec Contract Generation** | *"Read the stakeholder request for Sprint 2. Decompose it into 11 sections for `specification.md` covering Sprint Goal, Scope, Functional Requirements (FR), Business Rules (BR-01 to BR-26), and Acceptance Criteria (AC-01 to AC-20) in Given-When-Then format. Exclude authentication and IT staff workflows."* | `docs/lab-02/specification.md` | Created a 218-line rigorous sprint specification preventing scope creep and ambiguity before coding. |
| **2** | **REST API Contract Definition** | *"Define the complete REST API contract in `api-spec.md` for ticket creation, paginated listing with query filters, ticket detail retrieval, attachment upload, download, and soft removal. Include standard error formats, HTTP status codes, and JSON schemas."* | `docs/lab-02/api-spec.md` | Established explicit API contracts (200, 201, 400, 403, 404, 409, 413, 415) and query parameters. |
| **3** | **Zen Green UI Specification** | *"Define the complete UI specification in `ui-spec.md` incorporating the Zen Green theme tokens (`#006B3C`, `#0B7A46`, `#EAF6EF`), component states, read-only field styling, and responsive layout rules for Desktop (≥992px), Tablet (768–991px), and Mobile (<768px)."* | `docs/lab-02/ui-spec.md` | Standardized reusable UI conventions, badge color semantics, and responsive breakpoints. |
| **4** | **Prisma Data Modeling & Migrations** | *"Design the PostgreSQL schema in `schema.prisma` for `RequesterUser`, `Category`, `RelatedSystem`, `Ticket`, and `Attachment`. Include cascade deletes, soft-removal fields (`removedAt`, `removalReason`), and create an idempotent seed script."* | `server/prisma/schema.prisma` & `seed.ts` | Created normalized database tables, indexes on `[requesterId, createdAt]`, and repeatable seed data. |
| **5** | **Ownership Guard Middleware** | *"Implement ticket ownership guard middleware in Express. For any ticket operation (`GET /:id`, `POST /:id/attachments`, `DELETE /:id`), verify that the ticket belongs to the selected requester. If not, reject with HTTP 403 Forbidden without leaking ticket details."* | `server/src/middlewares/` & `ownership.test.ts` | Enforced strict data isolation between Requesters at the API layer with 5 automated test cases. |
| **6** | **Attachment Validation & Limit** | *"Implement multipart attachment upload using Multer. Validate file extensions (`jpg`, `jpeg`, `png`, `webp`, `pdf`), limit file size to 5 MiB (5,242,880 bytes), and reject upload with HTTP 409 if the ticket already has 5 active attachments."* | `attachment.controller.ts` & `attachments.api.test.ts` | Added 24 contract tests verifying file size limits, MIME types, and active attachment counting. |
| **7** | **Attachment Soft Removal & Reason** | *"Implement attachment soft removal via `DELETE /api/v1/attachments/:id`. Require a mandatory `removalReason` (3–255 characters after trimming). Mark `removedAt`, prevent subsequent downloads with HTTP 404, and build the UI confirmation modal."* | `TicketDetail.tsx` & `AttachmentSection.test.tsx` | Delivered soft-removal workflow with retained database metadata and blocked download access. |
| **8** | **Test Rigor & False-Positive Elimination** | *"Audit `my-tickets.api.test.ts` and `ticket-detail.api.test.ts`. Replace all `if (...) return` with hard assertions and `beforeAll` seeding. Add real priority sorting rank assertions (`LOW <= MEDIUM <= HIGH`) and an explicit test for deterministic secondary sorting (`id_desc`)."* | `server/tests/lab-02/` & `docs/lab-02/tests.md` | Eliminated silent false positives and added direct evidence for AC-11, bringing test pass count to 96/96. |

---

## 3. My Reflection on AI Use

Using an AI coding agent throughout Lab 2 was an eye-opening and highly productive engineering experience that fundamentally changed how I approach software construction.

### Accelerated Productivity with Test-Driven Development (TDD)
The AI agent dramatically reduced the time required to scaffold repetitive boilerplate code, database migrations, and complex contract tests. Instead of manually writing 96 tests across 12 test suites, the AI helped translate acceptance criteria directly into Supertest and React Testing Library suites. This allowed our team to focus on architecture, business rules, and user experience.

### The Critical Need for Human Oversight & Rigorous Review
The most important lesson learned was that **an AI agent cannot replace human engineering judgment**. During our peer review in Issue 18, we discovered that the AI had written tests that simply verified `res.status === 200` and `Array.isArray(data)` for priority sorting without asserting the actual sorted order of the elements. Furthermore, early returns (`if (!ticket) return;`) would have allowed tests to pass silently as false positives if the database had been empty. By applying careful code review and prompting the AI to add mathematical rank assertions (`LOW <= MEDIUM <= HIGH`) and deterministic secondary sorting tests (`id_desc`), we turned a potentially superficial test suite into rock-solid verification evidence.

### Conclusion
AI agents are exceptionally capable co-pilots when guided by an explicit engineering contract (Spec DD). However, the developer must remain the ultimate owner of the code—verifying failure states, demanding real test assertions, and ensuring that no shortcuts are taken.
