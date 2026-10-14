// Montée en charge de la prospection (14/10/2026, Jason : « augmenter
// progressivement l'envoi si tout se passe bien, pour éviter la zone spam »).
// Une fois par jour d'envoi, avant les envois, l'app regarde les 7 derniers
// jours : rebonds, refus du serveur, désinscriptions, plaintes. Tout va bien
// et le plafond est vraiment utilisé : +5 par jour, au plus tous les 2 jours,
// jusqu'au plafond maximum. Signaux moyens : on garde. Mauvais signaux : on
// baisse nettement et on attend 7 jours avant de remonter.
// Règles pures (testées) ; lecture et écriture en base : service.ts.

export const WARMUP = {
  /** Jamais sous ce plafond, même après une baisse */
  floor: 10,
  /** Hostinger gratuit : 100 e-mails par jour, tes propres messages compris */
  defaultCeiling: 70,
  maxCeiling: 90,
  step: 5,
  /** Jours entre deux hausses */
  minDaysBetweenRaises: 2,
  /** Jours de prudence après une baisse */
  coolDownAfterCut: 7,
  windowDays: 7,
  /** En dessous, un taux ne veut rien dire : on juge sur les nombres */
  minSample: 20,
  /** Plafond « utilisé » : au moins 80 % un des derniers jours d'envoi */
  usedRatio: 0.8,
  cutFactor: 0.6,
} as const

export interface WarmupStats {
  /** E-mails partis sur 7 jours */
  sent: number
  /** Adresses en rebond (lues dans la boîte ou refusées pour adresse inconnue) */
  bounces: number
  unsubscribes: number
  /** Signalés comme indésirables */
  complaints: number
  /** Refus du serveur pour spam, réputation, politique ou débit */
  blocks: number
  /** Autres erreurs d'envoi (réseau, mot de passe…) */
  otherErrors: number
  replies: number
  /** Plus grand nombre d'envois sur un des derniers jours d'envoi */
  busiestDay: number
}

export type WarmupLevel = 'vert' | 'orange' | 'rouge' | 'attente'
export type WarmupAction = 'monter' | 'garder' | 'baisser'

export interface WarmupDecision {
  level: WarmupLevel
  action: WarmupAction
  cap: number
  reasons: string[]
}

export interface WarmupInput {
  cap: number
  ceiling: number
  stats: WarmupStats
  today: string
  lastChange: string | null
  lastCut: string | null
}

export interface WarmupLogEntry {
  date: string
  level: WarmupLevel
  action: WarmupAction
  from: number
  to: number
  reasons: string[]
  stats: WarmupStats
}

const BLOCK_RE = /spam|blacklist|block(ed|list)|reputation|réputation|policy|politique|rejected for|5\.7\.\d|4\.7\.\d|too many|rate.?limit|quota|throttl|\b421\b|\b554\b/i
const ADDRESS_RE = /user|mailbox|recipient|address|unknown|exist/i

/** Nature d'une erreur d'envoi gardée en base (message SMTP). */
export function classifyError(message: string | null | undefined): 'adresse' | 'blocage' | 'autre' {
  const m = message ?? ''
  if (/\b55[0-3]\b/.test(m) && ADDRESS_RE.test(m) && !BLOCK_RE.test(m)) return 'adresse'
  if (BLOCK_RE.test(m)) return 'blocage'
  return 'autre'
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000)
}

export function clampCeiling(n: number | null | undefined): number {
  const v = Math.round(Number(n) || WARMUP.defaultCeiling)
  return Math.min(WARMUP.maxCeiling, Math.max(WARMUP.floor, v))
}

const pct = (n: number, d: number) => (d ? n / d : 0)
const fmtPct = (r: number) => `${(Math.round(r * 1000) / 10).toString().replace('.', ',')} %`
const plural = (n: number, w: string) => `${n} ${w}${n > 1 ? 's' : ''}`

