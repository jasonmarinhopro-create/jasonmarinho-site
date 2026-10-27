'use client'

// Atelier de Ma fiche (27/10/2026, maquettes validées par Jason : « une
// expérience moderne, élégante, qui n'a rien à voir avec ce qu'ils ont connu »).
// Coquille commune aux photographes et aux équipes de ménage :
// - parties rangées par fréquence de modification (vitrine, offre, histoire,
//   contact, puis ce qu'on touche rarement), chacune résumée en une ligne ;
// - une partie ouverte à la fois, « Partie suivante » en bas ;
// - barre de mise en ligne : tout est enregistré tout seul, la fiche publique
//   change au clic « Mettre en ligne » (une reconstruction du site, pas dix) ;
// - « Revoir » liste ce qui va changer, avec « Annuler » par partie ;
// - au téléphone : la liste des parties, puis chaque partie en plein écran.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, ArrowLeft, ArrowSquareOut, CheckCircle, Check, CaretRight, PaperPlaneTilt, Warning, CircleNotch, Eye } from '@phosphor-icons/react/dist/ssr'
import { listeFr, pendingLabel } from '@/lib/pros/fiche-draft'
import type { SaveStatus } from './useFicheDraft'
import { ui } from './ui'

export interface AtelierSection {
  id: string
  group: string
  label: string
  icon: ReactNode
  /** Une ligne : « 3 formules, dès 230 € » */
  summary: string
  /** À reprendre (texte ambre dans la liste) */
  attention?: string | null
  /** Rien à faire de plus */
  done?: boolean
  title: ReactNode
  desc?: ReactNode
  content: ReactNode
  /** Déjà écrit en base (photos, logo) : pas d'« Annuler » dans Revoir */
  noRevert?: boolean
}

export type PublishState =
  | { kind: 'idle' }
  | { kind: 'publishing' }
  | { kind: 'done'; live: boolean; warning?: string; rebuildFailed?: boolean }
  | { kind: 'error'; message: string; section?: string }

export interface AtelierProps {
  eyebrow: string
  displayName: string
  logoUrl: string | null
  statusLabel: string
  isActive: boolean
  publicUrl: string | null
  stats: Array<[number, string]>
  headerActions?: ReactNode
  banners?: ReactNode
  sections: AtelierSection[]
  active: string
  onActive: (id: string) => void
  pending: string[]
  saveStatus: SaveStatus
  saveError?: string | null
  publish: PublishState
  onPublish: () => void
  onRevert: (ids: string[]) => void
  side: ReactNode
}

function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 899px)')
    const on = () => setNarrow(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return narrow
}

