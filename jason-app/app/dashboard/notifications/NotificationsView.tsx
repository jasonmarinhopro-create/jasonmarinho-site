'use client'

// Page Notifications (refonte 29/09/2026). Un seul fil : alertes de l'app,
// Questions & réponses et nouveautés, classé par jour (heure de Paris), filtré
// par thème. À droite au-delà de ~1200 px : ce qui est en attente par thème et
// ce que l'app signale. Aucune notification n'est marquée lue à l'ouverture :
// seulement au clic, ou avec « Tout marquer comme lu ».
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Checks, CheckCircle, EnvelopeSimple } from '@phosphor-icons/react/dist/ssr'
import HubHero, { HeroEm, heroCard } from '@/components/dashboard/HubHero'
import InlineStyle from '@/components/ui/InlineStyle'
import FeedRow, { GroupIcon } from '@/components/notifications/FeedRow'
import { Card, ui } from '../finances/_ui/ui'
import { markFeedRead, markAllNotificationsRead } from '@/lib/notifications/actions'
import {
  bucketize, BUCKET_LABEL, countByGroup, GROUP_META, GROUP_ORDER,
  type FeedItem, type NotifGroup,
} from '@/lib/notifications/present'

const RULES_THROTTLE_MS = 15 * 60 * 1000
const RULES_THROTTLE_KEY = 'notif-rules-last-run'

type Filter = 'all' | 'unread' | NotifGroup

/** Ce que l'app signale, par thème (texte de la colonne de droite) */
const WHAT: Record<NotifGroup, string> = {
  reservations: 'Nouvelle réservation Airbnb, Booking ou Vrbo, dates modifiées, annulation, arrivée demain.',
  paiements: 'Contrat signé, contrat pas encore signé à 7 jours de l\'arrivée, loyer payé, caution bloquée, à libérer ou expirée.',
  voyageurs: 'Check-in en ligne rempli ou modifié, accompagnant ajouté.',
  menage: 'Ménage marqué terminé par ton équipe, avec ses photos.',
  compte: 'Calendrier qui ne se synchronise plus, inscription Stripe à terminer, plafonds fiscaux proches.',
  questions: 'Réponse à ta question, mention, réponse retenue.',
  nouveautes: 'Les nouveautés de l\'app qui changent ton quotidien.',
}

function parseFilter(raw: string | null): Filter {
  if (raw === 'unread' || raw === 'all') return raw
  if (raw && (GROUP_ORDER as string[]).includes(raw)) return raw as NotifGroup
  return 'all'
}

