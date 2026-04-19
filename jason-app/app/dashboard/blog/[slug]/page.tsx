import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, CalendarBlank } from '@phosphor-icons/react/dist/ssr'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  conseil:    { label: 'Conseils',             color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  strategie:  { label: 'Stratégie',            color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  experience: { label: "Retour d'expérience",  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  outil:      { label: 'Outils',               color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  marche:     { label: 'Marché',               color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  general:    { label: 'Général',              color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const [profile, supabase] = await Promise.all([
    getProfile(),
    createClient(),
  ])

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!post) notFound()

  const cat = CATEGORY_LABELS[post.category] ?? CATEGORY_LABELS.general

  return (
    <>
      <Header title="Blog" userName={profile?.full_name ?? undefined} />
      <div style={s.page}>
        <div style={s.article}>
          {/* Back link */}
          <Link href="/dashboard/blog" style={s.back}>
            <ArrowLeft size={15} />
            Retour au blog
          </Link>

          {/* Header */}
          <div style={s.articleHead}>
            <span style={{ ...s.catBadge, color: cat.color, background: cat.bg, borderColor: `${cat.color}25` }}>
              {cat.label}
            </span>

            <h1 style={s.title}>{post.title}</h1>

            {post.summary && <p style={s.summary}>{post.summary}</p>}

            <div style={s.meta}>
              {post.published_at && (
                <span style={s.metaItem}>
                  <CalendarBlank size={13} />
                  {formatDate(post.published_at)}
                </span>
              )}
              {post.reading_time && (
                <span style={s.metaItem}>
                  <Clock size={13} />
                  {post.reading_time} min de lecture
                </span>
              )}
            </div>
          </div>

          <div style={s.divider} />

          {/* Content */}
          {post.content ? (
            <div style={s.content}>
              {post.content.split('\n').map((line: string, i: number) =>
                line.trim() === '' ? (
                  <div key={i} style={{ height: '12px' }} />
                ) : (
                  <p key={i} style={s.para}>{line}</p>
                )
              )}
            </div>
          ) : (
            <p style={s.emptyContent}>Contenu à venir.</p>
          )}

          <div style={s.divider} />

          <Link href="/dashboard/blog" style={s.backBottom}>
            <ArrowLeft size={15} />
            Tous les articles
          </Link>
        </div>
      </div>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  article: { maxWidth: '720px' },

  back: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)',
    textDecoration: 'none', marginBottom: '28px',
    transition: 'color 0.15s',
  },
  backBottom: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)',
    textDecoration: 'none', marginTop: '8px',
    transition: 'color 0.15s',
  },

  articleHead: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' },
  catBadge: {
    display: 'inline-block',
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px',
    textTransform: 'uppercase',
    padding: '4px 10px', borderRadius: '100px', border: '1px solid',
    alignSelf: 'flex-start',
  },

  title: {
    fontFamily: 'Fraunces, serif',
    fontSize: 'clamp(26px,4vw,40px)',
    fontWeight: 400, lineHeight: 1.2,
    color: 'var(--text)', margin: 0,
  },
  summary: {
    fontSize: '16px', fontWeight: 300, color: 'var(--text-2)',
    lineHeight: 1.7, margin: 0,
  },
  meta: { display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' as const },
  metaItem: {
    display: 'flex', alignItems: 'center', gap: '5px',
    fontSize: '13px', color: 'var(--text-muted)', fontWeight: 300,
  },

  divider: { height: '1px', background: 'var(--border)', margin: '32px 0' },

  content: { display: 'flex', flexDirection: 'column' },
  para: {
    fontSize: '16px', fontWeight: 300, color: 'var(--text-2)',
    lineHeight: 1.8, margin: 0,
  },
  emptyContent: { fontSize: '15px', color: 'var(--text-muted)', fontStyle: 'italic' },
}
