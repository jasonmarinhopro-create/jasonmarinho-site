export const AUDIT_ANNONCE_FORMATION = {
  slug: 'audit-annonce',
  title: 'Auditer une annonce LCD : le Score Annonce sur 100 points',
  description: `Une méthode de diagnostic complète pour n'importe quelle annonce LCD, la tienne ou celle d'un client. Une grille de notation en 8 catégories, un rapport qui priorise sans décourager, et comment en faire un vrai outil de prospection si tu es conciergerie.`,
  duration: '3h10',
  level: 'Intermédiaire',
  objectifs: [
    `Noter n'importe quelle annonce sur 100 points, en moins de 45 minutes`,
    'Repérer les signaux de classement qui font descendre une annonce sans que l\'hôte le voie',
    'Détecter les écarts entre équipements déclarés et réels, la source silencieuse des mauvais avis',
    'Rédiger un rapport d\'audit clair et priorisé, qu\'on lit vraiment jusqu\'au bout',
    'Choisir entre audit gratuit et audit payant selon ton objectif',
    'Transformer un audit en outil de prospection et le présenter sans braquer un propriétaire',
  ],
  modules: [
    {
      id: 1,
      title: 'La méthode : remplacer le coup d\'œil par une grille',
      duration: '30 min',
      lessons: [
        {
          id: 1,
          title: 'Pourquoi un diagnostic au feeling rate 8 fois sur 10',
          duration: '10 min',
          content: `## "Je trouve que ça va" n'est pas un diagnostic

Demande à dix hôtes ce qu'ils pensent de leur annonce, neuf te diront "ça va" ou "je pourrais faire mieux mais je ne sais pas quoi". Ce n'est pas un manque d'attention, c'est un problème de méthode : regarder sa propre annonce au feeling produit systématiquement un diagnostic faussé, par trois biais qui reviennent à chaque fois.

### Les 3 biais qui faussent un auto-diagnostic

**1. L'attachement au logement.** Tu connais chaque recoin, chaque rénovation, chaque effort mis dans la déco. Un voyageur, lui, ne voit que ce que montrent les photos et ce que dit le texte, en 8 secondes. L'écart entre "ce que je sais de mon logement" et "ce que montre réellement l'annonce" est le premier point mort de tout hôte.

**2. L'angle mort sur ce qu'on ne regarde jamais soi-même.** Tu ne relis jamais ta politique d'annulation, tu ne vérifies jamais si la liste d'équipements correspond encore à la réalité depuis que le lave-vaisselle est tombé en panne l'an dernier. Ce ne sont pas des oublis isolés, ce sont des zones qu'un propriétaire ne rouvre quasiment jamais une fois l'annonce publiée.

**3. La comparaison à la mauvaise concurrence.** "Je suis mieux que l'annonce du voisin" ne veut rien dire si l'annonce du voisin est elle-même médiocre. Le bon repère, ce sont les 3 à 5 annonces qui trustent le haut des résultats sur tes dates et ta zone, pas n'importe quel logement croisé au hasard.

### Ce qu'un audit structuré change

Un audit n'est pas un avis d'expert ni un ressenti amélioré. C'est une **grille appliquée de la même façon à chaque fois**, qui produit un score comparable dans le temps (as-tu progressé depuis le dernier audit ?) et comparable entre logements (lequel de tes deux biens a le plus besoin d'attention ?). C'est exactement ce que font, moyennant paiement, les services d'audit Airbnb qui existent déjà à l'international, mais avec une méthode que tu peux appliquer toi-même, gratuitement, en moins d'une heure.

La leçon suivante présente la grille complète : le **Score Annonce sur 100 points**, le fil rouge de toute cette formation.`,
        },
        {
          id: 2,
          title: 'Le Score Annonce /100 : les 8 catégories et leur pondération',
          duration: '20 min',
          content: `## Une seule grille, huit catégories, cent points

Le Score Annonce note une annonce sur 8 catégories, chacune pondérée selon son impact réel sur les réservations, pas de façon égale. Une annonce avec des photos parfaites mais un règlement flou n'a pas le même risque qu'une annonce avec des photos moyennes mais un prix mal placé : la pondération reflète cette différence d'impact.

### La grille complète

| Catégorie | Points | Ce qu'elle mesure |
|---|---|---|
| Visuel | /20 | Photo de couverture, galerie, qualité et honnêteté des images |
| Texte | /15 | Titre, description, capacité à convaincre et à répondre aux objections |
| Prix | /15 | Positionnement compétitif face aux annonces comparables |
| Avis | /15 | Note globale, mais surtout fraîcheur et contenu des avis récents |
| Disponibilité | /10 | Ouverture du calendrier, durée minimum de séjour adaptée |
| Comportement hôte | /10 | Taux de réponse, délai de réponse, taux d'acceptation |
| Équipements réels | /10 | Cohérence entre ce qui est déclaré et ce qui existe vraiment |
| Conformité | /5 | Règlement intérieur, mentions obligatoires, absence de risque juridique |

**Total : 100 points.**

### Pourquoi cette pondération, et pas une autre

Le **visuel pèse 4 fois plus que la conformité** : c'est volontaire. La photo de couverture est le premier filtre qui décide si un voyageur clique ou pas, avant même de savoir si le règlement intérieur est bien rédigé. Ce n'est pas une hiérarchie de valeurs, c'est une hiérarchie d'impact sur le taux de clic et de conversion, dans cet ordre précis. Les modules suivants détaillent chaque catégorie une par une, avec un protocole de notation concret.

### Comment lire un score une fois obtenu

- **80-100** : annonce solide, l'audit sert à repérer les 2-3 points de friction restants.
- **60-79** : des bases correctes mais au moins une catégorie qui plombe l'ensemble, souvent le visuel ou le prix.
- **Moins de 60** : plusieurs catégories faibles simultanément, un audit complet a plus de valeur qu'une correction isolée.

### Adapter la grille à un profil particulier

La pondération de base convient à la majorité des logements. Deux ajustements valent la peine d'être connus :

- **Logement haut de gamme** : monte le Visuel à /25 et baisse le Prix à /10, la décision se joue davantage sur l'image que sur la comparaison tarifaire.
- **Colocation ou logement partagé** : monte la Conformité à /10 (règles de vie commune, respect des espaces partagés) et baisse le Visuel à /15.

**Concrètement** : imprime ou copie cette grille avant de passer au module suivant. Chaque leçon qui suit correspond à une ou plusieurs de ces 8 catégories.`,
        },
      ],
    },
    {
      id: 2,
      title: 'Auditer le visuel et le texte',
      duration: '30 min',
      lessons: [
        {
          id: 3,
          title: 'Noter la photo de couverture et la galerie en 5 minutes',
          duration: '15 min',
          content: `## Catégorie Visuel — /20

Cette leçon donne le protocole de notation, pas la méthode pour prendre de meilleures photos : pour ça, la formation Photographie LCD au smartphone va beaucoup plus loin. Ici, l'objectif est de noter ce qui existe déjà, vite et sans expertise photo.

### La checklist en 6 critères (répartition suggérée : /20)

1. **Le test du pouce (4 pts).** Réduis la photo de couverture à la taille d'une miniature mobile. Si le sujet principal n'est pas identifiable immédiatement, le point est perdu, peu importe la qualité technique de la photo.
2. **La lumière naturelle (3 pts).** Photo prise de jour, lumière naturelle visible, pas de flash direct ni de pièce sombre corrigée artificiellement en post-traitement.
3. **L'ordre de la galerie (4 pts).** Les 5 premières photos doivent couvrir les pièces qui font réserver : salon ou chambre principale, vue extérieure marquante, cuisine, salle de bain, puis le reste. Une galerie qui commence par le couloir ou le local à poubelles perd le point immédiatement.
4. **La diversité des pièces (3 pts).** Chaque espace annoncé dans le texte doit avoir au moins une photo correspondante. Une annonce qui mentionne "jardin privatif" sans aucune photo du jardin perd des points de crédibilité, pas seulement de visuel.
5. **La cohérence avec la réalité (3 pts).** Pas de retouche excessive, pas d'objectif grand angle qui déforme les proportions au point de tromper. C'est un point qui protège autant contre les mauvais avis que contre un mauvais classement.
6. **Le volume et la fraîcheur (3 pts).** Au moins 15 photos, mises à jour dans les 12-18 derniers mois, en particulier après une rénovation ou un changement de déco.

### Ce qu'un score faible révèle

Un score sous 12/20 signale presque toujours la même cause : des photos prises pour se souvenir du logement, pas pour convaincre un inconnu de réserver. Ce n'est pas un problème de matériel, un smartphone récent suffit largement, c'est un problème de méthode et de moment de la journée.

**Concrètement** : note la photo de couverture actuelle sur ces 6 critères avant de continuer. Si le score est sous 12/20, c'est la première action à corriger, avant même de retoucher le texte.`,
        },
        {
          id: 4,
          title: 'Noter le titre et la description sans se noyer dans le détail',
          duration: '15 min',
          content: `## Catégorie Texte — /15

Même logique que la leçon précédente : un protocole de notation rapide, pas un cours de copywriting complet (couvert en détail dans Optimiser son annonce Airbnb et dans le module psychologie de la conversion d'Annonce 360°).

### Noter le titre (répartition suggérée : /7)

- **Un avantage clair identifiable (3 pts)** : le titre met-il en avant ce qui différencie vraiment ce logement (vue, équipement rare, emplacement), ou une formule générique ("beau logement au calme") qui pourrait s'appliquer à n'importe quelle annonce ?
- **Adapté à la cible réelle (2 pts)** : le titre parle-t-il à la clientèle qui réserve effectivement ce logement (famille, couple, business), ou à une cible différente de celle qui réserve vraiment ?
- **Longueur utilisée à bon escient (2 pts)** : les caractères disponibles sont-ils remplis d'information utile, ou coupés à mi-mot par une formule trop longue ?

### Noter la description (répartition suggérée : /8)

- **Première ligne qui accroche (3 pts)** : la phrase visible avant clic donne-t-elle une raison concrète de cliquer, ou se contente-t-elle de lister des équipements ?
- **Réponse aux objections courantes (3 pts)** : la description répond-elle aux questions qu'un voyageur hésitant se pose (bruit, parking, accès, ménage) avant qu'il n'ait à les poser en message ?
- **Absence de contradiction avec les photos ou les avis (2 pts)** : le texte annonce-t-il quelque chose que les photos ou les avis récents contredisent ? C'est un des points les plus fréquemment perdus, et l'un des plus dommageables.

### Le piège à éviter dans cette leçon

Ne cherche pas à réécrire le titre ou la description pendant que tu notes : sépare strictement le diagnostic de la correction. Un audit qui se transforme en session de réécriture perd le fil, et le score obtenu devient peu fiable puisqu'il note un texte à moitié modifié plutôt que l'existant.

**Concrètement** : note le titre et la description actuels sans les toucher. Garde la correction pour après l'audit complet, une fois que tu sais si le texte est vraiment le problème principal ou juste un symptôme secondaire.`,
        },
      ],
    },
    {
      id: 3,
      title: 'Auditer les signaux de classement',
      duration: '35 min',
      lessons: [
        {
          id: 5,
          title: 'Prix, calendrier, réactivité : les 3 signaux qui tuent un classement',
          duration: '20 min',
          content: `## Catégories Prix (/15), Disponibilité (/10) et Comportement hôte (/10)

Trois catégories regroupées dans cette leçon parce qu'elles partagent un point commun : ce sont des signaux que l'algorithme de chaque plateforme surveille en continu, et qu'un hôte laisse dériver sans s'en rendre compte, contrairement au visuel ou au texte qu'on revoit au moins de temps en temps.

### Noter le Prix (/15)

- **Comparaison aux 3-5 concurrents directs (7 pts)** : identifie les annonces qui trustent le haut des résultats sur tes dates et ta zone. Un prix supérieur de plus de 15 % sans justification visible (équipement rare, emplacement) perd la majorité des points.
- **Cohérence de la structure tarifaire (4 pts)** : frais de ménage, caution, tarifs week-end vs semaine, tout ça doit rester lisible et ne pas créer de mauvaise surprise au moment de payer.
- **Ajustement selon la saison (4 pts)** : un prix figé toute l'année sur un marché saisonnier perd des points, qu'il soit trop haut en basse saison ou trop bas en haute saison.

### Noter la Disponibilité (/10)

- **Horizon d'ouverture du calendrier (6 pts)** : un calendrier ouvert sur moins de 3 mois pénalise lourdement le classement sur la plupart des plateformes. L'idéal se situe entre 6 et 12 mois.
- **Durée minimum de séjour adaptée (4 pts)** : un minimum de 7 nuits en pleine semaine basse saison ferme la porte à une grande partie de la demande réelle.

### Noter le Comportement hôte (/10)

- **Taux de réponse (5 pts)** : sous 90 %, la plupart des algorithmes commencent à pénaliser visiblement l'annonce.
- **Délai de réponse et taux d'acceptation (5 pts)** : un délai supérieur à quelques heures ou un taux d'acceptation qui chute signale un hôte moins fiable, un signal que l'algorithme intègre directement dans le classement.

### Pourquoi ces 3 catégories sont les plus souvent négligées

Contrairement aux photos ou au texte, personne ne "voit" un mauvais taux de réponse ou un calendrier trop court en consultant sa propre annonce, ces données sont dans les statistiques de la plateforme, pas dans la fiche elle-même. C'est exactement pour ça qu'elles font l'objet d'un audit à part : elles se dégradent silencieusement.

**Concrètement** : ouvre les statistiques de ton compte hôte (Airbnb, Booking) et note ces trois catégories avant de continuer, plutôt que de te fier à ton impression générale.`,
        },
        {
          id: 6,
          title: 'Avis et badge Coup de Cœur : lire ce que la note ne dit pas',
          duration: '15 min',
          content: `## Catégorie Avis — /15

La formation Écrire des avis et répondre aux voyageurs couvre la rédaction et la sollicitation. Ici, l'objectif est différent : savoir noter la catégorie Avis dans un audit, en évitant l'erreur la plus fréquente, s'arrêter à la moyenne affichée.

### La répartition suggérée (/15)

- **Note moyenne (5 pts)** : sous 4,7, la plupart des programmes de mise en avant (type Coup de Cœur Voyageurs) deviennent inaccessibles, quel que soit le reste du score.
- **Vélocité des avis récents (6 pts)** : c'est le point le plus souvent oublié dans un audit rapide. Une annonce à 40 avis dont 12 dans les 90 derniers jours vaut mieux, pour le classement actuel, qu'une annonce à 200 avis mais quasiment inactive depuis des mois.
- **Contenu qualitatif des avis récents (4 pts)** : les 5 derniers avis mentionnent-ils des points positifs concrets réutilisables, ou seulement des formules courtes et vagues qui n'apportent ni preuve sociale forte ni matière pour la description ?

### Comment noter la vélocité concrètement

Compte le nombre d'avis reçus dans les 90 derniers jours et compare-le au rythme de séjours sur la même période. Un écart important, beaucoup de séjours mais peu d'avis, signale un problème de sollicitation, pas un problème de satisfaction : les deux causes appellent des corrections très différentes, d'où l'intérêt de bien distinguer ces deux points dans le score plutôt que de les mélanger.

### Le badge comme signal composite, pas comme catégorie séparée

Le badge Coup de Cœur Voyageurs (couvert en détail dans Optimiser son annonce Airbnb) n'a pas sa propre ligne dans le Score Annonce : il est la **conséquence** d'un bon score sur Avis, Comportement hôte et Visuel combinés, pas une catégorie à auditer séparément. Si le score obtenu sur ces trois catégories dépasse 80 % chacune et que le badge n'apparaît toujours pas, c'est un signal à surveiller dans le temps plutôt qu'à corriger dans l'immédiat : le badge se recalcule sur une fenêtre glissante.

**Concrètement** : calcule la vélocité des 90 derniers jours avant de noter cette catégorie. C'est la donnée la plus révélatrice et la plus souvent absente d'un audit fait au feeling.`,
        },
      ],
    },
    {
      id: 4,
      title: 'Auditer la confiance et la conformité',
      duration: '30 min',
      lessons: [
        {
          id: 7,
          title: 'Équipements déclarés vs équipements réels',
          duration: '15 min',
          content: `## Catégorie Équipements réels — /10

C'est l'angle presque jamais traité ailleurs dans le catalogue : pas "comment lister ses équipements" mais "comment vérifier que ce qui est listé existe vraiment", un contrôle que la quasi-totalité des hôtes ne refont jamais après la création de l'annonce.

### Pourquoi cette catégorie a un poids dédié

Un équipement coché mais absent, en panne, ou différent de la photo est l'une des causes les plus fréquentes de déception à l'arrivée, et de mauvais avis qui en découle. Ce n'est pas un problème de classement algorithmique direct, c'est un problème de **confiance qui se répercute ensuite sur la catégorie Avis**, avec un décalage de plusieurs semaines qui rend la cause difficile à identifier sans audit dédié.

### La checklist de vérification (répartition suggérée : /10)

- **Test physique des équipements listés (4 pts)** : lave-linge, wifi, climatisation, chauffage, chacun testé, pas seulement visuellement présent.
- **Cohérence photo/réalité (3 pts)** : l'équipement visible en photo est-il toujours celui présent, à la bonne place, dans le bon état ?
- **Équipements réels non déclarés (2 pts)** : à l'inverse, un équipement présent mais non mentionné dans l'annonce fait perdre une opportunité de conversion, sans faire perdre de confiance, mais ça reste un point d'amélioration à noter.
- **Fraîcheur de la vérification (1 pt)** : la dernière vérification complète remonte-t-elle à moins de 6 mois ?

### Le cas particulier des logements gérés à distance

Pour un hôte qui ne visite plus son logement régulièrement, ou pour une conciergerie qui audite le bien d'un client, cette catégorie demande une vérification sur place ou via la personne en charge du ménage, pas uniquement une relecture de l'annonce depuis un ordinateur. C'est la seule catégorie du Score Annonce qui ne peut pas se noter entièrement à distance avec un niveau de confiance élevé.

**Concrètement** : si tu n'es pas allé physiquement dans le logement depuis plus de 6 mois, cette catégorie ne peut être notée qu'avec une réserve explicite dans le rapport final, plutôt qu'avec un score ferme, un point qui sera repris dans le module sur la restitution.`,
        },
        {
          id: 8,
          title: 'Règlement intérieur et photos trompeuses : le risque caché',
          duration: '15 min',
          content: `## Catégorie Conformité — /5

Seulement 5 points sur 100, mais une catégorie qui protège contre un risque disproportionné par rapport à son poids : le litige évitable et le mauvais avis lié à une attente non cadrée dès le départ.

### La checklist (répartition suggérée : /5)

- **Règlement intérieur présent et complet (2 pts)** : horaires, animaux, fêtes, fumeurs, nombre de voyageurs maximum, chacun explicitement mentionné plutôt que sous-entendu.
- **Mentions obligatoires selon le pays du logement (1 pt)** : numéro d'enregistrement si requis, informations de sécurité (détecteur de fumée, consignes incendie selon la réglementation locale).
- **Absence de retouche trompeuse (1 pt)** : recoupe ce qui a été vu dans la catégorie Visuel, mais du point de vue du risque juridique plutôt que de la conversion, une photo qui exagère significativement la réalité peut constituer un motif de contestation.
- **Politique d'annulation affichée sans ambiguïté (1 pt)** : condition déjà évoquée dans la catégorie Prix pour son impact sur la conversion, ici évaluée sous l'angle de la clarté contractuelle.

### Pourquoi ce point pèse peu mais coûte cher s'il est ignoré

Un règlement flou ne fait pas directement baisser un classement, mais il augmente la probabilité d'un incident (voyageur non déclaré, fête surprise, dégât contesté) qui, lui, dégrade ensuite la catégorie Avis pendant des mois. La formation Gérer les incidents et litiges en LCD détaille la gestion d'un incident une fois qu'il survient ; cette catégorie de l'audit sert à réduire la fréquence à laquelle ça arrive.

### Un score de 5/5 ne dispense pas de vigilance

Contrairement aux autres catégories, la Conformité peut passer de 5/5 à un score dégradé du jour au lendemain, un changement de réglementation locale, une nouvelle mention obligatoire. C'est la seule catégorie du Score Annonce qui mérite d'être revérifiée même quand rien n'a changé dans l'annonce elle-même.

**Concrètement** : ferme cette leçon en ayant vérifié une chose précise : ton règlement intérieur mentionne-t-il explicitement le nombre maximum de voyageurs autorisés ? C'est le point le plus souvent absent, et l'un des plus fréquemment source de litige.`,
        },
      ],
    },
    {
      id: 5,
      title: 'Restituer un audit : le rapport qui convainc',
      duration: '30 min',
      lessons: [
        {
          id: 9,
          title: 'La structure d\'un rapport d\'audit qu\'on lit vraiment',
          duration: '15 min',
          content: `## Du score au document

Une grille remplie de notes n'est pas encore un audit utilisable, ni pour toi-même dans six mois, ni pour un propriétaire qui doit comprendre ce qu'il faut faire. Cette leçon transforme le score en document lisible.

### Le format en une page

Un bon rapport d'audit tient sur une seule page, structurée en 4 blocs :

1. **Le score global et les 8 sous-scores**, présentés visuellement (une grille comme celle du module 1), pour donner une vue d'ensemble en 5 secondes.
2. **3 points forts**, nommés précisément. Un rapport qui ne liste que des problèmes décourage, même s'il est juste sur le fond.
3. **3 points faibles**, ceux dont le score est le plus bas rapporté à leur pondération, pas simplement les moins bons en valeur absolue. Une catégorie à 3/5 en Conformité est moins urgente qu'une catégorie à 8/20 en Visuel, même si l'écart en points semble comparable.
4. **Une action immédiate**, une seule, celle qui a le meilleur ratio impact/effort. Le module suivant détaille comment la choisir.

### L'erreur du rapport de 40 lignes

Un audit exhaustif qui liste chaque défaut détecté, remarque par remarque, produit un document que personne ne termine de lire, encore moins d'appliquer. Le score sur 100 sert précisément à ça : il absorbe le détail dans une seule grille, et le rapport n'a besoin de développer en texte que ce qui sort vraiment du lot.

### Adapter le ton selon le destinataire

- **Pour toi-même** : direct, sans ménagement, le but est l'efficacité, pas le moral.
- **Pour un propriétaire tiers** (si tu es conciergerie ou si tu prêtes main-forte à un autre hôte) : factuel, jamais accusateur. "La catégorie Visuel obtient 11/20" se lit très différemment de "tes photos ne sont pas terribles", pour un contenu presque identique. Le module 6 détaille cette nuance en profondeur.

**Concrètement** : prends le score que tu as calculé dans les modules précédents et mets-le en forme selon cette structure en une page, avant de passer à la leçon sur la priorisation.`,
        },
        {
          id: 10,
          title: 'Prioriser sans décourager : rapide / moyen / structurel',
          duration: '15 min',
          content: `## Toutes les corrections ne se valent pas

Un rapport d'audit qui présente 12 actions à mener dans le désordre a le même défaut qu'une grille jamais transformée en document : personne ne sait par où commencer, et rien n'est fait. Cette leçon donne la méthode de classement qui résout ce problème.

### Les 3 niveaux

**Rapide (moins d'1 heure, effet visible sous 2 semaines).** Changer la photo de couverture, corriger une politique d'annulation trop stricte, répondre plus vite aux messages. Toujours l'action à mettre en premier dans un rapport, parce qu'un résultat rapide donne l'élan pour s'attaquer au reste.

**Moyen (quelques heures à quelques jours, effet sous 1 à 2 mois).** Réécrire la description, refaire une session photo complète, ajuster la structure tarifaire sur plusieurs semaines.

**Structurel (investissement ou changement d'organisation, effet sur plusieurs mois).** Rénover un espace, changer de channel manager, mettre en place un système de sollicitation d'avis automatisé, ce dernier point détaillé dans Annonce 360°.

### La règle de classement

Classe chaque point faible identifié dans le rapport selon deux axes : l'effort nécessaire et l'impact attendu sur le score. Une action à fort impact et faible effort se place toujours en premier, même si elle semble mineure en apparence, c'est elle qui débloque le plus de valeur pour le moins de travail.

> Une seule action structurelle proposée en premier dans un rapport suffit à décourager 9 propriétaires sur 10. Commence toujours par ce qui se voit vite.

### Combien d'actions inclure dans un rapport

Au-delà de 5 actions listées simultanément, l'attention du lecteur chute fortement, qu'il s'agisse de toi-même relisant ton propre rapport dans 3 mois, ou d'un propriétaire qui le découvre pour la première fois. Garde toujours les actions restantes en réserve pour un second passage, plutôt que de tout lister d'un coup.

**Concrètement** : reprends les points faibles identifiés dans ton rapport et classe-les en rapide / moyen / structurel avant de continuer. C'est ce classement, pas le score lui-même, qui rend un audit réellement actionnable.`,
        },
      ],
    },
    {
      id: 6,
      title: 'En faire un service, pour les conciergeries',
      duration: '35 min',
      lessons: [
        {
          id: 11,
          title: 'Audit gratuit ou payant : lequel choisir et pourquoi',
          duration: '15 min',
          content: `## Deux modèles, deux objectifs différents

À l'international, l'audit d'annonce est déjà un service payant établi. En France, il reste quasiment absent en tant qu'offre formalisée, ce qui laisse le champ libre à qui structure cette compétence en premier. Deux façons de le monétiser, selon l'objectif poursuivi.

### L'audit gratuit comme porte d'entrée

Utilisé en amont d'un mandat de gestion complet (déjà évoqué comme levier de prospection dans Créer sa conciergerie LCD, mais sans méthode ni outil concret jusqu'ici). Le principe : offrir un audit complet à un propriétaire prospect, sans engagement, pour démontrer une expertise concrète avant de proposer une gestion à la commission.

**Avantage** : lève la barrière à l'entrée, un propriétaire hésitant accepte plus facilement un audit gratuit qu'un premier rendez-vous commercial classique.

**Limite** : demande un volume de prospects suffisant pour rester rentable en temps investi, un audit complet prend 30 à 45 minutes une fois la méthode maîtrisée.

### L'audit payant en prestation ponctuelle

Pour un propriétaire qui gère seul son bien et veut un diagnostic externe sans déléguer la gestion complète. Un modèle de tarification simple : un forfait fixe (quelques dizaines d'euros) pour un rapport complet livré sous 48h, éventuellement complété d'un appel de 15 minutes pour répondre aux questions.

**Avantage** : génère un revenu direct sans engagement de gestion, et positionne qui le propose comme expert plutôt que comme simple prestataire de ménage ou de conciergerie généraliste.

**Limite** : le volume de clients potentiels est plus restreint que pour l'audit gratuit, la plupart des hôtes n'envisagent pas spontanément de payer pour un diagnostic tant que le concept n'est pas connu sur le marché français.

### Comment choisir entre les deux

- Objectif = **remplir un portefeuille de mandats de gestion** → audit gratuit, en volume, comme filtre de qualification des meilleurs prospects.
- Objectif = **un revenu d'appoint sans gérer de logements** → audit payant, en prestation indépendante, potentiellement cumulable avec d'autres services ponctuels (formation, coaching).

Rien n'empêche de combiner les deux : un audit payant pour les hôtes autonomes, et un audit gratuit réservé aux prospects qui correspondent au profil recherché pour un mandat de gestion.

**Concrètement** : détermine dès maintenant lequel des deux objectifs correspond à ta situation, cette décision conditionne directement la façon de présenter l'audit, traitée dans la dernière leçon.`,
        },
        {
          id: 12,
          title: 'Présenter un audit sans braquer, et le transformer en mandat',
          duration: '20 min',
          content: `## Le rapport le plus juste peut quand même braquer

Un audit techniquement irréprochable peut échouer complètement s'il est mal présenté. Un propriétaire qui reçoit une liste de défauts sur son bien, même factuelle, réagit d'abord émotionnellement, pas rationnellement. Cette dernière leçon donne la structure de présentation qui évite ce piège.

### Les 4 étapes d'une restitution qui fonctionne

**1. Commence toujours par le score global et les points forts.** Avant même d'évoquer un seul point faible, situe le propriétaire : "Ton annonce obtient 68/100, avec un très bon score sur les avis." Ça installe une posture d'expert bienveillant, pas de censeur.

**2. Présente les points faibles comme des opportunités, pas des fautes.** "La catégorie Visuel est à 11/20, c'est le plus gros potentiel de progression rapide" se reçoit très différemment de "tes photos sont mauvaises", pour un diagnostic identique. Le vocabulaire du rapport (leçon 9) fait toute la différence à l'oral aussi.

**3. Propose l'action rapide en premier, jamais la liste complète d'un coup.** Reprends le classement du module précédent : une seule action à fort impact et faible effort, présentée concrètement, donne au propriétaire un sentiment de contrôle plutôt que d'être dépassé.

**4. Laisse la porte ouverte sans forcer.** Termine toujours par une question, pas une offre commerciale directe : "Tu veux qu'on regarde ensemble comment mettre ça en place, ou tu préfères essayer seul dans un premier temps ?" Un propriétaire qui se sent poussé se braque, un propriétaire à qui on laisse le choix revient plus souvent de lui-même.

### Transformer un audit en mandat, sans forcer la main

Si l'objectif est la prospection (leçon précédente), la transition vers un mandat de gestion se fait presque toujours après, pas pendant la restitution de l'audit lui-même. Un audit qui se termine par un pitch commercial immédiat perd la confiance installée dans les 3 premières étapes. Le bon rythme : restitution de l'audit, un délai de quelques jours pour que le propriétaire digère l'information, puis une relance qui propose explicitement la gestion complète, en s'appuyant sur les points faibles identifiés ensemble.

> Un audit qui débouche sur un mandat n'est jamais celui qui a le rapport le plus complet. C'est celui dont la restitution a le mieux respecté ces 4 étapes.

### La boucle complète

Cette formation part du score, passe par le rapport, et se termine par la conversation qui donne à ce travail sa vraie valeur. Un audit jamais restitué correctement, aussi rigoureux soit le score, ne produit aucun résultat, ni pour un usage personnel (tu ne le relis jamais), ni pour un usage commercial (le propriétaire ne donne pas suite).

**C'est la fin de la formation.** La prochaine étape : choisis une annonce, la tienne ou celle d'un premier client, et fais tourner la grille complète de bout en bout avant que la méthode ne se dilue dans la théorie.`,
        },
      ],
    },
  ],
}
