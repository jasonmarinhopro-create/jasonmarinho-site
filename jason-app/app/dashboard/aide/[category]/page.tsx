import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookOpen, Clock } from '@phosphor-icons/react/dist/ssr'
import { getCategory, HELP_CATEGORIES } from '@/lib/help/categories'
import { listArticlesByCategory } from '@/lib/help/loader'
import { extractPlainText } from '@/lib/help/markdown'
import { EmptyState } from '@/components/ui/EmptyState'

interface PageProps {
  params: { category: string }
}

export async function generateMetadata({ params }: PageProps) {
  const cat = getCategory(params.category)
  if (!cat) return { title: 'Centre d\'aide, Jason Marinho' }
  return { title: `${cat.title} · Aide, Jason Marinho` }
}

export function generateStaticParams() {
  return HELP_CATEGORIES.map(c => ({ category: c.slug }))
}

function readingTimeMinutes(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 220))
}

export default async function AideCategoryPage({ params }: PageProps) {
  const cat = getCategory(params.category)
  if (!cat) notFound()

  const articles = listArticlesByCategory(cat.slug)

  return (
    <div style={s.page} className="aide-no-fade">
      <Link href="/dashboard/aide" style={s.back}>
        <ArrowLeft size={13} weight="bold" />
        Retour au centre d'aide
      </Link>

      <div style={s.header}>
        <div style={{ ...s.icon, background: cat.bg, color: cat.color }}>
          <cat.Icon size={26} weight="fill" />
        </div>
        <div>
          <h1 style={s.title}>{cat.title}</h1>
          <p style={s.desc}>{cat.description}</p>
        </div>
      </div>

      {articles.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={32} weight="regular" />}
          title="Articles à venir"
          description="Cette catégorie sera enrichie prochainement. En attendant, parle directement à Jason si tu as une question."
          primaryAction={{ label: 'Centre d\'aide', href: '/dashboard/aide' }}
          size="lg"
        />
      ) : (
        <div style={s.list}>
          {articles.map(article => {
            const minutes = readingTimeMinutes(article.content)
            const excerpt = article.excerpt || extractPlainText(article.content, 140)
            return (
              <Link
                key={article.slug}
                href={`/dashboard/aide/${cat.slug}/${article.slug}`}
                style={s.articleCard}
                className="aide-article-card"
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={s.articleTitle}>{article.title}</h3>
                  <p style={s.articleExcerpt}>{excerpt}</p>
                  <div style={s.articleMeta}>
                    <span style={s.metaItem}>
                      <Clock size={11} weight="bold" />
                      {minutes} min de lecture
                    </span>
                  </div>
                </div>
                <ArrowRight size={15} weight="bold" style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: '4px' }} />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: 'clamp(20px,3vw,44px)',
    width: '100%',
  },
  back: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12.5px',
    color: 'var(--text-3)',
    textDecoration: 'none',
    marginBottom: '24px',
    transition: 'color 0.15s',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '18px',
    marginBottom: '32px',
  },
  icon: {
    width: '54px',
    height: '54px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(24px,3vw,34px)',
    fontWeight: 400,
    color: 'var(--text)',
    margin: '0 0 6px',
    lineHeight: 1.2,
  },
  desc: {
    fontSize: '14px',
    fontWeight: 300,
    color: 'var(--text-2)',
    margin: 0,
    lineHeight: 1.6,
  },

  /* Article list */
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  articleCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    padding: '18px 20px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    textDecoration: 'none',
    transition: 'border-color 0.15s, transform 0.15s',
  },
  articleTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '16px',
    fontWeight: 400,
    color: 'var(--text)',
    margin: '0 0 5px',
    lineHeight: 1.35,
  },
  articleExcerpt: {
    fontSize: '13px',
    fontWeight: 300,
    color: 'var(--text-2)',
    margin: '0 0 8px',
    lineHeight: 1.55,
  },
  articleMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  metaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11.5px',
    color: 'var(--text-3)',
  },
}
