// Vercel serverless function — inscription photographe LCD.
// Insert row dans `photographers` avec status='pending_validation'.
// Envoie email confirm photographe + notif admin Jason.

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
function escHtml(s) {
  if (s == null) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ip = getClientIp(req)
  if (isRateLimited(`ip:${ip}`, 3, 15 * 60 * 1000)) {
    return res.status(200).json({ ok: true })
  }

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  body = body || {}

  // Anti-bot honeypot + time-trap
  if (body.website) return res.status(200).json({ ok: true })
  if (body.t && typeof body.t === 'number' && Date.now() - body.t < 3000) return res.status(200).json({ ok: true })

  const fullName = String(body.fullName || '').trim().slice(0, 100)
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200)
  const ville = String(body.ville || '').trim().slice(0, 80)
  const zoneCouverte = String(body.zoneCouverte || '').trim().slice(0, 200)
  const portfolioUrl = String(body.portfolioUrl || '').trim().slice(0, 300)
  const instagramHandle = String(body.instagramHandle || '').trim().slice(0, 50).replace(/^@/, '')
  const telephone = String(body.telephone || '').trim().slice(0, 30)
  const specialite = String(body.specialite || '').trim().slice(0, 100)
  const tarifMin = parseInt(body.tarifMin || '0', 10) || null
  const tarifMax = parseInt(body.tarifMax || '0', 10) || null
  const bio = String(body.bio || '').trim().slice(0, 600)

  if (!fullName || !email || !ville || !portfolioUrl) {
    return res.status(400).json({ error: 'Champs obligatoires manquants : nom, email, ville, portfolio.' })
  }
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Email invalide.' })
  }
  if (!/^https?:\/\//i.test(portfolioUrl)) {
    return res.status(400).json({ error: 'Le portfolio doit être une URL valide commençant par https://' })
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('[photographer/signup] env vars Supabase manquantes')
    return res.status(500).json({ error: 'Service indisponible' })
  }

  // Check unicité email (évite doublons)
  const checkUrl = `${SUPABASE_URL}/rest/v1/photographers?email=eq.${encodeURIComponent(email)}&select=id,status&limit=1`
  const checkRes = await fetch(checkUrl, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  if (checkRes.ok) {
    const existing = await checkRes.json()
    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(409).json({ error: 'Une candidature avec cet email existe déjà. Contacte Jason si besoin.' })
    }
  }

  // Insert
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/photographers`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      email, full_name: fullName, ville,
      zone_couverte: zoneCouverte || null,
      portfolio_url: portfolioUrl,
      instagram_handle: instagramHandle || null,
      telephone: telephone || null,
      specialite: specialite || null,
      tarif_min: tarifMin, tarif_max: tarifMax,
      bio: bio || null,
      status: 'pending_validation',
    }),
  })
  if (!insertRes.ok) {
    const txt = await insertRes.text()
    console.error('[photographer/signup] INSERT failed', insertRes.status, txt)
    return res.status(500).json({ error: 'Erreur lors de l\'enregistrement de ta candidature.' })
  }

  // Emails (best-effort)
  const RESEND_KEY = process.env.RESEND_API_KEY
  if (RESEND_KEY) {
    // Au photographe
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'notifications@jasonmarinho.com',
        to: email,
        subject: `${fullName}, candidature reçue 📸`,
        html: `<div style="font-family:-apple-system,Segoe UI,Helvetica,sans-serif;max-width:560px;padding:24px;background:#f7f5f0;border-radius:12px">
<h2 style="font-family:Georgia,serif;color:#0F1A0D;margin:0 0 14px">Ta candidature est bien reçue</h2>
<p style="color:#3D5038;font-size:14px;line-height:1.7;margin:0 0 14px">Bonjour ${escHtml(fullName)},</p>
<p style="color:#3D5038;font-size:14px;line-height:1.7;margin:0 0 14px">Merci pour ta candidature à l'annuaire des photographes LCD de Jason Marinho. Nous avons bien reçu tes infos et examinons ton portfolio.</p>
<div style="background:#fff;border-left:3px solid #63D683;padding:12px 14px;margin:14px 0;border-radius:6px;font-size:13px;line-height:1.7;color:#3D5038">
<strong>Délai de réponse :</strong> 48h ouvrées maximum.<br>
<strong>Prochaine étape :</strong> en cas de validation, tu recevras un email avec le lien Stripe pour finaliser ton abonnement annuel (${'<'}80€/an).
</div>
<p style="font-size:13px;color:#7A8C77;margin:18px 0 0">Pour toute question, réponds simplement à ce mail.</p>
</div>`,
      }),
    }).catch(() => {})

    // À Jason
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'notifications@jasonmarinho.com',
        to: 'contact@jasonmarinho.com',
        subject: `📸 Nouvelle candidature photographe : ${fullName}`,
        html: `<div style="font-family:-apple-system,sans-serif;max-width:560px;padding:24px;background:#f7f5f0;border-radius:12px">
<h2 style="font-family:Georgia,serif;color:#0F1A0D;margin:0 0 14px">Nouvelle candidature photographe LCD</h2>
<div style="background:#fff;padding:14px;border-radius:8px;font-size:13px;line-height:1.7;color:#3D5038">
<strong>${escHtml(fullName)}</strong><br>
${escHtml(email)} ${telephone ? ' · ' + escHtml(telephone) : ''}<br>
${escHtml(ville)}${zoneCouverte ? ' · ' + escHtml(zoneCouverte) : ''}<br>
${specialite ? '<strong>Spé :</strong> ' + escHtml(specialite) + '<br>' : ''}
${tarifMin || tarifMax ? '<strong>Tarif :</strong> ' + (tarifMin || '?') + '–' + (tarifMax || '?') + ' €<br>' : ''}
<strong>Portfolio :</strong> <a href="${escHtml(portfolioUrl)}">${escHtml(portfolioUrl)}</a>${instagramHandle ? ' · @' + escHtml(instagramHandle) : ''}<br>
${bio ? '<br><em>« ' + escHtml(bio) + ' »</em>' : ''}
</div>
<p style="margin:18px 0 0"><a href="https://app.jasonmarinho.com/dashboard/admin/photographes" style="display:inline-block;background:#FFD56B;color:#003329;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Examiner →</a></p>
</div>`,
      }),
    }).catch(() => {})
  }

  return res.status(200).json({ ok: true })
}
