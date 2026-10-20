// Un seul client Stripe par adresse e-mail, pour les inscriptions des pros du site
// (api/photographer/signup.js, api/cleaner/signup.js). Même règle que
// jason-app/lib/stripe/customer.ts : client retrouvé par l'adresse (telle quelle
// puis en minuscules), celui qui a une carte enregistrée d'abord, sinon le plus
// ancien ; créé seulement s'il n'existe pas. Hors de api/ : pas une fonction de plus.

async function stripeGet(key, path) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, { headers: { Authorization: `Bearer ${key}` } })
  if (!res.ok) throw new Error(`Stripe ${res.status}`)
  return res.json()
}

/** Identifiant du client à utiliser, ou null (le paiement passe alors l'e-mail, comme avant) */
async function findOrCreateCustomer(key, email, name) {
  const clean = String(email || '').trim()
  if (!key || !clean) return null
  try {
    const variants = [...new Set([clean, clean.toLowerCase()])]
    const lists = await Promise.all(variants.map(e => stripeGet(key, `customers?limit=10&email=${encodeURIComponent(e)}`).then(r => r.data || [])))
    const seen = new Map()
    for (const c of lists.flat()) seen.set(c.id, c)
    const found = [...seen.values()].sort((a, b) =>
      Number(!!b.invoice_settings?.default_payment_method) - Number(!!a.invoice_settings?.default_payment_method) || a.created - b.created)
    if (found[0]) return found[0].id
    const body = new URLSearchParams({ email: clean.toLowerCase() })
    if (name) body.append('name', String(name).slice(0, 200))
    const res = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body,
    })
    if (!res.ok) return null
    return (await res.json()).id || null
  } catch (e) {
    console.warn('[stripe-customer] recherche impossible', e && e.message)
    return null
  }
}

module.exports = { findOrCreateCustomer }
