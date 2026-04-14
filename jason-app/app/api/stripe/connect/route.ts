import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

// POST /api/stripe/connect
// Crée ou récupère le compte Express et renvoie l'URL d'onboarding
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const userId = session.user.id

    // Récupérer le profil (stripe_account_id existant ?)
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', userId)
      .single()

    let accountId = profile?.stripe_account_id

    // Créer un nouveau compte Express si nécessaire
    if (!accountId) {
      const account = await stripe.accounts.create({
        country: 'FR',
        email: session.user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        // MCC 7011 — Hébergement hôtelier (hôtels, motels, résidences)
        // Requis pour que Visa et Amex accordent l'autorisation étendue (30 jours)
        // sur les pré-autorisations de caution, sans frais supplémentaires.
        business_profile: {
          mcc: '7011',
        },
        controller: {
          losses: {
            payments: 'application',
          },
          fees: {
            payer: 'application',
          },
          stripe_dashboard: {
            type: 'express',
          },
          requirement_collection: 'stripe',
        },
      })
      accountId = account.id

      // Sauvegarder en base
      await supabase
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', userId)
    }

    // Créer le lien d'onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/api/stripe/connect/refresh?account_id=${accountId}`,
      return_url:  `${APP_URL}/api/stripe/connect/return?account_id=${accountId}`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[stripe/connect POST]', message, err)
    return NextResponse.json({ error: `Erreur lors de la création du compte Stripe : ${message}` }, { status: 500 })
  }
}

// GET /api/stripe/connect
// Retourne le statut du compte Stripe du bailleur connecté
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', session.user.id)
      .single()

    if (!profile?.stripe_account_id) {
      return NextResponse.json({ connected: false })
    }

    // Vérifier le statut réel du compte chez Stripe
    const account = await stripe.accounts.retrieve(profile.stripe_account_id)
    const isComplete = account.details_submitted && !account.requirements?.currently_due?.length

    // Mettre à jour en base si le statut a changé
    if (isComplete !== profile.stripe_onboarding_complete) {
      await supabase
        .from('profiles')
        .update({ stripe_onboarding_complete: isComplete })
        .eq('id', session.user.id)
    }

    return NextResponse.json({
      connected: true,
      complete: isComplete,
      account_id: profile.stripe_account_id,
      payouts_enabled: account.payouts_enabled,
      charges_enabled: account.charges_enabled,
    })
  } catch (err) {
    console.error('[stripe/connect GET]', err)
    return NextResponse.json({ error: 'Erreur Stripe.' }, { status: 500 })
  }
}
