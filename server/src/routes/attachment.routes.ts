import { Router } from "express";
import {
  downloadAttachmentHandler,
  removeAttachmentHandler,
} from "../controllers/attachment.controller.js";
import { requireAuth, requirePasswordChanged } from "../middleware/authGuard.js";

const router = Router();

// Protect all attachment endpoints with authentication and password-change gating
router.use(requireAuth, requirePasswordChanged);

// GET /api/v1/attachments/:id/download
router.get("/:id/download", downloadAttachmentHandler);

// DELETE /api/v1/attachments/:id
router.delete("/:id", removeAttachmentHandler);

export default router;

