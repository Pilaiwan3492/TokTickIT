# TokTickIT — Full-Stack IT Service Desk

**Course:** CPE 334 Software Engineering — Lab 4 (Sprint 4)  
**Author:** Pilaiwan Churdchu — 67070503492 — GitHub: [@Pilaiwan3492](https://github.com/Pilaiwan3492)  
**Peer Reviewer:** Aphichaya Klinhual — 67070503447 — GitHub: [@Apichaya251400](https://github.com/Apichaya251400)  
**Author Repository:** [https://github.com/Pilaiwan3492/TokTickIT](https://github.com/Pilaiwan3492/TokTickIT)  
**Partner Repository:** [https://github.com/Apichaya251400/TokTickIT](https://github.com/Apichaya251400/TokTickIT)  
**Target Release:** `lab4-staging` → `main`

TokTickIT is a full-stack IT service desk web application for handling Account & Access, Hardware, Software, and Network support requests. Built with a robust full-stack TypeScript architecture using React 18, Express, Prisma ORM, and PostgreSQL.

---

## 🚀 Lab 4: Actions Taken, Role Dashboards, Ticket Lifecycle & Resolution Gate

Lab 4 expands TokTickIT into a comprehensive IT operations platform with work logging, role-tailored dashboards, state machine enforcement, optimistic concurrency, and multi-device responsive design:

- **Parent-Child Actions Taken Management**:
  - Discrete `ActionTaken` model linked to parent `Ticket` and `User` (`performedBy`) with composite indexing (`ticketId`, `actionDate`).
  - Strict RBAC: IT Staff and Admin can record and edit actions; Requesters possess read-only visibility on owned tickets (`403 FORBIDDEN` on other tickets or direct write attempts).
  - Auto-attribution of `performedById` bound to the authenticated session (immutable once created).
  - Inactive actor protection (`INACTIVE_ACTOR_REJECTED`) preventing inactive accounts from recording or editing work.
  - Mandatory follow-up note validation: `followUpNote` is mandatory when `followUpRequired = true` (`FOLLOWUP_NOTE_REQUIRED`).
  - Terminal ticket guard: Actions cannot be added to `CLOSED` or `CANCELLED` tickets (`TICKET_LOCKED`).

- **Ticket Lifecycle State Machine & Resolution Gate**:
  - Full 18 permitted status transition matrix across 8 discrete statuses (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`).
  - Backend Resolution Gate enforcement: Only IT Staff and Admin can transition tickets to `RESOLVED`.
  - Decoupled Requester advisory resolution: Requesters indicate "Problem Appears Resolved" (`POST /resolve-indicator`), setting `isResolvedByUser: true` without altering official ticket status.
  - Reopening workflow: `RESOLVED` tickets can transition to `CLOSED` or `REOPENED`.
  - Terminal state lock: `CLOSED` and `CANCELLED` tickets are immutable and reject further status transitions (`400 TICKET_LOCKED`).

- **Optimistic Concurrency Control (`STALE_UPDATE_CONFLICT`)**:
  - Mismatched timestamp checks on status updates (`expectedUpdatedAt`) and action logging (`expectedTicketUpdatedAt`).
  - Server returns HTTP 409 `STALE_UPDATE_CONFLICT` on race conditions, preventing silent data overwrites.
  - Frontend preserves entered form inputs upon conflict with accessible "Refresh Ticket" CTA.

- **Role-Specific Dashboards with SQL Aggregations**:
  - Optimized database aggregations via Prisma `groupBy` and count queries ($< 300\text{ms}$ latency).
  - **Requester Dashboard** (`/dashboard`): 4 primary metric cards (`My Open Tickets`, `Waiting for Requester`, `Resolved`, `Closed`), recent tickets table, recently resolved tickets list, and empty state CTA.
  - **IT Staff Dashboard** (`/dashboard`): 6 primary operational metric cards (`New`, `Open`, `In Progress`, `Waiting Req`, `My Assigned`, `Unassigned`), Priority Attention strip (`Urgent`, `High`), and Current User Recent Actions list (max 5).
  - **Administrator Dashboard** (`/dashboard`): Inherits Staff operational metrics and adds System User Accounts summary (`Active Users`, `Active Staff`, `Active Admins`).
  - Accessible drill-down navigation: Clicking any metric card routes to filtered views (`/my-tickets?status=...` or `/staff/tickets?status=...`).

- **Design System Fidelity & Multi-Device Responsive Experience**:
  - Zen Green brand tokens: Primary Green `#006B3C`, Secondary Green `#0B7A46`, Pale Green `#EAF6EF`, Neutral White `#FFFFFF`, Neutral Border `#D5DDD8`.
  - Distinct Amber styling (`#D97706` / `#FEF3C7`) for Follow-up Required pills and internal notes.
  - High-contrast keyboard focus outlines (`#0B7A46`, $2\text{px}$) with sequential `Tab` accessibility.
  - Responsive layouts verified on Desktop ($1280 \times 800$), Tablet ($768 \times 1024$), and Mobile ($375 \times 667$).
  - Touch targets $\ge 44 \times 44\text{px}$ across all viewports (`touch-targets.css`).
  - Zero unintended horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth`).

- **100% Backward Compatibility & Full Regression Suite**:
  - Complete regression suite (`E2E-10`) executing across Desktop, Tablet, and Mobile verifying Labs 1–3 functionality (Health check, categories, Requester ticket lifecycle, attachments, JWT auth, password change, IT queue claiming, public comments, amber notes, admin user management).

---

## 📁 Project Structure

```text
TokTickIT/
├── artifacts/
│   └── lab-04/
│       ├── screenshots/         # 24 high-resolution responsive evidence screenshots
│       │   ├── 01-staff-dashboard-{desktop,tablet,mobile}.png
│       │   ├── 02-requester-dashboard-{desktop,tablet,mobile}.png
│       │   ├── 03-ticket-detail-actions-taken-{desktop,tablet,mobile}.png
│       │   ├── 04-action-taken-modal-{desktop,tablet,mobile}.png
│       │   ├── 05-ticket-resolution-gate-{desktop,tablet,mobile}.png
│       │   ├── 06-requester-resolve-indicator-{desktop,tablet,mobile}.png
│       │   ├── 07-concurrency-conflict-banner-{desktop,tablet,mobile}.png
│       │   └── 08-admin-dashboard-{desktop,tablet,mobile}.png
│       └── CPE334_Lab4_Submission_67070503492.docx # Final submission package
├── client/                      # React 18 + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/ticket/   # ActionsTakenSection, ActionTakenModal, ActionsTakenList
│   │   ├── context/             # AuthContext (JWT auth state & session storage)
│   │   ├── pages/               # RequesterDashboard, StaffDashboard, StaffTicketDetail,
│   │   │                        # RequesterTicketDetail, StaffTicketQueue, MyTickets, CreateTicket
│   │   └── api/                 # actionsTaken.api, dashboard.api, ticketWorkflow.api
│   └── tests/lab-04/            # Vitest + RTL client component tests (181 tests across all labs)
├── server/                      # Node.js + Express + Prisma backend
│   ├── prisma/                  # schema.prisma, pure SQL migrations, idempotent seed.ts
│   ├── src/
│   │   ├── controllers/         # actionsTaken, ticketWorkflow, dashboard, auth, admin controllers
│   │   ├── validators/          # ticket-workflow.validator.ts, actions-taken.validator.ts
│   │   └── middlewares/         # auth.middleware, requireRole, ownership guards
│   └── tests/lab-04/            # Vitest + Supertest backend test suites (309 tests across all labs)
├── e2e/
│   └── lab-04/                  # Playwright multi-device E2E suites (57 tests across 3 viewports)
│       ├── actions-taken-flow.spec.ts
│       ├── ticket-resolution.spec.ts
│       ├── dashboards.spec.ts
│       ├── responsive.spec.ts
│       └── regression.spec.ts   # E2E-10 full regression suite
├── docs/lab-04/                 # Engineering Specifications & Review Records
│   ├── specification.md         # Canonical Sprint Specification (AC-01..25, BR-01..19, FR-01..20)
│   ├── tests.md                 # Test Strategy, Test Catalog & Dual AC/BR Traceability Matrices
│   ├── ai-use.md                # AI Agent Prompts Log & Personal Engineering Reflection
│   ├── reviewer.md              # Complete Peer Review Dialogue & Pull Request Records
│   └── submission-package.md    # Formatted 9-Part Lab 4 Final Submission Package
├── playwright.config.ts         # Multi-device Playwright configuration (Desktop, Tablet, Mobile)
└── README.md
```

---

## 👥 Seed Credentials & Test Accounts

| Role | Name | Email | Password | Permissions & Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Requester** | Alice Johnson | `alice@example.com` | `InitialPass123!` | Active Requester (Must change password on first login) |
| **Requester** | Bob Smith | `bob@example.com` | `Password123!` | Active Requester with multiple owned tickets |
| **Requester** | Charlie Brown | `charlie@example.com` | `Password123!` | Active Requester |
| **Requester** | Eve Inactive User | `eve@example.com` | `Password123!` | Inactive Requester (`ACCOUNT_INACTIVE`) |
| **IT Staff** | Michael Brown | `michael.brown@toktickit.com` | `Password123!` | Active IT Staff (Queue processing, Ticket claiming) |
| **IT Staff** | David Lee | `david.lee@toktickit.com` | `Password123!` | Active IT Staff (Ticket Owner & Action logger) |
| **IT Staff** | Kevin Patel | `kevin.patel@toktickit.com` | `Password123!` | Inactive IT Staff (`INACTIVE_ACTOR_REJECTED`) |
| **Admin** | John Smith | `admin@toktickit.com` | `Password123!` | Administrator (User Management, Safety Guards, Queue, Metrics) |

---

## ⚙️ Setup & Running Instructions

### 1. Backend Setup (`server/`)

```bash
cd server
npm install

# Run database migrations and seed initial data
npm run prisma:migrate
npm run prisma:seed

# Start Express server (runs on http://localhost:3000)
npm run dev
```

### 2. Frontend Setup (`client/`)

```bash
cd client
npm install

# Start Vite development server (runs on http://localhost:5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Automated Testing Verification (100% Pass Rate — 547/547 Tests)

Execute the full automated test battery with zero regressions:

### 1. Server Unit, API, Performance-Smoke & Migration Tests (309 tests)
```bash
cd server
npm test -- --run
```

### 2. Client Component, Interaction, Visual & Style Tests (181 tests)
```bash
cd client
npm test -- --run
```

### 3. Playwright End-to-End Multi-Device Suite (57 tests)
```bash
# Runs all E2E scenarios (E2E-01..E2E-10) across Desktop, Tablet, and Mobile
npx playwright test e2e/lab-04/
```

### Production Build & Type Compilation
```bash
# Backend compilation
cd server && npm run build

# Frontend production bundle
cd ../client && npm run build
```

---

## 📊 Lab 4 Test Verification Summary

| Test Suite | Tooling | Scope / Test Count | Passed / Total | Pass Rate | Status |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Server Unit & API Tests** | Vitest + Supertest | 22 test files (`UNIT-01`..`04`, `API-01`..`33`, `PERF-01`..`02`, `MIG-01`..`04`) | **309 / 309** | 100% | **PASS** |
| **Client Component Tests** | Vitest + RTL + jsdom | 22 test files (`UI-01`..`UI-26`, `VIS-01`..`03`, auth context) | **181 / 181** | 100% | **PASS** |
| **Playwright Multi-Device E2E** | Playwright Chromium | 4 test suites across Desktop (1280x800), Tablet (768x1024), Mobile (375x667) | **57 / 57** | 100% | **PASS** |
| **Total Automated Tests** | — | **Full Regression Battery across Labs 1, 2, 3, and 4** | **547 / 547** | **100%** | **PASS** |

---

## 📑 Lab 4 Engineering Documentation Links

- [`docs/lab-04/specification.md`](docs/lab-04/specification.md) — Canonical Sprint Specification (AC-01..25, BR-01..19, FR-01..20)
- [`docs/lab-04/tests.md`](docs/lab-04/tests.md) — Test Strategy, Test Catalog & Dual AC/BR Traceability Matrices
- [`docs/lab-04/ai-use.md`](docs/lab-04/ai-use.md) — AI Agent Prompts Log & Personal Engineering Reflection
- [`docs/lab-04/reviewer.md`](docs/lab-04/reviewer.md) — Verbatim Peer Review Records & Approval Evidence
- [`docs/lab-04/submission-package.md`](docs/lab-04/submission-package.md) — Formatted 9-Part Final Submission Package
