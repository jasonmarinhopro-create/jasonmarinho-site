export default {
  slug: 'statistiques-annonce-airbnb-4-kpis-essentiels',
  title: 'Statistiques Airbnb : les 4 KPIs essentiels que les hôtes ignorent',
  description: 'Airbnb te donne accès à des statistiques détaillées sur ton annonce. Voici les 4 KPIs à suivre chaque semaine pour identifier ce qui marche et ce qui bloque.',
  keywords: 'statistiques Airbnb, KPIs annonce Airbnb, taux clic Airbnb, taux conversion annonce, performance Airbnb 2026',
  date: '2026-04-25',
  categorySlug: 'visibilite',
  readTime: 6,

  lead: 'Airbnb met à disposition des hôtes 14 KPIs différents dans la section "Performances" de l\'extranet. La plupart des hôtes ne les regardent jamais, ou regardent uniquement le taux d\'occupation. Pourtant, 4 KPIs précis te disent exactement quoi optimiser : ta photo, ton titre, ton prix ou ta description. Voici comment les lire.',

  sections: [
    {
      h2: '1. Le taux de visite (impressions)',
      content: [
        { type: 'p', text: 'Le taux de visite est le nombre de fois où ta fiche apparaît dans les résultats de recherche, sans forcément être cliquée. Tu le trouves dans Performances → Visibilité → "Vues d\'annonce". C\'est un indicateur de matching algorithmique : si ce chiffre est bas, ton annonce ne ressort pas pour les bonnes requêtes.' },
        { type: 'p', text: 'Benchmark moyen : un appartement classique en ville touristique génère 800 à 2 500 vues par mois. Si tu es en dessous, ton problème est en amont (mauvais matching de mots-clés). Solutions : revoir le titre, vérifier les filtres équipements, et compléter ton profil à 100 %.' },
      ],
    },
    {
      h2: '2. Le taux de clic (CTR)',
      content: [
        { type: 'p', text: 'Le CTR est le pourcentage de voyageurs qui cliquent sur ta fiche après l\'avoir vue dans les résultats. Calcul = clics / vues. Tu le trouves directement dans le tableau de bord Performances. C\'est l\'indicateur le plus rapide à corriger, car il dépend uniquement de 3 éléments : photo de couverture, titre, prix affiché.' },
        { type: 'p', text: 'Benchmark moyen : 4 à 7 %. Au-dessus de 7 %, ton annonce convertit bien dès la liste de résultats. En dessous de 4 %, l\'un des 3 éléments de la vignette ne fonctionne pas. Test : change UNE chose à la fois (la photo de couverture par exemple), attends 7 jours, mesure.' },
        { type: 'tip', text: 'Si ton CTR est bon (> 6 %) mais ton taux de réservation faible, c\'est ton offre globale qui pose problème (description, équipements cochés, politique d\'annulation, avis). Le CTR mesure l\'attrait au scroll, pas la promesse complète.' },
      ],
    },
    {
      h2: '3. Le taux de conversion (réservations)',
      content: [
        { type: 'p', text: 'Le taux de conversion est le pourcentage de voyageurs qui réservent après avoir cliqué sur ta fiche. Calcul = réservations / clics. C\'est le KPI le plus stratégique : il mesure si ta fiche tient ses promesses une fois cliquée.' },
        { type: 'p', text: 'Benchmark moyen : 5 à 12 %. Au-dessus de 10 %, ta fiche est très bien construite. En dessous de 5 %, les voyageurs cliquent puis abandonnent — soit ton prix est trop élevé pour ce que tu proposes, soit la description/photos ne tiennent pas la promesse de la vignette, soit tes avis ou ta politique freinent.' },
        { type: 'p', text: 'Pour améliorer ce taux : optimiser la description longue, ajouter 5 photos additionnelles si tu en as moins de 25, vérifier que ta politique d\'annulation est cohérente avec le marché, soigner tes 5 derniers avis (réponses publiques aux avis < 5★).' },
      ],
    },
    {
      h2: '4. Le taux d\'acceptation et le délai de réponse',
      content: [
        { type: 'p', text: 'Ces 2 indicateurs (groupés dans la section Performances → Hospitalité) impactent directement ton classement algorithmique. Le taux d\'acceptation = réservations acceptées / demandes reçues. Le délai de réponse = temps moyen pour répondre aux messages.' },
        { type: 'ul', items: [
          'Taux d\'acceptation > 95 % = bonus algorithmique. Entre 80 et 95 % = neutre. < 80 % = pénalité (-25 % de visibilité)',
          'Délai de réponse < 1 h en journée = badge "Répond rapidement", impact très positif sur la conversion',
          'Délai > 24 h sur 5 messages dans le mois = pénalité automatique de classement',
          'Une seule annulation hôte sur 60 jours = -10 % de visibilité pendant 60 jours supplémentaires',
        ]},
        { type: 'cta', text: 'Tu veux apprendre à lire et exploiter toutes les statistiques Airbnb pour piloter ta performance ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'algorithme-airbnb-2026-criteres-classement',       label: 'Algorithme Airbnb 2026',                 categoryLabel: 'Visibilité' },
    { slug: 'optimiser-annonce-airbnb',                         label: 'Optimiser son annonce Airbnb',          categoryLabel: 'Visibilité' },
    { slug: 'titre-annonce-airbnb-optimiser-clics-visibilite',  label: 'Titre Airbnb qui fait cliquer',         categoryLabel: 'Visibilité' },
  ],
}
