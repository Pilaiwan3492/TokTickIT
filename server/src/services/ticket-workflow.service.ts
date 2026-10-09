/**
 * Ticket Workflow & Status Transition State Machine Service (Lab 4 — Issue 34, BR-08, BR-09, BR-11, BR-12, UNIT-02)
 *
 * Implements the canonical 8-status lifecycle transition matrix:
 * - NEW -> OPEN, CANCELLED
 * - OPEN -> IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CANCELLED
 * - IN_PROGRESS -> WAITING_FOR_REQUESTER, RESOLVED, CANCELLED
 * - WAITING_FOR_REQUESTER -> IN_PROGRESS, RESOLVED, CANCELLED
 * - RESOLVED -> CLOSED, REOPENED
 * - REOPENED -> IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CANCELLED
 * - CLOSED -> [] (Terminal)
 * - CANCELLED -> [] (Terminal)
 */

export type TicketStatusType =
  | "NEW"
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_FOR_REQUESTER"
  | "RESOLVED"
  | "CLOSED"
  | "REOPENED"
  | "CANCELLED";

export const ALL_TICKET_STATUSES: readonly TicketStatusType[] = [
  "NEW",
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_REQUESTER",
  "RESOLVED",
  "CLOSED",
  "REOPENED",
  "CANCELLED",
] as const;

export const TERMINAL_STATUSES: readonly TicketStatusType[] = [
  "CLOSED",
  "CANCELLED",
] as const;

export const PERMITTED_STATUS_TRANSITIONS: Record<TicketStatusType, readonly TicketStatusType[]> = {
  NEW: ["OPEN", "CANCELLED"],
  OPEN: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  REOPENED: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  CLOSED: [],
  CANCELLED: [],
} as const;

export const RESOLUTION_GATE_ELIGIBLE_STATUSES: readonly TicketStatusType[] = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_REQUESTER",
  "REOPENED",
] as const;

/**
 * Validates whether a given string is a recognized canonical TicketStatus.
 */
export function isValidStatus(status: unknown): status is TicketStatusType {
  return typeof status === "string" && ALL_TICKET_STATUSES.includes(status as TicketStatusType);
}

/**
 * Validates whether transition from currentStatus to targetStatus is permitted.
 * Returns false if either status is invalid, if currentStatus is terminal,
 * or if targetStatus is not in the permitted transitions list.
 */
export function isValidTransition(
  currentStatus: unknown,
  targetStatus: unknown
): boolean {
  if (!isValidStatus(currentStatus) || !isValidStatus(targetStatus)) {
    return false;
  }

  // Disallow transitioning to the identical status
  if (currentStatus === targetStatus) {
    return false;
  }

  const allowedNext = PERMITTED_STATUS_TRANSITIONS[currentStatus];
  return allowedNext.includes(targetStatus);
}

/**
 * Checks whether a status is terminal (CLOSED or CANCELLED).
 */
export function isTerminalStatus(status: unknown): boolean {
  return isValidStatus(status) && TERMINAL_STATUSES.includes(status);
}

/**
 * Checks whether a current ticket status is eligible to pass the Resolution Gate into RESOLVED.
 */
export function isResolutionGateEligible(status: unknown): boolean {
  return isValidStatus(status) && RESOLUTION_GATE_ELIGIBLE_STATUSES.includes(status);
}

/**
 * Returns array of permitted next statuses for a given status.
 */
export function getPermittedNextStatuses(status: unknown): readonly TicketStatusType[] {
  if (!isValidStatus(status)) {
    return [];
  }
  return PERMITTED_STATUS_TRANSITIONS[status];
}
