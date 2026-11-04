// Règle pure du regroupement des reconstructions du site (testée).
export const REBUILD_GAP_MS = 4 * 60_000

export function rebuildDecision(
  state: { requested_at: string | null; triggered_at: string | null },
  now: number,
  mode: 'request' | 'flush',
): 'now' | 'queue' | 'none' {
  const last = state.triggered_at ? Date.parse(state.triggered_at) : NaN
  const recent = !Number.isNaN(last) && now - last < REBUILD_GAP_MS
  if (mode === 'request') return recent ? 'queue' : 'now'
  if (!state.requested_at) return 'none'
  return recent ? 'queue' : 'now'
}
