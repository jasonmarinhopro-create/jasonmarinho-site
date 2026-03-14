'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const NOTIFY_EMAIL = 'contact@jasonmarinho.com'
const FROM_EMAIL = 'notifications@jasonmarinho.com'

export async function saveSuggestion(
  type: 'formation' | 'partner',
  message: string
): Promise<{ success?: boolean; error?: string }> {
  if (!message || message.trim().length < 2) {
    return { error: 'Le message est trop court.' }
  }

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', session.user.id)
    .maybeSingle()

  const userEmail = profile?.email ?? session.user.email ?? 'inconnu'
  const userName = profile?.full_name ?? userEmail

  const { error } = await supabase.from('suggestions').insert({
    type,
    message: message.trim(),
    user_id: session.user.id,
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
    ? '💡 Nouvelle suggestion de formation'
    : '🤝 Nouvelle suggestion de partenaire'

  await resend.emails.send({
    from: FROM_EMAIL,
    to: NOTIFY_EMAIL,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a2e;">${subject}</h2>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-size: 15px; color: #333; line-height: 1.6;">${message.trim()}</p>
        </div>
        <p style="color: #666; font-size: 13px;">
          <strong>De :</strong> ${userName} (${userEmail})
        </p>
        <p style="color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 12px; margin-top: 24px;">
          Suggestion reçue via la plateforme jasonmarinho.com
        </p>
      </div>
    `,
  }).catch(() => {
    // Ne pas bloquer si l'email échoue
  })

  return { success: true }
}
