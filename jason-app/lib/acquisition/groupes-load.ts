// Chargement de l'onglet « Groupes » de Provenance (service role, après
// vérification du rôle admin) : catalogue des pages proposables (articles du
// site, fiches de l'annuaire) et chiffres (messages préparés, clics, inscriptions).
// Tolère l'absence de la migration 130 et un site injoignable.
import 'server-only'
import { unstable_cache } from 'next/cache'
import { getServiceClient } from '@/lib/supabase/service'
import { isMissingRelation } from '@/lib/admin/health'
import { adminUserIds } from '@/lib/pros/demo'
import { citySlugOf } from '@/lib/visibility/city-page'
import { addDays, parisDay } from '@/lib/visibility/rules'
import { cleanAcquisition } from './rules'
import { parseArticlesData, SITE, type CatalogArticle, type CatalogPro } from './groupes'

type ProRow = { user_id: string | null; slug: string | null; full_name: string | null; pseudo: string | null; ville: string | null; zone_couverte: string | null; status: string | null; is_public: boolean | null }

export interface GroupCatalog { articles: CatalogArticle[]; pros: CatalogPro[]; articlesError: string | null }

async function fetchArticles(): Promise<{ list: CatalogArticle[]; error: string | null }> {
  try {
    const res = await fetch(`${SITE}/blog/articles-data.mjs`, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (!res.ok) return { list: [], error: `Articles du site illisibles (${res.status})` }
    const list = parseArticlesData(await res.text())
    return { list, error: list.length ? null : 'Aucun article lu sur le site' }
  } catch (e) {
    return { list: [], error: `Site injoignable : ${String((e as Error)?.message ?? e).slice(0, 80)}` }
  }
}

async function loadCatalogNow(): Promise<GroupCatalog> {
  const db = getServiceClient()
  const cols = 'user_id, slug, full_name, pseudo, ville, zone_couverte, status, is_public'
  const [articles, photo, menage, admins] = await Promise.all([
    fetchArticles(),
    db.from('photographers').select(cols),
    db.from('cleaners').select(cols),
    adminUserIds(db),
  ])
  const pros: CatalogPro[] = []
  const add = (kind: CatalogPro['kind'], rows: ProRow[] | null) => {
    for (const p of rows ?? []) {
      // Fiches en ligne seulement, jamais une fiche d'exemple (compte admin)
      if (p.status !== 'active' || !p.is_public || !p.slug || (p.user_id && admins.has(p.user_id))) continue
      pros.push({ kind, slug: p.slug, name: (p.pseudo || p.full_name || 'Pro de l\'annuaire').trim(), city: citySlugOf(p.ville, p.zone_couverte) })
    }
  }
  add('photographe', photo.data as ProRow[] | null)
  add('menage', menage.data as ProRow[] | null)
  return { articles: articles.list, pros, articlesError: articles.error }
}

/** Gardé 1 h (un nouvel article ou une nouvelle fiche apparaît dans l'heure) ; jamais gardé en cas d'erreur */
export async function loadGroupCatalog(): Promise<GroupCatalog> {
  const cached = await unstable_cache(loadCatalogNow, ['group-catalog-v1'], { revalidate: 3600, tags: ['group-catalog'] })()
  if (cached.articlesError) {
    const fresh = await loadCatalogNow()
    return fresh
  }
  return cached
}

export interface GroupStats {
  preparedToday: number
  preparedMonth: number
  record: { count: number; day: string } | null
  clicksToday: number
  clicksWeek: number
  signupsWeek: number
  articles: number
  pros: number
  articlesError: string | null
  missingMigration: boolean
}

export async function loadGroupStats(): Promise<GroupStats> {
  const db = getServiceClient()
  const today = parisDay(new Date().toISOString())
  const month = today.slice(0, 7)
  const weekStart = addDays(today, -6)
  const [replies, visits, profiles, catalog] = await Promise.all([
    db.from('group_replies').select('created_at').gte('created_at', `${addDays(today, -400)}T00:00:00Z`).limit(20_000),
    db.from('site_visits').select('session_id, created_at').eq('utm_medium', 'groupe').gte('created_at', `${addDays(weekStart, -1)}T00:00:00Z`).limit(20_000),
    db.from('profiles').select('created_at, acquisition').gte('created_at', `${addDays(weekStart, -1)}T00:00:00Z`).limit(5_000),
    loadGroupCatalog(),
  ])
  const missingMigration = !!replies.error && isMissingRelation(replies.error.code)

  const perDay = new Map<string, number>()
  for (const r of (replies.data ?? []) as Array<{ created_at: string }>) {
    const d = parisDay(r.created_at)
    perDay.set(d, (perDay.get(d) ?? 0) + 1)
  }
  let record: GroupStats['record'] = null
  for (const [day, count] of perDay) if (!record || count > record.count) record = { count, day }
  const preparedMonth = [...perDay].filter(([d]) => d.startsWith(month)).reduce((a, [, n]) => a + n, 0)

  const todaySessions = new Set<string>()
  const weekSessions = new Set<string>()
  for (const v of (visits.data ?? []) as Array<{ session_id: string; created_at: string }>) {
    const d = parisDay(v.created_at)
    if (d >= weekStart) weekSessions.add(v.session_id)
    if (d === today) todaySessions.add(v.session_id)
  }
  const signupsWeek = ((profiles.data ?? []) as Array<{ created_at: string; acquisition: unknown }>)
    .filter(p => parisDay(p.created_at) >= weekStart && cleanAcquisition(p.acquisition)?.medium === 'groupe').length

  return {
    preparedToday: perDay.get(today) ?? 0,
    preparedMonth,
    record,
    clicksToday: todaySessions.size,
    clicksWeek: weekSessions.size,
    signupsWeek,
    articles: catalog.articles.length,
    pros: catalog.pros.length,
    articlesError: catalog.articlesError,
    missingMigration,
  }
}
