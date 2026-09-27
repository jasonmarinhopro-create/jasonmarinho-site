'use server'

// Actions de l'espace « équipe de ménage » (planning des clients, bouton
// « Terminé », photos). Voir la migration 20260927_109_menage_equipe.sql.
//
// Sécurité : l'équipe n'a aucun droit direct sur les données de l'hôte. Chaque
// action vérifie (service role) qu'un menage_link existe pour
// (équipe connectée, hôte) ET que le token enregistré est toujours le token
// actuel de l'hôte (s'il l'a régénéré, l'accès a expiré), puis que le créneau
// visé existe bien dans le planning calculé de l'hôte.

import { revalidatePath } from 'next/cache'
import { randomUUID } from 'node:crypto'
import { getAuthUser } from '@/lib/supabase/auth-user'
import { getServiceClient } from '@/lib/supabase/service'
import { loadHostMenageSlots, menageKey } from '@/lib/menage/host-slots'
import { applyMenageDone } from '@/lib/menage/done'
import { createNotification } from '@/lib/notifications/create'
import { extractPlanningToken } from '@/lib/menage/share-link'

const BUCKET = 'menage-photos'
const MAX_PHOTOS = 8
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Vérifie que l'utilisateur connecté a un lien valide vers cet hôte. */
async function checkLink(hostId: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Non authentifié.' as const }
  const db = getServiceClient()
  const { data: link } = await db
    .from('menage_links')
    .select('id, host_token, label')
    .eq('cleaner_user_id', user.id)
    .eq('host_user_id', hostId)
    .maybeSingle()
  if (!link) return { error: 'Planning introuvable.' as const }
  const { data: host } = await db.from('profiles').select('ical_token, full_name').eq('id', hostId).maybeSingle()
  if (!host?.ical_token || host.ical_token !== link.host_token) {
    return { error: 'Ce lien de planning a expiré : demande à ton client de t’en renvoyer un.' as const }
  }
  return { user, db, link, host }
}

/** Le créneau (date, logement) existe-t-il dans le planning de l'hôte ? */
async function slotExists(db: ReturnType<typeof getServiceClient>, hostId: string, date: string, logementName: string) {
  const slots = await loadHostMenageSlots(db, hostId, date, date)
  return slots.some(s => menageKey(s.date, s.logementName) === menageKey(date, logementName))
}

export async function addPlanningLink(input: string, label: string): Promise<{ ok: true } | { error: string }> {
  const user = await getAuthUser()
  if (!user) return { error: 'Non authentifié.' }
  const token = extractPlanningToken(input ?? '')
  if (!token) return { error: 'Lien non reconnu. Colle le lien de planning ménage que ton client t’a envoyé.' }

  const db = getServiceClient()
  const { data: host } = await db.from('profiles').select('id, full_name').eq('ical_token', token).maybeSingle()
  if (!host) return { error: 'Ce lien ne correspond à aucun planning actif. Demande à ton client de t’en renvoyer un.' }

  const { error } = await db.from('menage_links').upsert({
    cleaner_user_id: user.id,
    host_user_id: host.id,
    host_token: token,
    label: (label ?? '').trim().slice(0, 80) || host.full_name || 'Client',
  }, { onConflict: 'cleaner_user_id,host_user_id' })
  if (error) return { error: error.message }
  revalidatePath('/dashboard/ma-fiche-menage/planning')
  return { ok: true }
}

export async function removePlanningLink(linkId: string): Promise<{ ok: true } | { error: string }> {
  const user = await getAuthUser()
  if (!user) return { error: 'Non authentifié.' }
  const { error } = await getServiceClient()
    .from('menage_links').delete().eq('id', linkId).eq('cleaner_user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/ma-fiche-menage/planning')
  return { ok: true }
}

