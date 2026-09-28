export default {
  slug: 'regime-reel-vs-micro-bic-decision-2026',
  title: 'Micro-BIC ou régime réel en LCD : la décision avec calculs en 2026',
  description: 'Micro-BIC à 30 % (50 % si classé) ou régime réel ? Le réel peut te faire économiser 1500 à 4000€/an. Calculs concrets pour décider.',
  keywords: 'micro-BIC LCD, régime réel Airbnb, abattement 30% Airbnb, déduction frais LCD 2026',
  date: '2026-04-25',
  categorySlug: 'fiscalite',
  readTime: 6,

  lead: 'En LMNP, tu as 2 régimes fiscaux possibles : micro-BIC (par défaut, abattement 30 %, ou 50 % pour un meublé classé) ou régime réel (déduction de toutes tes charges réelles). Beaucoup d\'hôtes restent au micro-BIC par défaut, alors que le réel leur ferait économiser plus de 1 500 €/an. Voici le calcul en 5 minutes.',

  sections: [
    {
      h2: '1. Comment fonctionne chaque régime',
      content: [
        { type: 'p', text: 'Micro-BIC : tu déclares ton CA brut et bénéficies d\'un abattement forfaitaire de 30 % pour un meublé non classé (plafond 15 000 €), 50 % pour un meublé classé (plafond 83 600 € sur les revenus 2026). Tu payes l\'impôt sur le reste.' },
        { type: 'p', text: 'Régime réel : tu déclares ton CA brut et déduis toutes tes charges réelles (intérêts d\'emprunt, copropriété, assurance, ménage, amortissement mobilier, etc.). Tu payes l\'impôt sur le bénéfice net réel.' },
        { type: 'tip', text: 'Le calcul est simple : si tes charges réelles + amortissement représentent plus de 30 % de ton CA (50 % si ton meublé est classé), le régime réel est plus avantageux. Avec un emprunt récent, c\'est presque toujours le cas.' },
      ],
    },
    {
      h2: '2. Calcul comparatif sur un cas typique',
      content: [
        { type: 'p', text: 'Prenons un T2 acheté 250 000 € avec emprunt sur 20 ans (mensualité ~1 200 €), loué en LCD à 1 800 €/mois de CA brut.' },
        { type: 'ul', items: [
          'CA annuel brut : 1 800 × 12 = 21 600 €',
          'Micro-BIC, possible seulement si le meublé est classé (21 600 € dépasse le plafond de 15 000 € sans classement), abattement 50 % : revenu imposable = 10 800 €. Si TMI 30 % + 18,6 % de prélèvements sociaux = 5 249 € d\'imposition',
          'Régime réel : intérêts emprunt 6 000 € + copro 800 € + assurance 400 € + amortissement mobilier 700 € + amortissement immeuble 4 500 € + autres charges 1 200 € = 13 600 € de charges. Bénéfice = 21 600 − 13 600 = 8 000 €',
          'Régime réel impôt : 8 000 × (30 % + 18,6 %) = 3 888 €',
          'Économie régime réel vs micro-BIC : 5 249 − 3 888 = 1 361 €/an',
        ]},
      ],
    },
    {
      h2: '3. Quand chaque régime est plus pertinent',
      content: [
        { type: 'p', text: 'Voici la matrice de décision basée sur ton profil.' },
        { type: 'ul', items: [
          'Micro-BIC classé (abattement 50 %) : pertinent si tu loues sans emprunt ET avec peu de charges (<30 % du CA). Typiquement : résidence secondaire payée comptant',
          'Micro-BIC non classé (abattement 30 %, recettes sous 15 000 €) : à recalculer car l\'abattement réduit baisse l\'avantage. Le réel devient quasi toujours plus intéressant',
          'Régime réel : presque toujours plus avantageux si tu as un emprunt en cours, des charges importantes, ou de l\'amortissement à pratiquer',
          'Régime réel + amortissement immeuble : nécessite que l\'immeuble soit dans ton patrimoine pro (BIC). Comptable spécialisé recommandé',
        ]},
      ],
    },
    {
      h2: '4. Comment basculer en régime réel',
      content: [
        { type: 'p', text: 'Le passage au régime réel se fait via une simple déclaration auprès du SIE (Service des Impôts des Entreprises) avant le 1er février de l\'année concernée. La bascule est valable pour 1 an renouvelable tacitement.' },
        { type: 'ul', items: [
          'Tu envoies un courrier au SIE indiquant que tu opte pour le régime réel BIC (modèle dispo sur impots.gouv.fr)',
          'Tu tiens une comptabilité simplifiée : registre des recettes, journal des dépenses, livre d\'inventaire',
          'Tu déclares en 2031-K-bis et 2031-bis (déclaration BIC) avec ton 2042-C-PRO',
          'Si tu n\'es pas comptable, prends un comptable spécialisé LCD (~600-1 200 €/an, déductible)',
          'Le coût comptable est largement compensé par l\'économie fiscale dans 90 % des cas',
        ]},
        { type: 'cta', text: 'Tu veux comprendre toute la fiscalité LCD pour optimiser sereinement ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'lmnp-vs-lmp-changement-2026-impact',               label: 'LMNP ou LMP en 2026',                    categoryLabel: 'Fiscalité' },
    { slug: 'location-courte-duree-impots-france',              label: 'LCD et impôts en France',               categoryLabel: 'Fiscalité' },
    { slug: 'declarer-activite-location-courte-duree-france-demarches', label: 'Déclarer son activité LCD',     categoryLabel: 'Réglementation' },
  ],
}
