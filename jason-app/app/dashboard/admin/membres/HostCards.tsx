'use client'

// Fiches carrées de la page Hôtes (24/11/2026, maquette validée par Jason,
// même principe que la page Pros) : couverture (photo du premier logement ou
// initiales), pastille d'activité, formule, avancement en 7 étapes (calcul de
// la fiche membre, lib/admin/host-journey.ts), compteurs, dernière visite.
// Le panneau reprend les réglages de l'ancienne carte (formule, investisseur,
// contributeur, nom, suppression). Nombres et dates seulement.

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  X, Crown, Star, Briefcase, Heart, Camera, Sparkle, Wrench, Copy, Check, UserCircle, Trash,
  PencilSimple, ClockCounterClockwise, GraduationCap, Warning,
} from '@phosphor-icons/react/dist/ssr'
import RelativeTime from '@/components/ui/RelativeTime'
import { activityLevel } from '@/lib/admin/activity'

export interface HostJourneyView {
  done: number
  niveau: string
  blocage: string | null
  steps: Array<{ key: string; title: string; state: 'fait' | 'en_cours' | 'a_faire' | 'probleme'; detail: string }>
}

export interface HostView {
  id: string; email: string; full_name: string | null
  role: string; plan: string
  is_contributor: boolean; is_investor: boolean | null
  is_photographer?: boolean; is_cleaner?: boolean; is_depannage?: boolean
  created_at: string
  last_seen_at?: string | null
  last_action?: { at: string; label: string } | null
  user_formations: Array<{ id: string; progress: number; enrolled_at: string; formation: { id: string; title: string; slug: string } | null }>
  cover_url?: string | null
  provenance?: string | null
  journey?: HostJourneyView | null
  counts?: { logements: number; sejours: number; contrats: number } | null
  feed?: Array<{ label: string; at: string }>
}

const AMBER = '#B7791F'
const BROWN = '#6E5446'
const RUST = '#A4502A'
const PINK = '#B83A7C'
const tint = (c: string, pct = 12) => `color-mix(in srgb, ${c} ${pct}%, transparent)`

export const LEVEL: Record<'actif' | 'tiede' | 'endormi', { label: string; short: string; color: string }> = {
  actif: { label: 'Vu cette semaine', short: 'Vu cette semaine', color: 'var(--accent-text)' },
  tiede: { label: 'À relancer', short: 'À relancer', color: AMBER },
  endormi: { label: 'Plus vu depuis 30 jours', short: 'Plus vu depuis 30 j', color: RUST },
}
const STEP: Record<HostJourneyView['steps'][number]['state'], { label: string; color: string; bg: string; border: string }> = {
  fait: { label: 'Fait', color: 'var(--accent-text)', bg: 'var(--accent-bg)', border: '1px solid transparent' },
  en_cours: { label: 'En cours', color: AMBER, bg: tint(AMBER, 14), border: '1px solid transparent' },
  probleme: { label: 'Problème', color: RUST, bg: tint(RUST, 12), border: '1px solid transparent' },
  a_faire: { label: 'À faire', color: 'var(--text-3)', bg: 'transparent', border: '1px dashed var(--border-2)' },
}
/** Ce qu'il reste à faire, en clair, pour la ligne sous la barre */
const NEXT: Record<string, string> = {
  logement: 'ajouter un logement', calendrier: 'connecter un calendrier', reservations: 'avoir des réservations',
  voyageurs: 'créer des fiches voyageurs', contrats: 'faire signer un contrat', paiements: 'activer les paiements en ligne',
  finances: 'suivre ses finances',
}
export const planInfo = (m: Pick<HostView, 'role' | 'plan'>) =>
  m.role === 'admin' ? { label: 'Admin', color: AMBER, Icon: Crown }
    : m.plan === 'driing' ? { label: 'Driing', color: AMBER, Icon: Star }
    : m.plan === 'standard' ? { label: 'Standard', color: 'var(--accent-text)', Icon: null }
    : { label: 'Découverte', color: 'var(--text-3)', Icon: null }

const initials = (m: HostView) => (m.full_name || m.email).split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'
const displayName = (m: HostView) => m.full_name || m.email.split('@')[0]
const dateFr = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })

