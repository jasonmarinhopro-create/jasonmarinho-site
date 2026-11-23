'use client'

// Espace Formations à 4 onglets (refonte du 23/11/2026, maquettes validées).
// Téléphone : barre d'onglets en bas, au pouce. Ordinateur : onglets en haut.
// Changer d'onglet ne recharge pas la page (adresse mise à jour sur place).
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Sun, Path, SquaresFour, UserCircle, ArrowRight, Lightning, CalendarCheck, MagnifyingGlass,
  Check, Lock, Certificate, BookmarkSimple, NotePencil, BookOpen, Trophy, Target,
} from '@phosphor-icons/react/dist/ssr'
import InlineStyle from '@/components/ui/InlineStyle'
import FormationIcon from '@/components/formations/FormationIcon'
import { OBJECTIFS } from '@/lib/formations/objectifs'
import { HUB_TABS, type HubData, type HubFormation, type HubTab } from './types'

const TAB_ICONS: Record<HubTab, typeof Sun> = { aujourdhui: Sun, parcours: Path, catalogue: SquaresFour, moi: UserCircle }
const PARCOURS_SHORT: Record<string, string> = {
  'demarrer-en-lcd-30-jours': 'Démarrer',
  'maximiser-tes-revenus': 'Gagner plus',
  'visibilite-directe': 'Hors plateformes',
  'securite-conformite': 'Sérénité',
  'devenir-conciergerie': 'Conciergerie',
}

const lessonHref = (slug: string, id?: number) => `/dashboard/formations/${slug}${id ? `?lecon=${id}` : ''}`

function dueText(iso: string): string {
  const d = new Date(iso)
  const day = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long' }).format(d)
  const h = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }).format(d)
  return `${day}, ${h}`
}

