// Vercel serverless function : formulaire de contact d'une fiche ménage.
// POST { slug, contactName, contactEmail, contactPhone?, message, website, t }

const { contactEmails, cleanPhone } = require('../../scripts/lib/pro-contact-email.cjs')

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

  if (body.website) return res.status(200).json({ ok: true })
  if (body.t && typeof body.t === 'number' && Date.now() - body.t < 1200) return res.status(200).json({ ok: true })

  const slug = String(body.slug || '').trim().slice(0, 100)
  const contactName = String(body.contactName || '').trim().slice(0, 100)
  const contactEmail = String(body.contactEmail || '').trim().toLowerCase().slice(0, 200)
  // Téléphone facultatif (26/10/2026) : ignoré s'il n'a pas 8 à 15 chiffres
  const contactPhone = cleanPhone(body.contactPhone)
  const message = String(body.message || '').trim().slice(0, 2000)

  if (!slug || !contactName || !contactEmail || !message) {
    return res.status(400).json({ error: 'Champs obligatoires manquants.' })
  }
  if (!contactEmail.includes('@') || !contactEmail.includes('.')) {
    return res.status(400).json({ error: 'Email invalide.' })
  }
  if (message.length < 20) {
    return res.status(400).json({ error: 'Ton message doit faire au moins 20 caractères pour être utile à l\'équipe.' })
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('[cleaner/contact] env vars Supabase manquantes')
    return res.status(500).json({ error: 'Service indisponible' })
  }

  const lookupUrl = `${SUPABASE_URL}/rest/v1/cleaners?slug=eq.${encodeURIComponent(slug)}&status=eq.active&is_public=eq.true&select=id,email,full_name,pseudo,ville&limit=1`
  const lookupRes = await fetch(lookupUrl, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  if (!lookupRes.ok) {
    console.error('[cleaner/contact] lookup failed', lookupRes.status)
    return res.status(500).json({ error: 'Service indisponible' })
  }
  const matches = await lookupRes.json()
  if (!Array.isArray(matches) || matches.length === 0) {
    return res.status(404).json({ error: 'Équipe introuvable.' })
  }
  const cleaner = matches[0]
  const displayName = cleaner.pseudo || cleaner.full_name
  const firstName = (cleaner.full_name || displayName).split(' ')[0]

  if (isRateLimited(`slug:${slug}`, 20, 60 * 60 * 1000)) {
    return res.status(200).json({ ok: true })
  }

  // Awaité : sur Vercel, la fonction est gelée dès que la réponse part
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/cleaner_contacts`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      cleaner_id: cleaner.id,
      contact_name: contactName,
      contact_email: contactEmail,
      ...(contactPhone ? { contact_phone: contactPhone } : {}),
      message,
      source_url: req.headers['referer'] || null,
    }),
  }).catch(err => { console.warn('[cleaner/contact] insert failed', err); return null })
  if (insertRes && !insertRes.ok) console.warn('[cleaner/contact] insert status', insertRes.status, await insertRes.text().catch(() => ''))

  await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_cleaner_contacts`, {
    method: 'POST',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_id: cleaner.id }),
  }).catch(() => {})

  const RESEND_KEY = process.env.RESEND_API_KEY
  if (RESEND_KEY) {
    const sendEmail = (payload, label) =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(async r => {
        if (!r.ok) console.error(`[cleaner/contact] resend ${label} failed`, r.status, await r.text().catch(() => ''))
      }).catch(err => console.error(`[cleaner/contact] resend ${label} error`, err))

    const mails = contactEmails({
      metier: 'menage', proPrenom: firstName, proNom: displayName, proVille: cleaner.ville || null, proSlug: slug,
      contactName, contactEmail, contactPhone, message,
    })
    // Awaités : sans await, la fonction est gelée après la réponse et Resend n'est jamais appelé
    await sendEmail({ from: 'Jason Marinho <notifications@jasonmarinho.com>', to: cleaner.email, reply_to: contactEmail, ...mails.pro }, 'pro')
    await sendEmail({ from: 'Jason Marinho <notifications@jasonmarinho.com>', to: contactEmail, ...mails.hote }, 'accuse-reception')
  }

  return res.status(200).json({ ok: true })
}
