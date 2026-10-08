/**
 * Action Taken Validation Helpers (Lab 4 — Issue 33, BR-05, UNIT-01)
 */

export interface FollowUpValidationResult {
  isValid: boolean;
  errorCode?: "FOLLOWUP_NOTE_REQUIRED";
  errorMessage?: string;
}

/**
 * Validates that if followUpRequired is true, followUpNote contains non-whitespace text.
 * When followUpRequired is false, followUpNote is optional or may be omitted/null.
 */
export function validateFollowUpNote(
  followUpRequired?: boolean | null,
  followUpNote?: string | null
): FollowUpValidationResult {
  if (followUpRequired === true) {
    if (!followUpNote || typeof followUpNote !== "string" || followUpNote.trim().length === 0) {
      return {
        isValid: false,
        errorCode: "FOLLOWUP_NOTE_REQUIRED",
        errorMessage: "A follow-up note is required when follow-up is marked as required.",
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates optimistic concurrency timestamp against database timestamp.
 * Returns true if a conflict is detected (stale update).
 */
export function isConcurrencyStale(
  expectedTimestamp?: string | Date | null,
  currentTimestamp?: Date | null
): boolean {
  if (!expectedTimestamp || !currentTimestamp) {
    return false;
  }

  const clientTime = new Date(expectedTimestamp).getTime();
  const dbTime = new Date(currentTimestamp).getTime();

  if (isNaN(clientTime) || isNaN(dbTime)) {
    return false;
  }

  // Mismatch indicates the server record was updated concurrently
  return clientTime !== dbTime;
}