export default function NotificationsView({ items: initial, today, initialFilter }: {
  items: FeedItem[]
  today: string
  initialFilter: string | null
}) {
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [filter, setFilter] = useState<Filter>(parseFilter(initialFilter))
  useEffect(() => { setItems(initial) }, [initial])

  // Règles en tâche de fond, puis rafraîchissement s'il y a du nouveau
  useEffect(() => {
    let last = 0
    try { last = Number(sessionStorage.getItem(RULES_THROTTLE_KEY) ?? 0) } catch { /* navigation privée */ }
    if (Date.now() - last < RULES_THROTTLE_MS) return
    try { sessionStorage.setItem(RULES_THROTTLE_KEY, String(Date.now())) } catch { /* navigation privée */ }
    fetch('/api/notifications/run-rules', { method: 'POST' })
      .then(r => r.ok ? r.json() : null)
      .then(res => { if (res?.total > 0) { router.refresh(); window.dispatchEvent(new Event('notif-refresh-count')) } })
      .catch(() => null)
  }, [router])

  const unreadByGroup = useMemo(() => countByGroup(items), [items])
  const totalByGroup = useMemo(() => countByGroup(items, false), [items])
  const unread = items.filter(i => !i.read).length

  const shown = useMemo(() => items.filter(i =>
    filter === 'all' ? true : filter === 'unread' ? !i.read : i.group === filter), [items, filter])
  const sections = bucketize(shown, today)

  function choose(f: Filter) {
    setFilter(f)
    const url = f === 'all' ? '/dashboard/notifications' : `/dashboard/notifications?filtre=${f}`
    window.history.replaceState(null, '', url)
  }

  function markRead(targets: FeedItem[]) {
    const todo = targets.filter(i => !i.read)
    if (todo.length === 0) return
    const keys = new Set(todo.map(i => i.key))
    setItems(prev => prev.map(i => keys.has(i.key) ? { ...i, read: true } : i))
    window.dispatchEvent(new CustomEvent('notif-count-delta', { detail: {
      app: -todo.filter(i => i.source === 'app').length, qr: -todo.filter(i => i.source === 'qr').length,
    } }))
    markFeedRead(todo.map(i => i.key)).then(res => {
      if (!res.ok) { setItems(initial); window.dispatchEvent(new Event('notif-refresh-count')) }
      else if (todo.some(i => i.source === 'changelog')) window.dispatchEvent(new Event('notif-refresh-count'))
    })
  }

  function markAll() {
    setItems(prev => prev.map(i => ({ ...i, read: true })))
    window.dispatchEvent(new CustomEvent('notif-count-changed', { detail: { appNotifUnread: 0, chezNousUnread: 0 } }))
    markAllNotificationsRead().then(res => { if (!res.ok) setItems(initial); router.refresh() })
  }

  const groupsWithItems = GROUP_ORDER.filter(g => totalByGroup[g] > 0)

  return (
    <div style={ui.page}>
      <InlineStyle css={`
        .notif-row:hover { background: var(--surface) !important }
        .notif-row:focus-visible { outline: 2px solid var(--accent-text); outline-offset: -2px }
        .notif-chip:hover { border-color: var(--accent-border) !important }
        @media (max-width: 720px) { .notif-chips { flex-wrap: nowrap !important; overflow-x: auto; margin-left: -4px; margin-right: -4px; padding: 0 4px 4px; scrollbar-width: none } .notif-chip { flex-shrink: 0 } }
      `} />
      <HubHero
        eyebrowIcon={<Bell size={14} weight="fill" />}
        eyebrow="Notifications"
        title={<>Ce qui s&apos;est passé, <HeroEm>au même endroit</HeroEm></>}
        desc="Réservations, contrats, paiements, voyageurs, ménage et réponses à tes questions. Chaque notification t'emmène sur la page qui la traite."
        aside={
          <div style={{ ...heroCard, width: '100%' }}>
            <div style={s.asideTitle}>{unread > 0 ? 'À lire' : 'Tout est lu'}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <strong style={s.big}>{unread}</strong>
              <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>non lue{unread > 1 ? 's' : ''}</span>
            </div>
            {unread > 0 ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {GROUP_ORDER.filter(g => unreadByGroup[g] > 0).map(g => (
                    <button key={g} type="button" onClick={() => choose(g)} style={s.asideRow}>
                      <GroupIcon group={g} size={24} />
                      <span style={{ flex: 1 }}>{GROUP_META[g].label}</span>
                      <strong style={{ color: 'var(--text)' }}>{unreadByGroup[g]}</strong>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={markAll} style={s.markAll}><Checks size={15} weight="bold" /> Tout marquer comme lu</button>
              </>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>Rien de neuf depuis ta dernière visite.</span>
            )}
          </div>
        }
      />

      <div style={s.cols}>
        <div style={{ flex: '1 1 620px', minWidth: 0 }}>
          <div style={s.chips} className="notif-chips" role="tablist" aria-label="Filtrer les notifications">
            <Chip on={filter === 'all'} onClick={() => choose('all')} label="Toutes" n={items.length} />
            <Chip on={filter === 'unread'} onClick={() => choose('unread')} label="Non lues" n={unread} />
            {groupsWithItems.map(g => (
              <Chip key={g} on={filter === g} onClick={() => choose(g)} label={GROUP_META[g].label} n={totalByGroup[g]} color={GROUP_META[g].color} />
            ))}
          </div>

          <Card style={{ padding: 8 }}>
            {shown.length === 0 ? (
              <div style={s.empty}>
                <span style={s.emptyIcon}><CheckCircle size={24} weight="fill" /></span>
                <strong style={{ fontSize: 15, color: 'var(--text)' }}>{filter === 'unread' ? 'Tout est lu' : 'Rien ici pour l\'instant'}</strong>
                <span style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.55, maxWidth: 420 }}>
                  {filter === 'all'
                    ? 'Dès qu\'une réservation arrive, qu\'un voyageur signe ou paie, ou qu\'on te répond, tu le verras ici.'
                    : 'Aucune notification dans ce filtre.'}
                </span>
              </div>
            ) : sections.map(sec => (
              <section key={sec.bucket} style={{ marginBottom: 6 }}>
                <div style={s.section}>
                  <span>{BUCKET_LABEL[sec.bucket]}</span>
                  {sec.items.some(i => !i.read) && (
                    <button type="button" onClick={() => markRead(sec.items)} style={s.sectionBtn}>Marquer comme lu</button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {sec.items.map(it => <FeedRow key={it.key} item={it} onOpen={i => markRead([i])} />)}
                </div>
              </section>
            ))}
          </Card>
        </div>

        <aside style={{ flex: '0 1 340px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <div style={s.sideTitle}>Ce que l&apos;app te signale</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
              {GROUP_ORDER.map(g => (
                <div key={g} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <GroupIcon group={g} size={28} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{GROUP_META[g].label}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>{WHAT[g]}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--accent-text)', marginTop: 2 }}><EnvelopeSimple size={18} weight="fill" /></span>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 }}>
                Contrat signé, paiement reçu, check-in rempli et réponse à ta question t&apos;arrivent aussi par e-mail. Les nouvelles réservations Airbnb et Booking sont repérées à chaque synchronisation du calendrier.
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function Chip({ on, onClick, label, n, color }: { on: boolean; onClick: () => void; label: string; n: number; color?: string }) {
  return (
    <button type="button" role="tab" aria-selected={on} onClick={onClick} className="notif-chip"
      style={{ ...s.chip, ...(on ? s.chipOn : {}) }}>
      {color && <span style={{ width: 8, height: 8, borderRadius: 99, background: color }} aria-hidden="true" />}
      {label}
      <span style={{ ...s.chipN, ...(on ? { color: 'var(--accent-text)' } : {}) }}>{n}</span>
    </button>
  )
}

const s: Record<string, React.CSSProperties> = {
  asideTitle: { fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  big: { fontFamily: 'var(--font-fraunces), serif', fontSize: 34, color: 'var(--text)', lineHeight: 1 },
  asideRow: { display: 'flex', alignItems: 'center', gap: 9, padding: '5px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, color: 'var(--text-2)', textAlign: 'left' },
  markAll: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6, padding: '9px 14px', borderRadius: 10, border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
  cols: { display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' },
  chips: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 99, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  chipOn: { border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  chipN: { fontSize: 12, color: 'var(--text-3)', fontWeight: 700 },
  section: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '12px 12px 6px', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--text-3)' },
  sectionBtn: { border: 'none', background: 'none', color: 'var(--accent-text)', fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'none', letterSpacing: 0 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8, padding: '48px 24px' },
  emptyIcon: { width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-text)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', marginBottom: 4 },
  sideTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 17, color: 'var(--text)' },
}
