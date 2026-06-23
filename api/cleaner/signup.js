// Vercel serverless function — inscription équipe ménage LCD.
// Insert row dans `cleaners` avec status='pending_validation'.
// Envoie email confirm + notif admin Jason.

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

const ALLOWED_PRESTATIONS = new Set([
  'menage_standard', 'gestion_linge', 'repassage', 'reapprovisionnement',
  'etat_des_lieux_photo', 'petite_maintenance', 'nettoyage_exterieur', 'gestion_dechets',
])
const ALLOWED_EQUIPE = new Set(['solo', 'duo', 'equipe_3_5', 'equipe_6_plus'])
const ALLOWED_DELAI = new Set(['jour_meme', '24h', '48h', '72h'])
const ALLOWED_LANGUES = new Set(['fr', 'en', 'es', 'it', 'de', 'pt', 'ar', 'zh'])

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

  if (body.website) return res.status(200).json({ ok: true })
  if (body.t && typeof body.t === 'number' && Date.now() - body.t < 3000) return res.status(200).json({ ok: true })

  const fullName = String(body.fullName || '').trim().slice(0, 100)
  const pseudo = String(body.pseudo || '').trim().slice(0, 100)
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200)
  const ville = String(body.ville || '').trim().slice(0, 80)
  const zoneCouverte = String(body.zoneCouverte || '').trim().slice(0, 200)
  const siteUrl = String(body.siteUrl || '').trim().slice(0, 300)
  const instagramHandle = String(body.instagramHandle || '').trim().slice(0, 50).replace(/^@/, '')
  const telephone = String(body.telephone || '').trim().slice(0, 30)
  const tarifForfaitMin = parseInt(body.tarifForfaitMin || '0', 10) || null
  const tarifForfaitMax = parseInt(body.tarifForfaitMax || '0', 10) || null
  const tarifHeure = parseInt(body.tarifHeure || '0', 10) || null
  const equipeType = String(body.equipeType || '').trim()
  const logementsGeres = parseInt(body.logementsGeres || '0', 10) || null
  const delaiReservation = String(body.delaiReservation || '').trim()
  const assuranceRcPro = body.assuranceRcPro === true || body.assuranceRcPro === 'true'
  const siret = String(body.siret || '').trim().replace(/\s+/g, '').slice(0, 14)
  const bio = String(body.bio || '').trim().slice(0, 600)

  const prestations = Array.isArray(body.prestations)
    ? body.prestations.filter(p => typeof p === 'string' && ALLOWED_PRESTATIONS.has(p)).slice(0, 12)
    : []
  const langues = Array.isArray(body.langues)
    ? body.langues.filter(l => typeof l === 'string' && ALLOWED_LANGUES.has(l)).slice(0, 8)
    : []

  if (!fullName || !email || !ville) {
    return res.status(400).json({ error: 'Champs obligatoires manquants : nom, email, ville.' })
  }
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Email invalide.' })
  }
  if (siteUrl && !/^https?:\/\//i.test(siteUrl)) {
    return res.status(400).json({ error: 'Le site web doit commencer par https://' })
  }
  if (equipeType && !ALLOWED_EQUIPE.has(equipeType)) {
    return res.status(400).json({ error: 'Type d\'équipe invalide.' })
  }
  if (delaiReservation && !ALLOWED_DELAI.has(delaiReservation)) {
    return res.status(400).json({ error: 'Délai de réservation invalide.' })
  }
  if (siret && !/^[0-9]{14}$/.test(siret)) {
    return res.status(400).json({ error: 'Le SIRET doit faire 14 chiffres (sans espaces).' })
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('[cleaner/signup] env vars Supabase manquantes')
    return res.status(500).json({ error: 'Service indisponible' })
  }

  // Check unicité email
  const checkUrl = `${SUPABASE_URL}/rest/v1/cleaners?email=eq.${encodeURIComponent(email)}&select=id,status&limit=1`
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
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/cleaners`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      email, full_name: fullName,
      pseudo: pseudo || null,
      ville,
      zone_couverte: zoneCouverte || null,
      site_url: siteUrl || null,
      instagram_handle: instagramHandle || null,
      telephone: telephone || null,
      tarif_forfait_min: tarifForfaitMin,
      tarif_forfait_max: tarifForfaitMax,
      tarif_heure: tarifHeure,
      prestations: prestations.length > 0 ? prestations : null,
      equipe_type: equipeType || null,
      logements_geres: logementsGeres,
      delai_reservation: delaiReservation || null,
      langues: langues.length > 0 ? langues : null,
      assurance_rc_pro: assuranceRcPro,
      siret: siret || null,
      bio: bio || null,
      status: 'pending_validation',
    }),
  })
  if (!insertRes.ok) {
    const txt = await insertRes.text()
    console.error('[cleaner/signup] INSERT failed', insertRes.status, txt)
    return res.status(500).json({ error: 'Erreur lors de l\'enregistrement de ta candidature.' })
  }

  // Emails (best-effort)
  const RESEND_KEY = process.env.RESEND_API_KEY
  const displayName = pseudo || fullName
  if (RESEND_KEY) {
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'notifications@jasonmarinho.com',
        to: email,
        subject: `${escHtml(displayName)}, candidature ménage LCD reçue 🧹`,
        html: `<div style="font-family:-apple-system,Segoe UI,Helvetica,sans-serif;max-width:560px;padding:24px;background:#f7f5f0;border-radius:12px">
