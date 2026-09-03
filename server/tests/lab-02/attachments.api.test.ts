import request from "supertest";
import path from "path";
import fs from "fs";
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import app from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Attachment Upload API Contract Tests (Lab 2)", () => {
  const prisma = getPrisma();
  const validRequesterId = 1; // Seeded active requester (e.g. Alice / Jennifer)
  let otherRequesterId = 2; // Seeded active requester 2
  let testTicketId: string;
  let otherTicketId: string;

  beforeAll(async () => {
    // Ensure test requester users exist
    const requester1 = await prisma.requesterUser.findFirst({
      where: { id: validRequesterId, isActive: true },
    });
    if (!requester1) {
      await prisma.requesterUser.create({
        data: { id: validRequesterId, name: "Test Requester 1", email: "req1@test.com", isActive: true },
      });
    }

    const requester2 = await prisma.requesterUser.findFirst({
      where: { id: otherRequesterId, isActive: true },
    });
    if (!requester2) {
      const created2 = await prisma.requesterUser.create({
        data: { name: "Test Requester 2", email: "req2@test.com", isActive: true },
      });
      otherRequesterId = created2.id;
    }

    // Get a category and related system
    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const relatedSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    // Create a test ticket for validRequesterId
    const ticket1 = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-TEST-${Date.now().toString().slice(-6)}`,
        requesterId: validRequesterId,
        categoryId: category?.id ?? 1,
        relatedSystemId: relatedSystem?.id ?? 1,
        summary: "Attachment test ticket summary",
        description: "Attachment test ticket description with sufficient length.",
        requestedPriority: "MEDIUM",
        currentStatus: "NEW",
      },
    });
    testTicketId = ticket1.id;

    // Create a ticket for otherRequesterId
    const ticket2 = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-TEST-${(Date.now() + 1).toString().slice(-6)}`,
        requesterId: otherRequesterId,
        categoryId: category?.id ?? 1,
        relatedSystemId: relatedSystem?.id ?? 1,
        summary: "Other requester ticket summary",
        description: "Other requester ticket description with sufficient length.",
        requestedPriority: "LOW",
        currentStatus: "NEW",
      },
    });
    otherTicketId = ticket2.id;
  });

  afterAll(async () => {
    // Clean up created attachments and tickets
    if (testTicketId) {
      await prisma.attachment.deleteMany({ where: { ticketId: testTicketId } });
      await prisma.ticket.deleteMany({ where: { id: testTicketId } });
    }
    if (otherTicketId) {
      await prisma.attachment.deleteMany({ where: { ticketId: otherTicketId } });
      await prisma.ticket.deleteMany({ where: { id: otherTicketId } });
    }
  });

  // ---------------------------------------------------------
  // 1. Success Cases
  // ---------------------------------------------------------

  test("✓ Should upload a valid PNG attachment and return 201 with metadata (no filePath)", async () => {
    const pngBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

    const res = await request(app)
      .post(`/api/v1/tickets/${testTicketId}/attachments?requesterId=${validRequesterId}`)
      .attach("file", pngBuffer, "screenshot.png");

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toMatchObject({
      id: expect.any(String),
      ticketId: testTicketId,
      fileName: "screenshot.png",
      fileSize: pngBuffer.length,
      mimeType: "image/png",
      uploadedAt: expect.any(String),
      removedAt: null,
      removalReason: null,
    });
    expect(res.body.data.filePath).toBeUndefined();
  });

  test("✓ Should upload a valid PDF attachment", async () => {
    const pdfBuffer = Buffer.from("%PDF-1.4 sample pdf content %%EOF");

    const res = await request(app)
      .post(`/api/v1/tickets/${testTicketId}/attachments?requesterId=${validRequesterId}`)
      .attach("file", pdfBuffer, "document.pdf");

    expect(res.status).toBe(201);
    expect(res.body.data.fileName).toBe("document.pdf");
    expect(res.body.data.mimeType).toBe("application/pdf");
  });

  // ---------------------------------------------------------
  // 2. Validation & Boundary Cases
  // ---------------------------------------------------------

  test("❌ Should return 400 VALIDATION_ERROR when file is missing", async () => {
    const res = await request(app)
      .post(`/api/v1/tickets/${testTicketId}/attachments?requesterId=${validRequesterId}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toBe("Attachment file is required.");
  });

  test("❌ Should return 400 VALIDATION_ERROR when ticket ID is not a valid UUID", async () => {
    const buffer = Buffer.from("dummy");
    const res = await request(app)
      .post(`/api/v1/tickets/not-a-valid-uuid/attachments?requesterId=${validRequesterId}`)
      .attach("file", buffer, "photo.jpg");

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toBe("Ticket ID must be a valid UUID.");
  });

  test("❌ Should return 400 INVALID_REFERENCE for missing or non-integer requesterId", async () => {
    const buffer = Buffer.from("dummy");
    const res = await request(app)
      .post(`/api/v1/tickets/${testTicketId}/attachments`)
      .attach("file", buffer, "photo.jpg");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REFERENCE");
  });

  test("❌ Should return 400 INVALID_REFERENCE for nonexistent requesterId (999999)", async () => {
    const buffer = Buffer.from("dummy");
    const res = await request(app)
      .post(`/api/v1/tickets/${testTicketId}/attachments?requesterId=999999`)
      .attach("file", buffer, "photo.jpg");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REFERENCE");
  });

  test("❌ Should return 404 TICKET_NOT_FOUND when ticket does not exist", async () => {
    const nonExistentUuid = "550e8400-e29b-41d4-a716-446655440099";
    const buffer = Buffer.from("dummy");
    const res = await request(app)
      .post(`/api/v1/tickets/${nonExistentUuid}/attachments?requesterId=${validRequesterId}`)
      .attach("file", buffer, "photo.jpg");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("TICKET_NOT_FOUND");
    expect(res.body.error.message).toBe("Ticket not found.");
  });

  test("❌ Should return 403 FORBIDDEN when requester does not own the ticket", async () => {
    const buffer = Buffer.from("dummy");
    const res = await request(app)
      .post(`/api/v1/tickets/${otherTicketId}/attachments?requesterId=${validRequesterId}`)
      .attach("file", buffer, "photo.jpg");

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(res.body.error.message).toBe("You do not have permission to modify attachments for this ticket.");
  });

  test("❌ Should return 415 UNSUPPORTED_FILE_TYPE for unsupported file type (.exe)", async () => {
    const exeBuffer = Buffer.from("MZ fake executable header");
    const res = await request(app)
      .post(`/api/v1/tickets/${testTicketId}/attachments?requesterId=${validRequesterId}`)
      .attach("file", exeBuffer, "malware.exe");

    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("UNSUPPORTED_FILE_TYPE");
    expect(res.body.error.message).toBe("This file type is not supported.");
  });

  test("❌ Should return 413 FILE_TOO_LARGE when file size exceeds 5 MiB", async () => {
    // 5 MiB + 10 bytes = 5,242,890 bytes
    const largeBuffer = Buffer.alloc(5242880 + 10, "a");
    const res = await request(app)
      .post(`/api/v1/tickets/${testTicketId}/attachments?requesterId=${validRequesterId}`)
      .attach("file", largeBuffer, "large.jpg");

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("FILE_TOO_LARGE");
    expect(res.body.error.message).toBe("File size must not exceed 5 MiB (5,242,880 bytes).");
  });

  test("❌ Should return 409 ATTACHMENT_LIMIT_REACHED when ticket already has 5 active attachments", async () => {
    // Delete any existing attachments for testTicketId first
    await prisma.attachment.deleteMany({ where: { ticketId: testTicketId } });

    // Seed 5 active attachments
    for (let i = 1; i <= 5; i++) {
      await prisma.attachment.create({
        data: {
          ticketId: testTicketId,
          fileName: `existing-${i}.png`,
          fileSize: 1024,
          mimeType: "image/png",
          filePath: `uploads/test-${i}.png`,
          removedAt: null,
        },
      });
    }

    const pngBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
    const res = await request(app)
      .post(`/api/v1/tickets/${testTicketId}/attachments?requesterId=${validRequesterId}`)
      .attach("file", pngBuffer, "sixth.png");

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ATTACHMENT_LIMIT_REACHED");
    expect(res.body.error.message).toBe("This ticket already has the maximum number of active attachments.");
  });
});
