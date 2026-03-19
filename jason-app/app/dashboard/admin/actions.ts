'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function getAdminClient() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié', supabase: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Non autorisé', supabase: null }
  return { error: null, supabase }
}

export async function confirmDriingMember(userId: string) {
  const { error, supabase } = await getAdminClient()
  if (error || !supabase) return { error }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'driing', driing_status: 'confirmed' })
    .eq('id', userId)

  if (updateError) return { error: updateError.message }
  revalidatePath('/dashboard/admin')
  return { success: true }
}

export async function rejectDriingMember(userId: string) {
  const { error, supabase } = await getAdminClient()
  if (error || !supabase) return { error }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ driing_status: 'none' })
    .eq('id', userId)

  if (updateError) return { error: updateError.message }
  revalidatePath('/dashboard/admin')
  return { success: true }
}

export async function validateReport(reportId: string) {
  const { error, supabase } = await getAdminClient()
  if (error || !supabase) return { error }

  const { error: updateError } = await supabase
    .from('reported_guests')
    .update({ is_validated: true })
    .eq('id', reportId)

  if (updateError) return { error: updateError.message }
  revalidatePath('/dashboard/admin')
  return { success: true }
}

export async function deleteReport(reportId: string) {
  const { error, supabase } = await getAdminClient()
  if (error || !supabase) return { error }

  const { error: deleteError } = await supabase
    .from('reported_guests')
    .delete()
    .eq('id', reportId)

  if (deleteError) return { error: deleteError.message }
  revalidatePath('/dashboard/admin')
  return { success: true }
}

export async function deleteSuggestion(suggestionId: string) {
  const { error, supabase } = await getAdminClient()
  if (error || !supabase) return { error }

  const { error: deleteError } = await supabase
    .from('suggestions')
    .delete()
    .eq('id', suggestionId)

  if (deleteError) return { error: deleteError.message }
  revalidatePath('/dashboard/admin')
  return { success: true }
}

export async function changeUserPlan(userId: string, plan: string) {
  const { error, supabase } = await getAdminClient()
  if (error || !supabase) return { error }

  const validPlans = ['decouverte', 'driing']
  if (!validPlans.includes(plan)) return { error: 'Plan invalide' }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ plan })
    .eq('id', userId)

  if (updateError) return { error: updateError.message }
  revalidatePath('/dashboard/admin')
  return { success: true }
}

export async function deleteUser(userId: string) {
  // Verify requester is admin first
  const { error, supabase: _ } = await getAdminClient()
  if (error) return { error }

  // Use service role to delete the auth user (cascades to profile)
  const adminClient = getServiceClient()
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

  if (deleteError) return { error: deleteError.message }
  revalidatePath('/dashboard/admin')
  return { success: true }
}
