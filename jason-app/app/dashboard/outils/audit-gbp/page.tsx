import Link from 'next/link'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import AuditWizard from './AuditWizard'
import { MagnifyingGlass, Star, Camera, Megaphone, ChatCircleDots, Sparkle, IdentificationCard, Clock, ArrowRight, Lightning, FileCsv } from '@phosphor-icons/react/dist/ssr'

export const dynamic  = 'force-dynamic'
export const metadata = { title: 'Audit GBP — Jason Marinho' }

const PILLAR_ICONS = [
  { Icon: IdentificationCard, label: 'Identité',  color: '#60a5fa' },
  { Icon: Camera,             label: 'Photos',    color: '#a78bfa' },
  { Icon: Star,               label: 'Avis',      color: '#FFD56B' },
  { Icon: Megaphone,          label: 'Posts',     color: '#34d399' },
  { Icon: ChatCircleDots,     label: 'Q&A',       color: '#fb923c' },
  { Icon: Sparkle,            label: 'Attributs', color: '#f472b6' },
]

interface PageProps {
  searchParams: Promise<{ session?: string }>
}

export default async function AuditGbpPage({ searchParams }: PageProps) {
  const profile = await getProfile()
  const supabase = await createClient()
  const { session: requestedSessionId } = await searchParams

  // Récupère les 3 derniers audits du user
  const { data: pastAudits } = await supabase
    .from('audit_gbp_sessions')
    .select('id, started_at, completed_at, score_global, business_name')
    .eq('user_id', profile?.userId ?? '')
    .order('started_at', { ascending: false })
    .limit(3)

  // Si un session id est demandé (reprise de brouillon), on le charge
  let initialSession: {
    sessionId: string
    businessName: string
    city: string
    answers: Record<string, unknown>
  } | undefined

  if (requestedSessionId && profile?.userId) {
    const { data: draft } = await supabase
      .from('audit_gbp_sessions')
      .select('id, business_name, city, answers, completed_at')
      .eq('id', requestedSessionId)
      .eq('user_id', profile.userId)
      .is('completed_at', null)  // sécurité : on ne reprend pas un audit déjà terminé
      .maybeSingle()

    if (draft) {
      initialSession = {
        sessionId: draft.id,
        businessName: draft.business_name ?? '',
        city: draft.city ?? '',
        answers: (draft.answers ?? {}) as Record<string, unknown>,
      }
    }
  }

  return (
    <>
      <Header title="Audit GBP" userName={profile?.full_name ?? undefined} />
      <div style={s.page}>

        {/* ── Hero ── */}
        <div style={s.hero} className="fade-up">
          <div style={s.heroBadge}>
            <MagnifyingGlass size={13} color="#60a5fa" weight="fill" />
            Outil · Audit Google Business Profile
          </div>
          <h1 style={s.heroTitle}>
            Audite ta fiche Google Business<br />
            <em style={{ color: '#60a5fa', fontStyle: 'italic' }}>en 5 minutes.</em>
          </h1>
          <p style={s.heroDesc}>
            25 questions ciblées pour identifier les points faibles de ta fiche GBP
            et générer un plan d'action priorisé. 100% gratuit, aucun lien externe nécessaire.
          </p>

          <div style={s.pillarsRow}>
            {PILLAR_ICONS.map(({ Icon, label, color }) => (
              <div key={label} style={s.pillarChip}>
                <Icon size={14} color={color} weight="fill" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div style={s.heroMeta}>
            <span><Clock size={13} weight="fill" /> ~5 minutes</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span>25 questions</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span>Score sur 100</span>
          </div>
        </div>

        {/* ── Mode Express (CSV) — uniquement si pas de session en cours ── */}
        {!initialSession && (
          <Link href="/dashboard/outils/audit-gbp/import-csv" style={s.expressCard} className="fade-up">
            <div style={s.expressIcon}>
              <Lightning size={20} color="#FFD56B" weight="fill" />
            </div>
            <div style={s.expressBody}>
              <div style={s.expressBadge}>
                <FileCsv size={11} weight="fill" /> Audit Express · ~5 min
              </div>
              <div style={s.expressTitle}>Importe ton fichier CSV Google</div>
              <div style={s.expressDesc}>
                Exporte tes infos en 2 clics depuis Google Business Profile,
                et on pré-remplit 7 questions automatiquement.
              </div>
            </div>
            <ArrowRight size={16} color="#FFD56B" weight="bold" />
          </Link>
        )}

        {/* ── Wizard ── */}
        <div style={s.section} className="fade-up">
          <AuditWizard userId={profile?.userId ?? null} initialSession={initialSession} />
        </div>

        {/* ── Historique des audits ── */}
        {pastAudits && pastAudits.length > 0 && (
          <div style={s.history} className="fade-up">
            <h2 style={s.historyTitle}>Tes audits précédents</h2>
            <div style={s.historyList}>
              {pastAudits.map(a => (
                <Link
                  key={a.id}
                  href={a.completed_at
                    ? `/dashboard/outils/audit-gbp/resultats/${a.id}`
                    : `/dashboard/outils/audit-gbp?session=${a.id}`}
                  style={s.historyItem}
                >
                  <div style={s.historyItemLeft}>
                    <span style={s.historyDate}>
                      {new Date(a.started_at).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'long', year: 'numeric',
                      })}
                    </span>
                    {a.business_name && <span style={s.historyName}>{a.business_name}</span>}
                  </div>
                  <div style={s.historyRight}>
                    {a.completed_at ? (
                      <span style={{
                        ...s.historyScore,
                        background: scoreColor(a.score_global ?? 0) + '18',
                        color: scoreColor(a.score_global ?? 0),
                      }}>
                        {a.score_global}/100
                      </span>
                    ) : (
                      <span style={s.historyDraft}>Brouillon</span>
                    )}
                    <ArrowRight size={14} color="var(--text-muted)" weight="bold" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  )
}

function scoreColor(score: number): string {
  if (score >= 80) return '#34d399'
  if (score >= 60) return '#FFD56B'
  if (score >= 40) return '#fb923c'
  return '#ef4444'
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '960px' },

  hero: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    padding: 'clamp(24px,3vw,36px)',
    marginBottom: '20px',
  },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase',
    color: '#60a5fa', background: 'rgba(96,165,250,0.08)',
    border: '1px solid rgba(96,165,250,0.18)',
    borderRadius: '999px', padding: '4px 12px', marginBottom: '14px',
  },
  heroTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(22px,3vw,32px)',
    fontWeight: 400, color: 'var(--text)',
    marginBottom: '12px', marginTop: 0, lineHeight: 1.25,
  },
  heroDesc: {
    fontSize: '14px', lineHeight: 1.7,
    color: 'var(--text-2)', marginBottom: '20px',
    maxWidth: '600px',
  },
  pillarsRow: {
    display: 'flex', flexWrap: 'wrap' as const, gap: '8px',
    marginBottom: '18px',
  },
  pillarChip: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', fontWeight: 500,
    color: 'var(--text-2)',
    background: 'var(--bg-2, rgba(255,255,255,0.02))',
    border: '1px solid var(--border)',
    borderRadius: '999px', padding: '5px 11px',
  },
  heroMeta: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '12px', color: 'var(--text-3)', flexWrap: 'wrap' as const,
  },

  section: {
    marginBottom: '20px',
  },

  /* Mode Express */
  expressCard: {
    display: 'flex', alignItems: 'center', gap: '16px',
    padding: '18px 20px',
    background: 'linear-gradient(135deg, rgba(255,213,107,0.08), rgba(255,213,107,0.03))',
    border: '1px solid rgba(255,213,107,0.22)',
    borderRadius: '14px',
    textDecoration: 'none',
    marginBottom: '16px',
    transition: 'border-color 0.15s, transform 0.15s',
  },
  expressIcon: {
    width: '40px', height: '40px', borderRadius: '10px',
    background: 'rgba(255,213,107,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  expressBody: { flex: 1, minWidth: 0 },
  expressBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '10.5px', fontWeight: 700,
    letterSpacing: '0.7px', textTransform: 'uppercase' as const,
    color: '#FFD56B', marginBottom: '4px',
  },
  expressTitle: {
    fontSize: '14.5px', fontWeight: 600,
    color: 'var(--text)', marginBottom: '3px',
  },
  expressDesc: {
    fontSize: '12.5px', color: 'var(--text-2)',
    lineHeight: 1.55,
  },

  /* Historique */
  history: {
    marginTop: '20px',
  },
  historyTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '16px', fontWeight: 500,
    color: 'var(--text)', marginBottom: '12px', marginTop: 0,
  },
  historyList: {
    display: 'flex', flexDirection: 'column' as const, gap: '8px',
  },
  historyItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', textDecoration: 'none',
    transition: 'border-color 0.15s, transform 0.15s',
  },
  historyItemLeft: {
    display: 'flex', flexDirection: 'column' as const, gap: '2px',
  },
  historyDate: {
    fontSize: '13px', fontWeight: 500, color: 'var(--text)',
  },
  historyName: {
    fontSize: '11px', color: 'var(--text-3)',
  },
  historyRight: {
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  historyScore: {
    fontSize: '12px', fontWeight: 600,
    padding: '4px 10px', borderRadius: '999px',
  },
  historyDraft: {
    fontSize: '11px', color: 'var(--text-muted)',
    fontStyle: 'italic' as const,
  },
}
