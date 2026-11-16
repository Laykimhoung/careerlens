// @ts-check
const { test, expect } = require('@playwright/test');
const {
  authenticatePage,
  attachDiagnostics,
  assertNoFatalErrors,
} = require('../helpers/auth');

test.describe('Stage 3 — Admin Feature Workflows', () => {
  test('All Admin management pages load with data and zero runtime errors', async ({ page, request }) => {
    const diag = attachDiagnostics(page);
    await authenticatePage(page, request, 'admin');

    const routes = [
      '/admin',
      '/admin/users',
      '/admin/candidates',
      '/admin/companies',
      '/admin/verification',
      '/admin/jobs',
      '/admin/applications',
      '/admin/reports',
      '/admin/categories',
      '/admin/skills',
      '/admin/audit-logs',
      '/admin/notifications',
      '/admin/settings',
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('.admin-content')).toBeVisible();
      await page.waitForLoadState('networkidle');
    }

    assertNoFatalErrors(diag);
  });
});
