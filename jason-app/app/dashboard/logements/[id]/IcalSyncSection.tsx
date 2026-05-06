'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowsClockwise, CheckCircle, Warning, CalendarBlank, Link as LinkIcon } from '@phosphor-icons/react/dist/ssr'
import type { LogementIcalFeedStatus } from '../actions'
import { syncLogementIcalFeeds } from '../actions'

interface Props {
  logementId: string
  status: LogementIcalFeedStatus[]
}

const SOURCE_BG: Record<string, string> = {
  airbnb:  'rgba(255,90,95,0.10)',
  booking: 'rgba(0,59,149,0.10)',
  vrbo:    'rgba(255,199,44,0.12)',
  autre:   'rgba(99,102,241,0.10)',
}

const SOURCE_FG: Record<string, string> = {
  airbnb:  '#FF5A5F',
  booking: '#3b82f6',
  vrbo:    '#d97706',
  autre:   '#6366f1',
}

function fmtRelative(iso: string | null): string {
  if (!iso) return 'Jamais synchronisé'
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'À l\'instant'
  if (min < 60) return `Il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Il y a ${h}h`
  const days = Math.floor(h / 24)
  if (days < 7) return `Il y a ${days}j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function IcalSyncSection({ logementId, status }: Props) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [feedback, setFeedback] = useState<{ ok?: string; err?: string } | null>(null)

  if (status.length === 0) {
    return (
      <div style={section}>
        <div style={sectionHeader}>
          <h3 style={sectionTitle}>
            <CalendarBlank size={15} weight="fill" />
            Synchronisation calendrier
          </h3>
        </div>
        <div style={emptyBox}>
          <LinkIcon size={20} weight="duotone" color="var(--text-muted)" />
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500, marginBottom: '4px' }}>
              Aucune URL iCal configurée
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>
              Ajoute le lien iCal de ton annonce Airbnb, Booking ou Vrbo via{' '}
              <span style={{ color: 'var(--accent-text)', fontWeight: 500 }}>« Modifier la fiche »</span>{' '}
              pour importer automatiquement les dates réservées.
            </div>
          </div>
        </div>
      </div>
    )
  }

  async function handleSyncAll() {
    setSyncing(true)
    setFeedback(null)
    const res = await syncLogementIcalFeeds(logementId)
    if (res.error) {
      setFeedback({ err: res.error })
    } else if (res.errors.length > 0) {
      setFeedback({ err: res.errors.join(' · ') })
    } else {
      setFeedback({ ok: `${res.synced} événement${res.synced > 1 ? 's' : ''} importé${res.synced > 1 ? 's' : ''}` })
    }
    setSyncing(false)
    router.refresh()
    setTimeout(() => setFeedback(null), 4500)
  }

  return (
    <div style={section}>
      <div style={sectionHeader}>
        <h3 style={sectionTitle}>
          <CalendarBlank size={15} weight="fill" />
          Synchronisation calendrier
        </h3>
        <button
          type="button"
          onClick={handleSyncAll}
          disabled={syncing}
          style={{
            ...syncBtn,
            opacity: syncing ? 0.6 : 1,
            cursor: syncing ? 'wait' : 'pointer',
          }}
        >
          <ArrowsClockwise
            size={12}
            weight="bold"
            style={syncing ? { animation: 'spin 0.8s linear infinite' } : undefined}
          />
          {syncing ? 'Synchronisation…' : 'Synchroniser maintenant'}
        </button>
      </div>

      <div style={feedsList}>
        {status.map(f => {
          const synced = !!f.lastSynced
          return (
            <div key={f.source} style={feedRow}>
              <span style={{
                ...sourceChip,
                background: SOURCE_BG[f.source] ?? 'var(--surface)',
                color: SOURCE_FG[f.source] ?? 'var(--text)',
                borderColor: SOURCE_FG[f.source] ?? 'var(--border)',
              }}>
                {f.label}
              </span>
              <div style={feedInfo}>
                <span style={{
                  ...syncStatus,
                  color: synced ? '#10b981' : 'var(--text-muted)',
                }}>
                  {synced ? <CheckCircle size={11} weight="fill" /> : <Warning size={11} weight="fill" />}
                  {fmtRelative(f.lastSynced)}
                </span>
                {synced && (
                  <span style={eventCount}>
                    {f.eventsCount} évén.{f.eventsCount > 1 ? '' : ''}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {feedback?.ok && (
        <div style={feedbackOk}>
          <CheckCircle size={12} weight="fill" />
          {feedback.ok}
        </div>
      )}
      {feedback?.err && (
        <div style={feedbackErr}>
          <Warning size={12} weight="fill" />
          {feedback.err}
        </div>
      )}

      <p style={hint}>
        Les dates sont importées automatiquement à chaque sauvegarde. La synchro n&apos;est pas
        temps réel : utilisez « Synchroniser » avant de proposer un créneau à un client.
      </p>

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const section: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border-2)',
  borderRadius: '14px',
  padding: '18px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

const sectionHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
}

const sectionTitle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  fontFamily: 'var(--font-fraunces), serif',
  fontSize: '15px',
  fontWeight: 500,
  color: 'var(--text)',
  margin: 0,
}

const syncBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--bg)',
  background: 'var(--accent-text)',
  border: 'none',
  borderRadius: '8px',
  fontFamily: 'inherit',
  transition: 'opacity 0.15s ease',
}

const feedsList: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const feedRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 12px',
  background: 'var(--bg-2)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  fontSize: '13px',
}

const sourceChip: React.CSSProperties = {
  fontSize: '11.5px',
  fontWeight: 600,
  padding: '3px 9px',
  borderRadius: '999px',
  border: '1px solid',
  whiteSpace: 'nowrap',
}

const feedInfo: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginLeft: 'auto',
  fontSize: '12px',
  color: 'var(--text-2)',
}

const syncStatus: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  fontWeight: 500,
}

const eventCount: React.CSSProperties = {
  padding: '2px 7px',
  background: 'var(--surface)',
  borderRadius: '6px',
  fontSize: '11.5px',
  fontWeight: 500,
  color: 'var(--text)',
}

const emptyBox: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  padding: '14px',
  background: 'var(--bg-2)',
  border: '1px dashed var(--border)',
  borderRadius: '10px',
  alignItems: 'flex-start',
}

const feedbackOk: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '7px 11px',
  fontSize: '12px',
  fontWeight: 500,
  color: '#10b981',
  background: 'rgba(16,185,129,0.08)',
  border: '1px solid rgba(16,185,129,0.2)',
  borderRadius: '8px',
}

const feedbackErr: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '7px 11px',
  fontSize: '12px',
  fontWeight: 500,
  color: '#ef4444',
  background: 'rgba(239,68,68,0.08)',
  border: '1px solid rgba(239,68,68,0.2)',
  borderRadius: '8px',
}

const hint: React.CSSProperties = {
  fontSize: '11.5px',
  color: 'var(--text-muted)',
  lineHeight: 1.5,
  margin: 0,
}
