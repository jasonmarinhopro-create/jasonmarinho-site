// Images de partage (og:image) : quelle image pour quelle page.
// Utilisé par scripts/build-images-partage.mjs (création, Playwright, à la main)
// et scripts/inject-images-partage.mjs (branchement, au build).
import fs from 'node:fs'
import path from 'node:path'

export const DOSSIER = 'img/partage'
export const ANCIENNE = 'couverture-jason.webp'

/** Clé d'image d'une page : chemin sans index.html, « / » remplacés par « -- ». */
export function cle(fichier) {
  const p = fichier.replace(/\\/g, '/').replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '')
  return p ? p.replace(/\//g, '--') : 'accueil'
}

/** Images de repli : pages créées au build (fiches des pros) ou sans image propre. */
export const FAMILLES = [
  { cle: 'fiche-photographe', rubrique: 'Annuaire · Photographes', titre: 'Photographe et vidéaste <em>location courte durée</em>', pied: 'Contact direct, sans commission' },
  { cle: 'fiche-menage', rubrique: 'Annuaire · Ménage', titre: 'Équipe de ménage <em>location courte durée</em>', pied: 'Contact direct, sans commission' },
  { cle: 'fiche-depannage', rubrique: 'Annuaire · Dépannage', titre: 'Dépannage et maintenance <em>location courte durée</em>', pied: 'Contact direct, sans commission' },
]

/** Image de repli d'une page qui n'a pas la sienne. */
export function repli(fichier) {
  const f = fichier.replace(/\\/g, '/')
  if (f.startsWith('annuaires/photographes/')) return 'fiche-photographe'
  if (f.startsWith('annuaires/menage/')) return 'fiche-menage'
  if (f.startsWith('annuaires/depannage/')) return 'fiche-depannage'
  return 'accueil'
}

// Pages qui avaient leur propre image avant les cartes (portrait, photo d'exemple)
const PHOTOS = {
  'qui-suis-je/index.html': 'jason-marinho.webp',
  'photographe-hotel/index.html': 'img/exemple-fiches/photo-salon-4.jpg',
}

const VILLE = /^(devenir-hote-airbnb|photographe-lcd|menage-lcd|depannage-lcd)-([a-z0-9-]+)\//

