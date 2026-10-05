import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { planFromPriceId } from '@/lib/constants/stripe-plans'
import { invalidateProfileCache } from '@/lib/queries/profile'
import { sendPaiementReceivedEmail } from '@/lib/email/host'
import { sendProWelcomeEmail } from '@/lib/email/pro-welcome'
import { logger } from '@/lib/logger'
import { createNotification, sejourHref } from '@/lib/notifications/create'
import { parisToday } from '@/lib/stripe/deposit-window'
import { triggerSiteRebuild } from '@/lib/pros/site-rebuild'

const log = logger('lib/stripe/dispatch')

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

// Helper : envoie un email 'paiement reçu' au hôte. Best-effort, async,
// ne bloque pas le webhook.
export async function notifyHostPayment(
  db: SupabaseClient,
  contractId: string,
  type: 'loyer' | 'caution',
): Promise<void> {
  try {
    const { data: c } = await db
      .from('contracts')
      .select('user_id, bailleur_email, bailleur_prenom, locataire_prenom, locataire_nom, logement_nom, date_arrivee, montant_loyer, montant_caution, sejour_id')
      .eq('id', contractId)
      .single()
    if (!c) return
    const montant = type === 'loyer' ? Number(c.montant_loyer ?? 0) : Number(c.montant_caution ?? 0)
    if (montant <= 0) return
    const href = await sejourHref(db, c.sejour_id)
    const guest = `${c.locataire_prenom ?? ''} ${c.locataire_nom ?? ''}`.trim() || 'Ton voyageur'
    const eur = `${montant.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`
    // Notification dans l'app (avant : e-mail seulement)
    if (c.user_id) {
      await createNotification({
        recipientId: c.user_id,
        category: 'sejour',
        type: type === 'loyer' ? 'loyer_paye' : 'caution_bloquee',
        title: type === 'loyer' ? `Loyer payé par ${guest} : ${eur}` : `Caution de ${guest} bloquée : ${eur}`,
        body: type === 'loyer'
          ? `${c.logement_nom ? `${c.logement_nom}. ` : ''}Le paiement arrive sur ton compte Stripe, puis sur ton compte bancaire selon le calendrier de versement de Stripe.`
          : `${c.logement_nom ? `${c.logement_nom}. ` : ''}Rien n'est débité : la carte est bloquée environ 7 jours. Libère la caution après l'état des lieux, ou encaisse-la en cas de dégâts.`,
        ctaLabel: 'Voir la fiche voyageur',
        ctaHref: href,
        severity: 'success',
        dedupKey: `${type === 'loyer' ? 'loyer_paye' : 'caution_bloquee'}:${contractId}`,
      })
    }
    if (!c.bailleur_email) return
    await sendPaiementReceivedEmail({
      to: c.bailleur_email,
      hostFirstName: c.bailleur_prenom ?? '',
      guestFullName: `${c.locataire_prenom ?? ''} ${c.locataire_nom ?? ''}`.trim() || 'Voyageur',
      type,
      montant,
      dateArrivee: c.date_arrivee ?? undefined,
      dashboardUrl: `${APP_URL}${href}`,
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
      if (!contractId || pi.metadata?.type === 'loyer') break
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
      // Un paiement de loyer abandonné n'est pas une caution libérée
      if (!contractId || pi.metadata?.type === 'loyer') break
      // Libération demandée par l'hôte : la route /release passe d'abord en
      // 'releasing', on finalise en 'released'.
      await db
        .from('contracts')
        .update({ stripe_deposit_status: 'released' })
        .eq('id', contractId)
        .in('stripe_deposit_status', ['releasing', 'pending'])
      // Encore 'held' = personne n'a rien demandé : le blocage de carte est
      // tombé tout seul (~7 jours chez Stripe). On le dit à l'hôte au lieu
      // d'afficher « libérée » (sept. 2026). Repli sur 'released' si la base
      // refuse le statut 'expired'.
      let { data: expired, error: expErr } = await db
        .from('contracts')
        .update({ stripe_deposit_status: 'expired' })
        .eq('id', contractId)
        .eq('stripe_deposit_status', 'held')
        .select('id, user_id, locataire_prenom, locataire_nom, date_depart, sejour_id')
      if (expErr) {
        ;({ data: expired } = await db
          .from('contracts')
          .update({ stripe_deposit_status: 'released' })
          .eq('id', contractId)
          .eq('stripe_deposit_status', 'held')
          .select('id, user_id, locataire_prenom, locataire_nom, date_depart, sejour_id'))
      }
      const c = expired?.[0]
      if (c?.user_id) {
        const guest = `${c.locataire_prenom ?? ''} ${c.locataire_nom ?? ''}`.trim() || 'ton voyageur'
        const stillOn = c.date_depart && String(c.date_depart).slice(0, 10) >= parisToday()
        await createNotification({
          recipientId: c.user_id,
          category: 'sejour',
          type: 'deposit_expired',
          title: `Caution de ${guest} expirée`,
          body: stillOn
            ? 'La carte n\'est plus bloquée : le délai de Stripe (environ 7 jours) est passé. Le séjour n\'est pas terminé : tu peux renvoyer le lien de caution au voyageur.'
            : 'La carte n\'est plus bloquée : le délai de Stripe (environ 7 jours) est passé avant que tu libères ou encaisses la caution.',
          ctaLabel: 'Voir le séjour',
          ctaHref: await sejourHref(db, c.sejour_id),
          severity: 'warning',
          dedupKey: `deposit_expired:${c.id}:${pi.id}`,
        }).catch(() => {})
      }
      break
    }

    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      const contractId = pi.metadata?.contract_id
      // Le paiement du loyer déclenche aussi cet événement : il ne doit jamais
      // toucher à la caution (05/10/2026 : un loyer payé pendant que la
      // caution était bloquée l'aurait marquée « encaissée »)
      if (!contractId || pi.metadata?.type === 'loyer') break
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
          await triggerSiteRebuild('stripe')
          // Email de bienvenue (best-effort, ne bloque pas le webhook)
          await sendProWelcomeEmail({
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
          await triggerSiteRebuild('stripe')
          // Email de bienvenue (best-effort)
          await sendProWelcomeEmail({
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
      if (!userId) {
        log.warn('subscription.created sans user_id en metadata', { sub_id: sub.id })
        break
      }
      const priceId = sub.items.data[0]?.price?.id ?? ''
      const { data: updated, error: updateErr } = await db.from('profiles').update({
        plan: planFromPriceId(priceId),
        stripe_subscription_id: sub.id,
        stripe_subscription_status: sub.status,
        stripe_price_id: priceId,
      }).eq('id', userId).select('id')
      if (updateErr) {
        log.error('subscription.created — update profiles échoué', { userId, sub_id: sub.id, err: updateErr.message })
      } else if (!updated || updated.length === 0) {
        log.error('subscription.created — aucune ligne profiles matchée', { userId, sub_id: sub.id })
      }
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
        await triggerSiteRebuild('stripe')
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
        await triggerSiteRebuild('stripe')
        break
      }
      const userId = sub.metadata?.user_id
      if (!userId) {
        log.warn('subscription.updated sans user_id en metadata', { sub_id: sub.id })
        break
      }
      const priceId = sub.items.data[0]?.price?.id ?? ''
      const plan = sub.status === 'active' ? planFromPriceId(priceId) : 'decouverte'
      const { data: updated, error: updateErr } = await db.from('profiles').update({
        plan,
        stripe_subscription_status: sub.status,
        stripe_price_id: priceId,
      }).eq('id', userId).select('id')
      if (updateErr) {
        log.error('subscription.updated — update profiles échoué', { userId, sub_id: sub.id, err: updateErr.message })
      } else if (!updated || updated.length === 0) {
        log.error('subscription.updated — aucune ligne profiles matchée', { userId, sub_id: sub.id })
      }
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
        await triggerSiteRebuild('stripe')
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
        await triggerSiteRebuild('stripe')
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
