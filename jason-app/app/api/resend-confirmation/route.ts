// Renvoi de l'e-mail de confirmation depuis la page de connexion (20/11/2026).
// Avant : `supabase.auth.resend()` faisait partir le modèle par défaut de
// Supabase, en anglais (« Confirm Your Signup », vu dans Resend le 09/11/2026).
// Maintenant : notre e-mail, même gabarit que l'inscription. Réponse identique
// que le compte existe ou non (ne révèle jamais quelles adresses ont un compte).
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getServiceClient } from '@/lib/supabase/service'
import { rateLimit, getClientIp } from '@/lib/security/rate-limit'
import { isEmail, normalizeEmail } from '@/lib/security/validate'
import { lienConfirmation } from '@/lib/auth/nouveau-membre'
import { confirmationEmail } from '@/lib/email/auth-emails'
import { EMAIL_FROM, EMAIL_REPLY_TO, htmlToText } from '@/lib/email/template'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const log = logger('api/resend-confirmation')

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    if (!(await rateLimit('confirm-resend:ip', ip, 10, 60 * 60_000)).allowed) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessaye plus tard.' }, { status: 429 })
    }
    const { email } = await req.json().catch(() => ({ email: null }))
    if (!isEmail(email)) return NextResponse.json({ error: 'Email invalide.' }, { status: 400 })
    const normalized = normalizeEmail(email)
    if (!(await rateLimit('confirm-resend:email', normalized, 3, 15 * 60_000)).allowed) {
      return NextResponse.json({ error: 'Trop de tentatives. Attends 15 minutes.' }, { status: 429 })
    }

    const db = getServiceClient()
    const { data: profile } = await db.from('profiles').select('id, full_name, is_investor').eq('email', normalized).maybeSingle()
    if (!profile) return NextResponse.json({ success: true })
    const { data: existing } = await db.auth.admin.getUserById(profile.id as string)
    if (!existing?.user || existing.user.email_confirmed_at) return NextResponse.json({ success: true })

    const { data: linkData, error: linkError } = await db.auth.admin.generateLink({
      type: 'magiclink',
      email: normalized,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login` },
    })
    if (linkError || !linkData?.properties?.hashed_token) {
      log.error('generateLink', { msg: linkError?.message })
      return NextResponse.json({ error: 'Impossible de renvoyer l’e-mail. Réessaie dans quelques minutes.' }, { status: 500 })
    }

    const mail = confirmationEmail({
      fullName: (profile.full_name as string | null) ?? null,
      link: lienConfirmation(linkData.properties.hashed_token, 'magiclink'),
      isInvestor: !!profile.is_investor,
      renvoi: true,
    })
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: EMAIL_FROM, replyTo: EMAIL_REPLY_TO, to: normalized, subject: mail.subject, html: mail.html, text: htmlToText(mail.html),
    })
    if (error) {
      log.error('resend', { msg: error.message })
      return NextResponse.json({ error: 'Impossible de renvoyer l’e-mail. Réessaie dans quelques minutes.' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    log.error('unexpected', { err: String(e) })
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
