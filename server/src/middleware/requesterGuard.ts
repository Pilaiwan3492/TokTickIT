import { Request, Response, NextFunction } from "express";

import { getPrisma } from "../prisma.js";

export interface RequesterRequest extends Request {
  requester?: {
    id: number;
    name: string;
    email: string;
    isActive: boolean;
  };
}

export const requireRequester = async (
  req: RequesterRequest,
  res: Response,
  next: NextFunction
) => {
  const rawId = req.query.requesterId || req.body?.requesterId;

  if (!rawId) {
    return res.status(400).json({
      error: {
        code: "INVALID_REQUESTER_CONTEXT",
        message: "Missing requesterId in query parameter or request body",
      },
    });
  }

  const requesterId = Number(rawId);

  if (isNaN(requesterId) || requesterId <= 0) {
    return res.status(400).json({
      error: {
        code: "INVALID_REQUESTER_CONTEXT",
        message: "Invalid requester ID format",
      },
    });
  }

  try {
    const prisma = getPrisma();

    const user = await prisma.requesterUser.findUnique({
      where: { id: requesterId },
    });

    if (!user || !user.isActive) {
      return res.status(400).json({
        error: {
          code: "INVALID_REQUESTER_CONTEXT",
          message: "Requester does not exist or is inactive",
        },
      });
    }

    req.requester = user;
    next();
  } catch (error) {
    console.error("Error validating requester context:", error);

    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
};

export const requireTicketOwnership = async (
  req: RequesterRequest,
  res: Response,
  next: NextFunction
) => {
  const ticketId = req.params.id;
  const currentRequester = req.requester;

  if (!currentRequester) {
    return res.status(400).json({
      error: {
        code: "INVALID_REQUESTER_CONTEXT",
        message: "Requester context is missing",
      },
    });
  }

  try {
    const prisma = getPrisma();

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, requesterId: true },
    });

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found.",
        },
      });
    }

    if (ticket.requesterId !== currentRequester.id) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to access this ticket.",
        },
      });
    }

    next();
  } catch (error) {
    console.error("Error checking ticket ownership:", error);

    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
};