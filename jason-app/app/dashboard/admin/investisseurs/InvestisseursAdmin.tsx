'use client'

// Admin Investisseurs en fiches carrées (24/11/2026, maquette validée par
// Jason) : même principe que les pages Pros et Hôtes. La fiche met en avant le
// dernier projet d'achat enregistré dans l'estimateur ; le panneau liste tous
// ses projets et permet de changer sa formule ou de retirer « Investisseur ».

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Briefcase, FolderOpen, MagnifyingGlass, X, UserCircle, Copy, Check, House, ClockCounterClockwise,
  SquaresFour, Rows, Pulse,
} from '@phosphor-icons/react/dist/ssr'
import AdminHero from '../_ui/AdminHero'
import InlineStyle from '@/components/ui/InlineStyle'
import RelativeTime from '@/components/ui/RelativeTime'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { activityLevel } from '@/lib/admin/activity'
import { changeUserPlan, toggleInvestor } from '../actions'

export interface InvestorProject {
  id: string
  user_id: string
  nom: string
  ville: string | null
  pays: string
  type_logement: string
  nb_chambres?: number | null
  prix_achat: number | null
  mensualite: number | null
  created_at: string
}

export interface InvestorRow {
  id: string
  email: string
  full_name: string | null
  plan: string
  role?: string
  created_at: string
  projects: InvestorProject[]
  logements: number
  last_seen_at: string | null
}

const BROWN = '#6E5446'
const AMBER = '#B7791F'
const RUST = '#A4502A'
const tint = (c: string, pct = 12) => `color-mix(in srgb, ${c} ${pct}%, transparent)`
const LEVEL = {
  actif: { label: 'Vu cette semaine', color: 'var(--accent-text)' },
  tiede: { label: 'À relancer', color: AMBER },
  endormi: { label: 'Plus vu depuis 30 j', color: RUST },
} as const
// Mêmes libellés que l'estimateur (app/dashboard/simulateurs/SimulateursUI.tsx)
const TYPES: Record<string, string> = { studio: 'Studio', t1: 'T1 / 1 chambre', t2: 'T2 / 2 pièces', t3: 'T3 / 3 pièces', maison: 'Maison entière' }
const PLANS = [{ value: 'decouverte', label: 'Découverte' }, { value: 'standard', label: 'Standard' }, { value: 'driing', label: 'Membre Driing' }]
const planLabel = (p: string) => PLANS.find(x => x.value === p)?.label ?? 'Découverte'

