import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import {
  Scales,
  CurrencyEur,
  Armchair,
  Wrench,
  Star,
  ChartLine,
  ShieldCheck,
  HouseSimple,
  ArrowRight,
  ArrowUpRight,
} from '@phosphor-icons/react/dist/ssr'

type Stat = {
  value: string      // chiffre / stat mis en avant
  label: string      // courte phrase explicative
  source: string     // nom affiché de la source
  sourceUrl: string  // lien vers la source
}

type Category = {
  id: string
  icon: React.ReactNode
  color: string
  bg: string
  title: string
  subtitle: string
  stats: Stat[]
}

const CATEGORIES: Category[] = [
  {
    id: 'reglementation',
    icon: <Scales size={26} weight="fill" />,
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.12)',
    title: 'Réglementation',
    subtitle: 'Tes droits & obligations légales',
    stats: [
      {
        value: '120 nuits/an',
        label: 'Durée max légale pour louer sa résidence principale (Loi Le Meur, 2024).',
        source: 'jedeclaremonmeuble.com',
        sourceUrl: 'https://www.jedeclaremonmeuble.com/loi-le-meur-location-saisonniere-fiscalite/',
      },
      {
        value: '5 000 €',
        label: 'Amende max pour absence de numéro d\'enregistrement, obligatoire dès le 20 mai 2026.',
        source: 'loftely.com',
        sourceUrl: 'https://www.loftely.com/blog/actualites/reglementation-locations-saisonnieres-2026.html',
      },
      {
        value: '90 jours',
        label: 'Certaines communes (Paris, Marseille...) peuvent abaisser la limite à 90 j/an.',
        source: 'nousgerons.com',
        sourceUrl: 'https://www.nousgerons.com/la-loi-le-meur.html',
      },
    ],
  },
  {
    id: 'fiscalite',
    icon: <CurrencyEur size={26} weight="fill" />,
    color: '#34d399',
    bg: 'rgba(52,211,153,0.12)',
    title: 'Fiscalité',
    subtitle: 'Impôts, régimes et optimisation',
    stats: [
      {
        value: '15 000 €',
        label: 'Nouveau plafond micro-BIC pour meublés non classés (contre 77 700 € avant 2025).',
        source: 'service-public.fr',
        sourceUrl: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F32744',
      },
      {
        value: '30 %',
        label: 'Abattement micro-BIC pour meublés non classés — divisé par deux en 2025.',
        source: 'impots.gouv.fr',
        sourceUrl: 'https://www.impots.gouv.fr/particulier/les-regimes-dimposition',
      },
      {
        value: '85 %',
        label: 'Des cas où le régime réel est plus avantageux que le micro-BIC.',
        source: 'jedeclaremonmeuble.com',
        sourceUrl: 'https://www.jedeclaremonmeuble.com/le-regime-micro-bic/',
      },
    ],
  },
  {
    id: 'decoration',
    icon: <Armchair size={26} weight="fill" />,
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.12)',
    title: 'Décoration & Aménagement',
    subtitle: 'Créer un logement qui se démarque',
    stats: [
      {
        value: '+25 %',
        label: 'De réservations en plus avec des photos professionnelles vs amateurs.',
        source: 'objectif5etoiles.com',
        sourceUrl: 'https://www.objectif5etoiles.com/optimisation-de-vo-photos-airbnb-et-booking/',
      },
      {
        value: '+30 %',
        label: 'De réservations supplémentaires avec une déco soignée par rapport à un logement similaire.',
        source: 'rentaplus.immo',
        sourceUrl: 'https://www.rentaplus.immo/meubler-logement-airbnb-maximiser-reservations/',
      },
      {
        value: '3 000 – 7 000 €',
        label: 'Budget moyen pour meubler et équiper un appartement LCD de A à Z.',
        source: 'minut.com',
        sourceUrl: 'https://www.minut.com/fr/blog/amenager-appartement-airbnb-recommandations',
      },
    ],
  },
  {
    id: 'gestion',
    icon: <Wrench size={26} weight="fill" />,
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.12)',
    title: 'Gestion Locative',
    subtitle: 'Automatise et gagne du temps',
    stats: [
      {
        value: '8–12 h/sem',
        label: 'Temps moyen consacré à gérer un logement sans outils d\'automatisation.',
        source: 'jedeclaremonmeuble.com',
        sourceUrl: 'https://www.jedeclaremonmeuble.com/automatiser-airbnb-guide/',
      },
      {
        value: '-70 %',
        label: 'De temps gagné en adoptant un PMS + channel manager pour ses annonces.',
        source: 'chamconcierge.com',
        sourceUrl: 'https://www.chamconcierge.com/post/channel-manager-et-pms-la-solution-indispensable-pour-la-gestion-locative-moderne',
      },
      {
        value: '70 %',
        label: 'Des réservations Airbnb se jouent dans les 15 min suivant la demande.',
        source: 'jedeclaremonmeuble.com',
        sourceUrl: 'https://www.jedeclaremonmeuble.com/automatiser-airbnb-guide/',
      },
    ],
  },
  {
    id: 'visibilite',
    icon: <Star size={26} weight="fill" />,
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.12)',
    title: 'Réputation & Avis',
    subtitle: 'Construire un profil 5 étoiles',
    stats: [
      {
        value: '4,8 ⭐ min',
        label: 'Note minimale requise pour obtenir et conserver le statut Superhôte Airbnb.',
        source: 'eldorado-immobilier.com',
        sourceUrl: 'https://eldorado-immobilier.com/statistiques-sur-airbnb/',
      },
      {
        value: '+30 %',
        label: 'De revenus supplémentaires pour un Superhôte parisien vs un hôte standard.',
        source: 'reussirsalocationcourteduree.fr',
        sourceUrl: 'https://reussirsalocationcourteduree.fr/statistiques-airbnb-2025-revenus-rentabilite/',
      },
      {
        value: 'x3',
        label: 'Les chances d\'être cliqué pour une annonce en 1ère position vs les suivantes.',
        source: 'reussirsalocationcourteduree.fr',
        sourceUrl: 'https://reussirsalocationcourteduree.fr/optimiser-annonce-airbnb-2026/',
      },
    ],
  },
  {
    id: 'assurances',
    icon: <ShieldCheck size={26} weight="fill" />,
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.12)',
    title: 'Assurances & Protection',
    subtitle: 'Être bien couvert en toutes circonstances',
    stats: [
      {
        value: '3 M$',
        label: 'Couverture dommages AirCover pour les hôtes — mais ce n\'est pas une assurance classique.',
        source: 'halobutler.fr',
        sourceUrl: 'https://halobutler.fr/blog/fiscalite-reglementation-airbnb/assurance-airbnb-que-couvre-aircover/',
      },
      {
        value: '1 M$',
        label: 'Couverture responsabilité civile AirCover (dommages corporels/matériels à des tiers).',
        source: 'jedeclaremonmeuble.com',
        sourceUrl: 'https://www.jedeclaremonmeuble.com/aircover/',
      },
      {
        value: '⚠️ 14 jours',
        label: 'Délai max pour activer AirCover après le départ du voyageur — passé ce délai, rien.',
        source: 'locandsmile.fr',
        sourceUrl: 'https://locandsmile.fr/assurance-airbnb-ce-que-laircover-ne-vous-dit-pas-sur-vos-protections/',
      },
    ],
  },
  {
    id: 'revenus',
    icon: <ChartLine size={26} weight="fill" />,
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
    title: 'Revenus & Tarification',
    subtitle: 'Maximise tes gains chaque nuit',
    stats: [
      {
        value: '11 200 €/an',
        label: 'Revenu moyen annuel d\'un hôte Airbnb en France en 2025 (118 €/nuit en moyenne).',
        source: 'eldorado-immobilier.com',
        sourceUrl: 'https://eldorado-immobilier.com/statistiques-sur-airbnb/',
      },
      {
        value: '+20–40 %',
        label: 'De revenus supplémentaires avec tarification dynamique vs prix fixe.',
        source: 'quelleconciergerie.fr',
        sourceUrl: 'https://www.quelleconciergerie.fr/blog-posts/tarification-dynamique-airbnb',
      },
      {
        value: '63 %',
        label: 'Taux d\'occupation moyen Airbnb en France — 70 %+ à Paris.',
        source: 'eldorado-immobilier.com',
        sourceUrl: 'https://eldorado-immobilier.com/taux-remplissage-location-saisonniere/',
      },
    ],
  },
]

