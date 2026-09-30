// Lecture des réponses de l'API Affilae (compte éditeur de Jason), pure et
// testée : affilae-parse.test.ts. Forme relevée le 30/09/2026 avec le
// workflow « Affilae (découverte de l'API) » : partnerships.list
// ({ partnerships: { data: [...] } }, trackingId = numéro d'affilié, stats.clicks.total),
// conversions.list?affiliateProfile= ({ conversions: { total, data } }),
// clicks.list ({ clicks: { total, data: [{ partnershipName, date }] } }).
// Les champs d'une conversion n'ont pas encore été vus (aucune vente) :
// lecture tolérante, montants en centimes (règle de l'API).

type Obj = Record<string, unknown>

// Annonceurs connus (id Affilae → nom), confirmés par un clic réel
export const KNOWN_ADVERTISERS: Record<string, string> = {
  '5e3c32d7acb4603ec9da8e33': 'Indy',
}

export type ConversionStatus = 'en_attente' | 'validee' | 'refusee' | 'payee'

export interface AffilaeProgramRow {
  id: string
  name: string
  status: 'actif' | 'en_attente' | 'refuse' | 'autre'
  trackingId: number | null
  clicks: number | null
  conversions: number
  commissionCents: number
  byStatus: Record<ConversionStatus, number>
}

export interface AffilaeSummary {
  programs: AffilaeProgramRow[]
  totals: { conversions: number; commissionCents: number; byStatus: Record<ConversionStatus, number>; clicks: number | null }
  recent: Array<{ date: string | null; program: string; commissionCents: number; status: ConversionStatus }>
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

/** Tableau de résultats d'une route « .list » : { <nom>: { data: [] } }, { data: [] } ou [] */
export function listData(json: unknown, key: string): Obj[] {
  if (Array.isArray(json)) return json.filter(isObj)
  if (!isObj(json)) return []
  const inner = json[key]
  if (isObj(inner) && Array.isArray(inner.data)) return inner.data.filter(isObj)
  if (Array.isArray(inner)) return inner.filter(isObj)
  if (Array.isArray(json.data)) return json.data.filter(isObj)
  return []
}

export function listTotal(json: unknown, key: string): number | null {
  if (!isObj(json)) return null
  const inner = json[key]
  const t = isObj(inner) ? inner.total : undefined
  return typeof t === 'number' ? t : null
}

function cents(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v)
  if (typeof v === 'string' && v.trim() && Number.isFinite(Number(v))) return Math.round(Number(v))
  if (isObj(v)) return cents(pick(v, ['amount', 'value', 'total']))
  return 0
}

export function conversionStatus(raw: unknown): ConversionStatus {
  const s = String(raw ?? '').toLowerCase()
  if (/paid|pay|versé/.test(s)) return 'payee'
  if (/refus|reject|cancel|declin|invalid/.test(s)) return 'refusee'
  if (/accept|valid|approv|confirm/.test(s)) return 'validee'
  return 'en_attente'
}

function partnershipStatus(raw: unknown): AffilaeProgramRow['status'] {
  const s = String(raw ?? '').toLowerCase()
  if (s === 'active' || s === 'accepted') return 'actif'
  if (s === 'pending') return 'en_attente'
  if (/refus|reject|declin/.test(s)) return 'refuse'
  return 'autre'
}

const emptyStatus = (): Record<ConversionStatus, number> => ({ en_attente: 0, validee: 0, refusee: 0, payee: 0 })

function partnershipName(p: Obj): string {
  const named = pick(p, ['program.name', 'program.title', 'advertiser.name', 'name', 'partnershipName'])
  if (typeof named === 'string') return named
  const adv = pick(p, ['advertiser.id', 'advertiser'])
  if (typeof adv === 'string' && KNOWN_ADVERTISERS[adv]) return KNOWN_ADVERTISERS[adv]
  const t = pick(p, ['trackingId'])
  return t != null ? `Programme n° ${t}` : 'Programme'
}

export function summarizeAffilae(input: { partnerships: unknown; conversions: unknown; clicks: unknown }): AffilaeSummary {
  const parts = listData(input.partnerships, 'partnerships')
  const convs = listData(input.conversions, 'conversions')

  const programs: AffilaeProgramRow[] = parts.map(p => {
    const clicks = pick(p, ['stats.clicks.total'])
    const tracking = pick(p, ['trackingId'])
    return {
      id: String(pick(p, ['id']) ?? ''),
      name: partnershipName(p),
      status: partnershipStatus(p.status),
      trackingId: typeof tracking === 'number' ? tracking : null,
      clicks: typeof clicks === 'number' ? clicks : null,
      conversions: 0,
      commissionCents: 0,
      byStatus: emptyStatus(),
    }
  })

  const totals = { conversions: 0, commissionCents: 0, byStatus: emptyStatus(), clicks: listTotal(input.clicks, 'clicks') }
  const recent: AffilaeSummary['recent'] = []

  for (const c of convs) {
    const amount = cents(pick(c, ['commission', 'publisherCommission', 'commissionAmount', 'reward', 'amount']))
    const status = conversionStatus(pick(c, ['status', 'state']))
    const pid = pick(c, ['partnership.id', 'partnership', 'partnershipId'])
    const cName = pick(c, ['partnershipName', 'program.name', 'partnership.name', 'advertiserName'])
    const row = programs.find(p => (typeof pid === 'string' && p.id === pid) || (typeof cName === 'string' && p.name === cName))
    if (row) { row.conversions++; row.commissionCents += amount; row.byStatus[status] += amount }
    totals.conversions++
    totals.commissionCents += amount
    totals.byStatus[status] += amount
    const date = pick(c, ['date', 'createdAt', 'created_at'])
    recent.push({
      date: typeof date === 'string' ? date : typeof date === 'number' ? new Date(date).toISOString() : null,
      program: row?.name ?? (typeof cName === 'string' ? cName : 'Programme'),
      commissionCents: amount,
      status,
    })
  }

  recent.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  programs.sort((a, b) => (a.status === 'actif' ? 0 : 1) - (b.status === 'actif' ? 0 : 1) || b.commissionCents - a.commissionCents)
  return { programs, totals, recent: recent.slice(0, 8) }
}
