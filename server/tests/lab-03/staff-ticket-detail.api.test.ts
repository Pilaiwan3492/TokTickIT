import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("IT Staff Ticket Detail & Processing API Tests (Lab 3 — Issue 26: API-25..API-31)", () => {
  const prisma = getPrisma();

  let tokenStaff1: string;
  let staff1Id: string;
  let tokenStaff2: string;
  let staff2Id: string;
  let tokenAdmin: string;
  let adminId: string;
  let tokenRequester: string;
  let requesterUserId: string;

  let inactiveStaffId: string;

  let testTicketId: string;
  let closedTicketId: string;

  beforeAll(async () => {
    const defaultHash = bcrypt.hashSync("Password123!", 10);

    // 1. Staff 1 (active)
    const staff1 = await prisma.user.upsert({
      where: { email: "staff1.ops@toktickit.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "staff1.ops@toktickit.com",
        name: "Marcus Staff",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    staff1Id = staff1.id;

    // 2. Staff 2 (active)
    const staff2 = await prisma.user.upsert({
      where: { email: "staff2.ops@toktickit.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "staff2.ops@toktickit.com",
        name: "Samantha Staff",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    staff2Id = staff2.id;

    // 3. Admin (active)
    const admin = await prisma.user.upsert({
      where: { email: "admin.ops@toktickit.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "admin.ops@toktickit.com",
        name: "Arthur Admin",
        role: "ADMIN",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    adminId = admin.id;

    // 4. Inactive Staff (for assignment rejection tests)
    const inactiveStaff = await prisma.user.upsert({
      where: { email: "inactive.staff@toktickit.com" },
      update: { isActive: false, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "inactive.staff@toktickit.com",
        name: "Ivan Inactive",
        role: "IT_STAFF",
        isActive: false,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    inactiveStaffId = inactiveStaff.id;

    // 5. Requester user
    const requester = await prisma.user.upsert({
      where: { email: "requester.ops@example.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "requester.ops@example.com",
        name: "Rebecca Requester",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    requesterUserId = requester.id;

    const legacyReq = await prisma.requesterUser.upsert({
      where: { email: "requester.ops@example.com" },
      update: { userId: requester.id, isActive: true },
      create: {
        name: "Rebecca Requester",
        email: "requester.ops@example.com",
        userId: requester.id,
        isActive: true,
      },
    });

    // 6. Category & Related System
    const category = await prisma.category.upsert({
      where: { name: "Hardware" },
      update: { isActive: true },
      create: { name: "Hardware", isActive: true },
    });

    const relatedSystem = await prisma.relatedSystem.upsert({
      where: { name: "Laptop" },
      update: { isActive: true },
      create: { name: "Laptop", isActive: true },
    });

    // 7. Seed Main Test Ticket (NEW, LOW priority, Unassigned)
    const ticket = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-OPS-100-${Date.now()}`,
        userId: requesterUserId,
        requesterId: legacyReq.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Keyboard key sticking intermittently",
        description: "Spacebar sticks when typing fast.",
        requestedPriority: "LOW",
        itPriority: "LOW",
        status: "NEW",
        currentStatus: "NEW",
        ownerId: null, // initially unassigned
      },
    });
    testTicketId = ticket.id;

    // Add public comment
    await prisma.comment.create({
      data: {
        ticketId: testTicketId,
        authorId: requesterUserId,
        content: "I also noticed the Enter key is loose.",
      },
    });

    // Add internal note
    await prisma.internalNote.create({
      data: {
        ticketId: testTicketId,
        authorId: staff1Id,
        content: "Replacement keycaps available in storage bin 4B.",
      },
    });

    // 8. Seed Closed Ticket (Terminal status)
    const closedTicket = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-OPS-CLOSED-${Date.now()}`,
        userId: requesterUserId,
        requesterId: legacyReq.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Old completed ticket",
        description: "Archived ticket in closed state.",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        status: "CLOSED",
        currentStatus: "CLOSED",
        ownerId: staff1Id,
      },
    });
    closedTicketId = closedTicket.id;

    // 9. Login tokens
    const resStaff1 = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "staff1.ops@toktickit.com", password: "Password123!" });
    tokenStaff1 = resStaff1.body.data.token;

    const resStaff2 = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "staff2.ops@toktickit.com", password: "Password123!" });
    tokenStaff2 = resStaff2.body.data.token;

    const resAdmin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin.ops@toktickit.com", password: "Password123!" });
    tokenAdmin = resAdmin.body.data.token;

    const resReq = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "requester.ops@example.com", password: "Password123!" });
    tokenRequester = resReq.body.data.token;
  });

  // --- API-25: IT Staff retrieves single ticket detail with operational metadata ---
  it("API-25: should return full operational ticket detail including comments and internal notes for IT Staff", async () => {
    const res = await request(app)
      .get(`/api/v1/staff/tickets/${testTicketId}`)
      .set("Authorization", `Bearer ${tokenStaff1}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe(testTicketId);
    expect(res.body.data.summary).toBe("Keyboard key sticking intermittently");
    expect(res.body.data.category).toBeDefined();
    expect(res.body.data.relatedSystem).toBeDefined();

    // Verify public comments present
    expect(Array.isArray(res.body.data.comments)).toBe(true);
    expect(res.body.data.comments.some((c: any) => c.content.includes("Enter key is loose"))).toBe(true);

    // Verify internal notes present for IT Staff
    expect(Array.isArray(res.body.data.notes)).toBe(true);
    expect(res.body.data.notes.some((n: any) => n.content.includes("bin 4B"))).toBe(true);
  });

  // --- API-26: IT Staff claims unassigned ticket ---
  it("API-26: should allow IT Staff to claim an unassigned ticket using 'me'", async () => {
    const res = await request(app)
      .patch(`/api/v1/staff/tickets/${testTicketId}/assignment`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({ ownerId: "me" });

    expect(res.status).toBe(200);
    expect(res.body.data.ownerId).toBe(staff1Id);
    expect(res.body.data.owner).toBeDefined();
    expect(res.body.data.owner.id).toBe(staff1Id);
    expect(res.body.data.owner.role).toBe("IT_STAFF");
  });

  // --- API-27: IT Staff reassigns ticket to another active IT Staff / Admin ---
  it("API-27: should allow IT Staff to reassign ticket to another active IT Staff or Administrator", async () => {
    // 1. Reassign to Staff 2
    const resReassignStaff = await request(app)
      .patch(`/api/v1/staff/tickets/${testTicketId}/assignment`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({ ownerId: staff2Id });

    expect(resReassignStaff.status).toBe(200);
    expect(resReassignStaff.body.data.ownerId).toBe(staff2Id);
    expect(resReassignStaff.body.data.owner.name).toBe("Samantha Staff");

    // 2. Reassign to Administrator
    const resReassignAdmin = await request(app)
      .patch(`/api/v1/staff/tickets/${testTicketId}/assignment`)
      .set("Authorization", `Bearer ${tokenStaff2}`)
      .send({ ownerId: adminId });

    expect(resReassignAdmin.status).toBe(200);
    expect(resReassignAdmin.body.data.ownerId).toBe(adminId);
    expect(resReassignAdmin.body.data.owner.role).toBe("ADMIN");

    // 3. Unassign ticket by passing null
    const resUnassign = await request(app)
      .patch(`/api/v1/staff/tickets/${testTicketId}/assignment`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ ownerId: null });

    expect(resUnassign.status).toBe(200);
    expect(resUnassign.body.data.ownerId).toBeNull();
  });

  // --- API-28: Assign ticket to inactive user or user with REQUESTER role rejected ---
  it("API-28: should reject assignment to inactive user or user with REQUESTER role with HTTP 400", async () => {
    // 1. Assignment to inactive staff member
    const resInactive = await request(app)
      .patch(`/api/v1/staff/tickets/${testTicketId}/assignment`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({ ownerId: inactiveStaffId });

    expect(resInactive.status).toBe(400);
    expect(resInactive.body.error.code).toBe("INVALID_OWNER");

    // 2. Assignment to user with role REQUESTER
    const resRequester = await request(app)
      .patch(`/api/v1/staff/tickets/${testTicketId}/assignment`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({ ownerId: requesterUserId });

    expect(resRequester.status).toBe(400);
    expect(resRequester.body.error.code).toBe("INVALID_OWNER");
  });

  // --- API-29: IT Staff updates IT Priority independently of Requested Priority ---
  it("API-29: should update IT Priority independently while keeping Requested Priority unchanged", async () => {
    const resPriority = await request(app)
      .patch(`/api/v1/staff/tickets/${testTicketId}/priority`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({ itPriority: "URGENT" });

    expect(resPriority.status).toBe(200);
    expect(resPriority.body.data.itPriority).toBe("URGENT");

    // Verify in database: requestedPriority MUST remain LOW (BR-14)
    const dbTicket = await prisma.ticket.findUnique({
      where: { id: testTicketId },
    });
    expect(dbTicket?.itPriority).toBe("URGENT");
    expect(dbTicket?.requestedPriority).toBe("LOW");
  });

  // --- API-30 & API-31: Status Transitions per Transition Matrix (BR-16) ---
  it("API-30 & API-31: should enforce Status Transition Matrix: permit valid and reject invalid transitions", async () => {
    // Current status is NEW
    // Valid for NEW: OPEN, CANCELLED
    // Invalid for NEW: IN_PROGRESS, RESOLVED, CLOSED, etc.

    // 1. Invalid: NEW -> RESOLVED (HTTP 400 INVALID_STATUS_TRANSITION)
    const resInvalid1 = await request(app)
      .patch(`/api/v1/staff/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({ status: "RESOLVED" });

    expect(resInvalid1.status).toBe(400);
    expect(resInvalid1.body.error.code).toBe("INVALID_STATUS_TRANSITION");

    // 2. Valid: NEW -> OPEN
    const resStep1 = await request(app)
      .patch(`/api/v1/staff/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({ status: "OPEN" });

    expect(resStep1.status).toBe(200);
    expect(resStep1.body.data.currentStatus).toBe("OPEN");

    // 3. Valid: OPEN -> IN_PROGRESS
    const resStep2 = await request(app)
      .patch(`/api/v1/staff/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({ status: "IN_PROGRESS" });

    expect(resStep2.status).toBe(200);
    expect(resStep2.body.data.currentStatus).toBe("IN_PROGRESS");

    // 4. Valid: IN_PROGRESS -> WAITING_FOR_REQUESTER
    const resStep3 = await request(app)
      .patch(`/api/v1/staff/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({ status: "WAITING_FOR_REQUESTER" });

    expect(resStep3.status).toBe(200);
    expect(resStep3.body.data.currentStatus).toBe("WAITING_FOR_REQUESTER");

    // 5. Valid: WAITING_FOR_REQUESTER -> RESOLVED
    const resStep4 = await request(app)
      .patch(`/api/v1/staff/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({ status: "RESOLVED" });

    expect(resStep4.status).toBe(200);
    expect(resStep4.body.data.currentStatus).toBe("RESOLVED");

    // 6. Valid: RESOLVED -> REOPENED
    const resStep5 = await request(app)
      .patch(`/api/v1/staff/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({ status: "REOPENED" });

    expect(resStep5.status).toBe(200);
    expect(resStep5.body.data.currentStatus).toBe("REOPENED");

    // 7. Terminal transition rejection: Attempting any transition on a CLOSED ticket
    const resClosed = await request(app)
      .patch(`/api/v1/staff/tickets/${closedTicketId}/status`)
      .set("Authorization", `Bearer ${tokenStaff1}`)
      .send({ status: "OPEN" });

    expect(resClosed.status).toBe(400);
    expect(resClosed.body.error.code).toBe("INVALID_STATUS_TRANSITION");
  });

  // --- Assignee selection helper endpoint ---
  it("should return active IT Staff and Admin users via GET /api/v1/staff/assignees", async () => {
    const res = await request(app)
      .get("/api/v1/staff/assignees")
      .set("Authorization", `Bearer ${tokenStaff1}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    // Only IT_STAFF and ADMIN should be returned
    expect(res.body.data.every((u: any) => ["IT_STAFF", "ADMIN"].includes(u.role))).toBe(true);

    // Inactive staff must not be present
    expect(res.body.data.some((u: any) => u.id === inactiveStaffId)).toBe(false);

    // Active staff & admin must be present
    expect(res.body.data.some((u: any) => u.id === staff1Id)).toBe(true);
    expect(res.body.data.some((u: any) => u.id === adminId)).toBe(true);
  });
});
