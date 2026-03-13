'use server'

import { createClient } from '@/lib/supabase/server'

export async function searchGuest(query: string): Promise<{
  results: Array<{
    id: string
    identifier: string
    identifier_type: string
    name: string | null
    incident_type: string
    description: string | null
    reported_at: string
    reporter_city: string | null
  }>
  error?: string
}> {
  if (!query || query.trim().length < 3) {
    return { results: [], error: 'Entrez au moins 3 caractères.' }
  }

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { results: [], error: 'Non authentifié.' }

  const q = query.trim().toLowerCase()

  const { data, error } = await supabase
    .from('reported_guests')
    .select('id, identifier, identifier_type, name, incident_type, description, reported_at, reporter_city')
    .or(`identifier.ilike.%${q}%,name.ilike.%${q}%`)
    .eq('is_validated', true)
    .order('reported_at', { ascending: false })
    .limit(10)

  if (error) return { results: [], error: 'Erreur lors de la recherche.' }
  return { results: data ?? [] }
}

export async function reportGuest(formData: {
  identifier: string
  identifier_type: 'email' | 'phone' | 'name'
  name?: string
  incident_type: string
  description: string
  reporter_city?: string
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié.' }

  if (!formData.identifier || formData.identifier.trim().length < 3) {
    return { error: 'L\'identifiant est trop court.' }
  }
  if (!formData.description || formData.description.trim().length < 20) {
    return { error: 'La description doit faire au moins 20 caractères.' }
  }

  const { error } = await supabase.from('reported_guests').insert({
    identifier: formData.identifier.trim().toLowerCase(),
    identifier_type: formData.identifier_type,
    name: formData.name?.trim() || null,
    incident_type: formData.incident_type,
    description: formData.description.trim(),
    reporter_city: formData.reporter_city?.trim() || null,
    reporter_id: session.user.id,
    is_validated: false, // pending moderation
  })

  if (error) return { error: 'Erreur lors du signalement. Réessaie.' }
  return { success: true }
}
