import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.E2E_USER_EMAIL
const TEST_PWD   = process.env.E2E_USER_PASSWORD

// Skip toute la suite si pas de credentials → évite les flaky en CI
// quand les vars d'env ne sont pas dispo.
test.skip(!TEST_EMAIL || !TEST_PWD, 'E2E_USER_EMAIL / E2E_USER_PASSWORD non définis')

test.describe('Auth', () => {
  test('login flow → dashboard accessible', async ({ page }) => {
    await page.goto('/auth/login')

    await page.getByLabel(/email/i).first().fill(TEST_EMAIL!)
    await page.getByLabel(/mot de passe/i).first().fill(TEST_PWD!)
    await page.getByRole('button', { name: /(connexion|se connecter|connecter)/i }).first().click()

    // Après login : redirect vers /dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 })
    await expect(page.locator('body')).toContainText(/(dashboard|tableau de bord|chez nous)/i)
  })

  test('chez-nous feed is reachable after login', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).first().fill(TEST_EMAIL!)
    await page.getByLabel(/mot de passe/i).first().fill(TEST_PWD!)
    await page.getByRole('button', { name: /(connexion|se connecter|connecter)/i }).first().click()
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 })

    await page.goto('/dashboard/chez-nous')
    // Le composer (champ de partage) doit être visible
    await expect(page.locator('body')).toContainText(/(exprime-toi|chez nous|partage|composer)/i)
  })
})
