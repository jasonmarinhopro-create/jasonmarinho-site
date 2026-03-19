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

export async function toggleFormationPublished(formationId: string, isPublished: boolean) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const { error: dbError } = await adminClient
    .from('formations')
    .update({ is_published: isPublished })
    .eq('id', formationId)

  if (dbError) return { success: false, error: dbError.message }

  revalidatePath('/dashboard/admin/formations')
  revalidatePath('/dashboard/formations')
  return { success: true }
}

export async function deleteFormation(formationId: string) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const { error: dbError } = await adminClient.from('formations').delete().eq('id', formationId)
  if (dbError) return { success: false, error: dbError.message }

  revalidatePath('/dashboard/admin/formations')
  revalidatePath('/dashboard/formations')
  return { success: true }
}
