import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import FormationView from '../google-my-business-lcd/FormationView'
import { LCD_BASSE_SAISON_FORMATION } from './content'
import { createClient } from '@/lib/supabase/server'

export default async function FormationPage() {
  const profile = await getProfile()
  const supabase = await createClient()

  const { data: formation } = await supabase
    .from('formations')
    .select('id')
    .eq('slug', 'lcd-basse-saison')
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
      <Header title="Formation LCD Basse saison" userName={profile?.full_name ?? undefined} />
      <FormationView
        formation={LCD_BASSE_SAISON_FORMATION}
        formationId={formationId}
        initialProgress={initialProgress}
      />
    </>
  )
}
