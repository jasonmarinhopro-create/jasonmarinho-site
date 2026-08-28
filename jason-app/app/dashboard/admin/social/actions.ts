'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { dispatchPost, refreshPostStats as refreshPostStatsInternal, refreshAllStats as refreshAllStatsInternal } from '@/lib/social/dispatch'
import { getSubscribedApps, debugTokenScopes, getAppSubscriptions, subscribeAppWebhook } from '@/lib/social/meta'
import { decryptToken } from '@/lib/security/crypto'

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié.')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') throw new Error('Non autorisé.')
  return user
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp']

export async function uploadSocialMedia(formData: FormData): Promise<{ ok: boolean; url?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non authentifié.' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') return { ok: false, error: 'Non autorisé.' }

  const file = formData.get('file')
  if (!(file instanceof File)) return { ok: false, error: 'Fichier invalide' }
  if (file.size === 0) return { ok: false, error: 'Fichier vide' }
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: 'Image trop lourde (max 8 Mo)' }
  if (!ALLOWED_MIMES.includes(file.type)) return { ok: false, error: 'Format non supporté (JPEG, PNG ou WebP)' }

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp'
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`

  const { error: upErr } = await supabase.storage
    .from('social-post-media')
    .upload(path, file, { contentType: file.type, cacheControl: '31536000' })
  if (upErr) return { ok: false, error: upErr.message }

  const { data: urlData } = supabase.storage.from('social-post-media').getPublicUrl(path)
  return { ok: true, url: urlData.publicUrl }
}

export async function createSocialPost(input: {
  body: string
  mediaUrls: string[]
  platforms: string[]
  bodyOverrides?: Record<string, string> // platform -> texte spécifique (sinon body partagé)
  scheduledAt: string | null // ISO, null = publier maintenant
}): Promise<{ success?: boolean; error?: string }> {
  try {
    const user = await requireAdmin()
    if (!input.body.trim() && input.mediaUrls.length === 0) return { error: 'Le post est vide.' }
    if (input.platforms.length === 0) return { error: 'Sélectionne au moins un réseau.' }
    if (input.platforms.includes('instagram') && input.mediaUrls.length === 0) {
      return { error: 'Instagram exige au moins une image.' }
    }
    if (input.mediaUrls.length > 10) {
      return { error: 'Maximum 10 images (limite du carrousel Instagram).' }
    }

    const db = adminClient()
    const isScheduled = !!input.scheduledAt
    const { data: post, error: insertErr } = await db.from('social_posts').insert({
      created_by: user.id,
      body: input.body,
      media_urls: input.mediaUrls,
      platforms: input.platforms,
      scheduled_at: input.scheduledAt,
      status: isScheduled ? 'scheduled' : 'publishing',
    }).select('id').single()

    if (insertErr || !post) return { error: insertErr?.message ?? 'Échec de la création du post.' }

    await db.from('social_post_targets').insert(
      input.platforms.map(platform => ({
        post_id: post.id,
        platform,
        status: 'pending',
        body_override: input.bodyOverrides?.[platform]?.trim() || null,
      })),
    )

    if (!isScheduled) {
      await dispatchPost(post.id)
    }

    revalidatePath('/dashboard/admin/social')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erreur inattendue.' }
  }
}

export async function updateSocialPost(postId: string, input: {
  body: string
  mediaUrls: string[]
  platforms: string[]
  bodyOverrides?: Record<string, string>
  scheduledAt: string | null // ISO, null = publier maintenant
}): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (!input.body.trim() && input.mediaUrls.length === 0) return { error: 'Le post est vide.' }
    if (input.platforms.length === 0) return { error: 'Sélectionne au moins un réseau.' }
    if (input.platforms.includes('instagram') && input.mediaUrls.length === 0) {
      return { error: 'Instagram exige au moins une image.' }
    }
    if (input.mediaUrls.length > 10) {
      return { error: 'Maximum 10 images (limite du carrousel Instagram).' }
    }

    const db = adminClient()
    const { data: existing } = await db.from('social_posts').select('status').eq('id', postId).maybeSingle()
    if (!existing) return { error: 'Publication introuvable.' }
    if (existing.status !== 'scheduled') return { error: 'Seules les publications encore programmées peuvent être modifiées.' }

    const isScheduled = !!input.scheduledAt
    const { error: updateErr } = await db.from('social_posts').update({
      body: input.body,
      media_urls: input.mediaUrls,
      platforms: input.platforms,
      scheduled_at: input.scheduledAt,
      status: isScheduled ? 'scheduled' : 'publishing',
      updated_at: new Date().toISOString(),
    }).eq('id', postId)
    if (updateErr) return { error: updateErr.message }

    await db.from('social_post_targets').delete().eq('post_id', postId)
    await db.from('social_post_targets').insert(
      input.platforms.map(platform => ({
        post_id: postId,
        platform,
        status: 'pending',
        body_override: input.bodyOverrides?.[platform]?.trim() || null,
      })),
    )

    if (!isScheduled) {
      await dispatchPost(postId)
    }

    revalidatePath('/dashboard/admin/social')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erreur inattendue.' }
  }
}

export async function retrySocialPost(postId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireAdmin()
    await dispatchPost(postId)
    revalidatePath('/dashboard/admin/social')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erreur inattendue.' }
  }
}

// Correction manuelle pour le cas rare où une publication a réellement
// réussi côté Meta (confirmé à l'œil par l'admin sur le réseau) mais dont
// l'écriture du statut en base ne s'est jamais terminée — laissant la
// cible bloquée en "pending" indéfiniment (ex : timeout de la fonction
// Vercel pile entre l'appel Meta réussi et l'écriture Supabase). Ne
// republie rien, corrige juste le statut affiché.
export async function markTargetPublished(targetId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireAdmin()
    const db = adminClient()
    const { data: target } = await db.from('social_post_targets').select('post_id').eq('id', targetId).maybeSingle()
    if (!target) return { error: 'Cible introuvable.' }

    const { error } = await db.from('social_post_targets').update({
      status: 'published',
      published_at: new Date().toISOString(),
      error: null,
    }).eq('id', targetId)
    if (error) return { error: error.message }

    const { data: targets } = await db.from('social_post_targets').select('status').eq('post_id', target.post_id)
    const allPublished = (targets ?? []).every(t => t.status === 'published')
    const anyFailed = (targets ?? []).some(t => t.status === 'failed')
    const finalStatus = allPublished ? 'done' : anyFailed ? 'partial' : 'publishing'
    await db.from('social_posts').update({ status: finalStatus }).eq('id', target.post_id)

    revalidatePath('/dashboard/admin/social')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erreur inattendue.' }
  }
}

export async function disconnectSocialAccount(accountId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireAdmin()
    const db = adminClient()
    const { error } = await db.from('social_accounts').update({ status: 'revoked' }).eq('id', accountId)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/admin/social')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erreur inattendue.' }
  }
}

export async function refreshPostStats(postId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireAdmin()
    await refreshPostStatsInternal(postId)
    revalidatePath('/dashboard/admin/social')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erreur inattendue.' }
  }
}

export async function refreshAllStats(): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireAdmin()
    await refreshAllStatsInternal()
    revalidatePath('/dashboard/admin/social')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erreur inattendue.' }
  }
}

// Meta n'a pas d'API pour donner l'email d'un commentateur — la réponse
// automatique passe par un message privé (DM) sur le commentaire lui-même,
// cf. lib/social/comment-triggers.ts et le webhook app/api/social/webhook/meta.
export async function createCommentTrigger(input: {
  platform: 'facebook' | 'instagram' | 'both'
  keyword: string
  replyMessage: string
}): Promise<{ success?: boolean; error?: string }> {
  try {
    const user = await requireAdmin()
    const keyword = input.keyword.trim()
    const replyMessage = input.replyMessage.trim()
    if (!keyword) return { error: 'Mot-clé requis.' }
    if (!replyMessage) return { error: 'Message de réponse requis.' }

    const db = adminClient()
    const { error } = await db.from('social_comment_triggers').insert({
      created_by: user.id,
      platform: input.platform,
      keyword,
      reply_message: replyMessage,
    })
    if (error) return { error: error.message }
    revalidatePath('/dashboard/admin/social')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erreur inattendue.' }
  }
}

export async function toggleCommentTrigger(id: string, active: boolean): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireAdmin()
    const db = adminClient()
    const { error } = await db.from('social_comment_triggers')
      .update({ active, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/admin/social')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erreur inattendue.' }
  }
}

export async function deleteCommentTrigger(id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireAdmin()
    const db = adminClient()
    const { error } = await db.from('social_comment_triggers').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/admin/social')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erreur inattendue.' }
  }
}

// Enregistre le webhook de l'app via l'API — le dashboard Meta ("Configurez
// les webhooks") s'est avéré ne pas sauvegarder réellement malgré un état
// de succès affiché à l'écran (confirmé par getAppSubscriptions renvoyant
// vide). Remplace cette étape peu fiable, comme pour l'abonnement de la
// Page (subscribePageWebhooks) et le flow "Générer un token" avant lui.
export async function registerAppWebhooks(): Promise<{ result?: string; error?: string }> {
  try {
    await requireAdmin()
    const lines: string[] = []
    for (const [object, fields] of [['page', ['feed']], ['instagram', ['comments']]] as const) {
      try {
        await subscribeAppWebhook(object, [...fields])
        lines.push(`${object} : enregistré (champs [${fields.join(', ')}])`)
      } catch (err) {
        lines.push(`${object} : échec — ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    return { result: lines.join('\n') }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erreur inattendue.' }
  }
}

