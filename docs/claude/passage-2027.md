# Passage à 2027 du site statique

Partie de la documentation interne (index : CLAUDE.md à la racine). Préparé le 19/11/2026 (audit SEO, Jason : « go, commence par le passage à 2027 »).

## Pourquoi

Au 19/11/2026, 206 pages indexables citent 2026 dans leur titre, leur description ou leur H1. Dès janvier, un titre « … 2026 » paraît dépassé et se clique moins. Mais il ne faut pas remplacer l'année partout : un titre « 2027 » sur des montants de 2026 serait faux, et changer l'année d'une page sans la mettre à jour ressemble à du faux contenu frais pour Google. **Règle : on ne change l'année d'une page que quand son contenu est à jour pour 2027.** Les adresses (URL) qui contiennent 2026 ne changent jamais (elles perdraient leur place dans Google).

Liste à jour à tout moment : `node scripts/rapport-annee.mjs` (lecture seule, pages rangées par famille).

## Les familles (relevé du 19/11/2026)

| Famille | Pages | Ce qu'il faut faire |
|---|---|---|
| Guides hôte de ville (`devenir-hote-airbnb-*`) | 63 | Taxe : passer `ANNEE_TARIFS` à 2027 après un relevé DGFiP qui contient 2027, relancer `inject-taxe-villes.mjs` (titres `TAX_INTENT`, descriptions, grilles, FAQ, simulateur) puis `inject-faq-villes.mjs` et `inject-hotel-villes.mjs`. Les autres titres « guide et règles 2026 » (écrits à la main dans les 60 anciens guides, par `build-guide-hote.mjs` pour les récents) : passer à 2027 en même temps, la taxe étant la partie datée du guide. Fiscalité des guides récents : `fiscal-params.mjs`. |
| Études de revenus par ville (`/services/simulateurs/revenus-lcd/*`) | 40 | Titres « revenus 2026 » : générés par `generate-city-revenue-articles.mjs` ; relancer avec l'année 2027 quand les repères de marché sont revus (sinon garder 2026). |
| Montants, prix ou règles à revérifier (articles, comparatifs, avis, `lodgify-prix`) | 52 | Un par un : fiscalité (micro-BIC, TVA, LMNP, impôt) après la loi de finances 2027 ; prix des outils sur le site de chaque éditeur ; puis titre, description et `dateModified`. Commencer par les pages qui ont des affichages dans la Search Console. |
| L'année comme simple repère (comparatifs sans montant, guides pratiques) | 34 | Relecture rapide, mise à jour de ce qui a changé, puis titre en 2027 et `dateModified`. |
| Simulateurs, formations et services | 9 | Simulateurs : `fiscal-params.mjs` (miroir `jason-app/lib/lcd/fiscal-params.ts` et `taxe-sejour.ts`, à changer ensemble), relancer `generate-simulateurs-seo-pages.mjs`. Formations : selon leur contenu. |
| Liés à un moment précis (Toussaint 2026, marchés de Noël 2026, Black Friday 2026, vacances scolaires 2026-2027, bilan de saison 2026, fin d'été 2026, 20 mai 2026) | 7 | Ne pas renommer : écrire une édition 2027 quand le moment approche (nouvel article), avec un lien depuis l'ancienne. |
| Pages pros de ville | 1 | Selon le cas. |

**Dates d'événements dans `scripts/data/villes-local.mjs` (`pics`)** à remplacer par les dates 2027 vérifiées, une fois l'événement 2026 passé : Paris (Salon de l'Agriculture, Fashion Week, Roland-Garros), Lyon (Fête des Lumières), Bordeaux (Week-end des Grands Crus), Avignon (Festival), Le Mans (24 Heures), Amiens (marché de Noël). Route du Rhum corrigée le 19/11/2026 (Saint-Malo, Dinard : « tous les 4 ans, prochaine édition attendue en 2030 », aucune date 2030 publiée). Au passage, erreurs anciennes corrigées dans des guides écrits à la main : La Rochelle présentait la Route du Rhum comme son événement (elle part de Saint-Malo ; remplacé par le Grand Pavois, fin septembre, et les Francofolies), Brest aussi (remplacé par les Fêtes maritimes, désormais tous les 3 ans, prochaine annoncée en juillet 2027), Rennes (« années paires, 2,5 millions de spectateurs » retiré). Reste repéré : le guide de Bordeaux annonce « Bordeaux Fête le Vin (années paires) … +60 % sur les tarifs », en contradiction avec `villes-local.mjs` (pause en 2026, retour du 7 au 11 juillet 2027). Puis `node scripts/inject-local-villes.mjs` et `node scripts/inject-faq-villes.mjs` (la question de saison reprend `pics`). Les règles « 90 nuits depuis le 1er janvier 2026 » (Lyon, Bordeaux, Nice, Marseille, Montpellier) restent vraies : ne pas y toucher.

## Taxe de séjour : le réglage `ANNEE_TARIFS`

- `scripts/lib/annee.mjs` : `ANNEE_TARIFS` (2026 au 19/11/2026). `officialGrid` (`scripts/lib/taxe-officielle.mjs`) ne prend que les délibérations en vigueur cette année-là ; `inject-taxe-villes.mjs` et `inject-faq-villes.mjs` écrivent cette année dans les textes et les titres. Avec 2026, aucune page ne change (vérifié le 19/11/2026).
- Les tarifs 2027 sont votés par les communes avant le 1er juillet 2026 (entrée en vigueur au 1er janvier 2027). Le relevé de la base DGFiP se fait par le workflow « Taxe de séjour officielle » (modifier `.github/taxe-trigger` sur une branche `claude/**` ; l'environnement de Claude ne joint pas data.economie.gouv.fr). Il garde toutes les années, la plus récente en vigueur gagne.
- Barème national (plafonds) 2027 : identique à 2026 d'après https://www.taxesejour.fr/bareme-des-tarifs-de-taxe-de-sejour-applicables-pour-2027/ (consulté le 19/11/2026) ; à confirmer par le barème officiel de la DGCL (collectivites-locales.gouv.fr) avant la bascule. Les plafonds sont écrits dans `inject-taxe-villes.mjs` (`PLAFONDS`) et dans `fiscal-params.mjs` (`TAXE_SEJOUR_2026`).
- **Bascule** (première quinzaine de janvier 2027) : relancer le relevé ; vérifier que la base contient des délibérations 2027 ; passer `ANNEE_TARIFS` à 2027 ; relancer `inject-taxe-villes.mjs`, `inject-faq-villes.mjs`, `inject-hotel-villes.mjs` ; relire 3 villes (une qui a changé de tarif, une qui n'a pas changé, une sur une ancienne délibération comme Marseille) ; `node scripts/sitemap-lastmod.mjs` ; push.

## Calendrier proposé

1. **Novembre 2026 (fait)** : liste, réglage `ANNEE_TARIFS`, rapport, relevé DGFiP avec Amiens. Relevé du 19/11/2026 : la base DGFiP n'a pas changé depuis le 29/06/2026, **aucune délibération 2027** (années présentes : 2019 à 2026). Relancer le relevé en décembre puis début janvier. Si la base n'a toujours pas de 2027 à la mi-janvier, ne pas écrire « 2027 » sur ces montants : garder l'année des délibérations connues et le dire.
   Au passage, `officialGrid` choisissait au hasard entre deux lignes de la même année (avec et sans taxes additionnelles) : corrigé (la plus complète l'emporte), totaux rectifiés à Nice, Saint-Tropez, Caen, Angers, Reims, Honfleur ; Amiens a maintenant sa grille officielle.
2. **Fin décembre** : loi de finances 2027 publiée ; barème DGCL 2027 confirmé.
3. **Première quinzaine de janvier** : bascule de la taxe (guides, FAQ, simulateur) ; `fiscal-params.mjs` 2027 (site et app) ; titres des guides hôte.
4. **Janvier et février** : les 52 pages à montants, les plus vues d'abord ; dates d'événements 2027 dans `villes-local.mjs` ; les 34 pages « repère ».
