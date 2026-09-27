import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import ContratsView from './ContratsView'
import type { ContractRow } from './types'

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

  return <ContratsView contracts={contracts} appUrl={process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'} />
}
