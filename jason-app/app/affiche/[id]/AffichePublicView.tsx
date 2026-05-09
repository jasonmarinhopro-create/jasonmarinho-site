'use client'

import { useEffect, useRef } from 'react'
import {
  Phone, Clock, Car, Trash, Thermometer, BookOpen,
  Cigarette, Moon, MusicNote, PawPrint, Footprints,
  Recycle, Lock, Drop,
} from '@phosphor-icons/react/dist/ssr'

type Lang = 'fr' | 'en' | 'fr-en'

type RuleId =
  | 'no-smoking' | 'quiet-hours' | 'no-pets' | 'pets-ok'
  | 'no-parties' | 'no-shoes' | 'recycling' | 'lock-up' | 'save-water'

interface InfoBlock {
  enabled: boolean
  text?: string
  name?: string
  phone?: string
  time?: string
  url?: string
}

interface AfficheData {
  language?: Lang
  logementNom?: string
  tagline?: string
  showFlag?: boolean
  wifiSsid?: string
  wifiPassword?: string
  blocks?: {
    host?: InfoBlock
    checkout?: InfoBlock
    parking?: InfoBlock
    waste?: InfoBlock
    climate?: InfoBlock
    guide?: InfoBlock
  }
  selectedRules?: RuleId[]
  showEmergency?: boolean
  accentColor?: string
}

interface Props {
  data: Record<string, unknown>
}

const T = {
  wifi: { fr: 'WiFi', en: 'Wi-Fi' },
  password: { fr: 'Mot de passe', en: 'Password' },
  scanToConnect: { fr: 'Scannez pour vous connecter', en: 'Scan to connect' },
  host: { fr: 'Votre hôte', en: 'Your host' },
  checkout: { fr: 'Départ', en: 'Check-out' },
  parking: { fr: 'Parking', en: 'Parking' },
  waste: { fr: 'Tri sélectif', en: 'Recycling' },
  climate: { fr: 'Chauffage · Clim', en: 'Heating · AC' },
  guide: { fr: 'Livret d\'accueil', en: 'Guest guide' },
  rules: { fr: 'Règles maison', en: 'House rules' },
  emergency: { fr: 'Urgences', en: 'Emergency' },
}

function t(field: { fr: string; en: string }, lang: Lang): string {
  if (lang === 'fr') return field.fr
  if (lang === 'en') return field.en
  return `${field.fr} · ${field.en}`
}

const RULE_LABELS: Record<RuleId, { fr: string; en: string; positive: boolean }> = {
  'no-smoking':  { fr: 'Non-fumeur',         en: 'No smoking',         positive: false },
  'quiet-hours': { fr: 'Calme la nuit',      en: 'Quiet at night',     positive: false },
  'no-parties':  { fr: 'Pas de fêtes',       en: 'No parties',         positive: false },
  'no-pets':     { fr: 'Pas d\'animaux',     en: 'No pets',            positive: false },
  'pets-ok':     { fr: 'Animaux OK',         en: 'Pets welcome',       positive: true },
  'no-shoes':    { fr: 'Sans chaussures',    en: 'No shoes inside',    positive: false },
  'recycling':   { fr: 'Tri sélectif',       en: 'Sort recycling',     positive: true },
  'lock-up':     { fr: 'Fermer à clé',       en: 'Lock when leaving',  positive: true },
  'save-water':  { fr: 'Économie d\'eau',    en: 'Save water',         positive: true },
}

const RULE_ICONS_REACT: Record<RuleId, typeof Cigarette> = {
  'no-smoking': Cigarette,
  'quiet-hours': Moon,
  'no-parties': MusicNote,
  'no-pets': PawPrint,
  'pets-ok': PawPrint,
  'no-shoes': Footprints,
  'recycling': Recycle,
  'lock-up': Lock,
  'save-water': Drop,
}

const BLOCK_ICONS: Record<string, typeof Phone> = {
  host: Phone, checkout: Clock, parking: Car,
  waste: Trash, climate: Thermometer, guide: BookOpen,
}