export function decideWarmup(input: WarmupInput): WarmupDecision {
  const { cap, ceiling, stats: s, today } = input
  const enough = s.sent >= WARMUP.minSample
  const bounceRate = pct(s.bounces, s.sent)
  const unsubRate = pct(s.unsubscribes, s.sent)
  const errRate = pct(s.otherErrors, s.sent + s.otherErrors)

  // ── Mauvais signaux : on baisse ──
  const red: string[] = []
  if (s.complaints > 0) red.push(`${plural(s.complaints, 'signalement')} comme indésirable`)
  if (s.blocks >= 2) red.push(`${plural(s.blocks, 'refus')} du serveur (spam, réputation ou débit)`)
  if (enough ? (s.bounces >= 3 && bounceRate > 0.05) : s.bounces >= 4) red.push(`${plural(s.bounces, 'rebond')} sur ${s.sent} envois${enough ? ` (${fmtPct(bounceRate)})` : ''}`)
  if (enough && s.unsubscribes >= 3 && unsubRate > 0.03) red.push(`${plural(s.unsubscribes, 'désinscription')} sur ${s.sent} envois (${fmtPct(unsubRate)})`)
  if (red.length) {
    const lower = Math.max(WARMUP.floor, Math.round(cap * WARMUP.cutFactor))
    return lower < cap
      ? { level: 'rouge', action: 'baisser', cap: lower, reasons: [...red, `plafond ramené de ${cap} à ${lower}, puis 7 jours de prudence`] }
      : { level: 'rouge', action: 'garder', cap, reasons: [...red, 'plafond déjà au minimum'] }
  }

  // ── Signaux moyens : on garde ──
  const amber: string[] = []
  if (s.blocks === 1) amber.push('1 refus du serveur')
  if (enough && bounceRate > 0.02) amber.push(`rebonds à ${fmtPct(bounceRate)} (au-delà de 2 %)`)
  if (!enough && s.bounces >= 2) amber.push(`${plural(s.bounces, 'rebond')} sur seulement ${s.sent} envois`)
  if (enough && unsubRate > 0.015) amber.push(`désinscriptions à ${fmtPct(unsubRate)}`)
  if (s.sent + s.otherErrors >= WARMUP.minSample && errRate > 0.05) amber.push(`${plural(s.otherErrors, 'erreur')} d'envoi`)
  if (amber.length) return { level: 'orange', action: 'garder', cap, reasons: [...amber, 'plafond gardé tant que ça ne s\'améliore pas'] }

  if (!enough) return { level: 'attente', action: 'garder', cap, reasons: [`${s.sent} envois sur 7 jours : pas encore assez pour juger (${WARMUP.minSample} au moins)`] }

  // ── Tout va bien : on monte, si ça sert ──
  const good = `${fmtPct(bounceRate)} de rebonds, ${plural(s.unsubscribes, 'désinscription')}, aucun refus`
  if (cap >= ceiling) return { level: 'vert', action: 'garder', cap, reasons: [good, `plafond maximum atteint (${ceiling})`] }
  if (s.busiestDay < Math.ceil(cap * WARMUP.usedRatio)) {
    return { level: 'vert', action: 'garder', cap, reasons: [good, `le plafond n'est pas atteint (${s.busiestDay} envois au plus sur une journée) : rien à monter`] }
  }
  if (input.lastCut && daysBetween(input.lastCut, today) < WARMUP.coolDownAfterCut) {
    return { level: 'vert', action: 'garder', cap, reasons: [good, `prudence après la baisse du ${frDate(input.lastCut)}`] }
  }
  if (input.lastChange && daysBetween(input.lastChange, today) < WARMUP.minDaysBetweenRaises) {
    return { level: 'vert', action: 'garder', cap, reasons: [good, 'dernier changement trop récent, prochaine hausse possible demain'] }
  }
  const higher = Math.min(ceiling, cap + WARMUP.step)
  return { level: 'vert', action: 'monter', cap: higher, reasons: [good, `plafond monté de ${cap} à ${higher}`] }
}

function frDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${Number(d)}/${m}`
}

/** Journal gardé sur les réglages : plus récent d'abord, 30 entrées. */
export function pushLog(log: unknown, entry: WarmupLogEntry): WarmupLogEntry[] {
  const prev = Array.isArray(log) ? (log as WarmupLogEntry[]).filter(e => e && typeof e.date === 'string') : []
  return [entry, ...prev.filter(e => e.date !== entry.date)].slice(0, 30)
}
