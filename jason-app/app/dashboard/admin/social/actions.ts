'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { dispatchPost, refreshPostStats as refreshPostStatsInternal } from '@/lib/social/dispatch'

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
