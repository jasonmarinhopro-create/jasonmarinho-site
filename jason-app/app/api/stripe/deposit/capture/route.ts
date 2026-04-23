import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'
import { logger } from '@/lib/logger'
const log = logger('api/stripe/deposit/capture')

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// POST /api/stripe/deposit/capture
// Body: { contract_id }
// Le bailleur encaisse la caution (en cas de dommages)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { contract_id } = await request.json()
    if (!contract_id) return NextResponse.json({ error: 'contract_id manquant.' }, { status: 400 })

    const db = serviceClient()

    // Récupérer le contrat (vérifie ownership via user_id)
    const { data: contract } = await db
      .from('contracts')
      .select('*')
      .eq('id', contract_id)
      .eq('user_id', session.user.id)
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
      .eq('id', session.user.id)
      .single()

    if (!profile?.stripe_account_id) {
      return NextResponse.json({ error: 'Compte Stripe non trouvé.' }, { status: 400 })
    }

    // Capturer le PaymentIntent (débit réel)
    await stripe.paymentIntents.capture(
      contract.stripe_deposit_payment_intent_id,
      {},
      { stripeAccount: profile.stripe_account_id }
    )

    // Mettre à jour le statut
    await db
      .from('contracts')
      .update({ stripe_deposit_status: 'captured' })
      .eq('id', contract_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('unexpected', err)
    return NextResponse.json({ error: 'Erreur lors de l\'encaissement.' }, { status: 500 })
  }
}
