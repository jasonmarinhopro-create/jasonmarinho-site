export default {
  slug: 'refacturer-degat-voyageur-airbnb-procedure',
  title: 'Refacturer un dégât voyageur : procédure Airbnb, Booking et direct (2026)',
  description: 'Un voyageur a cassé ou taché. Procédure étape par étape pour faire payer le dégât sur Airbnb (AirCover), Booking, ou via SwikLy/Youka en direct.',
  keywords: 'refacturer dégât Airbnb, AirCover procédure, caution voyageur dégât, retenue caution LCD',
  date: '2026-04-25',
  categorySlug: 'revenus',
  readTime: 6,

  lead: 'Le voyageur est parti, tu découvres un canapé taché, une vitre fissurée, un objet manquant. Combien tu peux refacturer ? Comment ? Voici la procédure exacte sur Airbnb (AirCover), Booking et en direct, avec les délais et pièges à éviter.',

  sections: [
    {
      h2: '1. Procédure Airbnb (AirCover)',
      content: [
        { type: 'p', text: 'Airbnb propose AirCover, sa garantie hôte gratuite. Elle couvre jusqu\'à 3 millions $ de dégâts mais sa procédure est stricte.' },
        { type: 'ul', items: [
          'Délai : déclarer dans les 14 jours suivant le check-out (impératif), idéalement 24-72 h',
          'Étape 1 : aller dans Aide → Centre de résolution → "Demander de l\'argent au voyageur"',
          'Étape 2 : décrire précisément le dégât avec photos AVANT (inventaire) et APRÈS (état actuel)',
          'Étape 3 : indiquer le montant (devis artisan ou prix neuf de l\'objet, justifié par facture/lien)',
          'Étape 4 : le voyageur a 24 h pour accepter, refuser, ou contre-proposer. S\'il refuse, escalade Airbnb',
          'Étape 5 : Airbnb arbitre en 3-5 jours sur dossier. Verdict basé sur tes preuves photo + facture',
          'Important : tes photos d\'inventaire doivent être DATÉES (cf. notre article sur l\'inventaire photo)',
        ]},
        { type: 'tip', text: 'AirCover couvre les dégâts au logement et au mobilier, MAIS PAS la perte de revenu si tu ne peux pas relouer. Pour la perte d\'exploitation, c\'est ton assurance LCD qui couvre.' },
      ],
    },
    {
      h2: '2. Procédure Booking.com',
      content: [
        { type: 'p', text: 'Booking n\'a PAS de système d\'AirCover équivalent. La procédure est manuelle et dépend de ton modèle de paiement.' },
        { type: 'ul', items: [
          'Si "Payments by Booking" (Booking encaisse) : tu peux demander le prélèvement de la caution voyageur via "Frais supplémentaires" dans l\'extranet. Booking valide ou non',
          'Si encaissement direct : tu factures directement le voyageur. S\'il refuse, tu utilises ta caution (SwikLy, Youka) si tu en avais une',
          'Étape 1 : prendre photos du dégât avec horodatage immédiat',
          'Étape 2 : envoyer email au voyageur avec photos + estimation du coût + délai de paiement (7 jours)',
          'Étape 3 : si paiement OK = clos. Si refus, Booking peut médiateur si tu as activé "Payments". Sinon = procédure légale (rare)',
          'En pratique : Booking médiation moins favorable à l\'hôte qu\'Airbnb. Mieux vaut avoir une caution préventive sur Booking',
        ]},
      ],
    },
    {
      h2: '3. Procédure réservation directe',
      content: [
        { type: 'p', text: 'Sur les réservations en direct (via Driing, GMB, ton site), tu es 100 % autonome — donc plus de pouvoir, mais aussi plus de responsabilité.' },
        { type: 'ul', items: [
          'Avoir une caution active : SwikLy ou Youka prennent une empreinte CB avant arrivée',
          'En cas de dégât : tu prélèves directement depuis ton dashboard SwikLy/Youka (sous 48 h)',
          'Justificatifs requis : photos avant/après + facture/devis',
          'Si voyageur conteste : il a recours auprès de la plateforme de caution (SwikLy/Youka médieront avec photos)',
          'Avantage : pas de délai de validation plateforme (vs Airbnb 3-5 jours d\'arbitrage)',
        ]},
      ],
    },
    {
      h2: '4. Les pièges à éviter dans tous les cas',
      content: [
        { type: 'p', text: 'Quel que soit le canal, ces 5 erreurs sabordent ta réclamation.' },
        { type: 'ul', items: [
          'Pas de photos avant : sans inventaire, le voyageur peut prétendre que le dégât existait. AirCover refuse',
          'Délai dépassé (>14 j Airbnb) : aucune chance de récupération',
          'Montant disproportionné : facturer 800 € pour une tache de café = refus. Reste réaliste',
          'Pas de facture/devis : sans pièce justificative chiffrée, ta demande est vide',
          'Communication agressive : le voyageur peut reporter ton message à Airbnb (harcèlement) et inverser le rapport de force',
        ]},
        { type: 'cta', text: 'Tu veux te protéger des litiges et gérer comme un pro ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'inventaire-logement-airbnb-modele-photos',         label: 'Inventaire logement Airbnb',             categoryLabel: 'Ressources' },
    { slug: 'automatiser-caution-swikly-youka-test-terrain',    label: 'Caution SwikLy / Youka',                 categoryLabel: 'Automatisation' },
    { slug: 'gerer-voyageurs-difficiles-location-courte-duree', label: 'Gérer voyageurs difficiles',            categoryLabel: 'Expérience' },
  ],
}
