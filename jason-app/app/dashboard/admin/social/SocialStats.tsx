'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import {
  ArrowClockwise, CheckCircle, XCircle, Clock, CalendarBlank,
  Heart, ChatCircle, TrendUp,
} from '@phosphor-icons/react/dist/ssr'
import { PLATFORM_META, IMPLEMENTED_PLATFORMS } from './constants'
import type { SocialPostRow } from './SocialAdmin'

const WEEK_COUNT = 8

function mondayOf(d: Date): Date {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - day)
  x.setHours(0, 0, 0, 0)
  return x
}

interface WeekBucket {
  start: Date
  label: string
  facebook: number
  instagram: number
}

function useStats(posts: SocialPostRow[]) {
  return useMemo(() => {
    const allTargets = posts.flatMap(p => p.targets)
    const publishedTargets = allTargets.filter(t => t.status === 'published')
    const failedTargets = allTargets.filter(t => t.status === 'failed')
    const totalLikes = publishedTargets.reduce((sum, t) => sum + (t.like_count ?? 0), 0)
    const totalComments = publishedTargets.reduce((sum, t) => sum + (t.comment_count ?? 0), 0)
    const attempted = publishedTargets.length + failedTargets.length
    const successRate = attempted > 0 ? Math.round((publishedTargets.length / attempted) * 100) : null

    const byPlatform = IMPLEMENTED_PLATFORMS.map(platform => {
      const pub = publishedTargets.filter(t => t.platform === platform)
      const fail = failedTargets.filter(t => t.platform === platform)
      return {
        platform,
        published: pub.length,
        failed: fail.length,
        likes: pub.reduce((s, t) => s + (t.like_count ?? 0), 0),
        comments: pub.reduce((s, t) => s + (t.comment_count ?? 0), 0),
      }
    })

    const currentMonday = mondayOf(new Date())
    const weeks: WeekBucket[] = []
    for (let i = WEEK_COUNT - 1; i >= 0; i--) {
      const start = new Date(currentMonday)
      start.setDate(start.getDate() - i * 7)
      weeks.push({ start, label: start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), facebook: 0, instagram: 0 })
    }
    for (const t of publishedTargets) {
      if (!t.published_at) continue
      const wk = mondayOf(new Date(t.published_at)).getTime()
      const bucket = weeks.find(w => w.start.getTime() === wk)
      if (!bucket) continue
      if (t.platform === 'facebook') bucket.facebook++
      else if (t.platform === 'instagram') bucket.instagram++
    }

    const topPosts = posts
      .map(post => ({ post, engagement: post.targets.reduce((s, t) => s + (t.like_count ?? 0) + (t.comment_count ?? 0), 0) }))
      .filter(x => x.engagement > 0)
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5)

    const statusCounts = {
      done: posts.filter(p => p.status === 'done').length,
      partial: posts.filter(p => p.status === 'partial').length,
      failed: posts.filter(p => p.status === 'failed').length,
      scheduled: posts.filter(p => p.status === 'scheduled').length,
    }

    return { totalLikes, totalComments, successRate, byPlatform, weeks, topPosts, statusCounts, totalPosts: posts.length }
  }, [posts])
}

