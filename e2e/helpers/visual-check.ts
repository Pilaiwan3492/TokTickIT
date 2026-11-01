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
 * Checks buttons, inputs, selects, textareas, and interactive navigation/action links.
 * Inline text links within body prose are exempt per WCAG 2.5.5 / 2.5.8.
 *
 * This check is intended for Tablet and Mobile viewports.
 */
export async function assertMinimumTouchTargets(page: Page) {
  const undersizedTargets = await page
    .locator(
      "button, input:not([type='checkbox']):not([type='radio']):not([type='hidden']), select, textarea, a.btn, a[role='button'], a.nav-link, a.page-link, a.dropdown-item, a[aria-label], nav a"
    )
    .evaluateAll((elements) =>
      elements
        .filter((element) => {
          const rect = element.getBoundingClientRect();

          // Ignore elements that are not currently rendered/visible
          if (rect.width === 0 || rect.height === 0) {
            return false;
          }

          // Inline and table cell data exemption:
          // 1. Table cell data links (e.g. ticket number link inside <td>) are dense data entries, not standalone navigation buttons.
          // 2. Inline links within running text prose paragraphs are exempt unless styled as buttons/nav controls.
          if (element.tagName === "A") {
            if (element.closest("td")) {
              return false;
            }

            const hasControlRole =
              element.classList.contains("btn") ||
              element.classList.contains("nav-link") ||
              element.classList.contains("page-link") ||
              element.classList.contains("dropdown-item") ||
              element.getAttribute("role") === "button" ||
              element.hasAttribute("aria-label");

            const isInlineProseLink =
              !hasControlRole &&
              element.parentElement?.tagName === "P" &&
              (element.parentElement?.textContent || "").length > (element.textContent || "").length + 10;

            if (isInlineProseLink) {
              return false;
            }
          }

          return rect.width < 44 || rect.height < 44;
        })
        .map((element) => {
          const rect = element.getBoundingClientRect();

          return {
            tag: element.tagName.toLowerCase(),
            class: element.className,
            text: (element.textContent || "").trim().slice(0, 80),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            ariaLabel: element.getAttribute("aria-label") || undefined,
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

    // 1. Check critical dynamic and descriptive text containers for unintended clipping
    // Explicitly inspecting Ticket Description, Actions Taken, Follow-Up Notes, Cards, Modals, and Tables
    const textNodes = Array.from(
      root.querySelectorAll<HTMLElement>(
        "h1, h2, h3, h4, h5, h6, .card, .badge, p, td, th, " +
        ".action-description, .action-result, .follow-up-note, .ticket-description, " +
        "[data-testid*='action'], [data-testid*='note'], .modal-body, .modal-title, .alert"
      )
    ).filter((el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    });

    for (const el of textNodes) {
      const style = window.getComputedStyle(el);

      // Horizontal clipping check: overflow hidden without ellipsis
      const isHorizontallyClipped =
        (style.overflowX === "hidden" || style.overflow === "hidden") &&
        style.textOverflow !== "ellipsis" &&
        el.scrollWidth > el.clientWidth + 2;

      // Vertical clipping check: fixed height with overflow hidden clipping lines
      const isVerticallyClipped =
        (style.overflowY === "hidden" || style.overflow === "hidden") &&
        el.scrollHeight > el.clientHeight + 4;

      if (isHorizontallyClipped) {
        errors.push(
          `Horizontal text clipped in <${el.tagName.toLowerCase()}> with text "${(el.textContent || "").trim().slice(0, 40)}": scrollWidth (${el.scrollWidth}) > clientWidth (${el.clientWidth})`
        );
      }
      if (isVerticallyClipped) {
        errors.push(
          `Vertical text clipped in <${el.tagName.toLowerCase()}> with text "${(el.textContent || "").trim().slice(0, 40)}": scrollHeight (${el.scrollHeight}) > clientHeight (${el.clientHeight})`
        );
      }
    }

    // 2. Geometric collision / overlap check in high-risk structural areas:
    // Sibling cards, metric tiles, modal sections, button groups, alerts, and grid columns
    const collisionCandidates = Array.from(
      root.querySelectorAll<HTMLElement>(
        ".card, .row > [class*='col'], .modal-header, .modal-body, .modal-footer, .alert, .btn-group"
      )
    ).filter((el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    });

    for (let i = 0; i < collisionCandidates.length; i++) {
      const el1 = collisionCandidates[i];
      const r1 = el1.getBoundingClientRect();

      for (let j = i + 1; j < collisionCandidates.length; j++) {
        const el2 = collisionCandidates[j];

        // Skip nested ancestors/descendants
        if (el1.contains(el2) || el2.contains(el1)) continue;

        // Skip elements in different layering contexts (e.g. modal overlay vs background page)
        const isModal1 = !!el1.closest('.modal, [role="dialog"]');
        const isModal2 = !!el2.closest('.modal, [role="dialog"]');
        if (isModal1 !== isModal2) continue;

        const r2 = el2.getBoundingClientRect();
        const xOverlap = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
        const yOverlap = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));

        if (xOverlap > 2 && yOverlap > 2) {
          const area = xOverlap * yOverlap;
          if (area > 15) {
            errors.push(
              `Overlap detected between elements (${Math.round(xOverlap)}x${Math.round(yOverlap)}px): "${(el1.textContent || "").trim().slice(0, 25)}" and "${(el2.textContent || "").trim().slice(0, 25)}"`
            );
          }
        }
      }
    }

    return errors;
  }, rootSelector);

  expect(issues).toEqual([]);
}

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
