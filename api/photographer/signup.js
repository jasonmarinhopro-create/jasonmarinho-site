// Vercel serverless function — inscription photographe LCD self-service.
// Flow : form (email + password + infos) → crée compte Supabase Auth
// + insert pending_payment + détermine tier → crée Stripe Checkout
// session → renvoie l'URL au form qui redirige.
// Activation publique de la fiche au webhook customer.subscription.created.
// Après paiement, le pro se connecte sur app.jasonmarinho.com et gère
// sa fiche depuis /dashboard/ma-fiche-photographe.

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

// Crée un compte Supabase Auth via admin API (email_confirm=true pour
// éviter le double opt-in : on considère que payer Stripe vaut confirmation).
async function createAuthUser({ supabaseUrl, serviceKey, email, password, fullName }) {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, signup_source: 'annuaire_photographes' },
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('[photographer/signup] auth user create failed', res.status, data)
    return { error: data?.msg || data?.message || 'Erreur création compte', status: res.status }
  }
  return { userId: data?.id || data?.user?.id }
}

// Met à jour profiles.role en 'photographer' (le trigger handle_new_user
// insère par défaut role='user').
async function setProfileRole({ supabaseUrl, serviceKey, userId, role, fullName }) {
  await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ role, full_name: fullName }),
  }).catch(err => console.warn('[photographer/signup] profile role patch failed', err))
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
    let detail = 'Stripe a refusé la création de la session.'
    try {
      const j = JSON.parse(txt)
      if (j?.error?.message) detail = j.error.message
    } catch {}
    return { error: `Stripe ${res.status} : ${detail}` }
  }
  const data = await res.json()
  return { url: data.url || null }
}

async function rollback({ supabaseUrl, serviceKey, userId, photographerId }) {
  if (photographerId) {
    await fetch(`${supabaseUrl}/rest/v1/photographers?id=eq.${photographerId}`, {
      method: 'DELETE',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    }).catch(() => {})
  }
  if (userId) {
    await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    }).catch(() => {})
  }
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

  if (body.website) return res.status(200).json({ ok: true })
  if (body.t && typeof body.t === 'number' && Date.now() - body.t < 3000) return res.status(200).json({ ok: true })

  const fullName = String(body.fullName || '').trim().slice(0, 100)
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200)
  const password = String(body.password || '')
  const ville = String(body.ville || '').trim().slice(0, 80)
  const zoneCouverte = String(body.zoneCouverte || '').trim().slice(0, 200)
  const portfolioUrl = String(body.portfolioUrl || '').trim().slice(0, 300)
  const instagramHandle = String(body.instagramHandle || '').trim().slice(0, 50).replace(/^@/, '')
  const telephone = String(body.telephone || '').trim().slice(0, 30)
  const specialite = String(body.specialite || '').trim().slice(0, 100)
  const tarifMin = parseInt(body.tarifMin || '0', 10) || null
  const tarifMax = parseInt(body.tarifMax || '0', 10) || null
  const bio = String(body.bio || '').trim().slice(0, 600)

  if (!fullName || !email || !ville || !portfolioUrl || !password) {
    return res.status(400).json({ error: 'Champs obligatoires manquants : nom, email, mot de passe, ville, portfolio.' })
  }
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Email invalide.' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Le mot de passe doit faire au moins 8 caractères.' })
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

  // Check unicité email côté table photographers (évite doublon dossier)
  const checkUrl = `${SUPABASE_URL}/rest/v1/photographers?email=eq.${encodeURIComponent(email)}&select=id,status&limit=1`
  const checkRes = await fetch(checkUrl, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  if (checkRes.ok) {
    const existing = await checkRes.json()
    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(409).json({ error: 'Une fiche avec cet email existe déjà. Connecte-toi sur app.jasonmarinho.com pour la gérer.' })
    }
  }

  // 1. Crée le compte Supabase Auth
  const auth = await createAuthUser({
    supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY, email, password, fullName,
  })
  if (auth.error) {
    if (auth.status === 422 || /already.*registered|exists/i.test(auth.error)) {
      return res.status(409).json({ error: 'Cet email a déjà un compte Jason Marinho. Connecte-toi sur app.jasonmarinho.com.' })
    }
    return res.status(500).json({ error: 'Création du compte impossible : ' + auth.error })
  }
  const userId = auth.userId

  // 2. Met à jour le rôle profile en 'photographer'
  await setProfileRole({ supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY, userId, role: 'photographer', fullName })

  // 3. Détermine le tier
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

  // 4. Insert pending_payment lié au user_id
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/photographers`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      user_id: userId,
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

  // 5. Crée la session Stripe Checkout
  const stripeResult = await createCheckoutSession({
    stripeKey: STRIPE_KEY,
    priceId,
    email,
    metadata: { photographer_id: photographerId, tier, user_id: userId },
  })
  if (!stripeResult.url) {
    await rollback({ supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY, userId, photographerId })
    return res.status(500).json({
      error: stripeResult.error || 'Erreur Stripe. Réessaye ou contacte contact@jasonmarinho.com.',
    })
  }

  return res.status(200).json({ ok: true, checkoutUrl: stripeResult.url, tier })
}
