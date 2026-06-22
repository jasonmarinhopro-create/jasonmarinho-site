// Vercel serverless function — formulaire de contact d'une fiche photographe.
// POST { slug, contactName, contactEmail, message, website, t }
// Lookup du photographe via slug, log dans `photographer_contacts`,
// email au photographe + accusé de réception au demandeur.

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
  if (isRateLimited(`ip:${ip}`, 5, 15 * 60 * 1000)) {
    return res.status(200).json({ ok: true })
  }

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  body = body || {}

  // Anti-bot honeypot + time-trap
  if (body.website) return res.status(200).json({ ok: true })
  if (body.t && typeof body.t === 'number' && Date.now() - body.t < 3000) return res.status(200).json({ ok: true })

  const slug = String(body.slug || '').trim().slice(0, 100)
  const contactName = String(body.contactName || '').trim().slice(0, 100)
  const contactEmail = String(body.contactEmail || '').trim().toLowerCase().slice(0, 200)
  const message = String(body.message || '').trim().slice(0, 2000)

  if (!slug || !contactName || !contactEmail || !message) {
    return res.status(400).json({ error: 'Champs obligatoires manquants.' })
  }
  if (!contactEmail.includes('@') || !contactEmail.includes('.')) {
    return res.status(400).json({ error: 'Email invalide.' })
  }
  if (message.length < 20) {
    return res.status(400).json({ error: 'Ton message doit faire au moins 20 caractères pour être utile au photographe.' })
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('[photographer/contact] env vars Supabase manquantes')
    return res.status(500).json({ error: 'Service indisponible' })
  }

  // Lookup photographe par slug (uniquement actifs/publics)
  const lookupUrl = `${SUPABASE_URL}/rest/v1/photographers?slug=eq.${encodeURIComponent(slug)}&status=eq.active&is_public=eq.true&select=id,email,full_name,pseudo,ville&limit=1`
  const lookupRes = await fetch(lookupUrl, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  if (!lookupRes.ok) {
    console.error('[photographer/contact] lookup failed', lookupRes.status)
    return res.status(500).json({ error: 'Service indisponible' })
  }
  const matches = await lookupRes.json()
  if (!Array.isArray(matches) || matches.length === 0) {
    return res.status(404).json({ error: 'Photographe introuvable.' })
  }
  const photographer = matches[0]
  const displayName = photographer.pseudo || photographer.full_name
  const firstName = displayName.split(' ')[0]

  // Rate-limit aussi par slug pour éviter le spam ciblé sur un photographe
  if (isRateLimited(`slug:${slug}`, 20, 60 * 60 * 1000)) {
    return res.status(200).json({ ok: true })
  }

  // Log dans photographer_contacts (best-effort)
  fetch(`${SUPABASE_URL}/rest/v1/photographer_contacts`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      photographer_id: photographer.id,
      contact_name: contactName,
      contact_email: contactEmail,
      message,
      source_url: req.headers['referer'] || null,
    }),
  }).catch(err => console.warn('[photographer/contact] log insert failed', err))

  // Increment compteur contacts (best-effort, non bloquant)
  fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_photographer_contacts`, {
    method: 'POST',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_id: photographer.id }),
  }).catch(() => {})

  // Emails
  const RESEND_KEY = process.env.RESEND_API_KEY
  if (RESEND_KEY) {
    // Au photographe (le vrai destinataire)
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'notifications@jasonmarinho.com',
        to: photographer.email,
        reply_to: contactEmail,
        subject: `📸 Nouvelle demande de ${escHtml(contactName)} via l'annuaire`,
        html: `<div style="font-family:-apple-system,Segoe UI,Helvetica,sans-serif;max-width:560px;padding:24px;background:#f7f5f0;border-radius:12px">
<h2 style="font-family:Georgia,serif;color:#0F1A0D;margin:0 0 14px">Un hôte LCD souhaite te contacter</h2>
<p style="color:#3D5038;font-size:14px;line-height:1.7;margin:0 0 14px">Bonjour ${escHtml(firstName)},</p>
<p style="color:#3D5038;font-size:14px;line-height:1.7;margin:0 0 14px">Tu reçois cette demande via ta fiche sur l'annuaire des photographes LCD de Jason Marinho.</p>
<div style="background:#fff;padding:16px;border-radius:8px;font-size:13.5px;line-height:1.7;color:#3D5038;border-left:3px solid #63D683">
<strong>${escHtml(contactName)}</strong><br>
<a href="mailto:${escHtml(contactEmail)}" style="color:#004C3F">${escHtml(contactEmail)}</a>
</div>
<div style="background:#fff;padding:16px;border-radius:8px;font-size:14px;line-height:1.75;color:#3D5038;margin-top:12px;white-space:pre-wrap">${escHtml(message)}</div>
<p style="margin:18px 0 0"><a href="mailto:${escHtml(contactEmail)}" style="display:inline-block;background:#FFD56B;color:#003329;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Répondre par email →</a></p>
<p style="font-size:12px;color:#7A8C77;margin:22px 0 0;line-height:1.6">Tu peux répondre directement à cet email — ton réponse arrivera dans la boîte de ${escHtml(contactName)}. Aucune commission, aucun intermédiaire : tu négocies et factures directement.</p>
</div>`,
      }),
    }).catch(() => {})

    // Au demandeur (accusé de réception)
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'notifications@jasonmarinho.com',
        to: contactEmail,
        subject: `Ta demande à ${escHtml(displayName)} est partie 📸`,
        html: `<div style="font-family:-apple-system,Segoe UI,Helvetica,sans-serif;max-width:560px;padding:24px;background:#f7f5f0;border-radius:12px">
<h2 style="font-family:Georgia,serif;color:#0F1A0D;margin:0 0 14px">Ta demande a bien été transmise</h2>
<p style="color:#3D5038;font-size:14px;line-height:1.7;margin:0 0 14px">Bonjour ${escHtml(contactName)},</p>
<p style="color:#3D5038;font-size:14px;line-height:1.7;margin:0 0 14px">Ta demande de prestation photo a été transmise à <strong>${escHtml(displayName)}</strong> (${escHtml(photographer.ville)}). Réponse généralement sous 48h directement par email.</p>
<div style="background:#fff;padding:14px 16px;border-radius:8px;font-size:13.5px;line-height:1.75;color:#3D5038;margin:14px 0;white-space:pre-wrap;border-left:3px solid #63D683">${escHtml(message)}</div>
<p style="font-size:13px;color:#7A8C77;margin:18px 0 0;line-height:1.7">Rappel : Jason Marinho ne prend aucune commission. Le devis, le contrat et le paiement se font directement entre toi et le photographe.</p>
</div>`,
      }),
    }).catch(() => {})
  }

  return res.status(200).json({ ok: true })
}