const eur = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} €`
const keur = (n: number) => (n >= 10_000 ? `${Math.round(n / 1000).toLocaleString('fr-FR')} k€` : eur(n))
const typeLabel = (t: string) => TYPES[t] ?? (t ? t[0].toUpperCase() + t.slice(1) : '')
const initials = (r: InvestorRow) => (r.full_name || r.email).split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'
const nameOf = (r: InvestorRow) => r.full_name || r.email.split('@')[0]
const budget = (r: InvestorRow) => r.projects.reduce((s, p) => s + (p.prix_achat ?? 0), 0)
const dateFr = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })

function projectLines(p: InvestorProject) {
  const where = [p.ville || p.pays, typeLabel(p.type_logement), p.nb_chambres ? `${p.nb_chambres} chambre${p.nb_chambres > 1 ? 's' : ''}` : null].filter(Boolean).join(' · ')
  const money = [p.prix_achat ? eur(p.prix_achat) : 'Prix non saisi', p.mensualite ? `${eur(p.mensualite)} par mois` : 'mensualité non saisie'].join(' · ')
  return { where, money }
}

type Filtre = 'tous' | 'projet' | 'sans' | 'actif' | 'hote'
const VIEW_KEY = 'jm-admin-investisseurs-vue'

export default function InvestisseursAdmin({ investors, nowMs }: { investors: InvestorRow[]; nowMs: number }) {
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [vue, setVue] = useState<'grille' | 'liste'>('grille')
  const [openId, setOpenId] = useState<string | null>(null)
  useEffect(() => { try { if (localStorage.getItem(VIEW_KEY) === 'liste') setVue('liste') } catch { /* stockage indisponible */ } }, [])
  const changeVue = (v: 'grille' | 'liste') => { setVue(v); try { localStorage.setItem(VIEW_KEY, v) } catch { /* stockage indisponible */ } }

  const level = (r: InvestorRow) => activityLevel(r.last_seen_at, new Date(nowMs))
  const totalProjects = investors.reduce((s, r) => s + r.projects.length, 0)
  const counts = {
    projet: investors.filter(r => r.projects.length > 0).length,
    sans: investors.filter(r => r.projects.length === 0).length,
    actif: investors.filter(r => level(r) === 'actif').length,
    hote: investors.filter(r => r.logements > 0).length,
  }
  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    return investors
      .filter(r => filtre === 'tous' || (filtre === 'projet' ? r.projects.length > 0 : filtre === 'sans' ? r.projects.length === 0 : filtre === 'hote' ? r.logements > 0 : activityLevel(r.last_seen_at, new Date(nowMs)) === 'actif'))
      .filter(r => !q || r.email.toLowerCase().includes(q) || (r.full_name ?? '').toLowerCase().includes(q)
        || r.projects.some(p => p.nom.toLowerCase().includes(q) || (p.ville ?? '').toLowerCase().includes(q)))
      .sort((a, b) => (b.last_seen_at ? Date.parse(b.last_seen_at) : 0) - (a.last_seen_at ? Date.parse(a.last_seen_at) : 0))
  }, [investors, filtre, search, nowMs])
  const open = investors.find(r => r.id === openId) ?? null

  const tiles: Array<{ f: Filtre | null; v: number; l: string; color: string; Icon: typeof Briefcase; apart?: boolean }> = [
    { f: 'tous', v: investors.length, l: `investisseur${investors.length > 1 ? 's' : ''}`, color: BROWN, Icon: Briefcase },
    { f: null, v: totalProjects, l: `projet${totalProjects > 1 ? 's' : ''} enregistré${totalProjects > 1 ? 's' : ''}`, color: 'var(--accent-text)', Icon: FolderOpen },
    { f: 'projet', v: counts.projet, l: 'avec un projet', color: BROWN, Icon: FolderOpen },
    { f: 'actif', v: counts.actif, l: 'vus cette semaine', color: 'var(--accent-text)', Icon: Pulse },
    { f: 'hote', v: counts.hote, l: 'aussi hôtes', color: AMBER, Icon: House },
    { f: 'sans', v: counts.sans, l: 'sans projet', color: 'var(--text-3)', Icon: FolderOpen, apart: true },
  ]

  return (
    <div style={s.wrap}>
      <InlineStyle css={CSS} />
      <AdminHero
        section="Investisseurs"
        title="Les investisseurs"
        em="et leurs projets"
        desc="Comptes inscrits avec la carte « Investisseur » ou marqués depuis Hôtes. Chaque fiche montre le dernier projet d’achat enregistré dans l’estimateur ; clique pour voir tous ses projets."
      />

      <div className="iv-kpis" style={s.kpis}>
        {tiles.map(t => {
          const active = t.f !== null && t.f !== 'tous' && filtre === t.f
          const El = t.f ? 'button' : 'div'
          return (
            <El key={t.l} {...(t.f ? { type: 'button' as const, onClick: () => setFiltre(active || t.f === 'tous' ? 'tous' : t.f!), 'aria-pressed': active } : {})} style={{
              ...s.kpi, cursor: t.f ? 'pointer' : 'default',
              border: active ? '1px solid var(--accent-border)' : t.apart ? '1px dashed var(--border-2)' : '1px solid var(--border)',
              background: active ? 'var(--accent-bg)' : t.apart ? 'transparent' : 'var(--surface)',
            }}>
              <t.Icon size={17} weight="fill" color={t.color} />
              <span style={{ ...s.kpiNum, color: t.color }}>{t.v}</span>
              <span style={s.kpiLabel}>{t.l}</span>
            </El>
          )
        })}
      </div>

      <div style={s.toolbar}>
        <div style={s.search}>
          <MagnifyingGlass size={15} color="var(--text-3)" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, e-mail, projet ou ville" style={s.searchInput} aria-label="Rechercher un investisseur" />
          {search && <button type="button" onClick={() => setSearch('')} style={s.clear} aria-label="Effacer"><X size={13} /></button>}
        </div>
        <div style={{ ...s.seg, marginLeft: 'auto' }} role="group" aria-label="Affichage">
          <button type="button" onClick={() => changeVue('grille')} aria-pressed={vue === 'grille'} title="Fiches" style={{ ...s.segBtn, ...(vue === 'grille' ? s.segOn : null) }}><SquaresFour size={15} weight={vue === 'grille' ? 'fill' : 'regular'} /></button>
          <button type="button" onClick={() => changeVue('liste')} aria-pressed={vue === 'liste'} title="Liste" style={{ ...s.segBtn, ...(vue === 'liste' ? s.segOn : null) }}><Rows size={15} weight={vue === 'liste' ? 'fill' : 'regular'} /></button>
        </div>
      </div>

      {list.length === 0 ? (
        <div style={s.empty}>{investors.length === 0 ? 'Aucun investisseur pour l’instant.' : 'Aucun investisseur ne correspond.'}</div>
      ) : vue === 'grille' ? (
        <div className="iv-grid">
          {list.map(r => <Card key={r.id} r={r} lvl={level(r)} selected={openId === r.id} onOpen={() => setOpenId(r.id)} />)}
        </div>
      ) : (
        <div style={s.listBox}>
          {list.map(r => {
            const last = r.projects[0]
            const l = LEVEL[level(r)]
            return (
              <button key={r.id} type="button" className="iv-line" onClick={() => setOpenId(r.id)} style={s.line}>
                <span style={{ ...s.avatar, color: BROWN, background: tint(BROWN, 14) }}>{initials(r)}</span>
                <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: '1 1 200px' }}>
                  <span style={{ fontWeight: 600, fontSize: 14.5 }}>{nameOf(r)}</span>
                  <span style={s.sub}>{r.email}</span>
                </span>
                <span className="iv-l-proj" style={{ ...s.sub, flex: '0 1 260px' }}>{last ? `${last.nom} · ${last.ville || last.pays}` : 'Aucun projet'}</span>
                <span style={{ ...s.pill, color: l.color, background: tint(l.color, 12), flex: '0 0 auto' }}>{l.label}</span>
                <span className="iv-l-n" style={{ ...s.sub, flex: '0 0 90px', textAlign: 'right' }}>{r.projects.length} projet{r.projects.length > 1 ? 's' : ''}</span>
              </button>
            )
          })}
        </div>
      )}

      {open && <Panel r={open} lvl={level(open)} onClose={() => setOpenId(null)} />}
    </div>
  )
}

function CopyEmail({ email, style }: { email: string; style: React.CSSProperties }) {
  const [ok, setOk] = useState(false)
  return (
    <button type="button" style={style} aria-label={`Copier ${email}`} onClick={async () => {
      try { await navigator.clipboard.writeText(email); setOk(true); setTimeout(() => setOk(false), 1600) } catch { /* presse-papier refusé */ }
    }}>
      {ok ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />} {ok ? 'Copiée' : <><span className="iv-long">Copier l’e-mail</span><span className="iv-short">E-mail</span></>}
    </button>
  )
}

function Cover({ r, height, children }: { r: InvestorRow; height: number; children?: React.ReactNode }) {
  const c = r.projects.length ? BROWN : 'var(--text-3)'
  return (
    <div style={{ position: 'relative', height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(120% 90% at 85% 0%, ${tint(c, 30)}, transparent 60%), linear-gradient(135deg, ${tint(c, 18)}, ${tint(c, 4)})` }}>
      <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: height > 110 ? 38 : 32, fontWeight: 500, color: c, opacity: 0.85 }}>{initials(r)}</span>
      {children}
    </div>
  )
}

