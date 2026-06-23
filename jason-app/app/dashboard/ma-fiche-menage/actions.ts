'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

const log = logger('ma-fiche-menage/actions')

const ALLOWED_PRESTATIONS = new Set([
  'menage_standard', 'gestion_linge', 'repassage', 'reapprovisionnement',
  'etat_des_lieux_photo', 'petite_maintenance', 'nettoyage_exterieur', 'gestion_dechets',
])
const ALLOWED_EQUIPE = new Set(['solo', 'duo', 'equipe_3_5', 'equipe_6_plus'])
const ALLOWED_DELAI = new Set(['jour_meme', '24h', '48h', '72h'])
const ALLOWED_LANGUES = new Set(['fr', 'en', 'es', 'it', 'de', 'pt', 'ar', 'zh'])

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/**
 * Cleaner connecté → sa propre fiche ; admin avec targetId → édition
 * pour le compte de l'équipe désignée.
 */
async function resolveTargetFiche(targetId?: string): Promise<
  { cleanerId: string; isAdminEdit: boolean } | { error: string }
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

  if (targetId && isAdmin) {
    const { data: target } = await admin
      .from('cleaners')
      .select('id')
      .eq('id', targetId)
      .maybeSingle()
    if (!target) return { error: 'Équipe cible introuvable.' }
    return { cleanerId: target.id, isAdminEdit: true }
  }

  const { data: cl } = await admin
    .from('cleaners')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!cl) return { error: 'Aucune fiche équipe ménage rattachée à ce compte.' }
  return { cleanerId: cl.id, isAdminEdit: false }
}

export async function updateCleanerFiche(payload: {
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
}): Promise<{ success?: boolean; error?: string; adminEdit?: boolean }> {
  const target = await resolveTargetFiche(payload.targetId)
  if ('error' in target) return { error: target.error }

  const fullName = String(payload.full_name || '').trim().slice(0, 100)
  const ville = String(payload.ville || '').trim().slice(0, 80)
  if (!fullName || !ville) return { error: 'Nom et ville sont obligatoires.' }

  const siteUrl = String(payload.site_url || '').trim().slice(0, 300)
  if (siteUrl && !/^https?:\/\//i.test(siteUrl)) return { error: 'Le site web doit commencer par https://' }

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
  const { error: updateErr } = await admin
    .from('cleaners')
    .update({
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
      instagram_handle: (payload.instagram_handle ?? '').toString().trim().slice(0, 50).replace(/^@/, '') || null,
      telephone: (payload.telephone ?? '').toString().trim().slice(0, 30) || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', target.cleanerId)

  if (updateErr) {
    log.error('update failed', updateErr)
    return { error: 'Erreur lors de la sauvegarde.' }
  }

  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
  if (hookUrl) fetch(hookUrl, { method: 'POST' }).catch(() => {})

  revalidatePath('/dashboard/ma-fiche-menage')
  if (target.isAdminEdit) revalidatePath('/dashboard/admin/menage')
  return { success: true, adminEdit: target.isAdminEdit }
}

export async function createCustomerPortalSession(targetId?: string): Promise<{ url?: string; error?: string }> {
  const target = await resolveTargetFiche(targetId)
  if ('error' in target) return { error: target.error }

  const admin = getServiceClient()
  const { data: cl } = await admin
    .from('cleaners')
    .select('stripe_customer_id')
    .eq('id', target.cleanerId)
    .maybeSingle()
  if (!cl?.stripe_customer_id) return { error: 'Abonnement Stripe non encore initialisé.' }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: cl.stripe_customer_id,
      return_url: 'https://app.jasonmarinho.com/dashboard/ma-fiche-menage',
    })
    return { url: session.url }
  } catch (e) {
    log.error('billing portal create failed', e)
    return { error: 'Impossible de créer la session de gestion d\'abonnement.' }
  }
}
