'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Scales, CurrencyEur, Armchair, Wrench, Star, ChartLine, ShieldCheck,
  HouseSimple, ArrowRight, ArrowUpRight, Lightbulb, CheckCircle,
} from '@phosphor-icons/react'

type ProfileId = 'debutant' | 'intermediaire' | 'pro'

interface Profile {
  id: ProfileId
  label: string
  desc: string
  emoji: string
  color: string
  bg: string
  priorities: string[]
  tips: string[]
}

interface Stat {
  value: string
  label: string
  source: string
  sourceUrl: string
}

interface Category {
  id: string
  icon: React.ReactNode
  color: string
  bg: string
  title: string
  subtitle: string
  stats: Stat[]
}

const PROFILES: Profile[] = [
  {
    id: 'debutant',
    label: 'Débutant',
    desc: '0 – 1 logement',
    emoji: '🌱',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.1)',
    priorities: ['reglementation', 'fiscalite', 'decoration'],
    tips: [
      'Vérifiez que votre règlement de copropriété autorise la LCD avant toute chose',
      'Déclarez votre meublé en mairie et obtenez votre numéro d\'enregistrement',
      'Comparez régime micro-BIC vs réel avant votre 1ère déclaration fiscale',
    ],
  },
  {
    id: 'intermediaire',
    label: 'Intermédiaire',
    desc: '1 – 3 logements',
    emoji: '🌿',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.1)',
    priorities: ['gestion', 'visibilite', 'revenus'],
    tips: [
      'Automatisez vos messages avec un PMS : économisez 8h+ par semaine',
      'Photos professionnelles = +25% de réservations en moyenne',
      'Activez la tarification dynamique pour +20–40% de revenus supplémentaires',
    ],
  },
  {
    id: 'pro',
    label: 'Pro',
    desc: '3+ logements',
    emoji: '🏢',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.1)',
    priorities: ['revenus', 'assurances', 'gestion'],
    tips: [
      'Structurez en SCI ou SASU pour optimiser fiscalement votre activité',
      'AirCover ≠ assurance réelle : souscrivez une couverture spécialisée LCD',
      'Un bon channel manager unifie vos calendriers sur toutes les plateformes',
    ],
  },
]

