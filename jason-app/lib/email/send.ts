// Envoi commun des e-mails Resend (20/11/2026). Un seul endroit pour :
// l'expéditeur avec un nom affiché, la réponse qui arrive chez Jason
// (contact@) quand l'e-mail l'invite à répondre, et la version texte jointe
// au HTML (aide Gmail à bien classer). Ne lève jamais : renvoie l'erreur.
import { Resend } from 'resend'
import { EMAIL_FROM, EMAIL_REPLY_TO, htmlToText } from './template'
import { emailTags, type EmailCategory } from './tracking'

let client: Resend | null = null
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!client) client = new Resend(key)
  return client
}

export interface SendEmailInput {
  to: string | string[]
  subject: string
  html: string
  /** Sinon calculée depuis le HTML */
  text?: string
  /** Sinon « Jason Marinho <notifications@…> » */
  from?: string
  /** Sinon contact@jasonmarinho.com ; null : aucune adresse de réponse */
  replyTo?: string | null
  /** Catégorie pour la page E-mails de l'admin (tag Resend) */
  categorie?: EmailCategory
}

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const r = getResend()
  if (!r) return { ok: false, error: 'RESEND_API_KEY missing' }
  try {
    const replyTo = input.replyTo === undefined ? EMAIL_REPLY_TO : input.replyTo
    const { error } = await r.emails.send({
      from: input.from ?? EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text ?? htmlToText(input.html),
      ...(replyTo ? { replyTo } : {}),
      tags: emailTags(input.categorie ?? 'autre'),
    })
    return error ? { ok: false, error: error.message } : { ok: true }
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e).slice(0, 200) }
  }
}
