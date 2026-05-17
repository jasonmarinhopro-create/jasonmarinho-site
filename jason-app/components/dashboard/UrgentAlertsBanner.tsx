// Bannière compacte qui surface les alertes urgentes (warning/error non lues)
// en haut du dashboard. Self-regulating : si rien d'urgent, RIEN ne s'affiche.
//
// Philosophie : on n'ajoute pas un widget de plus à un dashboard déjà chargé.
// On insiste sur ce qui DEMANDE une action de l'hôte aujourd'hui — et seulement
// quand ça existe. Le calme est une feature : pas d'alerte = page épurée.
//
// Server component : pas de fetch côté client, données chargées en parallèle
// avec le reste du dashboard.

import Link from 'next/link'
import { ArrowRight, Warning } from '@phosphor-icons/react/dist/ssr'
import { getNotifications } from '@/lib/notifications/queries'

const MAX_VISIBLE = 3

export default async function UrgentAlertsBanner() {
  const notifications = await getNotifications({ limit: 10, unreadOnly: true })
  // On ne garde que ce qui est VRAIMENT urgent (warning ou error). Les
  // notifications "info" et "success" attendront que l'utilisateur ouvre
  // la cloche — pas besoin de les pousser ici.
  const urgent = notifications.filter(n => n.severity === 'warning' || n.severity === 'error')
  if (urgent.length === 0) return null

  const visible = urgent.slice(0, MAX_VISIBLE)
  const hidden = urgent.length - visible.length

  return (
    <section style={s.wrap} aria-label="Alertes nécessitant ton attention">
      <div style={s.head}>
        <div style={s.headLeft}>
          <span style={s.headIcon} aria-hidden="true">
            <Warning size={14} weight="fill" />
          </span>
          <span style={s.headTitle}>
            {urgent.length} chose{urgent.length > 1 ? 's' : ''} à regarder
          </span>
        </div>
        <Link href="/dashboard/notifications" style={s.headLink}>
          Tout voir <ArrowRight size={11} weight="bold" />
        </Link>
      </div>
      <ul style={s.list}>
        {visible.map(n => {
          const color = n.severity === 'error' ? '#f87171' : '#FFD56B'
          return (
            <li key={n.id} style={s.item}>
              <span aria-hidden="true" style={{ ...s.itemDot, background: color }} />
              <div style={s.itemBody}>
                <span style={s.itemTitle}>{n.title}</span>
                {n.cta_href && (
                  <Link href={n.cta_href} style={s.itemCta}>
                    {n.cta_label ?? 'Voir'} <ArrowRight size={10} weight="bold" />
                  </Link>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {hidden > 0 && (
        <Link href="/dashboard/notifications" style={s.moreLink}>
          + {hidden} autre{hidden > 1 ? 's' : ''} alerte{hidden > 1 ? 's' : ''}
        </Link>
      )}
    </section>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    padding: '14px 16px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, rgba(255,213,107,0.05) 0%, var(--surface) 100%)',
    border: '1px solid rgba(255,213,107,0.22)',
    marginBottom: '14px',
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  headLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  headIcon: {
    width: '22px', height: '22px', borderRadius: '7px',
    background: 'rgba(255,213,107,0.15)',
    border: '1px solid rgba(255,213,107,0.30)',
    color: '#FFD56B',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  headTitle: {
    fontSize: '12.5px', fontWeight: 700,
    color: 'var(--text)', letterSpacing: '0.1px',
  },
  headLink: {
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    fontSize: '11.5px', fontWeight: 600,
    color: 'var(--text-3)', textDecoration: 'none',
  },
  list: {
    listStyle: 'none', padding: 0, margin: 0,
    display: 'flex', flexDirection: 'column' as const, gap: '4px',
  },
  item: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '7px 8px', borderRadius: '8px',
  },
  itemDot: {
    width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
  },
  itemBody: {
    flex: 1, minWidth: 0,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: '8px', flexWrap: 'wrap' as const,
  },
  itemTitle: {
    fontSize: '13px', fontWeight: 500, color: 'var(--text)',
    lineHeight: 1.35,
  },
  itemCta: {
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    fontSize: '11.5px', fontWeight: 600,
    color: 'var(--accent-text)', textDecoration: 'none',
    flexShrink: 0,
  },
  moreLink: {
    display: 'inline-block', marginTop: '6px',
    fontSize: '11.5px', fontWeight: 500,
    color: 'var(--text-3)', textDecoration: 'none',
    padding: '4px 8px',
  },
}
