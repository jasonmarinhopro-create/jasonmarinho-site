import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { fetchSitemapEntries } from '@/lib/seo/sitemap'
import { isConfigured } from '@/lib/google/search-console'
import IndexationUI, { type PageStatus } from './IndexationUI'

export const metadata = { title: 'Indexation, Jason Marinho' }
export const dynamic = 'force-dynamic'
// Le bouton "Vérifier l'indexation" (action serveur) peut interroger ~500
// URLs — s'exécute dans la même fonction que cette page, même budget que le
// cron (60s).
export const maxDuration = 60

export default async function IndexationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  let entries: Awaited<ReturnType<typeof fetchSitemapEntries>> = []
  let fetchError: string | null = null
  try {
    entries = await fetchSitemapEntries()
  } catch (e) {
    fetchError = e instanceof Error ? e.message : 'Erreur inconnue'
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const { data: statusRows } = await service.from('seo_indexation_status').select('*')
  const statusByUrl = new Map((statusRows ?? []).map(r => [r.url, r]))

  const pages: PageStatus[] = entries.map(e => {
    const s = statusByUrl.get(e.url)
    return {
      url: e.url,
      path: e.url.replace('https://jasonmarinho.com', '') || '/',
      lastmod: e.lastmod,
      httpStatus: s?.http_status ?? null,
      coverageState: s?.coverage_state ?? null,
      indexed: s?.indexed ?? false,
      inspectionLink: s?.inspection_link ?? null,
      lastCheckedAt: s?.last_checked_at ?? null,
      submittedAt: s?.submitted_at ?? null,
      error: s?.error ?? null,
    }
  })

  const lastChecked = pages.reduce<string | null>((max, p) => {
    if (!p.lastCheckedAt) return max
    return !max || p.lastCheckedAt > max ? p.lastCheckedAt : max
  }, null)

  return (
    <IndexationUI
      pages={pages}
      fetchError={fetchError}
      lastChecked={lastChecked}
      apiConfigured={await isConfigured()}
    />
  )
}
