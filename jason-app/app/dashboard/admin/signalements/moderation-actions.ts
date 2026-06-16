'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { buildEmail, emailInfoBlock, emailBtn, emailNote, emailP, escHtml } from '@/lib/email/template'
import { revalidatePath } from 'next/cache'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }
const NOTIFY_EMAIL = 'contact@jasonmarinho.com'
const FROM_EMAIL = 'notifications@jasonmarinho.com'

function getServiceClient(): SupabaseClient<any, 'public', any> {
  return createServiceClient<any, 'public', any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function requireAdmin(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role !== 'admin') return { error: 'Réservé administrateur' }
  return { userId: user.id }
}

/**
 * Trigger un rebuild du site statique après une décision de modération.
 * Fire-and-forget : si l'env var n'est pas posée (dev local), on no-op.
 * Le webhook est créé dans Vercel → Settings → Git → Deploy Hooks.
 */
async function triggerStaticRebuild() {
  const url = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!url) {
    console.warn('[triggerStaticRebuild] VERCEL_DEPLOY_HOOK_URL non posé — site statique ne se rebuild pas auto. Pose la var dans Vercel Settings → Environment Variables.')
    return
  }
  try {
    const res = await fetch(url, { method: 'POST' })
    if (!res.ok) {
      console.error(`[triggerStaticRebuild] Webhook a répondu ${res.status}`)
    } else {
      console.log('[triggerStaticRebuild] ✓ Rebuild déclenché sur le site statique')
    }
  } catch (err) {
    console.error('[triggerStaticRebuild] Fetch échoué:', err)
  }
}

/**
 * Server action exposée à l'admin pour déclencher un rebuild manuel.
 * Utile quand le webhook auto ne déclenche pas (env var absente, panne
 * Vercel, ou pour reforcer après une migration).
 */
export async function forceStaticRebuild(): Promise<{ ok?: boolean; error?: string; hookConfigured?: boolean }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }
  const url = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!url) {
    return {
      error: 'VERCEL_DEPLOY_HOOK_URL non configuré. Va dans Vercel → projet site statique → Settings → Git → Deploy Hooks pour créer le hook, puis pose l\'URL dans les env vars du projet jason-app.',
      hookConfigured: false,
    }
  }
  try {
    const res = await fetch(url, { method: 'POST' })
    if (!res.ok) return { error: `Webhook a répondu ${res.status}`, hookConfigured: true }
    return { ok: true, hookConfigured: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erreur réseau', hookConfigured: true }
  }
}

/**
 * Génère un slug SEO-friendly à partir des données anonymisées du signalement.
 * Format : [type-court]-[mois-annee]-[id6]
 * Ex: arnaque-wero-juin-2026-dde44c
 *
 * Volontairement SANS la ville : le SEO et la valeur d'un signalement
 * portent sur le PATTERN d'arnaque (type + récit), pas le lieu. La ville
 * reste affichée en métadonnée discrète sur la page.
 */
function slugify(input: string): string {
  return input
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function generateSlug(report: { id: string; public_summary: string | null; public_city: string | null; public_month: string | null; incident_type: string | null }): string {
  const typePart = report.incident_type ? slugify(report.incident_type).slice(0, 40) : 'signalement'
  const monthPart = report.public_month
    ? (() => {
        const [y, m] = report.public_month.split('-')
        const MOIS = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre']
        return `${MOIS[parseInt(m) - 1]}-${y}`
      })()
    : 'recent'
  const idShort = report.id.slice(0, 6)  // évite collisions
  // "location-courte-duree" en bourrin dans le slug → différencie nos URLs
  // de signal-arnaques et autres généralistes, et capture l'intent SEO
  // "arnaque location courte durée" / "arnaque hôte LCD".
  return `${typePart}-location-courte-duree-${monthPart}-${idShort}`
}

/**
 * Génère un "hint" identifiant partiel pour la publication anonymisée.
 * Objectif : un hôte qui voit la même partie d'email/téléphone sur 2
 * signalements peut corréler (anti-récidive) sans qu'on identifie la
 * personne.
 *
 * Pseudonymisation CNIL conforme :
 *  - phone  → "06 78 ●● ●● ●●"  (4 chiffres visibles seulement)
 *  - email  → "ma***@gmail.com" (2 chars + masque + domaine)
 *  - name   → "Marie D."        (prénom + initiale)
 *
 * Retourne null si pas d'identifiant exploitable.
 */
function maskIdentifier(identifier: string, identifierType: string, name: string | null): string | null {
  const id = (identifier || '').trim()
  if (!id) return name ? maskName(name) : null

  if (identifierType === 'phone') {
    // Garde seulement les chiffres, prend les 4 premiers
    const digits = id.replace(/\D/g, '')
    // Si commence par 33 (FR), convertir en format 0X
    const normalized = digits.startsWith('33') ? '0' + digits.slice(2) : digits
    if (normalized.length < 4) return null
    const visible = normalized.slice(0, 4)
    return `${visible.slice(0, 2)} ${visible.slice(2, 4)} ●● ●● ●●`
  }

  if (identifierType === 'email') {
    const atIdx = id.lastIndexOf('@')
    if (atIdx < 1) return null
    const local = id.slice(0, atIdx)
    const domain = id.slice(atIdx + 1)
    // 2 premières lettres du local + *** + domaine entier (les domaines
    // génériques type gmail.com / yahoo.fr / outlook.com n'identifient
    // personne)
    const localMask = local.slice(0, 2) + '***'
    return `${localMask}@${domain}`
  }

  if (identifierType === 'name') {
    return maskName(id)
  }

  return null
}

function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]
  // Prénom + initiale du nom de famille
  const first = parts[0]
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase()
  return `${first} ${lastInitial}.`
}

