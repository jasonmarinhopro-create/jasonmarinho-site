// Découpage d'une leçon en étapes plein écran (refonte du 23/11/2026) :
// chaque titre « ## » ouvre une étape ; le bloc « En bref » et ce qui précède
// le premier titre forment la 1re étape ; chaque question devient sa propre
// étape (à la fin) ; l'action de fin de module est la dernière étape.
// Calcul pur (test à côté).
import type { Block } from './blocks'

export type Step =
  | { kind: 'content'; title: string | null; blocks: Block[] }
  | { kind: 'quiz'; quiz: Extract<Block, { type: 'quiz' }> }
  | { kind: 'action'; action: Extract<Block, { type: 'action' }> }

export function lessonSteps(blocks: Block[]): Step[] {
  const steps: Step[] = []
  const quizzes: Step[] = []
  let actionStep: Step | null = null
  let cur: { kind: 'content'; title: string | null; blocks: Block[] } | null = null
  const push = () => { if (cur && cur.blocks.length) steps.push(cur); cur = null }

  for (const b of blocks) {
    if (b.type === 'quiz') { quizzes.push({ kind: 'quiz', quiz: b }); continue }
    if (b.type === 'action') { actionStep = { kind: 'action', action: b }; continue }
    if (b.type === 'h2') {
      push()
      cur = { kind: 'content', title: b.text, blocks: [] }
      continue
    }
    if (!cur) cur = { kind: 'content', title: null, blocks: [] }
    cur.blocks.push(b)
  }
  push()
  // Une étape de titre seul (sans contenu) est fusionnée avec la suivante
  return [...steps, ...quizzes, ...(actionStep ? [actionStep] : [])]
}

/** Libellé court d'une étape (sommaire de la leçon). */
export function stepLabel(s: Step): string {
  if (s.kind === 'quiz') return 'Vérifie'
  if (s.kind === 'action') return "Passe à l'action"
  if (s.title) return s.title
  return s.blocks.some(b => b.type === 'bref') ? 'En bref' : 'Introduction'
}
