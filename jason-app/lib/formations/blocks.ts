// Contenu des leçons de formation : Markdown simple + blocs riches (23/11/2026).
//
// Le texte d'une leçon (content.ts ou base formation_lessons.content) est
// découpé en blocs typés, affichés par components/formations/LessonContent.tsx.
// Format complet et règles d'écriture : docs/claude/formations.md.
//
// Markdown reconnu : `## ` et `### ` titres, `- ` liste, `1. ` étapes,
// `✅ ` / `❌ ` liste à faire / à éviter, `→ ` liste fléchée, `> ` citation
// (sources), `| a | b |` tableau, ``` bloc de texte, ligne en MAJUSCULES =
// intertitre. Les lignes consécutives forment UN paragraphe (une ligne vide
// sépare deux paragraphes).
//
// Blocs riches, ouverts par `:::nom` et fermés par `:::` :
//   :::bref       liste de 2 à 4 points (« En bref », en tête de leçon)
//   :::retenir    texte (encadré « À retenir »)
//   :::erreur     texte (encadré « Erreur fréquente »)
//   :::exemple    texte (encadré « Exemple chiffré »)
//   :::astuce     texte (encadré « Astuce »)
//   :::chiffres   lignes `valeur | libellé` (chiffres clés en grand)
//   :::quiz       `? question`, `- mauvaise réponse`, `* bonne réponse`,
//                 `= explication` (une question par bloc)
//   :::action     `titre:`, `texte:`, `lien:`, `bouton:` (passer à l'action)

export type Inline = string

export type Block =
  | { type: 'h2'; text: string; id: string }
  | { type: 'h3'; text: string; id: string }
  | { type: 'label'; text: string }
  | { type: 'p'; text: Inline }
  | { type: 'list'; style: 'dot' | 'good' | 'bad' | 'arrow'; items: Inline[] }
  | { type: 'steps'; items: Inline[] }
  | { type: 'quote'; text: Inline; source: boolean }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'pre'; text: string }
  | { type: 'bref'; items: Inline[] }
  | { type: 'callout'; kind: 'retenir' | 'erreur' | 'exemple' | 'astuce'; text: Inline[] }
  | { type: 'figures'; items: Array<{ value: string; label: string }> }
  | { type: 'quiz'; index: number; question: string; options: Array<{ text: string; correct: boolean }>; explanation: string }
  | { type: 'action'; title: string; text: string; href: string | null; button: string | null }

export function headingId(text: string): string {
  return 'h-' + text.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

const CALLOUTS = new Set(['retenir', 'erreur', 'exemple', 'astuce'])

function isUpperLabel(line: string): boolean {
  const t = line.trim()
  if (t.length < 4 || t.length > 70) return false
  const letters = t.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, '')
  if (letters.length < 4) return false
  // Majuscules (parenthèse finale en minuscules tolérée : « CHARGES FIXES (même si vide) »)
  const head = t.replace(/\(.*\)\s*$/, '').replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, '')
  return head.length >= 6 && head === head.toUpperCase()
}

function listStyle(line: string): 'dot' | 'good' | 'bad' | 'arrow' | 'step' | null {
  if (line.startsWith('- ')) return 'dot'
  if (line.startsWith('✅ ')) return 'good'
  if (line.startsWith('❌ ')) return 'bad'
  if (line.startsWith('→ ')) return 'arrow'
  if (/^\d+[.)] /.test(line)) return 'step'
  return null
}

function stripList(line: string): string {
  return line.replace(/^(- |✅ |❌ |→ |\d+[.)] )/, '').trim()
}

function parseRich(name: string, body: string[], quizIndex: number): Block | null {
  const lines = body.map(l => l.trim()).filter(Boolean)
  if (name === 'bref') {
    return { type: 'bref', items: lines.map(stripList) }
  }
  if (CALLOUTS.has(name)) {
    return { type: 'callout', kind: name as 'retenir', text: joinParagraphs(body) }
  }
  if (name === 'chiffres') {
    return {
      type: 'figures',
      items: lines.map(l => {
        const [value, ...rest] = l.split('|')
        return { value: value.trim(), label: rest.join('|').trim() }
      }).filter(i => i.value),
    }
  }
  if (name === 'quiz') {
    let question = ''
    let explanation = ''
    const options: Array<{ text: string; correct: boolean }> = []
    for (const l of lines) {
      if (l.startsWith('? ')) question = l.slice(2).trim()
      else if (l.startsWith('* ')) options.push({ text: l.slice(2).trim(), correct: true })
      else if (l.startsWith('- ')) options.push({ text: l.slice(2).trim(), correct: false })
      else if (l.startsWith('= ')) explanation = explanation ? `${explanation} ${l.slice(2).trim()}` : l.slice(2).trim()
    }
    if (!question || options.length < 2 || !options.some(o => o.correct)) return null
    return { type: 'quiz', index: quizIndex, question, options, explanation }
  }
  if (name === 'action') {
    const get = (k: string) => {
      const l = lines.find(x => x.toLowerCase().startsWith(k + ':'))
      return l ? l.slice(k.length + 1).trim() : ''
    }
    const title = get('titre')
    if (!title) return null
    const href = get('lien')
    return { type: 'action', title, text: get('texte'), href: href || null, button: get('bouton') || null }
  }
  return null
}

