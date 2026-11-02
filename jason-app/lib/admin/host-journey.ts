// Parcours d'un hôte pour la fiche membre de l'admin (02/11/2026, demande de
// Jason : « comprendre tout ce qu'elle fait, où elle en est, ce qui peut
// bloquer »). Pur et testé (host-journey.test.ts). Ne lit que des nombres et
// des dates : jamais un montant, un nom de voyageur ni le contenu d'une saisie.

export interface Usage { n: number; last: string | null }

export interface HostUsage {
  logements: Usage
  calendriers: Usage & { enErreur: number }
  /** Réservations reçues par la synchro des calendriers */
  reservationsImportees: number
  sejours: Usage
  voyageurs: Usage
  contrats: Usage & { signes: number }
  /** Compte Stripe pour les paiements en ligne (loyer, caution) */
  paiementsEnLigne: 'actif' | 'commence' | 'non'
  revenus: Usage
  charges: Usage & { recurrentes: number }
  objectif: boolean
  evenements: Usage
  declarations: Usage
  /** Appareils avec les notifications activées */
  notifications: number
}

export type StepState = 'fait' | 'en_cours' | 'a_faire' | 'probleme'

export interface JourneyStep {
  key: 'logement' | 'calendrier' | 'reservations' | 'voyageurs' | 'contrats' | 'paiements' | 'finances'
  title: string
  state: StepState
  detail: string
  at: string | null
}

export interface Journey {
  steps: JourneyStep[]
  done: number
  /** Premier frein dans l'ordre du parcours, avec une idée pour l'aider */
  blocage: { step: JourneyStep['key']; message: string; conseil: string } | null
  niveau: 'Pas encore commencé' | 'Premiers pas' | 'En place' | 'Utilisation avancée'
}

const pl = (n: number, one: string, many = `${one}s`) => `${n} ${n > 1 ? many : one}`
const latest = (...d: Array<string | null | undefined>) =>
  d.filter((x): x is string => !!x).sort().pop() ?? null

