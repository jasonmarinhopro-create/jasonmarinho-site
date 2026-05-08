import Link from 'next/link'
import { ArrowLeft, MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import { EmptyState } from '@/components/ui/EmptyState'

export const metadata = { title: 'Rechercher · Aide, Jason Marinho' }

export default function AideRecherchePage() {
  // Phase 3 : recherche full-text côté client sur les articles MD.
  // Pour l'instant, placeholder propre.

  return (
    <div style={s.page} className="aide-no-fade">
      <Link href="/dashboard/aide" style={s.back}>
        <ArrowLeft size={13} weight="bold" />
        Retour au centre d'aide
      </Link>

      <h1 style={s.title}>
        Rechercher dans <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>l'aide</em>
      </h1>

      <EmptyState
        icon={<MagnifyingGlass size={32} weight="regular" />}
        title="La recherche arrive bientôt"
        description="On finalise les articles cette semaine, puis la recherche full-text sera activée. En attendant, explore par catégorie."
        primaryAction={{ label: 'Parcourir les catégories', href: '/dashboard/aide' }}
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
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400,
    color: 'var(--text)',
    marginBottom: '24px',
    lineHeight: 1.2,
  },
}