export function hostLevel(m: HostView, nowMs: number) {
  return activityLevel(m.last_seen_at ?? null, new Date(nowMs))
}

function Cover({ m, height, nowMs, badges = true }: { m: HostView; height: number; nowMs: number; badges?: boolean }) {
  const lvl = LEVEL[hostLevel(m, nowMs)]
  const plan = planInfo(m)
  const color = m.plan === 'driing' || m.role === 'admin' ? AMBER : m.plan === 'standard' ? 'var(--accent-text)' : 'var(--text-3)'
  return (
    <div style={{
      position: 'relative', height, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: m.cover_url
        ? `center / cover no-repeat url(${JSON.stringify(m.cover_url)})`
        : `radial-gradient(120% 90% at 85% 0%, ${tint(color, 30)}, transparent 60%), linear-gradient(135deg, ${tint(color, 16)}, ${tint(color, 4)})`,
    }}>
      {!m.cover_url && <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: height > 110 ? 38 : 32, fontWeight: 500, color, opacity: 0.85 }}>{initials(m)}</span>}
      {badges && (
        <>
          <span style={{ ...h.badge, left: 10, maxWidth: 'calc(100% - 112px)', color: lvl.color }} title={lvl.label}>
            <i style={{ ...h.dot, background: lvl.color }} /> <span className="jm-host-lvl" style={h.ellipsis}>{lvl.short}</span>
          </span>
          <span style={{ ...h.badge, right: 10, color: plan.color }}>
            {plan.Icon && <plan.Icon size={11} weight="fill" />} {plan.label}
          </span>
        </>
      )}
    </div>
  )
}

function Steps({ j }: { j: HostJourneyView }) {
  return (
    <div style={{ display: 'flex', gap: 3 }} aria-label={`${j.done} étapes sur ${j.steps.length}`}>
      {j.steps.map(st => (
        <i key={st.key} title={`${st.title} : ${STEP[st.state].label}`} style={{
          flex: 1, height: 5, borderRadius: 99,
          background: st.state === 'fait' ? 'var(--accent-text)' : st.state === 'en_cours' ? AMBER : st.state === 'probleme' ? RUST : 'var(--bg-2)',
        }} />
      ))}
    </div>
  )
}

function Chips({ m }: { m: HostView }) {
  const chips: Array<{ label: string; color: string; Icon: typeof Star }> = []
  if (m.is_investor) chips.push({ label: 'Investisseur', color: BROWN, Icon: Briefcase })
  if (m.is_photographer) chips.push({ label: 'Aussi pro · Photo', color: PINK, Icon: Camera })
  if (m.is_cleaner) chips.push({ label: 'Aussi pro · Ménage', color: BROWN, Icon: Sparkle })
  if (m.is_depannage) chips.push({ label: 'Aussi pro · Dépannage', color: RUST, Icon: Wrench })
  if (m.is_contributor) chips.push({ label: 'Contributeur', color: PINK, Icon: Heart })
  if (!chips.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {chips.map(c => (
        <span key={c.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, color: c.color, background: tint(c.color, 13) }}>
          <c.Icon size={10} weight="fill" /> {c.label}
        </span>
      ))}
    </div>
  )
}

function CopyEmail({ email, style }: { email: string; style: React.CSSProperties }) {
  const [ok, setOk] = useState(false)
  return (
    <button type="button" style={style} onClick={async () => {
      try { await navigator.clipboard.writeText(email); setOk(true); setTimeout(() => setOk(false), 1600) } catch { /* presse-papier refusé */ }
    }} aria-label={`Copier ${email}`}>
      {ok ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />} {ok ? 'Copiée' : <><span className="jm-long">Copier l’e-mail</span><span className="jm-short">E-mail</span></>}
    </button>
  )
}

