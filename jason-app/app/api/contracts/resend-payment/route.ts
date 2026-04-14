import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

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

// POST /api/contracts/resend-payment
// Body: { contract_id }
// Renvoie l'email de paiement au voyageur
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification de l'hôte (getUser valide le token côté serveur Supabase)
    const supabase = await createAuthClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const { contract_id } = await request.json()
    if (!contract_id) {
      return NextResponse.json({ error: 'contract_id manquant.' }, { status: 400 })
    }

    const db = createServiceClient()

    // Récupérer le contrat (vérification ownership)
    const { data: contract, error: fetchErr } = await db
      .from('contracts')
      .select('*')
      .eq('id', contract_id)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !contract) {
      return NextResponse.json({ error: 'Contrat introuvable.' }, { status: 404 })
    }

    if (contract.statut !== 'signe') {
      return NextResponse.json({ error: 'Le contrat doit être signé pour renvoyer les liens de paiement.' }, { status: 400 })
    }

    if (!contract.locataire_email) {
      return NextResponse.json({ error: 'Aucun email renseigné pour ce voyageur.' }, { status: 400 })
    }

    const guestName = `${contract.locataire_prenom} ${contract.locataire_nom}`
    const contractUrl = `${APP_URL}/sign/${contract.token}`
    const paymentRedirectUrl = `${APP_URL}/api/stripe/payment/redirect?token=${contract.token}`
    const depositRedirectUrl = `${APP_URL}/api/stripe/deposit/redirect?token=${contract.token}`

    const hasPayment = !!(contract.stripe_payment_enabled) && contract.stripe_payment_status !== 'paid'
    const hasCaution = Number(contract.montant_caution) > 0 &&
      contract.stripe_deposit_status !== 'held' &&
      contract.stripe_deposit_status !== 'captured'

    if (!hasPayment && !hasCaution) {
      return NextResponse.json({ error: 'Tous les paiements ont déjà été effectués.' }, { status: 400 })
    }

    const loyerFormatted = Number(contract.montant_loyer).toLocaleString('fr-FR', { minimumFractionDigits: 2 })
    const cautionFormatted = Number(contract.montant_caution).toLocaleString('fr-FR', { minimumFractionDigits: 2 })

    const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d1f1a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="background:#132b22;border:1px solid #1e3d2f;border-radius:20px;overflow:hidden;">
      <div style="padding:32px 32px 24px;border-bottom:1px solid #1e3d2f;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#FFD56B;font-weight:600;">Rappel — Dossier à finaliser</p>
        <h1 style="margin:0;font-size:24px;font-weight:400;color:#f0ebe1;font-family:Georgia,serif;">Finalisez votre dossier</h1>
      </div>
      <div style="padding:28px 32px;">
        <p style="color:#a5c4b0;font-size:15px;line-height:1.7;margin:0 0 20px;">
          Bonjour <strong style="color:#f0ebe1;">${guestName}</strong>,
        </p>
        <p style="color:#a5c4b0;font-size:15px;line-height:1.7;margin:0 0 20px;">
          Votre contrat de location pour <strong style="color:#f0ebe1;">${contract.logement_adresse}</strong> a bien été signé.
          Il reste à effectuer le${hasPayment && hasCaution ? 's paiements suivants' : ' paiement suivant'} pour confirmer définitivement votre séjour :
        </p>
        <div style="background:#0a2018;border:1px solid rgba(255,213,107,0.25);border-radius:14px;padding:22px 24px;margin:0 0 24px;">
          <p style="margin:0 0 18px;font-size:14px;color:#a5c4b0;line-height:1.6;">Cliquez sur le bouton correspondant pour effectuer votre paiement en ligne :</p>
          ${hasPayment ? `
          <a href="${paymentRedirectUrl}" style="display:block;text-align:center;background:rgba(255,213,107,0.18);border:1px solid rgba(255,213,107,0.4);color:#FFD56B;padding:14px 24px;border-radius:12px;text-decoration:none;font-size:15px;font-weight:600;margin:0 0 12px;">
            Payer la réservation — ${loyerFormatted} € →
          </a>` : ''}
          ${hasCaution ? `
          <a href="${depositRedirectUrl}" style="display:block;text-align:center;background:rgba(99,91,255,0.2);border:1px solid rgba(99,91,255,0.4);color:#a29bfe;padding:14px 24px;border-radius:12px;text-decoration:none;font-size:15px;font-weight:600;margin:0 0 12px;">
            Régler la caution — ${cautionFormatted} € →
          </a>` : ''}
          ${hasCaution ? `<p style="margin:8px 0 0;font-size:12px;color:#6b9a7e;line-height:1.5;">La caution est bloquée sur votre carte mais non débitée — elle est libérée après votre séjour si aucun dommage n'est constaté.</p>` : ''}
        </div>
        <a href="${contractUrl}" style="display:block;text-align:center;background:#34D399;color:#0d1f1a;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:600;margin:0 0 20px;">
          Accéder au contrat signé
        </a>
        <p style="color:#6b9a7e;font-size:12px;line-height:1.6;margin:0;">
          En cas de difficulté, contactez directement votre propriétaire.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`

    const { error: emailErr } = await resend.emails.send({
      from: FROM_EMAIL,
      to: contract.locataire_email,
      subject: `Rappel — Finalisez votre dossier pour ${contract.logement_adresse}`,
      html: emailHtml,
    })

    if (emailErr) {
      console.error('[resend-payment] Email error:', emailErr)
      return NextResponse.json({ error: 'Erreur lors de l\'envoi de l\'email.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[contracts/resend-payment]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
