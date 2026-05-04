export default {
  slug: 'scripts-check-out-automatique-lcd',
  title: 'Scripts de check-out automatiques : 6 messages à programmer pour zéro friction',
  description: 'Le check-out est le dernier contact voyageur, il décide souvent de l\'avis. Voici 6 messages programmés à activer pour automatiser et fluidifier la fin de séjour.',
  keywords: 'check-out automatique Airbnb, messages programmés LCD, automatiser fin séjour, scripts voyageurs',
  date: '2026-04-25',
  categorySlug: 'automatisation',
  readTime: 5,

  lead: 'Le check-out est le dernier moment de contact avec ton voyageur. Bien orchestré, il génère un avis 5 étoiles et augmente les chances de fidélisation. Voici 6 messages à programmer pour zéro friction — aucun ne nécessite d\'intervention manuelle.',

  sections: [
    {
      h2: 'Message 1 — Rappel J-1 (la veille du check-out)',
      content: [
        { type: 'p', text: 'Programmé via Hospitable, Smoobu ou Make : envoyé automatiquement 24 h avant le check-out. Ce message évite les oublis et les retards le lendemain.' },
        { type: 'p', text: '"Bonjour {prénom}, j\'espère que ton séjour s\'est bien passé ! Petit rappel pour demain : départ avant {heure_checkout}. À prévoir : ranger la vaisselle dans le lave-vaisselle, fermer les volets, déposer les clés dans la boîte. Belle continuation !"' },
      ],
    },
    {
      h2: 'Message 2 — Procédure check-out le matin J (9h)',
      content: [
        { type: 'p', text: 'Un rappel rapide le matin du départ avec le lien vers la procédure complète dans ton livret d\'accueil. Pour les voyageurs qui ont oublié le message J-1.' },
        { type: 'p', text: '"Bonjour {prénom} ! C\'est le grand jour du retour. Pour le check-out, retrouve toute la procédure ici : {lien_livret}. Si tu as la moindre question, je suis disponible. Bon voyage !"' },
        { type: 'ul', items: [
          'Envoi automatique à 9h le jour J',
          'Inclure le lien direct vers la section check-out du livret d\'accueil digital',
          'Message court : les voyageurs ont des valises à faire, pas le temps de lire 5 paragraphes',
        ]},
      ],
    },
    {
      h2: 'Message 3 — Remerciement 1 h après le check-out planifié',
      content: [
        { type: 'p', text: 'Ce message est crucial. Le voyageur est parti depuis 1 heure, le séjour est encore frais dans sa mémoire. C\'est le meilleur moment pour créer un lien émotionnel qui mène à un avis positif.' },
        { type: 'p', text: '"Merci pour ton séjour {prénom} ! J\'espère qu\'il a été parfait. Quel a été ton moment préféré ? (curiosité sincère) Si tu repasses par [ville], avec plaisir de t\'accueillir à nouveau !"' },
        { type: 'tip', text: 'La question "quel a été ton moment préféré ?" génère des réponses qui deviennent de futurs témoignages utilisables. Et une réponse positive te signale que c\'est le moment idéal pour demander l\'avis Airbnb.' },
      ],
    },
    {
      h2: 'Message 4 — Sollicitation avis Airbnb à H+24',
      content: [
        { type: 'p', text: 'Si le message 3 a reçu une réponse positive (ou même sans réponse), envoie une demande d\'avis directe à H+24. Pas avant — trop proche, perçu comme du harcèlement. Pas après H+72 — le souvenir s\'estompe.' },
        { type: 'p', text: '"Bonjour {prénom} ! On espère que tu es bien rentré. Si tu as un instant, un avis sur Airbnb nous aide vraiment à accueillir de futurs voyageurs. Voici le lien direct : {lien_avis}. Merci d\'avance !"' },
      ],
    },
    {
      h2: 'Message 5 — Relance avis à H+72 (si pas encore posté)',
      content: [
        { type: 'p', text: 'Si l\'avis n\'est toujours pas posté à H+72, envoie une unique relance courte. Airbnb ferme la fenêtre d\'avis à J+14 — ne jamais relancer au-delà de J+7 pour rester naturel.' },
        { type: 'p', text: '"Coucou {prénom} ! Tu n\'as peut-être pas eu le temps, voici à nouveau le lien rapide pour l\'avis : {lien_avis}. Merci si tu as 30 secondes !"' },
        { type: 'ul', items: [
          'Une seule relance maximum — deux relances = impression de pression, impact négatif sur l\'avis',
          'Si toujours pas d\'avis à J+7 : laisser tomber. Certains voyageurs ne laissent jamais d\'avis',
          'Airbnb ferme la fenêtre de publication des avis à J+14 après le check-out',
        ]},
      ],
    },
    {
      h2: 'Message 6 — Fidélisation longue durée (J+30 à J+60)',
      content: [
        { type: 'p', text: 'Envoyé 30 à 60 jours après le séjour, en ouverture de la prochaine saison ou pour une occasion spéciale. Ce message transforme un voyageur en client récurrent.' },
        { type: 'p', text: '"Bonjour {prénom} ! On pense à toi. Notre logement à {ville} est dispo pour {prochaine_saison}. Si tu veux revenir, on t\'offre -10 % sur la réservation directe : {lien_site_direct}. Belle journée !"' },
        { type: 'ul', items: [
          'Ne PAS envoyer via Airbnb — Airbnb pénalise les sollicitations hors plateforme',
          'Envoyer par SMS ou email collecté avec consentement RGPD pendant le séjour',
          'Stocker les emails voyageurs dans un CRM léger : Notion, Brevo, MailChimp (gratuit jusqu\'à 500 contacts)',
          'Taux de retour fidèle : 5-15 % selon qualité du séjour, soit 50-150 € de marge nette par voyageur fidélisé/an',
        ]},
        { type: 'cta', text: 'Tu veux automatiser tous tes messages voyageurs et fidéliser ta clientèle ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'messages-airbnb-automatiser',                      label: 'Messages Airbnb à automatiser',          categoryLabel: 'Automatisation' },
    { slug: 'gabarits-messages-lcd-hotes-templates',           label: 'Gabarits messages LCD',                 categoryLabel: 'Ressources' },
    { slug: 'base-voyageurs-fideles-location-directe-durable',  label: 'Base voyageurs fidèles',                 categoryLabel: 'Revenus' },
  ],
}
