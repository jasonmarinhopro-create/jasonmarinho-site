'use client'

import { useState } from 'react'
import { HouseLine, Coffee, Buildings, Handshake, Table, ArrowRight, CheckCircle, MinusCircle } from '@phosphor-icons/react/dist/ssr'

type Cell = { value: string; tone?: 'ok' | 'warn' | 'neutral' }

const PROFILES = [
  { id: 'gites',        label: 'Gîtes',               icon: HouseLine, color: '#d97706', bg: 'rgba(245,158,11,0.10)' },
  { id: 'chambres',     label: "Chambres d'hôtes",    icon: Coffee,    color: '#db2777', bg: 'rgba(236,72,153,0.10)' },
  { id: 'conciergerie', label: 'Conciergeries',       icon: Buildings, color: '#7c3aed', bg: 'rgba(139,92,246,0.10)' },
  { id: 'direct',       label: 'Réservation directe', icon: Handshake, color: '#059669', bg: 'rgba(16,185,129,0.10)' },
] as const

type ProfileId = (typeof PROFILES)[number]['id']

interface Row {
  label: string
  values: Record<ProfileId, Cell>
}

const ROWS: Row[] = [
  {
    label: 'Statut juridique typique',
    values: {
      gites:        { value: 'EI ou SASU', tone: 'neutral' },
      chambres:     { value: 'EI (souvent)', tone: 'neutral' },
      conciergerie: { value: 'Micro / SASU', tone: 'neutral' },
      direct:       { value: 'EI (avec gîte)', tone: 'neutral' },
    },
  },
  {
    label: 'Plafond micro-BIC / micro-entreprise',
    values: {
      gites:        { value: '77 700 € (classé)\n15 000 € (non classé)', tone: 'neutral' },
      chambres:     { value: '77 700 €', tone: 'neutral' },
      conciergerie: { value: '77 700 € (presta)', tone: 'neutral' },
      direct:       { value: 'Idem gîte', tone: 'neutral' },
    },
  },
  {
    label: 'Abattement micro-BIC',
    values: {
      gites:        { value: '71 % classé / 30 % non classé', tone: 'warn' },
      chambres:     { value: '71 % classé / 50 % non classé', tone: 'ok' },
      conciergerie: { value: '50 % (presta de services)', tone: 'neutral' },
      direct:       { value: 'Selon le bien (gîte/chambre)', tone: 'neutral' },
    },
  },
  {
    label: 'TVA',
    values: {
      gites:        { value: 'Non (sauf classé + repas/services)', tone: 'ok' },
      chambres:     { value: '10 % petit-déj > 37 500 €', tone: 'warn' },
      conciergerie: { value: '20 % obligatoire > 36 800 €', tone: 'warn' },
      direct:       { value: 'Idem gîte', tone: 'ok' },
    },
  },
  {
    label: 'Carte pro / Loi Hoguet',
    values: {
      gites:        { value: 'Non', tone: 'ok' },
      chambres:     { value: 'Non', tone: 'ok' },
      conciergerie: { value: 'Oui si encaissement loyers', tone: 'warn' },
      direct:       { value: 'Non', tone: 'ok' },
    },
  },
  {
    label: 'Présence sur place',
    values: {
      gites:        { value: 'Non requise', tone: 'ok' },
      chambres:     { value: 'Obligatoire', tone: 'warn' },
      conciergerie: { value: 'Mandataire', tone: 'neutral' },
      direct:       { value: 'Non requise', tone: 'ok' },
    },
  },
  {
    label: 'Plafond chambres / capacité',
    values: {
      gites:        { value: 'Pas de plafond', tone: 'ok' },
      chambres:     { value: 'Max 5 ch. / 15 pers.', tone: 'warn' },
      conciergerie: { value: 'Selon biens gérés', tone: 'neutral' },
      direct:       { value: 'Selon le bien', tone: 'neutral' },
    },
  },
  {
    label: 'Plateformes adaptées',
    values: {
      gites:        { value: 'Airbnb, Booking, Vrbo, Driing', tone: 'ok' },
      chambres:     { value: 'Gîtes de France, Booking, Driing', tone: 'ok' },
      conciergerie: { value: 'Toutes (multi-comptes)', tone: 'ok' },
      direct:       { value: 'Site propre + Driing', tone: 'ok' },
    },
  },
  {
    label: 'Assurance spécifique',
    values: {
      gites:        { value: 'LCD ou multirisque PNO', tone: 'warn' },
      chambres:     { value: 'Multirisque + RC pro', tone: 'warn' },
      conciergerie: { value: 'RC pro obligatoire', tone: 'warn' },
      direct:       { value: 'LCD + caution Swikly', tone: 'warn' },
    },
  },
]