function buildWifiQr(ssid: string, password: string): string {
  const s = ssid.replace(/[\\;,":]/g, c => `\\${c}`)
  const p = password.replace(/[\\;,":]/g, c => `\\${c}`)
  return `WIFI:T:WPA;S:${s};P:${p};;`
}

export default function AffichePublicView({ data: rawData }: Props) {
  const d = rawData as AfficheData
  const lang: Lang = d.language ?? 'fr-en'
  const accent = d.accentColor ?? '#0B4C3F'
  const wifiQrRef = useRef<HTMLDivElement>(null)
  const guideQrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { default: QRCodeStyling } = await import('qr-code-styling')
      if (cancelled) return

      if (d.wifiSsid && wifiQrRef.current) {
        const qr = new QRCodeStyling({
          width: 240, height: 240,
          data: buildWifiQr(d.wifiSsid, d.wifiPassword ?? ''),
          backgroundOptions: { color: '#FFFFFF' },
          dotsOptions: { color: accent, type: 'rounded' },
          cornersSquareOptions: { color: accent },
          cornersDotOptions: { color: accent },
          qrOptions: { errorCorrectionLevel: 'M' },
        })
        wifiQrRef.current.innerHTML = ''
        await qr.append(wifiQrRef.current)
      }

      const guide = d.blocks?.guide
      if (guide?.enabled && guide.url && guideQrRef.current) {
        const qr = new QRCodeStyling({
          width: 160, height: 160,
          data: guide.url,
          backgroundOptions: { color: '#FFFFFF' },
          dotsOptions: { color: accent, type: 'rounded' },
          cornersSquareOptions: { color: accent },
          cornersDotOptions: { color: accent },
          qrOptions: { errorCorrectionLevel: 'M' },
        })
        guideQrRef.current.innerHTML = ''
        await qr.append(guideQrRef.current)
      }
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const blocks = d.blocks ?? {}
  const enabledBlocks = (['host', 'checkout', 'parking', 'waste', 'climate', 'guide'] as const)
    .filter(k => {
      const b = blocks[k]
      if (!b?.enabled) return false
      if (k === 'host') return Boolean(b.phone || b.name)
      if (k === 'checkout') return Boolean(b.time)
      if (k === 'guide') return Boolean(b.url)
      return Boolean(b.text)
    })

  const selectedRules = (d.selectedRules ?? []).slice(0, 6)

  const flagText = lang === 'en' ? '🇬🇧' : lang === 'fr' ? '🇫🇷' : '🇫🇷  🇬🇧'
  const mainTitle = lang === 'en' ? 'WELCOME' : 'BIENVENUE'
  const showSecondary = lang === 'fr-en'

  const taglineDefault = lang === 'fr'
    ? `Bienvenue${d.logementNom ? ` à ${d.logementNom}` : ''}. Voici ce qu'il faut savoir pour votre séjour.`
    : lang === 'en'
      ? `Welcome${d.logementNom ? ` to ${d.logementNom}` : ''}. Here is what you need for your stay.`
      : `Bienvenue${d.logementNom ? ` à ${d.logementNom}` : ''} · Welcome${d.logementNom ? ` to ${d.logementNom}` : ''}`

  const emergencyCells: Array<{ fr: string; en: string; value: string }> = [
    { fr: 'Pompier', en: 'Fire',      value: '18' },
    { fr: 'Samu',    en: 'Ambulance', value: '15' },
    { fr: 'Police',  en: 'Police',    value: '17' },
  ]
  if (blocks.host?.enabled && blocks.host.phone) {
    emergencyCells.push({ fr: 'Hôte', en: 'Host', value: blocks.host.phone })
  }

  return (
    <div style={{ minHeight: '100svh', background: '#F5F5F0', padding: 'clamp(16px,3vw,40px) 12px', fontFamily: '"Outfit", "Helvetica Neue", sans-serif' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto', background: '#FFFFFF', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
        {/* Top accent line */}
        <div style={{ height: '3px', background: accent }} />

        <div style={{ padding: 'clamp(28px,4vw,52px) clamp(20px,4vw,52px) 0' }}>
          {/* === HEADER === */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            {d.showFlag !== false && (
              <div style={{ fontSize: '20px', marginBottom: '4px', letterSpacing: '4px' }}>{flagText}</div>
            )}
            <div style={{ width: '120px', height: '1px', background: `${accent}28`, margin: '8px auto 0' }} />
            <h1 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 'clamp(38px,7vw,58px)', fontWeight: 700, color: accent, margin: '14px 0 0', letterSpacing: '0.5px', lineHeight: 1.05 }}>
              {mainTitle}
            </h1>
            {showSecondary && (
              <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', fontSize: 'clamp(16px,2.4vw,22px)', color: '#9CA3AF', marginTop: '4px' }}>
                Welcome
              </div>
            )}
            <p style={{ fontSize: 'clamp(13px,1.7vw,14px)', color: '#4A4A4A', margin: '16px auto 0', maxWidth: '540px', lineHeight: 1.6 }}>
              {d.tagline || taglineDefault}
            </p>
            <div style={{ width: '100%', height: '1px', background: `${accent}1A`, margin: '24px auto 0' }} />
          </div>

          {/* === WIFI HERO === */}
          {d.wifiSsid && (
            <div style={{ background: `${accent}08`, borderRadius: '14px', padding: 'clamp(18px,3vw,28px)', display: 'grid', gridTemplateColumns: 'minmax(0, 168px) minmax(0, 1fr)', gap: 'clamp(20px,3vw,36px)', alignItems: 'center', marginBottom: '28px' }} className="affiche-wifi">
              <div style={{ background: '#FFFFFF', borderRadius: '8px', padding: '4px', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div ref={wifiQrRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <WifiIconSvg color={accent} />
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: accent }}>
                    {t(T.wifi, lang).toUpperCase()}
                  </div>
                </div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, color: '#1A1A1A', wordBreak: 'break-word' as const }}>
                  {d.wifiSsid}
                </div>
                {d.wifiPassword && (
                  <>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px', color: '#7A7A7A', marginTop: '12px', marginBottom: '4px' }}>
                      {t(T.password, lang).toUpperCase()}
                    </div>
                    <div style={{ display: 'inline-block', background: `${accent}14`, borderRadius: '6px', padding: '8px 14px', fontFamily: 'monospace', fontSize: 'clamp(14px,2vw,16px)', fontWeight: 700, color: '#1A1A1A', wordBreak: 'break-all' as const, maxWidth: '100%' }}>
                      {d.wifiPassword}
                    </div>
                  </>
                )}
                <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#9CA3AF', marginTop: '12px' }}>
                  {t(T.scanToConnect, lang)}
                </div>
              </div>
            </div>
          )}

          {/* === INFO GRID === */}
          {enabledBlocks.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '28px' }}>
              {enabledBlocks.map(key => {
                const block = blocks[key]!
                const Icon = BLOCK_ICONS[key]
                const labelMap = { host: T.host, checkout: T.checkout, parking: T.parking, waste: T.waste, climate: T.climate, guide: T.guide }
                return (
                  <div key={key} style={{ background: '#FAFAF8', border: `1px solid ${accent}20`, borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${accent}10`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} weight="regular" />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: accent }}>
                          {labelMap[key].fr.toUpperCase()}
                        </div>
                        {lang === 'fr-en' && (
                          <div style={{ fontSize: '9px', letterSpacing: '0.8px', color: '#9CA3AF', marginTop: '1px' }}>
                            {labelMap[key].en.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <BlockContent type={key} block={block} accent={accent} guideQrRef={key === 'guide' ? guideQrRef : null} />
                  </div>
                )
              })}
            </div>
          )}

          {/* === RULES === */}
          {selectedRules.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: accent }}>
                  {t(T.rules, lang).toUpperCase()}
                </div>
                <div style={{ width: '40px', height: '1px', background: `${accent}40`, margin: '6px auto 0' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(selectedRules.length, 6)}, 1fr)`, gap: '8px' }} className="affiche-rules">
                {selectedRules.map(id => {
                  const def = RULE_LABELS[id]
                  if (!def) return null
                  const Icon = RULE_ICONS_REACT[id]
                  return (
                    <div key={id} style={{ textAlign: 'center', padding: '4px' }}>
                      <div style={{
                        width: '46px', height: '46px',
                        borderRadius: '50%',
                        background: def.positive ? `${accent}14` : `${accent}08`,
                        border: `1.4px solid ${accent}`,
                        color: accent,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto', position: 'relative' as const,
                      }}>
                        <Icon size={22} weight="regular" />
                        {!def.positive && (
                          <span style={{
                            position: 'absolute' as const,
                            top: '50%', left: '50%',
                            width: '60%', height: '2px',
                            background: accent,
                            transform: 'translate(-50%, -50%) rotate(-45deg)',
                            borderRadius: '2px',
                          }} />
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#1A1A1A', marginTop: '8px', fontWeight: 600, lineHeight: 1.2 }}>
                        {def.fr}
                      </div>
                      {lang === 'fr-en' && (
                        <div style={{ fontSize: '9.5px', color: '#9CA3AF', marginTop: '2px', lineHeight: 1.2 }}>
                          {def.en}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* === EMERGENCY BAND === */}
        {d.showEmergency && (
          <div style={{ background: `${accent}0E`, borderTop: `1px solid ${accent}20`, borderBottom: `1px solid ${accent}20`, padding: '18px 16px' }}>
            <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', color: accent, marginBottom: '12px' }}>
              {t(T.emergency, lang).toUpperCase()}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${emergencyCells.length}, 1fr)`, gap: '4px', maxWidth: '640px', margin: '0 auto' }}>
              {emergencyCells.map((cell, i) => (
                <a
                  key={cell.value}
                  href={`tel:${cell.value.replace(/\s/g, '')}`}
                  style={{
                    textDecoration: 'none',
                    textAlign: 'center' as const,
                    padding: '4px',
                    borderRight: i < emergencyCells.length - 1 ? `1px solid ${accent}26` : 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: accent }}>
                    {cell.fr}
                  </div>
                  {lang === 'fr-en' && (
                    <div style={{ fontSize: '9px', color: '#9CA3AF', marginTop: '1px' }}>
                      {cell.en}
                    </div>
                  )}
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: emergencyCells.length > 3 ? '15px' : '20px', fontWeight: 700, color: '#1A1A1A', marginTop: '6px' }}>
                    {cell.value}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '20px clamp(20px,4vw,52px)', textAlign: 'center', background: '#FFFFFF' }}>
          <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>
            Créé avec <a href="https://app.jasonmarinho.com/dashboard/outils-impression" style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>Jason Marinho</a>
          </p>
        </div>

        {/* Bottom accent line */}
        <div style={{ height: '3px', background: accent }} />
      </div>

      <style>{`
        @media (max-width: 560px) {
          .affiche-wifi { grid-template-columns: 1fr !important; text-align: center; }
          .affiche-wifi > div:first-child { max-width: 200px; margin: 0 auto; }
          .affiche-rules { grid-template-columns: repeat(3, 1fr) !important; gap: 12px !important; }
        }
      `}</style>
    </div>
  )
}

function BlockContent({
  type,
  block,
  accent,
  guideQrRef,
}: {
  type: string
  block: InfoBlock
  accent: string
  guideQrRef: React.RefObject<HTMLDivElement> | null
}) {
  if (type === 'host') {
    return (
      <div>
        {block.name && (
          <div style={{ fontSize: '13px', color: '#4A4A4A', marginBottom: '4px' }}>{block.name}</div>
        )}
        {block.phone && (
          <a href={`tel:${block.phone.replace(/\s/g, '')}`} style={{ fontFamily: 'Georgia, serif', fontSize: '17px', fontWeight: 700, color: '#1A1A1A', textDecoration: 'none', wordBreak: 'break-word' as const }}>
            {block.phone}
          </a>
        )}
      </div>
    )
  }
  if (type === 'checkout') {
    return (
      <div>
        {block.time && (
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 700, color: '#1A1A1A', lineHeight: 1.1 }}>{block.time}</div>
        )}
        {block.text && (
          <div style={{ fontSize: '12px', color: '#7A7A7A', marginTop: '6px', lineHeight: 1.5 }}>{block.text}</div>
        )}
      </div>
    )
  }
  if (type === 'guide') {
    return (
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0, background: '#FFFFFF', borderRadius: '6px', padding: '2px' }}>
          <div ref={guideQrRef} style={{ width: '70px', height: '70px' }} />
        </div>
        {block.text && (
          <div style={{ fontSize: '11.5px', color: '#1A1A1A', lineHeight: 1.5, flex: 1 }}>
            {block.text}
          </div>
        )}
        {!block.text && block.url && (
          <div style={{ fontSize: '11px', color: '#7A7A7A', lineHeight: 1.5, flex: 1, fontStyle: 'italic' as const }}>
            Scannez pour ouvrir le livret
          </div>
        )}
      </div>
    )
  }
  return (
    <div style={{ fontSize: '12.5px', color: '#1A1A1A', lineHeight: 1.55 }}>
      {block.text}
    </div>
  )
}

function WifiIconSvg({ color }: { color: string }) {
  return (
    <svg width="20" height="16" viewBox="0 0 20 16" fill="none" aria-hidden="true">
      <circle cx="10" cy="13" r="1.4" fill={color} />
      <path d="M5 9 Q10 5 15 9" stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M2 5 Q10 -1 18 5" stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  )
}
