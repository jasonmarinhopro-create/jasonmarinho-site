#!/usr/bin/env node
/**
 * Maillage retour SEO — injecte un bloc "Ton équipe LCD à {Ville}" (liens
 * vers /photographe-lcd-{ville} et /menage-lcd-{ville}) dans :
 *
 *   - les 60 guides /devenir-hote-airbnb-{ville}/  (avant le CTA final)
 *   - les études /calculateurs/revenu-lcd-{ville}/ + /revenu-airbnb-paris
 *     (avant la section CTA finale) — uniquement les villes françaises
 *     qui ont leurs pages pros
 *
 * Ces pages sont indexées depuis longtemps : leurs liens transfèrent de
 * l'autorité vers les 120 nouvelles pages pros et accélèrent leur indexation.
 *
 * IDEMPOTENT : le bloc est délimité par des marqueurs PROS_VILLE_LINKS_* —
 * relancer le script remplace le bloc existant au lieu de le dupliquer.
 *
 *   node scripts/inject-pros-links.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const START = '<!-- PROS_VILLE_LINKS_START -->'
const END = '<!-- PROS_VILLE_LINKS_END -->'

function loadCities() {
  const src = fs.readFileSync(path.join(ROOT, 'footer.js'), 'utf8')
  const start = src.indexOf('var CITIES = [')
  const open = src.indexOf('[', start)
  const end = src.indexOf('];', open)
  return new Function('return ' + src.slice(open, end + 1))()
}

function prepo(name) {
  if (/^Le\s/i.test(name)) return 'au ' + name.replace(/^Le\s/i, '')
  return 'à ' + name
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Bloc autonome : styles inline uniquement, aucune dépendance au CSS de la
// page hôte (les pages devenir-hote et revenu ont des feuilles différentes).
function blockHtml(c) {
  const pre = escHtml(prepo(c.name))
  const name = escHtml(c.name)
  const card = (href, icon, kicker, title, desc) => `
    <a href="${href}" style="flex:1;min-width:250px;display:flex;flex-direction:column;gap:6px;padding:20px 22px;background:#fff;border:1px solid rgba(0,76,63,.12);border-radius:14px;text-decoration:none;transition:transform .18s,box-shadow .18s" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 10px 26px rgba(0,76,63,.10)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
      <span style="display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#004C3F"><i class="ph-bold ${icon}"></i>${kicker}</span>
      <span style="font-family:'Fraunces',serif;font-size:17px;color:#0F1A0D;line-height:1.3">${title}</span>
      <span style="font-size:13px;color:#3D5038;line-height:1.6">${desc}</span>
      <span style="font-size:12.5px;font-weight:600;color:#004C3F;margin-top:4px">Voir le guide →</span>
    </a>`
  return `${START}
<section style="max-width:1100px;margin:0 auto;padding:clamp(28px,4vw,44px) clamp(16px,5vw,60px) 0">
  <div style="background:#F7F5F0;border:1px solid rgba(0,76,63,.09);border-radius:18px;padding:clamp(22px,3vw,32px)">
    <h2 style="font-family:'Fraunces',serif;font-size:clamp(19px,2.2vw,24px);font-weight:400;color:#0F1A0D;margin:0 0 6px;letter-spacing:-.3px">Ton équipe LCD <em style="color:#004C3F;font-style:italic;font-weight:300">${pre}</em></h2>
    <p style="font-size:13.5px;color:#3D5038;margin:0 0 18px;line-height:1.65">Photos pro et ménage turnover : les deux prestataires qui font la différence sur tes avis et ton taux de clic. Tarifs locaux constatés ${pre} et annuaires vérifiés, sans commission.</p>
    <div style="display:flex;gap:14px;flex-wrap:wrap">
${card(`/photographe-lcd-${c.slug}`, 'ph-camera', 'Photographe', `Photographe LCD ${pre}`, `Tarifs constatés ${pre}, les photos indispensables, comment briefer — et l'annuaire vérifié.`)}
${card(`/menage-lcd-${c.slug}`, 'ph-sparkle', 'Ménage turnover', `Équipe de ménage LCD ${pre}`, `Tarifs turnover ${pre}, checklist complète, questions à poser — et l'annuaire vérifié.`)}
    </div>
  </div>
</section>
${END}`
}

function inject(filePath, c, anchors) {
  if (!fs.existsSync(filePath)) return false
  let html = fs.readFileSync(filePath, 'utf8')

  // Idempotence : retire le bloc existant
  const s = html.indexOf(START)
  const e = html.indexOf(END)
  if (s !== -1 && e !== -1) {
    html = html.slice(0, s) + html.slice(e + END.length + 1)
  }

  const block = blockHtml(c)
  for (const anchor of anchors) {
    const idx = html.indexOf(anchor)
    if (idx !== -1) {
      html = html.slice(0, idx) + block + '\n' + html.slice(idx)
      fs.writeFileSync(filePath, html, 'utf8')
      return true
    }
  }
  console.warn(`  ⚠ ancre introuvable : ${path.relative(ROOT, filePath)}`)
  return false
}

const cities = loadCities()
let hote = 0, revenu = 0

for (const c of cities) {
  // Guides devenir-hote : bloc avant le CTA final (ou avant footer en secours)
  if (inject(
    path.join(ROOT, `devenir-hote-airbnb-${c.slug}`, 'index.html'), c,
    ['<aside class="cta-banner">', '<div id="footer-mount">', '<script src="/footer.js"'],
  )) hote++

  // Études de revenus : avant la section CTA sombre finale (ou avant footer)
  const revenuDir = c.slug === 'paris' ? 'revenu-airbnb-paris' : `revenu-lcd-${c.slug}`
  if (inject(
    path.join(ROOT, 'calculateurs', revenuDir, 'index.html'), c,
    ['<section style="background:var(--g);color:#fff', '<script src="/footer.js"'],
  )) revenu++
}

console.log(`[inject-pros-links] ✓ ${hote} guides devenir-hote + ${revenu} études de revenus maillés`)
