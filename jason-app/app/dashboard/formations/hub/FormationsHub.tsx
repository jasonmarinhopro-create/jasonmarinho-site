'use client'

// Espace Formations à 4 onglets (refonte du 23/11/2026, maquettes validées).
// Téléphone : barre d'onglets en bas, au pouce. Ordinateur : onglets communs
// du dashboard (HubTabBar) en haut à gauche, pages en pleine largeur.
// Changer d'onglet ne recharge pas la page (adresse mise à jour sur place).
//
// 23/11/2026 (retours de Jason) : plus de grand titre « Formations » (déjà
// dans l'en-tête), accueil moins vide (progression, en cours, pour toi,
// nouveautés), catalogue en cartes avec couvertures sur ordinateur,
// parcours et « Moi » sur deux colonnes.
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  Sun, Path, SquaresFour, UserCircle, ArrowRight, CalendarCheck, MagnifyingGlass,
  Check, Lock, Certificate, BookmarkSimple, NotePencil, BookOpen, Trophy, Target, Sparkle, Clock,
  Medal, Lightning, Fire, CaretDown,
} from '@phosphor-icons/react/dist/ssr'
import InlineStyle from '@/components/ui/InlineStyle'
import HubTabBar from '@/components/layout/HubTabBar'
import FormationIcon from '@/components/formations/FormationIcon'
import { OBJECTIFS, coverBackground } from '@/lib/formations/objectifs'
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
const plural = (n: number, w: string) => `${n} ${w}${n > 1 ? 's' : ''}`

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
  const [objectif, setObjectif] = useState<string | null>(initialParcours)
  const pathname = usePathname() ?? '/dashboard/formations'
  const sp = useSearchParams()

  // L'onglet suit l'adresse (24/11/2026) : un lien vers ?onglet=… sur la même
  // page changeait l'adresse sans changer l'écran (« rien ne se passe »).
  useEffect(() => {
    const t = sp?.get('onglet') as HubTab | null
    setTab(t && HUB_TABS.some(x => x.key === t) ? t : 'aujourdhui')
    setObjectif(sp?.get('objectif') ?? null)
  }, [sp])

  useEffect(() => {
    const onPop = () => {
      const t = new URLSearchParams(window.location.search).get('onglet') as HubTab | null
      setTab(t && HUB_TABS.some(x => x.key === t) ? t : 'aujourdhui')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  function go(t: HubTab, obj: string | null = null) {
    setTab(t)
    setObjectif(obj)
    const url = new URL(window.location.href)
    if (t === 'aujourdhui') url.searchParams.delete('onglet')
    else url.searchParams.set('onglet', t)
    if (obj) url.searchParams.set('objectif', obj)
    else url.searchParams.delete('objectif')
    window.history.pushState({}, '', url.pathname + url.search)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="fh">
      <InlineStyle css={CSS} />
      <div className="fh-tabs-wrap">
        <HubTabBar
          flush
          label="Sections des formations"
          tabs={HUB_TABS.map(t => ({
            href: t.key === 'aujourdhui' ? pathname : `${pathname}?onglet=${t.key}`,
            label: t.label,
            hint: t.key === 'catalogue' ? `Les ${data.formations.length} formations` : t.hint,
            Icon: TAB_ICONS[t.key],
            active: tab === t.key,
            onSelect: () => go(t.key),
          }))}
        />
      </div>

      <div className="fh-body" key={tab}>
        {tab === 'aujourdhui' && <Today data={data} revision={revision} goTab={go} />}
        {tab === 'parcours' && <Parcours key={objectif ?? ''} data={data} initial={objectif} />}
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

/* ───────────────────────── Cartes communes ───────────────────────── */

function Status({ f }: { f: HubFormation }) {
  if (f.locked) return <span className="fh-pill lock"><Lock size={11} weight="fill" /> Standard</span>
  if (f.progress >= 100) return <span className="fh-pill ok"><Check size={11} weight="bold" /> Terminée</span>
  if (f.progress > 0) return <span className="fh-pill go">{f.progress} %</span>
  if (f.isNew) return <span className="fh-pill new">Nouveau</span>
  return null
}

/** Carte à couverture (catalogue, en cours, pour toi). Sur téléphone : ligne compacte. */
function FCard({ f, sub }: { f: HubFormation; sub?: string }) {
  return (
    <Link href={lessonHref(f.slug)} className={`fh-fc${f.locked ? ' locked' : ''}`}>
      <span className="fh-fc-cov" style={{ ['--cov-lg' as string]: f.coverLg, ['--cov-sm' as string]: f.cover }} aria-hidden="true">
        <span className="fh-fc-tag">{f.objectif}</span>
        {f.progress > 0 && f.progress < 100 && <span className="fh-fc-prog"><i style={{ width: `${f.progress}%` }} /></span>}
      </span>
      <span className="fh-fc-b">
        <b>{f.title}</b>
        <small>{sub ?? `${plural(f.lessons, 'leçon')} · ${f.duration}`}</small>
        <span className="fh-fc-st"><Status f={f} /></span>
      </span>
    </Link>
  )
}

/* ───────────────────────── Aujourd'hui ───────────────────────── */

function Today({ data, revision, goTab }: { data: HubData; revision: React.ReactNode; goTab: (t: HubTab, obj?: string | null) => void }) {
  const r = data.resume
  const rf = r ? data.formations.find(f => f.slug === r.slug) : undefined
  const planned = data.actions.filter(a => !a.doneAt && a.dueAt).slice(0, 2)
  const current = data.parcours.find(p => r && p.formations.includes(r.slug)) ?? null
  const enCours = data.formations.filter(f => f.progress > 0 && f.progress < 100 && f.slug !== r?.slug)
  const finished = data.formations.filter(f => f.progress >= 100).length
  const reco = data.recommended
    .map(x => ({ f: data.formations.find(f => f.slug === x.slug), reason: x.reason }))
    .filter((x): x is { f: HubFormation; reason: string } => !!x.f && x.f.slug !== r?.slug)
    .slice(0, 3)
  const nouveautes = data.formations.filter(f => f.isNew && f.progress < 0 && !reco.some(x => x.f.slug === f.slug)).slice(0, 3)
  const weekDone = Math.min(data.weekDone, data.weekGoal)

  return (
    <div className="fh-today">
      <div className="fh-col">
        {r ? (
          <Link href={lessonHref(r.slug, r.lessonId)} className="fh-hero">
            <span className="fh-hero-txt">
              <span className="fh-hero-k">{r.isStart ? 'Pour commencer' : 'Ta prochaine leçon'}</span>
              <span className="fh-hero-t">{r.lessonTitle}</span>
              <span className="fh-hero-w">{r.title}</span>
              <span className="fh-hero-meta"><span>{r.moduleLabel}</span><span>{plural(r.steps, 'étape')}</span><span><Clock size={13} /> {r.duration}</span></span>
              <span className="fh-bars" aria-hidden="true">
                {Array.from({ length: r.moduleBars.total }).map((_, i) => <i key={i} className={i < r.moduleBars.done ? 'd' : ''} />)}
              </span>
              <span className="fh-ybtn">{r.isStart ? 'Commencer' : 'Continuer'} <ArrowRight size={16} weight="bold" /></span>
            </span>
            {rf && (
              <span className="fh-hero-art" style={{ background: rf.coverLg }} aria-hidden="true">
                <span className="fh-hero-ring" style={{ ['--p' as string]: `${Math.max(0, rf.progress)}` }}>
                  <b>{Math.max(0, rf.progress)} %</b><small>de la formation</small>
                </span>
              </span>
            )}
          </Link>
        ) : (
          <div className="fh-hero">
            <span className="fh-hero-txt">
              <span className="fh-hero-k">Bravo</span>
              <span className="fh-hero-t">Tu as terminé toutes tes formations en cours</span>
              <button type="button" className="fh-ybtn" onClick={() => goTab('catalogue')}>Choisir la suivante <ArrowRight size={16} weight="bold" /></button>
            </span>
          </div>
        )}

        {data.signal && (
          <Link href={data.signal.href} className="fh-signal">
            <span className="fh-signal-k"><Sparkle size={12} weight="fill" /> Repéré dans ton activité</span>
            <span className="fh-signal-t">{data.signal.titre}</span>
            <span className="fh-signal-r"><span>{data.signal.detail}</span><b>{data.signal.minutes} min</b></span>
          </Link>
        )}

        {revision}

        {enCours.length > 0 && (
          <section className="fh-sect">
            <div className="fh-sect-h"><span className="fh-sec">Tes autres formations en cours</span></div>
            <div className="fh-cards">{enCours.slice(0, 3).map(f => <FCard key={f.slug} f={f} sub={f.next ? `Prochaine : ${f.next.title}` : undefined} />)}</div>
          </section>
        )}

        {reco.length > 0 && (
          <section className="fh-sect">
            <div className="fh-sect-h">
              <span className="fh-sec">Pour toi</span>
              <button type="button" className="fh-more" onClick={() => goTab('catalogue')}>Tout le catalogue <ArrowRight size={13} weight="bold" /></button>
            </div>
            <div className="fh-cards">{reco.map(x => <FCard key={x.f.slug} f={x.f} sub={x.reason} />)}</div>
          </section>
        )}

        {nouveautes.length > 0 && (
          <section className="fh-sect">
            <div className="fh-sect-h"><span className="fh-sec">Nouveau</span></div>
            <div className="fh-cards">{nouveautes.map(f => <FCard key={f.slug} f={f} />)}</div>
          </section>
        )}
      </div>

      <div className="fh-col">
        <div className="fh-card">
          <span className="fh-sec" style={{ marginTop: 0 }}>Ta progression</span>
          <div className="fh-kpis">
            <div><b>{data.stats.lessons}</b><small>{data.stats.lessons > 1 ? 'leçons faites' : 'leçon faite'}</small></div>
            <div><b>{finished}</b><small>{finished > 1 ? 'terminées' : 'terminée'}</small></div>
            <div><b>{data.stats.goodPct === null ? '-' : `${data.stats.goodPct} %`}</b><small>bonnes réponses</small></div>
          </div>
          <button type="button" className="fh-more" onClick={() => goTab('moi')}>Mes réussites et attestations <ArrowRight size={13} weight="bold" /></button>
        </div>

        <div className="fh-card">
          <div className="fh-week-h"><span>Ta semaine</span><b>{weekDone} {weekDone > 1 ? 'leçons' : 'leçon'} sur {data.weekGoal}</b></div>
          <div className="fh-week" aria-hidden="true">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <i key={i} className={data.weekDays[i] ? 'd' : i === data.todayIndex ? 't' : ''}>{d}</i>
            ))}
          </div>
          <small className="fh-muted">{data.weekDone >= data.weekGoal ? 'Objectif atteint, bravo.' : 'Deux leçons par semaine suffisent pour avancer sans y penser.'}</small>
        </div>

        {planned.map((a, i) => (
          <Link key={i} href={a.href ?? '/dashboard/formations?onglet=moi'} prefetch={false} className="fh-card fh-row">
            <span className="fh-ic y"><CalendarCheck size={18} weight="fill" /></span>
            <span className="fh-row-m"><b>{a.title}</b><small>Prévu {dueText(a.dueAt!)}</small></span>
            <span className="fh-go">Faire</span>
          </Link>
        ))}

        {current ? <ParcoursMini data={data} slug={current.slug} onOpen={() => goTab('parcours', current.slug)} /> : (
          <button type="button" className="fh-card fh-row fh-btnrow" onClick={() => goTab('parcours')}>
            <span className="fh-ic"><Path size={18} weight="fill" /></span>
            <span className="fh-row-m"><b>Choisis un parcours</b><small>Un objectif, les formations dans le bon ordre</small></span>
            <ArrowRight size={16} weight="bold" className="fh-go" />
          </button>
        )}
      </div>
    </div>
  )
}

function ParcoursMini({ data, slug, onOpen }: { data: HubData; slug: string; onOpen: () => void }) {
  const p = data.parcours.find(x => x.slug === slug)!
  const fs = p.formations.map(s => data.formations.find(f => f.slug === s)).filter(Boolean) as HubFormation[]
  const cur = fs.findIndex(f => f.progress < 100)
  const start = Math.max(0, Math.min(cur < 0 ? 0 : cur - 1, fs.length - 3))
  return (
    <button type="button" onClick={onOpen} className="fh-card fh-btnrow" style={{ textDecoration: 'none' }}>
      <span className="fh-sec" style={{ marginTop: 0 }}>Ton parcours · {PARCOURS_SHORT[p.slug] ?? p.title}</span>
      <div className="fh-path">
        {fs.slice(start, start + 3).map((f, k) => {
          const i = start + k
          return (
            <div key={f.slug} className={`fh-st ${f.progress >= 100 ? 'd' : i === cur ? 'n' : ''}`}>
              <span className="fh-nd">{f.progress >= 100 ? <Check size={14} weight="bold" /> : i + 1}</span>
              <span className="fh-st-t"><b>{f.title}</b><small>{f.progress >= 100 ? 'Terminée' : f.progress > 0 ? `${f.progress} %` : 'À venir'}</small></span>
            </div>
          )
        })}
      </div>
      <span className="fh-more">Voir le parcours ({fs.filter(f => f.progress >= 100).length}/{fs.length}) <ArrowRight size={13} weight="bold" /></span>
    </button>
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
  const fsOf = (slugs: string[]) => slugs.map(s => data.formations.find(f => f.slug === s)).filter(Boolean) as HubFormation[]
  const fs = fsOf(p.formations)
  const doneCount = fs.filter(f => f.progress >= 100).length
  const cur = fs.findIndex(f => f.progress < 100 && !f.locked)

  return (
    <div className="fh-pgrid">
      <div className="fh-chips fh-mob" role="tablist" aria-label="Objectifs">
        {data.parcours.map(x => (
          <button key={x.slug} type="button" role="tab" aria-selected={x.slug === p.slug} className={x.slug === p.slug ? 'on' : ''} onClick={() => setSel(x.slug)}>
            {PARCOURS_SHORT[x.slug] ?? x.title}
          </button>
        ))}
      </div>

      <aside className="fh-plist" aria-label="Parcours">
        <span className="fh-sec" style={{ marginTop: 0 }}>Choisis ton objectif</span>
        {data.parcours.map(x => {
          const xs = fsOf(x.formations)
          const d = xs.filter(f => f.progress >= 100).length
          const on = x.slug === p.slug
          return (
            <button key={x.slug} type="button" className={`fh-pitem${on ? ' on' : ''}`} onClick={() => setSel(x.slug)} aria-pressed={on}>
              <span className="fh-pitem-ic"><FormationIcon name={x.icon} size={20} /></span>
              <span className="fh-row-m">
                <b>{PARCOURS_SHORT[x.slug] ?? x.title}</b>
                <small>{d} sur {xs.length} · {x.duration.replace('~', 'environ ')}</small>
                <span className="fh-mini"><i style={{ width: `${xs.length ? Math.round((d / xs.length) * 100) : 0}%` }} /></span>
              </span>
            </button>
          )
        })}
      </aside>

      <div className="fh-pmain">
        <div className="fh-goal">
          <span className="fh-goal-ic"><FormationIcon name={p.icon} size={28} /></span>
          <span style={{ minWidth: 0 }}>
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
                <div className="fh-st-card">
                  <Link href={lessonHref(f.slug)} className="fh-st-top">
                    <span className="fh-cov" style={{ background: f.cover }} aria-hidden="true" />
                    <span className="fh-st-t">
                      <b>{f.title}</b>
                      <small>{f.progress >= 100 ? 'Terminée' : f.locked ? 'Réservée à la formule Standard' : f.progress > 0 ? `En cours · ${f.progress} %` : `${plural(f.lessons, 'leçon')} · ${f.duration}`}</small>
                    </span>
                    <ArrowRight size={16} className="fh-st-arrow" />
                  </Link>
                  {state === 'n' && f.next && (
                    <span className="fh-now">
                      <span className="fh-mini"><i style={{ width: `${Math.max(0, f.progress)}%` }} /></span>
                      <span>{f.progress > 0 ? 'Prochaine' : 'Première leçon'} : {f.next.title} · {f.next.duration}</span>
                      <Link href={lessonHref(f.slug, f.next.id)} className="fh-gbtn">{f.progress > 0 ? 'Continuer' : 'Commencer'} <ArrowRight size={15} weight="bold" /></Link>
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <p className="fh-muted">Un parcours te guide, il ne t&apos;oblige à rien : toutes les formations restent ouvertes dans le catalogue.</p>
      </div>
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
    if (filter !== 'all' && filter !== 'encours' && f.objectifKey !== filter) return false
    if (q.trim() && !norm(`${f.title} ${f.objectif} ${f.description}`).includes(norm(q.trim()))) return false
    return true
  }), [data.formations, filter, q])
  const enCours = data.formations.filter(f => f.progress > 0 && f.progress < 100).length
  const browsing = filter === 'all' && !q.trim()
  const featured = browsing ? data.recommended.map(r => ({ f: data.formations.find(x => x.slug === r.slug), reason: r.reason })).find(x => x.f) : undefined
  const done = data.formations.filter(f => f.progress >= 100).length

  return (
    <div className="fh-cat">
      {featured?.f && (
        <Link href={lessonHref(featured.f.slug)} className="fh-feat">
          <span className="fh-feat-art" style={{ background: featured.f.coverLg }} aria-hidden="true">
            <span className="fh-fc-tag">{featured.f.objectif}</span>
          </span>
          <span className="fh-feat-b">
            <span className="fh-feat-k"><Sparkle size={12} weight="fill" /> Pour toi · {featured.reason}</span>
            <b>{featured.f.title}</b>
            {featured.f.description && <span className="fh-feat-d">{featured.f.description}</span>}
            <span className="fh-feat-m"><span>{plural(featured.f.lessons, 'leçon')}</span><span>{featured.f.duration}</span>{featured.f.level && <span>{featured.f.level}</span>}</span>
            <span className="fh-gbtn">Découvrir <ArrowRight size={15} weight="bold" /></span>
          </span>
          <span className="fh-feat-side" aria-hidden="true">
            <span><b>{data.formations.length}</b><small>formations</small></span>
            <span><b>{done}</b><small>{done > 1 ? 'terminées' : 'terminée'}</small></span>
            <span><b>{enCours}</b><small>en cours</small></span>
          </span>
        </Link>
      )}

      <div className="fh-tools">
        <label className="fh-search">
          <MagnifyingGlass size={17} />
          <input id="formations-recherche" value={q} onChange={e => setQ(e.target.value)} placeholder="Prix, fiscalité, avis, Google…" aria-label="Rechercher une formation" />
        </label>
        <div className="fh-chips">
          <button type="button" className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>Toutes · {data.formations.length}</button>
          {enCours > 0 && <button type="button" className={filter === 'encours' ? 'on' : ''} onClick={() => setFilter('encours')}>En cours · {enCours}</button>}
          {OBJECTIFS.map(o => <button key={o.key} type="button" className={filter === o.key ? 'on' : ''} onClick={() => setFilter(o.key)}>{o.label}</button>)}
        </div>
      </div>

      {browsing ? (
        OBJECTIFS.map(o => {
          const fs = data.formations.filter(f => f.objectifKey === o.key)
          if (!fs.length) return null
          return (
            <section key={o.key} className="fh-sect">
              <div className="fh-sect-h">
                <span className="fh-sec">{o.label} · {fs.length}</span>
                <button type="button" className="fh-more" onClick={() => setFilter(o.key)}>Voir seulement <ArrowRight size={13} weight="bold" /></button>
              </div>
              <div className="fh-cards">{fs.map(f => <FCard key={f.slug} f={f} />)}</div>
            </section>
          )
        })
      ) : (
        <section className="fh-sect">
          <span className="fh-sec">{list.length} formation{list.length > 1 ? 's' : ''}</span>
          {list.length ? <div className="fh-cards">{list.map(f => <FCard key={f.slug} f={f} />)}</div>
            : <p className="fh-muted" style={{ padding: '16px 0' }}>Aucune formation ne correspond. Essaie un autre mot.</p>}
        </section>
      )}

      {data.plan === 'decouverte' && (
        <p className="fh-muted">Avec la formule Découverte, tu peux ouvrir 2 formations. <Link href="/dashboard/abonnement" style={{ color: 'var(--accent-text)', fontWeight: 600 }}>Passer en Standard</Link> pour toutes les débloquer.</p>
      )}

      <div className="fh-card fh-suggest">
        <span className="fh-ic"><Target size={18} weight="fill" /></span>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <b style={{ fontSize: '15px', color: 'var(--text)' }}>Une formation te manque ?</b>
          <small className="fh-muted">Dis-nous ce qui t&apos;aiderait : les prochaines formations sont construites à partir de vos demandes.</small>
          {suggest}
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── Moi ───────────────────────── */

// Niveaux d'apprenant (24/11/2026) : seuils en leçons faites, réels et simples
const LEVELS = [
  { min: 0, name: 'Curieux' },
  { min: 5, name: 'Apprenti' },
  { min: 20, name: 'Confirmé' },
  { min: 50, name: 'Expert' },
  { min: 120, name: 'Maître hôte' },
]

function Moi({ data }: { data: HubData }) {
  const [skill, setSkill] = useState<string | null>(null)
  const finished = data.formations.filter(f => f.progress >= 100)
  const inProgress = data.formations.filter(f => f.progress > 0 && f.progress < 100).sort((x, y) => y.progress - x.progress)
  const doneActions = data.actions.filter(a => a.doneAt)
  const st = data.stats
  const wins = [
    ...doneActions.map(a => ({ t: a.title, s: a.formationTitle ? `Action faite · ${a.formationTitle}` : 'Action faite' })),
    ...finished.map(f => ({ t: `Formation terminée : ${f.title}`, s: f.objectif })),
  ]
  const lvlIdx = LEVELS.reduce((acc, l, i) => (st.lessons >= l.min ? i : acc), 0)
  const lvl = LEVELS[lvlIdx]
  const nextLvl = LEVELS[lvlIdx + 1]
  const lvlPct = nextLvl ? Math.round(((st.lessons - lvl.min) / (nextLvl.min - lvl.min)) * 100) : 100
  const hours = Math.floor(st.minutes / 60)
  const mins = st.minutes % 60
  const timeLabel = hours ? `${hours} h${mins ? ` ${String(mins).padStart(2, '0')}` : ''}` : `${mins} min`
  const weeksActive = Array.from({ length: 12 }, (_, w) => data.activity.slice(w * 7, w * 7 + 7).some(n => n > 0)).filter(Boolean).length
  const maxDay = Math.max(1, ...data.activity)
  const weekSums = Array.from({ length: 12 }, (_, w) => data.activity.slice(w * 7, w * 7 + 7).reduce((a, n) => a + n, 0))
  const totalAct = weekSums.reduce((a, n) => a + n, 0)
  const thisWeek = weekSums[11]
  const bestWeek = Math.max(...weekSums)
  const nextCert = inProgress[0]
  const nextCertLeft = nextCert ? Math.max(1, Math.round(nextCert.lessons * (1 - nextCert.progress / 100))) : 0

  const milestones = [
    { t: 'Première leçon', v: st.lessons, goal: 1, Icon: BookOpen },
    { t: '10 leçons', v: st.lessons, goal: 10, Icon: BookOpen },
    { t: '50 leçons', v: st.lessons, goal: 50, Icon: Medal },
    { t: 'Première action', v: st.actionsDone, goal: 1, Icon: Lightning },
    { t: '5 actions faites', v: st.actionsDone, goal: 5, Icon: Lightning },
    { t: 'Première formation terminée', v: finished.length, goal: 1, Icon: Certificate },
    { t: '3 formations terminées', v: finished.length, goal: 3, Icon: Trophy },
    { t: '25 bonnes réponses', v: st.good, goal: 25, Icon: Target },
    { t: '4 semaines actives', v: weeksActive, goal: 4, Icon: Fire },
  ]
  const unlocked = milestones.filter(m => m.v >= m.goal).length

  return (
    <div className="fh-moi">
      <section className="fm-hero">
        <div className="fm-hero-l">
          <span className="fm-k">{data.firstName ? `Ton parcours, ${data.firstName}` : 'Ton parcours'}</span>
          <div className="fm-lvl">
            <span className="fm-lvl-badge"><Medal size={26} weight="fill" /></span>
            <span>
              <b>Niveau {lvlIdx + 1} · {lvl.name}</b>
              <small>{nextLvl ? `Encore ${nextLvl.min - st.lessons} leçon${nextLvl.min - st.lessons > 1 ? 's' : ''} pour devenir ${nextLvl.name}` : 'Le plus haut niveau, bravo.'}</small>
            </span>
          </div>
          <span className="fm-lvl-bar"><i style={{ width: `${lvlPct}%` }} /></span>
        </div>
        <div className="fm-hero-stats">
          <div><b>{timeLabel}</b><small>d&apos;apprentissage</small></div>
          <div><b>{st.lessons}</b><small>{st.lessons > 1 ? 'leçons faites' : 'leçon faite'}</small></div>
          <div><b>{finished.length}</b><small>{finished.length > 1 ? 'formations terminées' : 'formation terminée'}</small></div>
          <div><b>{st.actionsDone}</b><small>{st.actionsDone > 1 ? 'actions faites' : 'action faite'}</small></div>
          <div><b>{st.goodPct === null ? '-' : `${st.goodPct} %`}</b><small>{st.answered ? `de bonnes réponses (${st.good}/${st.answered})` : 'de bonnes réponses'}</small></div>
        </div>
      </section>

      <div className="fm-row">
        <section className="fh-card fm-act">
          <div className="fm-act-h"><span className="fh-sec" style={{ marginTop: 0 }}>Ton activité · 12 semaines</span><b>{weeksActive} semaine{weeksActive > 1 ? 's' : ''} active{weeksActive > 1 ? 's' : ''}</b></div>
          <div className="fm-act-body">
          <div className="fm-heat-wrap">
          <div className="fm-days" aria-hidden="true">{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i}>{d}</span>)}</div>
          <div className="fm-heat" role="img" aria-label={`Leçons faites sur 12 semaines, ${weeksActive} semaines actives`}>
            {Array.from({ length: 12 }, (_, w) => (
              <div key={w} className="fm-heat-col">
                {data.activity.slice(w * 7, w * 7 + 7).map((n, d) => (
                  <i key={d} title={n ? `${n} leçon${n > 1 ? 's' : ''}` : undefined} className={n === 0 ? '' : n / maxDay > 0.66 ? 'l3' : n / maxDay > 0.33 ? 'l2' : 'l1'} />
                ))}
              </div>
            ))}
          </div>
          </div>
          <div className="fm-act-sum">
            <div><b>{totalAct}</b><small>leçons en 12 semaines</small></div>
            <div><b>{thisWeek}</b><small>cette semaine</small></div>
            <div><b>{bestWeek}</b><small>ta meilleure semaine</small></div>
          </div>
          </div>
          <div className="fm-heat-leg"><span>Moins</span><i /><i className="l1" /><i className="l2" /><i className="l3" /><span>Plus</span></div>
        </section>

        <section className="fh-card fm-next">
          <span className="fh-sec" style={{ marginTop: 0 }}>Prochaine attestation</span>
          {nextCert ? (
            <Link href={lessonHref(nextCert.slug)} className="fm-next-in">
              <span className="fm-ring" style={{ ['--p' as string]: `${nextCert.progress}` }}><b>{nextCert.progress} %</b></span>
              <span className="fh-row-m">
                <b>{nextCert.title}</b>
                <small>Plus que {nextCertLeft} leçon{nextCertLeft > 1 ? 's' : ''} environ</small>
                <span className="fh-more" style={{ marginTop: 6 }}>Continuer <ArrowRight size={13} weight="bold" /></span>
              </span>
            </Link>
          ) : (
            <div className="fh-empty"><Certificate size={20} /><span>Commence une formation : ton attestation t&apos;attend à la fin.</span></div>
          )}
        </section>
      </div>

      {data.byObjectif.length > 0 && (
        <section className="fh-sect">
          <div className="fh-sect-h"><span className="fh-sec">Tes compétences</span></div>
          <div className="fm-skills">
            {data.byObjectif.map(o => {
              const pct = o.total ? Math.round((o.done / o.total) * 100) : 0
              return (
                <button key={o.key} type="button" className={`fm-skill${skill === o.key ? ' on' : ''}`} onClick={() => setSkill(skill === o.key ? null : o.key)} aria-expanded={skill === o.key}>
                  <span className="fm-skill-cov" style={{ background: coverBackground(OBJ_SLUG[o.key] ?? '', 0.25) }} aria-hidden="true" />
                  <span className="fh-row-m">
                    <b>{o.label}</b>
                    <small>{o.done} leçon{o.done > 1 ? 's' : ''} sur {o.total}</small>
                    <span className="fh-mini" style={{ marginTop: 6 }}><i style={{ width: `${pct}%` }} /></span>
                  </span>
                  <span className="fm-skill-p">{pct} %</span>
                  <CaretDown size={14} className="fm-skill-c" style={{ transform: skill === o.key ? 'rotate(180deg)' : 'none' }} />
                </button>
              )
            })}
          </div>
          {skill && (
            <div className="fm-skill-list">
              <div className="fh-sect-h">
                <b>{data.byObjectif.find(o => o.key === skill)?.label}</b>
                <button type="button" className="fh-more" onClick={() => setSkill(null)}>Fermer</button>
              </div>
              <div className="fh-list">
                {data.formations.filter(f => f.objectifKey === skill).map(f => {
                  const done = Math.round(f.lessons * Math.max(0, f.progress) / 100)
                  return (
                    <Link key={f.slug} href={lessonHref(f.slug)} className="fh-saved fm-sk-row">
                      <span className="fh-cov" style={{ background: f.cover }} aria-hidden="true" />
                      <span className="fh-row-m">
                        <b>{f.title}</b>
                        <small>{f.progress >= 100 ? 'Terminée' : f.progress > 0 ? `${done} leçon${done > 1 ? 's' : ''} sur ${f.lessons}` : `${f.lessons} leçons · ${f.duration}`}</small>
                        <span className="fh-mini" style={{ marginTop: 6, maxWidth: 320 }}><i style={{ width: `${Math.max(0, f.progress)}%` }} /></span>
                      </span>
                      <Status f={f} />
                      <ArrowRight size={15} className="fh-go" />
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="fh-sect">
        <div className="fh-sect-h"><span className="fh-sec">Tes jalons · {unlocked} sur {milestones.length}</span></div>
        <div className="fm-ms">
          {milestones.map((m, i) => {
            const ok = m.v >= m.goal
            return (
              <div key={i} className={`fm-m${ok ? ' ok' : ''}`}>
                <span className="fm-m-ic">{ok ? <m.Icon size={20} weight="fill" /> : <Lock size={16} weight="fill" />}</span>
                <b>{m.t}</b>
                {ok ? <small>Débloqué</small> : (
                  <>
                    <span className="fh-mini"><i style={{ width: `${Math.round((Math.min(m.v, m.goal) / m.goal) * 100)}%` }} /></span>
                    <small>{Math.min(m.v, m.goal)} / {m.goal}</small>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {inProgress.length > 0 && (
        <section className="fh-sect">
          <div className="fh-sect-h"><span className="fh-sec">En cours · {inProgress.length}</span></div>
          <div className="fh-cards">{inProgress.slice(0, 4).map(f => <FCard key={f.slug} f={f} sub={f.next ? `Prochaine : ${f.next.title}` : undefined} />)}</div>
        </section>
      )}

      <div className="fh-moi-grid">
        <div className="fh-col">
          <span className="fh-sec">Mes réussites</span>
          {wins.length ? (
            <div className="fh-wins">
              {wins.slice(0, 8).map((w, i) => (
                <div key={i} className="fh-win"><span className="fh-medal"><Trophy size={15} weight="fill" /></span><span style={{ minWidth: 0 }}><b>{w.t}</b><small>{w.s}</small></span></div>
              ))}
            </div>
          ) : (
            <div className="fh-empty"><Target size={20} /><span>Tes réussites apparaîtront ici : chaque action faite dans l&apos;app depuis une formation compte.</span></div>
          )}

          <span className="fh-sec">Enregistré</span>
          {data.saved.length ? (
            <div className="fh-list">
              {data.saved.map((s, i) => (
                <Link key={i} href={s.href} className="fh-saved">
                  <span className="fh-saved-ic">{s.kind === 'note' ? <NotePencil size={16} /> : s.kind === 'lecon' ? <BookmarkSimple size={16} weight="fill" /> : <BookOpen size={16} />}</span>
                  <span className="fh-row-m"><b>{s.label}</b><small>{s.kind === 'note' ? 'Note' : s.kind === 'lecon' ? 'Leçon' : 'Formation'} · {s.sub}</small></span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="fh-empty"><BookmarkSimple size={20} /><span>Pendant une leçon, l&apos;icône signet la garde ici ; tes notes aussi.</span></div>
          )}
        </div>

        <div className="fh-col">
          <span className="fh-sec">Mes attestations</span>
          {finished.length ? (
            <div className="fh-certs">
              {finished.map(f => (
                <Link key={f.slug} href={`/dashboard/formations/attestation/${f.slug}`} prefetch={false} className="fh-cert">
                  <span className="fh-cert-k">Attestation de suivi</span>
                  <b>{f.title}</b>
                  <small><Certificate size={12} weight="fill" /> Voir l&apos;attestation</small>
                </Link>
              ))}
            </div>
          ) : (
            <div className="fh-empty"><Certificate size={20} /><span>Termine une formation pour obtenir ton attestation à ton nom.</span></div>
          )}
        </div>
      </div>
    </div>
  )
}

// Une formation par objectif, pour la vignette de la compétence
const OBJ_SLUG: Record<string, string> = {
  gagner: 'mettre-le-bon-prix-lcd', visible: 'google-my-business-lcd', accueillir: 'livret-accueil-digital',
  proteger: 'securiser-reservations-eviter-mauvais-voyageurs', fiscalite: 'fiscalite-reglementation-lcd-france-2026', conciergerie: 'creer-conciergerie-lcd',
}

const CSS = `
.fh { padding: 20px var(--dash-page-px) 40px; display: flex; flex-direction: column; gap: 20px; }
.fh-body { animation: fhIn .25s ease both; min-width: 0; }
@keyframes fhIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.fh-col { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.fh-sec { font-size: 11px; letter-spacing: .09em; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-top: 4px; }
.fh-sect { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.fh-sect-h { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.fh-more { display: inline-flex; align-items: center; gap: 5px; border: 0; background: none; padding: 0; font: inherit; font-size: 12.5px; font-weight: 600; color: var(--accent-text); cursor: pointer; text-decoration: none; white-space: nowrap; align-self: flex-start; }
.fh-muted { font-size: 12.5px; color: var(--text-3); line-height: 1.5; margin: 0; }

/* Aujourd'hui */
.fh-today { display: grid; grid-template-columns: minmax(0, 1.75fr) minmax(300px, 1fr); gap: 22px; align-items: start; }
.fh-hero { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 24px; align-items: stretch; padding: clamp(20px, 2.4vw, 30px); border-radius: 24px; text-decoration: none; color: #F3F8F5; background: radial-gradient(circle at 100% 0%, rgba(255,213,107,.16) 0 26%, transparent 27%), linear-gradient(155deg, #004C3F, #0B6B57); box-shadow: 0 18px 40px -26px rgba(0,60,45,.8); transition: transform .2s, box-shadow .2s; }
a.fh-hero:hover { transform: translateY(-2px); box-shadow: 0 24px 48px -26px rgba(0,60,45,.9); }
.fh-hero-txt { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.fh-hero-k { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; font-weight: 700; color: #FFD56B; }
.fh-hero-t { font-family: var(--font-fraunces), serif; font-size: clamp(24px, 2.6vw, 34px); line-height: 1.12; color: #fff; max-width: 24ch; }
.fh-hero-w { font-size: 14px; font-weight: 600; color: rgba(243,248,245,.92); }
.fh-hero-meta { display: flex; flex-wrap: wrap; gap: 6px; }
.fh-hero-meta span { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; padding: 4px 10px; border-radius: 99px; background: rgba(255,255,255,.12); color: rgba(243,248,245,.9); }
.fh-bars { display: flex; gap: 4px; max-width: 360px; margin-top: 2px; }
.fh-bars i { flex: 1; height: 6px; border-radius: 99px; background: rgba(255,255,255,.22); }
.fh-bars i.d { background: #FFD56B; }
.fh-ybtn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; align-self: flex-start; margin-top: 6px; padding: 12px 22px; border-radius: 14px; border: 0; background: #FFD56B; color: #2A2100; font: inherit; font-weight: 700; font-size: 14.5px; cursor: pointer; }
.fh-hero-art { width: clamp(180px, 18vw, 260px); border-radius: 18px; position: relative; display: grid; place-items: center; box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
.fh-hero-ring { --p: 0; width: 132px; height: 132px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(closest-side, rgba(0,40,32,.82) 76%, transparent 77% 100%), conic-gradient(#FFD56B calc(var(--p) * 1%), rgba(255,255,255,.22) 0); }
.fh-hero-ring b { font-family: var(--font-fraunces), serif; font-weight: 500; font-size: 28px; color: #fff; line-height: 1; }
.fh-hero-ring small { font-size: 11px; color: rgba(243,248,245,.8); margin-top: 4px; }
.fh-signal { display: flex; flex-direction: column; gap: 6px; padding: 14px 18px; border-radius: 18px; text-decoration: none; background: rgba(255,213,107,.14); border: 1px solid rgba(229,181,63,.45); }
.fh-signal-k { display: inline-flex; align-items: center; gap: 5px; font-size: 10.5px; letter-spacing: .09em; text-transform: uppercase; font-weight: 700; color: #FFD56B; }
[data-theme=light] .fh-signal-k { color: #8A6A10; }
.fh-signal-t { font-size: 15.5px; font-weight: 600; color: var(--text); line-height: 1.35; }
.fh-signal-r { display: flex; justify-content: space-between; gap: 10px; font-size: 12.5px; color: var(--text-2); }
.fh-signal-r b { color: var(--text); white-space: nowrap; }
.fh-card { display: flex; flex-direction: column; gap: 10px; padding: 16px 18px; border-radius: 18px; background: var(--surface); border: 1px solid var(--border); }
.fh-row { flex-direction: row; align-items: center; text-decoration: none; }
.fh-btnrow { font: inherit; text-align: left; cursor: pointer; width: 100%; }
.fh-row-m { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.fh-row-m b { font-size: 14px; color: var(--text); line-height: 1.3; }
.fh-row-m small { font-size: 12px; color: var(--text-3); line-height: 1.35; }
.fh-ic { width: 36px; height: 36px; border-radius: 11px; display: grid; place-items: center; flex-shrink: 0; background: var(--accent-bg); color: var(--accent-text); }
.fh-ic.y { background: rgba(255,213,107,.18); color: #FFD56B; }
[data-theme=light] .fh-ic.y { color: #8A6A10; }
.fh-go { font-size: 13px; font-weight: 700; color: var(--accent-text); white-space: nowrap; flex-shrink: 0; }
.fh-kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.fh-kpis div { display: flex; flex-direction: column; gap: 2px; padding: 10px 6px; border-radius: 12px; background: var(--surface-2); text-align: center; min-width: 0; }
.fh-kpis b { font-family: var(--font-fraunces), serif; font-weight: 500; font-size: 24px; color: var(--text); line-height: 1.1; }
.fh-kpis small { font-size: 11px; color: var(--text-3); overflow-wrap: anywhere; }
.fh-week-h { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-2); }
.fh-week-h b { color: var(--text); }
.fh-week { display: flex; gap: 5px; }
.fh-week i { flex: 1; height: 34px; border-radius: 10px; background: var(--surface-2); display: grid; place-items: center; font-style: normal; font-size: 11px; font-weight: 700; color: var(--text-3); }
.fh-week i.d { background: var(--accent-text); color: var(--bg); }
.fh-week i.t { box-shadow: inset 0 0 0 2px var(--accent-text); color: var(--accent-text); background: transparent; }

/* Cartes à couverture */
.fh-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
.fh-fc { display: flex; flex-direction: column; border-radius: 18px; overflow: hidden; background: var(--surface); border: 1px solid var(--border); text-decoration: none; transition: transform .2s, box-shadow .2s, border .2s; min-width: 0; }
.fh-fc:hover { transform: translateY(-3px); box-shadow: 0 18px 36px -24px rgba(0,0,0,.45); border: 1px solid var(--accent-border); }
.fh-fc.locked { opacity: .7; }
.fh-fc-cov { position: relative; display: block; aspect-ratio: 16 / 7; background: var(--cov-lg); }
.fh-fc-tag { position: absolute; left: 10px; top: 10px; font-size: 10.5px; font-weight: 700; letter-spacing: .04em; padding: 4px 9px; border-radius: 99px; background: rgba(0,0,0,.4); color: #fff; }
.fh-fc-prog { position: absolute; left: 0; right: 0; bottom: 0; height: 5px; background: rgba(0,0,0,.25); }
.fh-fc-prog i { display: block; height: 100%; background: #FFD56B; }
.fh-fc-b { display: flex; flex-direction: column; gap: 4px; padding: 12px 14px 14px; flex: 1; min-width: 0; }
.fh-fc-b b { font-size: 14.5px; line-height: 1.3; color: var(--text); }
.fh-fc-b small { font-size: 12px; color: var(--text-3); line-height: 1.4; }
.fh-fc-st { margin-top: auto; padding-top: 6px; display: flex; min-height: 22px; }
.fh-cov { width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0; }
.fh-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 99px; white-space: nowrap; flex-shrink: 0; align-self: flex-start; }
.fh-pill.go { background: var(--accent-bg); color: var(--accent-text); }
.fh-pill.ok { background: var(--success-bg); color: var(--success-1); }
.fh-pill.new { background: rgba(255,213,107,.2); color: #FFD56B; }
[data-theme=light] .fh-pill.new { color: #8A6A10; }
.fh-pill.lock { background: var(--surface-2); color: var(--text-3); }

/* Parcours */
.fh-path { display: flex; flex-direction: column; }
.fh-st { display: flex; gap: 12px; position: relative; padding-bottom: 14px; }
.fh-st::before { content: ""; position: absolute; left: 17px; top: 38px; bottom: 2px; width: 2px; background: var(--border); }
.fh-st.d::before { background: var(--accent-text); }
.fh-st:last-child::before { display: none; }
.fh-nd { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; display: grid; place-items: center; font-weight: 700; font-size: 13px; background: var(--surface); box-shadow: inset 0 0 0 2px var(--border); color: var(--text-3); }
.fh-st.d .fh-nd { background: var(--accent-text); box-shadow: none; color: var(--bg); }
.fh-st.n .fh-nd { box-shadow: inset 0 0 0 2px var(--accent-text), 0 0 0 5px var(--accent-bg); color: var(--accent-text); }
.fh-st-t { display: flex; flex-direction: column; min-width: 0; padding-top: 2px; flex: 1; }
.fh-st-t b { font-size: 14px; color: var(--text); line-height: 1.3; }
.fh-st-t small { font-size: 12px; color: var(--text-3); }
.fh-pgrid { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 24px; align-items: start; }
.fh-chips.fh-mob { display: none; }
.fh-plist { position: sticky; top: calc(var(--header-h) + 16px); display: flex; flex-direction: column; gap: 8px; }
.fh-pitem { display: flex; gap: 12px; align-items: center; width: 100%; text-align: left; font: inherit; padding: 12px; border-radius: 16px; background: var(--surface); border: 1px solid var(--border); cursor: pointer; transition: border .15s, box-shadow .15s; }
.fh-pitem:hover { border: 1px solid var(--accent-border); }
.fh-pitem.on { border: 1px solid var(--accent-text); box-shadow: 0 0 0 3px var(--accent-bg); }
.fh-pitem-ic { width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0; display: grid; place-items: center; background: var(--surface-2); color: var(--text-2); }
.fh-pitem.on .fh-pitem-ic { background: linear-gradient(155deg, #004C3F, #0B6B57); color: #FFD56B; }
.fh-pitem .fh-mini { margin-top: 6px; }
.fh-pmain { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.fh-path-big .fh-st { padding-bottom: 12px; }
.fh-path-big .fh-st::before { top: 40px; }
.fh-st-card { flex: 1; min-width: 0; display: flex; flex-direction: column; border-radius: 16px; background: var(--surface); border: 1px solid var(--border); }
.fh-st.n .fh-st-card { border: 1px solid var(--accent-border); box-shadow: 0 14px 30px -24px rgba(0,60,45,.7); }
.fh-st-top { display: flex; gap: 12px; align-items: center; padding: 10px 14px 10px 10px; text-decoration: none; }
.fh-path-big .fh-st-t b { font-size: 15px; }
.fh-st-arrow { color: var(--text-3); flex-shrink: 0; }
.fh-now { margin: 0 14px 14px; padding: 12px; border-radius: 14px; background: var(--surface-2); display: flex; flex-direction: column; gap: 9px; font-size: 13px; color: var(--text-2); }
.fh-mini { display: block; height: 6px; border-radius: 99px; background: var(--surface-2); overflow: hidden; }
.fh-now .fh-mini { background: var(--border); }
.fh-mini i { display: block; height: 100%; background: var(--accent-text); border-radius: 99px; }
.fh-gbtn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 11px 18px; border-radius: 13px; background: var(--accent-text); color: var(--bg); font-weight: 700; font-size: 14px; text-decoration: none; align-self: flex-start; }
.fh-goal { display: flex; gap: 16px; align-items: center; padding: 18px 20px; border-radius: 20px; background: linear-gradient(135deg, var(--accent-bg) 0%, rgba(99,214,131,0.10) 55%, rgba(255,213,107,0.14) 100%); border: 1px solid var(--accent-border); }
.fh-goal-ic { width: 56px; height: 56px; border-radius: 16px; flex-shrink: 0; display: grid; place-items: center; background: linear-gradient(155deg, #004C3F, #0B6B57); color: #FFD56B; }
.fh-goal b { display: block; font-family: var(--font-fraunces), serif; font-weight: 400; font-size: clamp(20px, 2vw, 26px); color: var(--text); line-height: 1.2; }
.fh-goal small { display: block; font-size: 13px; color: var(--text-2); margin-top: 2px; }
.fh-goal-p { color: var(--accent-text) !important; font-weight: 700; margin-top: 4px !important; }

/* Catalogue */
.fh-cat { display: flex; flex-direction: column; gap: 22px; }
.fh-feat { display: grid; grid-template-columns: minmax(220px, 0.9fr) minmax(0, 1.6fr) auto; border-radius: 24px; overflow: hidden; text-decoration: none; background: var(--surface); border: 1px solid var(--border); transition: transform .2s, box-shadow .2s; }
.fh-feat:hover { transform: translateY(-2px); box-shadow: 0 22px 44px -28px rgba(0,0,0,.5); }
.fh-feat-art { position: relative; min-height: 220px; }
.fh-feat-b { display: flex; flex-direction: column; gap: 10px; padding: clamp(20px, 2.4vw, 30px); min-width: 0; }
.fh-feat-k { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; color: var(--accent-text); }
.fh-feat-b > b { font-family: var(--font-fraunces), serif; font-weight: 400; font-size: clamp(24px, 2.4vw, 32px); line-height: 1.12; color: var(--text); }
.fh-feat-d { font-size: 14px; color: var(--text-2); line-height: 1.55; max-width: 60ch; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.fh-feat-m { display: flex; flex-wrap: wrap; gap: 6px; }
.fh-feat-m span { font-size: 12px; padding: 4px 10px; border-radius: 99px; background: var(--surface-2); color: var(--text-2); }
.fh-feat .fh-gbtn { margin-top: 4px; }
.fh-feat-side { display: flex; flex-direction: column; justify-content: center; gap: 18px; padding: 24px 30px; border-left: 1px solid var(--border); background: var(--surface-2); }
.fh-feat-side span { display: flex; flex-direction: column; }
.fh-feat-side b { font-family: var(--font-fraunces), serif; font-weight: 500; font-size: 30px; color: var(--text); line-height: 1; }
.fh-feat-side small { font-size: 12px; color: var(--text-3); margin-top: 3px; }
.fh-tools { display: flex; flex-direction: column; gap: 12px; }
.fh-search { display: flex; align-items: center; gap: 9px; padding: 0 14px; border-radius: 14px; background: var(--surface); border: 1px solid var(--border); color: var(--text-3); max-width: 560px; }
.fh-search input { flex: 1; min-width: 0; border: 0; background: none; outline: none; font: inherit; font-size: 15px; color: var(--text); padding: 12px 0; }
.fh-chips { display: flex; gap: 7px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
.fh-chips::-webkit-scrollbar { display: none; }
.fh-chips button { flex-shrink: 0; font: inherit; font-size: 13px; padding: 7px 13px; border-radius: 99px; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); cursor: pointer; white-space: nowrap; }
.fh-chips button.on { background: var(--text); color: var(--bg); border: 1px solid var(--text); font-weight: 600; }
.fh-suggest { flex-direction: row; align-items: flex-start; gap: 14px; max-width: 820px; }

/* Moi */
.fh-moi { display: flex; flex-direction: column; gap: 20px; }
.fh-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.fh-stats div { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 18px 12px; text-align: center; min-width: 0; }
.fh-stats b { display: block; font-family: var(--font-fraunces), serif; font-weight: 500; font-size: 32px; color: var(--text); line-height: 1.1; }
.fh-stats small { font-size: 12px; color: var(--text-3); }
.fh-moi-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 24px; align-items: start; }
.fh-list { display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 2px 14px; }
.fh-saved { display: flex; gap: 12px; align-items: center; padding: 11px 0; border-bottom: 1px solid var(--border); text-decoration: none; }
.fh-saved:last-child { border-bottom: 0; }
.fh-wins { display: flex; flex-direction: column; gap: 8px; }
.fh-win { display: flex; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 14px; background: var(--surface); border: 1px solid var(--border); }
.fh-win b { display: block; font-size: 13.5px; color: var(--text); line-height: 1.35; }
.fh-win small { display: block; font-size: 12px; color: var(--text-3); }
.fh-medal { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; display: grid; place-items: center; color: #3A2A00; background: radial-gradient(circle at 35% 30%, #FFF1C4, #FFD56B 55%, #E5B53F); }
.fh-certs { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.fh-cert { aspect-ratio: 1.414; border-radius: 8px; padding: 14px; display: flex; flex-direction: column; gap: 6px; text-decoration: none; background: #FBFAF6; color: #14201C; box-shadow: inset 0 0 0 2px #004C3F, inset 0 0 0 6px #FBFAF6, inset 0 0 0 7px rgba(0,76,63,.35); transition: transform .2s; min-width: 0; }
.fh-cert:hover { transform: translateY(-2px) rotate(-.4deg); }
.fh-cert-k { font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase; font-weight: 700; color: #8A6A10; }
.fh-cert b { font-family: var(--font-fraunces), serif; font-weight: 500; font-size: 15px; line-height: 1.2; flex: 1; overflow-wrap: anywhere; }
.fh-cert small { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #004C3F; font-weight: 600; }
.fh-saved-ic { width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0; display: grid; place-items: center; background: var(--surface-2); color: var(--text-2); }
.fh-empty { display: flex; gap: 10px; align-items: center; padding: 14px 16px; border-radius: 16px; border: 1px dashed var(--border); color: var(--text-3); font-size: 13px; line-height: 1.45; }
.fh-empty svg { flex-shrink: 0; }

/* Moi (24/11/2026) */
.fm-hero { display: grid; grid-template-columns: minmax(260px, .9fr) minmax(0, 1.6fr); gap: 24px; align-items: center; padding: clamp(20px, 2.4vw, 30px); border-radius: 24px; color: #F3F8F5; background: radial-gradient(circle at 100% 0%, rgba(255,213,107,.18) 0 24%, transparent 25%), linear-gradient(155deg, #004C3F, #0B6B57); box-shadow: 0 18px 40px -26px rgba(0,60,45,.8); }
.fm-hero-l { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.fm-k { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; font-weight: 700; color: #FFD56B; }
.fm-lvl { display: flex; gap: 14px; align-items: center; }
.fm-lvl-badge { width: 54px; height: 54px; border-radius: 50%; flex-shrink: 0; display: grid; place-items: center; color: #3A2A00; background: radial-gradient(circle at 35% 30%, #FFF1C4, #FFD56B 55%, #E5B53F); box-shadow: 0 10px 24px -10px rgba(255,213,107,.8); animation: fmPop .6s ease both; }
@keyframes fmPop { from { transform: scale(.6); opacity: 0; } to { transform: none; opacity: 1; } }
.fm-lvl b { display: block; font-family: var(--font-fraunces), serif; font-weight: 400; font-size: clamp(22px, 2.2vw, 28px); color: #fff; line-height: 1.15; }
.fm-lvl small { display: block; font-size: 13px; color: rgba(243,248,245,.82); margin-top: 3px; }
.fm-lvl-bar { display: block; height: 8px; border-radius: 99px; background: rgba(255,255,255,.2); overflow: hidden; max-width: 360px; }
.fm-lvl-bar i { display: block; height: 100%; background: #FFD56B; border-radius: 99px; }
.fm-hero-stats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
.fm-hero-stats div { padding: 14px 10px; border-radius: 16px; background: rgba(255,255,255,.10); box-shadow: inset 0 0 0 1px rgba(255,255,255,.12); text-align: center; min-width: 0; }
.fm-hero-stats b { display: block; font-family: var(--font-fraunces), serif; font-weight: 500; font-size: clamp(22px, 2vw, 30px); color: #fff; line-height: 1.1; white-space: nowrap; }
.fm-hero-stats small { display: block; font-size: 11.5px; color: rgba(243,248,245,.8); line-height: 1.3; margin-top: 4px; overflow-wrap: anywhere; }
.fm-row { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr); gap: 16px; align-items: stretch; }
.fm-act-h { display: flex; justify-content: space-between; align-items: center; gap: 10px; font-size: 13px; color: var(--text-2); }
.fm-act-h b { color: var(--text); }
.fm-act-body { display: flex; gap: 28px; align-items: center; flex-wrap: wrap; }
.fm-heat-wrap { display: flex; gap: 6px; min-width: 0; }
.fm-days { display: grid; grid-template-rows: repeat(7, 22px); gap: 5px; font-size: 10px; color: var(--text-muted); align-items: center; }
.fm-heat { display: grid; grid-template-columns: repeat(12, 22px); gap: 5px; }
.fm-act-sum { flex: 1; min-width: 180px; display: flex; flex-direction: column; gap: 10px; }
.fm-act-sum div { display: flex; align-items: baseline; gap: 10px; padding: 10px 14px; border-radius: 14px; background: var(--surface-2); }
.fm-act-sum b { font-family: var(--font-fraunces), serif; font-weight: 500; font-size: 24px; color: var(--text); min-width: 34px; }
.fm-act-sum small { font-size: 12.5px; color: var(--text-3); }
.fm-heat-col { display: grid; grid-template-rows: repeat(7, 22px); gap: 5px; }
.fm-heat i, .fm-heat-leg i { display: block; width: 22px; height: 22px; border-radius: 6px; background: var(--surface-2); }
.fm-heat i.l1, .fm-heat-leg i.l1 { background: rgba(99,214,131,.35); }
.fm-heat i.l2, .fm-heat-leg i.l2 { background: rgba(99,214,131,.65); }
.fm-heat i.l3, .fm-heat-leg i.l3 { background: var(--accent-text); }
.fm-heat-leg { display: flex; align-items: center; justify-content: flex-end; gap: 4px; font-size: 11px; color: var(--text-3); }
.fm-heat-leg i { width: 12px; height: 12px; aspect-ratio: auto; border-radius: 3px; }
.fm-next { justify-content: flex-start; }
.fm-next .fm-next-in { flex: 1; }
.fm-next-in { display: flex; gap: 16px; align-items: center; text-decoration: none; }
.fm-ring { --p: 0; position: relative; width: 104px; height: 104px; border-radius: 50%; flex-shrink: 0; display: grid; place-items: center; }
.fm-ring::before { content: ""; position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(#E5B53F calc(var(--p) * 1%), var(--surface-2) 0); -webkit-mask: radial-gradient(closest-side, transparent 78%, #000 79%); mask: radial-gradient(closest-side, transparent 78%, #000 79%); }
.fm-ring b { font-family: var(--font-fraunces), serif; font-weight: 500; font-size: 19px; color: var(--text); }
.fm-skills { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.fm-skill { display: flex; gap: 12px; align-items: center; padding: 14px; border-radius: 16px; background: var(--surface); border: 1px solid var(--border); font: inherit; text-align: left; cursor: pointer; width: 100%; transition: border .15s, box-shadow .15s, transform .15s; }
.fm-skill:hover { border: 1px solid var(--accent-border); transform: translateY(-1px); }
.fm-skill.on { border: 1px solid var(--accent-text); box-shadow: 0 0 0 3px var(--accent-bg); }
.fm-skill-c { color: var(--text-3); flex-shrink: 0; transition: transform .2s; }
.fm-skill-list { display: flex; flex-direction: column; gap: 10px; animation: fhIn .25s ease both; }
.fm-skill-list .fh-sect-h b { font-size: 15px; color: var(--text); }
.fm-sk-row { gap: 12px; }
.fm-skill-cov { width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0; }
.fm-skill-p { font-family: var(--font-fraunces), serif; font-size: 20px; color: var(--text); flex-shrink: 0; }
.fm-ms { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 150px), 1fr)); gap: 10px; }
@media (min-width: 1500px) { .fm-ms { grid-template-columns: repeat(9, minmax(0, 1fr)); } }
.fm-m { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 7px; padding: 16px 12px; border-radius: 18px; background: var(--surface); border: 1px dashed var(--border); }
.fm-m b { font-size: 13px; color: var(--text-2); line-height: 1.3; }
.fm-m small { font-size: 11.5px; color: var(--text-3); }
.fm-m .fh-mini { width: 80%; }
.fm-m-ic { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; background: var(--surface-2); color: var(--text-muted); }
.fm-m.ok { border: 1px solid rgba(229,181,63,.45); background: linear-gradient(170deg, rgba(255,213,107,.12), var(--surface) 70%); }
.fm-m.ok b { color: var(--text); }
.fm-m.ok small { color: #B58A1C; font-weight: 700; }
[data-theme=light] .fm-m.ok small { color: #8A6A10; }
.fm-m.ok .fm-m-ic { color: #3A2A00; background: radial-gradient(circle at 35% 30%, #FFF1C4, #FFD56B 55%, #E5B53F); box-shadow: 0 8px 18px -10px rgba(229,181,63,.9); }
@media (max-width: 1100px) { .fm-hero { grid-template-columns: minmax(0, 1fr); } .fm-row { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 1100px) { .fm-skills { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 767px) { .fm-hero-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } .fm-hero-stats div:first-child { grid-column: span 2; } .fm-skills { grid-template-columns: minmax(0, 1fr); } .fm-heat { grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 3px; flex: 1; } .fm-heat-wrap { width: 100%; } .fm-heat-col, .fm-days { gap: 3px; grid-template-rows: repeat(7, auto); } .fm-heat i { width: auto; height: auto; aspect-ratio: 1; } .fm-act-sum { flex-direction: row; min-width: 0; } .fm-act-sum div { flex: 1; flex-direction: column; gap: 0; padding: 8px 10px; } }
@media (prefers-reduced-motion: reduce) { .fm-lvl-badge { animation: none; } }

.fh-bar { display: none; }
.fh a:focus-visible, .fh button:focus-visible, .fh input:focus-visible { outline: 2px solid var(--accent-text); outline-offset: 2px; }

@media (max-width: 1180px) {
  .fh-feat { grid-template-columns: minmax(200px, 0.9fr) minmax(0, 1.6fr); }
  .fh-feat-side { display: none; }
}
@media (max-width: 1100px) {
  .fh-today { grid-template-columns: minmax(0, 1fr); }
  .fh-pgrid { grid-template-columns: minmax(0, 1fr); }
  .fh-plist { display: none; }
  .fh-chips.fh-mob { display: flex; }
}
@media (max-width: 900px) {
  .fh-moi-grid { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 767px) {
  .fh { padding: 14px 16px calc(96px + env(safe-area-inset-bottom)); gap: 16px; }
  .fh-tabs-wrap { display: none; }
  .fh-bar { display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 30; justify-content: space-around; padding: 6px 8px calc(6px + env(safe-area-inset-bottom)); background: var(--bg); border-top: 1px solid var(--border); box-shadow: 0 -8px 24px -18px rgba(0,0,0,.35); }
  .fh-bar button { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 0; border: 0; background: none; font: inherit; font-size: 11px; font-weight: 600; color: var(--text-3); cursor: pointer; }
  .fh-bar button.on { color: var(--accent-text); }
  .fh-hero { grid-template-columns: minmax(0, 1fr); }
  .fh-hero-art { display: none; }
  .fh-feat { grid-template-columns: minmax(0, 1fr); }
  .fh-feat-art { min-height: 130px; }
  .fh-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .fh-stats b { font-size: 26px; }
  .fh-certs { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  /* Cartes en lignes compactes sur téléphone */
  .fh-cards { grid-template-columns: minmax(0, 1fr); gap: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 2px 12px; }
  .fh-fc { flex-direction: row; align-items: center; gap: 12px; border: 0; border-radius: 0; border-bottom: 1px solid var(--border); padding: 10px 0; background: none; overflow: visible; }
  .fh-fc:last-child { border-bottom: 0; }
  .fh-fc:hover { transform: none; box-shadow: none; border: 0; border-bottom: 1px solid var(--border); }
  .fh-fc:last-child:hover { border-bottom: 0; }
  .fh-fc-cov { width: 52px; height: 52px; aspect-ratio: auto; border-radius: 14px; overflow: hidden; flex-shrink: 0; background: var(--cov-sm); }
  .fh-fc-tag { display: none; }
  .fh-fc-b { padding: 0; flex-direction: row; flex-wrap: wrap; align-items: center; column-gap: 10px; row-gap: 2px; }
  .fh-fc-b b { flex: 1 1 100%; }
  .fh-fc-b small { flex: 1 1 0; min-width: 0; }
  .fh-fc-st { margin: 0; padding: 0; min-height: 0; }
  .fh-suggest { flex-direction: column; }
}
@media (prefers-reduced-motion: reduce) { .fh-body { animation: none; } .fh-fc, .fh-hero, .fh-feat, .fh-cert { transition: none; } }
`
