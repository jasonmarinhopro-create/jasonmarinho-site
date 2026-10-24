'use server'

import { getServiceClient } from '@/lib/supabase/service'
import { readClienteles } from '@/lib/pros/clienteles'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import { triggerSiteRebuild } from '@/lib/pros/site-rebuild'
import { cleanReseaux } from '@/lib/pros/reseaux'
import { readMetier, readOptions, normalizeVideoUrl } from '@/lib/pros/visuel'
import { cleanFormules, cleanVilles, cleanDeroule } from '@/lib/pros/fiche-vitrine'
import * as vitrine from '@/lib/pros/fiche-vitrine-server'
import { normSiteUrl, siteUrlOk, SITE_URL_ERROR } from '@/lib/pros/site-url'

const log = logger('ma-fiche-photographe/actions')

/**
 * Résout la fiche cible :
 * - Photographe connecté : sa propre fiche (via user_id)
 * - Admin avec targetId : la fiche désignée (édition pour le compte du pro)
 * - Autre cas : erreur
 */
async function resolveTargetFiche(targetId?: string): Promise<
  { photographerId: string; isAdminEdit: boolean } | { error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = getServiceClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const isAdmin = profile?.role === 'admin'

  // Mode admin : si targetId fourni et user admin → édition pour le compte du pro
  if (targetId && isAdmin) {
    const { data: target } = await admin
      .from('photographers')
      .select('id')
      .eq('id', targetId)
      .maybeSingle()
    if (!target) return { error: 'Photographe cible introuvable.' }
    return { photographerId: target.id, isAdminEdit: true }
  }

  // Mode standard : le pro édite sa propre fiche
  const { data: ph } = await admin
    .from('photographers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!ph) return { error: 'Aucune fiche photographe rattachée à ce compte.' }
  return { photographerId: ph.id, isAdminEdit: false }
}

/**
 * Met à jour une fiche photographe. Le pro met à jour sa propre fiche ;
 * un admin peut éditer la fiche de n'importe quel pro en passant targetId.
 * L'email et le user_id ne sont pas modifiables (clé d'identité auth).
 * Le slug n'est pas regénéré (préserve les liens SEO).
 */
export async function updatePhotographerFiche(payload: {
  targetId?: string
  full_name?: string
  ville?: string
  zone_couverte?: string | null
  bio?: string | null
  specialite?: string | null
  tarif_min?: number | null
  tarif_max?: number | null
  portfolio_url?: string
  instagram_handle?: string | null
  telephone?: string | null
  telephone_public?: boolean
  clienteles?: string[]
  reseaux?: Record<string, string>
  formules?: unknown
  villes_couvertes?: unknown
  deroule?: unknown
  metier?: string
  options?: string[]
  video_url?: string | null
}): Promise<{ success?: boolean; error?: string; warning?: string; adminEdit?: boolean }> {
  const target = await resolveTargetFiche(payload.targetId)
  if ('error' in target) return { error: target.error }
  // Réseaux et fiche Google : liens vérifiés (lib/pros/reseaux.ts)
  const reseaux = cleanReseaux(payload.reseaux)
  if (reseaux.errors.length) return { error: reseaux.errors[0] }

  const fullName = String(payload.full_name || '').trim().slice(0, 100)
  const ville = String(payload.ville || '').trim().slice(0, 80)
  const portfolioUrl = normSiteUrl(payload.portfolio_url)
  // Portfolio facultatif depuis l'inscription tout en une fois (24/10/2026) : les photos de la fiche suffisent
  if (!fullName || !ville) {
    return { error: 'Nom et ville sont obligatoires.' }
  }
  if (portfolioUrl && !siteUrlOk(portfolioUrl)) {
    return { error: `Ton site ou ton portfolio : ${SITE_URL_ERROR}.` }
  }

  const video = normalizeVideoUrl(payload.video_url)
  if (video.error) return { error: video.error }

  const admin = getServiceClient()
  const fields = {
    full_name: fullName,
    ville,
    zone_couverte: (payload.zone_couverte ?? '').toString().trim().slice(0, 200) || null,
    bio: (payload.bio ?? '').toString().trim().slice(0, 600) || null,
    specialite: (payload.specialite ?? '').toString().trim().slice(0, 100) || null,
    tarif_min: payload.tarif_min ?? null,
    tarif_max: payload.tarif_max ?? null,
    portfolio_url: portfolioUrl || '',
    instagram_handle: (payload.instagram_handle ?? '').toString().trim().slice(0, 50).replace(/^@/, '') || null,
    telephone: (payload.telephone ?? '').toString().trim().slice(0, 30) || null,
    updated_at: new Date().toISOString(),
  }
  // Formules, villes couvertes, déroulé (migration 131)
  const vitrineFields = {
    formules: cleanFormules(payload.formules),
    villes_couvertes: cleanVilles(payload.villes_couvertes),
    deroule: cleanDeroule(payload.deroule, 'photographe'),
    // Photographe / vidéaste, options, lien vidéo (migration 136)
    metier: readMetier(payload.metier),
    options: readOptions(payload.options),
    video_url: video.url,
  }
  let { error: updateErr } = await admin
    .from('photographers')
    .update({ ...fields, reseaux: reseaux.value, ...vitrineFields })
    .eq('id', target.photographerId)
  // Migration 125 pas encore appliquée : on enregistre le reste
  let warning: string | undefined
  if (updateErr && /reseaux|formules|villes_couvertes|deroule|metier|options|video_url/.test(`${updateErr.message} ${updateErr.details ?? ''}`)) {
    ({ error: updateErr } = await admin.from('photographers').update(fields).eq('id', target.photographerId))
    if (!updateErr) warning = 'Fiche enregistrée, sauf tes réseaux, formules, villes, étapes et vidéos : ils arrivent dans quelques heures, réessaie plus tard.'
  }

  if (updateErr) {
    log.error('update failed', updateErr)
    return { error: 'Erreur lors de la sauvegarde.' }
  }
  // Téléphone affiché sur la fiche (migration 153) : à part, sans bloquer si la colonne manque
  // Clientèles (migration 154) : même principe
  await admin.from('photographers').update({ telephone_public: !!payload.telephone_public && !!fields.telephone }).eq('id', target.photographerId)
  if (Array.isArray(payload.clienteles)) await admin.from('photographers').update({ clienteles: readClienteles(payload.clienteles) }).eq('id', target.photographerId)

  await triggerSiteRebuild('fiche photographe')

  revalidatePath('/dashboard/ma-fiche-photographe')
  if (target.isAdminEdit) revalidatePath('/dashboard/admin/photographes')
  return { success: true, warning, adminEdit: target.isAdminEdit }
}

/**
 * Upload du logo via FormData. File au format jpeg/png/webp, max 500 KB.
 * Stocké dans le bucket pro-logos sous {photographerId}/avatar.{ext}.
 * Met à jour photographers.logo_url.
 */
export async function uploadPhotographerLogo(formData: FormData): Promise<{ success?: boolean; url?: string; error?: string }> {
  const targetId = formData.get('targetId') as string | null
  const target = await resolveTargetFiche(targetId ?? undefined)
  if ('error' in target) return { error: target.error }

  const file = formData.get('logo') as File | null
  if (!file || file.size === 0) return { error: 'Aucun fichier.' }
  if (file.size > 524288) return { error: 'Fichier trop lourd (max 500 KB).' }
  const mime = file.type
  const validExt: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
  if (!validExt[mime]) return { error: 'Format invalide. Accepté : JPEG, PNG, WebP.' }
  const ext = validExt[mime]

  const admin = getServiceClient()
  const path = `${target.photographerId}/avatar.${ext}`
  const { error: uploadErr } = await admin.storage
    .from('pro-logos')
    .upload(path, file, { contentType: mime, upsert: true })
  if (uploadErr) {
    log.error('upload logo failed', uploadErr)
    return { error: 'Upload échoué.' }
  }
  const { data: pub } = admin.storage.from('pro-logos').getPublicUrl(path)
  // Cache buster pour forcer le refetch après chaque update
  const url = `${pub.publicUrl}?v=${Date.now()}`

  const { error: updateErr } = await admin
    .from('photographers')
    .update({ logo_url: url, updated_at: new Date().toISOString() })
    .eq('id', target.photographerId)
  if (updateErr) {
    log.error('update logo_url failed', updateErr)
    return { error: 'Erreur lors de la sauvegarde.' }
  }

  await triggerSiteRebuild('fiche photographe')

  revalidatePath('/dashboard/ma-fiche-photographe')
  return { success: true, url }
}

/**
 * Supprime le logo. Le bucket conserve le fichier physique (cleanup
 * cron éventuel) mais photographers.logo_url repasse à null.
 */
export async function deletePhotographerLogo(targetId?: string): Promise<{ success?: boolean; error?: string }> {
  const target = await resolveTargetFiche(targetId)
  if ('error' in target) return { error: target.error }
  const admin = getServiceClient()
  await admin.from('photographers').update({ logo_url: null, updated_at: new Date().toISOString() }).eq('id', target.photographerId)
  await triggerSiteRebuild('fiche photographe')
  revalidatePath('/dashboard/ma-fiche-photographe')
  return { success: true }
}

/**
 * Crée une session Stripe Customer Portal. Admin peut aussi ouvrir le
 * portail d'un autre pro (support).
 */
export async function createCustomerPortalSession(targetId?: string): Promise<{ url?: string; error?: string }> {
  const target = await resolveTargetFiche(targetId)
  if ('error' in target) return { error: target.error }

  const admin = getServiceClient()
  const { data: ph } = await admin
    .from('photographers')
    .select('stripe_customer_id, email')
    .eq('id', target.photographerId)
    .maybeSingle()
  if (!ph?.stripe_customer_id) return { error: 'Abonnement Stripe non encore initialisé.' }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: ph.stripe_customer_id,
      return_url: 'https://app.jasonmarinho.com/dashboard/ma-fiche-photographe',
    })
    return { url: session.url }
  } catch (e) {
    log.error('billing portal create failed', e)
    return { error: 'Impossible de créer la session de gestion d\'abonnement.' }
  }
}

