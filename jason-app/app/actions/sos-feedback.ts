'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { buildEmail, emailBtn, emailCitation, emailInfoBlock, EMAIL_FROM, escHtml } from '@/lib/email/template'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }
const NOTIFY_EMAIL = 'contact@jasonmarinho.com'

const VALID_CHANNELS = ['airbnb', 'booking', 'vrbo', 'direct'] as const
const VALID_TYPES = ['error', 'testimony', 'suggestion'] as const

type Channel = typeof VALID_CHANNELS[number]
type FeedbackType = typeof VALID_TYPES[number]

const TYPE_LABELS: Record<FeedbackType, string> = {
  error: 'Signalement d\'erreur',
  testimony: 'Témoignage',
  suggestion: 'Suggestion d\'amélioration',
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
  const subject = `SOS Hôte · ${TYPE_LABELS[feedbackType]} · ${input.scenario}`

  await getResend().emails.send({
    from: EMAIL_FROM,
    to: NOTIFY_EMAIL,
    ...(userEmail.includes('@') ? { replyTo: userEmail } : {}),
    subject,
    html: buildEmail({
      etiquette: `Pour toi · SOS Hôte`,
      title: escHtml(TYPE_LABELS[feedbackType]),
      preview: message.slice(0, 120),
      body: [
        emailCitation(message),
        emailInfoBlock([
          { label: 'Scénario', value: escHtml(input.scenario) },
          { label: 'Canal', value: escHtml(input.channel) },
          { label: 'De', value: escHtml(`${userName} (${userEmail})`) },
        ]),
        emailBtn('https://app.jasonmarinho.com/dashboard/admin/sos-feedback', 'Modérer dans l’admin SOS'),
      ].join(''),
    }),
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
