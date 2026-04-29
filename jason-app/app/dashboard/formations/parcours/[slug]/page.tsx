import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, GraduationCap, Clock, CheckCircle, BookOpen, Compass } from '@phosphor-icons/react/dist/ssr'
import { getParcoursBySlug, PARCOURS_LEVEL_LABELS } from '@/lib/formations/parcours'
import TitleSetter from '@/components/layout/TitleSetter'

export default async function ParcoursDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const parcours = getParcoursBySlug(slug)
  if (!parcours) notFound()

  const profile = await getProfile()
  if (!profile) return null

  const supabase = await createClient()
  const [{ data: formations }, { data: userFormations }] = await Promise.all([
    supabase
      .from('formations')
      .select('id, slug, title, description, duration, level, lessons_count')
      .in('slug', parcours.formations)
      .eq('is_published', true),
    supabase
      .from('user_formations')
      .select('formation_id, progress')
      .eq('user_id', profile.userId),
  ])

  const formationsBySlug = Object.fromEntries((formations ?? []).map(f => [f.slug, f]))
  const progressByFormationId = Object.fromEntries((userFormations ?? []).map(uf => [uf.formation_id, uf.progress]))

  // Données ordonnées selon le parcours
  const orderedFormations = parcours.formations
    .map(slug => formationsBySlug[slug])
    .filter(Boolean)

  const completedCount = orderedFormations.filter(f => progressByFormationId[f.id] === 100).length
  const overallPct = orderedFormations.length > 0 ? Math.round((completedCount / orderedFormations.length) * 100) : 0

  return (
    <>
      <TitleSetter title={parcours.title} />
      <div style={s.page}>
        <Link href="/dashboard/formations/parcours" style={s.backLink}>
          <ArrowLeft size={14} weight="bold" />
          Tous les parcours
        </Link>

        {/* Hero */}
        <div style={s.hero}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <span style={s.heroEmoji}>{parcours.emoji}</span>
            <span style={s.heroLevel}>{PARCOURS_LEVEL_LABELS[parcours.level]}</span>
          </div>
          <h1 style={s.heroTitle}>{parcours.title}</h1>
          <p style={s.heroDesc}>{parcours.description}</p>
          <div style={s.heroMeta}>
            <span style={s.heroMetaItem}>
              <GraduationCap size={14} weight="fill" />
              {orderedFormations.length} formations
            </span>
            <span style={s.heroMetaItem}>
              <Clock size={14} weight="fill" />
              {parcours.duration}
            </span>
            <span style={{ ...s.heroMetaItem, color: 'var(--accent-text)' }}>
              <Compass size={14} weight="fill" />
              Pour qui : {parcours.forWho}
            </span>
          </div>

          {/* Progression globale */}
          <div style={s.heroProgress}>
            <div style={s.heroProgressBar}>
              <div style={{ ...s.heroProgressFill, width: `${overallPct}%` }} />
            </div>
            <span style={s.heroProgressText}>
              {completedCount} / {orderedFormations.length} formations terminées · <strong>{overallPct}%</strong>
            </span>
          </div>
        </div>

        {/* Liste ordonnée des formations */}
        <h2 style={s.sectionTitle}>Suis ces formations dans cet ordre</h2>
        <div style={s.list}>
          {orderedFormations.map((f, i) => {
            const progress = progressByFormationId[f.id] ?? 0
            const isDone = progress === 100
            const isInProgress = progress > 0 && progress < 100
            return (
              <Link key={f.id} href={`/dashboard/formations/${f.slug}`} style={{ ...s.formationCard, opacity: isDone ? 0.85 : 1 }}>
                <div style={{ ...s.stepNumber, background: isDone ? '#10b981' : isInProgress ? 'var(--accent-text)' : 'var(--surface-2)', color: isDone || isInProgress ? 'var(--bg)' : 'var(--text-muted)' }}>
                  {isDone ? <CheckCircle size={14} weight="fill" /> : i + 1}
                </div>
                <div style={s.formationBody}>
                  <div style={s.formationTop}>
                    <span style={s.formationTitle}>{f.title}</span>
                    {isDone && <span style={s.doneBadge}>✓ Terminée</span>}
                    {isInProgress && <span style={s.inProgressBadge}>{progress}%</span>}
                  </div>
                  <p style={s.formationDesc}>{f.description?.slice(0, 140)}{(f.description?.length ?? 0) > 140 ? '…' : ''}</p>
                  <div style={s.formationMeta}>
                    <span><Clock size={11} weight="fill" /> {f.duration}</span>
                    <span><BookOpen size={11} weight="fill" /> {f.lessons_count} leçons</span>
                  </div>
                  {isInProgress && (
                    <div style={s.miniProgressBar}>
                      <div style={{ ...s.miniProgressFill, width: `${progress}%` }} />
                    </div>
                  )}
                </div>
                <ArrowRight size={14} weight="bold" color="var(--text-muted)" style={{ flexShrink: 0 }} />
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '900px' },
  backLink: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', textDecoration: 'none', marginBottom: '20px' },

  hero: { background: 'var(--surface)', border: '1px solid var(--accent-border)', borderRadius: '18px', padding: 'clamp(20px,3vw,32px)', marginBottom: '28px' },
  heroEmoji: { fontSize: '40px' },
  heroLevel: { fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', padding: '4px 12px', background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)', borderRadius: '100px' },
  heroTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 400, color: 'var(--text)', margin: '0 0 10px' },
  heroDesc: { fontSize: '15px', color: 'var(--text-2)', margin: '0 0 14px', lineHeight: 1.6 },
  heroMeta: { display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' },
  heroMetaItem: { display: 'inline-flex', alignItems: 'center', gap: '5px' },
  heroProgress: { display: 'flex', flexDirection: 'column' as const, gap: '6px', paddingTop: '14px', borderTop: '1px dashed var(--border)' },
  heroProgressBar: { height: '8px', background: 'var(--surface-2)', borderRadius: '5px', overflow: 'hidden' as const },
  heroProgressFill: { height: '100%', background: 'linear-gradient(90deg, var(--accent-text), #34D399)', borderRadius: '5px', transition: 'width 0.4s' },
  heroProgressText: { fontSize: '12.5px', color: 'var(--text-2)' },

  sectionTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', fontWeight: 500, color: 'var(--text)', margin: '0 0 14px' },
  list: { display: 'flex', flexDirection: 'column' as const, gap: '10px' },

  formationCard: { display: 'flex', gap: '14px', alignItems: 'center', padding: '16px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', textDecoration: 'none' as const, color: 'var(--text-2)' },
  stepNumber: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif', flexShrink: 0 },
  formationBody: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  formationTop: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const },
  formationTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--text)' },
  doneBadge: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.4px', padding: '2px 8px', background: 'rgba(16,185,129,0.10)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '100px' },
  inProgressBadge: { fontSize: '10px', fontWeight: 700, padding: '2px 8px', background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)', borderRadius: '100px' },
  formationDesc: { fontSize: '12.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 },
  formationMeta: { display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' },
  miniProgressBar: { height: '4px', background: 'var(--surface-2)', borderRadius: '2px', overflow: 'hidden' as const, marginTop: '4px' },
  miniProgressFill: { height: '100%', background: 'var(--accent-text)', borderRadius: '2px' },
}
