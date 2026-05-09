import Link from 'next/link'
import {
  Lock, ArrowRight, Sparkle, ChartLineUp, Receipt, FileText,
  Calculator, Tag, GraduationCap, Newspaper, ChartBar,
} from '@phosphor-icons/react/dist/ssr'

interface Props {
  title?: string
  description?: string
  feature?: 'formations' | 'revenus' | 'contrats' | 'partenaires' | 'actualites'
}

interface Feature {
  icon: React.ElementType
  title: string
  desc: string
}

interface Copy {
  title: string
  description: string
  intro: string
  features: Feature[]
}

const COPY: Record<string, Copy> = {
  formations: {
    title: 'Tu as utilisé tes 2 accès gratuits',
    description: 'Passe en Standard pour débloquer les 14 formations complètes, à vie et à ton rythme.',
    intro: 'Inclus avec Standard',
    features: [
      { icon: GraduationCap, title: '14 formations complètes', desc: 'Fiscalité, Airbnb, GBP, photographie, automatisation, prix dynamiques…' },
      { icon: Sparkle,      title: 'Accès à vie',             desc: 'Une fois débloqué, le contenu reste à toi sans limite de temps.' },
      { icon: ChartLineUp,   title: 'Suivi de progression',    desc: 'Reprends où tu t\'étais arrêté, modules, leçons et favoris synchronisés.' },
    ],
  },
  revenus: {
    title: 'Journal des revenus, Standard',
    description: 'Le suivi complet de ton activité LCD : revenus, charges, fiscalité et performances détaillées.',
    intro: 'Ce qui t\'attend en Standard',
    features: [
      { icon: Receipt,      title: 'Saisie & import des revenus',   desc: 'Loyers, ménages, charges Airbnb/Booking — saisie manuelle + import CSV en masse.' },
      { icon: ChartBar,     title: 'Tableau de bord financier',     desc: 'CA, marge, taux d\'occupation, par logement et par mois, en un coup d\'œil.' },
      { icon: Calculator,   title: 'Charges déductibles classées',  desc: 'Catégorisation auto (taxe foncière, assurance, conciergerie, travaux…) avec récap fiscal.' },
      { icon: ChartLineUp,  title: 'Objectif annuel + projections', desc: 'Définis un objectif de CA, suis l\'avancement et anticipe la fin d\'année.' },
      { icon: FileText,     title: 'Export comptable',              desc: 'Génère un récap propre à transmettre à ton comptable ou à intégrer en LMNP.' },
    ],
  },
  contrats: {
    title: 'Contrats & paiement, Standard',
    description: 'Crée des contrats électroniques signés en ligne, avec encaissement loyer + caution sécurisé via Stripe.',
    intro: 'Ce qui t\'attend en Standard',
    features: [
      { icon: FileText,    title: 'Contrats illimités + PDF',      desc: 'Génère un contrat de location courte durée en 30 secondes, signé électroniquement.' },
      { icon: Receipt,     title: 'Paiement Stripe sécurisé',      desc: 'Loyer encaissé, caution bloquée, libération automatique après le départ.' },
      { icon: Sparkle,    title: 'État des lieux + livret',       desc: 'Photos horodatées, livret d\'accueil digital partageable par lien ou QR code.' },
      { icon: ChartLineUp, title: 'Performances détaillées',       desc: 'Taux de transformation, durée moyenne, panier moyen — par logement.' },
    ],
  },
  partenaires: {
    title: 'Offre exclusive, Standard',
    description: 'Débloque tous les codes promo et avantages négociés auprès des partenaires de la communauté LCD.',
    intro: 'Ce qui t\'attend en Standard',
    features: [
      { icon: Tag,        title: 'Codes promo membres',     desc: 'Réductions exclusives sur les outils que tu utilises déjà au quotidien.' },
      { icon: Sparkle,   title: 'Avantages négociés',      desc: 'Conditions privilégiées sur la formation, l\'assurance, la conciergerie.' },
      { icon: Sparkle,    title: 'Nouveaux partenariats',   desc: 'Tu accèdes en avant-première aux nouveaux deals signés chaque mois.' },
    ],
  },
  actualites: {
    title: 'Toutes les actualités, Standard',
    description: 'Reste à jour : réglementation, fiscalité, plateformes, marché — l\'essentiel filtré pour les hôtes LCD.',
    intro: 'Ce qui t\'attend en Standard',
    features: [
      { icon: Newspaper,  title: 'Tout l\'historique d\'actus',   desc: 'Accède à toutes les analyses publiées, pas seulement les plus récentes.' },
      { icon: Sparkle,   title: 'Filtres + favoris',             desc: 'Catégories, recherche par mot-clé, sauvegarde de tes articles préférés.' },
      { icon: ChartLineUp, title: 'Veille hebdomadaire',          desc: 'Récap des changements régulièrement publié — gain de temps assuré.' },
    ],
  },
}

