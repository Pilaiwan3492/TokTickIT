import { apiFetch, ApiClientError } from "./apiClient";
import {
  ActionTaken,
  CreateActionTakenPayload,
  UpdateActionTakenPayload,
} from "../types/ticket";

export interface ActionTakenMutationResult {
  action: ActionTaken;
  ticketUpdatedAt?: string;
}

/**
 * GET /api/v1/tickets/:id/actions-taken
 * Retrieve all Actions Taken for a ticket in chronological order (actionDate ASC).
 */
export async function getActionsTaken(ticketId: string): Promise<ActionTaken[]> {
  const res = await apiFetch(`/api/v1/tickets/${ticketId}/actions-taken`);
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiClientError(
      body?.error?.message || "Failed to load Actions Taken.",
      res.status,
      body?.error?.code,
      body
    );
  }

  if (Array.isArray(body)) {
    return body;
  }
  if (Array.isArray(body?.data?.actionsTaken)) {
    return body.data.actionsTaken;
  }
  if (Array.isArray(body?.data)) {
    return body.data;
  }
  if (Array.isArray(body?.actionsTaken)) {
    return body.actionsTaken;
  }

  return [];
}

/**
 * POST /api/v1/tickets/:id/actions-taken
 * Create a new Action Taken record on a ticket (IT Staff / Admin only).
 */
export async function createActionTaken(
  ticketId: string,
  payload: CreateActionTakenPayload
): Promise<ActionTakenMutationResult> {
  const res = await apiFetch(`/api/v1/tickets/${ticketId}/actions-taken`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiClientError(
      body?.error?.message || "Failed to record Action Taken.",
      res.status,
      body?.error?.code,
      body
    );
  }

  return {
    action: body?.data || body,
    ticketUpdatedAt: body?.ticketUpdatedAt,
  };
}

/**
 * PATCH /api/v1/tickets/:id/actions-taken/:actionId
 * Update an existing Action Taken record on a ticket (IT Staff / Admin only).
 */
export async function updateActionTaken(
  ticketId: string,
  actionId: string,
  payload: UpdateActionTakenPayload
): Promise<ActionTakenMutationResult> {
  const res = await apiFetch(
    `/api/v1/tickets/${ticketId}/actions-taken/${actionId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiClientError(
      body?.error?.message || "Failed to update Action Taken.",
      res.status,
      body?.error?.code,
      body
    );
  }

  return {
    action: body?.data || body,
    ticketUpdatedAt: body?.ticketUpdatedAt,
  };
}