const CATEGORIES: Category[] = [
  {
    id: 'reglementation',
    icon: <Scales size={24} weight="fill" />,
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.12)',
    title: 'Réglementation',
    subtitle: 'Tes droits & obligations légales',
    stats: [
      { value: '120 nuits/an', label: 'Durée max légale pour louer sa résidence principale (Loi Le Meur, 2024).', source: 'jedeclaremonmeuble.com', sourceUrl: 'https://www.jedeclaremonmeuble.com/loi-le-meur-location-saisonniere-fiscalite/' },
      { value: '5 000 €', label: 'Amende max pour absence de numéro d\'enregistrement, obligatoire dès le 20 mai 2026.', source: 'loftely.com', sourceUrl: 'https://www.loftely.com/blog/actualites/reglementation-locations-saisonnieres-2026.html' },
      { value: '90 jours', label: 'Certaines communes (Paris, Marseille...) peuvent abaisser la limite à 90 j/an.', source: 'nousgerons.com', sourceUrl: 'https://www.nousgerons.com/la-loi-le-meur.html' },
    ],
  },
  {
    id: 'fiscalite',
    icon: <CurrencyEur size={24} weight="fill" />,
    color: '#34d399',
    bg: 'rgba(52,211,153,0.12)',
    title: 'Fiscalité',
    subtitle: 'Impôts, régimes et optimisation',
    stats: [
      { value: '15 000 €', label: 'Nouveau plafond micro-BIC pour meublés non classés (contre 77 700 € avant 2025).', source: 'service-public.fr', sourceUrl: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F32744' },
      { value: '30 %', label: 'Abattement micro-BIC pour meublés non classés — divisé par deux en 2025.', source: 'impots.gouv.fr', sourceUrl: 'https://www.impots.gouv.fr/particulier/les-regimes-dimposition' },
      { value: '85 %', label: 'Des cas où le régime réel est plus avantageux que le micro-BIC.', source: 'jedeclaremonmeuble.com', sourceUrl: 'https://www.jedeclaremonmeuble.com/le-regime-micro-bic/' },
    ],
  },
  {
    id: 'decoration',
    icon: <Armchair size={24} weight="fill" />,
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.12)',
    title: 'Décoration & Aménagement',
    subtitle: 'Créer un logement qui se démarque',
    stats: [
      { value: '+25 %', label: 'De réservations en plus avec des photos professionnelles vs amateurs.', source: 'objectif5etoiles.com', sourceUrl: 'https://www.objectif5etoiles.com/optimisation-de-vo-photos-airbnb-et-booking/' },
      { value: '+30 %', label: 'De réservations supplémentaires avec une déco soignée par rapport à un logement similaire.', source: 'rentaplus.immo', sourceUrl: 'https://www.rentaplus.immo/meubler-logement-airbnb-maximiser-reservations/' },
      { value: '3 000 – 7 000 €', label: 'Budget moyen pour meubler et équiper un appartement LCD de A à Z.', source: 'minut.com', sourceUrl: 'https://www.minut.com/fr/blog/amenager-appartement-airbnb-recommandations' },
    ],
  },
  {
    id: 'gestion',
    icon: <Wrench size={24} weight="fill" />,
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.12)',
    title: 'Gestion Locative',
    subtitle: 'Automatise et gagne du temps',
    stats: [
      { value: '8–12 h/sem', label: 'Temps moyen consacré à gérer un logement sans outils d\'automatisation.', source: 'jedeclaremonmeuble.com', sourceUrl: 'https://www.jedeclaremonmeuble.com/automatiser-airbnb-guide/' },
      { value: '-70 %', label: 'De temps gagné en adoptant un PMS + channel manager pour ses annonces.', source: 'chamconcierge.com', sourceUrl: 'https://www.chamconcierge.com/post/channel-manager-et-pms-la-solution-indispensable-pour-la-gestion-locative-moderne' },
      { value: '70 %', label: 'Des réservations Airbnb se jouent dans les 15 min suivant la demande.', source: 'jedeclaremonmeuble.com', sourceUrl: 'https://www.jedeclaremonmeuble.com/automatiser-airbnb-guide/' },
    ],
  },
  {
    id: 'visibilite',
    icon: <Star size={24} weight="fill" />,
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.12)',
    title: 'Réputation & Avis',
    subtitle: 'Construire un profil 5 étoiles',
    stats: [
      { value: '4,8 ⭐ min', label: 'Note minimale requise pour obtenir et conserver le statut Superhôte Airbnb.', source: 'eldorado-immobilier.com', sourceUrl: 'https://eldorado-immobilier.com/statistiques-sur-airbnb/' },
      { value: '+30 %', label: 'De revenus supplémentaires pour un Superhôte parisien vs un hôte standard.', source: 'reussirsalocationcourteduree.fr', sourceUrl: 'https://reussirsalocationcourteduree.fr/statistiques-airbnb-2025-revenus-rentabilite/' },
      { value: 'x3', label: 'Les chances d\'être cliqué pour une annonce en 1ère position vs les suivantes.', source: 'reussirsalocationcourteduree.fr', sourceUrl: 'https://reussirsalocationcourteduree.fr/optimiser-annonce-airbnb-2026/' },
    ],
  },
  {
    id: 'assurances',
    icon: <ShieldCheck size={24} weight="fill" />,
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.12)',
    title: 'Assurances & Protection',
    subtitle: 'Être bien couvert en toutes circonstances',
    stats: [
      { value: '3 M$', label: 'Couverture dommages AirCover pour les hôtes — ce n\'est pas une assurance classique.', source: 'halobutler.fr', sourceUrl: 'https://halobutler.fr/blog/fiscalite-reglementation-airbnb/assurance-airbnb-que-couvre-aircover/' },
      { value: '1 M$', label: 'Couverture responsabilité civile AirCover (dommages corporels/matériels à des tiers).', source: 'jedeclaremonmeuble.com', sourceUrl: 'https://www.jedeclaremonmeuble.com/aircover/' },
      { value: '⚠️ 14 jours', label: 'Délai max pour activer AirCover après le départ du voyageur — passé ce délai, rien.', source: 'locandsmile.fr', sourceUrl: 'https://locandsmile.fr/assurance-airbnb-ce-que-laircover-ne-vous-dit-pas-sur-vos-protections/' },
    ],
  },
  {
    id: 'revenus',
    icon: <ChartLine size={24} weight="fill" />,
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
    title: 'Revenus & Tarification',
    subtitle: 'Maximise tes gains chaque nuit',
    stats: [
      { value: '11 200 €/an', label: 'Revenu moyen annuel d\'un hôte Airbnb en France en 2025 (118 €/nuit en moyenne).', source: 'eldorado-immobilier.com', sourceUrl: 'https://eldorado-immobilier.com/statistiques-sur-airbnb/' },
      { value: '+20–40 %', label: 'De revenus supplémentaires avec tarification dynamique vs prix fixe.', source: 'quelleconciergerie.fr', sourceUrl: 'https://www.quelleconciergerie.fr/blog-posts/tarification-dynamique-airbnb' },
      { value: '63 %', label: 'Taux d\'occupation moyen Airbnb en France — 70 %+ à Paris.', source: 'eldorado-immobilier.com', sourceUrl: 'https://eldorado-immobilier.com/taux-remplissage-location-saisonniere/' },
    ],
  },
]

