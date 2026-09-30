'use client'

// Guide d'installation de l'app (30/09/2026, demande de Jason : « un bouton
// pour installer l'app sur les téléphones des clients, ce n'est pas facile
// pour beaucoup de monde »). S'adapte à l'appareil : un bouton sur Android
// (fenêtre d'installation du navigateur), les étapes illustrées sur iPhone,
// un QR code à scanner depuis un ordinateur. Onglets pour voir les autres cas.
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AppleLogo, AndroidLogo, Desktop, DownloadSimple, CheckCircle, Copy, Warning,
  DotsThreeVertical, List, PlusSquare, Export, DotsThree, BellRinging, ArrowRight,
} from '@phosphor-icons/react/dist/ssr'
import { detectInstallPlatform, iosNeedsSafari, androidNeedsBrowser, type InstallOs, type InstallPlatform } from '@/lib/pwa/platform'
import { canPromptInstall, isAppStandalone, onInstallChange, promptInstall } from '@/lib/pwa/install-client'

const INSTALL_URL = 'https://app.jasonmarinho.com/installer'

const TABS: Array<{ key: InstallOs; label: string; Icon: typeof AppleLogo }> = [
  { key: 'ios', label: 'iPhone / iPad', Icon: AppleLogo },
  { key: 'android', label: 'Android', Icon: AndroidLogo },
  { key: 'desktop', label: 'Ordinateur', Icon: Desktop },
]

