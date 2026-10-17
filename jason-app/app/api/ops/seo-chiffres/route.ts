// Ce que le site reçoit de Google, par sorte de page, et les recherches à un pas
// de la première page (11/10/2026, Jason : « on fait des articles tous les 2
// jours, est-ce que tout fonctionne bien ? »). Lancé par le workflow « Chiffres
// d'usage » ; journaux publics : uniquement des nombres, des adresses de pages
// et des recherches Google, jamais de nom, d'e-mail ni d'identifiant.
// Protégé par CRON_SECRET ou SOCIAL_CRON_SECRET.
import { NextResponse, type NextRequest } from 'next/server'
import { gscQuery } from '@/lib/google/search-analytics'
import { SITE_ORIGIN } from '@/lib/visibility/load'
import { GSC_LAG_DAYS, pageKind } from '@/lib/visibility/rules'
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
const pathOf = (url: string) => url.replace(SITE_ORIGIN, '') || '/'
const r1 = (n: number) => Math.round(n * 10) / 10

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const end = addDays(parisToday(), -GSC_LAG_DAYS)
  const start = addDays(end, -27)
  const prevEnd = addDays(start, -1)
  const prevStart = addDays(prevEnd, -27)

  try {
    const [pages, prevPages, pairs] = await Promise.all([
      gscQuery({ startDate: start, endDate: end, dimensions: ['page'], rowLimit: 1000 }),
      gscQuery({ startDate: prevStart, endDate: prevEnd, dimensions: ['page'], rowLimit: 1000 }),
      gscQuery({ startDate: start, endDate: end, dimensions: ['query', 'page'], rowLimit: 5000 }),
    ])

    // Par sorte de page : pages vues dans Google, affichages, clics (28 jours et 28 jours d'avant)
    const kinds: Record<string, { pages: number; affichages: number; clics: number; clics_avant: number }> = {}
    for (const r of pages) {
      const k = pageKind(pathOf(r.keys[0]))
      kinds[k] ??= { pages: 0, affichages: 0, clics: 0, clics_avant: 0 }
      kinds[k].pages++
      kinds[k].affichages += r.impressions
      kinds[k].clics += r.clicks
    }
    for (const r of prevPages) {
      const k = pageKind(pathOf(r.keys[0]))
      kinds[k] ??= { pages: 0, affichages: 0, clics: 0, clics_avant: 0 }
      kinds[k].clics_avant += r.clicks
    }

    const blog = pages.filter(r => pageKind(pathOf(r.keys[0])) === 'blog' && !pathOf(r.keys[0]).startsWith('/blog/categorie'))
    const blogTop = [...blog].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 12)
      .map(r => `${pathOf(r.keys[0]).replace('/blog/', '')} : ${r.clicks} clics, ${r.impressions} aff., place ${r1(r.position)}`)
    const blogWithClick = blog.filter(r => r.clicks > 0).length

    // À un pas de la première page : place 4 à 20, au moins 10 affichages
    const proches = pairs
      .filter(r => r.position >= 4 && r.position <= 20 && r.impressions >= 10)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 30)
      .map(r => `${r.keys[0]} → ${pathOf(r.keys[1])} : ${r.impressions} aff., ${r.clicks} clics, place ${r1(r.position)}`)

    // Recherches qui amènent déjà des clics
    const qui_cliquent = pairs
      .filter(r => r.clicks > 0)
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 15)
      .map(r => `${r.keys[0]} → ${pathOf(r.keys[1])} : ${r.clicks} clics, place ${r1(r.position)}`)

    // Pages de ville (photographe, ménage, guide hôte) à un pas de la première
    // page (17/10/2026) : place moyenne de la page 4 à 20, avec ses recherches
    const CITY = /^\/(photographe-lcd|menage-lcd|devenir-hote-airbnb)-/
    const villes: Record<string, string[]> = { photographe: [], menage: [], hote: [] }
    const cityPages = pages
      .filter(r => CITY.test(pathOf(r.keys[0])) && r.position >= 4 && r.position <= 20 && r.impressions >= 5)
      .sort((a, b) => b.impressions - a.impressions)
    for (const r of cityPages) {
      const path = pathOf(r.keys[0])
      const k = path.startsWith('/photographe') ? 'photographe' : path.startsWith('/menage') ? 'menage' : 'hote'
      if (villes[k].length >= 25) continue
      const qs = pairs.filter(q => q.keys[1] === r.keys[0]).sort((a, b) => b.impressions - a.impressions).slice(0, 3)
        .map(q => `${q.keys[0]} (${q.impressions}, ${r1(q.position)})`).join(' ; ')
      villes[k].push(`${path} : ${r.impressions} aff., ${r.clicks} clics, place ${r1(r.position)} | ${qs}`)
    }

    return NextResponse.json({
      villes_proches: villes,
      periode: `${start} au ${end}`,
      par_sorte: kinds,
      blog: { articles_vus_dans_google: blog.length, avec_au_moins_un_clic: blogWithClick, top: blogTop },
      proches_premiere_page: proches,
      qui_cliquent,
    })
  } catch (e) {
    return NextResponse.json({ error: String((e as Error)?.message ?? e).slice(0, 200) }, { status: 502 })
  }
}
