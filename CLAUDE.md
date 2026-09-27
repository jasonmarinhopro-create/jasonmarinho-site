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

### Clé service role (contourne la RLS)
- **Point d'accès unique** : `getServiceClient()` de `@/lib/supabase/service` (`import 'server-only'` : le build échoue si un composant client l'importe). 52 copies locales de `getServiceClient()` ont été remplacées par cet import (sept. 2026).
- **Préférer le client utilisateur** (`@/lib/supabase/server`) : la RLS protège même si une requête oublie un filtre. Pages « Demandes reçues » / « Mes clients » des pros déjà basculées (policies des migrations 062 et 069).
- **Usages légitimes du service role** : routes publiques à jeton (contrat, check-in, facture, flux iCal), crons et webhooks, vues admin après vérification du rôle, compteurs globaux (signalements, places fondateur), requêtes en `unstable_cache` (pas d'accès aux cookies : `lib/queries/profile.ts`, `spaces.ts`, `active-property.ts`, `cache.ts`, `lib/lcd/dashboard-prefill.ts`), écritures croisées entre comptes (équipe de ménage → hôte). Toujours filtrer explicitement (`.eq('user_id', …)`).
- **Garde-fou CI** : `lib/supabase/service-role-guard.test.ts` échoue si un nouveau fichier lit `SUPABASE_SERVICE_ROLE_KEY` directement (liste des fichiers historiques figée, elle ne doit que rétrécir) ou si un composant client importe le service role.

### Gros composants : découpage
- `app/dashboard/calendrier/` (sept. 2026) : `CalendrierView.tsx` passé de 4 390 à ~2 670 lignes par extraction mécanique, code inchangé (vérifié ligne à ligne) : `calendrier-shared.tsx` (constantes `CAT`, `CHECKLIST_ITEMS`, types `CalEvent`/`CatKey`, helpers de dates, `parseQuickAdd`, `isRealReservation`…), `ListView.tsx` (vue liste), `SearchableCombobox.tsx`, `calendrier-styles.ts` (objet `s`). `CalEvent` reste ré-exporté depuis `CalendrierView`. Même méthode à appliquer aux autres fichiers > 2 000 lignes (`RevenusView.tsx` 3 737, `VoyageurDetail.tsx` 2 915, `PerformancesView.tsx` 2 426) : sortir d'abord les styles, constantes et sous-composants de premier niveau, sans toucher au corps du composant principal.

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
- **Responsive grands écrans (demande répétée de Jason)** : les pages du dashboard occupent toute la largeur (`width: '100%'`, jamais de `maxWidth` fixe sur le conteneur de page, seulement sur un paragraphe de texte). Au-delà de ~1200 px, remplir l'espace : 2 colonnes (contenu + colonne latérale collante, ex. `/dashboard/calendrier/menage`) ou grille `repeat(auto-fill, minmax(min(100%, 480px), 1fr))` (ex. historique des déclarations). Vérifier chaque nouvelle page à 1920, 1280 et 390 px avant de pousser.
- Variables CSS globales dans `globals.css` : `var(--accent-text)`, `var(--bg)`, `var(--surface)`, etc.
- Design tokens couleurs : `--green: #63D683`, `--yellow: #FFD56B`, `--blue: #93C5FD`, `--pink: #F472B6`
- **Pas de bleu sur les pages hôte (demande de Jason, sept. 2026) : toujours le vert de la marque** (`var(--accent-text)`, `var(--accent-bg)`, `var(--accent-border)`, touche de jaune `rgba(255,213,107,…)`), y compris pour Facebook et Google (pas de #1877F2 ni #4285F4). Pas de `var(--info)` pour décorer : bleu. Bannières d'en-tête des hubs : `components/dashboard/HubHero.tsx` (vert, eyebrow + titre avec `HeroEm` + 3 étapes + action + carte à droite via `aside`), utilisé par Groupes Facebook, Fiche Google, Formations et Guide LCD.

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
- **Balise `<title>` ≤ 60 caractères** (sept. 2026 : les 535 pages ont été ramenées sous 60, Google coupe au-delà). Mot-clé en tête, suffixe « | Jason Marinho » seulement s'il tient dans les 60. Le H1 et `og:title` peuvent rester longs. Pour un nouvel article, renseigner `seoTitle` (≤ 60) dans `scripts/articles/<slug>.mjs` quand le titre éditorial est long : `generate-article.mjs` l'utilise via `seoTitle()`. Les générateurs de pages villes (`build-pages-pros-villes.mjs`, `generate-city-revenue-articles.mjs`) produisent déjà des titres courts.
- **Pages ville ménage/photographe** (`menage-lcd-*`, `photographe-lcd-*`, générées par `scripts/build-pages-pros-villes.mjs`, indexées) : enrichissement local ville par ville via `scripts/data/villes-local.mjs` (faits vérifiés + sources : réglementation, taxe de séjour, pics de demande, conseils ménage/photo) injecté par `node scripts/inject-local-villes.mjs` (idempotent, marqueurs `LOCAL:START/END` et `LOCAL-FAQ:START/END`, ajoute aussi 2 questions à la FAQ HTML et JSON-LD). Fait pour les 60 villes (sept. 2026). Règle de prudence : 90 jours et règles de changement d'usage/compensation affirmés uniquement quand une source locale l'a confirmé (Paris, Lyon, Bordeaux, Marseille, Nice, Montpellier à 90 jours ; compensation/quotas confirmés à Annecy, Pays basque, La Rochelle, Saint-Malo, Colmar, Toulouse, Chamonix, etc.) ; ailleurs, helpers génériques `reg120()`/`taxeGen()` (plafond national 120 nuits + « vérifiez la délibération », taux 1 à 5 % voté localement). Versailles : taxe IDF Mobilités 200 %. Si le générateur est relancé, relancer l'injection ensuite. Décision de Jason : ne pas passer ces pages en noindex.
- **Liens internes** : vérifier qu'une URL existe avant de la citer. Anciennes URL mortes corrigées en sept. 2026 (ex. `/formations` → `/services/formations`, `/services/reservation-directe` → `/services/annonce-directe`, `/services/reglementation-lcd` → `/services/actualites`, `/services/fiscalite-lcd` → `/services/simulateurs`), avec redirections 301 de secours dans `vercel.json`.

- **Pages service alignées sur l'app (sept. 2026)** : 3 pages créées, `/services/contrats` (contrats signés en ligne FR/PT/EN, loyer Stripe sur le compte de l'hôte sans commission, caution par empreinte, facture), `/services/planning-menage` (ménages calculés depuis Airbnb/Booking/directes, lien agenda pour l'équipe, photos de fin de ménage) et `/services/declarations-voyageurs` (fiche de police FR, SIBA PT, check-in en ligne), avec FAQ HTML + JSON-LD synchronisées, même gabarit que `/services/calendrier`. `/services/entre-hotes` (URL conservée) décrit désormais Questions & réponses (réponse sous 48 h) ; `page.md` aussi. Liées depuis `nav.js` (desktop + mobile, « Gérer ton activité »), `footer.js`, `/services`, l'accueil, `/tarifs`, `llms.txt`, le sitemap. Plus de « forum » ni d'« audit GBP » dans les textes (« audit de ta fiche Google ») ; phrase d'appel des ~60 pages `devenir-hote-airbnb-*` mise à jour (le nombre de formations reste géré par `sync-counts.mjs`). Tarifs : Questions & réponses ouvert à tous, avec un plafond de 2 questions par mois calendaire (heure de Paris) en formule gratuite, illimité en Standard/Driing, réponses jamais limitées (décision de Jason, sept. 2026 ; `lib/chez-nous/quota.ts`, testé, vérifié côté serveur dans `createPost`, compteur et encart « Passer en Standard » dans `ChezNousFeed.tsx`), planning ménage et déclarations cochés dans les deux formules (pas de restriction dans le code), caution par empreinte en Standard. Audit de la fiche Google ouvert à tous (décision de Jason, sept. 2026 ; l'app ne le limite pas non plus).

### Liens affiliés (Lodgify, Hospitable, Shine, sept. 2026)
- Jason est affilié Lodgify (20 % de commission, 25 % au-delà de 3 000 $ de ventes, 30 % au-delà de 10 000 $). Une commission n'est générée que pour un client nouveau chez Lodgify qui reste abonné au moins 30 jours ; elle court sur 12 mois pour un abonnement mensuel, et elle est versée d'un coup pour un abonnement annuel. Un lead = une démo réservée ou un essai démarré, d'où les CTA vers la démo et l'essai plutôt que vers la page d'accueil de Lodgify.
- Liens FR à utiliser : essai 7 jours `https://app.lodgify.com/signup/fr/?afmc=ui1`, démo `https://app.lodgify.com/signup/book-demo/fr/?afmc=uhv`, tarifs `https://www.lodgify.com/fr/tarifs/?afmc=uhp`, onboarding gratuit `https://www.lodgify.com/fr/onboarding-gratuit/?afmc=uid` (liste complète dans le tableau de bord affilié, section "Highlighted Links").
- **Obligatoire** sur tout lien affilié : `rel="sponsored noopener"` + mention visible « Lien affilié » à côté (pratique commerciale trompeuse sinon, et Google pénalise les liens payants non signalés). Garder un ton honnête avec les limites de l'outil : c'est ce qui convertit.
- **Page `/partenaires`** (sept. 2026, remplace `/services/ecosysteme`, redirection 301 dans `vercel.json`, comme `/services/partenaires` et `/ressources/partenaires`) : Driing (partenaire principal, co-fondé par Jason, non rémunéré), cartes « offres » (réduction membre ou lien affilié, toujours badgé), section `#comparatifs` (liste des pages comparatif), section `#devenir-partenaire` (→ `/contact`), votes. **Marketplace** (sept. 2026, inspirée de la page partenaires de Shine) : rangée d'icônes de catégories, filtres en barre latérale (pastilles défilantes sur mobile), cartes logo/nom/offre/description sur 3 colonnes, filtre dans l'URL (`/partenaires#banque`, `#offres`). Générée par `node scripts/build-partenaires.mjs` depuis `scripts/data/partenaires.mjs` (marqueurs `MARKET:START/END`, ne pas éditer le HTML à la main) : offres (`badge` affilie/parrainage/membre/fondateur, liens `sponsored: true`) + outils référencés sans rémunération (lien vers le comparatif interne s'il existe, sinon site officiel en nofollow). Nouveau partenaire = une entrée dans `OUTILS`. **Cartes de hauteur identique** (demande de Jason : grille équilibrée) : en-tête logo + nom + badge (« Référencé » pour les outils non rémunérés), 1 ligne d'accroche (`offre`, sinon la 1re catégorie) coupée en « … », description limitée à 3 lignes, 2 liens maximum en bas. Écrire des `offre` courtes (~25 caractères) et des `desc` d'environ 100 caractères pour que rien ne soit coupé ; texte complet au survol (`title`). Assurances retirées du catalogue (Luko n'existe plus, aucune assurance vérifiée à recommander).
- **Menu Ressources** (`nav.js`, desktop `.n-mega-res` + accordéon mobile `#acc-res`) : cartes Blog et Partenaires + colonne « Plus » (Qui suis-je, Contact, Comparatifs, Guides, Actualités, Lexique). Blog/Qui suis-je/Contact ne sont plus des liens de premier niveau ; Guides, Actualités et Écosystème ont quitté le menu Services. Ne pas créer de page `/ressources` : l'URL redirige vers `/services`.
- **Menus Services et Tarifs, façon Shine** (sept. 2026, demande de Jason) : ordre `Services · Pour qui · Ressources · Tarifs` (plus d'entrée « Annuaire » séparée). **Services** (`.n-mega-sol`) : 4 domaines à gauche (Gérer ton activité, Chiffrer & investir, Te former & échanger, Trouver un pro = les 2 cartes de l'ancien menu Annuaire, `.n-sol-ann`, et `.mob-driing-card` en mobile), leurs fonctionnalités au centre (bascule au survol/focus/clic, `.n-sol-tab` → `.n-sol-panel`), colonne « Plus » + carte Sécurité voyageurs à droite, lien « Commence gratuitement » en bas. **Tarifs** (`.n-mega-tar`) : une carte visuelle par offre (Plateforme hôte, Photographes, Équipes ménage → `/tarifs#hote|#photographes|#menage`) + « Offres & aide » (Fondateur, Driing, `#compare`, `#garantie`, `#faq`). Ces deux menus larges sont `n-drop-wide` : centrés sur la page (le `<li>` passe en `position:static`) et collés sous la barre. En haut de `/tarifs`, trois cartes par public (`.aud-grid`, mêmes visuels que le menu, liens `#hote|#photographes|#menage`), **sans prix** : les montants ne vivent que dans les onglets (les places Fondateur les font varier), pour ne pas multiplier les endroits à tenir à jour. Sur `/tarifs`, `applyTarifsHash()` ouvre l'onglet et descend à la section, y compris sur `hashchange` (clic dans le menu depuis la page elle-même). Mobile : mêmes 4 domaines dans l'accordéon Services, Tarifs en accordéon. Les données des domaines sont dupliquées desktop/mobile dans `nav.js` : modifier les deux.
- Les liens `?v=` des subsets Phosphor dans `nav.js` sont écrits en entier (réécrits par `build-phosphor-subset.mjs`) : ne pas les reconstruire par concaténation.
- `nav.js` est inclus deux fois sur ~70 pages : les deux IIFE sont protégées par `window.__jmNavLoaded` / `window.__jmVisitSent` (sinon double menu et visites comptées deux fois).
- Pages : `/lodgify-avis`, `/lodgify-prix` (calculateur de rentabilité inline), `/tutoriel-lodgify-site-reservation-directe` (HowTo), plus les encadrés `.aff-lodgify` (styles inline) dans le comparatif Lodgify/Smoobu et 4 articles de blog. Les autres mentions de Lodgify dans le blog pointent en interne vers `/lodgify-avis`.
- Prix Lodgify : grille instable (formules et frais de 1,9 % modifiés en 2026, relevés contradictoires). Toujours formuler en « relevés de [mois] », renvoyer vers la grille officielle et revérifier avant toute mise à jour.
- **Hospitable** (affilié, sept. 2026) : 200 $ par client parrainé, sans plafond ; le filleul a 25 % de réduction sur ses 3 premiers mois, en plus de l'essai gratuit de 14 jours sans carte bancaire. Liens par canal, même code de campagne `BASWTYN7`, seul `utm_medium` change : `https://hospitable.com/partners/refer?utm_source=affiliates&utm_medium=<blog|email|youtube|podcast|social|other>&utm_campaign=BASWTYN7` (site = `blog`, posts réseaux = `social`).
- **Page `/hospitable-avis`** (sept. 2026, même gabarit que `/lodgify-avis`, FAQ HTML + JSON-LD synchronisées) : prix en dollars formulés en « relevés de septembre 2026 » (Essentials gratuit, Host ~29 $/1 logement, Professional ~59 $/2, Mogul ~99 $/3, + supplément par logement), renvoi vers la grille officielle. Limite assumée : interface et support majoritairement en anglais (renvoi vers Superhote pour qui veut du 100 % français). Liée depuis le footer, le sitemap, llms.txt, `/partenaires`, `/lodgify-avis`, le comparatif Smoobu/Hospitable et les encadrés `inject-affiliate-boxes.mjs`.
- **Shine** (parrainage, sept. 2026) : `https://app.shine.fr/register?referral=WYDP4644`. Shine limite le nombre de parrainages par an (2, d'après les conditions relevées) : placement volontairement discret (carte `/partenaires` + encadré dans l'article compte bancaire pro), badge « Parrainage ». Filleul : un mois offert « selon les conditions de parrainage en vigueur », ne pas promettre plus.
- Encadrés Hospitable/Shine injectés par `node scripts/inject-affiliate-boxes.mjs` (idempotent, marqueurs `AFF:<id>:START/END`) dans le comparatif Smoobu/Hospitable, 3 articles qui parlent d'Hospitable et l'article compte bancaire pro. À relancer si un de ces articles est régénéré. Pour un nouveau partenaire : ajouter une entrée dans `PLACEMENTS`.

---

## Espace hôte recentré sur le quotidien (sept. 2026, suite à l'audit hôte + benchmark Hospitable/Superhote)

- **Accueil** (`app/dashboard/page.tsx`) : juste après le bandeau de bienvenue, `TodayBoard.tsx` « À faire aujourd'hui » : arrivées, départs, ménages du jour (faits ou non) puis les actions en attente (contrats à signer dont l'arrivée est à ≤ 14 jours, loyers non encaissés, cautions à libérer, déclarations), chaque ligne vers la page qui la traite. Ordre ensuite : déclarations, prochaines arrivées/départs, Mes plateformes, état des lieux, objectif, trouver un pro, actualités, et « Mon apprentissage » (niveaux Apprenti → Maître) en dernier.
- **Contrats & paiements** (`/dashboard/contrats`, entrée du menu) : bloc « À traiter » (à faire signer + copie du lien `/sign/<token>`, loyer pas encore encaissé, caution à libérer) puis la liste filtrable `ContractsTab.tsx` (déplacée depuis Mes voyageurs, badges loyer/caution). Règles dans `lib/contracts/todo.ts` (`contractTodos`, testé), partagées avec l'accueil. Les actions (relance, caution via `DepositModal`, facture) restent sur la fiche voyageur : chaque contrat y renvoie via `voyageur_id` (déduit de `sejour_id`). L'ancien onglet Contrats de Mes voyageurs n'existe plus (`#contrats` redirige ici). **Contrat annulé par erreur** : un contrat passe en `annule` via la corbeille du journal Encaissements (`cancelContractRevenus`, confirmation obligatoire depuis sept. 2026, avant : un clic sans confirmation), la suppression du séjour lié (`deleteSejour`, le message le précise) ou la migration 103 (orphelins). Bouton « Réactiver » sur la ligne (`restoreContract`, `contract-actions.ts`) : repasse en `signe` s'il y a une `signature_date`, sinon `en_attente`.
- **Ménage** (`/dashboard/calendrier/menage`, onglet `CalendrierTabBar.tsx` à côté de Calendrier) : ménages d'hier (non faits) à J+13, par jour, fait par l'équipe (lien vers les photos `/dashboard/menages/[id]`) ou « Marquer fait » (`setMenageDone`, optimiste), équipes connectées (`menage_links` actifs, service role) et copie/génération du lien de partage. `loadHostMenageSlots` fusionne désormais les ménages saisis/ajustés à la main (`calendar_events` catégorie `menage`, `mergeAutoAndManual`) : l'équipe et son flux iCal voient les horaires choisis par l'hôte. La checklist de démarrage pointe ici.
- **Déclarations voyageurs** (`/dashboard/voyageurs/declarations`, lien avec compteur en tête de Mes voyageurs) : toutes les déclarations en attente (même widget que l'accueil) + historique 6 mois, fiche de police PDF re-téléchargeable (`lib/declarations/police-fiche-download.ts`, partagé avec le widget).

## « Faire grandir mon activité » réorganisé (sept. 2026)

- **Trouver des voyageurs** (`/dashboard/visibilite`, `VisibiliteTabBar.tsx`) : onglets Groupes Facebook (`/visibilite/facebook`, ré-exporte `/dashboard/communaute` : groupes où publier + posts prêts à coller avec le lien Driing) et Fiche Google (`/visibilite/google`, ré-exporte `/dashboard/audit-gbp`). Avant : Facebook rangé dans « Entre Hôtes » (communauté d'hôtes) et l'audit Google dans « Outils & calculs », alors que les deux servent à attirer des voyageurs en direct. `/dashboard/entre-hotes/groupes-facebook` redirige ici. Même logique que la piste d'onboarding « Trouver des voyageurs » (`lib/onboarding/tracks.ts`).
- **Page Groupes Facebook** (`CommunauteView.tsx`, refonte visuelle sept. 2026, demande de Jason : « le message en haut cache tout ») : hero (promesse « sans commission », 3 étapes Rejoins / Copie / Publie, portée en chiffres) puis 2 colonnes au-delà de 1200 px : groupes à gauche, post à droite en colonne collante (défilable). Le post (`FacebookTemplatesSection.tsx`) est une carte compacte par défaut (aperçu + « Copier le post » + autres styles) ; l'éditeur complet (logement, posts sauvegardés, titre, texte) ne s'ouvre qu'avec « Personnaliser ».
- **Page Fiche Google** (`audit-gbp/AuditGbpView.tsx`, données chargées par `page.tsx`, refonte sept. 2026) : même esprit que Groupes Facebook : hero « Sois trouvé quand on cherche gîte + ta ville », 3 étapes, un seul bouton principal (audit express par URL Google Maps, 30 s), carte « Ton dernier score » avec l'évolution depuis l'audit précédent et le lien vers le plan d'action ; import CSV relégué en lien discret ; au-delà de 1200 px, historique des audits en colonne à droite du questionnaire. Pas de « GBP » dans les textes visibles.
- **Audit express (import URL Google Maps)** : appelle Google **Places API (New)** (`places.googleapis.com/v1`, `lib/audit-gbp/places-api.ts`) depuis le serveur Vercel avec `GOOGLE_PLACES_API_KEY`. Un 403 vient presque toujours de Google Cloud : API « Places API (New) » non activée (l'ancienne « Places API » ne suffit pas), clé restreinte à des référents HTTP ou à des IP (appel serveur : mettre « Aucune » en restriction d'application, garder la restriction d'API), facturation absente. `placesAccessAdvice()` (`lib/audit-gbp/places-errors.ts`, testé) traduit la raison de Google en consigne, et la réponse brute part dans `log.error` (visible dans « Erreurs de l'app » de l'admin). Pages import URL/CSV passées au vert de la marque (avant : vert menthe `--success-1` et jaune illisible en thème clair).
- **Questions & réponses (ex-forum, refonte sept. 2026, décision de Jason)** : le forum n'était pas utilisé (trop peu de membres pour un réseau social, page qui affichait surtout le vide, concurrence des groupes Facebook). Recentré sur une promesse : « Pose ta question, réponse sous 48 h par Jason ou un hôte ». `ChezNousFeed.tsx` : `HubHero` + carte de Jason, recherche, filtres Récentes / Déjà répondues (`sort=answered`, `reply_count > 0`) / Sans réponse, sujets (sans « Bienvenue » à la création), colonne droite ≥ 1200 px (conseils + « Tu connais la réponse ? »). Retirés : compteurs de membres, top contributeurs, carte de France, nouveaux membres, invitations, `WelcomeModal` (fichiers `WelcomeModal.tsx`, `InviteModal.tsx`, `lib/chez-nous/regions.ts` supprimés avec l'accord de Jason). `?ask=1&cat=<sujet>` ouvre directement le formulaire ; une recherche sans résultat propose « Poser cette question » pré-remplie. **Tenir la promesse** : email à `contact@jasonmarinho.com` à chaque nouvelle question (`createPost` → `sendAdminEmail`, sauf posts d'admin) + rappel quotidien des questions sans réponse depuis 24 h à 14 jours (cron `notifications-engine`, `lib/chez-nous/unanswered.ts`, testé). **Liens contextuels** `components/chez-nous/AskQuestionCard.tsx` : Guide LCD, simulateurs, déclarations, actualités (pas dans les leçons : elles ont déjà leurs commentaires `LessonComments`). Onglet renommé « Questions & réponses » (URL `/dashboard/entre-hotes/forum` inchangée). **Amorce** : 10 questions/réponses de Jason (`jason-app/scripts/data/questions-reponses-amorce.json`) publiées par `scripts/seed-questions-reponses.mjs` via le workflow `seed-questions-reponses.yml` (secrets Supabase du dépôt, lancé à chaque modification du JSON sur main ou à la main ; idempotent par titre, réponse marquée acceptée).
- **Entre Hôtes** : Questions & réponses + « Partenaires & outils » (ex-Écosystème). **Outils & calculs** (`app/dashboard/outils/page.tsx`, refonte sept. 2026) : `HubHero` « Les bons chiffres, sans tableur » + carte « Réponse en un clic » (questions fréquentes vers l'onglet qui y répond), 4 cartes (simulateurs, prix & marché, modèles de messages, QR & affiches) qui listent leurs outils avec lien direct vers l'onglet (`/dashboard/simulateurs#taxe`, `/dashboard/calculateurs#mes-prix`, `/dashboard/gabarits?cat=checkin`, `/dashboard/outils-impression#affiche`), 2 colonnes dès 900 px, `AskQuestionCard` en bas. `OutilsSwitcher` : 4 outils dont Modèles de messages (aussi affiché sur `/dashboard/gabarits`), plus l'audit Google.
- **Hubs à onglets** (Apprendre, Entre Hôtes, Trouver des voyageurs, Calendrier/Ménage) : le layout n'affiche que les onglets, le titre du hub est dans l'en-tête du dashboard (`Header.tsx`) et chaque page garde sa propre intro (avant : deux gros titres empilés).
- **Partenaires & outils = même catalogue que `/partenaires`** : `node scripts/build-partenaires.mjs` écrit aussi `jason-app/lib/ecosysteme/partenaires-data.json` (liens rendus absolus, Hospitable en `utm_medium=other`, `liensApp` pour les liens propres au dashboard, ex. Krossbooking). Lu par `lib/ecosysteme/partenaires.ts`, vérifié par `partenaires-sync.test.ts` (échoue si le JSON n'a pas été régénéré). Avant : liste séparée sans les liens affiliés Lodgify/Hospitable/Shine et avec Luko. Liens rémunérés en `rel="sponsored"` + mention visible. Votes « M'intéresse » conservés (`tool_interests`, slug = `partnerSlug(nom)`) ; partenaires en base (`partners`, codes promo) toujours affichés.
- **Apprendre avec le même hero** (sept. 2026) : Formations (« Progresse à ton rythme, une leçon à la fois », action « Suivre un parcours guidé », carte Reprendre ou progression + liens profil apprenant / favoris ; `FormationsGrid` en `hideHeader` : bannière Parcours, compteurs et barres profil/favoris ne sont plus répétés) et Guide LCD (« Les règles de ta location, sans jargon », les 3 « Par où commencer ? » dans le hero, carte nombre de fiches `GUIDE_CARD_COUNT` + date de mise à jour).
- **Formations** : en tête, « Reprendre » (formation commencée la plus avancée) + « Pour toi » (3 recommandations expliquées, `lib/formations/recommend.ts`, testé : sans logement → annonce/photos/prix ; logement en France → fiscalité 2026, déclaration LMNP de mars à juin ; pas de contrat → réservation directe/Google ; octobre à mars → basse saison). Grille : en cours d'abord, niveau et statut en menus déroulants (plus 3 rangées de boutons), badge « Disponible » retiré. Les formations sont des leçons écrites : ne pas écrire « formations vidéo ».
- **Guide LCD** : chaque fiche renvoie vers l'outil de l'app et la formation correspondants (`APP_LINKS` dans `GuideCards.tsx`, URL internes existantes uniquement).
- **Contrats & paiements** : bouton « Nouveau contrat » qui liste les séjours à venir sans contrat et ouvre l'assistant sur la fiche voyageur (`?contract=<séjour>`, déjà géré par `VoyageurDetail.tsx`), plus « Nouvelle réservation directe » : `QuickSejourModal` (celle de la fiche logement, ici avec choix du logement et `contractOnly`) crée voyageur + séjour puis ouvre l'assistant. La modale est rendue au niveau de la page, pas dans l'en-tête : un parent animé (`fade-up`, transform) confine les `position: fixed`. Plus de bandeau ni de texte « crée-le depuis la fiche voyageur » ; Mes voyageurs n'a plus de lien vers les contrats (déjà dans le menu), seulement un bouton « Déclarations » avec compteur.

## Réservations Airbnb / Booking importées : affichage (test hôte, sept. 2026)

- `lib/ical/display.ts` (`icalReservationsForDisplay`, testé) : une seule règle pour afficher les réservations iCal sur l'accueil et dans Mes réservations : logement retrouvé par l'URL du flux (sinon nom du flux), libellé « Réservation Airbnb / Booking / Vrbo » au lieu du titre brut « Reserved », **départ = dernière nuit + 1** (avant : l'accueil affichait les départs Airbnb un jour trop tôt), « CLOSED » Booking de 30 nuits ou moins gardés comme réservations (même règle que le planning ménage).
- **Mes réservations** (`app/dashboard/reservations/page.tsx`) liste désormais aussi ces réservations (`source: 'ical'`, 12 derniers mois + à venir, ignorées si une résa saisie couvre le même logement à la même date), avec un encart « Réservation synchronisée » dans le détail, et son planning ménage inclut les départs iCal. Avant, la page n'affichait que les contrats et séjours saisis à la main.
- Corrigé au passage dans le détail d'une réservation : « Voir le contrat » menait à Modèles de messages ; les alertes de paiement testaient des statuts Stripe jamais stockés (`succeeded`, `requires_payment_method`) au lieu de `paid` / `pending` / `failed` ; un contrat renvoie à la fiche voyageur (via son séjour).
- **Nouvel hôte** (ni logement ni réservation) : l'accueil masque « À faire aujourd'hui », les prochaines arrivées et l'état des lieux (que des zéros) ; la checklist de démarrage suffit.
- Limite connue, non traitée : une réservation Airbnb/Booking importée ne porte ni nom ni nationalité, donc aucune déclaration (SIBA, fiche de police) n'est créée tant que l'hôte n'a pas saisi le voyageur.

## Revenus : un séjour lié à un contrat compté une seule fois (sept. 2026)

- `lib/finances/dedup.ts` (`sejoursSansContrat`, testé) : un séjour relié à un contrat actif (`contracts.sejour_id`, statut ≠ `annule`) est retiré des revenus, la ligne du contrat le représente (statut de paiement + locataire). Appliqué au journal Encaissements et à ses totaux (`app/dashboard/revenus/page.tsx`, réutilisé par `/dashboard/finances/revenus`) et à l'accueil (CA du mois, cumul annuel, prévisionnel). Avant : le même loyer apparaissait deux fois (ligne « Loyer » du contrat + ligne « Loyer · Séjour »). `performances/page.tsx` faisait déjà la déduplication inverse (garde le séjour, ignore le contrat lié) : les deux vues comptent une fois, chacune avec sa ligne de référence.
- Corbeilles du journal : contrat (`cancelContractRevenus`) et séjour (`cancelSejourRevenus`) demandent une confirmation, les deux annulent l'objet lui-même, pas seulement la ligne.

## Dates relatives et hydratation (sept. 2026)

- **Balises `<style>` inline** : React 18 échappe `' " & < >` dans `<style>{`...`}</style>`. Le CSS arrive cassé du serveur (`.a &gt; .b`, `content: &#x27;&#x27;`) et le texte ne correspond plus au rendu navigateur : erreur d'hydratation (#418/#425), page entièrement re-rendue côté client. Constaté sept. 2026 sur Questions & réponses (apostrophe dans un commentaire CSS). Règle : pas d'apostrophe, de guillemets ni de `>` dans ces blocs ; pour un sélecteur enfant ou des guillemets, utiliser `components/ui/InlineStyle.tsx` (CSS constant uniquement, jamais de donnée utilisateur). Garde-fou CI : `lib/ui/inline-style-guard.test.ts`.

- « il y a 3 min » calculé au rendu serveur puis recalculé dans le navigateur diffère souvent : React lève l'erreur #425 (vue 8 fois dans `app_errors` sur le forum). Toujours afficher une date relative via `components/ui/RelativeTime.tsx` (`<time suppressHydrationWarning>`), jamais `{formatRelative(...)}` directement dans le JSX. Même règle pour tout texte qui dépend de l'heure courante ou du fuseau (`Date.now()`, `toLocaleDateString` sans `timeZone`) rendu dans un composant client.

## Espace équipe de ménage : « Mes ménages » (sept. 2026)

- **Principe** : aucun compte partagé. L'hôte envoie son lien de planning (`/api/calendar/menage-feed?token=<profiles.ical_token>`, bouton « Copier le lien du planning » / « Générer le lien » dans `MenageExportModal.tsx`). L'équipe le colle dans `/dashboard/ma-fiche-menage/planning` (`addPlanningLink`, token extrait par `lib/menage/share-link.ts`) → ligne `menage_links` (migration `20260927_109`). Si l'hôte régénère son token, `host_token` ne correspond plus : accès expiré automatiquement (affiché « Lien expiré »).
- **Planning** : `lib/menage/host-slots.ts` (`loadHostMenageSlots`, contrats + séjours + réservations iCal) partagé avec le flux iCal. Fenêtre hier → J+13, groupé par jour, badge « Arrivée le jour même » (turnover serré), adresse cliquable (Google Maps).
- **Terminé + photos** : photos compressées dans le navigateur (1600 px JPEG) puis envoyées directement au bucket privé `menage-photos` via URL signées (`preparePhotoUploads` → `uploadToSignedUrl`) : pas de passage par la server action (limite 1 Mo). `markMenageTermine` vérifie lien + token + existence du créneau, écrit `menage_completions`, marque l'événement [FAIT] chez l'hôte (`lib/menage/done.ts` `applyMenageDone`, partagé avec `setMenageDone`, ILIKE échappé) et notifie l'hôte (lien `/dashboard/menages/[id]`, photos en URL signées 1 h). Annulation possible par la personne qui a validé.
- Sidebar pro (mode ménage) : entrée « Mes ménages » en premier.

## Annuaire pros : portfolio hébergé + vues du mois (sept. 2026)

- **Portfolio photographes** : jusqu'à 12 photos (`photographers.portfolio_photos`, chemins `<photographerId>/<uuid>.jpg` dans le bucket public `pro-portfolio`, migration `20260927_110`). Gérées dans `/dashboard/ma-fiche-photographe` (`components/pros/PortfolioManager.tsx`, ajout / suppression / réordonnancement, compression navigateur 2000 px via `lib/images/compress.ts`, envoi direct par URL signées : actions `preparePortfolioUploads` / `addPortfolioPhotos` / `removePortfolioPhoto` / `movePortfolioPhoto`, mode admin via `targetId`).
- **Affichage public** : les fiches `/annuaires/photographes/[slug]` sont statiques (générées au déploiement par `scripts/build-photographers.mjs`) ; la galerie est chargée en direct par `fetch('/api/photographer/portfolio?slug=')` (fonction serverless du site statique, fiches actives et publiques uniquement, cache CDN 5 min) : une photo ajoutée apparaît sans redéploiement. La vue `public_photographers_view` n'a pas été modifiée.
- **Vues par jour** : table `pro_fiche_views_daily` (+ RPC `increment_pro_fiche_view_daily`, service role), incrémentée par `api/photographer/track.js` et `api/cleaner/track.js` à chaque vue (en plus du cumul `views_count`). Carte « Vues de ta fiche ce mois-ci » (tendance vs mois dernier + 30 jours) dans les deux espaces pros (`components/pros/ViewsTrend.tsx`, `lib/pros/views.ts`, testé). Historique à partir de la mise en ligne : pas de rétroactif.

## Positionnement hôte + checklist de démarrage (sept. 2026)

- **Positionnement** : l'app n'est pas un logiciel de gestion concurrent de Smoobu/Hospitable (pas de synchro bidirectionnelle ni d'envoi automatique de messages). Elle gère « le reste » : contrats signés + caution pour les réservations directes, planning ménage automatique, formalités voyageurs, finances, savoir. Phrase affichée en tête de la checklist d'accueil (`app/dashboard/SetupChecklist.tsx`, `headPitch`).
- **Checklist** (`app/dashboard/page.tsx`, `setupSteps`) orientée vers cette valeur : logement → calendrier Airbnb/Booking connecté (`ical_feeds` count) → premier contrat à signer (`contracts`) → planning ménage partagé (`profiles.ical_token` généré) → prix → objectif. Les anciennes étapes « saisir une réservation à la main » et « commencer une formation » ont été retirées.
- `/dashboard/calendrier?menage=1` ouvre directement le partage du planning ménage (sinon caché derrière l'icône balai de la barre d'outils).

## Région des fonctions Vercel (sept. 2026)

- La base Supabase est à **Londres (eu-west-2)**. Les fonctions des deux projets Vercel tournaient par défaut à Washington (`iad1`) : chaque requête base de données traversait l'Atlantique (~75 ms aller-retour, plusieurs par page ou par action). Les deux `vercel.json` (`jason-app/` et racine) fixent maintenant `"regions": ["lhr1"]` (Londres, une seule région autorisée en Hobby). Ne pas retirer, ne pas choisir une autre région sans déplacer la base.
- Reste transatlantique : Upstash Redis (rate limiting) créé en `iad1`. Ne touche que les routes rate-limitées (login, inscription, signature de contrat…), pas la navigation. Pour l'aligner : créer une nouvelle base Upstash en Europe et remplacer les variables d'environnement.

## Lisibilité et thèmes du dashboard (sept. 2026)

- **Contraste des textes gris** (`app/globals.css`, bloc « ACCESSIBILITÉ ») : `--text-3` (~460 usages) et `--text-muted` (~800 usages) étaient à 3,3:1 et 3,9:1, sous le minimum WCAG AA (4,5:1). Remontés à ≥ 4,5:1 sur le fond ET sur les cartes, dans les 3 thèmes, en gardant 3 niveaux distincts (`--text-2` > `--text-3` > `--text-muted`). Ne pas redescendre ces opacités ; pour un texte « discret », jouer sur la taille/graisse plutôt que sur la transparence.
- **Thèmes** : le bouton de l'en-tête bascule clair ↔ sombre (`ThemeProvider.toggleTheme`). AMOLED (noir pur) reste supporté pour les comptes qui l'avaient, mais n'est plus dans le cycle (quasi identique au sombre, il rendait le bouton confus). Défaut : clair.
- **Transition de couleurs** : uniquement pendant la bascule de thème (`html.theme-switching`, posée 300 ms par `applyTheme`). Avant, `html *` avait une transition permanente de 200 ms sur couleurs/fonds/bordures : chaque clic ou survol changeait d'état avec retard (« les actions ne sont pas directes »). Ne pas remettre de transition globale.

## Actions instantanées + menu du dashboard (sept. 2026)

- **Pas de `router.refresh()` après une server action qui appelle `revalidatePath` sur la page courante** : la réponse de l'action contient déjà la page à jour ; le refresh en plus refaisait un 2e rendu complet (vérif de session + layout + page). Retiré dans `CalendrierView.tsx`, `VoyageurDetail.tsx`, `VoyageursView.tsx`, `PlanningMenage.tsx`. Garder `router.refresh()` seulement quand l'action ne revalide pas la page affichée, ou pour annuler un état optimiste après une erreur.
- **Optimiste d'abord** : modifier l'état local avant l'appel serveur, revenir en arrière si erreur (ex. `onUpdateSejour` du calendrier, `onToggleMenage`, notifications).
- **Notifications** (`lib/notifications/actions.ts`) : ne revalident plus `('/dashboard', 'layout')` (tout le dashboard à chaque clic) mais seulement `/dashboard/notifications` ; le badge est géré côté client (`notif-count-changed`).
- **Sidebar** (`components/layout/Sidebar.tsx`) : bloc « Au quotidien » (Accueil, Actualités avec point rouge, Calendrier, Mes réservations, Mes voyageurs, Contrats & paiements, Mes finances, Sécurité voyageur) puis « Faire grandir mon activité » (Trouver des voyageurs, Apprendre, Outils & calculs, Entre Hôtes). Décisions de Jason : Actualités reste en 2e position (axe fort) ; pas d'entrée « Mes logements » (accessible via le sélecteur de logement en bas, « Gérer mes logements »). « Modèles de messages » (`/dashboard/gabarits`) est une carte du hub Outils & calculs depuis sept. 2026 (plus dans le menu).
- **Forum (`app/dashboard/chez-nous/page.tsx`)** : 2 vagues de requêtes au lieu de 3. Les stats pro réutilisent les logements déjà chargés en phase 1 (`getBulkProStats(..., preloadedLogements)`, sauf si la liste atteint le plafond de 1 000 lignes de Supabase) ; auteurs, top contributeurs et activité récente partagent une seule requête `profiles`. Même principe déjà appliqué à la page d'une discussion (`[postId]`).
- **Squelettes de chargement des hubs à onglets** : `entre-hotes/loading.tsx` et `apprendre/loading.tsx` (réexportent ceux de `chez-nous` et `formations`). Sans eux, le seul squelette était celui de `/dashboard`, au-dessus du layout à onglets : au changement d'onglet l'écran restait figé jusqu'à la fin du rendu serveur. Tout nouveau hub à onglets doit avoir son `loading.tsx`.

## Qualité : CI, tests, suivi des erreurs (sept. 2026)

- **CI** : `.github/workflows/ci.yml` à chaque push sur main / PR touchant `jason-app/` : `npm run typecheck` (tsc), `npm test` (Vitest), `npx next lint --quiet` (erreurs bloquantes). Les tests Playwright (`e2e/`) n'y tournent pas (serveur + secrets requis).
- **Tests unitaires** : Vitest (`vitest.config.ts`, alias `@`), fichiers `lib/**/*.test.ts`. Couvrent la réglementation, le parseur iCal, le rattachement iCal → logement → créneau ménage. Tout calcul pur ajouté dans `lib/` devrait avoir son test.
- **ESLint** : `.eslintrc.json` (`next/core-web-vitals`, plugin `@typescript-eslint` pour les `eslint-disable` existants, `react/no-unescaped-entities` coupé : apostrophes françaises dans le JSX). 0 erreur, ~17 avertissements (dépendances de hooks) à résorber au fil de l'eau. `next build` lance aussi le lint : une erreur ESLint casse désormais le déploiement Vercel.
- **Suivi des erreurs en prod (maison, sans Sentry)** : table `app_errors` (migration `20260927_108`, service role uniquement, purge > 30 jours). Côté navigateur, `lib/errors/client-report.ts` (appelé par `DashboardError`, `global-error.tsx` et `components/ErrorReporter.tsx` monté dans le layout racine pour les exceptions non gérées), 5 envois max par page, dédupliqués, bruit filtré. Envoi vers `POST /api/errors` (rate-limité). Côté serveur, chaque `log.error` de `lib/logger.ts` en production écrit aussi dans `app_errors` (`lib/errors/server-report.ts`, best-effort). Affichage : carte « Erreurs de l'app · 7 derniers jours » dans `/dashboard/admin` (`getAppErrors`, regroupées par message).
- **Dates iCal** : `ical_events.end_date` = dernière nuit (DTEND exclusif moins 1 jour, `parseIcalText`), pas le jour du départ. Pour un ménage ou un départ, ajouter 1 jour (`addDaysIso`, `lib/menage/ical-occupations.ts`).

## Synchro iCal en tâche de fond + planning ménage

- **Avant (sept. 2026)** : les flux Airbnb/Booking/Vrbo (`ical_feeds` → `ical_events`) ne se synchronisaient que quand l'hôte ouvrait `/dashboard/calendrier`, et le flux iCal de l'équipe de ménage (`/api/calendar/menage-feed`) **ignorait complètement les réservations importées** (seulement contrats + séjours saisis à la main).
- **Maintenant** : `lib/ical/background.ts` (`syncStaleFeeds`, budget de temps, plus anciens d'abord). Appelé par le cron quotidien `/api/cron/notifications-engine` (flux > 6 h, avant les règles) et par `/api/calendar/feed` + `/api/calendar/menage-feed` à chaque lecture par l'agenda abonné (`syncUserFeedsQuick`, flux de l'hôte > 1 h, plafonné ~9 s) : synchro quasi horaire sans cron supplémentaire (pas de 4e cron Vercel).
- **Flux ménage** : les réservations iCal sont reliées au logement par l'URL (`lib/menage/ical-occupations.ts`, `ical_feeds.url` = `logements.ical_*`, pas de `logement_id` sur `ical_feeds`). Un flux ajouté à la main dans le Calendrier sans fiche logement est ignoré. Blocages ignorés (`lib/ical/blocked.ts`), sauf sur les flux Booking.com (qui exportent leurs vraies réservations en « CLOSED - Not available ») : un « CLOSED » Booking de 30 nuits ou moins compte comme une réservation (`BOOKING_MAX_NIGHTS_AS_RESERVATION`), règle choisie en sept. 2026 ; contrepartie : un blocage manuel court crée un créneau ménage en trop.
- **État de synchro** : migration `20260927_107` (`last_sync_error`, `last_sync_error_at`, `consecutive_failures` sur `ical_feeds`), écrit en best-effort par `fetchAndUpsertIcalFeed` (fonctionne même si la migration n'est pas appliquée). Un flux vide n'est pas un échec. Règle `ruleSyncFailed` (`lib/notifications/rules.ts`) : notification après 3 échecs consécutifs, dédup par flux + dernière synchro réussie.

## Actualités du dashboard : veille quotidienne sans doublons (sept. 2026)

- **Chaîne** : routine Claude « Actualités LCD journalière » (7h UTC) → fichier `data/actualites-queue/AAAAMMJJ-HHmm.json` → workflow `process-actualites.yml` → `POST /api/actualites/insert` → table `actualites` → `/dashboard/actualites`.
- **Problème corrigé** : la routine ne voyait jamais ce qu'elle avait déjà publié (la file est vidée après publication) et l'API ne refusait que le titre exact. Résultat : 17 versions de « Airbnb passe à 15,5 % », 13 du bilan de l'été, 4 de la facture électronique en un mois, dont des infos contradictoires. 35 doublons masqués (`is_published = false`, rien supprimé) par la migration `20260927_111`.
- **Prévention, 2 niveaux** : (1) `data/actualites-publiees.md`, historique alimenté automatiquement par le workflow, que la routine lit avant d'écrire ; (2) `lib/actualites/dedup.ts` (`findSimilarActualite`, testé sur les 54 actualités réelles : 0 faux positif) appliqué par l'API sur les 60 derniers jours, publiées ou masquées. Une vraie évolution d'un sujet passe avec `"is_update": true` et un titre qui dit ce qui change. Les doublons refusés apparaissent dans les logs du workflow (`DOUBLON ignoré : … (déjà publié : …)`).
- **Filet de sécurité à l'affichage** : `getCachedPublishedActualites()` (`lib/queries/cache.ts`, clé `actualites-published-v2`) passe la liste dans `dedupeActualites()` : une seule actu par sujet sur 60 jours (épinglées puis plus récentes gardées), avec la règle stricte + `isSameTopicLoose` (même catégorie et titres/résumés proches, réservée à l'affichage). Couvre la page Actualités, l'accueil et le badge « du neuf », même si la migration 111 n'est pas appliquée. Sur les 52 actus distinctes : 22 affichées (17 « Airbnb 15,5 % » → 1).
- Enregistrement des meublés (vérifié sept. 2026) : téléservice national prévu au 4e trimestre 2026, les mairies gèrent toujours l'enregistrement d'ici là. Ne pas publier « tout doit être sur Declaloc depuis le 20 mai ».

## Réglementation dans les estimations (investisseur + hôte)

- `jason-app/lib/lcd/regulation.ts` : règles LCD par ville, **uniquement des faits vérifiés et sourcés** (relevés de sept. 2026), 3 niveaux : `bloquant` (nouvel investissement quasi impossible : Paris, Barcelone, Palma, Málaga, Florence, Amsterdam), `restrictif` (90 jours, compensation, quotas : Lyon, Bordeaux, Marseille, Nice, Montpellier, Annecy, Biarritz, La Rochelle, Saint-Malo, Chamonix, Madrid, Valencia, Lisbonne, Berlin, Vienne), `encadre` (changement d'usage à prévoir). Ville absente = note générique du pays (`COUNTRY_NOTES`), jamais de chiffre inventé. Mêmes faits FR que `scripts/data/villes-local.mjs` côté site statique : garder les deux cohérents.
- Affichée par `components/lcd/RegulationAlert.tsx` dans l'estimateur (`SimulateursUI.tsx`, hôte et `/dashboard/investir/estimateur`, avec alerte si les nuits estimées dépassent le plafond résidence principale), une ligne « Réglementation » dans le comparateur de villes, un résumé sur chaque projet investisseur, et une section 6 dans le PDF banque (`lib/lcd/previsionnel-pdf.ts`, ligne d'alerte en page 1).
- Tests : `lib/lcd/regulation.test.ts` vérifie notamment que chaque ville réglementée existe dans `market-benchmarks.ts` (sinon l'alerte ne s'affiche jamais). Revérifier les règles une fois par an.

## Fonctions serverless du site statique : 12 maximum

- Le forfait Vercel Hobby refuse tout déploiement qui contient plus de **12 fonctions serverless** (chaque fichier sous `api/` du site statique ; le dashboard Next.js n'est pas concerné). Le 27/09/2026, l'ajout de `api/photographer/portfolio.js` (13e fonction) a fait échouer tous les déploiements du site pendant plusieurs heures.
- Corrigé : `api/track/visit.js` + `api/track/click.js` fusionnés en une route dynamique `api/track/[type].js` (mêmes URL, `nav.js` inchangé), endpoint temporaire `api/debug-signalements.js` supprimé. 11 fonctions au 27/09/2026.
- **Avant d'ajouter une fonction** : compter (`find api -type f | wc -l`). Si on atteint 12, regrouper plutôt par route dynamique (`api/<domaine>/[type].js` + `req.query.type`) que créer un nouveau fichier. Garde-fou : `.github/workflows/static-site-check.yml` échoue dès le push au-delà de 12.

## Trafic & analytics (visiteurs en direct + canal)

- **Pas de gtag** (cf. Performance) : le trafic en direct + canal d'acquisition affiché dans l'admin est un tracking maison léger, pas Vercel Analytics (pas d'API exposée pour ça) ni Google Analytics.
- **Écriture** : `POST /api/track/visit`, servi par `api/track/[type].js` (fonction serverless CommonJS du site statique, route dynamique partagée avec `/api/track/click`, même pattern que `api/photographer/track.js` : filtre bot UA, rate-limit 120/min/IP en mémoire, insert Supabase REST avec la service role, fail-silent). Appelée par une IIFE ajoutée à la fin de `nav.js` (chargée sur les 150+ pages statiques) via `navigator.sendBeacon` (fallback `fetch keepalive`) à chaque chargement de page — pas de dédup, une ligne par navigation. `session_id` généré et persisté dans `sessionStorage`, pas de cookie, aucune IP/user-agent stockée (RGPD-friendly par construction).
- **Table** : `site_visits` (migration `20260919_105`, `jason-app/supabase/migrations/`) — `session_id`, `path`, `referrer`, `utm_source/medium/campaign`, `created_at`. RLS activé sans policy (service role uniquement). Purge opportuniste (~0.5% des requêtes) des lignes > 30 jours, pas de cron dédié.
- **Lecture** : `jason-app/lib/queries/site-traffic.ts` — `getLiveVisitorsCount()` (sessions distinctes actives sur 5 min), `getChannelBreakdown()` (répartition par canal sur 24h, calculée à la volée depuis `referrer`/`utm_source`/`utm_medium` du **premier** hit de chaque session via `classifyChannel()` : direct / recherche organique / réseaux sociaux / autres sites, pas de table de canaux, tout est déduit du referrer + host matching) et `getTopPages()` (pages les plus vues sur 7 jours, comptage brut par `path`, pas de dédup session : reflète le volume de pages vues, pas le nombre de visiteurs uniques).
- **Affichage** : section "Trafic du site · en direct" dans `/dashboard/admin` (`AdminUI.tsx`, composant `LiveTraffic`), juste après le bandeau KPI : 3 cartes (visiteurs en direct, canal 24h, pages les plus vues 7j). Chargée server-side au premier rendu (`page.tsx`). Seules les cartes "en direct" et "canal" se rafraîchissent côté client toutes les 25s via `GET /api/admin/live-traffic` (route admin-gated, revérifie `role==='admin'` avant de requêter) ; "pages les plus vues" reste figée au chargement (fenêtre 7j, change lentement, pas besoin de la repolluer dans l'endpoint de polling).

- **Clics affiliés** (sept. 2026) : table `affiliate_clicks` (migration `20260926_106`, `session_id`, `path`, `url`, `partner` déduit du domaine : `app.lodgify.com` → `lodgify`), écrite par `POST /api/track/click` (`api/track/[type].js`) via un écouteur de clic dans `nav.js` sur tout lien `a[rel~="sponsored"]` (donc tout nouveau lien affilié est suivi automatiquement s'il porte bien `rel="sponsored"`). Affichée dans `/dashboard/admin` (`AffiliateClicksCard`, 30 jours : total, par partenaire, pages qui envoient des clics). Un clic n'est pas une vente : les leads/ventes restent dans le tableau de bord affilié de chaque partenaire.

---

## Page « Mon compte » (`/dashboard/profil`, refonte sept. 2026)

- `page.tsx` charge les données, `ProfilView.tsx` les affiche (prévisualisable avec des données fictives). En-tête vert (avatar, formule, « Passer en Standard » en gratuit) + carte « Prêt pour tes contrats » (nom, adresse du bailleur, Stripe ou IBAN, SIRET/NIF + mention TVA ; chaque point manquant renvoie à sa carte `#identite`, `#stripe`, `#facturation`). Avant : jauge « Profil complété » dont 40 % tenaient au pseudo et à la bio du forum.
- 2 colonnes dès 1200 px (avant : colonnes CSS « masonry », ordre de lecture imprévisible, suppression du compte au milieu). Gauche (`ProfilForm.tsx`) : Identité du bailleur (nom + adresse), Encaissements (Stripe + IBAN `#iban`), Factures, puis Profil fiscal. Droite : Connexion (`AccountCard.tsx`, e-mail + mot de passe), Mon abonnement, Profil public (pseudo Questions & réponses). `DangerZone` (exportée de `ProfilForm.tsx`) en bas, pleine largeur.
- Frais Stripe affichés : 1,5 % + 0,25 € carte européenne standard + renvoi vers la grille officielle (avant : « 2,9 % hors UE », tarif américain). Couleurs hors marque retirées (violet Stripe et admin, vert menthe Standard).

## Page « Mon abonnement » (`/dashboard/abonnement`, refonte sept. 2026)

- `page.tsx` charge (profil, places Fondateur, abonnement et factures Stripe), `AbonnementView.tsx` affiche (prévisualisable). Listes de fonctionnalités `DECOUVERTE_FEATURES` / `STANDARD_FEATURES` alignées sur `/tarifs` : **à garder synchronisées** (planning ménage, déclarations, Questions & réponses 2/mois en gratuit, audit Google ouvert à tous, caution par empreinte en Standard).
- Carte « Plan actuel » Standard : prix et badge « Membre Fondateur » lus dans l'abonnement Stripe (`subDetails.amount`, `isFounding`). Avant : 19,98 € et « Membre Fondateur » affichés à tous les abonnés, y compris au tarif public. Abonné : la gestion (renouvellement, factures) passe avant l'offre Driing ; « Repasser au mensuel » en bouton discret, « Passer à l'annuel » reste mis en avant.
- Prix affichés sans « HT » : la page `/tarifs` dit « TTC », l'app disait « HT » pour le même prix (question posée à Jason, sept. 2026). Bouton « Passer en Standard » plein, vert de la marque ; plus de violet (admin) ni de vert menthe ; tutoiement ; plus de tiret cadratin.

## Sidebar & mode admin

- **Menu du compte (bas de la sidebar, refonte sept. 2026, demande de Jason : « un peu fouillis »)** : identité + formule (« Découverte · Passer en Standard » en gratuit), puis Mon compte, Mon abonnement, Centre d'aide ; « Mes espaces » (icône par espace) seulement si au moins 2 espaces actifs, et une seule entrée « Ajouter un espace » → `/dashboard/espaces` (page qui présente les 4 espaces, remplace les 3 liens « + Créer ma fiche… / Analyser un investissement ») ; Mode admin en interrupteur (plus de mention « Mode admin » sous l'espace Hôte, `lib/queries/spaces.ts`) ; déconnexion. Sortis du menu : Profil Entre Hôtes (lien en colonne droite de Questions & réponses, pseudo éditable dans Mon compte), Contributeurs, avis Google et jasonmarinho.com (encart « Tu aimes l'app ? » du Centre d'aide) ; demande d'avis Google une fois sur l'accueil dès qu'un contrat est signé (`app/dashboard/ReviewPrompt.tsx`, masquage en `localStorage`). Le menu du `Header.tsx` (`display: none`) est du code mort, pas l'affichage réel.

- `components/layout/Sidebar.tsx` : le "mode admin" (sidebar hôte → sidebar admin dédiée, toggle depuis le menu user) est un booléen persisté en `localStorage` (`admin-mode`), pas en base ni en cookie — c'est un état d'affichage local à l'appareil, pas un droit d'accès (le contrôle réel reste `profile.role === 'admin'` côté serveur sur chaque route `/dashboard/admin/*`).
- **Cohérence au montage** : si `admin-mode` est resté `true` (ex : session précédente laissée en mode admin) et que l'utilisateur atterrit sur `/dashboard` (l'Accueil hôte, ex : juste après connexion, le login redirige toujours ici), la sidebar admin s'affiche mais le contenu affiché serait l'Accueil hôte : incohérent. Le `useEffect` qui restaure `adminMode` depuis `localStorage` redirige alors immédiatement (`router.replace`) vers `/dashboard/admin` (Vue d'ensemble) pour aligner contenu et sidebar, au lieu de laisser les deux se contredire ou de forcer un retour silencieux en mode hôte.
- **Vue d'ensemble (`/dashboard/admin`) vs QG demandes (`/dashboard/admin/qg`)** : la Vue d'ensemble n'a **pas** de widget "Actions en attente" (Membres Driing / Signalements / Suggestions) — supprimé (sept. 2026) car strictement redondant avec `AdminQG.tsx`, qui a déjà ces 3 mêmes tabs avec les vraies actions (confirmer/rejeter/supprimer). La Vue d'ensemble se contente d'un badge cliquable dans la bannière hero ("N actions en attente" → lien vers `/dashboard/admin/qg`) plus la carte "Signalements" dans "Gestion du contenu" (`${stats.pendingReports} à valider`) : de simples points d'entrée, tout le travail se fait sur la console dédiée. `stats.pendingDriing`/`pendingReports`/`suggestions` viennent de requêtes `count: 'exact', head: true` (pas de fetch des lignes complètes côté Vue d'ensemble, contrairement à `AdminQG.tsx` qui les charge pour de vrai).

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
2. Région : une région européenne (les fonctions Vercel sont à Londres `lhr1`, cf. « Région des fonctions Vercel »). La base actuelle est en `iad1`, créée avant ce changement.
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
5. **Cache-Control immutable** : configuré dans vercel.json pour /fonts/* et *.webp. Conséquence pour les subsets Phosphor (`fonts/phosphor-*-subset.css`, régénérés à chaque build Vercel) : l'URL doit changer quand le contenu change, sinon les visiteurs déjà venus gardent l'ancien fichier un an (nouvelle icône = carré vide). `scripts/build-phosphor-subset.mjs` réécrit donc tous les `?v=` en hash du contenu (pages, `nav.js`, générateurs de `scripts/`). Ne jamais remettre une date fixe en `?v=` à la main.

---

## Domaines

- `jasonmarinho.com` → site statique Vercel
- `app.jasonmarinho.com` → Next.js dashboard Vercel
