// SERVER ONLY — synchronisation des déclarations voyageurs pour les séjours
// SANS contrat (résas Airbnb/Booking saisies à la main, séjours calendrier).
// Complète lib/declarations/create.ts (qui couvre la signature de contrat).
//
// Appelé best-effort après :
//  - création/édition d'un séjour lié à un voyageur
//  - mise à jour de la nationalité d'un voyageur (cas fréquent : la fiche
//    est créée depuis une résa Booking, la nationalité arrive après)
//
// Idempotence : index unique sur guest_declarations.sejour_id — on vérifie
// l'existant avant insert, l'index garantit le reste (y compris vs le flux
// contrat qui porte aussi le sejour_id).

import type { SupabaseClient } from '@supabase/supabase-js'
import { getCountry } from '@/lib/countries'
import { declarationRequired } from './create'

/** Fenêtre de rattrapage : une arrivée de plus de 7 jours n'est plus
 *  actionnable (deadline 24-72h largement dépassée) — on ne crée pas de
 *  dette de culpabilité, on couvre le présent et le futur. */
const CATCH_UP_DAYS = 7

export async function syncDeclarationsForVoyageur(
  supabase: SupabaseClient,
  userId: string,
  voyageurId: string,
): Promise<number> {
  const { data: voyageur } = await supabase
    .from('voyageurs')
    .select('prenom, nom, nationalite')
    .eq('id', voyageurId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!voyageur) return 0
  const nationalite: string | null = voyageur.nationalite ?? null

  const cutoff = new Date(Date.now() - CATCH_UP_DAYS * 86_400_000).toISOString().split('T')[0]
  const { data: sejours } = await supabase
    .from('sejours')
    .select('id, logement, date_arrivee')
    .eq('user_id', userId)
    .eq('voyageur_id', voyageurId)
    .is('annule_at', null)
    .gte('date_arrivee', cutoff)
  if (!sejours || sejours.length === 0) return 0

  // Pays par logement (match par nom, insensible à la casse — même
  // convention que le reste de l'app, les séjours stockent le nom libre).
  const { data: logements } = await supabase
    .from('logements')
    .select('nom, pays')
    .eq('user_id', userId)
  const paysByNom = new Map<string, string>(
    (logements ?? [])
      .filter(l => l.nom)
      .map(l => [String(l.nom).toLowerCase(), l.pays ?? 'FR'])
  )

  const sejourIds = sejours.map(s => s.id)
  const { data: existing } = await supabase
    .from('guest_declarations')
    .select('sejour_id')
    .in('sejour_id', sejourIds)
  const alreadyTracked = new Set((existing ?? []).map(e => e.sejour_id))

  let created = 0
  for (const sj of sejours) {
    if (!sj.date_arrivee || alreadyTracked.has(sj.id)) continue
    const pays = sj.logement
      ? (paysByNom.get(String(sj.logement).toLowerCase()) ?? 'FR')
      : 'FR'
    if (!declarationRequired(pays, nationalite)) continue

    const decl = getCountry(pays).foreignGuestDeclaration
    const arrivee = new Date(sj.date_arrivee + 'T12:00:00')
    const deadlineAt = new Date(arrivee.getTime() + decl.deadlineHours * 3_600_000)

    const { error } = await supabase.from('guest_declarations').insert({
      user_id: userId,
      sejour_id: sj.id,
      voyageur_id: voyageurId,
      voyageur_nom: `${voyageur.prenom ?? ''} ${voyageur.nom ?? ''}`.trim() || 'Voyageur',
      voyageur_nationalite: nationalite,
      logement_nom: sj.logement,
      logement_pays: pays,
      date_arrivee: sj.date_arrivee,
      deadline_at: deadlineAt.toISOString(),
    })
    // Violation d'unicité (course avec un autre flux) = déjà couvert, on ignore.
    if (!error) created++
  }
  return created
}
