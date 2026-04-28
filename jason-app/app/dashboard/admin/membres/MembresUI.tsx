'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Robot, Trash, ArrowClockwise, CheckCircle, XCircle, MagnifyingGlass,
  GraduationCap, Lightning, Users, X, Heart,
  House, BookmarkSimple, PencilSimple, Flag, Lightbulb,
  CalendarBlank, SpinnerGap, UsersFour, ArrowSquareOut,
  Crown, Star, TextAa, CurrencyEur,
} from '@phosphor-icons/react'
import {
  changeUserPlan, deleteUser, deleteAllBots,
  getMemberDetails, toggleContributor, updateMemberName,
} from '../actions'

// ── Types ──────────────────────────────────────────────────────────────────

interface UserFormation {
  id: string; progress: number; enrolled_at: string
  formation: { id: string; title: string; slug: string } | null
}

interface Member {
  id: string; email: string; full_name: string | null
  role: string; driing_status: string; plan: string
  is_contributor: boolean; created_at: string
  user_formations: UserFormation[]
}

interface MemberDetails {
  voyageurs: number; favorites: number; customizations: number
  signalements: number; suggestions: number; sejours: number
  communityGroupsCount: number; communityTotalReach: number
  auditsCount: number; auditsCompleted: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function initials(name: string | null, email: string) {
  if (name) return name.split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return email[0].toUpperCase()
}

function toTitleCase(s: string) {
  return s.replace(/\S+/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase())
}

function isBotLike(name: string | null, email: string): boolean {
  if (name && name.length > 8 && !name.includes(' ') && /[A-Z]/.test(name) && /[a-z]/.test(name)) return true
  const parts = email.split('@')[0].split('.')
  if (parts.length >= 4 && parts.every(p => p.length <= 3)) return true
  return false
}

// Hash-based avatar color so every member gets a consistent unique color
const PALETTE = [
  { bg: 'rgba(255,213,107,0.14)', border: 'rgba(255,213,107,0.32)', text: '#FFD56B' },
  { bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.28)',  text: '#34D399' },
  { bg: 'rgba(96,190,255,0.12)',  border: 'rgba(96,190,255,0.28)',  text: '#60BEFF' },
  { bg: 'rgba(249,117,131,0.12)', border: 'rgba(249,117,131,0.28)', text: '#F97583' },
  { bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.28)', text: '#C084FC' },
  { bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.28)',  text: '#FB923C' },
]
function palette(str: string) {
  let h = 0; for (const c of str) h = (h + c.charCodeAt(0)) % PALETTE.length
  return PALETTE[h]
}

const PLANS = [
  { value: 'decouverte', label: 'Découverte' },
  { value: 'standard',   label: 'Standard' },
  { value: 'driing',     label: 'Membre Driing' },
] as const

// ── Main component ────────────────────────────────────────────────────────────

export default function MembresUI({ members }: { members: Member[] }) {
  const router = useRouter()
  const [search, setSearch]       = useState('')
  const [filterPlan, setFilterPlan] = useState<string>('all')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback]   = useState<{ id: string; type: 'ok'|'err'; msg: string } | null>(null)
  const [botsFeedback, setBotsFeedback] = useState<{ type: 'ok'|'err'; msg: string } | null>(null)

