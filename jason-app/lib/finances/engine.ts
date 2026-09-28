// Moteur de calcul de « Mes finances » (sept. 2026). Une seule définition par
// chiffre, partagée par Revenus, Journal, Performances et Fiscalité :
//
// - Un séjour compte à sa DATE D'ARRIVÉE (Airbnb verse ~24 h après l'arrivée),
//   une saisie manuelle à sa date de paiement.
// - « Revenus » = lignes datées jusqu'à aujourd'hui ; « À venir » = séjours
//   réservés dont l'arrivée est après aujourd'hui, toujours affichés à part.
// - Bénéfice = revenus − commissions des plateformes − charges (hors
//   investissements amortis, qui ne servent qu'à la fiscalité).
// - Une caution n'est jamais un revenu.
// - Occupation : nuits réservées (séjours + réservations importées par iCal,
//   même sans montant) / nuits disponibles.
//
// Avant cette refonte, Revenus et Performances calculaient chacun leurs
// chiffres (date de paiement d'un côté, date d'arrivée de l'autre, périmètres
// différents) : le même mois affichait deux montants.

import { sejoursSansContrat } from './dedup'

export type Canal = 'airbnb' | 'booking' | 'vrbo' | 'driing' | 'direct' | 'autre'

export const CANAL_LABEL: Record<Canal, string> = {
  airbnb: 'Airbnb',
  booking: 'Booking.com',
  vrbo: 'Vrbo / Abritel',
  driing: 'Driing',
  direct: 'En direct',
  autre: 'Autre',
}

/** Canaux sans commission de plateforme */
export const CANAUX_DIRECTS: Canal[] = ['direct', 'driing']

export function canalOf(raw: string | null | undefined): Canal {
  if (!raw) return 'direct'
  const s = String(raw).toLowerCase()
  if (s.includes('airbnb')) return 'airbnb'
  if (s.includes('booking')) return 'booking'
  if (s.includes('vrbo') || s.includes('abritel') || s.includes('homeaway')) return 'vrbo'
  if (s.includes('driing')) return 'driing'
  if (s === 'direct' || s.includes('direct')) return 'direct'
  return 'autre'
}

