import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { TicketStatusType } from "../../src/services/ticket-workflow.service.js";

describe("Ticket Workflow & Status Lifecycle API Tests (Lab 4 — Issue 34: API-13..API-22)", () => {
  const prisma = getPrisma();

  let tokenRequesterA: string;
  let tokenRequesterB: string;
  let tokenStaff1: string;
  let tokenStaff2: string;
  let tokenAdmin: string;

  let requesterAUser: { id: string; email: string };
  let requesterBUser: { id: string; email: string };
  let staff1User: { id: string; email: string };
  let staff2User: { id: string; email: string };
  let adminUser: { id: string; email: string };

  let categoryId: number;
  let relatedSystemId: number;
  let reqAProfileId: number;
  let reqBProfileId: number;

  beforeAll(async () => {
    const defaultHash = bcrypt.hashSync("Password123!", 10);

    // 1. Setup Users
    requesterAUser = await prisma.user.upsert({
      where: { email: "wf.requestera@example.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "wf.requestera@example.com",
        name: "Workflow Requester Alpha",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    const reqAProfile = await prisma.requesterUser.upsert({
      where: { email: "wf.requestera@example.com" },
      update: { userId: requesterAUser.id, isActive: true },
      create: {
        name: "Workflow Requester Alpha",
        email: "wf.requestera@example.com",
        userId: requesterAUser.id,
        isActive: true,
      },
    });
    reqAProfileId = reqAProfile.id;

    requesterBUser = await prisma.user.upsert({
      where: { email: "wf.requesterb@example.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "wf.requesterb@example.com",
        name: "Workflow Requester Beta",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    const reqBProfile = await prisma.requesterUser.upsert({
      where: { email: "wf.requesterb@example.com" },
      update: { userId: requesterBUser.id, isActive: true },
      create: {
        name: "Workflow Requester Beta",
        email: "wf.requesterb@example.com",
        userId: requesterBUser.id,
        isActive: true,
      },
    });
    reqBProfileId = reqBProfile.id;

    staff1User = await prisma.user.upsert({
      where: { email: "wf.staff1@toktickit.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "wf.staff1@toktickit.com",
        name: "Workflow Staff 1",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    staff2User = await prisma.user.upsert({
      where: { email: "wf.staff2@toktickit.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "wf.staff2@toktickit.com",
        name: "Workflow Staff 2",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    adminUser = await prisma.user.upsert({
      where: { email: "wf.admin@toktickit.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "wf.admin@toktickit.com",
        name: "Workflow Admin",
        role: "ADMIN",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    const cat = await prisma.category.findFirstOrThrow();
    categoryId = cat.id;

    const sys = await prisma.relatedSystem.findFirstOrThrow();
    relatedSystemId = sys.id;

    // Tokens
    const resA = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "wf.requestera@example.com", password: "Password123!" });
    tokenRequesterA = resA.body.data.token;

    const resB = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "wf.requesterb@example.com", password: "Password123!" });
    tokenRequesterB = resB.body.data.token;

    const resStaff1 = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "wf.staff1@toktickit.com", password: "Password123!" });
    tokenStaff1 = resStaff1.body.data.token;

    const resStaff2 = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "wf.staff2@toktickit.com", password: "Password123!" });
    tokenStaff2 = resStaff2.body.data.token;

    const resAdmin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "wf.admin@toktickit.com", password: "Password123!" });
    tokenAdmin = resAdmin.body.data.token;
  });

  // Helper to create fresh test ticket
  async function createTestTicket(status: TicketStatusType, requester = "A") {
    const isA = requester === "A";
    return await prisma.ticket.create({
      data: {
        ticketNo: `TKT-WF-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        requesterId: isA ? reqAProfileId : reqBProfileId,
        userId: isA ? requesterAUser.id : requesterBUser.id,
        categoryId,
        relatedSystemId,
        summary: `Workflow ticket in ${status}`,
        description: `Detailed description for status ${status}`,
        requestedPriority: "MEDIUM",
        status: status as any,
        currentStatus: status as any,
      },
    });
  }

  // =========================================================================
  // API-13: Complete Permitted Status Transition Matrix (All 18 Valid Transitions)
  // =========================================================================
  describe("API-13: Complete Permitted Status Transition Matrix (18 Transitions)", () => {
    const validTransitions: Array<{ from: TicketStatusType; to: TicketStatusType }> = [
      // NEW (2)
      { from: "NEW", to: "OPEN" },
      { from: "NEW", to: "CANCELLED" },
      // OPEN (4)
      { from: "OPEN", to: "IN_PROGRESS" },
      { from: "OPEN", to: "WAITING_FOR_REQUESTER" },
      { from: "OPEN", to: "RESOLVED" },
      { from: "OPEN", to: "CANCELLED" },
      // IN_PROGRESS (3)
      { from: "IN_PROGRESS", to: "WAITING_FOR_REQUESTER" },
      { from: "IN_PROGRESS", to: "RESOLVED" },
      { from: "IN_PROGRESS", to: "CANCELLED" },
      // WAITING_FOR_REQUESTER (3)
      { from: "WAITING_FOR_REQUESTER", to: "IN_PROGRESS" },
      { from: "WAITING_FOR_REQUESTER", to: "RESOLVED" },
      { from: "WAITING_FOR_REQUESTER", to: "CANCELLED" },
      // RESOLVED (2)
      { from: "RESOLVED", to: "CLOSED" },
      { from: "RESOLVED", to: "REOPENED" },
      // REOPENED (4)
      { from: "REOPENED", to: "IN_PROGRESS" },
      { from: "REOPENED", to: "WAITING_FOR_REQUESTER" },
      { from: "REOPENED", to: "RESOLVED" },
      { from: "REOPENED", to: "CANCELLED" },
    ];

    it("verifies there are exactly 18 permitted transitions defined", () => {
      expect(validTransitions).toHaveLength(18);
    });

    for (const { from, to } of validTransitions) {
      it(`should permit transition from ${from} to ${to} (HTTP 200)`, async () => {
        const ticket = await createTestTicket(from);

        const res = await request(app)
          .patch(`/api/v1/tickets/${ticket.id}/status`)
          .set("Authorization", `Bearer ${tokenStaff1}`)
          .send({
            status: to,
            expectedUpdatedAt: ticket.updatedAt.toISOString(),
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.previousStatus).toBe(from);
        expect(res.body.data.status).toBe(to);

        // Verify database persistence
        const dbTicket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
        expect(dbTicket.status).toBe(to);
        expect(dbTicket.currentStatus).toBe(to);
      });
    }
  });

  // =========================================================================
  // API-13b, API-13c, API-13d, API-13e: Resolution Gate Backend Enforcement
  // =========================================================================
  describe("Resolution Gate Enforcement (API-13b..API-13e)", () => {
    it("API-13b: Valid Resolution Gate Transition from OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER to RESOLVED", async () => {
      const eligibleStatuses: TicketStatusType[] = ["OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER"];

      for (const status of eligibleStatuses) {
        const ticket = await createTestTicket(status);
        const res = await request(app)
          .patch(`/api/v1/tickets/${ticket.id}/status`)
          .set("Authorization", `Bearer ${tokenStaff1}`)
          .send({
            status: "RESOLVED",
            expectedUpdatedAt: ticket.updatedAt.toISOString(),
          });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe("RESOLVED");
      }
    });

    it("API-13c: Resolution Gate Rejection (Unauthorized Role) — Requester cannot transition ticket to RESOLVED", async () => {
      const ticket = await createTestTicket("IN_PROGRESS");

      const res = await request(app)
        .patch(`/api/v1/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenRequesterA}`)
        .send({
          status: "RESOLVED",
          expectedUpdatedAt: ticket.updatedAt.toISOString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("API-13d: Resolution Gate Rejection (Concurrency) — Stale expectedUpdatedAt returns 409", async () => {
      const ticket = await createTestTicket("IN_PROGRESS");
      const staleTimestamp = new Date("2021-01-01T00:00:00.000Z").toISOString();

      const res = await request(app)
        .patch(`/api/v1/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          status: "RESOLVED",
          expectedUpdatedAt: staleTimestamp,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("STALE_UPDATE_CONFLICT");
    });

    it("API-13e: Resolution Gate Rejection (Ineligible Status) — Transition to RESOLVED from NEW is rejected with 400", async () => {
      const ticket = await createTestTicket("NEW");

      const res = await request(app)
        .patch(`/api/v1/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          status: "RESOLVED",
          expectedUpdatedAt: ticket.updatedAt.toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });
  });

  // =========================================================================
  // API-14: Invalid Status Transition Matrix (Disallowed Moves)
  // =========================================================================
  describe("API-14: Invalid Status Transitions (HTTP 400 INVALID_STATUS_TRANSITION)", () => {
    const invalidMoves: Array<{ from: TicketStatusType; to: TicketStatusType }> = [
      { from: "NEW", to: "RESOLVED" },
      { from: "NEW", to: "CLOSED" },
      { from: "NEW", to: "IN_PROGRESS" },
      { from: "NEW", to: "WAITING_FOR_REQUESTER" },
      { from: "OPEN", to: "NEW" },
      { from: "OPEN", to: "CLOSED" },
      { from: "OPEN", to: "REOPENED" },
      { from: "IN_PROGRESS", to: "NEW" },
      { from: "IN_PROGRESS", to: "OPEN" },
      { from: "IN_PROGRESS", to: "CLOSED" },
      { from: "WAITING_FOR_REQUESTER", to: "NEW" },
      { from: "WAITING_FOR_REQUESTER", to: "OPEN" },
      { from: "WAITING_FOR_REQUESTER", to: "CLOSED" },
      { from: "RESOLVED", to: "NEW" },
      { from: "RESOLVED", to: "OPEN" },
      { from: "RESOLVED", to: "IN_PROGRESS" },
      { from: "RESOLVED", to: "CANCELLED" },
    ];

    for (const { from, to } of invalidMoves) {
      it(`should reject invalid transition from ${from} to ${to} with HTTP 400`, async () => {
        const ticket = await createTestTicket(from);

        const res = await request(app)
          .patch(`/api/v1/tickets/${ticket.id}/status`)
          .set("Authorization", `Bearer ${tokenStaff1}`)
          .send({
            status: to,
            expectedUpdatedAt: ticket.updatedAt.toISOString(),
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
      });
    }

    it("should reject self-transition (e.g. IN_PROGRESS to IN_PROGRESS) with HTTP 400", async () => {
      const ticket = await createTestTicket("IN_PROGRESS");

      const res = await request(app)
        .patch(`/api/v1/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          status: "IN_PROGRESS",
          expectedUpdatedAt: ticket.updatedAt.toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });
  });

  // =========================================================================
  // API-15 & API-16: Advisory Resolution Indicator (POST /resolve-indicator)
  // =========================================================================
  describe("Advisory Resolution Indicator (API-15, API-16, API-18b)", () => {
    it("API-15: should allow owning Requester to signal advisory resolution while formal status remains unchanged", async () => {
      const ticket = await createTestTicket("IN_PROGRESS", "A");

      const res = await request(app)
        .post(`/api/v1/tickets/${ticket.id}/resolve-indicator`)
        .set("Authorization", `Bearer ${tokenRequesterA}`)
        .send({
          expectedUpdatedAt: ticket.updatedAt.toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isResolvedByUser).toBe(true);
      expect(res.body.data.status).toBe("IN_PROGRESS"); // Formal status remains untouched (BR-10)

      // Verify DB persistence
      const dbTicket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
      expect(dbTicket.isRequesterResolved).toBe(true);
      expect(dbTicket.status).toBe("IN_PROGRESS");
    });

    it("API-16: should forbid Requester from indicating resolution on another user's ticket with HTTP 403 FORBIDDEN", async () => {
      // Ticket owned by Requester B, Requester A calls endpoint
      const ticketB = await createTestTicket("OPEN", "B");

      const res = await request(app)
        .post(`/api/v1/tickets/${ticketB.id}/resolve-indicator`)
        .set("Authorization", `Bearer ${tokenRequesterA}`)
        .send({
          expectedUpdatedAt: ticketB.updatedAt.toISOString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("API-18b: should reject advisory resolution indicator with stale expectedUpdatedAt with HTTP 409", async () => {
      const ticket = await createTestTicket("IN_PROGRESS", "A");
      const staleTimestamp = new Date("2020-01-01T00:00:00.000Z").toISOString();

      const res = await request(app)
        .post(`/api/v1/tickets/${ticket.id}/resolve-indicator`)
        .set("Authorization", `Bearer ${tokenRequesterA}`)
        .send({
          expectedUpdatedAt: staleTimestamp,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("STALE_UPDATE_CONFLICT");
    });
  });

  // =========================================================================
  // API-17: Requester Direct Status Mutation Rejection
  // =========================================================================
  it("API-17: should reject Requester attempting direct status change with HTTP 403 FORBIDDEN", async () => {
    const ticket = await createTestTicket("OPEN", "A");

    const res = await request(app)
      .patch(`/api/v1/tickets/${ticket.id}/status`)
      .set("Authorization", `Bearer ${tokenRequesterA}`)
      .send({
        status: "IN_PROGRESS",
        expectedUpdatedAt: ticket.updatedAt.toISOString(),
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  // =========================================================================
  // API-18: Stale Concurrency Collision on Status Transition
  // =========================================================================
  it("API-18: should reject status transition with stale expectedUpdatedAt with HTTP 409", async () => {
    const ticket = await createTestTicket("OPEN");
    const staleTimestamp = new Date("2022-01-01T00:00:00.000Z").toISOString();

    const res = await request(app)
      .patch(`/api/v1/tickets/${ticket.id}/status`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({
        status: "IN_PROGRESS",
        expectedUpdatedAt: staleTimestamp,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("STALE_UPDATE_CONFLICT");
  });

  // =========================================================================
  // API-19 & API-20: Ticket Closure & Terminal State Enforcement
  // =========================================================================
  describe("Terminal State Enforcement (API-19, API-20)", () => {
    it("API-19: should permit IT Staff to transition RESOLVED ticket to CLOSED (HTTP 200)", async () => {
      const ticket = await createTestTicket("RESOLVED");

      const res = await request(app)
        .patch(`/api/v1/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          status: "CLOSED",
          expectedUpdatedAt: ticket.updatedAt.toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("CLOSED");
    });

    it("API-20: should reject any transition attempt out of terminal CLOSED status with HTTP 400 TICKET_LOCKED", async () => {
      const ticket = await createTestTicket("CLOSED");

      const targets: TicketStatusType[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "REOPENED"];
      for (const target of targets) {
        const res = await request(app)
          .patch(`/api/v1/tickets/${ticket.id}/status`)
          .set("Authorization", `Bearer ${tokenStaff1}`)
          .send({
            status: target,
            expectedUpdatedAt: ticket.updatedAt.toISOString(),
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("TICKET_LOCKED");
      }
    });

    it("API-20 (Cancelled): should reject any transition attempt out of terminal CANCELLED status with HTTP 400 TICKET_LOCKED", async () => {
      const ticket = await createTestTicket("CANCELLED");

      const res = await request(app)
        .patch(`/api/v1/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          status: "OPEN",
          expectedUpdatedAt: ticket.updatedAt.toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("TICKET_LOCKED");
    });
  });

  // =========================================================================
  // API-21 & API-22: Reopening Resolved Tickets & Resume Workflow
  // =========================================================================
  describe("Reopening Resolved Tickets & Active Workflow (API-21, API-22)", () => {
    it("API-21: should permit IT Staff to transition RESOLVED ticket to REOPENED (HTTP 200)", async () => {
      const ticket = await createTestTicket("RESOLVED");

      const res = await request(app)
        .patch(`/api/v1/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          status: "REOPENED",
          expectedUpdatedAt: ticket.updatedAt.toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("REOPENED");
    });

    it("API-22: should permit transitions from REOPENED back into workflow (IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CANCELLED)", async () => {
      const permittedTargets: TicketStatusType[] = [
        "IN_PROGRESS",
        "WAITING_FOR_REQUESTER",
        "RESOLVED",
        "CANCELLED",
      ];

      for (const target of permittedTargets) {
        const ticket = await createTestTicket("REOPENED");

        const res = await request(app)
          .patch(`/api/v1/tickets/${ticket.id}/status`)
          .set("Authorization", `Bearer ${tokenStaff1}`)
          .send({
            status: target,
            expectedUpdatedAt: ticket.updatedAt.toISOString(),
          });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe(target);
      }
    });
  });

  // =========================================================================
  // Mandatory Concurrency Timestamps Validation & Atomic Concurrency Race Tests
  // =========================================================================
  describe("Concurrency Guard Hardening & Atomic CAS Tests", () => {
    it("should reject PATCH /status when expectedUpdatedAt is missing with HTTP 400 VALIDATION_ERROR", async () => {
      const ticket = await createTestTicket("OPEN");

      const res = await request(app)
        .patch(`/api/v1/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          status: "IN_PROGRESS",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject POST /resolve-indicator when expectedUpdatedAt is missing with HTTP 400 VALIDATION_ERROR", async () => {
      const ticket = await createTestTicket("OPEN", "A");

      const res = await request(app)
        .post(`/api/v1/tickets/${ticket.id}/resolve-indicator`)
        .set("Authorization", `Bearer ${tokenRequesterA}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject PATCH /status when expectedUpdatedAt is an invalid or non-ISO string with HTTP 400 VALIDATION_ERROR", async () => {
      const ticket = await createTestTicket("OPEN");

      const resInvalid = await request(app)
        .patch(`/api/v1/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          status: "IN_PROGRESS",
          expectedUpdatedAt: "not-an-iso-string",
        });

      expect(resInvalid.status).toBe(400);
      expect(resInvalid.body.success).toBe(false);
      expect(resInvalid.body.error.code).toBe("VALIDATION_ERROR");

      const resNonIso = await request(app)
        .patch(`/api/v1/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          status: "IN_PROGRESS",
          expectedUpdatedAt: "2026/10/09 12:00:00",
        });

      expect(resNonIso.status).toBe(400);
      expect(resNonIso.body.success).toBe(false);
      expect(resNonIso.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject POST /resolve-indicator when expectedUpdatedAt is an invalid or non-ISO string with HTTP 400 VALIDATION_ERROR", async () => {
      const ticket = await createTestTicket("OPEN", "A");

      const res = await request(app)
        .post(`/api/v1/tickets/${ticket.id}/resolve-indicator`)
        .set("Authorization", `Bearer ${tokenRequesterA}`)
        .send({
          expectedUpdatedAt: "2026/10/09",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject PATCH /status and POST /resolve-indicator when timestamp has invalid calendar date (e.g. Feb 31, Apr 31) with HTTP 400 VALIDATION_ERROR", async () => {
      const ticket = await createTestTicket("OPEN", "A");

      // February 31 is calendar-impossible
      const patchRes = await request(app)
        .patch(`/api/v1/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          status: "IN_PROGRESS",
          expectedUpdatedAt: "2026-02-31T12:00:00.000Z",
        });

      expect(patchRes.status).toBe(400);
      expect(patchRes.body.success).toBe(false);
      expect(patchRes.body.error.code).toBe("VALIDATION_ERROR");

      // April 31 is calendar-impossible
      const postRes = await request(app)
        .post(`/api/v1/tickets/${ticket.id}/resolve-indicator`)
        .set("Authorization", `Bearer ${tokenRequesterA}`)
        .send({
          expectedUpdatedAt: "2026-04-31T12:00:00.000Z",
        });

      expect(postRes.status).toBe(400);
      expect(postRes.body.success).toBe(false);
      expect(postRes.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should handle atomic race condition between two concurrent PATCH /status requests where exactly one succeeds", async () => {
      const ticket = await createTestTicket("OPEN");
      const baseUpdatedAt = ticket.updatedAt.toISOString();

      // Fire two concurrent transitions with identical expectedUpdatedAt
      const [res1, res2] = await Promise.all([
        request(app)
          .patch(`/api/v1/tickets/${ticket.id}/status`)
          .set("Authorization", `Bearer ${tokenStaff1}`)
          .send({
            status: "IN_PROGRESS",
            expectedUpdatedAt: baseUpdatedAt,
          }),
        request(app)
          .patch(`/api/v1/tickets/${ticket.id}/status`)
          .set("Authorization", `Bearer ${tokenStaff2}`)
          .send({
            status: "WAITING_FOR_REQUESTER",
            expectedUpdatedAt: baseUpdatedAt,
          }),
      ]);

      const statusCodes = [res1.status, res2.status].sort();
      expect(statusCodes).toEqual([200, 409]);

      const winnerRes = res1.status === 200 ? res1 : res2;
      expect(winnerRes.status).toBe(200);
      expect(winnerRes.body.success).toBe(true);

      const conflictRes = res1.status === 409 ? res1 : res2;
      expect(conflictRes.status).toBe(409);
      expect(conflictRes.body.success).toBe(false);
      expect(conflictRes.body.error.code).toBe("STALE_UPDATE_CONFLICT");
      expect(conflictRes.body.error.message).toContain("concurrently");
    });

    it("should reject the losing request with HTTP 409 STALE_UPDATE_CONFLICT even when both concurrent requests target the exact same status", async () => {
      const ticket = await createTestTicket("OPEN");
      const baseUpdatedAt = ticket.updatedAt.toISOString();

      // Fire two concurrent requests both targeting IN_PROGRESS with identical initial expectedUpdatedAt
      const [res1, res2] = await Promise.all([
        request(app)
          .patch(`/api/v1/tickets/${ticket.id}/status`)
          .set("Authorization", `Bearer ${tokenStaff1}`)
          .send({
            status: "IN_PROGRESS",
            expectedUpdatedAt: baseUpdatedAt,
          }),
        request(app)
          .patch(`/api/v1/tickets/${ticket.id}/status`)
          .set("Authorization", `Bearer ${tokenStaff2}`)
          .send({
            status: "IN_PROGRESS",
            expectedUpdatedAt: baseUpdatedAt,
          }),
      ]);

      const statusCodes = [res1.status, res2.status].sort();
      // Crucial: The second request must receive 409 STALE_UPDATE_CONFLICT, NOT 400 INVALID_STATUS_TRANSITION
      expect(statusCodes).toEqual([200, 409]);

      const winnerRes = res1.status === 200 ? res1 : res2;
      expect(winnerRes.status).toBe(200);
      expect(winnerRes.body.success).toBe(true);
      expect(winnerRes.body.data.status).toBe("IN_PROGRESS");

      const loserRes = res1.status === 409 ? res1 : res2;
      expect(loserRes.status).toBe(409);
      expect(loserRes.body.success).toBe(false);
      expect(loserRes.body.error.code).toBe("STALE_UPDATE_CONFLICT");
      expect(loserRes.body.error.message).toContain("concurrently");
    });
  });

  // =========================================================================
  // Unauthenticated Caller Rejection
  // =========================================================================
  it("should reject unauthenticated status patch or resolve indicator with HTTP 401 SESSION_INVALID", async () => {
    const ticket = await createTestTicket("OPEN");

    const patchRes = await request(app)
      .patch(`/api/v1/tickets/${ticket.id}/status`)
      .send({ status: "IN_PROGRESS", expectedUpdatedAt: ticket.updatedAt.toISOString() });
    expect(patchRes.status).toBe(401);
    expect(patchRes.body.error.code).toBe("SESSION_INVALID");

    const postRes = await request(app)
      .post(`/api/v1/tickets/${ticket.id}/resolve-indicator`)
      .send({ expectedUpdatedAt: ticket.updatedAt.toISOString() });
    expect(postRes.status).toBe(401);
    expect(postRes.body.error.code).toBe("SESSION_INVALID");
  });
});