function Card({ r, lvl, selected, onOpen }: { r: InvestorRow; lvl: keyof typeof LEVEL; selected: boolean; onOpen: () => void }) {
  const last = r.projects[0]
  const l = LEVEL[lvl]
  const total = budget(r)
  return (
    <div className="iv-card" style={{ ...s.card, ...(selected ? { outline: '2px solid var(--accent-text)', outlineOffset: 2 } : null) }}>
      <button type="button" onClick={onOpen} style={s.main} aria-label={`Ouvrir l’aperçu de ${nameOf(r)}`}>
        <Cover r={r} height={118}>
          <span style={{ ...s.badge, left: 10, maxWidth: 'calc(100% - 120px)', color: l.color }} title={l.label}><i style={{ ...s.dot, background: l.color }} /> <span className="iv-lvl" style={s.ellipsis}>{l.label}</span></span>
          <span style={{ ...s.badge, right: 10, color: r.projects.length ? BROWN : 'var(--text-3)' }}>{r.projects.length ? `${r.projects.length} projet${r.projects.length > 1 ? 's' : ''}` : 'Aucun projet'}</span>
        </Cover>
        <div style={s.body}>
          <span style={s.name}>{nameOf(r)}</span>
          <span style={s.sub}>{r.email}</span>
          {r.logements > 0 && <span style={{ ...s.chip, color: 'var(--accent-text)', background: 'var(--accent-bg)' }}><House size={10} weight="fill" /> Aussi hôte · {r.logements} logement{r.logements > 1 ? 's' : ''}</span>}
          {last ? (
            <div style={s.proj}>
              <b style={{ color: 'var(--text)', fontWeight: 600 }}>{last.nom}</b>
              <span>{projectLines(last).where}</span>
              <span>{projectLines(last).money}</span>
            </div>
          ) : (
            <div style={{ ...s.proj, background: 'transparent', border: '1px dashed var(--border-2)' }}>Pas encore de projet enregistré dans l’estimateur.</div>
          )}
          <div style={s.stats}>
            <span><b style={s.b}>{r.projects.length}</b> projet{r.projects.length > 1 ? 's' : ''}</span>
            {total > 0 && <span><b style={s.b}>{eur(total)}</b> au total</span>}
          </div>
          <span style={s.foot}>
            <ClockCounterClockwise size={13} />
            <span style={s.ellipsis}>{last ? <>Dernier projet <RelativeTime iso={last.created_at} /></> : r.last_seen_at ? <>Vu <RelativeTime iso={r.last_seen_at} /></> : <>Inscrit <RelativeTime iso={r.created_at} /></>}</span>
          </span>
        </div>
      </button>
      <div style={s.acts}>
        <Link prefetch={false} href={`/dashboard/admin/membres/${r.id}`} style={s.act}><UserCircle size={14} weight="bold" /> <span className="iv-long">Fiche complète</span><span className="iv-short">Fiche</span></Link>
        <CopyEmail email={r.email} style={{ ...s.act, borderLeft: '1px solid var(--border)' }} />
      </div>
    </div>
  )
}

