#!/usr/bin/env node
/**
 * Enrichit tous les fichiers HTML statiques du site avec les éléments
 * SEO 2026 nécessaires à une identité de marque cohérente dans Google :
 *
 *   1. <link rel="manifest" href="/manifest.json">      (si absent)
 *   2. <link rel="icon" sizes="192x192">                (corrige size erronée)
 *   3. <link rel="icon" sizes="512x512"> + sizes="96x96" (si absents)
 *   4. <script ld+json> Organization avec logo          (si absent)
 *
 * IDEMPOTENT : chaque patch détecte ce qui existe déjà avant d'agir.
 * Ré-exécutable autant de fois que voulu sans corruption.
 *
 * Source de vérité : index.html (homepage) qui a déjà tous les éléments.
 * On propage ces mêmes éléments sur les sous-pages.
 *
 * NOTE FAVICON GOOGLE :
 * Google demande depuis 2024 un favicon ≥48 px multiples de 48 (48, 96,
 * 192, 512). Le 32x32 historique est ignoré → favicon plat dans les SERP.
 * Le logo.webp en Organization schema doit aussi avoir des dimensions
 * matching le fichier réel (sinon Google peut ignorer le rich snippet).
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const ROOT = path.resolve(path.dirname(__filename), '..')

// ─── Patchs à appliquer ──────────────────────────────────────────────

// Dimensions ALIGNÉES sur le fichier réel logo.webp (1600x1600). Avant
// le schema déclarait 200x200 alors que le fichier était 1600x1600 →
// Google peut ignorer le mismatch.
const ORG_SCHEMA = `<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Organization","@id":"https://jasonmarinho.com/#organization","name":"Jason Marinho","url":"https://jasonmarinho.com","logo":{"@type":"ImageObject","url":"https://jasonmarinho.com/logo.webp","width":1600,"height":1600},"sameAs":["https://instagram.com/jason_marinho","https://www.linkedin.com/in/jason-driing-location-sanscommission"]}
</script>`

const MANIFEST_LINK = `<link rel="manifest" href="/manifest.json">`
const ICON_192_CORRECT = `<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">`
const ICON_512_LINK = `<link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png">`
const ICON_96_LINK = `<link rel="icon" type="image/png" sizes="96x96" href="/icon-96.png">`

// ─── Helpers de détection ────────────────────────────────────────────

/** Cherche un Organization schema avec un logo défini, pas juste un publisher. */
function hasFullOrganizationSchema(html) {
  // Détecte un script ld+json contenant à la fois "Organization" ET "logo"
  // dans le même script tag. Pas juste "publisher: {Organization}".
  const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) ?? []
  return scripts.some(s =>
    /"@type"\s*:\s*"Organization"/.test(s) &&
    /"logo"\s*:\s*\{/.test(s)
  )
}

