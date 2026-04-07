'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = 'notifications@jasonmarinho.com'

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

async function sendDriingConfirmationEmail(userEmail: string, userName: string | null) {
  const name = userName ?? userEmail
  await resend.emails.send({
    from: FROM_EMAIL,
    to: userEmail,
    subject: '⭐ Bienvenue dans la communauté Membre Driing !',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #040d0b; color: #f0f4ff; border-radius: 16px;">
        <h1 style="font-size: 28px; color: #FFD56B; margin-bottom: 8px;">Bienvenue, ${name} !</h1>
        <p style="font-size: 16px; color: rgba(240,244,255,0.7); line-height: 1.7; margin-bottom: 24px;">
          Ton adhésion en tant que <strong style="color: #FFD56B;">Membre Driing</strong> vient d'être confirmée.
          Tu as maintenant accès à l'ensemble des ressources exclusives de la plateforme.
        </p>
        <div style="background: rgba(255,213,107,0.08); border: 1px solid rgba(255,213,107,0.2); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 12px; font-weight: 600; color: #FFD56B;">Ce qui t'attend :</p>
          <ul style="margin: 0; padding-left: 20px; color: rgba(240,244,255,0.7); line-height: 2;">
            <li>Toutes les formations incluses</li>
            <li>Communauté privée Driing</li>
            <li>Accès prioritaire aux nouveaux contenus</li>
            <li>Offres partenaires exclusives</li>
            <li>Support dédié</li>
          </ul>
        </div>
        <a href="https://app.jasonmarinho.com/dashboard" style="display: inline-block; background: rgba(255,213,107,0.15); border: 1px solid rgba(255,213,107,0.3); color: #FFD56B; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600;">
          Accéder à mon espace →
        </a>
        <p style="margin-top: 32px; font-size: 12px; color: rgba(240,244,255,0.25);">
          — L'équipe Jason Marinho
        </p>
      </div>
    `,
  }).catch(() => {})
}

export async function confirmDriingMember(userId: string) {
  const { error } = await getAdminClient()
  if (error) return { error }

  const adminClient = getServiceClient()

  // Récupère l'email et le nom avant mise à jour
  const { data: userProfile } = await adminClient
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single()

  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ role: 'driing', driing_status: 'confirmed', plan: 'driing' })
    .eq('id', userId)

  if (updateError) return { error: updateError.message }

  // Email de confirmation à l'utilisateur
  if (userProfile?.email) {
    await sendDriingConfirmationEmail(userProfile.email, userProfile.full_name)
  }

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/membres')
  return { success: true }
}

export async function rejectDriingMember(userId: string) {
  const { error } = await getAdminClient()
  if (error) return { error }

  const adminClient = getServiceClient()
  const { error: updateError } = await adminClient
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
  const { error } = await getAdminClient()
  if (error) return { error }

  const validPlans = ['decouverte', 'driing']
  if (!validPlans.includes(plan)) return { error: 'Plan invalide' }

  const adminClient = getServiceClient()

  // Récupère le profil pour l'email de confirmation
  const { data: userProfile } = await adminClient
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single()

  // Quand on passe en driing : confirme le statut + rôle
  // Quand on repasse en découverte : reset driing_status
  const extraFields = plan === 'driing'
    ? { role: 'driing', driing_status: 'confirmed' }
    : { driing_status: 'none' }

  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ plan, ...extraFields })
    .eq('id', userId)

  if (updateError) return { error: updateError.message }

  // Email de confirmation si passage en Driing
  if (plan === 'driing' && userProfile?.email) {
    await sendDriingConfirmationEmail(userProfile.email, userProfile.full_name)
  }

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/membres')
  return { success: true }
}

export async function deleteUser(userId: string) {
  const { error, supabase: _ } = await getAdminClient()
  if (error) return { error }

  const adminClient = getServiceClient()
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

  if (deleteError) return { error: deleteError.message }
  revalidatePath('/dashboard/admin')
  return { success: true }
}

function isBotLike(name: string | null, email: string): boolean {
  if (name && name.length > 8 && !name.includes(' ') && /[A-Z]/.test(name) && /[a-z]/.test(name)) return true
  const local = email.split('@')[0]
  const parts = local.split('.')
  if (parts.length >= 4 && parts.every(p => p.length <= 3)) return true
  return false
}

export async function getMemberDetails(memberId: string) {
  const { error } = await getAdminClient()
  if (error) return { error }

  const adminClient = getServiceClient()

  const [
    { count: voyageursCount },
    { count: favoritesCount },
    { count: customizationsCount },
    { count: signalementsCount },
    { count: suggestionsCount },
    { count: sejoursCount },
  ] = await Promise.all([
    adminClient.from('voyageurs').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    adminClient.from('user_template_favorites').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    adminClient.from('user_template_customizations').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    adminClient.from('reported_guests').select('*', { count: 'exact', head: true }).eq('reporter_id', memberId),
    adminClient.from('suggestions').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    adminClient.from('sejours').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
  ])

  return {
    voyageurs: voyageursCount ?? 0,
    favorites: favoritesCount ?? 0,
    customizations: customizationsCount ?? 0,
    signalements: signalementsCount ?? 0,
    suggestions: suggestionsCount ?? 0,
    sejours: sejoursCount ?? 0,
  }
}

export async function deleteAllBots() {
  const { error } = await getAdminClient()
  if (error) return { error }

  const adminClient = getServiceClient()

  const { data: profiles, error: fetchError } = await adminClient
    .from('profiles')
    .select('id, email, full_name, role')

  if (fetchError) return { error: fetchError.message }

  const bots = (profiles ?? []).filter(
    p => p.role !== 'admin' && isBotLike(p.full_name, p.email),
  )

  if (bots.length === 0) return { deleted: 0 }

  const results = await Promise.all(
    bots.map(b => adminClient.auth.admin.deleteUser(b.id)),
  )

  const firstError = results.find(r => r.error)
  if (firstError?.error) return { error: firstError.error.message }

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/membres')
  return { deleted: bots.length }
}

