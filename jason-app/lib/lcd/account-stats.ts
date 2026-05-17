import { estimateRegimeFromCA, type RegimeFiscalEstime } from './fiscal-params'

type LogementWithStats = {
  ville: string | null
  stats?: {
    nuitsLouees: number
    revenuTotal: number
    adrReel: number
    occupationReelle: number
    nbSejours: number
  }
}

export type AccountStats = {
  fullName: string | null
  firstName: string
  plan: 'decouverte' | 'standard' | 'driing'
  caTotal12m: number
  nbLogements: number
  nbLogementsActifs: number
  nuitsTotales12m: number
  adrMoyen: number
  occupationMoyenne: number
  regimeEstime: RegimeFiscalEstime
  regimeLabel: string
  regimeHint: string
  villes: string[]
}

export function computeAccountStats(
  prefill: LogementWithStats[],
  profile: { full_name: string | null; plan: 'decouverte' | 'standard' | 'driing' }
): AccountStats {
  const caTotal12m = prefill.reduce((sum, l) => sum + (l.stats?.revenuTotal ?? 0), 0)
  const nuitsTotales12m = prefill.reduce((sum, l) => sum + (l.stats?.nuitsLouees ?? 0), 0)
  const nbLogements = prefill.length
  const nbLogementsActifs = prefill.filter(l => l.stats && l.stats.nuitsLouees > 0).length
  const adrMoyen = nuitsTotales12m > 0 ? Math.round(caTotal12m / nuitsTotales12m) : 0
  const occupationMoyenne = nbLogementsActifs > 0
    ? Math.round(prefill.reduce((sum, l) => sum + (l.stats?.occupationReelle ?? 0), 0) / nbLogementsActifs)
    : 0

  const regimeInfo = estimateRegimeFromCA(caTotal12m)

  const villes = Array.from(new Set(prefill.map(l => l.ville).filter(Boolean) as string[]))

  const fullName = profile.full_name
  const firstName = (fullName ?? '').split(' ')[0] || 'Hôte'

  return {
    fullName,
    firstName,
    plan: profile.plan,
    caTotal12m,
    nbLogements,
    nbLogementsActifs,
    nuitsTotales12m,
    adrMoyen,
    occupationMoyenne,
    regimeEstime: regimeInfo.regime,
    regimeLabel: regimeInfo.label,
    regimeHint: regimeInfo.hint,
    villes,
  }
}

export function fmtEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}