export default function PlanGate({ title, description, feature = 'formations' }: Props) {
  const copy = COPY[feature]
  const displayTitle = title ?? copy.title
  const displayDesc = description ?? copy.description

  return (
    <div style={s.wrap}>
      <div style={s.card} className="plan-gate-card">
        {/* Left column : intro + CTA */}
        <div style={s.left}>
          <div style={s.badge}>
            <Lock size={11} weight="fill" />
            Réservé Standard
          </div>
          <h3 style={s.title}>{displayTitle}</h3>
          <p style={s.desc}>{displayDesc}</p>

          <div style={s.actions}>
            <Link href="/dashboard/abonnement" className="btn-primary" style={s.cta}>
              Passer en Standard, 1,98 €/mois
              <ArrowRight size={14} weight="bold" />
            </Link>
            <Link href="/dashboard/abonnement" style={s.secondary}>
              Voir toutes les offres
            </Link>
          </div>

          <p style={s.smallNote}>
            Prix bloqué à vie pour les 50 premiers membres fondateurs. Résiliable à tout moment.
          </p>
        </div>

        {/* Right column : features */}
        <div style={s.right}>
          <div style={s.rightLabel}>
            <Sparkle size={11} weight="fill" />
            {copy.intro}
          </div>
          <div style={s.featureList}>
            {copy.features.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} style={s.featureItem}>
                  <div style={s.featureIcon}>
                    <Icon size={15} weight="duotone" color="var(--accent-text)" />
                  </div>
                  <div style={s.featureBody}>
                    <div style={s.featureTitle}>{f.title}</div>
                    <div style={s.featureDesc}>{f.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    padding: 'clamp(20px,3vw,44px)',
    width: '100%',
  },
  card: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.05fr)',
    gap: '40px',
    padding: 'clamp(24px,3vw,40px)',
    background: 'var(--surface)',
    border: '1px solid var(--accent-border)',
    borderRadius: '20px',
    boxShadow: 'var(--card-shadow)',
    width: '100%',
  },

  /* Left column */
  left: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    alignSelf: 'start',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '10.5px',
    fontWeight: 700,
    letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
    color: 'var(--accent-text)',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: '999px',
    padding: '4px 11px',
    width: 'fit-content',
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(22px, 2.4vw, 28px)',
    fontWeight: 400,
    color: 'var(--text)',
    margin: 0,
    lineHeight: 1.25,
    letterSpacing: '-0.3px',
  },
  desc: {
    fontSize: '14px',
    fontWeight: 400,
    color: 'var(--text-2)',
    lineHeight: 1.65,
    margin: 0,
    maxWidth: '460px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap' as const,
    marginTop: '8px',
  },
  cta: {
    fontSize: '13px',
    padding: '11px 20px',
  },
  secondary: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-2)',
    textDecoration: 'none',
    borderBottom: '1px solid var(--border-2)',
    paddingBottom: '2px',
  },
  smallNote: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    margin: '8px 0 0',
    lineHeight: 1.6,
  },

  /* Right column */
  right: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: '14px',
    padding: '18px 20px',
  },
  rightLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '10.5px',
    fontWeight: 700,
    letterSpacing: '0.7px',
    textTransform: 'uppercase' as const,
    color: 'var(--accent-text)',
    marginBottom: '4px',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  featureItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: '32px',
    height: '32px',
    flexShrink: 0,
    borderRadius: '9px',
    background: 'var(--surface)',
    border: '1px solid var(--accent-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    minWidth: 0,
  },
  featureTitle: {
    fontSize: '13.5px',
    fontWeight: 600,
    color: 'var(--text)',
    lineHeight: 1.3,
  },
  featureDesc: {
    fontSize: '12.5px',
    color: 'var(--text-2)',
    lineHeight: 1.5,
  },
}
