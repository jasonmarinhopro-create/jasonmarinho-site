// Vercel serverless function : enregistre les clics sortants sur les liens
// affiliés/partenaires (rel="sponsored") du site statique, pour savoir dans
// l'admin (app.jasonmarinho.com/dashboard/admin) quelles pages envoient des
// clics vers quels partenaires.
//
// POST { session_id, path, url } via navigator.sendBeacon depuis nav.js.
// Aucune IP ni user-agent stockés.

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
function partnerFromUrl(u) {
  try {
    const parts = new URL(u).hostname.toLowerCase().split('.')
    return parts.length >= 2 ? parts[parts.length - 2] : parts[0]
  } catch { return '' }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ua = String(req.headers['user-agent'] || '')
  if (!ua || BOT_UA.test(ua)) return res.status(200).json({ ok: true })

  if (isRateLimited(`ip:${getClientIp(req)}`, 30, 60 * 1000)) {
    return res.status(200).json({ ok: true })
  }

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  body = body || {}

  const sessionId = String(body.session_id || '').trim().slice(0, 64)
  const path = String(body.path || '').trim().slice(0, 300)
  const url = String(body.url || '').trim().slice(0, 500)
  const partner = partnerFromUrl(url).slice(0, 60)
  if (!sessionId || !path || !/^https?:\/\//.test(url) || !partner) {
    return res.status(400).json({ error: 'Paramètres invalides' })
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(200).json({ ok: true })

  await fetch(`${SUPABASE_URL}/rest/v1/affiliate_clicks`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ session_id: sessionId, path, url, partner }),
  }).catch(err => console.warn('[track/click] insert failed', err))

  return res.status(200).json({ ok: true })
}
