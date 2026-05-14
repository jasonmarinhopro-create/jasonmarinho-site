'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BellRinging, ChatCircleDots, Check, At, CheckCircle, Funnel } from '@phosphor-icons/react/dist/ssr'
import { CATEGORIES, type CategoryId } from '@/lib/chez-nous/categories'
import { displayName, displayInitials, colorFromId, formatRelative } from '@/lib/chez-nous/display'
import { markNotifRead, markAllNotifsRead } from './actions'

type NotifType = 'reply' | 'mention' | 'accepted'

type Notif = {
  id: string
  actor_id: string
  type: string
  post_id: string | null
  read_at: string | null
  created_at: string
}

type Props = {
  notifs: Notif[]
  postsMap: Record<string, { title: string; category: string }>
  actorsMap: Record<string, { full_name: string | null; pseudo: string | null }>
  unreadCount: number
}

const FILTERS: { id: 'all' | NotifType; label: string }[] = [
  { id: 'all',      label: 'Tout' },
  { id: 'reply',    label: 'Réponses' },
  { id: 'mention',  label: 'Mentions' },
  { id: 'accepted', label: 'Acceptées' },
]

export default function NotificationsView({ notifs, postsMap, actorsMap, unreadCount }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [filter, setFilter] = useState<'all' | NotifType>('all')

  const handleMarkAll = () => {
    startTransition(async () => {
      await markAllNotifsRead()
      router.refresh()
    })
  }

  const filtered = useMemo(
    () => filter === 'all' ? notifs : notifs.filter(n => n.type === filter),
    [notifs, filter],
  )

  // Compteurs par type pour le badge sur chaque tab
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0, reply: 0, mention: 0, accepted: 0 }
    for (const n of notifs) {
      if (!n.read_at) {
        c.all++
        if (n.type in c) c[n.type]++
      }
    }
    return c
  }, [notifs])

  return (
    <div style={s.page}>
      <Link href="/dashboard/chez-nous" style={s.back}>
        <ArrowLeft size={14} weight="bold" /> Retour à Chez Nous
      </Link>

      <div style={s.head}>
        <div>
          <h1 style={s.title}>
            <BellRinging size={20} color="var(--accent-text)" weight="fill" style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Notifications
          </h1>
          <p style={s.subtitle}>
            {unreadCount > 0
              ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Tu es à jour'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} disabled={pending} style={s.markAllBtn}>
            <Check size={13} weight="bold" /> Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filtres par type */}
      <div style={s.filterRow} className="cn-notif-filters">
        <Funnel size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        {FILTERS.map(f => {
          const active = filter === f.id
          const badge = counts[f.id] ?? 0
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                ...s.filterBtn,
                background: active ? 'var(--accent-bg)' : 'transparent',
                color: active ? 'var(--accent-text)' : 'var(--text-2)',
                borderColor: active ? 'var(--accent-border)' : 'var(--border)',
              }}
            >
              {f.label}
              {badge > 0 && (
                <span style={{
                  ...s.filterBadge,
                  background: active ? 'var(--accent-border)' : 'var(--surface-2)',
                  color: active ? 'var(--accent-text)' : 'var(--text-muted)',
                }}>{badge}</span>
              )}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>
          <ChatCircleDots size={32} color="var(--accent-text)" weight="duotone" />
          <p style={s.emptyTitle}>{notifs.length === 0 ? 'Aucune notification' : 'Aucun résultat pour ce filtre'}</p>
          <p style={s.emptyDesc}>
            {notifs.length === 0
              ? 'Tu seras prévenu ici quand quelqu\'un répondra à un de tes posts, te mentionnera dans Chez Nous, ou acceptera ta réponse.'
              : 'Essaie un autre filtre ou bascule sur "Tout".'}
          </p>
        </div>
      ) : (
        <div style={s.list}>
          {filtered.map(n => (
            <NotifRow
              key={n.id}
              notif={n}
              post={n.post_id ? postsMap[n.post_id] : undefined}
              actor={actorsMap[n.actor_id]}
              actorId={n.actor_id}
            />
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .cn-notif-filters {
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            flex-wrap: nowrap !important;
          }
          .cn-notif-filters::-webkit-scrollbar { display: none; }
        }
      `}</style>
    </div>
  )
}

function notifVerbForType(type: string): { icon: React.ReactNode; text: React.ReactNode; color: string } {
  switch (type) {
    case 'mention':
      return { icon: <At size={11} weight="bold" />, text: <>t'a mentionné</>, color: '#f59e0b' }
    case 'accepted':
      return { icon: <CheckCircle size={11} weight="fill" />, text: <>a accepté ta réponse</>, color: '#10b981' }
    case 'reply':
    default:
      return { icon: <ChatCircleDots size={11} weight="fill" />, text: <>a répondu à ton sujet</>, color: 'var(--accent-text)' }
  }
}

function NotifRow({ notif, post, actor, actorId }: {
  notif: Notif
  post?: { title: string; category: string }
  actor?: { full_name: string | null; pseudo: string | null }
  actorId: string
}) {
  const [, startTransition] = useTransition()

  const av = colorFromId(actorId)
  const initials = actor ? displayInitials({ pseudo: actor.pseudo, full_name: actor.full_name }) : '?'
  const name     = actor ? displayName({ pseudo: actor.pseudo, full_name: actor.full_name }) : 'Quelqu\'un'

  const onClick = () => {
    if (!notif.read_at) {
      startTransition(async () => {
        await markNotifRead(notif.id)
      })
    }
  }

  const cat = post ? CATEGORIES[post.category as CategoryId] : null
  const isUnread = !notif.read_at
  const verb = notifVerbForType(notif.type)

  if (!post || !notif.post_id) return null

  return (
    <Link
      href={`/dashboard/chez-nous/${notif.post_id}`}
      onClick={onClick}
      style={{
        ...s.row,
        background: isUnread ? 'rgba(255,213,107,0.05)' : 'var(--surface)',
        borderColor:  isUnread ? 'rgba(255,213,107,0.25)' : 'var(--border)',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ ...s.avatar, background: av.bg, color: av.text }}>{initials}</div>
        <span style={{ ...s.typeChip, background: verb.color }} title={notif.type}>
          {verb.icon}
        </span>
      </div>
      <div style={s.body}>
        <div style={s.text}>
          <strong>{name}</strong> {verb.text}
        </div>
        {cat && (
          <div style={s.meta}>
            <span style={{ ...s.catChip, color: cat.color, background: cat.bg }}>{cat.short}</span>
            <span style={s.postTitle}>{post.title}</span>
          </div>
        )}
        <span style={s.time}>{formatRelative(notif.created_at)}</span>
      </div>
      {isUnread && <div style={s.unreadDot} />}
    </Link>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(14px, 3vw, 44px)', width: '100%', maxWidth: '760px' },

  back: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', color: 'var(--text-muted)',
    textDecoration: 'none', marginBottom: '16px',
  },

  head: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '14px', flexWrap: 'wrap', marginBottom: '20px',
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(22px,2.5vw,30px)', fontWeight: 400,
    color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center',
  },
  subtitle: { fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' },
  markAllBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontSize: '12px', fontWeight: 600,
    padding: '7px 14px', borderRadius: '8px', cursor: 'pointer',
  },

  filterRow: {
    display: 'flex', alignItems: 'center', gap: '6px',
    marginBottom: '16px', flexWrap: 'wrap',
    paddingBottom: '4px',
  },
  filterBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', fontWeight: 600,
    padding: '6px 12px', borderRadius: '999px',
    border: '1px solid',
    cursor: 'pointer', fontFamily: 'inherit',
    flexShrink: 0, whiteSpace: 'nowrap' as const,
  },
  filterBadge: {
    fontSize: '10px', fontWeight: 700,
    padding: '1px 6px', borderRadius: '999px',
    minWidth: '18px', textAlign: 'center' as const,
  },

  empty: {
    background: 'var(--surface)', border: '1px dashed var(--border)',
    borderRadius: '14px', padding: '40px 24px', textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
  },
  emptyTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--text)', margin: '8px 0 0' },
  emptyDesc:  { fontSize: '13px', color: 'var(--text-muted)', margin: '0 auto', maxWidth: '380px', lineHeight: 1.6 },

  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  row: {
    display: 'flex', alignItems: 'center', gap: '12px',
    border: '1px solid', borderRadius: '12px', padding: '12px 14px',
    textDecoration: 'none', color: 'inherit',
    transition: 'background 0.15s, border-color 0.15s',
  },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: 700, lineHeight: 1,
    fontFamily: 'var(--font-fraunces), serif',
    flexShrink: 0,
  },
  // Pastille colorée en bas-droite de l'avatar pour visualiser le type
  typeChip: {
    position: 'absolute' as const, bottom: '-2px', right: '-2px',
    width: '16px', height: '16px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', border: '2px solid var(--bg)',
  },
  body: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' },
  text: { fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.4 },
  meta: { display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap', marginTop: '2px' },
  catChip: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.4px',
    textTransform: 'uppercase' as const, padding: '2px 7px', borderRadius: '999px',
  },
  postTitle: {
    fontSize: '13px', fontWeight: 600, color: 'var(--text)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  time: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' },
  unreadDot: {
    width: '8px', height: '8px', borderRadius: '50%',
    background: 'var(--accent-text)', flexShrink: 0,
  },
}
