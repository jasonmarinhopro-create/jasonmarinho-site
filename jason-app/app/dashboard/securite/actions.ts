'use server'

import { revalidatePath } from 'next/cache'
import { getServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { buildEmail, emailCitation, emailInfoBlock, emailBtn, emailNote, emailP, escHtml, EMAIL_FROM } from '@/lib/email/template'
import { rateLimit } from '@/lib/security/rate-limit'
import { parseQuery, reportIdentifiers, type QueryKind } from '@/lib/securite/identifiers'
import { findReports } from '@/lib/securite/lookup'
import { emailTags } from '@/lib/email/tracking'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }
const NOTIFY_EMAIL = 'contact@jasonmarinho.com'
const FROM_EMAIL = EMAIL_FROM

export interface SearchHit {
  id: string
  incident_type: string
  description: string | null
  reported_at: string
}

// La base est communautaire : la recherche passe par le service role
// (lib/securite/lookup.ts) après vérification de l'utilisateur. On ne renvoie
// au navigateur ni l'identifiant ni le nom stockés : l'hôte les connaît déjà.
export async function searchGuest(query: string): Promise<{
  results: SearchHit[]
  kind?: QueryKind
  label?: string
  error?: string
}> {
  const parsed = parseQuery(query)
  if (!parsed.ok) return { results: [], error: parsed.error }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { results: [], error: 'Non authentifié.' }

  // Anti-aspiration de la base : 60 recherches par heure suffisent largement
  const rl = await rateLimit('searchGuest', user.id, 60, 60 * 60 * 1000)
  if (!rl.allowed) return { results: [], error: 'Beaucoup de recherches en peu de temps. Réessaie dans une heure.' }

  const { data, error } = await findReports(parsed.values, parsed.kind, 20)
  if (error) return { results: [], error: error === 'TABLE_MISSING' ? 'La base de signalements est indisponible.' : 'Erreur lors de la recherche.' }

  return {
    kind: parsed.kind,
    label: parsed.label,
    results: data.map(r => ({ id: r.id, incident_type: r.incident_type, description: r.description, reported_at: r.reported_at })),
  }
}

