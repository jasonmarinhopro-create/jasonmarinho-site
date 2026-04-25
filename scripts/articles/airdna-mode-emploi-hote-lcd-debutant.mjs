export default {
  slug: 'airdna-mode-emploi-hote-lcd-debutant',
  title: 'AirDNA mode d\'emploi : utiliser les data marché pour optimiser ton tarif LCD',
  description: 'AirDNA agrège les données Airbnb/VRBO de ta zone. Voici comment t\'en servir pour fixer ton tarif, identifier la concurrence et anticiper les saisons.',
  keywords: 'AirDNA mode emploi, données marché Airbnb, benchmark concurrence LCD, MarketMinder hôte',
  date: '2026-04-25',
  categorySlug: 'revenus',
  readTime: 5,

  lead: 'AirDNA est l\'outil de référence pour analyser le marché LCD. Il agrège les données Airbnb et VRBO de ta zone : tarifs, occupations, équipements, classements. Bien utilisé, il t\'évite de tarifer à l\'aveugle. Voici le guide pratique pour démarrer.',

  sections: [
    {
      h2: '1. Que voit-on sur AirDNA',
      content: [
        { type: 'p', text: 'AirDNA scrape les annonces publiques d\'Airbnb et VRBO et calcule des indicateurs marché par zone. Pour une rue, un quartier, une ville, tu peux voir.' },
        { type: 'ul', items: [
          'Tarif moyen / médian / percentile par taille de logement',
          'Taux d\'occupation moyen sur 12 mois glissants',
          'RevPAR (revenu par logement disponible) — KPI central',
          'Saisonnalité graphique mois par mois',
          'Évolution sur 1-3 ans (tendance hausse ou baisse)',
          'Top performers (annonces les mieux notées et les plus rentables)',
        ]},
      ],
    },
    {
      h2: '2. Comment l\'utiliser pour fixer ton tarif',
      content: [
        { type: 'p', text: 'Avant de paramétrer ton premier tarif Airbnb, fais cette analyse en 30 minutes.' },
        { type: 'ul', items: [
          'Étape 1 : entre l\'adresse de ton logement et applique les filtres exacts (T2, 4 personnes, équipements clés)',
          'Étape 2 : note les tarifs médian/percentile 75 pour ton type de logement, ta zone, sur 12 mois',
          'Étape 3 : positionne ton tarif initial à 5-10 % EN-DESSOUS du médian pour démarrer (volume avant marge)',
          'Étape 4 : après 3 mois et 5+ avis, monte au médian',
          'Étape 5 : après 12 mois et 25+ avis, vise le percentile 75 si ton logement et tes avis le justifient',
        ]},
        { type: 'tip', text: 'AirDNA propose un essai gratuit limité avant abonnement. Pour un audit ponctuel (lancement d\'un nouveau logement), l\'essai gratuit suffit. L\'abonnement est utile si tu fais 3+ logements ou si tu fais de la conciergerie.' },
      ],
    },
    {
      h2: '3. Identifier la concurrence directe',
      content: [
        { type: 'p', text: 'AirDNA permet d\'identifier tes 5-10 concurrents directs (même type de logement, même quartier). Étudie-les pour comprendre ce qui marche.' },
        { type: 'ul', items: [
          'Annonces top performer : photo de couverture, titre, description — quels patterns reviennent ?',
          'Équipements cochés : que coches-tu vs eux ?',
          'Note moyenne et nombre d\'avis : leur écart vs toi',
          'Politique d\'annulation : Stricte/Modérée/Souple',
          'Politique tarifaire : remise hebdo/mensuelle, early booking, last-minute',
        ]},
      ],
    },
    {
      h2: '4. Limites et alternatives',
      content: [
        { type: 'p', text: 'AirDNA n\'est pas parfait. Voici les limites à connaître + alternatives.' },
        { type: 'ul', items: [
          'Données estimées via scraping : ~10-15 % de marge d\'erreur sur certains chiffres',
          'Pas de Booking.com inclus (uniquement Airbnb + VRBO)',
          'Coût : 39-79 €/mois selon la zone et le plan. Cher pour 1-2 logements',
          'Alternative gratuite : recherche Airbnb manuelle + Excel. Long mais gratuit',
          'Alternative payante : Mashvisor (US-centré), PriceLabs (intègre données AirDNA dans son pricing tool)',
        ]},
        { type: 'cta', text: 'Tu veux apprendre à analyser ton marché et tarifer comme un pro ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'tarification-dynamique-pricelabs-wheelhouse-beyond-comparatif', label: 'PriceLabs vs Wheelhouse', categoryLabel: 'Revenus' },
    { slug: 'tarification-dynamique-lcd',                       label: 'Tarification dynamique',                categoryLabel: 'Revenus' },
    { slug: 'fixer-prix-minimum-airbnb-lcd',                    label: 'Fixer prix minimum',                     categoryLabel: 'Revenus' },
  ],
}
