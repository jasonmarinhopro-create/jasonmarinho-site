import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import { Heart, ArrowRight, Sparkle, Medal, ChatCircle, Rocket } from '@phosphor-icons/react/dist/ssr'
import SuggestionsBoard from '@/app/soutenir/SuggestionsBoard'

export const metadata = { title: 'Contributeurs — Jason Marinho' }

export default async function ContributeursPage() {
  const profile = await getProfile()
  const isContributor = profile?.is_contributor ?? false

  if (!isContributor) {
    return (
      <>
        <Header title="Contributeurs" userName={profile?.full_name ?? undefined} />
        <div style={s.page}>
          <div style={s.teasing}>

            <div style={s.teasingGlow} />

            <div style={s.teasingBadge}>
              <Heart size={14} color="#f472b6" weight="fill" />
              Espace Contributeurs
            </div>

            <h2 style={s.teasingTitle}>Un espace réservé à ceux<br />qui font avancer la plateforme.</h2>

            <p style={s.teasingDesc}>
              Les contributeurs ont accès à un espace communautaire exclusif : proposer des idées,
              voter sur les fonctionnalités à développer en priorité, et orienter directement la roadmap.
            </p>

            <div style={s.perksGrid}>
              {[
                { icon: Medal,      color: '#FFD56B', label: 'Badge Contributeur permanent sur ton profil' },
                { icon: Sparkle,    color: '#a78bfa', label: 'Tes idées passent en priorité sur la roadmap' },
                { icon: ChatCircle, color: '#34d399', label: 'Accès direct à Jason pour tes questions' },
                { icon: Rocket,     color: '#60a5fa', label: 'Accès anticipé à chaque nouveauté' },
              ].map(({ icon: Icon, color, label }) => (
                <div key={label} style={{ ...s.perk, borderColor: `${color}22` }}>
                  <Icon size={16} color={color} weight="duotone" />
                  <span style={s.perkLabel}>{label}</span>
                </div>
              ))}
            </div>

            <a href="/soutenir" style={s.cta}>
              Devenir contributeur
              <ArrowRight size={15} weight="bold" />
            </a>

            <p style={s.teasingNote}>
              Contribution libre — même 1 € suffit. Ton accès est activé par Jason sous 24h.
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Contributeurs" userName={profile?.full_name ?? undefined} />
      <div style={s.page}>

        <div style={s.intro} className="fade-up">
          <div style={s.introBadge}>
            <Heart size={13} color="#f472b6" weight="fill" />
            Espace exclusif
          </div>
          <h2 style={s.introTitle}>
            Merci d&apos;être là,{' '}
            <em style={{ color: '#f472b6', fontStyle: 'italic' }}>
              {profile?.full_name?.split(' ')[0] ?? 'contributeur'}
            </em>
          </h2>
          <p style={s.introDesc}>
            Tu fais partie des personnes qui orientent la plateforme. Vote sur les idées qui te tiennent à cœur,
            propose les fonctionnalités qui te manquent.
          </p>
        </div>

        <div style={s.boardWrap} className="fade-up">
          <SuggestionsBoard />
        </div>

      </div>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: 'clamp(20px,3vw,44px)',
    width: '100%',
    maxWidth: '860px',
  },

  /* ── Teasing (non-contributeur) ── */
  teasing: {
    position: 'relative',
    overflow: 'hidden',
    maxWidth: '580px',
    margin: '40px auto 0',
    background: 'linear-gradient(135deg, rgba(244,114,182,0.06) 0%, rgba(244,114,182,0.02) 100%)',
    border: '1px solid rgba(244,114,182,0.18)',
    borderRadius: '24px',
    padding: 'clamp(32px,5vw,56px)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '20px', textAlign: 'center',
  },
  teasingGlow: {
    position: 'absolute', top: '-80px', right: '-80px',
    width: '280px', height: '280px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(244,114,182,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  teasingBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase',
    color: '#f472b6',
    background: 'rgba(244,114,182,0.1)',
    border: '1px solid rgba(244,114,182,0.2)',
    borderRadius: '999px', padding: '5px 14px',
  },
  teasingTitle: {
    fontFamily: 'Fraunces, serif',
    fontSize: 'clamp(22px,3vw,30px)',
    fontWeight: 400, lineHeight: 1.25,
    color: 'var(--text)', margin: 0,
  },
  teasingDesc: {
    fontSize: '14px', lineHeight: 1.7,
    color: 'var(--text-2)', margin: 0,
    maxWidth: '440px',
  },
  perksGrid: {
    display: 'flex', flexDirection: 'column', gap: '10px',
    width: '100%', textAlign: 'left',
  },
  perk: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 16px',
    background: 'var(--surface)',
    border: '1px solid',
    borderRadius: '12px',
  },
  perkLabel: { fontSize: '13px', color: 'var(--text-2)', fontWeight: 400 },
  cta: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    background: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
    color: '#fff',
    fontWeight: 700, fontSize: '14px',
    padding: '14px 28px', borderRadius: '12px',
    textDecoration: 'none',
    boxShadow: '0 8px 24px rgba(244,114,182,0.25)',
    marginTop: '4px',
  },
  teasingNote: {
    fontSize: '12px', color: 'var(--text-muted)', margin: 0,
  },

  /* ── Contributeur connecté ── */
  intro: { marginBottom: '32px' },
  introBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase',
    color: '#f472b6',
    background: 'rgba(244,114,182,0.08)',
    border: '1px solid rgba(244,114,182,0.15)',
    borderRadius: '999px', padding: '4px 12px',
    marginBottom: '14px',
  },
  introTitle: {
    fontFamily: 'Fraunces, serif',
    fontSize: 'clamp(26px,3vw,36px)',
    fontWeight: 400, color: 'var(--text)',
    marginBottom: '10px',
  },
  introDesc: {
    fontSize: '14px', lineHeight: 1.7,
    color: 'var(--text-2)', maxWidth: '520px',
  },
  boardWrap: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    padding: 'clamp(20px,3vw,32px)',
  },
}
