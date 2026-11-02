// Import des exports CSV d'Airbnb (Recettes) et de Booking.com (Réservations)
// dans les finances. Règles pures, testées dans csv-import.test.ts.
//
// 02/11/2026 (une hôte : « message d'erreur à cause d'une date ») : l'export
// Airbnb en français garde des dates à l'américaine (10/31/2026 = mois/jour).
// L'ancien import les lisait en jour/mois (« 2026-31-10 », refusé par la
// base). Le format des dates est maintenant déduit du fichier entier.
// Autres règles :
// - un séjour Airbnb = ses lignes « Réservation » et « Régularisation » d'un
//   même code de confirmation ; les lignes « Payout » (versements) ne sont
//   que les virements des mêmes montants : ignorées ;
// - la recette d'un séjour est le montant BRUT (avant les frais de service
//   d'Airbnb) : c'est lui qui se déclare. Les frais d'Airbnb deviennent une
//   charge « Commission de plateforme » ;
// - les régularisations (remboursement via le centre de résolution…) se
//   déduisent du brut du séjour qu'elles concernent.

export type Platform = 'airbnb' | 'booking' | 'unknown'
export type DateOrder = 'dmy' | 'mdy'

export interface ImportStay {
  /** Code de confirmation (Airbnb) ou numéro de réservation (Booking) */
  code: string
  /** Date retenue pour la recette (AAAA-MM-JJ) : date de la transaction Airbnb, arrivée chez Booking */
  date: string
  arrivee: string | null
  depart: string | null
  nuits: number | null
  logement: string
  voyageur: string
  /** Recette brute, régularisations déduites */
  brut: number
  /** Frais ou commission de la plateforme */
  frais: number
  /** Ce que la plateforme a versé */
  verse: number
  /** Total des régularisations (négatif) */
  regularisation: number
}

export interface ImportProblem {
  ligne: number
  raison: string
}

export interface ImportResult {
  platform: Platform
  dateOrder: DateOrder
  stays: ImportStay[]
  payouts: number
  cancelled: number
  /** Régularisations sans séjour correspondant dans le fichier : pas importées, montrées */
  orphanAdjustments: Array<{ code: string; montant: number; date: string | null }>
  problems: ImportProblem[]
}

// ── Lecture du CSV ───────────────────────────────────────────────────────────

function detectDelimiter(firstLine: string): string {
  const semis = (firstLine.match(/;/g) ?? []).length
  const commas = (firstLine.match(/,/g) ?? []).length
  const tabs = (firstLine.match(/\t/g) ?? []).length
  if (tabs > semis && tabs > commas) return '\t'
  return semis > commas ? ';' : ','
}

export function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
  const firstLineEnd = text.indexOf('\n')
  const delim = detectDelimiter(firstLineEnd === -1 ? text : text.slice(0, firstLineEnd))
  const rowsRaw: string[][] = []
  let cur: string[] = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++ } else inQuotes = false }
      else cell += c
    } else if (c === '"') inQuotes = true
    else if (c === delim) { cur.push(cell); cell = '' }
    else if (c === '\n') { cur.push(cell); rowsRaw.push(cur); cur = []; cell = '' }
    else if (c !== '\r') cell += c
  }
  if (cell.length > 0 || cur.length > 0) { cur.push(cell); rowsRaw.push(cur) }
  if (!rowsRaw.length) return { headers: [], rows: [] }
  const headers = rowsRaw[0].map(h => h.trim())
  const rows = rowsRaw.slice(1)
    .filter(r => r.some(c => c.trim() !== ''))
    .map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])))
  return { headers, rows }
}

export function detectPlatform(headers: string[]): Platform {
  const set = new Set(headers.map(h => h.toLowerCase()))
  const has = (...keys: string[]) => keys.some(k => set.has(k.toLowerCase()))
  if (has('confirmation code', 'code de confirmation', 'listing', 'annonce', 'logement', 'gross earnings', 'recettes brutes', 'revenus bruts') && has('type')) return 'airbnb'
  if (has('book number', 'numéro de réservation', 'commission amount', 'montant de la commission', 'booker country')) return 'booking'
  if (has('confirmation code', 'code de confirmation', 'gross earnings', 'revenus bruts')) return 'airbnb'
  return 'unknown'
}

function col(row: Record<string, string>, candidates: string[]): string {
  const keys = Object.keys(row)
  for (const c of candidates) {
    const k = keys.find(k => k.toLowerCase() === c.toLowerCase())
    if (k && row[k]) return row[k]
  }
  return ''
}

// ── Montants et dates ────────────────────────────────────────────────────────

/** « 1 234,56 », « 1,234.56 », « 65,66 », « -150.00 », « 287.34 € » */
export function parseAmount(s: string | null | undefined): number | null {
  const t = String(s ?? '').replace(/[€$£\s  ]/g, '')
  if (!t) return null
  let n: number
  if (/,\d{1,2}$/.test(t)) n = parseFloat(t.replace(/\./g, '').replace(',', '.'))
  else n = parseFloat(t.replace(/,/g, ''))
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null
}

