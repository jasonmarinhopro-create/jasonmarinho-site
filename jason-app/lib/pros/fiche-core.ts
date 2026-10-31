import 'server-only'
// Tronc commun des espaces pros (31/10/2026, projet « Dépannage et
// maintenance », docs/claude/projet-maintenance.md). Les actions de Ma fiche
// (brouillon, mise en ligne, logo, photos, demandes reçues, carnet clients,
// abonnement) sont les mêmes pour tous les métiers : une seule version ici,
// paramétrée par le registre (lib/pros/metiers.ts). Chaque espace garde un
// petit fichier « use server » qui appelle ces fonctions avec son métier et
// ses champs propres (applyFiche).
//
// Accès : le pro connecté agit sur sa propre fiche ; un admin peut viser une
// fiche précise (targetId). Toutes les écritures passent par le client service
// avec un filtre explicite sur l'identifiant de la fiche résolue.

import { revalidatePath } from 'next/cache'
import { getServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { logger } from '@/lib/logger'
import { triggerSiteRebuild } from '@/lib/pros/site-rebuild'
import * as draftServer from '@/lib/pros/fiche-draft-server'
import * as vitrine from '@/lib/pros/fiche-vitrine-server'
import { villeCasse } from '@/lib/pros/fiche-vitrine'
import { METIERS, type ProKind } from '@/lib/pros/metiers'

const log = logger('lib/pros/fiche-core')
const APP_URL = 'https://app.jasonmarinho.com'

export type Target = { proId: string; isAdminEdit: boolean }
export type Res = { success?: boolean; error?: string }

/** Pro connecté → sa propre fiche ; admin avec targetId → la fiche désignée. */
export async function resolveTarget(kind: ProKind, targetId?: string): Promise<Target | { error: string }> {
  const m = METIERS[kind]
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }
  const admin = getServiceClient()

  if (targetId) {
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (profile?.role === 'admin') {
      const { data: target } = await admin.from(m.table).select('id').eq('id', targetId).maybeSingle()
      if (!target) return { error: 'Fiche introuvable.' }
      return { proId: target.id as string, isAdminEdit: true }
    }
  }

  const { data: own } = await admin.from(m.table).select('id').eq('user_id', user.id).maybeSingle()
  if (!own) return { error: 'Aucune fiche rattachée à ce compte.' }
  return { proId: own.id as string, isAdminEdit: false }
}

function revalidateEspace(kind: ProKind, sub = '') {
  revalidatePath(`${METIERS[kind].espace}${sub}`)
}

// ─── Brouillon et mise en ligne (atelier, 27/10/2026) ───────────────

export async function saveDraft(kind: ProKind, draft: unknown, targetId?: string): Promise<{ ok?: boolean; reason?: string; error?: string }> {
  const target = await resolveTarget(kind, targetId)
  if ('error' in target) return { error: target.error }
  const res = await draftServer.saveDraft(METIERS[kind].table, target.proId, draft)
  return res.ok ? { ok: true } : { reason: res.reason }
}

export type ApplyResult = { success?: boolean; error?: string; warning?: string; adminEdit?: boolean }

/**
 * « Mettre en ligne » : apply écrit les champs (vérifiés par l'espace), puis le
 * brouillon est vidé et le site reconstruit une fois si la fiche est active.
 */
export async function publish(
  kind: ProKind,
  apply: (target: Target) => Promise<ApplyResult>,
  targetId?: string,
): Promise<ApplyResult & { live?: boolean; rebuildFailed?: boolean }> {
  const m = METIERS[kind]
  const target = await resolveTarget(kind, targetId)
  if ('error' in target) return { error: target.error }
  const res = await apply(target)
  if (!res.success) return res
  await draftServer.clearDraft(m.table, target.proId)
  const { data } = await getServiceClient().from(m.table).select('status').eq('id', target.proId).maybeSingle()
  const live = data?.status === 'active'
  const rebuilt = live ? await triggerSiteRebuild(`fiche ${m.slug}`) : true
  revalidateEspace(kind)
  return { ...res, adminEdit: target.isAdminEdit, live, rebuildFailed: !rebuilt }
}

// ─── Logo (carré, 500 Ko au plus, JPEG/PNG/WebP) ────────────────────

const LOGO_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

export async function uploadLogo(kind: ProKind, formData: FormData): Promise<{ success?: boolean; url?: string; error?: string }> {
  const m = METIERS[kind]
  const target = await resolveTarget(kind, (formData.get('targetId') as string | null) ?? undefined)
  if ('error' in target) return { error: target.error }

  const file = formData.get('logo') as File | null
  if (!file || file.size === 0) return { error: 'Aucun fichier.' }
  if (file.size > 524288) return { error: 'Fichier trop lourd (max 500 KB).' }
  const ext = LOGO_EXT[file.type]
  if (!ext) return { error: 'Format invalide. Accepté : JPEG, PNG, WebP.' }

  const admin = getServiceClient()
  const path = `${target.proId}/avatar.${ext}`
  const { error: uploadErr } = await admin.storage.from('pro-logos').upload(path, file, { contentType: file.type, upsert: true })
  if (uploadErr) { log.error('envoi du logo', { err: uploadErr.message }); return { error: 'Upload échoué.' } }
  const { data: pub } = admin.storage.from('pro-logos').getPublicUrl(path)
  const url = `${pub.publicUrl}?v=${Date.now()}`
  const { error } = await admin.from(m.table).update({ logo_url: url, updated_at: new Date().toISOString() }).eq('id', target.proId)
  if (error) { log.error('logo_url', { err: error.message }); return { error: 'Erreur lors de la sauvegarde.' } }
  // Pas de reconstruction : le logo part avec « Mettre en ligne »
  revalidateEspace(kind)
  return { success: true, url }
}

