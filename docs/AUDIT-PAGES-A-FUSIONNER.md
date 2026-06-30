# Audit des pages à fusionner — checklist de préservation

> Inventaire des fonctionnalités présentes sur chaque page touchée par le refactor.
> **OBJECTIF : ZÉRO PERTE de fonctionnalité.** À cocher au fur et à mesure.

---

## 📍 ACCUEIL — `/dashboard` (Étape 7)

Composants actuels à reviewer un par un :
- [ ] `OnboardingTour` — visite guidée 1ère visite → **GARDER**
- [ ] `SetupChecklist` — checklist setup → **GARDER** dans onboarding tracks
- [ ] `MesPlateformesWidget` — liens Airbnb/Booking/Driing → **GARDER** sur Accueil
- [ ] `ChezNousWidget` — preview Entre Hôtes → **DÉPLACER** vers /entre-hotes
- [ ] `EtatDesLieux` — prochaines arrivées/départs → **TRANSFORMER** en mini-calendrier 7j
- [ ] Welcome card "Bonjour Jason" → **REMPLACER** par hero dynamique
- [ ] Stats 6/1/0 → **SUPPRIMER** (remplacé par hero + "À gérer")
- [ ] 5 Quick actions → **DÉPLACER** dans bouton "+ Nouvelle action" du header

À AJOUTER :
- [ ] Bloc "⚡ À gérer maintenant"
- [ ] Mini calendrier 7 jours
- [ ] Bloc "💡 Pour toi cette semaine"
- [ ] Widget "📰 Dernières actualités"
- [ ] Bloc "📊 Performance ce mois" replié

---

## 💰 MES FINANCES — `/dashboard/finances` ← fusion 3 pages (Étape 4)

### Onglet 1 : Revenus (depuis `/dashboard/revenus`)
- [ ] Titre "Revenus" (h1)
- [ ] Onboarding "Démarre ton suivi de revenus en 3 étapes"
- [ ] Carte "Revenus encaissés" (total mois/année)
- [ ] Carte "Par logement"
- [ ] Carte "Répartition par canal {année}"
- [ ] Carte "Estimation fiscale {année}"
- [ ] Carte "Journal des paiements"
- [ ] Encart "Fiscalité 2026"
- [ ] Bouton "Importer CSV" → modal `ImportCSVModal.tsx`
- [ ] Bouton "+ Saisir un revenu"
- [ ] Export CSV
- [ ] Actions `actions.ts`

### Onglet 2 : Encaissements (depuis `/dashboard/encaissements`)
- [ ] État "Tu es prêt à encaisser ✨"
- [ ] Récap encaissements Stripe Connect
- [ ] Liste impayés
- [ ] Lien gestion Stripe Connect
- [ ] Logique conditionnelle `hasStripeAccount`

### Onglet 3 : Performances (depuis `/dashboard/performances`)
- [ ] Titre "Performances"
- [ ] État "Pas encore assez de données"
- [ ] Section "Indicateurs hôteliers" (RevPAR/ADR avec tooltips)
- [ ] Section "Projection {année} vs objectif"
- [ ] Section "Année N vs N-1"
- [ ] Section "Performance par jour de semaine"
- [ ] Section "Recommandation de prix par mois"
- [ ] Benchmarks (comparaison marché)
- [ ] Setup objectif annuel
- [ ] Setup charges

### URLs legacy à rediriger (307)
- `/dashboard/revenus` → `/dashboard/finances?tab=revenus`
- `/dashboard/encaissements` → `/dashboard/finances?tab=encaissements`
- `/dashboard/performances` → `/dashboard/finances?tab=performances`

### Filtre logement
Le sélecteur de logement (sidebar) s'applique aux 3 onglets.

---

## 🛠 OUTILS & CALCULS — `/dashboard/outils` ← hub (Étape 5)

Hub avec 4 cartes pointant vers pages existantes préservées.

### Carte 1 : Simulateurs fiscaux → `/dashboard/simulateurs`
- [ ] EstimateurRevenus + CalculateurPrix
- [ ] Sous-pages : `/simulateurs/{taxe-de-sejour, rentabilite-location-courte-duree, fiscalite-micro-bic, franchise-tva-lcd, choisir-statut-ei-sasu}`

### Carte 2 : Prix & Marché → `/dashboard/calculateurs`
- [ ] CalculateurPrix + CompareurMesVilles + MesPrix
- [ ] 35+ sous-pages `/calculateurs/revenu-lcd-{ville}` (préserver toutes)

### Carte 3 : Audit GBP → `/dashboard/audit-gbp`
- [ ] AuditWizard + AuditHistory
- [ ] Sous-routes : `/import-url`, `/import-csv`, `/resultats/[id]`
- [ ] place-actions.ts + actions.ts

### Carte 4 : QR & Affiches → `/dashboard/outils-impression`
- [ ] AfficheTab (Accueil/WiFi/Infos/Règles/Urgences)
- [ ] QrSimpleTab
- [ ] Style & export PDF

