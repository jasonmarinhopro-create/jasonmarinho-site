import { getServiceClient as createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { createLoyerCheckout, syncLoyerPayment } from '@/lib/stripe/loyer-payment'
import { logger } from '@/lib/logger'
const log = logger('api/stripe/payment/create')

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

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

    // Déjà payé chez Stripe (webhook en retard) : pas de nouvelle session,
    // sinon le voyageur paie deux fois (incident du 04/10/2026)
    const sync = await syncLoyerPayment(supabase, { ...contract, token }, profile.stripe_account_id)
    if (sync.paid) {
      return NextResponse.json({ error: 'La réservation a déjà été réglée.' }, { status: 409 })
    }

    // acompte_percent < 100 : seule une part du loyer est encaissée en ligne
    // (lib/stripe/loyer-payment.ts, partagé avec le lien de l'e-mail)
    const session = await createLoyerCheckout({ ...contract, token }, profile.stripe_account_id)

    await supabase
      .from('contracts')
      .update({
        stripe_payment_checkout_id: session.id,
        stripe_payment_status: 'pending',
      })
      .eq('id', contract.id)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    log.error('unexpected', err)
    return NextResponse.json({ error: 'Erreur lors de la création du paiement.' }, { status: 500 })
  }
}