export default function FormationsHub({ data, initialTab, initialParcours, revision, suggest }: {
  data: HubData
  initialTab: HubTab
  initialParcours: string | null
  revision: React.ReactNode
  suggest: React.ReactNode
}) {
  const [tab, setTab] = useState<HubTab>(initialTab)

  useEffect(() => {
    const onPop = () => {
      const t = new URLSearchParams(window.location.search).get('onglet') as HubTab | null
      setTab(t && HUB_TABS.some(x => x.key === t) ? t : 'aujourdhui')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  function go(t: HubTab) {
    setTab(t)
    const url = new URL(window.location.href)
    if (t === 'aujourdhui') url.searchParams.delete('onglet')
    else url.searchParams.set('onglet', t)
    url.searchParams.delete('objectif')
    window.history.pushState({}, '', url.pathname + url.search)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="fh">
      <InlineStyle css={CSS} />
      <div className="fh-head">
        <h1 className="fh-title">Formations</h1>
        <nav className="fh-tabs" aria-label="Sections des formations">
          {HUB_TABS.map(t => (
            <button key={t.key} type="button" onClick={() => go(t.key)} className={tab === t.key ? 'on' : ''} aria-current={tab === t.key ? 'page' : undefined}>{t.label}</button>
          ))}
        </nav>
      </div>

      <div className="fh-body" key={tab}>
        {tab === 'aujourdhui' && <Today data={data} revision={revision} goTab={go} />}
        {tab === 'parcours' && <Parcours data={data} initial={initialParcours} />}
        {tab === 'catalogue' && <Catalogue data={data} suggest={suggest} />}
        {tab === 'moi' && <Moi data={data} />}
      </div>

      <nav className="fh-bar" aria-label="Sections des formations">
        {HUB_TABS.map(t => {
          const Icon = TAB_ICONS[t.key]
          return (
            <button key={t.key} type="button" onClick={() => go(t.key)} className={tab === t.key ? 'on' : ''} aria-current={tab === t.key ? 'page' : undefined}>
              <Icon size={22} weight={tab === t.key ? 'fill' : 'regular'} />
              <span>{t.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

/* ───────────────────────── Aujourd'hui ───────────────────────── */

function Today({ data, revision, goTab }: { data: HubData; revision: React.ReactNode; goTab: (t: HubTab) => void }) {
  const r = data.resume
  const planned = data.actions.filter(a => !a.doneAt && a.dueAt).slice(0, 2)
  const current = data.parcours.find(p => r && p.formations.includes(r.slug)) ?? null
  return (
    <div className="fh-grid">
      <div className="fh-col">
        {r ? (
          <Link href={lessonHref(r.slug, r.lessonId)} className="fh-hero">
            <span className="fh-hero-k">{r.isStart ? 'Pour commencer' : 'Ta prochaine leçon'}</span>
            <span className="fh-hero-t">{r.lessonTitle}</span>
            <span className="fh-hero-w">{r.title} · {r.moduleLabel} · {r.steps} étapes · {r.duration}</span>
            <span className="fh-bars" aria-hidden="true">
              {Array.from({ length: r.moduleBars.total }).map((_, i) => <i key={i} className={i < r.moduleBars.done ? 'd' : ''} />)}
            </span>
            <span className="fh-ybtn">{r.isStart ? 'Commencer' : 'Continuer'} <ArrowRight size={16} weight="bold" /></span>
          </Link>
        ) : (
          <div className="fh-hero">
            <span className="fh-hero-k">Bravo</span>
            <span className="fh-hero-t">Tu as terminé toutes tes formations en cours</span>
            <button type="button" className="fh-ybtn" onClick={() => goTab('catalogue')}>Choisir la suivante <ArrowRight size={16} weight="bold" /></button>
          </div>
        )}

        {data.signal && (
          <Link href={data.signal.href} className="fh-signal">
            <span className="fh-signal-k">Repéré dans ton activité</span>
            <span className="fh-signal-t">{data.signal.titre}</span>
            <span className="fh-signal-r"><span>{data.signal.detail}</span><b>{data.signal.minutes} min</b></span>
          </Link>
        )}

        {revision}
      </div>

      <div className="fh-col">
        {planned.map((a, i) => (
          <Link key={i} href={a.href ?? '/dashboard/formations?onglet=moi'} prefetch={false} className="fh-card fh-row">
            <span className="fh-ic y"><CalendarCheck size={18} weight="fill" /></span>
            <span className="fh-row-m"><b>{a.title}</b><small>Prévu {dueText(a.dueAt!)}</small></span>
            <span className="fh-go">Faire</span>
          </Link>
        ))}

        <div className="fh-card">
          <div className="fh-week-h"><span>Ta semaine</span><b>{Math.min(data.weekDone, data.weekGoal)} leçon{Math.min(data.weekDone, data.weekGoal) > 1 ? 's' : ''} sur {data.weekGoal}</b></div>
          <div className="fh-week" aria-hidden="true">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <i key={i} className={data.weekDays[i] ? 'd' : i === data.todayIndex ? 't' : ''}>{d}</i>
            ))}
          </div>
          <small className="fh-muted">{data.weekDone >= data.weekGoal ? 'Objectif atteint, bravo.' : 'Deux leçons par semaine suffisent pour avancer sans y penser.'}</small>
        </div>

        {current && <ParcoursMini data={data} slug={current.slug} />}
      </div>
    </div>
  )
}

function ParcoursMini({ data, slug }: { data: HubData; slug: string }) {
  const p = data.parcours.find(x => x.slug === slug)!
  const fs = p.formations.map(s => data.formations.find(f => f.slug === s)).filter(Boolean) as HubFormation[]
  const cur = fs.findIndex(f => f.progress < 100)
  return (
    <Link href={`/dashboard/formations?onglet=parcours&objectif=${p.slug}`} prefetch={false} className="fh-card" style={{ textDecoration: 'none' }}>
      <span className="fh-sec">Ton parcours · {PARCOURS_SHORT[p.slug] ?? p.title}</span>
      <div className="fh-path">
        {fs.slice(0, 3).map((f, i) => (
          <div key={f.slug} className={`fh-st ${f.progress >= 100 ? 'd' : i === cur ? 'n' : ''}`}>
            <span className="fh-nd">{f.progress >= 100 ? <Check size={14} weight="bold" /> : i + 1}</span>
            <span className="fh-st-t"><b>{f.title}</b><small>{f.progress >= 100 ? 'Terminée' : f.progress > 0 ? `${f.progress} %` : 'À venir'}</small></span>
          </div>
        ))}
      </div>
    </Link>
  )
}

/* ───────────────────────── Parcours ───────────────────────── */

function Parcours({ data, initial }: { data: HubData; initial: string | null }) {
  const defaultSlug = initial && data.parcours.some(p => p.slug === initial)
    ? initial
    : (data.parcours.find(p => data.resume && p.formations.includes(data.resume.slug))?.slug ?? data.parcours[0]?.slug)
  const [sel, setSel] = useState(defaultSlug)
  const p = data.parcours.find(x => x.slug === sel) ?? data.parcours[0]
  if (!p) return null
  const fs = p.formations.map(s => data.formations.find(f => f.slug === s)).filter(Boolean) as HubFormation[]
  const doneCount = fs.filter(f => f.progress >= 100).length
  const cur = fs.findIndex(f => f.progress < 100 && !f.locked)

  return (
    <div className="fh-narrow">
      <div className="fh-chips" role="tablist" aria-label="Objectifs">
        {data.parcours.map(x => (
          <button key={x.slug} type="button" role="tab" aria-selected={x.slug === p.slug} className={x.slug === p.slug ? 'on' : ''} onClick={() => setSel(x.slug)}>
            {PARCOURS_SHORT[x.slug] ?? x.title}
          </button>
        ))}
      </div>

      <div className="fh-goal">
        <span className="fh-goal-ic"><FormationIcon name={p.icon} size={26} /></span>
        <span>
          <b>{p.title}</b>
          <small>{p.forWho}</small>
          <small className="fh-goal-p">{doneCount} formation{doneCount > 1 ? 's' : ''} sur {fs.length} terminée{doneCount > 1 ? 's' : ''} · {p.duration.replace('~', 'environ ')}</small>
        </span>
      </div>

      <div className="fh-path fh-path-big">
        {fs.map((f, i) => {
          const state = f.progress >= 100 ? 'd' : i === cur ? 'n' : ''
          return (
            <div key={f.slug} className={`fh-st ${state}`}>
              <span className="fh-nd">{f.progress >= 100 ? <Check size={15} weight="bold" /> : f.locked ? <Lock size={14} weight="fill" /> : i + 1}</span>
              <span className="fh-st-t" style={{ flex: 1 }}>
                <Link href={lessonHref(f.slug)} className="fh-st-link"><b>{f.title}</b></Link>
                <small>{f.progress >= 100 ? 'Terminée' : f.locked ? 'Réservée à la formule Standard' : f.progress > 0 ? `En cours · ${f.progress} %` : `${f.lessons} leçons · ${f.duration}`}</small>
                {state === 'n' && f.next && (
                  <span className="fh-now">
                    <span className="fh-mini"><i style={{ width: `${Math.max(0, f.progress)}%` }} /></span>
                    <span>{f.progress > 0 ? 'Prochaine' : 'Première leçon'} : {f.next.title} · {f.next.duration}</span>
                    <Link href={lessonHref(f.slug, f.next.id)} className="fh-gbtn">{f.progress > 0 ? 'Continuer' : 'Commencer'} <ArrowRight size={15} weight="bold" /></Link>
                  </span>
                )}
              </span>
            </div>
          )
        })}
      </div>
      <p className="fh-muted" style={{ textAlign: 'center' }}>Un parcours te guide, il ne t&apos;oblige à rien : toutes les formations restent ouvertes dans le catalogue.</p>
    </div>
  )
}

/* ───────────────────────── Catalogue ───────────────────────── */

function Catalogue({ data, suggest }: { data: HubData; suggest: React.ReactNode }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const list = useMemo(() => data.formations.filter(f => {
    if (filter === 'encours' && !(f.progress > 0 && f.progress < 100)) return false
    if (filter !== 'all' && filter !== 'encours' && OBJECTIFS.find(o => o.key === filter)?.label !== f.objectif) return false
    if (q.trim() && !norm(f.title + ' ' + f.objectif).includes(norm(q.trim()))) return false
    return true
  }), [data.formations, filter, q])
  const enCours = data.formations.filter(f => f.progress > 0 && f.progress < 100).length
  const showReco = filter === 'all' && !q.trim() && data.recommended.length > 0

  return (
    <div className="fh-narrow">
      <label className="fh-search">
        <MagnifyingGlass size={17} />
        <input id="formations-recherche" value={q} onChange={e => setQ(e.target.value)} placeholder="Prix, fiscalité, avis, Google…" aria-label="Rechercher une formation" />
      </label>
      <div className="fh-chips">
        <button type="button" className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>Toutes</button>
        {enCours > 0 && <button type="button" className={filter === 'encours' ? 'on' : ''} onClick={() => setFilter('encours')}>En cours · {enCours}</button>}
        {OBJECTIFS.map(o => <button key={o.key} type="button" className={filter === o.key ? 'on' : ''} onClick={() => setFilter(o.key)}>{o.label}</button>)}
      </div>

      {showReco && (
        <>
          <span className="fh-sec">Pour toi</span>
          <div className="fh-list">
            {data.recommended.slice(0, 2).map(r => {
              const f = data.formations.find(x => x.slug === r.slug)
              return f ? <Row key={f.slug} f={f} sub={r.reason} /> : null
            })}
          </div>
        </>
      )}

      <span className="fh-sec">{filter === 'all' && !q.trim() ? `Toutes · ${data.formations.length}` : `${list.length} formation${list.length > 1 ? 's' : ''}`}</span>
      <div className="fh-list">
        {list.map(f => <Row key={f.slug} f={f} />)}
        {list.length === 0 && <p className="fh-muted" style={{ padding: '16px 0' }}>Aucune formation ne correspond. Essaie un autre mot.</p>}
      </div>

      {data.plan === 'decouverte' && (
        <p className="fh-muted">Avec la formule Découverte, tu peux ouvrir 2 formations. <Link href="/dashboard/abonnement" style={{ color: 'var(--accent-text)', fontWeight: 600 }}>Passer en Standard</Link> pour toutes les débloquer.</p>
      )}

      <div className="fh-card" style={{ marginTop: '8px' }}>
        <b style={{ fontSize: '15px' }}>Une formation te manque ?</b>
        <small className="fh-muted">Dis-nous ce qui t&apos;aiderait : les prochaines formations sont construites à partir de vos demandes.</small>
        {suggest}
      </div>
    </div>
  )
}

function Row({ f, sub }: { f: HubFormation; sub?: string }) {
  return (
    <Link href={lessonHref(f.slug)} className={`fh-lrow${f.locked ? ' locked' : ''}`}>
      <span className="fh-cov" style={{ background: f.cover }} aria-hidden="true" />
      <span className="fh-lrow-m">
        <b>{f.title}</b>
        <small>{sub ?? `${f.lessons} leçons · ${f.duration} · ${f.objectif}`}</small>
      </span>
      {f.locked ? <span className="fh-pill lock"><Lock size={11} weight="fill" /> Standard</span>
        : f.progress >= 100 ? <span className="fh-pill ok">Terminée</span>
        : f.progress > 0 ? <span className="fh-pill go">{f.progress} %</span>
        : f.isNew ? <span className="fh-pill new">Nouveau</span> : null}
    </Link>
  )
}

/* ───────────────────────── Moi ───────────────────────── */

function Moi({ data }: { data: HubData }) {
  const finished = data.formations.filter(f => f.progress >= 100)
  const doneActions = data.actions.filter(a => a.doneAt)
  const wins = [
    ...doneActions.map(a => ({ t: a.title, s: a.formationTitle ? `Action faite · ${a.formationTitle}` : 'Action faite' })),
    ...finished.map(f => ({ t: `Formation terminée : ${f.title}`, s: f.objectif })),
  ]
  return (
    <div className="fh-narrow">
      <div className="fh-stats">
        <div><b>{data.stats.lessons}</b><small>leçon{data.stats.lessons > 1 ? 's' : ''} faite{data.stats.lessons > 1 ? 's' : ''}</small></div>
        <div><b>{data.stats.actionsDone}</b><small>action{data.stats.actionsDone > 1 ? 's' : ''} faite{data.stats.actionsDone > 1 ? 's' : ''}</small></div>
        <div><b>{data.stats.goodPct === null ? '-' : `${data.stats.goodPct} %`}</b><small>bonnes réponses</small></div>
      </div>

      <span className="fh-sec">Mes réussites</span>
      {wins.length ? (
        <div className="fh-wins">
          {wins.slice(0, 8).map((w, i) => (
            <div key={i} className="fh-win"><span className="fh-medal"><Trophy size={15} weight="fill" /></span><span><b>{w.t}</b><small>{w.s}</small></span></div>
          ))}
        </div>
      ) : (
        <div className="fh-empty"><Target size={20} /><span>Tes réussites apparaîtront ici : chaque action faite dans l&apos;app depuis une formation compte.</span></div>
      )}

      <span className="fh-sec">Mes attestations</span>
      {finished.length ? (
        <div className="fh-certs">
          {finished.map(f => (
            <Link key={f.slug} href={`/dashboard/formations/attestation/${f.slug}`} prefetch={false} className="fh-cert">
              <b>{f.title}</b>
              <small><Certificate size={12} weight="fill" /> Voir l&apos;attestation</small>
            </Link>
          ))}
        </div>
      ) : (
        <div className="fh-empty"><Certificate size={20} /><span>Termine une formation pour obtenir ton attestation à ton nom.</span></div>
      )}

      <span className="fh-sec">Enregistré</span>
      {data.saved.length ? (
        <div className="fh-list">
          {data.saved.map((s, i) => (
            <Link key={i} href={s.href} className="fh-saved">
              <span className="fh-saved-ic">{s.kind === 'note' ? <NotePencil size={16} /> : s.kind === 'lecon' ? <BookmarkSimple size={16} weight="fill" /> : <BookOpen size={16} />}</span>
              <span className="fh-lrow-m"><b>{s.label}</b><small>{s.kind === 'note' ? 'Note' : s.kind === 'lecon' ? 'Leçon' : 'Formation'} · {s.sub}</small></span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="fh-empty"><BookmarkSimple size={20} /><span>Garde une leçon ou une formation en favori, ou prends une note : tout se retrouve ici.</span></div>
      )}
    </div>
  )
}

const CSS = `
.fh { padding: clamp(16px, 3vw, 32px); padding-bottom: 32px; display: flex; flex-direction: column; gap: 18px; }
.fh-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.fh-title { font-family: var(--font-fraunces), serif; font-weight: 400; font-size: clamp(26px, 3vw, 34px); color: var(--text); margin: 0; }
.fh-tabs { display: flex; gap: 2px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 12px; padding: 3px; }
.fh-tabs button { font: inherit; font-size: 13.5px; font-weight: 600; padding: 8px 16px; border-radius: 9px; border: 0; background: none; color: var(--text-3); cursor: pointer; }
.fh-tabs button.on { background: var(--surface); color: var(--text); box-shadow: 0 1px 3px rgba(0,0,0,.14); }
.fh-body { animation: fhIn .25s ease both; }
@keyframes fhIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.fh-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); gap: 16px; align-items: start; }
.fh-col { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.fh-narrow { max-width: 760px; display: flex; flex-direction: column; gap: 14px; }
.fh-hero { display: flex; flex-direction: column; gap: 10px; padding: clamp(18px, 2.4vw, 28px); border-radius: 24px; text-decoration: none; color: #F3F8F5; background: radial-gradient(circle at 100% 0%, rgba(255,213,107,.22) 0 28%, transparent 29%), linear-gradient(155deg, #004C3F, #0B6B57); box-shadow: 0 18px 40px -26px rgba(0,60,45,.8); }
.fh-hero-k { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; font-weight: 700; color: #FFD56B; }
.fh-hero-t { font-family: var(--font-fraunces), serif; font-size: clamp(22px, 2.6vw, 30px); line-height: 1.15; color: #fff; max-width: 22ch; }
.fh-hero-w { font-size: 13px; color: rgba(243,248,245,.8); }
.fh-bars { display: flex; gap: 4px; max-width: 360px; }
.fh-bars i { flex: 1; height: 6px; border-radius: 99px; background: rgba(255,255,255,.22); }
.fh-bars i.d { background: #FFD56B; }
.fh-ybtn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; align-self: flex-start; padding: 12px 22px; border-radius: 14px; border: 0; background: #FFD56B; color: #2A2100; font: inherit; font-weight: 700; font-size: 14.5px; cursor: pointer; }
.fh-signal { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; border-radius: 18px; text-decoration: none; background: rgba(255,213,107,.14); border: 1px solid rgba(229,181,63,.45); }
.fh-signal-k { font-size: 10.5px; letter-spacing: .09em; text-transform: uppercase; font-weight: 700; color: #FFD56B; }
[data-theme=light] .fh-signal-k { color: #8A6A10; }
.fh-signal-t { font-size: 15.5px; font-weight: 600; color: var(--text); line-height: 1.35; }
.fh-signal-r { display: flex; justify-content: space-between; gap: 10px; font-size: 12.5px; color: var(--text-2); }
.fh-signal-r b { color: var(--text); white-space: nowrap; }
.fh-card { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; border-radius: 18px; background: var(--surface); border: 1px solid var(--border); }
.fh-row { flex-direction: row; align-items: center; text-decoration: none; }
.fh-row-m { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.fh-row-m b { font-size: 14px; color: var(--text); }
.fh-row-m small { font-size: 12px; color: var(--text-3); }
.fh-ic { width: 36px; height: 36px; border-radius: 11px; display: grid; place-items: center; flex-shrink: 0; background: var(--accent-bg); color: var(--accent-text); }
.fh-ic.y { background: rgba(255,213,107,.18); color: #FFD56B; }
[data-theme=light] .fh-ic.y { color: #8A6A10; }
.fh-go { font-size: 13px; font-weight: 700; color: var(--accent-text); white-space: nowrap; }
.fh-week-h { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-2); }
.fh-week-h b { color: var(--text); }
.fh-week { display: flex; gap: 5px; }
.fh-week i { flex: 1; height: 34px; border-radius: 10px; background: var(--surface-2); display: grid; place-items: center; font-style: normal; font-size: 11px; font-weight: 700; color: var(--text-3); }
.fh-week i.d { background: var(--accent-text); color: var(--bg); }
.fh-week i.t { box-shadow: inset 0 0 0 2px var(--accent-text); color: var(--accent-text); background: transparent; }
.fh-muted { font-size: 12.5px; color: var(--text-3); line-height: 1.5; margin: 0; }
.fh-sec { font-size: 11px; letter-spacing: .09em; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-top: 4px; }
.fh-path { display: flex; flex-direction: column; }
.fh-st { display: flex; gap: 12px; position: relative; padding-bottom: 16px; }
.fh-st::before { content: ""; position: absolute; left: 17px; top: 38px; bottom: 2px; width: 2px; background: var(--border); }
.fh-st.d::before { background: var(--accent-text); }
.fh-st:last-child::before { display: none; }
.fh-nd { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; display: grid; place-items: center; font-weight: 700; font-size: 13px; background: var(--surface); box-shadow: inset 0 0 0 2px var(--border); color: var(--text-3); }
.fh-st.d .fh-nd { background: var(--accent-text); box-shadow: none; color: var(--bg); }
.fh-st.n .fh-nd { box-shadow: inset 0 0 0 2px var(--accent-text), 0 0 0 5px var(--accent-bg); color: var(--accent-text); }
.fh-st-t { display: flex; flex-direction: column; min-width: 0; padding-top: 2px; }
.fh-st-t b { font-size: 14px; color: var(--text); }
.fh-st-t small { font-size: 12px; color: var(--text-3); }
.fh-st-link { text-decoration: none; }
.fh-path-big .fh-st-t b { font-size: 15.5px; }
.fh-now { margin-top: 9px; padding: 12px; border-radius: 14px; background: var(--surface); border: 1px solid var(--border); display: flex; flex-direction: column; gap: 9px; font-size: 13px; color: var(--text-2); }
.fh-mini { display: block; height: 6px; border-radius: 99px; background: var(--surface-2); overflow: hidden; }
.fh-mini i { display: block; height: 100%; background: var(--accent-text); border-radius: 99px; }
.fh-gbtn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 11px 18px; border-radius: 13px; background: var(--accent-text); color: var(--bg); font-weight: 700; font-size: 14px; text-decoration: none; align-self: flex-start; }
.fh-chips { display: flex; gap: 7px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
.fh-chips::-webkit-scrollbar { display: none; }
.fh-chips button { flex-shrink: 0; font: inherit; font-size: 13px; padding: 7px 13px; border-radius: 99px; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); cursor: pointer; white-space: nowrap; }
.fh-chips button.on { background: var(--text); color: var(--bg); border: 1px solid var(--text); font-weight: 600; }
.fh-goal { display: flex; gap: 14px; align-items: center; padding: 14px 16px; border-radius: 18px; background: var(--surface); border: 1px solid var(--border); }
.fh-goal-ic { width: 52px; height: 52px; border-radius: 15px; flex-shrink: 0; display: grid; place-items: center; background: linear-gradient(155deg, #004C3F, #0B6B57); color: #FFD56B; }
.fh-goal b { display: block; font-family: var(--font-fraunces), serif; font-weight: 500; font-size: 18px; color: var(--text); }
.fh-goal small { display: block; font-size: 12.5px; color: var(--text-3); }
.fh-goal-p { color: var(--accent-text) !important; font-weight: 700; margin-top: 3px; }
.fh-search { display: flex; align-items: center; gap: 9px; padding: 0 14px; border-radius: 14px; background: var(--surface); border: 1px solid var(--border); color: var(--text-3); }
.fh-search input { flex: 1; min-width: 0; border: 0; background: none; outline: none; font: inherit; font-size: 15px; color: var(--text); padding: 12px 0; }
.fh-list { display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 2px 14px; }
.fh-lrow, .fh-saved { display: flex; gap: 12px; align-items: center; padding: 11px 0; border-bottom: 1px solid var(--border); text-decoration: none; }
.fh-lrow:last-child, .fh-saved:last-child { border-bottom: 0; }
.fh-lrow.locked { opacity: .65; }
.fh-cov { width: 50px; height: 50px; border-radius: 14px; flex-shrink: 0; }
.fh-lrow-m { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.fh-lrow-m b { font-size: 14.5px; color: var(--text); line-height: 1.3; }
.fh-lrow-m small { font-size: 12px; color: var(--text-3); line-height: 1.35; }
.fh-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 99px; white-space: nowrap; flex-shrink: 0; }
.fh-pill.go { background: var(--accent-bg); color: var(--accent-text); }
.fh-pill.ok { background: var(--success-bg); color: var(--success-1); }
.fh-pill.new { background: rgba(255,213,107,.2); color: #FFD56B; }
[data-theme=light] .fh-pill.new { color: #8A6A10; }
.fh-pill.lock { background: var(--surface-2); color: var(--text-3); }
.fh-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.fh-stats div { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 14px 8px; text-align: center; }
.fh-stats b { display: block; font-family: var(--font-fraunces), serif; font-weight: 500; font-size: 26px; color: var(--text); }
.fh-stats small { font-size: 11.5px; color: var(--text-3); }
.fh-wins { display: flex; flex-direction: column; gap: 7px; }
.fh-win { display: flex; gap: 11px; align-items: center; padding: 10px 12px; border-radius: 14px; background: var(--surface); border: 1px solid var(--border); }
.fh-win b { display: block; font-size: 13.5px; color: var(--text); }
.fh-win small { display: block; font-size: 12px; color: var(--text-3); }
.fh-medal { width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0; display: grid; place-items: center; color: #3A2A00; background: radial-gradient(circle at 35% 30%, #FFF1C4, #FFD56B 55%, #E5B53F); }
.fh-certs { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; }
.fh-cert { flex-shrink: 0; width: 150px; aspect-ratio: 1.414; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; justify-content: space-between; text-decoration: none; background: #FBFAF6; color: #14201C; box-shadow: inset 0 0 0 2px #004C3F, inset 0 0 0 5px #FBFAF6, inset 0 0 0 6px rgba(0,76,63,.35); }
.fh-cert b { font-family: var(--font-fraunces), serif; font-weight: 500; font-size: 13px; line-height: 1.2; }
.fh-cert small { display: flex; align-items: center; gap: 4px; font-size: 10.5px; color: #004C3F; font-weight: 600; }
.fh-saved-ic { width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0; display: grid; place-items: center; background: var(--surface-2); color: var(--text-2); }
.fh-empty { display: flex; gap: 10px; align-items: center; padding: 14px 16px; border-radius: 16px; border: 1px dashed var(--border); color: var(--text-3); font-size: 13px; line-height: 1.45; }
.fh-empty svg { flex-shrink: 0; }
.fh-bar { display: none; }
.fh a:focus-visible, .fh button:focus-visible, .fh input:focus-visible { outline: 2px solid var(--accent-text); outline-offset: 2px; }
@media (max-width: 1000px) { .fh-grid { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 767px) {
  .fh { padding: 14px 16px calc(96px + env(safe-area-inset-bottom)); }
  .fh-tabs { display: none; }
  .fh-bar { display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 30; justify-content: space-around; padding: 6px 8px calc(6px + env(safe-area-inset-bottom)); background: var(--bg); border-top: 1px solid var(--border); box-shadow: 0 -8px 24px -18px rgba(0,0,0,.35); }
  .fh-bar button { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 0; border: 0; background: none; font: inherit; font-size: 11px; font-weight: 600; color: var(--text-3); cursor: pointer; }
  .fh-bar button.on { color: var(--accent-text); }
  .fh-narrow { max-width: none; }
}
@media (prefers-reduced-motion: reduce) { .fh-body { animation: none; } }
`
