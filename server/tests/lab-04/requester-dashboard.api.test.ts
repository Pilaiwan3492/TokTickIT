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

  beforeAll(async () => {
    const defaultHash = bcrypt.hashSync("Password123!", 10);

    // Ensure reference Category & RelatedSystem exist
    const category = await prisma.category.upsert({
      where: { name: "Hardware" },
      update: { isActive: true },
      create: { name: "Hardware", isActive: true },
    });

    const relatedSystem = await prisma.relatedSystem.upsert({
      where: { name: "Email & Calendar" },
      update: { isActive: true },
      create: { name: "Email & Calendar", isActive: true },
    });

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
});
