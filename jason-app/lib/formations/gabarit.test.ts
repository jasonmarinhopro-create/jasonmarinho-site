import { describe, it, expect } from 'vitest'
import { FORMATION_CONTENT_MAP } from '@/app/dashboard/admin/formations/[slug]/contentMap'
import { parseLesson } from './blocks'

// Gabarit des formations (23/11/2026, docs/claude/formations.md). Toute
// formation au nouveau format est vérifiée ici ; une NOUVELLE formation doit
// l'être dès sa création. Les anciennes, en cours de conversion, sont listées
// dans A_CONVERTIR : en retirer le slug une fois la formation convertie.
const A_CONVERTIR = new Set([
  'creer-conciergerie-lcd', 'fiscalite-statut-conciergerie-tourisme', 'maitriser-booking-com-algorithme-genius',
  'photographie-lcd-smartphone', 'gerer-incidents-litiges-lcd', 'annonce-360', 'audit-annonce',
  'declarer-lmnp-seul-decla-fr', 'louer-en-direct-securise',
])

const slugs = Object.keys(FORMATION_CONTENT_MAP).filter(s => !A_CONVERTIR.has(s))

describe('gabarit des formations', () => {
  it('la liste à convertir ne contient que des formations existantes', () => {
    for (const s of A_CONVERTIR) expect(FORMATION_CONTENT_MAP[s], s).toBeTruthy()
  })

  it.each(slugs)('%s suit le gabarit', slug => {
    const f = FORMATION_CONTENT_MAP[slug]
    expect(f.objectifs.length, 'objectifs').toBeGreaterThanOrEqual(3)
    const ids = new Set<number>()
    for (const m of f.modules) {
      expect(m.lessons.length, `module ${m.id} : 1 à 5 leçons`).toBeGreaterThanOrEqual(1)
      expect(m.lessons.length).toBeLessThanOrEqual(5)
      m.lessons.forEach((l, i) => {
        const where = `${slug} leçon ${l.id}`
        expect(ids.has(l.id), `${where} : identifiant unique`).toBe(false)
        ids.add(l.id)
        const blocks = parseLesson(l.content)
        const bref = blocks.find(b => b.type === 'bref')
        expect(bref, `${where} : bloc En bref`).toBeTruthy()
        if (bref && bref.type === 'bref') {
          expect(bref.items.length, `${where} : 2 à 4 points dans En bref`).toBeGreaterThanOrEqual(2)
          expect(bref.items.length).toBeLessThanOrEqual(4)
        }
        const quiz = blocks.filter(b => b.type === 'quiz').length
        expect(quiz, `${where} : 2 ou 3 questions valides`).toBeGreaterThanOrEqual(2)
        expect(quiz).toBeLessThanOrEqual(3)
        const actions = blocks.filter(b => b.type === 'action')
        if (i === m.lessons.length - 1) {
          expect(actions.length, `${where} : action de fin de module`).toBe(1)
        } else {
          expect(actions.length, `${where} : action seulement en fin de module`).toBe(0)
        }
        for (const a of actions) {
          if (a.type === 'action' && a.href) expect(a.href.startsWith('/dashboard/'), `${where} : lien de l'action dans l'app`).toBe(true)
        }
        expect(l.content.includes('—'), `${where} : pas de tiret cadratin`).toBe(false)
        expect(/^-{3,}$/m.test(l.content), `${where} : pas de ligne ---`).toBe(false)
        expect(/^# /m.test(l.content), `${where} : pas de titre de niveau 1`).toBe(false)
        expect(/[\u{1F300}-\u{1FAFF}☀-⛿]/u.test(l.content), `${where} : pas d'émoji`).toBe(false)
      })
    }
  })
})
