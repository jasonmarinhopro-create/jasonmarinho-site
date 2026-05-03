/**
 * insert-actualites.mjs
 *
 * Inserts LCD news items directly into Supabase — no SQL migration needed.
 *
 * Usage (from jason-app/ directory):
 *   node scripts/insert-actualites.mjs '[{"title":"...","summary":"...","category":"...","source_url":"...","read_time_minutes":3}]'
 *
 * Required env vars (in jason-app/.env.local or set in shell):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Categories: reglementation | fiscalite | plateformes | marche | outils | juridique | driing
 */

import { readFileSync, existsSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// ── Load .env.local if present ─────────────────────────────────────────────
const envPath = new URL('../.env.local', import.meta.url).pathname
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('    Set them in jason-app/.env.local or export them in your shell.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Parse input (CLI arg or stdin) ─────────────────────────────────────────
let raw = process.argv[2]
if (!raw) {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  raw = Buffer.concat(chunks).toString('utf8').trim()
}

if (!raw) {
  console.error('❌  No input. Pass JSON as first argument or via stdin.')
  process.exit(1)
}

let items
try {
  const parsed = JSON.parse(raw)
  items = Array.isArray(parsed) ? parsed : [parsed]
} catch (e) {
  console.error('❌  Invalid JSON:', e.message)
  process.exit(1)
}

// ── Insert ─────────────────────────────────────────────────────────────────
const VALID_CATEGORIES = new Set(['reglementation','fiscalite','plateformes','marche','outils','juridique','driing'])

let inserted = 0
let skipped  = 0
let errors   = 0

for (const item of items) {
  const { title, summary, source_url, category, published_at, is_published = true, read_time_minutes } = item

  if (!title || !summary || !category) {
    console.warn(`⚠️   Skipping item (missing title/summary/category): ${title ?? '(no title)'}`)
    skipped++
    continue
  }

  if (!VALID_CATEGORIES.has(category)) {
    console.warn(`⚠️   Unknown category "${category}" for: ${title}`)
  }

  // Deduplication by title
  const { data: existing } = await supabase
    .from('actualites')
    .select('id')
    .eq('title', title)
    .maybeSingle()

  if (existing) {
    console.log(`⏭   Already exists: "${title}"`)
    skipped++
    continue
  }

  const { error } = await supabase.from('actualites').insert({
    title,
    summary,
    source_url:         source_url || null,
    category,
    is_published,
    published_at:       published_at || (is_published ? new Date().toISOString() : null),
    read_time_minutes:  read_time_minutes ? parseInt(read_time_minutes, 10) : null,
  })

  if (error) {
    console.error(`✗  Error inserting "${title}": ${error.message}`)
    errors++
  } else {
    console.log(`✓  Inserted: "${title}"`)
    inserted++
  }
}

console.log(`\nDone: ${inserted} inserted, ${skipped} skipped, ${errors} errors.`)
if (errors > 0) process.exit(1)
