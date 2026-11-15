// Audit express public d'une fiche Google (15/11/2026, demande de Jason) :
// appelé par jasonmarinho.com/services/audit-gbp, sans compte. Reçoit un lien
// Google Maps ou le nom de l'établissement, lit la fiche par l'accès officiel
// Google Places et rend la note calculée par lib/audit-gbp/express.ts.
//
// Garde-fous : seuls les liens Google sont suivis ; 5 audits par heure et par
// visiteur, 30 par jour au total (la part gratuite de Google, 900 appels par
// mois, est partagée avec l'audit du dashboard) ; takePlacesCall refuse tout
// appel au-delà du plafond gratuit. On garde la fiche auditée et sa note pour
// le suivi de l'admin (annonce_analyses, outil « gbp »), rien sur le visiteur.
import { NextResponse } from 'next/server'
import { resolveMapsUrl, extractPlaceIdFromUrl, searchPlaceByText, getPlaceDetails } from '@/lib/audit-gbp/places-api'
import { auditExpress, isGoogleMapsUrl, nameFromGoogleUrl } from '@/lib/audit-gbp/express'
import { PlacesBudgetError } from '@/lib/google/places-budget'
import { rateLimit, getClientIp } from '@/lib/security/rate-limit'
import { getServiceClient } from '@/lib/supabase/service'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const log = logger('api/public/audit-gbp')

const ALLOWED_ORIGINS = new Set(['https://jasonmarinho.com', 'https://www.jasonmarinho.com', 'http://localhost:4174'])
const ROBOT = /bot|crawler|spider|crawling|preview|scan|monitor|lighthouse|headless|python|curl|wget/i

function headers(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://jasonmarinho.com',
    Vary: 'Origin',
    'Cache-Control': 'no-store',
  }
}
const json = (req: Request, body: unknown, status = 200) => NextResponse.json(body, { status, headers: headers(req.headers.get('origin')) })

function isShareGoogle(adresse: string): boolean {
  try { const u = new URL(adresse); return isGoogleMapsUrl(adresse) && u.pathname === '/share.google' } catch { return false }
}

/** Adresse vers laquelle Google redirige (une seule étape, vers Google seulement) ; chaîne vide sinon. */
async function suiteDe(adresse: string): Promise<string> {
  try {
    const r = await fetch(adresse, {
      method: 'GET', redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    })
    const suite = r.headers.get('location') ?? ''
    const absolue = suite ? new URL(suite, adresse).toString() : ''
    return absolue && (isGoogleMapsUrl(absolue) || /^https:\/\/consent\.google\./.test(absolue)) ? absolue : ''
  } catch { return '' }
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: { ...headers(req.headers.get('origin')), 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' },
  })
}

export async function POST(req: Request) {
  const ua = req.headers.get('user-agent') ?? ''
  if (!ua || ROBOT.test(ua)) return json(req, { error: 'Accès refusé.' }, 403)

  let q = ''
  try { q = String(((await req.json()) as { q?: unknown })?.q ?? '').trim() } catch { /* corps illisible */ }
  if (q.length < 3 || q.length > 400) return json(req, { error: 'Colle le lien Google Maps de ta fiche, ou écris le nom de ton logement et sa ville.' }, 400)
  const estLien = /^https?:\/\//i.test(q)
  if (estLien && !isGoogleMapsUrl(q)) return json(req, { error: 'Ce lien n’est pas un lien Google Maps. Ouvre ta fiche sur Google Maps et copie l’adresse de la page, ou écris simplement le nom de ton logement et sa ville.' }, 400)

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return json(req, { error: 'L’audit express est indisponible pour le moment.' }, 503)

  const parVisiteur = await rateLimit('publicAuditGbp', getClientIp(req), 5, 60 * 60 * 1000)
  if (!parVisiteur.allowed) return json(req, { error: 'Tu as lancé plusieurs audits : réessaie dans une heure.' }, 429)
  const parJour = await rateLimit('publicAuditGbpJour', 'tous', 30, 24 * 60 * 60 * 1000)
  if (!parJour.allowed) return json(req, { error: 'L’audit express a beaucoup servi aujourd’hui : il reprend demain. Tu peux faire l’audit complet dans ton espace gratuit.' }, 429)

  try {
    // Lien : on suit les redirections (share.google, maps.app.goo.gl), puis on
    // prend l'identifiant de la fiche s'il est dans l'adresse, sinon le nom de
    // l'établissement. Jamais l'adresse elle-même comme texte de recherche :
    // chaque essai raté consommerait la part gratuite de Google.
    let id: string | null = null
    let texte = q
    if (estLien) {
      const adresse = await resolveMapsUrl(q)
      const direct = extractPlaceIdFromUrl(adresse)
      if (direct && direct.startsWith('ChIJ')) id = direct
      else {
        let nom = nameFromGoogleUrl(adresse)
        // Lien « Partager » : google.com/share.google?q=<code> ne révèle la
        // fiche (redirection vers /search?q=<nom>) qu'à une lecture complète,
        // pas à la demande d'en-têtes faite par resolveMapsUrl.
        if (!nom && isShareGoogle(adresse)) nom = nameFromGoogleUrl(await suiteDe(adresse))
        if (!nom) {
          let forme = 'illisible'
          try { const u = new URL(adresse); forme = `${u.hostname}${u.pathname.slice(0, 40)} [${[...u.searchParams.keys()].slice(0, 8).join(',')}]` } catch { /* adresse illisible */ }
          log.warn('lien Google sans nom exploitable', { forme })
          return json(req, { error: 'Ce lien ne nous dit pas de quelle fiche il s’agit. Écris plutôt le nom de ton logement et sa ville.' }, 404)
        }
        texte = nom
      }
    }
    // D'abord parmi les hébergements (évite les homonymes), puis sans filtre
    if (!id) id = await searchPlaceByText(texte, apiKey, 'lodging')
    if (!id) id = await searchPlaceByText(texte, apiKey)
    if (!id) return json(req, { error: 'Aucune fiche Google trouvée avec ce nom. Ajoute la ville, ou colle le lien Google Maps de ta fiche.' }, 404)
    const place = await getPlaceDetails(id, apiKey)
    const r = auditExpress(place)

    // Suivi de l'admin (migrations 189 à 191) : un échec n'empêche pas de répondre
    try {
      const { error } = await getServiceClient().from('annonce_analyses').insert({
        outil: 'gbp', score: r.score, complet: true, annonce_id: place.id, libelle: r.fiche.nom.slice(0, 160) || null,
        sections: r.sections.map(s => ({ id: s.id, score: s.score, max: s.max })),
      })
      if (error) log.warn('suivi non enregistré', { msg: error.message.slice(0, 160) })
    } catch { /* base injoignable */ }

    return json(req, { audit: r })
  } catch (err) {
    if (err instanceof PlacesBudgetError) {
      log.error('Places API : plafond gratuit', { msg: err.message.slice(0, 200) })
      return json(req, { error: 'L’audit express est en pause jusqu’au 1er du mois prochain (limite gratuite de Google atteinte). Tu peux faire l’audit complet dans ton espace gratuit.' }, 429)
    }
    const msg = err instanceof Error ? err.message : ''
    log.error('Places API', { msg: msg.slice(0, 400) })
    return json(req, { error: 'Google n’a pas répondu. Réessaie dans quelques minutes.' }, 502)
  }
}
