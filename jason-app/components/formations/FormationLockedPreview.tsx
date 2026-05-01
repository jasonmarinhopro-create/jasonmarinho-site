import Link from 'next/link'
import { Lock, Star, Users, Clock, BookOpen, GraduationCap, ArrowRight, Check } from '@phosphor-icons/react/dist/ssr'

interface Module {
  title: string
  duration?: string
  lessons?: Array<{ title: string; duration?: string }>
}

interface Props {
  formationTitle: string
  formationDescription: string
  formationDuration: string
  formationLevel: string
  modules?: Module[]
  objectifs?: string[]
  // Social proof (optionnels, peut être 0)
  enrolledCount?: number
  completedCount?: number
  reviewsCount?: number
  averageRating?: number | null
  reviews?: Array<{ rating: number; comment: string | null; display_name: string | null }>
}

export default function FormationLockedPreview(props: Props) {
  const totalLessons = (props.modules ?? []).reduce(
    (sum, m) => sum + (m.lessons?.length ?? 0),
    0,
  )

  return (
    <div style={s.page}>
      {/* Hero locked */}
      <div style={s.hero}>
        <div style={s.lockBadge}>
          <Lock size={11} weight="duotone" />
          Formation Standard
        </div>
        <h1 style={s.heroTitle}>{props.formationTitle}</h1>
        <p style={s.heroDesc}>{props.formationDescription}</p>

        <div style={s.heroMeta}>
          <span style={s.metaChip}>
            <Clock size={13} weight="fill" color="var(--accent-text)" />
            {props.formationDuration}
          </span>
          <span style={s.metaChip}>
            <BookOpen size={13} weight="fill" color="var(--accent-text)" />
            {(props.modules ?? []).length} modules · {totalLessons} leçons
          </span>
          <span style={s.metaChip}>
            <GraduationCap size={13} weight="fill" color="var(--accent-text)" />
            {props.formationLevel}
          </span>
        </div>

        {/* CTA principal */}
        <Link href="/dashboard/abonnement" style={s.ctaPrimary}>
          Débloquer cette formation, 1,98 €/mois
          <ArrowRight size={14} weight="bold" />
        </Link>

        {/* Social proof, stats globales */}
        {((props.enrolledCount ?? 0) > 0 || (props.reviewsCount ?? 0) > 0) && (
          <div style={s.socialProof}>
            {(props.enrolledCount ?? 0) > 0 && (
              <span style={s.socialItem}>
                <Users size={13} weight="fill" />
                <strong>{props.enrolledCount}</strong> membre{(props.enrolledCount ?? 0) > 1 ? 's' : ''} ont commencé
              </span>
            )}
            {(props.completedCount ?? 0) > 0 && (
              <span style={s.socialItem}>
                <Check size={13} weight="bold" />
                <strong>{props.completedCount}</strong> ont terminé
              </span>
            )}
            {props.averageRating !== null && props.averageRating !== undefined && (
              <span style={s.socialItem}>
                <Star size={13} weight="fill" color="#fbbf24" />
                <strong>{props.averageRating.toFixed(1)}/5</strong>
                {(props.reviewsCount ?? 0) > 0 && ` (${props.reviewsCount} avis)`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Ce que tu vas apprendre */}
      {props.objectifs && props.objectifs.length > 0 && (
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Ce que tu vas apprendre</h2>
          <ul style={s.objectifsList}>
            {props.objectifs.map((obj, i) => (
              <li key={i} style={s.objectifItem}>
                <Check size={13} weight="bold" color="#10b981" style={{ flexShrink: 0, marginTop: '3px' }} />
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sommaire complet, accessible en preview */}
      {props.modules && props.modules.length > 0 && (
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Programme complet</h2>
          <div style={s.modulesList}>
            {props.modules.map((m, i) => (
              <div key={i} style={s.moduleCard}>
                <div style={s.moduleHead}>
                  <span style={s.moduleNumber}>{i + 1}</span>
                  <span style={s.moduleTitle}>{m.title}</span>
                  {m.duration && <span style={s.moduleDuration}>{m.duration}</span>}
                </div>
                {m.lessons && m.lessons.length > 0 && (
                  <ul style={s.lessonsList}>
                    {m.lessons.map((l, j) => (
                      <li key={j} style={s.lessonItem}>
                        <Lock size={9} weight="duotone" color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        <span style={s.lessonTitle}>{l.title}</span>
                        {l.duration && <span style={s.lessonDuration}>{l.duration}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Avis utilisateurs */}
      {props.reviews && props.reviews.length > 0 && (
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Ce que pensent les apprenants</h2>
          <div style={s.reviewsList}>
            {props.reviews.slice(0, 3).map((r, i) => (
              <div key={i} style={s.reviewCard}>
                <div style={s.reviewStars}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      size={14}
                      weight={j < r.rating ? 'fill' : 'regular'}
                      color={j < r.rating ? '#fbbf24' : 'var(--text-muted)'}
                    />
                  ))}
                </div>
                {r.comment && <p style={s.reviewComment}>« {r.comment} »</p>}
                {r.display_name && <span style={s.reviewAuthor}>- {r.display_name}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA final */}
      <div style={s.ctaFinal}>
        <h2 style={s.ctaFinalTitle}>Prêt à démarrer ?</h2>
        <p style={s.ctaFinalDesc}>
          Accède à <strong>cette formation</strong> et aux <strong>15 autres</strong> à vie pour 1,98 €/mois.
          Annulable à tout moment.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const, justifyContent: 'center' }}>
          <Link href="/dashboard/abonnement" style={s.ctaPrimary}>
            Passer en Standard <ArrowRight size={14} weight="bold" />
          </Link>
          <Link href="/dashboard/formations" style={s.ctaSecondary}>
            Voir mes 2 formations gratuites
          </Link>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '900px' },
  hero: { background: 'var(--surface)', border: '1px solid var(--accent-border)', borderRadius: '20px', padding: 'clamp(20px,3vw,32px)', marginBottom: '24px' },
  lockBadge: { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', padding: '4px 10px', background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)', borderRadius: '100px', marginBottom: '14px' },
  heroTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 400, color: 'var(--text)', margin: '0 0 10px', lineHeight: 1.25 },
  heroDesc: { fontSize: '15px', color: 'var(--text-2)', margin: '0 0 18px', lineHeight: 1.6 },
  heroMeta: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px', marginBottom: '20px' },
  metaChip: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', fontSize: '12px', fontWeight: 500, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '100px', color: 'var(--text-2)' },

  ctaPrimary: { display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '12px 22px', fontSize: '14px', fontWeight: 700, color: 'var(--bg)', background: 'var(--accent-text)', borderRadius: '11px', textDecoration: 'none' as const },
  ctaSecondary: { display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '12px 18px', fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '11px', textDecoration: 'none' as const },

  socialProof: { display: 'flex', flexWrap: 'wrap' as const, gap: '16px', marginTop: '18px', paddingTop: '14px', borderTop: '1px dashed var(--border)' },
  socialItem: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-2)' },

  section: { marginBottom: '24px' },
  sectionTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '17px', fontWeight: 500, color: 'var(--text)', margin: '0 0 12px' },

  objectifsList: { display: 'flex', flexDirection: 'column' as const, gap: '8px', listStyle: 'none' as const, margin: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 18px' },
  objectifItem: { display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13.5px', color: 'var(--text-2)', lineHeight: 1.5 },

  modulesList: { display: 'flex', flexDirection: 'column' as const, gap: '10px' },
  moduleCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 18px' },
  moduleHead: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  moduleNumber: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-bg)', color: 'var(--accent-text)', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif', flexShrink: 0 },
  moduleTitle: { flex: 1, fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' },
  moduleDuration: { fontSize: '11px', color: 'var(--text-muted)' },
  lessonsList: { listStyle: 'none' as const, padding: '0 0 0 32px', margin: 0, display: 'flex', flexDirection: 'column' as const, gap: '4px' },
  lessonItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-2)' },
  lessonTitle: { flex: 1, minWidth: 0 },
  lessonDuration: { fontSize: '10.5px', color: 'var(--text-muted)' },

  reviewsList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' },
  reviewCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  reviewStars: { display: 'flex', gap: '1px' },
  reviewComment: { fontSize: '13px', color: 'var(--text-2)', margin: 0, lineHeight: 1.55, fontStyle: 'italic' as const },
  reviewAuthor: { fontSize: '11.5px', color: 'var(--text-muted)' },

  ctaFinal: { background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: '16px', padding: 'clamp(20px,3vw,32px)', textAlign: 'center' as const },
  ctaFinalTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '20px', fontWeight: 500, color: 'var(--text)', margin: '0 0 8px' },
  ctaFinalDesc: { fontSize: '13.5px', color: 'var(--text-2)', margin: '0 0 18px', lineHeight: 1.6, maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' },
}
