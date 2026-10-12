'use client'

// QG Admin : un seul endroit pour tout ce qui attend une réponse. Refait le
// 12/10/2026 (Jason : « revoir entièrement niveau UI et UX ») : boîte de
// réception à gauche (Demandes d'hôtes, Membres Driing, Signalements,
// Suggestions, avec ce qui reste à traiter), contenu à droite. Les demandes
// d'hôtes ont leur fiche (DemandesHotes.tsx). Onglet ouvert : ?onglet=, sinon
// celui qui a le plus à traiter (les demandes d'hôtes d'abord).

import { useMemo, useState, useTransition } from 'react'
import {
  Check, X, EnvelopeSimple, Trash, MagnifyingGlass,
  Crown, CheckCircle, Lightbulb, GraduationCap, Handshake,
  ShieldStar, Heart, ArrowRight, House,
} from '@phosphor-icons/react/dist/ssr'
import InlineStyle from '@/components/ui/InlineStyle'
import DemandesHotes from './DemandesHotes'
import type { DemandesQGData } from './demandes-load'
import AdminHero, { adminAsideCard } from '../_ui/AdminHero'
import { AMBER, BROWN, PINK, tint } from '../_ui/theme'
import { useConfirm } from '@/components/ui/ConfirmDialog'
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

export type QGTab = 'hotes' | 'driing' | 'reports' | 'suggestions'
type Tab = QGTab

// Type retourné par getModerationQueue (signalements publics anonymisés).
// On accepte un type lâche ici pour ne pas dupliquer les définitions
// déjà présentes dans moderation-actions.ts (ModerationQueue les utilise).
interface ModerationData {
  pending: Array<any>
  removalRequests: Array<any>
  approved: Array<any>
  approvedCount: number
  error?: string
}

interface Props {
  initialDriing: DriingMember[]
  initialReports: Report[]
  initialSuggestions: Suggestion[]
  moderation: ModerationData
  demandes: DemandesQGData
  initialTab: QGTab | null
  initialDemandeId: string | null
}

const QG_CSS = `
.qg-shell{display:grid;gap:18px;align-items:start}
@media(min-width:1000px){.qg-shell{grid-template-columns:232px minmax(0,1fr)}.qg-nav{position:sticky;top:84px;flex-direction:column}}
@media(max-width:999px){.qg-nav{overflow-x:auto;scrollbar-width:none;margin:0 -4px;padding:0 4px 2px}.qg-nav::-webkit-scrollbar{display:none}.qg-nav-hint{display:none}.qg-nav-item{width:auto!important}}
.qg-nav-item:hover{border-color:var(--accent-border)!important}
`

// ─── Helpers ──────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 3600 * 1000))
}

