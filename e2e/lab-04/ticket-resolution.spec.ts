import { test, expect } from "@playwright/test";
import { resetDatabaseState, getE2EPrisma } from "../helpers/db-reset";
import {
  captureLab4Screenshot,
  assertNoHorizontalOverflow,
  assertMinimumTouchTargets,
} from "../helpers/visual-check";

test.describe("Lab 4 Ticket Resolution & Workflow Suite (E2E-04..E2E-06)", () => {
  test.beforeEach(async () => {
    await resetDatabaseState();
  });

  test.afterAll(async () => {
    await resetDatabaseState();
  });

  // --- E2E-04: Full Resolution Gate flow ---
  test("E2E-04: Full Resolution Gate flow: Requester advisory signal -> IT Staff review -> formal resolution to RESOLVED", async ({
    page,
  }, testInfo) => {
    const proj = testInfo.project.name.toLowerCase();

    // 1. Log in as Requester Bob Smith
    await page.goto("/login");
    await page.fill("#login-email", "bob@example.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await page.waitForLoadState("networkidle");
    await page.goto("/my-tickets");
    await page.waitForSelector("h1:has-text('My Tickets')");

    // Open Bob's open ticket TKT-2026-000002
    const ticketRow = page.getByRole("row").filter({ hasText: "TKT-2026-000002" });
    await expect(ticketRow.first()).toBeVisible();
    await ticketRow.first().getByRole("button", { name: "View" }).click();
    await page.waitForURL(/\/tickets\/.+/);

    await assertNoHorizontalOverflow(page);

    // 2. Requester clicks "Problem Appears Resolved" advisory trigger (FR-10, BR-10, UI-11)
    const resolveIndicatorBtn = page.locator('button:has-text("Problem Appears Resolved")');
    await expect(resolveIndicatorBtn).toBeVisible();
    await resolveIndicatorBtn.click();

    // Verify advisory indicator appears (confirmed by requester)
    const advisoryBadge = page.locator("text=Problem Appears Resolved (Confirmed by Requester)");
    await expect(advisoryBadge).toBeVisible();

    // Capture visual evidence: Requester Advisory Resolution Indicator
    await captureLab4Screenshot(page, `06-requester-resolve-indicator-${proj}.png`);

    // Verify formal ticket status remains OPEN (advisory only, BR-10)
    await expect(page.locator("text=Open").first()).toBeVisible();

    // 3. Clear session and log in as IT Staff Michael Brown
    await page.evaluate(() => localStorage.clear());
    await page.goto("/login");
    await page.waitForSelector("#login-email");
    await page.fill("#login-email", "michael.brown@toktickit.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await page.waitForLoadState("networkidle");
    await page.goto("/staff/tickets");
    const staffTicketLink = page.locator('a:has-text("TKT-2026-000002"):visible').first();
    await staffTicketLink.click();
    await page.waitForURL(/\/staff\/tickets\/.+|\/queue\/.+/);

    // 4. IT Staff verifies Requester advisory notice is displayed
    await expect(
      page.locator("text=Problem Appears Resolved (Indicated by Requester)")
    ).toBeVisible();

    // 5. IT Staff formally transitions ticket from OPEN -> IN_PROGRESS -> RESOLVED via Resolution Gate (FR-11, BR-11, UI-09)
    const statusSelect = page.locator("#status-select");
    await expect(statusSelect).toBeVisible();

    // Transition OPEN -> IN_PROGRESS
    await statusSelect.selectOption("IN_PROGRESS");
    await expect(page.locator("span.badge:has-text('In Progress')").first()).toBeVisible();

    // Capture visual evidence: Resolution Gate controls before transition to RESOLVED
    await captureLab4Screenshot(page, `05-ticket-resolution-gate-${proj}.png`);

    // Transition IN_PROGRESS -> RESOLVED
    await statusSelect.selectOption("RESOLVED");

    // 6. Verify status successfully transitions to Resolved
    await expect(page.locator("span.badge:has-text('Resolved')").first()).toBeVisible();
  });

  // --- E2E-05: Ticket closure and reopen cycle; action logging lock ---
  test("E2E-05: IT Staff closes resolved ticket, verifies terminal lock on actions, and reopens resolved ticket", async ({
    page,
  }) => {
    // 1. Log in as IT Staff Michael Brown
    await page.goto("/login");
    await page.fill("#login-email", "michael.brown@toktickit.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await page.waitForLoadState("networkidle");

    // 2. Open Bob's resolved ticket TKT-2026-000005
    await page.goto("/staff/tickets");
    const resolvedTicketLink = page.locator('a:has-text("TKT-2026-000005"):visible').first();
    await resolvedTicketLink.click();
    await page.waitForURL(/\/staff\/tickets\/.+|\/queue\/.+/);

    await expect(page.locator("span.badge:has-text('Resolved')").first()).toBeVisible();

    // 3. Transition RESOLVED -> CLOSED (AC-13, BR-12)
    const statusSelect = page.locator("#status-select");
    await statusSelect.selectOption("CLOSED");

    // Verify ticket status badge updates to Closed
    await expect(page.locator("span.badge:has-text('Closed')").first()).toBeVisible();

    // 4. Verify Actions Taken creation is locked on CLOSED ticket (AC-07, FR-07, BR-12, UI-08)
    const terminalLockNotice = page.locator('[data-testid="terminal-ticket-lock-notice"]');
    await expect(terminalLockNotice).toBeVisible();
    await expect(terminalLockNotice).toContainText("Actions Taken are locked and read-only");

    const addActionBtn = page.locator('[data-testid="add-action-taken-btn"]');
    await expect(addActionBtn).toBeDisabled();

    // 5. Verify reopen cycle on RESOLVED ticket (AC-14)
    // First reset TKT-2026-000005 back to RESOLVED via DB
    const db = getE2EPrisma();
    await db.ticket.update({
      where: { ticketNo: "TKT-2026-000005" },
      data: { status: "RESOLVED", currentStatus: "RESOLVED" },
    });
    await page.reload();
    await page.waitForSelector("span.badge:has-text('Resolved')");

    // Transition RESOLVED -> REOPENED
    await page.locator("#status-select").selectOption("REOPENED");
    await expect(page.locator("span.badge:has-text('Reopened')").first()).toBeVisible();

    // Verify action logging lock is cleared on REOPENED ticket
    await expect(terminalLockNotice).not.toBeVisible();
    await expect(addActionBtn).toBeEnabled();
  });

  // --- E2E-06: Concurrent edit collision simulation ---
  test("E2E-06: Concurrent edit collision triggers HTTP 409 STALE_UPDATE_CONFLICT and preserves form state", async ({
    page,
  }, testInfo) => {
    const proj = testInfo.project.name.toLowerCase();

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

    const desc = "Diagnosed intermittent DNS timeout on branch workstation.";
    const result = "Updated DNS configuration to use internal recursive resolver.";
    await page.fill("#action-description-input", desc);
    await page.fill("#action-result-input", result);

    // 3. Simulate concurrent update in background: directly bump ticket updatedAt in database (BR-17, AC-12)
    const db = getE2EPrisma();
    await db.ticket.update({
      where: { ticketNo: "TKT-2026-000002" },
      data: { updatedAt: new Date(Date.now() + 5000) },
    });

    // 4. Click Save Action Taken -> sends stale expectedTicketUpdatedAt -> returns HTTP 409
    await page.click('[data-testid="save-action-taken-btn"]');

    // 5. Verify concurrency conflict banner is displayed (UI-13, FR-12)
    const conflictBanner = page.locator('[data-testid="action-modal-error-banner"]');
    await expect(conflictBanner).toBeVisible();
    await expect(conflictBanner).toContainText("Concurrency Conflict Detected (HTTP 409)");

    // Capture visual evidence: Concurrency Conflict banner
    await captureLab4Screenshot(page, `07-concurrency-conflict-banner-${proj}.png`);

    // 6. Verify form inputs are preserved without data loss (BR-18)
    await expect(page.locator("#action-description-input")).toHaveValue(desc);
    await expect(page.locator("#action-result-input")).toHaveValue(result);

    // 7. Click "Refresh Ticket" CTA, then re-save
    const refreshBtn = page.locator('button:has-text("Refresh Ticket")');
    if ((await refreshBtn.count()) > 0) {
      await refreshBtn.click();
      await page.waitForTimeout(500);
      await page.click('[data-testid="save-action-taken-btn"]');
      await expect(modal).not.toBeVisible();
      await expect(page.locator(`text=${desc}`)).toBeVisible();
    }
  });
});
