// Import de contacts depuis un fichier CSV (export DATAtourisme, tableur,
// autre outil) : lecture tolérante (virgule ou point-virgule, guillemets) et
// reconnaissance automatique des colonnes. Pur, testé dans csv.test.ts.

export type CsvField = 'email' | 'prenom' | 'nom' | 'entreprise' | 'ville' | 'departement' | 'site_web' | 'telephone' | 'instagram' | 'siren'

export interface CsvContact {
  email?: string
  prenom?: string
  nom?: string
  entreprise?: string
  ville?: string
  departement?: string
  site_web?: string
  telephone?: string
  instagram?: string
  siren?: string
}

/** Découpe un CSV en lignes de cellules (guillemets doublés, retours à la ligne entre guillemets). */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, '')
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? ''
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';'
    : (firstLine.match(/\t/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? '\t' : ','
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (quoted) {
      if (ch === '"') {
        if (clean[i + 1] === '"') { cell += '"'; i++ } else quoted = false
      } else cell += ch
      continue
    }
    if (ch === '"') quoted = true
    else if (ch === sep) { row.push(cell.trim()); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++
      row.push(cell.trim()); cell = ''
      if (row.some(c => c !== '')) rows.push(row)
      row = []
    } else cell += ch
  }
  row.push(cell.trim())
  if (row.some(c => c !== '')) rows.push(row)
  return rows
}

const RULES: Array<{ field: CsvField; re: RegExp }> = [
  { field: 'email', re: /e-?mail|courriel|mel\b|mail/i },
  { field: 'site_web', re: /site|web|url|homepage|internet/i },
  { field: 'instagram', re: /instagram/i },
  { field: 'telephone', re: /t[ée]l[ée]?phone|\btel\b|mobile|portable|phone/i },
  { field: 'siren', re: /siren|siret/i },
  { field: 'prenom', re: /pr[ée]nom|first ?name/i },
  { field: 'departement', re: /d[ée]partement|\bdept?\b|code ?postal|postal|cp\b/i },
  { field: 'ville', re: /ville|commune|city|localit/i },
  { field: 'entreprise', re: /entreprise|soci[ée]t[ée]|raison|structure|company|marque|[ée]tablissement/i },
  { field: 'nom', re: /\bnom\b|name|label|titre|d[ée]nomination|libell/i },
]

/** Associe chaque colonne à un champ (la première colonne reconnue l'emporte). */
export function mapHeaders(headers: string[]): Array<CsvField | null> {
  const used = new Set<CsvField>()
  return headers.map(h => {
    const rule = RULES.find(r => r.re.test(h) && !used.has(r.field))
    if (!rule) return null
    used.add(rule.field)
    return rule.field
  })
}

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Lignes → contacts (e-mails validés, code postal ramené au département). */
export function rowsToContacts(rows: string[][], mapping: Array<CsvField | null>): CsvContact[] {
  const out: CsvContact[] = []
  for (const r of rows) {
    const c: CsvContact = {}
    mapping.forEach((field, i) => {
      const v = (r[i] ?? '').trim()
      if (!field || !v) return
      if (field === 'email') {
        const first = v.split(/[;,\s|]+/).find(x => EMAIL_OK.test(x))
        if (first) c.email = first.toLowerCase()
      } else if (field === 'departement') {
        const m = v.match(/\b(2[AB]|\d{2})\d{0,3}\b/i)
        if (m) c.departement = m[1].toUpperCase()
      } else if (field === 'site_web') {
        c.site_web = /^https?:\/\//i.test(v) ? v : `https://${v}`
      } else {
        c[field] = v.slice(0, 200)
      }
    })
    if (c.email || c.nom || c.entreprise) out.push(c)
  }
  return out
}