function ToneIcon({ tone }: { tone?: Cell['tone'] }) {
  if (tone === 'ok') return <CheckCircle size={11} weight="fill" color="#10b981" />
  if (tone === 'warn') return <MinusCircle size={11} weight="fill" color="#f59e0b" />
  return null
}

export default function ComparisonTable() {
  const [open, setOpen] = useState(false)

  return (
    <div style={s.wrap} className="fade-up">
      <button onClick={() => setOpen(o => !o)} style={s.toggle} aria-expanded={open}>
        <span style={s.toggleLeft}>
          <span style={s.toggleIcon}>
            <Table size={16} weight="fill" />
          </span>
          <div style={{ textAlign: 'left' as const }}>
            <div style={s.toggleTitle}>Tableau comparatif des 4 profils</div>
            <div style={s.toggleDesc}>Statut, fiscalité, TVA, plafonds, plateformes, d&apos;un coup d&apos;œil</div>
          </div>
        </span>
        <span style={{ ...s.chevron, transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          <ArrowRight size={14} weight="bold" />
        </span>
      </button>

      {open && (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.thLabel}></th>
                {PROFILES.map(p => {
                  const Icon = p.icon
                  return (
                    <th key={p.id} style={{ ...s.th, color: p.color }}>
                      <div style={{ ...s.thChip, background: p.bg }}>
                        <Icon size={12} weight="fill" />
                        {p.label}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, ri) => (
                <tr key={ri}>
                  <td style={s.tdLabel}>{row.label}</td>
                  {PROFILES.map(p => {
                    const cell = row.values[p.id]
                    return (
                      <td key={p.id} style={s.td}>
                        <div style={s.cellInner}>
                          <ToneIcon tone={cell.tone} />
                          <span style={s.cellText}>
                            {cell.value.split('\n').map((line, i) => (
                              <span key={i}>
                                {i > 0 && <br />}
                                {line}
                              </span>
                            ))}
                          </span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    marginBottom: '24px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    overflow: 'hidden' as const,
  },
  toggle: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: '100%',
    padding: '16px 20px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text)',
    fontFamily: 'inherit',
    gap: '12px',
  },
  toggleLeft: {
    display: 'inline-flex', alignItems: 'center', gap: '12px',
  },
  toggleIcon: {
    width: '32px', height: '32px', borderRadius: '9px',
    background: 'var(--accent-bg)',
    color: 'var(--accent-text)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  toggleTitle: {
    fontSize: '14px', fontWeight: 500,
    color: 'var(--text)',
    marginBottom: '2px',
  },
  toggleDesc: {
    fontSize: '12px', fontWeight: 300,
    color: 'var(--text-3)',
  },
  chevron: {
    color: 'var(--text-3)',
    transition: 'transform 0.2s',
    display: 'flex',
  },

  tableWrap: {
    overflowX: 'auto' as const,
    borderTop: '1px solid var(--border)',
    padding: '8px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '12.5px',
    minWidth: '720px',
  },
  thLabel: {
    padding: '12px 14px',
    textAlign: 'left' as const,
    background: 'transparent',
  },
  th: {
    padding: '12px 8px',
    textAlign: 'left' as const,
    fontWeight: 500,
  },
  thChip: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '5px 10px',
    borderRadius: '100px',
    fontSize: '11px', fontWeight: 600,
  },
  tdLabel: {
    padding: '12px 14px',
    fontSize: '12px', fontWeight: 500,
    color: 'var(--text-2)',
    borderTop: '1px solid var(--border)',
    verticalAlign: 'top' as const,
    width: '180px',
  },
  td: {
    padding: '12px 14px',
    color: 'var(--text-2)',
    borderTop: '1px solid var(--border)',
    verticalAlign: 'top' as const,
    fontWeight: 300,
  },
  cellInner: {
    display: 'flex', alignItems: 'flex-start', gap: '6px',
    lineHeight: 1.45,
  },
  cellText: { flex: 1, minWidth: 0 },
}
