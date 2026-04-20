import { Metadata } from 'next'
import { Medal, ChatCircle, Sparkle, Rocket } from '@phosphor-icons/react/dist/ssr'
import TipForm from './TipForm'
import BackButton from './BackButton'

export const metadata: Metadata = {
  title: 'Contribuer — jasonmarinho.com',
  description: 'Soutiens le développement de la plateforme, propose des fonctionnalités et obtiens un badge Contributeur.',
}

const PERKS = [
  {
    icon: Medal,
    label: 'Badge Contributeur permanent',
    desc: 'Affiché sur ton profil et visible dans toute la communauté.',
    color: '#FFD56B',
    glow: 'rgba(255,213,107,0.15)',
    border: 'rgba(255,213,107,0.2)',
  },
  {
    icon: ChatCircle,
    label: 'Accès direct à Jason',
    desc: 'Un canal privé pour tes questions, retours et coulisses de la plateforme.',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.12)',
    border: 'rgba(52,211,153,0.2)',
  },
  {
    icon: Sparkle,
    label: 'Tes idées en priorité',
    desc: 'Tes demandes de fonctionnalités passent avant tout le monde. Tu orientes la roadmap.',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.2)',
  },
  {
    icon: Rocket,
    label: 'Accès anticipé aux nouveautés',
    desc: 'Tu testes chaque nouvelle fonctionnalité en avant-première.',
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.12)',
    border: 'rgba(96,165,250,0.2)',
  },
]

