'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { syncDeclarationsForVoyageur } from '@/lib/declarations/sync'

/** Best-effort : détecte les déclarations réglementaires (SIBA, fiche
 *  police…) pour les séjours du voyageur. Ne fait jamais échouer l'action
 *  appelante ; rafraîchit le widget dashboard si quelque chose est créé. */
async function syncDeclarations(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, voyageurId: string) {
  try {
    const created = await syncDeclarationsForVoyageur(supabase, userId, voyageurId)
    if (created > 0) revalidatePath('/dashboard')
  } catch { /* best-effort */ }
}

export type VoyageurData = {
  prenom: string
  nom: string
  email?: string | null
  telephone?: string | null
  notes?: string | null

  // Phase 1, enrichissement
  tags?: string[]
  source?: string | null
  date_naissance?: string | null
  nationalite?: string | null
  adresse?: string | null
  code_postal?: string | null
  ville?: string | null
  pays?: string | null
  id_verifie?: boolean
  id_url?: string | null
  id_type?: string | null
  preferences?: string[]
  note_privee?: number | null
  bloque?: boolean
  bloque_motif?: string | null
}

export type SejourData = {
  voyageur_id: string
  logement?: string
  date_arrivee: string
  date_depart: string
  montant?: number | null
  contrat_statut: 'signe' | 'en_attente' | 'non_requis' | 'nouveau' // non_requis conservé pour compatibilité avec les anciens séjours
  contrat_date_signature?: string | null
  contrat_lien?: string | null
  /** Platform that signed the contract: null = signed via Jason */
  contrat_plateforme?: string | null
  /** Commission prélevée par la plateforme (€). null = non renseigné. */
  commission_montant?: number | null
}

async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return { supabase, session }
}

// ─── Check si un email/tel est signalé par la communauté ────────────────
// Utilisé à la création d'un voyageur pour alerter le hôte avant ajout
export async function checkVoyageurSignale(input: { email?: string | null; telephone?: string | null }): Promise<{
  signale: boolean
  count?: number
  motifs?: string[]
}> {
  const { supabase, session } = await getSession()
  if (!session) return { signale: false }

  const identifiers: string[] = []
  if (input.email?.trim()) identifiers.push(input.email.trim().toLowerCase())
  if (input.telephone?.trim()) identifiers.push(input.telephone.trim())
  if (identifiers.length === 0) return { signale: false }

  const { data } = await supabase
    .from('reported_guests')
    .select('incident_type')
    .in('identifier', identifiers)
    .eq('is_validated', true)
    .limit(10)

  if (!data || data.length === 0) return { signale: false }
  const motifs = Array.from(new Set(data.map((r: any) => r.incident_type as string).filter(Boolean)))
  return { signale: true, count: data.length, motifs }
}

// ─── Voyageurs ────────────────────────────────────────────────────────────────

export async function addVoyageur(data: VoyageurData): Promise<{ id?: string; error?: string }> {
  const { supabase, session } = await getSession()
  if (!session) return { error: 'Non authentifié.' }

  const { data: row, error } = await supabase
    .from('voyageurs')
    .insert({ ...data, user_id: session.user.id })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/voyageurs')
  return { id: row.id }
}

export async function updateVoyageur(id: string, data: VoyageurData): Promise<{ error?: string }> {
  const { supabase, session } = await getSession()
  if (!session) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('voyageurs')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) return { error: error.message }
  // La nationalité vient (peut-être) d'être renseignée : c'est le déclencheur
  // typique pour les résas Airbnb/Booking sans contrat — on rattrape les
  // séjours récents/à venir de ce voyageur.
  if (data.nationalite) await syncDeclarations(supabase, session.user.id, id)
  revalidatePath('/dashboard/voyageurs')
  revalidatePath(`/dashboard/voyageurs/${id}`)
  return {}
}

export async function deleteVoyageur(id: string): Promise<{ error?: string }> {
  const { supabase, session } = await getSession()
  if (!session) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('voyageurs')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/voyageurs')
  return {}
}

// ─── Séjours ──────────────────────────────────────────────────────────────────

