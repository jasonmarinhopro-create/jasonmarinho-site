// Vercel serverless function : tracking léger des pages vues sur le site
// statique, pour le compteur "en direct" et la répartition par canal
// affichés dans l'admin (app.jasonmarinho.com/dashboard/admin).
//
// POST { session_id, path, referrer, utm_source, utm_medium, utm_campaign }
// Appelé en navigator.sendBeacon depuis nav.js sur chaque page (une ligne
// par navigation, pas de dédup — c'est voulu, ça sert à mesurer l'activité
// récente). Aucune IP ni user-agent stockés (RGPD-friendly par construction).

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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ua = String(req.headers['user-agent'] || '')
  if (!ua || BOT_UA.test(ua)) return res.status(200).json({ ok: true })

  // Beaucoup plus permissif que le rate-limit des fiches pro : ici une
  // même IP peut légitimement naviguer sur plusieurs pages par minute.
  const ip = getClientIp(req)
  if (isRateLimited(`ip:${ip}`, 120, 60 * 1000)) {
    return res.status(200).json({ ok: true })
  }

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  body = body || {}

  const sessionId = String(body.session_id || '').trim().slice(0, 64)
  const path = String(body.path || '').trim().slice(0, 300)
  if (!sessionId || !path) return res.status(400).json({ error: 'Paramètres invalides' })

  const row = {
    session_id: sessionId,
    path,
    referrer: String(body.referrer || '').trim().slice(0, 500) || null,
    utm_source: String(body.utm_source || '').trim().slice(0, 100) || null,
    utm_medium: String(body.utm_medium || '').trim().slice(0, 100) || null,
    utm_campaign: String(body.utm_campaign || '').trim().slice(0, 100) || null,
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(200).json({ ok: true })

  await fetch(`${SUPABASE_URL}/rest/v1/site_visits`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  }).catch(err => console.warn('[track/visit] insert failed', err))

  // Purge opportuniste (~1 appel sur 200) : pas de cron dédié, la table
  // ne sert qu'à une fenêtre glissante de 30j (canal) / 5min (en direct).
  if (Math.random() < 0.005) {
    const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    fetch(`${SUPABASE_URL}/rest/v1/site_visits?created_at=lt.${encodeURIComponent(cutoff)}`, {
      method: 'DELETE',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    }).catch(() => {})
  }

  return res.status(200).json({ ok: true })
}
