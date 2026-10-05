import { getServiceClient as serviceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { logger } from '@/lib/logger'
import { sendDepositOutcomeToGuest } from '@/lib/email/deposit-guest'
const log = logger('api/stripe/deposit/release')

// POST /api/stripe/deposit/release
// Body: { contract_id }
// Le bailleur libère la caution (séjour sans dommages)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { contract_id } = await request.json()
    if (!contract_id) return NextResponse.json({ error: 'contract_id manquant.' }, { status: 400 })

    const db = serviceClient()

    // Récupérer le contrat (vérifie ownership)
    const { data: contract } = await db
      .from('contracts')
      .select('stripe_deposit_status, stripe_deposit_payment_intent_id, id, token, langue, locataire_email, locataire_prenom, bailleur_prenom, bailleur_nom, bailleur_email, logement_nom, logement_adresse, montant_caution')
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

    // Récupérer le compte Stripe du bailleur
    const { data: profile } = await db
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_account_id) {
      return NextResponse.json({ error: 'Compte Stripe non trouvé.' }, { status: 400 })
    }

    // VERROU OPTIMISTE : marque 'releasing' AVANT l'appel Stripe.
    // Évite que 2 clics en parallèle annulent 2× la même PaymentIntent
    // (Stripe répondrait OK une fois puis erreur, mais on serait dans un
    // état incohérent côté DB).
    const { data: locked } = await db
      .from('contracts')
      .update({ stripe_deposit_status: 'releasing' })
      .eq('id', contract_id)
      .eq('stripe_deposit_status', 'held')
      .select('id')
      .maybeSingle()

    if (!locked) {
      return NextResponse.json({ error: 'Caution déjà en cours de libération ou déjà libérée.' }, { status: 409 })
    }

    // Annuler le PaymentIntent (libère le blocage carte) + idempotency
    let canceledPi: { id: string; status: string } | null = null
    try {
      canceledPi = await stripe.paymentIntents.cancel(
        contract.stripe_deposit_payment_intent_id,
        {},
        {
          stripeAccount: profile.stripe_account_id,
          idempotencyKey: `release:${contract_id}:${contract.stripe_deposit_payment_intent_id}`,
        }
      )
    } catch (stripeErr) {
      // Rollback verrou
      await db
        .from('contracts')
        .update({ stripe_deposit_status: 'held' })
        .eq('id', contract_id)
        .eq('stripe_deposit_status', 'releasing')
      log.error('stripeCancel', stripeErr)
      return NextResponse.json({ error: 'Erreur Stripe lors de la libération. Le statut a été rétabli.' }, { status: 502 })
    }

    // Stripe confirme l'annulation ?
    if (canceledPi?.status !== 'canceled') {
      log.error('cancelNotCanceled', { status: canceledPi?.status })
      return NextResponse.json({
        error: `Statut Stripe inattendu après annulation : ${canceledPi?.status ?? 'inconnu'}.`,
      }, { status: 502 })
    }

    await db
      .from('contracts')
      .update({ stripe_deposit_status: 'released' })
      .eq('id', contract_id)
      .eq('stripe_deposit_status', 'releasing')

    // Le voyageur est prévenu (05/10/2026) : avant, il devait surveiller son compte
    await sendDepositOutcomeToGuest({
      to: contract.locataire_email, langue: contract.langue, token: contract.token,
      guestFirstName: contract.locataire_prenom,
      hostName: `${contract.bailleur_prenom ?? ''} ${contract.bailleur_nom ?? ''}`.trim(),
      hostEmail: contract.bailleur_email,
      property: contract.logement_nom ?? contract.logement_adresse ?? '',
      deposit: Number(contract.montant_caution ?? 0), outcome: 'released',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('unexpected', err)
    return NextResponse.json({ error: 'Erreur lors de la libération.' }, { status: 500 })
  }
}
