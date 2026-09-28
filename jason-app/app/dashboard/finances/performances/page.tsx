import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Lock, Lightbulb, Info } from '@phosphor-icons/react/dist/ssr'
import { loadFinances } from '@/lib/finances/load'
import {
  parsePeriod, periodOf, previousYearPeriod, perfStats, occupationMensuelle, remplissageAVenir, parCanal,
  nuitsParJour, inScope, monthLabel, monthsOf, monthKey, CANAL_LABEL, PERIOD_KEYS, type PerfStats,
} from '@/lib/finances/engine'
import { findMarketBenchmark } from '@/lib/lcd/market-benchmarks'
import PeriodPicker from '../_ui/PeriodPicker'
import { Card, CardHead, Definition, ProgressBar, eur, pct, ui, COLORS } from '../_ui/ui'

export const metadata = { title: 'Performances, Mes finances' }
export const dynamic = 'force-dynamic'

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default async function PerformancesPage({ searchParams }: { searchParams: { periode?: string } }) {
  const data = await loadFinances()
  if (!data) redirect('/auth/login')
  const { today, lines, occupation, nbLogements } = data
  const period = periodOf(parsePeriod(searchParams.periode), today)
  const isPremium = data.plan === 'standard' || data.plan === 'driing'

  const st = perfStats(lines, occupation, nbLogements, period.start, period.end, today)
  const prevP = previousYearPeriod(period)
  const prevEnd = `${Number(today.slice(0, 4)) - 1}${today.slice(4)}`
  const prev = perfStats(lines, occupation, nbLogements, prevP.start, prevP.end < prevEnd ? prevP.end : prevEnd, prevEnd)
  const hasPrev = prev.nuitsReservees > 0

  const last12 = monthsOf(periodOf('12mois', today))
  const occMois = occupationMensuelle(occupation, last12, nbLogements, today)
  const bench = data.logement ? findMarketBenchmark(data.logement.ville, data.logement.pays ?? 'FR') : null
  const canaux = parCanal(lines, period.start, period.end, today)
  const nuitsCanaux = canaux.reduce((n, c) => n + c.nuits, 0)
  const jours = nuitsParJour(occupation, period.start, period.end, today)
  const maxJour = Math.max(1, ...jours)
  const fill30 = remplissageAVenir(occupation, 30, nbLogements, today)
  const fill90 = remplissageAVenir(occupation, 90, nbLogements, today)

  const year = Number(today.slice(0, 4))
  const nuitsAnnee = data.scope.logement ? perfStats(lines, occupation, 1, `${year}-01-01`, `${year}-12-31`, '9999-12-31').nuitsReservees : 0

  const conseils = buildConseils(st, bench, fill30, canaux)
  const empty = occupation.length === 0

  return (
    <div style={ui.page}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-3)' }}>
          Remplissage et prix de <strong style={{ color: 'var(--text-2)' }}>{data.scope.logement?.nom ?? `tes ${nbLogements} logements`}</strong> {period.label}
        </p>
        <PeriodPicker current={period.key} options={PERIOD_KEYS.map(k => ({ key: k, short: periodOf(k, today).short }))} />
      </div>

      {empty ? (
        <Card>
          <CardHead title="Pas encore de séjour" sub="L'occupation se calcule avec tes séjours et les réservations Airbnb ou Booking importées par ton calendrier. Connecte ton calendrier pour la voir se remplir toute seule." />
          <Link href="/dashboard/calendrier" style={ui.btn}>Connecter mon calendrier</Link>
        </Card>
      ) : (
        <>
          <Card>
            <div style={ui.kpis}>
              <Kpi label="Taux d'occupation" value={pct(st.occupation)} prev={hasPrev ? prev.occupation : null} cur={st.occupation} fmt={v => pct(v)} hint={`${st.nuitsReservees} nuits louées sur ${st.nuitsDispo}`} />
              <Kpi label="Prix moyen par nuit" value={st.adr > 0 ? eur(st.adr) : '-'} prev={hasPrev && prev.adr > 0 ? prev.adr : null} cur={st.adr} fmt={v => eur(v)} hint="sur les séjours avec montant" />
              <Kpi label="Revenu par nuit disponible" value={st.revpar > 0 ? eur(st.revpar) : '-'} prev={hasPrev && prev.revpar > 0 ? prev.revpar : null} cur={st.revpar} fmt={v => eur(v)} hint="prix moyen × occupation" />
              <Kpi label="Séjours" value={String(st.nbSejours)} hint={st.nbSejours > 0 ? `${String(st.dureeMoyenne).replace('.', ',')} nuits en moyenne` : undefined} />
            </div>
            <Definition>
              Nuits disponibles : chaque jour de la période jusqu&apos;à aujourd&apos;hui{nbLogements > 1 ? `, pour ${nbLogements} logements` : ''}. Les réservations Airbnb et Booking importées comptent dans l&apos;occupation même sans montant.
              {hasPrev ? ` Flèches : comparaison avec la même période en ${year - 1}.` : ''}
            </Definition>
          </Card>

          <Card>
            <CardHead title="Occupation mois par mois" sub={bench ? `12 derniers mois. Trait : moyenne du marché de ${bench.ville} (${bench.occupationAnnuellePct} %).` : '12 derniers mois.'} />
            <div style={s.occChart}>
              {bench && <div style={{ ...s.benchLine, bottom: `calc(${bench.occupationAnnuellePct}% * 0.82 + 22px)` }} aria-hidden="true" />}
              {occMois.map(m => {
                const v = m.occupation
                const haute = bench?.saisonHaute.includes(Number(m.mois.slice(5)))
                return (
                  <div key={m.mois} style={s.occCol} title={v == null ? monthLabel(m.mois) : `${monthLabel(m.mois)} : ${pct(v)}`}>
                    <span style={s.occVal}>{v == null ? '' : pct(v)}</span>
                    <div style={s.occZone}>
                      <div style={{ ...s.occBar, height: `${(v ?? 0) * 100}%`, background: m.mois === monthKey(today) ? 'rgba(47,158,91,0.55)' : 'var(--accent-text)' }} />
                    </div>
                    <span style={{ ...s.occLbl, fontWeight: haute ? 700 : 500, color: haute ? 'var(--text-2)' : 'var(--text-3)' }}>{monthLabel(m.mois, true)}</span>
                  </div>
                )
              })}
            </div>
            {bench && <Definition>Mois en gras : haute saison à {bench.ville}. Le mois en cours est compté jusqu&apos;à aujourd&apos;hui.</Definition>}
          </Card>

          {!isPremium ? (
            <Card style={{ textAlign: 'center' }}>
              <Lock size={22} weight="duotone" color="var(--accent-text)" />
              <h2 style={{ ...ui.cardTitle, margin: '8px 0 6px' }}>Comparaison avec le marché, canaux et rythme de réservation</h2>
              <p style={{ ...ui.cardSub, maxWidth: 520, margin: '0 auto 14px' }}>
                Vois si ton prix et ton remplissage tiennent la route face à ta ville, quel canal te rapporte vraiment et combien de nuits sont déjà réservées pour les prochaines semaines.
              </p>
              <Link href="/dashboard/abonnement" style={ui.btn}>Passer en Standard</Link>
            </Card>
          ) : (
            <>
              {conseils.length > 0 && (
                <Card style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
                  <CardHead title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Lightbulb size={18} weight="duotone" color="var(--accent-text)" />À retenir</span>} />
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: 'var(--text-2)', lineHeight: 1.55 }}>
                    {conseils.map(c => <li key={c}>{c}</li>)}
                  </ul>
                </Card>
              )}

              <div style={ui.grid2}>
                {bench ? (
                  <Card>
                    <CardHead title={`Face au marché de ${bench.ville}`} sub="Moyennes annuelles du marché : un repère, pas une vérité à la nuit près." />
                    <Compare label="Occupation" toi={pct(st.occupation)} marche={`${bench.occupationAnnuellePct} %`} ratio={bench.occupationAnnuellePct > 0 ? st.occupation * 100 / bench.occupationAnnuellePct : 0} />
                    <Compare label="Prix moyen par nuit" toi={st.adr > 0 ? eur(st.adr) : '-'} marche={eur(bench.adrEur)} ratio={bench.adrEur > 0 ? st.adr / bench.adrEur : 0} />
                    <Definition>Source : {bench.source}.</Definition>
                  </Card>
                ) : (
                  <Card>
                    <CardHead title="Face au marché" sub={data.scope.logement ? "Pas de repère pour la ville de ce logement : renseigne son adresse complète dans sa fiche (ville incluse)." : 'Choisis un logement en haut de page pour le comparer au marché de sa ville.'} />
                  </Card>
                )}

                <Card>
                  <CardHead title="Déjà réservé" sub="Part des nuits réservées à partir de demain." />
                  <Fill label="30 prochains jours" value={fill30} />
                  <div style={{ height: 12 }} />
                  <Fill label="90 prochains jours" value={fill90} />
                  <Definition>
                    {st.delaiMoyen != null ? `Tes voyageurs réservent en moyenne ${st.delaiMoyen} jours avant leur arrivée. ` : ''}
                    Sous 40 % à 30 jours, pense à ajuster le prix des dates encore libres.
                  </Definition>
                </Card>
              </div>

              <div style={ui.grid2}>
                <Card>
                  <CardHead title="Par canal" sub={`Nuits et prix moyen ${period.label}.`} />
                  {canaux.filter(c => c.nuits > 0).length === 0 ? (
                    <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-3)' }}>Pas de séjour avec montant sur la période.</p>
                  ) : (
                    <table style={ui.table}>
                      <thead><tr>
                        <th style={ui.th}>Canal</th>
                        <th style={{ ...ui.th, textAlign: 'right' }}>Nuits</th>
                        <th style={{ ...ui.th, textAlign: 'right' }}>Prix / nuit</th>
                        <th style={{ ...ui.th, textAlign: 'right' }}>Net / nuit</th>
                      </tr></thead>
                      <tbody>
                        {canaux.filter(c => c.nuits > 0).map(c => (
                          <tr key={c.canal}>
                            <td style={{ ...ui.td, fontWeight: 600, color: 'var(--text)' }}>{CANAL_LABEL[c.canal]}<div style={{ fontSize: 11.5, fontWeight: 400, color: 'var(--text-3)' }}>{pct(nuitsCanaux > 0 ? c.nuits / nuitsCanaux : 0)} des nuits</div></td>
                            <td style={{ ...ui.td, textAlign: 'right' }}>{c.nuits}</td>
                            <td style={{ ...ui.td, textAlign: 'right' }}>{eur(c.brut / c.nuits)}</td>
                            <td style={{ ...ui.td, textAlign: 'right', fontWeight: 700, color: 'var(--text)' }}>{c.sansCommission > 0 ? '?' : eur(c.net / c.nuits)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <Definition>Net par nuit : ce qui te reste une fois la commission de la plateforme déduite. « ? » : commission non renseignée.</Definition>
                </Card>

                <Card>
                  <CardHead title="Nuits louées par jour" sub={`Quels soirs se louent le mieux, ${period.label}.`} />
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                    {jours.map((n, i) => (
                      <div key={JOURS[i]} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' }}>
                        <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{n}</span>
                        <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                          <div style={{ width: '100%', height: `${(n / maxJour) * 100}%`, minHeight: 2, borderRadius: '6px 6px 2px 2px', background: i >= 4 ? 'var(--accent-text)' : 'rgba(47,158,91,0.45)' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{JOURS[i]}</span>
                      </div>
                    ))}
                  </div>
                  <Definition>Vendredi, samedi et dimanche en foncé. Si la semaine se loue beaucoup moins, une remise en semaine ou un prix plus haut le week-end peut aider.</Definition>
                </Card>
              </div>

              {!data.scope.logement && data.choices.length > 1 && <ParLogement data={data} period={period} />}
            </>
          )}

          {data.scope.logement && (
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', gap: 6, alignItems: 'flex-start', lineHeight: 1.55 }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              {nuitsAnnee} nuit{nuitsAnnee > 1 ? 's' : ''} louée{nuitsAnnee > 1 ? 's' : ''} en {year}, séjours réservés compris. Si ce logement est ta résidence principale, la location est limitée à 120 nuits par an, ou 90 si ta commune l&apos;a décidé.
            </p>
          )}
        </>
      )}
    </div>
  )
}

function buildConseils(st: PerfStats, bench: ReturnType<typeof findMarketBenchmark>, fill30: number, canaux: ReturnType<typeof parCanal>): string[] {
  const out: string[] = []
  if (bench && st.adr > 0 && st.nuitsReservees > 0) {
    const occM = bench.occupationAnnuellePct / 100
    if (st.occupation >= occM + 0.1 && st.adr <= bench.adrEur) out.push(`Tu es plus rempli que le marché (${pct(st.occupation)} contre ${bench.occupationAnnuellePct} %) avec un prix égal ou plus bas : tu peux sans doute monter tes prix.`)
    else if (st.occupation < occM - 0.1 && st.adr > bench.adrEur * 1.1) out.push(`Tu es moins rempli que le marché avec un prix plus haut (${eur(st.adr)} contre ${eur(bench.adrEur)}) : un prix plus bas sur les dates libres remplirait mieux.`)
  }
  if (fill30 < 0.4) out.push(`Seulement ${pct(fill30)} des 30 prochaines nuits sont réservées : c'est le moment d'ajuster le prix des dates encore libres.`)
  const platform = canaux.filter(c => c.commission > 0)
  const comm = platform.reduce((s, c) => s + c.commission, 0)
  if (comm > 300) out.push(`Les plateformes ont gardé ${eur(comm)} de commission sur la période. Chaque voyageur qui revient en direct garde cette somme pour toi.`)
  return out
}

function Kpi({ label, value, hint, prev, cur, fmt }: { label: string; value: string; hint?: string; prev?: number | null; cur?: number; fmt?: (v: number) => string }) {
  const diff = prev != null && cur != null ? cur - prev : null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <span style={ui.statLabel}>{label}</span>
      <span style={ui.statValue}>{value}</span>
      {hint && <span style={ui.statHint}>{hint}</span>}
      {diff != null && Math.abs(diff) > 1e-9 && fmt && (
        <span style={{ fontSize: 12, fontWeight: 600, color: diff > 0 ? 'var(--accent-text)' : COLORS.charges }}>
          {diff > 0 ? '▲' : '▼'} {fmt(prev as number)} l&apos;an dernier
        </span>
      )}
    </div>
  )
}

function Compare({ label, toi, marche, ratio }: { label: string; toi: string; marche: string; ratio: number }) {
  const delta = Math.round((ratio - 1) * 100)
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13.5 }}>
        <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontWeight: 600, color: delta >= 0 ? 'var(--accent-text)' : COLORS.charges }}>{delta >= 0 ? '+' : ''}{delta} %</span>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
        <span>Toi <strong style={{ color: 'var(--text)' }}>{toi}</strong></span>
        <span>Marché <strong style={{ color: 'var(--text)' }}>{marche}</strong></span>
      </div>
    </div>
  )
}

