// Chargement des données de « Mes finances » pour le logement sélectionné
// (cookie active-property-id, même sélecteur que la sidebar). Une seule
// requête par table, partagée par les onglets du même rendu (cache React).
import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { allRows } from '@/lib/supabase/all-rows'
import { getProfile } from '@/lib/queries/profile'
import { getActiveProperty, ALL_PROPERTIES } from '@/lib/queries/active-property'
import { parisToday } from '@/lib/stripe/deposit-window'
import { icalReservationsForDisplay } from '@/lib/ical/display'
import { extractCity } from '@/lib/lcd/market-benchmarks'
import {
  buildRevenueLines, buildChargeLines, buildOccupation, inScope, normName,
  type LogementFin, type RevenueLine, type ChargeLine, type OccupationStay, type Scope,
} from './engine'

export interface FinanceChoice { id: string; nom: string }

export interface FinanceData {
  userId: string
  plan: string
  today: string
  /** Tous les logements (fiches), pour la fiscalité du foyer */
  logements: LogementFin[]
  /** Choix du sélecteur (fiches + noms trouvés dans les séjours) */
  choices: FinanceChoice[]
  /** 'all' ou l'id du logement choisi */
  activeId: string
  scope: Scope
  /** Fiche du logement choisi (null si tous ou logement sans fiche) */
  logement: LogementFin | null
  /** Nombre de logements couverts par la vue (pour l'occupation) */
  nbLogements: number
  /** Toutes les lignes (tous logements) : la fiscalité en a besoin */
  allLines: RevenueLine[]
  allCharges: ChargeLine[]
  /** Lignes du logement choisi */
  lines: RevenueLine[]
  charges: ChargeLine[]
  occupation: OccupationStay[]
  objectif: number | null
  /** false tant que la migration 112 (objectif par logement) n'est pas appliquée */
  objectifParLogement: boolean
}

// Pas de colonne ville garantie : la ville se déduit de l'adresse (comme l'ancienne page Performances)
const LOGEMENT_COLS = 'id, nom, pays, adresse, type_logement, classement_etoiles, ical_airbnb, ical_booking, ical_vrbo, ical_autre'