/**
 * Demandes reçues : met à jour le statut pipeline d'une demande
 * (nouvelle → répondue → devis envoyé → gagnée/perdue).
 */
export async function updateContactStatus(
  contactId: string,
  status: string,
  targetId?: string,
): Promise<{ success?: boolean; error?: string }> {
  const VALID = ['nouvelle', 'repondue', 'devis_envoye', 'gagnee', 'perdue']
  if (!VALID.includes(status)) return { error: 'Statut invalide.' }

  const target = await resolveTargetFiche(targetId)
  if ('error' in target) return { error: target.error }

  const admin = getServiceClient()
  const { error } = await admin
    .from('photographer_contacts')
    .update({ status })
    .eq('id', contactId)
    .eq('photographer_id', target.photographerId)
  if (error) {
    log.error('updateContactStatus failed', { error: error.message })
    return { error: 'Mise à jour impossible. Réessaie.' }
  }
  revalidatePath('/dashboard/ma-fiche-photographe')
  return { success: true }
}

/**
 * Demandes reçues : notes privées du pro sur une demande (devis, relances…).
 */
export async function updateContactNotes(
  contactId: string,
  notes: string,
  targetId?: string,
): Promise<{ success?: boolean; error?: string }> {
  const target = await resolveTargetFiche(targetId)
  if ('error' in target) return { error: target.error }

  const admin = getServiceClient()
  const { error } = await admin
    .from('photographer_contacts')
    .update({ pro_notes: String(notes ?? '').slice(0, 2000) || null })
    .eq('id', contactId)
    .eq('photographer_id', target.photographerId)
  if (error) {
    log.error('updateContactNotes failed', { error: error.message })
    return { error: 'Enregistrement impossible. Réessaie.' }
  }
  revalidatePath('/dashboard/ma-fiche-photographe')
  return { success: true }
}

