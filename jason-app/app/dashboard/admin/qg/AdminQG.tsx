'use client'

// QG Admin : un seul endroit pour traiter les 3 types de demandes en
// attente — Membres Driing à valider/refuser, Signalements à modérer,
// Suggestions utilisateurs. Évite de jongler entre 3 pages séparées.
//
// 3 tabs avec badges count. La tab par défaut est celle qui a le plus
// d'actions en attente (priorité automatique).

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Check, X, EnvelopeSimple, Trash, MagnifyingGlass,
  Crown, CheckCircle, Warning, Lightbulb, GraduationCap, Handshake,
  ShieldStar, Heart,
} from '@phosphor-icons/react/dist/ssr'
import {
  confirmDriingMember, rejectDriingMember,
  deleteSuggestion,
} from '../actions'
import SignalementsAdmin from '../signalements/SignalementsAdmin'
import ModerationQueue from '../signalements/ModerationQueue'

// ─── Types ────────────────────────────────────────────────────────────
interface DriingMember {
  id: string; email: string; full_name: string | null
  created_at: string
  driing_status: 'none' | 'pending' | 'confirmed' | null
  plan: string | null
  stripe_customer_id: string | null
}
interface Report {
  id: string; identifier: string; identifier_type: string
  name: string | null; incident_type: string | null
  is_validated: boolean
  reporter_city: string | null; reporter_id: string | null
  reported_at: string; description: string | null
  created_at?: string | null
}
interface Suggestion {
  id: string; type: string; message: string
  user_email: string | null; user_id: string | null
  created_at: string
}

type Tab = 'driing' | 'reports' | 'suggestions'

// Type retourné par getModerationQueue (signalements publics anonymisés).
// On accepte un type lâche ici pour ne pas dupliquer les définitions
// déjà présentes dans moderation-actions.ts (ModerationQueue les utilise).
interface ModerationData {
  pending: Array<any>
  removalRequests: Array<any>
  approvedCount: number
  error?: string
}

interface Props {
  initialDriing: DriingMember[]
  initialReports: Report[]
  initialSuggestions: Suggestion[]
  moderation: ModerationData
}

// ─── Helpers ──────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 3600 * 1000))
}

