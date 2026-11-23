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
          content: `:::bref
- Dépendre d'une seule plateforme expose à une suspension, une hausse de commission ou un changement d'algorithme.
- La réservation directe est un canal parallèle, pas un remplacement d'Airbnb.
- Même 20 à 30 % de réservations en direct réduisent fortement le risque.
:::

## La réalité que personne ne veut voir

Beaucoup d'hôtes LCD tirent la totalité de leurs revenus d'Airbnb ou de Booking. C'est pratique. C'est dangereux.

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

Chaque module est actionnable dès la première heure. Tu n'as pas besoin d'un budget marketing, d'une agence ou d'un développeur. Tu as besoin d'une méthode.

:::quiz
? Quel est le principal risque de tirer tous tes revenus d'une seule plateforme ?
- Avoir trop de réservations
* Perdre tes revenus du jour au lendemain si ton compte ou l'algorithme change
- Payer trop d'impôts
= Suspension de compte, hausse des commissions ou baisse de visibilité : tout dépend d'une décision que tu ne contrôles pas.
:::

:::quiz
? Quelle est la bonne stratégie face à cette dépendance ?
- Baisser tes prix sur Airbnb
* Construire un canal direct en parallèle des plateformes
- Quitter Airbnb du jour au lendemain
= Les plateformes restent utiles pour te faire connaître ; le direct sécurise et améliore ta marge.
:::`,
        },
        {
          id: 2,
          title: 'Le modèle direct : combien ça rapporte vraiment (calcul commission)',
          duration: '15 min',
          content: `:::bref
- Depuis le 13 octobre 2026, Airbnb prélève 15,5 % à l'hôte en Europe, soit 18,6 % avec la TVA sans numéro de TVA.
- En direct, tu ne paies que les frais de paiement, autour de 1,5 % par carte européenne.
- Passer une partie de tes nuits en direct augmente ton revenu net sans changer ton prix.
:::

## Les vrais chiffres de la réservation directe

Calculons concrètement ce que représente la commission Airbnb sur ton activité annuelle, et ce que tu gagnerais en passant 30% de tes réservations en direct.

### La commission réelle : plus que tu ne crois

Depuis le 13 octobre 2026, en Europe, Airbnb prélève une **commission unique de 15,5 % côté hôte**, soit **18,6 % avec la TVA** sur cette commission. Le voyageur ne paie plus de frais de service en plus.

**Pour 100 nuits à 120€/nuit :**
- Revenus bruts : 12 000€
- Commission hôte (18,6 % TVA comprise) : -2 232€
- Frais de paiement : compris
- **Net hôte Airbnb : 9 768€**

**Pour les mêmes 100 nuits en direct :**
- Revenus bruts : 12 000€
- Frais de paiement Stripe (~2%) : -240€
- Frais channel manager (si applicable) : ~-120€
- **Net hôte direct : 11 640€**

Soit près de **1 900€ de plus** pour les mêmes nuits. En direct, tu peux aussi afficher un peu moins cher qu'Airbnb et rester gagnant, ce qui aide à convertir.

:::quiz
? Sur 12 000 € de nuitées, combien te coûte environ la commission Airbnb TVA comprise (18,6 %) ?
* Environ 2 230 €
- Environ 360 €
- Environ 600 €
= 12 000 × 18,6 % = 2 232 €. C'est ce que la réservation directe te permet de garder en partie.
:::

:::quiz
? En direct, quel coût remplace la commission de la plateforme ?
- Aucun coût, jamais
- Une commission de 15 %
* Les frais de paiement en ligne, autour de 1,5 %
= Un prestataire comme Stripe facture environ 1,5 % + 0,25 € par carte européenne.
:::

:::action
titre: Calcule ce que te coûtent tes commissions
texte: Dans Mes prix, compare ce que tu reçois sur chaque plateforme et en direct pour ton logement.
lien: /dashboard/calculateurs#mes-prix
bouton: Comparer mes revenus nets
:::`,
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
          content: `:::bref
- Sans avantage clair, personne ne réserve en direct.
- Quatre leviers : le prix, les extras, la flexibilité et la relation.
- Une remise de 5 à 10 % suffit souvent à déclencher la décision.
:::

## Pourquoi un voyageur réserverait en direct ?

La question centrale de cette leçon. Si tu n'as pas de réponse claire, personne ne réservera en direct.

### Les leviers de différenciation directe

**1. Le prix**, La réduction de commission que tu ne verses pas à Airbnb te permet d'offrir un tarif légèrement inférieur tout en gardant la même marge. -5% à -10% suffit à déclencher la décision.

**2. Les extras**, Ce qu'Airbnb ne peut pas offrir : accueil personnalisé, cadeau de bienvenue, service de conciergerie, transfert aéroport, late check-out garanti.

**3. La flexibilité**, Politique d'annulation plus souple, acompte réduit, possibilité de modifier les dates. Airbnb impose ses règles. Toi, tu choisis.

**4. La relation directe**, Certains voyageurs préfèrent parler à un humain. Une adresse email et un numéro de téléphone rassurent plus qu'un chat Airbnb.

:::quiz
? Quelle remise suffit généralement pour qu'un voyageur préfère réserver en direct ?
- 30 à 40 %
- Aucune, le voyageur réserve de toute façon
* 5 à 10 %
= La commission économisée te permet une petite remise visible tout en gagnant plus qu'avec la plateforme.
:::

:::quiz
? Lequel de ces avantages une plateforme ne peut-elle pas offrir à ta place ?
* Un accueil personnalisé ou un départ tardif garanti
- Une photo de couverture
- Un calendrier de disponibilités
= Les extras et la relation directe sont tes vrais différenciateurs face aux plateformes.
:::`,
        },
        {
          id: 4,
          title: 'Construire une offre de bienvenue qui déclenche la réservation directe',
          duration: '20 min',
          content: `:::bref
- Une offre de bienvenue simple et claire convertit plus qu'une longue liste d'avantages.
- Présente-la au bon moment : après un séjour, lors d'une demande, ou par QR code dans le logement.
- Une date limite douce pousse à décider sans mettre la pression.
:::

## L'offre de bienvenue : ton premier outil de conversion directe

Une offre de bienvenue bien construite peut multiplier par 3 ton taux de conversion direct.

### Structure d'une offre efficace

**Le timing** : l'offre doit être présentée au bon moment, après un premier séjour, lors d'une demande de disponibilité, ou via un QR code dans le logement.

**Le contenu** : simple, clair, immédiatement compréhensible. "Réservez directement et profitez de -10% + late check-out offert."

**L'urgence** : une date d'expiration douce, "offre valable pour les réservations avant le [date]", augmente le taux de conversion sans créer de friction.

:::quiz
? Quel est le meilleur moment pour présenter ton offre de réservation directe ?
* Après un premier séjour réussi ou via un QR code dans le logement
- Dans la description Airbnb, en lien externe
- Uniquement sur ta page Facebook
= Un voyageur satisfait est le plus enclin à revenir en direct. Les liens externes dans l'annonce Airbnb sont interdits.
:::

:::quiz
? Quelle offre est la plus efficace ?
* « Réserve en direct : moins 10 % et départ tardif offert »
- Une liste de quinze avantages
- « Contacte-moi pour connaître nos conditions »
= Simple, chiffrée et immédiatement compréhensible : c'est ce qui déclenche la réservation.
:::

:::action
titre: Prépare ton affiche avec QR code
texte: Crée une affiche à poser dans le logement pour inviter tes voyageurs à revenir en direct.
lien: /dashboard/outils-impression
bouton: Créer mon affiche
:::`,
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
          content: `:::bref
- Quatre familles de solutions : gestionnaire de canaux avec site, WordPress, constructeur de site, plateforme de réservation directe.
- Le bon choix dépend de ton nombre de logements, de ton budget et de ton aisance technique.
- La synchronisation des calendriers est indispensable pour éviter les doubles réservations.
:::

## Les options pour ton site de réservation directe

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
- Idéal pour : tester avant d'investir

:::quiz
? Pour un hôte avec plusieurs logements, quelle solution est la plus adaptée ?
* Un gestionnaire de canaux avec site intégré
- Un simple formulaire de contact
- Une page Facebook
= Il synchronise les calendriers de toutes les plateformes et intègre un moteur de réservation.
:::

:::quiz
? Quel est le principal risque d'un site sans synchronisation de calendrier ?
- Trop d'avis clients
* Les doubles réservations
- Un site trop rapide
= Sans synchronisation, une nuit réservée sur Airbnb peut rester libre sur ton site.
:::`,
        },
        {
          id: 6,
          title: 'Créer des pages qui convertissent : structure, textes, photos',
          duration: '25 min',
          content: `:::bref
- Une page qui convertit suit un ordre précis : photo, galerie, promesse, équipements, disponibilités, avis, questions.
- Les disponibilités et le prix doivent être visibles sans faire défiler.
- Les avis importés rassurent un visiteur qui ne te connaît pas.
:::

## La page de réservation directe parfaite

Une page de réservation directe efficace suit une structure précise. Voici les éléments indispensables.

### Les 7 blocs d'une page qui convertit

1. **Hero** : photo principale + titre de l'hébergement + localisation
2. **Galerie** : 8-12 photos dans l'ordre stratégique (salon, cuisine, chambre, extérieur, détails)
3. **Pitch** : 3-4 phrases qui vendent l'expérience, pas les équipements
4. **Équipements** : liste claire et exhaustive avec icônes
5. **Disponibilités et tarifs** : moteur de réservation visible sans scroll
6. **Preuves sociales** : avis importés depuis Airbnb ou Google
7. **FAQ** : 5-7 questions fréquentes qui lèvent les objections

:::quiz
? Où placer le moteur de réservation sur ta page ?
* Visible sans faire défiler
- Tout en bas, après la FAQ
- Sur une page séparée sans lien
= Un visiteur qui doit chercher comment réserver abandonne.
:::

:::quiz
? À quoi sert la section avis sur ta page directe ?
- Améliorer ton référencement Airbnb
- Remplacer les photos
* Rassurer un visiteur qui ne te connaît pas
= La confiance est le premier frein à la réservation directe ; les avis la lèvent.
:::`,
        },
        {
          id: 7,
          title: 'Configurer ton système de réservation et de paiement direct',
          duration: '15 min',
          content: `:::bref
- Le paiement est un point de friction majeur : un mauvais réglage fait abandonner.
- Stripe facture environ 1,5 % + 0,25 € pour une carte européenne.
- Un acompte à la réservation et le solde quelques jours avant l'arrivée protègent les deux parties.
:::

## Paiements directs : Stripe, PayPal et les alternatives

Le système de paiement est un point de friction majeur de la réservation directe. Un mauvais setup = abandons garantis.

### Stripe : la référence pour les hôtes

Stripe est la solution la plus utilisée par les hôtes en réservation directe. Commission : 1,5% + 0,25€ pour les cartes européennes (2,9% + 0,30€ pour les cartes US).

**Ce qu'il faut configurer :**
- Compte Stripe Verified (KYC complet)
- Politique de remboursement claire
- Acompte à la réservation (30-50% recommandé)
- Solde automatique 2-7 jours avant l'arrivée
- Caution par empreinte bancaire (Stripe Cards)

:::quiz
? Quel schéma de paiement est recommandé en direct ?
* Un acompte à la réservation, le solde quelques jours avant l'arrivée
- Tout en espèces à l'arrivée
- Rien avant le départ du voyageur
= Tu sécurises la réservation sans demander tout le montant des mois à l'avance.
:::

:::quiz
? Combien coûte environ un paiement par carte européenne avec Stripe ?
* 1,5 % + 0,25 €
- 15 %
- 5 € fixes
= C'est le tarif standard des cartes européennes, bien loin d'une commission de plateforme.
:::

:::action
titre: Active l'encaissement en ligne
texte: Relie ton compte de paiement pour encaisser loyers et cautions directement depuis tes contrats.
lien: /dashboard/contrats
bouton: Ouvrir mes contrats
:::`,
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
          content: `:::bref
- Le référencement local apporte du trafic gratuit et très qualifié.
- Trois types de pages : la principale, les quartiers, les saisons ou événements.
- Titre, description, données structurées et vitesse font la différence.
:::

## Le SEO local pour les hébergements LCD

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
- Version mobile impeccable

:::quiz
? Quel titre de page vise le mieux un voyageur qui cherche sur Google ?
- « Accueil »
* « Location appartement Bordeaux centre »
- « Bienvenue chez nous »
= Le titre doit contenir ce que le voyageur tape : type de logement et lieu.
:::

:::quiz
? Pourquoi créer une page pour un événement local ?
* Pour capter les voyageurs qui cherchent un logement pour cet événement
- Pour remplacer ta page principale
- Pour éviter les avis
= Ces recherches sont précises et peu concurrencées, donc faciles à gagner.
:::`,
        },
        {
          id: 9,
          title: 'Google Vacation Rentals et Google Business Profile : la stratégie complète',
          duration: '15 min',
          content: `:::bref
- Google Vacation Rentals affiche tes disponibilités dans Google Search, Maps et Travel.
- Google ne prend pas de commission : tu paies seulement ton outil de connexion.
- La fiche Google Business sert surtout aux conciergeries et gîtes avec accueil.
:::

## Google comme canal d'acquisition direct

Google Vacation Rentals et Google Business Profile sont les deux outils Google les plus puissants pour générer des réservations directes.

Voir la formation dédiée "Google My Business pour la LCD" pour le détail complet de chaque outil.

### L'essentiel à retenir

**Google Vacation Rentals** : connecter ton channel manager (Lodgify, Hostaway, Smoobu) pour afficher tes disponibilités directement dans Google Search, Maps et Travel. 0% de commission Google, tu paies seulement ton channel manager.

**Google Business Profile** : pour les conciergeries et gîtes avec accueil physique. Fiche d'établissement + avis + posts réguliers = visibilité locale maximale.

:::quiz
? Quelle commission Google prend-il sur une réservation venue de Vacation Rentals ?
* Aucune
- 15 %
- 5 %
= Le voyageur réserve sur ton site ; tu ne paies que ton gestionnaire de canaux.
:::

:::quiz
? Comment apparaître dans Google Vacation Rentals ?
- En créant un compte Gmail
- En publiant sur Instagram
* En connectant un gestionnaire de canaux compatible
= Les disponibilités et les prix sont transmis à Google par ton outil de gestion.
:::`,
        },
        {
          id: 10,
          title: 'Réseaux sociaux et communautés locales : générer du trafic organique',
          duration: '15 min',
          content: `:::bref
- Les réseaux sociaux construisent une audience, ils ne remplacent pas un site de réservation.
- Instagram, groupes Facebook locaux et partenariats locaux sont les trois canaux qui fonctionnent.
- Dans les groupes, sois utile avant d'être commercial.
:::

## Les canaux organiques sous-exploités

Les réseaux sociaux ne sont pas le canal principal de réservation directe, mais ils sont excellents pour construire une audience et générer du trafic de manière régulière.

### Les 3 canaux qui fonctionnent pour la LCD

**Instagram** : avant/après, coulisses, expériences voyageurs. Format Reels = portée organique maximale. Lien en bio vers ton site de réservation.

**Groupes Facebook locaux** : "Voyageurs à [ville]", "Expats [ville]", groupes d'entreprises locales. Présence utile, pas commerciale.

**Partenariats locaux** : office de tourisme, restaurants, activités locales. Un lien depuis leur site = trafic qualifié + SEO.

:::quiz
? Comment se comporter dans un groupe Facebook local ?
- Contacter chaque membre en privé
* Apporter de l'aide et des conseils, avec un lien quand c'est pertinent
- Publier ton annonce tous les jours
= Une présence utile crée la confiance ; la publicité répétée fait exclure.
:::

:::quiz
? Quel est l'intérêt d'un partenariat avec l'office de tourisme ou un restaurant ?
* Un lien depuis leur site apporte du trafic qualifié et aide ton référencement
- Il remplace les avis
- Il baisse tes impôts
= Un lien local de confiance envoie des visiteurs intéressés et renforce ta visibilité.
:::

:::action
titre: Publie dans un groupe Facebook de voyageurs
texte: Choisis un groupe adapté à ta ville et utilise un message prêt à publier.
lien: /dashboard/visibilite/facebook
bouton: Voir les groupes
:::`,
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
          content: `:::bref
- Cinq freins reviennent : confiance, sécurité du paiement, garantie, prix, simplicité.
- Chaque frein se lève par un élément visible sur ta page.
- Avis, identité claire et politique d'annulation explicite rassurent le plus.
:::

## Pourquoi les visiteurs ne réservent pas en direct

Même avec un beau site et un bon prix, certains visiteurs n'osent pas réserver en direct. Comprendre leurs freins permet de les lever avant qu'ils quittent la page.

### Les 5 freins les plus courants

**1. La confiance**, "Je ne connais pas ce site." → Afficher les avis Airbnb/Google sur ta page, ton identité complète, tes coordonnées.

**2. La sécurité du paiement**, "Est-ce que mon paiement est protégé ?" → Logo Stripe/PayPal visible, mentions légales claires, politique d'annulation explicite.

**3. La garantie**, "Qu'est-ce qui se passe si le logement ne correspond pas ?" → Politique de remboursement claire, photos honnêtes.

**4. La comparaison de prix**, "Est-ce vraiment moins cher ?" → Afficher explicitement la différence avec Airbnb (+frais de service).

**5. L'habitude**, "Je réserve toujours sur Airbnb." → Offre exclusive direct + avantages concrets pour briser l'habitude.

:::quiz
? Un visiteur hésite car il « ne connaît pas ce site ». Que faire ?
- Baisser ton prix de moitié
- Retirer les photos
* Afficher tes avis, ton identité et tes coordonnées
= C'est un frein de confiance : il se lève par des preuves, pas par une remise.
:::

:::quiz
? Qu'est-ce qui rassure sur la sécurité du paiement ?
- Aucune information sur le paiement
* Un prestataire connu et une politique de remboursement claire
- Un paiement par virement à un inconnu
= Le visiteur veut savoir que son argent est protégé et récupérable si besoin.
:::`,
        },
        {
          id: 12,
          title: 'Relances, offres et séquences email pour convertir les indécis',
          duration: '25 min',
          content: `:::bref
- Un visiteur qui n'a pas réservé n'est pas perdu.
- Une séquence de trois e-mails sur dix jours peut convertir une partie des indécis.
- Rappel, réponse aux questions, puis dernière chance avec date limite.
:::

## La séquence email de conversion directe

Un visiteur qui n'a pas réservé n'est pas perdu. Une séquence d'e-mails bien conçue peut convertir une partie des prospects indécis.

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
- CTA fort

:::quiz
? Quel est le rôle du deuxième e-mail de la séquence ?
- Annoncer une hausse de prix
- Demander un avis
* Inviter à poser des questions et lever les doutes
= Après le rappel, on traite les hésitations avant la dernière relance.
:::

:::quiz
? Quelle règle respecter pour envoyer ces e-mails ?
- Écrire à toutes les adresses trouvées
- Envoyer un e-mail par jour
* Avoir l'accord du visiteur pour le contacter
= Le RGPD impose un consentement pour la prospection par e-mail.
:::

:::action
titre: Prépare tes messages de relance
texte: Pars des modèles de messages pour écrire tes trois relances.
lien: /dashboard/gabarits
bouton: Ouvrir les modèles
:::`,
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
          content: `:::bref
- Une liste d'anciens voyageurs vaut plus qu'une grande audience sur les réseaux.
- Collecte les adresses avec consentement : QR code, e-mail après le séjour, outil de gestion.
- Une lettre mensuelle simple suffit : disponibilités, offre réservée, nouveautés locales.
:::

## Ta liste email : ton actif le plus précieux

Une liste email de 500 voyageurs satisfaits vaut plus que 5 000 abonnés Instagram. Ces personnes te connaissent, ont séjourné chez toi, et sont prêtes à revenir.

### Construire ta liste dès le premier séjour

**Pendant le séjour** : QR code dans le logement vers une page d'inscription ("Recevez nos offres exclusives et disponibilités en avant-première").

**Après le check-out** : email de suivi avec invitation à s'inscrire.

**Via le channel manager** : certains outils (Lodgify, Hostaway) collectent automatiquement les emails avec consentement.

### La newsletter mensuelle idéale

- Disponibilités du mois suivant en avant-première
- Offre exclusive abonnés (-5% code unique)
- Un conseil ou recommandation locale
- Rappel de ton programme de parrainage

:::quiz
? Pourquoi une liste d'anciens voyageurs est-elle si précieuse ?
* Ils te connaissent déjà et sont prêts à revenir
- Elle est gratuite à vendre
- Elle remplace ton assurance
= Un voyageur satisfait réserve plus facilement en direct qu'un inconnu.
:::

:::quiz
? Quand proposer l'inscription à ta liste ?
* Pendant ou juste après le séjour, avec son accord
- Avant la première réservation, sans le dire
- Jamais, il faut acheter des listes
= Le moment où le voyageur est satisfait est le meilleur, et le consentement est obligatoire.
:::`,
        },
        {
          id: 14,
          title: 'Automatiser les rappels, offres de retour et programmes de parrainage',
          duration: '25 min',
          content: `:::bref
- Quatre automatisations : bienvenue, retour à 30 jours, rappel anniversaire, parrainage.
- Une fois en place, elles travaillent sans intervention.
- Le parrainage coûte moins cher qu'une commission et récompense tes meilleurs voyageurs.
:::

## L'automatisation : travailler moins pour vendre plus

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
- **ActiveCampaign** : automatisations avancées pour les hôtes multi-logements

:::quiz
? Quand envoyer l'e-mail « offre de retour » ?
- Le jour de l'arrivée
- Un an avant le séjour
* Environ 30 jours après le séjour
= Assez tôt pour que le souvenir soit vif, assez tard pour ne pas paraître insistant.
:::

:::quiz
? Pourquoi un programme de parrainage est-il rentable ?
- Il est obligatoire
- Il supprime les frais de ménage
* La récompense coûte moins qu'une commission de plateforme
= Une réduction offerte à un ancien voyageur reste inférieure à 15 à 18 % de commission.
:::

:::action
titre: Programme tes messages automatiques
texte: Choisis les modèles de bienvenue et de retour à envoyer à tes voyageurs.
lien: /dashboard/gabarits
bouton: Ouvrir les modèles
:::`,
        },
      ],
    },
  ],
}
