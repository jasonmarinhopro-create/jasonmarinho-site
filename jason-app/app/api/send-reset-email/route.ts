import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { buildEmail, emailBtn, emailP, emailNote } from '@/lib/email/template'

export const dynamic = 'force-dynamic'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }

// Simple in-memory rate limiter: max 3 requests per email per 15 min
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(email: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(email)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(email, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return false
  }
  if (entry.count >= 3) return true
  entry.count++
  return false
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Email invalide.' }, { status: 400 })
    }

    const normalized = email.toLowerCase().trim()

    if (isRateLimited(normalized)) {
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
      console.error('[reset-email] generateLink error:', error?.message, '| data:', JSON.stringify(data))
      return NextResponse.json({ success: true })
    }

    const { error: resendError } = await getResend().emails.send({
      from: 'Jason Marinho <noreply@jasonmarinho.com>',
      to: normalized,
      subject: 'Réinitialise ton mot de passe',
      html: buildEmail({
        title: 'Réinitialise ton mot de passe',
        preview: 'Un lien pour choisir un nouveau mot de passe — valable 1 heure.',
        body: `
          ${emailP('Nous avons reçu une demande de réinitialisation du mot de passe associé à ce compte.')}
          ${emailP('Clique sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable <strong style="color:#FFD56B;">1&nbsp;heure</strong>.')}
          ${emailBtn(data.properties.action_link, 'Choisir un nouveau mot de passe', 'primary')}
          ${emailNote('Si tu n\'as pas demandé cette réinitialisation, ignore cet email. Ton mot de passe restera inchangé.')}
        `,
      }),
    })

    if (resendError) {
      console.error('[reset-email] Resend error:', resendError)
      return NextResponse.json({ error: 'Erreur envoi email.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[reset-email] Unexpected error:', e)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
