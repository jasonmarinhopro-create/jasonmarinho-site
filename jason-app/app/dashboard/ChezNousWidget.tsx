import Link from 'next/link'
import { ChatCircle, ArrowRight, House } from '@phosphor-icons/react/dist/ssr'
import { CATEGORIES, type CategoryId } from '@/lib/chez-nous/categories'
import { displayName, displayInitials, colorFromId, formatRelative } from '@/lib/chez-nous/display'

type WidgetPost = {
  id: string
  author_id: string
  category: CategoryId
  title: string
  reply_count: number
  vote_count: number
  last_reply_at: string | null
  created_at: string
}

type WidgetAuthor = {
  full_name: string | null
  pseudo: string | null
}

export default function ChezNousWidget({
  posts, authors, totalPosts,
}: {
  posts: WidgetPost[]
  authors: Record<string, WidgetAuthor>
  totalPosts: number
}) {
  if (posts.length === 0) {
    return (
      <div style={s.empty}>
        <div style={s.emptyHead}>
          <House size={16} color="var(--accent-text)" weight="fill" />
          <h3 style={s.title}>Chez Nous</h3>
        </div>
        <p style={s.emptyText}>
          La communauté ouverte vient de naître, sois le premier à lancer une discussion entre hôtes.
        </p>
        <Link href="/dashboard/chez-nous" style={s.cta}>
          Découvrir Chez Nous <ArrowRight size={12} weight="bold" />
        </Link>
      </div>
    )
  }

  return (
    <div style={s.widget}>
      <div style={s.head}>
        <div style={s.headLeft}>
          <House size={16} color="var(--accent-text)" weight="fill" />
          <h3 style={s.title}>Chez Nous</h3>
          <span style={s.count}>{totalPosts}</span>
        </div>
        <Link href="/dashboard/chez-nous" style={s.seeAll}>
          Tout voir <ArrowRight size={12} weight="bold" />
        </Link>
      </div>

      <div style={s.list}>
        {posts.map(p => {
          const author = authors[p.author_id]
          const av     = colorFromId(p.author_id)
          const initials = author ? displayInitials({ pseudo: author.pseudo, full_name: author.full_name }) : '?'
          const name     = author ? displayName({ pseudo: author.pseudo, full_name: author.full_name }) : 'Anonyme'
          const cat      = CATEGORIES[p.category]

          return (
            <Link key={p.id} href={`/dashboard/chez-nous/${p.id}`} style={s.row}>
              <div style={{ ...s.avatar, background: av.bg, color: av.text }}>{initials}</div>
              <div style={s.body}>
                <div style={s.meta}>
                  <span style={{ ...s.catChip, color: cat.color, background: cat.bg }}>{cat.short}</span>
                  <span style={s.metaSep}>·</span>
                  <span style={s.metaName}>{name}</span>
                </div>
                <div style={s.titleRow}>{p.title}</div>
                <div style={s.foot}>
                  <span>{formatRelative(p.last_reply_at ?? p.created_at)}</span>
                  <span style={s.metaSep}>·</span>
                  <span style={s.foot}>
                    <ChatCircle size={10} weight="fill" /> {p.reply_count}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  widget: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '20px',
    display: 'flex', flexDirection: 'column', gap: '14px',
  },
  empty: {
    background: 'var(--surface)', border: '1px dashed var(--border)',
    borderRadius: '16px', padding: '22px',
    display: 'flex', flexDirection: 'column', gap: '10px',
    alignItems: 'flex-start',
  },
  emptyHead: { display: 'flex', alignItems: 'center', gap: '8px' },
  emptyText: {
    fontSize: '13px', lineHeight: 1.6, color: 'var(--text-2)', margin: 0,
  },
  head: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  headLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '17px', fontWeight: 400, color: 'var(--text)', margin: 0,
  },
  count: {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '999px', padding: '2px 8px',
  },
  seeAll: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 500,
    padding: '5px 10px', borderRadius: '8px',
    background: 'rgba(255,213,107,0.08)',
    border: '1px solid rgba(255,213,107,0.18)',
  },
  cta: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 600,
    padding: '7px 14px', borderRadius: '8px',
    background: 'rgba(255,213,107,0.08)',
    border: '1px solid rgba(255,213,107,0.18)',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  row: {
    display: 'flex', gap: '10px',
    padding: '10px 12px',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '10px',
    textDecoration: 'none', color: 'inherit',
  },
  avatar: {
    width: '32px', height: '32px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', fontWeight: 700, lineHeight: 1,
    fontFamily: 'var(--font-fraunces), serif',
    flexShrink: 0,
  },
  body: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' },
  meta: { display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' },
  catChip: {
    fontSize: '9px', fontWeight: 700,
    letterSpacing: '0.4px', textTransform: 'uppercase' as const,
    padding: '2px 6px', borderRadius: '999px',
  },
  metaName: { fontSize: '11px', color: 'var(--text-2)', fontWeight: 500 },
  metaSep:  { fontSize: '11px', color: 'var(--text-muted)', opacity: 0.5 },
  titleRow: {
    fontSize: '13px', fontWeight: 600, color: 'var(--text)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  foot: {
    fontSize: '10px', color: 'var(--text-muted)',
    display: 'inline-flex', alignItems: 'center', gap: '4px',
  },
}
