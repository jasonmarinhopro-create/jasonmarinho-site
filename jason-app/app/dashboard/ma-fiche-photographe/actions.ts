'use server'

import { getServiceClient } from '@/lib/supabase/service'
import { readClienteles } from '@/lib/pros/clienteles'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import * as core from '@/lib/pros/fiche-core'
import { cleanReseaux, instaHandle } from '@/lib/pros/reseaux'
import { readMetier, readOptions, normalizeVideoUrl } from '@/lib/pros/visuel'
import { cleanFormules, cleanVilles, cleanDeroule } from '@/lib/pros/fiche-vitrine'
import { normSiteUrl, siteUrlOk, SITE_URL_ERROR } from '@/lib/pros/site-url'

const log = logger('ma-fiche-photographe/actions')

const K = 'photographer' as const
// Tronc commun lib/pros/fiche-core.ts depuis le 31/10/2026 (comme le dépannage) :
// seuls les champs propres au métier sont vérifiés ici (applyFiche).

export type PhotographerPayload = {
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
}

/**
 * Met à jour une fiche photographe. Le pro met à jour sa propre fiche ;
 * un admin peut éditer la fiche de n'importe quel pro en passant targetId.
 * L'email et le user_id ne sont pas modifiables (clé d'identité auth).
 * Le slug n'est pas regénéré (préserve les liens SEO).
 */
async function applyPhotographerFiche(payload: PhotographerPayload, target: core.Target): Promise<core.ApplyResult> {
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
    instagram_handle: instaHandle(payload.instagram_handle) || null,
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
    .eq('id', target.proId)
  // Migration 125 pas encore appliquée : on enregistre le reste
  let warning: string | undefined
  if (updateErr && /reseaux|formules|villes_couvertes|deroule|metier|options|video_url/.test(`${updateErr.message} ${updateErr.details ?? ''}`)) {
    ({ error: updateErr } = await admin.from('photographers').update(fields).eq('id', target.proId))
    if (!updateErr) warning = 'Fiche enregistrée, sauf tes réseaux, formules, villes, étapes et vidéos : ils arrivent dans quelques heures, réessaie plus tard.'
  }

  if (updateErr) {
    log.error('update failed', updateErr)
    return { error: 'Erreur lors de la sauvegarde.' }
  }
  // Téléphone affiché sur la fiche (migration 153) : à part, sans bloquer si la colonne manque
  // Clientèles (migration 154) : même principe
  await admin.from('photographers').update({ telephone_public: !!payload.telephone_public && !!fields.telephone }).eq('id', target.proId)
  if (Array.isArray(payload.clienteles)) await admin.from('photographers').update({ clienteles: readClienteles(payload.clienteles) }).eq('id', target.proId)

  if (target.isAdminEdit) revalidatePath('/dashboard/admin/photographes')
  return { success: true, warning }
}

/** Brouillon enregistré à chaque changement (atelier) */
export async function saveFicheDraft(draft: unknown, targetId?: string) { return core.saveDraft(K, draft, targetId) }

/** « Mettre en ligne » : champs vérifiés ici, brouillon vidé et site reconstruit par le tronc commun */
export async function publishFiche(payload: PhotographerPayload) {
  return core.publish(K, target => applyPhotographerFiche(payload, target), payload.targetId)
}

export async function uploadPhotographerLogo(formData: FormData) { return core.uploadLogo(K, formData) }
export async function deletePhotographerLogo(targetId?: string) { return core.deleteLogo(K, targetId) }

export async function prepareFichePhotos(count: number, targetId?: string) { return core.preparePhotos(K, count, targetId) }
export async function addFichePhotos(paths: string[], targetId?: string) { return core.addPhotos(K, paths, targetId) }
export async function removeFichePhoto(path: string, targetId?: string) { return core.removePhoto(K, path, targetId) }
export async function moveFichePhoto(path: string, dir: -1 | 1, targetId?: string) { return core.movePhoto(K, path, dir, targetId) }
export async function publishFichePhotos(targetId?: string) { return core.publishPhotos(K, targetId) }

export async function createCustomerPortalSession(targetId?: string) { return core.portalSession(K, targetId) }
export async function resumeFichePayment(targetId?: string) { return core.resumePayment(K, targetId) }

export async function updateContactStatus(contactId: string, status: string, targetId?: string) { return core.updateContactStatus(K, contactId, status, targetId) }
export async function updateContactNotes(contactId: string, notes: string, targetId?: string) { return core.updateContactNotes(K, contactId, notes, targetId) }
export async function deleteContact(contactId: string, targetId?: string) { return core.deleteContact(K, contactId, targetId) }
export async function addClientFromContact(contactId: string, targetId?: string) { return core.clientFromContact(K, contactId, targetId) }

export async function createProClient(data: core.ProClientInput, targetId?: string) { return core.createClientRow(K, data, targetId) }
export async function updateProClient(clientId: string, data: core.ProClientInput, targetId?: string) { return core.updateClientRow(K, clientId, data, targetId) }
export async function deleteProClient(clientId: string, targetId?: string) { return core.deleteClientRow(K, clientId, targetId) }
