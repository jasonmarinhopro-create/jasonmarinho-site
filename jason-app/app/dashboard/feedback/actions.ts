'use server'

import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { buildEmail, emailInfoBlock, emailP, escHtml } from '@/lib/email/template'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }

export async function sendFeedback(type: string, message: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const from = user?.email ?? 'Utilisateur anonyme'

  if (!message.trim()) return { error: 'Message vide' }

  const typeLabel = type === 'bug' ? 'Bug signalé' : type === 'idee' ? 'Idée soumise' : 'Feedback'

  await getResend().emails.send({
    from: 'notifications@jasonmarinho.com',
    to:   'contact@jasonmarinho.com',
    subject: `Feedback, ${typeLabel}`,
    html: buildEmail({
      title: typeLabel,
      body: `
        ${emailInfoBlock([{ label: 'Envoyé par', value: escHtml(from) }])}
        <div style="background:#0a1a13;border:1px solid #1a3328;border-radius:10px;padding:18px 20px;margin:0 0 16px;">
          <p style="margin:0;font-size:14px;line-height:1.75;color:#e8ede8;white-space:pre-wrap;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${message.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>
      `,
    }),
  })

  return { success: true }
}
