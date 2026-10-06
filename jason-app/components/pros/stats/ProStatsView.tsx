'use client'
// « Mes statistiques » des photographes et équipes de ménage (05/10/2026),
// inspirée de la page « Mes Statistiques » de Driing : une bande de chiffres
// cliquables qui pilote la courbe (période d'avant en pointillés), puis
// d'où viennent les visiteurs, ce que Google montre, l'écran, les clics et
// « Ce qu'il faut retenir ». Données calculées par lib/visibility/pro-load.ts.
import { useState } from 'react'
import Link from 'next/link'
import {
  Users, Eye, Timer, CursorClick, ChatCircle, MagnifyingGlass, ArrowSquareOut, FilePdf,
  Compass, MapPin, DeviceMobile, CheckCircle, Lightbulb, Star, Camera, Broom, InstagramLogo, Globe, Images, CaretDown, CalendarBlank, Buildings,
} from '@phosphor-icons/react/dist/ssr'
import HubHero, { HeroEm, heroCard, heroCta } from '@/components/dashboard/HubHero'
import InlineStyle from '@/components/ui/InlineStyle'
import StatsChart from './StatsChart'
import MonthlyReportToggle from './MonthlyReportToggle'
import { AMBER, AMBER_DARK, BarList, EmptyNote, MeasureNote, PctPill, PlacePill, Pills, StatCard, nf } from './ui'
import { formatDuration, placeOf } from '@/lib/visibility/rules'
import {
  filterGoogle, frenchDate, GOOGLE_TABS, PRO_PERIODS, screenAdvice, sortByImpressions,
  type GoogleTab, type MetricKey, type ProStatsData,
} from '@/lib/visibility/pro-stats'

const GRANULARITY_WORD = { day: 'par jour', week: 'par semaine', month: 'par mois' } as const
const shortDate = (iso: string) => frenchDate(iso, { year: false })
/** Avec l'année au-delà de 2 mois (« du 6 octobre 2025 au 5 octobre 2026 ») */
const rangeDate = (iso: string, days: number) => frenchDate(iso, { year: days > 60 })

const PRINT_CSS = `
@media print {
  .dash-sidebar, .dash-header, .dash-mobile-sidebar-wrap, .dash-main ~ *, .stats-noprint, .stats-noprint-tabs { display: none !important; }
  .dash-main { margin-left: 0 !important; padding-top: 0 !important; }
  html, body, .dash-main { background: #fff !important; }
  .stats-wrap { padding: 0 !important; }
  .stats-card, .stats-tile { break-inside: avoid; }
  .fade-up { animation: none !important; opacity: 1 !important; transform: none !important; }
}
@page { margin: 14mm; }
`

