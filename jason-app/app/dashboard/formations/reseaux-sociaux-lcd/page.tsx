import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import FormationView from '../google-my-business-lcd/FormationView'
import { RESEAUX_SOCIAUX_FORMATION } from './content'
import { createClient } from '@/lib/supabase/server'

export default async function FormationPage() {
  const profile = await getProfile()
  const supabase = await createClient()

  const { data: formation } = await supabase
    .from('formations')
    .select('id')
    .eq('slug', 'reseaux-sociaux-lcd')
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
      <Header title="Formation Réseaux sociaux LCD" userName={profile?.full_name ?? undefined} />
      <FormationView
        formation={RESEAUX_SOCIAUX_FORMATION}
        formationId={formationId}
        initialProgress={initialProgress}
      />
    </>
  )
}
