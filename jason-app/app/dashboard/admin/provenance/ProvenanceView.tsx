import Link from 'next/link'
import {
  LinkSimple, UsersThree, ChartBar, Info, Warning, CursorClick, UserPlus, Eye, ChartLineUp, Broadcast, GoogleLogo, ArrowRight,
} from '@phosphor-icons/react/dist/ssr'
import AdminHero, { adminAsideCard } from '../_ui/AdminHero'
import { AMBER, BROWN, PINK, tint } from '../_ui/theme'
import { LINK_DESTINATIONS, channelOf, type AcqKind } from '@/lib/acquisition/rules'
import { SPACE_LABEL } from '@/lib/acquisition/report'
import type { ChannelKey } from '@/lib/acquisition/traffic'
import type { ProvenanceData } from '@/lib/acquisition/load'
import { CreateLinkForm, CopyButton, ArchiveButton, AutoRefresh } from './LinkTools'

// Page « Provenance » (10/10/2026, demandes de Jason : liens suivis pour les
// groupes Facebook, provenance des comptes, puis « la partie acquisition comme
// sur mon CRM Driing »). Onglets Résultats / Liens suivis / Inscriptions.
// Règles dans lib/acquisition.

export type ProvTab = 'resultats' | 'liens' | 'inscriptions'

const KIND_COLOR: Partial<Record<AcqKind, string>> = {
  lien: 'var(--accent-text)', google: 'var(--accent-text)', facebook: AMBER, instagram: PINK, ia: PINK, 'e-mail': BROWN,
}
const colorOf = (k: AcqKind) => KIND_COLOR[k] ?? 'var(--text-3)'
const CHANNEL_COLOR: Record<ChannelKey, string> = {
  facebook: AMBER, google: 'var(--accent-text)', ia: PINK, liens: 'color-mix(in srgb, var(--accent-text) 55%, #FFD56B)',
  email: BROWN, autres: 'color-mix(in srgb, var(--accent-text) 45%, transparent)', direct: 'var(--text-3)', sans: 'color-mix(in srgb, var(--text-3) 50%, transparent)',
}
const PERIODS = [['7j', '7 jours'], ['30j', '30 jours'], ['90j', '90 jours'], ['tout', 'Depuis le début']] as const
const TABS: Array<[ProvTab, string]> = [['resultats', 'Résultats'], ['liens', 'Liens suivis'], ['inscriptions', 'Inscriptions']]

const nf = (n: number) => n.toLocaleString('fr-FR')
const dateFr = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Paris' })
const dayFr = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const timeFr = (iso: string) => new Date(iso).toLocaleString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n > 1 ? many : one}`
const pct = (cur: number, prev: number) => (prev ? Math.round(((cur - prev) / prev) * 100) : null)
const destLabel = (url: string) => LINK_DESTINATIONS.find(d => d.url === url)?.label ?? url.replace(/^https:\/\//, '').replace(/\/$/, '')

export default function ProvenanceView({ data, periode, onglet }: { data: ProvenanceData; periode: string; onglet: ProvTab }) {
  const { report, missingMigration } = data
  const periodLabel = PERIODS.find(p => p[0] === periode)?.[1] ?? '7 jours'
  const href = (o: ProvTab, p = periode) => `/dashboard/admin/provenance?onglet=${o}&periode=${p}`
  const top = data.cards.filter(c => c.key !== 'sans').sort((a, b) => (b.visitors ?? 0) - (a.visitors ?? 0))[0]

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <AutoRefresh />
      <AdminHero
        section="Provenance"
        title="D'où viennent"
        em="tes visiteurs et tes inscrits"
        desc="Ce qui fait venir les hôtes et les pros : Google, les groupes Facebook, les IA, tes liens. Jugé sur les inscriptions et les clients, pas seulement sur les clics."
        aside={
          <div style={adminAsideCard}>
            <span style={s.asideLabel}><UserPlus size={15} weight="fill" color="var(--accent-text)" /> Inscriptions · {periodLabel}</span>
            <strong style={s.asideBig}>{report.signups}</strong>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
              {data.today.signupsToday ? `${data.today.signupsToday} aujourd'hui · ` : ''}{top && (top.visitors ?? 0) > 0 ? `Premier canal de visite : ${top.label}` : 'Les visites et inscriptions apparaissent ici au fil de l\'eau'}
            </span>
          </div>
        }
      >
        <div style={s.chips}>
          {PERIODS.map(([k, label]) => (
            <Link key={k} href={href(onglet, k)} style={k === periode ? s.chipOn : s.chip}>{label}</Link>
          ))}
        </div>
      </AdminHero>

      {missingMigration && (
        <div style={s.warn}>
          <Warning size={18} weight="fill" color={AMBER} style={{ flexShrink: 0 }} />
          <span>Colle la migration <strong>20261010_126_provenance.sql</strong> dans l&apos;éditeur SQL de Supabase : sans elle, les liens suivis ne peuvent pas être créés et la provenance des inscriptions n&apos;est pas gardée.</span>
        </div>
      )}

      <nav style={s.tabs}>
        {TABS.map(([k, label]) => (
          <Link key={k} href={href(k)} style={k === onglet ? s.tabOn : s.tab}>{label}</Link>
        ))}
      </nav>

      {onglet === 'resultats' && <Resultats data={data} periodLabel={periodLabel} />}
      {onglet === 'liens' && <Liens data={data} periodLabel={periodLabel} />}
      {onglet === 'inscriptions' && <Inscriptions data={data} periodLabel={periodLabel} />}
    </div>
  )
}

