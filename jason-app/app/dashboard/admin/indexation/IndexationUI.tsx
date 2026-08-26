'use client'

import { useMemo, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  MagnifyingGlass, ArrowSquareOut, Warning, Info, ArrowClockwise, CaretDown, CaretUp, Eye, GoogleLogo, Copy, Check,
} from '@phosphor-icons/react/dist/ssr'
import { refreshIndexationNow } from './actions'

// Dupliqué (pas importé) de lib/google/search-console.ts : ce fichier
// importe le module Node `crypto` (côté serveur, via lib/security/crypto.ts),
// pas bundlable côté client.
//
// Le lien "inspect?resource_id=...&id=..." avec l'URL pré-remplie n'est pas
// un endpoint documenté par Google (juste observé dans certains emails
// Search Console) — testé deux fois avec différents encodages, 404
// systématique. On se rabat sur un lien garanti stable : la propriété elle-
// même, avec un bouton "copier l'URL" pour la coller dans la barre de
// recherche du Search Console une fois arrivé.
const SEARCH_CONSOLE_SITE_URL = 'sc-domain:jasonmarinho.com'
function searchConsolePropertyLink(): string {
  return `https://search.google.com/search-console?resource_id=${SEARCH_CONSOLE_SITE_URL}`
}

export interface PageStatus {
  url: string
  path: string
  lastmod: string | null
  httpStatus: number | null
  coverageState: string | null
  indexed: boolean
  // Lien direct renvoyé par l'API Google pour la dernière vérification —
  // absent tant que la page n'a jamais été vérifiée via l'API.
  inspectionLink: string | null
  lastCheckedAt: string | null
  error: string | null
}

type Tab = 'jamais' | 'pas_indexees' | 'indexees' | 'toutes'

