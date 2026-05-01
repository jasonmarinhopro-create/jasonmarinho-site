import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, ArrowRight, CheckCircle, Lightning, Trophy, Sparkle } from '@phosphor-icons/react/dist/ssr'
import {
  PILLARS,
  QUESTIONS,
  computeGlobalScore,
  getTopActions,
  type AnswerValue,
  type PillarId,
} from '@/lib/audit-gbp/questions'

export const dynamic  = 'force-dynamic'
export const metadata = { title: 'Résultats audit GBP, Jason Marinho' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AuditResultsPage({ params }: PageProps) {
  const { id } = await params
  const profile = await getProfile()
  if (!profile?.userId) redirect('/login')

  const supabase = await createClient()
  const { data: session, error } = await supabase
    .from('audit_gbp_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', profile.userId)
    .maybeSingle()

  if (error || !session) notFound()
  if (!session.completed_at) {
    redirect('/dashboard/audit-gbp')
  }

  const answers = (session.answers ?? {}) as Record<string, AnswerValue>
  const { score, pillars } = computeGlobalScore(answers)
  const topActions = getTopActions(answers, 5)

  const { label: scoreLabel, color: scoreColor } = getScoreLabel(score)

  return (
    <>
      <div style={s.page}>

        {/* Retour */}
        <Link href="/dashboard/audit-gbp" style={s.back}>
          <ArrowLeft size={14} weight="bold" /> Retour à l'audit
        </Link>

        {/* Score global */}
        <div style={s.scoreCard} className="fade-up">
          <div style={s.scoreLeft}>
            <div style={{ ...s.scoreBig, color: scoreColor }}>
              {score}<span style={s.scoreOver}>/100</span>
            </div>
            <div style={{ ...s.scoreLabel, color: scoreColor }}>{scoreLabel}</div>
            {session.business_name && (
              <div style={s.scoreBiz}>
                {session.business_name}
                {session.city && <span style={{ opacity: 0.5 }}> · {session.city}</span>}
              </div>
            )}
            <div style={s.scoreDate}>
              Audité le {new Date(session.completed_at).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </div>
          </div>

          <div style={s.scoreRing}>
            <ScoreRing pct={score} color={scoreColor} />
          </div>
        </div>

        {/* Sous-scores par pilier */}
        <div style={s.section} className="fade-up">
          <h2 style={s.sectionTitle}>
            <Sparkle size={15} color="var(--text-3)" weight="fill" /> Score détaillé par pilier
          </h2>
          <div style={s.pillarsGrid}>
            {PILLARS.map(p => {
              const r = pillars[p.id]
              if (!r) return null
              return (
                <div key={p.id} style={s.pillarCard}>
                  <div style={s.pillarCardHead}>
                    <span style={{ ...s.pillarDot, background: p.color }} />
                    <span style={s.pillarCardLabel}>{p.label}</span>
                    <span style={{ ...s.pillarCardPct, color: p.color }}>{r.pct}%</span>
                  </div>
                  <div style={s.pillarBar}>
                    <div style={{
                      ...s.pillarBarFill,
                      width: `${r.pct}%`,
                      background: p.color,
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top 5 actions */}
        <div style={s.section} className="fade-up">
          <h2 style={s.sectionTitle}>
            <Lightning size={15} color="#FFD56B" weight="fill" /> Top 5 actions prioritaires
          </h2>
          <p style={s.sectionDesc}>
            Classées par impact attendu sur ton classement Google Maps. Commence par celle du haut.
          </p>

          {topActions.length === 0 ? (
            <div style={s.empty}>
              <Trophy size={28} color="#34d399" weight="fill" />
              <p style={s.emptyText}>Bravo ! Ta fiche est déjà optimisée à fond. Continue comme ça.</p>
            </div>
          ) : (
            <div style={s.actionsList}>
              {topActions.map((item, idx) => (
                <div key={item.question.id} style={s.actionCard}>
                  <div style={{ ...s.actionRank, background: item.pillar.color + '18', color: item.pillar.color }}>
                    #{idx + 1}
                  </div>
                  <div style={s.actionContent}>
                    <div style={s.actionHead}>
                      <span style={{ ...s.actionPillar, color: item.pillar.color }}>
                        {item.pillar.label}
                      </span>
                      <span style={s.actionImpact}>
                        Impact +{Math.round(item.impact)}pts
                      </span>
                    </div>
                    <div style={s.actionLabel}>{item.question.label}</div>
                    <div style={s.actionTip}>{item.question.actionIfMissing}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA final */}
        <div style={s.cta} className="fade-up">
          <h3 style={s.ctaTitle}>Tu veux aller plus loin ?</h3>
          <p style={s.ctaText}>
            Notre formation Google My Business pour la LCD couvre chacun de ces 6 piliers
            en détail, avec des templates de réponses, une checklist de photos et un
            calendrier de posts pré-rédigés.
          </p>
          <Link href="/dashboard/formations/google-my-business-lcd" style={s.ctaBtn}>
            Voir la formation GMB <ArrowRight size={14} weight="bold" />
          </Link>
        </div>

        {/* Refaire l'audit */}
        <div style={s.redoBlock}>
          <Link href="/dashboard/audit-gbp" style={s.redoLink}>
            Refaire un audit dans 3 mois
          </Link>
          <span style={s.redoNote}>
            Idéal pour mesurer tes progrès. On garde un historique.
          </span>
        </div>

      </div>
    </>
  )
}

// ─── Score label helper ───
function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 85) return { label: 'Excellent, fiche optimisée', color: '#34d399' }
  if (score >= 70) return { label: 'Bon niveau, quelques détails à régler', color: '#10b981' }
  if (score >= 50) return { label: 'Correct, marge de progression nette', color: '#FFD56B' }
  if (score >= 30) return { label: 'Faible, beaucoup à faire', color: '#fb923c' }
  return { label: 'Critique, fiche peu visible', color: '#ef4444' }
}

// ─── Composant SVG Score Ring ───
function ScoreRing({ pct, color }: { pct: number; color: string }) {
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <svg width={120} height={120} viewBox="0 0 120 120">
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth="8"
      />
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dashoffset 0.6s' }}
      />
    </svg>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },

  back: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', color: 'var(--text-2)',
    textDecoration: 'none', marginBottom: '16px',
    padding: '6px 0',
  },

  /* Score card */
  scoreCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '20px', padding: 'clamp(24px,3vw,36px)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '24px', flexWrap: 'wrap' as const,
    marginBottom: '20px',
  },
  scoreLeft: {
    display: 'flex', flexDirection: 'column' as const, gap: '6px',
    flex: 1, minWidth: '200px',
  },
  scoreBig: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(48px,7vw,72px)',
    fontWeight: 400, lineHeight: 1,
  },
  scoreOver: { fontSize: '0.4em', color: 'var(--text-3)', fontWeight: 300 },
  scoreLabel: { fontSize: '14px', fontWeight: 600 },
  scoreBiz: { fontSize: '14px', color: 'var(--text-2)', marginTop: '6px' },
  scoreDate: { fontSize: '12px', color: 'var(--text-3)' },
  scoreRing: { flexShrink: 0 },

  /* Section */
  section: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '24px',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '17px', fontWeight: 500,
    color: 'var(--text)', margin: '0 0 6px',
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  sectionDesc: {
    fontSize: '12px', color: 'var(--text-3)',
    marginBottom: '16px', lineHeight: 1.5,
  },

  /* Pillars grid */
  pillarsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px', marginTop: '12px',
  },
  pillarCard: {
    padding: '12px 14px',
    background: 'var(--bg-2, rgba(255,255,255,0.02))',
    border: '1px solid var(--border)',
    borderRadius: '10px',
  },
  pillarCardHead: {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginBottom: '8px',
  },
  pillarDot: {
    width: '8px', height: '8px', borderRadius: '50%',
    flexShrink: 0,
  },
  pillarCardLabel: {
    flex: 1, fontSize: '13px', fontWeight: 500,
    color: 'var(--text)',
  },
  pillarCardPct: {
    fontSize: '13px', fontWeight: 700,
  },
  pillarBar: {
    height: '4px', background: 'var(--border)',
    borderRadius: '999px', overflow: 'hidden',
  },
  pillarBarFill: {
    height: '100%', borderRadius: '999px',
    transition: 'width 0.6s',
  },

  /* Actions list */
  actionsList: {
    display: 'flex', flexDirection: 'column' as const, gap: '10px',
  },
  actionCard: {
    display: 'flex', gap: '14px',
    padding: '14px 16px',
    background: 'var(--bg-2, rgba(255,255,255,0.02))',
    border: '1px solid var(--border)',
    borderRadius: '12px',
  },
  actionRank: {
    width: '36px', height: '36px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: 700,
    flexShrink: 0,
  },
  actionContent: { flex: 1, minWidth: 0 },
  actionHead: {
    display: 'flex', alignItems: 'center', gap: '10px',
    marginBottom: '4px',
    flexWrap: 'wrap' as const,
  },
  actionPillar: {
    fontSize: '10.5px', fontWeight: 700,
    letterSpacing: '0.6px', textTransform: 'uppercase' as const,
  },
  actionImpact: {
    fontSize: '10.5px', fontWeight: 600,
    color: 'var(--text-3)',
  },
  actionLabel: {
    fontSize: '13px', fontWeight: 500,
    color: 'var(--text)', marginBottom: '6px',
    lineHeight: 1.5,
  },
  actionTip: {
    fontSize: '12.5px', color: 'var(--text-2)',
    lineHeight: 1.65,
  },

  /* Empty */
  empty: {
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', gap: '10px',
    padding: '24px', textAlign: 'center' as const,
  },
  emptyText: {
    fontSize: '14px', color: 'var(--text-2)',
    margin: 0, maxWidth: '320px', lineHeight: 1.6,
  },

  /* CTA formation */
  cta: {
    background: 'linear-gradient(135deg, rgba(96,165,250,0.08), rgba(167,139,250,0.04))',
    border: '1px solid rgba(96,165,250,0.18)',
    borderRadius: '16px', padding: '24px',
    marginBottom: '16px',
  },
  ctaTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '17px', fontWeight: 500,
    color: 'var(--text)', margin: '0 0 8px',
  },
  ctaText: {
    fontSize: '13px', color: 'var(--text-2)',
    lineHeight: 1.7, marginBottom: '14px',
  },
  ctaBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    background: '#60a5fa', color: '#0a1628',
    fontWeight: 700, fontSize: '13px',
    padding: '10px 18px', borderRadius: '10px',
    textDecoration: 'none',
  },

  /* Refaire */
  redoBlock: {
    display: 'flex', flexDirection: 'column' as const, gap: '4px',
    padding: '16px', textAlign: 'center' as const,
  },
  redoLink: {
    fontSize: '13px', fontWeight: 600,
    color: '#60a5fa', textDecoration: 'none',
  },
  redoNote: { fontSize: '11px', color: 'var(--text-3)' },
}
