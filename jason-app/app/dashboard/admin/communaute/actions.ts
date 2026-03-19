'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié', adminClient: null }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'admin') return { error: 'Non autorisé', adminClient: null }
  return { error: null, adminClient: createAdminClient() }
}

export async function addGroup(formData: FormData) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const platform = formData.get('platform') as string
  const url = formData.get('url') as string
  const members_count = parseInt(formData.get('members_count') as string) || 0

  if (!name?.trim() || !url?.trim() || !platform) return { success: false, error: 'Champs manquants' }

  const { error: dbError } = await adminClient.from('community_groups').insert({
    name: name.trim(),
    description: description?.trim() ?? '',
    platform,
    url: url.trim(),
    members_count,
  })

  if (dbError) return { success: false, error: dbError.message }

  revalidatePath('/dashboard/admin/communaute')
  revalidatePath('/dashboard/communaute')
  return { success: true }
}

export async function deleteGroup(groupId: string) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const { error: dbError } = await adminClient.from('community_groups').delete().eq('id', groupId)
  if (dbError) return { success: false, error: dbError.message }

  revalidatePath('/dashboard/admin/communaute')
  revalidatePath('/dashboard/communaute')
  return { success: true }
}

export async function updateGroupMembersCount(groupId: string, count: number) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const { error: dbError } = await adminClient
    .from('community_groups')
    .update({ members_count: count })
    .eq('id', groupId)

  if (dbError) return { success: false, error: dbError.message }

  revalidatePath('/dashboard/admin/communaute')
  revalidatePath('/dashboard/communaute')
  return { success: true }
}
