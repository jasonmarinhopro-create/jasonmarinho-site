import Link from 'next/link'
import { Sparkle, Check, ArrowRight } from '@phosphor-icons/react/dist/ssr'

// Invitation au Standard au moment où une fonction payante est demandée
// (05/10/2026). Ton : ce que la personne gagne, pas ce qui lui est refusé.
// Prix : « dès 19,98 € par an » (tarif Fondateur, voir Mon abonnement).
// Sans hook : utilisable côté serveur comme côté client.
export default function UpgradeCard({ title, desc, points, cta = 'Voir la formule Standard' }: {
  title: string
  desc: string
  points: string[]
  cta?: string
}) {
  return (
    <section style={{
      display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between',
      padding: 'clamp(16px, 2.2vw, 22px)', borderRadius: 16,
      background: 'linear-gradient(135deg, var(--accent-bg) 0%, rgba(255,213,107,0.14) 100%)',
      border: '1px solid var(--accent-border)',
    }}>
      <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--accent-text)' }}>
          <Sparkle size={14} weight="fill" /> Formule Standard
        </span>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-fraunces), serif', fontWeight: 500, fontSize: 'clamp(19px, 2.3vw, 23px)', color: 'var(--text)', lineHeight: 1.25 }}>{title}</h2>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6 }}>{desc}</p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
          {points.map(p => (
            <li key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-2)' }}>
              <Check size={13} weight="bold" color="var(--accent-text)" /> {p}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
        <Link href="/dashboard/abonnement#offre-standard" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 11,
          background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 14, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
        }}>
          {cta} <ArrowRight size={14} weight="bold" />
        </Link>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Dès 19,98 € par an, TVA non applicable</span>
      </div>
    </section>
  )
}