export default function InstallGuide() {
  const [platform, setPlatform] = useState<InstallPlatform | null>(null)
  const [tab, setTab] = useState<InstallOs>('ios')
  const [standalone, setStandalone] = useState(false)
  const [canPrompt, setCanPrompt] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const p = detectInstallPlatform(navigator.userAgent, navigator.maxTouchPoints)
    setPlatform(p)
    setTab(p.os)
    setStandalone(isAppStandalone())
    setCanPrompt(canPromptInstall())
    setInstalled(!!window.__jmInstalled)
    return onInstallChange(() => { setCanPrompt(canPromptInstall()); setInstalled(!!window.__jmInstalled) })
  }, [])

  async function install() {
    setBusy(true)
    const res = await promptInstall()
    setBusy(false)
    setCanPrompt(canPromptInstall())
    if (res === 'accepted') setInstalled(true)
  }

  if (!platform) return <div style={{ ...s.card, minHeight: 320 }} aria-busy="true" />

  if (standalone) {
    return (
      <div style={s.card}>
        <Done title="L'app est installée sur cet appareil" text="Tu l'ouvres depuis son icône Jason Marinho sur ton écran d'accueil." />
        <NotifHint />
      </div>
    )
  }

  if (installed) {
    return (
      <div style={s.card}>
        <Done title="C'est installé" text="Ferme cette page et ouvre l'app depuis la nouvelle icône Jason Marinho sur ton écran d'accueil." />
        <NotifHint />
      </div>
    )
  }

  const here = tab === platform.os
  return (
    <div style={s.card}>
      <div style={s.tabs} role="tablist" aria-label="Type d'appareil">
        {TABS.map(({ key, label, Icon }) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
            style={{ ...s.tab, ...(tab === key ? s.tabOn : {}) }}>
            <Icon size={16} weight={tab === key ? 'fill' : 'regular'} /> {label}
            {key === platform.os && <span style={s.here}>ton appareil</span>}
          </button>
        ))}
      </div>

      {tab === 'ios' && (
        <>
          {here && iosNeedsSafari(platform) && (
            <OpenElsewhere
              title={platform.inAppName ? `Tu es dans ${platform.inAppName} : ouvre cette page dans Safari` : 'Ouvre cette page dans Safari'}
              text={platform.inAppName
                ? 'Sur iPhone, l\'installation se fait depuis Safari. Touche les trois points (ou l\'icône de partage) puis « Ouvrir dans Safari » ou « Ouvrir dans le navigateur ». Sinon, copie le lien et colle-le dans Safari.'
                : 'Sur iPhone, l\'installation se fait depuis Safari (l\'icône bleue avec une boussole). Copie le lien et colle-le dans la barre d\'adresse de Safari.'}
            />
          )}
          <Steps steps={[
            { icon: <Export size={18} weight="bold" />, title: <>Touche le bouton <b>Partager</b></>, text: 'Le carré avec une flèche vers le haut, en bas de l\'écran (en haut à droite sur iPad). Sur les iPhone à jour, il est dans le menu des trois points, à droite de la barre d\'adresse.', extra: <span style={s.chipRow}><span style={s.chip}><DotsThree size={16} weight="bold" /></span><span style={s.chipOr}>puis</span><span style={s.chip}><Export size={15} weight="bold" /> Partager</span></span> },
            { icon: <PlusSquare size={18} weight="bold" />, title: <>Touche <b>Sur l&apos;écran d&apos;accueil</b></>, text: 'Fais défiler la liste vers le bas : l\'option est souvent tout en bas, sous les apps de partage.' },
            { icon: <Toggle />, title: <>Laisse <b>Ouvrir en tant qu&apos;app web</b> activé, puis touche <b>Ajouter</b></>, text: 'En haut à droite de l\'écran.' },
            { icon: <AppIcon />, title: <>Ouvre l&apos;app depuis sa nouvelle icône</>, text: 'L\'icône verte Jason Marinho sur ton écran d\'accueil. Elle s\'ouvre en plein écran, sans barre d\'adresse : c\'est l\'app. Un ancien raccourci qui ouvre Safari n\'est pas l\'app, tu peux le supprimer.' },
          ]} />
          {!here && platform.os === 'desktop' && <QrBlock />}
        </>
      )}

      {tab === 'android' && (
        <>
          {here && androidNeedsBrowser(platform) && (
            <OpenElsewhere
              title={platform.inAppName ? `Tu es dans ${platform.inAppName} : ouvre cette page dans Chrome` : 'Ouvre cette page dans Chrome'}
              text="Une app comme Facebook, Instagram ou Gmail ne sait pas installer d'app. Touche les ⋮ en haut à droite puis « Ouvrir dans Chrome » (ou « Ouvrir dans le navigateur »). Sinon, copie le lien et colle-le dans Chrome."
            />
          )}
          {here && canPrompt && (
            <div style={s.oneTap}>
              <button type="button" onClick={install} disabled={busy} style={s.bigBtn}>
                <DownloadSimple size={20} weight="bold" /> {busy ? 'Ouverture…' : 'Installer l\'app'}
              </button>
              <span style={s.oneTapText}>Une fenêtre s&apos;ouvre : touche <b>Installer</b>. C&apos;est tout.</span>
            </div>
          )}
          {here && canPrompt && <div style={s.or}>ou à la main</div>}
          <Steps steps={platform.browser === 'samsung' && here ? [
            { icon: <List size={18} weight="bold" />, title: <>Touche le menu <b>≡</b> en bas à droite</>, text: 'Dans Samsung Internet.' },
            { icon: <PlusSquare size={18} weight="bold" />, title: <>Touche <b>Ajouter la page à</b>, puis <b>Écran d&apos;accueil</b></>, text: 'Si tu vois une icône de téléchargement dans la barre d\'adresse, tu peux aussi la toucher directement.' },
            { icon: <AppIcon />, title: <>Ouvre l&apos;app depuis sa nouvelle icône</>, text: 'L\'icône verte Jason Marinho sur ton écran d\'accueil.' },
          ] : [
            { icon: <DotsThreeVertical size={18} weight="bold" />, title: <>Touche le menu <b>⋮</b> en haut à droite</>, text: 'Dans Chrome (ou Firefox, Edge).' },
            { icon: <DownloadSimple size={18} weight="bold" />, title: <>Touche <b>Installer l&apos;application</b></>, text: 'Selon le téléphone, c\'est écrit « Ajouter à l\'écran d\'accueil ». Confirme avec « Installer ».' },
            { icon: <AppIcon />, title: <>Ouvre l&apos;app depuis sa nouvelle icône</>, text: 'L\'icône verte Jason Marinho sur ton écran d\'accueil ou dans la liste de tes applications.' },
          ]} />
          {!here && platform.os === 'desktop' && <QrBlock />}
        </>
      )}

      {tab === 'desktop' && (
        <>
          {platform.os === 'desktop' && <QrBlock primary />}
          <div style={s.subTitle}>Sur un ordinateur</div>
          {here && canPrompt ? (
            <div style={s.oneTap}>
              <button type="button" onClick={install} disabled={busy} style={s.bigBtn}>
                <DownloadSimple size={20} weight="bold" /> {busy ? 'Ouverture…' : 'Installer sur cet ordinateur'}
              </button>
              <span style={s.oneTapText}>L&apos;app s&apos;ouvre dans sa propre fenêtre, avec une icône dans ta barre des tâches ou ton Dock.</span>
            </div>
          ) : (
            <Steps steps={[
              { icon: <DownloadSimple size={18} weight="bold" />, title: <>Chrome ou Edge : l&apos;icône d&apos;installation dans la barre d&apos;adresse</>, text: 'À droite de l\'adresse (un petit écran avec une flèche). Sinon, menu des trois points puis « Installer Jason Marinho » (Edge : « Applications », puis « Installer ce site en tant qu\'application »).' },
              { icon: <AppleLogo size={18} weight="bold" />, title: <>Safari sur Mac : menu <b>Fichier</b>, puis <b>Ajouter au Dock</b></>, text: 'Disponible depuis macOS Sonoma.' },
              { icon: <Warning size={18} weight="bold" />, title: <>Firefox ne sait pas installer d&apos;app sur ordinateur</>, text: 'Utilise Chrome, Edge ou Safari, ou garde simplement l\'onglet en favori.' },
            ]} />
          )}
        </>
      )}

      <NotifHint />
    </div>
  )
}