function hasManifestLink(html) {
  return /<link[^>]*rel=["']manifest["']/i.test(html)
}

function hasCorrectIcon192(html) {
  return /<link[^>]*rel=["']icon["'][^>]*sizes=["']192x192["']/i.test(html)
}

function hasIcon512(html) {
  return /<link[^>]*rel=["']icon["'][^>]*sizes=["']512x512["']/i.test(html)
}

function hasIcon96(html) {
  return /<link[^>]*rel=["']icon["'][^>]*sizes=["']96x96["']/i.test(html)
}

/** Détecte un Organization schema avec dimensions logo dépassées (200x200
 *  alors que logo.webp est 1600x1600). Ce mismatch fait que Google peut
 *  ignorer le snippet riche. */
function hasOldLogoDimensions(html) {
  return /"logo"\s*:\s*\{\s*"@type"\s*:\s*"ImageObject"\s*,\s*"url"\s*:\s*"https:\/\/jasonmarinho\.com\/logo\.webp"\s*,\s*"width"\s*:\s*200\s*,\s*"height"\s*:\s*200/i.test(html)
}

// ─── Patches ─────────────────────────────────────────────────────────

/** Patch 1 : ajoute le manifest.json link s'il manque. */
function patchManifest(html) {
  if (hasManifestLink(html)) return { html, changed: false }
  // Insère après le dernier <link rel="icon"> ou <link rel="apple-touch-icon">.
  const match = html.match(/(<link[^>]*rel=["'](?:icon|apple-touch-icon)["'][^>]*>)(?![\s\S]*<link[^>]*rel=["'](?:icon|apple-touch-icon)["'])/i)
  if (!match) return { html, changed: false }
  const insertion = match[1] + '\n' + MANIFEST_LINK
  return { html: html.replace(match[1], insertion), changed: true }
}

/** Patch 2 : corrige la déclaration icon-192.png (était à 32x32 par erreur). */
function patchIcon192(html) {
  // Cherche un <link rel="icon" ... href="/icon-192.png" ...> et corrige sizes
  const wrongPattern = /<link\s+rel=["']icon["']\s+type=["']image\/png["']\s+sizes=["']32x32["']\s+href=["']\/icon-192\.png["']\s*\/?>/i
  if (wrongPattern.test(html)) {
    return { html: html.replace(wrongPattern, ICON_192_CORRECT), changed: true }
  }
  // Si pas de icon-192 du tout, on l'ajoute (au cas où)
  if (!hasCorrectIcon192(html) && !/icon-192\.png/.test(html)) {
    const insert = html.match(/(<link[^>]*rel=["']icon["'][^>]*>)/i)
    if (insert) {
      return { html: html.replace(insert[1], insert[1] + '\n' + ICON_192_CORRECT), changed: true }
    }
  }
  return { html, changed: false }
}

/** Patch 3 : ajoute Organization schema (avec logo) si absent, OU corrige
 *  les dimensions du logo si elles sont restées à 200x200. */
function patchOrganizationSchema(html) {
  // Cas 1 : aucun Organization schema → on l'insère.
  if (!hasFullOrganizationSchema(html)) {
    if (!/<\/head>/i.test(html)) return { html, changed: false }
    return {
      html: html.replace(/<\/head>/i, ORG_SCHEMA + '\n</head>'),
      changed: true,
    }
  }
  // Cas 2 : schema présent mais dimensions logo périmées → on les met à jour.
  if (hasOldLogoDimensions(html)) {
    const fixed = html.replace(
      /("logo"\s*:\s*\{\s*"@type"\s*:\s*"ImageObject"\s*,\s*"url"\s*:\s*"https:\/\/jasonmarinho\.com\/logo\.webp"\s*,\s*"width"\s*:\s*)200(\s*,\s*"height"\s*:\s*)200/i,
      `$11600$21600`,
    )
    if (fixed !== html) return { html: fixed, changed: true }
  }
  return { html, changed: false }
}

/** Patch 4 : ajoute les liens icon-512 et icon-96 si absents. Google
 *  préfère les favicons multiples de 48, plus l'éventail est large, mieux
 *  c'est. Insérés juste après le icon-192 existant. */
function patchExtraIcons(html) {
  let changed = false
  if (!hasIcon512(html) && /icon-512\.png/.test(html) === false) {
    const after192 = html.match(/(<link[^>]*rel=["']icon["'][^>]*sizes=["']192x192["'][^>]*>)/i)
    if (after192) {
      html = html.replace(after192[1], after192[1] + '\n' + ICON_512_LINK)
      changed = true
    }
  }
  if (!hasIcon96(html) && /icon-96\.png/.test(html) === false) {
    const after192 = html.match(/(<link[^>]*rel=["']icon["'][^>]*sizes=["']192x192["'][^>]*>)/i)
    if (after192) {
      html = html.replace(after192[1], ICON_96_LINK + '\n' + after192[1])
      changed = true
    }
  }
  return { html, changed }
}

/** Patch 5 : corrige favicon.ico déclaré sizes="32x32" alors que le
 *  fichier physique contient 16+32+48. sizes="any" indique multi-resolution
 *  et reste la valeur la plus universelle pour les ICO multi-frames. */
function patchFaviconSizes(html) {
  const wrong = /<link\s+rel=["']icon["']\s+href=["']\/favicon\.ico["']\s+sizes=["']32x32["']\s*\/?>/i
  if (wrong.test(html)) {
    return {
      html: html.replace(wrong, `<link rel="icon" href="/favicon.ico" sizes="any">`),
      changed: true,
    }
  }
  return { html, changed: false }
}

// ─── Walk filesystem ─────────────────────────────────────────────────

function walkHtml(dir, out = []) {
  // Skip dossiers techniques
  const base = path.basename(dir)
  if (['node_modules', '.git', '.next', 'jason-app', '_drafts'].includes(base)) return out
  let entries
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walkHtml(p, out)
    else if (e.isFile() && /\.html?$/i.test(e.name)) out.push(p)
  }
  return out
}

// ─── Main ────────────────────────────────────────────────────────────

const files = walkHtml(ROOT)
let total = 0
let touched = 0
const counters = { manifest: 0, icon192: 0, orgSchema: 0, extraIcons: 0, faviconSizes: 0 }

for (const file of files) {
  total++
  let html = fs.readFileSync(file, 'utf8')
  const before = html
  let r

  r = patchManifest(html);          html = r.html; if (r.changed) counters.manifest++
  r = patchIcon192(html);           html = r.html; if (r.changed) counters.icon192++
  r = patchExtraIcons(html);        html = r.html; if (r.changed) counters.extraIcons++
  r = patchFaviconSizes(html);      html = r.html; if (r.changed) counters.faviconSizes++
  r = patchOrganizationSchema(html); html = r.html; if (r.changed) counters.orgSchema++

  if (html !== before) {
    fs.writeFileSync(file, html)
    touched++
  }
}

console.log(`\n🎯 SEO enrichment terminé`)
console.log(`   Fichiers HTML scannés : ${total}`)
console.log(`   Fichiers modifiés     : ${touched}`)
console.log(`   - manifest.json ajouté            : ${counters.manifest}`)
console.log(`   - icon-192 size corrigé            : ${counters.icon192}`)
console.log(`   - icon-96 + icon-512 ajoutés       : ${counters.extraIcons}`)
console.log(`   - favicon.ico sizes="any"          : ${counters.faviconSizes}`)
console.log(`   - Organization schema ajouté/MAJ   : ${counters.orgSchema}`)
console.log(`\n   Script idempotent : ré-exécuter ne change plus rien.`)
