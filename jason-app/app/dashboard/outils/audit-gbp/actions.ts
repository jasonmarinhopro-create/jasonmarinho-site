'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { computeGlobalScore, type AnswerValue } from '@/lib/audit-gbp/questions'

interface ActionResult<T = void> {
  ok?: T
  error?: string
}

export async function startAuditSession(meta?: { businessName?: string; city?: string }): Promise<ActionResult<{ sessionId: string }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data, error } = await supabase
    .from('audit_gbp_sessions')
    .insert({
      user_id: user.id,
      business_name: meta?.businessName ?? null,
      city: meta?.city ?? null,
      answers: {},
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Erreur création session.' }
  return { ok: { sessionId: data.id } }
}

export async function saveAuditAnswers(sessionId: string, answers: Record<string, AnswerValue>): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('audit_gbp_sessions')
    .update({ answers })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return { ok: undefined }
}

export async function completeAudit(sessionId: string, answers: Record<string, AnswerValue>): Promise<ActionResult<{ sessionId: string }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { score, pillars } = computeGlobalScore(answers)
  const scoresByPillar: Record<string, number> = {}
  for (const [k, v] of Object.entries(pillars)) {
    scoresByPillar[k] = v.pct
  }

  const { error } = await supabase
    .from('audit_gbp_sessions')
    .update({
      answers,
      score_global: score,
      scores_by_pillar: scoresByPillar,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/outils/audit-gbp')
  return { ok: { sessionId } }
}
