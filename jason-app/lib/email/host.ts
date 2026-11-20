import { buildEmail, emailBtn, emailCitation, emailFiche, emailLink, emailP, emailSmall, escHtml } from './template'
import { sendEmail } from './send'

// Notifications e-mail envoyées À L'HÔTE (les e-mails au voyageur sont dans
// les routes de contrat) : paiement reçu (loyer ou caution via Stripe) et
// activité Entre Hôtes (réponse, mention, réponse acceptée). Le contrat signé
// part de app/api/contracts/sign/route.ts.
//
// Best-effort : ne lève jamais, l'envoi ne bloque aucune action métier.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

/** Contenu de l'e-mail « paiement reçu » (pur, pour la galerie et les tests) */
export function paiementReceivedEmail(opts: {
  hostFirstName: string
  guestFullName: string
  type: 'loyer' | 'caution'
  montant: number
  dateArrivee?: string
  dashboardUrl?: string
}): { subject: string; html: string } {
  const loyer = opts.type === 'loyer'
  const subject = loyer
    ? `Loyer reçu de ${opts.guestFullName} : ${formatEur(opts.montant)}`
    : `Caution de ${opts.guestFullName} bloquée : ${formatEur(opts.montant)}`
  const body = [
    emailP(`Bonjour${opts.hostFirstName ? ` ${escHtml(opts.hostFirstName)}` : ''},`, 10),
    emailP(loyer
      ? `<strong>${escHtml(opts.guestFullName)}</strong> vient de payer son loyer en ligne.`
      : `La caution de <strong>${escHtml(opts.guestFullName)}</strong> est bloquée sur sa carte.`),
    emailFiche([
      [loyer ? 'Loyer' : 'Caution', formatEur(opts.montant)],
      ['Voyageur', opts.guestFullName],
      ...(opts.dateArrivee ? [['Arrivée', formatDate(opts.dateArrivee)] as [string, string]] : []),
    ]),
    emailP(loyer
      ? 'Le paiement arrive sur ton compte Stripe, puis sur ton compte bancaire selon le calendrier de versement de Stripe.'
      : 'Rien n’est débité : la carte est bloquée environ 7 jours. Libère la caution après l’état des lieux, ou encaisse-la en cas de dégâts.'),
    opts.dashboardUrl ? emailBtn(opts.dashboardUrl, 'Voir la fiche voyageur') : '',
  ].join('')
  return { subject, html: buildEmail({ track: 'paiement-hote', etiquette: loyer ? 'Paiement reçu' : 'Caution', title: loyer ? 'Loyer reçu' : 'Caution bloquée', body, preview: `${opts.guestFullName} · ${formatEur(opts.montant)}` }) }
}

export async function sendPaiementReceivedEmail(opts: Parameters<typeof paiementReceivedEmail>[0] & { to: string }): Promise<void> {
  const mail = paiementReceivedEmail(opts)
  const r = await sendEmail({ to: opts.to, ...mail, categorie: 'paiement-hote' })
  if (!r.ok) console.error('[host email] paiement received failed', r.error)
}

/** Contenu de l'e-mail Entre Hôtes (pur) */
export function mentionEmail(opts: {
  recipientFirstName: string
  actorFullName: string
  type: 'reply' | 'mention' | 'accepted'
  postTitle: string
  postUrl: string
  excerpt?: string
}): { subject: string; html: string } {
  const subjects: Record<string, string> = {
    reply: `${opts.actorFullName} a répondu à ton sujet`,
    mention: `${opts.actorFullName} t’a mentionné dans Entre Hôtes`,
    accepted: `${opts.actorFullName} a accepté ta réponse`,
  }
  const verb = opts.type === 'reply' ? 'a répondu à ton sujet' : opts.type === 'accepted' ? 'a choisi ta réponse comme la bonne. Merci pour ton aide' : 't’a mentionné dans un message'
  const excerpt = opts.excerpt ? `${opts.excerpt.slice(0, 220)}${opts.excerpt.length > 220 ? '…' : ''}` : ''
  const body = [
    emailP(`Bonjour ${escHtml(opts.recipientFirstName)},`, 10),
    emailP(`<strong>${escHtml(opts.actorFullName)}</strong> ${verb}${opts.type === 'accepted' ? '.' : ' :'}`),
    `<p style="margin:0 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.35;color:#0F1F17;">${escHtml(opts.postTitle)}</p>`,
    excerpt ? emailCitation(excerpt) : '',
    emailBtn(opts.postUrl, opts.type === 'accepted' ? 'Voir le sujet' : 'Lire et répondre'),
    emailSmall(`Tu reçois cet e-mail parce que tu participes à Entre Hôtes. ${emailLink(`${APP_URL}/dashboard/profil`, 'Gérer mes notifications')}`),
  ].join('')
  return { subject: subjects[opts.type] ?? 'Activité Entre Hôtes', html: buildEmail({ track: 'entre-hotes', etiquette: 'Entre Hôtes', title: subjects[opts.type] ?? 'Activité Entre Hôtes', body, preview: opts.postTitle }) }
}

export async function sendMentionEmail(opts: Parameters<typeof mentionEmail>[0] & { to: string }): Promise<void> {
  const mail = mentionEmail(opts)
  const r = await sendEmail({ to: opts.to, ...mail, replyTo: null, categorie: 'entre-hotes' })
  if (!r.ok) console.error('[host email] mention failed', r.error)
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
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })
}
