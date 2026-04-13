import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// POST /api/stripe/payment/create
// Body: { token }   (token du contrat)
// Crée une Stripe Checkout Session pour le paiement du loyer (débit immédiat)
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    if (!token) return NextResponse.json({ error: 'Token manquant.' }, { status: 400 })

    const supabase = createServiceClient()

    const { data: contract, error: cErr } = await supabase
      .from('contracts')
      .select('*')
      .eq('token', token)
      .single()

    if (cErr || !contract) {
      return NextResponse.json({ error: 'Contrat introuvable.' }, { status: 404 })
    }

    if (contract.statut !== 'signe') {
      return NextResponse.json({ error: 'Le contrat doit être signé avant de payer la réservation.' }, { status: 400 })
    }

    if (!contract.stripe_payment_enabled) {
      return NextResponse.json({ error: 'Le paiement en ligne n\'est pas activé pour ce contrat.' }, { status: 400 })
    }

    if (contract.stripe_payment_status === 'paid') {
      return NextResponse.json({ error: 'La réservation a déjà été réglée.' }, { status: 409 })
    }

    if (!contract.montant_loyer || Number(contract.montant_loyer) <= 0) {
      return NextResponse.json({ error: 'Montant du loyer invalide.' }, { status: 400 })
    }

    // Récupérer le compte Stripe du bailleur
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', contract.user_id)
      .single()

    if (!profile?.stripe_account_id || !profile.stripe_onboarding_complete) {
      return NextResponse.json({ error: 'Le bailleur n\'a pas encore connecté son compte Stripe.' }, { status: 400 })
    }

    const amountCents = Math.round(Number(contract.montant_loyer) * 100)

    const n = Math.round(
      (new Date(contract.date_depart).getTime() - new Date(contract.date_arrivee).getTime()) / 86400000
    )

    // Checkout Session en mode paiement immédiat (capture automatique)
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'eur',
              unit_amount: amountCents,
              product_data: {
                name: `Réservation — ${contract.logement_adresse}`,
                description: `${n} nuit${n > 1 ? 's' : ''} — du ${new Date(contract.date_arrivee).toLocaleDateString('fr-FR')} au ${new Date(contract.date_depart).toLocaleDateString('fr-FR')}`,
              },
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          capture_method: 'automatic',
          description: `Loyer contrat ${contract.id.slice(0, 8).toUpperCase()}`,
          metadata: { contract_id: contract.id, type: 'loyer' },
        },
        customer_email: contract.locataire_email ?? undefined,
        success_url: `${APP_URL}/sign/${token}?payment=success`,
        cancel_url:  `${APP_URL}/sign/${token}?payment=cancel`,
        locale: 'fr',
        metadata: { contract_id: contract.id, token, type: 'loyer' },
      },
      { stripeAccount: profile.stripe_account_id }
    )

    await supabase
      .from('contracts')
      .update({
        stripe_payment_checkout_id: session.id,
        stripe_payment_status: 'pending',
      })
      .eq('id', contract.id)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/payment/create]', err)
    return NextResponse.json({ error: 'Erreur lors de la création du paiement.' }, { status: 500 })
  }
}
