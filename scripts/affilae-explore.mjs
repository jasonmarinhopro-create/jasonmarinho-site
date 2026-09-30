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
const SENSITIVE = /mail|phone|token|secret|password|iban|bic|address|amount|commission|price|total|count|revenue|value|payment|balance|siret|vat|name$/i
const SAFE_VALUE = /^(id|_id|profileId|programId|partnershipId|status|state|type|currency|trackingId|affiliateTrackingId|ae|slug|program\.name|name|message|error|source|statusCode|advertiser|program|urlType|requestOrigin)$/

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
for (const route of ROUTES.slice(0, 1)) {
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
  `/publisher/conversions.list?affiliateProfile=${profileId}`,
  `/publisher/payments.list?affiliateProfile=${profileId}`,
  ...parts.map(p => `/publisher/programs.list?id=${p.program}`),
  ...parts.map(p => `/publisher/programs.get?id=${p.program}`),
]
// Clé « stats » du partenariat actif : noms des champs seulement
for (const p of parts) if (p.stats) console.log(`   stats(${p.status}) : ${shape(p.stats).join(' | ').slice(0, 600)}`)
// Paramètre ae du lien cliqué (numéro d'affilié, public dans tous les liens)
const clicks = (await tryRoute(B + '/publisher/clicks.list', H)).json?.clicks?.data ?? []
for (const c of clicks) {
  try { const u = new URL(c.landingPage); console.log(`   clic : ${u.hostname}${u.pathname} ae=${u.searchParams.get('ae')} utm_source=${u.searchParams.get('utm_source')} partenariat=${c.partnershipName}`) } catch { console.log('   clic : landingPage illisible') }
}
for (const route of extra) {
  await new Promise(r => setTimeout(r, 1500)) // limite de débit d'Affilae
  const res = await tryRoute(B + route, H)
  console.log(`\n--- ${route.replace(profileId ?? '§', '<profil>')} -> HTTP ${res.status} (${res.len ?? 0} octets)`)
  if (res.json) for (const line of shape(res.json).slice(0, 45)) console.log('   ' + line)
}
