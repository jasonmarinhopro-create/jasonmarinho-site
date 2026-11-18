import { redirect } from 'next/navigation'
import { forAudience, hasNewFor } from '@/lib/actualites/audience'
import { loadProNewDemandes, loadProActusSeen } from '@/lib/pros/nav-counts'
import { loadContractTodoCount } from '@/lib/contracts/nav-count'
import { headers, cookies } from 'next/headers'
import { Suspense } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { getProfile } from '@/lib/queries/profile'
import { getCachedPublishedActualites, getCachedPublishedFormations } from '@/lib/queries/cache'
import { derniereNouvelleFormationAt } from '@/lib/formations/nouveau'
import { getUserSpaces } from '@/lib/queries/spaces'
import { getActiveProperty } from '@/lib/queries/active-property'
import { getUnreadCount, getChezNousUnreadCount } from '@/lib/notifications/queries'
import { ThemeProvider } from '@/components/ThemeProvider'
import { OnboardingTracks } from '@/components/onboarding/OnboardingTracks'
import { detectTracksProgressCached, buildTracksState } from '@/lib/onboarding/detect-tracks'
import { loadMenuState } from '@/lib/layout/menu-state'
import { contractTodos, contractTodoCount } from '@/lib/contracts/todo'
import { parisToday } from '@/lib/stripe/deposit-window'
import { persistOnboardingCompleted } from '@/lib/onboarding/persist-complete'
import InstallAppWidget from '@/components/InstallAppWidget'
import DashboardLoading from './loading'
import PageFadeWrapper from '@/components/dashboard/PageFadeWrapper'
import ShellFallback from '@/components/layout/ShellFallback'
import LaunchSplashOut from '@/components/layout/LaunchSplashOut'
import MenuLivePush from '@/components/layout/MenuLive'
import PerfReporter from '@/components/perf/PerfReporter'
import LastSeenPing from '@/components/layout/LastSeenPing'
import { perfTimer } from '@/lib/perf/server-timing'

function planToLabel(plan: 'decouverte' | 'standard' | 'driing', role: string): string {
  if (role === 'admin') return 'Administrateur'
  if (plan === 'driing') return 'Membre Driing'
  if (plan === 'standard') return 'Standard'
  return 'Découverte'
}

// Ouverture de l'app (30/09/2026, Jason : « 10 secondes de page blanche ») :
// le layout attendait le profil, les espaces, la cloche et l'onboarding avant
// d'envoyer le moindre octet. Le cadre (barre latérale, en-tête, squelette)
// part maintenant tout de suite, le reste arrive en streaming.
//
// Écran rapide sans à-coup : à l'ouverture de l'app (cookie court posé par
// /ouverture), l'écran continue celui de /ouverture sans délai puis s'efface
// en fondu sur la page arrivée. Sinon, il n'apparaît qu'après 0,45 s : une
// page rapide s'affiche directement, sans flash vert de 0,1 s.
const LAUNCH_COOKIE = 'jm-launch'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const launch = cookies().get(LAUNCH_COOKIE)?.value === '1'
  return (
    <Suspense fallback={<ShellFallback variant={launch ? 'instant' : 'delayed'} />}>
      <DashboardShell launch={launch}>{children}</DashboardShell>
    </Suspense>
  )
}

