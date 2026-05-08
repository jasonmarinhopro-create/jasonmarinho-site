export const MAITRISER_DASHBOARD_FORMATION = {
  slug: 'maitriser-dashboard-jason-marinho',
  title: 'Maîtriser le dashboard Jason Marinho : gérer tes logements, contrats et revenus LCD de A à Z',
  description: `Le dashboard Jason Marinho regroupe tout ce dont un hôte LCD a besoin : gestion des logements, contrats signés électroniquement, paiements Stripe, calendrier synchronisé avec Airbnb et Booking, suivi des revenus et simulateurs fiscaux. Cette formation te guide pas à pas pour utiliser chaque fonctionnalité et t'y retrouver en 2h, même si tu démarres de zéro.`,
  duration: '2h00',
  level: 'Débutant',
  objectifs: [
    `Configurer tes logements et préparer ton espace de gestion en 10 minutes`,
    `Créer et envoyer un contrat de location avec signature électronique en 5 min`,
    `Encaisser loyer et caution via Stripe Connect directement depuis le dashboard`,
    `Synchroniser ton calendrier avec Airbnb et Booking via iCal`,
    `Suivre tes revenus et analyser tes performances logement par logement`,
    `Utiliser les simulateurs pour optimiser ta fiscalité (micro-BIC, EI vs SASU)`,
    `Automatiser tes gabarits de messages pour chaque étape du séjour`,
  ],
  modules: [
    {
      id: 1,
      title: `Premiers pas : configurer son espace`,
      duration: '20 min',
      lessons: [
        {
          id: 1,
          title: `Explorer le dashboard : où tout se trouve`,
          duration: '5 min',
          content: `## Bienvenue dans ton outil de gestion LCD

Le dashboard Jason Marinho est accessible sur **app.jasonmarinho.com**. Il est organisé en deux grandes zones :

- **Gestion** : Logements, Voyageurs, Calendrier, Revenus — le quotidien opérationnel
- **Outils** : Simulateurs, Gabarits, Guide LCD, Actualités — les ressources

> Prends 2 minutes pour lire ce plan avant d'aller plus loin. Ça t'évitera de chercher pendant tout le reste de la formation.

---

## La barre latérale — ton menu principal

La sidebar à gauche est ton point d'entrée. Elle ne bouge pas. Chaque item correspond à un module distinct :

| Section | Ce que tu y fais |
|---------|-----------------|
| **Mes Logements** | Ajouter, modifier, voir tes biens |
| **Mes Voyageurs** | Carnet de contacts voyageurs |
| **Calendrier** | Vue mensuelle, séjours, iCal |
| **Revenus** | Saisie et analyse financière |
| **Performances** | TOM, RevPAR, taux d'occupation |

### Les modules outils

- **Simulateurs** : calcul micro-BIC, EI vs SASU, rentabilité, taxe de séjour
- **Gabarits** : messages-types pour chaque étape du séjour
- **Guide LCD** : réglementation, fiscalité, obligations par profil
- **Actualités** : veille réglementaire filtrée pour les hôtes

---

## Ton profil et ton plan

En bas de la sidebar, ton nom et ton plan actuel. Le plan **Découverte** est gratuit et donne accès à la plupart des fonctionnalités. Le plan **Standard** débloque les formations complètes et le support prioritaire.

> **Conseil :** commence toujours par ajouter ton logement (leçon suivante) avant d'explorer les autres modules — certaines fonctionnalités (calendrier, revenus) se remplissent automatiquement une fois le logement créé.
`,
        },
        {
          id: 2,
          title: `Ajouter ton premier logement en 5 minutes`,
          duration: '8 min',
          content: `## Pourquoi commencer par le logement

**Le logement est la colonne vertébrale du dashboard.** Tout le reste (séjours, contrats, revenus, calendrier) est rattaché à un logement. Sans logement créé, tu ne peux pas créer de séjour ni de contrat.

---

## Accéder à Mes Logements

1. Clique sur **Mes Logements** dans la sidebar
2. Clique sur **Ajouter un logement** (bouton en haut à droite)
3. Un formulaire s'ouvre

---

## Les champs à remplir

### Informations essentielles

- **Nom du logement** : le nom court que tu utiliseras partout (ex: "Studio Oberkampf", "Chalet Annecy")
- **Adresse** : adresse complète, utilisée pour les contrats et la fiscalité
- **Type de logement** : appartement, maison, studio, chambre d'hôtes, gîte...
- **Capacité** : nombre maximum de personnes autorisées

### Informations complémentaires (optionnelles mais utiles)

- **Description** : visible dans certains exports et contrats
- **Photo de couverture** : s'affiche sur ta carte logement dans le dashboard
- **Numéro de déclaration** : numéro mairie si applicable (obligatoire dans certaines communes)

> *Tu peux toujours modifier ces infos plus tard.* L'important c'est de valider et d'avoir un logement créé pour continuer.

---

## Après la création

Une fois validé, ton logement apparaît dans la grille de Mes Logements. Tu peux :

- **Modifier** les infos en cliquant sur le crayon
- **Accéder aux séjours** de ce logement depuis sa fiche
- **Voir les contrats** associés

### Ce qui se remplit automatiquement

Une fois le logement créé, le **Calendrier** intègre automatiquement une vue pour ce logement. Les **Revenus** peuvent être saisis logement par logement.

---

*Répète l'opération pour chaque logement que tu gères. Il n'y a pas de limite.*
`,
        },
        {
          id: 3,
          title: `Créer ta première fiche voyageur`,
          duration: '7 min',
          content: `## Le carnet de voyageurs : ton CRM LCD

**Mes Voyageurs** est ton carnet de contacts. Chaque voyageur que tu enregistres peut être rattaché à un ou plusieurs séjours. C'est là que tu stockes ses coordonnées, ses préférences, ses antécédents.

> C'est la base de la **réservation directe** : quand un voyageur revient, tu retrouves son dossier complet en un clic au lieu de le re-saisir depuis zéro.

---

## Créer une fiche voyageur

1. Clique sur **Mes Voyageurs** dans la sidebar
2. Clique sur **Ajouter un voyageur**
3. Remplis les champs :

### Champs obligatoires pour le contrat

- **Prénom et nom** : tels qu'ils apparaîtront sur le contrat
- **Email** : c'est sur cette adresse que le lien de signature sera envoyé
- **Téléphone** : pour le contact direct

### Champs utiles (optionnels)

- **Adresse permanente** : obligatoire sur un contrat valide (mention légale)
- **Notes** : tes observations privées sur le voyageur (jamais visibles par lui)

---

## Pourquoi le carnet est stratégique

- **Récidivistes** : un voyageur satisfait qui revient = zéro commission plateforme si tu passes en direct
- **Blacklist** : tu peux noter les voyageurs problématiques pour ne plus les accepter
- **Historique** : tu vois d'un coup d'œil tous les séjours passés d'un voyageur

> *Exemple concret :* un voyageur qui revient 3 fois par an en réservation directe te fait économiser 9 % × 3 séjours × ton tarif moyen = plusieurs centaines d'euros de commissions par an pour un seul voyageur fidèle.

---

## À retenir

- Le voyageur est créé **une seule fois** et rattaché à autant de séjours que tu veux
- Son email est utilisé pour envoyer automatiquement le lien du contrat
- Tu peux importer plusieurs voyageurs à la fois (fonctionnalité CSV à venir)
`,
        },
      ],
    },
    {
      id: 2,
      title: `Contrats & Paiements : la fonctionnalité clé`,
      duration: '35 min',
      lessons: [
        {
          id: 1,
          title: `Créer un séjour : lier logement + voyageur + dates`,
          duration: '7 min',
          content: `## Le séjour, c'est le lien entre tout

Un séjour dans le dashboard = une réservation. Il relie :

- Un **logement** (lequel ?)
- Un **voyageur** (qui ?)
- Des **dates** (quand ?)
- Un **montant** (combien ?)

Quand tu crées un séjour, le système est prêt à générer le contrat associé.

---

## Créer un séjour

1. Va dans **Mes Voyageurs** → fiche du voyageur concerné, puis **Nouveau séjour**
2. Ou : va dans **Mes Logements** → logement concerné → **Ajouter un séjour**
3. Remplis les informations :

### Les champs du séjour

- **Logement** : sélectionne dans la liste déroulante
- **Date d'arrivée / Date de départ** : utilisées dans le contrat et le calendrier
- **Heure d'arrivée / Heure de départ** : importantes pour les contrats (mention légale)
- **Nombre de voyageurs** : adultes + enfants
- **Montant du loyer** : en euros TTC
- **Montant de la caution** : facultatif mais fortement recommandé
- **Source de réservation** : Airbnb, Booking, Direct, Autre

---

## Ce que le séjour génère automatiquement

Une fois validé :

- Le séjour apparaît **dans le calendrier** sur les bonnes dates
- Le séjour apparaît **dans la liste des séjours** du logement et du voyageur
- Tu peux **créer le contrat** depuis ce séjour en un clic

> Un séjour créé manuellement dans le dashboard **n'est pas lié à Airbnb**. Pour synchroniser les réservations Airbnb, utilise l'import iCal (Module 3).

---

## Statuts d'un séjour

| Statut | Signification |
|--------|--------------|
| **En attente** | Séjour créé, contrat non encore envoyé |
| **Contrat envoyé** | Lien de signature envoyé au voyageur |
| **Signé** | Contrat signé, séjour confirmé |
| **Annulé** | Séjour annulé |
`,
        },
        {
          id: 2,
          title: `Générer et envoyer un contrat signé électroniquement en 5 minutes`,
          duration: '12 min',
          content: `## Pourquoi signer électroniquement avec le dashboard

Beaucoup d'hôtes envoient encore leurs contrats en PDF par email, attendent que le voyageur imprime, signe, scanne et renvoie. **Cette procédure est abandonnée à 40 % du temps.**

Le dashboard génère un **lien de signature sécurisé** que le voyageur ouvre sur son téléphone et signe en 30 secondes. Pas d'impression, pas de scan, pas d'attente.

> La signature électronique obtenue via le dashboard est juridiquement valable en France (conforme au règlement eIDAS et à l'article 1366 du Code civil).

---

## Pré-requis

Avant de générer le contrat, vérifie que le séjour est correctement renseigné :

- **Logement** avec adresse complète ✓
- **Voyageur** avec email valide ✓
- **Dates d'arrivée et de départ** avec heures ✓
- **Montant du loyer** renseigné ✓

*Si l'un de ces champs est vide, le contrat généré comportera des mentions manquantes — ce qui peut invalider sa valeur juridique.*

---

## Générer le contrat

### Étape 1 — Ouvrir le séjour

Dans **Mes Voyageurs** ou **Mes Logements**, ouvre la fiche du séjour concerné.

### Étape 2 — Créer le contrat

Clique sur **Créer le contrat**. Le système génère automatiquement un contrat pré-rempli avec :

- Identité complète du bailleur (toi) depuis ton profil
- Identité du voyageur depuis sa fiche
- Adresse exacte du logement
- Dates et heures de séjour
- Montant du loyer et de la caution
- Règlement intérieur du logement

### Étape 3 — Vérifier le contrat

Avant d'envoyer, **lis le contrat généré** dans l'aperçu. Vérifie :

- [ ] Nom complet du voyageur correct
- [ ] Adresse du logement exacte
- [ ] Dates et heures correctes
- [ ] Montant du loyer exact
- [ ] Montant de la caution correct

> **Ne saute pas cette étape.** Un contrat avec une erreur de date ou de montant peut être contesté.

### Étape 4 — Envoyer le lien de signature

Clique sur **Envoyer le contrat**. Le voyageur reçoit automatiquement un email avec :

- Un lien sécurisé (valable 30 jours)
- Le contrat complet en aperçu
- Un bouton pour signer en un clic

---

## Ce que voit le voyageur

Le voyageur arrive sur une page dédiée (app.jasonmarinho.com/sign/...) qui affiche :

1. **Le contrat complet** à lire
2. **Une case de consentement** ("J'ai lu et j'accepte les conditions")
3. **Un bouton de signature** avec horodatage automatique

**Il n'a pas besoin de créer un compte.** Le lien suffit.

---

## Après la signature

Dès que le voyageur signe :

- Le statut du contrat passe à **Signé**
- Tu reçois une **notification**
- Le contrat signé est **téléchargeable en PDF** (avec preuve d'horodatage)
- Le séjour passe au statut **Confirmé**

---

## En cas de non-signature

Si le voyageur ne signe pas dans les 48h :

- **Relance manuelle** : depuis la fiche séjour, clique sur "Renvoyer le lien"
- **Délai expiré** : le lien expire après 30 jours, tu peux en regénérer un

> *Conseil pratique :* envoie le contrat **dès la réservation confirmée**, pas la veille de l'arrivée. Plus tu attends, plus le voyageur est déjà en route et moins il a envie de signer.

---

## La checklist de suivi des contrats

Dans chaque contrat, une **checklist personnalisable** te permet de suivre les étapes administratives avant le séjour :

- [ ] Contrat signé
- [ ] Caution reçue
- [ ] Pièce d'identité demandée
- [ ] Règlement intérieur envoyé
- [ ] Check-in confirmé

*Tu peux cocher chaque item au fil du temps.* La checklist est visible depuis le calendrier et depuis la fiche voyageur.
`,
        },
        {
          id: 3,
          title: `Configurer Stripe pour encaisser loyer et caution`,
          duration: '10 min',
          content: `## Stripe Connect : encaisser directement sur ton compte

Le dashboard intègre **Stripe Connect**. Ça veut dire que les paiements (loyer + caution) arrivent **directement sur ton compte bancaire personnel**, sans passer par Jason Marinho.

> Concrètement : le voyageur paie via un lien sécurisé Stripe. L'argent va chez toi. Jason Marinho ne touche rien sur les transactions.

---

## Configurer son compte Stripe

### Étape 1 — Accéder aux paramètres de paiement

Dans le dashboard → **Profil** → section **Paiements** → clique sur **Connecter Stripe**.

### Étape 2 — Créer ou connecter ton compte Stripe

- Si tu n'as pas de compte Stripe : crée-en un en 5 minutes (email, IBAN, pièce d'identité)
- Si tu as déjà un compte Stripe : connecte-le via OAuth

### Étape 3 — Valider

Une fois connecté, ton ID Stripe apparaît dans le profil. Tu es prêt à encaisser.

---

## Loyer et caution : deux types de paiement

### Le loyer — capture immédiate

Le montant du loyer est **encaissé immédiatement** au moment où le voyageur paie. Il arrive sur ton compte Stripe sous 2 à 7 jours ouvrés (délai standard Stripe).

### La caution — capture manuelle

La caution est **bloquée** sur la carte du voyageur (autorisation de prélèvement) mais **pas encaissée**. Tu as jusqu'à la fin du séjour pour :

- **Libérer** la caution si tout va bien (voyageur ne voit rien)
- **Capturer** tout ou partie si tu dois déduire des dégâts

> *C'est exactement le même mécanisme qu'un hôtel qui bloque la carte à l'arrivée et débite les extras à la fin.*

---

## Envoyer le lien de paiement au voyageur

Depuis la fiche séjour :

1. Clique sur **Envoyer le lien de paiement**
2. Le voyageur reçoit un email avec un lien Stripe Checkout sécurisé
3. Il entre sa carte bancaire (pas de compte Stripe requis)
4. Tu vois le paiement en temps réel dans ton dashboard Stripe

---

## Ce que ça change vs. Airbnb

| | Airbnb | Dashboard Jason Marinho |
|---|---|---|
| Versement | Après check-in | Configurable |
| Caution | Via AirCover (limité) | Stripe, tu contrôles |
| Commission | 3 % hôte minimum | 0 % (Stripe prend ~1,4 %) |
| Historique | Sur Airbnb | Sur ton compte Stripe |
`,
        },
        {
          id: 4,
          title: `Suivre les signatures, paiements et statuts des contrats`,
          duration: '6 min',
          content: `## La vue d'ensemble de tes contrats

Depuis la fiche de chaque voyageur ou logement, tu as accès à l'historique complet des contrats et de leur statut.

---

## Les statuts de contrat

- **Brouillon** : contrat créé mais pas encore envoyé
- **En attente de signature** : lien envoyé, signature en cours
- **Signé** : contrat signé électroniquement
- **Annulé** : séjour ou contrat annulé

---

## Les statuts de paiement

- **Non envoyé** : lien de paiement pas encore envoyé
- **En attente** : lien envoyé, paiement en cours
- **Loyer reçu** : montant loyer capturé
- **Caution bloquée** : autorisation Stripe active
- **Caution libérée** : caution restituée après séjour
- **Caution capturée** : retenue effectuée (dégâts, etc.)

---

## Le calendrier comme vue globale

Dans le **Calendrier**, chaque séjour affiché montre son statut en temps réel. Tu vois d'un coup d'œil :

- Quels séjours sont confirmés (contrat signé + paiement reçu)
- Quels séjours attendent encore une action de ta part
- Les arrivées et départs du mois

> *Prends l'habitude de vérifier le calendrier chaque lundi matin. En 2 minutes, tu sais exactement où tu en es pour les 30 prochains jours.*
`,
        },
      ],
    },
    {
      id: 3,
      title: `Calendrier : zéro double-réservation`,
      duration: '25 min',
      lessons: [
        {
          id: 1,
          title: `Comprendre le calendrier : événements, séjours, iCal`,
          duration: '7 min',
          content: `## Le calendrier, ton centre de pilotage

Le **Calendrier** du dashboard est une vue mensuelle qui affiche trois types d'éléments :

- **Les séjours** créés dans le dashboard (avec leur statut)
- **Les événements** que tu crées manuellement (ménage, blocage, indispo)
- **Les séjours iCal** synchronisés depuis Airbnb ou Booking (en lecture)

> *La vue calendrier ne remplace pas ton channel manager si tu en as un. Elle te donne une vue unifiée côté gestion, pas côté synchronisation temps réel.*

---

## Créer un événement manuellement

Clique sur une date dans le calendrier. Un formulaire s'ouvre :

- **Titre** : "Ménage", "Blocage travaux", "Visite", etc.
- **Date de début / fin** : pour les blocages multi-jours
- **Catégorie** : Ménage, Blocage, Maintenance, Autre
- **Description** : notes internes

Ces événements sont **visibles uniquement par toi**, pas par les voyageurs.

---

## Sélectionner une plage de dates

Tu peux **cliquer-glisser** sur le calendrier pour sélectionner plusieurs jours d'un coup et créer un événement sur toute la plage. Pratique pour les blocages de plusieurs semaines.

---

## Le bouton "Partager le calendrier"

En haut du calendrier, le bouton **Partager** génère un lien iCal que tu peux donner à d'autres outils (Google Calendar, Notion, Apple Calendar). Ça te permet de voir tes séjours et événements dans n'importe quel outil externe.
`,
        },
        {
          id: 2,
          title: `Synchroniser Airbnb et Booking via iCal`,
          duration: '10 min',
          content: `## iCal : le protocole universel de synchronisation de calendriers

**iCal** (format .ics) est le standard universel que toutes les plateformes de location utilisent pour partager leurs calendriers. Airbnb, Booking, Vrbo, Abritel : tous proposent un lien iCal exportable.

En important ce lien dans le dashboard, tu vois les réservations Airbnb et Booking **directement dans ton calendrier Jason Marinho**, sans double saisie.

---

## Étape 1 — Récupérer le lien iCal d'Airbnb

1. Va sur **Airbnb → Calendrier → Plus d'options → Disponibilité**
2. Descends jusqu'à **Synchroniser les calendriers**
3. Copie le lien iCal d'**exportation** (celui qu'Airbnb te donne pour importer ailleurs)

---

## Étape 2 — Récupérer le lien iCal de Booking

1. Va sur **Booking.com → Établissements → Calendrier → Synchroniser**
2. Copie le lien iCal fourni par Booking

---

## Étape 3 — Ajouter le flux dans le dashboard

Dans le **Calendrier** → icône **Paramètres** → **Ajouter un flux iCal** :

- **Nom** : "Airbnb - Studio Oberkampf" (pour t'y retrouver)
- **URL** : le lien copié depuis Airbnb ou Booking
- **Couleur** : choisis une couleur distincte par plateforme

Clique sur **Synchroniser** et les réservations des 6 derniers mois + 12 mois à venir apparaissent dans ton calendrier.

---

## La synchronisation est automatique

Le dashboard re-synchronise les flux iCal **toutes les heures**. Si une nouvelle réservation arrive sur Airbnb, elle apparaît dans ton dashboard sous 1h maximum.

> **Limitation importante :** la synchronisation iCal est **unidirectionnelle** dans ce contexte. Les réservations Airbnb apparaissent dans le dashboard, mais bloquer une date dans le dashboard ne bloque pas automatiquement Airbnb. Pour ça, il faudrait aussi exporter le calendrier Jason Marinho vers Airbnb (ce que tu peux faire avec le lien "Partager le calendrier").

---

## Zéro double-réservation : le flux aller-retour

Pour une vraie protection contre les doubles réservations :

1. **Importe** le calendrier Airbnb dans le dashboard *(tu vois les resa Airbnb)*
2. **Exporte** le calendrier Jason Marinho vers Airbnb *(Airbnb voit tes blocages)*

Ce va-et-vient bloque automatiquement les dates occupées des deux côtés.
`,
        },
        {
          id: 3,
          title: `Créer des événements manuels : ménage, blocage, maintenance`,
          duration: '8 min',
          content: `## Les catégories d'événements disponibles

Le calendrier distingue plusieurs types d'événements, chacun avec une couleur distincte :

- **Ménage** : vert — nettoyage entre deux séjours
- **Blocage** : rouge — dates indisponibles (travaux, usage personnel, etc.)
- **Maintenance** : orange — interventions techniques (plombier, électricien...)
- **Autre** : gris — tout ce qui ne rentre pas ailleurs

---

## Astuces d'utilisation

### Cliquer-glisser pour une sélection rapide

Au lieu de remplir manuellement la date de début et de fin, **clique sur le premier jour et glisse jusqu'au dernier**. Le formulaire s'ouvre pré-rempli avec les bonnes dates.

### Ajouter des notes internes

Le champ **Description** est ton espace de notes privées. Exemples :

- "Ménage Martine — 09h → 11h"
- "Chauffe-eau HS, plombier Lundi"
- "Réservé pour semaine famille"

Ces notes n'apparaissent jamais côté voyageur.

### Récurrence (à venir)

La fonctionnalité de récurrence (ex: "ménage tous les dimanches") est en cours de développement. En attendant, tu peux créer les événements un par un ou sur une plage multi-jours.

---

## Ce que ça change dans la pratique

Avant le dashboard, la gestion du temps mort entre séjours se faisait sur un Google Calendar ou un cahier. Maintenant, tout est au même endroit :

- Le séjour qui se termine le samedi à 11h
- L'événement ménage de 11h à 14h
- Le séjour suivant qui commence à 16h

*D'un coup d'œil, tu vois si tu as le temps de préparer le logement entre les deux.*
`,
        },
      ],
    },
    {
      id: 4,
      title: `Revenus, performances et outils`,
      duration: '40 min',
      lessons: [
        {
          id: 1,
          title: `Saisir et suivre tes revenus par logement`,
          duration: '10 min',
          content: `## Le module Revenus : ton journal financier LCD

Dans **Revenus**, tu saisis manuellement chaque encaissement. C'est volontaire : le dashboard ne se connecte pas à ton compte bancaire. Tu gardes le contrôle total sur ce qui est considéré comme revenu LCD.

---

## Saisir une entrée de revenus

1. **Revenus → Ajouter une entrée**
2. Remplis :
   - **Logement** : pour quel bien
   - **Date** : date de réception du paiement
   - **Montant** : en euros
   - **Type** : Loyer, Frais de ménage, Taxe de séjour, Autre
   - **Plateforme** : Airbnb, Booking, Direct, Autre
   - **Notes** : référence de réservation, etc.

---

## Lire le tableau de bord financier

Le module Revenus affiche :

- **Revenus totaux** sur la période sélectionnée
- **Répartition par logement** (si tu en as plusieurs)
- **Répartition par plateforme** (quelle part vient d'Airbnb vs. direct)
- **Évolution mensuelle** sur les 12 derniers mois

---

## Export CSV

Tu peux **exporter tes données en CSV** pour les utiliser dans ton logiciel comptable ou pour préparer ta déclaration fiscale.

> *Conseil pratique :* prends l'habitude de saisir tes revenus **chaque semaine**, pas en bloc en fin d'année. 10 minutes par semaine = 0 heure de stress en mai au moment de la déclaration.
`,
        },
        {
          id: 2,
          title: `Lire le tableau de performances (TOM, RevPAR, taux d'occupation)`,
          duration: '10 min',
          content: `## Les 3 indicateurs clés d'un hôte LCD

### TOM — Taux d'Occupation Moyen

**TOM = Nuits louées / Nuits disponibles × 100**

*Exemple : 18 nuits louées sur 30 disponibles = TOM de 60 %*

Un TOM de 70 %+ est considéré comme bon sur la majorité des marchés français. En dessous de 50 %, tu as un problème de visibilité ou de tarification.

### ADR — Average Daily Rate (Prix moyen par nuit)

**ADR = Revenus totaux / Nombre de nuits louées**

C'est ton vrai prix moyen, pas ton prix affiché. Il tient compte des remises, des promotions et des variations saisonnières.

### RevPAR — Revenue Per Available Room

**RevPAR = ADR × TOM = Revenus / Nuits disponibles**

Le RevPAR est **l'indicateur ultime** parce qu'il combine occupation et prix. Deux logements peuvent avoir le même ADR mais des RevPAR très différents selon leur taux d'occupation.

> *Un logement à 120 €/nuit avec 60 % d'occupation = RevPAR 72 €. Un logement à 90 €/nuit avec 85 % d'occupation = RevPAR 76,5 €. Le second est plus performant malgré un prix inférieur.*

---

## Lire le tableau de performances

Dans **Performances**, le dashboard calcule automatiquement ces indicateurs à partir de tes revenus saisis. Tu peux filtrer par :

- Logement
- Période (mois, trimestre, année)

L'objectif : **comparer tes périodes** et voir si tu progresses.
`,
        },
        {
          id: 3,
          title: `Utiliser les simulateurs fiscaux pour optimiser sa déclaration`,
          duration: '12 min',
          content: `## 4 simulateurs, 4 cas d'usage

Le dashboard propose 4 simulateurs disponibles même en plan Découverte :

### 1. Simulateur micro-BIC

Calcule ton imposition selon le régime micro-BIC selon ton niveau de revenus, ton abattement (30 %, 50 % ou 71 % selon le type de meublé) et ta tranche marginale d'imposition.

**Utilise-le pour :** savoir si tu dois rester en micro-BIC ou basculer au réel.

### 2. Simulateur EI vs SASU

Compare les deux structures juridiques principales pour les conciergeries et les hôtes professionnels. Prend en compte le régime social, la charge fiscale et les dividendes.

**Utilise-le pour :** savoir quelle structure crée avant de dépasser le seuil LMP.

### 3. Simulateur de rentabilité

Calcule la rentabilité nette d'un bien selon son prix d'achat, les charges, les revenus LCD estimés et le financement.

**Utilise-le pour :** évaluer un bien avant d'acheter, ou réévaluer un bien existant.

### 4. Simulateur taxe de séjour

Calcule la taxe de séjour que tu dois collecter selon la commune, le type de logement et le classement étoiles.

**Utilise-le pour :** remplir correctement ta déclaration de taxe de séjour en mairie.

---

## Comment utiliser un simulateur

1. Sélectionne le simulateur dans **Outils → Simulateurs**
2. Remplis les champs (les valeurs sont sauvegardées entre sessions)
3. Lis le résultat et le **conseil contextuel** affiché

> *Les simulateurs donnent des estimations, pas des conseils fiscaux certifiés. Pour ta déclaration officielle, consulte un expert-comptable.*
`,
        },
        {
          id: 4,
          title: `Automatiser tes gabarits de messages voyageurs`,
          duration: '8 min',
          content: `## Les gabarits : plus jamais le même message à recopier

Le module **Gabarits** te permet de créer et stocker tes messages-types pour chaque étape d'un séjour. Tu rédiges une fois, tu copies-colles en 3 secondes.

---

## Les catégories de gabarits disponibles

- **Confirmation de réservation** : message envoyé dès la résa confirmée
- **Pré-arrivée J-3** : infos pratiques, code d'entrée, parking
- **Accueil check-in** : bienvenue, instructions d'arrivée
- **Mi-séjour** : vérification de satisfaction
- **Pré-départ J-1** : rappel des règles de départ
- **Départ check-out** : remerciement, demande d'avis
- **Relance avis** : si le voyageur n'a pas laissé d'avis sous 48h

---

## Créer un gabarit

1. **Gabarits → Ajouter un gabarit**
2. Choisis la **catégorie**
3. Rédige le **contenu** avec les variables disponibles :
   - \`{{prenom_voyageur}}\` → prénom du voyageur
   - \`{{nom_logement}}\` → nom de ton logement
   - \`{{date_arrivee}}\` → date d'arrivée
   - \`{{date_depart}}\` → date de départ
   - \`{{heure_arrivee}}\` → heure de check-in
4. Sauvegarde

---

## Utiliser un gabarit

Depuis la fiche d'un séjour, clique sur **Envoyer un message** → sélectionne un gabarit → les variables sont remplacées automatiquement → copie et colle dans Airbnb ou envoie par email.

> *Le dashboard ne peut pas envoyer de messages Airbnb directement (restriction API Airbnb). En revanche, il prépare le message prêt à copier, ce qui prend 5 secondes au lieu de 3 minutes.*
`,
        },
      ],
    },
  ],
}
