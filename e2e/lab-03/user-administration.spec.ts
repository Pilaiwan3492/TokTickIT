import { test, expect } from "@playwright/test";
import { resetDatabaseState } from "../helpers/db-reset";
import {
  captureScreenshot,
  assertNoHorizontalOverflow,
  assertMinimumTouchTargets,
} from "../helpers/visual-check";

test.describe("User Administration & Ticket Provisioning Suite", () => {
  test.beforeEach(async () => {
    await resetDatabaseState();
  });

  test("E2E-08: Admin creates a new user, user logs in, forced to change password, and accesses role home", async ({
    page,
  }, testInfo) => {
    // 1. Log in as Administrator (John Smith)
    await page.goto("/login");
    await page.fill("#login-email", "admin@toktickit.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/queue/);
    await page.click('header a:has-text("User Management")');
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.locator("h1")).toContainText("User Management");
    await assertNoHorizontalOverflow(page);

    // Responsive evidence: User Management view
    if (testInfo.project.name === "Desktop") {
      await captureScreenshot(page, "user-management/09-user-management-desktop.png");
    } else if (testInfo.project.name === "Tablet") {
      await captureScreenshot(page, "user-management/09-user-management-tablet.png");
    } else if (testInfo.project.name === "Mobile") {
      await captureScreenshot(page, "user-management/09-user-management-mobile.png");
    }

    if (testInfo.project.name === "Tablet" || testInfo.project.name === "Mobile") {
      await assertMinimumTouchTargets(page);
    }

    // 2. Search & Role Filter validation
    const searchInput = page.locator('[data-testid="admin-user-search-input"]');
    const roleFilter = page.locator('[data-testid="admin-role-filter-select"]');

    // Filter by IT Staff
    await roleFilter.selectOption("IT_STAFF");
    await page.waitForTimeout(400);
    await expect(page.locator('text="Michael Brown"').filter({ visible: true }).first()).toBeVisible();
    await expect(page.locator('text="Bob Smith"').filter({ visible: true })).not.toBeVisible();

    // Reset role filter
    await roleFilter.selectOption("");
    await page.waitForTimeout(400);
    await expect(page.locator('text="Bob Smith"').filter({ visible: true }).first()).toBeVisible();

    // Search by name
    await searchInput.fill("Michael");
    await page.waitForTimeout(400); // debounce 300ms
    await expect(page.locator('text="Michael Brown"').filter({ visible: true }).first()).toBeVisible();
    await expect(page.locator('text="Bob Smith"').filter({ visible: true })).not.toBeVisible();

    // Clear search
    await searchInput.fill("");
    await page.waitForTimeout(400);

    // 3. Open Create User Modal
    await page.locator('[data-testid="btn-open-create-user"]').click();
    await expect(page.locator('[data-testid="admin-create-user-modal"]')).toBeVisible();

    // Responsive evidence: Create User Modal
    if (testInfo.project.name === "Desktop") {
      await captureScreenshot(page, "user-management/10-create-user-modal.png");
    } else if (testInfo.project.name === "Tablet") {
      await captureScreenshot(page, "user-management/10-create-user-modal-tablet.png");
    }

    if (testInfo.project.name === "Tablet" || testInfo.project.name === "Mobile") {
      await assertMinimumTouchTargets(page);
    }

    // 4. Provision new IT Staff user
    await page.fill('[data-testid="input-create-name"]', "New IT Staff");
    await page.fill('[data-testid="input-create-email"]', "new.itstaff@toktickit.com");
    await page.selectOption('[data-testid="select-create-role"]', "IT_STAFF");
    await page.fill('[data-testid="input-create-password"]', "InitialTempPass123!");

    // Verify complexity checklist marks are all met
    const checklist = page.locator('[data-testid="create-password-checklist"]');
    await expect(checklist).toContainText("✓ At least 8 characters");
    await expect(checklist).toContainText("✓ Both uppercase and lowercase letters");
    await expect(checklist).toContainText("✓ At least 1 number and 1 special symbol");

    // Submit Create User form
    await page.locator('[data-testid="btn-submit-create-user"]').click();

    // Verify modal closes and success message appears
    await expect(page.locator('[data-testid="admin-create-user-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="admin-success-alert"]')).toContainText(
      "created successfully"
    );
    await expect(page.locator('[data-testid="admin-success-alert"]')).toContainText(
      "New IT Staff"
    );

    // Verify user is rendered with Password Reset Required badge
    await expect(
      page.locator('text="new.itstaff@toktickit.com"').filter({ visible: true }).first()
    ).toBeVisible();
    await expect(
      page.locator('text="Password Reset Required"').filter({ visible: true }).first()
    ).toBeVisible();

    // 5. Sign out Admin
    await page.click('header button[aria-haspopup="true"]');
    await page.click('header button:has-text("Sign Out")');
    await expect(page).toHaveURL(/\/login/);

    // 6. First sign-in by newly created IT Staff user
    await page.fill("#login-email", "new.itstaff@toktickit.com");
    await page.fill("#login-password", "InitialTempPass123!");
    await page.click('button[type="submit"]');

    // Verify mandatory redirect to /change-password
    await expect(page).toHaveURL(/\/change-password/);
    await expect(page.locator("h1")).toContainText("Change Your Password");
    await expect(
      page.locator('text="You must change your password to continue."')
    ).toBeVisible();

    // Attempt direct URL tampering to bypass mandatory change
    await page.goto("/queue");
    await expect(page).toHaveURL(/\/change-password/);

    // 7. Complete password change
    await page.fill("#current-password", "InitialTempPass123!");
    await page.fill("#new-password", "PermanentPass123!");
    await page.fill("#confirm-password", "PermanentPass123!");
    await page.click('button[type="submit"]');

    // Verify redirect to IT Staff landing page (/queue) with active session
    await expect(page).toHaveURL(/\/queue/);
    await expect(page.locator("header")).toContainText("New IT Staff");
    await expect(page.locator("header")).toContainText("IT Staff");
    await expect(page.locator('header a:has-text("Ticket Queue")')).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test("E2E-09: Admin self-deactivation & last active admin protection guards", async ({
    page,
  }, testInfo) => {
    // 1. Log in as Administrator (John Smith)
    await page.goto("/login");
    await page.fill("#login-email", "admin@toktickit.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/queue/);
    await page.click('header a:has-text("User Management")');
    await expect(page).toHaveURL(/\/admin\/users/);

    // 2. Open Edit Modal for John Smith (current logged-in admin)
    const adminRowOrCard = page
      .locator('[data-testid^="user-row-"], [data-testid^="user-card-"]')
      .filter({ hasText: "John Smith" })
      .filter({ visible: true })
      .first();

    await adminRowOrCard.locator('button:has-text("Edit")').click();
    await expect(page.locator('[data-testid="admin-edit-user-modal"]')).toBeVisible();

    // 3. Verify Self-Deactivation Guard
    const activeSwitch = page.locator('[data-testid="switch-edit-active"]');
    await expect(activeSwitch).toBeDisabled();

    const selfDeactNotice = page.locator('[data-testid="self-deactivation-notice"]');
    await expect(selfDeactNotice).toBeVisible();
    await expect(selfDeactNotice).toContainText("CANNOT_DEACTIVATE_SELF");

    // Responsive evidence: Self-deactivation guard disabled
    if (testInfo.project.name === "Desktop") {
      await captureScreenshot(page, "user-management/11-self-deactivation-guard-disabled.png");
    } else if (testInfo.project.name === "Tablet") {
      await captureScreenshot(page, "user-management/11-self-deactivation-guard-disabled-tablet.png");
    }

    if (testInfo.project.name === "Tablet" || testInfo.project.name === "Mobile") {
      await assertMinimumTouchTargets(page);
    }

    // 4. Verify Last Active Admin Protection Guard
    const lastAdminNotice = page.locator('[data-testid="last-admin-guard-notice"]');
    await expect(lastAdminNotice).toBeVisible();
    await expect(lastAdminNotice).toContainText("LAST_ACTIVE_ADMIN_PROTECTED");

    // 5. Cancel and close modal
    await page.locator('[data-testid="admin-edit-user-modal"] button:has-text("Cancel")').click();
    await expect(page.locator('[data-testid="admin-edit-user-modal"]')).not.toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test("E2E-10: Requester creates a ticket, IT Staff / Admin sees it in queue and unassigned", async ({
    page,
  }) => {
    // 1. Log in as Requester (Bob Smith)
    await page.goto("/login");
    await page.fill("#login-email", "bob@example.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/tickets/);

    // 2. Navigate to Create Ticket page
    await page.click('header a:has-text("Create Ticket")');
    await expect(page).toHaveURL(/\/create-ticket/);
    await expect(page.locator("h1")).toContainText("Create New Ticket");
    await assertNoHorizontalOverflow(page);

    // 3. Fill ticket creation form
    await page
      .locator("select")
      .filter({ hasText: "Select Category" })
      .selectOption({ label: "Hardware" });

    await page
      .locator("select")
      .filter({ hasText: "Select Related System" })
      .selectOption({ label: "Finance & Accounting" });

    await page
      .locator("select")
      .filter({ hasText: "MEDIUM" })
      .selectOption("HIGH");

    await page
      .locator('input[placeholder*="Brief summary"]')
      .fill("[E2E] Hardware display failure in workstation 12");

    await page
      .locator('textarea[placeholder*="Detailed description"]')
      .fill(
        "Dual monitor setup is not receiving signal after system update. Need technician assistance."
      );

    // 4. Submit ticket
    await page.locator('button[type="submit"]:has-text("Create Ticket")').click();

    // 5. Verify success view and capture generated Ticket Number
    await expect(page.getByText("Ticket Created Successfully!")).toBeVisible();
    const tktNoLocator = page.locator("text=/TKT-2026-\\d+/");
    await expect(tktNoLocator).toBeVisible();
    const ticketNo = (await tktNoLocator.innerText()).trim();
    expect(ticketNo).toMatch(/^TKT-2026-\d{6}$/);

    // 6. Sign out Requester
    await page.click('header button[aria-haspopup="true"]');
    await page.click('header button:has-text("Sign Out")');
    await expect(page).toHaveURL(/\/login/);

    // 7. Log in as IT Staff (Michael Brown) to verify ticket arrival in queue
    await page.fill("#login-email", "michael.brown@toktickit.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/queue/);

    // 8. Search for new ticket in queue
    const queueSearch = page.locator('input[aria-label="Search tickets"]');
    await queueSearch.fill(ticketNo);
    await page.waitForTimeout(400); // debounce

    const newTicketLink = page.locator(`a:has-text("${ticketNo}"):visible`);
    await expect(newTicketLink).toBeVisible();

    // Verify row/card indicates unassigned ownership
    const ticketRowOrCard = page
      .locator('[data-testid^="queue-row-"], [data-testid^="queue-card-"], tr, .card')
      .filter({ hasText: ticketNo })
      .filter({ visible: true })
      .first();
    await expect(ticketRowOrCard).toContainText("Unassigned");

    // 9. Open Ticket Detail
    await newTicketLink.click();
    await expect(page).toHaveURL(/\/queue\/.+/);
    await expect(page.getByText(ticketNo).first()).toBeVisible();
    await expect(
      page.getByText("[E2E] Hardware display failure in workstation 12").first()
    ).toBeVisible();

    // 10. Verify Ticket properties: Category, Related System, Status NEW, IT Priority HIGH, Unassigned Owner
    await expect(page.getByText("Hardware").first()).toBeVisible();
    await expect(page.getByText("Finance & Accounting").first()).toBeVisible();
    await expect(page.getByText("NEW").first()).toBeVisible();

    const itPrioritySelect = page.locator("#it-priority-select");
    await expect(itPrioritySelect).toHaveValue("HIGH");

    const ownerSelect = page.locator("#owner-select");
    await expect(ownerSelect).toHaveValue("");
    await expect(page.locator('button:has-text("Claim Ticket")')).toBeVisible();

    await assertNoHorizontalOverflow(page);
  });
});