const NUM_DATE = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/

/**
 * Ordre des dates numériques du fichier : jour/mois ou mois/jour. Un premier
 * nombre au-delà de 12 tranche pour jour/mois, un second au-delà de 12 pour
 * mois/jour. Sans indice (toutes les dates ≤ 12), l'export Airbnb est en
 * mois/jour (même en français), les autres en jour/mois.
 */
export function detectDateOrder(values: string[], platform: Platform): DateOrder {
  let dmy = 0, mdy = 0
  for (const v of values) {
    const m = NUM_DATE.exec(v.trim())
    if (!m) continue
    if (Number(m[1]) > 12) dmy++
    if (Number(m[2]) > 12) mdy++
  }
  if (dmy && !mdy) return 'dmy'
  if (mdy && !dmy) return 'mdy'
  return platform === 'airbnb' ? 'mdy' : 'dmy'
}

const valid = (y: number, mo: number, d: number) => {
  if (mo < 1 || mo > 12 || d < 1) return false
  return d <= new Date(Date.UTC(y, mo, 0)).getUTCDate()
}

/** Date du fichier → AAAA-MM-JJ, ou null si elle n'existe pas au calendrier. */
export function parseDate(s: string | null | undefined, order: DateOrder): string | null {
  const t = String(s ?? '').trim()
  if (!t) return null
  let y: number, mo: number, d: number
  const iso = /^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})/.exec(t)
  const num = NUM_DATE.exec(t)
  if (iso) { y = +iso[1]; mo = +iso[2]; d = +iso[3] }
  else if (num) {
    y = +num[3]
    if (order === 'mdy') { mo = +num[1]; d = +num[2] } else { d = +num[1]; mo = +num[2] }
  } else {
    const dt = new Date(t)
    if (Number.isNaN(dt.getTime())) return null
    y = dt.getFullYear(); mo = dt.getMonth() + 1; d = dt.getDate()
  }
  if (!valid(y, mo, d)) return null
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

const round = (n: number) => Math.round(n * 100) / 100

// ── Airbnb ───────────────────────────────────────────────────────────────────

const A = {
  type: ['Type'],
  date: ['Date'],
  code: ['Code de confirmation', 'Confirmation code', 'Confirmation Code'],
  debut: ['Date de début', 'Start date', 'Start Date', "Date d'arrivée"],
  fin: ['Date de fin', 'End date', 'End Date', 'Date de départ'],
  nuits: ['Nuits', 'Nights'],
  voyageur: ['Voyageur', 'Guest', 'Guest name'],
  logement: ['Logement', 'Annonce', 'Listing', 'Property'],
  montant: ['Montant', 'Amount'],
  frais: ['Frais de service', 'Service fee', 'Host fee'],
  brut: ['Revenus bruts', 'Recettes brutes', 'Gross earnings', 'Gross Earnings'],
}

function airbnbKind(type: string): 'reservation' | 'payout' | 'regularisation' | 'annulation' | 'autre' {
  const t = type.toLowerCase()
  if (/payout|versement|paiement/.test(t)) return 'payout'
  if (/annul|cancel/.test(t)) return 'annulation'
  if (/r[ée]gularisation|adjustment|resolution|r[ée]solution|ajustement/.test(t)) return 'regularisation'
  if (/r[ée]servation|reservation/.test(t)) return 'reservation'
  return 'autre'
}

