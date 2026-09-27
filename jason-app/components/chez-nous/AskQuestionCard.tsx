import Link from 'next/link'
import { ChatCircleText, ArrowRight } from '@phosphor-icons/react/dist/ssr'
import type { CategoryId } from '@/lib/chez-nous/categories'

// Lien « Pose ta question » placé là où les questions naissent (guide,
// leçons, simulateurs, déclarations, actualités), sept. 2026. Ouvre
// directement le formulaire de Questions & réponses (?ask=1), sur le bon
// sujet. Promesse tenue par Jason : réponse sous 48 h.

export default function AskQuestionCard({ category, title, text }: {
  category?: CategoryId
  title?: string
  text?: string
}) {
  const href = `/dashboard/entre-hotes/forum?ask=1${category ? `&cat=${category}` : ''}`
  return (
    <Link href={href} style={s.card}>
      <span style={s.icon}><ChatCircleText size={18} weight="fill" /></span>
      <span style={s.body}>
        <span style={s.title}>{title ?? 'Une question sur ton cas ?'}</span>
        <span style={s.text}>{text ?? 'Pose-la à Jason et aux autres hôtes : réponse sous 48 h, par email.'}</span>
      </span>
      <span style={s.cta}>Poser ma question <ArrowRight size={13} weight="bold" /></span>
    </Link>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px 16px',
    padding: '16px 18px', borderRadius: '16px', textDecoration: 'none',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
  },
  icon: {
    width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--surface)', color: 'var(--accent-text)',
  },
  body: { flex: '1 1 260px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' },
  title: { fontSize: '14.5px', fontWeight: 700, color: 'var(--text)' },
  text: { fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5 },
  cta: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0,
    padding: '9px 14px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700,
    background: 'var(--accent-text)', color: 'var(--bg)',
  },
}
