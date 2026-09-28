'use server'

import { revalidatePath } from 'next/cache'
import { getServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { buildEmail, emailInfoBlock, emailBtn, emailNote, emailP, escHtml } from '@/lib/email/template'
import { rateLimit } from '@/lib/security/rate-limit'
import { parseQuery, reportIdentifiers, type QueryKind } from '@/lib/securite/identifiers'
import { findReports } from '@/lib/securite/lookup'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }
const NOTIFY_EMAIL = 'contact@jasonmarinho.com'
const FROM_EMAIL = 'notifications@jasonmarinho.com'

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
  /** OPT-IN explicite : version anonymisée publiée après modération. */
  make_public?: boolean
  public_summary?: string
  public_city?: string
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  // Anti-abus : 5 signalements par heure et par utilisateur
  const rl = await rateLimit('reportGuest', user.id, 5, 60 * 60 * 1000)
  if (!rl.allowed) return { error: 'Trop de signalements en peu de temps. Réessaie dans une heure.' }

  const { incident_type, description, make_public, public_summary, public_city } = formData
  const ids = reportIdentifiers(formData)
  if (!ids) return { error: 'Remplis au moins un champ : e-mail, téléphone ou nom.' }
  if (!incident_type?.trim()) return { error: 'Choisis un motif.' }
  if (!description || description.trim().length < 20) return { error: 'La description doit faire au moins 20 caractères.' }

  const publicSummaryClean = make_public && public_summary ? public_summary.trim().slice(0, 600) : null
  const publicCityClean = make_public && public_city ? public_city.trim().slice(0, 80) : null
  if (make_public && (!publicSummaryClean || publicSummaryClean.length < 30)) {
    return { error: 'Le résumé public anonymisé doit faire au moins 30 caractères.' }
  }

  const row = {
    identifier: ids.identifier,
    identifier_type: ids.identifier_type,
    name: ids.name,
    incident_type: incident_type.trim().slice(0, 120),
    description: description.trim().slice(0, 2000),
    reporter_id: user.id,
    is_validated: false,
    public_visible: !!make_public,
    public_summary: publicSummaryClean,
    public_city: publicCityClean,
    public_month: make_public ? new Date().toISOString().slice(0, 7) : null,
    moderation_status: make_public ? 'pending' : 'private',
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

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: NOTIFY_EMAIL,
    subject: `Nouveau signalement, ${incident_type}`,
    html: buildEmail({
      title: 'Signalement voyageur à relire',
      body: `
        ${emailInfoBlock([
          { label: 'Motif', value: escHtml(incident_type) },
          { label: 'Signalé par', value: escHtml(`${reporterName} (${reporterEmail})`) },
          ...(email ? [{ label: 'E-mail signalé', value: escHtml(email) }] : []),
          ...(phone ? [{ label: 'Téléphone signalé', value: escHtml(phone) }] : []),
          ...(ids.name ? [{ label: 'Nom signalé', value: escHtml(ids.name) }] : []),
          { label: 'Publication anonymisée', value: make_public ? 'Demandée' : 'Non' },
        ], '#F97583')}
        <div style="background:#0a1a13;border:1px solid #1a3328;border-radius:10px;padding:16px 18px;margin:0 0 20px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.5px;color:#7a9e8a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">DESCRIPTION</p>
          <p style="margin:0;font-size:14px;line-height:1.7;color:#e8ede8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${escHtml(description.trim())}</p>
        </div>
        ${emailBtn('https://app.jasonmarinho.com/dashboard/admin/signalements', 'Relire le signalement', 'primary')}
        ${emailNote('En attente de validation. Une fois validé, il apparaîtra dans les recherches des hôtes.')}
      `,
    }),
  }).catch(() => {})

  revalidatePath('/dashboard/securite')
  return { success: true }
}

/**
 * Retire un de MES signalements. Directement s'il n'est pas publié sur le
 * site ; sinon, demande à Jason (la page publique doit être retirée proprement).
 */
export async function withdrawMyReport(id: string): Promise<{ success?: boolean; requested?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const admin = getServiceClient()
  const { data: report } = await admin
    .from('reported_guests')
    .select('id, incident_type, moderation_status')
    .eq('id', id)
    .eq('reporter_id', user.id)
    .maybeSingle()
  if (!report) return { error: 'Signalement introuvable.' }

  if (report.moderation_status === 'approved') {
    await notifyJason(user.id, user.email ?? '', {
      title: "Un hôte retire son signalement publié",
      intro: "L'hôte qui a fait ce signalement souhaite le retirer. Il est publié sur le site : à retirer depuis la modération.",
      entryId: id,
      detail: report.incident_type,
    })
    return { requested: true }
  }

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
    intro: "Un hôte pense que ce signalement est faux ou ne vise pas la bonne personne. À vérifier dans la modération.",
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
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: NOTIFY_EMAIL,
    subject: p.title,
    html: buildEmail({
      title: p.title,
      body: `
        ${emailP(p.intro)}
        ${emailInfoBlock([
          { label: 'Hôte', value: escHtml(`${name} (${email})`) },
          { label: 'ID du signalement', value: escHtml(p.entryId) },
          ...(p.detail ? [{ label: 'Détail', value: escHtml(p.detail) }] : []),
        ], '#63D683')}
        ${emailBtn('https://app.jasonmarinho.com/dashboard/admin/signalements', 'Ouvrir la modération', 'primary')}
        ${emailNote('Droit à l\'effacement (RGPD, art. 17) : répondre dans un délai raisonnable.')}
      `,
    }),
  }).catch(() => {})
}
