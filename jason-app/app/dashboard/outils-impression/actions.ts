'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/queries/profile'

export async function saveAffiche({
  logementId,
  data,
  existingId,
}: {
  logementId: string
  data: Record<string, unknown>
  existingId?: string
}) {
  const profile = await getProfile()
  if (!profile?.userId) return { error: 'Non authentifié' }

  const supabase = await createClient()

  if (existingId) {
    const { error } = await supabase
      .from('affiches')
      .update({ data, updated_at: new Date().toISOString() })
      .eq('id', existingId)
      .eq('user_id', profile.userId)
    if (error) return { error: error.message }
    return { id: existingId }
  }

  const { data: row, error } = await supabase
    .from('affiches')
    .insert({ user_id: profile.userId, logement_id: logementId, data })
    .select('id')
    .single()
  if (error) return { error: error.message }
  return { id: row.id }
}

export async function getAfficheByLogement(logementId: string) {
  const profile = await getProfile()
  if (!profile?.userId) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('affiches')
    .select('id, data')
    .eq('user_id', profile.userId)
    .eq('logement_id', logementId)
    .maybeSingle()
  return data
}

export async function getAfficheById(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('affiches')
    .select('id, data, logement_id, user_id')
    .eq('id', id)
    .maybeSingle()
  return data
}
