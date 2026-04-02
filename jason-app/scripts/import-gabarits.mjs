/**
 * Script d'import des 70 gabarits de messages dans Supabase
 * Usage : node scripts/import-gabarits.mjs
 * Requis  : NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY dans .env.local
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Données des 70 gabarits ──────────────────────────────────────────────────
const GABARITS = JSON.parse(
  readFileSync(resolve(__dirname, 'gabarits.json'), 'utf8')
)

// ── Mapping JSON → schéma Supabase ───────────────────────────────────────────
function toRow(g) {
  return {
    title:     g.titre,
    content:   g.corps_fr,          // contenu principal en français
    category:  g.categorie,
    variante:  g.variante ?? null,
    timing:    g.timing ?? null,
    corps_en:  g.corps_en ?? null,
    variables: g.variables ?? [],
    tags:      g.tags ?? [],
    langues:   g.langues ?? ['fr'],
    copy_count: 0,
  }
}

// ── Import ───────────────────────────────────────────────────────────────────
async function run() {
  console.log(`\n📦 Import de ${GABARITS.length} gabarits…\n`)

  const rows = GABARITS.map(toRow)

  // Upsert par titre + catégorie pour éviter les doublons si relancé
  const { data, error } = await supabase
    .from('templates')
    .upsert(rows, { onConflict: 'title,category', ignoreDuplicates: false })
    .select('id, title, category')

  if (error) {
    console.error('❌ Erreur Supabase :', error.message)
    console.error(error.details ?? '')
    process.exit(1)
  }

  console.log(`✅ ${data.length} gabarits importés avec succès !\n`)

  // Résumé par catégorie
  const byCat = {}
  data.forEach(r => { byCat[r.category] = (byCat[r.category] ?? 0) + 1 })
  Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, n]) => console.log(`  ${cat.padEnd(16)} ${n} gabarit(s)`))

  console.log('\nTerminé 🎉\n')
}

run()