  // Side panel
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [memberDetails, setMemberDetails]   = useState<MemberDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    if (!selectedMember) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setSelectedMember(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selectedMember])

  async function openPanel(member: Member) {
    setSelectedMember(member); setMemberDetails(null); setDetailsLoading(true)
    const result = await getMemberDetails(member.id)
    if (!('error' in result)) setMemberDetails(result as MemberDetails)
    setDetailsLoading(false)
  }

  function notify(id: string, type: 'ok'|'err', msg: string) {
    setFeedback({ id, type, msg }); setTimeout(() => setFeedback(null), 3000)
  }

  function action(id: string, fn: () => Promise<{ error?: string | null }>, msg: string) {
    startTransition(async () => {
      const res = await fn()
      if (res?.error) notify(id, 'err', String(res.error))
      else { notify(id, 'ok', msg); router.refresh() }
    })
  }

  function handleDeleteAllBots() {
    if (!confirm(`Supprimer définitivement ${totalBots} bot(s) suspect(s) ?`)) return
    startTransition(async () => {
      const res = await deleteAllBots()
      if (res?.error) setBotsFeedback({ type: 'err', msg: String(res.error) })
      else setBotsFeedback({ type: 'ok', msg: `${(res as { deleted: number }).deleted} supprimé(s)` })
      setTimeout(() => setBotsFeedback(null), 3000)
      router.refresh()
    })
  }

  const filtered = members.filter(m => {
    const q = search.toLowerCase()
    const matchSearch = !search || m.email.toLowerCase().includes(q) || (m.full_name ?? '').toLowerCase().includes(q)
    const matchPlan =
      filterPlan === 'all' ||
      (filterPlan === 'decouverte' && m.plan !== 'driing' && m.plan !== 'standard') ||
      (filterPlan === 'standard'   && m.plan === 'standard') ||
      (filterPlan === 'driing'     && m.plan === 'driing')
    return matchSearch && matchPlan
  })

  const totalBots     = members.filter(m => isBotLike(m.full_name, m.email)).length
  const totalDriing   = members.filter(m => m.plan === 'driing').length
  const totalStandard = members.filter(m => m.plan === 'standard').length
  const totalDecouv   = members.filter(m => m.plan !== 'driing' && m.plan !== 'standard').length
  const totalContrib  = members.filter(m => m.is_contributor).length

  return (
    <div style={s.wrap}>

      {/* ── Stats ── */}
      <div style={s.statsRow}>
        {[
          { icon: <Users size={16} />,     value: members.length,    label: 'membres',     color: 'var(--text-2)' },
          { icon: <Star size={16} weight="fill" />, value: totalStandard, label: 'Standard',    color: '#34D399' },
          { icon: <Lightning size={16} weight="fill" />, value: totalDriing, label: 'Driing',  color: 'var(--accent-text)' },
          { icon: <Heart size={16} weight="fill" />, value: totalContrib,  label: 'contributeurs', color: '#F472B6' },
          { icon: <CurrencyEur size={16} />, value: `${(totalStandard * 1.98 + totalDriing * 0.98).toFixed(2)} €`, label: 'MRR estimé', color: '#34D399' },
        ].map(({ icon, value, label, color }) => (
          <div key={label} style={s.statChip}>
            <span style={{ color, lineHeight: 1 }}>{icon}</span>
            <span style={{ ...s.statNum, color }}>{value}</span>
            <span style={s.statLabel}>{label}</span>
          </div>
        ))}

        <div style={{ flex: 1 }} />

        {totalBots > 0 && (
          botsFeedback ? (
            <FeedbackPill type={botsFeedback.type} msg={botsFeedback.msg} />
          ) : (
            <button disabled={isPending} onClick={handleDeleteAllBots} style={s.deleteBotsBtn}>
              <Robot size={13} />
              {totalBots} bots suspects — nettoyer
            </button>
          )
        )}
      </div>

      {/* ── Filters ── */}
      <div style={s.filtersRow}>
        <div style={s.searchWrap}>
          <MagnifyingGlass size={14} color="var(--text-muted)" />
          <input
            type="search" placeholder="Nom ou email…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={s.searchInput}
          />
          {search && (
            <button onClick={() => setSearch('')} style={s.clearBtn}><X size={13} /></button>
          )}
        </div>

        <div style={s.planTabs}>
          {[
            { v: 'all',        l: 'Tous',         count: members.length },
            { v: 'decouverte', l: 'Découverte',   count: totalDecouv },
            { v: 'standard',   l: 'Standard',     count: totalStandard },
            { v: 'driing',     l: 'Driing',       count: totalDriing },
          ].map(f => (
            <button
              key={f.v}
              onClick={() => setFilterPlan(f.v)}
              style={{ ...s.planTab, ...(filterPlan === f.v ? s.planTabActive : {}) }}
            >
              {f.l}
              <span style={{
                ...s.tabCount,
                background: filterPlan === f.v ? 'var(--accent-bg-2)' : 'var(--border)',
                color: filterPlan === f.v ? 'var(--accent-text)' : 'var(--text-muted)',
              }}>{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Cards grid ── */}
      {filtered.length === 0 ? (
        <div style={s.empty}>
          <MagnifyingGlass size={32} color="var(--text-muted)" />
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
            Aucun membre pour &ldquo;{search}&rdquo;.
          </p>
        </div>
      ) : (
        <div style={s.grid}>
          {filtered.map(m => (
            <MemberCard
              key={m.id} member={m}
              isPending={isPending}
              feedback={feedback?.id === m.id ? feedback : null}
              onOpenPanel={openPanel}
              onChangePlan={(plan) => action(m.id, () => changeUserPlan(m.id, plan), 'Plan mis à jour')}
              onToggleContrib={() => action(m.id, () => toggleContributor(m.id, !m.is_contributor), m.is_contributor ? 'Contributeur retiré' : 'Contributeur activé')}
              onDelete={() => {
                if (!confirm(`Supprimer définitivement ${m.full_name || m.email} ?`)) return
                action(m.id, () => deleteUser(m.id), 'Supprimé')
              }}
              onSaveName={(name) => action(m.id, () => updateMemberName(m.id, name), 'Nom mis à jour')}
            />
          ))}
        </div>
      )}

      {/* ── Side panel ── */}
      <MemberDetailPanel
        member={selectedMember}
        details={memberDetails}
        loading={detailsLoading}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  )
}

// ── Member Card ───────────────────────────────────────────────────────────────

interface MemberCardProps {
  member: Member
  isPending: boolean
  feedback: { type: 'ok'|'err'; msg: string } | null
  onOpenPanel: (m: Member) => void
  onChangePlan: (plan: string) => void
  onToggleContrib: () => void
  onDelete: () => void
  onSaveName: (name: string) => void
}

function MemberCard({ member: m, isPending, feedback, onOpenPanel, onChangePlan, onToggleContrib, onDelete, onSaveName }: MemberCardProps) {
  const pal      = palette(m.full_name || m.email)
  const ini      = initials(m.full_name, m.email)
  const isAdmin  = m.role === 'admin'
  const isDriing = m.plan === 'driing'
  const suspect  = isBotLike(m.full_name, m.email)
  const formations = m.user_formations?.length ?? 0

  // Inline name editing
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue]     = useState(m.full_name || '')
  const [displayName, setDisplayName] = useState(m.full_name || '')
  const nameInputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setNameValue(displayName)
    setEditingName(true)
    setTimeout(() => nameInputRef.current?.focus(), 10)
  }
  function cancelEdit() { setEditingName(false); setNameValue(displayName) }
  function applyTitleCase() { setNameValue(prev => toTitleCase(prev)) }
  function saveName() {
    const trimmed = nameValue.trim()
    setEditingName(false)
    if (!trimmed || trimmed === (m.full_name || '')) return
    setDisplayName(trimmed)
    onSaveName(trimmed)
  }

  const isStandard = m.plan === 'standard'
  const planColor  = isAdmin ? '#C084FC' : isDriing ? 'var(--accent-text)' : isStandard ? '#34D399' : 'var(--text-3)'
  const planBg     = isAdmin ? 'rgba(192,132,252,0.1)' : isDriing ? 'var(--accent-bg)' : isStandard ? 'rgba(52,211,153,0.1)' : 'var(--border)'
  const planBorder = isAdmin ? 'rgba(192,132,252,0.35)' : isDriing ? 'var(--accent-border)' : isStandard ? 'rgba(52,211,153,0.32)' : 'var(--border)'
  const planLabel  = isAdmin ? 'Admin' : isDriing ? 'Membre Driing' : isStandard ? 'Standard' : 'Découverte'

  return (
    <div style={{ ...s.card, ...(suspect ? { borderColor: 'rgba(248,113,113,0.25)' } : {}) }}>

      {/* ── Identity ── */}
      <div style={s.cardTop}>
        {/* Avatar */}
        <div style={{ ...s.avatar, background: pal.bg, border: `1.5px solid ${suspect ? 'rgba(248,113,113,0.35)' : pal.border}` }}>
          <span style={{ ...s.avatarText, color: suspect ? '#f87171' : pal.text }}>
            {suspect ? <Robot size={18} /> : ini}
          </span>
        </div>

        {/* Name + email + date */}
        <div style={s.identity}>
          {editingName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                ref={nameInputRef}
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') cancelEdit() }}
                onBlur={saveName}
                style={s.nameInput}
              />
              <button
                onMouseDown={e => { e.preventDefault(); applyTitleCase() }}
                style={s.titleCaseBtn} title="Normaliser la casse (Title Case)"
              >
                <TextAa size={13} />
              </button>
            </div>
          ) : (
            <div style={s.nameRow}>
              <span style={s.name}>{displayName || m.email.split('@')[0]}</span>
              {!isAdmin && (
                <button onClick={startEdit} style={s.editNameBtn} title="Modifier le nom">
                  <PencilSimple size={11} />
                </button>
              )}
            </div>
          )}
          <span style={s.email}>{m.email}</span>
          <span style={s.joinDate}>Inscrit le {formatDate(m.created_at)}</span>
        </div>

        {/* Plan badge — top right */}
        <div style={{ ...s.planBadge, background: planBg, color: planColor, border: `1px solid ${planBorder}` }}>
          {isAdmin ? <Crown size={11} weight="fill" /> : isDriing ? <Star size={11} weight="fill" /> : null}
          {planLabel}
        </div>
      </div>

      {/* ── Chips row ── */}
      <div style={s.chipsRow}>
        {m.is_contributor && (
          <span style={s.contribChip}><Heart size={10} weight="fill" /> Contributeur</span>
        )}
        {formations > 0 && (
          <button onClick={() => onOpenPanel(m)} style={s.formChip} title="Voir les formations">
            <GraduationCap size={11} />
            {formations} formation{formations > 1 ? 's' : ''}
          </button>
        )}
        {formations === 0 && !m.is_contributor && (
          <span style={s.emptyChip}>Aucune formation commencée</span>
        )}
      </div>

      {/* ── Separator ── */}
      <div style={s.sep} />

      {/* ── Actions ── */}
      <div style={s.actions}>
        {/* Feedback overlay */}
        {feedback ? (
          <FeedbackPill type={feedback.type} msg={feedback.msg} />
        ) : (
          <>
            {/* Plan selector */}
            {!isAdmin && (
              <select
                value={m.plan || 'decouverte'}
                disabled={isPending}
                onChange={e => onChangePlan(e.target.value)}
                style={s.planSelect}
              >
                {PLANS.map(p => (
                  <option key={p.value} value={p.value} style={{ background: '#040d0b' }}>
                    {p.label}
                  </option>
                ))}
              </select>
            )}

            {/* Contributor toggle */}
            {!isAdmin && (
              <button
                disabled={isPending}
                onClick={onToggleContrib}
                style={{
                  ...s.actionBtn,
                  ...(m.is_contributor
                    ? { background: 'rgba(244,114,182,0.1)', borderColor: 'rgba(244,114,182,0.25)', color: '#f472b6' }
                    : {}
                  ),
                }}
                title={m.is_contributor ? 'Retirer le badge contributeur' : 'Marquer comme contributeur'}
              >
                <Heart size={13} weight={m.is_contributor ? 'fill' : 'regular'} />
              </button>
            )}

            {/* View activity */}
            <button onClick={() => onOpenPanel(m)} style={{ ...s.actionBtn, marginLeft: 'auto' }} title="Voir l'activité">
              <Users size={13} />
            </button>

            {/* Full profile */}
            <a href={`/dashboard/admin/membres/${m.id}`} style={s.actionBtn} title="Fiche complète">
              <ArrowSquareOut size={13} />
            </a>

            {/* Delete */}
            {!isAdmin && (
              <button
                disabled={isPending}
                onClick={onDelete}
                style={{ ...s.actionBtn, ...s.actionBtnDanger }}
                title="Supprimer"
              >
                <Trash size={13} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Side panel ────────────────────────────────────────────────────────────────

interface PanelProps {
  member: Member | null; details: MemberDetails | null
  loading: boolean; onClose: () => void
}

function MemberDetailPanel({ member, details, loading, onClose }: PanelProps) {
  const open = !!member
  const pal  = member ? palette(member.full_name || member.email) : PALETTE[0]
  const ini  = member ? initials(member.full_name, member.email) : '?'

  const planDisplay: Record<string, { label: string; color: string; bg: string }> = {
    driing:     { label: 'Membre Driing', color: 'var(--accent-text)', bg: 'var(--accent-bg-2)' },
    standard:   { label: 'Standard',      color: '#34D399',            bg: 'rgba(52,211,153,0.1)' },
    decouverte: { label: 'Découverte',    color: 'var(--text-3)',      bg: 'var(--border)' },
  }
  const planCfg = planDisplay[member?.plan ?? 'decouverte'] ?? planDisplay.decouverte

  const statTiles = details ? [
    { icon: <UsersFour size={14} />,    value: details.voyageurs,      label: 'Voyageurs',       color: '#93C5FD' },
    { icon: <CalendarBlank size={14} />, value: details.sejours,       label: 'Séjours',          color: '#34D399' },
    { icon: <BookmarkSimple size={14} />, value: details.favorites,    label: 'Gabarits favoris', color: 'var(--accent-text)' },
    { icon: <PencilSimple size={14} />, value: details.customizations, label: 'Gabarits perso',   color: '#C084FC' },
    { icon: <Flag size={14} />,          value: details.signalements,  label: 'Signalements',     color: '#f87171' },
    { icon: <Lightbulb size={14} />,     value: details.suggestions,   label: 'Suggestions',      color: '#FB923C' },
    { icon: <UsersFour size={14} />,    value: details.communityGroupsCount, label: 'Groupes FB',  color: '#60A5FA' },
    { icon: <MagnifyingGlass size={14} />, value: details.auditsCount,        label: 'Audits GBP',  color: '#A78BFA' },
  ] : []

  // Format reach (245 000 → "245 k")
  function fmtReach(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} M`
    if (n >= 1_000) return `${Math.round(n / 1_000)} k`
    return String(n)
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(3px)', zIndex: 150,
          opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s',
        }}
      />
      <div
        role="dialog" aria-modal="true"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(420px, 94vw)',
          background: 'var(--bg-2)',
          borderLeft: '1px solid var(--border-2)',
          boxShadow: '-24px 0 64px rgba(0,0,0,0.45)',
          zIndex: 160, display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32,0,0.15,1)',
          overflowY: 'hidden',
        }}
      >
        {/* Header */}
        <div style={ps.header}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={ps.headerTitle}>Activité membre</span>
            <button onClick={onClose} style={ps.closeBtn}><X size={18} weight="bold" /></button>
          </div>
          {member && (
            <a href={`/dashboard/admin/membres/${member.id}`} style={ps.viewFullBtn}>
              <ArrowSquareOut size={13} /> Voir la fiche complète
            </a>
          )}
        </div>

        <div style={ps.divider} />

        <div style={ps.body}>
          {member && (
            <>
              {/* Identity */}
              <div style={ps.identityBlock}>
                <div style={{ ...ps.bigAvatar, background: pal.bg, border: `2px solid ${pal.border}` }}>
                  <span style={{ ...ps.bigAvatarText, color: pal.text }}>{ini}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={ps.memberName}>{member.full_name || '—'}</div>
                  <div style={ps.memberEmail}>{member.email}</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <span style={{ ...ps.planPill, background: planCfg.bg, color: planCfg.color }}>
                      {planCfg.label}
                    </span>
                    {member.role === 'admin' && (
                      <span style={{ ...ps.planPill, background: 'rgba(192,132,252,0.12)', color: '#C084FC' }}>Admin</span>
                    )}
                    {member.is_contributor && (
                      <span style={{ ...ps.planPill, background: 'rgba(244,114,182,0.1)', color: '#f472b6' }}>Contributeur</span>
                    )}
                  </div>
                  <div style={ps.memberSince}>Membre depuis le {formatDate(member.created_at)}</div>
                </div>
              </div>

              <div style={ps.divider} />

              {/* Stats */}
              <div style={ps.section}>
                <div style={ps.sectionLabel}>Activité sur la plateforme</div>
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 0' }}>
                    <SpinnerGap size={18} color="var(--accent-text)" style={{ animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>Chargement…</span>
                  </div>
                ) : details ? (
                  <>
                    <div style={ps.statsGrid}>
                      {statTiles.map(tile => (
                        <div key={tile.label} style={{ ...ps.statTile, borderColor: `${tile.color}22`, background: `${tile.color}08` }}>
                          <span style={{ color: tile.color }}>{tile.icon}</span>
                          <span style={{ ...ps.statNum, color: tile.value > 0 ? 'var(--text)' : 'var(--text-muted)' }}>
                            {tile.value}
                          </span>
                          <span style={ps.statLabel}>{tile.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Récap visuel rapide */}
                    {(details.communityGroupsCount > 0 || details.auditsCount > 0) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                        {details.communityGroupsCount > 0 && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px', borderRadius: '10px',
                            background: 'rgba(96,165,250,0.06)',
                            border: '1px solid rgba(96,165,250,0.18)',
                          }}>
                            <UsersFour size={14} color="#60A5FA" weight="fill" />
                            <span style={{ flex: 1, fontSize: '12.5px', color: 'var(--text)' }}>
                              <strong>{details.communityGroupsCount}</strong> groupe{details.communityGroupsCount > 1 ? 's' : ''} Facebook rejoint{details.communityGroupsCount > 1 ? 's' : ''}
                            </span>
                            {details.communityTotalReach > 0 && (
                              <span style={{ fontSize: '11px', fontWeight: 600, color: '#60A5FA' }}>
                                Portée {fmtReach(details.communityTotalReach)}
                              </span>
                            )}
                          </div>
                        )}
                        {details.auditsCount > 0 && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px', borderRadius: '10px',
                            background: 'rgba(167,139,250,0.06)',
                            border: '1px solid rgba(167,139,250,0.18)',
                          }}>
                            <MagnifyingGlass size={14} color="#A78BFA" weight="fill" />
                            <span style={{ flex: 1, fontSize: '12.5px', color: 'var(--text)' }}>
                              <strong>{details.auditsCount}</strong> audit{details.auditsCount > 1 ? 's' : ''} GBP
                              {details.auditsCompleted > 0 && (
                                <span style={{ color: 'var(--text-3)' }}> · {details.auditsCompleted} complété{details.auditsCompleted > 1 ? 's' : ''}</span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px 0' }}>Impossible de charger.</p>
                )}
              </div>

              {/* Formations */}
              <div style={ps.divider} />
              <div style={ps.section}>
                <div style={ps.sectionLabel}>Formations ({member.user_formations?.length ?? 0})</div>
                {(member.user_formations?.length ?? 0) === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Aucune formation commencée.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {member.user_formations.map(uf => (
                      <div key={uf.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <GraduationCap size={14} color="#34D399" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {uf.formation?.title ?? 'Formation inconnue'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Inscrit le {formatDate(uf.enrolled_at)}
                            {uf.progress === 100 && (
                              <span style={{ fontSize: '10px', fontWeight: 600, color: '#34D399', background: 'rgba(52,211,153,0.12)', padding: '1px 6px', borderRadius: '100px' }}>
                                Terminée
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '4px', background: 'var(--border)', borderRadius: '100px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: '100px', width: `${uf.progress}%`, background: uf.progress === 100 ? '#34D399' : 'var(--accent-text)', transition: 'width 0.3s' }} />
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-3)', width: '30px', textAlign: 'right' }}>{uf.progress}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

// ── FeedbackPill ──────────────────────────────────────────────────────────────

function FeedbackPill({ type, msg }: { type: 'ok'|'err'; msg: string }) {
  const c = type === 'ok' ? '#34D399' : '#f87171'
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, color: c, background: `${c}14`, border: `1px solid ${c}28` }}>
      {type === 'ok' ? <CheckCircle size={12} weight="fill" /> : <XCircle size={12} weight="fill" />}
      {msg}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '20px' },

  // Stats
  statsRow: {
    display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '14px 20px',
  },
  statChip: {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '6px 12px', borderRadius: '10px',
    background: 'var(--surface)', border: '1px solid var(--border)',
  },
  statNum:   { fontFamily: 'var(--font-fraunces), serif', fontSize: '20px', fontWeight: 400 },
  statLabel: { fontSize: '12px', color: 'var(--text-3)' },
  deleteBotsBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: '9px', padding: '7px 13px',
    color: '#f87171', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
    fontFamily: 'var(--font-outfit), sans-serif',
  },

  // Filters
  filtersRow: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 200px', minWidth: 0,
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '9px 14px',
  },
  searchInput: {
    background: 'none', border: 'none', outline: 'none',
    fontSize: '13px', color: 'var(--text)', width: '100%', fontFamily: 'var(--font-outfit), sans-serif',
  },
  clearBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-3)', display: 'flex', padding: '2px',
  },
  planTabs: { display: 'flex', gap: '4px' },
  planTab: {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '7px 14px', borderRadius: '9px', fontSize: '12px', fontWeight: 500,
    background: 'none', border: '1px solid var(--border)',
    color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif',
    transition: 'all 0.15s',
  },
  planTabActive: {
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)',
  },
  tabCount: {
    fontSize: '10px', fontWeight: 700, padding: '1px 7px',
    borderRadius: '100px', lineHeight: '16px',
  },

  // Grid
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '14px',
  },
  empty: {
    padding: '60px 0', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '12px',
  },

  // Card
  card: {
    display: 'flex', flexDirection: 'column', gap: '0',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '18px', overflow: 'hidden',
    transition: 'box-shadow 0.2s, border-color 0.2s',
  },
  cardTop: {
    display: 'flex', alignItems: 'flex-start', gap: '13px',
    padding: '18px 18px 14px',
  },
  avatar: {
    width: '48px', height: '48px', flexShrink: 0,
    borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '16px', fontWeight: 600,
  },
  identity: { flex: 1, minWidth: 0 },
  nameRow: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' },
  name: {
    fontSize: '15px', fontWeight: 600, color: 'var(--text)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  editNameBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', display: 'flex', padding: '2px',
    opacity: 0.6, transition: 'opacity 0.15s', flexShrink: 0,
  },
  nameInput: {
    background: 'rgba(0,0,0,0.25)', border: '1px solid var(--accent-text)',
    borderRadius: '6px', padding: '3px 8px',
    fontSize: '14px', fontWeight: 600, color: 'var(--text)',
    outline: 'none', fontFamily: 'var(--font-outfit), sans-serif', width: '100%',
  },
  titleCaseBtn: {
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    borderRadius: '6px', padding: '4px 7px', cursor: 'pointer',
    color: 'var(--accent-text)', display: 'flex', alignItems: 'center', flexShrink: 0,
  },
  email: {
    fontSize: '12px', color: 'var(--text-3)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  joinDate: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' },
  planBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.3px',
    padding: '4px 10px', borderRadius: '100px', flexShrink: 0, whiteSpace: 'nowrap',
  },

  // Chips
  chipsRow: {
    display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
    padding: '0 18px 14px',
  },
  contribChip: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '100px',
    background: 'rgba(244,114,182,0.1)', color: '#f472b6',
    border: '1px solid rgba(244,114,182,0.22)',
  },
  formChip: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '100px',
    background: 'rgba(52,211,153,0.08)', color: '#34D399',
    border: '1px solid rgba(52,211,153,0.2)', cursor: 'pointer',
  },
  emptyChip: {
    fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic',
  },

  sep: { height: '1px', background: 'var(--border)', margin: '0 0' },

  // Actions
  actions: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '12px 14px',
  },
  planSelect: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '5px 10px',
    fontSize: '12px', fontWeight: 500, color: 'var(--text-2)',
    cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-outfit), sans-serif',
  },
  actionBtn: {
    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
    background: 'var(--surface)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-3)', transition: 'all 0.15s',
    textDecoration: 'none',
  },
  actionBtnDanger: {
    background: 'rgba(248,113,113,0.06)',
    border: '1px solid rgba(248,113,113,0.18)',
    color: '#f87171',
  },
}

// Panel styles
const ps: Record<string, React.CSSProperties> = {
  header: { padding: '20px 22px 16px', flexShrink: 0 },
  headerTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', fontWeight: 400, color: 'var(--text)' },
  closeBtn: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '8px', width: '32px', height: '32px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-3)',
  },
  viewFullBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    borderRadius: '9px', padding: '8px 14px',
    fontSize: '12px', fontWeight: 600, color: 'var(--accent-text)',
    textDecoration: 'none', width: '100%', boxSizing: 'border-box',
  },
  divider: { height: '1px', background: 'var(--border)', flexShrink: 0 },
  body: {
    flex: 1, overflowY: 'auto',
    scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent',
  } as React.CSSProperties,

  identityBlock: { padding: '20px 22px', display: 'flex', alignItems: 'flex-start', gap: '14px' },
  bigAvatar: {
    width: '54px', height: '54px', flexShrink: 0, borderRadius: '16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  bigAvatarText: { fontFamily: 'var(--font-fraunces), serif', fontSize: '20px', fontWeight: 600 },
  memberName: { fontSize: '16px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  memberEmail: { fontSize: '12px', color: 'var(--text-3)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  memberSince: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' },
  planPill: { fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '100px' },

  section: { padding: '18px 22px' },
  sectionLabel: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '14px' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
  statTile: { display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', border: '1px solid', borderRadius: '10px' },
  statNum: { fontFamily: 'var(--font-fraunces), serif', fontSize: '22px', fontWeight: 400, lineHeight: 1 },
  statLabel: { fontSize: '10px', color: 'var(--text-3)', lineHeight: 1.3 },
}
