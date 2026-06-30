# Refactor Dashboard — Plan d'exécution

> Document de référence pour le refactor du dashboard hôte LCD.
> Issu d'un brainstorming Jason × Claude (juin 2026).
> **À lire AVANT toute modification.** Suivre les étapes dans l'ordre.

---

## 🎯 Objectif

Passer le dashboard hôte d'un **centre de pilotage à 20 items** (très dense, fourre-tout) à un **assistant orienté action à 9-10 items** (focus mono-bien actif, langage humain, hiérarchie claire).

## 📦 Sauvegarde

État pré-refactor : branche `backup/pre-dashboard-refactor` (poussée sur origin).
Rollback complet si besoin :
```bash
git fetch origin backup/pre-dashboard-refactor
git reset --hard origin/backup/pre-dashboard-refactor
```

## 👤 Persona cible

**Mono-bien actif** (1 logement, gère lui-même, optimise revenus et voyageurs).
À ne PAS optimiser pour : conciergerie (mais ne pas casser pour autant — architecture multi-logement préservée).

---

## ✅ Décisions validées (brainstorming)

| Sujet | Décision |
|---|---|
| **Sidebar** | 9-10 items au lieu de 20 |
| **Sélecteur logement** | En bas de sidebar (pattern Linear/Vercel), dropdown vers le haut avec "Tous les logements" / Liste / "Gérer mes logements" / "+ Ajouter" |
| **Mes logements** | Retiré de la sidebar, accessible via "Gérer mes logements" du sélecteur |
| **Mes finances** | Fusion à onglets : Revenus + Encaissements + Performances |
| **Outils & calculs** | Hub de cartes : Simulateurs + Calculateurs + Audit GBP + QR & Affiches |
| **Apprendre** | Onglets : Formations + Guide LCD |
| **Entre Hôtes** | Onglets : Forum + Groupes FB + Écosystème |
| **Actualités** | Option A+B : item sidebar dédié (avec point rouge pulsant si nouveau) + widget sur Accueil |
| **Cloche** | Unifiée, 3 onglets : Alertes app / Forum / Nouveautés produit |
| **Header** | 2 boutons seulement : SOS + Cloche |
| **Menu user** | En bas-gauche (carte cliquable), contient : Mon compte / Abonnement / Aide / Contributeurs / Mes espaces pro / Mode admin / Déconnexion |
| **Mode admin** | Bascule via menu user, sidebar dédiée |
| **Calendrier** | ✅ Option A : toggle 📅 Mois / 📋 Liste à l'intérieur de `/dashboard/calendrier`. Aucun nouvel item dans la sidebar. Détail des champs de la vue Liste dans `docs/AUDIT-PAGES-A-FUSIONNER.md`. |
| **Accueil refondu** | Hero dynamique + "⚡ À gérer maintenant" + mini calendrier 7j + suggestions "Pour toi" + Performance repliée + Widget Actualités. Pas de KPIs statiques en évidence. |
| **Light/Dark/AMOLED** | 3 thèmes supportés. Sidebar reste foncée même en light (contraste). |
| **Responsive** | 4 breakpoints : ≥1280 / 768-1279 / 480-767 / <480. Mobile : drawer + barre logement sticky + bottom nav 4 raccourcis. |

---

## 🌳 Arborescence cible (sidebar)

```
┌──────────────────────────────────────────────────┐
│  Jason  Marinho                                   │
├──────────────────────────────────────────────────┤
│  ●  Accueil                                       │
│  ▢  Calendrier                                    │
│  👥  Mes voyageurs                                 │
│  ✉  Messages                       [3]            │
│  €  Mes finances                                  │
│  📰  Actualités                     ●  pulsant    │
│  🛡  Sécurité voyageur                             │
│                                                   │
│  ── Faire grandir mon activité ──                 │
│                                                   │
│  🛠  Outils & calculs                              │
│  🎓  Apprendre                                     │
│  💬  Entre Hôtes                                   │
├──────────────────────────────────────────────────┤
│  🏠  LOGEMENT                              ▴       │
│      Casa Do Peidreiro                            │
├──────────────────────────────────────────────────┤
│  JM  Jason                                        │
│      Administrateur                               │
└──────────────────────────────────────────────────┘
```

---

## 🗺 Plan d'exécution — 7 étapes ordonnées

