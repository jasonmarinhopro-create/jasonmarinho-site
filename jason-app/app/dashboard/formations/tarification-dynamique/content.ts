export const TARIFICATION_DYNAMIQUE_FORMATION = {
  slug: 'tarification-dynamique',
  title: 'Comprendre et utiliser la tarification dynamique',
  description: 'Un prix fixe laisse de l\'argent sur la table en haute saison et fait fuir en basse saison. Tarif de base, prix minimum, saisonnalité, événements locaux, outils : la méthode complète pour mettre le bon prix, automatiquement.',
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
          title: `Pourquoi ton prix fixe te coûte de l'argent`,
          duration: '12 min',
          content: `:::bref
- Un prix fixe est trop bas quand la demande est forte et trop haut quand elle est faible.
- La tarification dynamique ajuste ton prix à la demande : saison, jour, événement, délai.
- Trois chiffres à suivre : taux d'occupation, prix moyen par nuit louée, revenu par nuit disponible.
:::

## Ce que coûte un prix fixe
Un prix qui ne bouge jamais est
forcément faux une bonne partie
de l'année : trop bas quand la demande
est forte, trop haut quand elle est faible.

En pratique, un prix fixe :

→ EST TROP BAS en haute saison
  → Tu remplis facilement
    mais laisse de l'argent sur la table.
  → Des voyageurs auraient payé plus cher.

→ EST TROP HAUT en basse saison
  → Ton calendrier reste vide.
  → Tu aurais mieux fait de baisser
    et d'encaisser quelque chose.

→ NE RÉAGIT PAS AUX ÉVÉNEMENTS
  → Un salon pro à 2 km fait bondir la demande.
    Ton prix ne bouge pas.
    Tu loues à prix normal
    pendant une nuit qui valait le triple.

→ Sur 15 000€ de revenus annuels :
  15 à 25% = 2 250 à 3 750€ perdus
  chaque année avec un prix fixe.

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

## Les 3 métriques à comprendre absolument
TAUX D'OCCUPATION
→ Nuits louées / Nuits disponibles × 100
→ Cible : 65-75% en moyenne annuelle
→ Si < 60% : prix trop élevés
  ou annonce peu visible
→ Si > 85% : tu laisses de l'argent -
  tes prix sont trop bas

ADR (Average Daily Rate)
→ Revenu moyen par nuit louée
→ = Revenus bruts / Nuits louées
→ En hausse = ta stratégie fonctionne

RevPAN (Revenu Par nuit Available)
→ Revenu par nuit DISPONIBLE (pas seulement louée)
→ = Revenus bruts / Nuits disponibles
→ C'est la métrique la plus importante
  car elle combine taux d'occupation et prix
→ En hausse = tu optimises vraiment

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


## Exercice
**Exercice pratique :** Calcule ton RevPAN actuel. Prends tes revenus bruts des 3 derniers mois et divise par le nombre de nuits disponibles (pas seulement louées). C'est ton point de départ. Dans 3 mois avec une stratégie de tarification dynamique, ce chiffre doit être en hausse.

:::quiz
? Que se passe-t-il avec un prix fixe pendant un grand salon près de chez toi ?
* Tu loues au prix normal une nuit qui valait bien plus
- Ton prix monte automatiquement
- Les voyageurs ne viennent pas
= Un prix fixe ne réagit pas aux pics de demande : tu laisses de l'argent sur la table.
:::

:::quiz
? Quel indicateur résume le mieux prix et remplissage ensemble ?
* Le revenu par nuit disponible
- Le nombre d'avis
- Le prix le plus haut de l'année
= Il combine le prix et le taux d'occupation : s'il monte, ta stratégie progresse.
:::`,
        },
        {
          id: 2,
          title: 'Calculer son prix minimum et son prix de base',
          duration: '13 min',
          content: `:::bref
- Le prix minimum est le plancher sous lequel tu ne loues jamais.
- Il couvre tes charges fixes ramenées à la nuit, le coût d'un séjour et une petite marge.
- Le prix de base est ton prix d'une nuit ordinaire, point de départ des ajustements.
:::

## Le prix minimum : ton plancher absolu
Le prix minimum est le prix en dessous duquel
tu ne loues JAMAIS, même la veille pour demain.

C'est le seul chiffre non négociable
de toute ta stratégie.

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

## Le prix de base : ton point de départ dynamique
Le prix de base est le tarif "neutre"
autour duquel l'outil de tarification dynamique
fait varier tes prix.

Il correspond à ton tarif pour
une nuit ordinaire, en dehors des
événements et de la haute saison.

COMMENT LE FIXER :

ÉTAPE 1, Analyser la concurrence locale
→ Cherche 5 logements comparables
  sur Airbnb (même zone, même taille,
  même niveau d'équipement)
→ Note leur prix moyen sur un jour ordinaire

ÉTAPE 2, Se positionner par rapport à eux
→ Moins d'avis que la concurrence : -10 à -15%
→ Autant d'avis et qualité similaire : prix identique
→ Note supérieure et équipements premium : +10 à +20%

ÉTAPE 3, Vérifier par rapport à ton prix minimum
→ Ton prix de base doit être
  au moins 20-30% au-dessus de ton minimum.
→ Si ce n'est pas le cas :
  tes charges sont trop élevées
  ou ton marché est trop compétitif.

## Les facteurs qui font monter la demande
L'outil de tarification dynamique ajuste
tes prix en fonction de ces signaux :

FACTEURS QUI FONT MONTER LES PRIX :

→ SAISONNALITÉ
  Été, vacances scolaires, week-ends
  → +20 à +100% selon ton marché

→ ÉVÉNEMENTS LOCAUX
  Salons professionnels, concerts, matchs,
  festivals, marchés de Noël...
  → +30 à +200% pendant les événements

→ FORTE DEMANDE DÉTECTÉE
  Beaucoup de logements déjà réservés
  sur ta zone à ces dates
  → Signal que tu peux monter

→ RÉSERVATION AVANCÉE (early booking)
  60+ jours à l'avance
  → Tu peux facturer une prime
    pour la garantie de disponibilité

FACTEURS QUI FONT BAISSER LES PRIX :

→ BASSE SAISON
→ DATES NON RÉSERVÉES PROCHES
  (last-minute discount)
→ MARCHÉ LOCAL SOUS PRESSION
  Beaucoup de logements disponibles


## Exercice
**Exercice pratique :** Calcule ton prix minimum maintenant avec la formule de la slide 2. Puis recherche 5 logements comparables sur Airbnb dans ta zone et note leur prix moyen. Ces deux chiffres sont tes premières configurations dans tout outil de tarification dynamique.

:::quiz
? 800 € de charges, 20 nuits louées et 60 € de ménage par séjour d'une nuit : quel plancher ?
* 100 €
- 40 €
- 60 €
= 800 / 20 = 40 €, plus 60 € de ménage = 100 € par nuit avant marge.
:::

:::quiz
? À quoi sert le prix de base ?
- C'est le prix le plus bas autorisé
- C'est le prix affiché le week-end
* C'est le point de départ des majorations et remises
= Les outils appliquent saisons, week-ends et événements à partir de ce prix ordinaire.
:::

:::action
titre: Calcule ton prix minimum et ton prix de base
texte: Renseigne-les dans Mes prix pour ton logement, ils serviront dans toute la formation.
lien: /dashboard/calculateurs#mes-prix
bouton: Ouvrir Mes prix
:::`,
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
          content: `:::bref
- La tarification intelligente d'Airbnb est gratuite mais moins précise et limitée à Airbnb.
- PriceLabs et Beyond analysent le marché local et gèrent plusieurs plateformes.
- Quel que soit l'outil, règle toujours ton prix minimum toi-même.
:::

## La tarification intelligente Airbnb : le point de départ gratuit
Airbnb propose un outil de tarification
dynamique intégré et gratuit.

CE QU'IL FAIT :
→ Ajuste tes prix selon la demande locale
→ Prend en compte la saisonnalité
→ Intègre certains événements locaux
→ Disponible directement dans ton tableau
  de bord Airbnb : Tarification → Prix intelligents

SES LIMITES :
→ Moins précis que les outils spécialisés
  sur les données hyper-locales
→ Peut descendre sous ton prix minimum
  si te ne le configure pas soigneusement
→ Ne gère qu'Airbnb (pas Booking, Driing...)
→ Moins de contrôle et de personnalisation

QUAND L'UTILISER :
→ Pour démarrer avec zéro budget outil
→ Pour 1 logement sur Airbnb uniquement
→ Toujours avec un prix minimum configuré

→ Active-le en définissant :
  Prix minimum (non négociable)
  Prix maximum (optionnel)
  → Et laisse l'algorithme faire le reste.

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
  (ce que font tes concurrents)

CE QU'ON EN ATTEND :
→ un prix qui suit la demande ;
  le gain varie selon ton marché
  et ton point de départ

PRIX : à partir de 19,99$/mois par logement

ROI : pour un logement à 15 000€/an,
+15% = +2 250€/an
L'outil est rentabilisé en < 2 semaines.

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
  Teste les deux (essais gratuits disponibles)
  et garde celui que tu maîtrises le mieux.
  La meilleure stratégie bien exécutée
  vaut plus que la stratégie parfaite mal appliquée.

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
  2+ logements ou tu veux optimiser → Pricelabs
  Conciergerie ou tu cherches la simplicité → Beyond


## Exercice
**Exercice pratique :** Si tu n'as pas encore activé de tarification dynamique : active la tarification intelligente Airbnb aujourd'hui avec ton prix minimum configuré. C'est gratuit et ça améliore déjà les revenus. Si tu veux aller plus loin : inscris-toi à l'essai gratuit de Pricelabs (hello.pricelabs.co) cette semaine.

:::quiz
? Quelle est la principale limite de la tarification intelligente d'Airbnb ?
- Elle est payante
- Elle ne change jamais les prix
* Elle ne gère qu'Airbnb et peut descendre très bas sans prix minimum
= Gratuite et pratique pour démarrer, elle reste moins fine et ne pilote pas Booking ni le direct.
:::

:::quiz
? Quand un outil spécialisé devient-il intéressant ?
- Dès la première nuit, pour tout le monde
- Seulement pour les chambres d'hôtes
* Avec plusieurs logements ou plusieurs plateformes
= Son coût par logement se justifie quand le gain dépasse l'abonnement.
:::`,
        },
        {
          id: 12,
          title: 'Configurer son outil en 5 étapes',
          duration: '13 min',
          content: `:::bref
- Connecte un seul outil de prix par plateforme pour éviter les conflits.
- Règle d'abord prix minimum et prix de base, puis les saisons.
- Ajoute les événements locaux et vérifie les résultats chaque semaine au début.
:::

## ÉTAPE 1 : Connecter ses plateformes
La première étape : connecter ton outil
à toutes tes plateformes de réservation.

AVEC PRICELABS :
→ Tableau de bord → Ajouter un logement
→ Choisir la connexion : Airbnb, Booking,
  Abritel ou via ton PMS (channel manager)
→ Autoriser l'accès à ton compte

AVEC BEYOND :
→ Même procédure, interface plus guidée

POINT CRITIQUE :
→ Ne connecte PAS Booking directement
  à deux outils différents en même temps.
→ Choisis un seul outil de pricing
  par plateforme pour éviter les conflits.

→ Si tu es sur Airbnb et Booking :
  connecte les deux à Pricelabs
  (ou les deux à Beyond).
  Pas Pricelabs pour l'un et Beyond pour l'autre.

## ÉTAPE 2 : Définir les paramètres de base
Dès la connexion, configure absolument :

PRIX MINIMUM (non négociable)
→ Le chiffre que tu as calculé
  dans la leçon précédente.
→ L'outil ne descendra jamais en dessous.
→ Vérifie-le soigneusement, certains outils
  proposent un minimum par défaut trop bas.

PRIX DE BASE
→ Ton tarif "neutre" pour une nuit ordinaire.
→ L'outil construit sa tarification
  autour de ce chiffre.

PRIX MAXIMUM (optionnel mais recommandé)
→ Evite que l'outil monte trop haut
  lors d'un événement et que tu
  rates la réservation.
→ Fixe-le à 3-4x ton prix de base.

SÉJOUR MINIMUM PAR DÉFAUT
→ 1-2 nuits par défaut.
→ Tu affineras par période ensuite.

## ÉTAPE 3 : Configurer les règles saisonnières
C'est là que ta stratégie se construit.

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
  saisonnier où tu définis ces règles
  une seule fois, elles s'appliquent automatiquement.

## ÉTAPES 4 ET 5 : Événements locaux et suivi
ÉTAPE 4, LES ÉVÉNEMENTS LOCAUX

→ Pricelabs et Beyond intègrent une base
  de données d'événements locaux
  (concerts, salons, matchs, festivals...).
→ Ils ajustent automatiquement les prix
  lors de ces événements.
→ Mais complète manuellement avec
  les événements très locaux que l'outil
  ne connaît pas (marché local, événement
  municipal, festival de niche...).

Comment ajouter un événement manuellement :
→ Va sur le calendrier de l'outil
→ Sélectionne les dates
→ Applique une majoration manuelle
  (+30 à +100% selon l'événement)
→ L'outil maintient cette majoration
  en plus de sa tarification dynamique

ÉTAPE 5, SUIVI ET AJUSTEMENTS
→ Ne configure pas et n'oublie pas.
→ Regarde les résultats chaque semaine
  les 2 premiers mois.
→ Ajuste le prix de base si le taux
  d'occupation est trop bas ou trop haut.


## Exercice
**Exercice pratique :** Si tu utilises déjà Pricelabs ou Beyond : vérifie que ton prix minimum est bien configuré et correct. Si tu démarres : configure le prix minimum ET le prix de base cette semaine. C'est la configuration minimale qui protège ta rentabilité dès le premier jour d'utilisation.

:::quiz
? Tu es sur Airbnb et Booking. Comment connecter tes outils de prix ?
- Un outil différent par plateforme
- Les deux outils sur les deux plateformes
* Les deux plateformes au même outil
= Deux outils qui modifient les mêmes prix se contredisent et créent des erreurs.
:::

:::quiz
? Quel réglage faire dès la connexion de l'outil ?
* Le prix minimum
- La photo de couverture
- La politique d'annulation la plus stricte
= Sans plancher, l'outil peut proposer des nuits qui ne couvrent pas tes coûts.
:::

:::action
titre: Règle tes saisons pour ton logement
texte: Indique tes pourcentages de basse et de haute saison dans Mes prix, puis reporte-les dans ton outil.
lien: /dashboard/calculateurs#mes-prix
bouton: Régler mes saisons
:::`,
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
          content: `:::bref
- La durée minimale de séjour se règle par période, pas une fois pour toute l'année.
- Plusieurs nuits minimum en haute saison réduisent les ménages et augmentent le revenu par séjour.
- Une nuit orpheline entre deux réservations doit rester réservable.
:::

## Pourquoi la durée minimale impacte tes revenus
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
  Adapte-le à chaque période.

## Les nuits orphelines : le problème et la solution
UNE NUIT ORPHELINE, c'est quoi ?

→ Tu as une réservation du lundi au jeudi
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
→ Active-la. C'est gratuit en plus
  de ton abonnement et récupère
  des revenus que tu perds sans le savoir.

## Règles recommandées par période
HAUTE SAISON (juillet-août, grandes vacances)
→ Minimum 3-5 nuits les weekends
→ Minimum 7 nuits si tu es
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
  si tu actives les règles last-minute


## Exercice
**Exercice pratique :** Regarde ton calendrier des 3 prochains mois. Identifie les nuits orphelines actuelles, des nuits vides entre deux réservations. Si ton outil de pricing ne les gère pas automatiquement, configure dès maintenant un minimum de 1 nuit pour ces dates spécifiques. Chaque nuit orpheline récupérée = revenu pur.

:::quiz
? Une nuit libre est coincée entre deux réservations, avec 3 nuits minimum. Que faire ?
- Laisser la nuit vide
- Passer à 5 nuits minimum
* Autoriser une nuit pour cette date précise
= Sinon personne ne peut la réserver : la règle des nuits orphelines la rend vendable.
:::

:::quiz
? Quel séjour minimum en basse saison ?
- 7 nuits
- Le même qu'en haute saison
* 1 nuit, pour capter les voyageurs de dernière minute
= En période calme, la souplesse remplit les trous du calendrier.
:::`,
        },
        {
          id: 22,
          title: 'Événements et saisonnalité : ne jamais rater un pic de demande',
          duration: '12 min',
          content: `:::bref
- Certains événements multiplient la demande dans ta zone.
- Salons, congrès, festivals, matchs, remises de diplômes : repère-les des mois à l'avance.
- Majore dès que tu connais la date et impose plusieurs nuits minimum.
:::

## Les événements qui multiplient la demande
Certains événements peuvent multiplier
la demande par 3 à 10 dans ta zone.

Un hôte qui ne les connaît pas
loue au prix normal.
Un hôte qui les anticipe triple ses revenus.

TYPES D'ÉVÉNEMENTS À SUIVRE :

ÉVÉNEMENTS PROFESSIONNELS
→ Salons et foires (VivaTech, SIMA, Vinexpo...)
→ Congrès médicaux ou scientifiques
→ Formations d'entreprises
→ Source : viparis.com, eurexpo.com,
  parc-des-expositions de ta ville

ÉVÉNEMENTS CULTURELS ET SPORTIFS
→ Festivals, concerts, matchs de championnat
→ Marchés spéciaux (Noël, braderies...)
→ Événements locaux récurrents

ÉVÉNEMENTS INSTITUTIONNELS
→ Remises de diplômes des grandes écoles
→ Portes ouvertes d'universités
→ Élections avec équipes politiques

## Comment anticiper les événements locaux
MÉTHODE SIMPLE : le calendrier annuel

En début de chaque année (janvier) :
→ Cherche sur Google tous les événements
  de ta ville pour l'année
→ Vérifie le site de ta mairie,
  office de tourisme local,
  centre des congrès
→ Note les 10-15 dates les plus impactantes

Puis dans ton outil de pricing :
→ Bloque ces dates dans ton calendrier
  (ne les vends pas à l'avance au prix normal)
→ Configure des majorations manuelles
  (+30% à +100% selon l'importance)

RÈGLE D'OR :
→ Pour les événements majeurs :
  ne pas ouvrir les réservations trop tôt.
  Attends 30-45 jours avant l'événement
  pour bénéficier de la prime de dernière minute.

→ Pour les événements modérés :
  ouvre normalement mais avec une majoration.

## Lire les données de marché de ton outil
Pricelabs et Beyond donnent accès
à des données précieuses sur ton marché.

CE QUE VOUS POUVEZ VOIR :

→ Le taux d'occupation moyen
  de ta zone pour chaque mois
  → Identifie les mois où la concurrence
    se remplit bien (tu es peut-être trop bas)
  → Identifie les mois où tout le monde galère
    (baisse avant les autres)

→ Le prix moyen de tes concurrents
  par période
  → Positionne-toi par rapport à eux

→ Les événements locaux détectés
  par l'algorithme
  → Valide et ajoute ceux qu'il ne connaît pas

→ Regarde ces données une fois par mois.
  Ce n'est pas de la surveillance obsessionnelle,
  c'est de la stratégie.


## Exercice
**Exercice pratique :** Cette semaine : cherche sur Google les 5 événements les plus importants de ta ville pour les 3 prochains mois. Pour chacun : configure une majoration manuelle dans ton outil de pricing (ou dans ton calendrier Airbnb si tu n'as pas encore d'outil). Ne laisse plus jamais passer un pic de demande au prix normal.

:::quiz
? Où repérer les salons professionnels de ta ville ?
* Sur le site du parc des expositions ou du palais des congrès
- Dans les avis Airbnb
- Sur ton relevé bancaire
= Les calendriers officiels des lieux d'événements sont publiés longtemps à l'avance.
:::

:::quiz
? Quand majorer une date d'événement ?
- La veille
- Jamais, pour rester compétitif
* Dès que tu la connais
= Les premières réservations partent vite : si ton prix n'a pas bougé, elles partent au prix normal.
:::`,
        },
        {
          id: 23,
          title: 'Les remises intelligentes : early booking et last-minute',
          duration: '11 min',
          content: `:::bref
- Une remise pour réservation anticipée sécurise ton calendrier tôt.
- Une remise de dernière minute évite les nuits vides.
- Aucune remise ne doit passer sous ton prix minimum.
:::

## La remise early booking : inciter à réserver tôt
Une réservation confirmée 60 jours à l'avance
te donne de la visibilité et de la sécurité.

LOGIQUE DE L'EARLY BOOKING :
→ Tu offres -5 à -10% pour une
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

## La remise last-minute : ne pas laisser de nuits vides
La pire situation en LCD :
une nuit vide la veille pour demain.

C'est 0€ encaissé alors que 75€
auraient été mieux que rien.

LOGIQUE DU LAST-MINUTE :
→ Si une date n'est pas réservée à J-3,
  baisse automatiquement le prix
  pour la remplir.
→ 75€ encaissés > 0€ non encaissés.
→ C'est de la marge pure si tes charges fixes
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

Attention : toujours avec ton prix minimum
comme plancher. La remise last-minute
ne doit jamais tomber sous ce seuil.

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
→ Active cette règle dans ton outil.
  C'est du revenu récupéré automatiquement.


## Exercice
**Exercice pratique :** Configure maintenant les remises last-minute dans ton outil (ou dans les Promotions Airbnb si tu n'as pas encore de Pricelabs/Beyond). Utilise les taux de la slide 3 : -5% à J-7, -10% à J-3, -15% à J-1. Garde ton prix minimum comme plancher absolu. Ces règles tournent seules et récupèrent des revenus que tu perds actuellement.

:::quiz
? Pourquoi offrir une remise de 5 à 10 % pour une réservation 60 jours à l'avance ?
- Parce que c'est obligatoire
* Pour sécuriser des revenus et mieux planifier
- Pour attirer uniquement des voyageurs d'une nuit
= Tu échanges un petit rabais contre de la visibilité et de la sécurité.
:::

:::quiz
? Quelle est la limite d'une remise de dernière minute ?
- Aucune limite
* Ton prix minimum
- Le prix des voisins
= Une nuit vendue sous ton plancher te coûte de l'argent.
:::

:::action
titre: Note les événements des 3 prochains mois
texte: Repère-les dans ton calendrier et bloque ou majore ces dates dès maintenant.
lien: /dashboard/calendrier
bouton: Ouvrir mon calendrier
:::`,
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
          content: `:::bref
- Quinze minutes par mois suffisent : occupation, prix moyen, revenu par nuit disponible, délai de réservation.
- Occupation sous 60 % deux mois de suite : baisse ton prix de base de 10 %.
- Au-dessus de 85 % deux mois de suite : monte-le de 10 à 15 %.
:::

## Les 4 chiffres du tableau de bord mensuel
Une fois par mois, 15 minutes suffisent
pour évaluer ta stratégie tarifaire.

CHIFFRE 1, TAUX D'OCCUPATION
Cible : 65-75% annuel
→ Si < 60% 2 mois de suite :
  baisse le prix de base de 10%
→ Si > 85% 2 mois de suite :
  monte le prix de base de 10-15%

CHIFFRE 2, ADR (revenu moyen par nuit louée)
→ En hausse = tu vends mieux
→ En baisse alors que l'occupation monte :
  tu brades trop

CHIFFRE 3, REVPAN
→ Le plus important : doit toujours croître
→ Si stable ou en baisse malgré
  un bon taux d'occupation :
  tes prix sont trop bas

CHIFFRE 4, FENÊTRE DE RÉSERVATION MOYENNE
→ Combien de jours à l'avance tes voyageurs
  réservent-ils en moyenne ?
→ Si elle raccourcit : marché qui réserve
  de plus en plus tard → ajuste tes
  remises last-minute

## Quand ajuster son prix de base
Le prix de base doit être ajusté
en fonction des signaux du marché.

AJUSTER À LA HAUSSE si :
→ Taux d'occupation > 80% sur 2 mois
→ Tu as des réservations last-minute
  au prix plein régulièrement
→ Tes concurrents affichent des prix
  significativement plus élevés que toi
  pour des logements similaires

AJUSTER À LA BAISSE si :
→ Taux d'occupation < 55% sur 2 mois
→ Tes dates non réservées à J-14
  ne bougent pas malgré les remises
→ Ta concurrence affiche des prix
  significativement plus bas

RÈGLE PRATIQUE :
→ Ajuste de 5 à 10% à la fois.
→ Attends 4 semaines pour mesurer l'impact.
→ Ne change pas plusieurs paramètres
  en même temps (impossible de savoir
  ce qui a fonctionné).

## Les outils de benchmarking concurrentiel
Pour savoir si ta stratégie est juste,
tu as besoin de te comparer
à tes concurrents.

PRICELABS MARKET DASHBOARD
→ Voir les taux d'occupation moyens
  de ta zone par mois
→ Voir les ADR moyens de tes concurrents
→ Comparer ta performance au marché

AIRDNA (outil complémentaire)
→ Données de marché détaillées
→ Estimation de revenus potentiels
  pour n'importe quel logement en France
→ Utile pour benchmarker ta performance

MÉTHODE MANUELLE (gratuite)
→ Cherche tes 5 concurrents directs
  sur Airbnb
→ Regarde leurs disponibilités et prix
  pour le mois prochain
→ Si la plupart sont complets et tu es vide :
  ton prix est trop élevé
→ Si la plupart ont des disponibilités :
  c'est la norme de ton marché


## Exercice
**Exercice pratique :** Crée maintenant dans ton Google Sheet de pilotage (formation Automatisation) un onglet "Tarification" avec 4 colonnes : Mois | Taux occupation | ADR | RevPAN. Remplis-le avec les 3 derniers mois. Ce tableau simple, mis à jour chaque mois en 5 minutes, te donne tout ce qu'il faut pour piloter ta stratégie.

:::quiz
? Ton occupation dépasse 85 % deux mois de suite. Que faire ?
* Monter ton prix de base de 10 à 15 %
- Le baisser de 10 %
- Ne rien changer
= Un calendrier toujours plein montre que ton prix est sous ce que les voyageurs acceptent.
:::

:::quiz
? Ton prix moyen baisse alors que l'occupation monte. Qu'est-ce que ça signifie ?
- Ton annonce est cachée
* Tu brades trop
- Tu vends parfaitement
= Plus de nuits mais moins chères : le revenu par nuit disponible stagne ou baisse.
:::`,
        },
        {
          id: 32,
          title: 'Les erreurs de tarification les plus fréquentes',
          duration: '12 min',
          content: `:::bref
- Erreur numéro un : activer un outil sans prix minimum.
- Un outil ne se laisse pas tourner sans contrôle.
- Copier les prix des concurrents sans stratégie mène à travailler à perte.
:::

## Erreur 1 : Ne pas configurer de prix minimum
C'est l'erreur la plus dangereuse
et la plus fréquente.

Ce qui se passe sans prix minimum :
→ L'outil descend très bas en basse saison
  pour "remplir"
→ Tu loues à un prix qui ne couvre même
  pas tes charges variables (ménage, etc.)
→ Tu paies pour avoir des voyageurs

Ça semble impossible ?
→ Une hôte à Nice a eu une réservation
  à 28€/nuit proposée par l'outil
  sans prix minimum configuré.
  Son ménage seul coûtait 50€.

RÈGLE ABSOLUE :
→ Configure ton prix minimum
  AVANT d'activer tout outil de pricing.
→ Vérifie-le chaque mois.
→ Il doit toujours couvrir :
  charges fixes ramenées à la nuit
  + coûts variables du séjour
  + marge minimale.

## Erreur 2 : Laisser tourner l'outil sans le regarder
Un outil de tarification dynamique
n'est pas du "set and forget" complet.

Il optimise selon les données du marché.
Mais il ne connaît pas :
→ Tes contraintes personnelles
  (disponibilités, travaux prévus)
→ Les événements hyper-locaux
  que sa base de données ne référence pas
→ Tes changements d'équipements ou de déco
  (qui justifient un prix plus élevé)
→ Les décisions de tes concurrents
  qui changent brusquement de stratégie

La bonne fréquence de vérification :
→ Semaines 1-4 après lancement : chaque jour
  (pour comprendre comment l'outil se comporte)
→ Mois 2-3 : 2 fois par semaine
→ Ensuite : 1 fois par semaine suffit
  + révision mensuelle des paramètres

## Erreur 3 : Copier les prix des concurrents sans stratégie
Une erreur fréquente chez les débutants :
"Mon voisin est à 90€, je mets 85€."

Pourquoi c'est problématique :
→ Tu ne connais pas sa structure
  de charges (il peut se permettre 85€,
  pas forcément toi)
→ Tu ne connais pas sa qualité
  (si son logement est moins bien que le vôtre,
   tu es trop bas)
→ Si tout le monde fait pareil,
  le marché entier se tire vers le bas

La bonne approche :
→ Regarde les prix des concurrents
  comme RÉFÉRENCE de marché,
  pas comme cible à battre systématiquement.
→ Si ton logement est meilleur (note > 4,8,
  équipements premium, photos professionnelles) :
  tu as le droit d'être 10-20% plus cher.
→ Si ton logement est équivalent :
  aligne-toi.
→ Si ton logement est moins bon :
  compense par le prix jusqu'à amélioration.


## Exercice
**Exercice pratique :** Vérification rapide : ouvre ton outil de pricing ou ton tableau de bord Airbnb. Est-ce que tu as un prix minimum configuré ? Est-il au bon niveau (charges + ménage + marge) ? Si ce n'est pas le cas ou si tu n'es pas sûr : recalcule-le avec la formule de la leçon 1.2 et mets-le à jour maintenant.

:::quiz
? Un outil propose 28 € la nuit alors que ton ménage coûte 50 €. Quelle erreur a été faite ?
- L'outil est en panne
* Aucun prix minimum n'était réglé
- Le ménage est trop cher
= Sans plancher, l'outil descend pour remplir, même sous tes coûts.
:::

:::quiz
? À quelle fréquence vérifier ton outil de prix ?
- Jamais, il est automatique
- Une fois par an
* Régulièrement, au moins une fois par mois
= Un outil amplifie ta stratégie : un mauvais réglage se répète tous les jours.
:::`,
        },
        {
          id: 33,
          title: `Le récapitulatif et le plan d'action`,
          duration: '11 min',
          content: `:::bref
- Quatre semaines : fondations, configuration, stratégie avancée, suivi.
- Commence par le prix minimum et le prix de base, finis par le suivi mensuel.
- Mesure ton revenu par nuit disponible avant et après.
:::

## Le plan sur 4 semaines
SEMAINE 1, LES FONDATIONS
□ Calculer son prix minimum
□ Identifier son prix de base
  (benchmarking 5 concurrents)
□ Activer la tarification intelligente Airbnb
   OU s'inscrire à l'essai Pricelabs/Beyond

SEMAINE 2, CONFIGURATION
□ Connecter ses plateformes à l'outil
□ Configurer prix minimum + prix de base
□ Activer les remises last-minute
□ Activer la règle des nuits orphelines

SEMAINE 3, STRATÉGIE AVANCÉE
□ Identifier les 5 événements locaux
  des 3 prochains mois
□ Configurer les majorations manuelles
□ Mettre en place les règles saisonnières
  (durée minimum par période)

SEMAINE 4, SUIVI
□ Créer l'onglet "Tarification" dans
  le Google Sheet de pilotage
□ Comparer les métriques avant/après
  les 2 premières semaines
□ Premier ajustement du prix de base
  si nécessaire

## Ce que tu peux attendre comme résultats
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

→ Tu loues plus cher en haute demande
  ET tu remplis mieux en basse demande
 , simultanément.

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
  Commence, mesure, ajuste.



## Exercice
**L'action finale de la formation :**

Une seule action aujourd'hui : calcule ton prix minimum exact avec la formule du module 1. C'est le chiffre le plus important de toute cette formation. Configure-le dans ton outil de pricing, ou dans les paramètres Airbnb si tu n'as pas encore d'outil spécialisé.

Tout le reste peut attendre demain.
Ce chiffre, non.

Formation 2

:::quiz
? Par quoi commence le plan de 4 semaines ?
- Changer toutes tes photos
* Calculer ton prix minimum et ton prix de base
- Acheter l'outil le plus cher
= Tout le reste s'appuie sur ces deux chiffres.
:::

:::quiz
? Comment savoir si ta nouvelle stratégie fonctionne ?
- Compter tes abonnés Instagram
- Regarder uniquement ton taux d'occupation
* Comparer ton revenu par nuit disponible avant et après, à saison égale
= L'occupation seule peut monter en bradant ; le revenu par nuit disponible dit si tu gagnes plus.
:::

:::action
titre: Relève ton revenu par nuit disponible
texte: Note-le aujourd'hui dans Performances : tu le compareras dans 3 mois.
lien: /dashboard/performances
bouton: Voir mes performances
:::`,
        },
      ],
    },
  ],
}
