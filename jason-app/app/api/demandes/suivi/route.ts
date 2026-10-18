// Suivi de sa demande par l'hôte (18/10/2026) : jasonmarinho.com/ma-demande?t=<jeton>.
// GET : où en est la demande ; POST { t, action: 'trouve' } : « J'ai trouvé mon pro ».
// Le jeton (32 caractères, envoyé seulement à l'hôte par e-mail) est la seule clé.
import { NextResponse } from 'next/server'
import { suiviDemande, fermerDemande } from '@/lib/demandes/send'
import { isSuiviToken } from '@/lib/demandes/public'
import { rateLimit, getClientIp } from '@/lib/security/rate-limit'
import { cors } from '../cors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const METHODS = 'GET, POST, OPTIONS'

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: { ...cors(req.headers.get('origin'), METHODS), 'Access-Control-Max-Age': '86400' } })
}

export async function GET(req: Request) {
  const headers = { ...cors(req.headers.get('origin'), METHODS), 'Cache-Control': 'no-store' }
  const rl = await rateLimit('demandes-suivi', getClientIp(req), 60, 60 * 60 * 1000)
  if (!rl.allowed) return NextResponse.json({ error: 'Trop de consultations : réessaie dans une heure.' }, { status: 429, headers })
  const t = new URL(req.url).searchParams.get('t')
  const vue = isSuiviToken(t) ? await suiviDemande(t) : null
  if (!vue) return NextResponse.json({ error: 'Ce lien de suivi n’est pas valable, ou la demande a été supprimée (au bout de 12 mois).' }, { status: 404, headers })
  return NextResponse.json(vue, { headers })
}

export async function POST(req: Request) {
  const headers = cors(req.headers.get('origin'), METHODS)
  const body = (await req.json().catch(() => ({}))) as { t?: unknown; action?: unknown }
  if (body.action !== 'trouve' || !isSuiviToken(body.t)) return NextResponse.json({ error: 'Demande incorrecte.' }, { status: 400, headers })
  const rl = await rateLimit('demandes-suivi-post', getClientIp(req), 10, 60 * 60 * 1000)
  if (!rl.allowed) return NextResponse.json({ error: 'Réessaie dans une heure.' }, { status: 429, headers })
  const ok = await fermerDemande(body.t)
  if (!ok) return NextResponse.json({ error: 'Impossible de fermer la demande pour le moment.' }, { status: 500, headers })
  const vue = await suiviDemande(body.t)
  return NextResponse.json(vue ?? { ok: true }, { headers })
}
