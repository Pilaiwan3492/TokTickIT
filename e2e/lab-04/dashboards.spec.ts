import { test, expect } from "@playwright/test";
import { resetDatabaseState } from "../helpers/db-reset";
import { assertNoHorizontalOverflow } from "../helpers/visual-check";

test.describe("Lab 4 Role Dashboards & Drill-down Filters Suite (E2E-07..E2E-09)", () => {
  test.beforeEach(async () => {
    await resetDatabaseState();
  });

  // --- E2E-07: Requester Dashboard Journey & Status Filter Drill-down ---
  test("E2E-07: Requester Dashboard metric cards, drill-down to My Tickets, and live browser filter manipulation", async ({
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
    await expect(page.locator("h1")).toContainText("Welcome, Bob Smith!");

    // Verify 4 metric summary cards exist
    await expect(page.locator("text=My Open Tickets")).toBeVisible();
    await expect(page.locator("text=Waiting for Requester")).toBeVisible();
    await expect(page.locator("text=Resolved").first()).toBeVisible();
    await expect(page.locator("text=Closed").first()).toBeVisible();

    // Verify My Recent Tickets table shows Bob's open ticket
    await expect(page.locator("text=TKT-2026-000002")).toBeVisible();

    // 3. Drill-down: Click "My Open Tickets" link
    const openTicketsLink = page.locator('a[aria-label="View all open tickets"]');
    await openTicketsLink.click();
    await page.waitForURL(/\/my-tickets\?status=open_all/);

    // 4. Verify My Tickets destination page reflects the filter
    const statusSelect = page.locator("select").filter({ hasText: "All Statuses" });
    await expect(statusSelect).toHaveValue("open_all");

    // Open ticket TKT-2026-000002 should be visible; resolved ticket TKT-2026-000005 should be excluded
    await expect(page.locator("text=TKT-2026-000002")).toBeVisible();
    await expect(page.locator("text=TKT-2026-000005")).not.toBeVisible();

    // 5. Query parameters & Filter manipulation: Change filter to "RESOLVED"
    await statusSelect.selectOption("RESOLVED");
    await page.waitForTimeout(500); // allow client fetch
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
  });

  // --- E2E-08: IT Staff Dashboard Journey, Operational Cards, Priority & Ownership Drill-down ---
  test("E2E-08: IT Staff Dashboard operational metrics, priority attention strip, and Queue filter drill-downs", async ({
    page,
  }) => {
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

    // --- Scenario A: Status Drill-down (Click "New") ---
    const newTicketsLink = page.locator('a[aria-label="View all new tickets"]');
    await newTicketsLink.click();
    await page.waitForURL(/\/staff\/tickets\?status=NEW/);

    // Verify StaffTicketQueue status select is pre-set to "NEW"
    const queueStatusSelect = page.locator('select[aria-label="Filter by status"]');
    await expect(queueStatusSelect).toHaveValue("NEW");

    // Verify TKT-2026-000001 (status NEW) is present in the table or responsive card
    await expect(page.locator("a:visible").filter({ hasText: "TKT-2026-000001" })).toBeVisible();

    // --- Scenario B: Priority Drill-down (Click "Urgent") ---
    await page.goto("/dashboard");
    await page.waitForSelector("h1:has-text('Welcome back')");

    const urgentLink = page.locator('a[aria-label="View urgent priority tickets"]');
    await urgentLink.click();
    await page.waitForURL(/\/staff\/tickets\?priority=URGENT/);

    const queuePrioritySelect = page.locator('select[aria-label="Filter by priority"]');
    await expect(queuePrioritySelect).toHaveValue("URGENT");

    // Verify TKT-2026-000003 (URGENT priority) is present
    await expect(page.locator("a:visible").filter({ hasText: "TKT-2026-000003" })).toBeVisible();

    // --- Scenario C: Ownership Drill-down (Click "My Assigned") ---
    await page.goto("/dashboard");
    await page.waitForSelector("h1:has-text('Welcome back')");

    const myAssignedLink = page.locator('a[aria-label="View my assigned tickets"]');
    await myAssignedLink.click();
    await page.waitForURL(/\/staff\/tickets\?ownership=assigned_to_me/);

    // Verify "Assigned to Me" ownership toggle is active
    const assignedToMeBtn = page.locator('button:has-text("Assigned to Me")');
    await expect(assignedToMeBtn).toHaveClass(/btn-success/);

    // Verify Michael's assigned ticket TKT-2026-000002 is present
    await expect(page.locator("a:visible").filter({ hasText: "TKT-2026-000002" })).toBeVisible();

    // --- Scenario D: Filter manipulation on Staff Queue ---
    // Toggle to "Unassigned"
    const unassignedBtn = page.locator('button:has-text("Unassigned")');
    await unassignedBtn.click();
    await page.waitForTimeout(500);

    await expect(unassignedBtn).toHaveClass(/btn-success/);
    await expect(page.locator("a:visible").filter({ hasText: "TKT-2026-000001" })).toBeVisible();
  });

  // --- E2E-09: Administrator Dashboard Journey ---
  test("E2E-09: Administrator Dashboard renders operational metrics plus System User accounts summary panel", async ({
    page,
  }) => {
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

    // 3. Tab through interactive elements and verify focus state
    // Press Tab multiple times to move focus through header and dashboard
    let reachedInteractiveElement = false;
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");
      const activeInfo = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        return {
          tagName: el.tagName,
          ariaLabel: el.getAttribute("aria-label"),
          text: el.textContent?.trim().slice(0, 30),
        };
      });
      if (activeInfo && (activeInfo.tagName === "A" || activeInfo.tagName === "BUTTON")) {
        reachedInteractiveElement = true;
        break;
      }
    }
    expect(reachedInteractiveElement).toBe(true);

    // 4. Specifically target and focus the "View all open tickets" link via keyboard Tab
    const openTicketsLink = page.locator('a[aria-label="View all open tickets"]');
    await openTicketsLink.focus();
    await expect(openTicketsLink).toBeFocused();

    // Verify visible focus outline properties on the focused element
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
