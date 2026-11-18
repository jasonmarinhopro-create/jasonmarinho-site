'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Newspaper, BookOpen } from '@phosphor-icons/react/dist/ssr'

/**
 * Onglets « Actualités » / « Guide LCD » de l'espace hôte (18/11/2026).
 * Jason : le Guide LCD était trop caché et doit évoluer comme les
 * actualités. Les deux vivent sous une seule entrée du menu
 * (« Actualités & guide ») : l'actualité qui change, et les bonnes
 * pratiques qui restent. Les adresses ne changent pas
 * (/dashboard/actualites et /dashboard/apprendre/guide).
 */
const TABS = [
  {
    href: '/dashboard/actualites',
    match: ['/dashboard/actualites'],
    label: 'Actualités',
    hint: 'Ce qui change pour les hôtes',
    Icon: Newspaper,
  },
  {
    href: '/dashboard/apprendre/guide',
    match: ['/dashboard/apprendre/guide', '/dashboard/guide'],
    label: 'Guide LCD',
    hint: 'Les bonnes pratiques, fiche par fiche',
    Icon: BookOpen,
  },
]

export default function VeilleTabBar() {
  const pathname = usePathname() ?? ''
  return (
    <nav style={s.wrap} aria-label="Actualités et guide">
      <div style={s.bar} className="jm-veille-tabs">
        {TABS.map(({ href, match, label, hint, Icon }) => {
          const active = match.some(m => pathname === m || pathname.startsWith(m + '/'))
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              style={{
                ...s.tab,
                border: active ? '1px solid var(--border)' : '1px solid transparent',
                background: active ? 'var(--surface)' : 'transparent',
                boxShadow: active ? 'var(--card-shadow)' : 'none',
              }}
            >
              <span style={{ ...s.icon, color: active ? 'var(--accent-text)' : 'var(--text-3)', background: active ? 'var(--accent-bg)' : 'transparent' }}>
                <Icon size={16} weight={active ? 'fill' : 'regular'} />
              </span>
              <span style={s.text}>
                <span style={{ ...s.label, color: active ? 'var(--text)' : 'var(--text-2)' }}>{label}</span>
                <span style={s.hint} className="jm-veille-hint">{hint}</span>
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { padding: '20px var(--dash-page-px) 0' },
  bar: {
    display: 'inline-flex', gap: 4, padding: 4,
    background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14,
    maxWidth: '100%', overflowX: 'auto',
  },
  tab: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 16px 8px 8px', borderRadius: 10,
    textDecoration: 'none', whiteSpace: 'nowrap',
    transition: 'background 0.15s, box-shadow 0.15s, border 0.15s',
  },
  icon: {
    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  text: { display: 'flex', flexDirection: 'column', lineHeight: 1.2 },
  label: { fontSize: 14, fontWeight: 600 },
  hint: { fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 },
}
