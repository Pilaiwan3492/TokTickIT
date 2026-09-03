import request from "supertest";
import app from "../../src/app.js";
import { describe, test, expect, beforeAll } from "vitest";
import { getPrisma } from "../../src/prisma.js";

describe("Ticket Detail API Contract Tests (Lab 2 — Section 12)", () => {
  const prisma = getPrisma();
  const validRequesterId = 1;
  let otherRequesterId = 2;
  let testTicketId: string;

  beforeAll(async () => {
    // Ensure requesters exist
    const req1 = await prisma.requesterUser.findFirst({ where: { id: validRequesterId, isActive: true } });
    if (!req1) {
      await prisma.requesterUser.create({
        data: { id: validRequesterId, name: "Requester One", email: "req1@example.com", isActive: true },
      });
    }

    const req2 = await prisma.requesterUser.findFirst({ where: { id: { not: validRequesterId }, isActive: true } });
    if (!req2) {
      const created2 = await prisma.requesterUser.create({
        data: { name: "Requester Two", email: "req2@example.com", isActive: true },
      });
      otherRequesterId = created2.id;
    } else {
      otherRequesterId = req2.id;
    }

    // Ensure category & related system exist
    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const relatedSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    // Ensure a test ticket exists for validRequesterId
    let ticket = await prisma.ticket.findFirst({ where: { requesterId: validRequesterId } });
    if (!ticket) {
      ticket = await prisma.ticket.create({
        data: {
          ticketNo: `TKT-${new Date().getFullYear()}-990001`,
          requesterId: validRequesterId,
          categoryId: category?.id ?? 1,
          relatedSystemId: relatedSystem?.id ?? 1,
          summary: "Detail Test Ticket Summary",
          description: "Detail Test Ticket Description with sufficient length.",
          requestedPriority: "HIGH",
          currentStatus: "NEW",
        },
      });
    }
    testTicketId = ticket.id;
  });

  test("✓ Should return 200 with full ticket detail for the owning requester", async () => {
    const ticket = await prisma.ticket.findUnique({
      where: { id: testTicketId },
    });
    expect(ticket).not.toBeNull();

    const res = await request(app).get(
      `/api/v1/tickets/${testTicketId}?requesterId=${validRequesterId}`
    );

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("id", testTicketId);
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
    expect(testTicketId).toBeDefined();
    expect(otherRequesterId).toBeDefined();

    const res = await request(app).get(
      `/api/v1/tickets/${testTicketId}?requesterId=${otherRequesterId}`
    );

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(res.body.error.message).toBe("You do not have permission to access this ticket.");
    expect(res.body).not.toHaveProperty("data");
  });

  test("❌ Should return 404 TICKET_NOT_FOUND when ticket does not exist", async () => {
    const nonExistentTicketId = "00000000-0000-0000-0000-000000000000";
    const res = await request(app).get(
      `/api/v1/tickets/${nonExistentTicketId}?requesterId=${validRequesterId}`
    );

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("TICKET_NOT_FOUND");
    expect(res.body.error.message).toBe("Ticket not found.");
    expect(res.body).not.toHaveProperty("data");
  });

  test("❌ Should return 400 VALIDATION_ERROR when ticket id is not a valid UUID", async () => {
    const res = await request(app).get(
      `/api/v1/tickets/not-a-valid-uuid?requesterId=${validRequesterId}`
    );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toBe("Ticket ID must be a valid UUID.");
  });

  test("❌ Should return 400 INVALID_REFERENCE when requesterId is missing on ticket detail", async () => {
    expect(testTicketId).toBeDefined();

    const res = await request(app).get(`/api/v1/tickets/${testTicketId}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REFERENCE");
  });
});