export function HostCard({ m, nowMs, onOpen, selected }: { m: HostView; nowMs: number; onOpen: () => void; selected: boolean }) {
  const j = m.journey
  const next = j?.steps.find(st => st.state !== 'fait')
  const formations = m.user_formations?.length ?? 0
  return (
    <div className="jm-host-card" style={{ ...h.card, ...(selected ? { outline: '2px solid var(--accent-text)', outlineOffset: 2 } : null) }}>
      <button type="button" onClick={onOpen} style={h.main} aria-label={`Ouvrir l’aperçu de ${displayName(m)}`}>
        <Cover m={m} height={118} nowMs={nowMs} />
        <div style={h.body}>
          <span style={h.name}>{displayName(m)}</span>
          <span style={h.sub}>{m.email}</span>
          <Chips m={m} />
          {j && (
            <>
              <div style={{ marginTop: 4 }}><Steps j={j} /></div>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                {j.done} étape{j.done > 1 ? 's' : ''} sur {j.steps.length}{next ? (next.state === 'probleme' ? ` · à régler : ${next.title.toLowerCase()}` : ` · ensuite : ${NEXT[next.key] ?? next.title.toLowerCase()}`) : ''}
              </span>
            </>
          )}
          <div style={h.stats}>
            {m.counts && <>
              <span><b style={h.b}>{m.counts.logements}</b> logement{m.counts.logements > 1 ? 's' : ''}</span>
              <span><b style={h.b}>{m.counts.sejours}</b> séjour{m.counts.sejours > 1 ? 's' : ''}</span>
              <span><b style={h.b}>{m.counts.contrats}</b> contrat{m.counts.contrats > 1 ? 's' : ''}</span>
            </>}
            {formations > 0 && <span><GraduationCap size={13} /> <b style={h.b}>{formations}</b></span>}
          </div>
          <span style={h.foot}>
            <ClockCounterClockwise size={13} />
            <span style={h.ellipsis}>
              {m.last_seen_at ? <>Vu <RelativeTime iso={m.last_seen_at} /></> : 'Jamais revenu'}
              {m.last_action ? ` · ${m.last_action.label.toLowerCase()}` : ''}
            </span>
          </span>
        </div>
      </button>
      <div style={h.acts}>
        <Link prefetch={false} href={`/dashboard/admin/membres/${m.id}`} style={h.act}><UserCircle size={14} weight="bold" /> <span className="jm-long">Fiche complète</span><span className="jm-short">Fiche</span></Link>
        <CopyEmail email={m.email} style={{ ...h.act, borderLeft: '1px solid var(--border)' }} />
      </div>
    </div>
  )
}

const PLANS = [
  { value: 'decouverte', label: 'Découverte' },
  { value: 'standard', label: 'Standard' },
  { value: 'driing', label: 'Membre Driing' },
]