> Chaque étape = 1 PR-équivalente (1 commit ou groupe de commits liés).
> Faire valider visuellement par Jason avant de passer à la suivante.
> Tests : `npx tsc --noEmit` doit passer après chaque étape.

### ÉTAPE 1 — Sélecteur de logement (foundation)

**Pourquoi en premier :** levier le plus visible, indépendant des autres changements, prouve le concept.

**Fichiers à créer :**
- `jason-app/components/layout/PropertySelector.tsx` (client component)
- `jason-app/lib/queries/active-property.ts` (helper : récupère le logement courant via cookie ou querystring)

**Fichiers à modifier :**
- `jason-app/components/layout/Sidebar.tsx` (intégrer le composant en bas)
- `jason-app/app/dashboard/layout.tsx` (passer la liste des logements + courant)

**Comportement :**
- Affiche le logement courant (icône + label "Logement" + nom)
- Clic = dropdown vers le HAUT avec : `[✓] Logement courant`, `[▦] Tous les logements`, `[ ]` autres logements, séparateur, `[⚙] Gérer mes logements` → `/dashboard/logements`, `[+] Ajouter un logement` → `/dashboard/logements?new=1`
- Persiste le choix dans un cookie `active-property-id` (1 an)
- Quand "Tous" sélectionné : pas de filtre, queries renvoient tout
- Quand 1 logement sélectionné : queries filtrent par `logement_id`

**À NE PAS oublier :**
- Vérifier que les queries existantes acceptent un filtre `logement_id` optionnel
- Si l'hôte n'a qu'1 logement, masquer le selector (pas de choix à faire)

**Validation Jason :** screenshot du dashboard avec selector visible et dropdown ouvert.

---

### ÉTAPE 2 — Sidebar restructurée (visuel sans casser le reste)

**Pourquoi maintenant :** changement visuel énorme, gros gain de clarté immédiat. Les pages internes ne sont pas encore fusionnées, juste réorganisées.

**Fichiers à modifier :**
- `jason-app/components/layout/Sidebar.tsx` (groupes refondus)

**Changements :**
- Bloc QUOTIDIEN (6 items) : Accueil · Calendrier · Mes voyageurs · Messages · Mes finances · Sécurité voyageur
- ATTENTION : Mes finances pointe encore vers `/dashboard/revenus` (page existante) — la fusion sera Étape 4
- Séparateur "Faire grandir mon activité"
- Bloc GRANDIR (3 items) : Outils & calculs · Apprendre · Entre Hôtes
- ATTENTION : Outils pointe encore vers `/dashboard/simulateurs` (existant), Apprendre vers `/dashboard/formations`, Entre Hôtes vers `/dashboard/chez-nous`
- Actualités : item dédié avec point rouge pulsant si nouveau (basé sur `hasNewActualites` déjà calculé dans layout.tsx)
- Retirer "Mes logements", "Encaissements", "Performances", "Calculateurs", "Audit GBP", "Outils impression", "Communauté", "Écosystème", "Contributeurs" de la sidebar (déplacés ailleurs)

