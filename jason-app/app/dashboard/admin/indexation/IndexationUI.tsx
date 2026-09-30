'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  MagnifyingGlass, ArrowSquareOut, Warning, Info, ArrowClockwise, CaretDown, CaretUp, Eye, GoogleLogo, Copy, Check,
} from '@phosphor-icons/react/dist/ssr'
import { refreshIndexationNow, markSubmitted, unmarkSubmitted, checkUrlNow } from './actions'
import AdminHero, { adminAsideCard } from '../_ui/AdminHero'
import { heroCta } from '@/components/dashboard/HubHero'

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
  // Demande d'indexation faite à la main dans Search Console (Google n'a pas
  // d'API d'écriture pour ça) — coché par l'admin via "C'est fait" pour
  // garder le fil sur ~500 pages, cf. le même bouton chez Driing.
  submittedAt: string | null
  error: string | null
}

type Tab = 'a_soumettre' | 'jamais' | 'pas_indexees' | 'indexees' | 'erreurs' | 'toutes'

function fmtDate(d: string | null): string {
  if (!d) return '-'
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(d: string | null): string {
  if (!d) return 'jamais'
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
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

// Statut inconnu : la dernière vérification a échoué et aucun statut
// antérieur n'est connu (lignes écrasées le 29/09/2026 par la connexion
// Google expirée). Hors des onglets « À soumettre » / « Pas encore dans
// Google » : on ne sait pas si la page est indexée.
function isUnknown(p: PageStatus): boolean {
  return !!p.error && !p.indexed && !p.coverageState
}

// Erreur due à la connexion Google (jeton expiré ou révoqué), pas à la page.
function isAuthError(message: string | null): boolean {
  return !!message && /\b401\b|\b403\b|invalid_grant|UNAUTHENTICATED|OAuth|Connexion à Google/i.test(message)
}

function statusBadge(p: PageStatus): { label: string; color: string; bg: string } {
  if (p.httpStatus && p.httpStatus >= 400) return { label: `Page ${p.httpStatus}`, color: 'var(--danger-text)', bg: 'color-mix(in srgb, var(--danger) 10%, transparent)' }
  if (!p.lastCheckedAt) return { label: 'Jamais vérifiée', color: 'var(--text-muted)', bg: 'var(--surface)' }
  if (isUnknown(p)) return { label: 'Erreur de vérification', color: '#B7791F', bg: 'color-mix(in srgb, #B7791F 10%, transparent)' }
  if (p.indexed) return { label: 'Indexée', color: 'var(--accent-text)', bg: 'rgba(74,222,128,0.10)' }
  const label = (p.coverageState && COVERAGE_LABELS[p.coverageState]) || p.coverageState || 'Pas indexée'
  return { label, color: '#6E5446', bg: 'color-mix(in srgb, #6E5446 10%, transparent)' }
}

export default function IndexationUI({ pages: serverPages, fetchError, lastChecked, apiConfigured, connectedAt = null }: {
  pages: PageStatus[]
  fetchError: string | null
  lastChecked: string | null
  apiConfigured: boolean
  /** Dernière (re)connexion à Google : une erreur d'accès plus ancienne est périmée */
  connectedAt?: string | null
}) {
  const [search, setSearch] = useState('')
  // Tant que l'API n'est pas configurée, tout est "jamais vérifié" — partir
  // sur cet onglet plutôt que "À soumettre" (qui affiche 0 et laisse croire
  // que tout est déjà réglé).
  const [tab, setTab] = useState<Tab>(apiConfigured ? 'a_soumettre' : 'jamais')
  const [bannerOpen, setBannerOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [refreshMsg, setRefreshMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  // Override optimiste par URL pour le bouton "C'est fait" — voir
  // handleMarkSubmitted plus bas.
  const [submittedOverrides, setSubmittedOverrides] = useState<Record<string, string | null>>({})
  // Résultat du bouton « Vérifier » d'une ligne, appliqué tout de suite
  // (sans recharger toute la page, qui retélécharge le sitemap)
  const [checked, setChecked] = useState<Record<string, Partial<PageStatus>>>({})
  const [checking, setChecking] = useState<Set<string>>(new Set())
  const pages = useMemo(() => serverPages.map(p => (checked[p.url] ? { ...p, ...checked[p.url] } : p)), [serverPages, checked])

  const router = useRouter()
  const searchParams = useSearchParams()
  const googleConnected = searchParams.get('google_connected') === '1'
  // Le message « connecté » ne doit pas rester affiché à chaque rechargement
  useEffect(() => {
    if (!googleConnected && !searchParams.get('google_error')) return
    const t = setTimeout(() => router.replace('/dashboard/admin/indexation', { scroll: false }), 8000)
    return () => clearTimeout(t)
  }, [googleConnected, searchParams, router])
  const googleError = searchParams.get('google_error')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  function effectiveSubmittedAt(p: PageStatus): string | null {
    return p.url in submittedOverrides ? submittedOverrides[p.url] : p.submittedAt
  }

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 1500)
    }).catch(() => {})
  }

  const notPublished = useMemo(() => pages.filter(p => p.httpStatus && p.httpStatus >= 400), [pages])
  const live = useMemo(() => pages.filter(p => !p.httpStatus || p.httpStatus < 400), [pages])
  const neverChecked = useMemo(() => live.filter(p => !p.lastCheckedAt), [live])
  const notIndexed = useMemo(() => live.filter(p => p.lastCheckedAt && !p.indexed && !isUnknown(p)), [live])
  const indexed = useMemo(() => live.filter(p => p.indexed), [live])
  const errored = useMemo(() => live.filter(p => p.error), [live])
  // Erreur d'accès enregistrée avant la dernière reconnexion : la page attend
  // simplement d'être revérifiée, la connexion n'est plus en cause.
  const isStaleAuth = (p: PageStatus) => isAuthError(p.error) && !!connectedAt && (!p.lastCheckedAt || p.lastCheckedAt < connectedAt)
  const authErrored = useMemo(() => errored.filter(p => isAuthError(p.error) && !isStaleAuth(p)).length, [errored, connectedAt]) // eslint-disable-line react-hooks/exhaustive-deps
  const toRecheck = useMemo(() => errored.filter(isStaleAuth).length, [errored, connectedAt]) // eslint-disable-line react-hooks/exhaustive-deps
  const [authExpired, setAuthExpired] = useState(false)
  const showReconnect = apiConfigured && (authExpired || authErrored >= 5)
  // Pas indexées ET jamais encore demandées à Google — la vraie file
  // d'action, contrairement à "Pas encore dans Google" qui garde aussi
  // celles déjà demandées (en attente que Google les traite).
  const aSoumettre = useMemo(
    () => notIndexed.filter(p => !(p.url in submittedOverrides ? submittedOverrides[p.url] : p.submittedAt)),
    [notIndexed, submittedOverrides],
  )

  const byTab: Record<Tab, PageStatus[]> = {
    a_soumettre: aSoumettre,
    jamais: neverChecked,
    pas_indexees: notIndexed,
    indexees: indexed,
    erreurs: errored,
    toutes: pages,
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = byTab[tab]
    if (!q) return list
    return list.filter(p => p.path.toLowerCase().includes(q))
  }, [byTab, tab, search])

  // Une passe (~50s) ne suffit pas pour les ~500 URLs du sitemap — on
  // rappelle l'action tant qu'il reste des pages à vérifier, pour que le
  // clic unique aille jusqu'au bout sans manip supplémentaire. Plafond de
  // sécurité (30 passes) pour ne jamais boucler indéfiniment en cas de bug.
  function handleRefresh() {
    setRefreshMsg(null)
    startTransition(async () => {
      let totalChecked = 0
      let lastRemaining = Infinity
      for (let pass = 0; pass < 30; pass++) {
        // Un raté réseau ponctuel en appelant la server action elle-même
        // (pas une erreur métier renvoyée par checkAllUrls, qui est déjà
        // gérée via res.error) ne doit pas faire planter toute la page avec
        // l'écran d'erreur générique Next.js — on l'affiche proprement et on
        // arrête la boucle, l'utilisateur peut recliquer.
        let res
        try {
          res = await refreshIndexationNow()
        } catch {
          setRefreshMsg({ type: 'err', text: `${totalChecked} vérifiées avant l'interruption, réessaie.` })
          router.refresh()
          return
        }
        if (res.error) {
          if (res.authExpired) setAuthExpired(true)
          setRefreshMsg({ type: 'err', text: res.error })
          router.refresh()
          return
        }
        setAuthExpired(false)
        totalChecked += res.checked ?? 0
        const remaining = res.remaining ?? 0
        // Pages qui restent en erreur d'une passe à l'autre : on s'arrête
        // au lieu de les revérifier 30 fois de suite.
        if (remaining > 0 && remaining < lastRemaining) {
          lastRemaining = remaining
          setRefreshMsg({ type: 'ok', text: `${totalChecked} vérifiées, ${remaining} restantes… (ne quitte pas la page)` })
          router.refresh()
        } else {
          setRefreshMsg({ type: 'ok', text: remaining > 0 ? `${totalChecked} vérifiées, ${remaining} toujours en erreur (onglet Erreurs).` : `${totalChecked} pages vérifiées.` })
          router.refresh()
          return
        }
      }
    })
  }

  // Google n'a pas d'API d'écriture pour demander l'indexation d'une page
  // classique — on ouvre Search Console (inspectionLink) où l'admin clique
  // "Demander une indexation" à la main, puis revient cocher "C'est fait"
  // ici pour ne pas reperdre le fil sur ~500 pages.
  //
  // Pattern optimiste (cf. CLAUDE.md) : router.refresh() re-déclenche la
  // page serveur entière, qui re-télécharge le sitemap.xml en direct et
  // re-requête ~500 lignes — sensible en latence pour un simple clic. La
  // ligne change d'état tout de suite côté client ; le serveur suit derrière,
  // avec retour en arrière si l'écriture échoue.
  function handleMarkSubmitted(url: string) {
    const now = new Date().toISOString()
    setSubmittedOverrides(prev => ({ ...prev, [url]: now }))
    markSubmitted(url).then(res => {
      if (res.error) {
        setSubmittedOverrides(prev => ({ ...prev, [url]: null }))
        setRefreshMsg({ type: 'err', text: res.error! })
      }
    })
  }

  function handleCheckOne(p: PageStatus) {
    setChecking(prev => new Set(prev).add(p.url))
    setRefreshMsg(null)
    checkUrlNow(p.url).then(res => {
      if (res.result) {
        const r = res.result
        setChecked(prev => ({ ...prev, [p.url]: { httpStatus: r.httpStatus, coverageState: r.coverageState, indexed: r.indexed, inspectionLink: r.inspectionLink, lastCheckedAt: r.lastCheckedAt, error: null } }))
        const label = statusBadge({ ...p, httpStatus: r.httpStatus, coverageState: r.coverageState, indexed: r.indexed, lastCheckedAt: r.lastCheckedAt, error: null }).label
        setRefreshMsg({ type: 'ok', text: `${p.path} : ${label}.` })
      } else {
        if (res.authExpired) setAuthExpired(true)
        setRefreshMsg({ type: 'err', text: `${p.path} : ${res.error ?? 'vérification impossible'}` })
      }
    }).catch(() => {
      setRefreshMsg({ type: 'err', text: `${p.path} : vérification interrompue, réessaie.` })
    }).finally(() => {
      setChecking(prev => { const n = new Set(prev); n.delete(p.url); return n })
    })
  }

  function handleUnmarkSubmitted(url: string, previous: string | null) {
    setSubmittedOverrides(prev => ({ ...prev, [url]: null }))
    unmarkSubmitted(url).then(res => {
      if (res.error) {
        setSubmittedOverrides(prev => ({ ...prev, [url]: previous }))
        setRefreshMsg({ type: 'err', text: res.error! })
      }
    })
  }

  return (
    <div style={s.wrap}>
      <AdminHero
        section="Indexation Google"
        title="Tes pages,"
        em="bien vues par Google"
        desc={<>Repère les pages du site que Google n&apos;a pas encore indexées et demande leur indexation dans Search Console. Dernière vérification : <span suppressHydrationWarning>{lastChecked ? fmtDateTime(lastChecked) : 'jamais'}</span>.</>}
        aside={
          <div style={adminAsideCard}>
            <span style={s.asideTitle}>Sur {live.length} pages en ligne</span>
            {[
              { label: 'Indexées', n: indexed.length, color: 'var(--accent-text)' },
              { label: 'À soumettre', n: aSoumettre.length, color: 'var(--text)' },
              { label: 'Demandées, en attente de Google', n: notIndexed.length - aSoumettre.length, color: 'var(--text-2)' },
              { label: 'Statut inconnu (erreur)', n: live.filter(isUnknown).length, color: '#B7791F' },
              { label: 'Jamais vérifiées', n: neverChecked.length, color: 'var(--text-muted)' },
            ].filter(r => r.n > 0 || r.label === 'Indexées').map(r => (
              <div key={r.label} style={s.asideRow}>
                <span>{r.label}</span>
                <strong style={{ color: r.color }}>{r.n}</strong>
              </div>
            ))}
            {apiConfigured && (
              <a href="/api/google/connect" style={s.asideLink}>
                <GoogleLogo size={13} weight="bold" /> Reconnecter Google Search Console
              </a>
            )}
          </div>
        }
      >
        <button onClick={handleRefresh} disabled={isPending || !apiConfigured} style={{ ...heroCta, border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: (isPending || !apiConfigured) ? 0.5 : 1 }}>
          <ArrowClockwise size={16} weight="bold" style={isPending ? { animation: 'spin 0.8s linear infinite' } : undefined} />
          Vérifier l&apos;indexation
        </button>
        {refreshMsg && (
          <span style={{ fontSize: '13px', color: refreshMsg.type === 'ok' ? 'var(--accent-text)' : 'var(--danger-text)' }}>
            {refreshMsg.text}
          </span>
        )}
      </AdminHero>

      {googleConnected && (
        <div style={s.infoBox}>
          <Info size={16} weight="fill" style={{ color: 'var(--accent-text)', flexShrink: 0, marginTop: '1px' }} />
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

      {showReconnect && (
        <div style={s.warnBox}>
          <Warning size={18} weight="fill" style={{ color: '#B7791F', flexShrink: 0, marginTop: '1px' }} />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55, flex: '1 1 420px' }}>
              <strong style={{ color: 'var(--text)' }}>La connexion à Google Search Console a expiré.</strong>{' '}
              Google refuse les vérifications{authErrored > 0 && <> ({authErrored} pages en erreur)</>} : ce n&apos;est pas un problème de tes pages.
              Reconnecte-la, puis clique sur &laquo;&nbsp;Vérifier l&apos;indexation&nbsp;&raquo; : les vrais statuts reviennent.
            </span>
            <a href="/api/google/connect" style={s.connectBtn}>
              <GoogleLogo size={14} weight="bold" /> Reconnecter
            </a>
          </div>
        </div>
      )}

      {!showReconnect && toRecheck > 0 && !isPending && (
        <div style={s.infoBox}>
          <Info size={16} weight="fill" style={{ color: 'var(--accent-text)', flexShrink: 0, marginTop: '1px' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5 }}>
            {toRecheck} page{toRecheck > 1 ? 's' : ''} n&apos;{toRecheck > 1 ? 'ont' : 'a'} pas encore été revérifiée{toRecheck > 1 ? 's' : ''} depuis ta reconnexion. Clique sur &laquo;&nbsp;Vérifier l&apos;indexation&nbsp;&raquo; pour finir.
          </span>
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
              : leur adresse renvoie une erreur, rien à demander à Google tant qu&apos;elles ne sont pas en ligne.
            </span>
          </button>
          {bannerOpen && (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {notPublished.map(p => (
                <span key={p.url} style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace' }}>
                  {p.path} <span style={{ color: 'var(--danger-text)' }}>({p.httpStatus})</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={s.tabs}>
        {([
          { id: 'a_soumettre' as const, label: 'À soumettre', count: aSoumettre.length },
          { id: 'jamais' as const, label: 'Jamais vérifiées', count: neverChecked.length },
          { id: 'pas_indexees' as const, label: 'Pas encore dans Google', count: notIndexed.length },
          { id: 'indexees' as const, label: 'Indexées', count: indexed.length },
          { id: 'erreurs' as const, label: 'Erreurs', count: errored.length },
          { id: 'toutes' as const, label: 'Toutes', count: pages.length },
        ]).filter(t => t.id !== 'erreurs' || t.count > 0 || tab === 'erreurs').map(t => (
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
            const submittedAt = effectiveSubmittedAt(p)
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
                    {submittedAt && <span style={{ color: 'var(--accent-text)' }}> · demandée le {fmtDate(submittedAt)}</span>}
                    {p.error && <span style={{ color: '#B7791F' }}> · {isStaleAuth(p) ? 'à revérifier (erreur d’avant ta reconnexion)' : isAuthError(p.error) ? 'connexion Google expirée, statut non vérifié' : p.error}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }} className="jm-idx-actions">
                  {apiConfigured && (
                    <button
                      onClick={() => handleCheckOne(p)}
                      disabled={checking.has(p.url) || isPending}
                      style={{ ...s.smallBtn, cursor: checking.has(p.url) ? 'wait' : 'pointer', opacity: isPending ? 0.5 : 1 }}
                      title="Vérifier le statut Google de cette page seulement"
                    >
                      <ArrowClockwise size={13} style={checking.has(p.url) ? { animation: 'spin 0.8s linear infinite' } : undefined} />
                      {checking.has(p.url) ? 'Vérification…' : 'Vérifier'}
                    </button>
                  )}
                  {!p.indexed && (
                    submittedAt ? (
                      <button
                        onClick={() => handleUnmarkSubmitted(p.url, submittedAt)}
                        style={{ ...s.smallBtn, cursor: 'pointer', color: 'var(--accent-text)', border: '1px solid var(--accent-text)' }}
                        title="Annuler : la remettre dans « À soumettre »"
                      >
                        <Check size={13} weight="bold" /> Demandée
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkSubmitted(p.url)}
                        style={{ ...s.smallBtn, cursor: 'pointer' }}
                        title="Marquer comme demandée (après avoir cliqué « Demander une indexation » dans Search Console)"
                      >
                        <Check size={13} /> C&apos;est fait
                      </button>
                    )
                  )}
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
                        {copiedUrl === p.url ? <Check size={13} weight="bold" style={{ color: 'var(--accent-text)' }} /> : <Copy size={13} />}
                        {copiedUrl === p.url ? 'Copié' : 'Copier'}
                      </button>
                      <a href={searchConsolePropertyLink()} target="_blank" rel="noopener noreferrer" style={s.smallBtn} title="Ouvrir Search Console (colle l'URL copiée dans la barre de recherche), lien direct disponible après une vérification">
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
        /* Mobile : la ligne (chemin + badge à gauche, boutons à droite) n a
           pas la place de rester côte à côte — le badge se retrouvait
           chevauché par les boutons. On empile verticalement en dessous
           d une certaine largeur, et les boutons passent sur plusieurs
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
  // Pleine largeur (CLAUDE.md, grands écrans) : pas de maxWidth sur la page.
  wrap: { display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box', padding: 'clamp(20px,3vw,44px)' },
  asideTitle: { fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' },
  asideRow: { display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13.5px', color: 'var(--text-2)' },
  asideLink: { display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '12.5px', fontWeight: 600, color: 'var(--accent-text)', textDecoration: 'none' },
  warnBox: {
    display: 'flex', gap: '10px', alignItems: 'flex-start',
    background: 'color-mix(in srgb, #B7791F 8%, var(--surface))', border: '1px solid color-mix(in srgb, #B7791F 35%, transparent)',
    borderRadius: '12px', padding: '14px 16px',
  },
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
  // Pas de borderBottom partagé ici : une fine ligne grise sous tous les
  // onglets se confondait visuellement avec le soulignement coloré de
  // l'onglet actif, laissant croire que tous étaient sélectionnés. Seul le
  // vrai soulignement (2px, coloré) de l'onglet actif doit être visible.
  tabs: { display: 'flex', gap: '6px', flexWrap: 'wrap', paddingBottom: '2px' },
  tab: {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '8px 14px', borderRadius: '9px 9px 0 0', fontSize: '13px', fontWeight: 500,
    background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '2px solid transparent',
    color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif',
  },
  tabActive: {
    // borderBottom complet : avec borderBottomColor seul, React effaçait la
    // couleur au changement d'onglet et l'ancien onglet gardait un trait noir.
    color: 'var(--accent-text)', borderBottom: '2px solid var(--accent-text)', fontWeight: 600,
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
  // Une page par ligne, sur toute la largeur (demande de Jason : 2 colonnes moins pratiques à parcourir)
  list: { display: 'flex', flexDirection: 'column', gap: '6px' },
  row: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 14px', borderRadius: '10px',
    border: '1px solid var(--border)', background: 'var(--surface)',
  },
  rowUrl: {
    fontSize: '13px', color: 'var(--text)', fontFamily: 'ui-monospace, monospace',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, maxWidth: '100%',
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
