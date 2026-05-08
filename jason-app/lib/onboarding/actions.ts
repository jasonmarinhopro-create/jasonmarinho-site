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
