import { getProfile } from '@/lib/queries/profile'
import { getUserSpaces } from '@/lib/queries/spaces'
import { redirect } from 'next/navigation'
import { perfTimer } from '@/lib/perf/server-timing'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  CalendarBlank,
  ArrowRight, Newspaper,
  GraduationCap, Trophy, Flame,
  Camera, Sparkle, SignIn, SignOut, UsersThree,
} from '@phosphor-icons/react/dist/ssr'
import HubHero, { HeroEm, heroCard, heroCta } from '@/components/dashboard/HubHero'
// ChezNousWidget retiré Étape 7 (déplacé vers /dashboard/entre-hotes)
import SetupChecklist, { type SetupStep } from './SetupChecklist'
import MesPlateformesWidget from './MesPlateformesWidget'
import TodayBoard, { type TodayItem, type TodayAction } from './TodayBoard'
import { loadHostMenageSlots, menageKey } from '@/lib/menage/host-slots'
import { contractTodos } from '@/lib/contracts/todo'
import ReviewPrompt from './ReviewPrompt'
import { buildRevenueLines, totaux as finTotaux } from '@/lib/finances/engine'
import DeclarationsWidget from '@/components/dashboard/DeclarationsWidget'
import OnboardingTour from './OnboardingTour'
import { icalReservationsForDisplay } from '@/lib/ical/display'
import { parisToday } from '@/lib/stripe/deposit-window'
import { getCachedCommunityGroups, getCachedPublishedActualites } from '@/lib/queries/cache'
// CategoryId retiré (utilisé uniquement par ChezNousWidget, désormais dans /entre-hotes)

