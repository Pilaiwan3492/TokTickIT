import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";
import { getPrisma } from "../../src/prisma.js";

describe("IT Staff & Administrator Dashboard API Tests (Lab 4 — Issue 36: API-27..API-33)", () => {
  const prisma = getPrisma();

  let tokenStaffPrimary: string;
  let tokenStaffSecondary: string;
  let tokenAdmin: string;
  let tokenRequester: string;

  let staffPrimaryId: string;
  let staffSecondaryId: string;
  let requesterUserId: string;
  let requesterProfileId: number;
  let actionTicketId: string;

  beforeAll(async () => {
    const defaultHash = bcrypt.hashSync("Password123!", 10);

    const category = await prisma.category.upsert({
      where: { name: "Hardware" },
      update: { isActive: true },
      create: { name: "Hardware", isActive: true },
    });

    const relatedSystem = await prisma.relatedSystem.upsert({
      where: { name: "VPN & Remote Access" },
      update: { isActive: true },
      create: { name: "VPN & Remote Access", isActive: true },
    });

    // 1. Setup Primary IT Staff
    const staffPrimary = await prisma.user.upsert({
      where: { email: "dash.staff.primary@toktickit.com" },
      update: {
        name: "Michael Staff Primary",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
      create: {
        email: "dash.staff.primary@toktickit.com",
        name: "Michael Staff Primary",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    staffPrimaryId = staffPrimary.id;

    // 2. Setup Secondary IT Staff
    const staffSecondary = await prisma.user.upsert({
      where: { email: "dash.staff.secondary@toktickit.com" },
      update: {
        name: "Sarah Staff Secondary",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
      create: {
        email: "dash.staff.secondary@toktickit.com",
        name: "Sarah Staff Secondary",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    staffSecondaryId = staffSecondary.id;

    // 3. Setup Administrator
    await prisma.user.upsert({
      where: { email: "dash.admin@toktickit.com" },
      update: {
        name: "Elena System Admin",
        role: "ADMIN",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
      create: {
        email: "dash.admin@toktickit.com",
        name: "Elena System Admin",
        role: "ADMIN",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    // 4. Setup Requester
    const reqUser = await prisma.user.upsert({
      where: { email: "dash.staff.requester@example.com" },
      update: {
        name: "Caller Requester",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
      create: {
        email: "dash.staff.requester@example.com",
        name: "Caller Requester",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    requesterUserId = reqUser.id;

    const reqProfile = await prisma.requesterUser.upsert({
      where: { email: "dash.staff.requester@example.com" },
      update: { userId: reqUser.id, isActive: true, name: reqUser.name },
      create: {
        email: "dash.staff.requester@example.com",
        name: reqUser.name,
        userId: reqUser.id,
        isActive: true,
      },
    });
    requesterProfileId = reqProfile.id;

    // Clean any previous test tickets/actions from this suite
    await prisma.ticket.deleteMany({
      where: {
        ticketNo: { startsWith: "TKT-DASH-STF-" },
      },
    });
    await prisma.actionTaken.deleteMany({
      where: {
        performedById: { in: [staffPrimaryId, staffSecondaryId] },
      },
    });

    // Create test tickets assigned to staffPrimary, unassigned, and with URGENT/HIGH priorities
    const ticket1 = await prisma.ticket.create({
      data: {
        ticketNo: "TKT-DASH-STF-001",
        requesterId: requesterProfileId,
        userId: requesterUserId,
        ownerId: staffPrimaryId,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Core router BGP session flapping",
        description: "BGP peer drops every 15 minutes.",
        requestedPriority: "HIGH",
        itPriority: "URGENT",
        status: "IN_PROGRESS",
        currentStatus: "IN_PROGRESS",
      },
    });
    actionTicketId = ticket1.id;

    await prisma.ticket.create({
      data: {
        ticketNo: "TKT-DASH-STF-002",
        requesterId: requesterProfileId,
        userId: requesterUserId,
        ownerId: staffPrimaryId,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Firewall rule update for staging cluster",
        description: "Need port 8443 opened.",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        status: "OPEN",
        currentStatus: "OPEN",
      },
    });

    // Terminal CLOSED ticket assigned to staffPrimary (must NOT be counted in active myAssignedCount, urgentCount, or highCount)
    await prisma.ticket.create({
      data: {
        ticketNo: "TKT-DASH-STF-003",
        requesterId: requesterProfileId,
        userId: requesterUserId,
        ownerId: staffPrimaryId,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Closed urgent ticket",
        description: "Terminal closed ticket should be excluded from active counters.",
        requestedPriority: "HIGH",
        itPriority: "URGENT",
        status: "CLOSED",
        currentStatus: "CLOSED",
      },
    });

    // Unassigned NEW ticket
    await prisma.ticket.create({
      data: {
        ticketNo: "TKT-DASH-STF-004",
        requesterId: requesterProfileId,
        userId: requesterUserId,
        ownerId: null,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Unassigned VPN token request",
        description: "New employee needs hardware token.",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        status: "NEW",
        currentStatus: "NEW",
      },
    });

    // Create 6 Actions Taken by staffPrimary (to test myActionsCount = 6 and myRecentActions limited to 5 ordered by actionDate DESC)
    for (let i = 1; i <= 6; i++) {
      await prisma.actionTaken.create({
        data: {
          ticketId: actionTicketId,
          performedById: staffPrimaryId,
          actionDate: new Date(`2026-09-10T1${i}:00:00.000Z`),
          actionDescription: `Primary Staff Action Step ${i}`,
          result: `Completed verification step ${i}`,
          followUpRequired: i === 6,
          followUpNote: i === 6 ? "Monitor BGP stability for 24h" : null,
        },
      });
    }

    // Create 1 Action Taken by staffSecondary (must NOT appear in staffPrimary's myActionsCount/myRecentActions)
    await prisma.actionTaken.create({
      data: {
        ticketId: actionTicketId,
        performedById: staffSecondaryId,
        actionDate: new Date("2026-09-10T18:00:00.000Z"),
        actionDescription: "Secondary Staff Action Step",
        result: "Checked secondary link",
        followUpRequired: false,
      },
    });

    // Login tokens
    const loginStaff1 = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "dash.staff.primary@toktickit.com", password: "Password123!" });
    tokenStaffPrimary = loginStaff1.body.data.token;

    const loginStaff2 = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "dash.staff.secondary@toktickit.com", password: "Password123!" });
    tokenStaffSecondary = loginStaff2.body.data.token;

    const loginAdmin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "dash.admin@toktickit.com", password: "Password123!" });
    tokenAdmin = loginAdmin.body.data.token;

    const loginReq = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "dash.staff.requester@example.com", password: "Password123!" });
    tokenRequester = loginReq.body.data.token;
  });

  afterAll(async () => {
    await prisma.actionTaken.deleteMany({
      where: {
        performedById: { in: [staffPrimaryId, staffSecondaryId] },
      },
    });
    await prisma.ticket.deleteMany({
      where: {
        ticketNo: { startsWith: "TKT-DASH-STF-" },
      },
    });
  });

  // =========================================================================
  // API-27: Staff Dashboard returns 6 primary operational metrics matching DB aggregations
  // =========================================================================
  it("API-27: returns 6 primary operational metrics (newCount, openCount, inProgressCount, waitingForRequesterCount, myAssignedCount, unassignedCount) matching database aggregations", async () => {
    const [
      expectedNew,
      expectedOpen,
      expectedInProgress,
      expectedWaiting,
      expectedMyAssigned,
      expectedUnassigned,
    ] = await Promise.all([
      prisma.ticket.count({ where: { status: "NEW" } }),
      prisma.ticket.count({ where: { status: "OPEN" } }),
      prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { status: "WAITING_FOR_REQUESTER" } }),
      prisma.ticket.count({
        where: {
          ownerId: staffPrimaryId,
          status: { notIn: ["CLOSED", "CANCELLED"] },
        },
      }),
      prisma.ticket.count({
        where: {
          ownerId: null,
          status: { notIn: ["CLOSED", "CANCELLED"] },
        },
      }),
    ]);

    const res = await request(app)
      .get("/api/v1/dashboard/staff")
      .set("Authorization", `Bearer ${tokenStaffPrimary}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.staffName).toBe("Michael Staff Primary");
    expect(res.body.data.role).toBe("IT_STAFF");

    const { metrics, byStatus, drillDownPaths, recentTickets } = res.body.data;
    expect(metrics.newCount).toBe(expectedNew);
    expect(metrics.openCount).toBe(expectedOpen);
    expect(metrics.inProgressCount).toBe(expectedInProgress);
    expect(metrics.waitingForRequesterCount).toBe(expectedWaiting);
    expect(metrics.myAssignedCount).toBe(expectedMyAssigned);
    expect(metrics.myAssignedCount).toBe(2); // TKT-DASH-STF-001 & 002 (003 is CLOSED)
    expect(metrics.unassignedCount).toBe(expectedUnassigned);

    // Verify all 8 statuses exist in byStatus
    expect(byStatus).toHaveProperty("NEW", expectedNew);
    expect(byStatus).toHaveProperty("OPEN", expectedOpen);
    expect(byStatus).toHaveProperty("IN_PROGRESS", expectedInProgress);
    expect(byStatus).toHaveProperty("WAITING_FOR_REQUESTER", expectedWaiting);
    expect(byStatus).toHaveProperty("RESOLVED");
    expect(byStatus).toHaveProperty("CLOSED");
    expect(byStatus).toHaveProperty("REOPENED");
    expect(byStatus).toHaveProperty("CANCELLED");

    // Verify recentTickets (up to 5)
    expect(Array.isArray(recentTickets)).toBe(true);
    expect(recentTickets.length).toBeLessThanOrEqual(5);
    expect(recentTickets.length).toBeGreaterThan(0);

    // Verify drillDownPaths contract
    expect(drillDownPaths).toEqual({
      newCount: "/staff/tickets?status=NEW",
      openCount: "/staff/tickets?status=OPEN",
      inProgressCount: "/staff/tickets?status=IN_PROGRESS",
      waitingForRequesterCount: "/staff/tickets?status=WAITING_FOR_REQUESTER",
      myAssignedCount: "/staff/tickets?ownership=assigned_to_me",
      unassignedCount: "/staff/tickets?ownership=unassigned",
      urgentCount: "/staff/tickets?priority=URGENT",
      highCount: "/staff/tickets?priority=HIGH",
    });
  });

  // =========================================================================
  // API-28: Staff Dashboard returns priority attention counts (urgentCount, highCount)
  // =========================================================================
  it("API-28: returns accurate active priority attention counts (urgentCount, highCount) excluding terminal tickets", async () => {
    const [expectedUrgent, expectedHigh] = await Promise.all([
      prisma.ticket.count({
        where: {
          itPriority: "URGENT",
          status: { notIn: ["CLOSED", "CANCELLED"] },
        },
      }),
      prisma.ticket.count({
        where: {
          itPriority: "HIGH",
          status: { notIn: ["CLOSED", "CANCELLED"] },
        },
      }),
    ]);

    const res = await request(app)
      .get("/api/v1/dashboard/staff")
      .set("Authorization", `Bearer ${tokenStaffPrimary}`);

    expect(res.status).toBe(200);
    expect(res.body.data.metrics.urgentCount).toBe(expectedUrgent);
    expect(res.body.data.metrics.highCount).toBe(expectedHigh);
    expect(res.body.data.metrics.urgentCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.metrics.highCount).toBeGreaterThanOrEqual(1);
  });

  // =========================================================================
  // API-29: Staff Dashboard returns current-user Actions Taken (myActionsCount, myRecentActions max 5)
  // =========================================================================
  it("API-29: returns current-user Actions Taken (myActionsCount and myRecentActions limited to 5 ordered by actionDate DESC)", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard/staff")
      .set("Authorization", `Bearer ${tokenStaffPrimary}`);

    expect(res.status).toBe(200);
    expect(res.body.data.metrics.myActionsCount).toBe(6);

    const myRecentActions = res.body.data.myRecentActions;
    expect(Array.isArray(myRecentActions)).toBe(true);
    expect(myRecentActions).toHaveLength(5);

    // Ordered by actionDate DESC: Step 6 down to Step 2
    expect(myRecentActions.map((a: any) => a.actionDescription)).toEqual([
      "Primary Staff Action Step 6",
      "Primary Staff Action Step 5",
      "Primary Staff Action Step 4",
      "Primary Staff Action Step 3",
      "Primary Staff Action Step 2",
    ]);

    // Verify required fields on each action entry
    expect(myRecentActions[0]).toMatchObject({
      ticketId: actionTicketId,
      ticketNumber: "TKT-DASH-STF-001",
      ticketTitle: "Core router BGP session flapping",
      ticketStatus: "IN_PROGRESS",
      actionDescription: "Primary Staff Action Step 6",
      result: "Completed verification step 6",
      followUpRequired: true,
      followUpNote: "Monitor BGP stability for 24h",
    });
  });

  // =========================================================================
  // API-29b: Staff Dashboard with zero matching operational records
  // =========================================================================
  it("API-29b: returns 0 for all metric counts and empty arrays when zero operational records exist", async () => {
    const emptyTicketMock = {
      revokedToken: prisma.revokedToken,
      user: prisma.user,
      ticket: {
        groupBy: async () => [],
        count: async () => 0,
        findMany: async () => [],
      },
      actionTaken: {
        count: async () => 0,
        findMany: async () => [],
      },
    };

    const getPrismaSpy = vi
      .spyOn(prismaModule, "getPrisma")
      .mockReturnValue(emptyTicketMock as any);

    try {
      const res = await request(app)
        .get("/api/v1/dashboard/staff")
        .set("Authorization", `Bearer ${tokenStaffSecondary}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics).toEqual({
        newCount: 0,
        openCount: 0,
        inProgressCount: 0,
        waitingForRequesterCount: 0,
        myAssignedCount: 0,
        unassignedCount: 0,
        urgentCount: 0,
        highCount: 0,
        myActionsCount: 0,
      });
      expect(res.body.data.byStatus).toEqual({
        NEW: 0,
        OPEN: 0,
        IN_PROGRESS: 0,
        WAITING_FOR_REQUESTER: 0,
        RESOLVED: 0,
        CLOSED: 0,
        REOPENED: 0,
        CANCELLED: 0,
      });
      expect(res.body.data.recentTickets).toEqual([]);
      expect(res.body.data.myRecentActions).toEqual([]);
    } finally {
      getPrismaSpy.mockRestore();
    }
  });

  // =========================================================================
  // API-30: Requester attempts to access Staff Dashboard (GET /api/v1/dashboard/staff)
  // =========================================================================
  it("API-30: rejects Requester attempting to access Staff Dashboard with HTTP 403 FORBIDDEN", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard/staff")
      .set("Authorization", `Bearer ${tokenRequester}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  // =========================================================================
  // API-31: Administrator retrieves Staff Dashboard (includes userStats)
  // =========================================================================
  it("API-31: includes userStats (activeUsers, activeStaff, activeAdmins) when Administrator retrieves Staff Dashboard", async () => {
    const [expectedActiveUsers, expectedActiveStaff, expectedActiveAdmins] =
      await Promise.all([
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { isActive: true, role: "IT_STAFF" } }),
        prisma.user.count({ where: { isActive: true, role: "ADMIN" } }),
      ]);

    const res = await request(app)
      .get("/api/v1/dashboard/staff")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe("ADMIN");
    expect(res.body.data.userStats).toEqual({
      activeUsers: expectedActiveUsers,
      activeStaff: expectedActiveStaff,
      activeAdmins: expectedActiveAdmins,
    });
  });

  // =========================================================================
  // API-32: IT Staff retrieves Staff Dashboard (userStats is null)
  // =========================================================================
  it("API-32: sets userStats to null when IT Staff retrieves Staff Dashboard", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard/staff")
      .set("Authorization", `Bearer ${tokenStaffPrimary}`);

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("IT_STAFF");
    expect(res.body.data.userStats).toBeNull();
  });

  // =========================================================================
  // API-33: Unauthenticated caller requests Staff Dashboard
  // =========================================================================
  it("API-33: rejects unauthenticated caller with HTTP 401 SESSION_INVALID", async () => {
    const res = await request(app).get("/api/v1/dashboard/staff");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("SESSION_INVALID");
  });

  // =========================================================================
  // DRILLDOWN-STAFF: IT Staff Queue Drill-Down Filter Endpoints
  // =========================================================================
  it("DRILLDOWN-STAFF-01: Staff opens ownership=unassigned — returns only unassigned tickets", async () => {
    const res = await request(app)
      .get("/api/v1/staff/tickets?ownership=unassigned")
      .set("Authorization", `Bearer ${tokenStaffPrimary}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    for (const ticket of res.body.data) {
      expect(ticket.owner).toBeNull();
    }
  });

  it("DRILLDOWN-STAFF-02: Staff opens priority=URGENT — returns only URGENT priority tickets", async () => {
    const res = await request(app)
      .get("/api/v1/staff/tickets?priority=URGENT")
      .set("Authorization", `Bearer ${tokenStaffPrimary}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    for (const ticket of res.body.data) {
      const effectivePriority = ticket.itPriority || ticket.requestedPriority;
      expect(effectivePriority).toBe("URGENT");
    }
  });
});
