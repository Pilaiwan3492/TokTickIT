import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { getPrisma } from "../prisma.js";
import { verifyToken, TokenPayload } from "../utils/jwt.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: "REQUESTER" | "IT_STAFF" | "ADMIN";
    mustChangePassword: boolean;
    jti: string;
    exp: number;
  };
}

/**
 * Middleware: Enforces canonical Bearer JWT authentication.
 * Verifies token signature, expiration, database revocation status, and user active status.
 */
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: {
        code: "SESSION_EXPIRED",
        message: "Authentication token is required.",
      },
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      error: {
        code: "SESSION_EXPIRED",
        message: "Authentication token is required.",
      },
    });
  }

  let payload: TokenPayload;
  try {
    payload = verifyToken(token);
  } catch (error: any) {
    if (error instanceof jwt.TokenExpiredError || error?.name === "TokenExpiredError") {
      return res.status(401).json({
        error: {
          code: "SESSION_EXPIRED",
          message: "Your session has expired. Please sign in again.",
        },
      });
    }

    return res.status(401).json({
      error: {
        code: "SESSION_INVALID",
        message: "Authentication token is invalid or corrupted.",
      },
    });
  }

  try {
    const prisma = getPrisma();

    // Check server-side revocation registry
    const revoked = await prisma.revokedToken.findUnique({
      where: { jti: payload.jti },
    });

    if (revoked) {
      return res.status(401).json({
        error: {
          code: "SESSION_REVOKED",
          message: "Your session has been revoked. Please sign in again.",
        },
      });
    }

    // Verify user exists and is active in database
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: {
          code: "ACCOUNT_INACTIVE",
          message: "Your account is currently inactive. Please contact an administrator.",
        },
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      jti: payload.jti,
      exp: payload.exp,
    };

    next();
  } catch (dbError) {
    console.error("Database error during requireAuth:", dbError);
    return res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
      },
    });
  }
};

/**
 * Middleware: Blocks users marked with mustChangePassword: true from normal application resources.
 * Only /api/v1/auth/change-password and /api/v1/auth/me are permitted.
 */
export const requirePasswordChanged = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.mustChangePassword === true) {
    return res.status(403).json({
      error: {
        code: "PASSWORD_CHANGE_REQUIRED",
        message: "You must change your password before continuing.",
      },
    });
  }

  next();
};
