import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import ProfilForm from './ProfilForm'

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const email = session?.user?.email ?? ''
  const userId = session?.user?.id ?? ''

  // Lire le profil depuis Supabase côté serveur (fiable, cookie auth OK)
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle()

  const fullName = profileData?.full_name ?? ''

  return (
    <>
      <Header title="Mon profil" userName={fullName || undefined} />
      <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%' }} className="dash-page">
        <div style={{ marginBottom: '32px' }} className="fade-up">
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: '#f0f4ff', marginBottom: '10px' }}>
            Mon <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>profil</em>
          </h2>
          <p style={{ fontSize: '15px', fontWeight: 300, color: 'rgba(240,244,255,0.5)' }}>
            Gère tes informations personnelles.
          </p>
        </div>
        <ProfilForm initialFullName={fullName} email={email} />
      </div>
    </>
  )
}
