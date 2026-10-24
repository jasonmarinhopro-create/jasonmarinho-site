// Inscription des pros depuis le site, tout en une fois (24/10/2026, Jason :
// « une personne peut déjà tout remplir en une fois et tout apparaît »).
// Partagé par api/photographer/signup.js et api/cleaner/signup.js (hors de api/ :
// pas une fonction Vercel de plus). Testé par jason-app/lib/pros/signup-extras.test.ts.
//
// Photos : envoyées une par une par le formulaire APRÈS la création de la fiche
// (action « photo »), avec une signature remise par l'inscription. Mêmes règles
// que l'app (jason-app/lib/pros/fiche-vitrine.ts, à garder identiques) : 6
// photos au plus, grande image 450 Ko et vignette 120 Ko au plus, en JPEG, et
// garde-fou de place de l'offre gratuite de Supabase (storage_usage).

const crypto = require('node:crypto')

const PHOTOS_MAX = 6
const PHOTO_FULL_MAX_BYTES = 450000
const PHOTO_THUMB_MAX_BYTES = 120000
const STORAGE_STOP_TOTAL_BYTES = 750 * 1024 ** 2
const PORTFOLIO_STOP_BYTES = 350 * 1024 ** 2
const PORTFOLIO_BUCKET = 'pro-portfolio'
const FORMULES_MAX = 3
const VILLES_MAX = 10
/** Une fiche accepte des photos de l'inscription pendant 3 h */
const PHOTO_WINDOW_MS = 3 * 3600 * 1000

const txt = (v, max) => (typeof v === 'string' ? v : '').replace(/\s+/g, ' ').trim().slice(0, max)

/** Même règle que cleanFormules (fiche-vitrine.ts) */
function cleanFormules(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue
    const nom = txt(r.nom, 40)
    const detail = txt(r.detail, 160)
    const n = typeof r.prix === 'number' ? r.prix : Number(String(r.prix == null ? '' : r.prix).replace(',', '.').replace(/[^\d.]/g, ''))
    const prix = Number.isFinite(n) && n > 0 ? Math.min(Math.round(n), 100000) : null
    if (!nom) continue
    out.push({ nom, prix, detail })
    if (out.length >= FORMULES_MAX) break
  }
  return out
}

/** Même règle que cleanVilles (fiche-vitrine.ts), sans la ville principale */
function cleanVilles(raw, principale) {
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/[,;\n]/) : []
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const seen = new Set(principale ? [norm(txt(principale, 40))] : [])
  const out = []
  for (const v of list) {
    const name = txt(v, 40)
    const key = norm(name)
    if (!name || seen.has(key)) continue
    seen.add(key)
    out.push(name)
    if (out.length >= VILLES_MAX) break
  }
  return out
}

/** Signature remise à l'inscription : seule elle permet d'ajouter des photos à la fiche */
function photoSig(ficheId, userId, secret) {
  return crypto.createHmac('sha256', String(secret)).update(`photos:${ficheId}:${userId}`).digest('hex')
}
function sigOk(sig, ficheId, userId, secret) {
  const want = photoSig(ficheId, userId, secret)
  return typeof sig === 'string' && sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))
}

/** Même règle que storageDecision (fiche-vitrine.ts) */
function storageOk(rows, incoming) {
  if (!Array.isArray(rows)) return false
  const total = rows.reduce((s, r) => s + Number(r.bytes || 0), 0)
  const portfolio = rows.filter(r => r.bucket_id === PORTFOLIO_BUCKET).reduce((s, r) => s + Number(r.bytes || 0), 0)
  return total + incoming <= STORAGE_STOP_TOTAL_BYTES && portfolio + incoming <= PORTFOLIO_STOP_BYTES
}

/** Image JPEG en base64 (data URL acceptée), dans la taille permise ; sinon null */
function decodeJpeg(b64, maxBytes) {
  if (typeof b64 !== 'string') return null
  const raw = b64.replace(/^data:image\/jpeg;base64,/, '')
  if (!/^[A-Za-z0-9+/=]+$/.test(raw) || raw.length > Math.ceil(maxBytes / 3) * 4 + 4) return null
  const buf = Buffer.from(raw, 'base64')
  if (buf.length < 100 || buf.length > maxBytes) return null
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null
  return buf
}

