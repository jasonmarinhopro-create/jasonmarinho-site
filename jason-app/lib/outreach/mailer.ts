// Envoi et lecture de la boîte mail de Jason pour la prospection.
//
// Pourquoi pas Resend : ses conditions d'utilisation interdisent les e-mails
// non sollicités (prospection à froid, listes collectées). Un compte fermé
// couperait aussi tous les e-mails de l'app (contrats, cautions…). La
// prospection part donc de la vraie boîte de Jason, en SMTP, comme s'il
// écrivait lui-même : les réponses arrivent chez lui, et on les lit en IMAP
// pour arrêter la séquence d'un contact qui a répondu.
//
// Variables d'environnement (Vercel) :
//   OUTREACH_SMTP_HOST   ex. smtp.gmail.com (Google Workspace / Gmail), ssl0.ovh.net…
//   OUTREACH_SMTP_PORT   465 par défaut (SSL)
//   OUTREACH_SMTP_USER   adresse de connexion
//   OUTREACH_SMTP_PASS   mot de passe d'application (Google : compte avec validation en 2 étapes)
//   OUTREACH_FROM_EMAIL  adresse d'expédition (défaut : OUTREACH_SMTP_USER)
//   OUTREACH_FROM_NAME   défaut « Jason Marinho »
//   OUTREACH_IMAP_HOST   défaut : SMTP_HOST avec « smtp » remplacé par « imap »
//   OUTREACH_IMAP_PORT   993 par défaut

import 'server-only'
import nodemailer, { type Transporter } from 'nodemailer'
import { ImapFlow } from 'imapflow'
import { bouncedAddresses, isBounceSender, matchReply, messageIdsOf } from './engine'

export interface OutreachConfig {
  smtpHost: string
  smtpPort: number
  user: string
  pass: string
  fromEmail: string
  fromName: string
  imapHost: string
  imapPort: number
}

export function outreachConfig(): OutreachConfig | null {
  const smtpHost = process.env.OUTREACH_SMTP_HOST
  const user = process.env.OUTREACH_SMTP_USER
  const pass = process.env.OUTREACH_SMTP_PASS
  if (!smtpHost || !user || !pass) return null
  return {
    smtpHost,
    smtpPort: Number(process.env.OUTREACH_SMTP_PORT) || 465,
    user,
    pass,
    fromEmail: process.env.OUTREACH_FROM_EMAIL || user,
    fromName: process.env.OUTREACH_FROM_NAME || 'Jason Marinho',
    imapHost: process.env.OUTREACH_IMAP_HOST || smtpHost.replace(/^smtp\./i, 'imap.'),
    imapPort: Number(process.env.OUTREACH_IMAP_PORT) || 993,
  }
}

let transport: Transporter | null = null
function getTransport(cfg: OutreachConfig) {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: cfg.smtpHost,
      port: cfg.smtpPort,
      secure: cfg.smtpPort === 465,
      auth: { user: cfg.user, pass: cfg.pass },
      connectionTimeout: 15_000,
      socketTimeout: 20_000,
    })
  }
  return transport
}

export interface OutgoingMail {
  to: string
  subject: string
  text: string
  html: string
  inReplyTo?: string | null
  unsubscribeUrl: string
  /** URL qui reçoit la désinscription en un clic (RFC 8058) */
  oneClickUrl: string
}

