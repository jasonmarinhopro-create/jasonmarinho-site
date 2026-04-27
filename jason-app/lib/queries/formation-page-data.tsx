import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import FormationView from '@/components/formations/FormationView'
import { createClient } from '@/lib/supabase/server'
import { getFormationDbContent, type FormationContent } from '@/lib/queries/formation-db-content'
import { checkFormationAccess } from '@/lib/queries/formation-access'
import PlanGate from '@/components/ui/PlanGate'
import { getFormationRelations } from '@/lib/formations/relations'
import { buildFormationMetadata, buildCourseSchema } from '@/lib/formations/seo'
import type { Metadata } from 'next'

/** Génère les Metadata Next.js pour une page formation */
export function buildFormationMetadataFromContent(
  slug: string,
  content: { title: string; description: string; duration: string; level: string; modules?: Array<{ title: string }> }
): Metadata {
  return buildFormationMetadata({
    slug,
    title: content.title,
    description: content.description,
    duration: content.duration,
    level: content.level,
    modules: content.modules,
  })
}

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
  let initialNotes: Record<string, string> = {}
  let initialBookmarks: number[] = []
  if (formationId && profile?.userId) {
    const [{ data: uf }, { data: notes }, { data: bookmarks }] = await Promise.all([
      supabase
        .from('user_formations')
        .select('progress, completed_lessons')
        .eq('user_id', profile.userId)
        .eq('formation_id', formationId)
        .maybeSingle(),
      supabase
        .from('user_lesson_notes')
        .select('lesson_id, content')
        .eq('user_id', profile.userId)
        .eq('formation_id', formationId),
      supabase
        .from('user_lesson_bookmarks')
        .select('lesson_id')
        .eq('user_id', profile.userId)
        .eq('formation_id', formationId),
    ])
    initialProgress = uf?.progress ?? null
    initialCompletedLessons = (uf?.completed_lessons as number[]) ?? []
    ;(notes ?? []).forEach((n: any) => { initialNotes[String(n.lesson_id)] = n.content as string })
    initialBookmarks = (bookmarks ?? []).map((b: any) => b.lesson_id as number)
  }

  // Contenu : DB override statique si présent, sinon fallback statique
  const formationContent = await getFormationDbContent(formationId, staticContent)

  // Phase 4 — Relations : articles blog + formations recommandées
  const relations = getFormationRelations(slug)

  // Pour les formations recommandées, on récupère leur titre depuis la DB
  let nextFormationsData: Array<{ slug: string; title: string; reason?: string }> = []
  if (relations.recommendedNext.length > 0) {
    const slugs = relations.recommendedNext.map(r => r.slug)
    const { data: nexts } = await supabase
      .from('formations')
      .select('slug, title')
      .in('slug', slugs)
      .eq('is_published', true)
    const titleBySlug = Object.fromEntries((nexts ?? []).map(n => [n.slug, n.title as string]))
    nextFormationsData = relations.recommendedNext
      .filter(r => titleBySlug[r.slug])
      .map(r => ({ slug: r.slug, title: titleBySlug[r.slug], reason: r.reason }))
  }

  // Phase 5 — JSON-LD Course schema
  const courseJsonLd = buildCourseSchema({
    slug,
    title: formationContent.title,
    description: formationContent.description,
    duration: formationContent.duration,
    level: formationContent.level,
    modules: formationContent.modules?.map(m => ({ title: m.title })),
  })

  return (
    <>
      <Header title={headerTitle} userName={profile?.full_name ?? undefined} />
      {/* JSON-LD pour les moteurs de recherche / partage social */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: courseJsonLd }}
      />
      <FormationView
        formation={formationContent}
        formationId={formationId}
        formationSlug={slug}
        initialProgress={initialProgress}
        initialCompletedLessons={initialCompletedLessons}
        initialNotes={initialNotes}
        initialBookmarks={initialBookmarks}
        relatedArticles={relations.articles}
        recommendedNext={nextFormationsData}
      />
    </>
  )
}
