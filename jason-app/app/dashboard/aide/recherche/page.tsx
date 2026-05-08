import Link from 'next/link'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { listAllArticles } from '@/lib/help/loader'
import { extractPlainText } from '@/lib/help/markdown'
import { HELP_CATEGORIES, getCategory } from '@/lib/help/categories'
import { HelpSearch, type SearchableArticle } from '@/components/help/HelpSearch'

export const metadata = { title: 'Rechercher · Aide, Jason Marinho' }

export default function AideRecherchePage() {
  // Charge tous les articles côté serveur, prépare l'index searchable
  const articles = listAllArticles()
  const searchable: SearchableArticle[] = articles.map(a => {
    const cat = getCategory(a.category)
    return {
      slug: a.slug,
      category: a.category,
      categoryTitle: cat?.title ?? a.category,
      categoryColor: cat?.color ?? 'var(--text-2)',
      categoryBg: cat?.bg ?? 'var(--surface-2)',
      title: a.title,
      excerpt: a.excerpt,
      plainText: extractPlainText(a.content, 600),
    }
  })

  return (
    <div style={s.page} className="aide-no-fade">
      <Link href="/dashboard/aide" style={s.back}>
        <ArrowLeft size={13} weight="bold" />
        Retour au centre d'aide
      </Link>

      <h1 style={s.title}>
        Rechercher dans <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>l'aide</em>
      </h1>
      <p style={s.sub}>
        {articles.length} article{articles.length > 1 ? 's' : ''} disponible{articles.length > 1 ? 's' : ''} dans le centre d'aide.
      </p>

      <HelpSearch articles={searchable} />
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
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400,
    color: 'var(--text)',
    marginBottom: '8px',
    lineHeight: 1.2,
  },
  sub: {
    fontSize: '14px',
    fontWeight: 300,
    color: 'var(--text-2)',
    marginBottom: '28px',
  },
}
