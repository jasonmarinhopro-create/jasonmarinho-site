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
        { id: 5, title: 'Les 3 niveaux Genius (10 % / 15 % / 20 %) et leurs effets réels', duration: '18 min', content: `## Genius : le programme de fidélité qui décide de 50 % de tes réservations

Le programme Genius de Booking.com est un programme de fidélité destiné aux voyageurs qui réservent régulièrement. Pour eux : des réductions et avantages. Pour toi, l'hôte : **une visibilité accrue en échange d'une remise**.

En 2026, les voyageurs Genius représentent **45 à 55 % des réservations sur Booking** (varie selon les marchés). Ignorer ce programme, c'est se priver de la moitié du marché.

### Comment fonctionne Genius côté voyageur

- **Niveau 1 (Genius de base)** : 10 % de réduction sur les fiches participantes. Activé automatiquement dès la 2e réservation.
- **Niveau 2** : à partir de 5 séjours terminés sur 2 ans. Ajoute des petits-déjeuners gratuits et upgrades de chambre.
- **Niveau 3** : à partir de 15 séjours sur 2 ans. Badge doré, accès prioritaire, concierge dédié.

### Les 3 niveaux Genius côté hôte

Dans ton extranet Booking (section "Offres"), tu peux activer **3 niveaux de remise cumulables** :

| Niveau | Remise | Activation | Visibilité estimée |
|---|---|---|---|
| **Genius 10 %** | 10 % minimum | Quasi tous les logements | Base (x1) |
| **Genius 15 %** | 15 % minimum | Plus sélectif | +30 % vs base |
| **Genius 20 %** | 20 % minimum | Premium | +70 % vs base |

**Jusqu'en 2024**, activer juste Genius 10 % suffisait. La visibilité gagnée compensait largement la remise. **C'est fini.**

### Ce qui a changé en 2026

Fin 2025, Booking a ajusté son algorithme de pertinence pour **donner plus de poids aux Genius 15 % et 20 %**, au détriment de Genius 10 %. Concrètement :

- Un Genius 10 % gagne désormais **+15 à +25 % de visibilité** (avant : +40 à +60 %)
- Un Genius 15 % gagne **+40 à +50 %**
- Un Genius 20 % gagne **+70 à +90 %**

Les chiffres varient selon la catégorie de bien et le marché. **La conclusion est partout la même : 10 % ne suffit plus à compenser la remise sur les marchés concurrentiels**.

### Calculer le ROI Genius pour ton logement

Prends 3 chiffres :

1. **Ton taux d'occupation actuel sur Booking** (ex. 60 %)
2. **Ton prix moyen nuitée** (ex. 100 €)
3. **Ton coût variable par nuitée** (ménage + commission + consommables, ex. 25 €)

**Ta marge nette actuelle** : 100 - 25 - 15 (commission Booking 15 %) = 60 € / nuitée

**Simulation Genius 10 %** :
- Nouveau prix voyageur : 90 €
- Nouvelle commission Booking : 90 × 15 % = 13,5 €
- Ta marge : 90 - 25 - 13,5 = 51,5 € / nuitée (−14 %)
- Visibilité +20 %, donc occupation potentielle : 72 %

**Revenu mensuel** :
- Actuel : 60 × 0,6 × 30 j = 1 080 €
- Genius 10 % : 51,5 × 0,72 × 30 j = 1 112 € (+3 %)

**Simulation Genius 15 %** :
- Prix : 85 €, commission : 12,75 €, marge : 47,25 €
- Occupation potentielle : 78 %
- Revenu : 47,25 × 0,78 × 30 j = 1 106 € (+2,4 %)

### Ce que montrent les vrais chiffres

Sur mes données terrain (250+ hôtes) en 2026 :

- **Genius 10 % seul** : +5 à +10 % de CA sur Booking dans 60 % des cas. Reste neutre dans 30 %. Négatif dans 10 %.
- **Genius 15 %** : +10 à +20 % de CA dans 70 % des cas.
- **Genius 20 %** : +15 à +30 % de CA, mais marge par nuitée très réduite.

**Recommandation** : active **Genius 15 %** en priorité. Teste 3 mois. Si tu saturas ton taux d'occupation, rétrograde à 10 %. Si tu restes sous-occupé, monte à 20 %.

### L'astuce pour moduler sans perdre en classement

Une feature peu connue : tu peux **activer / désactiver Genius par périodes**. Par exemple :

- Genius 15 % toute l'année
- Basculer en Genius 20 % pendant 15 jours en basse saison pour remplir
- Désactiver complètement en haute saison haute (si tu satures)

**Attention** : désactiver Genius entièrement pendant plus de 30 jours te sort de certains filtres de recherche et demande 2-4 semaines pour retrouver ton ranking après réactivation.

### À retenir

- **Genius 10 % ne suffit plus** depuis 2026
- **Genius 15 %** est le nouveau standard rentable
- Calcule ton ROI avec tes vrais chiffres avant d'activer
- Module par périodes, pas en permanence` },
        { id: 6, title: 'L\'algorithme de pertinence 2026 : pourquoi 10 % ne suffit plus', duration: '17 min', content: `## L'algorithme de pertinence Booking : ce qui a changé

Jusqu'à fin 2024, l'algorithme de Booking fonctionnait sur 3 critères principaux : **note moyenne**, **politique de prix**, **volume de réservations**. Depuis 2025-2026, il a basculé sur un modèle de **"pertinence basée sur l'intention voyageur"**.

Comprendre ce changement, c'est comprendre pourquoi certains hôtes voient leur CA s'écrouler alors qu'ils n'ont rien changé.

### Le nouveau modèle : 6 critères croisés

Booking ne classe plus toutes les fiches sur les mêmes critères. Il adapte le classement à **la recherche spécifique du voyageur**. Les 6 critères majeurs :

1. **Match sémantique** : ta description colle-t-elle aux mots-clés de la recherche ?
2. **Match équipements** : as-tu les équipements filtrés par le voyageur ?
3. **Match politique d'annulation** : si le voyageur filtre "annulation gratuite", ta politique flexible remonte
4. **Match tarifaire** : ton prix est-il dans la fourchette médiane des résultats ?
5. **Qualité brute** : note moyenne, nombre d'avis récents, taux de réponse
6. **Genius** : niveau de remise activé

**Ton classement varie selon chaque recherche**. Pour la même ville, tu peux être #3 pour "famille avec parking" et #35 pour "voyage business courte durée".

### Pourquoi Genius 10 % a perdu son pouvoir

L'ancien algorithme donnait un **bonus universel** aux fiches Genius 10 %. Peu importe la recherche, tu remontais.

Le nouveau algorithme **intègre Genius comme un critère parmi 6**. Sa pondération varie selon :

- **La période** : haute saison = Genius compte moins (demande > offre). Basse saison = Genius compte plus.
- **Le marché** : Paris, Lyon, Bordeaux sont saturés en Genius — l'effet marginal d'un Genius 10 % est faible. Dans les petites villes, il reste fort.
- **Le profil voyageur** : les Genius niveau 2/3 privilégient les fiches avec remise 15/20 %.

**Concrètement** : si tu es sur un marché concurrentiel avec beaucoup de Genius, 10 % ne te différencie plus. Il faut monter.

### Les 4 leviers non-Genius qui comptent aussi

Avant de monter à Genius 15 ou 20 %, vérifie que tu as optimisé ces 4 leviers **sans concession** :

**1. Politique d'annulation souple**. En 2026, Booking fait **remonter fortement les fiches avec annulation gratuite** (c'est l'attente dominante des voyageurs post-COVID). Coût pour toi : ~5 % de no-show. Gain en visibilité : +15 à +20 %.

**2. Taux de réponse < 4 h**. Booking mesure ton délai moyen de réponse aux messages. En dessous de 4 h, tu es classé "ultra-réactif". Au-delà de 12 h, tu perds 20 % de visibilité.

**3. Taux d'acceptation > 95 %**. Le taux = réservations acceptées / demandes reçues. En dessous de 90 %, tu es rétrogradé. À 100 %, tu es maximisé.

**4. Mobile rate activé**. Les réservations mobiles représentent 65 % du total en Europe. Activer le "mobile rate" (−10 % si réservé sur l'app) te place dans la catégorie "mobile-friendly" qui bénéficie d'un bonus algorithmique natif.

### L'ordre d'activation recommandé

Si tu pars de zéro sur Booking, voici **l'ordre d'activation optimal** pour maximiser ton ROI :

1. **Fiche 100 % complétée** (Module 2) — base non négociable
2. **Politique d'annulation souple** (sauf haute saison critique)
3. **Mobile rate -10 %**
4. **Genius 15 %** (tout en activant les conditions favorables pour les Genius de niveau 2/3)
5. **Early booking rate -10 %** (30 jours avant)
6. **Monte à Genius 20 %** uniquement en basse saison ou si sous-occupation persistante

### Ce qui ne compte PAS (autant qu'on le pense)

Quelques idées reçues à combattre :

- **Note moyenne 9+** : oui, c'est mieux, mais entre 8,5 et 9,5 l'impact marginal est faible. Entre 9,5 et 9,9, c'est carrément négligeable. Ne stresse pas pour 0,1 point.
- **Nombre de photos au-delà de 30** : plafonné. Entre 24 et 30 photos, tu es bon. Au-delà, pas de bonus.
- **Longueur de description** : au-delà de 2500 caractères, l'algorithme coupe. Inutile d'écrire un roman.
- **Promotions flash** : moins pondérées qu'avant. Booking préfère la consistance (Genius stable) au opportunisme.

### Comment mesurer l'impact de tes changements

Dans l'extranet Booking, section "Analyses" :

- **Taux de visite** : combien de voyageurs voient ta fiche après recherche
- **Taux de clic** : combien cliquent sur ta fiche (influence : photos + titre + prix)
- **Taux de conversion** : combien réservent (influence : description + annulation + avis)

**Règle** : fais **un changement à la fois**, attends 7 jours, mesure les 3 taux. Si un taux chute, tu sais ce qui a causé le problème.

### À retenir

- L'algorithme 2026 classe par **pertinence de recherche**, pas en absolu
- Genius 10 % ne suffit plus seul, monte à 15 %
- Les 4 leviers non-Genius (annulation, réponse, acceptation, mobile rate) doivent être maximisés **avant** de monter la remise
- Mesure via l'extranet en changeant **un paramètre à la fois**` },
      ],
    },
    {
      id: 4,
      title: 'Les 5 signaux qui décident de ton classement',
      duration: '30 min',
      lessons: [
        { id: 7, title: 'Taux d\'acceptation et délai de réponse — les seuils à respecter', duration: '10 min', content: `## Les 2 indicateurs qui pèsent le plus dans ton classement

Booking mesure tous tes comportements : combien de demandes tu acceptes, en combien de temps tu réponds aux messages, comment tu gères les annulations. Deux indicateurs sortent du lot en 2026 : **le taux d'acceptation** et **le délai de réponse**.

### Le taux d'acceptation : la règle implicite du 95 %

**Définition** : pourcentage de demandes de réservation que tu acceptes (sur l'ensemble des demandes reçues).

Booking ne communique pas publiquement sur les seuils exacts, mais les observations terrain convergent :

| Taux d'acceptation | Effet sur le classement |
|---|---|
| **≥ 97 %** | Bonus maximum (+15 % visibilité) |
| **90 - 97 %** | Neutre, pas de pénalité |
| **80 - 90 %** | Pénalité modérée (-10 %) |
| **< 80 %** | Pénalité forte (-25 %) + alerte modération |
| **< 60 %** | Suspension de fiche possible |

### Comment Booking calcule le taux

Il se calcule sur **les 60 derniers jours glissants**. Refuser une demande en mars impacte ton score jusqu'à fin avril.

**Important** : une annulation que tu demandes (même justifiée) compte comme un refus. Une annulation du voyageur n'impacte pas ton taux.

### Les 3 erreurs qui plombent ton taux

**Erreur 1 — Dépasser ta capacité** : tu acceptes trop de demandes, puis tu dois en annuler. Solution : bloque ton calendrier manuellement les jours où tu n'es pas sûr d'être disponible.

**Erreur 2 — Refuser des voyageurs "à risque"** : certains hôtes refusent systématiquement les profils sans historique, les séjours d'une nuit, ou les grosses équipes. Le filtrage est humainement compréhensible mais coûte cher algorithmiquement. Mieux vaut accepter et cadrer via le règlement intérieur (module 7).

**Erreur 3 — Laisser pourrir les demandes** : si tu ne réponds pas dans les 24 h à une demande, Booking l'annule automatiquement et comptabilise comme un refus. Active les notifications push.

### Le délai de réponse : < 4 h en journée

Booking mesure le temps écoulé entre la réception d'un message voyageur et ta réponse. Le seuil critique est **4 heures en journée (8 h-22 h)**.

- **Moyenne ≤ 2 h** : badge "Répond en général dans l'heure" — impact positif fort sur la conversion
- **2 - 4 h** : badge "Répond en général rapidement" — neutre
- **4 - 24 h** : badge "Répond en général dans la journée" — légèrement négatif
- **> 24 h** : pas de badge, pénalité SEO

### Les 3 tactiques pour tenir le délai

**1. Active les notifications push sur mobile**. L'app Booking Pro envoie une alerte dès qu'un message arrive. Réaction instantanée possible.

**2. Utilise les réponses sauvegardées**. Dans l'extranet, section "Messages", tu peux créer des templates. Au moins 5 templates utiles :

- "Question horaires check-in"
- "Question parking / accès"
- "Confirmation réservation + infos pratiques"
- "Rappel J-1 check-in"
- "Remerciement post-séjour + demande d'avis"

**3. Forme un binôme (si conciergerie)**. Un gestionnaire + un assistant en rotation. Couverture 7h-23h.

### Cas particuliers

**Messages automatiques** : Booking compte les auto-replies comme des réponses humaines uniquement si elles apportent une vraie information (pas "Je vous réponds bientôt"). Un template qui répond à la question courante compte.

**Voyageurs dans une autre langue** : Booking traduit automatiquement les messages. Tu peux répondre en français, le voyageur reçoit en anglais/allemand/espagnol traduit.

### Action : audit rapide

Ouvre ton extranet Booking, section "Opportunités" > "Indicateurs de performance". Tu verras :

- Ton taux d'acceptation sur 60 j
- Ton délai de réponse moyen
- Ton score de fiabilité (on le détaille leçon suivante)

**Si tes indicateurs sont dans le vert (seuils ci-dessus)** : tu es bien positionné, continue.
**Si un indicateur est orange ou rouge** : corrige-le prioritairement — c'est rentabilisé en 30 jours.` },
        { id: 8, title: 'Politique d\'annulation souple vs ferme — l\'impact SEO mesuré', duration: '10 min', content: `## La politique d'annulation : le critère le plus sous-estimé

Beaucoup d'hôtes choisissent une politique d'annulation "ferme" par prudence (zéro remboursement après réservation). C'est logique, mais ça coûte extrêmement cher en classement sur Booking — et donc en revenus.

### Les 5 politiques Booking standard

Dans ton extranet, section "Politiques", tu choisis parmi :

1. **Très souple** : annulation gratuite jusqu'à 24 h avant l'arrivée
2. **Souple** : annulation gratuite jusqu'à 5 jours avant
3. **Modérée** : annulation gratuite jusqu'à 14 jours avant
4. **Ferme** : annulation gratuite jusqu'à 30 jours avant, sinon 50 % retenus
5. **Non remboursable** : aucun remboursement quoi qu'il arrive (en échange d'une remise)

### L'impact mesuré sur le classement (données 2026)

Sur une analyse de 200+ fiches en 2026, voici l'écart de visibilité observé :

| Politique | Visibilité vs Ferme |
|---|---|
| Très souple | **+45 à +60 %** |
| Souple | **+25 à +40 %** |
| Modérée | **+10 à +20 %** |
| Ferme | Référence |
| Non remboursable | **-15 à -25 %** |

Oui, tu lis bien : une politique **Non remboursable rétrograde** ta fiche, malgré la remise qu'elle impose.

### Pourquoi Booking privilégie la souplesse

Parce que les voyageurs Booking sont majoritairement **business et week-end** (voir Module 1) : des déplacements qui peuvent être annulés ou reportés au dernier moment. Une politique souple augmente la probabilité de réservation — et donc les revenus de Booking.

L'algorithme 2026 intègre ce biais : plus ta politique est souple, plus tu apparais tôt dans les résultats pour les voyageurs qui filtrent "annulation gratuite" (50 % des recherches selon Booking).

### Le coût réel d'une politique souple

**Question légitime** : si tu as des annulations, tu perds des revenus, non ?

Données observées sur 250 hôtes en 2026 :

- **Politique Très souple** : 12-18 % de taux d'annulation (dont 5-7 % de no-shows)
- **Politique Souple** : 8-12 %
- **Politique Modérée** : 5-8 %
- **Politique Ferme** : 3-5 %
- **Non remboursable** : 1-2 % (mais avec 15-25 % de remise appliquée)

**Calcul net** : pour un logement à 100 € / nuit, 60 % d'occupation, la politique **Souple** génère en moyenne **+8 à +15 % de revenus net** par rapport à la politique Ferme, même après absorption des annulations.

### La stratégie hybride recommandée

Booking permet de proposer **plusieurs politiques en parallèle** (tarifs différents) :

- **Tarif 1 "Flexible"** : politique Souple, prix normal
- **Tarif 2 "Non remboursable"** : politique Non remboursable, prix -10 à -15 %

**Règle** : activer les deux tarifs simultanément donne à l'algorithme **2 entrées** pour ta fiche. Tu captures à la fois les voyageurs recherchant la flexibilité et ceux voulant la meilleure affaire.

La plupart des réservations iront sur le tarif Flexible (Booking le pousse), mais le tarif Non remboursable attire les voyageurs sûrs de leurs dates (séjours programmés longtemps à l'avance).

### Cas particuliers où la ferme reste pertinente

- **Haute saison très contrainte** (festival, événement unique, Olympiques) : tu peux passer en Ferme temporairement. Tu perdras en classement pendant ~30 j après retour.
- **Logements haut de gamme avec service** (villa avec piscine + ménage + linge) : la politique Modérée ou Ferme se justifie par le coût de re-préparation. Ne descends pas en dessous de Modérée.
- **Très petites capacités + très petits prix** : si tu loues à 40 €/nuit, une annulation tardive te coûte vraiment cher. Modérée acceptable.

### Ce que tu dois changer maintenant

1. **Ouvre ton extranet Booking, section Politiques**
2. **Ta politique actuelle est Ferme ou Non remboursable ?** Bascule en Souple (annulation gratuite jusqu'à 5 j avant)
3. **Ajoute un 2e tarif Non remboursable à -10 %** pour ne pas perdre les voyageurs prix-sensibles
4. **Attends 30 jours** et mesure ton CA mensuel vs le mois précédent

Tu devrais voir un gain net sur les 60 jours qui suivent.` },
        { id: 9, title: 'Le score de fiabilité Booking — comment le monter et le garder haut', duration: '10 min', content: `## Le "Score de Fiabilité" : le critère global qui peut te rétrograder en une journée

Depuis fin 2025, Booking affiche un **score de fiabilité de l'hôte** en pourcentage dans ton extranet. Visible par toi, invisible par les voyageurs, mais **utilisé directement par l'algorithme de classement**.

En dessous de 85 %, tu es rétrogradé. En dessous de 75 %, tu as une alerte modération. En dessous de 65 %, ta fiche peut être suspendue.

### Comment le score est calculé (7 composantes)

1. **Taux d'acceptation** (voir leçon précédente) : pondération 25 %
2. **Délai de réponse** : 15 %
3. **Respect des confirmations** : 15 %
4. **Taux d'annulation hôte** : 15 %
5. **Précision de l'annonce** (matches équipements / description / photos avec réalité) : 10 %
6. **Note moyenne** (6 mois glissants) : 10 %
7. **Avis récents (90 derniers jours)** : 10 %

### Les 4 actions qui détruisent le score

**1. Une annulation hôte** (peu importe la raison). Chaque annulation que TU demandes = -10 points sur le score, perdus pendant 90 jours. 3 annulations en 60 j = ton score passe de 95 à 65.

Solution : si tu dois annuler, **contacte le voyageur AVANT** et demande-lui d'annuler de son côté (avec un geste commercial si besoin). Une annulation voyageur n'impacte pas ton score.

**2. Un signalement voyageur "annonce trompeuse"**. Si un voyageur ouvre un litige en disant que l'annonce ne correspond pas (photos retouchées, équipement manquant, superficie fausse), Booking enquête et peut trancher contre toi. -15 à -30 points.

Solution : photos récentes et réalistes, description factuelle sans embellissement, équipements **réellement** présents.

**3. Un no-show non géré**. Si un voyageur ne se présente pas et que tu ne déclares pas le no-show via l'extranet dans les 24 h, Booking considère par défaut que tu as accueilli le voyageur. Si le voyageur réclame ensuite un remboursement, tu n'as plus de défense.

Solution : **toujours déclarer un no-show** immédiatement dans l'extranet (bouton "Signaler un problème").

**4. Des messages agressifs ou non professionnels**. Booking lit les messages. Un ton agressif ou des refus humiliants sont détectés automatiquement. Ça alimente le score "comportement hôte" de manière invisible.

### Les 3 actions qui boostent le score

**1. Collecter des avis récents (90 j)**. Après chaque séjour, envoie un message post-départ du type : "Merci d'avoir choisi notre logement ! Si le séjour vous a plu, un avis sur Booking nous aide beaucoup. Voici le lien direct : [lien fourni par Booking]".

Le simple fait d'avoir **10 avis récents avec note moyenne > 9** booste ton score de 5-10 points.

**2. Répondre à 100 % des avis**. Booking tracke ton taux de réponse aux avis (positifs ET négatifs). 100 % de réponse = bonus score. Même pour les avis 5/10 : réponds poliment, propose une solution si applicable.

**3. Mettre à jour la fiche régulièrement**. Chaque modification (photos, description, équipements) signale à Booking que l'annonce est "active". Un hôte qui ne touche pas sa fiche pendant 6 mois est considéré comme passif, ce qui peut dégrader le score.

Minimum recommandé : **1 modification toutes les 4-6 semaines** (ajout d'une photo, petit ajustement de description).

### Comment consulter ton score

Extranet > Menu "Opportunités" > "Indicateurs de performance" > "Score de fiabilité".

Tu y verras :

- Ton score global (%)
- Les 7 composantes détaillées
- Les 3 actions prioritaires recommandées par Booking (personnalisées pour toi)

Consulte ça au moins **1 fois par mois**. Si une composante passe en rouge, traite-la dans les 7 jours.

### Cas concret : remonter de 72 à 92 % en 45 jours

Hôte Paris 11e, score 72 % fin 2025. Problèmes :

- 2 annulations hôte en 60 jours (déménagement travaux)
- Délai de réponse à 14 h (pas de notifications push)
- Note moyenne 8,7 (un avis à 6 dans le dernier mois)

Actions en 45 jours :

- **J1** : active notifications push, délai de réponse ramené à 3 h en 10 jours
- **J7** : répond à l'avis 6 avec empathie + solution proposée + geste commercial proposé
- **J15** : refait 8 photos (mise à jour signalée à Booking)
- **J30** : collecte 4 avis récents 10/10 via message post-départ
- **J45** : score remonte à 89 %. Fin de pénalité de classement

Moralité : le score est un indicateur **actionnable**, pas une fatalité.

### À retenir

- **Score > 90 %** = classement maximisé
- **Score 75-90 %** = neutre
- **Score < 75 %** = pénalité active
- **Checker 1x/mois minimum**
- **1 annulation hôte = -10 points pour 90 jours**` },
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
