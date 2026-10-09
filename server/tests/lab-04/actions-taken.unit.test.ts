import { describe, it, expect } from "vitest";
import { validateFollowUpNote, isConcurrencyStale, isValidIsoDateTime } from "../../src/utils/actionValidation.js";

describe("Actions Taken Unit Tests (Lab 4 — UNIT-01 & UNIT-04)", () => {
  // =========================================================================
  // UNIT-01: Validation function for followUpRequired and followUpNote combinations
  // =========================================================================
  describe("UNIT-01: validateFollowUpNote (BR-05)", () => {
    it("should reject when followUpRequired is true and followUpNote is undefined or null", () => {
      const res1 = validateFollowUpNote(true, undefined);
      expect(res1.isValid).toBe(false);
      expect(res1.errorCode).toBe("FOLLOWUP_NOTE_REQUIRED");

      const res2 = validateFollowUpNote(true, null);
      expect(res2.isValid).toBe(false);
      expect(res2.errorCode).toBe("FOLLOWUP_NOTE_REQUIRED");
    });

    it("should reject when followUpRequired is true and followUpNote is empty string", () => {
      const res = validateFollowUpNote(true, "");
      expect(res.isValid).toBe(false);
      expect(res.errorCode).toBe("FOLLOWUP_NOTE_REQUIRED");
    });

    it("should reject when followUpRequired is true and followUpNote is whitespace-only", () => {
      const res1 = validateFollowUpNote(true, "   ");
      expect(res1.isValid).toBe(false);
      expect(res1.errorCode).toBe("FOLLOWUP_NOTE_REQUIRED");

      const res2 = validateFollowUpNote(true, "\t\n  \r\n");
      expect(res2.isValid).toBe(false);
      expect(res2.errorCode).toBe("FOLLOWUP_NOTE_REQUIRED");
    });

    it("should accept when followUpRequired is true and followUpNote has non-empty text", () => {
      const res = validateFollowUpNote(true, "Ordered replacement OEM battery from procurement vendor.");
      expect(res.isValid).toBe(true);
      expect(res.errorCode).toBeUndefined();
    });

    it("should accept when followUpRequired is false and followUpNote is omitted, null, or empty", () => {
      expect(validateFollowUpNote(false, undefined).isValid).toBe(true);
      expect(validateFollowUpNote(false, null).isValid).toBe(true);
      expect(validateFollowUpNote(false, "").isValid).toBe(true);
      expect(validateFollowUpNote(false, "   ").isValid).toBe(true);
    });

    it("should accept when followUpRequired is false and followUpNote is non-empty string", () => {
      expect(validateFollowUpNote(false, "Optional informational note").isValid).toBe(true);
    });
  });

  // =========================================================================
  // UNIT-04: Concurrency timestamp comparator helper (BR-17)
  // =========================================================================
  describe("UNIT-04: isConcurrencyStale (BR-17)", () => {
    it("should return false when timestamps match exactly", () => {
      const dbDate = new Date("2026-10-01T10:00:00.000Z");
      expect(isConcurrencyStale("2026-10-01T10:00:00.000Z", dbDate)).toBe(false);
    });

    it("should return true when timestamps mismatch (stale update conflict)", () => {
      const dbDate = new Date("2026-10-01T10:05:00.000Z");
      expect(isConcurrencyStale("2026-10-01T10:00:00.000Z", dbDate)).toBe(true);
    });

    it("should handle null or invalid timestamps safely without crashing", () => {
      const dbDate = new Date("2026-10-01T10:00:00.000Z");
      expect(isConcurrencyStale(null, dbDate)).toBe(false);
      expect(isConcurrencyStale(undefined, dbDate)).toBe(false);
      expect(isConcurrencyStale("invalid-date", dbDate)).toBe(false);
    });
  });

  // =========================================================================
  // Strict ISO 8601 DateTime Validator Unit Tests
  // =========================================================================
  describe("Strict ISO 8601 DateTime Validation (isValidIsoDateTime)", () => {
    it("should accept valid standard ISO 8601 UTC timestamps with Z", () => {
      expect(isValidIsoDateTime("2026-10-09T17:00:00.000Z")).toBe(true);
      expect(isValidIsoDateTime("2026-05-13T16:00:00Z")).toBe(true);
    });

    it("should accept valid ISO 8601 timestamps with timezone offsets", () => {
      expect(isValidIsoDateTime("2026-10-09T23:59:59+07:00")).toBe(true);
      expect(isValidIsoDateTime("2026-10-09T12:00:00-05:00")).toBe(true);
      expect(isValidIsoDateTime("2026-10-09T12:00:00.123+0700")).toBe(true);
    });

    it("should reject non-ISO date formats", () => {
      expect(isValidIsoDateTime("2026/10/09 17:00:00")).toBe(false);
      expect(isValidIsoDateTime("May 13, 2026")).toBe(false);
      expect(isValidIsoDateTime("2026-10-09")).toBe(false); // Date only without time component
      expect(isValidIsoDateTime("10-09-2026T17:00:00Z")).toBe(false);
    });

    it("should reject calendar-impossible dates (month days overflow, non-leap Feb 29, invalid hours/minutes)", () => {
      // February 31 does not exist
      expect(isValidIsoDateTime("2026-02-31T10:00:00.000Z")).toBe(false);
      // April 31 does not exist (April has 30 days)
      expect(isValidIsoDateTime("2026-04-31T10:00:00.000Z")).toBe(false);
      // June 31 does not exist
      expect(isValidIsoDateTime("2026-06-31T10:00:00.000Z")).toBe(false);
      // September 31 does not exist
      expect(isValidIsoDateTime("2026-09-31T10:00:00.000Z")).toBe(false);
      // November 31 does not exist
      expect(isValidIsoDateTime("2026-11-31T10:00:00.000Z")).toBe(false);
      // 2025 is not a leap year (February 29 does not exist)
      expect(isValidIsoDateTime("2025-02-29T10:00:00.000Z")).toBe(false);
      // 2024 IS a leap year (February 29 DOES exist)
      expect(isValidIsoDateTime("2024-02-29T10:00:00.000Z")).toBe(true);
      // Month 0 or 13 does not exist
      expect(isValidIsoDateTime("2026-00-15T10:00:00.000Z")).toBe(false);
      expect(isValidIsoDateTime("2026-13-15T10:00:00.000Z")).toBe(false);
      // Day 0 or 32 does not exist
      expect(isValidIsoDateTime("2026-01-00T10:00:00.000Z")).toBe(false);
      expect(isValidIsoDateTime("2026-01-32T10:00:00.000Z")).toBe(false);
      // Hour 24+ does not exist
      expect(isValidIsoDateTime("2026-01-15T24:00:00.000Z")).toBe(false);
      expect(isValidIsoDateTime("2026-01-15T25:00:00.000Z")).toBe(false);
      // Minute/second 60+ does not exist
      expect(isValidIsoDateTime("2026-01-15T10:60:00.000Z")).toBe(false);
      expect(isValidIsoDateTime("2026-01-15T10:00:60.000Z")).toBe(false);
    });

    it("should reject invalid/garbage inputs and non-strings", () => {
      expect(isValidIsoDateTime("")).toBe(false);
      expect(isValidIsoDateTime("   ")).toBe(false);
      expect(isValidIsoDateTime("invalid-timestamp")).toBe(false);
      expect(isValidIsoDateTime(null)).toBe(false);
      expect(isValidIsoDateTime(undefined)).toBe(false);
      expect(isValidIsoDateTime(123456789)).toBe(false);
      expect(isValidIsoDateTime({})).toBe(false);
    });
  });
});
