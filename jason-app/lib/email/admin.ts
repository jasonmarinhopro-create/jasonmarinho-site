import { Resend } from 'resend'
import { buildEmail, emailP, EMAIL_FROM, escHtml } from './template'
import { emailTags } from '@/lib/email/tracking'

const ADMIN_EMAIL = 'contact@jasonmarinho.com'

let resend: Resend | null = null
function getResend(): Resend {
  if (!resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error('RESEND_API_KEY missing')
    resend = new Resend(key)
  }
  return resend
}

/**
 * Alerte texte mise au gabarit de la marque (20/11/2026) : avant, les alertes
 * sans HTML arrivaient en texte brut, seules de leur style. Paragraphes
 * séparés par une ligne vide, liens cliquables.
 */
export function adminTextToHtml(subject: string, text: string): string {
  const linkify = (s: string) => s.replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1" style="color:#004C3F;font-weight:600;text-decoration:none;word-break:break-all;">$1</a>')
  const body = text.trim().split(/\n{2,}/).map(par => emailP(linkify(escHtml(par)).replace(/\n/g, '<br>'))).join('')
  return buildEmail({ etiquette: 'Pour toi', title: escHtml(subject), body, preview: text.slice(0, 120) })
}

/**
 * Envoie un email à l'admin (best-effort, ne throw pas).
 */
export async function sendAdminEmail({ subject, text, html, replyTo }: { subject: string; text: string; html?: string; replyTo?: string }): Promise<void> {
  try {
    await getResend().emails.send({ tags: emailTags('admin'),
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject,
      text,
      html: html ?? adminTextToHtml(subject, text),
      ...(replyTo ? { replyTo } : {}),
    })
  } catch (e) {
    console.error('[admin email] failed', e)
  }
}
