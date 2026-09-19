import { Page, expect } from "@playwright/test";
import path from "path";

/**
 * Asserts that the document has zero horizontal scrollbar / page overflow.
 * Section 2.5 (RESP-04): scrollWidth <= innerWidth.
 */
export async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const winWidth = window.innerWidth;
    return {
      docWidth,
      winWidth,
      hasOverflow: docWidth > winWidth + 1, // allow 1px subpixel rounding tolerance
    };
  });
  expect(overflow.hasOverflow).toBe(false);
}

/**
 * Asserts that interactive controls meet the minimum 44x44px touch target.
 * Section 2.5 (RESP-03).
 *
 * This check is intended for Tablet and Mobile viewports.
 */
export async function assertMinimumTouchTargets(page: Page) {
  const undersizedTargets = await page
    .locator("button, input:not([type='checkbox']):not([type='radio']), select, textarea")
    .evaluateAll((elements) =>
      elements
        .filter((element) => {
          const rect = element.getBoundingClientRect();

          // Ignore elements that are not currently rendered/visible.
          if (rect.width === 0 || rect.height === 0) {
            return false;
          }

          return rect.width < 44 || rect.height < 44;
        })
        .map((element) => {
          const rect = element.getBoundingClientRect();

          return {
            tag: element.tagName,
            text: (element.textContent || "").trim().slice(0, 80),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        })
    );

  expect(undersizedTargets).toEqual([]);
}

/**
 * Captures a screenshot to the canonical Lab 3 screenshot directory.
 */
export async function captureScreenshot(page: Page, relativePath: string) {
  const fullPath = path.resolve(process.cwd(), "artifacts/lab-03/screenshots", relativePath);
  await page.waitForLoadState("networkidle");
  // Brief delay to ensure CSS transitions/animations settle
  await page.waitForTimeout(300);
  await page.screenshot({ path: fullPath, fullPage: false });
}
