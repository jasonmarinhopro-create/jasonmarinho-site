'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  WarningOctagon, ChatCircleDots, Lightbulb, CheckCircle, XCircle, ArrowLeft, Lifebuoy,
} from '@phosphor-icons/react/dist/ssr'
import { updateSOSFeedbackStatus } from '@/app/actions/sos-feedback'

interface FeedbackItem {
  id: string
  user_email: string | null
  user_name: string | null
  scenario: string
  channel: string
  feedback_type: 'error' | 'testimony' | 'suggestion'
  message: string
  status: 'pending' | 'approved' | 'rejected' | 'done'
  admin_note: string | null
  created_at: string
  updated_at: string
}

const TYPE_LABELS: Record<FeedbackItem['feedback_type'], string> = {
  error: 'Erreur',
  testimony: 'Témoignage',
  suggestion: 'Suggestion',
}

const TYPE_ICONS: Record<FeedbackItem['feedback_type'], typeof WarningOctagon> = {
  error: WarningOctagon,
  testimony: ChatCircleDots,
  suggestion: Lightbulb,
}

const TYPE_COLORS: Record<FeedbackItem['feedback_type'], string> = {
  error: 'var(--danger)',
  testimony: '#2563eb',
  suggestion: '#d97706',
}

const STATUS_LABELS: Record<FeedbackItem['status'], string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
  done: 'Traité',
}

