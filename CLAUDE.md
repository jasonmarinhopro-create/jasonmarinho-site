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

### Conciergerie (contrats pour propriétaire tiers)
- `ContractModal.tsx` (création de contrat) : quand un logement sélectionné a un `proprietaire_nom` renseigné (conciergerie), le bailleur du contrat devient ce propriétaire (prénom/nom reconstruits par split sur le premier espace, email, téléphone) au lieu du profil de l'utilisateur connecté. `clearLogement()` revient au profil utilisateur si le logement est désélectionné.
- `/sign/[token]` : l'IBAN affiché au locataire (`IbanSection`) vient du logement (`logements.iban`/`bic`) s'il est renseigné, sinon fallback sur `profiles.iban`/`bic` de l'utilisateur connecté — l'argent doit aller au propriétaire réel, pas à l'utilisateur qui gère le logement.

### Contrat multilingue (sélecteur FR/PT/EN)
- `contracts.langue` (`'fr' | 'pt'`, migration `20260914_099`, défaut `fr`) : choisi à la création dans `ContractModal.tsx` (étape "Locataire"), sert de **langue par défaut** à l'ouverture de `/sign/[token]`.
- `ContractView.tsx` (client component, extrait de `page.tsx` qui ne fait plus que le data-fetching) : boutons 🇫🇷 FR / 🇵🇹 PT / 🇬🇧 EN tout en haut de la page, `useState<UiLang>` bascule instantanément **tout** le corps du contrat (Articles 1-10, bannières, prix, paiement, footer) dans la langue cliquée, sans rechargement. Toujours les 3 langues disponibles, indépendamment de `contracts.langue` (qui ne fixe que le choix initial). Voir `lib/sign-ui-i18n.ts` (chrome UI) et `lib/contract-templates.ts` (texte légal : `CONTRACT_TEMPLATES[pays][langue]`, `fr`/`pt`/`en` pour FR et PT).
- Les champs libres rédigés par le bailleur (description du logement, `conditions_annulation`, `reglement_interieur`) ne peuvent **pas** être traduits automatiquement par le code (texte libre, pas de traduction fiable sans API externe). Solution retenue : champs `description_pt`/`_en`, `conditions_annulation_pt`/`_en`, `reglement_interieur_pt`/`_en` sur `logements` (migration `20260914_100`) et sur `contracts` (snapshot copié à la création comme les champs de base) — saisis manuellement une fois sur la fiche logement (`LogementDetail.tsx`, `LangTextarea` avec onglets FR/PT/EN dans chaque `EditableCard`), repris automatiquement par `ContractModal.tsx` à la sélection du logement. Si absents, `ContractView.tsx` retombe sur le texte français, **sauf** pour les clauses par défaut (`DEFAULT_ANNULATION`/`DEFAULT_REGLEMENT`, `lib/contract-default-clauses.ts`) : si le texte stocké est identique au défaut FR non modifié, `resolveClauseText()` bascule sur la traduction par défaut correspondante sans rien stocker de plus — fonctionne même pour des contrats créés avant ce système.
- Coordonnées bancaires (IBAN/BIC) affichées directement dans le corps du contrat (Article 4, `ContractIbanBlock.tsx`, avec boutons copier), pas seulement dans le bloc de paiement post-signature (`IbanSection.tsx`) — visible dès avant la signature.
- L'interface du bloc de signature (`SignaturePage.tsx`) a son propre système i18n indépendant (fr/en/es/pt/de, auto-détecté via `navigator.language`, changeable manuellement) : ne pas confondre avec le sélecteur de `ContractView.tsx`, qui pilote le corps du contrat lui-même (limité à fr/pt/en, les seules langues couvertes par `contract-templates.ts`).
- **Emails au locataire** (`lib/email/contract-i18n.ts`, `toEmailLang()`/`CONTRACT_EMAIL_I18N`) : suivent `contracts.langue` (fr ou pt, pas de 3e langue ici) — invitation à signer (`contract-actions.ts`), confirmation de signature (`app/api/contracts/sign/route.ts`, `guestEmailHtml` uniquement), rappel de paiement (`app/api/contracts/resend-payment/route.ts`). Les emails envoyés au **bailleur** (Jason ou l'hôte) restent toujours en français quelle que soit `contracts.langue` : c'est lui qui utilise le dashboard en français, indépendamment de la langue du contrat signé avec son locataire.

### Locataire professionnel + facturation
- `ContractModal.tsx` (étape "Locataire") : toggle Particulier/Professionnel. En professionnel, `locataire_structure` + `locataire_nif` sont saisis en plus du signataire (prénom/nom) — affichés sur `/sign/[token]` (Article 1) comme "[Structure], Représenté(e) par [Signataire], NIF : [nif]".
- **Facture** (`app/invoice/[token]/page.tsx`, page publique token-based comme `/sign/[token]`) : émise via `issueInvoice()` (`contract-actions.ts`), déclenchée par le bouton facture dans `VoyageurDetail.tsx` (visible une fois le contrat signé). Numérotation séquentielle sans trou via `issue_next_invoice_number()` (fonction SQL, incrémente `profiles.invoice_counter` de façon atomique, format `FA{année}-{0000}`) — obligation légale, jamais générée côté JS pour éviter les doublons/trous en cas d'appels concurrents. Idempotent : un contrat déjà facturé retourne son numéro existant sans en générer un nouveau.
- **Infos fiscales du bailleur** : `profiles.entreprise_numero` (SIRET/NIF) + `profiles.mention_tva` (éditables dans `/dashboard/profil`, `ProfilForm.tsx`), avec override par logement (`logements.numero_fiscal`/`mention_tva`, conciergerie — même priorité que l'IBAN) snapshotés sur le contrat (`bailleur_numero_fiscal`/`bailleur_mention_tva`) à l'émission de la facture.
- ⚠️ **Mention TVA — pas de défaut** : `profiles.mention_tva` n'a **plus** de valeur par défaut (migration `20260915_102`, corrige un bug de la migration `101` : le défaut français "TVA non applicable, article 261 D 4° du CGI" avait été appliqué automatiquement à TOUS les profils existants, y compris les hôtes portugais pour qui ce texte est légalement faux). L'hôte doit saisir lui-même la mention correcte dans `/dashboard/profil` selon son pays/statut réel — texte FR ci-dessus valable pour la location meublée de tourisme SANS prestations parahôtelières en France (à ne pas confondre avec la franchise en base art. 293B), IVA 6% obligatoire (jamais "non applicable") pour le Portugal. Jason Marinho n'a pas connaissance du statut fiscal exact de chaque hôte et ne peut pas le déduire automatiquement.
- ⚠️ **Risque légal volontairement non couvert** : générer une "vraie" facture avec TVA nécessite en général un logiciel de facturation certifié anti-fraude (France : NF525 ; Portugal : logiciel certifié obligatoire dès que TVA facturée) — cette page ne l'est PAS. Le document généré ici est correct pour un hôte en exonération de TVA (cas par défaut) mais ne doit pas être utilisé comme système de facturation certifié par un hôte assujetti à la TVA — le rediriger vers un outil dédié dans ce cas.
- ⚠️ **Cas Alojamento Local (Portugal)** : au Portugal, la facturation en Alojamento Local est **obligatoire** (même via Airbnb/Booking) et **exclusivement** via le Portail des Finances (e-fatura, gratuit) ou un logiciel certifié AT depuis 2024 (facture Excel/Word explicitement interdite). L'IVA n'est **pas toujours** à 6% (correction d'une affirmation précédente trop générale) : un hôte sous le seuil petite entreprise peut être au **regime de isenção** (article 53º du CIVA, 0% IVA), l'équivalent portugais de la franchise en base française (art. 293B) — vu en pratique sur une vraie fatura AT (`ATCUD`, exonération art. 53º nº1 CIVA) émise pour Casa do Pedreiro. `app/invoice/[token]/page.tsx` affiche donc un bandeau d'avertissement (`isPortugueseAL`, quand `contract.pays === 'PT'`) précisant que ce document n'est PAS une fatura valide et renvoyant vers le Portail des Finances — la page ne prétend jamais être conforme pour un logement portugais, contrairement au cas FR (exonération TVA) où elle l'est. **Décision (sept. 2026) : Jason émet lui-même les vraies faturas de ses logements portugais directement sur le Portail des Finances (gratuit, en dehors de l'app) — aucune intégration Moloni ou équivalent prévue côté app, le bandeau d'avertissement suffit.**
- La caution (`montant_caution`) n'apparaît jamais sur la facture : ce n'est pas un revenu, juste un dépôt de garantie remboursable.

---

## Base de données

### Tables principales
| Table | Description |
|-------|-------------|
| `profiles` | Profil utilisateur, role ('user'/'admin'), plan, Stripe account |
| `logements` | Propriétés de l'hôte. Conciergerie : `proprietaire_nom`/`proprietaire_email`/`proprietaire_telephone`/`honoraires_pct` quand géré pour un propriétaire tiers, `iban`/`bic` du propriétaire (migration `20260914_098`) prioritaires sur `profiles.iban`/`bic` sur `/sign/[token]` — voir note ContractModal ci-dessous |
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
- **Acompte à la réservation** (`contracts.acompte_percent`, migration `20260914_097`) : distinct de la caution — c'est une part du **loyer** encaissée pour bloquer la réservation (50% ou 100%, choisi à la création du contrat dans `ContractModal.tsx`). Quand < 100%, `app/api/stripe/payment/create/route.ts` n'encaisse que ce pourcentage du loyer ; le solde restant n'a **pas** de suivi Stripe automatisé, affiché sur le contrat (`/sign/[token]`) comme "à régler à l'arrivée" mais réglable par n'importe quel moyen convenu avec le locataire.
- **Caution** : PaymentIntent `capture_method: 'manual'` (bloqué, capturé ou libéré après séjour). Jamais confondue avec l'acompte : la caution n'est jamais un paiement de loyer, elle est intégralement remboursée après l'état des lieux.
- **Webhooks** : signature vérifiée dans `app/api/stripe/webhooks/route.ts`

---

## Publication réseaux sociaux

Publication auto (immédiate ou programmée) vers les comptes Facebook/Instagram de l'entreprise, depuis `/dashboard/admin/social`. Conçu pour être étendu réseau par réseau (LinkedIn, Pinterest, X, TikTok) sans changer le socle.

- **Modèle** : `social_accounts` (comptes connectés, token chiffré), `social_posts` (le post, écrit une fois), `social_post_targets` (résultat par réseau — un échec sur une plateforme n'affecte pas les autres). Migration `20260821_086`.
- **Auth Meta** : OAuth via `app/api/social/connect/meta` → `app/api/social/callback/meta`. Aucune revue d'app Meta requise tant qu'on publie uniquement sur les comptes où Jason est Admin/Testeur de l'app (mode développement). La revue ne devient obligatoire que pour publier au nom de comptes tiers.
- **Tokens** : chiffrés (AES-256-GCM, `lib/security/crypto.ts`) avant écriture en base — jamais en clair, clé dédiée `SOCIAL_TOKENS_ENCRYPTION_KEY` (séparée de `SUPABASE_SERVICE_ROLE_KEY`).
- **Publication** : `lib/social/dispatch.ts` — même chemin de code pour "publier maintenant" (`app/dashboard/admin/social/actions.ts`) et pour les posts programmés. Facebook et Instagram publient en parallèle (`Promise.all`) plutôt que l'un après l'autre : Instagram peut prendre du temps pour le traitement du média côté Meta (`waitForMediaReady`, plafonné à ~34s — resserré depuis ~52s après un vrai 504 en prod sur un seul post dans la file : même en parallèle avec Facebook, ce plafond + le reste de la requête suffisait à dépasser le timeout dur de 60s de la fonction Vercel) — un post pouvait alors se retrouver bloqué en "pending" alors que la publication avait réellement eu lieu côté Meta (la fonction tuée juste avant l'écriture du statut en base). `dispatchDuePosts()` s'arrête aussi proprement avant son propre budget de 50s sur un gros backlog de posts en retard (ce budget ne peut cependant pas interrompre un post déjà en cours de traitement, d'où le plafond serré côté Instagram) — le reste est repris au passage suivant.
- **Déclenchement programmé** : **Vercel Cron natif** (`jason-app/vercel.json`, `/api/cron/social-dispatch`, une fois par jour — `0 7 * * *` UTC) — plan Hobby limité à une exécution/jour par cron, donc pas de précision à 5 min près, mais natif à Vercel, zéro dépendance externe, zéro compte à configurer. L'heure (7h UTC) est calée sur l'usage réel : Jason programme ses posts à 8h heure de Paris, qui vaut 6h UTC en été (CEST, UTC+2) ou 7h UTC en hiver (CET, UTC+1) — 7h UTC les fait donc partir dans l'heure en hiver, avec 1h de retard max en été (Vercel peut de toute façon invoquer le cron n'importe quand dans l'heure indiquée, pas pile à la minute). Si la cadence change un jour (heure différente de 8h Paris), ajuster ce cron en conséquence. Authentifié par `CRON_SECRET` (auto-injecté par Vercel). **Pas GitHub Actions** en continu : sur un cron toutes les 5 minutes, GitHub retarde ou saute massivement les exécutions (observé : 2-5h d'écart réel au lieu de 5 min, inutilisable pour une planification fiable). **Pas Upstash QStash** non plus : envisagé un temps, jamais configuré côté Jason (aucun compte/schedule créé), abandonné. `.github/workflows/social-dispatch.yml` existe encore mais en déclenchement manuel uniquement (`workflow_dispatch`, avec `SOCIAL_CRON_SECRET`), pour forcer un passage entre deux exécutions du cron Vercel — la route accepte les deux secrets (`CRON_SECRET` ou `SOCIAL_CRON_SECRET`). Ne pas réactiver un trigger automatique GitHub en parallèle du cron Vercel : ça déclencherait deux dispatches concurrents du même post dû (pas de verrou atomique sur `dispatchDuePosts()`, risque de publication en double). Si une précision meilleure qu'1x/jour devient nécessaire un jour : Upstash QStash (Console Upstash → QStash → Schedules, même compte que Redis) reste l'option la plus simple.
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
