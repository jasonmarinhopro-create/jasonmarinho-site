import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'
import { logger } from '@/lib/logger'
const log = logger('api/stripe/payment/redirect')

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

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

// GET /api/stripe/payment/redirect?token=xxx
// Crée une Stripe Checkout Session et redirige directement vers Stripe
// Utilisé pour les liens dans les emails (pas de JS possible)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(`${APP_URL}/sign/${token}?payment=error`)
  }

  try {
    const supabase = createServiceClient()

    const { data: contract, error: cErr } = await supabase
      .from('contracts')
      .select('*')
      .eq('token', token)
      .single()

    if (cErr || !contract) {
      return NextResponse.redirect(`${APP_URL}/sign/${token}?payment=error`)
    }

    if (contract.statut !== 'signe') {
      return NextResponse.redirect(`${APP_URL}/sign/${token}?payment=error`)
    }

    if (!contract.stripe_payment_enabled) {
      return NextResponse.redirect(`${APP_URL}/sign/${token}?payment=error`)
    }

    if (contract.stripe_payment_status === 'paid') {
      return NextResponse.redirect(`${APP_URL}/sign/${token}?payment=success`)
    }

    if (!contract.montant_loyer || Number(contract.montant_loyer) <= 0) {
      return NextResponse.redirect(`${APP_URL}/sign/${token}?payment=error`)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', contract.user_id)
      .single()

    if (!profile?.stripe_account_id || !profile.stripe_onboarding_complete) {
      return NextResponse.redirect(`${APP_URL}/sign/${token}?payment=error`)
    }

    const amountCents = Math.round(Number(contract.montant_loyer) * 100)
    const n = Math.round(
      (new Date(contract.date_depart).getTime() - new Date(contract.date_arrivee).getTime()) / 86400000
    )

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

    return NextResponse.redirect(session.url!)
  } catch (err) {
    log.error('unexpected', err)
    return NextResponse.redirect(`${APP_URL}/sign/${token}?payment=error`)
  }
}
