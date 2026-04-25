export default {
  slug: 'taxe-sejour-lcd-comment-collecter',
  title: 'Taxe de séjour en LCD : comment la collecter sans erreur en 2026',
  description: 'La taxe de séjour est due par chaque voyageur. Plateformes vs collecte directe, montant, déclaration : le guide pratique pour ne pas se tromper.',
  keywords: 'taxe séjour LCD, taxe séjour Airbnb 2026, comment collecter taxe séjour, déclaration taxe séjour mairie',
  date: '2026-04-25',
  categorySlug: 'fiscalite',
  readTime: 5,

  lead: 'La taxe de séjour est une taxe locale due par TOUS les voyageurs séjournant dans ton logement, sauf exceptions (mineurs, travailleurs saisonniers). Tu en es le collecteur officiel. Sur Airbnb et Booking, c\'est automatique. Sur réservation directe, tu dois t\'en occuper toi-même. Voici comment faire correctement.',

  sections: [
    {
      h2: '1. Qui est redevable et combien',
      content: [
        { type: 'p', text: 'La taxe de séjour est instaurée par chaque commune. Elle s\'applique par voyageur et par nuit. Elle varie de 0,20 € à 5 € selon la commune, le type d\'hébergement et son classement.' },
        { type: 'ul', items: [
          'Hébergement non classé (Airbnb classique) : généralement 5 % du tarif HT par nuit/personne, plafonné à ~5 €',
          'Meublé de tourisme classé (1 à 5 étoiles) : tarif fixe par catégorie (0,80 € à 4,30 €/nuit/personne)',
          'Exempts : enfants -18 ans, contrat saisonnier de travail, urgence sanitaire',
          'Plafonnement : la taxe ne peut pas dépasser le tarif le plus élevé de l\'hôtellerie 4 étoiles de la commune',
        ]},
        { type: 'tip', text: 'Vérifie le montant exact pour ta commune sur taxesejour.impots.gouv.fr — tu as un simulateur officiel qui calcule exactement ce que tu dois facturer.' },
      ],
    },
    {
      h2: '2. Sur Airbnb et Booking : c\'est automatique',
      content: [
        { type: 'p', text: 'Depuis 2019, Airbnb et Booking collectent automatiquement la taxe de séjour pour la majorité des communes françaises. Tu n\'as RIEN à faire — la plateforme la facture au voyageur, la collecte, et la reverse directement à la commune.' },
        { type: 'ul', items: [
          'Tu vois la taxe sur la facture voyageur (séparée du tarif)',
          'La plateforme te transmet une attestation annuelle pour ta comptabilité',
          'Aucune déclaration mairie de ta part (sauf attestation à fournir si demandée)',
          'Important : vérifie 1 fois/an que ta commune est bien dans le système — les nouvelles communes mettent du temps à intégrer',
        ]},
      ],
    },
    {
      h2: '3. Sur réservation directe : tu dois la collecter toi-même',
      content: [
        { type: 'p', text: 'Si tu prends des réservations en direct (via ton site, Driing, GMB, ou autre canal hors Airbnb/Booking), tu es responsable de la collecte ET de la déclaration. Voici la procédure.' },
        { type: 'ul', items: [
          'Calcule la taxe due au moment de la réservation (montant × nombre de nuits × nombre de voyageurs)',
          'Affiche-la séparément du tarif sur ta facture (transparence obligatoire)',
          'Encaisse le montant total (tarif + taxe) en même temps',
          'Reverse à la commune trimestriellement ou semestriellement selon ses règles',
          'Tiens un registre des séjours (registre du logeur) avec dates, nombre de personnes, montant collecté',
        ]},
        { type: 'tip', text: 'Driing intègre nativement le calcul automatique de la taxe de séjour selon ta commune. Si tu utilises un autre outil, vérifie qu\'il calcule bien la taxe en plus du tarif (sinon tu vas l\'absorber sur ta marge).' },
      ],
    },
    {
      h2: '4. Déclaration et erreurs à éviter',
      content: [
        { type: 'p', text: 'Beaucoup d\'hôtes en location directe oublient de reverser ou se trompent dans le calcul. Voici les pièges classiques.' },
        { type: 'ul', items: [
          'Oublier de reverser : la commune peut réclamer rétroactivement avec pénalités (~5 % majoration)',
          'Confondre tarif HT et TTC : la taxe se calcule sur le tarif HT (hors taxe de séjour elle-même)',
          'Compter les enfants -18 ans : exemptés, donc juste les adultes pour le calcul',
          'Confondre taxe communale et taxe départementale : certaines communes appliquent la 2e en plus (10 % sur la 1re)',
          'Garder le registre du logeur en papier : depuis 2024, format numérique recommandé (Excel ou plateforme dédiée)',
        ]},
        { type: 'cta', text: 'Tu veux maîtriser tous les aspects fiscaux et réglementaires de la LCD ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'reglementation-lcd-france-2026',                   label: 'Réglementation LCD 2026',               categoryLabel: 'Réglementation' },
    { slug: 'declarer-activite-location-courte-duree-france-demarches', label: 'Déclarer son activité LCD',     categoryLabel: 'Réglementation' },
    { slug: 'location-courte-duree-impots-france',              label: 'LCD et impôts en France',               categoryLabel: 'Fiscalité' },
  ],
}
