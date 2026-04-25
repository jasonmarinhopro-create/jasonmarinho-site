export default {
  slug: 'marge-nette-par-nuitee-suivi-precis',
  title: 'Marge nette par nuitée : le seul KPI qui compte vraiment en LCD',
  description: 'Le revenu brut Airbnb ne dit rien de ta vraie rentabilité. Apprends à calculer ta marge nette par nuitée et à l\'optimiser sans toucher à ton tarif affiché.',
  keywords: 'marge nette par nuitée, rentabilité par nuit Airbnb, RevPAR LCD, profit par nuitée location courte durée',
  date: '2026-04-25',
  categorySlug: 'revenus',
  readTime: 6,

  lead: 'Beaucoup d\'hôtes LCD célèbrent leurs revenus bruts mensuels Airbnb sans réaliser qu\'ils peuvent baisser leur marge nette par nuitée en augmentant leur volume. Ce KPI — la marge nette par nuit louée — est le seul qui te dit vraiment si ton activité est saine. Voici comment le calculer et l\'utiliser pour piloter.',

  sections: [
    {
      h2: '1. La différence entre revenu brut et marge nette par nuit',
      content: [
        { type: 'p', text: 'Le revenu brut, c\'est ce qu\'Airbnb te verse en fin de mois. La marge nette par nuit, c\'est ce qui reste dans ta poche après TOUS les coûts (fixes amortis sur le mois + variables liés à la nuit).' },
        { type: 'p', text: 'Exemple concret. Tu fais 25 nuits à 90 € en mai = 2 250 € de revenu brut Airbnb (après commission 3 % = 2 182 €). Tes coûts fixes mensuels : 350 €. Tes coûts variables par nuit : 25 €. Marge nette du mois = 2 182 - 350 - (25×25) = 1 207 €. Marge nette par nuit = 1 207 / 25 = 48,3 €.' },
        { type: 'p', text: 'Ce chiffre — 48,3 € — est la VRAIE valeur économique d\'une nuit louée chez toi. Si tu en restes à "j\'ai fait 2 250 € de revenu", tu pilotes mal.' },
      ],
    },
    {
      h2: '2. Comment l\'augmenter sans changer le tarif affiché',
      content: [
        { type: 'p', text: 'La marge nette par nuit dépend de 3 leviers : le tarif affiché (que beaucoup d\'hôtes hésitent à monter par peur), les coûts variables (souvent gonflés sans être surveillés), et les coûts fixes (souvent ignorés). Tu peux l\'optimiser sans toucher au tarif.' },
        { type: 'ul', items: [
          'Réduire le coût ménage de 5-8 € par séjour via blanchisserie externalisée ou rationalisation = +5 €/nuit de marge sur les courts séjours',
          'Renégocier ton internet, assurance, copropriété tous les 12 mois — gain typique 10-20 % sur les fixes = +1-2 €/nuit',
          'Activer le canal direct (Driing, GMB, Instagram) — économie 15 % de commission Airbnb sur 25 % des réservations = +3-4 €/nuit moyen',
          'Supprimer les abonnements logiciels redondants (channel manager + PMS qui font doublon) = +1-2 €/nuit',
        ]},
        { type: 'tip', text: 'Calcule ta marge nette par nuit chaque mois pendant 6 mois. Tu verras vite quels mois sont vraiment rentables et quels gestes augmentent ou baissent ce chiffre.' },
      ],
    },
    {
      h2: '3. Le piège du volume au détriment de la marge',
      content: [
        { type: 'p', text: 'Beaucoup d\'hôtes pensent que plus de nuits louées = plus de profit. C\'est faux quand ces nuits supplémentaires sont à un tarif qui détruit la marge nette unitaire.' },
        { type: 'p', text: 'Cas concret. En basse saison, tu peux faire 15 nuits à 90 € (marge 48 €/nuit, total 720 €) ou 22 nuits à 70 € avec remise grosses durées (marge 32 €/nuit, total 704 €). Tu travailles plus pour gagner moins. Le calcul de marge nette par nuit te révèle ces faux gains.' },
        { type: 'ul', items: [
          'Garde un seuil de marge minimum acceptable (ex. 35 €/nuit) — refuse tout ce qui descend en dessous',
          'Trace ta marge moyenne mensuelle sur 12 mois — détecte les saisons où tu vendes mal',
          'Ne baisse jamais tes tarifs sans recalculer ta marge nette projetée',
        ]},
      ],
    },
    {
      h2: '4. Construire son tableau de bord en 30 minutes',
      content: [
        { type: 'p', text: 'Tu peux suivre ta marge nette par nuit dans un simple Google Sheet. Voici les 7 colonnes à mettre en place pour avoir un pilotage propre.' },
        { type: 'ul', items: [
          'Mois (janvier, février...)',
          'Nuits louées (compté depuis Airbnb/Booking)',
          'Revenu brut perçu (montants reçus de chaque plateforme)',
          'Coûts fixes (constant chaque mois)',
          'Coûts variables (nuits × coût variable + ménages)',
          'Marge nette = Revenu brut − Coûts fixes − Coûts variables',
          'Marge nette par nuit = Marge nette / Nuits louées',
        ]},
        { type: 'p', text: 'En 6 mois de suivi, tu auras une vision claire de tes 3 saisons (haute / mid / basse), de tes mois les plus rentables et de l\'impact de chaque décision tarifaire.' },
        { type: 'cta', text: 'Tu veux mettre en place un suivi pro de tes performances LCD ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'point-mort-lcd-calcul-rentabilite-hote',           label: 'Calculer son point mort LCD',           categoryLabel: 'Revenus' },
    { slug: 'budget-annuel-hote-lcd-grille-couts',              label: 'Budget annuel hôte LCD',                categoryLabel: 'Revenus' },
    { slug: 'tarification-dynamique-lcd',                       label: 'Tarification dynamique',                categoryLabel: 'Revenus' },
  ],
}
