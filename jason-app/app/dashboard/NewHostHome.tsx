import Link from 'next/link'
import { ArrowRight, GraduationCap } from '@phosphor-icons/react/dist/ssr'

// Accueil d'un nouvel inscrit sans logement ni réservation (19/11/2026,
// maquette validée par Jason) : avant, un tableau de bord de zéros. Un seul
// bouton qui compte (ajouter son logement), un aperçu flouté marqué
// « Exemple » (jamais présenté comme ses chiffres) et une formation pour
// commencer (les formations sont ce que les membres utilisent le plus).
export default function NewHostHome({ firstName }: { firstName: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <section style={s.hero}>
        <span style={s.tag}>{firstName ? `Bienvenue ${firstName}` : 'Bienvenue'}</span>
        <h1 style={s.title}>Ajoute ton logement, <em style={s.em}>on s’occupe du reste</em></h1>
        <p style={s.desc}>Son nom et son adresse, puis le lien de ton calendrier Airbnb ou Booking : ton Accueil se remplit tout seul (arrivées, ménages, revenus).</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          <Link href="/dashboard/logements" style={s.cta}>Ajouter mon logement <ArrowRight size={14} weight="bold" /></Link>
        </div>
      </section>

      <section aria-label="Aperçu de ton Accueil">
        <span style={s.small}>Ce que tu verras ici</span>
        <div style={s.preview}>
          <div style={s.ghost} aria-hidden="true">
            <div style={s.gcard}><span style={s.k}>Prochaine arrivée</span><span style={s.v}>Ven. 21</span></div>
            <div style={s.gcard}><span style={s.k}>Revenus du mois</span><span style={s.v}>2 480 €</span></div>
            <div style={s.gcard}><span style={s.k}>Ménages cette semaine</span><span style={s.v}>3</span></div>
            <div style={{ ...s.gcard, gridColumn: '1 / -1', height: 72 }} />
          </div>
          <div style={s.over}><span style={s.pill}>Exemple : apparaît avec ton premier logement</span></div>
        </div>
      </section>

      <section style={s.formation}>
        <span style={s.fIcon}><GraduationCap size={20} weight="duotone" /></span>
        <span style={{ flex: '1 1 220px', minWidth: 0 }}>
          <strong style={{ display: 'block', fontSize: 14.5, color: 'var(--text)' }}>En attendant, commence par une formation</strong>
          <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Mettre le bon prix en location courte durée · 12 leçons</span>
        </span>
        <Link href="/dashboard/formations/mettre-le-bon-prix-lcd" style={s.ghostBtn}>Commencer</Link>
      </section>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  hero: { background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 22, padding: 'clamp(20px, 3vw, 32px)' },
  tag: { fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--accent-text)' },
  title: { fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 'clamp(26px, 3.4vw, 38px)', lineHeight: 1.15, margin: '8px 0 10px', color: 'var(--text)', textWrap: 'balance' as never },
  em: { color: 'var(--accent-text)', fontStyle: 'italic' },
  desc: { fontSize: 15, color: 'var(--text-2)', lineHeight: 1.6, margin: 0, maxWidth: 620 },
  cta: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, background: 'var(--accent-text)', color: 'var(--bg)', fontWeight: 700, fontSize: 14.5, textDecoration: 'none' },
  small: { fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-3)' },
  preview: { position: 'relative', marginTop: 8, borderRadius: 16, overflow: 'hidden' },
  ghost: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, filter: 'blur(2.5px)', opacity: 0.55, pointerEvents: 'none', userSelect: 'none' },
  gcard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 4 },
  k: { fontSize: 12, color: 'var(--text-3)' },
  v: { fontSize: 22, fontWeight: 700, color: 'var(--text)' },
  over: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, textAlign: 'center' },
  pill: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 99, padding: '7px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text)', boxShadow: 'var(--card-shadow)' },
  formation: { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--card-shadow)' },
  fIcon: { width: 40, height: 40, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-bg)', color: 'var(--accent-text)', flexShrink: 0 },
  ghostBtn: { display: 'inline-flex', alignItems: 'center', padding: '8px 16px', borderRadius: 10, border: '1px solid var(--accent-border)', color: 'var(--accent-text)', fontWeight: 600, fontSize: 13.5, textDecoration: 'none' },
}
