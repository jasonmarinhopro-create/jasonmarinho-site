# Projet : catégorie « Maintenance et dépannage » (3e métier de l'annuaire)

Préparé le 28/10/2026, à lancer la semaine du 2/11/2026. **Lire ce fichier en entier avant de toucher au code.** Side project, pas d'urgence : Jason veut « faire les fondations de manière propre pour ensuite lancer le chantier et que tout tienne debout sans rien casser ».

## Décisions et contexte (Jason, 28/10/2026)

- **Origine** : une conciergerie présente partout en France a besoin « d'un endroit où elle peut tout trouver facilement et proprement ». Les pros viendront au fur et à mesure.
- **Décision** : on construit (pas de test préalable : « si tu me dis qu'il y a un besoin c'est l'essentiel »). Le besoin est réel sur le marché (sources plus bas) ; chez nous, au 28/10 : 53 membres, 3 demandes d'hôtes en tout, 3 photographes et 1 équipe de ménage en ligne. Donc lancer **avec des pros dedans** (prospection) et ne jamais laisser une page vide sans issue.
- **À faire, dans les mots de Jason** : recréer toutes les pages des villes, les mettre dans le footer, les indexer une à une, le mettre dans le dashboard, créer le produit Stripe, la création de compte (inscription des pros), la prospection par e-mail, l'ajouter dans les articles de blog, « penser à tous les endroits où ajouter cet élément ».

## Positionnement (analyse du 28/10)

- **Nom de la catégorie** : « Maintenance et dépannage », sous-titre « électricité, plomberie, chauffage, petits travaux, montage ». Pour parler des pros : « les pros de la maintenance » (inclusif sans point médian). Éviter « techniciens du logement » (personne ne le cherche), « techniciens multiservices » (exclut le spécialiste), « artisans et dépannage » (exclut les auto-entrepreneurs « homme toutes mains »).
- **Promesse** : la prévention, pas l'urgence. « Trouve ton pro de confiance près de ton logement avant le premier pépin. » Différence : des pros qui connaissent la location courte durée (intervention entre deux voyageurs, accès autonome par boîte à clés, photo après intervention, facture au propriétaire, disponibilité soir et week-end affichée).
- **Publics** : hôtes et propriétaires, gîtes, chambres d'hôtes, hôtels (clientèles déjà gérées pour les autres métiers), **conciergeries** (cible prioritaire ici, contrairement aux autres métiers : multi-villes, besoin récurrent).
- **Modèle** : abonnement annuel sans commission, comme les autres métiers (Fondateur 39,98 € puis 79,98 €, à confirmer par Jason). Pas de paiement au contact (modèle des sites de devis, détesté des artisans, contraire à « sans commission »).
- **Confiance (point à valider avec Jason, différent des autres métiers)** : le dépannage est un secteur à arnaques (DGCCRF : près de 2 600 signalements en 2024 en plomberie, serrurerie, chauffage ; plus de 60 % d'entreprises en infraction lors des contrôles ; 47 % des plateformes de dépannage contrôlées non conformes). Pour les photographes et le ménage, Jason a refusé toute validation à la main ; ici, proposer des **contrôles automatiques** : SIRET actif vérifié (API annuaire-entreprises.data.gouv.fr, gratuite), attestation d'assurance RC pro déposée (date de fin affichée, rappel avant expiration), tarifs de déplacement et horaires sur la fiche, mention claire « inscription payante pour les pros, aucune commission » (obligation de transparence des plateformes, art. L111-7 du code de la consommation : vérifier le texte avant d'écrire la page).
- **Concurrents** : MesDépanneurs.fr (urgence, plus de 1 200 artisans selon eux, partenaire de la conciergerie Welkeys), AlloVoisins (abonnement pro, environ 29,99 € par mois selon un site tiers, à vérifier), sites de devis travaux, Google Maps, réseaux internes des conciergeries. Aucun annuaire français dédié aux hôtes de location courte durée trouvé.

> Sources : [DGCCRF, plateformes de dépannage](https://www.economie.gouv.fr/dgccrf/controle-des-plateformes-de-depannage-domicile) · [Que Choisir](https://www.quechoisir.org/actualite-depannage-a-domicile-toujours-autant-d-escrocs-n22721/) · [Consoglobe](https://www.consoglobe.com/depannage-a-domicile-arnaques-infractions-cg) · [Welkeys x MesDépanneurs](https://www.welkeys.com/blog/la-maintenance-de-vos-locations-airbnb-avec-mesdepanneurs-fr) · [PriceLabs](https://hello.pricelabs.co/fr/blog/catastrophes-en-serie-les-pires-imprevus-des-hotes-et-comment-y-survivre/) · [Rentaplus](https://rentaplus.immo/blog/gestion-urgences-airbnb-argenteuil-sarcelles/) · [Journal des Entreprises, AlloVoisins](https://www.lejournaldesentreprises.com/article/la-plateforme-nantaise-allovoisins-ouvre-son-capital-ses-salaries-et-un-fonds-2077410) · [Copeps](https://copeps.fr/actualites/allo-voisin-auto-entrepreneur/)

## Avancement (lancé le 31/10/2026)

**Décisions de Jason (31/10/2026)** : lancement immédiat ; adresses en `depannage` (`/annuaires/depannage`, `depannage-lcd-<ville>`, fiches `/annuaires/depannage/<slug>`), nom affiché « Dépannage et maintenance » (« maintenance » seul renvoie surtout des offres d'emploi sur Google ; « dépannage » est le mot des particuliers ; titres de ville « Plombier, électricien et dépannage à <ville> ») ; même prix que les autres métiers (39,98 € Fondateur pour 20 places, puis 79,98 € TTC/an) ; **aucun contrôle SIRET ni assurance** (« la barrière des 40 euros ») ; les 9 spécialités proposées ; produit Stripe créé directement en réel. Après le projet : refonte visuelle du devis, commune aux 3 métiers. Jason veut que les changements visuels s'appliquent aux 3 annuaires d'un coup (composants communs, registre).

**Fait** :
- Fonctions du site regroupées : `api/pro/[kind]/[action].js` (5 fonctions sur 12), traitements dans `scripts/api-pro/<métier>/`, anciennes adresses réécrites (`vercel.json`). Ajouter `depannage` = modules `scripts/api-pro/depannage/{contact,signup,track}.cjs` + entrée `HANDLERS`.
- Registre : `jason-app/lib/pros/metiers.ts` (`ProKind` = photographer | cleaner | depannage, `METIERS`, `SPECIALITES_DEPANNAGE`) et `scripts/lib/metiers.mjs`, vérifiés identiques par `metiers.test.ts`. `resume-checkout.ts` le lit déjà. `depannage.ouvert = false` tant que tout n'est pas prêt.
- Base (migration 170, appliquée) : `depannage_pros` (colonnes communes + `specialites`, `disponibilites`, `delai_intervention` jour_meme|24h|48h|semaine, `deplacement_prix`, `tarif_heure`), `depannage_contacts`, vue `public_depannage_view`, RLS comme le ménage, sonde dans `MIGRATION_PROBES`.

**Reste, dans l'ordre** :
1. ~~Stripe~~ **fait le 31/10/2026** : produits réels « Dépannage LCD Fondateur » (`prod_VXftnBCT1DjktG`, prix `price_1UWaY4J7Hsyvd5AVN7yf2RAk`, 39,98 €/an) et « Dépannage LCD Standard » (`prod_VXftmq7AjbXIxt`, prix `price_1UWaY4J7Hsyvd5AVI3xZApip`, 79,98 €/an), mêmes réglages que le ménage ; `STRIPE_DEPANNAGE_FOUNDER_PRICE_ID` et `STRIPE_DEPANNAGE_STANDARD_PRICE_ID` (sensibles, production + preview) sur les projets site et dashboard. Webhook et places Fondateur : à brancher avec l'inscription (`activate.ts`, `founder-seats.ts`, `api/annuaire-places.js`).
2. ~~Espace pro~~ **fait le 31/10/2026** :
   - Tronc commun `jason-app/lib/pros/fiche-core.ts` (cible du pro ou de l'admin, brouillon, mise en ligne, logo, photos, abonnement, demandes, carnet clients), métier en paramètre. Le dépannage l'utilise (`app/dashboard/ma-fiche-depannage/actions.ts` : seuls ses champs propres y sont vérifiés). **Ménage et photographe restent sur leur ancien fichier** : les y brancher plus tard, sans urgence.
   - Écrans : `ma-fiche-depannage` (atelier : Spécialités, Disponibilités, Formules et prix avec tarif horaire et déplacement, pas d'assurance), `demandes`, `clients`, `devis`, `devis/[id]`, `facturation`, `statistiques` ; `creer-fiche-depannage` (« Bientôt » tant que `ouvert = false`, sauf pour l'admin). Listes du métier : `lib/pros/depannage.ts`. Actualités et Idées du dépannage masquées du menu jusqu'à l'étape 4.
   - Registre branché partout côté app : devis (`billing*.ts`, suggestions de lignes, unité « mois »), activation et webhook Stripe (`proFromMetadata`, `depannage_id` en métadonnée), synchro des abonnements, `apres-paiement?pro=depannage`, compteurs du menu (`nav-counts.ts`, `menu_state`), espaces du compte (`spaces.ts`, en-tête, menu), connexion `?as=depannage`, statistiques (`pro-load.ts`, `ProMetier` de la visibilité), bilan mensuel, e-mail de bienvenue (textes seulement), jauge de complétude.
   - Vérifié : types, 724 tests, lint, rendu de Ma fiche à 1280 et 390 px.
3. Étape 3 (site) : `scripts/api-pro/depannage/{contact,signup,track}.cjs` + `HANDLERS`, `api/annuaire-places.js`, annuaire, fiches, inscription, pages de ville, injections. Puis admin (`/dashboard/admin/depannage`, déjà visé par les liens du mode admin), e-mails, blog, prospection.

## Questions à poser à Jason au démarrage (avant d'écrire du code)

1. Nom définitif de la catégorie et des URL (proposition : annuaire `/annuaires/maintenance`, pages de ville `maintenance-lcd-<ville>`, fiches `/maintenance/<slug>`).
2. Liste des spécialités (proposition : électricité, plomberie, chauffage et climatisation, serrurerie, multiservice et petits travaux, montage de meubles, vitrerie, électroménager, entretien extérieur). Un pro peut en cocher plusieurs.
3. Prix (même grille que les autres métiers ?) et nombre de places Fondateur.
4. Contrôles automatiques (SIRET, assurance) : oui ou non.
5. La conciergerie qui a donné l'idée : peut-on la citer, lui proposer d'être la première à tester la recherche multi-villes ?

## Les fondations (phase 0, avant toute page)

Aujourd'hui chaque métier est câblé à la main en double (tables `photographers` et `cleaners`, `api/photographer/*` et `api/cleaner/*`, `ma-fiche-photographe` et `ma-fiche-menage`, `ProKind = 'photographer' | 'cleaner'`, `metier === 'menage' ? … : …` dans des dizaines de fichiers). Ajouter un 3e métier en recopiant une 3e fois rendrait tout fragile. Ordre :

1. **Registre des métiers** : un seul fichier de configuration (côté app `lib/pros/metiers-registry.ts` et son équivalent pour les scripts du site) : clé, table, libellés (singulier, pluriel, avec article), URL (annuaire, fiche, page de ville, inscription), icône, variables Stripe, champs propres au métier, textes d'e-mail. Remplacer les ternaires `menage ? … : …` par des lectures du registre, **sans changer le comportement** des deux métiers existants (tests avant / après, captures des pages, test « Test inscription pro » au vert).
2. **Fonctions serveur du site : 10 sur 12 utilisées** (Vercel Hobby). Un 3e métier copié (signup, contact, track) ferait 13 et bloquerait tous les déploiements. Regrouper en fonctions communes à tous les métiers (par exemple `api/pro/[action].js` avec le métier en paramètre, ou fusion de signup, contact et track par métier), en gardant les anciennes adresses par des réécritures `vercel.json`. Le contrôle CI « Au plus 12 fonctions » doit rester vert.
3. **Base** : nouvelle table `maintenance_pros` sur le modèle de `cleaners` (migration `YYYYMMDD_NNN_maintenance_pros.sql` rejouable, RLS, vue publique `public_maintenance_pros_view`, sonde dans `MIGRATION_PROBES`), colonnes communes (fiche vitrine, formules, villes couvertes, photos, clientèles, téléphone affiché, brouillon `fiche_draft`, réseaux, déroulé) + propres (`specialites text[]`, `intervention_delai`, `disponibilites` soir / week-end, `deplacement_prix`, `siret`, `siret_verifie_at`, `assurance_fin`, `assurance_doc_path`). Contacts (`maintenance_contacts`), vues, recommandations, statistiques : mêmes tables ou colonnes `kind` que les autres métiers (vérifier lesquelles sont déjà génériques).
4. **Demandes d'hôtes** (`demandes_hotes.metier`) : ajouter `maintenance` dans `lib/demandes/rules.ts`, `send.ts`, `emails.ts`, `public.ts`, `prise.ts`, l'aperçu `api/demandes/apercu` et le QG. Besoin = spécialité (plomberie, électricité…), urgence (« dès que possible » / « à planifier »).

## Le chantier (après les fondations), endroit par endroit

### Site statique
- [ ] Générateur `scripts/build-maintenance.mjs` (ou générique) : annuaire `/annuaires/maintenance` (cartes « Monogramme », filtres par spécialité, recherche par ville avec villes couvertes, état vide propre avec « Décris ton besoin »), fiches vitrine, branché dans `scripts/build-site.sh` **avec le garde-fou** « Supabase injoignable = build arrêté » (voir `technique.md`, panne du 28/10).
- [ ] Fiche d'exemple fictive (`build-exemples-fiches.mjs`), statistiques d'exemple (`inject-stats-demo.mjs`, `lib/stats-demo.mjs`).
- [ ] **Pages de ville** : 62 villes ont aujourd'hui 3 pages (photographe, ménage, devenir hôte). Ajouter la 4e (`maintenance-lcd-<ville>`) dans `build-pages-pros-villes.mjs`, `creer-ville.mjs`, `verifier-villes.mjs` et le contrôle CI « Chaque ville a ses 3 pages » (passe à 4). **Puis relancer toutes les injections** (règle de `villes.md`) : `inject-ville-pros`, `inject-pros-links`, `inject-villes-voisines`, `inject-chiffres-ville`, `inject-demande-cta`, `inject-local-villes`, `inject-villes-blog`, `sync-counts`.
- [ ] Liens croisés : chaque page photographe / ménage / devenir hôte d'une ville pointe vers la page maintenance de la même ville, et inversement ; guides de ville ; villes voisines.
- [ ] `footer.js` (catégorie dans les annuaires + villes), `nav.js` (menu Annuaire), `sitemap.xml` (annuaire, 62 pages, fiches), `llms.txt`, `robots.txt` (sitemap des fiches).
- [ ] Pages pros : `/annuaires/maintenance/inscription` (via `build-inscription-pros.mjs`), `/pour-qui/maintenance` (via `build-pour-qui-pros.mjs` + captures `captures-pour-qui.mjs`), `/devenir-...` si on en fait une, `/tarifs`, `/services`, `/trouver-un-pro` (`build-trouver-un-pro.mjs` : 3e choix avec spécialité et urgence), page d'accueil (encart annuaires), `/chiffres`.
- [ ] `scripts/lib/annuaire-hote.mjs` (`ANNUAIRES` : textes, 5 questions à poser à un dépanneur, « Prépare ton logement », FAQ HTML + JSON-LD), `secteur.mjs`, `fiche-signature.mjs`, `fiche-v3.mjs`, `fiche-vitrine.mjs`, `pro-contact-email.cjs`, `app-cta.mjs`, `partenaires.mjs` si besoin.
- [ ] SEO : `<title>` ≤ 60 caractères, h1 « … pour locations courte durée à <ville> » (pas « Airbnb » seul : toutes les plateformes), données structurées (`LocalBusiness`/`HomeAndConstructionBusiness` pour les fiches, `FAQPage`), aucune promesse ni chiffre inventé (tarifs renvoyés aux fiches).
- [ ] **Indexation** : soumettre les 62 pages et l'annuaire dans Search Console une par une (Jason, à la main, URL fournies dans une liste prête à copier), suivi par le workflow « SEO indexation check » (`check-indexation.yml`) et l'onglet Indexation de l'admin.

### Blog
- [ ] Articles hôtes : « Constituer son équipe de maintenance avant le premier pépin », « Que faire quand une panne arrive pendant un séjour » (avec la marche à suivre et les pièges du dépannage, sources DGCCRF), « Les 10 pannes les plus fréquentes en location courte durée et comment les prévenir ». Format et règles : `scripts/articles/CONSIGNES.md`, sources citées.
- [ ] Articles pros : « Artisan : travailler avec les hôtes et les conciergeries », sur le modèle de `devenir-prestataire-menage-airbnb-se-lancer.mjs`.
- [ ] Encarts dans les articles existants qui parlent de pannes, d'état des lieux, de check-list, d'urgence, de conciergerie (chercher dans `blog/` et `scripts/articles/`), via `inject-villes-blog.mjs` ou un encart dédié.

### App (dashboard)
- [ ] Créer ma fiche (`creer-fiche-maintenance`), Ma fiche (atelier : même `Atelier.tsx`, `useFicheDraft`, `ZoneEditor`, `FichePreview`, sections propres : spécialités, disponibilités, déplacement, assurance, SIRET), demandes, clients, statistiques (`ProStatsPage`), devis et factures (`billing-actions.ts`, `ProKind`), Mon abonnement, « Finaliser mon paiement » (`resume-checkout.ts`), après paiement (`apres-paiement`, `activate.ts`).
- [ ] Inscription et connexion : `auth/register`, `auth/login` (choix du métier, `?as=`), espaces multiples (un membre peut être hôte et pro), menu (`dashboard/layout.tsx`, `nav-counts.ts`), notifications (`notifications/present.ts`).
- [ ] Côté hôte : « Trouver un pro » dans l'app, page logement (pros recommandés près du logement), recommander un pro (`recommander/actions.ts`), calendrier si un pro de maintenance est lié à un logement (plus tard).
- [ ] E-mails : bienvenue pro (`pro-welcome.ts`), bilan mensuel (`pro-monthly.ts`), demandes (`demandes/emails.ts`), contact (`pro-contact-email.cjs`). Aperçu montré à Jason avant tout changement de design d'e-mail.
- [ ] Newsletter « Le Check-in » : public pros maintenance (`newsletter/editions.ts`, `audience.ts`), actualités (`actualites/audience.ts`).

### Admin
- [ ] Page « Maintenance » (sur le modèle de `admin/menage`), QG des demandes, Ventes (`sales-load.ts`, `revenue.ts`), Membres (espaces), Visibilité (fiches, pages pros), Provenance, État de santé (sonde de migration, compteurs), Idées (espace maintenance).
- [ ] Rien de lisible dans les demandes ou le carnet clients d'un pro (règle de confidentialité).

### Stripe
- [ ] Produit « Annuaire Maintenance et dépannage » + 2 prix (Fondateur, Standard) en mode test puis réel ; variables `STRIPE_MAINTENANCE_FOUNDER_PRICE_ID` et `STRIPE_MAINTENANCE_STANDARD_PRICE_ID` sur les **deux** projets Vercel (site et app) ; webhook : `metadata.kind` lu par `activate.ts` ; places Fondateur (`founder-seats.ts`, `api/annuaire-places.js`).

### Prospection par e-mail
- [ ] Séquence dédiée (`lib/outreach/playbook.ts`) : artisans et auto-entrepreneurs du bâtiment dans les villes où il y a des hôtes, puis conciergeries (argument « un seul endroit pour trouver un pro de maintenance dans toutes tes villes »). Règles CNIL et envois : `docs/claude/prospection.md`. **Aucun e-mail envoyé sans l'accord de Jason** ; textes montrés avant.
- [ ] Imports (Google Places sous le quota `takePlacesCall`, 900 appels par mois), réserve, page « Prospection » de l'admin (onglet métier).

### Réseaux sociaux
- [ ] Gabarits et stories « Trouver un pro de maintenance », annonce du lancement (routine Community manager, `docs/claude/reseaux-sociaux.md`).

## Vérifications avant chaque mise en ligne
- `npx tsc --noEmit -p .`, `npx vitest run`, `npx next lint --quiet` dans `jason-app/`, CI « Site statique » (12 fonctions, 4 pages par ville, syntaxe des scripts).
- Workflow « Test inscription pro » étendu au 3e métier (inscription fictive, Ma fiche, nettoyage).
- Captures 1920 / 1280 / 390 px des nouvelles pages ; photographes et ménage inchangés (captures avant / après).
- Après déploiement : annuaire rempli, fiches, pages de ville, footer, demande « Trouver un pro » de bout en bout.

## Ordre proposé pour la semaine
1. Questions à Jason (ci-dessus), registre des métiers et regroupement des fonctions serveur (sans changement visible), tests au vert.
2. Base (migration), Stripe (produit, variables), inscription et Ma fiche dans l'app.
3. Site : annuaire, fiches, fiche d'exemple, inscription, pour-qui, trouver un pro, footer, menu.
4. Les 62 pages de ville, injections, sitemap, liste d'URL à indexer.
5. Admin, e-mails, newsletter, blog, prospection (textes validés par Jason), réseaux.
