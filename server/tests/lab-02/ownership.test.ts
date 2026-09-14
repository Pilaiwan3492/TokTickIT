import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { signToken } from "../../src/utils/jwt.js";

describe("Ticket Ownership Guard & Requester Context Middleware", () => {
  let activeRequesterAId: number;
  let activeRequesterBId: number;
  let tokenA: string;
  let tokenB: string;
  let tokenInactive: string;
  let ticketAId: string;

  beforeAll(async () => {
    const prisma = getPrisma();
    const defaultHash = bcrypt.hashSync("Password123!", 10);

    // Dedicated User A & Requester A
    const userA = await prisma.user.upsert({
      where: { email: "ownership.user.a@example.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "ownership.user.a@example.com",
        name: "Ownership User A",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    const reqA = await prisma.requesterUser.upsert({
      where: { email: "ownership.user.a@example.com" },
      update: { userId: userA.id, isActive: true },
      create: {
        name: "Ownership User A",
        email: "ownership.user.a@example.com",
        userId: userA.id,
        isActive: true,
      },
    });
    activeRequesterAId = reqA.id;

    // Dedicated User B & Requester B
    const userB = await prisma.user.upsert({
      where: { email: "ownership.user.b@example.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "ownership.user.b@example.com",
        name: "Ownership User B",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    const reqB = await prisma.requesterUser.upsert({
      where: { email: "ownership.user.b@example.com" },
      update: { userId: userB.id, isActive: true },
      create: {
        name: "Ownership User B",
        email: "ownership.user.b@example.com",
        userId: userB.id,
        isActive: true,
      },
    });
    activeRequesterBId = reqB.id;

    // Dedicated Inactive User & Requester
    const userInactive = await prisma.user.upsert({
      where: { email: "ownership.inactive@example.com" },
      update: { isActive: false, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "ownership.inactive@example.com",
        name: "Ownership Inactive User",
        role: "REQUESTER",
        isActive: false,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    await prisma.requesterUser.upsert({
      where: { email: "ownership.inactive@example.com" },
      update: { userId: userInactive.id, isActive: false },
      create: {
        name: "Ownership Inactive User",
        email: "ownership.inactive@example.com",
        userId: userInactive.id,
        isActive: false,
      },
    });

    tokenA = signToken({
      id: userA.id,
      email: userA.email,
      name: userA.name,
      role: "REQUESTER",
      mustChangePassword: false,
    });

    tokenB = signToken({
      id: userB.id,
      email: userB.email,
      name: userB.name,
      role: "REQUESTER",
      mustChangePassword: false,
    });

    tokenInactive = signToken({
      id: userInactive.id,
      email: userInactive.email,
      name: userInactive.name,
      role: "REQUESTER",
      mustChangePassword: false,
    });

    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const system = await prisma.relatedSystem.findFirst({ where: { isActive: true } });
    expect(category).not.toBeNull();
    expect(system).not.toBeNull();

    const newTicket = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-TEST-${Date.now()}`,
        userId: userA.id,
        requesterId: activeRequesterAId,
        categoryId: category!.id,
        relatedSystemId: system!.id,
        summary: "Test Ticket for Guard",
        description: "Ownership testing description",
        requestedPriority: "LOW",
      },
    });
    ticketAId = newTicket.id;
  });

  // 1. Missing Authentication Token -> HTTP 401
  it("should return 401 Unauthorized when auth token is missing", async () => {
    const res = await request(app).get(`/api/v1/tickets/${ticketAId}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("SESSION_INVALID");
  });

  // 2. Inactive Requester Token -> HTTP 401 ACCOUNT_INACTIVE
  it("should return 401 Unauthorized when requester account is inactive", async () => {
    const res = await request(app)
      .get(`/api/v1/tickets/${ticketAId}`)
      .set("Authorization", `Bearer ${tokenInactive}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("ACCOUNT_INACTIVE");
  });

  // 3. Ticket Not Found -> HTTP 404
  it("should return 404 Not Found when ticket does not exist", async () => {
    const fakeUuid = "00000000-0000-0000-0000-000000000000";
    const res = await request(app)
      .get(`/api/v1/tickets/${fakeUuid}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("TICKET_NOT_FOUND");
    expect(res.body.error.message).toBe("Ticket not found.");
  });

  // 4. Other Requester (Cross-user access) -> HTTP 403
  it("should return 403 Forbidden when Requester B attempts to access Requester A's ticket", async () => {
    const res = await request(app)
      .get(`/api/v1/tickets/${ticketAId}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(res.body.error.message).toBe(
      "You do not have permission to access this ticket."
    );
  });

  // 5. Owner Access -> HTTP 200
  it("should return 200 OK with wrapped data when ticket owner accesses their own ticket", async () => {
    const res = await request(app)
      .get(`/api/v1/tickets/${ticketAId}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe(ticketAId);
    expect(res.body.data.requesterId).toBe(activeRequesterAId);
  });
});