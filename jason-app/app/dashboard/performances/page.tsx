import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/queries/profile'
import PerformancesView from './PerformancesView'
import { extractCity, findMarketBenchmark, type MarketBenchmark } from '@/lib/lcd/market-benchmarks'

// revalidate: 60 → page servie depuis le cache Vercel entre 2 mutations.
// Les server actions invalident via revalidatePath, donc l'UX reste fraîche.
export const revalidate = 60

export type SejourRow = {
  id: string
  voyageur_id: string | null
  logement: string | null
  date_arrivee: string
  date_depart: string
  montant: number | null
  commission_montant?: number | null
  contrat_plateforme?: string | null
  created_at: string | null
}

export type ChargeRow = {
  logement_nom: string | null
  montant: number
  date_charge: string
  categorie: string | null
  deductible: boolean | null
}

export type LogementRow = {
  id: string
  nom: string
  adresse: string | null
  ville: string | null      // dérivé depuis adresse côté serveur
  pays: string | null
  tarif_nuitee_moyen: number | null
}

export type VoyageurMin = {
  id: string
  source: string | null
}

export default async function PerformancesPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  const supabase = await createClient()

  const [sejoursRes, contractsRes, logementsRes, voyageursRes, objectifRes, chargesRes] = await Promise.all([
    supabase
      .from('sejours')
      .select('id, voyageur_id, logement, date_arrivee, date_depart, montant, commission_montant, contrat_plateforme, created_at')
      .eq('user_id', profile.userId)
      .is('annule_at', null)
      .order('date_arrivee', { ascending: false }),
    // Les contrats signés sans séjour lié comptent aussi pour l'occupation/revenus.
    // On les fusionne pour que la vue Performances reflète l'activité réelle même
    // si l'hôte n'a pas créé manuellement de séjour dans le calendrier.
    supabase
      .from('contracts')
      .select('id, sejour_id, voyageur_id, logement_nom, date_arrivee, date_depart, montant_loyer, statut, created_at')
      .eq('user_id', profile.userId)
      .neq('statut', 'annule')
      .order('date_arrivee', { ascending: false }),
    supabase
      .from('logements')
      .select('id, nom, adresse, pays, tarif_nuitee_moyen')
      .eq('user_id', profile.userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('voyageurs')
      .select('id, source')
      .eq('user_id', profile.userId),
    supabase
      .from('revenus_objectifs')
      .select('objectif_ca_annuel, annee')
      .eq('user_id', profile.userId)
      .maybeSingle(),
    supabase
      .from('revenus_charges')
      .select('logement_nom, montant, date_charge, categorie, deductible')
      .eq('user_id', profile.userId),
  ])

  const baseSejours: SejourRow[] = (sejoursRes.data ?? []) as SejourRow[]
  const linkedSejourIds = new Set(
    (contractsRes.data ?? [])
      .map(c => (c as any).sejour_id)
      .filter((id): id is string => !!id),
  )

  // Contrats orphelins (sans sejour_id) → on les transforme en pseudo-séjours
  // pour qu'ils apparaissent dans les KPIs. Préfixe 'contract:' pour éviter
  // toute collision d'id avec les vrais séjours.
  const orphanContracts: SejourRow[] = (contractsRes.data ?? [])
    .filter(c => !(c as any).sejour_id)
    .filter(c => (c as any).date_arrivee && (c as any).date_depart)
    .map((c: any) => ({
      id: `contract:${c.id}`,
      voyageur_id: c.voyageur_id ?? null,
      logement: c.logement_nom ?? null,
      date_arrivee: c.date_arrivee,
      date_depart: c.date_depart,
      montant: c.montant_loyer ?? null,
      commission_montant: null,           // contrats directs : pas de commission OTA
      contrat_plateforme: 'direct',
      created_at: c.created_at ?? null,
    }))

  // Si un séjour est déjà lié à un contrat (sejour_id présent), on garde
  // le séjour (le contrat sert juste à la signature). Pas de double comptage.
  void linkedSejourIds // marqueur d'intention, déjà géré par le filter ci-dessus
  const sejours: SejourRow[] = [...baseSejours, ...orphanContracts]
  const voyageurs: VoyageurMin[] = (voyageursRes.data ?? []) as VoyageurMin[]
  const logementsRaw = (logementsRes.data ?? []) as Array<Omit<LogementRow, 'ville'>>
  // Extraction ville depuis adresse (côté serveur, ville absente de la table).
  // Une adresse type "12 rue Foo, 33000 Bordeaux, France" → "Bordeaux".
  const logements: LogementRow[] = logementsRaw.map(l => ({
    ...l,
    ville: extractCity(l.adresse),
  }))

  // Benchmarks marché : un par logement (selon la ville détectée).
  // Si aucun match précis, on retombe sur la moyenne pays / null.
  const benchmarks: Record<string, MarketBenchmark | null> = {}
  logements.forEach(l => {
    benchmarks[l.id] = findMarketBenchmark(l.ville, l.pays ?? 'FR')
  })

  const charges: ChargeRow[] = (chargesRes?.data ?? []) as ChargeRow[]

  return (
    <PerformancesView
      sejours={sejours}
      logements={logements}
      voyageurs={voyageurs}
      benchmarks={benchmarks}
      objectifAnnuel={objectifRes?.data?.objectif_ca_annuel ?? null}
      plan={profile.plan}
      charges={charges}
    />
  )
}