/** Lignes d'un encadré : lignes consécutives = un paragraphe. */
function joinParagraphs(body: string[]): string[] {
  const out: string[] = []
  let cur: string[] = []
  for (const raw of body) {
    const l = raw.trim()
    if (!l) { if (cur.length) { out.push(cur.join(' ')); cur = [] } continue }
    cur.push(l)
  }
  if (cur.length) out.push(cur.join(' '))
  return out
}

export function parseLesson(content: string): Block[] {
  const lines = (content ?? '').replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let para: string[] = []
  let quizIndex = 0
  const flush = () => {
    if (para.length) { blocks.push({ type: 'p', text: para.join(' ') }); para = [] }
  }

  let i = 0
  while (i < lines.length) {
    const raw = lines[i]
    const line = raw.trimEnd()
    const t = line.trim()

    // Bloc riche
    const open = /^:::([a-z]+)\s*$/.exec(t)
    if (open) {
      flush()
      const body: string[] = []
      i++
      while (i < lines.length && lines[i].trim() !== ':::') { body.push(lines[i]); i++ }
      i++ // ligne de fermeture
      const b = parseRich(open[1], body, quizIndex)
      if (b) {
        if (b.type === 'quiz') quizIndex++
        blocks.push(b)
      }
      continue
    }

    if (!t) { flush(); i++; continue }

    if (t.startsWith('## ')) { flush(); const x = t.slice(3).trim(); blocks.push({ type: 'h2', text: x, id: headingId(x) }); i++; continue }
    if (t.startsWith('### ')) { flush(); const x = t.slice(4).trim(); blocks.push({ type: 'h3', text: x, id: headingId(x) }); i++; continue }

    if (t.startsWith('```')) {
      flush()
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) { code.push(lines[i]); i++ }
      i++
      blocks.push({ type: 'pre', text: code.join('\n') })
      continue
    }

    if (t.startsWith('|')) {
      flush()
      const rows: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i].trim()); i++ }
      const cells = (r: string) => r.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim())
      const body = rows.slice(1).filter(r => !/^\|[\s|:-]+\|?$/.test(r))
      blocks.push({ type: 'table', headers: cells(rows[0]), rows: body.map(cells) })
      continue
    }

    if (t.startsWith('> ')) {
      flush()
      const text = t.slice(2).trim()
      blocks.push({ type: 'quote', text, source: /^sources?\s*:/i.test(text) })
      i++
      continue
    }

    const ls = listStyle(t)
    if (ls) {
      flush()
      const items: string[] = []
      while (i < lines.length) {
        const cur = lines[i].trim()
        const s = listStyle(cur)
        if (s === ls) { items.push(stripList(cur)); i++; continue }
        // Ligne de suite indentée d'un élément (« → Toujours plein, mais »  /  « en basse saison »)
        if (!s && cur && /^\s{2,}/.test(lines[i]) && items.length) { items[items.length - 1] += ' ' + cur; i++; continue }
        break
      }
      if (ls === 'step') blocks.push({ type: 'steps', items })
      else blocks.push({ type: 'list', style: ls, items })
      continue
    }

    if (isUpperLabel(t) && !t.endsWith('.')) { flush(); blocks.push({ type: 'label', text: t }); i++; continue }

    para.push(t)
    i++
  }
  flush()
  return blocks
}

/** Nombre de questions d'une leçon (0 = ancienne leçon, terminée par le bouton). */
export function countQuiz(content: string): number {
  return parseLesson(content).filter(b => b.type === 'quiz').length
}

/** Durée de lecture estimée (230 mots par minute, 1 min au moins). */
export function readingMinutes(content: string): number {
  const words = (content ?? '').replace(/:::[a-z]*|[#>|*`]/g, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 230))
}