export const loadFinances = cache(async (): Promise<FinanceData | null> => {
  const profile = await getProfile()
  if (!profile) return null
  const userId = profile.userId
  const supabase = await createClient()
  const today = parisToday()
  const since = `${Number(today.slice(0, 4)) - 2}-01-01`

  // Lecture par paquets de 1 000 (24/11/2026) : PostgREST ne renvoie jamais
  // plus de 1 000 lignes, même avec .limit(3000) ; un compte très actif sur
  // 2 ans perdait des recettes sans le savoir. Tri stable (id en dernier).
  const pages = <T,>(q: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) =>
    allRows<T>(q).then(r => ({ data: r.rows, error: r.error }))

  // Objectif par logement : colonne ajoutée par la migration 112 (tolérée
  // absente). Lu en même temps que le reste (avant : un aller-retour de plus).
  let objectifParLogement = true
  const [logFirst, active, sejoursRes, contractsRes, entriesRes, chargesRes, objectifRes, feedsRes, eventsRes] = await Promise.all([
    supabase.from('logements').select(`${LOGEMENT_COLS}, objectif_ca_annuel`).eq('user_id', userId).order('created_at', { ascending: true }),
    getActiveProperty(),
    pages((from, to) => supabase
      .from('sejours')
      .select('id, voyageur_id, logement, date_arrivee, date_depart, montant, commission_montant, contrat_plateforme, a_declarer, created_at, voyageurs(prenom, nom, source)')
      .eq('user_id', userId)
      .is('annule_at', null)
      .gte('date_arrivee', since)
      .order('date_arrivee', { ascending: false })
      .order('id')
      .range(from, to)),
    pages((from, to) => supabase
      .from('contracts')
      .select('id, sejour_id, statut, montant_loyer, date_arrivee, date_depart, logement_nom, logement_id, locataire_prenom, locataire_nom, stripe_payment_enabled, stripe_payment_status, created_at')
      .eq('user_id', userId)
      .neq('statut', 'annule')
      .gte('date_arrivee', since)
      .order('id')
      .range(from, to)),
    pages((from, to) => supabase
      .from('revenus_entries')
      .select('id, logement_nom, montant, date_paiement, mode_paiement, type_paiement, description, a_declarer')
      .eq('user_id', userId)
      .gte('date_paiement', since)
      .order('id')
      .range(from, to)),
    loadCharges(supabase, userId),
    supabase.from('revenus_objectifs').select('objectif_ca_annuel').eq('user_id', userId).maybeSingle(),
    supabase.from('ical_feeds').select('id, url, name').eq('user_id', userId),
    pages((from, to) => supabase
      .from('ical_events')
      .select('id, feed_id, title, description, start_date, end_date')
      .eq('user_id', userId)
      .gte('end_date', since)
      .order('id')
      .range(from, to)),
  ])
  let logRes = logFirst
  if (logRes.error) {
    objectifParLogement = false
    logRes = await supabase.from('logements').select(LOGEMENT_COLS).eq('user_id', userId).order('created_at', { ascending: true }) as typeof logRes
  }

  const rawLogements = (logRes.data ?? []) as Array<Record<string, unknown>>
  const logements: LogementFin[] = rawLogements.map(l => ({
    id: String(l.id),
    nom: String(l.nom ?? 'Logement'),
    pays: (l.pays as string | null) ?? 'FR',
    ville: extractCity((l.adresse as string | null) ?? null),
    typeLogement: (l.type_logement as string | null) ?? null,
    classementEtoiles: (l.classement_etoiles as number | null) ?? null,
    objectif: l.objectif_ca_annuel != null ? Number(l.objectif_ca_annuel) : null,
  }))

  const sejours = (sejoursRes.data ?? []).map((s: any) => ({
    ...s,
    voyageur_nom: s.voyageurs ? `${s.voyageurs.prenom ?? ''} ${s.voyageurs.nom ?? ''}`.trim() : null,
    voyageur_source: s.voyageurs?.source ?? null,
  }))
  const allLines = buildRevenueLines({ sejours, contracts: contractsRes.data ?? [], entries: entriesRes.data ?? [], today })
  const allCharges = buildChargeLines((chargesRes.data ?? []) as unknown as Parameters<typeof buildChargeLines>[0], today)
  const ical = icalReservationsForDisplay(rawLogements as any, feedsRes.data ?? [], eventsRes.data ?? [])
  const allOccupation = buildOccupation(allLines, ical.map(r => ({ id: r.id, logementName: r.logementName, dateArrivee: r.dateArrivee, dateDepart: r.dateDepart, platform: r.platform })))

  // Portée : même choix que le sélecteur de la sidebar. Un seul logement =
  // toujours ce logement (pas de vue « tous »).
  const choices: FinanceChoice[] = active.allProperties.map(p => ({ id: p.id, nom: p.nom }))
  let activeId = active.propertyId
  if (activeId === ALL_PROPERTIES && choices.length === 1) activeId = choices[0].id
  const chosen = activeId === ALL_PROPERTIES ? null : choices.find(c => c.id === activeId) ?? null
  const scope: Scope = chosen
    ? { logement: { id: chosen.id.startsWith('virtual:') ? null : chosen.id, nom: chosen.nom } }
    : { logement: null }
  const logement = chosen ? logements.find(l => l.id === chosen.id) ?? logements.find(l => normName(l.nom) === normName(chosen.nom)) ?? null : null

  const lines = allLines.filter(l => inScope(l, scope))
  const charges = allCharges.filter(c => inScope(c, scope))
  const occupation = allOccupation.filter(o => inScope(o, scope))

  // Objectif : celui du logement ; en vue « tous », la somme des objectifs
  // par logement, sinon l'ancien objectif global. Un seul logement sans
  // objectif propre : l'ancien objectif global (c'était le sien).
  const legacy = objectifRes.data?.objectif_ca_annuel != null ? Number(objectifRes.data.objectif_ca_annuel) : null
  let objectif: number | null
  if (logement) objectif = logement.objectif ?? (choices.length <= 1 ? legacy : null)
  else if (scope.logement) objectif = null
  else {
    // Somme des objectifs seulement si CHAQUE logement en a un (sinon on
    // comparerait l'objectif d'un logement aux revenus de tous)
    const withObj = logements.filter(l => l.objectif)
    if (withObj.length === 0) objectif = legacy
    else if (withObj.length === logements.length) objectif = withObj.reduce((s, l) => s + (l.objectif ?? 0), 0)
    else objectif = null
  }

  return {
    userId, plan: profile.plan, today,
    logements, choices, activeId, scope, logement,
    nbLogements: scope.logement ? 1 : Math.max(1, logements.length || choices.length),
    allLines, allCharges, lines, charges, occupation,
    objectif, objectifParLogement,
  }
})

// Charges récurrentes (migration 20261102_176 : frequence, date_fin). Tant
// que la migration manque, relecture sans ces colonnes (charges ponctuelles).
async function loadCharges(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const cols = 'id, logement_nom, logement_id, montant, date_charge, categorie, description, deductible, duree_amortissement_annees'
  const read = (c: string) => allRows<Record<string, unknown>>((from, to) =>
    supabase.from('revenus_charges').select(c).eq('user_id', userId).order('id').range(from, to) as unknown as PromiseLike<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>,
  ).then(r => ({ data: r.rows, error: r.error }))
  const res = await read(`${cols}, frequence, date_fin`)
  if (!res.error) return res
  return read(cols)
}
