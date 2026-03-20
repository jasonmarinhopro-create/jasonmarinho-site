import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import ProfilForm from './ProfilForm'
import { Star, Lightning, Users, GraduationCap, Handshake } from '@phosphor-icons/react/dist/ssr'

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const email = session?.user?.email ?? ''
  const userId = session?.user?.id ?? ''

  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, plan')
    .eq('id', userId)
    .maybeSingle()

  const fullName = profileData?.full_name ?? ''
  const plan = profileData?.plan ?? 'decouverte'

  return (
    <>
      <Header title="Mon profil" userName={fullName || undefined} />
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
          <ProfilForm initialFullName={fullName} email={email} />

          {plan === 'driing' && (
            <div style={cardStyles.card} className="fade-up d2">
              {/* Reflet doré en haut à droite */}
              <div style={cardStyles.glow} />

              <div style={cardStyles.header}>
                <div style={cardStyles.badge}>
                  <Star size={13} weight="fill" />
                  Membre Driing
                </div>
              </div>

              <p style={cardStyles.desc}>
                Tu fais partie des membres Driing — un accès exclusif aux contenus, formations et à la communauté privée.
              </p>

              <div style={cardStyles.perks}>
                {[
                  { Icon: GraduationCap, label: 'Toutes les formations incluses' },
                  { Icon: Users,         label: 'Communauté privée Driing' },
                  { Icon: Lightning,     label: 'Accès prioritaire aux nouveaux contenus' },
                  { Icon: Handshake,     label: 'Offres partenaires exclusives' },
                ].map(({ Icon, label }) => (
                  <div key={label} style={cardStyles.perk}>
                    <Icon size={15} color="#FFD56B" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const cardStyles: Record<string, React.CSSProperties> = {
  card: {
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, rgba(255,213,107,0.08) 0%, rgba(255,213,107,0.03) 100%)',
    border: '1px solid rgba(255,213,107,0.25)',
    borderRadius: '20px',
    padding: 'clamp(24px,3vw,36px)',
    display: 'flex', flexDirection: 'column', gap: '18px',
  },
  glow: {
    position: 'absolute', top: '-60px', right: '-60px',
    width: '200px', height: '200px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,213,107,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase',
    color: 'var(--accent-text)',
    background: 'rgba(255,213,107,0.1)',
    border: '1px solid rgba(255,213,107,0.2)',
    borderRadius: '100px', padding: '5px 12px',
  },
  desc: {
    fontSize: '14px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.7,
  },
  perks: { display: 'flex', flexDirection: 'column', gap: '12px' },
  perk: {
    display: 'flex', alignItems: 'center', gap: '10px',
    fontSize: '13px', fontWeight: 400, color: 'var(--text-2)',
  },
}
