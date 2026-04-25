export default {
  slug: 'point-mort-lcd-calcul-rentabilite-hote',
  title: 'Calculer son point mort en location courte durée : la méthode en 4 lignes',
  description: 'Le point mort est le nombre de nuits minimum pour couvrir tes coûts. Voici comment le calculer précisément, savoir si ton logement est rentable, et combien de nuits viser par mois.',
  keywords: 'point mort LCD, rentabilité location courte durée, seuil rentabilité Airbnb, calculer rentabilité gîte, marge LCD',
  date: '2026-04-25',
  categorySlug: 'revenus',
  readTime: 6,

  lead: 'Beaucoup d\'hôtes louent en LCD sans connaître leur point mort — le nombre exact de nuits par mois nécessaire pour rentrer dans ses frais. Le résultat : ils prennent des décisions tarifaires à l\'instinct sans savoir si elles compromettent leur marge. Voici la méthode chiffrée pour calculer ton point mort en 4 lignes.',

  sections: [
    {
      h2: '1. Pourquoi le point mort est ton chiffre #1',
      content: [
        { type: 'p', text: 'Le point mort (ou seuil de rentabilité) est le nombre de nuits réservées par mois à partir duquel tu commences à gagner de l\'argent. En dessous, tu perds. Au-dessus, tout ce qui rentre est marge nette. Connaître ce chiffre te dit immédiatement si une période est rentable, et combien tu peux baisser ton prix sans perdre.' },
        { type: 'p', text: 'Sans point mort calculé, tu acceptes des séjours longs à -25 % parce que "ça remplit le calendrier" sans savoir que tu travailles à perte certaines nuits. Ou tu refuses des nuits à 30 € en basse saison alors qu\'elles seraient rentables si tu connaissais ton coût marginal.' },
      ],
    },
    {
      h2: '2. Le calcul en 4 lignes',
      content: [
        { type: 'p', text: 'Tu as besoin de 4 chiffres pour un point mort fiable.' },
        { type: 'ul', items: [
          'Coûts fixes mensuels (charges, copropriété, assurance, internet, abonnements logiciels) — exemple : 350 €',
          'Coût variable par nuitée (ménage, consommables, eau/électricité supplémentaire, commission plateforme) — exemple : 25 €',
          'Tarif moyen pratiqué (TTC voyageur, brut sans déduction) — exemple : 90 €',
          'Marge nette par nuit = tarif − coût variable − commission Airbnb (3 %) = 90 − 25 − 2,7 = 62,3 €',
        ]},
        { type: 'p', text: 'Point mort = coûts fixes ÷ marge nette par nuit = 350 ÷ 62,3 = 5,6 nuits. Tu dois donc louer 6 nuits par mois pour atteindre l\'équilibre. Toute nuit au-delà génère 62,3 € de marge nette pour toi.' },
      ],
    },
    {
      h2: '3. Lire ton point mort pour piloter tes décisions',
      content: [
        { type: 'p', text: 'Une fois ton point mort connu, tu peux prendre des décisions tarifaires en confiance. Quelques exemples concrets.' },
        { type: 'ul', items: [
          'Si ton point mort est à 6 nuits/mois et tu en fais 18 en moyenne, tu peux te permettre de tester un tarif -20 % en basse saison sans risque',
          'Si tu hésites à accepter un séjour de 7 nuits à 70 €/nuit (au lieu des 90 € habituels), calcule : marge = (70 − 25 − 2) × 7 = 301 €. C\'est plus que la marge d\'un week-end à 90 € (2 × 62 = 124 €)',
          'Si tu envisages un investissement (rénover la salle de bain, 4 000 €), divise par ta marge nette par nuit : 4 000 ÷ 62 = 64 nuits. C\'est 4 mois de location à amortir',
        ]},
        { type: 'tip', text: 'Refais ton calcul tous les 6 mois. Les charges (énergie, copropriété, assurance) augmentent, ton coût variable bouge avec le prix des consommables. Un point mort à jour reflète la réalité actuelle.' },
      ],
    },
    {
      h2: '4. Les pièges qui faussent ton point mort',
      content: [
        { type: 'p', text: 'Trois erreurs récurrentes faussent le calcul et donnent un point mort trop bas (donc une fausse impression de rentabilité).' },
        { type: 'ul', items: [
          'Oublier l\'amortissement du logement et du mobilier — sur 7 ans, un mobilier neuf de 8 000 € = 95 €/mois à intégrer',
          'Ne pas compter ton temps — si tu passes 10 h/semaine sur ton activité, valorise au moins au SMIC (110 €/semaine = 480 €/mois à intégrer dans les fixes ou le coût variable)',
          'Sous-estimer les imprévus (panne de chauffe-eau, dégât voyageur) — provisionner 5 % du CA mensuel = ~75 €/mois à ajouter aux fixes',
        ]},
        { type: 'cta', text: 'Tu veux apprendre à piloter ta rentabilité LCD avec des tableaux de bord pros et des décisions tarifaires basées sur les chiffres ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'tarification-dynamique-lcd',                       label: 'Tarification dynamique : par où commencer', categoryLabel: 'Revenus' },
    { slug: 'fixer-prix-minimum-airbnb-lcd',                    label: 'Fixer le prix minimum Airbnb',           categoryLabel: 'Revenus' },
    { slug: 'mesurer-performance-canal-reservation-directe-kpi', label: 'KPIs réservation directe',              categoryLabel: 'Revenus' },
  ],
}
