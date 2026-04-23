import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import ProfilForm from './ProfilForm'

export default async function ProfilPage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])
  const userId = profile?.userId ?? ''

  const [{ data: { session } }, { data: profileData }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete, iban, bic, adresse')
      .eq('id', userId)
      .maybeSingle(),
  ])

  const email = session?.user?.email ?? ''
  const fullName = profile?.full_name ?? ''

  const stripeAccountId = profileData?.stripe_account_id ?? null
  const stripeComplete = profileData?.stripe_onboarding_complete ?? false
  const iban = profileData?.iban ?? ''
  const bic = profileData?.bic ?? ''
  const adresse = profileData?.adresse ?? ''

  const planLabel = profile?.role === 'admin' ? 'Administrateur'
    : profile?.plan === 'driing' ? 'Membre Driing'
    : profile?.plan === 'standard' ? 'Standard'
    : 'Découverte'

  return (
    <>
      <Header title="Mon profil" userName={fullName || undefined} currentPlan={planLabel} />
      <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%' }} className="dash-page">
        <div style={{ marginBottom: '32px' }} className="fade-up">
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: 'var(--text)', marginBottom: '10px' }}>
            Mon <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>profil</em>
          </h2>
          <p style={{ fontSize: '15px', fontWeight: 300, color: 'var(--text-2)' }}>
            Gère tes informations personnelles.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
          <ProfilForm
            initialFullName={fullName}
            email={email}
            stripeAccountId={stripeAccountId}
            stripeComplete={stripeComplete}
            initialIban={iban}
            initialBic={bic}
            initialAdresse={adresse}
          />
        </div>
      </div>
    </>
  )
}
