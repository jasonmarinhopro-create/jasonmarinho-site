'use server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'
import { STRIPE_PLANS, ALL_VALID_PRICE_IDS } from '@/lib/constants/stripe-plans'
import { invalidateProfileCache } from '@/lib/queries/profile'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}


// POST /api/stripe/subscribe/create
// Body: { priceId: string }
// Crée ou récupère le customer Stripe, puis crée une Checkout Session en mode subscription
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { priceId } = body as { priceId?: string }

  if (!priceId || !ALL_VALID_PRICE_IDS.has(priceId)) {
    return NextResponse.json({ error: 'Plan invalide.' }, { status: 400 })
  }

  const db = adminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('full_name, stripe_customer_id, stripe_subscription_id, stripe_subscription_status')
    .eq('id', session.user.id)
    .single()

  // Bloque si déjà abonné et actif
  if (
    profile?.stripe_subscription_id &&
    profile?.stripe_subscription_status === 'active'
  ) {
    return NextResponse.json({ error: 'Abonnement déjà actif.' }, { status: 400 })
  }

  // Crée ou récupère le customer Stripe
  let customerId = profile?.stripe_customer_id ?? null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      name: profile?.full_name ?? undefined,
      metadata: { user_id: session.user.id },
    })
    customerId = customer.id
    await db.from('profiles').update({ stripe_customer_id: customerId }).eq('id', session.user.id)
    invalidateProfileCache(session.user.id)
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/dashboard/abonnement?subscription=success`,
    cancel_url:  `${APP_URL}/dashboard/abonnement?subscription=cancel`,
    metadata: { user_id: session.user.id, price_id: priceId },
    subscription_data: { metadata: { user_id: session.user.id } },
    allow_promotion_codes: false,
    billing_address_collection: 'auto',
    locale: 'fr',
  })

  return NextResponse.json({ url: checkoutSession.url })
}
