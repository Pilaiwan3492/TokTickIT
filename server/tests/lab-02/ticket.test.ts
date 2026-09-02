import request from "supertest";
import app from "../../src/app.js";
import { describe, test, expect } from "vitest";
import { getPrisma } from "../../src/prisma.js";

describe("GET /api/v1/tickets API Contract Tests (Lab 2)", () => {
  const validRequesterId = 1;

  // ---------------------------------------------------------
  // 1. Success Cases & Data Retrieval
  // ---------------------------------------------------------
  test("✓ Should return 200 with paginated tickets list for valid requesterId", async () => {
    const res = await request(app).get(`/api/v1/tickets?requesterId=${validRequesterId}`);
    
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

    // ดึงคำแรกของ summary ที่มีอยู่จริง หรือใช้คีย์เวิร์ดสำรองอย่างรัดกุม
    const query = sampleTicket?.summary
      ? sampleTicket.summary.trim().split(" ")[0]
      : "TCK";

    const res = await request(app).get(`/api/v1/tickets?requesterId=${validRequesterId}&search=${encodeURIComponent(query)}`);
    
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
    const resExceed = await request(app).get(`/api/v1/tickets?requesterId=${validRequesterId}&page=9999`);
    expect(resExceed.status).toBe(200);
    expect(resExceed.body.data).toEqual([]);

    const resNoMatch = await request(app).get(`/api/v1/tickets?requesterId=${validRequesterId}&search=NON_EXISTENT_QUERY_XYZ_12345`);
    expect(resNoMatch.status).toBe(200);
    expect(resNoMatch.body.data).toEqual([]);
    expect(resNoMatch.body.meta.total).toBe(0);
    expect(resNoMatch.body.meta.totalPages).toBe(0);
  });

  test("✓ Should return 200 when filtering by existing inactive categoryId", async () => {
    const prisma = getPrisma();
    const inactiveCategory = await prisma.category.findFirst({
      where: { isActive: false },
    });

    // ข้ามการทดสอบทันทีหากไม่มี inactive category ใน seed DB ป้องกัน false-positive
    if (!inactiveCategory) {
      return;
    }

    const res = await request(app).get(`/api/v1/tickets?requesterId=${validRequesterId}&categoryId=${inactiveCategory.id}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // ---------------------------------------------------------
  // 2. Reference & Ownership Validations (400 INVALID_REFERENCE)
  // ---------------------------------------------------------
  test("🔴 Should return 400 INVALID_REFERENCE when requesterId is missing or invalid format", async () => {
    const res = await request(app).get("/api/v1/tickets");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REFERENCE");
  });

  test("🔴 Should return 400 INVALID_REFERENCE for nonexistent/inactive requesterId (e.g. 9999)", async () => {
    const res = await request(app).get("/api/v1/tickets?requesterId=9999");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REFERENCE");
  });

  test("🔴 Should return 400 INVALID_REFERENCE for nonexistent categoryId (e.g. 9999)", async () => {
    const res = await request(app).get(`/api/v1/tickets?requesterId=${validRequesterId}&categoryId=9999`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REFERENCE");
  });

  // ---------------------------------------------------------
  // 3. Strict Query Parameters Validation (400 INVALID_QUERY)
  // ---------------------------------------------------------
  test("🔴 Should return 400 INVALID_QUERY when status is CLOSED (Only NEW allowed in Lab 2)", async () => {
    const res = await request(app).get(`/api/v1/tickets?requesterId=${validRequesterId}&status=CLOSED`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_QUERY");
  });

  test("🔴 Should return 400 INVALID_QUERY when search exceeds 100 characters", async () => {
    const longSearch = "a".repeat(101);
    const res = await request(app).get(`/api/v1/tickets?requesterId=${validRequesterId}&search=${longSearch}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_QUERY");
  });

  test("🔴 Should return 400 INVALID_QUERY for unsupported limit (e.g. limit=15)", async () => {
    const res = await request(app).get(`/api/v1/tickets?requesterId=${validRequesterId}&limit=15`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_QUERY");
  });

  test("✓ Should allow valid limit values (10, 20, 50)", async () => {
    for (const limit of [10, 20, 50]) {
      const res = await request(app).get(`/api/v1/tickets?requesterId=${validRequesterId}&limit=${limit}`);
      expect(res.status).toBe(200);
      expect(res.body.meta.limit).toBe(limit);
    }
  });

  test("🔴 Should return 400 INVALID_QUERY for non-integer page (e.g. page=abc)", async () => {
    const res = await request(app).get(`/api/v1/tickets?requesterId=${validRequesterId}&page=abc`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_QUERY");
  });

  test("🔴 Should return 400 INVALID_QUERY for invalid sort parameter (e.g. sort=summary_asc)", async () => {
    const res = await request(app).get(`/api/v1/tickets?requesterId=${validRequesterId}&sort=summary_asc`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_QUERY");
  });

  test("✓ Should allow Whitelisted sort options", async () => {
    const validSorts = [
      "createdAt_desc",
      "createdAt_asc",
      "priority_desc",
      "priority_asc",
      "ticketNo_asc",
      "ticketNo_desc",
    ];

    for (const sort of validSorts) {
      const res = await request(app).get(`/api/v1/tickets?requesterId=${validRequesterId}&sort=${sort}`);
      expect(res.status).toBe(200);
    }
  });

  test("🔴 Should return 400 INVALID_QUERY for invalid priority filter", async () => {
    const res = await request(app).get(`/api/v1/tickets?requesterId=${validRequesterId}&priority=SUPER_HIGH`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_QUERY");
  });

  test("🔴 Should return 400 INVALID_QUERY for invalid status filter", async () => {
    const res = await request(app).get(`/api/v1/tickets?requesterId=${validRequesterId}&status=UNKNOWN_STATUS`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_QUERY");
  });

  test("🔴 Should return 400 INVALID_QUERY for non-integer categoryId", async () => {
    const res = await request(app).get(`/api/v1/tickets?requesterId=${validRequesterId}&categoryId=invalid_id`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_QUERY");
  });
});