<h2 style="font-family:Georgia,serif;color:#0F1A0D;margin:0 0 14px">Ta candidature est bien reçue</h2>
<p style="color:#3D5038;font-size:14px;line-height:1.7;margin:0 0 14px">Bonjour ${escHtml(fullName)},</p>
<p style="color:#3D5038;font-size:14px;line-height:1.7;margin:0 0 14px">Merci pour ta candidature à l'annuaire des équipes de ménage LCD de Jason Marinho. Nous étudions ton dossier et reviendrons vers toi rapidement.</p>
<div style="background:#fff;border-left:3px solid #63D683;padding:12px 14px;margin:14px 0;border-radius:6px;font-size:13px;line-height:1.7;color:#3D5038">
<strong>Délai de réponse :</strong> 48h ouvrées maximum.<br>
<strong>Prochaine étape :</strong> en cas de validation, tu recevras un email avec le lien Stripe pour finaliser ton abonnement annuel (${'<'}80€/an).
</div>
<p style="font-size:13px;color:#7A8C77;margin:18px 0 0">Pour toute question, réponds simplement à ce mail.</p>
</div>`,
      }),
    }).catch(() => {})

    const prestationsLabel = prestations.length > 0 ? prestations.join(', ') : '—'
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'notifications@jasonmarinho.com',
        to: 'contact@jasonmarinho.com',
        subject: `🧹 Nouvelle candidature ménage : ${displayName}`,
        html: `<div style="font-family:-apple-system,sans-serif;max-width:560px;padding:24px;background:#f7f5f0;border-radius:12px">
<h2 style="font-family:Georgia,serif;color:#0F1A0D;margin:0 0 14px">Nouvelle candidature ménage LCD</h2>
<div style="background:#fff;padding:14px;border-radius:8px;font-size:13px;line-height:1.7;color:#3D5038">
<strong>${escHtml(displayName)}</strong> ${pseudo ? `(${escHtml(fullName)})` : ''}<br>
${escHtml(email)} ${telephone ? ' · ' + escHtml(telephone) : ''}<br>
${escHtml(ville)}${zoneCouverte ? ' · ' + escHtml(zoneCouverte) : ''}<br>
${equipeType ? '<strong>Équipe :</strong> ' + escHtml(equipeType) + (logementsGeres ? ' · ' + logementsGeres + ' logements gérés' : '') + '<br>' : ''}
${tarifForfaitMin || tarifForfaitMax ? '<strong>Forfait turnover :</strong> ' + (tarifForfaitMin || '?') + '–' + (tarifForfaitMax || '?') + ' €<br>' : ''}
${tarifHeure ? '<strong>Horaire :</strong> ' + tarifHeure + ' €/h<br>' : ''}
${delaiReservation ? '<strong>Délai :</strong> ' + escHtml(delaiReservation) + '<br>' : ''}
<strong>Prestations :</strong> ${escHtml(prestationsLabel)}<br>
${siret ? '<strong>SIRET :</strong> ' + escHtml(siret) + '<br>' : ''}
${assuranceRcPro ? '<strong>RC pro :</strong> ✓<br>' : ''}
${siteUrl ? '<strong>Site :</strong> <a href="' + escHtml(siteUrl) + '">' + escHtml(siteUrl) + '</a><br>' : ''}
${instagramHandle ? '<strong>Insta :</strong> @' + escHtml(instagramHandle) + '<br>' : ''}
${bio ? '<br><em>« ' + escHtml(bio) + ' »</em>' : ''}
</div>
<p style="margin:18px 0 0"><a href="https://app.jasonmarinho.com/dashboard/admin/menage" style="display:inline-block;background:#FFD56B;color:#003329;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Examiner →</a></p>
</div>`,
      }),
    }).catch(() => {})
  }

  return res.status(200).json({ ok: true })
}
