import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Actions Taken API Tests (Lab 4 — Issue 33: API-01..API-12, PERF-02)", () => {
  const prisma = getPrisma();

  let tokenRequesterA: string;
  let tokenRequesterB: string;
  let tokenStaff1: string;
  let tokenStaff2: string;
  let tokenInactiveStaff: string;
  let tokenAdmin: string;

  let requesterAUser: { id: string; email: string };
  let requesterBUser: { id: string; email: string };
  let staff1User: { id: string; email: string };
  let staff2User: { id: string; email: string };
  let inactiveStaffUser: { id: string; email: string };
  let adminUser: { id: string; email: string };

  let testTicketAId: string;
  let testTicketBId: string;
  let closedTicketId: string;
  let cancelledTicketId: string;

  beforeAll(async () => {
    const defaultHash = bcrypt.hashSync("Password123!", 10);

    // 1. Setup Requester A & Profile
    requesterAUser = await prisma.user.upsert({
      where: { email: "act.requestera@example.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "act.requestera@example.com",
        name: "Requester Alpha",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    const reqAProfile = await prisma.requesterUser.upsert({
      where: { email: "act.requestera@example.com" },
      update: { userId: requesterAUser.id, isActive: true },
      create: {
        name: "Requester Alpha",
        email: "act.requestera@example.com",
        userId: requesterAUser.id,
        isActive: true,
      },
    });

    // 2. Setup Requester B & Profile
    requesterBUser = await prisma.user.upsert({
      where: { email: "act.requesterb@example.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "act.requesterb@example.com",
        name: "Requester Beta",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    const reqBProfile = await prisma.requesterUser.upsert({
      where: { email: "act.requesterb@example.com" },
      update: { userId: requesterBUser.id, isActive: true },
      create: {
        name: "Requester Beta",
        email: "act.requesterb@example.com",
        userId: requesterBUser.id,
        isActive: true,
      },
    });

    // 3. Setup IT Staff 1 & 2
    staff1User = await prisma.user.upsert({
      where: { email: "act.staff1@toktickit.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "act.staff1@toktickit.com",
        name: "Staff Member One",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    staff2User = await prisma.user.upsert({
      where: { email: "act.staff2@toktickit.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "act.staff2@toktickit.com",
        name: "Staff Member Two",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    // 4. Setup Inactive IT Staff
    inactiveStaffUser = await prisma.user.upsert({
      where: { email: "act.inactive.staff@toktickit.com" },
      update: { isActive: false, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "act.inactive.staff@toktickit.com",
        name: "Inactive Staff Member",
        role: "IT_STAFF",
        isActive: false,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    // 5. Setup Admin
    adminUser = await prisma.user.upsert({
      where: { email: "act.admin@toktickit.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "act.admin@toktickit.com",
        name: "Actions Admin",
        role: "ADMIN",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    // Fetch category and related system
    const category = await prisma.category.findFirstOrThrow();
    const relatedSystem = await prisma.relatedSystem.findFirstOrThrow();

    // 6. Setup Tickets
    // Ticket A owned by Requester A (OPEN)
    const ticketA = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-ACT-A-${Date.now()}`,
        requesterId: reqAProfile.id,
        userId: requesterAUser.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Ticket A for Actions Taken testing",
        description: "Standard open ticket owned by Requester A.",
        requestedPriority: "MEDIUM",
        status: "OPEN",
        currentStatus: "OPEN",
      },
    });
    testTicketAId = ticketA.id;

    // Ticket B owned by Requester B (OPEN)
    const ticketB = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-ACT-B-${Date.now() + 1}`,
        requesterId: reqBProfile.id,
        userId: requesterBUser.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Ticket B for Actions Taken testing",
        description: "Standard open ticket owned by Requester B.",
        requestedPriority: "HIGH",
        status: "OPEN",
        currentStatus: "OPEN",
      },
    });
    testTicketBId = ticketB.id;

    // Closed Ticket
    const ticketClosed = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-ACT-CLOSED-${Date.now() + 2}`,
        requesterId: reqAProfile.id,
        userId: requesterAUser.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Closed ticket for Actions Taken testing",
        description: "Terminal closed ticket.",
        requestedPriority: "LOW",
        status: "CLOSED",
        currentStatus: "CLOSED",
      },
    });
    closedTicketId = ticketClosed.id;

    // Cancelled Ticket
    const ticketCancelled = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-ACT-CANCELLED-${Date.now() + 3}`,
        requesterId: reqAProfile.id,
        userId: requesterAUser.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Cancelled ticket for Actions Taken testing",
        description: "Terminal cancelled ticket.",
        requestedPriority: "LOW",
        status: "CANCELLED",
        currentStatus: "CANCELLED",
      },
    });
    cancelledTicketId = ticketCancelled.id;

    // Authenticate and get Bearer tokens
    const resA = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "act.requestera@example.com", password: "Password123!" });
    tokenRequesterA = resA.body.data.token;

    const resB = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "act.requesterb@example.com", password: "Password123!" });
    tokenRequesterB = resB.body.data.token;

    const resStaff1 = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "act.staff1@toktickit.com", password: "Password123!" });
    tokenStaff1 = resStaff1.body.data.token;

    const resStaff2 = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "act.staff2@toktickit.com", password: "Password123!" });
    tokenStaff2 = resStaff2.body.data.token;

    const resAdmin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "act.admin@toktickit.com", password: "Password123!" });
    tokenAdmin = resAdmin.body.data.token;

    // Temporarily activate inactive staff to sign valid token, then set inactive
    await prisma.user.update({
      where: { id: inactiveStaffUser.id },
      data: { isActive: true },
    });
    const resInactive = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "act.inactive.staff@toktickit.com", password: "Password123!" });
    tokenInactiveStaff = resInactive.body.data.token;
    await prisma.user.update({
      where: { id: inactiveStaffUser.id },
      data: { isActive: false },
    });
  });

  // =========================================================================
  // API-01: IT Staff creates valid Action Taken on accessible ticket
  // =========================================================================
  it("API-01: should allow IT Staff to create valid Action Taken with auto-bound performedBy", async () => {
    const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: testTicketAId } });

    const payload = {
      actionDate: "2026-10-01T10:00:00.000Z",
      actionDescription: "Ran hardware diagnostic utilities on system motherboard.",
      result: "Passed all memory and bus integrity checks.",
      followUpRequired: true,
      followUpNote: "Check CMOS battery voltage if time drifts.",
      attachmentNotes: "diag_bus_log.txt",
      expectedTicketUpdatedAt: ticket.updatedAt.toISOString(),
    };

    const res = await request(app)
      .post(`/api/v1/tickets/${testTicketAId}/actions-taken`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.ticketId).toBe(testTicketAId);
    expect(res.body.data.actionDescription).toBe(payload.actionDescription);
    expect(res.body.data.result).toBe(payload.result);
    expect(res.body.data.followUpRequired).toBe(true);
    expect(res.body.data.followUpNote).toBe(payload.followUpNote);
    expect(res.body.data.attachmentNotes).toBe(payload.attachmentNotes);

    // Verify performedBy is auto-bound to authenticated user (BR-03)
    expect(res.body.data.performedBy).toBeDefined();
    expect(res.body.data.performedBy.id).toBe(staff1User.id);
    expect(res.body.data.performedBy.name).toBe("Staff Member One");
    expect(res.body.data.performedBy.role).toBe("IT_STAFF");
  });

  // =========================================================================
  // Mandatory Concurrency Timestamps Validation (POST & PATCH)
  // =========================================================================
  it("should reject Action Taken creation with HTTP 400 VALIDATION_ERROR when expectedTicketUpdatedAt is omitted", async () => {
    const res = await request(app)
      .post(`/api/v1/tickets/${testTicketAId}/actions-taken`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({
        actionDescription: "Attempt without mandatory timestamp",
        result: "Should fail validation",
        followUpRequired: false,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject Action Taken update with HTTP 400 VALIDATION_ERROR when expectedUpdatedAt is omitted", async () => {
    const existingAction = await prisma.actionTaken.findFirstOrThrow({
      where: { ticketId: testTicketAId },
    });

    const res = await request(app)
      .patch(`/api/v1/tickets/${testTicketAId}/actions-taken/${existingAction.id}`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({
        result: "Attempt update without expectedUpdatedAt",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // =========================================================================
  // API-02, API-02b, API-02c: Follow-up note validation
  // =========================================================================
  it("API-02: should reject Action Taken creation with HTTP 400 FOLLOWUP_NOTE_REQUIRED when followUpRequired is true but followUpNote is empty", async () => {
    const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: testTicketAId } });

    const res = await request(app)
      .post(`/api/v1/tickets/${testTicketAId}/actions-taken`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({
        actionDescription: "Inspected power adapter",
        result: "Voltage normal",
        followUpRequired: true,
        followUpNote: "",
        expectedTicketUpdatedAt: ticket.updatedAt.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("FOLLOWUP_NOTE_REQUIRED");
  });

  it("API-02b: should reject Action Taken creation with HTTP 400 FOLLOWUP_NOTE_REQUIRED when followUpNote is whitespace-only", async () => {
    const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: testTicketAId } });

    const res = await request(app)
      .post(`/api/v1/tickets/${testTicketAId}/actions-taken`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({
        actionDescription: "Inspected display cables",
        result: "No physical damage",
        followUpRequired: true,
        followUpNote: "     \t \n ",
        expectedTicketUpdatedAt: ticket.updatedAt.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("FOLLOWUP_NOTE_REQUIRED");
  });

  it("API-02c: should permit Action Taken creation when followUpRequired is false and followUpNote is omitted", async () => {
    const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: testTicketAId } });

    const res = await request(app)
      .post(`/api/v1/tickets/${testTicketAId}/actions-taken`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({
        actionDescription: "Rebooted workstation cleanly",
        result: "System came back up normally",
        followUpRequired: false,
        expectedTicketUpdatedAt: ticket.updatedAt.toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.followUpRequired).toBe(false);
    expect(res.body.data.followUpNote).toBeNull();
  });

  // =========================================================================
  // API-03, API-04: Role Authorization (Requester forbidden from POST / PATCH)
  // =========================================================================
  it("API-03: should reject Requester attempting to create Action Taken with HTTP 403 FORBIDDEN", async () => {
    const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: testTicketAId } });

    const res = await request(app)
      .post(`/api/v1/tickets/${testTicketAId}/actions-taken`)
      .set("Authorization", `Bearer ${tokenRequesterA}`)
      .send({
        actionDescription: "Requester trying to record action",
        result: "Should be blocked",
        expectedTicketUpdatedAt: ticket.updatedAt.toISOString(),
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("API-04: should reject Requester attempting to update Action Taken with HTTP 403 FORBIDDEN", async () => {
    const existingAction = await prisma.actionTaken.findFirstOrThrow({
      where: { ticketId: testTicketAId },
    });

    const res = await request(app)
      .patch(`/api/v1/tickets/${testTicketAId}/actions-taken/${existingAction.id}`)
      .set("Authorization", `Bearer ${tokenRequesterA}`)
      .send({
        actionDescription: "Requester tampering with existing action",
        expectedUpdatedAt: existingAction.updatedAt.toISOString(),
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  // =========================================================================
  // API-05, API-05b, API-05c: IT Staff updates Action Taken & Performer Immutability
  // =========================================================================
  it("API-05: should permit IT Staff to update Action Taken details while preserving original performedById", async () => {
    const existingAction = await prisma.actionTaken.findFirstOrThrow({
      where: { ticketId: testTicketAId },
    });
    const originalAuthorId = existingAction.performedById;

    // Staff 2 updates an action created by Staff 1
    const res = await request(app)
      .patch(`/api/v1/tickets/${testTicketAId}/actions-taken/${existingAction.id}`)
      .set("Authorization", `Bearer ${tokenStaff2}`)
      .send({
        actionDescription: "Updated work description with manufacturer case reference #84910",
        result: "Confirmed warranty replacement shipment",
        expectedUpdatedAt: existingAction.updatedAt.toISOString(),
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.actionDescription).toBe(
      "Updated work description with manufacturer case reference #84910"
    );
    expect(res.body.data.result).toBe("Confirmed warranty replacement shipment");

    // Performer immutability invariant (BR-03): remains originalAuthorId
    expect(res.body.data.performedBy.id).toBe(originalAuthorId);
  });

  it("API-05b: should permit IT Staff to update Action Taken to followUpRequired = true with valid followUpNote", async () => {
    const existingAction = await prisma.actionTaken.findFirstOrThrow({
      where: { ticketId: testTicketAId },
    });

    const res = await request(app)
      .patch(`/api/v1/tickets/${testTicketAId}/actions-taken/${existingAction.id}`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({
        followUpRequired: true,
        followUpNote: "Awaiting courier delivery on Thursday morning.",
        expectedUpdatedAt: existingAction.updatedAt.toISOString(),
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.followUpRequired).toBe(true);
    expect(res.body.data.followUpNote).toBe("Awaiting courier delivery on Thursday morning.");
  });

  it("API-05c: should reject updating Action Taken to followUpRequired = true with empty note with HTTP 400 FOLLOWUP_NOTE_REQUIRED", async () => {
    const existingAction = await prisma.actionTaken.findFirstOrThrow({
      where: { ticketId: testTicketAId },
    });

    const res = await request(app)
      .patch(`/api/v1/tickets/${testTicketAId}/actions-taken/${existingAction.id}`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({
        followUpRequired: true,
        followUpNote: "   ",
        expectedUpdatedAt: existingAction.updatedAt.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("FOLLOWUP_NOTE_REQUIRED");
  });

  // =========================================================================
  // API-06: Locked ticket enforcement (CLOSED / CANCELLED)
  // =========================================================================
  it("API-06: should reject creating Action Taken on CLOSED ticket with HTTP 400 TICKET_LOCKED", async () => {
    const closedTicket = await prisma.ticket.findUniqueOrThrow({ where: { id: closedTicketId } });

    const res = await request(app)
      .post(`/api/v1/tickets/${closedTicketId}/actions-taken`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({
        actionDescription: "Attempting action on closed ticket",
        result: "Should fail",
        expectedTicketUpdatedAt: closedTicket.updatedAt.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("TICKET_LOCKED");
  });

  it("API-06 (Cancelled): should reject creating Action Taken on CANCELLED ticket with HTTP 400 TICKET_LOCKED", async () => {
    const cancelledTicket = await prisma.ticket.findUniqueOrThrow({ where: { id: cancelledTicketId } });

    const res = await request(app)
      .post(`/api/v1/tickets/${cancelledTicketId}/actions-taken`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({
        actionDescription: "Attempting action on cancelled ticket",
        result: "Should fail",
        expectedTicketUpdatedAt: cancelledTicket.updatedAt.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("TICKET_LOCKED");
  });

  // =========================================================================
  // API-07, API-07b, API-07c: Optimistic Concurrency Control (STALE_UPDATE_CONFLICT) & Atomic CAS Race
  // =========================================================================
  it("API-07: should reject Action Taken creation with HTTP 409 STALE_UPDATE_CONFLICT when expectedTicketUpdatedAt is stale", async () => {
    const staleDate = new Date("2020-01-01T00:00:00.000Z").toISOString();

    const res = await request(app)
      .post(`/api/v1/tickets/${testTicketAId}/actions-taken`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({
        actionDescription: "Testing concurrent collision detection",
        result: "Should conflict",
        expectedTicketUpdatedAt: staleDate,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("STALE_UPDATE_CONFLICT");
  });

  it("API-07b: should reject Action Taken update with HTTP 409 STALE_UPDATE_CONFLICT when expectedUpdatedAt is stale", async () => {
    const existingAction = await prisma.actionTaken.findFirstOrThrow({
      where: { ticketId: testTicketAId },
    });
    const staleDate = new Date("2020-01-01T00:00:00.000Z").toISOString();

    const res = await request(app)
      .patch(`/api/v1/tickets/${testTicketAId}/actions-taken/${existingAction.id}`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({
        actionDescription: "Updating with stale timestamp",
        expectedUpdatedAt: staleDate,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("STALE_UPDATE_CONFLICT");
  });

  it("API-07c: should handle atomic race condition between two concurrent requests with identical expectedTicketUpdatedAt", async () => {
    const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: testTicketAId } });
    const baseUpdatedAt = ticket.updatedAt.toISOString();

    // Fire two requests concurrently with identical expectedTicketUpdatedAt
    const [res1, res2] = await Promise.all([
      request(app)
        .post(`/api/v1/tickets/${testTicketAId}/actions-taken`)
        .set("Authorization", `Bearer ${tokenStaff1}`)
        .send({
          actionDescription: "Concurrent Action Entry Alpha",
          result: "Race attempt Alpha",
          followUpRequired: false,
          expectedTicketUpdatedAt: baseUpdatedAt,
        }),
      request(app)
        .post(`/api/v1/tickets/${testTicketAId}/actions-taken`)
        .set("Authorization", `Bearer ${tokenStaff2}`)
        .send({
          actionDescription: "Concurrent Action Entry Beta",
          result: "Race attempt Beta",
          followUpRequired: false,
          expectedTicketUpdatedAt: baseUpdatedAt,
        }),
    ]);

    const statusCodes = [res1.status, res2.status].sort();
    // Exactly one request must succeed (201) and the other must be rejected with 409 (STALE_UPDATE_CONFLICT)
    expect(statusCodes).toEqual([201, 409]);

    const conflictResponse = res1.status === 409 ? res1 : res2;
    expect(conflictResponse.body.success).toBe(false);
    expect(conflictResponse.body.error.code).toBe("STALE_UPDATE_CONFLICT");
  });

  // =========================================================================
  // API-08 & API-08b: Inactive Actor Rejection (INACTIVE_ACTOR_REJECTED)
  // =========================================================================
  it("API-08: should reject inactive IT Staff creating Action Taken with HTTP 400 INACTIVE_ACTOR_REJECTED", async () => {
    const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: testTicketAId } });

    const res = await request(app)
      .post(`/api/v1/tickets/${testTicketAId}/actions-taken`)
      .set("Authorization", `Bearer ${tokenInactiveStaff}`)
      .send({
        actionDescription: "Inactive user attempting action creation",
        result: "Should be rejected",
        expectedTicketUpdatedAt: ticket.updatedAt.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("INACTIVE_ACTOR_REJECTED");
  });

  it("API-08b: should reject inactive IT Staff updating Action Taken with HTTP 400 INACTIVE_ACTOR_REJECTED", async () => {
    const existingAction = await prisma.actionTaken.findFirstOrThrow({
      where: { ticketId: testTicketAId },
    });

    const res = await request(app)
      .patch(`/api/v1/tickets/${testTicketAId}/actions-taken/${existingAction.id}`)
      .set("Authorization", `Bearer ${tokenInactiveStaff}`)
      .send({
        actionDescription: "Inactive user attempting action edit",
        expectedUpdatedAt: existingAction.updatedAt.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("INACTIVE_ACTOR_REJECTED");
  });

  // =========================================================================
  // API-09 & API-10: Requester Read Access & Ownership Boundary
  // =========================================================================
  it("API-09: should allow Requester to retrieve Actions Taken for owned ticket in chronological order (actionDate ASC)", async () => {
    const res = await request(app)
      .get(`/api/v1/tickets/${testTicketAId}/actions-taken`)
      .set("Authorization", `Bearer ${tokenRequesterA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.ticketId).toBe(testTicketAId);
    expect(Array.isArray(res.body.data.actionsTaken)).toBe(true);
    expect(res.body.data.actionsTaken.length).toBeGreaterThan(0);

    // Verify chronological order (BR-06)
    const actions = res.body.data.actionsTaken;
    for (let i = 1; i < actions.length; i++) {
      const prev = new Date(actions[i - 1].actionDate).getTime();
      const curr = new Date(actions[i].actionDate).getTime();
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });

  it("API-10: should forbid Requester from accessing Actions Taken of another user's ticket with HTTP 403 FORBIDDEN", async () => {
    // Requester A attempts to query Ticket B (owned by Requester B)
    const res = await request(app)
      .get(`/api/v1/tickets/${testTicketBId}/actions-taken`)
      .set("Authorization", `Bearer ${tokenRequesterA}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  // =========================================================================
  // API-11: Legacy / Zero-Action Ticket Tolerance
  // =========================================================================
  it("API-11: should return HTTP 200 OK with empty array [] for ticket with zero Actions Taken", async () => {
    // Ticket B currently has 0 Actions Taken
    const res = await request(app)
      .get(`/api/v1/tickets/${testTicketBId}/actions-taken`)
      .set("Authorization", `Bearer ${tokenStaff1}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.ticketId).toBe(testTicketBId);
    expect(Array.isArray(res.body.data.actionsTaken)).toBe(true);
    expect(res.body.data.actionsTaken.length).toBe(0);
  });

  // =========================================================================
  // API-12: Unauthenticated Caller Rejection
  // =========================================================================
  it("API-12: should reject unauthenticated query or mutation with HTTP 401 SESSION_INVALID", async () => {
    // GET without token
    const resGet = await request(app).get(`/api/v1/tickets/${testTicketAId}/actions-taken`);
    expect(resGet.status).toBe(401);
    expect(resGet.body.error.code).toBe("SESSION_INVALID");

    // POST without token
    const resPost = await request(app)
      .post(`/api/v1/tickets/${testTicketAId}/actions-taken`)
      .send({ actionDescription: "No auth", result: "Fail" });
    expect(resPost.status).toBe(401);
    expect(resPost.body.error.code).toBe("SESSION_INVALID");

    // PATCH without token
    const resPatch = await request(app)
      .patch(`/api/v1/tickets/${testTicketAId}/actions-taken/dummy-id`)
      .send({ actionDescription: "No auth" });
    expect(resPatch.status).toBe(401);
    expect(resPatch.body.error.code).toBe("SESSION_INVALID");
  });

  // =========================================================================
  // PERF-02: Performance Smoke Test (< 300ms project-defined smoke threshold)
  // =========================================================================
  describe("PERF-02: Actions Taken CRUD Latency Smoke Benchmark (< 300ms)", () => {
    it("should retrieve Actions Taken list within 300ms engineering smoke threshold", async () => {
      const start = performance.now();
      const res = await request(app)
        .get(`/api/v1/tickets/${testTicketAId}/actions-taken`)
        .set("Authorization", `Bearer ${tokenStaff1}`);
      const duration = performance.now() - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(300);
    });

    it("should create Action Taken within 300ms engineering smoke threshold", async () => {
      const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: testTicketAId } });

      const start = performance.now();
      const res = await request(app)
        .post(`/api/v1/tickets/${testTicketAId}/actions-taken`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({
          actionDescription: "Performance smoke test action logging",
          result: "Latency measured cleanly",
          followUpRequired: false,
          expectedTicketUpdatedAt: ticket.updatedAt.toISOString(),
        });
      const duration = performance.now() - start;

      expect(res.status).toBe(201);
      expect(duration).toBeLessThan(300);
    });
  });
});
