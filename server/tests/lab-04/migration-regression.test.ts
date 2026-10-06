import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { seedDatabase } from "../../prisma/seed.js";

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
    it("should preserve all known baseline records and relationships from Labs 1, 2, and 3", async () => {
      // 1. Lab 1 Baseline: 4 active categories and 6 active related systems
      const expectedCategories = ["Account and Access", "Hardware", "Software", "Network"];
      for (const name of expectedCategories) {
        const cat = await prisma.category.findUnique({ where: { name } });
        expect(cat).not.toBeNull();
        expect(cat!.isActive).toBe(true);
      }

      const expectedSystems = [
        "ERP System",
        "HR Portal",
        "Email & Calendar",
        "VPN & Remote Access",
        "Internal Wiki",
        "Finance & Accounting",
      ];
      for (const name of expectedSystems) {
        const sys = await prisma.relatedSystem.findUnique({ where: { name } });
        expect(sys).not.toBeNull();
        expect(sys!.isActive).toBe(true);
      }

      // 2. Lab 2 Baseline: RequesterUser legacy projections linked to User entities
      const legacyRequesters = ["alice@example.com", "bob@example.com", "jennifer.anderson@example.com"];
      for (const email of legacyRequesters) {
        const req = await prisma.requesterUser.findFirst({ where: { email } });
        expect(req).not.toBeNull();
        expect(req!.userId).toBeTruthy();

        const linkedUser = await prisma.user.findUnique({ where: { id: req!.userId! } });
        expect(linkedUser).not.toBeNull();
        expect(linkedUser!.email.toLowerCase()).toBe(email.toLowerCase());
      }

      // 3. Lab 2/3 Baseline: Known legacy tickets exist with correct attributes and intact relations
      const legacyTicket1 = await prisma.ticket.findUnique({
        where: { ticketNo: "TKT-2026-000001" },
        include: { category: true, relatedSystem: true, requester: true },
      });
      expect(legacyTicket1).not.toBeNull();
      expect(legacyTicket1!.status).toBe("NEW");
      expect(legacyTicket1!.category.name).toBe("Hardware");
      expect(legacyTicket1!.relatedSystem.name).toBe("Finance & Accounting");
      expect(legacyTicket1!.requester).toBeDefined();

      const legacyTicket3 = await prisma.ticket.findUnique({
        where: { ticketNo: "TKT-2026-000003" },
        include: { comments: true, notes: true, actionsTaken: true },
      });
      expect(legacyTicket3).not.toBeNull();
      expect(legacyTicket3!.status).toBe("IN_PROGRESS");
      expect(legacyTicket3!.itPriority).toBe("URGENT");
      expect(legacyTicket3!.comments.length).toBeGreaterThanOrEqual(2);
      expect(legacyTicket3!.notes.length).toBeGreaterThanOrEqual(2);

      // Comments & Notes baseline integrity
      const cmt1 = await prisma.comment.findUnique({ where: { id: "cmt-seed-001" } });
      expect(cmt1).not.toBeNull();
      expect(cmt1!.ticketId).toBe(legacyTicket3!.id);

      const note1 = await prisma.internalNote.findUnique({ where: { id: "note-seed-001" } });
      expect(note1).not.toBeNull();
      expect(note1!.ticketId).toBe(legacyTicket3!.id);

      // 4. Overall table counts are non-zero and preserved
      const userCount = await prisma.user.count();
      const ticketCount = await prisma.ticket.count();
      const actionTakenCount = await prisma.actionTaken.count();

      expect(userCount).toBeGreaterThanOrEqual(11);
      expect(ticketCount).toBeGreaterThanOrEqual(10);
      expect(actionTakenCount).toBeGreaterThanOrEqual(10);
    });

    it("should enforce cascade delete on Ticket deletion for child ActionsTaken", async () => {
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

      // Child action must be cascade-deleted
      const deletedAction = await prisma.actionTaken.findUnique({
        where: { id: tempAction.id },
      });
      expect(deletedAction).toBeNull();
    });

    it("should enforce ON DELETE RESTRICT on User specifically blocked by ActionTaken.performedById", async () => {
      const defaultHash = bcrypt.hashSync("Password123!", 10);
      const existingTicket = await prisma.ticket.findFirstOrThrow();

      // 1. Create a clean isolated user with ZERO comments, ZERO notes, ZERO tickets, ZERO revoked tokens
      const isolatedUser = await prisma.user.create({
        data: {
          email: `isolated.staff.${Date.now()}@toktickit.com`,
          name: "Isolated Staff Member",
          role: "IT_STAFF",
          isActive: true,
          passwordHash: defaultHash,
        },
      });

      // 2. Attach an ActionTaken solely referencing this isolated user
      const isolatedAction = await prisma.actionTaken.create({
        data: {
          ticketId: existingTicket.id,
          actionDescription: "Work logged by isolated staff for restrict foreign key test",
          result: "Action recorded",
          performedById: isolatedUser.id,
        },
      });

      // 3. Attempting to delete the isolated user must fail due to ActionTaken.performedById ON DELETE RESTRICT
      await expect(
        prisma.user.delete({
          where: { id: isolatedUser.id },
        })
      ).rejects.toThrow();

      // 4. Once the ActionTaken is removed, deletion of the isolated user must succeed
      await prisma.actionTaken.delete({
        where: { id: isolatedAction.id },
      });

      const deletedUser = await prisma.user.delete({
        where: { id: isolatedUser.id },
      });
      expect(deletedUser.id).toBe(isolatedUser.id);
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
  // MIG-03: Seed coverage & True Idempotency across Multiple Executions
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

    it("should execute seedDatabase() multiple times without duplicate keys or resetting ticket state", async () => {
      // 1. First execution of seedDatabase() to establish baseline
      const summary1 = await seedDatabase();
      expect(summary1.ticketsCount).toBeGreaterThanOrEqual(10);
      expect(summary1.actionsCount).toBeGreaterThanOrEqual(10);

      const actionsCount1 = await prisma.actionTaken.count();
      const ticketsCount1 = await prisma.ticket.count();
      const usersCount1 = await prisma.user.count();

      // Verify that Ticket 2 has a known initial description
      const tkt2Initial = await prisma.ticket.findUniqueOrThrow({
        where: { ticketNo: "TKT-2026-000002" },
      });
      const initialSummary = tkt2Initial.summary;

      // 2. Simulate operational modification: user edits the summary of Ticket 2
      const modifiedSummary = `${initialSummary} [TEST EDIT PRESERVED]`;
      await prisma.ticket.update({
        where: { ticketNo: "TKT-2026-000002" },
        data: { summary: modifiedSummary },
      });

      // 3. Second execution of seedDatabase()
      const summary2 = await seedDatabase();
      expect(summary2.ticketsCount).toBe(summary1.ticketsCount);
      expect(summary2.actionsCount).toBe(summary1.actionsCount);

      const actionsCount2 = await prisma.actionTaken.count();
      const ticketsCount2 = await prisma.ticket.count();
      const usersCount2 = await prisma.user.count();

      // Idempotency assertions: counts must not inflate
      expect(actionsCount2).toBe(actionsCount1);
      expect(ticketsCount2).toBe(ticketsCount1);
      expect(usersCount2).toBe(usersCount1);

      // Verify that existing ticket state was NOT overwritten by re-running the seed script
      const tkt2AfterSecondSeed = await prisma.ticket.findUniqueOrThrow({
        where: { ticketNo: "TKT-2026-000002" },
      });
      expect(tkt2AfterSecondSeed.summary).toBe(modifiedSummary);

      // Revert the temporary test summary modification
      await prisma.ticket.update({
        where: { ticketNo: "TKT-2026-000002" },
        data: { summary: initialSummary },
      });

      // Verify all seeded ActionTaken IDs are distinct
      const seededActions = await prisma.actionTaken.findMany({
        where: { id: { startsWith: "act-seed-" } },
      });
      const uniqueIds = new Set(seededActions.map((a) => a.id));
      expect(uniqueIds.size).toBe(seededActions.length);
    });
  });

  // =========================================================================
  // MIG-04: Labs 1–3 Migration Regression Smoke Suite
  // =========================================================================
  describe("MIG-04: Labs 1–3 Migration Regression Smoke Suite", () => {
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

    // Lab 2 Regression: Ticket Creation, Detail, My Tickets Filtering & Attachments
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

    it("Lab 2: should support search and filter query in My Tickets (GET /api/v1/tickets)", async () => {
      const res = await request(app)
        .get("/api/v1/tickets?search=Regression&status=NEW")
        .set("Authorization", `Bearer ${tokenRequester}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("Lab 2: should upload, retrieve via ticket detail, and download attachment on ticket", async () => {
      const ticket = await prisma.ticket.findFirstOrThrow({
        where: { userId: testRequesterUser.id },
      });

      const testBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

      const uploadRes = await request(app)
        .post(`/api/v1/tickets/${ticket.id}/attachments`)
        .set("Authorization", `Bearer ${tokenRequester}`)
        .attach("file", testBuffer, "diagnostic-screenshot.png");

      expect(uploadRes.status).toBe(201);
      expect(uploadRes.body.data).toBeDefined();
      expect(uploadRes.body.data.fileName).toBe("diagnostic-screenshot.png");

      // Verify attachment appears inside ticket detail query
      const detailRes = await request(app)
        .get(`/api/v1/tickets/${ticket.id}`)
        .set("Authorization", `Bearer ${tokenRequester}`);

      expect(detailRes.status).toBe(200);
      expect(Array.isArray(detailRes.body.data.attachments)).toBe(true);
      expect(
        detailRes.body.data.attachments.some(
          (a: { fileName: string }) => a.fileName === "diagnostic-screenshot.png"
        )
      ).toBe(true);

      // Verify attachment download endpoint
      const attachmentId = uploadRes.body.data.id;
      const downloadRes = await request(app)
        .get(`/api/v1/attachments/${attachmentId}/download`)
        .set("Authorization", `Bearer ${tokenRequester}`);

      expect(downloadRes.status).toBe(200);
    });

    // Lab 3 Regression: Auth, RBAC, Comments, Notes & Admin User Management
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

    it("Lab 3: should permit Administrator to manage users and forbid IT Staff", async () => {
      // 1. Admin access succeeds
      const adminRes = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${tokenAdmin}`);

      expect(adminRes.status).toBe(200);
      expect(Array.isArray(adminRes.body.data)).toBe(true);
      expect(adminRes.body.data.length).toBeGreaterThanOrEqual(10);

      // 2. IT Staff access is forbidden
      const staffRes = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${tokenStaff}`);

      expect(staffRes.status).toBe(403);
      expect(staffRes.body.error.code).toBe("INSUFFICIENT_PERMISSIONS");
    });
  });
});
