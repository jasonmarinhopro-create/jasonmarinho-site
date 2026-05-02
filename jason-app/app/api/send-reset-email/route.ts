import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { buildEmail, emailBtn, emailP, emailNote } from '@/lib/email/template'
import { rateLimit, getClientIp } from '@/lib/security/rate-limit'
import { isEmail, normalizeEmail } from '@/lib/security/validate'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const log = logger('api/send-reset-email')
function getResend() { return new Resend(process.env.RESEND_API_KEY) }

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const ipLimit = await rateLimit('reset:ip', ip, 10, 60 * 60_000)
    if (!ipLimit.allowed) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessaye plus tard.' }, { status: 429 })
    }

    const { email } = await req.json()

    if (!isEmail(email)) {
      return NextResponse.json({ error: 'Email invalide.' }, { status: 400 })
    }

    const normalized = normalizeEmail(email)

    const emailLimit = await rateLimit('reset:email', normalized, 3, 15 * 60_000)
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Attends 15 minutes.' },
        { status: 429 }
      )
    }

    // Generate reset link via Supabase Admin
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: normalized,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      },
    })

    if (error || !data?.properties?.action_link) {
      log.error('generateLink', { msg: error?.message, data })
      return NextResponse.json({ success: true })
    }

    const { error: resendError } = await getResend().emails.send({
      from: 'Jason Marinho <noreply@jasonmarinho.com>',
      to: normalized,
      subject: 'Réinitialise ton mot de passe',
      html: buildEmail({
        title: 'Réinitialise ton mot de passe',
        preview: 'Un lien pour choisir un nouveau mot de passe, valable 1 heure.',
        body: `
          ${emailP('Nous avons reçu une demande de réinitialisation du mot de passe associé à ce compte.')}
          ${emailP('Clique sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable <strong style="color:#FFD56B;">1&nbsp;heure</strong>.')}
          ${emailBtn(data.properties.action_link, 'Choisir un nouveau mot de passe', 'primary')}
          ${emailNote('Si tu n\'as pas demandé cette réinitialisation, ignore cet email. Ton mot de passe restera inchangé.')}
        `,
      }),
    })

    if (resendError) {
      log.error('resend', resendError)
      return NextResponse.json({ error: 'Erreur envoi email.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    log.error('unexpected', { err: String(e) })
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