// Interroge directement l'API Meta pour voir l'état réel de l'abonnement
// webhook de chaque compte connecté — pour diagnostiquer sans deviner
// pourquoi un commentaire ne déclenche rien (ex : abonnement jamais pris,
// mauvais champ, app pas encore listée dans subscribed_apps).
export async function checkWebhookSubscriptions(): Promise<{ result?: string; error?: string }> {
  try {
    await requireAdmin()
    const db = adminClient()
    const { data: accounts } = await db.from('social_accounts').select('*').eq('status', 'active')
    if (!accounts || accounts.length === 0) return { result: 'Aucun compte connecté.' }

    const appId = process.env.META_APP_ID
    const lines: string[] = []

    try {
      const subs = await getAppSubscriptions()
      if (subs.length === 0) {
        lines.push(`App : AUCUN webhook enregistré (l'URL/jeton n'a peut-être jamais été sauvegardé côté Meta).`)
      } else {
        for (const s of subs) lines.push(`App, objet "${s.object}" : ${s.active ? 'actif' : 'inactif'}, champs = [${s.fields.join(', ')}]`)
      }
    } catch (err) {
      lines.push(`App : impossible de lire la config webhook — ${err instanceof Error ? err.message : String(err)}`)
    }
    lines.push('')

    for (const account of accounts) {
      const label = `${account.platform} (${account.display_name ?? account.external_account_id})`
      let accessToken: string
      try {
        accessToken = decryptToken(account.access_token)
      } catch (err) {
        lines.push(`${label} : erreur de déchiffrement du token — ${err instanceof Error ? err.message : String(err)}`)
        continue
      }

      try {
        const scopes = await debugTokenScopes(accessToken)
        lines.push(`${label} : permissions du token = [${scopes.join(', ')}]`)
      } catch (err) {
        lines.push(`${label} : impossible de lire les permissions — ${err instanceof Error ? err.message : String(err)}`)
      }

      // Contrairement à la Page, {ig-user-id}/subscribed_apps n'existe pas
      // côté Graph API pour Instagram (confirmé : "Tried accessing
      // nonexisting field") — les commentaires y sont livrés automatiquement
      // dès que instagram_manage_comments est accordé (vérifié ci-dessus) +
      // le champ "comments" actif côté App Dashboard, sans abonnement par
      // compte à vérifier ici.
      if (account.platform === 'instagram') continue

      try {
        const subs = await getSubscribedApps(account.external_account_id, accessToken)
        const mine = subs.find(s => s.id === appId)
        lines.push(
          `${label} : ` +
          (mine
            ? `abonnée, champs = [${(mine.subscribed_fields ?? []).join(', ')}]`
            : `PAS abonnée (${subs.length} app(s) au total : ${subs.map(s => s.name ?? s.id).join(', ') || 'aucune'})`),
        )
      } catch (err) {
        lines.push(`${label} : erreur abonnement — ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    return { result: lines.join('\n') }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erreur inattendue.' }
  }
}

export async function setSocialCadence(input: { weekdays: number[]; timeOfDay: string }): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (input.weekdays.length === 0) return { error: 'Sélectionne au moins un jour.' }
    if (!/^\d{2}:\d{2}$/.test(input.timeOfDay)) return { error: 'Heure invalide.' }

    const db = adminClient()
    const { data: existing } = await db.from('social_cadence').select('id').limit(1).maybeSingle()
    if (existing) {
      await db.from('social_cadence').update({
        weekdays: input.weekdays,
        time_of_day: input.timeOfDay,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id)
    } else {
      await db.from('social_cadence').insert({ weekdays: input.weekdays, time_of_day: input.timeOfDay })
    }
    revalidatePath('/dashboard/admin/social')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erreur inattendue.' }
  }
}
