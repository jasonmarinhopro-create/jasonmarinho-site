import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import ContratsView from './ContratsView'
import type { ContractRow, ContractCandidate } from './types'

// Page « Contrats & paiements » (sept. 2026) : auparavant un onglet caché
// dans Mes voyageurs. Les contrats + caution sont la valeur n°1 de l'app
// pour les réservations directes : ils ont leur entrée dans le menu, avec en
// tête ce qui attend une action (signature, paiement, caution à libérer).
export default async function ContratsPage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])
  if (!profile) return null

  const { data } = await supabase
    .from('contracts')
    .select('id, statut, signature_date, created_at, locataire_prenom, locataire_nom, locataire_email, logement_nom, logement_adresse, date_arrivee, date_depart, montant_loyer, montant_caution, stripe_payment_enabled, stripe_payment_status, stripe_deposit_status, sejour_id, token')
    .eq('user_id', profile.userId)
    .order('created_at', { ascending: false })
    .limit(500)

  const rows = (data ?? []) as Omit<ContractRow, 'voyageur_id'>[]

  // « Nouveau contrat » : séjours à venir (ou en cours) sans contrat actif.
  // Un contrat est toujours rattaché à un séjour : on propose directement la
  // liste plutôt que d'expliquer où aller (le lien ouvre l'assistant de
  // contrat sur la fiche voyageur via ?contract=<séjour>).
  const today = new Date().toISOString().slice(0, 10)
  const withContract = new Set(rows.filter(c => c.statut !== 'annule' && c.sejour_id).map(c => c.sejour_id as string))
  // Pour « Nouvelle réservation directe » (séjour pas encore saisi) :
  // voyageurs existants + logements, même modale que la fiche logement.
  const [{ data: voyageurOptions }, { data: logementOptions }] = await Promise.all([
    supabase.from('voyageurs').select('id, prenom, nom, email, telephone').eq('user_id', profile.userId).order('updated_at', { ascending: false }).limit(300),
    supabase.from('logements').select('id, nom').eq('user_id', profile.userId).order('nom'),
  ])
  const { data: upcoming } = await supabase
    .from('sejours')
    .select('id, voyageur_id, logement, date_arrivee, date_depart, voyageurs(prenom, nom)')
    .eq('user_id', profile.userId)
    .is('annule_at', null)
    .gte('date_depart', today)
    .order('date_arrivee')
    .limit(60)
  const candidates: ContractCandidate[] = (upcoming ?? [])
    .filter(sj => sj.voyageur_id && !withContract.has(sj.id))
    .map(sj => {
      const v = Array.isArray(sj.voyageurs) ? sj.voyageurs[0] : sj.voyageurs
      return {
        sejourId: sj.id,
        voyageurId: sj.voyageur_id as string,
        guest: v ? `${v.prenom ?? ''} ${v.nom ?? ''}`.trim() || 'Voyageur' : 'Voyageur',
        logement: sj.logement,
        dateArrivee: sj.date_arrivee,
        dateDepart: sj.date_depart,
      }
    })

  // Fiche voyageur de chaque contrat (via le séjour lié) : c'est là que se
  // trouvent les actions (relancer, caution, facture).
  const sejourIds = Array.from(new Set(rows.map(c => c.sejour_id).filter(Boolean))) as string[]
  const voyageurBySejour = new Map<string, string>()
  if (sejourIds.length > 0) {
    const { data: sejours } = await supabase
      .from('sejours')
      .select('id, voyageur_id')
      .eq('user_id', profile.userId)
      .in('id', sejourIds)
    ;(sejours ?? []).forEach(sj => { if (sj.voyageur_id) voyageurBySejour.set(sj.id, sj.voyageur_id) })
  }

  const contracts: ContractRow[] = rows.map(c => ({
    ...c,
    voyageur_id: c.sejour_id ? voyageurBySejour.get(c.sejour_id) ?? null : null,
  }))

  return <ContratsView contracts={contracts} candidates={candidates} voyageurs={voyageurOptions ?? []} logements={(logementOptions ?? []).filter(l => l.nom) as Array<{ id: string; nom: string }>} appUrl={process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'} />
}
