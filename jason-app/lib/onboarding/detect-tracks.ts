// SERVER ONLY
// Computes per-step completion across all tracks by combining:
//  - DB queries (count > 0 for tables like logements, voyageurs, contracts…)
//  - Manual flags stored in profiles.onboarding_completed_steps
//  - Profile fields like chez_nous_onboarded_at

import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ONBOARDING_TRACKS } from './tracks'

export interface TrackProgress {
  /** Track key */
  key: string
  /** Number of done steps */
  done: number
  /** Total steps in this track */
  total: number
  /** Done step keys */
  doneSteps: Set<string>
}

export interface OnboardingTracksState {
  /** Per-track progress */
  tracks: TrackProgress[]
  /** Total steps done across all tracks */
  totalDone: number
  /** Total steps across all tracks */
  totalSteps: number
}

interface DetectInput {
  userId: string
  /** profiles.onboarding_completed_steps */
  completedSteps: string[]
  /** profiles.chez_nous_onboarded_at */
  chezNousOnboardedAt: string | null
  /** profiles.onboarding_step (welcome detection) */
  onboardingStep: number
  /** profiles.stripe_onboarding_complete */
  stripeOnboardingComplete: boolean
}

// PERF : les 7 tests d'existence sont maintenant caches Next.js pendant
// 5 min avec un tag `onboarding-existence:{userId}`. Un utilisateur qui
// crée un logement peut invalider ce cache via revalidateTag depuis la
// server action correspondante. Sans ca : 7 queries * chaque nav = 300-
// 800ms bloquants cumules. Avec le cache : quasi 0ms apres le 1er render.
const fetchExistenceFlags = (userId: string) => unstable_cache(
  async () => {
    const supabase = await createClient()
    const [logements, voyageurs, sejours, contracts, audits, chezNousPosts, affiches] = await Promise.all([
      supabase.from('logements')          .select('id').eq('user_id', userId).limit(1),
      supabase.from('voyageurs')          .select('id').eq('user_id', userId).limit(1),
      supabase.from('sejours')            .select('id').eq('user_id', userId).limit(1),
      supabase.from('contracts')          .select('id').eq('user_id', userId).neq('statut', 'annule').limit(1),
      supabase.from('audit_gbp_sessions') .select('id').eq('user_id', userId).limit(1),
      supabase.from('chez_nous_posts')    .select('id').eq('author_id', userId).limit(1),
      supabase.from('affiches')           .select('id').eq('user_id', userId).limit(1),
    ])
    const exists = (q: { data: unknown[] | null }) => Array.isArray(q.data) && q.data.length > 0
    return {
      logement:        exists(logements),
      voyageur:        exists(voyageurs),
      sejour:          exists(sejours),
      contrat:         exists(contracts),
      gbp_audit:       exists(audits),
      chez_nous_post:  exists(chezNousPosts),
      affiche:         exists(affiches),
    }
  },
  ['onboarding-existence', userId],
  { revalidate: 300, tags: [`onboarding-existence:${userId}`] },
)()

export async function detectTracksProgress(input: DetectInput): Promise<OnboardingTracksState> {
  const { userId, completedSteps, chezNousOnboardedAt, onboardingStep, stripeOnboardingComplete } = input
  const manualSet = new Set(completedSteps)

  const flags = await fetchExistenceFlags(userId)

  const auto: Record<string, boolean> = {
    logement:        flags.logement,
    voyageur:        flags.voyageur,
    sejour:          flags.sejour,
    contrat:         flags.contrat,
    gbp_audit:       flags.gbp_audit,
    chez_nous_intro: !!chezNousOnboardedAt,
    chez_nous_post:  flags.chez_nous_post,
    affiche:         flags.affiche,
    stripe_connect:  stripeOnboardingComplete,
    // welcome est manuel mais on le considère fait dès que onboarding_step >= 2
    // (compat avec l'ancien système).
  }

  const tracks: TrackProgress[] = ONBOARDING_TRACKS.map(track => {
    const doneSteps = new Set<string>()
    track.steps.forEach(step => {
      if (step.key === 'welcome') {
        if (onboardingStep >= 2 || manualSet.has('welcome')) doneSteps.add(step.key)
        return
      }
      if (step.detect === 'auto') {
        if (auto[step.key]) doneSteps.add(step.key)
      } else {
        if (manualSet.has(step.key)) doneSteps.add(step.key)
      }
    })
    return {
      key: track.key,
      done: doneSteps.size,
      total: track.steps.length,
      doneSteps,
    }
  })

  const totalDone = tracks.reduce((sum, t) => sum + t.done, 0)
  const totalSteps = tracks.reduce((sum, t) => sum + t.total, 0)

  return { tracks, totalDone, totalSteps }
}
