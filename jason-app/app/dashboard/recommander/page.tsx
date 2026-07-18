import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProForRecommendation, type ProType } from './actions'
import RecommanderCard from './RecommanderCard'

export const metadata = { title: 'Recommander un pro' }
export const dynamic = 'force-dynamic'

// Point d'entrée des liens « Recommander » sur les fiches publiques des
// annuaires : /dashboard/recommander?type=photographer&id=<uuid>
export default async function RecommanderPage({ searchParams }: {
  searchParams: Promise<{ type?: string; id?: string }>
}) {
  const sp = await searchParams
  const proType = sp.type === 'cleaner' ? 'cleaner' : 'photographer'
  const proId = sp.id ?? ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/dashboard/recommander?type=${proType}&id=${proId}`)}`)
  }

  const result = await getProForRecommendation(proType as ProType, proId)

  return (
    <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%', display: 'flex', justifyContent: 'center' }}>
      <RecommanderCard
        proType={proType as ProType}
        proId={proId}
        initial={'error' in result
          ? { error: result.error }
          : { name: result.name, ville: result.ville, alreadyRecommended: result.alreadyRecommended }}
      />
    </div>
  )
}
