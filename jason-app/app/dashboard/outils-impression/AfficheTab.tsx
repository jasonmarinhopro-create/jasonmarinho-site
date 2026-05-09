'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  WifiHigh, HouseSimple, Phone, Envelope, MapPin,
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
  logementNom: string
  adresse?: string
  wifiSsid?: string
  wifiPassword?: string
  phone?: string
  email?: string
  accentColor: string
  showWifi: boolean
  showPhone: boolean
  showEmail: boolean
  showAddress: boolean
  tagline?: string
}

interface Props {
  plan: string
  logements: Logement[]
}

const STEPS = [
  { id: 'logement',     label: 'Ton logement',   icon: HouseSimple },
  { id: 'wifi',         label: 'WiFi',            icon: WifiHigh },
  { id: 'contact',      label: 'Contact',         icon: Phone },
  { id: 'style',        label: 'Personnalisation', icon: CheckCircle },
] as const

type StepId = (typeof STEPS)[number]['id']

const ACCENT_COLORS = [
  { id: '#0B4C3F', label: 'Forêt' },
  { id: '#1e3a5f', label: 'Marine' },
  { id: '#7c3aed', label: 'Violet' },
  { id: '#b91c1c', label: 'Rouge' },
  { id: '#d97706', label: 'Ambre' },
  { id: '#0f766e', label: 'Teal' },
]

