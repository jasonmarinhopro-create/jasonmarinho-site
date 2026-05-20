#!/usr/bin/env node
/**
 * Enrichit tous les fichiers HTML statiques du site avec les éléments
 * SEO 2026 nécessaires à une identité de marque cohérente dans Google :
 *
 *   1. <link rel="manifest" href="/manifest.json">      (si absent)
 *   2. <link rel="icon" sizes="192x192">                (corrige size erronée)
 *   3. <script ld+json> Organization avec logo          (si absent)
 *
 * IDEMPOTENT : chaque patch détecte ce qui existe déjà avant d'agir.
 * Ré-exécutable autant de fois que voulu sans corruption.
 *
 * Source de vérité : index.html (homepage) qui a déjà tous les éléments.
 * On propage ces mêmes éléments sur les sous-pages.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const ROOT = path.resolve(path.dirname(__filename), '..')

// ─── Patchs à appliquer ──────────────────────────────────────────────

const ORG_SCHEMA = `<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Organization","@id":"https://jasonmarinho.com/#organization","name":"Jason Marinho","url":"https://jasonmarinho.com","logo":{"@type":"ImageObject","url":"https://jasonmarinho.com/logo.webp","width":200,"height":200},"sameAs":["https://instagram.com/jason_marinho","https://www.linkedin.com/in/jason-driing-location-sanscommission"]}
</script>`

const MANIFEST_LINK = `<link rel="manifest" href="/manifest.json">`
const ICON_192_CORRECT = `<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">`

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

/** Patch 3 : ajoute Organization schema (avec logo) si absent. */
function patchOrganizationSchema(html) {
  if (hasFullOrganizationSchema(html)) return { html, changed: false }
  // Insère juste avant </head>
  if (!/<\/head>/i.test(html)) return { html, changed: false }
  return {
    html: html.replace(/<\/head>/i, ORG_SCHEMA + '\n</head>'),
    changed: true,
  }
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
const counters = { manifest: 0, icon192: 0, orgSchema: 0 }

for (const file of files) {
  total++
  let html = fs.readFileSync(file, 'utf8')
  const before = html
  let r

  r = patchManifest(html);          html = r.html; if (r.changed) counters.manifest++
  r = patchIcon192(html);           html = r.html; if (r.changed) counters.icon192++
  r = patchOrganizationSchema(html); html = r.html; if (r.changed) counters.orgSchema++

  if (html !== before) {
    fs.writeFileSync(file, html)
    touched++
  }
}

console.log(`\n🎯 SEO enrichment terminé`)
console.log(`   Fichiers HTML scannés : ${total}`)
console.log(`   Fichiers modifiés     : ${touched}`)
console.log(`   - manifest.json ajouté          : ${counters.manifest}`)
console.log(`   - icon-192 size corrigé          : ${counters.icon192}`)
console.log(`   - Organization schema ajouté    : ${counters.orgSchema}`)
console.log(`\n   Script idempotent : ré-exécuter ne change plus rien.`)
