'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { checkAllUrls } from '@/lib/seo/check-indexation'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Non autorisé')
}

export async function refreshIndexationNow(): Promise<{ checked?: number; error?: string }> {
  try {
    await requireAdmin()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erreur inattendue' }
  }
  const result = await checkAllUrls()
  revalidatePath('/dashboard/admin/indexation')
  return result
}