async function DashboardShell({ children, launch = false }: { children: React.ReactNode; launch?: boolean }) {
  const hdrs = await headers()
  const pathname = hdrs.get('x-pathname') ?? '/dashboard'
  const mwAuthMs = Number(hdrs.get('x-mw-auth-ms'))
  const timer = perfTimer('layout ' + pathname, Number.isFinite(mwAuthMs) && mwAuthMs > 0 ? [['vérif session', mwAuthMs]] : [])

  // PERF : les 3 requêtes indépendantes du profil démarrent AVANT l'await
  // du profil (sinon un étage réseau complet s'ajoute en série : getUser
  // du profil PUIS le reste). getAuthUser étant dédupliqué par rendu, le
  // RTT d'auth est payé UNE fois, partagé par les 4.
  const actualitesPromise = getCachedPublishedActualites()
  // Catalogue en cache (10 min) : point « du neuf » sur Formations
  const formationsPromise = getCachedPublishedFormations().catch(() => [])
  const spacesPromise = getUserSpaces()
  const activePropertyPromise = getActiveProperty()
  // Menu en une seule requête (24/10/2026, menu_state) : cloche, forum,
  // contrats à traiter, étapes du parcours, demandes et actualités des pros.
  // Avant : 6 à 14 requêtes séparées à chaque ouverture. Lancée avant
  // l'attente du profil ; null tant que la migration 148 manque (repli plus bas).
  const onProPath = pathname.startsWith('/dashboard/ma-fiche-photographe') || pathname.startsWith('/dashboard/ma-fiche-menage') || pathname.startsWith('/dashboard/investir')
  const menuPromise = loadMenuState({ onboarding: !onProPath, pro: true })

  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  timer.mark('profil')

  // L'espace courant pour l'onboarding (purement server) — la sidebar et le
  // header le recalculent client-side via usePathname() pour survivre au
  // router cache des layouts.
  // L'espace investisseur (pré-achat) n'a ni logement ni voyageur :
  // l'onboarding hôte (Parcours) n'y a pas de sens.
  const isOnProSpace = onProPath

  // PERF + fix flash : si l'onboarding est TERMINÉ (onboarding_completed_at),
  // on NE lance PAS detectTracksProgress (7 requêtes, ~200-500ms) et on NE
  // rend PAS le widget — c'est le cas de l'hôte qui voit "l'onboarding déjà
  // complet qui s'affiche puis disparaît". Avant, la détection tournait à
  // chaque nav même pour lui.
  // NB : on ne skippe PAS pour onboarding_dismissed seul — le bouton
  // « Parcours » de l'en-tête permet de le rouvrir, et le widget doit rester
  // monté (rendu null) pour écouter cet événement de restauration.
  // Pas de parcours en mode admin, ni quand le profil n'a pas pu être lu
  // (sinon le panneau s'ouvrait comme si l'utilisateur ne l'avait jamais fermé)
  const onboardingOff = isOnProSpace || !!profile.onboarding_completed_at || pathname.startsWith('/dashboard/admin') || profile.profileUnavailable

  const [cachedActualites, spacesResult, activeProperty, cachedFormations] = await Promise.all([
    actualitesPromise,
    spacesPromise,
    activePropertyPromise,
    formationsPromise,
  ])
  timer.mark('cadre')
  timer.done()

  const isAdmin = profile.role === 'admin'
  const planLabel = planToLabel(profile.plan, profile.role)

  // Point « du neuf » du menu hôte : actualités des hôtes seulement
  const latestPublishedAt = forAudience(cachedActualites, 'hote')[0]?.published_at ?? null
  const hasNewActualites = !!(
    latestPublishedAt &&
    latestPublishedAt > (profile.last_seen_actualites_at ?? '1970-01-01T00:00:00Z')
  )

  // Point « du neuf » sur Formations, sauf pour les comptes qui ne reçoivent
  // pas les annonces de formations (migration 163)
  const newFormationAt = profile.masquer_annonces_formations ? null : derniereNouvelleFormationAt(cachedFormations)

  const hasSpace = (k: 'photographer' | 'cleaner' | 'depannage') => spacesResult.spaces.some(sp => sp.key === k && sp.active)
  const hostActive = spacesResult.spaces.some(sp => sp.key === 'host' && sp.active)

  return (
    <ThemeProvider>
      <div style={styles.layout} className="dash-layout">
        <Sidebar
          isAdmin={isAdmin}
          isContributor={profile.is_contributor ?? false}
          lastSeenActualitesAt={profile.last_seen_actualites_at}
          hasNewActualites={hasNewActualites}
          newFormationAt={newFormationAt}
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
          lastSeenNouveautesAt={profile.profileUnavailable ? new Date().toISOString() : profile.last_seen_nouveautes_at}
          hideFormationNews={profile.masquer_annonces_formations}
          newFormationAt={newFormationAt}
          lastSeenActualitesAt={profile.last_seen_actualites_at}
          hasNewActualites={hasNewActualites}
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
        {/* Compteurs du menu, cloche et parcours : après le cadre et la page */}
        <Suspense fallback={null}>
          <MenuLiveLoader
            menuPromise={menuPromise}
            pathname={pathname}
            profile={profile}
            onboardingOff={onboardingOff}
            spaces={{ photographer: hasSpace('photographer'), cleaner: hasSpace('cleaner'), depannage: hasSpace('depannage'), host: hostActive }}
            cachedActualites={cachedActualites}
          />
        </Suspense>
        <InstallAppWidget />
        <PerfReporter />
        <LastSeenPing />
        {launch && <LaunchSplashOut />}
      </div>
    </ThemeProvider>
  )
}

