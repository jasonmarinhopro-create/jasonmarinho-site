import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import FormationView from './FormationView'
import { GMB_FORMATION } from './content'
import { createClient } from '@/lib/supabase/server'

export default async function GmbFormationPage() {
  const profile = await getProfile()
  const supabase = await createClient()

  const { data: formation } = await supabase
    .from('formations')
    .select('id')
    .eq('slug', 'google-my-business-lcd')
    .single()

  const formationId = formation?.id ?? null

  let initialProgress: number | null = null
  if (formationId && profile?.userId) {
    const { data: uf } = await supabase
      .from('user_formations')
      .select('progress')
      .eq('user_id', profile.userId)
      .eq('formation_id', formationId)
      .maybeSingle()
    initialProgress = uf?.progress ?? null
  }

  return (
    <>
      <Header title="Formation GMB" userName={profile?.full_name ?? undefined} />
      <FormationView
        formation={GMB_FORMATION}
        formationId={formationId}
        initialProgress={initialProgress}
      />
    </>
  )
}