export default function SocialStats({ posts, onRefreshAll, refreshing }: {
  posts: SocialPostRow[]
  onRefreshAll: () => void
  refreshing: boolean
}) {
  const stats = useStats(posts)
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null)

  const maxWeekTotal = Math.max(1, ...stats.weeks.map(w => w.facebook + w.instagram))
  const chartH = 120
  const barW = 22
  const gap = 14
  const chartW = stats.weeks.length * (barW + gap)
  const readoutWeek = stats.weeks[hoveredWeek ?? stats.weeks.length - 1]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onRefreshAll} disabled={refreshing} style={st.refreshBtn}>
          <ArrowClockwise size={13} /> {refreshing ? 'Actualisation…' : 'Actualiser tous les likes/commentaires'}
        </button>
      </div>

      {/* Tuiles de synthèse */}
      <div style={st.tileRow}>
        <div style={st.tile}>
          <span style={st.tileValue}>{stats.totalPosts}</span>
          <span style={st.tileLabel}>Publications au total</span>
        </div>
        <div style={st.tile}>
          <span style={st.tileValue}>{stats.successRate === null ? '—' : `${stats.successRate}%`}</span>
          <span style={st.tileLabel}>Taux de réussite</span>
        </div>
        <div style={st.tile}>
          <span style={st.tileValue}>{stats.totalLikes.toLocaleString('fr-FR')}</span>
          <span style={st.tileLabel}>Likes cumulés</span>
        </div>
        <div style={st.tile}>
          <span style={st.tileValue}>{stats.totalComments.toLocaleString('fr-FR')}</span>
          <span style={st.tileLabel}>Commentaires cumulés</span>
        </div>
      </div>

      {/* Répartition des statuts */}
      <div style={st.statusRow}>
        <span style={{ ...st.statusChip, color: 'var(--success-1)' }}><CheckCircle size={14} weight="fill" /> {stats.statusCounts.done} publiées</span>
        <span style={{ ...st.statusChip, color: 'var(--warning, #F59E0B)' }}><CheckCircle size={14} weight="fill" /> {stats.statusCounts.partial} partielles</span>
        <span style={{ ...st.statusChip, color: 'var(--danger, #EF4444)' }}><XCircle size={14} weight="fill" /> {stats.statusCounts.failed} échouées</span>
        <span style={{ ...st.statusChip, color: 'var(--text-muted)' }}><CalendarBlank size={14} /> {stats.statusCounts.scheduled} programmées</span>
      </div>

      {/* Graphique hebdomadaire */}
      <section style={st.card}>
        <h2 style={st.cardTitle}>Publications par semaine</h2>
        {maxWeekTotal <= 1 && stats.weeks.every(w => w.facebook + w.instagram === 0) ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Pas encore assez de publications pour un graphique.</p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-2)' }}>
              {IMPLEMENTED_PLATFORMS.map(p => (
                <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: PLATFORM_META[p].color, display: 'inline-block' }} />
                  {PLATFORM_META[p].label}
                </span>
              ))}
            </div>
            <div style={{ overflowX: 'auto' as const }}>
              <svg width={chartW} height={chartH + 24} role="img" aria-label="Publications par semaine, Facebook et Instagram">
                {stats.weeks.map((w, i) => {
                  const total = w.facebook + w.instagram
                  const scale = chartH / maxWeekTotal
                  const fbH = w.facebook * scale
                  const igH = w.instagram * scale
                  const x = i * (barW + gap)
                  const baseline = chartH
                  const fbY = baseline - fbH
                  const hasGap = fbH > 0 && igH > 0
                  const igY = fbY - (hasGap ? 2 : 0) - igH
                  const igRoundTop = igH > 0
                  const fbRoundTop = igH === 0 && fbH > 0
                  const r = 4
                  return (
                    <g key={w.start.getTime()}
                      onMouseEnter={() => setHoveredWeek(i)}
                      onMouseLeave={() => setHoveredWeek(null)}
                      style={{ cursor: total > 0 ? 'pointer' : 'default' }}
                    >
                      {/* zone de survol, plus large que la barre */}
                      <rect x={x - gap / 2} y={0} width={barW + gap} height={chartH + 24} fill="transparent" />
                      {fbH > 0 && (
                        fbRoundTop
                          ? <>
                              <rect x={x} y={fbY} width={barW} height={Math.min(r, fbH)} rx={r} fill={PLATFORM_META.facebook.color} opacity={hoveredWeek === null || hoveredWeek === i ? 1 : 0.35} />
                              {fbH > r && <rect x={x} y={fbY + r} width={barW} height={fbH - r} fill={PLATFORM_META.facebook.color} opacity={hoveredWeek === null || hoveredWeek === i ? 1 : 0.35} />}
                            </>
                          : <rect x={x} y={fbY} width={barW} height={fbH} fill={PLATFORM_META.facebook.color} opacity={hoveredWeek === null || hoveredWeek === i ? 1 : 0.35} />
                      )}
                      {igH > 0 && (
                        igRoundTop
                          ? <>
                              <rect x={x} y={igY} width={barW} height={Math.min(r, igH)} rx={r} fill={PLATFORM_META.instagram.color} opacity={hoveredWeek === null || hoveredWeek === i ? 1 : 0.35} />
                              {igH > r && <rect x={x} y={igY + r} width={barW} height={igH - r} fill={PLATFORM_META.instagram.color} opacity={hoveredWeek === null || hoveredWeek === i ? 1 : 0.35} />}
                            </>
                          : <rect x={x} y={igY} width={barW} height={igH} fill={PLATFORM_META.instagram.color} opacity={hoveredWeek === null || hoveredWeek === i ? 1 : 0.35} />
                      )}
                      <text x={x + barW / 2} y={chartH + 16} textAnchor="middle" fontSize={10} fill="var(--text-muted)">{w.label}</text>
                    </g>
                  )
                })}
              </svg>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)' }}>
              Semaine du <strong>{readoutWeek.label}</strong> : {readoutWeek.facebook} Facebook · {readoutWeek.instagram} Instagram
            </p>
          </>
        )}
      </section>

      {/* Par réseau */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.byPlatform.length}, 1fr)`, gap: 14 }}>
        {stats.byPlatform.map(({ platform, published, failed, likes, comments }) => {
          const meta = PLATFORM_META[platform]
          return (
            <section key={platform} style={st.card}>
              <h2 style={{ ...st.cardTitle, display: 'flex', alignItems: 'center', gap: 8, color: meta.color }}>
                <meta.Icon size={17} weight="fill" style={{ color: meta.color }} /> {meta.label}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                <span>{published} publiée{published > 1 ? 's' : ''}{failed > 0 ? ` · ${failed} échec${failed > 1 ? 's' : ''}` : ''}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14, color: 'var(--text-2)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Heart size={13} weight="fill" /> {likes.toLocaleString('fr-FR')}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><ChatCircle size={13} weight="fill" /> {comments.toLocaleString('fr-FR')}</span>
                </span>
              </div>
            </section>
          )
        })}
      </div>

      {/* Top publications */}
      <section style={st.card}>
        <h2 style={st.cardTitle}><TrendUp size={16} style={{ verticalAlign: -2 }} /> Meilleures publications</h2>
        {stats.topPosts.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Pas encore de statistiques d'engagement — publie et actualise les stats.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats.topPosts.map(({ post, engagement }) => {
              const thumb = post.media_urls[0]
              const likes = post.targets.reduce((s, t) => s + (t.like_count ?? 0), 0)
              const comments = post.targets.reduce((s, t) => s + (t.comment_count ?? 0), 0)
              return (
                <div key={post.id} style={st.topRow}>
                  {thumb && (
                    <div style={st.topThumb}>
                      <Image src={thumb} alt="" fill sizes="40px" style={{ objectFit: 'cover' }} />
                    </div>
                  )}
                  <p style={st.topBody}>{post.body || <em style={{ color: 'var(--text-muted)' }}>(image seule)</em>}</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {post.targets.filter(t => t.status === 'published').map(t => {
                      const meta = PLATFORM_META[t.platform]
                      return meta ? <meta.Icon key={t.id} size={13} weight="fill" style={{ color: meta.color }} /> : null
                    })}
                  </div>
                  <span style={st.topStats}>
                    <Heart size={12} weight="fill" /> {likes} <ChatCircle size={12} weight="fill" style={{ marginLeft: 6 }} /> {comments}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

const st: Record<string, any> = {
  refreshBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 13px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
    background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer',
  },
  tileRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14,
  },
  tile: {
    display: 'flex', flexDirection: 'column', gap: 4,
    padding: '16px 18px', borderRadius: 12,
    background: 'var(--surface)', border: '1px solid var(--border)',
  },
  tileValue: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 26, color: 'var(--text)',
  },
  tileLabel: {
    fontSize: 12, color: 'var(--text-muted)',
  },
  statusRow: {
    display: 'flex', gap: 16, flexWrap: 'wrap' as const, fontSize: 12.5, fontWeight: 600,
  },
  statusChip: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
  },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 14, padding: 20,
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  cardTitle: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 17, margin: 0,
  },
  topRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 10px', borderRadius: 9,
    background: 'var(--bg-2)', border: '1px solid var(--border)',
  },
  topThumb: {
    position: 'relative' as const, width: 36, height: 36, borderRadius: 6, overflow: 'hidden',
    flexShrink: 0, border: '1px solid var(--border)',
  },
  topBody: {
    flex: 1, minWidth: 0, margin: 0, fontSize: 13,
    overflow: 'hidden', textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const,
  },
  topStats: {
    display: 'inline-flex', alignItems: 'center', fontSize: 12, color: 'var(--text-2)', flexShrink: 0, gap: 3,
  },
}
