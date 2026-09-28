import Link from 'next/link'
import { ArrowLeft, ShieldStar } from '@phosphor-icons/react/dist/ssr'
import HubHero, { HeroEm } from '@/components/dashboard/HubHero'

// En-tête commun des pages admin (DA 28/09/2026) : même bandeau vert que les
// pages hôte, section en eyebrow, lien de retour vers la Vue d'ensemble.
export default function AdminHero({ section, title, em, desc, aside, children }: {
  section: string
  /** Début du titre, suivi de `em` en italique vert */
  title: string
  em?: string
  desc: React.ReactNode
  aside?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <HubHero
      eyebrowIcon={<ShieldStar size={14} weight="fill" />}
      eyebrow={`Administration · ${section}`}
      title={<>{title}{em && <> <HeroEm>{em}</HeroEm></>}</>}
      desc={desc}
      aside={aside}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 16px' }}>
        {children}
        <Link href="/dashboard/admin" style={back}>
          <ArrowLeft size={13} weight="bold" /> Vue d&apos;ensemble
        </Link>
      </div>
    </HubHero>
  )
}

const back: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600,
  color: 'var(--text-2)', textDecoration: 'none',
}

/** Carte à droite du bandeau : prend toute la largeur de la colonne */
export const adminAsideCard: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '8px', padding: '18px 20px', borderRadius: '18px',
  background: 'var(--surface)', border: '1px solid var(--border)', flex: '1 1 100%', minWidth: 0,
}
