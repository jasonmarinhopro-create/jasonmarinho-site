// Vercel serverless function : inscription équipe ménage LCD self-service.
// Flow : form (email + password + infos) → crée compte Supabase Auth
// + insert pending_payment + détermine tier → crée Stripe Checkout
// session → renvoie l'URL au form qui redirige.
// Activation publique de la fiche au webhook customer.subscription.created.
// Après paiement, l'équipe se connecte sur app.jasonmarinho.com et gère
// sa fiche depuis /dashboard/ma-fiche-menage.

const FOUNDER_QUOTA = 20
const FOUNDER_PRICE_ID = process.env.STRIPE_CLEANER_FOUNDER_PRICE_ID || ''
const STANDARD_PRICE_ID = process.env.STRIPE_CLEANER_STANDARD_PRICE_ID || ''
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

const ALLOWED_PRESTATIONS = new Set([
  'menage_standard', 'gestion_linge', 'repassage', 'reapprovisionnement',
  'etat_des_lieux_photo', 'petite_maintenance', 'nettoyage_exterieur', 'gestion_dechets',
])
const ALLOWED_EQUIPE = new Set(['solo', 'duo', 'equipe_3_5', 'equipe_6_plus'])
const ALLOWED_DELAI = new Set(['jour_meme', '24h', '48h', '72h'])
const ALLOWED_LANGUES = new Set(['fr', 'en', 'es', 'it', 'de', 'pt', 'ar', 'zh'])

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
      user_metadata: { full_name: fullName, signup_source: 'annuaire_menage' },
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('[cleaner/signup] auth user create failed', res.status, data)
    return { error: data?.msg || data?.message || 'Erreur création compte', status: res.status }
  }
  return { userId: data?.id || data?.user?.id }
}

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
  }).catch(err => console.warn('[cleaner/signup] profile role patch failed', err))
}

