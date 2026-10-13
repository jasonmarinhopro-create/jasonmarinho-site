#!/usr/bin/env node
// Captures d'écran des pages « Pour qui » photographes et ménage
// (13/10/2026, Jason : « ajoute des captures d'écran pour bien vendre »).
// Tout vient de pages fictives du site : fiches d'exemple, exemple de
// « Mes statistiques », pages de ville, formulaire « Trouver un pro », et une
// grille de cartes d'annuaire composée avec des fiches fictives.
// Pas lancé au build : à relancer à la main si ces pages changent.
//   python3 -m http.server 8765   (à la racine du dépôt)
//   node scripts/captures-pour-qui.mjs
// Sortie : img/pour-qui/*.webp (Playwright installé globalement).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { proCardHtml, ANNUAIRE_CSS } from './lib/annuaire-hote.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = process.env.CAPTURES_BASE || 'http://localhost:8765'
const OUT = path.join(ROOT, 'img', 'pour-qui')
const PW = process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright/index.mjs'
const { chromium } = await import(PW)

const img = n => ({ thumb: `/img/exemple-fiches/${n}-t.jpg` })
const SCENES = {
  photographe: [
    { name: 'Camille Sénéchal', ville: 'Lyon', lieu: 'aussi à Villeurbanne, Annecy +3', extra: 'Intérieurs + drone extérieur', tarif: 'dès 350 €', photos: [img('photo-salon-2'), img('photo-chambre-3'), img('photo-cuisine-2')] },
    { name: 'Hugo Marchand', ville: 'Annecy', lieu: 'Lac d’Annecy + 30 km', extra: 'Intérieurs + vidéo / Reels', tarif: 'dès 280 €', photos: [img('photo-salon-4'), img('photo-interieur-1')] },
    { name: 'Atelier Lumen', ville: 'Bordeaux', lieu: 'Gironde et bassin d’Arcachon', extra: 'Hôtels et gîtes de charme', tarif: 'dès 320 €', photos: [] },
  ],
  menage: [
    { name: 'Éclat Ménage Bordeaux', ville: 'Bordeaux', lieu: 'aussi à Mérignac, Pessac +2', extra: 'Équipe de 3 à 5 personnes · assurance RC pro', tarif: 'dès 55 €', photos: [img('menage-1'), img('photo-chambre-4')] },
    { name: 'Propre & Net', ville: 'Arcachon', lieu: 'Bassin d’Arcachon', extra: 'Duo · linge compris', tarif: 'dès 48 €', photos: [] },
    { name: 'Les Clés du Lac', ville: 'Annecy', lieu: 'aussi à Talloires, Sévrier', extra: 'Solo · réassort des consommables', tarif: 'dès 45 €', photos: [img('photo-salon-5')] },
  ],
}

