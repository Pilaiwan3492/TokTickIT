import { test, expect } from "@playwright/test";
import { resetDatabaseState } from "../helpers/db-reset";
import { captureScreenshot, assertNoHorizontalOverflow } from "../helpers/visual-check";

test.describe("Authentication & Session Management Suite", () => {
  test.beforeEach(async () => {
    await resetDatabaseState();
  });

  test("E2E-01: Valid login journeys across Requester, IT Staff, and Administrator", async ({
    page,
  }, testInfo) => {
    // 1. Visit Login screen and capture responsive visual evidence
    await page.goto("/login");
    await page.waitForSelector("#login-email");
    await assertNoHorizontalOverflow(page);

    if (testInfo.project.name === "Desktop") {
      await captureScreenshot(page, "authentication/01-login-desktop.png");
    } else if (testInfo.project.name === "Tablet") {
      await captureScreenshot(page, "authentication/01-login-tablet.png");
    } else if (testInfo.project.name === "Mobile") {
      await captureScreenshot(page, "authentication/01-login-mobile.png");
    }

    // A. Requester Login Journey (Bob Smith)
    await page.fill("#login-email", "bob@example.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/tickets/);
    await expect(page.locator("header")).toContainText("Bob Smith");
    await expect(page.locator("header")).toContainText("Requester");
    await expect(page.locator('header a:has-text("My Tickets")')).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // Sign out to test IT Staff login
    await page.click('header button[aria-haspopup="true"]');
    await page.click('header button:has-text("Sign Out")');
    await expect(page).toHaveURL(/\/login/);

    // B. IT Staff Login Journey (Michael Brown)
    await page.fill("#login-email", "michael.brown@toktickit.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/queue/);
    await expect(page.locator("header")).toContainText("Michael Brown");
    await expect(page.locator("header")).toContainText("IT Staff");
    await expect(page.locator('header a:has-text("Ticket Queue")')).toBeVisible();
    // IT Staff must NOT see "+ Create Ticket" per Section 3 & AC-08
    await expect(page.locator('header a:has-text("Create Ticket")')).not.toBeVisible();
    await assertNoHorizontalOverflow(page);

    // Sign out to test Admin login
    await page.click('header button[aria-haspopup="true"]');
    await page.click('header button:has-text("Sign Out")');
    await expect(page).toHaveURL(/\/login/);

    // C. Administrator Login Journey (John Smith / Admin)
    await page.fill("#login-email", "admin@toktickit.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/queue/);
    await expect(page.locator("header")).toContainText("John Smith");
    await expect(page.locator("header")).toContainText("Administrator");
    await expect(page.locator('header a:has-text("Ticket Queue")')).toBeVisible();
    await expect(page.locator('header a:has-text("User Management")')).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test("E2E-02: Mandatory first-login password change flow for seeded user", async ({
    page,
  }, testInfo) => {
    await page.goto("/login");
    await page.fill("#login-email", "alice@example.com");
    await page.fill("#login-password", "InitialPass123!");
    await page.click('button[type="submit"]');

    // Asserts mandatory redirect to /change-password
    await expect(page).toHaveURL(/\/change-password/);
    await expect(page.locator("h1")).toContainText("Change Your Password");
    await expect(page.locator("text=You must change your password to continue.")).toBeVisible();

    // Fill current and new password satisfying complexity
    await page.fill("#current-password", "InitialPass123!");
    await page.fill("#new-password", "NewSecurePass123!");
    await page.fill("#confirm-password", "NewSecurePass123!");

    // Verify real-time checklist indicators
    await expect(page.locator("text=At least 8 characters")).toBeVisible();
    await expect(page.locator("text=Include uppercase and lowercase letters")).toBeVisible();
    await expect(page.locator("text=Include a number and a special character")).toBeVisible();

    if (testInfo.project.name === "Desktop") {
      await captureScreenshot(page, "authentication/02-mandatory-password-change-desktop.png");
    } else if (testInfo.project.name === "Mobile") {
      await captureScreenshot(page, "authentication/02-mandatory-password-change-mobile.png");
    }

    await assertNoHorizontalOverflow(page);

    // Submit password change
    await page.click('button[type="submit"]:has-text("Continue")');

    // Asserts transition into main application as Requester
    await expect(page).toHaveURL(/\/tickets/);
    await expect(page.locator("header")).toContainText("Alice Johnson");
  });

  test("E2E-03: Inactive account rejection returns safe feedback banner", async ({
    page,
  }, testInfo) => {
    await page.goto("/login");
    await page.fill("#login-email", "eve@example.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    // Asserts error alert and remaining on /login
    const alert = page.locator(".alert.alert-danger");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Your account is currently inactive. Please contact an administrator.");
    await expect(page).toHaveURL(/\/login/);

    if (testInfo.project.name === "Desktop") {
      await captureScreenshot(page, "authentication/03-inactive-account-error.png");
    }
  });

  test("E2E-04: Sign out clears session and invalidates history navigation", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill("#login-email", "bob@example.com");
    await page.fill("#login-password", "Password123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/tickets/);

    // Logout
    await page.click('header button[aria-haspopup="true"]');
    await page.click('header button:has-text("Sign Out")');

    await expect(page).toHaveURL(/\/login/);

    // Verify localStorage auth token cleared
    const token = await page.evaluate(() => localStorage.getItem("toktickit_auth_token"));
    expect(token).toBeNull();

    // Verify browser back-button navigation to protected view is blocked
    await page.goBack();
    await expect(page).toHaveURL(/\/login/);

    // Also verify direct URL navigation to protected view is blocked
    await page.goto("/tickets");
    await expect(page).toHaveURL(/\/login/);
  });
});
