import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Service role — bypass RLS complet (lecture + écriture)
// Nécessaire car le locataire signe sans session authentifiée
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

const resend = new Resend(process.env.RESEND_API_KEY)
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
    const { data: contract, error: fetchError } = await db
      .from('contracts')
      .select('id, statut, sejour_id, token_expires_at, locataire_email, bailleur_email, ' +
              'locataire_prenom, locataire_nom, bailleur_prenom, bailleur_nom, ' +
              'logement_adresse, montant_loyer, montant_caution, stripe_payment_enabled')
      .eq('token', token)
      .single()

    if (fetchError || !contract) {
      console.error('[sign] Contract not found for token:', token, fetchError?.message)
      return NextResponse.json({ error: 'Contrat introuvable.' }, { status: 404 })
    }

    // Idempotent : contrat déjà signé
    if (contract.statut === 'signe') {
      return NextResponse.json({ success: true, already_signed: true })
    }

    if (contract.statut === 'annule') {
      return NextResponse.json({ error: 'Ce contrat a été annulé.' }, { status: 409 })
    }

    if (contract.statut !== 'en_attente') {
      return NextResponse.json({ error: 'Contrat non signable.' }, { status: 409 })
    }

    if (new Date(contract.token_expires_at) < new Date()) {
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
        { error: 'Erreur lors de l\'enregistrement de la signature. Veuillez réessayer.' },
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

    // ── Étape 4 : Emails de confirmation ──────────────────────────────────────
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
    const cautionFormatted = Number(contract.montant_caution).toLocaleString('fr-FR', { minimumFractionDigits: 2 })

    // Email voyageur
    const guestEmailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d1f1a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="background:#132b22;border:1px solid #1e3d2f;border-radius:20px;overflow:hidden;">
      <div style="padding:32px 32px 24px;border-bottom:1px solid #1e3d2f;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#34D399;font-weight:600;">Contrat signé</p>
        <h1 style="margin:0;font-size:24px;font-weight:400;color:#f0ebe1;font-family:Georgia,serif;">Signature confirmée</h1>
      </div>
      <div style="padding:28px 32px;">
        <p style="color:#a5c4b0;font-size:15px;line-height:1.7;margin:0 0 20px;">
          Bonjour <strong style="color:#f0ebe1;">${guestName}</strong>,
        </p>
        <p style="color:#a5c4b0;font-size:15px;line-height:1.7;margin:0 0 20px;">
          Votre contrat de location pour <strong style="color:#f0ebe1;">${contract.logement_adresse}</strong> a bien été signé le <strong style="color:#f0ebe1;">${signDate}</strong>.
        </p>
        <div style="background:#0d1f1a;border:1px solid #1e3d2f;border-radius:12px;padding:18px 20px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:11px;color:#6b9a7e;text-transform:uppercase;letter-spacing:1px;">Référence signature</p>
          <p style="margin:0;font-size:12px;color:#a5c4b0;word-break:break-all;">Signé le ${signDate} depuis l'adresse IP ${ip}</p>
        </div>
        ${(hasPayment || hasCaution) ? `
        <div style="background:#0a2018;border:1px solid rgba(255,213,107,0.25);border-radius:14px;padding:22px 24px;margin:0 0 24px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#FFD56B;text-transform:uppercase;letter-spacing:1px;">Étape suivante — Finalisez votre dossier</p>
          <p style="margin:0 0 18px;font-size:14px;color:#a5c4b0;line-height:1.6;">Pour confirmer définitivement votre séjour, effectuez le(s) paiement(s) ci-dessous :</p>
          ${hasPayment ? `
          <a href="${paymentRedirectUrl}" style="display:block;text-align:center;background:rgba(255,213,107,0.18);border:1px solid rgba(255,213,107,0.4);color:#FFD56B;padding:14px 24px;border-radius:12px;text-decoration:none;font-size:15px;font-weight:600;margin:0 0 12px;">
            Payer la réservation — ${loyerFormatted} € →
          </a>` : ''}
          ${hasCaution ? `
          <a href="${depositRedirectUrl}" style="display:block;text-align:center;background:rgba(99,91,255,0.2);border:1px solid rgba(99,91,255,0.4);color:#a29bfe;padding:14px 24px;border-radius:12px;text-decoration:none;font-size:15px;font-weight:600;margin:0 0 12px;">
            Régler la caution — ${cautionFormatted} € →
          </a>` : ''}
          <p style="margin:8px 0 0;font-size:12px;color:#6b9a7e;line-height:1.5;">La caution est bloquée sur votre carte mais non débitée — elle est libérée après votre séjour si aucun dommage n'est constaté.</p>
        </div>` : ''}
        <a href="${contractUrl}" style="display:block;text-align:center;background:#34D399;color:#0d1f1a;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:600;margin:0 0 20px;">
          Accéder au contrat signé
        </a>
        <p style="color:#6b9a7e;font-size:12px;line-height:1.6;margin:0;">
          Ce contrat constitue une signature électronique simple valide selon le règlement eIDAS (UE) 910/2014 et l'article 1366 du Code civil français.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`

    // Email hôte
    const hostEmailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d1f1a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="background:#132b22;border:1px solid #1e3d2f;border-radius:20px;overflow:hidden;">
      <div style="padding:32px 32px 24px;border-bottom:1px solid #1e3d2f;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#34D399;font-weight:600;">Contrat signé</p>
        <h1 style="margin:0;font-size:24px;font-weight:400;color:#f0ebe1;font-family:Georgia,serif;">Signature confirmée</h1>
      </div>
      <div style="padding:28px 32px;">
        <p style="color:#a5c4b0;font-size:15px;line-height:1.7;margin:0 0 20px;">
          Bonjour <strong style="color:#f0ebe1;">${hostName}</strong>,
        </p>
        <p style="color:#a5c4b0;font-size:15px;line-height:1.7;margin:0 0 20px;">
          <strong style="color:#f0ebe1;">${guestName}</strong> a signé électroniquement le contrat de location pour <strong style="color:#f0ebe1;">${contract.logement_adresse}</strong> le <strong style="color:#f0ebe1;">${signDate}</strong>.
        </p>
        <div style="background:#0d1f1a;border:1px solid #1e3d2f;border-radius:12px;padding:18px 20px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:11px;color:#6b9a7e;text-transform:uppercase;letter-spacing:1px;">Référence signature</p>
          <p style="margin:0;font-size:12px;color:#a5c4b0;word-break:break-all;">Signé le ${signDate} depuis l'adresse IP ${ip}</p>
        </div>
        ${(hasPayment || hasCaution) ? `
        <div style="background:#0d1f1a;border:1px solid #1e3d2f;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0 0 6px;font-size:12px;color:#6b9a7e;text-transform:uppercase;letter-spacing:1px;">Paiements attendus du locataire</p>
          ${hasPayment ? `<p style="margin:0 0 4px;font-size:14px;color:#FFD56B;font-weight:600;">Réservation : ${loyerFormatted} €</p>` : ''}
          ${hasCaution ? `<p style="margin:0;font-size:14px;color:#a29bfe;font-weight:600;">Caution : ${cautionFormatted} €</p>` : ''}
          <p style="margin:8px 0 0;font-size:12px;color:#6b9a7e;line-height:1.5;">Un email de rappel a été envoyé à ${contract.locataire_prenom} avec les liens de paiement. Suivez les paiements depuis votre tableau de bord.</p>
        </div>` : ''}
        <a href="${contractUrl}" style="display:block;text-align:center;background:#34D399;color:#0d1f1a;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:600;margin:0 0 12px;">
          Voir le contrat signé
        </a>
        <a href="${dashboardUrl}" style="display:block;text-align:center;background:transparent;border:1px solid #1e3d2f;color:#a5c4b0;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:600;margin:0 0 20px;">
          Tableau de bord
        </a>
        <p style="color:#6b9a7e;font-size:12px;line-height:1.6;margin:0;">
          Ce contrat constitue une signature électronique simple valide selon le règlement eIDAS (UE) 910/2014 et l'article 1366 du Code civil français.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`

    if (contract.locataire_email) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: contract.locataire_email,
        subject: `Contrat signé — finalisez votre dossier pour ${contract.logement_adresse}`,
        html: guestEmailHtml,
      }).catch(e => console.error('[sign] Guest email failed:', e))
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to: contract.bailleur_email,
      subject: `${guestName} a signé le contrat — ${contract.logement_adresse}`,
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
