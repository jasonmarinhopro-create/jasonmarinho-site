import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { EMAIL_FROM, htmlToText } from '@/lib/email/template'
import { resetPasswordEmail } from '@/lib/email/auth-emails'
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
      // E-mail sans compte (faute de frappe, autre adresse) : cas normal, pas
      // une erreur de l'app. Même réponse que si le compte existait, pour ne
      // jamais révéler quelles adresses ont un compte.
      const unknownUser = /not found/i.test(error?.message ?? '') || (!error && !data?.user)
      if (!unknownUser) log.error('generateLink', { msg: error?.message })
      return NextResponse.json({ success: true })
    }

    const mail = resetPasswordEmail(data.properties.action_link)
    const { error: resendError } = await getResend().emails.send({
      from: EMAIL_FROM,
      to: normalized,
      subject: mail.subject,
      html: mail.html,
      text: htmlToText(mail.html),
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
