'use client'

// Une ligne du fil de notifications, partagée par le panneau de la cloche et
// la page Notifications (refonte 29/09/2026). Toute la ligne est cliquable :
// elle marque la notification comme lue puis ouvre la page concernée.
import Link from 'next/link'
import {
  CalendarCheck, CurrencyEur, IdentificationCard, Broom, GearSix, ChatCircleDots, Sparkle, CaretRight,
} from '@phosphor-icons/react/dist/ssr'
import RelativeTime from '@/components/ui/RelativeTime'
import { GROUP_META, type FeedItem, type NotifGroup } from '@/lib/notifications/present'

const ICONS: Record<NotifGroup, typeof CalendarCheck> = {
  reservations: CalendarCheck,
  paiements: CurrencyEur,
  voyageurs: IdentificationCard,
  menage: Broom,
  compte: GearSix,
  questions: ChatCircleDots,
  nouveautes: Sparkle,
}

const tint = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`

export function groupColor(item: Pick<FeedItem, 'group' | 'severity'>): string {
  if (item.severity === 'error') return 'var(--danger)'
  return GROUP_META[item.group].color
}

export function GroupIcon({ group, color, size = 36 }: { group: NotifGroup; color?: string; size?: number }) {
  const Icon = ICONS[group]
  const c = color ?? GROUP_META[group].color
  return (
    <span aria-hidden="true" style={{
      width: size, height: size, borderRadius: size * 0.3, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: c, background: tint(c, 12), border: `1px solid ${tint(c, 24)}`,
    }}>
      <Icon size={Math.round(size * 0.47)} weight="fill" />
    </span>
  )
}

export default function FeedRow({ item, onOpen, compact = false }: {
  item: FeedItem
  /** Appelé au clic (marquer comme lu, fermer le panneau) */
  onOpen: (item: FeedItem) => void
  compact?: boolean
}) {
  const color = groupColor(item)
  const content = (
    <>
      <GroupIcon group={item.group} color={color} size={compact ? 34 : 38} />
      <span style={s.body}>
        <span style={{ ...s.title, fontWeight: item.read ? 500 : 700 }}>{item.title}</span>
        {item.body && <span style={{ ...s.text, WebkitLineClamp: compact ? 2 : 3 }}>{item.body}</span>}
        <span style={s.meta}>
          <span style={{ color }}>{GROUP_META[item.group].label}</span>
          <span aria-hidden="true">·</span>
          <RelativeTime iso={item.createdAt} />
          {item.href && item.ctaLabel && !compact && (
            <span style={s.cta}>{item.ctaLabel} <CaretRight size={11} weight="bold" /></span>
          )}
        </span>
      </span>
      {!item.read && <span style={s.dot} aria-label="Non lue" />}
    </>
  )
  const style: React.CSSProperties = {
    ...s.row,
    padding: compact ? '11px 14px' : '14px 16px',
    background: item.read ? 'transparent' : 'color-mix(in srgb, var(--accent-text) 5%, transparent)',
  }
  return item.href ? (
    <Link href={item.href} onClick={() => onOpen(item)} style={style} className="notif-row">{content}</Link>
  ) : (
    <button type="button" onClick={() => onOpen(item)} style={{ ...style, border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }} className="notif-row">{content}</button>
  )
}

const s: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex', alignItems: 'flex-start', gap: 12, textDecoration: 'none', color: 'inherit',
    borderRadius: 12, fontFamily: 'inherit', position: 'relative',
  },
  body: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 },
  title: { fontSize: 13.5, color: 'var(--text)', lineHeight: 1.35 },
  text: {
    fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5,
    display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden',
  } as React.CSSProperties,
  meta: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 },
  cta: { display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 'auto', color: 'var(--accent-text)', fontWeight: 700 },
  dot: { width: 8, height: 8, borderRadius: 99, background: 'var(--accent-text)', flexShrink: 0, marginTop: 6 },
}
