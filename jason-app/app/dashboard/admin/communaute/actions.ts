'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { revalidatePath, revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/queries/cache'

function getServiceClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié', adminClient: null }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'admin') return { error: 'Non autorisé', adminClient: null }
  return { error: null, adminClient: getServiceClient() }
}

function revalidate() {
  revalidateTag(CACHE_TAGS.COMMUNITY_GROUPS)
  revalidatePath('/dashboard/admin/communaute')
  revalidatePath('/dashboard/communaute')
  revalidatePath('/dashboard')
}

export async function addGroup(formData: FormData) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const name         = (formData.get('name') as string)?.trim()
  const description  = (formData.get('description') as string)?.trim() ?? ''
  const platform     = formData.get('platform') as string
  const url          = (formData.get('url') as string)?.trim()
  const members_count = parseInt(formData.get('members_count') as string) || 0
  const category     = (formData.get('category') as string)?.trim() || 'Général'
  const tag          = (formData.get('tag') as string)?.trim() || null
  const sort_order   = parseInt(formData.get('sort_order') as string) || 0

  if (!name || !url || !platform) return { success: false, error: 'Champs manquants' }

  const { error: dbError } = await adminClient.from('community_groups').insert({
    name, description, platform, url, members_count, category, tag, sort_order,
  })

  if (dbError) return { success: false, error: dbError.message }
  revalidate()
  return { success: true }
}

export async function updateGroup(groupId: string, formData: FormData) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const name         = (formData.get('name') as string)?.trim()
  const description  = (formData.get('description') as string)?.trim() ?? ''
  const platform     = formData.get('platform') as string
  const url          = (formData.get('url') as string)?.trim()
  const members_count = parseInt(formData.get('members_count') as string) || 0
  const category     = (formData.get('category') as string)?.trim() || 'Général'
  const tag          = (formData.get('tag') as string)?.trim() || null
  const sort_order   = parseInt(formData.get('sort_order') as string) || 0

  if (!name || !url || !platform) return { success: false, error: 'Champs manquants' }

  const { error: dbError } = await adminClient
    .from('community_groups')
    .update({ name, description, platform, url, members_count, category, tag, sort_order })
    .eq('id', groupId)

  if (dbError) return { success: false, error: dbError.message }
  revalidate()
  return { success: true }
}

export async function deleteGroup(groupId: string) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const { error: dbError } = await adminClient.from('community_groups').delete().eq('id', groupId)
  if (dbError) return { success: false, error: dbError.message }
  revalidate()
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
  revalidate()
  return { success: true }
}
