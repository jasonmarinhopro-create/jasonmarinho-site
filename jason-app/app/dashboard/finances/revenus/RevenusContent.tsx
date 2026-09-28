import Link from 'next/link'
import { ArrowRight, Info, CalendarCheck, Warning } from '@phosphor-icons/react/dist/ssr'
import type { FinanceData } from '@/lib/finances/load'
import {
  parsePeriod, periodOf, previousYearPeriod, monthsOf, totaux, serieMensuelle, parCanal, perfStats,
  inScope, monthKey, CANAL_LABEL, PERIOD_KEYS, type Period,
} from '@/lib/finances/engine'
import RevenueChart from '../_ui/RevenueChart'
import ObjectifCard from '../_ui/ObjectifCard'
import PeriodPicker from '../_ui/PeriodPicker'
import { Card, CardHead, Definition, Notice, ProgressBar, COLORS, eur, pct, ui } from '../_ui/ui'


function chartMonths(p: Period, today: string): string[] {
  const m = monthsOf(p)
  if (m.length >= 6) return m
  // Période courte : les 6 derniers mois pour donner du contexte
  return monthsOf({ ...p, start: `${shift(monthKey(today), -5)}-01`, end: p.end })
}
function shift(ym: string, n: number): string {
  const [y, mo] = ym.split('-').map(Number)
  return new Date(Date.UTC(y, mo - 1 + n, 1)).toISOString().slice(0, 7)
}

