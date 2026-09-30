'use client'

// Panneau de la cloche (refonte 29/09/2026, demande de Jason : « la partie
// notification doit être 100 % revue »). Avant : 3 onglets (alertes limitées
// à 4 non lues sans date, nouveautés de juin, et un simple compteur pour
// Entre Hôtes sans les messages), emojis, bleu et rouge codés en dur.
// Maintenant : un seul fil (alertes de l'app, Questions & réponses,
// nouveautés), classé par jour à l'heure de Paris, chaque ligne mène à la
// page qui la traite et se marque lue au clic.
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { X, CheckCircle, ArrowRight, Checks } from '@phosphor-icons/react/dist/ssr'
import InlineStyle from '@/components/ui/InlineStyle'
import FeedRow from '@/components/notifications/FeedRow'
import { markFeedRead, markAllNotificationsRead } from '@/lib/notifications/actions'
import { bucketize, BUCKET_LABEL, type FeedItem } from '@/lib/notifications/present'

// Les règles (arrivée demain, contrat à signer…) coûtent plusieurs requêtes :
// au plus une fois toutes les 15 min par onglet, en tâche de fond.
const RULES_THROTTLE_MS = 15 * 60 * 1000
const RULES_THROTTLE_KEY = 'notif-rules-last-run'
const PANEL_LIMIT = 20

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
  /** Nombre total de non lues (badge de la cloche) */
  totalUnread: number
  /** Nouveautés de l'app vues (le Header garde leur compteur) */
  onNewsSeen: () => void
}

type Filter = 'all' | 'unread'

function broadcast(delta: { app?: number; qr?: number }) {
  window.dispatchEvent(new CustomEvent('notif-count-delta', { detail: delta }))
}

