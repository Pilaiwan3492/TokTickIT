# TokTickIT — Full-Stack IT Service Desk

TokTickIT is an IT service desk web application for handling Account & Access, Hardware, Software, and Network support requests. Built with a full-stack TypeScript architecture using React, Express, Prisma ORM, and PostgreSQL.

---

## 🚀 Lab 2: Requester Ticketing MVP with UI Foundation

Lab 2 introduces the complete Requester-facing ticketing workflow:
- **Development Requester Selector**: Simulated user identity context (persisted in `localStorage`) enabling multi-user testing prior to full authentication in Lab 3.
- **Create Ticket**: Dynamic form with Category & Related System reference dropdowns, live character counters (0/150 for Summary, 0/2000 for Description), client/server validation, and official Ticket Number generation (`TKT-YYYY-XXXXXX`).
- **My Tickets**: Paginated ticket table scoped to the active Requester with keyword search (ticketNo, summary, description), category/priority/status filters, and 6 sorting options with secondary `id_desc` tie-breaking.
- **Ticket Detail**: Read-only overview screen styled in Zen Green theme with strict cross-requester ownership guards (`403 FORBIDDEN`).
- **Attachment Lifecycle**: Drag-and-drop file upload with strict constraints (JPG, JPEG, PNG, WEBP, PDF up to 5 MiB, maximum 5 active files per ticket), secure download stream, and soft removal with mandatory reason tracking.

---

## 📁 Project Structure

```text
TokTickIT/
├── client/                      # React 18 + TypeScript + Vite frontend
│   ├── src/
│   │   ├── context/             # RequesterContext (testing identity state)
│   │   ├── pages/               # CreateTicket, MyTickets, TicketDetail, RequesterSelector
│   │   └── App.tsx
│   └── tests/lab-02/            # Vitest + React Testing Library UI tests (34 tests)
├── server/                      # Node.js + Express + Prisma backend
│   ├── prisma/                  # schema.prisma & idempotent seed.ts
│   ├── src/
│   │   ├── controllers/         # ticket, attachment, category, requester controllers
│   │   ├── middlewares/         # ownership guard & requester validation
│   │   └── app.ts
│   ├── uploads/                 # Local attachment storage
│   └── tests/lab-02/            # Vitest + Supertest API contract tests (62 tests)
├── docs/lab-02/                 # Engineering Contract & Review Records
│   ├── specification.md         # Sprint Goal, Scope, FRs, BR-01 to BR-26, AC-01 to AC-20
│   ├── api-spec.md              # REST API Contract, status codes, query schemas
│   ├── ui-spec.md               # Zen Green UI specification & responsive design
│   ├── tests.md                 # Test plan, AC traceability, and execution logs
│   ├── reviewer.md              # Peer review records, feedback, and approvals
│   └── ai-use.md                # AI agent prompt log and engineering reflection
└── README.md
```

---

## 🛠️ Prerequisites

* **Node.js**: v18 or later (v20+ recommended)
* **PostgreSQL**: Running instance on localhost:5432 (or configured via `server/.env`)

---

## ⚙️ Setup & Running Instructions

### 1. Database & Backend Setup (`server/`)

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

---

## 🧪 Automated Testing (100% Pass Rate — 96/96 Tests)

Execute the full automated test suites with zero regressions:

```bash
# Backend test suite (62 passing tests across 7 suites)
cd server
npm test

# Frontend test suite (34 passing tests across 5 suites)
cd ../client
npm test
```

### Production Build & Type Check

```bash
cd server && npm run build
cd ../client && npm run build
```