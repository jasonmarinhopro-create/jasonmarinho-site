/**
 * POST /api/stripe/subscribe/switch-interval
 * Bascule un abonnement mensuel vers son équivalent annuel (ou inverse),
 * en gardant les conditions tarifaires (fondateur reste fondateur).
 *
 * - Met à jour l'item de l'abonnement existant
 * - proration_behavior='create_prorations' : la prorata est créditée
 *   sur la facture suivante (l'utilisateur n'est pas re-prélevé tout de suite)
 * - Pas de changement de plan possible ici (uniquement intervalle)
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'
import { counterpartPriceId } from '@/lib/stripe/subscription-info'

export async function POST() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const db = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const { data: profile } = await db
    .from('profiles')
    .select('stripe_subscription_id, stripe_price_id, stripe_subscription_status')
    .eq('id', session.user.id)
    .single()

  if (!profile?.stripe_subscription_id || !profile?.stripe_price_id) {
    return NextResponse.json({ error: 'Aucun abonnement actif.' }, { status: 404 })
  }
  if (profile.stripe_subscription_status !== 'active' && profile.stripe_subscription_status !== 'trialing') {
    return NextResponse.json({ error: 'Abonnement non actif.' }, { status: 400 })
  }

  const newPriceId = counterpartPriceId(profile.stripe_price_id)
  if (!newPriceId) {
    return NextResponse.json({ error: 'Aucun tarif équivalent trouvé.' }, { status: 400 })
  }

  try {
    const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
    const itemId = sub.items.data[0]?.id
    if (!itemId) return NextResponse.json({ error: 'Item introuvable.' }, { status: 400 })

    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      items: [{ id: itemId, price: newPriceId }],
      proration_behavior: 'create_prorations',
    })

    // Le webhook customer.subscription.updated met à jour profiles.stripe_price_id.
    // On force aussi un update direct pour répondre vite à l'UI (le webhook
    // peut arriver avec quelques secondes de délai).
    await db
      .from('profiles')
      .update({ stripe_price_id: newPriceId })
      .eq('id', session.user.id)

    return NextResponse.json({ success: true, newPriceId })
  } catch (e) {
    console.error('[switch-interval]', e)
    return NextResponse.json({ error: 'Erreur Stripe.' }, { status: 500 })
  }
}
