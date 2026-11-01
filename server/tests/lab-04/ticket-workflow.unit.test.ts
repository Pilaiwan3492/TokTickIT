import { describe, it, expect } from "vitest";
import {
  ALL_TICKET_STATUSES,
  TERMINAL_STATUSES,
  PERMITTED_STATUS_TRANSITIONS,
  isValidStatus,
  isValidTransition,
  isTerminalStatus,
  isResolutionGateEligible,
  getPermittedNextStatuses,
  type TicketStatusType,
} from "../../src/services/ticket-workflow.service.js";

describe("Ticket Workflow State Machine Unit Tests (Lab 4 — Issue 34: UNIT-02)", () => {
  // 1. Status Recognition
  it("should validate all 8 canonical statuses", () => {
    expect(ALL_TICKET_STATUSES).toHaveLength(8);
    ALL_TICKET_STATUSES.forEach((status) => {
      expect(isValidStatus(status)).toBe(true);
    });
    expect(isValidStatus("UNKNOWN_STATUS")).toBe(false);
    expect(isValidStatus(null)).toBe(false);
    expect(isValidStatus(undefined)).toBe(false);
    expect(isValidStatus("")).toBe(false);
  });

  // 2. All 18 Permitted Transitions
  it("should return true for all 18 permitted transitions defined in BR-09", () => {
    let totalPermittedTransitions = 0;

    for (const [fromStatus, toStatuses] of Object.entries(PERMITTED_STATUS_TRANSITIONS)) {
      for (const target of toStatuses) {
        expect(isValidTransition(fromStatus, target)).toBe(true);
        totalPermittedTransitions++;
      }
    }

    // Explicitly verify the total count of valid transitions is 18
    expect(totalPermittedTransitions).toBe(18);
  });

  // 3. Specific Valid Transitions by Origin Status
  it("should validate permitted transitions from NEW", () => {
    expect(isValidTransition("NEW", "OPEN")).toBe(true);
    expect(isValidTransition("NEW", "CANCELLED")).toBe(true);
    expect(getPermittedNextStatuses("NEW")).toEqual(["OPEN", "CANCELLED"]);
  });

  it("should validate permitted transitions from OPEN", () => {
    expect(isValidTransition("OPEN", "IN_PROGRESS")).toBe(true);
    expect(isValidTransition("OPEN", "WAITING_FOR_REQUESTER")).toBe(true);
    expect(isValidTransition("OPEN", "RESOLVED")).toBe(true);
    expect(isValidTransition("OPEN", "CANCELLED")).toBe(true);
    expect(getPermittedNextStatuses("OPEN")).toEqual([
      "IN_PROGRESS",
      "WAITING_FOR_REQUESTER",
      "RESOLVED",
      "CANCELLED",
    ]);
  });

  it("should validate permitted transitions from IN_PROGRESS", () => {
    expect(isValidTransition("IN_PROGRESS", "WAITING_FOR_REQUESTER")).toBe(true);
    expect(isValidTransition("IN_PROGRESS", "RESOLVED")).toBe(true);
    expect(isValidTransition("IN_PROGRESS", "CANCELLED")).toBe(true);
    expect(getPermittedNextStatuses("IN_PROGRESS")).toEqual([
      "WAITING_FOR_REQUESTER",
      "RESOLVED",
      "CANCELLED",
    ]);
  });

  it("should validate permitted transitions from WAITING_FOR_REQUESTER", () => {
    expect(isValidTransition("WAITING_FOR_REQUESTER", "IN_PROGRESS")).toBe(true);
    expect(isValidTransition("WAITING_FOR_REQUESTER", "RESOLVED")).toBe(true);
    expect(isValidTransition("WAITING_FOR_REQUESTER", "CANCELLED")).toBe(true);
    expect(getPermittedNextStatuses("WAITING_FOR_REQUESTER")).toEqual([
      "IN_PROGRESS",
      "RESOLVED",
      "CANCELLED",
    ]);
  });

  it("should validate permitted transitions from RESOLVED", () => {
    expect(isValidTransition("RESOLVED", "CLOSED")).toBe(true);
    expect(isValidTransition("RESOLVED", "REOPENED")).toBe(true);
    expect(getPermittedNextStatuses("RESOLVED")).toEqual(["CLOSED", "REOPENED"]);
  });

  it("should validate permitted transitions from REOPENED", () => {
    expect(isValidTransition("REOPENED", "IN_PROGRESS")).toBe(true);
    expect(isValidTransition("REOPENED", "WAITING_FOR_REQUESTER")).toBe(true);
    expect(isValidTransition("REOPENED", "RESOLVED")).toBe(true);
    expect(isValidTransition("REOPENED", "CANCELLED")).toBe(true);
    expect(getPermittedNextStatuses("REOPENED")).toEqual([
      "IN_PROGRESS",
      "WAITING_FOR_REQUESTER",
      "RESOLVED",
      "CANCELLED",
    ]);
  });

  // 4. Terminal Status Enforcement
  it("should prohibit any transition out of terminal statuses CLOSED and CANCELLED", () => {
    expect(TERMINAL_STATUSES).toEqual(["CLOSED", "CANCELLED"]);
    expect(isTerminalStatus("CLOSED")).toBe(true);
    expect(isTerminalStatus("CANCELLED")).toBe(true);
    expect(isTerminalStatus("OPEN")).toBe(false);

    ALL_TICKET_STATUSES.forEach((target) => {
      expect(isValidTransition("CLOSED", target)).toBe(false);
      expect(isValidTransition("CANCELLED", target)).toBe(false);
    });

    expect(getPermittedNextStatuses("CLOSED")).toEqual([]);
    expect(getPermittedNextStatuses("CANCELLED")).toEqual([]);
  });

  // 5. Disallowed & Illegal Jumps
  it("should reject illegal status jumps and backward transitions", () => {
    // Direct jumps from NEW
    expect(isValidTransition("NEW", "RESOLVED")).toBe(false);
    expect(isValidTransition("NEW", "CLOSED")).toBe(false);
    expect(isValidTransition("NEW", "IN_PROGRESS")).toBe(false);
    expect(isValidTransition("NEW", "WAITING_FOR_REQUESTER")).toBe(false);
    expect(isValidTransition("NEW", "REOPENED")).toBe(false);

    // Backward jumps from OPEN
    expect(isValidTransition("OPEN", "NEW")).toBe(false);
    expect(isValidTransition("OPEN", "CLOSED")).toBe(false);
    expect(isValidTransition("OPEN", "REOPENED")).toBe(false);

    // Jumps from IN_PROGRESS
    expect(isValidTransition("IN_PROGRESS", "NEW")).toBe(false);
    expect(isValidTransition("IN_PROGRESS", "OPEN")).toBe(false);
    expect(isValidTransition("IN_PROGRESS", "CLOSED")).toBe(false);

    // Jumps from WAITING_FOR_REQUESTER
    expect(isValidTransition("WAITING_FOR_REQUESTER", "NEW")).toBe(false);
    expect(isValidTransition("WAITING_FOR_REQUESTER", "OPEN")).toBe(false);
    expect(isValidTransition("WAITING_FOR_REQUESTER", "CLOSED")).toBe(false);

    // Disallowed transitions from RESOLVED
    expect(isValidTransition("RESOLVED", "NEW")).toBe(false);
    expect(isValidTransition("RESOLVED", "OPEN")).toBe(false);
    expect(isValidTransition("RESOLVED", "IN_PROGRESS")).toBe(false);
    expect(isValidTransition("RESOLVED", "WAITING_FOR_REQUESTER")).toBe(false);
    expect(isValidTransition("RESOLVED", "CANCELLED")).toBe(false);

    // Disallow self-transition (e.g. OPEN -> OPEN)
    ALL_TICKET_STATUSES.forEach((status) => {
      expect(isValidTransition(status, status)).toBe(false);
    });
  });

  // 6. Resolution Gate Eligibility Check
  it("should identify eligible and ineligible statuses for transitioning to RESOLVED", () => {
    expect(isResolutionGateEligible("OPEN")).toBe(true);
    expect(isResolutionGateEligible("IN_PROGRESS")).toBe(true);
    expect(isResolutionGateEligible("WAITING_FOR_REQUESTER")).toBe(true);
    expect(isResolutionGateEligible("REOPENED")).toBe(true);

    expect(isResolutionGateEligible("NEW")).toBe(false);
    expect(isResolutionGateEligible("RESOLVED")).toBe(false);
    expect(isResolutionGateEligible("CLOSED")).toBe(false);
    expect(isResolutionGateEligible("CANCELLED")).toBe(false);
  });
});
