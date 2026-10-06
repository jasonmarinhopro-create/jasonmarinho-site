#!/usr/bin/env node
// Découverte de l'API partenaire de PartnerStack (programme Brevo de Jason)
// avant d'en lire les ventes dans l'admin. Lancé par
// .github/workflows/partnerstack-explore.yml avec le secret
// PARTNERSTACK_API_KEY. Les journaux GitHub sont PUBLICS : on n'affiche que
// les codes HTTP, la forme des réponses (noms de champs, nombre d'éléments)
// et des valeurs sans risque (statuts, devises, types). Jamais de montant,
// d'e-mail, de nom de client ni de clé.

const KEY = process.env.PARTNERSTACK_API_KEY
if (!KEY) {
  console.log('::notice title=PartnerStack::PARTNERSTACK_API_KEY absent : ajoute-le dans Settings > Secrets and variables > Actions.')
  process.exit(0)
}

const BASE = 'https://api.partnerstack.com/api/v2'
const ROUTES = ['/partnerships', '/rewards', '/customers', '/links', '/transactions', '/deals']
const SENSITIVE = /mail|phone|token|secret|password|iban|address|amount|price|total|revenue|value|payment|balance|first|last|name|url|link|ip|key$/i
const SAFE_VALUE = /^(status|state|type|currency|has_more|reward_type|source|trigger|object|live|test|message)$/

function shape(v, path = '', depth = 0, out = []) {
  if (depth > 4 || out.length > 70) return out
  if (Array.isArray(v)) {
    out.push(`${path || '(racine)'} : tableau de ${v.length}`)
    if (v.length) shape(v[0], path + '[0]', depth + 1, out)
  } else if (v && typeof v === 'object') {
    for (const [k, val] of Object.entries(v)) shape(val, path ? `${path}.${k}` : k, depth + 1, out)
  } else {
    const last = path.split('.').pop().replace(/\[\d+\]$/, '')
    const companyName = last === 'name' && /company|group|program/i.test(path)
    const show = (companyName || (SAFE_VALUE.test(last) && !SENSITIVE.test(last))) && String(v).length < 60 && !String(v).includes('@')
    out.push(`${path} : ${typeof v}${show ? ` = ${v}` : ''}`)
  }
  return out
}

for (const route of ROUTES) {
  try {
    const r = await fetch(`${BASE}${route}?limit=5`, { headers: { Authorization: `Bearer ${KEY}`, Accept: 'application/json' }, signal: AbortSignal.timeout(15000) })
    const text = await r.text()
    let json = null
    try { json = JSON.parse(text) } catch { /* pas du JSON */ }
    console.log(`\n--- ${route} -> HTTP ${r.status} (${text.length} octets)`)
    const lines = json ? shape(json) : []
    for (const line of lines) console.log('   ' + line)
    // Annotations : lisibles par l'API GitHub sans télécharger les journaux
    const esc = t => t.replace(/%/g, '%25').replace(/\r/g, '').replace(/\n/g, '%0A')
    console.log(`::notice title=${route} HTTP ${r.status}::${esc(lines.join('\n').slice(0, 3800) || '(vide)')}`)
  } catch (e) {
    console.log(`::notice title=${route} erreur::${String(e?.message ?? e).slice(0, 80)}`)
  }
  await new Promise(res => setTimeout(res, 800))
}
