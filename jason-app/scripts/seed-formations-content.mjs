#!/usr/bin/env node
/**
 * Seed Supabase with the formation content currently bundled in
 * jason-app/app/dashboard/formations/<slug>/content.ts files.
 *
 * Each content.ts exports an object with: title, description, duration,
 * level, objectifs, modules[{id,title,duration,lessons[{id,title,duration,content}]}].
 *
 * Usage:
 *   cd jason-app
 *   NEXT_PUBLIC_SUPABASE_URL=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/seed-formations-content.mjs
 *
 * Idempotent: re-running upserts modules/lessons (UNIQUE constraints kick in).
 * Only lessons whose title or content differ from the database are written.
 *
 * Options (env):
 *   SEED_ONLY=slug-a,slug-b  seed only these formations (default: all)
 *   DRY_RUN=1                write nothing, list what would change
 *   FIND='17,2|71 %'         (aperçu) cherche ce motif (regex) dans le texte EN BASE
 *                            et affiche les passages trouvés
 *
 * Warning: a lesson edited in /dashboard/admin/formations is overwritten by
 * its content.ts version. Run with DRY_RUN=1 first (the GitHub workflow
 * seed-formations.yml does it by default).
 *
 * After a successful run, the content.ts files become a fallback only,
 * and could be slimmed down (modules + lessons content removed) in a
 * follow-up PR to reduce bundle size.
 */

import { createClient } from '@supabase/supabase-js'
import { readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FORMATIONS_DIR = join(__dirname, '..', 'app', 'dashboard', 'formations')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'
const ONLY = (process.env.SEED_ONLY ?? '').split(',').map(x => x.trim()).filter(Boolean)
let errors = 0
const FIND = process.env.FIND ? new RegExp(process.env.FIND, 'gi') : null
let found = 0

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.')
  process.exit(1)
}

// tsx charge les content.ts (tsImport : chaque fichier en module ES isolé ;
// l'ancien register('tsx/esm') via node:module est refusé par tsx >= 4)
let tsImport
try {
  ({ tsImport } = await import('tsx/esm/api'))
} catch {
  console.error('tsx introuvable. Lance : npm i --no-save tsx')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
})