export async function sendOutreachMail(cfg: OutreachConfig, mail: OutgoingMail): Promise<{ messageId: string }> {
  const info = await getTransport(cfg).sendMail({
    from: { name: cfg.fromName, address: cfg.fromEmail },
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    ...(mail.inReplyTo ? { inReplyTo: mail.inReplyTo, references: [mail.inReplyTo] } : {}),
    headers: {
      'List-Unsubscribe': `<${mail.oneClickUrl}>, <${mail.unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  })
  return { messageId: info.messageId }
}

/** Code SMTP définitif lié à l'adresse (boîte inexistante…) : on arrête d'écrire à ce contact. */
export function isPermanentAddressError(err: unknown): boolean {
  const e = err as { responseCode?: number; response?: string; message?: string }
  const code = e?.responseCode ?? 0
  const text = `${e?.response ?? ''} ${e?.message ?? ''}`
  return code >= 550 && code <= 553 && /user|mailbox|recipient|address|unknown|exist/i.test(text)
}

export interface InboxScan {
  /** Adresse connue du contact (minuscules) → date de la réponse */
  replies: Map<string, Date>
  bounces: string[]
  scanned: number
  /** Réponses rattachées, par moyen (adresse, fil de discussion, domaine) */
  matchedBy: Record<'adresse' | 'fil' | 'domaine', number>
  /** Messages qui répondent à l'un de nos e-mails (« Re: », fil) sans contact retrouvé */
  unmatched: number
  /** Dossiers lus (boîte de réception, indésirables) */
  folders: string[]
}

/**
 * Lit la boîte de réception (et le dossier des indésirables) depuis `since` :
 * réponses des contacts (hors répondeurs automatiques) et rebonds. Une
 * réponse est rattachée par l'adresse, le fil de discussion ou le domaine pro
 * (matchReply). Plafonné pour tenir dans le temps d'une fonction Vercel.
 */
export async function scanInbox(
  cfg: OutreachConfig, since: Date, known: Set<string>,
  opts: { byThread?: Map<string, string>; byDomain?: Map<string, string>; max?: number } = {},
): Promise<InboxScan> {
  const byThread = opts.byThread ?? new Map<string, string>()
  const byDomain = opts.byDomain ?? new Map<string, string>()
  const max = opts.max ?? 400
  const client = new ImapFlow({
    host: cfg.imapHost,
    port: cfg.imapPort,
    secure: true,
    auth: { user: cfg.user, pass: cfg.pass },
    logger: false,
  })
  const replies = new Map<string, Date>()
  const bounces = new Set<string>()
  const matchedBy = { adresse: 0, fil: 0, domaine: 0 }
  let unmatched = 0
  let scanned = 0
  const ownDomain = (cfg.fromEmail.split('@')[1] ?? '').toLowerCase()
  await client.connect()
  const folders = ['INBOX']
  try {
    const list = await client.list()
    const junk = list.find(f => f.specialUse === '\\Junk' || /^(inbox\.)?(spam|junk|ind[eé]sirables)$/i.test(f.path))
    if (junk) folders.push(junk.path)
  } catch { /* liste des dossiers indisponible : boîte de réception seule */ }
  try {
    for (const folder of folders) {
      const lock = await client.getMailboxLock(folder)
      try {
        const bounceUids: number[] = []
        for await (const msg of client.fetch({ since }, { uid: true, envelope: true, internalDate: true, headers: ['auto-submitted', 'x-autoreply', 'x-autorespond', 'precedence', 'in-reply-to', 'references'] })) {
          if (++scanned > max) break
          const fromObj = msg.envelope?.from?.[0]
          const from = (fromObj?.address ?? '').toLowerCase()
          const fromLabel = `${fromObj?.name ?? ''} <${from}>`
          if (isBounceSender(fromLabel)) { bounceUids.push(msg.uid); continue }
          if (!from || from.endsWith(`@${ownDomain}`)) continue
          const headers = msg.headers?.toString('utf8') ?? ''
          // Répondeur automatique (absence, congés) : pas une vraie réponse
          if (/auto-submitted:\s*auto-(replied|generated)|x-autoreply|x-autorespond|precedence:\s*(auto_reply|bulk|junk)/i.test(headers)) continue
          const header = (name: string) => {
            // En-tête éventuellement replié sur plusieurs lignes (References)
            const m = headers.match(new RegExp(`(?:^|\\n)${name}:[ \\t]*([\\s\\S]*?)(?=\\r?\\n[^ \\t]|\\s*$)`, 'i'))
            return m ? m[1].replace(/\r?\n[ \t]+/g, ' ').trim() : null
          }
          const inReplyTo = header('in-reply-to') ?? msg.envelope?.inReplyTo ?? null
          const match = matchReply({ from, inReplyTo, references: header('references') }, known, byThread, byDomain)
          if (!match) {
            if (/^re\s*:/i.test(msg.envelope?.subject ?? '') || messageIdsOf(inReplyTo).some(id => id.endsWith(`@${ownDomain}`))) unmatched++
            continue
          }
          const when = msg.internalDate instanceof Date ? msg.internalDate : new Date()
          if (!replies.has(match.email)) { replies.set(match.email, when); matchedBy[match.how]++ }
        }
        for (const uid of bounceUids.slice(0, 50)) {
          const one = await client.fetchOne(String(uid), { source: { maxLength: 60_000 } }, { uid: true })
          const text = one && one.source ? one.source.toString('utf8') : ''
          for (const addr of bouncedAddresses(text)) bounces.add(addr)
        }
      } finally {
        lock.release()
      }
      if (scanned > max) break
    }
  } finally {
    await client.logout().catch(() => null)
  }
  return { replies, bounces: Array.from(bounces), scanned, matchedBy, unmatched, folders }
}
