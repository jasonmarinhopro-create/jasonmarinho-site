import { Resend } from 'resend'
import { buildEmail, emailBtn, emailInfoBlock, emailP, emailAnnuairesPromo, escHtml } from './template'

// Module dédié aux notifications email envoyées AU HÔTE (vs les emails
// envoyés au voyageur pour signature contrat). Trois types pour l'instant :
// - séjour signé (contrat retourné signé)
// - paiement reçu (loyer ou caution via Stripe)
// - mention dans chez-nous (un autre membre te @ mentionne ou répond)
//
// Best-effort : on ne throw jamais, les erreurs sont loguées. L'envoi ne
// doit jamais bloquer une action métier (signature, paiement, post).

const FROM_EMAIL = 'Jason Marinho <noreply@jasonmarinho.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

let resend: Resend | null = null
function getResend(): Resend | null {
  if (resend) return resend
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[host email] RESEND_API_KEY missing, skip')
    return null
  }
  resend = new Resend(key)
  return resend
}

// ─── Préférences notifications hôte ──────────────────────────────────
// L'utilisateur peut désactiver chaque type via /dashboard/profil (futur).
// Pour l'instant : tous activés par défaut. Le check de préférence se fait
// dans le caller (qui passe `enabled: true/false`).

// ─── 1. Séjour signé ─────────────────────────────────────────────────
export async function sendSejourSignedEmail(opts: {
  to: string
  hostFirstName: string
  guestFullName: string
  logementName?: string
  dateArrivee: string
  dateDepart: string
  montant: number
  contractUrl: string
}): Promise<void> {
  const r = getResend()
  if (!r) return

  const subject = `${opts.guestFullName} a signé le contrat`
  const dateRange = formatDateRange(opts.dateArrivee, opts.dateDepart)

  const body = `
    ${emailP(`Salut ${escHtml(opts.hostFirstName)},`)}
    ${emailP(`Bonne nouvelle, <strong>${escHtml(opts.guestFullName)}</strong> vient de signer le contrat de location.`)}
    ${emailInfoBlock([
      ...(opts.logementName ? [{ label: 'Logement', value: opts.logementName }] : []),
      { label: 'Séjour',     value: dateRange },
      { label: 'Voyageur',   value: opts.guestFullName },
      { label: 'Loyer',      value: formatEur(opts.montant) },
    ], '#34D399')}
    ${emailP(`Tu peux consulter le contrat signé et préparer la suite (caution, check-in) depuis ton espace.`)}
    <div style="text-align:center;margin:24px 0;">
      ${emailBtn(opts.contractUrl, 'Voir le contrat signé', 'primary')}
    </div>
    ${emailP(`Pense aussi à demander à <strong>${escHtml(opts.guestFullName)}</strong> son téléphone et sa pièce d'identité avant l'arrivée si ce n'est pas déjà fait.`)}
    ${emailAnnuairesPromo()}
  `

  try {
    await r.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject,
      html: buildEmail({ title: subject, body, preview: `Séjour ${dateRange} · ${formatEur(opts.montant)}` }),
    })
  } catch (e) {
    console.error('[host email] sejour signed failed', e)
  }
}

// ─── 2. Paiement reçu ────────────────────────────────────────────────
export async function sendPaiementReceivedEmail(opts: {
  to: string
  hostFirstName: string
  guestFullName: string
  type: 'loyer' | 'caution'
  montant: number
  dateArrivee?: string
  dashboardUrl?: string
}): Promise<void> {
  const r = getResend()
  if (!r) return

  const typeLabel = opts.type === 'loyer' ? 'Loyer' : 'Caution'
  const subject = `${typeLabel} reçu de ${opts.guestFullName} — ${formatEur(opts.montant)}`

  const body = `
    ${emailP(`Salut ${escHtml(opts.hostFirstName)},`)}
    ${emailP(`Tu viens de recevoir <strong>${formatEur(opts.montant)}</strong> de <strong>${escHtml(opts.guestFullName)}</strong>${opts.type === 'caution' ? ' (caution bloquée via Stripe)' : ''}.`)}
    ${emailInfoBlock([
      { label: 'Type',      value: typeLabel },
      { label: 'Montant',   value: formatEur(opts.montant) },
      { label: 'Voyageur',  value: opts.guestFullName },
      ...(opts.dateArrivee ? [{ label: 'Séjour', value: formatDate(opts.dateArrivee) }] : []),
    ], '#34D399')}
    ${opts.type === 'caution'
      ? emailP(`La caution est <strong>bloquée</strong> sur la carte du voyageur (capture manuelle possible). Elle ne te sera pas créditée tant que tu ne la captures pas en cas de dégât.`)
      : emailP(`Le virement Stripe arrive sur ton compte bancaire sous 2-7 jours ouvrés selon ta config Connect.`)}
    ${opts.dashboardUrl ? `
    <div style="text-align:center;margin:24px 0;">
      ${emailBtn(opts.dashboardUrl, 'Voir le détail', 'primary')}
    </div>` : ''}
  `

  try {
    await r.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject,
      html: buildEmail({ title: subject, body, preview: `${typeLabel} ${formatEur(opts.montant)}` }),
    })
  } catch (e) {
    console.error('[host email] paiement received failed', e)
  }
}

// ─── 3. Mention chez-nous ────────────────────────────────────────────
// Envoyé quand un membre te @ mentionne ou répond à un de tes posts /
// commentaires dans le forum chez-nous. Limité à 1 email/jour/destinataire
// max (digest) : géré par le caller via une table d'agrégation si besoin.
export async function sendMentionEmail(opts: {
  to: string
  recipientFirstName: string
  actorFullName: string
  type: 'reply' | 'mention' | 'accepted'
  postTitle: string
  postUrl: string
  excerpt?: string
}): Promise<void> {
  const r = getResend()
  if (!r) return

  const verbBySubject: Record<string, string> = {
    reply: `${opts.actorFullName} a répondu à ton post`,
    mention: `${opts.actorFullName} t'a mentionné dans Entre Hôtes`,
    accepted: `${opts.actorFullName} a accepté ta réponse`,
  }
  const subject = verbBySubject[opts.type] ?? `Activité Entre Hôtes`

  const verb = opts.type === 'reply'
    ? `a répondu à ton sujet`
    : opts.type === 'accepted'
      ? `a marqué ta réponse comme acceptée 🎉`
      : `t'a mentionné dans un message`

  const body = `
    ${emailP(`Salut ${escHtml(opts.recipientFirstName)},`)}
    ${emailP(`<strong>${escHtml(opts.actorFullName)}</strong> ${verb} :`)}
    <div style="background:#0d1a15;border:1px solid #1e3d2f;border-radius:10px;padding:14px 18px;margin:16px 0;">
      <div style="font-size:14px;font-weight:600;color:#f0ebe1;margin-bottom:6px;">${escHtml(opts.postTitle)}</div>
      ${opts.excerpt ? `<div style="font-size:13px;color:#a5c4b0;line-height:1.55;">${escHtml(opts.excerpt.slice(0, 200))}${opts.excerpt.length > 200 ? '…' : ''}</div>` : ''}
    </div>
    <div style="text-align:center;margin:24px 0;">
      ${emailBtn(opts.postUrl, 'Voir le message', 'primary')}
    </div>
    ${emailP(`Tu peux <a href="${APP_URL}/dashboard/profil" style="color:#a5c4b0;">gérer tes notifications</a> depuis ton profil.`)}
  `

  try {
    await r.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject,
      html: buildEmail({ title: subject, body, preview: opts.postTitle }),
    })
  } catch (e) {
    console.error('[host email] mention failed', e)
  }
}