export default function NotificationPanel({ open, onClose, totalUnread, onNewsSeen }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<FeedItem[]>([])
  const [today, setToday] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')

  const fetchFeed = useCallback(() =>
    fetch(`/api/notifications/list?limit=${PANEL_LIMIT}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j) { setItems(j.items ?? []); setToday(j.today ?? '') } })
      .catch(() => {}), [])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetchFeed().finally(() => setLoading(false))
    let lastRun = 0
    try { lastRun = Number(sessionStorage.getItem(RULES_THROTTLE_KEY) ?? 0) } catch { /* navigation privée */ }
    if (Date.now() - lastRun < RULES_THROTTLE_MS) return
    try { sessionStorage.setItem(RULES_THROTTLE_KEY, String(Date.now())) } catch { /* navigation privée */ }
    fetch('/api/notifications/run-rules', { method: 'POST' })
      .then(r => r.ok ? r.json() : null)
      .then(res => { if (res?.total > 0) { fetchFeed(); window.dispatchEvent(new Event('notif-refresh-count')) } })
      .catch(() => null)
  }, [open, fetchFeed])

  // Fermeture : clic extérieur, Échap
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (panelRef.current && !panelRef.current.contains(t) && !t.closest?.('[data-notif-bell]')) onClose()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open, onClose])

  function markRead(targets: FeedItem[]) {
    const unread = targets.filter(i => !i.read)
    if (unread.length === 0) return
    const keys = new Set(unread.map(i => i.key))
    setItems(prev => prev.map(i => keys.has(i.key) ? { ...i, read: true } : i))
    broadcast({ app: -unread.filter(i => i.source === 'app').length, qr: -unread.filter(i => i.source === 'qr').length })
    if (unread.some(i => i.source === 'changelog')) onNewsSeen()
    markFeedRead(unread.map(i => i.key)).then(res => {
      if (!res.ok) { fetchFeed(); window.dispatchEvent(new Event('notif-refresh-count')) }
    }).catch(() => { fetchFeed(); window.dispatchEvent(new Event('notif-refresh-count')) })
  }

  function markAll() {
    setItems(prev => prev.map(i => ({ ...i, read: true })))
    window.dispatchEvent(new CustomEvent('notif-count-changed', { detail: { appNotifUnread: 0, chezNousUnread: 0 } }))
    onNewsSeen()
    markAllNotificationsRead().then(res => { if (!res.ok) { fetchFeed(); window.dispatchEvent(new Event('notif-refresh-count')) } })
  }

  if (!open) return null

  const shown = filter === 'unread' ? items.filter(i => !i.read) : items
  const unreadHere = items.filter(i => !i.read).length
  const sections = today ? bucketize(shown, today) : [{ bucket: 'today' as const, items: shown }]

  return (
    <div ref={panelRef} role="dialog" aria-label="Notifications" style={s.panel} className="notif-panel">
      <InlineStyle css={`
        @keyframes notifIn { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: none } }
        .notif-row:hover { background: var(--surface) !important }
        .notif-row:focus-visible { outline: 2px solid var(--accent-text); outline-offset: -2px }
        @media (max-width: 640px) { .notif-long { display: none } .notif-panel { top: calc(var(--header-h, 60px) + 4px) !important; right: 8px !important; left: 8px !important; width: auto !important; max-height: calc(100dvh - var(--header-h, 60px) - 16px) !important } }
      `} />

      <div style={s.head}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={s.title}>Notifications</span>
          {totalUnread > 0 && <span style={s.count}>{totalUnread > 99 ? '99+' : totalUnread} non lue{totalUnread > 1 ? 's' : ''}</span>}
        </div>
        <button type="button" onClick={onClose} style={s.close} aria-label="Fermer"><X size={15} weight="bold" /></button>
      </div>

      <div style={s.toolbar}>
        <div style={s.pills} role="tablist">
          {(['all', 'unread'] as Filter[]).map(f => (
            <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
              style={{ ...s.pill, ...(filter === f ? s.pillOn : {}) }}>
              {f === 'all' ? 'Toutes' : `Non lues${unreadHere ? ` (${unreadHere})` : ''}`}
            </button>
          ))}
        </div>
        {unreadHere > 0 && (
          <button type="button" onClick={markAll} style={s.markAll}><Checks size={14} weight="bold" /> Tout <span className="notif-long">marquer comme </span>lu</button>
        )}
      </div>

      <div style={s.list}>
        {loading && items.length === 0 ? (
          <div style={{ padding: '6px 14px 14px' }}>
            {[0, 1, 2].map(i => <div key={i} style={s.skeleton} />)}
          </div>
        ) : shown.length === 0 ? (
          <div style={s.empty}>
            <span style={s.emptyIcon}><CheckCircle size={22} weight="fill" /></span>
            <strong style={{ color: 'var(--text)', fontSize: 14 }}>Tu es à jour</strong>
            <span style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
              {filter === 'unread' ? 'Aucune notification non lue.' : 'Nouvelles réservations, contrats signés, paiements, check-in et réponses à tes questions arriveront ici.'}
            </span>
          </div>
        ) : sections.map(sec => (
          <div key={sec.bucket}>
            <div style={s.section}>{BUCKET_LABEL[sec.bucket]}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 6px' }}>
              {sec.items.map(it => (
                <FeedRow key={it.key} item={it} compact onOpen={i => { markRead([i]); if (i.href) onClose() }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <Link href="/dashboard/notifications" onClick={onClose} style={s.footer}>
        Voir toutes les notifications <ArrowRight size={13} weight="bold" />
      </Link>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed', top: 'calc(var(--header-h, 60px) + 8px)', right: 16, width: 'min(420px, calc(100vw - 32px))',
    maxHeight: 'min(640px, calc(100vh - var(--header-h, 60px) - 24px))',
    background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: 16,
    boxShadow: '0 18px 48px rgba(0,0,0,0.18)', zIndex: 160, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    animation: 'notifIn 0.18s cubic-bezier(0.16,1,0.3,1)',
  },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '14px 14px 8px 18px' },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 19, color: 'var(--text)' },
  count: { fontSize: 11.5, fontWeight: 700, color: 'var(--accent-text)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 99, padding: '2px 9px', whiteSpace: 'nowrap' },
  close: { width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '4px 14px 10px 14px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)' },
  pills: { display: 'flex', gap: 4 },
  pill: { padding: '6px 11px', borderRadius: 99, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' },
  pillOn: { border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  markAll: { display: 'inline-flex', alignItems: 'center', gap: 5, border: 'none', background: 'none', color: 'var(--accent-text)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', padding: '4px 2px' },
  list: { flex: 1, overflowY: 'auto', paddingBottom: 6, overscrollBehavior: 'contain' },
  section: { fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--text-3)', padding: '12px 18px 6px' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 6, padding: '34px 28px' },
  emptyIcon: { width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-text)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', marginBottom: 4 },
  skeleton: { height: 58, borderRadius: 12, background: 'var(--surface)', marginTop: 8 },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 16px', borderTop: '1px solid var(--border)', color: 'var(--accent-text)', fontSize: 13.5, fontWeight: 700, textDecoration: 'none', background: 'var(--bg-2)' },
}
