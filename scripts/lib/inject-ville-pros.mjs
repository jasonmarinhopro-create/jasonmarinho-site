// Injecte les fiches pros ACTIVES dans les pages ville SEO correspondantes
// (/photographe-lcd-{ville}, /menage-lcd-{ville}). Idempotent : le bloc est
// délimité par des marqueurs et remplacé à chaque build. Utilisé par
// build-photographers.mjs et build-cleaners.mjs (vercel buildCommand).

import fs from 'node:fs'
import path from 'node:path'
import { VILLES as VILLES_REGISTRE } from '../data/registre-geo.mjs'

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

// Noms affichés des villes : registre géographique unique (09/11/2026,
// scripts/data/registre-geo.mjs), comme cityLabel de l'app
const VILLE_LABELS = Object.fromEntries(VILLES_REGISTRE.map(v => [v.slug, v.nom]))
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
  riorges: 'roanne',
  mably: 'roanne',
  'le-coteau': 'roanne',
  roannais: 'roanne',
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

/** Zone courte d'une carte de pro : « Paris et 30 km autour », la zone si elle est courte, sinon la ville */
export function zoneCarte(ville, zf) {
  if (!zf) return ville || ''
  if (/km$/.test(zf.v)) return `${ville} et ${zf.v} autour`
  return zf.l === 'zone couverte' ? zf.v : (ville || zf.v)
}

/** Page de ville (/{prefix}-{slug}) d'un pro, si elle existe : { href, label } */
export function villeGuide(root, prefix, ville, zone) {
  const villeSlugs = fs.readdirSync(root).filter(d => d.startsWith(`${prefix}-`)).map(d => d.slice(prefix.length + 1))
  const slug = villePageSlug(ville, villeSlugs, zone)
  return slug ? { href: `/${prefix}-${slug}`, label: villeLabel(slug) } : null
}

// Textes et liens par annuaire (cartes « Décrire mon besoin » et « Créer ma fiche »)
const PAGE_CFG = {
  'photographe-lcd': { metier: 'photographe', icon: 'ph-camera', qui: 'photographes', un: 'un photographe', viennent: 'Les photographes viennent à toi.', decris: 'Décris ton logement en une minute', tuEs: 'Tu es photographe ?', rejoindre: '/devenir-photographe-lcd' },
  'menage-lcd': { metier: 'menage', icon: 'ph-sparkle', qui: 'équipes de ménage', un: 'une équipe de ménage', viennent: 'Les équipes de ménage viennent à toi.', decris: 'Décris ton logement en une minute', tuEs: 'Tu fais du ménage LCD ?', rejoindre: '/devenir-prestataire-menage-lcd' },
  'depannage-lcd': { metier: 'depannage', icon: 'ph-wrench', qui: 'pros du dépannage', un: 'un pro du dépannage', viennent: 'Les pros viennent à toi.', decris: 'Décris ta panne ou tes travaux en une minute', tuEs: 'Tu es artisan ?', rejoindre: '/annuaires/depannage/inscription' },
}

/**
 * @param {object} opts
 * @param {string} opts.root       Racine du site statique
 * @param {string} opts.prefix     'photographe-lcd' | 'menage-lcd'
 * @param {string} opts.metier     Libellé affiché (ex: 'photographe LCD')
 * @param {Array<{ville: string, zone?: string|null, villes?: string[], url: string, name: string, sub?: string|null, photo?: string|null, logo?: string|null, initials?: string, prix?: string|null, unite?: string, tags?: string[]}>} opts.pros
 * @returns {number} nombre de pages ville enrichies
 */
