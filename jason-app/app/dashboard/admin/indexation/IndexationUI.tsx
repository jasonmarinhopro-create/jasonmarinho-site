'use client'

import { useMemo, useState } from 'react'
import { MagnifyingGlass, ArrowSquareOut, Warning, Info } from '@phosphor-icons/react/dist/ssr'

interface SitemapEntry {
  url: string
  lastmod: string | null
}

// Propriété Search Console utilisée pour le lien d'inspection — domaine
// vérifié en DNS (couvre http/https + sous-domaines), le cas le plus courant.
// Si jasonmarinho.com est plutôt vérifié comme propriété "préfixe d'URL"
// dans Search Console, ce lien tombera sur le sélecteur de propriété : à
// signaler pour ajuster resource_id vers "https://jasonmarinho.com/".
const GSC_RESOURCE_ID = 'sc-domain:jasonmarinho.com'

function inspectUrl(pageUrl: string): string {
  const params = new URLSearchParams({ resource_id: GSC_RESOURCE_ID, id: pageUrl })
  return `https://search.google.com/search-console/inspect?${params.toString()}`
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function IndexationUI({ entries, fetchError }: { entries: SitemapEntry[]; fetchError: string | null }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return entries
    return entries.filter(e => e.url.toLowerCase().includes(q))
  }, [entries, search])

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h1 style={s.title}>Indexation</h1>
        <p style={s.subtitle}>
          {entries.length} pages dans le sitemap. Clique sur une page pour ouvrir directement son inspection
          dans Google Search Console.
        </p>
      </div>

      <div style={s.infoBox}>
        <Info size={16} weight="fill" style={{ color: 'var(--accent-text)', flexShrink: 0, marginTop: '1px' }} />
        <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--text-2)' }}>
          Google ne permet pas de déclencher une demande d&apos;indexation automatiquement pour des pages classiques
          (seules les offres d&apos;emploi et diffusions en direct ont une API dédiée). Le bouton ouvre l&apos;outil
          d&apos;inspection d&apos;URL de Search Console, déjà pré-rempli avec la bonne page : il te reste juste à
          cliquer sur <strong style={{ color: 'var(--text)' }}>&laquo;&nbsp;Demander une indexation&nbsp;&raquo;</strong> dedans.
        </p>
      </div>

      {fetchError && (
        <div style={s.errorBox}>
          <Warning size={16} weight="fill" style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: 'var(--danger)' }}>
            Sitemap non récupéré ({fetchError}). Réessaie de recharger la page.
          </span>
        </div>
      )}

      <div style={s.searchWrap}>
        <MagnifyingGlass size={14} color="var(--text-muted)" />
        <input
          type="search" placeholder="Filtrer par URL…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={s.searchInput}
        />
      </div>

      <div style={s.list}>
        {filtered.length === 0 ? (
          <p style={s.empty}>Aucune page pour &laquo;&nbsp;{search}&nbsp;&raquo;.</p>
        ) : (
          filtered.map(e => (
            <a
              key={e.url}
              href={inspectUrl(e.url)}
              target="_blank"
              rel="noopener noreferrer"
              style={s.row}
              className="jm-idx-row"
            >
              <span style={s.rowUrl}>{e.url.replace('https://jasonmarinho.com', '') || '/'}</span>
              <span style={s.rowDate}>{fmtDate(e.lastmod)}</span>
              <ArrowSquareOut size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </a>
          ))
        )}
      </div>

      <style>{`
        .jm-idx-row:hover { background: var(--surface) !important; border-color: var(--border-2) !important; }
      `}</style>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '760px' },
  header: { marginBottom: '4px' },
  title: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '26px', fontWeight: 500,
    color: 'var(--text)', margin: '0 0 6px',
  },
  subtitle: { fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 },
  infoBox: {
    display: 'flex', gap: '10px', alignItems: 'flex-start',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '14px 16px',
  },
  errorBox: {
    display: 'flex', gap: '8px', alignItems: 'center',
    background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
    borderRadius: '10px', padding: '10px 14px',
  },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '9px 14px',
  },
  searchInput: {
    background: 'none', border: 'none', outline: 'none',
    fontSize: '13px', color: 'var(--text)', width: '100%', fontFamily: 'var(--font-outfit), sans-serif',
  },
  list: {
    display: 'flex', flexDirection: 'column', gap: '2px',
    maxHeight: '65vh', overflowY: 'auto',
    border: '1px solid var(--border)', borderRadius: '12px',
    padding: '6px',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '9px 10px', borderRadius: '8px',
    border: '1px solid transparent',
    textDecoration: 'none',
    transition: 'background 0.1s, border-color 0.1s',
  },
  rowUrl: {
    flex: 1, minWidth: 0,
    fontSize: '13px', color: 'var(--text)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    fontFamily: 'ui-monospace, monospace',
  },
  rowDate: {
    fontSize: '11.5px', color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap',
  },
  empty: { fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', margin: 0 },
}
