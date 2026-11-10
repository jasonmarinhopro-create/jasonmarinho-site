// Garde la base Supabase « réveillée » (10/11/2026, Jason : « je ne peux pas
// me permettre d'avoir des pics comme maintenant »).
//
// Constat (journaux Supabase du 10/11) : la première page ouverte après une
// demi-heure sans visite attendait 11 à 16 s chez Supabase lui-même (temps
// mesuré côté Supabase, la requête ne prenait qu'1 s dans la base), et le
// serveur d'authentification 4 à 8 s. Les suivantes étaient rapides. Sur
// l'offre gratuite (petite machine partagée, 0,5 Go de mémoire), les services
// non utilisés depuis un moment repartent lentement.
//
// Toutes les 5 minutes : un appel à l'authentification, un à l'API de la
// base (fonction du menu, qui renvoie tout de suite sans session) et une
// lecture minuscule. Moins de 900 appels par jour, sans écriture.
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 20

export async function GET(req: Request) {
  // Pas de CRON_SECRET dans ce projet Vercel (10/11/2026) : sans lui, Vercel
  // appelle sans en-tête. Route sans effet (lectures minuscules), donc ouverte
  // dans ce cas, comme ping-db ; protégée dès que le secret existe.
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return NextResponse.json({ error: 'missing env vars' }, { status: 500 })

  const timed = async (label: string, run: () => Promise<Response>) => {
    const t0 = Date.now()
    try {
      const r = await run()
      return [label, r.status, Date.now() - t0] as const
    } catch {
      return [label, 0, Date.now() - t0] as const
    }
  }
  const opts = (key: string, init: RequestInit = {}): RequestInit => ({
    ...init, cache: 'no-store', signal: AbortSignal.timeout(15_000),
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
  const results = await Promise.all([
    timed('auth', () => fetch(`${url}/auth/v1/health`, opts(anon))),
    timed('menu', () => fetch(`${url}/rest/v1/rpc/menu_state`, opts(anon, { method: 'POST', body: '{}' }))),
    // Lecture publique minuscule (actualités publiées, règle d'accès publique) : pas de clé service
    timed('lecture', () => fetch(`${url}/rest/v1/actualites?select=id&limit=1`, opts(anon, { method: 'HEAD' }))),
  ])
  return NextResponse.json({ ok: results.every(r => r[1] > 0 && r[1] < 500), ms: Object.fromEntries(results.map(r => [r[0], r[2]])) })
}
