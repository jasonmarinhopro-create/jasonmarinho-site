export const BOOKING_FORMATION = {
  slug: 'maitriser-booking-com-algorithme-genius',
  title: 'Maîtriser Booking.com : algorithme, Genius & IA en 2026',
  description: 'La deuxième plateforme LCD d\'Europe fonctionne sur des règles radicalement différentes d\'Airbnb. Algorithme de pertinence, programme Genius 2026, intégration ChatGPT et synchronisation intelligente : la formation pour sortir du mono-Airbnb et transformer Booking en canal rentable.',
  duration: '3h15',
  level: 'Intermédiaire',
  objectifs: [
    'Comprendre les 5 différences structurelles Booking.com vs Airbnb (contrat, audience, algorithme)',
    'Construire une fiche Booking qui passe le filtre qualité 2026 sans perdre d\'heures',
    'Décider stratégiquement du niveau Genius (10 / 15 / 20 %) selon ta marge réelle',
    'Optimiser les 5 signaux de classement : taux d\'acceptation, délai de réponse, annulation, score fiabilité',
    'Être sélectionné par l\'IA depuis l\'intégration ChatGPT x Booking (octobre 2025)',
    'Synchroniser Booking + Airbnb sans cannibalisation ni double-booking',
  ],
  modules: [
    {
      id: 1,
      title: 'Booking.com vs Airbnb — l\'essentiel à comprendre',
      duration: '25 min',
      lessons: [
        { id: 1, title: 'Les 5 différences structurelles Booking vs Airbnb', duration: '12 min', content: `## Pourquoi on ne peut pas juste dupliquer son annonce Airbnb sur Booking

La majorité des hôtes LCD qui publient sur Booking.com après Airbnb appliquent exactement la même stratégie : même photos, même description, même prix, même politique d'annulation. Et se plantent.

Les deux plateformes dominent le marché de la LCD européenne, mais elles fonctionnent sur des **modèles économiques radicalement différents**. Ignorer ces différences, c'est perdre entre 30 et 50 % du potentiel de Booking — ou pire, te faire rétrograder dans les résultats sans comprendre pourquoi.

### Différence 1 — Le contrat : commissionnaire vs facilitateur

**Airbnb est un facilitateur.** Il met en relation hôte et voyageur, prend une commission (généralement 3 % hôte + 14 % voyageur), et tu restes juridiquement le prestataire de service. Tu gardes le contrôle.

**Booking.com est un commissionnaire.** Il **vend ton hébergement en son nom** auprès du voyageur, encaisse le paiement (selon les cas), et applique ses propres conditions générales de vente par-dessus les tiennes. Techniquement, le contrat avec le voyageur est entre lui et Booking, pas toi.

**Conséquence pratique :** sur Booking, tu ne peux pas refuser un voyageur qui respecte les règles de la plateforme. Ton pouvoir de filtrage est plus faible. Il faudra l'anticiper dès ta fiche.

### Différence 2 — L'audience : Europe et business vs international et loisir

- **Booking** : ~60 % des réservations viennent d'Europe continentale (DE, NL, BE, FR, IT). Forte part de voyageurs business, séjours courts (1 à 3 nuits), check-in tardifs, mobilité. L'application mobile est utilisée dans 65 % des cas.
- **Airbnb** : clientèle plus internationale (US, UK, Australie forts), séjours plus longs (3 à 7 nuits en moyenne), majoritairement loisir et famille.

**Conséquence :** ton logement n'attire pas le même profil. Sur Booking, mets en avant la proximité transports, la wifi rapide, l'accueil flexible (self check-in, horaires étendus).

### Différence 3 — Instant booking : obligatoire vs optionnel

Sur Booking, l'**instant booking** (réservation instantanée sans validation préalable) est **le standard par défaut**. Tu peux ajouter une étape de validation, mais tu perdras drastiquement en classement. Les propriétés qui ne l'activent pas sont pénalisées.

Sur Airbnb, l'instant booking est optionnel — beaucoup d'hôtes gardent un écran de validation.

**À retenir :** prépare-toi à accueillir des réservations immédiates sans pouvoir vérifier le profil. On verra dans le Module 4 comment se protéger quand même.

### Différence 4 — La politique d'annulation : centrale dans l'algorithme

C'est la différence la plus sous-estimée. Sur Booking, **ta politique d'annulation est un critère fort de classement**. Les logements avec annulation gratuite jusqu'à J-3 remontent. Les politiques fermes sont dégradées.

Sur Airbnb, la politique d'annulation impacte surtout la conversion (pas le classement direct).

**Conséquence :** tu ne peux pas reprendre exactement ta politique Airbnb. On verra dans le Module 4 comment arbitrer.

### Différence 5 — Le modèle tarifaire : dégressif vs durée

**Booking aime les tarifs dégressifs conditionnels** : early booking (−15 % si réservé 30 j avant), mobile rate (−10 % si réservé sur l'app), last-minute (−20 % pour les 48 h suivantes). Ces mécaniques sont natives dans l'interface.

**Airbnb préfère les remises par durée** : −10 % à la semaine, −25 % au mois. C'est sa mécanique principale pour attirer les séjours longs.

**Action immédiate :** avant même de toucher à ta fiche Booking, liste sur papier quels leviers tarifaires tu veux activer. Tu es plus en contrôle sur Airbnb ; sur Booking, tu dois composer avec les mécaniques dégressives natives.

### Pour résumer

| Différence | Airbnb | Booking.com |
|---|---|---|
| Modèle contrat | Facilitateur | Commissionnaire |
| Audience | International / loisir | Europe / business |
| Instant booking | Optionnel | Standard |
| Politique annulation | Conversion | Classement |
| Tarification | Par durée | Dégressive |

La suite de cette formation est bâtie sur ces 5 différences. À chaque module, on reviendra y faire référence.` },
        { id: 2, title: 'Cadre juridique français 2026 (loi Le Meur et plateformes)', duration: '13 min', content: `## Ce que la loi Le Meur change pour toi sur Booking.com

La loi Le Meur du 19 novembre 2024 a rebattu les cartes de la LCD en France. Elle impacte Airbnb et Booking différemment, parce que les deux plateformes ont un statut juridique différent (revoir leçon précédente).

Voici ce que tu dois connaître pour ne pas te faire retirer ta fiche Booking en 2026.

### 1. Le numéro d'enregistrement national obligatoire à partir du 20 mai 2026

C'est la nouveauté majeure. À partir du 20 mai 2026, **tout hôte LCD en France doit obtenir un numéro d'enregistrement national** via le téléservice de l'État, avant de pouvoir publier son logement — sur Booking comme sur Airbnb.

Les plateformes ont **l'obligation légale de vérifier ce numéro** et de retirer les annonces qui ne le comportent pas. Sur Booking, le champ "numéro d'enregistrement" a été ajouté dans la section "Informations réglementaires" de ton extranet.

**Où trouver ce numéro ?** Sur le site service-public.fr rubrique "Meublés de tourisme". Tu renseignes ton adresse + DPE + SIRET (si tu as une activité déclarée). Le numéro est délivré immédiatement.

**Sans numéro valide, ta fiche Booking sera retirée.** Pas de négociation possible, la plateforme applique la loi.

### 2. Le DPE : obligatoire et ≥ E pour les nouvelles autorisations

Depuis le 1er janvier 2025 :

- **DPE F et G sont interdits** en LCD. Si ton logement est classé F ou G, tu ne peux plus le louer en courte durée, y compris sur Booking.
- **Nouvelles autorisations de changement d'usage** (meublé de tourisme dédié) : DPE E minimum requis.
- **Horizon 2034** : tout bien en LCD devra être ≥ D (alignement sur les règles longue durée).

Booking demande déjà le DPE dans les informations réglementaires. Sans DPE valide (< 10 ans), ta fiche affiche un bandeau d'alerte et perd en visibilité.

### 3. TVA para-hôtelière : seuil 37 500 € en 2026

Si tu proposes des **prestations para-hôtelières** (petit-déjeuner, ménage régulier, accueil personnel, fourniture du linge) en plus du logement, tu es potentiellement redevable de la TVA dès que ton CA dépasse **37 500 € annuels** (nouveau seuil 2026, précédemment 85 800 €).

Sur Booking, si tu es soumis à la TVA, tu dois **cocher la case "assujetti TVA" dans ton extranet** et afficher tes prix TTC. Ne pas le faire = risque de redressement fiscal + bannissement plateforme.

### 4. Booking transmet tes revenus à l'administration fiscale

Depuis 2020 (DAC 7 européen), Booking transmet automatiquement :

- Le chiffre d'affaires que tu as généré sur la plateforme
- Ton identité (nom, adresse, SIRET/NIF)
- Le nombre de nuitées louées

Ces données arrivent pré-remplies dans ta déclaration d'impôts. Ce qui n'était pas déclaré avant l'est maintenant automatiquement. Inutile d'essayer de passer entre les mailles.

### 5. Plafond 120 jours (ou 90) pour les résidences principales

Si tu loues ta **résidence principale** (pas un meublé dédié), tu es limité à 120 jours par an. Certaines communes (Paris déjà annoncé) peuvent descendre à 90 jours via la loi Le Meur.

Booking compte automatiquement tes nuitées. À l'approche de la limite, tu reçois un avertissement. Au-delà, ta fiche est automatiquement bloquée pour le reste de l'année.

### Check-list juridique avant de publier sur Booking

Avant même de commencer à construire ta fiche (module 2) :

☐ Numéro d'enregistrement national obtenu sur service-public.fr
☐ DPE < 10 ans, classé D ou mieux (E accepté temporairement)
☐ Déclaration en mairie faite (formulaire Cerfa 14004)
☐ SIRET si CA > seuil micro-BIC (77 700 € en 2026)
☐ Choix du statut TVA selon prestations para-hôtelières
☐ Assurance LCD responsabilité civile en vigueur

**Sans cette check-list complète**, inutile d'aller plus loin dans la formation : la plateforme refusera ta fiche ou la suspendra dans les semaines qui suivent.

La bonne nouvelle ? Cette check-list est **la même pour Booking et Airbnb**. Tu la fais une fois, tu l'appliques partout.` },
      ],
    },
    {
      id: 2,
      title: 'Construire une fiche Booking qui convertit',
      duration: '30 min',
      lessons: [
        { id: 3, title: 'Les 8 sections obligatoires pour passer le filtre qualité 2026', duration: '15 min', content: `## Le filtre qualité Booking en 2026 : plus strict qu'on ne le pense

Booking.com a renforcé son filtre qualité en 2025. Les fiches incomplètes ou mal remplies ne sont plus rétrogradées — elles ne sont **plus affichées du tout** dans les résultats pour 40 % des recherches. Passer ce filtre n'est pas une option, c'est le préalable à toute stratégie.

Voici les 8 sections à remplir méticuleusement avant de publier.

### 1. Informations générales et localisation

- **Nom de l'établissement** : nom clair (ex. "Appartement Le Canal — Hyper-centre Nantes"). Évite les mots-clés bourrés ou les emojis qui sont détectés comme spam.
- **Type de propriété** : choisis le bon type (appartement, maison, studio, loft…). Le type influence l'algorithme de matching avec les voyageurs.
- **Adresse complète** : Booking vérifie l'adresse via Google Maps. Une erreur = suspension automatique.
- **Coordonnées GPS exactes** : indispensable pour Google Maps + recherche "à proximité".

### 2. Photos (24 minimum)

Booking recommande officiellement **24 photos minimum** en 2026 (contre 10 en 2023). En dessous, ta fiche est marquée "incomplet".

Règles :

- **Format paysage** (horizontal) — les photos portrait sont dégradées
- **Résolution ≥ 1920 × 1080** (full HD)
- **Lumière naturelle**, pas de flash
- **Une photo par pièce** minimum (salon, chambres, cuisine, SdB, entrée, extérieur)
- **Photo de couverture** : la plus impactante, pas de vue extérieure seule

### 3. Description (2 parties obligatoires)

- **Description courte** (résumé) : 300-500 caractères, ce que voit le voyageur en un coup d'œil
- **Description longue** (détaillée) : 1500-2500 caractères, avec sections structurées

On reviendra sur les règles exactes dans la leçon suivante.

### 4. Équipements (les 30 qui comptent)

Booking a une liste de ~100 équipements cochables. Les 30 qui influencent le plus ton classement sont :

- Wi-Fi (avec débit mesuré)
- Climatisation / chauffage
- Cuisine équipée (détail des appareils)
- Machine à laver
- Parking (gratuit / payant)
- Accessibilité PMR (si applicable)
- Animaux acceptés
- Enfants acceptés
- Terrasse / balcon / jardin

**Règle clé** : ne coche que ce que tu as réellement. Les erreurs signalées par les voyageurs font chuter ton score qualité.

### 5. Politique de prix et d'annulation

- **Politique d'annulation** : sélectionne parmi les 5 modèles Booking (très souple, souple, modérée, ferme, non remboursable). On détaillera l'impact SEO dans le Module 4.
- **Frais additionnels** : taxe de séjour (pré-remplie selon ta commune), frais de ménage (à paramétrer), caution éventuelle.
- **Petit-déjeuner** : inclus / option / non disponible.

### 6. Check-in / check-out

- **Horaires d'arrivée** (ex. 15h-22h) et de départ (ex. 8h-11h)
- **Mode de remise des clés** (self check-in via boîte à clé, accueil personnel, serrure connectée)
- **Check-in flexible** : active-le si possible. C'est un signal fort pour l'audience business de Booking.

### 7. Règlement intérieur

- **Fumeurs / non-fumeurs**
- **Fêtes autorisées ou non**
- **Nombre de visiteurs supplémentaires autorisés**
- **Âge minimum du locataire**

Sois restrictif mais clair. Booking pénalise les règlements trop vagues.

### 8. Informations réglementaires (2026)

C'est la section la plus récente, ajoutée fin 2024 :

- **Numéro d'enregistrement LCD** (obligatoire au 20 mai 2026)
- **DPE** (classe + date du diagnostic)
- **SIRET** (si applicable)
- **Statut TVA** (assujetti / non-assujetti)
- **Plafond annuel de nuitées** (si résidence principale)

### Check-list de publication

Une fiche Booking prête à être indexée coche **chacune** de ces 8 sections à 100 %. En dessous de 90 % de complétion, tu es hors du top 50 % des résultats pour la plupart des requêtes.

**Temps estimé la première fois : 2 à 3 heures** pour remplir proprement. C'est l'investissement initial qui conditionne 90 % de ton ROI Booking.` },
        { id: 4, title: 'Photos, titre et description — les règles Booking (différentes d\'Airbnb)', duration: '15 min', content: `## Pourquoi ta description Airbnb va flopper sur Booking

Tu peux copier-coller ton annonce Airbnb sur Booking — je l'ai vu faire des dizaines de fois. Résultat : la fiche est techniquement publiée, mais elle sous-performe systématiquement. Parce que les deux plateformes ne lisent pas les mêmes signaux.

### Le titre : court, factuel, localisé

**Règles Airbnb** : titre punchy avec émotion ("Nid douillet face à l'océan — terrasse & vue", 40-50 caractères).

**Règles Booking** :

- Longueur : **60-80 caractères** (plus long car affichage différent)
- Structure : **type de bien + localisation + atout fort**
- Exemple : "Appartement 60 m² — Hyper-centre Bordeaux avec parking"
- **Pas d'émotion ou d'emoji** : Booking les filtre comme spam

**Test** : prends 5 titres de concurrents en top position sur ton marché. Remarque la structure. C'est quasi toujours : TYPE + LIEU + BÉNÉFICE.

### La description courte (résumé)

300-500 caractères. C'est ce que le voyageur lit en premier après le titre.

Structure gagnante Booking :

1. **Phrase 1 — Qui tu accueilles** : "Cet appartement lumineux accueille jusqu'à 4 voyageurs en couple, en famille ou en déplacement pro."
2. **Phrase 2 — Le lieu** : "Situé à 3 min à pied de la place Pey-Berland, cœur historique de Bordeaux."
3. **Phrase 3 — L'atout unique** : "Parking privé gratuit inclus, rare dans ce quartier piéton."
4. **Phrase 4 — La promesse** : "Check-in autonome 24/7, wifi fibre 500 Mb/s, ménage inclus."

Le ton est **factuel**, pas lyrique. Booking est lu par des voyageurs en mode comparaison, pas en mode rêverie.

### La description longue

1500-2500 caractères. Divisée en sections. **Les sous-titres sont lus par l'algorithme** pour matcher les requêtes voyageurs.

Sections à inclure **dans cet ordre** :

1. **Le logement** (taille, pièces, capacité)
2. **Le quartier** (nom précis, ambiance, commerces)
3. **Accès** (transports, gare, aéroport, parking)
4. **Équipements** (répéter les principaux en texte, pas juste cocher)
5. **Bien-être & détente** (si applicable)
6. **Pratique** (check-in, ménage, linge)
7. **Bon à savoir** (règles, particularités)

**Erreur fréquente** : copier-coller une description Airbnb qui commence par un storytelling personnel ("C'est en 2019 que j'ai acheté cet appartement…"). Sur Booking, c'est contre-productif. Le voyageur cherche du concret.

### Les photos : l'algorithme Computer Vision de Booking

Booking applique sa propre analyse Computer Vision depuis 2024. Ce qu'elle détecte :

- **La première photo** doit montrer le **logement dans son ensemble** (salon ou pièce principale). Pas une terrasse seule, pas un détail.
- **Les 5 premières photos** définissent 80 % du taux de clic. Elles doivent couvrir : salon, chambre principale, cuisine, SdB, un élément différenciant.
- **Chaque équipement coché doit avoir une photo associée** (parking, machine à laver, terrasse, jacuzzi…). Les équipements sans photo perdent leur poids algorithmique.
- **Les photos trop sombres** (moins de 60 % de luminosité moyenne) sont rétrogradées automatiquement.

### La hiérarchie des photos : règle des 3 tiers

Divise ton upload en 3 tiers :

1. **Tier 1 (photos 1-8)** : l'essentiel. Chaque pièce principale, vue d'ensemble.
2. **Tier 2 (photos 9-16)** : les détails. Cuisine équipée de près, salle de bain, terrasse, extérieur.
3. **Tier 3 (photos 17-24+)** : le plus. Atmosphère, quartier, éclairage soir.

Pourquoi c'est différent d'Airbnb ? Parce que le voyageur Booking fait une comparaison rapide — il a souvent 5-10 fiches ouvertes en onglets. Tes 8 premières photos doivent tout dire.

### Check-list avant publication

☐ Titre : type + lieu + atout, 60-80 caractères
☐ Description courte : 4 phrases structurées, factuelles
☐ Description longue : 7 sections ordonnées, 2000 caractères
☐ 24 photos minimum, format paysage, ≥ Full HD
☐ Première photo = vue d'ensemble
☐ Chaque équipement clé a une photo associée

**Temps estimé** : 1-2 heures pour réécrire titre + description, 30 min pour réorganiser les photos. C'est le plus gros ROI de cette formation.` },
      ],
    },
    {
      id: 3,
      title: 'Programme Genius 2026 — le décryptage',
      duration: '35 min',
      lessons: [
        { id: 5, title: 'Les 3 niveaux Genius (10 % / 15 % / 20 %) et leurs effets réels', duration: '18 min', content: `_Contenu à venir en sous-étape 5d_` },
        { id: 6, title: 'L\'algorithme de pertinence 2026 : pourquoi 10 % ne suffit plus', duration: '17 min', content: `_Contenu à venir en sous-étape 5d_` },
      ],
    },
    {
      id: 4,
      title: 'Les 5 signaux qui décident de ton classement',
      duration: '30 min',
      lessons: [
        { id: 7, title: 'Taux d\'acceptation et délai de réponse — les seuils à respecter', duration: '10 min', content: `_Contenu à venir en sous-étape 5e_` },
        { id: 8, title: 'Politique d\'annulation souple vs ferme — l\'impact SEO mesuré', duration: '10 min', content: `_Contenu à venir en sous-étape 5e_` },
        { id: 9, title: 'Le score de fiabilité Booking — comment le monter et le garder haut', duration: '10 min', content: `_Contenu à venir en sous-étape 5e_` },
      ],
    },
    {
      id: 5,
      title: 'Visibilité IA — ChatGPT x Booking.com',
      duration: '25 min',
      lessons: [
        { id: 10, title: 'Comment ChatGPT sélectionne les annonces depuis octobre 2025', duration: '13 min', content: `_Contenu à venir en sous-étape 5f_` },
        { id: 11, title: 'Structurer ta description pour être lisible par l\'IA (données factuelles)', duration: '12 min', content: `_Contenu à venir en sous-étape 5f_` },
      ],
    },
    {
      id: 6,
      title: 'Synchroniser Booking + Airbnb sans cannibalisation',
      duration: '30 min',
      lessons: [
        { id: 12, title: 'Tarifs, dates, disponibilités — la matrice de synchronisation', duration: '15 min', content: `_Contenu à venir en sous-étape 5g_` },
        { id: 13, title: 'Channel managers : quand les utiliser et lesquels choisir en 2026', duration: '15 min', content: `_Contenu à venir en sous-étape 5g_` },
      ],
    },
    {
      id: 7,
      title: 'Paiements, annulations et litiges Booking',
      duration: '20 min',
      lessons: [
        { id: 14, title: 'Les pièges paiement (no-show, caution, virement) et comment se protéger', duration: '20 min', content: `_Contenu à venir en sous-étape 5h_` },
      ],
    },
  ],
}