// ── Résultats ──

function Resultats({ data, periodLabel }: { data: ProvenanceData; periodLabel: string }) {
  const t = data.today
  const updated = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
  const clickPct = pct(t.clicksToday, t.clicksYesterday)
  const g = t.google
  const gWeekPct = g.week && g.prevWeek ? pct(g.week.clicks, g.prevWeek.clicks) : null
  const maxRecent = Math.max(1, ...t.recentLinks.map(l => l.count))

  return (
    <>
      {/* En ce moment */}
      <section style={{ ...s.card, padding: 0, gap: 0 }}>
        <header style={{ ...s.head, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ width: 9, height: 9, borderRadius: 99, background: t.liveNow ? 'var(--accent-text)' : 'var(--text-3)', flexShrink: 0 }} />
          <strong style={{ fontSize: 15, color: 'var(--text)' }}>En ce moment sur jasonmarinho.com : {plural(t.liveNow, 'personne')}</strong>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>· {t.last30} sur les 30 dernières minutes</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)' }}>mis à jour {updated} · toutes les 5 min</span>
        </header>
        <div style={s.cols3}>
          <div style={s.col}>
            <span style={s.colTitle}>Sur quelles pages, là</span>
            {t.livePages.length ? <Ranked items={t.livePages} /> : <span style={s.muted}>Personne pour l&apos;instant.</span>}
          </div>
          <div style={s.col}>
            <span style={s.colTitle}>D&apos;où ils viennent {t.sourcesDay === 'today' ? 'aujourd\'hui' : 'hier'}</span>
            {t.sourcesDay === 'yesterday' && <span style={s.muted}>Pas encore de visite aujourd&apos;hui. Hier :</span>}
            {t.sources.length ? <Ranked items={t.sources} /> : <span style={s.muted}>Rien à afficher.</span>}
          </div>
          <div style={s.col}>
            <span style={s.colTitle}>La journée</span>
            <span style={{ fontSize: 14, color: 'var(--text-2)' }}><strong style={s.bigInline}>{t.visitorsToday}</strong> {t.visitorsToday > 1 ? 'visiteurs' : 'visiteur'} · {plural(t.viewsToday, 'page vue', 'pages vues')}</span>
            <span style={s.muted}>Hier, journée entière : <strong>{t.visitorsYesterday}</strong> visiteurs. La journée n&apos;est pas finie : c&apos;est un repère, pas une comparaison.</span>
            <span style={s.muted}>Inscriptions : <strong>{t.signupsToday}</strong> aujourd&apos;hui, {t.signupsYesterday} hier.</span>
          </div>
        </div>
      </section>

      {/* Par canal */}
      <section style={s.card}>
        <header style={s.head}>
          <span style={{ ...s.icon, background: tint('var(--accent-text)', 14), color: 'var(--accent-text)' }}><ChartLineUp size={18} weight="bold" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={s.title}>Par canal</h2>
            <p style={s.sub}>Visiteurs (première page de leur visite), inscriptions et clients venus de chaque canal, sur {periodLabel.toLowerCase()}. Un client a au moins un abonnement payant (Standard ou fiche pro).</p>
          </div>
        </header>
        <div style={s.channelGrid}>
          {data.cards.map(c => (
            <div key={c.key} style={s.channel}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                <span style={{ width: 9, height: 9, borderRadius: 99, background: CHANNEL_COLOR[c.key] }} />{c.label}
              </span>
              <div style={s.metrics}>
                <Metric value={c.visitors === null ? '–' : nf(c.visitors)} label="visiteurs" />
                <Metric value={nf(c.signups)} label={c.signups > 1 ? 'inscriptions' : 'inscription'} />
                <Metric value={nf(c.clients)} label={c.clients > 1 ? 'clients' : 'client'} />
              </div>
              <span style={s.channelFoot}>
                {c.clicks !== null && <><strong>{nf(c.clicks)}</strong> {c.clicksLabel} · </>}
                {c.top.length ? c.top.map(x => `${x.name} ${x.count}`).join(' · ') : c.note ?? c.hint}
              </span>
            </div>
          ))}
        </div>
        <p style={s.note}><Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          Le suivi des inscriptions a commencé le 10 octobre 2026 : les comptes créés avant sont « sans origine ». Visites gardées 100 jours (depuis le {dateFr(`${data.period.visitsFrom}T12:00:00Z`)}). Google a 2 jours de retard : ses chiffres couvrent la même durée, finissant 2 jours plus tôt.
          {data.gscError && <> Google : {data.gscError}</>}
        </p>
      </section>

      {/* Ce qui a fait cliquer */}
      <section style={{ ...s.card, padding: 0, gap: 0 }}>
        <header style={{ ...s.head, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <strong style={{ fontSize: 15, color: 'var(--text)' }}>Ce qui a fait cliquer aujourd&apos;hui</strong>
        </header>
        <div style={s.tiles}>
          <Tile icon={<CursorClick size={13} />} label="Clics sur tes liens" value={t.clicksToday} sub={<>hier {t.clicksYesterday}{clickPct !== null && <> · <span style={{ color: clickPct >= 0 ? 'var(--accent-text)' : PINK }}>{clickPct > 0 ? '+' : ''}{clickPct} %</span></>}</>} />
          <Tile icon={<Broadcast size={13} />} label="Dans la dernière demi-heure" value={t.clicksLast30} sub={t.clicksLast30 ? 'clics sur tes liens' : 'rien pour l\'instant'} />
          <Tile icon={<UserPlus size={13} />} label="Inscriptions" value={t.signupsToday} sub={`hier ${t.signupsYesterday}`} />
          <Tile icon={<GoogleLogo size={13} />} label="Clics depuis Google" value={g.day?.clicks ?? '–'} sub={g.day ? <>le {dayFr(g.day.date)}{g.prevDay && <>, veille {g.prevDay.clicks}</>}</> : 'Search Console indisponible'} />
        </div>
        <div style={s.cols3}>
          <div style={s.col}>
            <span style={s.colTitle}>Tes liens, du plus récent · 7 jours</span>
            {t.recentLinks.length === 0 ? <span style={s.muted}>Aucun clic sur tes liens suivis cette semaine.</span> : t.recentLinks.map(l => (
              <div key={l.code} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={s.tag}>{channelOf(l.channel).label}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.label}</span>
                  <strong style={{ fontSize: 14 }}>{l.count}</strong>
                </div>
                <div style={s.bar}><div style={{ ...s.barFill, width: `${Math.max(4, (l.count / maxRecent) * 100)}%`, background: AMBER }} /></div>
                <span style={s.muted}>dernier clic {timeFr(l.lastClick)}</span>
              </div>
            ))}
          </div>
          <div style={s.col}>
            <span style={s.colTitle}>Pages ouvertes depuis un lien suivi · aujourd&apos;hui</span>
            {t.linkPagesToday.length === 0 ? <span style={s.muted}>Pas encore aujourd&apos;hui.</span> : t.linkPagesToday.map(p => (
              <div key={p.name} style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13.5 }}><span style={{ color: 'var(--text)' }}>{p.name}</span><strong>{p.count}</strong></div>
                <span style={s.muted}>{p.links.join(' · ')}</span>
              </div>
            ))}
            <span style={s.muted}>Nos propres compteurs : un clic, c&apos;est une personne qui a ouvert le lien. Les aperçus de Facebook et WhatsApp ne comptent pas.</span>
          </div>
          <div style={s.col}>
            <span style={s.colTitle}>Google Search Console · 7 jours</span>
            {g.week ? (
              <>
                <span style={{ fontSize: 14, color: 'var(--text-2)' }}><strong style={s.bigInline}>{nf(g.week.clicks)}</strong> clics · {nf(g.week.impressions)} affichages</span>
                <span style={s.muted}>
                  Du {dayFr(g.week.from)} au {dayFr(g.week.to)} · place moyenne {g.week.position.toFixed(1).replace('.', ',')}
                  {gWeekPct !== null && <> · <span style={{ color: gWeekPct >= 0 ? 'var(--accent-text)' : PINK, fontWeight: 600 }}>{gWeekPct > 0 ? '+' : ''}{gWeekPct} %</span> de clics par rapport aux 7 jours d&apos;avant</>}
                </span>
                <Link href="/dashboard/admin/visibilite" style={s.action}>Recherches et pages dans Visibilité <ArrowRight size={13} weight="bold" /></Link>
              </>
            ) : <span style={s.muted}>{data.gscError ?? 'Pas encore de chiffres Google.'}</span>}
          </div>
        </div>
      </section>
    </>
  )
}

