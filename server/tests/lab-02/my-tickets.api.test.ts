import request from "supertest";
import app from "../../src/app.js";
import { describe, test, expect, beforeAll } from "vitest";
import { getPrisma } from "../../src/prisma.js";

describe("My Tickets API Contract Tests (Lab 2 — Section 12)", () => {
  const prisma = getPrisma();
  const validRequesterId = 1;

  beforeAll(async () => {
    // Ensure requester exists
    const req = await prisma.requesterUser.findFirst({ where: { id: validRequesterId, isActive: true } });
    if (!req) {
      await prisma.requesterUser.create({
        data: { id: validRequesterId, name: "Jennifer Anderson", email: "jennifer.anderson@example.com", isActive: true },
      });
    }

    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const relatedSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } });
    expect(category).not.toBeNull();
    expect(relatedSystem).not.toBeNull();

    // Ensure tickets exist with LOW, MEDIUM, and HIGH priorities for validRequesterId
    const hasLow = await prisma.ticket.findFirst({ where: { requesterId: validRequesterId, requestedPriority: "LOW" } });
    if (!hasLow) {
      await prisma.ticket.create({
        data: {
          ticketNo: `TKT-2026-LOW-${Date.now().toString().slice(-5)}`,
          requesterId: validRequesterId,
          categoryId: category!.id,
          relatedSystemId: relatedSystem!.id,
          summary: "Low priority ticket for sorting test",
          description: "Detailed description for low priority ticket.",
          requestedPriority: "LOW",
          currentStatus: "NEW",
          createdAt: new Date("2026-01-01T10:00:00Z"),
        },
      });
    }

    const hasMed = await prisma.ticket.findFirst({ where: { requesterId: validRequesterId, requestedPriority: "MEDIUM" } });
    if (!hasMed) {
      await prisma.ticket.create({
        data: {
          ticketNo: `TKT-2026-MED-${Date.now().toString().slice(-5)}`,
          requesterId: validRequesterId,
          categoryId: category!.id,
          relatedSystemId: relatedSystem!.id,
          summary: "Medium priority ticket for sorting test",
          description: "Detailed description for medium priority ticket.",
          requestedPriority: "MEDIUM",
          currentStatus: "NEW",
          createdAt: new Date("2026-02-01T10:00:00Z"),
        },
      });
    }

    const hasHigh = await prisma.ticket.findFirst({ where: { requesterId: validRequesterId, requestedPriority: "HIGH" } });
    if (!hasHigh) {
      await prisma.ticket.create({
        data: {
          ticketNo: `TKT-2026-HIGH-${Date.now().toString().slice(-5)}`,
          requesterId: validRequesterId,
          categoryId: category!.id,
          relatedSystemId: relatedSystem!.id,
          summary: "High priority ticket for sorting test",
          description: "Detailed description for high priority ticket.",
          requestedPriority: "HIGH",
          currentStatus: "NEW",
          createdAt: new Date("2026-03-01T10:00:00Z"),
        },
      });
    }
  });

  // ---------------------------------------------------------
  // 1. Success Cases & Data Retrieval
  // ---------------------------------------------------------

  test("✓ Should return 200 with paginated tickets list for valid requesterId", async () => {
    const res = await request(app).get(
      `/api/v1/tickets?requesterId=${validRequesterId}`
    );

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("meta");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toMatchObject({
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
      totalPages: expect.any(Number),
    });
  });

  test("✓ Should filter and return records that match search query in ticketNo, summary, or description", async () => {
    const sampleTicket = await prisma.ticket.findFirst({
      where: { requesterId: validRequesterId },
    });
    expect(sampleTicket).not.toBeNull();

    const query = sampleTicket!.summary
      ? sampleTicket!.summary.trim().split(" ")[0]
      : "TCK";

    const res = await request(app).get(
      `/api/v1/tickets?requesterId=${validRequesterId}&search=${encodeURIComponent(query)}`
    );

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    res.body.data.forEach((ticket: any) => {
      const isMatched =
        ticket.ticketNo.toLowerCase().includes(query.toLowerCase()) ||
        ticket.summary.toLowerCase().includes(query.toLowerCase()) ||
        ticket.description.toLowerCase().includes(query.toLowerCase());
      expect(isMatched).toBe(true);
    });
  });

  test("✓ Should return empty array when page exceeds totalPages or when no matching records exist", async () => {
    const resExceed = await request(app).get(
      `/api/v1/tickets?requesterId=${validRequesterId}&page=9999`
    );

    expect(resExceed.status).toBe(200);
    expect(resExceed.body.data).toEqual([]);

    const resNoMatch = await request(app).get(
      `/api/v1/tickets?requesterId=${validRequesterId}&search=NON_EXISTENT_QUERY_XYZ_12345`
    );

    expect(resNoMatch.status).toBe(200);
    expect(resNoMatch.body.data).toEqual([]);
    expect(resNoMatch.body.meta.total).toBe(0);
    expect(resNoMatch.body.meta.totalPages).toBe(0);
  });

  test("✓ Should return 200 when filtering by categoryId", async () => {
    const category = await prisma.category.findFirst();
    expect(category).not.toBeNull();

    const res = await request(app).get(
      `/api/v1/tickets?requesterId=${validRequesterId}&categoryId=${category!.id}`
    );

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((ticket: any) => {
      expect(ticket.categoryId).toBe(category!.id);
    });
  });

  test("✓ Should return 200 when filtering by priority", async () => {
    const res = await request(app).get(
      `/api/v1/tickets?requesterId=${validRequesterId}&priority=HIGH`
    );

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((ticket: any) => {
      expect(ticket.requestedPriority).toBe("HIGH");
    });
  });

  test("✓ Should support pagination parameters (page=1, limit=10)", async () => {
    const res = await request(app).get(
      `/api/v1/tickets?requesterId=${validRequesterId}&page=1&limit=10`
    );

    expect(res.status).toBe(200);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(10);
    expect(res.body.data.length).toBeLessThanOrEqual(10);
  });

  // ---------------------------------------------------------
  // 2. Sorting Behavior Tests (AC-11: primary & secondary sorting)
  // ---------------------------------------------------------

  test("✓ (AC-11) Should sort tickets by createdAt ascending (sort=createdAt_asc) and verify timestamp order", async () => {
    const res = await request(app).get(
      `/api/v1/tickets?requesterId=${validRequesterId}&sort=createdAt_asc&limit=50`
    );

    expect(res.status).toBe(200);
    const tickets = res.body.data;
    expect(tickets.length).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < tickets.length - 1; i++) {
      const currentTime = new Date(tickets[i].createdAt).getTime();
      const nextTime = new Date(tickets[i + 1].createdAt).getTime();
      expect(currentTime).toBeLessThanOrEqual(nextTime);
    }
  });

  test("✓ (AC-11) Should sort tickets by createdAt descending (sort=createdAt_desc) as default and verify timestamp order", async () => {
    const res = await request(app).get(
      `/api/v1/tickets?requesterId=${validRequesterId}&sort=createdAt_desc&limit=50`
    );

    expect(res.status).toBe(200);
    const tickets = res.body.data;
    expect(tickets.length).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < tickets.length - 1; i++) {
      const currentTime = new Date(tickets[i].createdAt).getTime();
      const nextTime = new Date(tickets[i + 1].createdAt).getTime();
      expect(currentTime).toBeGreaterThanOrEqual(nextTime);
    }
  });

  test("✓ (AC-11) Should sort tickets by ticketNo ascending (sort=ticketNo_asc) and verify alphabetical order", async () => {
    const res = await request(app).get(
      `/api/v1/tickets?requesterId=${validRequesterId}&sort=ticketNo_asc&limit=50`
    );

    expect(res.status).toBe(200);
    const tickets = res.body.data;
    expect(tickets.length).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < tickets.length - 1; i++) {
      expect(tickets[i].ticketNo.localeCompare(tickets[i + 1].ticketNo)).toBeLessThanOrEqual(0);
    }
  });

  test("✓ (AC-11) Should sort tickets by ticketNo descending (sort=ticketNo_desc) and verify reverse alphabetical order", async () => {
    const res = await request(app).get(
      `/api/v1/tickets?requesterId=${validRequesterId}&sort=ticketNo_desc&limit=50`
    );

    expect(res.status).toBe(200);
    const tickets = res.body.data;
    expect(tickets.length).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < tickets.length - 1; i++) {
      expect(tickets[i].ticketNo.localeCompare(tickets[i + 1].ticketNo)).toBeGreaterThanOrEqual(0);
    }
  });

  test("✓ (AC-11) Should sort tickets by priority ascending (sort=priority_asc) and assert LOW <= MEDIUM <= HIGH", async () => {
    const priorityRank: Record<string, number> = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
    };

    const resAsc = await request(app).get(
      `/api/v1/tickets?requesterId=${validRequesterId}&sort=priority_asc&limit=50`
    );
    expect(resAsc.status).toBe(200);
    const tickets = resAsc.body.data;
    expect(tickets.length).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < tickets.length - 1; i++) {
      const currentRank = priorityRank[tickets[i].requestedPriority];
      const nextRank = priorityRank[tickets[i + 1].requestedPriority];
      expect(currentRank).toBeLessThanOrEqual(nextRank);
    }
  });

  test("✓ (AC-11) Should sort tickets by priority descending (sort=priority_desc) and assert HIGH >= MEDIUM >= LOW", async () => {
    const priorityRank: Record<string, number> = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
    };

    const resDesc = await request(app).get(
      `/api/v1/tickets?requesterId=${validRequesterId}&sort=priority_desc&limit=50`
    );
    expect(resDesc.status).toBe(200);
    const tickets = resDesc.body.data;
    expect(tickets.length).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < tickets.length - 1; i++) {
      const currentRank = priorityRank[tickets[i].requestedPriority];
      const nextRank = priorityRank[tickets[i + 1].requestedPriority];
      expect(currentRank).toBeGreaterThanOrEqual(nextRank);
    }
  });

  test("✓ (AC-11) Should apply deterministic secondary sorting by id descending (id_desc) when primary sort values are identical", async () => {
    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const relatedSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } });
    expect(category).not.toBeNull();
    expect(relatedSystem).not.toBeNull();

    // Create two tickets with the EXACT SAME createdAt timestamp
    const tiedTimestamp = new Date("2026-07-07T07:07:07.000Z");
    const uniqueSuffix = Date.now().toString().slice(-6);

    const ticketA = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-2026-TIE1-${uniqueSuffix}`,
        requesterId: validRequesterId,
        categoryId: category!.id,
        relatedSystemId: relatedSystem!.id,
        summary: "Secondary sort tie test ticket A",
        description: "Testing deterministic id_desc secondary sorting A.",
        requestedPriority: "MEDIUM",
        currentStatus: "NEW",
        createdAt: tiedTimestamp,
      },
    });

    const ticketB = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-2026-TIE2-${uniqueSuffix}`,
        requesterId: validRequesterId,
        categoryId: category!.id,
        relatedSystemId: relatedSystem!.id,
        summary: "Secondary sort tie test ticket B",
        description: "Testing deterministic id_desc secondary sorting B.",
        requestedPriority: "MEDIUM",
        currentStatus: "NEW",
        createdAt: tiedTimestamp,
      },
    });

    const res = await request(app).get(
      `/api/v1/tickets?requesterId=${validRequesterId}&sort=createdAt_desc&limit=50`
    );

    expect(res.status).toBe(200);
    const tiedTickets = res.body.data.filter(
      (t: any) => t.id === ticketA.id || t.id === ticketB.id
    );
    expect(tiedTickets.length).toBe(2);

    // Secondary sort specification: id_desc (the ticket with larger UUID string must appear first)
    const expectedFirstId = ticketA.id > ticketB.id ? ticketA.id : ticketB.id;
    const expectedSecondId = ticketA.id > ticketB.id ? ticketB.id : ticketA.id;

    expect(tiedTickets[0].id).toBe(expectedFirstId);
    expect(tiedTickets[1].id).toBe(expectedSecondId);
  });

  test("🔴 (AC-11) Should return 400 INVALID_QUERY when sort parameter is invalid", async () => {
    const res = await request(app).get(
      `/api/v1/tickets?requesterId=${validRequesterId}&sort=unknown_field_asc`
    );
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_QUERY");
    expect(res.body.error.message).toBe("Invalid sort parameter.");
  });

  // ---------------------------------------------------------
  // 3. Reference Validations (400 INVALID_REFERENCE)
  // ---------------------------------------------------------

  test("🔴 Should return 400 INVALID_REFERENCE when requesterId is missing", async () => {
    const res = await request(app).get("/api/v1/tickets");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REFERENCE");
  });

  test("🔴 Should return 400 INVALID_REFERENCE for nonexistent requesterId", async () => {
    const res = await request(app).get("/api/v1/tickets?requesterId=99999");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REFERENCE");
  });

  test("🔴 Should return 400 INVALID_REFERENCE for nonexistent categoryId", async () => {
    const res = await request(app).get(
      `/api/v1/tickets?requesterId=${validRequesterId}&categoryId=99999`
    );
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REFERENCE");
  });

  // ---------------------------------------------------------
  // 4. Strict Query Parameters Validation (400 INVALID_QUERY)
  // ---------------------------------------------------------

  test("🔴 Should return 400 INVALID_QUERY when status is CLOSED (Only NEW allowed in Lab 2)", async () => {
    const res = await request(app).get(
      `/api/v1/tickets?requesterId=${validRequesterId}&status=CLOSED`
    );
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_QUERY");
  });

  test("🔴 Should return 400 INVALID_QUERY when search exceeds 100 characters", async () => {
    const longSearch = "a".repeat(101);
    const res = await request(app).get(
      `/api/v1/tickets?requesterId=${validRequesterId}&search=${longSearch}`
    );
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_QUERY");
  });

  test("🔴 Should return 400 INVALID_QUERY when limit is not 10, 20, or 50", async () => {
    const res = await request(app).get(
      `/api/v1/tickets?requesterId=${validRequesterId}&limit=15`
    );
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_QUERY");
  });
});
