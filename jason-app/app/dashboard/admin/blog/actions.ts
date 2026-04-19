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

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function revalidate() {
  revalidatePath('/dashboard/admin/blog')
  revalidatePath('/dashboard/blog')
}

export async function addBlogPost(formData: FormData) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const title        = (formData.get('title') as string)?.trim()
  const summary      = (formData.get('summary') as string)?.trim() || null
  const content      = (formData.get('content') as string)?.trim() || null
  const category     = formData.get('category') as string
  const reading_time = parseInt(formData.get('reading_time') as string) || 5
  const published    = formData.get('is_published') === 'true'
  const customSlug   = (formData.get('slug') as string)?.trim()

  if (!title || !category) return { success: false, error: 'Titre et catégorie requis' }

  const slug = customSlug ? slugify(customSlug) : slugify(title)

  const { error: dbError } = await adminClient.from('blog_posts').insert({
    title,
    slug,
    summary,
    content,
    category,
    reading_time,
    is_published: published,
    published_at: published ? new Date().toISOString() : null,
  })

  if (dbError) return { success: false, error: dbError.message }

  revalidate()
  return { success: true }
}

export async function updateBlogPost(id: string, formData: FormData) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const title        = (formData.get('title') as string)?.trim()
  const summary      = (formData.get('summary') as string)?.trim() || null
  const content      = (formData.get('content') as string)?.trim() || null
  const category     = formData.get('category') as string
  const reading_time = parseInt(formData.get('reading_time') as string) || 5
  const published    = formData.get('is_published') === 'true'
  const customSlug   = (formData.get('slug') as string)?.trim()

  if (!title || !category) return { success: false, error: 'Titre et catégorie requis' }

  const slug = customSlug ? slugify(customSlug) : slugify(title)

  const { error: dbError } = await adminClient
    .from('blog_posts')
    .update({
      title,
      slug,
      summary,
      content,
      category,
      reading_time,
      is_published: published,
      published_at: published ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (dbError) return { success: false, error: dbError.message }

  revalidate()
  return { success: true }
}

export async function deleteBlogPost(id: string) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const { error: dbError } = await adminClient.from('blog_posts').delete().eq('id', id)
  if (dbError) return { success: false, error: dbError.message }

  revalidate()
  return { success: true }
}

export async function toggleBlogPublish(id: string, currentState: boolean) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const newState = !currentState
  const { error: dbError } = await adminClient
    .from('blog_posts')
    .update({
      is_published: newState,
      published_at: newState ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (dbError) return { success: false, error: dbError.message }

  revalidate()
  return { success: true }
}
