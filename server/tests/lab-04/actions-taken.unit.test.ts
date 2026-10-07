import { describe, it, expect } from "vitest";
import { validateFollowUpNote, isConcurrencyStale } from "../../src/utils/actionValidation.js";

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
});
