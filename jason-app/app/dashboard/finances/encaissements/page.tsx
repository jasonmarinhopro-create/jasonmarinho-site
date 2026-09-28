import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/queries/profile'
import { getActiveProperty, ALL_PROPERTIES } from '@/lib/queries/active-property'
import { getEncaissementsSummary } from '@/lib/stripe/connect-queries'
import { deriveImpayes } from '@/lib/stripe/impayes'
import { inScope } from '@/lib/finances/engine'
import EncaissementsView from '@/app/dashboard/encaissements/EncaissementsView'
import OnboardingTour, { ENCAISSEMENTS_STEPS } from '@/app/dashboard/OnboardingTour'

export const metadata = { title: 'Paiements en ligne, Mes finances' }
// Cache court : évite de solliciter l'API Stripe à chaque rechargement
export const revalidate = 30

export default async function PaiementsEnLignePage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  const supabase = await createClient()

  const [active, { data: profRow }, { data: contracts }] = await Promise.all([
    getActiveProperty(),
    supabase.from('profiles').select('stripe_account_id').eq('id', profile.userId).maybeSingle(),
    supabase
      .from('contracts')
      .select('id, locataire_prenom, locataire_nom, locataire_email, logement_nom, logement_id, montant_loyer, acompte_percent, date_arrivee, date_depart, statut, stripe_payment_status, stripe_payment_enabled')
      .eq('user_id', profile.userId)
      .neq('statut', 'annule')
      .order('date_arrivee', { ascending: false })
      .limit(200),
  ])

  // Logement choisi : les paiements à relancer sont filtrés, le solde Stripe
  // reste celui du compte (Stripe ne le répartit pas par logement)
  const choices = active.allProperties
  const activeId = active.propertyId === ALL_PROPERTIES && choices.length === 1 ? choices[0].id : active.propertyId
  const chosen = activeId === ALL_PROPERTIES ? null : choices.find(c => c.id === activeId) ?? null
  const scope = chosen ? { logement: { id: chosen.id.startsWith('virtual:') ? null : chosen.id, nom: chosen.nom } } : { logement: null }
  const mine = (contracts ?? []).filter(c => inScope({ logementId: c.logement_id ?? null, logementNom: c.logement_nom ?? '' }, scope))

  const summary = await getEncaissementsSummary(profRow?.stripe_account_id ?? null)

  return (
    <>
      <OnboardingTour
        userId={profile.userId}
        steps={ENCAISSEMENTS_STEPS}
        storageScope="encaissements"
        initiallyDone={profile.onboarding_completed_steps.includes('tour:encaissements')}
      />
      <EncaissementsView
        summary={summary}
        impayes={deriveImpayes(mine)}
        planLabel={profile.plan}
        scopeNote={chosen && choices.length > 1 ? `Paiements à relancer de ${chosen.nom} ; le solde et les virements sont ceux de ton compte Stripe, tous logements confondus.` : undefined}
      />
    </>
  )
}
