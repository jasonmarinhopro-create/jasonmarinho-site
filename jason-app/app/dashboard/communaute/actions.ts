'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function setGroupMembership(groupId: string, status: 'joined' | 'dismissed' | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  if (status === null) {
    const { error } = await supabase
      .from('user_community_memberships')
      .delete()
      .eq('user_id', user.id)
      .eq('group_id', groupId)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('user_community_memberships')
      .upsert(
        { user_id: user.id, group_id: groupId, status },
        { onConflict: 'user_id,group_id' }
      )
    if (error) return { error: error.message }
  }

  revalidatePath('/dashboard/communaute')
  return { success: true }
}

export async function restoreAllDismissed() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('user_community_memberships')
    .delete()
    .eq('user_id', user.id)
    .eq('status', 'dismissed')

  if (error) return { error: error.message }
  revalidatePath('/dashboard/communaute')
  return { success: true }
}

// ─── Posts Facebook personnalisés ─────────────────────────────────────────

export async function saveFacebookPost(input: {
  logementId: string | null
  title: string
  content: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const title = input.title.trim() || 'Mon post'
  const content = input.content.trim()
  if (!content) return { error: 'Contenu vide' }

  // Upsert sur (user_id, logement_id) — un seul post par logement.
  // .upsert avec onConflict ne supporte pas COALESCE sur la nullité de logement_id,
  // donc on fait un select-then-insert/update à la main.
  const existingQuery = supabase
    .from('user_facebook_posts')
    .select('id')
    .eq('user_id', user.id)
  const { data: existing } = input.logementId
    ? await existingQuery.eq('logement_id', input.logementId).maybeSingle()
    : await existingQuery.is('logement_id', null).maybeSingle()

  if (existing?.id) {
    const { error } = await supabase
      .from('user_facebook_posts')
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .eq('user_id', user.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('user_facebook_posts')
      .insert({
        user_id: user.id,
        logement_id: input.logementId,
        title,
        content,
      })
    if (error) return { error: error.message }
  }

  revalidatePath('/dashboard/communaute')
  return { success: true }
}

export async function deleteFacebookPost(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('user_facebook_posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/communaute')
  return { success: true }
}
