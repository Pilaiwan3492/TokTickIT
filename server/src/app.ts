import express, { Request, Response } from "express";
import cors from "cors";
import { getPrisma } from "./prisma.js";
import { requireRequester, requireTicketOwnership, RequesterRequest } from "./middleware/requesterGuard.js";
import { createTicketHandler, getTicketsHandler } from "./controllers/ticket.controller.js";

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

// Issue 4 — Legacy Categories Endpoint
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

// Lab 2 Reference API — GET /api/v1/categories (Active only)
app.get("/api/v1/categories", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();

    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json({
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching active categories:", error);

    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
});

// Lab 2 Reference API — GET /api/v1/related-systems (Active only)
app.get("/api/v1/related-systems", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();

    const relatedSystems = await prisma.relatedSystem.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json({
      data: relatedSystems,
    });
  } catch (error) {
    console.error("Error fetching active related systems:", error);

    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
});

// Issue 12 — Active Requesters Endpoint
app.get("/api/v1/requesters/active", async (_req: Request, res: Response) => {
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
});

// Issue 14 — Get Tickets List Endpoint
app.get("/api/v1/tickets", getTicketsHandler);

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
app.post("/api/v1/tickets", requireRequester, createTicketHandler);

export default app;