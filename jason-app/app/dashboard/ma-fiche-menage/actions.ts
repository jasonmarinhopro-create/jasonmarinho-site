'use server'

import { getServiceClient } from '@/lib/supabase/service'
import { readClienteles } from '@/lib/pros/clienteles'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import * as core from '@/lib/pros/fiche-core'
import { cleanReseaux, instaHandle } from '@/lib/pros/reseaux'
import { cleanFormules, cleanVilles, cleanDeroule } from '@/lib/pros/fiche-vitrine'
import { normSiteUrl, siteUrlOk, SITE_URL_ERROR } from '@/lib/pros/site-url'

const log = logger('ma-fiche-menage/actions')

const ALLOWED_PRESTATIONS = new Set([
  'menage_standard', 'gestion_linge', 'repassage', 'reapprovisionnement',
  'etat_des_lieux_photo', 'petite_maintenance', 'nettoyage_exterieur', 'gestion_dechets',
])
const ALLOWED_EQUIPE = new Set(['solo', 'duo', 'equipe_3_5', 'equipe_6_plus'])
const ALLOWED_DELAI = new Set(['jour_meme', '24h', '48h', '72h'])
const ALLOWED_LANGUES = new Set(['fr', 'en', 'es', 'it', 'de', 'pt', 'ar', 'zh'])

const K = 'cleaner' as const
// Tronc commun lib/pros/fiche-core.ts depuis le 31/10/2026 (comme le dépannage) :
// seuls les champs propres au métier sont vérifiés ici (applyFiche).

export type CleanerPayload = {
  targetId?: string
  full_name?: string
  pseudo?: string | null
  ville?: string
  zone_couverte?: string | null
  bio?: string | null
  tarif_forfait_min?: number | null
  tarif_forfait_max?: number | null
  tarif_heure?: number | null
  prestations?: string[]
  equipe_type?: string | null
  logements_geres?: number | null
  delai_reservation?: string | null
  langues?: string[]
  assurance_rc_pro?: boolean
  siret?: string | null
  site_url?: string | null
  instagram_handle?: string | null
  telephone?: string | null
  telephone_public?: boolean
  clienteles?: string[]
  reseaux?: Record<string, string>
  formules?: unknown
  villes_couvertes?: unknown
  deroule?: unknown
}

async function applyCleanerFiche(payload: CleanerPayload, target: core.Target): Promise<core.ApplyResult> {
  // Réseaux et fiche Google : liens vérifiés (lib/pros/reseaux.ts)
  const reseaux = cleanReseaux(payload.reseaux)
  if (reseaux.errors.length) return { error: reseaux.errors[0] }

  const fullName = String(payload.full_name || '').trim().slice(0, 100)
  const ville = String(payload.ville || '').trim().slice(0, 80)
  if (!fullName || !ville) return { error: 'Nom et ville sont obligatoires.' }

  const siteUrl = normSiteUrl(payload.site_url)
  if (siteUrl && !siteUrlOk(siteUrl)) return { error: `Ton site : ${SITE_URL_ERROR}.` }

  const equipeType = payload.equipe_type ?? ''
  if (equipeType && !ALLOWED_EQUIPE.has(equipeType)) return { error: 'Type d\'équipe invalide.' }
  const delaiReservation = payload.delai_reservation ?? ''
  if (delaiReservation && !ALLOWED_DELAI.has(delaiReservation)) return { error: 'Délai invalide.' }
  const siret = String(payload.siret || '').replace(/\s+/g, '').slice(0, 14)
  if (siret && !/^[0-9]{14}$/.test(siret)) return { error: 'SIRET doit faire 14 chiffres.' }

  const prestations = Array.isArray(payload.prestations)
    ? payload.prestations.filter(p => typeof p === 'string' && ALLOWED_PRESTATIONS.has(p)).slice(0, 12)
    : []
  const langues = Array.isArray(payload.langues)
    ? payload.langues.filter(l => typeof l === 'string' && ALLOWED_LANGUES.has(l)).slice(0, 8)
    : []

  const admin = getServiceClient()
  const fields = {
    full_name: fullName,
    pseudo: (payload.pseudo ?? '').toString().trim().slice(0, 100) || null,
    ville,
    zone_couverte: (payload.zone_couverte ?? '').toString().trim().slice(0, 200) || null,
    bio: (payload.bio ?? '').toString().trim().slice(0, 600) || null,
    tarif_forfait_min: payload.tarif_forfait_min ?? null,
    tarif_forfait_max: payload.tarif_forfait_max ?? null,
    tarif_heure: payload.tarif_heure ?? null,
    prestations: prestations.length > 0 ? prestations : null,
    equipe_type: equipeType || null,
    logements_geres: payload.logements_geres ?? null,
    delai_reservation: delaiReservation || null,
    langues: langues.length > 0 ? langues : null,
    assurance_rc_pro: !!payload.assurance_rc_pro,
    siret: siret || null,
    site_url: siteUrl || null,
    instagram_handle: instaHandle(payload.instagram_handle) || null,
    telephone: (payload.telephone ?? '').toString().trim().slice(0, 30) || null,
    updated_at: new Date().toISOString(),
  }
  // Formules, villes couvertes, déroulé (migration 131)
  const vitrineFields = {
    formules: cleanFormules(payload.formules),
    villes_couvertes: cleanVilles(payload.villes_couvertes),
    deroule: cleanDeroule(payload.deroule, 'menage'),
  }
  let { error: updateErr } = await admin
    .from('cleaners')
    .update({ ...fields, reseaux: reseaux.value, ...vitrineFields })
    .eq('id', target.proId)
  // Migration 125 pas encore appliquée : on enregistre le reste
  let warning: string | undefined
  if (updateErr && /reseaux|formules|villes_couvertes|deroule/.test(`${updateErr.message} ${updateErr.details ?? ''}`)) {
    ({ error: updateErr } = await admin.from('cleaners').update(fields).eq('id', target.proId))
    if (!updateErr) warning = 'Fiche enregistrée, sauf tes réseaux, formules, villes et étapes : ils arrivent dans quelques heures, réessaie plus tard.'
  }

  if (updateErr) {
    log.error('update failed', updateErr)
    return { error: 'Erreur lors de la sauvegarde.' }
  }

  // Téléphone affiché sur la fiche (migration 153) : à part, sans bloquer si la colonne manque
  await admin.from('cleaners').update({ telephone_public: !!payload.telephone_public && !!fields.telephone }).eq('id', target.proId)
  // Clientèles (migration 154) : même principe
  if (Array.isArray(payload.clienteles)) await admin.from('cleaners').update({ clienteles: readClienteles(payload.clienteles) }).eq('id', target.proId)

  if (target.isAdminEdit) revalidatePath('/dashboard/admin/menage')
  return { success: true, warning }
}

/** Brouillon enregistré à chaque changement (atelier) */
export async function saveFicheDraft(draft: unknown, targetId?: string) { return core.saveDraft(K, draft, targetId) }

/** « Mettre en ligne » : champs vérifiés ici, brouillon vidé et site reconstruit par le tronc commun */
export async function publishFiche(payload: CleanerPayload) {
  return core.publish(K, target => applyCleanerFiche(payload, target), payload.targetId)
}

export async function uploadCleanerLogo(formData: FormData) { return core.uploadLogo(K, formData) }
export async function deleteCleanerLogo(targetId?: string) { return core.deleteLogo(K, targetId) }

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
