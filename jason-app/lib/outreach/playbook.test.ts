import { describe, it, expect } from 'vitest'
import { PLAYBOOK, PLAYBOOK_TEXT_FIXES } from './playbook'
import { renderTemplate, STAGES } from './engine'

describe('séquences proposées', () => {
  it('clés uniques et enchaînements valides', () => {
    const keys = PLAYBOOK.map(p => p.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const p of PLAYBOOK) if (p.then_key) expect(keys).toContain(p.then_key)
  })
  it('étapes déclencheuses et finales connues', () => {
    const stages = STAGES.map(s => s.key)
    for (const p of PLAYBOOK) {
      if (p.trigger === 'etape') expect(stages).toContain(p.trigger_stage)
      if (p.end_stage) expect(stages).toContain(p.end_stage)
      expect(p.steps.length).toBeGreaterThan(0)
    }
  })
  it('textes sans tiret cadratin, emoji ni variable inconnue', () => {
    for (const p of PLAYBOOK) for (const st of p.steps) {
      const all = `${st.subject}\n${st.body}`
      expect(all).not.toMatch(/—/)
      expect(all).not.toMatch(/\p{Extended_Pictographic}/u)
      const vars = Array.from(all.matchAll(/\{(?:[^{}]*\s)?([a-z_]+)\}/g)).map(m => m[1])
      for (const v of vars) expect(['prenom', 'nom', 'entreprise', 'ville']).toContain(v)
      // Rendu sans aucune variable : pas de « {  } » ni d'espace avant une virgule
      const bare = renderTemplate(all, {})
      expect(bare).not.toMatch(/[{}]/)
      expect(bare).not.toMatch(/ ,/)
    }
  })
  it('premier e-mail court (moins de 170 mots)', () => {
    for (const p of PLAYBOOK) {
      const words = p.steps[0].body.split(/\s+/).length
      expect(words).toBeLessThan(170)
    }
  })
  it('corrections en base : sans effet sur les textes à jour et rejouables', () => {
    const fix = (t: string) => PLAYBOOK_TEXT_FIXES.reduce((acc, [a, b]) => acc.split(a).join(b), t)
    for (const p of PLAYBOOK) for (const st of p.steps) {
      expect(fix(st.subject)).toBe(st.subject)
      expect(fix(st.body)).toBe(st.body)
    }
    for (const [a] of PLAYBOOK_TEXT_FIXES) expect(fix(fix(a))).toBe(fix(a))
  })
  it('photographes : les vidéastes sont cités dans chaque séquence de prospection', () => {
    for (const p of PLAYBOOK.filter(x => x.audience === 'photographe' && x.key !== 'photo_premiers_pas')) {
      expect(p.steps.some(st => /vidéo/.test(st.subject + st.body))).toBe(true)
    }
  })
})
