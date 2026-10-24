'use client'

// Onglet « Commentaires » (24/10/2026) : les commentaires laissés sous les
// publications Facebook et Instagram et la réponse publique écrite par le
// community manager. Remplace l'ancien onglet « Réponses auto » (messages
// privés par mot-clé, retirés). Circuit : lib/social/comments.ts et
// scripts/social/commentaires.mjs.

import { useState } from 'react'
import { ChatCircle, ArrowBendDownRight, Clock, ArrowsClockwise, PencilSimpleLine, PaperPlaneTilt } from '@phosphor-icons/react/dist/ssr'
import { PLATFORM_META } from './constants'
import type { SocialCommentRow } from './SocialAutopilot'

type Filter = 'tous' | 'attente' | 'envoye' | 'ignore' | 'echec'

const REPLY_LABEL: Record<SocialCommentRow['reply_status'], [string, string, string]> = {
  nouveau: ['À traiter', 'var(--text-2)', 'var(--bg-2)'],
  a_envoyer: ['Réponse prête', '#8A5A12', 'rgba(255,213,107,.18)'],
  envoye: ['Répondu', 'var(--accent-text)', 'var(--accent-bg)'],
  ignore: ['Ignoré', 'var(--text-muted)', 'var(--bg-2)'],
  echec: ['Échec', 'var(--danger-text)', 'var(--danger-bg)'],
}

const FILTERS: Array<[Filter, string, (c: SocialCommentRow) => boolean]> = [
  ['tous', 'Tous', () => true],
  ['attente', 'En cours', c => c.reply_status === 'nouveau' || c.reply_status === 'a_envoyer'],
  ['envoye', 'Répondus', c => c.reply_status === 'envoye'],
  ['ignore', 'Ignorés', c => c.reply_status === 'ignore'],
  ['echec', 'Échecs', c => c.reply_status === 'echec'],
]

const fmtParis = (iso: string) => new Date(iso).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function SocialComments({ comments }: { comments: SocialCommentRow[] }) {
  const [filter, setFilter] = useState<Filter>('tous')
  const shown = comments.filter(FILTERS.find(f => f[0] === filter)![2])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={st.steps}>
        {[
          [ArrowsClockwise, 'Relevés', 'deux fois par jour, sur les posts des trois dernières semaines'],
          [PencilSimpleLine, 'Réponse écrite', 'par le community manager à son passage (8 h 37 et 19 h 37)'],
          [PaperPlaneTilt, 'Publiée', 'en public sous le commentaire, dans la foulée'],
        ].map(([Icon, title, desc], i) => {
          const I = Icon as typeof ChatCircle
          return (
            <div key={i} style={st.step}>
              <I size={18} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, lineHeight: 1.45 }}><strong>{title as string}</strong> {desc as string}</span>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FILTERS.map(([key, label, f]) => {
          const n = comments.filter(f).length
          const on = filter === key
          return (
            <button key={key} type="button" onClick={() => setFilter(key)} style={{ ...st.chipBtn, ...(on ? st.chipOn : {}) }}>
              {label} <span style={{ opacity: .7 }}>{n}</span>
            </button>
          )
        })}
      </div>

      <section style={st.card}>
        {shown.length === 0 ? (
          <p style={st.empty}>
            {comments.length === 0
              ? 'Aucun commentaire pour l’instant. Ils apparaîtront ici dès que les gens réagiront aux publications.'
              : 'Rien dans cette catégorie.'}
          </p>
        ) : shown.map(c => {
          const meta = PLATFORM_META[c.platform]
          const [label, color, bg] = REPLY_LABEL[c.reply_status]
          return (
            <div key={c.id} style={st.row}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%' }}>
                {meta && <meta.Icon size={15} weight="fill" style={{ color: meta.color, flexShrink: 0, marginTop: 2 }} />}
                <span style={{ fontSize: 13.5, flex: 1, minWidth: 0, lineHeight: 1.5 }}>{c.text}</span>
                <span style={{ ...st.chip, color, background: bg }}>{label}</span>
              </div>
              {c.reply_text && (
                <div style={{ display: 'flex', gap: 6, fontSize: 13, color: 'var(--text-2)', paddingLeft: 23, lineHeight: 1.5 }}>
                  <ArrowBendDownRight size={14} style={{ flexShrink: 0, marginTop: 3 }} /> <span>{c.reply_text}</span>
                </div>
              )}
              {c.reply_status === 'echec' && c.reply_error && <span style={{ fontSize: 11.5, color: 'var(--danger-text)', paddingLeft: 23 }}>{c.reply_error}</span>}
              <span style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 23, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} /> {fmtParis(c.created_at)}{c.replied_at ? ` · répondu ${fmtParis(c.replied_at)}` : ''}
              </span>
            </div>
          )
        })}
      </section>
    </div>
  )
}

const st: Record<string, React.CSSProperties> = {
  steps: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 10 },
  step: { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' },
  chipBtn: { display: 'inline-flex', gap: 6, alignItems: 'center', padding: '7px 13px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  chipOn: { border: '1px solid var(--accent-text)', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 },
  row: { display: 'flex', flexDirection: 'column', gap: 6, padding: '11px 12px', borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--border)', minWidth: 0 },
  chip: { fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, flexShrink: 0 },
  empty: { margin: 0, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.55 },
}
