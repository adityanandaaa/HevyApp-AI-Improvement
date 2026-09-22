import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/** @param {import('@playwright/test').Page} page */
async function runAxe(page) {
  return new AxeBuilder({ page }).include('#phone-frame').analyze();
}

/** @param {import('@playwright/test').Page} page */
async function goToLogWorkout(page) {
  await page.click('.screen:not([hidden]) [data-nav="workout"]');
  await page.click('#start-push-day');
}

test.describe('axe accessibility scan (AC-56, AC-57, M7)', () => {
  test('Home tab is axe clean', async ({ page }) => {
    await page.goto('/');
    const results = await runAxe(page);
    expect(results.violations).toEqual([]);
  });

  test('Workout tab is axe clean', async ({ page }) => {
    await page.goto('/');
    await page.click('.screen:not([hidden]) [data-nav="workout"]');
    const results = await runAxe(page);
    expect(results.violations).toEqual([]);
  });

  test('Log Workout (before any set is checked) is axe clean', async ({ page }) => {
    await page.goto('/');
    await goToLogWorkout(page);
    const results = await runAxe(page);
    expect(results.violations).toEqual([]);
  });

  test('Log Workout with the signal card and chips showing is axe clean', async ({ page }) => {
    await page.goto('/');
    await goToLogWorkout(page);
    const row = page.locator('.exercise-block[data-exercise="incline-bench-press"] .set-row[data-set="3"]');
    await row.locator('.set-input--rpe').fill('9');
    await row.locator('.check-btn').click();
    await page.waitForSelector('#docked-card:not([hidden])');
    await page.waitForTimeout(250); // let the docked-card fade-in (--t-card, 200ms) settle
    const results = await runAxe(page);
    expect(results.violations).toEqual([]);
  });

  test('the Why? sheet is axe clean', async ({ page }) => {
    await page.goto('/');
    await goToLogWorkout(page);
    const row = page.locator('.exercise-block[data-exercise="incline-bench-press"] .set-row[data-set="3"]');
    await row.locator('.set-input--rpe').fill('9');
    await row.locator('.check-btn').click();
    await page.waitForSelector('#docked-card:not([hidden])');
    await page.waitForTimeout(250);
    await page.click('#docked-card-why');
    await page.waitForSelector('#why-sheet:not([hidden])');
    const results = await runAxe(page);
    expect(results.violations).toEqual([]);
  });

  test('the PR/PROGRESS celebration card is axe clean', async ({ page }) => {
    await page.goto('/');
    await goToLogWorkout(page);
    const row = page.locator('.exercise-block[data-exercise="incline-bench-press"] .set-row[data-set="3"]');
    await row.locator('.set-input--weight').fill('44');
    await row.locator('.set-input--rpe').fill('7');
    await row.locator('.check-btn').click();
    await page.waitForSelector('#docked-card:not([hidden])');
    await page.waitForTimeout(250);
    const results = await runAxe(page);
    expect(results.violations).toEqual([]);
  });

  test('the PR + high-RPE HOLD combined card is axe clean', async ({ page }) => {
    await page.goto('/');
    await goToLogWorkout(page);
    const row = page.locator('.exercise-block[data-exercise="incline-bench-press"] .set-row[data-set="3"]');
    await row.locator('.set-input--weight').fill('44');
    await row.locator('.set-input--rpe').fill('9');
    await row.locator('.check-btn').click();
    await page.waitForSelector('#docked-card:not([hidden])');
    await page.waitForTimeout(250);
    const results = await runAxe(page);
    expect(results.violations).toEqual([]);
  });

  test('the Pain-reported card is axe clean', async ({ page }) => {
    await page.goto('/');
    await goToLogWorkout(page);
    await page.click('.exercise-block[data-exercise="incline-bench-press"] [data-pain-toggle]');
    await page.waitForSelector('#docked-card:not([hidden])');
    await page.waitForTimeout(250);
    const results = await runAxe(page);
    expect(results.violations).toEqual([]);
  });

  test('the session recap is axe clean', async ({ page }) => {
    await page.goto('/');
    await goToLogWorkout(page);
    await page.click('#finish-workout');
    await page.waitForSelector('#screen-recap:not([hidden])');
    const results = await runAxe(page);
    expect(results.violations).toEqual([]);
  });

  test('the dev toolbar is axe clean', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).include('#dev-toolbar').analyze();
    expect(results.violations).toEqual([]);
  });
});
