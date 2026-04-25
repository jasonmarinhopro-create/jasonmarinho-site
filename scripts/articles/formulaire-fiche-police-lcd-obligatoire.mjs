export default {
  slug: 'formulaire-fiche-police-lcd-obligatoire',
  title: 'Fiche de police LCD : remplir et conserver le formulaire obligatoire',
  description: 'La fiche de police pour les voyageurs étrangers est obligatoire en LCD. Modèle, données à collecter, durée de conservation et risques en cas de manquement.',
  keywords: 'fiche police Airbnb, fiche police étranger LCD, formulaire voyageur étranger location, obligation hôte 2026',
  date: '2026-04-25',
  categorySlug: 'ressources',
  readTime: 4,

  lead: 'La fiche de police est obligatoire en France pour tout voyageur étranger qui passe une nuit dans ton logement LCD. C\'est l\'une des obligations les moins connues des hôtes Airbnb français — et l\'une des plus contrôlées en cas d\'inspection. Voici ce que tu dois savoir et faire en 2026.',

  sections: [
    {
      h2: '1. Qui est concerné par la fiche de police',
      content: [
        { type: 'p', text: 'L\'obligation découle de l\'article R.611-42 du Code de l\'entrée et du séjour des étrangers. Elle s\'applique à tous les hébergements touristiques en France, y compris les meublés de tourisme et résidences principales louées en LCD.' },
        { type: 'ul', items: [
          'Concerné : tout voyageur étranger (non-français) majeur qui passe au moins une nuit dans ton logement',
          'Non concerné : les ressortissants français (mais beaucoup d\'hôtes le font quand même par simplicité)',
          'Délai : remplir au plus tard le jour de l\'arrivée. Conserver minimum 6 mois',
          'Format : papier ou numérique (les 2 formats sont valides en 2026)',
        ]},
      ],
    },
    {
      h2: '2. Les 6 informations à collecter',
      content: [
        { type: 'p', text: 'Le formulaire officiel demande les informations suivantes :' },
        { type: 'ul', items: [
          'Nom et prénoms du voyageur',
          'Date et lieu de naissance',
          'Nationalité',
          'Numéro et type de pièce d\'identité (passeport ou carte d\'identité)',
          'Date d\'arrivée',
          'Date prévue de départ',
        ]},
        { type: 'tip', text: 'Sur Airbnb, tu peux demander une copie de pièce d\'identité avant le check-in via le système de "vérification voyageur". Sur Booking, c\'est généralement déjà inclus dans la réservation. Pour les réservations directes, tu peux demander la copie via Driing ou directement par email.' },
      ],
    },
    {
      h2: '3. Comment remplir et conserver',
      content: [
        { type: 'p', text: 'Tu as plusieurs options pour remplir la fiche.' },
        { type: 'ul', items: [
          'Format papier classique : modèle gratuit téléchargeable sur service-public.fr. Le voyageur le remplit à l\'arrivée, tu le conserves 6 mois minimum',
          'Format numérique simple : Google Form ou Typeform avec les 6 champs. Lien envoyé au voyageur avant arrivée. Conservation cloud',
          'Solution intégrée Driing : si tu utilises Driing, le formulaire fiche de police est généré automatiquement à chaque réservation et conservé dans ton espace 6 mois',
          'Solution channel manager : Hospitable, Smoobu et autres CM ont une fonctionnalité "registre du logeur" qui combine fiche de police + taxe de séjour',
        ]},
      ],
    },
    {
      h2: '4. Sanctions et contrôles',
      content: [
        { type: 'p', text: 'Beaucoup d\'hôtes ignorent cette obligation — jusqu\'au jour où ils sont contrôlés. Voici les enjeux.' },
        { type: 'ul', items: [
          'Amende administrative : 3e classe (jusqu\'à 450 €) par fiche manquante en cas de contrôle',
          'En cas d\'enquête criminelle (suspect logé chez toi) : ne pas avoir la fiche peut être considéré comme entrave à l\'enquête',
          'Contrôles : généralement par les services de police municipale ou nationale, en zones touristiques. La fréquence augmente en 2026 avec la loi Le Meur',
          'Dans la pratique : les hôtes en règle qui le font correctement n\'ont jamais de problème. Ceux qui n\'ont rien sont rappelés en général à la première inspection',
        ]},
        { type: 'p', text: 'Mettre en place une fiche de police digitale prend 30 minutes (création du formulaire) et te protège pour toujours. C\'est l\'une des conformités les plus simples à régler. Inutile de stresser, mais inutile aussi de l\'ignorer.' },
        { type: 'cta', text: 'Tu veux toutes les obligations LCD 2026 résumées et applicables ?', button: 'Voir les formations', href: '/#formations' },
      ],
    },
  ],

  related: [
    { slug: 'reglementation-lcd-france-2026',                   label: 'Réglementation LCD 2026',               categoryLabel: 'Réglementation' },
    { slug: 'verification-voyageurs-avant-accepter-reservation-lcd', label: 'Vérifier les voyageurs',           categoryLabel: 'Expérience' },
    { slug: 'declarer-activite-location-courte-duree-france-demarches', label: 'Déclarer son activité LCD',     categoryLabel: 'Réglementation' },
  ],
}
