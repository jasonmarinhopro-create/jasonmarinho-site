'use client'

// Admin — comptes Investisseurs (4e espace). Même famille visuelle que
// /dashboard/admin/membres : stats en haut, recherche, cartes.
// Chaque carte montre les projets d'acquisition sauvegardés depuis
// l'estimateur, avec lien vers la fiche membre complète.

import { useState } from 'react'
import {
  Briefcase, MagnifyingGlass, X, ArrowSquareOut,
  MapPin, CurrencyEur, FolderOpen,
} from '@phosphor-icons/react/dist/ssr'

export interface InvestorProject {
  id: string
  user_id: string
  nom: string
  ville: string | null
  pays: string
  type_logement: string
  prix_achat: number | null
  mensualite: number | null
  created_at: string
}

export interface InvestorRow {
  id: string
  email: string
  full_name: string | null
  plan: string
  created_at: string
  projects: InvestorProject[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function initials(name: string | null, email: string) {
  if (name) return name.split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return email[0].toUpperCase()
}

function fmtEur(n: number) {
  return n.toLocaleString('fr-FR') + ' €'
}

export default function InvestisseursAdmin({ investors, totalProjects }: { investors: InvestorRow[]; totalProjects: number }) {
  const [search, setSearch] = useState('')

  const filtered = investors.filter(inv => {
    const q = search.toLowerCase()
    if (!q) return true
    return inv.email.toLowerCase().includes(q)
      || (inv.full_name ?? '').toLowerCase().includes(q)
      || inv.projects.some(p => p.nom.toLowerCase().includes(q) || (p.ville ?? '').toLowerCase().includes(q))
  })

  const activeCount = investors.filter(inv => inv.projects.length > 0).length

  return (
    <div style={s.wrap}>
      {/* ── Header ── */}
      <div>
        <h2 style={s.title}>
          Admin <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>Investisseurs</em>
        </h2>
        <p style={s.desc}>
          Comptes inscrits via la carte « Investisseur » ou marqués depuis la page Membres,
          avec leurs projets d&apos;acquisition sauvegardés depuis l&apos;estimateur.
        </p>
      </div>

      {/* ── Stats ── */}
      <div style={s.statsRow}>
        {[
          { icon: <Briefcase size={16} weight="fill" />, value: investors.length, label: 'investisseur' + (investors.length > 1 ? 's' : ''), color: '#60BEFF' },
          { icon: <FolderOpen size={16} weight="fill" />, value: totalProjects, label: 'projet' + (totalProjects > 1 ? 's' : '') + ' analysé' + (totalProjects > 1 ? 's' : ''), color: 'var(--accent-text)' },
          { icon: <CurrencyEur size={16} />, value: activeCount, label: 'avec au moins 1 projet', color: 'var(--success-1)' },
        ].map(({ icon, value, label, color }) => (
          <div key={label} style={s.statChip}>
            <span style={{ color, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
            <span style={{ ...s.statNum, color }}>{value}</span>
            <span style={s.statLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Recherche ── */}
      <div style={s.searchWrap}>
        <MagnifyingGlass size={14} color="var(--text-muted)" />
        <input
          type="search"
          placeholder="Nom, email, projet, ville…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={s.searchInput}
        />
        {search && (
          <button onClick={() => setSearch('')} style={s.clearBtn}><X size={13} /></button>
        )}
      </div>

      {/* ── Liste ── */}
      {filtered.length === 0 ? (
        <div style={s.empty}>
          <Briefcase size={32} color="var(--text-muted)" />
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
            {investors.length === 0
              ? 'Aucun compte investisseur pour l’instant. Tu peux marquer un membre comme investisseur depuis la page Membres (bouton mallette).'
              : `Aucun investisseur pour « ${search} ».`}
          </p>
        </div>
      ) : (
        <div style={s.grid}>
          {filtered.map(inv => (
            <div key={inv.id} style={s.card}>
              <div style={s.cardTop}>
                <div style={s.avatar}>
                  <span style={s.avatarText}>{initials(inv.full_name, inv.email)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.name}>{inv.full_name || inv.email.split('@')[0]}</div>
                  <div style={s.email}>{inv.email}</div>
                  <div style={s.meta}>Inscrit le {formatDate(inv.created_at)}</div>
                </div>
                <a href={`/dashboard/admin/membres/${inv.id}`} style={s.ficheBtn} title="Fiche membre complète">
                  <ArrowSquareOut size={13} />
                </a>
              </div>

              {/* Projets */}
              <div style={s.projectsBlock}>
                <div style={s.projectsLabel}>
                  {inv.projects.length === 0
                    ? 'Aucun projet sauvegardé'
                    : `${inv.projects.length} projet${inv.projects.length > 1 ? 's' : ''} d’acquisition`}
                </div>
                {inv.projects.slice(0, 3).map(p => (
                  <div key={p.id} style={s.projectRow}>
                    <span style={s.projectName}>{p.nom}</span>
                    <span style={s.projectMeta}>
                      {p.ville && <><MapPin size={10} weight="fill" /> {p.ville} · </>}
                      {p.type_logement.toUpperCase()}
                      {p.prix_achat != null && <> · {fmtEur(p.prix_achat)}</>}
                    </span>
                  </div>
                ))}
                {inv.projects.length > 3 && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    + {inv.projects.length - 3} autre{inv.projects.length - 3 > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '20px' },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(24px,3vw,32px)', fontWeight: 400,
    color: 'var(--text)', margin: 0,
  },
  desc: { fontSize: '13px', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.5, maxWidth: '560px' },

  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '10px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: 'clamp(12px, 2vw, 16px)',
  },
  statChip: {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '8px 12px', borderRadius: '10px',
    background: 'var(--bg-2)', border: '1px solid var(--border)',
    minWidth: 0,
  },
  statNum: { fontFamily: 'var(--font-fraunces), serif', fontSize: '20px', fontWeight: 500 },
  statLabel: { fontSize: '12px', color: 'var(--text-2)' },

  searchWrap: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '9px 14px', maxWidth: '420px',
  },
  searchInput: {
    background: 'none', border: 'none', outline: 'none',
    fontSize: '13px', color: 'var(--text)', width: '100%',
    fontFamily: 'var(--font-outfit), sans-serif',
  },
  clearBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-3)', display: 'flex', padding: '2px',
  },

  empty: {
    padding: '60px 20px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '12px', textAlign: 'center' as const,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '14px',
  },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-xl)', overflow: 'hidden',
    display: 'flex', flexDirection: 'column' as const,
  },
  cardTop: {
    display: 'flex', alignItems: 'flex-start', gap: '13px',
    padding: '18px 18px 14px',
  },
  avatar: {
    width: '48px', height: '48px', flexShrink: 0, borderRadius: '14px',
    background: 'rgba(96,190,255,0.12)', border: '1.5px solid rgba(96,190,255,0.28)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: 'var(--font-fraunces), serif', fontSize: '16px', fontWeight: 600, color: '#60BEFF' },
  name: {
    fontSize: '15px', fontWeight: 600, color: 'var(--text)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  email: {
    fontSize: '12px', color: 'var(--text-3)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  meta: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' },
  ficheBtn: {
    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
    background: 'var(--surface)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-3)', textDecoration: 'none' as const,
  },

  projectsBlock: {
    borderTop: '1px solid var(--border)',
    padding: '12px 18px 16px',
    display: 'flex', flexDirection: 'column' as const, gap: '8px',
  },
  projectsLabel: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const, color: 'var(--text-muted)',
  },
  projectRow: { display: 'flex', flexDirection: 'column' as const, gap: '2px' },
  projectName: { fontSize: '13px', fontWeight: 600, color: 'var(--text)' },
  projectMeta: {
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    fontSize: '11.5px', color: 'var(--text-2)',
  },
}
