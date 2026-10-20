import 'server-only'
// Un seul client Stripe par adresse e-mail (20/10/2026, Jason : un pro qui avait
// payé sa fiche ménage apparaissait deux fois dans Stripe, une fois par fiche).
// Avant, chaque paiement passait `customer_email` : Stripe crée alors un nouveau
// client à chaque fois. Maintenant on retrouve le client existant (même adresse,
// sans tenir compte des majuscules) et on ne le crée qu'au premier paiement.
// Même règle côté site statique : scripts/lib/stripe-customer.cjs.
import { stripe } from '@/lib/stripe/client'
import { logger } from '@/lib/logger'
import { pickCustomer } from './customer-pick'

const log = logger('lib/stripe/customer')

export async function findOrCreateCustomer(args: { email: string; name?: string | null; userId?: string | null; knownId?: string | null }): Promise<string | undefined> {
  const email = args.email.trim()
  if (!email) return undefined
  if (args.knownId) {
    const known = await stripe.customers.retrieve(args.knownId).catch(() => null)
    if (known && !('deleted' in known && known.deleted)) return known.id
  }
  try {
    // L'API filtre l'e-mail à l'identique : on essaie l'adresse telle quelle puis en minuscules
    const variants = [...new Set([email, email.toLowerCase()])]
    const found = (await Promise.all(variants.map(e => stripe.customers.list({ email: e, limit: 10 }).then(r => r.data)))).flat()
    const id = pickCustomer(found.map(c => ({ id: c.id, created: c.created, hasPaymentMethod: !!c.invoice_settings?.default_payment_method })))
    if (id) return id
    const created = await stripe.customers.create({
      email: email.toLowerCase(),
      ...(args.name ? { name: args.name } : {}),
      ...(args.userId ? { metadata: { user_id: args.userId } } : {}),
    })
    return created.id
  } catch (e) {
    log.error('client Stripe introuvable', { err: e instanceof Error ? e.message : String(e) })
    return undefined
  }
}

/** Paramètres de Checkout : le client retrouvé, sinon l'e-mail (Stripe crée alors le client) */
export async function checkoutCustomer(args: { email: string | null | undefined; name?: string | null; userId?: string | null; knownId?: string | null }): Promise<{ customer: string } | { customer_email?: string }> {
  if (!args.email) return {}
  const id = await findOrCreateCustomer({ ...args, email: args.email })
  return id ? { customer: id } : { customer_email: args.email }
}
