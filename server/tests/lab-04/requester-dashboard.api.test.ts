import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Requester Dashboard API Tests (Lab 4 — Issue 36: API-23..API-26)", () => {
  const prisma = getPrisma();

  let tokenRequesterOwner: string;
  let tokenRequesterEmpty: string;
  let tokenStaff: string;

  let ownerUserId: string;
  let ownerProfileId: number;
  let otherUserId: string;
  let otherProfileId: number;
  let emptyUserId: string;
  let testCategoryId: number;
  let testRelatedSystemId: number;

  beforeAll(async () => {
    const defaultHash = bcrypt.hashSync("Password123!", 10);

    // Ensure reference Category & RelatedSystem exist
    const category = await prisma.category.upsert({
      where: { name: "Hardware" },
      update: { isActive: true },
      create: { name: "Hardware", isActive: true },
    });
    testCategoryId = category.id;

    const relatedSystem = await prisma.relatedSystem.upsert({
      where: { name: "Email & Calendar" },
      update: { isActive: true },
      create: { name: "Email & Calendar", isActive: true },
    });
    testRelatedSystemId = relatedSystem.id;

    // 1. Setup Requester Owner (has tickets across NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, 6 RESOLVED, 2 CLOSED)
    const ownerUser = await prisma.user.upsert({
      where: { email: "dash.req.owner@example.com" },
      update: {
        name: "Jennifer Dashboard Owner",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
      create: {
        email: "dash.req.owner@example.com",
        name: "Jennifer Dashboard Owner",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    ownerUserId = ownerUser.id;

    const ownerProfile = await prisma.requesterUser.upsert({
      where: { email: "dash.req.owner@example.com" },
      update: { userId: ownerUser.id, isActive: true, name: ownerUser.name },
      create: {
        email: "dash.req.owner@example.com",
        name: ownerUser.name,
        userId: ownerUser.id,
        isActive: true,
      },
    });
    ownerProfileId = ownerProfile.id;

    // 2. Setup Another Requester (to verify zero cross-requester leakage)
    const otherUser = await prisma.user.upsert({
      where: { email: "dash.req.other@example.com" },
      update: {
        name: "Other Requester",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
      create: {
        email: "dash.req.other@example.com",
        name: "Other Requester",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    otherUserId = otherUser.id;

    const otherProfile = await prisma.requesterUser.upsert({
      where: { email: "dash.req.other@example.com" },
      update: { userId: otherUser.id, isActive: true, name: otherUser.name },
      create: {
        email: "dash.req.other@example.com",
        name: otherUser.name,
        userId: otherUser.id,
        isActive: true,
      },
    });
    otherProfileId = otherProfile.id;

    // 3. Setup Empty Requester (zero tickets)
    const emptyUser = await prisma.user.upsert({
      where: { email: "dash.req.empty@example.com" },
      update: {
        name: "Empty Requester",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
      create: {
        email: "dash.req.empty@example.com",
        name: "Empty Requester",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    emptyUserId = emptyUser.id;

    await prisma.requesterUser.upsert({
      where: { email: "dash.req.empty@example.com" },
      update: { userId: emptyUser.id, isActive: true, name: emptyUser.name },
      create: {
        email: "dash.req.empty@example.com",
        name: emptyUser.name,
        userId: emptyUser.id,
        isActive: true,
      },
    });

    // 4. Setup IT Staff user (for role boundary test)
    await prisma.user.upsert({
      where: { email: "dash.req.staff@toktickit.com" },
      update: {
        name: "Staff Role Tester",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
      create: {
        email: "dash.req.staff@toktickit.com",
        name: "Staff Role Tester",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    // Clean any pre-existing test tickets for these dedicated test users
    await prisma.ticket.deleteMany({
      where: {
        OR: [
          { userId: { in: [ownerUserId, otherUserId, emptyUserId] } },
          { ticketNo: { startsWith: "TKT-DASH-REQ-" } },
        ],
      },
    });

    // Seed Owner's tickets:
    // - 1 NEW, 1 OPEN, 1 IN_PROGRESS, 2 WAITING_FOR_REQUESTER => openTickets = 5, waitingForRequester = 2
    // - 6 RESOLVED (with distinct updatedAt timestamps to test top-5 ordering) => resolved = 6
    // - 2 CLOSED => closed = 2
    const ownerTickets = [
      {
        ticketNo: "TKT-DASH-REQ-001",
        summary: "Owner New Ticket",
        status: "NEW" as const,
        priority: "LOW" as const,
        updatedAt: new Date("2026-09-01T08:00:00.000Z"),
      },
      {
        ticketNo: "TKT-DASH-REQ-002",
        summary: "Owner Open Ticket",
        status: "OPEN" as const,
        priority: "MEDIUM" as const,
        updatedAt: new Date("2026-09-01T09:00:00.000Z"),
      },
      {
        ticketNo: "TKT-DASH-REQ-003",
        summary: "Owner In Progress Ticket",
        status: "IN_PROGRESS" as const,
        priority: "HIGH" as const,
        updatedAt: new Date("2026-09-01T10:00:00.000Z"),
      },
      {
        ticketNo: "TKT-DASH-REQ-004",
        summary: "Owner Waiting Ticket 1",
        status: "WAITING_FOR_REQUESTER" as const,
        priority: "MEDIUM" as const,
        updatedAt: new Date("2026-09-01T11:00:00.000Z"),
      },
      {
        ticketNo: "TKT-DASH-REQ-005",
        summary: "Owner Waiting Ticket 2",
        status: "WAITING_FOR_REQUESTER" as const,
        priority: "HIGH" as const,
        updatedAt: new Date("2026-09-01T12:00:00.000Z"),
      },
      // 6 RESOLVED tickets (006 is oldest resolved, 011 is newest resolved)
      {
        ticketNo: "TKT-DASH-REQ-006",
        summary: "Resolved Ticket 1 (Oldest)",
        status: "RESOLVED" as const,
        priority: "LOW" as const,
        updatedAt: new Date("2026-09-02T01:00:00.000Z"),
      },
      {
        ticketNo: "TKT-DASH-REQ-007",
        summary: "Resolved Ticket 2",
        status: "RESOLVED" as const,
        priority: "LOW" as const,
        updatedAt: new Date("2026-09-02T02:00:00.000Z"),
      },
      {
        ticketNo: "TKT-DASH-REQ-008",
        summary: "Resolved Ticket 3",
        status: "RESOLVED" as const,
        priority: "MEDIUM" as const,
        updatedAt: new Date("2026-09-02T03:00:00.000Z"),
      },
      {
        ticketNo: "TKT-DASH-REQ-009",
        summary: "Resolved Ticket 4",
        status: "RESOLVED" as const,
        priority: "MEDIUM" as const,
        updatedAt: new Date("2026-09-02T04:00:00.000Z"),
      },
      {
        ticketNo: "TKT-DASH-REQ-010",
        summary: "Resolved Ticket 5",
        status: "RESOLVED" as const,
        priority: "HIGH" as const,
        updatedAt: new Date("2026-09-02T05:00:00.000Z"),
      },
      {
        ticketNo: "TKT-DASH-REQ-011",
        summary: "Resolved Ticket 6 (Newest)",
        status: "RESOLVED" as const,
        priority: "URGENT" as const,
        updatedAt: new Date("2026-09-02T06:00:00.000Z"),
      },
      // 2 CLOSED tickets
      {
        ticketNo: "TKT-DASH-REQ-012",
        summary: "Closed Ticket 1",
        status: "CLOSED" as const,
        priority: "LOW" as const,
        updatedAt: new Date("2026-09-01T07:00:00.000Z"),
      },
      {
        ticketNo: "TKT-DASH-REQ-013",
        summary: "Closed Ticket 2",
        status: "CLOSED" as const,
        priority: "MEDIUM" as const,
        updatedAt: new Date("2026-09-01T07:30:00.000Z"),
      },
    ];

    for (const t of ownerTickets) {
      await prisma.ticket.create({
        data: {
          ticketNo: t.ticketNo,
          requesterId: ownerProfileId,
          userId: ownerUserId,
          categoryId: category.id,
          relatedSystemId: relatedSystem.id,
          summary: t.summary,
          description: `Description for ${t.summary}`,
          requestedPriority: t.priority === "URGENT" ? "HIGH" : t.priority,
          itPriority: t.priority,
          status: t.status,
          currentStatus: t.status,
          updatedAt: t.updatedAt,
        },
      });
    }

    // Seed Other Requester's tickets (must NEVER leak into Owner's or Empty's dashboard)
    await prisma.ticket.create({
      data: {
        ticketNo: "TKT-DASH-REQ-OTHER-001",
        requesterId: otherProfileId,
        userId: otherUserId,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Confidential Ticket Owned By Other Requester",
        description: "Should never appear in another requester's dashboard.",
        requestedPriority: "HIGH",
        itPriority: "URGENT",
        status: "WAITING_FOR_REQUESTER",
        currentStatus: "WAITING_FOR_REQUESTER",
        updatedAt: new Date("2026-09-05T10:00:00.000Z"),
      },
    });

    // Authenticate users
    const loginOwner = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "dash.req.owner@example.com", password: "Password123!" });
    tokenRequesterOwner = loginOwner.body.data.token;

    const loginEmpty = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "dash.req.empty@example.com", password: "Password123!" });
    tokenRequesterEmpty = loginEmpty.body.data.token;

    const loginStaff = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "dash.req.staff@toktickit.com", password: "Password123!" });
    tokenStaff = loginStaff.body.data.token;
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({
      where: {
        ticketNo: { startsWith: "TKT-DASH-REQ-" },
      },
    });
  });

  // =========================================================================
  // API-23: Requester Dashboard returns authoritative counts scoped to caller
  // =========================================================================
  it("API-23: returns authoritative counts (openTickets, waitingForRequester, resolved, closed) and drill-down paths scoped strictly to caller", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard/requester")
      .set("Authorization", `Bearer ${tokenRequesterOwner}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.requesterName).toBe("Jennifer Dashboard Owner");

    // 1 NEW + 1 OPEN + 1 IN_PROGRESS + 2 WAITING_FOR_REQUESTER = 5 openTickets
    expect(res.body.data.metrics).toEqual({
      openTickets: 5,
      waitingForRequester: 2,
      resolved: 6,
      closed: 2,
    });

    // Verify drillDownPaths contract
    expect(res.body.data.drillDownPaths).toEqual({
      openTickets: "/my-tickets?status=open_all",
      waitingForRequester: "/my-tickets?status=WAITING_FOR_REQUESTER",
      resolved: "/my-tickets?status=RESOLVED",
      closed: "/my-tickets?status=CLOSED",
    });

    // Verify recentTickets has max 5 items and zero leakage from otherRequester
    expect(res.body.data.recentTickets).toHaveLength(5);
    for (const item of res.body.data.recentTickets) {
      expect(item.ticketNumber).not.toBe("TKT-DASH-REQ-OTHER-001");
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("ticketNumber");
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("status");
      expect(item).toHaveProperty("priority");
      expect(item).toHaveProperty("updatedAt");
    }
  });

  // =========================================================================
  // API-24: Requester Dashboard for user with zero tickets
  // =========================================================================
  it("API-24: returns 0 counts, recentTickets: [], and recentlyResolvedTickets: [] for a requester with zero tickets", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard/requester")
      .set("Authorization", `Bearer ${tokenRequesterEmpty}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.requesterName).toBe("Empty Requester");
    expect(res.body.data.metrics).toEqual({
      openTickets: 0,
      waitingForRequester: 0,
      resolved: 0,
      closed: 0,
    });
    expect(res.body.data.recentTickets).toEqual([]);
    expect(res.body.data.recentlyResolvedTickets).toEqual([]);
  });

  // =========================================================================
  // API-25: Requester Dashboard recently resolved list limited to max 5 records ordered by updatedAt DESC
  // =========================================================================
  it("API-25: limits recentlyResolvedTickets to at most 5 records ordered deterministically by updatedAt DESC", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard/requester")
      .set("Authorization", `Bearer ${tokenRequesterOwner}`);

    expect(res.status).toBe(200);
    const resolvedList = res.body.data.recentlyResolvedTickets;
    expect(Array.isArray(resolvedList)).toBe(true);
    expect(resolvedList).toHaveLength(5);

    // Must contain the 5 newest resolved tickets (011 down to 007), excluding the 6th oldest (006)
    expect(resolvedList.map((t: any) => t.ticketNumber)).toEqual([
      "TKT-DASH-REQ-011",
      "TKT-DASH-REQ-010",
      "TKT-DASH-REQ-009",
      "TKT-DASH-REQ-008",
      "TKT-DASH-REQ-007",
    ]);
    expect(resolvedList.every((t: any) => t.status === "RESOLVED")).toBe(true);
  });

  // =========================================================================
  // API-26: Unauthenticated caller requests Requester Dashboard
  // =========================================================================
  it("API-26: rejects unauthenticated caller with HTTP 401 SESSION_INVALID", async () => {
    const res = await request(app).get("/api/v1/dashboard/requester");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("SESSION_INVALID");
  });

  it("rejects non-requester role (IT_STAFF) calling GET /api/v1/dashboard/requester with HTTP 403 FORBIDDEN", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard/requester")
      .set("Authorization", `Bearer ${tokenStaff}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  // =========================================================================
  // API-23-LEGACY: Legacy Ticket Support & Cross-Requester Isolation (BR-13)
  // =========================================================================
  it("API-23-LEGACY: seamlessly includes legacy tickets (userId: null, requesterId: profileId) while preventing data leakage from other legacy tickets", async () => {
    const defaultHash = bcrypt.hashSync("Password123!", 10);

    // Create legacy test user and linked profile
    const legacyUser = await prisma.user.upsert({
      where: { email: "dash.req.legacy@example.com" },
      update: {
        name: "Legacy Requester User",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
      create: {
        email: "dash.req.legacy@example.com",
        name: "Legacy Requester User",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    const legacyProfile = await prisma.requesterUser.upsert({
      where: { email: "dash.req.legacy@example.com" },
      update: { userId: legacyUser.id, isActive: true, name: legacyUser.name },
      create: {
        email: "dash.req.legacy@example.com",
        name: legacyUser.name,
        userId: legacyUser.id,
        isActive: true,
      },
    });

    // Clean existing test tickets for legacy user
    await prisma.ticket.deleteMany({
      where: {
        OR: [
          { userId: legacyUser.id },
          { requesterId: legacyProfile.id },
          { ticketNo: { startsWith: "TKT-DASH-REQ-LEGACY-" } },
        ],
      },
    });

    // Seed:
    // 1. Modern ticket owned by legacyUser (userId set)
    // 2. Legacy unmigrated ticket owned by legacyUser's profile (userId: null, requesterId: legacyProfile.id) - WAITING_FOR_REQUESTER
    // 3. Legacy resolved ticket (userId: null, requesterId: legacyProfile.id) - RESOLVED
    // 4. Other user's legacy ticket (userId: null, requesterId: otherProfileId) - WAITING_FOR_REQUESTER (MUST NOT LEAK)
    const tickets = [
      {
        ticketNo: "TKT-DASH-REQ-LEGACY-001",
        summary: "Modern Active Ticket",
        status: "OPEN" as const,
        priority: "HIGH" as const,
        userId: legacyUser.id,
        requesterId: legacyProfile.id,
        updatedAt: new Date("2026-09-10T10:00:00.000Z"),
      },
      {
        ticketNo: "TKT-DASH-REQ-LEGACY-002",
        summary: "Legacy Unmigrated Ticket Waiting",
        status: "WAITING_FOR_REQUESTER" as const,
        priority: "MEDIUM" as const,
        userId: null,
        requesterId: legacyProfile.id,
        updatedAt: new Date("2026-09-10T11:00:00.000Z"),
      },
      {
        ticketNo: "TKT-DASH-REQ-LEGACY-003",
        summary: "Legacy Resolved Ticket",
        status: "RESOLVED" as const,
        priority: "LOW" as const,
        userId: null,
        requesterId: legacyProfile.id,
        updatedAt: new Date("2026-09-10T12:00:00.000Z"),
      },
      {
        ticketNo: "TKT-DASH-REQ-LEGACY-OTHER-001",
        summary: "Other User Legacy Ticket",
        status: "WAITING_FOR_REQUESTER" as const,
        priority: "HIGH" as const,
        userId: null,
        requesterId: otherProfileId,
        updatedAt: new Date("2026-09-10T13:00:00.000Z"),
      },
      {
        ticketNo: "TKT-DASH-REQ-LEGACY-OTHER-MODERN-001",
        summary: "Other User Modern Ticket",
        status: "WAITING_FOR_REQUESTER" as const,
        priority: "URGENT" as const,
        userId: otherUserId,
        requesterId: otherProfileId,
        updatedAt: new Date("2026-09-10T14:00:00.000Z"),
      },
    ];

    for (const t of tickets) {
      await prisma.ticket.create({
        data: {
          ticketNo: t.ticketNo,
          requesterId: t.requesterId,
          userId: t.userId,
          categoryId: testCategoryId,
          relatedSystemId: testRelatedSystemId,
          summary: t.summary,
          description: `Description for ${t.summary}`,
          requestedPriority: t.priority === "URGENT" ? "HIGH" : t.priority,
          itPriority: t.priority,
          status: t.status,
          currentStatus: t.status,
          updatedAt: t.updatedAt,
        },
      });
    }

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "dash.req.legacy@example.com", password: "Password123!" });
    const legacyToken = loginRes.body.data.token;

    const res = await request(app)
      .get("/api/v1/dashboard/requester")
      .set("Authorization", `Bearer ${legacyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // 1 OPEN (modern) + 1 WAITING_FOR_REQUESTER (legacy) = 2 openTickets
    // waitingForRequester = 1 (legacy ticket only, other modern/legacy tickets excluded)
    // resolved = 1 (legacy resolved ticket only)
    expect(res.body.data.metrics).toEqual({
      openTickets: 2,
      waitingForRequester: 1,
      resolved: 1,
      closed: 0,
    });

    const recentTicketNumbers = res.body.data.recentTickets.map((t: any) => t.ticketNumber);
    expect(recentTicketNumbers).toContain("TKT-DASH-REQ-LEGACY-001");
    expect(recentTicketNumbers).toContain("TKT-DASH-REQ-LEGACY-002");
    expect(recentTicketNumbers).not.toContain("TKT-DASH-REQ-LEGACY-OTHER-001");
    expect(recentTicketNumbers).not.toContain("TKT-DASH-REQ-LEGACY-OTHER-MODERN-001");

    const resolvedTicketNumbers = res.body.data.recentlyResolvedTickets.map((t: any) => t.ticketNumber);
    expect(resolvedTicketNumbers).toEqual(["TKT-DASH-REQ-LEGACY-003"]);
  });

  // =========================================================================
  // API-23-SECURITY: Prevents Profile Hijacking / Rogue Fallback Adoption
  // =========================================================================
  it("API-23-SECURITY: prevents profile hijacking — requester cannot claim legacy tickets if profile is bound to another user", async () => {
    const defaultHash = bcrypt.hashSync("Password123!", 10);

    // Setup an Attacker user
    const attackerUser = await prisma.user.upsert({
      where: { email: "dash.req.attacker@example.com" },
      update: {
        name: "Attacker User",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
      create: {
        email: "dash.req.attacker@example.com",
        name: "Attacker User",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    // Setup a Victim user and profile (profile is firmly bound to victim user)
    const victimUser = await prisma.user.upsert({
      where: { email: "dash.req.victim@example.com" },
      update: {
        name: "Victim User",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
      create: {
        email: "dash.req.victim@example.com",
        name: "Victim User",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    const victimProfile = await prisma.requesterUser.upsert({
      where: { email: "dash.req.victim@example.com" },
      update: { userId: victimUser.id, isActive: true, name: victimUser.name },
      create: {
        email: "dash.req.victim@example.com",
        name: victimUser.name,
        userId: victimUser.id,
        isActive: true,
      },
    });

    // Clean any prior victim/attacker test tickets
    await prisma.ticket.deleteMany({
      where: {
        OR: [
          { userId: attackerUser.id },
          { ticketNo: { startsWith: "TKT-DASH-REQ-VICTIM-" } },
        ],
      },
    });

    // Seed a legacy ticket associated with victimProfile where userId is null
    await prisma.ticket.create({
      data: {
        ticketNo: "TKT-DASH-REQ-VICTIM-001",
        requesterId: victimProfile.id,
        userId: null,
        categoryId: testCategoryId,
        relatedSystemId: testRelatedSystemId,
        summary: "Victim Unmigrated Secret Ticket",
        description: "Confidential victim orphaned ticket.",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        status: "WAITING_FOR_REQUESTER",
        currentStatus: "WAITING_FOR_REQUESTER",
        updatedAt: new Date("2026-09-12T10:00:00.000Z"),
      },
    });

    const loginAttacker = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "dash.req.attacker@example.com", password: "Password123!" });
    const attackerToken = loginAttacker.body.data.token;

    // Attacker queries their dashboard; must have 0 tickets and zero access to victim's unmigrated ticket
    const res = await request(app)
      .get("/api/v1/dashboard/requester")
      .set("Authorization", `Bearer ${attackerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.metrics).toEqual({
      openTickets: 0,
      waitingForRequester: 0,
      resolved: 0,
      closed: 0,
    });
    expect(res.body.data.recentTickets).toEqual([]);
    expect(res.body.data.recentlyResolvedTickets).toEqual([]);
  });

  // =========================================================================
  // DRILL-DOWN TESTS: Authoritative Backend Filtering & Pagination
  // =========================================================================
  it("DRILLDOWN-01: Requester opens status=RESOLVED — returns only RESOLVED tickets with authoritative database pagination", async () => {
    // Requester Owner has 6 RESOLVED tickets
    const res = await request(app)
      .get("/api/v1/tickets?status=RESOLVED&page=1&limit=10")
      .set("Authorization", `Bearer ${tokenRequesterOwner}`);

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(6);
    expect(res.body.meta.totalPages).toBe(1);
    expect(res.body.data).toHaveLength(6);
    for (const ticket of res.body.data) {
      expect(ticket.currentStatus).toBe("RESOLVED");
    }

    // Verify pagination splitting (limit=5)
    const page1Res = await request(app)
      .get("/api/v1/tickets?status=RESOLVED&page=1&limit=10")
      .set("Authorization", `Bearer ${tokenRequesterOwner}`);
    expect(page1Res.status).toBe(200);
    expect(page1Res.body.meta.total).toBe(6);

    // Limit=10 or 20 (supported limits per API spec: 10, 20, 50)
    const page2Res = await request(app)
      .get("/api/v1/tickets?status=RESOLVED&page=2&limit=10")
      .set("Authorization", `Bearer ${tokenRequesterOwner}`);
    expect(page2Res.status).toBe(200);
    expect(page2Res.body.data).toHaveLength(0); // 6 total items, page 2 has 0
  });

  it("DRILLDOWN-02: Requester opens status=open_all — returns tickets matching all 4 open statuses (NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER) and excludes RESOLVED/CLOSED", async () => {
    // Requester Owner has 5 open tickets (1 NEW, 1 OPEN, 1 IN_PROGRESS, 2 WAITING_FOR_REQUESTER)
    const res = await request(app)
      .get("/api/v1/tickets?status=open_all&limit=10")
      .set("Authorization", `Bearer ${tokenRequesterOwner}`);

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(5);
    expect(res.body.data).toHaveLength(5);

    const allowedOpenStatuses = ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER"];
    for (const ticket of res.body.data) {
      expect(allowedOpenStatuses).toContain(ticket.currentStatus);
      expect(ticket.currentStatus).not.toBe("RESOLVED");
      expect(ticket.currentStatus).not.toBe("CLOSED");
    }
  });

  it("DRILLDOWN-03: Requester opens status=CLOSED — returns only CLOSED tickets", async () => {
    // Requester Owner has 2 CLOSED tickets
    const res = await request(app)
      .get("/api/v1/tickets?status=CLOSED&limit=10")
      .set("Authorization", `Bearer ${tokenRequesterOwner}`);

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.data).toHaveLength(2);
    for (const ticket of res.body.data) {
      expect(ticket.currentStatus).toBe("CLOSED");
    }
  });

  it("DRILLDOWN-04: Requester A views tickets list (GET /api/v1/tickets) — sees own modern and legacy tickets, zero data leakage from Requester B", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "dash.req.legacy@example.com", password: "Password123!" });
    const legacyToken = loginRes.body.data.token;

    const res = await request(app)
      .get("/api/v1/tickets?limit=50")
      .set("Authorization", `Bearer ${legacyToken}`);

    expect(res.status).toBe(200);
    const ticketNumbers = res.body.data.map((t: any) => t.ticketNo);

    // LegacyUser's modern and unmigrated tickets MUST be present
    expect(ticketNumbers).toContain("TKT-DASH-REQ-LEGACY-001");
    expect(ticketNumbers).toContain("TKT-DASH-REQ-LEGACY-002");
    expect(ticketNumbers).toContain("TKT-DASH-REQ-LEGACY-003");

    // Other user's tickets (modern and legacy) MUST NEVER be present
    expect(ticketNumbers).not.toContain("TKT-DASH-REQ-LEGACY-OTHER-001");
    expect(ticketNumbers).not.toContain("TKT-DASH-REQ-OTHER-001");
    expect(ticketNumbers).not.toContain("TKT-DASH-REQ-VICTIM-001");
  });

  // =========================================================================
  // DRILLDOWN-PAGING: Multi-page Pagination (> 10 items) for Filtered Statuses
  // =========================================================================
  it("DRILLDOWN-PAGING-01: Multi-page Pagination for status=RESOLVED (> 10 items) — verifies total, totalPages, page boundaries, and zero duplicates across pages", async () => {
    const defaultHash = bcrypt.hashSync("Password123!", 10);

    // Dedicated pagination test requester
    const pagingUser = await prisma.user.upsert({
      where: { email: "dash.req.paging@example.com" },
      update: {
        name: "Paging Requester",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
      create: {
        email: "dash.req.paging@example.com",
        name: "Paging Requester",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    const pagingProfile = await prisma.requesterUser.upsert({
      where: { email: "dash.req.paging@example.com" },
      update: { userId: pagingUser.id, isActive: true, name: pagingUser.name },
      create: {
        email: "dash.req.paging@example.com",
        name: pagingUser.name,
        userId: pagingUser.id,
        isActive: true,
      },
    });

    // Clean any prior tickets for this test user
    await prisma.ticket.deleteMany({
      where: {
        OR: [
          { userId: pagingUser.id },
          { ticketNo: { startsWith: "TKT-DASH-REQ-PAGING-" } },
        ],
      },
    });

    // Seed 15 RESOLVED tickets + 2 CLOSED tickets + 1 OPEN ticket
    const resolvedData = Array.from({ length: 15 }, (_, i) => ({
      ticketNo: `TKT-DASH-REQ-PAGING-RES-${String(i + 1).padStart(2, "0")}`,
      userId: pagingUser.id,
      requesterId: pagingProfile.id,
      categoryId: testCategoryId,
      relatedSystemId: testRelatedSystemId,
      summary: `Paging Resolved Ticket ${i + 1}`,
      description: `Testing pagination of resolved tickets ${i + 1}`,
      requestedPriority: "MEDIUM" as const,
      itPriority: "MEDIUM" as const,
      status: "RESOLVED" as const,
      currentStatus: "RESOLVED" as const,
      updatedAt: new Date(Date.now() - (15 - i) * 60000), // Distinct timestamps
    }));

    const otherData = [
      {
        ticketNo: "TKT-DASH-REQ-PAGING-CLS-01",
        userId: pagingUser.id,
        requesterId: pagingProfile.id,
        categoryId: testCategoryId,
        relatedSystemId: testRelatedSystemId,
        summary: "Paging Closed Ticket 1",
        description: "Testing non-resolved exclusion",
        requestedPriority: "LOW" as const,
        itPriority: "LOW" as const,
        status: "CLOSED" as const,
        currentStatus: "CLOSED" as const,
        updatedAt: new Date(),
      },
      {
        ticketNo: "TKT-DASH-REQ-PAGING-CLS-02",
        userId: pagingUser.id,
        requesterId: pagingProfile.id,
        categoryId: testCategoryId,
        relatedSystemId: testRelatedSystemId,
        summary: "Paging Closed Ticket 2",
        description: "Testing non-resolved exclusion",
        requestedPriority: "LOW" as const,
        itPriority: "LOW" as const,
        status: "CLOSED" as const,
        currentStatus: "CLOSED" as const,
        updatedAt: new Date(),
      },
      {
        ticketNo: "TKT-DASH-REQ-PAGING-OPN-01",
        userId: pagingUser.id,
        requesterId: pagingProfile.id,
        categoryId: testCategoryId,
        relatedSystemId: testRelatedSystemId,
        summary: "Paging Open Ticket 1",
        description: "Testing non-resolved exclusion",
        requestedPriority: "HIGH" as const,
        itPriority: "HIGH" as const,
        status: "OPEN" as const,
        currentStatus: "OPEN" as const,
        updatedAt: new Date(),
      },
    ];

    await prisma.ticket.createMany({
      data: [...resolvedData, ...otherData],
    });

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "dash.req.paging@example.com", password: "Password123!" });
    const pagingToken = loginRes.body.data.token;

    // 1. Fetch Page 1 (limit=10)
    const page1Res = await request(app)
      .get("/api/v1/tickets?status=RESOLVED&page=1&limit=10")
      .set("Authorization", `Bearer ${pagingToken}`);

    expect(page1Res.status).toBe(200);
    expect(page1Res.body.meta.total).toBe(15);
    expect(page1Res.body.meta.page).toBe(1);
    expect(page1Res.body.meta.limit).toBe(10);
    expect(page1Res.body.meta.totalPages).toBe(2);
    expect(page1Res.body.data).toHaveLength(10);

    const page1TicketNos: string[] = page1Res.body.data.map((t: any) => t.ticketNo);
    for (const ticket of page1Res.body.data) {
      expect(ticket.currentStatus).toBe("RESOLVED");
    }

    // 2. Fetch Page 2 (limit=10)
    const page2Res = await request(app)
      .get("/api/v1/tickets?status=RESOLVED&page=2&limit=10")
      .set("Authorization", `Bearer ${pagingToken}`);

    expect(page2Res.status).toBe(200);
    expect(page2Res.body.meta.total).toBe(15);
    expect(page2Res.body.meta.page).toBe(2);
    expect(page2Res.body.meta.limit).toBe(10);
    expect(page2Res.body.meta.totalPages).toBe(2);
    expect(page2Res.body.data).toHaveLength(5);

    const page2TicketNos: string[] = page2Res.body.data.map((t: any) => t.ticketNo);
    for (const ticket of page2Res.body.data) {
      expect(ticket.currentStatus).toBe("RESOLVED");
    }

    // 3. Verify zero duplicates between pages (Disjoint sets)
    const duplicates = page1TicketNos.filter((t) => page2TicketNos.includes(t));
    expect(duplicates).toHaveLength(0);

    // 4. Verify all 15 tickets are accounted for across pages
    const allRetrieved = new Set([...page1TicketNos, ...page2TicketNos]);
    expect(allRetrieved.size).toBe(15);

    // 5. Verify non-resolved tickets are completely excluded
    expect(allRetrieved.has("TKT-DASH-REQ-PAGING-CLS-01")).toBe(false);
    expect(allRetrieved.has("TKT-DASH-REQ-PAGING-CLS-02")).toBe(false);
    expect(allRetrieved.has("TKT-DASH-REQ-PAGING-OPN-01")).toBe(false);

    // 6. Fetch Page 3 (beyond last page -> returns empty data, total remains 15)
    const page3Res = await request(app)
      .get("/api/v1/tickets?status=RESOLVED&page=3&limit=10")
      .set("Authorization", `Bearer ${pagingToken}`);

    expect(page3Res.status).toBe(200);
    expect(page3Res.body.meta.total).toBe(15);
    expect(page3Res.body.meta.page).toBe(3);
    expect(page3Res.body.meta.totalPages).toBe(2);
    expect(page3Res.body.data).toHaveLength(0);
  });

  it("DRILLDOWN-PAGING-02: Multi-page Pagination for status=open_all (> 10 items) — verifies total, totalPages, and page distribution across all 4 open statuses", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "dash.req.paging@example.com", password: "Password123!" });
    const pagingToken = loginRes.body.data.token;

    const pagingUser = await prisma.user.findUnique({
      where: { email: "dash.req.paging@example.com" },
    });
    const pagingProfile = await prisma.requesterUser.findUnique({
      where: { email: "dash.req.paging@example.com" },
    });

    // Seed 12 additional open tickets across NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER
    // (Paging user already has 1 open ticket from previous test => total will be 13)
    const openStatuses = ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER"] as const;
    const moreOpenTickets = Array.from({ length: 12 }, (_, i) => ({
      ticketNo: `TKT-DASH-REQ-PAGING-OPN-${String(i + 2).padStart(2, "0")}`,
      userId: pagingUser!.id,
      requesterId: pagingProfile!.id,
      categoryId: testCategoryId,
      relatedSystemId: testRelatedSystemId,
      summary: `Paging Open Ticket ${i + 2}`,
      description: `Testing open_all multi-page pagination ${i + 2}`,
      requestedPriority: "HIGH" as const,
      itPriority: "HIGH" as const,
      status: openStatuses[i % openStatuses.length],
      currentStatus: openStatuses[i % openStatuses.length],
      updatedAt: new Date(Date.now() - (12 - i) * 60000),
    }));

    await prisma.ticket.createMany({
      data: moreOpenTickets,
    });

    // 13 open tickets total: page 1 has 10, page 2 has 3
    const page1Res = await request(app)
      .get("/api/v1/tickets?status=open_all&page=1&limit=10")
      .set("Authorization", `Bearer ${pagingToken}`);

    expect(page1Res.status).toBe(200);
    expect(page1Res.body.meta.total).toBe(13);
    expect(page1Res.body.meta.totalPages).toBe(2);
    expect(page1Res.body.data).toHaveLength(10);

    const page1TicketNos: string[] = page1Res.body.data.map((t: any) => t.ticketNo);
    for (const ticket of page1Res.body.data) {
      expect(["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER"]).toContain(ticket.currentStatus);
      expect(ticket.currentStatus).not.toBe("RESOLVED");
      expect(ticket.currentStatus).not.toBe("CLOSED");
    }

    const page2Res = await request(app)
      .get("/api/v1/tickets?status=open_all&page=2&limit=10")
      .set("Authorization", `Bearer ${pagingToken}`);

    expect(page2Res.status).toBe(200);
    expect(page2Res.body.meta.total).toBe(13);
    expect(page2Res.body.meta.totalPages).toBe(2);
    expect(page2Res.body.data).toHaveLength(3);

    const page2TicketNos: string[] = page2Res.body.data.map((t: any) => t.ticketNo);
    for (const ticket of page2Res.body.data) {
      expect(["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER"]).toContain(ticket.currentStatus);
    }

    // Zero duplicates between page 1 and page 2
    const duplicates = page1TicketNos.filter((t) => page2TicketNos.includes(t));
    expect(duplicates).toHaveLength(0);

    // All 13 accounted for
    const allOpenRetrieved = new Set([...page1TicketNos, ...page2TicketNos]);
    expect(allOpenRetrieved.size).toBe(13);

    // None of the 15 RESOLVED or 2 CLOSED tickets are included
    for (const t of page1Res.body.data.concat(page2Res.body.data)) {
      expect(t.currentStatus).not.toBe("RESOLVED");
      expect(t.currentStatus).not.toBe("CLOSED");
    }
  });
});
