#!/usr/bin/env node
// Encart « Cette page dans Google » sur les pages de ville des pros
// (photographe-lcd-*, menage-lcd-*), 13/10/2026. Placé juste après le bandeau
// « Vous êtes photographe / équipe de ménage à … ? ». Rempli par /chiffres-ville.js
// (chiffres publics de l'app) et caché tant qu'il n'y a rien à montrer.
// Idempotent (marqueurs CHIFFRES:START/END) : à relancer si les pages sont régénérées.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const START = '<!-- CHIFFRES:START -->'
const END = '<!-- CHIFFRES:END -->'

const CSS = '.cv{max-width:1100px;margin:0 auto;padding:0 clamp(20px,5vw,48px)}.cv-card{margin-top:18px;background:#fff;border:1px solid rgba(0,76,63,.12);border-radius:18px;padding:clamp(18px,3vw,26px);display:grid;gap:14px}@media(min-width:880px){.cv-card{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);align-items:start}}.cv-h{display:flex;gap:12px;align-items:flex-start}.cv-h i{width:40px;height:40px;border-radius:12px;background:rgba(0,76,63,.07);color:#004C3F;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0}.cv-h b{display:block;font-family:Fraunces,Fraunces Fallback,serif;font-weight:400;font-size:20px;color:#0F1A0D;line-height:1.2}.cv-h p{font-size:13.5px;color:#3D5038;line-height:1.55;margin-top:4px}.cv-h a{color:#004C3F;font-weight:600}.cv-lead{font-size:14px;color:#3D5038;margin-bottom:8px}.cv-q{list-style:none;display:flex;flex-direction:column;gap:8px}.cv-q li{display:flex;gap:10px;align-items:center;font-size:14.5px;color:#0F1A0D;font-weight:600}.cv-q small{display:block;font-weight:400;font-size:12px;color:#6B7D68}.cv-place{display:inline-flex;align-items:center;justify-content:center;min-width:48px;padding:4px 9px;border-radius:999px;font-weight:700;font-size:13px;background:rgba(0,76,63,.08);color:#004C3F;flex-shrink:0}.cv-place.top{background:#004C3F;color:#fff}.cv-t{display:flex;flex-wrap:wrap;gap:8px 20px;font-size:14px;color:#3D5038;margin-top:10px}.cv-t b{font-family:Fraunces,Fraunces Fallback,serif;font-weight:400;font-size:22px;color:#004C3F;margin-right:4px}.cv-note{font-size:12px;color:#6B7D68;margin-top:6px}.cv-dm{display:flex;gap:12px;align-items:center;margin-top:14px;padding:12px 14px;border-radius:14px;background:#004C3F;color:#fff;text-decoration:none;font-size:14px;line-height:1.45;transition:transform .2s}.cv-dm:hover{transform:translateY(-1px)}.cv-dm>i{width:34px;height:34px;border-radius:10px;background:rgba(255,213,107,.16);color:#FFD56B;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}.cv-dm b{color:#FFD56B;font-weight:600}.cv-dm small{display:block;font-size:12.5px;color:rgba(255,255,255,.7);margin-top:2px}.cv-dm .go{margin-left:auto;color:#FFD56B;font-size:15px}'

function block(metier, slug) {
  const label = metier === 'photographe' ? 'des photographes' : metier === 'depannage' ? 'du dépannage' : 'des équipes de ménage'
  return `${START}
<style>${CSS}</style>
<div class="cv" data-chiffres-ville hidden>
  <div class="cv-card">
    <div class="cv-h"><i class="ph-bold ph-chart-line-up"></i><div><b>Cette page dans Google</b><p>Chiffres réels de Google Search Console, mis à jour chaque jour : la place est la moyenne mesurée par Google sur 28 jours. <a href="/chiffres?ville=${slug}#ta-ville">Tous les chiffres de cette ville</a></p></div></div>
    <div data-cv-body aria-label="Visibilité de la page ${label}"></div>
  </div>
</div>
<script defer src="/chiffres-ville.js"></script>
${END}`
}

// Pastille « demandes d'hôtes » dans l'en-tête : essayée puis retirée le 14/11/2026
// (Jason : « les hôtes sont aussi mes clients, voir ça tout en haut je ne suis pas
// d'accord »). Les demandes sont mises en valeur dans l'encart (.cv-dm) ; ces
// marqueurs sont seulement nettoyés s'il en reste.
const HERO_START = '<!-- DEMANDES-HERO:START -->'
const HERO_END = '<!-- DEMANDES-HERO:END -->'

let done = 0, skipped = 0
for (const dir of readdirSync(ROOT)) {
  const m = /^(photographe|menage|depannage)-lcd-([a-z0-9-]+)$/.exec(dir)
  if (!m) continue
  const file = join(ROOT, dir, 'index.html')
  if (!existsSync(file)) continue
  let html = readFileSync(file, 'utf8')
  const b = block(m[1], m[2])
  if (html.includes(START)) {
    html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), b)
  } else {
    const band = html.indexOf('class="pro-band"')
    if (band < 0) { skipped++; continue }
    // Dans la section du bandeau, juste avant sa fermeture : sous « Vous êtes … à … ? »
    const close = html.indexOf('</section>', band)
    if (close < 0) { skipped++; continue }
    html = html.slice(0, close) + b + '\n' + html.slice(close)
  }
  html = html.replace(new RegExp(`\\n?\\s*${HERO_START}[\\s\\S]*?${HERO_END}`), '')
  writeFileSync(file, html)
  done++
}
console.log(`inject-chiffres-ville : ${done} pages, ${skipped} sans bandeau pro`)
