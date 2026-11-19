import Link from 'next/link'
import { UsersThree, ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { getActivation } from '@/lib/admin/activation'
import { part } from '@/lib/admin/activation-rules'

// « Où en sont tes membres » (19/11/2026, maquette validée par Jason) : de
// l'inscription au paiement, où les membres décrochent. Sous « Audience du
// site » dans la Vue d'ensemble. Diffusé à part (Suspense) : la page ne
// l'attend pas.
export default async function ActivationCard() {
  let a
  try { a = await getActivation() } catch { return null }
  const rows: Array<{ label: string; sub?: string; n: number }> = [
    { label: 'Inscrits', n: a.inscrits },
    { label: 'Logement ajouté', n: a.logement },
    { label: 'Calendrier connecté', n: a.calendrier },
    { label: 'Contrat envoyé', n: a.contrat },
    { label: 'Stripe connecté', n: a.stripe },
    { label: 'Formule Standard', sub: `+ ${a.driing} Driing (accès offert)`, n: a.standard },
  ]
  return (
    <section className="fade-up" style={s.card} aria-label="Où en sont tes membres">
      <header style={s.head}>
        <span style={s.label}><UsersThree size={14} /> Où en sont tes membres</span>
        <span style={s.muted}>{a.inscrits} inscrits, hors admins · mis à jour toutes les 15 min</span>
      </header>
      <div style={s.rows}>
        {rows.map((r, i) => {
          const pct = i === 0 ? 100 : part(r.n, a.inscrits)
          return (
            <div key={r.label} style={s.row} className="ck-act-row">
              <span style={s.rowLabel}>{r.label}{r.sub && <small style={s.rowSub}>{r.sub}</small>}</span>
              <span style={s.track}><i style={{ ...s.fill, width: `${Math.max(pct, r.n > 0 ? 2 : 0)}%` }} /></span>
              <span style={s.num}>{r.n}{i > 0 && <small style={s.rowSub}>{pct} %</small>}</span>
            </div>
          )
        })}
      </div>
      {a.sansLogement > 0 && (
        <div style={s.alert}>
          <p style={{ margin: 0, flex: '1 1 260px', fontSize: 13.5, color: 'var(--text)' }}>
            <strong>{a.sansLogement} inscrit{a.sansLogement > 1 ? 's' : ''} n&apos;{a.sansLogement > 1 ? 'ont' : 'a'} jamais ajouté de logement</strong>
            {a.sansLogement30 > 0 ? <>, dont {a.sansLogement30} ces 30 derniers jours : c&apos;est là qu&apos;une relance a le plus de chances.</> : '.'}
            {' '}Certains viennent pour une fiche pro ou l&apos;espace investisseur.
          </p>
          <Link prefetch={false} href="/dashboard/admin/membres?filtre=sans-logement" style={s.btn}>Voir la liste <ArrowRight size={13} weight="bold" /></Link>
        </div>
      )}
      <div style={s.kpis}>
        <div style={s.kpi}><strong style={s.kpiNum}>{a.inscrits30}</strong><span style={s.muted}>inscrits en 30 jours</span></div>
        <div style={s.kpi}><strong style={s.kpiNum}>{a.actifs7}</strong><span style={s.muted}>revenus cette semaine</span></div>
        <div style={s.kpi}><strong style={s.kpiNum}>{a.actifs30}</strong><span style={s.muted}>revenus en 30 jours</span></div>
      </div>
      <style>{'@media (max-width: 560px) { .ck-act-row { grid-template-columns: 110px minmax(0,1fr) 64px !important } }'}</style>
    </section>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '20px 22px', boxShadow: 'var(--card-shadow)', display: 'flex', flexDirection: 'column', gap: 16 },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 },
  label: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)' },
  muted: { fontSize: 12.5, color: 'var(--text-3)' },
  rows: { display: 'flex', flexDirection: 'column', gap: 10 },
  row: { display: 'grid', gridTemplateColumns: '170px minmax(0,1fr) 72px', gap: 12, alignItems: 'center' },
  rowLabel: { fontSize: 13.5, fontWeight: 600, color: 'var(--text)', display: 'flex', flexDirection: 'column' },
  rowSub: { display: 'block', fontSize: 11.5, fontWeight: 400, color: 'var(--text-3)' },
  track: { height: 20, borderRadius: 7, background: 'var(--bg-2)', overflow: 'hidden', display: 'block' },
  fill: { display: 'block', height: '100%', background: 'var(--accent-text)', borderRadius: 7 },
  num: { textAlign: 'right', fontWeight: 700, fontSize: 15, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' },
  alert: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 12, padding: '12px 14px' },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--accent-border)', color: 'var(--accent-text)', fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' },
  kpis: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 },
  kpi: { display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)' },
  kpiNum: { fontSize: 20, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' },
}
