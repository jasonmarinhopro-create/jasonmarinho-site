'use client'

// Onglet « Pilote automatique » (24/10/2026) : ce que fait la routine
// « Community manager » (posts programmés, résultats par format,
// commentaires et réponses, rapport du dimanche, règles du moment).
// Jason : « tu peux te servir de la partie réseaux sociaux dans le dashboard
// pour afficher des informations, entre les stats, les prochains posts prévus
// et tout ».

import Image from 'next/image'
import { Robot, CalendarBlank, Heart, ChatCircle, ArrowBendDownRight, FileText, Lightbulb, Clock, FilmStrip, Images, ImageSquare } from '@phosphor-icons/react/dist/ssr'
import { postFormat, autoSlug, coverOf, statsByFormat, type PostFormat } from '@/lib/social/autopilot'
import { nextDispatchRun } from '@/lib/social/dispatch-time'
import { PLATFORM_META } from './constants'
import type { SocialPostRow } from './SocialAdmin'

export interface SocialCommentRow {
  id: string
  platform: 'facebook' | 'instagram'
  text: string
  reply_text: string | null
  reply_status: 'nouveau' | 'a_envoyer' | 'envoye' | 'ignore' | 'echec'
  reply_error: string | null
  created_at: string
  replied_at: string | null
}

const FORMAT_META: Record<PostFormat, { label: string; Icon: typeof FilmStrip }> = {
  reel: { label: 'Reel', Icon: FilmStrip },
  carrousel: { label: 'Carrousel', Icon: Images },
  photo: { label: 'Photo', Icon: ImageSquare },
  texte: { label: 'Texte', Icon: FileText },
}

const REPLY_LABEL: Record<SocialCommentRow['reply_status'], [string, string, string]> = {
  nouveau: ['À traiter', 'var(--text-2)', 'var(--bg-2)'],
  a_envoyer: ['Réponse prête', '#8A5A12', 'rgba(255,213,107,.18)'],
  envoye: ['Répondu', 'var(--accent-text)', 'var(--accent-bg)'],
  ignore: ['Ignoré', 'var(--text-muted)', 'var(--bg-2)'],
  echec: ['Échec', 'var(--danger-text)', 'var(--danger-bg)'],
}

const fmtParis = (iso: string) => new Date(iso).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const firstLine = (b: string) => b.split('\n').find(l => l.trim()) ?? ''

/** Rendu sobre d'un Markdown simple (titres, puces, paragraphes), sans HTML injecté. */
function MiniMd({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {text.split('\n').map((line, i) => {
        const l = line.trimEnd()
        if (!l.trim()) return null
        if (/^#{1,3}\s/.test(l)) return <strong key={i} style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 15, fontWeight: 500, marginTop: 6 }}>{l.replace(/^#+\s/, '')}</strong>
        const bullet = /^\s*(-|\d+\.)\s/.test(l)
        return <p key={i} style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--text-2)', paddingLeft: bullet ? 12 : 0 }}>{bullet ? '· ' : ''}{l.replace(/^\s*(-|\d+\.)\s/, '').replace(/\*\*|`/g, '')}</p>
      })}
    </div>
  )
}

