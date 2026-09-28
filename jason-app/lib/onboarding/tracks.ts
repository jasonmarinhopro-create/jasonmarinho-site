// Multi-track onboarding system.
// Each track is a self-contained set of steps the user can complete in any order.
// Detection is hybrid: some steps are auto-detected from DB state, others rely on
// manual flags stored in profiles.onboarding_completed_steps.
//
// IMPORTANT : les `key` des étapes sont STABLES — elles sont persistées dans
// profiles.onboarding_completed_steps. On peut réécrire titres/descriptions/
// routes librement, mais renommer une key remet la progression des hôtes à zéro.
//
// Les routes pointent vers la NOUVELLE architecture du dashboard (refactor
// hubs — cf. docs/REFACTOR-DASHBOARD.md) : le rôle de l'onboarding est
// d'apprendre la nouvelle géographie aux hôtes, pas les URLs legacy.

export type DetectKind = 'auto' | 'manual'

export interface OnboardingStepDef {
  /** Stable identifier (used for manual flags). */
  key: string
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
  /** 'auto' = computed server-side from DB; 'manual' = user marks it done. */
  detect: DetectKind
  /** If set, the step is locked unless the user has this plan or higher. */
  requiresPlan?: 'standard' | 'driing'
}

export interface OnboardingTrackDef {
  key: 'demarrer' | 'quotidien' | 'gestion' | 'acquisition' | 'communaute'
  /** Icône Phosphor (voir TRACK_ICONS dans components/onboarding/OnboardingTracks.tsx) */
  icon: 'rocket' | 'calendar' | 'handshake' | 'megaphone' | 'chats'
  title: string
  description: string
  /** Couleur de la marque (pas de bleu, cf. CLAUDE.md) */
  color: string
  steps: OnboardingStepDef[]
}

