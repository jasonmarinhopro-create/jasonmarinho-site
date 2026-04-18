'use client'

import { useMemo } from 'react'
import { CurrencyEur, Clock, TrendUp, CalendarBlank, House } from '@phosphor-icons/react'

interface Contract {
  id: string
  montant_loyer: number | null
  stripe_payment_status: string | null
  stripe_payment_enabled: boolean | null
  date_arrivee: string | null
  date_depart: string | null
  logement_nom: string | null
  logement_id: string | null
  statut: string | null
}

function isPaid(c: Contract): boolean {
  return c.stripe_payment_status === 'paid' ||
    (!c.stripe_payment_enabled && c.statut === 'signe')
}

function isPending(c: Contract): boolean {
  if (isPaid(c)) return false
  if (!c.date_arrivee || (c.montant_loyer ?? 0) <= 0) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(c.date_arrivee) >= today
}

function fmt(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(amount)
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

interface Props { contracts: Contract[] }

export default function RevenusView({ contracts }: Props) {
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()

  const kpis = useMemo(() => {
    let cesMoisEnc = 0
    let enAttente = 0
    let cetteAnneeEnc = 0
    const monthlyTotals: Record<string, number> = {}

    contracts.forEach(c => {
      const loyer = c.montant_loyer ?? 0
      if (loyer <= 0) return
      const dateArr = c.date_arrivee ? new Date(c.date_arrivee) : null

      if (isPaid(c) && dateArr) {
        if (dateArr.getFullYear() === thisYear) {
          cetteAnneeEnc += loyer
          if (dateArr.getMonth() === thisMonth) cesMoisEnc += loyer
        }
        const key = `${dateArr.getFullYear()}-${String(dateArr.getMonth() + 1).padStart(2, '0')}`
        monthlyTotals[key] = (monthlyTotals[key] ?? 0) + loyer
      } else if (isPending(c)) {
        enAttente += loyer
      }
    })

    const last6Keys = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(thisYear, thisMonth - i, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })
    const last6Sum = last6Keys.reduce((acc, k) => acc + (monthlyTotals[k] ?? 0), 0)

    return { cesMoisEnc, enAttente, cetteAnneeEnc, moyMensuelle: last6Sum / 6 }
  }, [contracts, thisMonth, thisYear])

  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(thisYear, thisMonth - (5 - i), 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('fr-FR', { month: 'short' })
      let total = 0
      contracts.forEach(c => {
        if (!isPaid(c) || !c.date_arrivee) return
        const dateArr = new Date(c.date_arrivee)
        const k = `${dateArr.getFullYear()}-${String(dateArr.getMonth() + 1).padStart(2, '0')}`
        if (k === key) total += c.montant_loyer ?? 0
      })
      return { key, label, total }
    })
  }, [contracts, thisMonth, thisYear])

  const logementStats = useMemo(() => {
    const stats: Record<string, { nom: string; encaisse: number; pending: number }> = {}
    contracts.forEach(c => {
      const nom = c.logement_nom ?? 'Sans nom'
      const loyer = c.montant_loyer ?? 0
      if (!stats[nom]) stats[nom] = { nom, encaisse: 0, pending: 0 }
      if (isPaid(c)) stats[nom].encaisse += loyer
      else if (isPending(c)) stats[nom].pending += loyer
    })
    return Object.values(stats)
      .filter(s => s.encaisse > 0 || s.pending > 0)
      .sort((a, b) => (b.encaisse + b.pending) - (a.encaisse + a.pending))
  }, [contracts])

  const upcoming = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return contracts
      .filter(c => isPending(c) && c.date_arrivee && new Date(c.date_arrivee) >= today)
      .sort((a, b) => new Date(a.date_arrivee!).getTime() - new Date(b.date_arrivee!).getTime())
      .slice(0, 5)
  }, [contracts])

  const maxChart = Math.max(...chartData.map(m => m.total), 1)

  return (
    <main style={styles.main}>

      {/* KPI cards */}
      <div style={styles.kpiGrid}>
        <KpiCard icon={<CurrencyEur size={20} weight="fill" />} label="Ce mois encaissé" value={fmt(kpis.cesMoisEnc)} colorClass="green" />
        <KpiCard icon={<Clock size={20} weight="fill" />} label="En attente" value={fmt(kpis.enAttente)} colorClass="yellow" />
        <KpiCard icon={<TrendUp size={20} weight="fill" />} label="Cette année" value={fmt(kpis.cetteAnneeEnc)} colorClass="accent" />
        <KpiCard icon={<CalendarBlank size={20} weight="fill" />} label="Moy. mensuelle" value={fmt(kpis.moyMensuelle)} colorClass="muted" sub="6 derniers mois" />
      </div>

      <div style={styles.twoCol}>
        {/* Bar chart */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Revenus encaissés</h2>
          <p style={styles.cardSub}>6 derniers mois</p>
          <div style={styles.chart}>
            {chartData.map(month => (
              <div key={month.key} style={styles.chartCol}>
                <div style={styles.barWrap}>
                  <div
                    style={{
                      ...styles.bar,
                      height: `${Math.max((month.total / maxChart) * 100, month.total > 0 ? 4 : 2)}%`,
                      opacity: month.total === 0 ? 0.15 : 1,
                    }}
                  />
                </div>
                <span style={styles.barAmount}>
                  {month.total > 0
                    ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(month.total)
                    : '–'}
                </span>
                <span style={styles.barLabel}>{month.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Prochains encaissements</h2>
          <p style={styles.cardSub}>Réservations en attente de paiement</p>
          {upcoming.length === 0 ? (
            <p style={styles.empty}>Aucun paiement en attente</p>
          ) : (
            <div style={styles.upcomingList}>
              {upcoming.map(c => (
                <div key={c.id} style={styles.upcomingRow}>
                  <div style={styles.upcomingLeft}>
                    <span style={styles.upcomingDate}>
                      {c.date_arrivee ? fmtDate(c.date_arrivee) : '–'}
                    </span>
                    <span style={styles.upcomingNom}>{c.logement_nom ?? '–'}</span>
                  </div>
                  <span style={styles.upcomingAmount}>{fmt(c.montant_loyer ?? 0)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* By logement */}
      {logementStats.length > 0 && (
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Par logement</h2>
          <p style={styles.cardSub}>Encaissé vs. en attente</p>
          <div style={styles.logList}>
            {logementStats.map(ls => {
              const total = ls.encaisse + ls.pending
              const pct = total > 0 ? (ls.encaisse / total) * 100 : 0
              return (
                <div key={ls.nom} style={styles.logRow}>
                  <div style={styles.logHeader}>
                    <div style={styles.logName}>
                      <House size={16} weight="fill" style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ls.nom}</span>
                    </div>
                    <div style={styles.logAmounts}>
                      <span style={{ color: 'var(--enc-color)' }}>{fmt(ls.encaisse)}</span>
                      {ls.pending > 0 && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                          + {fmt(ls.pending)} att.
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={styles.progressBg}>
                    <div style={{ ...styles.progressFill, width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <style>{`
        .kpi-icon-green { color: #16a34a; }
        .kpi-icon-yellow { color: var(--accent-text); }
        .kpi-icon-accent { color: var(--accent-text); }
        .kpi-icon-muted  { color: var(--text-muted); }
        :root { --enc-color: #16a34a; }
        @media (prefers-color-scheme: dark) { :root { --enc-color: #4ade80; } }
        [data-theme="dark"] { --enc-color: #4ade80; }
        [data-theme="light"] { --enc-color: #16a34a; }
      `}</style>
    </main>
  )
}

function KpiCard({ icon, label, value, colorClass, sub }: {
  icon: React.ReactNode
  label: string
  value: string
  colorClass: string
  sub?: string
}) {
  return (
    <div style={styles.kpiCard}>
      <div className={`kpi-icon-${colorClass}`} style={styles.kpiIcon}>{icon}</div>
      <div style={styles.kpiBody}>
        <span style={styles.kpiLabel}>{label}</span>
        <span style={styles.kpiValue}>{value}</span>
        {sub && <span style={styles.kpiSub}>{sub}</span>}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    padding: '24px',
    maxWidth: '960px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
  },
  kpiCard: {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '18px 20px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
  },
  kpiIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kpiBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  kpiLabel: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontWeight: 500,
    letterSpacing: '0.2px',
  },
  kpiValue: {
    fontSize: '22px',
    fontWeight: 600,
    color: 'var(--text)',
    letterSpacing: '-0.5px',
    lineHeight: 1.2,
  },
  kpiSub: {
    fontSize: '11px',
    color: 'var(--text-3)',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  card: {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '24px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
    marginBottom: '2px',
  },
  cardSub: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    margin: '0 0 20px 0',
  },
  chart: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '6px',
    height: '140px',
  },
  chartCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    height: '100%',
  },
  barWrap: {
    flex: 1,
    width: '100%',
    display: 'flex',
    alignItems: 'flex-end',
  },
  bar: {
    width: '100%',
    background: 'var(--accent-text)',
    borderRadius: '5px 5px 2px 2px',
    minHeight: '2px',
  },
  barAmount: {
    fontSize: '10px',
    color: 'var(--text-2)',
    fontWeight: 500,
    textAlign: 'center' as const,
    whiteSpace: 'nowrap' as const,
  },
  barLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    textTransform: 'capitalize' as const,
  },
  upcomingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  upcomingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
  },
  upcomingLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  upcomingDate: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  upcomingNom: {
    fontSize: '14px',
    color: 'var(--text)',
    fontWeight: 500,
  },
  upcomingAmount: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--accent-text)',
  },
  logList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  logRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  logHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  logName: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text)',
    minWidth: 0,
    flex: 1,
    overflow: 'hidden',
  },
  logAmounts: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
    fontSize: '13px',
    fontWeight: 600,
  },
  progressBg: {
    height: '6px',
    background: 'var(--border)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #004C3F, #16a34a)',
    borderRadius: '3px',
  },
  empty: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    textAlign: 'center' as const,
    padding: '24px 0',
    margin: 0,
  },
}
