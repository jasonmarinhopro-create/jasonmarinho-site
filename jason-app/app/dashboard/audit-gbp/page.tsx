import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import type { PastAudit } from './AuditHistory'
import AuditGbpView from './AuditGbpView'

// Historique des audits + état utilisateur. 60s de cache : les audits sont
// lancés à la demande puis statiques. La page se rafraîchit automatiquement
// après chaque mutation (server action → revalidatePath).
export const revalidate = 60
export const metadata = { title: 'Audit GBP, Jason Marinho' }


interface PageProps {
  searchParams: Promise<{ session?: string }>
}

export default async function AuditGbpPage({ searchParams }: PageProps) {
  const [profile, supabase, { session: requestedSessionId }] = await Promise.all([
    getProfile(),
    createClient(),
    searchParams,
  ])

  // Récupère les 3 derniers audits du user
  const { data: pastAudits } = await supabase
    .from('audit_gbp_sessions')
    .select('id, started_at, completed_at, score_global, business_name')
    .eq('user_id', profile?.userId ?? '')
    .order('started_at', { ascending: false })
    .limit(3)

  // Si un session id est demandé (reprise de brouillon), on le charge
  let initialSession: {
    sessionId: string
    businessName: string
    city: string
    answers: Record<string, unknown>
  } | undefined

  if (requestedSessionId && profile?.userId) {
    const { data: draft } = await supabase
      .from('audit_gbp_sessions')
      .select('id, business_name, city, answers, completed_at')
      .eq('id', requestedSessionId)
      .eq('user_id', profile.userId)
      .is('completed_at', null)  // sécurité : on ne reprend pas un audit déjà terminé
      .maybeSingle()

    if (draft) {
      initialSession = {
        sessionId: draft.id,
        businessName: draft.business_name ?? '',
        city: draft.city ?? '',
        answers: (draft.answers ?? {}) as Record<string, unknown>,
      }
    }
  }

  return <AuditGbpView userId={profile?.userId ?? null} initialSession={initialSession} pastAudits={(pastAudits ?? []) as PastAudit[]} />
}
