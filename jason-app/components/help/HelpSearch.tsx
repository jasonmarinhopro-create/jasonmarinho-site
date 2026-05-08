'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { MagnifyingGlass, ArrowRight, X } from '@phosphor-icons/react/dist/ssr'

export interface SearchableArticle {
  slug: string
  category: string
  categoryTitle: string
  categoryColor: string
  categoryBg: string
  title: string
  excerpt: string
  plainText: string
}

interface Props {
  articles: SearchableArticle[]
  autoFocus?: boolean
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const normText = normalize(text)
  const normQuery = normalize(query.trim())
  const idx = normText.indexOf(normQuery)
  if (idx < 0) return text

  return (
    <>
      {text.slice(0, idx)}
      <mark style={highlightStyle}>{text.slice(idx, idx + normQuery.length)}</mark>
      {text.slice(idx + normQuery.length)}
    </>
  )
}

function getSnippet(plainText: string, query: string, length = 140): string {
  if (!query.trim()) return plainText.slice(0, length) + (plainText.length > length ? '…' : '')
  const norm = normalize(plainText)
  const idx = norm.indexOf(normalize(query.trim()))
  if (idx < 0) return plainText.slice(0, length) + (plainText.length > length ? '…' : '')

  const start = Math.max(0, idx - 40)
  const end = Math.min(plainText.length, idx + length - 40)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < plainText.length ? '…' : ''
  return prefix + plainText.slice(start, end) + suffix
}

export function HelpSearch({ articles, autoFocus = true }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q || q.length < 2) return []

    return articles
      .map(article => {
        const title = normalize(article.title)
        const excerpt = normalize(article.excerpt)
        const text = normalize(article.plainText)

        // Score : titre > excerpt > contenu
        let score = 0
        if (title.includes(q)) score += 100
        if (title.startsWith(q)) score += 50
        if (excerpt.includes(q)) score += 30
        if (text.includes(q)) score += 10

        return { article, score }
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map(r => r.article)
  }, [query, articles])

  return (
    <div style={s.wrap}>
      <div style={s.inputWrap}>
        <span style={s.inputIcon}>
          <MagnifyingGlass size={16} weight="bold" />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un sujet, une fonctionnalité…"
          style={s.input}
          autoComplete="off"
        />
        {query && (
          <button onClick={() => setQuery('')} style={s.clearBtn} aria-label="Effacer">
            <X size={13} weight="bold" />
          </button>
        )}
      </div>

      <div style={s.resultsWrap}>
        {query.trim().length === 0 && (
          <p style={s.hint}>
            Tape au moins 2 lettres pour lancer la recherche.
          </p>
        )}

        {query.trim().length >= 2 && results.length === 0 && (
          <div style={s.noResults}>
            <p style={s.noResultsTitle}>Aucun résultat pour « {query} »</p>
            <p style={s.noResultsDesc}>
              Essaie un mot-clé plus court ou{' '}
              <Link href="/dashboard/aide" style={s.noResultsLink}>parcours les catégories</Link>.
              Sinon{' '}
              <a href="https://wa.me/33630212592" target="_blank" rel="noopener noreferrer" style={s.noResultsLink}>
                écris à Jason directement
              </a>.
            </p>
          </div>
        )}

        {results.length > 0 && (
          <>
            <p style={s.resultsCount}>
              {results.length} résultat{results.length > 1 ? 's' : ''}
            </p>
            <div style={s.resultsList}>
              {results.map(article => (
                <Link
                  key={`${article.category}-${article.slug}`}
                  href={`/dashboard/aide/${article.category}/${article.slug}`}
                  style={s.resultCard}
                  className="aide-article-card"
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.resultMeta}>
                      <span style={{ ...s.categoryPill, background: article.categoryBg, color: article.categoryColor }}>
                        {article.categoryTitle}
                      </span>
                    </div>
                    <h3 style={s.resultTitle}>
                      {highlight(article.title, query)}
                    </h3>
                    <p style={s.resultSnippet}>
                      {highlight(getSnippet(article.plainText, query), query)}
                    </p>
                  </div>
                  <ArrowRight size={14} weight="bold" style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: '4px' }} />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const highlightStyle: React.CSSProperties = {
  background: 'rgba(255,213,107,0.25)',
  color: 'inherit',
  padding: '1px 2px',
  borderRadius: '3px',
  fontWeight: 500,
}

const s: Record<string, React.CSSProperties> = {
  wrap: { width: '100%' },

  /* Input */
  inputWrap: {
    position: 'relative',
    marginBottom: '24px',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-3)',
    display: 'flex',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '14px 44px 14px 44px',
    fontSize: '15px',
    fontFamily: 'inherit',
    color: 'var(--text)',
    background: 'var(--surface)',
    border: '1px solid var(--accent-border)',
    borderRadius: '14px',
    outline: 'none',
  },
  clearBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    border: 'none',
    background: 'var(--surface-2)',
    color: 'var(--text-2)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Results */
  resultsWrap: {},
  hint: {
    fontSize: '13px',
    color: 'var(--text-3)',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '20px',
  },
  resultsCount: {
    fontSize: '11.5px',
    fontWeight: 500,
    color: 'var(--text-3)',
    letterSpacing: '0.4px',
    textTransform: 'uppercase' as const,
    marginBottom: '12px',
  },
  resultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  resultCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px 16px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    textDecoration: 'none',
    transition: 'border-color 0.15s',
  },
  resultMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  categoryPill: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '10px',
    fontWeight: 600,
    padding: '3px 9px',
    borderRadius: '100px',
    letterSpacing: '0.3px',
  },
  resultTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '15px',
    fontWeight: 400,
    color: 'var(--text)',
    margin: '0 0 5px',
    lineHeight: 1.35,
  },
  resultSnippet: {
    fontSize: '12.5px',
    fontWeight: 300,
    color: 'var(--text-2)',
    margin: 0,
    lineHeight: 1.55,
  },

  /* No results */
  noResults: {
    textAlign: 'center',
    padding: '36px 20px',
    background: 'var(--surface)',
    border: '1px dashed var(--border)',
    borderRadius: '12px',
  },
  noResultsTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text)',
    margin: '0 0 8px',
  },
  noResultsDesc: {
    fontSize: '12.5px',
    fontWeight: 300,
    color: 'var(--text-2)',
    margin: 0,
    lineHeight: 1.6,
  },
  noResultsLink: {
    color: 'var(--accent-text)',
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
  },
}
