import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { planFromPriceId } from '@/lib/constants/stripe-plans'
import { invalidateProfileCache } from '@/lib/queries/profile'
import { sendPaiementReceivedEmail } from '@/lib/email/host'
import { sendProWelcomeEmail } from '@/lib/email/pro-welcome'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

// Helper : envoie un email 'paiement reçu' au hôte. Best-effort, async,
// ne bloque pas le webhook.
async function notifyHostPayment(
  db: SupabaseClient,
  contractId: string,
  type: 'loyer' | 'caution',
): Promise<void> {
  try {
    const { data: c } = await db
      .from('contracts')
      .select('bailleur_email, bailleur_prenom, locataire_prenom, locataire_nom, date_arrivee, montant_loyer, montant_caution, sejour_id')
      .eq('id', contractId)
      .single()
    if (!c?.bailleur_email) return
    const montant = type === 'loyer' ? Number(c.montant_loyer ?? 0) : Number(c.montant_caution ?? 0)
    if (montant <= 0) return
    await sendPaiementReceivedEmail({
      to: c.bailleur_email,
      hostFirstName: c.bailleur_prenom ?? '',
      guestFullName: `${c.locataire_prenom ?? ''} ${c.locataire_nom ?? ''}`.trim() || 'Voyageur',
      type,
      montant,
      dateArrivee: c.date_arrivee ?? undefined,
      dashboardUrl: c.sejour_id ? `${APP_URL}/dashboard/voyageurs?sejour=${c.sejour_id}` : `${APP_URL}/dashboard/calendrier`,
    })
  } catch (e) {
    console.warn('[dispatch] notifyHostPayment failed', e)
  }
}