function Panel({ r, lvl, onClose }: { r: InvestorRow; lvl: keyof typeof LEVEL; onClose: () => void }) {
  const router = useRouter()
  const [busy, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const { confirm, dialog } = useConfirm()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const run = (fn: () => Promise<{ error?: string | null } | undefined | void>, ok: string, close = false) => start(async () => {
    const res = await fn()
    if (res && res.error) setMsg({ ok: false, t: String(res.error) })
    else { setMsg({ ok: true, t: ok }); if (close) onClose(); router.refresh() }
  })
  const l = LEVEL[lvl]
  const total = budget(r)
  const isAdmin = r.role === 'admin'

  return (
    <>
      {dialog}
      <div style={s.backdrop} onClick={onClose} aria-hidden />
      <aside role="dialog" aria-modal="true" aria-label={`Aperçu de ${nameOf(r)}`} className="iv-panel" style={s.panel}>
        <div style={{ position: 'relative' }}>
          <Cover r={r} height={104} />
          <button type="button" onClick={onClose} style={s.close} aria-label="Fermer"><X size={16} weight="bold" /></button>
        </div>
        <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ ...s.sec, color: BROWN }}>Investisseur · {planLabel(r.plan)}</span>
            <h2 style={s.pname}>{nameOf(r)}</h2>
            <span style={{ fontSize: 13, color: 'var(--text-3)', overflowWrap: 'anywhere' }}>{r.email} · inscrit le {dateFr(r.created_at)}</span>
            <span style={{ ...s.pill, color: l.color, background: tint(l.color, 12), alignSelf: 'flex-start' }}><i style={{ ...s.dot, background: l.color }} /> {l.label}</span>
          </div>
          <div style={s.tiles}>
            <div style={s.tile}><strong style={s.tileNum}>{r.projects.length}</strong>projet{r.projects.length > 1 ? 's' : ''}</div>
            <div style={s.tile}><strong style={s.tileNum}>{total ? keur(total) : '-'}</strong>d’achat</div>
            <div style={s.tile}><strong style={s.tileNum}>{r.logements}</strong>logement{r.logements > 1 ? 's' : ''}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={s.sec}>Ses projets</span>
            {r.projects.length ? (
              <div style={s.box}>
                {r.projects.map((p, i) => {
                  const pl = projectLines(p)
                  return (
                    <div key={p.id} style={{ ...s.row, ...(i ? { borderTop: '1px solid var(--border)' } : null) }}>
                      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{p.nom}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{pl.where}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{pl.money}</span>
                      </span>
                      <span style={{ fontSize: 12.5, color: 'var(--text-3)', whiteSpace: 'nowrap' }}><RelativeTime iso={p.created_at} /></span>
                    </div>
                  )
                })}
              </div>
            ) : <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Pas encore de projet enregistré dans l’estimateur.</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={s.sec}>Son activité</span>
            <div style={s.box}>
              <div style={s.row}><span style={{ fontSize: 13.5 }}>Dernière visite</span><span style={{ fontSize: 13, color: 'var(--text-3)' }}>{r.last_seen_at ? <RelativeTime iso={r.last_seen_at} /> : 'Jamais revenu'}</span></div>
              {r.projects[0] && <div style={{ ...s.row, borderTop: '1px solid var(--border)' }}><span style={{ fontSize: 13.5 }}>Projet enregistré</span><span style={{ fontSize: 13, color: 'var(--text-3)' }}><RelativeTime iso={r.projects[0].created_at} /></span></div>}
              <div style={{ ...s.row, borderTop: '1px solid var(--border)' }}><span style={{ fontSize: 13.5 }}>Inscription</span><span style={{ fontSize: 13, color: 'var(--text-3)' }}><RelativeTime iso={r.created_at} /></span></div>
            </div>
          </div>

          {!isAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={s.sec}>Formule et accès</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <select value={r.plan || 'decouverte'} disabled={busy} onChange={e => run(() => changeUserPlan(r.id, e.target.value), 'Formule mise à jour')} style={s.select} aria-label="Formule">
                  {PLANS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <button type="button" disabled={busy} style={s.btn} onClick={async () => {
                  if (!(await confirm({ message: `Retirer « Investisseur » du compte de ${nameOf(r)} ? Il ne sera plus sur cette page (ses projets sont gardés).`, confirmLabel: 'Retirer' }))) return
                  run(() => toggleInvestor(r.id, false), 'Investisseur retiré', true)
                }}><Briefcase size={14} /> Retirer « Investisseur »</button>
              </div>
              {msg && <span role="status" style={{ fontSize: 13, color: msg.ok ? 'var(--accent-text)' : 'var(--danger)' }}>{msg.t}</span>}
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Link prefetch={false} href={`/dashboard/admin/membres/${r.id}`} style={s.btnPrimary}><UserCircle size={15} weight="bold" /> Ouvrir la fiche complète</Link>
            <CopyEmail email={r.email} style={s.btn} />
          </div>
        </div>
      </aside>
    </>
  )
}

const CSS = `
.iv-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr)); }
.iv-kpis { grid-template-columns: repeat(6, minmax(0, 1fr)); }
.iv-card { transition: transform .18s ease, box-shadow .18s ease; }
.iv-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
.iv-line:hover { background: var(--surface-2) !important; }
.iv-line + .iv-line { border-top: 1px solid var(--border) !important; }
.iv-panel { animation: ivIn .22s ease; }
@keyframes ivIn { from { transform: translateX(24px); opacity: 0 } to { transform: none; opacity: 1 } }
@media (max-width: 1000px) { .iv-kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); } .iv-l-proj { display: none !important; } }
.iv-short { display: none; }
@media (max-width: 640px) {
  .iv-lvl, .iv-long { display: none; }
  .iv-short { display: inline; }
  .iv-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .iv-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .iv-l-n { display: none !important; }
  .iv-panel { width: 100% !important; }
}
@media (prefers-reduced-motion: reduce) { .iv-card, .iv-panel { transition: none; animation: none; } }
`

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 18, fontFamily: 'var(--font-outfit), sans-serif' },
  kpis: { display: 'grid', gap: 10 },
  kpi: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 14, fontFamily: 'inherit', textAlign: 'left', minWidth: 0, flexWrap: 'wrap', color: 'var(--text)' },
  kpiNum: { fontSize: 22, fontFamily: 'var(--font-fraunces), serif', fontWeight: 500, lineHeight: 1 },
  kpiLabel: { fontSize: 13, color: 'var(--text-2)', minWidth: 0 },
  toolbar: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  search: { display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 40, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', flex: '1 1 240px', maxWidth: 380, minWidth: 0 },
  searchInput: { flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit' },
  clear: { border: 'none', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer', display: 'flex', padding: 2 },
  seg: { display: 'inline-flex', gap: 2, padding: 3, borderRadius: 12, background: 'var(--bg-2)', border: '1px solid var(--border)' },
  segBtn: { display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: 9, border: '1px solid transparent', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' },
  segOn: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' },
  empty: { padding: '40px 20px', textAlign: 'center', color: 'var(--text-2)', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 16, fontSize: 14 },
  card: { display: 'flex', flexDirection: 'column', borderRadius: 18, overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', minWidth: 0 },
  main: { display: 'flex', flexDirection: 'column', flex: 1, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'var(--text)', minWidth: 0 },
  badge: { position: 'absolute', top: 10, display: 'inline-flex', alignItems: 'center', gap: 5, width: 'fit-content', maxWidth: 'calc(100% - 20px)', padding: '4px 9px', borderRadius: 999, background: 'var(--surface)', boxShadow: 'var(--card-shadow)', fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden' },
  ellipsis: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 },
  dot: { width: 7, height: 7, borderRadius: 99, display: 'inline-block', flexShrink: 0 },
  body: { display: 'flex', flexDirection: 'column', gap: 6, padding: '13px 15px', flex: 1, minWidth: 0 },
  name: { fontSize: 16, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  sub: { fontSize: 12.5, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999 },
  proj: { display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 10px', borderRadius: 10, background: 'var(--surface-2)', fontSize: 12.5, color: 'var(--text-2)', overflowWrap: 'anywhere' },
  stats: { display: 'flex', gap: '4px 12px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: 9, borderTop: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-2)' },
  b: { color: 'var(--text)', fontWeight: 600 },
  foot: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-3)', minWidth: 0 },
  acts: { display: 'flex', borderTop: '1px solid var(--border)' },
  act: { flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 6px', fontSize: 12.5, fontWeight: 600, color: 'var(--accent-text)', textDecoration: 'none', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', minWidth: 0, whiteSpace: 'nowrap' },
  listBox: { display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--border)' },
  line: { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'var(--text)', width: '100%', minWidth: 0 },
  avatar: { width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-fraunces), serif', fontWeight: 600, fontSize: 16 },
  pill: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' },
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 80 },
  panel: { position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(440px, 100%)', background: 'var(--bg)', borderLeft: '1px solid var(--border)', zIndex: 81, overflowY: 'auto', boxShadow: 'var(--shadow-md)' },
  close: { position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  sec: { fontSize: 11.5, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--text-3)' },
  pname: { margin: 0, fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 26, lineHeight: 1.15, overflowWrap: 'anywhere' },
  tiles: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 },
  tile: { display: 'flex', flexDirection: 'column', padding: '10px 12px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-3)' },
  tileNum: { fontFamily: 'var(--font-fraunces), serif', fontWeight: 500, fontSize: 20, color: 'var(--text)' },
  box: { display: 'flex', flexDirection: 'column', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', padding: '0 14px' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 0', minWidth: 0 },
  select: { padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 13px', borderRadius: 10, border: '1px solid var(--accent-text)', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 13, fontWeight: 600, textDecoration: 'none' },
}
