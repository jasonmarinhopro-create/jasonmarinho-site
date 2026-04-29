import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Compass, GraduationCap, Clock } from '@phosphor-icons/react/dist/ssr'
import { PARCOURS, PARCOURS_LEVEL_LABELS } from '@/lib/formations/parcours'

export const metadata = {
  title: 'Parcours d\'apprentissage LCD — Jason Marinho',
  description: '5 parcours thématiques pour atteindre tes objectifs : démarrer, maximiser revenus, devenir conciergerie, visibilité directe, conformité.',
}

export default async function ParcoursListPage() {
  const profile = await getProfile()
  if (!profile) return null

  const supabase = await createClient()
  const [{ data: formations }, { data: userFormations }] = await Promise.all([
    supabase.from('formations').select('id, slug, title, lessons_count').eq('is_published', true),
    supabase.from('user_formations').select('formation_id, progress').eq('user_id', profile.userId),
  ])

  const formationsBySlug = Object.fromEntries((formations ?? []).map(f => [f.slug, f]))
  const progressByFormationId = Object.fromEntries((userFormations ?? []).map(uf => [uf.formation_id, uf.progress]))

  return (
    <>
      <div style={s.page}>
        <Link href="/dashboard/formations" style={s.backLink}>
          <ArrowLeft size={14} weight="bold" />
          Toutes les formations
        </Link>

        <div style={s.intro}>
          <h1 style={s.title}>
            Parcours <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>d&apos;apprentissage</em>
          </h1>
          <p style={s.desc}>
            5 parcours thématiques pour atteindre tes objectifs business. Chaque parcours combine 3-4 formations
            dans un ordre logique d&apos;apprentissage.
          </p>
        </div>

        <div style={s.grid}>
          {PARCOURS.map(p => {
            // Calcul progression du parcours
            const totalForms = p.formations.length
            const completedForms = p.formations.filter(slug => {
              const f = formationsBySlug[slug]
              if (!f) return false
              return progressByFormationId[f.id] === 100
            }).length
            const inProgressForms = p.formations.filter(slug => {
              const f = formationsBySlug[slug]
              if (!f) return false
              const prog = progressByFormationId[f.id]
              return prog !== undefined && prog > 0 && prog < 100
            }).length
            const overallPct = totalForms > 0 ? Math.round((completedForms / totalForms) * 100) : 0

            return (
              <Link key={p.slug} href={`/dashboard/formations/parcours/${p.slug}`} style={s.card}>
                <div style={s.cardHead}>
                  <span style={s.cardEmoji}>{p.emoji}</span>
                  <span style={s.cardLevel}>{PARCOURS_LEVEL_LABELS[p.level]}</span>
                </div>
                <h2 style={s.cardTitle}>{p.title}</h2>
                <p style={s.cardDesc}>{p.description}</p>
                <div style={s.cardMeta}>
                  <span style={s.metaItem}>
                    <GraduationCap size={12} weight="fill" />
                    {totalForms} formations
                  </span>
                  <span style={s.metaItem}>
                    <Clock size={12} weight="fill" />
                    {p.duration}
                  </span>
                </div>
                {(completedForms > 0 || inProgressForms > 0) && (
                  <div style={s.progressWrap}>
                    <div style={s.progressBar}>
                      <div style={{ ...s.progressFill, width: `${overallPct}%` }} />
                    </div>
                    <span style={s.progressText}>
                      {completedForms} / {totalForms} terminée{completedForms > 1 ? 's' : ''}
                      {inProgressForms > 0 && ` · ${inProgressForms} en cours`}
                    </span>
                  </div>
                )}
                <div style={s.cardFoot}>
                  <span style={s.forWho}>{p.forWho}</span>
                  <ArrowRight size={14} weight="bold" color="var(--accent-text)" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '1100px' },
  backLink: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', textDecoration: 'none', marginBottom: '20px' },
  intro: { marginBottom: '28px' },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(24px,3vw,38px)', fontWeight: 400, color: 'var(--text)', marginBottom: '10px' },
  desc: { fontSize: '14px', color: 'var(--text-2)', maxWidth: '640px', lineHeight: 1.6 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '14px' },
  card: { display: 'flex', flexDirection: 'column' as const, gap: '10px', padding: '20px 22px', background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: '16px', textDecoration: 'none' as const, color: 'var(--text-2)', transition: 'all 0.18s' },
  cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardEmoji: { fontSize: '28px' },
  cardLevel: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const, padding: '3px 8px', background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)', borderRadius: '100px' },
  cardTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', fontWeight: 500, color: 'var(--text)', margin: 0, lineHeight: 1.3 },
  cardDesc: { fontSize: '13px', color: 'var(--text-2)', margin: 0, lineHeight: 1.55 },
  cardMeta: { display: 'flex', gap: '12px', fontSize: '11.5px', color: 'var(--text-muted)' },
  metaItem: { display: 'inline-flex', alignItems: 'center', gap: '4px' },
  progressWrap: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
  progressBar: { height: '5px', background: 'var(--surface-2)', borderRadius: '3px', overflow: 'hidden' as const },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, var(--accent-text), #34D399)', borderRadius: '3px' },
  progressText: { fontSize: '11px', color: 'var(--text-muted)' },
  cardFoot: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', paddingTop: '6px', borderTop: '1px solid var(--border)', marginTop: '4px' },
  forWho: { fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic' as const, flex: 1 },
}
