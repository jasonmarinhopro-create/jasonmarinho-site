# CLAUDE.md — Jason Marinho LCD Platform

Référence pour les sessions Claude Code. À mettre à jour dès qu'un pattern ou une décision importante est ajouté.

---

## Architecture

```
/                          ← site statique marketing (Vercel)
  index.html               ← homepage
  nav.js                   ← navigation injectée dynamiquement sur toutes les pages
  footer.js                ← footer injecté dynamiquement
  cookie-banner.js         ← bandeau RGPD
  vercel.json              ← redirects + headers sécurité + cache
  sitemap.xml              ← 150+ URLs, regenerate sans trailing slash sauf /
  services/*/index.html    ← pages services publiques
  blog/*/index.html        ← 133+ articles de blog
  pour-qui/*/index.html    ← pages audience
  guides/                  ← guides LCD

jason-app/                 ← dashboard Next.js (app.jasonmarinho.com)
  app/                     ← App Router Next.js 14
    dashboard/             ← routes protégées (auth required)
    admin/                 ← admin only (role = 'admin')
    api/                   ← API routes (Stripe webhooks, iCal, contracts)
    auth/                  ← login / register / reset
    sign/[token]/          ← signature de contrats (public, token-based)
  components/              ← composants partagés
  lib/                     ← queries, cache, security, email, supabase
  supabase/migrations/     ← toutes les migrations DOIVENT être préfixées YYYYMMDD_NNN_nom.sql
```

---

## Stack technique

| Couche | Choix |
|--------|-------|
| Framework | Next.js 14 App Router |
| Auth + DB | Supabase (PostgreSQL + RLS) |
| Paiements | Stripe Connect (loyer + caution) |
| Emails | Resend |
| Icons | `@phosphor-icons/react/dist/ssr` (TOUJOURS /dist/ssr, jamais le package racine) |
| Fonts | next/font Fraunces + Outfit (self-hosted, display:swap) |
| Analytics | Vercel Analytics + SpeedInsights (pas de gtag) |
| Déploiement | Vercel (site statique + Next.js app séparés) |

---

## Conventions critiques

