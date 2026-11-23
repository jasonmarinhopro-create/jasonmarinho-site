// Carte « 3 questions pour ne pas oublier » de l'Accueil (23/11/2026) :
// questions répondues il y a 7 jours ou plus, pas encore revues.
// Une seule lecture (formation_answers, index partiel) ; rien si la table
// manque ou s'il n'y a rien à revoir.
import { createClient } from '@/lib/supabase/server'
import { FORMATION_CONTENT_MAP } from '@/app/dashboard/admin/formations/[slug]/contentMap'
import { pickRevision, REVISION_DELAY_DAYS, type AnswerRow } from '@/lib/formations/revision'
import RevisionQuiz from './RevisionQuiz'

export default async function RevisionCard({ userId }: { userId: string }) {
  if (!userId) return null
  const supabase = await createClient()
  const since = new Date(Date.now() - REVISION_DELAY_DAYS * 24 * 3600 * 1000).toISOString()
  const { data, error } = await supabase
    .from('formation_answers')
    .select('formation_id, lesson_id, question, answered_at, formations(slug)')
    .eq('user_id', userId)
    .is('reviewed_at', null)
    .lte('answered_at', since)
    .order('answered_at', { ascending: true })
    .limit(30)
  if (error || !data || data.length === 0) return null

  const map = new Map<string, { slug: string; content: (typeof FORMATION_CONTENT_MAP)[string] }>()
  for (const r of data as Array<{ formation_id: string; formations: { slug: string } | { slug: string }[] | null }>) {
    const f = Array.isArray(r.formations) ? r.formations[0] : r.formations
    const content = f ? FORMATION_CONTENT_MAP[f.slug] : undefined
    if (f && content) map.set(r.formation_id, { slug: f.slug, content })
  }
  const questions = pickRevision(data as AnswerRow[], map, new Date())
  if (questions.length === 0) return null
  return <RevisionQuiz questions={questions} />
}
