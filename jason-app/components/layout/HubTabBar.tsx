'use client'

import Link from 'next/link'
import type { CalendarBlank } from '@phosphor-icons/react/dist/ssr'

type Icon = typeof CalendarBlank

/**
 * Onglets des espaces du dashboard (23/11/2026, Jason : « que tous les autres
 * endroits aient la même direction artistique avec le titre et quelques
 * mots »). Modèle : les onglets Actualités / Guide LCD (VeilleTabBar) :
 * une icône, un titre et une ligne qui dit à quoi sert l'onglet, posés à
 * gauche sous l'en-tête. Utilisé par S'informer, Calendrier, Trouver des
 * voyageurs, Partenaires, Mes finances et Formations.
 *
 * Un onglet avec `onSelect` ne recharge pas la page (Formations : l'adresse
 * est mise à jour sur place) ; sinon c'est un lien normal.
 * Sous 560 px, la ligne d'explication est masquée (`.jm-veille-hint`).
 */
export interface HubTabItem {
  href: string
  label: string
  hint: string
  Icon: Icon
  active: boolean
  prefetch?: boolean
  onSelect?: () => void
}

export default function HubTabBar({ tabs, label, flush = false }: {
  tabs: HubTabItem[]
  /** Nom de la barre pour les lecteurs d'écran */
  label: string
  /** Sans marge latérale (page qui gère déjà son padding) */
  flush?: boolean
}) {
  return (
    <nav style={{ ...s.wrap, ...(flush ? { padding: 0 } : null) }} aria-label={label}>
      <div style={s.bar} className="jm-veille-tabs">
        {tabs.map(({ href, label: l, hint, Icon, active, prefetch, onSelect }) => (
          <Link
            key={href}
            href={href}
            prefetch={prefetch}
            scroll={!onSelect}
            onClick={onSelect ? (e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
              e.preventDefault()
              onSelect()
            } : undefined}
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
              <span style={{ ...s.label, color: active ? 'var(--text)' : 'var(--text-2)' }}>{l}</span>
              <span style={s.hint} className="jm-veille-hint">{hint}</span>
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { padding: '20px var(--dash-page-px) 0' },
  bar: {
    display: 'inline-flex', gap: 4, padding: 4,
    background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14,
    maxWidth: '100%', overflowX: 'auto', scrollbarWidth: 'none',
  },
  tab: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 16px 8px 8px', borderRadius: 10,
    textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
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