// ─── Helper haut niveau : envoi mention chez-nous depuis IDs ────────
// Récupère les infos nécessaires depuis la DB et envoie l'email. Utile
// dans les server actions du forum sans avoir à dupliquer la logique
// de fetch + format de message.
export async function sendChezNousNotifEmailFromIds(opts: {
  supabase: {
    from: (table: string) => {
      select: (cols: string) => { eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: unknown | null }> } }
    }
  }
  recipientUserId: string
  actorUserId: string
  type: 'reply' | 'mention' | 'accepted'
  postId: string
  excerpt?: string
}): Promise<void> {
  if (opts.recipientUserId === opts.actorUserId) return
  try {
    type ProfileRow = { email: string | null; full_name: string | null; pseudo: string | null }
    type PostRow = { title: string | null }

    const [recipResult, actorResult, postResult] = await Promise.all([
      opts.supabase.from('profiles').select('email, full_name, pseudo').eq('id', opts.recipientUserId).maybeSingle(),
      opts.supabase.from('profiles').select('email, full_name, pseudo').eq('id', opts.actorUserId).maybeSingle(),
      opts.supabase.from('chez_nous_posts').select('title').eq('id', opts.postId).maybeSingle(),
    ])
    const recipient = recipResult.data as ProfileRow | null
    const actor = actorResult.data as ProfileRow | null
    const post = postResult.data as PostRow | null

    if (!recipient?.email || !post?.title) return

    const recipientName = (recipient.full_name?.trim().split(' ')[0]) || recipient.pseudo || 'hôte'
    const actorName = actor?.full_name?.trim() || actor?.pseudo || 'un membre'

    await sendMentionEmail({
      to: recipient.email,
      recipientFirstName: recipientName,
      actorFullName: actorName,
      type: opts.type,
      postTitle: post.title,
      postUrl: `${APP_URL}/dashboard/chez-nous/${opts.postId}`,
      excerpt: opts.excerpt,
    })
  } catch (e) {
    console.warn('[host email] chez-nous notif email failed', e)
  }
}

// ─── Helpers locaux ──────────────────────────────────────────────────
function formatEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}
function formatDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const e = new Date(end + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${s} → ${e}`
}
