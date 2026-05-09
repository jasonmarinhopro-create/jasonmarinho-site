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

function fillRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
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
  const textMute = '#6B7280'
  const dividerColor = accent + '28'

  if (typeof document !== 'undefined' && 'fonts' in document) {
    try { await (document as any).fonts.ready } catch {}
  }

  // Background
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Top accent strip
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, W, 5)

  // === HEADER ===
  let hY = 32

  // Flags
  if (data.showFlag) {
    ctx.font = '18px "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
    ctx.fillStyle = textDark
    ctx.textAlign = 'center'
    ctx.fillText('🇫🇷  🇬🇧', W / 2, hY + 14)
    hY += 28
  }

  // Thin decorative bar
  ctx.fillStyle = dividerColor
  ctx.fillRect(W / 2 - 80, hY + 4, 160, 1)
  hY += 16

  // BIENVENUE
  ctx.font = 'bold 60px Georgia, "Times New Roman", serif'
  ctx.fillStyle = accent
  ctx.textAlign = 'center'
  ctx.fillText('BIENVENUE', W / 2, hY + 56)
  hY += 62

  // WELCOME — secondary, spaced
  ctx.font = '20px Georgia, "Times New Roman", serif'
  ctx.fillStyle = textMute
  ctx.textAlign = 'center'
  ctx.fillText('— WELCOME —', W / 2, hY + 4)
  hY += 22

  // Full separator
  ctx.strokeStyle = dividerColor
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(60, hY + 10)
  ctx.lineTo(W - 60, hY + 10)
  ctx.stroke()
  hY += 24

  // Tagline
  const taglineDefault = data.logementNom
    ? `Bienvenue à ${data.logementNom} · Welcome to ${data.logementNom}`
    : 'Bienvenue dans notre logement · Welcome to our home'
  ctx.font = '13px "Outfit", "Helvetica Neue", sans-serif'
  ctx.fillStyle = '#4A4A4A'
  ctx.textAlign = 'center'
  const tlLines = wrapText(ctx, data.tagline || taglineDefault, W / 2, hY, W - 200, 19)
  hY += tlLines * 19 + 16

  // === COLUMN SETUP ===
  const colTop = hY + 4
  const midX = W / 2
  const pad = 56
  const colGap = 18
  const leftX = pad
  const leftW = midX - pad - colGap
  const rightX = midX + colGap
  const rightW = W - midX - colGap - pad

  // === LEFT COLUMN: WiFi ===
  let lY = colTop + 10

  if (data.showWifi && data.wifiSsid) {
    ctx.font = 'bold 15px Georgia, "Times New Roman", serif'
    ctx.fillStyle = accent
    ctx.textAlign = 'center'
    ctx.fillText('WIFI', leftX + leftW / 2, lY + 14)
    lY += 20

    drawWifiIcon(ctx, leftX + leftW / 2, lY + 12, accent, 1.2)
    lY += 40

    if (qrWifiUrl) {
      try {
        const qrImg = await loadImage(qrWifiUrl)
        const qrSize = Math.min(leftW - 28, 188)
        ctx.drawImage(qrImg, leftX + (leftW - qrSize) / 2, lY, qrSize, qrSize)
        lY += qrSize + 12
      } catch {}
    }

    ctx.font = 'bold 12px "Outfit", "Helvetica Neue", sans-serif'
    ctx.fillStyle = textDark
    ctx.textAlign = 'center'
    ctx.fillText(data.wifiSsid, leftX + leftW / 2, lY)
    lY += 18

    if (data.wifiPassword) {
      ctx.font = '11px monospace'
      ctx.fillStyle = textMute
      const pwText = data.wifiPassword
      const pwW = Math.min(ctx.measureText(pwText).width + 22, leftW - 8)
      const pwX = leftX + (leftW - pwW) / 2
      ctx.fillStyle = accent + '14'
      fillRoundRect(ctx, pwX, lY - 2, pwW, 20, 5)
      ctx.fill()
      ctx.fillStyle = textMute
      ctx.font = '11px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(pwText, leftX + leftW / 2, lY + 13)
      lY += 28
    }
  }

  // === RIGHT COLUMN: Rules + Departure ===
  let rY = colTop + 10

  if (data.showRules) {
    ctx.font = 'bold 15px Georgia, "Times New Roman", serif'
    ctx.fillStyle = accent
    ctx.textAlign = 'center'
    ctx.fillText('LES RÈGLES', rightX + rightW / 2, rY + 14)
    rY += 20
    ctx.font = '9.5px "Outfit", "Helvetica Neue", sans-serif'
    ctx.fillStyle = textMute
    ctx.textAlign = 'center'
    ctx.fillText('HOUSE RULES', rightX + rightW / 2, rY + 10)
    rY += 26

    const rules = data.houseRules.length > 0 ? data.houseRules : DEFAULT_RULES
    rules.forEach(rule => {
      ctx.fillStyle = accent
      ctx.fillRect(rightX, rY - 7, 3, 13)
      ctx.font = '12.5px "Outfit", "Helvetica Neue", sans-serif'
      ctx.fillStyle = textDark
      ctx.textAlign = 'left'
      const lines = wrapText(ctx, rule, rightX + 11, rY, rightW - 11, 17)
      rY += Math.max(26, lines * 17 + 10)
    })
    rY += 8
  }

  if (data.showDeparture) {
    ctx.font = 'bold 15px Georgia, "Times New Roman", serif'
    ctx.fillStyle = accent
    ctx.textAlign = 'center'
    ctx.fillText('DÉPART', rightX + rightW / 2, rY + 14)
    rY += 20
    ctx.font = '9.5px "Outfit", "Helvetica Neue", sans-serif'
    ctx.fillStyle = textMute
    ctx.textAlign = 'center'
    ctx.fillText('CHECK-OUT', rightX + rightW / 2, rY + 10)
    rY += 24

    if (data.departureTime) {
      ctx.font = 'bold 28px Georgia, "Times New Roman", serif'
      ctx.fillStyle = textDark
      ctx.textAlign = 'center'
      ctx.fillText(data.departureTime, rightX + rightW / 2, rY + 24)
      rY += 36
    }

    if (data.departureNote) {
      ctx.font = 'italic 11px "Outfit", "Helvetica Neue", sans-serif'
      ctx.fillStyle = textMute
      ctx.textAlign = 'center'
      const lines = wrapText(ctx, data.departureNote, rightX + rightW / 2, rY, rightW - 10, 15)
      rY += lines * 15 + 12
    }

    const checklist = data.departureChecklist.length > 0 ? data.departureChecklist : DEFAULT_CHECKLIST
    checklist.forEach(item => {
      drawCheckmark(ctx, rightX + 8, rY - 4, 7, accent)
      ctx.font = '12px "Outfit", "Helvetica Neue", sans-serif'
      ctx.fillStyle = textDark
      ctx.textAlign = 'left'
      ctx.fillText(item, rightX + 22, rY)
      rY += 22
    })
  }

  // Vertical divider (drawn after columns so we know height)
  const colBottom = Math.max(lY, rY)
  ctx.strokeStyle = dividerColor
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(midX, colTop + 14)
  ctx.lineTo(midX, colBottom + 10)
  ctx.stroke()

  // === EMERGENCY BAND ===
  let afterBandY = colBottom + 16
  if (data.showEmergency) {
    const bandTop = colBottom + 24
    const bandH = 96

    ctx.fillStyle = accent + '10'
    ctx.fillRect(0, bandTop, W, bandH)

    ctx.strokeStyle = dividerColor
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, bandTop)
    ctx.lineTo(W, bandTop)
    ctx.moveTo(0, bandTop + bandH)
    ctx.lineTo(W, bandTop + bandH)
    ctx.stroke()

    ctx.font = 'bold 10px "Outfit", "Helvetica Neue", sans-serif'
    ctx.fillStyle = accent
    ctx.textAlign = 'center'
    ctx.fillText('URGENCES · EMERGENCY', W / 2, bandTop + 17)

    const numbers = [
      { fr: 'Pompier', en: 'Fire', value: '18' },
      { fr: 'Samu', en: 'Ambulance', value: '15' },
      { fr: 'Police', en: 'Police', value: '17' },
    ]
    const cellW = W / 3
    numbers.forEach((n, i) => {
      const cx = cellW * (i + 0.5)
      ctx.font = 'bold 12.5px "Outfit", "Helvetica Neue", sans-serif'
      ctx.fillStyle = accent
      ctx.textAlign = 'center'
      ctx.fillText(n.fr, cx, bandTop + 40)
      ctx.font = '10px "Outfit", "Helvetica Neue", sans-serif'
      ctx.fillStyle = textMute
      ctx.fillText(n.en, cx, bandTop + 54)
      ctx.font = 'bold 26px Georgia, "Times New Roman", serif'
      ctx.fillStyle = textDark
      ctx.fillText(n.value, cx, bandTop + 84)
    })

    ctx.strokeStyle = dividerColor
    ctx.lineWidth = 1
    for (let i = 1; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(cellW * i, bandTop + 24)
      ctx.lineTo(cellW * i, bandTop + 88)
      ctx.stroke()
    }

    afterBandY = bandTop + bandH + 16
  }

  // === LIVRET ===
  if (data.showLivret) {
    ctx.strokeStyle = dividerColor
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(60, afterBandY + 6)
    ctx.lineTo(W - 60, afterBandY + 6)
    ctx.stroke()

    const livretY = afterBandY + 22

    if (qrLivretUrl) {
      try {
        const qrImg = await loadImage(qrLivretUrl)
        ctx.drawImage(qrImg, 60, livretY, 120, 120)
      } catch {}
    }

    const tx = qrLivretUrl ? 196 : 60
    const tw = W - tx - 60

    ctx.font = 'italic bold 18px Georgia, "Times New Roman", serif'
    ctx.fillStyle = accent
    ctx.textAlign = 'left'
    ctx.fillText(data.livretTitle || 'Livret d\'accueil · Guest Guide', tx, livretY + 22)

    ctx.font = '12px "Outfit", "Helvetica Neue", sans-serif'
    ctx.fillStyle = textDark
    const sub = data.livretSubtitle || 'De nombreux détails et recommandations locales vous attendent dans notre livret numérique. Many more details and local tips await in our digital guide.'
    wrapText(ctx, sub, tx, livretY + 44, tw, 16)

    ctx.font = 'bold 12px "Outfit", "Helvetica Neue", sans-serif'
    ctx.fillStyle = textDark
    ctx.fillText('Bon séjour · Enjoy your stay!', tx, livretY + 108)
  }

  // === FOOTER ===
  ctx.font = '9.5px "Outfit", "Helvetica Neue", sans-serif'
  ctx.fillStyle = '#C0C0C0'
  ctx.textAlign = 'center'
  ctx.fillText('Créé avec Jason Marinho · app.jasonmarinho.com', W / 2, H - 22)

  // Bottom accent strip
  ctx.fillStyle = accent
  ctx.fillRect(0, H - 5, W, 5)

  // Watermark
  if (watermark) {
    ctx.save()
    ctx.globalAlpha = 0.08
    ctx.font = 'bold 52px sans-serif'
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
              <p style={s.stepDesc}>Le titre de l&apos;affiche sera <strong>BIENVENUE / WELCOME</strong> — bilingue FR + EN. Tu peux personnaliser le message d&apos;accueil et nommer ton logement.</p>

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
                <label style={s.toggleLabel}>Afficher les drapeaux 🇫🇷 🇬🇧</label>
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
