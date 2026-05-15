import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import RevenusView from './RevenusView'
import PlanGate from '@/components/ui/PlanGate'

// Force le rendu dynamique pour que toute saisie (séjour, charge,
// commission, etc.) apparaisse immédiatement sans cache.
export const dynamic = 'force-dynamic'

export default async function RevenusPage() {
  const profile = await getProfile()
  const plan = profile?.plan ?? 'decouverte'

  if (plan === 'decouverte') {
    return (
      <>
        <PlanGate feature="revenus" />
      </>
    )
  }

  const supabase = await createClient()
  const userId = profile?.userId ?? ''

  const [
    { data: contracts },
    { data: entries },
    { data: charges },
    { data: logements },
    { data: objectif },
    { data: sejours },
  ] = await Promise.all([
    supabase
      .from('contracts')
      .select('id, montant_loyer, stripe_payment_status, stripe_payment_enabled, date_arrivee, date_depart, logement_nom, logement_id, statut, locataire_prenom, locataire_nom')
      .eq('user_id', userId)
      .neq('statut', 'annule')
      .order('date_arrivee', { ascending: false }),
    supabase
      .from('revenus_entries')
      .select('id, logement_nom, montant, date_paiement, mode_paiement, type_paiement, description')
      .eq('user_id', userId)
      .order('date_paiement', { ascending: false }),
    supabase
      .from('revenus_charges')
      .select('id, logement_nom, logement_id, montant, date_charge, categorie, description, deductible')
      .eq('user_id', userId)
      .order('date_charge', { ascending: false }),
    supabase
      .from('logements')
      .select('id, nom, honoraires_pct')
      .eq('user_id', userId),
    supabase
      .from('revenus_objectifs')
      .select('objectif_ca_annuel, annee')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('sejours')
      .select('id, logement, date_arrivee, date_depart, montant, contrat_plateforme, commission_montant')
      .eq('user_id', userId)
      .not('montant', 'is', null)
      .gt('montant', 0)
      .order('date_arrivee', { ascending: false }),
  ])

  const sejourEntries = (sejours ?? []).map(s => {
    const commission = (s as any).commission_montant ?? 0
    const plateforme = (s as any).contrat_plateforme ?? null
    const platformLabel = plateforme ? ` · ${plateforme}` : ' · en direct'
    return {
      id: `sejour:${s.id}`,
      logement_nom: s.logement ?? '',
      montant: s.montant as number,
      // Net = brut - commission. Stocké à part pour les agrégats.
      commission_montant: commission,
      contrat_plateforme: plateforme,
      date_paiement: s.date_arrivee,
      mode_paiement: 'sejour',
      type_paiement: 'loyer',
      description: `Séjour du ${s.date_arrivee} au ${s.date_depart}${platformLabel}`,
    }
  })

  const logementNoms = [
    ...new Set([
      ...(logements ?? []).map(l => l.nom).filter(Boolean),
      ...(contracts ?? []).map(c => c.logement_nom).filter(Boolean),
    ]),
  ] as string[]

  return (
    <>
      <RevenusView
        contracts={contracts ?? []}
        initialEntries={[...(entries ?? []), ...sejourEntries]}
        initialCharges={(charges ?? []) as any[]}
        logementNoms={logementNoms}
        logements={(logements ?? []) as any[]}
        objectifAnnuel={objectif?.objectif_ca_annuel ?? null}
        plan={plan}
      />
    </>
  )
}
