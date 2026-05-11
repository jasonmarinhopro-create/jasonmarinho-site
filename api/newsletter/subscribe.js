// Vercel serverless function, proxy to Brevo for newsletter signup.
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

// Domaines email jetables les plus courants. Liste compacte (pas exhaustive
// mais couvre 95% des bots) — pas de dépendance externe.
const DISPOSABLE_DOMAINS = new Set([
  'yopmail.com','yopmail.fr','yopmail.net',
  'mailinator.com','mailinator.net','mailinator.org',
  'tempmail.com','temp-mail.org','temp-mail.io','temp-mail.fr',
  '10minutemail.com','10minutemail.net','10minutemail.org',
  'guerrillamail.com','guerrillamail.net','guerrillamail.biz','guerrillamail.org',
  'sharklasers.com','grr.la','spam4.me','pokemail.net',
  'maildrop.cc','throwawaymail.com','dispostable.com','fakeinbox.com',
  'trashmail.com','trashmail.net','trashmail.de','trash-mail.com',
  'getnada.com','nada.email','inboxbear.com','tempinbox.com',
  'mintemail.com','spamgourmet.com','mytemp.email','jetable.org',
  'minuteinbox.com','emailondeck.com','mohmal.com','etranquil.com',
  'mailcatch.com','spambog.com','spambox.us','spamfree.com',
  'discardmail.com','discardmail.de','mailnesia.com','meltmail.com',
  'tempr.email','tmail.io','tmail.run','tmail.us','tmail.ws',
  'wegwerfemail.com','wegwerfemail.de','wegwerfmail.de','wegwerfmail.net',
  'mvrht.net','asdf.pl','mt2014.com','mt2015.com','mailbox52.ga',
  'guerillamail.com','vomoto.com','tagyourself.com','byom.de',
  'mailtothis.com','dropmail.me','emailfake.com','tempmailo.com',
])

function isDisposableEmail(email) {
  const at = email.lastIndexOf('@')
  if (at === -1) return false
  const domain = email.slice(at + 1).toLowerCase()
  return DISPOSABLE_DOMAINS.has(domain)
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

  // ─── Anti-bot : honeypot + time-trap + domaines jetables ─────────────────
  // On répond 200 OK fake aux bots pour ne pas leur indiquer la détection
  // (sinon ils itèrent jusqu'à passer). Le contact n'est juste pas créé.

  // 1. Honeypot : champ caché qu'un humain ne remplit JAMAIS.
  if (body.website && typeof body.website === 'string' && body.website.trim().length > 0) {
    console.warn('[newsletter] bot detected · honeypot filled', { ip, email: body.email })
    return res.status(200).json({ ok: true })
  }

  // 2. Time-trap : un humain met >1.5s à remplir et soumettre. Bot souvent <500ms.
  const ts = typeof body.ts === 'number' ? body.ts : 0
  if (ts > 0) {
    const elapsed = Date.now() - ts
    if (elapsed < 1500) {
      console.warn('[newsletter] bot detected · too fast', { ip, elapsed })
      return res.status(200).json({ ok: true })
    }
    // Form ouvert depuis > 24h → token sans doute volé / replayed
    if (elapsed > 24 * 60 * 60_000) {
      return res.status(400).json({ error: 'Formulaire expiré, recharge la page.' })
    }
  }

  const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!rawEmail || rawEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    return res.status(400).json({ error: 'Email invalide.' })
  }

  // 3. Domaine jetable → fake success silencieux.
  if (isDisposableEmail(rawEmail)) {
    console.warn('[newsletter] bot detected · disposable email', { ip, email: rawEmail })
    return res.status(200).json({ ok: true })
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
        listIds: [3],
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