// ─── Component ────────────────────────────────────────────────────────
export default function AdminQG({ initialDriing, initialReports, initialSuggestions, moderation, demandes, initialTab, initialDemandeId }: Props) {
  const [driing, setDriing] = useState(initialDriing)
  const [reports, setReports] = useState(initialReports)
  const [suggestions, setSuggestions] = useState(initialSuggestions)
  const [search, setSearch] = useState('')
  const [feedback, setFeedback] = useState<{ id: string; type: 'ok' | 'err'; msg: string } | null>(null)
  const [isPending, startT] = useTransition()
  const { confirm, dialog } = useConfirm()

  // Counts pour les badges + auto-sélection de la tab prioritaire.
  // Le badge "Signalements" agrège : reports privés non validés +
  // signalements publics en attente de modération + demandes de retrait
  // (toutes ces actions tombent visuellement dans la même tab).
  const [hotesCount, setHotesCount] = useState(() => demandes.demandes.filter(d => d.aTraiter).length)
  const counts = useMemo(() => ({
    hotes: hotesCount,
    driing: driing.filter(m => m.driing_status === 'pending').length,
    reports: reports.filter(r => !r.is_validated).length
      + moderation.pending.length
      + moderation.removalRequests.length,
    suggestions: suggestions.length,
  }), [driing, reports, suggestions, moderation, hotesCount])

  const totalPending = counts.hotes + counts.driing + counts.reports + counts.suggestions

  // Tab par défaut : celle qui a le plus d'actions en attente
  const [tab, setTabState] = useState<Tab>(() => {
    if (initialTab) return initialTab
    if (counts.hotes > 0 || (counts.driing + counts.reports + counts.suggestions === 0)) return 'hotes'
    if (counts.driing >= counts.reports && counts.driing >= counts.suggestions) return 'driing'
    if (counts.reports >= counts.suggestions) return 'reports'
    return 'suggestions'
  })

  function setTab(t: Tab) {
    setTabState(t)
    setSearch('')
    try { const u = new URL(window.location.href); u.searchParams.set('onglet', t); u.searchParams.delete('demande'); window.history.replaceState(null, '', u.toString()) } catch { /* rien */ }
  }

  const NAV: Array<{ key: Tab; label: string; hint: string; count: number; total?: number; color: string; icon: React.ReactNode }> = [
    { key: 'hotes', label: 'Demandes d’hôtes', hint: 'Besoins envoyés aux pros', count: counts.hotes, total: demandes.demandes.length, color: PINK, icon: <House size={16} weight="duotone" /> },
    { key: 'driing', label: 'Membres Driing', hint: 'Accès à confirmer', count: counts.driing, color: AMBER, icon: <Heart size={16} weight="duotone" /> },
    { key: 'reports', label: 'Signalements', hint: 'À modérer', count: counts.reports, color: 'var(--danger-text)', icon: <ShieldStar size={16} weight="duotone" /> },
    { key: 'suggestions', label: 'Suggestions', hint: 'Idées des membres', count: counts.suggestions, color: BROWN, icon: <Lightbulb size={16} weight="duotone" /> },
  ]
  const current = NAV.find(n => n.key === tab)!
  const SECTION_DESC: Record<Tab, string> = {
    hotes: 'Chaque besoin décrit sur jasonmarinho.com/trouver-un-pro : à qui il est parti, si les pros l’ont ouvert, et ce que tu peux en faire.',
    driing: 'Les membres qui se sont inscrits par Driing : confirme leur accès (gratuit, promis) ou refuse.',
    reports: 'Signalements publics à modérer, demandes de retrait, puis la console des signalements privés.',
    suggestions: 'Formations et partenaires proposés par les membres.',
  }

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
  async function driingReject(id: string, retirer = false) {
    if (!(await confirm({
      message: retirer ? 'Retirer ce membre de Driing ? Il repassera en formule Découverte.' : 'Refuser cette demande Driing ?',
      confirmLabel: retirer ? 'Retirer' : 'Refuser', danger: true,
    }))) return
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
  async function suggestionDelete(id: string) {
    if (!(await confirm({ message: 'Supprimer cette suggestion ?', confirmLabel: 'Supprimer', danger: true }))) return
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
      {dialog}
      <InlineStyle css={QG_CSS} />
      <AdminHero
        section="QG demandes"
        title="Tout ce qui attend"
        em="ta réponse"
        desc="Demandes d’hôtes, accès Driing, signalements et suggestions : une boîte de réception, une fiche par demande."
        aside={
          <div style={adminAsideCard}>
            <div style={s.asideTitle}>{totalPending > 0 ? `${totalPending} à traiter` : 'Tout est à jour'}</div>
            {NAV.map(n => (
              <button key={n.key} type="button" onClick={() => setTab(n.key)} style={{ ...s.asideRow, ...(tab === n.key ? s.asideRowOn : {}) }}>
                <span style={{ flex: 1, textAlign: 'left' }}>{n.label}</span>
                <strong style={{ color: n.count > 0 ? 'var(--text)' : 'var(--text-3)' }}>{n.count}</strong>
                <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
              </button>
            ))}
          </div>
        }
      />

      <div className="qg-shell">
        <nav className="qg-nav" aria-label="Boîtes du QG" style={s.nav}>
          {NAV.map(n => {
            const on = tab === n.key
            return (
              <button
                key={n.key}
                type="button"
                className="qg-nav-item"
                aria-current={on ? 'page' : undefined}
                onClick={() => setTab(n.key)}
                style={{ ...s.navItem, ...(on ? { border: `1px solid ${tint(n.color, 45)}`, background: tint(n.color, 8) } : {}) }}
              >
                <span style={{ ...s.navIcon, color: n.color, background: tint(n.color, 12) }}>{n.icon}</span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{n.label}</span>
                  <span className="qg-nav-hint" style={{ fontSize: 11.5, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{n.hint}</span>
                </span>
                {n.count > 0
                  ? <span style={{ ...s.tabCount, background: n.color, color: '#fff' }}>{n.count}</span>
                  : <span style={{ ...s.tabCount, color: 'var(--text-3)' }}>0</span>}
              </button>
            )
          })}
        </nav>

        <main style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <header style={s.sectionHead}>
            <div style={{ flex: '1 1 320px', minWidth: 0 }}>
              <h2 style={s.sectionTitle}>{current.label}</h2>
              <p style={s.sectionDesc}>{SECTION_DESC[tab]}</p>
            </div>
            {(tab === 'driing' || tab === 'suggestions') && (
              <div style={s.searchWrap}>
                <MagnifyingGlass size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={tab === 'driing' ? 'E-mail ou nom…' : 'Message, e-mail…'}
                  style={s.searchInput}
                />
              </div>
            )}
          </header>

      {tab === 'hotes' && (
        <DemandesHotes
          initial={demandes.demandes}
          pros={demandes.pros}
          initialId={initialDemandeId}
          suiviOk={demandes.suiviOk}
          error={demandes.error}
          onCount={setHotesCount}
        />
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
                  <div style={{ ...s.avatar, background: isPendingItem ? tint(AMBER) : 'var(--accent-bg)', color: isPendingItem ? AMBER : 'var(--accent-text)' }}>
                    {(m.full_name || m.email).slice(0, 1).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.cellTitle}>{m.full_name || m.email.split('@')[0]}</div>
                    <div style={s.cellSub}>
                      <EnvelopeSimple size={11} weight="fill" /> {m.email}
                    </div>
                    <div style={s.cellMeta}>
                      Inscrit {fmtDate(m.created_at)}
                      {isOld && <span style={{ color: AMBER, fontWeight: 600, marginLeft: '6px' }}>· attend depuis {days} j</span>}
                      {m.stripe_customer_id && <span style={{ color: 'var(--accent-text)', fontWeight: 600, marginLeft: '6px' }}>· client Stripe</span>}
                    </div>
                  </div>
                  {isPendingItem ? (
                    <span style={{ ...s.badge, background: tint(AMBER), color: AMBER, border: `1px solid ${tint(AMBER, 30)}` }}>En attente</span>
                  ) : (
                    <span style={{ ...s.badge, background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}>
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
                    <button onClick={() => driingReject(m.id, true)} disabled={isPending} style={{ ...s.btn, ...s.btnReject }}>
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
            approved={moderation.approved ?? []}
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
                      : { background: tint(BROWN), color: BROWN, border: `1px solid ${tint(BROWN, 30)}` }),
                  }}>
                    {isFormation ? <GraduationCap size={11} weight="fill" /> : <Handshake size={11} weight="fill" />}
                    {isFormation ? 'Formation' : 'Partenaire'}
                  </span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>
                    {sg.user_email ?? 'anonyme'} · {fmtDate(sg.created_at)}
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
        </main>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────
function Empty({ label }: { label: string }) {
  return (
    <div style={s.empty}>
      <CheckCircle size={26} weight="duotone" style={{ color: 'var(--accent-text)' }} />
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
      color: fb.type === 'ok' ? 'var(--accent-text)' : 'var(--danger-text)',
    }}>
      {fb.type === 'ok' ? <Check size={13} weight="bold" /> : <X size={13} weight="bold" />}
      {fb.msg}
    </span>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  root: { width: '100%', padding: 'clamp(16px, 3vw, 44px)', display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  asideTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', color: 'var(--text)' },
  asideRow: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', width: '100%',
    background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-2)',
    fontSize: '13px', fontFamily: 'inherit', cursor: 'pointer',
  },
  asideRowOn: { border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--text)' },

  tabCount: {
    fontSize: '11px', fontWeight: 700,
    padding: '1px 7px', borderRadius: '999px',
    minWidth: '20px', textAlign: 'center' as const,
  },

  nav: { display: 'flex', gap: '8px' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left' as const,
    padding: '10px 12px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)',
    cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color .15s', flexShrink: 0,
  },
  navIcon: { width: '32px', height: '32px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sectionHead: { display: 'flex', flexWrap: 'wrap' as const, gap: '12px', alignItems: 'flex-end', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '24px', fontWeight: 400, margin: '0 0 4px', color: 'var(--text)', letterSpacing: '-.2px' },
  sectionDesc: { fontSize: '13.5px', color: 'var(--text-2)', margin: 0, lineHeight: 1.55, maxWidth: '640px' },
  searchWrap: { position: 'relative', width: '100%', maxWidth: '320px' },
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
  btnConfirm: { background: 'var(--accent-text)', borderColor: 'var(--accent-text)', color: 'var(--bg)' },
  btnReject: { background: 'transparent', borderColor: 'var(--danger-border)', color: 'var(--danger-text)' },
}
