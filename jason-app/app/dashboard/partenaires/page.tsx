import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import { ArrowUpRight, Tag, Handshake } from '@phosphor-icons/react/dist/ssr'

export default async function PartenairesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', user!.id).single()

  const { data: partners } = await supabase
    .from('partners').select('*').eq('is_active', true).order('name')

  const categories = [...new Set((partners ?? []).map(p => p.category))]

  return (
    <>
      <Sidebar />
      <Header title="Partenaires" userName={profile?.full_name ?? undefined} />

      <div style={styles.page}>
        <div style={styles.intro} className="fade-up">
          <h2 style={styles.pageTitle}>Partenaires <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>exclusifs</em></h2>
          <p style={styles.pageDesc}>Des offres négociées pour les membres — outils, assurances et services pour les hôtes professionnels.</p>
        </div>

        {categories.map(cat => (
          <div key={cat} style={styles.catSection}>
            <h3 style={styles.catTitle}>{cat}</h3>
            <div style={styles.grid}>
              {(partners ?? []).filter(p => p.category === cat).map((p, i) => (
                <div key={p.id} style={styles.card} className={`glass-card fade-up d${i + 1}`}>
                  {/* Logo placeholder */}
                  <div style={styles.logoWrap}>
                    <div style={styles.logoPlaceholder}>
                      <Handshake size={24} color="#FFD56B" weight="fill" />
                    </div>
                    <div>
                      <div style={styles.partnerName}>{p.name}</div>
                      <div style={styles.partnerCat}>{p.category}</div>
                    </div>
                  </div>

                  <p style={styles.desc}>{p.description}</p>

                  {/* Advantage */}
                  <div style={styles.advantageBox}>
                    <Tag size={14} color="#FFD56B" />
                    <span style={styles.advantageText}>{p.advantage}</span>
                  </div>

                  {/* Promo code */}
                  {p.promo_code && (
                    <div style={styles.promoRow}>
                      <span style={styles.promoLabel}>Code promo</span>
                      <code style={styles.promoCode}>{p.promo_code}</code>
                    </div>
                  )}

                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ fontSize: '13px', padding: '10px 18px', marginTop: '8px', alignSelf: 'flex-start' }}
                  >
                    Accéder à l'offre <ArrowUpRight size={14} weight="bold" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(24px,4vw,40px)', maxWidth: '960px' },
  intro: { marginBottom: '36px' },
  pageTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,36px)', fontWeight: 400, color: '#f0f4ff', marginBottom: '8px' },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'rgba(240,244,255,0.5)', maxWidth: '480px' },
  catSection: { marginBottom: '36px' },
  catTitle: { fontFamily: 'Fraunces, serif', fontSize: '11px', fontWeight: 400, color: 'rgba(240,244,255,0.55)', marginBottom: '16px', letterSpacing: '0.5px', textTransform: 'uppercase' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  card: { padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoPlaceholder: {
    width: '44px', height: '44px', flexShrink: 0,
    background: 'rgba(0,76,63,0.3)', border: '1px solid rgba(255,213,107,0.15)',
    borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  partnerName: { fontSize: '15px', fontWeight: 600, color: '#f0f4ff' },
  partnerCat: { fontSize: '11px', color: 'rgba(240,244,255,0.38)', marginTop: '2px' },
  desc: { fontSize: '13px', fontWeight: 300, color: 'rgba(240,244,255,0.5)', lineHeight: 1.65 },
  advantageBox: {
    display: 'flex', alignItems: 'flex-start', gap: '8px',
    background: 'rgba(255,213,107,0.06)', border: '1px solid rgba(255,213,107,0.14)',
    borderRadius: '10px', padding: '10px 14px',
  },
  advantageText: { fontSize: '13px', color: 'rgba(255,213,107,0.85)', lineHeight: 1.5 },
  promoRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  promoLabel: { fontSize: '12px', color: 'rgba(240,244,255,0.38)' },
  promoCode: {
    fontFamily: 'monospace', fontSize: '13px', fontWeight: 600,
    color: '#FFD56B', background: 'rgba(255,213,107,0.08)',
    border: '1px dashed rgba(255,213,107,0.25)',
    borderRadius: '6px', padding: '3px 9px',
  },
}
