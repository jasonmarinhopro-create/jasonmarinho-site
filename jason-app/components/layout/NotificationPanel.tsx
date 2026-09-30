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
import { X, CheckCircle, ArrowRight, Checks, DeviceMobile, BellRinging } from '@phosphor-icons/react/dist/ssr'
import InlineStyle from '@/components/ui/InlineStyle'
import FeedRow from '@/components/notifications/FeedRow'
import { markFeedRead, markAllNotificationsRead } from '@/lib/notifications/actions'
import { bucketize, BUCKET_LABEL, type FeedItem } from '@/lib/notifications/present'
import { pushDeviceState, isIos, type PushDeviceState } from '@/lib/notifications/push-client'

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

// Fil gardé en mémoire le temps de la visite (l'en-tête ne se démonte pas
// entre deux pages) : la cloche s'ouvre tout de suite sur le dernier fil
// connu, puis se met à jour. Préchargé au survol / toucher de la cloche et
// une fois la page chargée, pour qu'on n'attende jamais le serveur.
type FeedCache = { items: FeedItem[]; today: string; at: number }
let feedCache: FeedCache | null = null
let inflight: Promise<FeedCache | null> | null = null
const FRESH_MS = 30_000

function loadFeedOnce(): Promise<FeedCache | null> {
  if (inflight) return inflight
  inflight = fetch(`/api/notifications/list?limit=${PANEL_LIMIT}`, { cache: 'no-store' })
    .then(r => r.ok ? r.json() : null)
    .then(j => { if (j) feedCache = { items: j.items ?? [], today: j.today ?? '', at: Date.now() }; return feedCache })
    .catch(() => feedCache)
    .finally(() => { inflight = null })
  return inflight
}

/** Précharge le fil (survol de la cloche, page chargée). Sans effet s'il est frais. */
export function prefetchNotificationFeed() {
  if (feedCache && Date.now() - feedCache.at < FRESH_MS) return
  void loadFeedOnce()
}

/** Le fil a changé côté serveur (compteur différent) : le recharger en arrière-plan. */
export function refreshNotificationFeed() {
  if (!feedCache) return
  feedCache.at = 0
  void loadFeedOnce()
}

const PUSH_HIDE_KEY = 'notif-push-banner-hidden'

function broadcast(delta: { app?: number; qr?: number }) {
  window.dispatchEvent(new CustomEvent('notif-count-delta', { detail: delta }))
}

