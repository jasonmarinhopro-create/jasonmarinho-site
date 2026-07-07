'use client'

// Widget « Déclarations voyageurs à faire » (dashboard home).
// Liste les déclarations réglementaires (SIBA PT, fiche police FR, SES ES…)
// créées automatiquement à la signature des contrats, avec compte à rebours,
// lien vers le portail officiel, récap copiable et bouton « Fait ».

import { useState, useTransition } from 'react'
import { Warning, ArrowSquareOut, Check, Copy, X, PaperPlaneTilt } from '@phosphor-icons/react/dist/ssr'
import { getCountry } from '@/lib/countries'
import { nationaliteName } from '@/lib/nationalites'
import { markDeclarationDone, ignoreDeclaration } from '@/lib/declarations/actions'
import SibaSendModal from './SibaSendModal'

export interface PendingDeclaration {
  id: string
  voyageur_nom: string
  voyageur_nationalite: string | null
  logement_nom: string | null
  logement_pays: string
  date_arrivee: string
  deadline_at: string
}

function deadlineInfo(deadlineAt: string): { label: string; color: string } {
  const ms = new Date(deadlineAt).getTime() - Date.now()
  const hours = Math.floor(ms / 3_600_000)
  if (ms <= 0) return { label: 'Deadline dépassée — déclare sans attendre', color: 'var(--danger)' }
  if (hours < 24) return { label: `Il reste moins de ${hours + 1}h`, color: '#f97316' }
  const days = Math.floor(hours / 24)
  return { label: `Il reste ${days} jour${days > 1 ? 's' : ''}`, color: '#f59e0b' }
}

