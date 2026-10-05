// Caution par empreinte bancaire (05/10/2026). Même principe que le loyer
// (lib/stripe/loyer-payment.ts) :
// - une seule fonction crée la session Stripe (page du contrat ET lien de
//   l'e-mail ; avant, le lien de l'e-mail en créait une nouvelle à chaque
//   clic, sans réutiliser la session ouverte) ;
// - avant d'en créer une, on demande à Stripe si une caution est déjà
//   bloquée pour ce contrat : sans ça, un webhook en retard ou perdu
//   permettait de bloquer deux fois la carte du voyageur ;
// - le statut (bloquée, encaissée, tombée) se lit aussi directement chez
//   Stripe, pas seulement par webhook.
import 'server-only'
import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'
import { notifyHostPayment } from '@/lib/stripe/dispatch'
import { createNotification, sejourHref } from '@/lib/notifications/create'
import { parisToday } from '@/lib/stripe/deposit-window'
import { logger } from '@/lib/logger'

const log = logger('lib/stripe/deposit-payment')
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

/** Colonnes d'un contrat utiles à la caution (sans l'image de la signature). */
export const DEPOSIT_CONTRACT_COLUMNS =
  'id, token, user_id, statut, created_at, montant_caution, date_arrivee, date_depart, logement_adresse, locataire_email, locataire_prenom, locataire_nom, sejour_id, stripe_deposit_status, stripe_deposit_checkout_id, checklist_status'

export interface DepositContract {
  id: string
  token: string
  created_at?: string | null
  montant_caution: number | string | null
  date_arrivee: string
  date_depart: string
  logement_adresse?: string | null
  locataire_email?: string | null
  stripe_deposit_status?: string | null
  stripe_deposit_checkout_id?: string | null
  checklist_status?: Record<string, boolean> | null
}

const frDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })

/** Session de caution des sessions Stripe : métadonnée « caution », ou ancienne session sans type */
const isDepositSession = (s: Stripe.Checkout.Session, contractId: string) =>
  s.metadata?.contract_id === contractId && s.metadata?.type !== 'loyer'

export interface DepositState {
  /** held = carte bloquée, captured = encaissée, released = libérée ou tombée */
  status: 'held' | 'captured' | 'released' | null
  paymentIntentId: string | null
  /** Date limite d'encaissement donnée par la banque (capture_before), si connue */
  captureBefore: string | null
  /** Nombre de blocages actifs trouvés (plus d'un = anomalie) */
  activeHolds: number
  /** Somme réellement retenue (encaissement partiel possible), en euros */
  capturedAmount: number | null
  /** Motif saisi par l'hôte à l'encaissement (métadonnée Stripe) */
  captureReason: string | null
}

/** Ce que Stripe sait de la caution de ce contrat */
export async function readDepositFromStripe(contract: DepositContract, stripeAccount: string): Promise<DepositState> {
  const since = contract.created_at ? Math.floor(new Date(contract.created_at).getTime() / 1000) - 86400 : undefined
  const intents: Stripe.PaymentIntent[] = []
  const list = stripe.checkout.sessions.list(
    { limit: 100, ...(since ? { created: { gte: since } } : {}), expand: ['data.payment_intent'] },
    { stripeAccount },
  )
  for await (const s of list) {
    if (!isDepositSession(s, contract.id) || s.status !== 'complete') continue
    const pi = s.payment_intent
    if (pi && typeof pi !== 'string') intents.push(pi)
    if (intents.length >= 10) break
  }
  const holds = intents.filter(pi => pi.status === 'requires_capture')
  const captured = intents.find(pi => pi.status === 'succeeded')
  const pick = holds[0] ?? captured ?? intents[0] ?? null
  let captureBefore: string | null = null
  if (pick && pick.status === 'requires_capture') {
    try {
      const full = await stripe.paymentIntents.retrieve(pick.id, { expand: ['latest_charge'] }, { stripeAccount })
      const charge = full.latest_charge && typeof full.latest_charge !== 'string' ? full.latest_charge : null
      const cb = charge?.payment_method_details?.card?.capture_before
      if (cb) captureBefore = new Date(cb * 1000).toISOString()
    } catch { /* date limite inconnue : on garde la règle des 7 jours */ }
  }
  return {
    status: holds.length ? 'held' : captured ? 'captured' : intents.length ? 'released' : null,
    paymentIntentId: pick?.id ?? null,
    captureBefore,
    activeHolds: holds.length,
    capturedAmount: captured ? captured.amount_received / 100 : null,
    captureReason: captured?.metadata?.motif_retenue || null,
  }
}

/**
 * Aligne la base sur Stripe (webhook en retard ou perdu). Ne lance jamais
 * d'erreur. Ne touche pas aux états en cours de traitement par l'hôte
 * (« capturing », « releasing »).
 */
