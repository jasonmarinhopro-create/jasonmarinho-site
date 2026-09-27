// Calendrier de la caution par empreinte bancaire (sept. 2026).
//
// Stripe ne garde une carte bloquée qu'environ 7 jours (docs.stripe.com,
// « Place a hold on a payment method ») : passé ce délai, le blocage tombe
// tout seul. Avant, le lien de caution partait dès la signature : un voyageur
// qui signait un mois avant arrivait avec une caution déjà levée.
//
// Règle : le lien de caution ne s'ouvre que 2 jours avant l'arrivée (envoyé
// automatiquement ce jour-là par le cron quotidien) et se ferme après le
// départ. Fonctions pures, testées (deposit-window.test.ts).

export const DEPOSIT_OPEN_DAYS_BEFORE = 2
/** Durée habituelle d'un blocage de carte chez Stripe */
export const CARD_HOLD_DAYS = 7

export type DepositWindowState = 'not_yet' | 'open' | 'closed'

/** 'YYYY-MM-DD' du jour à Paris */
export function parisToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

/** Ajoute n jours à une date 'YYYY-MM-DD' (calcul en UTC, sans décalage horaire) */
export function addDaysIso(iso: string, n: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Jour d'ouverture du lien de caution */
export function depositOpensOn(dateArrivee: string): string {
  return addDaysIso(dateArrivee, -DEPOSIT_OPEN_DAYS_BEFORE)
}

/** Où en est le lien de caution aujourd'hui (heure de Paris) */
export function depositWindow(dateArrivee: string, dateDepart: string, now: Date = new Date()): DepositWindowState {
  const today = parisToday(now)
  if (today < depositOpensOn(dateArrivee)) return 'not_yet'
  if (today > dateDepart.slice(0, 10)) return 'closed'
  return 'open'
}

/**
 * Dernier jour sûr pour libérer ou encaisser la caution. Le blocage est posé
 * au plus tôt à l'ouverture du lien (J-2) et tient ~7 jours : il tombe au
 * plus tôt à J+5. On garde un jour de marge.
 */
export function depositActBefore(dateArrivee: string): string {
  return addDaysIso(depositOpensOn(dateArrivee), CARD_HOLD_DAYS - 1)
}

/**
 * Le blocage risque-t-il de tomber avant le départ ? Vrai pour les séjours de
 * plus de 4 nuits : il faut alors une caution par virement, ou accepter que
 * la carte soit débloquée avant l'état des lieux de sortie.
 */
export function holdMayExpireBeforeCheckout(dateArrivee: string, dateDepart: string): boolean {
  return dateDepart.slice(0, 10) > depositActBefore(dateArrivee)
}
