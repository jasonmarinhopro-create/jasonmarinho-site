// Bandeau d'en-tête commun aux pages « Trouver des voyageurs » (Groupes
// Facebook, Fiche Google) et « Apprendre » (Formations, Guide LCD), sept. 2026.
// Toujours aux couleurs de la marque (vert + touche de jaune), jamais le bleu
// des plateformes : demande de Jason. Une promesse, 3 étapes, une action,
// et une carte à droite (score, reprise, chiffres).

type Step = [verb: string, rest: string]

export default function HubHero({ eyebrowIcon, eyebrow, title, desc, steps, children, aside }: {
  eyebrowIcon?: React.ReactNode
  eyebrow: string
  title: React.ReactNode
  desc: React.ReactNode
  steps?: Step[]
  /** Boutons d'action sous les étapes */
  children?: React.ReactNode
  /** Carte à droite (passe dessous sur mobile) */
  aside?: React.ReactNode
}) {
  return (
    <section style={s.hero} className="fade-up">
      <div style={{ flex: '1 1 440px', minWidth: 0 }}>
        <div style={s.eyebrow}>{eyebrowIcon}{eyebrow}</div>
        <h1 style={s.title}>{title}</h1>
        <p style={s.desc}>{desc}</p>
        {steps && steps.length > 0 && (
          <ol style={s.steps}>
            {steps.map(([verb, rest], i) => (
              <li key={verb} style={s.step}>
                <span style={s.stepNum}>{i + 1}</span>
                <span><strong style={{ color: 'var(--text)' }}>{verb}</strong> {rest}</span>
              </li>
            ))}
          </ol>
        )}
        {children}
      </div>
      {aside && <div style={s.aside}>{aside}</div>}
    </section>
  )
}

/** Titre en italique vert, à utiliser dans `title` */
export function HeroEm({ children }: { children: React.ReactNode }) {
  return <em style={{ fontStyle: 'italic', color: 'var(--accent-text)' }}>{children}</em>
}

export const heroCard: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '8px', padding: '18px 20px', borderRadius: '18px',
  background: 'var(--surface)', border: '1px solid var(--border)',
}

export const heroCta: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px',
  background: 'var(--accent-text)', color: 'var(--bg)', fontSize: '14.5px', fontWeight: 700, textDecoration: 'none',
}

export const heroLink: React.CSSProperties = {
  fontSize: '13.5px', fontWeight: 600, color: 'var(--accent-text)', textDecoration: 'underline', textUnderlineOffset: '3px',
}

const s: Record<string, React.CSSProperties> = {
  hero: {
    display: 'flex', flexWrap: 'wrap', gap: '24px 40px', alignItems: 'center',
    padding: 'clamp(22px,3vw,36px)', borderRadius: '20px', marginBottom: '28px',
    background: 'linear-gradient(135deg, var(--accent-bg) 0%, rgba(99,214,131,0.10) 55%, rgba(255,213,107,0.14) 100%)',
    border: '1px solid var(--accent-border)',
  },
  eyebrow: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700,
    color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px',
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400,
    color: 'var(--text)', margin: '0 0 10px', lineHeight: 1.15, letterSpacing: '-0.5px',
  },
  desc: { fontSize: '15px', color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 18px', maxWidth: '600px' },
  steps: { listStyle: 'none', margin: '0 0 20px', padding: 0, display: 'flex', flexWrap: 'wrap', gap: '10px' },
  step: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px 8px 8px',
    borderRadius: '999px', background: 'var(--surface)', border: '1px solid var(--border)',
    fontSize: '13px', color: 'var(--text-2)',
  },
  stepNum: {
    width: '22px', height: '22px', borderRadius: '50%', background: 'var(--accent-text)', color: 'var(--bg)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0,
  },
  aside: { flex: '0 1 320px', minWidth: 0, display: 'flex', gap: '12px', flexWrap: 'wrap' },
}
