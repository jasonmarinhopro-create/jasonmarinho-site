import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { buildEmail, emailBtn, emailInfoBlock, emailNote, emailP, escHtml } from '@/lib/email/template'

export const dynamic = 'force-dynamic'

type ContractRow = {
  id: string
  statut: string
  sejour_id: string | null
  user_id: string | null
  token_expires_at: string | null
  locataire_email: string | null
  bailleur_email: string
  locataire_prenom: string
  locataire_nom: string
  bailleur_prenom: string
  bailleur_nom: string
  logement_nom?: string | null
  logement_adresse: string
  montant_loyer: number | null
  montant_caution: number | null
  modalites_paiement: string | null
  stripe_payment_enabled: boolean | null
}

// Service role — bypass RLS complet (lecture + écriture)
// Nécessaire car le locataire signe sans session authentifiée
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (url: RequestInfo | URL, init?: RequestInit) =>
          fetch(url, { ...init, cache: 'no-store' }),
      },
    }
  )
}

function getResend() { return new Resend(process.env.RESEND_API_KEY) }
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'
const FROM_EMAIL = 'contrats@jasonmarinho.com'

// POST /api/contracts/sign
// Body: { token, signature_image }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, signature_image } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token manquant.' }, { status: 400 })
    }
    if (!signature_image || typeof signature_image !== 'string') {
      return NextResponse.json({ error: 'Signature manquante.' }, { status: 400 })
    }
    const validImagePrefixes = ['data:image/png;base64,', 'data:image/jpeg;base64,', 'data:image/webp;base64,']
    if (!validImagePrefixes.some(p => signature_image.startsWith(p))) {
      return NextResponse.json({ error: 'Format de signature invalide.' }, { status: 400 })
    }
    if (signature_image.length > 5_000_000) {
      return NextResponse.json({ error: 'Image de signature trop volumineuse (max 5 Mo).' }, { status: 400 })
    }

    // Audit trail eIDAS : IP + user-agent
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? 'inconnue'
    const userAgent = request.headers.get('user-agent') ?? 'inconnu'

    const db = createServiceClient()

    // ── Étape 1 : Récupérer et valider le contrat ────────────────────────────
    const { data: contractRaw, error: fetchError } = await db
      .from('contracts')
      .select('id, statut, sejour_id, user_id, token_expires_at, locataire_email, bailleur_email, ' +
              'locataire_prenom, locataire_nom, bailleur_prenom, bailleur_nom, ' +
              'logement_adresse, montant_loyer, montant_caution, modalites_paiement, stripe_payment_enabled')
      .eq('token', token)
      .single()

    const contract = contractRaw as ContractRow | null

    if (fetchError || !contract) {
      console.error('[sign] Contract not found for token:', token, fetchError?.message, fetchError?.code)
      return NextResponse.json(
        { error: 'Contrat introuvable.', debug: fetchError?.code ?? 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Idempotent : contrat déjà signé
    if (contract.statut === 'signe') {
      return NextResponse.json({ success: true, already_signed: true })
    }

    if (contract.statut === 'annule') {
      return NextResponse.json({ error: 'Ce contrat a été annulé.' }, { status: 409 })
    }

    // Sécurité : le bailleur ne peut pas signer à la place de son locataire
    const authClient = await createAuthClient()
    const { data: { user: authUser } } = await authClient.auth.getUser()
    if (authUser && authUser.id === contract.user_id) {
      return NextResponse.json(
        { error: 'Le propriétaire ne peut pas signer à la place du locataire.' },
        { status: 403 }
      )
    }

    if (contract.statut !== 'en_attente') {
      return NextResponse.json({ error: 'Contrat non signable.' }, { status: 409 })
    }

    if (!contract.token_expires_at || new Date(contract.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Ce lien de signature a expiré. Contactez le propriétaire.' }, { status: 410 })
    }

    // ── Étape 2 : Enregistrer la signature (service role → bypass RLS) ───────
    const now = new Date().toISOString()
    const today = now.split('T')[0]

    const { data: updated, error: updateError } = await db
      .from('contracts')
      .update({
        statut: 'signe',
        signature_date: now,
        signature_ip: ip,
        signature_user_agent: userAgent,
        signature_image: signature_image,
      })
      .eq('id', contract.id)
      .eq('statut', 'en_attente')   // verrou optimiste : évite la double-signature
      .select('id')
      .single()

    if (updateError || !updated) {
      console.error('[sign] Update contracts failed:', updateError)
      return NextResponse.json(
        {
          error: 'Erreur lors de l\'enregistrement de la signature. Veuillez réessayer.',
          debug: updateError?.code ?? 'NO_ROWS_UPDATED',
        },
        { status: 500 }
      )
    }

    // ── Vérification immédiate : confirmer que le statut est bien 'signe' en DB ─
    const { data: verify } = await db
      .from('contracts')
      .select('statut')
      .eq('id', contract.id)
      .single()

    if (verify?.statut !== 'signe') {
      console.error('[sign] Post-update verification failed — statut in DB:', verify?.statut)
      return NextResponse.json(
        {
          error: 'La mise à jour du contrat n\'a pas pu être confirmée. Veuillez réessayer.',
          debug: `VERIFY_FAILED:statut=${verify?.statut}`,
        },
        { status: 500 }
      )
    }

    // ── Étape 3 : Synchroniser le séjour ─────────────────────────────────────
    if (contract.sejour_id) {
      const { error: sejourError } = await db
        .from('sejours')
        .update({
          contrat_statut: 'signe',
          contrat_date_signature: today,
          contrat_lien: `${APP_URL}/sign/${token}`,
        })
        .eq('id', contract.sejour_id)

      if (sejourError) {
        // Non bloquant — la signature a réussi, on log juste l'erreur
        console.error('[sign] Sejour sync failed:', sejourError)
      }
    }

    // ── Étape 4 : Récupérer le profil bailleur (IBAN pour virement bancaire) ──
    let hostIban: string | null = null
    let hostBic: string | null = null
    if (contract.user_id) {
      const { data: hostProfile } = await db
        .from('profiles')
        .select('iban, bic')
        .eq('id', contract.user_id)
        .single()
      hostIban = hostProfile?.iban ?? null
      hostBic = hostProfile?.bic ?? null
    }

    const isVirement = typeof contract.modalites_paiement === 'string' &&
      contract.modalites_paiement.toLowerCase().includes('virement')

    // ── Étape 5 : Emails de confirmation ──────────────────────────────────────
    const guestName = `${contract.locataire_prenom} ${contract.locataire_nom}`
    const hostName = `${contract.bailleur_prenom} ${contract.bailleur_nom}`
    const signDate = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    const contractUrl = `${APP_URL}/sign/${token}`
    const paymentRedirectUrl = `${APP_URL}/api/stripe/payment/redirect?token=${token}`
    const depositRedirectUrl = `${APP_URL}/api/stripe/deposit/redirect?token=${token}`
    const dashboardUrl = `${APP_URL}/dashboard/voyageurs`

    const hasPayment = !!(contract.stripe_payment_enabled)
    const hasCaution = Number(contract.montant_caution) > 0
    const loyerFormatted = Number(contract.montant_loyer).toLocaleString('fr-FR', { minimumFractionDigits: 2 })
    // Nom du logement : utilise le nom personnalisé si disponible, sinon l'adresse
    const propertyLabel = (contract.logement_nom as string | null) ?? contract.logement_adresse
    const cautionFormatted = Number(contract.montant_caution).toLocaleString('fr-FR', { minimumFractionDigits: 2 })

    const ibanRef = contract.logement_adresse.slice(0, 30).replace(/[^a-zA-Z0-9 ]/g, '').trim()

    const ibanEmailBlock = (isVirement && hostIban) ? `
      <div style="background:#0a1a13;border:1px solid #1a3328;border-left:2px solid #a29bfe;border-radius:10px;padding:18px 20px;margin:0 0 24px;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:600;letter-spacing:0.5px;color:#7a9e8a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">VIREMENT BANCAIRE</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:4px 0;font-size:12px;color:#7a9e8a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;white-space:nowrap;padding-right:16px;">IBAN</td><td style="padding:4px 0;font-size:13px;color:#e8ede8;font-weight:500;font-family:Courier New,Courier,monospace;word-break:break-all;">${escHtml(hostIban)}</td></tr>
          ${hostBic ? `<tr><td style="padding:4px 0;font-size:12px;color:#7a9e8a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;white-space:nowrap;padding-right:16px;">BIC</td><td style="padding:4px 0;font-size:13px;color:#e8ede8;font-weight:500;font-family:Courier New,Courier,monospace;">${escHtml(hostBic)}</td></tr>` : ''}
          <tr><td style="padding:4px 0;font-size:12px;color:#7a9e8a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;white-space:nowrap;padding-right:16px;">Bénéficiaire</td><td style="padding:4px 0;font-size:13px;color:#e8ede8;font-weight:500;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${escHtml(`${contract.bailleur_prenom} ${contract.bailleur_nom}`)}</td></tr>
          ${Number(contract.montant_loyer) > 0 ? `<tr><td style="padding:4px 0;font-size:12px;color:#7a9e8a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;white-space:nowrap;padding-right:16px;">Montant</td><td style="padding:4px 0;font-size:14px;color:#FFD56B;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${loyerFormatted} €</td></tr>` : ''}
          <tr><td style="padding:4px 0;font-size:12px;color:#7a9e8a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;white-space:nowrap;padding-right:16px;">Référence</td><td style="padding:4px 0;font-size:13px;color:#e8ede8;font-weight:500;font-family:Courier New,Courier,monospace;">${escHtml(ibanRef)}</td></tr>
        </table>
        <p style="margin:12px 0 0;font-size:12px;color:#7a9e8a;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">Indiquez la référence dans le libellé du virement. Prévenez le propriétaire une fois le virement effectué.</p>
      </div>` : ''

    const stripeBlock = (hasPayment || hasCaution) ? `
      <div style="background:#0a1a13;border:1px solid #1a3328;border-left:2px solid #FFD56B;border-radius:10px;padding:18px 20px;margin:0 0 24px;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:600;letter-spacing:0.5px;color:#7a9e8a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">FINALISER LE DOSSIER</p>
        ${hasPayment ? `<a href="${paymentRedirectUrl}" style="display:block;text-align:center;background:#FFD56B;color:#0a0f0d;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;margin:0 0 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">Payer la réservation — ${loyerFormatted} €</a>` : ''}
        ${hasCaution ? `<a href="${depositRedirectUrl}" style="display:block;text-align:center;background:transparent;border:1px solid #1a3328;color:#e8ede8;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">Régler la caution — ${cautionFormatted} €</a>` : ''}
        ${hasCaution ? `<p style="margin:10px 0 0;font-size:12px;color:#7a9e8a;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">La caution est bloquée sur votre carte et libérée après votre séjour si aucun dommage n'est constaté.</p>` : ''}
      </div>` : ''

    const eidas = 'Ce contrat constitue une signature électronique simple au sens du règlement eIDAS (UE) 910/2014 et de l\'article 1366 du Code civil français.'

    // Email voyageur
    const guestEmailHtml = buildEmail({
      title: 'Votre contrat est signé',
      preview: `Signature confirmée pour ${propertyLabel}.`,
      body: `
        ${emailP(`Bonjour <strong style="color:#e8ede8;">${escHtml(guestName)}</strong>,`)}
        ${emailP(`Votre contrat de location pour <strong style="color:#e8ede8;">${escHtml(propertyLabel)}</strong> a été signé le <strong style="color:#e8ede8;">${escHtml(signDate)}</strong>.`)}
        ${emailInfoBlock([
          { label: 'Logement', value: escHtml(propertyLabel) },
          { label: 'Signé le', value: escHtml(signDate) },
          { label: 'Adresse IP', value: escHtml(ip) },
        ], '#34D399')}
        ${stripeBlock}
        ${ibanEmailBlock}
        ${emailBtn(contractUrl, 'Accéder au contrat signé', 'green')}
        ${emailNote(eidas)}
      `,
    })

    // Email hôte
    const hostPaymentsBlock = (hasPayment || hasCaution) ? emailInfoBlock([
      ...(hasPayment ? [{ label: 'Réservation', value: `${loyerFormatted} €` }] : []),
      ...(hasCaution ? [{ label: 'Caution', value: `${cautionFormatted} €` }] : []),
      { label: 'Locataire', value: escHtml(contract.locataire_prenom) },
    ]) : ''

    const hostEmailHtml = buildEmail({
      title: 'Contrat signé par le locataire',
      preview: `${guestName} a signé le contrat pour ${propertyLabel}.`,
      body: `
        ${emailP(`Bonjour <strong style="color:#e8ede8;">${escHtml(hostName)}</strong>,`)}
        ${emailP(`<strong style="color:#e8ede8;">${escHtml(guestName)}</strong> a signé électroniquement le contrat pour <strong style="color:#e8ede8;">${escHtml(propertyLabel)}</strong> le <strong style="color:#e8ede8;">${escHtml(signDate)}</strong>.`)}
        ${emailInfoBlock([
          { label: 'Logement', value: escHtml(propertyLabel) },
          { label: 'Signé le', value: escHtml(signDate) },
          { label: 'Adresse IP', value: escHtml(ip) },
        ], '#34D399')}
        ${hostPaymentsBlock}
        ${emailBtn(contractUrl, 'Voir le contrat signé', 'green')}
        ${emailBtn(dashboardUrl, 'Tableau de bord', 'secondary')}
        ${emailNote(eidas)}
      `,
    })

    if (contract.locataire_email) {
      await getResend().emails.send({
        from: FROM_EMAIL,
        to: contract.locataire_email,
        subject: `Contrat signé — finalisez votre dossier pour ${propertyLabel}`,
        html: guestEmailHtml,
      }).catch(e => console.error('[sign] Guest email failed:', e))
    }

    await getResend().emails.send({
      from: FROM_EMAIL,
      to: contract.bailleur_email,
      subject: `${guestName} a signé le contrat — ${propertyLabel}`,
      html: hostEmailHtml,
    }).catch(e => console.error('[sign] Host email failed:', e))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[contracts/sign]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

// GET /api/contracts/sign?token=xxx
// Retourne les données du contrat pour la page de signature (sans données sensibles)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token manquant.' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: contract, error } = await supabase
    .from('contracts')
    .select(
      'id, statut, token_expires_at, ' +
      'bailleur_prenom, bailleur_nom, bailleur_email, bailleur_telephone, bailleur_adresse, ' +
      'locataire_prenom, locataire_nom, locataire_email, locataire_telephone, ' +
      'logement_adresse, logement_description, capacite_max, ' +
      'date_arrivee, date_depart, heure_arrivee, heure_depart, ' +
      'montant_loyer, montant_caution, modalites_paiement, ' +
      'conditions_annulation, reglement_interieur, animaux_acceptes, fumeur_accepte, ' +
      'signature_date, created_at'
    )
    .eq('token', token)
    .single()

  if (error || !contract) {
    return NextResponse.json({ error: 'Contrat introuvable.' }, { status: 404 })
  }

  return NextResponse.json({ contract })
}