### Rédaction de contenu (formations, blog, pages du site)
- **Jamais de tiret cadratin (—)** dans le texte destiné aux utilisateurs (leçons de formation, articles de blog, pages marketing). Utiliser deux-points, parenthèses ou reformuler. (N'affecte pas CLAUDE.md lui-même, qui est de la doc interne.)
- Contenu des leçons (`content.ts`) : écrire directement dans le Markdown supporté par `components/formations/FormationView.tsx` (`## `/`### ` titres, `- ` listes, `✅ `/`❌ ` listes colorées — préfixe seul, jamais combiné avec `- `, tables `| a | b |`, `> ` citations pour les sources). **Ne jamais** utiliser de lignes `---` comme séparateur ni d'en-tête ASCII (`MODULE X · LEÇON Y` + lignes `───`) : non supportés, s'affichent en texte brut. Les cellules de tableau n'interprètent pas le Markdown inline (`**gras**`) — texte brut uniquement.
- Sujets sensibles (fiscalité, juridique) : toujours vérifier les faits par recherche web avant rédaction (les règles changent chaque année), citer la source en `> Source : ...` sous l'affirmation.

### Auth
- **Toujours `getUser()`** dans les server actions et pages sensibles — valide le JWT côté serveur
- `getSession()` est autorisé seulement dans middleware.ts pour les routes publiques (économie de RTT)
- Les routes admin vérifient `profile.role === 'admin'` après getUser()

### Phosphor Icons
```typescript
// CORRECT
import { House, Check } from '@phosphor-icons/react/dist/ssr'

// INTERDIT — charge PhosphorContext inutilement
import { House } from '@phosphor-icons/react'
```

### Sécurité SQL
- Toujours échapper les inputs ILIKE : `.replace(/[%_\\,]/g, '\\$&')` avant interpolation
- Jamais de `dangerouslySetInnerHTML` sans `escapeHtml()` préalable (voir `lib/chez-nous/markdown.ts`)
- Énumérer les colonnes dans les `.select()` quand moins de 6-7 champs sont utilisés

### Migrations SQL
- Nommage obligatoire : `YYYYMMDD_NNN_description.sql`
- Ex: `20260502_023_add_nouvelle_feature.sql`
- Jamais de fichier sans préfixe date (non-déterministe sous supabase db push)

### Styles
- Inline styles `style={{...}}` partout (pas de Tailwind, pas de CSS modules)
- Variables CSS globales dans `globals.css` : `var(--accent-text)`, `var(--bg)`, `var(--surface)`, etc.
- Design tokens couleurs : `--green: #63D683`, `--yellow: #FFD56B`, `--blue: #93C5FD`, `--pink: #F472B6`

### next/image
- Supabase storage déjà dans `remotePatterns` dans `next.config.js`
- Pour les images dynamiques (ex: couvertures logements) : utiliser `fill` + `sizes`

---

## Base de données

### Tables principales
| Table | Description |
|-------|-------------|
| `profiles` | Profil utilisateur, role ('user'/'admin'), plan, Stripe account |
| `logements` | Propriétés de l'hôte |
| `voyageurs` | Carnet de voyageurs |
| `sejours` | Séjours/réservations |
| `contracts` | Contrats de location (signe/en_attente/annule) |
| `revenus_entries` | Saisie revenus LCD |
| `user_formations` | Accès aux formations (acheté ou offert) |
| `formation_modules` / `formation_lessons` | Contenu des formations |
| `reported_guests` | Signalements voyageurs (vérification) |
| `chez_nous_posts` | Posts du forum |
| `audit_gbp_sessions` | Sessions audit Google Business Profile |
| `sejour_incidents` | Fiches incidents par séjour |
| `roadmap_items` | Feuille de route publique |
| `social_accounts` | Comptes réseaux sociaux connectés (tokens chiffrés) |
| `social_posts` / `social_post_targets` | Posts réseaux sociaux et leur statut par plateforme |

### RLS
- RLS activé sur toutes les tables utilisateurs
- Pour vérifier : `SELECT relname FROM pg_class WHERE relkind='r' AND relnamespace='public'::regnamespace AND NOT relrowsecurity;`

---

## SEO (site statique)

- **Trailing slash** : `vercel.json` est à `trailingSlash: false`. Les URLs canoniques et le sitemap doivent être SANS slash final (sauf homepage `/`)
- **OG image** : `https://jasonmarinho.com/couverture-jason.webp` (1200×630) sur toutes les pages
- **Schemas JSON-LD** : BlogPosting + BreadcrumbList sur tous les articles, FAQPage/HowTo sur les guides
- **Liens internes** : chaque article doit avoir au moins 1 lien contextuel vers /services/*
- **llms.txt** : existe à la racine pour la search IA, à maintenir

---

## Patterns d'état côté client

```typescript
// Pattern optimiste standard
const [items, setItems] = useState(initialItems)

function toggle(id: string) {
  setItems(prev => /* changement optimiste */)
  serverAction(id).catch(() => {
    setItems(prev => /* rollback */)
  })
}
```

---

## Emails (Resend)

Templates dans `lib/email/template.ts` avec helpers :
- `buildEmail({ title, body })` — wrapper principal dark theme
- `emailInfoBlock([{ label, value }], color)` — tableau infos
- `emailBtn(href, label, type)` — bouton CTA
- `emailP(text)` — paragraphe
- `escHtml(s)` — échapper HTML dans les emails

---

## Stripe

- **Connect** : chaque hôte a son propre `stripe_account_id` dans profiles
- **Loyer** : PaymentIntent sur le compte connecté
- **Caution** : PaymentIntent `capture_method: 'manual'` (bloqué, capturé ou libéré après séjour)
- **Webhooks** : signature vérifiée dans `app/api/stripe/webhooks/route.ts`

---

## Publication réseaux sociaux

Publication auto (immédiate ou programmée) vers les comptes Facebook/Instagram de l'entreprise, depuis `/dashboard/admin/social`. Conçu pour être étendu réseau par réseau (LinkedIn, Pinterest, X, TikTok) sans changer le socle.

- **Modèle** : `social_accounts` (comptes connectés, token chiffré), `social_posts` (le post, écrit une fois), `social_post_targets` (résultat par réseau — un échec sur une plateforme n'affecte pas les autres). Migration `20260821_086`.
- **Auth Meta** : OAuth via `app/api/social/connect/meta` → `app/api/social/callback/meta`. Aucune revue d'app Meta requise tant qu'on publie uniquement sur les comptes où Jason est Admin/Testeur de l'app (mode développement). La revue ne devient obligatoire que pour publier au nom de comptes tiers.
- **Tokens** : chiffrés (AES-256-GCM, `lib/security/crypto.ts`) avant écriture en base — jamais en clair, clé dédiée `SOCIAL_TOKENS_ENCRYPTION_KEY` (séparée de `SUPABASE_SERVICE_ROLE_KEY`).
- **Publication** : `lib/social/dispatch.ts` — même chemin de code pour "publier maintenant" (`app/dashboard/admin/social/actions.ts`) et pour les posts programmés. Facebook et Instagram publient en parallèle (`Promise.all`) plutôt que l'un après l'autre : Instagram peut prendre jusqu'à ~52s (traitement du média côté Meta, `waitForMediaReady`) et enchaîner après Facebook rapprochait dangereusement le total du timeout de 60s de la fonction Vercel — un post pouvait alors se retrouver bloqué en "pending" alors que la publication avait réellement eu lieu côté Meta (la fonction tuée juste avant l'écriture du statut en base). `dispatchDuePosts()` s'arrête aussi proprement avant son propre budget de 50s sur un gros backlog de posts en retard, plutôt que de risquer le même timeout au niveau du batch — le reste est repris au passage suivant.
- **Déclenchement programmé** : **Vercel Cron natif** (`jason-app/vercel.json`, `/api/cron/social-dispatch`, une fois par jour — `0 20 * * *` UTC, en fin de journée pour rattraper le plus possible de posts dus le jour même en un seul passage) — plan Hobby limité à une exécution/jour par cron, donc pas de précision à 5 min près, mais natif à Vercel, zéro dépendance externe, zéro compte à configurer. Authentifié par `CRON_SECRET` (auto-injecté par Vercel). **Pas GitHub Actions** en continu : sur un cron toutes les 5 minutes, GitHub retarde ou saute massivement les exécutions (observé : 2-5h d'écart réel au lieu de 5 min, inutilisable pour une planification fiable). **Pas Upstash QStash** non plus : envisagé un temps, jamais configuré côté Jason (aucun compte/schedule créé), abandonné. `.github/workflows/social-dispatch.yml` existe encore mais en déclenchement manuel uniquement (`workflow_dispatch`, avec `SOCIAL_CRON_SECRET`), pour forcer un passage entre deux exécutions du cron Vercel — la route accepte les deux secrets (`CRON_SECRET` ou `SOCIAL_CRON_SECRET`). Ne pas réactiver un trigger automatique GitHub en parallèle du cron Vercel : ça déclencherait deux dispatches concurrents du même post dû (pas de verrou atomique sur `dispatchDuePosts()`, risque de publication en double). Si une précision meilleure qu'1x/jour devient nécessaire un jour : Upstash QStash (Console Upstash → QStash → Schedules, même compte que Redis) reste l'option la plus simple.
- **Adaptateurs** : un module par réseau (`lib/social/meta.ts` pour Facebook + Instagram — Instagram réutilise le token de la Page Facebook liée, pas de token IG séparé).
- **Cadence** : une config partagée (`social_cadence`, jours + heure), le composeur calcule côté client le prochain créneau libre sans collision avec un post déjà programmé.
- **Texte par réseau** : `social_post_targets.body_override`, fallback sur `social_posts.body` au dispatch.
- **Stats** : likes/commentaires récupérés à la demande depuis l'API Meta (pas de cron dédié), stockés sur `social_post_targets`.
- **Instagram — traitement asynchrone** : `media_publish` doit attendre `status_code=FINISHED` sur le conteneur média (poll dans `waitForMediaReady`, `lib/social/meta.ts`) sinon erreur "Media ID is not available". `maxDuration=60` sur la page pour laisser le temps à cette attente.
- **Onglet Statistiques** : `SocialStats.tsx` — tuiles de synthèse, répartition des statuts, graphique hebdomadaire Facebook/Instagram (SVG fait main), classement des posts par engagement. Constantes plateforme (`PLATFORM_META`, `IMPLEMENTED_PLATFORMS`, `ALL_PLATFORMS`) extraites dans `constants.ts` pour éviter un import circulaire entre `SocialAdmin.tsx` et `SocialStats.tsx`. Bouton "Actualiser tout" → `refreshAllStats` (`lib/social/dispatch.ts`), rafraîchit toutes les cibles publiées en une fois.
- **Onglet Réponses auto** (`SocialAutoReply.tsx`, migration `20260827_096`) : réponse automatique en message privé (DM) quand un commentaire Facebook/Instagram contient un mot-clé configuré ("commente GUIDE pour recevoir le lien"). **Meta ne donne jamais l'email d'un commentateur** — la réponse privée via `/{comment-id}/private_replies` (`sendPrivateReply`, `lib/social/meta.ts`) est la seule voie automatisée, pas d'email réel possible côté réseaux sociaux. Webhook entrant : `app/api/social/webhook/meta/route.ts` (GET = handshake `hub.challenge`/`META_WEBHOOK_VERIFY_TOKEN`, POST = événements, signature vérifiée via `X-Hub-Signature-256` + `META_APP_SECRET`) → à configurer côté Meta App (produit Webhooks, callback = cette route, cocher les champs `feed` et `comments` dans les cas d'utilisation Pages/Instagram — une fois par app, dans le dashboard Meta). Correspondance mot-clé + envoi : `lib/social/comment-triggers.ts` (`handleIncomingComment`) — table `social_comment_triggers` (règles) + `social_comment_replies` (journal, sert aussi de verrou d'idempotence via la contrainte unique `(platform, comment_id)` puisque Meta redélivre parfois le même événement). Ne fonctionne que sur des commentaires récents (fenêtre de quelques jours côté Meta pour les réponses privées).
  - **Abonnement de la Page au webhook** : PAS via le flow "Générer un token" du dashboard Meta (popup de login Instagram peu fiable, échoue souvent) — `subscribePageWebhooks()` (`lib/social/meta.ts`) appelle `POST /{page-id}/subscribed_apps?subscribed_fields=feed` automatiquement à chaque connexion/reconnexion Meta (`app/api/social/callback/meta/route.ts`), non bloquant. Nécessite les permissions `pages_manage_metadata` (abonnement webhook Page), `pages_messaging` (réponse privée Facebook), `instagram_manage_comments` + `instagram_manage_messages` (Instagram) — si `META_LOGIN_CONFIG_ID` est défini, ces permissions doivent être ajoutées à la Configuration côté Meta (Facebook Login for Business → Configurations), pas seulement dans le `scope` du code. Après avoir ajouté ces permissions côté Meta, il suffit de recliquer "Connecter Facebook / Instagram" dans Admin → Réseaux sociaux pour tout reconfigurer.

---

## Variables d'environnement requises

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY        ← server-side seulement, jamais NEXT_PUBLIC_
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
NEXT_PUBLIC_APP_URL
UPSTASH_REDIS_REST_URL           ← rate limiting (optionnel, fallback in-memory)
UPSTASH_REDIS_REST_TOKEN
# Variables injectées automatiquement par l'intégration Vercel × Upstash :
UPSTASH_REDIS_REST_KV_REST_API_URL
UPSTASH_REDIS_REST_KV_REST_API_TOKEN
META_APP_ID                      ← publication Facebook/Instagram, developers.facebook.com/apps
META_APP_SECRET
META_LOGIN_CONFIG_ID             ← Facebook Login for Business → Configurations, requis pour les permissions Instagram Business
SOCIAL_TOKENS_ENCRYPTION_KEY     ← chiffrement tokens OAuth réseaux sociaux, `openssl rand -base64 32`
SOCIAL_CRON_SECRET               ← dispatch programmé réseaux sociaux en déclenchement manuel/forcé (workflow_dispatch GitHub) ; le cron quotidien natif Vercel utilise CRON_SECRET (auto-injecté), cf. section Publication réseaux sociaux
META_WEBHOOK_VERIFY_TOKEN        ← handshake webhook commentaires Meta, app/api/social/webhook/meta (n'importe quelle chaîne, choisie par Jason, à re-saisir côté Meta App)
```

