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

export type ListStyle = 'dot' | 'good' | 'bad' | 'arrow'
export type CalloutKind = 'retenir' | 'erreur' | 'exemple' | 'astuce'
export interface CardBlock {
  type: 'card'
  num: string | null          // « 1 », « A »… (cercle numéroté)
  title: string
  note: string                // précision après le titre en gras : « (voir leçon 6) »
  body: Inline[]
  list: { style: ListStyle | 'step'; items: Inline[] } | null
}

export type Block =
  | { type: 'h2'; text: string; id: string }
  | { type: 'h3'; text: string; id: string; badge?: string }
  | { type: 'label'; text: string }
  | { type: 'p'; text: Inline }
  | { type: 'list'; style: ListStyle; items: Inline[] }
  | { type: 'steps'; items: Inline[] }
  | { type: 'quote'; text: Inline; source: boolean }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'pre'; text: string }
  | { type: 'bref'; items: Inline[] }
  | { type: 'callout'; kind: CalloutKind; text: Inline[]; title?: string; list?: { style: ListStyle | 'step'; items: Inline[] } }
  | CardBlock
  | { type: 'cards'; items: CardBlock[] }
  | { type: 'compare'; good: Inline[]; bad: Inline[] }
  | { type: 'message'; lines: Inline[] }
  | { type: 'punch'; text: Inline }
  | { type: 'exercise'; title: string | null; blocks: Block[] }
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

/* ───────── Mise en forme automatique (24/11/2026) ─────────
 * Jason : « ce n'est que du texte alors qu'avant c'était vivant ». Sans
 * toucher au texte des 268 leçons, les motifs déjà écrits deviennent des
 * éléments visuels :
 *  - « **① Titre** » suivi de texte (ou d'une liste) : carte numérotée ;
 *    plusieurs à la suite : grille de cartes.
 *  - Liste ✅ suivie d'une liste ❌ (ou l'inverse) : « À faire / À éviter »
 *    côte à côte.
 *  - Citation « > » : message type à copier s'il commence par « « » ;
 *    encadré titré s'il commence par « **Astuce :** », « **Piège :** »… ;
 *    sinon phrase clé surlignée.
 *  - Paragraphe « **Exemple :** … », « **Attention :** … » : encadré.
 *  - Titre « Exercice… » : la suite jusqu'au titre suivant est encadrée.
 *  - Titre « Étape 2, … », « Option B : … » : pastille « Étape 2 ».
 */

const CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'

const BADGE_RE = /^((?:Étape|Etape|Option|Erreur|Cas|Signal|Question|Règle|Méthode|Niveau|Scénario|Piège|Motif|Raison|Catégorie|Issue|Stratégie|Solution|Accessoire|Angle|Hauteur|Photo|Procédure|Preuve|Emplacement|Action|Semaine|Mois|Jour|Phase|Levier|Pilier|Critère|Type|Profil|Outil|Post|Leçon|Module|Point|Astuce|Exemple|Script|Message|Modèle|Plateforme|Canal|Bloc|Partie|Test|Clé|Secret|Conseil|Paragraphe|Système|Mythe|Signe|Vérité|Tâche|Exercice|Priorité)\s+(?:n°\s*)?(?:\d+(?:\s*[-–à]\s*\d+)?|[A-H]))(?:\s*[,:.\-–]\s*|\s+)(.+)$/

function h3Block(text: string): Extract<Block, { type: 'h3' }> {
  const c = CIRCLED.indexOf(text[0])
  if (c >= 0) {
    const rest = text.slice(1).replace(/^[\s,:.\-–]+/, '')
    return { type: 'h3', text: rest, id: headingId(rest), badge: String(c + 1) }
  }
  const m = BADGE_RE.exec(text)
  if (m) return { type: 'h3', text: m[2].trim(), id: headingId(text), badge: m[1] }
  const d = /^(\d{1,2})[.)]\s+(.+)$/.exec(text)
  if (d) return { type: 'h3', text: d[2].trim(), id: headingId(text), badge: d[1] }
  return { type: 'h3', text, id: headingId(text) }
}

function calloutKindOf(label: string, strict: boolean): CalloutKind | null {
  const l = label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (/^(astuce|indice|bonus|reflexe|conseil|tip|bon a savoir|le truc)/.test(l)) return 'astuce'
  if (/^(attention|piege|evite|stop|erreur|danger|risque|interdit|a eviter|ne jamais|jamais)/.test(l)) return 'erreur'
  if (/^(exemple|ex\b|test|effet|resultat|calcul|cas concret|cas reel|concretement|illustration|total|simulation)/.test(l)) return 'exemple'
  if (/^(a retenir|retiens|regle|important|essentiel|conclusion|recommandation|methode|solution|correction|statut optimal|cle|en resume|resume|le principe|principe|strategie|objectif|verdict)/.test(l)) return 'retenir'
  return strict ? null : 'retenir'
}

