// Vercel serverless function : tracking léger du site statique, une seule
// fonction pour deux routes (le forfait Hobby limite un déploiement à 12
// fonctions serverless, cf. CLAUDE.md) :
//
// - POST /api/track/visit { session_id, path, referrer, utm_source, utm_medium, utm_campaign }
//   → site_visits : compteur "en direct" + répartition par canal dans l'admin.
//   Une ligne par navigation, pas de dédup (mesure de l'activité récente).
// - POST /api/track/click { session_id, path, url }
//   → affiliate_clicks : clics sortants sur les liens rel="sponsored".
//
// - POST /api/track/leave { visit_id, seconds }
//   → temps passé sur la page (site_visits.duration_s), envoyé quand on quitte.
//
// Appelées en navigator.sendBeacon depuis nav.js. Aucune IP ni user-agent
// stockés (RGPD-friendly par construction) : seulement le pays, la région et
// la ville que Vercel déduit de l'IP, et le type d'écran déduit du
// navigateur (statistiques des fiches pros, page Visibilité de l'admin,
// migration 20261005_123).

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

const BOT_UA = /bot|crawler|spider|crawling|preview|scan|monitor|lighthouse|headless|python|curl|wget/i

// "app.lodgify.com" -> "lodgify", "www.smoobu.com" -> "smoobu"
// Liens raccourcis fournis par un partenaire : le domaine ne dit pas qui c'est
const SHORT_LINKS = { 'urlr.me/FEqNfy': 'indy' }
// Programmes Affilae (identifiant p= des liens lb.affilae.com)
const AFFILAE_PROGRAMS = { '651c0d1e40e2d575f87b3b27': 'tiime' }

function partnerFromUrl(u) {
  try {
    const url = new URL(u)
    const short = SHORT_LINKS[url.hostname.toLowerCase() + url.pathname]
    if (short) return short
    // Liens de redirection Affilae (lb.affilae.com/r/?p=<programme>&lp=<page>) :
    // le partenaire est le programme, pas Affilae
    if (url.hostname.toLowerCase() === 'lb.affilae.com') {
      const prog = AFFILAE_PROGRAMS[url.searchParams.get('p') || '']
      if (prog) return prog
      try { return partnerFromUrl(url.searchParams.get('lp') || '') || 'affilae' } catch { return 'affilae' }
    }
    const parts = url.hostname.toLowerCase().split('.')
    return parts.length >= 2 ? parts[parts.length - 2] : parts[0]
  } catch { return '' }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Type d'écran déduit du navigateur (le navigateur lui-même n'est pas stocké) */
function deviceOf(ua) {
  if (/iPad|Tablet|PlayBook|Silk|Kindle/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tablet'
  if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) return 'mobile'
  return 'desktop'
}

/** En-têtes de géolocalisation de Vercel (déduits de l'IP, qui n'est pas gardée) */
function geoOf(req) {
  const h = name => {
    const v = req.headers[name]
    if (!v) return null
    try { return decodeURIComponent(String(v)).slice(0, 80) || null } catch { return String(v).slice(0, 80) || null }
  }
  return { country: h('x-vercel-ip-country'), region: h('x-vercel-ip-country-region'), city: h('x-vercel-ip-city') }
}

/** Colonnes de la migration 123 : sans elles, on réécrit la ligne sans ces champs */
const EXTRA_VISIT_COLUMNS = ['country', 'region', 'city', 'device']

async function insert(table, row, tag) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_KEY) return
  const post = body => fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  })
  try {
    const r = await post(row)
    if (!r.ok && table === 'site_visits' && r.status === 400) {
      const legacy = { ...row }
      EXTRA_VISIT_COLUMNS.forEach(k => { delete legacy[k] })
      await post(legacy)
    }
  } catch (err) { console.warn(`[track/${tag}] insert failed`, err) }

  // Purge opportuniste des visites (~1 appel sur 200), sans cron dédié :
  // 100 jours pour le site (page Visibilité, 3 mois), 400 jours pour les
  // fiches pros (statistiques sur 12 mois, /annuaires/…).
  if (table === 'site_visits' && Math.random() < 0.005) {
    const del = query => fetch(`${SUPABASE_URL}/rest/v1/site_visits?${query}`, {
      method: 'DELETE',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    }).catch(() => {})
    const ago = days => encodeURIComponent(new Date(Date.now() - days * 24 * 3600 * 1000).toISOString())
    del(`created_at=lt.${ago(100)}&path=not.like.${encodeURIComponent('/annuaires/*')}`)
    del(`created_at=lt.${ago(400)}`)
  }
}

async function recordDuration(visitId, seconds) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_KEY) return
  // Seulement une visite des 6 dernières heures (on ne réécrit pas l'historique)
  const since = encodeURIComponent(new Date(Date.now() - 6 * 3600 * 1000).toISOString())
  await fetch(`${SUPABASE_URL}/rest/v1/site_visits?id=eq.${visitId}&created_at=gte.${since}`, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ duration_s: seconds }),
  }).catch(() => {})
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const type = String((req.query && req.query.type) || '')
  if (type !== 'visit' && type !== 'click' && type !== 'leave') return res.status(404).json({ error: 'Not found' })

  const ua = String(req.headers['user-agent'] || '')
  if (!ua || BOT_UA.test(ua)) return res.status(200).json({ ok: true })

  // Visites : une même IP navigue légitimement sur plusieurs pages par minute.
  const max = type === 'click' ? 30 : 120
  if (isRateLimited(`${type}:${getClientIp(req)}`, max, 60 * 1000)) {
    return res.status(200).json({ ok: true })
  }

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  body = body || {}

  if (type === 'leave') {
    const visitId = String(body.visit_id || '')
    const seconds = Math.round(Number(body.seconds))
    if (!UUID.test(visitId) || !Number.isFinite(seconds) || seconds < 0) return res.status(400).json({ error: 'Paramètres invalides' })
    await recordDuration(visitId, Math.min(seconds, 3600))
    return res.status(200).json({ ok: true })
  }

  const sessionId = String(body.session_id || '').trim().slice(0, 64)
  const path = String(body.path || '').trim().slice(0, 300)
  if (!sessionId || !path) return res.status(400).json({ error: 'Paramètres invalides' })

  if (type === 'visit') {
    const visitId = String(body.visit_id || '')
    await insert('site_visits', {
      ...(UUID.test(visitId) ? { id: visitId } : {}),
      session_id: sessionId,
      path,
      referrer: String(body.referrer || '').trim().slice(0, 500) || null,
      utm_source: String(body.utm_source || '').trim().slice(0, 100) || null,
      utm_medium: String(body.utm_medium || '').trim().slice(0, 100) || null,
      utm_campaign: String(body.utm_campaign || '').trim().slice(0, 100) || null,
      device: deviceOf(ua),
      ...geoOf(req),
    }, 'visit')
  } else {
    const url = String(body.url || '').trim().slice(0, 500)
    const partner = partnerFromUrl(url).slice(0, 60)
    if (!/^https?:\/\//.test(url) || !partner) return res.status(400).json({ error: 'Paramètres invalides' })
    await insert('affiliate_clicks', { session_id: sessionId, path, url, partner }, 'click')
  }

  return res.status(200).json({ ok: true })
}
