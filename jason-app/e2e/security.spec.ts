import { test, expect } from '@playwright/test'

// Vérifs sécurité / surface publique. Pas besoin de creds.
// Ces tests veillent à ce que les pages sensibles restent protégées
// et que les redirections d'auth ne soient pas cassées.

test.describe('Security', () => {
  test('dashboard root redirects to login when anonymous', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 })
  })

  test('admin area redirects to login when anonymous', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/auth\/(login|register)/, { timeout: 10_000 })
  })

  test('reset password page renders email field', async ({ page }) => {
    await page.goto('/auth/reset')
    await expect(page.getByLabel(/email/i).first()).toBeVisible()
  })

  test('sign endpoint with malformed token returns 4xx (not 5xx)', async ({ page }) => {
    const r = await page.goto('/sign/abc')
    const status = r?.status() ?? 500
    expect(status).toBeGreaterThanOrEqual(400)
    expect(status).toBeLessThan(500)
  })

  test('API health endpoint avoids leaking stack traces', async ({ request }) => {
    // Random API path that doesn't exist → Next renders 404 page, not stack.
    const r = await request.get('/api/__definitely_not_existing__')
    expect(r.status()).toBeGreaterThanOrEqual(400)
    const body = await r.text()
    expect(body).not.toMatch(/at\s+\w+\s*\(.*:\d+:\d+\)/) // no JS stack trace
  })
})
