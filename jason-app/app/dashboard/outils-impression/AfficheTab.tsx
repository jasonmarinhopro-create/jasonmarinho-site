'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  WifiHigh, HouseSimple, ListChecks, BookOpen, Palette,
  CheckCircle, ArrowLeft, ArrowRight, DownloadSimple,
  ArrowsClockwise, Lock,
} from '@phosphor-icons/react/dist/ssr'
import { saveAffiche, getAfficheByLogement } from './actions'

interface Logement {
  id: string
  nom: string
  adresse?: string
  wifi_nom?: string
  wifi_mdp?: string
}

interface AfficheData {
  // Header
  logementNom: string
  tagline?: string
  showFlag: boolean
  // WiFi
  wifiSsid?: string
  wifiPassword?: string
  showWifi: boolean
  // Rules
  showRules: boolean
  houseRules: string[]
  // Departure
  showDeparture: boolean
  departureTime?: string
  departureChecklist: string[]
  departureNote?: string
  // Emergency
  showEmergency: boolean
  // Livret
  showLivret: boolean
  livretUrl?: string
  livretTitle?: string
  livretSubtitle?: string
  // Style
  accentColor: string
}

interface Props {
  plan: string
  logements: Logement[]
}

const STEPS = [
  { id: 'logement',  label: 'Accueil',         icon: HouseSimple },
  { id: 'wifi',      label: 'WiFi',             icon: WifiHigh },
  { id: 'rules',     label: 'Règles & Départ',  icon: ListChecks },
  { id: 'livret',    label: 'Livret + SOS',     icon: BookOpen },
  { id: 'style',     label: 'Style & export',   icon: Palette },
] as const

type StepId = (typeof STEPS)[number]['id']

const ACCENT_COLORS = [
  { id: '#D9612E', label: 'Coral' },
  { id: '#0B4C3F', label: 'Forêt' },
  { id: '#1e3a5f', label: 'Marine' },
  { id: '#7c3aed', label: 'Violet' },
  { id: '#b91c1c', label: 'Rouge' },
  { id: '#0f766e', label: 'Teal' },
]

const DEFAULT_RULES = [
  'Respect du calme et des autres clients',
  'Interdiction de fumer dans les chambres',
  'Respectez les horaires d\'arrivée et de départ',
  'Prenez soin du mobilier et des équipements',
]

const DEFAULT_CHECKLIST = [
  'Rendre la clé ou badge',
  'Vérifier que rien n\'est oublié',
  'Jeter les déchets dans les poubelles',
  'Éteindre les lumières et la climatisation',
]