export default function RevenusContent({ data, searchParams }: { data: FinanceData; searchParams: { periode?: string } }) {
  const { periode } = searchParams
  const period = periodOf(parsePeriod(periode), data.today)
  const { lines, charges, occupation, today } = data

  const t = totaux(lines, charges, occupation, period.start, period.end, today)
  const prevP = previousYearPeriod(period)
  // N-1 comparé à date égale (jusqu'au même jour de l'an dernier)
  const prevEnd = `${Number(today.slice(0, 4)) - 1}${today.slice(4)}`
  const prev = totaux(lines, charges, [], prevP.start, prevP.end < prevEnd ? prevP.end : prevEnd, prevEnd)
  const evolution = prev.revenus > 0 ? (t.revenus - prev.revenus) / prev.revenus : null

  const points = serieMensuelle(lines, charges, chartMonths(period, today), today)
  const canaux = parCanal(lines, period.start, period.end, today)
  const totalCanaux = canaux.reduce((s, c) => s + c.brut, 0)

  const year = Number(today.slice(0, 4))
  const yearTot = totaux(lines, charges, [], `${year}-01-01`, `${year}-12-31`, today)

  const scopeName = data.scope.logement?.nom ?? 'tous tes logements'
  const empty = lines.length === 0 && charges.length === 0
  const multi = !data.scope.logement && data.choices.length > 1
  const objectifEditable = data.scope.logement ? !!data.logement : !data.logements.some(l => l.objectif)

  return (
    <div style={ui.page}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-3)' }}>
          Chiffres de <strong style={{ color: 'var(--text-2)' }}>{scopeName}</strong> {period.label}
        </p>
        <PeriodPicker current={period.key} options={PERIOD_KEYS.map(k => ({ key: k, short: periodOf(k, today).short }))} />
      </div>

      {empty ? (
        <Card>
          <CardHead title="Aucun revenu pour l'instant" sub="Tes revenus se remplissent tout seuls avec tes séjours (montant saisi) et tes contrats signés. Tu peux aussi saisir un paiement ou importer un relevé Airbnb ou Booking." />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/dashboard/finances/journal" style={ui.btn}>Saisir ou importer <ArrowRight size={14} /></Link>
            <Link href="/dashboard/reservations" style={ui.btnGhost}>Mes réservations</Link>
          </div>
        </Card>
      ) : (
        <>
          {/* Le bénéfice, et comment on y arrive */}
          <Card>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent-text)', letterSpacing: '0.02em' }}>
              Bénéfice {period.label}
            </div>
            <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(34px, 5vw, 46px)', color: 'var(--text)', lineHeight: 1.1, margin: '4px 0 14px' }}>
              {eur(t.benefice)}
            </div>
            <div style={s.equation}>
              <Term label="Revenus" value={eur(t.revenus)} color={COLORS.revenus} />
              <Op>−</Op>
              <Term label="Commissions" value={eur(t.commissions)} color={COLORS.commissions} />
              <Op>−</Op>
              <Term label="Charges" value={eur(t.charges)} color={COLORS.charges} />
              <Op>=</Op>
              <Term label="Bénéfice" value={eur(t.benefice)} color="var(--text)" strong />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              {evolution !== null && (
                <span style={{ ...s.chip, color: evolution >= 0 ? 'var(--accent-text)' : COLORS.charges }}>
                  {evolution >= 0 ? '+' : '−'}{pct(Math.abs(evolution))} de revenus vs même période {year - 1}
                </span>
              )}
              {t.aVenir > 0 && (
                <span style={s.chip}><CalendarCheck size={14} weight="duotone" /> + {eur(t.aVenir)} déjà réservés sur la période</span>
              )}
              {t.aEncaisser > 0 && (
                <Link href="/dashboard/finances/encaissements" style={{ ...s.chip, color: COLORS.commissions, textDecoration: 'none' }}>
                  {eur(t.aEncaisser)} de paiement en ligne pas encore reçu <ArrowRight size={12} />
                </Link>
              )}
            </div>
            <Definition>
              Revenus : séjours arrivés {period.label} (montant payé par le voyageur) et paiements saisis, cautions exclues. Charges : dépenses saisies dans le Journal, hors investissements amortis.
            </Definition>
          </Card>

          {/* Points qui rendent les chiffres incomplets */}
          {(t.sansMontant > 0 || t.sansCommission > 0) && (
            <Notice
              tone="warn"
              action={<Link href={t.sansMontant > 0 ? '/dashboard/reservations' : '/dashboard/finances/journal'} style={ui.link}>Compléter</Link>}
            >
              <Warning size={15} weight="fill" color={COLORS.commissions} style={{ verticalAlign: '-2px', marginRight: 6 }} />
              {t.sansMontant > 0 && <>{t.sansMontant} réservation{t.sansMontant > 1 ? 's' : ''} Airbnb ou Booking importée{t.sansMontant > 1 ? 's' : ''} sans montant : elle{t.sansMontant > 1 ? 's' : ''} compte{t.sansMontant > 1 ? 'nt' : ''} dans l&apos;occupation mais pas dans les revenus. </>}
              {t.sansCommission > 0 && <>{t.sansCommission} séjour{t.sansCommission > 1 ? 's' : ''} de plateforme sans commission renseignée : ton bénéfice est un peu surestimé.</>}
            </Notice>
          )}

          <Card>
            <CardHead title="Revenus mois par mois" sub="Touche un mois pour voir le détail." />
            <RevenueChart points={points} currentMonth={monthKey(today)} />
          </Card>

          <div style={ui.grid2}>
            <Card>
              <CardHead title="D'où vient l'argent" sub={`Par canal, ${period.label}. La commission est ce que garde la plateforme.`} />
              {canaux.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-3)' }}>Aucun revenu sur la période.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {canaux.map(c => (
                    <div key={c.canal}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13.5, marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                          {CANAL_LABEL[c.canal]}
                          <span style={{ fontWeight: 400, color: 'var(--text-3)' }}> · {c.nbSejours > 0 ? `${c.nbSejours} séjour${c.nbSejours > 1 ? 's' : ''}` : 'saisies'}</span>
                        </span>
                        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{eur(c.brut)}</span>
                      </div>
                      <ProgressBar value={totalCanaux > 0 ? c.brut / totalCanaux : 0} color={c.canal === 'direct' || c.canal === 'driing' ? 'var(--accent-text)' : 'rgba(47,158,91,0.55)'} />
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 5 }}>
                        {c.commission > 0
                          ? <>Commission <span style={{ color: COLORS.commissions }}>− {eur(c.commission)}</span> ({pct(c.brutCommissionConnue > 0 ? c.commission / c.brutCommissionConnue : 0, 1)}{c.sansCommission > 0 ? `, ${c.sansCommission} séjour${c.sansCommission > 1 ? 's' : ''} sans commission renseignée` : ''}) · reste {eur(c.net)}</>
                          : c.sansCommission > 0 ? 'Commission non renseignée' : 'Sans commission'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <ObjectifCard
              year={year}
              objectif={data.objectif}
              realise={yearTot.revenus}
              reserve={yearTot.aVenir}
              logementId={data.logement?.id ?? null}
              editable={objectifEditable}
              editHint={data.scope.logement
                ? "Crée la fiche de ce logement (Mes logements) pour lui fixer un objectif."
                : data.objectif
                  ? "C'est la somme des objectifs de tes logements : choisis un logement pour modifier le sien."
                  : "Chaque logement a son objectif : choisis-en un en haut de page pour le fixer. Le total s'affichera ici quand tous en auront un."}
            />
          </div>

          {multi && <ParLogement data={data} period={period} />}

          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', gap: 6, alignItems: 'flex-start', lineHeight: 1.55 }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            Un séjour compte à sa date d&apos;arrivée, une saisie manuelle à sa date de paiement. Même règle dans tous les onglets : les chiffres sont identiques partout.
          </p>
        </>
      )}
    </div>
  )
}