function getGreeting() {
  const h = parseInt(new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', hour12: false, timeZone: 'Europe/Paris' }).format(new Date()))
  return h >= 18 || h < 5 ? 'Bonsoir' : 'Bonjour'
}

function addDays(date: string, n: number) {
  const d = new Date(date + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function diffDays(from: string, to: string) {
  return Math.round((new Date(to + 'T12:00').getTime() - new Date(from + 'T12:00').getTime()) / 86400000)
}
function fmtShort(d: string) {
  const MONTHS = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']
  const [, m, day] = d.split('-')
  return `${parseInt(day)} ${MONTHS[parseInt(m) - 1]}`
}
// Montant exact (avant : « 3 k€ » pour 2 840 €, trop approximatif en tête de page)
function fmtEur(n: number) {
  return `${Math.round(n).toLocaleString('fr-FR')} €`
}
// Mois (AAAA-MM) relatif à la date du jour à Paris
function monthPrefix(today: string, offset = 0) {
  const [y, m] = today.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + offset, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export default async function DashboardPage() {
  const timer = perfTimer('page /dashboard')
  const profile  = await getProfile()

  // Mode admin resté actif : aiguillé par middleware.ts (chargement complet seulement)

  // ── Aiguillage post-login côté SERVEUR ────────────────────────────────
  // Remplace getPostLoginPathAction (server action appelée par la page de
  // login APRÈS la navigation : un aller-retour de plus + un flash du
  // dashboard hôte chez les pros). getUserSpaces est déjà appelée par le
  // layout dans CE MÊME rendu → React cache() dédupe, coût zéro.
  const { spaces, primary } = await getUserSpaces()
  const hostSpace = spaces.find(sp => sp.key === 'host')
  if (hostSpace && !hostSpace.active) {
    // Pro pur (photographe/ménage sans logement) → direct sur sa fiche
    const target = spaces.find(sp => sp.key !== 'host' && sp.active)
    if (target) redirect(target.href)
  }
  // Investisseur pur → son espace (le dashboard hôte serait vide)
  if (primary.key === 'investor') redirect(primary.href)

  timer.mark('espaces')
  const supabase = await createClient()
  const userId   = profile?.userId ?? ''
  const completedSteps = profile?.onboarding_completed_steps ?? []
  const now      = new Date()
  // Date du jour à Paris (le serveur tourne en UTC : avant, entre minuit et
  // 2 h du matin, l'accueil affichait encore les arrivées de la veille).
  const today    = parisToday()
  const in7      = addDays(today, 7)
  const monthPfx = monthPrefix(today, 0)
  const prevMPfx = monthPrefix(today, -1)
  const yearPfx  = today.slice(0, 4)

  // ── 1 SEULE Promise.allSettled pour TOUTES les requêtes parallélisables.
  // allSettled (vs all) : si une requête échoue (table renommée, colonne supprimée,
  // timeout réseau), les autres restent disponibles et la page se rend en mode dégradé
  // au lieu de planter complètement.
  // Ménages du jour (bloc « À faire aujourd'hui ») : même source que la page
  // Ménage et le flux de l'équipe, lancé en parallèle des autres requêtes.
  const menageTodayPromise = userId
    ? Promise.all([
        loadHostMenageSlots(supabase, userId, today, today),
        supabase.from('menage_completions').select('logement_nom, date').eq('host_user_id', userId).eq('date', today),
        supabase.from('calendar_events').select('title').eq('user_id', userId).eq('category', 'menage').eq('date', today).ilike('description', '%[FAIT]%'),
      ]).catch(err => { console.error('[Dashboard] ménages du jour', err); return null })
    : Promise.resolve(null)

  const results = await Promise.allSettled([
    supabase
      .from('contracts')
      .select('id, logement_nom, date_arrivee, date_depart, statut, checklist_status, montant_loyer, stripe_payment_status, stripe_payment_enabled, stripe_deposit_status, locataire_prenom, locataire_nom, sejour_id')
      .eq('user_id', userId)
      .neq('statut', 'annule')
      .order('date_arrivee'),
    supabase
      .from('logements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    // Catalogue public caché 5 min, on slice côté JS pour ne garder que 3
    getCachedPublishedActualites(),
    // Une seule requête pour TOUTE l'année : on splitera par mois en JS (économise 2 round-trips)
    supabase
      .from('revenus_entries')
      .select('id, montant, date_paiement, type_paiement, logement_nom')
      .eq('user_id', userId)
      // Depuis le mois précédent (en janvier : décembre de l'an dernier)
      .gte('date_paiement', `${prevMPfx < `${yearPfx}-01` ? prevMPfx : yearPfx + '-01'}-01`)
      .lt('date_paiement', `${parseInt(yearPfx) + 1}-01-01`),
    supabase
      .from('revenus_objectifs')
      .select('objectif_ca_annuel, annee')
      .eq('user_id', userId)
      .maybeSingle(),
    getCachedCommunityGroups(),
    userId
      ? supabase
          .from('user_community_memberships')
          .select('group_id')
          .eq('user_id', userId)
          .eq('status', 'joined')
      : Promise.resolve({ data: [] as { group_id: string }[] }),
    userId
      ? supabase
          .from('user_formations')
          .select('formation_id, progress, completed_lessons, formations(slug, title, lessons_count)')
          .eq('user_id', userId)
      : Promise.resolve({ data: [] as Array<{ formation_id: string; progress: number; completed_lessons: number[] | null; formations: unknown }> }),
    userId
      ? supabase
          .from('user_lesson_completion_log')
          .select('completed_at')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] as { completed_at: string }[] }),
    supabase
      .from('chez_nous_posts')
      .select('id, author_id, category, title, reply_count, vote_count, last_reply_at, created_at')
      .order('last_reply_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(3),
    // count 'estimated' (vs 'exact') évite un scan full-table à chaque
    // chargement de la home. La précision exacte n'est pas critique pour
    // le widget "X posts dans la communauté".
    supabase.from('chez_nous_posts').select('*', { count: 'estimated', head: true }),
    // Séjours (carnet voyageurs) avec un montant : compte dans le CA YTD,
    // sinon le dashboard ignore les revenus saisis depuis /voyageurs et
    // l'objectif reste à 0 alors que /revenus affiche le bon total.
    supabase
      .from('sejours')
      .select('id, montant, date_arrivee, date_depart, logement, contrat_plateforme, commission_montant')
      .eq('user_id', userId)
      .is('annule_at', null)
      .not('montant', 'is', null)
      .gt('montant', 0)
      // Depuis le mois précédent, séjours à venir compris (prévisionnel)
      .gte('date_arrivee', `${prevMPfx < `${yearPfx}-01` ? prevMPfx : yearPfx + '-01'}-01`),
    // Liens plateformes du profil (inbox Airbnb/Booking/Driing/GMB + custom)
    supabase
      .from('profiles')
      .select('inbox_airbnb_url, inbox_booking_url, inbox_vrbo_url, inbox_abritel_url, inbox_driing_url, inbox_gmb_url, custom_platform_links')
      .eq('id', userId)
      .maybeSingle(),
    // iCal events (Airbnb/Booking/Vrbo) — sans ça, la home ignore les résas
    // synchronisées et affiche "calendrier serein" alors qu'une résa Airbnb
    // arrive dans 4 jours.
    supabase
      .from('ical_events')
      .select('id, feed_id, title, start_date, end_date, description')
      .eq('user_id', userId)
      .gte('start_date', `${yearPfx}-01-01`)
      .order('start_date'),
    // Séjours avec dates ET voyageur pour l'affichage prochaines arrivées
    // (le sejours[11] précédent n'a que montant+date_arrivee pour le CA).
    supabase
      .from('sejours')
      .select('id, voyageur_id, logement, date_arrivee, date_depart, voyageurs(prenom, nom)')
      .eq('user_id', userId)
      .is('annule_at', null)
      .not('date_arrivee', 'is', null)
      .not('date_depart', 'is', null)
      .order('date_arrivee'),
    // Stratégie tarifaire : au moins 1 logement avec un prix configuré ?
    // Utilisé pour la step setupSteps 'prix' (nudge config).
    supabase
      .from('logements')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .or('prix_airbnb_nuit.not.is.null,prix_booking_nuit.not.is.null,prix_direct_nuit.not.is.null'),
    // Déclarations voyageurs obligatoires (SIBA, fiche police…) en attente,
    // créées automatiquement à la signature des contrats.
    supabase
      .from('guest_declarations')
      .select('id, voyageur_id, voyageur_nom, voyageur_nationalite, logement_nom, logement_pays, date_arrivee, deadline_at')
      .eq('user_id', userId)
      .eq('statut', 'a_faire')
      .order('deadline_at')
      .limit(20),
    // 17. Checklist de démarrage : calendrier Airbnb/Booking connecté ?
    supabase
      .from('ical_feeds')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    // 18. Checklist : lien du planning ménage déjà généré (ical_token) ?
    supabase
      .from('profiles')
      .select('ical_token')
      .eq('id', userId)
      .maybeSingle(),
    // 19-20. Flux iCal + URL iCal des logements : nommer les réservations
    // importées (logement, plateforme) au lieu du titre brut « Reserved ».
    supabase.from('ical_feeds').select('id, url, name').eq('user_id', userId),
    supabase.from('logements').select('nom, ical_airbnb, ical_booking, ical_vrbo, ical_autre').eq('user_id', userId),
  ])

  // Helper : récupère une valeur en cas de fulfilled, sinon une valeur de fallback.
  // Évite que tout le dashboard plante si une seule requête échoue.
  function pick<T>(idx: number, fallback: T): T {
    const r = results[idx]
    if (r.status !== 'fulfilled') {
      console.error(`[Dashboard] Query ${idx} failed:`, r.reason)
      return fallback
    }
    return r.value as T
  }

  const { data: contracts }       = pick<{ data: any[] | null }>(0, { data: [] })
  const { count: logCount }       = pick<{ count: number | null }>(1, { count: 0 })
  const allCachedNews             = pick<any[]>(2, [])
  const { data: entriesYearAll }  = pick<{ data: any[] | null }>(3, { data: [] })
  const { data: objectifData }    = pick<{ data: any | null }>(4, { data: null })
  const communityGroups           = pick<any[]>(5, [])
  const { data: joinedMemberships } = pick<{ data: { group_id: string }[] | null }>(6, { data: [] })
  const { data: userFormationsLearn } = pick<{ data: any[] | null }>(7, { data: [] })
  const { data: completionLogLearn }  = pick<{ data: { completed_at: string }[] | null }>(8, { data: [] })
  const { data: cnPosts }         = pick<{ data: any[] | null }>(9, { data: [] })
  const { count: cnTotal }        = pick<{ count: number | null }>(10, { count: 0 })
  const { data: sejoursYearRaw }  = pick<{ data: { id: string; montant: number | null; date_arrivee: string }[] | null }>(11, { data: [] })
  const { data: platformLinksRaw } = pick<{ data: {
    inbox_airbnb_url: string | null
    inbox_booking_url: string | null
    inbox_vrbo_url: string | null
    inbox_abritel_url: string | null
    inbox_driing_url: string | null
    inbox_gmb_url: string | null
    custom_platform_links: Array<{ label: string; url: string; color?: string }> | null
  } | null }>(12, { data: null })
  const { data: icalEventsRaw } = pick<{ data: Array<{ id: string; feed_id: string; title: string; start_date: string; end_date: string | null; description: string | null }> | null }>(13, { data: [] })
  const { data: sejoursForArrivals } = pick<{ data: Array<{ id: string; voyageur_id: string | null; logement: string | null; date_arrivee: string; date_depart: string; voyageurs: { prenom: string | null; nom: string | null } | Array<{ prenom: string | null; nom: string | null }> | null }> | null }>(14, { data: [] })
  const { count: pricingCount }  = pick<{ count: number | null }>(15, { count: 0 })
  const { data: pendingDeclarations } = pick<{ data: Array<{
    id: string
    voyageur_id: string | null
    voyageur_nom: string
    voyageur_nationalite: string | null
    logement_nom: string | null
    logement_pays: string
    date_arrivee: string
    deadline_at: string
  }> | null }>(16, { data: [] })

  const { count: icalFeedCount } = pick<{ count: number | null }>(17, { count: 0 })
  const { data: icalTokenRow }   = pick<{ data: { ical_token: string | null } | null }>(18, { data: null })
  const { data: icalFeedsRaw }   = pick<{ data: Array<{ id: string; url: string | null; name: string | null }> | null }>(19, { data: [] })
  const { data: logementsIcal }  = pick<{ data: Array<{ nom: string | null; ical_airbnb: string | null; ical_booking: string | null; ical_vrbo: string | null; ical_autre: string | null }> | null }>(20, { data: [] })


  const latestNews = allCachedNews.slice(0, 3)
  // Nombre d'actus publiées depuis la dernière visite de la page Actualités,
  // pour afficher un badge « N nouvelle(s) » qui donne une raison de cliquer.
  const lastSeenNews = profile?.last_seen_actualites_at ?? '1970-01-01T00:00:00Z'
  const freshNewsCount = allCachedNews.filter(
    a => (a.published_at ?? a.created_at ?? '') > lastSeenNews
  ).length


  const ufLearn = (userFormationsLearn ?? []) as Array<{
    formation_id: string
    progress: number
    completed_lessons: number[] | null
    formations: { slug: string; title: string; lessons_count: number } | { slug: string; title: string; lessons_count: number }[] | null
  }>
  const totalLessonsDone = ufLearn.reduce((sum, uf) => sum + ((uf.completed_lessons ?? [])?.length ?? 0), 0)
  const formationsCompleted = ufLearn.filter(uf => uf.progress === 100).length
  const formationInProgress = ufLearn
    .filter(uf => uf.progress > 0 && uf.progress < 100)
    .sort((a, b) => b.progress - a.progress)[0] ?? null

  const learnerLevel =
    totalLessonsDone === 0 ? null :
    totalLessonsDone < 10 ? { label: 'Apprenti', color: '#2563eb' } :
    totalLessonsDone < 30 ? { label: 'Praticien', color: '#15803d' } :
    totalLessonsDone < 60 ? { label: 'Expert', color: 'var(--accent-text)' } :
                            { label: 'Maître', color: '#7c3aed' }

  const streakLearner = (() => {
    if (!completionLogLearn || completionLogLearn.length === 0) return 0
    const days = new Set<string>()
    completionLogLearn.forEach((c: { completed_at: string }) => {
      if (!c.completed_at) return
      const d = new Date(c.completed_at)
      if (isNaN(d.getTime())) return
      days.add(d.toISOString().slice(0, 10))
    })
    let count = 0
    const t = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(t.getTime() - i * 86400000).toISOString().slice(0, 10)
      if (days.has(d)) count++
      else if (i === 0) continue
      else break
    }
    return count
  })()

  const formationInProgressData = formationInProgress
    ? (() => {
        const f = Array.isArray(formationInProgress.formations)
          ? formationInProgress.formations[0]
          : formationInProgress.formations
        if (!f) return null
        return {
          slug: f.slug,
          title: f.title,
          progress: formationInProgress.progress,
          completedCount: (formationInProgress.completed_lessons ?? [])?.length ?? 0,
          lessonsCount: f.lessons_count,
        }
      })()
    : null

  // ── Entre Hôtes : authors fetchés à part (dépendent des author_ids des posts).
  const cnAuthorIds = Array.from(new Set((cnPosts ?? []).map(p => p.author_id)))
  const cnAuthorsPromise = cnAuthorIds.length
    ? supabase.from('profiles').select('id, full_name, pseudo').in('id', cnAuthorIds)
    : Promise.resolve({ data: [] as { id: string; full_name: string | null; pseudo: string | null }[] })

  const joinedIds    = new Set((joinedMemberships ?? []).map(m => m.group_id))
  const joinedGroups = communityGroups.filter(g => joinedIds.has(g.id))
  const totalReach   = joinedGroups.reduce((acc, g) => acc + (g.members_count ?? 0), 0)
  const joinedCount  = joinedGroups.length

  const firstName  = profile?.full_name?.split(/\s+/)[0] ?? ''
  const allC       = contracts ?? []
  const logements  = logCount ?? 0
  const pl         = (n: number, s = 's') => n !== 1 ? s : ''

  // ── Liste unifiée des occupations (contracts + sejours + iCal) ─────────
  // Avant : seuls les `contracts` alimentaient les widgets arrivées/départs.
  // Conséquence : un hôte avec uniquement de l'Airbnb voyait "Calendrier
  // serein" alors qu'une résa Airbnb arrive dans 4 jours. Fix : on fusionne
  // toutes les sources avec dédup par paire (date_arrivee + logement) pour
  // ne pas compter 2× un séjour synchro iCal qui a aussi un contrat saisi.
  type Occ = {
    id: string
    source: 'contract' | 'sejour' | 'ical'
    date_arrivee: string
    date_depart: string | null
    logement_nom: string | null
    label: string
    contract?: typeof allC[0]
  }
  const dedupKey = (date: string | null | undefined, log: string | null | undefined) =>
    `${(date ?? '').trim()}|${(log ?? '').trim().toLowerCase()}`
  const seenOcc = new Set<string>()
  // Dates couvertes par un contract ou un sejour. Les iCal events à ces
  // dates sont juste le mirror Airbnb/Booking de la même réservation —
  // on les skip pour éviter le doublon dans "Prochaines arrivées".
  const datesCoveredByMaster = new Set<string>()

  const occupations: Occ[] = []
  for (const c of allC) {
    if (!c.date_arrivee) continue
    const k = dedupKey(c.date_arrivee, c.logement_nom)
    if (seenOcc.has(k)) continue
    seenOcc.add(k)
    datesCoveredByMaster.add(c.date_arrivee)
    occupations.push({
      id: `contract-${c.id}`,
      source: 'contract',
      date_arrivee: c.date_arrivee,
      date_depart: c.date_depart ?? null,
      logement_nom: c.logement_nom,
      label: `${c.locataire_prenom ?? ''} ${c.locataire_nom ?? ''}`.trim() || (c.logement_nom ?? 'Réservation'),
      contract: c,
    })
  }
  for (const s of (sejoursForArrivals ?? [])) {
    if (!s.date_arrivee || !s.date_depart) continue
    const k = dedupKey(s.date_arrivee, s.logement)
    if (seenOcc.has(k)) continue
    seenOcc.add(k)
    datesCoveredByMaster.add(s.date_arrivee)
    const v = Array.isArray(s.voyageurs) ? s.voyageurs[0] : s.voyageurs
    const vName = v ? `${v.prenom ?? ''} ${v.nom ?? ''}`.trim() : ''
    occupations.push({
      id: `sejour-${s.id}`,
      source: 'sejour',
      date_arrivee: s.date_arrivee,
      date_depart: s.date_depart,
      logement_nom: s.logement,
      label: vName || s.logement || 'Séjour',
    })
  }
  // Réservations Airbnb/Booking/Vrbo : logement + plateforme nommés, départ =
  // dernière nuit + 1, « CLOSED » Booking courts gardés (lib/ical/display.ts).
  const icalResas = icalReservationsForDisplay(
    logementsIcal ?? [],
    icalFeedsRaw ?? [],
    icalEventsRaw ?? [],
  )
  for (const r of icalResas) {
    // Si un contract ou un sejour couvre déjà cette date → on skip l'iCal
    // qui n'est que le miroir Airbnb/Booking de la même résa (sinon
    // doublon visible dans "Prochaines arrivées").
    if (datesCoveredByMaster.has(r.dateArrivee)) continue
    const k = dedupKey(r.dateArrivee, `${r.logementName ?? ''}|${r.label}`)
    if (seenOcc.has(k)) continue
    seenOcc.add(k)
    occupations.push({
      id: `ical-${r.id}`,
      source: 'ical',
      date_arrivee: r.dateArrivee,
      date_depart: r.dateDepart,
      logement_nom: r.logementName,
      label: r.label,
    })
  }

  // ── Filtres temporels appliqués à la liste unifiée
  const activeStays = occupations.filter(o =>
    o.date_arrivee <= today && (!o.date_depart || o.date_depart >= today)
  )
  const weekArrivals = occupations.filter(o =>
    o.date_arrivee > today && o.date_arrivee <= in7
  )

  // ── Aujourd'hui spécifiquement (sur la liste unifiée)
  const todayArrivals = occupations.filter(o => o.date_arrivee === today)
  const todayDepartures = occupations.filter(o => o.date_depart === today)

  // ── KPIs réservations (vue carrière, pas juste aujourd'hui)
  // À venir : toute réservation dont l'arrivée est > today
  // Déjà venus : toute réservation dont l'arrivée est < today (passées)
  const upcomingReservationsCount = occupations.filter(o => o.date_arrivee > today).length
  const pastReservationsCount = occupations.filter(o => o.date_arrivee < today).length

  // ── Prochains événements (14 jours) : arrivées + départs fusionnés et triés
  // Maintenant alimenté par TOUTES les sources (occupations) au lieu de
  // contracts seulement → la widget "Calendrier serein" ne ment plus quand
  // une résa Airbnb arrive dans les 14j.
  const in14 = addDays(today, 14)
  type UpcomingEvent = { date: string; type: 'arrival' | 'departure'; contract: typeof allC[0] | undefined; occ: Occ }
  const upcomingEventsRaw: UpcomingEvent[] = []
  for (const o of occupations) {
    if (o.date_arrivee >= today && o.date_arrivee <= in14) {
      upcomingEventsRaw.push({ date: o.date_arrivee, type: 'arrival', contract: o.contract, occ: o })
    }
    if (o.date_depart && o.date_depart >= today && o.date_depart <= in14) {
      upcomingEventsRaw.push({ date: o.date_depart, type: 'departure', contract: o.contract, occ: o })
    }
  }
  upcomingEventsRaw.sort((a, b) =>
    a.date === b.date ? (a.type === 'arrival' ? -1 : 1) : a.date.localeCompare(b.date)
  )
  const upcomingEvents = upcomingEventsRaw.slice(0, 7)

  // Date label relatif : 0=Aujourd'hui, 1=Demain, 2-6=jour, 7+=date
  const DAYS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  function relDate(d: string) {
    const diff = diffDays(today, d)
    if (diff === 0) return "Aujourd'hui"
    if (diff === 1) return 'Demain'
    if (diff <= 6) {
      const dt = new Date(d + 'T12:00:00')
      const dayName = DAYS_FR[dt.getDay()]
      return dayName.charAt(0).toUpperCase() + dayName.slice(1)
    }
    return fmtShort(d)
  }

  // ── Actions à traiter
  // Compte les vraies tâches en attente pour les arrivées imminentes (≤7j) :
  // contrat non signé, paiement en attente, instructions/code d'accès non
  // envoyé, ménage non planifié. Couvre les contracts (vraies checklists)
  // + ajoute une alerte "instructions à envoyer" pour les arrivées
  // synchronisées iCal (sans contrat lié, on ne peut pas tracker en base
  // mais on rappelle quand même l'action).
  const unsignedContracts = allC.filter(c => {
    const cl = (c.checklist_status as Record<string, boolean>) ?? {}
    return !cl.contrat_signe && c.date_arrivee >= today
  })
  // Comme deriveImpayes() (page Encaissements) : ne compte que les paiements
  // en retard ou dont l'arrivée est imminente (≤7j), sinon un contrat payable
  // dans plusieurs semaines se retrouvait affiché comme "action urgente" sur
  // le dashboard alors qu'il n'apparaissait nulle part dans "à relancer".
  const pendingPayments = allC.filter(c =>
    c.stripe_payment_enabled && c.stripe_payment_status !== 'paid' && c.date_arrivee <= in7
  )
  // Instructions non envoyées pour les contrats avec arrivée < 7j.
  const pendingInstructions = allC.filter(c => {
    const cl = (c.checklist_status as Record<string, boolean>) ?? {}
    return !cl.instructions_envoyees
      && c.date_arrivee >= today
      && c.date_arrivee <= in7
  })
  // Ménage non planifié pour les contrats avec arrivée < 7j.
  const pendingMenage = allC.filter(c => {
    const cl = (c.checklist_status as Record<string, boolean>) ?? {}
    return !cl.menage_planifie
      && c.date_arrivee >= today
      && c.date_arrivee <= in7
  })
  const actionsCount =
    unsignedContracts.length
    + pendingPayments.length
    + pendingInstructions.length
    + pendingMenage.length
  // La pill "N action(s) à traiter" pointait toujours vers Encaissements,
  // même quand ce qui la déclenchait n'avait rien à voir (contrat non signé,
  // ménage non planifié) — dead-end pour l'hôte. Route vers la bonne page
  // selon la priorité réelle.
  const actionsHref =
    unsignedContracts.length > 0 ? '/dashboard/contrats'
    : pendingPayments.length > 0 ? '/dashboard/contrats'
    : '/dashboard/calendrier'

  // ── KPIs financiers : même moteur que Mes finances (lib/finances/engine.ts).
  // Un séjour compte à sa date d'arrivée, revenus = arrivées jusqu'à
  // aujourd'hui, cautions exclues, séjour lié à un contrat signé compté une
  // fois. Avant (sept. 2026), l'accueil avait ses propres règles (contrats
  // comptés seulement une fois payés, cautions incluses) : ses montants ne
  // correspondaient pas à ceux de Mes finances.
  const finLines = buildRevenueLines({
    sejours: (sejoursYearRaw ?? []) as any[],
    contracts: allC as any[],
    entries: (entriesYearAll ?? []) as any[],
    today,
  })
  const monthEnd = (ym: string) => new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0)).toISOString().slice(0, 10)
  const revenusThisMois = finTotaux(finLines, [], [], `${monthPfx}-01`, monthEnd(monthPfx), today).revenus
  const revenusPrevMois = finTotaux(finLines, [], [], `${prevMPfx}-01`, monthEnd(prevMPfx), today).revenus

  // ── Revenu annuel YTD + objectif
  const revenuYTD = finTotaux(finLines, [], [], `${yearPfx}-01-01`, `${yearPfx}-12-31`, today).revenus
  const objectifAnnuel = objectifData?.objectif_ca_annuel ? Number(objectifData.objectif_ca_annuel) : null
  const objectifPct = objectifAnnuel && objectifAnnuel > 0
    ? Math.min(100, Math.round((revenuYTD / objectifAnnuel) * 100))
    : null

  // % attendu à cette date dans l'année (jour de l'année / 365)
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86_400_000) + 1
  const expectedPct = Math.round((dayOfYear / 365) * 100)

  // ── Revenu prévisionnel : résas confirmées à venir, peu importe le statut
  // de paiement (le KPI "à attendre/encaisser dans les semaines/mois"). Couvre
  // les contracts saisis + les séjours du carnet voyageurs avec un montant.
  // Les résas iCal pures (Airbnb sans contrat) ne sont pas comptées car on
  // n'a pas l'info financière — elles restent visibles dans "Prochaines
  // arrivées" plus bas.
  const revenuPrevisionnel = finLines
    .filter(l => !l.horsRevenus && l.date > today)
    .reduce((acc, l) => acc + l.brut, 0)

  const planLabel = profile?.role === 'admin' ? 'Administrateur'
    : profile?.plan === 'driing' ? 'Membre Driing'
    : profile?.plan === 'standard' ? 'Standard'
    : 'Découverte'

  // ─── Onboarding checklist : détecte si tu démarres ou pas ──────────────
  const hasLogement = (logCount ?? 0) > 0
  const hasContract = (contracts ?? []).length > 0
  const hasObjectif = !!objectifData

  // ── Auteurs Entre Hôtes (await la promesse déférée plus haut)
  const cnAuthorsResult = await cnAuthorsPromise
  const cnAuthors: Record<string, { full_name: string | null; pseudo: string | null }> = {}
  ;(cnAuthorsResult.data ?? []).forEach(a => {
    cnAuthors[a.id] = { full_name: a.full_name, pseudo: a.pseudo }
  })
  // Checklist de démarrage : orientée vers ce que l'app apporte en plus
  // d'Airbnb/Booking et d'un logiciel de gestion (contrat signé + caution,
  // planning ménage automatique), pas vers la saisie manuelle.
  const setupSteps: SetupStep[] = [
    {
      key: 'account', label: 'Ton compte est créé',
      desc: 'Tu fais partie de la communauté Jason Marinho',
      done: true, ctaLabel: '', ctaHref: '', durationLabel: '',
    },
    {
      key: 'logement', label: 'Ajouter ton premier logement',
      desc: 'Adresse, capacité, règles : tous les outils se préremplissent ensuite avec tes vraies infos',
      done: hasLogement, ctaLabel: 'Ajouter', ctaHref: '/dashboard/logements',
      durationLabel: '3 min',
    },
    {
      key: 'calendrier', label: 'Connecter ton calendrier Airbnb ou Booking',
      desc: 'Colle le lien iCal de l’annonce dans la fiche logement : tes réservations arrivent toutes seules, et les ménages se planifient automatiquement',
      done: (icalFeedCount ?? 0) > 0, ctaLabel: 'Connecter', ctaHref: '/dashboard/logements',
      durationLabel: '2 min',
    },
    {
      key: 'contrat', label: 'Envoyer ton premier contrat à signer',
      desc: 'Pour une réservation directe : contrat signé en ligne (FR, PT, EN), caution bloquée par carte, facture. Ajoute le voyageur puis crée le contrat depuis sa fiche',
      done: hasContract, ctaLabel: 'Commencer', ctaHref: '/dashboard/voyageurs',
      durationLabel: '5 min',
    },
    {
      key: 'menage', label: 'Envoyer le planning ménage à ton équipe',
      desc: 'Un lien d’agenda à ajouter sur son téléphone : chaque départ devient un créneau ménage, mis à jour automatiquement',
      done: !!icalTokenRow?.ical_token, ctaLabel: 'Partager', ctaHref: '/dashboard/calendrier/menage',
      durationLabel: '1 min',
    },
    // Step "prix" : visible UNIQUEMENT si l'hôte a au moins 1 logement.
    ...(hasLogement ? [{
      key: 'prix', label: 'Définir tes prix par plateforme',
      desc: 'Stratégie tarifaire Airbnb / Booking / Direct + saisonnalité',
      done: (pricingCount ?? 0) > 0,
      ctaLabel: 'Configurer',
      ctaHref: '/dashboard/calculateurs#mes-prix',
      durationLabel: '2 min',
    }] : []),
    {
      key: 'objectif', label: 'Définir ton objectif annuel',
      desc: 'Dans « Mes finances », pour voir où tu en es par rapport à ton plan de vol',
      done: hasObjectif, ctaLabel: 'Définir', ctaHref: '/dashboard/finances/revenus',
      durationLabel: '1 min',
    },
  ]

  // Nouvel hôte (ni logement ni réservation) : la checklist de démarrage suffit,
  // pas de colonnes de zéros (« Aucune arrivée », « 0 € », « Calendrier serein »).
  const isNewHost = !hasLogement && occupations.length === 0

  // ── Bloc « À faire aujourd'hui » ────────────────────────────────────
  const occLabel = (o: Occ) => ({
    key: o.id,
    label: o.contract ? [o.contract.locataire_prenom, o.contract.locataire_nom].filter(Boolean).join(' ') || o.label : o.label,
    sub: o.contract?.logement_nom ?? o.logement_nom,
  })
  const todayArrivalItems: TodayItem[] = todayArrivals.map(occLabel)
  const todayDepartureItems: TodayItem[] = todayDepartures.map(occLabel)

  timer.mark('requêtes')
  const menageToday = await menageTodayPromise
  timer.mark('ménages du jour')
  timer.done()
  const todayMenageItems: TodayItem[] | null = menageToday
    ? (() => {
        const [slots, { data: comps }, { data: doneEv }] = menageToday
        const doneKeys = new Set((comps ?? []).map(c => menageKey(c.date, c.logement_nom)))
        return slots.map(sl => {
          const low = sl.logementName.trim().toLowerCase()
          const done = doneKeys.has(menageKey(sl.date, sl.logementName))
            || (doneEv ?? []).some(e => (e.title ?? '').toLowerCase().includes(low))
          return { key: sl.id, label: sl.logementName, sub: `${sl.startTime}${sl.sameDay ? ' · arrivée le jour même' : ''}`, done }
        })
      })()
    : null

  const cTodos = contractTodos(allC.map(c => ({ ...c, date_arrivee: c.date_arrivee ?? null, date_depart: c.date_depart ?? null })), today)
  const guest = (c: { locataire_prenom?: string | null; locataire_nom?: string | null }) =>
    [c.locataire_prenom, c.locataire_nom].filter(Boolean).join(' ') || 'Locataire'
  const todayActions: TodayAction[] = [
    // À signer : seulement si l'arrivée approche (14 jours), sinon ce n'est pas « aujourd'hui »
    { key: 'signer', href: '/dashboard/contrats', ...(() => {
      const l = cTodos.aSigner.filter(c => !c.date_arrivee || c.date_arrivee <= in14)
      return { count: l.length, names: l.map(guest) }
    })() },
    { key: 'loyer', href: '/dashboard/contrats', count: cTodos.loyerEnAttente.length, names: cTodos.loyerEnAttente.map(guest) },
    { key: 'caution', href: '/dashboard/contrats', count: cTodos.cautionALiberer.length + cTodos.cautionExpiree.length, names: [...cTodos.cautionALiberer, ...cTodos.cautionExpiree].map(guest) },
    { key: 'declarations', href: '/dashboard/voyageurs/declarations', count: (pendingDeclarations ?? []).length, names: (pendingDeclarations ?? []).map(d => d.voyageur_nom) },
  ]

  return (
    <>
      <div style={s.page} className="dash-page">

        {/* ── Visite guidée : 1ère visite uniquement (DB + localStorage) */}
        <OnboardingTour
          userId={userId}
          initiallyDone={completedSteps.includes('tour:home')}
        />

        {/* ── Setup checklist : visible jusqu'à 100% ou dismiss ─────────── */}
        {/* On masque aussi si l'hôte a globalement masqué/terminé l'onboarding
            (onboarding_dismissed / onboarding_completed_at) — évite le flash
            "checklist qui apparaît puis disparaît" à l'hydratation. */}
        <SetupChecklist
          userId={userId}
          steps={setupSteps}
          initiallyDismissed={
            completedSteps.includes('setup:dismissed') ||
            !!profile?.onboarding_dismissed ||
            !!profile?.onboarding_completed_at
          }
        />

        {/* ── En-tête (DA sept. 2026) : bandeau vert HubHero, ta journée à
              gauche, tes chiffres du mois à droite (avant : carte vert foncé
              + pastilles, et les chiffres éparpillés plus bas). */}
        <HubHero
          eyebrowIcon={<CalendarBlank size={14} weight="fill" />}
          eyebrow={new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })}
          title={<>{getGreeting()}{firstName ? <>, <HeroEm>{firstName}</HeroEm></> : null}</>}
          desc={(() => {
            const ta = todayArrivals.length
            const td = todayDepartures.length
            const ac = activeStays.length
            if (isNewHost) return 'Bienvenue dans ton espace. Suis la liste ci-dessus pour démarrer : chaque étape prend quelques minutes.'
            if (ta > 0 || td > 0) {
              const parts = []
              if (ta > 0) parts.push(`${ta} arrivée${pl(ta)} aujourd'hui`)
              if (td > 0) parts.push(`${td} départ${pl(td)} aujourd'hui`)
              if (actionsCount > 0) parts.push(`${actionsCount} action${pl(actionsCount)} à traiter`)
              return parts.join(' · ')
            }
            if (actionsCount > 0) {
              return `${actionsCount} action${pl(actionsCount)} à traiter${weekArrivals.length > 0 ? ` · ${weekArrivals.length} arrivée${pl(weekArrivals.length)} cette semaine` : ''}`
            }
            if (weekArrivals.length > 0) return `Aucune arrivée aujourd'hui · ${weekArrivals.length} prévue${pl(weekArrivals.length)} cette semaine`
            if (ac > 0) return `${ac} séjour${pl(ac)} en cours. Tout est en ordre.`
            return 'Aucun séjour prévu cette semaine. Profite de ce calme pour préparer la suite.'
          })()}
          aside={!isNewHost ? (
            <div style={{ ...heroCard, width: '100%' }}>
              <div style={s.asideTitle}>Ce mois-ci</div>
              <div style={s.asideStats}>
                <Link href="/dashboard/finances/revenus" style={s.asideStat}>
                  <span style={s.asideNum}>{fmtEur(revenusThisMois)}</span>
                  <span style={s.asideLbl}>
                    encaissés{revenusPrevMois > 0 && (
                      <span style={{ color: revenusThisMois >= revenusPrevMois ? 'var(--accent-text)' : 'var(--danger)', fontWeight: 600 }}>
                        {' '}{revenusThisMois >= revenusPrevMois ? '+' : ''}{Math.round(((revenusThisMois - revenusPrevMois) / revenusPrevMois) * 100)} % vs mois dernier
                      </span>
                    )}
                  </span>
                </Link>
                <Link href="/dashboard/finances/revenus" style={s.asideStat}>
                  <span style={s.asideNum}>{fmtEur(revenuPrevisionnel)}</span>
                  <span style={s.asideLbl}>déjà réservés à venir</span>
                </Link>
              </div>
              {objectifAnnuel !== null && objectifAnnuel > 0 ? (
                <Link href="/dashboard/finances/revenus" style={s.asideObj}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5 }}>
                    <span style={{ color: 'var(--text-2)', fontWeight: 600 }}><Trophy size={13} weight="fill" color="var(--accent-text)" style={{ verticalAlign: '-2px' }} /> Objectif {yearPfx}</span>
                    <span style={{ color: (objectifPct ?? 0) >= expectedPct ? 'var(--accent-text)' : '#B7791F', fontWeight: 700 }}>
                      {objectifPct} % <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>(attendu {expectedPct} %)</span>
                    </span>
                  </div>
                  <div style={s.objectifBar}>
                    <div style={{ ...s.objectifFill, width: `${objectifPct}%`, background: (objectifPct ?? 0) >= expectedPct ? 'var(--accent-text)' : '#B7791F' }} />
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${expectedPct}%`, width: '2px', background: 'var(--text-3)', opacity: 0.6 }} />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{fmtEur(revenuYTD)} sur {fmtEur(objectifAnnuel)}</span>
                </Link>
              ) : (
                <Link href="/dashboard/finances/revenus" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent-text)' }}>
                  Fixer mon objectif de l&apos;année
                </Link>
              )}
            </div>
          ) : undefined}
        >
          {!isNewHost && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/dashboard/calendrier" style={heroCta}>
                <CalendarBlank size={16} weight="bold" /> Mon calendrier
              </Link>
              <Link href="/dashboard/reservations" style={s.heroGhost}>Mes réservations</Link>
            </div>
          )}
        </HubHero>

        {/* Demande d'avis Google, une fois, dès qu'un contrat est signé */}
        {(contracts ?? []).some((c: { statut?: string }) => c.statut === 'signe') && <ReviewPrompt />}

        {/* ── Deux colonnes au-delà de ~1100 px de contenu : le quotidien à
              gauche, les raccourcis à droite (flex-wrap, sans position collante). */}
        <div style={s.cols}>
          <div style={s.colMain}>
            {/* À faire aujourd'hui : arrivées, départs, ménages du jour, puis
                contrats / loyers / cautions / déclarations en attente */}
            {!isNewHost && (
              <TodayBoard
                arrivals={todayArrivalItems}
                departures={todayDepartureItems}
                menages={todayMenageItems}
                actions={todayActions}
              />
            )}

            {/* Déclarations voyageurs obligatoires (SIBA, fiche police…) */}
            <DeclarationsWidget declarations={(pendingDeclarations ?? []).slice(0, 5)} />

            {/* Prochaines arrivées et départs (14 jours) */}
            {!isNewHost && (
              <section style={s.card}>
                <div style={s.cardHead}>
                  <h3 style={s.cardTitle}>Prochaines arrivées et départs</h3>
                  <Link href="/dashboard/calendrier" style={s.upcomingLink}>
                    Voir le calendrier <ArrowRight size={11} weight="bold" />
                  </Link>
                </div>
                {upcomingEvents.length === 0 ? (
                  <div style={s.upcomingEmpty}>
                    <CalendarBlank size={22} weight="duotone" color="var(--text-3)" />
                    <div>
                      <div style={s.upcomingEmptyTitle}>Rien dans les 14 prochains jours</div>
                      <div style={s.upcomingEmptySub}>Aucune arrivée ni aucun départ prévu.</div>
                    </div>
                  </div>
                ) : (
                  <div style={s.upcomingList}>
                    {upcomingEvents.map((e, i) => {
                      const c = e.contract
                      const o = e.occ
                      const isArr = e.type === 'arrival'
                      const color = isArr ? 'var(--accent-text)' : '#B7791F'
                      const bg = isArr ? 'var(--accent-bg)' : 'rgba(255,213,107,0.18)'
                      const traveler = c
                        ? [c.locataire_prenom, c.locataire_nom].filter(Boolean).join(' ')
                        : (o.source === 'sejour' || o.source === 'ical' ? o.label : '')
                      const logementLabel = c?.logement_nom ?? o.logement_nom ?? (o.source === 'ical' ? 'Synchro plateforme' : 'Logement')
                      return (
                        <Link key={`${o.id}_${e.type}_${i}`} href="/dashboard/calendrier" style={s.upcomingItem}>
                          <div style={{ ...s.upcomingDot, background: bg, color }}>
                            {isArr ? <SignIn size={15} weight="bold" /> : <SignOut size={15} weight="bold" />}
                          </div>
                          <div style={s.upcomingMain}>
                            <div style={s.upcomingItemTop}>
                              <span style={s.upcomingDate}>{relDate(e.date)}</span>
                              <span style={{ ...s.upcomingType, color, background: bg }}>{isArr ? 'Arrivée' : 'Départ'}</span>
                            </div>
                            <div style={s.upcomingMainText}>
                              {logementLabel}
                              {traveler && <span style={s.upcomingTraveler}> · {traveler}</span>}
                            </div>
                          </div>
                          <ArrowRight size={12} weight="bold" color="var(--text-3)" style={{ flexShrink: 0 }} />
                        </Link>
                      )
                    })}
                  </div>
                )}
              </section>
            )}
            {/* Actualités du secteur : dans la colonne principale (avant : seules
                en bas de page, avec un grand vide à gauche au-dessus) */}
            {latestNews.length > 0 && (
              <section style={s.card}>
                <div style={s.cardHead}>
                  <h3 style={{ ...s.cardTitle, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Newspaper size={17} color="var(--accent-text)" weight="duotone" />
                    Actualités du secteur
                    {freshNewsCount > 0 && (
                      <span style={s.newsFreshBadge}>
                        {freshNewsCount} nouvelle{freshNewsCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </h3>
                  <Link href="/dashboard/actualites" style={s.upcomingLink}>
                    Toutes les actualités <ArrowRight size={11} weight="bold" />
                  </Link>
                </div>
                <div style={s.newsGrid}>
                  {latestNews.map(article => (
                    <NewsCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside style={s.colSide}>
            {/* Mes plateformes : accès rapide aux messageries (Airbnb, Booking…) */}
            <MesPlateformesWidget
              initialData={{
                inbox_airbnb_url:  platformLinksRaw?.inbox_airbnb_url  ?? null,
                inbox_booking_url: platformLinksRaw?.inbox_booking_url ?? null,
                inbox_vrbo_url:    platformLinksRaw?.inbox_vrbo_url    ?? null,
                inbox_abritel_url: platformLinksRaw?.inbox_abritel_url ?? null,
                inbox_driing_url:  platformLinksRaw?.inbox_driing_url  ?? null,
                inbox_gmb_url:     platformLinksRaw?.inbox_gmb_url     ?? null,
                custom_platform_links: platformLinksRaw?.custom_platform_links ?? [],
              }}
            />

            {/* Trouver des voyageurs en direct : portée des groupes Facebook rejoints */}
            <Link href="/dashboard/visibilite/facebook" style={{ ...s.card, ...s.linkCard }}>
              <span style={s.linkIcon}><UsersThree size={18} weight="duotone" color="var(--accent-text)" /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={s.linkTitle}>
                  {joinedCount > 0 ? `${joinedCount} groupe${pl(joinedCount)} Facebook rejoint${pl(joinedCount)}` : 'Trouver des voyageurs en direct'}
                </span>
                <span style={s.linkDesc}>
                  {joinedCount > 0
                    ? `${totalReach.toLocaleString('fr-FR')} membres à qui proposer tes dates, sans commission`
                    : `${communityGroups.length} groupes où publier tes dates libres, sans commission`}
                </span>
              </span>
              <ArrowRight size={13} weight="bold" color="var(--text-3)" style={{ flexShrink: 0 }} />
            </Link>

            {/* Trouver un pro (annuaires) : le pont dashboard vers les annuaires */}
            <section style={s.card}>
              <div style={s.cardHead}><h3 style={s.cardTitle}>Trouver un pro près de chez toi</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="https://jasonmarinho.com/annuaires/photographes" target="_blank" rel="noopener noreferrer" style={s.proRow}>
                  <span style={s.linkIcon}><Camera size={17} weight="fill" color="var(--accent-text)" /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={s.linkTitle}>Photographe LCD</span>
                    <span style={s.linkDesc}>Des photos pro : plus de clics sur ton annonce</span>
                  </span>
                  <ArrowRight size={13} weight="bold" color="var(--text-3)" style={{ flexShrink: 0 }} />
                </a>
                <a href="https://jasonmarinho.com/annuaires/menage" target="_blank" rel="noopener noreferrer" style={s.proRow}>
                  <span style={s.linkIcon}><Sparkle size={17} weight="fill" color="var(--accent-text)" /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={s.linkTitle}>Équipe ménage LCD</span>
                    <span style={s.linkDesc}>Un ménage fiable : de meilleurs avis voyageurs</span>
                  </span>
                  <ArrowRight size={13} weight="bold" color="var(--text-3)" style={{ flexShrink: 0 }} />
                </a>
              </div>
            </section>

            {/* Mon apprentissage (niveaux) */}
            {(learnerLevel || formationInProgressData) && (
              <Link href="/dashboard/formations/profil-apprenant" style={{ ...s.card, textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={s.cardHead}>
                  <h3 style={s.cardTitle}><GraduationCap size={16} weight="fill" color="var(--accent-text)" style={{ verticalAlign: '-2px', marginRight: 6 }} />Mon apprentissage</h3>
                  <ArrowRight size={13} weight="bold" color="var(--text-3)" />
                </div>
                <div style={s.learnerBadges}>
                  {learnerLevel && (
                    <span style={{ ...s.learnerLevel, color: 'var(--accent-text)', borderColor: 'var(--accent-border)', background: 'var(--accent-bg)' }}>
                      <Trophy size={12} weight="fill" /> {learnerLevel.label}
                    </span>
                  )}
                  {streakLearner > 0 && (
                    <span style={s.learnerStreak}>
                      <Flame size={12} weight="fill" color="#D97706" />
                      <strong>{streakLearner}</strong> jour{streakLearner > 1 ? 's' : ''} d&apos;affilée
                    </span>
                  )}
                  <span style={s.learnerCount}>
                    {totalLessonsDone} leçon{totalLessonsDone > 1 ? 's' : ''} · {formationsCompleted} formation{formationsCompleted > 1 ? 's' : ''} finie{formationsCompleted > 1 ? 's' : ''}
                  </span>
                </div>
                {formationInProgressData ? (
                  <div>
                    <div style={s.learnerProgressLabel}>Continue</div>
                    <div style={s.learnerProgressTitle}>{formationInProgressData.title}</div>
                    <div style={s.learnerProgressBar}>
                      <div style={{ ...s.learnerProgressFill, width: `${formationInProgressData.progress}%` }} />
                    </div>
                    <div style={s.learnerProgressMeta}>
                      {formationInProgressData.progress} % · {formationInProgressData.completedCount}/{formationInProgressData.lessonsCount} leçons
                    </div>
                  </div>
                ) : (
                  <div style={s.learnerProgressMeta}>Démarre une formation pour progresser.</div>
                )}
              </Link>
            )}
          </aside>
        </div>

      </div>
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

// Couleurs de la marque uniquement (pas de bleu ni de violet sur les pages
// hôte) : vert, jaune ambré, rose, brun ; le libellé fait la différence.
const CATEGORY_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  reglementation:        { bg: 'var(--accent-bg)',          color: 'var(--accent-text)', label: 'Réglementation' },
  fiscalite:             { bg: 'rgba(255,213,107,0.18)',    color: '#8A5A12', label: 'Fiscalité' },
  gites:                 { bg: 'rgba(255,213,107,0.18)',    color: '#8A5A12', label: 'Gîtes & Meublés' },
  'chambres-hotes':      { bg: 'rgba(244,114,182,0.14)',    color: '#DB4F96', label: "Chambres d'hôtes" },
  conciergerie:          { bg: 'rgba(139,109,94,0.14)',     color: '#8B6D5E', label: 'Conciergeries' },
  'reservation-directe': { bg: 'var(--accent-bg)',          color: 'var(--accent-text)', label: 'Réserv. directe' },
  marche:                { bg: 'rgba(244,114,182,0.14)',    color: '#DB4F96', label: 'Marché' },
  communes:              { bg: 'rgba(139,109,94,0.14)',     color: '#8B6D5E', label: 'Communes' },
  plateformes:           { bg: 'rgba(224,71,91,0.12)',      color: '#E0475B', label: 'Plateformes OTA' },
  outils:                { bg: 'var(--accent-bg)',          color: 'var(--accent-text)', label: 'Outils & Tech' },
  general:               { bg: 'rgba(139,109,94,0.14)',     color: '#8B6D5E', label: 'Général' },
}

const NEWS_MONTHS = ['jan.','fév.','mar.','avr.','mai','juin','juil.','août','sep.','oct.','nov.','déc.']
function fmtNewsDate(d: string) {
  if (!d) return ''
  const parts = d.split('-')
  if (parts.length < 3) return d
  const [y, m, day] = parts
  const monthIdx = parseInt(m) - 1
  const monthName = NEWS_MONTHS[monthIdx] ?? ''
  return `${parseInt(day)} ${monthName} ${y}`
}

interface NewsArticle {
  id: string; title: string; summary: string
  source_url: string | null; category: string
  published_at: string | null; created_at: string
}

function NewsCard({ article }: { article: NewsArticle }) {
  const tc = CATEGORY_CONFIG[article.category] ?? CATEGORY_CONFIG.general
  const dateStr = article.published_at ?? article.created_at ?? ''
  const summary = article.summary ?? ''
  const shortDesc = summary.length > 110
    ? summary.slice(0, 110).trimEnd() + '…'
    : summary
  // Sans source : l'article précis sur la page Actualités (avant : les 3
  // cartes affichaient « Voir toutes les actualités », ambigu)
  const href = article.source_url ?? `/dashboard/actualites#actu-${article.id}`

  return (
    <a
      href={href}
      target={article.source_url ? '_blank' : undefined}
      rel={article.source_url ? 'noopener noreferrer' : undefined}
      style={{ textDecoration: 'none', height: '100%', display: 'block' }}
    >
      <div style={{ ...s.newsCard, borderLeftColor: tc.color }} className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ ...s.newsTag, background: tc.bg, color: tc.color }}>{tc.label}</div>
          <span style={s.newsDate}>{fmtNewsDate(dateStr.slice(0, 10))}</span>
        </div>
        <div style={s.newsTitle}>{article.title}</div>
        <div style={s.newsDesc}>{shortDesc}</div>
        <div style={s.newsFooter}>
          <span style={s.newsReadMore}>{article.source_url ? 'Lire la source' : 'Lire l\'actualité'}</span>
          <ArrowRight size={11} color="var(--accent-text)" />
        </div>
      </div>
    </a>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: { padding: '20px var(--dash-page-px) 48px', width: '100%', display: 'flex', flexDirection: 'column', gap: 16 },

  // ── En-tête (HubHero) ─────────────────────────────────────────────────────
  asideTitle: { fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  asideStats: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px 14px' },
  asideStat:  { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, textDecoration: 'none', color: 'inherit' },
  asideNum:   { fontFamily: 'var(--font-fraunces), serif', fontSize: 24, lineHeight: 1.05, fontWeight: 500, color: 'var(--text)' },
  asideLbl:   { fontSize: 12, color: 'var(--text-3)', lineHeight: 1.35 },
  asideObj:   { display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10, borderTop: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' },
  heroGhost: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderRadius: 12,
    background: 'var(--surface)', border: '1px solid var(--border-2)', color: 'var(--text)', fontSize: 14, fontWeight: 600,
    textDecoration: 'none',
  },
  objectifBar: { position: 'relative', height: 8, background: 'var(--surface-2)', borderRadius: 6, overflow: 'hidden' },
  objectifFill: { height: '100%', borderRadius: 6, transition: 'width 0.6s ease' },

  // ── Deux colonnes (flex-wrap, sans position collante) ───────────────────
  cols:    { display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' },
  colMain: { flex: '999 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 },
  colSide: { flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 },

  card: {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl, 18px)',
    padding: 'clamp(16px, 2.2vw, 22px)', minWidth: 0,
  },
  cardHead:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' },
  cardTitle: { margin: 0, fontFamily: 'var(--font-fraunces), serif', fontSize: 18, fontWeight: 500, color: 'var(--text)', letterSpacing: '-0.01em' },
  linkCard:  { display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' },
  linkIcon:  {
    width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
  },
  linkTitle: { display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 },
  linkDesc:  { display: 'block', fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.4, marginTop: 2 },
  proRow: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12,
    background: 'var(--bg)', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit',
  },

  // ── Mon apprentissage ─────────────────────────────────────────────────────
  learnerBadges: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  learnerLevel: {
    display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
    padding: '5px 11px', borderRadius: 100, border: '1px solid',
  },
  learnerStreak: {
    display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: 'var(--text)',
    padding: '5px 11px', borderRadius: 100, background: 'rgba(255,213,107,0.18)', border: '1px solid rgba(255,213,107,0.4)',
  },
  learnerCount: { fontSize: 12, color: 'var(--text-2)', fontWeight: 500 },
  learnerProgressLabel: { fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' },
  learnerProgressTitle: { fontSize: 13.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, marginTop: 2 },
  learnerProgressBar: { height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden', margin: '8px 0 5px' },
  learnerProgressFill: { height: '100%', background: 'var(--accent-text)', borderRadius: 3 },
  learnerProgressMeta: { fontSize: 12, color: 'var(--text-2)', fontWeight: 500 },

  // ── Prochaines arrivées et départs (14 jours) ────────────────────────────
  upcomingLink: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 600, color: 'var(--accent-text)', textDecoration: 'none' },
  upcomingList: { display: 'flex', flexDirection: 'column', gap: 6 },
  upcomingItem: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 12,
    background: 'var(--bg)', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit',
  },
  upcomingDot: { width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  upcomingMain: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 },
  upcomingItemTop: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  upcomingDate: { fontSize: 13.5, fontWeight: 600, color: 'var(--text)' },
  upcomingType: { fontSize: 10.5, fontWeight: 700, letterSpacing: '0.4px', padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase' },
  upcomingMainText: { fontSize: 13, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  upcomingTraveler: { color: 'var(--text-muted)' },
  upcomingEmpty: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '16px', borderRadius: 12,
    background: 'var(--bg)', border: '1px dashed var(--border-2)',
  },
  upcomingEmptyTitle: { fontSize: 13.5, fontWeight: 600, color: 'var(--text)' },
  upcomingEmptySub: { fontSize: 12.5, color: 'var(--text-2)', marginTop: 2 },

  // ── Actualités ────────────────────────────────────────────────────────────
  newsFreshBadge: { fontSize: 10.5, fontWeight: 700, letterSpacing: '0.3px', color: 'var(--accent-text)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 999, padding: '2px 8px', lineHeight: 1.4, whiteSpace: 'nowrap' },
  newsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 10 },
  newsCard: {
    display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 16px', borderRadius: 12,
    border: '1px solid var(--border)', borderLeft: '3px solid', background: 'var(--bg)', height: '100%',
  },
  newsTag: {
    display: 'inline-flex', width: 'fit-content', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.5px',
    textTransform: 'uppercase', padding: '3px 9px', borderRadius: 100,
  },
  newsDate:     { fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' },
  newsTitle:    { fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 },
  newsDesc:     { fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6, flex: 1 },
  newsFooter:   { display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 },
  newsReadMore: { fontSize: 12, fontWeight: 600, color: 'var(--accent-text)' },
}
