'use server'

// Server actions de l'espace investisseur : sauvegarde / liste / suppression
// des projets d'acquisition. Sauvegarder un projet ACTIVE l'espace
// investisseur (is_investor = true) — c'est le pont hôte → investisseur.

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { revalidateTag } from 'next/cache'

export interface InvestorProjectSnapshot {
  revenuAnnuel: number
  revenuLow: number
  revenuHigh: number
  adr: number
  occupation: number
  resultatExploitation?: number | null
  cashFlow?: number | null
  rentabiliteNette?: number | null
  source: string
}

export interface SaveInvestorProjectInput {
  nom: string
  pays: string
  ville: string | null
  typeLogement: string
  nbChambres: number
  mode: string
  prixAchat: number | null
  mensualite: number | null
  snapshot: InvestorProjectSnapshot
  notes?: string | null
}

export interface InvestorProject {
  id: string
  nom: string
  pays: string
  ville: string | null
  type_logement: string
  nb_chambres: number
  mode: string
  prix_achat: number | null
  mensualite: number | null
  snapshot: InvestorProjectSnapshot | null
  notes: string | null
  created_at: string
}

export async function saveInvestorProject(input: SaveInvestorProjectInput): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const nom = input.nom.trim()
  if (!nom) return { error: 'Donne un nom à ton projet.' }

  const { data: row, error } = await supabase
    .from('investor_projects')
    .insert({
      user_id: user.id,
      nom,
      pays: input.pays,
      ville: input.ville,
      type_logement: input.typeLogement,
      nb_chambres: input.nbChambres,
      mode: input.mode,
      prix_achat: input.prixAchat,
      mensualite: input.mensualite,
      snapshot: input.snapshot,
      notes: input.notes ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Active l'espace investisseur si ce n'est pas déjà le cas (pont hôte→investisseur).
  await supabase.from('profiles').update({ is_investor: true }).eq('id', user.id).eq('is_investor', false)

  revalidateTag(`spaces:${user.id}`)
  revalidatePath('/dashboard/investir')
  return { id: row.id }
}

export async function deleteInvestorProject(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('investor_projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/investir')
  return {}
}