function fmtDate(d: string | null): string {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(d: string | null): string {
  if (!d) return 'jamais'
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Traductions des coverageState renvoyés par l'API Search Console — liste
// non exhaustive (Google en a une trentaine), les plus fréquentes sur un
// site de ce type.
const COVERAGE_LABELS: Record<string, string> = {
  'Submitted and indexed': 'Indexée',
  'Indexed, not submitted in sitemap': 'Indexée',
  'Discovered - currently not indexed': 'Détectée, pas encore explorée',
  'Crawled - currently not indexed': 'Explorée, pas indexée',
  'URL is unknown to Google': 'Inconnue de Google',
  'Duplicate without user-selected canonical': 'Doublon (canonical ambigu)',
  'Duplicate, Google chose different canonical than user': 'Doublon (canonical ignoré)',
  'Alternate page with proper canonical tag': 'Page alternative (canonical correct)',
  'Excluded by ’noindex’ tag': 'Exclue (noindex)',
  'Blocked by robots.txt': 'Bloquée (robots.txt)',
  'Not found (404)': 'Page introuvable (404)',
  'Page with redirect': 'Redirection',
}

function statusBadge(p: PageStatus): { label: string; color: string; bg: string } {
  if (p.httpStatus && p.httpStatus >= 400) return { label: `Page ${p.httpStatus}`, color: '#ef4444', bg: 'rgba(239,68,68,0.10)' }
  if (!p.lastCheckedAt) return { label: 'Jamais vérifiée', color: 'var(--text-muted)', bg: 'var(--surface)' }
  if (p.error) return { label: 'Erreur de vérification', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' }
  if (p.indexed) return { label: 'Indexée', color: '#4ade80', bg: 'rgba(74,222,128,0.10)' }
  const label = (p.coverageState && COVERAGE_LABELS[p.coverageState]) || p.coverageState || 'Pas indexée'
  return { label, color: '#60a5fa', bg: 'rgba(96,165,250,0.10)' }
}

export default function IndexationUI({ pages, fetchError, lastChecked, apiConfigured }: {
  pages: PageStatus[]
  fetchError: string | null
  lastChecked: string | null
  apiConfigured: boolean
}) {
  const [search, setSearch] = useState('')
  // Tant que l'API n'est pas configurée, tout est "jamais vérifié" — partir
  // sur cet onglet plutôt que "Pas encore dans Google" (qui affiche 0 et
  // laisse croire que la page est cassée).
  const [tab, setTab] = useState<Tab>(apiConfigured ? 'pas_indexees' : 'jamais')
  const [bannerOpen, setBannerOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [refreshMsg, setRefreshMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const searchParams = useSearchParams()
  const googleConnected = searchParams.get('google_connected') === '1'
  const googleError = searchParams.get('google_error')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 1500)
    }).catch(() => {})
  }

  const notPublished = useMemo(() => pages.filter(p => p.httpStatus && p.httpStatus >= 400), [pages])
  const live = useMemo(() => pages.filter(p => !p.httpStatus || p.httpStatus < 400), [pages])
  const neverChecked = useMemo(() => live.filter(p => !p.lastCheckedAt), [live])
  const notIndexed = useMemo(() => live.filter(p => p.lastCheckedAt && !p.indexed), [live])
  const indexed = useMemo(() => live.filter(p => p.indexed), [live])

  const byTab: Record<Tab, PageStatus[]> = {
    jamais: neverChecked,
    pas_indexees: notIndexed,
    indexees: indexed,
    toutes: pages,
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = byTab[tab]
    if (!q) return list
    return list.filter(p => p.path.toLowerCase().includes(q))
  }, [byTab, tab, search])

  function handleRefresh() {
    setRefreshMsg(null)
    startTransition(async () => {
      const res = await refreshIndexationNow()
      if (res.error) setRefreshMsg({ type: 'err', text: res.error })
      else setRefreshMsg({ type: 'ok', text: `${res.checked} pages vérifiées.` })
    })
  }

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Indexation Google</h1>
          <p style={s.subtitle}>Dernière vérification {lastChecked ? fmtDateTime(lastChecked) : 'jamais'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {refreshMsg && (
            <span style={{ fontSize: '12.5px', color: refreshMsg.type === 'ok' ? 'var(--success-1)' : 'var(--danger)' }}>
              {refreshMsg.text}
            </span>
          )}
          <button onClick={handleRefresh} disabled={isPending || !apiConfigured} style={{ ...s.refreshBtn, opacity: (isPending || !apiConfigured) ? 0.5 : 1 }}>
            <ArrowClockwise size={14} weight="bold" style={isPending ? { animation: 'spin 0.8s linear infinite' } : undefined} />
            Vérifier l&apos;indexation
          </button>
        </div>
      </div>

      {googleConnected && (
        <div style={s.infoBox}>
          <Info size={16} weight="fill" style={{ color: 'var(--success-1)', flexShrink: 0, marginTop: '1px' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>
            Google Search Console connecté. Clique sur &laquo;&nbsp;Vérifier l&apos;indexation&nbsp;&raquo; pour lancer
            une première vérification.
          </span>
        </div>
      )}

      {googleError && (
        <div style={s.errorBox}>
          <Warning size={16} weight="fill" style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: 'var(--danger)' }}>Connexion Google échouée ({googleError}).</span>
        </div>
      )}

      {!apiConfigured && (
        <div style={s.infoBox}>
          <Info size={16} weight="fill" style={{ color: 'var(--accent-text)', flexShrink: 0, marginTop: '1px' }} />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5 }}>
              Connecte Google Search Console pour afficher le vrai statut indexé / pas indexé de chaque page. En
              attendant, le bouton &laquo;&nbsp;Inspecter&nbsp;&raquo; sur chaque ligne fonctionne déjà.
            </span>
            <a href="/api/google/connect" style={s.connectBtn}>
              <GoogleLogo size={14} weight="bold" /> Connecter Google Search Console
            </a>
          </div>
        </div>
      )}

      {fetchError && (
        <div style={s.errorBox}>
          <Warning size={16} weight="fill" style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: 'var(--danger)' }}>Sitemap non récupéré ({fetchError}).</span>
        </div>
      )}

      {notPublished.length > 0 && (
        <div style={s.banner}>
          <button onClick={() => setBannerOpen(v => !v)} style={s.bannerHead}>
            {bannerOpen ? <CaretUp size={13} /> : <CaretDown size={13} />}
            <strong>{notPublished.length} pages pas encore publiées sur le site</strong>
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
              — leur adresse renvoie une erreur, rien à demander à Google tant qu&apos;elles ne sont pas en ligne.
            </span>
          </button>
          {bannerOpen && (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {notPublished.map(p => (
                <span key={p.url} style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace' }}>
                  {p.path} <span style={{ color: '#ef4444' }}>({p.httpStatus})</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={s.tabs}>
        {([
          { id: 'jamais' as const, label: 'Jamais vérifiées', count: neverChecked.length },
          { id: 'pas_indexees' as const, label: 'Pas encore dans Google', count: notIndexed.length },
          { id: 'indexees' as const, label: 'Indexées', count: indexed.length },
          { id: 'toutes' as const, label: 'Toutes', count: pages.length },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ ...s.tab, ...(tab === t.id ? s.tabActive : {}) }}>
            {t.label}
            <span style={{ ...s.tabCount, ...(tab === t.id ? s.tabCountActive : {}) }}>{t.count}</span>
          </button>
        ))}
      </div>

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
          <p style={s.empty}>Aucune page ici.</p>
        ) : (
          filtered.map(p => {
            const badge = statusBadge(p)
            return (
              <div key={p.url} style={s.row} className="jm-idx-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const }}>
                    <span style={s.rowUrl}>{p.path}</span>
                    <span style={{ ...s.badge, color: badge.color, background: badge.bg }}>{badge.label}</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    Vérifiée {fmtDateTime(p.lastCheckedAt)}
                    {p.lastmod && <> · modifiée {fmtDate(p.lastmod)}</>}
                    {p.error && <span style={{ color: '#f59e0b' }}> · {p.error}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }} className="jm-idx-actions">
                  {p.inspectionLink ? (
                    // Lien officiel renvoyé par l'API pour la dernière
                    // vérification — arrive directement sur cette page,
                    // aucune manip requise.
                    <a href={p.inspectionLink} target="_blank" rel="noopener noreferrer" style={s.smallBtn} title="Ouvrir l'inspection de cette page dans Search Console">
                      <ArrowSquareOut size={13} /> Inspecter
                    </a>
                  ) : (
                    <>
                      <button onClick={() => handleCopy(p.url)} style={{ ...s.smallBtn, cursor: 'pointer' }} title="Copier l'URL (à coller dans la barre de recherche Search Console)">
                        {copiedUrl === p.url ? <Check size={13} weight="bold" style={{ color: 'var(--success-1)' }} /> : <Copy size={13} />}
                        {copiedUrl === p.url ? 'Copié' : 'Copier'}
                      </button>
                      <a href={searchConsolePropertyLink()} target="_blank" rel="noopener noreferrer" style={s.smallBtn} title="Ouvrir Search Console (colle l'URL copiée dans la barre de recherche) — lien direct disponible après une vérification">
                        <ArrowSquareOut size={13} /> Inspecter
                      </a>
                    </>
                  )}
                  <a href={p.url} target="_blank" rel="noopener noreferrer" style={s.smallBtn} title="Voir la page">
                    <Eye size={13} /> Voir
                  </a>
                </div>
              </div>
            )
          })
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        /* Mobile : la ligne (chemin + badge à gauche, boutons à droite) n'a
           pas la place de rester côte à côte — le badge se retrouvait
           chevauché par les boutons. On empile verticalement en dessous
           d'une certaine largeur, et les boutons passent sur plusieurs
           lignes si besoin plutôt que de déborder. */
        @media (max-width: 640px) {
          .jm-idx-row { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
          .jm-idx-actions { flex-wrap: wrap !important; }
        }
      `}</style>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '820px', padding: 'clamp(20px,3vw,44px)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' },
  title: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '26px', fontWeight: 500,
    color: 'var(--text)', margin: '0 0 4px',
  },
  subtitle: { fontSize: '13px', color: 'var(--text-muted)', margin: 0 },
  refreshBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'var(--accent-text)', border: 'none',
    borderRadius: '9px', padding: '9px 16px',
    color: 'var(--bg)', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
    fontFamily: 'var(--font-outfit), sans-serif',
  },
  connectBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'var(--accent-text)', border: 'none',
    borderRadius: '9px', padding: '8px 14px',
    color: 'var(--bg)', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600,
    fontFamily: 'var(--font-outfit), sans-serif', textDecoration: 'none', whiteSpace: 'nowrap' as const,
  },
  errorBox: {
    display: 'flex', gap: '8px', alignItems: 'flex-start',
    background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
    borderRadius: '10px', padding: '10px 14px',
  },
  infoBox: {
    display: 'flex', gap: '10px', alignItems: 'flex-start',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '12px 16px',
  },
  code: {
    fontFamily: 'ui-monospace, monospace', fontSize: '12px',
    background: 'var(--bg-2)', padding: '1px 5px', borderRadius: '4px',
    color: 'var(--text)',
  },
  banner: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '10px 14px',
  },
  bannerHead: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
    fontSize: '13px', color: 'var(--text)', width: '100%', textAlign: 'left',
    fontFamily: 'var(--font-outfit), sans-serif',
  },
  tabs: { display: 'flex', gap: '6px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: '2px' },
  tab: {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '8px 14px', borderRadius: '9px 9px 0 0', fontSize: '13px', fontWeight: 500,
    background: 'none', border: 'none', borderBottom: '2px solid transparent',
    color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif',
  },
  tabActive: {
    color: 'var(--accent-text)', borderBottomColor: 'var(--accent-text)', fontWeight: 600,
  },
  tabCount: {
    fontSize: '10.5px', fontWeight: 700, padding: '1px 7px',
    borderRadius: '100px', background: 'var(--border)', color: 'var(--text-muted)',
  },
  tabCountActive: { background: 'var(--accent-bg-2)', color: 'var(--accent-text)' },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '9px 14px',
  },
  searchInput: {
    background: 'none', border: 'none', outline: 'none',
    fontSize: '13px', color: 'var(--text)', width: '100%', fontFamily: 'var(--font-outfit), sans-serif',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '6px' },
  row: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 14px', borderRadius: '10px',
    border: '1px solid var(--border)', background: 'var(--surface)',
  },
  rowUrl: {
    fontSize: '13px', color: 'var(--text)', fontFamily: 'ui-monospace, monospace',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '340px',
  },
  badge: {
    fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '100px', whiteSpace: 'nowrap',
  },
  smallBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', fontWeight: 500, color: 'var(--text-2)',
    background: 'var(--bg-2)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '6px 10px', textDecoration: 'none', whiteSpace: 'nowrap',
  },
  empty: { fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', margin: 0 },
}
