import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth-user'
import { getSubscriptionDetails } from '@/lib/stripe/subscription-info'
import ProfilView, { type PlanLabel } from './ProfilView'

// Chargement des données de « Mon compte » ; l'affichage est dans ProfilView.

export default async function ProfilPage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])
  if (!profile) redirect('/auth/login')

  // getAuthUser() : getUser() validé côté serveur, mis en cache pour le rendu
  // (déjà appelé par getProfile), donc sans aller-retour supplémentaire.
  const [authUser, { data: pd }] = await Promise.all([
    getAuthUser(),
    supabase.from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete, iban, bic, adresse, pseudo, bio, privacy_show_logements, privacy_show_platforms, privacy_show_city, stripe_subscription_id, stripe_customer_id, entreprise_numero, mention_tva')
      .eq('id', profile.userId)
      .maybeSingle(),
  ])

  // Abonnement Stripe (date de renouvellement, prix, statut) ; null si erreur
  const subscription = pd?.stripe_subscription_id
    ? await getSubscriptionDetails(pd.stripe_subscription_id)
    : null

  const planLabel: PlanLabel = profile.role === 'admin' ? 'Administrateur'
    : profile.plan === 'driing'   ? 'Membre Driing'
    : profile.plan === 'standard' ? 'Standard'
    : 'Découverte'

  return (
    <ProfilView
      userId={profile.userId}
      email={authUser?.email ?? ''}
      createdAt={authUser?.created_at ?? ''}
      fullName={profile.full_name ?? ''}
      planLabel={planLabel}
      subscription={subscription}
      autresRevenusPro={profile.autres_revenus_pro ?? null}
      pd={pd}
    />
  )
}
