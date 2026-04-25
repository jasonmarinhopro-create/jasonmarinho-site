export default {
  slug: 'scripts-check-out-automatique-lcd',
  title: 'Scripts de check-out automatiques : 6 messages à programmer pour zéro friction',
  description: 'Le check-out est le dernier contact voyageur, il décide souvent de l\'avis. Voici 6 messages programmés à activer pour automatiser et fluidifier la fin de séjour.',
  keywords: 'check-out automatique Airbnb, messages programmés LCD, automatiser fin séjour, scripts voyageurs',
  date: '2026-04-25',
  categorySlug: 'automatisation',
  readTime: 5,

  lead: 'Le check-out est le dernier moment de contact avec ton voyageur. Bien orchestré, il génère un avis 5 étoiles et augmente les chances de fidélisation. Mal orchestré, tu rates l\'avis ou tu finis avec des questions tardives. Voici 6 messages à programmer pour zéro friction.',

  sections: [
    {
      h2: '1. Message 1 : Rappel J-1 check-out (la veille)',
      content: [
        { type: 'p', text: 'Programmé via Hospitable, Smoobu ou Make : envoyé 24 h avant le check-out.' },
        { type: 'p', text: 'Contenu : "Bonjour {prénom}, j\'espère que ton séjour s\'est bien passé ! Petit rappel pour ton check-out demain : départ avant {heure_checkout}. Avant de partir, merci de penser à : ranger vaisselle dans le lave-vaisselle, fermer les volets, déposer les clés dans la boîte. Belle continuation et n\'hésite pas si questions !"' },
      ],
    },
    {
      h2: '2. Messages 2 et 3 : Procédure check-out + remerciement',
      content: [
        { type: 'ul', items: [
          'Message 2 : à 9h le jour du check-out (rappel + lien procédure détaillée du livret d\'accueil)',
          'Message 3 : 1 h après le check-out planifié (remerciement + question rétention) — "Merci pour ton séjour ! J\'espère qu\'il a été parfait. Quel a été ton moment préféré ? "',
        ]},
        { type: 'tip', text: 'Le message à 1 h post-checkout est crucial. Le voyageur a encore le souvenir frais et vif. Sa réponse te donne souvent un futur témoignage. Si la réponse est positive, c\'est le moment idéal pour demander l\'avis Airbnb.' },
      ],
    },
    {
      h2: '3. Messages 4 et 5 : Sollicitation avis (à H+24 et H+72)',
      content: [
        { type: 'ul', items: [
          'Message 4 (H+24) : "Bonjour {prénom}, on espère que tu es bien rentré ! Si tu as un instant, un avis sur Airbnb nous aiderait beaucoup. Voici le lien direct : {lien_avis}. Bonne continuation !"',
          'Message 5 (H+72) : si pas d\'avis encore, relance courte. "Coucou ! Tu n\'as pas eu le temps de laisser un avis, normal — voici à nouveau le lien rapide : {lien_avis}. Merci d\'avance !"',
          'Au-delà de 7 jours sans avis : ne plus relancer (Airbnb ferme la fenêtre d\'avis à J+14)',
        ]},
      ],
    },
    {
      h2: '4. Message 6 : Fidélisation longue durée',
      content: [
        { type: 'p', text: 'Le message #6 est envoyé 30-60 jours après le check-out, en ouverture de la prochaine saison ou pour fidéliser.' },
        { type: 'ul', items: [
          'Contenu : "Bonjour {prénom} ! On pense à toi. Notre logement à {ville} est dispo pour {prochaine_saison}. Si tu veux revenir, on a une offre fidèle de -10 % sur la réservation directe (lien direct sans Airbnb). Belle journée !"',
          'Astuce : ne PAS envoyer ça via Airbnb (Airbnb pénalise la sollicitation hors plateforme). Envoyer par SMS ou email collecté avec son consentement RGPD',
          'Stocker les emails voyageurs avec leur permission dans un CRM léger (Notion, Brevo, MailChimp gratuit)',
          'Taux de retour fidèle : 5-15 % selon la qualité du séjour, soit 50-150 € de marge nette par voyageur fidélisé/an',
        ]},
        { type: 'cta', text: 'Tu veux automatiser tous tes messages voyageurs et fidéliser ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'messages-airbnb-automatiser',                      label: 'Messages Airbnb à automatiser',          categoryLabel: 'Automatisation' },
    { slug: 'gabarits-messages-lcd-hotes-templates',           label: 'Gabarits messages LCD',                 categoryLabel: 'Ressources' },
    { slug: 'base-voyageurs-fideles-location-directe-durable',  label: 'Base voyageurs fidèles',                 categoryLabel: 'Revenus' },
  ],
}
