import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { createLoyerCheckout, syncLoyerPayment, LOYER_CONTRACT_COLUMNS } from '@/lib/stripe/loyer-payment'
import { logger } from '@/lib/logger'
const log = logger('api/stripe/payment/redirect')

// Jamais en cache : statut de paiement lu à chaque clic
export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

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
    const supabase = getServiceClient()

    const { data: contract, error: cErr } = await supabase
      .from('contracts')
      .select(LOYER_CONTRACT_COLUMNS)
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

    // Déjà payé chez Stripe (webhook en retard) : retour au contrat
    const sync = await syncLoyerPayment(supabase, { ...contract, token }, profile.stripe_account_id)
    if (sync.paid) return NextResponse.redirect(`${APP_URL}/sign/${token}?payment=success`)

    // Même session que le bouton de la page : la part d'acompte seulement.
    // Avant le 04/10/2026, ce lien (e-mail de signature) encaissait 100 %
    // du loyer même quand le contrat prévoyait un acompte de 50 %.
    const session = await createLoyerCheckout({ ...contract, token }, profile.stripe_account_id)

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