type ShellProfile = NonNullable<Awaited<ReturnType<typeof getProfile>>>

async function MenuLiveLoader({ menuPromise, pathname, profile, onboardingOff, spaces, cachedActualites }: {
  menuPromise: ReturnType<typeof loadMenuState>
  pathname: string
  profile: ShellProfile
  onboardingOff: boolean
  spaces: { photographer: boolean; cleaner: boolean; depannage: boolean; host: boolean }
  cachedActualites: Awaited<ReturnType<typeof getCachedPublishedActualites>>
}) {
  // Une erreur ici laisse seulement les compteurs à zéro : jamais la page
  try {
  const timer = perfTimer('menu ' + pathname)
  const menu = await menuPromise
  const emptyOnboarding = { totalDone: 1, totalSteps: 1, tracks: [] as Array<{ key: string; doneSteps: Set<string> }> }
  const trackInput = {
    userId: profile.userId,
    completedSteps: profile.onboarding_completed_steps,
    chezNousOnboardedAt: profile.chez_nous_onboarded_at,
    onboardingStep: profile.onboarding_step,
    stripeOnboardingComplete: profile.stripe_onboarding_complete,
  }
  // Repli requête par requête seulement si la fonction menu_state a échoué
  const [onboardingState, appNotifUnread, chezNousUnread] = await Promise.all([
    onboardingOff ? emptyOnboarding
      : menu?.onboarding ? buildTracksState(menu.onboarding, trackInput)
      : detectTracksProgressCached(trackInput),
    menu ? menu.notifUnread : getUnreadCount(),
    menu ? menu.chezNousUnread : getChezNousUnreadCount(),
  ])
  const onboardingCompleted = onboardingState.totalDone === onboardingState.totalSteps
  const showOnboarding = !onboardingOff && !onboardingCompleted

  // Backfill paresseux : la détection conclut "terminé" mais le flag n'était
  // pas encore posé → on l'écrit une fois (fire-and-forget)
  if (!onboardingOff && onboardingCompleted && !profile.onboarding_completed_at) {
    void persistOnboardingCompleted(profile.userId)
  }
  const doneByTrack: Record<string, string[]> = {}
  onboardingState.tracks.forEach(t => { doneByTrack[t.key] = Array.from(t.doneSteps) })

  // Menu des pros : point « du neuf » sur les actualités de leur métier et
  // compteur des demandes pas encore ouvertes (une date de visite par espace)
  const isPro = spaces.photographer || spaces.cleaner || spaces.depannage
  const [proDemandes, proSeen] = isPro
    ? await Promise.all([
        menu?.demandes ?? loadProNewDemandes(profile.userId, { photographer: spaces.photographer, cleaner: spaces.cleaner, depannage: spaces.depannage }),
        menu?.actusSeen ?? loadProActusSeen(profile.userId, profile.last_seen_actualites_at),
      ])
    : [null, null]
  const proNav = proDemandes && proSeen
    ? {
        demandes: proDemandes,
        newActus: {
          photographer: hasNewFor(cachedActualites, 'photographe', proSeen.photographer),
          cleaner: hasNewFor(cachedActualites, 'menage', proSeen.cleaner),
          depannage: proSeen.depannage === undefined ? false : hasNewFor(cachedActualites, 'depannage', proSeen.depannage),
        },
      }
    : undefined
  // Compteur hôte sur « Contrats & paiements » : seulement si l'espace hôte est actif
  const contratsTodo = !spaces.host ? 0
    : menu ? contractTodoCount(contractTodos(menu.contracts, parisToday()))
    : await loadContractTodoCount(profile.userId)
  timer.mark(onboardingOff ? 'menu et cloche' : 'menu, cloche et parcours')
  timer.done()

  return (
    <>
      <MenuLivePush value={{ proNav, contratsTodo, appNotifUnread, chezNousUnread, showOnboarding }} />
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
    </>
  )
  } catch (err) {
    console.error('[menu différé]', err)
    return null
  }
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    minHeight: '100svh',
  },
  // Marges, fond, contour et coins de la feuille : .dash-main (globals.css,
  // « Cadre du dashboard », 18/11/2026), différents ordinateur / téléphone.
  main: {
    flex: 1,
    minWidth: 0,
    overflowX: 'hidden',
  },
}
