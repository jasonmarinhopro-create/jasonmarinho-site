'use client'

import { useRef, useState, useEffect } from 'react'

interface Props {
  token: string
  contractId: string
  locataireName: string
}

export default function SignaturePage({ token, locataireName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Ratio pour les écrans Retina
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    ctx.strokeStyle = '#34D399'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0]
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    setIsDrawing(true)
    lastPos.current = getPos(e, canvas)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e, canvas)
    if (lastPos.current) {
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }
    lastPos.current = pos
    setHasSignature(true)
  }

  function stopDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    setIsDrawing(false)
    lastPos.current = null
  }

  function clearSignature() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  async function handleSubmit() {
    if (!hasSignature) { setError('Veuillez signer dans le cadre ci-dessus.'); return }
    if (!agreed) { setError('Veuillez cocher la case de consentement.'); return }

    const canvas = canvasRef.current
    if (!canvas) return
    const signatureImage = canvas.toDataURL('image/png')

    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, signature_image: signatureImage }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Une erreur est survenue.')
      } else {
        setSuccess(true)
        // Recharger la page après 2s pour afficher le contrat signé avec la signature
        setTimeout(() => window.location.reload(), 2000)
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div style={successBox}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h2 style={successTitle}>Contrat signé avec succès !</h2>
        <p style={successText}>
          Votre signature a été enregistrée et le contrat est maintenant valide.<br />
          Un email de confirmation a été envoyé à toutes les parties.
        </p>
        <p style={successMeta}>
          Vous pouvez fermer cette page ou l&apos;imprimer en PDF via votre navigateur.
        </p>
        <button
          onClick={() => window.print()}
          style={printBtnStyle}
        >
          Imprimer / Enregistrer en PDF
        </button>
      </div>
    )
  }

  return (
    <div style={signBlock}>
      <h3 style={signTitle}>Apposez votre signature</h3>
      <p style={signSubtitle}>
        Dessinez votre signature dans le cadre ci-dessous en utilisant votre souris ou votre doigt.
      </p>

      {/* Canvas de signature */}
      <div style={canvasWrapper}>
        <canvas
          ref={canvasRef}
          style={canvasStyle}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {!hasSignature && (
          <div style={canvasPlaceholder}>
            <span style={{ fontSize: '28px', marginBottom: '8px', display: 'block' }}>✍️</span>
            Signez ici
          </div>
        )}
        <button onClick={clearSignature} style={clearBtn} type="button">
          Effacer
        </button>
      </div>

      {/* Consentement eIDAS */}
      <label style={consentLabel}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          style={consentCheckbox}
        />
        <span style={consentText}>
          Je, soussigné(e) <strong style={{ color: '#f0ebe1' }}>{locataireName}</strong>, reconnais avoir lu
          l&apos;intégralité du contrat de location ci-dessus et accepte ses termes. Je consens à sa signature
          électronique, valide au sens du règlement eIDAS (UE) 910/2014 et de l&apos;article 1366 du Code civil français.
          Cette signature a la même valeur juridique qu&apos;une signature manuscrite.
        </span>
      </label>

      {error && <p style={errorStyle}>{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !hasSignature || !agreed}
        style={{
          ...submitBtn,
          opacity: isSubmitting || !hasSignature || !agreed ? 0.5 : 1,
          cursor: isSubmitting || !hasSignature || !agreed ? 'not-allowed' : 'pointer',
        }}
      >
        {isSubmitting ? 'Signature en cours…' : 'Signer le contrat définitivement'}
      </button>

      <p style={legalNote}>
        En signant, vous confirmez votre identité par votre adresse email.
        Votre adresse IP, l&apos;horodatage et les caractéristiques de votre navigateur sont enregistrés
        à des fins probatoires (audit trail eIDAS). Ces données sont conservées 5 ans.
      </p>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const signBlock: React.CSSProperties = {
  background: '#0f2018',
  border: '1px solid #1e3d2f',
  borderRadius: '20px',
  padding: '28px',
  marginBottom: '24px',
}

const signTitle: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: '20px',
  fontWeight: 400,
  color: '#f0ebe1',
  margin: '0 0 8px',
}

const signSubtitle: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b9a7e',
  margin: '0 0 20px',
  lineHeight: 1.6,
}

const canvasWrapper: React.CSSProperties = {
  position: 'relative',
  marginBottom: '20px',
}

const canvasStyle: React.CSSProperties = {
  width: '100%',
  height: '140px',
  background: 'rgba(52,211,153,0.04)',
  border: '2px dashed rgba(52,211,153,0.25)',
  borderRadius: '14px',
  cursor: 'crosshair',
  display: 'block',
  touchAction: 'none',
}

const canvasPlaceholder: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  color: 'rgba(52,211,153,0.35)',
  fontSize: '14px',
  pointerEvents: 'none',
  userSelect: 'none' as const,
}

const clearBtn: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  background: 'rgba(239,68,68,0.1)',
  border: '1px solid rgba(239,68,68,0.2)',
  borderRadius: '8px',
  padding: '4px 10px',
  fontSize: '12px',
  color: '#ef4444',
  cursor: 'pointer',
}

const consentLabel: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start',
  cursor: 'pointer',
  marginBottom: '20px',
}

const consentCheckbox: React.CSSProperties = {
  marginTop: '2px',
  flexShrink: 0,
  width: '16px',
  height: '16px',
  cursor: 'pointer',
  accentColor: '#34D399',
}

const consentText: React.CSSProperties = {
  fontSize: '13px',
  color: '#a5c4b0',
  lineHeight: 1.7,
}

const errorStyle: React.CSSProperties = {
  color: '#ef4444',
  fontSize: '13px',
  margin: '0 0 16px',
}

const submitBtn: React.CSSProperties = {
  width: '100%',
  padding: '16px',
  background: '#34D399',
  border: 'none',
  borderRadius: '14px',
  fontSize: '15px',
  fontWeight: 700,
  color: '#0a1a14',
  marginBottom: '16px',
  transition: 'all 0.15s',
}

const legalNote: React.CSSProperties = {
  fontSize: '11px',
  color: '#4a7260',
  lineHeight: 1.6,
  margin: 0,
}

const successBox: React.CSSProperties = {
  background: 'rgba(52,211,153,0.08)',
  border: '1px solid rgba(52,211,153,0.25)',
  borderRadius: '20px',
  padding: '40px 32px',
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const successTitle: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: '24px',
  fontWeight: 400,
  color: '#34D399',
  margin: '0 0 12px',
}

const successText: React.CSSProperties = {
  fontSize: '15px',
  color: '#a5c4b0',
  lineHeight: 1.7,
  margin: '0 0 12px',
}

const successMeta: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b9a7e',
  margin: '0 0 24px',
}

const printBtnStyle: React.CSSProperties = {
  background: '#1e3d2f',
  border: '1px solid #2d5a3f',
  borderRadius: '12px',
  padding: '12px 24px',
  fontSize: '14px',
  color: '#a5c4b0',
  cursor: 'pointer',
}
