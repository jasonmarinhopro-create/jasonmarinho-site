import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import FormationsSuggestForm from './FormationsSuggestForm'
import FormationsGrid from './FormationsGrid'
import FormationsHighlights, { type HighlightFormation } from './FormationsHighlights'
import Link from 'next/link'
import { ArrowRight, Compass, GraduationCap } from '@phosphor-icons/react/dist/ssr'
import HubHero, { HeroEm, heroCard, heroCta, heroLink } from '@/components/dashboard/HubHero'
import { recommendFormations } from '@/lib/formations/recommend'
import { getUnlockedFormationSlugs } from '@/lib/queries/formation-access'
import { getCachedPublishedFormations } from '@/lib/queries/cache'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tes formations LCD, Jason Marinho',
  description: 'Des parcours concrets pour optimiser ta location courte durée. Visibilité, revenus, fiscalité, conciergerie, accessibles à vie, à ton rythme.',
  openGraph: {
    type: 'website',
    title: 'Formations LCD pour hôtes & conciergeries · Jason Marinho',
    description: 'GMB, tarification dynamique, fiscalité 2026, créer sa conciergerie, optimiser son annonce Airbnb… 21 formations pratiques pour la location courte durée.',
    siteName: 'Jason Marinho, Plateforme LCD',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Formations LCD pour hôtes & conciergeries',
    description: '21 formations pratiques pour la location courte durée.',
  },
  robots: { index: false, follow: false },
}

// Toutes les formations disponibles avec une page dashboard
const ACTIVE_SLUGS = [
  'google-my-business-lcd',
  'annonce-directe',
  'tarification-dynamique',
  'securiser-reservations-eviter-mauvais-voyageurs',
  'reseaux-sociaux-lcd',
  'optimiser-annonce-airbnb',
  'mettre-le-bon-prix-lcd',
  'livret-accueil-digital',
  'lcd-basse-saison',
  'gerer-lcd-automatisation',
  'fiscalite-reglementation-lcd-france-2026',
  'ecrire-avis-repondre-voyageurs',
  'decorer-amenager-logement-lcd',
  'creer-conciergerie-lcd',
  'fiscalite-statut-conciergerie-tourisme',
  'maitriser-booking-com-algorithme-genius',
  'photographie-lcd-smartphone',
  'gerer-incidents-litiges-lcd',
  'annonce-360',
  'audit-annonce',
  'declarer-lmnp-seul-decla-fr',
]

// Formations à venir, hardcodées, pas encore en DB
const COMING_SOON: never[] = []

