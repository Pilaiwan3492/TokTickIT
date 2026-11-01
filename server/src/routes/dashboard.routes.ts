import { Router } from "express";
import {
  getRequesterDashboardHandler,
  getStaffDashboardHandler,
} from "../controllers/dashboard.controller.js";
import {
  requireAuth,
  requirePasswordChanged,
} from "../middleware/authGuard.js";

const router = Router();

// All dashboard endpoints require authenticated session and completed initial password change
router.use(requireAuth, requirePasswordChanged);

// GET /api/v1/dashboard/requester (REQUESTER role only - enforced in controller with 403 FORBIDDEN)
router.get("/requester", getRequesterDashboardHandler);

// GET /api/v1/dashboard/staff (IT_STAFF and ADMIN roles only - enforced in controller with 403 FORBIDDEN)
router.get("/staff", getStaffDashboardHandler);

export default router;
