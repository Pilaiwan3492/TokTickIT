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

/**
 * Strict ISO 8601 DateTime format regex (YYYY-MM-DDTHH:mm:ss[.sss][Z|+-HH:mm]).
 */
export const ISO_DATE_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-]\d{2}):?(\d{2}))$/;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }
  if ([1, 3, 5, 7, 8, 10, 12].includes(month)) {
    return 31;
  }
  return 0;
}

/**
 * Validates whether an input is a non-empty string conforming strictly to ISO 8601 DateTime,
 * verifying syntax, authentic calendar day/month/leap-year correctness, time bounds,
 * and strict timezone offset bounds (hours 00-23, minutes 00-59 for both + and - offsets).
 */
export function isValidIsoDateTime(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const match = ISO_DATE_REGEX.exec(value);
  if (!match) {
    return false;
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const hour = parseInt(match[4], 10);
  const minute = parseInt(match[5], 10);
  const second = parseInt(match[6], 10);

  if (month < 1 || month > 12) {
    return false;
  }

  const maxDays = getDaysInMonth(year, month);
  if (day < 1 || day > maxDays) {
    return false;
  }

  if (hour < 0 || hour > 23) {
    return false;
  }

  if (minute < 0 || minute > 59) {
    return false;
  }

  if (second < 0 || second > 59) {
    return false;
  }

  // Validate timezone offset components when [+-]HH:?MM is used instead of Z
  if (match[7] !== undefined && match[8] !== undefined) {
    const tzHour = Math.abs(parseInt(match[7], 10));
    const tzMinute = parseInt(match[8], 10);
    if (tzHour < 0 || tzHour > 23 || tzMinute < 0 || tzMinute > 59) {
      return false;
    }
  }

  const date = new Date(value);
  return !isNaN(date.getTime());
}