function Steps({ steps }: { steps: Array<{ icon: React.ReactNode; title: React.ReactNode; text: string; extra?: React.ReactNode }> }) {
  return (
    <ol style={s.steps}>
      {steps.map((st, i) => (
        <li key={i} style={s.step}>
          <span style={s.num}>{i + 1}</span>
          <span style={s.stepIcon}>{st.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.stepTitle}>{st.title}</div>
            <div style={s.stepText}>{st.text}</div>
            {st.extra}
          </div>
        </li>
      ))}
    </ol>
  )
}

function OpenElsewhere({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try { await navigator.clipboard.writeText(INSTALL_URL); setCopied(true); setTimeout(() => setCopied(false), 2500) } catch { setCopied(false) }
  }
  return (
    <div style={s.warn}>
      <Warning size={20} weight="fill" style={{ color: 'var(--warning-text, #9A6700)', flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.warnTitle}>{title}</div>
        <div style={s.stepText}>{text}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
          <button type="button" onClick={copy} style={s.copyBtn}><Copy size={15} weight="bold" /> {copied ? 'Lien copié' : 'Copier le lien'}</button>
          <span style={s.url}>app.jasonmarinho.com/installer</span>
        </div>
      </div>
    </div>
  )
}

function QrBlock({ primary }: { primary?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { default: QRCodeStyling } = await import('qr-code-styling')
      if (cancelled || !ref.current) return
      const qr = new QRCodeStyling({
        width: 176, height: 176, data: INSTALL_URL,
        backgroundOptions: { color: '#FFFFFF' },
        dotsOptions: { color: '#004C3F', type: 'rounded' },
        cornersSquareOptions: { color: '#004C3F', type: 'extra-rounded' },
        cornersDotOptions: { color: '#004C3F' },
        qrOptions: { errorCorrectionLevel: 'M' },
      })
      ref.current.innerHTML = ''
      qr.append(ref.current)
    })()
    return () => { cancelled = true }
  }, [])
  return (
    <div style={{ ...s.qr, ...(primary ? {} : { marginTop: 18 }) }}>
      <div ref={ref} style={s.qrCode} aria-label="QR code vers la page d'installation" role="img" />
      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
        <div style={s.qrTitle}>{primary ? 'Le plus simple : scanne ce code avec ton téléphone' : 'Tu lis ceci sur un ordinateur ?'}</div>
        <div style={s.stepText}>
          Ouvre l&apos;appareil photo de ton téléphone et vise ce code, puis touche le lien qui apparaît. Cette page s&apos;ouvre sur ton téléphone avec les bonnes étapes (ou un seul bouton sur Android).
        </div>
        <div style={{ ...s.url, marginTop: 8 }}>ou tape app.jasonmarinho.com/installer</div>
      </div>
    </div>
  )
}

