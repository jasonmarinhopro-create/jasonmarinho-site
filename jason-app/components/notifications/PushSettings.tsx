'use client'

// Réglage « Sur ton téléphone » (30/09/2026, demande de Jason) : active les
// notifications de l'app sur l'appareil utilisé (Web Push). Sur iPhone,
// Apple ne l'autorise que depuis l'app installée sur l'écran d'accueil
// (iOS 16.4 et plus) : on l'explique au lieu d'afficher un bouton qui échoue.
import { useEffect, useState } from 'react'
import { DeviceMobile, CheckCircle, BellRinging, Export, PlusSquare } from '@phosphor-icons/react/dist/ssr'

type State = 'loading' | 'noconfig' | 'unsupported' | 'ios-install' | 'ios-old' | 'denied' | 'off' | 'on'

function keyBytes(base64: string): Uint8Array {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

function isIos(): boolean {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}
function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

async function post(body: unknown): Promise<{ ok?: boolean; error?: string; sent?: number }> {
  const r = await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return r.json().catch(() => ({ error: 'Réponse illisible.' }))
}

export default function PushSettings({ devices, publicKey }: { devices: number; publicKey: string | null }) {
  const PUBLIC_KEY = publicKey ?? ''
  const [state, setState] = useState<State>('loading')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    (async () => {
      if (!PUBLIC_KEY) return setState('noconfig')
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
      if (!supported) return setState(isIos() && !isStandalone() ? 'ios-install' : isIos() ? 'ios-old' : 'unsupported')
      if (Notification.permission === 'denied') return setState('denied')
      try {
        const reg = await navigator.serviceWorker.getRegistration('/')
        const sub = reg ? await reg.pushManager.getSubscription() : null
        setState(sub ? 'on' : 'off')
      } catch { setState('off') }
    })()
  }, [PUBLIC_KEY])

  async function enable() {
    setBusy(true); setMsg(null)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setState(perm === 'denied' ? 'denied' : 'off'); return }
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready
      const sub = (await reg.pushManager.getSubscription())
        ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUBLIC_KEY) as BufferSource })
      const res = await post({ action: 'subscribe', subscription: sub.toJSON() })
      if (res.error) { await sub.unsubscribe().catch(() => {}); setMsg({ tone: 'err', text: res.error }); return }
      setState('on')
      const t = await post({ action: 'test' })
      setMsg(t.ok ? { tone: 'ok', text: 'C\'est activé. Une notification d\'essai vient de partir.' } : { tone: 'ok', text: 'C\'est activé sur cet appareil.' })
    } catch {
      setMsg({ tone: 'err', text: 'Activation impossible sur ce navigateur. Réessaie depuis Chrome, Edge, Firefox ou Safari à jour.' })
    } finally { setBusy(false) }
  }

  async function disable() {
    setBusy(true); setMsg(null)
    try {
      const reg = await navigator.serviceWorker.getRegistration('/')
      const sub = reg ? await reg.pushManager.getSubscription() : null
      if (sub) { await post({ action: 'unsubscribe', endpoint: sub.endpoint }); await sub.unsubscribe() }
      setState('off')
    } finally { setBusy(false) }
  }

  async function test() {
    setBusy(true); setMsg(null)
    const t = await post({ action: 'test' })
    setBusy(false)
    setMsg(t.ok ? { tone: 'ok', text: 'Notification d\'essai envoyée : elle arrive dans quelques secondes.' } : { tone: 'err', text: t.error ?? 'L\'essai n\'est pas parti : désactive puis réactive sur cet appareil.' })
  }

  return (
    <div id="telephone" style={s.card}>
      <div style={s.head}>
        <span style={s.icon}><DeviceMobile size={18} weight="fill" /></span>
        <div style={{ minWidth: 0 }}>
          <div style={s.title}>Sur ton téléphone</div>
          <div style={s.sub}>Nouvelle réservation, contrat signé, paiement, check-in : prévenu même app fermée.</div>
        </div>
      </div>

      {state === 'loading' && <div style={s.text}>Vérification de cet appareil…</div>}

      {state === 'noconfig' && <div style={s.text}>Bientôt disponible.</div>}

      {state === 'ios-install' && (
        <div style={s.steps}>
          <div style={s.text}>Sur iPhone, Apple ne l&apos;autorise que depuis l&apos;app installée. Un raccourci qui ouvre Safari ne suffit pas :</div>
          <div style={s.step}><span style={s.num}>1</span> Ouvre <strong>app.jasonmarinho.com</strong> dans Safari (pas le site jasonmarinho.com)</div>
          <div style={s.step}><Export size={15} weight="bold" /> Touche <strong>Partager</strong>, puis <strong>Sur l&apos;écran d&apos;accueil</strong></div>
          <div style={s.step}><PlusSquare size={15} weight="bold" /> Laisse <strong>Ouvrir en tant qu&apos;app web</strong> activé, puis <strong>Ajouter</strong></div>
          <div style={s.step}><BellRinging size={15} weight="bold" /> Ouvre l&apos;app depuis la nouvelle icône (sans barre d&apos;adresse) et reviens ici</div>
          <div style={{ ...s.text, fontSize: 12 }}>Supprime l&apos;ancien raccourci s&apos;il ouvre Safari. iOS 16.4 ou plus récent.</div>
        </div>
      )}

      {state === 'ios-old' && <div style={s.text}>L&apos;app est bien installée, mais cet iPhone est trop ancien pour les notifications : mets-le à jour (iOS 16.4 ou plus récent).</div>}

      {state === 'unsupported' && <div style={s.text}>Ce navigateur ne gère pas les notifications. Essaie Chrome, Edge, Firefox ou Safari à jour.</div>}

      {state === 'denied' && (
        <div style={s.text}>
          Les notifications sont bloquées pour l&apos;app dans ce navigateur. Autorise-les dans les réglages du site (icône à gauche de l&apos;adresse), puis recharge la page.
        </div>
      )}

      {state === 'off' && (
        <button type="button" onClick={enable} disabled={busy} style={s.primary}>
          <BellRinging size={16} weight="fill" /> {busy ? 'Activation…' : 'Activer sur cet appareil'}
        </button>
      )}

      {state === 'on' && (
        <>
          <div style={s.on}><CheckCircle size={16} weight="fill" /> Activé sur cet appareil{devices > 1 ? ` (${devices} appareils en tout)` : ''}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={test} disabled={busy} style={s.secondary}>Envoyer un essai</button>
            <button type="button" onClick={disable} disabled={busy} style={s.ghost}>Désactiver</button>
          </div>
        </>
      )}

      {msg && <div style={{ ...s.msg, color: msg.tone === 'ok' ? 'var(--accent-text)' : 'var(--danger)' }}>{msg.text}</div>}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: { display: 'flex', flexDirection: 'column', gap: 12, padding: '18px 20px', borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--accent-border)', scrollMarginTop: 90 },
  head: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  icon: { width: 36, height: 36, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-text)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 17, color: 'var(--text)' },
  sub: { fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5, marginTop: 2 },
  text: { fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 },
  steps: { display: 'flex', flexDirection: 'column', gap: 7 },
  step: { display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text)', lineHeight: 1.45 },
  num: { width: 15, height: 15, flexShrink: 0, borderRadius: 99, fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-text)', color: 'var(--bg)', marginTop: 2 },
  primary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 16px', borderRadius: 11, border: 'none', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  secondary: { padding: '8px 13px', borderRadius: 10, border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  ghost: { padding: '8px 13px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  on: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 700, color: 'var(--accent-text)' },
  msg: { fontSize: 12.5, lineHeight: 1.5, fontWeight: 600 },
}