export default function DeclarationsWidget({ declarations }: { declarations: PendingDeclaration[] }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [sibaModalId, setSibaModalId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const visible = declarations.filter(d => !hidden.has(d.id))
  if (visible.length === 0) return null

  function hide(id: string) {
    setHidden(prev => new Set(prev).add(id))
  }

  function done(id: string) {
    hide(id)
    startTransition(async () => { await markDeclarationDone(id) })
  }

  function ignore(id: string) {
    hide(id)
    startTransition(async () => { await ignoreDeclaration(id) })
  }

  async function copyRecap(d: PendingDeclaration) {
    const arrivee = new Date(d.date_arrivee + 'T12:00:00').toLocaleDateString('fr-FR')
    const lines = [
      `Voyageur : ${d.voyageur_nom}`,
      d.voyageur_nationalite ? `Nationalité : ${nationaliteName(d.voyageur_nationalite)}` : null,
      d.logement_nom ? `Logement : ${d.logement_nom}` : null,
      `Arrivée : ${arrivee}`,
    ].filter(Boolean)
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopiedId(d.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch { /* clipboard indisponible : tant pis, best-effort */ }
  }

  return (
    <div style={s.wrap} className="fade-up">
      <div style={s.head}>
        <Warning size={16} weight="fill" color="#f59e0b" />
        <span style={s.headTitle}>
          Déclaration{visible.length > 1 ? 's' : ''} voyageur obligatoire{visible.length > 1 ? 's' : ''}
        </span>
        <span style={s.headBadge}>{visible.length}</span>
      </div>

      <div style={s.list}>
        {visible.map(d => {
          const config = getCountry(d.logement_pays)
          const decl = config.foreignGuestDeclaration
          const dl = deadlineInfo(d.deadline_at)
          const natName = nationaliteName(d.voyageur_nationalite)
          return (
            <div key={d.id} style={s.item}>
              <div style={s.itemMain}>
                <div style={s.itemTitle}>
                  {config.flag} <strong>{d.voyageur_nom}</strong>
                  {natName ? <span style={s.itemNat}> · {natName}</span> : null}
                  {d.logement_nom ? <span style={s.itemNat}> · {d.logement_nom}</span> : null}
                </div>
                <div style={s.itemSub}>
                  {decl.label} · <span style={{ color: dl.color, fontWeight: 600 }}>{dl.label}</span>
                </div>
              </div>
              <div style={s.itemActions}>
                {/* Portugal : envoi automatisé via le Web Service SIBA.
                    Le lien portail reste dispo en repli (petite icône). */}
                {d.logement_pays === 'PT' && (
                  <button onClick={() => setSibaModalId(d.id)} style={s.sibaBtn} title="Déclarer via le Web Service SIBA">
                    <PaperPlaneTilt size={12} weight="bold" /> Envoyer à SIBA
                  </button>
                )}
                {decl.portalUrl && (
                  <a href={decl.portalUrl} target="_blank" rel="noopener noreferrer"
                     style={d.logement_pays === 'PT' ? s.portalLinkSmall : s.portalBtn}
                     title="Ouvrir le portail officiel">
                    {d.logement_pays === 'PT' ? <ArrowSquareOut size={13} weight="bold" /> : <>Portail <ArrowSquareOut size={11} weight="bold" /></>}
                  </a>
                )}
                <button onClick={() => copyRecap(d)} style={s.ghostBtn} title="Copier les infos du voyageur">
                  {copiedId === d.id ? <Check size={12} weight="bold" color="#10b981" /> : <Copy size={12} weight="bold" />}
                  {copiedId === d.id ? 'Copié' : 'Infos'}
                </button>
                <button onClick={() => done(d.id)} style={s.doneBtn} title="Marquer comme déclarée">
                  <Check size={12} weight="bold" /> Fait
                </button>
                <button onClick={() => ignore(d.id)} style={s.ignoreBtn} aria-label="Ignorer" title="Ignorer (faux positif)">
                  <X size={12} weight="bold" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {sibaModalId && (
        <SibaSendModal
          declarationId={sibaModalId}
          onClose={() => setSibaModalId(null)}
          onSent={() => { hide(sibaModalId); setSibaModalId(null) }}
        />
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    background: 'var(--warning-bg)',
    border: '1px solid rgba(245,158,11,0.28)',
    borderRadius: '14px',
    padding: '16px 18px',
    marginBottom: 'clamp(18px, 2.5vw, 28px)',
  },
  head: {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginBottom: '12px',
  },
  headTitle: { fontSize: '14px', fontWeight: 700, color: 'var(--warning)' },
  headBadge: {
    fontSize: '11px', fontWeight: 700,
    minWidth: '20px', height: '20px', borderRadius: '999px',
    background: 'var(--warning-border)', color: 'var(--warning)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 6px',
  },
  list: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  item: {
    display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const,
    padding: '10px 12px', borderRadius: '10px',
    background: 'var(--bg-2)', border: '1px solid var(--border)',
  },
  itemMain: { flex: 1, minWidth: '200px' },
  itemTitle: { fontSize: '13.5px', color: 'var(--text)', lineHeight: 1.4 },
  itemNat: { color: 'var(--text-2)', fontWeight: 400 },
  itemSub: { fontSize: '12px', color: 'var(--text-2)', marginTop: '3px' },
  itemActions: {
    display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
    flexWrap: 'wrap' as const,
  },
  portalBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '6px 11px', borderRadius: '8px',
    background: '#f59e0b', color: 'var(--bg)',
    fontSize: '12px', fontWeight: 600, textDecoration: 'none',
  },
  sibaBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '6px 12px', borderRadius: '8px', border: 'none',
    background: '#f59e0b', color: 'var(--bg)',
    fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  portalLinkSmall: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '28px', height: '28px', borderRadius: '8px',
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--text-2)', textDecoration: 'none',
  },
  ghostBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '6px 10px', borderRadius: '8px',
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontSize: '12px', fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  doneBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '6px 10px', borderRadius: '8px',
    background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.30)',
    color: '#10b981', fontSize: '12px', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  ignoreBtn: {
    width: '26px', height: '26px', borderRadius: '8px',
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--text-muted)', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
}
