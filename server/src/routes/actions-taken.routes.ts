import { Router } from "express";
import {
  getActionsTakenHandler,
  createActionTakenHandler,
  updateActionTakenHandler,
} from "../controllers/actions-taken.controller.js";
import { requireAuth, requirePasswordChanged, requireRole } from "../middleware/authGuard.js";

const router = Router({ mergeParams: true });

// Require authentication and password-changed verification for all Actions Taken endpoints
router.use(requireAuth, requirePasswordChanged);

// GET /api/v1/tickets/:id/actions-taken (Requesters allowed for owned tickets, Staff/Admin for all)
router.get("/", getActionsTakenHandler);

// POST /api/v1/tickets/:id/actions-taken (IT Staff & Admin only)
router.post("/", requireRole(["IT_STAFF", "ADMIN"]), createActionTakenHandler);

// PATCH /api/v1/tickets/:id/actions-taken/:actionId (IT Staff & Admin only)
router.patch("/:actionId", requireRole(["IT_STAFF", "ADMIN"]), updateActionTakenHandler);

export default router;
