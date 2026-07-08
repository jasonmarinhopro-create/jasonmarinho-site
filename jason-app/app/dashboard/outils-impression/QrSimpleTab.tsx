'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  WifiHigh, Link, EnvelopeSimple, Phone, ChatTeardropText, Star,
  MapPin, DownloadSimple, ArrowsClockwise, CaretDown,
} from '@phosphor-icons/react/dist/ssr'
import { useTheme } from '@/components/ThemeProvider'

interface Logement {
  id: string
  nom: string
  adresse?: string
  wifi_nom?: string
  wifi_mdp?: string
}

interface Props {
  plan: string
  logements: Logement[]
}

const QR_TYPES = [
  { id: 'wifi',        label: 'WiFi',           icon: WifiHigh,        desc: 'Connexion automatique au WiFi' },
  { id: 'url',         label: 'Lien / URL',      icon: Link,            desc: 'Site web, annonce Airbnb, lien Booking…' },
  { id: 'gmap',        label: 'Google Maps',     icon: MapPin,          desc: 'Itinéraire vers ton logement' },
  { id: 'greview',     label: 'Avis Google',     icon: Star,            desc: 'Invite tes voyageurs à laisser un avis' },
  { id: 'email',       label: 'E-mail',          icon: EnvelopeSimple,  desc: 'Ouvre la messagerie avec ton adresse pré-remplie' },
  { id: 'phone',       label: 'Téléphone',       icon: Phone,           desc: 'Appel direct en un scan' },
  { id: 'sms',         label: 'SMS',             icon: ChatTeardropText, desc: 'Message pré-rédigé vers ton numéro' },
] as const

type QrTypeId = (typeof QR_TYPES)[number]['id']

const DOT_STYLES = [
  { id: 'square',      label: 'Carré' },
  { id: 'dots',        label: 'Ronds' },
  { id: 'rounded',     label: 'Arrondi' },
  { id: 'classy',      label: 'Classy' },
  { id: 'classy-rounded', label: 'Classy rond' },
  { id: 'extra-rounded', label: 'Extra rond' },
] as const

type DotStyleId = (typeof DOT_STYLES)[number]['id']