export default function NotificationPanel({ open, onClose, totalUnread, onNewsSeen }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<FeedItem[]>(() => feedCache?.items ?? [])
  const [today, setToday] = useState<string>(() => feedCache?.today ?? '')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [push, setPush] = useState<PushDeviceState | null>(null)
  const [pushHidden, setPushHidden] = useState(true)

  const fetchFeed = useCallback(() => {
    // Un marquage « lu » local rend le cache périmé : on force le rechargement
    if (feedCache) feedCache.at = 0
    return loadFeedOnce().then(c => { if (c) { setItems(c.items); setToday(c.today) } })
  }, [])

  useEffect(() => {
    if (!open) return
    // Dernier fil connu affiché tout de suite, rechargé en arrière-plan
    if (feedCache) { setItems(feedCache.items); setToday(feedCache.today) }
    else setLoading(true)
    const fresh = feedCache && Date.now() - feedCache.at < FRESH_MS
    if (!fresh) loadFeedOnce().then(c => { if (c) { setItems(c.items); setToday(c.today) } }).finally(() => setLoading(false))
    else setLoading(false)
    try { setPushHidden(localStorage.getItem(PUSH_HIDE_KEY) === '1') } catch { setPushHidden(false) }
    pushDeviceState().then(setPush).catch(() => {})
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
    if (feedCache) feedCache.items = feedCache.items.map(i => keys.has(i.key) ? { ...i, read: true } : i)
    broadcast({ app: -unread.filter(i => i.source === 'app').length, qr: -unread.filter(i => i.source === 'qr').length })
    if (unread.some(i => i.source === 'changelog')) onNewsSeen()
    markFeedRead(unread.map(i => i.key)).then(res => {
      if (!res.ok) { fetchFeed(); window.dispatchEvent(new Event('notif-refresh-count')) }
    }).catch(() => { fetchFeed(); window.dispatchEvent(new Event('notif-refresh-count')) })
  }

  function markAll() {
    setItems(prev => prev.map(i => ({ ...i, read: true })))
    if (feedCache) feedCache.items = feedCache.items.map(i => ({ ...i, read: true }))
    window.dispatchEvent(new CustomEvent('notif-count-changed', { detail: { appNotifUnread: 0, chezNousUnread: 0 } }))
    onNewsSeen()
    markAllNotificationsRead().then(res => { if (!res.ok) { fetchFeed(); window.dispatchEvent(new Event('notif-refresh-count')) } })
  }

  if (!open) return null

  const showPush = !pushHidden && (push === 'off' || push === 'ios-install')
  const phone = typeof navigator !== 'undefined' && (isIos() || /Android/i.test(navigator.userAgent))
  function hidePush() {
    setPushHidden(true)
    try { localStorage.setItem(PUSH_HIDE_KEY, '1') } catch { /* navigation privée */ }
  }

  const shown = filter === 'unread' ? items.filter(i => !i.read) : items
  const unreadHere = items.filter(i => !i.read).length
  const sections = today ? bucketize(shown, today) : [{ bucket: 'today' as const, items: shown }]

  return (
    <div ref={panelRef} role="dialog" aria-label="Notifications" style={s.panel} className="notif-panel">
      <InlineStyle css={`
        @keyframes notifIn { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: none } }
        .notif-row:hover { background: var(--surface) !important }
        .notif-row:focus-visible { outline: 2px solid var(--accent-text); outline-offset: -2px }
        @media (max-width: 640px) { .notif-long { display: none } .notif-panel { top: var(--header-h, 60px) !important; right: 0 !important; left: 0 !important; bottom: 0 !important; width: auto !important; max-height: none !important; border-radius: 16px 16px 0 0 !important; border-left: none !important; border-right: none !important; border-bottom: none !important; animation-name: notifSheet !important } .notif-foot { padding-bottom: calc(10px + env(safe-area-inset-bottom)) !important } }
        @keyframes notifSheet { from { transform: translateY(24px); opacity: 0 } to { transform: none; opacity: 1 } }
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

      {showPush && (
        <div style={s.push}>
          <span style={s.pushIcon}><BellRinging size={17} weight="fill" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.pushTitle}>{push === 'ios-install' ? 'Installe l\'app pour les recevoir sur ton iPhone' : `Reçois-les aussi sur ${phone ? 'ton téléphone' : 'cet appareil'}`}</div>
            <div style={s.pushText}>Nouvelle réservation, contrat signé, paiement : prévenu même app fermée.</div>
            <Link href="/dashboard/notifications#telephone" onClick={onClose} style={s.pushBtn}>
              {push === 'ios-install' ? 'Voir comment faire' : 'Activer les notifications'} <ArrowRight size={13} weight="bold" />
            </Link>
          </div>
          <button type="button" onClick={hidePush} style={s.pushClose} aria-label="Masquer"><X size={13} weight="bold" /></button>
        </div>
      )}

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

      <div style={s.footerRow} className="notif-foot">
        <Link href="/dashboard/notifications" onClick={onClose} style={s.footer}>
          Voir toutes les notifications <ArrowRight size={13} weight="bold" />
        </Link>
        {!showPush && (
          <Link href="/dashboard/notifications#telephone" onClick={onClose} style={s.phone} title="Recevoir les notifications sur ton téléphone">
            <DeviceMobile size={15} weight="bold" /> {push === 'on' ? 'Activé sur ce téléphone' : 'Sur mon téléphone'}
          </Link>
        )}
      </div>
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
  footerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 14px 10px 18px', borderTop: '1px solid var(--border)', background: 'var(--bg-2)', flexWrap: 'wrap' },
  footer: { display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent-text)', fontSize: 13.5, fontWeight: 700, textDecoration: 'none' },
  push: { display: 'flex', gap: 11, alignItems: 'flex-start', margin: '10px 12px 2px', padding: '12px 12px 12px 12px', borderRadius: 14, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' },
  pushIcon: { width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg)', background: 'var(--accent-text)' },
  pushTitle: { fontSize: 13.5, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35 },
  pushText: { fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45, marginTop: 2 },
  pushBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 9, padding: '8px 13px', borderRadius: 10, background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 13, fontWeight: 700, textDecoration: 'none' },
  pushClose: { width: 26, height: 26, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  phone: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 99, border: '1px solid var(--accent-border)', color: 'var(--accent-text)', fontSize: 12, fontWeight: 700, textDecoration: 'none' },
}
