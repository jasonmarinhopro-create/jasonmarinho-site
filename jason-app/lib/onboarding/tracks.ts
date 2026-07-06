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
  key: 'demarrer' | 'acquisition' | 'gestion' | 'communaute'
  /** Emoji shown on the card and pill. */
  icon: string
  title: string
  description: string
  /** Hex or CSS variable used for the accent color. */
  color: string
  steps: OnboardingStepDef[]
}

export const ONBOARDING_TRACKS: OnboardingTrackDef[] = [
  {
    key: 'demarrer',
    icon: '🏁',
    title: 'Démarrer mon activité',
    description: 'Les fondations : ton logement, tes voyageurs, ta première réservation.',
    color: 'var(--accent-text)',
    steps: [
      {
        key: 'welcome',
        title: 'Bienvenue dans ton espace',
        description: 'Lis le message de Jason et découvre comment ton espace est organisé : ton quotidien d\'un côté, les outils pour faire grandir ton activité de l\'autre.',
        ctaLabel: 'Commencer',
        ctaHref: '/dashboard/aide/demarrer',
        detect: 'manual',
      },
      {
        key: 'logement',
        title: 'Ajoute ton premier logement',
        description: 'Le point de départ de tout le reste : 4 champs, 2 minutes. Ton logement alimente ensuite tes contrats, tes finances et tes simulateurs.',
        ctaLabel: 'Ajouter un logement',
        // ?tour=1 force la visite guidée à se lancer (utile pour les hôtes qui
        // arrivent depuis le widget Parcours et n'ont pas encore vu le tour).
        ctaHref: '/dashboard/logements?tour=1',
        detect: 'auto',
      },
      {
        key: 'voyageur',
        title: 'Crée ta première fiche voyageur',
        description: 'Ton carnet de contacts : chaque voyageur garde son historique de séjours, ses coordonnées et tes notes privées.',
        ctaLabel: 'Ajouter un voyageur',
        ctaHref: '/dashboard/voyageurs?tour=1',
        detect: 'auto',
      },
      {
        key: 'sejour',
        title: 'Saisis ta première réservation',
        description: 'Lie un logement, un voyageur et des dates depuis le Calendrier. Elle apparaîtra aussitôt dans « Mes réservations » avec CA et alertes.',
        ctaLabel: 'Ouvrir le calendrier',
        ctaHref: '/dashboard/calendrier?tour=1',
        detect: 'auto',
      },
      {
        key: 'gabarit',
        title: 'Configure tes Messages voyageurs',
        description: 'Choisis quels messages envoyer avant, pendant et après chaque séjour. C\'est l\'onglet « Messages » dans ton menu.',
        ctaLabel: 'Configurer mes messages',
        ctaHref: '/dashboard/gabarits',
        detect: 'manual',
      },
      {
        key: 'affiche',
        title: 'Crée ton affiche WiFi & accueil',
        description: 'QR code WiFi + infos pratiques sur une affiche A4 prête à imprimer. À retrouver dans « Outils & calculs ».',
        ctaLabel: 'Créer mon affiche',
        ctaHref: '/dashboard/outils-impression',
        detect: 'auto',
      },
      {
        key: 'install_app',
        title: 'Installe ton espace sur ton téléphone',
        description: 'Garde Jason à portée de tap : un raccourci comme une vraie app, sur ton écran d\'accueil.',
        ctaLabel: 'Installer maintenant',
        ctaHref: '/dashboard?install=1',
        detect: 'manual',
      },
    ],
  },
  {
    key: 'acquisition',
    icon: '📣',
    title: 'Trouver des voyageurs',
    description: 'Active les leviers Facebook + Google Business pour faire venir tes premiers clients.',
    color: '#3b82f6',
    steps: [
      {
        key: 'fb_template_chosen',
        title: 'Choisis un post pour les groupes Facebook',
        description: 'Pioche un gabarit dans « Entre Hôtes → Groupes Facebook » pour te présenter dans les groupes d\'entraide LCD.',
        ctaLabel: 'Voir les groupes',
        ctaHref: '/dashboard/entre-hotes/groupes-facebook',
        detect: 'manual',
      },
      {
        key: 'fb_post_published',
        title: 'Publie ton premier post',
        description: 'Personnalise le message, copie-le et partage-le dans les groupes Facebook LCD. Coche cette étape une fois publié.',
        ctaLabel: 'Voir les groupes',
        ctaHref: '/dashboard/entre-hotes/groupes-facebook',
        detect: 'manual',
      },
      {
        key: 'gbp_audit',
        title: 'Lance ton audit Google Business Profile',
        description: 'Diagnostic complet de ta présence locale : visibilité, avis, photos. Aussi accessible depuis « Outils & calculs ».',
        ctaLabel: 'Lancer un audit',
        ctaHref: '/dashboard/audit-gbp',
        detect: 'auto',
      },
    ],
  },
  {
    key: 'gestion',
    icon: '🛡️',
    title: 'Sécuriser & contractualiser',
    description: 'Protège chaque réservation : vérification voyageur + contrats électroniques.',
    color: '#f97316',
    steps: [
      {
        key: 'reported_view',
        title: 'Découvre la base de signalements',
        description: 'Plus de 200 voyageurs problématiques signalés par la communauté LCD, dans « Sécurité voyageur ».',
        ctaLabel: 'Ouvrir la base',
        ctaHref: '/dashboard/securite',
        detect: 'manual',
      },
      {
        key: 'reported_search',
        title: 'Vérifie un voyageur',
        description: 'Recherche par téléphone ou email avant de confirmer une réservation. Le réflexe qui évite les mauvaises surprises.',
        ctaLabel: 'Faire une recherche',
        ctaHref: '/dashboard/securite',
        detect: 'manual',
      },
      {
        key: 'stripe_connect',
        title: 'Connecte ton compte Stripe',
        description: 'Indispensable pour encaisser loyer et caution en direct, sans passer par les OTA. Tes encaissements arrivent ensuite dans « Mes finances ».',
        ctaLabel: 'Connecter Stripe',
        ctaHref: '/dashboard/profil#stripe',
        detect: 'auto',
        requiresPlan: 'standard',
      },
      {
        key: 'contrat',
        title: 'Envoie ton premier contrat',
        description: 'Génère un contrat de location depuis une réservation, fais signer en ligne, encaisse loyer + caution.',
        ctaLabel: 'Voir mes réservations',
        ctaHref: '/dashboard/reservations',
        detect: 'auto',
        requiresPlan: 'standard',
      },
    ],
  },
  {
    key: 'communaute',
    icon: '👥',
    title: 'Communauté & écosystème',
    description: 'Rejoins la famille LCD : le hub « Entre Hôtes » réunit forum, groupes et partenaires.',
    color: '#10b981',
    steps: [
      {
        key: 'chez_nous_intro',
        title: 'Découvre le forum Entre Hôtes',
        description: 'Le forum privé des hôtes LCD : entraide, conseils, retours d\'expérience. Premier onglet du hub « Entre Hôtes ».',
        ctaLabel: 'Visiter le forum',
        ctaHref: '/dashboard/entre-hotes/forum',
        detect: 'auto',
      },
      {
        key: 'chez_nous_post',
        title: 'Publie ton premier message',
        description: 'Présente-toi, pose une question, partage une astuce. La communauté répond vite.',
        ctaLabel: 'Écrire un post',
        ctaHref: '/dashboard/entre-hotes/forum',
        detect: 'auto',
      },
      {
        key: 'ecosysteme_explored',
        title: 'Explore l\'écosystème LCD',
        description: 'Conciergeries, photographes, ménage, services partenaires : l\'onglet Écosystème du hub « Entre Hôtes ».',
        ctaLabel: 'Voir les services',
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
