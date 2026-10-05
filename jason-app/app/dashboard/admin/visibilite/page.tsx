import { redirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { getProfile } from '@/lib/queries/profile'
import { loadVisibility } from '@/lib/visibility/admin-load'
import { parsePeriod } from '@/lib/visibility/rules'
import { parseTab } from '@/lib/visibility/admin-rules'
import { parisToday } from '@/lib/stripe/deposit-window'
import { perfTimer } from '@/lib/perf/server-timing'
import VisibiliteView from './VisibiliteView'

export const metadata = { title: 'Visibilité, Admin' }
export const dynamic = 'force-dynamic'
// Première lecture de Google sur 3 mois : jusqu'à ~20 s (ensuite en cache 6 h)
export const maxDuration = 60

type Period = Parameters<typeof loadVisibility>[0]
type Tab = Parameters<typeof loadVisibility>[1]
type Data = Awaited<ReturnType<typeof loadVisibility>>

// Calcul gardé 15 min (période, onglet, jour) : la page relit des milliers de
// visites, et chaque lecture coûte au budget Disk IO de Supabase (05/10/2026).
// Vérification admin faite avant, le cache ne contient que des chiffres.
// Une source en erreur n'est jamais gardée : le résultat est affiché tel quel
// (unstable_cache ne garde pas un appel qui lève une exception).
async function cachedVisibility(period: Period, tab: Tab, today: string): Promise<Data> {
  let partial: Data | null = null
  const load = unstable_cache(
    async (p: Period, t: Tab, d: string) => {
      const res = await loadVisibility(p, t, d)
      if (!res.gsc.ok || !res.visits.ok || !res.pros.ok || !res.affClicks.ok) {
        partial = res
        throw new Error('visibilite-partielle')
      }
      return res
    },
    ['admin-visibility-v1'],
    { revalidate: 900, tags: ['admin-visibility'] },
  )
  try {
    return await load(period, tab, today)
  } catch (e) {
    if (partial) return partial
    throw e
  }
}

export default async function VisibilitePage({ searchParams }: { searchParams: { periode?: string; onglet?: string } }) {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  // 7 jours, 28 jours ou 3 mois (12 mois réservé aux statistiques des pros)
  const raw = parsePeriod(searchParams.periode, '28j')
  const period = raw === '12m' ? '28j' : raw
  const tab = parseTab(searchParams.onglet)

  const t = perfTimer('/dashboard/admin/visibilite')
  const data = await cachedVisibility(period, tab, parisToday())
  t.done()

  return (
    <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%' }}>
      <VisibiliteView data={data} tab={tab} />
    </div>
  )
}
