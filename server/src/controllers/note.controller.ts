import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authGuard.js";
import { getPrisma } from "../prisma.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/v1/tickets/:id/notes
 * Retrieves private internal notes for a ticket.
 * Strictly restricted to IT_STAFF and ADMIN roles. Requesters are blocked with 403.
 * Defense-in-depth: authorization check executes BEFORE any database queries (zero data leakage).
 */
export const getNotesHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: {
          code: "SESSION_INVALID",
          message: "Authentication token is required.",
        },
      });
    }

    // Role check must execute BEFORE any database queries
    if (user.role !== "IT_STAFF" && user.role !== "ADMIN") {
      return res.status(403).json({
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "You do not have permission to access internal notes.",
        },
      });
    }

    const { id } = req.params;
    if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Ticket ID must be a valid UUID.",
        },
      });
    }

    const prisma = getPrisma();

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found.",
        },
      });
    }

    const notes = await prisma.internalNote.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        ticketId: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return res.status(200).json({
      data: notes,
    });
  } catch (error) {
    console.error("Error fetching internal notes:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
};

/**
 * POST /api/v1/tickets/:id/notes
 * Creates an append-only private internal note on a ticket.
 * Strictly restricted to IT_STAFF and ADMIN roles.
 */
export const createNoteHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: {
          code: "SESSION_INVALID",
          message: "Authentication token is required.",
        },
      });
    }

    // Role check must execute BEFORE any database queries
    if (user.role !== "IT_STAFF" && user.role !== "ADMIN") {
      return res.status(403).json({
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "You do not have permission to create internal notes.",
        },
      });
    }

    const { id } = req.params;
    if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Ticket ID must be a valid UUID.",
        },
      });
    }

    const { content } = req.body;
    if (typeof content !== "string") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Note content must be a string.",
        },
      });
    }

    const trimmed = content.trim();
    if (trimmed.length < 1 || trimmed.length > 2000) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Note content must be between 1 and 2,000 characters.",
        },
      });
    }

    const prisma = getPrisma();

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found.",
        },
      });
    }

    const note = await prisma.internalNote.create({
      data: {
        ticketId: id,
        content: trimmed,
        authorId: user.id,
      },
      select: {
        id: true,
        ticketId: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return res.status(201).json({
      data: note,
    });
  } catch (error) {
    console.error("Error creating internal note:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
};
