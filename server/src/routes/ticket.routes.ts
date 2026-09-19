import { Router } from "express";

import {
  createTicketHandler,
  getTicketsHandler,
  getTicketDetailHandler,
  setResolutionIndicatorHandler,
} from "../controllers/ticket.controller.js";
import { uploadMiddleware, uploadAttachmentHandler } from "../controllers/attachment.controller.js";
import { getCommentsHandler, createCommentHandler } from "../controllers/comment.controller.js";
import { getNotesHandler, createNoteHandler } from "../controllers/note.controller.js";
import { requireAuth, requirePasswordChanged, requireRole } from "../middleware/authGuard.js";

const router = Router();

// Protect all ticket endpoints with authentication and password-change gating
router.use(requireAuth, requirePasswordChanged);

// --- Requester-only endpoints ---

// POST /api/v1/tickets (Create Ticket)
router.post("/", requireRole(["REQUESTER"]), createTicketHandler);

// GET /api/v1/tickets (My Tickets)
router.get("/", requireRole(["REQUESTER"]), getTicketsHandler);

// POST /api/v1/tickets/:id/attachments (Upload Attachment)
router.post("/:id/attachments", requireRole(["REQUESTER"]), uploadMiddleware, uploadAttachmentHandler);

// POST /api/v1/tickets/:id/resolve-indicator (Problem Appears Resolved)
router.post("/:id/resolve-indicator", requireRole(["REQUESTER"]), setResolutionIndicatorHandler);

// --- Shared endpoints (Requester, IT_STAFF, ADMIN) ---

// GET /api/v1/tickets/:id (Ticket Detail)
router.get("/:id", requireRole(["REQUESTER", "IT_STAFF", "ADMIN"]), getTicketDetailHandler);

// GET /api/v1/tickets/:id/comments (Retrieve Public Comments)
router.get("/:id/comments", requireRole(["REQUESTER", "IT_STAFF", "ADMIN"]), getCommentsHandler);

// POST /api/v1/tickets/:id/comments (Create Public Comment)
router.post("/:id/comments", requireRole(["REQUESTER", "IT_STAFF", "ADMIN"]), createCommentHandler);

// --- Operational endpoints (IT_STAFF, ADMIN only) ---

// GET /api/v1/tickets/:id/notes (Retrieve Internal Notes)
router.get("/:id/notes", requireRole(["IT_STAFF", "ADMIN"]), getNotesHandler);

// POST /api/v1/tickets/:id/notes (Create Internal Note)
router.post("/:id/notes", requireRole(["IT_STAFF", "ADMIN"]), createNoteHandler);

export default router;
