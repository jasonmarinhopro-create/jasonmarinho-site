// Vercel serverless function : formulaire de contact d'une fiche photographe.
// POST { slug, contactName, contactEmail, contactPhone?, message, website, t }
// Lookup du photographe via slug, log dans `photographer_contacts`,
// email au photographe + accusé de réception au demandeur.

const { contactEmails, cleanPhone } = require('../../lib/pro-contact-email.cjs')

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

  // Log dans la table contacts : AWAITÉ : sur Vercel, la lambda est
  // gelée dès que la réponse part, un fetch non-attendu n'aboutit jamais.
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/photographer_contacts`, {
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
      ...(contactPhone ? { contact_phone: contactPhone } : {}),
      message,
      source_url: req.headers['referer'] || null,
    }),
  }).catch(err => { console.warn('[photographer/contact] insert failed', err); return null })
  if (insertRes && !insertRes.ok) console.warn('[photographer/contact] insert status', insertRes.status, await insertRes.text().catch(() => ''))

  // Increment compteur contacts (awaité : même contrainte lambda)
  await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_photographer_contacts`, {
    method: 'POST',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_id: photographer.id }),
  }).catch(() => {})

  // Emails : AWAITÉS via Promise.allSettled : sans await, la lambda
  // Vercel gèle après res.json() et Resend n'est jamais appelé
  // (cause du "j'ai testé et rien reçu").
  const RESEND_KEY = process.env.RESEND_API_KEY
  if (RESEND_KEY) {
    const sendEmail = (payload, label) =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(async r => {
        if (!r.ok) console.error(`[photographer/contact] resend ${label} failed`, r.status, await r.text().catch(() => ''))
      }).catch(err => console.error(`[photographer/contact] resend ${label} error`, err))

    const mails = contactEmails({
      metier: 'photographe', proPrenom: firstName, proNom: displayName, proVille: photographer.ville || null, proSlug: slug,
      contactName, contactEmail, contactPhone, message,
    })
    // Awaités : sans await, la fonction est gelée après la réponse et Resend n'est jamais appelé
    await sendEmail({ from: 'Jason Marinho <notifications@jasonmarinho.com>', to: photographer.email, reply_to: contactEmail, ...mails.pro }, 'pro')
    await sendEmail({ from: 'Jason Marinho <notifications@jasonmarinho.com>', to: contactEmail, ...mails.hote }, 'accuse-reception')
  }

  return res.status(200).json({ ok: true })
}
