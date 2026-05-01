export const ANNONCE_DIRECTE_FORMATION = {
  slug: 'annonce-directe',
  title: 'Annonce Directe',
  description: 'Génère des réservations directes sans commission. Construis ton canal direct de A à Z, site, trafic qualifié, conversion et fidélisation, pour ne plus jamais dépendre d\'Airbnb.',
  duration: '4h30',
  level: 'Débutant',
  objectifs: [
    'Comprendre pourquoi réduire ta dépendance à Airbnb est urgent',
    'Créer une offre différenciante qui justifie de réserver en direct',
    'Construire un site de réservation directe qui convertit',
    'Attirer du trafic qualifié via SEO local, Google et les réseaux sociaux',
    'Convertir les visiteurs avec des pages d\'annonce optimisées',
    'Fidéliser tes voyageurs pour des réservations récurrentes sans commission',
  ],
  modules: [
    {
      id: 1,
      title: 'Pourquoi la réservation directe change tout',
      duration: '30 min',
      lessons: [
        {
          id: 1,
          title: 'La dépendance à Airbnb : un risque que tu ne peux plus ignorer',
          duration: '15 min',
          content: `## La réalité que personne ne veut voir

En 2025, 73% des hôtes LCD génèrent 100% de leurs revenus via Airbnb ou Booking. C'est pratique. C'est dangereux.

Une modification d'algorithme, une suspension de compte, une augmentation des commissions, et ton chiffre d'affaires s'effondre du jour au lendemain. Ça arrive. Ça arrive souvent.

### Les risques réels de la dépendance

**Suspension de compte**

Airbnb peut suspendre un compte pour des motifs flous, un avis litigieux, une politique mal interprétée, une signalisation abusive. Des hôtes avec des années d'historique et des centaines d'avis 5 étoiles ont tout perdu du jour au lendemain.

**Commissions en hausse**

Airbnb a augmenté ses commissions plusieurs fois depuis 2020. Chaque augmentation réduit directement ta marge. Tu n'as aucun levier de négociation.

**Dépendance algorithmique**

Ton classement dans les résultats Airbnb dépend d'un algorithme opaque. Un changement d'algorithme peut diviser ton trafic par deux sans aucun avertissement.

### La solution : construire un canal parallèle

Les hôtes qui résistent aux crises ont tous un point commun : ils ont construit un canal de réservation directe. Pas pour remplacer Airbnb, pour ne plus en dépendre.

Dans cette formation, on construit ce canal ensemble. De zéro. Avec des outils accessibles, des coûts maîtrisés, et une méthode testée sur des dizaines d'hôtes.

Chaque module est actionnable dès la première heure. Tu n'as pas besoin d'un budget marketing, d'une agence ou d'un développeur. Tu as besoin d'une méthode.`,
        },
        {
          id: 2,
          title: 'Le modèle direct : combien ça rapporte vraiment (calcul commission)',
          duration: '15 min',
          content: `## Les vrais chiffres de la réservation directe

Calculons concrètement ce que représente la commission Airbnb sur ton activité annuelle, et ce que tu gagnerais en passant 30% de tes réservations en direct.

### La commission réelle : plus que tu ne crois

Airbnb prélève **3% côté hôte** + une part variable côté voyageur (typiquement 14-16% du montant de la réservation). Mais ce n'est que la partie visible.

**Pour 100 nuits à 120€/nuit :**
- Revenus bruts : 12 000€
- Commission hôte (3%) : -360€
- Frais de paiement inclus dans les 3% : compris
- **Net hôte Airbnb : 11 640€**

**Pour les mêmes 100 nuits en direct :**
- Revenus bruts : 12 000€
- Frais de paiement Stripe (~2%) : -240€
- Frais channel manager (si applicable) : ~-120€
- **Net hôte direct : 11 640€**

À surface égale, l'avantage n'est pas sur les 3% côté hôte. Il est sur **le prix affiché** : en direct, tu peux afficher le même prix qu'Airbnb et augmenter ta marge, ou afficher moins cher et convertir mieux.`,
        },
      ],
    },
    {
      id: 2,
      title: 'Créer une offre irrésistible',
      duration: '45 min',
      lessons: [
        {
          id: 3,
          title: 'Définir ton avantage direct : ce que tu peux offrir qu\'Airbnb ne peut pas',
          duration: '25 min',
          content: `## Pourquoi un voyageur réserverait en direct ?

La question centrale de cette leçon. Si tu n'as pas de réponse claire, personne ne réservera en direct.

### Les leviers de différenciation directe

**1. Le prix**, La réduction de commission que tu ne verses pas à Airbnb te permet d'offrir un tarif légèrement inférieur tout en gardant la même marge. -5% à -10% suffit à déclencher la décision.

**2. Les extras**, Ce qu'Airbnb ne peut pas offrir : accueil personnalisé, cadeau de bienvenue, service de conciergerie, transfert aéroport, late check-out garanti.

**3. La flexibilité**, Politique d'annulation plus souple, acompte réduit, possibilité de modifier les dates. Airbnb impose ses règles. Toi, tu choisis.

**4. La relation directe**, Certains voyageurs préfèrent parler à un humain. Une adresse email et un numéro de téléphone rassurent plus qu'un chat Airbnb.`,
        },
        {
          id: 4,
          title: 'Construire une offre de bienvenue qui déclenche la réservation directe',
          duration: '20 min',
          content: `## L'offre de bienvenue : ton premier outil de conversion directe

Une offre de bienvenue bien construite peut multiplier par 3 ton taux de conversion direct.

### Structure d'une offre efficace

**Le timing** : l'offre doit être présentée au bon moment, après un premier séjour, lors d'une demande de disponibilité, ou via un QR code dans le logement.

**Le contenu** : simple, clair, immédiatement compréhensible. "Réservez directement et profitez de -10% + late check-out offert."

**L'urgence** : une date d'expiration douce, "offre valable pour les réservations avant le [date]", augmente le taux de conversion sans créer de friction.`,
        },
      ],
    },
    {
      id: 3,
      title: 'Construire ta présence en ligne',
      duration: '1h',
      lessons: [
        {
          id: 5,
          title: 'Choisir la bonne solution de site de réservation directe',
          duration: '20 min',
          content: `## Les options pour ton site de réservation directe

Il n'existe pas une seule solution, la bonne dépend de ton volume, ton budget et tes compétences techniques.

### Les 4 catégories de solutions

**1. Channel managers avec site intégré** (Lodgify, Hostaway, Smoobu)
- Prix : 15-50€/mois
- Avantages : synchronisation automatique avec Airbnb/Booking, moteur de réservation intégré, Google Vacation Rentals
- Idéal pour : hôtes avec 2+ logements

**2. WordPress + plugin de réservation** (MotoPress, WP Rentals)
- Prix : 50-200€ (achat unique) + hébergement
- Avantages : contrôle total, pas d'abonnement
- Idéal pour : profils techniques, long terme

**3. Constructeurs de sites** (Squarespace, Wix + Checkfront)
- Prix : 20-40€/mois
- Avantages : facile à créer et maintenir
- Idéal pour : débutants, un seul logement

**4. Page de réservation simple** (Superhote, Guesties)
- Prix : inclus dans certains channel managers
- Avantages : démarrage rapide, 0 compétences techniques
- Idéal pour : tester avant d'investir`,
        },
        {
          id: 6,
          title: 'Créer des pages qui convertissent : structure, textes, photos',
          duration: '25 min',
          content: `## La page de réservation directe parfaite

Une page de réservation directe efficace suit une structure précise. Voici les éléments indispensables.

### Les 7 blocs d'une page qui convertit

1. **Hero** : photo principale + titre de l'hébergement + localisation
2. **Galerie** : 8-12 photos dans l'ordre stratégique (salon, cuisine, chambre, extérieur, détails)
3. **Pitch** : 3-4 phrases qui vendent l'expérience, pas les équipements
4. **Équipements** : liste claire et exhaustive avec icônes
5. **Disponibilités et tarifs** : moteur de réservation visible sans scroll
6. **Preuves sociales** : avis importés depuis Airbnb ou Google
7. **FAQ** : 5-7 questions fréquentes qui lèvent les objections`,
        },
        {
          id: 7,
          title: 'Configurer ton système de réservation et de paiement direct',
          duration: '15 min',
          content: `## Paiements directs : Stripe, PayPal et les alternatives

Le système de paiement est le point de friction n°1 de la réservation directe. Un mauvais setup = abandons garantis.

### Stripe : la référence pour les hôtes

Stripe est la solution la plus utilisée par les hôtes en réservation directe. Commission : 1,5% + 0,25€ pour les cartes européennes (2,9% + 0,30€ pour les cartes US).

**Ce qu'il faut configurer :**
- Compte Stripe Verified (KYC complet)
- Politique de remboursement claire
- Acompte à la réservation (30-50% recommandé)
- Solde automatique 2-7 jours avant l'arrivée
- Caution par empreinte bancaire (Stripe Cards)`,
        },
      ],
    },
    {
      id: 4,
      title: 'Attirer du trafic qualifié',
      duration: '45 min',
      lessons: [
        {
          id: 8,
          title: 'SEO local : apparaître sur Google quand les voyageurs cherchent',
          duration: '15 min',
          content: `## Le SEO local pour les hébergements LCD

Le SEO local est le canal d'acquisition le plus rentable pour un hôte LCD, trafic gratuit, intent élevé, concurrence faible hors des grandes villes.

### Les 3 pages SEO indispensables

**Page principale** : "Location [type] [ville]", ex. "Location appartement Bordeaux centre"
**Pages de quartier** : "Location [ville] [quartier]", ex. "Location appartement Bordeaux Saint-Pierre"
**Pages saisonnières** : "Location [ville] [événement]", ex. "Location Bordeaux Vinexpo 2025"

### Les éléments SEO à optimiser

- Balise H1 avec mot-clé principal
- Meta description avec avantage direct + CTA
- Données structurées Schema.org (LodgingBusiness)
- Vitesse de chargement < 2 secondes
- Version mobile impeccable`,
        },
        {
          id: 9,
          title: 'Google Vacation Rentals et Google Business Profile : la stratégie complète',
          duration: '15 min',
          content: `## Google comme canal d'acquisition direct

Google Vacation Rentals et Google Business Profile sont les deux outils Google les plus puissants pour générer des réservations directes.

Voir la formation dédiée "Google My Business pour la LCD" pour le détail complet de chaque outil.

### L'essentiel à retenir

**Google Vacation Rentals** : connecter ton channel manager (Lodgify, Hostaway, Smoobu) pour afficher tes disponibilités directement dans Google Search, Maps et Travel. 0% de commission Google, tu paies seulement ton channel manager.

**Google Business Profile** : pour les conciergeries et gîtes avec accueil physique. Fiche d'établissement + avis + posts réguliers = visibilité locale maximale.`,
        },
        {
          id: 10,
          title: 'Réseaux sociaux et communautés locales : générer du trafic organique',
          duration: '15 min',
          content: `## Les canaux organiques sous-exploités

Les réseaux sociaux ne sont pas le canal principal de réservation directe, mais ils sont excellents pour construire une audience et générer du trafic de manière régulière.

### Les 3 canaux qui fonctionnent pour la LCD

**Instagram** : avant/après, coulisses, expériences voyageurs. Format Reels = portée organique maximale. Lien en bio vers ton site de réservation.

**Groupes Facebook locaux** : "Voyageurs à [ville]", "Expats [ville]", groupes d'entreprises locales. Présence utile, pas commerciale.

**Partenariats locaux** : office de tourisme, restaurants, activités locales. Un lien depuis leur site = trafic qualifié + SEO.`,
        },
      ],
    },
    {
      id: 5,
      title: 'Convertir les visiteurs en réservations',
      duration: '45 min',
      lessons: [
        {
          id: 11,
          title: 'Les freins à la réservation directe et comment les lever',
          duration: '20 min',
          content: `## Pourquoi les visiteurs ne réservent pas en direct

Même avec un beau site et un bon prix, certains visiteurs n'osent pas réserver en direct. Comprendre leurs freins permet de les lever avant qu'ils quittent la page.

### Les 5 freins les plus courants

**1. La confiance**, "Je ne connais pas ce site." → Afficher les avis Airbnb/Google sur ta page, ton identité complète, tes coordonnées.

**2. La sécurité du paiement**, "Est-ce que mon paiement est protégé ?" → Logo Stripe/PayPal visible, mentions légales claires, politique d'annulation explicite.

**3. La garantie**, "Qu'est-ce qui se passe si le logement ne correspond pas ?" → Politique de remboursement claire, photos honnêtes.

**4. La comparaison de prix**, "Est-ce vraiment moins cher ?" → Afficher explicitement la différence avec Airbnb (+frais de service).

**5. L'habitude**, "Je réserve toujours sur Airbnb." → Offre exclusive direct + avantages concrets pour briser l'habitude.`,
        },
        {
          id: 12,
          title: 'Relances, offres et séquences email pour convertir les indécis',
          duration: '25 min',
          content: `## La séquence email de conversion directe

Un visiteur qui n'a pas réservé n'est pas perdu. Une séquence email bien conçue peut convertir 15-25% des prospects indécis.

### La séquence en 3 emails

**Email 1, J+1** : "Vous avez visité notre hébergement"
- Rappel du logement + photos
- Offre directe exclusive (-10% code promo)
- Lien de réservation direct

**Email 2, J+4** : "Quelques questions ?"
- Invitation à poser des questions
- Mise en avant de la disponibilité limitée
- Témoignages de voyageurs précédents

**Email 3, J+10** : "Dernière chance"
- Expiration de l'offre dans 48h
- Social proof (X réservations cette semaine)
- CTA fort`,
        },
      ],
    },
    {
      id: 6,
      title: 'Fidéliser et automatiser',
      duration: '45 min',
      lessons: [
        {
          id: 13,
          title: 'Construire une base de voyageurs fidèles avec l\'email marketing',
          duration: '20 min',
          content: `## Ta liste email : ton actif le plus précieux

Une liste email de 500 voyageurs satisfaits vaut plus que 5 000 abonnés Instagram. Ces personnes te connaissent, ont séjourné chez toi, et sont prêtes à revenir.

### Construire ta liste dès le premier séjour

**Pendant le séjour** : QR code dans le logement vers une page d'inscription ("Recevez nos offres exclusives et disponibilités en avant-première").

**Après le check-out** : email de suivi avec invitation à s'inscrire.

**Via le channel manager** : certains outils (Lodgify, Hostaway) collectent automatiquement les emails avec consentement.

### La newsletter mensuelle idéale

- Disponibilités du mois suivant en avant-première
- Offre exclusive abonnés (-5% code unique)
- Un conseil ou recommandation locale
- Rappel de ton programme de parrainage`,
        },
        {
          id: 14,
          title: 'Automatiser les rappels, offres de retour et programmes de parrainage',
          duration: '25 min',
          content: `## L'automatisation : travailler moins pour vendre plus

Une fois en place, un système d'automatisation travaille pour toi 24h/24 sans intervention manuelle.

### Les 4 automatisations indispensables

**1. Email de bienvenue post-réservation**
Déclenché à la réservation : confirmation + infos pratiques + anticipation du séjour.

**2. Email de retour (J+30 post-séjour)**
"Vous nous avez manqué, voici une offre exclusive pour votre prochain séjour."

**3. Rappel anniversaire**
"Il y a un an, vous séjourniez chez nous, célébrons ça !"

**4. Programme de parrainage**
Email automatique J+7 post-séjour : "Recommandez-nous à un ami et recevez 50€ de réduction sur votre prochain séjour."

### Les outils recommandés

- **Mailchimp** (gratuit jusqu'à 500 contacts) : simple, efficace, intégrations faciles
- **Brevo (ex-Sendinblue)** : meilleure délivrabilité, prix compétitif
- **ActiveCampaign** : automatisations avancées pour les hôtes multi-logements`,
        },
      ],
    },
  ],
}
