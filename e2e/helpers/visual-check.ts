import { Page, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

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
 * Asserts that text elements and containers do not experience unintended clipping or bounding overlap.
 * Section 9 & VIS-04: Zero text clipping and element overlap on long descriptions and dense data.
 */
export async function assertNoTextClippingOrOverlap(page: Page, rootSelector = "body") {
  const issues = await page.evaluate((selector) => {
    const root = document.querySelector(selector) || document.body;
    const errors: string[] = [];

    // 1. Check text containers for clipping (scrollWidth > clientWidth with overflow hidden)
    const textNodes = Array.from(
      root.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6, .card, .badge, p, td, th")
    ).filter((el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    });

    for (const el of textNodes) {
      const style = window.getComputedStyle(el);
      const isClipped =
        (style.overflowX === "hidden" || style.overflow === "hidden") &&
        style.textOverflow !== "ellipsis" &&
        el.scrollWidth > el.clientWidth + 2;

      if (isClipped) {
        errors.push(
          `Text clipped in <${el.tagName.toLowerCase()}> with text "${(el.textContent || "").trim().slice(0, 40)}": scrollWidth (${el.scrollWidth}) > clientWidth (${el.clientWidth})`
        );
      }
    }

    // 2. Check cards and grid columns for unintended element overlap
    const cards = Array.from(root.querySelectorAll<HTMLElement>(".card, .row > [class*='col']")).filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    for (let i = 0; i < cards.length; i++) {
      const r1 = cards[i].getBoundingClientRect();
      for (let j = i + 1; j < cards.length; j++) {
        if (cards[i].contains(cards[j]) || cards[j].contains(cards[i])) continue;

        const r2 = cards[j].getBoundingClientRect();
        const xOverlap = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
        const yOverlap = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));

        if (xOverlap > 2 && yOverlap > 2) {
          const area = xOverlap * yOverlap;
          if (area > 10) {
            errors.push(
              `Overlap detected between elements (${Math.round(xOverlap)}x${Math.round(yOverlap)}px): "${(cards[i].textContent || "").trim().slice(0, 25)}" and "${(cards[j].textContent || "").trim().slice(0, 25)}"`
            );
          }
        }
      }
    }

    return errors;
  }, rootSelector);

  expect(issues).toEqual([]);
}

/**
 * Captures a screenshot to the canonical Lab 3 screenshot directory.
 */
export async function captureScreenshot(page: Page, relativePath: string) {
  const fullPath = path.resolve(process.cwd(), "artifacts/lab-03/screenshots", relativePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  await page.waitForLoadState("networkidle");
  // Brief delay to ensure CSS transitions/animations settle
  await page.waitForTimeout(300);
  await page.screenshot({ path: fullPath, fullPage: false });
}

/**
 * Captures a screenshot to the canonical Lab 4 screenshot directory.
 */
export async function captureLab4Screenshot(page: Page, relativePath: string) {
  const fullPath = path.resolve(process.cwd(), "artifacts/lab-04/screenshots", relativePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  await page.waitForLoadState("networkidle");
  // Brief delay to ensure CSS transitions/animations settle
  await page.waitForTimeout(300);
  await page.screenshot({ path: fullPath, fullPage: false });
}
