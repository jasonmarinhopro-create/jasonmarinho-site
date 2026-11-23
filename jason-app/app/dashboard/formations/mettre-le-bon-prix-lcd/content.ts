// Formation pilote du nouveau format (23/11/2026, docs/claude/formations.md) :
// « En bref », encadrés, chiffres clés, questions de vérification, action de
// fin de module. Identifiants des leçons inchangés (progression des membres).
// Chiffres vérifiés le 23/11/2026 : frais Airbnb hôte seul 15,5 % en France
// depuis le 13/10/2026 ; Booking autour de 15 % selon l'accord signé ; tarifs
// indicatifs de PriceLabs, Wheelhouse et Beyond.
export const METTRE_BON_PRIX_FORMATION = {
  slug: 'mettre-le-bon-prix-lcd',
  title: 'Mettre le bon prix en location courte durée',
  description: `Prix minimum, prix de base, saisons, événements locaux, plateformes et réservation directe : la méthode pour ne jamais travailler à perte ni laisser d'argent sur la table.`,
  duration: '1h30',
  level: 'Débutant',
  objectifs: [
    'Calculer ton prix minimum avant de fixer quoi que ce soit',
    'Trouver ton prix de base à partir du marché et le tester',
    'Construire ton calendrier de saisons, week-ends et événements',
    'Régler tes remises de durée sans passer sous ton plancher',
    'Adapter ton prix à Airbnb, Booking et la réservation directe',
    'Suivre chaque mois ton revenu par nuit disponible',
  ],
  modules: [
    {
      id: 1,
      title: 'Ton prix minimum, la base de tout',
      duration: '15 min',
      lessons: [
        {
          id: 1,
          title: 'Calculer ton prix minimum',
          duration: '8 min',
          content: `:::bref
- Ton prix minimum est le montant sous lequel chaque nuit louée te coûte de l'argent.
- Il se calcule à partir de TES charges, jamais à partir du prix du voisin.
- Formule : charges fixes du mois divisées par les nuits louées, plus le coût d'un séjour ramené à la nuit.
:::

## Pourquoi commencer par là
La plupart des hôtes fixent leur prix en regardant les annonces voisines.
Le problème : ton voisin n'a ni ton loyer, ni ton crédit, ni ta femme de ménage.
Un prix copié peut être confortable pour lui et ruineux pour toi.

Ton prix minimum ne sert pas à être affiché. C'est un garde-fou :
aucune remise, aucun outil, aucune promotion ne doit jamais le franchir.

## Ce que ton prix minimum doit couvrir
CHARGES FIXES (même si le logement est vide)
- Loyer ou mensualité de crédit
- Charges de copropriété, eau, électricité, internet
- Assurance adaptée à la location courte durée
- Abonnements et outils
- Usure du mobilier et du linge

CHARGES PAR SÉJOUR
- Ménage et blanchisserie
- Produits d'accueil et consommables
- Commission de la plateforme (en pourcentage du prix)

## La formule
1. Additionne tes charges fixes du mois.
2. Divise par le nombre de nuits que tu loues vraiment en moyenne (pas 30).
3. Ajoute le coût d'un séjour divisé par sa durée moyenne.
4. Ajoute la commission : divise le tout par (1 moins le taux de commission).

:::chiffres
1 000 € | charges fixes par mois
18 | nuits louées en moyenne
56 € | part des charges fixes par nuit
:::

:::exemple
Studio : 1 000 € de charges fixes, 18 nuits louées, donc 56 € par nuit.
Ménage et consommables : 60 € par séjour, séjours de 3 nuits en moyenne, donc 20 € par nuit.
Total avant commission : 76 €. Avec 15,5 % de commission Airbnb : 76 divisé par 0,845 = 90 €.
Ton prix minimum sur Airbnb est d'environ 90 € la nuit.
:::

:::erreur
Diviser tes charges par 30 nuits. Personne n'est plein tous les jours : avec 30, ton plancher est trop bas et tu travailles à perte sans le voir.
:::

:::quiz
? Tes charges fixes sont de 900 € par mois et tu loues 15 nuits. Quelle est la part des charges fixes par nuit ?
- 30 €
* 60 €
- 90 €
= 900 divisé par 15 = 60 €. On divise par les nuits réellement louées, pas par 30.
:::

:::quiz
? Pourquoi ne faut-il pas fixer son prix minimum en copiant celui des voisins ?
- Parce qu'Airbnb l'interdit
* Parce que leurs charges ne sont pas les tiennes
- Parce que les voisins sont toujours trop chers
= Le prix minimum dépend de tes propres charges. Le marché sert à fixer le prix de base, pas le plancher.
:::`,
        },
        {
          id: 2,
          title: 'Trouver ton prix de base',
          duration: '7 min',
          content: `:::bref
- Le prix de base est ton prix d'une nuit ordinaire : en semaine, hors saison, sans événement.
- Tu le trouves en comparant 5 logements vraiment comparables au tien.
- Tu l'ajustes ensuite selon la vitesse à laquelle ton calendrier se remplit.
:::

## Le prix de base, c'est quoi ?
C'est le point de départ de toute ta stratégie.
Les week-ends, les saisons et les événements viennent s'ajouter dessus.
Les outils de tarification automatique partent aussi de lui :
s'il est faux, tout le reste l'est aussi.

## Méthode : 5 comparables
Cherche sur Airbnb, à 1 ou 2 km, des logements proches du tien :
- même type (studio, appartement, maison)
- même nombre de couchages
- équipements et niveau de finition comparables
- une note proche de la tienne

Relève leur prix pour une nuit en semaine, hors vacances, dans 3 à 4 semaines.
Fais la moyenne : c'est ta référence de marché.

## Le test sur 2 semaines
1. Affiche ton prix de base estimé pendant 2 semaines.
2. Si tes nuits partent en moins de 48 heures, ton prix est trop bas : monte de 10 %.
3. Si rien ne se réserve en 2 semaines sur des dates proches, baisse de 10 %.
4. Recommence jusqu'à trouver l'équilibre.

:::retenir
L'objectif n'est pas d'être plein 30 nuits par mois à petit prix. C'est d'être bien rempli au meilleur prix possible, avec moins de ménages et moins de fatigue.
:::

## Ta note compte
Une annonce très bien notée, avec des photos soignées et des avis récents, peut se placer au-dessus de la moyenne du quartier sans perdre de réservations.
Soigner l'accueil, la propreté et la communication est souvent le moyen le moins cher de justifier un prix plus haut.

:::astuce
Compare ta référence de marché à ton prix minimum. Si le marché est sous ton plancher, le problème vient de tes charges ou de ton positionnement, pas de ton prix.
:::

:::quiz
? Tes nuits se réservent toutes en moins de 48 heures. Que fais-tu ?
* Je monte mon prix d'environ 10 %
- Je baisse mon prix pour remplir encore plus
- Je ne change rien, c'est parfait
= Des réservations très rapides montrent que ton prix est sous ce que les voyageurs sont prêts à payer.
:::

:::quiz
? La moyenne du marché est à 80 € et ton prix minimum à 95 €. Que montre cet écart ?
- Que tu dois t'aligner à 80 €
* Que tes charges ou ton positionnement sont à revoir
- Que tes voisins travaillent tous à perte
= Vendre à 80 € te ferait perdre de l'argent à chaque nuit. Il faut réduire des charges ou monter en gamme pour justifier un prix plus haut.
:::

:::action
titre: Calcule ton prix minimum et note ton prix de base
texte: Dans Mes prix, choisis ton logement et renseigne ton prix par plateforme : il te servira dans tous les modules suivants.
lien: /dashboard/calculateurs#mes-prix
bouton: Ouvrir Mes prix
:::`,
        },
      ],
    },
    {
      id: 2,
      title: 'Saisons, week-ends et événements',
      duration: '15 min',
      lessons: [
        {
          id: 11,
          title: 'Construire ton calendrier de saisons',
          duration: '8 min',
          content: `:::bref
- Ton année se découpe en niveaux de demande : basse saison, ordinaire, week-end, haute saison, événement.
- Chaque niveau a sa majoration ou sa remise, appliquée sur ton prix de base.
- Les événements locaux sont l'endroit où les hôtes laissent le plus d'argent.
:::

## Les niveaux de demande
| Niveau | Quand | Réglage indicatif |
| --- | --- | --- |
| Basse saison | Semaines creuses | moins 15 à 30 % |
| Ordinaire | Semaine hors vacances | prix de base |
| Week-end | Vendredi et samedi soir | plus 15 à 25 % |
| Haute saison | Vacances scolaires, été, fêtes | plus 30 à 50 % |
| Événement | Festival, salon, grand concert | plus 50 % et au-delà |

Ces pourcentages sont des points de départ à tester sur ton marché, pas des règles fixes.

## Les vacances scolaires
En France, les vacances sont décalées par zones : la demande monte plusieurs semaines de suite.
Note dans ton calendrier : Toussaint, Noël, hiver, printemps, été, et les ponts de mai.
Programme ces périodes à l'avance plutôt qu'à la dernière minute.

## Les événements locaux
Un salon professionnel, un marathon ou un concert dans un stade fait exploser la demande dans un rayon de quelques kilomètres.
Où les trouver :
- l'agenda de l'office de tourisme
- les événements Facebook de ta ville
- le calendrier du parc des expositions ou du palais des congrès

Dès que tu repères une date :
- majore la période
- impose 2 nuits minimum
- fais-le des mois à l'avance pour les événements qui reviennent chaque année

:::erreur
Attendre de voir si la date se remplit toute seule. Les premières réservations partent alors à ton prix ordinaire, souvent bien en dessous de ce que vaut la nuit.
:::

## Le délai avant l'arrivée
- Plus de 30 jours avant : garde ton prix, les voyageurs prévoyants sont moins sensibles au prix.
- De 7 à 30 jours : c'est la période où se fait l'essentiel des réservations.
- Moins de 7 jours et toujours libre : une remise de dernière minute peut remplir, sans jamais passer sous ton prix minimum.

:::quiz
? Un salon professionnel a lieu dans ta ville en mars. Quand ajustes-tu ton prix ?
* Dès que je connais la date, avec 2 nuits minimum
- Une semaine avant, si ce n'est pas réservé
- Je ne change rien, les salons n'attirent personne
= Ajuster tôt évite que les premières réservations partent au prix ordinaire.
:::

:::quiz
? Il te reste une nuit libre dans 4 jours. Quelle est la limite à ne pas franchir ?
- Le prix moyen du quartier
* Ton prix minimum
- Le prix de la nuit la plus chère du mois
= Une remise de dernière minute est utile, mais jamais sous ton plancher.
:::`,
        },
        {
          id: 12,
          title: 'Remises de durée et séjour minimum',
          duration: '7 min',
          content: `:::bref
- Un séjour de 7 nuits coûte un seul ménage, une seule arrivée, un seul échange de messages.
- Une remise de durée bien réglée remplit ton calendrier sans faire baisser ta marge.
- Avant toute remise : le revenu par nuit doit rester au-dessus de ton prix minimum.
:::

## Pourquoi une remise peut rapporter plus
:::chiffres
7 | ménages pour 7 séjours d'une nuit
1 | ménage pour un séjour de 7 nuits
:::

À 40 € le ménage, 7 séjours d'une nuit coûtent 280 € de ménage, contre 40 € pour une semaine.
La remise de durée est en partie payée par ces économies.

## Une grille de départ
| Durée | Remise indicative | Pour qui |
| --- | --- | --- |
| 3 à 4 nuits | 5 % | week-ends prolongés |
| 7 nuits | 10 à 15 % | vacances, missions |
| 28 nuits et plus | 25 à 35 % | télétravail, déplacements longs |

## Le séjour minimum
Imposer 2 nuits le week-end évite qu'une seule nuit du samedi bloque tout le week-end.
En basse saison, accepter 1 nuit aide à combler les trous du calendrier.

:::retenir
Remise intelligente : elle correspond à une vraie économie et reste au-dessus de ton prix minimum. Bradage : tu baisses seulement parce que le calendrier est vide.
:::

:::exemple
Prix de base 100 €, remise de 15 % sur 7 nuits : 85 € la nuit. Si ton prix minimum est 90 €, cette remise te fait perdre de l'argent : limite-la à 10 %.
:::

:::quiz
? Ton prix de base est 100 € et ton prix minimum 90 €. Quelle remise maximale pour 7 nuits ?
- 15 %
* 10 %
- 25 %
= 100 € moins 10 % = 90 €, pile ton plancher. Au-delà, chaque nuit te coûte de l'argent.
:::

:::quiz
? Pourquoi imposer 2 nuits minimum le week-end ?
* Pour éviter qu'une nuit isolée bloque tout le week-end
- Parce qu'Airbnb l'exige
- Pour faire baisser le prix moyen
= Une seule nuit le samedi empêche souvent de louer le vendredi, et tu paies quand même un ménage complet.
:::

:::action
titre: Règle tes saisons dans Mes prix
texte: Indique tes pourcentages de basse et de haute saison pour ton logement, puis reporte-les avec tes remises de durée dans Airbnb et Booking.
lien: /dashboard/calculateurs#mes-prix
bouton: Régler mes saisons
:::`,
        },
      ],
    },
    {
      id: 3,
      title: 'Le bon prix selon la plateforme',
      duration: '20 min',
      lessons: [
        {
          id: 21,
          title: 'Airbnb : sa tarification et ses nouveaux frais',
          duration: '7 min',
          content: `:::bref
- Depuis le 13 octobre 2026 en France, Airbnb prélève des frais uniques d'environ 15,5 % à l'hôte : le voyageur ne paie plus de frais de service à part.
- La tarification intelligente d'Airbnb peut aider, à condition de régler toi-même un prix minimum.
- Sans prix minimum réglé, l'outil peut vendre des nuits sous ton plancher.
:::

## Ce qui a changé
Avant, les frais étaient partagés : environ 3 % pour l'hôte, et des frais de service ajoutés au prix payé par le voyageur.
Aujourd'hui, le voyageur voit un prix tout compris et c'est l'hôte qui paie les frais.

:::chiffres
100 € | prix affiché au voyageur
15,5 € | frais Airbnb à ta charge
84,50 € | ce que tu reçois
:::

> Source : Airbnb, « Simplifying Airbnb service fees » ; Hostfully et Smoobu, novembre 2026

:::retenir
Si tu n'as pas revu tes prix depuis octobre, tu reçois environ 84,50 € au lieu de 97 € pour 100 € de prix affiché. Refais ton calcul de prix minimum avec 15,5 %.
:::

## La tarification intelligente
Elle ajuste tes prix chaque jour selon la saison, la demande et les logements proches.
Elle est pratique quand tu démarres ou que tu manques de temps.
Mais son but est de remplir : elle peut descendre bas en période creuse.

À régler dans tous les cas :
- un prix minimum (ton plancher recalculé)
- un prix maximum raisonnable
- ta majoration du week-end
- ton séjour minimum

:::erreur
Activer la tarification intelligente sans prix minimum. C'est la façon la plus rapide de louer des nuits à perte.
:::

:::quiz
? Depuis octobre 2026, sur un prix affiché de 200 €, combien reçois-tu environ avec Airbnb ?
- 194 €
* 169 €
- 200 €
= 15,5 % de 200 € = 31 €, il te reste 169 €.
:::

:::quiz
? Quel réglage est indispensable avant d'activer la tarification intelligente ?
* Un prix minimum
- Une photo de couverture
- Une remise de dernière minute
= Le prix minimum empêche l'outil de vendre sous ton plancher.
:::`,
        },
        {
          id: 22,
          title: 'Booking.com : une logique différente',
          duration: '6 min',
          content: `:::bref
- Sur Booking, la commission dépend de l'accord signé à l'inscription : autour de 15 % en France.
- Avec les nouveaux frais Airbnb, les deux plateformes te coûtent maintenant à peu près pareil.
- Les promotions Booking ne doivent jamais faire passer ta nuit sous ton prix minimum.
:::

## La commission
Le voyageur voit ton prix, et Booking prélève sa commission dessus.
Le taux exact figure dans ton extranet. Il tourne autour de 15 % pour un meublé en France, parfois plus selon les options choisies.

> Source : PriceLabs, Smoobu et Lodgify, guides Booking 2026

:::retenir
Avant octobre 2026, il fallait afficher un prix plus élevé sur Booking qu'Airbnb pour garder la même marge. Avec les frais Airbnb à 15,5 %, un prix proche sur les deux plateformes est maintenant logique : compare simplement ton revenu net.
:::

## Ce qui te rend visible sur Booking
- un calendrier ouvert loin dans le temps
- des conditions d'annulation souples
- une bonne note et des avis récents
- un prix compétitif face aux logements comparables

## Les promotions
Booking propose des réductions : réservation anticipée, séjours longs, offres mobiles, programme Genius pour ses clients fidèles.
Chacune réduit ton revenu. Avant d'en activer une, vérifie le prix final par nuit.

:::exemple
Prix 100 €, réduction Genius de 10 % : 90 €. Après 15 % de commission, il te reste 76,50 €. Si ton prix minimum Booking est 80 €, cette promotion te fait perdre de l'argent.
:::

:::quiz
? Où trouves-tu ton taux de commission Booking exact ?
* Dans ton extranet et ton accord d'hébergement
- Sur la fiche du logement voisin
- Il est le même pour tout le monde, 10 %
= Le taux dépend de ton accord et de tes options, il varie d'un hébergement à l'autre.
:::

:::quiz
? Prix 100 €, Genius à moins 10 %, commission 15 %. Que reçois-tu ?
- 85 €
- 90 €
* 76,50 €
= 100 moins 10 % = 90 €, puis moins 15 % de commission = 76,50 €.
:::`,
        },
        {
          id: 23,
          title: 'Le prix en réservation directe',
          duration: '7 min',
          content: `:::bref
- En direct, tu ne paies pas la commission des plateformes : tu peux être moins cher pour le voyageur et gagner plus.
- Une remise de 5 à 10 % par rapport au prix affiché sur Airbnb suffit à rendre le direct intéressant.
- Rends l'économie visible : le voyageur ne fait pas le calcul seul.
:::

## Le calcul gagnant pour les deux
:::chiffres
100 € | prix sur Airbnb
84,50 € | ce que tu reçois via Airbnb
92 € | prix direct, ce que tu reçois
:::

Le voyageur paie 8 € de moins, et toi tu reçois 7,50 € de plus.
Compte seulement les frais de paiement en ligne si tu encaisses par carte (souvent autour de 1,5 % en Europe).

## Ce qu'il ne faut pas faire
:::erreur
Afficher le même prix qu'Airbnb : le voyageur n'a aucune raison de réserver en direct. Ou au contraire brader à moins 30 % : tu perds la marge que tu viens de gagner.
:::

## Le prix selon le voyageur
| Voyageur | Prix proposé |
| --- | --- |
| Nouveau | 5 à 10 % sous le prix Airbnb |
| Déjà venu | une petite remise fidélité en plus |
| Recommandé par un ancien voyageur | un code de parrainage |

:::astuce
Sur Driing (je suis co-fondateur), la comparaison avec les plateformes s'affiche toute seule au voyageur. Sur ton propre site, montre-la clairement.
:::

:::quiz
? Airbnb affiche 100 € (tu reçois 84,50 €). Quel prix direct est le plus logique ?
- 100 €, le même prix partout
* Environ 92 €
- 65 €, pour être sûr de remplir
= À 92 € le voyageur économise et tu reçois plus qu'avec Airbnb. À 65 € tu perds de l'argent pour rien.
:::

:::quiz
? Pourquoi un prix direct identique à celui d'Airbnb fonctionne mal ?
* Le voyageur ne voit aucun avantage à réserver en direct
- C'est interdit par Airbnb
- Le voyageur paie des frais en plus en direct
= Sans économie visible, le voyageur reste sur la plateforme qu'il connaît.
:::

:::action
titre: Compare ton revenu net par plateforme
texte: Dans Mes prix, renseigne tes prix Airbnb, Booking et direct : tu vois tout de suite ce que tu reçois sur chacune.
lien: /dashboard/calculateurs#mes-prix
bouton: Comparer mes prix
:::`,
        },
      ],
    },
    {
      id: 4,
      title: 'Ajuster tes prix chaque semaine',
      duration: '15 min',
      lessons: [
        {
          id: 31,
          title: 'Le rituel de 15 minutes par semaine',
          duration: '7 min',
          content: `:::bref
- Avant tout outil automatique, ajuste tes prix toi-même pendant quelques semaines pour comprendre ton marché.
- 15 minutes chaque lundi suffisent : événements, remplissage, concurrents.
- Note ce que tu fais et ce que ça donne : en 3 mois, tu connais ton marché par cœur.
:::

## Les 3 questions du lundi
1. Y a-t-il un événement dans les 6 prochaines semaines ? Si oui, majore tout de suite.
2. Mes 2 prochaines semaines sont-elles remplies à moins de la moitié ? Si oui, une petite remise.
3. Mes 3 concurrents directs ont-ils bougé leurs prix ? Si oui, demande-toi pourquoi.

## Les 5 règles
- Le prix minimum ne se franchit jamais.
- Le week-end est toujours majoré.
- Un événement se majore dès qu'il est connu.
- Calendrier vide à 14 jours : petite remise.
- Haute saison : prix haut et séjour minimum plus long.

## Un tableau simple
| Semaine | Raison | Prix | Remplissage | Revenu |
| --- | --- | --- | --- | --- |
| Janvier, semaine 2 | ordinaire | 90 € | 60 % | 380 € |
| Février, semaine 1 | vacances d'hiver | 130 € | 90 % | 820 € |
| Mars, semaine 3 | marathon | 160 € | 100 % | 1 120 € |

:::exemple
Ces lignes sont un exemple. Après quelques mois, ton tableau te montre quelles périodes rapportent et lesquelles méritent un meilleur réglage.
:::

:::quiz
? Tes 2 prochaines semaines sont remplies à 30 %. Que fais-tu ?
* Une petite remise, sans passer sous mon prix minimum
- Je baisse de 50 % pour tout remplir
- Rien, ça se remplira tout seul
= Une remise mesurée aide à remplir, ton plancher reste la limite.
:::

:::quiz
? Pourquoi commencer à la main avant un outil automatique ?
- Parce que les outils sont interdits au début
* Pour comprendre ton marché et bien régler l'outil ensuite
- Parce que c'est toujours plus rentable
= Un outil part de ton prix de base et de tes règles : mal réglés, il amplifie tes erreurs.
:::`,
        },
        {
          id: 32,
          title: 'Les outils de tarification automatique',
          duration: '8 min',
          content: `:::bref
- Un outil devient utile quand tu as plusieurs logements, beaucoup d'événements ou peu de temps.
- Il amplifie ta stratégie, il ne la remplace pas : prix minimum et prix de base restent à toi.
- Les principaux coûtent autour de 20 dollars par logement et par mois, ou environ 1 % de tes revenus.
:::

## Quand c'est utile
✅ Tu gères 2 logements ou plus
✅ Ton marché a beaucoup d'événements difficiles à suivre
✅ Tu n'as pas 15 minutes par semaine pour tes prix

Pas encore utile si :
❌ Tu démarres et n'as pas encore calibré ton prix de base
❌ Ton prix minimum n'est pas calculé

## Les outils les plus connus
| Outil | Point fort | Prix indicatif |
| --- | --- | --- |
| PriceLabs | Très réglable, adapté à plusieurs logements | environ 15 à 20 dollars par logement et par mois |
| Wheelhouse | Simple à prendre en main | 19,99 dollars par logement et par mois, ou 1 % des réservations |
| Beyond | Fort sur les zones touristiques saisonnières | environ 1 % des revenus |

> Source : pages de tarifs de PriceLabs et Wheelhouse, avis Bnbcalc sur Beyond, relevés en novembre 2026. Vérifie le prix actuel sur leur site.

## Ce qui reste ton travail
- ton prix minimum
- ton positionnement et tes voyageurs cibles
- ton séjour minimum et tes conditions d'annulation
- ton prix en réservation directe, rarement géré par ces outils

:::retenir
Un outil branché sur un mauvais prix de base optimise tes revenus dans la mauvaise direction.
:::

:::quiz
? Tu viens de publier ton premier logement. Faut-il un outil tout de suite ?
- Oui, c'est indispensable
* Non, calibre d'abord ton prix de base et ton prix minimum
- Oui, mais sans prix minimum
= Sans base bien réglée, l'outil n'a rien de juste sur quoi s'appuyer.
:::

:::quiz
? Qu'est-ce qu'un outil de tarification ne gère généralement pas ?
- Les prix du week-end
* Ton prix en réservation directe
- Les événements locaux
= Ces outils pilotent surtout les prix des plateformes. Ton prix direct reste à régler toi-même.
:::

:::action
titre: Planifie tes 8 prochaines semaines
texte: Ouvre ton calendrier, repère vacances, week-ends prolongés et événements, et note le prix que tu appliqueras à chaque période.
lien: /dashboard/calendrier
bouton: Ouvrir mon calendrier
:::`,
        },
      ],
    },
    {
      id: 5,
      title: 'Éviter les erreurs et mesurer',
      duration: '20 min',
      lessons: [
        {
          id: 41,
          title: 'Les 5 erreurs de prix les plus coûteuses',
          duration: '7 min',
          content: `:::bref
- Un prix figé toute l'année rate tous les pics de demande.
- Être plein n'est pas le but : être rentable l'est.
- Le ménage et la taxe de séjour font partie de ta structure de prix.
:::

## 1. Le prix figé
Un prix réglé en janvier et jamais revu passe à côté des vacances, des ponts et des événements.
Ces nuits auraient pu valoir bien plus.

## 2. Copier le voisin
Tu ne connais ni ses charges, ni sa rentabilité, ni la réalité de son calendrier.
Le marché est une référence, ton prix minimum est la limite.

## 3. Confondre plein et rentable
:::chiffres
25 × 70 € | 1 750 € et 25 ménages
18 × 120 € | 2 160 € et 18 ménages
:::

:::exemple
Avec 40 € de ménage : 1 750 moins 1 000 de ménage = 750 €. 2 160 moins 720 de ménage = 1 440 €. Moins de nuits, presque deux fois plus de revenu.
:::

## 4. Des frais de ménage mal réglés
Trop élevés, ils découragent les courts séjours. Absents, ils rendent les séjours d'une nuit peu rentables.
Une piste : intégrer le ménage au prix pour les courts séjours, le facturer à part pour les longs.

## 5. Oublier la taxe de séjour
Elle est fixée par ta commune, par personne et par nuit, et dépend du classement du logement.
Vérifie si ta plateforme la collecte. Sinon, prévois-la dans ton prix ou facture-la à part, mais jamais après coup.

:::quiz
? 25 nuits à 70 € ou 18 nuits à 120 €, ménage à 40 € : laquelle rapporte le plus après ménage ?
- 25 nuits à 70 €
* 18 nuits à 120 €
- Les deux rapportent pareil
= 750 € contre 1 440 € : remplir à bas prix coûte cher en ménages.
:::

:::quiz
? Qui fixe le montant de la taxe de séjour ?
* La commune
- La plateforme
- L'hôte, librement
= Chaque commune vote ses tarifs. Les pages de ville du site indiquent le tarif officiel.
:::`,
        },
        {
          id: 42,
          title: 'La stratégie selon ton type de logement',
          duration: '6 min',
          content: `:::bref
- Un studio en ville vit des week-ends et des événements professionnels.
- Une maison familiale vit des vacances et des longs séjours.
- Une chambre d'hôtes vend une expérience humaine qui justifie un prix plus haut.
:::

## Studio en centre-ville
- Prix de base proche du marché
- Forte majoration le week-end
- Salons et congrès : souvent plus rentables que les événements grand public
- 2 nuits minimum le week-end, 1 nuit possible en semaine creuse
- Semaines entières pour les télétravailleurs

## Maison ou villa familiale
- Prix de base plus élevé : la capacité a de la valeur
- 3 nuits minimum en basse saison, une semaine en haute saison
- Été très majoré, réservé tôt par les familles, souvent dès l'hiver
- Remises au mois pour remplir l'automne et le printemps

## Chambre d'hôtes
- Petit-déjeuner inclus et mis en valeur dans le prix
- Positionnement au-dessus du marché grâce à l'accueil
- La note est ton premier levier de prix

:::quiz
? Pour un studio en centre-ville, quel levier rapporte souvent le plus ?
* Les salons et congrès professionnels
- Les remises au mois en été
- Le petit-déjeuner inclus
= Les voyageurs d'affaires réservent pendant les salons, souvent en semaine, à des prix élevés.
:::

:::quiz
? Comment une maison familiale peut-elle remplir l'automne ?
- En baissant de 50 % chaque week-end
* Avec des remises au mois pour les longs séjours
- En fermant le logement
= Les séjours longs remplissent les périodes calmes avec peu de ménages.
:::`,
        },
        {
          id: 43,
          title: 'Mesurer : 3 indicateurs chaque mois',
          duration: '7 min',
          content: `:::bref
- Le revenu par nuit disponible est l'indicateur qui résume tout : prix et remplissage ensemble.
- Regarde ton remplissage par type de période, pas en moyenne sur le mois.
- Compare ton revenu net par plateforme pour savoir où concentrer tes efforts.
:::

## 1. Le revenu par nuit disponible
Revenus du mois divisés par les nuits où le logement était disponible.

:::chiffres
1 800 € | revenus du mois
30 | nuits disponibles
60 € | revenu par nuit disponible
:::

S'il monte de mois en mois (à saison égale), ta stratégie progresse.

## 2. Le remplissage par période
| Période | Repère indicatif |
| --- | --- |
| Week-ends | 85 % et plus |
| Haute saison | 90 % et plus |
| Semaines ordinaires | 60 à 70 % |
| Basse saison | 40 à 60 % |

Au-dessus du repère : tu peux sans doute monter tes prix sur cette période. En dessous : regarde ton prix ou ton annonce.

## 3. Le revenu net par plateforme
Pour chaque plateforme : réservations, revenus, commission, revenu net.
Si le direct pèse peu, c'est un levier à développer.

:::retenir
Note ton revenu par nuit disponible aujourd'hui. Recalcule-le dans 3 mois : c'est ta mesure de progrès.
:::

:::quiz
? 2 400 € de revenus sur 30 nuits disponibles : quel est ton revenu par nuit disponible ?
- 120 €
* 80 €
- 2 400 €
= 2 400 divisé par 30 = 80 €.
:::

:::quiz
? Tes week-ends sont pleins à 100 % tous les mois. Que montre ce chiffre ?
* Que tu peux sans doute monter tes prix du week-end
- Que tout est parfait, ne change rien
- Que tu dois baisser tes prix en semaine
= Toujours plein, c'est souvent le signe d'un prix sous ce que les voyageurs accepteraient.
:::

:::action
titre: Note ton revenu par nuit disponible
texte: Dans Performances, relève ton revenu par nuit disponible du mois dernier. Tu le compareras dans 3 mois.
lien: /dashboard/performances
bouton: Voir mes performances
:::`,
        },
      ],
    },
  ],
}