function listSlugDirs() {
  return readdirSync(FORMATIONS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(name => existsSync(join(FORMATIONS_DIR, name, 'content.ts')))
    .filter(name => ONLY.length === 0 || ONLY.includes(name))
}

async function loadContent(slug) {
  const path = pathToFileURL(join(FORMATIONS_DIR, slug, 'content.ts')).href
  const mod = await tsImport(path, import.meta.url)
  const exported = Object.values(mod).find(v => v && typeof v === 'object' && 'modules' in v)
  if (!exported) throw new Error(`No formation export found in ${slug}/content.ts`)
  return exported
}

// Résumé lisible d'un écart de texte : lignes en plus / en moins et la
// première ligne qui diffère (avant → après), pour juger en aperçu si l'écart
// vient d'une correction du code ou d'une retouche faite dans l'éditeur admin.
function describeDiff(dbText, codeText) {
  const dbLines = dbText.split('\n')
  const codeLines = codeText.split('\n')
  const dbSet = new Set(dbLines)
  const codeSet = new Set(codeLines)
  const onlyDb = dbLines.filter(l => l.trim() && !codeSet.has(l))
  const onlyCode = codeLines.filter(l => l.trim() && !dbSet.has(l))
  const cut = t => (t.length > 110 ? t.slice(0, 110) + '…' : t).trim()
  let out = `      ${onlyDb.length} ligne(s) seulement en base, ${onlyCode.length} seulement dans le code`
  if (onlyDb[0] !== undefined) out += `\n      base : ${cut(onlyDb[0])}`
  if (onlyCode[0] !== undefined) out += `\n      code : ${cut(onlyCode[0])}`
  return out
}

async function getFormationId(slug) {
  const { data, error } = await supabase
    .from('formations')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw new Error(`lecture de la formation impossible : ${error.message}`)
  return data?.id ?? null
}

async function seedFormation(slug) {
  console.log(`\n→ ${slug}`)
  const content = await loadContent(slug)
  const formationId = await getFormationId(slug)
  if (!formationId) {
    console.log(`  ! formations row not found for "${slug}", skipping`)
    return { skipped: true }
  }

  // Update objectifs on formations
  if (!DRY_RUN && Array.isArray(content.objectifs) && content.objectifs.length > 0) {
    const { error } = await supabase
      .from('formations')
      .update({ objectifs: content.objectifs })
      .eq('id', formationId)
    if (error) { errors += 1; console.log('  ! objectifs error:', error.message) }
  }

  let totalLessons = 0
  let changed = 0
  let created = 0
  for (const mod of content.modules ?? []) {
    const { data: existingModule, error: readModErr } = await supabase
      .from('formation_modules')
      .select('id, title')
      .eq('formation_id', formationId)
      .eq('module_number', mod.id)
      .maybeSingle()
    if (readModErr) throw new Error(`lecture du module ${mod.id} impossible : ${readModErr.message}`)

    let moduleId = existingModule?.id ?? null
    const existingLessons = new Map()
    if (moduleId) {
      const { data: rows, error: readLessonsErr } = await supabase
        .from('formation_lessons')
        .select('lesson_number, title, content')
        .eq('module_id', moduleId)
      if (readLessonsErr) throw new Error(`lecture des leçons du module ${mod.id} impossible : ${readLessonsErr.message}`)
      for (const r of rows ?? []) existingLessons.set(r.lesson_number, r)
      if (FIND) {
        for (const r of rows ?? []) {
          const text = `${r.title}\n${r.content ?? ''}`
          const hits = [...text.matchAll(FIND)].slice(0, 3)
          if (hits.length === 0) continue
          found += 1
          console.log(`  ? ${mod.id}.${r.lesson_number} ${r.title}`)
          for (const h of hits) {
            const i = h.index ?? 0
            console.log(`      « …${text.slice(Math.max(0, i - 60), i + 60).replace(/\s+/g, ' ').trim()}… »`)
          }
        }
      }
    }

    if (!DRY_RUN) {
      const { data: moduleRow, error: modErr } = await supabase
        .from('formation_modules')
        .upsert(
          {
            formation_id: formationId,
            module_number: mod.id,
            title: mod.title,
            duration: mod.duration ?? null,
          },
          { onConflict: 'formation_id,module_number' }
        )
        .select('id')
        .single()

      if (modErr || !moduleRow) {
        errors += 1
        console.log(`  ! module ${mod.id} error:`, modErr?.message)
        continue
      }
      moduleId = moduleRow.id
    }

    for (const lesson of mod.lessons ?? []) {
      const before = existingLessons.get(lesson.id)
      const nextContent = lesson.content ?? ''
      if (before && before.title === lesson.title && (before.content ?? '') === nextContent) {
        totalLessons += 1
        continue
      }
      if (before) {
        changed += 1
        console.log(`  ~ ${mod.id}.${lesson.id} ${lesson.title}${before.title !== lesson.title ? ` (titre en base : ${before.title})` : ''}`)
        if (DRY_RUN) console.log(describeDiff(before.content ?? '', nextContent))
      } else {
        created += 1
        console.log(`  + ${mod.id}.${lesson.id} ${lesson.title}`)
      }
      if (DRY_RUN) { totalLessons += 1; continue }

      const { error: lessonErr } = await supabase
        .from('formation_lessons')
        .upsert(
          {
            module_id: moduleId,
            lesson_number: lesson.id,
            title: lesson.title,
            duration: lesson.duration ?? null,
            content: nextContent,
          },
          { onConflict: 'module_id,lesson_number' }
        )

      if (lessonErr) {
        errors += 1
        console.log(`  ! lesson ${mod.id}.${lesson.id} error:`, lessonErr.message)
      } else {
        totalLessons += 1
      }
    }
  }

  console.log(`  ${DRY_RUN ? 'aperçu' : '✓'} : ${changed} leçon(s) modifiée(s), ${created} nouvelle(s), ${totalLessons - changed - created} identique(s)`)
  return { modules: content.modules?.length ?? 0, lessons: totalLessons, changed, created }
}

async function main() {
  const slugs = listSlugDirs()
  console.log(`Found ${slugs.length} formations with content.ts`)

  let totalModules = 0
  let totalLessons = 0
  let skipped = 0
  let changed = 0
  let created = 0
  if (DRY_RUN) console.log('Mode aperçu (DRY_RUN) : rien ne sera écrit en base.')
  if (ONLY.length > 0 && slugs.length !== ONLY.length) {
    console.error(`Formation(s) introuvable(s) : ${ONLY.filter(x => !slugs.includes(x)).join(', ')}`)
    errors += 1
  }
  for (const slug of slugs) {
    try {
      const r = await seedFormation(slug)
      if (r.skipped) skipped += 1
      totalModules += r.modules ?? 0
      totalLessons += r.lessons ?? 0
      changed += r.changed ?? 0
      created += r.created ?? 0
    } catch (e) {
      errors += 1
      console.error(`✗ ${slug}:`, e.message)
    }
  }

  console.log(`\n=== Done ===`)
  console.log(`Formations seeded: ${slugs.length - skipped} / ${slugs.length}`)
  console.log(`Modules upserted:  ${totalModules}`)
  console.log(`Lessons upserted:  ${totalLessons}`)
  console.log(`${DRY_RUN ? 'Would change' : 'Changed'}: ${changed} lesson(s), ${DRY_RUN ? 'would create' : 'created'}: ${created}`)
  if (FIND) console.log(`Motif « ${process.env.FIND} » trouvé en base dans ${found} leçon(s)`)
  if (errors > 0) {
    console.error(`${errors} erreur(s)`)
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