## Rate limiting (Upstash Redis)

`lib/security/rate-limit.ts` détecte automatiquement les variables Upstash — supporte les deux formats :
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (manuelles)
- `UPSTASH_REDIS_REST_KV_REST_API_URL` + `UPSTASH_REDIS_REST_KV_REST_API_TOKEN` (injectées par l'intégration Vercel × Upstash)

Si absentes, fallback in-memory (par lambda) — utile en dev local.

Setup via intégration Vercel (méthode recommandée) :
1. Vercel Dashboard → Storage → Connect → Upstash for Redis
2. Région `iad1` (US East, aligne avec les fonctions Vercel)
3. Prefix `UPSTASH_REDIS_REST` → variables auto-injectées en Production + Preview
4. Redeploy automatique

Routes protégées : `/api/login`, `/api/register`, `/api/send-reset-email`, `/api/contracts/sign`, `/api/ideas/submit`, `/api/ideas/vote`, `/api/checkin/submit`.

---

## Performance — points de vigilance

1. **Phosphor /dist/ssr** : ne jamais importer depuis la racine du package
2. **select('*')** : énumérer les colonnes sauf quand >8 colonnes toutes utilisées
3. **Formation content** : 18 fichiers `content.ts` ~1000-4000 lignes chacun. Tables `formation_modules` + `formation_lessons` créées (migration `20260502_023`). Pour seeder le contenu en DB, lancer depuis `jason-app/` :
   ```
   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
     node scripts/seed-formations-content.mjs
   ```
   Une fois en DB, `getFormationDbContent()` lit la DB en priorité et le fallback statique sert juste de safety net.
4. **Pas de gtag** : analytics via Vercel Analytics uniquement
5. **Cache-Control immutable** : configuré dans vercel.json pour /fonts/* et *.webp

---

## Domaines

- `jasonmarinho.com` → site statique Vercel
- `app.jasonmarinho.com` → Next.js dashboard Vercel
