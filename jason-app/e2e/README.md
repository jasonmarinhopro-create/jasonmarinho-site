# Tests E2E Playwright

Tests end-to-end pour l'app Next.js.

## Installation

```bash
cd jason-app
npm install --save-dev @playwright/test
npx playwright install --with-deps chromium
```

## Lancer les tests

Le serveur Next doit tourner sur `http://localhost:3000` (ou ailleurs via `E2E_BASE_URL`) :

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:e2e            # mode headless
npm run test:e2e:ui         # mode UI interactif
npx playwright test --debug # pas-à-pas
```

Ou pour démarrer automatiquement le serveur depuis Playwright :

```bash
E2E_AUTO_START=1 npm run test:e2e
```

## Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `E2E_BASE_URL` | `http://localhost:3000` | URL racine de l'app |
| `E2E_USER_EMAIL` | _(skip)_ | Compte de test pour `auth.spec.ts` |
| `E2E_USER_PASSWORD` | _(skip)_ | Mot de passe associé |
| `E2E_AUTO_START` | `0` | `1` = Playwright démarre `next dev` |

Crée un user de test dédié en Supabase (pas un compte réel) avant de lancer les tests authentifiés.

## Fichiers

- `smoke.spec.ts` : checks minimaux qui n'ont pas besoin de credentials (homepage, login form, /sign/[bad-token] → 404)
- `auth.spec.ts` : flow de login + accès /dashboard/chez-nous. Skip si pas de creds.

## À étendre

- Signature de contrat (créer un contrat fixture en base puis suivre le flow `/sign/[token]`)
- Création de logement
- Stripe Connect onboarding (mode test)
- Création de post chez-nous + commentaire