// ── Liens suivis ──

function Liens({ data, periodLabel }: { data: ProvenanceData; periodLabel: string }) {
  const active = data.report.links.filter(l => !l.archived)
  const archived = data.report.links.filter(l => l.archived)
  return (
    <>
      <section style={s.card}>
        <header style={s.head}>
          <span style={{ ...s.icon, background: tint('var(--accent-text)', 14), color: 'var(--accent-text)' }}><LinkSimple size={18} weight="bold" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={s.title}>Créer un lien à partager</h2>
            <p style={s.sub}>Un lien par post ou par groupe : jasonmarinho.com/l/…, court et propre dans Facebook.</p>
          </div>
        </header>
        <CreateLinkForm />
      </section>

      <section style={s.card}>
        <header style={s.head}>
          <span style={{ ...s.icon, background: tint(AMBER, 14), color: AMBER }}><CursorClick size={18} weight="fill" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={s.title}>Tes liens suivis</h2>
            <p style={s.sub}>Clics sur {periodLabel.toLowerCase()} (total entre parenthèses), visiteurs mesurés sur le site, comptes créés depuis le lien. Les aperçus de Facebook et WhatsApp ne comptent pas comme des clics.</p>
          </div>
        </header>
        {active.length === 0 ? (
          <p style={s.text}>Pas encore de lien. Crée le premier ci-dessus, puis colle-le dans ton prochain post de groupe Facebook.</p>
        ) : (
          <ul style={s.list}>{active.map(l => <LinkRowView key={l.id} l={l} />)}</ul>
        )}
        {archived.length > 0 && (
          <details>
            <summary style={s.more}>{plural(archived.length, 'lien archivé', 'liens archivés')}</summary>
            <ul style={s.list}>{archived.map(l => <LinkRowView key={l.id} l={l} />)}</ul>
          </details>
        )}
      </section>
    </>
  )
}

