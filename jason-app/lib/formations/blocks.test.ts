import { describe, it, expect } from 'vitest'
import { parseLesson, countQuiz, readingMinutes, headingId } from './blocks'

describe('parseLesson', () => {
  it('lignes consécutives : un paragraphe qui garde ses retours à la ligne', () => {
    const b = parseLesson('45% des propriétaires sous-évaluent\nou surévaluent leurs tarifs.\n\nDeuxième.')
    expect(b).toEqual([
      { type: 'p', text: '45% des propriétaires sous-évaluent\nou surévaluent leurs tarifs.' },
      { type: 'p', text: 'Deuxième.' },
    ])
  })

  it('titres avec identifiant, intertitre en majuscules', () => {
    const b = parseLesson('## Le piège du prix fixe\nCHARGES FIXES (même si le logement est vide)\nTexte')
    expect(b[0]).toEqual({ type: 'h2', text: 'Le piège du prix fixe', id: 'h-le-piege-du-prix-fixe' })
    expect(b[1]).toEqual({ type: 'label', text: 'CHARGES FIXES (même si le logement est vide)' })
    expect(b[2]).toEqual({ type: 'p', text: 'Texte' })
  })

  it('listes : puces, à faire, flèches avec ligne de suite, étapes', () => {
    const b = parseLesson('- a\n- b\n✅ oui\n❌ non\n→ Toujours plein, mais\n  en basse saison\n1. un\n2. deux')
    expect(b).toEqual([
      { type: 'list', style: 'dot', items: ['a', 'b'] },
      { type: 'compare', good: ['oui'], bad: ['non'] },
      { type: 'list', style: 'arrow', items: ['Toujours plein, mais en basse saison'] },
      { type: 'steps', items: ['un', 'deux'] },
    ])
  })

  it('tableau sans la ligne de séparation, citation source', () => {
    const b = parseLesson('| A | B |\n| --- | --- |\n| 1 | 2 |\n> Source : Insee, 2025')
    expect(b[0]).toEqual({ type: 'table', headers: ['A', 'B'], rows: [['1', '2']] })
    expect(b[1]).toEqual({ type: 'quote', text: 'Source : Insee, 2025', source: true })
  })

  it('blocs riches : bref, encadré, chiffres, action', () => {
    const b = parseLesson([
      ':::bref', '- un', '- deux', ':::',
      ':::erreur', 'Copier le prix', 'du voisin.', ':::',
      ':::chiffres', '1 240 € | charges fixes', '18 | nuits', ':::',
      ':::action', 'titre: Calcule ton prix', 'texte: Ton logement est choisi.', 'lien: /dashboard/calculateurs', 'bouton: Ouvrir', ':::',
    ].join('\n'))
    expect(b).toEqual([
      { type: 'bref', items: ['un', 'deux'] },
      { type: 'callout', kind: 'erreur', text: ['Copier le prix du voisin.'] },
      { type: 'figures', items: [{ value: '1 240 €', label: 'charges fixes' }, { value: '18', label: 'nuits' }] },
      { type: 'action', title: 'Calcule ton prix', text: 'Ton logement est choisi.', href: '/dashboard/calculateurs', button: 'Ouvrir' },
    ])
  })

  it('quiz numérotés dans l\'ordre, quiz invalide ignoré', () => {
    const c = [
      ':::quiz', '? Combien ?', '- 45 €', '* 60 €', '= 900 / 15 = 60.', ':::',
      ':::quiz', '? Sans bonne réponse', '- a', '- b', ':::',
      ':::quiz', '? Vrai ?', '* Oui', '- Non', ':::',
    ].join('\n')
    const q = parseLesson(c).filter(b => b.type === 'quiz')
    expect(q).toHaveLength(2)
    expect(q[0]).toEqual({ type: 'quiz', index: 0, question: 'Combien ?', options: [{ text: '45 €', correct: false }, { text: '60 €', correct: true }], explanation: '900 / 15 = 60.' })
    expect((q[1] as { index: number }).index).toBe(1)
    expect(countQuiz(c)).toBe(2)
  })

  it('durée de lecture et identifiant de titre', () => {
    expect(readingMinutes('mot '.repeat(460))).toBe(2)
    expect(readingMinutes('')).toBe(1)
    expect(headingId('Écrire à ses voyageurs !')).toBe('h-ecrire-a-ses-voyageurs')
  })

  it('cartes numérotées en grille, liste rattachée à la carte', () => {
    const b = parseLesson('**① Nom**\nTon vrai nom.\n\n**② Services**\nListe :\n- Ménage\n- Accueil\n\n**③ Description** (voir leçon 6)')
    expect(b).toHaveLength(1)
    const g = b[0] as { type: string; items: Array<{ num: string; title: string; note: string; body: string[]; list: unknown }> }
    expect(g.type).toBe('cards')
    expect(g.items.map(c => c.num)).toEqual(['1', '2', '3'])
    expect(g.items[1].list).toEqual({ style: 'dot', items: ['Ménage', 'Accueil'] })
    expect(g.items[2]).toMatchObject({ title: 'Description', note: '(voir leçon 6)', body: [] })
  })

  it('à faire / à éviter côte à côte, encadrés repérés, message type, phrase clé', () => {
    const b = parseLesson([
      '✅ Répondre vite', '❌ Ignorer', '',
      '**Exemple :** 100 € la nuit.', '',
      '> **Piège :** oublier la taxe.', '',
      '> *« Bonjour, voici le code. »*', '> *Bonne arrivée.*', '',
      '> Une photo vaut **mille mots**.',
    ].join('\n'))
    expect(b[0]).toEqual({ type: 'compare', good: ['Répondre vite'], bad: ['Ignorer'] })
    expect(b[1]).toEqual({ type: 'callout', kind: 'exemple', title: 'Exemple', text: ['100 € la nuit.'] })
    expect(b[2]).toEqual({ type: 'callout', kind: 'erreur', title: 'Piège', text: ['oublier la taxe.'] })
    expect(b[3]).toEqual({ type: 'message', lines: ['*« Bonjour, voici le code. »*', '*Bonne arrivée.*'] })
    expect(b[4]).toEqual({ type: 'punch', text: 'Une photo vaut **mille mots**.' })
  })

  it('titre numéroté en pastille, exercice encadré', () => {
    const b = parseLesson('### Étape 2, Contacter le voyageur\nTexte.\n### Exercice, action immédiate\nFais-le.\n- a')
    expect(b[0]).toMatchObject({ type: 'h3', text: 'Contacter le voyageur', badge: 'Étape 2' })
    expect(b[2]).toMatchObject({ type: 'exercise', title: 'action immédiate' })
    expect((b[2] as { blocks: unknown[] }).blocks).toHaveLength(2)
  })
})
