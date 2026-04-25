export default {
  slug: 'droits-voisins-lcd-copropriete-litiges',
  title: 'Droits des voisins en LCD : éviter et gérer les litiges en copropriété',
  description: 'Les voisins peuvent bloquer ton activité LCD si tu ne respectes pas certaines règles. Voici tes droits, leurs droits, et comment éviter les litiges.',
  keywords: 'voisins LCD copropriété, droit copropriété Airbnb, litige voisin location courte durée, règlement copropriété LCD',
  date: '2026-04-25',
  categorySlug: 'reglementation',
  readTime: 5,

  lead: 'Les conflits avec les voisins en copropriété sont la cause #1 d\'arrêt forcé d\'une activité LCD. Connaître tes droits ET ceux de tes voisins, c\'est éviter 80 % des litiges. Voici la situation juridique en 2026 et les actions préventives à mettre en place.',

  sections: [
    {
      h2: '1. Ce que dit le règlement de copropriété',
      content: [
        { type: 'p', text: 'Le règlement de copropriété peut autoriser ou interdire la location courte durée. Vérification obligatoire AVANT de te lancer.' },
        { type: 'ul', items: [
          'Clause "destination bourgeoise" sans précision LCD : ambiguë, jurisprudence variable. Risque modéré',
          'Clause "interdiction location de courte durée" explicite : interdit. Tu risques action en cessation par syndic',
          'Clause autorisant "location meublée" : généralement OK pour LCD',
          'Pas de clause spécifique : autorisé par défaut, mais des AG peuvent voter une interdiction (majorité 2/3)',
        ]},
        { type: 'tip', text: 'Demande TOUJOURS le règlement de copropriété avant d\'acheter ou de te lancer en LCD. C\'est gratuit, et ça évite des décisions à 200 000 € prises sur des suppositions.' },
      ],
    },
    {
      h2: '2. Les nuisances qui justifient une action voisins',
      content: [
        { type: 'p', text: 'Les voisins peuvent agir contre toi sur la base de "troubles anormaux du voisinage". Voici ce qui est considéré.' },
        { type: 'ul', items: [
          'Bruit après 22 h : musique, conversations animées sur balcon, soirées',
          'Sur-occupation : 8 voyageurs dans un T2 = trouble manifeste',
          'Détérioration parties communes : peinture, casses dans hall',
          'Mégots, déchets : abandons dans escaliers ou cours',
          'Comportement agressif des voyageurs envers les voisins',
          'Va-et-vient excessif (10+ check-in par mois dans un studio)',
        ]},
      ],
    },
    {
      h2: '3. Les actions que peuvent prendre les voisins',
      content: [
        { type: 'p', text: 'Si un voisin (ou plusieurs) décide d\'agir contre toi, voici l\'escalade typique.' },
        { type: 'ul', items: [
          'Étape 1 - Médiation : courrier amiable demandant cessation des nuisances. Tu as 30-60 jours pour agir',
          'Étape 2 - Syndic : signalement formel au syndic. Le syndic peut t\'envoyer mise en demeure',
          'Étape 3 - AG copropriété : vote d\'interdiction LCD (majorité 2/3). Si voté, tu dois cesser',
          'Étape 4 - Mairie : plainte pour nuisances. La mairie peut bloquer ton autorisation de changement d\'usage',
          'Étape 5 - Tribunal : action en justice pour faire cesser l\'activité + dommages-intérêts (rare mais possible)',
          'Coût pour toi si action gagnée par les voisins : 5 000-30 000 € selon le cas + arrêt forcé de l\'activité',
        ]},
      ],
    },
    {
      h2: '4. Actions préventives',
      content: [
        { type: 'p', text: 'Mieux vaut prévenir que guérir. Voici les actions à mettre en place dès le démarrage.' },
        { type: 'ul', items: [
          'Information voisins avant lancement : courrier de présentation expliquant ce que tu fais, ton sérieux, tes coordonnées en cas de souci',
          'Règlement intérieur strict : silence après 22 h, pas de fêtes, pas plus de 2 invités',
          'Détecteur de bruit (NoiseAware, Minut) : alertes en temps réel, intervention rapide',
          'Sanctions clairement affichées : caution prélevée si plainte voisin (200-500 €)',
          'Bonne volonté : participer à la vie de copro (AG, syndic), ne pas être l\'hôte invisible et fantomatique',
          'Compensation symbolique aux voisins (bouquet de fleurs aux fêtes, geste à Noël) : peu coûteux, change la perception',
        ]},
        { type: 'cta', text: 'Tu veux maîtriser tous les aspects légaux et relationnels de ta LCD ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'reglementation-lcd-france-2026',                   label: 'Réglementation LCD 2026',               categoryLabel: 'Réglementation' },
    { slug: 'bruit-reglement-interieur-lcd-efficace',           label: 'Bruit règlement intérieur',              categoryLabel: 'Expérience' },
    { slug: 'capteurs-iot-lcd-bruit-temperature-utile-ou-pas', label: 'Capteurs IoT bruit',                     categoryLabel: 'Automatisation' },
  ],
}