export function injectProsIntoVillePages({ root, prefix, metier, pluriel = `${metier}s`, pros }) {
  const villeSlugs = fs.readdirSync(root).filter(d => d.startsWith(`${prefix}-`)).map(d => d.slice(prefix.length + 1))
  const byVille = new Map()
  for (const p of pros) {
    // Ville principale, puis chaque ville couverte qui a sa page (09/11/2026,
    // Jason : une équipe présente dans 8 villes doit être sur chacune)
    const slugs = new Set()
    const main = villePageSlug(p.ville, villeSlugs, p.zone)
    if (main) slugs.add(main)
    for (const v of Array.isArray(p.villes) ? p.villes : []) {
      const s = villePageSlug(v, villeSlugs)
      if (s) slugs.add(s)
    }
    for (const slug of slugs) {
      if (!byVille.has(slug)) byVille.set(slug, [])
      byVille.get(slug).push(p)
    }
  }

  let injected = 0
  for (const [villeSlug, list] of byVille) {
    const file = path.join(root, `${prefix}-${villeSlug}`, 'index.html')
    if (!fs.existsSync(file)) continue

    const villeName = villeLabel(villeSlug)
    const cfg = PAGE_CFG[prefix] ?? PAGE_CFG['photographe-lcd']
    const demande = `/trouver-un-pro?metier=${cfg.metier}&amp;ville=${encodeURIComponent(villeName)}`
    const cards = list.map(p => {
      const ini = String(p.initials || p.name || '?').slice(0, 2).toUpperCase()
      const av = p.logo
        ? `<span class="vp-av" style="background-image:url('${escHtml(p.logo)}');color:transparent">${escHtml(ini)}</span>`
        : `<span class="vp-av">${escHtml(ini)}</span>`
      const tags = (p.tags || []).filter(Boolean).slice(0, 3)
      return `
      <a class="vp-card" href="${escHtml(p.url)}">
        <span class="vp-ph${p.photo ? '' : ' empty'}"${p.photo ? ` style="background-image:url('${escHtml(p.photo)}')"` : ''}>${p.photo ? '' : `<i class="ph-bold ${cfg.icon}"></i>`}</span>
        ${av}
        <span class="vp-b">
          <span class="vp-n">${escHtml(p.name)}</span>
          <span class="vp-z"><i class="ph-bold ph-map-pin"></i>${escHtml(p.zone || p.ville || villeName)}</span>
          ${tags.length ? `<span class="vp-tags">${tags.map(t => `<span>${escHtml(t)}</span>`).join('')}</span>` : ''}
          <span class="vp-f">${p.prix ? `<b>${escHtml(p.prix)}${p.unite ? `<small>${escHtml(p.unite)}</small>` : ''}</b>` : '<b class="devis">Sur devis</b>'}<span>Voir la fiche <i class="ph-bold ph-arrow-right"></i></span></span>
        </span>
      </a>`
    }).join('')

    // 17/11/2026 (maquette 2 validée par Jason) : cartes modernes (photo,
    // logo, zone, spécialités, prix de départ) + carte « Décrire mon besoin »
    // à côté des pros + carte pour les pros de la ville.
    const block = `${START}
<section class="vp" id="annuaire-ville">
  <style>.vp{background:#EFF5EE;border-top:1px solid rgba(0,76,63,.08);border-bottom:1px solid rgba(0,76,63,.08);padding:clamp(34px,5vw,52px) 0}.vp-in{max-width:1100px;margin:0 auto;padding:0 clamp(16px,5vw,40px)}.vp-k{display:inline-block;font-size:11.5px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#004C3F}.vp h2{font-family:'Fraunces','Fraunces Fallback',serif;font-size:clamp(24px,3.2vw,36px);font-weight:400;color:#0F1A0D;margin:8px 0 6px;line-height:1.15}.vp h2 em{color:#004C3F;font-weight:300}.vp-lead{margin:0;font-size:15px;line-height:1.55;color:#3D5038;max-width:620px}.vp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-top:22px}.vp-card{background:#fff;border:1px solid rgba(0,76,63,.12);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;text-decoration:none;color:#0F1A0D;transition:transform .15s,box-shadow .15s}.vp-card:hover{transform:translateY(-2px);box-shadow:0 14px 34px rgba(0,26,17,.1)}.vp-ph{display:block;height:170px;background:#DCE6DF center/cover no-repeat}.vp-ph.empty{display:grid;place-items:center;color:#7d9a8c;font-size:34px}.vp-av{width:54px;height:54px;border-radius:50%;border:3px solid #fff;background:#004C3F center/cover no-repeat;color:#FFD56B;display:grid;place-items:center;font-family:'Fraunces','Fraunces Fallback',serif;font-size:18px;margin:-30px 0 0 16px;position:relative;box-shadow:0 4px 12px rgba(0,0,0,.15)}.vp-b{padding:8px 18px 18px;display:flex;flex-direction:column;gap:8px;flex:1}.vp-n{font-family:'Fraunces','Fraunces Fallback',serif;font-size:20px;line-height:1.2}.vp-z{font-size:13px;color:#5A6B57;display:flex;gap:5px;align-items:center}.vp-z i{color:#004C3F}.vp-tags{display:flex;flex-wrap:wrap;gap:6px}.vp-tags span{font-size:12px;padding:4px 9px;border-radius:99px;background:#F7F8F4;border:1px solid #E3E8E0;color:#3D5038}.vp-f{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:12px;border-top:1px solid #E3E8E0}.vp-f b{font-family:'Fraunces','Fraunces Fallback',serif;font-weight:400;font-size:19px;color:#004C3F}.vp-f b small{font:500 12px 'Outfit','Outfit Fallback',sans-serif;color:#5A6B57;margin-left:4px}.vp-f>span{font-size:13.5px;font-weight:600;color:#004C3F;display:inline-flex;gap:6px;align-items:center;white-space:nowrap}.vp-ask{border-radius:18px;padding:24px;background:linear-gradient(155deg,#002a21,#004C3F 65%);color:#fff;display:flex;flex-direction:column;gap:12px}.vp-ask .k{font-size:11.5px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:#FFD56B}.vp-ask h3{margin:0;font-family:'Fraunces','Fraunces Fallback',serif;font-weight:400;font-size:22px;line-height:1.2;color:#fff}.vp-ask h3 em{color:#FFD56B;font-weight:300}.vp-ask p{margin:0;font-size:14px;line-height:1.55;color:rgba(255,255,255,.78)}.vp-pts{display:flex;flex-direction:column;gap:7px;font-size:13.5px;color:rgba(255,255,255,.85)}.vp-pts span{display:flex;gap:8px;align-items:center}.vp-pts i{color:#FFD56B}.vp-cta{margin-top:auto;display:flex;align-items:center;justify-content:center;gap:9px;min-height:50px;border-radius:13px;background:#FFD56B;color:#003329;font-weight:700;font-size:15px;text-decoration:none}.vp-join{border-radius:18px;padding:24px;background:#fff;border:1px dashed rgba(0,76,63,.3);display:flex;flex-direction:column;gap:10px}.vp-join .k{font-size:11.5px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:#004C3F}.vp-join h3{margin:0;font-family:'Fraunces','Fraunces Fallback',serif;font-weight:400;font-size:21px;line-height:1.2;color:#0F1A0D}.vp-join h3 em{color:#004C3F;font-weight:300}.vp-join p{margin:0;font-size:14px;line-height:1.55;color:#3D5038}.vp-join a{margin-top:auto;display:flex;align-items:center;justify-content:center;min-height:48px;border-radius:13px;background:#004C3F;color:#fff;font-weight:600;font-size:15px;text-decoration:none}</style>
  <div class="vp-in">
    <span class="vp-k">Dans l'annuaire</span>
    <h2>${list.length > 1 ? `Les ${escHtml(cfg.qui)}` : `${escHtml(cfg.un.charAt(0).toUpperCase() + cfg.un.slice(1))}`} <em>${escHtml(aVille(villeName))}</em></h2>
    <p class="vp-lead">Chaque fiche montre ses photos, ses tarifs et sa zone. Ou laisse les pros venir à toi.</p>
    <div class="vp-grid">${cards}
      <div class="vp-ask">
        <span class="k">Gratuit · sans commission</span>
        <h3>Pas le temps de comparer ? <em>${escHtml(cfg.viennent)}</em></h3>
        <p>${escHtml(cfg.decris)} : ta demande part aux ${escHtml(cfg.qui)} les plus proches ${escHtml(aVille(villeName))}.</p>
        <div class="vp-pts"><span><i class="ph-bold ph-check-circle"></i>Réponses directes, par e-mail ou téléphone</span><span><i class="ph-bold ph-check-circle"></i>Sans réponse sous 48 h, d’autres prennent le relais</span></div>
        <a class="vp-cta" href="${demande}"><i class="ph-bold ph-paper-plane-tilt"></i>Décrire mon besoin</a>
      </div>
      <div class="vp-join">
        <span class="k">${escHtml(cfg.tuEs)}</span>
        <h3>Ta fiche ici, <em>vue par les hôtes ${escHtml(aVille(villeName).replace(/^à /, 'de ').replace(/^au /, 'du ').replace(/^aux /, 'des '))}.</em></h3>
        <p>Les demandes de la ville arrivent directement chez toi, sans commission.</p>
        <a href="${cfg.rejoindre}">Créer ma fiche</a>
      </div>
    </div>
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
