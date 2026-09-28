import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookOpen, Clock, MagnifyingGlass, WhatsappLogo, EnvelopeSimple } from '@phosphor-icons/react/dist/ssr'
import HubHero, { heroCard } from '@/components/dashboard/HubHero'
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

      {/* En-tête (DA 28/09/2026) : même bandeau vert que l'accueil de l'aide ;
          à droite, le contact direct si l'article cherché n'existe pas. */}
      <HubHero
        eyebrowIcon={<cat.Icon size={13} weight="fill" />}
        eyebrow="Centre d'aide"
        title={cat.title}
        desc={`${cat.description}. ${articles.length} article${articles.length > 1 ? 's' : ''} dans ce thème.`}
        aside={
          <div style={heroCard}>
            <span style={s.asideTitle}>Tu n&apos;as pas trouvé ?</span>
            <span style={s.asideText}>Écris à Jason, réponse dans la journée (lundi au vendredi, 9 h à 18 h).</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a href="https://wa.me/33630212592" target="_blank" rel="noopener noreferrer" style={s.btnPrimary}>
                <WhatsappLogo size={14} weight="fill" /> WhatsApp
              </a>
              <a href="mailto:jason@jasonmarinho.com" style={s.btnGhost}>
                <EnvelopeSimple size={14} weight="bold" /> Email
              </a>
            </div>
          </div>
        }
      >
        <Link href="/dashboard/aide/recherche" style={s.searchTrigger}>
          <MagnifyingGlass size={16} weight="bold" />
          <span style={{ flex: 1 }}>Rechercher dans toute l&apos;aide</span>
          <ArrowRight size={14} weight="bold" />
        </Link>
      </HubHero>

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
    padding: '20px var(--dash-page-px) 48px',
    width: '100%',
  },
  back: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12.5px',
    color: 'var(--text-3)',
    textDecoration: 'none',
    marginBottom: '14px',
    transition: 'color 0.15s',
  },
  asideTitle: { fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  asideText: { fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5 },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 14px', borderRadius: '11px',
    background: 'var(--accent-text)', color: 'var(--bg)', fontSize: '13px', fontWeight: 700, textDecoration: 'none',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 14px', borderRadius: '11px',
    background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
  },
  searchTrigger: {
    display: 'flex', alignItems: 'center', gap: '12px', width: '100%', maxWidth: '560px',
    padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--accent-border)', borderRadius: '14px',
    color: 'var(--text-3)', fontSize: '14px', textDecoration: 'none',
  },

  /* Article list */
  // 2 colonnes sur grand écran (avant : une longue liste pleine largeur)
  list: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))',
    gap: '12px',
  },
  articleCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    padding: '18px 20px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    textDecoration: 'none',
    transition: 'border-color 0.15s, transform 0.15s',
  },
  articleTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '17px',
    fontWeight: 500,
    color: 'var(--text)',
    margin: '0 0 5px',
    lineHeight: 1.35,
  },
  articleExcerpt: {
    fontSize: '13px',
    fontWeight: 400,
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
