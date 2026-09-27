// SERVER ONLY. Enregistre une erreur serveur dans app_errors (best-effort,
// sans await côté appelant : n'ajoute pas de latence et ne jette jamais).
// Appelé par lib/logger.ts sur chaque log.error en production.

import { createClient } from '@supabase/supabase-js'

let client: ReturnType<typeof createClient> | null = null
function svc() {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  return client
}

export function reportServerError(route: string, message: string, data?: unknown): void {
  try {
    const db = svc()
    if (!db) return
    const err = data instanceof Error ? data : (data as { err?: unknown } | undefined)?.err instanceof Error ? (data as { err: Error }).err : null
    const detail = err ? err.message : data !== undefined ? safeJson(data) : ''
    void db.from('app_errors').insert({
      source: 'server',
      route: route.slice(0, 200),
      message: (detail ? `${message} : ${detail}` : message).slice(0, 500),
      stack: err?.stack?.slice(0, 4000) ?? null,
    } as never).then(() => {}, () => {})
  } catch { /* jamais bloquant */ }
}

function safeJson(v: unknown): string {
  try { return JSON.stringify(v).slice(0, 300) } catch { return String(v).slice(0, 300) }
}