function ParLogement({ data, period }: { data: FinanceData; period: Period }) {
  const rows = data.choices.map(c => {
    const scope = { logement: { id: c.id.startsWith('virtual:') ? null : c.id, nom: c.nom } }
    const l = data.allLines.filter(x => inScope(x, scope))
    const ch = data.allCharges.filter(x => inScope(x, scope))
    const t = totaux(l, ch, [], period.start, period.end, data.today)
    const occ = perfStats(l, data.occupation.filter(o => inScope(o, scope)), 1, period.start, period.end, data.today)
    return { ...c, t, occ: occ.occupation }
  }).sort((a, b) => b.t.revenus - a.t.revenus)

  return (
    <Card>
      <CardHead title="Par logement" sub={`${period.label.charAt(0).toUpperCase()}${period.label.slice(1)}. Choisis un logement en haut de page pour voir tout son détail.`} />
      <div style={{ overflowX: 'auto' }}>
        <table style={ui.table}>
          <thead>
            <tr>
              <th style={ui.th}>Logement</th>
              <th style={{ ...ui.th, textAlign: 'right' }}>Revenus</th>
              <th style={{ ...ui.th, textAlign: 'right' }}>Commissions</th>
              <th style={{ ...ui.th, textAlign: 'right' }}>Charges</th>
              <th style={{ ...ui.th, textAlign: 'right' }}>Bénéfice</th>
              <th style={{ ...ui.th, textAlign: 'right' }}>Occupation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={{ ...ui.td, fontWeight: 600, color: 'var(--text)' }}>
                  <Link href={`/dashboard/finances/logement/${encodeURIComponent(r.id)}`} style={{ color: 'inherit', textDecoration: 'none' }}>{r.nom}</Link>
                </td>
                <td style={{ ...ui.td, textAlign: 'right' }}>{eur(r.t.revenus)}</td>
                <td style={{ ...ui.td, textAlign: 'right', color: COLORS.commissions }}>{r.t.commissions > 0 ? `− ${eur(r.t.commissions)}` : '0 €'}</td>
                <td style={{ ...ui.td, textAlign: 'right', color: COLORS.charges }}>{r.t.charges > 0 ? `− ${eur(r.t.charges)}` : '0 €'}</td>
                <td style={{ ...ui.td, textAlign: 'right', fontWeight: 700, color: 'var(--text)' }}>{eur(r.t.benefice)}</td>
                <td style={{ ...ui.td, textAlign: 'right' }}>{pct(r.occ)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function Term({ label, value, color, strong }: { label: string; value: string; color: string; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: strong ? 17 : 16, fontWeight: strong ? 700 : 600, color, whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  )
}
function Op({ children }: { children: string }) {
  return <span style={{ fontSize: 16, color: 'var(--text-muted)', alignSelf: 'flex-end', paddingBottom: 1 }}>{children}</span>
}

const s: Record<string, React.CSSProperties> = {
  equation: { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '10px 14px', paddingTop: 12, borderTop: '1px solid var(--accent-border)' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, padding: '5px 10px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' },
}
