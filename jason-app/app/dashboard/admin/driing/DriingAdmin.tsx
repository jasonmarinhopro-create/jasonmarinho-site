'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  MagnifyingGlass, Check, X, EnvelopeSimple, Funnel,
  Crown, CheckCircle, Clock, User,
} from '@phosphor-icons/react/dist/ssr'
import { confirmDriingMember, rejectDriingMember } from '../actions'
import AdminHero from '../_ui/AdminHero'
import { useConfirm } from '@/components/ui/ConfirmDialog'

interface Member {
  id: string
  email: string
  full_name: string | null
  created_at: string
  driing_status: 'none' | 'pending' | 'confirmed' | null
  plan: 'decouverte' | 'standard' | 'driing' | null
  stripe_customer_id: string | null
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 3600 * 1000))
}

export default function DriingAdmin({ initialMembers }: { initialMembers: Member[] }) {
  const [members, setMembers] = useState(initialMembers)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('pending')
  const [feedback, setFeedback] = useState<{ id: string; type: 'ok' | 'err'; msg: string } | null>(null)
  const [isPending, startT] = useTransition()
  const { confirm, dialog } = useConfirm()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return members.filter(m => {
      if (filter === 'pending' && m.driing_status !== 'pending') return false
      if (filter === 'confirmed' && m.driing_status !== 'confirmed') return false
      if (!q) return true
      return (
        (m.email ?? '').toLowerCase().includes(q) ||
        (m.full_name ?? '').toLowerCase().includes(q)
      )
    })
  }, [members, search, filter])

  const stats = useMemo(() => ({
    total: members.length,
    pending: members.filter(m => m.driing_status === 'pending').length,
    confirmed: members.filter(m => m.driing_status === 'confirmed').length,
    waitingLong: members.filter(m => m.driing_status === 'pending' && daysSince(m.created_at) > 7).length,
  }), [members])

  function notify(id: string, type: 'ok' | 'err', msg: string) {
    setFeedback({ id, type, msg })
    setTimeout(() => setFeedback(null), 2400)
  }

  function handleConfirm(id: string) {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, driing_status: 'confirmed' } : m))
    startT(async () => {
      const res = await confirmDriingMember(id)
      if (res?.error) {
        // Rollback
        setMembers(prev => prev.map(m => m.id === id ? { ...m, driing_status: 'pending' } : m))
        notify(id, 'err', `Erreur : ${res.error}`)
      } else {
        notify(id, 'ok', 'Membre Driing confirmé')
      }
    })
  }

  async function handleReject(id: string) {
    if (!(await confirm({ message: 'Rejeter cette demande ? Le membre repassera en plan Découverte.', confirmLabel: 'Refuser', danger: true }))) return
    const snapshot = members
    setMembers(prev => prev.filter(m => m.id !== id))
    startT(async () => {
      const res = await rejectDriingMember(id)
      if (res?.error) {
        setMembers(snapshot)
        notify(id, 'err', `Erreur : ${res.error}`)
      } else {
        notify(id, 'ok', 'Demande rejetée')
      }
    })
  }

  return (
    <div style={s.root}>
      {dialog}
      <AdminHero
        section="Membres Driing"
        title="Les clients Driing,"
        em="validés à la main"
        desc="Un client Driing qui s'inscrit demande l'accès offert : vérifie qu'il est bien client, puis confirme ou refuse. Refusé, il repasse en formule Découverte."
      />

      {/* KPIs */}
      <div style={s.kpiRow}>
        <Kpi label="Total demandes" value={stats.total} color="var(--text)" icon={<User size={16} weight="duotone" />} />
        <Kpi label="En attente" value={stats.pending} color="#B7791F" icon={<Clock size={16} weight="duotone" />}
          hint={stats.waitingLong > 0 ? `${stats.waitingLong} attendent > 7 j` : undefined}
        />
        <Kpi label="Confirmés" value={stats.confirmed} color="var(--accent-text)" icon={<CheckCircle size={16} weight="duotone" />} />
        <Kpi label="Driing actifs" value={stats.confirmed} color="#B7791F" icon={<Crown size={16} weight="duotone" />} />
      </div>

      {/* Filtres + recherche */}
      <div style={s.toolbar}>
        <div style={s.filterRow}>
          <FilterChip active={filter === 'pending'} onClick={() => setFilter('pending')} label="En attente" count={stats.pending} color="#B7791F" />
          <FilterChip active={filter === 'confirmed'} onClick={() => setFilter('confirmed')} label="Confirmés" count={stats.confirmed} color="var(--accent-text)" />
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="Tous" count={stats.total} />
        </div>
        <div style={s.searchWrap}>
          <MagnifyingGlass size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Email, nom…"
            style={s.searchInput}
          />
        </div>
      </div>

      {/* Liste */}
      <div style={s.list}>
        {filtered.length === 0 ? (
          <div style={s.empty}>
            <Funnel size={26} weight="duotone" style={{ color: 'var(--text-muted)' }} />
            <p style={{ margin: 0 }}>Aucun membre dans ce filtre.</p>
          </div>
        ) : filtered.map(m => {
          const isPending = m.driing_status === 'pending'
          const fbItem = feedback?.id === m.id ? feedback : null
          const days = daysSince(m.created_at)
          const isOld = isPending && days > 7
          return (
            <div key={m.id} style={s.row}>
              <div style={s.rowMain}>
                <div style={{ ...s.avatar, background: isPending ? 'color-mix(in srgb, #B7791F 12%, transparent)' : 'color-mix(in srgb, #B7791F 12%, transparent)', color: isPending ? '#B7791F' : '#B7791F' }}>
                  {(m.full_name || m.email).slice(0, 1).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.cellPrimary}>{m.full_name || m.email.split('@')[0]}</div>
                  <div style={s.cellSub}>
                    <EnvelopeSimple size={11} weight="fill" style={{ verticalAlign: '-1px', marginRight: '4px' }} />
                    {m.email}
                  </div>
                  <div style={s.cellMeta}>
                    Inscrit {fmtDate(m.created_at)}
                    {isOld && <span style={s.warnTag}> · ⚠️ attend depuis {days} j</span>}
                    {m.stripe_customer_id && <span style={s.stripeTag}> · Stripe ✓</span>}
                  </div>
                </div>
                <div style={s.statusCell}>
                  {isPending ? (
                    <span style={{ ...s.badge, background: 'color-mix(in srgb, #B7791F 12%, transparent)', color: '#B7791F', border: '1px solid color-mix(in srgb, #B7791F 22%, transparent)' }}>
                      En attente
                    </span>
                  ) : (
                    <span style={{ ...s.badge, background: 'color-mix(in srgb, #B7791F 12%, transparent)', color: '#B7791F', border: '1px solid color-mix(in srgb, #B7791F 22%, transparent)' }}>
                      <Crown size={11} weight="fill" /> Driing
                    </span>
                  )}
                </div>
              </div>
              <div style={s.rowActions}>
                {fbItem ? (
                  <span style={{ ...s.feedback, color: fbItem.type === 'ok' ? 'var(--accent-text)' : 'var(--danger-text)' }}>
                    {fbItem.type === 'ok' ? <Check size={13} weight="bold" /> : <X size={13} weight="bold" />}
                    {fbItem.msg}
                  </span>
                ) : isPending ? (
                  <>
                    <button onClick={() => handleConfirm(m.id)} disabled={isPending} style={{ ...s.actionBtn, ...s.actionConfirm }}>
                      <Check size={13} weight="bold" /> Confirmer
                    </button>
                    <button onClick={() => handleReject(m.id)} disabled={isPending} style={{ ...s.actionBtn, ...s.actionReject }}>
                      <X size={13} weight="bold" /> Rejeter
                    </button>
                  </>
                ) : (
                  <button onClick={() => handleReject(m.id)} disabled={isPending} style={{ ...s.actionBtn, ...s.actionReject }}>
                    <X size={13} weight="bold" /> Retirer
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Kpi({ label, value, color, hint, icon }: { label: string; value: number; color: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div style={s.kpiCard}>
      <div style={s.kpiHead}>
        <span style={s.kpiLabel}>{label}</span>
        {icon && <span aria-hidden="true" style={{ color, opacity: 0.8 }}>{icon}</span>}
      </div>
      <div style={{ ...s.kpiValue, color }}>{value}</div>
      {hint && <div style={s.kpiHint}>{hint}</div>}
    </div>
  )
}

function FilterChip({ active, onClick, label, count, color }: { active: boolean; onClick: () => void; label: string; count: number; color?: string }) {
  return (
    <button onClick={onClick} style={{
      ...s.filterChip,
      ...(active ? s.filterChipActive : {}),
      ...(active && color ? { borderColor: color, color } : {}),
    }}>
      {label}
      <span style={s.filterChipCount}>{count}</span>
    </button>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: { width: '100%', padding: 'clamp(16px, 3vw, 44px)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' as const, gap: '12px' },
  backLink: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', textDecoration: 'none', fontSize: '12.5px', fontWeight: 500 },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 400, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' },

  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' },
  kpiCard: { padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' },
  kpiHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  kpiLabel: { fontSize: '11px', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' as const, color: 'var(--text-3)' },
  kpiValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: '26px', fontWeight: 400, lineHeight: 1 },
  kpiHint: { fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' },

  toolbar: { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' as const },
  filterRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' as const },
  filterChip: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  filterChipActive: { background: 'var(--accent-bg)', borderColor: 'var(--accent-text)', color: 'var(--accent-text)', fontWeight: 600 },
  filterChipCount: { fontSize: '10.5px', fontWeight: 700, padding: '1px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)' },

  searchWrap: { position: 'relative', flex: '1 1 240px', maxWidth: '400px' },
  searchInput: { width: '100%', padding: '8px 12px 8px 34px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', outline: 'none' },

  list: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  empty: { padding: '40px 20px', textAlign: 'center' as const, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' },

  row: { display: 'flex', flexDirection: 'column' as const, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', gap: '10px' },
  rowMain: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const },
  avatar: { width: '38px', height: '38px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '15px', flexShrink: 0 },
  cellPrimary: { fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px', wordBreak: 'break-word' as const },
  cellSub: { fontSize: '12px', color: 'var(--text-2)', wordBreak: 'break-word' as const },
  cellMeta: { fontSize: '11px', color: 'var(--text-3)', marginTop: '3px' },
  warnTag: { color: '#B7791F', fontWeight: 600 },
  stripeTag: { color: 'var(--accent-text)', fontWeight: 600 },
  statusCell: { flexShrink: 0 },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '999px', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase' as const },

  rowActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const, justifyContent: 'flex-end' },
  actionBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', border: '1px solid', fontFamily: 'inherit' },
  actionConfirm: { background: 'var(--accent-text)', borderColor: 'var(--accent-text)', color: 'var(--bg)' },
  actionReject: { background: 'transparent', borderColor: 'color-mix(in srgb, var(--danger) 40%, transparent)', color: 'var(--danger-text)' },

  feedback: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, background: 'var(--bg-2)', border: '1px solid var(--border)' },
}
