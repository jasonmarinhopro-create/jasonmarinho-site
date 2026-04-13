import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Service role client (bypasses RLS — utilisé uniquement côté serveur)
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

    const supabase = createServiceClient()

    // Récupérer le contrat par token
    const { data: contract, error: fetchErr } = await supabase
      .from('contracts')
      .select('*')
      .eq('token', token)
      .single()

    if (fetchErr || !contract) {
      return NextResponse.json({ error: 'Contrat introuvable.' }, { status: 404 })
    }

    // Vérifications
    if (contract.statut !== 'en_attente') {
      return NextResponse.json({ error: 'Ce contrat a déjà été traité.' }, { status: 409 })
    }
    if (new Date(contract.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Ce lien de signature a expiré. Contactez le propriétaire.' }, { status: 410 })
    }

    // Audit trail eIDAS : IP + user-agent
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? 'inconnue'
    const userAgent = request.headers.get('user-agent') ?? 'inconnu'

    // Enregistrer la signature
    const { error: updateErr } = await supabase
      .from('contracts')
      .update({
        statut: 'signe',
        signature_date: new Date().toISOString(),
        signature_ip: ip,
        signature_user_agent: userAgent,
        signature_image,
      })
      .eq('id', contract.id)

    if (updateErr) {
      return NextResponse.json({ error: 'Erreur lors de l\'enregistrement de la signature.' }, { status: 500 })
    }

    // Mettre à jour le statut du séjour
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('sejours')
      .update({
        contrat_statut: 'signe',
        contrat_date_signature: today,
        contrat_lien: `${APP_URL}/sign/${token}`,
      })
      .eq('id', contract.sejour_id)

    // Emails de confirmation
    const guestName = `${contract.locataire_prenom} ${contract.locataire_nom}`
    const hostName = `${contract.bailleur_prenom} ${contract.bailleur_nom}`
    const signDate = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    const contractUrl = `${APP_URL}/sign/${token}`

    const confirmationHtml = (recipientName: string) => `
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
          Bonjour <strong style="color:#f0ebe1;">${recipientName}</strong>,
        </p>
        <p style="color:#a5c4b0;font-size:15px;line-height:1.7;margin:0 0 20px;">
          Le contrat de location pour <strong style="color:#f0ebe1;">${contract.logement_adresse}</strong> a été signé électroniquement par <strong style="color:#f0ebe1;">${guestName}</strong> le <strong style="color:#f0ebe1;">${signDate}</strong>.
        </p>
        <div style="background:#0d1f1a;border:1px solid #1e3d2f;border-radius:12px;padding:18px 20px;margin:24px 0;">
          <p style="margin:0 0 4px;font-size:11px;color:#6b9a7e;text-transform:uppercase;letter-spacing:1px;">Référence signature</p>
          <p style="margin:0;font-size:12px;color:#a5c4b0;word-break:break-all;">Signé le ${signDate} depuis l'adresse IP ${ip}</p>
        </div>
        <a href="${contractUrl}" style="display:block;text-align:center;background:#34D399;color:#0d1f1a;padding:16px 32px;border-radius:12px;text-decoration:none;font-size:15px;font-weight:600;margin:28px 0;">
          Consulter le contrat signé
        </a>
        <p style="color:#6b9a7e;font-size:12px;line-height:1.6;margin:0;">
          Ce contrat constitue une signature électronique simple valide selon le règlement eIDAS (UE) 910/2014 et l'article 1366 du Code civil français.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`

    // Email au locataire
    if (contract.locataire_email) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: contract.locataire_email,
        subject: `Contrat signé — ${contract.logement_adresse}`,
        html: confirmationHtml(guestName),
      }).catch(() => null)
    }

    // Email à l'hôte
    await resend.emails.send({
      from: FROM_EMAIL,
      to: contract.bailleur_email,
      subject: `${guestName} a signé le contrat — ${contract.logement_adresse}`,
      html: confirmationHtml(hostName),
    }).catch(() => null)

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
