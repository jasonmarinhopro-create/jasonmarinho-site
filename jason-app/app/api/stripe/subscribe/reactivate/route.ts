/**
 * POST /api/stripe/subscribe/reactivate
 * Annule la résiliation programmée d'un abonnement (cancel_at_period_end=true).
 * Si l'utilisateur a cliqué "Résilier" mais que la fin de période n'est pas
 * encore arrivée, ça permet de revenir en arrière en 1 clic.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'

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
    .select('stripe_subscription_id')
    .eq('id', session.user.id)
    .single()

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ error: 'Aucun abonnement actif.' }, { status: 404 })
  }

  try {
    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: false,
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[reactivate]', e)
    return NextResponse.json({ error: 'Erreur Stripe.' }, { status: 500 })
  }
}
