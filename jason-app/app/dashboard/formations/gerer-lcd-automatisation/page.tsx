import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import FormationView from '../google-my-business-lcd/FormationView'
import { GERER_LCD_FORMATION } from './content'
import { createClient } from '@/lib/supabase/server'
import { getFormationDbContent } from '@/lib/queries/formation-db-content'

export default async function FormationPage() {
  const profile = await getProfile()
  const supabase = await createClient()

  const { data: formation } = await supabase
    .from('formations')
    .select('id')
    .eq('slug', 'gerer-lcd-automatisation')
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

  const formationContent = await getFormationDbContent(formationId, GERER_LCD_FORMATION)

  return (
    <>
      <Header title="Formation Gérer sa LCD pro" userName={profile?.full_name ?? undefined} />
      <FormationView
        formation={formationContent}
        formationId={formationId}
        initialProgress={initialProgress}
      />
    </>
  )
}
