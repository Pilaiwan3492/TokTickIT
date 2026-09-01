import { Request, Response, NextFunction } from "express";
import { getPrisma } from "../prisma.js";

export interface AuthenticatedRequest extends Request {
  requester?: {
    id: number;
    name: string;
    email: string;
    isActive: boolean;
  };
}

export const requireRequester = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const rawId = req.headers["x-requester-id"] || req.query.requesterId || req.body?.requesterId;

  if (!rawId) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Missing requester ID context header (x-requester-id)",
    });
  }

  const requesterId = Number(rawId);
  if (isNaN(requesterId) || requesterId <= 0) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Invalid requester ID format",
    });
  }

  try {
    const prisma = getPrisma();
    const user = await prisma.requesterUser.findUnique({
      where: { id: requesterId },
    });

    if (!user || !user.isActive) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Requester does not exist or is inactive",
      });
    }

    req.requester = user;
    next();
  } catch (error) {
    console.error("Error validating requester context:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const requireTicketOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const ticketId = req.params.id;
  const currentRequester = req.requester;

  if (!currentRequester) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Requester context is missing",
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
        error: "Not Found",
        message: "Ticket not found",
      });
    }

    if (ticket.requesterId !== currentRequester.id) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to access or modify this ticket",
      });
    }

    next();
  } catch (error) {
    console.error("Error checking ticket ownership:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};