import { Router } from "express";

import {
  loginHandler,
  logoutHandler,
  getMeHandler,
  changePasswordHandler,
} from "../controllers/auth.controller.js";
import { requireAuth, requirePasswordChanged } from "../middleware/authGuard.js";

const router = Router();

// Public: Login
router.post("/login", loginHandler);

// Protected: Logout with server-side token invalidation
router.post("/logout", requireAuth, logoutHandler);

// Protected: Get current user profile
router.get("/me", requireAuth, getMeHandler);

// Protected: Change password (exempt from requirePasswordChanged)
router.post("/change-password", requireAuth, changePasswordHandler);

// Protected: Gated resource for verifying password-change enforcement
router.get("/gated-check", requireAuth, requirePasswordChanged, (_req, res) => {
  res.status(200).json({ data: { access: "granted" } });
});

export default router;
