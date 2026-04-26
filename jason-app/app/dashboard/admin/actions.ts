'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { buildEmail, emailBtn, emailP } from '@/lib/email/template'
import { CACHE_TAGS } from '@/lib/queries/cache'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }
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
  const name = userName ?? 'toi'
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: userEmail,
    subject: 'Ton accès Membre Driing est confirmé',
    html: buildEmail({
      title: `Bienvenue, ${name}`,
      preview: 'Ton adhésion Membre Driing est validée. Toutes les formations sont maintenant accessibles.',
      body: `
        ${emailP('Ton adhésion en tant que <strong style="color:#FFD56B;">Membre Driing</strong> vient d\'être confirmée. Tu as maintenant accès à l\'ensemble des ressources de la plateforme.')}
        <div style="background:#0a1a13;border:1px solid #1a3328;border-left:2px solid #FFD56B;border-radius:10px;padding:18px 20px;margin:0 0 24px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#FFD56B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:0.3px;">INCLUS DANS TON ABONNEMENT</p>
          <p style="margin:0;font-size:14px;color:#7a9e8a;line-height:2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
            Toutes les formations en accès illimité<br/>
            Communauté privée Driing<br/>
            Nouveaux contenus en accès prioritaire<br/>
            Offres partenaires exclusives<br/>
            Support dédié
          </p>
        </div>
        ${emailBtn('https://app.jasonmarinho.com/dashboard', 'Accéder à mon espace', 'primary')}
      `,
    }),
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
  revalidatePath('/dashboard/abonnement')
  revalidatePath('/dashboard')
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
  revalidatePath('/dashboard/abonnement')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function toggleContributor(userId: string, value: boolean) {
  const { error } = await getAdminClient()
  if (error) return { error }

  const { error: updateError } = await getServiceClient()
    .from('profiles')
    .update({ is_contributor: value })
    .eq('id', userId)

  if (updateError) return { error: updateError.message }

  revalidateTag(CACHE_TAGS.CONTRIBUTORS)
  revalidatePath('/dashboard/admin/membres')
  revalidatePath('/dashboard/contributeurs')
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
    { data: memberships },
    { count: auditsCount },
    { count: auditsCompletedCount },
  ] = await Promise.all([
    adminClient.from('voyageurs').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    adminClient.from('user_template_favorites').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    adminClient.from('user_template_customizations').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    adminClient.from('reported_guests').select('*', { count: 'exact', head: true }).eq('reporter_id', memberId),
    adminClient.from('suggestions').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    adminClient.from('sejours').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    adminClient.from('user_community_memberships').select('group_id').eq('user_id', memberId).eq('status', 'joined'),
    adminClient.from('audit_gbp_sessions').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    adminClient.from('audit_gbp_sessions').select('*', { count: 'exact', head: true }).eq('user_id', memberId).not('completed_at', 'is', null),
  ])

  // Calcule la portée totale via une 2e requête (la jointure native fail sans FK)
  const groupIds = (memberships ?? []).map(m => m.group_id)
  let totalReach = 0
  if (groupIds.length > 0) {
    const { data: groups } = await adminClient
      .from('community_groups')
      .select('member_count')
      .in('id', groupIds)
    totalReach = (groups ?? []).reduce((sum, g) => sum + (g.member_count ?? 0), 0)
  }

  return {
    voyageurs: voyageursCount ?? 0,
    favorites: favoritesCount ?? 0,
    customizations: customizationsCount ?? 0,
    signalements: signalementsCount ?? 0,
    suggestions: suggestionsCount ?? 0,
    sejours: sejoursCount ?? 0,
    communityGroupsCount: groupIds.length,
    communityTotalReach: totalReach,
    auditsCount: auditsCount ?? 0,
    auditsCompleted: auditsCompletedCount ?? 0,
  }
}

