import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password using bcrypt with standard salt rounds.
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compares a candidate plaintext password with a bcrypt hash.
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Validates that a password satisfies the Lab 3 security complexity rules:
 * 1. Minimum 8 characters in length
 * 2. At least one uppercase letter (A-Z)
 * 3. At least one lowercase letter (a-z)
 * 4. At least one digit or special symbol
 */
export const validatePasswordPolicy = (
  password: string
): { valid: boolean; reason?: string } => {
  if (!password || typeof password !== "string") {
    return { valid: false, reason: "Password is required." };
  }

  if (password.length < 8) {
    return {
      valid: false,
      reason: "Password must be at least 8 characters long.",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      reason: "Password must contain at least one uppercase letter.",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      reason: "Password must contain at least one lowercase letter.",
    };
  }

  if (!/[0-9!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      valid: false,
      reason: "Password must contain at least one digit or symbol.",
    };
  }

  return { valid: true };
};
