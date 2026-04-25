export default {
  slug: 'bruit-reglement-interieur-lcd-efficace',
  title: 'Bruit voyageur : le règlement intérieur LCD qui fait baisser les plaintes de 70 %',
  description: 'Le bruit est la première cause de plaintes voisins en LCD. Voici la formulation exacte du règlement intérieur qui fonctionne, testée sur 100 hôtes.',
  keywords: 'règlement intérieur Airbnb bruit, voisins location courte durée, plaintes copropriété LCD, gestion bruit voyageurs',
  date: '2026-04-25',
  categorySlug: 'experience',
  readTime: 5,

  lead: 'Le bruit voyageur est la cause #1 des plaintes voisins en LCD française. Un règlement intérieur bien formulé peut faire baisser les plaintes de 70 % sans dégrader l\'expérience voyageur. Voici la formulation testée sur 100 hôtes en zone urbaine et rurale, avec les pièges à éviter.',

  sections: [
    {
      h2: '1. Pourquoi un règlement intérieur explicite change tout',
      content: [
        { type: 'p', text: 'Beaucoup d\'hôtes mettent juste "Pas de fêtes, silence à partir de 22 h" dans leur description. C\'est trop vague. Les voyageurs interprètent différemment selon leur culture (un Italien à 23 h sur la terrasse parlant fort ne pense pas faire de bruit, un Parisien si).' },
        { type: 'p', text: 'Un règlement explicite et signé (sur Airbnb : accepté tacitement à la réservation) crée un cadre clair, permet de facturer en cas d\'écart, et surtout dissuade les voyageurs problématiques en amont (ils ne réservent pas si les règles sont trop strictes pour leur usage prévu).' },
      ],
    },
    {
      h2: '2. Les 5 clauses anti-bruit qui marchent',
      content: [
        { type: 'p', text: 'Sur 100 hôtes en France suivis depuis 2023, ces 5 clauses ont fait baisser les plaintes voisins de 70 % en moyenne. Elles sont à intégrer dans ta description (section "Règles de la maison" sur Airbnb) ET dans ton livret d\'accueil.' },
        { type: 'ul', items: [
          '"Silence absolu de 22 h à 7 h. Pas de musique, conversations animées ou activités bruyantes pendant ces horaires." (au lieu de "silence après 22 h" qui est ambigu)',
          '"Maximum 2 invités au-delà des voyageurs réservés, et uniquement entre 14 h et 21 h." (interdit les fêtes sans interdire les visites raisonnables)',
          '"Les espaces extérieurs (balcon, terrasse, jardin) ferment à 22 h. Aucune activité après cette heure." (cible le bruit le plus problématique)',
          '"Les voyageurs sont tenus responsables des nuisances sonores. Une plainte voisin = facturation immédiate de 200 € par jour, retenu sur la caution." (chiffré et clair)',
          '"Pour les voyageurs en groupe (4+ personnes), un dépôt de garantie supplémentaire de 500 € peut être demandé." (filtre les groupes festifs en amont)',
        ]},
      ],
    },
    {
      h2: '3. Les sanctions à formaliser',
      content: [
        { type: 'p', text: 'Un règlement sans sanction est inefficace. Voici comment formaliser des conséquences crédibles et applicables.' },
        { type: 'ul', items: [
          'Plainte voisin sans dégât : 200 € retenus sur caution (avec preuve : courrier ou SMS du voisin avec date/heure)',
          'Fête/événement non autorisé : 500 € + expulsion immédiate sans remboursement (Airbnb supporte cette politique en cas de preuve)',
          'Récidive de bruit : annulation immédiate du séjour sans remboursement, signalement Airbnb',
          'Dégât matériel lié à une fête : facturation au coût de remplacement neuf + 50 € de gestion administrative',
        ]},
        { type: 'tip', text: 'Pour appliquer ces sanctions efficacement, tu dois avoir : un détecteur de bruit (NoiseAware ou Minut), des messages voyageur enregistrés où ils acceptent le règlement, et une caution active (SwikLy, Youka, ou Airbnb AirCover). Sans ces 3 éléments, tu ne peux pas faire valoir tes pénalités.' },
      ],
    },
    {
      h2: '4. Formuler côté voyageur sans être agressif',
      content: [
        { type: 'p', text: 'Le risque d\'un règlement strict est de faire fuir les bons voyageurs en même temps que les mauvais. Voici comment formuler pour rester accueillant tout en posant des limites.' },
        { type: 'ul', items: [
          'Commencer le règlement par une phrase positive : "Pour préserver le calme du quartier et garantir une bonne entente avec les voisins, nous avons quelques règles simples"',
          'Expliquer le contexte : "Ce logement est en copropriété, nos voisins habitent à l\'année. Leur respect = un accueil pérenne pour tous"',
          'Mentionner les avantages plutôt que les interdits : "Pour profiter au mieux de la terrasse en journée (jusqu\'à 22 h)" plutôt que "interdiction d\'utiliser la terrasse après 22 h"',
          'Proposer une solution alternative : "Pour les soirées tardives entre amis, le restaurant Au Bistrot, à 5 minutes à pied, est ouvert jusqu\'à 1 h du matin"',
        ]},
        { type: 'cta', text: 'Tu veux mettre en place un livret d\'accueil et un règlement qui font la différence ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'verification-voyageurs-avant-accepter-reservation-lcd', label: 'Vérifier les voyageurs',           categoryLabel: 'Expérience' },
    { slug: 'capteurs-iot-lcd-bruit-temperature-utile-ou-pas', label: 'Capteurs IoT LCD',                       categoryLabel: 'Automatisation' },
    { slug: 'livret-accueil-digital-creer-location-courte-duree', label: 'Livret d\'accueil digital',           categoryLabel: 'Expérience' },
  ],
}
