'use client'

import { useEffect, useRef } from 'react'

interface AfficheData {
  logementNom?: string
  tagline?: string
  showFlag?: boolean
  wifiSsid?: string
  wifiPassword?: string
  showWifi?: boolean
  showRules?: boolean
  houseRules?: string[]
  showDeparture?: boolean
  departureTime?: string
  departureChecklist?: string[]
  departureNote?: string
  showEmergency?: boolean
  showLivret?: boolean
  livretUrl?: string
  livretTitle?: string
  livretSubtitle?: string
  accentColor?: string
}

interface Props {
  data: Record<string, unknown>
}

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

export default function AffichePublicView({ data: rawData }: Props) {
  const d = rawData as AfficheData
  const accent = d.accentColor ?? '#D9612E'
  const wifiQrRef = useRef<HTMLDivElement>(null)
  const livretQrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ;(async () => {
      const { default: QRCodeStyling } = await import('qr-code-styling')

      if (d.showWifi && d.wifiSsid && wifiQrRef.current) {
        const qr = new QRCodeStyling({
          width: 220, height: 220,
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

      if (d.showLivret && d.livretUrl && livretQrRef.current) {
        const qr = new QRCodeStyling({
          width: 140, height: 140,
          data: d.livretUrl,
          backgroundOptions: { color: '#FFFFFF' },
          dotsOptions: { color: accent, type: 'rounded' },
          cornersSquareOptions: { color: accent },
          cornersDotOptions: { color: accent },
          qrOptions: { errorCorrectionLevel: 'M' },
        })
        livretQrRef.current.innerHTML = ''
        await qr.append(livretQrRef.current)
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rules = d.houseRules && d.houseRules.length > 0 ? d.houseRules : DEFAULT_RULES
  const checklist = d.departureChecklist && d.departureChecklist.length > 0 ? d.departureChecklist : DEFAULT_CHECKLIST

  return (
    <div style={{ minHeight: '100svh', background: '#F5F5F0', padding: 'clamp(16px,3vw,40px) 16px', fontFamily: '"Outfit", "Helvetica Neue", sans-serif' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', background: '#FFFFFF', borderRadius: '20px', padding: 'clamp(28px,4vw,56px) clamp(20px,4vw,56px)', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          {d.showFlag !== false && <div style={{ fontSize: '24px', marginBottom: '4px' }}>🇫🇷</div>}
          <h1 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 'clamp(40px,8vw,68px)', fontWeight: 700, color: accent, margin: 0, letterSpacing: '0.5px', lineHeight: 1.1 }}>
            BIENVENUE
          </h1>
          <p style={{ fontSize: 'clamp(13px,1.6vw,15px)', color: '#3A3A3A', margin: '14px auto 0', maxWidth: '520px', lineHeight: 1.6 }}>
            {d.tagline || `Bonjour et bienvenue à ${d.logementNom ?? 'notre logement'}. Voici quelques informations essentielles pour profiter pleinement de votre séjour.`}
          </p>
        </div>

        {/* Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 1px minmax(0,1fr)', gap: 'clamp(16px,3vw,32px)', alignItems: 'start' }} className="affiche-cols">
          {/* LEFT: WiFi + SOS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>
            {d.showWifi && d.wifiSsid && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <WifiIcon color={accent} />
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 700, color: accent, margin: 0, letterSpacing: '1.5px' }}>WIFI</h2>
                <div ref={wifiQrRef} style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px' }} />
                <div style={{ marginTop: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A' }}>{d.wifiSsid}</div>
                  {d.wifiPassword && <div style={{ fontSize: '12px', color: '#7A7A7A', fontFamily: 'monospace', marginTop: '2px' }}>{d.wifiPassword}</div>}
                </div>
              </div>
            )}

            {d.showEmergency && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
                <SOSIcon color={accent} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', width: '100%' }}>
                  {[
                    { label: 'Pompier', value: '18' },
                    { label: 'Samu', value: '15' },
                    { label: 'Police', value: '17' },
                  ].map(n => (
                    <div key={n.value} style={{ textAlign: 'center' }}>
                      <a href={`tel:${n.value}`} style={{ textDecoration: 'none', display: 'block' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: accent }}>{n.label}</div>
                        <div style={{ fontSize: '14px', color: '#1A1A1A', fontWeight: 500, marginTop: '2px' }}>{n.value}</div>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Vertical separator */}
          <div style={{ width: '1px', background: `${accent}33`, alignSelf: 'stretch', minHeight: '300px' }} className="affiche-vsep" />

          {/* RIGHT: Rules + Departure */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {d.showRules && (
              <div>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 700, color: accent, margin: 0, letterSpacing: '0.5px', textAlign: 'center' }}>LES RÈGLES</h2>
                <ol style={{ listStyle: 'none', padding: 0, margin: '20px 0 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {rules.map((r, i) => (
                    <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', lineHeight: 1.5, color: '#1A1A1A' }}>
                      <span style={{ fontWeight: 700, color: accent, fontFamily: 'monospace', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}.</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {d.showDeparture && (
              <div style={{ textAlign: 'center' as const }}>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 700, color: accent, margin: 0, letterSpacing: '0.5px' }}>DÉPART</h2>
                {d.departureTime && (
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', marginTop: '8px' }}>{d.departureTime}</div>
                )}
                {d.departureNote && (
                  <p style={{ fontSize: '12px', fontStyle: 'italic', color: '#1A1A1A', margin: '10px auto 0', maxWidth: '300px', lineHeight: 1.5 }}>{d.departureNote}</p>
                )}
                <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 0', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' as const }}>
                  {checklist.map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#1A1A1A', lineHeight: 1.5 }}>
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: accent, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0, fontWeight: 700 }}>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Livret */}
        {d.showLivret && d.livretUrl && (
          <>
            <div style={{ height: '1px', background: `${accent}33`, margin: '40px 0 32px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '140px minmax(0, 1fr)', gap: '24px', alignItems: 'center' }} className="affiche-livret">
              <div ref={livretQrRef} style={{ width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
              <div>
                <h3 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(18px,2.5vw,22px)', fontWeight: 700, color: accent, margin: 0 }}>
                  {d.livretTitle || 'Scannez ici notre livret d\'accueil'}
                </h3>
                <p style={{ fontSize: '13px', color: '#1A1A1A', margin: '10px 0 0', lineHeight: 1.65 }}>
                  {d.livretSubtitle || 'De nombreux détails supplémentaires sont inclus dans le livret, ainsi que des recommandations de bonnes adresses locales sélectionnées par nos soins.'}
                </p>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', margin: '12px 0 0' }}>Bon séjour !</p>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #EEE' }}>
          <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>
            Créé avec <a href="https://app.jasonmarinho.com/dashboard/outils-impression" style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>Jason Marinho</a>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .affiche-cols {
            grid-template-columns: 1fr !important;
          }
          .affiche-vsep { display: none; }
          .affiche-livret { grid-template-columns: 1fr !important; justify-items: center; text-align: center; }
        }
      `}</style>
    </div>
  )
}

function WifiIcon({ color }: { color: string }) {
  return (
    <svg width="44" height="34" viewBox="0 0 44 34" fill="none">
      <path d="M22 24 L22 24" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <circle cx="22" cy="26" r="2.5" fill={color} />
      <path d="M14 18 Q22 12 30 18" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M8 12 Q22 0 36 12" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function SOSIcon({ color }: { color: string }) {
  return (
    <svg width="44" height="40" viewBox="0 0 44 40" fill="none">
      <ellipse cx="22" cy="14" rx="14" ry="9" fill={color} />
      <text x="22" y="18" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="700" fontFamily="sans-serif">SOS</text>
      <path d="M8 22 Q11 33 22 35 Q33 33 36 22" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}