export async function deleteLogo(kind: ProKind, targetId?: string): Promise<Res> {
  const target = await resolveTarget(kind, targetId)
  if ('error' in target) return { error: target.error }
  await getServiceClient().from(METIERS[kind].table).update({ logo_url: null, updated_at: new Date().toISOString() }).eq('id', target.proId)
  revalidateEspace(kind)
  return { success: true }
}

// ─── Photos de la fiche ─────────────────────────────────────────────

export async function preparePhotos(kind: ProKind, count: number, targetId?: string) {
  const target = await resolveTarget(kind, targetId)
  if ('error' in target) return { error: target.error }
  return vitrine.preparePhotoUploads(METIERS[kind].table, target.proId, count)
}

export async function addPhotos(kind: ProKind, paths: string[], targetId?: string) {
  const target = await resolveTarget(kind, targetId)
  if ('error' in target) return { error: target.error }
  return vitrine.addPhotos(METIERS[kind].table, target.proId, paths)
}

export async function removePhoto(kind: ProKind, path: string, targetId?: string) {
  const target = await resolveTarget(kind, targetId)
  if ('error' in target) return { error: target.error }
  return vitrine.removePhoto(METIERS[kind].table, target.proId, path)
}

export async function movePhoto(kind: ProKind, path: string, dir: -1 | 1, targetId?: string) {
  const target = await resolveTarget(kind, targetId)
  if ('error' in target) return { error: target.error }
  return vitrine.movePhoto(METIERS[kind].table, target.proId, path, dir)
}

export async function publishPhotos(kind: ProKind, targetId?: string) {
  const target = await resolveTarget(kind, targetId)
  if ('error' in target) return { error: target.error }
  return vitrine.publishPhotos(METIERS[kind].table)
}

// ─── Abonnement ─────────────────────────────────────────────────────

export async function portalSession(kind: ProKind, targetId?: string): Promise<{ url?: string; error?: string }> {
  const m = METIERS[kind]
  const target = await resolveTarget(kind, targetId)
  if ('error' in target) return { error: target.error }
  const { data } = await getServiceClient().from(m.table).select('stripe_customer_id').eq('id', target.proId).maybeSingle()
  if (!data?.stripe_customer_id) return { error: 'Abonnement Stripe non encore initialisé.' }
  try {
    const session = await stripe.billingPortal.sessions.create({ customer: data.stripe_customer_id as string, return_url: `${APP_URL}${m.espace}` })
    return { url: session.url }
  } catch (e) {
    log.error('portail Stripe', { err: e instanceof Error ? e.message : String(e) })
    return { error: 'Impossible de créer la session de gestion d\'abonnement.' }
  }
}

export async function resumePayment(kind: ProKind, targetId?: string) {
  const { resumeProCheckout } = await import('@/lib/pros/resume-checkout')
  return resumeProCheckout(kind, targetId)
}

// ─── Demandes reçues (bouton « Contacter ») ─────────────────────────

const CONTACT_STATUS = ['nouvelle', 'repondue', 'devis_envoye', 'gagnee', 'perdue']

export async function updateContactStatus(kind: ProKind, contactId: string, status: string, targetId?: string): Promise<Res> {
  if (!CONTACT_STATUS.includes(status)) return { error: 'Statut invalide.' }
  const m = METIERS[kind]
  const target = await resolveTarget(kind, targetId)
  if ('error' in target) return { error: target.error }
  const { error } = await getServiceClient().from(m.contactsTable).update({ status }).eq('id', contactId).eq(m.idColumn, target.proId)
  if (error) { log.error('statut de la demande', { err: error.message }); return { error: 'Mise à jour impossible. Réessaie.' } }
  revalidateEspace(kind)
  return { success: true }
}

export async function updateContactNotes(kind: ProKind, contactId: string, notes: string, targetId?: string): Promise<Res> {
  const m = METIERS[kind]
  const target = await resolveTarget(kind, targetId)
  if ('error' in target) return { error: target.error }
  const { error } = await getServiceClient().from(m.contactsTable)
    .update({ pro_notes: String(notes ?? '').slice(0, 2000) || null })
    .eq('id', contactId).eq(m.idColumn, target.proId)
  if (error) { log.error('notes de la demande', { err: error.message }); return { error: 'Enregistrement impossible. Réessaie.' } }
  revalidateEspace(kind)
  return { success: true }
}

