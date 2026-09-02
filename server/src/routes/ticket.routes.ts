import { Router } from "express";

import { createTicketHandler, getTicketsHandler, getTicketDetailHandler } from "../controllers/ticket.controller.js";

const router = Router();

// POST /api/v1/tickets
router.post("/", createTicketHandler);

// GET /api/v1/tickets
router.get("/", getTicketsHandler);

// GET /api/v1/tickets/:id
router.get("/:id", getTicketDetailHandler);

export default router;