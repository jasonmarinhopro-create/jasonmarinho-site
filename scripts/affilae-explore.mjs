#!/usr/bin/env node
// Découverte de l'API Affilae (éditeur) avant de brancher l'admin dessus.
// Lancé par .github/workflows/affilae-explore.yml avec le secret
// AFFILAE_API_KEY. Les journaux GitHub sont PUBLICS : on n'affiche que les
// codes HTTP, la forme des réponses (noms de champs, nombre d'éléments) et
// des identifiants non sensibles (profils, programmes). Jamais de montant,
// d'e-mail ni de jeton.

const KEY = process.env.AFFILAE_API_KEY
if (!KEY) {
  console.log('AFFILAE_API_KEY absent : ajoute-le dans Settings > Secrets and variables > Actions.')
  process.exit(0)
}

const BASES = ['https://rest.affilae.com', 'https://api.affilae.com/3.0', 'https://api.affilae.com']
const ROUTES = [
  '/publisher/publishers.me',
  '/publisher/profiles.list',
  '/publisher/partnerships.list',
  '/publisher/commissions.list',
  '/publisher/conversions.list',
  '/publisher/programs.list',
]
const SENSITIVE = /mail|phone|token|secret|password|iban|bic|address|amount|commission|price|revenue|value|payment|balance|siret|vat|name$/i
const SAFE_VALUE = /^(id|_id|profileId|programId|partnershipId|status|state|type|currency|trackingId|affiliateTrackingId|ae|slug|program\.name|name|message|error|source|statusCode|advertiser|program|urlType|requestOrigin|total|count)$/

function shape(v, path = '', depth = 0, out = []) {
  if (depth > 4 || out.length > 80) return out
  if (Array.isArray(v)) {
    out.push(`${path || '(racine)'} : tableau de ${v.length}`)
    if (v.length) shape(v[0], path + '[0]', depth + 1, out)
  } else if (v && typeof v === 'object') {
    for (const [k, val] of Object.entries(v)) shape(val, path ? `${path}.${k}` : k, depth + 1, out)
  } else {
    const last = path.split('.').pop().replace(/\[\d+\]$/, '')
    const isValidationKey = /validation\.keys/.test(path)
    const programName = last === 'name' && /program|advertiser|brand|campaign/i.test(path)
    const show = (isValidationKey || programName || (SAFE_VALUE.test(last) && !SENSITIVE.test(last))) && String(v).length < 120
    out.push(`${path} : ${typeof v}${show ? ` = ${v}` : ''}`)
  }
  return out
}

async function tryRoute(url, header) {
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json', ...header }, signal: AbortSignal.timeout(15000) })
    const text = await r.text()
    let json = null
    try { json = JSON.parse(text) } catch { /* pas du JSON */ }
    return { status: r.status, json, len: text.length }
  } catch (e) {
    return { status: 0, error: String(e?.message ?? e).slice(0, 80) }
  }
}

const HEADERS = [
  ['Bearer', { Authorization: `Bearer ${KEY}` }],
  ['Authorization brut', { Authorization: KEY }],
  ['X-Api-Key', { 'X-Api-Key': KEY }],
]

let found = null
outer:
for (const base of BASES) {
  for (const [label, header] of HEADERS) {
    const res = await tryRoute(base + ROUTES[0], header)
    console.log(`${base}${ROUTES[0]} [${label}] -> ${res.status}${res.error ? ' ' + res.error : ''}`)
    if (res.status === 200 && res.json) { found = { base, header, label }; break outer }
  }
}

if (!found) {
  console.log('Aucune combinaison ne répond 200 sur publishers.me : on essaie les autres routes avec Bearer.')
  found = { base: BASES[0], header: HEADERS[0][1], label: 'Bearer' }
}

console.log(`\n=== Base retenue : ${found.base} (${found.label}) ===`)
for (const route of ROUTES) {
  const res = await tryRoute(found.base + route, found.header)
  console.log(`\n--- ${route} -> HTTP ${res.status}${res.error ? ' ' + res.error : ''} (${res.len ?? 0} octets)`)
  if (res.json) for (const line of shape(res.json)) console.log('   ' + line)
}

// ── 2e passage : conversions, commissions, noms des programmes ──
const H = found.header
const B = found.base
const me = await tryRoute(B + '/publisher/publishers.me', H)
const profileId = me.json?.affiliateProfiles?.data?.[0]?.id
const parts = (await tryRoute(B + '/publisher/partnerships.list', H)).json?.partnerships?.data ?? []
console.log(`\n=== Partenariats (${parts.length}) ===`)
for (const p of parts) {
  console.log(`   id=${p.id} statut=${p.status} trackingId=${p.trackingId} advertiser=${p.advertiser} clés=${Object.keys(p).join(',')}`)
}
const extra = [
  `/publisher/conversions.list?profile=${profileId}`,
  `/publisher/conversions.list?affiliateProfile=${profileId}`,
  `/publisher/conversions.list?partnership=${parts[0]?.id}`,
  `/publisher/conversions.list?profile.id=${profileId}`,
  '/publisher/commissions',
  '/publisher/rewards.list',
  '/publisher/payments.list',
  '/publisher/invoices.list',
  '/publisher/clicks.list',
  '/publisher/stats',
  '/publisher/advertisers.list',
  ...parts.map(p => `/publisher/advertisers.get?id=${p.advertiser}`),
  ...parts.map(p => `/publisher/partnerships.get?id=${p.id}`),
]
for (const route of extra) {
  const res = await tryRoute(B + route, H)
  console.log(`\n--- ${route.replace(profileId ?? '§', '<profil>')} -> HTTP ${res.status} (${res.len ?? 0} octets)`)
  if (res.json) for (const line of shape(res.json).slice(0, 45)) console.log('   ' + line)
}
