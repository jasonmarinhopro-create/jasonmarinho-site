// Loader des articles d'aide.
// SERVER ONLY (utilise fs).
// Articles stockés en MD avec frontmatter dans content/help/[category]/[slug].md

import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

export interface HelpArticle {
  slug: string
  category: string
  title: string
  excerpt: string
  content: string         // markdown brut
  relatedPages?: string[] // routes dashboard liées (pour Phase 4)
  updatedAt?: string      // ISO date string
  order?: number          // tri dans la catégorie (par défaut: alpha)
}

const CONTENT_ROOT = join(process.cwd(), 'content', 'help')

/**
 * Parse simpliste du frontmatter YAML (clé:valeur ligne par ligne).
 * Supporte : strings, listes inline [a, b, c], nombres.
 * NE supporte PAS : objets imbriqués, listes multi-lignes.
 */
function parseFrontmatter(raw: string): { meta: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { meta: {}, body: raw }

  const meta: Record<string, unknown> = {}
  const lines = match[1].split('\n')

  for (const line of lines) {
    const colonIdx = line.indexOf(':')
    if (colonIdx < 0) continue
    const key = line.slice(0, colonIdx).trim()
    let value: string | number | string[] = line.slice(colonIdx + 1).trim()

    // Strip quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    // List inline [a, b, c]
    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim()
      if (inner === '') {
        meta[key] = []
        continue
      }
      meta[key] = inner.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''))
      continue
    }

    // Number
    if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)) {
      meta[key] = Number(value)
      continue
    }

    meta[key] = value
  }

  return { meta, body: match[2] }
}

function fileToArticle(category: string, fileName: string): HelpArticle | null {
  const slug = fileName.replace(/\.md$/, '')
  const path = join(CONTENT_ROOT, category, fileName)
  if (!existsSync(path)) return null

  const raw = readFileSync(path, 'utf-8')
  const { meta, body } = parseFrontmatter(raw)

  return {
    slug,
    category,
    title: (meta.title as string) ?? slug,
    excerpt: (meta.excerpt as string) ?? '',
    content: body.trim(),
    relatedPages: (meta.relatedPages as string[]) ?? undefined,
    updatedAt: (meta.updatedAt as string) ?? undefined,
    order: (meta.order as number) ?? undefined,
  }
}

/**
 * Liste tous les articles d'une catégorie, triés par `order` puis alphabétiquement.
 */
export function listArticlesByCategory(category: string): HelpArticle[] {
  const dir = join(CONTENT_ROOT, category)
  if (!existsSync(dir)) return []

  const files = readdirSync(dir).filter(f => f.endsWith('.md'))
  const articles = files
    .map(f => fileToArticle(category, f))
    .filter((a): a is HelpArticle => a !== null)

  return articles.sort((a, b) => {
    const oa = a.order ?? 999
    const ob = b.order ?? 999
    if (oa !== ob) return oa - ob
    return a.title.localeCompare(b.title, 'fr')
  })
}

/**
 * Récupère un article spécifique (catégorie + slug).
 */
export function getArticle(category: string, slug: string): HelpArticle | null {
  return fileToArticle(category, `${slug}.md`)
}

/**
 * Liste TOUS les articles (pour la recherche full-text).
 */
export function listAllArticles(): HelpArticle[] {
  if (!existsSync(CONTENT_ROOT)) return []
  const categories = readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
  return categories.flatMap(c => listArticlesByCategory(c))
}
