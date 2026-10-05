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

  // NOTE PERF : ce helper est appele par le layout dashboard a chaque nav.
  // Les 7 tests d'existence (limit(1)) sont deja peu chers unitairement mais
  // cumules ~200-500ms/nav. Une tentative d'ajout de unstable_cache a echoue
  // (crash "Server Components render error" en prod, digest 1400304292 puis
  // 2153635556 — probable interaction avec le contexte de la requete Next.js
  // sur le service role). On garde la version directe qui reste correcte.
  // Optimisation possible future : passer par une API route dediee OR
  // deplacer detectTracksProgress hors du layout critique (fetch lazy via
  // client component + suspense apres le first paint).
  const exists = (q: { data: unknown[] | null }) => Array.isArray(q.data) && q.data.length > 0

  const [logements, sejours, contracts, audits, chezNousPosts, affiches, icalFeeds, icalToken] = await Promise.all([
    supabase.from('logements')          .select('id').eq('user_id', userId).limit(1),
    supabase.from('sejours')            .select('id').eq('user_id', userId).limit(1),
    supabase.from('contracts')          .select('id').eq('user_id', userId).neq('statut', 'annule').limit(1),
    supabase.from('audit_gbp_sessions') .select('id').eq('user_id', userId).limit(1),
    supabase.from('chez_nous_posts')    .select('id').eq('author_id', userId).limit(1),
    supabase.from('affiches')           .select('id').eq('user_id', userId).limit(1),
    supabase.from('ical_feeds')         .select('id').eq('user_id', userId).limit(1),
    // Planning ménage partagé : le lien de l'équipe utilise profiles.ical_token
    supabase.from('profiles')           .select('ical_token').eq('id', userId).not('ical_token', 'is', null).limit(1),
  ])

  const auto: Record<string, boolean> = {
    logement:        exists(logements),
    sejour:          exists(sejours),
    contrat:         exists(contracts),
    gbp_audit:       exists(audits),
    chez_nous_intro: !!chezNousOnboardedAt,
    chez_nous_post:  exists(chezNousPosts),
    affiche:         exists(affiches),
    stripe_connect:  stripeOnboardingComplete,
    ical_connected:  exists(icalFeeds),
    menage_shared:   exists(icalToken),
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

// ── Mémoire courte (05/10/2026) ─────────────────────────────────────────
// La base (offre gratuite de Supabase, 0,5 Go) sature sa mémoire : chaque
// requête évitée à l'ouverture compte. Ces 8 tests d'existence étaient
// refaits à chaque chargement du menu. unstable_cache a déjà planté ici en
// prod (voir plus haut) : simple mémoire du serveur, par compte, 60 s. Les
// réponses ne contiennent que des cases cochées du compte lui-même (clé =
// identifiant + drapeaux du profil : cocher une étape à la main change la
// clé, donc pas d'attente). Effet visible : une étape détectée en base
// (premier logement, premier contrat…) peut mettre jusqu'à 1 min à se cocher.
const MEMO_TTL_MS = 60_000
const MEMO_MAX = 500
const memo = new Map<string, { at: number; value: OnboardingTracksState }>()

export async function detectTracksProgressCached(input: DetectInput): Promise<OnboardingTracksState> {
  const key = JSON.stringify([input.userId, [...(input.completedSteps ?? [])].sort(), input.chezNousOnboardedAt, input.onboardingStep, input.stripeOnboardingComplete])
  const hit = memo.get(key)
  if (hit && Date.now() - hit.at < MEMO_TTL_MS) return hit.value
  const value = await detectTracksProgress(input)
  if (memo.size >= MEMO_MAX) {
    const oldest = memo.keys().next().value
    if (oldest !== undefined) memo.delete(oldest)
  }
  memo.set(key, { at: Date.now(), value })
  return value
}
