export const TARIFICATION_DYNAMIQUE_FORMATION = {
  slug: 'tarification-dynamique',
  title: 'Comprendre et utiliser la tarification dynamique',
  description: '45% des hôtes sous-évaluent ou surévaluent leur logement, perdant 15 à 25% de revenus. Tarif de base, prix minimum, saisonnalité, événements locaux, outils : la méthode complète pour mettre le bon prix — automatiquement.',
  duration: '2h00',
  level: 'Intermédiaire',
  objectifs: [
    'Comprendre les 3 métriques clés du revenue management en LCD',
    'Calculer son prix minimum et son prix de base',
    'Identifier les facteurs qui font monter ou descendre la demande',
    'Choisir et configurer un outil de tarification dynamique',
    'Mettre en place les règles essentielles : séjour minimum, last-minute, événements',
    'Suivre ses performances et ajuster sa stratégie chaque mois',
  ],
  modules: [
    {
      id: 1,
      title: 'Les bases du revenue management en LCD',
      duration: '25 min',
      lessons: [
        {
          id: 1,
          title: `Pourquoi votre prix fixe vous coûte de l'argent`,
          duration: '12 min',
          content: `---

MODULE 1 · LEÇON 1
────────────────────────────────────
Le prix fixe
Pourquoi il vous coûte de l'argent
────────────────────────────────────

---

## Le chiffre qui fait mal
45% des propriétaires LCD
sous-évaluent ou surévaluent leurs tarifs,
perdant ainsi entre 15 et 25%
de revenus potentiels.
Source : PriceLabs / hello.pricelabs.co, 2026

En pratique, un prix fixe :

→ EST TROP BAS en haute saison
  → Vous remplissez facilement
    mais laissez de l'argent sur la table.
  → Des voyageurs auraient payé 30-50% de plus.

→ EST TROP HAUT en basse saison
  → Votre calendrier reste vide.
  → Vous auriez mieux fait de baisser
    et d'encaisser quelque chose.

→ NE RÉAGIT PAS AUX ÉVÉNEMENTS
  → Un salon pro à 2 km = demande ×3.
    Votre prix ne bouge pas.
    Vous louez à prix normal
    pendant une nuit qui valait le triple.

→ Sur 15 000€ de revenus annuels :
  15 à 25% = 2 250 à 3 750€ perdus
  chaque année avec un prix fixe.

---

## La logique de la tarification dynamique
La tarification dynamique s'inspire
directement de l'hôtellerie et des compagnies aériennes.

Le principe :
→ Prix élevés quand la demande est forte
→ Prix compétitifs quand la demande est faible
→ Prix ajustés chaque jour automatiquement

Ce que ça fait concrètement :

SEMAINE ORDINAIRE EN BASSE SAISON
→ Prix bas pour remplir le calendrier
→ Mieux vaut 70€ encaissés
  que 100€ non encaissés

WEEKEND EN HAUTE SAISON
→ Prix élevé pour maximiser la nuit
→ Le voyageur paie ce que le marché accepte

NUIT AVANT UN ÉVÉNEMENT LOCAL
→ Prix fortement majoré
→ La demande justifie le tarif

→ En 2026, la tarification dynamique
  n'est plus un avantage.
  C'est la norme pour rester compétitif.
  Source : Beyond Pricing Report, 2026

---

## Les 3 métriques à comprendre absolument
TAUX D'OCCUPATION
→ Nuits louées / Nuits disponibles × 100
→ Cible : 65-75% en moyenne annuelle
→ Si < 60% : prix trop élevés
  ou annonce peu visible
→ Si > 85% : vous laissez de l'argent —
  vos prix sont trop bas

ADR (Average Daily Rate)
→ Revenu moyen par nuit louée
→ = Revenus bruts / Nuits louées
→ En hausse = votre stratégie fonctionne

RevPAN (Revenu Par nuit Available)
→ Revenu par nuit DISPONIBLE (pas seulement louée)
→ = Revenus bruts / Nuits disponibles
→ C'est la métrique la plus importante
  car elle combine taux d'occupation et prix
→ En hausse = vous optimisez vraiment

---

## L'équilibre à trouver entre occupation et prix
L'erreur classique : maximiser le taux d'occupation.
Ce n'est pas l'objectif.

OBJECTIF : maximiser le RevPAN.

EXEMPLE :
Logement A : 85% d'occupation à 80€/nuit
→ RevPAN = 80 × 0,85 = 68€

Logement B : 65% d'occupation à 110€/nuit
→ RevPAN = 110 × 0,65 = 71,5€

→ Le logement B gagne plus
  malgré un taux d'occupation inférieur.

La bonne question n'est pas :
"Comment remplir toutes mes nuits ?"

La bonne question est :
"Comment maximiser mes revenus par nuit disponible ?"

---


## Exercice
**Exercice pratique :** Calcule ton RevPAN actuel. Prends tes revenus bruts des 3 derniers mois et divise par le nombre de nuits disponibles (pas seulement louées). C'est ton point de départ. Dans 3 mois avec une stratégie de tarification dynamique, ce chiffre doit être en hausse.

---`,
        },
        {
          id: 2,
          title: 'Calculer son prix minimum et son prix de base',
          duration: '13 min',
          content: `---

MODULE 1 · LEÇON 2
────────────────────────────────────
Prix minimum et prix de base
Les deux chiffres à calculer avant tout
────────────────────────────────────

---

## Le prix minimum : votre plancher absolu
Le prix minimum est le prix en dessous duquel
vous ne louez JAMAIS — même la veille pour demain.

C'est le seul chiffre non négociable
de toute votre stratégie.

COMMENT LE CALCULER :

Charges fixes mensuelles du logement
→ Crédit / loyer : [Montant]
→ Charges copropriété : [Montant]
→ Assurance LCD : [Montant]
→ Abonnements (outils, PMS...) : [Montant]
→ TOTAL CHARGES FIXES : [X]€/mois

Coût variable par séjour
→ Ménage : [Montant]
→ Consommables (produits d'accueil...) : [Montant]
→ TOTAL COÛT SÉJOUR : [Y]€

Prix minimum = (X / nuits disponibles mois) + Y + marge min
→ Exemple : 800€ charges + 60€ ménage
  / 20 nuits disponibles = 100€ minimum

---

## Le prix de base : votre point de départ dynamique
Le prix de base est le tarif "neutre"
autour duquel l'outil de tarification dynamique
fait varier vos prix.

Il correspond à votre tarif pour
une nuit ordinaire, en dehors des
événements et de la haute saison.

COMMENT LE FIXER :

ÉTAPE 1 — Analyser la concurrence locale
→ Cherchez 5 logements comparables
  sur Airbnb (même zone, même taille,
  même niveau d'équipement)
→ Notez leur prix moyen sur un jour ordinaire

ÉTAPE 2 — Se positionner par rapport à eux
→ Moins d'avis que la concurrence : -10 à -15%
→ Autant d'avis et qualité similaire : prix identique
→ Note supérieure et équipements premium : +10 à +20%

ÉTAPE 3 — Vérifier par rapport à votre prix minimum
→ Votre prix de base doit être
  au moins 20-30% au-dessus de votre minimum.
→ Si ce n'est pas le cas :
  vos charges sont trop élevées
  ou votre marché est trop compétitif.

---

## Les facteurs qui font monter la demande
L'outil de tarification dynamique ajuste
vos prix en fonction de ces signaux :

FACTEURS QUI FONT MONTER LES PRIX :

→ SAISONNALITÉ
  Été, vacances scolaires, week-ends
  → +20 à +100% selon votre marché

→ ÉVÉNEMENTS LOCAUX
  Salons professionnels, concerts, matchs,
  festivals, marchés de Noël...
  → +30 à +200% pendant les événements

→ FORTE DEMANDE DÉTECTÉE
  Beaucoup de logements déjà réservés
  sur votre zone à ces dates
  → Signal que vous pouvez monter

→ RÉSERVATION AVANCÉE (early booking)
  60+ jours à l'avance
  → Vous pouvez facturer une prime
    pour la garantie de disponibilité

FACTEURS QUI FONT BAISSER LES PRIX :

→ BASSE SAISON
→ DATES NON RÉSERVÉES PROCHES
  (last-minute discount)
→ MARCHÉ LOCAL SOUS PRESSION
  Beaucoup de logements disponibles

---


## Exercice
**Exercice pratique :** Calcule ton prix minimum maintenant avec la formule de la slide 2. Puis recherche 5 logements comparables sur Airbnb dans ta zone et note leur prix moyen. Ces deux chiffres sont vos premières configurations dans tout outil de tarification dynamique.

---`,
        },
      ],
    },
    {
      id: 2,
      title: 'Les outils de tarification dynamique',
      duration: '25 min',
      lessons: [
        {
          id: 11,
          title: 'Airbnb Smart Pricing vs outils spécialisés',
          duration: '12 min',
          content: `---

MODULE 2 · LEÇON 1
────────────────────────────────────
Choisir son outil
De l'outil gratuit au spécialisé
────────────────────────────────────

---

## La tarification intelligente Airbnb : le point de départ gratuit
Airbnb propose un outil de tarification
dynamique intégré et gratuit.

CE QU'IL FAIT :
→ Ajuste vos prix selon la demande locale
→ Prend en compte la saisonnalité
→ Intègre certains événements locaux
→ Disponible directement dans votre tableau
  de bord Airbnb : Tarification → Prix intelligents

SES LIMITES :
→ Moins précis que les outils spécialisés
  sur les données hyper-locales
→ Peut descendre sous votre prix minimum
  si vous ne le configurez pas soigneusement
→ Ne gère qu'Airbnb (pas Booking, Driing...)
→ Moins de contrôle et de personnalisation

QUAND L'UTILISER :
→ Pour démarrer avec zéro budget outil
→ Pour 1 logement sur Airbnb uniquement
→ Toujours avec un prix minimum configuré

→ Activez-le en définissant :
  Prix minimum (non négociable)
  Prix maximum (optionnel)
  → Et laissez l'algorithme faire le reste.

---

## PriceLabs : le leader du marché
PriceLabs est l'outil de tarification dynamique
le plus utilisé en France en 2026.

CE QU'IL FAIT :
→ Ajuste les prix selon 20+ variables :
  demande locale, météo, événements,
  historique de réservations,
  calendriers concurrents...
→ Fonctionne sur Airbnb, Booking, Abritel,
  Driing et 100+ PMS
→ Met à jour les prix quotidiennement,
  automatiquement
→ Donne accès aux données de marché
  (ce que font vos concurrents)

IMPACT OBSERVÉ :
→ +15 à +25% de revenus en moyenne
  pour les hôtes qui l'adoptent
Source : moncercleimmo.com, 2026

PRIX : à partir de 19,99$/mois par logement

ROI : pour un logement à 15 000€/an,
+15% = +2 250€/an
L'outil est rentabilisé en < 2 semaines.

---

## Beyond Pricing : l'alternative orientée conciergeries
Beyond Pricing est la seconde référence
du marché en France.

CE QUI LE DIFFÉRENCIE DE PRICELABS :
→ Interface très intuitive,
  prise en main plus rapide
→ Particulièrement bien intégré
  avec Airbnb
→ Tableau de bord plus visuel
→ Davantage orienté conciergeries
  et multi-logements

CE QU'ILS ONT EN COMMUN :
→ Mise à jour quotidienne automatique
→ Prix minimum configurable
→ Règles personnalisables
→ Données de marché locales

PRIX : à partir de 25$/mois par logement

→ Pricelabs vs Beyond : les deux sont excellents.
  Testez les deux (essais gratuits disponibles)
  et gardez celui que vous maîtrisez le mieux.
  La meilleure stratégie bien exécutée
  vaut plus que la stratégie parfaite mal appliquée.

---

## Comparatif rapide des 3 options
AIRBNB          PRICELABS       BEYOND
                SMART PRICING

Prix            Gratuit         19,99$/logement 25$/logement
Plateformes     Airbnb seul     Multi           Multi
Personnalisation Limitée        Avancée         Intermédiaire
Données marché  Basique         Complètes       Complètes
Prise en main   Très facile     Facile          Très facile
Idéal pour      Débutants,      Optimisateurs,  Conciergeries,
                1 logement      multi-biens     interface simple

→ RECOMMANDATION SIMPLE :
  1 logement, débutant → Airbnb Smart Pricing
  2+ logements ou vous voulez optimiser → Pricelabs
  Conciergerie ou vous cherchez la simplicité → Beyond

---


## Exercice
**Exercice pratique :** Si tu n'as pas encore activé de tarification dynamique : active la tarification intelligente Airbnb aujourd'hui avec ton prix minimum configuré. C'est gratuit et ça améliore déjà les revenus. Si tu veux aller plus loin : inscris-toi à l'essai gratuit de Pricelabs (hello.pricelabs.co) cette semaine.

---`,
        },
        {
          id: 12,
          title: 'Configurer son outil en 5 étapes',
          duration: '13 min',
          content: `---

MODULE 2 · LEÇON 2
────────────────────────────────────
Configuration de l'outil
Les 5 étapes pour bien démarrer
────────────────────────────────────

---

## ÉTAPE 1 : Connecter ses plateformes
La première étape : connecter votre outil
à toutes vos plateformes de réservation.

AVEC PRICELABS :
→ Tableau de bord → Ajouter un logement
→ Choisir la connexion : Airbnb, Booking,
  Abritel ou via votre PMS (channel manager)
→ Autoriser l'accès à votre compte

AVEC BEYOND :
→ Même procédure, interface plus guidée

⚠️ POINT CRITIQUE :
→ Ne connectez PAS Booking directement
  à deux outils différents en même temps.
→ Choisissez un seul outil de pricing
  par plateforme pour éviter les conflits.

→ Si vous êtes sur Airbnb et Booking :
  connectez les deux à Pricelabs
  (ou les deux à Beyond).
  Pas Pricelabs pour l'un et Beyond pour l'autre.

---

## ÉTAPE 2 : Définir les paramètres de base
Dès la connexion, configurez absolument :

PRIX MINIMUM (non négociable)
→ Le chiffre que vous avez calculé
  dans la leçon précédente.
→ L'outil ne descendra jamais en dessous.
→ Vérifiez-le soigneusement — certains outils
  proposent un minimum par défaut trop bas.

PRIX DE BASE
→ Votre tarif "neutre" pour une nuit ordinaire.
→ L'outil construit sa tarification
  autour de ce chiffre.

PRIX MAXIMUM (optionnel mais recommandé)
→ Evite que l'outil monte trop haut
  lors d'un événement et que vous
  ratiez la réservation.
→ Fixez-le à 3-4x votre prix de base.

SÉJOUR MINIMUM PAR DÉFAUT
→ 1-2 nuits par défaut.
→ Vous affinerez par période ensuite.

---

## ÉTAPE 3 : Configurer les règles saisonnières
C'est là que votre stratégie se construit.

HAUTE SAISON (été, vacances scolaires)
→ Ajuster la sensibilité de l'algorithme :
  "Maximiser le revenu" plutôt que "Maximiser l'occupation"
→ Séjour minimum plus élevé (3-7 nuits)
→ Prix minimum plus élevé

BASSE SAISON (novembre, janvier, février)
→ Ajuster : "Maximiser l'occupation"
→ Séjour minimum réduit (1-2 nuits)
→ Activer les remises last-minute
  (réductions automatiques sur les dates
   non réservées à 3-7 jours)

PÉRIODES SPÉCIALES (Noël, Nouvel An,
Vacances de Pâques, Toussaint)
→ Ces dates méritent souvent un traitement manuel
  en plus de l'algorithme :
  prix minimum plus élevé + séjour minimum plus long

→ La plupart des outils proposent un calendrier
  saisonnier où vous définissez ces règles
  une seule fois — elles s'appliquent automatiquement.

---

## ÉTAPES 4 ET 5 : Événements locaux et suivi
ÉTAPE 4 — LES ÉVÉNEMENTS LOCAUX

→ Pricelabs et Beyond intègrent une base
  de données d'événements locaux
  (concerts, salons, matchs, festivals...).
→ Ils ajustent automatiquement les prix
  lors de ces événements.
→ Mais complétez manuellement avec
  les événements très locaux que l'outil
  ne connaît pas (marché local, événement
  municipal, festival de niche...).

Comment ajouter un événement manuellement :
→ Allez sur le calendrier de l'outil
→ Sélectionnez les dates
→ Appliquez une majoration manuelle
  (+30 à +100% selon l'événement)
→ L'outil maintient cette majoration
  en plus de sa tarification dynamique

ÉTAPE 5 — SUIVI ET AJUSTEMENTS
→ Ne configurez pas et n'oubliez pas.
→ Regardez les résultats chaque semaine
  les 2 premiers mois.
→ Ajustez le prix de base si le taux
  d'occupation est trop bas ou trop haut.

---


## Exercice
**Exercice pratique :** Si tu utilises déjà Pricelabs ou Beyond : vérifie que ton prix minimum est bien configuré et correct. Si tu démarres : configure le prix minimum ET le prix de base cette semaine. C'est la configuration minimale qui protège votre rentabilité dès le premier jour d'utilisation.

---`,
        },
      ],
    },
    {
      id: 3,
      title: 'Stratégies avancées de tarification',
      duration: '35 min',
      lessons: [
        {
          id: 21,
          title: 'La durée minimale de séjour : le levier méconnu',
          duration: '12 min',
          content: `---

MODULE 3 · LEÇON 1
────────────────────────────────────
La durée minimale de séjour
Le levier le plus sous-utilisé
────────────────────────────────────

---

## Pourquoi la durée minimale impacte vos revenus
La durée minimale de séjour est souvent
réglée une fois et oubliée.

C'est une erreur. C'est un levier puissant.

IMPACT DIRECT SUR LES REVENUS :

Un séjour minimum de 3 nuits en haute saison
→ Réduit les rotations (moins de ménages)
→ Augmente le revenu total par réservation
→ Favorise les voyageurs plus dépensiers
  (qui planifient à l'avance)

Un séjour minimum de 1 nuit en basse saison
→ Permet de capter les voyageurs
  spontanés et les pros en déplacement
→ Comble les trous dans le calendrier

→ Un séjour minimum fixe toute l'année
  est une erreur stratégique.
  Adaptez-le à chaque période.

---

## Les nuits orphelines : le problème et la solution
UNE NUIT ORPHELINE, c'est quoi ?

→ Vous avez une réservation du lundi au jeudi
→ Et une autre du samedi au lundi
→ Il reste le vendredi seul "orphelin"
→ Avec un minimum de 2 nuits, personne
  ne peut le réserver
→ Cette nuit reste vide alors qu'elle
  pourrait être louée

IMPACT SUR VOS REVENUS :
→ Les nuits orphelines représentent
  souvent 5 à 15% de nuits perdues
  sur l'année entière.

SOLUTION AUTOMATIQUE :
→ Pricelabs et Beyond ont une fonctionnalité
  "nuits orphelines" :
  Si une nuit est entre deux réservations
  et qu'elle ne peut pas être vendue
  avec le minimum habituel,
  l'outil réduit automatiquement
  le minimum à 1 nuit pour cette date.
→ Activez-la. C'est gratuit en plus
  de votre abonnement et récupère
  des revenus que vous perdez sans le savoir.

---

## Règles recommandées par période
HAUTE SAISON (juillet-août, grandes vacances)
→ Minimum 3-5 nuits les weekends
→ Minimum 7 nuits si vous êtes
  en destination très touristique
→ Objectif : maximiser la durée et le prix

BASSE SAISON (novembre, janvier, février)
→ Minimum 1 nuit en semaine
→ Minimum 2 nuits le weekend
→ Objectif : remplir le calendrier

VACANCES SCOLAIRES (Toussaint, Noël, Pâques)
→ Minimum 4-7 nuits
→ Ces périodes fonctionnent comme
  de la haute saison locale

DERNIÈRE MINUTE (J-3 à J-7)
→ Réduire automatiquement à 1 nuit
  les dates non réservées proches
→ L'outil le gère automatiquement
  si vous activez les règles last-minute

---


## Exercice
**Exercice pratique :** Regarde ton calendrier des 3 prochains mois. Identifie les nuits orphelines actuelles — des nuits vides entre deux réservations. Si ton outil de pricing ne les gère pas automatiquement, configurez dès maintenant un minimum de 1 nuit pour ces dates spécifiques. Chaque nuit orpheline récupérée = revenu pur.

---`,
        },
        {
          id: 22,
          title: 'Événements et saisonnalité : ne jamais rater un pic de demande',
          duration: '12 min',
          content: `---

MODULE 3 · LEÇON 2
────────────────────────────────────
Événements et saisonnalité
Capter chaque pic de demande
────────────────────────────────────

---

## Les événements qui multiplient la demande
Certains événements peuvent multiplier
la demande par 3 à 10 dans votre zone.

Un hôte qui ne les connaît pas
loue au prix normal.
Un hôte qui les anticipe triple ses revenus.

TYPES D'ÉVÉNEMENTS À SUIVRE :

ÉVÉNEMENTS PROFESSIONNELS
→ Salons et foires (VivaTech, SIMA, Vinexpo...)
→ Congrès médicaux ou scientifiques
→ Formations d'entreprises
→ Source : viparis.com, eurexpo.com,
  parc-des-expositions de votre ville

ÉVÉNEMENTS CULTURELS ET SPORTIFS
→ Festivals, concerts, matchs de championnat
→ Marchés spéciaux (Noël, braderies...)
→ Événements locaux récurrents

ÉVÉNEMENTS INSTITUTIONNELS
→ Remises de diplômes des grandes écoles
→ Portes ouvertes d'universités
→ Élections avec équipes politiques

---

## Comment anticiper les événements locaux
MÉTHODE SIMPLE : le calendrier annuel

En début de chaque année (janvier) :
→ Cherchez sur Google tous les événements
  de votre ville pour l'année
→ Vérifiez le site de votre mairie,
  office de tourisme local,
  centre des congrès
→ Notez les 10-15 dates les plus impactantes

Puis dans votre outil de pricing :
→ Bloquez ces dates dans votre calendrier
  (ne les vendez pas à l'avance au prix normal)
→ Configurez des majorations manuelles
  (+30% à +100% selon l'importance)

RÈGLE D'OR :
→ Pour les événements majeurs :
  ne pas ouvrir les réservations trop tôt.
  Attendez 30-45 jours avant l'événement
  pour bénéficier de la prime de dernière minute.

→ Pour les événements modérés :
  ouvrez normalement mais avec une majoration.

---

## Lire les données de marché de votre outil
Pricelabs et Beyond donnent accès
à des données précieuses sur votre marché.

CE QUE VOUS POUVEZ VOIR :

→ Le taux d'occupation moyen
  de votre zone pour chaque mois
  → Identifiez les mois où la concurrence
    se remplit bien (vous sous-pricez peut-être)
  → Identifiez les mois où tout le monde galère
    (baissez avant les autres)

→ Le prix moyen de vos concurrents
  par période
  → Positionnez-vous par rapport à eux

→ Les événements locaux détectés
  par l'algorithme
  → Validez et ajoutez ceux qu'il ne connaît pas

→ Regardez ces données une fois par mois.
  Ce n'est pas de la surveillance obsessionnelle,
  c'est de la stratégie.

---


## Exercice
**Exercice pratique :** Cette semaine : cherche sur Google les 5 événements les plus importants de ta ville pour les 3 prochains mois. Pour chacun : configure une majoration manuelle dans ton outil de pricing (ou dans ton calendrier Airbnb si tu n'as pas encore d'outil). Ne laisse plus jamais passer un pic de demande au prix normal.

---`,
        },
        {
          id: 23,
          title: 'Les remises intelligentes : early booking et last-minute',
          duration: '11 min',
          content: `---

MODULE 3 · LEÇON 3
────────────────────────────────────
Remises intelligentes
Early booking et last-minute
────────────────────────────────────

---

## La remise early booking : inciter à réserver tôt
Une réservation confirmée 60 jours à l'avance
vous donne de la visibilité et de la sécurité.

LOGIQUE DE L'EARLY BOOKING :
→ Vous offrez -5 à -10% pour une
  réservation faite 60+ jours à l'avance
→ En échange : revenus sécurisés tôt,
  calendrier visible, meilleure planification

OÙ ET COMMENT :
→ Sur Airbnb : Promotions → Offre early-bird
→ Sur Booking : Extranet → Promotions
  → "Remise de réservation anticipée"
→ Dans Pricelabs : règle de remise
  selon la fenêtre de réservation

QUAND L'UTILISER :
→ Surtout en haute saison
  pour sécuriser les réservations importantes
→ Sur les logements avec des semaines
  encore vides à 3-4 mois de la date

IMPACT :
→ Moins de revenus sur ces réservations
  mais certitude de remplissage.
  À utiliser avec parcimonie.

---

## La remise last-minute : ne pas laisser de nuits vides
La pire situation en LCD :
une nuit vide la veille pour demain.

C'est 0€ encaissé alors que 75€
auraient été mieux que rien.

LOGIQUE DU LAST-MINUTE :
→ Si une date n'est pas réservée à J-3,
  baissez automatiquement le prix
  pour la remplir.
→ 75€ encaissés > 0€ non encaissés.
→ C'est de la marge pure si vos charges fixes
  sont déjà couvertes.

RÈGLES RECOMMANDÉES :
→ J-7 : -5% sur le prix du jour
→ J-3 : -10% sur le prix du jour
→ J-1 : -15 à -20% sur le prix du jour

OÙ CONFIGURER :
→ Pricelabs : "Remises last-minute"
  dans les paramètres de tarification
→ Beyond : "Règles de prix proches"
→ Airbnb : "Remise de dernière minute"
  dans les promotions

⚠️ Toujours avec votre prix minimum
comme plancher. La remise last-minute
ne doit jamais tomber sous ce seuil.

---

## La règle des "jours adjacents"
Un concept peu connu mais très efficace :

JOURS ADJACENTS = dates situées
juste avant ou après une réservation,
qui sont difficiles à vendre
avec un minimum de séjour standard.

EXEMPLE :
Réservation du mercredi au vendredi.
Le lundi et le mardi avant sont "adjacents".
Avec un minimum de 3 nuits, personne
ne peut réserver lundi-mardi seulement.

SOLUTION :
→ Pricelabs et Beyond ont une règle
  "dates adjacentes" :
  Si une date est juste avant/après
  une réservation et qu'elle ne peut pas
  être vendue avec le minimum habituel,
  l'outil réduit le minimum à 1-2 nuits.
→ Ces dates se vendent souvent bien
  en promotion last-minute.
→ Activez cette règle dans votre outil.
  C'est du revenu récupéré automatiquement.

---


## Exercice
**Exercice pratique :** Configure maintenant les remises last-minute dans ton outil (ou dans les Promotions Airbnb si tu n'as pas encore de Pricelabs/Beyond). Utilise les taux de la slide 3 : -5% à J-7, -10% à J-3, -15% à J-1. Garde ton prix minimum comme plancher absolu. Ces règles tournent seules et récupèrent des revenus que vous perdez actuellement.

---`,
        },
      ],
    },
    {
      id: 4,
      title: 'Suivre et améliorer sa stratégie',
      duration: '35 min',
      lessons: [
        {
          id: 31,
          title: 'Les indicateurs à suivre chaque mois',
          duration: '12 min',
          content: `---

MODULE 4 · LEÇON 1
────────────────────────────────────
Le suivi mensuel
Piloter sa stratégie avec les bons chiffres
────────────────────────────────────

---

## Les 4 chiffres du tableau de bord mensuel
Une fois par mois, 15 minutes suffisent
pour évaluer votre stratégie tarifaire.

CHIFFRE 1 — TAUX D'OCCUPATION
Cible : 65-75% annuel
→ Si < 60% 2 mois de suite :
  baissez le prix de base de 10%
→ Si > 85% 2 mois de suite :
  montez le prix de base de 10-15%

CHIFFRE 2 — ADR (revenu moyen par nuit louée)
→ En hausse = vous vendez mieux
→ En baisse alors que l'occupation monte :
  vous bradez trop

CHIFFRE 3 — REVPAN
→ Le plus important : doit toujours croître
→ Si stable ou en baisse malgré
  un bon taux d'occupation :
  vos prix sont trop bas

CHIFFRE 4 — FENÊTRE DE RÉSERVATION MOYENNE
→ Combien de jours à l'avance vos voyageurs
  réservent-ils en moyenne ?
→ Si elle raccourcit : marché qui réserve
  de plus en plus tard → ajustez vos
  remises last-minute

---

## Quand ajuster son prix de base
Le prix de base doit être ajusté
en fonction des signaux du marché.

AJUSTER À LA HAUSSE si :
→ Taux d'occupation > 80% sur 2 mois
→ Vous avez des réservations last-minute
  au prix plein régulièrement
→ Vos concurrents affichent des prix
  significativement plus élevés que vous
  pour des logements similaires

AJUSTER À LA BAISSE si :
→ Taux d'occupation < 55% sur 2 mois
→ Vos dates non réservées à J-14
  ne bougent pas malgré les remises
→ Votre concurrence affiche des prix
  significativement plus bas

RÈGLE PRATIQUE :
→ Ajustez de 5 à 10% à la fois.
→ Attendez 4 semaines pour mesurer l'impact.
→ Ne changez pas plusieurs paramètres
  en même temps (impossible de savoir
  ce qui a fonctionné).

---

## Les outils de benchmarking concurrentiel
Pour savoir si votre stratégie est juste,
vous avez besoin de vous comparer
à vos concurrents.

PRICELABS MARKET DASHBOARD
→ Voir les taux d'occupation moyens
  de votre zone par mois
→ Voir les ADR moyens de vos concurrents
→ Comparer votre performance au marché

AIRDNA (outil complémentaire)
→ Données de marché détaillées
→ Estimation de revenus potentiels
  pour n'importe quel logement en France
→ Utile pour benchmarker votre performance

MÉTHODE MANUELLE (gratuite)
→ Cherchez vos 5 concurrents directs
  sur Airbnb
→ Regardez leurs disponibilités et prix
  pour le mois prochain
→ Si la plupart sont complets et vous êtes vide :
  votre prix est trop élevé
→ Si la plupart ont des disponibilités :
  c'est la norme de votre marché

---


## Exercice
**Exercice pratique :** Crée maintenant dans ton Google Sheet de pilotage (formation Automatisation) un onglet "Tarification" avec 4 colonnes : Mois | Taux occupation | ADR | RevPAN. Remplis-le avec les 3 derniers mois. Ce tableau simple, mis à jour chaque mois en 5 minutes, te donne tout ce qu'il faut pour piloter ta stratégie.

---`,
        },
        {
          id: 32,
          title: 'Les erreurs de tarification les plus fréquentes',
          duration: '12 min',
          content: `---

MODULE 4 · LEÇON 2
────────────────────────────────────
Les erreurs fréquentes
Ce qui sabote votre stratégie sans que vous le sachiez
────────────────────────────────────

---

## Erreur 1 : Ne pas configurer de prix minimum
C'est l'erreur la plus dangereuse
et la plus fréquente.

Ce qui se passe sans prix minimum :
→ L'outil descend très bas en basse saison
  pour "remplir"
→ Vous louez à un prix qui ne couvre même
  pas vos charges variables (ménage, etc.)
→ Vous payez pour avoir des voyageurs

Ça semble impossible ?
→ Une hôte à Nice a eu une réservation
  à 28€/nuit proposée par l'outil
  sans prix minimum configuré.
  Son ménage seul coûtait 50€.

RÈGLE ABSOLUE :
→ Configurez votre prix minimum
  AVANT d'activer tout outil de pricing.
→ Vérifiez-le chaque mois.
→ Il doit toujours couvrir :
  charges fixes ramenées à la nuit
  + coûts variables du séjour
  + marge minimale.

---

## Erreur 2 : Laisser tourner l'outil sans le regarder
Un outil de tarification dynamique
n'est pas du "set and forget" complet.

Il optimise selon les données du marché.
Mais il ne connaît pas :
→ Vos contraintes personnelles
  (disponibilités, travaux prévus)
→ Les événements hyper-locaux
  que sa base de données ne référence pas
→ Vos changements d'équipements ou de déco
  (qui justifient un prix plus élevé)
→ Les décisions de vos concurrents
  qui changent brusquement de stratégie

La bonne fréquence de vérification :
→ Semaines 1-4 après lancement : chaque jour
  (pour comprendre comment l'outil se comporte)
→ Mois 2-3 : 2 fois par semaine
→ Ensuite : 1 fois par semaine suffit
  + révision mensuelle des paramètres

---

## Erreur 3 : Copier les prix des concurrents sans stratégie
Une erreur fréquente chez les débutants :
"Mon voisin est à 90€, je mets 85€."

Pourquoi c'est problématique :
→ Vous ne connaissez pas sa structure
  de charges (il peut se permettre 85€,
  pas forcément vous)
→ Vous ne connaissez pas sa qualité
  (si son logement est moins bien que le vôtre,
   vous sous-pricez)
→ Si tout le monde fait pareil,
  le marché entier se tire vers le bas

La bonne approche :
→ Regardez les prix des concurrents
  comme RÉFÉRENCE de marché,
  pas comme cible à battre systématiquement.
→ Si votre logement est meilleur (note > 4,8,
  équipements premium, photos professionnelles) :
  vous avez le droit d'être 10-20% plus cher.
→ Si votre logement est équivalent :
  alignez-vous.
→ Si votre logement est moins bon :
  compensez par le prix jusqu'à amélioration.

---


## Exercice
**Exercice pratique :** Vérification rapide : ouvre ton outil de pricing ou ton tableau de bord Airbnb. Est-ce que tu as un prix minimum configuré ? Est-il au bon niveau (charges + ménage + marge) ? Si ce n'est pas le cas ou si tu n'es pas sûr : recalcule-le avec la formule de la leçon 1.2 et mets-le à jour maintenant.

---`,
        },
        {
          id: 33,
          title: `Le récapitulatif et le plan d'action`,
          duration: '11 min',
          content: `---

MODULE 4 · LEÇON 3
────────────────────────────────────
Le plan d'action
De la théorie à la pratique en 4 semaines
────────────────────────────────────

---

## Le plan sur 4 semaines
SEMAINE 1 — LES FONDATIONS
□ Calculer son prix minimum
□ Identifier son prix de base
  (benchmarking 5 concurrents)
□ Activer la tarification intelligente Airbnb
   OU s'inscrire à l'essai Pricelabs/Beyond

SEMAINE 2 — CONFIGURATION
□ Connecter ses plateformes à l'outil
□ Configurer prix minimum + prix de base
□ Activer les remises last-minute
□ Activer la règle des nuits orphelines

SEMAINE 3 — STRATÉGIE AVANCÉE
□ Identifier les 5 événements locaux
  des 3 prochains mois
□ Configurer les majorations manuelles
□ Mettre en place les règles saisonnières
  (durée minimum par période)

SEMAINE 4 — SUIVI
□ Créer l'onglet "Tarification" dans
  le Google Sheet de pilotage
□ Comparer les métriques avant/après
  les 2 premières semaines
□ Premier ajustement du prix de base
  si nécessaire

---

## Ce que vous pouvez attendre comme résultats
RÉSULTATS RÉALISTES EN 3 MOIS :

→ +5 à +10% de RevPAN
  (revenus par nuit disponible)

→ Moins de nuits orphelines vides

→ Meilleure capture des événements locaux
  (+30% à +100% sur ces nuits)

→ Moins de temps passé sur la tarification
  (-1 à -2h/semaine)

RÉSULTATS RÉALISTES EN 6 MOIS :

→ +15 à +25% de revenus annuels
  vs prix fixe initial
  Source : PriceLabs, données utilisateurs 2026

→ Stratégie tarifaire qui "tourne seule"
  avec 15 minutes de supervision par semaine

→ Vous louez plus cher en haute demande
  ET vous remplissez mieux en basse demande
  — simultanément.

---

## Le récapitulatif de la formation
CE QUE VOUS SAVEZ MAINTENANT FAIRE :

MODULE 1
□ Comprendre les 3 métriques clés :
  taux d'occupation, ADR, RevPAN
□ Calculer son prix minimum
  et son prix de base

MODULE 2
□ Choisir entre Airbnb Smart Pricing,
  Pricelabs et Beyond selon son profil
□ Configurer l'outil en 5 étapes

MODULE 3
□ Optimiser la durée minimale de séjour
  selon les périodes
□ Anticiper et capter les événements locaux
□ Configurer les remises early booking
  et last-minute intelligemment

MODULE 4
□ Suivre les 4 métriques mensuelles
□ Éviter les 3 erreurs les plus fréquentes
□ Ajuster sa stratégie avec méthode

→ La tarification dynamique n'est pas
  une science exacte. C'est un processus
  d'amélioration continue.
  Commencez, mesurez, ajustez.

Des questions sur votre stratégie tarifaire ?
[Prends un appel avec Jason](/contact)

---


## Exercice
**L'action finale de la formation :**

Une seule action aujourd'hui : calcule ton prix minimum exact avec la formule du module 1. C'est le chiffre le plus important de toute cette formation. Configurez-le dans votre outil de pricing — ou dans les paramètres Airbnb si vous n'avez pas encore d'outil spécialisé.

Tout le reste peut attendre demain.
Ce chiffre, non.

Formation 2`,
        },
      ],
    },
  ],
}
