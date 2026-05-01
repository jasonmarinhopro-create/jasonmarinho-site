import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import PartenairesView from './PartenairesView'

export default async function PartenairesPage() {
  const profile = await getProfile()
  const supabase = await createClient()
  const plan = profile?.plan ?? 'decouverte'
  const userId = profile?.userId ?? null

  // Partenaires additionnels hors Driing (actifs dans la DB)
  const [{ data: additionalPartners }, { data: allInterests }, { data: userInterests }] = await Promise.all([
    supabase
      .from('partners')
      .select('id, name, description, advantage, promo_code, url, category')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('tool_interests')
      .select('tool_slug'),
    userId
      ? supabase
          .from('tool_interests')
          .select('tool_slug')
          .eq('user_id', userId)
      : Promise.resolve({ data: [] as { tool_slug: string }[] }),
  ])

  // Compteurs par tool_slug (lus en SELECT, RLS doit autoriser SELECT)
  const interestCounts: Record<string, number> = {}
  ;(allInterests ?? []).forEach((r: { tool_slug: string }) => {
    interestCounts[r.tool_slug] = (interestCounts[r.tool_slug] ?? 0) + 1
  })

  // Slugs déjà votés par l'utilisateur
  const userVotedSlugs = new Set((userInterests ?? []).map((r: { tool_slug: string }) => r.tool_slug))

  return (
    <>
      <PartenairesView
        additionalPartners={additionalPartners ?? []}
        plan={plan}
        interestCounts={interestCounts}
        userVotedSlugs={Array.from(userVotedSlugs)}
        isAuthenticated={!!userId}
      />
    </>
  )
}