function importAirbnb(rows: Record<string, string>[]): ImportResult {
  const dateValues = rows.flatMap(r => [col(r, A.date), col(r, A.debut), col(r, A.fin)]).filter(Boolean)
  const order = detectDateOrder(dateValues, 'airbnb')
  const stays = new Map<string, ImportStay>()
  const adjustments: Array<{ code: string; montant: number; date: string | null; ligne: number }> = []
  const problems: ImportProblem[] = []
  let payouts = 0, cancelled = 0

  rows.forEach((r, i) => {
    const ligne = i + 2
    const kind = airbnbKind(col(r, A.type))
    if (kind === 'payout') { payouts++; return }
    if (kind === 'annulation') { cancelled++; return }
    const code = col(r, A.code)
    const date = parseDate(col(r, A.date), order)
    if (kind === 'regularisation') {
      const m = parseAmount(col(r, A.brut)) ?? parseAmount(col(r, A.montant))
      if (m != null && m !== 0) adjustments.push({ code, montant: m, date, ligne })
      return
    }
    if (kind !== 'reservation') { problems.push({ ligne, raison: `Type « ${col(r, A.type) || 'vide'} » non reconnu` }); return }
    const verse = parseAmount(col(r, A.montant)) ?? 0
    const frais = Math.abs(parseAmount(col(r, A.frais)) ?? 0)
    const brut = parseAmount(col(r, A.brut)) ?? round(verse + frais)
    const arrivee = parseDate(col(r, A.debut), order)
    if (!date && !arrivee) { problems.push({ ligne, raison: 'Date illisible' }); return }
    if (!(brut > 0)) { problems.push({ ligne, raison: 'Montant manquant' }); return }
    const key = code || `ligne-${ligne}`
    const prev = stays.get(key)
    if (prev) {
      // Même code sur deux lignes « Réservation » (séjour modifié) : on additionne
      prev.brut = round(prev.brut + brut); prev.frais = round(prev.frais + frais); prev.verse = round(prev.verse + verse)
      return
    }
    const n = Number(col(r, A.nuits))
    stays.set(key, {
      code, date: (date ?? arrivee)!, arrivee, depart: parseDate(col(r, A.fin), order), nuits: Number.isFinite(n) && n > 0 ? n : null,
      logement: col(r, A.logement).replace(/\s+/g, ' ').trim(), voyageur: col(r, A.voyageur), brut, frais, verse, regularisation: 0,
    })
  })

  const orphanAdjustments: ImportResult['orphanAdjustments'] = []
  for (const a of adjustments) {
    const s = a.code ? stays.get(a.code) : undefined
    if (s) { s.regularisation = round(s.regularisation + a.montant); s.brut = round(s.brut + a.montant); s.verse = round(s.verse + a.montant) }
    else orphanAdjustments.push({ code: a.code, montant: a.montant, date: a.date })
  }
  return { platform: 'airbnb', dateOrder: order, stays: [...stays.values()], payouts, cancelled, orphanAdjustments, problems }
}

// ── Booking.com ──────────────────────────────────────────────────────────────

const B = {
  statut: ['Status', 'Statut'],
  code: ['Book number', 'Numéro de réservation', 'Booking number'],
  arrivee: ['Check-in', 'Arrivée', "Date d'arrivée", 'Arrival'],
  depart: ['Check-out', 'Départ', 'Date de départ', 'Departure'],
  logement: ['Property', 'Logement', 'Listing', 'Hébergement', 'Unit type', 'Type de logement'],
  voyageur: ['Guest name', 'Nom du voyageur', 'Guest', 'Voyageur', 'Booker name', 'Nom du client'],
  prix: ['Price', 'Prix', 'Prix total', 'Total price', 'Total', 'Montant', 'Revenue'],
  commission: ['Commission amount', 'Montant de la commission', 'Commission'],
}

function importBooking(rows: Record<string, string>[]): ImportResult {
  const order = detectDateOrder(rows.flatMap(r => [col(r, B.arrivee), col(r, B.depart)]).filter(Boolean), 'booking')
  const stays: ImportStay[] = []
  const problems: ImportProblem[] = []
  let cancelled = 0
  rows.forEach((r, i) => {
    const ligne = i + 2
    const statut = col(r, B.statut).toLowerCase()
    if (/cancel|annul|no.?show/.test(statut)) { cancelled++; return }
    const arrivee = parseDate(col(r, B.arrivee), order)
    const brut = parseAmount(col(r, B.prix))
    if (!arrivee) { problems.push({ ligne, raison: 'Date d’arrivée illisible' }); return }
    if (brut == null || brut <= 0) { problems.push({ ligne, raison: 'Montant manquant' }); return }
    const frais = Math.abs(parseAmount(col(r, B.commission)) ?? 0)
    const depart = parseDate(col(r, B.depart), order)
    const nuits = depart ? Math.round((Date.parse(depart) - Date.parse(arrivee)) / 86_400_000) : null
    stays.push({
      code: col(r, B.code), date: arrivee, arrivee, depart, nuits: nuits && nuits > 0 ? nuits : null,
      logement: col(r, B.logement).replace(/\s+/g, ' ').trim(), voyageur: col(r, B.voyageur), brut, frais, verse: round(brut - frais), regularisation: 0,
    })
  })
  return { platform: 'booking', dateOrder: order, stays, payouts: 0, cancelled, orphanAdjustments: [], problems }
}

export function importPlatformCsv(text: string): ImportResult & { headers: string[] } {
  const { headers, rows } = parseCSV(text)
  const platform = detectPlatform(headers)
  const res = platform === 'booking' ? importBooking(rows) : platform === 'airbnb' ? importAirbnb(rows) : { platform: 'unknown' as Platform, dateOrder: 'dmy' as DateOrder, stays: [], payouts: 0, cancelled: 0, orphanAdjustments: [], problems: [] }
  return { ...res, headers }
}

/** Logement de l'app le plus proche du nom de l'annonce (identique, puis l'un contient l'autre). */
export function matchLogement(listing: string, logements: string[]): string | null {
  const n = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
  const l = n(listing)
  if (!l) return null
  const exact = logements.find(x => n(x) === l)
  if (exact) return exact
  const inside = logements.filter(x => n(x) && (l.includes(n(x)) || n(x).includes(l)))
  return inside.length === 1 ? inside[0] : null
}