// Applique l'effet d'un event Stripe sur Supabase. Utilisé par le webhook
// et par l'endpoint admin /api/stripe/sync (replay manuel).
export async function dispatchStripeEvent(event: Stripe.Event, db: SupabaseClient): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const contractId = session.metadata?.contract_id
      if (!contractId || session.payment_status !== 'paid') break

      const paymentIntentId = session.payment_intent as string
      const type = session.metadata?.type

      const { data: currentRow } = await db
        .from('contracts')
        .select('checklist_status')
        .eq('id', contractId)
        .single()
      const currentChecklist = (currentRow?.checklist_status as Record<string, boolean>) ?? {}

      if (type === 'loyer') {
        await db
          .from('contracts')
          .update({
            stripe_payment_intent_id: paymentIntentId,
            stripe_payment_status: 'paid',
            checklist_status: { ...currentChecklist, solde_recu: true },
          })
          .eq('id', contractId)
        // Notif email hôte : loyer reçu
        await notifyHostPayment(db, contractId, 'loyer')
      } else {
        await db
          .from('contracts')
          .update({
            stripe_deposit_payment_intent_id: paymentIntentId,
            stripe_deposit_status: 'held',
            checklist_status: { ...currentChecklist, caution_recue: true },
          })
          .eq('id', contractId)
        // Notif email hôte : caution bloquée
        await notifyHostPayment(db, contractId, 'caution')
      }
      break
    }

    case 'payment_intent.amount_capturable_updated': {
      const pi = event.data.object as Stripe.PaymentIntent
      const contractId = pi.metadata?.contract_id
      if (!contractId) break
      const { data: currentRow } = await db
        .from('contracts')
        .select('checklist_status')
        .eq('id', contractId)
        .single()
      const currentChecklist = (currentRow?.checklist_status as Record<string, boolean>) ?? {}
      // Garde-fou anti-régression : on n'écrase JAMAIS un état terminal
      // (captured/released) ou en transition (capturing/releasing). Sans
      // cette garde, un webhook qui rejoue (Stripe retry 3 jours) pouvait
      // remettre une caution 'captured' en 'held' = inconsistance.
      await db
        .from('contracts')
        .update({
          stripe_deposit_payment_intent_id: pi.id,
          stripe_deposit_status: 'held',
          checklist_status: { ...currentChecklist, caution_recue: true },
        })
        .eq('id', contractId)
        .in('stripe_deposit_status', ['pending', null])
      break
    }

    case 'payment_intent.canceled': {
      const pi = event.data.object as Stripe.PaymentIntent
      const contractId = pi.metadata?.contract_id
      if (!contractId) break
      // Une annulation Stripe (release ou expiration auto au bout de 7j)
      // marque la caution comme released. Avant on remettait en 'pending'
      // ce qui était faux : si l'auth a été annulée, on ne peut pas la
      // réutiliser. 'released' = état final propre.
      await db
        .from('contracts')
        .update({ stripe_deposit_status: 'released' })
        .eq('id', contractId)
        .in('stripe_deposit_status', ['held', 'releasing', 'pending'])
      break
    }

    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      const contractId = pi.metadata?.contract_id
      if (!contractId) break
      // Caution effectivement encaissée (capture confirmée par Stripe).
      // Sync DB au cas où la route /capture aurait timeout côté serveur.
      await db
        .from('contracts')
        .update({ stripe_deposit_status: 'captured' })
        .eq('id', contractId)
        .in('stripe_deposit_status', ['held', 'capturing'])
      break
    }

    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      if (account.details_submitted) {
        const { data } = await db
          .from('profiles')
          .update({ stripe_onboarding_complete: true })
          .eq('stripe_account_id', account.id)
          .select('id')
          .maybeSingle()
        if (data?.id) invalidateProfileCache(data.id)
      }
      break
    }

    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription
      // ── Branche photographe : subscription metadata.photographer_id ──
      // L'admin a déclenché un Checkout via approvePhotographer().
      // À la création de la subscription, on active le profil photographe
      // dans l'annuaire (status='active', is_public=true, slug généré).
      const photographerId = sub.metadata?.photographer_id
      if (photographerId) {
        const { data: ph } = await db
          .from('photographers')
          .select('id, full_name, ville, email, slug, tier, status')
          .eq('id', photographerId)
          .maybeSingle()
        if (ph && (ph.status === 'approved_pending_payment' || ph.status === 'pending_payment')) {
          // Génère le slug si pas déjà fait
          let slug = ph.slug
          if (!slug) {
            const base = `${ph.full_name}-${ph.ville}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
            slug = base
            // Check unicity, append id short si collision
            const { data: collision } = await db.from('photographers').select('id').eq('slug', slug).neq('id', photographerId).maybeSingle()
            if (collision) slug = `${base}-${photographerId.slice(0, 6)}`
          }
          await db.from('photographers').update({
            status: 'active',
            is_public: true,
            slug,
            stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null,
            stripe_subscription_id: sub.id,
            stripe_subscription_status: sub.status,
            updated_at: new Date().toISOString(),
          }).eq('id', photographerId)
          // Trigger rebuild du site statique pour générer la fiche publique
          const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
          if (hookUrl) {
            fetch(hookUrl, { method: 'POST' }).catch(() => {})
          }
          // Email de bienvenue (best-effort, ne bloque pas le webhook)
          sendProWelcomeEmail({
            pro: 'photographer',
            email: ph.email,
            fullName: ph.full_name,
            displayName: ph.full_name,
            ville: ph.ville,
            slug,
            tier: ph.tier,
          }).catch(() => {})
        }
        break
      }
      // ── Branche ménage : subscription metadata.cleaner_id ──────────
      // Idem pattern photographe : approuvé par admin → paiement Stripe →
      // activation publique + slug + trigger rebuild.
      const cleanerId = sub.metadata?.cleaner_id
      if (cleanerId) {
        const { data: cl } = await db
          .from('cleaners')
          .select('id, full_name, pseudo, ville, email, slug, tier, status')
          .eq('id', cleanerId)
          .maybeSingle()
        if (cl && (cl.status === 'approved_pending_payment' || cl.status === 'pending_payment')) {
          let slug = cl.slug
          if (!slug) {
            const nameForSlug = cl.pseudo || cl.full_name
            const base = `${nameForSlug}-${cl.ville}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
            slug = base
            const { data: collision } = await db.from('cleaners').select('id').eq('slug', slug).neq('id', cleanerId).maybeSingle()
            if (collision) slug = `${base}-${cleanerId.slice(0, 6)}`
          }
          await db.from('cleaners').update({
            status: 'active',
            is_public: true,
            slug,
            stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null,
            stripe_subscription_id: sub.id,
            stripe_subscription_status: sub.status,
            updated_at: new Date().toISOString(),
          }).eq('id', cleanerId)
          const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
          if (hookUrl) {
            fetch(hookUrl, { method: 'POST' }).catch(() => {})
          }
          // Email de bienvenue (best-effort)
          sendProWelcomeEmail({
            pro: 'cleaner',
            email: cl.email,
            fullName: cl.full_name,
            displayName: cl.pseudo || cl.full_name,
            ville: cl.ville,
            slug,
            tier: cl.tier,
          }).catch(() => {})
        }
        break
      }
      // ── Branche standard : abonnement hôte plateforme ──
      const userId = sub.metadata?.user_id
      if (!userId) break
      const priceId = sub.items.data[0]?.price?.id ?? ''
      await db.from('profiles').update({
        plan: planFromPriceId(priceId),
        stripe_subscription_id: sub.id,
        stripe_subscription_status: sub.status,
        stripe_price_id: priceId,
      }).eq('id', userId)
      invalidateProfileCache(userId)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      // Branche photographe : sync status, ne touche pas au tier
      const photographerId = sub.metadata?.photographer_id
      if (photographerId) {
        await db.from('photographers').update({
          stripe_subscription_status: sub.status,
          // Si Stripe past_due/canceled → on retire de l'annuaire public
          is_public: sub.status === 'active',
          updated_at: new Date().toISOString(),
        }).eq('id', photographerId)
        const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
        if (hookUrl) fetch(hookUrl, { method: 'POST' }).catch(() => {})
        break
      }
      // Branche ménage : sync status
      const cleanerId = sub.metadata?.cleaner_id
      if (cleanerId) {
        await db.from('cleaners').update({
          stripe_subscription_status: sub.status,
          is_public: sub.status === 'active',
          updated_at: new Date().toISOString(),
        }).eq('id', cleanerId)
        const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
        if (hookUrl) fetch(hookUrl, { method: 'POST' }).catch(() => {})
        break
      }
      const userId = sub.metadata?.user_id
      if (!userId) break
      const priceId = sub.items.data[0]?.price?.id ?? ''
      const plan = sub.status === 'active' ? planFromPriceId(priceId) : 'decouverte'
      await db.from('profiles').update({
        plan,
        stripe_subscription_status: sub.status,
        stripe_price_id: priceId,
      }).eq('id', userId)
      invalidateProfileCache(userId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      // Branche photographe : retire de l'annuaire
      const photographerId = sub.metadata?.photographer_id
      if (photographerId) {
        await db.from('photographers').update({
          status: 'cancelled',
          is_public: false,
          stripe_subscription_status: 'canceled',
          updated_at: new Date().toISOString(),
        }).eq('id', photographerId)
        const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
        if (hookUrl) fetch(hookUrl, { method: 'POST' }).catch(() => {})
        break
      }
      // Branche ménage : retire de l'annuaire
      const cleanerId = sub.metadata?.cleaner_id
      if (cleanerId) {
        await db.from('cleaners').update({
          status: 'cancelled',
          is_public: false,
          stripe_subscription_status: 'canceled',
          updated_at: new Date().toISOString(),
        }).eq('id', cleanerId)
        const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
        if (hookUrl) fetch(hookUrl, { method: 'POST' }).catch(() => {})
        break
      }
      const userId = sub.metadata?.user_id
      if (!userId) break
      await db.from('profiles').update({
        plan: 'decouverte',
        stripe_subscription_id: null,
        stripe_subscription_status: 'canceled',
        stripe_price_id: null,
      }).eq('id', userId)
      invalidateProfileCache(userId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }
      const subId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : (invoice.subscription as Stripe.Subscription | null | undefined)?.id
      if (!subId) break
      const { data } = await db.from('profiles').update({
        stripe_subscription_status: 'past_due',
      }).eq('stripe_subscription_id', subId).select('id').maybeSingle()
      if (data?.id) invalidateProfileCache(data.id)
      break
    }
  }
}