const CHANNEL_LABELS: Record<string, string> = {
  airbnb: 'Airbnb',
  booking: 'Booking',
  vrbo: 'Vrbo',
  direct: 'Direct',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

type StatusFilter = 'all' | FeedbackItem['status']
type TypeFilter = 'all' | FeedbackItem['feedback_type']

export default function SOSFeedbackAdmin({ items: initial }: { items: FeedbackItem[] }) {
  const [items, setItems] = useState<FeedbackItem[]>(initial)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ id: string; msg: string; ok: boolean } | null>(null)

  function notify(id: string, msg: string, ok: boolean) {
    setFeedback({ id, msg, ok })
    setTimeout(() => setFeedback(null), 2500)
  }

  function setStatus(id: string, newStatus: FeedbackItem['status']) {
    const prev = items
    setItems(p => p.map(it => it.id === id ? { ...it, status: newStatus } : it))
    startTransition(async () => {
      const res = await updateSOSFeedbackStatus({ id, status: newStatus })
      if (res.error) {
        setItems(prev)
        notify(id, res.error, false)
      } else {
        notify(id, `Statut mis à jour : ${STATUS_LABELS[newStatus]}`, true)
      }
    })
  }

  const filtered = items.filter(it => {
    if (statusFilter !== 'all' && it.status !== statusFilter) return false
    if (typeFilter !== 'all' && it.feedback_type !== typeFilter) return false
    return true
  })

  const counts = {
    pending: items.filter(i => i.status === 'pending').length,
    approved: items.filter(i => i.status === 'approved').length,
    rejected: items.filter(i => i.status === 'rejected').length,
    done: items.filter(i => i.status === 'done').length,
  }

  return (
    <div style={s.wrap}>
      <Link href="/dashboard/admin" style={s.backLink}>
        <ArrowLeft size={14} weight="bold" />
        Retour à l&apos;admin
      </Link>

      <div style={s.header}>
        <div style={s.badge}>
          <Lifebuoy size={12} weight="fill" />
          SOS Hôte
        </div>
        <h1 style={s.title}>Feedback communauté</h1>
        <p style={s.subtitle}>
          Signalements, témoignages et suggestions envoyés par les hôtes sur les scénarios SOS.
        </p>
      </div>

      <div style={s.filters}>
        <div style={s.filterGroup}>
          <span style={s.filterLabel}>Statut</span>
          {(['all', 'pending', 'approved', 'rejected', 'done'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                ...s.chip,
                ...(statusFilter === st ? s.chipActive : {}),
              }}
            >
              {st === 'all' ? 'Tous' : STATUS_LABELS[st]}
              {st !== 'all' && counts[st] > 0 && (
                <span style={s.chipCount}>{counts[st]}</span>
              )}
            </button>
          ))}
        </div>

        <div style={s.filterGroup}>
          <span style={s.filterLabel}>Type</span>
          {(['all', 'error', 'testimony', 'suggestion'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                ...s.chip,
                ...(typeFilter === t ? s.chipActive : {}),
              }}
            >
              {t === 'all' ? 'Tous' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>
          Aucun feedback ne correspond aux filtres actuels.
        </div>
      ) : (
        <div style={s.list}>
          {filtered.map(item => {
            const Icon = TYPE_ICONS[item.feedback_type]
            const color = TYPE_COLORS[item.feedback_type]
            const fb = feedback?.id === item.id ? feedback : null
            return (
              <div key={item.id} style={s.card}>
                <div style={s.cardHead}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '3px 8px', borderRadius: '999px',
                      background: `${color}15`, color, fontSize: '11px', fontWeight: 600,
                    }}>
                      <Icon size={12} weight="fill" />
                      {TYPE_LABELS[item.feedback_type]}
                    </div>
                    <span style={s.metaSep}>·</span>
                    <Link href={`/dashboard/sos/${item.scenario}?canal=${item.channel}`} style={s.scenarioLink}>
                      {item.scenario}
                    </Link>
                    <span style={s.metaSep}>·</span>
                    <span style={s.metaText}>{CHANNEL_LABELS[item.channel] ?? item.channel}</span>
                  </div>
                  <span style={{ ...s.statusBadge, ...statusStyle(item.status) }}>
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>

                <div style={s.message}>{item.message}</div>

                <div style={s.cardFoot}>
                  <div style={s.from}>
                    De <strong>{item.user_name ?? 'Anonyme'}</strong>
                    {item.user_email && (
                      <span style={s.email}> · {item.user_email}</span>
                    )}
                    <span style={s.date}> · {formatDate(item.created_at)}</span>
                  </div>
                  <div style={s.actions}>
                    {item.status !== 'approved' && (
                      <button
                        onClick={() => setStatus(item.id, 'approved')}
                        disabled={isPending}
                        style={{ ...s.actionBtn, ...s.actionApprove }}
                      >
                        <CheckCircle size={13} weight="bold" /> Approuver
                      </button>
                    )}
                    {item.status !== 'rejected' && (
                      <button
                        onClick={() => setStatus(item.id, 'rejected')}
                        disabled={isPending}
                        style={{ ...s.actionBtn, ...s.actionReject }}
                      >
                        <XCircle size={13} weight="bold" /> Rejeter
                      </button>
                    )}
                    {item.status !== 'done' && (
                      <button
                        onClick={() => setStatus(item.id, 'done')}
                        disabled={isPending}
                        style={{ ...s.actionBtn, ...s.actionDone }}
                      >
                        Marquer traité
                      </button>
                    )}
                    {item.status !== 'pending' && (
                      <button
                        onClick={() => setStatus(item.id, 'pending')}
                        disabled={isPending}
                        style={{ ...s.actionBtn, ...s.actionReset }}
                      >
                        Remettre en attente
                      </button>
                    )}
                  </div>
                </div>

                {fb && (
                  <div style={{
                    ...s.notif,
                    background: fb.ok ? 'rgba(16,185,129,0.10)' : 'rgba(220,38,38,0.10)',
                    color: fb.ok ? '#059669' : 'var(--danger)',
                    borderColor: fb.ok ? 'rgba(16,185,129,0.30)' : 'rgba(220,38,38,0.30)',
                  }}>
                    {fb.msg}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function statusStyle(status: FeedbackItem['status']): React.CSSProperties {
  const map: Record<FeedbackItem['status'], React.CSSProperties> = {
    pending: { background: 'rgba(217,119,6,0.10)', color: '#b45309', borderColor: 'rgba(217,119,6,0.25)' },
    approved: { background: 'rgba(16,185,129,0.10)', color: '#059669', borderColor: 'rgba(16,185,129,0.25)' },
    rejected: { background: 'rgba(220,38,38,0.10)', color: 'var(--danger)', borderColor: 'rgba(220,38,38,0.25)' },
    done: { background: 'var(--accent-bg)', color: 'var(--accent-text)', borderColor: 'var(--accent-border)' },
  }
  return map[status]
}

const s: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: '1600px', margin: '0 auto', width: '100%' },
  backLink: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '12.5px', color: 'var(--text-3)',
    textDecoration: 'none',
    marginBottom: '14px',
  },
  header: { marginBottom: '24px' },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '10.5px', fontWeight: 700,
    letterSpacing: '0.6px', textTransform: 'uppercase' as const,
    color: 'var(--danger)',
    background: 'rgba(220,38,38,0.10)',
    border: '1px solid rgba(220,38,38,0.25)',
    borderRadius: '999px',
    padding: '3px 9px',
    marginBottom: '10px',
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(24px, 3vw, 30px)',
    fontWeight: 400, color: 'var(--text)',
    margin: '0 0 8px', letterSpacing: '-0.4px',
  },
  subtitle: {
    fontSize: '14px', color: 'var(--text-2)',
    margin: 0, lineHeight: 1.55,
  },

  filters: {
    display: 'flex', flexDirection: 'column' as const, gap: '12px',
    padding: '14px 16px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  filterGroup: {
    display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center', gap: '6px',
  },
  filterLabel: {
    fontSize: '11px', fontWeight: 600,
    letterSpacing: '0.5px', textTransform: 'uppercase' as const,
    color: 'var(--text-3)', marginRight: '6px',
  },
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '5px 11px', borderRadius: '999px',
    border: '1px solid var(--border-2)',
    background: 'var(--bg)',
    color: 'var(--text-2)',
    fontSize: '12px', fontFamily: 'inherit', cursor: 'pointer',
  },
  chipActive: {
    background: 'var(--accent-bg-2)',
    borderColor: 'var(--accent-border-2)',
    color: 'var(--accent-text)',
    fontWeight: 600,
  },
  chipCount: {
    background: 'var(--accent-text)',
    color: 'var(--bg)',
    fontSize: '10px', fontWeight: 700,
    padding: '1px 6px', borderRadius: '999px',
    marginLeft: '2px',
  },

  empty: {
    padding: '40px 20px',
    textAlign: 'center' as const,
    background: 'var(--surface)',
    border: '1px dashed var(--border-2)',
    borderRadius: '14px',
    color: 'var(--text-3)',
    fontSize: '13.5px',
  },

  list: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  card: {
    padding: '16px 18px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
  },
  cardHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    gap: '10px', flexWrap: 'wrap' as const,
    marginBottom: '12px',
  },
  scenarioLink: {
    color: 'var(--accent-text)',
    fontSize: '12.5px', fontWeight: 600,
    textDecoration: 'none',
  },
  metaSep: { color: 'var(--text-3)', fontSize: '12px' },
  metaText: { color: 'var(--text-3)', fontSize: '12px' },
  statusBadge: {
    fontSize: '10.5px', fontWeight: 700,
    letterSpacing: '0.5px', textTransform: 'uppercase' as const,
    padding: '3px 9px', borderRadius: '999px',
    border: '1px solid',
    flexShrink: 0,
  },

  message: {
    fontSize: '13.5px', color: 'var(--text-2)',
    lineHeight: 1.6,
    background: 'var(--bg-2)',
    padding: '12px 14px', borderRadius: '8px',
    whiteSpace: 'pre-wrap' as const,
    marginBottom: '12px',
  },

  cardFoot: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', gap: '10px',
    flexWrap: 'wrap' as const,
  },
  from: {
    fontSize: '12px', color: 'var(--text-3)',
  },
  email: { color: 'var(--text-3)' },
  date: { color: 'var(--text-3)' },
  actions: {
    display: 'flex', gap: '6px', flexWrap: 'wrap' as const,
  },
  actionBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '6px 11px', borderRadius: '7px',
    border: '1px solid', fontSize: '11.5px', fontWeight: 600,
    fontFamily: 'inherit', cursor: 'pointer',
  },
  actionApprove: {
    background: 'rgba(16,185,129,0.08)',
    borderColor: 'rgba(16,185,129,0.30)',
    color: '#059669',
  },
  actionReject: {
    background: 'rgba(220,38,38,0.08)',
    borderColor: 'rgba(220,38,38,0.30)',
    color: 'var(--danger)',
  },
  actionDone: {
    background: 'var(--accent-bg)',
    borderColor: 'var(--accent-border)',
    color: 'var(--accent-text)',
  },
  actionReset: {
    background: 'transparent',
    borderColor: 'var(--border-2)',
    color: 'var(--text-3)',
  },

  notif: {
    marginTop: '12px',
    padding: '8px 12px', borderRadius: '8px',
    border: '1px solid',
    fontSize: '12px',
  },
}
