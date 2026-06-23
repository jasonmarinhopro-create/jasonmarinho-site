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
      success_url: `${SITE_URL}/annuaires/photographes/inscription/confirmation?status=paid`,
      cancel_url: `${SITE_URL}/annuaires/photographes/inscription/confirmation?status=cancel`,
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
 * Récupère les KPIs + listes pour la page admin photographes.
 *
 * Le flow étant désormais self-service (paiement direct), il n'y a plus
 * de queue de validation manuelle. L'admin se concentre sur :
 * - active : fiches publiques actuellement dans l'annuaire
 * - pendingPayment : inscrits qui ont créé un compte mais pas confirmé
 *   le paiement Stripe (orphelins potentiels nettoyés au prochain
 *   signup avec le même email)
 * - hidden : fiches masquées par modération (action admin)
 * - cancelled : abonnements résiliés (volonté du pro ou non-paiement)
 */
export async function getPhotographersQueue(): Promise<{
  active: any[]
  pendingPayment: any[]
  hidden: any[]
  cancelled: any[]
  founderActiveCount: number
  // Legacy pour la rétro-compat du composant existant.
  pending: any[]
  approvedPendingPayment: any[]
  rejected: any[]
  error?: string
}> {
  const auth = await requireAdmin()
  if ('error' in auth) return {
    active: [], pendingPayment: [], hidden: [], cancelled: [],
    founderActiveCount: 0,
    pending: [], approvedPendingPayment: [], rejected: [],
    error: auth.error,
  }

  const admin = getServiceClient()
  const [activeRes, pendingPaymentRes, hiddenRes, cancelledRes, founderCountRes] = await Promise.all([
    admin.from('photographers').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(200),
    admin.from('photographers').select('*').eq('status', 'pending_payment').order('created_at', { ascending: false }).limit(50),
    admin.from('photographers').select('*').eq('status', 'hidden').order('updated_at', { ascending: false }).limit(50),
    admin.from('photographers').select('*').eq('status', 'cancelled').order('updated_at', { ascending: false }).limit(50),
    admin.from('photographers').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('tier', 'fondateur'),
  ])

  return {
    active: activeRes.data ?? [],
    pendingPayment: pendingPaymentRes.data ?? [],
    hidden: hiddenRes.data ?? [],
    cancelled: cancelledRes.data ?? [],
    founderActiveCount: founderCountRes.count ?? 0,
    pending: [], approvedPendingPayment: [], rejected: [],
  }
}

/**
 * Masque une fiche active (post-modération) sans toucher à l'abonnement
 * Stripe. Le pro reste facturé mais sa fiche n'est plus dans l'annuaire
 * public. Utilisé en cas de signalement / problème à investiguer.
 */
export async function hidePhotographer(photographerId: string): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }

  const admin = getServiceClient()
  await admin
    .from('photographers')
    .update({
      status: 'hidden',
      is_public: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', photographerId)

  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
  if (hookUrl) fetch(hookUrl, { method: 'POST' }).catch(() => {})

  revalidatePath('/dashboard/admin/photographes')
  return { success: true }
}

/**
 * Réactive une fiche masquée. Le pro était toujours facturé pendant la
 * mise en sommeil donc retour immédiat dans l'annuaire.
 */
export async function unhidePhotographer(photographerId: string): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }

  const admin = getServiceClient()
  await admin
    .from('photographers')
    .update({
      status: 'active',
      is_public: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', photographerId)

  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
  if (hookUrl) fetch(hookUrl, { method: 'POST' }).catch(() => {})

  revalidatePath('/dashboard/admin/photographes')
  return { success: true }
}

/**
 * Supprime un orphelin pending_payment qui ne s'est jamais converti.
 * Nettoie la row + le compte Supabase Auth.
 */
export async function deleteOrphanPhotographer(photographerId: string): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }

  const admin = getServiceClient()
  const { data: ph } = await admin
    .from('photographers')
    .select('id, status, stripe_subscription_id, user_id')
    .eq('id', photographerId)
    .maybeSingle()
  if (!ph) return { error: 'Photographe introuvable' }
  if (ph.status !== 'pending_payment' || ph.stripe_subscription_id) {
    return { error: 'Cet enregistrement n\'est pas un orphelin (paiement actif ou autre statut).' }
  }

  await admin.from('photographers').delete().eq('id', photographerId)
  if (ph.user_id) {
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${ph.user_id}`, {
      method: 'DELETE',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
    }).catch(() => {})
  }

  revalidatePath('/dashboard/admin/photographes')
  return { success: true }
}
