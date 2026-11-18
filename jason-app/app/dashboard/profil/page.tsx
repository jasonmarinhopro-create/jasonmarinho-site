import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth-user'
import { getSubscriptionDetails } from '@/lib/stripe/subscription-info'
import { googleActif } from '@/lib/auth/google'
import ProfilView, { type PlanLabel } from './ProfilView'

// Chargement des données de « Mon compte » ; l'affichage est dans ProfilView.

export default async function ProfilPage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])
  if (!profile) redirect('/auth/login')

  // getAuthUser() : getUser() validé côté serveur, mis en cache pour le rendu
  // (déjà appelé par getProfile), donc sans aller-retour supplémentaire.
  // Une seule lecture de la ligne du profil (18/11/2026 : avant, 3 lectures de
  // la même ligne, cgv et paypal_me à part tant que leurs migrations 181 et 187
  // manquaient ; les deux colonnes existent en base). Google en même temps.
  const [authUser, { data: row }, google] = await Promise.all([
    getAuthUser(),
    supabase.from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete, iban, bic, adresse, pseudo, bio, privacy_show_logements, privacy_show_platforms, privacy_show_city, stripe_subscription_id, stripe_customer_id, entreprise_numero, mention_tva, cgv, paypal_me')
      .eq('id', profile.userId)
      .maybeSingle(),
    googleActif(),
  ])
  const { cgv: cgvRaw, paypal_me: paypalRaw, ...pd } = row ?? {} as NonNullable<typeof row>
  const cgv = cgvRaw ?? ''
  const paypalMe = paypalRaw ?? ''

  // Abonnement Stripe (date de renouvellement, prix, statut) ; null si erreur
  // ou si Stripe ne répond pas en 4 s (la page ne l'attend plus sans limite).
  const subscription = pd.stripe_subscription_id
    ? await Promise.race([
        getSubscriptionDetails(pd.stripe_subscription_id),
        new Promise<null>(resolve => setTimeout(() => resolve(null), 4000)),
      ])
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
      pd={row ? pd : null}
      google={google}
      cgv={cgv}
      paypalMe={paypalMe}
    />
  )
}
