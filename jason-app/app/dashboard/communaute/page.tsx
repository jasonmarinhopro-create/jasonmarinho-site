import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import { ArrowUpRight, UsersThree, FacebookLogo, WhatsappLogo, FileText } from '@phosphor-icons/react/dist/ssr'

export default async function CommunautePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { const { redirect } = await import('next/navigation'); redirect('/auth/login') }
  const userId = session!.user.id

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', userId).single()

  const { data: groups } = await supabase
    .from('community_groups')
    .select('*, template:templates(*)')
    .order('members_count', { ascending: false })

  return (
    <>
      <Sidebar />
      <Header title="Communauté" userName={profile?.full_name ?? undefined} />

      <div style={styles.page}>
        <div style={styles.intro} className="fade-up">
          <h2 style={styles.pageTitle}>La <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>communauté</em> LCD</h2>
          <p style={styles.pageDesc}>Les meilleurs groupes pour échanger avec d'autres hôtes — avec les gabarits de présentation pour bien démarrer.</p>
        </div>

        <div style={styles.grid} className="dash-grid-2">
          {(groups ?? []).map((g, i) => (
            <div key={g.id} style={styles.card} className={`glass-card fade-up d${i + 1}`}>
              {/* Header */}
              <div style={styles.cardHead}>
                <div style={styles.platformIcon}>
                  {g.platform === 'facebook'
                    ? <FacebookLogo size={22} color="#93C5FD" weight="fill" />
                    : <WhatsappLogo size={22} color="#34D399" weight="fill" />}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={styles.groupName}>{g.name}</h3>
                  <div style={styles.memberCount}>
                    <UsersThree size={13} />
                    {g.members_count.toLocaleString('fr-FR')} membres
                  </div>
                </div>
                <a
                  href={g.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost"
                  style={{ fontSize: '12px', padding: '7px 14px', flexShrink: 0 }}
                >
                  Rejoindre <ArrowUpRight size={13} />
                </a>
              </div>

              <p style={styles.desc}>{g.description}</p>

              {/* Template associé */}
              {g.template && (
                <div style={styles.templateBox}>
                  <div style={styles.templateHead}>
                    <FileText size={14} color="#FFD56B" />
                    <span style={styles.templateLabel}>Gabarit de présentation</span>
                  </div>
                  <p style={styles.templateTitle}>{g.template.title}</p>
                  <pre style={styles.templateContent}>{g.template.content}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  intro: { marginBottom: '36px' },
  pageTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: '#f0f4ff', marginBottom: '10px' },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'rgba(240,244,255,0.5)', maxWidth: '520px', lineHeight: 1.6 },
  grid: {}, /* className dash-grid-2 */
  card: { padding: '28px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '16px' },
  cardHead: { display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' },
  platformIcon: {
    width: '44px', height: '44px', borderRadius: '11px', flexShrink: 0,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  groupName: { fontFamily: 'Fraunces, serif', fontSize: '17px', fontWeight: 400, color: '#f0f4ff', marginBottom: '3px' },
  memberCount: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'rgba(240,244,255,0.38)' },
  desc: { fontSize: '14px', fontWeight: 300, color: 'rgba(240,244,255,0.55)', lineHeight: 1.65 },
  templateBox: {
    background: 'rgba(255,213,107,0.04)', border: '1px solid rgba(255,213,107,0.1)',
    borderRadius: '12px', padding: '16px',
  },
  templateHead: { display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' },
  templateLabel: { fontSize: '11px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'rgba(255,213,107,0.6)' },
  templateTitle: { fontSize: '13px', fontWeight: 500, color: 'rgba(240,244,255,0.7)', marginBottom: '10px' },
  templateContent: {
    fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 300,
    color: 'rgba(240,244,255,0.45)', lineHeight: 1.7,
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    maxHeight: '140px', overflowY: 'auto',
  },
}
