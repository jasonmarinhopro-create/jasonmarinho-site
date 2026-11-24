# Responsive : règles, outil d'audit et état des lieux

Partie de la documentation interne (index : CLAUDE.md à la racine). **Ouvert le 20/11/2026** (Jason : « textes coupés, blocs qui se superposent, appels inutiles, il faut être irréprochable ; détaille tout dans un fichier pour la suite quand on sortira de nouvelles choses »).

**Avant de pousser une nouvelle page ou un nouveau composant : lancer l'audit (plus bas) et viser zéro défaut.**

---

## 1. Règles à appliquer partout

### Grilles et colonnes
- **Jamais `1fr` seul pour une colonne qui peut recevoir un contenu large** : écrire `minmax(0,1fr)`. Une piste `1fr` vaut `minmax(auto,1fr)` : elle refuse de rétrécir sous la largeur de son contenu le plus large (mot long, tableau, maquette), d'où la page qui défile de côté. Cause de presque tous les défauts trouvés le 20/11 (`.two-col`, `.hero-in`, `.row`, `.stats-strip`).
  - Une colonne : `grid-template-columns:minmax(0,1fr)` (et non `1fr`, ni rien du tout : la piste implicite est `auto`, même problème).
  - Plusieurs : `repeat(3,minmax(0,1fr))`.
  - Cartes qui se replient d'elles-mêmes : `repeat(auto-fit,minmax(150px,1fr))` (article Driing du 20/11).
