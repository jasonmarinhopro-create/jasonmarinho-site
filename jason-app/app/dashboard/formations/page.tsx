// Espace Formations (refonte du 23/11/2026, maquettes validées par Jason,
// docs/claude/formations.md) : une page, 4 onglets (?onglet=aujourdhui |
// parcours | catalogue | moi). Remplace l'ancien catalogue et les pages
// Parcours, Profil apprenant et Favoris (redirigées ici).
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import { getUnlockedFormationSlugs } from '@/lib/queries/formation-access'
import { getCachedPublishedFormations } from '@/lib/queries/cache'
import { recommendFormations } from '@/lib/formations/recommend'
import { isNouvelleFormation } from '@/lib/formations/nouveau'
import { weekStartParis, WEEKLY_GOAL } from '@/lib/formations/revision'
import { parseLesson } from '@/lib/formations/blocks'
import { lessonSteps } from '@/lib/formations/steps'
import { computeSignals } from '@/lib/formations/signals'
import { coverBackground, objectifLabel } from '@/lib/formations/objectifs'
import { PARCOURS } from '@/lib/formations/parcours'
import { FORMATION_CONTENT_MAP } from '@/app/dashboard/admin/formations/[slug]/contentMap'
import TitleSetter from '@/components/layout/TitleSetter'
import RevisionCard from '@/components/formations/RevisionCard'
import FormationsHub from './hub/FormationsHub'
import FormationsSuggestForm from './FormationsSuggestForm'
import type { HubData, HubFormation, HubResume, HubSaved, HubTab } from './hub/types'

export const metadata: Metadata = {
  title: 'Tes formations LCD, Jason Marinho',
  description: 'Des formations courtes et concrètes pour ta location courte durée : prix, visibilité, fiscalité, accueil. Questions, actions et attestation.',
  robots: { index: false, follow: false },
}

// Ordre du catalogue (et liste des formations actives, vérifiée par
// lib/formations/catalogue-sync.test.ts)
const ACTIVE_SLUGS = [
  'mettre-le-bon-prix-lcd',
  'google-my-business-lcd',
  'annonce-directe',
  'tarification-dynamique',
  'securiser-reservations-eviter-mauvais-voyageurs',
  'reseaux-sociaux-lcd',
  'optimiser-annonce-airbnb',
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
  'louer-en-direct-securise',
]

const TABS: HubTab[] = ['aujourdhui', 'parcours', 'catalogue', 'moi']

function parisToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date())
}

