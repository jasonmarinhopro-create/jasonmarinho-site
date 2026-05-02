'use client'

import { useState } from 'react'
import { Heart } from '@phosphor-icons/react/dist/ssr'
import type { BadgeId } from '@/lib/badges'
import { BADGES } from '@/lib/badges'

export interface ContributorTile {
  userId: string
  full_name: string | null
  created_at: string | null
  badges?: BadgeId[]
}

const TILE_PALETTES = [
  { bg: 'rgba(255,213,107,0.10)', border: 'rgba(255,213,107,0.28)', text: '#FFD56B' },
  { bg: 'rgba(167,139,250,0.09)', border: 'rgba(167,139,250,0.26)', text: '#a78bfa' },
  { bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.26)',  text: '#60a5fa' },
  { bg: 'rgba(52,211,153,0.07)',  border: 'rgba(52,211,153,0.26)',  text: '#34d399' },
  { bg: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.26)', text: '#fb7185' },
]

function getInitials(name: string | null): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

function formatJoined(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

export default function MurDesBatisseurs({ contributors }: { contributors: ContributorTile[] }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<string | null>(null)

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <div style={s.headLeft}>
          <Heart size={14} color="#FFD56B" weight="fill" />
          <span style={s.headTitle}>Mur des Bâtisseurs</span>
        </div>
        <span style={s.headCount}>
          {contributors.length} bâtisseur{contributors.length !== 1 ? 's' : ''}
        </span>
      </div>

      {contributors.length === 0 ? (
        <div style={s.empty}>
          <p style={s.emptyText}>Les premiers bâtisseurs arriveront bientôt…</p>
          <p style={s.emptyNote}>Ton nom apparaîtra ici dès ta contribution.</p>
        </div>
      ) : (
        <div style={s.mosaic}>
          {contributors.map((c, i) => {
            const palette  = TILE_PALETTES[i % TILE_PALETTES.length]
            const firstName = c.full_name?.split(/\s+/)[0] ?? 'Anonyme'
            const initials  = getInitials(c.full_name)
            const isHov     = hovered === c.userId
            const badges    = c.badges ?? []

            return (
              <div
                key={c.userId}
                onMouseEnter={() => setHovered(c.userId)}
                onMouseLeave={() => { setHovered(null); setTooltip(null) }}
                style={{
                  ...s.tile,
                  background:  palette.bg,
                  borderColor: palette.border,
                  transform:   isHov ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                  boxShadow:   isHov ? `0 10px 28px ${palette.border}` : 'none',
                }}
              >
                {/* Avatar */}
                <div style={{ ...s.avatar, background: `${palette.text}18`, color: palette.text }}>
                  {initials}
                </div>

                {/* Name */}
                <span style={s.tileName}>{firstName}</span>

                {/* Since */}
                {c.created_at && (
                  <span style={{ ...s.tileSince, color: `${palette.text}99` }}>
                    {formatJoined(c.created_at)}
                  </span>
                )}

                {/* Badges */}
                {badges.length > 0 && (
                  <div style={s.badgeRow}>
                    {badges.map(bid => (
                      <span
                        key={bid}
                        title={BADGES[bid].title}
                        onMouseEnter={e => { e.stopPropagation(); setTooltip(`${c.userId}-${bid}`) }}
                        onMouseLeave={e => { e.stopPropagation(); setTooltip(null) }}
                        style={{
                          ...s.badgeDot,
                          background: BADGES[bid].bg,
                          border: `1px solid ${BADGES[bid].color}44`,
                        }}
                      >
                        {BADGES[bid].label}
                        {tooltip === `${c.userId}-${bid}` && (
                          <span style={s.tooltipBox}>{BADGES[bid].title}</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p style={s.footer}>
        Chaque bâtisseur a un siège à la table, pour toujours.
      </p>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '16px' },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  headLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  headTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--text)' },
  headCount: {
    fontSize: '12px', color: 'var(--text-muted)',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '999px', padding: '3px 10px',
  },
  mosaic: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
    gap: '10px',
  },
  tile: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '5px', border: '1px solid', borderRadius: '16px',
    padding: '14px 8px 12px', cursor: 'default',
    transition: 'transform 0.2s, box-shadow 0.2s',
    position: 'relative',
  },
  avatar: {
    width: '40px', height: '40px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '15px', fontWeight: 700, lineHeight: 1,
    fontFamily: 'var(--font-fraunces), serif',
    flexShrink: 0,
  },
  tileName: {
    fontSize: '11px', color: 'var(--text-2)', fontWeight: 600,
    textAlign: 'center', lineHeight: 1.2, maxWidth: '80px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  tileSince: {
    fontSize: '10px', fontWeight: 400, lineHeight: 1, opacity: 0.8,
  },
  badgeRow: {
    display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
    gap: '3px', marginTop: '2px',
  },
  badgeDot: {
    fontSize: '10px', lineHeight: 1, borderRadius: '6px',
    padding: '2px 4px', cursor: 'default',
    position: 'relative', userSelect: 'none',
  },
  tooltipBox: {
    position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.85)', color: '#fff',
    fontSize: '11px', fontWeight: 400, lineHeight: 1.4,
    padding: '5px 9px', borderRadius: '8px',
    whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  empty: {
    textAlign: 'center', padding: '28px 20px',
    background: 'rgba(255,213,107,0.04)',
    border: '1px dashed rgba(255,213,107,0.2)',
    borderRadius: '16px',
  },
  emptyText: { fontSize: '14px', color: 'var(--text-2)', margin: '0 0 4px' },
  emptyNote: { fontSize: '12px', color: 'var(--text-muted)', margin: 0 },
  footer: {
    fontSize: '11px', color: 'var(--text-muted)',
    textAlign: 'center', margin: 0, fontStyle: 'italic',
  },
}
