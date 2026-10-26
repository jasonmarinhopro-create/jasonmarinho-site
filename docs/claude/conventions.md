# Conventions détaillées (contenu, auth, service role, styles, contrats, facturation)

Partie de la documentation interne (index : CLAUDE.md à la racine). Notes détaillées, dans l'ordre où elles ont été écrites.

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
- `app/dashboard/calendrier/` (sept. 2026) : `CalendrierView.tsx` passé de 4 390 à ~2 670 lignes par extraction mécanique, code inchangé (vérifié ligne à ligne) : `calendrier-shared.tsx` (constantes `CAT`, `CHECKLIST_ITEMS`, types `CalEvent`/`CatKey`, helpers de dates, `parseQuickAdd`, `isRealReservation`…), `ListView.tsx` (vue liste), `SearchableCombobox.tsx`, `calendrier-styles.ts` (objet `s`). `CalEvent` reste ré-exporté depuis `CalendrierView`. Même méthode à appliquer aux autres fichiers > 2 000 lignes (`VoyageurDetail.tsx` 2 915) : sortir d'abord les styles, constantes et sous-composants de premier niveau, sans toucher au corps du composant principal.

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
- **Application automatique (10/10/2026)** : workflow « Migrations Supabase » (`.github/workflows/migrations.yml`) à chaque push sur main qui touche `jason-app/supabase/migrations/` : exécute les migrations pas encore passées, une par une en transaction, et les note dans `public._jm_migrations` (RLS, serveur seulement). Celles jusqu'à `BASELINE_UNTIL` (`20261010_126_provenance.sql`, collées à la main) sont notées sans être rejouées. Secret **`SUPABASE_DB_URL`** (Session pooler) à créer par Jason ; sans lui, simple notice et migrations à coller à la main. Lancement manuel : mode `etat` (liste) ou `appliquer`. Une migration doit donc être rejouable sans casse (`if not exists`, `create or replace`) et sans `create index concurrently`. L'intégration GitHub native de Supabase n'est pas utilisée : historique vide (tout serait rejoué) et versions en double (Supabase prend la date seule comme version).

### Styles
- Inline styles `style={{...}}` partout (pas de Tailwind, pas de CSS modules)
- **Responsive grands écrans (demande répétée de Jason)** : les pages du dashboard occupent toute la largeur (`width: '100%'`, jamais de `maxWidth` fixe sur le conteneur de page, seulement sur un paragraphe de texte). Au-delà de ~1200 px, remplir l'espace : 2 colonnes (contenu + colonne latérale collante, ex. `/dashboard/calendrier/menage`) ou grille `repeat(auto-fill, minmax(min(100%, 480px), 1fr))` (ex. historique des déclarations). Vérifier chaque nouvelle page à 1920, 1280 et 390 px avant de pousser.
- **Listes de suggestions (18/10/2026, Jason : « je ne peux plus voir ce panneau noir », choix B sur ordinateur, D au téléphone)** : jamais de `<datalist>` nu ni de liste du navigateur. Site statique : `/suggestions.js` (un seul fichier, à inclure en `defer`) transforme tout `input[list]` en liste maison (repère, région, « Page dédiée », lettres tapées soulignées en jaune, « Utiliser « … » ») et en feuille plein écran sous 640 px ; attributs `data-suggest="ville"`, `data-suggest-anchor`, `data-suggest-submit`, `data-suggest-strict`. App : `components/ui/SuggestInput.tsx` (`kind="ville"` + `CITY_OPTIONS` de `lib/ui/suggest.ts`, sinon `options` libres), utilisé par les villes des fiches pros (Créer / Ma fiche, villes couvertes), le Journal, la Prospection, l'admin Communauté. Régions des villes : blocs `REGIONS:START/END` de `suggestions.js` et `lib/ui/suggest-regions.ts`, réécrits par `node scripts/inject-villes-voisines.mjs` (test de synchro). Un changement de design se fait dans ces deux fichiers seulement.
- **Calendrier : jamais celui du navigateur (18/10/2026, Jason : « cet agenda est à bannir, garde toujours l'agenda moderne »)** : app = `CalendarInput` (`components/ui/CalendarInput.tsx`, le calendrier de « Nouvelle réservation » : bouton avec la date en toutes lettres, mois avec flèches rondes, clic sur le titre pour les mois puis les années, Aujourd'hui / Effacer, `min` / `max`, `locale` fr/en/es/pt/de, `birth` pour une date de naissance qui s'ouvre sur les années) ; site = `/calendrier.js` (même calendrier, inclus en `defer`, transforme tout `input[type=date]` ou `[data-date]`, champ d'origine caché qui reçoit `input` / `change`, `data-birth`). Les 16 champs date du navigateur restants de l'app (check-in, SIBA, Journal, calendrier, ménage, devis, prospection) sont passés à `CalendarInput`. Garde-fou : `lib/ui/date-input-guard.test.ts` (aucun `<input type="date">` dans l'app ni dans les générateurs du site).
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