function CategoryCard({ cat, priority = false, profileColor }: { cat: Category; priority?: boolean; profileColor?: string }) {
  return (
    <div
      style={{
        ...s.card,
        ...(priority ? { borderColor: profileColor ? `${profileColor}30` : 'var(--border-2)' } : {}),
      }}
      className="glass-card"
    >
      {priority && profileColor && (
        <div style={{ ...s.priorityBadge, color: profileColor, background: `${profileColor}15`, borderColor: `${profileColor}25` }}>
          Prioritaire
        </div>
      )}
      <div style={s.cardHead}>
        <div style={{ ...s.iconBox, background: cat.bg, color: cat.color }}>{cat.icon}</div>
        <div>
          <h3 style={s.cardTitle}>{cat.title}</h3>
          <p style={s.cardSub}>{cat.subtitle}</p>
        </div>
      </div>
      <div style={s.stats}>
        {cat.stats.map((stat, si) => (
          <div key={si} style={s.statRow}>
            <div style={{ ...s.statValue, color: cat.color }}>{stat.value}</div>
            <div style={s.statRight}>
              <p style={s.statLabel}>{stat.label}</p>
              <a href={stat.sourceUrl} target="_blank" rel="noopener noreferrer" style={s.statSource} className="guide-source-link">
                {stat.source} <ArrowUpRight size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function GuideUI() {
  const [activeProfileId, setActiveProfileId] = useState<ProfileId | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('guide-profile') as ProfileId | null
    if (saved && ['debutant', 'intermediaire', 'pro'].includes(saved)) {
      setActiveProfileId(saved)
    }
  }, [])

  function selectProfile(id: ProfileId) {
    setActiveProfileId(prev => {
      const next = prev === id ? null : id
      if (next) localStorage.setItem('guide-profile', next)
      else localStorage.removeItem('guide-profile')
      return next
    })
  }

  const profile = PROFILES.find(p => p.id === activeProfileId) ?? null
  const priorityCats = profile ? CATEGORIES.filter(c => profile.priorities.includes(c.id)) : []
  const remainingCats = profile ? CATEGORIES.filter(c => !profile.priorities.includes(c.id)) : CATEGORIES

  return (
    <div style={s.page}>

      {/* Intro */}
      <div style={s.intro} className="fade-up">
        <h2 style={s.pageTitle}>
          Guide <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>LCD</em>
        </h2>
        <p style={s.pageDesc}>
          Chiffres clés, faits essentiels et sources fiables pour maîtriser chaque aspect
          de la location courte durée — réglementation, fiscalité, gestion et rentabilité.
        </p>
      </div>

      {/* Profile selector */}
      <div style={s.profileSection} className="fade-up d1">
        <div style={s.profileSectionHeader}>
          <Lightbulb size={14} weight="fill" style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
          <span style={s.profileSectionLabel}>
            Sélectionne ton profil pour voir les thèmes essentiels
          </span>
        </div>
        <div className="guide-profile-grid">
          {PROFILES.map(p => {
            const isActive = activeProfileId === p.id
            return (
              <button
                key={p.id}
                onClick={() => selectProfile(p.id)}
                style={{
                  ...s.profileCard,
                  ...(isActive ? { borderColor: p.color, background: p.bg } : {}),
                }}
              >
                <span style={s.profileEmoji}>{p.emoji}</span>
                <div style={s.profileInfo}>
                  <div style={{ ...s.profileName, ...(isActive ? { color: p.color } : {}) }}>{p.label}</div>
                  <div style={s.profileDesc}>{p.desc}</div>
                </div>
                {isActive && (
                  <CheckCircle size={16} weight="fill" style={{ color: p.color, marginLeft: 'auto', flexShrink: 0 }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Priority section — only when profile selected */}
      {profile && mounted && (
        <div className="fade-up">
          <div style={s.sectionLabelRow}>
            <span style={{ ...s.profilePill, color: profile.color, background: profile.bg, borderColor: `${profile.color}25` }}>
              {profile.emoji} {profile.label}
            </span>
            <span style={s.sectionLabelText}>Essentiels pour toi</span>
          </div>

          <div className="guide-priority-grid" style={{ marginBottom: '20px' }}>
            {priorityCats.map(cat => (
              <CategoryCard key={cat.id} cat={cat} priority profileColor={profile.color} />
            ))}
          </div>

          {/* Profile tips */}
          <div style={s.tipsBox} className="glass-card">
            <div style={s.tipsHeader}>
              <Lightbulb size={14} weight="fill" style={{ color: 'var(--accent-text)' }} />
              <span style={s.tipsTitle}>Conseils clés — {profile.label}</span>
            </div>
            <div style={s.tipsList}>
              {profile.tips.map((tip, i) => (
                <div key={i} style={s.tipItem}>
                  <span style={{ ...s.tipDot, background: profile.color }} />
                  <span style={s.tipText}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All / remaining categories */}
      <div className="fade-up d2">
        {profile && (
          <div style={s.sectionLabelSimple}>Tous les thèmes</div>
        )}
        <div style={s.grid} className="dash-grid-2">
          {remainingCats.map(cat => (
            <CategoryCard key={cat.id} cat={cat} />
          ))}
        </div>
      </div>

      {/* Driing banner */}
      <div style={s.banner} className="fade-up glass-card">
        <div style={s.bannerIcon}>
          <HouseSimple size={28} color="var(--accent-text)" weight="fill" />
        </div>
        <div style={s.bannerText}>
          <h3 style={s.bannerTitle}>Tu connais Driing ?</h3>
          <p style={s.bannerDesc}>
            La plateforme de réservation sans commissions pour hôtes LCD — alternative directe à Airbnb.
          </p>
        </div>
        <Link
          href="https://jasonmarinho.fr/blog/driing-plateforme-vacances-sans-commissions"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{ fontSize: '13px', padding: '10px 18px', flexShrink: 0 }}
        >
          Découvrir <ArrowRight size={14} weight="bold" />
        </Link>
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
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },

  intro: { marginBottom: '32px', maxWidth: '640px' },
  pageTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: 'var(--text)', marginBottom: '10px' },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.7 },

  profileSection: { marginBottom: '32px' },
  profileSectionHeader: { display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' },
  profileSectionLabel: { fontSize: '13px', fontWeight: 400, color: 'var(--text-3)' },

  profileCard: {
    display: 'flex', alignItems: 'center', gap: '12px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '14px 18px',
    cursor: 'pointer', textAlign: 'left' as const,
    transition: 'border-color 0.18s, background 0.18s',
    width: '100%',
  },
  profileEmoji: { fontSize: '22px', flexShrink: 0, lineHeight: 1 },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: { fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' },
  profileDesc: { fontSize: '12px', fontWeight: 400, color: 'var(--text-3)' },

  sectionLabelRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
  sectionLabelText: { fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const, color: 'var(--text-muted)' },
  sectionLabelSimple: { fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: '16px' },

  profilePill: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', fontWeight: 600, padding: '4px 10px',
    borderRadius: '100px', border: '1px solid',
  },

  grid: { marginBottom: '32px' },

  card: { padding: '22px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' as const },
  priorityBadge: {
    position: 'absolute' as const, top: '16px', right: '16px',
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const, padding: '3px 8px',
    borderRadius: '100px', border: '1px solid',
  },
  cardHead: { display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '18px' },
  iconBox: { width: '48px', height: '48px', borderRadius: '13px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'Fraunces, serif', fontSize: '17px', fontWeight: 400, color: 'var(--text)', margin: '0 0 3px' },
  cardSub: { fontSize: '12px', fontWeight: 300, color: 'var(--text-2)', margin: 0 },

  stats: { display: 'flex', flexDirection: 'column', gap: '10px' },
  statRow: { display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '10px 12px', borderRadius: '10px', background: 'var(--border)' },
  statValue: { fontSize: '17px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' as const, letterSpacing: '-0.02em', lineHeight: 1.2, minWidth: '88px', flexShrink: 0, paddingTop: '1px' },
  statRight: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 },
  statLabel: { fontSize: '12px', fontWeight: 400, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 },
  statSource: { fontSize: '11px', fontWeight: 400, color: 'var(--text-3)', lineHeight: 1 },

  tipsBox: { padding: '20px 24px', borderRadius: '16px', marginBottom: '32px' },
  tipsHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' },
  tipsTitle: { fontSize: '13px', fontWeight: 600, color: 'var(--text)' },
  tipsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  tipItem: { display: 'flex', alignItems: 'flex-start', gap: '10px' },
  tipDot: { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, marginTop: '6px' },
  tipText: { fontSize: '13px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.6 },

  banner: { display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' as const, padding: 'clamp(20px,3vw,32px)', borderRadius: '20px' },
  bannerIcon: { width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0, background: 'rgba(0,76,63,0.25)', border: '1px solid rgba(255,213,107,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  bannerText: { flex: 1, minWidth: '200px' },
  bannerTitle: { fontFamily: 'Fraunces, serif', fontSize: '17px', fontWeight: 400, color: 'var(--text)', margin: '0 0 4px' },
  bannerDesc: { fontSize: '13px', fontWeight: 300, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 },
}