/** Prépare l'envoi direct des photos vers le stockage privé (URL signées). */
export async function preparePhotoUploads(input: { hostId: string; date: string; count: number }): Promise<{ uploads: Array<{ path: string; token: string }> } | { error: string }> {
  if (!DATE_RE.test(input.date)) return { error: 'Date invalide.' }
  const count = Math.max(0, Math.min(MAX_PHOTOS, Math.floor(input.count)))
  const ctx = await checkLink(input.hostId)
  if ('error' in ctx) return { error: ctx.error as string }
  const uploads: Array<{ path: string; token: string }> = []
  for (let i = 0; i < count; i++) {
    const path = `${input.hostId}/${input.date}/${randomUUID()}.jpg`
    const { data, error } = await ctx.db.storage.from(BUCKET).createSignedUploadUrl(path)
    if (error || !data) return { error: error?.message ?? 'Envoi des photos impossible.' }
    uploads.push({ path, token: data.token })
  }
  return { uploads }
}

export async function markMenageTermine(input: {
  hostId: string; date: string; logementName: string; note?: string; photos?: string[]
}): Promise<{ ok: true } | { error: string }> {
  if (!DATE_RE.test(input.date)) return { error: 'Date invalide.' }
  const ctx = await checkLink(input.hostId)
  if ('error' in ctx) return { error: ctx.error as string }
  const { db, user, link } = ctx
  if (!(await slotExists(db, input.hostId, input.date, input.logementName))) {
    return { error: 'Ce ménage n’est plus au planning (réservation modifiée ?).' }
  }
  const photos = (input.photos ?? [])
    .filter(p => typeof p === 'string' && p.startsWith(`${input.hostId}/${input.date}/`) && !p.includes('..'))
    .slice(0, MAX_PHOTOS)
  const note = (input.note ?? '').trim().slice(0, 500) || null

  const { data: row, error } = await db.from('menage_completions').upsert({
    host_user_id: input.hostId,
    cleaner_user_id: user.id,
    logement_nom: input.logementName,
    date: input.date,
    note,
    photos,
    done_at: new Date().toISOString(),
  }, { onConflict: 'host_user_id,logement_nom,date' }).select('id').single()
  if (error || !row) return { error: error?.message ?? 'Enregistrement impossible.' }

  // Visible tout de suite dans le Calendrier de l'hôte (même mécanisme [FAIT]).
  await applyMenageDone(db, input.hostId, { date: input.date, logementName: input.logementName, done: true, notes: note ?? undefined })

  const { data: me } = await db.from('cleaners').select('full_name').eq('user_id', user.id).maybeSingle()
  const qui = me?.full_name || 'Ton équipe de ménage'
  await createNotification({
    recipientId: input.hostId,
    category: 'sejour',
    type: 'menage_termine',
    title: `Ménage terminé : ${input.logementName}`,
    body: `${qui} a terminé le ménage du ${new Date(input.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}${photos.length ? ` (${photos.length} photo${photos.length > 1 ? 's' : ''})` : ''}${note ? ` · « ${note} »` : ''}.`,
    ctaLabel: photos.length ? 'Voir les photos' : 'Voir le détail',
    ctaHref: `/dashboard/menages/${row.id}`,
    severity: 'success',
    dedupKey: `menage_termine:${row.id}:${photos.length}:${note ?? ''}`.slice(0, 200),
    metadata: { link_label: link.label },
  })

  revalidatePath('/dashboard/ma-fiche-menage/planning')
  return { ok: true }
}

export async function annulerMenageTermine(input: { hostId: string; date: string; logementName: string }): Promise<{ ok: true } | { error: string }> {
  if (!DATE_RE.test(input.date)) return { error: 'Date invalide.' }
  const ctx = await checkLink(input.hostId)
  if ('error' in ctx) return { error: ctx.error as string }
  const { db, user } = ctx
  const { data: row } = await db.from('menage_completions')
    .select('id, photos, cleaner_user_id')
    .eq('host_user_id', input.hostId).eq('logement_nom', input.logementName).eq('date', input.date)
    .maybeSingle()
  if (!row) return { ok: true }
  if (row.cleaner_user_id !== user.id) return { error: 'Ce ménage a été validé par quelqu’un d’autre.' }
  if (row.photos?.length) await db.storage.from(BUCKET).remove(row.photos)
  await db.from('menage_completions').delete().eq('id', row.id)
  await applyMenageDone(db, input.hostId, { date: input.date, logementName: input.logementName, done: false })
  revalidatePath('/dashboard/ma-fiche-menage/planning')
  return { ok: true }
}
