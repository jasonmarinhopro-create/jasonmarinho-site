'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarBlank, Broom } from '@phosphor-icons/react/dist/ssr'

// Onglets Calendrier / Ménage (sept. 2026). Le planning ménage était caché
// derrière l'icône balai de la barre d'outils du calendrier : c'est pourtant
// une tâche quotidienne (Hospitable et Superhote en font un écran à part).
export default function CalendrierTabBar() {
  const pathname = usePathname() ?? ''
  const tabs = [
    { href: '/dashboard/calendrier',        label: 'Calendrier', Icon: CalendarBlank, active: pathname === '/dashboard/calendrier' },
    { href: '/dashboard/calendrier/menage', label: 'Ménage',     Icon: Broom,         active: pathname.startsWith('/dashboard/calendrier/menage') },
  ]
  return (
    <nav style={s.bar} aria-label="Onglets Calendrier">
      {tabs.map(({ href, label, Icon, active }) => (
        <Link
          key={href}
          href={href}
          style={{ ...s.tab, ...(active ? s.tabActive : {}) }}
          aria-current={active ? 'page' : undefined}
        >
          <Icon size={15} weight={active ? 'fill' : 'regular'} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}

const s: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex', gap: 4,
    borderBottom: '1px solid var(--border)',
    padding: '0 clamp(20px,3vw,40px)',
    overflowX: 'auto', WebkitOverflowScrolling: 'touch',
  },
  tab: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '12px 16px',
    fontSize: 13.5, fontWeight: 500,
    color: 'var(--text-3)',
    textDecoration: 'none',
    borderBottom: '2px solid transparent',
    marginBottom: -1, whiteSpace: 'nowrap',
  },
  tabActive: {
    color: 'var(--accent-text)',
    borderBottomColor: 'var(--accent-text)',
    fontWeight: 600,
  },
}
