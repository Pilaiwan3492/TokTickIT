import { Router } from "express";
import {
  downloadAttachmentHandler,
  removeAttachmentHandler,
} from "../controllers/attachment.controller.js";

const router = Router();

// GET /api/v1/attachments/:id/download?requesterId={requesterId}
router.get("/:id/download", downloadAttachmentHandler);

// DELETE /api/v1/attachments/:id?requesterId={requesterId}
router.delete("/:id", removeAttachmentHandler);

export default router;
