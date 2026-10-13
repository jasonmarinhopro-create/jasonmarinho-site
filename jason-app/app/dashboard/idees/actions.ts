'use server'

// Idées & feuille de route (13/10/2026) : ouvertes à tous les membres
// connectés, quel que soit leur espace. Avant : réservées aux contributeurs
// (`is_contributor`, contribution payée sur /soutenir, retirée).
// Statut, réponse et suppression d'une idée d'autrui : admin seulement
// (rôle revérifié ici, écriture au service role après vérification).

import { revalidateTag } from 'next/cache'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { CACHE_TAGS } from '@/lib/queries/cache'
import { rateLimit } from '@/lib/security/rate-limit'
import { sendAdminEmail } from '@/lib/email/admin'
import { createNotification } from '@/lib/notifications/create'
import {
  ESPACE_LABEL, IDEES_HREF, REPONSE_MAX, cleanComment, cleanIdea, isEspace, isStatus,
  shortName, statusNotification, type IdeeEspace,
} from '@/lib/idees/rules'
import type { IdeeComment, IdeeItem } from '@/lib/idees/load'

type Result<T> = { data: T } | { error: string }

export async function proposeIdea(title: string, description: string, espace: IdeeEspace): Promise<Result<IdeeItem>> {
  const profile = await getProfile()
  if (!profile) return { error: 'Connecte-toi pour proposer une idée.' }
  const clean = cleanIdea(title, description)
  if (!clean.ok) return { error: clean.error }
  const esp: IdeeEspace = isEspace(espace) ? espace : 'hote'

  const limit = await rateLimit('idees:propose', profile.userId, 8, 60 * 60_000)
  if (!limit.allowed) return { error: 'Tu as proposé beaucoup d\'idées d\'un coup : réessaie dans une heure.' }

  const supabase = await createClient()
  const row = {
    title: clean.title,
    description: clean.description,
    status: 'suggestion',
    author_id: profile.userId,
    author_name: profile.full_name ?? null,
  }
  // espace : migration 20261013_134 (repli sans la colonne)
  let res = await supabase.from('roadmap_items').insert({ ...row, espace: esp })
    .select('id, created_at').single()
  if (res.error?.code === '42703' || res.error?.code === 'PGRST204') {
    res = await supabase.from('roadmap_items').insert(row).select('id, created_at').single()
  }
  if (res.error || !res.data) return { error: 'L\'idée n\'a pas pu être enregistrée. Réessaie dans un instant.' }

  revalidateTag(CACHE_TAGS.ROADMAP_ITEMS)
  if (profile.role !== 'admin') {
    await sendAdminEmail({
      subject: `Nouvelle idée (${ESPACE_LABEL[esp]}) : ${clean.title.slice(0, 80)}`,
      text: [
        `${shortName(profile.full_name)} propose une idée depuis l'espace ${ESPACE_LABEL[esp]}.`,
        '',
        clean.title,
        clean.description ?? '',
        '',
        `À relire et classer : https://app.jasonmarinho.com${IDEES_HREF.hote}`,
      ].join('\n'),
    })
  }

  return {
    data: {
      id: res.data.id,
      title: clean.title,
      description: clean.description,
      status: 'suggestion',
      espace: esp,
      reponse: null,
      created_at: res.data.created_at,
      status_changed_at: null,
      author: profile.role === 'admin' ? 'Jason' : shortName(profile.full_name),
      mine: true,
    },
  }
}

export async function toggleVote(itemId: string): Promise<{ ok: boolean }> {
  const profile = await getProfile()
  if (!profile || typeof itemId !== 'string') return { ok: false }
  const supabase = await createClient()
  const { data: existing } = await supabase.from('roadmap_votes')
    .select('item_id').eq('user_id', profile.userId).eq('item_id', itemId).maybeSingle()
  const { error } = existing
    ? await supabase.from('roadmap_votes').delete().eq('user_id', profile.userId).eq('item_id', itemId)
    : await supabase.from('roadmap_votes').insert({ user_id: profile.userId, item_id: itemId })
  revalidateTag(CACHE_TAGS.ROADMAP_VOTES)
  return { ok: !error }
}