// Parcours revus le 28/09/2026 (demande de Jason : « trop à l'ancienne »).
// Alignés sur le positionnement de l'app (calendrier Airbnb/Booking, planning
// ménage, contrats et caution pour le direct) et sur le menu actuel. Étapes
// retirées : « voyageur » (couvert par « sejour »), « reported_view » et
// « chez_nous_intro » (doublons) ; leurs drapeaux déjà enregistrés restent
// inoffensifs. Nouvelles : « ical_connected », « menage_shared ».
export const ONBOARDING_TRACKS: OnboardingTrackDef[] = [
  {
    key: 'demarrer',
    icon: 'rocket',
    title: 'Démarrer',
    description: 'Ton logement, ton calendrier Airbnb ou Booking et ta première réservation complète.',
    color: 'var(--accent-text)',
    steps: [
      {
        key: 'welcome',
        title: 'Découvre ton espace',
        description: 'En deux minutes : ton quotidien en haut du menu (calendrier, réservations, contrats, finances), les outils pour faire grandir ton activité en dessous.',
        ctaLabel: 'Commencer',
        ctaHref: '/dashboard/aide/demarrer',
        detect: 'manual',
      },
      {
        key: 'logement',
        title: 'Ajoute ton logement',
        description: 'Nom, adresse, capacité : 2 minutes. Il sert ensuite à tes contrats, ton planning ménage, tes déclarations et tes finances.',
        ctaLabel: 'Ajouter un logement',
        // ?tour=1 lance la visite guidée de la page
        ctaHref: '/dashboard/logements?tour=1',
        detect: 'auto',
      },
      {
        key: 'ical_connected',
        title: 'Connecte ton calendrier Airbnb ou Booking',
        description: 'Colle le lien iCal de ton annonce dans la fiche du logement : tes réservations arrivent seules dans le calendrier et le planning ménage se calcule tout seul.',
        ctaLabel: 'Ouvrir mes logements',
        ctaHref: '/dashboard/logements',
        detect: 'auto',
      },
      {
        key: 'sejour',
        title: 'Complète ta première réservation',
        description: 'Airbnb et Booking ne transmettent que les dates : dans le Calendrier, clique sur une réservation puis « Compléter la réservation » (voyageur, nationalité, montant). Ou saisis une réservation directe.',
        ctaLabel: 'Ouvrir le calendrier',
        ctaHref: '/dashboard/calendrier?tour=1',
        detect: 'auto',
      },
      {
        key: 'install_app',
        title: 'Installe l\'app sur ton téléphone',
        description: 'Un raccourci sur ton écran d\'accueil, comme une vraie app : ton planning et tes arrivées toujours sous la main.',
        ctaLabel: 'Installer',
        ctaHref: '/dashboard?install=1',
        detect: 'manual',
      },
    ],
  },
  {
    key: 'quotidien',
    icon: 'calendar',
    title: 'Au quotidien',
    description: 'Ménage partagé avec ton équipe, messages prêts à envoyer, affiche d\'accueil.',
    color: '#B7791F',
    steps: [
      {
        key: 'menage_shared',
        title: 'Partage ton planning ménage',
        description: 'Ton équipe reçoit un lien : les ménages de tes départs, à jour tout seuls, et elle te renvoie ses photos de fin de ménage.',
        ctaLabel: 'Ouvrir le planning ménage',
        ctaHref: '/dashboard/calendrier/menage',
        detect: 'auto',
      },
      {
        key: 'gabarit',
        title: 'Prépare tes messages voyageurs',
        description: 'Arrivée, codes d\'accès, départ, demande d\'avis : des modèles en français et en anglais, à personnaliser puis copier dans Airbnb, Booking ou WhatsApp.',
        ctaLabel: 'Voir les modèles',
        ctaHref: '/dashboard/gabarits',
        detect: 'manual',
      },
      {
        key: 'affiche',
        title: 'Crée ton affiche d\'accueil',
        description: 'QR code Wi-Fi et infos pratiques sur une affiche A4 prête à imprimer.',
        ctaLabel: 'Créer mon affiche',
        ctaHref: '/dashboard/outils-impression',
        detect: 'auto',
      },
    ],
  },
  {
    key: 'gestion',
    icon: 'handshake',
    title: 'Réservations directes',
    description: 'Vérifier le voyageur, faire signer un contrat, encaisser loyer et caution sans commission.',
    color: '#2F7D52',
    steps: [
      {
        key: 'reported_search',
        title: 'Vérifie un voyageur',
        description: 'Avant de dire oui, cherche son e-mail ou son téléphone dans Sécurité voyageur. Tes prochains voyageurs y sont aussi vérifiés automatiquement.',
        ctaLabel: 'Vérifier un voyageur',
        ctaHref: '/dashboard/securite',
        detect: 'manual',
      },
      {
        key: 'stripe_connect',
        title: 'Connecte ton compte Stripe',
        description: 'Le loyer est payé par carte directement sur ton compte, et la caution est bloquée sur la carte du voyageur. Aucune commission de notre part.',
        ctaLabel: 'Connecter Stripe',
        ctaHref: '/dashboard/profil#stripe',
        detect: 'auto',
        requiresPlan: 'standard',
      },
      {
        key: 'contrat',
        title: 'Envoie ton premier contrat',
        description: 'Contrat en français, portugais ou anglais, signé en ligne, avec le lien de paiement et la caution.',
        ctaLabel: 'Nouveau contrat',
        ctaHref: '/dashboard/contrats',
        detect: 'auto',
        requiresPlan: 'standard',
      },
    ],
  },
  {
    key: 'acquisition',
    icon: 'megaphone',
    title: 'Trouver des voyageurs',
    description: 'Des réservations en direct grâce aux groupes Facebook de voyageurs et à ta fiche Google.',
    color: '#B83A7C',
    steps: [
      {
        key: 'fb_template_chosen',
        title: 'Rejoins les groupes Facebook de ta région',
        description: 'Les groupes où des voyageurs cherchent un logement : rejoins ceux qui correspondent à ta ville.',
        ctaLabel: 'Voir les groupes',
        ctaHref: '/dashboard/visibilite/facebook',
        detect: 'manual',
      },
      {
        key: 'fb_post_published',
        title: 'Publie tes dates libres',
        description: 'Copie un post prêt à coller avec ton lien de réservation, publie-le dans un groupe, puis coche cette étape.',
        ctaLabel: 'Copier un post',
        ctaHref: '/dashboard/visibilite/facebook',
        detect: 'manual',
      },
      {
        key: 'gbp_audit',
        title: 'Fais l\'audit de ta fiche Google',
        description: 'Colle le lien Google Maps de ton logement : un score en 30 secondes et la liste de ce qui te fait perdre des clics.',
        ctaLabel: 'Lancer l\'audit',
        ctaHref: '/dashboard/visibilite/google',
        detect: 'auto',
      },
    ],
  },
  {
    key: 'communaute',
    icon: 'chats',
    title: 'Entre hôtes',
    description: 'Une question sur la fiscalité, la mairie ou un voyageur : réponse sous 48 h.',
    color: '#6E5446',
    steps: [
      {
        key: 'chez_nous_post',
        title: 'Pose ta première question',
        description: 'Ce qui te bloque en ce moment : Jason ou un hôte expérimenté te répond sous 48 h, et tu es prévenu par e-mail.',
        ctaLabel: 'Poser ma question',
        ctaHref: '/dashboard/entre-hotes/forum?ask=1',
        detect: 'auto',
      },
      {
        key: 'ecosysteme_explored',
        title: 'Découvre les partenaires & outils',
        description: 'Logiciels, banque, services : les outils comparés, avec les offres réservées aux membres.',
        ctaLabel: 'Voir les partenaires',
        ctaHref: '/dashboard/entre-hotes/ecosysteme',
        detect: 'manual',
      },
    ],
  },
]

export function getTrack(key: string): OnboardingTrackDef | undefined {
  return ONBOARDING_TRACKS.find(t => t.key === key)
}

export function getDefaultTrack(): OnboardingTrackDef {
  return ONBOARDING_TRACKS[0]
}
