// Vérification d'origine « same-site » pour les endpoints POST publics du site
// statique (newsletter, contact des pros). Objectif : empêcher qu'un autre site
// déclenche ces POST depuis le navigateur d'un visiteur (abus de quota Brevo /
// Resend, « list bombing »). Un POST de navigateur cross-site porte toujours un
// en-tête Origin ; les soumissions légitimes du site portent la sienne.
//
// Principe volontairement permissif pour ne casser aucun client : on refuse
// UNIQUEMENT quand une origine (ou, à défaut, un referer) est présente ET
// n'appartient pas au site. Absence totale d'Origin et de Referer => on laisse
// passer (un client non-navigateur peut de toute façon appeler l'API
// directement ; ce n'est pas le vecteur qu'on bloque ici).

const ALLOWED_HOSTS = new Set([
  'jasonmarinho.com',
  'www.jasonmarinho.com',
  'app.jasonmarinho.com',
])

function hostnameOf(value) {
  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return null
  }
}

function isAllowedHostname(host) {
  if (!host) return false
  const h = host.toLowerCase()
  if (ALLOWED_HOSTS.has(h)) return true
  if (h.endsWith('.vercel.app')) return true // déploiements de preview Vercel
  if (h === 'localhost' || h === '127.0.0.1') return true // dev local
  return false
}

function sameOriginOk(req) {
  const origin = req.headers && req.headers['origin']
  if (origin) return isAllowedHostname(hostnameOf(origin))
  const referer = req.headers && (req.headers['referer'] || req.headers['referrer'])
  if (referer) return isAllowedHostname(hostnameOf(referer))
  return true
}

module.exports = { sameOriginOk, isAllowedHostname }
