import { test, expect } from "@playwright/test";
import { resetDatabaseState } from "../helpers/db-reset";
import {
  captureLab4Screenshot,
  assertNoHorizontalOverflow,
  assertMinimumTouchTargets,
} from "../helpers/visual-check";

test.describe("Lab 4 Actions Taken E2E Flow Suite (E2E-01..E2E-03)", () => {
  test.beforeEach(async () => {
    await resetDatabaseState();
  });

  test.afterAll(async () => {
    await resetDatabaseState();
  });

  // --- E2E-01: IT Staff creates and edits Action Taken on open ticket; double-click guard ---
  test("E2E-01: IT Staff creates and edits Action Taken on open ticket with auto-attributed performer and double-click guard", async ({
    page,
  }, testInfo) => {
    // 1. Log in as IT Staff Michael Brown
    await page.goto("/login");
    await page.fill("#login-email", "michael.brown@toktickit.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await page.waitForLoadState("networkidle");
    await page.goto("/staff/tickets");
    await page.waitForSelector("h1:has-text('Ticket Queue')");

    // 2. Open Bob's open ticket TKT-2026-000002
    const ticketLink = page.locator('a:has-text("TKT-2026-000002"):visible').first();
    await expect(ticketLink).toBeVisible();
    await ticketLink.click();

    await page.waitForURL(/\/staff\/tickets\/.+|\/queue\/.+/);
    await expect(page.locator("text=TKT-2026-000002").first()).toBeVisible();

    // Responsive and overflow checks
    await assertNoHorizontalOverflow(page);
    if (testInfo.project.name === "Tablet" || testInfo.project.name === "Mobile") {
      await assertMinimumTouchTargets(page);
    }

    // Capture visual evidence: Ticket Detail Actions Taken section
    const proj = testInfo.project.name.toLowerCase();
    await captureLab4Screenshot(page, `03-ticket-detail-actions-taken-${proj}.png`);
    await captureLab4Screenshot(page, `actions-taken/01-actions-list-${proj}.png`);

    // 3. Click "+ Add Action Taken"
    const addActionBtn = page.locator('[data-testid="add-action-taken-btn"]');
    await expect(addActionBtn).toBeVisible();
    await addActionBtn.click();

    // Verify modal opens and performer is auto-attributed (read-only)
    const modal = page.locator('[data-testid="action-taken-modal"]');
    await expect(modal).toBeVisible();
    const performerInput = page.locator("#action-performed-by-input");
    await expect(performerInput).toHaveValue("Michael Brown");

    // Capture visual evidence: Create Action Taken modal
    await captureLab4Screenshot(page, `04-action-taken-modal-${proj}.png`);
    await captureLab4Screenshot(page, `actions-taken/02-create-modal-${proj}.png`);

    // 4. Fill in Action Description and Result
    const actionDesc = "Inspected local switch ports and re-patched drop cable.";
    const actionResult = "Port link established at 1Gbps full-duplex.";
    await page.fill("#action-description-input", actionDesc);
    await page.fill("#action-result-input", actionResult);

    // 5. Submit form & verify double-click protection (BR-19, UI-26, AC-25)
    let postActionsCount = 0;
    await page.route("**/api/v1/tickets/*/actions-taken", async (route) => {
      if (route.request().method() === "POST") {
        postActionsCount++;
        // Introduce controlled delay to hold the request in-flight for double-click simulation
        await new Promise((resolve) => setTimeout(resolve, 600));
        await route.continue();
      } else {
        await route.continue();
      }
    });

    const saveBtn = page.locator('[data-testid="save-action-taken-btn"]');
    await expect(saveBtn).toBeEnabled();

    // Trigger initial submission
    await saveBtn.click();

    // Verify button immediately transitions to disabled state with loading spinner
    await expect(saveBtn).toBeDisabled();
    await expect(page.locator('[data-testid="save-action-taken-btn"] .spinner-border')).toBeVisible();

    // Simulate immediate rapid double-click while the request is in-flight
    await saveBtn.dispatchEvent("click");
    await saveBtn.dispatchEvent("click");

    // Modal closes upon successful save
    await expect(modal).not.toBeVisible();

    // Verification 1: Exactly 1 POST API request dispatched to the server
    expect(postActionsCount).toBe(1);

    // Remove route interception for subsequent operations
    await page.unroute("**/api/v1/tickets/*/actions-taken");

    // Verification 2: Exactly 1 Action Taken record was created in the UI / database
    const createdActionDesc = page.locator(`text=${actionDesc}`);
    await expect(createdActionDesc).toHaveCount(1);
    await expect(page.locator(`text=${actionResult}`)).toBeVisible();

    // 7. Edit existing Action Taken (AC-06, UI-07)
    const targetEditBtn = page.locator(`button[aria-label="Edit action ${actionDesc}"]:visible`).first();
    await expect(targetEditBtn).toBeVisible();
    await targetEditBtn.click();

    // Verify modal opens in edit mode
    await expect(modal).toBeVisible();
    await expect(page.locator("#action-description-input")).toHaveValue(actionDesc);
    await expect(page.locator("#action-result-input")).toHaveValue(actionResult);

    // Capture visual evidence: Edit Action Taken modal
    await captureLab4Screenshot(page, `actions-taken/03-edit-modal-${proj}.png`);

    // Update Result and save
    const updatedResult = "Port link established at 1Gbps full-duplex with zero CRC errors.";
    await page.fill("#action-result-input", updatedResult);
    await page.click('[data-testid="save-action-taken-btn"]');

    await expect(modal).not.toBeVisible();
    await expect(page.locator(`text=${updatedResult}`)).toBeVisible();
  });

  // --- E2E-02: Follow-up Required validation error & recovery ---
  test("E2E-02: IT Staff checks Follow-up Required without entering note, verifies validation block and note persistence", async ({
    page,
  }) => {
    // 1. Log in as IT Staff Michael Brown
    await page.goto("/login");
    await page.fill("#login-email", "michael.brown@toktickit.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await page.waitForLoadState("networkidle");
    await page.goto("/staff/tickets");
    const ticketLink = page.locator('a:has-text("TKT-2026-000002"):visible').first();
    await ticketLink.click();

    await page.waitForURL(/\/staff\/tickets\/.+|\/queue\/.+/);

    // 2. Open Add Action Taken modal
    await page.click('[data-testid="add-action-taken-btn"]');
    const modal = page.locator('[data-testid="action-taken-modal"]');
    await expect(modal).toBeVisible();

    const desc = "Replaced faulty SFP transceiver on uplink switch.";
    const result = "Link restored but intermittent packet drops seen.";
    await page.fill("#action-description-input", desc);
    await page.fill("#action-result-input", result);

    // 3. Check "Follow-up Required?" checkbox (AC-02, BR-05, UI-02)
    const followUpCheckbox = page.locator("#action-followup-checkbox");
    await followUpCheckbox.check();

    const followUpNoteInput = page.locator("#action-followup-note-input");
    await expect(followUpNoteInput).toBeVisible();

    // 4. Click Save without entering Follow-up note -> blocked by validation
    await page.click('[data-testid="save-action-taken-btn"]');

    const errorMsg = page.locator('[data-testid="error-followup-note"]');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText("Follow-up note is required");

    // Modal remains open and description/result values are preserved (BR-18)
    await expect(modal).toBeVisible();
    await expect(page.locator("#action-description-input")).toHaveValue(desc);
    await expect(page.locator("#action-result-input")).toHaveValue(result);

    // 5. Enter Follow-up Note and save
    const noteText = "Monitor uplink bit error rates for 24 hours and replace fiber patch if drops persist.";
    await followUpNoteInput.fill(noteText);
    await page.click('[data-testid="save-action-taken-btn"]');

    // 6. Verify modal closes and amber Follow-Up pill appears (VIS-02)
    await expect(modal).not.toBeVisible();
    await expect(page.locator(`text=${desc}`)).toBeVisible();
    await expect(page.locator("text=Follow-up Required").first()).toBeVisible();
    await expect(page.locator(`text=${noteText}`)).toBeVisible();
  });

  // --- E2E-03: Requester views owned ticket in read-only mode ---
  test("E2E-03: Requester views owned ticket with multiple Actions Taken in read-only mode without write controls", async ({
    page,
  }, testInfo) => {
    // 1. Log in as Requester Bob Smith
    await page.goto("/login");
    await page.fill("#login-email", "bob@example.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await page.waitForLoadState("networkidle");
    await page.goto("/my-tickets");
    await page.waitForSelector("h1:has-text('My Tickets')");

    // 2. Open Bob's ticket TKT-2026-000002 by finding its row and clicking "View"
    const ticketRow = page.getByRole("row").filter({ hasText: "TKT-2026-000002" });
    await expect(ticketRow.first()).toBeVisible();
    await ticketRow.first().getByRole("button", { name: "View" }).click();

    await page.waitForURL(/\/tickets\/.+/);
    await expect(page.locator("text=TKT-2026-000002")).toBeVisible();

    // Assert zero horizontal overflow
    await assertNoHorizontalOverflow(page);

    // 3. Verify Actions Taken section exists in read-only mode (AC-03, AC-04, BR-07, UI-06)
    await expect(page.locator("text=Actions Taken")).toBeVisible();

    // Verify seed action act-seed-001 content is visible to Requester
    await expect(
      page.locator("text=Verified gateway routing table and pinged remote branch subnet.")
    ).toBeVisible();

    // 4. Verify write controls are STRICTLY ABSENT
    await expect(page.locator('[data-testid="add-action-taken-btn"]')).not.toBeVisible();
    await expect(page.locator('button:has-text("+ Add Action Taken")')).not.toBeVisible();
    await expect(page.locator('[data-testid^="edit-action-btn-"]')).not.toBeVisible();

    // Capture visual evidence: Requester read-only Actions Taken view
    const proj = testInfo.project.name.toLowerCase();
    await captureLab4Screenshot(page, `actions-taken/04-requester-view-${proj}.png`);
  });
});
