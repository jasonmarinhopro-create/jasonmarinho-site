import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import ProfilForm from './ProfilForm'
import ChezNousIdentity from './ChezNousIdentity'

export default async function ProfilPage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])
  const userId = profile?.userId ?? ''

  const [{ data: { session } }, { data: profileData }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete, iban, bic, adresse, pseudo, bio, privacy_show_logements, privacy_show_platforms, privacy_show_city')
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

  const pseudo                = profileData?.pseudo ?? ''
  const bio                   = profileData?.bio ?? ''
  const privacyShowLogements  = profileData?.privacy_show_logements ?? true
  const privacyShowPlatforms  = profileData?.privacy_show_platforms ?? true
  const privacyShowCity       = profileData?.privacy_show_city ?? true

  const planLabel = profile?.role === 'admin' ? 'Administrateur'
    : profile?.plan === 'driing' ? 'Membre Driing'
    : profile?.plan === 'standard' ? 'Standard'
    : 'Découverte'

  return (
    <>
      <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%' }} className="dash-page">
        <div style={{ marginBottom: '32px' }} className="fade-up">
          <h2 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: 'var(--text)', marginBottom: '10px' }}>
            Mon <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>profil</em>
          </h2>
          <p style={{ fontSize: '15px', fontWeight: 300, color: 'var(--text-2)' }}>
            Gère tes informations personnelles.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 480px', minWidth: 0, maxWidth: '720px' }}>
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
          <div style={{ flex: '1 1 380px', minWidth: 0, maxWidth: '520px', position: 'sticky', top: '84px', alignSelf: 'flex-start' }}>
            <ChezNousIdentity
              initialPseudo={pseudo}
              initialBio={bio}
              firstName={fullName.split(/\s+/)[0] ?? ''}
              initialPrivacy={{
                show_logements: privacyShowLogements,
                show_platforms: privacyShowPlatforms,
                show_city:      privacyShowCity,
              }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
