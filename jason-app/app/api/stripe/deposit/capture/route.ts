import { getServiceClient as serviceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { logger } from '@/lib/logger'
import { sendDepositOutcomeToGuest } from '@/lib/email/deposit-guest'
const log = logger('api/stripe/deposit/capture')

// POST /api/stripe/deposit/capture
// Body: { contract_id, amount?, motif }
// Le bailleur retient tout ou partie de la caution (dommages constatés).
// Depuis le 05/10/2026 : montant au choix (le reste du blocage est levé par
// Stripe), motif obligatoire, e-mail au voyageur avec le montant et le motif.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { contract_id, amount, motif } = await request.json()
    if (!contract_id) return NextResponse.json({ error: 'contract_id manquant.' }, { status: 400 })
    const reason = String(motif ?? '').trim().slice(0, 300)
    if (reason.length < 3) return NextResponse.json({ error: 'Indique le motif de la retenue : il est envoyé au voyageur.' }, { status: 400 })

    const db = serviceClient()

    // Récupérer le contrat (vérifie ownership via user_id)
    const { data: contract } = await db
      .from('contracts')
      .select('stripe_deposit_status, stripe_deposit_payment_intent_id, user_id, id, token, langue, locataire_email, locataire_prenom, bailleur_prenom, bailleur_nom, bailleur_email, logement_nom, logement_adresse, montant_caution')
      .eq('id', contract_id)
      .eq('user_id', user.id)
      .single()

    if (!contract) return NextResponse.json({ error: 'Contrat introuvable.' }, { status: 404 })
    if (contract.stripe_deposit_status !== 'held') {
      return NextResponse.json({ error: 'La caution n\'est pas en état "retenu".' }, { status: 400 })
    }
    if (!contract.stripe_deposit_payment_intent_id) {
      return NextResponse.json({ error: 'Aucun PaymentIntent trouvé.' }, { status: 400 })
    }

    const caution = Number(contract.montant_caution ?? 0)
    const wanted = amount == null || amount === '' ? caution : Math.round(Number(amount) * 100) / 100
    if (!Number.isFinite(wanted) || wanted <= 0 || wanted > caution + 0.001) {
      return NextResponse.json({ error: `Montant à retenir entre 0,01 € et ${caution.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €.` }, { status: 400 })
    }
    const wantedCents = Math.round(wanted * 100)
    const partial = wantedCents < Math.round(caution * 100)

    // Récupérer le compte Stripe du bailleur
    const { data: profile } = await db
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_account_id) {
      return NextResponse.json({ error: 'Compte Stripe non trouvé.' }, { status: 400 })
    }

    // VERROU OPTIMISTE : marque 'capturing' AVANT l'appel Stripe pour
    // empêcher un double-clic / double-tab du bailleur d'envoyer 2 captures.
    // .eq('stripe_deposit_status', 'held') = update n'affecte rien si déjà
    // capturé ailleurs. Si la capture Stripe foire, on remet 'held'.
    const { data: locked } = await db
      .from('contracts')
      .update({ stripe_deposit_status: 'capturing' })
      .eq('id', contract_id)
      .eq('stripe_deposit_status', 'held')
      .select('id')
      .maybeSingle()

    if (!locked) {
      // Quelqu'un a capturé entre notre check et notre update
      return NextResponse.json({ error: 'Caution déjà en cours de capture ou déjà capturée.' }, { status: 409 })
    }

    // Capturer le PaymentIntent (débit réel). idempotencyKey garantit
    // qu'un retry réseau ne crée pas une seconde capture côté Stripe.
    let capturedPi: { id: string; status: string } | null = null
    try {
      capturedPi = await stripe.paymentIntents.capture(
        contract.stripe_deposit_payment_intent_id,
        {
          ...(partial ? { amount_to_capture: wantedCents } : {}),
          metadata: { motif_retenue: reason },
        },
        {
          stripeAccount: profile.stripe_account_id,
          idempotencyKey: `capture:${contract_id}:${contract.stripe_deposit_payment_intent_id}:${wantedCents}`,
        }
      )
    } catch (stripeErr) {
      // Rollback verrou : la capture a foiré, on redonne 'held' pour que
      // le bailleur puisse réessayer (sinon le contrat reste bloqué
      // en 'capturing' pour toujours).
      await db
        .from('contracts')
        .update({ stripe_deposit_status: 'held' })
        .eq('id', contract_id)
        .eq('stripe_deposit_status', 'capturing')
      log.error('stripeCapture', stripeErr)
      return NextResponse.json({ error: 'Erreur Stripe lors de l\'encaissement. Le statut a été rétabli.' }, { status: 502 })
    }

    // Vérifie que Stripe confirme bien la capture (status = 'succeeded')
    // avant de marquer la DB comme 'captured'. Évite le marquage faux
    // si Stripe répond OK mais avec un status inattendu.
    if (capturedPi?.status !== 'succeeded') {
      log.error('captureNotSucceeded', { status: capturedPi?.status })
      return NextResponse.json({
        error: `Statut Stripe inattendu après capture : ${capturedPi?.status ?? 'inconnu'}. Contacte le support.`,
      }, { status: 502 })
    }

    // Confirmation : marque comme capturé en DB
    await db
      .from('contracts')
      .update({ stripe_deposit_status: 'captured' })
      .eq('id', contract_id)
      .eq('stripe_deposit_status', 'capturing')

    await sendDepositOutcomeToGuest({
      to: contract.locataire_email, langue: contract.langue, token: contract.token,
      guestFirstName: contract.locataire_prenom,
      hostName: `${contract.bailleur_prenom ?? ''} ${contract.bailleur_nom ?? ''}`.trim(),
      hostEmail: contract.bailleur_email,
      property: contract.logement_nom ?? contract.logement_adresse ?? '',
      deposit: caution, outcome: 'captured', kept: wanted, reason,
    })

    return NextResponse.json({ success: true, kept: wanted })
  } catch (err) {
    log.error('unexpected', err)
    return NextResponse.json({ error: 'Erreur lors de l\'encaissement.' }, { status: 500 })
  }
}
