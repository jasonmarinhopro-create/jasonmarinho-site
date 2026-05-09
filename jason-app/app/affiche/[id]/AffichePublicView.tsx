'use client'

import { useState, useEffect, useRef } from 'react'
import { WifiHigh, Phone, EnvelopeSimple, MapPin } from '@phosphor-icons/react/dist/ssr'

interface AfficheData {
  logementNom?: string
  adresse?: string
  wifiSsid?: string
  wifiPassword?: string
  phone?: string
  email?: string
  accentColor?: string
  showWifi?: boolean
  showPhone?: boolean
  showEmail?: boolean
  showAddress?: boolean
  tagline?: string
}

interface Props {
  data: Record<string, unknown>
}

function buildWifiQr(ssid: string, password: string): string {
  const s = ssid.replace(/[\\;,":]/g, c => `\\${c}`)
  const p = password.replace(/[\\;,":]/g, c => `\\${c}`)
  return `WIFI:T:WPA;S:${s};P:${p};;`
}

export default function AffichePublicView({ data: rawData }: Props) {
  const d = rawData as AfficheData
  const accent = d.accentColor ?? '#0B4C3F'
  const qrContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!d.showWifi || !d.wifiSsid || !qrContainerRef.current) return
    ;(async () => {
      const { default: QRCodeStyling } = await import('qr-code-styling')
      const qr = new QRCodeStyling({
        width: 160, height: 160,
        data: buildWifiQr(d.wifiSsid!, d.wifiPassword ?? ''),
        backgroundOptions: { color: '#FFFFFF' },
        dotsOptions: { color: accent, type: 'rounded' },
        cornersSquareOptions: { color: accent },
        cornersDotOptions: { color: accent },
        qrOptions: { errorCorrectionLevel: 'M' },
      })
      if (qrContainerRef.current) {
        qrContainerRef.current.innerHTML = ''
        await qr.append(qrContainerRef.current)
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ minHeight: '100svh', background: '#F5F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {/* A4 poster card */}
      <div style={{ width: '100%', maxWidth: '420px', background: '#FAFAF8', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
        {/* Top band */}
        <div style={{ background: accent, padding: '32px 28px 28px', position: 'relative' as const }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px', letterSpacing: '-0.2px' }}>
            {d.logementNom ?? 'Mon Logement'}
          </h1>
          {d.tagline && (
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.82)', margin: 0 }}>{d.tagline}</p>
          )}
          {d.showAddress && d.adresse && (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.72)', margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={12} />
              {d.adresse}
            </p>
          )}
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
          {/* WiFi */}
          {d.showWifi && d.wifiSsid && (
            <div style={{ background: '#F0F9F5', border: `1px solid ${accent}22`, borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
                  <WifiHigh size={16} weight="fill" color={accent} />
                  <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' as const, color: accent }}>WiFi</span>
                </div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#0B1D0F', marginBottom: d.wifiPassword ? '4px' : 0 }}>{d.wifiSsid}</div>
                {d.wifiPassword && (
                  <div style={{ fontSize: '12px', color: '#6B7280', fontFamily: 'monospace' }}>{d.wifiPassword}</div>
                )}
              </div>
              <div ref={qrContainerRef} style={{ flexShrink: 0, width: '80px', height: '80px', background: '#FFF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} />
            </div>
          )}

          {/* Contact */}
          {(d.showPhone && d.phone) || (d.showEmail && d.email) ? (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' as const, color: accent }}>Contact</div>
              {d.showPhone && d.phone && (
                <a href={`tel:${d.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: 500, color: '#0B1D0F', textDecoration: 'none', padding: '12px 16px', background: '#F9FAFB', borderRadius: '10px', border: '1px solid #E8EDE9' }}>
                  <Phone size={17} weight="fill" color={accent} />
                  {d.phone}
                </a>
              )}
              {d.showEmail && d.email && (
                <a href={`mailto:${d.email}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 500, color: '#0B1D0F', textDecoration: 'none', padding: '12px 16px', background: '#F9FAFB', borderRadius: '10px', border: '1px solid #E8EDE9' }}>
                  <EnvelopeSimple size={17} weight="fill" color={accent} />
                  {d.email}
                </a>
              )}
            </div>
          ) : null}

          {/* Footer */}
          <div style={{ paddingTop: '8px', borderTop: '1px solid #E5EDE8', textAlign: 'center' as const }}>
            <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>
              Créé avec <a href="https://app.jasonmarinho.com/dashboard/outils-impression" style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>Jason Marinho LCD</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