function Fill({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 6 }}>
        <span style={{ color: 'var(--text-2)' }}>{label}</span>
        <strong style={{ color: 'var(--text)' }}>{pct(value)}</strong>
      </div>
      <ProgressBar value={value} />
    </div>
  )
}

function ParLogement({ data, period }: { data: NonNullable<Awaited<ReturnType<typeof loadFinances>>>; period: ReturnType<typeof periodOf> }) {
  const rows = data.choices.map(c => {
    const scope = { logement: { id: c.id.startsWith('virtual:') ? null : c.id, nom: c.nom } }
    const st = perfStats(data.allLines.filter(l => inScope(l, scope)), data.occupation.filter(o => inScope(o, scope)), 1, period.start, period.end, data.today)
    return { ...c, st }
  }).sort((a, b) => b.st.revpar - a.st.revpar)
  return (
    <Card>
      <CardHead title="Comparaison de tes logements" sub="Classés par revenu par nuit disponible, l'indicateur qui combine prix et remplissage." />
      <div style={{ overflowX: 'auto' }}>
        <table style={ui.table}>
          <thead><tr>
            <th style={ui.th}>Logement</th>
            <th style={{ ...ui.th, textAlign: 'right' }}>Occupation</th>
            <th style={{ ...ui.th, textAlign: 'right' }}>Prix / nuit</th>
            <th style={{ ...ui.th, textAlign: 'right' }}>Revenu / nuit dispo</th>
            <th style={{ ...ui.th, textAlign: 'right' }}>Séjours</th>
          </tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={{ ...ui.td, fontWeight: 600, color: 'var(--text)' }}><Link href={`/dashboard/finances/logement/${encodeURIComponent(r.id)}?onglet=performances`} style={{ color: 'inherit', textDecoration: 'none' }}>{r.nom}</Link></td>
                <td style={{ ...ui.td, textAlign: 'right' }}>{pct(r.st.occupation)}</td>
                <td style={{ ...ui.td, textAlign: 'right' }}>{r.st.adr > 0 ? eur(r.st.adr) : '-'}</td>
                <td style={{ ...ui.td, textAlign: 'right', fontWeight: 700, color: 'var(--text)' }}>{r.st.revpar > 0 ? eur(r.st.revpar) : '-'}</td>
                <td style={{ ...ui.td, textAlign: 'right' }}>{r.st.nbSejours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

const s: Record<string, React.CSSProperties> = {
  occChart: { position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 'clamp(3px, 1vw, 10px)', height: 200 },
  benchLine: { position: 'absolute', left: 0, right: 0, borderTop: '2px dashed rgba(183,121,31,0.7)', zIndex: 1, pointerEvents: 'none' },
  occCol: { flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 4 },
  occVal: { fontSize: 10.5, color: 'var(--text-3)', textAlign: 'center', whiteSpace: 'nowrap', height: 14 },
  occZone: { height: '82%', display: 'flex', alignItems: 'flex-end' },
  occBar: { width: '100%', minHeight: 2, borderRadius: '6px 6px 2px 2px' },
  occLbl: { fontSize: 11, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden' },
}
