export default {
  slug: 'numero-enregistrement-lcd-obtenir-etapes-pratiques',
  title: 'Numéro d\'enregistrement LCD : 8 étapes pratiques pour l\'obtenir avant mai 2026',
  description: 'Le numéro d\'enregistrement national LCD devient obligatoire le 20 mai 2026. Voici la procédure étape par étape, les documents requis et les délais réels.',
  keywords: 'numéro enregistrement LCD, déclaration meublé tourisme 2026, loi Le Meur enregistrement, télédéclaration hôte',
  date: '2026-04-25',
  categorySlug: 'reglementation',
  readTime: 5,

  lead: 'À partir du 20 mai 2026, tout hôte qui loue en LCD en France doit avoir un numéro d\'enregistrement national. Sans lui, tes annonces seront retirées des plateformes. Voici la procédure complète en 8 étapes pour l\'obtenir avant la deadline, avec les pièges à éviter.',

  sections: [
    {
      h2: '1. Avant de commencer : les 4 documents à préparer',
      content: [
        { type: 'p', text: 'Avant de te connecter au téléservice, rassemble ces documents. Les avoir prêts évite de devoir interrompre la procédure et la reprendre.' },
        { type: 'ul', items: [
          'DPE en cours de validité (< 10 ans) — classe ≥ E pour les nouvelles autorisations 2026',
          'Justificatif de propriété (acte de vente) ou d\'autorisation du propriétaire (mandat de gestion si tu n\'es pas propriétaire)',
          'Attestation de déclaration en mairie (formulaire Cerfa 14004) si commune en zone tendue',
          'SIRET si tu as une activité déclarée. Sinon, tu seras enregistré comme particulier',
        ]},
      ],
    },
    {
      h2: '2. Les 8 étapes de la procédure',
      content: [
        { type: 'ul', items: [
          '1. Se connecter à service-public.fr → rubrique "Meublés de tourisme" → "Demander un numéro d\'enregistrement"',
          '2. Créer ou se connecter à son compte FranceConnect',
          '3. Saisir les coordonnées du propriétaire (nom, adresse, email, téléphone)',
          '4. Saisir l\'adresse exacte du logement (le système vérifie via Google Maps)',
          '5. Indiquer le type de logement (résidence principale partielle ou meublé de tourisme dédié)',
          '6. Uploader le DPE en PDF',
          '7. Fournir le numéro de SIRET si professionnel + justificatifs',
          '8. Recevoir le numéro d\'enregistrement par email (généralement sous 5-10 jours)',
        ]},
        { type: 'tip', text: 'Le numéro d\'enregistrement a la forme XXXXX-XXXXX (chiffres + lettres). Note-le précieusement, tu vas devoir le saisir sur Airbnb, Booking et toutes tes annonces (champ "Informations réglementaires").' },
      ],
    },
    {
      h2: '3. Délais réels et anticipation',
      content: [
        { type: 'p', text: 'Le téléservice a annoncé un délai de 5-10 jours, mais en pratique, vu l\'afflux des demandes en avril 2026, certains hôtes attendent 3-4 semaines. À J-30 de la deadline (20 mai), il y aura un goulot d\'étranglement.' },
        { type: 'ul', items: [
          'Idéal : démarche faite dès que tu as ton DPE, même 6 mois avant la deadline',
          'Limite : faire la démarche au plus tard fin avril 2026 pour avoir ton numéro avant le 20 mai',
          'Si en retard : tu risques le retrait automatique de tes annonces dès le 21 mai. Pas de période de grâce annoncée par les plateformes',
        ]},
      ],
    },
    {
      h2: '4. Erreurs fréquentes qui bloquent la procédure',
      content: [
        { type: 'p', text: 'Sur les premières démarches déposées en 2025, voici les motifs de blocage les plus fréquents.' },
        { type: 'ul', items: [
          'DPE expiré (> 10 ans) — refait obligatoirement avant de pouvoir continuer',
          'Adresse mal saisie (différente de Google Maps) — erreur 404 du téléservice, à corriger manuellement',
          'Absence de déclaration mairie pour communes en zone tendue (>200 villes en France) — démarche complémentaire à faire',
          'Confusion résidence principale partielle vs meublé de tourisme dédié — affecte tes plafonds annuels',
          'Tentative depuis un compte FranceConnect d\'un proche — refusé, doit être au nom du propriétaire',
        ]},
        { type: 'cta', text: 'Tu veux être conforme à toutes les obligations LCD 2026 sans stress ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'numero-enregistrement-lcd-20-mai-2026-demarches',  label: 'Numéro d\'enregistrement obligatoire',  categoryLabel: 'Réglementation' },
    { slug: 'reglementation-lcd-france-2026',                   label: 'Réglementation LCD 2026',               categoryLabel: 'Réglementation' },
    { slug: 'declarer-activite-location-courte-duree-france-demarches', label: 'Déclarer son activité LCD',     categoryLabel: 'Réglementation' },
  ],
}
