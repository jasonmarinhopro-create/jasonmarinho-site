'use client'

import { useMemo, useState } from 'react'
import {
  ChartLineUp, House, CurrencyEur, Bed, CalendarBlank,
  TrendUp, TrendDown, Minus, Trophy, Warning, Sparkle,
  ArrowDown, ArrowUp, Download, Funnel,
} from '@phosphor-icons/react'
import type { SejourRow, LogementRow, VoyageurMin } from './page'

type Props = {
  sejours:    SejourRow[]
  logements:  LogementRow[]
  voyageurs:  VoyageurMin[]
}

type Period = '1m' | '3m' | '6m' | '12m' | 'ytd'

const PERIOD_LABELS: Record<Period, string> = {
  '1m':  'Ce mois',
  '3m':  '3 mois',
  '6m':  '6 mois',
  '12m': '12 mois',
  'ytd': 'Annee',
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  airbnb:           { label: 'Airbnb',          color: '#FF5A5F' },
  booking:          { label: 'Booking.com',     color: '#003580' },
  abritel:          { label: 'Abritel / Vrbo',  color: '#3B82F6' },
  vrbo:             { label: 'Vrbo',            color: '#3B82F6' },
  direct:           { label: 'Direct',          color: '#34D399' },
  bouche_a_oreille: { label: 'Bouche a oreille', color: '#A78BFA' },
  autre:            { label: 'Autre',           color: '#94A3B8' },
}

// ─── helpers temps ─────────────────────────────────────────────────────────
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}
function daysBetween(a: Date, b: Date) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000))
}
function clampInterval(start: Date, end: Date, winStart: Date, winEnd: Date) {
  const s = start > winStart ? start : winStart
  const e = end < winEnd ? end : winEnd
  return s < e ? { s, e } : null
}
function periodWindow(period: Period, ref: Date = new Date()) {
  const end = new Date()
  let start: Date
  if (period === '1m') start = startOfMonth(ref)
  else if (period === '3m') start = new Date(ref.getFullYear(), ref.getMonth() - 2, 1)
  else if (period === '6m') start = new Date(ref.getFullYear(), ref.getMonth() - 5, 1)
  else if (period === '12m') start = new Date(ref.getFullYear(), ref.getMonth() - 11, 1)
  else start = new Date(ref.getFullYear(), 0, 1)
  return { start, end: period === '1m' ? endOfMonth(ref) : end }
}
function fmtMonth(d: Date) {
  return d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')
}
function fmtEur(n: number) {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
}
function fmtPct(n: number, withSign = false) {
  const v = Math.round(n * 100)
  return (withSign && v > 0 ? '+' : '') + v + ' %'
}

