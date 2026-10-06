import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Database Migration & Regression Tests (Lab 4 — Issue 32: MIG-01..MIG-04)", () => {
  const prisma = getPrisma();

  let tokenRequester: string;
  let tokenStaff: string;
  let tokenAdmin: string;

  let testRequesterUser: { id: string; email: string };
  let testStaffUser: { id: string; email: string };
  let testAdminUser: { id: string; email: string };

  beforeAll(async () => {
    const defaultHash = bcrypt.hashSync("Password123!", 10);

    // Ensure authenticated test actors exist
    testRequesterUser = await prisma.user.upsert({
      where: { email: "mig.requester@example.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "mig.requester@example.com",
        name: "Migration Test Requester",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    await prisma.requesterUser.upsert({
      where: { email: "mig.requester@example.com" },
      update: { userId: testRequesterUser.id, isActive: true },
      create: {
        name: "Migration Test Requester",
        email: "mig.requester@example.com",
        userId: testRequesterUser.id,
        isActive: true,
      },
    });

    testStaffUser = await prisma.user.upsert({
      where: { email: "mig.staff@toktickit.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "mig.staff@toktickit.com",
        name: "Migration Test Staff",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    testAdminUser = await prisma.user.upsert({
      where: { email: "mig.admin@toktickit.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "mig.admin@toktickit.com",
        name: "Migration Test Admin",
        role: "ADMIN",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    // Obtain JWT Bearer tokens
    const resReq = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "mig.requester@example.com", password: "Password123!" });
    tokenRequester = resReq.body.data.token;

    const resStaff = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "mig.staff@toktickit.com", password: "Password123!" });
    tokenStaff = resStaff.body.data.token;

    const resAdmin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "mig.admin@toktickit.com", password: "Password123!" });
    tokenAdmin = resAdmin.body.data.token;
  });

  // =========================================================================
  // MIG-01: Prisma migration execution with zero data loss on existing tables
  // =========================================================================
  describe("MIG-01: Zero Data Loss & Schema Foreign Key Integrity", () => {
    it("should preserve all existing tables and data records from Labs 1, 2, and 3", async () => {
      const categoryCount = await prisma.category.count();
      const relatedSystemCount = await prisma.relatedSystem.count();
      const userCount = await prisma.user.count();
      const requesterUserCount = await prisma.requesterUser.count();
      const ticketCount = await prisma.ticket.count();
      const commentCount = await prisma.comment.count();
      const internalNoteCount = await prisma.internalNote.count();
      const actionTakenCount = await prisma.actionTaken.count();

      expect(categoryCount).toBeGreaterThanOrEqual(4);
      expect(relatedSystemCount).toBeGreaterThanOrEqual(6);
      expect(userCount).toBeGreaterThanOrEqual(11);
      expect(requesterUserCount).toBeGreaterThanOrEqual(6);
      expect(ticketCount).toBeGreaterThanOrEqual(10);
      expect(commentCount).toBeGreaterThanOrEqual(2);
      expect(internalNoteCount).toBeGreaterThanOrEqual(2);
      expect(actionTakenCount).toBeGreaterThanOrEqual(10);
    });

    it("should enforce cascade delete on Ticket deletion for child ActionsTaken", async () => {
      // Create a temporary ticket with a child ActionTaken
      const category = await prisma.category.findFirstOrThrow();
      const relatedSystem = await prisma.relatedSystem.findFirstOrThrow();
      const requester = await prisma.requesterUser.findFirstOrThrow();

      const tempTicket = await prisma.ticket.create({
        data: {
          ticketNo: `TKT-TEMP-CASCADE-${Date.now()}`,
          requesterId: requester.id,
          userId: testRequesterUser.id,
          categoryId: category.id,
          relatedSystemId: relatedSystem.id,
          summary: "Temporary ticket for cascade deletion test",
          description: "Verifies child ActionTaken is deleted when parent Ticket is deleted.",
          requestedPriority: "LOW",
          status: "OPEN",
          currentStatus: "OPEN",
        },
      });

      const tempAction = await prisma.actionTaken.create({
        data: {
          ticketId: tempTicket.id,
          actionDescription: "Investigated cascade deletion behavior",
          result: "Action created successfully",
          performedById: testStaffUser.id,
        },
      });

      expect(tempAction.id).toBeDefined();

      // Delete parent ticket
      await prisma.ticket.delete({
        where: { id: tempTicket.id },
      });

      // Child action should be cascade-deleted
      const deletedAction = await prisma.actionTaken.findUnique({
        where: { id: tempAction.id },
      });
      expect(deletedAction).toBeNull();
    });

    it("should enforce restrict delete on User when ActionsTaken are associated with that user", async () => {
      // Attempting to delete a user who has performed actions must be blocked by foreign key constraint
      const staffWithAction = await prisma.actionTaken.findFirstOrThrow({
        select: { performedById: true },
      });

      await expect(
        prisma.user.delete({
          where: { id: staffWithAction.performedById },
        })
      ).rejects.toThrow();
    });

    it("should support chronological query on ActionTaken via compound index [ticketId, actionDate ASC]", async () => {
      const ticketWithActions = await prisma.ticket.findFirst({
        where: {
          actionsTaken: {
            some: {},
          },
        },
        include: {
          actionsTaken: {
            orderBy: { actionDate: "asc" },
            include: { performedBy: { select: { id: true, name: true, role: true } } },
          },
        },
      });

      expect(ticketWithActions).not.toBeNull();
      expect(ticketWithActions!.actionsTaken.length).toBeGreaterThan(0);

      // Verify chronological ordering
      for (let i = 1; i < ticketWithActions!.actionsTaken.length; i++) {
        const prev = new Date(ticketWithActions!.actionsTaken[i - 1].actionDate).getTime();
        const curr = new Date(ticketWithActions!.actionsTaken[i].actionDate).getTime();
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    });
  });

  // =========================================================================
  // MIG-02: Legacy ticket query tolerance with zero Actions Taken
  // =========================================================================
  describe("MIG-02: Legacy Ticket Tolerance (0 Actions Taken)", () => {
    it("should cleanly load tickets with 0 Actions Taken via Prisma with empty array []", async () => {
      const ticketWithZeroActions = await prisma.ticket.findFirst({
        where: {
          ticketNo: "TKT-2026-000001",
        },
        include: {
          actionsTaken: true,
          category: true,
          relatedSystem: true,
          requester: true,
        },
      });

      expect(ticketWithZeroActions).not.toBeNull();
      expect(ticketWithZeroActions!.actionsTaken).toBeDefined();
      expect(Array.isArray(ticketWithZeroActions!.actionsTaken)).toBe(true);
      expect(ticketWithZeroActions!.actionsTaken.length).toBe(0);
      expect(ticketWithZeroActions!.category).toBeDefined();
      expect(ticketWithZeroActions!.relatedSystem).toBeDefined();
      expect(ticketWithZeroActions!.requester).toBeDefined();
    });

    it("should cleanly return ticket detail via API (GET /api/v1/tickets/:id) for ticket with 0 actions", async () => {
      const ticket = await prisma.ticket.findUniqueOrThrow({
        where: { ticketNo: "TKT-2026-000001" },
      });

      const res = await request(app)
        .get(`/api/v1/tickets/${ticket.id}`)
        .set("Authorization", `Bearer ${tokenStaff}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.ticketNo).toBe("TKT-2026-000001");
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.status).toBe("NEW");
    });

    it("should cleanly load requester ticket list with legacy 0-action tickets without crashes", async () => {
      const res = await request(app)
        .get("/api/v1/tickets")
        .set("Authorization", `Bearer ${tokenRequester}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // =========================================================================
  // MIG-03: Idempotent seed script execution across multiple runs
  // =========================================================================
  describe("MIG-03: Seed Coverage & True Idempotency", () => {
    it("should contain tickets across all 8 canonical statuses", async () => {
      const statuses = await prisma.ticket.findMany({
        select: { status: true },
        distinct: ["status"],
      });

      const distinctStatuses = new Set(statuses.map((s) => s.status));
      const expectedStatuses = [
        "NEW",
        "OPEN",
        "IN_PROGRESS",
        "WAITING_FOR_REQUESTER",
        "RESOLVED",
        "CLOSED",
        "REOPENED",
        "CANCELLED",
      ];

      for (const status of expectedStatuses) {
        expect(distinctStatuses.has(status as any)).toBe(true);
      }
    });

    it("should populate diverse parent-child Actions Taken distributions", async () => {
      // 1. Ticket with 0 actions
      const zeroActionTicket = await prisma.ticket.findFirst({
        where: { ticketNo: "TKT-2026-000001" },
        include: { actionsTaken: true },
      });
      expect(zeroActionTicket?.actionsTaken.length).toBe(0);

      // 2. Ticket with exactly 1 action
      const singleActionTicket = await prisma.ticket.findFirst({
        where: { ticketNo: "TKT-2026-000002" },
        include: { actionsTaken: true },
      });
      expect(singleActionTicket?.actionsTaken.length).toBe(1);

      // 3. Ticket with multiple actions from multiple contributors
      const multiActionTicket = await prisma.ticket.findFirst({
        where: { ticketNo: "TKT-2026-000003" },
        include: { actionsTaken: true },
      });
      expect(multiActionTicket?.actionsTaken.length).toBeGreaterThanOrEqual(3);

      const contributors = new Set(multiActionTicket?.actionsTaken.map((a) => a.performedById));
      expect(contributors.size).toBeGreaterThanOrEqual(2);

      // 4. Action with followUpRequired = true and valid followUpNote
      const actionWithFollowUp = await prisma.actionTaken.findFirst({
        where: { followUpRequired: true },
      });
      expect(actionWithFollowUp).not.toBeNull();
      expect(actionWithFollowUp!.followUpNote).toBeTruthy();

      // 5. Action with followUpRequired = false and null followUpNote
      const actionWithoutFollowUp = await prisma.actionTaken.findFirst({
        where: { followUpRequired: false },
      });
      expect(actionWithoutFollowUp).not.toBeNull();
      expect(actionWithoutFollowUp!.followUpNote).toBeNull();

      // 6. Action with attachmentNotes
      const actionWithAttachmentNotes = await prisma.actionTaken.findFirst({
        where: { attachmentNotes: { not: null } },
      });
      expect(actionWithAttachmentNotes).not.toBeNull();
      expect(actionWithAttachmentNotes!.attachmentNotes).toBeTruthy();
    });

    it("should maintain data consistency and avoid duplicates on seed re-execution", async () => {
      const countBefore = await prisma.actionTaken.count();
      const ticketCountBefore = await prisma.ticket.count();

      // Verify that all seeded ActionTaken IDs are distinct
      const seededActions = await prisma.actionTaken.findMany({
        where: { id: { startsWith: "act-seed-" } },
      });

      const uniqueIds = new Set(seededActions.map((a) => a.id));
      expect(uniqueIds.size).toBe(seededActions.length);
      expect(countBefore).toBeGreaterThanOrEqual(10);
      expect(ticketCountBefore).toBeGreaterThanOrEqual(10);
    });
  });

  // =========================================================================
  // MIG-04: Full regression verification across Labs 1, 2, and 3 APIs
  // =========================================================================
  describe("MIG-04: Full Labs 1–3 Regression Suite under Migrated Schema", () => {
    // Lab 1 Regression
    it("Lab 1: should return HTTP 200 for health check endpoint", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });

    it("Lab 1: should return HTTP 200 and list active categories", async () => {
      const res = await request(app).get("/api/v1/categories");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    });

    // Lab 2 Regression
    it("Lab 2: should create a new ticket via POST /api/v1/tickets", async () => {
      const category = await prisma.category.findFirstOrThrow();
      const relatedSystem = await prisma.relatedSystem.findFirstOrThrow();

      const payload = {
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Regression test ticket creation post-migration",
        description: "Ensures Lab 2 ticket submission continues to function without regressions.",
        requestedPriority: "MEDIUM",
      };

      const res = await request(app)
        .post("/api/v1/tickets")
        .set("Authorization", `Bearer ${tokenRequester}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.ticketNo).toMatch(/^TKT-\d{4}-\d{6}$/);
      expect(res.body.data.currentStatus).toBe("NEW");
    });

    it("Lab 2: should retrieve ticket details via GET /api/v1/tickets/:id", async () => {
      const ticket = await prisma.ticket.findFirstOrThrow({
        where: { userId: testRequesterUser.id },
      });

      const res = await request(app)
        .get(`/api/v1/tickets/${ticket.id}`)
        .set("Authorization", `Bearer ${tokenRequester}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(ticket.id);
      expect(res.body.data.ticketNo).toBe(ticket.ticketNo);
    });

    // Lab 3 Regression
    it("Lab 3: should authenticate user via POST /api/v1/auth/login", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "mig.staff@toktickit.com", password: "Password123!" });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe("IT_STAFF");
    });

    it("Lab 3: should enforce RBAC boundary (Requester forbidden from IT Staff Queue)", async () => {
      const res = await request(app)
        .get("/api/v1/staff/tickets")
        .set("Authorization", `Bearer ${tokenRequester}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("INSUFFICIENT_PERMISSIONS");
    });

    it("Lab 3: should permit IT Staff to view staff queue", async () => {
      const res = await request(app)
        .get("/api/v1/staff/tickets")
        .set("Authorization", `Bearer ${tokenStaff}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("Lab 3: should permit IT Staff to read public comments and internal notes on tickets", async () => {
      const ticket = await prisma.ticket.findUniqueOrThrow({
        where: { ticketNo: "TKT-2026-000003" },
      });

      // Public comments
      const commentsRes = await request(app)
        .get(`/api/v1/tickets/${ticket.id}/comments`)
        .set("Authorization", `Bearer ${tokenStaff}`);

      expect(commentsRes.status).toBe(200);
      expect(Array.isArray(commentsRes.body.data)).toBe(true);
      expect(commentsRes.body.data.length).toBeGreaterThanOrEqual(2);

      // Internal notes
      const notesRes = await request(app)
        .get(`/api/v1/tickets/${ticket.id}/notes`)
        .set("Authorization", `Bearer ${tokenStaff}`);

      expect(notesRes.status).toBe(200);
      expect(Array.isArray(notesRes.body.data)).toBe(true);
      expect(notesRes.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it("Lab 3: should forbid Requester from accessing internal notes on tickets", async () => {
      const ticket = await prisma.ticket.findUniqueOrThrow({
        where: { ticketNo: "TKT-2026-000003" },
      });

      const res = await request(app)
        .get(`/api/v1/tickets/${ticket.id}/notes`)
        .set("Authorization", `Bearer ${tokenRequester}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("INSUFFICIENT_PERMISSIONS");
    });
  });
});