/**
 * Action « photo » des deux routes d'inscription : ajoute une photo à une fiche
 * qui vient d'être créée (en attente de paiement, depuis moins de 3 h).
 * Retourne { status, body } à renvoyer tel quel.
 */
async function handlePhoto({ table, body, supabaseUrl, serviceKey }) {
  const ficheId = String(body.ficheId || '')
  if (!/^[0-9a-f-]{36}$/i.test(ficheId)) return { status: 400, body: { error: 'Fiche introuvable.' } }
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
  const r = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${ficheId}&select=id,user_id,status,created_at,portfolio_photos`, { headers: h })
  const rows = r.ok ? await r.json() : []
  const fiche = Array.isArray(rows) ? rows[0] : null
  if (!fiche || !sigOk(body.sig, ficheId, fiche.user_id, serviceKey)) return { status: 403, body: { error: 'Envoi refusé.' } }
  if (fiche.status !== 'pending_payment' || Date.now() - Date.parse(fiche.created_at) > PHOTO_WINDOW_MS) {
    return { status: 409, body: { error: 'Ajoute tes photos depuis ton espace, dans Ma fiche.' } }
  }
  const current = Array.isArray(fiche.portfolio_photos) ? fiche.portfolio_photos : []
  if (current.length >= PHOTOS_MAX) return { status: 409, body: { error: `${PHOTOS_MAX} photos au plus.` } }

  const full = decodeJpeg(body.full, PHOTO_FULL_MAX_BYTES)
  const thumb = decodeJpeg(body.thumb, PHOTO_THUMB_MAX_BYTES)
  if (!full || !thumb) return { status: 400, body: { error: 'Photo trop lourde ou illisible.' } }

  const usage = await fetch(`${supabaseUrl}/rest/v1/rpc/storage_usage`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: '{}' })
  const usageRows = usage.ok ? await usage.json().catch(() => null) : null
  if (!storageOk(usageRows, full.length + thumb.length)) {
    return { status: 507, body: { error: 'Envoi de photos indisponible pour le moment : tu pourras les ajouter depuis ton espace.' } }
  }

  const path = `${ficheId}/v2-${crypto.randomUUID()}.jpg`
  const put = (p, buf) => fetch(`${supabaseUrl}/storage/v1/object/${PORTFOLIO_BUCKET}/${p}`, {
    method: 'POST',
    headers: { ...h, 'Content-Type': 'image/jpeg', 'cache-control': 'max-age=31536000', 'x-upsert': 'false' },
    body: buf,
  })
  const [a, b] = await Promise.all([put(path, full), put(path.replace(/\.jpg$/, '-t.jpg'), thumb)])
  if (!a.ok || !b.ok) return { status: 502, body: { error: 'Une photo n’a pas pu être envoyée.' } }

  const photos = [...current, path].slice(0, PHOTOS_MAX)
  const up = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${ficheId}`, {
    method: 'PATCH',
    headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ portfolio_photos: photos, updated_at: new Date().toISOString() }),
  })
  if (!up.ok) return { status: 500, body: { error: 'Enregistrement impossible.' } }
  return { status: 200, body: { ok: true, count: photos.length } }
}

/** Retour du paiement : connexion directe à Ma fiche dans l'app (app/apres-paiement) */
function successUrl(pro) {
  return `https://app.jasonmarinho.com/apres-paiement?pro=${pro}&session_id={CHECKOUT_SESSION_ID}`
}

/** Nom de compte Instagram, même quand le pro colle le lien entier (24/10/2026) */
function instaHandle(raw) {
  const s = String(raw == null ? '' : raw).trim()
  const m = s.match(/instagram\.com\/([\w.]{1,30})/i)
  const h = (m ? m[1] : s).replace(/^@/, '').replace(/[/?#].*$/, '')
  return /^[\w.]{1,30}$/.test(h) ? h : ''
}

module.exports = {
  PHOTOS_MAX, PHOTO_FULL_MAX_BYTES, PHOTO_THUMB_MAX_BYTES, STORAGE_STOP_TOTAL_BYTES, PORTFOLIO_STOP_BYTES,
  PORTFOLIO_BUCKET, FORMULES_MAX, VILLES_MAX,
  cleanFormules, cleanVilles, photoSig, sigOk, storageOk, decodeJpeg, handlePhoto, successUrl, instaHandle,
}