export function hostJourney(u: HostUsage): Journey {
  const reservations = u.reservationsImportees + u.sejours.n
  const finances = u.revenus.n + u.charges.n
  const steps: JourneyStep[] = [
    {
      key: 'logement', title: 'Logement ajouté',
      state: u.logements.n > 0 ? 'fait' : 'a_faire',
      detail: u.logements.n > 0 ? pl(u.logements.n, 'logement') : 'Aucun logement',
      at: u.logements.last,
    },
    {
      key: 'calendrier', title: 'Calendrier connecté',
      state: u.calendriers.n === 0 ? 'a_faire' : u.calendriers.enErreur > 0 ? 'probleme' : 'fait',
      detail: u.calendriers.n === 0 ? 'Aucun lien Airbnb ou Booking'
        : u.calendriers.enErreur > 0 ? `${pl(u.calendriers.enErreur, 'synchro')} en erreur sur ${u.calendriers.n}`
        : pl(u.calendriers.n, 'calendrier'),
      at: u.calendriers.last,
    },
    {
      key: 'reservations', title: 'Réservations dans l’app',
      state: reservations > 0 ? 'fait' : 'a_faire',
      detail: reservations > 0
        ? [u.reservationsImportees > 0 ? `${u.reservationsImportees} importée${u.reservationsImportees > 1 ? 's' : ''}` : null, u.sejours.n > 0 ? pl(u.sejours.n, 'séjour') + ' avec montant' : null].filter(Boolean).join(' · ')
        : 'Aucune réservation',
      at: u.sejours.last,
    },
    {
      key: 'voyageurs', title: 'Fiches voyageurs',
      state: u.voyageurs.n > 0 ? 'fait' : 'a_faire',
      detail: u.voyageurs.n > 0 ? pl(u.voyageurs.n, 'voyageur') : 'Aucun voyageur',
      at: u.voyageurs.last,
    },
    {
      key: 'contrats', title: 'Contrat signé',
      state: u.contrats.signes > 0 ? 'fait' : u.contrats.n > 0 ? 'en_cours' : 'a_faire',
      detail: u.contrats.n === 0 ? 'Aucun contrat'
        : `${pl(u.contrats.signes, 'signé')} sur ${pl(u.contrats.n, 'contrat')}`,
      at: u.contrats.last,
    },
    {
      key: 'paiements', title: 'Paiements en ligne',
      state: u.paiementsEnLigne === 'actif' ? 'fait' : u.paiementsEnLigne === 'commence' ? 'en_cours' : 'a_faire',
      detail: u.paiementsEnLigne === 'actif' ? 'Compte Stripe actif' : u.paiementsEnLigne === 'commence' ? 'Inscription Stripe pas terminée' : 'Pas activés',
      at: null,
    },
    {
      key: 'finances', title: 'Suivi des finances',
      state: finances > 0 ? 'fait' : 'a_faire',
      detail: finances > 0
        ? [u.revenus.n > 0 ? pl(u.revenus.n, 'revenu saisi', 'revenus saisis') : null, u.charges.n > 0 ? pl(u.charges.n, 'charge') : null].filter(Boolean).join(' · ')
        : 'Rien de saisi',
      at: latest(u.revenus.last, u.charges.last),
    },
  ]

  const done = steps.filter(s => s.state === 'fait').length
  const get = (k: JourneyStep['key']) => steps.find(s => s.key === k)!

  let blocage: Journey['blocage'] = null
  if (get('logement').state === 'a_faire') {
    blocage = { step: 'logement', message: 'Compte créé, mais aucun logement : rien ne peut démarrer.', conseil: 'Lui proposer de créer son logement en 2 minutes, c’est l’étape qui débloque tout le reste.' }
  } else if (get('calendrier').state === 'probleme') {
    blocage = { step: 'calendrier', message: 'La synchronisation d’un calendrier échoue : ses réservations ne remontent plus.', conseil: 'Revérifier le lien iCal ensemble (un lien régénéré sur Airbnb rend l’ancien invalide).' }
  } else if (get('calendrier').state === 'a_faire' && reservations === 0) {
    blocage = { step: 'calendrier', message: 'Logement créé, mais aucun calendrier connecté : l’app reste vide.', conseil: 'Lui montrer où copier le lien iCal d’Airbnb ou de Booking pour importer ses réservations.' }
  } else if (get('contrats').state === 'en_cours') {
    blocage = { step: 'contrats', message: 'Un contrat envoyé n’a pas encore été signé.', conseil: 'Vérifier ensemble que le voyageur a bien reçu le lien de signature.' }
  } else if (get('paiements').state === 'en_cours') {
    blocage = { step: 'paiements', message: 'Inscription Stripe commencée mais pas terminée.', conseil: 'Stripe attend souvent une pièce d’identité ou un IBAN : lui proposer de finir depuis Contrats & paiements.' }
  }

  const niveau: Journey['niveau'] = done === 0 ? 'Pas encore commencé' : done <= 2 ? 'Premiers pas' : done <= 4 ? 'En place' : 'Utilisation avancée'
  return { steps, done, blocage, niveau }
}

export interface FeedItem { label: string; at: string }

/** Dernière fois que chaque fonction a servi, de la plus récente à la plus ancienne */
export function hostFeed(u: HostUsage, extra: FeedItem[] = []): FeedItem[] {
  const items: Array<FeedItem | null> = [
    u.logements.last ? { label: 'Logement ajouté', at: u.logements.last } : null,
    u.calendriers.last ? { label: 'Calendrier connecté', at: u.calendriers.last } : null,
    u.sejours.last ? { label: 'Séjour enregistré', at: u.sejours.last } : null,
    u.voyageurs.last ? { label: 'Voyageur ajouté', at: u.voyageurs.last } : null,
    u.contrats.last ? { label: 'Contrat créé', at: u.contrats.last } : null,
    u.revenus.last ? { label: 'Revenu saisi', at: u.revenus.last } : null,
    u.charges.last ? { label: 'Charge saisie', at: u.charges.last } : null,
    u.evenements.last ? { label: 'Événement au calendrier', at: u.evenements.last } : null,
    u.declarations.last ? { label: 'Déclaration de voyageur', at: u.declarations.last } : null,
    ...extra,
  ]
  return items
    .filter((x): x is FeedItem => !!x && !Number.isNaN(Date.parse(x.at)))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
}
