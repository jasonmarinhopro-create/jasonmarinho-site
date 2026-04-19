import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import FormationView from '../google-my-business-lcd/FormationView'
import { LCD_BASSE_SAISON_FORMATION } from './content'
import { createClient } from '@/lib/supabase/server'
import { getFormationDbContent } from '@/lib/queries/formation-db-content'
import { checkFormationAccess } from '@/lib/queries/formation-access'
import PlanGate from '@/components/ui/PlanGate'

export default async function FormationPage() {
  const profile = await getProfile()
  const supabase = await createClient()

  const { data: formation } = await supabase
    .from('formations')
    .select('id')
    .eq('slug', 'lcd-basse-saison')
    .single()

  const formationId = formation?.id ?? null

  const plan = profile?.plan ?? 'decouverte'
  if (formationId && profile?.userId) {
    const { allowed } = await checkFormationAccess(supabase, profile.userId, formationId, plan)
    if (!allowed) {
      return (
        <>
          <Header title="Formation" userName={profile?.full_name ?? undefined} />
          <PlanGate feature="formations" />
        </>
      )
    }
  }

  let initialProgress: number | null = null
  let initialCompletedLessons: number[] = []
  if (formationId && profile?.userId) {
    const { data: uf } = await supabase
      .from('user_formations')
      .select('progress, completed_lessons')
      .eq('user_id', profile.userId)
      .eq('formation_id', formationId)
      .maybeSingle()
    initialProgress = uf?.progress ?? null
    initialCompletedLessons = (uf?.completed_lessons as number[]) ?? []
  }

  const formationContent = await getFormationDbContent(formationId, LCD_BASSE_SAISON_FORMATION)

  return (
    <>
      <Header title="Formation LCD Basse saison" userName={profile?.full_name ?? undefined} />
      <FormationView
        formation={formationContent}
        formationId={formationId}
        initialProgress={initialProgress}
        initialCompletedLessons={initialCompletedLessons}
      />
    </>
  )
}
