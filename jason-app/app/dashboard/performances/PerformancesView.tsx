'use client'

import { useMemo, useState } from 'react'
import {
  ChartLineUp, House, CurrencyEur, Bed, CalendarBlank,
  TrendUp, TrendDown, Minus, Trophy, Warning, Sparkle,
  ArrowDown, ArrowUp, Download, Funnel,
} from '@phosphor-icons/react/dist/ssr'
import type { SejourRow, LogementRow, VoyageurMin, ChargeRow } from './page'
import type { MarketBenchmark } from '@/lib/lcd/market-benchmarks'
import PremiumLock from '@/components/ui/PremiumLock'

type Plan = 'decouverte' | 'standard' | 'driing'

type Props = {
  sejours:    SejourRow[]
  logements:  LogementRow[]
  voyageurs:  VoyageurMin[]
  benchmarks?: Record<string, MarketBenchmark | null>
  objectifAnnuel?: number | null
  plan?: Plan
  charges?: ChargeRow[]
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
  direct:           { label: 'Direct',          color: 'var(--success-1)' },
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
function getISOWeek(d: Date): number {
  // ISO week number (1-53)
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  return Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
function mondayOfWeek(d: Date): Date {
  const m = new Date(d)
  const day = m.getDay() || 7 // dim = 0 → 7
  if (day !== 1) m.setDate(m.getDate() - (day - 1))
  m.setHours(0, 0, 0, 0)
  return m
}
function fmtDateRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  const sStr = start.toLocaleDateString('fr-FR', opts)
  const e2 = new Date(end); e2.setDate(e2.getDate() - 1)
  const eStr = e2.toLocaleDateString('fr-FR', opts)
  return `${sStr} → ${eStr}`
}
function fmtEur(n: number) {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
}
function fmtPct(n: number, withSign = false) {
  const v = Math.round(n * 100)
  return (withSign && v > 0 ? '+' : '') + v + ' %'
}

// ─── composant principal ───────────────────────────────────────────────────
export default function PerformancesView({ sejours, logements, voyageurs, benchmarks, objectifAnnuel, plan = 'decouverte', charges = [] }: Props) {
  const [period, setPeriod] = useState<Period>(sejours.length < 5 ? '12m' : '1m')
  const isPremium = plan === 'standard' || plan === 'driing'
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

  // ─── KPIs hôteliers (RevPAR, ADR, premium weekend, jour de semaine) ────
  // RevPAR  : Revenue Per Available Night — métrique #1 en hôtellerie
  // ADR     : Average Daily Rate — prix moyen par nuit louée
  // weekend premium : différentiel prix vendredi-samedi vs lundi-jeudi
  const hotelKpis = useMemo(() => {
    const logementCount = logementFilter === 'all' ? Math.max(1, logements.length) : 1
    const nuitsDispo = totalDaysWindow * logementCount
    const revpar = nuitsDispo > 0 ? stats.revenue / nuitsDispo : 0
    const adr = stats.prixMoyen // = revenue / nuits louées (déjà calculé)

    // Split par jour de semaine : on agrège les nuits réservées et le CA
    // par jour de la semaine (0=dimanche, 1=lundi, ..., 6=samedi)
    const byDow: Record<number, { nuits: number; revenu: number }> = {
      0: { nuits: 0, revenu: 0 }, 1: { nuits: 0, revenu: 0 },
      2: { nuits: 0, revenu: 0 }, 3: { nuits: 0, revenu: 0 },
      4: { nuits: 0, revenu: 0 }, 5: { nuits: 0, revenu: 0 },
      6: { nuits: 0, revenu: 0 },
    }
    filteredSejours.forEach(s => {
      const arr = new Date(s.date_arrivee + 'T12:00:00')
      const dep = new Date(s.date_depart + 'T12:00:00')
      const fullDuration = daysBetween(arr, dep) || 1
      const pricePerNight = (s.montant ?? 0) / fullDuration
      const overlap = clampInterval(arr, dep, winStart, winEnd)
      if (!overlap) return
      const cursor = new Date(overlap.s)
      while (cursor < overlap.e) {
        const dow = cursor.getDay()
        byDow[dow].nuits += 1
        byDow[dow].revenu += pricePerNight
        cursor.setDate(cursor.getDate() + 1)
      }
    })

    const weekendNuits = byDow[5].nuits + byDow[6].nuits // ven + sam
    const weekendRevenu = byDow[5].revenu + byDow[6].revenu
    const semaineNuits = byDow[0].nuits + byDow[1].nuits + byDow[2].nuits + byDow[3].nuits + byDow[4].nuits
    const semaineRevenu = byDow[0].revenu + byDow[1].revenu + byDow[2].revenu + byDow[3].revenu + byDow[4].revenu
    const weekendAdr = weekendNuits > 0 ? weekendRevenu / weekendNuits : 0
    const semaineAdr = semaineNuits > 0 ? semaineRevenu / semaineNuits : 0
    const weekendPremiumPct = semaineAdr > 0 ? (weekendAdr - semaineAdr) / semaineAdr : 0

    return {
      revpar,
      adr,
      nuitsDispo,
      byDow,
      weekendAdr,
      semaineAdr,
      weekendPremiumPct,
      potentielAnnuel: adr * 365 * logementCount, // si 100% occupé toute l'année
    }
  }, [filteredSejours, winStart, winEnd, totalDaysWindow, logementFilter, logements.length, stats.prixMoyen, stats.revenue])

  // ─── projection annuelle vs objectif (utilise revenus_objectifs) ───────
  const projection = useMemo(() => {
    if (!objectifAnnuel || objectifAnnuel <= 0) return null
    // CA YTD réel (depuis le 1er janvier)
    const now = new Date()
    const yStart = new Date(now.getFullYear(), 0, 1)
    let ytdRevenu = 0
    sejours.forEach(s => {
      const arr = new Date(s.date_arrivee + 'T12:00:00')
      const dep = new Date(s.date_depart + 'T12:00:00')
      const overlap = clampInterval(arr, dep, yStart, now)
      if (!overlap) return
      const nuits = daysBetween(overlap.s, overlap.e)
      const fullDuration = daysBetween(arr, dep) || 1
      ytdRevenu += (s.montant ?? 0) * (nuits / fullDuration)
    })
    const daysElapsed = Math.max(1, daysBetween(yStart, now))
    const daysInYear = ((now.getFullYear() % 4 === 0 && now.getFullYear() % 100 !== 0) || now.getFullYear() % 400 === 0) ? 366 : 365
    // Projection naïve : extrapolation linéaire YTD → fin d'année
    const projete = (ytdRevenu / daysElapsed) * daysInYear
    const objectifPct = (ytdRevenu / objectifAnnuel) * 100
    const projetePct = (projete / objectifAnnuel) * 100
    return { ytdRevenu, projete, objectifPct, projetePct, daysElapsed, daysInYear }
  }, [sejours, objectifAnnuel])

  // ─── benchmark marché du logement courant ──────────────────────────────
  const currentBenchmark = useMemo(() => {
    if (!benchmarks) return null
    if (logementFilter === 'all') {
      // Si plusieurs logements, on prend celui qui a un benchmark précis,
      // sinon le 1er (l'utilisateur change de filtre s'il veut autre chose)
      const first = logements.find(l => benchmarks[l.id]?.tier === 'precise')
                 ?? logements[0]
      return first ? { logement: first, bench: benchmarks[first.id] } : null
    }
    const l = logements.find(lg => lg.nom === logementFilter)
    return l ? { logement: l, bench: benchmarks[l.id] } : null
  }, [benchmarks, logements, logementFilter])

  // ─── PREMIUM : heatmap jour de semaine (7 jours × intensité) ───────────
  const dowHeatmap = useMemo(() => {
    if (!isPremium) return null
    const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    const dowOrder = [1, 2, 3, 4, 5, 6, 0] // afficher lun→dim
    const data = dowOrder.map(d => ({
      label: labels[dowOrder.indexOf(d)],
      nuits: hotelKpis.byDow[d]?.nuits ?? 0,
      revenu: hotelKpis.byDow[d]?.revenu ?? 0,
      adr: (hotelKpis.byDow[d]?.nuits ?? 0) > 0
        ? (hotelKpis.byDow[d].revenu / hotelKpis.byDow[d].nuits) : 0,
    }))
    const maxNuits = Math.max(1, ...data.map(d => d.nuits))
    return data.map(d => ({ ...d, intensity: d.nuits / maxNuits }))
  }, [hotelKpis, isPremium])

  // ─── PREMIUM : comparatif Year-over-Year (cette année vs N-1) ──────────
  const yoyStats = useMemo(() => {
    if (!isPremium) return null
    const now = new Date()
    const thisYear = now.getFullYear()
    const lastYear = thisYear - 1
    const thisYearStart = new Date(thisYear, 0, 1)
    const lastYearStart = new Date(lastYear, 0, 1)
    const lastYearSameDay = new Date(lastYear, now.getMonth(), now.getDate())

    let thisYearNuits = 0, thisYearRevenu = 0, thisYearSejours = 0
    let lastYearNuits = 0, lastYearRevenu = 0, lastYearSejours = 0

    sejours.forEach(s => {
      const arr = new Date(s.date_arrivee + 'T12:00:00')
      const dep = new Date(s.date_depart + 'T12:00:00')
      const fullDuration = daysBetween(arr, dep) || 1
      const pricePerNight = (s.montant ?? 0) / fullDuration

      // This year YTD
      const overlapTY = clampInterval(arr, dep, thisYearStart, now)
      if (overlapTY) {
        const n = daysBetween(overlapTY.s, overlapTY.e)
        thisYearNuits += n
        thisYearRevenu += pricePerNight * n
        if (arr >= thisYearStart && arr <= now) thisYearSejours += 1
      }
      // Last year same period
      const overlapLY = clampInterval(arr, dep, lastYearStart, lastYearSameDay)
      if (overlapLY) {
        const n = daysBetween(overlapLY.s, overlapLY.e)
        lastYearNuits += n
        lastYearRevenu += pricePerNight * n
        if (arr >= lastYearStart && arr <= lastYearSameDay) lastYearSejours += 1
      }
    })

    const revenuDelta = lastYearRevenu > 0 ? (thisYearRevenu - lastYearRevenu) / lastYearRevenu : null
    const nuitsDelta = lastYearNuits > 0 ? (thisYearNuits - lastYearNuits) / lastYearNuits : null
    const sejoursDelta = lastYearSejours > 0 ? (thisYearSejours - lastYearSejours) / lastYearSejours : null
    return {
      thisYear, lastYear, thisYearRevenu, lastYearRevenu, thisYearNuits, lastYearNuits,
      thisYearSejours, lastYearSejours, revenuDelta, nuitsDelta, sejoursDelta,
    }
  }, [sejours, isPremium])

  // ─── PREMIUM : recommandations de prix par mois (basé marché + historique) ──
  const monthlyPricingReco = useMemo(() => {
    if (!isPremium || !currentBenchmark?.bench) return null
    const bench = currentBenchmark.bench
    const seasonalMultiplier: Record<number, number> = {}
    // Coefficient saisonnier : haute saison = 1.25, basse saison = 0.85, neutre = 1.0
    for (let m = 1; m <= 12; m++) {
      seasonalMultiplier[m] = bench.saisonHaute.includes(m) ? 1.25
        : Math.abs(6.5 - m) > 4.5 ? 0.85 // mois loin de l'été par défaut
        : 1.0
    }
    // ADR de base : utilise l'historique de l'hôte s'il y a, sinon le marché
    const baseAdr = hotelKpis.adr > 0 ? hotelKpis.adr : bench.adrEur
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const mult = seasonalMultiplier[month]
      return {
        month,
        label: MONTH_NAMES_FULL[i],
        recommandedPrice: Math.round(baseAdr * mult),
        isHigh: bench.saisonHaute.includes(month),
        isLow: mult < 1,
      }
    })
  }, [isPremium, currentBenchmark, hotelKpis.adr])

  // ─── PREMIUM : distance plafonds légaux (FR 120j / PT 200k€ AL) ────────
  const legalLimits = useMemo(() => {
    if (!isPremium) return null
    const now = new Date()
    const yStart = new Date(now.getFullYear(), 0, 1)
    let nuitsYtd = 0
    sejours.forEach(s => {
      const arr = new Date(s.date_arrivee + 'T12:00:00')
      const dep = new Date(s.date_depart + 'T12:00:00')
      const overlap = clampInterval(arr, dep, yStart, now)
      if (overlap) nuitsYtd += daysBetween(overlap.s, overlap.e)
    })

    // Détecte le pays dominant des logements (filtre actuel ou 1er)
    const currentPays = logementFilter === 'all'
      ? (logements[0]?.pays ?? 'FR')
      : (logements.find(l => l.nom === logementFilter)?.pays ?? 'FR')

    // CA YTD (déjà calculé dans projection mais on duplique pour ne pas dépendre)
    let caYtd = 0
    sejours.forEach(s => {
      const arr = new Date(s.date_arrivee + 'T12:00:00')
      const dep = new Date(s.date_depart + 'T12:00:00')
      const overlap = clampInterval(arr, dep, yStart, now)
      if (!overlap) return
      const fullDuration = daysBetween(arr, dep) || 1
      caYtd += (s.montant ?? 0) * (daysBetween(overlap.s, overlap.e) / fullDuration)
    })

    const limits: Array<{ label: string; current: number; max: number; unit: string; severity: 'ok' | 'warn' | 'danger'; note: string }> = []
    if (currentPays === 'FR') {
      limits.push({
        label: 'Plafond résidence principale (120 j/an)',
        current: nuitsYtd,
        max: 120,
        unit: 'j',
        severity: nuitsYtd >= 110 ? 'danger' : nuitsYtd >= 90 ? 'warn' : 'ok',
        note: 'Applicable si tu loues ta résidence principale meublée. Au-delà : ce n\'est plus une résidence principale fiscalement.',
      })
      limits.push({
        label: 'Seuil micro-BIC non classé (15 000 €)',
        current: caYtd,
        max: 15000,
        unit: '€',
        severity: caYtd >= 13500 ? 'danger' : caYtd >= 12000 ? 'warn' : 'ok',
        note: 'Au-delà : tu bascules au régime réel ou tu dois faire classer ton meublé.',
      })
      limits.push({
        label: 'Seuil LMP (23 000 €)',
        current: caYtd,
        max: 23000,
        unit: '€',
        severity: caYtd >= 21000 ? 'danger' : caYtd >= 18000 ? 'warn' : 'ok',
        note: 'Au-delà ET si LCD > autres revenus pro du foyer : passage automatique en Loueur Meublé Professionnel (cotisations SSI ~35 %).',
      })
    } else if (currentPays === 'PT') {
      limits.push({
        label: 'Seuil IVA Alojamento Local (15 000 €)',
        current: caYtd,
        max: 15000,
        unit: '€',
        severity: caYtd >= 13500 ? 'danger' : caYtd >= 12000 ? 'warn' : 'ok',
        note: 'Au-delà (Portugal continental) tu deviens assujetti à l\'IVA (6 % continental, 5 % Açores/Madeira), reverse trimestriellement.',
      })
      limits.push({
        label: 'Plafond Categoria B simplifié (200 000 €)',
        current: caYtd,
        max: 200000,
        unit: '€',
        severity: caYtd >= 180000 ? 'danger' : caYtd >= 150000 ? 'warn' : 'ok',
        note: 'Au-delà : contabilidade organizada obligatoire (comptabilité complète, expert-comptable requis).',
      })
    }
    return { limits, currentPays }
  }, [isPremium, sejours, logements, logementFilter])

  // ─── PREMIUM : sources réservation par % REVENU (pas juste # voyageurs) ──
  // Croise voyageurs (source) avec leurs séjours réalisés pour pondérer par CA.
  const sourcesByRevenue = useMemo(() => {
    if (!isPremium) return null
    const voyageurSourceMap = new Map<string, string>()
    voyageurs.forEach(v => voyageurSourceMap.set(v.id, (v.source ?? 'autre').toLowerCase()))

    const bySource: Record<string, { revenu: number; nuits: number; voyageurs: Set<string> }> = {}
    filteredSejours.forEach(s => {
      const arr = new Date(s.date_arrivee + 'T12:00:00')
      const dep = new Date(s.date_depart + 'T12:00:00')
      const overlap = clampInterval(arr, dep, winStart, winEnd)
      if (!overlap) return
      const fullDuration = daysBetween(arr, dep) || 1
      const nuits = daysBetween(overlap.s, overlap.e)
      const revenu = (s.montant ?? 0) * (nuits / fullDuration)

      // Priorité : source plateforme du séjour, sinon source du voyageur, sinon 'autre'
      const sejourSource = s.contrat_plateforme?.toLowerCase()
      const voyageurSource = s.voyageur_id ? voyageurSourceMap.get(s.voyageur_id) : null
      const source = (sejourSource ?? voyageurSource ?? 'autre').toLowerCase()

      if (!bySource[source]) bySource[source] = { revenu: 0, nuits: 0, voyageurs: new Set() }
      bySource[source].revenu += revenu
      bySource[source].nuits += nuits
      if (s.voyageur_id) bySource[source].voyageurs.add(s.voyageur_id)
    })

    const total = Object.values(bySource).reduce((sum, v) => sum + v.revenu, 0)
    return Object.entries(bySource)
      .map(([slug, v]) => ({
        slug,
        label: SOURCE_LABELS[slug]?.label ?? slug,
        color: SOURCE_LABELS[slug]?.color ?? '#94A3B8',
        revenu: v.revenu,
        nuits: v.nuits,
        voyageurs: v.voyageurs.size,
        shareRevenu: total > 0 ? v.revenu / total : 0,
        adr: v.nuits > 0 ? v.revenu / v.nuits : 0,
      }))
      .sort((a, b) => b.revenu - a.revenu)
  }, [filteredSejours, voyageurs, winStart, winEnd, isPremium])

  // ─── PREMIUM : saisonnalité personnelle vs marché ─────────────────────
  // Compare ton occupation mois par mois à celle attendue par le marché
  // (basée sur la saisonHaute du benchmark : haute=70%, basse=35%, neutre=50%)
  const personalVsMarketSeason = useMemo(() => {
    if (!isPremium || !currentBenchmark?.bench || sejours.length === 0) return null
    const bench = currentBenchmark.bench
    // Agrège occupation personnelle par mois (toutes années confondues, normalisée)
    const personalByMonth: Record<number, { nuitsBooked: number; nuitsDispo: number }> = {}
    for (let m = 1; m <= 12; m++) personalByMonth[m] = { nuitsBooked: 0, nuitsDispo: 0 }

    // On agrège sur les 12 derniers mois (1 cycle complet) si l'utilisateur a la data
    const now = new Date()
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    sejours.forEach(s => {
      const arr = new Date(s.date_arrivee + 'T12:00:00')
      const dep = new Date(s.date_depart + 'T12:00:00')
      const overlap = clampInterval(arr, dep, oneYearAgo, now)
      if (!overlap) return
      const cursor = new Date(overlap.s)
      while (cursor < overlap.e) {
        const month = cursor.getMonth() + 1
        personalByMonth[month].nuitsBooked += 1
        cursor.setDate(cursor.getDate() + 1)
      }
    })
    // Nuits dispo par mois sur les 12 derniers mois
    const monthDays = [31,28,31,30,31,30,31,31,30,31,30,31]
    const logementCount = logementFilter === 'all' ? Math.max(1, logements.length) : 1
    for (let m = 1; m <= 12; m++) {
      personalByMonth[m].nuitsDispo = monthDays[m - 1] * logementCount
    }

    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const personalOcc = personalByMonth[month].nuitsDispo > 0
        ? personalByMonth[month].nuitsBooked / personalByMonth[month].nuitsDispo : 0
      // Marché : 70% en haute saison, 35% basse saison, 50% neutre (heuristique)
      const marketOcc = bench.saisonHaute.includes(month) ? 0.70
        : Math.abs(6.5 - month) > 4.5 ? 0.35
        : 0.50
      return {
        month,
        label: MONTH_NAMES[i],
        personalOcc,
        marketOcc,
        delta: personalOcc - marketOcc,
        isHigh: bench.saisonHaute.includes(month),
      }
    })
  }, [isPremium, currentBenchmark, sejours, logementFilter, logements.length])

  // ─── PREMIUM : top 3 semaines de l'année (revenu max) ──────────────────
  const topWeeks = useMemo(() => {
    if (!isPremium) return null
    type Wk = { week: number; year: number; start: Date; end: Date; revenu: number; nuits: number }
    const map: Record<string, Wk> = {}
    sejours.forEach(s => {
      const arr = new Date(s.date_arrivee + 'T12:00:00')
      const dep = new Date(s.date_depart + 'T12:00:00')
      const fullDuration = daysBetween(arr, dep) || 1
      const pricePerNight = (s.montant ?? 0) / fullDuration
      const cursor = new Date(arr)
      while (cursor < dep) {
        const week = getISOWeek(cursor)
        const year = cursor.getFullYear()
        const key = `${year}-${week}`
        if (!map[key]) {
          const monday = mondayOfWeek(cursor)
          const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 7)
          map[key] = { week, year, start: monday, end: sunday, revenu: 0, nuits: 0 }
        }
        map[key].revenu += pricePerNight
        map[key].nuits += 1
        cursor.setDate(cursor.getDate() + 1)
      }
    })
    return Object.values(map).sort((a, b) => b.revenu - a.revenu).slice(0, 3)
  }, [isPremium, sejours])

  // ─── PREMIUM : cohort / repeat rate voyageurs ──────────────────────────
  const cohortStats = useMemo(() => {
    if (!isPremium || voyageurs.length === 0) return null
    // Compte les séjours par voyageur (uniquement séjours achevés)
    const byVoyageur: Record<string, number> = {}
    const now = new Date()
    sejours.forEach(s => {
      if (!s.voyageur_id) return
      const dep = new Date(s.date_depart + 'T12:00:00')
      if (dep > now) return // pas encore parti, on ne compte pas
      byVoyageur[s.voyageur_id] = (byVoyageur[s.voyageur_id] ?? 0) + 1
    })
    const totalUnique = Object.keys(byVoyageur).length
    const returning = Object.values(byVoyageur).filter(n => n >= 2).length
    const loyal = Object.values(byVoyageur).filter(n => n >= 3).length
    const repeatRate = totalUnique > 0 ? returning / totalUnique : 0
    const loyalRate = totalUnique > 0 ? loyal / totalUnique : 0
    return {
      totalUnique,
      returning,
      loyal,
      repeatRate,
      loyalRate,
      avgStaysPerGuest: totalUnique > 0
        ? Object.values(byVoyageur).reduce((s, n) => s + n, 0) / totalUnique
        : 0,
    }
  }, [isPremium, sejours, voyageurs.length])

  // ─── PREMIUM : élasticité prix (corrélation prix moyen ↔ occupation par mois) ──
  // Approche simple : compare l'occupation des mois "prix bas" vs "prix haut"
  // sur les 24 derniers mois pour donner une idée de sensibilité du marché.
  const priceElasticity = useMemo(() => {
    if (!isPremium || sejours.length < 6) return null
    const now = new Date()
    const start = new Date(now.getFullYear() - 2, now.getMonth(), 1)
    const monthDays = [31,28,31,30,31,30,31,31,30,31,30,31]
    const logementCount = logementFilter === 'all' ? Math.max(1, logements.length) : 1
    const months: Record<string, { adr: number; nuits: number; nuitsDispo: number; nuitsSum: number; revenuSum: number }> = {}
    sejours.forEach(s => {
      const arr = new Date(s.date_arrivee + 'T12:00:00')
      const dep = new Date(s.date_depart + 'T12:00:00')
      const overlap = clampInterval(arr, dep, start, now)
      if (!overlap) return
      const fullDuration = daysBetween(arr, dep) || 1
      const pricePerNight = (s.montant ?? 0) / fullDuration
      const cursor = new Date(overlap.s)
      while (cursor < overlap.e) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
        if (!months[key]) {
          const m = cursor.getMonth()
          months[key] = { adr: 0, nuits: 0, nuitsDispo: monthDays[m] * logementCount, nuitsSum: 0, revenuSum: 0 }
        }
        months[key].nuits += 1
        months[key].nuitsSum += 1
        months[key].revenuSum += pricePerNight
        cursor.setDate(cursor.getDate() + 1)
      }
    })
    const monthData = Object.values(months).map(m => ({
      adr: m.nuitsSum > 0 ? m.revenuSum / m.nuitsSum : 0,
      occupation: m.nuitsDispo > 0 ? m.nuits / m.nuitsDispo : 0,
    })).filter(m => m.adr > 0 && m.occupation > 0)

    if (monthData.length < 6) return null

    // Coupe en 2 : mois "prix bas" (sous la médiane) et "prix haut" (au-dessus)
    const sortedByAdr = [...monthData].sort((a, b) => a.adr - b.adr)
    const mid = Math.floor(sortedByAdr.length / 2)
    const lowPrice = sortedByAdr.slice(0, mid)
    const highPrice = sortedByAdr.slice(mid)
    const lowAvgAdr = lowPrice.reduce((s, m) => s + m.adr, 0) / Math.max(1, lowPrice.length)
    const highAvgAdr = highPrice.reduce((s, m) => s + m.adr, 0) / Math.max(1, highPrice.length)
    const lowAvgOcc = lowPrice.reduce((s, m) => s + m.occupation, 0) / Math.max(1, lowPrice.length)
    const highAvgOcc = highPrice.reduce((s, m) => s + m.occupation, 0) / Math.max(1, highPrice.length)

    // Élasticité approximative : Δ%occ / Δ%prix
    const deltaPrice = highAvgAdr > 0 ? (highAvgAdr - lowAvgAdr) / lowAvgAdr : 0
    const deltaOcc = lowAvgOcc > 0 ? (highAvgOcc - lowAvgOcc) / lowAvgOcc : 0
    const elasticity = deltaPrice !== 0 ? deltaOcc / deltaPrice : 0
    // RevPAR sur chaque cohorte (revenu / nuits dispo)
    const lowRevpar = lowAvgAdr * lowAvgOcc
    const highRevpar = highAvgAdr * highAvgOcc
    return {
      monthsAnalyzed: monthData.length,
      lowAvgAdr, highAvgAdr, lowAvgOcc, highAvgOcc,
      elasticity, lowRevpar, highRevpar,
      // Recommandation : si elasticity > -0.5 (peu sensible), augmenter le prix
      // Si elasticity < -1 (très sensible), envisager une baisse pour booster occupation
      reco: elasticity > -0.3
        ? 'Tes occupations résistent bien aux prix plus hauts. Tu peux probablement monter tes prix sans perdre en remplissage.'
        : elasticity < -0.8
        ? 'Ton marché est sensible au prix : une baisse contrôlée pourrait booster ton remplissage et ton RevPAR global.'
        : 'Élasticité équilibrée : ton pricing est calibré, continue à ajuster mois par mois.',
    }
  }, [isPremium, sejours, logementFilter, logements.length])

  // ─── PREMIUM : rentabilité nette (revenu YTD - commissions - charges) ──
  const netProfitability = useMemo(() => {
    if (!isPremium) return null
    const now = new Date()
    const yStart = new Date(now.getFullYear(), 0, 1)
    let revenuYtd = 0
    let commissionsYtd = 0
    sejours.forEach(s => {
      const arr = new Date(s.date_arrivee + 'T12:00:00')
      const dep = new Date(s.date_depart + 'T12:00:00')
      const overlap = clampInterval(arr, dep, yStart, now)
      if (!overlap) return
      const fullDuration = daysBetween(arr, dep) || 1
      const fraction = daysBetween(overlap.s, overlap.e) / fullDuration
      revenuYtd += (s.montant ?? 0) * fraction
      commissionsYtd += (s.commission_montant ?? 0) * fraction
    })
    let chargesYtd = 0
    let chargesYtdDeductibles = 0
    charges.forEach(c => {
      const d = new Date(c.date_charge + 'T12:00:00')
      if (d < yStart || d > now) return
      chargesYtd += c.montant
      if (c.deductible !== false) chargesYtdDeductibles += c.montant
    })
    const netAvantImpots = revenuYtd - commissionsYtd - chargesYtd
    const margeNette = revenuYtd > 0 ? netAvantImpots / revenuYtd : 0
    return {
      revenuYtd, commissionsYtd, chargesYtd, chargesYtdDeductibles,
      netAvantImpots, margeNette,
    }
  }, [isPremium, sejours, charges])

  // ─── insights auto enrichis ────────────────────────────────────────────
  const insights = useMemo(() => {
    const out: { kind: 'top' | 'low' | 'tip' | 'benchmark'; text: string }[] = []

    // Comparatif multi-logement (utile si > 1)
    if (logements.length > 1 && comparator.length > 0) {
      const top = comparator[0]
      if (top.revenu > 0) {
        out.push({ kind: 'top', text: `${top.nom} est ton top performer (${fmtPct(top.occupation)} occupation, ${fmtEur(top.revenu)})` })
      }
      const low = [...comparator].reverse().find(c => c.occupation < 0.4 && c.occupation > 0)
      if (low) {
        out.push({ kind: 'low', text: `${low.nom} est sous les 40 % d'occupation, considère baisser le prix ou lancer une promo` })
      }
    }

    // Benchmark régional vs occupation actuelle
    if (currentBenchmark?.bench && stats.occupation > 0) {
      const bench = currentBenchmark.bench
      const myOccPct = Math.round(stats.occupation * 100)
      const diff = myOccPct - bench.occupationAnnuellePct
      if (Math.abs(diff) >= 5) {
        const text = diff > 0
          ? `Bravo : ton occupation (${myOccPct} %) dépasse la moyenne ${bench.ville} (${bench.occupationAnnuellePct} %) de ${diff} pts`
          : `Tu es ${Math.abs(diff)} pts sous la moyenne ${bench.ville} (${bench.occupationAnnuellePct} %) — il y a une marge de remplissage`
        out.push({ kind: diff > 0 ? 'top' : 'low', text })
      }
      // Prix vs ADR local
      if (hotelKpis.adr > 0) {
        const priceDiff = Math.round(((hotelKpis.adr - bench.adrEur) / bench.adrEur) * 100)
        if (Math.abs(priceDiff) >= 15) {
          out.push({
            kind: 'benchmark',
            text: priceDiff > 0
              ? `Ton prix moyen (${fmtEur(hotelKpis.adr)}) est ${priceDiff} % au-dessus du marché ${bench.ville} (${fmtEur(bench.adrEur)}) — vérifie que tu ne te brides pas en occupation`
              : `Ton prix moyen (${fmtEur(hotelKpis.adr)}) est ${Math.abs(priceDiff)} % sous le marché ${bench.ville} (${fmtEur(bench.adrEur)}) — tu peux probablement le monter`,
          })
        }
      }
    }

    // Weekend premium actionnable
    if (hotelKpis.semaineAdr > 0 && hotelKpis.weekendAdr > 0) {
      const premPct = Math.round(hotelKpis.weekendPremiumPct * 100)
      if (premPct < 10 && hotelKpis.semaineAdr > 30) {
        out.push({
          kind: 'tip',
          text: `Tes weekends ne sont que ${premPct} % au-dessus de la semaine — la plupart des hôtes appliquent +20 à +40 %`,
        })
      } else if (premPct >= 30) {
        out.push({
          kind: 'top',
          text: `Tu valorises bien tes weekends : +${premPct} % vs semaine, c'est cohérent avec le marché`,
        })
      }
    }

    if (stats.dureeMoyenne > 0 && stats.dureeMoyenne < 3) {
      out.push({ kind: 'tip', text: `Durée moyenne de ${stats.dureeMoyenne.toFixed(1)} nuits : pense à optimiser tes frais de ménage` })
    }
    if (stats.anticipationMoyenne > 60) {
      out.push({ kind: 'tip', text: `Tes voyageurs réservent ${Math.round(stats.anticipationMoyenne)} jours en avance, ouvre tes calendriers plus tôt` })
    }
    if (stats.anticipationMoyenne > 0 && stats.anticipationMoyenne < 7) {
      out.push({ kind: 'tip', text: `Réservations très tardives (${Math.round(stats.anticipationMoyenne)} j) : pense à attirer plus de réservations anticipées (early bird -10 % à 90 j)` })
    }

    return out.slice(0, 5)
  }, [comparator, stats, currentBenchmark, hotelKpis, logements.length])

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
    const missLogement = logements.length === 0
    const missSejour = sejours.length === 0
    return (
      <div style={s.wrap}>
        <header style={s.header}>
          <div style={s.titleRow}>
            <ChartLineUp size={28} weight="duotone" color="var(--accent-text)" />
            <h1 style={s.title}>Performances</h1>
          </div>
          <p style={s.subtitle}>Pilote ton activité : taux d&apos;occupation, revenus, comparaison entre logements.</p>
        </header>
        <div style={s.emptyCard}>
          <Sparkle size={42} weight="duotone" color="var(--accent-text)" />
          <h2 style={s.emptyTitle}>Pas encore assez de données</h2>
          <p style={s.emptyText}>
            {missLogement && missSejour && 'Ajoute un logement puis crée un séjour (calendrier) ou un contrat signé pour commencer.'}
            {missLogement && !missSejour && 'Ajoute au moins un logement pour activer les statistiques par bien.'}
            {!missLogement && missSejour && 'Ton logement est prêt. Crée un séjour dans le calendrier ou envoie un contrat signé pour faire apparaître les KPIs.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={s.wrap} className="perf-root">
      {/* CSS print pour rapport PDF propre (Premium uniquement) :
          - masque la sidebar, le header global, les filtres, les teasers
          - garde les sections data en fond blanc, padding réduit
          - force les couleurs pour l'export */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; color: black !important; }
          .jm-sidebar, .jm-header-app, .cookie-banner, button { display: none !important; }
          .perf-root { padding: 0 !important; max-width: none !important; }
          section { page-break-inside: avoid; break-inside: avoid; box-shadow: none !important; border-color: #ddd !important; }
          h1, h2, h3, h4 { color: #111 !important; }
        }
      ` }} />

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
        {isPremium && (
          <button
            onClick={() => window.print()}
            style={{ ...s.exportBtn, background: 'var(--accent-bg)', borderColor: 'var(--accent-border)', color: 'var(--accent-text)' }}
            title="Ouvre la boîte d'impression : choisis 'Enregistrer en PDF' pour générer un rapport synthétique"
          >
            <Download size={16} weight="bold" />
            Rapport PDF
          </button>
        )}
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

      {/* ─── KPIs hôteliers : RevPAR, ADR, weekend premium ──────────── */}
      <section style={s.card}>
        <div style={s.cardHead}>
          <div>
            <h3 style={s.cardTitle}>Indicateurs hôteliers</h3>
            <p style={s.cardSub}>Les métriques standards utilisées par les pros de l'hébergement</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <MiniKpi
            label="RevPAR"
            hint="Revenu par nuit disponible"
            value={fmtEur(hotelKpis.revpar)}
            sub={`sur ${hotelKpis.nuitsDispo} nuits dispo`}
          />
          <MiniKpi
            label="ADR"
            hint="Average Daily Rate = prix moyen par nuit louée"
            value={fmtEur(hotelKpis.adr)}
            sub="prix moyen par nuit"
          />
          <MiniKpi
            label="Prix weekend"
            hint="Moyenne ven + sam"
            value={hotelKpis.weekendAdr > 0 ? fmtEur(hotelKpis.weekendAdr) : '—'}
            sub={hotelKpis.semaineAdr > 0 && hotelKpis.weekendAdr > 0
              ? `${hotelKpis.weekendPremiumPct >= 0 ? '+' : ''}${Math.round(hotelKpis.weekendPremiumPct * 100)} % vs semaine`
              : 'pas assez de data'}
            subColor={hotelKpis.weekendPremiumPct >= 0.2 ? 'var(--success-1)' : hotelKpis.weekendPremiumPct >= 0.1 ? '#FACC15' : 'var(--danger)'}
          />
          <MiniKpi
            label="Prix semaine"
            hint="Moyenne lun à jeu"
            value={hotelKpis.semaineAdr > 0 ? fmtEur(hotelKpis.semaineAdr) : '—'}
            sub="lun → jeu"
          />
          <MiniKpi
            label="Potentiel 100%"
            hint="Si tu étais occupé toute l'année à ton ADR actuel"
            value={fmtEur(hotelKpis.potentielAnnuel)}
            sub="365 j × ADR"
          />
        </div>
      </section>

      {/* ─── Benchmark régional (depuis ville détectée) ─────────────── */}
      {currentBenchmark?.bench && (
        <section style={{ ...s.card, background: 'linear-gradient(135deg, var(--accent-bg) 0%, var(--surface) 100%)' }}>
          <div style={s.cardHead}>
            <div>
              <h3 style={s.cardTitle}>
                Benchmark marché &middot; {currentBenchmark.bench.ville}
                {currentBenchmark.bench.tier === 'national' && <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 400 }}> · moyenne pays (ville non listée)</span>}
              </h3>
              <p style={s.cardSub}>Comparatif indicatif vs marché LCD local — source : {currentBenchmark.bench.source}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <BenchRow
              label="Taux d'occupation moyen"
              mineValue={fmtPct(stats.occupation)}
              mineNum={stats.occupation * 100}
              marketValue={`${currentBenchmark.bench.occupationAnnuellePct} %`}
              marketNum={currentBenchmark.bench.occupationAnnuellePct}
              betterIfHigher
            />
            <BenchRow
              label="Prix moyen / nuit (ADR)"
              mineValue={fmtEur(hotelKpis.adr)}
              mineNum={hotelKpis.adr}
              marketValue={fmtEur(currentBenchmark.bench.adrEur)}
              marketNum={currentBenchmark.bench.adrEur}
              betterIfHigher
              tooltipMarket="Prix médian observé sur le marché local (LCD/Alojamento Local)"
            />
            <BenchRow
              label="RevPAR annuel"
              mineValue={fmtEur(hotelKpis.revpar * 365)}
              mineNum={hotelKpis.revpar * 365}
              marketValue={fmtEur(currentBenchmark.bench.revparAnnuelEur)}
              marketNum={currentBenchmark.bench.revparAnnuelEur}
              betterIfHigher
              tooltipMarket="Revenu théorique annuel par bien selon le marché"
            />
          </div>
          {currentBenchmark.bench.saisonHaute.length > 0 && (
            <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '14px', marginBottom: 0 }}>
              <strong style={{ color: 'var(--text-2)' }}>Haute saison locale :</strong> {currentBenchmark.bench.saisonHaute.map(m => MONTH_NAMES[m - 1]).join(', ')}.
              Aligne tes prix sur ces mois.
            </p>
          )}
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0, fontStyle: 'italic' }}>
            Données indicatives agrégées depuis sources publiques (INSEE, DGE, INE, observatoires régionaux). À titre de repère, pas de référence absolue. Mise à jour annuelle.
          </p>
        </section>
      )}

      {/* ─── Projection annuelle vs objectif ─────────────────────────── */}
      {projection && objectifAnnuel && (
        <section style={s.card}>
          <div style={s.cardHead}>
            <div>
              <h3 style={s.cardTitle}>Projection {new Date().getFullYear()} vs objectif</h3>
              <p style={s.cardSub}>Extrapolation linéaire du CA actuel sur la fin d'année</p>
            </div>
            <span style={{
              fontSize: '12px', fontWeight: 600,
              padding: '4px 10px', borderRadius: '999px',
              background: projection.projetePct >= 100 ? 'rgba(52,211,153,0.12)' : projection.projetePct >= 70 ? 'var(--accent-bg)' : 'rgba(245,158,11,0.12)',
              color: projection.projetePct >= 100 ? 'var(--success-1)' : projection.projetePct >= 70 ? 'var(--accent-text)' : '#F59E0B',
              border: `1px solid ${projection.projetePct >= 100 ? 'rgba(52,211,153,0.30)' : projection.projetePct >= 70 ? 'var(--accent-border)' : 'rgba(245,158,11,0.30)'}`,
            }}>
              {Math.round(projection.projetePct)}% de l'objectif
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <MiniKpi label="CA réalisé YTD"     value={fmtEur(projection.ytdRevenu)} sub={`au ${projection.daysElapsed}e jour de l'année`} />
            <MiniKpi label="Projection fin d'année" value={fmtEur(projection.projete)} sub="extrapolation linéaire" />
            <MiniKpi label="Objectif annuel"    value={fmtEur(objectifAnnuel)} sub="défini dans /revenus" />
            <MiniKpi label="Reste à faire"      value={fmtEur(Math.max(0, objectifAnnuel - projection.ytdRevenu))} sub="d'ici fin d'année" />
          </div>
          {/* Jauge */}
          <div style={{ width: '100%', height: '10px', background: 'var(--surface-2)', borderRadius: '999px', overflow: 'hidden', position: 'relative' as const }}>
            <div style={{
              width: `${Math.min(100, projection.objectifPct)}%`,
              height: '100%',
              background: projection.objectifPct >= 100 ? 'var(--success-1)' : 'var(--accent-text)',
              transition: 'width 0.4s var(--ease-smooth, ease)',
            }} />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '8px', marginBottom: 0 }}>
            {projection.projetePct >= 100
              ? `🎉 À ce rythme, tu dépasses ton objectif de ${fmtEur(projection.projete - objectifAnnuel)}.`
              : projection.projetePct >= 80
              ? `Tu es en bonne voie. Pour atteindre ton objectif, il te manque ~${fmtEur(objectifAnnuel - projection.projete)} sur l'année.`
              : `À ce rythme, tu seras à ${Math.round(projection.projetePct)} % de ton objectif. Il faut booster d'environ ${fmtEur(objectifAnnuel - projection.projete)} sur le reste de l'année.`}
          </p>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          BLOCS ANALYSES AVANCÉES — réservés au plan Standard / Driing
          (carte teaser unlock pour les comptes Découverte)
         ═══════════════════════════════════════════════════════════════════ */}

      {/* ─── Comparatif Year-over-Year ──────────────────────────────────── */}
      {isPremium && yoyStats ? (
        <section style={s.card}>
          <div style={s.cardHead}>
            <div>
              <h3 style={s.cardTitle}>Année {yoyStats.thisYear} vs {yoyStats.lastYear} (même période)</h3>
              <p style={s.cardSub}>Compare ton activité YTD à la même période de l'année dernière</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <YoYCard label="Revenu" current={fmtEur(yoyStats.thisYearRevenu)} previous={fmtEur(yoyStats.lastYearRevenu)} delta={yoyStats.revenuDelta} />
            <YoYCard label="Nuits réservées" current={String(yoyStats.thisYearNuits)} previous={String(yoyStats.lastYearNuits)} delta={yoyStats.nuitsDelta} />
            <YoYCard label="Séjours" current={String(yoyStats.thisYearSejours)} previous={String(yoyStats.lastYearSejours)} delta={yoyStats.sejoursDelta} />
          </div>
        </section>
      ) : !isPremium ? (
        <PremiumLock
          title="Comparatif année par année"
          description="Compare ton activité année par année sur la même période. Sache si tu progresses ou si tu décroches vs N-1."
          bullets={[
            'Delta % en couleur sur revenu, nuits, séjours',
            'Compare à date égale (équitable, pas année pleine vs année partielle)',
            'Repère immédiatement les périodes de décrochage',
          ]}
        />
      ) : null}

      {/* ─── Heatmap jour de semaine ────────────────────────────────────── */}
      {isPremium && dowHeatmap ? (
        <section style={s.card}>
          <div style={s.cardHead}>
            <div>
              <h3 style={s.cardTitle}>Performance par jour de semaine</h3>
              <p style={s.cardSub}>Combien de nuits réservées chaque jour de la semaine sur la période — pour ajuster tes prix lun→dim</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {dowHeatmap.map((d, i) => (
              <div key={i} style={{
                padding: '14px 10px', borderRadius: '10px',
                background: `rgba(52, 211, 153, ${0.08 + 0.55 * d.intensity})`,
                border: '1px solid var(--border)',
                textAlign: 'center' as const,
                color: d.intensity > 0.6 ? '#fff' : 'var(--text)',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, opacity: 0.85, marginBottom: '4px' }}>{d.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif' }}>{d.nuits}</div>
                <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>{d.adr > 0 ? fmtEur(d.adr) : '—'}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '12px', marginBottom: 0 }}>
            Plus la case est verte foncée, plus tu loues ce jour-là. Sous chaque case : ADR moyen ce jour.
          </p>
        </section>
      ) : !isPremium ? (
        <PremiumLock
          title="Heatmap jour de semaine"
          description="Visualise instantanément quels jours rapportent le plus — du lundi au dimanche. Indispensable pour ajuster tes prix weekend/semaine."
          bullets={[
            'Code couleur d\'intensité par jour (vert plus ou moins foncé)',
            'Nombre de nuits + ADR moyen par jour',
            'Décision rapide : monter le prix le jour qui se remplit toujours',
          ]}
        />
      ) : null}

      {/* ─── Recommandations de prix par mois (basées marché + ton historique) */}
      {isPremium && monthlyPricingReco && currentBenchmark?.bench ? (
        <section style={s.card}>
          <div style={s.cardHead}>
            <div>
              <h3 style={s.cardTitle}>Recommandation de prix par mois</h3>
              <p style={s.cardSub}>
                Basé sur ton ADR actuel ({fmtEur(hotelKpis.adr > 0 ? hotelKpis.adr : currentBenchmark.bench.adrEur)}) et la saisonnalité {currentBenchmark.bench.ville}
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '6px' }}>
            {monthlyPricingReco.map(m => (
              <div key={m.month} style={{
                padding: '10px 8px', borderRadius: '10px', textAlign: 'center' as const,
                background: m.isHigh ? 'rgba(52,211,153,0.10)' : m.isLow ? 'rgba(245,158,11,0.07)' : 'var(--bg-2)',
                border: `1px solid ${m.isHigh ? 'rgba(52,211,153,0.30)' : m.isLow ? 'rgba(245,158,11,0.20)' : 'var(--border)'}`,
              }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.3px', marginBottom: '4px' }}>
                  {m.label.slice(0, 3)}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif', color: m.isHigh ? 'var(--success-1)' : m.isLow ? '#F59E0B' : 'var(--text)' }}>
                  {fmtEur(m.recommandedPrice)}
                </div>
                {m.isHigh && <div style={{ fontSize: '9px', color: 'var(--success-1)', marginTop: '2px', fontWeight: 600 }}>HAUTE</div>}
                {m.isLow && <div style={{ fontSize: '9px', color: '#F59E0B', marginTop: '2px', fontWeight: 600 }}>BASSE</div>}
              </div>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', marginBottom: 0, fontStyle: 'italic' }}>
            Coefficients indicatifs : haute saison ×1.25, basse saison ×0.85, neutre ×1.0. Source saisonnalité : {currentBenchmark.bench.source}.
          </p>
        </section>
      ) : !isPremium ? (
        <PremiumLock
          title="Recommandation de prix par mois"
          description="Combien dois-tu facturer en juillet ? En février ? Le moteur croise ton ADR actuel avec la saisonnalité réelle de ta ville pour te donner un prix recommandé pour chaque mois de l'année."
          bullets={[
            '12 prix recommandés mois par mois',
            'Différencie haute / basse saison spécifique à TA ville',
            'Évite de laisser des euros sur la table en haute saison',
          ]}
        />
      ) : null}

      {/* ─── Distance aux plafonds légaux (FR ou PT selon logement) ─────── */}
      {isPremium && legalLimits && legalLimits.limits.length > 0 ? (
        <section style={s.card}>
          <div style={s.cardHead}>
            <div>
              <h3 style={s.cardTitle}>Distance aux plafonds légaux {legalLimits.currentPays === 'PT' ? '🇵🇹' : '🇫🇷'}</h3>
              <p style={s.cardSub}>Anticipe les bascules fiscales et réglementaires avant qu'elles arrivent</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
            {legalLimits.limits.map((l, i) => {
              const pct = Math.min(100, (l.current / l.max) * 100)
              const barColor = l.severity === 'danger' ? 'var(--danger)' : l.severity === 'warn' ? '#F59E0B' : 'var(--success-1)'
              return (
                <div key={i} style={{ padding: '14px 16px', borderRadius: '10px', background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' as const, gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{l.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: barColor, fontFamily: 'var(--font-fraunces), serif' }}>
                      {l.unit === '€' ? fmtEur(l.current) : `${l.current} ${l.unit}`} / {l.unit === '€' ? fmtEur(l.max) : `${l.max} ${l.unit}`}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--surface-2)', borderRadius: '999px', overflow: 'hidden', marginBottom: '6px' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 0.4s var(--ease-smooth, ease)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{Math.round(pct)} %</span>
                    {l.severity === 'danger' && <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--danger)' }}>⚠️ Plafond proche</span>}
                    {l.severity === 'warn' && <span style={{ fontSize: '11px', fontWeight: 600, color: '#F59E0B' }}>À surveiller</span>}
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-2)', marginTop: '8px', marginBottom: 0, lineHeight: 1.5 }}>{l.note}</p>
                </div>
              )
            })}
          </div>
        </section>
      ) : !isPremium ? (
        <PremiumLock
          title="Distance aux plafonds légaux"
          description="Ne te fais pas surprendre par une bascule fiscale ou réglementaire. Suivi en temps réel des plafonds qui te concernent (FR : 120 j résidence principale, 15 000 €, 23 000 € LMP — PT : 15 000 € IVA, 200 000 € contabilidade organizada)."
          bullets={[
            'Jauges visuelles avec seuils de couleur (vert / orange / rouge)',
            'Adaptation automatique selon le pays de ton logement',
            'Note explicative sur la conséquence de chaque dépassement',
          ]}
        />
      ) : null}

      {/* ─── Sources réservation par % REVENU (Premium) ───────────────── */}
      {isPremium && sourcesByRevenue && sourcesByRevenue.length > 0 ? (
        <section style={s.card}>
          <div style={s.cardHead}>
            <div>
              <h3 style={s.cardTitle}>Sources de réservation — par % de revenu</h3>
              <p style={s.cardSub}>Ce qui rapporte réellement, pas juste ce qui amène le plus de voyageurs</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
            {sourcesByRevenue.map(src => (
              <div key={src.slug} style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: src.color }} />
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{src.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)' }}>{fmtEur(src.revenu)}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: src.color }}>{Math.round(src.shareRevenu * 100)} %</span>
                  </div>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--surface-2)', borderRadius: '999px', overflow: 'hidden', marginBottom: '6px' }}>
                  <div style={{ width: `${src.shareRevenu * 100}%`, height: '100%', background: src.color }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
                  <span>{src.nuits} nuits</span>
                  <span>{src.voyageurs} voyageur{src.voyageurs > 1 ? 's' : ''}</span>
                  <span>ADR : {fmtEur(src.adr)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : !isPremium ? (
        <PremiumLock
          title="Sources de réservation — par % de revenu"
          description="Pas juste le nombre de voyageurs, mais combien chaque canal te rapporte vraiment. Indispensable pour savoir où investir tes efforts d'acquisition."
          bullets={[
            'Part du CA réel par canal (Airbnb, Booking, direct, etc.)',
            'ADR par canal — souvent les directs rapportent plus par nuit',
            'Découvre quel canal est rentable en revenu (pas qu\'en volume)',
          ]}
        />
      ) : null}

      {/* ─── Saisonnalité personnelle vs marché (Premium) ─────────────── */}
      {isPremium && personalVsMarketSeason && currentBenchmark?.bench ? (
        <section style={s.card}>
          <div style={s.cardHead}>
            <div>
              <h3 style={s.cardTitle}>Ta saisonnalité vs marché {currentBenchmark.bench.ville}</h3>
              <p style={s.cardSub}>Ton taux d'occupation mois par mois (12 derniers mois) confronté à la saisonnalité locale attendue</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px' }}>
            {personalVsMarketSeason.map(m => {
              const personalH = Math.max(2, m.personalOcc * 60)
              const marketH = Math.max(2, m.marketOcc * 60)
              return (
                <div key={m.month} style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '60px' }}>
                    <div title={`Toi: ${Math.round(m.personalOcc * 100)} %`} style={{
                      width: '14px', height: `${personalH}px`,
                      background: m.delta >= 0 ? 'var(--success-1)' : '#F59E0B',
                      borderRadius: '3px 3px 0 0',
                    }} />
                    <div title={`Marché: ${Math.round(m.marketOcc * 100)} %`} style={{
                      width: '14px', height: `${marketH}px`,
                      background: 'rgba(160, 160, 160, 0.45)',
                      borderRadius: '3px 3px 0 0',
                    }} />
                  </div>
                  <span style={{ fontSize: '10px', color: m.isHigh ? 'var(--accent-text)' : 'var(--text-3)', fontWeight: m.isHigh ? 700 : 400 }}>{m.label}</span>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '11.5px', color: 'var(--text-3)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', background: 'var(--success-1)', borderRadius: '2px' }} /> Toi (au-dessus du marché)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', background: '#F59E0B', borderRadius: '2px' }} /> Toi (en dessous)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', background: 'rgba(160,160,160,0.5)', borderRadius: '2px' }} /> Marché attendu
            </span>
          </div>
        </section>
      ) : !isPremium ? (
        <PremiumLock
          title="Saisonnalité personnelle vs marché"
          description="Vois en un coup d'œil quels mois de l'année tu surperformes ou tu décroches par rapport à ta ville. Identifie tes vraies forces saisonnières."
          bullets={[
            'Graphique mois par mois Toi vs Marché',
            'Repère les mois où tu peux gagner en occupation',
            'Confirme tes mois forts pour pousser tes prix',
          ]}
        />
      ) : null}

      {/* ─── Top 3 semaines de l'année (Premium) ──────────────────────── */}
      {isPremium && topWeeks && topWeeks.length > 0 ? (
        <section style={s.card}>
          <div style={s.cardHead}>
            <div>
              <h3 style={s.cardTitle}>Tes 3 meilleures semaines</h3>
              <p style={s.cardSub}>Identifie les semaines à forte demande pour les rendre récurrentes et augmenter tes prix au prochain cycle</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {topWeeks.map((w, i) => (
              <div key={`${w.year}-${w.week}`} style={{
                padding: '16px 18px', borderRadius: '12px',
                background: i === 0 ? 'rgba(52,211,153,0.10)' : 'var(--bg-2)',
                border: `1px solid ${i === 0 ? 'rgba(52,211,153,0.30)' : 'var(--border)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 700,
                    padding: '2px 8px', borderRadius: '999px',
                    background: i === 0 ? 'var(--success-1)' : 'var(--surface-2)',
                    color: i === 0 ? 'var(--bg)' : 'var(--text-2)',
                  }}>#{i + 1}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>Semaine {w.week} · {w.year}</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)', marginBottom: '4px' }}>
                  {fmtEur(w.revenu)}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>
                  {fmtDateRange(w.start, w.end)} · {w.nuits} nuits
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '12px', marginBottom: 0, fontStyle: 'italic' }}>
            💡 Ces semaines reviennent souvent chaque année (vacances, événements locaux). Bloque-les sur ton calendrier pour les promouvoir au bon moment.
          </p>
        </section>
      ) : !isPremium ? (
        <PremiumLock
          title="Tes 3 meilleures semaines"
          description="Identifie automatiquement les 3 semaines qui te rapportent le plus dans l'année. Aligne tes prix et anticipe l'année suivante."
          bullets={[
            'Top 3 semaines par revenu généré',
            'Dates exactes + nb nuits + revenu total',
            'Permet d\'aligner ta stratégie sur les pics locaux',
          ]}
        />
      ) : null}

      {/* ─── Repeat / Cohort voyageurs (Premium) ──────────────────────── */}
      {isPremium && cohortStats && cohortStats.totalUnique > 0 ? (
        <section style={s.card}>
          <div style={s.cardHead}>
            <div>
              <h3 style={s.cardTitle}>Fidélisation voyageurs</h3>
              <p style={s.cardSub}>
                Combien de tes voyageurs sont revenus chez toi (séjours achevés uniquement). C'est le meilleur signal de satisfaction et de revenu récurrent.
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <MiniKpi label="Voyageurs uniques" value={String(cohortStats.totalUnique)} sub="ayant séjourné" />
            <MiniKpi label="Voyageurs revenus" value={String(cohortStats.returning)} sub="2 séjours ou +" subColor={cohortStats.repeatRate >= 0.15 ? 'var(--success-1)' : '#F59E0B'} />
            <MiniKpi label="Taux de retour" value={fmtPct(cohortStats.repeatRate)} sub="% des uniques" subColor={cohortStats.repeatRate >= 0.15 ? 'var(--success-1)' : '#F59E0B'} />
            <MiniKpi label="Voyageurs fidèles" value={String(cohortStats.loyal)} sub="3 séjours ou +" />
            <MiniKpi label="Séjours / voyageur" value={cohortStats.avgStaysPerGuest.toFixed(2)} sub="moyenne" />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '12px', marginBottom: 0 }}>
            {cohortStats.repeatRate >= 0.20
              ? `🎉 Excellent taux de retour (${Math.round(cohortStats.repeatRate * 100)} %). Ta base voyageurs fidèles est ton meilleur levier de revenus directs.`
              : cohortStats.repeatRate >= 0.10
              ? `Bon taux de retour. Mets en place un message post-séjour ciblé sur les fidèles pour booster encore.`
              : `Taux de retour faible. Pense à un message 6 mois après le départ avec offre fidélité (-10 % par exemple) pour les inciter à revenir.`}
          </p>
        </section>
      ) : !isPremium ? (
        <PremiumLock
          title="Fidélisation voyageurs"
          description="Le repeat rate est le meilleur indicateur de satisfaction. Identifie tes voyageurs fidèles et mesure ta capacité à les faire revenir."
          bullets={[
            'Taux de retour (voyageurs avec 2+ séjours)',
            'Voyageurs fidèles (3+ séjours)',
            'Moyenne séjours / voyageur unique',
          ]}
        />
      ) : null}

      {/* ─── Élasticité prix (Premium) ─────────────────────────────────── */}
      {isPremium && priceElasticity ? (
        <section style={s.card}>
          <div style={s.cardHead}>
            <div>
              <h3 style={s.cardTitle}>Sensibilité prix (élasticité)</h3>
              <p style={s.cardSub}>
                Compare ton occupation sur les mois "prix bas" vs "prix haut" pour évaluer la sensibilité de ton marché au prix.
                Analyse sur {priceElasticity.monthsAnalyzed} mois.
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.20)' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase' as const, letterSpacing: '0.3px', marginBottom: '8px' }}>Mois prix bas</div>
              <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)' }}>{fmtEur(priceElasticity.lowAvgAdr)} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-3)' }}>ADR</span></div>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>{fmtPct(priceElasticity.lowAvgOcc)} occupation · RevPAR {fmtEur(priceElasticity.lowRevpar)}</div>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.20)' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--success-1)', textTransform: 'uppercase' as const, letterSpacing: '0.3px', marginBottom: '8px' }}>Mois prix haut</div>
              <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)' }}>{fmtEur(priceElasticity.highAvgAdr)} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-3)' }}>ADR</span></div>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>{fmtPct(priceElasticity.highAvgOcc)} occupation · RevPAR {fmtEur(priceElasticity.highRevpar)}</div>
            </div>
          </div>
          <div style={{
            padding: '12px 16px', borderRadius: '10px',
            background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
            fontSize: '13px', color: 'var(--accent-text)', lineHeight: 1.55,
          }}>
            <strong>💡 Recommandation :</strong> {priceElasticity.reco}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0, fontStyle: 'italic' }}>
            Élasticité approximative : {priceElasticity.elasticity.toFixed(2)} (négatif = hausse de prix réduit l'occupation).
            Analyse indicative, le marché évolue avec la saison, la concurrence et les événements locaux.
          </p>
        </section>
      ) : !isPremium ? (
        <PremiumLock
          title="Sensibilité prix (élasticité)"
          description="Découvre comment ton marché réagit à tes variations de prix. Pour savoir si tu peux monter ou si tu dois baisser pour optimiser ton RevPAR global."
          bullets={[
            'Compare ADR + occupation des mois prix bas vs prix haut',
            'Recommandation auto : monter, baisser ou stabiliser',
            'Permet de prendre des décisions de pricing data-driven',
          ]}
        />
      ) : null}

      {/* ─── Rentabilité nette YTD (Premium) ──────────────────────────── */}
      {isPremium && netProfitability ? (
        <section style={s.card}>
          <div style={s.cardHead}>
            <div>
              <h3 style={s.cardTitle}>Rentabilité nette {new Date().getFullYear()}</h3>
              <p style={s.cardSub}>Revenu brut − commissions OTA − charges saisies dans /revenus</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <MiniKpi label="Revenu brut YTD"       value={fmtEur(netProfitability.revenuYtd)}        sub="depuis le 1er janvier" />
            <MiniKpi label="Commissions OTA"       value={fmtEur(netProfitability.commissionsYtd)}   sub="prélevées sur ton CA" />
            <MiniKpi label="Charges saisies"       value={fmtEur(netProfitability.chargesYtd)}       sub={`dont ${fmtEur(netProfitability.chargesYtdDeductibles)} déductibles`} />
            <MiniKpi label="Net avant impôts"      value={fmtEur(netProfitability.netAvantImpots)}    sub={`marge ${fmtPct(netProfitability.margeNette)}`} subColor={netProfitability.margeNette >= 0.5 ? 'var(--success-1)' : netProfitability.margeNette >= 0.3 ? '#F59E0B' : 'var(--danger)'} />
          </div>
          <div style={{
            display: 'flex', height: '24px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)',
          }}>
            <div title="Net dans ta poche" style={{ width: `${Math.max(0, netProfitability.margeNette) * 100}%`, background: 'var(--success-1)' }} />
            <div title="Commissions OTA" style={{
              width: `${netProfitability.revenuYtd > 0 ? (netProfitability.commissionsYtd / netProfitability.revenuYtd) * 100 : 0}%`,
              background: '#F59E0B',
            }} />
            <div title="Charges" style={{
              width: `${netProfitability.revenuYtd > 0 ? (netProfitability.chargesYtd / netProfitability.revenuYtd) * 100 : 0}%`,
              background: 'var(--danger)',
            }} />
          </div>
          <div style={{ display: 'flex', gap: '14px', marginTop: '10px', fontSize: '11.5px', color: 'var(--text-3)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', background: 'var(--success-1)', borderRadius: '2px' }} /> Net
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', background: '#F59E0B', borderRadius: '2px' }} /> Commissions
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', background: 'var(--danger)', borderRadius: '2px' }} /> Charges
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', marginBottom: 0, fontStyle: 'italic' }}>
            Charges et commissions à saisir dans <a href="/dashboard/revenus" style={{ color: 'var(--accent-text)' }}>/dashboard/revenus</a> pour précision maximale.
          </p>
        </section>
      ) : !isPremium ? (
        <PremiumLock
          title="Rentabilité nette"
          description="Combien tu touches vraiment, après commissions OTA et charges. La métrique la plus importante mais souvent ignorée."
          bullets={[
            'Revenu brut − commissions OTA − charges saisies',
            'Marge nette en % du CA',
            'Barre visuelle de répartition (net / commissions / charges)',
          ]}
        />
      ) : null}

      {/* ─── Comparateur anonymisé "même profil dans ta ville" (à venir) ── */}
      {isPremium ? (
        <section style={{ ...s.card, background: 'linear-gradient(135deg, var(--surface) 0%, var(--accent-bg) 100%)' }}>
          <div style={s.cardHead}>
            <div>
              <h3 style={s.cardTitle}>Comparateur "même profil"</h3>
              <p style={s.cardSub}>Te comparer aux autres hôtes Driing ayant un bien similaire dans ta ville (anonyme)</p>
            </div>
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '999px',
              background: 'rgba(167,139,250,0.15)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.35)',
            }}>
              À venir
            </span>
          </div>
          <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'var(--bg-2)', border: '1px dashed var(--border)', fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text)' }}>Pourquoi pas encore disponible :</strong> pour garantir l'anonymat (charte RGPD),
            on a besoin d'au moins <strong>50 hôtes</strong> dans ta ville avec un type de bien comparable. Le comparateur s'active automatiquement
            dès qu'on atteint ce seuil. Tu seras notifié.
          </div>
        </section>
      ) : null}

      {/* ─── Insights ───────────────────────────────────────────────── */}
      {insights.length > 0 && (
        <div style={s.insights}>
          {insights.map((ins, i) => (
            <div
              key={i}
              style={{
                ...s.insight,
                borderLeftColor:
                  ins.kind === 'top' ? 'var(--success-1)'
                  : ins.kind === 'low' ? '#F59E0B'
                  : ins.kind === 'benchmark' ? '#A78BFA'
                  : 'var(--accent-text)',
              }}
            >
              {ins.kind === 'top' && <Trophy size={18} weight="fill" color="#34D399" />}
              {ins.kind === 'low' && <Warning size={18} weight="fill" color="#F59E0B" />}
              {ins.kind === 'tip' && <Sparkle size={18} weight="fill" color="var(--accent-text)" />}
              {ins.kind === 'benchmark' && <Sparkle size={18} weight="fill" color="#A78BFA" />}
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
            color: m.occupation >= 0.7 ? 'var(--success-1)' : m.occupation >= 0.4 ? '#FACC15' : 'var(--danger)',
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
                const occColor = c.occupation >= 0.7 ? 'var(--success-1)'
                  : c.occupation >= 0.4 ? '#FACC15' : 'var(--danger)'
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

const MONTH_NAMES = ['jan','fév','mar','avr','mai','juin','juil','aoû','sep','oct','nov','déc']
const MONTH_NAMES_FULL = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

// ─── YoY Card (comparatif année par année) ───────────────────────────────
function YoYCard({ label, current, previous, delta }: {
  label: string; current: string; previous: string; delta: number | null
}) {
  const isUp = delta !== null && delta > 0.02
  const isDown = delta !== null && delta < -0.02
  return (
    <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.3px', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)' }}>{current}</span>
        {delta !== null && (
          <span style={{
            fontSize: '12px', fontWeight: 700,
            padding: '3px 8px', borderRadius: '999px',
            background: isUp ? 'rgba(52,211,153,0.12)' : isDown ? 'rgba(248,113,113,0.12)' : 'var(--surface-2)',
            color: isUp ? 'var(--success-1)' : isDown ? 'var(--danger)' : 'var(--text-muted)',
            border: `1px solid ${isUp ? 'rgba(52,211,153,0.30)' : isDown ? 'rgba(248,113,113,0.30)' : 'var(--border)'}`,
          }}>
            {isUp ? '▲' : isDown ? '▼' : '='} {delta !== null ? Math.abs(Math.round(delta * 100)) : 0} %
          </span>
        )}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>
        N-1 même période : {previous}
      </div>
    </div>
  )
}

// ─── Mini KPI (compact, sans icône, pour les blocs hôteliers/projection) ─
function MiniKpi({ label, hint, value, sub, subColor }: {
  label: string
  hint?: string
  value: string
  sub?: string
  subColor?: string
}) {
  return (
    <div
      title={hint}
      style={{
        padding: '12px 14px', borderRadius: '10px',
        background: 'var(--bg-2)', border: '1px solid var(--border)',
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.3px', textTransform: 'uppercase' as const, marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)', lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '11px', color: subColor ?? 'var(--text-3)', marginTop: '4px', fontWeight: subColor ? 600 : 400 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

// ─── Bench row (ta valeur vs marché, avec delta coloré) ──────────────────
function BenchRow({ label, mineValue, mineNum, marketValue, marketNum, betterIfHigher, tooltipMarket }: {
  label: string
  mineValue: string
  mineNum: number
  marketValue: string
  marketNum: number
  betterIfHigher: boolean
  tooltipMarket?: string
}) {
  const diff = mineNum - marketNum
  const isPositive = betterIfHigher ? diff > 0 : diff < 0
  const deltaPct = marketNum > 0 ? Math.round((diff / marketNum) * 100) : 0
  return (
    <div style={{
      padding: '14px 16px', borderRadius: '10px',
      background: 'var(--bg-2)', border: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.3px', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Toi</span>
        <span style={{ fontSize: '17px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)' }}>{mineValue}</span>
      </div>
      <div title={tooltipMarket} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Marché</span>
        <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-2)' }}>{marketValue}</span>
      </div>
      {Math.abs(deltaPct) >= 2 && (
        <div style={{
          marginTop: '10px', fontSize: '11px', fontWeight: 600,
          color: isPositive ? 'var(--success-1)' : '#F59E0B',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          {isPositive ? '▲' : '▼'} {Math.abs(deltaPct)} % {isPositive ? 'au-dessus' : 'en dessous'}
        </div>
      )}
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
  const deltaColor = isUp ? 'var(--success-1)' : isDown ? 'var(--danger)' : 'var(--text-3)'
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
const DONUT_COLORS = ['#FFD56B', 'var(--success-1)', '#7EB8F7', '#A78BFA', 'var(--danger)', '#FB923C', '#22D3EE', '#F472B6']

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
    borderRadius: 'var(--r-lg)',
    padding: 'var(--s-4) var(--s-5)',
    display: 'flex', alignItems: 'flex-start', gap: 'var(--s-4)',
    transition: 'border-color var(--d-base) var(--ease-smooth), box-shadow var(--d-base) var(--ease-smooth), transform var(--d-base) var(--ease-smooth)',
  },
  kpiIcon: {
    width: 44, height: 44, borderRadius: 'var(--r-md)',
    background: 'var(--surface-2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    transition: 'transform var(--d-base) var(--ease-spring)',
  },
  kpiLabel: {
    fontSize: 'var(--t-xs)', color: 'var(--text-muted)',
    textTransform: 'uppercase' as const, letterSpacing: '0.3px',
    marginBottom: 'var(--s-1)', fontWeight: 600,
  },
  kpiValue: {
    fontSize: 'var(--t-2xl)', fontWeight: 700,
    lineHeight: 'var(--lh-tight)',
    fontFamily: 'var(--font-fraunces), serif',
    fontVariantNumeric: 'tabular-nums' as const,
    letterSpacing: 'var(--ls-tight)',
  },
  kpiDelta: { fontSize: 'var(--t-xs)', marginTop: 'var(--s-2)', display: 'inline-flex', alignItems: 'center', gap: 'var(--s-1)' },

  insights: {
    display: 'flex', flexDirection: 'column' as const, gap: 'var(--s-2)',
  },
  insight: {
    display: 'flex', alignItems: 'center', gap: 'var(--s-3)',
    padding: 'var(--s-3) var(--s-4)',
    background: 'var(--surface)',
    borderLeft: '3px solid var(--accent-text)',
    borderRadius: 'var(--r-md)',
    fontSize: 'var(--t-sm)', color: 'var(--text)',
    lineHeight: 'var(--lh-base)',
  },

  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-xl)',
    padding: 'var(--s-5) var(--s-5)',
    transition: 'border-color var(--d-base) var(--ease-smooth), box-shadow var(--d-base) var(--ease-smooth)',
  },
  cardHead: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: 'var(--s-3)', marginBottom: 'var(--s-5)',
  },
  cardTitle: {
    fontSize: 'var(--t-lg)', fontWeight: 600, margin: 0, color: 'var(--text)',
    fontFamily: 'var(--font-fraunces), serif',
    letterSpacing: 'var(--ls-snug)',
  },
  cardSub: { fontSize: 'var(--t-xs)', color: 'var(--text-3)', margin: 'var(--s-1) 0 0' },

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
