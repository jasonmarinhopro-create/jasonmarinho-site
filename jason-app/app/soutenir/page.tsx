import { Metadata } from 'next'
import {
  Compass, Lightbulb, ArrowRight, Heart,
  ShieldCheck, Rocket, ChartLineUp, Users,
} from '@phosphor-icons/react/dist/ssr'
import TipForm from './TipForm'
import BackButton from './BackButton'

export const metadata: Metadata = {
  title: 'Devenir contributeur, jasonmarinho.com',
  description: 'Rejoins les personnes qui orientent la plateforme. Un siège à la table, pas un don.',
}

export default async function SoutenirPage({
  searchParams,
}: {
  searchParams: Promise<{ merci?: string }>
}) {
  const params = await searchParams
  const merci  = params.merci === '1'

  return (
    <div style={s.root}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .perk-card:hover { transform: translateY(-2px); }
        @media (max-width: 700px) {
          .perks-grid { grid-template-columns: 1fr !important; }
          .two-col    { flex-direction: column !important; }
          .presets    { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      {/* Back */}
      <div style={s.topBar}>
        <BackButton />
      </div>

      {merci ? (
        /* ── État merci ── */
        <section style={s.merciWrap}>
          <div style={s.merciCard}>
            <div style={s.merciIcon}>✦</div>
            <h1 style={s.merciTitle}>Bienvenue dans le cercle.</h1>
            <p style={s.merciText}>
              Ta contribution est reçue. Ton badge Contributeur sera activé sous 24h -
              tu recevras un accès à l&apos;espace exclusif dans ton dashboard.
            </p>
            <a href="/dashboard" style={s.merciBtn}>
              Accéder à mon espace <ArrowRight size={14} weight="bold" />
            </a>
          </div>
        </section>
      ) : (
        <>

          {/* ── Hero ── */}
          <section style={s.hero}>
            <div style={s.heroBadge}>
              <Heart size={11} weight="fill" />
              Membres fondateurs
            </div>
            <h1 style={s.heroTitle}>
              Un siège à la table,<br />
              <em style={s.heroAccent}>pas un don.</em>
            </h1>
            <p style={s.heroSub}>
              Les contributeurs ne financent pas. Ils orientent.
              Ils proposent, ils votent, ils décident de ce qui est construit en priorité.
            </p>
          </section>

          {/* ── Message de Jason ── */}
          <section style={s.jasonSection}>
            <div style={{ ...s.twoCol } as React.CSSProperties} className="two-col">
              <div style={s.jasonAvatar}>
                <span style={s.jasonInitials}>JM</span>
              </div>
              <div style={s.jasonText}>
                <p style={s.jasonQuote}>
                  &ldquo;Cette plateforme, je la construis seul, la nuit, les week-ends, entre deux clients Driing.
                  Il n&apos;y a pas d&apos;investisseur derrière, pas d&apos;équipe.
                  Juste un outil que j&apos;aurais aimé avoir quand j&apos;ai commencé, et que je construis
                  maintenant pour ceux qui veulent aller plus loin.
                &rdquo;</p>
                <p style={s.jasonQuote2}>
                  Si la plateforme t&apos;apporte de la valeur et que tu veux qu&apos;elle continue
                  d&apos;évoluer, ta contribution me donne le temps de la construire,
                  et toi tu obtiens un vrai rôle dans ce que ça devient.
                </p>
                <p style={s.jasonName}>- Jason Marinho</p>
              </div>
            </div>
          </section>

          {/* ── Ce que tu obtiens ── */}
          <section style={s.perksSection}>
            <p style={s.sectionLabel}>Ton accès exclusif</p>
            <div style={s.perksGrid} className="perks-grid">
              {[
                {
                  icon: Compass, color: '#FFD56B', glow: 'rgba(255,213,107,0.1)', border: 'rgba(255,213,107,0.2)',
                  label: 'Tu orientes la roadmap',
                  desc: 'Propose des fonctionnalités, vote sur les priorités. Ce que tu demandes passe avant tout le monde.',
                },
                {
                  icon: Users, color: '#34d399', glow: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)',
                  label: 'Espace contributeurs',
                  desc: 'Accès à un espace dédié dans ton dashboard, roadmap en temps réel, idées en cours, discussions.',
                },
                {
                  icon: Rocket, color: '#a78bfa', glow: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)',
                  label: 'Accès anticipé',
                  desc: 'Chaque nouveauté te parvient en avant-première. Tu testes avant que ça soit public.',
                },
                {
                  icon: ShieldCheck, color: '#60a5fa', glow: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)',
                  label: 'Badge permanent',
                  desc: 'Le badge Contributeur reste sur ton profil indéfiniment. Peu importe ce que tu mets.',
                },
              ].map(({ icon: Icon, color, glow, border, label, desc }) => (
                <div
                  key={label}
                  className="perk-card"
                  style={{ ...s.perkCard, background: glow, borderColor: border, transition: 'transform .2s' }}
                >
                  <div style={{ ...s.perkIcon, color, borderColor: border }}>
                    <Icon size={20} weight="duotone" />
                  </div>
                  <p style={{ ...s.perkLabel, color }}>{label}</p>
                  <p style={s.perkDesc}>{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Transparence ── */}
          <section style={s.transparencySection}>
            <div style={s.transparencyInner}>
              <div style={s.transparencyHead}>
                <ChartLineUp size={18} color="#FFD56B" weight="duotone" />
                <p style={s.sectionLabel}>À quoi sert ta contribution ?</p>
              </div>
              <div style={s.transparencyGrid}>
                {[
                  { pct: '40 %', label: 'Infrastructure', desc: 'Hébergement, base de données, CDN, domaines.' },
                  { pct: '35 %', label: 'Développement', desc: 'Temps passé à construire de nouvelles fonctionnalités.' },
                  { pct: '25 %', label: 'Outils & services', desc: 'IA, emails transactionnels, paiements, monitoring.' },
                ].map(({ pct, label, desc }) => (
                  <div key={label} style={s.transparencyItem}>
                    <span style={s.transparencyPct}>{pct}</span>
                    <div>
                      <p style={s.transparencyLabel}>{label}</p>
                      <p style={s.transparencyDesc}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Formulaire ── */}
          <section style={s.formSection}>
            <div style={s.formCard}>
              <div style={s.formHead}>
                <Lightbulb size={18} color="#FFD56B" weight="duotone" />
                <h2 style={s.formTitle}>Choisis ce que ça vaut pour toi</h2>
              </div>
              <p style={s.formSub}>
                Aucun minimum imposé, aucune obligation. 5 €, 50 €, libre à toi.
                Le badge et l&apos;accès s&apos;activent quelle que soit la somme.
              </p>
              <TipForm />
            </div>
          </section>

          {/* ── Note finale ── */}
          <section style={s.finalNote}>
            <p style={s.finalText}>
              Tu peux contribuer une seule fois. Il n&apos;y a pas d&apos;abonnement contributeur,
              pas de renouvellement automatique, pas de pression.
              Une fois contributeur, tu l&apos;es pour toujours.
            </p>
          </section>

        </>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #001a13 0%, #002820 60%, #001a13 100%)',
    color: '#fff',
    fontFamily: 'Inter, system-ui, sans-serif',
    paddingBottom: '100px',
  },

  topBar: { padding: '24px 32px 0', maxWidth: '820px', margin: '0 auto' },

  /* ── Merci ── */
  merciWrap: { maxWidth: '480px', margin: '80px auto 0', padding: '0 24px' },
  merciCard: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,213,107,0.2)',
    borderRadius: '24px', padding: '56px 40px',
    textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px',
  },
  merciIcon:  { fontSize: '36px', color: '#FFD56B', fontWeight: 700 },
  merciTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '32px', fontWeight: 400, margin: 0, color: '#FFD56B' },
  merciText:  { fontSize: '15px', lineHeight: 1.7, color: 'rgba(255,255,255,0.55)', margin: 0, maxWidth: '360px' },
  merciBtn:   {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    marginTop: '8px', padding: '13px 24px',
    background: '#FFD56B', color: '#002820',
    borderRadius: '12px', fontWeight: 700, fontSize: '14px', textDecoration: 'none',
  },

  /* ── Hero ── */
  hero: { maxWidth: '660px', margin: '0 auto', padding: '56px 24px 48px', textAlign: 'center' },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '5px 14px', borderRadius: '999px',
    background: 'rgba(255,213,107,0.1)', border: '1px solid rgba(255,213,107,0.25)',
    color: '#FFD56B', fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px',
    textTransform: 'uppercase', marginBottom: '24px',
  },
  heroTitle: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(38px,6vw,60px)',
    fontWeight: 400, lineHeight: 1.1, margin: '0 0 22px', color: '#fff',
  },
  heroAccent: { color: '#FFD56B', fontStyle: 'italic' },
  heroSub:    { fontSize: '17px', lineHeight: 1.7, color: 'rgba(255,255,255,0.45)', margin: 0 },

  /* ── Jason ── */
  jasonSection: { maxWidth: '820px', margin: '0 auto 64px', padding: '0 24px' },
  twoCol:       {
    display: 'flex', gap: '32px', alignItems: 'flex-start',
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '20px', padding: '32px',
  },
  jasonAvatar: {
    width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, rgba(255,213,107,0.2) 0%, rgba(0,76,63,0.4) 100%)',
    border: '1px solid rgba(255,213,107,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  jasonInitials: { fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', color: '#FFD56B', fontWeight: 400 },
  jasonText:     { flex: 1 },
  jasonQuote:    { fontSize: '15px', lineHeight: 1.8, color: 'rgba(255,255,255,0.6)', margin: '0 0 12px', fontStyle: 'italic' },
  jasonQuote2:   { fontSize: '14px', lineHeight: 1.7, color: 'rgba(255,255,255,0.45)', margin: '0 0 16px' },
  jasonName:     { fontSize: '13px', fontWeight: 600, color: '#FFD56B', margin: 0 },

  /* ── Perks ── */
  perksSection: { maxWidth: '820px', margin: '0 auto 64px', padding: '0 24px' },
  sectionLabel: {
    fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.3)', margin: '0 0 18px',
  },
  perksGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' },
  perkCard:  { borderRadius: '16px', border: '1px solid', padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' },
  perkIcon:  {
    width: '44px', height: '44px', borderRadius: '11px', border: '1px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.2)', flexShrink: 0,
  },
  perkLabel: { fontSize: '15px', fontWeight: 700, margin: 0, lineHeight: 1.3 },
  perkDesc:  { fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.6 },

  /* ── Transparence ── */
  transparencySection: { maxWidth: '820px', margin: '0 auto 64px', padding: '0 24px' },
  transparencyInner:   {
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '20px', padding: '28px 32px',
  },
  transparencyHead: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' },
  transparencyGrid: { display: 'flex', gap: '32px', flexWrap: 'wrap' as const },
  transparencyItem: { display: 'flex', alignItems: 'flex-start', gap: '14px', flex: '1', minWidth: '180px' },
  transparencyPct:  { fontFamily: 'var(--font-fraunces), serif', fontSize: '28px', color: '#FFD56B', fontWeight: 400, flexShrink: 0, lineHeight: 1 },
  transparencyLabel:{ fontSize: '13px', fontWeight: 700, color: '#fff', margin: '0 0 4px' },
  transparencyDesc: { fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.5 },

  /* ── Formulaire ── */
  formSection: { maxWidth: '560px', margin: '0 auto 32px', padding: '0 24px' },
  formCard:    {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,213,107,0.15)',
    borderRadius: '24px', padding: '36px',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  formHead:  { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' },
  formTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '22px', fontWeight: 400, color: '#fff', margin: 0 },
  formSub:   { fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: '0 0 8px', lineHeight: 1.6 },

  /* ── Note finale ── */
  finalNote: { maxWidth: '560px', margin: '0 auto', padding: '0 24px', textAlign: 'center' },
  finalText: { fontSize: '13px', color: 'rgba(255,255,255,0.25)', lineHeight: 1.7, margin: 0 },
}
