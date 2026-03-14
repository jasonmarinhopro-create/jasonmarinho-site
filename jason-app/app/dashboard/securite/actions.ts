'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const NOTIFY_EMAIL = 'jason@driing.co'
const FROM_EMAIL = 'notifications@jasonmarinho.com'

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

  // Récupère le profil du signalant
  const { data: reporterProfile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', session.user.id)
    .maybeSingle()

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

  // Notification email pour modération
  const reporterEmail = reporterProfile?.email ?? session.user.email ?? 'inconnu'
  const reporterName = reporterProfile?.full_name ?? reporterEmail

  const identifiersHtml = identifiers
    .map(({ identifier, identifier_type }) => `<li><strong>${identifier_type} :</strong> ${identifier}</li>`)
    .join('')

  await resend.emails.send({
    from: FROM_EMAIL,
    to: NOTIFY_EMAIL,
    subject: `🚨 Nouveau signalement voyageur — ${incident_type}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #dc2626;">🚨 Nouveau signalement à modérer</h2>

        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-weight: 600; color: #dc2626;">Type d'incident : ${incident_type}</p>
          <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.6;">${description.trim()}</p>
        </div>

        <div style="margin: 16px 0;">
          <p style="font-weight: 600; margin-bottom: 8px; color: #333;">Coordonnées signalées :</p>
          <ul style="margin: 0; padding-left: 20px; color: #555;">
            ${identifiersHtml}
            ${full_name?.trim() ? `<li><strong>Nom complet :</strong> ${full_name.trim()}</li>` : ''}
          </ul>
        </div>

        <p style="color: #666; font-size: 13px; margin-top: 16px;">
          <strong>Signalé par :</strong> ${reporterName} (${reporterEmail})
        </p>

        <p style="color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 12px; margin-top: 24px;">
          Ce signalement est en attente de modération sur jasonmarinho.com.<br>
          Une fois validé, il sera visible par la communauté.
        </p>
      </div>
    `,
  }).catch(() => {
    // Ne pas bloquer si l'email échoue
  })

  return { success: true }
}
