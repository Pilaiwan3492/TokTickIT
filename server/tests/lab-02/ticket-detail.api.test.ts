import request from "supertest";
import app from "../../src/app.js";
import { describe, test, expect } from "vitest";
import { getPrisma } from "../../src/prisma.js";

describe("Ticket Detail API Contract Tests (Lab 2 — Section 12)", () => {
  const validRequesterId = 1;

  test("✓ Should return 200 with full ticket detail for the owning requester", async () => {
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findFirst({
      where: { requesterId: validRequesterId },
    });

    if (!ticket) return;

    const res = await request(app).get(
      `/api/v1/tickets/${ticket.id}?requesterId=${validRequesterId}`
    );

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("id", ticket.id);
    expect(res.body.data).toHaveProperty("ticketNo");
    expect(res.body.data).toHaveProperty("requesterId", validRequesterId);
    expect(res.body.data).toHaveProperty("summary");
    expect(res.body.data).toHaveProperty("description");
    expect(res.body.data).toHaveProperty("currentStatus");
    expect(res.body.data).toHaveProperty("requestedPriority");
    expect(res.body.data).toHaveProperty("category");
    expect(res.body.data).toHaveProperty("relatedSystem");
    expect(res.body.data).toHaveProperty("attachments");
    expect(Array.isArray(res.body.data.attachments)).toBe(true);
  });

  test("❌ Should return 403 FORBIDDEN when accessing another requester's ticket", async () => {
    const prisma = getPrisma();
    const ownerTicket = await prisma.ticket.findFirst({
      where: { requesterId: validRequesterId },
    });

    const otherRequester = await prisma.requesterUser.findFirst({
      where: {
        id: { not: validRequesterId },
        isActive: true,
      },
    });

    if (!ownerTicket || !otherRequester) return;

    const res = await request(app).get(
      `/api/v1/tickets/${ownerTicket.id}?requesterId=${otherRequester.id}`
    );

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(res.body).not.toHaveProperty("data");
  });

  test("❌ Should return 404 TICKET_NOT_FOUND when ticket does not exist", async () => {
    const nonExistentTicketId = "00000000-0000-0000-0000-000000000000";
    const res = await request(app).get(
      `/api/v1/tickets/${nonExistentTicketId}?requesterId=${validRequesterId}`
    );

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("TICKET_NOT_FOUND");
    expect(res.body).not.toHaveProperty("data");
  });

  test("❌ Should return 400 VALIDATION_ERROR when ticket id is not a valid UUID", async () => {
    const res = await request(app).get(
      `/api/v1/tickets/not-a-valid-uuid?requesterId=${validRequesterId}`
    );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("❌ Should return 400 INVALID_REFERENCE when requesterId is missing on ticket detail", async () => {
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findFirst({
      where: { requesterId: validRequesterId },
    });
    if (!ticket) return;

    const res = await request(app).get(`/api/v1/tickets/${ticket.id}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REFERENCE");
  });
});
