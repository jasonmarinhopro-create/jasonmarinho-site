'use client'

// Page d'erreur de l'app (refaite le 16/11/2026, Jason : « ce n'est pas
// fiable, ça me fait peur » devant « Une erreur s'est produite »). Elle dit ce
// qui se passe au lieu d'afficher une alerte : elle interroge
// /api/public/sante pour savoir si la base répond, rassure sur les données,
// et se relance toute seule quand la base est de retour.
// Mots choisis dans lib/errors/diagnostic.ts (pur, testé).
import Link from 'next/link'
import { reportClientError } from '@/lib/errors/client-report'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowCounterClockwise, EnvelopeSimple, House, ShieldCheck, Database, FileText, Check, Hourglass, WifiSlash } from '@phosphor-icons/react/dist/ssr'
import { toFriendlyError, buildSupportMailto } from '@/lib/errors/friendly-message'
import { diagnostiquer, etatDepuisReponse, type EtatSonde } from '@/lib/errors/diagnostic'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
  label?: string
}

/** Secondes entre deux vérifications de la base, et nombre de vérifications avant d'arrêter */
const PAUSE_S = 10
const ESSAIS_MAX = 18

async function sonder(): Promise<EtatSonde> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'hors-ligne'
  try {
    const r = await fetch('/api/public/sante', { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (!r.ok) return 'muette'
    return etatDepuisReponse(await r.json())
  } catch {
    return typeof navigator !== 'undefined' && navigator.onLine === false ? 'hors-ligne' : 'muette'
  }
}

export default function DashboardError({ error, reset, label }: Props) {
  useEffect(() => {
    console.error('[Dashboard error]', error.digest ?? '', error.message)
    reportClientError(error, { digest: error.digest })
  }, [error])

  // Erreurs fonctionnelles déjà expliquées (doublon, session expirée, carte
  // refusée…) : leur message précis prime sur le diagnostic de la base.
  const connue = useMemo(() => {
    const f = toFriendlyError(error)
    return f.severity === 'warning' ? f : null
  }, [error])
  const mailto = useMemo(() => buildSupportMailto(error), [error])

  const [etat, setEtat] = useState<EtatSonde>('cherche')
  const [reste, setReste] = useState(PAUSE_S)
  const [essais, setEssais] = useState(0)
  const [revenue, setRevenue] = useState(false)
  const aEteEnPanne = useRef(false)
  const relance = useRef(false)

  const verifier = useCallback(async () => {
    const e = await sonder()
    setEtat(e)
    setEssais(n => n + 1)
    if (e === 'muette' || e === 'lente' || e === 'hors-ligne') aEteEnPanne.current = true
    // La base répond de nouveau après une panne : on relance la page, une seule fois
    if (e === 'ok' && aEteEnPanne.current && !relance.current) {
      relance.current = true
      setRevenue(true)
      setTimeout(reset, 1400)
    }
  }, [reset])

  useEffect(() => {
    if (connue) return
    verifier()
  }, [connue, verifier])

  const d = diagnostiquer(etat)
  const attend = !connue && d.relanceAuto && !revenue && essais < ESSAIS_MAX

  // Compte à rebours jusqu'à la prochaine vérification
  useEffect(() => {
    if (!attend) return
    setReste(PAUSE_S)
    const id = setInterval(() => {
      setReste(r => {
        if (r > 1) return r - 1
        verifier()
        return PAUSE_S
      })
    }, 1000)
    return () => clearInterval(id)
  }, [attend, verifier, essais])

  const titre = label ?? (revenue ? 'C’est reparti' : connue ? connue.title : d.titre)
  const texte = revenue ? 'La base répond de nouveau. La page se recharge.' : connue ? connue.body : d.texte
  const ton = revenue ? 'ok' : connue ? 'neutre' : d.ton
  const baseEtat = revenue ? 'ok' : d.base.etat
  const Icone = etat === 'hors-ligne' ? WifiSlash : ton === 'ok' ? Check : ton === 'neutre' ? FileText : Hourglass

  return (
    <div style={s.wrap}>
      <style>{`
        @keyframes jmErrHalo { 0%, 100% { transform: scale(1); opacity: .55 } 50% { transform: scale(1.18); opacity: .15 } }
        @keyframes jmErrIn { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
        @media (prefers-reduced-motion: reduce) { .jm-err-halo, .jm-err-box { animation: none !important } }
      `}</style>
      <div className="jm-err-box" style={s.box} role="status" aria-live="polite">
        <div style={s.badge}>
          <span className="jm-err-halo" style={{ ...s.halo, animation: ton === 'neutre' || ton === 'ok' ? 'none' : 'jmErrHalo 2.6s ease-in-out infinite' }} />
          <span style={s.rond}><Icone size={26} weight="duotone" /></span>
        </div>

        <h1 style={s.titre}>{titre}</h1>
        <p style={s.texte}>
          {texte}
          {connue?.hint && <span style={s.hint}> {connue.hint}</span>}
        </p>

        {!connue && (
          <ul style={s.etats}>
            <Ligne icone={<ShieldCheck size={18} weight="duotone" />} nom="Tes données" valeur="Intactes, rien n’est perdu" etat="ok" />
            <Ligne icone={<Database size={18} weight="duotone" />} nom="Base de données" valeur={revenue ? 'Répond normalement' : d.base.label} etat={baseEtat} />
            <Ligne icone={<FileText size={18} weight="duotone" />} nom="Cette page" valeur={revenue ? 'Se recharge' : 'N’a pas pu s’afficher'} etat={revenue ? 'ok' : 'attente'} dernier />
          </ul>
        )}

        {attend && (
          <p style={s.rebours}>
            Nouvelle vérification dans <strong style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{reste} s</strong>. Tu peux laisser cette page ouverte.
          </p>
        )}
        {!connue && d.relanceAuto && !revenue && essais >= ESSAIS_MAX && (
          <p style={s.rebours}>La vérification automatique s’est arrêtée. Réessaie quand tu veux, ou écris-nous.</p>
        )}

        <div style={s.actions}>
          <button onClick={reset} style={s.btn}>
            <ArrowCounterClockwise size={15} weight="bold" />
            Réessayer maintenant
          </button>
          <Link href="/dashboard" prefetch={false} style={s.btnGhost}>
            <House size={15} />
            Retour à l’accueil
          </Link>
          <a href={mailto} style={s.btnGhost}>
            <EnvelopeSimple size={15} />
            Nous écrire
          </a>
        </div>

        {error.digest && !connue?.hideDigest && (
          <p style={s.code}>Code à nous donner si tu nous écris : <span style={s.digest}>{error.digest}</span></p>
        )}
      </div>
    </div>
  )
}

function Ligne({ icone, nom, valeur, etat, dernier }: { icone: React.ReactNode; nom: string; valeur: string; etat: 'ok' | 'attente' | 'ko'; dernier?: boolean }) {
  const couleur = etat === 'ok' ? 'var(--accent-text)' : etat === 'ko' ? '#b7791f' : 'var(--text-3)'
  return (
    <li style={{ ...s.ligne, borderBottom: dernier ? 'none' : '1px solid var(--border)' }}>
      <span style={{ display: 'inline-flex', color: 'var(--accent-text)', flexShrink: 0 }}>{icone}</span>
      <span style={{ flex: '1 1 auto', minWidth: 0, textAlign: 'left' }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{nom}</span>
        <span style={{ display: 'block', fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>{valeur}</span>
      </span>
      <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: '50%', background: couleur, flexShrink: 0, boxShadow: etat === 'ok' ? '0 0 0 4px color-mix(in srgb, var(--accent-text) 14%, transparent)' : 'none' }} />
    </li>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 'clamp(20px,4vw,56px)', minHeight: '72vh', width: '100%',
  },
  box: {
    textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
    width: '100%', maxWidth: 520, animation: 'jmErrIn .45s cubic-bezier(.2,.8,.2,1) both',
  },
  badge: { position: 'relative', width: 84, height: 84, display: 'grid', placeItems: 'center', marginBottom: 22 },
  halo: {
    position: 'absolute', inset: 0, borderRadius: '50%',
    background: 'color-mix(in srgb, var(--accent-text) 16%, transparent)',
  },
  rond: {
    position: 'relative', width: 60, height: 60, borderRadius: '50%', display: 'grid', placeItems: 'center',
    background: 'var(--surface)', border: '1px solid color-mix(in srgb, var(--accent-text) 28%, transparent)',
    color: 'var(--accent-text)', boxShadow: '0 10px 30px -14px color-mix(in srgb, var(--accent-text) 60%, transparent)',
  },
  titre: {
    fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 'clamp(24px,3.4vw,32px)',
    lineHeight: 1.18, letterSpacing: '-0.02em', color: 'var(--text)', margin: '0 0 12px',
  },
  texte: { fontSize: 15, color: 'var(--text-2)', lineHeight: 1.65, margin: '0 0 22px', maxWidth: 460 },
  hint: { color: 'var(--accent-text)', fontWeight: 600 },
  etats: {
    listStyle: 'none', margin: '0 0 18px', padding: '4px 18px', width: '100%',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18,
  },
  ligne: { display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0' },
  rebours: { fontSize: 13, color: 'var(--text-3)', lineHeight: 1.55, margin: '0 0 18px' },
  actions: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 20px', borderRadius: 999, cursor: 'pointer',
    background: 'var(--accent-text)', border: '1px solid var(--accent-text)', color: 'var(--bg)',
    fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 999, cursor: 'pointer',
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)',
    fontSize: 14, fontWeight: 500, textDecoration: 'none', fontFamily: 'inherit',
  },
  code: { fontSize: 11.5, color: 'var(--text-3)', margin: '20px 0 0' },
  digest: {
    fontFamily: 'ui-monospace, monospace', fontSize: 11.5, padding: '2px 7px', borderRadius: 6,
    background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)',
  },
}
