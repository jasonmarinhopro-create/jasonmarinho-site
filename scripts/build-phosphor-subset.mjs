#!/usr/bin/env node
/**
 * Build Phosphor icon CSS subsets.
 *
 * Scans all *.html and *.js files in the static site for `ph-*` class
 * usage, then generates trimmed phosphor-regular-subset.css and
 * phosphor-bold-subset.css that only contain rules for icons actually
 * used on the site. Reduces ~84KB → ~10KB per file.
 *
 * Idempotent: re-run anytime, regenerates the subset files in place.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const FONTS_DIR = join(ROOT, 'fonts')
const SCAN_EXTS = new Set(['.html', '.js'])
const SKIP_DIRS = new Set(['node_modules', '.git', 'jason-app', 'fonts'])

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const st = statSync(path)
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(path, files)
    } else {
      const ext = name.slice(name.lastIndexOf('.'))
      if (SCAN_EXTS.has(ext)) files.push(path)
    }
  }
  return files
}

const ICON_RE = /ph-[a-z0-9-]+/g
const RESERVED = new Set(['ph-bold', 'ph-light', 'ph-thin', 'ph-fill', 'ph-duotone', 'ph-regular'])

function collectUsedIcons() {
  const used = new Set()
  for (const file of walk(ROOT)) {
    const text = readFileSync(file, 'utf8')
    const matches = text.match(ICON_RE)
    if (!matches) continue
    for (const m of matches) {
      if (!RESERVED.has(m)) used.add(m)
    }
  }
  return used
}

function buildSubset(srcCss, prefix, usedIcons) {
  // Find header (everything before the first icon rule)
  const firstIconRe = new RegExp(`\\.${prefix}\\.ph-[a-z0-9-]+:before`)
  const m = firstIconRe.exec(srcCss)
  if (!m) throw new Error(`No icon rules found for prefix .${prefix}`)
  const header = srcCss.slice(0, m.index).trimEnd() + '\n\n'

  const ruleRe = new RegExp(`\\.${prefix}\\.ph-([a-z0-9-]+):before\\s*\\{\\s*content:\\s*"([^"]+)";\\s*\\}`, 'g')
  const kept = []
  let match
  while ((match = ruleRe.exec(srcCss)) !== null) {
    const [_, name, code] = match
    if (usedIcons.has('ph-' + name)) {
      kept.push(`.${prefix}.ph-${name}:before { content: "${code}"; }`)
    }
  }
  return header + kept.join('\n') + '\n'
}

const used = collectUsedIcons()
console.log(`Scanned site, found ${used.size} unique icon classes.`)

const variants = [
  { variant: 'regular', prefix: 'ph' },
  { variant: 'bold',    prefix: 'ph-bold' },
]
for (const { variant, prefix } of variants) {
  const src = join(FONTS_DIR, `phosphor-${variant}.css`)
  const dst = join(FONTS_DIR, `phosphor-${variant}-subset.css`)
  const srcCss = readFileSync(src, 'utf8')
  const subset = buildSubset(srcCss, prefix, used)
  writeFileSync(dst, subset)
  const before = Buffer.byteLength(srcCss)
  const after = Buffer.byteLength(subset)
  console.log(`  ${variant.padEnd(7)} : ${(before / 1024).toFixed(1)} KB → ${(after / 1024).toFixed(1)} KB  (-${Math.round(100 * (1 - after / before))}%)`)
}

console.log('\nDone. Reference subset files via /fonts/phosphor-regular-subset.css and /fonts/phosphor-bold-subset.css')
