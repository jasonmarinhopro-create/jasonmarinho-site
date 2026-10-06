// Injecte les fiches pros ACTIVES dans les pages ville SEO correspondantes
// (/photographe-lcd-{ville}, /menage-lcd-{ville}). Idempotent : le bloc est
// délimité par des marqueurs et remplacé à chaque build. Utilisé par
// build-photographers.mjs et build-cleaners.mjs (vercel buildCommand).

import fs from 'node:fs'
import path from 'node:path'

const START = '<!-- annuaire-live:start -->'
const END = '<!-- annuaire-live:end -->'

function escHtml(s) {
  if (s == null) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// Même normalisation que les slugs de CITIES (footer.js) : minuscules,
// accents retirés, séparateurs → tirets.
function slugifyVille(v) {
  return String(v || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Noms affichés des villes dont le slug ne suffit pas (même liste que
// cityLabel de jason-app/lib/visibility/city-page.ts)
const VILLE_LABELS = {
  'aix-en-provence': 'Aix-en-Provence', 'clermont-ferrand': 'Clermont-Ferrand', 'la-baule': 'La Baule', 'la-rochelle': 'La Rochelle',
  'le-mans': 'Le Mans', 'le-touquet': 'Le Touquet', 'saint-malo': 'Saint-Malo', 'saint-tropez': 'Saint-Tropez',
  chambery: 'Chambéry', epernay: 'Épernay', etretat: 'Étretat', megeve: 'Megève', nimes: 'Nîmes', sete: 'Sète',
  'les-sables-d-olonne': "Les Sables-d'Olonne",
}
// « à Lyon », « au Mans », « aux Sables-d'Olonne »
const aVille = v => /^Les\s/.test(v) ? `aux ${v.slice(4)}` : /^Le\s/.test(v) ? `au ${v.slice(3)}` : `à ${v}`
export const villeLabel = slug => VILLE_LABELS[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1)

// Autres noms d'une ville qui a sa page (même liste que CITY_ALIASES de
// jason-app/lib/visibility/city-page.ts)
const VILLE_ALIASES = {
  'sables-d-olonne': 'les-sables-d-olonne',
  'olonne-sur-mer': 'les-sables-d-olonne',
  'chateau-d-olonne': 'les-sables-d-olonne',
  vendee: 'les-sables-d-olonne',
}

function bestMatch(s, names) {
  const longest = xs => xs.sort((a, b) => b.length - a.length)[0] ?? null
  return longest(names.filter(c => s === c || s.startsWith(`${c}-`)))
    ?? longest(names.filter(c => s.includes(`-${c}-`) || s.endsWith(`-${c}`)))
}

function slugOfText(text, villeSlugs) {
  const s = slugifyVille(String(text || '').replace(/\bst\b\.?/gi, 'saint'))
  if (!s) return null
  const direct = bestMatch(s, villeSlugs)
  if (direct) return direct
  const alias = bestMatch(s, Object.keys(VILLE_ALIASES).filter(a => villeSlugs.includes(VILLE_ALIASES[a])))
  return alias ? VILLE_ALIASES[alias] : null
}

/**
 * Page de ville d'un pro : nom exact, nom suivi d'une précision (« Lyon 6e »,
 * « Paris 15 »), nom cité dans le texte (« 75015 Paris ») ou autre nom connu
 * (« Vendée », « Sables d'Olonne ») ; la plus longue correspondance gagne.
 * Sans résultat, la zone couverte est essayée. Même règle que citySlugOf
 * (jason-app/lib/visibility/city-page.ts).
 */
export function villePageSlug(ville, villeSlugs, zone) {
  return slugOfText(ville, villeSlugs) ?? slugOfText(zone, villeSlugs)
}

/** Page de ville (/{prefix}-{slug}) d'un pro, si elle existe : { href, label } */
export function villeGuide(root, prefix, ville, zone) {
  const villeSlugs = fs.readdirSync(root).filter(d => d.startsWith(`${prefix}-`)).map(d => d.slice(prefix.length + 1))
  const slug = villePageSlug(ville, villeSlugs, zone)
  return slug ? { href: `/${prefix}-${slug}`, label: villeLabel(slug) } : null
}

/**
 * @param {object} opts
 * @param {string} opts.root       Racine du site statique
 * @param {string} opts.prefix     'photographe-lcd' | 'menage-lcd'
 * @param {string} opts.metier     Libellé affiché (ex: 'photographe LCD')
 * @param {Array<{ville: string, zone?: string|null, url: string, name: string, sub: string|null}>} opts.pros
 * @returns {number} nombre de pages ville enrichies
 */
export function injectProsIntoVillePages({ root, prefix, metier, pros }) {
  const villeSlugs = fs.readdirSync(root).filter(d => d.startsWith(`${prefix}-`)).map(d => d.slice(prefix.length + 1))
  const byVille = new Map()
  for (const p of pros) {
    const slug = villePageSlug(p.ville, villeSlugs, p.zone)
    if (!slug) continue
    if (!byVille.has(slug)) byVille.set(slug, [])
    byVille.get(slug).push(p)
  }

  let injected = 0
  for (const [villeSlug, list] of byVille) {
    const file = path.join(root, `${prefix}-${villeSlug}`, 'index.html')
    if (!fs.existsSync(file)) continue

    const villeName = villeLabel(villeSlug)
    const cards = list.map(p => `
      <a href="${escHtml(p.url)}" style="display:flex;flex-direction:column;gap:4px;padding:16px 18px;background:#fff;border:1px solid rgba(0,76,63,.12);border-radius:12px;text-decoration:none;min-width:220px;flex:1">
        <span style="font-family:'Fraunces',serif;font-size:16px;color:#0F1A0D">${escHtml(p.name)}</span>
        ${p.sub ? `<span style="font-size:12.5px;color:#3D5038">${escHtml(p.sub)}</span>` : ''}
        <span style="font-size:12.5px;font-weight:600;color:#004C3F;margin-top:4px">Voir la fiche →</span>
      </a>`).join('')

    const block = `${START}
<section style="background:rgba(99,214,131,.08);border-top:1px solid rgba(0,76,63,.08);border-bottom:1px solid rgba(0,76,63,.08);padding:34px 0">
  <div style="max-width:1100px;margin:0 auto;padding:0 clamp(16px,5vw,40px)">
    <span style="display:inline-block;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#1e9d54;margin-bottom:10px">✓ Vérifié annuaire</span>
    <h2 style="font-family:'Fraunces',serif;font-size:clamp(20px,2.6vw,26px);font-weight:400;color:#0F1A0D;margin:0 0 14px">${list.length > 1 ? `${list.length} ${escHtml(metier)}s disponibles` : `Un ${escHtml(metier)} disponible`} ${escHtml(aVille(villeName))}</h2>
    <div style="display:flex;flex-wrap:wrap;gap:12px">${cards}</div>
  </div>
</section>
${END}`

    let html = fs.readFileSync(file, 'utf8')
    if (html.includes(START)) {
      html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block)
    } else if (html.includes('</header>')) {
      html = html.replace('</header>', `</header>\n${block}`)
    } else {
      continue
    }
    fs.writeFileSync(file, html, 'utf8')
    injected++
  }
  return injected
}