export default async function SoutenirPage({
  searchParams,
}: {
  searchParams: Promise<{ merci?: string }>
}) {
  const params = await searchParams
  const merci = params.merci === '1'

  return (
    <div style={s.root}>

      {/* Back button */}
      <div style={s.topBar}>
        <BackButton />
      </div>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroBadge}>Contributeur</div>
        <h1 style={s.heroTitle}>On construit ça ensemble</h1>
        <p style={s.heroSub}>
          En contribuant librement, tu rejoins ceux qui co-construisent la plateforme.
          Propose des fonctionnalités, influence les priorités et reçois un badge Contributeur sur ton profil.
        </p>
      </section>

      {/* Success state */}
      {merci && (
        <section style={s.merciWrap}>
          <div style={s.merciCard}>
            <span style={s.merciEmoji}>🙌</span>
            <h2 style={s.merciTitle}>Merci, vraiment.</h2>
            <p style={s.merciText}>
              Ta contribution est reçue. Ton badge Contributeur sera ajouté à ton profil
              sous 24h et tu recevras un accès au canal privé.
            </p>
            <BackButton label="Retour à l'accueil" style={s.merciBtn} />
          </div>
        </section>
      )}

      {!merci && (
        <>
          {/* PERKS — 2x2 visual grid */}
          <section style={s.perksSection}>
            <p style={s.perksLabel}>Ce que tu obtiens</p>
            <div style={s.perksGrid} className="soutenir-perks-grid">
              {PERKS.map(({ icon: Icon, label, desc, color, glow, border }) => (
                <div
                  key={label}
                  style={{ ...s.perkCard, background: glow, borderColor: border }}
                >
                  <div style={{ ...s.perkIcon, color, borderColor: border, boxShadow: `0 0 20px ${glow}` }}>
                    <Icon size={22} weight="duotone" />
                  </div>
                  <div style={{ ...s.perkLabel, color }}>{label}</div>
                  <div style={s.perkDesc}>{desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Form — centered, prominent */}
          <section style={s.formSection}>
            <div style={s.formCard}>
              <h2 style={s.formTitle}>Choisis ton montant</h2>
              <p style={s.formSub}>Aucune obligation. Même 1 € fait la différence.</p>
              <TipForm />
            </div>
          </section>

          {/* Appel à rejoindre l'espace contributeurs */}
          <section style={s.ideasSection}>
            <div style={s.ideasInner}>
              <div style={s.ideasHead}>
                <h2 style={s.ideasTitle}>Un espace rien que pour toi</h2>
                <p style={s.ideasSub}>
                  Après ta contribution, Jason active ton accès à l&apos;espace Contributeurs dans ton dashboard —
                  un endroit pour voter et proposer les fonctionnalités qui te tiennent à cœur.
                </p>
              </div>
            </div>
          </section>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .soutenir-perks-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        @media (max-width: 600px) {
          .soutenir-perks-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #001a13 0%, #002820 50%, #001a13 100%)',
    color: '#fff',
    fontFamily: 'Inter, system-ui, sans-serif',
    paddingBottom: '80px',
  },

  topBar: {
    padding: '24px 32px 0',
    maxWidth: '800px',
    margin: '0 auto',
  },

  hero: {
    maxWidth: '640px',
    margin: '0 auto',
    padding: '48px 24px 40px',
    textAlign: 'center',
  },
  heroBadge: {
    display: 'inline-block',
    padding: '4px 14px',
    borderRadius: '999px',
    background: 'rgba(255,213,107,0.12)',
    border: '1px solid rgba(255,213,107,0.3)',
    color: '#FFD56B',
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.8px',
    textTransform: 'uppercase', marginBottom: '20px',
  },
  heroTitle: {
    fontFamily: 'Fraunces, serif',
    fontSize: 'clamp(34px, 6vw, 52px)',
    fontWeight: 400, lineHeight: 1.1,
    margin: '0 0 20px', color: '#fff',
  },
  heroSub: {
    fontSize: '16px', lineHeight: 1.7,
    color: 'rgba(255,255,255,0.5)',
    margin: 0,
  },

  merciWrap: { maxWidth: '480px', margin: '0 auto', padding: '0 24px' },
  merciCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,213,107,0.2)',
    borderRadius: '20px', padding: '48px 32px',
    textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
  },
  merciEmoji: { fontSize: '40px' },
  merciTitle: { fontFamily: 'Fraunces, serif', fontSize: '32px', fontWeight: 400, margin: 0, color: '#FFD56B' },
  merciText: { fontSize: '15px', lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', margin: 0 },
  merciBtn: {
    display: 'inline-block', marginTop: '8px', padding: '12px 24px',
    background: '#FFD56B', color: '#002820',
    borderRadius: '10px', fontWeight: 700, fontSize: '14px', textDecoration: 'none',
  },

  perksSection: {
    maxWidth: '800px', margin: '0 auto',
    padding: '0 24px 48px',
  },
  perksLabel: {
    fontSize: '11px', fontWeight: 700, letterSpacing: '1px',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
    marginBottom: '16px', margin: '0 0 16px',
  },
  perksGrid: {},
  perkCard: {
    borderRadius: '16px', border: '1px solid',
    padding: '24px',
    display: 'flex', flexDirection: 'column', gap: '10px',
    transition: 'transform .2s',
  },
  perkIcon: {
    width: '48px', height: '48px', borderRadius: '12px',
    border: '1px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.2)', flexShrink: 0,
  },
  perkLabel: { fontSize: '15px', fontWeight: 700, lineHeight: 1.3 },
  perkDesc: { fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 },

  formSection: {
    maxWidth: '560px', margin: '0 auto',
    padding: '0 24px 64px',
  },
  formCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px', padding: '36px',
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  formTitle: {
    fontFamily: 'Fraunces, serif', fontSize: '24px',
    fontWeight: 400, color: '#fff', margin: '0 0 4px',
  },
  formSub: {
    fontSize: '13px', color: 'rgba(255,255,255,0.35)',
    margin: '0 0 20px',
  },

  ideasSection: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    padding: '64px 24px 0',
  },
  ideasInner: { maxWidth: '800px', margin: '0 auto' },
  ideasHead: { textAlign: 'center', marginBottom: '40px' },
  ideasTitle: {
    fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,4vw,36px)',
    fontWeight: 400, color: '#fff', margin: '0 0 12px',
  },
  ideasSub: {
    fontSize: '15px', color: 'rgba(255,255,255,0.45)',
    lineHeight: 1.7, margin: 0, maxWidth: '520px', marginInline: 'auto',
  },
}
