'use client'

// Fiche membre de l'admin, refaite le 02/11/2026 (demande de Jason : « mieux
// comprendre tout ce qu'elle fait, où elle en est, ce qui peut bloquer…
// les notes ont beaucoup de place »). Ordre de lecture : qui est-ce et est-ce
// qu'elle revient (en-tête), où elle en est (parcours hôte et blocage), ce
// qu'elle utilise (modules), puis le reste (formations, espaces pros, notes,
// fil d'activité, communauté). Usage en nombres et dates seulement.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { sinceLabel, activityLevel } from '@/lib/admin/activity'
import { hostJourney, hostFeed, type HostUsage, type JourneyStep, type FeedItem } from '@/lib/admin/host-journey'
import {
  ArrowLeft, GraduationCap, Check, X, Note, EnvelopeSimple, ArrowClockwise, FacebookLogo,
  MagnifyingGlass, Briefcase, MapPin, FolderOpen, House, CalendarBlank, UsersThree, FileText,
  CreditCard, ChartLineUp, Warning, CheckCircle, Circle, CircleHalf, Lightbulb, Pencil, Copy,
  ClockCounterClockwise, BookmarkSimple, Flag, Bell, Compass, Sparkle, Lightning,
} from '@phosphor-icons/react/dist/ssr'
import { updateAdminNotes, changeUserPlan } from '../../actions'
import type { MemberProSpace } from '@/lib/admin/member-profile'
import MemberSpaces from './MemberSpaces'

// ── Types ──────────────────────────────────────────────────────────────────
interface MemberProfile {
  id: string
  email: string
  full_name: string | null
  role: string
  driing_status: string
  plan: string
  is_investor: boolean | null
  created_at: string
  admin_notes: string | null
}

interface UserFormation {
  id: string
  progress: number
  enrolled_at: string
  completed_at: string | null
  formation: { id: string; title: string; slug: string; duration: string | null; level: string | null } | null
}

interface MemberStats {
  voyageurs: number
  sejours: number
  favorites: number
  customizations: number
  signalements: number
  suggestions: number
  communityGroupsCount: number
  communityTotalReach: number
  auditsCount: number
  auditsCompleted: number
  auditsBestScore: number
}

interface CommunityGroup { id: string; name: string | null; member_count: number }
interface AuditSession { id: string; business_name: string | null; started_at: string; completed_at: string | null; score_global: number | null }
interface InvestorProject { id: string; nom: string; ville: string | null; pays: string; type_logement: string; prix_achat: number | null; mensualite: number | null; created_at: string }

