// Vercel serverless function — proxy to Brevo for newsletter signup.
// Keeps the API key server-side. The static site calls this endpoint from
// /index.html and all blog pages via same-origin fetch.

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
  return (
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    'unknown'
  )
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ip = getClientIp(req)
  if (isRateLimited(`ip:${ip}`, 5, 60_000)) {
    return res.status(429).json({ error: 'Trop de requêtes. Réessaye dans 1 minute.' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  body = body || {}

  const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!rawEmail || rawEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    return res.status(400).json({ error: 'Email invalide.' })
  }

  if (isRateLimited(`email:${rawEmail}`, 3, 15 * 60_000)) {
    return res.status(429).json({ error: 'Trop de tentatives. Réessaye plus tard.' })
  }

  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.error('[newsletter] BREVO_API_KEY missing')
    return res.status(500).json({ error: 'Service indisponible.' })
  }

  try {
    const r = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email: rawEmail,
        listIds: [2],
        updateEnabled: true,
      }),
    })

    if (r.ok || r.status === 204) {
      return res.status(200).json({ ok: true })
    }

    // Brevo returns 400 when contact already exists without updateEnabled,
    // but we pass updateEnabled:true so 400 here means a real validation error.
    const txt = await r.text().catch(() => '')
    console.warn('[newsletter] brevo error', r.status, txt.slice(0, 200))
    return res.status(r.status >= 500 ? 502 : 400).json({ error: 'Déjà inscrit ou erreur.' })
  } catch (e) {
    console.error('[newsletter] unexpected', String(e))
    return res.status(500).json({ error: 'Erreur réseau.' })
  }
}
