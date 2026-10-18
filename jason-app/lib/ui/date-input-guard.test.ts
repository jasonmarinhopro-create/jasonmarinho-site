import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Décision de Jason (18/10/2026) : l'agenda du navigateur est à bannir. Dans l'app,
// toujours CalendarInput (components/ui/CalendarInput.tsx) ; sur le site, /calendrier.js.
const ROOT = join(__dirname, '..', '..')

function files(dir: string, ext: RegExp, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) files(p, ext, out)
    else if (ext.test(name)) out.push(p)
  }
  return out
}

describe('calendrier maison partout', () => {
  it('aucun <input type="date"> dans l’app', () => {
    const bad = [...files(join(ROOT, 'app'), /\.tsx$/), ...files(join(ROOT, 'components'), /\.tsx$/)]
      .filter(f => /<input[\s\S]{0,300}?type=["']date["']/.test(readFileSync(f, 'utf8')))
    expect(bad).toEqual([])
  })
  it('les générateurs du site n’écrivent pas de champ date du navigateur', () => {
    const bad = files(join(ROOT, '..', 'scripts'), /\.mjs$/)
      .filter(f => /<input[^>]*type=["']date["']/.test(readFileSync(f, 'utf8')))
    expect(bad).toEqual([])
  })
})
