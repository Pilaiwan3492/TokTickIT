import express, { Request, Response } from "express";
import cors from "cors";

import { getPrisma } from "./prisma.js";
import ticketRoutes from "./routes/ticket.routes.js";

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

// Lab 2 — Ticket APIs
// POST /api/v1/tickets
// GET  /api/v1/tickets
// GET  /api/v1/tickets/:id
//
// The actual handlers are defined in ticket.routes.ts
// and ticket.controller.ts.
app.use("/api/v1/tickets", ticketRoutes);

export default app;