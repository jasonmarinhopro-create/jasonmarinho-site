'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { buildEmail, emailBtn, emailInfoBlock, emailNote, emailP, escHtml } from '@/lib/email/template'
import { stripe } from '@/lib/stripe/client'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

const log = logger('admin/menage/actions')
const FROM_EMAIL = 'notifications@jasonmarinho.com'
const SITE_URL = 'https://jasonmarinho.com'

const FOUNDER_PRICE_ID = process.env.STRIPE_CLEANER_FOUNDER_PRICE_ID || ''
const STANDARD_PRICE_ID = process.env.STRIPE_CLEANER_STANDARD_PRICE_ID || ''
const FOUNDER_QUOTA = 20

function getResend() { return new Resend(process.env.RESEND_API_KEY) }

function getServiceClient(): SupabaseClient<any, 'public', any> {
  return createServiceClient<any, 'public', any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function requireAdmin(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role !== 'admin') return { error: 'Réservé administrateur' }
  return { userId: user.id }
}

function slugify(input: string): string {
  return input
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function determineTier(admin: SupabaseClient): Promise<'fondateur' | 'standard'> {
  const { count } = await admin
    .from('cleaners')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('tier', 'fondateur')
  return (count ?? 0) < FOUNDER_QUOTA ? 'fondateur' : 'standard'
}

/**
 * Approuve une équipe ménage pending → status='approved_pending_payment'.
 * Détermine le tier (fondateur si quota dispo). Envoie email avec lien
 * Stripe Checkout. Profil visible publiquement au webhook
 * customer.subscription.created.
 */
export async function approveCleaner(cleanerId: string): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }

  const admin = getServiceClient()
  const { data: cl, error: fetchErr } = await admin
    .from('cleaners')
    .select('id, email, full_name, pseudo, ville, status')
    .eq('id', cleanerId)
    .maybeSingle()
  if (fetchErr || !cl) return { error: 'Équipe introuvable' }
  if (cl.status !== 'pending_validation') return { error: `Statut actuel : ${cl.status} (validation impossible)` }

  const tier = await determineTier(admin)
  const priceId = tier === 'fondateur' ? FOUNDER_PRICE_ID : STANDARD_PRICE_ID

  if (!priceId) {
    return { error: `STRIPE_CLEANER_${tier === 'fondateur' ? 'FOUNDER' : 'STANDARD'}_PRICE_ID non posé dans les env vars Vercel.` }
  }

  const displayName = cl.pseudo || cl.full_name

  let checkoutUrl: string | null = null
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: cl.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        cleaner_id: cl.id,
        tier,
      },
      subscription_data: {
        metadata: {
          cleaner_id: cl.id,
          tier,
        },
      },
      success_url: `${SITE_URL}/annuaires/menage/inscription/confirmation?status=paid`,
      cancel_url: `${SITE_URL}/annuaires/menage/inscription/confirmation?status=cancel`,
      locale: 'fr',
    })
    checkoutUrl = session.url
  } catch (e) {
    log.error('stripe.checkout.create failed', e)
    return { error: 'Erreur Stripe lors de la création du paiement. Vérifie les price_id dans les env vars.' }
  }

  await admin
    .from('cleaners')
    .update({
      status: 'approved_pending_payment',
      tier,
      validated_at: new Date().toISOString(),
      validated_by: auth.userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cleanerId)

  const annual = tier === 'fondateur' ? '39,98 €' : '79,98 €'
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: cl.email,
    subject: `${displayName}, ta candidature ménage LCD est validée 🎉`,
    html: buildEmail({
      title: `Bienvenue dans l'annuaire ${tier === 'fondateur' ? 'fondateur' : ''}`,
      body: `
        ${emailP(`Bonjour ${cl.full_name},`)}
        ${emailP(`Excellente nouvelle : ta candidature pour rejoindre l'annuaire des équipes de ménage LCD de Jason Marinho a été <strong>validée</strong> 🎉`)}
        ${tier === 'fondateur'
          ? emailP(`Tu fais partie des <strong>20 premières équipes fondatrices</strong>. Ton tarif est verrouillé à <strong>${annual} TTC / an à vie</strong>, tant que ton abonnement reste actif.`)
          : emailP(`Ton abonnement annuel est de <strong>${annual} TTC / an</strong>, résiliable à tout moment depuis ton espace Stripe.`)
        }
        ${emailInfoBlock([
          { label: 'Tier', value: tier === 'fondateur' ? '🌟 Fondateur (à vie)' : 'Standard' },
          { label: 'Tarif', value: `${annual} TTC / an` },
          { label: 'Ville principale', value: escHtml(cl.ville) },
        ], '#63D683')}
        ${emailP(`Dernière étape : finalise ton abonnement via le lien sécurisé ci-dessous. Ta fiche sera visible dans l'annuaire dès la confirmation Stripe.`)}
        ${emailBtn(checkoutUrl ?? '#', `Finaliser mon abonnement (${annual} / an)`, 'primary')}
        ${emailNote('Lien sécurisé Stripe. Aucun paiement n\'est débité avant ta confirmation. Ta place fondateur reste réservée 7 jours max.')}
      `,
    }),
  }).catch(err => log.error('email approve send failed', err))

  revalidatePath('/dashboard/admin/menage')
  return { success: true }
}

/**
 * Refuse une équipe ménage pending. Envoie email d'explication.
 */
export async function rejectCleaner(cleanerId: string, reason: string): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }
  if (!reason || reason.trim().length < 10) return { error: 'Raison du refus obligatoire (≥10 chars).' }

  const admin = getServiceClient()
  const { data: cl } = await admin
    .from('cleaners')
    .select('id, email, full_name, pseudo, status')
    .eq('id', cleanerId)
    .maybeSingle()
  if (!cl) return { error: 'Équipe introuvable' }
  if (cl.status !== 'pending_validation') return { error: `Statut actuel : ${cl.status}` }

  const displayName = cl.pseudo || cl.full_name

  await admin
    .from('cleaners')
    .update({
      status: 'rejected',
      rejection_reason: reason.trim().slice(0, 500),
      validated_at: new Date().toISOString(),
      validated_by: auth.userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cleanerId)

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: cl.email,
    subject: `Candidature ménage LCD — décision`,
    html: buildEmail({
      title: 'Candidature non retenue',
      body: `
        ${emailP(`Bonjour ${cl.full_name},`)}
        ${emailP(`Merci de ton intérêt pour rejoindre l'annuaire des équipes de ménage LCD de Jason Marinho.`)}
        ${emailP(`Après examen de ton dossier, nous ne pouvons malheureusement pas le retenir pour le moment. Notre annuaire est curé manuellement pour préserver une qualité homogène — ce n'est en aucun cas un jugement sur ton activité.`)}
        ${emailInfoBlock([{ label: 'Motif', value: escHtml(reason.trim()) }], '#F97583')}
        ${emailP(`Tu peux re-postuler à tout moment si ta situation évolue (élargissement de zone, montée en capacité, nouvelles références LCD, etc.). Bonne continuation.`)}
      `,
    }),
  }).catch(err => log.error('email reject send failed', err))

  revalidatePath('/dashboard/admin/menage')
  return { success: true }
}

export async function getCleanersQueue(): Promise<{
  pending: any[]
  approvedPendingPayment: any[]
  active: any[]
  rejected: any[]
  founderActiveCount: number
  error?: string
}> {
  const auth = await requireAdmin()
  if ('error' in auth) return { pending: [], approvedPendingPayment: [], active: [], rejected: [], founderActiveCount: 0, error: auth.error }

  const admin = getServiceClient()
  const [pendingRes, approvedRes, activeRes, rejectedRes, founderCountRes] = await Promise.all([
    admin.from('cleaners').select('*').eq('status', 'pending_validation').order('created_at').limit(50),
    admin.from('cleaners').select('*').eq('status', 'approved_pending_payment').order('validated_at', { ascending: false }).limit(50),
    admin.from('cleaners').select('*').eq('status', 'active').order('validated_at', { ascending: false }).limit(100),
    admin.from('cleaners').select('*').eq('status', 'rejected').order('validated_at', { ascending: false }).limit(20),
    admin.from('cleaners').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('tier', 'fondateur'),
  ])

  return {
    pending: pendingRes.data ?? [],
    approvedPendingPayment: approvedRes.data ?? [],
    active: activeRes.data ?? [],
    rejected: rejectedRes.data ?? [],
    founderActiveCount: founderCountRes.count ?? 0,
  }
}