function scenePage(metier) {
  const label = metier === 'menage' ? 'Équipe de ménage' : 'Photographe'
  const cards = SCENES[metier].map(c => proCardHtml({ href: '#', metier: label, alt: c.name, ...c })).join('\n')
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<link rel="stylesheet" href="/fonts/site-fonts.css"><link rel="stylesheet" href="/fonts/phosphor-regular.css"><link rel="stylesheet" href="/fonts/phosphor-bold.css">
<style>*{box-sizing:border-box;margin:0}body{background:#F7F5F0;font-family:'Outfit',sans-serif;padding:28px}
${ANNUAIRE_CSS}
.grid-x{display:inline-grid;grid-template-columns:repeat(3,300px);gap:18px}a{color:inherit;text-decoration:none}</style></head>
<body><div class="grid-x" id="scene">${cards}</div></body></html>`
}

const HIDE = '#nav{display:none!important}body{padding-top:0!important}body::before{display:none!important}[id^=jm-cookie],[class*=cookie]{display:none!important}.vt-bar,.vt-sticky{display:none!important}'

async function prep(p) {
  await p.addStyleTag({ url: '/fonts/phosphor-regular.css' })
  await p.addStyleTag({ url: '/fonts/phosphor-bold.css' })
  await p.addStyleTag({ content: HIDE })
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(500)
}

async function box(p, selectors, pad = 0) {
  const boxes = []
  for (const s of selectors) {
    const b = await p.locator(s).first().boundingBox()
    if (!b) throw new Error('Introuvable : ' + s)
    boxes.push(b)
  }
  const x = Math.min(...boxes.map(b => b.x)) - pad
  const y = Math.min(...boxes.map(b => b.y)) - pad
  const r = Math.max(...boxes.map(b => b.x + b.width)) + pad
  const btm = Math.max(...boxes.map(b => b.y + b.height)) + pad
  return { x: Math.max(0, x), y: Math.max(0, y), width: r - Math.max(0, x), height: btm - Math.max(0, y) }
}

const browser = await chromium.launch()
const conv = await browser.newPage()
async function saveWebp(png, name, width) {
  const dataUrl = await conv.evaluate(async ({ b64, width }) => {
    const im = new Image()
    im.src = 'data:image/png;base64,' + b64
    await im.decode()
    const w = Math.min(width, im.naturalWidth)
    const h = Math.round(im.naturalHeight * w / im.naturalWidth)
    const c = document.createElement('canvas')
    c.width = w; c.height = h
    const ctx = c.getContext('2d')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(im, 0, 0, w, h)
    return c.toDataURL('image/webp', 0.82)
  }, { b64: png.toString('base64'), width })
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64')
  fs.writeFileSync(path.join(OUT, name + '.webp'), buf)
  console.log(`  ${name}.webp  ${Math.round(buf.length / 1024)} Ko`)
}

async function shot({ url, name, clip, selectors, pad = 16, maxHeight, viewport = { width: 1280, height: 900 }, width = 1400, before }) {
  const p = await browser.newPage({ viewport, deviceScaleFactor: 2 })
  await p.goto(BASE + url, { waitUntil: 'networkidle' })
  await prep(p)
  if (before) await before(p)
  const area = clip || await box(p, selectors, pad)
  if (maxHeight && area.height > maxHeight) area.height = maxHeight
  const png = await p.screenshot({ clip: area, fullPage: true })
  await saveWebp(png, name, width)
  await p.close()
}

fs.mkdirSync(OUT, { recursive: true })
for (const metier of ['photographe', 'menage']) {
  const dir = metier === 'menage' ? 'menage' : 'photographes'
  const k = metier === 'menage' ? 'menage' : 'photo'
  const scene = path.join(ROOT, `_scene-cartes-${metier}.html`)
  fs.writeFileSync(scene, scenePage(metier))
  try {
    console.log(metier)
    await shot({ url: `/annuaires/${dir}/exemple-fiche`, name: `${k}-fiche`, selectors: ['.demo-banner', 'header.hero'], pad: 0 })
    await shot({ url: `/annuaires/${dir}/exemple-fiche`, name: `${k}-galerie`, selectors: ['.vt-gal, #photos, section:has(> h2:text("Photos"))'], pad: 8, width: 1200 })
    await shot({ url: `/annuaires/${dir}/exemple-fiche`, name: `${k}-formules`, selectors: ['#formules', 'section:has(> h2:text("Comment ça se passe"))'], pad: 8, width: 1200 })
    await shot({ url: `/annuaires/${dir}/exemple-fiche`, name: `${k}-stats`, selectors: ['.sd-app'], pad: 0, width: 1400 })
    await shot({ url: `/_scene-cartes-${metier}.html`, name: `${k}-cartes`, selectors: ['#scene'], pad: 14, viewport: { width: 1100, height: 700 }, width: 1300 })
    await shot({ url: metier === 'menage' ? '/menage-lcd-bordeaux' : '/photographe-lcd-lyon', name: `${k}-ville`, selectors: ['header.hero'], pad: 0 })
    await shot({ url: `/trouver-un-pro?metier=${metier}&ville=${metier === 'menage' ? 'Bordeaux' : 'Lyon'}`, name: `${k}-demande`, selectors: ['form'], pad: 28, maxHeight: 470, width: 1100 })
  } finally {
    fs.rmSync(scene, { force: true })
  }
}
await browser.close()
