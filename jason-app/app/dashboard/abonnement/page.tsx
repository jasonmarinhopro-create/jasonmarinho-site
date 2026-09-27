export const dynamic = 'force-dynamic'

import { getServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth-user'
import { redirect } from 'next/navigation'
import AbonnementView from './AbonnementView'
import { STRIPE_PLANS } from '@/lib/constants/stripe-plans'
import { FOUNDER_TOTAL_SEATS } from '@/lib/constants/founder'
import { getSubscriptionDetails, listRecentInvoices } from '@/lib/stripe/subscription-info'

const ADMIN_EMAIL = 'djason.marinho@gmail.com'

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: Promise<{ subscription?: string }>
}) {
  const supabase = await createClient()

  // getAuthUser() valide le token auprès de Supabase Auth (jamais de données
  // stales) tout en étant dédupliqué avec l'appel déjà fait par le layout
  // dashboard, au lieu de repayer un aller-retour réseau supplémentaire.
  const user = await getAuthUser()
  if (!user) redirect('/auth/login')

  // Requête directe, sans passer par React.cache() ni getProfile()
  // Garantit une lecture fraîche à chaque chargement de cette page
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, plan, driing_status, stripe_subscription_id, stripe_subscription_status, stripe_customer_id')
    .eq('id', user.id)
    .single()

  const userEmail = user.email ?? ''
  const isAdmin   = user.email === ADMIN_EMAIL

  const plan        = profileData?.plan        ?? 'decouverte'
  const driingStatus = profileData?.driing_status ?? 'none'

  // Driing si le plan DB est 'driing' OU si driing_status est 'confirmed' (double sécurité)
  const isDriing    = !isAdmin && (plan === 'driing' || driingStatus === 'confirmed')
  const isStandard  = !isAdmin && !isDriing && plan === 'standard'
  const isDecouverte = !isAdmin && !isDriing && !isStandard

  const params = await searchParams
  const subscriptionResult = params.subscription


  // ── Compteur places fondateur (server-side, lecture directe Supabase) ──
  // Same source de vérité que /api/founder-seats : on évite un round-trip HTTP.
  let founderRemaining = FOUNDER_TOTAL_SEATS
  try {
    const adminDb = getServiceClient()
    const foundingPriceIds = [
      STRIPE_PLANS.STANDARD_FOUNDING_MONTHLY,
      STRIPE_PLANS.STANDARD_FOUNDING_YEARLY,
    ].filter(Boolean) as string[]
    const { count } = await adminDb
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .in('stripe_price_id', foundingPriceIds)
      .in('stripe_subscription_status', ['active', 'trialing'])
    founderRemaining = Math.max(0, FOUNDER_TOTAL_SEATS - (count ?? 0))
  } catch {
    // Fallback safe : on garde 50/50 plutôt que de bloquer le rendu
  }

  // ── Détails abonnement Stripe (date renouvellement, factures) ──────────
  // Uniquement pour les vrais abonnés Stripe (Standard et Driing payant).
  // L'admin n'a pas d'abonnement, le Découverte non plus.
  const hasStripeSub = !!profileData?.stripe_subscription_id && !!profileData?.stripe_customer_id && !isAdmin
  const [subDetails, invoices] = hasStripeSub
    ? await Promise.all([
        getSubscriptionDetails(profileData!.stripe_subscription_id),
        listRecentInvoices(profileData!.stripe_customer_id),
      ])
    : [null, [] as Awaited<ReturnType<typeof listRecentInvoices>>]

  return (
    <AbonnementView
      isAdmin={isAdmin}
      isDriing={isDriing}
      isStandard={isStandard}
      isDecouverte={isDecouverte}
      subscriptionResult={subscriptionResult}
      founderRemaining={founderRemaining}
      userEmail={userEmail}
      driingStatus={driingStatus as 'none' | 'pending' | 'confirmed'}
      subDetails={subDetails}
      invoices={invoices}
    />
  )
}
