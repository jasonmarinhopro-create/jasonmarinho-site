import type { FinanceData } from '@/lib/finances/load'
import { parsePeriod, periodOf, inRange, PERIOD_KEYS, CANAL_LABEL } from '@/lib/finances/engine'
import PeriodPicker from '../_ui/PeriodPicker'
import { ui } from '../_ui/ui'
import JournalView, { type JournalRow } from './JournalView'


export default function JournalContent({ data, searchParams }: { data: FinanceData; searchParams: { periode?: string } }) {
  const period = periodOf(parsePeriod(searchParams.periode), data.today)

  const rows: JournalRow[] = [
    ...data.lines
      .filter(l => inRange(l.date, period.start, period.end))
      .map(l => ({
        key: `r:${l.id}`,
        type: 'revenu' as const,
        kind: l.kind,
        sourceId: l.sourceId,
        date: l.date,
        label: l.label,
        detail: l.detail,
        logementNom: l.logementNom,
        canal: CANAL_LABEL[l.canal],
        montant: l.brut,
        commission: l.commission,
        statut: l.statut,
        horsRevenus: l.horsRevenus,
        aDeclarer: l.aDeclarer,
        voyageurId: l.voyageurId,
      })),
    ...data.charges
      .filter(c => inRange(c.date, period.start, period.end))
      .map(c => ({
        key: `c:${c.id}`,
        type: 'charge' as const,
        kind: 'charge' as const,
        sourceId: c.id,
        date: c.date,
        label: c.description || '',
        detail: c.dureeAmortissement ? `Amorti sur ${c.dureeAmortissement} an${c.dureeAmortissement > 1 ? 's' : ''}` : (c.deductible ? null : 'Non déductible'),
        logementNom: c.logementNom,
        montant: c.montant,
        categorie: c.categorie,
        deductible: c.deductible,
        dureeAmortissement: c.dureeAmortissement,
      })),
  ].sort((a, b) => b.date.localeCompare(a.date) || a.key.localeCompare(b.key))

  const logementNoms = [...new Set([
    ...data.choices.map(c => c.nom),
    ...data.logements.map(l => l.nom),
  ])].filter(Boolean)

  return (
    <div style={ui.page}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-3)' }}>
          Tout ce qui est entré et sorti pour <strong style={{ color: 'var(--text-2)' }}>{data.scope.logement?.nom ?? 'tous tes logements'}</strong> {period.label}
        </p>
        <PeriodPicker current={period.key} options={PERIOD_KEYS.map(k => ({ key: k, short: periodOf(k, data.today).short }))} />
      </div>
      <JournalView
        rows={rows}
        today={data.today}
        logementNoms={logementNoms}
        logements={data.logements.map(l => ({ id: l.id, nom: l.nom }))}
        defaultLogement={data.scope.logement?.nom ?? (logementNoms.length === 1 ? logementNoms[0] : '')}
        showLogement={!data.scope.logement}
        periodLabel={period.label}
      />
    </div>
  )
}