export async function syncDeposit(db: SupabaseClient, contract: DepositContract, stripeAccount: string): Promise<DepositState | null> {
  try {
    const st = await readDepositFromStripe(contract, stripeAccount)
    if (st.activeHolds > 1) log.error('Caution bloquée plusieurs fois', { contrat: contract.id.slice(0, 8), blocages: st.activeHolds })
    const cur = contract.stripe_deposit_status ?? null
    if (st.status === 'held' && (cur === 'pending' || cur === null || cur === 'expired')) {
      await db.from('contracts').update({
        stripe_deposit_payment_intent_id: st.paymentIntentId,
        stripe_deposit_status: 'held',
        checklist_status: { ...(contract.checklist_status ?? {}), caution_recue: true },
      }).eq('id', contract.id)
      await notifyHostPayment(db, contract.id, 'caution')
    } else if (st.status === 'captured' && (cur === 'held' || cur === 'capturing')) {
      await db.from('contracts').update({ stripe_deposit_status: 'captured' }).eq('id', contract.id)
    } else if (st.status === 'released' && cur === 'held') {
      // Encore « bloquée » chez nous, mais la banque a levé le blocage
      // (délai dépassé) sans que le webhook nous prévienne : on le dit à l'hôte
      const { data: rows } = await db.from('contracts').update({ stripe_deposit_status: 'expired' })
        .eq('id', contract.id).eq('stripe_deposit_status', 'held')
        .select('id, user_id, locataire_prenom, locataire_nom, date_depart, sejour_id')
      const c = rows?.[0]
      if (c?.user_id) {
        const guest = `${c.locataire_prenom ?? ''} ${c.locataire_nom ?? ''}`.trim() || 'ton voyageur'
        const stillOn = c.date_depart && String(c.date_depart).slice(0, 10) >= parisToday()
        await createNotification({
          recipientId: c.user_id, category: 'sejour', type: 'deposit_expired',
          title: `Caution de ${guest} expirée`,
          body: stillOn
            ? 'La carte n\'est plus bloquée : le délai de la banque (7 jours au plus) est passé. Rien n\'a été prélevé. Le séjour n\'est pas terminé : tu peux renvoyer le lien de caution au voyageur.'
            : 'La carte n\'est plus bloquée : le délai de la banque (7 jours au plus) est passé avant que tu libères ou encaisses la caution. Rien n\'a été prélevé.',
          ctaLabel: 'Voir le séjour', ctaHref: await sejourHref(db, c.sejour_id), severity: 'warning',
          dedupKey: `deposit_expired:${c.id}:${st.paymentIntentId ?? ''}`,
        }).catch(() => {})
      }
    }
    return st
  } catch (e) {
    log.warn('synchro de la caution impossible', { contrat: contract.id.slice(0, 8), err: (e as Error).message })
    return null
  }
}

/** Session ouverte à réutiliser, ou nouvelle session de caution (blocage sans débit) */
export async function getOrCreateDepositCheckout(db: SupabaseClient, contract: DepositContract, stripeAccount: string): Promise<{ url: string | null; alreadyHeld: boolean }> {
  const st = await syncDeposit(db, contract, stripeAccount)
  if (st?.status === 'held' || st?.status === 'captured') return { url: null, alreadyHeld: true }

  if (contract.stripe_deposit_checkout_id) {
    try {
      const existing = await stripe.checkout.sessions.retrieve(contract.stripe_deposit_checkout_id, undefined, { stripeAccount })
      if (existing.status === 'open' && existing.url) return { url: existing.url, alreadyHeld: false }
    } catch { /* session perdue ou expirée : on en crée une */ }
  }

  const amountCents = Math.round(Number(contract.montant_caution) * 100)
  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: amountCents,
          product_data: {
            name: `Dépôt de garantie, ${contract.logement_adresse ?? 'séjour'}`,
            description: `Caution pour le séjour du ${frDate(contract.date_arrivee)} au ${frDate(contract.date_depart)}. Cette somme est bloquée sur votre carte mais ne sera prélevée qu'en cas de dommages constatés.`,
          },
        },
        quantity: 1,
      }],
      // Autorisation étendue (jusqu'à ~30 jours pour l'hébergement, MCC 7011) :
      // demandée seulement quand Stripe l'a activée pour la plateforme
      // (demande faite par Jason au support le 05/10/2026, en attente).
      // Sans activation, Stripe pourrait refuser la session : d'où l'interrupteur.
      ...(process.env.STRIPE_EXTENDED_AUTH === '1'
        ? { payment_method_options: { card: { request_extended_authorization: 'if_available' as const } } }
        : {}),
      payment_intent_data: {
        capture_method: 'manual', // blocage, pas de débit
        description: `Caution contrat ${contract.id.slice(0, 8).toUpperCase()}`,
        metadata: { contract_id: contract.id, type: 'caution' },
      },
      customer_email: contract.locataire_email ?? undefined,
      success_url: `${APP_URL}/sign/${contract.token}?deposit=success`,
      cancel_url: `${APP_URL}/sign/${contract.token}?deposit=cancel`,
      locale: 'fr',
      metadata: { contract_id: contract.id, token: contract.token, type: 'caution' },
    },
    { stripeAccount },
  )
  await db.from('contracts').update({ stripe_deposit_checkout_id: session.id, stripe_deposit_status: 'pending' }).eq('id', contract.id)
  return { url: session.url, alreadyHeld: false }
}

/**
 * Cautions « en attente » ou « bloquées » : vérifiées chez Stripe (cron
 * quotidien). Attrape une caution validée dont le webhook s'est perdu, et une
 * caution tombée d'elle-même (délai de la banque) restée « bloquée » chez nous.
 */
export async function syncPendingDeposits(db: SupabaseClient, limit = 30): Promise<number> {
  const { data: rows } = await db
    .from('contracts')
    .select(DEPOSIT_CONTRACT_COLUMNS)
    .in('stripe_deposit_status', ['pending', 'held'])
    .not('stripe_deposit_checkout_id', 'is', null)
    .order('date_arrivee', { ascending: true })
    .limit(limit)
  let synced = 0
  for (const c of rows ?? []) {
    const { data: host } = await db.from('profiles').select('stripe_account_id').eq('id', c.user_id).maybeSingle()
    if (!host?.stripe_account_id) continue
    const st = await syncDeposit(db, c as DepositContract, host.stripe_account_id)
    if (st?.status === 'held') synced++
  }
  return synced
}
