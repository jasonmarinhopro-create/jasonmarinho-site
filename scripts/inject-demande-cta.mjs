#!/usr/bin/env node
// Demande inversée sur les 122 pages de ville (photographe-lcd-*, menage-lcd-*),
// là où arrivent les hôtes depuis Google (« photographe airbnb lyon ») :
//  - bandeau du haut : « Décrire mon besoin » (vers /trouver-un-pro, métier et
//    ville déjà remplis) + « Voir l'annuaire » ; le lien pour les pros quitte le
//    bandeau (il reste plus bas, dans l'encadré « Rejoignez l'annuaire ») ;
//  - encart « Pas le temps de chercher ? » juste avant l'encadré des pros.
// Idempotent : marqueurs DEMANDE-HERO / DEMANDE. À relancer si les pages sont
// régénérées (build-pages-pros-villes.mjs). Usage : node scripts/inject-demande-cta.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { villeLabel } from './lib/inject-ville-pros.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const aVille = v => /^les\s/i.test(v) ? `aux ${v.slice(4)}` : /^le\s/i.test(v) ? `au ${v.slice(3)}` : `à ${v}`

const METIERS = {
  'photographe-lcd': { metier: 'photographe', annuaire: '/annuaires/photographes', voir: 'Voir les photographes', qui: 'photographes', un: 'un photographe' },
  'menage-lcd': { metier: 'menage', annuaire: '/annuaires/menage', voir: 'Voir les équipes de ménage', qui: 'équipes de ménage', un: 'une équipe de ménage' },
}

function block(prefix, slug) {
  const m = METIERS[prefix]
  const ville = villeLabel(slug)
  const href = `/trouver-un-pro?metier=${m.metier}&amp;ville=${encodeURIComponent(ville)}`
  const hero = `<!-- DEMANDE-HERO:START -->
    <div class="hero-ctas">
      <a href="${href}" class="btn-p"><i class="ph-bold ph-paper-plane-tilt"></i> Décrire mon besoin</a>
      <a href="${m.annuaire}" class="btn-ol"><i class="ph-bold ph-magnifying-glass"></i> ${m.voir}</a>
    </div>
    <!-- DEMANDE-HERO:END -->`
  const band = `<!-- DEMANDE:START -->
<section class="sec" style="padding-bottom:0">
  <div class="s-in">
    <div style="display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between;padding:clamp(20px,3vw,30px);border-radius:18px;background:linear-gradient(150deg,#001a11,#003329 55%,#00463a);color:#fff">
      <div style="flex:1 1 360px;min-width:0">
        <div style="font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,213,107,.85);margin-bottom:8px">Gratuit · sans commission</div>
        <h2 style="font-family:'Fraunces',serif;font-weight:400;font-size:clamp(21px,2.6vw,28px);line-height:1.2;margin:0 0 8px;color:#fff">Pas le temps de chercher ? <em style="color:#FFD56B;font-weight:300">Les pros viennent à toi</em></h2>
        <p style="margin:0;font-size:15px;line-height:1.65;color:rgba(255,255,255,.75)">Décris ton logement en une minute : ta demande part aux 3 ${m.qui} les plus proches ${esc(aVille(ville))}, qui te répondent directement. Sans réponse sous 48 h, d’autres prennent le relais.</p>
      </div>
      <a href="${href}" style="display:inline-flex;align-items:center;gap:8px;padding:14px 22px;border-radius:10px;background:#FFD56B;color:#003329;font-weight:700;font-size:15px;text-decoration:none;white-space:nowrap"><i class="ph-bold ph-paper-plane-tilt"></i> Décrire mon besoin</a>
    </div>
  </div>
</section>
<!-- DEMANDE:END -->
`
  return { hero, band }
}

let n = 0
for (const dir of fs.readdirSync(ROOT)) {
  const prefix = Object.keys(METIERS).find(p => dir.startsWith(`${p}-`))
  if (!prefix) continue
  const file = path.join(ROOT, dir, 'index.html')
  if (!fs.existsSync(file)) continue
  let html = fs.readFileSync(file, 'utf8')
  const { hero, band } = block(prefix, dir.slice(prefix.length + 1))
  // Bandeau du haut
  if (html.includes('<!-- DEMANDE-HERO:START -->')) html = html.replace(/<!-- DEMANDE-HERO:START -->[\s\S]*?<!-- DEMANDE-HERO:END -->/, hero)
  else html = html.replace(/<div class="hero-ctas">[\s\S]*?<\/div>/, hero)
  // Encart avant l'encadré des pros
  if (html.includes('<!-- DEMANDE:START -->')) html = html.replace(/<!-- DEMANDE:START -->[\s\S]*?<!-- DEMANDE:END -->\n/, band)
  else {
    const i = html.indexOf('<div class="pro-band">')
    const j = i < 0 ? -1 : html.lastIndexOf('<section', i)
    if (j < 0) { console.warn(`[demande-cta] repère introuvable : ${dir}`); continue }
    html = html.slice(0, j) + band + html.slice(j)
  }
  fs.writeFileSync(file, html, 'utf8')
  n++
}
console.log(`[demande-cta] ${n} page(s) de ville`)
