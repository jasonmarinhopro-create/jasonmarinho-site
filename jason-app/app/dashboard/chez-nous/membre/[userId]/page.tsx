import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChatCircle, House, PencilSimple } from '@phosphor-icons/react/dist/ssr'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import { displayName, displayInitials, colorFromId, formatRelative } from '@/lib/chez-nous/display'
import { CATEGORIES, type CategoryId } from '@/lib/chez-nous/categories'
import { getMemberStats, type MemberProfile } from '@/lib/chez-nous/member-stats'
import { BADGES } from '@/lib/badges'

export const dynamic = 'force-dynamic'

const PLATFORM_META: Record<string, { label: string; color: string; bg: string }> = {
  airbnb:  { label: 'Airbnb',  color: '#FF5A5F', bg: 'rgba(255,90,95,0.10)' },
  booking: { label: 'Booking', color: '#003580', bg: 'rgba(0,53,128,0.08)' },
  gmb:     { label: 'Google',  color: '#34A853', bg: 'rgba(52,168,83,0.10)' },
  direct:  { label: 'Direct',  color: '#7C3AED', bg: 'rgba(124,58,237,0.10)' },
}

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
      .limit(10),
    supabase
      .from('chez_nous_replies')
      .select('id, post_id, body, created_at, chez_nous_posts(title)')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const av       = colorFromId(userId)
  const initials = displayInitials({ pseudo: member.pseudo, full_name: member.full_name })
  const name     = displayName({ pseudo: member.pseudo, full_name: member.full_name })
  const isMe     = profile.userId === userId
  const hasActivity = (posts ?? []).length > 0 || (replies ?? []).length > 0

  const memberSince = member.created_at
    ? new Date(member.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null

  return (
    <>
      <style>{`
        /* Responsive : profil colonne pleine sur tablette/mobile */
        @media (max-width: 1023px) {
          .cn-member-layout    { flex-direction: column !important; }
          .cn-member-profile   {
            position: static !important;
            flex: 1 1 100% !important;
            width: 100% !important;
          }
          .cn-member-activity  { flex: 1 1 100% !important; width: 100% !important; }
        }
        @media (max-width: 640px) {
          .cn-member-page      { padding: 12px !important; }
          .cn-member-profile-card { padding: 18px !important; gap: 14px !important; }
          .cn-member-name      { font-size: 22px !important; }
          .cn-member-stats     { grid-template-columns: repeat(3, 1fr) !important; }
          .cn-member-stat-pill { padding: 10px 6px !important; }
          .cn-member-section-title { font-size: 16px !important; }
          .cn-member-item      { padding: 12px !important; }
        }
      `}</style>

      <div style={s.page} className="cn-member-page">
        <Link href="/dashboard/chez-nous" style={s.back}>
          <ArrowLeft size={14} weight="bold" /> Retour Chez Nous
        </Link>

        <div style={s.layout} className="cn-member-layout">
          {/* ── Colonne profil (sticky) ── */}
          <aside style={s.profileCol} className="cn-member-profile">
            <div style={s.profileCard} className="cn-member-profile-card">
              {/* Avatar */}
              <div style={s.avatarRing}>
                <div style={{ ...s.avatarLg, background: av.bg, color: av.text }}>
                  {initials}
                </div>
              </div>

              {/* Nom + rôles */}
              <div style={s.nameSection}>
                <h1 style={s.name} className="cn-member-name">{name}</h1>
                <div style={s.tagRow}>
                  {member.is_contributor && (
                    <span style={s.contribTag}>Contributeur</span>
                  )}
                  {member.role === 'admin' && (
                    <span style={s.adminTag}>Admin</span>
                  )}
                </div>
              </div>

              {memberSince && (
                <p style={s.since}>Membre depuis {memberSince}</p>
              )}

              {/* Bio */}
              {member.bio && (
                <p style={s.bio}>{member.bio}</p>
              )}

              {/* Badges */}
              {stats.badges.length > 0 && (
                <div style={s.badgeSection}>
                  <span style={s.microLabel}>Distinctions</span>
                  <div style={s.badgeRow}>
                    {stats.badges.map(bid => (
                      <span
                        key={bid}
                        className="cn-member-badge"
                        data-badge-id={bid}
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
              <div style={s.statsRow} className="cn-member-stats">
                <StatPill label="Discussions" value={stats.postsCount} />
                <StatPill label="Réponses" value={stats.repliesCount} />
                {stats.logementsCount !== null && (
                  <StatPill label="Logements" value={stats.logementsCount} />
                )}
              </div>

              {/* Plateformes utilisées (si visibles) */}
              {stats.platforms.length > 0 && (
                <div style={s.badgeSection}>
                  <span style={s.microLabel}>Plateformes utilisées</span>
                  <div style={s.badgeRow}>
                    {stats.platforms.map(p => {
                      const meta = PLATFORM_META[p] ?? { label: p, color: 'var(--text-2)', bg: 'var(--surface-2)' }
                      return (
                        <span
                          key={p}
                          style={{ ...s.platChip, color: meta.color, background: meta.bg, borderColor: `${meta.color}33` }}
                        >
                          {meta.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Top catégories où il/elle s'exprime */}
              {stats.topCategories.length > 0 && (
                <div style={s.badgeSection}>
                  <span style={s.microLabel}>S&apos;exprime sur</span>
                  <div style={s.badgeRow}>
                    {stats.topCategories.map(({ category, count }) => {
                      const cat = CATEGORIES[category as CategoryId]
                      if (!cat) return null
                      return (
                        <span
                          key={category}
                          style={{ ...s.platChip, color: cat.color, background: cat.bg, borderColor: `${cat.color}33` }}
                          title={`${count} post${count > 1 ? 's' : ''}`}
                        >
                          {cat.short} <span style={s.catCount}>{count}</span>
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Dernière activité */}
              {stats.lastActiveAt && (
                <p style={s.lastActive}>
                  <span style={s.lastActiveDot} />
                  Actif {formatRelative(stats.lastActiveAt)}
                </p>
              )}

              {isMe && (
                <Link href="/dashboard/profil" style={s.editBtn}>
                  <PencilSimple size={13} weight="bold" />
                  Modifier mon profil
                </Link>
              )}
            </div>
          </aside>

          {/* ── Colonne activité ── */}
          <main style={s.activityCol} className="cn-member-activity">
            {!hasActivity ? (
              <div style={s.empty}>
                <House size={28} color="var(--accent-text)" weight="duotone" />
                <p style={s.emptyTitle}>
                  {isMe ? 'Tu n\'as pas encore participé' : 'Pas encore de contribution'}
                </p>
                <p style={s.emptyDesc}>
                  {isMe
                    ? 'Lance une conversation, pose une question — la famille est là pour toi.'
                    : 'Ce membre n\'a pas encore posté ou répondu dans Chez Nous.'}
                </p>
                {isMe && (
                  <Link href="/dashboard/chez-nous" style={s.emptyBtn}>
                    Aller dans Chez Nous
                  </Link>
                )}
              </div>
            ) : (
              <>
                {(posts ?? []).length > 0 && (
                  <section style={s.section}>
                    <h2 style={s.sectionTitle} className="cn-member-section-title">Discussions lancées</h2>
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

                {(replies ?? []).length > 0 && (
                  <section style={s.section}>
                    <h2 style={s.sectionTitle} className="cn-member-section-title">Réponses apportées</h2>
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
                            <p style={s.replyExcerpt}>{r.body.slice(0, 220)}{r.body.length > 220 ? '…' : ''}</p>
                          </Link>
                        )
                      })}
                    </div>
                  </section>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </>
  )
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div style={s.statPill} className="cn-member-stat-pill">
      <span style={s.statValue}>{value}</span>
      <span style={s.statLabel}>{label}</span>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: 'clamp(14px, 3vw, 40px)',
    width: '100%',
  },
  back: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', color: 'var(--text-muted)',
    textDecoration: 'none', marginBottom: '20px',
  },

  layout: {
    display: 'flex',
    gap: 'clamp(16px, 2.5vw, 32px)',
    alignItems: 'flex-start',
    flexWrap: 'wrap' as const,
  },

  /* ── Left: profile card ── */
  profileCol: {
    flex: '0 0 clamp(260px, 26vw, 320px)',
    position: 'sticky' as const,
    top: '24px',
  },
  profileCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    padding: 'clamp(18px, 3vw, 28px)',
    display: 'flex', flexDirection: 'column' as const, gap: '16px',
  },
  avatarRing: {
    display: 'flex', justifyContent: 'center',
    padding: '4px 0 0',
  },
  avatarLg: {
    width: 'clamp(64px, 14vw, 80px)', height: 'clamp(64px, 14vw, 80px)', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 700, lineHeight: 1,
    fontFamily: 'var(--font-fraunces), serif',
    flexShrink: 0,
    boxShadow: '0 0 0 3px var(--surface), 0 0 0 5px var(--border)',
  },
  nameSection: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '8px',
    textAlign: 'center' as const,
  },
  name: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(20px, 2.5vw, 24px)', fontWeight: 400,
    color: 'var(--text)', margin: 0, lineHeight: 1.2,
  },
  tagRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' as const, justifyContent: 'center' },
  contribTag: {
    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.5px', color: 'var(--accent-text)',
    background: 'rgba(255,213,107,0.12)', padding: '3px 9px', borderRadius: '6px',
  },
  adminTag: {
    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.5px', color: '#fb7185',
    background: 'rgba(251,113,133,0.12)', padding: '3px 9px', borderRadius: '6px',
  },
  since: {
    fontSize: '12px', color: 'var(--text-muted)', margin: 0,
    textAlign: 'center' as const,
  },
  bio: {
    fontSize: '13px', lineHeight: 1.65, color: 'var(--text-2)',
    margin: 0, padding: '12px 14px',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '12px',
  },
  badgeSection: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  microLabel: {
    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.6px', color: 'var(--text-muted)',
  },
  badgeRow: { display: 'flex', flexWrap: 'wrap' as const, gap: '5px' },
  badgeChip: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '11px', fontWeight: 600,
    padding: '4px 10px', borderRadius: '999px',
    border: '1px solid',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  statPill: {
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '10px 8px',
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '3px',
  },
  statValue: {
    fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 700, color: 'var(--text)',
    fontFamily: 'var(--font-fraunces), serif', lineHeight: 1,
  },
  statLabel: { fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'center' as const },
  editBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    width: '100%', padding: '9px 14px', borderRadius: '10px',
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontSize: '12px', fontWeight: 600,
    textDecoration: 'none', textAlign: 'center' as const,
  },

  /* ── Right: activity ── */
  activityCol: {
    flex: '1 1 400px', minWidth: 0,
    display: 'flex', flexDirection: 'column' as const, gap: '24px',
  },
  section: { display: 'flex', flexDirection: 'column' as const, gap: '10px' },
  sectionTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '18px', fontWeight: 400, color: 'var(--text)',
    margin: 0,
  },
  list: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  itemLink: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '14px 16px',
    textDecoration: 'none', color: 'inherit',
    display: 'flex', flexDirection: 'column' as const, gap: '5px',
  },
  itemHead: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const },
  catChip: {
    fontSize: '10px', fontWeight: 700,
    letterSpacing: '0.4px', textTransform: 'uppercase' as const,
    padding: '2px 8px', borderRadius: '999px',
  },
  itemDate: { fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' },
  itemTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: 0, lineHeight: 1.4 },
  itemFoot: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px',
  },
  replyOnLabel: {
    fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' as const,
    letterSpacing: '0.5px', fontWeight: 700,
  },
  replyOnTitle: {
    fontSize: '13px', color: 'var(--text)', fontWeight: 600,
    flex: 1, minWidth: 0,
    overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const,
  },
  replyExcerpt: {
    fontSize: '13px', lineHeight: 1.55, color: 'var(--text-2)', margin: 0,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
  },

  /* ── Empty state ── */
  empty: {
    background: 'var(--surface)', border: '1px dashed var(--border)',
    borderRadius: '16px', padding: 'clamp(32px, 6vw, 56px) 24px',
    textAlign: 'center' as const,
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '8px',
  },
  emptyTitle: {
    fontSize: '16px', fontWeight: 600, color: 'var(--text)',
    margin: '6px 0 0', fontFamily: 'var(--font-fraunces), serif',
  },
  emptyDesc: {
    fontSize: '13px', color: 'var(--text-muted)', margin: 0,
    maxWidth: '340px', lineHeight: 1.6,
  },
  emptyBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: '#ffd56b', color: '#1a1a0e',
    fontWeight: 700, fontSize: '13px',
    padding: '9px 20px', borderRadius: '10px',
    border: 'none', textDecoration: 'none', marginTop: '6px',
  },

  /* ── Plateformes & catégories ── */
  platChip: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '11px', fontWeight: 600,
    padding: '4px 10px', borderRadius: '999px',
    border: '1px solid',
  },
  catCount: {
    fontSize: '10px', fontWeight: 700, opacity: 0.7,
    background: 'rgba(0,0,0,0.06)',
    padding: '1px 5px', borderRadius: '999px',
  },

  /* ── Last active ── */
  lastActive: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '11px', color: 'var(--text-muted)',
    margin: 0,
  },
  lastActiveDot: {
    width: '6px', height: '6px', borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 0 3px rgba(16,185,129,0.18)',
  },
}
