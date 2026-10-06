// Lecture des réponses de l'API partenaire de PartnerStack (programme Brevo
// de Jason, 06/10/2026), pure et testée : partnerstack-parse.test.ts.
// API : https://api.partnerstack.com/api/v2, clé en Bearer, pagination par
// `starting_after` (clé du dernier élément) et `limit` (100 au plus).
// Enveloppe attendue : { data: { items: [...], has_more } }. La forme exacte
// d'une récompense n'a pas encore été vue (aucune vente) : lecture tolérante,
// montants en centimes. Les clients renvoient une adresse e-mail : on ne
// garde que leur nombre, jamais une donnée personnelle.
import type { ConversionStatus } from './affilae-parse'

type Obj = Record<string, unknown>

export interface PartnerStackProgramRow {
  name: string
  /** Récompenses (une inscription gratuite, un abonnement payant…) */
  rewards: number
  commissionCents: number
  byStatus: Record<ConversionStatus, number>
  /** Clients amenés (inscriptions), si l'API les donne */
  customers: number
}

export interface PartnerStackSummary {
  currency: string
  programs: PartnerStackProgramRow[]
  totals: { rewards: number; commissionCents: number; byStatus: Record<ConversionStatus, number>; customers: number }
  recent: Array<{ date: string | null; program: string; commissionCents: number; status: ConversionStatus; label: string | null }>
}

const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)

function pick(o: Obj, paths: string[]): unknown {
  for (const p of paths) {
    let cur: unknown = o
    for (const k of p.split('.')) cur = isObj(cur) ? cur[k] : undefined
    if (cur !== undefined && cur !== null && cur !== '') return cur
  }
  return undefined
}

/** Éléments d'une liste : { data: { items } }, { data: [] }, { items } ou [] */
export function listItems(json: unknown): Obj[] {
  if (Array.isArray(json)) return json.filter(isObj)
  if (!isObj(json)) return []
  const d = json.data
  if (isObj(d) && Array.isArray(d.items)) return d.items.filter(isObj)
  if (Array.isArray(d)) return d.filter(isObj)
  if (Array.isArray(json.items)) return json.items.filter(isObj)
  return []
}

/** Y a-t-il une page suivante ? */
export function hasMore(json: unknown): boolean {
  if (!isObj(json)) return false
  const d = json.data
  return (isObj(d) && d.has_more === true) || json.has_more === true
}

export function rewardStatus(raw: unknown): ConversionStatus {
  const s = String(raw ?? '').toLowerCase()
  if (/paid|pay[ée]/.test(s)) return 'payee'
  if (/declin|reject|refus|cancel|void|revers|denied/.test(s)) return 'refusee'
  if (/approv|accept|valid|confirm|earned|ready|complete/.test(s)) return 'validee'
  return 'en_attente'
}

/** Date ISO depuis un horodatage (ms ou s) ou une chaîne */
export function toIso(raw: unknown): string | null {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    const ms = raw > 1e12 ? raw : raw * 1000
    const d = new Date(ms)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }
  if (typeof raw === 'string' && raw) {
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }
  return null
}

/** Montant en centimes (entier attendu ; une chaîne « 5.00 » est lue en euros) */
export function amountCents(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.round(raw)
  if (typeof raw === 'string' && raw.trim()) {
    const n = Number(raw.replace(',', '.'))
    if (!Number.isFinite(n)) return 0
    return raw.includes('.') || raw.includes(',') ? Math.round(n * 100) : Math.round(n)
  }
  return 0
}

const PROGRAM_PATHS = ['company.name', 'company_name', 'partnership.company.name', 'program.name', 'group.name', 'offer.name', 'company.key']

function programOf(o: Obj, fallback: string): string {
  const v = pick(o, PROGRAM_PATHS)
  return typeof v === 'string' && v.trim() ? v.trim() : fallback
}

const emptyStatus = (): Record<ConversionStatus, number> => ({ en_attente: 0, validee: 0, refusee: 0, payee: 0 })

/**
 * Résumé des récompenses et des clients. `fallbackProgram` nomme les lignes
 * sans programme (un seul programme aujourd'hui : Brevo).
 */
export function summarizePartnerStack(input: { rewards: unknown[]; customers: unknown[] }, fallbackProgram = 'Brevo'): PartnerStackSummary {
  const programs = new Map<string, PartnerStackProgramRow>()
  const row = (name: string) => {
    if (!programs.has(name)) programs.set(name, { name, rewards: 0, commissionCents: 0, byStatus: emptyStatus(), customers: 0 })
    return programs.get(name)!
  }
  const currencies = new Map<string, number>()
  const recent: PartnerStackSummary['recent'] = []

  for (const r of input.rewards.filter(isObj)) {
    const name = programOf(r, fallbackProgram)
    const cents = amountCents(pick(r, ['amount', 'amount_cents', 'reward.amount', 'value']))
    const status = rewardStatus(pick(r, ['status', 'state', 'reward_status']))
    const cur = String(pick(r, ['currency', 'currency_code']) ?? 'EUR').toUpperCase()
    currencies.set(cur, (currencies.get(cur) ?? 0) + 1)
    const p = row(name)
    p.rewards++
    p.byStatus[status] += cents
    if (status !== 'refusee') p.commissionCents += cents
    const label = pick(r, ['description', 'reward_type', 'type', 'trigger.name', 'action'])
    recent.push({
      date: toIso(pick(r, ['created_at', 'createdAt', 'date', 'updated_at'])),
      program: name,
      commissionCents: cents,
      status,
      label: typeof label === 'string' && label.length < 80 && !label.includes('@') ? label : null,
    })
  }
  for (const c of input.customers.filter(isObj)) row(programOf(c, fallbackProgram)).customers++

  const list = [...programs.values()].sort((a, b) => b.commissionCents - a.commissionCents || b.customers - a.customers)
  const totals = { rewards: 0, commissionCents: 0, byStatus: emptyStatus(), customers: 0 }
  for (const p of list) {
    totals.rewards += p.rewards
    totals.commissionCents += p.commissionCents
    totals.customers += p.customers
    for (const k of Object.keys(totals.byStatus) as ConversionStatus[]) totals.byStatus[k] += p.byStatus[k]
  }
  const currency = [...currencies.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'EUR'
  recent.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  return { currency, programs: list, totals, recent: recent.slice(0, 10) }
}