export default function ProStatsView({ data, basePath, previewId }: { data: ProStatsData; basePath: string; previewId?: string | null }) {
  const d = data
  const photo = d.metier === 'photographe'
  const [metric, setMetric] = useState<MetricKey>('visitors')
  const href = (k: string) => `${basePath}?periode=${k}${previewId ? `&id=${previewId}` : ''}`
  const fichePath = `/dashboard/ma-fiche-${photo ? 'photographe' : 'menage'}${previewId ? `?id=${previewId}` : ''}`

  const tiles: Array<{ key: MetricKey; label: string; hint?: string; Icon: typeof Users; fmt: (v: number) => string }> = [
    { key: 'visitors', label: 'Visiteurs', Icon: Users, fmt: nf },
    { key: 'views', label: 'Vues de la fiche', Icon: Eye, fmt: nf },
    { key: 'time', label: 'Temps de lecture', hint: 'moyen par visiteur', Icon: Timer, fmt: v => formatDuration(v) },
    { key: 'clicks', label: 'Clics', hint: photo ? 'portfolio, Instagram' : 'site, Instagram', Icon: CursorClick, fmt: nf },
    { key: 'demandes', label: 'Demandes reçues', Icon: ChatCircle, fmt: nf },
    { key: 'google', label: 'Vu sur Google', hint: 'affichages', Icon: MagnifyingGlass, fmt: nf },
  ]
  const active = tiles.find(t => t.key === metric)!
  const m = d.metrics[metric]
  const axisFmt = metric === 'time' ? (v: number) => (v < 60 ? `${v} s` : `${Math.round(v / 60)} min`) : nf

  return (
    <section style={s.wrap} className="stats-wrap">
      <InlineStyle css={PRINT_CSS} />

      {d.isAdminPreview && (
        <div style={s.adminBanner} className="stats-noprint">
          <Star size={14} weight="fill" />
          <span><strong>Aperçu admin :</strong> statistiques de la fiche de <strong>{d.fiche.name}</strong>, telles que le pro les voit.</span>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 14, flexWrap: 'wrap' }}>
            <Link href={fichePath} style={{ color: AMBER_DARK, textDecoration: 'underline' }}>Sa fiche</Link>
            <Link href={photo ? '/dashboard/admin/photographes' : '/dashboard/admin/menage'} style={{ color: AMBER_DARK, textDecoration: 'underline' }}>Retour à l&apos;admin</Link>
          </span>
        </div>
      )}

      <HubHero
        eyebrowIcon={photo ? <Camera size={14} weight="fill" /> : <Broom size={14} weight="fill" />}
        eyebrow={`Tes statistiques · ${d.fiche.name}`}
        title={<>Qui voit ta fiche, <HeroEm>et d&apos;où</HeroEm></>}
        desc={<>
          Dans l&apos;annuaire depuis le {frenchDate(d.fiche.onlineSince)}. Les visites de ta fiche, ce que Google en montre et les demandes qu&apos;elle t&apos;apporte, comparés à la période d&apos;avant.
        </>}
        aside={
          <div style={{ ...heroCard, flex: '1 1 100%', minWidth: 0 }} className="stats-noprint">
            <div style={s.asideLabel}><CalendarBlank size={14} weight="bold" /> Période</div>
            <div style={s.periodRow}>
              {PRO_PERIODS.map(p => {
                const on = p.key === d.period.key
                return (
                  <Link key={p.key} href={href(p.key)} scroll={false} aria-current={on ? 'page' : undefined} style={{ ...s.periodBtn, ...(on ? s.periodOn : {}) }}>
                    {p.label}
                  </Link>
                )
              })}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Du {rangeDate(d.period.start, d.period.days)} au {rangeDate(d.period.end, d.period.days)}</div>
            <button type="button" onClick={() => window.print()} style={s.pdfBtn}>
              <FilePdf size={16} weight="bold" /> Enregistrer en PDF
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 16px' }} className="stats-noprint">
          {d.fiche.publicUrl ? (
            <a href={d.fiche.publicUrl} target="_blank" rel="noopener noreferrer" style={heroCta}>
              Voir ma fiche publique <ArrowSquareOut size={15} weight="bold" />
            </a>
          ) : (
            <span style={s.offline}>Ta fiche n&apos;est pas en ligne pour le moment : les chiffres repartiront dès sa publication.</span>
          )}
          <Link href={fichePath} style={s.heroLink}>Modifier ma fiche</Link>
        </div>
      </HubHero>

      {/* ── Chiffres + courbe ── */}
      <section style={s.overview} className="stats-card">
        <div style={s.tiles}>
          {tiles.map(t => {
            const mt = d.metrics[t.key]
            const on = t.key === metric
            return (
              <button key={t.key} type="button" onClick={() => setMetric(t.key)} aria-pressed={on} style={{ ...s.tile, ...(on ? s.tileOn : {}) }} className="stats-tile">
                <span style={s.tileLabel}>
                  <t.Icon size={15} weight={on ? 'fill' : 'duotone'} color="var(--accent-text)" />
                  {t.label}
                </span>
                <span style={s.tileValue}>{mt.value === null ? '–' : t.fmt(mt.value)}</span>
                <span style={s.tileFoot}>
                  {mt.pct !== null ? (
                    <><PctPill pct={mt.pct} size="sm" /> <span>vs {mt.prev === null ? '–' : t.fmt(mt.prev)} avant</span></>
                  ) : mt.value === null ? (
                    <span>{t.key === 'google' ? 'Indisponible pour le moment' : t.key === 'time' ? 'Aucune mesure sur la période' : 'Mesurés à partir de maintenant'}</span>
                  ) : mt.since ? (
                    <span>Mesuré depuis le {shortDate(mt.since)}</span>
                  ) : (
                    <span>{t.hint ?? 'Rien sur la période d’avant'}</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>

        <div style={s.chartHead}>
          <div>
            <div style={s.chartTitle}>{active.label} <span style={{ color: 'var(--text-3)', fontFamily: 'inherit', fontSize: 14 }}>· {GRANULARITY_WORD[m.granularity]}</span></div>
            {metric === 'google' && <div style={s.chartSub}>Chiffres de Google, publiés avec 2 jours de retard : du {rangeDate(d.googlePeriod.start, d.googlePeriod.days)} au {rangeDate(d.googlePeriod.end, d.googlePeriod.days)}.</div>}
            {metric === 'time' && <div style={s.chartSub}>Temps passé sur ta fiche, en moyenne par visiteur.</div>}
          </div>
          <div style={s.legend}>
            <span style={s.legendItem}><span style={{ width: 18, height: 3, borderRadius: 2, background: 'var(--accent-text)' }} /> {d.period.label}</span>
            {m.series?.some(p => p.prev !== null) && <span style={s.legendItem}><span style={{ width: 18, borderTop: '2px dashed var(--text-muted)' }} /> Période d&apos;avant</span>}
            {m.incompleteLast && <span style={s.legendItem}><span style={{ width: 18, borderTop: '2.5px dotted var(--accent-text)' }} /> En cours</span>}
          </div>
        </div>

        {m.series && m.value !== null ? (
          <StatsChart
            series={m.series}
            granularity={m.granularity}
            incompleteLast={m.incompleteLast}
            format={axisFmt}
            showPrev={m.series.some(p => p.prev !== null)}
            unmeasuredUntil={m.since}
          />
        ) : metric === 'clicks' ? (
          <EmptyNote>
            Les clics jour par jour sont mesurés à partir de maintenant. Depuis la création de ta fiche : {d.clicks.cumulative.map(c => `${nf(c.value)} ${c.label.toLowerCase()}`).join(', ')}.
          </EmptyNote>
        ) : (
          <EmptyNote>
            Google n&apos;a pas encore montré ta fiche sur la période. C&apos;est fréquent les premières semaines : en attendant, partage le lien de ta fiche à tes clients.
            {d.google.adminError && <span style={s.adminErr}>Admin : {d.google.adminError}</span>}
          </EmptyNote>
        )}
        {m.since && m.value !== null && (
          <MeasureNote>Mesuré depuis le {frenchDate(m.since)} : rien n&apos;apparaît avant cette date, et pas d&apos;écart en % tant que la période d&apos;avant n&apos;est pas entièrement mesurée.</MeasureNote>
        )}
      </section>

      {/* ── Cartes ── */}
      <div style={s.cols}>
        <div style={s.col}>
          <SourcesCard d={d} />
          <GoogleCard d={d} />
          {d.cityPage && <CityPageCard d={d} />}
        </div>
        <div style={s.col}>
          <PlacesCard d={d} />
          <ScreenCard d={d} />
          <ClicksCard d={d} />
        </div>
      </div>

      <StatCard icon={<Lightbulb size={18} weight="duotone" />} title="Ce qu'il faut retenir" subtitle={`Sur les ${d.period.key === '28j' ? '30 derniers jours' : d.period.label.toLowerCase() + ' écoulés'}`} style={{ marginTop: 20 }}>
        <div style={s.takeaways}>
          {d.takeaways.map(t => (
            <div key={t.title} style={{ ...s.takeaway, ...(t.tone === 'ok' ? s.takeawayOk : s.takeawayTip) }}>
              <span style={{ ...s.takeawayIcon, ...(t.tone === 'ok' ? {} : { color: AMBER_DARK, background: 'rgba(255,213,107,0.25)', border: `1px solid ${AMBER}55` }) }}>
                {t.tone === 'ok' ? <CheckCircle size={18} weight="fill" /> : <Lightbulb size={18} weight="fill" />}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={s.takeawayTitle}>{t.title}</div>
                <p style={s.takeawayText}>{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </StatCard>

      <div style={s.footer}>
        <MonthlyReportToggle initialOn={d.monthlyReport.on} canEdit={d.monthlyReport.canEdit} />
        <p style={s.privacy}>
          Aucune donnée personnelle de tes visiteurs n&apos;est gardée : ni nom, ni adresse IP, seulement le pays, la ville et le type d&apos;écran.
          {' '}<Link href="/dashboard/aide/communaute-compte/statistiques-fiche" style={{ color: 'var(--accent-text)' }}>D&apos;où viennent ces chiffres ?</Link>
        </p>
      </div>
    </section>
  )
}

// ── Cartes ────────────────────────────────────────────────────────────────

function SourcesCard({ d }: { d: ProStatsData }) {
  const [tab, setTab] = useState<'canaux' | 'sites'>('canaux')
  return (
    <StatCard icon={<Compass size={18} weight="duotone" />} title="Comment ils te trouvent" subtitle={`${nf(d.visits.visitors)} visiteur${d.visits.visitors > 1 ? 's' : ''} sur la période, selon leur première page vue`}>
      <Pills label="Provenance" value={tab} onChange={setTab} items={[{ key: 'canaux', label: 'Canaux' }, { key: 'sites', label: 'Sites' }]} />
      {tab === 'canaux'
        ? <BarList rows={d.visits.sources} limit={8} empty="Pas encore de visite mesurée sur la période. Partage le lien de ta fiche : chaque visite apparaîtra ici." />
        : <BarList rows={d.visits.sites} limit={8} empty="Aucun site ne t'a encore envoyé de visiteur sur la période (en dehors de Google)." />}
      {d.visits.adminError && <MeasureNote><span style={s.adminErr}>Admin : {d.visits.adminError}</span></MeasureNote>}
    </StatCard>
  )
}

function PlacesCard({ d }: { d: ProStatsData }) {
  const [tab, setTab] = useState<'pays' | 'regions' | 'villes'>('villes')
  const rows = tab === 'pays' ? d.visits.countries : tab === 'regions' ? d.visits.regions : d.visits.cities
  return (
    <StatCard icon={<MapPin size={18} weight="duotone" />} title="D'où ils viennent" subtitle="Lieu de connexion des visiteurs">
      <Pills label="Lieu" value={tab} onChange={setTab} items={[{ key: 'pays', label: 'Pays' }, { key: 'regions', label: 'Régions' }, { key: 'villes', label: 'Villes' }]} />
      <BarList rows={rows} limit={6} empty={d.visits.detailsSince
        ? `Le pays et la ville de tes visiteurs sont mesurés depuis le ${frenchDate(d.visits.detailsSince)} : ils apparaîtront ici dès les prochaines visites.`
        : 'Pas encore de visite mesurée sur la période.'} />
      {d.visits.detailsSince && rows.length > 0 && <MeasureNote>Mesuré depuis le {frenchDate(d.visits.detailsSince)} : les visites d&apos;avant n&apos;ont pas de lieu.</MeasureNote>}
    </StatCard>
  )
}

function ScreenCard({ d }: { d: ProStatsData }) {
  const total = d.visits.devices.reduce((n, r) => n + r.count, 0)
  const mobile = d.visits.devices.find(r => r.key === 'mobile')
  const mobilePct = total >= 5 ? (mobile?.pct ?? 0) : null
  return (
    <StatCard icon={<DeviceMobile size={18} weight="duotone" />} title="Sur quel écran" subtitle="Téléphone, ordinateur ou tablette">
      <BarList rows={d.visits.devices} empty={d.visits.detailsSince ? `Le type d'écran est mesuré depuis le ${frenchDate(d.visits.detailsSince)}.` : 'Pas encore de visite mesurée sur la période.'} />
      <div style={s.advice}>
        <DeviceMobile size={16} weight="duotone" color="var(--accent-text)" style={{ flexShrink: 0, marginTop: 2 }} />
        <span>{screenAdvice(d.metier, mobilePct)}</span>
      </div>
      {d.visits.detailsSince && total > 0 && <MeasureNote>Mesuré depuis le {frenchDate(d.visits.detailsSince)}.</MeasureNote>}
    </StatCard>
  )
}

function ClicksCard({ d }: { d: ProStatsData }) {
  const c = d.clicks
  const ICONS = { portfolio: Images, site: Globe, instagram: InstagramLogo } as const
  const rate = d.visits.visitors > 0 && c.demandes > 0 ? Math.round((c.demandes / d.visits.visitors) * 1000) / 10 : null
  return (
    <StatCard icon={<CursorClick size={18} weight="duotone" />} title="Clics sur ta fiche" subtitle={c.daily ? 'Ce que les visiteurs ont ouvert depuis ta fiche' : 'Depuis la création de ta fiche (le détail par période arrive)'}>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
        {(c.daily ? c.items : c.cumulative.map(x => ({ ...x, pct: null }))).map(it => {
          const Icon = ICONS[it.key]
          return (
            <li key={it.key} style={s.clickRow}>
              <span style={s.clickIcon}><Icon size={16} weight="duotone" /></span>
              <span style={{ flex: 1, fontSize: 14, color: 'var(--text)' }}>{it.label}</span>
              {it.pct !== null && <PctPill pct={it.pct} size="sm" />}
              <strong style={s.clickValue}>{nf(it.value)}</strong>
            </li>
          )
        })}
        <li style={{ ...s.clickRow, borderBottom: 'none' }}>
          <span style={s.clickIcon}><ChatCircle size={16} weight="duotone" /></span>
          <span style={{ flex: 1, fontSize: 14, color: 'var(--text)' }}>Demandes reçues</span>
          <PctPill pct={c.demandesPct} size="sm" />
          <strong style={s.clickValue}>{nf(c.demandes)}</strong>
        </li>
      </ul>
      {rate !== null && <MeasureNote>{rate.toLocaleString('fr-FR')} % de tes visiteurs t&apos;ont écrit sur la période.</MeasureNote>}
      {!c.daily && <MeasureNote>Les clics jour par jour sont mesurés à partir de maintenant : ils s&apos;afficheront par période dans quelques jours.</MeasureNote>}
    </StatCard>
  )
}

function GoogleCard({ d }: { d: ProStatsData }) {
  const g = d.google
  const [tab, setTab] = useState<GoogleTab>('toutes')
  const [all, setAll] = useState(false)
  const sorted = sortByImpressions(g.queries)
  const rows = filterGoogle(sorted, tab)
  const shown = all ? rows : rows.slice(0, 8)
  const counts = Object.fromEntries(GOOGLE_TABS.map(t => [t.key, filterGoogle(sorted, t.key).length])) as Record<GoogleTab, number>
  const firstPct = g.queries.length ? Math.round((g.firstPage / g.queries.length) * 100) : 0

  return (
    <StatCard icon={<MagnifyingGlass size={18} weight="duotone" />} title="Sur Google" subtitle={`Du ${rangeDate(d.googlePeriod.start, d.googlePeriod.days)} au ${rangeDate(d.googlePeriod.end, d.googlePeriod.days)} · chiffres publiés par Google avec 2 jours de retard`}>
      {g.status !== 'ok' ? (
        <EmptyNote>
          {!d.fiche.slug || !d.fiche.isActive
            ? 'Ta fiche n’est pas encore en ligne : Google la montrera une fois publiée.'
            : 'Google n’a pas encore montré ta fiche sur la période. Il faut souvent 2 à 4 semaines à une nouvelle page pour apparaître dans les recherches.'}
          {g.adminError && <span style={s.adminErr}>Admin : {g.adminError}</span>}
        </EmptyNote>
      ) : (
        <>
          <div style={s.gTiles}>
            <div style={s.gTile}>
              <span style={s.gLabel}>Affichages</span>
              <span style={s.gValue}>{nf(g.impressions)}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-3)' }}>
                <PctPill pct={g.pct} size="sm" /> {nf(g.clicks)} clic{g.clicks > 1 ? 's' : ''} vers ta fiche
              </span>
            </div>
            <div style={s.gTile}>
              <span style={s.gLabel}>En première page</span>
              <span style={s.gValue}>{nf(g.firstPage)} <span style={{ fontSize: 15, color: 'var(--text-3)', fontFamily: 'var(--font-outfit), sans-serif' }}>sur {nf(g.queries.length)} recherche{g.queries.length > 1 ? 's' : ''}</span></span>
              <span style={{ height: 8, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden', marginTop: 4 }}>
                <span style={{ display: 'block', height: '100%', width: `${Math.max(firstPct ? 4 : 0, firstPct)}%`, background: 'var(--accent-text)', borderRadius: 999 }} />
              </span>
            </div>
          </div>
          <Pills label="Recherches" value={tab} onChange={t => { setTab(t); setAll(false) }} items={GOOGLE_TABS.map(t => ({ ...t, count: counts[t.key] }))} />
          {rows.length === 0 ? (
            <EmptyNote>Aucune recherche dans cette catégorie sur la période.</EmptyNote>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <li style={s.gHead}><span>Place</span><span style={{ flex: 1 }}>Recherche</span><span>Affichages</span></li>
              {shown.map(q => (
                <li key={q.query} style={s.gRow}>
                  <PlacePill position={q.position} />
                  <span style={s.gQuery} title={q.query}>
                    {q.query}
                    {q.delta !== null && q.delta !== 0 && (
                      <span style={{ marginLeft: 8, fontSize: 11.5, fontWeight: 700, color: q.delta > 0 ? 'var(--accent-text)' : AMBER_DARK }}>
                        {q.delta > 0 ? `+${q.delta}` : q.delta} place{Math.abs(q.delta) > 1 ? 's' : ''}
                      </span>
                    )}
                    {q.isNew && <span style={s.newTag}>nouvelle</span>}
                  </span>
                  <span style={s.gImp}>{nf(q.impressions)}</span>
                </li>
              ))}
            </ul>
          )}
          {rows.length > 8 && (
            <button type="button" onClick={() => setAll(v => !v)} style={s.moreBtn} className="stats-noprint">
              {all ? 'Voir moins' : `Voir les ${rows.length} recherches`} <CaretDown size={13} weight="bold" style={{ transform: all ? 'rotate(180deg)' : 'none' }} />
            </button>
          )}
          <MeasureNote>
            Place moyenne sur la période (vert foncé : première page). Google ne détaille pas les recherches trop rares : la liste peut compter moins d&apos;affichages que le total.
            {sorted[0] && placeOf(sorted[0].position) > 10 && ' Ajoute les mots de tes recherches principales (ville, quartier, type de logement) à ta présentation pour remonter.'}
          </MeasureNote>
        </>
      )}
    </StatCard>
  )
}

// Page de la ville du pro (06/10/2026, Jason : « les stats liées à la page
// photographe de la ville du client sur son profil »)
export function CityPageCard({ d }: { d: ProStatsData }) {
  const c = d.cityPage!
  const metierWord = d.metier === 'photographe' ? 'photographes' : 'équipes de ménage'
  return (
    <StatCard icon={<Buildings size={18} weight="duotone" />} title={`La page « ${d.metier === 'photographe' ? 'Photographe' : 'Ménage'} à ${c.label} »`}
      subtitle={c.listed ? `Ta fiche y est présentée aux hôtes qui cherchent des ${metierWord} à ${c.label}` : `Ta fiche y sera présentée dès qu'elle sera en ligne`}
      right={<a href={`https://jasonmarinho.com${c.path}`} target="_blank" rel="noopener noreferrer" style={s.heroLink} className="stats-noprint">Voir la page <ArrowSquareOut size={12} weight="bold" style={{ verticalAlign: '-1px' }} /></a>}>
      <div style={s.gTiles}>
        <div style={s.gTile}>
          <span style={s.gLabel}>Visiteurs de la page</span>
          <span style={s.gValue}>{nf(c.visitors)}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-3)' }}>
            <PctPill pct={c.pct} size="sm" /> {nf(c.pageViews)} page{c.pageViews > 1 ? 's' : ''} vue{c.pageViews > 1 ? 's' : ''}
          </span>
        </div>
        <div style={s.gTile}>
          <span style={s.gLabel}>Venus sur ta fiche depuis la page</span>
          <span style={s.gValue}>{nf(c.toFiche)}</span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>visiteur{c.toFiche > 1 ? 's' : ''} sur la période</span>
        </div>
        <div style={s.gTile}>
          <span style={s.gLabel}>Sur Google</span>
          <span style={s.gValue}>{c.google.status === 'ok' ? nf(c.google.impressions) : '–'}</span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {c.google.status === 'ok'
              ? `affichage${c.google.impressions > 1 ? 's' : ''} · ${nf(c.google.clicks)} clic${c.google.clicks > 1 ? 's' : ''}${c.google.position !== null ? ` · place ${String(c.google.position).replace('.', ',')}` : ''}`
              : c.google.status === 'error' ? 'Google indisponible pour le moment' : 'pas encore d’affichage sur la période'}
          </span>
        </div>
      </div>
      {c.google.status === 'ok' && c.google.queries.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          <li style={s.gHead}><span>Place</span><span style={{ flex: 1 }}>Ce que les hôtes tapent sur Google</span><span>Affichages</span></li>
          {c.google.queries.map(q => (
            <li key={q.query} style={s.gRow}>
              <PlacePill position={q.position} />
              <span style={s.gQuery} title={q.query}>{q.query}</span>
              <span style={s.gImp}>{nf(q.impressions)}</span>
            </li>
          ))}
        </ul>
      )}
      <MeasureNote>
        Visiteurs mesurés sur le site, Google avec 2 jours de retard. Plus la page de ta ville monte dans Google, plus ta fiche est vue : partage-la aussi à tes clients hôtes.
      </MeasureNote>
    </StatCard>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  wrap: { padding: 'clamp(16px, 3vw, 44px)', width: '100%', minWidth: 0 },
  adminBanner: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: '10px 16px', background: 'rgba(255,213,107,0.14)', border: `1px solid ${AMBER}55`, borderRadius: 12, fontSize: 13, color: AMBER_DARK, marginBottom: 18 },
  asideLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.4 },
  periodRow: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr) minmax(0, 1fr)', gap: 6 },
  periodBtn: { textAlign: 'center', padding: '8px 6px', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none', color: 'var(--text-2)', border: '1px solid var(--border)', background: 'var(--bg)', whiteSpace: 'nowrap' },
  periodOn: { color: 'var(--bg)', background: 'var(--accent-text)', border: '1px solid var(--accent-text)' },
  pdfBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
  heroLink: { fontSize: 13.5, fontWeight: 600, color: 'var(--accent-text)', textDecoration: 'underline', textUnderlineOffset: 3 },
  offline: { fontSize: 13.5, color: AMBER_DARK, background: 'rgba(255,213,107,0.18)', border: `1px solid ${AMBER}55`, borderRadius: 10, padding: '8px 12px' },

  overview: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 'clamp(14px, 2vw, 22px)', minWidth: 0 },
  tiles: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 10, marginBottom: 22 },
  tile: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: '14px 14px 12px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', textAlign: 'left', minWidth: 0, position: 'relative' },
  tileOn: { border: '1px solid var(--accent-text)', background: 'var(--accent-bg)', boxShadow: 'inset 0 -3px 0 var(--accent-text)' },
  tileLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', lineHeight: 1.3 },
  tileValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(24px, 2.2vw, 30px)', color: 'var(--text)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' },
  tileFoot: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.35, minHeight: 20 },

  chartHead: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px 20px', flexWrap: 'wrap', marginBottom: 14 },
  chartTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 19, color: 'var(--text)' },
  chartSub: { fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 },
  legend: { display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--text-2)' },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: 6 },

  cols: { display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start', marginTop: 20 },
  col: { flex: '1 1 460px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 },

  advice: { display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16, padding: '12px 14px', borderRadius: 12, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', fontSize: 13.5, color: 'var(--text)', lineHeight: 1.55 },

  clickRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--border)' },
  clickIcon: { width: 32, height: 32, borderRadius: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--accent-text)', flexShrink: 0 },
  clickValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: 20, fontWeight: 400, color: 'var(--text)', minWidth: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' },

  gTiles: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 10, marginBottom: 16 },
  gTile: { display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 16px', borderRadius: 14, background: 'var(--bg)', border: '1px solid var(--border)', minWidth: 0 },
  gLabel: { fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' },
  gValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: 28, color: 'var(--text)', lineHeight: 1.15 },
  gHead: { display: 'flex', gap: 12, padding: '0 0 8px', fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: '1px solid var(--border)' },
  gRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' },
  gQuery: { flex: 1, minWidth: 0, fontSize: 14, color: 'var(--text)', overflowWrap: 'anywhere', lineHeight: 1.4 },
  gImp: { fontSize: 14, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', minWidth: 48, textAlign: 'right' },
  newTag: { marginLeft: 8, fontSize: 10.5, fontWeight: 700, padding: '1px 7px', borderRadius: 999, color: AMBER_DARK, background: 'rgba(255,213,107,0.25)', textTransform: 'uppercase', letterSpacing: 0.3 },
  moreBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--accent-border)', background: 'transparent', color: 'var(--accent-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer' },

  takeaways: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 12 },
  takeaway: { display: 'flex', gap: 12, alignItems: 'flex-start', padding: '16px 16px', borderRadius: 14, minWidth: 0 },
  takeawayOk: { background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' },
  takeawayTip: { background: 'rgba(255,213,107,0.10)', border: `1px solid ${AMBER}40` },
  takeawayIcon: { width: 34, height: 34, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent-text)', background: 'var(--surface)', border: '1px solid var(--accent-border)' },
  takeawayTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 16.5, color: 'var(--text)', marginBottom: 4 },
  takeawayText: { fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 },

  footer: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 },
  privacy: { fontSize: 12.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.6 },
  adminErr: { display: 'block', marginTop: 8, fontSize: 12, color: AMBER_DARK },
}

