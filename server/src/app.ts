import express, { Request, Response } from "express";
import cors from "cors";
import { getPrisma } from "./prisma.js";
import {
  requireRequester,
  requireTicketOwnership,
  AuthenticatedRequest,
} from "./middleware/requesterGuard.js";

void getPrisma;

export const app = express();

app.use(cors());
app.use(express.json());

// Issue 2 — Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

// Issue 4 — Categories
app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Issue 12 — Ticket Ownership Guarded Endpoints
app.get(
  "/api/v1/tickets/:id",
  requireRequester,
  requireTicketOwnership,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const prisma = getPrisma();
      const ticket = await prisma.ticket.findUnique({
        where: { id: req.params.id },
        include: {
          category: true,
          relatedSystem: true,
          attachments: true,
        },
      });
      res.status(200).json(ticket);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default app;
