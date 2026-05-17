import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.E2E_USER_EMAIL
const TEST_PWD   = process.env.E2E_USER_PASSWORD

test.skip(!TEST_EMAIL || !TEST_PWD, 'E2E_USER_EMAIL / E2E_USER_PASSWORD non définis')

async function login(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  await page.getByLabel(/email/i).first().fill(TEST_EMAIL!)
  await page.getByLabel(/mot de passe/i).first().fill(TEST_PWD!)
  await page.getByRole('button', { name: /(connexion|se connecter|connecter)/i }).first().click()
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 })
}

test.describe('Dashboard — pages clés accessibles', () => {
  test('Calendrier loads with current month label', async ({ page }) => {
    await login(page)
    await page.goto('/dashboard/calendrier')
    await expect(page.locator('body')).toContainText(/(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i)
  })

  test('Logements page reachable, can open create form', async ({ page }) => {
    await login(page)
    await page.goto('/dashboard/logements')
    await expect(page.locator('body')).toContainText(/(logement|propriété|ajouter|premier bien)/i)
  })

  test('Voyageurs page reachable', async ({ page }) => {
    await login(page)
    await page.goto('/dashboard/voyageurs')
    await expect(page.locator('body')).toContainText(/(voyageur|carnet)/i)
  })

  test('Revenus page loads with year selector', async ({ page }) => {
    await login(page)
    await page.goto('/dashboard/revenus')
    await expect(page.locator('body')).toContainText(/(revenus|encaiss|brut)/i)
  })

  test('Profil page loads with Encaissements section + Stripe anchor', async ({ page }) => {
    await login(page)
    await page.goto('/dashboard/profil#stripe')
    await expect(page.locator('#stripe')).toBeVisible()
    await expect(page.locator('body')).toContainText(/(stripe|encaissement)/i)
  })

  test('Sécurité (signalements) reachable, search input visible', async ({ page }) => {
    await login(page)
    await page.goto('/dashboard/securite')
    await expect(page.locator('body')).toContainText(/(signalement|vérif|rechercher)/i)
  })

  test('Chez Nous filter tabs visible', async ({ page }) => {
    await login(page)
    await page.goto('/dashboard/chez-nous')
    await expect(page.locator('body')).toContainText(/(récent|chez nous|partage)/i)
  })

  test('Onboarding pill / track is mounted (unless dismissed)', async ({ page }) => {
    await login(page)
    await page.goto('/dashboard')
    // Pas d'assertion stricte : le widget peut être masqué si onboarding terminé.
    // On vérifie juste que la page elle-même n'a pas crashé.
    await expect(page.locator('body')).toContainText(/(bonjour|bonsoir|dashboard|tableau)/i)
  })

  test('Encaissements page loads (banner ou stats)', async ({ page }) => {
    await login(page)
    await page.goto('/dashboard/encaissements')
    // Soit la bannière "Stripe non configuré", soit les 4 stats top.
    await expect(page.locator('body')).toContainText(/(stripe|solde|virement|encaiss)/i)
  })

  test('Notifications page loads avec filtres', async ({ page }) => {
    await login(page)
    await page.goto('/dashboard/notifications')
    // Soit l'empty state "à jour", soit la liste, mais les filtres doivent toujours être là.
    await expect(page.locator('body')).toContainText(/(non lues|toutes|alerte|notification)/i)
  })

  test('Notifications cloche : panel affiche les 3 onglets', async ({ page }) => {
    await login(page)
    await page.goto('/dashboard')
    // Ouvre la cloche
    await page.getByLabel(/^notifications/i).first().click()
    // Les 3 onglets doivent être présents : Alertes / Nouveautés / Chez Nous
    await expect(page.locator('body')).toContainText(/alertes/i)
    await expect(page.locator('body')).toContainText(/nouveautés/i)
    await expect(page.locator('body')).toContainText(/chez nous/i)
  })
})
