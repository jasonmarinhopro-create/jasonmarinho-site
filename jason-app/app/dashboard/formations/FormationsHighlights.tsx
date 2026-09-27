import Link from 'next/link'
import { ArrowRight, PlayCircle, Sparkle } from '@phosphor-icons/react/dist/ssr'

// En tête du catalogue (sept. 2026) : « Reprendre » la formation en cours et
// 3 recommandations expliquées (lib/formations/recommend.ts). Avant, il fallait
// retrouver sa formation dans une grille de 21 cartes.

export type HighlightFormation = { slug: string; title: string; duration: string | null; progress?: number; reason?: string }

export default function FormationsHighlights({ resume, recommended }: { resume: HighlightFormation | null; recommended: HighlightFormation[] }) {
  if (!resume && recommended.length === 0) return null
  return (
    <div style={s.wrap} className={`fade-up ${resume ? 'formations-highlights' : ''}`}>
      {resume && (
        <Link href={`/dashboard/formations/${resume.slug}`} style={s.resume}>
          <span style={s.resumeIcon}><PlayCircle size={26} weight="fill" /></span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={s.label}>Reprendre</span>
            <span style={s.resumeTitle}>{resume.title}</span>
            <span style={s.bar}><span style={{ ...s.fill, width: `${resume.progress ?? 0}%` }} /></span>
            <span style={s.meta}>{resume.progress ?? 0} % terminé</span>
          </span>
          <span style={s.cta}>Continuer <ArrowRight size={14} weight="bold" /></span>
        </Link>
      )}
      {recommended.length > 0 && (
        <div style={s.recoBlock}>
          <div style={s.recoHead}><Sparkle size={13} weight="fill" /> Pour toi</div>
          <div style={s.recoGrid} className="formations-reco-grid">
            {recommended.map(r => (
              <Link key={r.slug} href={`/dashboard/formations/${r.slug}`} style={s.reco}>
                <span style={s.recoReason}>{r.reason}</span>
                <span style={s.recoTitle}>{r.title}</span>
                {r.duration && <span style={s.meta}>{r.duration}</span>}
              </Link>
            ))}
          </div>
        </div>
      )}
      <style>{`
        .formations-highlights { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; }
        @media (min-width: 1200px) { .formations-highlights { grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); align-items: stretch; } }
        @media (max-width: 760px) { .formations-reco-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { marginBottom: '28px' },
  resume: {
    display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px', borderRadius: '16px',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', textDecoration: 'none', flexWrap: 'wrap',
  },
  resumeIcon: { color: 'var(--accent-text)', display: 'flex', flexShrink: 0 },
  label: { display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--accent-text)' },
  resumeTitle: { display: 'block', fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', color: 'var(--text)', margin: '2px 0 8px', lineHeight: 1.3 },
  bar: { display: 'block', height: '6px', borderRadius: '999px', background: 'var(--surface)', overflow: 'hidden' },
  fill: { display: 'block', height: '100%', background: 'var(--accent-text)', borderRadius: '999px' },
  meta: { display: 'block', fontSize: '12px', color: 'var(--text-3)', marginTop: '6px' },
  cta: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '10px',
    background: 'var(--accent-text)', color: 'var(--bg)', fontSize: '13.5px', fontWeight: 700, flexShrink: 0,
  },
  recoBlock: { display: 'flex', flexDirection: 'column', gap: '8px' },
  recoHead: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--text-2)' },
  recoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px', flex: 1 },
  reco: {
    display: 'flex', flexDirection: 'column', gap: '4px', padding: '14px 16px', borderRadius: '14px',
    background: 'var(--surface)', border: '1px solid var(--border)', textDecoration: 'none',
  },
  recoReason: { fontSize: '11.5px', fontWeight: 600, color: 'var(--accent-text)', lineHeight: 1.4 },
  recoTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.35 },
}
