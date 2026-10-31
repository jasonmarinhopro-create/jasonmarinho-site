// Inscription « Dépannage et maintenance » depuis le site (31/10/2026), même
// parcours que le ménage (scripts/api-pro/cleaner/signup.cjs) : compte, fiche
// en attente de paiement, place Fondateur, Stripe Checkout. Aucun contrôle
// SIRET ni assurance (décision de Jason). Fermé tant que le métier n'est pas
// ouvert (METIERS.depannage.ouvert dans les deux registres) : 403.

const { findOrCreateCustomer } = require('../../lib/stripe-customer.cjs')
const extras = require('../../lib/pro-signup-extras.cjs')
// Mêmes clés que scripts/lib/pro-clienteles.mjs et jason-app/lib/pros/clienteles.ts
const CLIENTELE_KEYS = ['lcd', 'hotel', 'conciergerie', 'gite']
const readClienteles = raw => CLIENTELE_KEYS.filter(k => Array.isArray(raw) && raw.includes(k))
const FOUNDER_QUOTA = 20
const FOUNDER_PRICE_ID = process.env.STRIPE_DEPANNAGE_FOUNDER_PRICE_ID || ''
const STANDARD_PRICE_ID = process.env.STRIPE_DEPANNAGE_STANDARD_PRICE_ID || ''
// Même valeur que METIERS.depannage.ouvert (scripts/lib/metiers.mjs, ESM non importable ici)
const OUVERT = false
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

const ALLOWED_SPECIALITES = new Set(['electricite', 'plomberie', 'chauffage', 'serrurerie', 'multiservice', 'montage', 'vitrerie', 'electromenager', 'exterieur'])
const ALLOWED_DISPOS = new Set(['semaine', 'soir', 'weekend', 'urgence'])
const ALLOWED_DELAI = new Set(['jour_meme', '24h', '48h', 'semaine'])
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
      user_metadata: { full_name: fullName, signup_source: 'annuaire_depannage' },
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('[depannage/signup] auth user create failed', res.status, data)
    return { error: data?.msg || data?.message || 'Erreur création compte', status: res.status }
  }
  return { userId: data?.id || data?.user?.id }
}

