import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authGuard.js";
import {
  listUsersHandler,
  createUserHandler,
  updateUserHandler,
  resetUserPasswordHandler,
  deleteUserMethodNotAllowedHandler,
} from "../controllers/admin.controller.js";

const router = Router();

// Strict Role Guard: All admin endpoints require active session with ADMIN role
router.use(requireAuth);
router.use(requireRole(["ADMIN"]));

// 1. List Users with search & role filter
router.get("/users", listUsersHandler);

// 2. Create User with 1 role and initial password
router.post("/users", createUserHandler);

// 3. Edit User (name, email, role, isActive with safety guards)
router.patch("/users/:id", updateUserHandler);

// 4. Reset User Initial Password
router.post("/users/:id/reset-password", resetUserPasswordHandler);

// 5. Prohibited User Deletion (BR-19: returns 405 Method Not Allowed)
router.delete("/users/:id", deleteUserMethodNotAllowedHandler);

export default router;
