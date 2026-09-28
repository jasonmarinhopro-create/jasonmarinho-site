#!/usr/bin/env node
/**
 * Correctifs ciblés dans le texte des leçons EN BASE (formation_lessons),
 * sans toucher au reste : les leçons en base ont été réécrites hors du code
 * (éditeur admin), un seed complet les écraserait.
 *
 * Usage (depuis jason-app/) :
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   DRY_RUN=1 node scripts/fix-formations-db.mjs
 *
 * DRY_RUN=1 : n'écrit rien, affiche pour chaque leçon le nombre de
 * remplacements et de courts extraits après correction (le dépôt est public :
 * jamais le texte complet d'une leçon dans les journaux).
 *
 * Workflow : .github/workflows/fix-formations-db.yml (aperçu par défaut).
 */

import { createClient } from '@supabase/supabase-js'
import { fiscalFix, dashFix } from './lib/formation-text-fixes.mjs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const DRY_RUN = process.env.DRY_RUN !== '0' && process.env.DRY_RUN !== 'false'

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })

// Formations concernées par les chiffres fiscaux (aperçu du 28/09/2026)
const FISCAL_SLUGS = ['fiscalite-reglementation-lcd-france-2026', 'creer-conciergerie-lcd']

const TVA_REVIEW = process.env.TVA_REVIEW === '1'
const TVA_RX = /37[\s\u202f\u00a0.]?500|41[\s\u202f\u00a0.]?250|91[\s\u202f\u00a0.]?900|85[\s\u202f\u00a0.]?800|25[\s\u202f\u00a0.]?000\s?€[^|\n]{0,40}(TVA|franchise)|para-?h[ôo]tel/i

// Extrait court (≤ 140 caractères) centré sur le seuil trouvé
function tvaLines(text) {
  return text.split('\n').filter(l => TVA_RX.test(l)).slice(0, 6).map(l => {
    const i = Math.max(0, l.search(TVA_RX) - 60)
    const cut = l.slice(i, i + 140).trim()
    return (i > 0 ? '…' : '') + cut + (i + 140 < l.length ? '…' : '')
  })
}

function snippets(before, after) {
  // Extraits courts (≤ 140 caractères) autour des passages modifiés
  const a = after.split('\n')
  const b = new Set(before.split('\n'))
  return a.filter(l => l.trim() && !b.has(l)).slice(0, 4)
    .map(l => (l.length > 140 ? l.slice(0, 140) + '…' : l).trim())
}

async function main() {
  console.log(DRY_RUN ? 'Mode aperçu : rien ne sera écrit en base.' : 'Écriture en base.')
  const { data: formations, error: fErr } = await supabase.from('formations').select('id, slug')
  if (fErr) throw new Error(fErr.message)
  const slugById = new Map(formations.map(f => [f.id, f.slug]))

  const { data: modules, error: mErr } = await supabase
    .from('formation_modules').select('id, formation_id, module_number')
  if (mErr) throw new Error(mErr.message)
  const modById = new Map(modules.map(m => [m.id, m]))

  const { data: lessons, error: lErr } = await supabase
    .from('formation_lessons').select('id, module_id, lesson_number, title, content')
  if (lErr) throw new Error(lErr.message)

  let changed = 0
  let errors = 0
  for (const l of lessons) {
    const mod = modById.get(l.module_id)
    const slug = mod ? slugById.get(mod.formation_id) : null
    if (!slug) continue
    let content = l.content ?? ''
    let title = l.title ?? ''
    const before = content
    if (FISCAL_SLUGS.includes(slug)) content = fiscalFix(content)
    const afterFiscal = content
    content = dashFix(content)
    const dashes = (afterFiscal.match(/—/g) ?? []).length
    // Anciens chiffres ou montants qui en dépendent, restés dans le texte :
    // affichés pour relecture (les tableaux « avant la loi Le Meur » y figurent,
    // c'est normal)
    const review = FISCAL_SLUGS.includes(slug)
      ? afterFiscal.split('\n').filter(line => /1 180|1 520|1 720|17,2|71\s?%|77 ?700|188 ?700|Total|[ÉéE]conomie/.test(line))
      : []
    // Seuils de TVA (toutes formations) : 37 500 € ne vaut que pour les
    // prestations de services (conciergerie), l'hébergement para-hôtelier est
    // à 85 000 €. Extraits courts affichés pour relecture, rien n'est modifié.
    const tvaReview = TVA_REVIEW ? tvaLines(afterFiscal) : []
    for (const line of tvaReview) console.log(`  TVA à relire (${slug} ${mod.module_number}.${l.lesson_number}) : ${line}`)
    title = dashFix(title, { isTitle: true })
    if (content === before && title === l.title) {
      for (const line of review) console.log(`  ? inchangé, à relire (${slug} ${mod.module_number}.${l.lesson_number}) : ${line.trim().slice(0, 140)}`)
      continue
    }

    changed += 1
    console.log(`\n~ ${slug} ${mod.module_number}.${l.lesson_number} ${title}${title !== l.title ? ' (titre corrigé)' : ''}`)
    for (const s of snippets(before, afterFiscal)) console.log(`    ${s}`)
    if (dashes > 0) console.log(`    ${dashes} tiret(s) cadratin(s) remplacé(s)`)
    for (const line of review) console.log(`    à relire : ${line.trim().slice(0, 140)}`)
    if (DRY_RUN) continue

    const { error } = await supabase
      .from('formation_lessons')
      .update({ title, content }) // pas de colonne updated_at en base (la migration 023 n'a pas recréé la table)
      .eq('id', l.id)
    if (error) { errors += 1; console.log(`  ! erreur : ${error.message}`) }
  }

  // Contrôle : plus aucun ancien chiffre hors tableaux historiques
  console.log(`\n${DRY_RUN ? 'Leçons à corriger' : 'Leçons corrigées'} : ${changed}`)
  if (errors > 0) { console.error(`${errors} erreur(s)`); process.exit(1) }
}

main().catch(err => { console.error('Fatal:', err.message ?? err); process.exit(1) })