/** « **Label :** texte » ou « **Label** : texte » */
function splitLabel(line: string): { label: string; rest: string } | null {
  const m = /^\*\*([^*]{2,40}?)\s*:\s*\*\*\s*(.*)$/.exec(line) ?? /^\*\*([^*]{2,40}?)\*\*\s*:\s*(.*)$/.exec(line)
  return m ? { label: m[1].trim(), rest: m[2].trim() } : null
}

function stripMd(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/`([^`]+)`/g, '$1')
}

function quoteBlock(lines: string[]): Block {
  const first = lines[0]
  if (/^\*?\s*[«"“]/.test(first) || /^\*\s*-\s/.test(first)) return { type: 'message', lines }
  if (/^⚠️?\s*/.test(first) && first.startsWith('⚠')) {
    return { type: 'callout', kind: 'erreur', text: [first.replace(/^⚠️?\s*/, ''), ...lines.slice(1)] }
  }
  const lab = splitLabel(first)
  if (lab) {
    const kind = calloutKindOf(lab.label, false)!
    return { type: 'callout', kind, title: lab.label, text: [lab.rest, ...lines.slice(1)].filter(Boolean) }
  }
  // Une phrase entièrement en gras « **Stop.** » : titre de l'encadré
  const bold = /^\*\*([^*]{2,40})\*\*\s*(.*)$/.exec(first)
  if (bold && /[.!]$/.test(bold[1]) && bold[2]) {
    return { type: 'callout', kind: calloutKindOf(bold[1], false)!, title: bold[1].replace(/[.!]$/, ''), text: [bold[2], ...lines.slice(1)] }
  }
  const plain = /^([A-Za-zÀ-ÿ' ]{3,25}?)\s*:\s+(.+)$/.exec(first)
  const pk = plain ? calloutKindOf(plain[1], true) : null
  if (plain && pk) return { type: 'callout', kind: pk, title: plain[1].trim(), text: [plain[2], ...lines.slice(1)] }
  if (lines.length === 1) return { type: 'punch', text: first }
  return { type: 'callout', kind: 'retenir', text: lines }
}

/** Titre en gras en tête de paragraphe : « **① Nom** » ou « **Nom** (voir leçon 6) » */
function boldTitle(line: string): { num: string | null; title: string; note: string } | null {
  const m = /^\*\*([^*]+)\*\*\s*(.*)$/.exec(line)
  if (!m) return null
  const note = m[2].trim()
  if (note.length > 45 || (note && !/^[(\[]/.test(note) && !/^[-–:]/.test(note))) return null
  let title = m[1].trim()
  if (/:\s*$/.test(title) && !note) title = title.replace(/\s*:\s*$/, '')
  let num: string | null = null
  const c = CIRCLED.indexOf(title[0])
  if (c >= 0) { num = String(c + 1); title = title.slice(1).trim() }
  else {
    const d = /^(\d{1,2})[.)]\s+(.+)$/.exec(title)
    if (d) { num = d[1]; title = d[2] }
  }
  return { num, title, note: note.replace(/^[-–:]\s*/, '') }
}

function isHeading(b: Block): b is Extract<Block, { type: 'h2' | 'h3' }> { return b.type === 'h2' || b.type === 'h3' }
const EXERCISE_RE = /^(exercice|exercise|a toi de jouer|action immediate|a faire maintenant|ton plan d.action|mise en pratique|passe a la pratique)/

function enrich(input: Block[]): Block[] {
  const out: Block[] = []
  for (let i = 0; i < input.length; i++) {
    const b = input[i]
    const next = input[i + 1]

    if (b.type === 'p') {
      const lines = b.text.split('\n')
      const lab = splitLabel(lines[0])
      const kind = lab ? calloutKindOf(lab.label, true) : null
      if (lab && kind) {
        const text = [lab.rest, ...lines.slice(1)].filter(Boolean)
        const c: Extract<Block, { type: 'callout' }> = { type: 'callout', kind, title: lab.label, text }
        // « **Évite :** » suivi d'une liste : la liste va dans l'encadré
        if (next && (next.type === 'list' || next.type === 'steps') && (!text.length || /:\s*$/.test(text[text.length - 1]))) {
          c.list = next.type === 'list' ? { style: next.style, items: next.items } : { style: 'step', items: next.items }
          i++
        }
        out.push(c)
        continue
      }
      // « Exemple : … », « Attention : … », « Par exemple, … » sans gras
      const pl = /^([A-Za-zÀ-ÿ' ]{3,25}?)\s*:\s+(.+)$/.exec(lines[0])
      const pk = pl ? calloutKindOf(pl[1], true) : null
      if (pl && pk) {
        out.push({ type: 'callout', kind: pk, title: pl[1].trim(), text: [pl[2], ...lines.slice(1)] })
        continue
      }
      if (/^par exemple\b/i.test(lines[0]) && b.text.length > 60) {
        out.push({ type: 'callout', kind: 'exemple', text: lines })
        continue
      }
      const bt = boldTitle(lines[0])
      if (bt) {
        const body = lines.slice(1)
        let list: CardBlock['list'] = null
        if (next && (next.type === 'list' || next.type === 'steps') && (body.length === 0 || /:\s*$/.test(body[body.length - 1]))) {
          list = next.type === 'list' ? { style: next.style, items: next.items } : { style: 'step', items: next.items }
          i++
        }
        if (!bt.num && !body.length && !list) {
          // Phrase seule en gras : phrase clé si elle se termine par un point, sinon intertitre
          if ((/[.!]$/.test(bt.title) || bt.title.length > 60) && !/\?$/.test(bt.title)) out.push({ type: 'punch', text: `**${bt.title}**` })
          else out.push({ type: 'h3', text: bt.title, id: headingId(bt.title) })
          continue
        }
        out.push({ type: 'card', num: bt.num, title: bt.title, note: bt.note, body, list })
        continue
      }
    }

    if (b.type === 'list' && next && next.type === 'list' &&
        ((b.style === 'good' && next.style === 'bad') || (b.style === 'bad' && next.style === 'good'))) {
      out.push({ type: 'compare', good: b.style === 'good' ? b.items : next.items, bad: b.style === 'bad' ? b.items : next.items })
      i++
      continue
    }

    if (isHeading(b)) {
      const plain = b.text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      if (EXERCISE_RE.test(plain)) {
        const inner: Block[] = []
        let j = i + 1
        while (j < input.length && !isHeading(input[j]) && input[j].type !== 'quiz' && input[j].type !== 'action') { inner.push(input[j]); j++ }
        if (inner.length) {
          if (b.type === 'h2') out.push(b)
          out.push({ type: 'exercise', title: b.type === 'h2' ? null : b.text.replace(/^exercice\s*[,:\-–]?\s*/i, '') || null, blocks: enrich(inner) })
          i = j - 1
          continue
        }
      }
    }
    out.push(b)
  }

  // Cartes qui se suivent : une grille
  const grouped: Block[] = []
  for (const b of out) {
    const last = grouped[grouped.length - 1]
    if (b.type === 'card' && last && (last.type === 'card' || last.type === 'cards')) {
      if (last.type === 'card') grouped[grouped.length - 1] = { type: 'cards', items: [last, b] }
      else last.items.push(b)
      continue
    }
    grouped.push(b)
  }
  return grouped
}

/** Texte brut d'un message type (bouton « Copier »). */
export function plainText(lines: string[]): string {
  return lines.map(l => stripMd(l).replace(/^[«"“]\s*|\s*[»"”]$/g, '').replace(/^-\s/, '- ')).join('\n').trim()
}

export function parseLesson(content: string): Block[] {
  const lines = (content ?? '').replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let para: string[] = []
  let quizIndex = 0
  const flush = () => {
    if (para.length) { blocks.push({ type: 'p', text: para.join('\n') }); para = [] }
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
    if (t.startsWith('### ')) { flush(); blocks.push(h3Block(t.slice(4).trim())); i++; continue }

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
      if (/^sources?\s*:/i.test(text)) { blocks.push({ type: 'quote', text, source: true }); i++; continue }
      // Lignes « > » qui se suivent = un seul encadré (message type sur plusieurs lignes)
      const q: string[] = [text]
      i++
      while (i < lines.length && /^>\s?/.test(lines[i].trim()) && !/^>\s*sources?\s*:/i.test(lines[i].trim())) {
        const x = lines[i].trim().replace(/^>\s?/, '').trim()
        if (x) q.push(x)
        i++
      }
      blocks.push(quoteBlock(q))
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
  return enrich(blocks)
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
