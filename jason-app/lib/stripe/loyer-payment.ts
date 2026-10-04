// Paiement du loyer d'un contrat (04/10/2026, incident d'une hôte : le
// voyageur a payé 100 % par le lien de l'e-mail, puis l'app lui a proposé
// de payer encore 50 %).
// - Deux routes créaient la session Stripe chacune à sa façon : le lien de
//   l'e-mail (/api/stripe/payment/redirect) encaissait tout le loyer en
//   ignorant acompte_percent. Une seule fonction maintenant.
// - Le statut « payé » n'arrivait que par le webhook. Au retour de Stripe,
//   s'il n'était pas encore passé, la page reproposait de payer. On demande
//   maintenant directement à Stripe (sessions payées du contrat) avant
//   d'afficher la page ou de créer une nouvelle session.
import 'server-only'
import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'
import { notifyHostPayment } from '@/lib/stripe/dispatch'
import { loyerChargeCents } from '@/lib/stripe/loyer-amount'
import { logger } from '@/lib/logger'

const log = logger('lib/stripe/loyer-payment')
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

export interface LoyerContract {
  id: string
  token: string
  created_at?: string | null
  montant_loyer: number | string | null
  acompte_percent?: number | string | null
  date_arrivee: string
  date_depart: string
  logement_adresse?: string | null
  locataire_email?: string | null
  stripe_payment_status?: string | null
  checklist_status?: Record<string, boolean> | null
}

const frDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })

/** Crée la session Checkout du loyer (ou de l'acompte) sur le compte de l'hôte */
export async function createLoyerCheckout(contract: LoyerContract, stripeAccount: string): Promise<Stripe.Checkout.Session> {
  const loyer = Number(contract.montant_loyer)
  const pct = Number(contract.acompte_percent ?? 100)
  const isPartial = pct < 100
  const amountCents = loyerChargeCents(loyer, pct)
  const n = Math.round((new Date(contract.date_depart).getTime() - new Date(contract.date_arrivee).getTime()) / 86400000)
  const dates = `${n} nuit${n > 1 ? 's' : ''}, du ${frDate(contract.date_arrivee)} au ${frDate(contract.date_depart)}`
  const solde = (loyer * (100 - pct) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return stripe.checkout.sessions.create(
    {
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: amountCents,
          product_data: {
            name: isPartial ? `Acompte (${pct} %), ${contract.logement_adresse ?? 'réservation'}` : `Réservation, ${contract.logement_adresse ?? ''}`.trim(),
            description: isPartial ? `${dates}. Solde de ${solde} € à régler à l'arrivée.` : dates,
          },
        },
        quantity: 1,
      }],
      payment_intent_data: {
        capture_method: 'automatic',
        description: `Loyer contrat ${contract.id.slice(0, 8).toUpperCase()}`,
        metadata: { contract_id: contract.id, type: 'loyer' },
      },
      customer_email: contract.locataire_email ?? undefined,
      success_url: `${APP_URL}/sign/${contract.token}?payment=success`,
      cancel_url: `${APP_URL}/sign/${contract.token}?payment=cancel`,
      locale: 'fr',
      metadata: { contract_id: contract.id, token: contract.token, type: 'loyer' },
    },
    { stripeAccount },
  )
}

export interface PaidLoyerSession { id: string; amount: number; created: number; paymentIntent: string | null }

/** Sessions de loyer payées pour ce contrat, sur le compte Stripe de l'hôte */
export async function findPaidLoyerSessions(contract: LoyerContract, stripeAccount: string): Promise<PaidLoyerSession[]> {
  const since = contract.created_at ? Math.floor(new Date(contract.created_at).getTime() / 1000) - 86400 : undefined
  const out: PaidLoyerSession[] = []
  const list = stripe.checkout.sessions.list({ limit: 100, ...(since ? { created: { gte: since } } : {}) }, { stripeAccount })
  for await (const s of list) {
    if (s.metadata?.contract_id !== contract.id || s.metadata?.type !== 'loyer') continue
    if (s.payment_status !== 'paid') continue
    out.push({
      id: s.id,
      amount: (s.amount_total ?? 0) / 100,
      created: s.created,
      paymentIntent: typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent?.id ?? null,
    })
    if (out.length >= 10) break
  }
  return out.sort((a, b) => a.created - b.created)
}

/**
 * Met le contrat à « payé » si Stripe a une session de loyer payée (webhook
 * en retard ou perdu). Signale un double paiement dans « Erreurs de l'app ».
 * Ne lance jamais d'erreur : en cas de souci, renvoie le statut connu.
 */
export async function syncLoyerPayment(db: SupabaseClient, contract: LoyerContract, stripeAccount: string): Promise<{ paid: boolean; sessions: PaidLoyerSession[] }> {
  try {
    const sessions = await findPaidLoyerSessions(contract, stripeAccount)
    if (sessions.length > 1) {
      log.error('Loyer payé plusieurs fois', { contrat: contract.id.slice(0, 8), paiements: sessions.length })
    }
    if (sessions.length && contract.stripe_payment_status !== 'paid') {
      await db.from('contracts').update({
        stripe_payment_intent_id: sessions[0].paymentIntent,
        stripe_payment_status: 'paid',
        checklist_status: { ...(contract.checklist_status ?? {}), solde_recu: true },
      }).eq('id', contract.id)
      await notifyHostPayment(db, contract.id, 'loyer')
    }
    return { paid: sessions.length > 0 || contract.stripe_payment_status === 'paid', sessions }
  } catch (e) {
    log.warn('synchro du loyer impossible', { contrat: contract.id.slice(0, 8), err: (e as Error).message })
    return { paid: contract.stripe_payment_status === 'paid', sessions: [] }
  }
}

/** Contrats au loyer « en attente » avec une session Stripe : vérifiés chez Stripe (cron quotidien) */
export async function syncPendingLoyers(db: SupabaseClient, limit = 20): Promise<number> {
  const { data: rows } = await db
    .from('contracts')
    .select('*')
    .eq('stripe_payment_status', 'pending')
    .not('stripe_payment_checkout_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit)
  let synced = 0
  for (const c of rows ?? []) {
    const { data: host } = await db.from('profiles').select('stripe_account_id').eq('id', c.user_id).maybeSingle()
    if (!host?.stripe_account_id) continue
    const r = await syncLoyerPayment(db, c as LoyerContract, host.stripe_account_id)
    if (r.paid) synced++
  }
  return synced
}
