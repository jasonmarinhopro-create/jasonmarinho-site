import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

// React échappe ' " & < > dans <style>{`...`}</style> : CSS cassé côté serveur
// + erreur d'hydratation. Ces caractères doivent passer par
// components/ui/InlineStyle.tsx (voir le commentaire du composant).

function tsxFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'zz-preview') continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) tsxFiles(p, out)
    else if (p.endsWith('.tsx')) out.push(p)
  }
  return out
}

describe('balises <style> inline', () => {
  it("aucun caractère échappé par React (' \" & < >) dans <style>{`...`}</style>", () => {
    const offenders: string[] = []
    for (const f of [...tsxFiles('app'), ...tsxFiles('components')]) {
      const src = readFileSync(f, 'utf8')
      for (const m of src.matchAll(/<style>\{`([\s\S]*?)`\}<\/style>/g)) {
        const css = m[1].replace(/\$\{[^}]*\}/g, '')
        if (/['"&<>]/.test(css)) offenders.push(f)
      }
    }
    expect(offenders).toEqual([])
  })
})
