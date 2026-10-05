'use server'
// Case « Recevoir mon bilan chaque mois par e-mail » de Mes statistiques
// (05/10/2026). Propriétaire d'une fiche seulement : drapeau
// « mail:bilan-off » dans profiles.onboarding_completed_steps (le bilan part
// par défaut, lib/email/pro-monthly.ts).
import { createClient } from '@/lib/supabase/server'
import { invalidateProfileCache } from '@/lib/queries/profile'
import { MONTHLY_OFF_FLAG } from './pro-stats'

export async function setMonthlyReport(on: boolean): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée, reconnecte-toi.' }

  // Seulement pour un compte qui a une fiche pro (RLS : sa propre fiche)
  const [{ data: photo }, { data: menage }] = await Promise.all([
    supabase.from('photographers').select('id').eq('user_id', user.id).maybeSingle(),
    supabase.from('cleaners').select('id').eq('user_id', user.id).maybeSingle(),
  ])
  if (!photo && !menage) return { error: 'Aucune fiche rattachée à ton compte.' }

  // Lecture fraîche (pas le profil en cache) : d'autres drapeaux vivent dans ce tableau
  const { data: row, error: readError } = await supabase.from('profiles').select('onboarding_completed_steps').eq('id', user.id).maybeSingle()
  if (readError) return { error: 'Réglage impossible pour le moment, réessaie.' }
  const steps = new Set(((row?.onboarding_completed_steps as string[] | null) ?? []))
  if (on) steps.delete(MONTHLY_OFF_FLAG)
  else steps.add(MONTHLY_OFF_FLAG)
  const { error } = await supabase.from('profiles').update({ onboarding_completed_steps: Array.from(steps) }).eq('id', user.id)
  if (error) return { error: 'Réglage impossible pour le moment, réessaie.' }
  invalidateProfileCache(user.id)
  return { ok: true }
}
