'use server'

import { createClient } from '@/lib/supabase/server'
import { invalidateProfileCache } from '@/lib/queries/profile'
import { revalidatePath } from 'next/cache'

/**
 * Marque l'utilisateur comme ayant cliqué "Commencer" sur l'étape welcome.
 * Avance le step de 1→2 si pas déjà fait.
 */
export async function startOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_step: 2 })
    .eq('id', user.id)
    .lt('onboarding_step', 2)

  if (error) return { error: error.message }
  invalidateProfileCache(user.id)
  revalidatePath('/dashboard')
  return { ok: true }
}

/**
 * Synchronise onboarding_step avec l'état réel détecté.
 * Appelé après une action (création de logement, etc.) pour avancer.
 */
export async function syncOnboardingStep(detectedStep: number, completed: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const update: Record<string, unknown> = {
    onboarding_step: Math.min(detectedStep, 5),
  }
  if (completed) update.onboarding_completed_at = new Date().toISOString()

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', user.id)

  if (error) return { error: error.message }
  invalidateProfileCache(user.id)
  return { ok: true }
}

/**
 * L'utilisateur masque la checklist (bouton "X" en haut à droite).
 * Réversible depuis le centre d'aide.
 */
export async function dismissOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_dismissed: true })
    .eq('id', user.id)

  if (error) return { error: error.message }
  invalidateProfileCache(user.id)
  revalidatePath('/dashboard')
  return { ok: true }
}

/**
 * Réactive la checklist (depuis le centre d'aide ou les paramètres).
 */
export async function restoreOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_dismissed: false })
    .eq('id', user.id)

  if (error) return { error: error.message }
  invalidateProfileCache(user.id)
  revalidatePath('/dashboard')
  return { ok: true }
}

// ─── Multi-track onboarding actions ─────────────────────────────────────────

/**
 * Épingle un parcours d'onboarding (celui affiché dans le pill en bas à droite).
 */
export async function pinOnboardingTrack(trackKey: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_pinned_track: trackKey })
    .eq('id', user.id)

  if (error) return { error: error.message }
  invalidateProfileCache(user.id)
  revalidatePath('/dashboard')
  return { ok: true }
}

/**
 * Marque une étape "manuelle" comme faite (ou non faite).
 * Les étapes auto (logement, voyageur…) ignorent cette fonction.
 */
export async function markOnboardingStep(stepKey: string, done: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: row } = await supabase
    .from('profiles')
    .select('onboarding_completed_steps')
    .eq('id', user.id)
    .maybeSingle()

  const current: string[] = (row?.onboarding_completed_steps as string[] | null) ?? []
  const set = new Set(current)
  if (done) set.add(stepKey)
  else set.delete(stepKey)

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed_steps: Array.from(set) })
    .eq('id', user.id)

  if (error) return { error: error.message }
  invalidateProfileCache(user.id)
  revalidatePath('/dashboard')
  return { ok: true }
}
