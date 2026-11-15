// POST /api/analyse-annonce { lien } : lit la page publique d'une annonce
// Airbnb et rend les faits utiles à l'analyse (15/11/2026, demande de Jason).
// La note est calculée dans le navigateur par /analyse-annonce-regles.js.
// Aucune IA, aucun service tiers, rien n'est enregistré. Lecture et extraction
// dans scripts/api-analyse/lire-annonce.cjs (code partagé hors de api/ :
// 6 fonctions sur les 12 permises).
//
// - L'adresse lue est toujours reconstruite à partir de l'identifiant
//   (https://www.airbnb.fr/rooms/<id>) : jamais l'adresse envoyée par le
//   visiteur, donc aucune lecture vers un autre site.
// - Une lecture par annonce et par quart d'heure (mémoire de l'instance), 6
//   demandes par minute et par visiteur.
// - Airbnb sert une page allégée (sans photos ni équipements) à certains
//   logiciels : l'analyse est alors partielle (complet = false), jamais fausse.
const { idAnnonce, extraireAnnonce } = require('../scripts/api-analyse/lire-annonce.cjs')

const DELAI_MS = 12000
const TAILLE_MAX = 4 * 1024 * 1024
const GARDE_MS = 15 * 60 * 1000
// Identité d'un client HTTP en ligne de commande : c'est avec elle qu'Airbnb
// sert la page complète (mesuré le 15/11/2026). Pas d'imitation de navigateur.
const USER_AGENT = 'curl/8.5.0'

const cache = new Map()
const limites = new Map()
function tropDeDemandes(cle, max, fenetreMs) {
  const now = Date.now()
  const e = limites.get(cle)
  if (!e || now > e.fin) { limites.set(cle, { n: 1, fin: now + fenetreMs }); return false }
  if (e.n >= max) return true
  e.n++
  return false
}
function ipDe(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.headers['x-real-ip'] || 'inconnu'
}
const ROBOT = /bot|crawler|spider|crawling|preview|scan|monitor|lighthouse|headless|python|curl|wget/i

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Méthode non autorisée.' }) }
  const ua = String(req.headers['user-agent'] || '')
  if (!ua || ROBOT.test(ua)) return res.status(403).json({ error: 'Accès refusé.' })
  if (tropDeDemandes(ipDe(req), 6, 60 * 1000)) return res.status(429).json({ error: 'Trop de demandes. Réessaie dans une minute.' })

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  const id = idAnnonce(body && body.lien)
  if (!id) return res.status(400).json({ error: 'Ce lien n\'est pas celui d\'une annonce Airbnb. Il doit ressembler à https://www.airbnb.fr/rooms/123456.' })

  const garde = cache.get(id)
  if (garde && Date.now() - garde.t < GARDE_MS) return res.status(200).json(garde.data)

  try {
    const r = await fetch('https://www.airbnb.fr/rooms/' + id, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html', 'Accept-Language': 'fr-FR,fr;q=0.9' },
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(DELAI_MS),
    })
    if (r.status === 404 || r.status === 410) return res.status(404).json({ error: 'Annonce introuvable : vérifie qu\'elle est bien publiée.' })
    if (!r.ok) {
      console.warn('[analyse-annonce] lecture refusée', { status: r.status })
      return res.status(502).json({ error: 'Airbnb n\'a pas répondu. Réessaie dans quelques minutes.' })
    }
    const html = (await r.text()).slice(0, TAILLE_MAX)
    const a = extraireAnnonce(html)
    if (!a.lisible) {
      console.warn('[analyse-annonce] page illisible', { taille: html.length })
      return res.status(502).json({ error: 'La page de l\'annonce n\'a pas pu être lue. Réessaie dans quelques minutes.' })
    }
    const data = { lien: 'https://www.airbnb.fr/rooms/' + id, annonce: a }
    if (cache.size > 200) cache.clear()
    cache.set(id, { t: Date.now(), data })
    return res.status(200).json(data)
  } catch (err) {
    console.warn('[analyse-annonce] échec', { err: err && err.name })
    return res.status(502).json({ error: 'Airbnb n\'a pas répondu à temps. Réessaie dans quelques minutes.' })
  }
}
