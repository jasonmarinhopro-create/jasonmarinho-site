export default {
  slug: 'make-zapier-workflow-airbnb-no-code-debutant',
  title: 'Make ou Zapier pour Airbnb : automatiser ses flows en no-code',
  description: 'Make et Zapier permettent d\'automatiser des dizaines de tâches Airbnb sans coder. Comparatif, exemples concrets et 5 workflows à mettre en place.',
  keywords: 'Make Airbnb, Zapier location courte durée, no-code Airbnb, automation hôte LCD 2026, workflow Airbnb',
  date: '2026-04-25',
  categorySlug: 'automatisation',
  readTime: 6,

  lead: 'Tu veux automatiser des tâches Airbnb sans embaucher un développeur ? Make (anciennement Integromat) et Zapier sont des plateformes no-code qui connectent Airbnb à des centaines d\'autres outils. Une fois maîtrisés, ils te font gagner 5 à 10 heures par semaine. Voici comment démarrer.',

  sections: [
    {
      h2: '1. Make vs Zapier — quelle plateforme choisir',
      content: [
        { type: 'p', text: 'Les deux outils permettent de connecter des apps en mode "si X arrive, alors Y se déclenche". La différence se joue sur l\'interface et le pricing.' },
        { type: 'ul', items: [
          'Zapier : interface ultra-simple "Quand X, faire Y". Plan gratuit limité à 100 tâches/mois. Premium à 25 €/mois pour 750 tâches',
          'Make : interface visuelle (boîtes connectées par fils), plus complexe mais plus puissant (logique conditionnelle, boucles). Plan gratuit 1 000 ops/mois',
          'Pour démarrer : Zapier (plus accessible). Pour les gros besoins : Make (mieux scalable)',
        ]},
        { type: 'tip', text: 'Si tu n\'as jamais touché au no-code, commence par Zapier sur une seule automation simple. Tu apprendras la logique avant de passer à Make pour des workflows complexes.' },
      ],
    },
    {
      h2: '2. Connecter Airbnb à ces plateformes',
      content: [
        { type: 'p', text: 'Airbnb n\'a PAS d\'API publique pour les hôtes individuels. Les automations doivent passer par des intermédiaires.' },
        { type: 'ul', items: [
          'Via email parsing : Airbnb t\'envoie des emails (réservation confirmée, nouveau message, etc.). Make/Zapier peuvent les lire et déclencher des actions',
          'Via channel manager (Hospitable, Smoobu) qui ont leur propre API et se connectent nativement à Make/Zapier',
          'Via Google Sheets : tu peux exporter ton calendrier Airbnb en iCal puis le synchroniser dans une feuille Google qui sert de pivot',
        ]},
      ],
    },
    {
      h2: '3. 5 workflows immédiatement utiles',
      content: [
        { type: 'p', text: 'Ces 5 automations sont les plus utilisées par les hôtes LCD en 2026. Elles te font gagner du temps dès la première semaine.' },
        { type: 'ul', items: [
          'Email "nouvelle réservation Airbnb" → ajout dans Google Calendar + Slack/Discord notification',
          'Email "check-in à J-1" → SMS via Twilio au voyageur avec instructions d\'arrivée',
          'Avis 5★ Airbnb reçu → message de remerciement automatique + ajout du voyageur à une liste mailing pour fidélisation',
          'Avis < 4★ → notification immédiate à toi via Slack pour répondre dans l\'heure',
          'Date check-out atteinte → tâche créée dans Trello ou Asana pour planning ménage',
        ]},
        { type: 'tip', text: 'Quand tu construis un workflow, ajoute toujours une notification de fallback (Slack ou email à toi-même). Les automations cassent parfois, tu veux le savoir avant que ça impacte un voyageur.' },
      ],
    },
    {
      h2: '4. Limites et alternatives',
      content: [
        { type: 'p', text: 'Make et Zapier ont 3 limites importantes pour les hôtes LCD à connaître avant d\'investir du temps.' },
        { type: 'ul', items: [
          'Sans API Airbnb officielle, tu dépends du parsing email — si Airbnb change ses templates, tes automations cassent',
          'Le coût grimpe vite avec le volume (au-delà de 1 000 ops/mois sur Make ou 750 tâches/mois sur Zapier)',
          'Si tu as besoin de logique business complexe (calcul tarifaire dynamique, gestion multi-biens), un PMS comme Hospitable est plus pertinent',
        ]},
        { type: 'p', text: 'Alternative : Hospitable (anciennement Smartbnb) est un PMS qui inclut nativement de l\'automation conditionnelle. Plus cher en mensuel mais zéro maintenance, et l\'intégration Airbnb est officielle (via API channel partner).' },
        { type: 'cta', text: 'Tu veux apprendre à automatiser sa LCD avec ou sans no-code ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'gerer-lcd-automatisation',                         label: 'Gérer sa LCD par automatisation',       categoryLabel: 'Automatisation' },
    { slug: 'messages-airbnb-automatiser',                      label: '5 messages Airbnb à automatiser',       categoryLabel: 'Automatisation' },
    { slug: 'hospitable-tarification-dynamique-incluse-pms-fin-outils-seuls', label: 'Hospitable PMS tout-en-un', categoryLabel: 'Automatisation' },
  ],
}