function initials(name: string): string {
  return (name || '?').split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function Atelier(p: AtelierProps) {
  const narrow = useNarrow()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)
  const current = p.sections.find(s => s.id === p.active) ?? p.sections[0]
  const idx = p.sections.indexOf(current)
  const next = p.sections[idx + 1]
  const pendingSet = new Set(p.pending)
  const groups = p.sections.reduce<Array<{ name: string; items: AtelierSection[] }>>((acc, s) => {
    const g = acc.find(x => x.name === s.group)
    if (g) g.items.push(s); else acc.push({ name: s.group, items: [s] })
    return acc
  }, [])

  function open(id: string) {
    p.onActive(id)
    // Au téléphone : la partie en plein écran, en haut de la page
    if (narrow) { setMobileOpen(true); requestAnimationFrame(() => window.scrollTo({ top: 0 })) }
    else requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  function closeMobile() {
    setMobileOpen(false)
    requestAnimationFrame(() => window.scrollTo({ top: 0 }))
  }

  // Une erreur à la mise en ligne ouvre la partie concernée
  useEffect(() => {
    if (p.publish.kind === 'error' && p.publish.section) { p.onActive(p.publish.section); if (narrow) setMobileOpen(true) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.publish])

  const pendingNames = p.sections.filter(s => pendingSet.has(s.id)).map(s => s.label.toLowerCase())

  const bar = (
    <PublishBar
      narrow={narrow}
      count={p.pending.length}
      names={pendingNames}
      saveStatus={p.saveStatus}
      saveError={p.saveError}
      publish={p.publish}
      isActive={p.isActive}
      publicUrl={p.publicUrl}
      onPublish={p.onPublish}
      onReview={() => setReviewOpen(true)}
    />
  )

  const rail = (
    <nav aria-label="Parties de ta fiche" style={narrow ? { display: 'flex', flexDirection: 'column', gap: 14 } : a.rail}>
      {groups.map(g => (
        <div key={g.name} style={narrow ? a.mGroup : undefined}>
          <div style={narrow ? a.mGroupName : a.groupName}>{g.name}</div>
          <div style={narrow ? a.mList : undefined}>
            {g.items.map((s, i) => {
              const on = !narrow && s.id === current.id
              const isPending = pendingSet.has(s.id)
              return (
                <button key={s.id} type="button" onClick={() => open(s.id)} aria-current={on ? 'page' : undefined}
                  style={{ ...(narrow ? a.mItem : a.item), ...(on ? a.itemOn : {}), ...(narrow && i < g.items.length - 1 ? { borderBottom: '1px solid var(--border)' } : {}) }}>
                  {!narrow && <span style={{ ...a.itemIcon, ...(on ? a.itemIconOn : s.attention ? a.itemIconWarn : {}) }}>{s.icon}</span>}
                  <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <span style={{ ...a.itemLabel, color: on ? '#fff' : 'var(--text)' }}>{s.label}</span>
                    <span style={{ ...a.itemSum, color: on ? 'rgba(255,255,255,.75)' : s.attention ? '#8A5A12' : 'var(--text-3)' }}>{s.attention || s.summary}</span>
                  </span>
                  {isPending
                    ? <span role="img" aria-label="Modifié, pas encore en ligne" style={a.dot} />
                    : s.done && !on ? <Check size={15} weight="bold" color="var(--accent-text)" aria-label="Fait" /> : null}
                  {narrow && <CaretRight size={15} color="var(--text-3)" aria-hidden="true" />}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )

  const sectionView = (
    <section style={a.card} aria-labelledby={`atelier-${current.id}`}>
      {narrow && (
        <div style={a.mTop}>
          <button type="button" onClick={closeMobile} style={a.mBack}><ArrowLeft size={17} weight="bold" /> Ma fiche</button>
          <SaveBadge status={p.saveStatus} compact />
          <button type="button" onClick={closeMobile} style={a.mDone}>Terminé</button>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: '1 1 320px' }}>
          <div style={a.eyebrow}>{current.group}</div>
          <h2 id={`atelier-${current.id}`} style={a.h2}>{current.title}</h2>
          {current.desc && <p style={a.desc}>{current.desc}</p>}
        </div>
        {!narrow && <SaveBadge status={p.saveStatus} />}
      </div>
      <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 20 }}>{current.content}</div>
      {next && (
        <button type="button" onClick={() => open(next.id)} style={a.next}>
          <span style={a.nextL}>Partie suivante</span>
          <span style={a.nextT}>{next.label}</span>
          <span style={a.nextS}>{next.summary}</span>
          <ArrowRight size={18} weight="bold" color="var(--accent-text)" />
        </button>
      )}
    </section>
  )

  const fullScreen = narrow && mobileOpen
  return (
    <div style={a.wrap}>
      {!fullScreen && <header style={a.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: '1 1 340px', minWidth: 0 }}>
          <span style={{ ...a.avatar, ...(p.logoUrl ? { backgroundImage: `url('${p.logoUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : {}) }} aria-hidden="true">{initials(p.displayName)}</span>
          <div style={{ minWidth: 0 }}>
            <div style={a.headEyebrow}>{p.eyebrow}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={a.h1}>L’atelier de ta fiche</h1>
              <span style={{ ...a.pill, ...(p.isActive ? {} : a.pillWait) }}>
                <span style={{ ...a.pillDot, background: p.isActive ? '#1F8A5B' : '#B7791F' }} />{p.statusLabel}
              </span>
            </div>
          </div>
        </div>
        <div style={a.stats}>
          {p.stats.map(([v, l]) => (
            <div key={l} style={a.stat}><span style={a.statV}>{v}</span><span style={a.statL}>{l}</span></div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {p.headerActions}
          {p.isActive && p.publicUrl && (
            <a href={p.publicUrl} target="_blank" rel="noopener noreferrer" style={a.viewBtn}>
              <Eye size={16} weight="bold" /> Voir ma fiche publique
            </a>
          )}
        </div>
      </header>}

      {!narrow && bar}
      {!fullScreen && p.banners}

      <div ref={topRef} style={{ scrollMarginTop: 80 }} />
      {narrow ? (
        <div style={{ paddingBottom: 96 }}>
          {mobileOpen ? sectionView : rail}
          {!mobileOpen && <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>{p.side}</div>}
        </div>
      ) : (
        <div style={a.cols}>
          <div style={a.colRail}>{rail}</div>
          <div style={a.colMain}>{sectionView}</div>
          <aside style={a.colSide}>{p.side}</aside>
        </div>
      )}

      {narrow && bar}
      {reviewOpen && (
        <ReviewDialog
          sections={p.sections.filter(s => pendingSet.has(s.id))}
          onClose={() => setReviewOpen(false)}
          onRevert={ids => p.onRevert(ids)}
          onPublish={() => { setReviewOpen(false); p.onPublish() }}
        />
      )}
    </div>
  )
}

export function SaveBadge({ status, compact }: { status: SaveStatus; compact?: boolean }) {
  if (status === 'idle') return null
  const map: Record<Exclude<SaveStatus, 'idle'>, [string, string, string]> = {
    saving: ['Enregistrement…', 'var(--text-3)', 'var(--bg)'],
    saved: ['Enregistré', 'var(--accent-text)', 'var(--accent-bg)'],
    local: ['Gardé sur cet appareil, on réessaie', '#8A5A12', 'rgba(255,213,107,.22)'],
    error: ['Non enregistré', 'var(--danger-text)', 'var(--danger-bg)'],
  }
  const [full, color, bg] = map[status]
  const label = compact && status === 'local' ? 'Sur l’appareil' : full
  return (
    <span role="status" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color, background: bg, padding: '6px 11px', borderRadius: 999, whiteSpace: 'nowrap' }}>
      {status === 'saving' ? <CircleNotch size={13} weight="bold" style={{ animation: 'spin 1s linear infinite' }} /> : status === 'saved' ? <Check size={13} weight="bold" /> : <Warning size={13} weight="bold" />}
      {label}
    </span>
  )
}

function PublishBar({ narrow, count, names, saveStatus, saveError, publish, isActive, publicUrl, onPublish, onReview }: {
  narrow: boolean; count: number; names: string[]; saveStatus: SaveStatus; saveError?: string | null
  publish: PublishState; isActive: boolean; publicUrl: string | null; onPublish: () => void; onReview: () => void
}) {
  const fixed: React.CSSProperties = narrow
    ? { position: 'fixed', left: 10, right: 10, bottom: 'max(12px, env(safe-area-inset-bottom))', zIndex: 60, borderRadius: 18, boxShadow: '0 14px 34px rgba(0,26,17,.3)' }
    : { position: 'sticky', top: 0, zIndex: 30, borderRadius: 16, marginBottom: 18 }

  if (publish.kind === 'publishing') {
    return (
      <div style={{ ...b.dark, ...fixed }} role="status">
        <CircleNotch size={18} weight="bold" color="#FFD56B" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 14 }}><strong style={{ fontWeight: 600 }}>Mise en ligne en cours…</strong></span>
      </div>
    )
  }
  if (publish.kind === 'done' && count === 0) {
    return (
      <div style={{ ...b.ok, ...fixed }} role="status">
        <CheckCircle size={20} weight="fill" color="var(--accent-text)" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 14, lineHeight: 1.45 }}>
          {publish.rebuildFailed
            ? <><strong>Enregistré.</strong> La mise à jour du site n’a pas pu partir : réessaie dans quelques minutes.</>
            : publish.live
              ? <><strong>C’est parti.</strong> Ta fiche publique change dans 2 à 3 minutes.</>
              : <><strong>Enregistré.</strong> Ta fiche apparaîtra avec ces informations dès qu’elle sera en ligne.</>}
          {publish.warning && <span style={{ display: 'block', fontSize: 12.5, color: 'var(--text-2)' }}>{publish.warning}</span>}
        </span>
        {publish.live && publicUrl && !narrow && (
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" style={b.okLink}>Voir ma fiche <ArrowSquareOut size={13} weight="bold" /></a>
        )}
      </div>
    )
  }
  if (count === 0) {
    if (narrow) return null
    return (
      <div style={{ ...b.calm, ...fixed }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? '#1F8A5B' : '#B7791F', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13.5, color: 'var(--text-2)' }}>
          {isActive ? <><strong style={{ color: 'var(--text)', fontWeight: 600 }}>Tout est en ligne.</strong> Chaque changement s’enregistre tout seul.</> : <>Chaque changement s’enregistre tout seul.</>}
        </span>
        <SaveBadge status={saveStatus} />
      </div>
    )
  }
  return (
    <div style={{ ...b.dark, ...fixed, ...(narrow ? { padding: '10px 10px 10px 16px' } : {}) }}>
      {!narrow && <span style={b.dotWrap}><span style={b.dotY} /></span>}
      <span style={{ flex: 1, minWidth: 0, fontSize: narrow ? 13 : 14, lineHeight: 1.4 }}>
        <strong style={{ fontWeight: 600 }}>{pendingLabel(count)}</strong>{' '}
        <span style={{ color: 'rgba(255,255,255,.72)' }}>
          {narrow ? 'pas encore en ligne' : <>enregistrée{count > 1 ? 's' : ''}, pas encore sur ta fiche publique : {listeFr(names)}</>}
        </span>
        {publish.kind === 'error' && <span style={{ display: 'block', color: '#FFD56B', fontSize: 12.5, marginTop: 2 }}>{publish.message}</span>}
        {saveStatus === 'local' && !narrow && <span style={{ display: 'block', color: '#FFD56B', fontSize: 12.5, marginTop: 2 }}>Réseau instable : tes modifications sont gardées sur cet appareil.</span>}
        {saveStatus === 'error' && saveError && <span style={{ display: 'block', color: '#FFD56B', fontSize: 12.5, marginTop: 2 }}>{saveError}</span>}
      </span>
      {!narrow && <button type="button" onClick={onReview} style={b.review}>Revoir</button>}
      <button type="button" onClick={onPublish} style={b.publish}><PaperPlaneTilt size={16} weight="bold" /> Mettre en ligne</button>
    </div>
  )
}

function ReviewDialog({ sections, onClose, onRevert, onPublish }: {
  sections: AtelierSection[]; onClose: () => void; onRevert: (ids: string[]) => void; onPublish: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
  }, [])
  useEffect(() => { if (!sections.length) onClose() }, [sections.length, onClose])
  return (
    <dialog ref={ref} onClose={onClose} onCancel={onClose} aria-labelledby="atelier-review-t" style={b.dialog}>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 id="atelier-review-t" style={{ margin: 0, fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 24 }}>Ce qui va changer sur ta fiche</h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
          {sections.map(s => (
            <li key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={b.revIcon}>{s.icon}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600 }}>{s.label}</span>
                <span style={{ display: 'block', fontSize: 12.5, color: 'var(--text-3)' }}>{s.summary}</span>
              </span>
              {s.noRevert
                ? <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Déjà enregistré</span>
                : <button type="button" onClick={() => onRevert([s.id])} style={b.undo}>Annuler</button>}
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
          <button type="button" onClick={onClose} style={ui.btnGhost}>Continuer à modifier</button>
          <button type="button" onClick={onPublish} style={{ ...b.publish, background: 'var(--accent-text)', color: '#fff' }}>
            <PaperPlaneTilt size={16} weight="bold" /> Tout mettre en ligne
          </button>
        </div>
      </div>
    </dialog>
  )
}

const a: Record<string, React.CSSProperties> = {
  wrap: { padding: 'clamp(16px, 3vw, 36px)', width: '100%', boxSizing: 'border-box' },
  header: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px 24px', marginBottom: 18 },
  avatar: { width: 52, height: 52, borderRadius: 16, background: 'var(--accent-text)', color: '#FFD56B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-fraunces), serif', fontSize: 20, flexShrink: 0, border: '1px solid var(--border)' },
  headEyebrow: { fontSize: 12.5, color: 'var(--text-3)', letterSpacing: '.02em' },
  h1: { margin: 0, fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 'clamp(24px, 3vw, 30px)', letterSpacing: '-.4px', color: 'var(--text)' },
  pill: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px', borderRadius: 999, background: 'var(--accent-bg)', color: 'var(--accent-text)', fontSize: 12.5, fontWeight: 600 },
  pillWait: { background: 'rgba(255,213,107,.22)', color: '#8A5A12' },
  pillDot: { width: 7, height: 7, borderRadius: '50%' },
  stats: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  stat: { display: 'flex', alignItems: 'baseline', gap: 6, padding: '8px 12px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' },
  statV: { fontFamily: 'var(--font-fraunces), serif', fontSize: 19, color: 'var(--text)' },
  statL: { fontSize: 12, color: 'var(--text-3)' },
  viewBtn: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 16px', borderRadius: 12, border: '1px solid var(--accent-border)', background: 'var(--surface)', color: 'var(--accent-text)', textDecoration: 'none', fontSize: 14, fontWeight: 600, minHeight: 44, boxSizing: 'border-box' },
  cols: { display: 'flex', flexWrap: 'wrap', gap: 22, alignItems: 'flex-start' },
  colRail: { flex: '1 1 250px', maxWidth: 290, minWidth: 0, position: 'sticky', top: 84 },
  colMain: { flex: '999 1 560px', minWidth: 0 },
  colSide: { flex: '1 1 320px', maxWidth: 380, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 },
  rail: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 8, display: 'flex', flexDirection: 'column' },
  groupName: { fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-3)', padding: '12px 10px 6px' },
  item: { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: 10, borderRadius: 12, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' },
  itemOn: { background: 'var(--accent-text)' },
  itemIcon: { width: 32, height: 32, borderRadius: 10, background: 'var(--accent-bg)', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  itemIconOn: { background: 'rgba(255,213,107,.18)', color: '#FFD56B' },
  itemIconWarn: { background: 'rgba(255,213,107,.25)', color: '#8A5A12' },
  itemLabel: { display: 'block', fontSize: 14, fontWeight: 600, lineHeight: 1.3 },
  itemSum: { display: 'block', fontSize: 12, lineHeight: 1.35, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  dot: { width: 9, height: 9, borderRadius: '50%', background: '#FFD56B', boxShadow: '0 0 0 1.5px #B7791F', flexShrink: 0 },
  mGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  mGroupName: { fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-3)', padding: '0 6px' },
  mList: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' },
  mItem: { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 14px', minHeight: 58, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 22, padding: 'clamp(18px, 3vw, 32px)' },
  eyebrow: { fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-3)' },
  h2: { margin: '6px 0 6px', fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 'clamp(24px, 3vw, 30px)', letterSpacing: '-.4px', color: 'var(--text)' },
  desc: { margin: 0, fontSize: 14.5, lineHeight: 1.6, color: 'var(--text-2)', maxWidth: 620 },
  next: { marginTop: 26, display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '16px 18px', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', flexWrap: 'wrap' },
  nextL: { fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-3)' },
  nextT: { fontFamily: 'var(--font-fraunces), serif', fontSize: 18, color: 'var(--text)', flex: 1 },
  nextS: { fontSize: 12.5, color: 'var(--text-3)' },
  mTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, margin: '-6px -6px 14px', paddingBottom: 10, borderBottom: '1px solid var(--border)' },
  mBack: { display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', border: 'none', background: 'transparent', color: 'var(--accent-text)', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, padding: '10px 6px', minHeight: 44, cursor: 'pointer' },
  mDone: { border: 'none', background: 'transparent', color: 'var(--accent-text)', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, padding: '10px 8px', minHeight: 44, cursor: 'pointer' },
}

const b: Record<string, React.CSSProperties> = {
  dark: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px 12px 18px', background: '#003329', color: '#fff' },
  calm: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)' },
  ok: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--text)' },
  okLink: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13.5, fontWeight: 600, color: 'var(--accent-text)', padding: '8px 10px', whiteSpace: 'nowrap' },
  dotWrap: { width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,213,107,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dotY: { width: 9, height: 9, borderRadius: '50%', background: '#FFD56B' },
  review: { border: '1px solid rgba(255,255,255,.25)', background: 'transparent', color: '#fff', borderRadius: 11, padding: '10px 14px', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', minHeight: 44, whiteSpace: 'nowrap' },
  publish: { display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', background: '#FFD56B', color: '#003329', borderRadius: 12, padding: '11px 18px', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44, whiteSpace: 'nowrap' },
  dialog: { border: 'none', borderRadius: 22, padding: 0, margin: 'auto', position: 'fixed', inset: 0, height: 'fit-content', maxHeight: 'calc(100dvh - 32px)', overflow: 'auto', width: 'min(560px, calc(100vw - 32px))', background: 'var(--surface)', color: 'var(--text)', boxShadow: '0 30px 80px rgba(0,20,14,.35)' },
  revIcon: { width: 34, height: 34, borderRadius: 10, background: 'var(--accent-bg)', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  undo: { border: 'none', background: 'transparent', color: 'var(--text-2)', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', padding: '8px 6px' },
}