/**
 * Approuve la publication anonymisée d'un signalement.
 * Génère le slug, marque approved, déclenche le rebuild.
 */
export async function approvePublicSignalement(
  reportId: string,
  overrides?: { public_summary?: string; public_city?: string },
): Promise<{ success?: boolean; error?: string; slug?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }

  const admin = getServiceClient()
  const { data: report, error: fetchErr } = await admin
    .from('reported_guests')
    .select('id, identifier, identifier_type, name, public_summary, public_city, public_month, incident_type, moderation_status')
    .eq('id', reportId)
    .maybeSingle()

  if (fetchErr || !report) return { error: 'Signalement introuvable' }
  if (report.moderation_status !== 'pending') {
    return { error: `Le signalement n'est pas en attente (statut actuel : ${report.moderation_status})` }
  }

  const summary = (overrides?.public_summary ?? report.public_summary ?? '').trim().slice(0, 600)
  const city = (overrides?.public_city ?? report.public_city ?? '').trim().slice(0, 80)
  if (!summary || summary.length < 30) {
    return { error: 'Le résumé public doit faire au moins 30 caractères.' }
  }
  // city = optionnel : pertinent uniquement sur les nuisances/dégradations
  // localisées, pas sur les arnaques génériques (WERO/virement/phishing).

  const slug = generateSlug({ ...report, public_summary: summary, public_city: city })
  // Hint identifiant partiel (4 premiers chiffres tel / 2 lettres email /
  // prénom + initiale). Généré à l'approbation depuis les champs privés.
  const identifierHint = maskIdentifier(
    report.identifier ?? '',
    report.identifier_type ?? '',
    report.name ?? null,
  )

  const { error: updErr, data: updData } = await admin
    .from('reported_guests')
    .update({
      moderation_status: 'approved',
      moderation_decided_at: new Date().toISOString(),
      moderation_decided_by: auth.userId,
      public_summary: summary,
      public_city: city,
      public_slug: slug,
      public_identifier_hint: identifierHint,
      public_visible: true,
      is_validated: true,  // côté privé aussi : visible pour la recherche hôtes
    })
    .eq('id', reportId)
    .select('id, moderation_status, public_slug')

  if (updErr) {
    console.error('[approvePublicSignalement] UPDATE failed:', updErr)
    return { error: `Update échoué : ${updErr.message}${updErr.hint ? ` (${updErr.hint})` : ''}${updErr.code ? ` [code:${updErr.code}]` : ''}` }
  }
  if (!updData || updData.length === 0) {
    console.error('[approvePublicSignalement] UPDATE affected 0 rows, reportId=', reportId)
    return { error: 'L\'update n\'a affecté aucune ligne. Le signalement existe-t-il encore ?' }
  }
  console.log(`[approvePublicSignalement] ✓ approved id=${reportId} slug=${slug}`)

  triggerStaticRebuild()
  revalidatePath('/dashboard/admin/qg', 'page')
  return { success: true, slug }
}

export async function rejectPublicSignalement(
  reportId: string,
  reason?: string,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }

  const admin = getServiceClient()
  const { error } = await admin
    .from('reported_guests')
    .update({
      moderation_status: 'rejected',
      moderation_decided_at: new Date().toISOString(),
      moderation_decided_by: auth.userId,
      moderation_note: reason?.trim().slice(0, 500) ?? null,
      public_visible: false,
    })
    .eq('id', reportId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/qg')
  return { success: true }
}

/**
 * Retire un signalement déjà publié (suite à demande de la personne
 * signalée OU décision admin). Le statut "removed" est conservé pour
 * audit + pour que le build script puisse générer un 410 Gone propre.
 */
export async function removePublicSignalement(
  reportId: string,
  reason?: string,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }

  const admin = getServiceClient()
  const { error } = await admin
    .from('reported_guests')
    .update({
      moderation_status: 'removed',
      moderation_decided_at: new Date().toISOString(),
      moderation_decided_by: auth.userId,
      moderation_note: reason?.trim().slice(0, 500) ?? null,
      public_visible: false,
    })
    .eq('id', reportId)

  if (error) return { error: error.message }

  triggerStaticRebuild()
  revalidatePath('/dashboard/admin/qg')
  return { success: true }
}

