import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import ActualitesView from './ActualitesView'

export const metadata = { title: 'Actualités LCD — Jason Marinho' }

export interface Actualite {
  id: string
  title: string
  summary: string
  source_url: string | null
  category: string
  published_at: string | null
  created_at: string
  deadline_date?: string | null
  is_pinned?: boolean | null
  regions?: string[] | null
  read_time_minutes?: number | null
}

const FREE_ARTICLES_LIMIT = 3

// Mapping mots-clés → région tag (même logique que /communaute)
const REGION_KEYWORDS: Record<string, string[]> = {
  'Île-de-France':   ['paris', 'île-de-france', 'ile-de-france', 'idf', ' 75', ' 77', ' 78', ' 91', ' 92', ' 93', ' 94', ' 95'],
  'PACA':            ['paca', 'provence', 'marseille', 'nice', 'aix-en-provence', 'cannes', 'avignon', 'toulon', 'antibes', ' 13', ' 83', ' 84', ' 04', ' 05', ' 06'],
  'Bretagne':        ['bretagne', 'rennes', 'brest', 'quimper', 'lorient', 'vannes', 'saint-malo', 'dinard', ' 22', ' 29', ' 35', ' 56'],
  'Normandie':       ['normandie', 'rouen', 'caen', 'le havre', 'cherbourg', 'évreux', 'deauville', 'honfleur', ' 14', ' 27', ' 50', ' 61', ' 76'],
  'Occitanie':       ['occitanie', 'toulouse', 'montpellier', 'nîmes', 'nimes', 'perpignan', 'narbonne', 'sète', ' 31', ' 34', ' 11', ' 66', ' 30'],
  'Hauts-de-France': ['hauts-de-france', 'lille', 'amiens', 'roubaix', 'tourcoing', 'arras', 'calais', ' 59', ' 62', ' 60', ' 02', ' 80'],
  'Auvergne':        ['auvergne', 'clermont-ferrand', 'clermont', 'vichy', ' 63', ' 15', ' 43', ' 03'],
  'Bourgogne':       ['bourgogne', 'dijon', 'beaune', 'nevers', 'mâcon', 'macon', 'auxerre', ' 21', ' 58', ' 71', ' 89'],
  'Corse':           ['corse', 'ajaccio', 'bastia', 'porto-vecchio', 'calvi', 'bonifacio', ' 20', ' 2a', ' 2b'],
  'Réunion':         ['réunion', 'reunion', 'saint-denis', 'saint-pierre', 'saint-paul', ' 974'],
  'Alpes':           ['alpes', 'chamonix', 'megève', 'megeve', 'grenoble', 'annecy', 'savoie', ' 73', ' 74', ' 38'],
  'Pyrénées':        ['pyrénées', 'pyrenees', 'pau', 'tarbes', 'lourdes', 'biarritz', ' 64', ' 65'],
}

function detectRegions(adresses: string[]): Set<string> {
  const detected = new Set<string>()
  for (const addr of adresses) {
    const text = ' ' + addr.toLowerCase() + ' '
    for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
      for (const kw of keywords) {
        if (text.includes(kw.toLowerCase())) {
          detected.add(region)
          break
        }
      }
    }
  }
  return detected
}

export default async function ActualitesPage() {
  const [profile, supabase] = await Promise.all([
    getProfile(),
    createClient(),
  ])

  const plan = profile?.plan ?? 'decouverte'
  const isDecouverte = plan === 'decouverte'
  const userId = profile?.userId ?? null

  const [
    { data: articles },
    { data: reads },
    { data: favorites },
    { data: userLogements },
  ] = await Promise.all([
    supabase
      .from('actualites')
      .select('id, title, summary, source_url, category, published_at, created_at, deadline_date, is_pinned, regions, read_time_minutes')
      .eq('is_published', true)
      .order('is_pinned', { ascending: false, nullsFirst: false })
      .order('published_at', { ascending: false, nullsFirst: false }),
    userId
      ? supabase.from('user_actualite_reads').select('actualite_id').eq('user_id', userId)
      : Promise.resolve({ data: [] as { actualite_id: string }[] }),
    userId
      ? supabase.from('user_actualite_favorites').select('actualite_id').eq('user_id', userId)
      : Promise.resolve({ data: [] as { actualite_id: string }[] }),
    userId
      ? supabase.from('logements').select('adresse').eq('user_id', userId)
      : Promise.resolve({ data: [] as { adresse: string | null }[] }),
  ])

  const allArticles = (articles ?? []) as Actualite[]
  const visibleArticles = isDecouverte
    ? allArticles.slice(0, FREE_ARTICLES_LIMIT)
    : allArticles
  const totalCount = allArticles.length

  const readSlugs = new Set((reads ?? []).map(r => r.actualite_id))
  const favoriteSlugs = new Set((favorites ?? []).map(f => f.actualite_id))

  // Détection régions depuis logements
  const userAdresses = (userLogements ?? []).map(l => (l.adresse ?? '').toLowerCase()).filter(Boolean)
  const detectedRegions = Array.from(detectRegions(userAdresses))

  return (
    <>
      <Header title="Actualités" userName={profile?.full_name ?? undefined} />
      <ActualitesView
        articles={visibleArticles}
        isDecouverte={isDecouverte}
        totalCount={totalCount}
        readIds={Array.from(readSlugs)}
        favoriteIds={Array.from(favoriteSlugs)}
        detectedRegions={detectedRegions}
        isAuthenticated={!!userId}
      />
    </>
  )
}
