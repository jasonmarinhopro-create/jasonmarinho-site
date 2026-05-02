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
 *
 * After a successful run, the content.ts files become a fallback only,
 * and could be slimmed down (modules + lessons content removed) in a
 * follow-up PR to reduce bundle size.
 */

import { createClient } from '@supabase/supabase-js'
import { readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { register } from 'node:module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FORMATIONS_DIR = join(__dirname, '..', 'app', 'dashboard', 'formations')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.')
  process.exit(1)
}

// Register tsx loader so we can dynamically import .ts files
try {
  register('tsx/esm', pathToFileURL('./'))
} catch {
  console.error('Could not register tsx loader. Run: npm i -D tsx')
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
}

async function loadContent(slug) {
  const path = pathToFileURL(join(FORMATIONS_DIR, slug, 'content.ts')).href
  const mod = await import(path)
  const exported = Object.values(mod).find(v => v && typeof v === 'object' && 'modules' in v)
  if (!exported) throw new Error(`No formation export found in ${slug}/content.ts`)
  return exported
}

async function getFormationId(slug) {
  const { data } = await supabase
    .from('formations')
    .select('id')
    .eq('slug', slug)
    .single()
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
  if (Array.isArray(content.objectifs) && content.objectifs.length > 0) {
    await supabase
      .from('formations')
      .update({ objectifs: content.objectifs })
      .eq('id', formationId)
  }

  let totalLessons = 0
  for (const mod of content.modules ?? []) {
    // Upsert module
    const { data: moduleRow, error: modErr } = await supabase
      .from('formation_modules')
      .upsert(
        {
          formation_id: formationId,
          module_number: mod.id,
          title: mod.title,
          duration: mod.duration ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'formation_id,module_number' }
      )
      .select('id')
      .single()

    if (modErr || !moduleRow) {
      console.log(`  ! module ${mod.id} error:`, modErr?.message)
      continue
    }

    for (const lesson of mod.lessons ?? []) {
      const { error: lessonErr } = await supabase
        .from('formation_lessons')
        .upsert(
          {
            module_id: moduleRow.id,
            lesson_number: lesson.id,
            title: lesson.title,
            duration: lesson.duration ?? null,
            content: lesson.content ?? '',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'module_id,lesson_number' }
        )

      if (lessonErr) {
        console.log(`  ! lesson ${mod.id}.${lesson.id} error:`, lessonErr.message)
      } else {
        totalLessons += 1
      }
    }
  }

  console.log(`  ✓ ${content.modules?.length ?? 0} modules, ${totalLessons} leçons`)
  return { modules: content.modules?.length ?? 0, lessons: totalLessons }
}

async function main() {
  const slugs = listSlugDirs()
  console.log(`Found ${slugs.length} formations with content.ts`)

  let totalModules = 0
  let totalLessons = 0
  let skipped = 0
  for (const slug of slugs) {
    try {
      const r = await seedFormation(slug)
      if (r.skipped) skipped += 1
      totalModules += r.modules ?? 0
      totalLessons += r.lessons ?? 0
    } catch (e) {
      console.error(`✗ ${slug}:`, e.message)
    }
  }

  console.log(`\n=== Done ===`)
  console.log(`Formations seeded: ${slugs.length - skipped} / ${slugs.length}`)
  console.log(`Modules upserted:  ${totalModules}`)
  console.log(`Lessons upserted:  ${totalLessons}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
