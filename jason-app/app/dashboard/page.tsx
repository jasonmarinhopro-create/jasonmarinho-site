import { getProfile } from '@/lib/queries/profile'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  CalendarBlank, CurrencyEur,
  ArrowRight, Newspaper, UserPlus, Flag, CalendarPlus,
  GraduationCap, Trophy, Flame,
} from '@phosphor-icons/react/dist/ssr'
import EtatDesLieux from './EtatDesLieux'
import ChezNousWidget from './ChezNousWidget'
import SetupChecklist, { type SetupStep } from './SetupChecklist'
import MesPlateformesWidget from './MesPlateformesWidget'
import OnboardingTour from './OnboardingTour'
import { isBlockedIcalEvent } from '@/lib/ical/blocked'
import { getCachedCommunityGroups, getCachedPublishedActualites } from '@/lib/queries/cache'
import type { CategoryId } from '@/lib/chez-nous/categories'

function getGreeting() {
  const h = parseInt(new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', hour12: false, timeZone: 'Europe/Paris' }).format(new Date()))
  return h >= 18 || h < 5 ? 'Bonsoir' : 'Bonjour'
}

function todayStr() {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
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
function fmtEur(n: number) {
  if (n === 0) return '0 €'
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 < 100 ? 1 : 0)} k€`
  return `${n} €`
}
function monthPrefix(offset = 0) {
  const d = new Date()
  d.setMonth(d.getMonth() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default async function DashboardPage() {
  const profile  = await getProfile()
  const supabase = await createClient()
  const userId   = profile?.userId ?? ''
  const completedSteps = profile?.onboarding_completed_steps ?? []
  const now      = new Date()
  const today    = todayStr()
  const in7      = addDays(today, 7)
  const monthPfx = monthPrefix(0)
  const prevMPfx = monthPrefix(-1)
  const yearPfx  = String(now.getFullYear())

  // ── 1 SEULE Promise.allSettled pour TOUTES les requêtes parallélisables.
  // allSettled (vs all) : si une requête échoue (table renommée, colonne supprimée,
  // timeout réseau), les autres restent disponibles et la page se rend en mode dégradé
  // au lieu de planter complètement.
  const results = await Promise.allSettled([
    supabase
      .from('contracts')
      .select('id, logement_nom, date_arrivee, date_depart, statut, checklist_status, montant_loyer, stripe_payment_status, stripe_payment_enabled, locataire_prenom, locataire_nom')
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
      .select('montant, date_paiement')
      .eq('user_id', userId)
      .gte('date_paiement', `${yearPfx}-01-01`)
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
      .select('montant, date_arrivee')
      .eq('user_id', userId)
      .not('montant', 'is', null)
      .gt('montant', 0)
      .gte('date_arrivee', `${yearPfx}-01-01`)
      .lt('date_arrivee', `${parseInt(yearPfx) + 1}-01-01`),
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
      .select('id, title, start_date, end_date, description')
      .eq('user_id', userId)
      .gte('start_date', `${yearPfx}-01-01`)
      .order('start_date'),
    // Séjours avec dates ET voyageur pour l'affichage prochaines arrivées
    // (le sejours[11] précédent n'a que montant+date_arrivee pour le CA).
    supabase
      .from('sejours')
      .select('id, voyageur_id, logement, date_arrivee, date_depart, voyageurs(prenom, nom)')
      .eq('user_id', userId)
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
  const { data: sejoursYearAll }  = pick<{ data: { montant: number | null; date_arrivee: string }[] | null }>(11, { data: [] })
  const { data: platformLinksRaw } = pick<{ data: {
    inbox_airbnb_url: string | null
    inbox_booking_url: string | null
    inbox_vrbo_url: string | null
    inbox_abritel_url: string | null
    inbox_driing_url: string | null
    inbox_gmb_url: string | null
    custom_platform_links: Array<{ label: string; url: string; color?: string }> | null
  } | null }>(12, { data: null })
  const { data: icalEventsRaw } = pick<{ data: Array<{ id: string; title: string; start_date: string; end_date: string | null; description: string | null }> | null }>(13, { data: [] })
  const { data: sejoursForArrivals } = pick<{ data: Array<{ id: string; voyageur_id: string | null; logement: string | null; date_arrivee: string; date_depart: string; voyageurs: { prenom: string | null; nom: string | null } | Array<{ prenom: string | null; nom: string | null }> | null }> | null }>(14, { data: [] })
  const { count: pricingCount }  = pick<{ count: number | null }>(15, { count: 0 })

  const latestNews = allCachedNews.slice(0, 3)

  // Split de la requête revenus annuelle en this month / prev month / year (JS, gratuit)
  const yearEntries     = entriesYearAll ?? []
  const entriesThisMois = yearEntries.filter(e => e.date_paiement?.startsWith(monthPfx))
  const entriesPrevMois = yearEntries.filter(e => e.date_paiement?.startsWith(prevMPfx))
  const entriesThisYear = yearEntries

  // Idem pour les séjours (carnet voyageurs) — split JS depuis la requête année.
  const yearSejours      = sejoursYearAll ?? []
  const sejoursThisMois  = yearSejours.filter(s => s.date_arrivee?.startsWith(monthPfx))
  const sejoursPrevMois  = yearSejours.filter(s => s.date_arrivee?.startsWith(prevMPfx))

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

  // ── Chez Nous : authors fetchés à part (dépendent des author_ids des posts).
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
  for (const e of (icalEventsRaw ?? [])) {
    if (!e.start_date) continue
    // Skip blocages "Not available" / "Closed" générés par Airbnb chaque jour.
    if (isBlockedIcalEvent(e.title, e.description)) continue
    // Si un contract ou un sejour couvre déjà cette date → on skip l'iCal
    // qui n'est que le miroir Airbnb/Booking de la même résa (sinon
    // doublon visible dans "Prochaines arrivées").
    if (datesCoveredByMaster.has(e.start_date)) continue
    const k = dedupKey(e.start_date, e.title)
    if (seenOcc.has(k)) continue
    seenOcc.add(k)
    occupations.push({
      id: `ical-${e.id}`,
      source: 'ical',
      date_arrivee: e.start_date,
      date_depart: e.end_date,
      logement_nom: null,
      label: e.title || 'Réservation',
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
  const pendingPayments = allC.filter(c =>
    c.stripe_payment_enabled && c.stripe_payment_status !== 'paid'
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

  // ── KPIs financiers
  const isPaid = (c: typeof allC[0]) =>
    c.stripe_payment_status === 'paid' || (!c.stripe_payment_enabled && c.statut === 'signe')

  // Revenus contrats ce mois
  const contratsThisMois = allC
    .filter(c => c.date_arrivee?.startsWith(monthPfx) && isPaid(c))
    .reduce((acc, c) => acc + (c.montant_loyer ?? 0), 0)

  // Revenus contrats mois précédent
  const contratsPrevMois = allC
    .filter(c => c.date_arrivee?.startsWith(prevMPfx) && isPaid(c))
    .reduce((acc, c) => acc + (c.montant_loyer ?? 0), 0)

  // Revenus manuels (entries) ce mois + mois précédent
  const entriesThisSum = (entriesThisMois ?? []).reduce((acc, e) => acc + (e.montant ?? 0), 0)
  const entriesPrevSum = (entriesPrevMois ?? []).reduce((acc, e) => acc + (e.montant ?? 0), 0)

  // Revenus séjours (carnet voyageurs) ce mois + mois précédent
  const sejoursThisSum = sejoursThisMois.reduce((acc, s) => acc + (s.montant ?? 0), 0)
  const sejoursPrevSum = sejoursPrevMois.reduce((acc, s) => acc + (s.montant ?? 0), 0)

  const revenusThisMois = contratsThisMois + entriesThisSum + sejoursThisSum
  const revenusPrevMois = contratsPrevMois + entriesPrevSum + sejoursPrevSum

  // ── Revenu annuel YTD + objectif
  const contratsThisYear = allC
    .filter(c => c.date_arrivee?.startsWith(yearPfx) && isPaid(c))
    .reduce((acc, c) => acc + (c.montant_loyer ?? 0), 0)
  const entriesThisYearSum = (entriesThisYear ?? []).reduce((acc, e) => acc + (e.montant ?? 0), 0)
  // Séjours du carnet voyageurs : même logique que /revenus (page de vérité).
  // Évite que l'objectif annuel reste à 0 alors qu'on a déjà encaissé via
  // l'onglet Mes voyageurs.
  const sejoursThisYearSum = (sejoursYearAll ?? []).reduce((acc, s) => acc + (s.montant ?? 0), 0)
  const revenuYTD = contratsThisYear + entriesThisYearSum + sejoursThisYearSum
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
  const revenuPrevisionnelContracts = allC
    .filter(c => c.date_arrivee > today)
    .reduce((acc, c) => acc + (c.montant_loyer ?? 0), 0)
  const revenuPrevisionnelSejours = (sejoursYearAll ?? [])
    .filter(s => s.date_arrivee > today)
    .reduce((acc, s) => acc + (s.montant ?? 0), 0)
  const revenuPrevisionnel = revenuPrevisionnelContracts + revenuPrevisionnelSejours

  const planLabel = profile?.role === 'admin' ? 'Administrateur'
    : profile?.plan === 'driing' ? 'Membre Driing'
    : profile?.plan === 'standard' ? 'Standard'
    : 'Découverte'

  // ─── Onboarding checklist : détecte si tu démarres ou pas ──────────────
  const hasLogement = (logCount ?? 0) > 0
  const hasContract = (contracts ?? []).length > 0
  const hasObjectif = !!objectifData
  const hasFormationStarted = totalLessonsDone > 0

  // ── Auteurs Chez Nous (await la promesse déférée plus haut)
  const cnAuthorsResult = await cnAuthorsPromise
  const cnAuthors: Record<string, { full_name: string | null; pseudo: string | null }> = {}
  ;(cnAuthorsResult.data ?? []).forEach(a => {
    cnAuthors[a.id] = { full_name: a.full_name, pseudo: a.pseudo }
  })
  const setupSteps: SetupStep[] = [
    {
      key: 'account', label: 'Ton compte est créé',
      desc: 'Tu fais partie de la communauté Jason Marinho',
      done: true, ctaLabel: '', ctaHref: '', durationLabel: '',
    },
    {
      key: 'logement', label: 'Ajouter ton premier logement',
      desc: 'Indispensable pour préfiler tous les outils avec tes vrais chiffres',
      done: hasLogement, ctaLabel: 'Ajouter', ctaHref: '/dashboard/logements',
      durationLabel: '3 min',
    },
    {
      key: 'sejour', label: 'Saisir ta première réservation',
      desc: 'Active le pilotage CA, ADR, occupation et performances',
      done: hasContract, ctaLabel: 'Ouvrir', ctaHref: '/dashboard/calendrier',
      durationLabel: '2 min',
    },
    // Step "prix" : visible UNIQUEMENT si l'hôte a au moins 1 logement
    // (sinon ça n'a aucun sens). done = au moins 1 logement avec un prix
    // par plateforme configuré (Airbnb, Booking ou Direct).
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
      desc: 'Pour voir où tu en es par rapport à ton plan de vol',
      done: hasObjectif, ctaLabel: 'Définir', ctaHref: '/dashboard/revenus',
      durationLabel: '1 min',
    },
    {
      key: 'apprendre', label: 'Commencer une formation',
      desc: 'Approfondis fiscalité, classement Atout France, automatisation',
      done: hasFormationStarted, ctaLabel: 'Explorer', ctaHref: '/dashboard/formations',
    },
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
        <SetupChecklist
          userId={userId}
          steps={setupSteps}
          initiallyDismissed={completedSteps.includes('setup:dismissed')}
        />

        {/* ── Mes plateformes : accès rapide aux inbox (Airbnb, Booking…) */}
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

        {/* ── Welcome / Ma journée ─────────────────────────────────────── */}
        <section style={s.welcome} className="fade-up dash-welcome">
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={s.welcomeSub}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h2 style={s.welcomeTitle}>
              {getGreeting()}{firstName ? `, ${firstName}` : ''}
            </h2>
            <p style={s.welcomeDesc}>
              {(() => {
                const ta = todayArrivals.length
                const td = todayDepartures.length
                const ac = activeStays.length
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
                if (weekArrivals.length > 0) {
                  return `Aucune arrivée aujourd'hui · ${weekArrivals.length} prévue${pl(weekArrivals.length)} cette semaine`
                }
                if (ac > 0) {
                  return `${ac} séjour${pl(ac)} en cours · Tout est en ordre ✓`
                }
                return 'Aucun séjour prévu cette semaine. Profite de ce calme pour préparer la suite.'
              })()}
            </p>
          </div>
          <div style={s.statsRow} className="dash-stats-row" data-tour="dashboard-stats">
            <div style={s.stat}>
              <span style={{ ...s.statVal, color: upcomingReservationsCount > 0 ? 'var(--success-1)' : 'var(--accent-text)' }} className="tabular-nums">{upcomingReservationsCount}</span>
              <span style={s.statLbl}>Réservation{pl(upcomingReservationsCount)} à venir</span>
            </div>
            <div style={s.statDivider} />
            <div style={s.stat}>
              <span style={{ ...s.statVal, color: 'var(--accent-text)' }} className="tabular-nums">{pastReservationsCount}</span>
              <span style={s.statLbl}>Déjà venu{pl(pastReservationsCount)}</span>
            </div>
            <div style={s.statDivider} />
            <div style={s.stat}>
              <span style={{ ...s.statVal, color: actionsCount > 0 ? 'var(--danger)' : 'var(--accent-text)' }} className="tabular-nums">{actionsCount}</span>
              <span style={s.statLbl}>Action{pl(actionsCount)} à traiter</span>
            </div>
          </div>
        </section>

        {/* ── Quick actions ────────────────────────────────────────────── */}
        <section style={s.section} className="fade-up d1">
          <div style={s.quickStrip}>
            <Link href="/dashboard/calendrier" style={s.quickItem} className="quick-hover">
              <span style={{ ...s.quickIcon, color: '#15803d', background: 'rgba(21,128,61,0.12)' }}>
                <CalendarPlus size={18} weight="duotone" />
              </span>
              <span style={s.quickLabel}>Nouveau séjour</span>
            </Link>
            <Link href="/dashboard/voyageurs" style={s.quickItem} className="quick-hover">
              <span style={{ ...s.quickIcon, color: '#0369a1', background: 'rgba(3,105,161,0.12)' }}>
                <UserPlus size={18} weight="duotone" />
              </span>
              <span style={s.quickLabel}>Nouveau voyageur</span>
            </Link>
            <Link href="/dashboard/revenus" style={s.quickItem} className="quick-hover">
              <span style={{ ...s.quickIcon, color: '#d97706', background: 'rgba(217,119,6,0.12)' }}>
                <CurrencyEur size={18} weight="duotone" />
              </span>
              <span style={s.quickLabel}>Saisir un revenu</span>
            </Link>
            <Link href="/dashboard/securite" style={s.quickItem} className="quick-hover">
              <span style={{ ...s.quickIcon, color: 'var(--danger)', background: 'rgba(220,38,38,0.12)' }}>
                <Flag size={18} weight="duotone" />
              </span>
              <span style={s.quickLabel}>Signaler un voyageur</span>
            </Link>
            <Link href="/dashboard/calendrier" style={s.quickItem} className="quick-hover">
              <span style={{ ...s.quickIcon, color: '#7c3aed', background: 'rgba(124,58,237,0.12)' }}>
                <CalendarBlank size={18} weight="duotone" />
              </span>
              <span style={s.quickLabel}>Voir le calendrier</span>
            </Link>
          </div>
        </section>

        {/* ── Prochains événements 14 jours ─────────────────────────────── */}
        <section style={s.section} className="fade-up d1">
          <div style={s.upcomingCard}>
            <div style={s.upcomingHead}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarBlank size={14} weight="fill" color="var(--accent-text)" />
                <span style={s.upcomingTitle}>Prochaines arrivées &amp; départs</span>
              </div>
              <Link href="/dashboard/calendrier" style={s.upcomingLink}>
                Voir le calendrier <ArrowRight size={11} weight="bold" />
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <div style={s.upcomingEmpty}>
                <CalendarBlank size={22} weight="duotone" color="var(--text-muted)" />
                <div>
                  <div style={s.upcomingEmptyTitle}>Calendrier serein</div>
                  <div style={s.upcomingEmptySub}>Aucune arrivée ou départ dans les 14 prochains jours.</div>
                </div>
              </div>
            ) : (
              <div style={s.upcomingList}>
                {upcomingEvents.map((e, i) => {
                  const c = e.contract
                  const o = e.occ
                  const isArr = e.type === 'arrival'
                  const color = isArr ? '#15803d' : '#0369a1'
                  const bg = isArr ? 'rgba(21,128,61,0.10)' : 'rgba(3,105,161,0.10)'
                  const traveler = c
                    ? [c.locataire_prenom, c.locataire_nom].filter(Boolean).join(' ')
                    : (o.source === 'sejour' || o.source === 'ical' ? o.label : '')
                  const logementLabel = c?.logement_nom ?? o.logement_nom ?? (o.source === 'ical' ? 'Synchro plateforme' : 'Logement')
                  return (
                    <Link key={`${o.id}_${e.type}_${i}`} href="/dashboard/calendrier" style={s.upcomingItem}>
                      <div style={{ ...s.upcomingDot, background: bg, color }}>
                        <CalendarBlank size={14} weight="fill" />
                      </div>
                      <div style={s.upcomingMain}>
                        <div style={s.upcomingItemTop}>
                          <span style={s.upcomingDate}>{relDate(e.date)}</span>
                          <span style={{ ...s.upcomingType, color, background: bg }}>
                            {isArr ? 'Arrivée' : 'Départ'}
                          </span>
                        </div>
                        <div style={s.upcomingMainText}>
                          {logementLabel}
                          {traveler && <span style={s.upcomingTraveler}> · {traveler}</span>}
                        </div>
                      </div>
                      <ArrowRight size={12} weight="bold" color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── État des lieux, 4 métriques ─────────────────────────────── */}
        <section style={s.section} className="fade-up d1">
          <EtatDesLieux
            revenuPrevisionnel={revenuPrevisionnel}
            revenusThisMois={revenusThisMois}
            revenusPrevMois={revenusPrevMois}
            totalReach={totalReach}
            joinedCount={joinedCount}
            totalGroupCount={communityGroups.length}
            urgentCount={actionsCount}
          />
        </section>

        {/* ── Section "Action urgente" et "Résumé opérationnel"
              SUPPRIMÉES : doublons avec la KPI tile #4 d'EtatDesLieux
              ("Action urgente · Tout est à jour") et avec le widget
              "Prochaines arrivées & départs" (14j). Si actions = 0 et
              calendrier serein, l'EtatDesLieux suffit. Si actions > 0,
              elles apparaissent dans EtatDesLieux + sont déjà reflétées
              dans le compteur statsRow ci-dessus. */}

        {/* ── Objectif revenu annuel ──────────────────────────────────── */}
        {objectifAnnuel !== null && objectifAnnuel > 0 && (
          <section style={s.section} className="fade-up d3">
            <Link href="/dashboard/revenus" style={s.objectifCard}>
              <div style={s.objectifHead}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={14} weight="fill" color="#15803d" />
                  <span style={s.objectifLabel}>Objectif {yearPfx}</span>
                </div>
                <span style={s.objectifPct}>
                  {objectifPct}% <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>vs {expectedPct}% attendu</span>
                </span>
              </div>
              <div style={s.objectifBar}>
                <div style={{
                  ...s.objectifFill,
                  width: `${objectifPct}%`,
                  // Toujours vert — variation d'intensité selon avance/retard
                  // pour rester dans la charte (pas d'orange off-brand).
                  background: (objectifPct ?? 0) >= expectedPct
                    ? 'linear-gradient(90deg, #15803d, #34d399)'
                    : 'linear-gradient(90deg, #166534, #4ade80)',
                  opacity: (objectifPct ?? 0) >= expectedPct ? 1 : 0.82,
                }} />
                {/* Repère du % attendu */}
                <div style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: `${expectedPct}%`,
                  width: '2px', background: 'var(--text-muted)', opacity: 0.5,
                }} />
              </div>
              <div style={s.objectifMeta}>
                <span><strong style={{ color: 'var(--text)' }}>{fmtEur(revenuYTD)}</strong> sur {fmtEur(objectifAnnuel)}</span>
                <span style={{ color: (objectifPct ?? 0) >= expectedPct ? 'var(--success-1)' : 'var(--warning)', fontWeight: 600 }}>
                  {(objectifPct ?? 0) >= expectedPct ? '✓ Dans les temps' : `${expectedPct - (objectifPct ?? 0)} pts derrière`}
                </span>
              </div>
            </Link>
          </section>
        )}

        {/* ── Pulse apprenant ─────────────────────────────────────────── */}
        {(learnerLevel || formationInProgressData) && (
          <section style={s.section} className="fade-up d3">
            <Link href="/dashboard/formations/profil-apprenant" style={s.learnerCard}>
              <div style={s.learnerLeft}>
                <div style={s.learnerHead}>
                  <GraduationCap size={14} weight="fill" color="var(--accent-text)" />
                  <span style={s.learnerLabel}>Mon apprentissage</span>
                </div>
                <div style={s.learnerBadges}>
                  {learnerLevel && (
                    <span style={{ ...s.learnerLevel, color: learnerLevel.color, borderColor: `${learnerLevel.color}50`, background: `${learnerLevel.color}14` }}>
                      <Trophy size={12} weight="fill" />
                      {learnerLevel.label}
                    </span>
                  )}
                  {streakLearner > 0 && (
                    <span style={s.learnerStreak}>
                      <Flame size={12} weight="fill" color="#dc2626" />
                      <strong style={{ color: 'var(--danger)' }}>{streakLearner}</strong> jour{streakLearner > 1 ? 's' : ''}
                    </span>
                  )}
                  <span style={s.learnerCount}>
                    {totalLessonsDone} leçon{totalLessonsDone > 1 ? 's' : ''} · {formationsCompleted} formation{formationsCompleted > 1 ? 's' : ''} finie{formationsCompleted > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {formationInProgressData ? (
                <div style={s.learnerProgress}>
                  <div style={s.learnerProgressLabel}>Continue</div>
                  <div style={s.learnerProgressTitle}>{formationInProgressData.title}</div>
                  <div style={s.learnerProgressBar}>
                    <div style={{ ...s.learnerProgressFill, width: `${formationInProgressData.progress}%` }} />
                  </div>
                  <div style={s.learnerProgressMeta}>
                    {formationInProgressData.progress}% · {formationInProgressData.completedCount}/{formationInProgressData.lessonsCount} leçons
                  </div>
                </div>
              ) : (
                <div style={s.learnerProgress}>
                  <div style={s.learnerProgressLabel}>Suggestion</div>
                  <div style={s.learnerProgressTitle}>Démarre une formation pour progresser</div>
                  <div style={s.learnerProgressMeta}>16 formations disponibles dans le catalogue</div>
                </div>
              )}

              <ArrowRight size={14} weight="bold" color="var(--text-muted)" style={{ flexShrink: 0 }} />
            </Link>
          </section>
        )}

        {/* ── Chez Nous ───────────────────────────────────────────────── */}
        <section style={s.section} className="fade-up d3">
          <ChezNousWidget
            posts={(cnPosts ?? []).map(p => ({
              id: p.id,
              author_id: p.author_id,
              category: p.category as CategoryId,
              title: p.title,
              reply_count: p.reply_count,
              vote_count: p.vote_count ?? 0,
              last_reply_at: p.last_reply_at,
              created_at: p.created_at,
            }))}
            authors={cnAuthors}
            totalPosts={cnTotal ?? 0}
          />
        </section>

        {/* ── Actualités du secteur ───────────────────────────────────── */}
        {latestNews.length > 0 && (
          <section style={s.section} className="fade-up d3">
            <div style={s.sectionHead}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Newspaper size={16} color="var(--accent-text)" weight="duotone" />
                <h3 style={s.sectionTitle}>Actualités du secteur</h3>
              </div>
              <Link href="/dashboard/actualites" style={s.seeAll}>
                Tout voir <ArrowRight size={12} weight="bold" />
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
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  reglementation:      { bg: 'rgba(96,165,250,0.12)',  color: 'var(--info)', label: 'Réglementation' },
  fiscalite:           { bg: 'var(--success-bg)',  color: 'var(--success-1)', label: 'Fiscalité' },
  gites:               { bg: 'rgba(245,158,11,0.12)',  color: 'var(--warning)', label: 'Gîtes & Meublés' },
  'chambres-hotes':    { bg: 'rgba(236,72,153,0.12)',  color: '#ec4899', label: "Chambres d'hôtes" },
  conciergerie:        { bg: 'rgba(139,92,246,0.12)',  color: '#8b5cf6', label: 'Conciergeries' },
  'reservation-directe': { bg: 'rgba(16,185,129,0.12)', color: 'var(--success-1)', label: 'Réserv. directe' },
  marche:              { bg: 'rgba(244,114,182,0.12)', color: '#f472b6', label: 'Marché' },
  communes:            { bg: 'rgba(100,116,139,0.12)', color: '#64748b', label: 'Communes' },
  plateformes:         { bg: 'rgba(251,146,60,0.12)',  color: '#fb923c', label: 'Plateformes OTA' },
  outils:              { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa', label: 'Outils & Tech' },
  general:             { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', label: 'Général' },
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
  const href = article.source_url ?? '/dashboard/actualites'

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
          <span style={s.newsReadMore}>{article.source_url ? 'Lire l\'article' : 'Voir toutes les actualités'}</span>
          <ArrowRight size={11} color={tc.color} />
        </div>
      </div>
    </a>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },

  welcome: {
    // Mesh gradient subtil 2026 : vert profond → halo accent en haut à droite
    background: 'radial-gradient(ellipse 80% 60% at 90% 0%, rgba(255,213,107,0.10), transparent 60%), linear-gradient(135deg, rgba(0,76,63,0.28) 0%, rgba(0,76,63,0.10) 100%)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-xl)',
    padding: 'clamp(28px,3vw,44px) clamp(28px,4vw,52px)',
    marginBottom: 'var(--s-6)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: 'var(--s-6)', flexWrap: 'wrap',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    boxShadow: 'var(--shadow-md)',
  },
  welcomeSub:   { fontSize: 'var(--t-sm)', color: 'var(--text-3)', marginBottom: 'var(--s-2)', letterSpacing: '0.3px', textTransform: 'uppercase' as const, fontWeight: 500 },
  welcomeTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(28px,2.6vw,40px)', fontWeight: 400, color: 'var(--text)', marginBottom: 'var(--s-3)', letterSpacing: 'var(--ls-tight)', lineHeight: 'var(--lh-tight)' },
  welcomeDesc:  { fontSize: 'var(--t-base)', fontWeight: 400, color: 'var(--text-2)', maxWidth: '440px', lineHeight: 'var(--lh-relax)' },
  statsRow:     { display: 'flex', alignItems: 'center', gap: 'var(--s-7)', flexShrink: 0 },
  stat:         { textAlign: 'center' as const },
  statVal:      { display: 'block', fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(36px,3vw,44px)', fontWeight: 400, color: 'var(--accent-text)', lineHeight: 'var(--lh-tight)', letterSpacing: 'var(--ls-tight)' },
  statLbl:      { display: 'block', fontSize: 'var(--t-xs)', color: 'var(--text-3)', marginTop: 'var(--s-2)', letterSpacing: '0.4px' },
  statDivider:  { width: '1px', height: '48px', background: 'var(--border)' },

  section:      { marginBottom: '28px' },
  sectionTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', fontWeight: 400, color: 'var(--text)', margin: 0 },
  sectionHead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  seeAll:       { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 500, padding: '5px 10px', borderRadius: '8px', background: 'rgba(255,213,107,0.08)', border: '1px solid rgba(255,213,107,0.2)', transition: 'background 0.15s, border-color 0.15s' },

  // ── Quick actions ─────────────────────────────────────────────────────────
  quickStrip: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 'var(--s-3)',
  },
  quickItem: {
    display: 'flex', alignItems: 'center', gap: 'var(--s-3)',
    padding: 'var(--s-4) var(--s-4)', borderRadius: 'var(--r-md)',
    background: 'var(--surface)', border: '1px solid var(--border)',
    textDecoration: 'none' as const, color: 'var(--text-2)',
    transition: 'border-color var(--d-base) var(--ease-smooth), transform var(--d-base) var(--ease-out), background var(--d-base) var(--ease-smooth), box-shadow var(--d-base) var(--ease-smooth)',
    fontSize: 'var(--t-sm)', fontWeight: 600,
  },
  quickIcon: {
    width: '38px', height: '38px', borderRadius: 'var(--r-md)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    transition: 'transform var(--d-base) var(--ease-spring)',
  },
  quickLabel: { color: 'var(--text)', fontSize: 'var(--t-sm)', fontWeight: 600, lineHeight: 'var(--lh-tight)' },

  // ── Objectif revenu annuel ───────────────────────────────────────────────
  objectifCard: {
    display: 'block', padding: '18px 22px', borderRadius: '14px',
    background: 'var(--surface)', border: '1px solid rgba(21,128,61,0.32)',
    textDecoration: 'none' as const, color: 'inherit',
    transition: 'border-color 0.15s',
  },
  objectifHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '12px', flexWrap: 'wrap' as const, gap: '8px',
  },
  objectifLabel: { fontSize: '12px', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase' as const, letterSpacing: '0.6px' },
  objectifPct: { fontFamily: 'var(--font-fraunces), serif', fontSize: '20px', fontWeight: 500, color: '#15803d', lineHeight: 1 },
  objectifBar: {
    position: 'relative' as const,
    height: '10px', background: 'var(--surface-2)', borderRadius: '6px',
    overflow: 'hidden' as const, marginBottom: '10px',
  },
  objectifFill: {
    height: '100%', borderRadius: '6px',
    transition: 'width 0.6s ease',
  },
  objectifMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-2)', flexWrap: 'wrap' as const, gap: '6px' },

  // ── Pulse apprenant ───────────────────────────────────────────────────────
  learnerCard: {
    display: 'flex', alignItems: 'center', gap: '20px',
    padding: '18px 22px', borderRadius: '14px',
    background: 'var(--surface)', border: '1px solid var(--accent-border)',
    textDecoration: 'none' as const, color: 'inherit',
    transition: 'border-color 0.15s, background 0.15s',
    flexWrap: 'wrap' as const,
  },
  learnerLeft: { flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  learnerHead: {
    display: 'flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 700, color: 'var(--text-2)',
    textTransform: 'uppercase' as const, letterSpacing: '0.6px',
  },
  learnerLabel: { color: 'var(--text-2)' },
  learnerBadges: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const },
  learnerLevel: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', fontWeight: 700,
    padding: '5px 11px', borderRadius: '100px',
    border: '1px solid',
  },
  learnerStreak: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', fontWeight: 500, color: 'var(--text)',
    padding: '5px 11px', borderRadius: '100px',
    background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.25)',
  },
  learnerCount: { fontSize: '12px', color: 'var(--text-2)', fontWeight: 500 },
  learnerProgress: {
    flex: '1 1 280px', minWidth: '260px',
    display: 'flex', flexDirection: 'column' as const, gap: '4px',
    paddingLeft: '16px', borderLeft: '1px solid var(--border)',
  },
  learnerProgressLabel: { fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.6px' },
  learnerProgressTitle: { fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 },
  learnerProgressBar: {
    height: '5px', background: 'var(--surface-2)', borderRadius: '3px',
    overflow: 'hidden' as const, marginTop: '4px',
  },
  learnerProgressFill: {
    height: '100%', background: 'linear-gradient(90deg, var(--accent-text), #15803d)', borderRadius: '3px',
  },
  learnerProgressMeta: { fontSize: '11.5px', color: 'var(--text-2)', fontWeight: 500 },

  // ── Prochains événements (14 jours) ───────────────────────────────────────
  upcomingCard: {
    padding: '18px 20px', borderRadius: '14px',
    background: 'var(--surface)', border: '1px solid var(--border)',
  },
  upcomingHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '14px', flexWrap: 'wrap' as const, gap: '8px',
  },
  upcomingTitle: { fontSize: '12px', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase' as const, letterSpacing: '0.6px' },
  upcomingLink: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '12px', fontWeight: 600, color: 'var(--accent-text)',
    textDecoration: 'none' as const,
  },
  upcomingList: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  upcomingItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 14px', borderRadius: '10px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    textDecoration: 'none' as const, color: 'inherit',
    transition: 'border-color 0.15s, background 0.15s',
  },
  upcomingDot: {
    width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  upcomingMain: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' as const, gap: '3px' },
  upcomingItemTop: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const },
  upcomingDate: { fontSize: '13px', fontWeight: 600, color: 'var(--text)' },
  upcomingType: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.4px',
    padding: '2px 8px', borderRadius: '100px', textTransform: 'uppercase' as const,
  },
  upcomingMainText: {
    fontSize: '12.5px', color: 'var(--text-2)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  upcomingTraveler: { color: 'var(--text-muted)' },
  upcomingEmpty: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '18px 16px', borderRadius: '10px',
    background: 'var(--surface-2)', border: '1px dashed var(--border-2)',
  },
  upcomingEmptyTitle: { fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' },
  upcomingEmptySub: { fontSize: '12px', color: 'var(--text-2)', marginTop: '2px' },

  // Operational
  opGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' },
  opCard:      { padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' },
  opCardHead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  opCardTitle: { fontSize: '11px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.6px' },
  opLink:      { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 500 },
  countBadge:  { fontSize: '10px', fontWeight: 700, color: '#f97316', background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '10px', padding: '1px 7px' },
  stayRow:     { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' },
  badge:       { fontSize: '10px', fontWeight: 600, padding: '3px 7px', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0 },
  stayInfo:    { display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0, flex: 1 },
  stayName:    { fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  stayMeta:    { fontSize: '11px', color: 'var(--text-muted)' },
  actionRow:   { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer' },
  dot:         { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },

  // News
  newsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' },
  newsCard: {
    display: 'flex', flexDirection: 'column', gap: '10px',
    padding: '20px 22px', borderRadius: '16px',
    border: '1px solid var(--border)', borderLeft: '3px solid',
    background: 'var(--surface)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    height: '100%',
  },
  newsTag: {
    display: 'inline-flex', width: 'fit-content',
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const,
    padding: '3px 9px', borderRadius: '100px',
  },
  newsDate:     { fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' as const },
  newsTitle:    { fontSize: '14px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 },
  newsDesc:     { fontSize: '12px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.65, flex: 1 },
  newsFooter:   { display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' },
  newsReadMore: { fontSize: '11px', fontWeight: 500, color: 'var(--accent-text)' },
}
