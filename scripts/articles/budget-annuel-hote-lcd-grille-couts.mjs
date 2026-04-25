export default {
  slug: 'budget-annuel-hote-lcd-grille-couts',
  title: 'Budget annuel d\'un hôte LCD : la grille de coûts complète pour anticiper',
  description: 'Tous les postes de coûts annuels d\'un hôte LCD français en 2026, avec fourchettes par taille de logement. Le tableau qu\'aucun hôte ne te montre.',
  keywords: 'budget annuel hôte LCD, coûts location courte durée, charges Airbnb, grille tarifaire hôte 2026',
  date: '2026-04-25',
  categorySlug: 'revenus',
  readTime: 7,

  lead: 'Quand tu démarres en location courte durée, tu connais ton tarif et ton occupation. Mais quand on te demande "quelle est ta marge nette annuelle ?", la plupart des hôtes ne savent pas. Voici une grille complète des coûts annuels d\'un hôte LCD français en 2026, par poste, avec les fourchettes observées sur 250 hôtes.',

  sections: [
    {
      h2: '1. Les coûts fixes incompressibles',
      content: [
        { type: 'p', text: 'Ce sont les coûts que tu paies, peu importe ton occupation. Ils représentent en moyenne 35-45 % de tes charges totales.' },
        { type: 'ul', items: [
          'Charges de copropriété : 600-2 400 €/an selon le bâtiment',
          'Taxe foncière (à proportion si résidence principale partielle) : 300-1 800 €/an',
          'Assurance LCD multi-risques : 250-800 €/an (toujours dédiée LCD, jamais l\'assurance habitation classique)',
          'Internet fibre : 360-540 €/an',
          'Abonnements logiciels (PMS, channel manager, pricing tool) : 240-600 €/an',
          'Eau / électricité / gaz part fixe : 600-1 500 €/an',
          'Forfait téléphonique pro : 0-180 €/an',
        ]},
        { type: 'p', text: 'Total fixes typique pour un studio en ville : 2 500-4 500 €/an. Pour un T3 ou maison : 4 000-8 000 €/an.' },
      ],
    },
    {
      h2: '2. Les coûts variables liés aux séjours',
      content: [
        { type: 'p', text: 'Ces coûts augmentent avec ton nombre de nuits louées. Ils représentent 30-45 % du total selon ton taux d\'occupation.' },
        { type: 'ul', items: [
          'Ménage (main-d\'œuvre + produits) : 25-50 € par séjour, soit 600-2 400 €/an',
          'Linge (rachat, nettoyage, location) : 200-1 000 €/an',
          'Consommables (savon, papier, café, sel/poivre) : 100-300 €/an',
          'Énergie variable (chauffage, clim) : 300-1 500 €/an',
          'Provisions casse / dégâts (5 % du CA) : variable selon ton CA',
          'Commissions plateformes (3-15 % du CA) : variable',
        ]},
      ],
    },
    {
      h2: '3. Les investissements et amortissements',
      content: [
        { type: 'p', text: 'Trop d\'hôtes oublient ces coûts en pensant rentabilité. Ils plombent pourtant la marge réelle.' },
        { type: 'ul', items: [
          'Mobilier amortissement (sur 7 ans) : 4 000-12 000 € initial = 570-1 700 €/an',
          'Décoration et home staging : 200-600 €/an pour rester à jour',
          'Petit électroménager (machines à café, aspirateurs) renouvellement : 150-400 €/an',
          'Entretien préventif (peinture, joints, plomberie) : 300-1 200 €/an',
          'Photographie pro tous les 2-3 ans : 100-200 €/an amorti',
        ]},
        { type: 'tip', text: 'Si tu envisages un investissement (ex. terrasse rénovée, jacuzzi), divise le coût par ta marge nette annuelle pour connaître le nombre d\'années d\'amortissement. En dessous de 5 ans, c\'est généralement un bon investissement LCD.' },
      ],
    },
    {
      h2: '4. Synthèse pour 3 profils types',
      content: [
        { type: 'p', text: 'Pour finir, voici ce que représente le budget annuel total pour 3 profils d\'hôtes français en 2026.' },
        { type: 'ul', items: [
          'Studio Lyon hyper-centre, 22 m², 65 % d\'occupation : 6 200 €/an de charges, marge nette ~ 12 000-16 000 €/an',
          'T2 Bordeaux quartier touristique, 50 m², 60 % d\'occupation : 9 800 €/an de charges, marge nette ~ 18 000-25 000 €/an',
          'Gîte rural en Bourgogne, 100 m² 6 personnes, 45 % d\'occupation : 14 500 €/an de charges, marge nette ~ 20 000-30 000 €/an',
        ]},
        { type: 'p', text: 'Ces fourchettes intègrent tous les postes ci-dessus, hors fiscalité (à ajouter selon ton statut LMNP/LMP). La marge nette est ce qui te reste réellement à la fin de l\'année, après tous les coûts d\'exploitation.' },
        { type: 'cta', text: 'Tu veux structurer ta comptabilité LCD et identifier où optimiser tes marges ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'point-mort-lcd-calcul-rentabilite-hote',           label: 'Calculer son point mort LCD',           categoryLabel: 'Revenus' },
    { slug: 'location-courte-duree-impots-france',              label: 'LCD et impôts en France',               categoryLabel: 'Fiscalité' },
    { slug: 'frais-menage-airbnb-combien-facturer-2026',        label: 'Frais de ménage Airbnb 2026',           categoryLabel: 'Revenus' },
  ],
}