export async function addSejour(data: SejourData): Promise<{ id?: string; error?: string }> {
  const { supabase, session } = await getSession()
  if (!session) return { error: 'Non authentifié.' }

  const { data: row, error } = await supabase
    .from('sejours')
    .insert({ ...data, user_id: session.user.id })
    .select('id')
    .single()

  if (error) return { error: error.message }
  await syncDeclarations(supabase, session.user.id, data.voyageur_id)
  revalidatePath(`/dashboard/voyageurs/${data.voyageur_id}`)
  return { id: row.id }
}

export async function updateSejour(
  id: string,
  voyageurId: string,
  data: Partial<SejourData>
): Promise<{ error?: string }> {
  const { supabase, session } = await getSession()
  if (!session) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('sejours')
    .update(data)
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) return { error: error.message }
  await syncDeclarations(supabase, session.user.id, voyageurId)
  revalidatePath(`/dashboard/voyageurs/${voyageurId}`)
  return {}
}

export async function deleteSejour(id: string, voyageurId: string): Promise<{ error?: string }> {
  const { supabase, session } = await getSession()
  if (!session) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('sejours')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/voyageurs/${voyageurId}`)
  return {}
}

// ─── Annulation de séjour (sans suppression) ─────────────────────────────────
// Le séjour reste dans l'historique du voyageur avec un badge « Annulé »,
// mais sort de tous les décomptes (CA, calendrier, iCal, notifications).

export async function cancelSejour(id: string, voyageurId: string): Promise<{ error?: string }> {
  const { supabase, session } = await getSession()
  if (!session) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('sejours')
    .update({ annule_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', session.user.id)
  if (error) return { error: error.message }

  // La déclaration voyageur en attente pour ce séjour n'a plus lieu d'être
  // (best-effort — statut réversible en DB si le séjour est rétabli).
  try {
    await supabase
      .from('guest_declarations')
      .update({ statut: 'ignoree' })
      .eq('sejour_id', id)
      .eq('user_id', session.user.id)
      .eq('statut', 'a_faire')
  } catch { /* best-effort */ }

  revalidatePath(`/dashboard/voyageurs/${voyageurId}`)
  revalidatePath('/dashboard')
  return {}
}

export async function restoreSejour(id: string, voyageurId: string): Promise<{ error?: string }> {
  const { supabase, session } = await getSession()
  if (!session) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('sejours')
    .update({ annule_at: null })
    .eq('id', id)
    .eq('user_id', session.user.id)
  if (error) return { error: error.message }

  // Réactive la déclaration ignorée à l'annulation (l'index unique par
  // sejour_id empêche syncDeclarations d'en recréer une) — uniquement si
  // l'arrivée n'est pas passée.
  try {
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('guest_declarations')
      .update({ statut: 'a_faire' })
      .eq('sejour_id', id)
      .eq('user_id', session.user.id)
      .eq('statut', 'ignoree')
      .gte('date_arrivee', today)
  } catch { /* best-effort */ }
  // Et couvre le cas où aucune déclaration n'existait encore
  await syncDeclarations(supabase, session.user.id, voyageurId)
  revalidatePath(`/dashboard/voyageurs/${voyageurId}`)
  revalidatePath('/dashboard')
  return {}
}

// ─── Check-in en ligne (inspiré Partee) ──────────────────────────────────────
// Génère (idempotent) le lien public /checkin/[token] que l'hôte envoie au
// voyageur pour qu'il remplisse lui-même son identité avant l'arrivée.

export async function generateCheckinLink(voyageurId: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  // getUser() : valide le JWT côté serveur (règle sécurité server actions)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  // Token existant → on le réutilise (le lien déjà envoyé reste valable)
  const { data: v, error: readErr } = await supabase
    .from('voyageurs')
    .select('checkin_token')
    .eq('id', voyageurId)
    .eq('user_id', user.id)
    .single()
  if (readErr || !v) return { error: 'Voyageur introuvable.' }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'
  if (v.checkin_token) return { url: `${appUrl}/checkin/${v.checkin_token}` }

  const { randomBytes } = await import('crypto')
  const token = randomBytes(24).toString('base64url')

  const { error } = await supabase
    .from('voyageurs')
    .update({ checkin_token: token, checkin_sent_at: new Date().toISOString() })
    .eq('id', voyageurId)
    .eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath(`/dashboard/voyageurs/${voyageurId}`)
  return { url: `${appUrl}/checkin/${token}` }
}