// ── Inscriptions ──

function Inscriptions({ data, periodLabel }: { data: ProvenanceData; periodLabel: string }) {
  const { report } = data
  return (
    <div style={s.grid2}>
      <section style={s.card}>
        <header style={s.head}>
          <span style={{ ...s.icon, background: tint(AMBER, 14), color: AMBER }}><ChartBar size={18} weight="fill" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={s.title}>Inscriptions par provenance</h2>
            <p style={s.sub}>{periodLabel}, {plural(report.signups, 'compte créé', 'comptes créés')}{report.signups - report.measured > 0 ? `, dont ${report.signups - report.measured} sans origine` : ''}.</p>
          </div>
        </header>
        {report.byKind.length === 0 ? (
          <p style={s.text}>Aucune inscription mesurée sur la période. La provenance est enregistrée pour chaque nouveau compte, hôte comme pro.</p>
        ) : (
          <ul style={{ ...s.list, borderTop: 'none', gap: 10 }}>
            {report.byKind.map(k => (
              <li key={k.kind} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14 }}>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{k.label}</span>
                  <span style={{ color: 'var(--text-2)' }}><strong style={{ color: 'var(--text)' }}>{k.count}</strong> · {k.pct} %</span>
                </div>
                <div style={s.bar}><div style={{ ...s.barFill, width: `${Math.max(k.pct, 3)}%`, background: colorOf(k.kind) }} /></div>
              </li>
            ))}
          </ul>
        )}
        {report.bySpace.length > 0 && (
          <div style={s.chips}>
            {report.bySpace.map(sp => (
              <span key={sp.space} style={s.pill}>{sp.label} : <strong>{sp.count}</strong>{sp.measured < sp.count ? ` (${sp.measured} mesuré${sp.measured > 1 ? 's' : ''})` : ''}</span>
            ))}
          </div>
        )}
        <p style={s.note}><Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          {report.measuredSince
            ? `Provenance mesurée depuis le ${dateFr(report.measuredSince)}. Seul le point d'entrée de la visite est gardé, pas le parcours.`
            : 'Mesure en place à partir du 10 octobre 2026 : les comptes créés avant restent « sans origine ».'}
        </p>
      </section>

      <section style={s.card}>
        <header style={s.head}>
          <span style={{ ...s.icon, background: tint(PINK, 14), color: PINK }}><UsersThree size={18} weight="fill" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={s.title}>Dernières inscriptions</h2>
            <p style={s.sub}>Les 40 derniers comptes, avec leur espace et la provenance de leur visite.</p>
          </div>
        </header>
        <ul style={s.list}>
          {report.recent.map(m => (
            <li key={m.id} style={s.row}>
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <Link href={`/dashboard/admin/membres/${m.id}`} style={{ ...s.rowName, textDecoration: 'none' }}>{m.name}</Link>
                <span style={s.rowDetail}>{dateFr(m.created_at)} · {m.spaces.map(sp => SPACE_LABEL[sp]).join(', ')}</span>
              </div>
              <div style={{ flex: '1 1 220px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600, color: m.view.kind === 'inconnu' ? 'var(--text-3)' : 'var(--text)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: colorOf(m.view.kind), flexShrink: 0 }} />
                  {m.view.kind === 'inconnu' ? 'Sans origine' : m.view.label}{m.view.detail ? ` · ${m.view.detail}` : ''}
                </span>
                {m.view.landing && <span style={s.rowDetail}>Arrivé sur {m.view.landing}</span>}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function LinkRowView({ l }: { l: ProvenanceData['report']['links'][number] }) {
  return (
    <li style={{ ...s.row, alignItems: 'flex-start' }}>
      <div style={{ flex: '2 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={s.rowName}>{l.label}</span>
        <span style={s.rowDetail}>{l.channelLabel} · vers {destLabel(l.destination)} · créé le {dateFr(l.created_at)}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <code style={{ fontSize: 13, color: 'var(--accent-text)', fontWeight: 600, overflowWrap: 'anywhere' }}>{l.url}</code>
          <CopyButton text={l.url} />
          <ArchiveButton id={l.id} archived={l.archived} />
        </div>
      </div>
      <div style={{ flex: '1 1 260px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        <Stat icon={<CursorClick size={13} />} label="Clics" value={`${l.clicks}`} sub={`(${l.clicksTotal})`} />
        <Stat icon={<Eye size={13} />} label="Visiteurs" value={`${l.visitors}`} />
        <Stat icon={<UserPlus size={13} />} label="Comptes" value={`${l.signups.length}`} />
      </div>
      {(l.signups.length > 0 || l.lastClick) && (
        <div style={{ flex: '1 1 100%', display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12.5, color: 'var(--text-3)' }}>
          {l.lastClick && <span>Dernier clic le {dateFr(l.lastClick)}.</span>}
          {l.signups.length > 0 && <span>Inscrits :</span>}
          {l.signups.map(sg => (
            <Link key={sg.id} href={`/dashboard/admin/membres/${sg.id}`} style={{ color: 'var(--accent-text)', fontWeight: 600, textDecoration: 'none' }}>{sg.name}</Link>
          ))}
        </div>
      )}
    </li>
  )
}

function Ranked({ items }: { items: Array<{ name: string; count: number }> }) {
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
      {items.map(i => (
        <li key={i.name} style={{ display: 'flex', gap: 10, fontSize: 13.5, color: 'var(--text)' }}>
          <strong style={{ minWidth: 22, textAlign: 'right' }}>{i.count}</strong>
          <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{i.name}</span>
        </li>
      ))}
    </ol>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <span style={{ fontSize: 21, fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)', lineHeight: 1.2 }}>{value}</span>
      <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{label}</span>
    </div>
  )
}

function Tile({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number | string; sub: React.ReactNode }) {
  return (
    <div style={s.tile}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--text-3)' }}>{icon} {label}</span>
      <span style={{ fontSize: 26, fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)', lineHeight: 1.15 }}>{value}</span>
      <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{sub}</span>
    </div>
  )
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 10px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', minWidth: 0 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--text-3)' }}>{icon} {label}</span>
      <span style={{ fontSize: 18, fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)' }}>{value} {sub && <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'inherit' }}>{sub}</span>}</span>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: 16, alignItems: 'start' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, overflow: 'hidden' },
  head: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  icon: { width: 36, height: 36, borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 18, fontWeight: 500, margin: 0, color: 'var(--text)' },
  sub: { fontSize: 12.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 },
  text: { fontSize: 14, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 },
  note: { display: 'flex', gap: 6, fontSize: 12.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 },
  muted: { fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { padding: '6px 12px', borderRadius: 99, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, textDecoration: 'none' },
  chipOn: { padding: '6px 12px', borderRadius: 99, border: '1px solid var(--accent-text)', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 13, fontWeight: 700, textDecoration: 'none' },
  tabs: { display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: '1px solid var(--border)' },
  tab: { padding: '9px 14px', fontSize: 14, fontWeight: 600, color: 'var(--text-3)', textDecoration: 'none', borderBottom: '2px solid transparent', marginBottom: -1 },
  tabOn: { padding: '9px 14px', fontSize: 14, fontWeight: 700, color: 'var(--accent-text)', textDecoration: 'none', borderBottom: '2px solid var(--accent-text)', marginBottom: -1 },
  pill: { padding: '5px 10px', borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-2)' },
  tag: { padding: '2px 7px', borderRadius: 6, background: tint(AMBER, 14), color: AMBER, fontSize: 11, fontWeight: 700, flexShrink: 0 },
  bar: { height: 7, borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 99 },
  asideLabel: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-3)' },
  asideBig: { fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 28, color: 'var(--text)', lineHeight: 1.15 },
  bigInline: { fontFamily: 'var(--font-fraunces), serif', fontSize: 24, fontWeight: 400, color: 'var(--text)' },
  cols3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' },
  col: { display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 20px', borderRight: '1px solid var(--border)', borderTop: '1px solid var(--border)', marginTop: -1, minWidth: 0 },
  colTitle: { fontSize: 11.5, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-3)' },
  channelGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 12 },
  channel: { display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 16px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', minWidth: 0 },
  metrics: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 },
  channelFoot: { fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5, overflowWrap: 'anywhere' },
  tiles: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' },
  tile: { display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 20px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', minWidth: 0 },
  action: { alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--accent-text)', textDecoration: 'none' },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--border)' },
  row: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 2px', borderBottom: '1px solid var(--border)' },
  rowName: { display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text)', overflowWrap: 'anywhere' },
  rowDetail: { display: 'block', fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 },
  more: { cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--accent-text)', padding: '10px 2px' },
  warn: { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 14, background: tint(AMBER, 10), border: `1px solid ${tint(AMBER, 35)}`, fontSize: 14, color: 'var(--text)', lineHeight: 1.5 },
}