// ─── Component ────────────────────────────────────────────────────────
export default function AdminQG({ initialDriing, initialReports, initialSuggestions, moderation }: Props) {
  const [driing, setDriing] = useState(initialDriing)
  const [reports, setReports] = useState(initialReports)
  const [suggestions, setSuggestions] = useState(initialSuggestions)
  const [search, setSearch] = useState('')
  const [feedback, setFeedback] = useState<{ id: string; type: 'ok' | 'err'; msg: string } | null>(null)
  const [isPending, startT] = useTransition()

  // Counts pour les badges + auto-sélection de la tab prioritaire.
  // Le badge "Signalements" agrège : reports privés non validés +
  // signalements publics en attente de modération + demandes de retrait
  // (toutes ces actions tombent visuellement dans la même tab).
  const counts = useMemo(() => ({
    driing: driing.filter(m => m.driing_status === 'pending').length,
    reports: reports.filter(r => !r.is_validated).length
      + moderation.pending.length
      + moderation.removalRequests.length,
    suggestions: suggestions.length,
  }), [driing, reports, suggestions, moderation])

  const totalPending = counts.driing + counts.reports + counts.suggestions

  // Tab par défaut : celle qui a le plus d'actions en attente
  const [tab, setTab] = useState<Tab>(() => {
    if (counts.driing >= counts.reports && counts.driing >= counts.suggestions) return 'driing'
    if (counts.reports >= counts.suggestions) return 'reports'
    return 'suggestions'
  })

  function notify(id: string, type: 'ok' | 'err', msg: string) {
    setFeedback({ id, type, msg })
    setTimeout(() => setFeedback(null), 2400)
  }

  // ── Driing actions ──
  function driingConfirm(id: string) {
    setDriing(prev => prev.map(m => m.id === id ? { ...m, driing_status: 'confirmed' } : m))
    startT(async () => {
      const res = await confirmDriingMember(id)
      if (res?.error) {
        setDriing(prev => prev.map(m => m.id === id ? { ...m, driing_status: 'pending' } : m))
        notify(id, 'err', `Erreur : ${res.error}`)
      } else {
        notify(id, 'ok', 'Confirmé ✓')
      }
    })
  }
  function driingReject(id: string) {
    if (!confirm('Rejeter cette demande ?')) return
    const snap = driing
    setDriing(prev => prev.filter(m => m.id !== id))
    startT(async () => {
      const res = await rejectDriingMember(id)
      if (res?.error) { setDriing(snap); notify(id, 'err', `Erreur : ${res.error}`) }
      else notify(id, 'ok', 'Rejeté')
    })
  }

  // ── Reports : actions gérées en interne par SignalementsAdmin embedded
  //    (on lui passe juste initialReports). On garde `reports` ici pour le
  //    count du badge tab uniquement.

  // ── Suggestions actions ──
  function suggestionDelete(id: string) {
    if (!confirm('Supprimer cette suggestion ?')) return
    const snap = suggestions
    setSuggestions(prev => prev.filter(s => s.id !== id))
    startT(async () => {
      const res = await deleteSuggestion(id)
      if (res?.error) { setSuggestions(snap); notify(id, 'err', `Erreur : ${res.error}`) }
      else notify(id, 'ok', 'Supprimée')
    })
  }

  // ── Filtrage recherche ──
  const q = search.trim().toLowerCase()
  const filteredDriing = useMemo(() => driing.filter(m => {
    if (!q) return true
    return (m.email ?? '').toLowerCase().includes(q) || (m.full_name ?? '').toLowerCase().includes(q)
  }), [driing, q])
  // Reports : filtrage géré dans SignalementsAdmin embedded
  const filteredSuggestions = useMemo(() => suggestions.filter(s => {
    if (!q) return true
    return (s.message ?? '').toLowerCase().includes(q) ||
           (s.user_email ?? '').toLowerCase().includes(q)
  }), [suggestions, q])

  return (
    <div style={s.root}>
      <header style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const }}>
          <Link href="/dashboard/admin" style={s.backLink}>
            <ArrowLeft size={13} weight="bold" /> Admin
          </Link>
          <div>
            <h1 style={s.title}>QG des demandes</h1>
            <p style={s.subtitle}>Un seul endroit pour valider, refuser et nettoyer tout ce qui demande ton attention.</p>
          </div>
        </div>
        {totalPending > 0 && (
          <div style={s.totalBadge}>
            <Warning size={14} weight="fill" />
            {totalPending} {totalPending > 1 ? 'actions en attente' : 'action en attente'}
          </div>
        )}
      </header>

      {/* Tabs */}
      <div style={s.tabs} role="tablist" aria-label="Catégories d'actions">
        <TabBtn
          active={tab === 'driing'}
          onClick={() => setTab('driing')}
          icon={<Heart size={14} weight="fill" />}
          label="Membres Driing"
          count={counts.driing}
          color="#7c3aed"
        />
        <TabBtn
          active={tab === 'reports'}
          onClick={() => setTab('reports')}
          icon={<ShieldStar size={14} weight="fill" />}
          label="Signalements"
          count={counts.reports}
          color="#fb923c"
        />
        <TabBtn
          active={tab === 'suggestions'}
          onClick={() => setTab('suggestions')}
          icon={<Lightbulb size={14} weight="fill" />}
          label="Suggestions"
          count={counts.suggestions}
          color="#FCD34D"
        />
      </div>

      {/* Search — masquée sur le tab "reports" (la console embedded
          SignalementsAdmin a sa propre recherche + filtres en interne) */}
      {tab !== 'reports' && (
        <div style={s.searchWrap}>
          <MagnifyingGlass size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={
              tab === 'driing' ? 'Email ou nom…' : 'Message, email…'
            }
            style={s.searchInput}
          />
        </div>
      )}

      {/* ── DRIING ── */}
      {tab === 'driing' && (
        <div style={s.list}>
          {filteredDriing.length === 0 ? (
            <Empty label="Aucune demande Driing." />
          ) : filteredDriing.map(m => {
            const isPendingItem = m.driing_status === 'pending'
            const fb = feedback?.id === m.id ? feedback : null
            const days = daysSince(m.created_at)
            const isOld = isPendingItem && days > 7
            return (
              <div key={m.id} style={s.row}>
                <div style={s.rowMain}>
                  <div style={{ ...s.avatar, background: isPendingItem ? 'rgba(251,146,60,0.12)' : 'rgba(124,58,237,0.12)', color: isPendingItem ? '#fb923c' : '#7c3aed' }}>
                    {(m.full_name || m.email).slice(0, 1).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.cellTitle}>{m.full_name || m.email.split('@')[0]}</div>
                    <div style={s.cellSub}>
                      <EnvelopeSimple size={11} weight="fill" /> {m.email}
                    </div>
                    <div style={s.cellMeta}>
                      Inscrit {fmtDate(m.created_at)}
                      {isOld && <span style={{ color: '#fb923c', fontWeight: 600, marginLeft: '6px' }}>· ⚠️ attend depuis {days} j</span>}
                      {m.stripe_customer_id && <span style={{ color: 'var(--accent-text)', fontWeight: 600, marginLeft: '6px' }}>· Stripe ✓</span>}
                    </div>
                  </div>
                  {isPendingItem ? (
                    <span style={{ ...s.badge, background: 'rgba(251,146,60,.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,.22)' }}>En attente</span>
                  ) : (
                    <span style={{ ...s.badge, background: 'rgba(124,58,237,.12)', color: '#7c3aed', border: '1px solid rgba(124,58,237,.22)' }}>
                      <Crown size={11} weight="fill" /> Driing
                    </span>
                  )}
                </div>
                <div style={s.rowActions}>
                  {fb ? (
                    <FbPill fb={fb} />
                  ) : isPendingItem ? (
                    <>
                      <button onClick={() => driingConfirm(m.id)} disabled={isPending} style={{ ...s.btn, ...s.btnConfirm }}>
                        <Check size={13} weight="bold" /> Confirmer
                      </button>
                      <button onClick={() => driingReject(m.id)} disabled={isPending} style={{ ...s.btn, ...s.btnReject }}>
                        <X size={13} weight="bold" /> Refuser
                      </button>
                    </>
                  ) : (
                    <button onClick={() => driingReject(m.id)} disabled={isPending} style={{ ...s.btn, ...s.btnReject }}>
                      <X size={13} weight="bold" /> Retirer
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── REPORTS ──
          1) ModerationQueue : signalements PUBLICS (opt-in anonymisé) en
             attente de modération + demandes de retrait. Couvre le SLA 48h
             et expose le bouton "Forcer rebuild" du site statique.
          2) SignalementsAdmin embedded : console privée historique (KPIs,
             filtres En attente/Validés, édition d'identifiant, Valider/Supprimer).
          Les deux apparaissent dans la même tab "Signalements" pour
          centraliser tout l'admin signalement au même endroit. */}
      {tab === 'reports' && (
        <>
          <ModerationQueue
            pending={moderation.pending}
            removalRequests={moderation.removalRequests}
            approvedCount={moderation.approvedCount}
          />
          <SignalementsAdmin initialReports={reports} embedded />
        </>
      )}

      {/* ── SUGGESTIONS ── */}
      {tab === 'suggestions' && (
        <div style={s.list}>
          {filteredSuggestions.length === 0 ? (
            <Empty label="Aucune suggestion." />
          ) : filteredSuggestions.map(sg => {
            const fb = feedback?.id === sg.id ? feedback : null
            const isFormation = sg.type === 'formation'
            return (
              <div key={sg.id} style={s.row}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const, justifyContent: 'space-between' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '3px 10px', borderRadius: '999px',
                    fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase' as const,
                    ...(isFormation
                      ? { background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }
                      : { background: 'rgba(147,197,253,.10)', color: '#93C5FD', border: '1px solid rgba(147,197,253,.22)' }),
                  }}>
                    {isFormation ? <GraduationCap size={11} weight="fill" /> : <Handshake size={11} weight="fill" />}
                    {isFormation ? 'Formation' : 'Partenaire'}
                  </span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>
                    {sg.user_email ?? '—'} · {fmtDate(sg.created_at)}
                  </span>
                </div>
                <p style={{ fontSize: '13.5px', color: 'var(--text)', lineHeight: 1.6, margin: '8px 0', whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const }}>
                  {sg.message}
                </p>
                <div style={s.rowActions}>
                  {fb ? <FbPill fb={fb} /> : (
                    <button onClick={() => suggestionDelete(sg.id)} disabled={isPending} style={{ ...s.btn, ...s.btnReject }}>
                      <Trash size={13} weight="bold" /> Supprimer
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────
function TabBtn({ active, onClick, icon, label, count, color }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number; color: string
}) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      style={{
        ...s.tabBtn,
        ...(active ? { borderColor: color, color, background: color + '12' } : {}),
      }}
    >
      <span aria-hidden="true" style={{ color }}>{icon}</span>
      <span>{label}</span>
      {count > 0 && (
        <span style={{
          ...s.tabCount,
          background: active ? color : 'var(--bg-2)',
          color: active ? 'var(--bg)' : 'var(--text-2)',
        }}>{count}</span>
      )}
    </button>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div style={s.empty}>
      <CheckCircle size={26} weight="duotone" style={{ color: 'var(--success-1)' }} />
      <p style={{ margin: 0 }}>{label}</p>
    </div>
  )
}

function FbPill({ fb }: { fb: { type: 'ok' | 'err'; msg: string } }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '7px 12px', borderRadius: '8px',
      fontSize: '12.5px', fontWeight: 600,
      background: 'var(--bg-2)', border: '1px solid var(--border)',
      color: fb.type === 'ok' ? 'var(--success-1)' : '#f87171',
    }}>
      {fb.type === 'ok' ? <Check size={13} weight="bold" /> : <X size={13} weight="bold" />}
      {fb.msg}
    </span>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  root: { width: '100%', padding: 'clamp(16px, 3vw, 44px)', display: 'flex', flexDirection: 'column' as const, gap: '18px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: '14px' },
  backLink: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', textDecoration: 'none', fontSize: '12.5px', fontWeight: 500 },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 400, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' },
  subtitle: { fontSize: '13px', color: 'var(--text-2)', margin: '4px 0 0', lineHeight: 1.5 },
  totalBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px', borderRadius: '999px',
    background: 'rgba(251,146,60,0.12)', color: '#fb923c',
    border: '1px solid rgba(251,146,60,0.25)',
    fontSize: '12.5px', fontWeight: 700,
  },

  tabs: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const },
  tabBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '9px 16px', borderRadius: '10px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-2)', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
    fontFamily: 'inherit', transition: 'all .15s',
  },
  tabCount: {
    fontSize: '11px', fontWeight: 700,
    padding: '1px 7px', borderRadius: '999px',
    minWidth: '20px', textAlign: 'center' as const,
  },

  searchWrap: { position: 'relative', maxWidth: '500px' },
  searchInput: { width: '100%', padding: '9px 12px 9px 36px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', outline: 'none' },

  list: { display: 'flex', flexDirection: 'column' as const, gap: '10px' },
  empty: { padding: '40px 20px', textAlign: 'center' as const, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' },

  row: { display: 'flex', flexDirection: 'column' as const, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', gap: '10px' },
  rowMain: { display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' as const },
  avatar: { width: '38px', height: '38px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '15px', flexShrink: 0 },
  cellTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px', wordBreak: 'break-word' as const },
  cellSub: { fontSize: '12px', color: 'var(--text-2)', wordBreak: 'break-word' as const, display: 'inline-flex', alignItems: 'center', gap: '4px' },
  cellMeta: { fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '999px', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase' as const, flexShrink: 0, alignSelf: 'flex-start' },

  rowActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' as const },
  btn: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', border: '1px solid', fontFamily: 'inherit' },
  btnConfirm: { background: 'var(--success-1)', borderColor: 'var(--success-1)', color: 'var(--bg)' },
  btnReject: { background: 'transparent', borderColor: 'rgba(248,113,113,0.4)', color: '#f87171' },
}
