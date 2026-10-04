// Présentation des notifications (refonte 29/09/2026, demande de Jason : « la
// partie notification doit être 100 % revue »). Règles pures, testées :
//  - un seul fil pour les alertes de l'app (table `notifications`), les
//    réponses de Questions & réponses (`chez_nous_notifications`) et les
//    nouveautés de l'app (lib/constants/changelog.ts) ;
//  - un groupe par type, déduit du `type` : pas de migration de la
//    contrainte `category` de la table ;
//  - regroupement par jour à l'heure de Paris ;
//  - détection des réservations Airbnb / Booking / Vrbo nouvelles, modifiées
//    ou annulées entre deux synchronisations iCal.

import { icalReservationsForDisplay, type DisplayFeedRow } from '@/lib/ical/display'
import type { IcalEventRow, LogementIcalRow } from '@/lib/menage/ical-occupations'
import type { ChangelogEntry } from '@/lib/constants/changelog'
import type { AppNotification, NotificationSeverity } from './types'

export type NotifGroup = 'reservations' | 'paiements' | 'voyageurs' | 'menage' | 'compte' | 'questions' | 'nouveautes'

export const GROUP_ORDER: NotifGroup[] = ['reservations', 'paiements', 'voyageurs', 'menage', 'compte', 'questions', 'nouveautes']

export const GROUP_META: Record<NotifGroup, { label: string; color: string }> = {
  reservations: { label: 'Réservations', color: 'var(--accent-text)' },
  paiements:    { label: 'Contrats & paiements', color: '#B7791F' },
  voyageurs:    { label: 'Voyageurs', color: '#2F7D52' },
  menage:       { label: 'Ménage', color: '#B83A7C' },
  compte:       { label: 'Compte & réglages', color: '#6E5446' },
  questions:    { label: 'Questions & réponses', color: '#9A5B13' },
  nouveautes:   { label: 'Nouveautés de l\'app', color: 'var(--accent-text)' },
}

const TYPE_GROUP: Array<[RegExp, NotifGroup]> = [
  [/^(arrivee|depart|ical_|nouvelle_resa|resa_)/, 'reservations'],
  [/^(contrat_|loyer_|caution_|deposit_|paiement_|devis_)/, 'paiements'],
  [/^(checkin_|declaration_|voyageur_)/, 'voyageurs'],
  [/^menage_/, 'menage'],
  [/^(plafond_|stripe_|sync_|fiscal_)/, 'compte'],
]

/** Groupe d'une alerte de l'app, d'après son type (puis sa catégorie) */
export function groupOf(type: string, category?: string | null): NotifGroup {
  for (const [re, g] of TYPE_GROUP) if (re.test(type)) return g
  if (category === 'chez_nous') return 'questions'
  if (category === 'fiscal' || category === 'sync' || category === 'system') return 'compte'
  if (category === 'guide') return 'nouveautes'
  return 'reservations'
}

/** Nombre de nouveautés de l'app montrées dans le fil (et comptées dans le badge) */
export const CHANGELOG_IN_FEED = 3

export type FeedSource = 'app' | 'qr' | 'changelog'

export interface FeedItem {
  /** Unique dans le fil : `<source>:<id>` */
  key: string
  source: FeedSource
  id: string
  group: NotifGroup
  title: string
  body: string | null
  href: string | null
  ctaLabel: string | null
  severity: NotificationSeverity
  createdAt: string
  read: boolean
}

export function fromAppNotification(n: AppNotification): FeedItem {
  return {
    key: `app:${n.id}`, source: 'app', id: n.id,
    group: groupOf(n.type, n.category),
    title: cleanText(n.title) ?? '',
    body: cleanText(n.body),
    href: n.cta_href, ctaLabel: n.cta_label,
    severity: n.severity, createdAt: n.created_at, read: !!n.read_at,
  }
}

export interface ForumNotifRow {
  id: string
  type: string
  post_id: string | null
  read_at: string | null
  created_at: string
  actor_id: string | null
}

