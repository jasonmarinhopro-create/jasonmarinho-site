'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }
const NOTIFY_EMAIL = 'contact@jasonmarinho.com'
const FROM_EMAIL = 'notifications@jasonmarinho.com'

export async function requestDriingUpgrade(driingEmail: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié.' }

  if (!driingEmail || !driingEmail.includes('@')) return { error: 'Adresse e-mail invalide.' }

  // Récupère le profil pour avoir le nom
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, driing_status, plan')
    .eq('id', session.user.id)
    .maybeSingle()

  // Cas incohérent : driing_status confirmé mais plan pas encore mis à jour
  // (bug de l'ancienne version) → on corrige directement
  if (profile?.driing_status === 'confirmed' && profile?.plan !== 'driing') {
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    await adminClient.from('profiles').update({ plan: 'driing', role: 'driing' }).eq('id', session.user.id)
    revalidatePath('/dashboard/abonnement')
    return { success: true }
  }

  if (profile?.driing_status === 'pending') return { error: 'Ta demande est déjà en cours de traitement.' }
  if (profile?.driing_status === 'confirmed') return { error: 'Tu es déjà Membre Driing.' }

  // Marque la demande comme en attente
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ driing_status: 'pending' })
    .eq('id', session.user.id)

  if (updateError) return { error: `Erreur : ${updateError.message}` }

  revalidatePath('/dashboard/abonnement')

  // Notification email à l'admin
  const userEmail = profile?.email ?? session.user.email ?? 'inconnu'
  const userName = profile?.full_name ?? userEmail

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: NOTIFY_EMAIL,
    subject: `⭐ Demande Membre Driing — ${userName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #d97706;">⭐ Nouvelle demande Membre Driing</h2>
        <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px;"><strong>Utilisateur :</strong> ${userName} (${userEmail})</p>
          <p style="margin: 0;"><strong>E-mail Driing fourni :</strong> ${driingEmail}</p>
        </div>
        <p style="color: #666; font-size: 13px;">
          À valider dans le panel admin : <a href="https://app.jasonmarinho.com/dashboard/admin/membres">Panel Admin</a>
        </p>
      </div>
    `,
  }).catch(() => {})

  return { success: true }
}
