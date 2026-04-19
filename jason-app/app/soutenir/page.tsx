import { Metadata } from 'next'
import { Medal, ChatCircle, Sparkle, Rocket } from '@phosphor-icons/react/dist/ssr'
import TipForm from './TipForm'

export const metadata: Metadata = {
  title: 'Contribuer — jasonmarinho.com',
  description: 'Soutiens le développement de la plateforme, propose des fonctionnalités et obtiens un badge Contributeur.',
}

const PERKS = [
  {
    icon: Medal,
    label: 'Badge Contributeur permanent',
    desc: 'Un badge affiché sur ton profil, visible dans la communauté et sur la page publique des contributeurs.',
  },
  {
    icon: ChatCircle,
    label: 'Accès direct à Jason',
    desc: 'Un canal privé pour poser tes questions directement, partager tes retours et suivre les coulisses de la plateforme.',
  },
  {
    icon: Sparkle,
    label: 'Tes idées en priorité',
    desc: 'Les demandes de fonctionnalités des contributeurs passent avant toutes les autres. Tu orientes la roadmap.',
  },
  {
    icon: Rocket,
    label: 'Accès anticipé aux nouveautés',
    desc: 'Tu testes chaque nouvelle fonctionnalité en avant-première, avant le déploiement public.',
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
      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroBadge}>Contributeur</div>
        <h1 style={s.heroTitle}>
          On construit ça ensemble
        </h1>
        <p style={s.heroSub}>
          Tu veux aller plus loin que le plan Standard ? En contribuant librement,
          tu rejoins ceux qui co-construisent la plateforme. Propose des fonctionnalités,
          influence les priorités et reçois un badge Contributeur sur ton profil.
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
              sous 24h et tu recevras un accès au canal privé. N&apos;hésite pas à partager
              tes idées directement.
            </p>
            <a href="/" style={s.merciBtn}>Retour à l&apos;accueil</a>
          </div>
        </section>
      )}

      {/* Form + uses */}
      {!merci && (
        <section style={s.main} className="soutenir-main">
          {/* Left — form */}
          <div style={s.formCol}>
            <div style={s.formCard}>
              <p style={s.formIntro}>Choisis un montant ou saisis le tien.</p>
              <TipForm />
            </div>
          </div>

          {/* Right — what it funds */}
          <div style={s.usesCol}>
            <h2 style={s.usesTitle}>Ce que tu obtiens</h2>
            <div style={s.usesList}>
              {PERKS.map(({ icon: Icon, label, desc }) => (
                <div key={label} style={s.useItem}>
                  <div style={s.useIcon}><Icon size={20} weight="duotone" /></div>
                  <div>
                    <div style={s.useLabel}>{label}</div>
                    <div style={s.useDesc}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={s.note}>
              <p style={s.noteText}>
                Aucune obligation, aucun engagement. Le montant est libre, même 1 € fait la différence.
                Cette page existe pour ceux qui veulent construire quelque chose avec nous, pas juste utiliser un outil.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #001a13 0%, #002820 50%, #001a13 100%)',
    color: '#fff',
    fontFamily: 'Inter, system-ui, sans-serif',
    padding: '0 0 80px',
  },

  hero: {
    maxWidth: '680px',
    margin: '0 auto',
    padding: '80px 24px 48px',
    textAlign: 'center',
  },
  heroBadge: {
    display: 'inline-block',
    padding: '4px 14px',
    borderRadius: '999px',
    background: 'rgba(255,213,107,0.12)',
    border: '1px solid rgba(255,213,107,0.3)',
    color: '#FFD56B',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    marginBottom: '20px',
  },
  heroTitle: {
    fontFamily: 'Fraunces, serif',
    fontSize: 'clamp(36px, 6vw, 56px)',
    fontWeight: 400,
    lineHeight: 1.1,
    margin: '0 0 20px',
    color: '#fff',
  },
  heroSub: {
    fontSize: '16px',
    lineHeight: 1.7,
    color: 'rgba(255,255,255,0.55)',
    margin: 0,
    maxWidth: '520px',
    marginInline: 'auto',
  },

  merciWrap: {
    maxWidth: '480px',
    margin: '0 auto',
    padding: '0 24px',
  },
  merciCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,213,107,0.2)',
    borderRadius: '20px',
    padding: '48px 32px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  merciEmoji: { fontSize: '40px' },
  merciTitle: {
    fontFamily: 'Fraunces, serif',
    fontSize: '32px',
    fontWeight: 400,
    margin: 0,
    color: '#FFD56B',
  },
  merciText: {
    fontSize: '15px',
    lineHeight: 1.7,
    color: 'rgba(255,255,255,0.6)',
    margin: 0,
  },
  merciBtn: {
    display: 'inline-block',
    marginTop: '8px',
    padding: '12px 24px',
    background: '#FFD56B',
    color: '#002820',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '14px',
    textDecoration: 'none',
    letterSpacing: '0.2px',
  },

  main: {
    maxWidth: '960px',
    margin: '0 auto',
    padding: '0 24px',
  },

  formCol: {},
  formCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '32px',
  },
  formIntro: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)',
    margin: '0 0 24px',
    letterSpacing: '0.3px',
  },

  usesCol: {
    paddingTop: '4px',
  },
  usesTitle: {
    fontFamily: 'Fraunces, serif',
    fontSize: '24px',
    fontWeight: 400,
    margin: '0 0 24px',
    color: '#fff',
  },
  usesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginBottom: '32px',
  },
  useItem: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  useIcon: {
    flexShrink: 0,
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'rgba(255,213,107,0.1)',
    border: '1px solid rgba(255,213,107,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFD56B',
  },
  useLabel: { fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '4px' },
  useDesc: { fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 },

  note: {
    borderTop: '1px solid rgba(255,255,255,0.07)',
    paddingTop: '24px',
  },
  noteText: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.3)',
    lineHeight: 1.7,
    margin: 0,
  },
}
