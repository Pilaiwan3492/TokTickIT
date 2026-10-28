import { test, expect } from "@playwright/test";
import { resetDatabaseState } from "../helpers/db-reset";
import {
  assertNoHorizontalOverflow,
  assertMinimumTouchTargets,
  assertNoTextClippingOrOverlap,
  captureLab4Screenshot,
} from "../helpers/visual-check";

test.describe("Lab 4 Responsive Viewports & Accessibility Suite (RESP-01..RESP-04)", () => {
  test.beforeEach(async () => {
    await resetDatabaseState();
  });

  test.afterAll(async () => {
    await resetDatabaseState();
  });

  test("RESP-01..RESP-04: Requester Dashboard renders responsively across Desktop, Tablet, and Mobile with zero overflow", async ({
    page,
  }, testInfo) => {
    const proj = testInfo.project.name.toLowerCase();

    // 1. Log in as Requester
    await page.goto("/login");
    await page.fill("#login-email", "bob@example.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard or tickets, then navigate to /dashboard
    await page.waitForLoadState("networkidle");
    await page.goto("/dashboard");
    await page.waitForSelector("h1:has-text('Welcome')");

    // 2. Assert zero horizontal overflow (RESP-04) and no text clipping/overlap (VIS-04)
    await assertNoHorizontalOverflow(page);
    await assertNoTextClippingOrOverlap(page);

    // 3. For Tablet and Mobile, verify touch targets meet minimum 44x44px (RESP-03)
    if (testInfo.project.name === "Tablet" || testInfo.project.name === "Mobile") {
      await assertMinimumTouchTargets(page);
    }

    // 4. Capture screenshot artifact (both canonical naming and subfolder)
    await captureLab4Screenshot(page, `02-requester-dashboard-${proj}.png`);
    await captureLab4Screenshot(page, `requester-dashboard/${proj}.png`);

    // 5. Verify metric cards and drill-down link exist
    const openTicketsLink = page.locator('a[aria-label="View all open tickets"]');
    await expect(openTicketsLink).toBeVisible();

    // 6. Click drill-down and verify destination page has no horizontal overflow
    await openTicketsLink.click();
    await page.waitForURL(/\/my-tickets\?status=open_all/);
    await assertNoHorizontalOverflow(page);
  });

  test("RESP-01..RESP-04: IT Staff Dashboard renders responsively with operational grid and touch target compliance", async ({
    page,
  }, testInfo) => {
    const proj = testInfo.project.name.toLowerCase();

    // 1. Log in as IT Staff
    await page.goto("/login");
    await page.fill("#login-email", "michael.brown@toktickit.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await page.waitForLoadState("networkidle");
    await page.goto("/dashboard");
    await page.waitForSelector("h1:has-text('Welcome back')");

    // 2. Assert zero horizontal overflow (RESP-04) and no text clipping/overlap (VIS-04)
    await assertNoHorizontalOverflow(page);
    await assertNoTextClippingOrOverlap(page);

    // 3. For Tablet and Mobile, verify minimum touch targets (RESP-03)
    if (testInfo.project.name === "Tablet" || testInfo.project.name === "Mobile") {
      await assertMinimumTouchTargets(page);
    }

    // 4. Capture screenshot artifact (both canonical naming and subfolder)
    await captureLab4Screenshot(page, `01-staff-dashboard-${proj}.png`);
    await captureLab4Screenshot(page, `staff-dashboard/${proj}.png`);

    // 5. Verify Staff operational cards and drill-down
    const newTicketsLink = page.locator('a[aria-label="View all new tickets"]');
    await expect(newTicketsLink).toBeVisible();

    // 6. Click drill-down and verify destination page has no horizontal overflow
    await newTicketsLink.click();
    await page.waitForURL(/\/staff\/tickets\?status=NEW/);
    await assertNoHorizontalOverflow(page);
    await assertNoTextClippingOrOverlap(page);
  });

  test("RESP-01..RESP-04 & VIS-04: Ticket Detail with Actions Taken and Modal render responsively with zero overflow and touch target compliance", async ({
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

    // Open ticket TKT-2026-000002
    const ticketLink = page.locator('a:has-text("TKT-2026-000002"):visible').first();
    await expect(ticketLink).toBeVisible();
    await ticketLink.click();
    await page.waitForURL(/\/staff\/tickets\/.+|\/queue\/.+/);

    // Assert zero overflow, no text clipping, and minimum touch targets on detail view
    await assertNoHorizontalOverflow(page);
    await assertNoTextClippingOrOverlap(page);
    if (testInfo.project.name === "Tablet" || testInfo.project.name === "Mobile") {
      await assertMinimumTouchTargets(page);
    }

    // Open Add Action Taken Modal
    const addActionBtn = page.locator('[data-testid="add-action-taken-btn"]');
    await expect(addActionBtn).toBeVisible();
    await addActionBtn.click();

    const modal = page.locator('[data-testid="action-taken-modal"]');
    await expect(modal).toBeVisible();

    // Assert zero overflow and minimum touch targets inside modal
    await assertNoHorizontalOverflow(page);
    await assertNoTextClippingOrOverlap(page, '[data-testid="action-taken-modal"]');
    if (testInfo.project.name === "Tablet" || testInfo.project.name === "Mobile") {
      await assertMinimumTouchTargets(page);
    }

    // Close modal
    await page.click('[aria-label="Close modal"]');
    await expect(modal).not.toBeVisible();
  });

  test("RESP-01..RESP-04 & VIS-04: Administrator Dashboard and User Management render responsively with zero overflow and touch target compliance", async ({
    page,
  }, testInfo) => {
    // 1. Log in as Admin Sarah Johnson
    await page.goto("/login");
    await page.fill("#login-email", "admin@toktickit.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await page.waitForLoadState("networkidle");
    await page.goto("/dashboard");
    await page.waitForSelector("h1:has-text('Welcome back')");

    // Assert zero overflow, no text clipping, and minimum touch targets on Admin Dashboard
    await assertNoHorizontalOverflow(page);
    await assertNoTextClippingOrOverlap(page);
    if (testInfo.project.name === "Tablet" || testInfo.project.name === "Mobile") {
      await assertMinimumTouchTargets(page);
    }

    // Navigate to User Management
    const manageUsersLink = page.locator('a:has-text("Manage Users >")');
    await expect(manageUsersLink).toBeVisible();
    await manageUsersLink.click();
    await page.waitForURL(/\/admin\/users/);

    // Assert zero overflow, no text clipping, and minimum touch targets on User Management
    await assertNoHorizontalOverflow(page);
    await assertNoTextClippingOrOverlap(page);
    if (testInfo.project.name === "Tablet" || testInfo.project.name === "Mobile") {
      await assertMinimumTouchTargets(page);
    }
  });

  test("RESP-01..RESP-04 & VIS-04: Ticket Resolution Gate controls and confirmation modal render responsively with zero overflow and touch target compliance", async ({
    page,
  }, testInfo) => {
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

    // 2. Open Resolution Gate dialog: OPEN -> IN_PROGRESS -> RESOLVED
    const statusSelect = page.locator("#status-select");
    await expect(statusSelect).toBeVisible();
    await statusSelect.selectOption("IN_PROGRESS");
    await page.waitForTimeout(300);

    // Selecting RESOLVED opens the Resolution Gate confirmation modal
    await statusSelect.selectOption("RESOLVED");

    // 3. Assert confirmation modal appears with required content and action buttons
    const resolveModal = page.locator('[data-testid="resolution-gate-modal"]');
    await expect(resolveModal).toBeVisible();
    await expect(page.locator("text=Confirm Ticket Resolution")).toBeVisible();
    const cancelBtn = page.locator('[data-testid="cancel-resolve-btn"]');
    const confirmBtn = page.locator('[data-testid="confirm-resolve-btn"]');
    await expect(cancelBtn).toBeVisible();
    await expect(confirmBtn).toBeVisible();

    // 4. Assert zero horizontal overflow and no text clipping/overlap within modal and page
    await assertNoHorizontalOverflow(page);
    await assertNoTextClippingOrOverlap(page, '[data-testid="resolution-gate-modal"]');
    await assertNoTextClippingOrOverlap(page);

    // 5. Assert touch target compliance for modal controls on touch viewports
    if (testInfo.project.name === "Tablet" || testInfo.project.name === "Mobile") {
      await assertMinimumTouchTargets(page);
    }

    // 6. Confirm resolution and assert ticket transitions to Resolved
    await confirmBtn.click();
    await expect(resolveModal).not.toBeVisible();
    await expect(page.locator("span.badge:has-text('Resolved')").first()).toBeVisible();
  });
});
