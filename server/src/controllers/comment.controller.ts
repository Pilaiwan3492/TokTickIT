import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authGuard.js";
import { getPrisma } from "../prisma.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/v1/tickets/:id/comments
 * Retrieves public comments for a ticket in ascending chronological order.
 * Requesters must own the ticket; IT_STAFF and ADMIN have operational visibility.
 */
export const getCommentsHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: {
          code: "SESSION_INVALID",
          message: "Authentication token is required.",
        },
      });
    }

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
      select: {
        id: true,
        userId: true,
        requesterId: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found.",
        },
      });
    }

    // Requester ownership check
    if (user.role === "REQUESTER") {
      const requester = await prisma.requesterUser.findFirst({
        where: {
          OR: [
            { userId: user.id },
            { email: user.email },
          ],
        },
      });

      const isOwner =
        ticket.userId === user.id ||
        (ticket.userId === null && requester && ticket.requesterId === requester.id);

      if (!isOwner) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to access comments on this ticket.",
          },
        });
      }
    }

    const comments = await prisma.comment.findMany({
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
      data: comments,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
};

/**
 * POST /api/v1/tickets/:id/comments
 * Creates an append-only public comment on a ticket.
 * Requesters must own the ticket; author is strictly derived from session.
 */
export const createCommentHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: {
          code: "SESSION_INVALID",
          message: "Authentication token is required.",
        },
      });
    }

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
          message: "Comment content must be a string.",
        },
      });
    }

    const trimmed = content.trim();
    if (trimmed.length < 1 || trimmed.length > 2000) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Comment content must be between 1 and 2,000 characters.",
        },
      });
    }

    const prisma = getPrisma();

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        requesterId: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found.",
        },
      });
    }

    // Requester ownership check
    if (user.role === "REQUESTER") {
      const requester = await prisma.requesterUser.findFirst({
        where: {
          OR: [
            { userId: user.id },
            { email: user.email },
          ],
        },
      });

      const isOwner =
        ticket.userId === user.id ||
        (ticket.userId === null && requester && ticket.requesterId === requester.id);

      if (!isOwner) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to comment on this ticket.",
          },
        });
      }
    }

    const comment = await prisma.comment.create({
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
      data: comment,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
};