// ─── Dates (AAAA-MM-JJ, calculs en UTC sans décalage horaire) ──────────────

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b.slice(0, 10)}T00:00:00Z`) - Date.parse(`${a.slice(0, 10)}T00:00:00Z`)) / 86_400_000)
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

function lastDayOfMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)
}

function shiftMonth(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return d.toISOString().slice(0, 7)
}

// ─── Périodes ──────────────────────────────────────────────────────────────

export type PeriodKey = 'mois' | '3mois' | 'annee' | '12mois' | 'annee-1'

export const PERIOD_KEYS: PeriodKey[] = ['mois', '3mois', 'annee', '12mois', 'annee-1']

export interface Period {
  key: PeriodKey
  start: string
  end: string
  /** « en 2026 », « ce mois-ci »… pour composer des phrases */
  label: string
  /** Libellé court du bouton */
  short: string
}

export function parsePeriod(raw: string | null | undefined): PeriodKey {
  return PERIOD_KEYS.includes(raw as PeriodKey) ? (raw as PeriodKey) : 'annee'
}

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const MOIS_COURT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

export function monthLabel(ym: string, court = false): string {
  const [y, m] = ym.split('-').map(Number)
  return court ? MOIS_COURT[m - 1] : `${MOIS[m - 1]} ${y}`
}

export function periodOf(key: PeriodKey, today: string): Period {
  const ym = monthKey(today)
  const year = Number(today.slice(0, 4))
  switch (key) {
    case 'mois':
      return { key, start: `${ym}-01`, end: lastDayOfMonth(ym), label: 'ce mois-ci', short: 'Ce mois' }
    case '3mois': {
      const from = shiftMonth(ym, -2)
      return { key, start: `${from}-01`, end: lastDayOfMonth(ym), label: 'sur les 3 derniers mois', short: '3 mois' }
    }
    case '12mois': {
      const from = shiftMonth(ym, -11)
      return { key, start: `${from}-01`, end: lastDayOfMonth(ym), label: 'sur les 12 derniers mois', short: '12 mois' }
    }
    case 'annee-1':
      return { key, start: `${year - 1}-01-01`, end: `${year - 1}-12-31`, label: `en ${year - 1}`, short: String(year - 1) }
    case 'annee':
    default:
      return { key: 'annee', start: `${year}-01-01`, end: `${year}-12-31`, label: `en ${year}`, short: String(year) }
  }
}

/** Même période un an plus tôt (comparaison N-1) */
export function previousYearPeriod(p: Period): Period {
  const shift = (iso: string) => `${Number(iso.slice(0, 4)) - 1}${iso.slice(4)}`
  const end = p.end.endsWith('02-29') ? `${Number(p.end.slice(0, 4)) - 1}-02-28` : shift(p.end)
  return { ...p, start: shift(p.start), end, label: `un an plus tôt`, short: 'N-1' }
}

export function monthsOf(p: Period): string[] {
  const out: string[] = []
  let ym = monthKey(p.start)
  const last = monthKey(p.end)
  while (ym <= last && out.length < 36) { out.push(ym); ym = shiftMonth(ym, 1) }
  return out
}

// ─── Lignes ─────────────────────────────────────────────────────────────────

export interface LogementFin {
  id: string
  nom: string
  pays: string | null
  ville: string | null
  typeLogement: string | null
  classementEtoiles: number | null
  objectif: number | null
}

export type LineKind = 'sejour' | 'contrat' | 'saisie'
export type LineStatut = 'encaisse' | 'a_encaisser' | 'a_venir'

export interface RevenueLine {
  /** 'sejour:<id>' | 'contract:<id>' | '<id>' (saisie) */
  id: string
  kind: LineKind
  sourceId: string
  logementNom: string
  logementId: string | null
  /** Date d'attribution : arrivée (séjour, contrat) ou paiement (saisie) */
  date: string
  dateDepart: string | null
  nuits: number | null
  brut: number
  /** null = inconnue (séjour de plateforme sans commission saisie) */
  commission: number | null
  canal: Canal
  statut: LineStatut
  aDeclarer: boolean
  /** Caution : affichée dans le journal, jamais comptée dans les revenus */
  horsRevenus: boolean
  label: string
  detail: string | null
  /** Pour les liens : fiche voyageur, contrat */
  voyageurId: string | null
  createdAt: string | null
}

export interface ChargeLine {
  id: string
  logementNom: string
  logementId: string | null
  date: string
  montant: number
  categorie: string
  deductible: boolean
  /** Investissement amorti (catégorie amortissement) : durée en années */
  dureeAmortissement: number | null
  description: string | null
}

export interface OccupationStay {
  logementNom: string
  logementId: string | null
  arrivee: string
  /** Jour du départ (dernière nuit + 1) */
  depart: string
  canal: Canal
  /** true si la réservation a un montant (séjour ou contrat) */
  avecMontant: boolean
  createdAt: string | null
}

export interface SejourIn {
  id: string
  voyageur_id?: string | null
  logement: string | null
  date_arrivee: string | null
  date_depart: string | null
  montant: number | null
  commission_montant?: number | null
  contrat_plateforme?: string | null
  a_declarer?: boolean | null
  created_at?: string | null
  voyageur_nom?: string | null
  voyageur_source?: string | null
}

export interface ContractIn {
  id: string
  sejour_id?: string | null
  statut: string | null
  montant_loyer: number | null
  date_arrivee: string | null
  date_depart: string | null
  logement_nom: string | null
  logement_id: string | null
  locataire_prenom?: string | null
  locataire_nom?: string | null
  stripe_payment_enabled?: boolean | null
  stripe_payment_status?: string | null
  created_at?: string | null
}

export interface EntryIn {
  id: string
  logement_nom: string | null
  montant: number | null
  date_paiement: string | null
  mode_paiement?: string | null
  type_paiement?: string | null
  description?: string | null
  a_declarer?: boolean | null
}

export interface ChargeIn {
  id: string
  logement_nom: string | null
  logement_id?: string | null
  montant: number | null
  date_charge: string | null
  categorie: string | null
  description?: string | null
  deductible?: boolean | null
  duree_amortissement_annees?: number | null
}

export interface IcalIn {
  id: string
  logementName: string | null
  dateArrivee: string
  dateDepart: string
  platform: 'airbnb' | 'booking' | 'vrbo' | null
}

const MODE_LABEL: Record<string, string> = {
  virement: 'Virement', especes: 'Espèces', cheque: 'Chèque', stripe: 'Carte (Stripe)', autre: 'Autre',
}

export function normName(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase()
}

/**
 * Normalise toutes les sources d'argent en lignes. Un séjour relié à un
 * contrat SIGNÉ n'est compté qu'une fois (la ligne du contrat, qui porte le
 * paiement). Un contrat pas encore signé n'est pas un revenu.
 */
export function buildRevenueLines(input: {
  sejours: SejourIn[]
  contracts: ContractIn[]
  entries: EntryIn[]
  today: string
}): RevenueLine[] {
  const { today } = input
  const signed = input.contracts.filter(c => c.statut === 'signe')
  const out: RevenueLine[] = []

  for (const s of sejoursSansContrat(input.sejours, signed)) {
    if (!s.date_arrivee || !(Number(s.montant) > 0)) continue
    const canal = canalOf(s.contrat_plateforme ?? s.voyageur_source)
    const nuits = s.date_depart ? Math.max(0, daysBetween(s.date_arrivee, s.date_depart)) : null
    const commission = CANAUX_DIRECTS.includes(canal)
      ? 0
      : (s.commission_montant != null ? Number(s.commission_montant) : null)
    out.push({
      id: `sejour:${s.id}`,
      kind: 'sejour',
      sourceId: s.id,
      logementNom: (s.logement ?? '').trim(),
      logementId: null,
      date: s.date_arrivee,
      dateDepart: s.date_depart,
      nuits,
      brut: Number(s.montant),
      commission,
      canal,
      statut: s.date_arrivee > today ? 'a_venir' : 'encaisse',
      aDeclarer: s.a_declarer ?? true,
      horsRevenus: false,
      label: s.voyageur_nom?.trim() || `Séjour ${CANAL_LABEL[canal]}`,
      detail: nuits != null ? `${nuits} nuit${nuits > 1 ? 's' : ''}` : null,
      voyageurId: s.voyageur_id ?? null,
      createdAt: s.created_at ?? null,
    })
  }

  for (const c of signed) {
    if (!c.date_arrivee || !(Number(c.montant_loyer) > 0)) continue
    const nuits = c.date_depart ? Math.max(0, daysBetween(c.date_arrivee, c.date_depart)) : null
    const paid = c.stripe_payment_status === 'paid'
    const statut: LineStatut = c.date_arrivee > today
      ? 'a_venir'
      : (c.stripe_payment_enabled && !paid ? 'a_encaisser' : 'encaisse')
    const nom = [c.locataire_prenom, c.locataire_nom].filter(Boolean).join(' ').trim()
    out.push({
      id: `contract:${c.id}`,
      kind: 'contrat',
      sourceId: c.id,
      logementNom: (c.logement_nom ?? '').trim(),
      logementId: c.logement_id ?? null,
      date: c.date_arrivee,
      dateDepart: c.date_depart,
      nuits,
      brut: Number(c.montant_loyer),
      commission: 0,
      canal: 'direct',
      statut,
      aDeclarer: true,
      horsRevenus: false,
      label: nom || 'Réservation directe',
      detail: [nuits != null ? `${nuits} nuit${nuits > 1 ? 's' : ''}` : null, c.stripe_payment_enabled ? (paid ? 'payé en ligne' : 'paiement en ligne attendu') : 'contrat signé'].filter(Boolean).join(' · '),
      voyageurId: null,
      createdAt: c.created_at ?? null,
    })
  }

  for (const e of input.entries) {
    if (!e.date_paiement || !(Number(e.montant) > 0)) continue
    const caution = e.type_paiement === 'caution'
    const text = `${e.description ?? ''} ${e.mode_paiement ?? ''}`
    const canal = /airbnb|booking|vrbo|abritel|driing/i.test(text) ? canalOf(text) : 'autre'
    out.push({
      id: e.id,
      kind: 'saisie',
      sourceId: e.id,
      logementNom: (e.logement_nom ?? '').trim(),
      logementId: null,
      date: e.date_paiement,
      dateDepart: null,
      nuits: null,
      brut: Number(e.montant),
      // Une saisie manuelle est le montant reçu : pas de commission à déduire
      commission: 0,
      canal,
      statut: e.date_paiement > today ? 'a_venir' : 'encaisse',
      aDeclarer: e.a_declarer ?? true,
      horsRevenus: caution,
      label: e.description?.trim() || (caution ? 'Caution' : 'Paiement saisi'),
      detail: [caution ? 'Caution, hors revenus' : null, e.mode_paiement ? MODE_LABEL[e.mode_paiement] ?? e.mode_paiement : null].filter(Boolean).join(' · ') || null,
      voyageurId: null,
      createdAt: null,
    })
  }

  return out.sort((a, b) => b.date.localeCompare(a.date))
}

export function buildChargeLines(charges: ChargeIn[]): ChargeLine[] {
  return charges
    .filter(c => c.date_charge && Number(c.montant) > 0)
    .map(c => ({
      id: c.id,
      logementNom: (c.logement_nom ?? '').trim(),
      logementId: c.logement_id ?? null,
      date: c.date_charge as string,
      montant: Number(c.montant),
      categorie: c.categorie ?? 'autre',
      deductible: c.deductible ?? true,
      dureeAmortissement: c.categorie === 'amortissement' ? (c.duree_amortissement_annees ?? null) : null,
      description: c.description ?? null,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

/**
 * Séjours pour l'occupation : réservations avec montant (séjours, contrats
 * signés) + réservations importées par iCal qui ne sont pas déjà saisies
 * (même logement, même arrivée).
 */
export function buildOccupation(lines: RevenueLine[], ical: IcalIn[]): OccupationStay[] {
  const stays: OccupationStay[] = lines
    .filter(l => (l.kind === 'sejour' || l.kind === 'contrat') && l.dateDepart && (l.nuits ?? 0) > 0)
    .map(l => ({
      logementNom: l.logementNom, logementId: l.logementId, arrivee: l.date, depart: l.dateDepart as string,
      canal: l.canal, avecMontant: true, createdAt: l.createdAt,
    }))
  const covered = new Set(stays.map(s => `${normName(s.logementNom)}|${s.arrivee}`))
  for (const r of ical) {
    const key = `${normName(r.logementName)}|${r.dateArrivee}`
    if (covered.has(key)) continue
    covered.add(key)
    stays.push({
      logementNom: (r.logementName ?? '').trim(), logementId: null, arrivee: r.dateArrivee, depart: r.dateDepart,
      canal: r.platform ?? 'autre', avecMontant: false, createdAt: null,
    })
  }
  return stays
}

// ─── Portée : un logement ou tous ──────────────────────────────────────────

export interface Scope {
  /** null = tous les logements */
  logement: { id: string | null; nom: string } | null
}

export function inScope(row: { logementId: string | null; logementNom: string }, scope: Scope): boolean {
  if (!scope.logement) return true
  if (row.logementId && scope.logement.id && row.logementId === scope.logement.id) return true
  return normName(row.logementNom) === normName(scope.logement.nom)
}

// ─── Agrégats ───────────────────────────────────────────────────────────────

export interface Totaux {
  /** Revenus passés (date ≤ aujourd'hui), hors cautions */
  revenus: number
  /** Dont paiement en ligne encore attendu */
  aEncaisser: number
  /** Réservé, arrivée après aujourd'hui */
  aVenir: number
  commissions: number
  /** Séjours de plateforme sans commission renseignée (revenus sous-estimés côté commissions) */
  sansCommission: number
  charges: number
  benefice: number
  nbSejours: number
  /** Réservations importées sans montant sur la période (revenus incomplets) */
  sansMontant: number
}

export function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end
}

export function totaux(lines: RevenueLine[], charges: ChargeLine[], occupation: OccupationStay[], start: string, end: string, today: string): Totaux {
  const realEnd = end < today ? end : today
  let revenus = 0, aEncaisser = 0, aVenir = 0, commissions = 0, sansCommission = 0, nbSejours = 0
  for (const l of lines) {
    if (l.horsRevenus || !inRange(l.date, start, end)) continue
    if (l.date > today) { aVenir += l.brut; continue }
    revenus += l.brut
    if (l.statut === 'a_encaisser') aEncaisser += l.brut
    if (l.commission == null) sansCommission += 1
    else commissions += l.commission
    if (l.kind !== 'saisie') nbSejours += 1
  }
  let ch = 0
  for (const c of charges) {
    if (c.dureeAmortissement != null || c.categorie === 'amortissement') continue
    if (!inRange(c.date, start, realEnd)) continue
    // Une commission saisie en charge reste une commission
    if (c.categorie === 'commissions_plateforme') commissions += c.montant
    else ch += c.montant
  }
  const sansMontant = occupation.filter(o => !o.avecMontant && inRange(o.arrivee, start, realEnd)).length
  return {
    revenus: round2(revenus), aEncaisser: round2(aEncaisser), aVenir: round2(aVenir),
    commissions: round2(commissions), sansCommission, charges: round2(ch),
    benefice: round2(revenus - commissions - ch), nbSejours, sansMontant,
  }
}

export interface MoisPoint {
  mois: string
  revenus: number
  aVenir: number
  charges: number
  commissions: number
  benefice: number
}

export function serieMensuelle(lines: RevenueLine[], charges: ChargeLine[], months: string[], today: string): MoisPoint[] {
  const map = new Map(months.map(m => [m, { mois: m, revenus: 0, aVenir: 0, charges: 0, commissions: 0, benefice: 0 }]))
  for (const l of lines) {
    if (l.horsRevenus) continue
    const p = map.get(monthKey(l.date))
    if (!p) continue
    if (l.date > today) p.aVenir += l.brut
    else { p.revenus += l.brut; p.commissions += l.commission ?? 0 }
  }
  for (const c of charges) {
    if (c.dureeAmortissement != null || c.categorie === 'amortissement' || c.date > today) continue
    const p = map.get(monthKey(c.date))
    if (!p) continue
    if (c.categorie === 'commissions_plateforme') p.commissions += c.montant
    else p.charges += c.montant
  }
  return [...map.values()].map(p => ({
    ...p,
    revenus: round2(p.revenus), aVenir: round2(p.aVenir), charges: round2(p.charges), commissions: round2(p.commissions),
    benefice: round2(p.revenus - p.commissions - p.charges),
  }))
}

export interface CanalStat {
  canal: Canal
  brut: number
  commission: number
  /** Séjours sans commission connue */
  sansCommission: number
  net: number
  nbSejours: number
  nuits: number
}

export function parCanal(lines: RevenueLine[], start: string, end: string, today: string): CanalStat[] {
  const realEnd = end < today ? end : today
  const map = new Map<Canal, CanalStat>()
  for (const l of lines) {
    if (l.horsRevenus || !inRange(l.date, start, realEnd)) continue
    const s = map.get(l.canal) ?? { canal: l.canal, brut: 0, commission: 0, sansCommission: 0, net: 0, nbSejours: 0, nuits: 0 }
    s.brut += l.brut
    if (l.commission == null) s.sansCommission += 1
    else s.commission += l.commission
    if (l.kind !== 'saisie') s.nbSejours += 1
    s.nuits += l.nuits ?? 0
    map.set(l.canal, s)
  }
  return [...map.values()]
    .map(s => ({ ...s, brut: round2(s.brut), commission: round2(s.commission), net: round2(s.brut - s.commission) }))
    .sort((a, b) => b.brut - a.brut)
}

// ─── Occupation et indicateurs hôteliers ───────────────────────────────────

export interface PerfStats {
  /** Nuits disponibles (jours de la période jusqu'à aujourd'hui × logements) */
  nuitsDispo: number
  nuitsReservees: number
  /** 0..1 */
  occupation: number
  /** Prix moyen par nuit sur les séjours avec montant */
  adr: number
  /** Revenu par nuit disponible = ADR × occupation */
  revpar: number
  nbSejours: number
  dureeMoyenne: number
  /** Délai moyen entre la réservation et l'arrivée (jours), si connu */
  delaiMoyen: number | null
}

/** Nuits d'un séjour comprises dans [start, end] (bornes incluses) */
export function nuitsDans(arrivee: string, depart: string, start: string, end: string): number {
  const from = arrivee > start ? arrivee : start
  const lastNight = addDays(depart, -1)
  const to = lastNight < end ? lastNight : end
  return from > to ? 0 : daysBetween(from, to) + 1
}

export function perfStats(
  lines: RevenueLine[], occupation: OccupationStay[], nbLogements: number,
  start: string, end: string, today: string,
): PerfStats {
  const realEnd = end < today ? end : today
  const jours = realEnd < start ? 0 : daysBetween(start, realEnd) + 1
  const nuitsDispo = jours * Math.max(1, nbLogements)
  let nuitsReservees = 0, nbSejours = 0, dureeTot = 0, delaiTot = 0, delaiN = 0
  for (const o of occupation) {
    const n = nuitsDans(o.arrivee, o.depart, start, realEnd)
    if (n <= 0) continue
    nuitsReservees += n
    if (inRange(o.arrivee, start, realEnd)) {
      nbSejours += 1
      dureeTot += daysBetween(o.arrivee, o.depart)
      if (o.createdAt) {
        const d = daysBetween(o.createdAt.slice(0, 10), o.arrivee)
        if (d >= 0 && d < 730) { delaiTot += d; delaiN += 1 }
      }
    }
  }
  // ADR : revenus des séjours avec nuits connues, arrivés dans la période
  let rev = 0, nuitsPayees = 0
  for (const l of lines) {
    if (l.kind === 'saisie' || l.horsRevenus || !l.nuits || !inRange(l.date, start, realEnd)) continue
    rev += l.brut
    nuitsPayees += l.nuits
  }
  const occ = nuitsDispo > 0 ? Math.min(1, nuitsReservees / nuitsDispo) : 0
  const adr = nuitsPayees > 0 ? rev / nuitsPayees : 0
  return {
    nuitsDispo, nuitsReservees, occupation: occ,
    adr: round2(adr), revpar: round2(adr * occ),
    nbSejours, dureeMoyenne: nbSejours > 0 ? Math.round((dureeTot / nbSejours) * 10) / 10 : 0,
    delaiMoyen: delaiN > 0 ? Math.round(delaiTot / delaiN) : null,
  }
}

/** Taux d'occupation par mois (nuits réservées / jours du mois, jusqu'à aujourd'hui) */
export function occupationMensuelle(occupation: OccupationStay[], months: string[], nbLogements: number, today: string): Array<{ mois: string; occupation: number | null }> {
  return months.map(ym => {
    const start = `${ym}-01`
    const end = lastDayOfMonth(ym)
    if (start > today) return { mois: ym, occupation: null }
    const realEnd = end < today ? end : today
    const dispo = (daysBetween(start, realEnd) + 1) * Math.max(1, nbLogements)
    const nuits = occupation.reduce((n, o) => n + nuitsDans(o.arrivee, o.depart, start, realEnd), 0)
    return { mois: ym, occupation: dispo > 0 ? Math.min(1, nuits / dispo) : 0 }
  })
}

/** Part des nuits déjà réservées sur les N prochains jours (à partir de demain) */
export function remplissageAVenir(occupation: OccupationStay[], jours: number, nbLogements: number, today: string): number {
  const start = addDays(today, 1)
  const end = addDays(today, jours)
  const nuits = occupation.reduce((n, o) => n + nuitsDans(o.arrivee, o.depart, start, end), 0)
  return Math.min(1, nuits / (jours * Math.max(1, nbLogements)))
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Nuits réservées par jour de la semaine (0 = lundi … 6 = dimanche) sur la période, jusqu'à aujourd'hui */
export function nuitsParJour(occupation: OccupationStay[], start: string, end: string, today: string): number[] {
  const realEnd = end < today ? end : today
  const out = [0, 0, 0, 0, 0, 0, 0]
  for (const o of occupation) {
    let d = o.arrivee > start ? o.arrivee : start
    const last = addDays(o.depart, -1)
    const stop = last < realEnd ? last : realEnd
    let guard = 0
    while (d <= stop && guard < 400) {
      const dow = (new Date(`${d}T12:00:00Z`).getUTCDay() + 6) % 7
      out[dow] += 1
      d = addDays(d, 1)
      guard += 1
    }
  }
  return out
}
