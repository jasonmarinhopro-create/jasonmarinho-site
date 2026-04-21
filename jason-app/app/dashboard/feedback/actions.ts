'use server'

import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }

export async function sendFeedback(type: string, message: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const from = user?.email ?? 'Utilisateur anonyme'

  if (!message.trim()) return { error: 'Message vide' }

  const typeLabel = type === 'bug' ? '🐛 Bug' : type === 'idee' ? '💡 Idée' : '💬 Autre'

  await getResend().emails.send({
    from: 'notifications@jasonmarinho.com',
    to:   'contact@jasonmarinho.com',
    subject: `[Feedback dashboard] ${typeLabel} — ${from}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; background: #040d0b; color: #f0f4ff; border-radius: 14px;">
        <p style="margin: 0 0 6px; font-size: 12px; color: rgba(240,244,255,0.4); text-transform: uppercase; letter-spacing: 0.06em;">Feedback Dashboard</p>
        <h2 style="margin: 0 0 20px; font-size: 22px; color: #FFD56B;">${typeLabel}</h2>
        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 16px 20px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 15px; line-height: 1.7; color: rgba(240,244,255,0.85); white-space: pre-wrap;">${message.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>
        <p style="margin: 0; font-size: 12px; color: rgba(240,244,255,0.3);">Envoyé par : ${from}</p>
      </div>
    `,
  })

  return { success: true }
}
