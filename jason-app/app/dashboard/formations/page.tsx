import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import FormationsSuggestForm from './FormationsSuggestForm'
import FormationsGrid from './FormationsGrid'
import { getUnlockedFormationSlugs } from '@/lib/queries/formation-access'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tes formations LCD, Jason Marinho',
  description: 'Des parcours concrets pour optimiser ta location courte durée. Visibilité, revenus, fiscalité, conciergerie, accessibles à vie, à ton rythme.',
  openGraph: {
    type: 'website',
    title: 'Formations LCD pour hôtes & conciergeries · Jason Marinho',
    description: 'GMB, tarification dynamique, fiscalité 2026, créer sa conciergerie, optimiser son annonce Airbnb… 16 formations pratiques pour la location courte durée.',
    siteName: 'Jason Marinho, Plateforme LCD',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Formations LCD pour hôtes & conciergeries',
    description: '16 formations pratiques pour la location courte durée.',
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
]

// Formations à venir, hardcodées, pas encore en DB
const COMING_SOON: never[] = []

export default async function FormationsPage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])
  const userId = profile?.userId ?? ''

  const plan = profile?.plan ?? 'decouverte'

  const [{ data: formations }, { data: userFormations }, { data: favorites }, unlockedSlugs] = await Promise.all([
    supabase.from('formations').select('id, slug, title, description, duration, level, modules_count, lessons_count').in('slug', ACTIVE_SLUGS).eq('is_published', true).order('created_at', { ascending: true }),
    supabase.from('user_formations').select('formation_id, progress').eq('user_id', userId),
    supabase.from('user_formation_favorites').select('formation_id').eq('user_id', userId),
    getUnlockedFormationSlugs(supabase, userId, plan),
  ])

  const progressMap = Object.fromEntries(
    (userFormations ?? []).map(uf => [uf.formation_id, uf.progress])
  )
  const favoriteIds = new Set((favorites ?? []).map((f: { formation_id: string }) => f.formation_id))

  return (
    <>

      <div style={styles.page} className="formations-no-fade">
        <div style={styles.intro} className="fade-up">
          <h2 style={styles.pageTitle}>Tes <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>formations</em></h2>
          <p style={styles.pageDesc}>Des parcours concrets pour optimiser ta location courte durée. Accessibles à vie, à ton rythme.</p>
        </div>

        <div style={styles.section} className="fade-up d1">
          <FormationsGrid
            formations={(formations ?? []) as import('@/types').Formation[]}
            progressMap={progressMap}
            comingSoon={COMING_SOON}
            unlockedSlugs={unlockedSlugs}
            plan={plan}
            initialFavoriteIds={Array.from(favoriteIds) as string[]}
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
  intro: { marginBottom: '28px' },
  pageTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(24px,3vw,38px)', fontWeight: 400, color: 'var(--text)', marginBottom: '10px' },
  pageDesc: { fontSize: '14px', fontWeight: 300, color: 'var(--text-2)', maxWidth: '520px', lineHeight: 1.6 },
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
