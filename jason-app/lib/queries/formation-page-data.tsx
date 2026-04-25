import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import FormationView from '@/components/formations/FormationView'
import { createClient } from '@/lib/supabase/server'
import { getFormationDbContent, type FormationContent } from '@/lib/queries/formation-db-content'
import { checkFormationAccess } from '@/lib/queries/formation-access'
import PlanGate from '@/components/ui/PlanGate'

/**
 * Builds the JSX for a formation dashboard page.
 *
 * Before : 16 pages × 61 lignes copy-paste.
 * After  : chaque page.tsx ~10 lignes, tout est centralisé ici.
 *
 * Usage :
 * ```tsx
 * import { buildFormationPage } from '@/lib/queries/formation-page-data'
 * import { GMB_FORMATION } from './content'
 *
 * export default function Page() {
 *   return buildFormationPage({
 *     slug: 'google-my-business-lcd',
 *     headerTitle: 'Formation GMB',
 *     staticContent: GMB_FORMATION,
 *   })
 * }
 * ```
 */
export async function buildFormationPage({
  slug,
  headerTitle,
  staticContent,
}: {
  slug: string
  headerTitle: string
  staticContent: FormationContent
}) {
  const profile = await getProfile()
  const supabase = await createClient()

  const { data: formation } = await supabase
    .from('formations')
    .select('id')
    .eq('slug', slug)
    .single()

  const formationId = formation?.id ?? null
  const plan = profile?.plan ?? 'decouverte'

  // Access gate (Découverte plan = max 2 formations débloquées)
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

  // Progress existant de l'utilisateur (si déjà inscrit)
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

  // Contenu : DB override statique si présent, sinon fallback statique
  const formationContent = await getFormationDbContent(formationId, staticContent)

  return (
    <>
      <Header title={headerTitle} userName={profile?.full_name ?? undefined} />
      <FormationView
        formation={formationContent}
        formationId={formationId}
        initialProgress={initialProgress}
        initialCompletedLessons={initialCompletedLessons}
      />
    </>
  )
}
