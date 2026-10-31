'use server'

// Espace Dépannage et maintenance (31/10/2026) : premier espace branché sur le
// tronc commun lib/pros/fiche-core.ts. Seuls les champs propres au métier
// (spécialités, disponibilités, délai d'intervention, prix du déplacement)
// sont vérifiés ici. Aucun contrôle SIRET ni assurance (décision de Jason) :
// le SIRET reste un champ libre, vérifié seulement sur sa forme.
import { getServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import * as core from '@/lib/pros/fiche-core'
import { readClienteles } from '@/lib/pros/clienteles'
import { cleanReseaux, instaHandle } from '@/lib/pros/reseaux'
import { cleanFormules, cleanVilles, cleanDeroule } from '@/lib/pros/fiche-vitrine'
import { normSiteUrl, siteUrlOk, SITE_URL_ERROR } from '@/lib/pros/site-url'
import { SPECIALITES_DEPANNAGE } from '@/lib/pros/metiers'
import { DISPONIBILITES_DEPANNAGE, DELAIS_DEPANNAGE } from '@/lib/pros/depannage'

const K = 'depannage' as const
const log = logger('ma-fiche-depannage/actions')

const ALLOWED_SPECIALITES = new Set<string>(SPECIALITES_DEPANNAGE.map(s => s.id))
const ALLOWED_DISPOS = new Set<string>(DISPONIBILITES_DEPANNAGE.map(d => d.id))
const ALLOWED_DELAI = new Set<string>(DELAIS_DEPANNAGE.map(d => d.id))
const ALLOWED_LANGUES = new Set(['fr', 'en', 'es', 'it', 'de', 'pt', 'ar', 'zh'])

export type DepannagePayload = {
  targetId?: string
  full_name?: string
  pseudo?: string | null
  ville?: string
  zone_couverte?: string | null
  bio?: string | null
  tarif_heure?: number | null
  deplacement_prix?: number | null
  specialites?: string[]
  disponibilites?: string[]
  delai_intervention?: string | null
  langues?: string[]
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

const pick = (raw: unknown, allowed: Set<string>, max: number) =>
  Array.isArray(raw) ? Array.from(new Set(raw.filter((v): v is string => typeof v === 'string' && allowed.has(v)))).slice(0, max) : []

const intOrNull = (v: unknown, min: number, max: number) => {
  const n = typeof v === 'number' ? Math.round(v) : NaN
  return Number.isFinite(n) && n >= min && n <= max ? n : null
}

async function applyFiche(payload: DepannagePayload, target: core.Target): Promise<core.ApplyResult> {
  const reseaux = cleanReseaux(payload.reseaux)
  if (reseaux.errors.length) return { error: reseaux.errors[0] }

  const fullName = String(payload.full_name || '').trim().slice(0, 100)
  const ville = String(payload.ville || '').trim().slice(0, 80)
  if (!fullName || !ville) return { error: 'Nom et ville sont obligatoires.' }

  const siteUrl = normSiteUrl(payload.site_url)
  if (siteUrl && !siteUrlOk(siteUrl)) return { error: `Ton site : ${SITE_URL_ERROR}.` }

  const delai = payload.delai_intervention ?? ''
  if (delai && !ALLOWED_DELAI.has(delai)) return { error: 'Délai d\'intervention invalide.' }
  const siret = String(payload.siret || '').replace(/\s+/g, '').slice(0, 14)
  if (siret && !/^[0-9]{14}$/.test(siret)) return { error: 'SIRET doit faire 14 chiffres.' }
  const telephone = (payload.telephone ?? '').toString().trim().slice(0, 30) || null

  const fields = {
    full_name: fullName,
    pseudo: (payload.pseudo ?? '').toString().trim().slice(0, 100) || null,
    ville,
    zone_couverte: (payload.zone_couverte ?? '').toString().trim().slice(0, 200) || null,
    bio: (payload.bio ?? '').toString().trim().slice(0, 600) || null,
    tarif_heure: intOrNull(payload.tarif_heure, 0, 500),
    deplacement_prix: intOrNull(payload.deplacement_prix, 0, 500),
    specialites: pick(payload.specialites, ALLOWED_SPECIALITES, 9),
    disponibilites: pick(payload.disponibilites, ALLOWED_DISPOS, 4),
    delai_intervention: delai || null,
    langues: pick(payload.langues, ALLOWED_LANGUES, 8),
    siret: siret || null,
    site_url: siteUrl || null,
    instagram_handle: instaHandle(payload.instagram_handle) || null,
    telephone,
    telephone_public: !!payload.telephone_public && !!telephone,
    clienteles: readClienteles(payload.clienteles),
    reseaux: reseaux.value,
    formules: cleanFormules(payload.formules),
    villes_couvertes: cleanVilles(payload.villes_couvertes),
    deroule: cleanDeroule(payload.deroule, 'depannage'),
    updated_at: new Date().toISOString(),
  }
  const { error } = await getServiceClient().from('depannage_pros').update(fields).eq('id', target.proId)
  if (error) {
    log.error('enregistrement de la fiche', { err: error.message })
    return { error: 'Erreur lors de la sauvegarde.' }
  }
  if (target.isAdminEdit) revalidatePath('/dashboard/admin/depannage')
  return { success: true }
}

/** Brouillon enregistré à chaque changement (atelier) */
export async function saveFicheDraft(draft: unknown, targetId?: string) {
  return core.saveDraft(K, draft, targetId)
}

/** « Mettre en ligne » */
export async function publishFiche(payload: DepannagePayload) {
  return core.publish(K, target => applyFiche(payload, target), payload.targetId)
}

export async function uploadDepannageLogo(formData: FormData) { return core.uploadLogo(K, formData) }
export async function deleteDepannageLogo(targetId?: string) { return core.deleteLogo(K, targetId) }

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