interface Props {
  profile: MemberProfile
  formations: UserFormation[]
  stats: MemberStats
  community?: { joinedGroups: CommunityGroup[] }
  audits?: AuditSession[]
  investorProjects?: InvestorProject[]
  pros?: MemberProSpace[]
  proStats?: Record<string, React.ReactNode>
  host?: { logements: number; contrats: number }
  activity?: { lastSeenAt: string | null; lastAction: { at: string; label: string } | null }
  /** Usage de l'espace hôte (lib/admin/member-host-load.ts), null si la lecture a échoué */
  hostUsage?: HostUsage | null
  /** Provenance lisible (« Google », « Instagram »…) et page d'arrivée */
  provenance?: { label: string; detail: string | null; landing: string | null } | null
  newsletter?: boolean
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const TZ = { timeZone: 'Europe/Paris' } as const
const dateLong = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', ...TZ })
const dateShort = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', ...TZ })
const fmtEur = (n: number) => n.toLocaleString('fr-FR') + ' €'
const since = (iso: string | null) => sinceLabel(iso, new Date())
const lower = (t: string) => t.charAt(0).toLowerCase() + t.slice(1)
const formatReach = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace('.', ',')} M` : n >= 1_000 ? `${Math.round(n / 1_000)} k` : String(n)

const PLAN_CFG: Record<string, { label: string; color: string; bg: string; perYear: number }> = {
  driing:     { label: 'Membre Driing', color: '#B7791F', bg: 'color-mix(in srgb, #B7791F 12%, transparent)', perYear: 0 },
  standard:   { label: 'Standard',      color: 'var(--accent-text)', bg: 'var(--accent-bg)', perYear: 19.98 },
  decouverte: { label: 'Découverte',    color: 'var(--text-3)',      bg: 'var(--surface-2)', perYear: 0 },
}

const LEVEL = {
  actif:   { label: 'Vu cette semaine', color: '#2F9E5B' },
  tiede:   { label: 'À relancer', color: '#B7791F' },
  endormi: { label: 'Plus vu depuis 30 jours', color: '#A4502A' },
} as const

const STEP_ICON: Record<JourneyStep['key'], typeof House> = {
  logement: House, calendrier: CalendarBlank, reservations: ClockCounterClockwise, voyageurs: UsersThree,
  contrats: FileText, paiements: CreditCard, finances: ChartLineUp,
}
const STATE_STYLE: Record<JourneyStep['state'], { color: string; bg: string; border: string; label: string }> = {
  fait:     { color: 'var(--accent-text)', bg: 'var(--accent-bg)', border: '1px solid var(--accent-border-2)', label: 'Fait' },
  en_cours: { color: '#B7791F', bg: 'rgba(255,213,107,0.14)', border: '1px solid rgba(255,213,107,0.45)', label: 'En cours' },
  probleme: { color: '#A4502A', bg: 'color-mix(in srgb, #A4502A 9%, transparent)', border: '1px solid color-mix(in srgb, #A4502A 35%, transparent)', label: 'Problème' },
  a_faire:  { color: 'var(--text-muted)', bg: 'var(--surface)', border: '1px dashed var(--border-2)', label: 'À faire' },
}

// ── Main component ──────────────────────────────────────────────────────────
export default function MembreDetailUI({
  profile, formations, stats, community, audits, investorProjects, pros = [], host = { logements: 0, contrats: 0 },
  proStats, activity, hostUsage, provenance, newsletter,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [planFeedback, setPlanFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const planCfg = PLAN_CFG[profile.plan ?? 'decouverte'] ?? PLAN_CFG.decouverte
  const name = profile.full_name || profile.email
  const firstName = (profile.full_name ?? '').split(' ')[0] || 'ce membre'
  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile.email[0].toUpperCase()
  const level = LEVEL[activityLevel(activity?.lastSeenAt ?? null, new Date())]
  const memberDays = Math.max(0, Math.round((Date.now() - Date.parse(profile.created_at)) / 86_400_000))

  const journey = hostUsage ? hostJourney(hostUsage) : null
  const feedExtra: FeedItem[] = [
    ...formations.map(f => ({ label: `Formation : ${f.formation?.title ?? 'sans titre'}`, at: f.enrolled_at })),
    ...(audits ?? []).map(a => ({ label: 'Audit de fiche Google', at: a.started_at })),
  ]
  const feed = hostUsage ? hostFeed(hostUsage, feedExtra).slice(0, 8) : feedExtra.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8)
  const showSpaces = pros.length > 0 || !!profile.is_investor

  function handlePlanChange(newPlan: string) {
    startTransition(async () => {
      const res = await changeUserPlan(profile.id, newPlan)
      if (res.error) setPlanFeedback({ type: 'err', msg: String(res.error) })
      else { setPlanFeedback({ type: 'ok', msg: 'Formule mise à jour' }); router.refresh() }
      setTimeout(() => setPlanFeedback(null), 3000)
    })
  }

  function copyEmail() {
    navigator.clipboard?.writeText(profile.email).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  }

  return (
    <div style={s.page}>
      <button onClick={() => router.push('/dashboard/admin/membres')} style={s.backBtn}>
        <ArrowLeft size={15} /> Tous les membres
      </button>

      {/* ── En-tête : qui, comment elle est arrivée, est-ce qu'elle revient ── */}
      <header style={s.hero} className="fade-up">
        <div style={s.heroMain}>
          <div style={s.avatar}>
            <span style={s.avatarText}>{initials}</span>
            <i style={{ ...s.levelDot, background: level.color }} aria-hidden />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={s.name}>{name}</h1>
              <span style={{ ...s.pill, background: `color-mix(in srgb, ${level.color} 13%, transparent)`, color: level.color }}>
                <i style={{ width: 6, height: 6, borderRadius: 99, background: level.color, display: 'inline-block' }} /> {level.label}
              </span>
              {profile.role === 'admin' && <span style={{ ...s.pill, background: 'color-mix(in srgb, #B7791F 12%, transparent)', color: '#B7791F' }}>Admin</span>}
            </div>
            <div style={s.emailRow}>
              <a href={`mailto:${profile.email}`} style={s.emailLink}><EnvelopeSimple size={13} /> {profile.email}</a>
              <button type="button" onClick={copyEmail} style={s.iconBtn} aria-label="Copier l’adresse e-mail">
                {copied ? <Check size={13} weight="bold" /> : <Copy size={13} />}
              </button>
            </div>
            <div style={s.badges}>
              <span style={{ ...s.pill, background: planCfg.bg, color: planCfg.color }}><Lightning size={11} weight="fill" /> Hôte · {planCfg.label}</span>
              {pros.map(r => {
                const c = r.kind === 'photographe' ? '#B83A7C' : r.kind === 'depannage' ? '#A4502A' : '#6E5446'
                return (
                  <span key={r.id} style={{ ...s.pill, background: `color-mix(in srgb, ${c} 12%, transparent)`, color: c }}>
                    {r.kind === 'photographe' ? 'Photographe' : r.kind === 'depannage' ? 'Dépannage' : 'Équipe de ménage'}{r.tier === 'fondateur' ? ' · fondateur' : ''}
                  </span>
                )
              })}
              {profile.is_investor && <span style={{ ...s.pill, background: 'color-mix(in srgb, #6E5446 12%, transparent)', color: '#6E5446' }}><Briefcase size={11} weight="fill" /> Investisseur</span>}
              {newsletter && <span style={{ ...s.pill, background: 'var(--surface)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>Lettre Le Check-in</span>}
            </div>
          </div>
        </div>

        <div style={s.heroFacts}>
          <Fact label="Dernière visite" value={activity?.lastSeenAt ? since(activity.lastSeenAt) : 'Aucune visite'} sub={activity?.lastSeenAt ? dateShort(activity.lastSeenAt) : null} />
          <Fact label="Dernière action" value={activity?.lastAction ? activity.lastAction.label : 'Aucune'} sub={activity?.lastAction ? lower(since(activity.lastAction.at)) : null} />
          <Fact label="Membre depuis" value={memberDays < 1 ? 'Aujourd’hui' : `${memberDays} jour${memberDays > 1 ? 's' : ''}`} sub={dateShort(profile.created_at)} />
          <Fact
            label="Arrivée par"
            value={provenance?.label ?? 'Pas encore mesuré'}
            sub={[provenance?.detail, provenance?.landing ? `page ${provenance.landing}` : null].filter(Boolean).join(' · ') || null}
          />
          <div style={s.fact}>
            <span style={s.factLabel}>Formule hôte</span>
            {planFeedback ? (
              <span style={{ fontSize: 13, fontWeight: 600, color: planFeedback.type === 'ok' ? 'var(--accent-text)' : 'var(--danger)' }}>{planFeedback.msg}</span>
            ) : (
              <select
                value={profile.plan || 'decouverte'}
                disabled={isPending || profile.role === 'admin'}
                onChange={e => handlePlanChange(e.target.value)}
                style={{ ...s.planSelect, color: planCfg.color, opacity: profile.role === 'admin' ? 0.5 : 1 }}
                aria-label="Formule hôte"
              >
                <option value="decouverte">Découverte</option>
                <option value="standard">Standard · 19,98 € / an</option>
                <option value="driing">Membre Driing</option>
              </select>
            )}
          </div>
        </div>
      </header>

      {/* ── Où elle en est : parcours hôte ── */}
      {journey && (
        <section style={s.card} className="fade-up">
          <div style={s.cardHead}>
            <div>
              <h2 style={s.h2}>Où en est {firstName === 'ce membre' ? 'ce membre' : firstName}</h2>
              <p style={s.lead}>{journey.niveau} · {journey.done} étape{journey.done > 1 ? 's' : ''} sur {journey.steps.length} du parcours hôte</p>
            </div>
            <div style={s.progressOuter} aria-label={`${journey.done} sur ${journey.steps.length}`}>
              <div style={{ ...s.progressInner, width: `${(journey.done / journey.steps.length) * 100}%` }} />
            </div>
          </div>

          <ol style={s.steps}>
            {journey.steps.map(st => {
              const Icon = STEP_ICON[st.key]
              const ss = STATE_STYLE[st.state]
              const StateIcon = st.state === 'fait' ? CheckCircle : st.state === 'probleme' ? Warning : st.state === 'en_cours' ? CircleHalf : Circle
              return (
                <li key={st.key} style={{ ...s.step, background: ss.bg, border: ss.border }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <Icon size={18} weight="duotone" style={{ color: st.state === 'a_faire' ? 'var(--text-muted)' : ss.color }} />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 700, color: ss.color, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                      <StateIcon size={12} weight={st.state === 'a_faire' ? 'regular' : 'fill'} /> {ss.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: st.state === 'a_faire' ? 'var(--text-3)' : 'var(--text)', marginTop: 8 }}>{st.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.35 }}>{st.detail}</div>
                  {st.at && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }} suppressHydrationWarning>{since(st.at)}</div>}
                </li>
              )
            })}
          </ol>

          {journey.blocage ? (
            <div style={s.blocker}>
              <Warning size={20} weight="fill" style={{ color: '#B7791F', flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>Ce qui peut bloquer</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{journey.blocage.message}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 12.5, color: 'var(--text-3)', marginTop: 6 }}>
                  <Lightbulb size={14} style={{ flexShrink: 0, marginTop: 1, color: 'var(--accent-text)' }} /> {journey.blocage.conseil}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ ...s.blocker, background: 'var(--accent-bg)', border: '1px solid var(--accent-border-2)' }}>
              <CheckCircle size={20} weight="fill" style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}><strong style={{ color: 'var(--text)' }}>Rien ne bloque.</strong> Les étapes clés sont en place.</div>
            </div>
          )}
        </section>
      )}

      <div className="member-layout">
        {/* ── Colonne principale ── */}
        <div style={s.col}>
          {hostUsage && <HostModules u={hostUsage} />}

          {showSpaces && (
            <MemberSpaces
              plan={profile.plan || 'decouverte'}
              host={host}
              sejours={stats.sejours}
              voyageurs={stats.voyageurs}
              pros={pros}
              proStats={proStats}
              isInvestor={!!profile.is_investor}
              projects={(investorProjects ?? []).length}
            />
          )}

          <Formations formations={formations} />

          {profile.is_investor && <Investor projects={investorProjects ?? []} />}
        </div>

        {/* ── Colonne de droite ── */}
        <aside style={s.col}>
          <CoachingNotes memberId={profile.id} firstName={firstName} initial={profile.admin_notes ?? ''} />

          <section style={s.card} className="fade-up">
            <h2 style={{ ...s.h3, marginBottom: 12 }}><ClockCounterClockwise size={16} /> Fil d’activité</h2>
            {feed.length === 0 ? (
              <p style={s.empty}>Aucune action enregistrée pour le moment.</p>
            ) : (
              <ol style={s.feed}>
                {feed.map((f, i) => (
                  <li key={`${f.label}-${i}`} style={s.feedItem}>
                    <i style={{ ...s.feedDot, background: i === 0 ? 'var(--accent-text)' : 'var(--border-2)' }} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }} suppressHydrationWarning>{since(f.at)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <Community
            stats={stats}
            groups={community?.joinedGroups ?? []}
            audits={audits ?? []}
            notifications={hostUsage?.notifications ?? null}
          />
        </aside>
      </div>
    </div>
  )
}

// ── Petits blocs ────────────────────────────────────────────────────────────

function Fact({ label, value, sub }: { label: string; value: string; sub: string | null }) {
  return (
    <div style={s.fact}>
      <span style={s.factLabel}>{label}</span>
      <span style={s.factValue} suppressHydrationWarning>{value}</span>
      {sub && <span style={s.factSub} suppressHydrationWarning>{sub}</span>}
    </div>
  )
}

function Metric({ label, n, last, hint, warn }: { label: string; n: number | string; last?: string | null; hint?: string | null; warn?: boolean }) {
  const zero = n === 0 || n === 'Non'
  return (
    <div style={s.metric}>
      <span style={{ fontSize: 13, color: zero ? 'var(--text-muted)' : 'var(--text-2)', flex: 1, minWidth: 0 }}>
        {label}
        {hint && <span style={{ display: 'block', fontSize: 11.5, color: warn ? '#A4502A' : 'var(--text-muted)', marginTop: 1 }}>{hint}</span>}
      </span>
      <span style={{ textAlign: 'right' }}>
        <span style={{ display: 'block', fontFamily: 'var(--font-fraunces), serif', fontSize: 19, color: zero ? 'var(--text-muted)' : warn ? '#A4502A' : 'var(--text)', lineHeight: 1.1 }}>{n}</span>
        {last && <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }} suppressHydrationWarning>{lower(since(last))}</span>}
      </span>
    </div>
  )
}

function Module({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={s.module}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ ...s.moduleIcon, color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}>{icon}</span>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function HostModules({ u }: { u: HostUsage }) {
  return (
    <section style={s.card} className="fade-up">
      <div style={{ ...s.cardHead, marginBottom: 14 }}>
        <h2 style={s.h3}><House size={16} /> Utilisation de l’espace hôte</h2>
        <span style={s.privacy}>Nombres et dates seulement, jamais le contenu</span>
      </div>
      <div style={s.modules}>
        <Module icon={<House size={16} weight="duotone" />} title="Logements et calendrier" color="var(--accent-text)">
          <Metric label="Logements" n={u.logements.n} last={u.logements.last} />
          <Metric label="Calendriers connectés" n={u.calendriers.n} last={u.calendriers.last} hint={u.calendriers.enErreur > 0 ? `${u.calendriers.enErreur} en erreur de synchro` : null} warn={u.calendriers.enErreur > 0} />
          <Metric label="Réservations importées" n={u.reservationsImportees} />
          <Metric label="Événements ajoutés" n={u.evenements.n} last={u.evenements.last} />
        </Module>
        <Module icon={<UsersThree size={16} weight="duotone" />} title="Réservations et voyageurs" color="#6E5446">
          <Metric label="Séjours avec montant" n={u.sejours.n} last={u.sejours.last} />
          <Metric label="Fiches voyageurs" n={u.voyageurs.n} last={u.voyageurs.last} />
          <Metric label="Déclarations de voyageurs" n={u.declarations.n} last={u.declarations.last} />
        </Module>
        <Module icon={<FileText size={16} weight="duotone" />} title="Contrats et paiements" color="#B7791F">
          <Metric label="Contrats" n={u.contrats.n} last={u.contrats.last} hint={u.contrats.n > 0 ? `${u.contrats.signes} signé${u.contrats.signes > 1 ? 's' : ''}` : null} />
          <Metric
            label="Paiements en ligne"
            n={u.paiementsEnLigne === 'actif' ? 'Oui' : u.paiementsEnLigne === 'commence' ? 'En cours' : 'Non'}
            hint={u.paiementsEnLigne === 'commence' ? 'Inscription Stripe à terminer' : null}
            warn={u.paiementsEnLigne === 'commence'}
          />
        </Module>
        <Module icon={<ChartLineUp size={16} weight="duotone" />} title="Mes finances" color="#2F9E5B">
          <Metric label="Revenus saisis" n={u.revenus.n} last={u.revenus.last} />
          <Metric label="Charges saisies" n={u.charges.n} last={u.charges.last} hint={u.charges.recurrentes > 0 ? `dont ${u.charges.recurrentes} récurrente${u.charges.recurrentes > 1 ? 's' : ''}` : null} />
          <Metric label="Objectif annuel" n={u.objectif ? 'Oui' : 'Non'} />
        </Module>
      </div>
    </section>
  )
}

function Formations({ formations }: { formations: UserFormation[] }) {
  const [all, setAll] = useState(false)
  const done = formations.filter(f => f.progress >= 100).length
  const doing = formations.filter(f => f.progress > 0 && f.progress < 100).length
  const todo = formations.length - done - doing
  const avg = formations.length ? Math.round(formations.reduce((n, f) => n + Math.min(100, f.progress), 0) / formations.length) : 0
  // En cours d'abord (la plus avancée en premier), puis pas commencées, puis terminées
  const rank = (p: number) => p > 0 && p < 100 ? 0 : p === 0 ? 1 : 2
  const sorted = [...formations].sort((a, b) => rank(a.progress) - rank(b.progress) || b.progress - a.progress)
  const shown = all ? sorted : sorted.slice(0, 6)

  return (
    <section style={s.card} className="fade-up">
      <div style={{ ...s.cardHead, marginBottom: 14 }}>
        <h2 style={s.h3}><GraduationCap size={16} /> Formations</h2>
        {formations.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ ...s.pill, background: 'var(--accent-bg)', color: 'var(--accent-text)' }}>{done} terminée{done > 1 ? 's' : ''}</span>
            <span style={{ ...s.pill, background: 'rgba(255,213,107,0.16)', color: '#B7791F' }}>{doing} en cours</span>
            {todo > 0 && <span style={{ ...s.pill, background: 'var(--surface-2)', color: 'var(--text-3)' }}>{todo} pas commencée{todo > 1 ? 's' : ''}</span>}
            <span style={{ ...s.pill, background: 'var(--surface-2)', color: 'var(--text-2)' }}>{avg} % en moyenne</span>
          </div>
        )}
      </div>
      {formations.length === 0 ? (
        <p style={s.empty}>Aucune formation commencée.</p>
      ) : (
        <>
          <div style={s.formGrid}>
            {shown.map(uf => {
              const p = Math.min(100, uf.progress)
              const fini = p >= 100
              return (
                <div key={uf.id} style={s.formItem}>
                  <span style={{ ...s.formIcon, background: fini ? 'var(--accent-bg)' : 'rgba(255,213,107,0.14)' }}>
                    {fini ? <Check size={14} weight="bold" color="var(--accent-text)" /> : <GraduationCap size={14} color="#B7791F" />}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={uf.formation?.title ?? ''}>{uf.formation?.title ?? 'Formation inconnue'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <div style={s.bar}><div style={{ height: '100%', width: `${p}%`, borderRadius: 99, background: fini ? 'var(--accent-text)' : 'linear-gradient(90deg, var(--accent-text), #FFD56B)' }} /></div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: p === 0 ? 'var(--text-muted)' : 'var(--accent-text)', minWidth: 32, textAlign: 'right' }}>{p} %</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                      Inscription le {dateShort(uf.enrolled_at)}{uf.formation?.duration ? ` · ${uf.formation.duration}` : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {sorted.length > 6 && (
            <button type="button" onClick={() => setAll(v => !v)} style={s.linkBtn}>
              {all ? 'Voir moins' : `Voir les ${sorted.length} formations`}
            </button>
          )}
        </>
      )}
    </section>
  )
}

function CoachingNotes({ memberId, firstName, initial }: { memberId: string; firstName: string; initial: string }) {
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(initial)
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [pending, start] = useTransition()
  const long = notes.length > 280

  function save() {
    setError('')
    const prev = notes
    setNotes(draft); setEditing(false)
    start(async () => {
      const res = await updateAdminNotes(memberId, draft)
      if (res.error) { setNotes(prev); setDraft(draft); setEditing(true); setError(String(res.error)); return }
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    })
  }

  return (
    <section style={{ ...s.card, padding: 18 }} className="fade-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: notes || editing ? 10 : 0 }}>
        <h2 style={s.h3}><Note size={16} /> Notes <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>visibles par toi seul</span></h2>
        {!editing && (
          <button type="button" onClick={() => { setDraft(notes); setEditing(true) }} style={s.smallBtn}>
            <Pencil size={12} /> {notes ? 'Modifier' : 'Ajouter'}
          </button>
        )}
      </div>
      {saved && <div style={{ fontSize: 12, color: 'var(--accent-text)', marginBottom: 6, display: 'flex', gap: 4, alignItems: 'center' }}><Check size={12} weight="bold" /> Enregistré</div>}
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea
            value={draft} onChange={e => setDraft(e.target.value)} rows={4} autoFocus style={s.textarea}
            placeholder={`Objectifs de ${firstName}, ce qui a été dit, prochaine relance…`}
          />
          {error && <p style={{ fontSize: 12.5, color: 'var(--danger)', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setEditing(false); setError('') }} style={s.smallBtn} disabled={pending}><X size={12} /> Annuler</button>
            <button type="button" onClick={save} style={{ ...s.smallBtn, background: 'var(--accent-text)', color: 'var(--bg)', border: '1px solid var(--accent-text)' }} disabled={pending}>
              {pending ? <ArrowClockwise size={12} /> : <Check size={12} weight="bold" />} Enregistrer
            </button>
          </div>
        </div>
      ) : notes ? (
        <>
          <p style={{ ...s.notesText, ...(long && !expanded ? { display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : null) }}>{notes}</p>
          {long && <button type="button" onClick={() => setExpanded(v => !v)} style={s.linkBtn}>{expanded ? 'Réduire' : 'Tout lire'}</button>}
        </>
      ) : null}
    </section>
  )
}

function Community({ stats, groups, audits, notifications }: { stats: MemberStats; groups: CommunityGroup[]; audits: AuditSession[]; notifications: number | null }) {
  const rows: Array<{ icon: React.ReactNode; label: string; value: string; zero: boolean }> = [
    { icon: <FacebookLogo size={15} weight="fill" />, label: 'Groupes Facebook', value: stats.communityGroupsCount > 0 ? `${stats.communityGroupsCount} · ${formatReach(stats.communityTotalReach)} membres` : '0', zero: stats.communityGroupsCount === 0 },
    { icon: <MagnifyingGlass size={15} />, label: 'Audits fiche Google', value: stats.auditsCount > 0 ? `${stats.auditsCompleted}/${stats.auditsCount} finis${stats.auditsBestScore > 0 ? ` · ${stats.auditsBestScore}/100` : ''}` : '0', zero: stats.auditsCount === 0 },
    { icon: <BookmarkSimple size={15} />, label: 'Modèles de messages', value: `${stats.favorites} favori${stats.favorites > 1 ? 's' : ''} · ${stats.customizations} perso`, zero: stats.favorites + stats.customizations === 0 },
    { icon: <Flag size={15} />, label: 'Voyageurs signalés', value: String(stats.signalements), zero: stats.signalements === 0 },
    { icon: <Sparkle size={15} />, label: 'Idées proposées', value: String(stats.suggestions), zero: stats.suggestions === 0 },
    ...(notifications != null ? [{ icon: <Bell size={15} />, label: 'Notifications activées', value: notifications > 0 ? `${notifications} appareil${notifications > 1 ? 's' : ''}` : 'Non', zero: notifications === 0 }] : []),
  ]
  return (
    <section style={s.card} className="fade-up">
      <h2 style={{ ...s.h3, marginBottom: 10 }}><Compass size={16} /> Communauté et outils</h2>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rows.map(r => (
          <div key={r.label} style={s.toolRow}>
            <span style={{ color: r.zero ? 'var(--text-muted)' : 'var(--accent-text)', display: 'inline-flex' }}>{r.icon}</span>
            <span style={{ flex: 1, fontSize: 13, color: r.zero ? 'var(--text-muted)' : 'var(--text-2)' }}>{r.label}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: r.zero ? 'var(--text-muted)' : 'var(--text)', textAlign: 'right' }}>{r.value}</span>
          </div>
        ))}
      </div>
      {(groups.length > 0 || audits.length > 0) && (
        <details style={{ marginTop: 10 }}>
          <summary style={{ fontSize: 12.5, color: 'var(--text-3)', cursor: 'pointer' }}>Détail des groupes et des audits</summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {groups.map(g => (
              <div key={g.id} style={s.detailRow}><FacebookLogo size={13} weight="fill" color="#6E5446" /><span style={{ flex: 1 }}>{g.name ?? 'Groupe sans nom'}</span><span style={{ color: 'var(--text-muted)' }}>{formatReach(g.member_count ?? 0)}</span></div>
            ))}
            {audits.map(a => (
              <div key={a.id} style={s.detailRow}><MagnifyingGlass size={13} color="#B7791F" /><span style={{ flex: 1 }}>{a.business_name ?? 'Sans nom'} · {dateShort(a.started_at)}</span><span style={{ color: 'var(--text-muted)' }}>{a.completed_at ? `${a.score_global}/100` : 'Brouillon'}</span></div>
            ))}
          </div>
        </details>
      )}
    </section>
  )
}

function Investor({ projects }: { projects: InvestorProject[] }) {
  return (
    <section style={s.card} className="fade-up">
      <h2 style={{ ...s.h3, marginBottom: 12 }}><Briefcase size={16} /> Espace investisseur ({projects.length} projet{projects.length > 1 ? 's' : ''})</h2>
      {projects.length === 0 ? (
        <p style={s.empty}>N’a pas encore sauvegardé de projet d’acquisition depuis l’estimateur.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {projects.map(p => (
            <div key={p.id} style={s.detailRow}>
              <FolderOpen size={14} color="#6E5446" weight="fill" />
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ color: 'var(--text)' }}>{p.nom}</strong>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-3)', flexWrap: 'wrap', marginTop: 2 }}>
                  {p.ville && <><MapPin size={10} weight="fill" /> {p.ville} ·</>} {p.type_logement.toUpperCase()}
                  {p.prix_achat != null && <> · {fmtEur(p.prix_achat)}</>}{p.mensualite != null && <> · {fmtEur(p.mensualite)}/mois</>}
                </span>
              </span>
              <span style={{ color: 'var(--text-muted)' }}>{dateShort(p.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 16 },
  col: { display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 },
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-3)', padding: '4px 0', fontFamily: 'inherit' },

  hero: {
    display: 'flex', flexDirection: 'column', gap: 18, padding: 'clamp(18px, 2.4vw, 28px)', borderRadius: 22,
    background: 'linear-gradient(135deg, var(--accent-bg) 0%, rgba(99,214,131,0.10) 55%, rgba(255,213,107,0.14) 100%)',
    border: '1px solid var(--accent-border)',
  },
  heroMain: { display: 'flex', alignItems: 'flex-start', gap: 16 },
  avatar: { position: 'relative', width: 64, height: 64, flexShrink: 0, borderRadius: '50%', background: 'var(--surface)', border: '2px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 4px var(--accent-bg)' },
  avatarText: { fontFamily: 'var(--font-fraunces), serif', fontSize: 21, fontWeight: 600, color: 'var(--accent-text)' },
  levelDot: { position: 'absolute', right: 1, bottom: 1, width: 14, height: 14, borderRadius: 99, border: '2.5px solid var(--surface)' },
  name: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(22px, 2.6vw, 30px)', fontWeight: 400, color: 'var(--text)', margin: 0, lineHeight: 1.15, overflowWrap: 'anywhere' },
  emailRow: { display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 },
  emailLink: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-3)', textDecoration: 'none', overflowWrap: 'anywhere' },
  iconBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer' },
  badges: { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 },
  heroFacts: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 },
  fact: { display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 12px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 0 },
  factLabel: { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 },
  factValue: { fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  factSub: { fontSize: 11.5, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  planSelect: { marginTop: 2, background: 'transparent', border: 'none', padding: 0, fontSize: 14, fontWeight: 700, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' },

  pill: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap' },

  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 'clamp(16px, 2vw, 22px)' },
  cardHead: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 },
  h2: { fontFamily: 'var(--font-fraunces), serif', fontSize: 21, fontWeight: 400, color: 'var(--text)', margin: 0 },
  h3: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 700, color: 'var(--text)', margin: 0 },
  lead: { margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' },
  privacy: { fontSize: 11.5, color: 'var(--text-muted)' },
  empty: { fontSize: 13, color: 'var(--text-muted)', margin: 0 },

  progressOuter: { width: 'min(220px, 100%)', height: 8, borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', overflow: 'hidden' },
  progressInner: { height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, var(--accent-text), #FFD56B)' },
  steps: { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 },
  step: { padding: '12px 12px 11px', borderRadius: 14, minWidth: 0 },
  blocker: { display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 14, padding: '13px 15px', borderRadius: 14, background: 'rgba(255,213,107,0.14)', border: '1px solid rgba(255,213,107,0.5)' },

  modules: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 10 },
  module: { padding: '12px 14px', borderRadius: 14, background: 'var(--bg-2)', border: '1px solid var(--border)' },
  moduleIcon: { width: 28, height: 28, borderRadius: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  metric: { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: '1px solid var(--border)' },

  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 },
  formItem: { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '11px 12px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-2)', minWidth: 0 },
  formIcon: { width: 28, height: 28, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bar: { flex: 1, height: 5, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' },
  linkBtn: { marginTop: 10, background: 'none', border: 'none', padding: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--accent-text)', cursor: 'pointer', fontFamily: 'inherit' },

  smallBtn: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  textarea: { width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', fontSize: 13.5, color: 'var(--text)', lineHeight: 1.6, fontFamily: 'inherit', resize: 'vertical', outline: 'none' },
  notesText: { fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' },

  feed: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' },
  feedItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' },
  feedDot: { width: 8, height: 8, borderRadius: 99, flexShrink: 0 },

  toolRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' },
  detailRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-2)', padding: '7px 10px', borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--border)' },
}