export function HostPanel({ m, nowMs, busy, feedback, onClose, onChangePlan, onToggleInvestor, onToggleContrib, onDelete, onSaveName }: {
  m: HostView
  nowMs: number
  busy: boolean
  feedback: { type: 'ok' | 'err'; msg: string } | null
  onClose: () => void
  onChangePlan: (plan: string) => void
  onToggleInvestor: () => void
  onToggleContrib: () => void
  onDelete: () => void
  onSaveName: (name: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(m.full_name ?? '')
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => { setName(m.full_name ?? ''); setEditing(false) }, [m.id, m.full_name])
  useEffect(() => { if (editing) input.current?.focus() }, [editing])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !editing) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, editing])

  const plan = planInfo(m)
  const isAdmin = m.role === 'admin'
  const j = m.journey
  const save = () => {
    setEditing(false)
    const v = name.trim()
    if (v && v !== (m.full_name ?? '')) onSaveName(v)
  }

  return (
    <>
      <div style={h.backdrop} onClick={onClose} aria-hidden />
      <aside role="dialog" aria-modal="true" aria-label={`Aperçu de ${displayName(m)}`} className="jm-host-panel" style={h.panel}>
        <div style={{ position: 'relative' }}>
          <Cover m={m} height={104} nowMs={nowMs} badges={false} />
          <button type="button" onClick={onClose} style={h.close} aria-label="Fermer"><X size={16} weight="bold" /></button>
        </div>
        <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ ...h.sec, color: plan.color }}>Hôte · {plan.label}</span>
            {editing ? (
              <input ref={input} value={name} onChange={e => setName(e.target.value)} onBlur={save}
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setName(m.full_name ?? ''); setEditing(false) } }}
                style={h.nameInput} aria-label="Nom" />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={h.pname}>{displayName(m)}</h2>
                {!isAdmin && <button type="button" onClick={() => setEditing(true)} style={h.iconBtn} aria-label="Modifier le nom"><PencilSimple size={13} /></button>}
              </div>
            )}
            <span style={{ fontSize: 13, color: 'var(--text-3)', overflowWrap: 'anywhere' }}>
              {m.email} · inscrit le {dateFr(m.created_at)}{m.provenance ? ` · arrivé par ${m.provenance}` : ''}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {(() => { const l = LEVEL[hostLevel(m, nowMs)]; return <span style={{ ...h.pill, color: l.color, background: tint(l.color, 12) }}><i style={{ ...h.dot, background: l.color }} /> {l.label}</span> })()}
              <Chips m={m} />
            </div>
          </div>

          {m.counts && (
            <div style={h.tiles}>
              {([['logements', m.counts.logements], ['séjours', m.counts.sejours], ['contrats', m.counts.contrats]] as const).map(([l, v]) => (
                <div key={l} style={h.tile}><strong style={h.tileNum}>{v}</strong>{l}</div>
              ))}
            </div>
          )}

          {j && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={h.sec}>Son démarrage · {j.done} sur {j.steps.length} · {j.niveau}</span>
              {j.blocage && (
                <div style={h.blocage}><Warning size={15} weight="fill" color={AMBER} style={{ flexShrink: 0, marginTop: 1 }} /> {j.blocage}</div>
              )}
              <div style={h.box}>
                {j.steps.map((st, i) => (
                  <div key={st.key} style={{ ...h.row, ...(i ? { borderTop: '1px solid var(--border)' } : null) }}>
                    <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: 13.5, color: 'var(--text)' }}>{st.title}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{st.detail}</span>
                    </span>
                    <span style={{ ...h.pill, color: STEP[st.state].color, background: STEP[st.state].bg, border: STEP[st.state].border }}>{STEP[st.state].label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={h.sec}>Son activité</span>
            <div style={h.box}>
              {[
                ...(m.last_seen_at ? [{ label: 'Dernière visite', at: m.last_seen_at }] : []),
                ...(m.feed ?? []),
              ].map((e, i) => (
                <div key={`${e.label}-${i}`} style={{ ...h.row, ...(i ? { borderTop: '1px solid var(--border)' } : null) }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                    <i style={{ ...h.dot, background: i === 0 ? 'var(--accent-text)' : 'var(--border-2)' }} />
                    <span style={{ fontSize: 13.5, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.label}</span>
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-3)', whiteSpace: 'nowrap' }}><RelativeTime iso={e.at} /></span>
                </div>
              ))}
              {!m.last_seen_at && !(m.feed ?? []).length && <div style={{ ...h.row, color: 'var(--text-3)', fontSize: 13 }}>Aucune activité enregistrée.</div>}
            </div>
          </div>

          {!isAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={h.sec}>Formule et accès</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <select value={m.plan || 'decouverte'} disabled={busy} onChange={e => onChangePlan(e.target.value)} style={h.select} aria-label="Formule">
                  {PLANS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <button type="button" disabled={busy} onClick={onToggleInvestor} aria-pressed={!!m.is_investor} style={{ ...h.btn, ...(m.is_investor ? h.btnOn : null) }}>
                  <Briefcase size={14} weight={m.is_investor ? 'fill' : 'regular'} /> Investisseur
                </button>
                <button type="button" disabled={busy} onClick={onToggleContrib} aria-pressed={m.is_contributor} style={{ ...h.btn, ...(m.is_contributor ? h.btnOn : null) }}>
                  <Heart size={14} weight={m.is_contributor ? 'fill' : 'regular'} /> Contributeur
                </button>
              </div>
              {feedback && <span role="status" style={{ fontSize: 13, color: feedback.type === 'ok' ? 'var(--accent-text)' : 'var(--danger)' }}>{feedback.msg}</span>}
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Link prefetch={false} href={`/dashboard/admin/membres/${m.id}`} style={h.btnPrimary}><UserCircle size={15} weight="bold" /> Ouvrir la fiche complète</Link>
            <CopyEmail email={m.email} style={h.btn} />
            {!isAdmin && <button type="button" disabled={busy} onClick={onDelete} style={h.btnDanger}><Trash size={14} weight="bold" /> Supprimer le compte</button>}
          </div>
        </div>
      </aside>
    </>
  )
}

export const HOST_CSS = `
.jm-host-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr)); }
.jm-host-card { transition: transform .18s ease, box-shadow .18s ease; }
.jm-host-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
.jm-host-panel { animation: jmHostIn .22s ease; }
@keyframes jmHostIn { from { transform: translateX(24px); opacity: 0 } to { transform: none; opacity: 1 } }
.jm-short { display: none; }
@media (max-width: 640px) {
  .jm-host-lvl, .jm-long { display: none; }
  .jm-short { display: inline; }
  .jm-host-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .jm-host-panel { width: 100% !important; }
}
@media (prefers-reduced-motion: reduce) { .jm-host-card, .jm-host-panel { transition: none; animation: none; } }
`

const h: Record<string, React.CSSProperties> = {
  card: { display: 'flex', flexDirection: 'column', borderRadius: 18, overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', minWidth: 0 },
  main: { display: 'flex', flexDirection: 'column', flex: 1, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'var(--text)', minWidth: 0 },
  badge: { position: 'absolute', top: 10, display: 'inline-flex', alignItems: 'center', gap: 5, maxWidth: 'calc(100% - 20px)', width: 'fit-content', padding: '4px 9px', borderRadius: 999, background: 'var(--surface)', boxShadow: 'var(--card-shadow)', fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden' },
  ellipsis: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 },
  dot: { width: 7, height: 7, borderRadius: 99, display: 'inline-block', flexShrink: 0 },
  body: { display: 'flex', flexDirection: 'column', gap: 5, padding: '13px 15px', flex: 1, minWidth: 0 },
  name: { fontSize: 16, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  sub: { fontSize: 12.5, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  stats: { display: 'flex', gap: '4px 12px', flexWrap: 'wrap', alignItems: 'center', marginTop: 'auto', paddingTop: 9, borderTop: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-2)' },
  b: { color: 'var(--text)', fontWeight: 600 },
  foot: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-3)', minWidth: 0 },
  acts: { display: 'flex', borderTop: '1px solid var(--border)' },
  act: { flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 6px', fontSize: 12.5, fontWeight: 600, color: 'var(--accent-text)', textDecoration: 'none', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', minWidth: 0, whiteSpace: 'nowrap' },
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 80 },
  panel: { position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(440px, 100%)', background: 'var(--bg)', borderLeft: '1px solid var(--border)', zIndex: 81, overflowY: 'auto', boxShadow: 'var(--shadow-md)' },
  close: { position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  sec: { fontSize: 11.5, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--text-3)' },
  pname: { margin: 0, fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 26, lineHeight: 1.15, overflowWrap: 'anywhere' },
  nameInput: { fontFamily: 'var(--font-fraunces), serif', fontSize: 22, padding: '6px 10px', borderRadius: 10, border: '1px solid var(--accent-text)', background: 'var(--surface)', color: 'var(--text)', width: '100%' },
  iconBtn: { width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  pill: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' },
  tiles: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 },
  tile: { display: 'flex', flexDirection: 'column', padding: '10px 12px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-3)' },
  tileNum: { fontFamily: 'var(--font-fraunces), serif', fontWeight: 500, fontSize: 20, color: 'var(--text)' },
  blocage: { display: 'flex', gap: 8, padding: '10px 12px', borderRadius: 12, background: tint(AMBER, 10), fontSize: 13, color: 'var(--text-2)', lineHeight: 1.45 },
  box: { display: 'flex', flexDirection: 'column', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', padding: '0 14px' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 0', minWidth: 0 },
  select: { padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none' },
  btnOn: { border: '1px solid var(--accent-text)', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 13px', borderRadius: 10, border: '1px solid var(--accent-text)', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 13, fontWeight: 600, textDecoration: 'none' },
  btnDanger: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)', background: 'var(--surface)', color: 'var(--danger)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
}
