// Chronomètre serveur (30/09/2026, Jason : « 10 secondes de page blanche en
// ouvrant l'app »). Mesure les étapes d'un rendu et, au-delà de 1,5 s,
// enregistre le détail dans app_errors (route « perf », best-effort, sans
// attente) : visible dans « Erreurs de l'app » de l'admin et lu par le
// workflow « Lenteurs ». Aucune donnée personnelle : chemins et durées.
import 'server-only'
import { getServiceClient } from '@/lib/supabase/service'
import { slowMessage, slowestCalls } from './format'
import { queryLog } from './query-log'

const SLOW_MS = 1500

// Laisse l'écriture finir après l'envoi de la réponse (contexte de requête
// Vercel, celui qu'utilise waitUntil de @vercel/functions) ; sinon rien.
function keepAlive(p: Promise<unknown>) {
  try {
    const ctx = (globalThis as Record<symbol, { get?: () => { waitUntil?: (p: Promise<unknown>) => void } | undefined } | undefined>)[Symbol.for('@next/request-context')]
    ctx?.get?.()?.waitUntil?.(p)
  } catch { /* ignore */ }
}

export function perfTimer(label: string, extra: Array<[string, number]> = []) {
  const t0 = Date.now()
  let last = t0
  const steps: Array<[string, number]> = [...extra]
  return {
    mark(name: string) {
      const now = Date.now()
      steps.push([name, now - last])
      last = now
    },
    done() {
      const total = Date.now() - t0 + extra.reduce((n, [, ms]) => n + ms, 0)
      if (total < SLOW_MS) return
      try {
        const db = getServiceClient()
        const calls = queryLog() ?? []
        const worst = slowestCalls(calls, 5).filter(([, ms]) => ms >= 300)
        const detail: Array<[string, number]> = worst.length
          ? [...steps, ...worst.map(([n, ms], i): [string, number] => [i === 0 ? `· ${calls.length} appels, plus lents : ${n}` : n, ms])]
          : steps
        const write = db.from('app_errors').insert({
          source: 'server', route: 'perf', message: slowMessage('Serveur lent', label, total, detail),
        } as never).then(() => {}, () => {})
        keepAlive(Promise.resolve(write))
      } catch { /* jamais bloquant */ }
    },
  }
}
