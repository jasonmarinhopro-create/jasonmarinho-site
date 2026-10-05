import { getServiceClient as createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateDepositCheckout, DEPOSIT_CONTRACT_COLUMNS } from '@/lib/stripe/deposit-payment'
import { logger } from '@/lib/logger'
import { depositWindow, depositOpensOn, parisToday } from '@/lib/stripe/deposit-window'
const log = logger('api/stripe/deposit/create')

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

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
      .select(DEPOSIT_CONTRACT_COLUMNS)
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

    // La carte ne reste bloquée que ~7 jours : le lien ne s'ouvre que 2 jours
    // avant l'arrivée (lib/stripe/deposit-window.ts)
    const depositState = depositWindow(contract.date_arrivee, contract.date_depart)
    if (depositState === 'not_yet') {
      const opens = new Date(`${depositOpensOn(contract.date_arrivee)}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
      return NextResponse.json({ error: `La caution pourra être réglée à partir du ${opens}, 2 jours avant l'arrivée.` }, { status: 409 })
    }
    if (depositState === 'closed') {
      return NextResponse.json({ error: 'Le séjour est terminé : la caution ne peut plus être réglée.' }, { status: 409 })
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

    // Vérifie chez Stripe qu'aucune caution n'est déjà bloquée, réutilise la
    // session ouverte, sinon en crée une (lib/stripe/deposit-payment.ts,
    // partagé avec le lien de l'e-mail)
    const { url, alreadyHeld } = await getOrCreateDepositCheckout(supabase, { ...contract, token }, profile.stripe_account_id)
    if (alreadyHeld || !url) {
      return NextResponse.json({ error: 'La caution est déjà enregistrée.' }, { status: 409 })
    }
    return NextResponse.json({ url })
  } catch (err) {
    log.error('unexpected', err)
    return NextResponse.json({ error: 'Erreur lors de la création du paiement.' }, { status: 500 })
  }
}
