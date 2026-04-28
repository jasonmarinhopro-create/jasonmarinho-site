import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  CalendarBlank, Warning, CurrencyEur, House, UsersThree,
  ArrowRight, Newspaper, Plus, UserPlus, FileText, Flag, CalendarPlus,
  GraduationCap, Trophy, Flame,
} from '@phosphor-icons/react/dist/ssr'
import EtatDesLieux from './EtatDesLieux'
import ActionUrgente from './ActionUrgente'
import ChezNousWidget from './ChezNousWidget'
import { getCachedCommunityGroups } from '@/lib/queries/cache'
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
  const now      = new Date()
  const today    = todayStr()
  const in7      = addDays(today, 7)
  const monthPfx = monthPrefix(0)
  const prevMPfx = monthPrefix(-1)
  const yearPfx  = String(now.getFullYear())

  const [
    { data: contracts },
    { count: logCount },
    { data: latestNews },
    { data: entriesThisMois },
    { data: entriesPrevMois },
    communityGroups,
  ] = await Promise.all([
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
    supabase
      .from('actualites')
      .select('id, title, summary, source_url, category, published_at, created_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(3),
    supabase
      .from('revenus_entries')
      .select('montant')
      .eq('user_id', userId)
      .gte('date_paiement', `${monthPfx}-01`)
      .lt('date_paiement', `${monthPrefix(1)}-01`),
    supabase
      .from('revenus_entries')
      .select('montant')
      .eq('user_id', userId)
      .gte('date_paiement', `${prevMPfx}-01`)
      .lt('date_paiement', `${monthPfx}-01`),
    getCachedCommunityGroups(),
  ])

  // Memberships fetched separately (depends on userId, can't be cached globally)
  const { data: joinedMemberships } = userId
    ? await supabase
        .from('user_community_memberships')
        .select('group_id')
        .eq('user_id', userId)
        .eq('status', 'joined')
    : { data: [] as { group_id: string }[] }

  // ── Pulse apprenant : formation en cours + streak + niveau
  const [{ data: userFormationsLearn }, { data: completionLogLearn }] = userId
    ? await Promise.all([
        supabase
          .from('user_formations')
          .select('formation_id, progress, completed_lessons, formations(slug, title, lessons_count)')
          .eq('user_id', userId),
        supabase
          .from('user_lesson_completion_log')
          .select('completed_at')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false })
          .limit(500),
      ])
    : [{ data: [] }, { data: [] }]

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
      days.add(new Date(c.completed_at).toISOString().slice(0, 10))
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

  // ── Chez Nous : 3 dernières discussions actives + total
  const [{ data: cnPosts }, { count: cnTotal }] = await Promise.all([
    supabase
      .from('chez_nous_posts')
      .select('id, author_id, category, title, reply_count, vote_count, last_reply_at, created_at')
      .order('last_reply_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(3),
    supabase.from('chez_nous_posts').select('*', { count: 'exact', head: true }),
  ])
  const cnAuthorIds = Array.from(new Set((cnPosts ?? []).map(p => p.author_id)))
  const { data: cnAuthorsData } = cnAuthorIds.length
    ? await supabase.from('profiles').select('id, full_name, pseudo').in('id', cnAuthorIds)
    : { data: [] }
  const cnAuthors: Record<string, { full_name: string | null; pseudo: string | null }> = {}
  ;(cnAuthorsData ?? []).forEach(a => { cnAuthors[a.id] = { full_name: a.full_name, pseudo: a.pseudo } })

  const joinedIds    = new Set((joinedMemberships ?? []).map(m => m.group_id))
  const joinedGroups = communityGroups.filter(g => joinedIds.has(g.id))
  const totalReach   = joinedGroups.reduce((acc, g) => acc + (g.members_count ?? 0), 0)
  const joinedCount  = joinedGroups.length

  const firstName  = profile?.full_name?.split(/\s+/)[0] ?? ''
  const allC       = contracts ?? []
  const logements  = logCount ?? 0
  const pl         = (n: number, s = 's') => n !== 1 ? s : ''

  // ── Séjours
  const activeStays = allC.filter(c =>
    c.date_arrivee <= today && (!c.date_depart || c.date_depart >= today)
  )
  const weekArrivals = allC.filter(c =>
    c.date_arrivee > today && c.date_arrivee <= in7
  )
  const weekDepartures = allC.filter(c =>
    c.date_depart && c.date_depart >= today && c.date_depart <= in7 &&
    !activeStays.find(a => a.id === c.id) && !weekArrivals.find(a => a.id === c.id)
  )

  // ── Aujourd'hui spécifiquement
  const todayArrivals = allC.filter(c => c.date_arrivee === today)
  const todayDepartures = allC.filter(c => c.date_depart === today)

  // ── Mini-calendrier 14 prochains jours
  const next14Days = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(today, i)
    const arr = allC.filter(c => c.date_arrivee === d).length
    const dep = allC.filter(c => c.date_depart === d).length
    return { date: d, arrivals: arr, departures: dep }
  })

  // ── Actions
  const unsignedContracts = allC.filter(c => {
    const cl = (c.checklist_status as Record<string, boolean>) ?? {}
    return !cl.contrat_signe && c.date_arrivee >= today
  })
  const pendingPayments = allC.filter(c =>
    c.stripe_payment_enabled && c.stripe_payment_status !== 'paid'
  )
  const actionsCount = unsignedContracts.length + pendingPayments.length

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

  const revenusThisMois = contratsThisMois + entriesThisSum
  const revenusPrevMois = contratsPrevMois + entriesPrevSum

  const enAttente = allC
    .filter(c => (c.montant_loyer ?? 0) > 0 && !isPaid(c))
    .reduce((acc, c) => acc + (c.montant_loyer ?? 0), 0)

  const voyageursAnnee = allC.filter(c => c.date_arrivee?.startsWith(yearPfx)).length

  // ── Prochain séjour
  const prochainSejour = allC
    .filter(c => c.date_arrivee > today)
    .sort((a, b) => a.date_arrivee.localeCompare(b.date_arrivee))[0] ?? null

  const hasOpData =
    activeStays.length > 0 || weekArrivals.length > 0 || weekDepartures.length > 0 ||
    unsignedContracts.length > 0 || pendingPayments.length > 0

  const planLabel = profile?.role === 'admin' ? 'Administrateur'
    : profile?.plan === 'driing' ? 'Membre Driing'
    : profile?.plan === 'standard' ? 'Standard'
    : 'Découverte'

  return (
    <>
      <Header title="Accueil" userName={profile?.full_name ?? undefined} currentPlan={planLabel} />
      <div style={s.page} className="dash-page">

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
          <div style={s.statsRow} className="dash-stats-row">
            <div style={s.stat}>
              <span style={{ ...s.statVal, color: todayArrivals.length > 0 ? '#15803d' : 'var(--accent-text)' }}>{todayArrivals.length}</span>
              <span style={s.statLbl}>Arrivée{pl(todayArrivals.length)} aujourd&apos;hui</span>
            </div>
            <div style={s.statDivider} />
            <div style={s.stat}>
              <span style={{ ...s.statVal, color: todayDepartures.length > 0 ? '#0369a1' : 'var(--accent-text)' }}>{todayDepartures.length}</span>
              <span style={s.statLbl}>Départ{pl(todayDepartures.length)} aujourd&apos;hui</span>
            </div>
            <div style={s.statDivider} />
            <div style={s.stat}>
              <span style={{ ...s.statVal, color: actionsCount > 0 ? '#dc2626' : 'var(--accent-text)' }}>{actionsCount}</span>
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
              <span style={{ ...s.quickIcon, color: '#dc2626', background: 'rgba(220,38,38,0.12)' }}>
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

        {/* ── Mini-calendrier 14 jours ─────────────────────────────────── */}
        <section style={s.section} className="fade-up d1">
          <Link href="/dashboard/calendrier" style={s.miniCalCard}>
            <div style={s.miniCalHead}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarBlank size={14} weight="fill" color="var(--accent-text)" />
                <span style={s.miniCalTitle}>Aperçu 2 semaines</span>
              </div>
              <span style={s.miniCalLink}>
                Voir le calendrier <ArrowRight size={11} weight="bold" />
              </span>
            </div>
            <div style={s.miniCalGrid}>
              {next14Days.map((d, i) => {
                const dt = new Date(d.date + 'T12:00:00')
                const isToday = i === 0
                const isWeekend = dt.getDay() === 0 || dt.getDay() === 6
                const hasActivity = d.arrivals > 0 || d.departures > 0
                return (
                  <div
                    key={d.date}
                    style={{
                      ...s.miniCalCell,
                      ...(isToday ? s.miniCalCellToday : {}),
                      ...(isWeekend && !isToday ? { background: 'var(--surface-2)' } : {}),
                      ...(hasActivity && !isToday ? { borderColor: 'var(--accent-border-2)' } : {}),
                    }}
                    title={`${dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}${d.arrivals > 0 ? ` — ${d.arrivals} arrivée${d.arrivals > 1 ? 's' : ''}` : ''}${d.departures > 0 ? ` — ${d.departures} départ${d.departures > 1 ? 's' : ''}` : ''}`}
                  >
                    <div style={s.miniCalDow}>
                      {dt.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3).replace('.', '')}
                    </div>
                    <div style={{ ...s.miniCalDay, color: isToday ? 'var(--accent-text)' : 'var(--text)' }}>
                      {dt.getDate()}
                    </div>
                    <div style={s.miniCalDots}>
                      {d.arrivals > 0 && (
                        <span style={{ ...s.miniCalDot, background: '#15803d' }} title={`${d.arrivals} arrivée${d.arrivals > 1 ? 's' : ''}`} />
                      )}
                      {d.departures > 0 && (
                        <span style={{ ...s.miniCalDot, background: '#0369a1' }} title={`${d.departures} départ${d.departures > 1 ? 's' : ''}`} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={s.miniCalLegend}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#15803d' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>Arrivée</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0369a1' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>Départ</span>
              </span>
            </div>
          </Link>
        </section>

        {/* ── État des lieux — 4 métriques ─────────────────────────────── */}
        <section style={s.section} className="fade-up d1">
          <EtatDesLieux
            prochainSejour={prochainSejour}
            revenusThisMois={revenusThisMois}
            revenusPrevMois={revenusPrevMois}
            totalReach={totalReach}
            joinedCount={joinedCount}
            totalGroupCount={communityGroups.length}
            urgentCount={actionsCount}
            today={today}
          />
        </section>

        {/* ── Action urgente ───────────────────────────────────────────── */}
        <section style={s.section} className="fade-up d2">
          <ActionUrgente
            unsignedContracts={unsignedContracts}
            pendingPayments={pendingPayments}
            today={today}
          />
        </section>

        {/* ── KPI strip secondaire ─────────────────────────────────────── */}
        <section style={s.section} className="fade-up d3">
          <div style={s.kpiStrip}>
            <KpiCard
              href="/dashboard/revenus"
              icon={<CurrencyEur size={18} weight="fill" />}
              color="#f59e0b" label="En attente"
              value={fmtEur(enAttente)} sub="paiements"
            />
            <KpiCard
              href="/dashboard/logements"
              icon={<House size={18} weight="fill" />}
              color="#60a5fa" label="Logements"
              value={String(logements)} sub={logements !== 1 ? 'actifs' : 'actif'}
            />
            <KpiCard
              href="/dashboard/calendrier"
              icon={<UsersThree size={18} weight="fill" />}
              color="#a78bfa" label="Voyageurs"
              value={String(voyageursAnnee)} sub={`en ${yearPfx}`}
            />
          </div>
        </section>

        {/* ── Résumé opérationnel ──────────────────────────────────────── */}
        {hasOpData && (
          <section style={s.section} className="fade-up d3">
            <div style={s.opGrid}>

              {(activeStays.length > 0 || weekArrivals.length > 0 || weekDepartures.length > 0) && (
                <div style={s.opCard} className="glass-card">
                  <div style={s.opCardHead}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CalendarBlank size={16} color="#10b981" weight="fill" />
                      <span style={s.opCardTitle}>Cette semaine</span>
                    </div>
                    <Link href="/dashboard/calendrier" style={s.opLink}>
                      Calendrier <ArrowRight size={12} />
                    </Link>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {activeStays.map(c => (
                      <div key={c.id} style={s.stayRow}>
                        <span style={{ ...s.badge, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>En cours</span>
                        <div style={s.stayInfo}>
                          <span style={s.stayName}>{c.logement_nom ?? 'Logement'}</span>
                          <span style={s.stayMeta}>jusqu&apos;au {fmtShort(c.date_depart ?? today)}</span>
                        </div>
                      </div>
                    ))}
                    {weekArrivals.map(c => {
                      const dta   = diffDays(today, c.date_arrivee)
                      const label = dta === 0 ? "Aujourd'hui" : dta === 1 ? 'Demain' : `Dans ${dta}j`
                      const color = dta === 0 ? '#10b981' : dta === 1 ? '#eab308' : '#60a5fa'
                      return (
                        <div key={c.id} style={s.stayRow}>
                          <span style={{ ...s.badge, background: color + '22', color }}>Arrivée · {label}</span>
                          <div style={s.stayInfo}>
                            <span style={s.stayName}>{c.logement_nom ?? 'Logement'}</span>
                            <span style={s.stayMeta}>
                              {fmtShort(c.date_arrivee)}{c.date_depart ? ` → ${fmtShort(c.date_depart)}` : ''}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    {weekDepartures.map(c => {
                      const dtd   = diffDays(today, c.date_depart!)
                      const label = dtd === 0 ? "Aujourd'hui" : dtd === 1 ? 'Demain' : `Dans ${dtd}j`
                      return (
                        <div key={c.id} style={s.stayRow}>
                          <span style={{ ...s.badge, background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>Départ · {label}</span>
                          <div style={s.stayInfo}>
                            <span style={s.stayName}>{c.logement_nom ?? 'Logement'}</span>
                            <span style={s.stayMeta}>{fmtShort(c.date_depart!)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {(unsignedContracts.length > 0 || pendingPayments.length > 0) && (
                <div style={s.opCard} className="glass-card">
                  <div style={s.opCardHead}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Warning size={16} color="#f97316" weight="fill" />
                      <span style={s.opCardTitle}>Actions requises</span>
                      <span style={s.countBadge}>{actionsCount}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {unsignedContracts.slice(0, 4).map(c => {
                      const dta     = diffDays(today, c.date_arrivee)
                      const urgency = dta <= 2 ? '#ef4444' : dta <= 7 ? '#f97316' : '#eab308'
                      return (
                        <Link key={c.id} href="/dashboard/calendrier" style={{ textDecoration: 'none' }}>
                          <div style={s.actionRow}>
                            <div style={{ ...s.dot, background: urgency }} />
                            <div style={s.stayInfo}>
                              <span style={s.stayName}>{c.logement_nom ?? 'Logement'}</span>
                              <span style={s.stayMeta}>Contrat non signé · Arrivée {fmtShort(c.date_arrivee)}</span>
                            </div>
                            <ArrowRight size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                          </div>
                        </Link>
                      )
                    })}
                    {pendingPayments.slice(0, 3).map(c => (
                      <Link key={c.id + '_p'} href="/dashboard/revenus" style={{ textDecoration: 'none' }}>
                        <div style={s.actionRow}>
                          <div style={{ ...s.dot, background: '#3b82f6' }} />
                          <div style={s.stayInfo}>
                            <span style={s.stayName}>{c.logement_nom ?? 'Logement'}</span>
                            <span style={s.stayMeta}>
                              Paiement en attente{c.montant_loyer ? ` · ${c.montant_loyer} €` : ''}
                            </span>
                          </div>
                          <CurrencyEur size={13} color="#3b82f6" style={{ flexShrink: 0 }} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
                      <strong style={{ color: '#dc2626' }}>{streakLearner}</strong> jour{streakLearner > 1 ? 's' : ''}
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
        {(latestNews ?? []).length > 0 && (
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
              {(latestNews ?? []).map(article => (
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

function KpiCard({ href, icon, color, label, value, sub }: {
  href: string; icon: React.ReactNode; color: string
  label: string; value: string; sub: string
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={s.kpiCard} className="kpi-hover">
        <div style={{ ...s.kpiIcon, color, background: color + '18', border: `1px solid ${color}35` }}>
          {icon}
        </div>
        <div style={s.kpiBody}>
          <span style={s.kpiLabel}>{label}</span>
          <span style={{ ...s.kpiValue, color }}>{value}</span>
          <span style={s.kpiSub}>{sub}</span>
        </div>
      </div>
    </Link>
  )
}

const CATEGORY_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  reglementation:      { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa', label: 'Réglementation' },
  fiscalite:           { bg: 'rgba(52,211,153,0.12)',  color: '#34d399', label: 'Fiscalité' },
  gites:               { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', label: 'Gîtes & Meublés' },
  'chambres-hotes':    { bg: 'rgba(236,72,153,0.12)',  color: '#ec4899', label: "Chambres d'hôtes" },
  conciergerie:        { bg: 'rgba(139,92,246,0.12)',  color: '#8b5cf6', label: 'Conciergeries' },
  'reservation-directe': { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Réserv. directe' },
  marche:              { bg: 'rgba(244,114,182,0.12)', color: '#f472b6', label: 'Marché' },
  communes:            { bg: 'rgba(100,116,139,0.12)', color: '#64748b', label: 'Communes' },
  plateformes:         { bg: 'rgba(251,146,60,0.12)',  color: '#fb923c', label: 'Plateformes OTA' },
  outils:              { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa', label: 'Outils & Tech' },
  general:             { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', label: 'Général' },
}

const NEWS_MONTHS = ['jan.','fév.','mar.','avr.','mai','juin','juil.','août','sep.','oct.','nov.','déc.']
function fmtNewsDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${parseInt(day)} ${NEWS_MONTHS[parseInt(m) - 1]} ${y}`
}

interface NewsArticle {
  id: string; title: string; summary: string
  source_url: string | null; category: string
  published_at: string | null; created_at: string
}

function NewsCard({ article }: { article: NewsArticle }) {
  const tc = CATEGORY_CONFIG[article.category] ?? CATEGORY_CONFIG.general
  const dateStr = article.published_at ?? article.created_at
  const shortDesc = article.summary.length > 110
    ? article.summary.slice(0, 110).trimEnd() + '…'
    : article.summary
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
    background: 'linear-gradient(135deg, rgba(0,76,63,0.22) 0%, rgba(255,213,107,0.04) 100%)',
    border: '1px solid rgba(255,213,107,0.12)', borderRadius: '20px',
    padding: 'clamp(24px,3vw,40px) clamp(24px,4vw,48px)', marginBottom: '24px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap',
  },
  welcomeSub:   { fontSize: '13px', color: 'var(--text-3)', marginBottom: '6px' },
  welcomeTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,2.5vw,36px)', fontWeight: 400, color: 'var(--text)', marginBottom: '10px' },
  welcomeDesc:  { fontSize: '14px', fontWeight: 300, color: 'var(--text-2)', maxWidth: '440px', lineHeight: 1.6 },
  statsRow:     { display: 'flex', alignItems: 'center', gap: '28px', flexShrink: 0 },
  stat:         { textAlign: 'center' },
  statVal:      { display: 'block', fontFamily: 'var(--font-fraunces), serif', fontSize: '40px', fontWeight: 400, color: 'var(--accent-text)', lineHeight: 1 },
  statLbl:      { display: 'block', fontSize: '11px', color: 'var(--text-3)', marginTop: '6px', letterSpacing: '0.3px' },
  statDivider:  { width: '1px', height: '44px', background: 'var(--border)' },

  section:      { marginBottom: '28px' },
  sectionTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', fontWeight: 400, color: 'var(--text)', margin: 0 },
  sectionHead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  seeAll:       { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 500, padding: '5px 10px', borderRadius: '8px', background: 'rgba(255,213,107,0.08)', border: '1px solid rgba(255,213,107,0.2)', transition: 'background 0.15s, border-color 0.15s' },

  // ── Quick actions ─────────────────────────────────────────────────────────
  quickStrip: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px',
  },
  quickItem: {
    display: 'flex', alignItems: 'center', gap: '11px',
    padding: '13px 16px', borderRadius: '12px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    textDecoration: 'none' as const, color: 'var(--text-2)',
    transition: 'border-color 0.15s, transform 0.15s, background 0.15s',
    fontSize: '13px', fontWeight: 600,
  },
  quickIcon: {
    width: '36px', height: '36px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  quickLabel: { color: 'var(--text)', fontSize: '13px', fontWeight: 600, lineHeight: 1.2 },

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

  // ── Mini-calendrier 14 jours ──────────────────────────────────────────────
  miniCalCard: {
    display: 'block', padding: '18px 20px', borderRadius: '14px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    textDecoration: 'none' as const, transition: 'border-color 0.15s',
  },
  miniCalHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '14px', flexWrap: 'wrap' as const, gap: '8px',
  },
  miniCalTitle: { fontSize: '12px', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase' as const, letterSpacing: '0.6px' },
  miniCalLink: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '12px', fontWeight: 600, color: 'var(--accent-text)',
  },
  miniCalGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(14, minmax(0, 1fr))',
    gap: '6px',
  },
  miniCalCell: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 4px', borderRadius: '8px',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    minHeight: '64px', minWidth: 0,
  },
  miniCalCellToday: {
    background: 'var(--accent-bg)', border: '1.5px solid var(--accent-border-2)',
  },
  miniCalDow: { fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.4px' },
  miniCalDay: { fontFamily: 'var(--font-fraunces), serif', fontSize: '15px', fontWeight: 500, lineHeight: 1, marginTop: '3px' },
  miniCalDots: { display: 'flex', gap: '2px', marginTop: '4px', minHeight: '7px' },
  miniCalDot: { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0 },
  miniCalLegend: { display: 'flex', gap: '14px', marginTop: '12px' },

  // KPI strip (secondary)
  kpiStrip: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' },
  kpiCard: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '18px 20px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', transition: 'border-color 0.15s, transform 0.15s',
    height: '100%',
  },
  kpiIcon: {
    width: '40px', height: '40px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  kpiBody:  { display: 'flex', flexDirection: 'column', gap: '1px' },
  kpiLabel: { fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.2px' },
  kpiValue: { fontSize: '22px', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.5px' },
  kpiSub:   { fontSize: '11px', color: 'var(--text-3)' },

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
