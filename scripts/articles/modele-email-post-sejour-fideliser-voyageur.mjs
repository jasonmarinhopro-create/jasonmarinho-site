export default {
  slug: 'modele-email-post-sejour-fideliser-voyageur',
  title: 'Email post-séjour Airbnb : 4 modèles testés pour avoir 5★ et fidéliser',
  description: 'L\'email post-séjour est la dernière chance d\'obtenir un avis 5★ et un retour fidèle. Voici 4 modèles testés selon le profil voyageur.',
  keywords: 'email post-séjour Airbnb, modèle email après check-out, fidéliser voyageurs LCD, demande avis email',
  date: '2026-04-25',
  categorySlug: 'ressources',
  readTime: 4,

  lead: 'Le voyageur vient de partir. Tu as 24 à 48 h pour envoyer un email qui (1) demande l\'avis, (2) fidélise, (3) collecte son consentement newsletter. Bien fait, l\'email post-séjour génère 60-70 % d\'avis et 5-10 % de réservations directes futures. Voici 4 modèles testés.',

  sections: [
    {
      h2: '1. Modèle 1 : Couple ou solo (séjour court)',
      content: [
        { type: 'p', text: 'Pour les voyageurs courts séjours (1-3 nuits), souvent business ou loisir solo/couple.' },
        { type: 'ul', items: [
          'Sujet : "Merci pour ce séjour {prénom} ! 🙏"',
          'Phrase 1 : "On espère que ton séjour à {ville} a été tout ce que tu cherchais"',
          'Phrase 2 : "Si tu as un instant, un avis sur Airbnb nous fait toujours plaisir : {lien_avis}"',
          'Phrase 3 : "Et si tu reviens à {ville}, code FIDELE10 pour -10 % en réservation directe : {lien_reservation_directe}"',
          'Phrase 4 : "Belle continuation ! 🌟"',
          'Total : 4 phrases. Court, chaleureux, 2 CTA discrets',
        ]},
      ],
    },
    {
      h2: '2. Modèle 2 : Famille avec enfants',
      content: [
        { type: 'p', text: 'Pour les familles, l\'angle "expérience enfants" marche le mieux.' },
        { type: 'ul', items: [
          'Sujet : "Merci à toute la famille {nom_famille} ! 👨‍👩‍👧"',
          'Phrase 1 : "On espère que les enfants ont profité du logement et de {ville}"',
          'Phrase 2 : "Si tu as eu un coup de cœur sur quelque chose (lit parapluie ? jardin ? coin jeu ?), n\'hésite pas à le mentionner dans ton avis Airbnb : {lien_avis}"',
          'Phrase 3 : "Pour vos prochaines vacances en France, on a une chambre supplémentaire en cours d\'aménagement, code FAMILLE10 si tu reviens"',
          'Phrase 4 : "Bisous aux enfants !"',
        ]},
      ],
    },
    {
      h2: '3. Modèle 3 : Voyageur business (workation, mission)',
      content: [
        { type: 'p', text: 'Pour les business, le ton est plus pro et factuel.' },
        { type: 'ul', items: [
          'Sujet : "Merci pour ce séjour {prénom}"',
          'Phrase 1 : "Espérons que la connexion fibre et l\'espace de travail ont bien servi votre mission à {ville}"',
          'Phrase 2 : "Pour un retour, votre avis sur Airbnb compte : {lien_avis}"',
          'Phrase 3 : "Pour vos prochains déplacements à {ville}, n\'hésitez pas à réserver en direct via : {lien_reservation_directe}"',
          'Phrase 4 : "Au plaisir de vous accueillir à nouveau"',
          'Note : voyageurs business apprécient le tutoiement professionnel ou vouvoiement, à adapter à ton style',
        ]},
        { type: 'tip', text: 'Pour les voyageurs business qui reviennent souvent dans la même ville, propose un "tarif corporate" (-15 % à -20 %) pour réservations directes. Ils deviennent voyageurs fidèles annuels avec 3-5 séjours/an.' },
      ],
    },
    {
      h2: '4. Modèle 4 : Voyageur étranger (en anglais)',
      content: [
        { type: 'p', text: 'Pour les voyageurs étrangers, version anglaise simple.' },
        { type: 'ul', items: [
          'Subject : "Thank you for staying with us {first_name}!"',
          'Sentence 1 : "We hope your stay in {city} was wonderful"',
          'Sentence 2 : "A review on Airbnb would mean a lot to us : {review_link}"',
          'Sentence 3 : "If you come back to {city}, code FIDELE10 for -10% direct booking : {direct_link}"',
          'Sentence 4 : "Safe travels home! 🌟"',
        ]},
        { type: 'p', text: 'Tu peux automatiser ces 4 modèles avec une logique conditionnelle (Hospitable, Make/Zapier) selon le profil voyageur (durée, nombre de personnes, langue). Une fois set up, c\'est zéro effort par envoi.' },
        { type: 'cta', text: 'Tu veux automatiser tes communications voyageurs et fidéliser ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'gabarits-messages-lcd-hotes-templates',           label: 'Gabarits messages LCD',                 categoryLabel: 'Ressources' },
    { slug: 'scripts-check-out-automatique-lcd',               label: 'Scripts check-out automatiques',         categoryLabel: 'Automatisation' },
    { slug: 'recuperer-mauvais-avis-airbnb-methode-5-etapes',   label: 'Récupérer mauvais avis',                 categoryLabel: 'Expérience' },
  ],
}
