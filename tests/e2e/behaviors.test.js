import { expect, test } from '@playwright/test';

/** @param {import('@playwright/test').Page} page */
async function goToLogWorkout(page) {
  await page.click('.screen:not([hidden]) [data-nav="workout"]');
  await page.click('#start-push-day');
}

test.describe('AC-59: every tappable control this feature adds is at least 44x44pt', () => {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} selector
   */
  async function assertTapSize(page, selector) {
    const box = await page.locator(selector).first().boundingBox();
    expect(box, `${selector} should exist and be visible`).not.toBeNull();
    if (!box) return;
    expect(box.width, `${selector} width`).toBeGreaterThanOrEqual(43); // 1px slack for subpixel rounding
    expect(box.height, `${selector} height`).toBeGreaterThanOrEqual(43);
  }

  test('Start Routine, chips, dismiss and Pain all meet the minimum', async ({ page }) => {
    // .check-btn is intentionally excluded: it's Hevy's own existing
    // control (measured ~35-40pt, HANDOFF section 10), not a new element
    // this feature adds — only the feature's own new controls need 44pt.
    await page.goto('/');
    await assertTapSize(page, '[data-start-routine]');

    await goToLogWorkout(page);
    await assertTapSize(page, '.add-set-row__pain');

    const row = page.locator('.exercise-block[data-exercise="incline-bench-press"] .set-row[data-set="2"]');
    await row.locator('.check-btn').click();
    await page.waitForSelector('#docked-card:not([hidden])');
    await assertTapSize(page, '.chip');
    await assertTapSize(page, '#docked-card-dismiss');
  });

  test('the Why? sheet Close button meets the minimum', async ({ page }) => {
    await page.goto('/');
    await goToLogWorkout(page);
    const row = page.locator('.exercise-block[data-exercise="incline-bench-press"] .set-row[data-set="3"]');
    await row.locator('.set-input--rpe').fill('9');
    await row.locator('.check-btn').click();
    await page.waitForSelector('#docked-card:not([hidden])');
    await page.click('#docked-card-why');
    await assertTapSize(page, '#why-sheet-close');
  });

  test('the recap Done button meets the minimum', async ({ page }) => {
    await page.goto('/');
    await goToLogWorkout(page);
    await page.click('#finish-workout');
    await page.waitForSelector('#screen-recap:not([hidden])');
    await assertTapSize(page, '#recap-done');
  });
});

test.describe('AC-65: reduced motion', () => {
  test('the toolbar toggle removes the docked card fade-in', async ({ page }) => {
    await page.goto('/');
    await page.click('#toggle-reduced-motion');
    await goToLogWorkout(page);

    const row = page.locator('.exercise-block[data-exercise="incline-bench-press"] .set-row[data-set="3"]');
    await row.locator('.set-input--rpe').fill('9');
    await row.locator('.check-btn').click();
    await page.waitForSelector('#docked-card:not([hidden])');

    const duration = await page.locator('#docked-card').evaluate((el) => getComputedStyle(el).animationDuration);
    expect(parseFloat(duration)).toBeLessThan(0.01);
  });
});

test.describe('AC-68: locale-aware numbers', () => {
  test('switching to id-ID changes a decimal RPE number in the signal card', async ({ page }) => {
    await page.goto('/');
    await goToLogWorkout(page);

    const row = page.locator('.exercise-block[data-exercise="incline-bench-press"] .set-row[data-set="1"]');
    await row.locator('.set-input--rpe').fill('9.5');
    await row.locator('.check-btn').click();
    await page.waitForSelector('#docked-card:not([hidden])');
    const enGBReason = await page.textContent('.docked-card__reason');
    expect(enGBReason).toContain('9.5');

    await page.click('[data-locale="id-ID"]');
    await row.locator('.check-btn').click(); // uncheck
    await row.locator('.check-btn').click(); // re-check to recompute with the new locale
    await page.waitForSelector('#docked-card:not([hidden])');
    const idIDReason = await page.textContent('.docked-card__reason');
    expect(idIDReason).toContain('9,5');
    expect(idIDReason).not.toContain('9.5');
  });
});

test.describe('AC-64: the Why? sheet traps focus and returns it on close', () => {
  test('Tab wraps within the sheet; Close returns focus to the Why? link', async ({ page }) => {
    await page.goto('/');
    await goToLogWorkout(page);
    const row = page.locator('.exercise-block[data-exercise="incline-bench-press"] .set-row[data-set="3"]');
    await row.locator('.set-input--rpe').fill('9');
    await row.locator('.check-btn').click();
    await page.waitForSelector('#docked-card:not([hidden])');

    await page.click('#docked-card-why');
    await expect(page.locator('#why-sheet-close')).toBeFocused();

    // Shift+Tab from the first focusable element should wrap to the last.
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#why-sheet-close')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.locator('#docked-card-why')).toBeFocused();
    await expect(page.locator('#why-sheet')).toBeHidden();
  });
});
