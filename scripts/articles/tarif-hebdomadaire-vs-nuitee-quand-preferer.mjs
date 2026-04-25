export default {
  slug: 'tarif-hebdomadaire-vs-nuitee-quand-preferer',
  title: 'Tarif hebdomadaire vs nuitée : quand préférer chaque modèle (avec calculs)',
  description: 'Tarif à la nuit ou à la semaine : la décision dépend de ton volume, ton type de logement et ta saison. Voici la matrice de décision avec calculs concrets.',
  keywords: 'tarif hebdomadaire LCD, tarif nuit Airbnb, remise semaine Airbnb, prix séjour long location courte durée',
  date: '2026-04-25',
  categorySlug: 'revenus',
  readTime: 5,

  lead: 'Sur Airbnb, tu peux paramétrer une remise pour les séjours d\'une semaine ou d\'un mois. Sur Booking, tu peux créer des "promotions séjour long". Beaucoup d\'hôtes activent ces remises par habitude (10 % à la semaine, 20 % au mois) sans calculer si c\'est cohérent avec leur point mort. Voici quand le tarif hebdomadaire fait gagner et quand il fait perdre.',

  sections: [
    {
      h2: '1. Comprendre la mécanique économique',
      content: [
        { type: 'p', text: 'Un séjour long (≥ 7 nuits) a un coût d\'exploitation par nuit beaucoup plus bas qu\'une succession de courts séjours : un seul ménage, un seul check-in, un seul changement de linge. Le voyageur consomme aussi moins par nuit (moins d\'allers-retours, comportement plus stable).' },
        { type: 'p', text: 'Économiquement, tu peux te permettre une remise importante sur un séjour long et rester rentable. La question n\'est pas "faut-il faire une remise ?" mais "à quel pourcentage et à partir de combien de nuits ?". La réponse dépend de tes coûts variables.' },
      ],
    },
    {
      h2: '2. Le calcul de la remise optimale',
      content: [
        { type: 'p', text: 'Prenons un exemple chiffré. Tarif normal 90 €/nuit, coût variable par nuit 25 €, ménage 35 € par séjour, marge nette par nuit (sur séjour 1-2 nuits) = 90 - 25 - (35/2) - 3 (commission) = 44,5 €.' },
        { type: 'ul', items: [
          'Sur un séjour 7 nuits sans remise : revenu = 7×90 + 35 = 665 €. Coûts = 7×25 + 35 + 7×3 = 231 €. Marge nette = 434 €. Marge/nuit = 62 €',
          'Sur un séjour 7 nuits à -15 % : revenu = 7×76,5 + 35 = 570,5 €. Coûts = 231 €. Marge nette = 339,5 €. Marge/nuit = 48,5 €',
          'Sur un séjour 7 nuits à -25 % : revenu = 7×67,5 + 35 = 507,5 €. Coûts = 231 €. Marge nette = 276,5 €. Marge/nuit = 39,5 €',
        ]},
        { type: 'p', text: 'Conclusion : une remise de 15 % à la semaine reste plus rentable par nuit qu\'un séjour court (48,5 € vs 44,5 € de marge nette). Une remise de 25 % à la semaine fait baisser ta marge par nuit (39,5 €) mais te permet de remplir 7 nuits d\'un coup. Tout dépend de ton taux d\'occupation.' },
      ],
    },
    {
      h2: '3. La matrice de décision',
      content: [
        { type: 'p', text: 'Pour chaque profil d\'hôte, la stratégie tarifaire optimale diffère. Voici la matrice simplifiée.' },
        { type: 'ul', items: [
          'Studio centre-ville business : tarif nuit fort, remise semaine 10-15 %, remise mois 25-30 % (clientèle business, 90 % en courts séjours mais 10 % de longs profils workation très lucratifs)',
          'T2/T3 famille zone touristique : tarif nuit moyen, remise semaine 15-20 %, remise mois 30-35 % (haute saison saturée en courts séjours, basse saison nourrie de séjours longs)',
          'Gîte rural : tarif nuit moyen-élevé, remise semaine 20-25 %, remise mois 35-40 % (saisonnalité forte, séjour 7-14 nuits standard)',
          'Logement basse saison difficile : tarif nuit bas avec remise semaine 25 %+ pour attirer télétravailleurs, retraites, projets',
        ]},
        { type: 'tip', text: 'Si ton taux d\'occupation est < 60 %, augmente tes remises pour attirer des séjours longs. Si > 80 %, baisse les remises pour ne pas saturer ton calendrier à des prix faibles.' },
      ],
    },
    {
      h2: '4. Les pièges à éviter avec les remises',
      content: [
        { type: 'p', text: 'Trois erreurs reviennent régulièrement et grignotent la marge sans amélioration de l\'occupation.' },
        { type: 'ul', items: [
          'Cumul de remises : remise semaine 15 % + early booking 10 % + last-minute 10 % = -32 % cumulé. Vérifie que tes remises ne s\'additionnent pas par accident',
          'Remise mois trop forte : à -40 %, certains voyageurs voient ton logement comme "low-cost" et baissent leurs attentes — risque d\'avis moins bons',
          'Garder une remise constante toute l\'année : en haute saison, tu n\'as pas besoin de remise. Désactive-la les 3 mois de pic, réactive en basse saison',
        ]},
        { type: 'cta', text: 'Tu veux mettre en place une stratégie tarifaire LCD complète, saisonnière et rentable ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'sejours-longs-lcd-strategie-revenus-basse-saison', label: 'Séjours longs en LCD',                  categoryLabel: 'Revenus' },
    { slug: 'tarification-dynamique-lcd',                       label: 'Tarification dynamique',                categoryLabel: 'Revenus' },
    { slug: 'point-mort-lcd-calcul-rentabilite-hote',           label: 'Calculer son point mort LCD',           categoryLabel: 'Revenus' },
  ],
}
