import express, { Request, Response } from "express";
import cors from "cors";
import { getPrisma } from "./prisma.js";
import { requireRequester, requireTicketOwnership, RequesterRequest, } from "./middleware/requesterGuard.js";


void getPrisma;

export const app = express();

app.use(cors());

app.use(express.json());

// Issue 2 — Health check

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "TokTickIT API",
  });
});

// Issue 4 — Categories

app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();

    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);

    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
});

// Issue 12 — Active Requesters Endpoint
// Used by the Development Requester Selector

app.get(
  "/api/v1/requesters/active",
  async (_req: Request, res: Response) => {
    try {
      const prisma = getPrisma();

      const activeRequesters = await prisma.requesterUser.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      res.status(200).json(activeRequesters);
    } catch (error) {
      console.error("Error fetching active requesters:", error);

      res.status(500).json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        },
      });
    }
  }
);

// Issue 12 — Ticket Detail with Requester Ownership Check
app.get(
  "/api/v1/tickets/:id",
  requireRequester,
  requireTicketOwnership,
  async (req: RequesterRequest, res: Response) => {
    try {
      const prisma = getPrisma();

      const ticket = await prisma.ticket.findUnique({
        where: {
          id: req.params.id,
        },
        include: {
          category: true,
          relatedSystem: true,
          attachments: true,
        },
      });

      // Ownership middleware already checks that the ticket exists.
      // This is a defensive check in case the ticket is removed between queries.

      if (!ticket) {
        return res.status(404).json({
          error: {
            code: "TICKET_NOT_FOUND",
            message: "Ticket not found.",
          },
        });
      }

      return res.status(200).json({
        data: ticket,
      });
    } catch (error) {
      console.error("Error fetching ticket:", error);

      return res.status(500).json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        },
      });
    }
  }
);

// Issue 13 — Create Ticket Endpoint
app.post(
  "/api/v1/tickets",
  requireRequester,
  async (req: RequesterRequest, res: Response) => {
    try {
      const prisma = getPrisma();
      const { categoryId, relatedSystemId, summary, description, requestedPriority } = req.body;
      const requesterId = req.requester?.id;

      const trimmedSummary = summary?.trim() || "";
      const trimmedDescription = description?.trim() || "";
      const fields: Record<string, string> = {};

      // Server-side validation
      if (!categoryId) fields.categoryId = "Category is required.";
      if (!relatedSystemId) fields.relatedSystemId = "Related system is required.";
      if (trimmedSummary.length < 5 || trimmedSummary.length > 150) {
        fields.summary = "Summary must be between 5 and 150 characters.";
      }
      if (trimmedDescription.length < 10 || trimmedDescription.length > 2000) {
        fields.description = "Description must be between 10 and 2,000 characters.";
      }

      if (Object.keys(fields).length > 0) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Please correct the highlighted fields.",
            fields,
          },
        });
      }

      // Generate Ticket Number (TKT-YYYY-XXXXXX)
      const year = new Date().getFullYear();
      const count = await prisma.ticket.count();
      const sequence = String(count + 1).padStart(6, "0");
      const ticketNo = `TKT-${year}-${sequence}`;

      const newTicket = await prisma.ticket.create({
        data: {
          ticketNo,
          requesterId: Number(requesterId),
          categoryId: Number(categoryId),
          relatedSystemId: Number(relatedSystemId),
          summary: trimmedSummary,
          description: trimmedDescription,
          requestedPriority: requestedPriority || "MEDIUM",
          currentStatus: "NEW",
        },
      });

      return res.status(201).json({
        data: newTicket,
      });
    } catch (error) {
      console.error("Error creating ticket:", error);
      return res.status(500).json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        },
      });
    }
  }
);

export default app;