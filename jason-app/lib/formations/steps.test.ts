import { describe, it, expect } from 'vitest'
import { parseLesson } from './blocks'
import { lessonSteps, stepLabel } from './steps'

describe('lessonSteps', () => {
  it('bref en 1re étape, une étape par titre, questions puis action à la fin', () => {
    const b = parseLesson([
      ':::bref', '- a', '- b', ':::',
      '## Un', 'Texte un.',
      ':::quiz', '? Q1', '* oui', '- non', ':::',
      '## Deux', 'Texte deux.',
      ':::action', 'titre: Agir', ':::',
      ':::quiz', '? Q2', '* oui', '- non', ':::',
    ].join('\n'))
    const s = lessonSteps(b)
    expect(s.map(x => x.kind)).toEqual(['content', 'content', 'content', 'quiz', 'quiz', 'action'])
    expect(s.map(stepLabel)).toEqual(['En bref', 'Un', 'Deux', 'Vérifie', 'Vérifie', "Passe à l'action"])
  })
  it('leçon ancienne sans bref ni question : étapes par titre seulement', () => {
    const s = lessonSteps(parseLesson('Intro.\n## A\nx\n## B\ny'))
    expect(s.map(stepLabel)).toEqual(['Introduction', 'A', 'B'])
  })
  it('titre sans contenu ignoré', () => {
    const s = lessonSteps(parseLesson('## Vide\n## Plein\ntexte'))
    expect(s.map(stepLabel)).toEqual(['Plein'])
  })
})
