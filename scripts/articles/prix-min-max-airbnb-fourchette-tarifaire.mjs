export default {
  slug: 'prix-min-max-airbnb-fourchette-tarifaire',
  title: 'Prix min / prix max Airbnb : la fourchette tarifaire qui maximise ton revenu',
  description: 'Définir un prix min ET un prix max sur Airbnb encadre la tarification dynamique. Voici la méthode pour fixer ces 2 bornes sans plomber ton revenu net.',
  keywords: 'prix minimum Airbnb, prix maximum Airbnb, fourchette tarif LCD, encadrer pricing Airbnb',
  date: '2026-04-25',
  categorySlug: 'revenus',
  readTime: 5,

  lead: 'Si tu utilises la tarification dynamique (Airbnb Smart Pricing, PriceLabs, Wheelhouse), tu dois définir 2 bornes : prix min et prix max. Mal calibrées, elles font baisser ton revenu net. Voici la méthode pour les fixer correctement, basée sur des cas concrets de 50 hôtes français.',

  sections: [
    {
      h2: '1. Pourquoi 2 bornes sont indispensables',
      content: [
        { type: 'p', text: 'Sans prix min, l\'algorithme Smart Pricing peut faire chuter ton tarif jusqu\'à 30-50 % en basse saison pour "remplir à tout prix". Tu finis avec des nuits à 35 € qui te font perdre de la marge nette. Sans prix max, tu rates les pics tarifaires des événements (Cannes, Tour de France, Saint-Sylvestre).' },
        { type: 'p', text: 'Les 2 bornes encadrent l\'algo : il fait son travail (ajuster aux conditions de marché) sans descendre sous ta rentabilité ni rater les peaks.' },
      ],
    },
    {
      h2: '2. Fixer le prix min',
      content: [
        { type: 'p', text: 'Le prix min doit être supérieur à ton coût total par nuit (point mort + marge minimale acceptable). Calcul.' },
        { type: 'ul', items: [
          'Coûts fixes mensuels / nuits que tu vises = coût fixe par nuit (ex. 350 € / 22 nuits = 16 €)',
          'Coût variable par nuit (ménage, consommables, commission) : ex. 25 €',
          'Marge minimum acceptable : ex. 15 € (à toi de définir le minimum vital)',
          'Prix min = 16 + 25 + 15 = 56 €. Sous ce tarif, tu ne loues PAS',
          'Pour la majorité des hôtes français : prix min entre 45 et 75 € selon zone',
        ]},
        { type: 'tip', text: 'Si l\'algo ne trouve pas de réservation à ton prix min en basse saison, c\'est OK. Mieux vaut un calendrier vide qu\'un calendrier rempli à perte. Profite-en pour bloquer ces nuits pour toi-même ou pour des séjours longs (workation, étudiants).' },
      ],
    },
    {
      h2: '3. Fixer le prix max',
      content: [
        { type: 'p', text: 'Le prix max doit te permettre de capturer les peaks événementiels sans saboter ton classement le reste du temps.' },
        { type: 'ul', items: [
          'Étudie ton historique : quel est le tarif que tu as obtenu lors des 3 plus gros événements de l\'année ?',
          'Multiplie ce tarif par 1,5 (marge de manœuvre future)',
          'Pour la majorité des hôtes français : prix max entre 200 et 400 €',
          'Pour les zones haut de gamme (Paris, Cannes festival, mer été) : prix max peut aller à 800-1 200 €',
          'Test : si tu n\'arrives JAMAIS à atteindre ton prix max, c\'est que tu es trop bas. Augmente-le de 20 %',
        ]},
      ],
    },
    {
      h2: '4. Ajuster avec l\'expérience',
      content: [
        { type: 'p', text: 'Tes 2 bornes ne sont pas figées. Elles évoluent avec ton expérience et ta connaissance du marché.' },
        { type: 'ul', items: [
          'Tous les 3 mois : refais le calcul du prix min basé sur tes nouveaux coûts (ils ont changé)',
          'Annuellement : revue du prix max basée sur les peaks observés',
          'Si tes statistiques montrent un taux d\'occupation > 75 % : monte ton prix min de 10 %',
          'Si ton taux d\'occupation < 50 % : ne baisse PAS ton prix min (problème ailleurs : photos, description, avis)',
          'Le prix max protège des "bugs" Smart Pricing qui parfois fixent un prix absurde (5 €/nuit). Sécurité avant tout',
        ]},
        { type: 'cta', text: 'Tu veux la méthode complète de tarification dynamique LCD ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'fixer-prix-minimum-airbnb-lcd',                    label: 'Fixer prix minimum Airbnb',              categoryLabel: 'Revenus' },
    { slug: 'tarification-dynamique-lcd',                       label: 'Tarification dynamique',                categoryLabel: 'Revenus' },
    { slug: 'airdna-mode-emploi-hote-lcd-debutant',             label: 'AirDNA mode d\'emploi',                  categoryLabel: 'Revenus' },
  ],
}