**Sécurité voyageur RESTE TOP-LEVEL** dans la sidebar (criticité).

---

## 🎓 APPRENDRE — `/dashboard/apprendre` ← fusion (Étape 6)

### Onglet 1 : Formations (depuis `/dashboard/formations`)
- [ ] Catalogue
- [ ] 17 sous-pages `/formations/[slug]`
- [ ] `/formations/parcours` + `/formations/parcours/[slug]`
- [ ] `/formations/favoris`
- [ ] `/formations/profil-apprenant`

### Onglet 2 : Guide LCD (depuis `/dashboard/guide`)
- [ ] GuideUI.tsx + recherche

Note : Actualités = item séparé sidebar (Option A+B), pas dans Apprendre.

---

## 💬 ENTRE HÔTES — `/dashboard/entre-hotes` ← fusion (Étape 6)

### Onglet 1 : Forum (depuis `/dashboard/chez-nous`)
- [ ] Liste posts + catégories
- [ ] Sous-routes : `/chez-nous/{[postId], membre/[userId], membre-pseudo/[pseudo], notifications}`

### Onglet 2 : Groupes FB (depuis `/dashboard/communaute`)
### Onglet 3 : Écosystème (depuis `/dashboard/ecosysteme`)

---

## 📅 CALENDRIER — `/dashboard/calendrier`

**Option A validée** = toggle 📅 Mois / 📋 Liste à l'intérieur de la page.

### Vue Mois (existant à préserver)
- [ ] CalendrierView.tsx
- [ ] Bouton "Aujourd'hui"
- [ ] Recherche
- [ ] SejourPopover (détail clic)
- [ ] MenageExportModal
- [ ] actions.ts

### Vue Liste (NOUVEAU)
- [ ] Tableau sortable : Voyageur / Arrivée / Départ / Nuits / Montant / Source / Statut
- [ ] Filtres : période (à venir/passées/cette semaine/ce mois), source, logement
- [ ] Tri par colonne
- [ ] Export CSV
- [ ] Total période en pied
- [ ] Recherche par nom
- [ ] Clic ligne = SejourPopover

---

## 🏠 SÉLECTEUR DE LOGEMENT — composant transverse (Étape 1)

- [ ] Stocke logement actif dans cookie `active-property-id` (1 an, sameSite=lax)
- [ ] Affiche : icône + label + nom
- [ ] Dropdown vers le HAUT :
  - `[✓]` Logement courant
  - `[▦]` Tous les logements
  - `[ ]` Autres logements (max 10)
  - Séparateur
  - `[⚙]` Gérer mes logements → `/dashboard/logements`
  - `[+]` Ajouter un logement → `/dashboard/logements?new=1`
- [ ] Masqué si 0 ou 1 logement
- [ ] Sur mobile : barre sticky sous header

Helper `lib/queries/active-property.ts` : lit cookie, renvoie `{ propertyId: string | 'all', property: Logement | null }`.

Pages à updater pour utiliser le filtre :
- [ ] `/dashboard/finances` (3 onglets)
- [ ] `/dashboard/calendrier`
- [ ] `/dashboard/voyageurs`
- [ ] `/dashboard` (Accueil)

---

## 🔔 CLOCHE UNIFIÉE (Étape 3)

3 onglets :
- [ ] Alertes app (table `notifications`)
- [ ] Entre Hôtes (`chez_nous_notifications`)
- [ ] Nouveautés produit (CHANGELOG)

Badge = somme des 3 unread.

---

## ⚠ POINTS DE VIGILANCE

1. **Onboarding tracks** : calculé dans layout, utilisé par `OnboardingTracks`. Préserver.
2. **Multi-spaces** : `getUserSpaces()` déjà en place pour menu user.
3. **Mode admin** : sidebar admin existe, bascule via menu user.
4. **iCal sync** : géré dans `/dashboard/logements/[id]`, accès via sélecteur > "Gérer".
5. **Contrats signature** : `/sign/[token]` public, ne pas toucher.
6. **Pages restantes à mapper** :
   - `/dashboard/profil` → menu user
   - `/dashboard/abonnement` → menu user
   - `/dashboard/aide` → menu user
   - `/dashboard/contributeurs` → menu user
   - `/dashboard/nouveautes` → cloche
   - `/dashboard/notifications` → cloche
   - `/dashboard/ma-fiche-{photographe,menage}` → menu user > Mes espaces
   - `/dashboard/creer-fiche-{photographe,menage}` → menu user > Mes espaces > CTA
   - `/dashboard/admin/*` → bascule mode admin

---

## ✅ Critère "fini" pour chaque étape

1. `npx tsc --noEmit` passe
2. Aucune URL existante ne 404
3. Toutes les fonctionnalités listées ici accessibles (cocher case)
4. Light + Dark + AMOLED testés
5. Mobile (375px) testé
6. Jason valide visuellement
