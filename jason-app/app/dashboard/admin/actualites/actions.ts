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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié', adminClient: null }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Non autorisé', adminClient: null }
  return { error: null, adminClient: getServiceClient() }
}

function revalidate() {
  revalidatePath('/dashboard/admin/actualites')
  revalidatePath('/dashboard/actualites')
}

export async function addActualite(formData: FormData) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const title              = (formData.get('title') as string)?.trim()
  const summary            = (formData.get('summary') as string)?.trim()
  const source_url         = (formData.get('source_url') as string)?.trim() || null
  const category           = formData.get('category') as string
  const published          = formData.get('is_published') === 'true'
  const rtRaw              = formData.get('read_time_minutes') as string
  const read_time_minutes  = rtRaw ? parseInt(rtRaw, 10) || null : null

  if (!title || !summary || !category) return { success: false, error: 'Champs manquants' }

  const { error: dbError } = await adminClient.from('actualites').insert({
    title,
    summary,
    source_url,
    category,
    is_published: published,
    published_at: published ? new Date().toISOString() : null,
    read_time_minutes,
  })

  if (dbError) return { success: false, error: dbError.message }

  revalidate()
  return { success: true }
}

export async function updateActualite(id: string, formData: FormData) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const title              = (formData.get('title') as string)?.trim()
  const summary            = (formData.get('summary') as string)?.trim()
  const source_url         = (formData.get('source_url') as string)?.trim() || null
  const category           = formData.get('category') as string
  const published          = formData.get('is_published') === 'true'
  const rtRaw              = formData.get('read_time_minutes') as string
  const read_time_minutes  = rtRaw ? parseInt(rtRaw, 10) || null : null

  if (!title || !summary || !category) return { success: false, error: 'Champs manquants' }

  const { error: dbError } = await adminClient
    .from('actualites')
    .update({
      title,
      summary,
      source_url,
      category,
      is_published: published,
      published_at: published ? new Date().toISOString() : null,
      read_time_minutes,
    })
    .eq('id', id)

  if (dbError) return { success: false, error: dbError.message }

  revalidate()
  return { success: true }
}

export async function deleteActualite(id: string) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const { error: dbError } = await adminClient.from('actualites').delete().eq('id', id)
  if (dbError) return { success: false, error: dbError.message }

  revalidate()
  return { success: true }
}

export async function togglePublish(id: string, currentState: boolean) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const newState = !currentState
  const { error: dbError } = await adminClient
    .from('actualites')
    .update({
      is_published: newState,
      published_at: newState ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (dbError) return { success: false, error: dbError.message }

  revalidate()
  return { success: true }
}