/**
 * Récupère la queue de modération + les demandes de retrait pour la page admin.
 */
export async function getModerationQueue(): Promise<{
  pending: Array<{ id: string; identifier: string; identifier_type: string; name: string | null; incident_type: string | null; description: string | null; public_summary: string | null; public_city: string | null; public_month: string | null; reported_at: string; reporter_id: string }>
  removalRequests: Array<{ id: string; public_slug: string | null; public_summary: string | null; removal_request_at: string; removal_request_email: string; removal_request_reason: string | null }>
  approved: Array<{ id: string; public_slug: string | null; public_summary: string | null; public_city: string | null; public_month: string | null; incident_type: string | null; moderation_decided_at: string | null }>
  approvedCount: number
  error?: string
}> {
  const auth = await requireAdmin()
  if ('error' in auth) return { pending: [], removalRequests: [], approved: [], approvedCount: 0, error: auth.error }

  const admin = getServiceClient()

  const [pendingRes, removalRes, approvedRes, approvedListRes] = await Promise.all([
    admin.from('reported_guests')
      .select('id, identifier, identifier_type, name, incident_type, description, public_summary, public_city, public_month, reported_at, reporter_id')
      .eq('moderation_status', 'pending')
      .order('reported_at', { ascending: true })
      .limit(100),
    admin.from('reported_guests')
      .select('id, public_slug, public_summary, removal_request_at, removal_request_email, removal_request_reason')
      .not('removal_request_at', 'is', null)
      .eq('moderation_status', 'approved')
      .order('removal_request_at', { ascending: true })
      .limit(50),
    admin.from('reported_guests')
      .select('id', { count: 'exact', head: true })
      .eq('moderation_status', 'approved')
      .eq('public_visible', true),
    admin.from('reported_guests')
      .select('id, public_slug, public_summary, public_city, public_month, incident_type, moderation_decided_at')
      .eq('moderation_status', 'approved')
      .eq('public_visible', true)
      .order('moderation_decided_at', { ascending: false })
      .limit(100),
  ])

  return {
    pending: pendingRes.data ?? [],
    removalRequests: removalRes.data ?? [],
    approved: approvedListRes.data ?? [],
    approvedCount: approvedRes.count ?? 0,
  }
}

/**
 * Endpoint appelé par le serverless API du site statique
 * (/api/contester-signalement.js) quand une personne demande le retrait.
 * Validation minimale + notif email Jason. Ne supprime PAS automatiquement,
 * c'est Jason qui décide via removePublicSignalement() après vérif.
 *
 * Cette action n'a pas de garde-admin car elle est appelée depuis le site
 * public via le serverless function (qui a la SUPABASE_SERVICE_ROLE_KEY).
 * Pour empêcher l'abus, l'action est exposée via /api/* avec rate-limit.
 */
export async function registerRemovalRequest(params: {
  slug: string
  fullName: string
  email: string
  reason: string
}): Promise<{ success?: boolean; error?: string }> {
  const { slug, fullName, email, reason } = params
  if (!slug || !fullName || !email) return { error: 'Champs manquants' }
  if (!email.includes('@')) return { error: 'Email invalide' }

  const admin = getServiceClient()
  const { data: report } = await admin
    .from('reported_guests')
    .select('id, public_slug, public_summary, public_city, public_month')
    .eq('public_slug', slug)
    .eq('moderation_status', 'approved')
    .maybeSingle()

  if (!report) return { error: 'Signalement introuvable' }

  await admin
    .from('reported_guests')
    .update({
      removal_request_at: new Date().toISOString(),
      removal_request_email: email.trim().slice(0, 200),
      removal_request_reason: reason.trim().slice(0, 1000),
    })
    .eq('id', report.id)

  // Notif Jason
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: NOTIFY_EMAIL,
    subject: `⚠️ Demande de retrait signalement public · ${slug}`,
    html: buildEmail({
      title: 'Demande de retrait d\'un signalement public',
      body: `
        ${emailP('Une personne demande le retrait d\'un signalement publié sur jasonmarinho.com. Délai légal de réponse : 48h.')}
        ${emailInfoBlock([
          { label: 'Slug public', value: escHtml(slug) },
          { label: 'Nom déclaré', value: escHtml(fullName) },
          { label: 'Email de contact', value: escHtml(email) },
          { label: 'Motif', value: escHtml(reason || '(non renseigné)') },
        ], '#F97583')}
        ${emailBtn('https://app.jasonmarinho.com/dashboard/admin/qg', 'Examiner et décider', 'primary')}
        ${emailNote('Vérifie l\'identité du demandeur (preuve ID si nécessaire) avant retrait. En cas de doute juridique, retire par défaut.')}
      `,
    }),
  }).catch(() => {})

  return { success: true }
}
