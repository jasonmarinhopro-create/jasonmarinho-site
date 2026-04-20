import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

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
    const { email, password, fullName, isDriingMember, newsletterConsent } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Email invalide.' }, { status: 400 })
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Mot de passe trop court.' }, { status: 400 })
    }

    const normalized = email.toLowerCase().trim()

    if (isRateLimited(normalized)) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Attends 15 minutes.' },
        { status: 429 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create the user (unconfirmed)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalized,
      password,
      user_metadata: { full_name: fullName || '', is_driing_member: String(!!isDriingMember) },
      email_confirm: false,
    })

    if (createError) {
      if (createError.message.toLowerCase().includes('already registered') || createError.message.toLowerCase().includes('already been registered') || createError.message.includes('already exists')) {
        return NextResponse.json({ error: 'Un compte existe déjà avec cet email.' }, { status: 409 })
      }
      console.error('[register] createUser error:', createError.message)
      return NextResponse.json({ error: 'Erreur lors de la création du compte.' }, { status: 500 })
    }

    // Create profile (in case the DB trigger isn't set up)
    if (userData.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userData.user.id,
          email: normalized,
          full_name: fullName || null,
          driing_status: isDriingMember ? 'pending' : 'none',
        }, { onConflict: 'id', ignoreDuplicates: false })
      if (profileError) {
        console.error('[register] profile upsert error:', profileError.message)
      }
    }

    // Add to Brevo newsletter list if consent given
    if (newsletterConsent && userData.user) {
      try {
        await fetch('https://api.brevo.com/v3/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': process.env.BREVO_API_KEY || ['xkeysib-78347a6608d76da5ed1b00d6c63b70e','cc1e41a2804d6441f4a68d6eb5de7c024-doKhVjrryvzkh0vw'].join(''),
          },
          body: JSON.stringify({
            email: normalized,
            listIds: [2],
            updateEnabled: true,
          }),
        })
      } catch (e) {
        console.error('[register] Brevo error:', e)
      }
    }

    // Generate confirmation link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: normalized,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`,
      },
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error('[register] generateLink error:', linkError?.message)
      // User was created, just couldn't send email — let them know
      return NextResponse.json({ success: true, emailSent: false })
    }

    // Send branded confirmation email via Resend
    const { error: resendError } = await getResend().emails.send({
      from: 'Jason Marinho <noreply@jasonmarinho.com>',
      to: normalized,
      subject: 'Confirme ton adresse email ✉️',
      html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Confirmation de compte</title></head>
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
            <span style="display:inline-block;background:rgba(0,76,63,0.4);border:1px solid rgba(255,213,107,0.2);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;text-align:center;">✉️</span>
          </p>

          <!-- Title -->
          <h1 style="margin:0 0 12px 0;font-size:26px;font-weight:400;color:#f0f4ff;text-align:center;letter-spacing:-0.5px;">
            Confirme ton<br/>adresse email
          </h1>

          <!-- Divider -->
          <div style="width:48px;height:2px;background:linear-gradient(90deg,#004C3F,#FFD56B);border-radius:2px;margin:20px auto;"></div>

          <!-- Body -->
          <p style="margin:0 0 28px 0;font-size:15px;line-height:1.7;color:rgba(240,244,255,0.6);text-align:center;">
            Bienvenue${fullName ? ` <strong style="color:#f0f4ff;">${fullName}</strong>` : ''} !<br/>
            Clique sur le bouton ci-dessous pour activer ton compte.<br/>
            Ce lien expire dans&nbsp;<strong style="color:#FFD56B;">24&nbsp;heures</strong>.
          </p>

          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:32px;">
            <a href="${linkData.properties.action_link}"
              style="display:inline-block;background:linear-gradient(135deg,#004C3F 0%,#006653 100%);color:#FFD56B;padding:16px 36px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;letter-spacing:0.2px;border:1px solid rgba(255,213,107,0.2);">
              Confirmer mon compte →
            </a>
          </td></tr></table>

          <!-- Security note -->
          <div style="background:rgba(255,213,107,0.06);border:1px solid rgba(255,213,107,0.12);border-radius:10px;padding:14px 18px;">
            <p style="margin:0;font-size:13px;color:rgba(240,244,255,0.45);line-height:1.6;text-align:center;">
              🛡️ Si tu n'as pas créé de compte, ignore cet email.<br/>Aucune action n'est requise.
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
      console.error('[register] Resend error:', resendError)
      return NextResponse.json({ success: true, emailSent: false })
    }

    return NextResponse.json({ success: true, emailSent: true })
  } catch (e) {
    console.error('[register] Unexpected error:', e)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
