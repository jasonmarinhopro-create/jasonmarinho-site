# Géographie, pied de page et fil d'Ariane (chantier ouvert le 09/11/2026)

Partie de la documentation interne (index : CLAUDE.md à la racine). Feuille de route validée par Jason le 09/11/2026 (« il faut faire les choses au fur et à mesure et avec prudence ») : document Claude Docs « Feuille de route : géographie, pied de page et fil d'Ariane » (https://claude.ai/artifact/Ns9zWLWgKxRrcGAGgtThtU).

## Décisions de Jason

- Ordre : fondations d'abord (audit, registre, branchement), puis pied de page, fil d'Ariane, statistiques, pages région, suivi Search Console. Une mise en ligne par étape, contrôlée avant la suivante.
- Pays prévu dans les données (France, Canada pour Québec, pays des études de revenus) mais **aucun filtre pays affiché** tant qu'un seul pays a plusieurs pages. Prochains pays : francophones.
- Pages département et région : seulement avec du contenu propre (vrais pros, villes, règles régionales), régions d'abord, départements au seuil, `noindex` tant que la page est maigre (règles Google « doorway » et « scaled content abuse »).
- Aucune adresse de page ne change (fil d'Ariane sans redirection).

## Étapes

| # | Étape | État |
|---|---|---|
| 1 | Audit du fil d'Ariane : `node scripts/audit-fil-ariane.mjs` (`--write` écrit la référence `scripts/data/audit/fil-ariane.json`, `--diff` compare). Relevé dans le job « villes » sans échec. | Fait le 09/11/2026 |
| 2 | Registre `scripts/data/registre-geo.mjs` (slug, nom, code INSEE ou pays/province, pages, étude de revenus) ; `scripts/lib/registre-geo.mjs` en déduit département et région officiels (données IGN `scripts/data/geo`) ; `node scripts/build-registre-geo.mjs` contrôle et écrit la copie de l'app `jason-app/lib/geo/registre.ts` (générée, test `registre.test.ts`) ; `--check` dans le job « villes » ; `creer-ville.mjs` exige la ville dans le registre. | Fait le 09/11/2026 |
| 3 | Brancher le registre à la place des listes recopiées (`CITIES` de footer.js, `REGIONS` de inject-villes-voisines, `CITY_PAGE_SLUGS`, `VILLE_LABELS`, `COMMUNES` de la taxe, `VILLES_INTERNATIONAL`). Villes voisines par vraie région. | Fait le 09/11/2026 (voir plus bas) |
| 4 | Pied de page : titre et phrase par onglet, liens dans le HTML au build, villes par région, les 39 études de revenus (le pied de page n'en montrait que 22). | Fait le 09/11/2026 (voir plus bas) |
| 5 | Fil d'Ariane : une fonction pour le fil visible et le JSON-LD ; niveau affiché seulement s'il a une page. | Fait le 09/11/2026 (voir plus bas) |
| 6 | Statistiques par département et région (/chiffres, Mes statistiques, admin Visibilité). | Fait le 09/11/2026 (voir plus bas) |
| 7 | Pages région puis département au seuil. | Pages région des 3 annuaires faites le 09/11/2026 (voir plus bas) ; département et guides hôte : plus tard |
| 8 | Suivi Search Console 4 à 6 semaines. | À faire |

## Relevé de référence (audit du 09/11/2026)

- 651 pages, 12 en noindex sans fil. Fil balisé partout sauf 10 pages : accueil, 3 annuaires et leurs pages d'inscription, `/trouver-un-pro`, `/sos-hote`, `/securite/signalements`.
- Fil visible absent des 186 pages pros de ville (photographe, ménage, dépannage) et du blog (232 articles, lien « retour au blog » seulement).
- Guides hôte : 40 en « Accueil › Ville », 22 en « Accueil › Guides par ville › Ville ».
- 27 pages où le fil visible et le fil balisé diffèrent (comparatifs : « Comparatifs » visible mais pas balisé ; pages Pour qui : séparateurs « › » lus comme des éléments).

## Registre : faits utiles

- 80 villes : 65 en France (62 du réseau à 4 pages, Cassis, Courchevel et Val-d'Isère avec seulement une étude de revenus), 15 hors de France (Québec avec sa page photographe, 14 villes d'études de revenus en Portugal, Espagne, Italie, Belgique, Pays-Bas, Allemagne, Autriche). 13 régions, 43 départements.
- L'IGN écrit les noms sans article (« Rochelle », « Mans », « Baule-Escoublac », « Touquet-Paris-Plage ») : le contrôle compare le nom du registre sans article au début du nom IGN.
- Données IGN : métropole et Corse seulement (96 départements, 13 régions). L'outre-mer demandera une saisie à la main.

## Étape 3 : ce qui lit le registre (09/11/2026)

- **App** : `CITY_PAGE_SLUGS`, `cityLabel` et `INTL_CITY_PAGES` (`lib/visibility/city-page.ts`) sont calculés depuis `lib/geo/registre.ts`. Plus rien à ajouter à la main dans l'app pour une nouvelle ville : `build-registre-geo.mjs` réécrit la copie.
- **Fiches** : `VILLE_LABELS` de `scripts/lib/inject-ville-pros.mjs` = noms du registre.
- **`VILLES_INTERNATIONAL`** (`scripts/data/villes-international.mjs`) : calculé depuis les villes hors de France du registre qui ont des pages (même forme qu'avant).
- **Villes voisines** (`inject-villes-voisines.mjs`, fonction `voisines(slug, kind)`) : régions officielles, villes triées par distance (centres IGN), complétées par les plus proches quand la région en a moins de 3 (titre « <région> et villes proches », ou « Villes proches » pour Tours, seule ville du Centre-Val de Loire). Suggestions (`suggestions.js`, `suggest-regions.ts`) : régions officielles, pays pour les villes hors de France. 248 pages réécrites, contrôle : aucun changement hors des marqueurs VOISINES.
- **Contrôles** : `verifier-villes.mjs` exige la ville dans le registre avec ses 4 pages (à la place de `CITY_PAGE_SLUGS`) ; `build-registre-geo.mjs` vérifie aussi que chaque clé de `COMMUNES` (taxe de séjour, libellés DELTA propres à la DGFiP, gardés à part) est une ville française du registre. `creer-ville.mjs` n'écrit plus dans l'app ni dans `VILLE_LABELS`.
- **Restent à part** : `CITIES` de `footer.js` (textes : tarif, occupation, description ; remplacé à l'étape 4 quand le pied de page sera écrit au build), `VILLE_COORDS` de `scripts/lib/fiche-signature.mjs` (positions de la carte des fiches), `CITY_ALIASES` / `VILLE_ALIASES` (autres noms d'une ville), `COMMUNES` (taxe).
- **Créer une ville** maintenant : ligne dans `scripts/data/registre-geo.mjs` (code INSEE vérifié), entrée dans `CITIES`, bloc `villes-local.mjs`, `COMMUNES` si la taxe est relevée, puis `node scripts/creer-ville.mjs <slug>`.

## Étape 4 : le pied de page (09/11/2026)

- **Source unique** : `scripts/lib/footer-html.mjs` (`footerHtml({ path, statique })`, `PANELS` : onglet, titre, phrase, lien « Tout voir » ; `PANEL_RULES` / `panelForPath` : onglet ouvert selon la page ; colonnes et comparatifs). Villes et études de revenus lues dans le registre : villes rangées par région (`.ft-group`), études par pays, France d'abord sur toute la largeur (`.ft-group-wide` au-delà de 12 villes), ville de la page en jaune (`a.on`, `aria-current`).
- **Écrit dans les pages au déploiement** : `node scripts/build-footer.mjs --inject` (dans `build-site.sh`, avant `minify-assets`) ajoute avant `</body>` de chaque page qui charge footer.js `<style id="footer-styles">` (CSS lu dans footer.js) + `<footer class="ft-static">`, marqueurs `FOOTER:START/END`. Hors Vercel, ne touche pas les pages sans `--force` (les pages du dépôt restent sans pied de page écrit : pas de 650 fichiers modifiés à chaque changement).
- **footer.js** : garde `CITIES` (cartes de /villes, compteurs), le CSS et les onglets (`selectPanel`, titre dans `data-title`). Le HTML de secours est entre les marqueurs `FOOTER_HTML` et `FOOTER_PANELS`, réécrits par `node scripts/build-footer.mjs` ; inséré seulement si la page n'a pas `footer.ft-static`. Contrôle `--check` dans le job « villes » ; `creer-ville.mjs` le relance.
- Testé le 09/11/2026 : 651 pages reçoivent le pied de page, 361 liens, un seul `<footer>` par page, onglets et titres corrects avec la version écrite et avec le secours, 1920 / 1280 / 390 px sans défilement horizontal.
- Modifier un texte du pied de page : `scripts/lib/footer-html.mjs`, puis `node scripts/build-footer.mjs`. Le CSS reste dans footer.js.

## Pied de page « Par ville / Par région » et pages mères (09/11/2026)

Jason (captures) : « pas très beau et surtout pas scalable quand j'aurai des centaines de villes » ; il aimait le modèle d'un site de formations (lignes Par ville / Par département / Par région). Validé sur maquette le 09/11/2026.
- **Pied de page** (`lignes()` de `scripts/lib/footer-html.mjs`) : une sélection, pas toute la liste. Onglets de ville : « Par ville » = les `PAR_LIGNE` (18) plus grands marchés (nombre d'annonces de `CITIES`), « Par région » seulement pour les régions qui ont une vraie page (`cheminRegion(kind, région)` : `/annuaires/<métier>/<région>` ou `/villes/<région>`, pages de l'étape 7 ; tant qu'elles n'existent pas, la ligne n'apparaît pas), « Hors de France » (Québec). Études de revenus : « En France » (18) et « En Europe ». Outils : « Comparatifs » et « Partenaires ». Lien du bas : « Les N villes et l'annuaire… » vers la page mère. 177 liens au lieu de 361 ; la taille ne grandit plus avec le nombre de villes. Ligne « Par département » : à ajouter le jour où des pages département existent, sur le même modèle.
- **Pages mères = listes complètes, écrites dans le HTML** (`scripts/lib/villes-hub.mjs`, `groupesVilles`, `villesParRegionHtml`) : annuaires (`villesGuidesHtml` de `scripts/lib/annuaire-hote.mjs`, régénérés à chaque déploiement : villes rangées par région, pros en tête, Québec pour les photographes, ancre `#villes`), `/villes` (62 cartes écrites par `build-footer.mjs` dans `#cities-grid`, avant remplies par footer.js donc absentes du HTML ; footer.js ne remplit plus la grille que si elle est vide), `/calculateurs` (« Toutes les études de revenus » par pays, marqueurs `ETUDES`, avant 23 études sur 40 liées). `node scripts/build-footer.mjs` réécrit footer.js et ces deux pages ; `--check` contrôle les trois.

## Étape 5 : fil d'Ariane (09/11/2026)

- **Une fonction** : `cheminVille(kind, slug)` de `scripts/lib/fil-ariane.mjs` (Accueil › page mère `MERES[kind]` › région si `cheminRegion` trouve sa page › ville). `jsonLd(chemin)` et `visible(chemin, style)` en sont tirés : le fil visible et le JSON-LD ne peuvent plus diverger. Noms courts (« Lyon », la page dit le reste). Aucune adresse changée.
- **Injection** : `node scripts/inject-fil-ariane.mjs` (idempotent, `--check` dans le job « villes », lancé par `creer-ville.mjs`) sur les 289 pages de ville du registre : pros `<nav class="brd">` (avant `<div class="brd">`), guides hôte `<nav class="breadcrumb">` (40 guides passaient de l'accueil à la ville sans « Guides hôte par ville »), études de revenus `<nav class="breadcrumb lt">` (« Lyon » au lieu de « Revenu LCD Lyon »). Remplace aussi le bloc JSON-LD BreadcrumbList (attributs gardés).
- **Annuaires** (régénérés au déploiement par build-photographers / cleaners / depannage) : JSON-LD `jsonLdMere(kind)` ajouté (absent avant) et fil visible aligné « Accueil › <nom de MERES> » (avant : trois libellés différents, un lien vers la page elle-même ou vers devenir-photographe-lcd).
- **Audit** : reconnaît maintenant `.brd` ; référence réécrite le 09/11/2026 après l'étape. Reste sans fil balisé : accueil, inscriptions des annuaires (commitées hors builders), `/trouver-un-pro`, `/sos-hote`, `/securite/signalements`. Blog : fil balisé partout, visible seulement sur les pages de catégorie.
- Quand les pages région existeront (étape 7), relancer `inject-fil-ariane.mjs` : le niveau région s'ajoute seul dans le fil.

## Étape 6 : statistiques par département et région (09/11/2026)

- **6a, localiser une ville saisie** : `jason-app/lib/geo/localiser.ts` (`localiser(texte)` → département, région, ville du site s'il y en a une, et comment : ville du site, code postal, commune, département, région ; `depOfCodePostal` avec 2A / 2B et l'outre-mer). Index des communes `lib/geo/communes.json` (445 Ko, noms IGN normalisés sans article, généré par `build-registre-geo.mjs`, contrôlé par `--check`). **Côté serveur seulement** : ne jamais l'importer depuis un composant client (les types partagés vont dans des fichiers sans import de `localiser`). Une commune présente dans plusieurs départements (Mérignac, Saint-Denis) ne donne rien sans code postal. Testé : `localiser.test.ts`.
- **6b, admin Visibilité › Villes** : sélecteur Villes / Départements / Régions (`NiveauSwitch`, `ZoneList` de `VillesTab.tsx`). `groupZones(cities, pros, niveau)` (`lib/visibility/admin-zones.ts`, serveur, testé) additionne clics, affichages et visiteurs des villes du site, et range les pros par leur ville saisie, même sans page (« dont N hors des villes à page ») ; une zone avec des pros et aucune page porte « Sans page » (candidates pour une prochaine ville). Type `ZoneItem` dans `admin-rules.ts`.
- **6c, /chiffres** : la recherche « Ta ville » accepte une commune sans page, un code postal, un département ou une région. L'API (`?ville=`) renvoie `zone` quand la saisie n'est pas une ville du site : `zoneDeRecherche` (`lib/public-stats/zone.ts`, serveur, testé) liste les villes du site du département (ou de la région s'il n'en a aucune) avec leurs pros en ligne. Page : `renderZone` dans `chiffres/index.html` (boutons qui ouvrent la carte de chaque ville) ; pour une commune ou un code postal, le formulaire « Demander la page de ma ville » reste en dessous. Texte d'aide et exemple du champ mis à jour (« Ex. Lyon, Gironde, Bretagne… »).
- **6d, Mes statistiques des pros** : un pro dont la ville n'a pas de page (`citySlugOf` ne trouve rien) reçoit `zone` (`ProZone`, `pro-load.ts`) : les pages de son métier dans son département, ou sa région s'il n'y en a pas (12 au plus), via `localiser(ville)` puis `localiser(zone_couverte)`. Carte `ZoneCard` (`ProStatsView.tsx`) : « <ville> n'a pas encore sa page », liens vers ces pages, lien « Demander la page de ma ville » vers `/chiffres?ville=<ville>#ta-ville`. Aucune promesse sur la présence de la fiche sur ces pages (non vérifié).

## Étape 7 : pages région des annuaires (09/11/2026)

Maquettes : la 1re (cartes de ville à côté de la carte) refusée par Jason (« les cartes à côté c'est moche ») ; la 2e validée : « reprends les cards actuels des annuaires et le système de recherche ».
- **39 pages** `/annuaires/{photographes,menage,depannage}/<région>` (13 régions × 3 métiers ; slug `slugRegion` : `ile-de-france`, `provence-alpes-cote-d-azur`…). Une page région = `buildAnnuaireListPage(pros de la région)` du métier (même recherche, mêmes filtres, mêmes cartes avec photos, même FAQ) transformée par `writeRegionPages` (`scripts/lib/annuaire-region.mjs`) : titre, description, canonique, fil (Accueil › annuaire › région, visible et JSON-LD), h1, chapeau, exemples de la recherche, section « Les villes de <région> » (liste : ville, département, annonces, pros ; carte SVG IGN de la région, pastilles = pros présentés) posée au marqueur `<!-- REGION-SLOT -->` des 3 gabarits (juste après les fiches), sans la section « Guide … de ta ville » ni le FAQ JSON-LD (contenu répété).
- **Pros d'une région** : `regionDePro(p)` = région de la ville principale de la fiche (`resolveSecteur`), pas encore ceux qui « se déplacent dans toute la France » (question posée à Jason, pas tranchée).
- **noindex** tant que la région n'a aucun pro en ligne dans le métier (règles Google « doorway » / « scaled content ») ; visible pour Google et ajoutée au sitemap du métier (`sitemapAvec`) dès le premier pro. Au 09/11/2026 (6 pros en ligne) : photographes Île-de-France, Auvergne-Rhône-Alpes, Pays de la Loire ; ménage Île-de-France, Pays de la Loire.
- **Écrites à chaque déploiement** par build-photographers / build-cleaners / build-depannage (après le nettoyage des dossiers de fiches, avant l'annuaire dont les intertitres de région deviennent des liens). Une fiche dont le slug serait celui d'une région bloque la page région (`skipSlugs`, avertissement). Les versions commitées sont générées sans données (toutes en noindex) : elles servent au pied de page et au fil d'Ariane, régénérés depuis elles (`build-footer.mjs`, `inject-fil-ariane.mjs`).
- **Effets** : ligne « Par région » dans les onglets Photographes, Ménage, Dépannage du pied de page (`cheminRegion` trouve les pages) ; fil d'Ariane des 186 pages pros de ville : Accueil › annuaire › région › ville.
- Restent : pages région des guides hôte (`/villes/<région>`, pas de fiches : contenu régional à écrire d'abord), pages département au seuil.
