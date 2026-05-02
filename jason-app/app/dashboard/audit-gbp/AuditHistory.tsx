'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Trash } from '@phosphor-icons/react/dist/ssr'
import { deleteAuditSession } from './actions'

export interface PastAudit {
  id: string
  started_at: string
  completed_at: string | null
  score_global: number | null
  business_name: string | null
}

interface Props {
  audits: PastAudit[]
}

function scoreColor(score: number): string {
  if (score >= 80) return '#34d399'
  if (score >= 60) return '#d97706'
  if (score >= 40) return '#fb923c'
  return '#ef4444'
}

export default function AuditHistory({ audits }: Props) {
  const router = useRouter()
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (audits.length === 0) return null

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteAuditSession(id)
      if (res.error) {
        alert(res.error)
        setConfirmingId(null)
        return
      }
      setConfirmingId(null)
      router.refresh()
    })
  }

  return (
    <div style={s.history}>
      <h2 style={s.historyTitle}>Tes audits précédents</h2>
      <div style={s.historyList}>
        {audits.map(a => {
          const targetUrl = a.completed_at
            ? `/dashboard/audit-gbp/resultats/${a.id}`
            : `/dashboard/audit-gbp?session=${a.id}`
          const isConfirming = confirmingId === a.id

          return (
            <div key={a.id} style={s.historyItem}>
              <Link href={targetUrl} style={s.historyLink}>
                <div style={s.historyLeft}>
                  <span style={s.historyDate}>
                    {new Date(a.started_at).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'long', year: 'numeric',
                    })}
                  </span>
                  {a.business_name && <span style={s.historyName}>{a.business_name}</span>}
                </div>
                <div style={s.historyRight}>
                  {a.completed_at ? (
                    <span style={{
                      ...s.historyScore,
                      background: scoreColor(a.score_global ?? 0) + '18',
                      color: scoreColor(a.score_global ?? 0),
                    }}>
                      {a.score_global}/100
                    </span>
                  ) : (
                    <span style={s.historyDraft}>Brouillon</span>
                  )}
                  <ArrowRight size={14} color="var(--text-muted)" weight="bold" />
                </div>
              </Link>

              {/* Bouton suppression */}
              {isConfirming ? (
                <div style={s.confirmRow}>
                  <span style={s.confirmText}>Supprimer définitivement ?</span>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    disabled={isPending}
                    style={s.btnGhost}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    disabled={isPending}
                    style={s.btnDanger}
                  >
                    {isPending ? 'Suppression…' : 'Supprimer'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setConfirmingId(a.id) }}
                  style={s.deleteBtn}
                  aria-label="Supprimer cet audit"
                  title="Supprimer cet audit"
                >
                  <Trash size={14} weight="regular" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  history: { marginTop: '20px' },
  historyTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '16px', fontWeight: 500,
    color: 'var(--text)', marginBottom: '12px', marginTop: 0,
  },
  historyList: {
    display: 'flex', flexDirection: 'column' as const, gap: '8px',
  },
  historyItem: {
    display: 'flex', alignItems: 'stretch',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', overflow: 'hidden',
    transition: 'border-color 0.15s',
  },
  historyLink: {
    flex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', textDecoration: 'none',
    minWidth: 0,
  },
  historyLeft: {
    display: 'flex', flexDirection: 'column' as const, gap: '2px',
    minWidth: 0,
  },
  historyDate: {
    fontSize: '13px', fontWeight: 500, color: 'var(--text)',
  },
  historyName: {
    fontSize: '11px', color: 'var(--text-3)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
    maxWidth: '300px',
  },
  historyRight: {
    display: 'flex', alignItems: 'center', gap: '12px',
    flexShrink: 0,
  },
  historyScore: {
    fontSize: '12px', fontWeight: 600,
    padding: '4px 10px', borderRadius: '999px',
  },
  historyDraft: {
    fontSize: '11px', color: 'var(--text-muted)',
    fontStyle: 'italic' as const,
  },

  deleteBtn: {
    background: 'transparent', border: 'none',
    borderLeft: '1px solid var(--border)',
    padding: '0 14px', cursor: 'pointer',
    color: 'var(--text-3)',
    transition: 'color 0.15s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  confirmRow: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 12px',
    background: 'rgba(239,68,68,0.05)',
    borderLeft: '1px solid rgba(239,68,68,0.18)',
    flexWrap: 'wrap' as const,
  },
  confirmText: {
    fontSize: '12px', color: 'var(--text-2)',
    marginRight: '4px',
  },
  btnGhost: {
    background: 'transparent', color: 'var(--text-2)',
    border: '1px solid var(--border)', borderRadius: '7px',
    padding: '6px 10px', fontSize: '12px',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  btnDanger: {
    background: '#ef4444', color: '#fff',
    border: 'none', borderRadius: '7px',
    padding: '6px 12px', fontSize: '12px', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
}
