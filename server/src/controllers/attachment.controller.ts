import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { getPrisma } from "../prisma.js";

// Allowed MIME types mapped by extension
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  ".jpg": ["image/jpeg", "image/pjpeg"],
  ".jpeg": ["image/jpeg", "image/pjpeg"],
  ".png": ["image/png"],
  ".webp": ["image/webp"],
  ".pdf": ["application/pdf"],
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MiB = 5,242,880 bytes

// Configure multer memory storage so file is buffered and can be validated before writing to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // allow up to 10 MiB at multer level so our code can return exact 413 FILE_TOO_LARGE response
  },
});

// Middleware to parse multipart/form-data for field "file"
export const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          error: {
            code: "FILE_TOO_LARGE",
            message: "File size must not exceed 5 MiB (5,242,880 bytes).",
          },
        });
      }
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: err.message,
        },
      });
    } else if (err) {
      return res.status(500).json({
        error: {
          code: "ATTACHMENT_UPLOAD_FAILED",
          message: "Unable to upload the attachment. Please try again.",
        },
      });
    }
    next();
  });
};

/**
 * POST /api/v1/tickets/:id/attachments?requesterId={requesterId}
 * Upload attachment to an existing ticket
 */
export const uploadAttachmentHandler = async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;
    const rawRequesterId = req.query.requesterId;

    // 1. Validate Ticket ID (must be valid UUID)
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Ticket ID must be a valid UUID.",
        },
      });
    }

    // 2. Validate Requester Context
    if (
      rawRequesterId === undefined ||
      rawRequesterId === null ||
      typeof rawRequesterId === "boolean" ||
      !/^\d+$/.test(String(rawRequesterId)) ||
      Number(rawRequesterId) <= 0
    ) {
      return res.status(400).json({
        error: {
          code: "INVALID_REFERENCE",
          message: "Requester ID is required and must be a positive integer.",
        },
      });
    }

    const requesterId = Number(rawRequesterId);

    // Verify requester exists and is active
    const requester = await prisma.requesterUser.findUnique({
      where: { id: requesterId },
    });

    if (!requester || requester.isActive === false) {
      return res.status(400).json({
        error: {
          code: "INVALID_REFERENCE",
          message: "The selected Requester is invalid.",
        },
      });
    }

    // 3. Verify Ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found.",
        },
      });
    }

    // 4. Verify Ticket Ownership
    if (ticket.requesterId !== requesterId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to modify attachments for this ticket.",
        },
      });
    }

    // 5. Verify File presence
    if (!req.file) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Attachment file is required.",
        },
      });
    }

    // 6. Verify File extension and MIME type
    const originalExt = path.extname(req.file.originalname).toLowerCase();
    const allowedMimes = ALLOWED_MIME_TYPES[originalExt];

    if (!allowedMimes || !allowedMimes.includes(req.file.mimetype)) {
      return res.status(415).json({
        error: {
          code: "UNSUPPORTED_FILE_TYPE",
          message: "This file type is not supported.",
        },
      });
    }

    // 7. Verify File size (max 5 MiB)
    if (req.file.size > MAX_FILE_SIZE) {
      return res.status(413).json({
        error: {
          code: "FILE_TOO_LARGE",
          message: "File size must not exceed 5 MiB (5,242,880 bytes).",
        },
      });
    }

    // 8. Verify Active Attachment Count (max 5 active per ticket)
    const activeCount = await prisma.attachment.count({
      where: {
        ticketId: id,
        removedAt: null,
      },
    });

    if (activeCount >= 5) {
      return res.status(409).json({
        error: {
          code: "ATTACHMENT_LIMIT_REACHED",
          message: "This ticket already has the maximum number of active attachments.",
        },
      });
    }

    // 9. Safe filename handling & storage path generation
    // Sanitize filename: strip path traversal and separator characters
    const sanitizedFileName = path.basename(req.file.originalname).replace(/[/\\]/g, "");
    const storageFileName = `${randomUUID()}-${sanitizedFileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const uploadsDir = path.resolve(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const storageFilePath = path.join(uploadsDir, storageFileName);

    try {
      fs.writeFileSync(storageFilePath, req.file.buffer);
    } catch (writeError) {
      console.error("Error writing attachment to disk:", writeError);
      return res.status(500).json({
        error: {
          code: "ATTACHMENT_UPLOAD_FAILED",
          message: "Unable to upload the attachment. Please try again.",
        },
      });
    }

    // 10. Persist Attachment in database
    const attachment = await prisma.attachment.create({
      data: {
        ticketId: id,
        fileName: sanitizedFileName,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        filePath: storageFilePath,
      },
    });

    // 11. Return response (filePath must not be exposed)
    return res.status(201).json({
      data: {
        id: attachment.id,
        ticketId: attachment.ticketId,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        uploadedAt: attachment.uploadedAt,
        removedAt: attachment.removedAt,
        removalReason: attachment.removalReason,
      },
    });
  } catch (error) {
    console.error("Error uploading attachment:", error);
    return res.status(500).json({
      error: {
        code: "ATTACHMENT_UPLOAD_FAILED",
        message: "Unable to upload the attachment. Please try again.",
      },
    });
  }
};
