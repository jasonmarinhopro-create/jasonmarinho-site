import Link from 'next/link'
import {
  Calculator, ChartLineUp, MagnifyingGlass, Printer, ArrowRight,
} from '@phosphor-icons/react/dist/ssr'

export const metadata = { title: 'Outils & calculs' }

/**
 * Hub "Outils & calculs" (Étape 5/7 du refactor).
 * Regroupe les 4 outils utilitaires (avant éparpillés dans la sidebar) en
 * 4 cartes cliquables. Les sous-pages restent accessibles via leur URL
 * directe (liens contextuels depuis le blog, bookmarks, etc.), on ne fait
 * QUE ajouter cette page hub.
 *
 * NB : Sécurité voyageur reste top-level dans la sidebar vu sa criticité.
 */
const tools = [
  {
    href: '/dashboard/simulateurs',
    label: 'Simulateurs fiscaux',
    Icon: Calculator,
    desc: 'Micro-BIC, LMNP, franchise TVA, choix statut EI/SASU, taxe de séjour, rentabilité LCD.',
    tag: 'Fiscalité',
    accent: 'var(--accent-text)',
  },
  {
    href: '/dashboard/calculateurs',
    label: 'Prix & Marché',
    Icon: ChartLineUp,
    desc: 'Estime le tarif optimal pour ton logement, compare aux prix moyens de ta ville.',
    tag: 'Pricing',
    accent: '#63D683',
  },
  {
    href: '/dashboard/audit-gbp',
    label: 'Audit Google My Business',
    Icon: MagnifyingGlass,
    desc: 'Analyse ta fiche Google, identifie les leviers pour ranker sur les recherches locales.',
    tag: 'SEO local',
    accent: '#93C5FD',
  },
  {
    href: '/dashboard/outils-impression',
    label: 'QR Codes & Affiches',
    Icon: Printer,
    desc: 'Génère tes affiches d\'accueil (WiFi, règles, urgences) et QR codes à imprimer.',
    tag: 'Print',
    accent: '#F472B6',
  },
]

export default function OutilsHubPage() {
  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <h1 style={s.title}>
          Outils <em style={s.titleEm}>&amp; calculs</em>
        </h1>
        <p style={s.sub}>
          Tes utilitaires en un endroit : simulateurs fiscaux, benchmarks prix, audit SEO Google
          et générateurs d&apos;impression pour l&apos;accueil voyageur.
        </p>
      </div>

      <div style={s.grid}>
        {tools.map(({ href, label, Icon, desc, tag, accent }) => (
          <Link key={href} href={href} style={s.card} className="jm-outil-card">
            <div style={{ ...s.cardIco, background: `color-mix(in oklab, ${accent} 12%, transparent)`, borderColor: `color-mix(in oklab, ${accent} 30%, transparent)`, color: accent }}>
              <Icon size={22} weight="duotone" />
            </div>
            <div style={s.cardBody}>
              <div style={s.cardTag}>{tag}</div>
              <div style={s.cardTitle}>{label}</div>
              <div style={s.cardDesc}>{desc}</div>
            </div>
            <ArrowRight size={16} style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 4 }} />
          </Link>
        ))}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    padding: 'clamp(20px, 3vw, 44px)',
    width: '100%',
    maxWidth: 1600,       // Limite pour ne pas s'étaler sur 4K+ (breakpoint XL)
    margin: '0 auto',     // Centre le contenu si écran plus large que 1600px
  },
  head: { marginBottom: 28 },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(22px, 3vw, 28px)',
    fontWeight: 400,
    letterSpacing: '-0.02em',
    margin: 0,
    marginBottom: 6,
    color: 'var(--text)',
  },
  titleEm: { color: 'var(--accent-text)', fontStyle: 'italic', fontWeight: 300 },
  sub: {
    fontSize: 14,
    color: 'var(--text-muted)',
    margin: 0,
    lineHeight: 1.65,
    maxWidth: 640,
  },
  grid: {
    display: 'grid',
    // Breakpoints via auto-fit + minmax généreux : 1 col mobile, 2 col
    // tablette (~700px+), 4 col desktop large (~1400px+). Cards plus grandes
    // (min 320px au lieu de 280) pour ne pas paraître ridicules sur 24".
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 18,
  },
  card: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    padding: 22,
    minHeight: 130,       // Cards de taille uniforme pour aligner la grille
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)',
    textDecoration: 'none',
    color: 'var(--text)',
    transition: 'transform 0.15s var(--ease-spring), border-color 0.15s',
  },
  cardIco: {
    width: 44, height: 44,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid',
    flexShrink: 0,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTag: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    color: 'var(--text-muted)',
    marginBottom: 4,
  },
  cardTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 16,
    fontWeight: 500,
    color: 'var(--text)',
    marginBottom: 4,
    letterSpacing: '-0.01em',
  },
  cardDesc: {
    fontSize: 12.5,
    color: 'var(--text-3)',
    lineHeight: 1.55,
  },
}