/**
 * Demandes reçues : suppression d'une demande par le pro.
 */
export async function deleteContact(
  contactId: string,
  targetId?: string,
): Promise<{ success?: boolean; error?: string }> {
  const target = await resolveTargetFiche(targetId)
  if ('error' in target) return { error: target.error }

  const admin = getServiceClient()
  const { error } = await admin
    .from('photographer_contacts')
    .delete()
    .eq('id', contactId)
    .eq('photographer_id', target.photographerId)
  if (error) {
    log.error('deleteContact failed', { error: error.message })
    return { error: 'Suppression impossible. Réessaie.' }
  }
  revalidatePath('/dashboard/ma-fiche-photographe/demandes')
  return { success: true }
}

// ── Mini-CRM "Mes clients" ─────────────────────────────────────────

type ProClientInput = {
  nom: string
  email?: string
  telephone?: string
  ville?: string
  logement?: string
  statut?: string
  notes?: string
}

function sanitizeClientInput(data: ProClientInput) {
  const statut = ['prospect', 'client', 'fidele'].includes(data.statut ?? '') ? data.statut : 'prospect'
  return {
    nom: String(data.nom ?? '').trim().slice(0, 120),
    email: String(data.email ?? '').trim().slice(0, 200) || null,
    telephone: String(data.telephone ?? '').trim().slice(0, 40) || null,
    ville: String(data.ville ?? '').trim().slice(0, 100) || null,
    logement: String(data.logement ?? '').trim().slice(0, 200) || null,
    statut,
    notes: String(data.notes ?? '').trim().slice(0, 3000) || null,
  }
}

