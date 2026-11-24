// Formation « Louer en direct sans plateforme, en toute sécurité » (26/10/2026).
// Née d'une suggestion d'hôte (formulaire « Suggérer une formation ») :
// vérifier l'identité des voyageurs, s'assurer, faire un contrat, savoir s'il
// faut un juriste. Faits vérifiés le 26/10/2026, sources citées dans chaque
// leçon ; ne décrit que des fonctions de l'app qui existent (contrats, caution
// par empreinte, Sécurité voyageur, déclarations voyageurs, factures).
export const LOUER_EN_DIRECT_FORMATION = {
  slug: 'louer-en-direct-securise',
  title: 'Louer en direct sans plateforme, en toute sécurité',
  description: `Vérifier l'identité des voyageurs sans enfreindre la loi, choisir la bonne assurance, faire un contrat solide, encaisser sans risque, respecter la taxe de séjour et la fiche de police : tout ce qu'Airbnb faisait pour toi, et comment le faire toi-même, sereinement.`,
  duration: '3h',
  level: 'Intermédiaire',
  objectifs: [
    "Savoir exactement ce qu'une plateforme faisait pour toi, et ce que tu dois reprendre en main",
    "Vérifier l'identité d'un voyageur sans garder de copie de sa pièce d'identité (ce que la CNIL refuse)",
    'Repérer les arnaques qui visent les propriétaires avant de perdre un euro',
    'Rédiger un contrat de location saisonnière conforme et choisir entre arrhes et acompte',
    'Encaisser le loyer et la caution sans risque de faux virement ni de mauvaise surprise',
    'Choisir une assurance qui couvre vraiment la location courte durée',
    'Respecter tes obligations : taxe de séjour, numéro d\'enregistrement, fiche de police, données personnelles',
    'Savoir quand un juriste est utile, et quand tu peux t\'en passer',
  ],
  modules: [
    {
      id: 1,
      title: 'Passer au direct sans tout casser',
      duration: '30 min',
      lessons: [
        {
          id: 1,
          title: 'Ce que la plateforme faisait pour toi (et que tu vas reprendre)',
          duration: '15 min',
          content: `:::bref
- Depuis le 13 octobre 2026, Airbnb prélève 15,5 % à l'hôte, soit 18,6 % avec la TVA.
- La plateforme ne faisait pas que prendre une commission : vérification, paiement, garantie, médiation.
- En direct, ces protections sont à reprendre toi-même, et c'est faisable.
:::

## Pourquoi tant d'hôtes regardent vers le direct

Depuis le 13 octobre 2026, Airbnb applique dans l'Espace économique européen un **frais d'hôte unique de 15,5 %** sur chaque réservation, soit **18,6 % avec la TVA** sur cette commission. Avant, l'hôte payait environ 3 % et le voyageur le reste. Sur un séjour de 1 000 €, c'est désormais 186 € qui partent avant même que tu aies fait le ménage.

Ajoute à ça les règles que tu ne choisis pas : politique d'annulation, arbitrage des litiges, suspension de compte possible du jour au lendemain. Beaucoup d'hôtes veulent reprendre la main.

> Ce chiffre est celui qu'on utilise dans tous les outils de l'app (Mes prix, Rentabilité, calculateurs). Vérifie toujours tes conditions dans ton espace Airbnb : elles peuvent varier selon ton compte.

## Le vrai sujet : la plateforme ne faisait pas que prendre une commission

Quand un voyageur réserve sur Airbnb ou Booking, la plateforme fait 8 choses pour toi sans que tu le voies. En direct, ces 8 briques deviennent les tiennes.

| Ce que faisait la plateforme | Ce que tu fais en direct | Où on le voit |
| --- | --- | --- |
| Vérifier un minimum le voyageur | Vérifier son identité et son sérieux | Module 2 |
| Rédiger les conditions | Faire un contrat écrit | Module 3 |
| Encaisser le paiement | Encaisser par carte ou virement, sans arnaque | Module 3 |
| Gérer une caution ou une garantie | Bloquer une caution | Module 3 |
| Garantie hôte (AirCover…) | Avoir ta propre assurance | Module 4 |
| Collecter la taxe de séjour | La collecter et la reverser toi-même | Module 5 |
| Afficher ton numéro d'enregistrement | L'afficher sur chacune de tes annonces | Module 5 |
| Arbitrer les litiges | Avoir des preuves et savoir te faire aider | Module 6 |

### La bonne nouvelle

Aucune de ces briques n'est compliquée. Il faut juste les poser **une fois**, proprement. Ensuite, chaque réservation directe se gère en quelques minutes, et elle te rapporte la commission que tu ne verses plus.

✅ Tu fixes tes règles (annulation, caution, animaux)
✅ Tu connais ton voyageur et tu gardes le contact
✅ Tu gardes la commission
❌ Tu n'as plus de service client pour arbitrer à ta place : d'où l'importance des preuves et du contrat

:::exemple
Ce qu'Airbnb faisait sans que tu le voies : encaisser le paiement, garder une caution, vérifier l'identité, arbitrer un litige, collecter la taxe de séjour. En direct, chacune de ces tâches devient la tienne : cette formation te montre comment.
:::

## À retenir

Le direct n'est pas « Airbnb en moins bien ». C'est un autre métier : tu deviens ta propre plateforme. Cette formation te donne les 8 briques, dans l'ordre.

:::quiz
? Sur un séjour de 1 000 €, combien part en frais Airbnb TVA comprise ?
- 30 €
- 100 €
* 186 €
= 1 000 × 18,6 % = 186 € depuis le 13 octobre 2026.
:::

:::quiz
? Que faisait la plateforme en plus de prendre une commission ?
- Faire le ménage
* Vérifier, encaisser, garantir et arbitrer les litiges
- Rien d'autre
= En direct, tu reprends ces rôles avec les bons outils.
:::`,
        },
        {
          id: 2,
          title: 'Où trouver tes voyageurs en direct (et le rôle de Driing)',
          duration: '15 min',
          content: `:::bref
- Garde les plateformes et construis le direct à côté.
- Cinq sources : anciens voyageurs, bouche-à-oreille, fiche Google, réseaux, Driing (je suis co-fondateur).
- Le premier frein du voyageur est la peur : rassure-le.
:::

## Garde les plateformes, ajoute le direct

Ne coupe pas Airbnb ou Booking du jour au lendemain. Ils t'apportent la visibilité de masse. Le direct se construit à côté, réservation après réservation, jusqu'à représenter une vraie part de tes revenus.

## Les 5 sources de réservations directes

### 1. Tes anciens voyageurs

C'est la source la plus rentable. Un voyageur content qui revient l'année suivante n'a plus besoin de plateforme. Garde ses coordonnées (avec son accord, voir module 5) et donne-lui une raison de revenir en direct : un tarif fidélité, une nuit offerte, une arrivée plus tôt.

:::exemple
Un voyageur enchanté l'été dernier reçoit en janvier : « Les dates de juillet ouvrent, vous avez la priorité, et en direct c'est 5 % de moins. » C'est souvent la première réservation directe, et la plus simple.
:::

### 2. Le bouche-à-oreille

Collègues, amis, voisins, familles de tes voyageurs. Une carte dans le logement avec ton lien de réservation fait déjà beaucoup.

### 3. Ta fiche Google

Les voyageurs cherchent « location + ville » sur Google. Une fiche bien tenue avec de bons avis t'apporte des demandes directes. La formation **Google My Business LCD** et l'outil **Fiche Google** de l'app (Trouver des voyageurs) t'aident à la soigner.

### 4. Les groupes Facebook et les réseaux

Les groupes locaux et les groupes de voyageurs acceptent souvent les annonces. L'onglet **Groupes Facebook** de l'app te donne des groupes où publier et des textes prêts à coller.

### 5. Une plateforme de réservation directe : Driing

Driing est une plateforme de réservation pensée pour les hôtes qui veulent développer leur canal direct. Tu y publies ton logement avec **tes propres conditions**, tu encaisses les paiements en direct, et Driing ne prend **pas de commission par réservation** comme les plateformes classiques. Le voyageur réserve sur une plateforme qui sécurise le paiement et la confiance, ce qui lève une bonne partie de ses craintes.

> Transparence : je suis co-fondateur de Driing. Je t'en parle parce que c'est exactement le problème qu'on a voulu résoudre, pas parce que c'est obligatoire. Tout ce que tu apprends ici vaut aussi pour une réservation par téléphone ou par message.

## Le premier frein du voyageur : la peur

Le voyageur aussi a peur de réserver en direct : peur de l'arnaque, de payer pour un logement qui n'existe pas. Rassure-le avec ce que tu vas mettre en place dans cette formation :

- un **contrat écrit** clair, signé en ligne
- un **paiement par carte** sur une page sécurisée (pas un virement à un inconnu)
- ton **numéro d'enregistrement** et tes avis visibles
- une **caution expliquée** : bloquée, jamais débitée sans raison

Pour attirer les voyageurs (site, Google, réseaux), la formation **Annonce Directe** va plus loin. Ici, on se concentre sur la sécurité : à qui tu loues, comment tu encaisses, comment tu te protèges.

:::quiz
? Quelle est la source de réservations directes la plus rentable ?
* Tes anciens voyageurs
- Les inconnus sur internet
- Les petites annonces gratuites
= Ils te connaissent déjà et n'ont plus besoin de la plateforme.
:::

:::quiz
? Faut-il quitter Airbnb pour faire du direct ?
- Oui, mais seulement l'été
* Non, le direct se construit à côté
- Oui, tout de suite
= Les plateformes t'apportent la visibilité qui alimente ensuite le direct.
:::

:::action
titre: Prépare une affiche pour ton logement
texte: Invite tes voyageurs à revenir en direct avec un QR code dans le logement.
lien: /dashboard/outils-impression
bouton: Créer mon affiche
:::`,
        },
      ],
    },
    {
      id: 2,
      title: 'Savoir à qui tu loues',
      duration: '35 min',
      lessons: [
        {
          id: 21,
          title: "Vérifier l'identité d'un voyageur, dans les règles",
          duration: '20 min',
          content: `:::bref
- Tu peux demander à voir la pièce d'identité, pas en garder une copie (CNIL).
- La fiche de police est obligatoire pour les voyageurs étrangers et se garde 6 mois.
- Un outil de vérification d'identité sérieux renforce la sécurité.
:::

## Ce que tu as le droit de faire (et ce qui est interdit)

La règle surprend beaucoup d'hôtes : **tu n'as pas le droit de garder une copie de la pièce d'identité** de ton voyageur. La CNIL l'a dit clairement pour les hébergeurs : photocopie, scan et photo de la pièce sont exclus. Tu peux en revanche **demander à voir** la pièce, par exemple pour vérifier la nationalité ou que la personne qui arrive est bien celle qui a réservé.

> Source : position de la CNIL rappelée par Maître Reda Kohen (kohenavocats.fr, octobre 2026) et service-public.fr, fiche F33458.

### La fiche de police, seule obligation écrite

Pour un voyageur **de nationalité étrangère** (y compris un Européen), tu dois lui faire remplir et signer une **fiche individuelle de police** dès son arrivée, la garder **6 mois**, et la remettre à la police ou à la gendarmerie **seulement si elles la demandent**. La liste des informations est fermée : nom, date et lieu de naissance, nationalité, domicile habituel, téléphone et e-mail, date d'arrivée et de départ prévue. Pas de photo, pas de numéro de passeport.

> Source : articles R814-1 à R814-3 du CESEDA (Légifrance), service-public.fr fiche F33458, modèle officiel R71162.

Dans l'app, la fiche se prépare toute seule : dès qu'un voyageur indique une nationalité différente du pays du logement (à la signature du contrat ou quand tu saisis son séjour), une déclaration apparaît dans **Mes voyageurs → Déclarations**.

## Comment vérifier sérieusement, en pratique

### Niveau 1 : les vérifications gratuites (pour tout le monde)

- **Le nom sur la carte bancaire** correspond au nom de la réservation. Si le paiement passe par un lien de paiement par carte, c'est le voyageur qui paie, pas un tiers.
- **Un échange avant d'accepter** : un appel ou quelques messages. Pourquoi ce séjour, avec qui, à quelle heure d'arrivée. Une personne pressée qui évite toute question est un signal.
- **La base Sécurité voyageur de l'app** : tape l'e-mail, le téléphone ou le nom. Elle te dit si d'autres hôtes de la communauté ont signalé ce voyageur (ou ont laissé un bon retour). Tes prochains voyageurs y sont vérifiés automatiquement.
- **À l'arrivée** : tu demandes à voir la pièce d'identité, tu vérifies le nom, tu ne la photographies pas.

### Niveau 2 : un outil de vérification d'identité

Pour un logement haut de gamme, des arrivées autonomes ou beaucoup de réservations directes, un outil fait la vérification à ta place : le voyageur photographie sa pièce et prend un selfie, l'outil compare les deux et te donne un résultat.

| Outil | Ce qu'il fait | Prix indicatif relevé en 2026 |
| --- | --- | --- |
| Stripe Identity | Pièce d'identité + selfie, intégré aux paiements Stripe | Environ 1,50 $ par vérification réussie (France en bêta) |
| Chekin | Enregistrement en ligne des voyageurs, vérification par passeport en France | Environ 4 à 5 € par logement et par mois |
| Truvi (ex-Superhog) | Filtrage des voyageurs et protection contre les dégâts | À partir d'environ 13,80 £ par réservation |

> Sources : documentation Stripe Identity (docs.stripe.com/identity), page « Chekin by the numbers 2026 », comparatif Lodgify 2026. Les prix changent : vérifie-les sur le site de l'outil avant de t'engager.

### Ce que tu dois exiger d'un outil

- Qu'il **vérifie sans te laisser une copie** de la pièce à conserver, ou qu'il la supprime vite et le dise clairement dans sa politique de confidentialité.
- Qu'il soit **conforme au RGPD** et héberge les données dans l'Union européenne si possible.
- Que le voyageur soit **informé** avant la vérification (une phrase dans ton message de réservation suffit).

:::erreur
Demander une photo de la pièce d'identité par message et la garder dans ton téléphone. Si tu vérifies une identité, fais-le avec un outil sécurisé et ne conserve que ce que la loi demande.
:::

## À retenir

✅ Voir la pièce, vérifier le nom, faire remplir la fiche de police aux étrangers
✅ Payer par carte au nom du voyageur
✅ Vérifier le voyageur dans la base Sécurité voyageur
❌ Photocopier, scanner ou photographier la pièce d'identité

:::quiz
? As-tu le droit de garder une photocopie de la pièce d'identité du voyageur ?
- Oui, toujours
- Oui, si elle est en couleur
* Non, tu peux seulement la voir
= La CNIL exclut photocopie, scan et photo pour les hébergeurs.
:::

:::quiz
? Combien de temps garder une fiche de police ?
* 6 mois
- 10 ans
- Une semaine
= Articles R814-1 à R814-3 du CESEDA.
:::`,
        },
        {
          id: 22,
          title: 'Les arnaques qui visent les propriétaires',
          duration: '15 min',
          content: `:::bref
- Les arnaques du direct font croire qu'un paiement est arrivé, puis réclament de l'argent.
- Faux virement bloqué, trop-perçu, contrat pré-rempli, paiement imposé hors de ton outil.
- Règle d'or : l'argent n'est reçu que lorsqu'il est sur ton compte.
:::

## Le direct attire aussi les escrocs

Sans plateforme entre vous, certains faux voyageurs tentent leur chance. Les arnaques se ressemblent toutes : on te fait croire qu'un paiement est arrivé, puis on te demande de l'argent.

## Les 4 arnaques les plus courantes

### 1. Le faux virement « bloqué »

Le « voyageur » envoie une capture d'écran de virement (parfois aux couleurs d'une banque, de La Poste ou de MoneyGram) et explique qu'il faut payer de petits « frais de déblocage » pour que l'argent arrive. Un cas signalé en Charente portait sur 53 €. L'argent n'existe pas.

### 2. Le trop-perçu

Le voyageur « se trompe » et paie plus que prévu (souvent par chèque ou virement qui sera annulé), puis te demande de lui rembourser la différence. Tu rembourses avec ton vrai argent, son paiement disparaît.

:::exemple
« J'ai fait un virement de 1 200 € au lieu de 800 €, pouvez-vous me rembourser 400 € ? » Le premier virement était faux ou sera annulé. Règle : aucun remboursement tant que l'argent n'est pas définitivement sur ton compte, vérifié dans ta banque.
:::

### 3. Le contrat pré-signé avec ton RIB

Tu envoies un contrat déjà signé avec ton RIB : l'escroc dispose alors de ta signature et de tes coordonnées bancaires pour monter une fausse demande de prélèvement ou de virement. Envoie le contrat **non signé**, c'est le voyageur qui signe en premier.

### 4. Le paiement « hors plateforme » imposé

Mandat cash, coupons prépayés, crypto, virement vers un tiers : aucun voyageur honnête n'a besoin de ça.

> Sources : Boursorama et Actual-immo (alertes sur les faux touristes), Les clés de la banque (Fédération bancaire française), arnaques-location-vacances.com.

## Tes 6 règles d'or

✅ Vérifie un virement **sur ton propre compte bancaire**, jamais sur une capture d'écran
✅ Préfère un **lien de paiement par carte** : l'argent est réellement encaissé avant le séjour
✅ Envoie le contrat **non signé** : le voyageur signe d'abord
✅ Ne rembourse **jamais** un trop-perçu avant que le paiement soit définitivement sur ton compte
❌ Ne paie **jamais** de « frais » pour recevoir un paiement
❌ N'accepte pas de payeur différent du voyageur sans explication claire

### Le signal qui ne trompe pas

Une histoire compliquée, de l'urgence, et toi qui dois sortir de l'argent. Si les trois sont réunis, arrête l'échange. Tu peux signaler la personne dans **Sécurité voyageur** : la base protège les autres hôtes, et l'onglet des arnaques du moment t'aide à reconnaître les nouvelles techniques.

:::retenir
Un voyageur pressé qui insiste pour payer autrement, rembourser une différence ou signer un contrat déjà rempli : stop. L'urgence est l'outil préféré des escrocs.
:::

:::quiz
? Un voyageur envoie une capture de virement et te demande des frais de déblocage. Que faire ?
* Refuser : c'est une arnaque classique
- Payer les frais
- Lui donner ta carte bancaire
= Aucune banque ne demande au bénéficiaire de payer pour recevoir un virement.
:::

:::quiz
? Quand considérer un paiement comme reçu ?
* Quand il apparaît réellement sur ton compte
- Quand le voyageur envoie une capture
- Quand il le promet par message
= Une capture d'écran se falsifie facilement.
:::

:::action
titre: Active l'encaissement par carte
texte: Encaisse par lien de paiement sécurisé plutôt que par virement.
lien: /dashboard/contrats
bouton: Ouvrir mes contrats
:::`,
        },
      ],
    },
    {
      id: 3,
      title: "Le contrat et l'argent",
      duration: '45 min',
      lessons: [
        {
          id: 31,
          title: 'Le contrat de location saisonnière : ce qu\'il doit contenir',
          duration: '25 min',
          content: `:::bref
- Un contrat écrit est obligatoire, même pour une nuit (article L324-2 du Code du tourisme).
- Arrhes ou acompte : le choix change tout en cas d'annulation.
- Pas de droit de rétractation de 14 jours pour une location à date fixe.
:::

## Un écrit est obligatoire, même pour une nuit

Le Code du tourisme impose que toute offre ou tout contrat de location saisonnière soit **écrit**, avec le **prix demandé** et un **état descriptif des lieux**. Un échange de messages ne suffit pas.

> Source : article L324-2 du Code du tourisme (Légifrance).

## Les mentions à mettre dans ton contrat

- **Les parties** : ton identité et tes coordonnées (ou celles de ta société), celles du voyageur
- **Le logement** : adresse, et **état descriptif** (type, surface, pièces, couchages, salles d'eau, équipements), classement s'il est classé
- **Ton numéro d'enregistrement** quand ta commune l'impose
- **Les dates** d'arrivée et de départ, les heures
- **Le nombre maximum d'occupants**
- **Le prix total** : loyer, frais de ménage, charges, et la **taxe de séjour** (comprise ou en plus)
- **Les modalités de paiement** : montant versé à la réservation, solde, moyens de paiement
- **La nature de la somme versée** : arrhes ou acompte (voir plus bas)
- **La caution** : montant, forme (empreinte bancaire, virement), délai de restitution
- **Les conditions d'annulation**, des deux côtés
- **Le règlement intérieur** : animaux, fêtes, tabac, bruit, visiteurs

> Sources : article L324-2 du Code du tourisme ; modèles et guides 2026 (Hellobail, Qalimo, LegalPlace).

## Arrhes ou acompte : le choix qui change tout en cas d'annulation

Si ton contrat ne dit rien, la somme versée à la réservation est considérée comme des **arrhes**.

| | Arrhes | Acompte |
| --- | --- | --- |
| Le voyageur annule | Il perd les arrhes | Il reste redevable du prix total |
| Tu annules | Tu rembourses le double des arrhes | Le voyageur peut demander des dommages et intérêts |
| Souplesse | Chacun peut se retirer en perdant la somme | Engagement ferme des deux côtés |

> Source : article 1590 du Code civil ; Maître Reda Kohen, « Location de vacances annulée : arrhes ou acompte » (juillet 2026).

### Combien demander à la réservation ?

Entre un propriétaire particulier et un voyageur, **aucun plafond légal** n'est fixé : 25 à 30 % du séjour est l'usage. La limite de 25 % qu'on lit souvent vise les **professionnels de l'immobilier** (agences), pas toi.

> Sources : guide-immobilier.fr (2026) ; décret n° 72-678 du 20 juillet 1972, qui encadre les agents immobiliers.

:::exemple
Séjour de 800 €, 30 % versés à la réservation (240 €).
**Arrhes :** si le voyageur annule, il perd les 240 € ; si c'est toi qui annules, tu lui rends le double, 480 €.
**Acompte :** la réservation est ferme des deux côtés, le solde reste dû en principe en cas d'annulation.
:::

## Pas de droit de rétractation de 14 jours

Une location de vacances pour des **dates précises** n'ouvre pas le droit de rétractation de 14 jours, même réservée en ligne. Ce sont **tes conditions d'annulation** qui s'appliquent : écris-les clairement.

> Source : article L221-28, 12° du Code de la consommation (Légifrance).

:::retenir
Une location de vacances à une date précise n'ouvre pas de droit de rétractation de 14 jours. Ce sont tes conditions d'annulation écrites qui s'appliquent : écris-les clairement.
Source : Code de la consommation, article L. 221-28.
:::

## Le contrat dans l'app

Le module **Contrats & paiements** (formule Standard) génère un contrat qui reprend tout seul l'état descriptif de ta fiche logement, ton numéro d'enregistrement, le prix, la taxe de séjour, arrhes ou acompte, la caution et tes clauses particulières. Le voyageur le signe en ligne, en français, en portugais ou en anglais. Tu peux voir le contrat complet avant de l'envoyer.

## À retenir

Un bon contrat ne sert pas qu'en cas de litige : il rassure le voyageur et évite la plupart des malentendus (heure d'arrivée, nombre de personnes, ce qui est inclus). Prends le temps de l'écrire une fois, proprement.

:::quiz
? Qu'impose l'article L324-2 du Code du tourisme ?
- Un simple message suffit
- Un acte notarié
* Un écrit avec le prix et un état descriptif des lieux
= Toute location saisonnière doit faire l'objet d'un contrat écrit.
:::

:::quiz
? Le voyageur a-t-il 14 jours pour se rétracter ?
* Non, pas pour une location à date déterminée
- Oui, toujours
- Oui, s'il paie par carte
= L'article L221-28 du Code de la consommation exclut ce droit.
:::`,
        },
        {
          id: 32,
          title: 'Encaisser le loyer et la caution sans risque',
          duration: '20 min',
          content: `:::bref
- Le paiement par carte est réellement reçu ; le virement peut être falsifié.
- La caution par empreinte bancaire bloque une somme sans la débiter.
- Une empreinte ne dure qu'environ 7 jours : l'app la renouvelle pour toi.
:::

## Carte ou virement : le match

| | Lien de paiement par carte | Virement bancaire |
| --- | --- | --- |
| Argent réellement reçu | Oui, au moment du paiement | Seulement quand il apparaît sur ton compte |
| Risque de faux justificatif | Aucun | Élevé (module 2) |
| Coût | Frais de paiement (voir plus bas) | Gratuit |
| Payeur vérifié | La banque du voyageur authentifie le paiement (3D Secure) | Tu ne sais pas qui paie |
| Caution | Possible par empreinte bancaire | Il faut un second virement, à rembourser |

Le paiement par carte coûte un peu, mais il supprime la principale arnaque et rassure le voyageur.

## La caution par empreinte bancaire

Une caution par carte n'est **pas un paiement** : la banque du voyageur met le montant de côté, **rien ne quitte son compte**. Après le séjour, tu libères tout, ou tu retiens une partie si tu as constaté des dégâts.

### La limite à connaître : environ 7 jours

Une carte ne reste bloquée qu'**environ 7 jours** (Visa, Mastercard, Amex pour un paiement en ligne). Si tu bloques la caution 10 jours avant l'arrivée, elle tombe avant même le séjour.

- Bloque la caution **juste avant l'arrivée** (2 jours avant, c'est bien)
- Pour un séjour de **plus de 4 nuits**, préfère une caution par virement, à rembourser après le départ

> Source : règles de durée d'autorisation des réseaux de cartes, documentation Stripe (vérifié le 05/10/2026).

:::exemple
Séjour du 1er au 10 août, empreinte prise le 25 juillet à la réservation : elle expire avant même l'arrivée. Prends-la juste avant l'arrivée, ou utilise un outil qui la renouvelle.
:::

## Ce que fait l'app pour toi

Dans **Contrats & paiements**, une fois ton compte Stripe connecté (Mon compte → Encaissements) :

- Le voyageur reçoit le **lien de paiement** du loyer après sa signature. Tu peux demander un acompte de 50 %, le solde étant réglé à l'arrivée.
- Le lien de **caution** ne s'ouvre que **2 jours avant l'arrivée**, et l'app l'envoie toute seule ce jour-là.
- Après le départ, tu choisis : **libérer** (rien n'est prélevé) ou **retenir une somme**, avec un motif. Le voyageur reçoit un e-mail dans les deux cas.
- **Aucune commission sur tes réservations** : seuls des frais de paiement en ligne s'appliquent, **2 % + 0,30 €** par paiement avec une carte européenne. Une caution libérée ne coûte rien.

## Le solde et la facture

- Si tu demandes un acompte, écris dans le contrat **quand et comment** le solde est payé.
- Si ton voyageur a besoin d'une facture (déplacement professionnel), l'app la génère depuis sa fiche, avec une numérotation qui se suit sans trou.

## À retenir

✅ Carte pour le loyer, empreinte pour la caution, bloquée juste avant l'arrivée
✅ Virement accepté seulement s'il est visible sur ton compte avant l'arrivée
❌ Jamais de remise de clés contre une simple capture d'écran

:::quiz
? Quel moyen de paiement évite le risque de faux justificatif ?
* Le lien de paiement par carte
- Le virement annoncé par capture
- Les espèces envoyées par courrier
= La banque du voyageur authentifie le paiement.
:::

:::quiz
? Combien de temps dure une empreinte bancaire ?
* Environ 7 jours
- Un an
- Une heure
= Pour un long séjour, elle doit être renouvelée.
:::

:::action
titre: Prépare ton premier contrat direct
texte: Remplis ta fiche logement puis crée un contrat avec loyer et caution.
lien: /dashboard/contrats
bouton: Créer un contrat
:::`,
        },
      ],
    },
    {
      id: 4,
      title: "S'assurer correctement",
      duration: '30 min',
      lessons: [
        {
          id: 41,
          title: 'Ce que ton assurance actuelle ne couvre (probablement) pas',
          duration: '15 min',
          content: `:::bref
- Aucune loi n'oblige à s'assurer, mais un assureur non prévenu peut refuser de payer.
- Préviens ton assureur par écrit de la location courte durée.
- En direct, la garantie de la plateforme ne joue plus.
:::

## Pas d'obligation légale, mais un vrai risque

Aucune loi n'oblige un loueur de meublé de tourisme à s'assurer. Mais louer sans le dire à ton assureur, c'est prendre le risque qu'il **refuse de payer** le jour du sinistre.

> Source : Portaki, « Assurance location saisonnière : obligation, garanties et angles morts » (2026).

### Préviens ton assureur par écrit

La mise en location courte durée change le risque (plus de passage, des inconnus dans le logement). Ton contrat t'oblige à déclarer ce changement. Fais-le **par écrit, avant la première location**, et garde la réponse.

> Source : article L113-2 du Code des assurances (déclaration des circonstances qui aggravent le risque).

:::astuce
Envoie un e-mail à ton assureur : « Je loue ce logement en location courte durée, environ X nuits par an. Suis-je couvert ? » La réponse écrite vaut mieux qu'une conversation au téléphone.
:::

## Les 3 grandes familles de contrats

| Formule | Pour qui | À savoir |
| --- | --- | --- |
| Assurance habitation avec extension location saisonnière | Tu loues ta résidence principale quelques semaines par an | Surprime fréquente de 10 à 30 % selon les guides 2026 |
| Propriétaire non occupant (PNO) avec extension courte durée | Tu loues une résidence secondaire ou un investissement | Vérifie que la courte durée est écrite au contrat |
| Contrat dédié location courte durée | Tu loues souvent, ou plusieurs logements | Des assureurs et courtiers se spécialisent dans ce besoin |

> Sources : Guide assurance pro (2026), Conciergerie Vesna (2026), Welkeys (2026). Les montants varient beaucoup d'un assureur à l'autre : compare sur devis.

## Ce que la garantie de la plateforme ne fera plus

AirCover d'Airbnb ne couvre que les séjours **réservés sur Airbnb**. Pour une réservation directe, il n'existe plus aucune garantie de plateforme : seule ton assurance (et ta caution) te protège. C'est pour ça qu'on traite l'assurance avant de lancer tes premières réservations directes.

## L'assurance du voyageur, un filet en plus

Tu peux demander dans ton contrat que le voyageur ait une **assurance villégiature** (responsabilité civile pour un séjour en location), souvent incluse dans son assurance habitation, et lui demander une attestation. Ça ne remplace pas la tienne, mais ça ajoute un payeur en cas de gros dégât.

> Source : Welkeys, « Quelle assurance pour votre location saisonnière ? » (2026).

:::quiz
? Pourquoi prévenir ton assureur par écrit ?
- Pour baisser tes impôts
* Sinon il peut refuser de payer en cas de sinistre
- C'est inutile
= La location courte durée change le risque couvert.
:::

:::quiz
? Qu'est-ce qui disparaît en réservation directe ?
- Le Code du tourisme
* La garantie dommages de la plateforme
- Ton assurance habitation
= Ta protection repose sur ton contrat, ta caution et ton assurance.
:::`,
        },
        {
          id: 42,
          title: 'Comparer les offres : les 10 questions à poser',
          duration: '15 min',
          content: `:::bref
- Deux contrats au même prix peuvent couvrir des choses très différentes.
- Pose 10 questions par écrit à chaque assureur.
- Garde les preuves : photos datées, inventaire, factures.
:::

## Le piège des offres qui se ressemblent

Deux contrats au même prix peuvent couvrir des choses très différentes. Pose ces 10 questions à chaque assureur, par écrit, et compare les réponses.

## Les 10 questions

1. **La location courte durée est-elle écrite au contrat**, avec le nombre de nuits par an que je prévois ?
2. **Les dégâts causés par un voyageur** sont-ils couverts (casse, tache, dégradation) ?
3. **Le vol commis par un voyageur** est-il couvert ? C'est souvent exclu, car il n'y a pas d'effraction.
4. **Ma responsabilité civile de loueur** est-elle couverte, avec quel plafond ? (Un voyageur qui se blesse dans le logement.)
5. **Le recours des voisins** est-il inclus ? (Dégât des eaux chez le voisin du dessous.)
6. **La perte de loyers** est-elle couverte si le logement devient inlouable après un sinistre ?
7. **La protection juridique** est-elle incluse pour un litige avec un voyageur ? Si oui, elle peut payer un avocat (voir module 6).
8. **Quelle franchise** par sinistre ?
9. **Quels délais de déclaration** ? (Souvent 2 jours ouvrés pour un vol, 5 jours pour un dommage.)
10. **Le contenu (mobilier, électroménager)** est-il assuré en valeur à neuf ou avec vétusté ?

> Sources : Conciergerie Vesna, iambeezy et Welkeys (guides 2026), Conseils-assurance.fr (analyse 2026).

## Comment comparer intelligemment

- Demande **au moins 3 devis** : ton assureur actuel, un assureur en ligne, un courtier spécialisé en location saisonnière.
- Mets les réponses dans un **tableau** avec ces 10 lignes. Le moins cher est rarement celui qui couvre le vol par un voyageur.
- Garde les **conditions générales** et les **conditions particulières** : c'est elles qui comptent en cas de sinistre, pas la plaquette.

:::exemple
Deux offres à 25 € par mois : l'une plafonne les dégâts causés par un voyageur à 2 000 € avec 500 € de franchise, l'autre à 10 000 € avec 150 €. Même prix, protection très différente.
:::

## Les preuves qui font payer l'assurance

Le jour d'un sinistre, l'assureur te demandera de prouver l'état du logement avant le séjour. Prépare-le dès maintenant :

✅ Un inventaire photo daté de chaque pièce
✅ Les factures des équipements chers
✅ L'état des lieux d'arrivée et de départ du séjour
✅ Le contrat signé et les échanges avec le voyageur

La formation **Gérer les incidents et litiges en LCD** détaille la méthode d'inventaire et d'état des lieux.

:::quiz
? Quelle est la première question à poser à un assureur ?
- Quelle est la couleur du contrat ?
- Avez-vous une application ?
* La location courte durée est-elle écrite au contrat ?
= Sans mention écrite, tu risques un refus d'indemnisation.
:::

:::quiz
? Quelles preuves aident à être indemnisé ?
- Un témoignage oral
* Photos datées, inventaire et factures
- Ton avis Airbnb
= Elles prouvent l'état et la valeur avant le sinistre.
:::

:::action
titre: Ajoute l'assureur dans ta fiche logement
texte: Note ton assureur et ton numéro de contrat pour les retrouver vite.
lien: /dashboard/logements
bouton: Ouvrir mes logements
:::`,
        },
      ],
    },
    {
      id: 5,
      title: 'Tes obligations sans plateforme',
      duration: '35 min',
      lessons: [
        {
          id: 51,
          title: 'La taxe de séjour : la collecter et la reverser toi-même',
          duration: '15 min',
          content: `:::bref
- En direct, c'est toi qui annonces, collectes et reverses la taxe de séjour.
- Le montant dépend de ta commune et du classement du logement.
- Évite la double collecte si tu es aussi sur des plateformes.
:::

## Ce qui change en direct

Sur Airbnb ou Booking, la plateforme collecte la taxe de séjour et la reverse à la commune. **En direct, c'est toi** :

1. Tu **annonces** le montant au voyageur avant le séjour
2. Tu le **collectes** en plus du prix (ou tu indiques clairement qu'il est compris)
3. Tu le **reverses** à la commune (ou à l'intercommunalité) aux dates qu'elle fixe
4. Tu fais une **déclaration** qui détaille chaque séjour au moment du reversement

> Source : articles L2333-33 à L2333-39 du Code général des collectivités territoriales (Légifrance) ; guides 2026 (ELM Conseil, Eldorado immobilier).

## Combien ?

Le tarif dépend de ta commune et du classement de ton logement : un montant par personne et par nuit pour un logement classé, un pourcentage du prix de la nuitée pour un logement non classé. Les mineurs en sont exonérés.

Pour connaître le tarif exact de ta commune, utilise le **simulateur de taxe de séjour** de l'app ou du site : il lit les délibérations officielles des communes (DGFiP).

## Les sanctions en cas d'oubli

La commune peut sanctionner un défaut de déclaration ou de reversement par des **amendes**, et procéder à une **taxation d'office** avec des intérêts de retard après une mise en demeure.

> Sources : articles L2333-34-1 et L2333-38 du CGCT ; La Gazette des communes. Les montants exacts dépendent de la nature du manquement : renseigne-toi auprès de ta commune.

## La méthode simple

- Mets la taxe de séjour **en ligne séparée** dans ton contrat (l'app le fait).
- Tiens un **tableau** des séjours directs : dates, nombre de personnes, nombre de mineurs, montant collecté.
- Note dans ton agenda les **dates de reversement** de ta commune (mensuelles, trimestrielles ou annuelles selon elle).
- Demande à ta commune si elle a une **plateforme de déclaration en ligne** : la plupart en ont une.

### Attention aux doubles collectes

Si un voyageur annule sur une plateforme puis réserve chez toi en direct, vérifie que la taxe n'est pas collectée deux fois.

:::exemple
Taxe de 1,50 € par personne et par nuit, 2 adultes, 4 nuits : 1,50 × 2 × 4 = 12 €. Tu l'ajoutes sur la facture, tu la notes dans ton tableau, et tu la reverses à la commune à l'échéance fixée par elle.
:::

:::quiz
? En direct, qui reverse la taxe de séjour à la commune ?
- Le voyageur directement
- Airbnb
* Toi
= Sans plateforme, la collecte et le reversement sont à ta charge.
:::

:::quiz
? Qu'est-ce qu'une double collecte ?
- Collecter pour deux communes
- Une taxe obligatoire en plus
* Faire payer la taxe deux fois pour le même séjour
= Vérifie qui collecte selon le canal de réservation.
:::`,
        },
        {
          id: 52,
          title: "Numéro d'enregistrement, fiche de police, données personnelles et médiateur",
          duration: '20 min',
          content: `:::bref
- Numéro d'enregistrement sur chaque annonce, y compris Facebook et ton site.
- Fiche de police pour les étrangers, données des voyageurs protégées (RGPD).
- Un loueur professionnel doit proposer un médiateur de la consommation.
:::

## 1. Ton numéro d'enregistrement sur chaque annonce

La loi Le Meur a généralisé la déclaration des meublés de tourisme et le numéro d'enregistrement au **20 mai 2026**. Le téléservice national est annoncé pour la fin 2026 : d'ici là, c'est ta **mairie** qui délivre le numéro. Il doit figurer sur **chaque annonce**, pas seulement sur Airbnb : ta page Driing, ton post Facebook, ton site.

> Sources : loi n° 2024-1039 (loi Le Meur) ; entreprises.gouv.fr, « Les meublés de tourisme ».

## 2. La fiche de police (rappel)

Voyageur de nationalité étrangère : fiche remplie et signée à l'arrivée, conservée **6 mois**, remise seulement sur demande des forces de l'ordre. L'app la prépare dans **Mes voyageurs → Déclarations**.

> Source : articles R814-1 à R814-3 du CESEDA.

## 3. Les données de tes voyageurs (RGPD)

En direct, tu gardes les coordonnées de tes voyageurs. C'est précieux pour les faire revenir, et c'est encadré.

- **Ne garde que l'utile** : nom, coordonnées, dates de séjour, échanges. Jamais de copie de pièce d'identité.
- **Combien de temps ?** Pour leur envoyer des offres, la CNIL retient **3 ans après le dernier contact**. Au-delà, supprime ou demande s'ils veulent rester dans ta liste.
- **Les offres par e-mail** : un ancien client peut recevoir tes offres pour un service similaire, à condition d'avoir pu **refuser** au moment où tu as pris son e-mail, et de pouvoir se désinscrire à chaque envoi.
- **Range les données** dans un outil protégé par mot de passe, pas dans un carnet qui traîne.

> Sources : CNIL, référentiel de gestion locative et repères sur la prospection (rappelés par Haas avocats) ; durées recommandées de 3 ans après la fin de la relation commerciale.

Dans l'app, **Mes voyageurs** garde la fiche de chaque voyageur. Pour leur écrire, l'app exporte la liste de ceux que tu peux contacter vers **Brevo**, qui gère les désinscriptions.

## 4. Le médiateur de la consommation

Tout **professionnel** qui vend un service à des consommateurs doit proposer gratuitement un **médiateur de la consommation** référencé, et afficher ses coordonnées (dans ton contrat, sur ta page).

Es-tu un professionnel ? Si tu loues de façon **habituelle**, pour en tirer un revenu (loueur en meublé, numéro SIRET), c'est très probablement le cas. Si tu loues ta résidence principale deux semaines par an, la question se discute. Dans le doute, adhérer à un médiateur coûte peu et te met en règle.

> Sources : article L612-1 du Code de la consommation ; economie.gouv.fr, « Médiation de la consommation : vos principales obligations » ; la liste officielle des médiateurs est tenue par la CECMC.

:::retenir
Si tu loues en tant que professionnel à des particuliers, tu dois leur indiquer un médiateur de la consommation pour régler un litige à l'amiable.
:::

## Le récapitulatif

| Obligation | Pour qui | Où |
| --- | --- | --- |
| Numéro d'enregistrement sur chaque annonce | Tous les meublés de tourisme | Mairie, puis téléservice national |
| Fiche de police | Voyageurs de nationalité étrangère | App : Mes voyageurs → Déclarations |
| Taxe de séjour | Toutes les réservations directes | Ta commune |
| Données personnelles | Tous | Garder peu, 3 ans max pour les offres |
| Médiateur de la consommation | Les loueurs professionnels | Un médiateur référencé CECMC |

:::quiz
? Où afficher ton numéro d'enregistrement ?
* Sur chaque annonce, partout
- Seulement sur Airbnb
- Nulle part
= La loi Le Meur l'impose sur toute offre de location.
:::

:::quiz
? Combien de temps garder les données d'un voyageur pour la prospection ?
* 3 ans après le dernier contact
- Pour toujours
- Une semaine
= C'est la durée retenue par le RGPD pour la prospection.
:::

:::action
titre: Vérifie ton numéro d'enregistrement
texte: Renseigne-le dans ta fiche logement pour l'avoir sur toutes tes annonces.
lien: /dashboard/logements
bouton: Ouvrir mes logements
:::`,
        },
      ],
    },
    {
      id: 6,
      title: 'Te faire accompagner et passer à l\'action',
      duration: '25 min',
      lessons: [
        {
          id: 61,
          title: 'Faut-il un juriste ? Quand oui, quand non',
          duration: '10 min',
          content: `:::bref
- Aucune loi n'oblige à passer par un juriste pour louer en direct.
- Un professionnel devient utile avec un site, plusieurs logements ou un litige.
- Avant d'aller au tribunal, privilégie la discussion écrite et la médiation.
:::

## La réponse courte : pas obligatoire

Aucune loi ne t'oblige à passer par un juriste ou un avocat pour louer en direct. Un contrat clair, conforme à l'article L324-2 du Code du tourisme, et des conditions d'annulation bien écrites suffisent pour la grande majorité des séjours.

## Quand un professionnel du droit vaut son prix

✅ Tu crées **ton propre site** de réservation avec des conditions générales de vente
✅ Tu gères **plusieurs logements**, ou ceux d'autres propriétaires (conciergerie)
✅ Tu as un **litige important** : dégâts au-delà de la caution, voyageur qui refuse de partir, menace de procès
✅ Ton **règlement de copropriété** pose question sur la location courte durée
✅ Tu hésites sur ton **statut** (LMNP, LMP, société) : là, c'est plutôt un expert-comptable

## Les solutions avant de payer un avocat

- **La protection juridique** de ton assurance (habitation ou PNO) : beaucoup de contrats l'incluent. Elle peut te conseiller par téléphone et prendre en charge des frais d'avocat. Vérifie ton contrat avant tout.
- **Les modèles de contrat** sérieux : celui de l'app reprend les mentions légales et ta fiche logement.
- **Le médiateur de la consommation** : pour un désaccord avec un voyageur, c'est une étape gratuite pour lui avant le tribunal.
- **Une consultation ponctuelle** avec un avocat en droit immobilier pour faire relire ton contrat une fois : c'est souvent suffisant, puis tu le réutilises.

:::astuce
Avant un avocat : la conciliation (gratuite), le médiateur de la consommation, ou les points-justice pour un premier conseil.
:::

## La règle d'or du litige

Un litige se gagne avec des **preuves** : contrat signé, état des lieux, photos datées, échanges écrits. Sans elles, même le meilleur avocat ne peut pas grand-chose. La formation **Gérer les incidents et litiges en LCD** te donne la méthode complète.

:::quiz
? Un juriste est-il obligatoire pour louer en direct ?
- Oui, dès la première nuit
* Non
- Oui, toujours
= Un contrat conforme au Code du tourisme suffit dans la plupart des cas.
:::

:::quiz
? Quand un professionnel du droit vaut-il son prix ?
* Pour créer ton site avec conditions générales ou gérer un litige
- Pour chaque séjour d'une nuit
- Jamais
= Ces situations demandent des documents ou une défense solides.
:::`,
        },
        {
          id: 62,
          title: 'Ton plan en 10 étapes pour ta première réservation directe',
          duration: '15 min',
          content: `:::bref
- Avant la première réservation : assureur, numéro, contrat, paiement en ligne.
- À chaque réservation : vérification, contrat signé, paiement, caution, fiche de police.
- Une liste à suivre évite les oublis.
:::

## Avant la première réservation (une seule fois)

1. **Préviens ton assureur par écrit** et vérifie les 10 points du module 4.
2. **Obtiens ton numéro d'enregistrement** et mets-le sur toutes tes annonces.
3. **Rédige ton contrat** : dans l'app, remplis ta fiche logement (caractéristiques, équipements, tarifs, contrat) et regarde le contrat complet avec « Voir mon contrat ».
4. **Connecte Stripe** (Mon compte → Encaissements) pour encaisser le loyer par carte et bloquer la caution.
5. **Renseigne-toi sur la taxe de séjour** de ta commune : tarif, dates et mode de reversement.
6. **Choisis ton médiateur** si tu loues à titre habituel, et ajoute ses coordonnées à ton contrat.

## À chaque réservation directe

7. **Vérifie le voyageur** : échange avant d'accepter, base Sécurité voyageur, et un outil d'identité si ton logement le justifie.
8. **Envoie le contrat** : le voyageur signe en ligne puis paie par carte. Pas de clés contre une capture d'écran de virement.
9. **À l'arrivée** : tu vois la pièce d'identité sans la copier, la fiche de police pour un étranger, la caution bloquée 2 jours avant.
10. **Après le départ** : état des lieux, caution libérée ou retenue avec motif, taxe de séjour notée, et un message pour qu'il revienne en direct la prochaine fois.

## Ta checklist à imprimer

| Étape | Fait |
| --- | --- |
| Assureur prévenu par écrit | |
| Numéro d'enregistrement sur chaque annonce | |
| Contrat prêt et relu | |
| Stripe connecté | |
| Taxe de séjour : tarif et dates connus | |
| Médiateur choisi (si professionnel) | |
| Process de vérification du voyageur | |
| Modèle de message d'arrivée avec fiche de police | |

:::astuce
Imprime la liste et coche-la à ta première réservation directe. À la troisième, tu n'en auras plus besoin.
:::

## Et maintenant ?

Commence petit : un ancien voyageur, un proche d'un voyageur, une demande reçue sur ta fiche Google. Une première réservation directe bien faite te donnera la confiance pour la suivante. Pour aller chercher plus de voyageurs, enchaîne avec la formation **Annonce Directe**, et regarde si **Driing** peut devenir ton canal direct principal.

Tu as une question sur ta situation ? Écris-moi depuis la page Contact du site : je réponds personnellement.

:::quiz
? Que faire avant ta première réservation directe ?
* Prévenir ton assureur et préparer ton contrat
- Partir en vacances
- Supprimer tes annonces
= Ce sont les protections de base, à mettre en place une seule fois.
:::

:::quiz
? Qu'est-ce qui revient à chaque réservation ?
- Changer d'assureur
- Refaire les photos
* Contrat signé, paiement et caution
= Chaque séjour doit être encadré de la même façon.
:::

:::action
titre: Crée ton premier contrat direct
texte: Suis la liste : fiche logement complète, contrat, paiement et caution.
lien: /dashboard/contrats
bouton: Ouvrir mes contrats
:::`,
        },
      ],
    },
  ],
}