### Contrat plus complet + carte « Contrat » (29/09/2026, retours d'hôtes « pas assez détaillé »)
- Manques constatés : pas d'état descriptif des lieux (obligatoire avec le prix, Code du tourisme L324-2), numéro d'enregistrement jamais affiché (`numeroLabel` inutilisé), prix sans détail (ménage, taxe de séjour, charges), « acompte » écrit partout alors que le texte d'annulation décrivait des arrhes (L214-1 Code conso : sans précision, ce sont des arrhes), rien sur l'annulation par le bailleur, la rétractation (L221-28 12°, pas de droit), la caution (délai, retenues), la pièce d'identité, l'assurance ; caution de la fiche logement jamais reprise (toujours 0) ; IBAN affiché sur le contrat dès qu'il était renseigné, même pour un hôte payé par carte seulement.
- `lib/contracts/details.ts` (testé) : état descriptif (`buildEtatDescriptif`, repris côté serveur dans `createContract` depuis la fiche, `surface_m2`), `priceLines` (« dont frais de ménage », taxe comprise ou « à régler en plus » : le montant chargé reste `montant_loyer`, paiements et finances inchangés), `regimeText` (arrhes par défaut / acompte, droit français seulement), `bailleurCancelText` (remboursement sous 14 jours, double des arrhes, rétractation en France, force majeure), `arriveeText` (pièce d'identité montrée, jamais copiée, CNIL ; fiche de police CESEDA R814-1 à R814-3 ; SIBA au Portugal), `EXTRA_UI` fr/pt/en. Migration `20260929_118` : `contracts.details` (jsonb, instantané) + `clauses_particulieres(_pt/_en)` ; `logements.contrat_options` (`regime`, `delai_caution_jours`, `charges_incluses`) + `clauses_particulieres(_pt/_en)`. Tolérée si absente (insert et lecture de repli).
- `/sign/[token]` : les nouveaux articles (dépôt de garantie, annulation par le bailleur, arrivée et identité, assurance, clauses particulières, état descriptif et prix détaillé) ne s'affichent que si `contracts.details` existe : **un contrat déjà signé reste affiché tel qu'il a été signé**. Articles numérotés à l'affichage (`art()`), plus en dur. IBAN affiché seulement si « virement » est dans les modalités ou sans paiement en ligne. Texte d'annulation par défaut neutre (« les sommes versées à la réservation ») ; l'ancien reste reconnu (`LEGACY_DEFAULT_ANNULATION_FR`).
- **Aperçu du contrat** (29/09/2026, demande de Jason : « qu'ils voient à quoi ressemble le contrat de cette maison ») : `/apercu-contrat/<logement>` (hors dashboard, propriétaire vérifié) construit un contrat d'exemple par `previewFromLogement` (`lib/contracts/preview.ts`, testé : voyageur fictif, 3 nuits dans un mois au tarif moyen + ménage, caution de la fiche, propriétaire tiers en conciergerie) et l'affiche avec `ContractView` en mode `preview` : pas de signature ni de paiement, bandeau, pastille « Modifier » (lien `#modifier-<carte>` de la fiche, ou `/dashboard/profil#identite` pour les parties) ou « Texte légal » à côté de chaque article. Lien depuis la carte Contrat et depuis le bouton « Voir mon contrat » de Contrats & paiements (`PreviewContractMenu` dans `ContratsView.tsx`, lien direct avec un seul logement, sinon choix du logement). Assistant : bouton « Voir le contrat » à la dernière étape, contrat en cours déposé dans `localStorage` (`WIZARD_PREVIEW_KEY`) puis ouvert dans `/apercu-contrat/assistant`, rien en base.
- Main laissée aux hôtes : carte **Contrat** de la fiche logement (`id="contrat"`) + étapes Financier et Clauses de l'assistant (ménage, taxe de séjour, charges, arrhes ou acompte en France, délai de caution, clauses particulières). Le socle légal n'est pas modifiable, seulement complété (une clause ne peut pas retirer un droit légal au voyageur).

### Locataire professionnel + facturation
- `ContractModal.tsx` (étape "Locataire") : toggle Particulier/Professionnel. En professionnel, `locataire_structure` + `locataire_nif` sont saisis en plus du signataire (prénom/nom) — affichés sur `/sign/[token]` (Article 1) comme "[Structure], Représenté(e) par [Signataire], NIF : [nif]".
- **Facture** (`app/invoice/[token]/page.tsx`, page publique token-based comme `/sign/[token]`) : émise via `issueInvoice()` (`contract-actions.ts`), déclenchée par le bouton facture dans `VoyageurDetail.tsx` (visible une fois le contrat signé). Numérotation séquentielle sans trou via `issue_next_invoice_number()` (fonction SQL, incrémente `profiles.invoice_counter` de façon atomique, format `FA{année}-{0000}`) — obligation légale, jamais générée côté JS pour éviter les doublons/trous en cas d'appels concurrents. Idempotent : un contrat déjà facturé retourne son numéro existant sans en générer un nouveau.
- **Infos fiscales du bailleur** : `profiles.entreprise_numero` (SIRET/NIF) + `profiles.mention_tva` (éditables dans `/dashboard/profil`, `ProfilForm.tsx`), avec override par logement (`logements.numero_fiscal`/`mention_tva`, conciergerie — même priorité que l'IBAN) snapshotés sur le contrat (`bailleur_numero_fiscal`/`bailleur_mention_tva`) à l'émission de la facture.
- ⚠️ **Mention TVA — pas de défaut** : `profiles.mention_tva` n'a **plus** de valeur par défaut (migration `20260915_102`, corrige un bug de la migration `101` : le défaut français "TVA non applicable, article 261 D 4° du CGI" avait été appliqué automatiquement à TOUS les profils existants, y compris les hôtes portugais pour qui ce texte est légalement faux). L'hôte doit saisir lui-même la mention correcte dans `/dashboard/profil` selon son pays/statut réel — texte FR ci-dessus valable pour la location meublée de tourisme SANS prestations parahôtelières en France (à ne pas confondre avec la franchise en base art. 293B), IVA 6% obligatoire (jamais "non applicable") pour le Portugal. Jason Marinho n'a pas connaissance du statut fiscal exact de chaque hôte et ne peut pas le déduire automatiquement.
- ⚠️ **Risque légal volontairement non couvert** : générer une "vraie" facture avec TVA nécessite en général un logiciel de facturation certifié anti-fraude (France : NF525 ; Portugal : logiciel certifié obligatoire dès que TVA facturée) — cette page ne l'est PAS. Le document généré ici est correct pour un hôte en exonération de TVA (cas par défaut) mais ne doit pas être utilisé comme système de facturation certifié par un hôte assujetti à la TVA — le rediriger vers un outil dédié dans ce cas.
- ⚠️ **Cas Alojamento Local (Portugal)** : au Portugal, la facturation en Alojamento Local est **obligatoire** (même via Airbnb/Booking) et **exclusivement** via le Portail des Finances (e-fatura, gratuit) ou un logiciel certifié AT depuis 2024 (facture Excel/Word explicitement interdite). L'IVA n'est **pas toujours** à 6% (correction d'une affirmation précédente trop générale) : un hôte sous le seuil petite entreprise peut être au **regime de isenção** (article 53º du CIVA, 0% IVA), l'équivalent portugais de la franchise en base française (art. 293B) — vu en pratique sur une vraie fatura AT (`ATCUD`, exonération art. 53º nº1 CIVA) émise pour Casa do Pedreiro. `app/invoice/[token]/page.tsx` affiche donc un bandeau d'avertissement (`isPortugueseAL`, quand `contract.pays === 'PT'`) précisant que ce document n'est PAS une fatura valide et renvoyant vers le Portail des Finances — la page ne prétend jamais être conforme pour un logement portugais, contrairement au cas FR (exonération TVA) où elle l'est. **Décision (sept. 2026) : Jason émet lui-même les vraies faturas de ses logements portugais directement sur le Portail des Finances (gratuit, en dehors de l'app) — aucune intégration Moloni ou équivalent prévue côté app, le bandeau d'avertissement suffit.**
- La caution (`montant_caution`) n'apparaît jamais sur la facture : ce n'est pas un revenu, juste un dépôt de garantie remboursable.
- **Facture électronique (05/10/2026)** : `components/finances/HostInvoicingNotice.tsx` (Tiime / Indy, liens affiliés + mention) affiché sur `/invoice/[token]` pour l'hôte connecté seulement (`no-print`, jamais au voyageur, pas au Portugal) et dans Mon compte → Factures. Règle : location meublée sans services à un particulier, la facture de l'app suffit ; réception obligatoire depuis le 1/9/2026 pour tous ; émission + e-reporting au 1/9/2027 pour les loueurs avec TVA ou en para-hôtellerie (même en franchise). Article d'aide `emettre-facture.md` avec sources.

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
- **DA claire depuis le 29/09/2026** (avant : thème sombre peu lisible en mode clair) : fond #ECF5EF, carte blanche, vert #004C3F, filet jaune, titre Georgia. `lightify()` convertit à l'envoi les couleurs de l'ancien thème encore écrites en dur (contrat signé, inscription, rappel de paiement `resend-payment`, lien de caution `deposit-reminders`, qui ont leur propre HTML) : ne plus écrire de #e8ede8 / #FFD56B en texte, utiliser les helpers. Sujets et textes sans tiret cadratin ni emoji.
- `buildEmail({ title, body })` — wrapper principal
- `emailInfoBlock([{ label, value }], color)` — tableau infos
- `emailBtn(href, label, type)` — bouton CTA
- `emailP(text)` — paragraphe
- `escHtml(s)` — échapper HTML dans les emails

---

## Dates relatives et hydratation (sept. 2026)

- **Balises `<style>` inline** : React 18 échappe `' " & < >` dans `<style>{`...`}</style>`. Le CSS arrive cassé du serveur (`.a &gt; .b`, `content: &#x27;&#x27;`) et le texte ne correspond plus au rendu navigateur : erreur d'hydratation (#418/#425), page entièrement re-rendue côté client. Constaté sept. 2026 sur Questions & réponses (apostrophe dans un commentaire CSS). Règle : pas d'apostrophe, de guillemets ni de `>` dans ces blocs ; pour un sélecteur enfant ou des guillemets, utiliser `components/ui/InlineStyle.tsx` (CSS constant uniquement, jamais de donnée utilisateur). Garde-fou CI : `lib/ui/inline-style-guard.test.ts`.

- Réseaux sociaux (`/dashboard/admin/social`, 12 erreurs #425 en sept. 2026) : « Prochain créneau libre » calculé avec l'heure du serveur (UTC) puis du navigateur (Paris). Calculé maintenant après le montage seulement ; dates affichées avec `timeZone: 'Europe/Paris'`.
- « il y a 3 min » calculé au rendu serveur puis recalculé dans le navigateur diffère souvent : React lève l'erreur #425 (vue 8 fois dans `app_errors` sur le forum). Toujours afficher une date relative via `components/ui/RelativeTime.tsx` (`<time suppressHydrationWarning>`), jamais `{formatRelative(...)}` directement dans le JSX. Même règle pour tout texte qui dépend de l'heure courante ou du fuseau (`Date.now()`, `toLocaleDateString` sans `timeZone`) rendu dans un composant client.

## Nouvelle formation : check-list (26/10/2026)

Jason : « dès qu'il y a une nouvelle formation, il faut une page, la mettre dans Services et Formations, et que tous les chiffres soient connectés ». Le test `jason-app/lib/formations/catalogue-sync.test.ts` fait échouer la CI s'il manque une étape (pour chaque dossier de `app/dashboard/formations/` qui a un `content.ts`).
1. `app/dashboard/formations/<slug>/content.ts` + `page.tsx` (`buildFormationPage`), tableaux Markdown avec la ligne `| --- |`.
2. Inscription dans l'app : `ACTIVE_SLUGS` de `formations/page.tsx`, `SLUG_CATEGORY` de `FormationsGrid.tsx`, `admin/formations/[slug]/contentMap.ts`, `lib/formations/relations.ts`, éventuellement `recommend.ts` (+ test).
3. Migration `YYYYMMDD_NNN_seed_formation_<slug>.sql` (upsert dans `formations`, `is_published`), puis le workflow « Publier le contenu des formations » (`formations: <slug>`, `apply: true`).
4. Site : page `services/formations/<slug>/index.html` (FAQ, Course, BreadcrumbList), carte `f-card` dans `services/formations/index.html`, `sitemap.xml`, `llms.txt`.
5. Compteurs : rien à faire, `scripts/sync-counts.mjs` recompte les dossiers à chaque build (site et app) et réécrit `FORMATIONS_TOTAL` et les « N formations ».
6. Annonce : entrée `CHANGELOG` (titre « Nouvelle formation : … », cloche et lettre du mois), badge « Nouveau » automatique 45 jours (`lib/formations/nouveau.ts`, d'après `formations.created_at`, nouveautés non commencées en tête du catalogue), post + stories dans `data/social-queue/`, et prévenir le membre qui l'a suggérée (table `suggestions`) avec l'accord de Jason.
7. Comptes exclus des annonces de formations : `profiles.masquer_annonces_formations` (migration 163, coché en base, jamais d'adresse dans le dépôt) ; `changelogFor()` retire ces entrées de la cloche et du compteur.
