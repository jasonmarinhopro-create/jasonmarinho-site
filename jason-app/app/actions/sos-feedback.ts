'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }
const NOTIFY_EMAIL = 'contact@jasonmarinho.com'
const FROM_EMAIL = 'notifications@jasonmarinho.com'

const VALID_CHANNELS = ['airbnb', 'booking', 'vrbo', 'direct'] as const
const VALID_TYPES = ['error', 'testimony', 'suggestion'] as const

type Channel = typeof VALID_CHANNELS[number]
type FeedbackType = typeof VALID_TYPES[number]

const TYPE_LABELS: Record<FeedbackType, string> = {
  error: 'Signalement d\'erreur',
  testimony: 'Témoignage',
  suggestion: 'Suggestion d\'amélioration',
}

const TYPE_EMOJI: Record<FeedbackType, string> = {
  error: '⚠️',
  testimony: '💬',
  suggestion: '💡',
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function submitSOSFeedback(input: {
  scenario: string
  channel: string
  feedbackType: string
  message: string
}): Promise<{ success?: boolean; error?: string }> {
  const message = (input.message || '').trim()
  if (message.length < 10) return { error: 'Message trop court (10 caractères minimum).' }
  if (message.length > 4000) return { error: 'Message trop long (4000 caractères max).' }

  if (!VALID_CHANNELS.includes(input.channel as Channel)) return { error: 'Canal invalide.' }
  if (!VALID_TYPES.includes(input.feedbackType as FeedbackType)) return { error: 'Type invalide.' }
  if (!input.scenario || input.scenario.length > 80) return { error: 'Scénario invalide.' }

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

  const { error } = await supabase.from('sos_feedback').insert({
    user_id: user.id,
    user_email: userEmail,
    user_name: userName,
    scenario: input.scenario,
    channel: input.channel,
    feedback_type: input.feedbackType,
    message,
  })

  if (error) return { error: `Erreur: ${error.message}` }

  const feedbackType = input.feedbackType as FeedbackType
  const subject = `${TYPE_EMOJI[feedbackType]} SOS Hôte · ${TYPE_LABELS[feedbackType]} · ${input.scenario}`

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: NOTIFY_EMAIL,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a2e; margin: 0 0 16px;">${escHtml(subject)}</h2>
        <table style="font-size: 13px; color: #555; margin: 0 0 16px;">
          <tr><td style="padding: 2px 12px 2px 0;"><strong>Scénario</strong></td><td>${escHtml(input.scenario)}</td></tr>
          <tr><td style="padding: 2px 12px 2px 0;"><strong>Canal</strong></td><td>${escHtml(input.channel)}</td></tr>
          <tr><td style="padding: 2px 12px 2px 0;"><strong>Type</strong></td><td>${TYPE_LABELS[feedbackType]}</td></tr>
          <tr><td style="padding: 2px 12px 2px 0;"><strong>De</strong></td><td>${escHtml(userName)} (${escHtml(userEmail)})</td></tr>
        </table>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 0 0 16px; white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #333;">${escHtml(message)}</div>
        <p style="color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 12px; margin: 0;">
          À modérer sur <a href="https://app.jasonmarinho.com/dashboard/admin/sos-feedback" style="color: #004C3F;">l'admin SOS</a>.
        </p>
      </div>
    `,
  }).catch(() => {})

  return { success: true }
}

export async function updateSOSFeedbackStatus(input: {
  id: string
  status: 'pending' | 'approved' | 'rejected' | 'done'
  adminNote?: string
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role !== 'admin') return { error: 'Accès refusé.' }

  const { error } = await supabase
    .from('sos_feedback')
    .update({
      status: input.status,
      admin_note: input.adminNote ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)

  if (error) return { error: `Erreur: ${error.message}` }
  return { success: true }
}
