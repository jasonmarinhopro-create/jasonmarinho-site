'use client'

// Bloc « Partager ma fiche » pour les dashboards pros (photographe / ménage).
// URL publique + copier + partage natif + QR code téléchargeable : le pro
// diffuse sa fiche lui-même (carte de visite, Instagram, devis…).

import { useEffect, useRef, useState } from 'react'
import { ShareNetwork, Copy, Check, DownloadSimple, QrCode } from '@phosphor-icons/react/dist/ssr'

interface Props {
  /** URL publique complète de la fiche (jasonmarinho.com/annuaires/…/slug) */
  url: string
  /** Nom affiché dans le partage natif */
  displayName: string
}

export default function ShareFicheBlock({ url, displayName }: Props) {
  const [copied, setCopied] = useState(false)
  const qrContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qrRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { default: QRCodeStyling } = await import('qr-code-styling')
      if (cancelled || !qrContainerRef.current) return
      const qr = new QRCodeStyling({
        width: 132, height: 132,
        data: url,
        backgroundOptions: { color: '#FDFCF9' },
        dotsOptions: { color: '#003329', type: 'rounded' },
        cornersSquareOptions: { color: '#003329' },
        cornersDotOptions: { color: '#003329' },
        qrOptions: { errorCorrectionLevel: 'M' },
      })
      qrRef.current = qr
      qrContainerRef.current.innerHTML = ''
      qr.append(qrContainerRef.current)
    })()
    return () => { cancelled = true }
  }, [url])

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${displayName} — annuaire LCD Jason Marinho`, url })
        return
      } catch { /* annulé par l'utilisateur */ }
    }
    copy()
  }

  async function downloadQr() {
    if (!qrRef.current) return
    await qrRef.current.download({ name: 'qr-ma-fiche', extension: 'png' })
  }

  return (
    <div style={s.card}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <h3 style={s.title}>
          <ShareNetwork size={15} weight="fill" color="var(--accent-text)" />
          Partage ta fiche
        </h3>
        <p style={s.hint}>
          Ta fiche a sa propre adresse : mets-la sur ta carte de visite, ton
          Instagram, tes devis. Chaque visite peut devenir un client — sans
          commission.
        </p>
        <div style={s.urlRow}>
          <span style={s.urlText}>{url.replace('https://', '')}</span>
          <button onClick={copy} style={s.iconBtn} title="Copier le lien">
            {copied ? <Check size={13} weight="bold" color="var(--success-1)" /> : <Copy size={13} />}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={share} style={s.primaryBtn}>
            <ShareNetwork size={13} weight="bold" /> Partager
          </button>
          <button onClick={downloadQr} style={s.ghostBtn}>
            <DownloadSimple size={13} weight="bold" /> Télécharger le QR
          </button>
        </div>
      </div>
      <div style={s.qrWrap}>
        <div ref={qrContainerRef} style={{ lineHeight: 0 }}>
          <span style={{ display: 'inline-flex', width: 132, height: 132, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <QrCode size={40} weight="thin" />
          </span>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' as const,
    background: 'var(--surface)', border: '1px solid var(--border-2)',
    borderRadius: 14, padding: '18px 20px',
  },
  title: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 15, fontWeight: 500, color: 'var(--text)', margin: '0 0 6px',
  },
  hint: { fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.55, margin: '0 0 12px', maxWidth: 460 },
  urlRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--bg)', border: '1px solid var(--border-2)', borderRadius: 9,
    padding: '8px 12px', marginBottom: 12, maxWidth: 460,
  },
  urlText: {
    flex: 1, minWidth: 0, fontSize: 12.5, color: 'var(--accent-text)', fontWeight: 500,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  iconBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 26, height: 26, borderRadius: 6, flexShrink: 0,
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-3)', cursor: 'pointer',
  },
  primaryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 15px', borderRadius: 9,
    fontSize: 12.5, fontWeight: 600,
    color: 'var(--bg)', background: 'var(--accent-text)',
    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
  },
  ghostBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 15px', borderRadius: 9,
    fontSize: 12.5, fontWeight: 500,
    color: 'var(--text-2)', background: 'transparent',
    border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit',
  },
  qrWrap: {
    flexShrink: 0, padding: 8, borderRadius: 12,
    background: '#FDFCF9', border: '1px solid var(--border-2)',
  },
}
