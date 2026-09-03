import request from "supertest";
import app from "../../src/app.js";
import { describe, test, expect } from "vitest";
import { getPrisma } from "../../src/prisma.js";

describe("My Tickets API Contract Tests (Lab 2 — Section 12)", () => {
  const validRequesterId = 1;

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
    const prisma = getPrisma();
    const sampleTicket = await prisma.ticket.findFirst({
      where: { requesterId: validRequesterId },
    });

    const query = sampleTicket?.summary
      ? sampleTicket.summary.trim().split(" ")[0]
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
    const prisma = getPrisma();
    const category = await prisma.category.findFirst();
    if (!category) return;

    const res = await request(app).get(
      `/api/v1/tickets?requesterId=${validRequesterId}&categoryId=${category.id}`
    );

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((ticket: any) => {
      expect(ticket.categoryId).toBe(category.id);
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
  // 2. Reference Validations (400 INVALID_REFERENCE)
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
  // 3. Strict Query Parameters Validation (400 INVALID_QUERY)
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
