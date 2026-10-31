// Fonction unique des pros du site (31/10/2026). Avant : 6 fonctions
// (api/photographer/* et api/cleaner/*), sur les 12 permises par Vercel Hobby ;
// un 3e métier en aurait ajouté 3 et bloqué les déploiements. Les anciennes
// adresses (/api/photographer/signup…) restent, réécrites vers celle-ci dans
// vercel.json. Les traitements vivent dans scripts/api-pro/<métier>/<action>.cjs.
const HANDLERS = {
  photographer: {
    contact: require('../../../scripts/api-pro/photographer/contact.cjs'),
    signup: require('../../../scripts/api-pro/photographer/signup.cjs'),
    track: require('../../../scripts/api-pro/photographer/track.cjs'),
  },
  cleaner: {
    contact: require('../../../scripts/api-pro/cleaner/contact.cjs'),
    signup: require('../../../scripts/api-pro/cleaner/signup.cjs'),
    track: require('../../../scripts/api-pro/cleaner/track.cjs'),
  },
  depannage: {
    contact: require('../../../scripts/api-pro/depannage/contact.cjs'),
    signup: require('../../../scripts/api-pro/depannage/signup.cjs'),
    track: require('../../../scripts/api-pro/depannage/track.cjs'),
  },
}

module.exports = async function handler(req, res) {
  const kind = String(req.query.kind || '')
  const action = String(req.query.action || '')
  const fn = Object.prototype.hasOwnProperty.call(HANDLERS, kind) && Object.prototype.hasOwnProperty.call(HANDLERS[kind], action)
    ? HANDLERS[kind][action]
    : null
  if (!fn) return res.status(404).json({ error: 'Introuvable.' })
  return fn(req, res)
}
