// GET /api/perf/diag : diagnostic de lenteur lancé par le workflow GitHub
// « Lenteurs » (30/09/2026). Depuis l'intérieur du serveur Vercel, envoie des
// rafales de requêtes à Supabase de trois façons (client supabase-js, fetch
// sans cache, fetch par défaut de Next) et mesure le retard de la boucle
// d'événements. Réponse : durées seulement, aucune donnée.
// Protégé par CRON_SECRET ou SOCIAL_CRON_SECRET (en-tête Bearer).
import { NextResponse } from 'next/server'
import { getServiceClient, serviceRestHeaders } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorized(req: Request) {
  const secrets = [process.env.CRON_SECRET, process.env.SOCIAL_CRON_SECRET].filter(Boolean)
  return secrets.length > 0 && secrets.some(s => req.headers.get('authorization') === `Bearer ${s}`)
}

function stats(ms: number[]) {
  const a = [...ms].sort((x, y) => x - y)
  return { n: a.length, min: a[0], mediane: a[Math.floor(a.length / 2)], max: a[a.length - 1] }
}

async function burst(n: number, one: () => Promise<unknown>) {
  const t0 = Date.now()
  const each = await Promise.all(Array.from({ length: n }, async () => {
    const s = Date.now()
    try { await one() } catch { /* compté quand même */ }
    return Date.now() - s
  }))
  return { total: Date.now() - t0, ...stats(each) }
}

async function loopLag() {
  const s = Date.now()
  await new Promise(r => setTimeout(r, 0))
  return Date.now() - s
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'non autorisé' }, { status: 401 })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const headers = serviceRestHeaders()
  const rest = `${url}/rest/v1/profiles?select=id&limit=1`
  const db = getServiceClient()

  const out: Record<string, unknown> = { region: process.env.VERCEL_REGION ?? null, lagDebut: await loopLag() }
  out.uneRequeteNoStore = await burst(1, () => fetch(rest, { headers, cache: 'no-store' }).then(r => r.text()))
  out.rafaleNoStore = await burst(30, () => fetch(rest, { headers, cache: 'no-store' }).then(r => r.text()))
  out.rafaleFetchDefaut = await burst(30, () => fetch(rest, { headers }).then(r => r.text()))
  out.rafaleSupabaseJs = await burst(30, async () => { await db.from('profiles').select('id').limit(1) })
  out.authAdmin = await burst(1, () => fetch(`${url}/auth/v1/health`, { headers, cache: 'no-store' }).then(r => r.text()))
  out.lagFin = await loopLag()
  return NextResponse.json(out)
}
