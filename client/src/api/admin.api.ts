import { apiFetch } from "./apiClient";
import {
  AdminUser,
  CreateUserPayload,
  UpdateUserPayload,
  ResetPasswordPayload,
} from "../types/admin";

export class AdminApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "AdminApiError";
    this.code = code;
    this.status = status;
  }
}

export const listUsersApi = async (
  search?: string,
  role?: string
): Promise<AdminUser[]> => {
  const params = new URLSearchParams();
  if (search && search.trim()) params.set("search", search.trim());
  if (role && role.trim()) params.set("role", role.trim());

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await apiFetch(`/api/v1/admin/users${query}`);
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new AdminApiError(
      json?.error?.code || "UNKNOWN_ERROR",
      json?.error?.message || "Failed to fetch users",
      res.status
    );
  }

  return json.data;
};

export const createUserApi = async (
  payload: CreateUserPayload
): Promise<AdminUser> => {
  const res = await apiFetch("/api/v1/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new AdminApiError(
      json?.error?.code || "UNKNOWN_ERROR",
      json?.error?.message || "Failed to create user",
      res.status
    );
  }

  return json.data;
};

export const updateUserApi = async (
  id: string,
  payload: UpdateUserPayload
): Promise<AdminUser> => {
  const res = await apiFetch(`/api/v1/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new AdminApiError(
      json?.error?.code || "UNKNOWN_ERROR",
      json?.error?.message || "Failed to update user",
      res.status
    );
  }

  return json.data;
};

export const resetUserPasswordApi = async (
  id: string,
  payload: ResetPasswordPayload
): Promise<{ message: string }> => {
  const res = await apiFetch(`/api/v1/admin/users/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new AdminApiError(
      json?.error?.code || "UNKNOWN_ERROR",
      json?.error?.message || "Failed to reset password",
      res.status
    );
  }

  return json.data;
};
