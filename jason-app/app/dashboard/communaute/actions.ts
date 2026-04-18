'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function setGroupMembership(groupId: string, status: 'joined' | 'dismissed' | null) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  if (status === null) {
    const { error } = await supabase
      .from('user_community_memberships')
      .delete()
      .eq('user_id', session.user.id)
      .eq('group_id', groupId)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('user_community_memberships')
      .upsert(
        { user_id: session.user.id, group_id: groupId, status },
        { onConflict: 'user_id,group_id' }
      )
    if (error) return { error: error.message }
  }

  revalidatePath('/dashboard/communaute')
  return { success: true }
}

export async function restoreAllDismissed() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('user_community_memberships')
    .delete()
    .eq('user_id', session.user.id)
    .eq('status', 'dismissed')

  if (error) return { error: error.message }
  revalidatePath('/dashboard/communaute')
  return { success: true }
}
