import { Request, Response } from "express";

import { getPrisma } from "../prisma.js";
import { signToken } from "../utils/jwt.js";
import {
  hashPassword,
  comparePassword,
  validatePasswordPolicy,
} from "../utils/password.js";
import { AuthenticatedRequest } from "../middleware/authGuard.js";

/**
 * POST /api/v1/auth/login
 * Public endpoint: Authenticates user credentials and issues canonical 8-hour JWT Bearer token.
 * Prevents account enumeration by verifying password match before evaluating account active state.
 */
export const loginHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and password are required.",
        },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const prisma = getPrisma();

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
    });

    // Account Enumeration Defense: Unregistered email returns generic INVALID_CREDENTIALS
    if (!user) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password. Please try again.",
        },
      });
    }

    // Account Enumeration Defense: Password match is verified BEFORE checking active status.
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password. Please try again.",
        },
      });
    }

    // Only if credentials are valid does the backend return ACCOUNT_INACTIVE
    if (!user.isActive) {
      return res.status(401).json({
        error: {
          code: "ACCOUNT_INACTIVE",
          message: "Your account is currently inactive. Please contact an administrator.",
        },
      });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });

    return res.status(200).json({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          mustChangePassword: user.mustChangePassword,
        },
      },
    });
  } catch (error) {
    console.error("Error during loginHandler:", error);
    return res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
      },
    });
  }
};

/**
 * POST /api/v1/auth/logout
 * Authenticated endpoint: Registers token's jti into server-side RevokedToken registry.
 */
export const logoutHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const prisma = getPrisma();

    await prisma.revokedToken.upsert({
      where: { jti: user.jti },
      update: {},
      create: {
        jti: user.jti,
        userId: user.id,
        expiresAt: new Date(user.exp * 1000),
      },
    });

    return res.status(200).json({
      data: {
        message: "Logged out successfully. Token invalidated on server.",
      },
    });
  } catch (error) {
    console.error("Error during logoutHandler:", error);
    return res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
      },
    });
  }
};

/**
 * GET /api/v1/auth/me
 * Authenticated endpoint: Retrieves current authenticated user profile.
 */
export const getMeHandler = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  return res.status(200).json({
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: true,
      mustChangePassword: user.mustChangePassword,
    },
  });
};

/**
 * POST /api/v1/auth/change-password
 * Authenticated endpoint: Allows user to change password (exempt from requirePasswordChanged).
 */
export const changePasswordHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Current password, new password, and confirmation are required.",
        },
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "New password and confirmation password do not match.",
        },
      });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "New password must be different from current password.",
        },
      });
    }

    const policy = validatePasswordPolicy(newPassword);
    if (!policy.valid) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: policy.reason || "Password does not meet complexity requirements.",
        },
      });
    }

    const prisma = getPrisma();
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!dbUser) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "The requested resource was not found.",
        },
      });
    }

    const isMatch = await comparePassword(currentPassword, dbUser.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Current password is incorrect.",
        },
      });
    }

    const newHash = await hashPassword(newPassword);
    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
      },
    });

    return res.status(200).json({
      data: {
        message: "Password changed successfully.",
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("Error during changePasswordHandler:", error);
    return res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
      },
    });
  }
};
