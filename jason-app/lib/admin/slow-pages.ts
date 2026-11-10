// Pages lentes des 7 derniers jours pour État de santé (10/11/2026, étape 3
// des fondations Supabase, docs/claude/technique.md). Lit les mesures « Serveur
// lent » déjà enregistrées par perfTimer (app_errors, route « perf ») : page,
// durée et nombre d'appels à Supabase. Calcul pur, testé.
import type { HealthCheck, HealthItem, HealthLevel } from './health'

export const SLOW_PAGE_MS = 5000
export const MANY_CALLS = 15

const RE = /^Serveur lent : (.+?) (\d+) ms \(.*?(?:· (\d+) appels)?/

/** « page /dashboard/admin 6569 ms (…· 2 appels…) » → { label, ms, calls } */
export function parseSlowMessage(message: string): { label: string; ms: number; calls: number | null } | null {
  const m = RE.exec(message)
  if (!m) return null
  const calls = /· (\d+) appels/.exec(message)
  return { label: m[1].replace(/\/[0-9a-f-]{36}/gi, '/<id>'), ms: Number(m[2]), calls: calls ? Number(calls[1]) : null }
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? s[Math.floor((s.length - 1) / 2)] : 0
}

export function slowPagesCheck(messages: string[]): HealthCheck {
  const by = new Map<string, { ms: number[]; calls: number[] }>()
  for (const msg of messages) {
    const p = parseSlowMessage(msg)
    if (!p) continue
    const cur = by.get(p.label) ?? { ms: [], calls: [] }
    cur.ms.push(p.ms)
    if (p.calls !== null) cur.calls.push(p.calls)
    by.set(p.label, cur)
  }
  const rows = Array.from(by.entries())
    .map(([label, v]) => ({ label, n: v.ms.length, ms: median(v.ms), calls: v.calls.length ? median(v.calls) : null }))
    // Une page lente une seule fois (réveil de la base) ne dit rien
    .filter(r => r.n >= 3 && (r.ms >= SLOW_PAGE_MS || (r.calls ?? 0) > MANY_CALLS))
    .sort((a, b) => b.n * b.ms - a.n * a.ms)
  const items: HealthItem[] = rows.slice(0, 8).map(r => ({
    label: r.label,
    detail: `${r.n} fois lente, ${Math.round(r.ms / 100) / 10} s en général${r.calls !== null ? `, ${r.calls} appels à la base` : ''}`,
    level: (r.ms >= 2 * SLOW_PAGE_MS || (r.calls ?? 0) > MANY_CALLS ? 'warn' : 'ok') as HealthLevel,
  }))
  const level: HealthLevel = items.some(i => i.level === 'warn') ? 'warn' : 'ok'
  return {
    key: 'pages-lentes',
    title: 'Pages lentes (7 jours)',
    level,
    summary: rows.length
      ? `${rows.length} page${rows.length > 1 ? 's' : ''} souvent au-delà de ${SLOW_PAGE_MS / 1000} s ou de ${MANY_CALLS} appels à la base`
      : 'Aucune page régulièrement lente',
    items,
    advice: level === 'warn' ? 'Regrouper les lectures de la page dans une fonction SQL ou un cache (docs/claude/technique.md, « Fondations Supabase »).' : undefined,
  }
}
