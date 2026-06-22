'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { buildEmail, emailBtn, emailInfoBlock, emailNote, emailP, escHtml } from '@/lib/email/template'
import { stripe } from '@/lib/stripe/client'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

const log = logger('admin/photographes/actions')
const FROM_EMAIL = 'notifications@jasonmarinho.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'
const SITE_URL = 'https://jasonmarinho.com'

const FOUNDER_PRICE_ID = process.env.STRIPE_PHOTOGRAPHER_FOUNDER_PRICE_ID || ''
const STANDARD_PRICE_ID = process.env.STRIPE_PHOTOGRAPHER_STANDARD_PRICE_ID || ''
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

/**
 * Strip accents + lowercase + alphanumeric only.
 */
function slugify(input: string): string {
  return input
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function generateUniqueSlug(admin: SupabaseClient, fullName: string, ville: string): Promise<string> {
  const base = `${slugify(fullName)}-${slugify(ville)}`
  let slug = base
  let attempt = 1
  while (true) {
    const { data } = await admin
      .from('photographers')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!data) return slug
    attempt++
    slug = `${base}-${attempt}`
    if (attempt > 10) return `${base}-${Date.now().toString().slice(-6)}`
  }
}

async function determineTier(admin: SupabaseClient): Promise<'fondateur' | 'standard'> {
  const { count } = await admin
    .from('photographers')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('tier', 'fondateur')
  return (count ?? 0) < FOUNDER_QUOTA ? 'fondateur' : 'standard'
}

/**
 * Approuve un photographe pending → status='approved_pending_payment'.
 * Détermine le tier (fondateur si quota dispo). Envoie email avec lien
 * Stripe Checkout. Le photographe n'est pas encore visible publiquement,
 * il le devient au webhook 'checkout.session.completed'.
 */
