export default {
  slug: 'stripe-paiement-direct-lcd-mise-en-place',
  title: 'Stripe pour la réservation directe LCD : mise en place et paramétrage 2026',
  description: 'Stripe permet d\'encaisser les paiements voyageurs en direct, sans passer par Airbnb. Voici comment l\'intégrer en 30 min, frais inclus.',
  keywords: 'Stripe Airbnb direct, paiement réservation directe LCD, encaissement direct hôte, paramétrage Stripe location',
  date: '2026-04-25',
  categorySlug: 'automatisation',
  readTime: 5,

  lead: 'Pour encaisser les réservations directes (sans commission Airbnb), Stripe est l\'outil le plus utilisé en France. Mise en place en 30 min, frais 1,4 % + 0,25 € par transaction (vs 14 % Airbnb voyageur + 3 % hôte = 17 % total). Économie réelle. Voici comment faire.',

  sections: [
    {
      h2: '1. Pourquoi Stripe est devenu standard',
      content: [
        { type: 'p', text: 'Stripe est l\'option la plus utilisée par les hôtes LCD français pour 4 raisons.' },
        { type: 'ul', items: [
          'Frais bas : 1,4 % + 0,25 € par transaction (cartes EU). 2,9 % + 0,30 € pour cartes hors EU',
          'Intégration native dans la plupart des outils (Driing, Lodgify, sites WordPress)',
          'Sécurité 3D Secure native, conformité PCI-DSS, paiements sécurisés',
          'Tableau de bord pro : reporting, remboursements, gestion litiges',
        ]},
      ],
    },
    {
      h2: '2. Mise en place en 30 minutes',
      content: [
        { type: 'p', text: 'La création du compte Stripe est rapide.' },
        { type: 'ul', items: [
          'Étape 1 : créer un compte Stripe sur stripe.com. Renseigner SIRET, RIB, identité',
          'Étape 2 : Stripe vérifie ton identité (24-48 h pour validation)',
          'Étape 3 : connecter Stripe à ton outil de réservation (Driing, Lodgify, ton site WordPress)',
          'Étape 4 : configurer les paiements en 1 fois ou en 2 fois (acompte + solde au check-in)',
          'Étape 5 : tester avec une fausse réservation (Stripe Test Mode disponible) avant le go-live',
        ]},
        { type: 'tip', text: 'Active la pré-autorisation pour les cautions : tu fais une "empreinte CB" sans débit, et tu prélèves UNIQUEMENT en cas de dégât. Stripe permet ça nativement (équivalent SwikLy mais intégré).' },
      ],
    },
    {
      h2: '3. Paramétrage avancé',
      content: [
        { type: 'p', text: 'Au-delà de l\'encaissement basique, voici les fonctionnalités à activer.' },
        { type: 'ul', items: [
          'Paiement en 2 fois ou 3 fois sans frais : booste le taux de conversion (Stripe Capital Plus)',
          'Webhooks : recevoir une notification automatique après paiement réussi/échoué',
          'Subscription : facturation mensuelle si tu as des abonnés/voyageurs réguliers (rare en LCD)',
          'Connect (multi-comptes) : utile pour les conciergeries qui encaissent pour plusieurs propriétaires',
          'Stripe Tax : calcul automatique de la TVA selon la localisation du voyageur (utile à partir du seuil TVA)',
        ]},
      ],
    },
    {
      h2: '4. Calcul d\'économie vs Airbnb',
      content: [
        { type: 'p', text: 'Voici l\'économie concrète sur un panier moyen.' },
        { type: 'ul', items: [
          'Réservation 600 € sur Airbnb : commission Airbnb hôte (3 %) = 18 €. Le voyageur paie 600 + 14 % = 684 €. Tu reçois 582 €',
          'Même réservation en direct via Stripe : tarif identique 684 € si tu absorbes la commission voyageur. Frais Stripe = 9,8 €. Tu reçois 674 €',
          'Économie : 92 € par réservation soit 15 % du prix payé voyageur',
          'Si tu fais 30 réservations/an en direct : économie 2 760 €/an',
          'Sur 5 ans : 13 800 € d\'économies vs full Airbnb',
        ]},
        { type: 'p', text: 'L\'enjeu est de basculer progressivement de 100 % Airbnb à un mix Airbnb + direct. 30 % de réservations directes représente déjà une économie majeure et te rend moins dépendant des plateformes.' },
        { type: 'cta', text: 'Tu veux mettre en place ta réservation directe sans commission ?', button: 'Voir les formations', href: '/services/formations/annonce-directe' },
      ],
    },
  ],

  related: [
    { slug: 'reservation-directe-sans-commission',              label: 'Réservation directe sans commission',   categoryLabel: 'Revenus' },
    { slug: 'securiser-paiement-reservation-directe-sans-airbnb', label: 'Sécuriser paiements réservation directe', categoryLabel: 'Revenus' },
    { slug: 'driing-plateforme-vacances-sans-commissions',      label: 'Driing : plateforme sans commission',   categoryLabel: 'Driing' },
  ],
}
