import request from "supertest";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import app from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { signToken } from "../../src/utils/jwt.js";

describe("Attachment Upload API Contract Tests (Lab 2)", () => {
  const prisma = getPrisma();
  let validRequesterId: number;
  let otherRequesterId: number;
  let testTicketId: string;
  let otherTicketId: string;
  let token1: string;
  let token2: string;

  beforeAll(async () => {
    const defaultHash = bcrypt.hashSync("Password123!", 10);

    // Dedicated User 1 & Requester 1
    const user1 = await prisma.user.upsert({
      where: { email: "attachment.user1@example.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "attachment.user1@example.com",
        name: "Attachment User 1",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    const requester1 = await prisma.requesterUser.upsert({
      where: { email: "attachment.user1@example.com" },
      update: { userId: user1.id, isActive: true },
      create: {
        name: "Attachment User 1",
        email: "attachment.user1@example.com",
        userId: user1.id,
        isActive: true,
      },
    });
    validRequesterId = requester1.id;

    token1 = signToken({
      id: user1.id,
      email: user1.email,
      name: user1.name,
      role: "REQUESTER",
      mustChangePassword: false,
    });

    // Dedicated User 2 & Requester 2
    const user2 = await prisma.user.upsert({
      where: { email: "attachment.user2@example.com" },
      update: { isActive: true, mustChangePassword: false, passwordHash: defaultHash },
      create: {
        email: "attachment.user2@example.com",
        name: "Attachment User 2",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultHash,
      },
    });
    const requester2 = await prisma.requesterUser.upsert({
      where: { email: "attachment.user2@example.com" },
      update: { userId: user2.id, isActive: true },
      create: {
        name: "Attachment User 2",
        email: "attachment.user2@example.com",
        userId: user2.id,
        isActive: true,
      },
    });
    otherRequesterId = requester2.id;

    token2 = signToken({
      id: user2.id,
      email: user2.email,
      name: user2.name,
      role: "REQUESTER",
      mustChangePassword: false,
    });

    // Get a category and related system
    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const relatedSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    // Create a test ticket for validRequesterId / user1
    const ticket1 = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-TEST-${Date.now().toString().slice(-6)}`,
        requesterId: validRequesterId,
        userId: user1.id,
        categoryId: category?.id ?? 1,
        relatedSystemId: relatedSystem?.id ?? 1,
        summary: "Attachment test ticket summary",
        description: "Attachment test ticket description with sufficient length.",
        requestedPriority: "MEDIUM",
        currentStatus: "NEW",
      },
    });
    testTicketId = ticket1.id;

    // Create a ticket for otherRequesterId / user2
    const ticket2 = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-TEST-${(Date.now() + 1).toString().slice(-6)}`,
        requesterId: otherRequesterId,
        userId: user2.id,
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
      .post(`/api/v1/tickets/${testTicketId}/attachments`)
      .set("Authorization", `Bearer ${token1}`)
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
      .post(`/api/v1/tickets/${testTicketId}/attachments`)
      .set("Authorization", `Bearer ${token1}`)
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
      .post(`/api/v1/tickets/${testTicketId}/attachments`)
      .set("Authorization", `Bearer ${token1}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toBe("Attachment file is required.");
  });

  test("❌ Should return 400 VALIDATION_ERROR when ticket ID is not a valid UUID", async () => {
    const buffer = Buffer.from("dummy");
    const res = await request(app)
      .post(`/api/v1/tickets/not-a-valid-uuid/attachments`)
      .set("Authorization", `Bearer ${token1}`)
      .attach("file", buffer, "photo.jpg");

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toBe("Ticket ID must be a valid UUID.");
  });

  test("❌ Should return 401 SESSION_INVALID for missing Authorization header", async () => {
    const buffer = Buffer.from("dummy");
    const res = await request(app)
      .post(`/api/v1/tickets/${testTicketId}/attachments`)
      .attach("file", buffer, "photo.jpg");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("SESSION_INVALID");
  });

  test("❌ Should return 401 SESSION_INVALID for invalid or malformed token", async () => {
    const buffer = Buffer.from("dummy");
    const res = await request(app)
      .post(`/api/v1/tickets/${testTicketId}/attachments`)
      .set("Authorization", "Bearer invalid-token")
      .attach("file", buffer, "photo.jpg");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("SESSION_INVALID");
  });

  test("❌ Should return 404 TICKET_NOT_FOUND when ticket does not exist", async () => {
    const nonExistentUuid = "550e8400-e29b-41d4-a716-446655440099";
    const buffer = Buffer.from("dummy");
    const res = await request(app)
      .post(`/api/v1/tickets/${nonExistentUuid}/attachments`)
      .set("Authorization", `Bearer ${token1}`)
      .attach("file", buffer, "photo.jpg");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("TICKET_NOT_FOUND");
    expect(res.body.error.message).toBe("Ticket not found.");
  });

  test("❌ Should return 403 FORBIDDEN when requester does not own the ticket", async () => {
    const buffer = Buffer.from("dummy");
    const res = await request(app)
      .post(`/api/v1/tickets/${otherTicketId}/attachments`)
      .set("Authorization", `Bearer ${token1}`)
      .attach("file", buffer, "photo.jpg");

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(res.body.error.message).toBe("You do not have permission to modify attachments for this ticket.");
  });

  test("❌ Should return 415 UNSUPPORTED_FILE_TYPE for unsupported file type (.exe)", async () => {
    const exeBuffer = Buffer.from("MZ fake executable header");
    const res = await request(app)
      .post(`/api/v1/tickets/${testTicketId}/attachments`)
      .set("Authorization", `Bearer ${token1}`)
      .attach("file", exeBuffer, "malware.exe");

    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("UNSUPPORTED_FILE_TYPE");
    expect(res.body.error.message).toBe("This file type is not supported.");
  });

  test("❌ Should return 413 FILE_TOO_LARGE when file size exceeds 5 MiB", async () => {
    // 5 MiB + 10 bytes = 5,242,890 bytes
    const largeBuffer = Buffer.alloc(5242880 + 10, "a");
    const res = await request(app)
      .post(`/api/v1/tickets/${testTicketId}/attachments`)
      .set("Authorization", `Bearer ${token1}`)
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
      .post(`/api/v1/tickets/${testTicketId}/attachments`)
      .set("Authorization", `Bearer ${token1}`)
      .attach("file", pngBuffer, "sixth.png");

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ATTACHMENT_LIMIT_REACHED");
    expect(res.body.error.message).toBe("This ticket already has the maximum number of active attachments.");
  });

  // ---------------------------------------------------------
  // 3. Download Attachment Tests (GET /api/v1/attachments/:id/download)
  // ---------------------------------------------------------

  test("✓ Should download an active attachment with correct Content-Type and Content-Disposition headers", async () => {
    // Clear any previous active attachments to avoid 5-attachment limit
    await prisma.attachment.deleteMany({ where: { ticketId: testTicketId } });

    // Upload a real attachment first
    const pngBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
    const uploadRes = await request(app)
      .post(`/api/v1/tickets/${testTicketId}/attachments`)
      .set("Authorization", `Bearer ${token1}`)
      .attach("file", pngBuffer, "download-me.png");

    expect(uploadRes.status).toBe(201);
    const attachmentId = uploadRes.body.data.id;

    const downloadRes = await request(app)
      .get(`/api/v1/attachments/${attachmentId}/download`)
      .set("Authorization", `Bearer ${token1}`);

    expect(downloadRes.status).toBe(200);
    expect(downloadRes.header["content-type"]).toContain("image/png");
    expect(downloadRes.header["content-disposition"]).toContain('filename="download-me.png"');
    expect(downloadRes.body).toBeDefined();
  });

  test("❌ Should return 400 VALIDATION_ERROR when download attachment ID is not a valid UUID", async () => {
    const res = await request(app)
      .get(`/api/v1/attachments/not-a-uuid/download`)
      .set("Authorization", `Bearer ${token1}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toBe("Attachment ID must be a valid UUID.");
  });

  test("❌ Should return 401 SESSION_INVALID when download Authorization header is missing", async () => {
    const res = await request(app)
      .get(`/api/v1/attachments/550e8400-e29b-41d4-a716-446655440000/download`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("SESSION_INVALID");
  });

  test("❌ Should return 404 ATTACHMENT_NOT_FOUND when downloading non-existent attachment", async () => {
    const nonExistentUuid = "550e8400-e29b-41d4-a716-446655440099";
    const res = await request(app)
      .get(`/api/v1/attachments/${nonExistentUuid}/download`)
      .set("Authorization", `Bearer ${token1}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ATTACHMENT_NOT_FOUND");
    expect(res.body.error.message).toBe("Attachment not found.");
  });

  test("❌ Should return 403 FORBIDDEN when downloading attachment belonging to another requester", async () => {
    // Create an attachment for otherTicketId (owned by user2 / otherRequesterId)
    const otherAtt = await prisma.attachment.create({
      data: {
        ticketId: otherTicketId,
        fileName: "other-user.png",
        fileSize: 1024,
        mimeType: "image/png",
        filePath: "uploads/other-user.png",
      },
    });

    // ValidRequesterId (token1) attempts to download otherRequester's attachment
    const res = await request(app)
      .get(`/api/v1/attachments/${otherAtt.id}/download`)
      .set("Authorization", `Bearer ${token1}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(res.body.error.message).toBe("You do not have permission to access this attachment.");
  });

  test("❌ Should return 404 ATTACHMENT_NOT_AVAILABLE when downloading a soft-removed attachment", async () => {
    const removedAtt = await prisma.attachment.create({
      data: {
        ticketId: testTicketId,
        fileName: "already-removed.png",
        fileSize: 1024,
        mimeType: "image/png",
        filePath: "uploads/already-removed.png",
        removedAt: new Date(),
        removalReason: "Test removal reason",
      },
    });

    const res = await request(app)
      .get(`/api/v1/attachments/${removedAtt.id}/download`)
      .set("Authorization", `Bearer ${token1}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ATTACHMENT_NOT_AVAILABLE");
    expect(res.body.error.message).toBe("This attachment is no longer available for download.");
  });

  // ---------------------------------------------------------
  // 4. Soft Removal Tests (DELETE /api/v1/attachments/:id)
  // ---------------------------------------------------------

  test("✓ Should soft-remove an active attachment with valid removalReason (200 OK)", async () => {
    const attToRemove = await prisma.attachment.create({
      data: {
        ticketId: testTicketId,
        fileName: "to-be-removed.png",
        fileSize: 1024,
        mimeType: "image/png",
        filePath: "uploads/to-be-removed.png",
      },
    });

    const res = await request(app)
      .delete(`/api/v1/attachments/${attToRemove.id}`)
      .set("Authorization", `Bearer ${token1}`)
      .send({ removalReason: "Uploaded the wrong screenshot." });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: attToRemove.id,
      removedAt: expect.any(String),
      removalReason: "Uploaded the wrong screenshot.",
    });

    // Verify in database: record still exists (not physically deleted)
    const dbRecord = await prisma.attachment.findUnique({ where: { id: attToRemove.id } });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.removedAt).not.toBeNull();
    expect(dbRecord?.removalReason).toBe("Uploaded the wrong screenshot.");

    // Subsequent download must return 404 ATTACHMENT_NOT_AVAILABLE
    const downloadRes = await request(app)
      .get(`/api/v1/attachments/${attToRemove.id}/download`)
      .set("Authorization", `Bearer ${token1}`);
    expect(downloadRes.status).toBe(404);
    expect(downloadRes.body.error.code).toBe("ATTACHMENT_NOT_AVAILABLE");
  });

  test("❌ Should return 400 VALIDATION_ERROR when removalReason is missing or whitespace-only", async () => {
    const att = await prisma.attachment.create({
      data: {
        ticketId: testTicketId,
        fileName: "temp.png",
        fileSize: 1024,
        mimeType: "image/png",
        filePath: "uploads/temp.png",
      },
    });

    // Missing reason
    const res1 = await request(app)
      .delete(`/api/v1/attachments/${att.id}`)
      .set("Authorization", `Bearer ${token1}`)
      .send({});
    expect(res1.status).toBe(400);
    expect(res1.body.error.code).toBe("VALIDATION_ERROR");
    expect(res1.body.error.message).toBe("Removal reason is required.");

    // Whitespace only
    const res2 = await request(app)
      .delete(`/api/v1/attachments/${att.id}`)
      .set("Authorization", `Bearer ${token1}`)
      .send({ removalReason: "    " });
    expect(res2.status).toBe(400);
    expect(res2.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("❌ Should return 400 VALIDATION_ERROR when removalReason is less than 3 characters", async () => {
    const att = await prisma.attachment.create({
      data: {
        ticketId: testTicketId,
        fileName: "temp2.png",
        fileSize: 1024,
        mimeType: "image/png",
        filePath: "uploads/temp2.png",
      },
    });

    const res = await request(app)
      .delete(`/api/v1/attachments/${att.id}`)
      .set("Authorization", `Bearer ${token1}`)
      .send({ removalReason: "no" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("❌ Should return 400 VALIDATION_ERROR when attachment ID is not a valid UUID on DELETE", async () => {
    const res = await request(app)
      .delete(`/api/v1/attachments/not-a-uuid`)
      .set("Authorization", `Bearer ${token1}`)
      .send({ removalReason: "Valid reason text." });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toBe("Attachment ID must be a valid UUID.");
  });

  test("❌ Should return 404 ATTACHMENT_NOT_FOUND when soft-removing non-existent attachment", async () => {
    const nonExistentUuid = "550e8400-e29b-41d4-a716-446655440099";
    const res = await request(app)
      .delete(`/api/v1/attachments/${nonExistentUuid}`)
      .set("Authorization", `Bearer ${token1}`)
      .send({ removalReason: "Valid reason text." });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ATTACHMENT_NOT_FOUND");
    expect(res.body.error.message).toBe("Attachment not found.");
  });

  test("❌ Should return 403 FORBIDDEN when soft-removing another requester's attachment", async () => {
    const otherAtt = await prisma.attachment.create({
      data: {
        ticketId: otherTicketId,
        fileName: "other-att.png",
        fileSize: 1024,
        mimeType: "image/png",
        filePath: "uploads/other-att.png",
      },
    });

    const res = await request(app)
      .delete(`/api/v1/attachments/${otherAtt.id}`)
      .set("Authorization", `Bearer ${token1}`)
      .send({ removalReason: "Attempting to delete someone else's file." });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(res.body.error.message).toBe("You do not have permission to remove this attachment.");
  });

  test("❌ Should return 409 ATTACHMENT_ALREADY_REMOVED when removing an already removed attachment", async () => {
    const alreadyRemoved = await prisma.attachment.create({
      data: {
        ticketId: testTicketId,
        fileName: "double-remove.png",
        fileSize: 1024,
        mimeType: "image/png",
        filePath: "uploads/double-remove.png",
        removedAt: new Date(),
        removalReason: "First removal",
      },
    });

    const res = await request(app)
      .delete(`/api/v1/attachments/${alreadyRemoved.id}`)
      .set("Authorization", `Bearer ${token1}`)
      .send({ removalReason: "Second removal attempt." });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ATTACHMENT_ALREADY_REMOVED");
    expect(res.body.error.message).toBe("This attachment has already been removed.");
  });
});

