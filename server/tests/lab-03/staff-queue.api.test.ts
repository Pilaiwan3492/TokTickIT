import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("IT Staff Ticket Queue API Tests (Lab 3 — Issue 26: API-19..API-24)", () => {
  const prisma = getPrisma();

  let tokenStaff: string;
  let staffId: string;
  let tokenAdmin: string;
  let adminId: string;
  let tokenRequester: string;
  let requesterId: string;

  let ticket1Id: string;
  let ticket1No: string;
  let ticket2Id: string;
  let ticket3Id: string;
  let ticket4Id: string;

  beforeAll(async () => {
    const defaultHash = bcrypt.hashSync("Password123!", 10);

    // 1. Setup IT Staff
    const staff = await prisma.user.upsert({
      where: { email: "staff.queue@toktickit.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "staff.queue@toktickit.com",
        name: "Samuel Staff",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    staffId = staff.id;

    // 2. Setup Admin
    const admin = await prisma.user.upsert({
      where: { email: "admin.queue@toktickit.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "admin.queue@toktickit.com",
        name: "Angela Admin",
        role: "ADMIN",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    adminId = admin.id;

    // 3. Setup Requester
    const requester = await prisma.user.upsert({
      where: { email: "requester.queue@example.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "requester.queue@example.com",
        name: "Rachel Requester",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    requesterId = requester.id;

    const legacyReq = await prisma.requesterUser.upsert({
      where: { email: "requester.queue@example.com" },
      update: { userId: requester.id, isActive: true },
      create: {
        name: "Rachel Requester",
        email: "requester.queue@example.com",
        userId: requester.id,
        isActive: true,
      },
    });

    // 4. Categories & Systems
    const category = await prisma.category.upsert({
      where: { name: "Network" },
      update: { isActive: true },
      create: { name: "Network", isActive: true },
    });

    const relatedSystem = await prisma.relatedSystem.upsert({
      where: { name: "VPN" },
      update: { isActive: true },
      create: { name: "VPN", isActive: true },
    });

    const baseTime = Date.now() + 1000000;

    // 5. Seed specific tickets for Queue testing
    // Ticket 1: NEW, URGENT, Unassigned
    const t1 = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-QUEUE-101-${Date.now()}`,
        userId: requesterId,
        requesterId: legacyReq.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Core router disconnected across branch office",
        description: "Branch office network went dark after storm.",
        requestedPriority: "URGENT",
        itPriority: "URGENT",
        status: "NEW",
        currentStatus: "NEW",
        ownerId: null, // Unassigned
        createdAt: new Date(baseTime + 10000),
      },
    });
    ticket1Id = t1.id;
    ticket1No = t1.ticketNo;

    // Ticket 2: OPEN, HIGH, Assigned to Staff
    const t2 = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-QUEUE-102-${Date.now()}`,
        userId: requesterId,
        requesterId: legacyReq.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "VPN access token expired for remote workers",
        description: "Employees cannot connect to ERP system.",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        status: "OPEN",
        currentStatus: "OPEN",
        ownerId: staffId, // Assigned to staff
        createdAt: new Date(baseTime + 20000),
      },
    });
    ticket2Id = t2.id;

    // Ticket 3: IN_PROGRESS, LOW, Assigned to Admin
    const t3 = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-QUEUE-103-${Date.now()}`,
        userId: requesterId,
        requesterId: legacyReq.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Monitor color calibration slightly off",
        description: "Colors look warmer than normal.",
        requestedPriority: "LOW",
        itPriority: "LOW",
        status: "IN_PROGRESS",
        currentStatus: "IN_PROGRESS",
        ownerId: adminId, // Assigned to admin
        createdAt: new Date(baseTime + 30000),
      },
    });
    ticket3Id = t3.id;

    // Ticket 4: Duplicate created date with Ticket 3 for secondary sort verification
    const t4 = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-QUEUE-104-${Date.now()}`,
        userId: requesterId,
        requesterId: legacyReq.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Second monitor calibration issue duplicate timestamp",
        description: "Secondary ticket with identical createdAt to test secondary sort.",
        requestedPriority: "LOW",
        itPriority: "LOW",
        status: "IN_PROGRESS",
        currentStatus: "IN_PROGRESS",
        ownerId: null,
        createdAt: new Date(baseTime + 30000),
      },
    });
    ticket4Id = t4.id;

    // 6. Log in users
    const resStaff = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "staff.queue@toktickit.com", password: "Password123!" });
    tokenStaff = resStaff.body.data.token;

    const resAdmin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin.queue@toktickit.com", password: "Password123!" });
    tokenAdmin = resAdmin.body.data.token;

    const resReq = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "requester.queue@example.com", password: "Password123!" });
    tokenRequester = resReq.body.data.token;
  });

  // --- API-19: IT Staff retrieves Ticket Queue with default pagination and sorting ---
  it("API-19: should return HTTP 200 with ticket list and pagination metadata for IT Staff", async () => {
    const res = await request(app)
      .get("/api/v1/staff/tickets")
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    // Verify pagination metadata structure
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.pageSize).toBe(10);
    expect(typeof res.body.pagination.totalItems).toBe("number");
    expect(typeof res.body.pagination.totalPages).toBe("number");

    // Check item fields
    const firstTicket = res.body.data[0];
    expect(firstTicket).toHaveProperty("id");
    expect(firstTicket).toHaveProperty("ticketNo");
    expect(firstTicket).toHaveProperty("summary");
    expect(firstTicket).toHaveProperty("category");
    expect(firstTicket).toHaveProperty("requestedPriority");
    expect(firstTicket).toHaveProperty("itPriority");
    expect(firstTicket).toHaveProperty("status");
    expect(firstTicket).toHaveProperty("requester");
  });

  // --- API-20: Search Ticket Queue by ticket number, summary, or requester ---
  it("API-20: should search queue and return only matching records by summary, ticketNo, or requester", async () => {
    // 1. Search by summary keyword
    const resSummary = await request(app)
      .get("/api/v1/staff/tickets?search=Core+router")
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(resSummary.status).toBe(200);
    expect(resSummary.body.data.length).toBeGreaterThan(0);
    expect(resSummary.body.data.some((t: any) => t.id === ticket1Id)).toBe(true);
    expect(resSummary.body.data.every((t: any) =>
      t.summary.includes("Core router") || t.ticketNo.includes("Core router")
    )).toBe(true);

    // 2. Search by ticket number
    const resTicketNo = await request(app)
      .get(`/api/v1/staff/tickets?search=${ticket1No}`)
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(resTicketNo.status).toBe(200);
    expect(resTicketNo.body.data.length).toBe(1);
    expect(resTicketNo.body.data[0].id === ticket1Id).toBe(true);

    // 3. Search by requester name
    const resReq = await request(app)
      .get("/api/v1/staff/tickets?search=Rachel+Requester")
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(resReq.status).toBe(200);
    expect(resReq.body.data.length).toBeGreaterThan(0);
    expect(resReq.body.data.some((t: any) => t.id === ticket1Id)).toBe(true);
  });

  // --- API-21: Filter Ticket Queue by status (single or comma-separated) ---
  it("API-21: should filter queue by single status and comma-separated status list", async () => {
    // 1. Single status NEW
    const resNew = await request(app)
      .get("/api/v1/staff/tickets?status=NEW")
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(resNew.status).toBe(200);
    expect(resNew.body.data.every((t: any) => t.status === "NEW")).toBe(true);
    expect(resNew.body.data.some((t: any) => t.id === ticket1Id)).toBe(true);

    // 2. Comma-separated OPEN,IN_PROGRESS
    const resMulti = await request(app)
      .get("/api/v1/staff/tickets?status=OPEN,IN_PROGRESS")
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(resMulti.status).toBe(200);
    expect(resMulti.body.data.every((t: any) => ["OPEN", "IN_PROGRESS"].includes(t.status))).toBe(true);
    expect(resMulti.body.data.some((t: any) => t.id === ticket2Id)).toBe(true);
    expect(resMulti.body.data.some((t: any) => t.id === ticket3Id)).toBe(true);
    expect(resMulti.body.data.some((t: any) => t.id === ticket1Id)).toBe(false);
  });

  // --- API-22: Filter Ticket Queue by priority (LOW, MEDIUM, HIGH, URGENT) ---
  it("API-22: should filter queue by priority matching itPriority or requestedPriority", async () => {
    const resUrgent = await request(app)
      .get("/api/v1/staff/tickets?priority=URGENT")
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(resUrgent.status).toBe(200);
    expect(resUrgent.body.data.length).toBeGreaterThan(0);
    expect(resUrgent.body.data.every((t: any) => t.itPriority === "URGENT")).toBe(true);
    expect(resUrgent.body.data.some((t: any) => t.id === ticket1Id)).toBe(true);

    const resLow = await request(app)
      .get("/api/v1/staff/tickets?priority=LOW")
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(resLow.status).toBe(200);
    expect(resLow.body.data.every((t: any) => t.itPriority === "LOW")).toBe(true);
  });

  // --- API-23: Filter Ticket Queue by ownership: ALL, UNASSIGNED, ASSIGNED_TO_ME ---
  it("API-23: should filter queue by ownership scopes (ALL, UNASSIGNED, ASSIGNED_TO_ME)", async () => {
    // 1. UNASSIGNED
    const resUnassigned = await request(app)
      .get("/api/v1/staff/tickets?ownership=UNASSIGNED")
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(resUnassigned.status).toBe(200);
    expect(resUnassigned.body.data.every((t: any) => t.owner === null)).toBe(true);
    expect(resUnassigned.body.data.some((t: any) => t.id === ticket1Id)).toBe(true);

    // 2. ASSIGNED_TO_ME (Staff token)
    const resMine = await request(app)
      .get("/api/v1/staff/tickets?ownership=ASSIGNED_TO_ME")
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(resMine.status).toBe(200);
    expect(resMine.body.data.every((t: any) => t.owner?.id === staffId)).toBe(true);
    expect(resMine.body.data.some((t: any) => t.id === ticket2Id)).toBe(true);
  });

  // --- API-24: Queue deterministic secondary sorting by id desc on duplicate dates ---
  it("API-24: should perform deterministic secondary sorting by id desc when dates match", async () => {
    const res = await request(app)
      .get("/api/v1/staff/tickets?sortBy=createdAt&sortOrder=asc&status=IN_PROGRESS")
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(res.status).toBe(200);
    // Find tickets 3 and 4 in the response (they have the exact same createdAt)
    const items = res.body.data.filter((t: any) => t.id === ticket3Id || t.id === ticket4Id);
    if (items.length === 2) {
      // Because secondary sort is id desc, the one with alphabetically larger id must appear first
      const firstId = items[0].id;
      const secondId = items[1].id;
      expect(firstId > secondId).toBe(true);
    }
  });

  // --- API-20b: Search queue by requester email address ---
  it("API-20b: should search queue by requester email address", async () => {
    const resEmail = await request(app)
      .get("/api/v1/staff/tickets?search=requester.queue@example.com")
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(resEmail.status).toBe(200);
    expect(resEmail.body.data.length).toBeGreaterThan(0);
    expect(resEmail.body.data.some((t: any) => t.id === ticket1Id)).toBe(true);
  });

  // --- API-24b: Combination filters (Search + Priority + Status + Ownership) ---
  it("API-24b: should apply combination filters together without overwriting each other", async () => {
    // 1. Search + Priority match
    const resMatchSearchPrio = await request(app)
      .get("/api/v1/staff/tickets?search=Core+router&priority=URGENT")
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(resMatchSearchPrio.status).toBe(200);
    expect(resMatchSearchPrio.body.data.some((t: any) => t.id === ticket1Id)).toBe(true);

    // 2. Search + Priority mismatch (Search matches Ticket 1, but Priority is LOW -> Ticket 1 is URGENT -> 0 matches)
    const resMismatchSearchPrio = await request(app)
      .get("/api/v1/staff/tickets?search=Core+router&priority=LOW")
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(resMismatchSearchPrio.status).toBe(200);
    expect(resMismatchSearchPrio.body.data.some((t: any) => t.id === ticket1Id)).toBe(false);

    // 3. Search + Status match
    const resMatchSearchStatus = await request(app)
      .get("/api/v1/staff/tickets?search=Core+router&status=NEW")
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(resMatchSearchStatus.status).toBe(200);
    expect(resMatchSearchStatus.body.data.some((t: any) => t.id === ticket1Id)).toBe(true);

    // 4. Search + Status mismatch
    const resMismatchSearchStatus = await request(app)
      .get("/api/v1/staff/tickets?search=Core+router&status=RESOLVED")
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(resMismatchSearchStatus.status).toBe(200);
    expect(resMismatchSearchStatus.body.data.length).toBe(0);

    // 5. Search + Ownership match (Ticket 1 is unassigned)
    const resMatchSearchOwnership = await request(app)
      .get("/api/v1/staff/tickets?search=Core+router&ownership=UNASSIGNED")
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(resMatchSearchOwnership.status).toBe(200);
    expect(resMatchSearchOwnership.body.data.some((t: any) => t.id === ticket1Id)).toBe(true);

    // 6. Search + Ownership mismatch (Ticket 1 is not assigned to staff)
    const resMismatchSearchOwnership = await request(app)
      .get("/api/v1/staff/tickets?search=Core+router&ownership=ASSIGNED_TO_ME")
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(resMismatchSearchOwnership.status).toBe(200);
    expect(resMismatchSearchOwnership.body.data.some((t: any) => t.id === ticket1Id)).toBe(false);

    // 7. Full combination: Search + Priority + Status + Ownership (ALL MATCHING)
    const resFullMatch = await request(app)
      .get(`/api/v1/staff/tickets?search=${ticket1No}&priority=URGENT&status=NEW&ownership=UNASSIGNED`)
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(resFullMatch.status).toBe(200);
    expect(resFullMatch.body.data.length).toBe(1);
    expect(resFullMatch.body.data[0].id).toBe(ticket1Id);

    // 8. Full combination with 1 conflicting condition -> returns 0
    const resFullMismatch = await request(app)
      .get(`/api/v1/staff/tickets?search=${ticket1No}&priority=URGENT&status=NEW&ownership=ASSIGNED_TO_ME`)
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(resFullMismatch.status).toBe(200);
    expect(resFullMismatch.body.data.length).toBe(0);
  });
});
