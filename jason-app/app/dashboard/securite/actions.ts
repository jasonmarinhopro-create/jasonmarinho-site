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

  if (error) {
    if (error.code === '42P01') return { results: [], error: 'TABLE_MISSING' }
    return { results: [], error: 'Erreur lors de la recherche.' }
  }
  return { results: data ?? [] }
}

export async function reportGuest(formData: {
  email?: string
  phone?: string
  full_name?: string
  incident_type: string
  description: string
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié.' }

  const { email, phone, full_name, incident_type, description } = formData

  const identifiers: { identifier: string; identifier_type: string }[] = []
  if (email?.trim()) identifiers.push({ identifier: email.trim().toLowerCase(), identifier_type: 'email' })
  if (phone?.trim()) identifiers.push({ identifier: phone.trim(), identifier_type: 'phone' })
  if (full_name?.trim()) identifiers.push({ identifier: full_name.trim(), identifier_type: 'name' })

  if (identifiers.length === 0) {
    return { error: 'Remplis au moins un champ : e-mail, téléphone ou nom.' }
  }
  if (!description || description.trim().length < 20) {
    return { error: 'La description doit faire au moins 20 caractères.' }
  }

  const rows = identifiers.map(({ identifier, identifier_type }) => ({
    identifier,
    identifier_type,
    name: full_name?.trim() || null,
    incident_type,
    description: description.trim(),
    reporter_id: session.user.id,
    is_validated: false,
  }))

  const { error } = await supabase.from('reported_guests').insert(rows)

  if (error) {
    if (error.code === '42P01') return { error: 'TABLE_MISSING' }
    if (error.code === '42501') return { error: 'Accès refusé — vérifie les policies RLS dans Supabase.' }
    return { error: `Erreur Supabase : ${error.message}` }
  }
  return { success: true }
}
