import { Resend } from 'resend'

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
 * Envoie un email à l'admin (best-effort, ne throw pas).
 */
export async function sendAdminEmail({ subject, text }: { subject: string; text: string }): Promise<void> {
  try {
    await getResend().emails.send({
      from: 'Jason Marinho <noreply@jasonmarinho.com>',
      to: ADMIN_EMAIL,
      subject,
      text,
    })
  } catch (e) {
    console.error('[admin email] failed', e)
  }
}
