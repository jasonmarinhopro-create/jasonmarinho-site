import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'
import { logger } from '@/lib/logger'
const log = logger('api/stripe/deposit/create')

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// POST /api/stripe/deposit/create
// Body: { token }   (token du contrat)
// Crée une Stripe Checkout Session en pré-autorisation pour la caution
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    if (!token) return NextResponse.json({ error: 'Token manquant.' }, { status: 400 })

    const supabase = createServiceClient()

    // Récupérer le contrat
    const { data: contract, error: cErr } = await supabase
      .from('contracts')
      .select('*')
      .eq('token', token)
      .single()

    if (cErr || !contract) {
      return NextResponse.json({ error: 'Contrat introuvable.' }, { status: 404 })
    }

    if (contract.statut !== 'signe') {
      return NextResponse.json({ error: 'Le contrat doit être signé avant de payer la caution.' }, { status: 400 })
    }

    if (!contract.montant_caution || Number(contract.montant_caution) <= 0) {
      return NextResponse.json({ error: 'Pas de caution sur ce contrat.' }, { status: 400 })
    }

    if (contract.stripe_deposit_status === 'held') {
      return NextResponse.json({ error: 'La caution a déjà été encaissée.' }, { status: 409 })
    }

    // Récupérer le stripe_account_id du bailleur
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', contract.user_id)
      .single()

    if (!profile?.stripe_account_id || !profile.stripe_onboarding_complete) {
      return NextResponse.json({ error: 'Le bailleur n\'a pas encore connecté son compte Stripe.' }, { status: 400 })
    }

    const amountCents = Math.round(Number(contract.montant_caution) * 100)

    // Créer la Checkout Session sur le compte Connect du bailleur
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'eur',
              unit_amount: amountCents,
              product_data: {
                name: `Dépôt de garantie, ${contract.logement_adresse}`,
                description: `Caution pour le séjour du ${new Date(contract.date_arrivee).toLocaleDateString('fr-FR')} au ${new Date(contract.date_depart).toLocaleDateString('fr-FR')}. Cette somme est bloquée sur votre carte mais ne sera prélevée qu'en cas de dommages constatés.`,
              },
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          capture_method: 'manual', // Pré-autorisation, pas de débit immédiat
          description: `Caution contrat ${contract.id.slice(0, 8).toUpperCase()}`,
          metadata: { contract_id: contract.id },
        },
        customer_email: contract.locataire_email ?? undefined,
        success_url: `${APP_URL}/sign/${token}?deposit=success`,
        cancel_url:  `${APP_URL}/sign/${token}?deposit=cancel`,
        locale: 'fr',
        metadata: { contract_id: contract.id, token },
      },
      { stripeAccount: profile.stripe_account_id }
    )

    // Sauvegarder l'ID de session en base
    await supabase
      .from('contracts')
      .update({
        stripe_deposit_checkout_id: session.id,
        stripe_deposit_status: 'pending',
      })
      .eq('id', contract.id)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    log.error('unexpected', err)
    return NextResponse.json({ error: 'Erreur lors de la création du paiement.' }, { status: 500 })
  }
}
