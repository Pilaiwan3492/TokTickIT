import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Ticket Ownership Guard & Requester Context Middleware", () => {
  let activeRequesterAId: number;
  let activeRequesterBId: number;
  let inactiveRequesterId: number;
  let ticketAId: string;

  beforeAll(async () => {
    const prisma = getPrisma();

    const activeUsers = await prisma.requesterUser.findMany({
      where: { isActive: true },
      take: 2,
    });

    expect(activeUsers.length).toBeGreaterThanOrEqual(2);
    activeRequesterAId = activeUsers[0].id;
    activeRequesterBId = activeUsers[1].id;

    const inactiveUser = await prisma.requesterUser.findFirst({
      where: { isActive: false },
    });

    expect(inactiveUser).not.toBeNull();
    inactiveRequesterId = inactiveUser!.id;

    const existingTicket = await prisma.ticket.findFirst({
      where: { requesterId: activeRequesterAId },
    });

    if (existingTicket) {
      ticketAId = existingTicket.id;
    } else {
      const category = await prisma.category.findFirst();
      const system = await prisma.relatedSystem.findFirst();

      expect(category).not.toBeNull();
      expect(system).not.toBeNull();

      const newTicket = await prisma.ticket.create({
        data: {
          ticketNo: `TKT-TEST-${Date.now()}`,
          requesterId: activeRequesterAId,
          categoryId: category!.id,
          relatedSystemId: system!.id,
          summary: "Test Ticket for Guard",
          description: "Ownership testing description",
          requestedPriority: "LOW",
        },
      });
      ticketAId = newTicket.id;
    }
  });

  // 1. Missing Requester -> HTTP 400
  it("should return 400 Bad Request when requesterId is missing", async () => {
    const res = await request(app).get(`/api/v1/tickets/${ticketAId}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REQUESTER_CONTEXT");
  });

  // 2. Inactive or Unknown Requester -> HTTP 400
  it("should return 400 Bad Request when requester is inactive or non-existent", async () => {
    const res = await request(app).get(
      `/api/v1/tickets/${ticketAId}?requesterId=${inactiveRequesterId}`
    );
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REQUESTER_CONTEXT");
  });

  // 3. Ticket Not Found -> HTTP 404
  it("should return 404 Not Found when ticket does not exist", async () => {
    const fakeUuid = "00000000-0000-0000-0000-000000000000";
    const res = await request(app).get(
      `/api/v1/tickets/${fakeUuid}?requesterId=${activeRequesterAId}`
    );
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("TICKET_NOT_FOUND");
    expect(res.body.error.message).toBe("Ticket not found.");
  });

  // 4. Other Requester (Cross-user access) -> HTTP 403
  it("should return 403 Forbidden when Requester B attempts to access Requester A's ticket", async () => {
    const res = await request(app).get(
      `/api/v1/tickets/${ticketAId}?requesterId=${activeRequesterBId}`
    );
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(res.body.error.message).toBe(
      "You do not have permission to access this ticket."
    );
  });

  // 5. Owner Access -> HTTP 200
  it("should return 200 OK with wrapped data when ticket owner accesses their own ticket", async () => {
    const res = await request(app).get(
      `/api/v1/tickets/${ticketAId}?requesterId=${activeRequesterAId}`
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe(ticketAId);
    expect(res.body.data.requesterId).toBe(activeRequesterAId);
  });
});