async function createCheckoutSession({ stripeKey, priceId, email, metadata }) {
  const params = new URLSearchParams()
  params.append('mode', 'subscription')
  params.append('customer_email', email)
  params.append('line_items[0][price]', priceId)
  params.append('line_items[0][quantity]', '1')
  params.append('success_url', `${SITE_URL}/annuaires/menage/inscription/confirmation?status=paid`)
  params.append('cancel_url', `${SITE_URL}/annuaires/menage/inscription/confirmation?status=cancel`)
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
    console.error('[cleaner/signup] stripe checkout failed', res.status, txt)
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

// Rollback : supprime le compte Auth + la row cleaner créés avant que
// Stripe ne plante, pour éviter les orphelins qui empêcheraient un
// nouvel essai avec le même email (UNIQUE constraint).
async function rollback({ supabaseUrl, serviceKey, userId, cleanerId }) {
  if (cleanerId) {
    await fetch(`${supabaseUrl}/rest/v1/cleaners?id=eq.${cleanerId}`, {
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
  const pseudo = String(body.pseudo || '').trim().slice(0, 100)
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200)
  const password = String(body.password || '')
  const ville = String(body.ville || '').trim().slice(0, 80)
  const zoneCouverte = String(body.zoneCouverte || '').trim().slice(0, 200)
  const siteUrl = String(body.siteUrl || '').trim().slice(0, 300)
  const instagramHandle = String(body.instagramHandle || '').trim().slice(0, 50).replace(/^@/, '')
  const telephone = String(body.telephone || '').trim().slice(0, 30)
  const tarifForfaitMin = parseInt(body.tarifForfaitMin || '0', 10) || null
  const tarifForfaitMax = parseInt(body.tarifForfaitMax || '0', 10) || null
  const tarifHeure = parseInt(body.tarifHeure || '0', 10) || null
  const equipeType = String(body.equipeType || '').trim()
  const logementsGeres = parseInt(body.logementsGeres || '0', 10) || null
  const delaiReservation = String(body.delaiReservation || '').trim()
  const assuranceRcPro = body.assuranceRcPro === true || body.assuranceRcPro === 'true'
  const siret = String(body.siret || '').trim().replace(/\s+/g, '').slice(0, 14)
  const bio = String(body.bio || '').trim().slice(0, 600)

  const prestations = Array.isArray(body.prestations)
    ? body.prestations.filter(p => typeof p === 'string' && ALLOWED_PRESTATIONS.has(p)).slice(0, 12)
    : []
  const langues = Array.isArray(body.langues)
    ? body.langues.filter(l => typeof l === 'string' && ALLOWED_LANGUES.has(l)).slice(0, 8)
    : []

  if (!fullName || !email || !ville || !password) {
    return res.status(400).json({ error: 'Champs obligatoires manquants : nom, email, mot de passe, ville.' })
  }
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Email invalide.' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Le mot de passe doit faire au moins 8 caractères.' })
  }
  if (siteUrl && !/^https?:\/\//i.test(siteUrl)) {
    return res.status(400).json({ error: 'Le site web doit commencer par https://' })
  }
  if (equipeType && !ALLOWED_EQUIPE.has(equipeType)) {
    return res.status(400).json({ error: 'Type d\'équipe invalide.' })
  }
  if (delaiReservation && !ALLOWED_DELAI.has(delaiReservation)) {
    return res.status(400).json({ error: 'Délai de réservation invalide.' })
  }
  if (siret && !/^[0-9]{14}$/.test(siret)) {
    return res.status(400).json({ error: 'Le SIRET doit faire 14 chiffres (sans espaces).' })
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY
  if (!SUPABASE_URL || !SERVICE_KEY || !STRIPE_KEY) {
    console.error('[cleaner/signup] env vars manquantes')
    return res.status(500).json({ error: 'Service indisponible' })
  }
  if (!FOUNDER_PRICE_ID || !STANDARD_PRICE_ID) {
    console.error('[cleaner/signup] price_id Stripe manquants')
    return res.status(500).json({ error: 'Service indisponible (config Stripe).' })
  }

  // Check unicité email : avec auto-recovery des orphelins
  // (status='pending_payment' sans stripe_subscription_id : ce sont des
  // inscriptions ratées au moment du Stripe Checkout. On les supprime
  // silencieusement pour permettre le retry avec le même email.)
  const checkUrl = `${SUPABASE_URL}/rest/v1/cleaners?email=eq.${encodeURIComponent(email)}&select=id,status,stripe_subscription_id,user_id&limit=1`
  const checkRes = await fetch(checkUrl, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  if (checkRes.ok) {
    const existing = await checkRes.json()
    if (Array.isArray(existing) && existing.length > 0) {
      const row = existing[0]
      const isOrphan = row.status === 'pending_payment' && !row.stripe_subscription_id
      if (isOrphan) {
        console.warn('[cleaner/signup] orphan detected, cleaning up before retry', row.id)
        await rollback({
          supabaseUrl: SUPABASE_URL,
          serviceKey: SERVICE_KEY,
          userId: row.user_id,
          cleanerId: row.id,
        })
      } else {
        return res.status(409).json({ error: 'Une fiche avec cet email existe déjà. Connecte-toi sur app.jasonmarinho.com pour la gérer.' })
      }
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

  // 2. Met à jour le nom du profile (pas de role spécial : multi-espaces,
  //    l'accès au dashboard ménage est déterminé par cleaners.user_id).
  await setProfileRole({ supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY, userId, role: 'user', fullName })

  // 3. Détermine tier
  const tierUrl = `${SUPABASE_URL}/rest/v1/cleaners?tier=eq.fondateur&status=in.(active,pending_payment,approved_pending_payment)&select=id`
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
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/cleaners`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      user_id: userId,
      email, full_name: fullName,
      pseudo: pseudo || null,
      ville,
      zone_couverte: zoneCouverte || null,
      site_url: siteUrl || null,
      instagram_handle: instagramHandle || null,
      telephone: telephone || null,
      tarif_forfait_min: tarifForfaitMin,
      tarif_forfait_max: tarifForfaitMax,
      tarif_heure: tarifHeure,
      prestations: prestations.length > 0 ? prestations : null,
      equipe_type: equipeType || null,
      logements_geres: logementsGeres,
      delai_reservation: delaiReservation || null,
      langues: langues.length > 0 ? langues : null,
      assurance_rc_pro: assuranceRcPro,
      siret: siret || null,
      bio: bio || null,
      tier,
      status: 'pending_payment',
    }),
  })
  if (!insertRes.ok) {
    const txt = await insertRes.text()
    console.error('[cleaner/signup] INSERT failed', insertRes.status, txt)
    return res.status(500).json({ error: 'Erreur lors de l\'enregistrement.' })
  }
  const inserted = await insertRes.json()
  const cleanerId = Array.isArray(inserted) ? inserted[0]?.id : inserted?.id
  if (!cleanerId) {
    return res.status(500).json({ error: 'Erreur lors de l\'enregistrement.' })
  }

  // 5. Crée la session Stripe Checkout
  const stripeResult = await createCheckoutSession({
    stripeKey: STRIPE_KEY,
    priceId,
    email,
    metadata: { cleaner_id: cleanerId, tier, user_id: userId },
  })
  if (!stripeResult.url) {
    await rollback({ supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY, userId, cleanerId })
    return res.status(500).json({
      error: stripeResult.error || 'Erreur Stripe. Réessaye ou contacte contact@jasonmarinho.com.',
    })
  }

  // 6. Notifie Jason de l'inscription : awaité : la lambda Vercel gèle
  //    après res.json(), un fire-and-forget ne partirait jamais.
  const RESEND_KEY = process.env.RESEND_API_KEY
  if (RESEND_KEY) {
    const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Jason Marinho <noreply@jasonmarinho.com>',
        to: 'contact@jasonmarinho.com',
        subject: `Nouvelle inscription Équipe ménage : ${esc(fullName)}`,
        html: `<div style="font-family:-apple-system,Segoe UI,Helvetica,sans-serif;max-width:560px;padding:24px;background:#f7f5f0;border-radius:12px">
<h2 style="font-family:Georgia,serif;color:#0F1A0D;margin:0 0 14px">🧹 Nouvelle inscription Équipe ménage</h2>
<div style="background:#fff;padding:16px;border-radius:8px;font-size:13.5px;line-height:1.9;color:#3D5038;border-left:3px solid #63D683">
<strong>Profil :</strong> Équipe ménage (annuaire)<br>
<strong>Nom :</strong> ${esc(fullName)}<br>
<strong>Email :</strong> ${esc(email)}<br>
<strong>Ville :</strong> ${esc(ville)}<br>
<strong>Tier :</strong> ${esc(tier)}<br>
<strong>Statut :</strong> paiement Stripe en cours (fiche activée au paiement)
</div>
<p style="margin:18px 0 0"><a href="https://app.jasonmarinho.com/dashboard/admin/menage" style="display:inline-block;background:#FFD56B;color:#003329;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Voir les équipes ménage →</a></p>
</div>`,
      }),
    }).catch(err => console.warn('[cleaner/signup] notify email failed', err))
  }

  return res.status(200).json({ ok: true, checkoutUrl: stripeResult.url, tier })
}
