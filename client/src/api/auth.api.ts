import {
  AuthResponse,
  AuthUser,
  ChangePasswordPayload,
  LoginCredentials,
} from "../types/auth";

export const TOKEN_STORAGE_KEY = "toktickit_auth_token";

export class AuthApiError extends Error {
  code: string;
  fields?: Record<string, string>;

  constructor(code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = "AuthApiError";
    this.code = code;
    this.fields = fields;
  }
}

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const removeStoredToken = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const loginApi = async (
  credentials: LoginCredentials
): Promise<AuthResponse["data"]> => {
  const res = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = body?.error;
    throw new AuthApiError(
      err?.code || "LOGIN_FAILED",
      err?.message || "Failed to log in.",
      err?.fields
    );
  }

  return body.data;
};

export const logoutApi = async (token?: string | null): Promise<void> => {
  const authToken = token || getStoredToken();
  if (!authToken) return;

  try {
    await fetch("/api/v1/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
  } catch (err) {
    console.warn("Server logout request failed:", err);
  }
};

export const getMeApi = async (token?: string | null): Promise<AuthUser> => {
  const authToken = token || getStoredToken();
  if (!authToken) {
    throw new AuthApiError("UNAUTHENTICATED", "No active session token.");
  }

  const res = await fetch("/api/v1/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = body?.error;
    throw new AuthApiError(
      err?.code || "SESSION_INVALID",
      err?.message || "Failed to retrieve authenticated user profile.",
      err?.fields
    );
  }

  return body.data;
};

export const changePasswordApi = async (
  payload: ChangePasswordPayload,
  token?: string | null
): Promise<{ message: string }> => {
  const authToken = token || getStoredToken();
  if (!authToken) {
    throw new AuthApiError("UNAUTHENTICATED", "No active session token.");
  }

  const res = await fetch("/api/v1/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = body?.error;
    throw new AuthApiError(
      err?.code || "PASSWORD_CHANGE_FAILED",
      err?.message || "Failed to change password.",
      err?.fields
    );
  }

  return body.data;
};
