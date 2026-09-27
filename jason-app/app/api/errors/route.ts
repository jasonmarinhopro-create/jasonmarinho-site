// POST /api/errors : erreurs navigateur (écrans d'erreur, exceptions non
// gérées) envoyées par lib/errors/client-report.ts. Stockées dans app_errors,
// affichées dans la Vue d'ensemble admin. Public (une erreur peut survenir
// avant connexion), donc limité en débit et en taille.

import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIp } from '@/lib/security/rate-limit'

export const dynamic = 'force-dynamic'

const BOT_UA = /bot|crawler|spider|preview|headless|lighthouse/i

export async function POST(req: Request) {
  const ua = req.headers.get('user-agent') ?? ''
  if (!ua || BOT_UA.test(ua)) return NextResponse.json({ ok: true })

  const rl = await rateLimit('errors:report', getClientIp(req), 20, 60_000)
  if (!rl.allowed) return NextResponse.json({ ok: true })

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { return NextResponse.json({ ok: false }, { status: 400 }) }
  const str = (v: unknown, n: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null)
  const message = str(body.message, 500)
  if (!message) return NextResponse.json({ ok: false }, { status: 400 })

  // Utilisateur connecté si possible (pour pouvoir le recontacter), sinon null.
  let userId: string | null = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id ?? null
  } catch { /* anonyme */ }

  const db = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  await db.from('app_errors').insert({
    source: 'client',
    message,
    stack: str(body.stack, 4000),
    digest: str(body.digest, 100),
    path: str(body.path, 300),
    route: str(body.route, 200),
    user_id: userId,
  })

  // Purge opportuniste (~1 % des requêtes) des erreurs de plus de 30 jours.
  if (Math.random() < 0.01) {
    await db.from('app_errors').delete().lt('created_at', new Date(Date.now() - 30 * 86400_000).toISOString())
  }
  return NextResponse.json({ ok: true })
}
