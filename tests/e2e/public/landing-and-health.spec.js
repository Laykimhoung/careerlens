// @ts-check
const { test, expect } = require('@playwright/test');
const { API_BASE, attachDiagnostics, assertNoFatalErrors } = require('../helpers/auth');

test.describe('Stage 1 — Public Landing & Health Smoke Tests', () => {
  test('GET /api/health/ returns HTTP 200 with connected PostgreSQL status', async ({ request }) => {
    const res = await request.get(`${API_BASE}/health/`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      status: 'ok',
      service: 'CareerLens API',
      database: 'connected',
    });
  });

  test('POST /api/health/ is rejected (HTTP 403 CSRF or 405 Method Not Allowed)', async ({ request }) => {
    const res = await request.post(`${API_BASE}/health/`);
    expect([403, 405]).toContain(res.status());
  });

  test('Landing page loads cleanly with stats, navigation links, and zero runtime errors', async ({ page }) => {
    const diag = attachDiagnostics(page);
    await page.goto('/');

    await expect(page).toHaveTitle(/CareerLens/i);
    await expect(page.locator('body')).toBeVisible();
    // Ensure key navigation links to auth exist
    await expect(page.locator('a[href="/login"], a[href="/register"]').first()).toBeVisible();

    // Verify no broken images on landing page
    const brokenImages = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.getAttribute('src'));
    });
    expect(brokenImages, `Broken images on /: ${brokenImages.join(', ')}`).toEqual([]);

    assertNoFatalErrors(diag);
  });

  test('Unknown route renders 404 Not Found page without crashing', async ({ page }) => {
    const diag = attachDiagnostics(page);
    await page.goto('/this-route-does-not-exist-qa');
    await expect(page.locator('body')).toContainText(/404|not found/i);
    assertNoFatalErrors(diag);
  });
});
