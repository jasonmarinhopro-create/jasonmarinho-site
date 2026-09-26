export default {
  slug: 'reporting-mensuel-lcd-7-indicateurs-piloter-activite',
  title: 'Reporting mensuel LCD : 7 indicateurs à suivre chaque mois pour piloter ton activité',
  description: 'Taux d\'occupation, ADR, RevPAR, mix de canaux, avis, coût d\'acquisition, marge nette : les 7 chiffres à relever tous les 5 du mois pour piloter ta location courte durée sans naviguer à vue.',
  keywords: 'reporting mensuel LCD, KPI location courte durée, tableau de bord hôte Airbnb, ADR RevPAR taux occupation, indicateurs performance LCD',
  date: '2026-09-21',
  categorySlug: 'revenus',
  readTime: 7,

  lead: 'Beaucoup d\'hôtes LCD ouvrent Airbnb, regardent le solde qui vient d\'être versé, et considèrent que c\'est ça, le pilotage. Sauf que ce chiffre ne dit rien de la santé réelle de ton activité. Voici les 7 indicateurs à noter chaque début de mois pour comprendre ce qui marche, ce qui décroche, et sur quoi agir avant de perdre une saison entière.',

  sections: [
    {
      h2: '1. Le taux d\'occupation mensuel réel',
      content: [
        { type: 'p', text: 'C\'est le premier chiffre. Nombre de nuits louées divisé par nombre de nuits ouvertes à la vente sur le mois. Attention : pas divisé par le nombre de jours du mois. Si tu as bloqué 8 nuits pour toi ou pour des travaux, elles sortent du dénominateur, sinon ton taux d\'occupation est faussé à la baisse et tu prends de mauvaises décisions tarifaires derrière.' },
        { type: 'p', text: 'Un taux d\'occupation isolé ne veut rien dire : c\'est sa comparaison au même mois de l\'année précédente et à la moyenne de ta zone qui parle. Un outil comme <a href="/blog/airdna-mode-emploi-hote-lcd-debutant" style="color:var(--g);font-weight:500">AirDNA en mode démarrage pour hôte débutant</a> peut te donner cette moyenne locale, et tu la mets dans ton tableau à côté de ton propre chiffre.' },
        { type: 'tip', text: 'Note toujours le taux d\'occupation à côté du prix moyen. Un taux à 90 % avec un prix qui a baissé de 20 % veut dire que tu remplis en te bradant, pas que tu performes.' },
      ],
    },
    {
      h2: '2. Le prix moyen par nuit encaissée (ADR)',
      content: [
        { type: 'p', text: 'L\'ADR (Average Daily Rate) c\'est le total encaissé sur le mois divisé par le nombre de nuits louées. C\'est ce que ta nuit vaut vraiment, une fois retirés les rabais grosses durées, les codes promo et les frais annexes. Pas ton prix affiché.' },
        { type: 'p', text: 'C\'est souvent la mauvaise surprise du reporting : l\'hôte pensait vendre à 120 € la nuit et se rend compte qu\'en réalité son ADR tourne à 92 € parce que Airbnb applique des rabais automatiques et parce qu\'il accepte trop de séjours longs avec 30 % de remise. Si tu veux te reposer la question du plancher tarifaire, le calcul est détaillé dans <a href="/blog/fixer-prix-minimum-airbnb-lcd" style="color:var(--g);font-weight:500">notre méthode pour fixer un prix minimum sans se brader</a>.' },
      ],
    },
    {
      h2: '3. Le RevPAR : revenu par nuit disponible',
      content: [
        { type: 'p', text: 'RevPAR = revenu total du mois / nuits disponibles. Autrement dit ADR × taux d\'occupation. C\'est LE chiffre qui compte quand tu compares deux mois entre eux, parce qu\'il te dit combien chaque nuit ouverte à la vente a rapporté en moyenne, même celles qui sont restées vides.' },
        { type: 'p', text: 'Concrètement : un mois à 25 nuits louées à 110 € (ADR 110, occupation 83 %, RevPAR 91 €) est meilleur qu\'un mois à 28 nuits louées à 85 € (ADR 85, occupation 93 %, RevPAR 79 €). Sans le RevPAR, tu croirais que le deuxième mois est plus fort parce que tu as encaissé plus de nuits.' },
        { type: 'ul', items: [
          'RevPAR en hausse mois après mois : ton offre gagne en valeur perçue',
          'RevPAR stable avec occupation qui monte : tu remplis mieux mais tu ne montes pas en gamme',
          'RevPAR en baisse avec occupation qui monte : tu bradees pour remplir, danger',
          'RevPAR en baisse avec occupation en baisse : tes prix sont trop hauts pour ton offre',
        ]},
      ],
    },
    {
      h2: '4. La répartition du chiffre d\'affaires par canal',
      content: [
        { type: 'p', text: 'Sur chaque euro encaissé le mois dernier, combien vient d\'Airbnb ? De Booking ? De tes réservations directes ? De Driing ? Cette ligne dans le reporting est celle qui te dit à quel point ton activité dépend d\'une seule plateforme, et donc d\'un seul algorithme, d\'un seul changement de règles, d\'un seul suspend de compte.' },
        { type: 'p', text: 'L\'objectif à moyen terme, c\'est de sortir progressivement d\'une dépendance à 100 % Airbnb. Tu peux commencer par activer <a href="/services/annonce-directe" style="color:var(--g);font-weight:500">un canal de réservation directe simple</a> et suivre chaque mois le pourcentage de revenu qui bascule dessus. Un hôte qui passe de 5 % à 25 % de revenu direct en 12 mois a divisé son risque plateforme par cinq.' },
        { type: 'tip', text: 'Range tes canaux dans l\'ordre décroissant du revenu net, pas du revenu brut. Un canal à 20 % de commission qui rapporte 3 000 € brut ne te laisse que 2 400 € : moins qu\'un canal direct qui a fait 2 700 € brut.' },
      ],
    },
    {
      h2: '5. La note moyenne et le volume d\'avis reçus',
      content: [
        { type: 'p', text: 'Chaque mois, deux chiffres à relever côté avis : ta note moyenne (globale, mais aussi sur les sous-critères propreté et communication) et le nombre d\'avis reçus dans le mois. Un volume d\'avis en baisse alors que ton occupation reste bonne, c\'est un signal : soit tu ne relances pas assez, soit ton expérience post-séjour ne donne pas envie de laisser un mot.' },
        { type: 'p', text: 'Si un ou deux commentaires ont fait chuter la moyenne, c\'est le moment de comprendre pourquoi et de corriger avant que ça devienne une tendance. La façon de répondre compte autant que la note elle-même : <a href="/blog/gerer-mauvais-avis-airbnb-reponse-hote" style="color:var(--g);font-weight:500">notre méthode pour répondre à un mauvais avis sans perdre ton classement</a> détaille ce qu\'il faut faire et ce qu\'il faut éviter dans les 48h.' },
      ],
    },
    {
      h2: '6. Le coût d\'acquisition par réservation',
      content: [
        { type: 'p', text: 'Combien te coûte, en moyenne, chaque réservation ce mois-ci ? Commissions plateformes, dépenses publicitaires éventuelles, abonnements marketing, temps passé (à valoriser à un taux horaire réaliste) : divise le tout par le nombre de réservations. Tu obtiens ton coût d\'acquisition par réservation, canal par canal.' },
        { type: 'p', text: 'Ce chiffre-là fait tomber pas mal d\'illusions. Une plateforme "gratuite" qui te prend 20 heures par mois n\'est pas gratuite. Un canal Instagram qui rapporte 3 réservations pour 15 heures de contenu produit peut être plus cher au final qu\'Airbnb. Il ne faut pas arrêter pour autant, mais tu sauras au moins ce que tu payes vraiment pour chaque euro qui tombe.' },
      ],
    },
    {
      h2: '7. La marge nette du mois',
      content: [
        { type: 'p', text: 'Le chiffre final. Revenu brut encaissé moins commissions, moins ménages, moins consommables, moins quote-part mensuelle des charges fixes (assurance, internet, copropriété, abonnements logiciels, taxe foncière étalée). Ce qui reste, c\'est la marge nette du mois. C\'est le seul chiffre que tu peux comparer honnêtement d\'un mois sur l\'autre, quelle que soit la saison.' },
        { type: 'p', text: 'Pour aller plus loin sur la logique du calcul et l\'exploiter comme un vrai levier de pilotage, on a détaillé la <a href="/blog/marge-nette-par-nuitee-suivi-precis" style="color:var(--g);font-weight:500">marge nette par nuitée en LCD</a> qui prolonge naturellement ce reporting mensuel avec un chiffre par nuit louée.' },
        { type: 'ul', items: [
          'Marge nette positive et en hausse : ton modèle est sain, tu peux réinvestir',
          'Marge nette positive mais en baisse : tes coûts variables dérivent, à contrôler poste par poste',
          'Marge nette proche de zéro avec forte occupation : ton tarif ne couvre plus l\'usure et le temps passé',
          'Marge nette négative : ne baisse pas les prix, remonte au calcul de ton point mort avant tout',
        ]},
      ],
    },
    {
      h2: 'Le rituel qui fait la différence : 30 minutes le 5 du mois',
      content: [
        { type: 'p', text: 'Le reporting ne sert à rien s\'il n\'est pas régulier. Pose-toi un rendez-vous fixe : le 5 de chaque mois, 30 minutes bloquées, un Google Sheet ouvert avec ces 7 lignes plus les 12 mois glissants en colonnes. Tu relèves, tu compares au même mois de l\'an passé, tu notes une ligne "décision du mois". Une seule action à mener, tirée du chiffre qui a le plus bougé.' },
        { type: 'p', text: 'Les hôtes qui pilotent vraiment leur activité ne sont pas ceux qui ont le plus gros CA. Ce sont ceux qui savent, chaque mois, sur quel levier appuyer pour améliorer la ligne qui décroche. Une saison sans reporting, c\'est une saison où tu apprends après coup ce que tu aurais pu changer à temps.' },
        { type: 'cta', text: 'Tu veux progresser sur les leviers de revenus qui comptent vraiment en LCD ?', button: 'Découvrir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'marge-nette-par-nuitee-suivi-precis',              label: 'Marge nette par nuitée',                categoryLabel: 'Revenus' },
    { slug: 'statistiques-annonce-airbnb-4-kpis-essentiels',    label: '4 KPIs essentiels côté Airbnb',        categoryLabel: 'Visibilité' },
    { slug: 'budget-annuel-hote-lcd-grille-couts',              label: 'Budget annuel hôte LCD',                categoryLabel: 'Revenus' },
  ],
}
