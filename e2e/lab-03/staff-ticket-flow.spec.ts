import { test, expect } from "@playwright/test";
import { resetDatabaseState } from "../helpers/db-reset";
import { captureScreenshot, assertNoHorizontalOverflow } from "../helpers/visual-check";

test.describe("IT Staff Ticket Queue & Workflow Suite", () => {
  test.beforeEach(async () => {
    await resetDatabaseState();
  });

  test("E2E-05: IT Staff Queue search, filters, claim ticket, and independent IT priority", async ({
    page,
  }, testInfo) => {
    // 1. Log in as IT Staff (Michael Brown)
    await page.goto("/login");
    await page.fill("#login-email", "michael.brown@toktickit.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/queue/);
    await expect(page.locator("h1")).toContainText("Ticket Queue");
    const tkt1Link = page.locator('a:has-text("TKT-2026-000001"):visible');
    await expect(tkt1Link).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // Capture responsive visual evidence of Queue
    if (testInfo.project.name === "Desktop") {
      await captureScreenshot(page, "staff-queue/04-queue-desktop.png");
    } else if (testInfo.project.name === "Tablet") {
      await captureScreenshot(page, "staff-queue/04-queue-tablet.png");
    } else if (testInfo.project.name === "Mobile") {
      await captureScreenshot(page, "staff-queue/04-queue-mobile.png");
    }

    // 2. Filter by Status and Priority dropdowns
    const statusFilter = page.locator('select[aria-label="Filter by status"]');
    const priorityFilter = page.locator('select[aria-label="Filter by priority"]');

    // Filter by Status: NEW
    await statusFilter.selectOption("NEW");
    await page.waitForTimeout(400);
    await expect(page.locator('a:has-text("TKT-2026-000001"):visible')).toBeVisible();

    // Filter by Priority: MEDIUM
    await priorityFilter.selectOption("MEDIUM");
    await page.waitForTimeout(400);
    await expect(page.locator('a:has-text("TKT-2026-000001"):visible')).toBeVisible();

    // Reset Status and Priority filters
    await statusFilter.selectOption("");
    await priorityFilter.selectOption("");
    await page.waitForTimeout(400);

    // 3. Filter by Ownership: Click 'Unassigned'
    await page.click('button:has-text("Unassigned")');
    await page.waitForTimeout(500); // allow filter to apply
    await expect(page.locator('a:has-text("TKT-2026-000001"):visible')).toBeVisible();

    if (testInfo.project.name === "Desktop") {
      await captureScreenshot(page, "staff-queue/05-queue-filter-unassigned.png");
    }

    // 3. Search by ticket number / keyword
    const searchInput = page.locator('input[aria-label="Search tickets"]');
    await searchInput.fill("battery");
    await page.waitForTimeout(400); // debounce 300ms
    await expect(page.locator('a:has-text("TKT-2026-000001"):visible')).toBeVisible();

    // 4. Open Ticket Detail for TKT-2026-000001
    await page.locator('a:has-text("TKT-2026-000001"):visible').click();
    await expect(page).toHaveURL(/\/queue\/.+/);
    await expect(page.getByText("TKT-2026-000001").first()).toBeVisible();
    await assertNoHorizontalOverflow(page);

    if (testInfo.project.name === "Desktop") {
      await captureScreenshot(page, "staff-ticket-detail/06-ticket-detail-desktop.png");
    } else if (testInfo.project.name === "Mobile") {
      await captureScreenshot(page, "staff-ticket-detail/06-ticket-detail-mobile.png");
    }

    // 5. Claim Ticket (Assign Owner to current staff: Michael Brown)
    const ownerSelect = page.locator("#owner-select");
    await expect(ownerSelect).toBeVisible();

    const claimBtn = page.locator('button:has-text("Claim Ticket")');
    if (await claimBtn.isVisible()) {
      await claimBtn.click();
    } else {
      const michaelOption = await ownerSelect
        .locator("option")
        .filter({ hasText: /Michael Brown/i })
        .first()
        .getAttribute("value");
      expect(michaelOption).toBeTruthy();
      await ownerSelect.selectOption(michaelOption!);
    }

    // Verify owner select reflects Michael Brown
    await expect(ownerSelect.locator("option:checked")).toContainText("Michael Brown");

    // 6. Update IT Priority independently (Requested: MEDIUM -> IT Priority: URGENT)
    const itPrioritySelect = page.locator("#it-priority-select");
    await expect(itPrioritySelect).toBeVisible();
    await itPrioritySelect.selectOption("URGENT");

    await expect(itPrioritySelect).toHaveValue("URGENT");
    // Verify Requested Priority label remains Req: MEDIUM
    await expect(page.locator("label[for='it-priority-select']")).toContainText("Req: MEDIUM");
  });

  test("E2E-06: Strict status transition lifecycle (NEW -> OPEN -> IN_PROGRESS -> RESOLVED)", async ({
    page,
  }, testInfo) => {
    // 1. Log in as IT Staff (Michael Brown)
    await page.goto("/login");
    await page.fill("#login-email", "michael.brown@toktickit.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    // 2. Open Ticket 1 (which starts at status NEW)
    await expect(page).toHaveURL(/\/queue/);
    await expect(page.locator('a:has-text("TKT-2026-000001"):visible')).toBeVisible();
    await page.locator('a:has-text("TKT-2026-000001"):visible').click();
    await expect(page.getByText("TKT-2026-000001").first()).toBeVisible();

    const statusSelect = page.locator("#status-select");
    await expect(statusSelect).toBeVisible();

    // Verify initial status is NEW
    await expect(statusSelect).toHaveValue("NEW");

    // Verify permitted transitions per BR-16: NEW can only transition to OPEN or CANCELLED
    const optionsText = await statusSelect.locator("option").allTextContents();
    expect(optionsText.some((t) => t.includes("Open"))).toBe(true);
    expect(optionsText.some((t) => t.includes("Cancelled"))).toBe(true);
    expect(optionsText.some((t) => t.includes("Resolved"))).toBe(false);
    expect(optionsText.some((t) => t.includes("Closed"))).toBe(false);

    if (testInfo.project.name === "Desktop") {
      await captureScreenshot(page, "staff-ticket-detail/08-status-transition-dropdown.png");
    }

    // Step 1: Transition NEW -> OPEN
    await statusSelect.selectOption("OPEN");
    await expect(statusSelect).toHaveValue("OPEN");

    // Step 2: Transition OPEN -> IN_PROGRESS
    await statusSelect.selectOption("IN_PROGRESS");
    await expect(statusSelect).toHaveValue("IN_PROGRESS");

    // Step 3: Transition IN_PROGRESS -> RESOLVED
    await statusSelect.selectOption("RESOLVED");
    await expect(statusSelect).toHaveValue("RESOLVED");

    // Step 4: Reload page to verify status persistence in database
    await page.reload();
    await expect(page.locator("#status-select")).toHaveValue("RESOLVED");
  });

  test("E2E-07: Public Comments & Private Internal Notes role boundary and zero leakage", async ({
    page,
  }, testInfo) => {
    // 1. Requester (Jennifer Anderson) logs in and posts a Public Comment on her ticket TKT-2026-000003
    await page.goto("/login");
    await page.fill("#login-email", "jennifer.anderson@example.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/tickets/);
    const row = page.locator('tr').filter({ hasText: "TKT-2026-000003" });
    await expect(row).toBeVisible();
    await row.locator('button:has-text("View")').click();
    await expect(page.getByText("TKT-2026-000003").first()).toBeVisible();

    // Fill and submit Public Comment
    const commentInput = page.locator('textarea[placeholder*="Write a comment"]');
    await commentInput.fill("E2E Public comment from Requester: System diagnostic completed.");
    await page.click('button:has-text("Post Comment")');

    await expect(
      page.locator("text=E2E Public comment from Requester: System diagnostic completed.")
    ).toBeVisible();

    // Sign out Requester
    await page.click('header button[aria-haspopup="true"]');
    await page.click('header button:has-text("Sign Out")');
    await expect(page).toHaveURL(/\/login/);

    // 2. IT Staff (Michael Brown) logs in, views Public Comment, and posts Private Internal Note
    await page.fill("#login-email", "michael.brown@toktickit.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/queue/);
    await expect(page.locator('a:has-text("TKT-2026-000003"):visible')).toBeVisible();
    await page.locator('a:has-text("TKT-2026-000003"):visible').click();
    await expect(page.getByText("TKT-2026-000003").first()).toBeVisible();

    // Verify Public Comment is visible to IT Staff
    await expect(
      page.locator("text=E2E Public comment from Requester: System diagnostic completed.")
    ).toBeVisible();

    // Switch to Internal Notes Tab
    await page.click('button:has-text("Internal Notes")');
    const amberNotice = page.locator("text=Internal Notes are private and never visible to the ticket Requester.");
    await expect(amberNotice).toBeVisible();

    if (testInfo.project.name === "Desktop") {
      await captureScreenshot(page, "staff-ticket-detail/07-internal-notes-amber-theme.png");
    }

    // Post an Internal Note
    const noteInput = page.locator("#staff-note-input");
    await noteInput.fill("E2E Confidential Staff Note: Root cause identified on load balancer SSL.");
    await page.click('button:has-text("Add Internal Note")');

    await expect(
      page.locator("text=E2E Confidential Staff Note: Root cause identified on load balancer SSL.")
    ).toBeVisible();

    // Sign out IT Staff
    await page.click('header button[aria-haspopup="true"]');
    await page.click('header button:has-text("Sign Out")');
    await expect(page).toHaveURL(/\/login/);

    // 3. Requester (Jennifer Anderson) logs back in: Verify zero data leakage
    await page.fill("#login-email", "jennifer.anderson@example.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/tickets/);
    const row2 = page.locator('tr').filter({ hasText: "TKT-2026-000003" });
    await expect(row2).toBeVisible();
    await row2.locator('button:has-text("View")').click();
    await expect(page.getByText("TKT-2026-000003").first()).toBeVisible();

    // Assert Public Comment is visible
    await expect(
      page.locator("text=E2E Public comment from Requester: System diagnostic completed.")
    ).toBeVisible();

    // Assert Internal Notes tab DOES NOT EXIST on Requester page
    await expect(page.locator("text=Internal Notes")).not.toBeVisible();
    await expect(page.locator("text=Private Notes")).not.toBeVisible();

    // Assert the text of the internal note does NOT leak into DOM
    await expect(
      page.locator("text=E2E Confidential Staff Note: Root cause identified on load balancer SSL.")
    ).not.toBeVisible();
  });
});
