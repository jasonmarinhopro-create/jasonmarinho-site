// Texte des mesures de lenteur (pur, testé : format.test.ts). Les
// identifiants sont retirés des chemins (journaux GitHub publics).

export function cleanPath(path: string): string {
  return path
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<id>')
    .replace(/\/\d{3,}(?=\/|$)/g, '/<n>')
    .split('?')[0]
    .slice(0, 120)
}

export function slowMessage(kind: string, label: string, totalMs: number, steps: Array<[string, number]>): string {
  const detail = steps.filter(([, ms]) => ms >= 0).map(([n, ms]) => `${n} ${Math.round(ms)} ms`).join(', ')
  return `${kind} : ${cleanPath(label)} ${Math.round(totalMs)} ms${detail ? ` (${detail})` : ''}`.slice(0, 500)
}

/** Nom court d'un appel Supabase : table, fonction ou service (auth, storage). */
export function supabaseCallLabel(url: string): string {
  const m = url.match(/\/rest\/v1\/(rpc\/)?([a-zA-Z0-9_]+)/)
  if (m) return m[1] ? `rpc ${m[2]}` : m[2]
  const s = url.match(/\/(auth|storage|functions)\/v1\/([a-z_-]+)?/)
  if (s) return s[2] ? `${s[1]} ${s[2]}` : s[1]
  return 'autre'
}

/** Les appels les plus lents, du plus lent au plus rapide (même table regroupée au max). */
export function slowestCalls(calls: Array<[string, number]>, n = 5): Array<[string, number]> {
  const worst = new Map<string, number>()
  for (const [label, ms] of calls) worst.set(label, Math.max(worst.get(label) ?? 0, ms))
  return [...worst.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
}
