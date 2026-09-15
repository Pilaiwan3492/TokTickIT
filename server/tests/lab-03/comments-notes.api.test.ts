import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 3 Comments, Notes & Resolution API Tests (Issue 25)", () => {
  const prisma = getPrisma();

  let tokenRequesterA: string;
  let tokenRequesterB: string;
  let tokenStaff: string;
  let tokenAdmin: string;

  let requesterAId: string;
  let requesterBId: string;
  let staffId: string;
  let adminId: string;

  let ticketAId: string;
  let ticketBId: string;

  beforeAll(async () => {
    const defaultHash = bcrypt.hashSync("Password123!", 10);

    // 1. Setup Requester A
    const reqUserA = await prisma.user.upsert({
      where: { email: "requester.a@example.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "requester.a@example.com",
        name: "Alice Requester",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    requesterAId = reqUserA.id;

    const legacyReqA = await prisma.requesterUser.upsert({
      where: { email: "requester.a@example.com" },
      update: { userId: reqUserA.id, isActive: true },
      create: {
        name: "Alice Requester",
        email: "requester.a@example.com",
        userId: reqUserA.id,
        isActive: true,
      },
    });

    // 2. Setup Requester B
    const reqUserB = await prisma.user.upsert({
      where: { email: "requester.b@example.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "requester.b@example.com",
        name: "Bob Requester",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    requesterBId = reqUserB.id;

    const legacyReqB = await prisma.requesterUser.upsert({
      where: { email: "requester.b@example.com" },
      update: { userId: reqUserB.id, isActive: true },
      create: {
        name: "Bob Requester",
        email: "requester.b@example.com",
        userId: reqUserB.id,
        isActive: true,
      },
    });

    // 3. Setup IT Staff
    const staffUser = await prisma.user.upsert({
      where: { email: "staff.comments@toktickit.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "staff.comments@toktickit.com",
        name: "Charlie Staff",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    staffId = staffUser.id;

    // 4. Setup Admin
    const adminUser = await prisma.user.upsert({
      where: { email: "admin.comments@toktickit.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "admin.comments@toktickit.com",
        name: "Diana Admin",
        role: "ADMIN",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    adminId = adminUser.id;

    // 5. Ensure category and related system exist
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

    // 6. Setup Ticket A (owned by Requester A)
    const ticketA = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-TEST-${Date.now()}-A`,
        requesterId: legacyReqA.id,
        userId: requesterAId,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Display flickering issue on laptop",
        description: "Whenever the device wakes from sleep, the display flickers violently.",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        status: "OPEN",
        currentStatus: "OPEN",
        isRequesterResolved: false,
      },
    });
    ticketAId = ticketA.id;

    // 7. Setup Ticket B (owned by Requester B)
    const ticketB = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-TEST-${Date.now()}-B`,
        requesterId: legacyReqB.id,
        userId: requesterBId,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "VPN disconnection problem",
        description: "VPN drops every 15 minutes during office hours.",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        status: "OPEN",
        currentStatus: "OPEN",
        isRequesterResolved: false,
      },
    });
    ticketBId = ticketB.id;

    // 8. Authenticate and retrieve tokens
    const resAuthA = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "requester.a@example.com", password: "Password123!" });
    tokenRequesterA = resAuthA.body.data.token;

    const resAuthB = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "requester.b@example.com", password: "Password123!" });
    tokenRequesterB = resAuthB.body.data.token;

    const resAuthStaff = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "staff.comments@toktickit.com", password: "Password123!" });
    tokenStaff = resAuthStaff.body.data.token;

    const resAuthAdmin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin.comments@toktickit.com", password: "Password123!" });
    tokenAdmin = resAuthAdmin.body.data.token;
  });

  // --- API-32: Requester posts public comment on owned ticket ---
  it("API-32: should allow Requester to post a public comment on owned ticket and return author metadata", async () => {
    const res = await request(app)
      .post(`/api/v1/tickets/${ticketAId}/comments`)
      .set("Authorization", `Bearer ${tokenRequesterA}`)
      .send({
        content: "I tested in safe mode and the flickering does not occur.",
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.content).toBe("I tested in safe mode and the flickering does not occur.");
    expect(res.body.data.author.id).toBe(requesterAId);
    expect(res.body.data.author.name).toBe("Alice Requester");
    expect(res.body.data.author.role).toBe("REQUESTER");
    expect(res.body.data.author).not.toHaveProperty("passwordHash");

    // Verify comment is in database
    const dbComment = await prisma.comment.findUnique({
      where: { id: res.body.data.id },
    });
    expect(dbComment).not.toBeNull();
    expect(dbComment?.authorId).toBe(requesterAId);
  });

  // --- API-33: IT Staff posts public comment on any ticket ---
  it("API-33: should allow IT Staff to post a public comment on any ticket", async () => {
    const res = await request(app)
      .post(`/api/v1/tickets/${ticketAId}/comments`)
      .set("Authorization", `Bearer ${tokenStaff}`)
      .send({
        content: "We have scheduled a driver reinstall session tomorrow morning.",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.author.id).toBe(staffId);
    expect(res.body.data.author.role).toBe("IT_STAFF");
    expect(res.body.data).toHaveProperty("createdAt");

    // Verify Requester A can see this comment in the feed
    const feedRes = await request(app)
      .get(`/api/v1/tickets/${ticketAId}/comments`)
      .set("Authorization", `Bearer ${tokenRequesterA}`);

    expect(feedRes.status).toBe(200);
    expect(Array.isArray(feedRes.body.data)).toBe(true);
    expect(feedRes.body.data.length).toBeGreaterThanOrEqual(2);
    const staffComment = feedRes.body.data.find((c: any) => c.author.role === "IT_STAFF");
    expect(staffComment).toBeDefined();
    expect(staffComment.content).toContain("driver reinstall session");
  });

  // --- API-34: Comment validation ---
  it("API-34: should reject invalid comment content (empty, whitespace-only, > 2000 chars, non-string)", async () => {
    // Empty string
    const resEmpty = await request(app)
      .post(`/api/v1/tickets/${ticketAId}/comments`)
      .set("Authorization", `Bearer ${tokenRequesterA}`)
      .send({ content: "" });
    expect(resEmpty.status).toBe(400);
    expect(resEmpty.body.error.code).toBe("VALIDATION_ERROR");

    // Whitespace only
    const resSpaces = await request(app)
      .post(`/api/v1/tickets/${ticketAId}/comments`)
      .set("Authorization", `Bearer ${tokenRequesterA}`)
      .send({ content: "     " });
    expect(resSpaces.status).toBe(400);

    // Over 2,000 characters
    const resTooLong = await request(app)
      .post(`/api/v1/tickets/${ticketAId}/comments`)
      .set("Authorization", `Bearer ${tokenRequesterA}`)
      .send({ content: "a".repeat(2001) });
    expect(resTooLong.status).toBe(400);

    // Non-string
    const resNonString = await request(app)
      .post(`/api/v1/tickets/${ticketAId}/comments`)
      .set("Authorization", `Bearer ${tokenRequesterA}`)
      .send({ content: 12345 });
    expect(resNonString.status).toBe(400);
  });

  // --- API-35: Requester attempts to view Internal Notes ---
  it("API-35: should reject Requester attempting to view internal notes with HTTP 403 without data leakage", async () => {
    // First, have staff create an internal note
    await prisma.internalNote.create({
      data: {
        ticketId: ticketAId,
        content: "Confidential hardware diagnostic: GPU solder joint defective.",
        authorId: staffId,
      },
    });

    const res = await request(app)
      .get(`/api/v1/tickets/${ticketAId}/notes`)
      .set("Authorization", `Bearer ${tokenRequesterA}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("INSUFFICIENT_PERMISSIONS");
    // Ensure no note content or structure is leaked in response
    expect(res.body.data).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain("GPU solder joint defective");
  });

  // --- API-36: Requester attempts to create Internal Note ---
  it("API-36: should reject Requester attempting to create an internal note with HTTP 403 and leave note count unchanged", async () => {
    const noteCountBefore = await prisma.internalNote.count({
      where: { ticketId: ticketAId },
    });

    const res = await request(app)
      .post(`/api/v1/tickets/${ticketAId}/notes`)
      .set("Authorization", `Bearer ${tokenRequesterA}`)
      .send({
        content: "Trying to inject an internal note as a requester",
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("INSUFFICIENT_PERMISSIONS");

    const noteCountAfter = await prisma.internalNote.count({
      where: { ticketId: ticketAId },
    });
    expect(noteCountAfter).toBe(noteCountBefore);
  });

  // --- API-37: IT Staff and Admin create and view Internal Notes ---
  it("API-37: should allow IT Staff and Admin to create and view internal notes", async () => {
    // Staff creates note
    const staffNoteRes = await request(app)
      .post(`/api/v1/tickets/${ticketAId}/notes`)
      .set("Authorization", `Bearer ${tokenStaff}`)
      .send({ content: "Internal Note from IT Staff: Part ordered." });

    expect(staffNoteRes.status).toBe(201);
    expect(staffNoteRes.body.data.author.role).toBe("IT_STAFF");

    // Admin creates note
    const adminNoteRes = await request(app)
      .post(`/api/v1/tickets/${ticketAId}/notes`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ content: "Internal Note from Admin: Escalation reviewed." });

    expect(adminNoteRes.status).toBe(201);
    expect(adminNoteRes.body.data.author.role).toBe("ADMIN");

    // IT Staff retrieves notes
    const getStaffRes = await request(app)
      .get(`/api/v1/tickets/${ticketAId}/notes`)
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(getStaffRes.status).toBe(200);
    expect(Array.isArray(getStaffRes.body.data)).toBe(true);
    expect(getStaffRes.body.data.length).toBeGreaterThanOrEqual(2);
  });

  // --- API-38: Requester sets Problem Appears Resolved indicator ---
  it("API-38: should set isRequesterResolved = true while leaving official status unchanged", async () => {
    // Verify initial status
    const initialTicket = await prisma.ticket.findUnique({
      where: { id: ticketAId },
      select: { currentStatus: true, status: true, isRequesterResolved: true },
    });
    expect(initialTicket?.currentStatus).toBe("OPEN");
    expect(initialTicket?.isRequesterResolved).toBe(false);

    // Requester indicates resolution
    const res = await request(app)
      .post(`/api/v1/tickets/${ticketAId}/resolve-indicator`)
      .set("Authorization", `Bearer ${tokenRequesterA}`)
      .send({ isRequesterResolved: true });

    expect(res.status).toBe(200);
    expect(res.body.data.ticketId).toBe(ticketAId);
    expect(res.body.data.isRequesterResolved).toBe(true);

    // CRITICAL: Verify in DB that official status is UNCHANGED (still OPEN, not RESOLVED or CLOSED)
    const dbTicket = await prisma.ticket.findUnique({
      where: { id: ticketAId },
    });
    expect(dbTicket?.isRequesterResolved).toBe(true);
    expect(dbTicket?.currentStatus).toBe("OPEN");
    expect(dbTicket?.status).toBe("OPEN");
  });

  // --- Idempotency: Repeated resolution indicator calls ---
  it("should handle repeated POST /resolve-indicator idempotently without throwing or modifying status", async () => {
    const resSecond = await request(app)
      .post(`/api/v1/tickets/${ticketAId}/resolve-indicator`)
      .set("Authorization", `Bearer ${tokenRequesterA}`)
      .send({ isRequesterResolved: true });

    expect(resSecond.status).toBe(200);
    expect(resSecond.body.data.isRequesterResolved).toBe(true);

    const dbTicket = await prisma.ticket.findUnique({
      where: { id: ticketAId },
    });
    expect(dbTicket?.isRequesterResolved).toBe(true);
    expect(dbTicket?.currentStatus).toBe("OPEN");
  });

  // --- Cross-Requester Security Tests ---
  describe("Cross-Requester Security Boundary Tests", () => {
    it("should reject Requester A trying to GET Ticket B with HTTP 403 and leak NO ticket data", async () => {
      const res = await request(app)
        .get(`/api/v1/tickets/${ticketBId}`)
        .set("Authorization", `Bearer ${tokenRequesterA}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe("FORBIDDEN");
      expect(res.body.data).toBeUndefined();

      // Explicitly assert zero data leakage of ticket fields
      expect(res.body.summary).toBeUndefined();
      expect(res.body.description).toBeUndefined();
      expect(res.body.comments).toBeUndefined();
      expect(res.body.attachments).toBeUndefined();
      expect(res.body.user).toBeUndefined();
      expect(res.body.requester).toBeUndefined();
    });

    it("should reject Requester A trying to GET comments on Ticket B with HTTP 403", async () => {
      const res = await request(app)
        .get(`/api/v1/tickets/${ticketBId}/comments`)
        .set("Authorization", `Bearer ${tokenRequesterA}`);

      expect(res.status).toBe(403);
      expect(res.body.data).toBeUndefined();
    });

    it("should reject Requester A trying to POST a comment on Ticket B with HTTP 403", async () => {
      const countBefore = await prisma.comment.count({
        where: { ticketId: ticketBId },
      });

      const res = await request(app)
        .post(`/api/v1/tickets/${ticketBId}/comments`)
        .set("Authorization", `Bearer ${tokenRequesterA}`)
        .send({ content: "Malicious cross-ticket comment injection attempt" });

      expect(res.status).toBe(403);

      const countAfter = await prisma.comment.count({
        where: { ticketId: ticketBId },
      });
      expect(countAfter).toBe(countBefore);
    });

    it("should reject Requester A trying to mark Ticket B as resolved with HTTP 403", async () => {
      const res = await request(app)
        .post(`/api/v1/tickets/${ticketBId}/resolve-indicator`)
        .set("Authorization", `Bearer ${tokenRequesterA}`)
        .send({ isRequesterResolved: true });

      expect(res.status).toBe(403);

      const ticketB = await prisma.ticket.findUnique({
        where: { id: ticketBId },
      });
      expect(ticketB?.isRequesterResolved).toBe(false);
    });
  });

  // --- Data Isolation in Ticket Detail ---
  describe("Ticket Detail Data Isolation for Requesters", () => {
    it("should return public comments and isRequesterResolved in Ticket Detail, but NEVER internal notes", async () => {
      const res = await request(app)
        .get(`/api/v1/tickets/${ticketAId}`)
        .set("Authorization", `Bearer ${tokenRequesterA}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("isRequesterResolved", true);
      expect(res.body.data).toHaveProperty("comments");
      expect(Array.isArray(res.body.data.comments)).toBe(true);

      // Verify ZERO internal note leakage
      expect(res.body.data).not.toHaveProperty("notes");
      expect(res.body.data).not.toHaveProperty("internalNotes");
      expect(JSON.stringify(res.body)).not.toContain("GPU solder joint defective");
    });
  });
});
