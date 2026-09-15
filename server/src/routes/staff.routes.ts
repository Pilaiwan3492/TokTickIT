import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authGuard.js";
import {
  getStaffQueueHandler,
  getStaffTicketDetailHandler,
  updateTicketAssignmentHandler,
  updateTicketPriorityHandler,
  transitionTicketStatusHandler,
  getStaffAssigneesHandler,
} from "../controllers/staff.controller.js";

const router = Router();

// Strict Role Guard: All staff endpoints require active session with IT_STAFF or ADMIN role
router.use(requireAuth);
router.use(requireRole(["IT_STAFF", "ADMIN"]));

// Queue and Detail
router.get("/tickets", getStaffQueueHandler);
router.get("/tickets/:id", getStaffTicketDetailHandler);

// Operational Controls
router.patch("/tickets/:id/assignment", updateTicketAssignmentHandler);
router.patch("/tickets/:id/priority", updateTicketPriorityHandler);
router.patch("/tickets/:id/status", transitionTicketStatusHandler);

// Assignee selection helper
router.get("/assignees", getStaffAssigneesHandler);

export default router;
