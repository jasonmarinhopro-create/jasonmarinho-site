// Deux catégories en haut de l'espace Prospection (20/11/2026, idée de Jason) :
// les e-mails qu'il envoie pour prospecter, et les e-mails de la plateforme
// (membres, voyageurs, pros, alertes).
import Link from 'next/link'
import { PaperPlaneTilt, EnvelopeSimple } from '@phosphor-icons/react/dist/ssr'

export default function EspaceSwitch({ current }: { current: 'prospection' | 'emails' }) {
  const items = [
    { key: 'prospection', href: '/dashboard/admin/prospection', label: 'Ma prospection', hint: 'E-mails envoyés depuis ta boîte', Icon: PaperPlaneTilt },
    { key: 'emails', href: '/dashboard/admin/prospection/emails', label: 'E-mails de la plateforme', hint: 'Membres, voyageurs, pros, alertes', Icon: EnvelopeSimple },
  ] as const
  return (
    <nav aria-label="Espace e-mails" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '8px', padding: '6px', borderRadius: '18px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
      {items.map(it => {
        const on = it.key === current
        return (
          <Link key={it.key} href={it.href} aria-current={on ? 'page' : undefined} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '13px', textDecoration: 'none', minWidth: 0, background: on ? 'var(--accent-bg)' : 'transparent', border: on ? '1px solid var(--accent-text)' : '1px solid transparent' }}>
            <it.Icon size={20} weight={on ? 'fill' : 'bold'} style={{ color: on ? 'var(--accent-text)' : 'var(--text-3)', flexShrink: 0 }} />
            <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <strong style={{ fontSize: '14.5px', color: on ? 'var(--accent-text)' : 'var(--text)' }}>{it.label}</strong>
              <span style={{ fontSize: '12.5px', color: 'var(--text-3)' }}>{it.hint}</span>
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
