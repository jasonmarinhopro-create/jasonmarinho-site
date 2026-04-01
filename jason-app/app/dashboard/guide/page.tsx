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
  Lock,
} from '@phosphor-icons/react/dist/ssr'

type Fiche = {
  title: string
  desc: string
  slug?: string   // /blog/slug — undefined = bientôt dispo
}

type Category = {
  id: string
  icon: React.ReactNode
  color: string
  bg: string
  title: string
  subtitle: string
  fiches: Fiche[]
}

const BLOG = 'https://jasonmarinho.fr/blog/'

const CATEGORIES: Category[] = [
  {
    id: 'reglementation',
    icon: <Scales size={26} weight="fill" />,
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.12)',
    title: 'Réglementation',
    subtitle: 'Tes droits & obligations légales',
    fiches: [
      { title: 'Lois en vigueur en 2026', desc: 'Durée max, autorisation mairie, numéro de déclaration...', slug: 'reglementation-lcd-france-2026' },
      { title: 'Résidence principale vs secondaire', desc: 'Règles différentes selon le type de bien loué.' },
      { title: 'Copropriété & règlement intérieur', desc: 'Peut-on louer malgré un règlement restrictif ?' },
    ],
  },
  {
    id: 'fiscalite',
    icon: <CurrencyEur size={26} weight="fill" />,
    color: '#34d399',
    bg: 'rgba(52,211,153,0.12)',
    title: 'Fiscalité',
    subtitle: 'Impôts, régimes et optimisation',
    fiches: [
      { title: 'Micro-BIC vs régime réel', desc: 'Quel régime choisir selon tes revenus ?', slug: 'location-courte-duree-impots-france' },
      { title: 'LMNP et LMP : les différences', desc: 'Statuts, seuils, avantages fiscaux expliqués.' },
      { title: 'Taxe de séjour', desc: 'Comment la collecter et la reverser à ta commune.' },
    ],
  },
  {
    id: 'decoration',
    icon: <Armchair size={26} weight="fill" />,
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.12)',
    title: 'Décoration & Aménagement',
    subtitle: 'Créer un logement qui se démarque',
    fiches: [
      { title: 'Les indispensables d\'un logement LCD', desc: 'Ce que tout voyageur s\'attend à trouver.' },
      { title: 'Décorer sans se ruiner', desc: 'Astuces déco pour un logement premium à petit budget.' },
      { title: 'Livret d\'accueil digital', desc: 'Remplacer le classeur papier par un guide interactif.', slug: 'livret-accueil-digital-hotes-lcd' },
    ],
  },
  {
    id: 'gestion',
    icon: <Wrench size={26} weight="fill" />,
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.12)',
    title: 'Gestion Locative',
    subtitle: 'Automatise et gagne du temps',
    fiches: [
      { title: 'Automatiser ses messages', desc: 'Répondre vite sans y passer ses soirées.', slug: 'messages-airbnb-automatiser' },
      { title: 'Les meilleurs outils LCD', desc: 'PMS, channel manager, outils de ménage...', slug: 'outils-gerer-location-courte-duree-2025' },
      { title: 'Créer sa conciergerie', desc: 'Gérer plusieurs biens ou déléguer efficacement.', slug: 'creer-conciergerie-airbnb-2025' },
    ],
  },
  {
    id: 'visibilite',
    icon: <Star size={26} weight="fill" />,
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.12)',
    title: 'Réputation & Avis',
    subtitle: 'Construire un profil 5 étoiles',
    fiches: [
      { title: 'Obtenir des avis 5 étoiles', desc: 'Les gestes qui font la différence aux yeux des voyageurs.', slug: 'obtenir-avis-5-etoiles-airbnb' },
      { title: 'Optimiser son annonce Airbnb', desc: 'Photos, titre, description — tout ce qui booste le clic.', slug: 'optimiser-annonce-airbnb' },
      { title: 'Répondre aux avis négatifs', desc: 'Comment transformer un mauvais avis en atout.' },
    ],
  },
  {
    id: 'assurances',
    icon: <ShieldCheck size={26} weight="fill" />,
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.12)',
    title: 'Assurances & Protection',
    subtitle: 'Être bien couvert en toutes circonstances',
    fiches: [
      { title: 'AirCover vs assurance personnelle', desc: 'Ce que couvre vraiment Airbnb et ce qu\'il ne couvre pas.' },
      { title: 'Responsabilité civile hôte', desc: 'Choisir une assurance adaptée à la LCD.' },
      { title: 'Assurance conciergerie', desc: 'Obligations et couvertures spécifiques si tu gères pour autrui.' },
    ],
  },
  {
    id: 'revenus',
    icon: <ChartLine size={26} weight="fill" />,
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
    title: 'Revenus & Tarification',
    subtitle: 'Maximise tes gains chaque nuit',
    fiches: [
      { title: 'Tarification dynamique', desc: 'Adapter ses prix en temps réel selon la demande.', slug: 'tarification-dynamique-lcd' },
      { title: 'Réservation directe sans commission', desc: 'Créer son propre canal et réduire les frais.', slug: 'reservation-directe-sans-commission' },
      { title: 'Google My Business pour hôtes', desc: 'Apparaître dans Google Maps pour attirer des réservations.', slug: 'google-my-business-hotes-lcd' },
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
            Ta bibliothèque de référence pour la location courte durée. Retrouve ici les fondamentaux :
            réglementation, fiscalité, décoration, gestion locative — tout ce qu&apos;il faut savoir pour
            partir du bon pied.
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

              {/* Fiches */}
              <div style={styles.fiches}>
                {cat.fiches.map((fiche, fi) =>
                  fiche.slug ? (
                    <Link
                      key={fi}
                      href={`${BLOG}${fiche.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.fiche}
                      className="guide-fiche"
                    >
                      <div style={styles.ficheText}>
                        <span style={styles.ficheTitle}>{fiche.title}</span>
                        <span style={styles.ficheDesc}>{fiche.desc}</span>
                      </div>
                      <ArrowUpRight size={14} style={{ color: cat.color, flexShrink: 0, opacity: 0.8 }} />
                    </Link>
                  ) : (
                    <div key={fi} style={{ ...styles.fiche, ...styles.ficheLocked }}>
                      <div style={styles.ficheText}>
                        <span style={{ ...styles.ficheTitle, color: 'var(--text-muted)' }}>{fiche.title}</span>
                        <span style={styles.ficheDesc}>{fiche.desc}</span>
                      </div>
                      <Lock size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    </div>
                  )
                )}
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
            href={`${BLOG}driing-plateforme-vacances-sans-commissions`}
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
        .guide-fiche:hover {
          background: var(--surface-2) !important;
          border-color: var(--accent-border) !important;
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
  cardSub: { fontSize: '12px', fontWeight: 300, color: 'var(--text-muted)', margin: 0 },

  fiches: { display: 'flex', flexDirection: 'column', gap: '2px' },
  fiche: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
    padding: '11px 12px', borderRadius: '10px',
    border: '1px solid transparent',
    textDecoration: 'none',
    transition: 'background 0.15s, border-color 0.15s',
    cursor: 'pointer',
  } as React.CSSProperties,
  ficheLocked: { opacity: 0.5, cursor: 'default' },
  ficheText: { display: 'flex', flexDirection: 'column', gap: '2px' },
  ficheTitle: { fontSize: '13px', fontWeight: 400, color: 'var(--text)', lineHeight: 1.3 },
  ficheDesc: { fontSize: '11px', fontWeight: 300, color: 'var(--text-muted)', lineHeight: 1.4 },

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
