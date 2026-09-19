# TokTickIT — Full-Stack IT Service Desk

**Course:** CPE 334 Software Engineering — Lab 3 (Sprint 3)  
**Author:** Pilaiwan Churdchu — 67070503492 — GitHub: [@Pilaiwan3492](https://github.com/Pilaiwan3492)  
**Peer Reviewer:** Aphichaya Klinhual — 67070503447 — GitHub: [@Apichaya251400](https://github.com/Apichaya251400)  
**Target Release:** `lab3-staging` → `main`

TokTickIT is a full-stack IT service desk web application for handling Account & Access, Hardware, Software, and Network support requests. Built with a full-stack TypeScript architecture using React, Express, Prisma ORM, and PostgreSQL / SQLite.

---

## 🚀 Lab 3: Role-Based Access Control, Authentication & IT Operations

Lab 3 evolves TokTickIT from a single-role MVP into a complete, production-grade multi-role service desk application:

- **Authentication & Security Foundation**:
  - JWT Bearer token authentication with bcrypt password hashing.
  - Server-side session invalidation and token revocation blocklist (`POST /api/v1/auth/logout` via `RevokedToken`).
  - Startup security check enforcing `JWT_SECRET` length $\ge 32$ characters with fail-secure abort.
  - Mandatory first-login password change flow (`mustChangePassword = true` returning HTTP 403 `PASSWORD_CHANGE_REQUIRED`) with real-time complexity validation ($\ge 8$ chars, uppercase, lowercase, number, symbol).
  - Sensitive credential leakage elimination (`passwordHash` and `tokenVersion` omitted from all queries and responses).

- **Role-Based Navigation & Shell**:
  - Three discrete canonical roles: `REQUESTER`, `IT_STAFF`, and `ADMIN`.
  - Role-aware Header navigation and role badge with full deprecation and removal of the legacy Development Requester Selector.
  - Client session expiration and revocation interception (`apiClient`) automatically redirecting stale sessions to Login.

- **Requester Regression & Public Comments**:
  - Append-only chronological Public Comments feed (`GET/POST /api/v1/tickets/:id/comments`) with author avatar, role badge, timestamp, and live character counter (`0 / 2000`).
  - "Problem Appears Resolved" indicator endpoint (`POST /api/v1/tickets/:id/resolve-indicator`) allowing requesters to signal resolution idempotently without altering official ticket status.
  - Pre-query ticket ownership guard guaranteeing zero metadata leakage on unauthorized ticket access attempts (`403 FORBIDDEN`).

- **IT Staff Queue & Operational Processing**:
  - IT Staff Shared Queue (`/queue`) with debounced search, status and priority dropdown filters, and ownership filter tabs (`All`, `Unassigned`, `Assigned to Me`).
  - Operational Ticket Detail (`/queue/:id`) with prominent operational control card.
  - One-click ticket claiming, staff reassignment, and independent IT Priority management.
  - Strict status transition state machine enforcing the BR-16 lifecycle (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `CANCELLED`, `REOPENED`).
  - Private Internal Notes tab with distinct amber styling (`#854D0E`, `#FFFBEB`) strictly inaccessible to Requesters.

- **Administrator User Management & Safety Guards**:
  - Full user administration table (`/admin/users`) with safe user projections (`id`, `name`, `email`, `role`, `isActive`, `mustChangePassword`, `createdAt`).
  - Create User, Edit User, and Reset Initial Password modals with complexity checklist and session revocation notice.
  - Self-deactivation guard preventing administrators from deactivating their own account (`CANNOT_DEACTIVATE_SELF`).
  - Concurrency-safe Last Active Administrator protection (`LAST_ACTIVE_ADMIN_PROTECTED`) backed by database transaction advisory locking.
  - Bidirectional RequesterUser synchronization preserving referential integrity across role changes.

- **Visual QA & Responsive Experience**:
  - Design system tokens in Zen Green (`#006B3C`) and Amber notes styling (`#D97706`).
  - Responsive layouts across Desktop ($\ge 1024\text{px}$), Tablet ($820 \times 1180$), and Mobile ($375 \times 667$).
  - Touch targets verified $\ge 44\text{px}$ on mobile/tablet devices (`touch-targets.css`).
  - Zero horizontal overflow enforced on all views (`assertNoHorizontalOverflow`).

---

## 📁 Project Structure

```text
TokTickIT/
├── artifacts/
│   └── lab-03/
│       ├── screenshots/         # 26 high-resolution responsive evidence screenshots
│       │   ├── authentication/  # Desktop, Tablet, Mobile login & password change
│       │   ├── staff-queue/     # Queue table, mobile cards, filters
│       │   ├── staff-ticket-detail/ # Operational controls, amber internal notes
│       │   └── user-management/ # User table, modals, self-deactivation guard
│       └── CPE334_Lab3_Submission_67070503492.docx # Final submission package
├── client/                      # React 18 + TypeScript + Vite frontend
│   ├── src/
│   │   ├── context/             # AuthContext (real authentication state)
│   │   ├── pages/               # Login, ChangePassword, MyTickets, CreateTicket,
│   │   │                        # TicketDetail, StaffTicketQueue, StaffTicketDetail, UserManagement
│   │   ├── components/          # Header, ProtectedRoute, Modals, StatusBadge
│   │   └── services/            # apiClient (Bearer interceptor & error handling)
│   └── tests/lab-03/            # Vitest + RTL component tests (98 tests)
├── server/                      # Node.js + Express + Prisma backend
│   ├── prisma/                  # schema.prisma, pure SQL migrations, idempotent seed.ts
│   ├── src/
│   │   ├── controllers/         # auth, ticket, staff, comment, note, admin controllers
│   │   ├── middlewares/         # requireAuth, requireRole, ownership guards
│   │   └── app.ts
│   ├── uploads/                 # Local attachment storage
│   └── tests/lab-03/            # Vitest + Supertest API contract tests (140 tests)
├── e2e/
│   └── lab-03/                  # Playwright multi-device E2E tests (30 tests)
│       ├── authentication.spec.ts
│       ├── staff-ticket-flow.spec.ts
│       └── user-administration.spec.ts
├── docs/lab-03/                 # Engineering Specifications & Review Records
│   ├── specification.md         # Architecture, 3 roles, AC-01..25, BR-01..28
│   ├── api-spec.md              # REST API Contract, status transitions, auth matrix
│   ├── ui-spec.md               # Zen Green UI specification & responsive design
│   ├── tests.md                 # Test plan, dual AC/BR traceability matrices
│   ├── ai-use.md                # AI Agent reflections & representative prompt logs
│   └── reviewer.md              # Complete verbatim GitHub peer review dialogue
├── playwright.config.ts         # Playwright multi-device configuration (Desktop, Tablet, Mobile)
└── README.md
```

---

## 🛠️ Prerequisites

* **Node.js**: v20 or later
* **PostgreSQL / SQLite**: Running instance configured via `server/.env`

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

## 🧪 Automated Testing (100% Pass Rate — 268/268 Tests)

Execute the full automated test suites with zero regressions:

### 1. Server API & Integration Tests (140 tests)
```bash
cd server
npm test
```

### 2. Client Component & Unit Tests (98 tests)
```bash
cd client
npm test
```

### 3. Playwright End-to-End Multi-Device Suite (30 tests)
```bash
# Runs all 10 scenarios across Desktop, Tablet, and Mobile viewports
npm run test:e2e
```

### Production Build & Type Check
```bash
# Server compilation
cd server && npm run build

# Client production bundle
cd ../client && npm run build
```

---

## 📊 Lab 3 Test Verification Summary

| Test Suite | Tooling | Scope / Devices | Passed / Total | Status |
| :--- | :--- | :--- | :---: | :---: |
| **Server API & Integration** | Vitest + Supertest | 13 test files (`API-01`..`API-48`, migrations) | **140 / 140** | **PASS** |
| **Client Component Tests** | Vitest + RTL + jsdom | 15 test files (`UI-01`..`UI-30`, auth) | **98 / 98** | **PASS** |
| **Playwright Multi-Device E2E** | Playwright Chromium | Desktop (1280x800), Tablet (820x1180), Mobile (375x667) | **30 / 30** | **PASS** |
| **Total Automated Tests** | — | — | **268 / 268** | **PASS (100%)** |

---

## 📑 Lab 3 Engineering Documentation Links

- [`docs/lab-03/specification.md`](docs/lab-03/specification.md) — Canonical Sprint Engineering Specification (AC-01..25, BR-01..28)
- [`docs/lab-03/api-spec.md`](docs/lab-03/api-spec.md) — REST API Specification, Authorization Matrix & Status Transition Matrix
- [`docs/lab-03/ui-spec.md`](docs/lab-03/ui-spec.md) — Zen Green UI Specification, Responsive Design & Visual Inspection Checklist
- [`docs/lab-03/tests.md`](docs/lab-03/tests.md) — Test Strategy & Dual AC/BR Traceability Matrices
- [`docs/lab-03/ai-use.md`](docs/lab-03/ai-use.md) — AI Agent Reflections & Representative Prompt Logs
- [`docs/lab-03/reviewer.md`](docs/lab-03/reviewer.md) — Verbatim Peer Review Records & Approval Evidence
