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
| 4 | Pied de page : titre et phrase par onglet, liens dans le HTML au build, villes par région, les 39 études de revenus (le pied de page n'en montre que 22). | À faire |
| 5 | Fil d'Ariane : une fonction pour le fil visible et le JSON-LD ; niveau affiché seulement s'il a une page. | À faire |
| 6 | Statistiques par département et région (/chiffres, Mes statistiques, admin Visibilité). | À faire |
| 7 | Pages région puis département au seuil. | À faire |
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