export async function createProClient(
  data: ProClientInput,
  targetId?: string,
): Promise<{ id?: string; error?: string }> {
  const target = await resolveTargetFiche(targetId)
  if ('error' in target) return { error: target.error }

  const clean = sanitizeClientInput(data)
  if (!clean.nom) return { error: 'Le nom est obligatoire.' }

  const admin = getServiceClient()
  const { data: row, error } = await admin
    .from('pro_clients')
    .insert({ owner_kind: 'photographer', owner_id: target.photographerId, ...clean })
    .select('id')
    .single()
  if (error) {
    log.error('createProClient failed', { error: error.message })
    return { error: 'Enregistrement impossible. Réessaie.' }
  }
  revalidatePath('/dashboard/ma-fiche-photographe/clients')
  return { id: row.id }
}

export async function updateProClient(
  clientId: string,
  data: ProClientInput,
  targetId?: string,
): Promise<{ success?: boolean; error?: string }> {
  const target = await resolveTargetFiche(targetId)
  if ('error' in target) return { error: target.error }

  const clean = sanitizeClientInput(data)
  if (!clean.nom) return { error: 'Le nom est obligatoire.' }

  const admin = getServiceClient()
  const { error } = await admin
    .from('pro_clients')
    .update(clean)
    .eq('id', clientId)
    .eq('owner_kind', 'photographer')
    .eq('owner_id', target.photographerId)
  if (error) {
    log.error('updateProClient failed', { error: error.message })
    return { error: 'Mise à jour impossible. Réessaie.' }
  }
  revalidatePath('/dashboard/ma-fiche-photographe/clients')
  return { success: true }
}