export async function approvePhotographer(photographerId: string): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }

  const admin = getServiceClient()
  const { data: ph, error: fetchErr } = await admin
    .from('photographers')
    .select('id, email, full_name, ville, status')
    .eq('id', photographerId)
    .maybeSingle()
  if (fetchErr || !ph) return { error: 'Photographe introuvable' }
  if (ph.status !== 'pending_validation') return { error: `Statut actuel : ${ph.status} (validation impossible)` }

  const tier = await determineTier(admin)
  const priceId = tier === 'fondateur' ? FOUNDER_PRICE_ID : STANDARD_PRICE_ID

  if (!priceId) {
    return { error: `STRIPE_PHOTOGRAPHER_${tier === 'fondateur' ? 'FOUNDER' : 'STANDARD'}_PRICE_ID non posé dans les env vars Vercel.` }
  }

  // Création Stripe Checkout Session (mode subscription)
  let checkoutUrl: string | null = null
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: ph.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        photographer_id: ph.id,
        tier,
      },
      subscription_data: {
        metadata: {
          photographer_id: ph.id,
          tier,
        },
      },
      success_url: `${SITE_URL}/services/photographes-lcd/inscription/confirmation?status=paid`,
      cancel_url: `${SITE_URL}/services/photographes-lcd/inscription/confirmation?status=cancel`,
      locale: 'fr',
    })
    checkoutUrl = session.url
  } catch (e) {
    log.error('stripe.checkout.create failed', e)
    return { error: 'Erreur Stripe lors de la création du paiement. Vérifie les price_id dans les env vars.' }
  }

  await admin
    .from('photographers')
    .update({
      status: 'approved_pending_payment',
      tier,
      validated_at: new Date().toISOString(),
      validated_by: auth.userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', photographerId)

  // Email au photographe
  const annual = tier === 'fondateur' ? '39,98 €' : '79,98 €'
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: ph.email,
    subject: `${ph.full_name}, ta candidature photographe LCD est validée 🎉`,
    html: buildEmail({
      title: `Bienvenue dans l'annuaire ${tier === 'fondateur' ? 'fondateur' : ''}`,
      body: `
        ${emailP(`Bonjour ${ph.full_name},`)}
        ${emailP(`Excellente nouvelle : ta candidature pour rejoindre l'annuaire des photographes LCD de Jason Marinho a été <strong>validée</strong> 🎉`)}
        ${tier === 'fondateur'
          ? emailP(`Tu fais partie des <strong>20 premiers photographes fondateurs</strong>. Ton tarif est verrouillé à <strong>${annual} TTC / an à vie</strong>, tant que ton abonnement reste actif.`)
          : emailP(`Ton abonnement annuel est de <strong>${annual} TTC / an</strong>, résiliable à tout moment depuis ton espace Stripe.`)
        }
        ${emailInfoBlock([
          { label: 'Tier', value: tier === 'fondateur' ? '🌟 Fondateur (à vie)' : 'Standard' },
          { label: 'Tarif', value: `${annual} TTC / an` },
          { label: 'Ville principale', value: escHtml(ph.ville) },
        ], '#63D683')}
        ${emailP(`Dernière étape : finalise ton abonnement via le lien sécurisé ci-dessous. Ton profil sera visible dans l'annuaire dès la confirmation Stripe.`)}
        ${emailBtn(checkoutUrl ?? '#', `Finaliser mon abonnement (${annual} / an)`, 'primary')}
        ${emailNote('Lien sécurisé Stripe. Aucun paiement n\'est débité avant ta confirmation. Tu peux toujours te désister, mais ta place fondateur reste réservée 7 jours max.')}
      `,
    }),
  }).catch(err => log.error('email approve send failed', err))

  revalidatePath('/dashboard/admin/photographes')
  return { success: true }
}

/**
 * Refuse un photographe pending. Envoie email d'explication. Pas de
 * paiement déclenché donc rien à refund.
 */
export async function rejectPhotographer(photographerId: string, reason: string): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }
  if (!reason || reason.trim().length < 10) return { error: 'Raison du refus obligatoire (≥10 chars).' }

  const admin = getServiceClient()
  const { data: ph } = await admin
    .from('photographers')
    .select('id, email, full_name, status')
    .eq('id', photographerId)
    .maybeSingle()
  if (!ph) return { error: 'Photographe introuvable' }
  if (ph.status !== 'pending_validation') return { error: `Statut actuel : ${ph.status}` }

  await admin
    .from('photographers')
    .update({
      status: 'rejected',
      rejection_reason: reason.trim().slice(0, 500),
      validated_at: new Date().toISOString(),
      validated_by: auth.userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', photographerId)

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: ph.email,
    subject: `Candidature photographe LCD — décision`,
    html: buildEmail({
      title: 'Candidature non retenue',
      body: `
        ${emailP(`Bonjour ${ph.full_name},`)}
        ${emailP(`Merci de ton intérêt pour rejoindre l'annuaire des photographes LCD de Jason Marinho.`)}
        ${emailP(`Après examen de ton portfolio et de ta candidature, nous ne pouvons malheureusement pas la retenir pour le moment. Notre annuaire est curé manuellement pour préserver une qualité homogène — ce n'est en aucun cas un jugement sur ton travail.`)}
        ${emailInfoBlock([{ label: 'Motif', value: escHtml(reason.trim()) }], '#F97583')}
        ${emailP(`Tu peux re-postuler à tout moment si ta situation évolue (nouveaux référencements LCD au portfolio, élargissement de zone, etc.). Bonne continuation à toi.`)}
      `,
    }),
  }).catch(err => log.error('email reject send failed', err))

  revalidatePath('/dashboard/admin/photographes')
  return { success: true }
}

/**
 * Récupère la queue de validation + les actifs + les rejets récents pour
 * la page admin.
 */
export async function getPhotographersQueue(): Promise<{
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
    admin.from('photographers').select('*').eq('status', 'pending_validation').order('created_at').limit(50),
    admin.from('photographers').select('*').eq('status', 'approved_pending_payment').order('validated_at', { ascending: false }).limit(50),
    admin.from('photographers').select('*').eq('status', 'active').order('validated_at', { ascending: false }).limit(100),
    admin.from('photographers').select('*').eq('status', 'rejected').order('validated_at', { ascending: false }).limit(20),
    admin.from('photographers').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('tier', 'fondateur'),
  ])

  return {
    pending: pendingRes.data ?? [],
    approvedPendingPayment: approvedRes.data ?? [],
    active: activeRes.data ?? [],
    rejected: rejectedRes.data ?? [],
    founderActiveCount: founderCountRes.count ?? 0,
  }
}
