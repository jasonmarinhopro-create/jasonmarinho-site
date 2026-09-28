// Estimation fiscale de « Mes finances » (sept. 2026).
//
// Les plafonds s'apprécient sur l'ensemble du foyer, pas par logement : on
// calcule toujours sur TOUS les logements d'un même pays, puis on montre la
// part du logement sélectionné. Le régime de chaque logement vient de sa fiche
// (type « chambres d'hôtes », étoiles de classement), sans rien redemander.
//
// France (revenus 2026, cf. lib/lcd/fiscal-params.ts) : micro-BIC sur les
// recettes BRUTES (les commissions ne se déduisent pas en micro), abattement
// 30 % non classé (plafond 15 000 €), 50 % classé ou chambres d'hôtes
// (plafond 83 600 €). Régime réel : recettes − commissions − charges −
// amortissements. Avant cette refonte, une estimation partait du montant
// après commissions (impôt sous-estimé) et appliquait 50 % par défaut.
//
// Portugal : régime simplifié catégorie B, coefficient 0,35 pour l'AL en
// appartement ou maison ; exonération d'IVA (art. 53 CIVA) jusqu'à 15 000 €,
// réservée aux résidents fiscaux portugais depuis juillet 2025.

import { FISCAL_PARAMS_2026 } from '@/lib/lcd/fiscal-params'
import { COUNTRIES } from '@/lib/countries'
import { normName, round2, type ChargeLine, type LogementFin, type RevenueLine } from './engine'

export type FiscalCat = 'nonClasse' | 'classe' | 'cdh'

export const FISCAL_CAT_LABEL: Record<FiscalCat, string> = {
  nonClasse: 'Meublé non classé',
  classe: 'Meublé classé',
  cdh: "Chambres d'hôtes",
}

export function fiscalCategory(l: Pick<LogementFin, 'typeLogement' | 'classementEtoiles'> | null | undefined): FiscalCat {
  if (!l) return 'nonClasse'
  if (l.typeLogement === 'chambres-hotes') return 'cdh'
  if ((l.classementEtoiles ?? 0) > 0) return 'classe'
  return 'nonClasse'
}

const MB = FISCAL_PARAMS_2026.microBic
export const ABATTEMENT: Record<FiscalCat, number> = {
  nonClasse: MB.nonClasse.abattement,
  classe: MB.classe.abattement,
  cdh: MB.chambresHotes.abattement,
}
export const PLAFOND_NON_CLASSE = MB.nonClasse.plafond
export const PLAFOND_MICRO = MB.classe.plafond
export const SEUIL_LMP = FISCAL_PARAMS_2026.ei.seuilLmp
export const PRELEVEMENTS_SOCIAUX = FISCAL_PARAMS_2026.societe.prelevementsSociauxLmnp

/** Dotation d'amortissement d'une année (montant / durée, sur les années couvertes) */
export function dotationAnnuelle(c: ChargeLine, year: number): number {
  if (c.categorie !== 'amortissement' || !c.dureeAmortissement || c.dureeAmortissement <= 0) return 0
  const debut = Number(c.date.slice(0, 4))
  if (year < debut || year >= debut + c.dureeAmortissement) return 0
  return c.montant / c.dureeAmortissement
}

export interface FiscalLogement {
  nom: string
  logementId: string | null
  cat: FiscalCat
  recettes: number
  /** Logement non retrouvé dans les fiches : compté comme non classé par prudence */
  sansFiche: boolean
}

export type VerdictFR = 'micro' | 'micro_a_completer' | 'reel_conseille' | 'reel_ou_classement' | 'reel_obligatoire' | 'aucun'

export interface FiscalFR {
  pays: 'FR'
  year: number
  /** Recettes déjà perçues cette année (arrivées jusqu'à aujourd'hui) */
  recettesAjour: number
  /** + séjours déjà réservés d'ici la fin de l'année */
  recettesAnnee: number
  parCat: Record<FiscalCat, number>
  logements: FiscalLogement[]
  microEligible: boolean
  baseMicro: number
  commissions: number
  charges: number
  amortissements: number
  amortissementsSaisis: boolean
  baseReel: number
  verdict: VerdictFR
  lmpPossible: boolean
  /** Lignes exclues par l'hôte (« ne pas déclarer ») */
  exclues: number
}

export interface FiscalPT {
  pays: 'PT'
  year: number
  recettesAjour: number
  recettesAnnee: number
  coefficient: number
  base: number
  seuilIva: number
  sousSeuilIva: boolean
  plafondSimplifie: number
  logements: FiscalLogement[]
}

function paysOfLine(l: RevenueLine, byName: Map<string, LogementFin>, byId: Map<string, LogementFin>): string {
  const lg = (l.logementId && byId.get(l.logementId)) || byName.get(normName(l.logementNom))
  return (lg?.pays ?? 'FR').toUpperCase()
}

function logementOf(row: { logementId: string | null; logementNom: string }, byName: Map<string, LogementFin>, byId: Map<string, LogementFin>): LogementFin | undefined {
  return (row.logementId && byId.get(row.logementId)) || byName.get(normName(row.logementNom))
}

