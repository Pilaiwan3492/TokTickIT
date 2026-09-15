import { Router, Request, Response } from "express";
import { requireAuth, requireRole } from "../middleware/authGuard.js";

const router = Router();

// Strict Role Guard: All admin endpoints require active session with ADMIN role
router.use(requireAuth);
router.use(requireRole(["ADMIN"]));

// Initial placeholder endpoint for users list (fully implemented in Issue 27)
router.get("/users", (_req: Request, res: Response) => {
  return res.status(200).json({ data: [] });
});

export default router;