// Provenance de l'inscription (10/10/2026) : point d'entrée de la visite envoyé
// par le formulaire (nav.js, sessionStorage jm_acq). Même nettoyage que
// jason-app/lib/acquisition/rules.ts. Écrite seulement si le compte n'en a pas
// déjà une ; sans la migration 126, la requête échoue sans rien bloquer.
function cleanAcq(input) {
  if (!input || typeof input !== 'object') return null
  const s = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '')
  const out = {}
  const source = s(input.source, 80).toLowerCase()
  const medium = s(input.medium, 80).toLowerCase()
  const campaign = s(input.campaign, 100)
  let ref = s(input.ref, 200).toLowerCase()
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(ref) || /(^|\.)jasonmarinho\.com$/.test(ref)) ref = ''
  let landing = s(input.landing, 300).split(/[?#]/)[0]
  if (!landing.startsWith('/')) landing = ''
  const at = s(input.at, 40)
  if (source) out.source = source
  if (medium) out.medium = medium
  if (campaign) out.campaign = campaign
  if (ref) out.ref = ref
  if (landing) out.landing = landing
  if (at && !Number.isNaN(Date.parse(at))) out.at = new Date(at).toISOString()
  return Object.keys(out).some(k => k !== 'at') ? out : null
}

async function saveAcquisition({ supabaseUrl, serviceKey, userId, acq }) {
  const clean = cleanAcq(acq)
  if (!clean || !userId) return
  await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&acquisition=is.null`, {
    method: 'PATCH',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ acquisition: clean }),
  }).catch(() => { /* jamais bloquant */ })
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
  }).catch(err => console.warn('[depannage/signup] profile role patch failed', err))
}

async function createCheckoutSession({ stripeKey, priceId, email, metadata, name }) {
  const params = new URLSearchParams()
  params.append('mode', 'subscription')
  // Un seul client Stripe par adresse : celui de sa fiche précédente s'il existe
  const customerId = await findOrCreateCustomer(stripeKey, email, name)
  if (customerId) params.append('customer', customerId)
  else params.append('customer_email', email)
  params.append('line_items[0][price]', priceId)
  params.append('line_items[0][quantity]', '1')
  // Retour du paiement : connecté directement à Ma fiche (24/10/2026)
  params.append('success_url', extras.successUrl('depannage'))
  params.append('cancel_url', `${SITE_URL}/annuaires/depannage/inscription/confirmation?status=cancel`)
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
    console.error('[depannage/signup] stripe checkout failed', res.status, txt)
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

// Retour arrière : supprime le compte Auth et la fiche créés avant que
// Stripe ne plante, pour éviter les orphelins qui empêcheraient un
// nouvel essai avec le même email (UNIQUE constraint).
async function rollback({ supabaseUrl, serviceKey, userId, proId }) {
  if (proId) {
    await fetch(`${supabaseUrl}/rest/v1/depannage_pros?id=eq.${proId}`, {
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

// Places Fondateur : une inscription non payée ne garde sa place que 7 jours
// (même règle que jason-app/lib/pros/founder-seats.ts, garder identiques).
function founderSeatOr() {
  const cutoff = new Date(Date.now() - 7 * 86400000).toISOString().replace(/\.\d{3}Z$/, 'Z')
  return `or=(status.in.(active,approved_pending_payment),and(status.eq.pending_payment,created_at.gte.${cutoff}))`
}

// Inscription reprise avec le même e-mail : le mot de passe saisi est-il celui
// du compte déjà créé ? (avant : le compte était supprimé puis recréé, ce qui
// aurait effacé un compte hôte qui avait commencé sa fiche depuis l'app).
async function passwordUserId({ supabaseUrl, serviceKey, email, password }) {
  try {
    const r = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: serviceKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!r.ok) return null
    const j = await r.json()
    return j && j.user && j.user.id ? j.user.id : null
  } catch {
    return null
  }
}

// Adresse de site tolérante (15/10/2026) : « monsite.fr » reçoit https://,
// « @compte » devient le lien Instagram. Même règle que le formulaire.
function normUrl(v) {
  v = String(v || '').trim().replace(/\s+/g, '')
  if (!v) return ''
  if (/^@[\w.]{1,30}$/.test(v)) return 'https://www.instagram.com/' + v.slice(1)
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v.replace(/^\/+/, '')
  return v.slice(0, 300)
}
const urlOk = (v) => /^https?:\/\/[^\s\/.]+(\.[^\s\/.]+)+/i.test(v)

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ip = getClientIp(req)
  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  body = body || {}

  // Photos envoyées une par une juste après l'inscription (24/10/2026)
  if (body.action === 'photo') {
    if (isRateLimited(`photo:${ip}`, 30, 15 * 60 * 1000)) return res.status(429).json({ error: 'Trop d’envois, réessaie dans quelques minutes.' })
    const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL
    const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!SUPA || !KEY) return res.status(500).json({ error: 'Service indisponible' })
    const out = await extras.handlePhoto({ table: 'depannage_pros', body, supabaseUrl: SUPA, serviceKey: KEY })
    return res.status(out.status).json(out.body)
  }

  if (!OUVERT) return res.status(403).json({ error: 'Les inscriptions ouvrent très bientôt.' })

  if (isRateLimited(`ip:${ip}`, 3, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Trop de tentatives. Réessaye dans 15 minutes.' })
  }


  if (body.website) return res.status(200).json({ ok: true })
  if (body.t && typeof body.t === 'number' && Date.now() - body.t < 3000) return res.status(200).json({ ok: true })

  const fullName = String(body.fullName || '').trim().slice(0, 100)
  const pseudo = String(body.pseudo || '').trim().slice(0, 100)
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200)
  const password = String(body.password || '')
  const ville = extras.villeCasse(String(body.ville || '').slice(0, 80))
  const zoneCouverte = String(body.zoneCouverte || '').trim().slice(0, 200)
  const siteUrl = normUrl(body.siteUrl)
  const instagramHandle = extras.instaHandle(body.instagramHandle)
  const telephone = String(body.telephone || '').trim().slice(0, 30)
  const tarifHeure = Math.min(500, parseInt(body.tarifHeure || '0', 10) || 0) || null
  const deplRaw = String(body.deplacementPrix ?? '').trim()
  const deplacementPrix = deplRaw === '' ? null : Math.max(0, Math.min(500, parseInt(deplRaw, 10) || 0))
  const delaiIntervention = String(body.delaiIntervention || '').trim()
  const siret = String(body.siret || '').trim().replace(/\s+/g, '').slice(0, 14)
  const bio = String(body.bio || '').trim().slice(0, 600)

  const pick = (raw, allowed, max) => Array.isArray(raw) ? [...new Set(raw.filter(v => typeof v === 'string' && allowed.has(v)))].slice(0, max) : []
  const specialites = pick(body.specialites, ALLOWED_SPECIALITES, 9)
  const disponibilites = pick(body.disponibilites, ALLOWED_DISPOS, 4)
  // Tout en une fois (24/10/2026) : villes couvertes, formules, téléphone affiché, photos à suivre
  const villesCouvertes = extras.cleanVilles(body.villesCouvertes, ville)
  const formules = extras.cleanFormules(body.formules)
  const telephonePublic = body.telephonePublic === true && !!telephone
  const photoCount = Math.max(0, Math.min(extras.PHOTOS_MAX, parseInt(body.photoCount || '0', 10) || 0))
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
  if (siteUrl && !urlOk(siteUrl)) {
    return res.status(400).json({ error: 'Ton site : ce lien ne ressemble pas à une adresse de site (exemple : monsite.fr).' })
  }
  if (!specialites.length) {
    return res.status(400).json({ error: 'Coche au moins une spécialité.' })
  }
  if (delaiIntervention && !ALLOWED_DELAI.has(delaiIntervention)) {
    return res.status(400).json({ error: 'Délai d\'intervention invalide.' })
  }
  if (siret && !/^[0-9]{14}$/.test(siret)) {
    return res.status(400).json({ error: 'Le SIRET doit faire 14 chiffres (sans espaces).' })
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY
  if (!SUPABASE_URL || !SERVICE_KEY || !STRIPE_KEY) {
    console.error('[depannage/signup] env vars manquantes')
    return res.status(500).json({ error: 'Service indisponible' })
  }
  if (!FOUNDER_PRICE_ID || !STANDARD_PRICE_ID) {
    console.error('[depannage/signup] price_id Stripe manquants')
    return res.status(500).json({ error: 'Service indisponible (config Stripe).' })
  }

  // Unicité de l'e-mail. Fiche restée au paiement (pending_payment sans
  // abonnement) : nouvel essai possible avec le même mot de passe (voir plus bas).
  const checkUrl = `${SUPABASE_URL}/rest/v1/depannage_pros?email=eq.${encodeURIComponent(email)}&select=id,status,stripe_subscription_id,user_id&limit=1`
  const checkRes = await fetch(checkUrl, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  let reuseUserId = null
  if (checkRes.ok) {
    const existing = await checkRes.json()
    if (Array.isArray(existing) && existing.length > 0) {
      const row = existing[0]
      const isOrphan = row.status === 'pending_payment' && !row.stripe_subscription_id
      if (isOrphan) {
        // Paiement abandonné puis nouvel essai : même compte si le mot de passe
        // est le bon (seule la fiche est refaite), sinon renvoi vers l'espace
        // où « Finaliser mon paiement » l'attend. Jamais de compte supprimé.
        const sameUser = await passwordUserId({ supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY, email, password })
        if (!sameUser || sameUser !== row.user_id) {
          return res.status(409).json({ error: 'Tu as déjà commencé ton inscription avec cet e-mail. Connecte-toi sur app.jasonmarinho.com (« Mot de passe oublié » si besoin) : ta fiche est gardée et le bouton « Finaliser mon paiement » t’attend.' })
        }
        await fetch(`${SUPABASE_URL}/rest/v1/depannage_pros?id=eq.${row.id}`, {
          method: 'DELETE',
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
        }).catch(() => {})
        reuseUserId = sameUser
      } else {
        return res.status(409).json({ error: 'Une fiche avec cet email existe déjà. Connecte-toi sur app.jasonmarinho.com pour la gérer.' })
      }
    }
  }

  // 1. Crée le compte Supabase Auth
  const auth = reuseUserId
    ? { userId: reuseUserId }
    : await createAuthUser({ supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY, email, password, fullName })
  if (auth.error) {
    if (auth.status === 422 || /already.*registered|exists/i.test(auth.error)) {
      return res.status(409).json({ error: 'Cet e-mail a déjà un compte Jason Marinho. Connecte-toi sur app.jasonmarinho.com puis crée ta fiche depuis ton espace (menu du compte, « Ajouter un espace ») : tu n’auras pas à recréer de compte.' })
    }
    return res.status(500).json({ error: 'Création du compte impossible : ' + auth.error })
  }
  const userId = auth.userId

  // 2. Nom du profil (pas de rôle spécial : l'espace dépannage suit depannage_pros.user_id)
  await setProfileRole({ supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY, userId, role: 'user', fullName })
  await saveAcquisition({ supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY, userId, acq: body.acq })

  // 3. Détermine tier
  const tierUrl = `${SUPABASE_URL}/rest/v1/depannage_pros?tier=eq.fondateur&${founderSeatOr()}&select=id`
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
  const insertFiche = extra => fetch(`${SUPABASE_URL}/rest/v1/depannage_pros`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      ...extra,
      user_id: userId,
      email, full_name: fullName,
      pseudo: pseudo || null,
      ville,
      zone_couverte: zoneCouverte || null,
      site_url: siteUrl || null,
      instagram_handle: instagramHandle || null,
      telephone: telephone || null,
      tarif_heure: tarifHeure,
      deplacement_prix: deplacementPrix,
      specialites,
      disponibilites,
      delai_intervention: delaiIntervention || null,
      langues: langues.length > 0 ? langues : ['fr'],
      siret: siret || null,
      bio: bio || null,
      tier,
      status: 'pending_payment',
    }),
  })
  const insertRes = await insertFiche({ villes_couvertes: villesCouvertes, formules, telephone_public: telephonePublic, clienteles: readClienteles(body.clienteles) })
  if (!insertRes.ok) {
    const txt = await insertRes.text()
    console.error('[depannage/signup] INSERT failed', insertRes.status, txt)
    return res.status(500).json({ error: 'Erreur lors de l\'enregistrement.' })
  }
  const inserted = await insertRes.json()
  const proId = Array.isArray(inserted) ? inserted[0]?.id : inserted?.id
  if (!proId) {
    return res.status(500).json({ error: 'Erreur lors de l\'enregistrement.' })
  }

  // 5. Crée la session Stripe Checkout
  const stripeResult = await createCheckoutSession({
    stripeKey: STRIPE_KEY,
    priceId,
    email,
    name: fullName,
    metadata: { depannage_id: proId, tier, user_id: userId },
  })
  if (!stripeResult.url) {
    await rollback({ supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY, userId: reuseUserId ? null : userId, proId })
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
        subject: `Nouvelle inscription Dépannage : ${esc(fullName)}`,
        html: `<div style="font-family:-apple-system,Segoe UI,Helvetica,sans-serif;max-width:560px;padding:24px;background:#f7f5f0;border-radius:12px">
<h2 style="font-family:Georgia,serif;color:#0F1A0D;margin:0 0 14px">Nouvelle inscription Dépannage</h2>
<div style="background:#fff;padding:16px;border-radius:8px;font-size:13.5px;line-height:1.9;color:#3D5038;border-left:3px solid #63D683">
<strong>Profil :</strong> Dépannage et maintenance (annuaire)<br>
<strong>Nom :</strong> ${esc(fullName)}<br>
<strong>Email :</strong> ${esc(email)}<br>
<strong>Ville :</strong> ${esc(ville)}<br>
<strong>Tier :</strong> ${esc(tier)}<br>
<strong>Statut :</strong> paiement Stripe en cours (fiche activée au paiement)
</div>
<p style="margin:18px 0 0"><a href="https://app.jasonmarinho.com/dashboard/admin/depannage" style="display:inline-block;background:#FFD56B;color:#003329;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Voir les pros du dépannage</a></p>
</div>`,
      }),
    }).catch(err => console.warn('[depannage/signup] notify email failed', err))
  }

  return res.status(200).json({
    ok: true, checkoutUrl: stripeResult.url, tier,
    // Photos à envoyer avant de partir au paiement
    ...(photoCount ? { ficheId: proId, photoSig: extras.photoSig(proId, userId, SERVICE_KEY) } : {}),
  })
}
