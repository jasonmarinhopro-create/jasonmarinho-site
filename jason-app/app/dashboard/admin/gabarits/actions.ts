'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

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

function parseTags(raw: string | null): string[] | null {
  if (!raw?.trim()) return null
  const tags = raw.split(',').map(t => t.trim()).filter(Boolean)
  return tags.length > 0 ? tags : null
}

export async function addTemplate(formData: FormData) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const title    = (formData.get('title') as string)?.trim()
  const content  = (formData.get('content') as string)?.trim()
  const category = formData.get('category') as string
  const timing   = (formData.get('timing') as string)?.trim() || null
  const variante = (formData.get('variante') as string)?.trim() || null
  const corps_en = (formData.get('corps_en') as string)?.trim() || null
  const tags     = parseTags(formData.get('tags') as string)

  if (!title || !content || !category) return { success: false, error: 'Champs manquants' }

  const { error: dbError } = await adminClient.from('templates').insert({
    title, content, category, timing, variante, corps_en, tags, copy_count: 0,
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

  const title    = (formData.get('title') as string)?.trim()
  const content  = (formData.get('content') as string)?.trim()
  const category = formData.get('category') as string
  const timing   = (formData.get('timing') as string)?.trim() || null
  const variante = (formData.get('variante') as string)?.trim() || null
  const corps_en = (formData.get('corps_en') as string)?.trim() || null
  const tags     = parseTags(formData.get('tags') as string)

  if (!title || !content || !category) return { success: false, error: 'Champs manquants' }

  const { error: dbError } = await adminClient
    .from('templates')
    .update({ title, content, category, timing, variante, corps_en, tags })
    .eq('id', templateId)

  if (dbError) return { success: false, error: dbError.message }

  revalidatePath('/dashboard/admin/gabarits')
  revalidatePath('/dashboard/gabarits')
  return { success: true }
}
