# Lab 1 — AI Use and Reflection

**LLM/agent used:** Gemini

## Selected key prompts (6–10)
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Summarise the project scope and technical requirements for initial project setup (React + Vite + Bootstrap client, Express + TS server, Prisma PostgreSQL DB, Vitest/Supertest configuration). | Used the structured scope to outline the full-stack repository structure and establish initial base configurations. |
| 2 | Help generate a comprehensive `.env.example` template and project setup checklist for both client and server packages. | Added `.env.example` and used the checklist to verify environment setup procedures. |
| 3 | Implement `GET /api/health` endpoint in Express backend returning status ok and service name with HTTP 200 response. | Created health check route handler and verified JSON response format. |
| 4 | Write a Supertest test to verify that `GET /api/health` returns HTTP 200 and expected status response. | Added backend Supertest test suite for health check endpoint. |
| 5 | Define Prisma Category schema model (id, name, createdAt) and write an idempotent seed script for four request categories. | Created Category table schema, ran migration, and populated database with initial categories safely. |
| 6 | Implement `GET /api/categories` endpoint returning seeded categories from PostgreSQL database through Prisma in ID order. | Created categories REST route and verified response data using Supertest. |
| 7 | Build React UI component with `[Check System]` button handling loading state, success Online state with categories, and Offline error state. | Implemented frontend state management and API integration logic in `App.tsx`. |
| 8 | Write Vitest unit tests in `App.test.tsx` using `vi.spyOn` to mock API success and failure states, replacing skipped tests. | Updated frontend unit tests to achieve 100% test pass rate for heading, Online state, and Offline error state. |

## Reflection
Using Gemini in Lab 1 helped me develop the project more efficiently, from setting up the project structure and database to implementing APIs and writing tests. AI was especially useful for explaining technical concepts and providing code examples. However, I learned that I should not rely on AI-generated code without checking it.