/** Pays présents dans les recettes de l'année (FR par défaut) */
export function paysDesRecettes(lines: RevenueLine[], logements: LogementFin[], year: number): string[] {
  const byName = new Map(logements.map(l => [normName(l.nom), l]))
  const byId = new Map(logements.map(l => [l.id, l]))
  const set = new Set<string>()
  for (const l of lines) {
    if (l.horsRevenus || !l.date.startsWith(String(year))) continue
    set.add(paysOfLine(l, byName, byId))
  }
  if (set.size === 0) {
    for (const lg of logements) set.add((lg.pays ?? 'FR').toUpperCase())
  }
  return [...set].sort()
}

function recettesParLogement(lines: RevenueLine[], logements: LogementFin[], year: number, today: string, pays: string) {
  const byName = new Map(logements.map(l => [normName(l.nom), l]))
  const byId = new Map(logements.map(l => [l.id, l]))
  const y = String(year)
  const map = new Map<string, FiscalLogement>()
  let ajour = 0, annee = 0, exclues = 0, commissions = 0
  for (const l of lines) {
    if (l.horsRevenus || !l.date.startsWith(y)) continue
    if (paysOfLine(l, byName, byId) !== pays) continue
    if (!l.aDeclarer) { exclues += 1; continue }
    annee += l.brut
    if (l.date <= today) {
      ajour += l.brut
      commissions += l.commission ?? 0
    }
    const lg = logementOf(l, byName, byId)
    const key = lg ? lg.id : `nom:${normName(l.logementNom)}`
    const cur = map.get(key) ?? {
      nom: lg?.nom ?? (l.logementNom || 'Sans logement'),
      logementId: lg?.id ?? null,
      cat: fiscalCategory(lg),
      recettes: 0,
      sansFiche: !lg,
    }
    cur.recettes += l.brut
    map.set(key, cur)
  }
  const list = [...map.values()].map(x => ({ ...x, recettes: round2(x.recettes) })).sort((a, b) => b.recettes - a.recettes)
  return { list, ajour: round2(ajour), annee: round2(annee), exclues, commissions: round2(commissions), byName, byId }
}

export function estimerFR(input: { lines: RevenueLine[]; charges: ChargeLine[]; logements: LogementFin[]; year: number; today: string }): FiscalFR {
  const { year, today } = input
  const r = recettesParLogement(input.lines, input.logements, year, today, 'FR')
  const parCat: Record<FiscalCat, number> = { nonClasse: 0, classe: 0, cdh: 0 }
  for (const l of r.list) parCat[l.cat] += l.recettes

  const total = r.annee
  const microEligible = total <= PLAFOND_MICRO && parCat.nonClasse <= PLAFOND_NON_CLASSE
  const baseMicro = (Object.keys(parCat) as FiscalCat[])
    .reduce((s, c) => s + parCat[c] * (1 - ABATTEMENT[c]), 0)

  let charges = 0, amortissements = 0, amortissementsSaisis = false
  for (const c of input.charges) {
    const lg = logementOf(c, r.byName, r.byId)
    if ((lg?.pays ?? 'FR').toUpperCase() !== 'FR') continue
    if (c.categorie === 'amortissement') {
      const d = dotationAnnuelle(c, year)
      if (d > 0) { amortissements += d; amortissementsSaisis = true }
      continue
    }
    if (c.deductible && c.date.startsWith(String(year))) charges += c.montant
  }
  // Commissions de l'année entière (les séjours à venir en auront aussi : on
  // les estime au même taux que ceux déjà perçus)
  const tauxCommission = r.ajour > 0 ? r.commissions / r.ajour : 0
  const commissions = r.commissions + (total - r.ajour) * tauxCommission
  const baseReel = Math.max(0, total - commissions - charges - amortissements)

  let verdict: VerdictFR
  if (total <= 0) verdict = 'aucun'
  else if (!microEligible) verdict = total <= PLAFOND_MICRO ? 'reel_ou_classement' : 'reel_obligatoire'
  else if (!amortissementsSaisis) verdict = 'micro_a_completer'
  else verdict = baseReel < baseMicro ? 'reel_conseille' : 'micro'

  return {
    pays: 'FR', year,
    recettesAjour: r.ajour, recettesAnnee: total,
    parCat: { nonClasse: round2(parCat.nonClasse), classe: round2(parCat.classe), cdh: round2(parCat.cdh) },
    logements: r.list,
    microEligible,
    baseMicro: round2(baseMicro),
    commissions: round2(commissions), charges: round2(charges), amortissements: round2(amortissements),
    amortissementsSaisis,
    baseReel: round2(baseReel),
    verdict,
    lmpPossible: total > SEUIL_LMP,
    exclues: r.exclues,
  }
}

export function estimerPT(input: { lines: RevenueLine[]; logements: LogementFin[]; year: number; today: string }): FiscalPT {
  const r = recettesParLogement(input.lines, input.logements, input.year, input.today, 'PT')
  const pt = COUNTRIES.PT
  return {
    pays: 'PT', year: input.year,
    recettesAjour: r.ajour, recettesAnnee: r.annee,
    coefficient: pt.taxation.taxableIncomeRatio,
    base: round2(r.annee * pt.taxation.taxableIncomeRatio),
    seuilIva: pt.vat.franchiseThreshold,
    sousSeuilIva: r.annee <= pt.vat.franchiseThreshold,
    plafondSimplifie: pt.taxation.simpleRegimeCap,
    logements: r.list,
  }
}

/** Impôt + prélèvements sociaux estimés sur une base, à une tranche donnée */
export function impotEstime(base: number, tmi: number): number {
  return round2(base * (tmi + PRELEVEMENTS_SOCIAUX))
}