/** Réponse, mention, réponse retenue ou nouvelle question dans Questions & réponses */
export function fromForumNotification(n: ForumNotifRow, postTitle: string | null, actorName: string | null): FeedItem {
  const who = actorName?.trim() || 'Un hôte'
  const title =
    n.type === 'mention' ? `${who} t'a cité dans une discussion`
    : n.type === 'accepted' ? 'Ta réponse a été retenue'
    : n.type === 'new_post' ? `Nouvelle question de ${who}`
    : `${who} a répondu`
  return {
    key: `qr:${n.id}`, source: 'qr', id: n.id, group: 'questions',
    title,
    body: postTitle ? `« ${postTitle} »` : null,
    href: n.post_id ? `/dashboard/chez-nous/${n.post_id}` : '/dashboard/entre-hotes/forum',
    ctaLabel: 'Voir la discussion',
    severity: n.type === 'accepted' ? 'success' : 'info',
    createdAt: n.created_at, read: !!n.read_at,
  }
}

/** Nouveautés de l'app : non lues si publiées après la dernière visite du fil */
export function fromChangelog(entries: ChangelogEntry[], lastSeenIso: string | null, limit = 3): FeedItem[] {
  return entries.slice(0, limit).map(e => ({
    key: `changelog:${e.id}`, source: 'changelog' as const, id: e.id, group: 'nouveautes' as const,
    title: cleanText(e.title) ?? '', body: cleanText(e.description),
    href: '/dashboard/nouveautes', ctaLabel: 'Voir les nouveautés',
    severity: 'info' as const,
    // Midi à Paris : une nouveauté du jour ne passe pas avant les alertes du matin
    createdAt: `${e.date}T10:00:00Z`,
    read: !!lastSeenIso && e.date <= lastSeenIso.slice(0, 10),
  }))
}

/** Plus récent d'abord ; à date égale, non lu d'abord */
export function sortFeed(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => (b.createdAt.localeCompare(a.createdAt)) || (Number(a.read) - Number(b.read)))
}

/** Les anciennes alertes portaient des emojis et des tirets cadratins : on les retire à l'affichage */
export function cleanText(s: string | null | undefined): string | null {
  if (s == null) return null
  const out = s
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/\s+—\s+/g, ' : ')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return out || null
}

// ─── Jours (heure de Paris) ──────────────────────────────────────────────

export function parisDay(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
}

function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / 86_400_000)
}

export type DayBucket = 'today' | 'yesterday' | 'week' | 'older'
export const BUCKET_LABEL: Record<DayBucket, string> = {
  today: 'Aujourd\'hui', yesterday: 'Hier', week: 'Cette semaine', older: 'Plus ancien',
}

export function dayBucket(iso: string, today: string): DayBucket {
  const d = dayDiff(today, parisDay(iso))
  if (d <= 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 7) return 'week'
  return 'older'
}

/** Fil découpé en sections Aujourd'hui / Hier / Cette semaine / Plus ancien (vides retirées) */
export function bucketize(items: FeedItem[], today: string): Array<{ bucket: DayBucket; items: FeedItem[] }> {
  const order: DayBucket[] = ['today', 'yesterday', 'week', 'older']
  const map = new Map<DayBucket, FeedItem[]>()
  for (const it of items) {
    const b = dayBucket(it.createdAt, today)
    map.set(b, [...(map.get(b) ?? []), it])
  }
  return order.filter(b => map.has(b)).map(b => ({ bucket: b, items: map.get(b)! }))
}

export function countByGroup(items: FeedItem[], onlyUnread = true): Record<NotifGroup, number> {
  const out = Object.fromEntries(GROUP_ORDER.map(g => [g, 0])) as Record<NotifGroup, number>
  for (const it of items) if (!onlyUnread || !it.read) out[it.group] += 1
  return out
}

// ─── Réservations iCal : nouvelles, modifiées, annulées ──────────────────

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

