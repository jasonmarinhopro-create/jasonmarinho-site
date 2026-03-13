import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    const { error: resendError } = await resend.emails.send({
      from: 'Jason Marinho <noreply@jasonmarinho.com>',
      to: normalized,
      subject: 'Réinitialise ton mot de passe 🔐',
      html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Réinitialisation du mot de passe</title></head>
<body style="margin:0;padding:0;background-color:#060d0b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#060d0b;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Header / Logo -->
        <tr><td style="padding-bottom:32px;" align="center">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#004C3F;border:1px solid rgba(255,213,107,0.25);border-radius:12px;width:44px;height:44px;text-align:center;vertical-align:middle;">
                <span style="font-size:20px;line-height:44px;">🌊</span>
              </td>
              <td style="padding-left:12px;vertical-align:middle;">
                <span style="font-size:20px;font-weight:600;color:#f0f4ff;letter-spacing:-0.3px;">Jason <em style="color:#FFD56B;font-style:italic;">Marinho</em></span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:40px 36px;">

          <!-- Icon -->
          <p style="text-align:center;margin:0 0 24px 0;">
            <span style="display:inline-block;background:rgba(0,76,63,0.4);border:1px solid rgba(255,213,107,0.2);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;text-align:center;">🔐</span>
          </p>

          <!-- Title -->
          <h1 style="margin:0 0 12px 0;font-size:26px;font-weight:400;color:#f0f4ff;text-align:center;letter-spacing:-0.5px;">
            Réinitialise ton<br/>mot de passe
          </h1>

          <!-- Divider -->
          <div style="width:48px;height:2px;background:linear-gradient(90deg,#004C3F,#FFD56B);border-radius:2px;margin:20px auto;"></div>

          <!-- Body -->
          <p style="margin:0 0 28px 0;font-size:15px;line-height:1.7;color:rgba(240,244,255,0.6);text-align:center;">
            Tu as demandé à réinitialiser ton mot de passe.<br/>
            Clique sur le bouton ci-dessous — ce lien expire dans&nbsp;<strong style="color:#FFD56B;">1&nbsp;heure</strong>.
          </p>

          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:32px;">
            <a href="${data.properties.action_link}"
              style="display:inline-block;background:linear-gradient(135deg,#004C3F 0%,#006653 100%);color:#FFD56B;padding:16px 36px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;letter-spacing:0.2px;border:1px solid rgba(255,213,107,0.2);">
              Réinitialiser mon mot de passe →
            </a>
          </td></tr></table>

          <!-- Security note -->
          <div style="background:rgba(255,213,107,0.06);border:1px solid rgba(255,213,107,0.12);border-radius:10px;padding:14px 18px;">
            <p style="margin:0;font-size:13px;color:rgba(240,244,255,0.45);line-height:1.6;text-align:center;">
              🛡️ Si tu n'as pas demandé cette réinitialisation, ignore cet email.<br/>Ton mot de passe ne sera pas modifié.
            </p>
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:28px;text-align:center;">
          <p style="margin:0 0 6px 0;font-size:12px;color:rgba(240,244,255,0.2);">
            Jason Marinho · Formation Location Courte Durée
          </p>
          <p style="margin:0;font-size:12px;color:rgba(240,244,255,0.15);">
            <a href="https://app.jasonmarinho.com" style="color:rgba(255,213,107,0.3);text-decoration:none;">app.jasonmarinho.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
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
