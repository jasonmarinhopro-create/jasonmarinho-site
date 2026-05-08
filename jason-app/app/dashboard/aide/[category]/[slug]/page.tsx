import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ChatsCircle, Clock, WhatsappLogo } from '@phosphor-icons/react/dist/ssr'
import { getCategory, HELP_CATEGORIES } from '@/lib/help/categories'
import { getArticle, listArticlesByCategory } from '@/lib/help/loader'
import { renderMarkdown } from '@/lib/help/markdown'

interface PageProps {
  params: { category: string; slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const cat = getCategory(params.category)
  const article = cat ? getArticle(params.category, params.slug) : null
  if (!cat || !article) return { title: 'Centre d\'aide, Jason Marinho' }
  return { title: `${article.title} · Aide, Jason Marinho` }
}

export function generateStaticParams() {
  return HELP_CATEGORIES.flatMap(c =>
    listArticlesByCategory(c.slug).map(a => ({ category: c.slug, slug: a.slug }))
  )
}

function readingTimeMinutes(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 220))
}

export default async function AideArticlePage({ params }: PageProps) {
  const cat = getCategory(params.category)
  if (!cat) notFound()
  const article = getArticle(params.category, params.slug)
  if (!article) notFound()

  const minutes = readingTimeMinutes(article.content)
  const otherArticles = listArticlesByCategory(cat.slug).filter(a => a.slug !== article.slug).slice(0, 3)

  return (
    <div style={s.page} className="aide-no-fade">
      <nav style={s.breadcrumb}>
        <Link href="/dashboard/aide" style={s.crumb}>Aide</Link>
        <span style={s.crumbSep}>›</span>
        <Link href={`/dashboard/aide/${cat.slug}`} style={s.crumb}>{cat.title}</Link>
      </nav>

      <div style={s.layout}>
        {/* Colonne principale */}
        <div style={s.mainCol}>
          <article>
            <header style={s.articleHeader}>
              <h1 style={s.title}>{article.title}</h1>
              {article.excerpt && <p style={s.excerpt}>{article.excerpt}</p>}
              <div style={s.meta}>
                <span style={s.metaItem}>
                  <Clock size={12} weight="bold" />
                  {minutes} min de lecture
                </span>
                <Link href={`/dashboard/aide/${cat.slug}`} style={{ ...s.metaItem, ...s.metaCat, background: cat.bg, color: cat.color }}>
                  <cat.Icon size={11} weight="fill" />
                  {cat.title}
                </Link>
              </div>
            </header>

            <div style={s.content}>
              {renderMarkdown(article.content)}
            </div>
          </article>

          {/* Pas trouvé ? Contact (mobile / under content) */}
          <section style={s.helpfulBox} className="glass-card">
            <div style={{ flex: 1 }}>
              <div style={s.helpfulTitle}>Cet article t'a aidé ?</div>
              <div style={s.helpfulDesc}>Si tu as une question plus précise, écris à Jason directement.</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <a href="https://wa.me/33630212592" target="_blank" rel="noopener noreferrer"
                 className="btn-primary" style={{ fontSize: '12.5px', padding: '8px 14px' }}>
                <WhatsappLogo size={13} weight="fill" /> WhatsApp
              </a>
              <a href="mailto:jason@jasonmarinho.com"
                 className="btn-ghost" style={{ fontSize: '12.5px', padding: '8px 14px' }}>
                <ChatsCircle size={13} /> Email
              </a>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        {otherArticles.length > 0 && (
          <aside style={s.sidebar}>
            <div style={s.sectionLabel}>Dans la même catégorie</div>
            <div style={s.relatedList}>
              {otherArticles.map(a => (
                <Link key={a.slug} href={`/dashboard/aide/${cat.slug}/${a.slug}`} style={s.relatedCard} className="aide-article-card">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.relatedTitle}>{a.title}</div>
                  </div>
                  <ArrowRight size={13} weight="bold" style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                </Link>
              ))}
            </div>
            <Link href={`/dashboard/aide/${cat.slug}`} style={s.sidebarBackLink}>
              <ArrowRight size={12} weight="bold" style={{ transform: 'rotate(180deg)' }} />
              Tous les articles
            </Link>
          </aside>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: 'clamp(20px,3vw,44px)',
    width: '100%',
  },

  /* 2-column layout */
  layout: {
    display: 'flex',
    gap: '40px',
    alignItems: 'flex-start',
    flexWrap: 'wrap' as const,
  },
  mainCol: {
    flex: 1,
    minWidth: '300px',
  },
  sidebar: {
    width: '280px',
    flexShrink: 0,
    position: 'sticky' as const,
    top: '20px',
  },

  /* Breadcrumb */
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '24px',
    fontSize: '12.5px',
  },
  crumb: {
    color: 'var(--text-3)',
    textDecoration: 'none',
    transition: 'color 0.15s',
  },
  crumbSep: {
    color: 'var(--text-3)',
    fontSize: '11px',
  },

  /* Article header */
  articleHeader: { marginBottom: '28px' },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(26px,3.4vw,38px)',
    fontWeight: 400,
    color: 'var(--text)',
    lineHeight: 1.15,
    letterSpacing: '-0.5px',
    margin: '0 0 12px',
  },
  excerpt: {
    fontSize: '16px',
    fontWeight: 300,
    color: 'var(--text-2)',
    lineHeight: 1.65,
    margin: '0 0 16px',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  metaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11.5px',
    color: 'var(--text-3)',
  },
  metaCat: {
    padding: '4px 10px',
    borderRadius: '100px',
    fontWeight: 500,
    textDecoration: 'none',
  },

  /* Content */
  content: {
    paddingBottom: '20px',
  },

  /* Helpful box */
  helpfulBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '18px 20px',
    borderRadius: '14px',
    flexWrap: 'wrap',
    margin: '32px 0 0',
  },
  helpfulTitle: { fontSize: '14px', fontWeight: 500, color: 'var(--text)' },
  helpfulDesc: { fontSize: '12.5px', fontWeight: 300, color: 'var(--text-2)', marginTop: '3px' },

  /* Sidebar / Related */
  sectionLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-3)',
    letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
    marginBottom: '12px',
  },
  relatedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '12px',
  },
  relatedCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    textDecoration: 'none',
    transition: 'border-color 0.15s',
  },
  relatedTitle: {
    fontSize: '13px',
    fontWeight: 400,
    color: 'var(--text)',
  },
  sidebarBackLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--text-3)',
    textDecoration: 'none',
    marginTop: '4px',
  },
}