function Done({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <span style={{ ...s.stepIcon, width: 44, height: 44, borderRadius: 14 }}><CheckCircle size={24} weight="fill" /></span>
      <div>
        <div style={{ ...s.qrTitle, fontSize: 19 }}>{title}</div>
        <div style={s.stepText}>{text}</div>
        <Link href="/dashboard" style={{ ...s.copyBtn, marginTop: 12, textDecoration: 'none' }}>Ouvrir mon espace <ArrowRight size={14} weight="bold" /></Link>
      </div>
    </div>
  )
}

function NotifHint() {
  return (
    <div style={s.notif}>
      <BellRinging size={17} weight="fill" style={{ color: 'var(--accent-text)', flexShrink: 0, marginTop: 1 }} />
      <span>
        Une fois l&apos;app ouverte, active les notifications pour être prévenu d&apos;une nouvelle réservation, d&apos;un contrat signé ou d&apos;un paiement :{' '}
        <Link href="/dashboard/notifications#telephone" style={s.link}>Notifications, puis « Sur ton téléphone »</Link>.
      </span>
    </div>
  )
}

function Toggle() {
  return (
    <span aria-hidden="true" style={{ width: 26, height: 16, borderRadius: 99, background: '#34C759', position: 'relative', display: 'inline-block' }}>
      <span style={{ position: 'absolute', right: 2, top: 2, width: 12, height: 12, borderRadius: 99, background: '#fff' }} />
    </span>
  )
}

function AppIcon() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/icon-192.png" alt="" width={26} height={26} style={{ width: 26, height: 26, borderRadius: 7 }} />
}

const s: Record<string, React.CSSProperties> = {
  card: { display: 'flex', flexDirection: 'column', gap: 16, padding: 'clamp(16px, 4vw, 26px)', borderRadius: 20, background: 'var(--bg-2)', border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,40,30,0.06)' },
  tabs: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  tab: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 13px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  tabOn: { border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  here: { fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'var(--accent-text)', color: 'var(--bg)' },
  steps: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 },
  step: { display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderTop: '1px solid var(--border)' },
  num: { width: 24, height: 24, borderRadius: 99, flexShrink: 0, marginTop: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 800, background: 'var(--accent-text)', color: 'var(--bg)' },
  stepIcon: { width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-text)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' },
  stepTitle: { fontSize: 15, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 },
  stepText: { fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.55, marginTop: 3 },
  chipRow: { display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8 },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 9, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12.5, fontWeight: 600 },
  chipOr: { fontSize: 12, color: 'var(--text-3)' },
  oneTap: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 },
  bigBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%', maxWidth: 380, padding: '15px 20px', borderRadius: 14, border: 'none', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 16.5, fontWeight: 700, cursor: 'pointer' },
  oneTapText: { fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5 },
  or: { fontSize: 11.5, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 4 },
  subTitle: { fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 4 },
  warn: { display: 'flex', gap: 11, padding: '13px 14px', borderRadius: 14, background: 'color-mix(in srgb, #D69E2E 12%, transparent)', border: '1px solid color-mix(in srgb, #D69E2E 40%, transparent)' },
  warnTitle: { fontSize: 14.5, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 },
  copyBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 10, border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
  url: { fontSize: 12.5, color: 'var(--text-3)', wordBreak: 'break-all' },
  qr: { display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', padding: 16, borderRadius: 16, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' },
  qrCode: { width: 176, height: 176, flexShrink: 0, borderRadius: 12, overflow: 'hidden', background: '#fff', padding: 0 },
  qrTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 18, color: 'var(--text)', lineHeight: 1.3 },
  notif: { display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55, paddingTop: 12, borderTop: '1px solid var(--border)' },
  link: { color: 'var(--accent-text)', fontWeight: 700 },
}