function buildWifiQr(ssid: string, password: string): string {
  const s = ssid.replace(/[\\;,":]/g, c => `\\${c}`)
  const p = password.replace(/[\\;,":]/g, c => `\\${c}`)
  return `WIFI:T:WPA;S:${s};P:${p};;`
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function drawWifiIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, scale = 1) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 3 * scale
  ctx.lineCap = 'round'
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath()
    ctx.arc(cx, cy + 6 * scale, 6 * i * scale, Math.PI * 1.20, Math.PI * 1.80)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(cx, cy + 6 * scale, 2 * scale, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawSOSIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) {
  ctx.save()
  // Phone shape
  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  // Simplified handset
  ctx.arc(cx, cy + 6, 18, Math.PI * 1.05, Math.PI * 1.95)
  ctx.stroke()
  // SOS bubble
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(cx, cy - 4, 16, 11, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 10px Outfit, "Helvetica Neue", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('SOS', cx, cy - 3)
  ctx.textBaseline = 'alphabetic'
  ctx.restore()
}

function drawCheckmark(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 1.8
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.45, cy + r * 0.05)
  ctx.lineTo(cx - r * 0.10, cy + r * 0.40)
  ctx.lineTo(cx + r * 0.50, cy - r * 0.30)
  ctx.stroke()
  ctx.restore()
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(' ')
  let line = ''
  let drawn = 0
  for (const word of words) {
    const test = line ? line + ' ' + word : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + drawn * lineHeight)
      drawn++
      line = word
    } else {
      line = test
    }
  }
  if (line) {
    ctx.fillText(line, x, y + drawn * lineHeight)
    drawn++
  }
  return drawn
}

async function renderPosterCanvas(
  data: AfficheData,
  qrWifiUrl: string,
  qrLivretUrl: string,
  watermark: boolean,
): Promise<HTMLCanvasElement> {
  const W = 794
  const H = 1123
  const canvas = document.createElement('canvas')
  canvas.width = W * 2
  canvas.height = H * 2
  const ctx = canvas.getContext('2d')!
  ctx.scale(2, 2)

  const accent = data.accentColor
  const bg = '#FFFFFF'
  const textDark = '#1A1A1A'
  const textMute = '#7A7A7A'
  const dividerColor = `${accent}33`

  // Wait for fonts
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try { await (document as any).fonts.ready } catch {}
  }

  // Background
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // === HEADER ===
  // Flag emoji (small, centered above title)
  if (data.showFlag) {
    ctx.font = '22px "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
    ctx.fillStyle = textDark
    ctx.textAlign = 'center'
    ctx.fillText('🇫🇷', W / 2, 70)
  }

  // BIENVENUE — big bold serif
  ctx.font = 'bold 68px Georgia, "Times New Roman", serif'
  ctx.fillStyle = accent
  ctx.textAlign = 'center'
  ctx.fillText('BIENVENUE', W / 2, 130)

  // Subtitle
  const tagline = data.tagline || (data.logementNom
    ? `Bonjour et bienvenue à ${data.logementNom}. Voici quelques informations essentielles pour profiter pleinement de votre séjour.`
    : 'Voici quelques informations essentielles pour profiter pleinement de votre séjour.')
  ctx.font = '14px "Outfit", "Helvetica Neue", sans-serif'
  ctx.fillStyle = '#3A3A3A'
  ctx.textAlign = 'center'
  wrapText(ctx, tagline, W / 2, 165, W - 180, 22)

  // === TWO COLUMNS ===
  const colTop = 240
  const colBottom = data.showLivret ? 800 : 1020
  const midX = W / 2
  const leftX = 70
  const leftW = midX - leftX - 30
  const rightX = midX + 30
  const rightW = W - rightX - 70

  // Vertical divider
  ctx.strokeStyle = dividerColor
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(midX, colTop + 20)
  ctx.lineTo(midX, colBottom - 20)
  ctx.stroke()

  // === LEFT COLUMN: WiFi + SOS ===
  let lY = colTop + 20

  if (data.showWifi && data.wifiSsid) {
    // WiFi icon
    drawWifiIcon(ctx, leftX + leftW / 2, lY + 10, accent, 1.4)
    lY += 50

    // WIFI label
    ctx.font = 'bold 22px Georgia, "Times New Roman", serif'
    ctx.fillStyle = accent
    ctx.textAlign = 'center'
    ctx.fillText('WIFI', leftX + leftW / 2, lY + 10)
    lY += 30

    // QR code
    if (qrWifiUrl) {
      try {
        const qrImg = await loadImage(qrWifiUrl)
        const qrSize = Math.min(leftW - 60, 200)
        ctx.drawImage(qrImg, leftX + (leftW - qrSize) / 2, lY, qrSize, qrSize)
        lY += qrSize + 14
      } catch {}
    }

    // SSID + password
    ctx.font = 'bold 13px "Outfit", "Helvetica Neue", sans-serif'
    ctx.fillStyle = textDark
    ctx.textAlign = 'center'
    ctx.fillText(data.wifiSsid, leftX + leftW / 2, lY)
    lY += 18
    if (data.wifiPassword) {
      ctx.font = '12px monospace'
      ctx.fillStyle = textMute
      ctx.fillText(data.wifiPassword, leftX + leftW / 2, lY)
      lY += 16
    }
    lY += 30
  }

  // SOS section
  if (data.showEmergency) {
    drawSOSIcon(ctx, leftX + leftW / 2, lY + 10, accent)
    lY += 40

    const cellW = leftW / 3
    const numbers = [
      { label: 'Pompier', value: '18' },
      { label: 'Samu',    value: '15' },
      { label: 'Police',  value: '17' },
    ]
    numbers.forEach((n, i) => {
      const cx = leftX + cellW * (i + 0.5)
      ctx.font = 'bold 13px "Outfit", "Helvetica Neue", sans-serif'
      ctx.fillStyle = accent
      ctx.textAlign = 'center'
      ctx.fillText(n.label, cx, lY + 14)
      ctx.font = '13px "Outfit", "Helvetica Neue", sans-serif'
      ctx.fillStyle = textDark
      ctx.fillText(n.value, cx, lY + 36)
    })
  }

  // === RIGHT COLUMN: Rules + Departure ===
  let rY = colTop + 20

  if (data.showRules) {
    ctx.font = 'bold 22px Georgia, "Times New Roman", serif'
    ctx.fillStyle = accent
    ctx.textAlign = 'center'
    ctx.fillText('LES RÈGLES', rightX + rightW / 2, rY + 10)
    rY += 38

    const rules = data.houseRules.length > 0 ? data.houseRules : DEFAULT_RULES
    rules.forEach((rule, i) => {
      const num = String(i + 1).padStart(2, '0') + '.'
      ctx.font = 'bold 12.5px "Outfit", "Helvetica Neue", sans-serif'
      ctx.fillStyle = accent
      ctx.textAlign = 'left'
      ctx.fillText(num, rightX, rY)

      ctx.font = '12.5px "Outfit", "Helvetica Neue", sans-serif'
      ctx.fillStyle = textDark
      const lines = wrapText(ctx, rule, rightX + 32, rY, rightW - 32, 16)
      rY += Math.max(24, lines * 16 + 8)
    })
    rY += 12
  }

  if (data.showDeparture) {
    ctx.font = 'bold 22px Georgia, "Times New Roman", serif'
    ctx.fillStyle = accent
    ctx.textAlign = 'center'
    ctx.fillText('DÉPART', rightX + rightW / 2, rY + 10)
    rY += 32

    if (data.departureTime) {
      ctx.font = 'bold 14px "Outfit", "Helvetica Neue", sans-serif'
      ctx.fillStyle = textDark
      ctx.textAlign = 'center'
      ctx.fillText(data.departureTime, rightX + rightW / 2, rY)
      rY += 22
    }

    if (data.departureNote) {
      ctx.font = 'italic 11.5px "Outfit", "Helvetica Neue", sans-serif'
      ctx.fillStyle = textDark
      ctx.textAlign = 'center'
      const lines = wrapText(ctx, data.departureNote, rightX + rightW / 2, rY, rightW - 20, 15)
      rY += lines * 15 + 12
    }

    const checklist = data.departureChecklist.length > 0 ? data.departureChecklist : DEFAULT_CHECKLIST
    checklist.forEach(item => {
      drawCheckmark(ctx, rightX + 8, rY - 4, 7, accent)
      ctx.font = '12.5px "Outfit", "Helvetica Neue", sans-serif'
      ctx.fillStyle = textDark
      ctx.textAlign = 'left'
      ctx.fillText(item, rightX + 24, rY)
      rY += 22
    })
  }

  // === BOTTOM: Livret ===
  if (data.showLivret) {
    // Horizontal divider
    ctx.strokeStyle = dividerColor
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(70, 870)
    ctx.lineTo(W - 70, 870)
    ctx.stroke()

    const livretY = 900

    if (qrLivretUrl) {
      try {
        const qrImg = await loadImage(qrLivretUrl)
        ctx.drawImage(qrImg, 70, livretY, 130, 130)
      } catch {}
    }

    const tx = qrLivretUrl ? 220 : 70
    const tw = W - tx - 70

    ctx.font = 'italic bold 22px Georgia, "Times New Roman", serif'
    ctx.fillStyle = accent
    ctx.textAlign = 'left'
    ctx.fillText(data.livretTitle || 'Scannez ici notre livret d\'accueil', tx, livretY + 28)

    ctx.font = '12.5px "Outfit", "Helvetica Neue", sans-serif'
    ctx.fillStyle = textDark
    const sub = data.livretSubtitle || 'De nombreux détails supplémentaires sont inclus dans le livret, ainsi que des recommandations de bonnes adresses locales sélectionnées par nos soins.'
    wrapText(ctx, sub, tx, livretY + 52, tw, 17)

    ctx.font = 'bold 13px "Outfit", "Helvetica Neue", sans-serif'
    ctx.fillStyle = textDark
    ctx.fillText('Bon séjour !', tx, livretY + 110)
  }

  // === FOOTER ===
  ctx.font = '10.5px "Outfit", "Helvetica Neue", sans-serif'
  ctx.fillStyle = textMute
  ctx.textAlign = 'center'
  ctx.fillText('Créé avec Jason Marinho', W / 2, H - 24)

  // Watermark
  if (watermark) {
    ctx.save()
    ctx.globalAlpha = 0.10
    ctx.font = 'bold 56px sans-serif'
    ctx.fillStyle = '#000000'
    ctx.textAlign = 'center'
    ctx.translate(W / 2, H / 2)
    ctx.rotate(-Math.PI / 5)
    for (let i = -2; i <= 2; i++) {
      ctx.fillText('APERÇU — STANDARD', 0, i * 130)
    }
    ctx.restore()
  }

  return canvas
}

async function generateQrPng(content: string, accentColor: string): Promise<string> {
  if (!content) return ''
  const { default: QRCodeStyling } = await import('qr-code-styling')
  const qr = new QRCodeStyling({
    width: 240, height: 240,
    data: content,
    backgroundOptions: { color: '#FFFFFF' },
    dotsOptions: { color: accentColor, type: 'rounded' },
    cornersSquareOptions: { color: accentColor },
    cornersDotOptions: { color: accentColor },
    qrOptions: { errorCorrectionLevel: 'M' },
  })
  return new Promise<string>((resolve) => {
    qr.getRawData('png').then((raw: unknown) => {
      const blob = raw instanceof Blob ? raw : null
      if (!blob) { resolve(''); return }
      const reader = new FileReader()
      reader.onload = e => resolve(e.target?.result as string ?? '')
      reader.readAsDataURL(blob)
    })
  })
}

export default function AfficheTab({ plan, logements }: Props) {
  const isStandard = plan !== 'decouverte'
  const [step, setStep] = useState<StepId>('logement')
  const [data, setData] = useState<AfficheData>({
    logementNom: '',
    showFlag: true,
    showWifi: true,
    showRules: true,
    houseRules: [...DEFAULT_RULES],
    showDeparture: true,
    departureTime: '11h00',
    departureChecklist: [...DEFAULT_CHECKLIST],
    departureNote: 'Pensez à nous signaler tout dommage ou dysfonctionnement éventuel. Merci.',
    showEmergency: true,
    showLivret: false,
    livretTitle: 'Scannez ici notre livret d\'accueil',
    livretSubtitle: 'De nombreux détails supplémentaires sont inclus dans le livret, ainsi que des recommandations de bonnes adresses locales sélectionnées par nos soins.',
    accentColor: '#D9612E',
  })
  const [hexDraft, setHexDraft] = useState('D9612E')
  const [selectedLogementId, setSelectedLogementId] = useState<string>('')
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isRendering, setIsRendering] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stepIdx = STEPS.findIndex(s => s.id === step)

  function setField<K extends keyof AfficheData>(key: K, value: AfficheData[K]) {
    setData(prev => ({ ...prev, [key]: value }))
  }

  function setAccentColor(c: string) {
    setData(prev => ({ ...prev, accentColor: c }))
    setHexDraft(c.replace('#', '').toUpperCase())
  }

  // Prefill from logement
  useEffect(() => {
    if (!selectedLogementId) return
    const l = logements.find(x => x.id === selectedLogementId)
    if (!l) return
    setData(prev => ({
      ...prev,
      logementNom: l.nom,
      wifiSsid: l.wifi_nom ?? prev.wifiSsid,
      wifiPassword: l.wifi_mdp ?? prev.wifiPassword,
    }))
    getAfficheByLogement(selectedLogementId).then(existing => {
      if (existing?.data) {
        setData(d => ({ ...d, ...(existing.data as Partial<AfficheData>) }))
        setSavedId(existing.id)
      }
    })
  }, [selectedLogementId, logements])

  const renderPreview = useCallback(async () => {
    setIsRendering(true)
    try {
      const qrWifi = (data.showWifi && data.wifiSsid)
        ? await generateQrPng(buildWifiQr(data.wifiSsid, data.wifiPassword ?? ''), data.accentColor)
        : ''
      const qrLivret = (data.showLivret && data.livretUrl)
        ? await generateQrPng(data.livretUrl, data.accentColor)
        : ''
      const canvas = await renderPosterCanvas(data, qrWifi, qrLivret, !isStandard)
      setPreviewUrl(canvas.toDataURL('image/jpeg', 0.92))
    } catch (e) {
      console.error(e)
    } finally {
      setIsRendering(false)
    }
  }, [data, isStandard])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(renderPreview, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [renderPreview])

  async function downloadPng() {
    const qrWifi = (data.showWifi && data.wifiSsid)
      ? await generateQrPng(buildWifiQr(data.wifiSsid, data.wifiPassword ?? ''), data.accentColor)
      : ''
    const qrLivret = (data.showLivret && data.livretUrl)
      ? await generateQrPng(data.livretUrl, data.accentColor)
      : ''
    const canvas = await renderPosterCanvas(data, qrWifi, qrLivret, !isStandard)
    const link = document.createElement('a')
    link.download = `affiche-${data.logementNom || 'logement'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  async function downloadPdf() {
    const { jsPDF } = await import('jspdf')
    const qrWifi = (data.showWifi && data.wifiSsid)
      ? await generateQrPng(buildWifiQr(data.wifiSsid, data.wifiPassword ?? ''), data.accentColor)
      : ''
    const qrLivret = (data.showLivret && data.livretUrl)
      ? await generateQrPng(data.livretUrl, data.accentColor)
      : ''
    const canvas = await renderPosterCanvas(data, qrWifi, qrLivret, !isStandard)
    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)
    pdf.save(`affiche-${data.logementNom || 'logement'}.pdf`)
  }

  async function handleSave() {
    if (!selectedLogementId) return
    setIsSaving(true)
    try {
      const result = await saveAffiche({ logementId: selectedLogementId, data: data as unknown as Record<string, unknown>, existingId: savedId ?? undefined })
      if (result.id) setSavedId(result.id)
    } finally {
      setIsSaving(false)
    }
  }

  function updateListItem(key: 'houseRules' | 'departureChecklist', idx: number, value: string) {
    setData(prev => {
      const next = [...prev[key]]
      next[idx] = value
      return { ...prev, [key]: next }
    })
  }

  function addListItem(key: 'houseRules' | 'departureChecklist') {
    setData(prev => ({ ...prev, [key]: [...prev[key], ''] }))
  }

  function removeListItem(key: 'houseRules' | 'departureChecklist', idx: number) {
    setData(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) }))
  }

  return (
    <div style={s.layout}>
      <div style={s.wizardCol}>
        {/* Step bar */}
        <div style={s.stepBar}>
          {STEPS.map((st, i) => {
            const Icon = st.icon
            const done = i < stepIdx
            const active = st.id === step
            return (
              <button
                key={st.id}
                onClick={() => setStep(st.id)}
                style={{ ...s.stepBtn, ...(active ? s.stepBtnActive : done ? s.stepBtnDone : {}) }}
              >
                <div style={{ ...s.stepNum, ...(active ? s.stepNumActive : done ? s.stepNumDone : {}) }}>
                  {done ? <CheckCircle size={14} weight="fill" /> : <Icon size={14} />}
                </div>
                <span style={s.stepLabel}>{st.label}</span>
              </button>
            )
          })}
        </div>

        {/* Step content */}
        <div style={s.stepContent}>
          {step === 'logement' && (
            <div style={s.stepInner}>
              <h3 style={s.stepTitle}>Accueil voyageurs</h3>
              <p style={s.stepDesc}>Le titre de l&apos;affiche sera <strong>BIENVENUE</strong>. Tu peux personnaliser le message d&apos;accueil et nommer ton logement.</p>

              {logements.length > 0 && (
                <div style={s.fieldWrap}>
                  <label style={s.fieldLabel}>Logement existant (préremplit + sauvegarde)</label>
                  <div style={s.selectWrap}>
                    <select
                      value={selectedLogementId}
                      onChange={e => setSelectedLogementId(e.target.value)}
                      style={s.select}
                    >
                      <option value="">— Sélectionner —</option>
                      {logements.map(l => (
                        <option key={l.id} value={l.id}>{l.nom}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div style={s.fieldWrap}>
                <label style={s.fieldLabel}>Nom du logement *</label>
                <input
                  style={s.input}
                  placeholder="Studio Marais, Chalet Savoie…"
                  value={data.logementNom}
                  onChange={e => setField('logementNom', e.target.value)}
                />
              </div>

              <div style={s.fieldWrap}>
                <label style={s.fieldLabel}>Message d&apos;accueil (optionnel)</label>
                <textarea
                  style={{ ...s.input, minHeight: '70px', resize: 'vertical' as const }}
                  placeholder={`Bonjour et bienvenue à ${data.logementNom || '[logement]'}. Voici quelques informations essentielles…`}
                  value={data.tagline ?? ''}
                  onChange={e => setField('tagline', e.target.value)}
                />
                <span style={s.hint}>Si vide, un message par défaut sera utilisé.</span>
              </div>

              <div style={s.toggleRow}>
                <label style={s.toggleLabel}>Afficher le drapeau 🇫🇷</label>
                <ToggleSwitch value={data.showFlag} onChange={v => setField('showFlag', v)} />
              </div>
            </div>
          )}

          {step === 'wifi' && (
            <div style={s.stepInner}>
              <h3 style={s.stepTitle}>Connexion WiFi</h3>
              <p style={s.stepDesc}>Tes voyageurs scannent le QR code et sont connectés en 1 seconde, sans saisir de mot de passe.</p>

              <div style={s.toggleRow}>
                <label style={s.toggleLabel}>Inclure le WiFi sur l&apos;affiche</label>
                <ToggleSwitch value={data.showWifi} onChange={v => setField('showWifi', v)} />
              </div>

              {data.showWifi && (
                <>
                  <div style={s.fieldWrap}>
                    <label style={s.fieldLabel}>Nom du réseau (SSID) *</label>
                    <input
                      style={s.input}
                      placeholder="MonWiFi-5G"
                      value={data.wifiSsid ?? ''}
                      onChange={e => setField('wifiSsid', e.target.value)}
                    />
                  </div>
                  <div style={s.fieldWrap}>
                    <label style={s.fieldLabel}>Mot de passe</label>
                    <input
                      style={s.input}
                      type="text"
                      placeholder="MotDePasseWifi"
                      value={data.wifiPassword ?? ''}
                      onChange={e => setField('wifiPassword', e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'rules' && (
            <div style={s.stepInner}>
              <h3 style={s.stepTitle}>Règles & Départ</h3>
              <p style={s.stepDesc}>Les règles de la maison + la checklist de départ. Modifie-les selon ton logement.</p>

              <div style={s.toggleRow}>
                <label style={s.toggleLabel}>LES RÈGLES</label>
                <ToggleSwitch value={data.showRules} onChange={v => setField('showRules', v)} />
              </div>
              {data.showRules && (
                <div style={s.listEditor}>
                  {data.houseRules.map((rule, i) => (
                    <div key={i} style={s.listItem}>
                      <span style={s.listNum}>{String(i + 1).padStart(2, '0')}.</span>
                      <input
                        style={{ ...s.input, flex: 1 }}
                        value={rule}
                        onChange={e => updateListItem('houseRules', i, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeListItem('houseRules', i)}
                        style={s.removeBtn}
                        aria-label="Supprimer"
                      >×</button>
                    </div>
                  ))}
                  {data.houseRules.length < 6 && (
                    <button type="button" onClick={() => addListItem('houseRules')} style={s.addBtn}>
                      + Ajouter une règle
                    </button>
                  )}
                </div>
              )}

              <div style={{ ...s.toggleRow, marginTop: '8px' }}>
                <label style={s.toggleLabel}>DÉPART</label>
                <ToggleSwitch value={data.showDeparture} onChange={v => setField('showDeparture', v)} />
              </div>
              {data.showDeparture && (
                <>
                  <div style={s.fieldRow2}>
                    <div style={s.fieldWrap}>
                      <label style={s.fieldLabel}>Heure de départ</label>
                      <input
                        style={s.input}
                        placeholder="11h00"
                        value={data.departureTime ?? ''}
                        onChange={e => setField('departureTime', e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={s.fieldWrap}>
                    <label style={s.fieldLabel}>Note italique (optionnel)</label>
                    <input
                      style={s.input}
                      placeholder="Pensez à nous signaler tout dommage…"
                      value={data.departureNote ?? ''}
                      onChange={e => setField('departureNote', e.target.value)}
                    />
                  </div>
                  <div style={s.listEditor}>
                    <label style={s.fieldLabel}>Checklist de départ</label>
                    {data.departureChecklist.map((item, i) => (
                      <div key={i} style={s.listItem}>
                        <span style={s.listCheck}>✓</span>
                        <input
                          style={{ ...s.input, flex: 1 }}
                          value={item}
                          onChange={e => updateListItem('departureChecklist', i, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeListItem('departureChecklist', i)}
                          style={s.removeBtn}
                          aria-label="Supprimer"
                        >×</button>
                      </div>
                    ))}
                    {data.departureChecklist.length < 6 && (
                      <button type="button" onClick={() => addListItem('departureChecklist')} style={s.addBtn}>
                        + Ajouter une étape
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'livret' && (
            <div style={s.stepInner}>
              <h3 style={s.stepTitle}>Livret d&apos;accueil & Numéros d&apos;urgence</h3>
              <p style={s.stepDesc}>Ajoute un QR code en bas de l&apos;affiche pour ton livret d&apos;accueil digital, et les numéros d&apos;urgence FR (18, 15, 17).</p>

              <div style={s.toggleRow}>
                <label style={s.toggleLabel}>Numéros d&apos;urgence (Pompier, Samu, Police)</label>
                <ToggleSwitch value={data.showEmergency} onChange={v => setField('showEmergency', v)} />
              </div>

              <div style={s.toggleRow}>
                <label style={s.toggleLabel}>QR code livret d&apos;accueil</label>
                <ToggleSwitch value={data.showLivret} onChange={v => setField('showLivret', v)} />
              </div>

              {data.showLivret && (
                <>
                  <div style={s.fieldWrap}>
                    <label style={s.fieldLabel}>URL du livret * (annonce, Drive, livret digital…)</label>
                    <input
                      style={s.input}
                      type="url"
                      placeholder="https://..."
                      value={data.livretUrl ?? ''}
                      onChange={e => setField('livretUrl', e.target.value)}
                    />
                  </div>
                  <div style={s.fieldWrap}>
                    <label style={s.fieldLabel}>Titre du livret</label>
                    <input
                      style={s.input}
                      value={data.livretTitle ?? ''}
                      onChange={e => setField('livretTitle', e.target.value)}
                    />
                  </div>
                  <div style={s.fieldWrap}>
                    <label style={s.fieldLabel}>Description courte</label>
                    <textarea
                      style={{ ...s.input, minHeight: '70px', resize: 'vertical' as const }}
                      value={data.livretSubtitle ?? ''}
                      onChange={e => setField('livretSubtitle', e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'style' && (
            <div style={s.stepInner}>
              <h3 style={s.stepTitle}>Style & export</h3>
              <p style={s.stepDesc}>Choisis la couleur principale puis télécharge ton affiche.</p>

              <div style={s.fieldWrap}>
                <label style={s.fieldLabel}>Couleur principale</label>
                <div style={s.colorGrid}>
                  {ACCENT_COLORS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setAccentColor(c.id)}
                      style={{
                        ...s.colorCard,
                        border: data.accentColor === c.id ? `2px solid ${c.id}` : '2px solid transparent',
                      }}
                    >
                      <div style={{ ...s.colorDot, background: c.id }} />
                      <span style={s.colorLabel}>{c.label}</span>
                    </button>
                  ))}
                </div>
                <div style={s.hexWrap}>
                  <input
                    type="color"
                    value={data.accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    style={s.colorPicker}
                    title="Sélecteur de couleur"
                  />
                  <span style={s.hexHash}>#</span>
                  <input
                    type="text"
                    value={hexDraft}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase()
                      setHexDraft(raw)
                      if (raw.length === 6) setField('accentColor', '#' + raw)
                      else if (raw.length === 3) setField('accentColor', '#' + raw.split('').map(c => c + c).join(''))
                    }}
                    onBlur={() => setHexDraft(data.accentColor.replace('#', '').toUpperCase())}
                    placeholder="0B4C3F"
                    spellCheck={false}
                    maxLength={6}
                    style={s.hexInput}
                  />
                  <div style={{ ...s.hexPreview, background: data.accentColor }} />
                </div>
              </div>

              {/* Download */}
              <div style={s.actionBox}>
                {!isStandard && (
                  <div style={s.watermarkNotice}>
                    <Lock size={13} weight="fill" />
                    <span>En plan Découverte, l&apos;affiche est exportée avec un filigrane. Passe en Standard pour l&apos;affiche sans filigrane.</span>
                  </div>
                )}
                <div style={s.dlRow}>
                  <button onClick={downloadPng} style={s.dlBtn}>
                    <DownloadSimple size={15} weight="bold" />
                    Télécharger PNG
                  </button>
                  <button onClick={downloadPdf} style={{ ...s.dlBtn, ...s.dlBtnSecondary }}>
                    <DownloadSimple size={15} weight="bold" />
                    PDF A4 imprimable
                  </button>
                </div>
                {selectedLogementId && (
                  <button onClick={handleSave} disabled={isSaving} style={s.saveBtn}>
                    {isSaving ? 'Sauvegarde…' : savedId ? '✓ Design sauvegardé' : 'Sauvegarder pour ce logement'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <div style={s.navButtons}>
          {stepIdx > 0 && (
            <button onClick={() => setStep(STEPS[stepIdx - 1].id)} style={s.navBtn}>
              <ArrowLeft size={15} />
              Précédent
            </button>
          )}
          {stepIdx < STEPS.length - 1 && (
            <button
              onClick={() => setStep(STEPS[stepIdx + 1].id)}
              style={{ ...s.navBtn, ...s.navBtnPrimary, marginLeft: 'auto' }}
            >
              Suivant
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Preview */}
      <div style={s.previewCol}>
        <div style={s.previewCard}>
          <div style={s.previewHeader}>
            <div style={s.previewLabel}>Aperçu en direct</div>
            {isRendering && (
              <div style={s.renderingChip}>
                <ArrowsClockwise size={11} />
                Mise à jour…
              </div>
            )}
          </div>
          <div style={s.previewWrap}>
            {previewUrl ? (
              <img src={previewUrl} alt="Aperçu affiche" style={s.previewImg} />
            ) : (
              <div style={s.previewEmpty}>
                <ArrowsClockwise size={24} style={{ opacity: 0.4 }} />
                <span>Génération de l&apos;aperçu…</span>
              </div>
            )}
          </div>
          <p style={s.previewNote}>Format A4 · 210 × 297 mm · Prêt à imprimer</p>
        </div>
      </div>
    </div>
  )
}

function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        ...ts.track,
        background: value ? 'var(--accent-text)' : 'var(--border-2)',
      }}
      aria-pressed={value}
    >
      <div style={{ ...ts.thumb, transform: value ? 'translateX(18px)' : 'translateX(2px)' }} />
    </button>
  )
}

const ts: Record<string, React.CSSProperties> = {
  track: {
    width: '38px', height: '22px', borderRadius: '999px',
    border: 'none', cursor: 'pointer', position: 'relative' as const,
    transition: 'background 0.2s', flexShrink: 0,
    padding: 0,
  },
  thumb: {
    position: 'absolute' as const,
    top: '2px',
    width: '18px', height: '18px',
    borderRadius: '50%', background: '#FFFFFF',
    transition: 'transform 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
  },
}

const s: Record<string, React.CSSProperties> = {
  layout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
    gap: 'clamp(20px, 3vw, 40px)',
    alignItems: 'start',
    width: '100%',
  },
  wizardCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  stepBar: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  stepBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '8px 14px',
    borderRadius: '10px',
    fontSize: '12.5px',
    fontWeight: 400,
    color: 'var(--text-3)',
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
    transition: 'all 0.15s',
  },
  stepBtnActive: {
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)',
    fontWeight: 600,
  },
  stepBtnDone: {
    color: 'var(--text-2)',
    background: 'var(--surface-2)',
  },
  stepNum: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-3)',
  },
  stepNumActive: { color: 'var(--accent-text)' },
  stepNumDone:   { color: 'var(--text-2)' },
  stepLabel: {},
  stepContent: {
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  stepInner: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  stepTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '20px',
    fontWeight: 400,
    color: 'var(--text)',
    margin: 0,
    letterSpacing: '-0.2px',
  },
  stepDesc: {
    fontSize: '13.5px',
    color: 'var(--text-2)',
    margin: 0,
    lineHeight: 1.6,
  },
  fieldWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldRow2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
  },
  fieldLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-3)',
    letterSpacing: '0.1px',
  },
  hint: {
    fontSize: '11.5px',
    color: 'var(--text-muted)',
    fontStyle: 'italic' as const,
  },
  input: {
    background: 'var(--bg)',
    border: '1px solid var(--border-2)',
    borderRadius: '10px',
    padding: '10px 13px',
    fontSize: '14px',
    color: 'var(--text)',
    fontFamily: 'var(--font-outfit), sans-serif',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  selectWrap: {
    position: 'relative' as const,
  },
  select: {
    background: 'var(--bg)',
    border: '1px solid var(--border-2)',
    borderRadius: '10px',
    padding: '10px 36px 10px 13px',
    fontSize: '13.5px',
    color: 'var(--text)',
    fontFamily: 'var(--font-outfit), sans-serif',
    outline: 'none',
    width: '100%',
    appearance: 'none' as const,
    cursor: 'pointer',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid var(--border-2)',
  },
  toggleLabel: {
    fontSize: '13.5px',
    fontWeight: 500,
    color: 'var(--text)',
  },
  listEditor: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  listNum: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--accent-text)',
    minWidth: '24px',
    fontFamily: 'monospace',
  },
  listCheck: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--accent-text)',
    minWidth: '20px',
    textAlign: 'center' as const,
  },
  removeBtn: {
    width: '28px',
    height: '28px',
    flexShrink: 0,
    background: 'var(--bg)',
    border: '1px solid var(--border-2)',
    borderRadius: '7px',
    color: 'var(--text-3)',
    fontSize: '16px',
    cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
  },
  addBtn: {
    alignSelf: 'flex-start' as const,
    fontSize: '12.5px',
    fontWeight: 500,
    color: 'var(--accent-text)',
    background: 'transparent',
    border: '1px dashed var(--accent-border)',
    borderRadius: '8px',
    padding: '7px 12px',
    cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
  },
  colorGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  colorCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'var(--bg)',
    cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
    transition: 'all 0.15s',
  },
  colorDot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  colorLabel: {
    fontSize: '11.5px',
    color: 'var(--text-2)',
    fontWeight: 500,
    fontFamily: 'var(--font-outfit), sans-serif',
  },
  hexWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    marginTop: '8px',
    background: 'var(--bg)',
    border: '1px solid var(--border-2)',
    borderRadius: '10px',
    padding: '4px 10px',
    width: 'fit-content',
  },
  colorPicker: {
    width: '26px',
    height: '26px',
    borderRadius: '7px',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    background: 'none',
    marginRight: '8px',
  },
  hexHash: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    fontFamily: 'monospace',
    fontWeight: 500,
  },
  hexInput: {
    width: '74px',
    background: 'transparent',
    border: 'none',
    padding: '7px 6px',
    fontSize: '13px',
    color: 'var(--text)',
    fontFamily: 'monospace',
    fontWeight: 500,
    outline: 'none',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  },
  hexPreview: {
    width: '20px',
    height: '20px',
    borderRadius: '5px',
    border: '1px solid var(--border-2)',
    flexShrink: 0,
  },
  actionBox: {
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '4px',
  },
  watermarkNotice: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '12.5px',
    color: 'var(--accent-text)',
    lineHeight: 1.5,
  },
  dlRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  dlBtn: {
    flex: 1,
    minWidth: '140px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--accent-text)',
    background: 'var(--surface)',
    border: '1px solid var(--accent-border)',
    cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
  },
  dlBtnSecondary: {
    background: 'transparent',
    color: 'var(--accent-text)',
  },
  saveBtn: {
    padding: '8px 16px',
    borderRadius: '10px',
    fontSize: '12.5px',
    fontWeight: 500,
    color: 'var(--accent-text)',
    background: 'transparent',
    border: '1px solid var(--accent-border)',
    cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
    alignSelf: 'flex-start' as const,
  },
  navButtons: {
    display: 'flex',
    gap: '10px',
  },
  navBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    borderRadius: '10px',
    fontSize: '13.5px',
    fontWeight: 500,
    color: 'var(--text-2)',
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
    transition: 'all 0.15s',
  },
  navBtnPrimary: {
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)',
    fontWeight: 600,
  },
  previewCol: {
    position: 'sticky' as const,
    top: 'calc(var(--header-h) + 16px)',
  },
  previewCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewLabel: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.7px',
    textTransform: 'uppercase' as const,
    color: 'var(--text-muted)',
  },
  renderingChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '10.5px',
    color: 'var(--accent-text)',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: '999px',
    padding: '3px 9px',
  },
  previewWrap: {
    width: '100%',
    aspectRatio: '210 / 297',
    background: 'var(--bg)',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border-2)',
  },
  previewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
  },
  previewEmpty: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  previewNote: {
    fontSize: '11.5px',
    color: 'var(--text-muted)',
    margin: 0,
    textAlign: 'center' as const,
  },
}
