import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { buildEmail, emailBtn, emailP, emailNote, escHtml } from '@/lib/email/template'
import { rateLimit, getClientIp } from '@/lib/security/rate-limit'
import { isEmail, isPassword, normalizeEmail } from '@/lib/security/validate'

export const dynamic = 'force-dynamic'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const ipLimit = rateLimit('register:ip', ip, 10, 60 * 60_000)
    if (!ipLimit.allowed) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessaye plus tard.' }, { status: 429 })
    }

    const { email, password, fullName, isDriingMember, newsletterConsent } = await req.json()

    if (!isEmail(email)) {
      return NextResponse.json({ error: 'Email invalide.' }, { status: 400 })
    }
    if (!isPassword(password)) {
      return NextResponse.json({ error: 'Mot de passe trop court.' }, { status: 400 })
    }

    const normalized = normalizeEmail(email)

    const emailLimit = rateLimit('register:email', normalized, 3, 15 * 60_000)
    if (!emailLimit.allowed) {
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
    if (newsletterConsent && userData.user && process.env.BREVO_API_KEY) {
      try {
        await fetch('https://api.brevo.com/v3/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
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
      password,
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
      subject: 'Confirme ton adresse email',
      html: buildEmail({
        title: 'Confirme ton adresse email',
        preview: 'Une dernière étape pour accéder à ton espace Jason Marinho.',
        body: `
          ${emailP(`Bienvenue${fullName ? ` <strong style="color:#e8ede8;">${escHtml(fullName)}</strong>` : ''}&nbsp;! Ton compte est prêt. Clique sur le bouton ci-dessous pour confirmer ton adresse et accéder à la plateforme.`)}
          ${emailP(`Ce lien est valable <strong style="color:#FFD56B;">24&nbsp;heures</strong>.`)}
          ${emailBtn(linkData.properties.action_link, 'Confirmer mon compte', 'primary')}
          ${emailNote('Si tu n\'as pas créé de compte sur Jason Marinho, ignore simplement cet email. Aucune action n\'est requise.')}
        `,
      }),
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
