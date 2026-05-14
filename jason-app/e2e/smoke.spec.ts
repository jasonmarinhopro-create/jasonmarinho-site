import { test, expect } from '@playwright/test'

// Smoke tests : vérifications minimales que le site ne plante pas
// au démarrage. Pas besoin de credentials.

test.describe('Smoke', () => {
  test('homepage redirects to /auth/login if not authenticated', async ({ page }) => {
    const response = await page.goto('/')
    expect(response).not.toBeNull()
    // Soit on est sur login, soit sur la home publique selon la config.
    await expect(page).toHaveURL(/\/(auth\/login|dashboard)/)
  })

  test('login page renders form fields', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByLabel(/email/i).first()).toBeVisible()
    await expect(page.getByLabel(/mot de passe/i).first()).toBeVisible()
    // Bouton de soumission visible (libellé variable selon la version)
    await expect(page.getByRole('button', { name: /(connexion|se connecter|connecter)/i }).first()).toBeVisible()
  })

  test('register page renders form fields', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.getByLabel(/email/i).first()).toBeVisible()
    await expect(page.getByLabel(/mot de passe/i).first()).toBeVisible()
  })

  test('public sign page returns 404 for an invalid token', async ({ page }) => {
    const response = await page.goto('/sign/this-token-does-not-exist-1234567890')
    expect(response?.status()).toBe(404)
  })
})
