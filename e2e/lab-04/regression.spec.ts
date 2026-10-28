import { test, expect } from "@playwright/test";
import { resetDatabaseState } from "../helpers/db-reset";
import { assertNoHorizontalOverflow } from "../helpers/visual-check";

test.describe("Lab 4 Sprint 4 Full Regression Suite across Labs 1–3 (E2E-10)", () => {
  test.beforeEach(async () => {
    await resetDatabaseState();
  });

  test.afterAll(async () => {
    await resetDatabaseState();
  });

  // --- E2E-10 Part 1: Lab 1 Baseline Reference Data & Health Check Regression ---
  test("E2E-10.1: Lab 1 baseline reference data and health check verification", async ({
    page,
    request,
  }) => {
    // 1. Health check endpoint responds with HTTP 200 and healthy status
    const healthRes = await request.get("/api/health");
    expect(healthRes.status()).toBe(200);
    const healthData = await healthRes.json();
    expect(healthData.status).toBe("ok");
    expect(healthData.service).toBe("TokTickIT API");

    // 2. Categories API returns active categories
    const catRes = await request.get("/api/v1/categories");
    expect(catRes.status()).toBe(200);
    const catData = await catRes.json();
    const categories = Array.isArray(catData) ? catData : catData.data;
    expect(categories.length).toBeGreaterThanOrEqual(4);
    const names = categories.map((c: { name: string }) => c.name);
    expect(names).toContain("Hardware");
    expect(names).toContain("Software");
    expect(names).toContain("Network");
    expect(names).toContain("Account and Access");

    // 3. Related Systems API returns baseline reference items
    const sysRes = await request.get("/api/v1/related-systems");
    expect(sysRes.status()).toBe(200);
    const sysData = await sysRes.json();
    const systems = Array.isArray(sysData) ? sysData : sysData.data;
    expect(systems.length).toBeGreaterThanOrEqual(5);

    // 4. Log in as Requester and verify reference data populates the Create Ticket dropdowns
    await page.goto("/login");
    await page.fill("#login-email", "bob@example.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(tickets|dashboard)/);

    await page.goto("/create-ticket");
    await page.waitForLoadState("networkidle");
    const categorySelect = page.locator("select").first();
    await expect(categorySelect).toBeVisible();
    const catOptions = await categorySelect.locator("option").allTextContents();
    expect(catOptions.some((o) => o.includes("Hardware"))).toBe(true);
    expect(catOptions.some((o) => o.includes("Network"))).toBe(true);

    await assertNoHorizontalOverflow(page);
  });

  // --- E2E-10 Part 2: Lab 2 Requester Flow, Ticket Creation, My Tickets & Attachments ---
  test("E2E-10.2: Lab 2 Requester flow: Ticket creation, My Tickets table, Detail, and attachment lifecycle", async ({
    page,
  }) => {
    // 1. Log in as Requester (Bob Smith)
    await page.goto("/login");
    await page.fill("#login-email", "bob@example.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(tickets|dashboard)/);

    // 2. Navigate to Create Ticket
    await page.goto("/create-ticket");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2").filter({ hasText: /Create/i }).first()).toBeVisible();

    // Select category, related system, and priority
    const categorySelect = page.locator("select").nth(0);
    const systemSelect = page.locator("select").nth(1);
    const prioritySelect = page.locator("select").nth(2);

    await categorySelect.selectOption({ label: "Hardware" });
    await systemSelect.selectOption({ index: 1 });
    if (await prioritySelect.isVisible()) {
      await prioritySelect.selectOption("HIGH");
    }

    const summaryInput = page.locator('input[placeholder*="summary" i]').first();
    const descInput = page.locator('textarea[placeholder*="description" i]').first();

    await summaryInput.fill("E2E Regression Test Ticket Summary");
    await descInput.fill("Detailed regression testing description for hardware failure verification.");

    // Submit ticket
    await page.click('button[type="submit"]:has-text("Create Ticket")');
    await expect(page.locator("text=Ticket Created Successfully!")).toBeVisible();

    // Navigate to ticket detail via button
    await page.click('button:has-text("View Ticket Details")');
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=E2E Regression Test Ticket Summary")).toBeVisible();

    // 3. Attachments section: Upload an attachment
    await expect(page.getByRole("heading", { name: "Attachments" })).toBeVisible();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "regression-proof.png",
      mimeType: "image/png",
      buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64"),
    });

    await expect(page.locator("text=regression-proof.png").first()).toBeVisible();

    // 4. Download attachment verification
    const downloadBtn = page.locator('button:has-text("Download")').first();
    await expect(downloadBtn).toBeVisible();
    const downloadPromise = page.waitForEvent("download");
    await downloadBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("regression-proof.png");

    // 5. Soft-delete attachment
    const removeBtn = page.locator('button:has-text("Remove")').first();
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();

    // Fill removal reason and confirm
    const reasonInput = page.locator('input[placeholder*="wrong screenshot" i]');
    await expect(reasonInput).toBeVisible();
    await reasonInput.fill("Uploaded test file as part of automated regression verification.");
    await page.click('button[type="submit"]:has-text("Remove Attachment")');

    // Verify soft-deleted status badge and reason
    await expect(page.locator("text=Status: Removed").first()).toBeVisible();
    await expect(page.locator("text=Reason: Uploaded test file as part of automated regression verification.").first()).toBeVisible();

    // 5. Navigate to My Tickets (/tickets) and verify ticket list
    await page.goto("/tickets");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=E2E Regression Test Ticket Summary").first()).toBeVisible();

    await assertNoHorizontalOverflow(page);
  });

  // --- E2E-10 Part 3: Lab 3 Authentication, RBAC, and Mandatory Password Change ---
  test("E2E-10.3: Lab 3 Auth foundation, RBAC boundaries, and Password change flow", async ({
    page,
  }) => {
    // 1. Mandatory password change for initial temporary password user (alice@example.com)
    await page.goto("/login");
    await page.fill("#login-email", "alice@example.com");
    await page.fill("#login-password", "InitialPass123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/change-password/);
    await expect(page.locator("h1")).toContainText("Change Your Password");

    // Complete password change satisfying complexity
    await page.fill("#current-password", "InitialPass123!");
    await page.fill("#new-password", "NewPass987!#");
    await page.fill("#confirm-password", "NewPass987!#");
    await page.click('button[type="submit"]:has-text("Continue")');
    await expect(page).toHaveURL(/\/(tickets|dashboard)/);

    // 2. RBAC Boundary check: Requester cannot access /admin/users
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/admin\/users/);

    await assertNoHorizontalOverflow(page);
  });

  // --- E2E-10 Part 4: Lab 3 IT Staff Queue, Notes, and Admin User Management ---
  test("E2E-10.4: Lab 3 IT Staff Queue, Public Comments, Internal Notes, and Admin User Management", async ({
    page,
  }) => {
    // 1. IT Staff Login Journey (Michael Brown)
    await page.goto("/login");
    await page.fill("#login-email", "michael.brown@toktickit.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(queue|dashboard)/);

    // Navigate to Queue
    await page.goto("/queue");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText("Ticket Queue");

    // IT Staff opens Ticket 1
    const tkt1Link = page.locator('a:has-text("TKT-2026-000001"):visible').first();
    await tkt1Link.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=TKT-2026-000001").first()).toBeVisible();

    // Verify Public Comments and Amber Internal Notes tab headers exist
    await expect(page.getByRole("tab", { name: /Public Comments/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Internal Notes/i })).toBeVisible();

    // 1. Post Public Comment (strict assertion: form must be visible)
    const commentInput = page.locator('textarea[placeholder*="Write a comment" i], textarea[placeholder*="comment" i]').first();
    await expect(commentInput).toBeVisible();
    await commentInput.fill("Automated regression public comment from IT Staff.");
    await page.getByRole("button", { name: /Post Comment/i }).click();
    await expect(page.locator(".text-dark:has-text('Automated regression public comment from IT Staff.')").first()).toBeVisible();

    // 2. Switch to Internal Notes tab and post Internal Note (strict assertion: form must be visible)
    await page.getByRole("tab", { name: /Internal Notes/i }).click();
    const amberNotice = page.locator("text=Internal Notes are private and never visible to the ticket Requester.");
    await expect(amberNotice).toBeVisible();

    const noteInput = page.locator("#staff-note-input");
    await expect(noteInput).toBeVisible();
    await noteInput.fill("Private operational regression verification note.");
    await page.click('button:has-text("Add Internal Note")');
    await expect(page.locator("text=Private operational regression verification note.").first()).toBeVisible();

    // 3. Sign Out
    await page.click('header button[aria-haspopup="true"]');
    await page.click('header button:has-text("Sign Out")');
    await expect(page).toHaveURL(/\/login/);

    // 4. Administrator User Management
    await page.fill("#login-email", "admin@toktickit.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(queue|dashboard)/);

    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText("User Management");

    // Verify user accounts exist in table
    await expect(page.locator('text="Michael Brown"').filter({ visible: true }).first()).toBeVisible();
    await expect(page.locator('text="Bob Smith"').filter({ visible: true }).first()).toBeVisible();

    // Verify Admin Self-Deactivation safety guard (strict assertion without conditional skips)
    const adminRowOrCard = page
      .locator('[data-testid^="user-row-"], [data-testid^="user-card-"]')
      .filter({ hasText: "admin@toktickit.com" })
      .filter({ visible: true })
      .first();
    await expect(adminRowOrCard).toBeVisible();
    await adminRowOrCard.locator('button:has-text("Edit")').click();
    await expect(page.locator('[data-testid="admin-edit-user-modal"]')).toBeVisible();

    const activeToggle = page.locator('[data-testid="switch-edit-active"]');
    await expect(activeToggle).toBeDisabled();

    const selfDeactNotice = page.locator('[data-testid="self-deactivation-notice"]');
    await expect(selfDeactNotice).toBeVisible();
    await expect(selfDeactNotice).toContainText("CANNOT_DEACTIVATE_SELF");

    // Close modal
    await page.locator('[data-testid="admin-edit-user-modal"] button:has-text("Cancel")').click();
    await expect(page.locator('[data-testid="admin-edit-user-modal"]')).not.toBeVisible();

    await assertNoHorizontalOverflow(page);
  });
});