export async function deleteProClient(
  clientId: string,
  targetId?: string,
): Promise<{ success?: boolean; error?: string }> {
  const target = await resolveTargetFiche(targetId)
  if ('error' in target) return { error: target.error }

  const admin = getServiceClient()
  const { error } = await admin
    .from('pro_clients')
    .delete()
    .eq('id', clientId)
    .eq('owner_kind', 'photographer')
    .eq('owner_id', target.photographerId)
  if (error) {
    log.error('deleteProClient failed', { error: error.message })
    return { error: 'Suppression impossible. Réessaie.' }
  }
  revalidatePath('/dashboard/ma-fiche-photographe/clients')
  return { success: true }
}

/**
 * Convertit une demande reçue en client du carnet (nom + email repris,
 * lien source conservé). Dédupliqué par email si déjà présent.
 */
export async function addClientFromContact(
  contactId: string,
  targetId?: string,
): Promise<{ id?: string; already?: boolean; error?: string }> {
  const target = await resolveTargetFiche(targetId)
  if ('error' in target) return { error: target.error }

  const admin = getServiceClient()
  const { data: contact } = await admin
    .from('photographer_contacts')
    .select('id, contact_name, contact_email, message')
    .eq('id', contactId)
    .eq('photographer_id', target.photographerId)
    .maybeSingle()
  if (!contact) return { error: 'Demande introuvable.' }

  // Déduplication par email dans le carnet du pro
  if (contact.contact_email) {
    const { data: existing } = await admin
      .from('pro_clients')
      .select('id')
      .eq('owner_kind', 'photographer')
      .eq('owner_id', target.photographerId)
      .eq('email', contact.contact_email)
      .maybeSingle()
    if (existing) return { id: existing.id, already: true }
  }

  const { data: row, error } = await admin
    .from('pro_clients')
    .insert({
      owner_kind: 'photographer',
      owner_id: target.photographerId,
      nom: contact.contact_name || contact.contact_email || 'Hôte',
      email: contact.contact_email,
      notes: contact.message ? `Demande initiale : ${String(contact.message).slice(0, 500)}` : null,
      source_contact_id: contact.id,
    })
    .select('id')
    .single()
  if (error) {
    log.error('addClientFromContact failed', { error: error.message })
    return { error: 'Conversion impossible. Réessaie.' }
  }
  revalidatePath('/dashboard/ma-fiche-photographe/clients')
  return { id: row.id }
}

// ─── Photos de la fiche (migration 131, lib/pros/fiche-vitrine-server.ts) ───

export async function prepareFichePhotos(count: number, targetId?: string) {
  const target = await resolveTargetFiche(targetId)
  if ('error' in target) return { error: target.error }
  return vitrine.preparePhotoUploads('photographers', target.photographerId, count)
}

export async function addFichePhotos(paths: string[], targetId?: string) {
  const target = await resolveTargetFiche(targetId)
  if ('error' in target) return { error: target.error }
  return vitrine.addPhotos('photographers', target.photographerId, paths)
}

export async function removeFichePhoto(path: string, targetId?: string) {
  const target = await resolveTargetFiche(targetId)
  if ('error' in target) return { error: target.error }
  return vitrine.removePhoto('photographers', target.photographerId, path)
}

export async function moveFichePhoto(path: string, dir: -1 | 1, targetId?: string) {
  const target = await resolveTargetFiche(targetId)
  if ('error' in target) return { error: target.error }
  return vitrine.movePhoto('photographers', target.photographerId, path, dir)
}

/** Met les photos en ligne : une seule reconstruction du site */
export async function publishFichePhotos(targetId?: string) {
  const target = await resolveTargetFiche(targetId)
  if ('error' in target) return { error: target.error }
  return vitrine.publishPhotos('photographers')
}

/**
 * Paiement abandonné : rouvre Stripe Checkout pour la fiche déjà enregistrée
 * (bouton « Finaliser mon paiement », lib/pros/resume-checkout.ts).
 */
export async function resumeFichePayment(targetId?: string): Promise<{ checkoutUrl?: string; error?: string; info?: string }> {
  const { resumeProCheckout } = await import('@/lib/pros/resume-checkout')
  return resumeProCheckout('photographer', targetId)
}