export default async function GuidePage() {
  const profile = await getProfile()

  return (
    <>
      <Header title="Guide LCD" userName={profile?.full_name ?? undefined} />

      <div style={styles.page}>

        {/* Intro */}
        <div style={styles.intro} className="fade-up">
          <h2 style={styles.pageTitle}>
            Guide <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>LCD</em>
          </h2>
          <p style={styles.pageDesc}>
            Chiffres clés, faits essentiels et sources fiables pour maîtriser chaque aspect
            de la location courte durée — réglementation, fiscalité, gestion et rentabilité.
          </p>
        </div>

        {/* Grille des catégories */}
        <div style={styles.grid} className="dash-grid-2">
          {CATEGORIES.map((cat, i) => (
            <div key={cat.id} style={styles.card} className={`glass-card fade-up d${i + 1}`}>

              {/* En-tête catégorie */}
              <div style={styles.cardHead}>
                <div style={{ ...styles.iconBox, background: cat.bg, color: cat.color }}>
                  {cat.icon}
                </div>
                <div>
                  <h3 style={styles.cardTitle}>{cat.title}</h3>
                  <p style={styles.cardSub}>{cat.subtitle}</p>
                </div>
              </div>

              {/* Stats */}
              <div style={styles.stats}>
                {cat.stats.map((stat, si) => (
                  <div key={si} style={styles.statRow}>
                    <div style={{ ...styles.statValue, color: cat.color }}>{stat.value}</div>
                    <div style={styles.statRight}>
                      <p style={styles.statLabel}>{stat.label}</p>
                      <a
                        href={stat.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.statSource}
                        className="guide-source-link"
                      >
                        {stat.source} <ArrowUpRight size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>

        {/* Banner Driing */}
        <div style={styles.banner} className="fade-up glass-card">
          <div style={styles.bannerIcon}>
            <HouseSimple size={28} color="var(--accent-text)" weight="fill" />
          </div>
          <div style={styles.bannerText}>
            <h3 style={styles.bannerTitle}>Tu connais Driing ?</h3>
            <p style={styles.bannerDesc}>
              La plateforme de réservation sans commissions pour hôtes LCD — alternative directe à Airbnb.
            </p>
          </div>
          <Link
            href="https://jasonmarinho.com/blog/driing-plateforme-vacances-sans-commissions"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ fontSize: '13px', padding: '10px 18px', flexShrink: 0 }}
          >
            Découvrir <ArrowRight size={14} weight="bold" />
          </Link>
        </div>

      </div>

      <style>{`
        .guide-source-link {
          color: var(--text-3) !important;
          text-decoration: none;
          transition: color 0.15s;
        }
        .guide-source-link:hover {
          color: var(--text-2) !important;
          text-decoration: underline;
        }
      `}</style>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },

  intro: { marginBottom: '36px', maxWidth: '600px' },
  pageTitle: {
    fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: 'var(--text)', marginBottom: '10px',
  },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.7 },

  grid: { marginBottom: '36px' },

  card: { padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '0' },
  cardHead: { display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' },
  iconBox: {
    width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontFamily: 'Fraunces, serif', fontSize: '17px', fontWeight: 400, color: 'var(--text)', margin: '0 0 3px' },
  cardSub: { fontSize: '12px', fontWeight: 300, color: 'var(--text-2)', margin: 0 },

  stats: { display: 'flex', flexDirection: 'column', gap: '12px' },
  statRow: {
    display: 'flex', alignItems: 'flex-start', gap: '14px',
    padding: '10px 12px',
    borderRadius: '10px',
    background: 'var(--border)',
  },
  statValue: {
    fontSize: '18px', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.02em', lineHeight: 1.2,
    minWidth: '90px', flexShrink: 0, paddingTop: '1px',
  },
  statRight: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 },
  statLabel: { fontSize: '12.5px', fontWeight: 400, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 },
  statSource: { fontSize: '11px', fontWeight: 400, color: 'var(--text-3)', lineHeight: 1 },

  banner: {
    display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
    padding: 'clamp(20px,3vw,32px)', borderRadius: '20px',
  },
  bannerIcon: {
    width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
    background: 'rgba(0,76,63,0.25)', border: '1px solid rgba(255,213,107,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  bannerText: { flex: 1, minWidth: '200px' },
  bannerTitle: { fontFamily: 'Fraunces, serif', fontSize: '17px', fontWeight: 400, color: 'var(--text)', margin: '0 0 4px' },
  bannerDesc: { fontSize: '13px', fontWeight: 300, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 },
}
