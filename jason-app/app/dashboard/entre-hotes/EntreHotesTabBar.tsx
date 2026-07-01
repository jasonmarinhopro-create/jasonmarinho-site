'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChatsCircle, FacebookLogo, Globe } from '@phosphor-icons/react/dist/ssr'

/**
 * Barre d'onglets pour /dashboard/entre-hotes/*.
 * Les sous-routes du forum (/chez-nous/[postId], /chez-nous/membre/[id], etc.)
 * restent à leur URL d'origine — la tab bar n'est visible que sur la home
 * du forum (/entre-hotes/forum), pas sur les vues détail.
 */
export default function EntreHotesTabBar() {
  const pathname = usePathname() ?? ''
  const tabs = [
    { href: '/dashboard/entre-hotes/forum',            label: 'Forum',           Icon: ChatsCircle },
    { href: '/dashboard/entre-hotes/groupes-facebook', label: 'Groupes Facebook', Icon: FacebookLogo },
    { href: '/dashboard/entre-hotes/ecosysteme',       label: 'Écosystème LCD',   Icon: Globe },
  ]
  return (
    <nav style={s.bar} aria-label="Onglets Entre Hôtes">
      {tabs.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            style={{ ...s.tab, ...(active ? s.tabActive : {}) }}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={15} weight={active ? 'fill' : 'regular'} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

const s: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex', gap: 4,
    borderBottom: '1px solid var(--border)',
    padding: '0 var(--dash-page-px)',
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
    transition: 'color 0.15s, border-color 0.15s',
  },
  tabActive: {
    color: 'var(--accent-text)',
    borderBottomColor: 'var(--accent-text)',
    fontWeight: 600,
  },
}
