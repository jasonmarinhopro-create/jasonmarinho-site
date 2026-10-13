// Demande de création d'une page de ville (13/10/2026, Jason : « si la ville
// n'existe pas, un bouton pour me demander de créer la page »). Depuis la
// recherche de jasonmarinho.com/chiffres. Rien n'est enregistré en base :
// un e-mail part à Jason ; l'adresse de la personne, facultative, ne sert qu'à
// la prévenir quand la page est en ligne.
import { NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/security/rate-limit'
import { sendAdminEmail } from '@/lib/email/admin'
import { cleanCityRequest } from '@/lib/public-stats/rules'

export const runtime = 'nodejs'

const ALLOWED_ORIGINS = new Set(['https://jasonmarinho.com', 'https://www.jasonmarinho.com', 'http://localhost:8765'])

function headers(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://jasonmarinho.com',
    Vary: 'Origin',
    'Cache-Control': 'no-store',
  }
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: { ...headers(req.headers.get('origin')), 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' },
  })
}

const METIER: Record<string, string> = { photographe: 'photographe', menage: 'équipe de ménage', hote: 'hôte' }

export async function POST(req: Request) {
  const origin = req.headers.get('origin')
  const h = headers(origin)
  const limit = await rateLimit('chiffres:demande-ville', getClientIp(req), 5, 60 * 60_000)
  if (!limit.allowed) return NextResponse.json({ error: 'Beaucoup de demandes d’un coup : réessaie dans une heure.' }, { status: 429, headers: h })
  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  // Champ piège invisible : rempli = robot, réponse normale sans rien envoyer
  if (typeof body.website === 'string' && body.website.trim()) return NextResponse.json({ ok: true }, { headers: h })
  const r = cleanCityRequest(body)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400, headers: h })
  await sendAdminEmail({
    subject: `Demande de page de ville : ${r.ville} (${METIER[r.metier]})`,
    text: [
      `Quelqu'un demande une page pour ${r.ville} depuis jasonmarinho.com/chiffres.`,
      `Profil : ${METIER[r.metier]}`,
      r.email ? `À prévenir quand la page est en ligne : ${r.email}` : 'Pas d’adresse laissée.',
      '',
      'Créer la page : node scripts/build-pages-pros-villes.mjs <slug> puis node scripts/inject-local-villes.mjs (voir CLAUDE.md, « Nouvelle ville »).',
    ].join('\n'),
  })
  return NextResponse.json({ ok: true }, { headers: h })
}
