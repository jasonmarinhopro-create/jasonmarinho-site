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
}
const villeLabel = slug => VILLE_LABELS[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1)

/**
 * Page de ville d'un pro : nom exact, ou nom suivi d'une précision
 * (« Lyon 6e », « Paris 15 », « Bordeaux et alentours »), la plus longue
 * correspondance gagne (06/10/2026 : avant, seul le nom exact comptait).
 * Même règle que citySlugOf (jason-app/lib/visibility/city-page.ts).
 */
export function villePageSlug(ville, villeSlugs) {
  const s = slugifyVille(String(ville || '').replace(/\bst\b\.?/gi, 'saint'))
  if (!s) return null
  const hits = villeSlugs.filter(c => s === c || s.startsWith(`${c}-`))
  return hits.sort((a, b) => b.length - a.length)[0] ?? null
}

/**
 * @param {object} opts
 * @param {string} opts.root       Racine du site statique
 * @param {string} opts.prefix     'photographe-lcd' | 'menage-lcd'
 * @param {string} opts.metier     Libellé affiché (ex: 'photographe LCD')
 * @param {Array<{ville: string, url: string, name: string, sub: string|null}>} opts.pros
 * @returns {number} nombre de pages ville enrichies
 */
export function injectProsIntoVillePages({ root, prefix, metier, pros }) {
  const villeSlugs = fs.readdirSync(root).filter(d => d.startsWith(`${prefix}-`)).map(d => d.slice(prefix.length + 1))
  const byVille = new Map()
  for (const p of pros) {
    const slug = villePageSlug(p.ville, villeSlugs)
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
    <h2 style="font-family:'Fraunces',serif;font-size:clamp(20px,2.6vw,26px);font-weight:400;color:#0F1A0D;margin:0 0 14px">${list.length > 1 ? `${list.length} ${escHtml(metier)}s disponibles` : `Un ${escHtml(metier)} disponible`} à ${escHtml(villeName)}</h2>
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