export function shortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${d} ${MOIS[m - 1]}`
}

export function stayLabel(arrivee: string, depart: string): string {
  const nuits = Math.max(1, dayDiff(depart, arrivee))
  return `du ${shortDate(arrivee)} au ${shortDate(depart)} (${nuits} nuit${nuits > 1 ? 's' : ''})`
}

export interface IcalChange {
  kind: 'nouvelle' | 'modifiee' | 'annulee'
  uid: string
  platform: 'airbnb' | 'booking' | 'vrbo' | null
  logementName: string | null
  dateArrivee: string
  dateDepart: string
  /** Pour une modification : anciennes dates */
  avant?: { dateArrivee: string; dateDepart: string }
}

type UidEvent = Omit<IcalEventRow, 'id'> & { uid: string }

/**
 * Compare le contenu d'un flux avant et après une synchronisation.
 * - Première synchronisation (rien avant) : aucune alerte, sinon l'hôte
 *   recevrait une notification par réservation déjà connue.
 * - Seules les vraies réservations comptent (mêmes règles que Mes
 *   réservations : blocages ignorés, « CLOSED » Booking de 30 nuits ou moins
 *   gardés) et seulement celles qui ne sont pas encore parties : un séjour
 *   passé qui sort du flux n'est pas une annulation.
 */
export function diffIcalReservations(input: {
  before: UidEvent[]
  after: UidEvent[]
  feed: DisplayFeedRow
  logements: LogementIcalRow[]
  today: string
}): IcalChange[] {
  if (input.before.length === 0) return []
  const toResa = (rows: UidEvent[]) => {
    const resas = icalReservationsForDisplay(input.logements, [input.feed], rows.map(r => ({ ...r, id: r.uid, feed_id: input.feed.id })))
    return new Map(resas.map(r => [r.id, r]))
  }
  const before = toResa(input.before)
  const after = toResa(input.after)
  const out: IcalChange[] = []
  for (const [uid, r] of after) {
    if (r.dateDepart <= input.today) continue
    const old = before.get(uid)
    const base = { uid, platform: r.platform, logementName: r.logementName, dateArrivee: r.dateArrivee, dateDepart: r.dateDepart }
    if (!old) out.push({ kind: 'nouvelle', ...base })
    else if (old.dateArrivee !== r.dateArrivee || old.dateDepart !== r.dateDepart) {
      out.push({ kind: 'modifiee', ...base, avant: { dateArrivee: old.dateArrivee, dateDepart: old.dateDepart } })
    }
  }
  for (const [uid, r] of before) {
    if (after.has(uid) || r.dateArrivee < input.today) continue
    out.push({ kind: 'annulee', uid, platform: r.platform, logementName: r.logementName, dateArrivee: r.dateArrivee, dateDepart: r.dateDepart })
  }
  return out
}

const PLATFORM_NAME = { airbnb: 'Airbnb', booking: 'Booking', vrbo: 'Vrbo' } as const

/** Texte de la notification d'une réservation iCal nouvelle, modifiée ou annulée */
export function icalChangeText(c: IcalChange): { type: string; title: string; body: string; severity: NotificationSeverity } {
  const src = c.platform ? PLATFORM_NAME[c.platform] : 'synchronisée'
  const where = c.logementName ? `${c.logementName}, ` : ''
  if (c.kind === 'nouvelle') {
    return {
      type: 'ical_nouvelle',
      title: `Nouvelle réservation ${src}`,
      body: `${where}${stayLabel(c.dateArrivee, c.dateDepart)}. Ajoute le voyageur pour préparer son arrivée et sa déclaration.`,
      severity: 'success',
    }
  }
  if (c.kind === 'modifiee') {
    return {
      type: 'ical_modifiee',
      title: `Réservation ${src} modifiée`,
      body: `${where}maintenant ${stayLabel(c.dateArrivee, c.dateDepart)}, au lieu du ${shortDate(c.avant!.dateArrivee)} au ${shortDate(c.avant!.dateDepart)}. Le planning ménage suit.`,
      severity: 'info',
    }
  }
  return {
    type: 'ical_annulee',
    title: `Réservation ${src} annulée`,
    body: `${where}${stayLabel(c.dateArrivee, c.dateDepart)} n'apparaît plus sur ${src === 'synchronisée' ? 'la plateforme' : src}. Le ménage prévu est retiré du planning.`,
    severity: 'warning',
  }
}
