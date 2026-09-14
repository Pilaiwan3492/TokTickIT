import { Router } from "express";

import { createTicketHandler, getTicketsHandler, getTicketDetailHandler } from "../controllers/ticket.controller.js";
import { uploadMiddleware, uploadAttachmentHandler } from "../controllers/attachment.controller.js";
import { requireAuth, requirePasswordChanged, requireRole } from "../middleware/authGuard.js";

const router = Router();

// Protect all ticket endpoints with authentication, password-change gating, and REQUESTER role
router.use(requireAuth, requirePasswordChanged, requireRole(["REQUESTER"]));

// POST /api/v1/tickets
router.post("/", createTicketHandler);

// GET /api/v1/tickets
router.get("/", getTicketsHandler);

// GET /api/v1/tickets/:id
router.get("/:id", getTicketDetailHandler);

// POST /api/v1/tickets/:id/attachments
router.post("/:id/attachments", uploadMiddleware, uploadAttachmentHandler);

export default router;