// ─── composant principal ───────────────────────────────────────────────────
export default function PerformancesView({ sejours, logements, voyageurs }: Props) {
  const [period, setPeriod] = useState<Period>('1m')
  const [logementFilter, setLogementFilter] = useState<string>('all')

  const logementMap = useMemo(() => {
    const m = new Map<string, LogementRow>()
    logements.forEach(l => m.set(l.nom, l))
    return m
  }, [logements])

  // ─── filtrage ─────────────────────────────────────────────────────────
  const filteredSejours = useMemo(() => {
    if (logementFilter === 'all') return sejours
    return sejours.filter(s => s.logement === logementFilter)
  }, [sejours, logementFilter])

  // ─── calculs sur la fenetre courante ───────────────────────────────────
  const { start: winStart, end: winEnd } = useMemo(() => periodWindow(period), [period])
  const totalDaysWindow = daysBetween(winStart, winEnd) || 1

  const stats = useMemo(() => {
    let nightsBooked = 0
    let revenue = 0
    let countSejours = 0
    let totalDuration = 0
    let totalAnticipation = 0
    let countAnticipation = 0
    const perLogement: Record<string, { nuits: number; revenu: number; sejours: number; durees: number[]; anticipation: number[] }> = {}
    const perMonth: Record<string, { nuits: number; revenu: number; dispoNuits: number }> = {}

    filteredSejours.forEach(s => {
      const arr = new Date(s.date_arrivee + 'T12:00:00')
      const dep = new Date(s.date_depart + 'T12:00:00')
      const overlap = clampInterval(arr, dep, winStart, winEnd)
      if (!overlap) return
      const nuits = daysBetween(overlap.s, overlap.e)
      const fullDuration = daysBetween(arr, dep)
      const fraction = fullDuration > 0 ? nuits / fullDuration : 0
      const revenuFraction = (s.montant ?? 0) * fraction

      nightsBooked += nuits
      revenue += revenuFraction
      countSejours += 1
      totalDuration += fullDuration

      if (s.created_at) {
        const created = new Date(s.created_at)
        const ant = daysBetween(created, arr)
        if (ant > 0 && ant < 365) {
          totalAnticipation += ant
          countAnticipation += 1
        }
      }

      const key = s.logement ?? '-'
      if (!perLogement[key]) perLogement[key] = { nuits: 0, revenu: 0, sejours: 0, durees: [], anticipation: [] }
      perLogement[key].nuits += nuits
      perLogement[key].revenu += revenuFraction
      perLogement[key].sejours += 1
      perLogement[key].durees.push(fullDuration)
      if (s.created_at) {
        const ant = daysBetween(new Date(s.created_at), arr)
        if (ant > 0 && ant < 365) perLogement[key].anticipation.push(ant)
      }
    })

    const logementCount = logementFilter === 'all'
      ? Math.max(1, logements.length)
      : 1
    const occupation = nightsBooked / (totalDaysWindow * logementCount)
    const prixMoyen = nightsBooked > 0 ? revenue / nightsBooked : 0
    const dureeMoyenne = countSejours > 0 ? totalDuration / countSejours : 0
    const anticipationMoyenne = countAnticipation > 0 ? totalAnticipation / countAnticipation : 0

    return {
      nightsBooked,
      revenue,
      countSejours,
      occupation,
      prixMoyen,
      dureeMoyenne,
      anticipationMoyenne,
      perLogement,
      perMonth,
    }
  }, [filteredSejours, winStart, winEnd, totalDaysWindow, logementFilter, logements.length])

  // ─── periode precedente pour delta ─────────────────────────────────────
  const previousStats = useMemo(() => {
    const prevEnd = new Date(winStart)
    const prevStart = new Date(winStart)
    const ms = winEnd.getTime() - winStart.getTime()
    prevStart.setTime(prevStart.getTime() - ms)

    let nights = 0
    let revenue = 0
    filteredSejours.forEach(s => {
      const arr = new Date(s.date_arrivee + 'T12:00:00')
      const dep = new Date(s.date_depart + 'T12:00:00')
      const overlap = clampInterval(arr, dep, prevStart, prevEnd)
      if (!overlap) return
      const nuits = daysBetween(overlap.s, overlap.e)
      const fullDuration = daysBetween(arr, dep)
      const fraction = fullDuration > 0 ? nuits / fullDuration : 0
      nights += nuits
      revenue += (s.montant ?? 0) * fraction
    })

    const dispo = daysBetween(prevStart, prevEnd) || 1
    const logementCount = logementFilter === 'all' ? Math.max(1, logements.length) : 1
    return {
      nights,
      revenue,
      occupation: nights / (dispo * logementCount),
    }
  }, [filteredSejours, winStart, winEnd, logementFilter, logements.length])

  const deltas = useMemo(() => {
    const occDelta = previousStats.occupation > 0
      ? (stats.occupation - previousStats.occupation) / previousStats.occupation
      : (stats.occupation > 0 ? 1 : 0)
    const revDelta = previousStats.revenue > 0
      ? (stats.revenue - previousStats.revenue) / previousStats.revenue
      : (stats.revenue > 0 ? 1 : 0)
    return { occupation: occDelta, revenue: revDelta }
  }, [stats, previousStats])

  // ─── graphe mensuel sur 12 mois (toujours, indep de period) ────────────
  const monthly = useMemo(() => {
    const now = new Date()
    const months: { label: string; key: string; date: Date; nuits: number; revenu: number; dispo: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        label: fmtMonth(d),
        key: d.toISOString().slice(0, 7),
        date: d,
        nuits: 0,
        revenu: 0,
        dispo: 0,
      })
    }
    const logementCount = logementFilter === 'all' ? Math.max(1, logements.length) : 1
    months.forEach(m => {
      const mEnd = endOfMonth(m.date)
      m.dispo = daysBetween(m.date, mEnd) * logementCount
    })
    filteredSejours.forEach(s => {
      const arr = new Date(s.date_arrivee + 'T12:00:00')
      const dep = new Date(s.date_depart + 'T12:00:00')
      const fullDuration = daysBetween(arr, dep) || 1
      months.forEach(m => {
        const mEnd = endOfMonth(m.date)
        const overlap = clampInterval(arr, dep, m.date, mEnd)
        if (!overlap) return
        const nuits = daysBetween(overlap.s, overlap.e)
        m.nuits += nuits
        m.revenu += (s.montant ?? 0) * (nuits / fullDuration)
      })
    })
    return months.map(m => ({
      ...m,
      occupation: m.dispo > 0 ? m.nuits / m.dispo : 0,
    }))
  }, [filteredSejours, logementFilter, logements.length])

  // ─── repartition par logement (donut) ──────────────────────────────────
  const repartition = useMemo(() => {
    const arr = Object.entries(stats.perLogement)
      .map(([nom, v]) => ({ nom, revenu: v.revenu, nuits: v.nuits }))
      .sort((a, b) => b.revenu - a.revenu)
    const total = arr.reduce((s, r) => s + r.revenu, 0)
    return { items: arr, total }
  }, [stats])

  // ─── sources reservation (depuis voyageurs) ────────────────────────────
  const sources = useMemo(() => {
    const counts: Record<string, number> = {}
    voyageurs.forEach(v => {
      const k = (v.source ?? 'autre').toLowerCase()
      counts[k] = (counts[k] ?? 0) + 1
    })
    const total = Object.values(counts).reduce((s, n) => s + n, 0)
    return Object.entries(counts)
      .map(([slug, n]) => ({
        slug,
        label: SOURCE_LABELS[slug]?.label ?? slug,
        color: SOURCE_LABELS[slug]?.color ?? '#94A3B8',
        count: n,
        share: total > 0 ? n / total : 0,
      }))
      .sort((a, b) => b.count - a.count)
  }, [voyageurs])

  // ─── tableau comparateur ───────────────────────────────────────────────
  const comparator = useMemo(() => {
    return logements.map(l => {
      const data = stats.perLogement[l.nom]
      const dispo = totalDaysWindow
      const nuits = data?.nuits ?? 0
      const revenu = data?.revenu ?? 0
      const sejoursCount = data?.sejours ?? 0
      const dureeAvg = data?.durees.length
        ? data.durees.reduce((s, n) => s + n, 0) / data.durees.length
        : 0
      const antAvg = data?.anticipation.length
        ? data.anticipation.reduce((s, n) => s + n, 0) / data.anticipation.length
        : 0
      return {
        id: l.id,
        nom: l.nom,
        ville: l.ville ?? '',
        occupation: dispo > 0 ? nuits / dispo : 0,
        revenu,
        prixNuit: nuits > 0 ? revenu / nuits : 0,
        nuits,
        sejours: sejoursCount,
        dureeAvg,
        antAvg,
      }
    }).sort((a, b) => b.revenu - a.revenu)
  }, [logements, stats, totalDaysWindow])

  // ─── insights auto ─────────────────────────────────────────────────────
  const insights = useMemo(() => {
    const out: { kind: 'top' | 'low' | 'tip'; text: string }[] = []
    if (comparator.length > 0) {
      const top = comparator[0]
      if (top.revenu > 0) {
        out.push({ kind: 'top', text: `${top.nom} est ton top performer (${fmtPct(top.occupation)} occupation, ${fmtEur(top.revenu)})` })
      }
      const low = [...comparator].reverse().find(c => c.occupation < 0.4 && c.occupation > 0)
      if (low) {
        out.push({ kind: 'low', text: `${low.nom} est sous les 40 % d'occupation, considere baisser le prix ou lancer une promo` })
      }
    }
    if (stats.dureeMoyenne > 0 && stats.dureeMoyenne < 3) {
      out.push({ kind: 'tip', text: `Duree moyenne de ${stats.dureeMoyenne.toFixed(1)} nuits : pense a optimiser tes frais de menage` })
    }
    if (stats.anticipationMoyenne > 60) {
      out.push({ kind: 'tip', text: `Tes voyageurs reservent ${Math.round(stats.anticipationMoyenne)} jours en avance, ouvre tes calendriers plus tot` })
    }
    return out.slice(0, 3)
  }, [comparator, stats])

  // ─── export CSV ────────────────────────────────────────────────────────
  function exportCsv() {
    const headers = ['Logement', 'Ville', 'Occupation %', 'Revenu €', 'Prix moyen/nuit €', 'Nuits', 'Sejours', 'Duree moy.', 'Anticipation moy.']
    const rows = comparator.map(c => [
      c.nom, c.ville,
      Math.round(c.occupation * 100),
      Math.round(c.revenu),
      Math.round(c.prixNuit),
      c.nuits, c.sejours,
      c.dureeAvg.toFixed(1), Math.round(c.antAvg),
    ])
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performances-${period}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── empty state ───────────────────────────────────────────────────────
  if (sejours.length === 0 || logements.length === 0) {
    return (
      <div style={s.wrap}>
        <header style={s.header}>
          <div style={s.titleRow}>
            <ChartLineUp size={28} weight="duotone" color="var(--accent-text)" />
            <h1 style={s.title}>Performances</h1>
          </div>
          <p style={s.subtitle}>Pilote ton activite : taux d'occupation, revenus, comparaison entre logements.</p>
        </header>
        <div style={s.emptyCard}>
          <Sparkle size={42} weight="duotone" color="var(--accent-text)" />
          <h2 style={s.emptyTitle}>Pas encore assez de donnees</h2>
          <p style={s.emptyText}>
            Ajoute au moins un logement et un sejour pour commencer a voir tes statistiques d'occupation et de revenus.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={s.wrap}>
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <header style={s.header}>
        <div style={s.titleRow}>
          <ChartLineUp size={28} weight="duotone" color="var(--accent-text)" />
          <h1 style={s.title}>Performances</h1>
        </div>
        <p style={s.subtitle}>Pilote ton activite : taux d'occupation, revenus, comparaison entre logements.</p>
      </header>

      {/* ─── Filtres ─────────────────────────────────────────────────── */}
      <div style={s.filters}>
        <div style={s.filterGroup}>
          <Funnel size={16} color="var(--text-3)" />
          <span style={s.filterLabel}>Periode</span>
          <div style={s.chipRow}>
            {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  ...s.chip,
                  ...(period === p ? s.chipActive : {}),
                }}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
        <div style={s.filterGroup}>
          <House size={16} color="var(--text-3)" />
          <span style={s.filterLabel}>Logement</span>
          <select
            value={logementFilter}
            onChange={e => setLogementFilter(e.target.value)}
            style={s.select}
          >
            <option value="all">Tous les logements</option>
            {logements.map(l => (
              <option key={l.id} value={l.nom}>{l.nom}</option>
            ))}
          </select>
        </div>
        <button onClick={exportCsv} style={s.exportBtn}>
          <Download size={16} weight="bold" />
          Exporter CSV
        </button>
      </div>

      {/* ─── KPIs ────────────────────────────────────────────────────── */}
      <div style={s.kpiGrid}>
        <KpiCard
          icon={<ChartLineUp size={22} weight="duotone" />}
          label="Taux d'occupation"
          value={fmtPct(stats.occupation)}
          delta={deltas.occupation}
          color="var(--accent-text)"
        />
        <KpiCard
          icon={<CurrencyEur size={22} weight="duotone" />}
          label="Revenu (periode)"
          value={fmtEur(stats.revenue)}
          delta={deltas.revenue}
          color="#34D399"
        />
        <KpiCard
          icon={<Bed size={22} weight="duotone" />}
          label="Prix moyen / nuit"
          value={fmtEur(stats.prixMoyen)}
          color="#7EB8F7"
        />
        <KpiCard
          icon={<CalendarBlank size={22} weight="duotone" />}
          label="Nb sejours"
          value={String(stats.countSejours)}
          color="#A78BFA"
        />
      </div>

      {/* ─── Insights ───────────────────────────────────────────────── */}
      {insights.length > 0 && (
        <div style={s.insights}>
          {insights.map((ins, i) => (
            <div
              key={i}
              style={{
                ...s.insight,
                borderLeftColor:
                  ins.kind === 'top' ? '#34D399'
                  : ins.kind === 'low' ? '#F59E0B'
                  : 'var(--accent-text)',
              }}
            >
              {ins.kind === 'top' && <Trophy size={18} weight="fill" color="#34D399" />}
              {ins.kind === 'low' && <Warning size={18} weight="fill" color="#F59E0B" />}
              {ins.kind === 'tip' && <Sparkle size={18} weight="fill" color="var(--accent-text)" />}
              <span>{ins.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* ─── Graphe occupation 12 mois ──────────────────────────────── */}
      <section style={s.card}>
        <div style={s.cardHead}>
          <div>
            <h3 style={s.cardTitle}>Taux d'occupation - 12 derniers mois</h3>
            <p style={s.cardSub}>Pourcentage de nuits reservees vs nuits disponibles</p>
          </div>
        </div>
        <BarChart
          items={monthly.map(m => ({
            label: m.label,
            value: m.occupation,
            display: fmtPct(m.occupation),
            color: m.occupation >= 0.7 ? '#34D399' : m.occupation >= 0.4 ? '#FACC15' : '#F87171',
          }))}
          maxValue={1}
        />
      </section>

      {/* ─── Graphe revenus 12 mois ─────────────────────────────────── */}
      <section style={s.card}>
        <div style={s.cardHead}>
          <div>
            <h3 style={s.cardTitle}>Revenus - 12 derniers mois</h3>
            <p style={s.cardSub}>Revenu mensuel calcule sur les sejours</p>
          </div>
        </div>
        <BarChart
          items={monthly.map(m => ({
            label: m.label,
            value: m.revenu,
            display: fmtEur(m.revenu),
            color: 'var(--accent-text)',
          }))}
          maxValue={Math.max(1, ...monthly.map(m => m.revenu))}
        />
      </section>

      {/* ─── Repartition + Sources ──────────────────────────────────── */}
      <div style={s.twoCol}>
        <section style={s.card}>
          <div style={s.cardHead}>
            <div>
              <h3 style={s.cardTitle}>Repartition revenus par logement</h3>
              <p style={s.cardSub}>Sur la periode selectionnee</p>
            </div>
          </div>
          {repartition.total > 0 ? (
            <Donut
              items={repartition.items.map((r, i) => ({
                label: r.nom,
                value: r.revenu,
                color: DONUT_COLORS[i % DONUT_COLORS.length],
              }))}
              total={repartition.total}
              centerLabel={fmtEur(repartition.total)}
            />
          ) : (
            <p style={s.empty}>Aucun revenu sur cette periode.</p>
          )}
        </section>

        <section style={s.card}>
          <div style={s.cardHead}>
            <div>
              <h3 style={s.cardTitle}>Sources de reservation</h3>
              <p style={s.cardSub}>D'ou viennent tes voyageurs</p>
            </div>
          </div>
          {sources.length > 0 ? (
            <div style={s.sourcesList}>
              {sources.map(src => (
                <div key={src.slug} style={s.sourceRow}>
                  <div style={s.sourceLabelRow}>
                    <span style={{ ...s.sourceDot, background: src.color }} />
                    <span style={s.sourceLabel}>{src.label}</span>
                    <span style={s.sourceCount}>{src.count}</span>
                  </div>
                  <div style={s.sourceBar}>
                    <div style={{
                      ...s.sourceBarFill,
                      width: `${Math.max(2, src.share * 100)}%`,
                      background: src.color,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={s.empty}>Renseigne la source des voyageurs pour voir cette stat.</p>
          )}
        </section>
      </div>

      {/* ─── Comparateur logements ──────────────────────────────────── */}
      <section style={s.card}>
        <div style={s.cardHead}>
          <div>
            <h3 style={s.cardTitle}>Comparaison de tes logements</h3>
            <p style={s.cardSub}>{PERIOD_LABELS[period]} - tries par revenu decroissant</p>
          </div>
        </div>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Logement</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Occupation</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Revenu</th>
                <th style={{ ...s.th, textAlign: 'right' }}>€/nuit</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Nuits</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Sejours</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Duree moy.</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Anticipation</th>
              </tr>
            </thead>
            <tbody>
              {comparator.map(c => {
                const occColor = c.occupation >= 0.7 ? '#34D399'
                  : c.occupation >= 0.4 ? '#FACC15' : '#F87171'
                return (
                  <tr key={c.id} style={s.tr}>
                    <td style={s.td}>
                      <div style={s.tdNom}>{c.nom}</div>
                      {c.ville && <div style={s.tdVille}>{c.ville}</div>}
                    </td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      <span style={{
                        ...s.occBadge,
                        color: occColor,
                        background: `${occColor}1f`,
                      }}>
                        {fmtPct(c.occupation)}
                      </span>
                    </td>
                    <td style={{ ...s.td, textAlign: 'right', fontWeight: 600 }}>{fmtEur(c.revenu)}</td>
                    <td style={{ ...s.td, textAlign: 'right' }}>{fmtEur(c.prixNuit)}</td>
                    <td style={{ ...s.td, textAlign: 'right' }}>{c.nuits}</td>
                    <td style={{ ...s.td, textAlign: 'right' }}>{c.sejours}</td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      {c.dureeAvg > 0 ? `${c.dureeAvg.toFixed(1)} n.` : '-'}
                    </td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      {c.antAvg > 0 ? `${Math.round(c.antAvg)} j.` : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, delta, color }: {
  icon: React.ReactNode
  label: string
  value: string
  delta?: number
  color: string
}) {
  const showDelta = typeof delta === 'number'
  const isUp = (delta ?? 0) > 0.01
  const isDown = (delta ?? 0) < -0.01
  const deltaColor = isUp ? '#34D399' : isDown ? '#F87171' : 'var(--text-3)'
  const DeltaIcon = isUp ? ArrowUp : isDown ? ArrowDown : Minus
  return (
    <div style={s.kpi}>
      <div style={{ ...s.kpiIcon, color }}>{icon}</div>
      <div>
        <div style={s.kpiLabel}>{label}</div>
        <div style={s.kpiValue}>{value}</div>
        {showDelta && (
          <div style={{ ...s.kpiDelta, color: deltaColor }}>
            <DeltaIcon size={12} weight="bold" />
            {fmtPct(Math.abs(delta!), false)} vs periode precedente
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Bar chart ────────────────────────────────────────────────────────────
function BarChart({ items, maxValue }: {
  items: { label: string; value: number; display: string; color: string }[]
  maxValue: number
}) {
  return (
    <div style={s.barChart}>
      {items.map((it, i) => {
        const h = maxValue > 0 ? (it.value / maxValue) * 100 : 0
        return (
          <div key={i} style={s.barCol}>
            <div style={s.barWrap}>
              <div style={s.barTooltip}>{it.display}</div>
              <div style={{ ...s.bar, height: `${Math.max(2, h)}%`, background: it.color }} />
            </div>
            <div style={s.barLabel}>{it.label}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Donut SVG ────────────────────────────────────────────────────────────
const DONUT_COLORS = ['#FFD56B', '#34D399', '#7EB8F7', '#A78BFA', '#F87171', '#FB923C', '#22D3EE', '#F472B6']

function Donut({ items, total, centerLabel }: {
  items: { label: string; value: number; color: string }[]
  total: number
  centerLabel: string
}) {
  const r = 60
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <div style={s.donutWrap}>
      <svg viewBox="0 0 160 160" style={{ width: 160, height: 160 }}>
        <circle cx="80" cy="80" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="20" />
        {items.map((it, i) => {
          const len = (it.value / total) * c
          const offset = c - acc
          acc += len
          return (
            <circle
              key={i}
              cx="80" cy="80" r={r}
              fill="none"
              stroke={it.color}
              strokeWidth="20"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={offset}
              transform="rotate(-90 80 80)"
            />
          )
        })}
        <text x="80" y="76" textAnchor="middle" fill="var(--text-2)" fontSize="9">Total</text>
        <text x="80" y="92" textAnchor="middle" fill="var(--text)" fontSize="13" fontWeight="700">{centerLabel}</text>
      </svg>
      <div style={s.donutLegend}>
        {items.slice(0, 6).map((it, i) => (
          <div key={i} style={s.donutLegendItem}>
            <span style={{ ...s.sourceDot, background: it.color }} />
            <span style={s.donutLegendLabel}>{it.label}</span>
            <span style={s.donutLegendValue}>{Math.round((it.value / total) * 100)} %</span>
          </div>
        ))}
        {items.length > 6 && (
          <div style={s.donutLegendMore}>+ {items.length - 6} autres</div>
        )}
      </div>
    </div>
  )
}

// ─── styles ───────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  wrap: {
    padding: '32px 28px 60px',
    display: 'flex', flexDirection: 'column', gap: 20,
    color: 'var(--text)',
  },
  header: { display: 'flex', flexDirection: 'column', gap: 6 },
  titleRow: { display: 'flex', alignItems: 'center', gap: 12 },
  title: { fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' },
  subtitle: { color: 'var(--text-2)', fontSize: 14, margin: 0 },

  filters: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12,
    padding: '12px 14px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
  },
  filterGroup: { display: 'flex', alignItems: 'center', gap: 8 },
  filterLabel: { fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  chipRow: { display: 'flex', gap: 4 },
  chip: {
    padding: '6px 12px', borderRadius: 999,
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontSize: 13, cursor: 'pointer',
    transition: 'all .15s',
  },
  chipActive: {
    background: 'var(--accent-bg-2)',
    borderColor: 'var(--accent-border-2)',
    color: 'var(--accent-text)',
    fontWeight: 600,
  },
  select: {
    padding: '6px 10px', borderRadius: 8,
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: 13, cursor: 'pointer',
  },
  exportBtn: {
    marginLeft: 'auto',
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', borderRadius: 999,
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontSize: 13, cursor: 'pointer',
    fontWeight: 500,
  },

  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 14,
  },
  kpi: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '16px 18px',
    display: 'flex', alignItems: 'flex-start', gap: 14,
  },
  kpiIcon: {
    width: 44, height: 44, borderRadius: 12,
    background: 'var(--surface-2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  kpiLabel: { fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 },
  kpiValue: { fontSize: 24, fontWeight: 700, lineHeight: 1.1 },
  kpiDelta: { fontSize: 11, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 },

  insights: {
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  insight: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px',
    background: 'var(--surface)',
    borderLeft: '3px solid var(--accent-text)',
    borderRadius: 10,
    fontSize: 13.5, color: 'var(--text)',
  },

  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '20px 22px',
  },
  cardHead: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: 12, marginBottom: 18,
  },
  cardTitle: { fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text)' },
  cardSub:   { fontSize: 12.5, color: 'var(--text-3)', margin: '4px 0 0' },

  twoCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: 16,
  },

  // bar chart
  barChart: {
    display: 'flex', alignItems: 'flex-end', gap: 6, height: 220,
    padding: '4px 0',
  },
  barCol: {
    flex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    height: '100%',
  },
  barWrap: {
    flex: 1, width: '100%',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    position: 'relative',
  },
  bar: {
    width: '70%', borderRadius: '6px 6px 0 0',
    transition: 'all .2s',
  },
  barTooltip: {
    position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%) translateY(-100%)',
    background: 'var(--text)', color: 'var(--bg)',
    fontSize: 11, padding: '2px 6px', borderRadius: 4,
    opacity: 0, pointerEvents: 'none', transition: 'opacity .15s',
    whiteSpace: 'nowrap',
  },
  barLabel: { fontSize: 11, color: 'var(--text-3)' },

  // donut
  donutWrap: {
    display: 'flex', alignItems: 'center', gap: 24,
    flexWrap: 'wrap',
  },
  donutLegend: {
    flex: 1, minWidth: 180,
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  donutLegendItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 13,
  },
  donutLegendLabel: { flex: 1, color: 'var(--text-2)' },
  donutLegendValue: { color: 'var(--text)', fontWeight: 600 },
  donutLegendMore: { fontSize: 12, color: 'var(--text-3)', marginTop: 4 },

  // sources
  sourcesList: { display: 'flex', flexDirection: 'column', gap: 14 },
  sourceRow: { display: 'flex', flexDirection: 'column', gap: 6 },
  sourceLabelRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 },
  sourceDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  sourceLabel: { flex: 1, color: 'var(--text-2)' },
  sourceCount: { color: 'var(--text)', fontWeight: 600 },
  sourceBar: { height: 6, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' },
  sourceBarFill: { height: '100%', borderRadius: 4, transition: 'width .3s' },

  // table
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    textAlign: 'left', padding: '10px 12px',
    fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em',
    fontWeight: 600,
    borderBottom: '1px solid var(--border)',
  },
  tr: { borderBottom: '1px solid var(--border)' },
  td: { padding: '12px', color: 'var(--text-2)' },
  tdNom: { color: 'var(--text)', fontWeight: 600 },
  tdVille: { fontSize: 11, color: 'var(--text-3)', marginTop: 2 },
  occBadge: {
    display: 'inline-block',
    padding: '4px 10px', borderRadius: 999,
    fontSize: 12, fontWeight: 700,
  },

  empty: { color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '20px 0' },
  emptyCard: {
    padding: '60px 30px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    textAlign: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--text)' },
  emptyText:  { color: 'var(--text-2)', fontSize: 14, maxWidth: 420, margin: 0 },
}
