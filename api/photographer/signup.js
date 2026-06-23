// Vercel serverless function — inscription photographe LCD self-service.
// Flow : form → insert pending_payment + détermine tier → crée Stripe
// Checkout session → renvoie l'URL au form qui redirige.
// Activation publique de la fiche au webhook customer.subscription.created.

const FOUNDER_QUOTA = 20
const FOUNDER_PRICE_ID = process.env.STRIPE_PHOTOGRAPHER_FOUNDER_PRICE_ID || ''
const STANDARD_PRICE_ID = process.env.STRIPE_PHOTOGRAPHER_STANDARD_PRICE_ID || ''
const SITE_URL = 'https://jasonmarinho.com'

const rateLimitMap = new Map()
function isRateLimited(key, max, windowMs) {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  if (entry.count >= max) return true
  entry.count++
  return false
}
function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.headers['x-real-ip'] || 'unknown'
}

async function createCheckoutSession({ stripeKey, priceId, email, metadata }) {
  const params = new URLSearchParams()
  params.append('mode', 'subscription')
  params.append('customer_email', email)
  params.append('line_items[0][price]', priceId)
  params.append('line_items[0][quantity]', '1')
  params.append('success_url', `${SITE_URL}/annuaires/photographes/inscription/confirmation?status=paid`)
  params.append('cancel_url', `${SITE_URL}/annuaires/photographes/inscription/confirmation?status=cancel`)
  params.append('locale', 'fr')
  params.append('allow_promotion_codes', 'true')
  for (const [k, v] of Object.entries(metadata)) {
    params.append(`metadata[${k}]`, String(v))
    params.append(`subscription_data[metadata][${k}]`, String(v))
  }
  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })
  if (!res.ok) {
    const txt = await res.text()
    console.error('[photographer/signup] stripe checkout failed', res.status, txt)
    return null
  }
  const data = await res.json()
  return data.url || null
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ip = getClientIp(req)
  if (isRateLimited(`ip:${ip}`, 3, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Trop de tentatives. Réessaye dans 15 minutes.' })
  }

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  body = body || {}

  // Anti-bot honeypot + time-trap
  if (body.website) return res.status(200).json({ ok: true })
  if (body.t && typeof body.t === 'number' && Date.now() - body.t < 3000) return res.status(200).json({ ok: true })

  const fullName = String(body.fullName || '').trim().slice(0, 100)
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200)
  const ville = String(body.ville || '').trim().slice(0, 80)
  const zoneCouverte = String(body.zoneCouverte || '').trim().slice(0, 200)
  const portfolioUrl = String(body.portfolioUrl || '').trim().slice(0, 300)
  const instagramHandle = String(body.instagramHandle || '').trim().slice(0, 50).replace(/^@/, '')
  const telephone = String(body.telephone || '').trim().slice(0, 30)
  const specialite = String(body.specialite || '').trim().slice(0, 100)
  const tarifMin = parseInt(body.tarifMin || '0', 10) || null
  const tarifMax = parseInt(body.tarifMax || '0', 10) || null
  const bio = String(body.bio || '').trim().slice(0, 600)

  if (!fullName || !email || !ville || !portfolioUrl) {
    return res.status(400).json({ error: 'Champs obligatoires manquants : nom, email, ville, portfolio.' })
  }
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Email invalide.' })
  }
  if (!/^https?:\/\//i.test(portfolioUrl)) {
    return res.status(400).json({ error: 'Le portfolio doit être une URL valide commençant par https://' })
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY
  if (!SUPABASE_URL || !SERVICE_KEY || !STRIPE_KEY) {
    console.error('[photographer/signup] env vars manquantes')
    return res.status(500).json({ error: 'Service indisponible' })
  }
  if (!FOUNDER_PRICE_ID || !STANDARD_PRICE_ID) {
    console.error('[photographer/signup] price_id Stripe manquants')
    return res.status(500).json({ error: 'Service indisponible (config Stripe).' })
  }

  // Check unicité email
  const checkUrl = `${SUPABASE_URL}/rest/v1/photographers?email=eq.${encodeURIComponent(email)}&select=id,status&limit=1`
  const checkRes = await fetch(checkUrl, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  if (checkRes.ok) {
    const existing = await checkRes.json()
    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(409).json({ error: 'Une fiche avec cet email existe déjà. Contacte Jason si besoin (contact@jasonmarinho.com).' })
    }
  }

  // Détermine tier : fondateur si <20 actifs ou en cours de paiement
  const tierUrl = `${SUPABASE_URL}/rest/v1/photographers?tier=eq.fondateur&status=in.(active,pending_payment,approved_pending_payment)&select=id`
  const tierRes = await fetch(tierUrl, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  let founderCount = 0
  if (tierRes.ok) {
    const rows = await tierRes.json()
    founderCount = Array.isArray(rows) ? rows.length : 0
  }
  const tier = founderCount < FOUNDER_QUOTA ? 'fondateur' : 'standard'
  const priceId = tier === 'fondateur' ? FOUNDER_PRICE_ID : STANDARD_PRICE_ID

  // Insert pending_payment
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/photographers`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      email, full_name: fullName, ville,
      zone_couverte: zoneCouverte || null,
      portfolio_url: portfolioUrl,
      instagram_handle: instagramHandle || null,
      telephone: telephone || null,
      specialite: specialite || null,
      tarif_min: tarifMin, tarif_max: tarifMax,
      bio: bio || null,
      tier,
      status: 'pending_payment',
    }),
  })
  if (!insertRes.ok) {
    const txt = await insertRes.text()
    console.error('[photographer/signup] INSERT failed', insertRes.status, txt)
    return res.status(500).json({ error: 'Erreur lors de l\'enregistrement.' })
  }
  const inserted = await insertRes.json()
  const photographerId = Array.isArray(inserted) ? inserted[0]?.id : inserted?.id
  if (!photographerId) {
    return res.status(500).json({ error: 'Erreur lors de l\'enregistrement.' })
  }

  // Crée la session Stripe Checkout
  const checkoutUrl = await createCheckoutSession({
    stripeKey: STRIPE_KEY,
    priceId,
    email,
    metadata: { photographer_id: photographerId, tier },
  })
  if (!checkoutUrl) {
    return res.status(500).json({ error: 'Erreur Stripe. Réessaye ou contacte contact@jasonmarinho.com.' })
  }

  return res.status(200).json({ ok: true, checkoutUrl, tier })
}
