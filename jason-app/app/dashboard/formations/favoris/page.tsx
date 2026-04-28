import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { BookmarkSimple, ArrowLeft, ArrowRight, GraduationCap } from '@phosphor-icons/react/dist/ssr'

export default async function FavorisPage() {
  const profile = await getProfile()
  if (!profile) return null

  const supabase = await createClient()
  const { data: bookmarks } = await supabase
    .from('user_lesson_bookmarks')
    .select('formation_id, formation_slug, formation_title, module_id, lesson_id, lesson_title, created_at')
    .eq('user_id', profile.userId)
    .order('created_at', { ascending: false })

  // Regroupe par formation
  const grouped = new Map<string, { slug: string; title: string; lessons: any[] }>()
  ;(bookmarks ?? []).forEach((b: any) => {
    const key = b.formation_slug
    if (!grouped.has(key)) grouped.set(key, { slug: b.formation_slug, title: b.formation_title, lessons: [] })
    grouped.get(key)!.lessons.push(b)
  })

  return (
    <>
      <Header title="Mes favoris" userName={profile.full_name ?? undefined} />
      <div style={s.page}>
        <Link href="/dashboard/formations" style={s.backLink}>
          <ArrowLeft size={14} weight="bold" />
          Toutes les formations
        </Link>

        <div style={s.intro}>
          <h1 style={s.title}>
            Mes <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>favoris</em>
          </h1>
          <p style={s.desc}>
            Les leçons que tu as marquées pour les retrouver facilement plus tard.
          </p>
        </div>

        {grouped.size === 0 ? (
          <div style={s.empty}>
            <BookmarkSimple size={32} weight="thin" color="var(--text-muted)" />
            <p style={s.emptyText}>
              Aucune leçon en favori pour l&apos;instant. Pendant une formation, clique sur l&apos;icône
              <BookmarkSimple size={12} weight="fill" color="#f59e0b" style={{ verticalAlign: '-2px', margin: '0 4px' }} />
              dans la rail droite pour ajouter une leçon ici.
            </p>
            <Link href="/dashboard/formations" style={s.emptyBtn}>
              <GraduationCap size={14} weight="fill" />
              Parcourir les formations
            </Link>
          </div>
        ) : (
          <div style={s.list}>
            {Array.from(grouped.values()).map(group => (
              <div key={group.slug} style={s.formationGroup}>
                <Link href={`/dashboard/formations/${group.slug}`} style={s.formationTitle}>
                  <GraduationCap size={14} weight="fill" color="var(--accent-text)" />
                  {group.title}
                </Link>
                <div style={s.lessonsList}>
                  {group.lessons.map((b: any) => (
                    <Link
                      key={b.lesson_id}
                      href={`/dashboard/formations/${group.slug}`}
                      style={s.lessonRow}
                    >
                      <BookmarkSimple size={13} weight="fill" color="#f59e0b" style={{ flexShrink: 0 }} />
                      <span style={s.lessonModule}>Module {b.module_id}</span>
                      <span style={s.lessonTitle}>{b.lesson_title}</span>
                      <ArrowRight size={12} weight="bold" color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '900px' },
  backLink: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', fontWeight: 500, color: 'var(--text-2)',
    textDecoration: 'none', marginBottom: '20px',
  },
  intro: { marginBottom: '24px' },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(24px,3vw,38px)', fontWeight: 400, color: 'var(--text)', marginBottom: '8px' },
  desc: { fontSize: '14px', color: 'var(--text-2)', maxWidth: '520px', lineHeight: 1.6 },

  empty: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '48px 32px',
    textAlign: 'center' as const,
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', gap: '12px',
    marginTop: '20px',
  },
  emptyText: {
    fontSize: '13.5px', color: 'var(--text-2)',
    maxWidth: '440px', lineHeight: 1.6, margin: 0,
  },
  emptyBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '10px 18px', fontSize: '13px', fontWeight: 600,
    color: 'var(--bg)', background: 'var(--accent-text)',
    borderRadius: '10px', textDecoration: 'none', marginTop: '8px',
  },

  list: { display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  formationGroup: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '16px 18px',
  },
  formationTitle: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '16px', fontWeight: 500,
    color: 'var(--text)', textDecoration: 'none',
    marginBottom: '10px',
  },
  lessonsList: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
  lessonRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 12px',
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    textDecoration: 'none',
    color: 'var(--text-2)',
  },
  lessonModule: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.4px',
    textTransform: 'uppercase' as const,
    color: 'var(--text-muted)',
    flexShrink: 0,
  },
  lessonTitle: {
    flex: 1, minWidth: 0,
    fontSize: '13px', fontWeight: 500,
    color: 'var(--text)',
    overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const,
  },
}
