import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { getProfile } from '@/lib/queries/profile'
import { getCachedPublishedActualites } from '@/lib/queries/cache'
import { ThemeProvider } from '@/components/ThemeProvider'
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist'
import { detectOnboardingStep } from '@/lib/onboarding/steps'
import DashboardLoading from './loading'

function planToLabel(plan: 'decouverte' | 'standard' | 'driing', role: 'user' | 'driing' | 'admin'): string {
  if (role === 'admin') return 'Administrateur'
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
  const planLabel = planToLabel(profile.plan, profile.role)

  // Onboarding : ne lance la détection que si la checklist peut s'afficher
  const showOnboarding = !profile.onboarding_dismissed
  const onboardingState = showOnboarding
    ? await detectOnboardingStep(profile.userId, profile.onboarding_step)
    : { current: 6, completed: true }

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
        />
        <Header
          userName={profile.full_name ?? undefined}
          currentPlan={planLabel}
          isAdmin={isAdmin}
          userId={profile.userId}
          lastSeenNouveautesAt={profile.last_seen_nouveautes_at}
          lastSeenActualitesAt={profile.last_seen_actualites_at}
          hasNewActualites={hasNewActualites}
        />
        <main style={styles.main} className="dash-main">
          <Suspense fallback={<DashboardLoading />}>
            {children}
          </Suspense>
        </main>
        {showOnboarding && (
          <OnboardingChecklist
            currentStep={onboardingState.current}
            dismissed={profile.onboarding_dismissed}
            completed={!!profile.onboarding_completed_at}
            persistedStep={profile.onboarding_step}
          />
        )}
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
