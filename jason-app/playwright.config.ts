import { defineConfig, devices } from '@playwright/test'

// Tests E2E pour l'app Next.js. Lancer avec :
//   npm run test:e2e               (mode headless)
//   npm run test:e2e:ui            (mode UI Playwright)
//   npx playwright test --debug    (mode debug pas-à-pas)
//
// Variables d'env requises pour les tests authentifiés :
//   E2E_BASE_URL          (défaut http://localhost:3000)
//   E2E_USER_EMAIL        (compte de test, sinon les tests sont skip)
//   E2E_USER_PASSWORD

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // On garde uniquement Chromium par défaut pour aller vite. Décommenter
    // pour étendre à Firefox / WebKit / Mobile :
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
    // { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
  // Optionnel : démarre `next dev` automatiquement avant les tests si
  // la variable d'env le demande. Sinon il faut lancer le serveur soi-même.
  webServer: process.env.E2E_AUTO_START === '1' ? {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  } : undefined,
})
