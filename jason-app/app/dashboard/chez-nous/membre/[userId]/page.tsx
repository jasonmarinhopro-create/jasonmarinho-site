import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChatCircle, House } from '@phosphor-icons/react/dist/ssr'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { displayName, displayInitials, colorFromId, formatRelative } from '@/lib/chez-nous/display'
import { CATEGORIES, type CategoryId } from '@/lib/chez-nous/categories'
import { getMemberStats, type MemberProfile } from '@/lib/chez-nous/member-stats'
import { BADGES } from '@/lib/badges'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ userId: string }> }

export default async function MembrePage({ params }: Props) {
  const { userId } = await params
  const profile = await getProfile()
  if (!profile?.userId) redirect('/auth/login')

  const supabase = await createClient()

  const { data: m } = await supabase
    .from('profiles')
    .select('id, full_name, pseudo, bio, role, is_contributor, created_at, privacy_show_logements, privacy_show_platforms, privacy_show_city')
    .eq('id', userId)
    .maybeSingle()

  if (!m) notFound()

  const member = m as MemberProfile
  const stats  = await getMemberStats(supabase, userId, member)

  const [{ data: posts }, { data: replies }] = await Promise.all([
    supabase
      .from('chez_nous_posts')
      .select('id, category, title, body, reply_count, created_at')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('chez_nous_replies')
      .select('id, post_id, body, created_at, chez_nous_posts(title)')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const av       = colorFromId(userId)
  const initials = displayInitials({ pseudo: member.pseudo, full_name: member.full_name })
  const name     = displayName({ pseudo: member.pseudo, full_name: member.full_name })
  const isMe     = profile.userId === userId

  return (
    <>
      <Header title="Profil membre" userName={profile.full_name ?? undefined} />
      <div style={s.page}>
        <Link href="/dashboard/chez-nous" style={s.back}>
          <ArrowLeft size={14} weight="bold" /> Retour Chez Nous
        </Link>

        {/* Carte profil */}
        <section style={s.card}>
          <div style={s.cardTop}>
            <div style={{ ...s.avatarLg, background: av.bg, color: av.text }}>{initials}</div>
            <div style={{ flex: 1 }}>
              <div style={s.nameRow}>
                <h1 style={s.name}>{name}</h1>
                {member.is_contributor && (
                  <span style={s.contribTag} title="Contributeur du projet">Contributeur</span>
                )}
                {member.role === 'admin' && <span style={s.adminTag}>admin</span>}
              </div>
              {member.created_at && (
                <p style={s.since}>Membre depuis {new Date(member.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
              )}
              {isMe && (
                <Link href="/dashboard/profil" style={s.editLink}>Modifier mon profil →</Link>
              )}
            </div>
          </div>

          {member.bio && (
            <p style={s.bio}>{member.bio}</p>
          )}

          {/* Badges */}
          {stats.badges.length > 0 && (
            <div style={s.badgeWrap}>
              <span style={s.sectionLabel}>Distinctions</span>
              <div style={s.badgeRow}>
                {stats.badges.map(bid => (
                  <span
                    key={bid}
                    style={{ ...s.badgeChip, color: BADGES[bid].color, background: BADGES[bid].bg, borderColor: `${BADGES[bid].color}44` }}
                    title={BADGES[bid].title}
                  >
                    {BADGES[bid].label} {BADGES[bid].title.split(' — ')[0]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={s.statsGrid}>
            <Stat label="Discussions" value={stats.postsCount} />
            <Stat label="Réponses" value={stats.repliesCount} />
            {stats.logementsCount !== null && <Stat label="Logements" value={stats.logementsCount} />}
          </div>
        </section>

        {/* Posts récents */}
        {(posts ?? []).length > 0 && (
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Dernières discussions</h2>
            <div style={s.list}>
              {(posts ?? []).map(p => {
                const cat = CATEGORIES[p.category as CategoryId]
                return (
                  <Link key={p.id} href={`/dashboard/chez-nous/${p.id}`} style={s.itemLink}>
                    <div style={s.itemHead}>
                      <span style={{ ...s.catChip, color: cat.color, background: cat.bg }}>
                        {cat.short}
                      </span>
                      <span style={s.itemDate}>{formatRelative(p.created_at)}</span>
                    </div>
                    <h3 style={s.itemTitle}>{p.title}</h3>
                    <div style={s.itemFoot}>
                      <ChatCircle size={11} weight="fill" />
                      {p.reply_count} réponse{p.reply_count > 1 ? 's' : ''}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Réponses récentes */}
        {(replies ?? []).length > 0 && (
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Dernières réponses</h2>
            <div style={s.list}>
              {(replies ?? []).map(r => {
                const postTitle = (r.chez_nous_posts as unknown as { title: string } | { title: string }[] | null)
                const title = Array.isArray(postTitle) ? (postTitle[0]?.title ?? '') : (postTitle?.title ?? '')
                return (
                  <Link key={r.id} href={`/dashboard/chez-nous/${r.post_id}`} style={s.itemLink}>
                    <div style={s.itemHead}>
                      <span style={s.replyOnLabel}>Sur</span>
                      <span style={s.replyOnTitle}>{title}</span>
                      <span style={s.itemDate}>{formatRelative(r.created_at)}</span>
                    </div>
                    <p style={s.replyExcerpt}>{r.body.slice(0, 200)}{r.body.length > 200 ? '…' : ''}</p>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {(posts ?? []).length === 0 && (replies ?? []).length === 0 && (
          <div style={s.empty}>
            <House size={26} color="#ffd56b" weight="duotone" />
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--text-2)' }}>
              {isMe ? 'Tu n\'as pas encore participé.' : 'Pas encore de participation publique.'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={s.stat}>
      <span style={s.statValue}>{value}</span>
      <span style={s.statLabel}>{label}</span>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '820px' },
  back: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', color: 'var(--text-muted)',
    textDecoration: 'none', marginBottom: '16px',
  },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '18px', padding: '24px',
    display: 'flex', flexDirection: 'column', gap: '18px',
  },
  cardTop: { display: 'flex', alignItems: 'center', gap: '16px' },
  avatarLg: {
    width: '64px', height: '64px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '22px', fontWeight: 700, lineHeight: 1,
    fontFamily: 'var(--font-fraunces), serif',
    flexShrink: 0,
  },
  nameRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  name: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(20px,2.5vw,26px)', fontWeight: 400,
    color: 'var(--text)', margin: 0, lineHeight: 1.2,
  },
  contribTag: {
    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.5px', color: '#ffd56b',
    background: 'rgba(255,213,107,0.12)', padding: '3px 8px', borderRadius: '6px',
  },
  adminTag: {
    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.5px', color: '#fb7185',
    background: 'rgba(251,113,133,0.12)', padding: '3px 8px', borderRadius: '6px',
  },
  since: { fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' },
  editLink: {
    display: 'inline-block', fontSize: '12px', color: '#ffd56b',
    marginTop: '6px', textDecoration: 'none',
  },
  bio: {
    fontSize: '14px', lineHeight: 1.7, color: 'var(--text-2)',
    margin: 0, padding: '14px',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '12px',
  },
  badgeWrap: { display: 'flex', flexDirection: 'column', gap: '8px' },
  sectionLabel: {
    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.6px', color: 'var(--text-muted)',
  },
  badgeRow: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  badgeChip: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '11px', fontWeight: 600,
    padding: '4px 10px', borderRadius: '999px',
    border: '1px solid',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: '10px',
  },
  stat: {
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '14px',
    display: 'flex', flexDirection: 'column', gap: '4px',
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: '22px', fontWeight: 700, color: 'var(--text)',
    fontFamily: 'var(--font-fraunces), serif', lineHeight: 1,
  },
  statLabel: { fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 },

  section: { marginTop: '24px' },
  sectionTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '18px', fontWeight: 400, color: 'var(--text)',
    margin: '0 0 12px',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  itemLink: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '12px 14px',
    textDecoration: 'none', color: 'inherit',
    display: 'flex', flexDirection: 'column', gap: '4px',
  },
  itemHead: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  catChip: {
    fontSize: '10px', fontWeight: 700,
    letterSpacing: '0.4px', textTransform: 'uppercase' as const,
    padding: '2px 8px', borderRadius: '999px',
  },
  itemDate: { fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' },
  itemTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '4px 0 0', lineHeight: 1.4 },
  itemFoot: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px',
  },
  replyOnLabel: { fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.5px', fontWeight: 600 },
  replyOnTitle: { fontSize: '13px', color: 'var(--text)', fontWeight: 600 },
  replyExcerpt: {
    fontSize: '13px', lineHeight: 1.5, color: 'var(--text-2)', margin: '4px 0 0',
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
  },
  empty: {
    background: 'var(--surface)', border: '1px dashed var(--border)',
    borderRadius: '12px', padding: '28px', textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
}
