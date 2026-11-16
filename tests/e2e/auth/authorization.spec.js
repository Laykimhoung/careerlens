// @ts-check
const { test, expect } = require('@playwright/test');
const {
  API_BASE,
  DEMO_ACCOUNTS,
  loginViaApi,
  authenticatePage,
} = require('../helpers/auth');

test.describe('Stage 2 — Role-Based Access Control (Frontend & Backend)', () => {
  test('Unauthenticated user is redirected to /login with ?redirect= preserved', async ({ page }) => {
    await page.goto('/candidate/jobs');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fcandidate%2Fjobs/);

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin/);
  });

  test('Unauthenticated API requests to protected endpoints return 401', async ({ request }) => {
    for (const path of ['/auth/me/', '/auth/users/', '/auth/admin/dashboard/', '/applications/', '/messages/']) {
      const res = await request.get(`${API_BASE}${path}`);
      expect(res.status(), `${path} should reject anonymous request`).toBe(401);
    }
  });

  test('Candidate cannot access /company or /admin routes in UI or Admin/Company APIs', async ({ page, request }) => {
    const candSession = await authenticatePage(page, request, 'candidate');

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/candidate$/);

    await page.goto('/company');
    await expect(page).toHaveURL(/\/candidate$/);

    // Backend authorization checks
    const adminUsersRes = await request.get(`${API_BASE}/auth/users/`, {
      headers: { Authorization: `Bearer ${candSession.access}` },
    });
    expect(adminUsersRes.status()).toBe(403);

    const adminDashRes = await request.get(`${API_BASE}/auth/admin/dashboard/`, {
      headers: { Authorization: `Bearer ${candSession.access}` },
    });
    expect(adminDashRes.status()).toBe(403);

    const createJobRes = await request.post(`${API_BASE}/jobs/`, {
      headers: { Authorization: `Bearer ${candSession.access}` },
      data: { title: 'Unauthorized Job', description: 'Should fail' },
    });
    expect(createJobRes.status()).toBe(403);
  });

  test('Company cannot access /admin or modify another company job', async ({ page, request }) => {
    const compSession = await authenticatePage(page, request, 'company');
    const altCompSession = await loginViaApi(request, DEMO_ACCOUNTS.companyAlt);

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/company$/);

    // Create a temporary PUBLISHED job under alt company, then verify main company gets 403 on PATCH/DELETE
    const createdJobRes = await request.post(`${API_BASE}/jobs/`, {
      headers: { Authorization: `Bearer ${altCompSession.access}` },
      data: {
        title: `[QA-E2E] Isolation Check ${Date.now()}`,
        description: 'Cross-company RBAC test job',
        location: 'Phnom Penh',
        employment_type: 'FULL_TIME',
        workplace_type: 'REMOTE',
        status: 'PUBLISHED',
      },
    });
    expect(createdJobRes.status()).toBe(201);
    const createdJob = await createdJobRes.json();

    try {
      const patchRes = await request.patch(`${API_BASE}/jobs/${createdJob.id}/`, {
        headers: { Authorization: `Bearer ${compSession.access}` },
        data: { title: 'Tampered Title' },
      });
      expect(patchRes.status()).toBe(403);

      const delRes = await request.delete(`${API_BASE}/jobs/${createdJob.id}/`, {
        headers: { Authorization: `Bearer ${compSession.access}` },
      });
      expect(delRes.status()).toBe(403);
    } finally {
      await request.delete(`${API_BASE}/jobs/${createdJob.id}/`, {
        headers: { Authorization: `Bearer ${altCompSession.access}` },
      });
    }
  });
});
