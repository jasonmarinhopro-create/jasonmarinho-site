// Renderer markdown pour les articles d'aide.
// Returns React nodes, pas du HTML brut → pas de dangerouslySetInnerHTML.
// Supporte : ## ### titres, **gras**, *italique*, `code`, [lien](url),
//            - bullet lists, 1. numbered lists, > blockquote, --- hr, tableaux

import { Fragment } from 'react'

const HEADING_STYLES: Record<2 | 3, React.CSSProperties> = {
  2: {
    fontFamily: 'var(--font-fraunces), Georgia, serif',
    fontSize: '22px',
    fontWeight: 400,
    color: 'var(--text)',
    margin: '36px 0 12px',
    lineHeight: 1.25,
    letterSpacing: '-0.3px',
  },
  3: {
    fontFamily: 'var(--font-fraunces), Georgia, serif',
    fontSize: '17px',
    fontWeight: 500,
    color: 'var(--text)',
    margin: '26px 0 8px',
    lineHeight: 1.3,
  },
}

const styles: Record<string, React.CSSProperties> = {
  p:    { fontSize: '15px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.75, margin: '0 0 14px' },
  ul:   { listStyle: 'none', padding: 0, margin: '0 0 18px', display: 'flex', flexDirection: 'column', gap: '8px' },
  ol:   { padding: '0 0 0 22px', margin: '0 0 18px', display: 'flex', flexDirection: 'column', gap: '8px' },
  li:   { fontSize: '15px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.7, display: 'flex', alignItems: 'flex-start', gap: '10px' },
  liNumbered: { fontSize: '15px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.7 },
  bullet: { color: 'var(--accent-text)', fontWeight: 600, flexShrink: 0, marginTop: '1px' },
  blockquote: {
    background: 'var(--accent-bg)',
    borderLeft: '3px solid var(--accent-text)',
    borderRadius: '8px',
    padding: '14px 18px',
    margin: '20px 0',
    fontSize: '14.5px',
    fontWeight: 300,
    color: 'var(--text-2)',
    lineHeight: 1.7,
    fontStyle: 'italic',
  },
  hr: { border: 'none', borderTop: '1px solid var(--border)', margin: '32px 0' },
  tableWrap: { margin: '20px 0', overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' },
  th: { padding: '12px 14px', textAlign: 'left', fontWeight: 500, color: 'var(--text)', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' },
  td: { padding: '11px 14px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', fontWeight: 300 },
  code: {
    background: 'var(--surface-2)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '13px',
    color: 'var(--accent-text)',
  },
  pre: {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '14px 16px',
    margin: '16px 0',
    overflowX: 'auto',
    fontSize: '13px',
    fontFamily: 'monospace',
    color: 'var(--text)',
    lineHeight: 1.6,
  },
  link: {
    color: 'var(--accent-text)',
    textDecoration: 'underline',
    textDecorationColor: 'rgba(255,213,107,0.4)',
    textUnderlineOffset: '3px',
  },
}

function slugify(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** Render inline markdown (bold, italic, code, link) → React fragments */
function renderInline(text: string, keyBase: string): React.ReactNode {
  // Pattern unifié : on extrait segments à un caractère
  // [link](url), `code`, **bold**, *italic*
  const parts: React.ReactNode[] = []
  let cursor = 0
  let key = 0
  const re = /\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g
  let m: RegExpExecArray | null

  while ((m = re.exec(text)) !== null) {
    if (m.index > cursor) {
      parts.push(<Fragment key={`${keyBase}-t${key++}`}>{text.slice(cursor, m.index)}</Fragment>)
    }
    if (m[1] && m[2]) {
      // [link](url)
      const href = m[2]
      const isExternal = /^https?:\/\//.test(href)
      parts.push(
        <a
          key={`${keyBase}-l${key++}`}
          href={href}
          style={styles.link}
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {renderInline(m[1], `${keyBase}-l${key}`)}
        </a>
      )
    } else if (m[3]) {
      parts.push(<code key={`${keyBase}-c${key++}`} style={styles.code}>{m[3]}</code>)
    } else if (m[4]) {
      parts.push(<strong key={`${keyBase}-b${key++}`} style={{ color: 'var(--text)', fontWeight: 600 }}>{renderInline(m[4], `${keyBase}-b${key}`)}</strong>)
    } else if (m[5]) {
      parts.push(<em key={`${keyBase}-i${key++}`} style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>{renderInline(m[5], `${keyBase}-i${key}`)}</em>)
    }
    cursor = m.index + m[0].length
  }

  if (cursor < text.length) {
    parts.push(<Fragment key={`${keyBase}-t${key++}`}>{text.slice(cursor)}</Fragment>)
  }

  return parts.length ? <>{parts}</> : text
}

/**
 * Render markdown content as React nodes.
 */
export function renderMarkdown(content: string): React.ReactNode {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // Empty line — skip
    if (line.trim() === '') { i++; continue }

    // ## Heading 2
    if (line.startsWith('## ')) {
      const t = line.slice(3).trim()
      const id = `h-${slugify(t)}`
      elements.push(<h2 key={key++} id={id} style={HEADING_STYLES[2]}>{renderInline(t, `${key}h2`)}</h2>)
      i++
      continue
    }

    // ### Heading 3
    if (line.startsWith('### ')) {
      const t = line.slice(4).trim()
      const id = `h-${slugify(t)}`
      elements.push(<h3 key={key++} id={id} style={HEADING_STYLES[3]}>{renderInline(t, `${key}h3`)}</h3>)
      i++
      continue
    }

    // --- Horizontal rule
    if (line.trim() === '---') {
      elements.push(<hr key={key++} style={styles.hr} />)
      i++
      continue
    }

    // > Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <blockquote key={key++} style={styles.blockquote}>
          {renderInline(quoteLines.join(' '), `${key}q`)}
        </blockquote>
      )
      continue
    }

    // ``` Code block
    if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      elements.push(<pre key={key++} style={styles.pre}>{codeLines.join('\n')}</pre>)
      continue
    }

    // | Table
    if (line.startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      if (tableLines.length >= 2) {
        const [header, , ...rows] = tableLines
        const headers = header.split('|').slice(1, -1).map(c => c.trim())
        const tableRows = rows.map(r => r.split('|').slice(1, -1).map(c => c.trim()))
        elements.push(
          <div key={key++} style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>{headers.map((h, j) => <th key={j} style={styles.th}>{renderInline(h, `${key}th${j}`)}</th>)}</tr>
              </thead>
              <tbody>
                {tableRows.map((row, ri) => (
                  <tr key={ri}>{row.map((cell, ci) => <td key={ci} style={styles.td}>{renderInline(cell, `${key}td${ri}${ci}`)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      continue
    }

    // 1. Numbered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      elements.push(
        <ol key={key++} style={styles.ol}>
          {items.map((t, j) => (
            <li key={j} style={styles.liNumbered}>{renderInline(t, `${key}ol${j}`)}</li>
          ))}
        </ol>
      )
      continue
    }

    // - Bullet list
    if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={key++} style={styles.ul}>
          {items.map((t, j) => (
            <li key={j} style={styles.li}>
              <span style={styles.bullet}>•</span>
              <span>{renderInline(t, `${key}ul${j}`)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Default: paragraph
    elements.push(<p key={key++} style={styles.p}>{renderInline(line, `${key}p`)}</p>)
    i++
  }

  return <>{elements}</>
}

/**
 * Extract a plain-text excerpt from markdown (for previews and search).
 */
export function extractPlainText(content: string, maxLength = 200): string {
  const cleaned = content
    .replace(/^---[\s\S]*?---\n/, '')      // strip frontmatter if any
    .replace(/^#{1,6}\s.*$/gm, '')          // remove headings
    .replace(/\*\*([^*]+)\*\*/g, '$1')      // bold
    .replace(/\*([^*]+)\*/g, '$1')          // italic
    .replace(/`([^`]+)`/g, '$1')            // code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/^[->|]\s/gm, '')              // markers
    .replace(/\n+/g, ' ')                   // newlines
    .trim()

  if (cleaned.length <= maxLength) return cleaned
  return cleaned.slice(0, maxLength).replace(/\s+\S*$/, '') + '…'
}
