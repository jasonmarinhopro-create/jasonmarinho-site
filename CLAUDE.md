# CLAUDE.md — Jason Marinho LCD Platform

Index court, chargé automatiquement dans **chaque** session (dont les routines). **Garder ce fichier sous 25 Ko** (test `jason-app/lib/docs/claude-md-size.test.ts`) : le 20/10/2026, à 350 Ko (~95 000 jetons), il remplissait à lui seul la moitié de la mémoire de la routine Actualités (Sonnet), qui échouait chaque matin (« Autocompact is thrashing », « fenêtre de contexte pleine »).

**Où écrire une nouvelle note** : dans le fichier du sujet sous `docs/claude/` (liste plus bas), jamais ici, sauf une règle valable pour tout le projet (une ligne). **Avant de travailler sur un sujet, lire son fichier** : il contient les décisions de Jason, les pièges déjà rencontrés et les faits vérifiés.

---

## Architecture

```
/                          ← site statique marketing (Vercel, jasonmarinho.com)
  nav.js / footer.js       ← menu et pied de page injectés sur toutes les pages
  vercel.json              ← redirections, en-têtes, cache, buildCommand (scripts/build-site.sh)
  sitemap.xml, llms.txt    ← à tenir à jour (URL sans « / » final sauf l'accueil)
  services/ blog/ pour-qui/ annuaires/ photographe-lcd-* menage-lcd-* devenir-hote-airbnb-*
  api/                     ← fonctions serverless du site (12 au plus, Vercel Hobby)
  scripts/                 ← générateurs et injections (pages, articles, villes, partenaires)
  data/                    ← consignes et files des routines (actualités)
  docs/claude/             ← documentation interne détaillée (ce dossier)

jason-app/                 ← dashboard Next.js 14 App Router (app.jasonmarinho.com)
  app/dashboard/  app/dashboard/admin/  app/api/  app/auth/  app/sign/[token]/
  components/  lib/  content/help/
  supabase/migrations/     ← YYYYMMDD_NNN_nom.sql obligatoire
```

## Stack

