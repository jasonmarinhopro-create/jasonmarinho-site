import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen } from '@phosphor-icons/react/dist/ssr'
import { getCategory } from '@/lib/help/categories'
import { EmptyState } from '@/components/ui/EmptyState'

interface PageProps {
  params: { category: string }
}

export async function generateMetadata({ params }: PageProps) {
  const cat = getCategory(params.category)
  if (!cat) return { title: 'Centre d\'aide, Jason Marinho' }
  return { title: `${cat.title} · Aide, Jason Marinho` }
}

export default async function AideCategoryPage({ params }: PageProps) {
  const cat = getCategory(params.category)
  if (!cat) notFound()

  // Phase 3 : ici on listera les articles de la catégorie depuis le contenu MD.
  // Pour l'instant, empty state avec retour vers le centre d'aide.

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

      <EmptyState
        icon={<BookOpen size={32} weight="regular" />}
        title="Les articles arrivent très bientôt"
        description="Cette catégorie sera enrichie d'articles pratiques dans les prochains jours. En attendant, parle directement à Jason si tu as une question."
        primaryAction={{ label: 'Parler à Jason', href: '/dashboard/aide' }}
        helpLink={{ href: '/dashboard/aide', label: 'Voir toutes les catégories' }}
        size="lg"
      />
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: 'clamp(20px,3vw,44px)',
    width: '100%',
    maxWidth: '900px',
    margin: '0 auto',
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
}
