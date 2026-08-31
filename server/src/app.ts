import express, { Request, Response } from "express";
import cors from "cors";
import { getPrisma } from "./prisma.js";

void getPrisma;

export const app = express();

app.use(cors());         
app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { id: "asc" }
    });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/v1/requesters/active", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const activeRequesters = await prisma.requesterUser.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });
    res.status(200).json(activeRequesters);
  } catch (error) {
    console.error("Error fetching active requesters:", error);
    res.status(500).json({ error: "Failed to fetch active requesters" });
  }
});

export default app;
