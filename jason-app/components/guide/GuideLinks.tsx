import Link from 'next/link'
import { BookOpen, ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { GUIDE_FICHES, PAGE_GUIDE, guideHref } from '@/lib/guide/fiches'

/** Bandeau « Les règles à connaître » en bas d'une page : fiches du Guide LCD liées */
export default function GuideLinks({ page }: { page: keyof typeof PAGE_GUIDE }) {
  const ids = PAGE_GUIDE[page] ?? []
  if (!ids.length) return null
  return (
    <nav aria-label="Fiches du Guide LCD" style={s.wrap}>
      <div style={s.box}>
        <span style={s.label}><BookOpen size={15} weight="fill" /> Guide LCD : les règles à connaître</span>
        <div style={s.links}>
          {ids.map(id => (
            <Link key={id} href={guideHref(id)} style={s.link}>
              {GUIDE_FICHES[id]} <ArrowRight size={12} weight="bold" />
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { padding: '0 clamp(16px,3vw,44px) clamp(16px,3vw,32px)' },
  box: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 16px',
    padding: '14px 18px', borderRadius: '14px',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
  },
  label: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--accent-text)' },
  links: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  link: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 12px', borderRadius: '999px', fontSize: '13px', fontWeight: 500,
    color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--border)', textDecoration: 'none',
  },
}
