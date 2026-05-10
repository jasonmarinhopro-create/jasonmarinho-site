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
  postId?: string | null
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

  if (input.postId) {
    // Mise à jour d'un post existant.
    const { error } = await supabase
      .from('user_facebook_posts')
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq('id', input.postId)
      .eq('user_id', user.id)
    if (error) return { error: error.message }
  } else {
    // Création d'un nouveau post (plusieurs posts par logement autorisés).
    const { data, error } = await supabase
      .from('user_facebook_posts')
      .insert({
        user_id: user.id,
        logement_id: input.logementId,
        title,
        content,
      })
      .select('id')
      .single()
    if (error) return { error: error.message }
    revalidatePath('/dashboard/communaute')
    return { success: true, postId: data?.id ?? null }
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
