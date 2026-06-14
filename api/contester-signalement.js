// Vercel serverless function : reçoit les demandes de retrait d'un
// signalement public anonymisé. Validation + rate-limit + appel Supabase
// + notification Jason via Resend. Le retrait effectif est manuel
// (décision admin) — cet endpoint enregistre seulement la demande.

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

function escHtml(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ip = getClientIp(req)
  // Rate limit : max 3 demandes / IP / 15 min (anti-flood)
  if (isRateLimited(`ip:${ip}`, 3, 15 * 60 * 1000)) {
    return res.status(200).json({ ok: true })  // ne révèle pas la détection
  }

  // Parsing tolérant : Vercel parse JSON par défaut, sinon on lit le body
  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  body = body || {}

  // Honeypot anti-bot : champ caché qui doit rester vide
  if (body.website) {
    return res.status(200).json({ ok: true })
  }

  // Time-trap : formulaire soumis en moins de 3 secondes = bot probable
  if (body.t && typeof body.t === 'number' && Date.now() - body.t < 3000) {
    return res.status(200).json({ ok: true })
  }

  const slug = String(body.slug || '').trim().slice(0, 200)
  const fullName = String(body.fullName || '').trim().slice(0, 200)
  const email = String(body.email || '').trim().slice(0, 200).toLowerCase()
  const reason = String(body.reason || '').trim().slice(0, 1000)

  if (!slug || !fullName || !email) {
    return res.status(400).json({ error: 'Champs manquants' })
  }
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Email invalide' })
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('[contester-signalement] env vars Supabase manquantes')
    return res.status(500).json({ error: 'Service indisponible' })
  }

  // Vérifie que le signalement existe et récupère son ID
  const findUrl = `${SUPABASE_URL}/rest/v1/reported_guests?select=id,public_slug,public_summary,public_city&public_slug=eq.${encodeURIComponent(slug)}&moderation_status=eq.approved&limit=1`
  const findRes = await fetch(findUrl, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  const found = findRes.ok ? await findRes.json() : []
  if (!found.length) {
    return res.status(404).json({ error: 'Signalement introuvable ou déjà retiré' })
  }
  const report = found[0]

  // Met à jour la demande de retrait sur le row
  const updUrl = `${SUPABASE_URL}/rest/v1/reported_guests?id=eq.${report.id}`
  const updRes = await fetch(updUrl, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      removal_request_at: new Date().toISOString(),
      removal_request_email: email,
      removal_request_reason: `Nom déclaré: ${fullName} | Motif: ${reason}`.slice(0, 1000),
    }),
  })
  if (!updRes.ok) {
    const txt = await updRes.text()
    console.error('[contester-signalement] PATCH failed', updRes.status, txt)
    return res.status(500).json({ error: 'Échec de l\'enregistrement' })
  }

  // Notification Jason via Resend (best-effort)
  const RESEND_KEY = process.env.RESEND_API_KEY
  if (RESEND_KEY) {
    const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;padding:24px;background:#f7f5f0;border-radius:12px">
<h2 style="font-family:Georgia,serif;color:#0F1A0D;margin:0 0 12px">Demande de retrait d'un signalement public</h2>
<p style="color:#3D5038;margin:0 0 14px;font-size:14px">Une personne demande le retrait d'un signalement publié sur jasonmarinho.com. Délai légal de réponse : 48h.</p>
<div style="background:#fff;border-left:3px solid #F97583;padding:12px 14px;margin:14px 0;border-radius:6px;font-size:13px;line-height:1.7">
<div><strong>Slug public :</strong> ${escHtml(slug)}</div>
<div><strong>Nom déclaré :</strong> ${escHtml(fullName)}</div>
<div><strong>Email de contact :</strong> ${escHtml(email)}</div>
<div style="margin-top:8px"><strong>Motif :</strong><br>${escHtml(reason) || '<em>(non renseigné)</em>'}</div>
</div>
<div style="background:#fff;padding:12px;border-radius:6px;margin:14px 0;font-size:12.5px;color:#3D5038">
<strong>Résumé public concerné :</strong><br>${escHtml(report.public_summary || '')}<br>
<em>Ville :</em> ${escHtml(report.public_city || '—')}
</div>
<a href="https://app.jasonmarinho.com/dashboard/admin/qg" style="display:inline-block;background:#FFD56B;color:#003329;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Examiner et décider</a>
<p style="font-size:12px;color:#7A8C77;margin:18px 0 0">Vérifie l'identité du demandeur (preuve ID si nécessaire) avant retrait. En cas de doute juridique, retire par défaut.</p>
</div>`

    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'notifications@jasonmarinho.com',
        to: 'contact@jasonmarinho.com',
        subject: `⚠️ Demande de retrait signalement public · ${slug}`,
        html,
      }),
    }).catch(() => {})
  }

  return res.status(200).json({ ok: true })
}
