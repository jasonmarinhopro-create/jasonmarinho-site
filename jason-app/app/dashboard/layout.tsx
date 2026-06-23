import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { getProfile } from '@/lib/queries/profile'
import { getCachedPublishedActualites } from '@/lib/queries/cache'
import { ThemeProvider } from '@/components/ThemeProvider'
import { OnboardingTracks } from '@/components/onboarding/OnboardingTracks'
import { detectTracksProgress } from '@/lib/onboarding/detect-tracks'
import InstallAppWidget from '@/components/InstallAppWidget'
import DashboardLoading from './loading'
import PageFadeWrapper from '@/components/dashboard/PageFadeWrapper'

function planToLabel(plan: 'decouverte' | 'standard' | 'driing', role: string): string {
  if (role === 'admin') return 'Administrateur'
  if (role === 'photographer') return 'Photographe annuaire'
  if (role === 'cleaner') return 'Équipe ménage annuaire'
  if (plan === 'driing') return 'Membre Driing'
  if (plan === 'standard') return 'Standard'
  return 'Découverte'
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, cachedActualites] = await Promise.all([
    getProfile(),
    getCachedPublishedActualites(),
  ])
  if (!profile) redirect('/auth/login')

  const isAdmin = profile.role === 'admin'
  const isPro = profile.role === 'photographer' || profile.role === 'cleaner'
  const planLabel = planToLabel(profile.plan, profile.role)

  // Onboarding multi-parcours : détecte la progression de chaque parcours.
  // Pros annuaire : pas d'onboarding hôte (sans intérêt pour eux).
  const onboardingState = isPro
    ? { totalDone: 1, totalSteps: 1, tracks: [] as Array<{ key: string; doneSteps: Set<string> }> }
    : await detectTracksProgress({
        userId: profile.userId,
        completedSteps: profile.onboarding_completed_steps,
        chezNousOnboardedAt: profile.chez_nous_onboarded_at,
        onboardingStep: profile.onboarding_step,
        stripeOnboardingComplete: profile.stripe_onboarding_complete,
      })
  const onboardingCompleted = onboardingState.totalDone === onboardingState.totalSteps
  const showOnboarding = !onboardingCompleted

  // Construit le map { trackKey: doneStepKeys[] } pour le composant client.
  const doneByTrack: Record<string, string[]> = {}
  onboardingState.tracks.forEach(t => { doneByTrack[t.key] = Array.from(t.doneSteps) })

  // Badge Actualités calculé une fois côté serveur — plus de requête DB par navigation.
  const latestPublishedAt = cachedActualites[0]?.published_at ?? null
  const hasNewActualites = !!(
    latestPublishedAt &&
    latestPublishedAt > (profile.last_seen_actualites_at ?? '1970-01-01T00:00:00Z')
  )

  return (
    <ThemeProvider>
      <div style={styles.layout}>
        {/* Sidebar et Header rendus une seule fois dans le layout, pas de re-mount entre navigations.
            Élimine le flicker du titre + économise 1 query Supabase par navigation. */}
        <Sidebar
          isAdmin={isAdmin}
          isContributor={profile.is_contributor ?? false}
          lastSeenActualitesAt={profile.last_seen_actualites_at}
          hasNewActualites={hasNewActualites}
          hasStripeAccount={profile.stripe_onboarding_complete}
          proRole={profile.role === 'photographer' || profile.role === 'cleaner' ? profile.role : null}
        />
        <Header
          userName={profile.full_name ?? undefined}
          currentPlan={planLabel}
          isAdmin={isAdmin}
          userId={profile.userId}
          lastSeenNouveautesAt={profile.last_seen_nouveautes_at}
          lastSeenActualitesAt={profile.last_seen_actualites_at}
          hasNewActualites={hasNewActualites}
          showOnboardingBtn={showOnboarding}
          hasStripeAccount={profile.stripe_onboarding_complete}
        />
        <main style={styles.main} className="dash-main">
          <Suspense fallback={<DashboardLoading />}>
            <PageFadeWrapper>{children}</PageFadeWrapper>
          </Suspense>
        </main>
        {showOnboarding && (
          <OnboardingTracks
            pinnedTrack={profile.onboarding_pinned_track}
            completedSteps={profile.onboarding_completed_steps}
            doneByTrack={doneByTrack}
            dismissed={profile.onboarding_dismissed}
            completed={onboardingCompleted}
            persistedStep={profile.onboarding_step}
            plan={profile.plan}
          />
        )}
        <InstallAppWidget />
      </div>
    </ThemeProvider>
  )
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    minHeight: '100svh',
  },
  main: {
    flex: 1,
    minWidth: 0,
    overflowX: 'hidden',
    marginLeft: 'var(--sidebar-w)',
    paddingTop: 'var(--header-h)',
    minHeight: '100svh',
    background: 'var(--bg)',
  },
}
