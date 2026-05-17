import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/queries/profile'
import { extractCity } from '@/lib/lcd/market-benchmarks'
import { computeAccountStats } from '@/lib/lcd/account-stats'
import SimulateursUI from './SimulateursUI'

export const metadata = { title: 'Simulateurs LCD, Jason Marinho' }
export const dynamic = 'force-dynamic'

export type LogementPrefill = {
  id: string
  nom: string
  pays: 'FR' | 'PT' | 'ES' | 'IT' | 'BE' | 'DE' | 'NL' | 'AT' | 'CH'
  ville: string | null
  tarifNuitee: number | null
  typeLogement: string | null
  nbChambres: number | null
  /** Stats réelles calculées depuis les séjours des 12 derniers mois */
  stats?: {
    nuitsLouees: number          // somme nuits réservées 12m glissants
    revenuTotal: number          // CA brut 12m glissants
    adrReel: number              // revenuTotal / nuitsLouees
    occupationReelle: number     // 0-100, nuitsLouees / 365
    nbSejours: number
  }
}

export default async function SimulateursPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  const supabase = await createClient()
  const [{ data: logements }, { data: sejours }] = await Promise.all([
    supabase
      .from('logements')
      .select('id, nom, adresse, pays, tarif_nuitee_moyen, type_logement, nb_chambres')
      .eq('user_id', profile.userId)
      .order('created_at', { ascending: false }),
    // Stats réelles : on agrège les séjours des 12 derniers mois pour
    // calculer l'occupation et l'ADR réels par logement
    supabase
      .from('sejours')
      .select('logement, date_arrivee, date_depart, montant')
      .eq('user_id', profile.userId)
      .gte('date_arrivee', new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10))
      .not('montant', 'is', null)
      .gt('montant', 0),
  ])

  // Index stats par nom de logement
  const statsByLogementNom: Record<string, NonNullable<LogementPrefill['stats']>> = {}
  ;(sejours ?? []).forEach(s => {
    const nom = (s.logement as string) ?? ''
    if (!nom) return
    const arr = new Date((s.date_arrivee as string) + 'T12:00:00')
    const dep = new Date((s.date_depart as string) + 'T12:00:00')
    const nuits = Math.max(0, Math.round((dep.getTime() - arr.getTime()) / 86400000))
    if (nuits <= 0) return
    if (!statsByLogementNom[nom]) {
      statsByLogementNom[nom] = { nuitsLouees: 0, revenuTotal: 0, adrReel: 0, occupationReelle: 0, nbSejours: 0 }
    }
    statsByLogementNom[nom].nuitsLouees += nuits
    statsByLogementNom[nom].revenuTotal += Number(s.montant ?? 0)
    statsByLogementNom[nom].nbSejours += 1
  })
  // Finalise : calcule ADR et occupation
  Object.keys(statsByLogementNom).forEach(nom => {
    const s = statsByLogementNom[nom]
    s.adrReel = s.nuitsLouees > 0 ? Math.round(s.revenuTotal / s.nuitsLouees) : 0
    s.occupationReelle = Math.round((s.nuitsLouees / 365) * 100)
  })

  const prefill: LogementPrefill[] = (logements ?? []).map(l => {
    const rawPays = ((l.pays as string) ?? 'FR').toUpperCase()
    const supported = ['PT','ES','IT','BE','DE','NL','AT','CH'] as const
    const pays: LogementPrefill['pays'] =
      (supported as readonly string[]).includes(rawPays) ? (rawPays as LogementPrefill['pays']) : 'FR'
    const nom = (l.nom as string) ?? ''
    return {
      id: l.id as string,
      nom,
      pays,
      ville: extractCity(l.adresse as string | null),
      tarifNuitee: (l.tarif_nuitee_moyen as number | null) ?? null,
      typeLogement: (l.type_logement as string | null) ?? null,
      nbChambres: (l.nb_chambres as number | null) ?? null,
      stats: statsByLogementNom[nom],
    }
  })

  return <SimulateursUI logementsPrefill={prefill} accountStats={computeAccountStats(prefill, profile)} />
}
