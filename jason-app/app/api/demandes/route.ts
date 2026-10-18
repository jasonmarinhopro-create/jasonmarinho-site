// Demande inversée (12/10/2026) : formulaire « Décris ton besoin » de
// jasonmarinho.com/trouver-un-pro. La demande part aux 3 pros les plus proches
// (lib/demandes/send.ts). Appelée depuis le site statique : CORS limité à nos
// domaines, anti-robot (champ caché + délai), 3 demandes par heure et par IP.
import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { cleanDemande } from '@/lib/demandes/rules'
import { creerDemande } from '@/lib/demandes/send'
import { cleanAcquisition } from '@/lib/acquisition/rules'
import { rateLimit, getClientIp } from '@/lib/security/rate-limit'
import { cors } from './cors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30


export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: { ...cors(req.headers.get('origin')), 'Access-Control-Max-Age': '86400' } })
}

export async function POST(req: Request) {
  const headers = cors(req.headers.get('origin'))
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  // Robots : on répond « ok » sans rien faire
  if (body.website || (typeof body.t === 'number' && Date.now() - body.t < 2500)) return NextResponse.json({ ok: true, envoyes: 0 }, { headers })
  const rl = await rateLimit('demandes', getClientIp(req), 3, 60 * 60 * 1000)
  if (!rl.allowed) return NextResponse.json({ error: 'Tu as déjà envoyé plusieurs demandes : réessaie dans une heure, ou écris à contact@jasonmarinho.com.' }, { status: 429, headers })
  const r = cleanDemande(body)
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: 400, headers })
  const res = await creerDemande(r.value, cleanAcquisition(body.acq))
  if ('error' in res) return NextResponse.json({ error: res.error }, { status: 500, headers })
  // Compteur public de /chiffres à jour tout de suite
  revalidateTag('public-demandes')
  return NextResponse.json(res, { headers })
}
