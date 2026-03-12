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
      // On ne révèle pas si l'email existe ou non (sécurité)
      return NextResponse.json({ success: true })
    }

    await resend.emails.send({
      from: 'Jason Marinho <noreply@jasonmarinho.com>',
      to: normalized,
      subject: 'Réinitialisation de ton mot de passe',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0f0d;color:#f0f4ff;padding:40px;border-radius:16px;">
          <h1 style="font-size:22px;margin-bottom:12px;">Réinitialise ton mot de passe</h1>
          <p style="color:rgba(240,244,255,0.6);font-size:15px;line-height:1.6;margin-bottom:28px;">
            Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous.
            Ce lien expire dans <strong style="color:#FFD56B;">1 heure</strong>.
          </p>
          <a href="${data.properties.action_link}"
            style="display:inline-block;background:#004C3F;color:#FFD56B;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
            Réinitialiser mon mot de passe
          </a>
          <p style="color:rgba(240,244,255,0.3);font-size:12px;margin-top:32px;">
            Si tu n'as pas fait cette demande, ignore cet email.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
