'use client'

import { useState } from 'react'
import { Heart } from '@phosphor-icons/react'

export interface ContributorTile {
  userId: string
  full_name: string | null
  created_at: string | null
}

const TILE_PALETTES = [
  { bg: 'rgba(255,213,107,0.13)', border: 'rgba(255,213,107,0.32)', text: '#FFD56B' },
  { bg: 'rgba(167,139,250,0.11)', border: 'rgba(167,139,250,0.28)', text: '#a78bfa' },
  { bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.28)',  text: '#60a5fa' },
  { bg: 'rgba(52,211,153,0.09)',  border: 'rgba(52,211,153,0.28)',  text: '#34d399' },
  { bg: 'rgba(251,113,133,0.10)', border: 'rgba(251,113,133,0.28)', text: '#fb7185' },
]

function getInitials(name: string | null): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

function formatJoined(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export default function MurDesBatisseurs({ contributors }: { contributors: ContributorTile[] }) {
  const [hovered, setHovered] = useState<string | null>(null)

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
            const palette = TILE_PALETTES[i % TILE_PALETTES.length]
            const firstName = c.full_name?.split(/\s+/)[0] ?? 'Anonyme'
            const initials  = getInitials(c.full_name)
            const isHov     = hovered === c.userId

            return (
              <div
                key={c.userId}
                onMouseEnter={() => setHovered(c.userId)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  ...s.tile,
                  background:   isHov ? palette.bg.replace('0.13', '0.22').replace('0.11', '0.2').replace('0.10', '0.18').replace('0.09', '0.16') : palette.bg,
                  borderColor:  palette.border,
                  transform:    isHov ? 'translateY(-3px)' : 'translateY(0)',
                  boxShadow:    isHov ? `0 8px 24px ${palette.border}` : 'none',
                }}
              >
                <span style={{ ...s.tileInitials, color: palette.text }}>{initials}</span>
                <span style={s.tileName}>{firstName}</span>
                {isHov && c.created_at && (
                  <span style={{ ...s.tileSince, color: palette.text }}>
                    depuis {formatJoined(c.created_at)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p style={s.footer}>
        Chaque bâtisseur a un siège à la table — pour toujours.
      </p>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex', flexDirection: 'column', gap: '16px',
  },
  head: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  headLeft: {
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  headTitle: {
    fontSize: '15px', fontWeight: 600, color: 'var(--text)',
  },
  headCount: {
    fontSize: '12px', color: 'var(--text-muted)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '999px', padding: '3px 10px',
  },
  mosaic: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))',
    gap: '10px',
  },
  tile: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: '5px',
    border: '1px solid',
    borderRadius: '14px',
    padding: '14px 8px',
    cursor: 'default',
    transition: 'transform 0.18s, box-shadow 0.18s, background 0.18s',
    minHeight: '80px',
    position: 'relative',
  },
  tileInitials: {
    fontSize: '20px', fontWeight: 700, lineHeight: 1,
    fontFamily: 'var(--font-fraunces), serif',
  },
  tileName: {
    fontSize: '11px', color: 'var(--text-2)', fontWeight: 500,
    textAlign: 'center', lineHeight: 1.2, maxWidth: '64px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  tileSince: {
    fontSize: '10px', fontWeight: 500, lineHeight: 1,
    position: 'absolute', bottom: '6px',
  },
  empty: {
    textAlign: 'center', padding: '28px 20px',
    background: 'rgba(255,213,107,0.04)',
    border: '1px dashed rgba(255,213,107,0.2)',
    borderRadius: '16px',
  },
  emptyText: {
    fontSize: '14px', color: 'var(--text-2)', margin: '0 0 4px',
  },
  emptyNote: {
    fontSize: '12px', color: 'var(--text-muted)', margin: 0,
  },
  footer: {
    fontSize: '11px', color: 'var(--text-muted)',
    textAlign: 'center', margin: 0,
    fontStyle: 'italic',
  },
}
