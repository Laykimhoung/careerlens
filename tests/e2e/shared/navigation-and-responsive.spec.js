// @ts-check
const { test, expect } = require('@playwright/test');
const {
  authenticatePage,
  attachDiagnostics,
  assertNoFatalErrors,
} = require('../helpers/auth');

test.describe('Stage 5 & 6 — Navigation, Placeholder Audit & Responsive Layouts', () => {
  test('Public and Candidate pages have no horizontal overflow on Desktop (1440x900) and Mobile (390x844)', async ({ page, request }) => {
    const diag = attachDiagnostics(page);

    // Public Home mobile check
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const homeOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(homeOverflow, `Home mobile horizontal overflow: ${homeOverflow}px`).toBeLessThanOrEqual(4);

    // Login mobile check
    await page.goto('/login');
    const loginOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(loginOverflow, `Login mobile horizontal overflow: ${loginOverflow}px`).toBeLessThanOrEqual(4);

    // Candidate desktop & mobile check
    await authenticatePage(page, request, 'candidate');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/candidate/jobs');
    await page.waitForLoadState('networkidle');
    const jobsDesktopOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(jobsDesktopOverflow, `Jobs desktop horizontal overflow: ${jobsDesktopOverflow}px`).toBeLessThanOrEqual(4);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/candidate/jobs');
    await page.waitForLoadState('networkidle');
    const jobsMobileOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(jobsMobileOverflow, `Jobs mobile horizontal overflow: ${jobsMobileOverflow}px`).toBeLessThanOrEqual(4);

    assertNoFatalErrors(diag);
  });

  test('Check sidebar navigation links that resolve to PlaceholderPage (Candidate & Company)', async ({ page, request }) => {
    await authenticatePage(page, request, 'candidate');
    await page.goto('/candidate/interviews');
    const candInterviewsText = await page.locator('.candidate-layout__content').innerText();

    await page.goto('/candidate/settings');
    const candSettingsText = await page.locator('.candidate-layout__content').innerText();

    expect(candInterviewsText.length).toBeGreaterThan(0);
    expect(candSettingsText.length).toBeGreaterThan(0);
  });
});