function buildWifiQr(ssid: string, password: string): string {
  const s = ssid.replace(/[\\;,":]/g, c => `\\${c}`)
  const p = password.replace(/[\\;,":]/g, c => `\\${c}`)
  return `WIFI:T:WPA;S:${s};P:${p};;`
}

// Draw the poster on a canvas and return a data URL
async function renderPosterCanvas(
  data: AfficheData,
  qrDataUrl: string,
  watermark: boolean,
): Promise<HTMLCanvasElement> {
  const W = 794  // A4 @96dpi ~ 210mm
  const H = 1123 // A4 @96dpi ~ 297mm

  const canvas = document.createElement('canvas')
  canvas.width = W * 2   // 2× for retina
  canvas.height = H * 2
  const ctx = canvas.getContext('2d')!
  ctx.scale(2, 2)

  const accent = data.accentColor
  const bg = '#FAFAF8'
  const textDark = '#0B1D0F'

  // Background
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Top color band
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, W, 180)

  // Decorative dots top-right
  ctx.save()
  ctx.globalAlpha = 0.18
  ctx.fillStyle = '#FFFFFF'
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    ctx.arc(W - 30 - i * 40, 30 + i * 20, 18 + i * 6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  // Property name
  ctx.font = 'bold 32px serif'
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'left'
  ctx.fillText(data.logementNom || 'Mon Logement', 48, 72)

  // Tagline
  if (data.tagline) {
    ctx.font = '16px sans-serif'
    ctx.globalAlpha = 0.85
    ctx.fillText(data.tagline, 48, 104)
    ctx.globalAlpha = 1
  }

  // Address below top band
  if (data.showAddress && data.adresse) {
    ctx.font = '13px sans-serif'
    ctx.fillStyle = accent
    ctx.fillText('📍 ' + data.adresse, 48, 210)
  }

  let y = 260

  // WiFi section
  if (data.showWifi && data.wifiSsid) {
    // Section card
    ctx.fillStyle = '#FFFFFF'
    roundRect(ctx, 40, y - 14, W - 80, 140, 14)
    ctx.fill()
    ctx.strokeStyle = '#E5EDE8'
    ctx.lineWidth = 1
    roundRect(ctx, 40, y - 14, W - 80, 140, 14)
    ctx.stroke()

    ctx.font = 'bold 13px sans-serif'
    ctx.fillStyle = accent
    ctx.fillText('CONNEXION WIFI', 68, y + 12)

    ctx.font = 'bold 22px sans-serif'
    ctx.fillStyle = textDark
    ctx.fillText(data.wifiSsid, 68, y + 46)

    if (data.wifiPassword) {
      ctx.font = '14px monospace'
      ctx.fillStyle = '#6B7280'
      ctx.fillText('Mot de passe : ' + data.wifiPassword, 68, y + 74)
    }

    // QR code
    if (qrDataUrl) {
      const qrImg = await loadImage(qrDataUrl)
      ctx.drawImage(qrImg, W - 148, y - 10, 110, 110)
    }

    y += 166
  }

  // Info rows
  const infoItems: { icon: string; label: string; value: string }[] = []
  if (data.showPhone && data.phone) infoItems.push({ icon: '📞', label: 'Téléphone', value: data.phone })
  if (data.showEmail && data.email) infoItems.push({ icon: '✉️', label: 'E-mail', value: data.email })

  if (infoItems.length > 0) {
    ctx.fillStyle = '#FFFFFF'
    roundRect(ctx, 40, y - 14, W - 80, 54 + infoItems.length * 48, 14)
    ctx.fill()
    ctx.strokeStyle = '#E5EDE8'
    ctx.lineWidth = 1
    roundRect(ctx, 40, y - 14, W - 80, 54 + infoItems.length * 48, 14)
    ctx.stroke()

    ctx.font = 'bold 13px sans-serif'
    ctx.fillStyle = accent
    ctx.fillText('VOS CONTACTS', 68, y + 12)
    y += 44

    for (const item of infoItems) {
      ctx.font = '15px sans-serif'
      ctx.fillStyle = textDark
      ctx.fillText(`${item.icon}  ${item.value}`, 68, y + 14)
      y += 48
    }
    y += 20
  }

  // Bottom accent strip
  ctx.fillStyle = accent
  ctx.fillRect(0, H - 52, W, 52)
  ctx.font = '11px sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.textAlign = 'center'
  ctx.fillText('Scannez le QR code ou contactez-nous pour toute question', W / 2, H - 22)

  // Watermark for non-standard plan
  if (watermark) {
    ctx.save()
    ctx.globalAlpha = 0.12
    ctx.font = 'bold 52px sans-serif'
    ctx.fillStyle = '#000000'
    ctx.textAlign = 'center'
    ctx.translate(W / 2, H / 2)
    ctx.rotate(-Math.PI / 5)
    for (let i = -2; i <= 2; i++) {
      ctx.fillText('APERÇU — STANDARD', 0, i * 120)
    }
    ctx.restore()
  }

  return canvas
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function generateQrDataUrl(data: AfficheData): Promise<string> {
  if (!data.showWifi || !data.wifiSsid) return ''
  const { default: QRCodeStyling } = await import('qr-code-styling')
  const qr = new QRCodeStyling({
    width: 220, height: 220,
    data: buildWifiQr(data.wifiSsid, data.wifiPassword ?? ''),
    backgroundOptions: { color: '#FFFFFF' },
    dotsOptions: { color: data.accentColor, type: 'rounded' },
    cornersSquareOptions: { color: data.accentColor },
    cornersDotOptions: { color: data.accentColor },
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
    accentColor: '#0B4C3F',
    showWifi: true,
    showPhone: true,
    showEmail: true,
    showAddress: true,
  })
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

  // Prefill from logement
  useEffect(() => {
    if (!selectedLogementId) return
    const l = logements.find(x => x.id === selectedLogementId)
    if (!l) return
    setData(prev => ({
      ...prev,
      logementNom: l.nom,
      adresse: l.adresse ?? prev.adresse,
      wifiSsid: l.wifi_nom ?? prev.wifiSsid,
      wifiPassword: l.wifi_mdp ?? prev.wifiPassword,
    }))
    // Load existing saved affiche
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
      const qrDataUrl = await generateQrDataUrl(data)
      const canvas = await renderPosterCanvas(data, qrDataUrl, !isStandard)
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
    const qrDataUrl = await generateQrDataUrl(data)
    const canvas = await renderPosterCanvas(data, qrDataUrl, !isStandard)
    const link = document.createElement('a')
    link.download = `affiche-${data.logementNom || 'logement'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  async function downloadPdf() {
    const { jsPDF } = await import('jspdf')
    const qrDataUrl = await generateQrDataUrl(data)
    const canvas = await renderPosterCanvas(data, qrDataUrl, !isStandard)
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

  return (
    <div style={s.layout}>
      {/* Left: wizard */}
      <div style={s.wizardCol}>
        {/* Step progress */}
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
              <h3 style={s.stepTitle}>Ton logement</h3>
              <p style={s.stepDesc}>Commence par nommer ton logement. Si tu en as déjà saisi dans la section Logements, sélectionne-le pour préremplir.</p>

              {logements.length > 0 && (
                <div style={s.fieldWrap}>
                  <label style={s.fieldLabel}>Logement existant</label>
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
                <label style={s.fieldLabel}>Adresse (optionnel)</label>
                <input
                  style={s.input}
                  placeholder="12 rue des Lilas, 75011 Paris"
                  value={data.adresse ?? ''}
                  onChange={e => setField('adresse', e.target.value)}
                />
              </div>

              <div style={s.toggleRow}>
                <label style={s.toggleLabel}>Afficher l&apos;adresse sur l&apos;affiche</label>
                <ToggleSwitch value={data.showAddress} onChange={v => setField('showAddress', v)} />
              </div>

              <div style={s.fieldWrap}>
                <label style={s.fieldLabel}>Accroche (optionnel)</label>
                <input
                  style={s.input}
                  placeholder="Bienvenue dans notre logement !"
                  value={data.tagline ?? ''}
                  onChange={e => setField('tagline', e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 'wifi' && (
            <div style={s.stepInner}>
              <h3 style={s.stepTitle}>Connexion WiFi</h3>
              <p style={s.stepDesc}>Tes voyageurs pourront scanner le QR code pour se connecter automatiquement.</p>

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

          {step === 'contact' && (
            <div style={s.stepInner}>
              <h3 style={s.stepTitle}>Coordonnées de contact</h3>
              <p style={s.stepDesc}>Pour que tes voyageurs puissent te joindre facilement.</p>

              <div style={s.toggleRow}>
                <label style={s.toggleLabel}>Afficher un numéro de téléphone</label>
                <ToggleSwitch value={data.showPhone} onChange={v => setField('showPhone', v)} />
              </div>
              {data.showPhone && (
                <div style={s.fieldWrap}>
                  <label style={s.fieldLabel}>Téléphone</label>
                  <input
                    style={s.input}
                    type="tel"
                    placeholder="+33 6 12 34 56 78"
                    value={data.phone ?? ''}
                    onChange={e => setField('phone', e.target.value)}
                  />
                </div>
              )}

              <div style={s.toggleRow}>
                <label style={s.toggleLabel}>Afficher un e-mail de contact</label>
                <ToggleSwitch value={data.showEmail} onChange={v => setField('showEmail', v)} />
              </div>
              {data.showEmail && (
                <div style={s.fieldWrap}>
                  <label style={s.fieldLabel}>E-mail</label>
                  <input
                    style={s.input}
                    type="email"
                    placeholder="contact@logement.fr"
                    value={data.email ?? ''}
                    onChange={e => setField('email', e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {step === 'style' && (
            <div style={s.stepInner}>
              <h3 style={s.stepTitle}>Personnalisation</h3>
              <p style={s.stepDesc}>Choisis la couleur principale de ton affiche.</p>

              <div style={s.fieldWrap}>
                <label style={s.fieldLabel}>Couleur principale</label>
                <div style={s.colorGrid}>
                  {ACCENT_COLORS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setField('accentColor', c.id)}
                      style={{
                        ...s.colorCard,
                        border: data.accentColor === c.id ? `2px solid ${c.id}` : '2px solid transparent',
                      }}
                    >
                      <div style={{ ...s.colorDot, background: c.id }} />
                      <span style={s.colorLabel}>{c.label}</span>
                    </button>
                  ))}
                  <div style={s.colorCard}>
                    <input
                      type="color"
                      value={data.accentColor}
                      onChange={e => setField('accentColor', e.target.value)}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'none', padding: 0 }}
                    />
                    <span style={s.colorLabel}>Autre</span>
                  </div>
                </div>
              </div>

              {/* Download actions */}
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

        {/* Navigation */}
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

      {/* Right: live preview */}
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
              <img
                src={previewUrl}
                alt="Aperçu affiche"
                style={s.previewImg}
              />
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
    gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
    gap: '28px',
    alignItems: 'start',
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
  stepNumActive: {
    color: 'var(--accent-text)',
  },
  stepNumDone: {
    color: 'var(--text-2)',
  },
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
  fieldLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-3)',
    letterSpacing: '0.1px',
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