export default async function FormationsPage({ searchParams }: { searchParams: { onglet?: string; objectif?: string } }) {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])
  if (!profile) return null
  const userId = profile.userId
  const plan = profile.plan ?? 'decouverte'
  const today = parisToday()
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  const weekStart = weekStartParis(new Date())

  const [
    cached, ufRes, favRes, unlockedSlugs, logRes, logementsRes, contractsRes,
    sejoursNextRes, sejoursCountRes, answersRes, actionsRes, bookmarksRes, notesRes, totalLessonsRes,
  ] = await Promise.all([
    getCachedPublishedFormations(),
    supabase.from('user_formations').select('formation_id, progress, completed_lessons, completed_at').eq('user_id', userId),
    supabase.from('user_formation_favorites').select('formation_id').eq('user_id', userId),
    getUnlockedFormationSlugs(supabase, userId, plan),
    supabase.from('user_lesson_completion_log').select('completed_at').eq('user_id', userId).gte('completed_at', weekStart).limit(200),
    supabase.from('logements').select('id, pays, prix_airbnb_nuit, prix_booking_nuit, prix_direct_nuit').eq('user_id', userId),
    supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('sejours').select('date_arrivee, date_depart').eq('user_id', userId).is('annule_at', null).lt('date_arrivee', in30).or(`date_depart.gte.${today},date_depart.is.null`).limit(300),
    supabase.from('sejours').select('id', { count: 'exact', head: true }).eq('user_id', userId).is('annule_at', null),
    supabase.from('formation_answers').select('correct').eq('user_id', userId).limit(2000),
    supabase.from('formation_action_plans').select('title, href, due_at, done_at, formation_id').eq('user_id', userId).order('created_at', { ascending: false }).limit(30),
    supabase.from('user_lesson_bookmarks').select('formation_slug, formation_title, lesson_id, lesson_title').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    supabase.from('user_lesson_notes').select('formation_id, lesson_id, content, updated_at').eq('user_id', userId).neq('content', '').order('updated_at', { ascending: false }).limit(5),
    supabase.from('user_lesson_completion_log').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  const active = new Set(ACTIVE_SLUGS)
  const order = new Map(ACTIVE_SLUGS.map((s, i) => [s, i]))
  const published = cached.filter(f => active.has(f.slug)).sort((a, b) => (order.get(a.slug)! - order.get(b.slug)!))
  const bySlug = new Map(published.map(f => [f.slug, f]))
  const byId = new Map(published.map(f => [f.id, f]))
  const ufs = (ufRes.data ?? []) as Array<{ formation_id: string; progress: number | null; completed_lessons: number[] | null; completed_at: string | null }>
  const ufById = new Map(ufs.map(u => [u.formation_id, u]))
  const slotsFull = unlockedSlugs !== null && unlockedSlugs.length >= 2

  // Formations avec leur prochaine leçon (contenu des content.ts)
  const formations: HubFormation[] = published.map(f => {
    const content = FORMATION_CONTENT_MAP[f.slug]
    const uf = ufById.get(f.id)
    const done = new Set((uf?.completed_lessons ?? []) as number[])
    const all = content ? content.modules.flatMap(m => m.lessons) : []
    const nextLesson = all.find(l => !done.has(l.id)) ?? null
    return {
      id: f.id,
      slug: f.slug,
      title: content?.title ?? f.title,
      duration: content?.duration ?? f.duration ?? '',
      lessons: all.length || (f.lessons_count ?? 0),
      progress: uf ? (uf.progress ?? 0) : -1,
      locked: slotsFull && !unlockedSlugs!.includes(f.slug),
      isNew: isNouvelleFormation(f.created_at),
      objectif: objectifLabel(f.slug),
      cover: coverBackground(f.slug, 0.25),
      next: nextLesson ? { id: nextLesson.id, title: nextLesson.title, duration: nextLesson.duration, steps: lessonSteps(parseLesson(nextLesson.content)).length } : null,
    }
  })
  const fBySlug = new Map(formations.map(f => [f.slug, f]))

  // Reprendre : la formation en cours la plus avancée
  const inProgress = formations.filter(f => f.progress > 0 && f.progress < 100).sort((a, b) => b.progress - a.progress)[0]
  const logements = (logementsRes.data ?? []) as Array<{ id: string; pays: string | null; prix_airbnb_nuit: number | null; prix_booking_nuit: number | null; prix_direct_nuit: number | null }>
  const recommended = recommendFormations({
    countries: Array.from(new Set(logements.map(l => l.pays ?? 'FR'))),
    logementsCount: logements.length,
    hasContracts: (contractsRes.count ?? 0) > 0,
    month: new Date().getMonth() + 1,
    startedSlugs: new Set(formations.filter(f => f.progress >= 0).map(f => f.slug)),
    availableSlugs: new Set(formations.filter(f => !f.locked).map(f => f.slug)),
  }, 3)

  function resumeOf(f: HubFormation, isStart: boolean): HubResume | null {
    const content = FORMATION_CONTENT_MAP[f.slug]
    if (!content || !f.next) return null
    const mod = content.modules.find(m => m.lessons.some(l => l.id === f.next!.id))!
    const uf = ufById.get(f.id)
    const done = new Set((uf?.completed_lessons ?? []) as number[])
    return {
      slug: f.slug, title: f.title, lessonId: f.next.id, lessonTitle: f.next.title,
      moduleLabel: `Module ${mod.id}`, steps: f.next.steps, duration: f.next.duration,
      moduleBars: { done: mod.lessons.filter(l => done.has(l.id)).length, total: mod.lessons.length },
      isStart,
    }
  }
  const startCandidate = recommended[0] ? fBySlug.get(recommended[0].slug) : formations.find(f => f.progress < 0 && !f.locked)
  const resume = inProgress ? resumeOf(inProgress, false) : startCandidate ? resumeOf(startCandidate, true) : null

  // Repéré dans ton activité
  const leconsFaites = new Set<string>()
  for (const u of ufs) {
    const f = byId.get(u.formation_id)
    if (f) for (const id of (u.completed_lessons ?? []) as number[]) leconsFaites.add(`${f.slug}:${id}`)
  }
  const signal = computeSignals({
    today,
    logementsCount: logements.length,
    prixRenseignes: logements.some(l => l.prix_airbnb_nuit != null || l.prix_booking_nuit != null || l.prix_direct_nuit != null),
    sejoursTotal: sejoursCountRes.count ?? 0,
    sejoursProchains: ((sejoursNextRes.data ?? []) as Array<{ date_arrivee: string; date_depart: string | null }>).map(s => ({ arrivee: s.date_arrivee, depart: s.date_depart })),
    leconsFaites,
  })[0] ?? null

  // Semaine (lundi à dimanche, heure de Paris)
  const dayIdx = (iso: string) => (new Date(iso).getTime() - new Date(weekStart).getTime()) / 86400000
  const weekDays = [false, false, false, false, false, false, false]
  for (const r of (logRes.data ?? []) as Array<{ completed_at: string }>) {
    const i = Math.floor(dayIdx(r.completed_at))
    if (i >= 0 && i < 7) weekDays[i] = true
  }
  const todayIndex = Math.min(6, Math.max(0, Math.floor(dayIdx(new Date().toISOString()))))

  // Moi
  const answers = (answersRes.data ?? []) as Array<{ correct: boolean }>
  const actionsRaw = (actionsRes.data ?? []) as Array<{ title: string; href: string | null; due_at: string | null; done_at: string | null; formation_id: string }>
  const saved: HubSaved[] = []
  for (const b of (bookmarksRes.data ?? []) as Array<{ formation_slug: string; formation_title: string; lesson_id: number; lesson_title: string }>) {
    saved.push({ kind: 'lecon', label: b.lesson_title, sub: b.formation_title, href: `/dashboard/formations/${b.formation_slug}?lecon=${b.lesson_id}` })
  }
  for (const fv of (favRes.data ?? []) as Array<{ formation_id: string }>) {
    const f = byId.get(fv.formation_id)
    if (f) saved.push({ kind: 'formation', label: fBySlug.get(f.slug)?.title ?? f.title, sub: objectifLabel(f.slug), href: `/dashboard/formations/${f.slug}` })
  }
  for (const n of (notesRes.data ?? []) as Array<{ formation_id: string; lesson_id: number; content: string }>) {
    const f = byId.get(n.formation_id)
    if (f) saved.push({ kind: 'note', label: n.content.slice(0, 90), sub: fBySlug.get(f.slug)?.title ?? f.title, href: `/dashboard/formations/${f.slug}?lecon=${n.lesson_id}` })
  }

  const data: HubData = {
    firstName: profile.full_name?.split(' ')[0] ?? '',
    plan,
    formations,
    resume,
    signal,
    recommended,
    parcours: PARCOURS.map(p => ({ slug: p.slug, title: p.title, forWho: p.forWho, duration: p.duration, icon: p.icon, formations: p.formations.filter(s => bySlug.has(s)) })),
    weekDone: (logRes.data ?? []).length,
    weekGoal: WEEKLY_GOAL,
    weekDays,
    todayIndex,
    actions: actionsRaw.map(a => ({ title: a.title, href: a.href, dueAt: a.due_at, doneAt: a.done_at, formationTitle: byId.get(a.formation_id)?.title ?? '' })),
    stats: {
      lessons: totalLessonsRes.count ?? 0,
      actionsDone: actionsRaw.filter(a => a.done_at).length,
      goodPct: answers.length ? Math.round((answers.filter(a => a.correct).length / answers.length) * 100) : null,
    },
    saved,
  }

  const tab = (TABS as string[]).includes(searchParams.onglet ?? '') ? searchParams.onglet as HubTab : 'aujourdhui'

  return (
    <>
      <TitleSetter title="Formations" />
      <FormationsHub
        data={data}
        initialTab={tab}
        initialParcours={searchParams.objectif ?? null}
        revision={<Suspense fallback={null}><RevisionCard userId={userId} /></Suspense>}
        suggest={<FormationsSuggestForm />}
      />
    </>
  )
}
