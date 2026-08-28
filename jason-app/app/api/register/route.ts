import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { buildEmail, emailBtn, emailP, emailNote, emailInfoBlock, emailAnnuairesPromo, escHtml } from '@/lib/email/template'
import { rateLimit, getClientIp } from '@/lib/security/rate-limit'
import { isEmail, isPassword, normalizeEmail } from '@/lib/security/validate'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const log = logger('api/register')
function getResend() { return new Resend(process.env.RESEND_API_KEY) }

// Domaines email jetables — blocklist compacte (idem /api/newsletter/subscribe.js
// côté marketing). Couvre ~95% des emails temporaires utilisés par les bots.
const DISPOSABLE_DOMAINS = new Set<string>([
  'yopmail.com','yopmail.fr','yopmail.net',
  'mailinator.com','mailinator.net','mailinator.org',
  'tempmail.com','temp-mail.org','temp-mail.io','temp-mail.fr',
  '10minutemail.com','10minutemail.net','10minutemail.org',
  'guerrillamail.com','guerrillamail.net','guerrillamail.biz','guerrillamail.org',
  'sharklasers.com','grr.la','spam4.me','pokemail.net',
  'maildrop.cc','throwawaymail.com','dispostable.com','fakeinbox.com',
  'trashmail.com','trashmail.net','trashmail.de','trash-mail.com',
  'getnada.com','nada.email','inboxbear.com','tempinbox.com',
  'mintemail.com','spamgourmet.com','mytemp.email','jetable.org',
  'minuteinbox.com','emailondeck.com','mohmal.com','etranquil.com',
  'mailcatch.com','spambog.com','spambox.us','spamfree.com',
  'discardmail.com','discardmail.de','mailnesia.com','meltmail.com',
  'tempr.email','tmail.io','tmail.run','tmail.us','tmail.ws',
  'wegwerfemail.com','wegwerfemail.de','wegwerfmail.de','wegwerfmail.net',
  'mvrht.net','asdf.pl','mt2014.com','mt2015.com','mailbox52.ga',
  'guerillamail.com','vomoto.com','tagyourself.com','byom.de',
  'mailtothis.com','dropmail.me','emailfake.com','tempmailo.com',
])

function isDisposableEmail(email: string): boolean {
  const at = email.lastIndexOf('@')
  if (at === -1) return false
  return DISPOSABLE_DOMAINS.has(email.slice(at + 1).toLowerCase())
}

// Gmail ignore les points dans la partie locale de l'adresse (a.b.c@gmail.com
// et abc@gmail.com délivrent au même endroit) — un pattern classique de bot
// consiste à saupoudrer des points partout pour générer des adresses
// "différentes" aux yeux d'un filtre anti-doublon, alors qu'elles tombent
// toutes dans la même boîte. Un humain met rarement plus de 1-2 points
// (prénom.nom@gmail.com) : on ne déclenche que sur un découpage en plein de
// micro-segments (≥5 segments, longueur moyenne ≤2.5 caractères), ce qui
// laisse passer les noms composés légitimes (jean.pierre.dupont@gmail.com).
function looksLikeDottedGmailBot(email: string): boolean {
  const [local, domain] = email.toLowerCase().split('@')
  if (!local || !domain) return false
  if (domain !== 'gmail.com' && domain !== 'googlemail.com') return false
  const parts = local.split('.').filter(Boolean)
  if (parts.length < 5) return false
  const avgLen = local.replace(/\./g, '').length / parts.length
  return avgLen <= 2.5
}

