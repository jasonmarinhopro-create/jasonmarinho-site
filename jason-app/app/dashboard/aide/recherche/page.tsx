import Link from 'next/link'
import { ArrowLeft, MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import HubHero, { HeroEm } from '@/components/dashboard/HubHero'
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

      {/* En-tête (DA 28/09/2026) : même bandeau vert que le reste de l'aide */}
      <HubHero
        eyebrowIcon={<MagnifyingGlass size={13} weight="bold" />}
        eyebrow="Centre d'aide"
        title={<>Rechercher dans <HeroEm>l&apos;aide</HeroEm></>}
        desc={`${articles.length} article${articles.length > 1 ? 's' : ''} : tape un mot-clé (caution, iCal, facture, déclaration…) ou parcours les thèmes ci-dessous.`}
      >
        <div style={s.topics}>
          {HELP_CATEGORIES.filter(c => articles.some(a => a.category === c.slug)).map(c => (
            <Link key={c.slug} href={`/dashboard/aide/${c.slug}`} style={s.topic}>
              <c.Icon size={13} weight="fill" color="var(--accent-text)" /> {c.title}
            </Link>
          ))}
        </div>
      </HubHero>

      <HelpSearch articles={searchable} />
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
  },
  topics: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  topic: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '999px',
    background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '12.5px', fontWeight: 600, textDecoration: 'none',
  },
}