Next.js 14 · Supabase (PostgreSQL + RLS) · Stripe Connect (loyer + caution) · Resend (e-mails de l'app) · Brevo (newsletter) · Phosphor `@phosphor-icons/react/dist/ssr` · next/font Fraunces + Outfit · Vercel Analytics (pas de gtag) · Vercel Hobby, fonctions à Londres `lhr1` (base Supabase à Londres).

---

## Règles qui valent partout

**Écriture**
- Jamais de tiret cadratin (—) ni d'emoji dans un texte destiné aux utilisateurs (site, app, e-mails, formations, articles). Tutoiement côté hôtes et pros.
- Sujet fiscal ou juridique : vérifier par recherche web, citer la source (`> Source : …`). Aucun chiffre inventé, aucune promesse que le code ne tient pas.
- Ne jamais décrire une fonction de l'app sans l'avoir vérifiée dans le code.

**Code**
- Auth : `getUser()` dans les actions et pages sensibles ; routes admin : `profile.role === 'admin'` vérifié côté serveur.
- Service role : seulement via `getServiceClient()` (`@/lib/supabase/service`), toujours avec un filtre explicite ; préférer le client utilisateur (RLS). Garde-fou CI.
- Icônes : `@phosphor-icons/react/dist/ssr`, jamais le package racine.
- Styles en ligne `style={{…}}` (pas de Tailwind). Couleurs de la marque (vert `var(--accent-text)`, touche de jaune), **jamais de bleu ni de violet** côté hôte. Pages du dashboard en pleine largeur, vérifiées à 1920 / 1280 / 390 px. `border` complet, jamais `borderColor` seul sur un style qui s'ajoute et se retire.
- Pas de `window.confirm/prompt/alert` : `useConfirm()`. Pas de `<input type="date">` : `CalendarInput` (app) / `/calendrier.js` (site). Pas de `<datalist>` nu : `SuggestInput` / `/suggestions.js`.
- Dates relatives : `RelativeTime` ; tout texte dépendant de l'heure rendu côté client : fuseau `Europe/Paris` explicite. `<style>` en ligne : pas d'apostrophe ni de `>` (sinon `InlineStyle`).
- ILIKE : échapper `[%_\\,]`. Pas de `dangerouslySetInnerHTML` sans échappement. `.select()` avec colonnes listées.
- Supabase renvoie 1 000 lignes au plus : `allRows` (`lib/supabase/all-rows.ts`) pour toute table qui peut dépasser.
- Tout `fetch` qui obtient un jeton ou lit une donnée qui change : `cache: 'no-store'`.
- Après une server action qui revalide la page : pas de `router.refresh()` en plus. Optimiste d'abord, retour en arrière si erreur.
- Calcul pur ajouté dans `lib/` = un test Vitest à côté. Vérifs avant push (dans `jason-app/`) : `npx tsc --noEmit -p .`, `npx vitest run`, `npx next lint --quiet`.

**Base et migrations**
- Migration `YYYYMMDD_NNN_description.sql`, rejouable (`if not exists`, `create or replace`, pas de `create index concurrently`) : appliquée par le workflow « Migrations Supabase » au push sur main. Code tolérant tant qu'elle manque ; ajouter une sonde dans `MIGRATION_PROBES` (page État de santé).

**Tâches automatiques (workflows, routines)**
- Toute tâche qui lit Supabase ou l'app : délai par requête, nouveaux essais sur 5xx / réseau, et jamais de publication d'un état vide sur erreur (échouer et garder l'existant). Voir `docs/claude/technique.md`, « Panne Supabase du 28/10/2026 ».
- Script nouveau : exécuté en local (ou à blanc) avant le premier passage en ligne. Workflows de test ou de diagnostic : lancement à la main (`workflow_dispatch`, `gh api …/dispatches`), jamais sur push : chaque échec envoie un e-mail à Jason.

**Déploiement**
- Seul `main` déploie (branches `claude/**` désactivées) : 100 déploiements par jour au plus, regrouper les pushes. Vérifier : statuts du commit, contextes « Vercel – jasonmarinho-dashboard » et « Vercel – jasonmarinho-site ».
- Site statique : 12 fonctions au plus sous `api/` (compter avant d'en ajouter ; code partagé hors de `api/`).
- Ne jamais lancer `build-pages-pros-villes.mjs` sans relancer toutes les injections ensuite (voir `docs/claude/villes.md`).
- Rester dans les offres gratuites (Supabase Free, Vercel Hobby, Google Places sous 900 appels par mois via `takePlacesCall`, Resend 100 e-mails par jour).

**Données et confidentialité**
- Dépôt public : journaux des workflows en nombres seulement, jamais d'e-mail, de nom ni de secret.
- Aucune page admin ne lit le contenu des demandes ou du carnet clients d'un pro. Fiches d'exemple (comptes admin) toujours fictives et hors chiffres.
- Aucun e-mail envoyé à des tiers (pros, membres) sans l'accord de Jason.

**SEO et affiliation**
- `<title>` ≤ 60 caractères. Lien affilié : `rel="sponsored noopener"` + mention visible « Lien affilié ». Vérifier qu'une URL interne existe avant de la citer.

---

## Documentation détaillée (`docs/claude/`)

| Fichier | Sujet |
|---|---|
| `conventions.md` | Conventions détaillées : contenu des formations, auth, service role, styles (suggestions, calendrier, couleurs), contrats (conciergerie, multilingue, contrat complet, aperçu), facturation, tables principales, e-mails Resend, hydratation |
| `seo-partenaires.md` | Site statique : SEO, pages ville enrichies, comparatifs, pages service, menus `nav.js`, `/partenaires`, tous les partenaires affiliés (Lodgify, Hospitable, Shine, Qonto, Indy, LegalPlace, Tiime, JD2M, AirDNA, Brevo) et codes promo JASON15 |
| `pros-annuaire.md` | Photographes, vidéastes, équipes de ménage : fiches vitrine, carte du secteur, annuaires, Trouver un pro (demande inversée, QG, e-mails, cas sans pro), bouton Contacter, inscription et paiement des pros, pages devenir / pour qui, blog et Google, ventes |
| `villes.md` | Pages de ville, créer une ville (3 pages), Québec, taxe de séjour officielle, villes voisines, compteurs automatiques |
| `visibilite-acquisition.md` | Visibilité (Search Console, statistiques des pros), provenance et liens suivis, onglets Groupes / Messages privés, `/chiffres` public, trafic, indexation Google |
| `newsletter-actualites.md` | Lettre « Le Check-in » (Brevo, éditions par public) et veille Actualités (routine, anti-doublon, publics) |
| `espace-hote.md` | Espace hôte : accueil, réservations iCal, voyageurs, contrats et cautions, finances et fiscalité 2026, calculateurs, logements, sécurité voyageur, Mon compte, abonnement, aide, Idées, investisseur |
| `technique.md` | Performances et lenteurs, ouverture de l'app, notifications et Web Push, synchro iCal, CI et erreurs, quotas, déploiements, sidebar et mode admin, variables d'environnement, rate limiting |
| `prospection.md` | Prospection par e-mail : séquences, pipeline, envois, montée en charge, imports, règles CNIL |
| `paiements-stripe.md` | Stripe : loyer, acompte, caution (calendrier, retenue), comptes connectés, frais, webhooks |
| `reseaux-sociaux.md` | Publication Facebook / Instagram programmée, réponses automatiques, routine « Community manager » (Reels, carrousels, réponses aux commentaires, rapport du dimanche) |
| `projet-maintenance.md` | **Ouvert le 31/10/2026** : 3e métier de l'annuaire « Dépannage et maintenance » (registre `lib/pros/metiers.ts` + `scripts/lib/metiers.mjs`, tronc commun `lib/pros/fiche-core.ts`, une ville = 4 pages), ce qui reste (étape 4) (décisions de Jason, fondations, liste de tous les endroits à modifier, Stripe, pages de ville, blog, prospection) |

Autres documents : `scripts/articles/CONSIGNES.md` (routine Rédaction article), `data/CONSIGNES-ACTUALITES.md` (routine Actualités), `docs/AUDIT-PAGES-A-FUSIONNER.md`, `docs/REFACTOR-DASHBOARD.md`.

## Domaines

- `jasonmarinho.com` → site statique Vercel
- `app.jasonmarinho.com` → dashboard Next.js Vercel
