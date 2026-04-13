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

// GET /api/stripe/deposit/redirect?token=xxx
// Crée une Stripe Checkout Session pour la caution et redirige directement vers Stripe
// Utilisé pour les liens dans les emails (pas de JS possible)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(`${APP_URL}/sign/${token}?deposit=error`)
  }

  try {
    const supabase = createServiceClient()

    const { data: contract, error: cErr } = await supabase
      .from('contracts')
      .select('*')
      .eq('token', token)
      .single()

    if (cErr || !contract) {
      return NextResponse.redirect(`${APP_URL}/sign/${token}?deposit=error`)
    }

    if (contract.statut !== 'signe') {
      return NextResponse.redirect(`${APP_URL}/sign/${token}?deposit=error`)
    }

    if (!contract.montant_caution || Number(contract.montant_caution) <= 0) {
      return NextResponse.redirect(`${APP_URL}/sign/${token}?deposit=error`)
    }

    if (contract.stripe_deposit_status === 'held') {
      return NextResponse.redirect(`${APP_URL}/sign/${token}?deposit=success`)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', contract.user_id)
      .single()

    if (!profile?.stripe_account_id || !profile.stripe_onboarding_complete) {
      return NextResponse.redirect(`${APP_URL}/sign/${token}?deposit=error`)
    }

    const amountCents = Math.round(Number(contract.montant_caution) * 100)

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'eur',
              unit_amount: amountCents,
              product_data: {
                name: `Dépôt de garantie — ${contract.logement_adresse}`,
                description: `Caution pour le séjour du ${new Date(contract.date_arrivee).toLocaleDateString('fr-FR')} au ${new Date(contract.date_depart).toLocaleDateString('fr-FR')}. Cette somme est bloquée sur votre carte mais ne sera prélevée qu'en cas de dommages constatés.`,
              },
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          capture_method: 'manual',
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

    await supabase
      .from('contracts')
      .update({
        stripe_deposit_checkout_id: session.id,
        stripe_deposit_status: 'pending',
      })
      .eq('id', contract.id)

    return NextResponse.redirect(session.url!)
  } catch (err) {
    console.error('[stripe/deposit/redirect]', err)
    return NextResponse.redirect(`${APP_URL}/sign/${token}?deposit=error`)
  }
}
