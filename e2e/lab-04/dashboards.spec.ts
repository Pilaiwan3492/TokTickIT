import { test, expect } from "@playwright/test";
import { resetDatabaseState, createEmptyRequesterUser } from "../helpers/db-reset";
import {
  assertNoHorizontalOverflow,
  assertMinimumTouchTargets,
  captureLab4Screenshot,
} from "../helpers/visual-check";

test.describe("Lab 4 Role Dashboards & Drill-down Filters Suite (E2E-07..E2E-09)", () => {
  test.beforeEach(async () => {
    await resetDatabaseState();
  });

  test.afterAll(async () => {
    await resetDatabaseState();
  });

  // --- E2E-07: Requester Dashboard Journey & Status Filter Drill-down ---
  test("E2E-07: Requester Dashboard metric cards, drill-down to My Tickets, and live browser filter manipulation", async ({
    page,
  }, testInfo) => {
    const proj = testInfo.project.name.toLowerCase();

    // 1. Log in as Requester Bob Smith
    await page.goto("/login");
    await page.fill("#login-email", "bob@example.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    // 2. Navigate to Requester Dashboard
    await page.waitForLoadState("networkidle");
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toContainText("Welcome, Bob Smith!");

    // Verify 4 metric summary cards exist
    await expect(page.locator("text=My Open Tickets")).toBeVisible();
    await expect(page.locator("text=Waiting for Requester")).toBeVisible();
    await expect(page.locator("text=Resolved").first()).toBeVisible();
    await expect(page.locator("text=Closed").first()).toBeVisible();

    // Verify My Recent Tickets table shows Bob's open ticket
    await expect(page.locator("text=TKT-2026-000002")).toBeVisible();

    // Responsive checks & visual evidence capture
    await assertNoHorizontalOverflow(page);
    if (testInfo.project.name === "Tablet" || testInfo.project.name === "Mobile") {
      await assertMinimumTouchTargets(page);
    }
    await captureLab4Screenshot(page, `02-requester-dashboard-${proj}.png`);
    await captureLab4Screenshot(page, `requester-dashboard/${proj}.png`);

    // Extract and verify exact counts from metric cards before drill-down
    const openCardLocator = page.locator('.card').filter({ hasText: "My Open Tickets" });
    const openCardCountText = (await openCardLocator.locator(".display-6").innerText()).trim();
    const openCardCount = Number(openCardCountText);
    expect(openCardCount).toBe(1);

    const resolvedCardLocator = page.locator('.card').filter({ hasText: "Resolved" });
    const resolvedCardCountText = (await resolvedCardLocator.locator(".display-6").innerText()).trim();
    const resolvedCardCount = Number(resolvedCardCountText);
    expect(resolvedCardCount).toBe(1);

    // 3. Drill-down: Click "My Open Tickets" link
    const openTicketsLink = page.locator('a[aria-label="View all open tickets"]');
    await openTicketsLink.click();
    await page.waitForURL(/\/my-tickets\?status=open_all/);

    // 4. Verify My Tickets destination page reflects the filter and matches metric card count
    const statusSelect = page.locator("select").filter({ hasText: "All Statuses" });
    await expect(statusSelect).toHaveValue("open_all");

    // Total tickets count matches metric card count
    await expect(page.locator(`text=of ${openCardCount} tickets`)).toBeVisible();

    // Open ticket for Bob is visible; resolved ticket is excluded
    await expect(page.locator("text=TKT-2026-000002")).toBeVisible();
    await expect(page.locator("text=TKT-2026-000005")).not.toBeVisible();

    // 5. Query parameters & Filter manipulation: Change filter to "RESOLVED"
    await statusSelect.selectOption("RESOLVED");
    await page.waitForTimeout(500); // allow client fetch
    await expect(page.locator(`text=of ${resolvedCardCount} tickets`)).toBeVisible();
    await expect(page.locator("text=TKT-2026-000005")).toBeVisible();
    await expect(page.locator("text=TKT-2026-000002")).not.toBeVisible();
    // Reset to "All Statuses"
    await statusSelect.selectOption("");
    await page.waitForTimeout(500);
    await expect(page.locator("text=TKT-2026-000002")).toBeVisible();
    await expect(page.locator("text=TKT-2026-000005")).toBeVisible();

    // 6. RBAC: Requester attempting to access Staff Queue is redirected or blocked
    await page.goto("/staff/tickets");
    await page.waitForLoadState("networkidle");
    // ProtectedRoute blocks non-staff users
    await expect(page).not.toHaveURL(/\/staff\/tickets/);

    // 7. Empty State verification for zero-ticket Requester (AC-20, BR-13)
    await createEmptyRequesterUser();
    await page.evaluate(() => localStorage.clear());
    await page.goto("/login");
    await page.fill("#login-email", "empty.requester@example.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await page.waitForLoadState("networkidle");
    await page.goto("/dashboard");
    await page.waitForSelector("h1:has-text('Welcome, Empty Requester!')");

    // Verify all 4 metric cards show 0
    const zeroMetrics = page.locator(".display-6");
    await expect(zeroMetrics.nth(0)).toHaveText("0");
    await expect(zeroMetrics.nth(1)).toHaveText("0");
    await expect(zeroMetrics.nth(2)).toHaveText("0");
    await expect(zeroMetrics.nth(3)).toHaveText("0");

    // Verify Zero Ticket Empty State container renders with CTA button
    await expect(page.locator("text=You haven't submitted any tickets yet")).toBeVisible();
    await expect(page.locator("text=Need assistance with hardware, software, or network access?")).toBeVisible();
    const createBtn = page.locator('a:has-text("+ Create Ticket")');
    await expect(createBtn).toBeVisible();
    await expect(createBtn).toHaveAttribute("href", "/create-ticket");
  });

  // --- E2E-08: IT Staff Dashboard Journey, Operational Cards, Priority & Ownership Drill-down ---
  test("E2E-08: IT Staff Dashboard operational metrics, priority attention strip, and Queue filter drill-downs", async ({
    page,
  }, testInfo) => {
    const proj = testInfo.project.name.toLowerCase();

    // 1. Log in as IT Staff Michael Brown
    await page.goto("/login");
    await page.fill("#login-email", "michael.brown@toktickit.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    // 2. Navigate to Dashboard
    await page.waitForLoadState("networkidle");
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toContainText("Welcome back, Michael Brown!");

    // Verify operational metric cards
    await expect(page.locator("text=New").first()).toBeVisible();
    await expect(page.locator("text=Open").first()).toBeVisible();
    await expect(page.locator("text=In Progress").first()).toBeVisible();
    await expect(page.locator("text=Waiting Req").first()).toBeVisible();
    await expect(page.locator("text=My Assigned").first()).toBeVisible();
    await expect(page.locator("text=Unassigned").first()).toBeVisible();

    // Verify Priority Attention Strip
    await expect(page.locator("text=Attention Required:")).toBeVisible();

    // Responsive checks & visual evidence capture
    await assertNoHorizontalOverflow(page);
    if (testInfo.project.name === "Tablet" || testInfo.project.name === "Mobile") {
      await assertMinimumTouchTargets(page);
    }
    await captureLab4Screenshot(page, `01-staff-dashboard-${proj}.png`);
    await captureLab4Screenshot(page, `staff-dashboard/${proj}.png`);

    // Extract and verify exact counts from metric cards
    const newCardCountText = (await page.locator('.card').filter({ hasText: "New" }).locator(".h2").first().innerText()).trim();
    const newCardCount = Number(newCardCountText);
    expect(newCardCount).toBe(1);

    const urgentBadgeCountText = (await page.locator('a[aria-label="View urgent priority tickets"]').innerText()).match(/\d+/)?.[0] ?? "1";
    const urgentCardCount = Number(urgentBadgeCountText);
    expect(urgentCardCount).toBe(1);

    const myAssignedCountText = (await page.locator('.card').filter({ hasText: "My Assigned" }).locator(".h2").first().innerText()).trim();
    const myAssignedCount = Number(myAssignedCountText);
    expect(myAssignedCount).toBe(2);

    const unassignedCountText = (await page.locator('.card').filter({ hasText: "Unassigned" }).locator(".h2").first().innerText()).trim();
    const unassignedCount = Number(unassignedCountText);
    expect(unassignedCount).toBe(1);

    // --- Scenario A: Status Drill-down (Click "New") ---
    const newTicketsLink = page.locator('a[aria-label="View all new tickets"]');
    await newTicketsLink.click();
    await page.waitForURL(/\/staff\/tickets\?status=NEW/);

    // Verify StaffTicketQueue status select is pre-set to "NEW"
    const queueStatusSelect = page.locator('select[aria-label="Filter by status"]');
    await expect(queueStatusSelect).toHaveValue("NEW");

    // Verify queue displays matching total count and filtered ticket
    await expect(page.locator(`text=of ${newCardCount} tickets`)).toBeVisible();
    await expect(page.locator("a:visible").filter({ hasText: "TKT-2026-000001" })).toBeVisible();
    // Negative assertion: non-new tickets must not appear
    await expect(page.locator("a:visible").filter({ hasText: "TKT-2026-000002" })).not.toBeVisible();
    await expect(page.locator("a:visible").filter({ hasText: "TKT-2026-000003" })).not.toBeVisible();

    // --- Scenario B: Priority Drill-down (Click "Urgent") ---
    await page.goto("/dashboard");
    await page.waitForSelector("h1:has-text('Welcome back')");

    const urgentLink = page.locator('a[aria-label="View urgent priority tickets"]');
    await urgentLink.click();
    await page.waitForURL(/\/staff\/tickets\?priority=URGENT/);

    const queuePrioritySelect = page.locator('select[aria-label="Filter by priority"]');
    await expect(queuePrioritySelect).toHaveValue("URGENT");

    // Verify queue displays matching total count and filtered ticket
    await expect(page.locator(`text=of ${urgentCardCount} tickets`)).toBeVisible();
    await expect(page.locator("a:visible").filter({ hasText: "TKT-2026-000003" })).toBeVisible();
    // Negative assertion: non-urgent tickets must not appear
    await expect(page.locator("a:visible").filter({ hasText: "TKT-2026-000001" })).not.toBeVisible();
    await expect(page.locator("a:visible").filter({ hasText: "TKT-2026-000002" })).not.toBeVisible();

    // --- Scenario C: Ownership Drill-down (Click "My Assigned") ---
    await page.goto("/dashboard");
    await page.waitForSelector("h1:has-text('Welcome back')");

    const myAssignedLink = page.locator('a[aria-label="View my assigned tickets"]');
    await myAssignedLink.click();
    await page.waitForURL(/\/staff\/tickets\?ownership=assigned_to_me/);

    // Verify "Assigned to Me" ownership toggle is active and total count matches metric card
    const assignedToMeBtn = page.locator('button:has-text("Assigned to Me")');
    await expect(assignedToMeBtn).toHaveClass(/btn-success/);
    await expect(page.locator(`text=of ${myAssignedCount} tickets`)).toBeVisible();
    await expect(page.locator("a:visible").filter({ hasText: "TKT-2026-000002" })).toBeVisible();
    await expect(page.locator("a:visible").filter({ hasText: "TKT-2026-000005" })).toBeVisible();
    // Negative assertion: unassigned or other staff tickets must not appear
    await expect(page.locator("a:visible").filter({ hasText: "TKT-2026-000001" })).not.toBeVisible();
    await expect(page.locator("a:visible").filter({ hasText: "TKT-2026-000003" })).not.toBeVisible();

    // --- Scenario D: Ownership Drill-down (Click "Unassigned") ---
    await page.goto("/dashboard");
    await page.waitForSelector("h1:has-text('Welcome back')");

    const unassignedLink = page.locator('a[aria-label="View unassigned tickets"]');
    await unassignedLink.click();
    await page.waitForURL(/\/staff\/tickets\?ownership=unassigned/);

    const unassignedBtn = page.locator('button:has-text("Unassigned")');
    await expect(unassignedBtn).toHaveClass(/btn-success/);

    // Verify active unassigned ticket (TKT-2026-000001) is present in queue
    await expect(page.locator("a:visible").filter({ hasText: "TKT-2026-000001" })).toBeVisible();
    // Negative assertion: assigned tickets must not appear
    await expect(page.locator("a:visible").filter({ hasText: "TKT-2026-000002" })).not.toBeVisible();
    await expect(page.locator("a:visible").filter({ hasText: "TKT-2026-000003" })).not.toBeVisible();

    // Verify total unassigned tickets in queue is at least the active unassigned count
    const queueText = await page.locator("p.text-secondary.small").filter({ hasText: "tickets" }).innerText();
    const match = queueText.match(/of (\d+) tickets/);
    const totalInQueue = Number(match?.[1] ?? "0");
    expect(totalInQueue).toBeGreaterThanOrEqual(unassignedCount);

    // Filter status to "NEW" to strictly isolate active unassigned ticket and match Unassigned Card count directly
    await page.selectOption('select[aria-label="Filter by status"]', "NEW");
    await expect(page.locator(`text=of ${unassignedCount} tickets`)).toBeVisible();
    await expect(page.locator("a:visible").filter({ hasText: "TKT-2026-000001" })).toBeVisible();
    await expect(page.locator("a:visible").filter({ hasText: "TKT-2026-000002" })).not.toBeVisible();
  });

  // --- E2E-09: Administrator Dashboard Journey ---
  test("E2E-09: Administrator Dashboard renders operational metrics plus System User accounts summary panel", async ({
    page,
  }, testInfo) => {
    const proj = testInfo.project.name.toLowerCase();

    // 1. Log in as Administrator Sarah Johnson
    await page.goto("/login");
    await page.fill("#login-email", "admin@toktickit.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    // 2. Navigate to Dashboard
    await page.waitForLoadState("networkidle");
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toContainText("Welcome back");

    // 3. Verify Admin System Overview Panel is visible
    await expect(page.locator("text=Admin System Overview")).toBeVisible();
    await expect(page.locator("text=Active Users:")).toBeVisible();
    await expect(page.locator("text=Active Staff:")).toBeVisible();
    await expect(page.locator("text=Active Admins:")).toBeVisible();

    // Responsive checks & visual evidence capture
    await assertNoHorizontalOverflow(page);
    if (testInfo.project.name === "Tablet" || testInfo.project.name === "Mobile") {
      await assertMinimumTouchTargets(page);
    }
    await captureLab4Screenshot(page, `08-admin-dashboard-${proj}.png`);
    await captureLab4Screenshot(page, `admin-dashboard/${proj}.png`);

    // 4. Verify Manage Users navigation link works
    const manageUsersLink = page.locator('a:has-text("Manage Users >")');
    await expect(manageUsersLink).toBeVisible();
    await manageUsersLink.click();

    await page.waitForURL(/\/admin\/users/);
    await expect(page.locator("h1")).toContainText("User Management");
  });

  // --- Accessibility: Keyboard Navigation & Visible Focus Rings (VIS-03, FR-20) ---
  test("VIS-03 & A11Y: Keyboard navigation via Tab displays visible focus ring (#0B7A46) on interactive elements", async ({
    page,
  }) => {
    // 1. Log in as Requester Bob Smith
    await page.goto("/login");
    await page.fill("#login-email", "bob@example.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    // 2. Navigate to Requester Dashboard
    await page.waitForLoadState("networkidle");
    await page.goto("/dashboard");
    await page.waitForSelector("h1:has-text('Welcome')");

    // 3. Tab continuously through the page without calling .focus() directly
    // until we reach the target "View all open tickets" link
    const openTicketsLink = page.locator('a[aria-label="View all open tickets"]');
    let reachedTargetViaTab = false;

    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      const isTarget = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.getAttribute("aria-label") === "View all open tickets";
      });
      if (isTarget) {
        reachedTargetViaTab = true;
        break;
      }
    }

    expect(reachedTargetViaTab).toBe(true);
    await expect(openTicketsLink).toBeFocused();

    // 4. Verify visible focus outline properties on the focused element (:focus-visible)
    const outlineInfo = await openTicketsLink.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return {
        outlineStyle: s.outlineStyle,
        outlineColor: s.outlineColor,
        outlineWidth: s.outlineWidth,
      };
    });
    expect(outlineInfo.outlineStyle).toBe("solid");
    expect(outlineInfo.outlineColor).toBe("rgb(11, 122, 70)"); // #0B7A46
    expect(outlineInfo.outlineWidth).toBe("2px");

    // 5. Navigate via Enter key on the focused link
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/my-tickets\?status=open_all/);
    await expect(page.locator("h1")).toContainText("My Tickets");
  });
});
