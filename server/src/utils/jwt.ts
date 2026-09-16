import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";

export interface TokenUserPayload {
  id: string;
  email: string;
  name: string;
  role: "REQUESTER" | "IT_STAFF" | "ADMIN";
  mustChangePassword: boolean;
  tokenVersion?: number;
}

export interface TokenPayload extends TokenUserPayload {
  jti: string;
  sub: string;
  iat: number;
  exp: number;
  tokenVersion?: number;
}

/**
 * Validates and retrieves the JWT signing secret from environment.
 * Throws a fatal security error if JWT_SECRET is missing or under 32 characters.
 * Zero hardcoded fallback exists by design.
 */
export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      "FATAL SECURITY ERROR: JWT_SECRET environment variable is missing or shorter than 32 characters."
    );
  }
  return secret.trim();
};

/**
 * Signs a canonical Bearer JWT token with HS256, 8-hour expiry, and unique UUID jti.
 */
export const signToken = (user: TokenUserPayload): string => {
  const secret = getJwtSecret();
  const jti = randomUUID();

  const payload = {
    jti,
    sub: user.id,
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    tokenVersion: user.tokenVersion ?? 0,
  };

  return jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn: "8h",
  });
};

/**
 * Cryptographically verifies token signature, algorithm, and expiration.
 * Throws jwt.TokenExpiredError or jwt.JsonWebTokenError on failure.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const verifyToken = (token: string): TokenPayload => {
  const secret = getJwtSecret();
  const payload = jwt.verify(token, secret, {
    algorithms: ["HS256"],
  }) as any;

  // Strict claim validation per TokenPayload specification
  const validRoles = ["REQUESTER", "IT_STAFF", "ADMIN"];
  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.sub !== "string" ||
    payload.sub.trim().length === 0 ||
    typeof payload.jti !== "string" ||
    !UUID_REGEX.test(payload.jti) ||
    !validRoles.includes(payload.role) ||
    typeof payload.mustChangePassword !== "boolean" ||
    typeof payload.iat !== "number" ||
    payload.iat <= 0 ||
    typeof payload.exp !== "number" ||
    payload.exp <= 0
  ) {
    throw new jwt.JsonWebTokenError("Malformed or invalid JWT claims payload.");
  }

  return payload as TokenPayload;
};

/**
 * Decodes a token without verifying its cryptographic signature.
 *
 * WARNING: This function is strictly informational/diagnostic and
 * MUST NEVER be used for authentication, authorization, or security decisions.
 * All security decisions and logout revocations must rely on claims verified by verifyToken().
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.decode(token);
    return decoded as TokenPayload | null;
  } catch {
    return null;
  }
};
