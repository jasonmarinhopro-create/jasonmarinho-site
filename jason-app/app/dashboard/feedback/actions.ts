'use server'

import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { buildEmail, emailCitation, emailInfoBlock, EMAIL_FROM, escHtml } from '@/lib/email/template'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }

export async function sendFeedback(type: string, message: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const from = user?.email ?? 'Utilisateur anonyme'

  if (!message.trim()) return { error: 'Message vide' }

  const typeLabel = type === 'bug' ? 'Bug signalé' : type === 'idee' ? 'Idée soumise' : 'Feedback'

  await getResend().emails.send({
    from: EMAIL_FROM,
    to:   'contact@jasonmarinho.com',
    ...(user?.email ? { replyTo: user.email } : {}),
    subject: `Feedback, ${typeLabel}`,
    html: buildEmail({
      etiquette: 'Pour toi · Retour d’un membre',
      title: typeLabel,
      preview: message.trim().slice(0, 120),
      body: `
        ${emailCitation(message.trim())}
        ${emailInfoBlock([{ label: 'Envoyé par', value: escHtml(from) }])}
      `,
      footer: 'Réponds à cet e-mail : ta réponse arrive chez le membre.',
    }),
  })

  return { success: true }
}