- Grille de 4 colonnes ou plus (tableau de bord, alertes, kanban) : prévoir 2 colonnes sous 560 px. Attention à l'ordre : une règle `@media` placée **avant** la règle de base est écrasée (cas du calendrier).
- Flex : un enfant qui contient du texte long porte `min-width:0` ; un titre en `display:flex` avec plusieurs morceaux (icône, texte, `<em>`) porte `flex-wrap:wrap` (lexique).
- `minWidth` en dur : `min(300px, 100%)`, jamais `300px` seul (page d'aide du dashboard, coupée à 320 px).
- Largeur fixe d'un élément (barre de squelette, carte) : toujours `maxWidth: '100%'` à côté.

### Textes
- Gros chiffres ou mots longs en Fraunces dans une carte étroite : taille en `clamp(…, Nvw, …)` et `overflow-wrap:break-word` (cartes de `/investir-lcd` : « Sans engagement » sortait de la carte à 320 px).
- Texte raccourci volontairement : `text-overflow:ellipsis` (l'audit le liste à part, ce n'est pas un défaut).
- Pastilles (« Gratuit », « Annuaire ») à droite d'une carte : sous 420 px, les passer à côté du titre pour rendre la largeur au texte (inscription, 20/11 : le texte tenait sur 100 px).

### Tableaux
- Sur le site : sous 560 px, `display:block;overflow-x:auto` sur le tableau (il défile dans son cadre), padding réduit.
- Dashboard : tableau large dans un conteneur `overflowX: 'auto'` (déjà le cas de Simulateurs, Encaissements, Guide).

### Éléments posés les uns sur les autres
- Une carte qui remonte sur le bandeau (marge négative, `.facts` des Estimateurs de revenus) cache ce qui est en bas du bandeau. Les crédits photo (licence CC, obligatoires) doivent rester lisibles : `scripts/inject-photos-villes.mjs` remonte le crédit et agrandit le bas du bandeau quand une `.facts` suit (`.hero:has(+.facts)`).

### Dashboard
- `.dash-main` masque ce qui dépasse en largeur (`overflow-x:hidden`) : un débordement ne fait pas défiler la page, **il coupe le texte**. L'audit le détecte (« texte coupé »).
- Styles en ligne : pas de `@media`. Pour un changement de mise en page sur téléphone : une classe + règle dans `globals.css` ou un bloc `<style>` du composant (règle du projet : pas d'apostrophe ni de `>` dans un `<style>` en ligne, sinon `InlineStyle`).
- Largeurs vérifiées : 1920, 1280, 768, 390, 320 px.

---

## 2. Outil d'audit

`scripts/audit-responsive.mjs` + `scripts/lib/audit-responsive-detect.mjs` (détection, une fonction envoyée dans la page).

Ce qu'il signale, à chaque largeur :
| Type | Sens |
|---|---|
| défile de côté | la page est plus large que l'écran |
| hors écran | un élément sort de l'écran (hors zones qui défilent et éléments fixés) |
| texte coupé | du texte dépasse d'un conteneur qui masque (`overflow:hidden`), sans « … » |
| texte masqué | texte coupé dans sa propre boîte en largeur ou en hauteur |
| chevauchement | deux textes visibles l'un sur l'autre (partie réellement visible, faces cachées des cartes 3D, FAQ repliées et info-bulles exclues) |

Les « … » voulus (`ellipsis`, `line-clamp`) ne sont pas des défauts.

### Site vitrine
```
python3 -m http.server 8088          # à la racine du dépôt (pages modifiées en local)
node scripts/audit-responsive.mjs --site --base http://localhost:8088 --only services/calendrier,blog
node scripts/audit-responsive.mjs --site    # tout le sitemap, en ligne (≈ 5 min, 648 pages × 6 largeurs)
```
Largeurs par défaut : 320, 375, 768, 1024, 1280, 1920. `--out fichier.json` garde le détail.

### Dashboard (pages connectées)
L'environnement de Claude ne joint pas Supabase : l'audit du dashboard tourne dans GitHub Actions, **workflow « Audit responsive »** (`.github/workflows/audit-responsive.yml`, lancement à la main, mode `app`, filtre facultatif `only`).
- Session ouverte sur le compte administrateur sans e-mail (lien magique généré par l'API d'administration puis vérifié), fermée à la fin.
- **Lecture seule** : toute requête autre que GET est bloquée dans le navigateur (aucun bouton, aucune action serveur, aucun « vu »). Aucune page ni layout du dashboard n'écrit en base à l'affichage (vérifié le 20/11 ; à revérifier si une page se met à écrire au rendu).
- Rapport public (dépôt public) **sans donnée de compte** : sélecteurs, adresses avec identifiants remplacés par `[id]`, largeurs, temps d'affichage (1er octet, page affichée). Un texte n'est cité que s'il figure déjà dans le code de l'app (libellé d'interface) ; sinon un indice de style (`span{inline fs:13.5px … ws:nowrap w:107} < …`) pour retrouver le composant.
- `--only` / champ « only » du workflow : morceaux d'adresse séparés par des virgules, ou `=/dashboard` pour une adresse exacte.
- Pages : toutes les `page.tsx` de `app/dashboard` sans paramètre, puis une page de détail par modèle d'adresse trouvée dans les listes. Chaque page est chargée une fois (1920 px) puis la fenêtre est rétrécie (1280, 768, 390, 320).
- Accord de Jason requis avant le premier lancement (session sur son compte).
- Écrans sans page à part (24/11/2026) : `EXTRA_APP_SCREENS` dans le script (onglets Parcours / Catalogue / Moi de Formations, étapes d'une leçon, écran de fin), ajoutés quand `only` les vise ; le rapport garde alors les paramètres `onglet`, `lecon`, `etape`, `fin`, `view` dans l'adresse.
- `repeat` (champ du workflow, `--repeat N`) : chaque page ouverte N fois à la suite (un seul navigateur), tableau « 1re ouverture / 2e ouverture » pour séparer un chargement à froid d'une vraie lenteur. Les défauts ne sont relevés qu'à la 1re ouverture.
- `net` : pages que chaque page fait précharger au serveur. `nav` : parcours (Accueil puis 6 clics du menu, deux passages) avec, toutes les 100 ms, l'état à l'écran (lancement, squelette reconnu à son animation, zone vide, ancienne page, contenu) et le nombre de vrais chargements du document. Aucun texte ni capture. Relevé du 24/11/2026 : squelette à chaque clic, contenu en 0,5 à 2,7 s au 1er passage, immédiat au 2e, un seul chargement du document. Une page blanche ou un rechargement vu par un membre juste après un déploiement vient du changement de version (Vercel Hobby n'a pas la protection contre l'écart de versions) : regrouper les envois sur main.

---

## 3. État des lieux du 20/11/2026

### Site vitrine : audit complet (648 pages × 6 largeurs = 3 888 contrôles, 0 erreur)
Défauts trouvés et corrigés :
| Page(s) | Défaut | Correction |
|---|---|---|
| `/services/calendrier` (375 et 320) | tableau d'alertes en 4 colonnes : 4e coupée, page qui défile de 45 px | 2 colonnes sous 560 px, grilles `minmax(0,1fr)` |
| 21 Estimateurs de revenus par ville (toutes largeurs) | crédit photo (licence CC) caché sous la carte de chiffres | crédit remonté, bandeau agrandi (`inject-photos-villes.mjs`) |
| `/services/planning-menage`, `/services/declarations-voyageurs` (320) | maquette plus large que l'écran | `.two-col` en `minmax(0,1fr)` sur les 29 pages qui l'utilisent |
| `/pour-qui/menage`, `/pour-qui/photographes`, `/pour-qui/depannage` (320) | colonne de texte trop large | `.row` en `minmax(0,1fr)` (+ `build-pour-qui-pros.mjs`) |
| `/comparatif-smoobu-hospitable` et pages partenaires (320) | bandeau plus large que l'écran | `.hero-in` en `minmax(0,1fr)` (+ `build-pages-partenaires.mjs`) |
| `/investir-lcd` (320) | « Sans engagement » sort de sa carte | taille en `clamp`, padding réduit |
| `/lexique-lcd` (320) | titre de catégorie qui ne passe pas à la ligne | `flex-wrap:wrap` |
| `/sos-hote/annulation-last-minute` (375, 320), `/blog/micro-bic-abattement-2026-airbnb` (320) | tableau plus large que l'écran | tableau qui défile dans son cadre sous 560 px |
| `/blog/driing-plateforme-vacances-sans-commissions` (320) | 3 cartes en ligne | `repeat(auto-fit,minmax(150px,1fr))` |

Après correction : 0 défaut sur les 96 pages touchées × 6 largeurs. Menu du haut vérifié de 320 à 1920 px (pas de chevauchement ni de débordement, menu téléphone ouvert compris).

Faux positifs connus (ignorés par l'outil ou sans effet visible) : piège à robots `form#hpf` de `/trouver-un-pro` (volontairement hors écran) ; grand chiffre « ×12,7 » de `/chiffres` (hauteur de ligne de la police, rien de visible).

### Dashboard
- Pages publiques (connexion, inscription avec chaque profil, mot de passe oublié, nouveau mot de passe, installation, réveil, assistant de contrat, confirmation) : 0 défaut à 320, 375, 390, 768, 1024, 1280, 1920 px. Inscription améliorée sous 420 px (pastilles à côté du titre).
- Pages connectées, revue du code : page d'article d'aide (`minWidth: 300px` coupait le texte à 320 px), squelette de chargement (barre de 380 px), grilles `repeat(3, 1fr)` passées en `minmax(0, 1fr)` (fiche membre de la communauté, Membres admin, suivi d'activité des pros).
- **Audit en rendu réel (workflow, accord de Jason le 20/11)** : 117 pages × 5 largeurs (1920, 1280, 768, 390, 320). Défauts trouvés et corrigés :

| Page(s) | Défaut | Correction |
|---|---|---|
| Mes finances (revenus, performances, logement) | noms de mois des graphiques sur 12 mois coupés net (colonnes de ~20 px) | `MonthTick` : initiale sous 600 px (`.mt-l` / `.mt-s`) |
| Statistiques des pros (photo, ménage) | « 30 derniers jours » chevauche « 3 mois » à 320 px | libellé court (`.txt-long` / `.txt-court`, 420 px) |
| QG admin | dates de la liste des demandes à 200 px hors écran | grilles `.dh-grid`, `.dh-cols`, `.qg-shell` en `minmax(0,1fr)` |
| Forum Entre hôtes | « Marquer utile » hors écran à 390 et 320 px | boutons du bas qui passent à la ligne, libellé masqué sous 420 px (icône + `aria-label`) |
| Accueil, Déclarations voyageurs | bouton « Fait » hors écran à 320 px | rangée d'actions rétrécissable (plus de `flexShrink: 0`), `minWidth: min(200px,100%)` |
| Accueil | carte « Ce mois-ci » qui dépasse à 320 px | `repeat(auto-fit, minmax(120px, 1fr))`, `overflowWrap: anywhere` |
| Mes finances > Performances | tableau « Par canal » 3 px trop large à 320 px | cadre `overflowX: auto` comme le tableau des logements |
| Fiche voyageur | « + Ajouter » poussé dehors par le champ | `minWidth: 0` sur le champ (un `<input>` en flex garde sinon sa largeur par défaut) |
| Audit Google Business (import URL) | URL d'exemple d'un seul tenant | `minWidth: 0` + `overflowWrap: anywhere` |
| Admin Communauté | adresses de groupes Facebook hors carte, pastilles sous les boutons à 320 px | lien en « … », bloc d'infos `flex: 1 1 200px` |
| Admin Formations | « inscrits » coupé à 320 px | ligne de chiffres en `flexWrap: wrap` |
| Aperçu des posts Facebook (Visibilité) | lien long hors de l'aperçu à 320 px | `overflowWrap: anywhere` |

Faux positifs appris : aperçu volontairement coupé avec un fondu (`mask-image`) = voulu, comme « … » ; texte dont un **parent** raccourcit avec « … » (ligne d'action du tableau du jour de l'Accueil) = voulu.

**Vérification après corrections** (3e passage, 20/11) : 117 pages, 0 erreur, défauts 47 → 3, puis 0 après le tableau « Par canal » et ce faux positif.

**Temps d'affichage** (mesure du workflow, compte admin, base gratuite) : premier octet 0,2 à 0,6 s partout (le cadre part tout de suite) ; affichage complet de 2 à plus de 20 s selon les pages, surtout l'admin (Indexation, QG, Social, Dépannage, Ventes) : ce sont les lectures de la base gratuite, voir `technique.md`. Le 1er audit comptait aussi l'attente « réseau calme » (jusqu'à 15 s pour les pages qui interrogent le serveur en continu) : corrigé, le temps s'arrête à la fin des squelettes.

**Pièges du `<input>` et des rangées de boutons** : un `<input>` en `flex: 1` sans `minWidth: 0` garde ~150 px ; une rangée `flexShrink: 0` + `flexWrap: wrap` ne passe jamais à la ligne (elle prend la largeur de tous ses boutons). Toujours `minWidth: 0` et laisser rétrécir.

### Appels réseau
- Site : 18 à 29 requêtes par page (polices, `nav.js`, `footer.js`, images). Un seul appel à l'app par page : `/api/public/chiffres` (cache Vercel 1 h, la base n'est lue qu'au recalcul) ; un comptage de visite (`/api/track/visit`, sert à Provenance). Rien d'inutile trouvé.
- Dashboard (20/11, voir `technique.md`) : vérification de session sans appel réseau (clé au build), Mes finances plus précalculé par les liens visibles, cloche préchargée seulement s'il y a du non lu, copie de la page d'arrivée à l'ouverture.

---

## 4. Pour une nouveauté (liste à suivre)
1. Grilles en `minmax(0,1fr)`, `min-width:0` sur les enfants flex qui contiennent du texte, pas de largeur fixe sans `maxWidth`.
2. Lancer l'audit (site : en local ; dashboard : workflow, filtre `only` sur la nouvelle section).
3. Corriger jusqu'à zéro défaut, ajouter ici les cas nouveaux (règle + exemple) et les faux positifs.
4. Page générée par un script : corriger le générateur, pas seulement le HTML (sinon le prochain build écrase).