// Notifie Jason (email discret) à chaque incident sur l'inscription : bloqué
// par erreur par un filtre anti-bot (faux succès affiché au navigateur, pour
// ne pas indiquer la détection à un bot), ou compte créé mais email de
// confirmation non envoyé. Sans ça, ces cas restent invisibles pour Jason sauf
// à fouiller les logs Vercel — ce qu'il n'a pas toujours la possibilité de faire.
function notifyJasonIssue(reason: string, details: Record<string, unknown>) {
  void new Resend(process.env.RESEND_API_KEY).emails.send({
    from: 'Jason Marinho <noreply@jasonmarinho.com>',
    to: 'contact@jasonmarinho.com',
    subject: `Incident inscription : ${reason}`,
    html: buildEmail({
      title: 'Un incident a eu lieu sur une inscription',
      preview: `${reason}. Si c'est une vraie personne, tu peux l'aider manuellement.`,
      body: `
        ${emailP(`Détail : <strong style="color:#e8ede8;">${escHtml(reason)}</strong>. Si tu penses que c'est une vraie personne (pas un bot) ou que son compte est créé mais bloqué sans email, tu peux l'aider manuellement depuis l'admin, ou lui répondre pour vérifier.`)}
        ${emailInfoBlock(Object.entries(details).map(([label, value]) => ({ label, value: escHtml(String(value ?? '-')) })))}
      `,
    }),
  }).catch(() => { /* ne jamais faire échouer l'inscription pour ça */ })
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const ipLimit = await rateLimit('register:ip', ip, 10, 60 * 60_000)
    if (!ipLimit.allowed) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessaye plus tard.' }, { status: 429 })
    }

    const body = await req.json()
    const { email, password, fullName, isDriingMember, newsletterConsent, website, ts, isInvestor } = body

    // ─── Anti-bot : honeypot + time-trap + domaines jetables ───────────────
    // Fail-silent en 200 OK pour ne pas indiquer la détection aux bots.

    // 1. Honeypot : 'website' caché côté front, humain ne le remplit jamais.
    if (typeof website === 'string' && website.trim().length > 0) {
      log.warn('botHoneypot', { ip, email })
      notifyJasonIssue('champ caché rempli', { IP: ip, Email: email, 'Nom saisi': fullName, 'Valeur du champ caché': website })
      return NextResponse.json({ ok: true })
    }

    // 2. Time-trap : un humain met >1.5s à remplir et soumettre. De loin le
    // cas le plus fréquent (un site public se fait scanner en continu) et
    // quasi toujours un vrai bot — pas d'email à chaque fois (ça noyait la
    // boîte mail de Jason), juste un log serveur. Les cas plus rares et plus
    // ambigus (honeypot, domaine jetable, Gmail à points) restent notifiés.
    if (typeof ts === 'number' && ts > 0) {
      const elapsed = Date.now() - ts
      if (elapsed < 1500) {
        log.warn('botTooFast', { ip, elapsed })
        return NextResponse.json({ ok: true })
      }
    }

    if (!isEmail(email)) {
      return NextResponse.json({ error: 'Email invalide.' }, { status: 400 })
    }
    if (!isPassword(password)) {
      return NextResponse.json({ error: 'Mot de passe trop court.' }, { status: 400 })
    }

    const normalized = normalizeEmail(email)

    // 3. Domaine email jetable → fake success silencieux.
    if (isDisposableEmail(normalized)) {
      log.warn('botDisposable', { ip, email: normalized })
      notifyJasonIssue('domaine email jetable', { IP: ip, Email: normalized, 'Nom saisi': fullName })
      return NextResponse.json({ ok: true })
    }

    // 4. Email Gmail truffé de points (a.b.c.d.e@gmail.com) → fake success silencieux.
    if (looksLikeDottedGmailBot(normalized)) {
      log.warn('botDottedGmail', { ip, email: normalized })
      notifyJasonIssue('email Gmail à points suspects', { IP: ip, Email: normalized, 'Nom saisi': fullName })
      return NextResponse.json({ ok: true })
    }

    const emailLimit = await rateLimit('register:email', normalized, 3, 15 * 60_000)
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
      const alreadyRegistered = createError.message.toLowerCase().includes('already registered') || createError.message.toLowerCase().includes('already been registered') || createError.message.includes('already exists')
      if (alreadyRegistered) {
        // Compte déjà créé — s'il n'a jamais confirmé son email (premier envoi
        // perdu en spam, domaine qui filtre, etc.), on lui renvoie un nouveau
        // lien au lieu de le bloquer sans aucun recours.
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', normalized)
          .maybeSingle()

        if (existingProfile) {
          const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(existingProfile.id)
          if (existingUser?.user && !existingUser.user.email_confirmed_at) {
            const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
              type: 'magiclink',
              email: normalized,
              options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login` },
            })
            if (linkError || !linkData?.properties?.action_link) {
              log.error('generateLink(resend)', { msg: linkError?.message })
              notifyJasonIssue('lien de renvoi non généré (Supabase)', { Email: normalized, 'Nom saisi': fullName, Erreur: linkError?.message })
              return NextResponse.json({ success: true, emailSent: false })
            }
            const { error: resendErr } = await getResend().emails.send({
              from: 'Jason Marinho <noreply@jasonmarinho.com>',
              to: normalized,
              subject: 'Confirme ton adresse email',
              html: buildEmail({
                title: 'Confirme ton adresse email',
                preview: 'Une dernière étape pour accéder à ton espace Jason Marinho.',
                body: `
                  ${emailP(`Bienvenue${fullName ? ` <strong style="color:#e8ede8;">${escHtml(fullName)}</strong>` : ''}&nbsp;! Voici un nouveau lien pour confirmer ton adresse et accéder à la plateforme.`)}
                  ${emailP(`Ce lien est valable <strong style="color:#FFD56B;">24&nbsp;heures</strong>.`)}
                  ${emailBtn(linkData.properties.action_link, 'Confirmer mon compte', 'primary')}
                  ${isInvestor ? '' : emailAnnuairesPromo()}
                  ${emailNote('Si tu n\'as pas créé de compte sur Jason Marinho, ignore simplement cet email. Aucune action n\'est requise.')}
                `,
              }),
            })
            if (resendErr) {
              log.error('resend(resend)', resendErr)
              notifyJasonIssue('email de renvoi non envoyé (Resend)', { Email: normalized, 'Nom saisi': fullName, Erreur: JSON.stringify(resendErr) })
              return NextResponse.json({ success: true, emailSent: false })
            }
            return NextResponse.json({ success: true, emailSent: true })
          }
        }

        return NextResponse.json({ error: 'Un compte existe déjà avec cet email.' }, { status: 409 })
      }
      log.error('createUser', { msg: createError.message })
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
          is_investor: !!isInvestor,
        }, { onConflict: 'id', ignoreDuplicates: false })
      if (profileError) {
        log.warn('profileUpsert', { msg: profileError.message })
      }
    }

    // Notify Jason of new signup (fire-and-forget)
    if (userData.user) {
      const dateStr = new Date().toLocaleString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
      })
      const profilLabel = isInvestor ? 'Investisseur' : 'Hôte'
      void getResend().emails.send({
        from: 'Jason Marinho <noreply@jasonmarinho.com>',
        to: 'contact@jasonmarinho.com',
        subject: `Nouvelle inscription ${profilLabel} — ${fullName || normalized}`,
        html: buildEmail({
          title: 'Une nouvelle personne vient de rejoindre !',
          preview: `${fullName || normalized} vient de créer un compte ${profilLabel.toLowerCase()} sur ta plateforme.`,
          body: `
            ${emailP(`<strong style="color:#e8ede8;">Bonne nouvelle !</strong> Une nouvelle personne vient de rejoindre ta communauté. C'est la preuve que ton travail attire et convainc, continue comme ça, tu construis quelque chose de solide.`)}
            ${emailInfoBlock([
              { label: 'Profil', value: isInvestor ? '💼 Investisseur' : '🏠 Hôte' },
              { label: 'Prénom / Nom', value: escHtml(fullName || '-') },
              { label: 'Email', value: escHtml(normalized) },
              { label: 'Membre Driing', value: isDriingMember ? 'Oui ✓' : 'Non' },
              { label: 'Inscription le', value: escHtml(dateStr) },
            ])}
            ${emailBtn(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/membres`, 'Voir les membres', 'secondary')}
          `,
        }),
      }).catch(() => { /* never fail the registration */ })
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
        log.warn('brevo', { err: String(e) })
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
      log.error('generateLink', { msg: linkError?.message })
      notifyJasonIssue('lien de confirmation non généré (Supabase)', { Email: normalized, 'Nom saisi': fullName, Erreur: linkError?.message })
      // User was created, just couldn't send email, let them know
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
          ${isInvestor ? '' : emailAnnuairesPromo()}
          ${emailNote('Si tu n\'as pas créé de compte sur Jason Marinho, ignore simplement cet email. Aucune action n\'est requise.')}
        `,
      }),
    })

    if (resendError) {
      log.error('resend', resendError)
      notifyJasonIssue('email de confirmation non envoyé (Resend)', { Email: normalized, 'Nom saisi': fullName, Erreur: JSON.stringify(resendError) })
      return NextResponse.json({ success: true, emailSent: false })
    }

    return NextResponse.json({ success: true, emailSent: true })
  } catch (e) {
    log.error('unexpected', { err: String(e) })
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
