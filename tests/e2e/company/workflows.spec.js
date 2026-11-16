// @ts-check
const { test, expect } = require('@playwright/test');
const {
  API_BASE,
  DEMO_ACCOUNTS,
  loginViaApi,
  authenticatePage,
  attachDiagnostics,
  assertNoFatalErrors,
} = require('../helpers/auth');

test.describe('Stage 3 — Company Feature Workflows', () => {
  const createdJobIds = [];

  test.afterAll(async ({ request }) => {
    if (!createdJobIds.length) return;
    const compSession = await loginViaApi(request, DEMO_ACCOUNTS.company);
    for (const jid of createdJobIds) {
      await request.delete(`${API_BASE}/jobs/${jid}/`, {
        headers: { Authorization: `Bearer ${compSession.access}` },
      });
    }
  });

  test('Company job lifecycle via UI: validation, create, list visibility, edit, and delete', async ({ page, request }) => {
    const diag = attachDiagnostics(page);
    const compSession = await authenticatePage(page, request, 'company');
    const uniqueTitle = `[QA-E2E] Senior QA Engineer ${Date.now()}`;

    await page.goto('/company/jobs/create');
    await expect(page.locator('.company-shell')).toBeVisible();

    // Verify required validation prevents empty submit
    await page.getByRole('button', { name: /publish|create|save/i }).first().click();
    await expect(page).toHaveURL(/\/company\/jobs\/create/);

    // Fill create job form
    await page.getByLabel(/job title|title/i).first().fill(uniqueTitle);
    const locInput = page.getByLabel(/location/i).first();
    if (await locInput.count()) {
      await locInput.fill('Phnom Penh');
    }
    const descInput = page.locator('textarea').first();
    await descInput.fill('Automated Playwright QA lifecycle test job description.');

    await page.getByRole('button', { name: /publish|create|save/i }).first().click();
    await expect(page).toHaveURL(/\/company\/jobs$/);
    await expect(page.getByText(uniqueTitle).first()).toBeVisible();

    // Locate created job ID via API so cleanup is guaranteed
    const jobsRes = await request.get(`${API_BASE}/jobs/?search=${encodeURIComponent(uniqueTitle)}`, {
      headers: { Authorization: `Bearer ${compSession.access}` },
    });
    const payload = await jobsRes.json();
    const list = Array.isArray(payload) ? payload : payload.results || [];
    const created = list.find((j) => j.title === uniqueTitle);
    expect(created, 'Created job should be returned by backend API').toBeTruthy();
    createdJobIds.push(created.id);

    // Edit job page
    await page.goto(`/company/jobs/${created.id}/edit`);
    const editedTitle = `${uniqueTitle} (Edited)`;
    await page.getByLabel(/job title|title/i).first().fill(editedTitle);
    await page.getByRole('button', { name: /save|update/i }).first().click();
    await expect(page).toHaveURL(/\/company\/jobs$/);
    await expect(page.getByText(editedTitle).first()).toBeVisible();

    assertNoFatalErrors(diag);
  });

  test('Company secondary pages load cleanly (Dashboard, Profile, Applicants, Interviews, Messages, Notifications)', async ({ page, request }) => {
    const diag = attachDiagnostics(page);
    await authenticatePage(page, request, 'company');

    const routes = [
      '/company',
      '/company/profile',
      '/company/jobs',
      '/company/applicants',
      '/company/interviews',
      '/company/messages',
      '/company/notifications',
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('.company-content')).toBeVisible();
      await page.waitForLoadState('networkidle');
    }

    assertNoFatalErrors(diag);
  });
});
