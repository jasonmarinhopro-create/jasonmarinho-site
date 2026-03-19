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

export async function addTemplate(formData: FormData) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const category = formData.get('category') as string

  if (!title?.trim() || !content?.trim() || !category) return { success: false, error: 'Champs manquants' }

  const { error: dbError } = await adminClient.from('templates').insert({
    title: title.trim(),
    content: content.trim(),
    category,
    copy_count: 0,
  })

  if (dbError) return { success: false, error: dbError.message }

  revalidatePath('/dashboard/admin/gabarits')
  revalidatePath('/dashboard/gabarits')
  return { success: true }
}

export async function deleteTemplate(templateId: string) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const { error: dbError } = await adminClient.from('templates').delete().eq('id', templateId)
  if (dbError) return { success: false, error: dbError.message }

  revalidatePath('/dashboard/admin/gabarits')
  revalidatePath('/dashboard/gabarits')
  return { success: true }
}

export async function updateTemplate(templateId: string, formData: FormData) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const category = formData.get('category') as string

  const { error: dbError } = await adminClient.from('templates').update({
    title: title.trim(),
    content: content.trim(),
    category,
  }).eq('id', templateId)

  if (dbError) return { success: false, error: dbError.message }

  revalidatePath('/dashboard/admin/gabarits')
  revalidatePath('/dashboard/gabarits')
  return { success: true }
}