function rubrique(f) {
  if (f === 'index.html') return ['Annuaire des pros LCD', 'Gratuit pour les hôtes, sans commission']
  if (/^annuaires\/[^/]+\/inscription\//.test(f) || /^devenir-(photographe|prestataire)/.test(f)) return ['Pour les pros', 'Des demandes d’hôtes en direct']
  if (f.startsWith('annuaires/photographes')) return ['Annuaire · Photographes', 'Contact direct, sans commission']
  if (f.startsWith('annuaires/menage')) return ['Annuaire · Ménage', 'Contact direct, sans commission']
  if (f.startsWith('annuaires/depannage')) return ['Annuaire · Dépannage', 'Contact direct, sans commission']
  if (f.startsWith('annuaires')) return ['Annuaire des pros LCD', 'Contact direct, sans commission']
  if (f.startsWith('photographe-lcd-')) return ['Photographe LCD', 'Contact direct, sans commission']
  if (f.startsWith('menage-lcd-')) return ['Ménage LCD', 'Contact direct, sans commission']
  if (f.startsWith('depannage-lcd-')) return ['Dépannage LCD', 'Contact direct, sans commission']
  if (f.startsWith('devenir-hote-airbnb-')) return ['Guide de ville', 'Règles, taxe de séjour et saisons']
  if (f.startsWith('villes/')) return ['Guides par région', 'Règles, taxe de séjour et saisons']
  if (f.startsWith('trouver-un-pro')) return ['Trouver un pro', 'Gratuit pour les hôtes, sans commission']
  if (f.startsWith('services/simulateurs/revenus-lcd/')) return ['Simulateur de revenus', 'Combien rapporte ta location']
  if (f.startsWith('services/formations/')) return ['Formation', 'Formations pour hôtes LCD']
  if (f.startsWith('services/')) return ['Services', 'Pros, formations et outils pour la LCD']
  if (f.startsWith('partenaires')) return ['Partenaires', 'Outils et offres pour hôtes']
  if (f.startsWith('comparatif-')) return ['Comparatif', 'Outils pour hôtes LCD']
  if (/^(lodgify|hospitable|code-promo|tutoriel)/.test(f)) return ['Outils LCD', 'Mon avis et mes offres']
  if (f.startsWith('blog/categorie/') || f === 'blog/index.html') return ['Blog', 'Conseils pour hôtes LCD']
  if (f.startsWith('blog/')) return ['Article', 'Conseils pour hôtes LCD']
  if (f.startsWith('qui-suis-je')) return ['Qui suis-je', 'Co-fondateur de Driing']
  if (f.startsWith('photographe-hotel')) return ['Photographe pour hôtel', 'Contact direct, sans commission']
  if (f.startsWith('pour-qui')) return ['Pour qui', 'Pros, formations et outils pour la LCD']
  if (f.startsWith('sos-hote')) return ['SOS hôte', 'Le guide d’urgence des hôtes']
  if (f.startsWith('tarifs')) return ['Tarifs', 'Pros, formations et outils pour la LCD']
  if (f.startsWith('investir')) return ['Investir en LCD', 'Pros, formations et outils pour la LCD']
  return ['Location courte durée', 'Pros, formations et outils pour la LCD']
}

const HUBS = {
  'annuaires/photographes/index.html': 'Photographes et vidéastes <em>location courte durée</em>',
  'annuaires/menage/index.html': 'Équipes de ménage <em>location courte durée</em>',
  'annuaires/depannage/index.html': 'Pros du dépannage <em>location courte durée</em>',
}

function titre(f, h) {
  if (HUBS[f]) return HUBS[f]
  const m = h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
  let t = m ? m[1] : ''
  t = t.replace(/<br\s*\/?>/gi, ' ').replace(/<(?!\/?em\b)[^>]+>/gi, '').replace(/\s+/g, ' ').trim()
  t = t.replace(/^\d[\d\s]*\s(?=\D)/, '').replace(/[\s:,-]+$/, '')
  t = t.replace(/^(<em>)?([a-zà-ÿ])/, (_, e, c) => (e || '') + c.toUpperCase())
  const nu = t.replace(/<[^>]+>/g, '')
  if (!nu || nu.length > 110) {
    const og = (h.match(/<meta property="og:title" content="([^"]*)"/) || [])[1] || ''
    t = og.replace(/\s*\|\s*Jason Marinho\s*$/, '')
  }
  // Sans partie mise en valeur : ce qui suit « : » passe en jaune italique
  if (!/<em>/.test(t)) {
    const i = t.indexOf(' : ')
    if (i > 0 && t.length - i > 6) t = `${t.slice(0, i)} : <em>${t.slice(i + 3)}</em>`
  }
  return t
}

/** Toutes les pages indexables qui ont besoin d'une image de partage. */
export function pagesPartage(ROOT) {
  let covers = {}
  try { covers = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/blog-covers.json'), 'utf8')) } catch { /* aucune */ }
  const out = []
  const walk = d => {
    for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
      if (e.name.startsWith('.') || ['node_modules', 'jason-app', 'img', 'fonts', 'scripts', 'data', 'docs', 'api'].includes(e.name) && !d) continue
      const rel = d ? `${d}/${e.name}` : e.name
      if (e.isDirectory()) walk(rel)
      else if (e.name.endsWith('.html')) out.push(rel)
    }
  }
  walk('')
  return out.flatMap(f => {
    const h = fs.readFileSync(path.join(ROOT, f), 'utf8')
    if (/<meta name="robots" content="[^"]*noindex/.test(h)) return []
    if (!/<meta property="og:image"/.test(h)) return []
    // Photo à droite de la carte : couverture de l'article, photo de la ville,
    // ou image propre déjà choisie pour la page (portrait, photo d'exemple).
    const art = f.match(/^blog\/([^/]+)\/index\.html$/)
    const couv = art && covers[art[1]] && fs.existsSync(path.join(ROOT, 'img/blog', `${art[1]}.webp`)) ? `img/blog/${art[1]}.webp` : ''
    const propre = PHOTOS[f] && fs.existsSync(path.join(ROOT, PHOTOS[f])) ? PHOTOS[f] : ''
    const [rub, pied] = rubrique(f)
    const v = (f.match(VILLE) || [])[2] || (f.match(/^services\/simulateurs\/revenus-lcd\/([a-z0-9-]+)\//) || [])[1]
    const ville = v && fs.existsSync(path.join(ROOT, 'img/villes/large', `${v}.webp`)) ? `img/villes/large/${v}.webp` : ''
    const photo = couv || ville || propre
    return [{ fichier: f, cle: cle(f), rubrique: rub, pied, titre: titre(f, h), photo }]
  })
}