function buildQrData(type: QrTypeId, fields: Record<string, string>): string {
  switch (type) {
    case 'wifi': {
      const sec = fields.wifiSecurity ?? 'WPA'
      const ssid = (fields.wifiSsid ?? '').replace(/[\\;,":]/g, c => `\\${c}`)
      const pwd = (fields.wifiPassword ?? '').replace(/[\\;,":]/g, c => `\\${c}`)
      return `WIFI:T:${sec};S:${ssid};P:${pwd};;`
    }
    case 'url':
    case 'gmap':
    case 'greview':
      return fields.url ?? ''
    case 'email':
      return `mailto:${fields.email ?? ''}${fields.subject ? `?subject=${encodeURIComponent(fields.subject)}` : ''}`
    case 'phone':
      return `tel:${fields.phone ?? ''}`
    case 'sms':
      return `sms:${fields.phone ?? ''}${fields.body ? `?body=${encodeURIComponent(fields.body)}` : ''}`
    default:
      return ''
  }
}

function isLightColor(hex: string): boolean {
  const h = hex.replace('#', '')
  if (h.length < 6) return false
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  // Perceived luminance
  return (r * 0.299 + g * 0.587 + b * 0.114) > 180
}

// Damier "transparence" pour l'aperçu. `dark` = damier sombre (quand le QR
// est clair, pour le garder visible) ; sinon damier clair.
function checkerboardStyle(dark: boolean): React.CSSProperties {
  const [a, b] = dark ? ['#3a3a3a', '#2b2b2b'] : ['#e2e2e2', '#f4f4f4']
  return {
    backgroundColor: b,
    backgroundImage:
      `linear-gradient(45deg, ${a} 25%, transparent 25%),` +
      `linear-gradient(-45deg, ${a} 25%, transparent 25%),` +
      `linear-gradient(45deg, transparent 75%, ${a} 75%),` +
      `linear-gradient(-45deg, transparent 75%, ${a} 75%)`,
    backgroundSize: '18px 18px',
    backgroundPosition: '0 0, 0 9px, 9px -9px, -9px 0',
  }
}

export default function QrSimpleTab({ plan, logements }: Props) {
  const { theme } = useTheme()
  // Couleur par défaut selon le thème : blanc en sombre, noir en clair.
  // L'init se fait via lazy state, donc on respecte le thème dès le premier render.
  const [qrType, setQrType] = useState<QrTypeId>('wifi')
  const [fields, setFields] = useState<Record<string, string>>({ wifiSecurity: 'WPA' })
  const [dotStyle, setDotStyle] = useState<DotStyleId>('rounded')
  const initialFg = theme === 'light' ? '#000000' : '#FFFFFF'
  const [fgColor, setFgColorRaw] = useState(initialFg)
  const [hexDraft, setHexDraft] = useState(initialFg.replace('#', ''))
  const [transparentBg, setTransparentBg] = useState(true)
  const [bgColor, setBgColor] = useState('#FFFFFF')

  // Dès que l'utilisateur choisit une couleur (swatch OU hex), on ne touche
  // plus JAMAIS à sa couleur automatiquement. Sans ce garde, l'effet ci-dessous
  // (qui se déclenche notamment quand le ThemeProvider résout/bascule le thème
  // juste après le montage) remettait la couleur par défaut (blanc en sombre)
  // par-dessus la couleur saisie → « impossible de personnaliser ».
  const userPickedColor = useRef(false)

  // Si le user toggle le thème pendant la session ET qu'il n'a pas customisé
  // sa couleur (toujours sur la couleur défaut de l'autre thème), on bascule.
  useEffect(() => {
    if (userPickedColor.current) return
    setFgColorRaw(prev => {
      if (theme === 'light' && prev === '#FFFFFF') return '#000000'
      if (theme === 'dark' && prev === '#000000') return '#FFFFFF'
      return prev
    })
    setHexDraft(prev => {
      if (theme === 'light' && prev === 'FFFFFF') return '000000'
      if (theme === 'dark' && prev === '000000') return 'FFFFFF'
      return prev
    })
  }, [theme])

  // Swatches : ordre dépend du thème (noir en premier en clair, blanc en premier en sombre).
  const swatchColors = theme === 'light'
    ? ['#000000', '#FFFFFF', '#1e3a5f', '#7c3aed', '#b91c1c', '#d97706', '#059669']
    : ['#FFFFFF', '#000000', '#1e3a5f', '#7c3aed', '#b91c1c', '#d97706', '#059669']

  function setFgColor(c: string) {
    userPickedColor.current = true
    setFgColorRaw(c)
    setHexDraft(c.replace('#', '').toUpperCase())
  }
  const [logoUrl, setLogoUrl] = useState('')
  const [selectedLogement, setSelectedLogement] = useState<string>('')
  const [qrInstance, setQrInstance] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<any>(null)

  // Prefill from selected logement
  useEffect(() => {
    if (!selectedLogement) return
    const l = logements.find(x => x.id === selectedLogement)
    if (!l) return
    setFields(prev => ({
      ...prev,
      wifiSsid: l.wifi_nom ?? prev.wifiSsid ?? '',
      wifiPassword: l.wifi_mdp ?? prev.wifiPassword ?? '',
    }))
  }, [selectedLogement, logements])

  const qrData = buildQrData(qrType, fields)
  const hasData = qrData.length > 5

  const generateQr = useCallback(async () => {
    if (!hasData || !containerRef.current) return
    setIsGenerating(true)
    try {
      const { default: QRCodeStyling } = await import('qr-code-styling')
      const size = 280
      const qr = new QRCodeStyling({
        width: size,
        height: size,
        data: qrData,
        image: logoUrl || undefined,
        backgroundOptions: { color: transparentBg ? 'transparent' : bgColor },
        dotsOptions: { color: fgColor, type: dotStyle },
        cornersSquareOptions: { color: fgColor },
        cornersDotOptions: { color: fgColor },
        imageOptions: { crossOrigin: 'anonymous', margin: 4, imageSize: 0.28 },
        qrOptions: { errorCorrectionLevel: 'M' },
      })
      qrRef.current = qr
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
        await qr.append(containerRef.current)
      }
      setQrInstance(qr)
    } finally {
      setIsGenerating(false)
    }
  }, [qrData, fgColor, dotStyle, logoUrl, transparentBg, bgColor, hasData])

  useEffect(() => {
    if (hasData) {
      const timer = setTimeout(generateQr, 300)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrData, fgColor, dotStyle, logoUrl, transparentBg, bgColor])

  async function downloadPng() {
    if (!qrRef.current) return
    await qrRef.current.download({ name: 'qr-code', extension: 'png' })
  }

  async function downloadSvg() {
    if (!qrRef.current) return
    await qrRef.current.download({ name: 'qr-code', extension: 'svg' })
  }

  function setField(key: string, value: string) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  const selectedType = QR_TYPES.find(t => t.id === qrType)!

  return (
    <div style={s.layout} className="qrsimple-layout">
      {/* Responsive CSS — passage en 1 colonne sur tablette/mobile */}
      <style>{`
        @media (max-width: 980px) {
          .qrsimple-layout { grid-template-columns: 1fr !important; }
          .qrsimple-preview-col { position: static !important; top: auto !important; }
          .qrsimple-field-row { grid-template-columns: 1fr !important; }
          .qrsimple-dl-buttons { flex-direction: column !important; }
        }
        @media (max-width: 480px) {
          .qrsimple-preview-wrap { width: 100% !important; max-width: 280px !important; }
        }
      `}</style>
      {/* Left: form */}
      <div style={s.formCol}>
        {/* Type selector */}
        <div style={s.section}>
          <div style={s.sectionLabel}>Type de QR code</div>
          <div style={s.typeGrid}>
            {QR_TYPES.map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => setQrType(t.id)}
                  style={{ ...s.typeBtn, ...(qrType === t.id ? s.typeBtnActive : {}) }}
                >
                  <Icon size={17} weight={qrType === t.id ? 'fill' : 'regular'} />
                  {t.label}
                </button>
              )
            })}
          </div>
          <p style={s.typeDesc}>{selectedType.desc}</p>
        </div>

        {/* Fields */}
        <div style={s.section}>
          <div style={s.sectionLabel}>Contenu</div>
          {qrType === 'wifi' && (
            <>
              {logements.length > 0 && (
                <div style={s.fieldWrap}>
                  <label style={s.fieldLabel}>Logement (préremplit SSID + mot de passe)</label>
                  <div style={s.selectWrap}>
                    <select
                      value={selectedLogement}
                      onChange={e => setSelectedLogement(e.target.value)}
                      style={s.select}
                    >
                      <option value="">— Sélectionner un logement —</option>
                      {logements.map(l => (
                        <option key={l.id} value={l.id}>{l.nom}</option>
                      ))}
                    </select>
                    <CaretDown size={13} style={s.selectIcon} />
                  </div>
                </div>
              )}
              <div style={s.fieldRow} className="qrsimple-field-row">
                <div style={s.fieldWrap}>
                  <label style={s.fieldLabel}>Nom du réseau (SSID)</label>
                  <input
                    style={s.input}
                    placeholder="MonWiFi"
                    value={fields.wifiSsid ?? ''}
                    onChange={e => setField('wifiSsid', e.target.value)}
                  />
                </div>
                <div style={s.fieldWrap}>
                  <label style={s.fieldLabel}>Sécurité</label>
                  <div style={s.selectWrap}>
                    <select
                      value={fields.wifiSecurity ?? 'WPA'}
                      onChange={e => setField('wifiSecurity', e.target.value)}
                      style={s.select}
                    >
                      <option value="WPA">WPA/WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">Ouvert</option>
                    </select>
                    <CaretDown size={13} style={s.selectIcon} />
                  </div>
                </div>
              </div>
              {fields.wifiSecurity !== 'nopass' && (
                <div style={s.fieldWrap}>
                  <label style={s.fieldLabel}>Mot de passe</label>
                  <input
                    style={s.input}
                    type="text"
                    placeholder="MotDePasseWifi"
                    value={fields.wifiPassword ?? ''}
                    onChange={e => setField('wifiPassword', e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {(qrType === 'url' || qrType === 'gmap' || qrType === 'greview') && (
            <div style={s.fieldWrap}>
              <label style={s.fieldLabel}>
                {qrType === 'url' ? 'URL (https://...)' : qrType === 'gmap' ? 'Lien Google Maps de ton logement' : 'Lien Google Avis de ta fiche GMB'}
              </label>
              <input
                style={s.input}
                type="url"
                placeholder="https://..."
                value={fields.url ?? ''}
                onChange={e => setField('url', e.target.value)}
              />
            </div>
          )}

          {qrType === 'email' && (
            <>
              <div style={s.fieldWrap}>
                <label style={s.fieldLabel}>Adresse e-mail</label>
                <input
                  style={s.input}
                  type="email"
                  placeholder="contact@exemple.com"
                  value={fields.email ?? ''}
                  onChange={e => setField('email', e.target.value)}
                />
              </div>
              <div style={s.fieldWrap}>
                <label style={s.fieldLabel}>Objet (optionnel)</label>
                <input
                  style={s.input}
                  placeholder="Question sur mon séjour"
                  value={fields.subject ?? ''}
                  onChange={e => setField('subject', e.target.value)}
                />
              </div>
            </>
          )}

          {(qrType === 'phone' || qrType === 'sms') && (
            <div style={s.fieldWrap}>
              <label style={s.fieldLabel}>Numéro de téléphone</label>
              <input
                style={s.input}
                type="tel"
                placeholder="+33 6 12 34 56 78"
                value={fields.phone ?? ''}
                onChange={e => setField('phone', e.target.value)}
              />
            </div>
          )}
          {qrType === 'sms' && (
            <div style={s.fieldWrap}>
              <label style={s.fieldLabel}>Message pré-rempli (optionnel)</label>
              <textarea
                style={{ ...s.input, height: '72px', resize: 'vertical' as const }}
                placeholder="Bonjour, j'ai une question…"
                value={fields.body ?? ''}
                onChange={e => setField('body', e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Style */}
        <div style={s.section}>
          <div style={s.sectionLabel}>Apparence</div>
          <div style={s.styleRow}>
            <div style={s.fieldWrap}>
              <label style={s.fieldLabel}>Style des points</label>
              <div style={s.dotStyleGrid}>
                {DOT_STYLES.map(ds => (
                  <button
                    key={ds.id}
                    onClick={() => setDotStyle(ds.id)}
                    style={{ ...s.dotStyleBtn, ...(dotStyle === ds.id ? s.dotStyleBtnActive : {}) }}
                  >
                    {ds.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={s.fieldWrap}>
              <label style={s.fieldLabel}>Couleur</label>
              <div style={s.colorRow}>
                {swatchColors.map(c => (
                  <button
                    key={c}
                    onClick={() => setFgColor(c)}
                    style={{
                      ...s.colorSwatch,
                      background: c,
                      boxShadow: c === '#FFFFFF' ? 'inset 0 0 0 1px var(--border-2)' : 'none',
                      outline: fgColor === c ? `2px solid ${c === '#FFFFFF' ? 'var(--accent-text)' : c}` : 'none',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>
              <div style={s.hexWrap}>
                <span style={s.hexHash}>#</span>
                <input
                  type="text"
                  value={hexDraft}
                  onChange={e => {
                    userPickedColor.current = true
                    const raw = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase()
                    setHexDraft(raw)
                    if (raw.length === 6) setFgColorRaw('#' + raw)
                    else if (raw.length === 3) setFgColorRaw('#' + raw.split('').map(c => c + c).join(''))
                  }}
                  onBlur={() => setHexDraft(fgColor.replace('#', '').toUpperCase())}
                  placeholder="0B1D0F"
                  spellCheck={false}
                  maxLength={6}
                  style={s.hexInput}
                />
                <div style={{ ...s.hexPreview, background: fgColor }} />
              </div>
            </div>
            <div style={s.fieldWrap}>
              <label style={s.fieldLabel}>Fond</label>
              <div style={s.bgToggleRow}>
                <button
                  onClick={() => setTransparentBg(true)}
                  style={{ ...s.bgToggleBtn, ...(transparentBg ? s.bgToggleBtnActive : {}) }}
                >
                  Transparent
                </button>
                <button
                  onClick={() => setTransparentBg(false)}
                  style={{ ...s.bgToggleBtn, ...(!transparentBg ? s.bgToggleBtnActive : {}) }}
                >
                  Couleur unie
                </button>
              </div>
              {!transparentBg && (
                <div style={s.colorRow}>
                  {['#FFFFFF', '#1A1A1A', '#F5F0E8', '#FFD56B', '#93C5FD', '#F472B6'].map(c => (
                    <button
                      key={c}
                      onClick={() => setBgColor(c)}
                      style={{
                        ...s.colorSwatch,
                        background: c,
                        boxShadow: c === '#FFFFFF' ? 'inset 0 0 0 1px var(--border-2)' : 'none',
                        outline: bgColor === c ? `2px solid ${c === '#FFFFFF' ? 'var(--accent-text)' : c}` : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right: preview + download */}
      <div style={s.previewCol} className="qrsimple-preview-col">
        <div style={s.previewCard}>
          <div style={s.previewLabel}>Aperçu</div>
          <div className="qrsimple-preview-wrap" style={{
            ...s.previewWrap,
            // Fond transparent = damier (signal universel "transparence"),
            // adapté pour que le QR reste visible quelle que soit sa couleur :
            // damier sombre si le QR est clair, damier clair sinon.
            // Fond opaque = couleur unie choisie.
            ...(transparentBg
              ? checkerboardStyle(isLightColor(fgColor))
              : { background: bgColor }),
            borderRadius: '12px',
          }}>
            {!hasData ? (
              <div style={s.previewEmpty}>
                Remplis les champs pour voir ton QR code
              </div>
            ) : isGenerating ? (
              <div style={s.previewEmpty}>
                <ArrowsClockwise size={22} style={{ animation: 'spin 1s linear infinite' }} />
                Génération…
              </div>
            ) : null}
            <div
              ref={containerRef}
              style={{
                ...s.qrContainer,
                opacity: hasData && !isGenerating ? 1 : 0,
              }}
            />
          </div>
          {transparentBg && (
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, textAlign: 'center' as const }}>
              Le damier indique la transparence · le QR exporté a un fond transparent
            </p>
          )}

          {hasData && !isGenerating && (
            <>
              <p style={s.previewNote}>
                {transparentBg
                  ? 'Fond transparent — intègre ce QR code dans tes propres designs Canva, Word, Figma…'
                  : 'Fond couleur unie — prêt à imprimer ou utiliser tel quel.'}
              </p>
              <div style={s.dlButtons} className="qrsimple-dl-buttons">
                <button onClick={downloadPng} style={s.dlBtn}>
                  <DownloadSimple size={15} weight="bold" />
                  Télécharger PNG
                </button>
                <button onClick={downloadSvg} style={{ ...s.dlBtn, ...s.dlBtnSecondary }}>
                  <DownloadSimple size={15} weight="bold" />
                  Télécharger SVG
                </button>
              </div>
              <p style={s.transparentNote}>
                {transparentBg
                  ? <>Le QR code PNG a un fond transparent. Pour une impression directe, utilise SVG ou génère une affiche dans l&apos;onglet <strong>Affiche A4</strong>.</>
                  : <>Le fond est inclus dans le PNG. Pour un fond transparent, repasse sur l&apos;option <strong>Transparent</strong>.</>}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  layout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
    gap: 'clamp(20px, 3vw, 40px)',
    alignItems: 'start',
    width: '100%',
  },
  formCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  previewCol: {
    position: 'sticky' as const,
    top: 'calc(var(--header-h) + 16px)',
  },
  section: {
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.7px',
    textTransform: 'uppercase' as const,
    color: 'var(--text-muted)',
  },
  typeGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  typeBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 400,
    color: 'var(--text-2)',
    background: 'var(--bg)',
    border: '1px solid var(--border-2)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'var(--font-outfit), sans-serif',
  },
  typeBtnActive: {
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)',
    fontWeight: 600,
  },
  typeDesc: {
    fontSize: '12.5px',
    color: 'var(--text-muted)',
    margin: 0,
  },
  fieldRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 140px',
    gap: '12px',
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
  selectIcon: {
    position: 'absolute' as const,
    right: '13px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-3)',
    pointerEvents: 'none' as const,
  },
  styleRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  dotStyleGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
  },
  dotStyleBtn: {
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: 400,
    color: 'var(--text-2)',
    background: 'var(--bg)',
    border: '1px solid var(--border-2)',
    cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
  },
  dotStyleBtnActive: {
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)',
    fontWeight: 600,
  },
  colorRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  bgToggleRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  bgToggleBtn: {
    padding: '7px 14px',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: 400,
    color: 'var(--text-2)',
    background: 'var(--bg)',
    border: '1px solid var(--border-2)',
    cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
  },
  bgToggleBtnActive: {
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)',
    fontWeight: 600,
  },
  colorSwatch: {
    width: '26px',
    height: '26px',
    borderRadius: '7px',
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
  },
  hexWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    marginTop: '8px',
    background: 'var(--bg)',
    border: '1px solid var(--border-2)',
    borderRadius: '8px',
    padding: '0 10px',
    width: 'fit-content',
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
    width: '18px',
    height: '18px',
    borderRadius: '5px',
    border: '1px solid var(--border-2)',
    flexShrink: 0,
  },
  previewCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.7px',
    textTransform: 'uppercase' as const,
    color: 'var(--text-muted)',
    alignSelf: 'flex-start' as const,
  },
  previewWrap: {
    position: 'relative' as const,
    width: '280px',
    height: '280px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewEmpty: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: 'var(--text-muted)',
    textAlign: 'center' as const,
    padding: '20px',
    position: 'absolute' as const,
    inset: 0,
    justifyContent: 'center',
  },
  qrContainer: {
    transition: 'opacity 0.3s',
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewNote: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    margin: 0,
    textAlign: 'center' as const,
    lineHeight: 1.5,
  },
  dlButtons: {
    display: 'flex',
    gap: '10px',
    width: '100%',
  },
  dlBtn: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--accent-text)',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
    transition: 'opacity 0.15s',
  },
  dlBtnSecondary: {
    background: 'var(--bg)',
    border: '1px solid var(--border-2)',
    color: 'var(--text-2)',
  },
  transparentNote: {
    fontSize: '11.5px',
    color: 'var(--text-muted)',
    margin: 0,
    textAlign: 'center' as const,
    lineHeight: 1.6,
  },
}