export default function SocialAutopilot({ posts, comments, report, learnings }: {
  posts: SocialPostRow[]
  comments: SocialCommentRow[]
  report: { date: string; text: string } | null
  learnings: string | null
}) {
  const auto = posts.filter(p => autoSlug(p.media_urls))
  const now = Date.now()
  const upcoming = auto.filter(p => p.status === 'scheduled' && p.scheduled_at).sort((a, b) => (a.scheduled_at! < b.scheduled_at! ? -1 : 1))
  const published = auto.filter(p => p.targets.some(t => t.status === 'published'))
  const byFormat = statsByFormat(published)
  const engagement = published.reduce((n, p) => n + p.targets.reduce((m, t) => m + (t.like_count ?? 0) + (t.comment_count ?? 0), 0), 0)
  const month = comments.filter(c => now - new Date(c.created_at).getTime() < 30 * 86_400_000)
  const answered = month.filter(c => c.reply_status === 'envoye').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={st.intro}>
        <Robot size={22} weight="duotone" style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-2)' }}>
          Le community manager passe chaque jour à 8 h 37 et 19 h 37. Un post tous les deux jours (Reel, carrousel ou photo), publié vers 18 h,
          réponses aux commentaires envoyées vers 10 h et 21 h, rapport le dimanche soir. Un post programmé peut être modifié ou supprimé dans l’onglet Composer avant son départ.
        </p>
      </div>

      <div style={st.tileRow}>
        <div style={st.tile}><span style={st.tileValue}>{upcoming[0]?.scheduled_at ? fmtParis(nextDispatchRun(new Date(upcoming[0].scheduled_at)).toISOString()) : 'Rien'}</span><span style={st.tileLabel}>Prochain départ</span></div>
        <div style={st.tile}><span style={st.tileValue}>{published.length}</span><span style={st.tileLabel}>Posts automatiques publiés</span></div>
        <div style={st.tile}><span style={st.tileValue}>{published.length ? Math.round((engagement / published.length) * 10) / 10 : 0}</span><span style={st.tileLabel}>J’aime + commentaires par post</span></div>
        <div style={st.tile}><span style={st.tileValue}>{answered} / {month.length}</span><span style={st.tileLabel}>Commentaires répondus (30 jours)</span></div>
      </div>

      <div style={st.grid}>
        <section style={st.card}>
          <h3 style={st.cardTitle}><CalendarBlank size={17} /> Programmés</h3>
          {upcoming.length === 0 ? <p style={st.empty}>Aucun post en attente. Le prochain est préparé au passage du matin, un jour sur deux.</p> : upcoming.map(p => <PostLine key={p.id} post={p} when={p.scheduled_at!} />)}
        </section>

        <section style={st.card}>
          <h3 style={st.cardTitle}><Heart size={17} /> Résultats par format</h3>
          {byFormat.length === 0 ? <p style={st.empty}>Les chiffres arrivent après les premières publications (mis à jour à 7 h 50 et 19 h 15).</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {byFormat.map(f => {
                const M = FORMAT_META[f.format]
                return (
                  <div key={f.format} style={st.row}>
                    <M.Icon size={16} style={{ color: 'var(--accent-text)' }} />
                    <strong style={{ fontSize: 13, flex: 1 }}>{M.label}</strong>
                    <span style={st.meta}>{f.posts} post{f.posts > 1 ? 's' : ''}</span>
                    <span style={st.meta}><Heart size={12} /> {f.likes}</span>
                    <span style={st.meta}><ChatCircle size={12} /> {f.comments}</span>
                    <span style={{ ...st.meta, fontWeight: 700, color: 'var(--text)' }}>{f.perPost} / post</span>
                  </div>
                )
              })}
            </div>
          )}
          {published.length > 0 && (
            <>
              <div style={st.sub}>Dernières publications</div>
              {published.slice(0, 5).map(p => <PostLine key={p.id} post={p} when={p.targets.find(t => t.published_at)?.published_at ?? p.created_at} stats />)}
            </>
          )}
        </section>
      </div>

      <section style={st.card}>
        <h3 style={st.cardTitle}><ChatCircle size={17} /> Commentaires et réponses</h3>
        {comments.length === 0 ? <p style={st.empty}>Aucun commentaire relevé pour l’instant. Ils sont relus à 7 h 50 et 19 h 15 sur les posts des trois dernières semaines.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {comments.slice(0, 25).map(c => {
              const meta = PLATFORM_META[c.platform]
              const [label, color, bg] = REPLY_LABEL[c.reply_status]
              return (
                <div key={c.id} style={{ ...st.row, alignItems: 'flex-start', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                    {meta && <meta.Icon size={14} weight="fill" style={{ color: meta.color }} />}
                    <span style={{ fontSize: 13, flex: 1, minWidth: 0 }}>{c.text}</span>
                    <span style={{ ...st.chip, color, background: bg }}>{label}</span>
                  </div>
                  {c.reply_text && (
                    <div style={{ display: 'flex', gap: 6, fontSize: 12.5, color: 'var(--text-2)', paddingLeft: 4 }}>
                      <ArrowBendDownRight size={14} style={{ flexShrink: 0, marginTop: 2 }} /> <span>{c.reply_text}</span>
                    </div>
                  )}
                  {c.reply_status === 'echec' && c.reply_error && <span style={{ fontSize: 11.5, color: 'var(--danger-text)' }}>{c.reply_error}</span>}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}><Clock size={11} /> {fmtParis(c.created_at)}</span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <div style={st.grid}>
        <section style={st.card}>
          <h3 style={st.cardTitle}><FileText size={17} /> Rapport de la semaine{report ? ` (${new Date(report.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })})` : ''}</h3>
          {report ? <MiniMd text={report.text} /> : <p style={st.empty}>Le premier rapport arrive dimanche soir.</p>}
        </section>
        <section style={st.card}>
          <h3 style={st.cardTitle}><Lightbulb size={17} /> Règles du moment</h3>
          {learnings ? <MiniMd text={learnings} /> : <p style={st.empty}>Indisponible pour l’instant.</p>}
        </section>
      </div>
    </div>
  )
}

function PostLine({ post, when, stats }: { post: SocialPostRow; when: string; stats?: boolean }) {
  const cover = coverOf(post.media_urls)
  const M = FORMAT_META[postFormat(post.media_urls)]
  return (
    <div style={st.row}>
      {cover && <div style={st.thumb}><Image src={cover} alt="" fill sizes="48px" style={{ objectFit: 'cover' }} /></div>}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstLine(post.body)}</span>
        <span style={st.meta}><M.Icon size={12} /> {M.label} · {fmtParis(when)}</span>
      </div>
      {stats && post.targets.filter(t => t.status === 'published').map(t => {
        const meta = PLATFORM_META[t.platform]
        return meta ? <span key={t.id} style={st.meta}><meta.Icon size={12} weight="fill" style={{ color: meta.color }} /> {t.like_count ?? 0} <Heart size={11} /> {t.comment_count ?? 0} <ChatCircle size={11} /></span> : null
      })}
    </div>
  )
}

const st: Record<string, React.CSSProperties> = {
  intro: { display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 12, background: 'var(--accent-bg)', border: '1px solid var(--border)' },
  tileRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 },
  tile: { display: 'flex', flexDirection: 'column', gap: 4, padding: '16px 18px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' },
  tileValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: 22, color: 'var(--text)' },
  tileLabel: { fontSize: 12, color: 'var(--text-muted)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 20, alignItems: 'start' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 },
  cardTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 17, fontWeight: 500, margin: 0, display: 'flex', alignItems: 'center', gap: 8 },
  sub: { fontSize: 11.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 6 },
  row: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--border)', minWidth: 0 },
  thumb: { position: 'relative', width: 44, height: 55, borderRadius: 7, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' },
  meta: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)', flexShrink: 0 },
  chip: { fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, flexShrink: 0 },
  empty: { margin: 0, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.55 },
}
