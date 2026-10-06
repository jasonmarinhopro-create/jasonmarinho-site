// Chiffres d'une page de ville et de l'annuaire (06/10/2026) : pour répondre
// à un pro qui demande la fréquentation avant de s'inscrire. Lancé par le
// workflow « Annuaire des pros » (mode chiffres-<métier>-<ville>), journaux
// publics : uniquement des nombres et des recherches Google, jamais de nom,
// d'e-mail ni d'identifiant. Protégé par CRON_SECRET ou SOCIAL_CRON_SECRET.
import { NextResponse, type NextRequest } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { gscQuery } from '@/lib/google/search-analytics'
import { loadVisits, SITE_ORIGIN } from '@/lib/visibility/load'
import { CITY_PAGE_SLUGS, cityPagePath, citySlugOf, internalReferrerPath, type CityMetier } from '@/lib/visibility/city-page'
import { parisToday } from '@/lib/stripe/deposit-window'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorized(req: NextRequest) {
  const secrets = [process.env.CRON_SECRET, process.env.SOCIAL_CRON_SECRET].filter(Boolean)
  return secrets.length > 0 && secrets.some(s => req.headers.get('authorization') === `Bearer ${s}`)
}

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const metier: CityMetier = req.nextUrl.searchParams.get('metier') === 'menage' ? 'menage' : 'photographe'
  const ville = (req.nextUrl.searchParams.get('ville') ?? '').toLowerCase()
  if (!(CITY_PAGE_SLUGS as readonly string[]).includes(ville)) return NextResponse.json({ error: 'Ville inconnue' }, { status: 400 })
  const path = cityPagePath(metier, ville)
  const today = parisToday()
  const db = getServiceClient()
  const table = metier === 'photographe' ? 'photographers' : 'cleaners'
  const contacts = metier === 'photographe' ? 'photographer_contacts' : 'cleaner_contacts'
  const annuaire = metier === 'photographe' ? '/annuaires/photographes' : '/annuaires/menage'

  // ── Visites mesurées sur le site (depuis le 19/09/2026, 100 jours gardés) ──
  const visits = await loadVisits({ start: addDays(today, -99), end: today, path }).catch(() => null)
  const byMonth: Record<string, { pages: number; visitors: number }> = {}
  if (visits) {
    const sessions: Record<string, Set<string>> = {}
    for (const v of visits) {
      const m = v.created_at.slice(0, 7)
      byMonth[m] ??= { pages: 0, visitors: 0 }
      byMonth[m].pages++
      ;(sessions[m] ??= new Set()).add(v.session_id)
    }
    for (const m of Object.keys(byMonth)) byMonth[m].visitors = sessions[m].size
  }
  const last30 = visits?.filter(v => v.created_at.slice(0, 10) >= addDays(today, -29)) ?? []
  const firstVisit = visits?.[0]?.created_at.slice(0, 10) ?? null
  // Visites de fiches arrivées depuis la page de ville
  const fiches = await loadVisits({ start: addDays(today, -99), end: today, prefix: `${annuaire}/` }).catch(() => [])
  const fromCity = fiches.filter(v => internalReferrerPath(v.referrer) === path).length

  // ── Google (16 mois d'historique) ──
  const url = `${SITE_ORIGIN}${path}`
  let google: Record<string, unknown> = { erreur: null }
  try {
    const end = addDays(today, -2)
    const [daily, queries] = await Promise.all([
      gscQuery({ startDate: '2026-01-01', endDate: end, dimensions: ['date'], page: { op: 'equals', value: url } }),
      gscQuery({ startDate: addDays(end, -27), endDate: end, dimensions: ['query'], page: { op: 'equals', value: url }, rowLimit: 200 }),
    ])
    const months: Record<string, { clics: number; affichages: number }> = {}
    for (const r of daily) {
      const m = r.keys[0].slice(0, 7)
      months[m] ??= { clics: 0, affichages: 0 }
      months[m].clics += r.clicks
      months[m].affichages += r.impressions
    }
    const last28 = daily.filter(r => r.keys[0] >= addDays(end, -27))
    const imp = last28.reduce((n, r) => n + r.impressions, 0)
    const pos = imp ? last28.reduce((n, r) => n + r.position * r.impressions, 0) / imp : null
    google = {
      erreur: null,
      par_mois: months,
      jours_28: { clics: last28.reduce((n, r) => n + r.clicks, 0), affichages: imp, place_moyenne: pos === null ? null : Math.round(pos * 10) / 10, jusqu_au: end },
      recherches_28j: queries.sort((a, b) => b.impressions - a.impressions).slice(0, 12)
        .map(q => ({ recherche: q.keys[0], affichages: q.impressions, clics: q.clicks, place: Math.round(q.position * 10) / 10 })),
    }
  } catch (e) {
    google = { erreur: String((e as Error)?.message ?? e).slice(0, 160) }
  }

  // ── Annuaire (nombres seulement) ──
  const [{ data: pros }, contactsAll, contacts90] = await Promise.all([
    db.from(table).select('ville, zone_couverte, status, is_public, views_count, contacts_count'),
    db.from(contacts).select('id', { count: 'exact', head: true }),
    db.from(contacts).select('id', { count: 'exact', head: true }).gte('created_at', `${addDays(today, -89)}T00:00:00Z`),
  ])
  const rows = (pros ?? []) as Array<{ ville: string | null; zone_couverte: string | null; status: string | null; is_public: boolean | null; views_count: number | null; contacts_count: number | null }>
  const actives = rows.filter(r => r.status === 'active' && r.is_public)

  return NextResponse.json({
    page: path,
    visites: visits ? { premiere_mesure: firstVisit, jours_30: { pages_vues: last30.length, visiteurs: new Set(last30.map(v => v.session_id)).size }, par_mois: byMonth, fiches_ouvertes_depuis_la_page_100j: fromCity } : { erreur: 'visites illisibles' },
    google,
    annuaire: {
      fiches_actives: actives.length,
      fiches_actives_dans_la_ville: actives.filter(r => citySlugOf(r.ville, r.zone_couverte) === ville).length,
      fiches_au_total: rows.length,
      demandes_depuis_le_debut: contactsAll.count,
      demandes_90j: contacts90.count,
      compteur_demandes_fiches: rows.reduce((n, r) => n + (r.contacts_count ?? 0), 0),
      vues_fiches_cumul: rows.reduce((n, r) => n + (r.views_count ?? 0), 0),
    },
  })
}