export async function reportGuest(formData: {
  email?: string
  phone?: string
  full_name?: string
  incident_type: string
  description: string
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  // Anti-abus : 5 signalements par heure et par utilisateur
  const rl = await rateLimit('reportGuest', user.id, 5, 60 * 60 * 1000)
  if (!rl.allowed) return { error: 'Trop de signalements en peu de temps. Réessaie dans une heure.' }

  const { incident_type, description } = formData
  const ids = reportIdentifiers(formData)
  if (!ids) return { error: 'Remplis au moins un champ : e-mail, téléphone ou nom.' }
  if (!incident_type?.trim()) return { error: 'Choisis un motif.' }
  if (!description || description.trim().length < 20) return { error: 'La description doit faire au moins 20 caractères.' }

  const row = {
    identifier: ids.identifier,
    identifier_type: ids.identifier_type,
    name: ids.name,
    incident_type: incident_type.trim().slice(0, 120),
    description: description.trim().slice(0, 2000),
    reporter_id: user.id,
    is_validated: false,
    // Plus de publication sur le site (Jason, 24/11/2026) : la base reste privée.
    public_visible: false,
    moderation_status: 'private',
  }

  // Un seul enregistrement par signalement, avec tous les identifiants
  // (colonne extra_identifiers : migration 20260928_113, tolérée si absente)
  let { error } = await supabase.from('reported_guests').insert({ ...row, extra_identifiers: ids.extra })
  if (error?.code === '42703' || error?.code === 'PGRST204') ({ error } = await supabase.from('reported_guests').insert(row))

  if (error) {
    if (error.code === '42P01') return { error: 'La base de signalements est indisponible.' }
    if (error.code === '42501') return { error: 'Accès refusé par la base. Préviens Jason.' }
    return { error: `Erreur : ${error.message}` }
  }

  const { data: reporterProfile } = await supabase.from('profiles').select('email, full_name').eq('id', user.id).maybeSingle()
  const reporterEmail = reporterProfile?.email ?? user.email ?? 'inconnu'
  const reporterName = reporterProfile?.full_name ?? reporterEmail
  const email = ids.identifier_type === 'email' ? ids.identifier : ''
  const phone = ids.identifier_type === 'phone' ? ids.identifier : ids.extra[0] ?? ''

  await getResend().emails.send({ tags: emailTags('admin'),
    from: FROM_EMAIL,
    to: NOTIFY_EMAIL,
    subject: `Nouveau signalement, ${incident_type}`,
    html: buildEmail({
      etiquette: 'Pour toi · Sécurité voyageur',
      title: 'Signalement voyageur à relire',
      body: `
        ${emailInfoBlock([
          { label: 'Motif', value: escHtml(incident_type) },
          { label: 'Signalé par', value: escHtml(`${reporterName} (${reporterEmail})`) },
          ...(email ? [{ label: 'E-mail signalé', value: escHtml(email) }] : []),
          ...(phone ? [{ label: 'Téléphone signalé', value: escHtml(phone) }] : []),
          ...(ids.name ? [{ label: 'Nom signalé', value: escHtml(ids.name) }] : []),
        ], '#C2344A')}
        ${emailCitation(description.trim())}
        ${emailBtn('https://app.jasonmarinho.com/dashboard/admin/signalements', 'Relire le signalement', 'primary')}
        ${emailNote('En attente de validation. Une fois validé, il apparaîtra dans les recherches des hôtes.')}
      `,
    }),
  }).catch(() => {})

  revalidatePath('/dashboard/securite')
  return { success: true }
}

/** Retire un de MES signalements (plus de page publique depuis le 24/11/2026). */
export async function withdrawMyReport(id: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const admin = getServiceClient()
  const { data: report } = await admin
    .from('reported_guests')
    .select('id')
    .eq('id', id)
    .eq('reporter_id', user.id)
    .maybeSingle()
  if (!report) return { error: 'Signalement introuvable.' }

  const { error } = await admin.from('reported_guests').delete().eq('id', id).eq('reporter_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/securite')
  return { success: true }
}

/** Un hôte pense qu'un signalement trouvé est faux ou vise la mauvaise personne. */
export async function contestReport(params: { entry_id: string; reason?: string }): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }
  const rl = await rateLimit('contestReport', user.id, 10, 60 * 60 * 1000)
  if (!rl.allowed) return { error: 'Trop de demandes. Réessaie dans une heure.' }

  await notifyJason(user.id, user.email ?? '', {
    title: 'Signalement contesté par un hôte',
    intro: "Un hôte pense que ce signalement est faux ou ne vise pas la bonne personne. À vérifier dans le QG, onglet Signalements.",
    entryId: params.entry_id,
    detail: params.reason?.trim().slice(0, 500),
  })
  return { success: true }
}

async function notifyJason(userId: string, fallbackEmail: string, p: { title: string; intro: string; entryId: string; detail?: string }) {
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', userId).maybeSingle()
  const email = profile?.email ?? fallbackEmail ?? 'inconnu'
  const name = profile?.full_name ?? email
  await getResend().emails.send({ tags: emailTags('admin'),
    from: FROM_EMAIL,
    to: NOTIFY_EMAIL,
    subject: p.title,
    html: buildEmail({
      etiquette: 'Pour toi · Sécurité voyageur',
      title: p.title,
      body: `
        ${emailP(p.intro)}
        ${emailInfoBlock([
          { label: 'Hôte', value: escHtml(`${name} (${email})`) },
          { label: 'ID du signalement', value: escHtml(p.entryId) },
          ...(p.detail ? [{ label: 'Détail', value: escHtml(p.detail) }] : []),
        ])}
        ${emailBtn('https://app.jasonmarinho.com/dashboard/admin/signalements', 'Ouvrir la modération', 'primary')}
        ${emailNote('Droit à l\'effacement (RGPD, art. 17) : répondre dans un délai raisonnable.')}
      `,
    }),
  }).catch(() => {})
}
