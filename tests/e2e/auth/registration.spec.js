// @ts-check
const { test, expect } = require('@playwright/test');
const {
  API_BASE,
  DEMO_ACCOUNTS,
  loginViaApi,
  attachDiagnostics,
  assertNoFatalErrors,
} = require('../helpers/auth');

test.describe('Stage 2 — Registration & Role Escalation Protection', () => {
  const createdUserIds = [];

  test.afterAll(async ({ request }) => {
    if (!createdUserIds.length) return;
    const adminSession = await loginViaApi(request, DEMO_ACCOUNTS.admin);
    for (const uid of createdUserIds) {
      await request.delete(`${API_BASE}/auth/users/${uid}/`, {
        headers: { Authorization: `Bearer ${adminSession.access}` },
      });
    }
  });

  test('Backend blocks ADMIN role self-assignment during registration (HTTP 400)', async ({ request }) => {
    const suffix = Date.now();
    const res = await request.post(`${API_BASE}/auth/register/`, {
      data: {
        username: `qa_evil_admin_${suffix}`,
        email: `qa_evil_admin_${suffix}@example.com`,
        password: 'StrongQaPassword123!',
        role: 'ADMIN',
      },
    });
    expect(res.status()).toBe(400);
  });

  test('Candidate registration via /register UI succeeds, signs in, and rejects duplicate email', async ({ page, request }) => {
    const diag = attachDiagnostics(page);
    const suffix = Date.now();
    const email = `qa_cand_${suffix}@example.com`;

    await page.goto('/register');
    await page.getByPlaceholder('Full name').fill('QA Test Candidate');
    await page.getByPlaceholder('name@example.com').fill(email);

    // Fill password and confirm password
    const pwInputs = page.locator('input[type="password"]');
    await pwInputs.nth(0).fill('StrongQaPassword123!');
    await pwInputs.nth(1).fill('StrongQaPassword123!');

    await page.getByPlaceholder('e.g. Royal University of Phnom Penh').fill('CADT');
    await page.getByPlaceholder('e.g. Computer Science, Information Technology, Software Engineering').fill('Computer Science');

    // Accept terms checkbox
    await page.locator('input[type="checkbox"]').last().check({ force: true });
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/candidate$/);
    const storedUser = await page.evaluate(() => JSON.parse(localStorage.getItem('user') || 'null'));
    expect(storedUser?.id).toBeTruthy();
    expect(storedUser?.role).toBe('candidate');
    createdUserIds.push(storedUser.id);

    // Verify duplicate email registration is rejected by API
    const dupRes = await request.post(`${API_BASE}/auth/register/`, {
      data: {
        username: `qa_dup_${suffix}`,
        email,
        password: 'StrongQaPassword123!',
        role: 'CANDIDATE',
      },
    });
    expect(dupRes.status()).toBe(400);

    assertNoFatalErrors(diag);
  });
});
