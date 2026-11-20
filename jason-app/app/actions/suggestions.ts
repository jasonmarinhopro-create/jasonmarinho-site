'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { buildEmail, emailCitation, emailInfoBlock, EMAIL_FROM, escHtml } from '@/lib/email/template'
import { emailTags } from '@/lib/email/tracking'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }
const NOTIFY_EMAIL = 'contact@jasonmarinho.com'

export async function saveSuggestion(
  type: 'formation' | 'partner',
  message: string
): Promise<{ success?: boolean; error?: string }> {
  if (!message || message.trim().length < 2) {
    return { error: 'Le message est trop court.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .maybeSingle()

  const userEmail = profile?.email ?? user.email ?? 'inconnu'
  const userName = profile?.full_name ?? userEmail

  const { error } = await supabase.from('suggestions').insert({
    type,
    message: message.trim(),
    user_id: user.id,
    user_email: userEmail,
  })

  if (error) {
    if (error.code === '42P01') {
      return { error: 'La base de données n\'est pas encore configurée. Exécute supabase-migration.sql dans le dashboard Supabase.' }
    }
    return { error: `Erreur Supabase : ${error.message}` }
  }

  // Notification email
  const subject = type === 'formation'
    ? 'Nouvelle suggestion de formation'
    : 'Nouvelle suggestion de partenaire'

  await getResend().emails.send({ tags: emailTags('admin'),
    from: EMAIL_FROM,
    to: NOTIFY_EMAIL,
    ...(userEmail && userEmail.includes('@') ? { replyTo: userEmail } : {}),
    subject,
    html: buildEmail({
      etiquette: 'Pour toi · Idée d’un membre',
      title: subject,
      preview: message.trim().slice(0, 120),
      body: [
        emailCitation(message.trim()),
        emailInfoBlock([{ label: 'De', value: escHtml(`${userName} (${userEmail})`) }]),
      ].join(''),
      footer: 'Réponds à cet e-mail : ta réponse arrive chez le membre. Pense à le prévenir si l’idée voit le jour.',
    }),
  }).catch(() => {
    // Ne pas bloquer si l'email échoue
  })

  return { success: true }
}