export default async function FormationsPage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])
  const userId = profile?.userId ?? ''

  const plan = profile?.plan ?? 'decouverte'

  const [allCachedFormations, { data: userFormations }, { data: favorites }, unlockedSlugs, { data: logementsPays }, { count: contractsCount }] = await Promise.all([
    // Catalogue public partagé entre tous les users (caché 10 min).
    getCachedPublishedFormations(),
    supabase.from('user_formations').select('formation_id, progress').eq('user_id', userId),
    supabase.from('user_formation_favorites').select('formation_id').eq('user_id', userId),
    getUnlockedFormationSlugs(supabase, userId, plan),
    // Recommandations « Pour toi » : pays des logements + réservations directes
    supabase.from('logements').select('pays').eq('user_id', userId),
    supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  // Filtre côté JS sur ACTIVE_SLUGS : la liste est petite et la donnée
  // cachée, donc moins coûteux que de re-querier la DB par utilisateur.
  const activeSet = new Set(ACTIVE_SLUGS)
  const formations = allCachedFormations.filter(f => activeSet.has(f.slug))

  const progressMap = Object.fromEntries(
    (userFormations ?? []).map(uf => [uf.formation_id, uf.progress])
  )
  const favoriteIds = new Set((favorites ?? []).map((f: { formation_id: string }) => f.formation_id))

  const startedCount = formations.filter(f => progressMap[f.id] !== undefined).length
  const doneCount = formations.filter(f => progressMap[f.id] === 100).length

  // « Reprendre » : la formation commencée la plus avancée (hors terminées).
  const inProgress = formations
    .filter(f => (progressMap[f.id] ?? 0) > 0 && (progressMap[f.id] ?? 0) < 100)
    .sort((a, b) => (progressMap[b.id] ?? 0) - (progressMap[a.id] ?? 0))[0]
  const resume: HighlightFormation | null = inProgress
    ? { slug: inProgress.slug, title: inProgress.title, duration: inProgress.duration, progress: progressMap[inProgress.id] }
    : null

  // « Pour toi » : formations accessibles (Découverte : 2 accès gratuits)
  // non commencées, choisies d'après la situation de l'hôte.
  const slotsFull = unlockedSlugs !== null && unlockedSlugs.length >= 2
  const accessible = formations.filter(f => !slotsFull || unlockedSlugs!.includes(f.slug))
  const bySlug = new Map(formations.map(f => [f.slug, f]))
  const recommended: HighlightFormation[] = recommendFormations({
    countries: Array.from(new Set((logementsPays ?? []).map(l => (l as { pays: string | null }).pays ?? 'FR'))),
    logementsCount: (logementsPays ?? []).length,
    hasContracts: (contractsCount ?? 0) > 0,
    month: new Date().getMonth() + 1,
    startedSlugs: new Set(formations.filter(f => progressMap[f.id] !== undefined).map(f => f.slug)),
    availableSlugs: new Set(accessible.map(f => f.slug)),
  }).map(r => {
    const f = bySlug.get(r.slug)!
    return { slug: f.slug, title: f.title, duration: f.duration, reason: r.reason }
  })

  return (
    <>

      <div style={styles.page} className="formations-no-fade">
        {/* Hero (sept. 2026, même gabarit vert que Trouver des voyageurs) :
            la promesse, 3 étapes, une action, et à droite la reprise ou les chiffres.
            Remplace le titre + la bannière Parcours + les compteurs + les barres
            profil/favoris qui s'empilaient avant le catalogue. */}
        <HubHero
          eyebrowIcon={<GraduationCap size={14} weight="fill" />}
          eyebrow="Formations"
          title={<>Progresse à ton rythme, <HeroEm>une leçon à la fois</HeroEm></>}
          desc={`${formations.length} formations concrètes et à jour (visibilité, prix, fiscalité, réservation directe), accessibles à vie.`}
          steps={[
            ['Choisis', 'une formation ou un parcours'],
            ['Avance', 'leçon par leçon'],
            ['Applique', 'directement dans ton espace'],
          ]}
          aside={
            <div style={{ ...heroCard, flex: '1 1 260px' }}>
              {resume ? (
                <>
                  <span style={styles.asideLabel}>Reprendre</span>
                  <span style={styles.asideTitle}>{resume.title}</span>
                  <span style={styles.asideBar}><span style={{ ...styles.asideFill, width: `${resume.progress ?? 0}%` }} /></span>
                  <span style={styles.asideMeta}>{resume.progress ?? 0} % terminé</span>
                  <Link href={`/dashboard/formations/${resume.slug}`} style={{ ...heroCta, justifyContent: 'center', marginTop: '6px' }}>
                    Continuer <ArrowRight size={14} weight="bold" />
                  </Link>
                </>
              ) : (
                <>
                  <span style={styles.asideLabel}>Ta progression</span>
                  <span style={styles.asideStat}>{startedCount}<span style={styles.asideStatOf}> / {formations.length}</span></span>
                  <span style={styles.asideMeta}>formations commencées · {doneCount} terminée{doneCount > 1 ? 's' : ''}</span>
                </>
              )}
              <span style={styles.asideLinks}>
                <Link href="/dashboard/formations/profil-apprenant" style={heroLink}>Mon profil apprenant</Link>
                <Link href="/dashboard/formations/favoris" style={heroLink}>Mes favoris</Link>
              </span>
            </div>
          }
        >
          <div style={styles.ctaRow}>
            <Link href="/dashboard/formations/parcours" style={heroCta}>
              <Compass size={16} weight="fill" /> Suivre un parcours guidé
            </Link>
            <a href="#catalogue" style={heroLink}>Voir tout le catalogue</a>
          </div>
        </HubHero>

        <FormationsHighlights resume={null} recommended={recommended} />

        <div id="catalogue" style={{ scrollMarginTop: '80px' }} />
        <div style={styles.section} className="fade-up d1">
          <FormationsGrid
            formations={formations as unknown as import('@/types').Formation[]}
            progressMap={progressMap}
            comingSoon={COMING_SOON}
            unlockedSlugs={unlockedSlugs}
            plan={plan}
            initialFavoriteIds={Array.from(favoriteIds) as string[]}
            hideHeader
          />
        </div>

        {/* Suggestion de formation */}
        <div style={styles.suggestSection} className="fade-up d3">
          <div style={styles.suggestBox} className="glass-card">
            <div style={styles.suggestLeft}>
              <div style={styles.suggestEmoji}>💡</div>
              <div>
                <h3 style={styles.suggestTitle}>
                  Tu voudrais une formation sur un autre sujet ?
                </h3>
                <p style={styles.suggestDesc}>
                  Dis-nous ce qui t'aiderait le plus dans ton activité, on construit les prochaines formations en fonction de tes besoins.
                </p>
              </div>
            </div>
            <FormationsSuggestForm />
          </div>
        </div>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(16px,3vw,44px)', width: '100%' },
  ctaRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 18px' },
  asideLabel: { fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  asideTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '19px', color: 'var(--text)', lineHeight: 1.3 },
  asideBar: { display: 'block', height: '6px', borderRadius: '999px', background: 'var(--bg)', overflow: 'hidden' },
  asideFill: { display: 'block', height: '100%', borderRadius: '999px', background: 'var(--accent-text)' },
  asideMeta: { fontSize: '12.5px', color: 'var(--text-3)' },
  asideStat: { fontFamily: 'var(--font-fraunces), serif', fontSize: '40px', lineHeight: 1, color: 'var(--accent-text)' },
  asideStatOf: { fontSize: '18px', color: 'var(--text-3)' },
  asideLinks: { display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: '6px', paddingTop: '10px', borderTop: '1px solid var(--border)' },
  section: { marginBottom: '32px' },
  suggestSection: { marginTop: '8px' },
  suggestBox: {
    display: 'flex', alignItems: 'flex-start', gap: '24px',
    padding: 'clamp(16px,3vw,32px)', borderRadius: '20px', flexWrap: 'wrap',
  },
  suggestLeft: { display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '220px' },
  suggestEmoji: { fontSize: '26px', flexShrink: 0, marginTop: '3px' },
  suggestTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(17px,2vw,20px)', fontWeight: 400, color: 'var(--text)', marginBottom: '8px', lineHeight: 1.3 },
  suggestDesc: { fontSize: '14px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.6 },
}
