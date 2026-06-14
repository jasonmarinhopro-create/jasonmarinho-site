'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { buildEmail, emailInfoBlock, emailBtn, emailNote, emailP, escHtml } from '@/lib/email/template'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }
const NOTIFY_EMAIL = 'contact@jasonmarinho.com'
const FROM_EMAIL = 'notifications@jasonmarinho.com'

// Service role pour lecture des signalements validés communauté-wide. La RLS
// limite chaque hôte à ses propres reports, ce qui casserait la fonctionnalité
// "recherche dans la base communautaire". On vérifie l'auth de l'utilisateur
// AVANT de bypasser la RLS pour le SELECT lecture seule.
function getServiceClient(): SupabaseClient<any, 'public', any> {
  return createServiceClient<any, 'public', any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

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

  // Vérification auth via le client user-context (RLS active)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { results: [], error: 'Non authentifié.' }

  const q = query.trim().toLowerCase().replace(/[%_\\,]/g, '\\$&')

  // Recherche via service role : la base de signalements est communautaire,
  // chaque hôte authentifié doit pouvoir y chercher (pas juste ses reports).
  const admin = getServiceClient()
  const { data, error } = await admin
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
  /** OPT-IN explicite : si true, l'hôte accepte qu'une version anonymisée
   *  soit publiée publiquement après modération. Défaut = false (privé). */
  make_public?: boolean
  /** Résumé anonymisé custom (sinon généré côté admin lors de la modération).
   *  L'hôte peut le pré-remplir au moment du signalement. */
  public_summary?: string
  /** Ville où l'incident a eu lieu (publique, sans rue ni quartier). */
  public_city?: string
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { email, phone, full_name, incident_type, description, make_public, public_summary, public_city } = formData

  // Normalisation centralisée : numéros au format +33..., emails lowercased,
  // pas de trailing dot/espace. Garantit cohérence DB + matchings recherche.
  const { normalizePhone, normalizeEmail } = await import('@/lib/security/normalize-identifier')
  const emailVal = normalizeEmail(email ?? '')
  const phoneVal = normalizePhone(phone ?? '')
  const nameVal = full_name?.trim() || ''

  // Pick the primary identifier (email > phone > name)
  let primaryIdentifier = ''
  let primaryType = ''
  if (emailVal) { primaryIdentifier = emailVal; primaryType = 'email' }
  else if (phoneVal) { primaryIdentifier = phoneVal; primaryType = 'phone' }
  else if (nameVal) { primaryIdentifier = nameVal; primaryType = 'name' }

  if (!primaryIdentifier) {
    return { error: 'Remplis au moins un champ : e-mail, téléphone ou nom.' }
  }
  if (!description || description.trim().length < 20) {
    return { error: 'La description doit faire au moins 20 caractères.' }
  }

  // Récupère le profil du signalant
  const { data: reporterProfile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .maybeSingle()

  // Préparation des champs publics si opt-in. Tronqués/validés ici pour ne
  // pas faire confiance aveugle au front. Le slug et l'approbation finale
  // viendront du modérateur admin.
  const publicSummaryClean = make_public && public_summary
    ? public_summary.trim().slice(0, 600)  // max 600 chars
    : null
  const publicCityClean = make_public && public_city
    ? public_city.trim().slice(0, 80)
    : null
  const publicMonth = make_public
    ? new Date().toISOString().slice(0, 7)  // YYYY-MM (mois courant)
    : null

  // Create ONE row per submission
  const { error } = await supabase.from('reported_guests').insert({
    identifier: primaryIdentifier,
    identifier_type: primaryType,
    name: nameVal || null,
    incident_type,
    description: description.trim(),
    reporter_id: user.id,
    is_validated: false,
    public_visible: !!make_public,
    public_summary: publicSummaryClean,
    public_city: publicCityClean,
    public_month: publicMonth,
    moderation_status: make_public ? 'pending' : 'private',
  })

  if (error) {
    if (error.code === '42P01') return { error: 'TABLE_MISSING' }
    if (error.code === '42501') return { error: 'Accès refusé, vérifie les policies RLS dans Supabase.' }
    return { error: `Erreur Supabase : ${error.message}` }
  }

  // Notification email pour modération
  const reporterEmail = reporterProfile?.email ?? user.email ?? 'inconnu'
  const reporterName = reporterProfile?.full_name ?? reporterEmail

  const identifiersHtml = [
    emailVal ? `<li><strong>E-mail :</strong> ${emailVal}</li>` : '',
    phoneVal ? `<li><strong>Téléphone :</strong> ${phoneVal}</li>` : '',
    nameVal ? `<li><strong>Nom complet :</strong> ${nameVal}</li>` : '',
  ].filter(Boolean).join('')

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: NOTIFY_EMAIL,
    subject: `Nouveau signalement, ${incident_type}`,
    html: buildEmail({
      title: 'Signalement voyageur à modérer',
      body: `
        ${emailInfoBlock([
          { label: 'Type d\'incident', value: escHtml(incident_type) },
          { label: 'Signalé par', value: escHtml(`${reporterName} (${reporterEmail})`) },
          ...(emailVal ? [{ label: 'E-mail signalé', value: escHtml(emailVal) }] : []),
          ...(phoneVal ? [{ label: 'Téléphone signalé', value: escHtml(phoneVal) }] : []),
          ...(nameVal ? [{ label: 'Nom signalé', value: escHtml(nameVal) }] : []),
        ], '#F97583')}
        <div style="background:#0a1a13;border:1px solid #1a3328;border-radius:10px;padding:16px 18px;margin:0 0 20px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.5px;color:#7a9e8a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">DESCRIPTION</p>
          <p style="margin:0;font-size:14px;line-height:1.7;color:#e8ede8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${escHtml(description.trim())}</p>
        </div>
        ${emailBtn('https://app.jasonmarinho.com/dashboard/admin', 'Modérer le signalement', 'primary')}
        ${emailNote('Ce signalement est en attente de validation. Une fois approuvé, il sera visible par la communauté.')}
      `,
    }),
  }).catch(() => {
    // Ne pas bloquer si l'email échoue
  })

  return { success: true }
}

export async function requestDeletion(params: {
  entry_id: string
  identifier: string
  reason?: string
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { entry_id, identifier, reason } = params

  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .maybeSingle()

  const requesterEmail = requesterProfile?.email ?? user.email ?? 'inconnu'
  const requesterName = requesterProfile?.full_name ?? requesterEmail

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: NOTIFY_EMAIL,
    subject: `Demande de suppression RGPD, Art. 17`,
    html: buildEmail({
      title: 'Demande d\'effacement (RGPD)',
      body: `
        ${emailP('Une demande de suppression de fiche a été soumise conformément à l\'article 17 du RGPD (droit à l\'effacement).')}
        ${emailInfoBlock([
          { label: 'Demandé par', value: escHtml(`${requesterName} (${requesterEmail})`) },
          { label: 'ID de la fiche', value: escHtml(entry_id) },
          { label: 'Identifiant signalé', value: escHtml(identifier) },
          ...(reason ? [{ label: 'Motif', value: escHtml(reason) }] : []),
        ], '#60BEFF')}
        ${emailNote('Conformément au RGPD (Art. 17), cette demande doit être traitée dans un délai raisonnable. Connecte-toi à Supabase pour supprimer ou anonymiser la fiche concernée.')}
      `,
    }),
  }).catch(() => {})

  return { success: true }
}
