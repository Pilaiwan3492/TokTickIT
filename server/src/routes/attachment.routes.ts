import { Router } from "express";
import {
  downloadAttachmentHandler,
  removeAttachmentHandler,
} from "../controllers/attachment.controller.js";
import { requireAuth, requirePasswordChanged, requireRole } from "../middleware/authGuard.js";

const router = Router();

// Protect all attachment endpoints with authentication, password-change gating, and REQUESTER role
router.use(requireAuth, requirePasswordChanged, requireRole(["REQUESTER"]));

// GET /api/v1/attachments/:id/download
router.get("/:id/download", downloadAttachmentHandler);

// DELETE /api/v1/attachments/:id
router.delete("/:id", removeAttachmentHandler);

export default router;

