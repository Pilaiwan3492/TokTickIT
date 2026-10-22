import { test, expect } from "@playwright/test";
import { resetDatabaseState } from "../helpers/db-reset";
import {
  assertNoHorizontalOverflow,
  assertMinimumTouchTargets,
  captureScreenshot,
} from "../helpers/visual-check";

test.describe("Lab 4 Responsive Viewports & Accessibility Suite (RESP-01..RESP-04)", () => {
  test.beforeEach(async () => {
    await resetDatabaseState();
  });

  test("RESP-01..RESP-04: Requester Dashboard renders responsively across Desktop, Tablet, and Mobile with zero overflow", async ({
    page,
  }, testInfo) => {
    // 1. Log in as Requester
    await page.goto("/login");
    await page.fill("#login-email", "bob@example.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard or tickets, then navigate to /dashboard
    await page.waitForLoadState("networkidle");
    await page.goto("/dashboard");
    await page.waitForSelector("h1:has-text('Welcome')");

    // 2. Assert zero horizontal overflow (RESP-04)
    await assertNoHorizontalOverflow(page);

    // 3. For Tablet and Mobile, verify touch targets meet minimum 44x44px (RESP-03)
    if (testInfo.project.name === "Tablet" || testInfo.project.name === "Mobile") {
      await assertMinimumTouchTargets(page);
    }

    // 4. Capture screenshot artifact
    const screenshotName = `lab-04/requester-dashboard-${testInfo.project.name.toLowerCase()}.png`;
    await captureScreenshot(page, screenshotName);

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
    // 1. Log in as IT Staff
    await page.goto("/login");
    await page.fill("#login-email", "michael.brown@toktickit.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await page.waitForLoadState("networkidle");
    await page.goto("/dashboard");
    await page.waitForSelector("h1:has-text('Welcome back')");

    // 2. Assert zero horizontal overflow (RESP-04)
    await assertNoHorizontalOverflow(page);

    // 3. For Tablet and Mobile, verify minimum touch targets (RESP-03)
    if (testInfo.project.name === "Tablet" || testInfo.project.name === "Mobile") {
      await assertMinimumTouchTargets(page);
    }

    // 4. Capture screenshot artifact
    const screenshotName = `lab-04/staff-dashboard-${testInfo.project.name.toLowerCase()}.png`;
    await captureScreenshot(page, screenshotName);

    // 5. Verify Staff operational cards and drill-down
    const newTicketsLink = page.locator('a[aria-label="View all new tickets"]');
    await expect(newTicketsLink).toBeVisible();

    // 6. Click drill-down and verify destination page has no horizontal overflow
    await newTicketsLink.click();
    await page.waitForURL(/\/staff\/tickets\?status=NEW/);
    await assertNoHorizontalOverflow(page);
  });
});
