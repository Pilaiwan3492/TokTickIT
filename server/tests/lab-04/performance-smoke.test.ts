import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Performance-Smoke Tests (Lab 4 — PERF-01, PERF-02)", () => {
  const prisma = getPrisma();

  let tokenRequester: string;
  let tokenStaff: string;
  let perfTicketId: string;

  beforeAll(async () => {
    const defaultHash = bcrypt.hashSync("Password123!", 10);

    const category = await prisma.category.upsert({
      where: { name: "Hardware" },
      update: { isActive: true },
      create: { name: "Hardware", isActive: true },
    });

    const relatedSystem = await prisma.relatedSystem.upsert({
      where: { name: "ERP System" },
      update: { isActive: true },
      create: { name: "ERP System", isActive: true },
    });

    const reqUser = await prisma.user.upsert({
      where: { email: "perf.requester@example.com" },
      update: {
        name: "Perf Requester",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
      create: {
        email: "perf.requester@example.com",
        name: "Perf Requester",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    const reqProfile = await prisma.requesterUser.upsert({
      where: { email: "perf.requester@example.com" },
      update: { userId: reqUser.id, isActive: true, name: reqUser.name },
      create: {
        email: "perf.requester@example.com",
        name: reqUser.name,
        userId: reqUser.id,
        isActive: true,
      },
    });

    const staffUser = await prisma.user.upsert({
      where: { email: "perf.staff@toktickit.com" },
      update: {
        name: "Perf Staff",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
      create: {
        email: "perf.staff@toktickit.com",
        name: "Perf Staff",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    await prisma.ticket.deleteMany({
      where: { ticketNo: "TKT-PERF-SMOKE-001" },
    });

    const ticket = await prisma.ticket.create({
      data: {
        ticketNo: "TKT-PERF-SMOKE-001",
        requesterId: reqProfile.id,
        userId: reqUser.id,
        ownerId: staffUser.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Performance smoke test ticket",
        description: "Used for latency smoke verification.",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        status: "IN_PROGRESS",
        currentStatus: "IN_PROGRESS",
      },
    });
    perfTicketId = ticket.id;

    const loginReq = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "perf.requester@example.com", password: "Password123!" });
    tokenRequester = loginReq.body.data.token;

    const loginStaff = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "perf.staff@toktickit.com", password: "Password123!" });
    tokenStaff = loginStaff.body.data.token;

    // Warm up Prisma connection pool before measuring latency
    await request(app)
      .get("/api/v1/dashboard/requester")
      .set("Authorization", `Bearer ${tokenRequester}`);
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({
      where: { ticketNo: "TKT-PERF-SMOKE-001" },
    });
  });

  // =========================================================================
  // PERF-01: Requester and Staff Dashboard response times (< 300ms smoke target)
  // =========================================================================
  it("PERF-01: completes Requester and Staff Dashboard aggregations within 300ms smoke threshold", async () => {
    const startReq = performance.now();
    const resReq = await request(app)
      .get("/api/v1/dashboard/requester")
      .set("Authorization", `Bearer ${tokenRequester}`);
    const elapsedReq = performance.now() - startReq;

    expect(resReq.status).toBe(200);
    expect(elapsedReq).toBeLessThan(300);

    const startStaff = performance.now();
    const resStaff = await request(app)
      .get("/api/v1/dashboard/staff")
      .set("Authorization", `Bearer ${tokenStaff}`);
    const elapsedStaff = performance.now() - startStaff;

    expect(resStaff.status).toBe(200);
    expect(elapsedStaff).toBeLessThan(300);
  });

  // =========================================================================
  // PERF-02: Actions Taken list query (< 150ms) and creation (< 200ms) smoke target
  // =========================================================================
  it("PERF-02: completes Actions Taken list retrieval (< 150ms) and creation (< 200ms) within smoke thresholds", async () => {
    const ticketBefore = await prisma.ticket.findUniqueOrThrow({
      where: { id: perfTicketId },
    });

    const startCreate = performance.now();
    const resCreate = await request(app)
      .post(`/api/v1/tickets/${perfTicketId}/actions-taken`)
      .set("Authorization", `Bearer ${tokenStaff}`)
      .send({
        actionDate: new Date().toISOString(),
        actionDescription: "Executed indexed query latency verification",
        result: "Response completed within engineering threshold",
        followUpRequired: false,
        expectedTicketUpdatedAt: ticketBefore.updatedAt.toISOString(),
      });
    const elapsedCreate = performance.now() - startCreate;

    expect(resCreate.status).toBe(201);
    expect(elapsedCreate).toBeLessThan(200);

    const startList = performance.now();
    const resList = await request(app)
      .get(`/api/v1/tickets/${perfTicketId}/actions-taken`)
      .set("Authorization", `Bearer ${tokenStaff}`);
    const elapsedList = performance.now() - startList;

    expect(resList.status).toBe(200);
    expect(elapsedList).toBeLessThan(150);
  });
});
