'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAIL = 'djason.marinho@gmail.com'

export async function submitRoadmapIdea(title: string, description: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_contributor, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.is_contributor && user.email !== ADMIN_EMAIL) {
    return { error: 'Réservé aux contributeurs' }
  }

  const { data, error } = await supabase
    .from('roadmap_items')
    .insert({
      title:       title.trim().slice(0, 200),
      description: description.trim().slice(0, 600) || null,
      status:      'suggestion',
      author_id:   user.id,
      author_name: profile?.full_name ?? 'Contributeur',
    })
    .select('id, title, description, status, author_id, author_name, created_at')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/contributeurs')
  return { data: data! }
}

export async function voteRoadmapItem(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const { data: existing } = await supabase
    .from('roadmap_votes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .maybeSingle()

  if (existing) {
    await supabase.from('roadmap_votes')
      .delete().eq('user_id', user.id).eq('item_id', itemId)
  } else {
    await supabase.from('roadmap_votes')
      .insert({ user_id: user.id, item_id: itemId })
  }

  return { success: true }
}

export async function addRoadmapComment(itemId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data, error } = await supabase
    .from('roadmap_comments')
    .insert({
      item_id:     itemId,
      author_id:   user.id,
      author_name: profile?.full_name ?? 'Contributeur',
      content:     content.trim().slice(0, 400),
    })
    .select('id, item_id, author_id, author_name, content, created_at')
    .single()

  if (error) return { error: error.message }
  return { data: data! }
}

export async function updateRoadmapStatus(itemId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return { error: 'Non autorisé' }

  const validStatuses = ['suggestion', 'planned', 'in_progress', 'done']
  if (!validStatuses.includes(status)) return { error: 'Statut invalide' }

  const { error } = await supabase
    .from('roadmap_items')
    .update({ status })
    .eq('id', itemId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/contributeurs')
  return { success: true }
}

export async function deleteRoadmapItem(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return { error: 'Non autorisé' }

  const { error } = await supabase
    .from('roadmap_items')
    .delete()
    .eq('id', itemId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/contributeurs')
  return { success: true }
}
