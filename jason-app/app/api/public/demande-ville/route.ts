// Demande de création d'une page de ville (13/10/2026, Jason : « si la ville
// n'existe pas, un bouton pour me demander de créer la page »). Depuis la
// recherche de jasonmarinho.com/chiffres. Un e-mail part à Jason ; l'adresse
// de la personne, facultative, ne sert qu'à la prévenir quand la page est en
// ligne et n'est jamais enregistrée. Depuis le 17/10/2026, la ville, le profil
// et la date sont gardés (city_requests, migration 138) pour compter les
// demandes par ville dans l'e-mail.
import { NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/security/rate-limit'
import { sendAdminEmail } from '@/lib/email/admin'
import { cleanCityRequest, cityRequestKey, cityRequestTally } from '@/lib/public-stats/rules'
import { getServiceClient } from '@/lib/supabase/service'
import { buildEmail, emailBtn, emailInfoBlock, emailNote, emailP, escHtml } from '@/lib/email/template'

/** Garde la demande et renvoie toutes celles de la même ville (null si la table manque) */
async function recordAndTally(ville: string, metier: string) {
  try {
    const db = getServiceClient()
    const key = cityRequestKey(ville)
    await db.from('city_requests').insert({ ville, ville_key: key, metier })
    const { data, error } = await db.from('city_requests').select('metier, created_at').eq('ville_key', key)
    if (error) return null
    return cityRequestTally((data ?? []) as Array<{ metier: string; created_at: string }>)
  } catch {
    return null
  }
}

const PLURIEL: Record<string, [string, string]> = { photographe: ['photographe', 'photographes'], menage: ['équipe de ménage', 'équipes de ménage'], hote: ['hôte', 'hôtes'] }
const dateFr = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })

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
  const tally = await recordAndTally(r.ville, r.metier)
  const ville = escHtml(r.ville)
  const nombre = tally
    ? tally.total === 1 ? 'Première demande' : `${tally.total} demandes depuis le ${dateFr(tally.premiere!)}`
    : 'Compteur indisponible'
  const detail = tally && tally.total > 1
    ? (Object.entries(tally.parMetier) as Array<[string, number]>).filter(([, n]) => n > 0).map(([m, n]) => `${n} ${PLURIEL[m][n > 1 ? 1 : 0]}`).join(', ')
    : null
  const rows = [
    { label: 'Ville demandée', value: ville },
    { label: 'Profil', value: escHtml(PLURIEL[r.metier][0].replace(/^./, c => c.toUpperCase())) },
    { label: 'Demandes', value: escHtml(detail ? `${nombre} (${detail})` : nombre) },
    { label: 'Contact', value: r.email ? `<a href="mailto:${escHtml(r.email)}" style="color:#004C3F">${escHtml(r.email)}</a>` : 'Aucune adresse laissée' },
  ]
  const html = buildEmail({
    title: `Une page pour ${ville} ?`,
    preview: `${PLURIEL[r.metier][0]} · ${nombre}`,
    body: [
      emailP(`Une personne a cherché ${ville} sur la page des chiffres et demande que la ville ait sa page.`),
      emailInfoBlock(rows),
      r.email
        ? emailP('Elle souhaite être prévenue quand la page sera en ligne : réponds simplement à cet e-mail pour lui écrire.')
        : emailP('Elle n’a pas laissé d’adresse : rien à lui répondre.'),
      emailBtn(`https://jasonmarinho.com/chiffres?ville=${encodeURIComponent(r.ville)}#ta-ville`, 'Voir la recherche sur la page des chiffres', 'secondary'),
      emailNote('Pour créer la ville, demande-le à Claude : une ville = 3 pages (photographe et vidéaste, ménage, guide hôte), faits vérifiés et sources, méthode « Créer une ville » de CLAUDE.md.'),
    ].join(''),
  })
  await sendAdminEmail({
    subject: `Demande de page de ville : ${r.ville} (${nombre.toLowerCase()})`,
    text: [
      `${r.ville} : demande de page de ville depuis jasonmarinho.com/chiffres.`,
      `Profil : ${PLURIEL[r.metier][0]}`,
      `Demandes : ${detail ? `${nombre} (${detail})` : nombre}`,
      r.email ? `Contact : ${r.email} (réponds à cet e-mail pour la prévenir)` : 'Aucune adresse laissée.',
    ].join('\n'),
    html,
    replyTo: r.email ?? undefined,
  })
  return NextResponse.json({ ok: true }, { headers: h })
}
