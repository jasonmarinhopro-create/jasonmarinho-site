'use client'

// État de synchronisation des calendriers Airbnb / Booking / Vrbo d'un
// logement, affiché dans la carte « Calendriers connectés » de la fiche
// (les liens eux-mêmes se modifient dans cette carte, LogementDetail.tsx).

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowsClockwise, CheckCircle, Warning } from '@phosphor-icons/react/dist/ssr'
import type { LogementIcalFeedStatus } from '../actions'
import { syncLogementIcalFeeds } from '../actions'

interface Props {
  logementId: string
  status: LogementIcalFeedStatus[]
}

// Mêmes couleurs de plateforme que le calendrier (lib/ical/calendar-label.ts)
export const SOURCE_FG: Record<string, string> = {
  airbnb:  '#E0475B',
  booking: '#D97706',
  vrbo:    '#8B6D5E',
  autre:   'var(--accent-text)',
}

function fmtRelative(iso: string | null): string {
  if (!iso) return 'Jamais synchronisé'
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'À l\'instant'
  if (min < 60) return `Il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Il y a ${h} h`
  const days = Math.floor(h / 24)
  if (days < 7) return `Il y a ${days} j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Paris' })
}

export default function IcalSyncSection({ logementId, status }: Props) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [feedback, setFeedback] = useState<{ ok?: string; err?: string } | null>(null)

  async function handleSyncAll() {
    setSyncing(true)
    setFeedback(null)
    const res = await syncLogementIcalFeeds(logementId)
    if (res.error) {
      setFeedback({ err: res.error })
    } else if (res.errors.length > 0) {
      setFeedback({ err: res.errors.join(' · ') })
    } else {
      setFeedback({ ok: `${res.synced} date${res.synced > 1 ? 's' : ''} importée${res.synced > 1 ? 's' : ''}` })
    }
    setSyncing(false)
    router.refresh()
    setTimeout(() => setFeedback(null), 4500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={feedsGrid}>
        {status.map(f => {
          const synced = !!f.lastSynced
          const c = SOURCE_FG[f.source] ?? 'var(--accent-text)'
          return (
            <div key={f.source} style={{ ...feedTile, borderColor: `color-mix(in srgb, ${c} 30%, var(--border))` }}>
              <span style={{ ...dot, background: c }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{f.label}</div>
                <div style={{ ...syncStatus, color: synced ? 'var(--accent-text)' : 'var(--text-3)' }}>
                  {synced ? <CheckCircle size={12} weight="fill" /> : <Warning size={12} weight="fill" />}
                  <span suppressHydrationWarning>{fmtRelative(f.lastSynced)}</span>
                  {synced && <span style={{ color: 'var(--text-3)' }}>· {f.eventsCount} date{f.eventsCount > 1 ? 's' : ''}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleSyncAll}
          disabled={syncing}
          style={{ ...syncBtn, opacity: syncing ? 0.6 : 1, cursor: syncing ? 'wait' : 'pointer' }}
        >
          <ArrowsClockwise size={13} weight="bold" style={syncing ? { animation: 'spin 0.8s linear infinite' } : undefined} />
          {syncing ? 'Synchronisation…' : 'Synchroniser maintenant'}
        </button>
        {feedback?.ok && <span style={{ ...fb, color: 'var(--accent-text)' }}><CheckCircle size={13} weight="fill" /> {feedback.ok}</span>}
        {feedback?.err && <span style={{ ...fb, color: 'var(--danger-text)' }}><Warning size={13} weight="fill" /> {feedback.err}</span>}
      </div>
      <p style={hint}>
        Les dates se mettent à jour toutes seules plusieurs fois par jour. Synchronise à la main avant
        de confirmer une réservation en direct.
      </p>
    </div>
  )
}

const feedsGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '8px',
}
const feedTile: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 13px',
  background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px',
}
const dot: React.CSSProperties = { width: '10px', height: '10px', borderRadius: '999px', flexShrink: 0 }
const syncStatus: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', marginTop: '2px', flexWrap: 'wrap' }
const syncBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 13px', fontSize: '12.5px', fontWeight: 600,
  color: 'var(--accent-text)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: '10px',
  fontFamily: 'inherit',
}
const fb: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', fontWeight: 600 }
const hint: React.CSSProperties = { fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5, margin: 0 }
