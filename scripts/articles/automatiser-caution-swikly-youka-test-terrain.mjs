export default {
  slug: 'automatiser-caution-swikly-youka-test-terrain',
  title: 'Automatiser sa caution LCD : SwikLy vs Youka vs solution maison',
  description: 'Test terrain des 3 solutions pour gérer ta caution voyageur sans friction. Tarifs, fiabilité, expérience voyageur, intégrations Airbnb/Booking.',
  keywords: 'caution Airbnb automatique, SwikLy LCD, Youka caution location, dépôt garantie hôte 2026',
  date: '2026-04-25',
  categorySlug: 'automatisation',
  readTime: 5,

  lead: 'La caution voyageur est un vrai sujet en LCD. Trop friction (chèque, virement, espèces au check-in) elle dégrade ton avis. Trop laxiste (pas de caution) et tu paies les casses au prix fort. Les solutions automatiques type SwikLy ou Youka résolvent l\'équation. Test terrain pour choisir.',

  sections: [
    {
      h2: '1. Pourquoi automatiser sa caution',
      content: [
        { type: 'p', text: 'Demander une caution en cash ou par chèque au check-in crée 3 problèmes : friction au moment de l\'arrivée (mauvaise première impression), pas de couverture si check-in autonome (tu n\'es pas là pour récupérer le chèque), et complexité de remboursement post-séjour.' },
        { type: 'p', text: 'Les solutions de caution dématérialisée résolvent ces 3 points : le voyageur autorise un prélèvement potentiel sur sa carte avant l\'arrivée, tu ne prélèves QUE en cas de dégât réel, et le remboursement est automatique 48 h après le check-out s\'il n\'y a pas de réclamation.' },
        { type: 'tip', text: 'Sur Airbnb, tu peux mentionner ta caution (jusqu\'à 1 000 €) dans la description. Sur Booking, tu peux la facturer directement à l\'arrivée. Sur réservation directe (Driing, GMB), tu paramètres au check-out.' },
      ],
    },
    {
      h2: '2. SwikLy — le pure-player français',
      content: [
        { type: 'p', text: 'SwikLy (basé en France, RGPD friendly) est la solution la plus utilisée par les hôtes LCD français. Le voyageur reçoit un email avec un lien pour autoriser une empreinte CB. Si dégât, tu prélèves directement depuis ton dashboard. Si pas de problème, tu cliques sur "libérer" et le voyageur récupère sa caution sous 24 h.' },
        { type: 'ul', items: [
          'Tarif : 1,90 € par caution + 1 % du montant prélevé (uniquement si dégât)',
          'Cautions de 50 à 5 000 €',
          'Email automatique au voyageur 48 h avant check-in',
          'Pas d\'intégration directe Airbnb : tu envoies le lien manuellement (ou via auto-message)',
          'Très utilisé en France, peu de friction côté voyageur (interface en français)',
        ]},
      ],
    },
    {
      h2: '3. Youka — l\'option intégrée Airbnb',
      content: [
        { type: 'p', text: 'Youka est plus récent mais propose une intégration directe avec Airbnb (via API). Le lien est envoyé automatiquement après réservation, sans intervention de ta part. Si tu cherches du "set & forget", c\'est l\'option.' },
        { type: 'ul', items: [
          'Tarif : 2,50 € par caution + 1,5 % en cas de prélèvement',
          'Intégration Airbnb native : lien envoyé automatiquement',
          'Cautions de 100 à 3 000 €',
          'Dashboard plus moderne que SwikLy',
          'Inconvénient : disponible en France uniquement, voyageurs étrangers peuvent avoir des erreurs sur certaines cartes',
        ]},
      ],
    },
    {
      h2: '4. La solution maison : pre-auth via Stripe',
      content: [
        { type: 'p', text: 'Si tu as un site de réservation directe (via Driing par exemple), tu peux mettre en place ta propre solution de pré-autorisation Stripe sans passer par un tiers. Avantages : zéro coût par caution, contrôle total. Inconvénients : développement nécessaire, conformité PCI à respecter.' },
        { type: 'p', text: 'Pour la plupart des hôtes, le rapport coût-temps-fiabilité penche en faveur de SwikLy ou Youka. La solution maison ne devient rentable qu\'au-delà de 100 cautions/an et nécessite des compétences techniques.' },
        { type: 'cta', text: 'Tu veux automatiser ton flow LCD complet (paiement, caution, accès, communication) ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'securiser-paiement-reservation-directe-sans-airbnb', label: 'Sécuriser paiements réservation directe', categoryLabel: 'Revenus' },
    { slug: 'verification-voyageurs-avant-accepter-reservation-lcd', label: 'Vérifier les voyageurs',           categoryLabel: 'Expérience' },
    { slug: 'gerer-voyageurs-difficiles-location-courte-duree', label: 'Gérer voyageurs difficiles',            categoryLabel: 'Expérience' },
  ],
}
