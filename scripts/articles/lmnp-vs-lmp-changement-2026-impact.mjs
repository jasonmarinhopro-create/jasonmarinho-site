export default {
  slug: 'lmnp-vs-lmp-changement-2026-impact',
  title: 'LMNP ou LMP en 2026 : ce qui change pour les hôtes Airbnb français',
  description: 'Le statut LMNP a perdu de son avantage en 2025-2026. Quelle différence concrète avec LMP, comment basculer et quel impact fiscal selon ton profil.',
  keywords: 'LMNP 2026, LMP location courte durée, statut fiscal Airbnb, loueur meublé professionnel non professionnel',
  date: '2026-04-25',
  categorySlug: 'fiscalite',
  readTime: 7,

  lead: 'Le LMNP (Loueur en Meublé Non Professionnel) était LE statut fiscal préféré des hôtes Airbnb. La loi de finances 2025 a changé la donne. En 2026, les seuils, les avantages et les bascules vers LMP (Loueur en Meublé Professionnel) impactent directement ta marge nette. Voici ce que tu dois savoir.',

  sections: [
    {
      h2: '1. Rappel des 2 statuts',
      content: [
        { type: 'p', text: 'En LCD, tu loues un logement meublé. Tu peux être LMNP (par défaut) ou LMP selon les seuils.' },
        { type: 'ul', items: [
          'LMNP : recettes annuelles < 23 000 € OU revenus locatifs < 50 % des revenus globaux du foyer. Impôts au régime micro-BIC (50 % d\'abattement) ou réel (frais déductibles)',
          'LMP : recettes ≥ 23 000 € ET représentent > 50 % des revenus du foyer. Impôts en BIC professionnel, charges sociales spécifiques, plus-values traitées différemment',
          'Bascule : automatique selon les seuils, pas de choix volontaire',
        ]},
      ],
    },
    {
      h2: '2. Ce qui a changé en 2025-2026',
      content: [
        { type: 'p', text: 'La loi de finances 2025 a réduit les avantages LMNP, en particulier sur l\'amortissement.' },
        { type: 'ul', items: [
          'Plus-values LMNP : depuis 2025, les amortissements pratiqués réduisent la valeur d\'achat lors de la revente, ce qui augmente la plus-value imposable. Avant, ils étaient sans impact à la revente',
          'Le seuil de 23 000 € qui définit la bascule LMP/LMNP n\'a pas bougé mais peut être reconsidéré en 2027',
          'Le micro-BIC LMNP avec abattement 50 % reste valable jusqu\'à 77 700 € de CA, mais l\'État pousse vers le régime réel',
          'Les recettes des plateformes sont automatiquement transmises au fisc (DAC 7 européen) — plus de marges grises',
        ]},
        { type: 'tip', text: 'Si tu as acheté ton logement spécifiquement pour la LCD avec emprunt, le régime LMNP au réel reste avantageux car tu déduis les intérêts d\'emprunt + amortissement. Mais le calcul de plus-value à la revente est moins favorable qu\'avant.' },
      ],
    },
    {
      h2: '3. LMNP vs LMP : la matrice de décision',
      content: [
        { type: 'p', text: 'Choisir entre les deux n\'est pas vraiment un choix — c\'est mécaniquement déterminé par tes seuils. Mais tu peux jouer sur ta structure pour rester en LMNP plus longtemps.' },
        { type: 'ul', items: [
          'Recettes < 23 000 € : LMNP automatique, statut le plus simple, micro-BIC suffit',
          'Recettes 23-50 000 € + revenus salariaux > 50 % : LMNP au réel devient pertinent (déduction frais)',
          'Recettes > 50 000 € : tu approches LMP. Considère SCI ou SARL pour optimisation patrimoniale',
          'Recettes > 23 000 € + revenus locatifs majoritaires : LMP automatique, charges sociales TNS à anticiper',
        ]},
      ],
    },
    {
      h2: '4. Optimiser sa fiscalité LCD en 2026',
      content: [
        { type: 'p', text: 'Quel que soit ton statut, voici les leviers d\'optimisation immédiatement applicables.' },
        { type: 'ul', items: [
          'Opter pour le régime réel si tes charges réelles dépassent l\'abattement micro-BIC (50 % du CA) — vrai dès que tu as un emprunt ou des amortissements',
          'Bien comptabiliser les amortissements (mobilier sur 7 ans, gros électroménager sur 5 ans, immeuble si propriétaire sur 30-50 ans)',
          'Déduire toutes les charges pro (assurance, internet, abonnements logiciels, formations, frais de comptable)',
          'Si tu crées une activité conciergerie en plus : structure dédiée pour ne pas mélanger LMNP perso et activité commerciale',
          'Anticiper la revente : amortissement réduit la base à la revente — important si tu prévois de revendre dans les 5 ans',
        ]},
        { type: 'cta', text: 'Tu veux structurer ta fiscalité LCD avec un expert et éviter les erreurs coûteuses ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'location-courte-duree-impots-france',              label: 'LCD et impôts en France',               categoryLabel: 'Fiscalité' },
    { slug: 'tva-location-courte-duree-2026',                   label: 'TVA LCD : qui est concerné',            categoryLabel: 'Fiscalité' },
    { slug: 'tva-petit-dejeuner-lcd-seuil-37500-2026-detail',   label: 'TVA petit-déjeuner seuil 37500',         categoryLabel: 'Fiscalité' },
  ],
}