export async function deleteContact(kind: ProKind, contactId: string, targetId?: string): Promise<Res> {
  const m = METIERS[kind]
  const target = await resolveTarget(kind, targetId)
  if ('error' in target) return { error: target.error }
  const { error } = await getServiceClient().from(m.contactsTable).delete().eq('id', contactId).eq(m.idColumn, target.proId)
  if (error) { log.error('suppression de la demande', { err: error.message }); return { error: 'Suppression impossible. Réessaie.' } }
  revalidateEspace(kind, '/demandes')
  return { success: true }
}

// ─── Carnet clients (pro_clients) ───────────────────────────────────

export type ProClientInput = {
  nom: string
  email?: string
  telephone?: string
  ville?: string
  logement?: string
  statut?: string
  notes?: string
}

export function sanitizeClientInput(data: ProClientInput) {
  const statut = ['prospect', 'client', 'fidele'].includes(data.statut ?? '') ? data.statut : 'prospect'
  return {
    nom: String(data.nom ?? '').trim().slice(0, 120),
    email: String(data.email ?? '').trim().slice(0, 200) || null,
    telephone: String(data.telephone ?? '').trim().slice(0, 40) || null,
    ville: villeCasse(String(data.ville ?? '').slice(0, 100)) || null,
    logement: String(data.logement ?? '').trim().slice(0, 200) || null,
    statut,
    notes: String(data.notes ?? '').trim().slice(0, 3000) || null,
  }
}

export async function createClientRow(kind: ProKind, data: ProClientInput, targetId?: string): Promise<{ id?: string; error?: string }> {
  const target = await resolveTarget(kind, targetId)
  if ('error' in target) return { error: target.error }
  const clean = sanitizeClientInput(data)
  if (!clean.nom) return { error: 'Le nom est obligatoire.' }
  const { data: row, error } = await getServiceClient().from('pro_clients')
    .insert({ owner_kind: kind, owner_id: target.proId, ...clean }).select('id').single()
  if (error) { log.error('nouveau client', { err: error.message }); return { error: 'Enregistrement impossible. Réessaie.' } }
  revalidateEspace(kind, '/clients')
  return { id: row.id as string }
}

export async function updateClientRow(kind: ProKind, clientId: string, data: ProClientInput, targetId?: string): Promise<Res> {
  const target = await resolveTarget(kind, targetId)
  if ('error' in target) return { error: target.error }
  const clean = sanitizeClientInput(data)
  if (!clean.nom) return { error: 'Le nom est obligatoire.' }
  const { error } = await getServiceClient().from('pro_clients').update(clean)
    .eq('id', clientId).eq('owner_kind', kind).eq('owner_id', target.proId)
  if (error) { log.error('client modifié', { err: error.message }); return { error: 'Mise à jour impossible. Réessaie.' } }
  revalidateEspace(kind, '/clients')
  return { success: true }
}

export async function deleteClientRow(kind: ProKind, clientId: string, targetId?: string): Promise<Res> {
  const target = await resolveTarget(kind, targetId)
  if ('error' in target) return { error: target.error }
  const { error } = await getServiceClient().from('pro_clients').delete()
    .eq('id', clientId).eq('owner_kind', kind).eq('owner_id', target.proId)
  if (error) { log.error('client supprimé', { err: error.message }); return { error: 'Suppression impossible. Réessaie.' } }
  revalidateEspace(kind, '/clients')
  return { success: true }
}

/** Demande reçue → client du carnet (dédoublonné par e-mail) */
export async function clientFromContact(kind: ProKind, contactId: string, targetId?: string): Promise<{ id?: string; already?: boolean; error?: string }> {
  const m = METIERS[kind]
  const target = await resolveTarget(kind, targetId)
  if ('error' in target) return { error: target.error }
  const admin = getServiceClient()
  const { data: contact } = await admin.from(m.contactsTable)
    .select('id, contact_name, contact_email, contact_phone, message')
    .eq('id', contactId).eq(m.idColumn, target.proId).maybeSingle()
  if (!contact) return { error: 'Demande introuvable.' }

  if (contact.contact_email) {
    const { data: existing } = await admin.from('pro_clients').select('id')
      .eq('owner_kind', kind).eq('owner_id', target.proId).eq('email', contact.contact_email).maybeSingle()
    if (existing) return { id: existing.id as string, already: true }
  }

  const { data: row, error } = await admin.from('pro_clients').insert({
    owner_kind: kind,
    owner_id: target.proId,
    nom: contact.contact_name || contact.contact_email || 'Hôte',
    email: contact.contact_email,
    telephone: contact.contact_phone ?? null,
    notes: contact.message ? `Demande initiale : ${String(contact.message).slice(0, 500)}` : null,
    source_contact_id: contact.id,
  }).select('id').single()
  if (error) { log.error('demande vers client', { err: error.message }); return { error: 'Conversion impossible. Réessaie.' } }
  revalidateEspace(kind, '/clients')
  return { id: row.id as string }
}
