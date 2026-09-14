import request from "supertest";
import app from "../../src/app.js";
import bcrypt from "bcryptjs";
import { describe, test, expect, beforeAll } from "vitest";
import { getPrisma } from "../../src/prisma.js";
import { signToken } from "../../src/utils/jwt.js";

describe("Ticket Detail API Contract Tests (Lab 2 — Section 12)", () => {
  const prisma = getPrisma();
  let validRequesterId: number;
  let otherRequesterId: number;
  let testTicketId: string;
  let token1: string;
  let token2: string;

  beforeAll(async () => {
    const defaultHash = bcrypt.hashSync("Password123!", 10);

    // Dedicated User 1 & Requester 1
    const user1 = await prisma.user.upsert({
      where: { email: "ticket.detail1@example.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "ticket.detail1@example.com",
        name: "Ticket Detail User 1",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    const req1 = await prisma.requesterUser.upsert({
      where: { email: "ticket.detail1@example.com" },
      update: { userId: user1.id, isActive: true },
      create: {
        name: "Ticket Detail User 1",
        email: "ticket.detail1@example.com",
        userId: user1.id,
        isActive: true,
      },
    });
    validRequesterId = req1.id;

    token1 = signToken({
      id: user1.id,
      email: user1.email,
      name: user1.name,
      role: "REQUESTER",
      mustChangePassword: false,
    });

    // Dedicated User 2 & Requester 2
    const user2 = await prisma.user.upsert({
      where: { email: "ticket.detail2@example.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "ticket.detail2@example.com",
        name: "Ticket Detail User 2",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });

    const req2 = await prisma.requesterUser.upsert({
      where: { email: "ticket.detail2@example.com" },
      update: { userId: user2.id, isActive: true },
      create: {
        name: "Ticket Detail User 2",
        email: "ticket.detail2@example.com",
        userId: user2.id,
        isActive: true,
      },
    });
    otherRequesterId = req2.id;

    token2 = signToken({
      id: user2.id,
      email: user2.email,
      name: user2.name,
      role: "REQUESTER",
      mustChangePassword: false,
    });

    // Ensure category & related system exist
    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const relatedSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    // Ensure a test ticket exists for validRequesterId and set its userId
    let ticket = await prisma.ticket.findFirst({ where: { requesterId: validRequesterId } });
    if (!ticket) {
      ticket = await prisma.ticket.create({
        data: {
          ticketNo: `TKT-${new Date().getFullYear()}-990001`,
          requesterId: validRequesterId,
          userId: user1.id,
          categoryId: category?.id ?? 1,
          relatedSystemId: relatedSystem?.id ?? 1,
          summary: "Detail Test Ticket Summary",
          description: "Detail Test Ticket Description with sufficient length.",
          requestedPriority: "HIGH",
          currentStatus: "NEW",
        },
      });
    } else {
      ticket = await prisma.ticket.update({
        where: { id: ticket.id },
        data: { userId: user1.id },
      });
    }
    testTicketId = ticket.id;
  });

  test("✓ Should return 200 with full ticket detail for the owning requester", async () => {
    const ticket = await prisma.ticket.findUnique({
      where: { id: testTicketId },
    });
    expect(ticket).not.toBeNull();

    const res = await request(app)
      .get(`/api/v1/tickets/${testTicketId}`)
      .set("Authorization", `Bearer ${token1}`);

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

    const res = await request(app)
      .get(`/api/v1/tickets/${testTicketId}`)
      .set("Authorization", `Bearer ${token2}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(res.body.error.message).toBe("You do not have permission to access this ticket.");
    expect(res.body).not.toHaveProperty("data");
  });

  test("❌ Should return 404 TICKET_NOT_FOUND when ticket does not exist", async () => {
    const nonExistentTicketId = "00000000-0000-0000-0000-000000000000";
    const res = await request(app)
      .get(`/api/v1/tickets/${nonExistentTicketId}`)
      .set("Authorization", `Bearer ${token1}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("TICKET_NOT_FOUND");
    expect(res.body.error.message).toBe("Ticket not found.");
    expect(res.body).not.toHaveProperty("data");
  });

  test("❌ Should return 400 VALIDATION_ERROR when ticket id is not a valid UUID", async () => {
    const res = await request(app)
      .get(`/api/v1/tickets/not-a-valid-uuid`)
      .set("Authorization", `Bearer ${token1}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toBe("Ticket ID must be a valid UUID.");
  });

  test("❌ Should return 401 SESSION_INVALID when Authorization header is missing on ticket detail", async () => {
    expect(testTicketId).toBeDefined();

    const res = await request(app).get(`/api/v1/tickets/${testTicketId}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("SESSION_INVALID");
  });
});
