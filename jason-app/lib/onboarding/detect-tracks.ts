// SERVER ONLY
// Computes per-step completion across all tracks by combining:
//  - DB queries (count > 0 for tables like logements, voyageurs, contracts…)
//  - Manual flags stored in profiles.onboarding_completed_steps
//  - Profile fields like chez_nous_onboarded_at

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

export async function detectTracksProgress(input: DetectInput): Promise<OnboardingTracksState> {
  const { userId, completedSteps, chezNousOnboardedAt, onboardingStep, stripeOnboardingComplete } = input
  const supabase = await createClient()
  const manualSet = new Set(completedSteps)

  const [logements, voyageurs, sejours, contracts, audits, chezNousPosts, affiches] = await Promise.all([
    supabase.from('logements')          .select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('voyageurs')          .select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('sejours')            .select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('contracts')          .select('id', { count: 'exact', head: true }).eq('user_id', userId).neq('statut', 'annule'),
    supabase.from('audit_gbp_sessions') .select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('chez_nous_posts')    .select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('affiches')           .select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  const auto: Record<string, boolean> = {
    logement:        (logements.count ?? 0) > 0,
    voyageur:        (voyageurs.count ?? 0) > 0,
    sejour:          (sejours.count ?? 0) > 0,
    contrat:         (contracts.count ?? 0) > 0,
    gbp_audit:       (audits.count ?? 0) > 0,
    chez_nous_intro: !!chezNousOnboardedAt,
    chez_nous_post:  (chezNousPosts.count ?? 0) > 0,
    affiche:         (affiches.count ?? 0) > 0,
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
