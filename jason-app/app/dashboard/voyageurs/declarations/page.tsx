import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import type { PendingDeclaration } from '@/components/dashboard/DeclarationsWidget'
import DeclarationsView, { type DoneDeclaration } from './DeclarationsView'

export const metadata = { title: 'Déclarations voyageurs' }

// Déclarations obligatoires (fiche de police FR, SIBA PT…) : accès fixe
// depuis Mes voyageurs (sept. 2026). Avant, elles n'apparaissaient que dans
// le widget de l'accueil, qui disparaît une fois tout déclaré : impossible
// de retrouver une fiche de police déjà faite (à conserver 6 mois en France).
export default async function DeclarationsPage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])
  if (!profile) return null

  const since = new Date(Date.now() - 180 * 86_400_000).toISOString().slice(0, 10)
  const [{ data: pending }, { data: history }] = await Promise.all([
    supabase
      .from('guest_declarations')
      .select('id, voyageur_id, voyageur_nom, voyageur_nationalite, logement_nom, logement_pays, date_arrivee, deadline_at')
      .eq('user_id', profile.userId)
      .eq('statut', 'a_faire')
      .order('deadline_at')
      .limit(100),
    supabase
      .from('guest_declarations')
      .select('id, voyageur_id, voyageur_nom, voyageur_nationalite, logement_nom, logement_pays, date_arrivee, statut, declared_at')
      .eq('user_id', profile.userId)
      .in('statut', ['faite', 'ignoree'])
      .gte('date_arrivee', since)
      .order('date_arrivee', { ascending: false })
      .limit(200),
  ])

  const todo = (pending ?? []) as PendingDeclaration[]
  return <DeclarationsView todo={todo} done={(history ?? []) as DoneDeclaration[]} />
}
