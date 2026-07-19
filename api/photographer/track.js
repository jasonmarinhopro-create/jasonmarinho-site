// Vercel serverless function : tracking des fiches photographes publiques.
// POST { slug, event } avec event ∈ ('view', 'portfolio', 'instagram')
//
// Appelé en navigator.sendBeacon depuis les fiches statiques :
//  - 'view' au chargement (dédupliqué par session côté client)
//  - 'portfolio' / 'instagram' au clic sur les boutons sortants
//
// Filtres anti-bruit : UA bots exclus, rate-limit IP. Compteurs via RPC
// SECURITY DEFINER (service role uniquement).

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

  // Les crawlers n'exécutent en général pas le beacon, mais on filtre
  // quand même ceux qui le feraient (comptage honnête pour le pro).
  const ua = String(req.headers['user-agent'] || '')
  if (!ua || BOT_UA.test(ua)) return res.status(200).json({ ok: true })

  const ip = getClientIp(req)
  if (isRateLimited(`ip:${ip}`, 60, 60 * 60 * 1000)) {
    return res.status(200).json({ ok: true })
  }

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  body = body || {}

  const slug = String(body.slug || '').trim().slice(0, 100)
  const event = String(body.event || '').trim()
  if (!slug || !['view', 'portfolio', 'instagram'].includes(event)) {
    return res.status(400).json({ error: 'Paramètres invalides' })
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(200).json({ ok: true })

  // Lookup fiche active par slug
  const lookupRes = await fetch(
    `${SUPABASE_URL}/rest/v1/photographers?slug=eq.${encodeURIComponent(slug)}&status=eq.active&is_public=eq.true&select=id&limit=1`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
  )
  if (!lookupRes.ok) return res.status(200).json({ ok: true })
  const matches = await lookupRes.json()
  if (!Array.isArray(matches) || matches.length === 0) return res.status(200).json({ ok: true })
  const photographerId = matches[0].id

  // Increment : AWAITÉ (lambda Vercel gelée dès la réponse envoyée)
  const rpc = event === 'view'
    ? { fn: 'increment_photographer_views', args: { p_id: photographerId } }
    : { fn: 'increment_photographer_click', args: { p_id: photographerId, p_kind: event } }
  await fetch(`${SUPABASE_URL}/rest/v1/rpc/${rpc.fn}`, {
    method: 'POST',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(rpc.args),
  }).catch(err => console.warn('[photographer/track] rpc failed', err))

  return res.status(200).json({ ok: true })
}
