import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { getOrCreateDepositCheckout } from '@/lib/stripe/deposit-payment'
import { logger } from '@/lib/logger'
import { depositWindow } from '@/lib/stripe/deposit-window'
const log = logger('api/stripe/deposit/redirect')

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

// Jamais en cache : statut de la caution lu à chaque clic
export const dynamic = 'force-dynamic'

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
    const supabase = getServiceClient()

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

    // Lien ouvert seulement de J-2 au départ (lib/stripe/deposit-window.ts)
    const depositState = depositWindow(contract.date_arrivee, contract.date_depart)
    if (depositState !== 'open') {
      return NextResponse.redirect(`${APP_URL}/sign/${token}?deposit=${depositState === 'not_yet' ? 'early' : 'closed'}#depot-garantie`)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', contract.user_id)
      .single()

    if (!profile?.stripe_account_id || !profile.stripe_onboarding_complete) {
      return NextResponse.redirect(`${APP_URL}/sign/${token}?deposit=error`)
    }

    // Même session que le bouton de la page, après vérification chez Stripe
    // qu'aucune caution n'est déjà bloquée (avant le 05/10/2026 : nouvelle
    // session à chaque clic, double blocage possible)
    const { url, alreadyHeld } = await getOrCreateDepositCheckout(supabase, { ...contract, token }, profile.stripe_account_id)
    if (alreadyHeld || !url) return NextResponse.redirect(`${APP_URL}/sign/${token}?deposit=success`)
    return NextResponse.redirect(url)
  } catch (err) {
    log.error('unexpected', err)
    return NextResponse.redirect(`${APP_URL}/sign/${token}?deposit=error`)
  }
}
