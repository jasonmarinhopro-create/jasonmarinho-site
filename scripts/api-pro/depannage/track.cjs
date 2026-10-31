// Suivi des fiches dépannage publiques (31/10/2026), même règle que le ménage.
// POST { slug, event } avec event ∈ ('view', 'site', 'instagram')
// Détail des choix (beacon, filtres bots, limite, RPC attendu) : voir
// scripts/api-pro/photographer/track.cjs.

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

  const ip = getClientIp(req)
  if (isRateLimited(`ip:${ip}`, 60, 60 * 60 * 1000)) {
    return res.status(200).json({ ok: true })
  }

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  body = body || {}

  const slug = String(body.slug || '').trim().slice(0, 100)
  const event = String(body.event || '').trim()
  if (!slug || !['view', 'site', 'instagram'].includes(event)) {
    return res.status(400).json({ error: 'Paramètres invalides' })
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(200).json({ ok: true })

  const lookupRes = await fetch(
    `${SUPABASE_URL}/rest/v1/depannage_pros?slug=eq.${encodeURIComponent(slug)}&status=eq.active&is_public=eq.true&select=id&limit=1`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
  )
  if (!lookupRes.ok) return res.status(200).json({ ok: true })
  const matches = await lookupRes.json()
  if (!Array.isArray(matches) || matches.length === 0) return res.status(200).json({ ok: true })
  const proId = matches[0].id

  const rpc = event === 'view'
    ? { fn: 'increment_depannage_views', args: { p_id: proId } }
    : { fn: 'increment_depannage_click', args: { p_id: proId, p_kind: event } }
  await fetch(`${SUPABASE_URL}/rest/v1/rpc/${rpc.fn}`, {
    method: 'POST',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(rpc.args),
  }).catch(err => console.warn('[depannage/track] rpc failed', err))

  // Vues par jour (tendance « ce mois-ci » dans l'espace pro, migration
  // 20260927_110). Best-effort : sans la migration, l'appel échoue sans effet.
  if (event === 'view') {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_pro_fiche_view_daily`, {
      method: 'POST',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_kind: 'depannage', p_id: proId }),
    }).catch(err => console.warn('[depannage/track] daily rpc failed', err))
  }

  // Clics par jour (statistiques de la fiche sur une période, migration
  // 20261005_123). Best-effort : sans la migration, l'appel échoue sans effet.
  if (event !== 'view') {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_pro_fiche_click_daily`, {
      method: 'POST',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_kind: 'depannage', p_id: proId, p_event: event }),
    }).catch(err => console.warn('[depannage/track] clicks daily rpc failed', err))
  }

  return res.status(200).json({ ok: true })
}
