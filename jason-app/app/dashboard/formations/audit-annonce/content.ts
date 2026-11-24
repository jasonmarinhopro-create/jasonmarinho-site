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
          title: 'Pourquoi un diagnostic au feeling passe à côté de l\'essentiel',
          duration: '10 min',
          content: `:::bref
- Regarder sa propre annonce au feeling donne un diagnostic faussé.
- Trois biais : l'habitude, l'attachement et le manque de comparaison.
- Une grille notée rend l'audit objectif et répétable.
:::

## "Je trouve que ça va" n'est pas un diagnostic

Demande à dix hôtes ce qu'ils pensent de leur annonce, neuf te diront "ça va" ou "je pourrais faire mieux mais je ne sais pas quoi". Ce n'est pas un manque d'attention, c'est un problème de méthode : regarder sa propre annonce au feeling produit systématiquement un diagnostic faussé, par trois biais qui reviennent à chaque fois.

### Les 3 biais qui faussent un auto-diagnostic

**1. L'attachement au logement.** Tu connais chaque recoin, chaque rénovation, chaque effort mis dans la déco. Un voyageur, lui, ne voit que ce que montrent les photos et ce que dit le texte, en 8 secondes. L'écart entre "ce que je sais de mon logement" et "ce que montre réellement l'annonce" est le premier point mort de tout hôte.

**2. L'angle mort sur ce qu'on ne regarde jamais soi-même.** Tu ne relis jamais ta politique d'annulation, tu ne vérifies jamais si la liste d'équipements correspond encore à la réalité depuis que le lave-vaisselle est tombé en panne l'an dernier. Ce ne sont pas des oublis isolés, ce sont des zones qu'un propriétaire ne rouvre quasiment jamais une fois l'annonce publiée.

**3. La comparaison à la mauvaise concurrence.** "Je suis mieux que l'annonce du voisin" ne veut rien dire si l'annonce du voisin est elle-même médiocre. Le bon repère, ce sont les 3 à 5 annonces qui trustent le haut des résultats sur tes dates et ta zone, pas n'importe quel logement croisé au hasard.

:::exemple
Le propriétaire trouve ses photos « très bien » : il connaît le logement et voit ce qui n'est pas sur la photo. Un voyageur, lui, ne voit qu'une image sombre en petit. L'audit sert à regarder avec les yeux de ce voyageur.
:::

### Ce qu'un audit structuré change

Un audit n'est pas un avis d'expert ni un ressenti amélioré. C'est une **grille appliquée de la même façon à chaque fois**, qui produit un score comparable dans le temps (as-tu progressé depuis le dernier audit ?) et comparable entre logements (lequel de tes deux biens a le plus besoin d'attention ?). C'est exactement ce que font, moyennant paiement, les services d'audit Airbnb qui existent déjà à l'international, mais avec une méthode que tu peux appliquer toi-même, gratuitement, en moins d'une heure.

La leçon suivante présente la grille complète : le **Score Annonce sur 100 points**, le fil rouge de toute cette formation.

:::quiz
? Pourquoi un diagnostic au feeling est-il peu fiable ?
* Habitude et attachement faussent le regard
- Parce qu'il prend trop de temps
- Parce que les plateformes l'interdisent
= On ne voit plus les défauts de ce qu'on connaît par cœur.
:::

:::quiz
? Qu'apporte une grille notée ?
* Un diagnostic objectif et comparable dans le temps
- Une note toujours parfaite
- Rien de plus
= Les mêmes critères permettent de mesurer les progrès.
:::`,
        },
        {
          id: 2,
          title: 'Le Score Annonce /100 : les 8 catégories et leur pondération',
          duration: '20 min',
          content: `:::bref
- Le Score Annonce note l'annonce sur 100 points, en 8 catégories.
- Chaque catégorie est pondérée selon son impact réel sur les réservations.
- Un score se lit catégorie par catégorie, pas seulement au total.
:::

## Une seule grille, huit catégories, cent points

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

:::exemple
Annonce notée 62/100 : Visuel 9/20, Texte 11/15, Prix 12/15, Avis 13/15… Le total dit « moyen » ; le détail dit « commence par les photos ». C'est la catégorie la plus basse par rapport à son maximum qui guide le plan.
:::

### Adapter la grille à un profil particulier

La pondération de base convient à la majorité des logements. Deux ajustements valent la peine d'être connus :

- **Logement haut de gamme** : monte le Visuel à /25 et baisse le Prix à /10, la décision se joue davantage sur l'image que sur la comparaison tarifaire.
- **Colocation ou logement partagé** : monte la Conformité à /10 (règles de vie commune, respect des espaces partagés) et baisse le Visuel à /15.

**Concrètement** : imprime ou copie cette grille avant de passer au module suivant. Chaque leçon qui suit correspond à une ou plusieurs de ces 8 catégories.

:::astuce
Note toujours dans les mêmes conditions (navigation privée, mêmes dates de recherche) : deux audits comparables valent mieux qu'un audit parfait.
:::

:::quiz
? Pourquoi les catégories ne pèsent-elles pas toutes pareil ?
- Par hasard
- Pour compliquer
* Elles n'ont pas le même impact sur les réservations
= La pondération reflète ce qui fait vraiment réserver.
:::

:::quiz
? Comment lire un score ?
- Seulement le total
- Seulement la meilleure catégorie
* Catégorie par catégorie, pour trouver les faiblesses
= Le détail montre où agir en premier.
:::

:::action
titre: Note ton annonce sur 100
texte: Bloque 30 minutes dans ton calendrier pour faire ton premier audit.
lien: /dashboard/calendrier
bouton: Ouvrir mon calendrier
:::`,
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
          content: `:::bref
- Le visuel compte pour 20 points.
- Test du pouce : la photo de couverture reste lisible en tout petit.
- Un score faible révèle souvent une couverture peu lisible ou une galerie incomplète.
:::

## Catégorie Visuel (/20)

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

**Concrètement** : note la photo de couverture actuelle sur ces 6 critères avant de continuer. Si le score est sous 12/20, c'est la première action à corriger, avant même de retoucher le texte.

:::exemple
Couverture prise de nuit avec le flash, 12 photos dont 4 de la salle de bain : 8/20. Trois corrections suffisent souvent à gagner plusieurs points : une couverture de jour, un ordre logique, des photos en paysage.
:::

:::quiz
? Qu'est-ce que le test du pouce ?
- Prendre la photo d'une main
* Vérifier que la photo de couverture reste lisible en miniature
- Compter les photos avec le pouce
= Dans les résultats, la photo s'affiche en petit sur téléphone.
:::

:::quiz
? Que révèle souvent un score visuel faible ?
- Un prix trop bas
- Un mauvais règlement
* Une couverture peu lisible ou une galerie incomplète
= Ce sont les deux défauts visuels les plus fréquents.
:::`,
        },
        {
          id: 4,
          title: 'Noter le titre et la description sans se noyer dans le détail',
          duration: '15 min',
          content: `:::bref
- Le texte compte pour 15 points : titre et description.
- Le titre doit montrer un avantage clair et un repère de lieu.
- Ne te noie pas dans les détails : note vite, corrige ensuite.
:::

## Catégorie Texte (/15)

Même logique que la leçon précédente : un protocole de notation rapide, pas un cours de copywriting complet (couvert en détail dans Optimiser son annonce Airbnb et dans le module psychologie de la conversion d'Annonce 360°).

### Noter le titre (répartition suggérée : /7)

- **Un avantage clair identifiable (3 pts)** : le titre met-il en avant ce qui différencie vraiment ce logement (vue, équipement rare, emplacement), ou une formule générique ("beau logement au calme") qui pourrait s'appliquer à n'importe quelle annonce ?
- **Adapté à la cible réelle (2 pts)** : le titre parle-t-il à la clientèle qui réserve effectivement ce logement (famille, couple, business), ou à une cible différente de celle qui réserve vraiment ?
- **Longueur utilisée à bon escient (2 pts)** : les caractères disponibles sont-ils remplis d'information utile, ou coupés à mi-mot par une formule trop longue ?

:::exemple
« Bel appartement » : 2/7, rien ne le distingue.
« T2 avec balcon, vue sur le Vieux-Port » : 6/7, type, atout et lieu en une ligne.
:::

### Noter la description (répartition suggérée : /8)

- **Première ligne qui accroche (3 pts)** : la phrase visible avant clic donne-t-elle une raison concrète de cliquer, ou se contente-t-elle de lister des équipements ?
- **Réponse aux objections courantes (3 pts)** : la description répond-elle aux questions qu'un voyageur hésitant se pose (bruit, parking, accès, ménage) avant qu'il n'ait à les poser en message ?
- **Absence de contradiction avec les photos ou les avis (2 pts)** : le texte annonce-t-il quelque chose que les photos ou les avis récents contredisent ? C'est un des points les plus fréquemment perdus, et l'un des plus dommageables.

### Le piège à éviter dans cette leçon

Ne cherche pas à réécrire le titre ou la description pendant que tu notes : sépare strictement le diagnostic de la correction. Un audit qui se transforme en session de réécriture perd le fil, et le score obtenu devient peu fiable puisqu'il note un texte à moitié modifié plutôt que l'existant.

**Concrètement** : note le titre et la description actuels sans les toucher. Garde la correction pour après l'audit complet, une fois que tu sais si le texte est vraiment le problème principal ou juste un symptôme secondaire.

:::erreur
Réécrire toute la description pendant l'audit. L'audit note et explique ; la correction vient après, avec l'accord du propriétaire.
:::

:::quiz
? Qu'est-ce qui rapporte des points dans un titre ?
- Des majuscules
* Un avantage clair qui distingue le logement
- Le plus de mots possible
= Le titre doit donner une raison de cliquer.
:::

:::quiz
? Quel piège éviter dans cette étape ?
- Lire la description
- Noter le titre
* Réécrire tout le texte au lieu de le noter
= L'audit mesure ; la correction vient après.
:::

:::action
titre: Note ta catégorie visuel et texte
texte: Inscris tes deux notes dans ta fiche logement pour suivre ton évolution.
lien: /dashboard/logements
bouton: Ouvrir mes logements
:::`,
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
          content: `:::bref
- Prix (15), disponibilité (10) et comportement de l'hôte (10) sont surveillés en continu.
- Compare ton prix à 3 à 5 concurrents directs.
- Calendrier ouvert loin et réponses rapides comptent.
:::

## Catégories Prix (/15), Disponibilité (/10) et Comportement hôte (/10)

Trois catégories regroupées dans cette leçon parce qu'elles partagent un point commun : ce sont des signaux que l'algorithme de chaque plateforme surveille en continu, et qu'un hôte laisse dériver sans s'en rendre compte, contrairement au visuel ou au texte qu'on revoit au moins de temps en temps.

### Noter le Prix (/15)

- **Comparaison aux 3-5 concurrents directs (7 pts)** : identifie les annonces qui trustent le haut des résultats sur tes dates et ta zone. Un prix supérieur de plus de 15 % sans justification visible (équipement rare, emplacement) perd la majorité des points.
- **Cohérence de la structure tarifaire (4 pts)** : frais de ménage, caution, tarifs week-end vs semaine, tout ça doit rester lisible et ne pas créer de mauvaise surprise au moment de payer.
- **Ajustement selon la saison (4 pts)** : un prix figé toute l'année sur un marché saisonnier perd des points, qu'il soit trop haut en basse saison ou trop bas en haute saison.

### Noter la Disponibilité (/10)

- **Horizon d'ouverture du calendrier (6 pts)** : un calendrier ouvert sur moins de 3 mois pénalise lourdement le classement sur la plupart des plateformes. L'idéal se situe entre 6 et 12 mois.
- **Durée minimum de séjour adaptée (4 pts)** : un minimum de 7 nuits en pleine semaine basse saison ferme la porte à une grande partie de la demande réelle.

:::exemple
Calendrier ouvert sur 2 mois et minimum de 4 nuits en novembre : la disponibilité perd des points avant même que le voyageur voie le prix.
:::

### Noter le Comportement hôte (/10)

- **Taux de réponse (5 pts)** : sous 90 %, la plupart des algorithmes commencent à pénaliser visiblement l'annonce.
- **Délai de réponse et taux d'acceptation (5 pts)** : un délai supérieur à quelques heures ou un taux d'acceptation qui chute signale un hôte moins fiable, un signal que l'algorithme intègre directement dans le classement.

### Pourquoi ces 3 catégories sont les plus souvent négligées

Contrairement aux photos ou au texte, personne ne "voit" un mauvais taux de réponse ou un calendrier trop court en consultant sa propre annonce, ces données sont dans les statistiques de la plateforme, pas dans la fiche elle-même. C'est exactement pour ça qu'elles font l'objet d'un audit à part : elles se dégradent silencieusement.

**Concrètement** : ouvre les statistiques de ton compte hôte (Airbnb, Booking) et note ces trois catégories avant de continuer, plutôt que de te fier à ton impression générale.

:::astuce
Ces trois catégories se corrigent souvent en une heure de réglages, sans photo ni travaux : ce sont les premiers gains rapides à proposer.
:::

:::quiz
? Pourquoi ces trois catégories sont-elles souvent négligées ?
- Elles sont automatiques
* Elles dérivent sans qu'on s'en rende compte
- Elles ne comptent pas
= On revoit ses photos, rarement son calendrier ou son délai de réponse.
:::

:::quiz
? Comment noter ton prix ?
- Sans comparaison
* En le comparant à 3 à 5 logements concurrents
- En le comparant à un hôtel de luxe
= Seule la comparaison dit s'il est bien placé.
:::`,
        },
        {
          id: 6,
          title: 'Avis et badge Coup de Cœur : lire ce que la note ne dit pas',
          duration: '15 min',
          content: `:::bref
- Les avis comptent pour 15 points.
- Ne t'arrête pas à la moyenne : regarde la fraîcheur des avis.
- Le badge Coup de Cœur reflète plusieurs signaux à la fois.
:::

## Catégorie Avis (/15)

La formation Écrire des avis et répondre aux voyageurs couvre la rédaction et la sollicitation. Ici, l'objectif est différent : savoir noter la catégorie Avis dans un audit, en évitant l'erreur la plus fréquente, s'arrêter à la moyenne affichée.

### La répartition suggérée (/15)

- **Note moyenne (5 pts)** : sous 4,7, la plupart des programmes de mise en avant (type Coup de Cœur Voyageurs) deviennent inaccessibles, quel que soit le reste du score.
- **Vélocité des avis récents (6 pts)** : c'est le point le plus souvent oublié dans un audit rapide. Une annonce à 40 avis dont 12 dans les 90 derniers jours vaut mieux, pour le classement actuel, qu'une annonce à 200 avis mais quasiment inactive depuis des mois.
- **Contenu qualitatif des avis récents (4 pts)** : les 5 derniers avis mentionnent-ils des points positifs concrets réutilisables, ou seulement des formules courtes et vagues qui n'apportent ni preuve sociale forte ni matière pour la description ?

### Comment noter la vélocité concrètement

Compte le nombre d'avis reçus dans les 90 derniers jours et compare-le au rythme de séjours sur la même période. Un écart important, beaucoup de séjours mais peu d'avis, signale un problème de sollicitation, pas un problème de satisfaction : les deux causes appellent des corrections très différentes, d'où l'intérêt de bien distinguer ces deux points dans le score plutôt que de les mélanger.

:::exemple
Deux annonces notées 4,9. L'une a 3 avis sur les 6 derniers mois, l'autre 25. La seconde inspire beaucoup plus confiance : c'est ce que mesure la vélocité.
:::

### Le badge comme signal composite, pas comme catégorie séparée

Le badge Coup de Cœur Voyageurs (couvert en détail dans Optimiser son annonce Airbnb) n'a pas sa propre ligne dans le Score Annonce : il est la **conséquence** d'un bon score sur Avis, Comportement hôte et Visuel combinés, pas une catégorie à auditer séparément. Si le score obtenu sur ces trois catégories dépasse 80 % chacune et que le badge n'apparaît toujours pas, c'est un signal à surveiller dans le temps plutôt qu'à corriger dans l'immédiat : le badge se recalcule sur une fenêtre glissante.

**Concrètement** : calcule la vélocité des 90 derniers jours avant de noter cette catégorie. C'est la donnée la plus révélatrice et la plus souvent absente d'un audit fait au feeling.

:::quiz
? Quelle erreur faire en notant les avis ?
- Regarder les avis récents
- Lire les critiques
* S'arrêter à la note moyenne
= La fraîcheur des avis compte autant que la moyenne.
:::

:::quiz
? Que mesure la vélocité d'avis ?
- La longueur des avis
- Le nombre de photos
* Le rythme des avis récents
= Des avis réguliers montrent une qualité actuelle.
:::

:::action
titre: Vérifie tes performances
texte: Regarde ton remplissage et ton revenu par nuit disponible pour compléter ton audit.
lien: /dashboard/performances
bouton: Voir mes performances
:::`,
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
          content: `:::bref
- Les équipements réels comptent pour 10 points.
- Un équipement coché mais absent ou en panne déçoit le voyageur.
- Vérifie sur place, surtout si le logement est géré à distance.
:::

## Catégorie Équipements réels (/10)

C'est l'angle presque jamais traité ailleurs dans le catalogue : pas "comment lister ses équipements" mais "comment vérifier que ce qui est listé existe vraiment", un contrôle que la quasi-totalité des hôtes ne refont jamais après la création de l'annonce.

### Pourquoi cette catégorie a un poids dédié

Un équipement coché mais absent, en panne, ou différent de la photo est l'une des causes les plus fréquentes de déception à l'arrivée, et de mauvais avis qui en découle. Ce n'est pas un problème de classement algorithmique direct, c'est un problème de **confiance qui se répercute ensuite sur la catégorie Avis**, avec un décalage de plusieurs semaines qui rend la cause difficile à identifier sans audit dédié.

### La checklist de vérification (répartition suggérée : /10)

- **Test physique des équipements listés (4 pts)** : lave-linge, wifi, climatisation, chauffage, chacun testé, pas seulement visuellement présent.
- **Cohérence photo/réalité (3 pts)** : l'équipement visible en photo est-il toujours celui présent, à la bonne place, dans le bon état ?
- **Équipements réels non déclarés (2 pts)** : à l'inverse, un équipement présent mais non mentionné dans l'annonce fait perdre une opportunité de conversion, sans faire perdre de confiance, mais ça reste un point d'amélioration à noter.
- **Fraîcheur de la vérification (1 pt)** : la dernière vérification complète remonte-t-elle à moins de 6 mois ?

:::erreur
Déclarer « wifi rapide » sans l'avoir mesuré, ou un sèche-cheveux qui n'est plus là. Un équipement absent à l'arrivée coûte une étoile en « exactitude ».
:::

### Le cas particulier des logements gérés à distance

Pour un hôte qui ne visite plus son logement régulièrement, ou pour une conciergerie qui audite le bien d'un client, cette catégorie demande une vérification sur place ou via la personne en charge du ménage, pas uniquement une relecture de l'annonce depuis un ordinateur. C'est la seule catégorie du Score Annonce qui ne peut pas se noter entièrement à distance avec un niveau de confiance élevé.

**Concrètement** : si tu n'es pas allé physiquement dans le logement depuis plus de 6 mois, cette catégorie ne peut être notée qu'avec une réserve explicite dans le rapport final, plutôt qu'avec un score ferme, un point qui sera repris dans le module sur la restitution.

:::quiz
? Pourquoi vérifier les équipements sur place ?
- Pour les compter
- Ce n'est pas utile
* Un équipement coché mais absent fait baisser la note
= Le voyageur juge sur ce qui était promis.
:::

:::quiz
? Quand cette vérification est-elle la plus importante ?
- Jamais
- Seulement l'été
* Pour un logement géré à distance
= On voit moins souvent le logement, donc les écarts passent inaperçus.
:::`,
        },
        {
          id: 8,
          title: 'Règlement intérieur et photos trompeuses : le risque caché',
          duration: '15 min',
          content: `:::bref
- La conformité compte pour 5 points mais protège d'un gros risque.
- Règlement complet et photos fidèles évitent litiges et mauvais avis.
- Une photo trompeuse coûte bien plus qu'elle ne rapporte.
:::

## Catégorie Conformité (/5)

Seulement 5 points sur 100, mais une catégorie qui protège contre un risque disproportionné par rapport à son poids : le litige évitable et le mauvais avis lié à une attente non cadrée dès le départ.

### La checklist (répartition suggérée : /5)

- **Règlement intérieur présent et complet (2 pts)** : horaires, animaux, fêtes, fumeurs, nombre de voyageurs maximum, chacun explicitement mentionné plutôt que sous-entendu.
- **Mentions obligatoires selon le pays du logement (1 pt)** : numéro d'enregistrement si requis, informations de sécurité (détecteur de fumée, consignes incendie selon la réglementation locale).
- **Absence de retouche trompeuse (1 pt)** : recoupe ce qui a été vu dans la catégorie Visuel, mais du point de vue du risque juridique plutôt que de la conversion, une photo qui exagère significativement la réalité peut constituer un motif de contestation.
- **Politique d'annulation affichée sans ambiguïté (1 pt)** : condition déjà évoquée dans la catégorie Prix pour son impact sur la conversion, ici évaluée sous l'angle de la clarté contractuelle.

### Pourquoi ce point pèse peu mais coûte cher s'il est ignoré

Un règlement flou ne fait pas directement baisser un classement, mais il augmente la probabilité d'un incident (voyageur non déclaré, fête surprise, dégât contesté) qui, lui, dégrade ensuite la catégorie Avis pendant des mois. La formation Gérer les incidents et litiges en LCD détaille la gestion d'un incident une fois qu'il survient ; cette catégorie de l'audit sert à réduire la fréquence à laquelle ça arrive.

:::exemple
Photo de la piscine de la résidence, sans préciser qu'elle est fermée d'octobre à mai : un voyageur de novembre se sent trompé et le dit dans son avis.
:::

### Un score de 5/5 ne dispense pas de vigilance

Contrairement aux autres catégories, la Conformité peut passer de 5/5 à un score dégradé du jour au lendemain, un changement de réglementation locale, une nouvelle mention obligatoire. C'est la seule catégorie du Score Annonce qui mérite d'être revérifiée même quand rien n'a changé dans l'annonce elle-même.

**Concrètement** : ferme cette leçon en ayant vérifié une chose précise : ton règlement intérieur mentionne-t-il explicitement le nombre maximum de voyageurs autorisés ? C'est le point le plus souvent absent, et l'un des plus fréquemment source de litige.

:::quiz
? Pourquoi une catégorie de 5 points compte-t-elle autant ?
- Elle est décorative
* Elle évite des litiges et des avis négatifs coûteux
- Elle double la note
= Une attente mal cadrée crée des conflits.
:::

:::quiz
? Quel risque présente une photo trompeuse ?
- Aucun
* Un voyageur déçu et un avis négatif
- Plus de réservations sans effet
= La déception se paie dans les avis.
:::

:::action
titre: Fais le tour des équipements de ton logement
texte: Note dans ta fiche logement les équipements à réparer ou à retirer de l'annonce.
lien: /dashboard/logements
bouton: Ouvrir mes logements
:::`,
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
          content: `:::bref
- Un bon rapport d'audit tient sur une page.
- Quatre blocs : score, points forts, points faibles, actions.
- Adapte le ton au lecteur : toi, ou un propriétaire.
:::

## Du score au document

Une grille remplie de notes n'est pas encore un audit utilisable, ni pour toi-même dans six mois, ni pour un propriétaire qui doit comprendre ce qu'il faut faire. Cette leçon transforme le score en document lisible.

### Le format en une page

Un bon rapport d'audit tient sur une seule page, structurée en 4 blocs :

1. **Le score global et les 8 sous-scores**, présentés visuellement (une grille comme celle du module 1), pour donner une vue d'ensemble en 5 secondes.
2. **3 points forts**, nommés précisément. Un rapport qui ne liste que des problèmes décourage, même s'il est juste sur le fond.
3. **3 points faibles**, ceux dont le score est le plus bas rapporté à leur pondération, pas simplement les moins bons en valeur absolue. Une catégorie à 3/5 en Conformité est moins urgente qu'une catégorie à 8/20 en Visuel, même si l'écart en points semble comparable.
4. **Une action immédiate**, une seule, celle qui a le meilleur ratio impact/effort. Le module suivant détaille comment la choisir.

:::exemple
Une page : le score et sa répartition en haut, les 3 points forts, les 3 corrections prioritaires avec le gain attendu, puis la suite proposée. Rien de plus.
:::

### L'erreur du rapport de 40 lignes

Un audit exhaustif qui liste chaque défaut détecté, remarque par remarque, produit un document que personne ne termine de lire, encore moins d'appliquer. Le score sur 100 sert précisément à ça : il absorbe le détail dans une seule grille, et le rapport n'a besoin de développer en texte que ce qui sort vraiment du lot.

:::retenir
Un rapport se lit en 2 minutes ou ne se lit pas. Moins d'actions, mieux expliquées.
:::

### Adapter le ton selon le destinataire

- **Pour toi-même** : direct, sans ménagement, le but est l'efficacité, pas le moral.
- **Pour un propriétaire tiers** (si tu es conciergerie ou si tu prêtes main-forte à un autre hôte) : factuel, jamais accusateur. "La catégorie Visuel obtient 11/20" se lit très différemment de "tes photos ne sont pas terribles", pour un contenu presque identique. Le module 6 détaille cette nuance en profondeur.

**Concrètement** : prends le score que tu as calculé dans les modules précédents et mets-le en forme selon cette structure en une page, avant de passer à la leçon sur la priorisation.

:::quiz
? Combien de pages pour un rapport d'audit ?
* Une seule
- Au moins dix
- Aucune, à l'oral
= Un document court est lu et appliqué.
:::

:::quiz
? Par quoi commencer le rapport ?
- La liste des défauts
- Le prix de l'audit
* Le score global et les sous-scores
= Le lecteur voit d'abord la situation d'ensemble.
:::`,
        },
        {
          id: 10,
          title: 'Prioriser sans décourager : rapide / moyen / structurel',
          duration: '15 min',
          content: `:::bref
- Trois niveaux d'actions : rapide, moyen, structurel.
- Les actions rapides en premier : effet visible en deux semaines.
- Limite le rapport à quelques actions bien choisies.
:::

## Toutes les corrections ne se valent pas

Un rapport d'audit qui présente 12 actions à mener dans le désordre a le même défaut qu'une grille jamais transformée en document : personne ne sait par où commencer, et rien n'est fait. Cette leçon donne la méthode de classement qui résout ce problème.

### Les 3 niveaux

**Rapide (moins d'1 heure, effet visible sous 2 semaines).** Changer la photo de couverture, corriger une politique d'annulation trop stricte, répondre plus vite aux messages. Toujours l'action à mettre en premier dans un rapport, parce qu'un résultat rapide donne l'élan pour s'attaquer au reste.

**Moyen (quelques heures à quelques jours, effet sous 1 à 2 mois).** Réécrire la description, refaire une session photo complète, ajuster la structure tarifaire sur plusieurs semaines.

**Structurel (investissement ou changement d'organisation, effet sur plusieurs mois).** Rénover un espace, changer de channel manager, mettre en place un système de sollicitation d'avis automatisé, ce dernier point détaillé dans Annonce 360°.

:::exemple
**Rapide (moins d'une heure) :** changer la photo de couverture, ouvrir le calendrier à 12 mois.
**Moyen (une journée) :** refaire les photos.
**Structurel (des semaines) :** remplacer la literie, rénover la salle de bain.
:::

### La règle de classement

Classe chaque point faible identifié dans le rapport selon deux axes : l'effort nécessaire et l'impact attendu sur le score. Une action à fort impact et faible effort se place toujours en premier, même si elle semble mineure en apparence, c'est elle qui débloque le plus de valeur pour le moins de travail.

> Une seule action structurelle proposée en premier dans un rapport suffit à décourager 9 propriétaires sur 10. Commence toujours par ce qui se voit vite.

### Combien d'actions inclure dans un rapport

Au-delà de 5 actions listées simultanément, l'attention du lecteur chute fortement, qu'il s'agisse de toi-même relisant ton propre rapport dans 3 mois, ou d'un propriétaire qui le découvre pour la première fois. Garde toujours les actions restantes en réserve pour un second passage, plutôt que de tout lister d'un coup.

**Concrètement** : reprends les points faibles identifiés dans ton rapport et classe-les en rapide / moyen / structurel avant de continuer. C'est ce classement, pas le score lui-même, qui rend un audit réellement actionnable.

:::quiz
? Qu'est-ce qu'une action rapide ?
* Moins d'une heure, effet visible en deux semaines
- Des travaux de cuisine
- Changer de ville
= Exemple : changer la photo de couverture.
:::

:::quiz
? Combien d'actions mettre dans le rapport ?
- Le plus possible
- Une seule pour toute l'année
* Quelques actions prioritaires
= Trop d'actions découragent et rien n'est fait.
:::

:::action
titre: Planifie tes 3 actions rapides
texte: Ajoute-les dans ton calendrier cette semaine.
lien: /dashboard/calendrier
bouton: Ouvrir mon calendrier
:::`,
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
          content: `:::bref
- L'audit gratuit sert de porte d'entrée vers un mandat de gestion.
- L'audit payant est une prestation ponctuelle.
- Choisis selon ton objectif : signer des mandats ou vendre un service.
:::

## Deux modèles, deux objectifs différents

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

**Concrètement** : détermine dès maintenant lequel des deux objectifs correspond à ta situation, cette décision conditionne directement la façon de présenter l'audit, traitée dans la dernière leçon.

:::astuce
Si l'audit gratuit sert à trouver des clients, limite-le à 3 recommandations : assez pour prouver ta valeur, pas assez pour faire le travail gratuitement.
:::

:::quiz
? À quoi sert un audit gratuit pour une conciergerie ?
* Ouvrir la discussion vers un mandat de gestion
- Gagner de l'argent immédiatement
- Remplacer le contrat
= Il montre ton expertise avant la signature.
:::

:::quiz
? Quand proposer un audit payant ?
- Jamais
- À tous tes clients en gestion
* Quand le propriétaire veut un diagnostic sans déléguer la gestion
= C'est une prestation ponctuelle autonome.
:::`,
        },
        {
          id: 12,
          title: 'Présenter un audit sans braquer, et le transformer en mandat',
          duration: '20 min',
          content: `:::bref
- Même un audit juste peut braquer s'il est mal présenté.
- Commence par le score et les points forts, puis les priorités.
- Propose la suite sans forcer la main.
:::

## Le rapport le plus juste peut quand même braquer

Un audit techniquement irréprochable peut échouer complètement s'il est mal présenté. Un propriétaire qui reçoit une liste de défauts sur son bien, même factuelle, réagit d'abord émotionnellement, pas rationnellement. Cette dernière leçon donne la structure de présentation qui évite ce piège.

### Les 4 étapes d'une restitution qui fonctionne

**1. Commence toujours par le score global et les points forts.** Avant même d'évoquer un seul point faible, situe le propriétaire : "Ton annonce obtient 68/100, avec un très bon score sur les avis." Ça installe une posture d'expert bienveillant, pas de censeur.

**2. Présente les points faibles comme des opportunités, pas des fautes.** "La catégorie Visuel est à 11/20, c'est le plus gros potentiel de progression rapide" se reçoit très différemment de "tes photos sont mauvaises", pour un diagnostic identique. Le vocabulaire du rapport (leçon 9) fait toute la différence à l'oral aussi.

**3. Propose l'action rapide en premier, jamais la liste complète d'un coup.** Reprends le classement du module précédent : une seule action à fort impact et faible effort, présentée concrètement, donne au propriétaire un sentiment de contrôle plutôt que d'être dépassé.

**4. Laisse la porte ouverte sans forcer.** Termine toujours par une question, pas une offre commerciale directe : "Tu veux qu'on regarde ensemble comment mettre ça en place, ou tu préfères essayer seul dans un premier temps ?" Un propriétaire qui se sent poussé se braque, un propriétaire à qui on laisse le choix revient plus souvent de lui-même.

:::exemple
« Votre annonce a de vrais atouts : les avis sur l'accueil sont excellents. Trois points freinent les réservations, et deux se corrigent cette semaine. » On commence par ce qui va bien, puis on chiffre ce qui peut changer.
:::

### Transformer un audit en mandat, sans forcer la main

Si l'objectif est la prospection (leçon précédente), la transition vers un mandat de gestion se fait presque toujours après, pas pendant la restitution de l'audit lui-même. Un audit qui se termine par un pitch commercial immédiat perd la confiance installée dans les 3 premières étapes. Le bon rythme : restitution de l'audit, un délai de quelques jours pour que le propriétaire digère l'information, puis une relance qui propose explicitement la gestion complète, en s'appuyant sur les points faibles identifiés ensemble.

> Un audit qui débouche sur un mandat n'est jamais celui qui a le rapport le plus complet. C'est celui dont la restitution a le mieux respecté ces 4 étapes.

:::erreur
Proposer ton mandat avant d'avoir expliqué le diagnostic. Le propriétaire doit d'abord comprendre ce qui coince, puis voir comment tu peux l'aider.
:::

### La boucle complète

Cette formation part du score, passe par le rapport, et se termine par la conversation qui donne à ce travail sa vraie valeur. Un audit jamais restitué correctement, aussi rigoureux soit le score, ne produit aucun résultat, ni pour un usage personnel (tu ne le relis jamais), ni pour un usage commercial (le propriétaire ne donne pas suite).

**C'est la fin de la formation.** La prochaine étape : choisis une annonce, la tienne ou celle d'un premier client, et fais tourner la grille complète de bout en bout avant que la méthode ne se dilue dans la théorie.

:::quiz
? Par quoi commencer la restitution d'un audit ?
- La liste complète des défauts
- Le tarif du mandat
* Le score et les points forts
= Un propriétaire réagit d'abord émotionnellement : valorise avant de critiquer.
:::

:::quiz
? Comment transformer un audit en mandat ?
- Exiger une signature immédiate
- Critiquer le propriétaire
* Proposer de prendre en charge les actions, sans pression
= Le propriétaire décide mieux quand il ne se sent pas poussé.
:::

:::action
titre: Estime les revenus du logement audité
texte: Ajoute une estimation chiffrée à ton rapport pour convaincre.
lien: /dashboard/calculateurs#revenus
bouton: Estimer les revenus
:::`,
        },
      ],
    },
  ],
}
