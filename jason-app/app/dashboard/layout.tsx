import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Suspense } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { getProfile } from '@/lib/queries/profile'
import { getCachedPublishedActualites } from '@/lib/queries/cache'
import { getUserSpaces } from '@/lib/queries/spaces'
import { getActiveProperty } from '@/lib/queries/active-property'
import { ThemeProvider } from '@/components/ThemeProvider'
import { OnboardingTracks } from '@/components/onboarding/OnboardingTracks'
import { detectTracksProgress } from '@/lib/onboarding/detect-tracks'
import { persistOnboardingCompleted } from '@/lib/onboarding/persist-complete'
import InstallAppWidget from '@/components/InstallAppWidget'
import DashboardLoading from './loading'
import PageFadeWrapper from '@/components/dashboard/PageFadeWrapper'

function planToLabel(plan: 'decouverte' | 'standard' | 'driing', role: string): string {
  if (role === 'admin') return 'Administrateur'
  if (plan === 'driing') return 'Membre Driing'
  if (plan === 'standard') return 'Standard'
  return 'Découverte'
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers()
  const pathname = hdrs.get('x-pathname') ?? '/dashboard'

  // PERF : detectTracksProgress (7 tests d'existence, ~200-500ms, non
  // cachable) ne dépend QUE du profil — pas des 3 autres requêtes. Avant, il
  // s'exécutait EN SÉRIE après le Promise.all (waterfall qui alourdissait
  // chaque nav, dont le login → dashboard). On le lance dès que le profil est
  // prêt, EN PARALLÈLE d'actualites / spaces / activeProperty.
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  // L'espace courant pour l'onboarding (purement server) — la sidebar et le
  // header le recalculent client-side via usePathname() pour survivre au
  // router cache des layouts.
  const isOnProSpace =
    pathname.startsWith('/dashboard/ma-fiche-photographe') ||
    pathname.startsWith('/dashboard/ma-fiche-menage') ||
    // L'espace investisseur (pré-achat) n'a ni logement ni voyageur :
    // l'onboarding hôte (Parcours) n'y a pas de sens.
    pathname.startsWith('/dashboard/investir')

  // PERF + fix flash : si l'onboarding est TERMINÉ (onboarding_completed_at),
  // on NE lance PAS detectTracksProgress (7 requêtes, ~200-500ms) et on NE
  // rend PAS le widget — c'est le cas de l'hôte qui voit "l'onboarding déjà
  // complet qui s'affiche puis disparaît". Avant, la détection tournait à
  // chaque nav même pour lui.
  // NB : on ne skippe PAS pour onboarding_dismissed seul — le bouton
  // « Parcours » de l'en-tête permet de le rouvrir, et le widget doit rester
  // monté (rendu null) pour écouter cet événement de restauration.
  const onboardingOff = isOnProSpace || !!profile.onboarding_completed_at

  const emptyOnboarding = { totalDone: 1, totalSteps: 1, tracks: [] as Array<{ key: string; doneSteps: Set<string> }> }

  const [cachedActualites, spacesResult, activeProperty, onboardingState] = await Promise.all([
    getCachedPublishedActualites(),
    getUserSpaces(),
    getActiveProperty(),
    onboardingOff
      ? Promise.resolve(emptyOnboarding)
      : detectTracksProgress({
          userId: profile.userId,
          completedSteps: profile.onboarding_completed_steps,
          chezNousOnboardedAt: profile.chez_nous_onboarded_at,
          onboardingStep: profile.onboarding_step,
          stripeOnboardingComplete: profile.stripe_onboarding_complete,
        }),
  ])

  const isAdmin = profile.role === 'admin'
  const planLabel = planToLabel(profile.plan, profile.role)
  const onboardingCompleted = onboardingState.totalDone === onboardingState.totalSteps
  const showOnboarding = !onboardingOff && !onboardingCompleted

  // Backfill paresseux : la détection vient de tourner et conclut "terminé",
  // mais le flag n'était pas encore posé → on l'écrit une fois (fire-and-forget)
  // pour que les prochaines navs sautent detectTracksProgress.
  if (!onboardingOff && onboardingCompleted && !profile.onboarding_completed_at) {
    void persistOnboardingCompleted(profile.userId)
  }

  const doneByTrack: Record<string, string[]> = {}
  onboardingState.tracks.forEach(t => { doneByTrack[t.key] = Array.from(t.doneSteps) })

  const latestPublishedAt = cachedActualites[0]?.published_at ?? null
  const hasNewActualites = !!(
    latestPublishedAt &&
    latestPublishedAt > (profile.last_seen_actualites_at ?? '1970-01-01T00:00:00Z')
  )

  return (
    <ThemeProvider>
      <div style={styles.layout}>
        <Sidebar
          isAdmin={isAdmin}
          isContributor={profile.is_contributor ?? false}
          lastSeenActualitesAt={profile.last_seen_actualites_at}
          hasNewActualites={hasNewActualites}
          hasStripeAccount={profile.stripe_onboarding_complete}
          allProperties={activeProperty.allProperties}
          activePropertyId={activeProperty.propertyId}
          userName={profile.full_name ?? undefined}
          userPlanLabel={planLabel}
          userId={profile.userId}
          spaces={spacesResult.spaces}
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
          spaces={spacesResult.spaces}
          // Forwarded to mobile drawer Sidebar (via Header) — sinon menu user mobile
          // affiche "Mon compte / Découverte" au lieu du vrai profil
          isContributor={profile.is_contributor ?? false}
          allProperties={activeProperty.allProperties}
          activePropertyId={activeProperty.propertyId}
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