**À NE PAS oublier :**
- Les URLs existantes restent fonctionnelles (accessible via taper l'URL directe)
- Contributeurs passe dans le menu user
- Toutes les pages restent accessibles via leur URL — on ne les supprime QUE quand leur destination de remplacement existe

**Validation Jason :** screenshot de la sidebar — il valide visuellement avant qu'on touche aux pages internes.

---

### ÉTAPE 3 — Header allégé + menu user en bas-gauche

**Fichiers à modifier :**
- `jason-app/components/layout/Header.tsx` (retire les 3 boutons : thème, parcours, profil dropdown — garde SOS + cloche)
- `jason-app/components/layout/Sidebar.tsx` (carte user en bas devient cliquable, ouvre un menu vers le haut)

**Comportement carte user :**
- Clic ouvre menu : Mon compte / Abonnement / Contributeurs / Centre d'aide
- Section "Mes espaces" : Hôte (courant ✓) / Photographe (si actif) / Ménage (si actif) / "+ Créer ma fiche photographe" / "+ Créer ma fiche équipe ménage"
- "Mode admin" (si admin) en bouton purple distinct
- Toggle thème (Sun / Moon / MoonStars selon thème courant)
- Toggle parcours d'onboarding (si pas terminé)
- Se déconnecter

**À NE PAS oublier :**
- Préserver TOUTE la logique d'identification utilisateur, plans, badges
- Préserver le mécanisme de switch d'espaces déjà construit

**Validation Jason :** screenshot menu user ouvert.

---

### ÉTAPE 4 — Page "Mes finances" (fusion à onglets)

**Audit AVANT de coder :**
- Lister tous les boutons/exports/filtres présents sur `/revenus`, `/encaissements`, `/performances`
- Liste à valider AVEC Jason avant fusion

**Fichiers à créer :**
- `jason-app/app/dashboard/finances/page.tsx` (server, parse `?tab=revenus|encaissements|performances`)
- `jason-app/app/dashboard/finances/FinancesView.tsx` (client avec tabs)
- `jason-app/app/dashboard/finances/tabs/RevenusTab.tsx`
- `jason-app/app/dashboard/finances/tabs/EncaissementsTab.tsx`
- `jason-app/app/dashboard/finances/tabs/PerformancesTab.tsx`

**Fichiers à modifier :**
- `jason-app/components/layout/Sidebar.tsx` (item Mes finances pointe vers `/dashboard/finances`)
- `jason-app/components/layout/Header.tsx` (ajouter `/dashboard/finances` au mapping PATH_TITLES)

**Migration progressive :**
- Phase 4a : créer la page finances avec les 3 onglets qui font des `<Suspense>` chargent les composants des pages existantes (rapide)
- Phase 4b : 301 redirect des anciennes URLs vers `/dashboard/finances?tab=revenus` etc.
- Phase 4c : (plus tard) déplacer le code dans la nouvelle structure et supprimer les anciennes routes

**À NE PAS oublier :**
- Filtre logement (sélecteur sidebar) doit s'appliquer aux 3 onglets
- Tous les boutons "Saisir un revenu", "Exporter CSV" doivent rester
- KPIs en langage humain : "Revenu du mois", "Revenu / nuit" — pas de RevPAR brut (tooltip pour les pros)

**Validation Jason :** screenshot des 3 onglets, vérifier qu'aucun bouton/export n'a disparu.

---

### ÉTAPE 5 — Page "Outils & calculs" (hub de cartes)

**Fichiers à créer :**
- `jason-app/app/dashboard/outils/page.tsx` (server)
- `jason-app/app/dashboard/outils/OutilsHub.tsx` (client, grille de 4 cartes)

**Cartes :**
1. **Simulateurs fiscaux** → `/dashboard/simulateurs` (page existante préservée)
2. **Prix & Marché** → `/dashboard/calculateurs` (page existante préservée)
3. **Audit Google My Business** → `/dashboard/audit-gbp` (page existante préservée)
4. **QR & Affiches** → `/dashboard/outils-impression` (page existante préservée)

Chaque carte = icône grande + titre + description courte (2 lignes) + flèche

**Fichiers à modifier :**
- `jason-app/components/layout/Sidebar.tsx` (item Outils pointe vers `/dashboard/outils`)

**À NE PAS oublier :**
- Les sous-pages restent accessibles via leur URL directe (depuis blog, liens contextuels, etc.)
- Sécurité voyageur reste TOP-LEVEL dans la sidebar (criticité)

**Validation Jason :** screenshot du hub.

---

### ÉTAPE 6 — Pages "Apprendre" + "Entre Hôtes" (fusions à onglets)

**Apprendre :**
- Créer `/dashboard/apprendre` avec onglets : Formations / Guide LCD / Actualités (3e onglet ou pas selon Option A+B)
- Sidebar item Apprendre pointe vers `/dashboard/apprendre`

**Entre Hôtes :**
- Créer `/dashboard/entre-hotes` (ou garder `/dashboard/chez-nous`) avec onglets : Forum / Groupes FB / Écosystème
- Sidebar item Entre Hôtes pointe vers la racine

**À NE PAS oublier :**
- TOUS les onglets de formations, parcours, favoris, profil-apprenant doivent rester accessibles
- Les liens depuis le blog, articles, etc. ne doivent pas casser

**Validation Jason :** screenshot de chaque page fusionnée.

---

### ÉTAPE 7 — Page Accueil orientée action

**Audit AVANT de coder :**
- Lister TOUS les éléments de l'Accueil actuel (`/dashboard/page.tsx`)
- Décider pour chacun : conservé / déplacé / supprimé

**Refonte :**
- **Hero dynamique** : selon l'heure et les événements du jour, générer le texte ("Bonjour Jason, il est 14h, 3 messages en attente, check-in Yousef dans 2h")
- **Bloc "⚡ À gérer maintenant"** : agrège messages non lus + demandes de réservation + contrats à signer + paiements en attente (avec bouton par item)
- **Mini calendrier 7 jours** : grille de 7 jours avec événements
- **Widget "📰 Dernières actualités"** : 3 derniers articles
- **Bloc "💡 Pour toi"** : 2 cartes suggestions contextuelles
- **Performance repliée** : barre cliquable en bas avec revenu/occupation/avis, ouvre détail

**Fichiers à modifier :**
- `jason-app/app/dashboard/page.tsx` (refonte complète)
- `jason-app/app/dashboard/EtatDesLieux.tsx`, `MesPlateformesWidget.tsx`, `SetupChecklist.tsx`, `ChezNousWidget.tsx`, `OnboardingTour.tsx` : à reviewer (gardes ou retire ou déplace)

**Logique nouvelle :**
- Helper `lib/dashboard/today-summary.ts` : génère le texte du hero
- Helper `lib/dashboard/pending-actions.ts` : agrège les actions à traiter

**À NE PAS oublier :**
- L'onboarding tracks doit rester fonctionnel
- Les widgets "Mes plateformes" et "Entre Hôtes preview" peuvent rester ou bouger — à décider avec Jason
- Quand un bloc est vide (pas d'actions à traiter), il disparaît (pas "0 actions")

**Validation Jason :** screenshot + use réel pendant 2-3 jours pour confirmer.

---

## 🎚 Décision restante à prendre AVANT l'étape 2

**Calendrier — liste des réservations :**
- Option A : toggle 📅 Mois / 📋 Liste à l'intérieur de `/dashboard/calendrier`
- Option C : item "Mes réservations" dédié dans sidebar (passe à 11 items)

**Recommandation Claude :** Option A. À confirmer.

---

## ⚖️ Pour / Contre du grand changement

### Pour
- ✅ **Sidebar lisible en 1 coup d'œil** (10 items vs 20)
- ✅ **Page d'accueil utile au quotidien** (action vs reporting)
- ✅ **Sélecteur de logement** = scalabilité multi-bien gratuite
- ✅ **Modernisation** (pattern Linear/Notion/Vercel — état de l'art SaaS 2026)
- ✅ **Langage humain** = aligné mono-bien actif (pas de RevPAR brut)
- ✅ **Light/Dark/AMOLED** cohérent partout
- ✅ **Responsive** vraiment pensé (mobile = drawer + bottom nav)
- ✅ **Aucune fonction supprimée** — tout est réorganisé

### Contre
- ❌ **Habitude cassée** — Jason et utilisateurs existants doivent réapprendre
- ❌ **Risque de bug** — beaucoup de fichiers touchés (~30+)
- ❌ **Sensation "vitrine"** perdue (KPIs en évidence → repliés)
- ❌ **Temps de dev important** — chantier sur plusieurs sessions
- ❌ **Plus de complexité logique** dans la page Accueil (règles dynamiques)
- ❌ **Tests à refaire** sur chaque page fusionnée

### Mitigation des risques
- Sauvegarde git (branche `backup/pre-dashboard-refactor` faite)
- Étapes incrémentales (chaque étape testable indépendamment)
- Pages anciennes préservées tant que les nouvelles ne sont pas validées
- Validation visuelle Jason avant chaque étape
- Rollback en 1 commande possible si un truc majeur casse

---

## ✅ Checklist avant chaque commit

- [ ] `npx tsc --noEmit` passe (dans `jason-app/`)
- [ ] Aucune page existante ne 404
- [ ] Sidebar visible avec les bons items
- [ ] Sélecteur logement fonctionnel (si étape ≥ 1)
- [ ] Light + Dark fonctionnent (basculer dans le menu user)
- [ ] Mobile responsive testé (Chrome DevTools, iPhone SE 375px)
- [ ] Commit avec message clair et préfixe `feat(dashboard)` / `refactor(dashboard)` / `fix(dashboard)`

---

## 📞 Pour reprendre demain (nouvelle session)

1. Lire ce fichier en entier (`docs/REFACTOR-DASHBOARD.md`)
2. Confirmer avec Jason la décision Calendrier (Option A ou C)
3. Vérifier que la branche de backup existe : `git fetch origin backup/pre-dashboard-refactor`
4. Commencer par **Étape 1** (sélecteur de logement)
5. Une étape à la fois, valider visuellement avec Jason avant la suivante