export async function getFullMemberProfile(memberId: string) {
  const { error } = await getAdminClient()
  if (error) return { error }

  const adminClient = getServiceClient()

  const [
    { data: memberProfile },
    { data: formations },
    { count: voyageursCount },
    { count: favoritesCount },
    { count: customizationsCount },
    { count: signalementsCount },
    { count: suggestionsCount },
    { count: sejoursCount },
    { data: communityMemberships },
    { data: audits },
  ] = await Promise.all([
    adminClient
      .from('profiles')
      .select('id, email, full_name, role, driing_status, plan, created_at, admin_notes')
      .eq('id', memberId)
      .single(),
    adminClient
      .from('user_formations')
      .select('id, progress, enrolled_at, completed_at, formation:formations(id, title, slug, duration, level)')
      .eq('user_id', memberId)
      .order('enrolled_at', { ascending: false }),
    adminClient.from('voyageurs').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    adminClient.from('user_template_favorites').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    adminClient.from('user_template_customizations').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    adminClient.from('reported_guests').select('*', { count: 'exact', head: true }).eq('reporter_id', memberId),
    adminClient.from('suggestions').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    adminClient.from('sejours').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    // ─── Communauté Facebook : groupes rejoints (sans jointure pour éviter FK manquante) ───
    adminClient
      .from('user_community_memberships')
      .select('group_id')
      .eq('user_id', memberId)
      .eq('status', 'joined'),
    // ─── Audits GBP : sessions complétées + brouillons ───
    adminClient
      .from('audit_gbp_sessions')
      .select('id, business_name, started_at, completed_at, score_global')
      .eq('user_id', memberId)
      .order('started_at', { ascending: false })
      .limit(5),
  ])

  if (!memberProfile) return { error: 'Membre introuvable' }

  // Récupère les détails des groupes rejoints en 2e requête (jointure native peu fiable sans FK)
  const groupIds = (communityMemberships ?? []).map(m => m.group_id)
  let joinedGroups: { id: string; name: string | null; member_count: number }[] = []
  if (groupIds.length > 0) {
    const { data: groupsData } = await adminClient
      .from('community_groups')
      .select('id, name, member_count')
      .in('id', groupIds)
    joinedGroups = (groupsData ?? []).map(g => ({
      id: g.id as string,
      name: (g.name as string) ?? null,
      member_count: (g.member_count as number) ?? 0,
    }))
  }
  const totalReach = joinedGroups.reduce((sum, g) => sum + (g.member_count ?? 0), 0)

  // Audits : split complétés vs brouillons
  const auditsData = audits ?? []
  const completedAudits = auditsData.filter(a => a.completed_at)
  const draftAudits = auditsData.filter(a => !a.completed_at)
  const bestScore = completedAudits.reduce((max, a) => Math.max(max, a.score_global ?? 0), 0)

  return {
    profile: memberProfile,
    formations: formations ?? [],
    stats: {
      voyageurs: voyageursCount ?? 0,
      favorites: favoritesCount ?? 0,
      customizations: customizationsCount ?? 0,
      signalements: signalementsCount ?? 0,
      suggestions: suggestionsCount ?? 0,
      sejours: sejoursCount ?? 0,
      communityGroupsCount: joinedGroups.length,
      communityTotalReach: totalReach,
      auditsCount: auditsData.length,
      auditsCompleted: completedAudits.length,
      auditsBestScore: bestScore,
    },
    community: { joinedGroups },
    audits: auditsData,
  }
}

export async function updateMemberName(memberId: string, fullName: string) {
  const { error } = await getAdminClient()
  if (error) return { error }

  const adminClient = getServiceClient()
  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ full_name: fullName.trim() || null })
    .eq('id', memberId)

  if (updateError) return { error: updateError.message }
  revalidatePath('/dashboard/admin/membres')
  return { success: true }
}

export async function updateAdminNotes(memberId: string, notes: string) {
  const { error } = await getAdminClient()
  if (error) return { error }

  const adminClient = getServiceClient()
  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ admin_notes: notes.trim() || null })
    .eq('id', memberId)

  if (updateError) return { error: updateError.message }
  revalidatePath(`/dashboard/admin/membres/${memberId}`)
  revalidatePath('/dashboard/admin/membres')
  return { success: true }
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

