// Aperçu de /trouver-un-pro (18/10/2026) : les pros qui recevraient la demande
// si l'hôte l'envoyait maintenant (même règle que l'envoi), avec ce que leurs
// fiches publiques montrent déjà. Mis en cache 2 min par le CDN.
import { NextResponse } from 'next/server'
import { apercuDemande } from '@/lib/demandes/send'
import { PRESTATIONS_PHOTO, FREQUENCES } from '@/lib/demandes/rules'
import { cors } from '../cors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: { ...cors(req.headers.get('origin'), 'GET, OPTIONS'), 'Access-Control-Max-Age': '86400' } })
}

export async function GET(req: Request) {
  const headers = cors(req.headers.get('origin'), 'GET, OPTIONS')
  const u = new URL(req.url)
  const metier = u.searchParams.get('metier') === 'menage' ? 'menage' : 'photographe'
  const ville = (u.searchParams.get('ville') ?? '').replace(/\s+/g, ' ').trim().slice(0, 80)
  const b = u.searchParams.get('besoin')
  const besoin = b && ([...PRESTATIONS_PHOTO, ...FREQUENCES] as readonly string[]).includes(b) ? b : null
  if (ville.length < 2) return NextResponse.json({ pros: [], phrase: '' }, { headers })
  const res = await apercuDemande(metier, ville, besoin)
  return NextResponse.json(res, { headers: { ...headers, 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' } })
}