export async function addComment(itemId: string, content: string): Promise<Result<IdeeComment>> {
  const profile = await getProfile()
  if (!profile) return { error: 'Connecte-toi pour commenter.' }
  const text = cleanComment(content)
  if (!text) return { error: 'Ton commentaire est vide ou trop long (400 caractères au plus).' }

  const limit = await rateLimit('idees:comment', profile.userId, 30, 60 * 60_000)
  if (!limit.allowed) return { error: 'Beaucoup de commentaires d\'un coup : réessaie dans une heure.' }

  const supabase = await createClient()
  const { data, error } = await supabase.from('roadmap_comments')
    .insert({ item_id: itemId, author_id: profile.userId, author_name: profile.full_name ?? null, content: text })
    .select('id, created_at').single()
  if (error || !data) return { error: 'Le commentaire n\'a pas pu être enregistré.' }
  revalidateTag(CACHE_TAGS.ROADMAP_COMMENTS)
  const isJason = profile.role === 'admin'
  return {
    data: {
      id: data.id, item_id: itemId, author: isJason ? 'Jason' : shortName(profile.full_name),
      mine: true, isJason, content: text, created_at: data.created_at,
    },
  }
}

/** Retirer sa propre idée (ou n'importe laquelle pour l'admin) */
export async function deleteIdea(itemId: string): Promise<{ ok: boolean }> {
  const profile = await getProfile()
  if (!profile) return { ok: false }
  const db = getServiceClient()
  const { data: item } = await db.from('roadmap_items').select('author_id').eq('id', itemId).maybeSingle()
  if (!item) return { ok: false }
  if (profile.role !== 'admin' && item.author_id !== profile.userId) return { ok: false }
  const { error } = await db.from('roadmap_items').delete().eq('id', itemId)
  revalidateTag(CACHE_TAGS.ROADMAP_ITEMS)
  revalidateTag(CACHE_TAGS.ROADMAP_COMMENTS)
  revalidateTag(CACHE_TAGS.ROADMAP_VOTES)
  return { ok: !error }
}

/** Retirer son propre commentaire (ou n'importe lequel pour l'admin) */
export async function deleteComment(commentId: string): Promise<{ ok: boolean }> {
  const profile = await getProfile()
  if (!profile) return { ok: false }
  const db = getServiceClient()
  const { data: c } = await db.from('roadmap_comments').select('author_id').eq('id', commentId).maybeSingle()
  if (!c) return { ok: false }
  if (profile.role !== 'admin' && c.author_id !== profile.userId) return { ok: false }
  const { error } = await db.from('roadmap_comments').delete().eq('id', commentId)
  revalidateTag(CACHE_TAGS.ROADMAP_COMMENTS)
  return { ok: !error }
}

/** Admin : statut et réponse courte affichée sous l'idée. L'auteur est prévenu d'un changement de statut. */
export async function updateIdea(itemId: string, patch: { status?: string; reponse?: string }): Promise<{ ok: boolean; error?: string }> {
  const profile = await getProfile()
  if (profile?.role !== 'admin') return { ok: false, error: 'Réservé à l\'admin.' }
  const db = getServiceClient()
  // select('*') : une seule ligne, et `espace` peut manquer (migration 134)
  const { data: item } = await db.from('roadmap_items').select('*').eq('id', itemId).maybeSingle()
  if (!item) return { ok: false, error: 'Idée introuvable.' }

  const update: Record<string, unknown> = {}
  const statusChanged = patch.status !== undefined && isStatus(patch.status) && patch.status !== item.status
  if (statusChanged) {
    update.status = patch.status
    update.status_changed_at = new Date().toISOString()
  }
  if (patch.reponse !== undefined) {
    update.reponse = patch.reponse.replace(/\s+/g, ' ').trim().slice(0, REPONSE_MAX) || null
  }
  if (!Object.keys(update).length) return { ok: true }

  let { error } = await db.from('roadmap_items').update(update).eq('id', itemId)
  if (error?.code === '42703' || error?.code === 'PGRST204') {
    // Migration 134 absente : seul le statut peut être enregistré
    if (!statusChanged) return { ok: false, error: 'La réponse demande la migration 20261013_134 (à coller dans Supabase).' }
    ;({ error } = await db.from('roadmap_items').update({ status: patch.status }).eq('id', itemId))
  }
  if (error) return { ok: false, error: 'Modification impossible.' }
  revalidateTag(CACHE_TAGS.ROADMAP_ITEMS)

  if (statusChanged && item.author_id && item.author_id !== profile.userId && isStatus(patch.status)) {
    const n = statusNotification(patch.status, item.title)
    if (n) {
      await createNotification({
        recipientId: item.author_id,
        category: 'system',
        type: `idee_${patch.status}`,
        title: n.title,
        body: n.body,
        ctaLabel: 'Voir les idées',
        ctaHref: IDEES_HREF[isEspace(item.espace) ? (item.espace as IdeeEspace) : 'hote'],
        dedupKey: `idee_${patch.status}:${itemId}`,
      })
    }
  }
  return { ok: true }
}
