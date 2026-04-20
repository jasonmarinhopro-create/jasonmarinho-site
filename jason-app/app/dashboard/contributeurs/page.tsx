import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import MurDesBatisseurs, { type ContributorTile } from '@/components/MurDesBatisseurs'
import CoulissesJason, { type CoulissesPost } from '@/components/CoulissesJason'
import Roadmap from '@/components/Roadmap'
import { Heart, ArrowRight, Star, ChatCircle, Rocket, Medal } from '@phosphor-icons/react/dist/ssr'

export const metadata = { title: 'Contributeurs — Jason Marinho' }

export default async function ContributeursPage() {
  const profile = await getProfile()
  const isContributor = profile?.is_contributor ?? false
  const isAdmin       = profile?.role === 'admin'

  /* ── Non-contributeur : teasing ── */
  if (!isContributor) {
    return (
      <>
        <Header title="Contributeurs" userName={profile?.full_name ?? undefined} />
        <div style={s.page}>
          <div style={s.teasing}>
            <div style={s.teasingGlow} />

            <div style={s.teasingBadge}>
              <Heart size={14} color="#FFD56B" weight="fill" />
              Espace Contributeurs
            </div>

            <h2 style={s.teasingTitle}>
              Un espace pour ceux qui souhaitent<br />
              <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>soutenir et proposer des idées.</em>
            </h2>

            <p style={s.teasingDesc}>
              Contribue librement, et accède à un espace communautaire exclusif pour
              proposer des fonctionnalités, voter sur la roadmap et construire la plateforme avec moi.
            </p>

            <div style={s.perksGrid}>
              {[
                { icon: Medal,      color: '#FFD56B', label: 'Badge Contributeur permanent sur ton profil' },
                { icon: Star,       color: '#a78bfa', label: 'Tes idées rejoignent la roadmap officielle' },
                { icon: ChatCircle, color: '#34d399', label: 'Accès aux coulisses exclusives de la plateforme' },
                { icon: Rocket,     color: '#60a5fa', label: 'Accès anticipé à chaque nouveauté' },
              ].map(({ icon: Icon, color, label }) => (
                <div key={label} style={{ ...s.perk, borderColor: `${color}22` }}>
                  <Icon size={16} color={color} weight="duotone" />
                  <span style={s.perkLabel}>{label}</span>
                </div>
              ))}
            </div>

            <a href="/soutenir" style={s.cta}>
              Rejoindre les bâtisseurs
              <ArrowRight size={15} weight="bold" />
            </a>

            <p style={s.teasingNote}>
              Contribution libre — même 1 € suffit · Accès activé sous 24h
            </p>
          </div>
        </div>
      </>
    )
  }

  /* ── Contributeur : espace complet ── */
  const supabase = await createClient()

  const [contributorsRes, coulissesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, created_at')
      .eq('is_contributor', true)
      .order('created_at', { ascending: true }),
    supabase
      .from('coulisses_posts')
      .select('id, content, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const contributors: ContributorTile[] = (contributorsRes.data ?? []).map(c => ({
    userId:     c.id,
    full_name:  c.full_name,
    created_at: c.created_at,
  }))

  const coulissesPosts: CoulissesPost[] = (coulissesRes.data ?? []).map(p => ({
    id:         p.id,
    content:    p.content,
    created_at: p.created_at,
  }))

  const firstName = profile?.full_name?.split(/\s+/)[0] ?? 'ami(e)'

  return (
    <>
      <Header title="Contributeurs" userName={profile?.full_name ?? undefined} />
      <div style={s.page}>

        {/* ── Intro ── */}
        <div style={s.intro} className="fade-up">
          <div style={s.introBadge}>
            <Heart size={13} color="#FFD56B" weight="fill" />
            Le Cercle · Espace exclusif
          </div>
          <h1 style={s.introTitle}>
            Bienvenue,{' '}
            <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>{firstName}</em>
          </h1>
          <p style={s.introDesc}>
            Tu fais partie des personnes qui construisent la plateforme avec moi.
            Propose tes idées, découvre les coulisses, vote sur ce qu&apos;on construit ensemble.
          </p>
        </div>

        {/* ── Mur des Bâtisseurs ── */}
        <section style={s.section} className="fade-up">
          <MurDesBatisseurs contributors={contributors} />
        </section>

        {/* ── Les Coulisses ── */}
        <section style={s.section} className="fade-up">
          <CoulissesJason initialPosts={coulissesPosts} isAdmin={isAdmin} />
        </section>

        {/* ── Roadmap ── */}
        <section style={{ ...s.section, ...s.roadmapSection }} className="fade-up">
          <Roadmap />
        </section>

      </div>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: 'clamp(20px,3vw,44px)',
    width: '100%',
    maxWidth: '960px',
  },

  /* ── Teasing ── */
  teasing: {
    position: 'relative', overflow: 'hidden',
    maxWidth: '560px', margin: '40px auto 0',
    background: 'linear-gradient(135deg, rgba(255,213,107,0.07) 0%, rgba(255,213,107,0.02) 100%)',
    border: '1px solid rgba(255,213,107,0.18)',
    borderRadius: '24px', padding: 'clamp(32px,5vw,56px)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '20px', textAlign: 'center',
  },
  teasingGlow: {
    position: 'absolute', top: '-80px', right: '-80px',
    width: '280px', height: '280px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,213,107,0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  teasingBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase',
    color: '#FFD56B',
    background: 'rgba(255,213,107,0.1)',
    border: '1px solid rgba(255,213,107,0.2)',
    borderRadius: '999px', padding: '5px 14px',
  },
  teasingTitle: {
    fontFamily: 'Fraunces, serif', fontSize: 'clamp(20px,3vw,28px)',
    fontWeight: 400, lineHeight: 1.35, color: 'var(--text)', margin: 0,
  },
  teasingDesc: {
    fontSize: '14px', lineHeight: 1.7,
    color: 'var(--text-2)', margin: 0, maxWidth: '440px',
  },
  perksGrid:  { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', textAlign: 'left' },
  perk: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '11px 14px',
    background: 'var(--surface)', border: '1px solid',
    borderRadius: '12px',
  },
  perkLabel: { fontSize: '13px', color: 'var(--text-2)', fontWeight: 400 },
  cta: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    background: 'linear-gradient(135deg, #FFD56B 0%, #f59e0b 100%)',
    color: '#1a1a0e', fontWeight: 700, fontSize: '14px',
    padding: '13px 26px', borderRadius: '12px',
    textDecoration: 'none', boxShadow: '0 8px 24px rgba(255,213,107,0.2)',
    marginTop: '4px',
  },
  teasingNote: { fontSize: '12px', color: 'var(--text-muted)', margin: 0 },

  /* ── Contributor view ── */
  intro:       { marginBottom: '10px' },
  introBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase',
    color: '#FFD56B', background: 'rgba(255,213,107,0.08)',
    border: '1px solid rgba(255,213,107,0.15)',
    borderRadius: '999px', padding: '4px 12px', marginBottom: '14px',
  },
  introTitle: {
    fontFamily: 'Fraunces, serif', fontSize: 'clamp(24px,3vw,34px)',
    fontWeight: 400, color: 'var(--text)', marginBottom: '10px', marginTop: 0,
  },
  introDesc: {
    fontSize: '14px', lineHeight: 1.7,
    color: 'var(--text-2)', maxWidth: '520px', margin: 0,
  },

  section: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    padding: 'clamp(20px,3vw,28px)',
    marginTop: '16px',
  },
  roadmapSection: {
    marginTop: '16px',
  },
}
