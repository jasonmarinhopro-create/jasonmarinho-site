'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NATIONALITES } from '@/lib/nationalites'

interface Props {
  token: string
  contractId: string
  locataireName: string
}

// ── i18n du bloc de signature ──────────────────────────────────────────
// Seule l'INTERFACE de signature est traduite : le corps du contrat reste
// dans sa langue officielle (c'est lui qui fait foi juridiquement) — une
// note le rappelle dans la langue du voyageur.
type SLang = 'fr' | 'en' | 'es' | 'pt' | 'de'

const SIGN_T: Record<SLang, Record<string, string>> = {
  fr: {
    signTitle: 'Apposez votre signature',
    signSubtitle: 'Dessinez votre signature dans le cadre ci-dessous en utilisant votre souris ou votre doigt.',
    officialNote: 'Le contrat ci-dessus fait foi dans sa langue officielle.',
    signHere: 'Signez ici',
    clear: 'Effacer',
    natLabel: 'Votre nationalité',
    natSelect: 'Sélectionner…',
    natHint: 'Utilisée par votre hôte pour la déclaration réglementaire de votre séjour (obligation légale dans la plupart des pays européens).',
    consentPrefix: 'Je, soussigné(e)',
    consentBody: ", reconnais avoir lu l'intégralité du contrat de location ci-dessus et accepte ses termes. Je consens à sa signature électronique, valide au sens du règlement eIDAS (UE) 910/2014. Cette signature a la même valeur juridique qu'une signature manuscrite.",
    submitting: 'Signature en cours…',
    submit: 'Signer le contrat définitivement',
    legalNote: "En signant, vous confirmez votre identité par votre adresse email. Votre adresse IP, l'horodatage et les caractéristiques de votre navigateur sont enregistrés à des fins probatoires (audit trail eIDAS). Ces données sont conservées 5 ans.",
    errSign: 'Veuillez signer dans le cadre ci-dessus.',
    errConsent: 'Veuillez cocher la case de consentement.',
    errCanvas: "Erreur d'initialisation. Veuillez rafraîchir la page.",
    errNetwork: 'Erreur réseau. Veuillez réessayer.',
    alreadyTitle: 'Ce contrat est déjà signé',
    alreadyText: 'La page va se mettre à jour pour afficher le contrat signé…',
    successTitle: 'Contrat signé avec succès !',
    successText: 'Votre signature a été enregistrée et le contrat est maintenant valide. Un email de confirmation a été envoyé à toutes les parties.',
    successMeta: 'La page va se mettre à jour automatiquement pour vous permettre de finaliser votre dossier (paiement de la réservation et/ou du dépôt de garantie si requis).',
    printBtn: 'Imprimer / Enregistrer en PDF',
  },
  en: {
    signTitle: 'Add your signature',
    signSubtitle: 'Draw your signature in the frame below using your mouse or finger.',
    officialNote: 'The contract above is legally binding in its official language.',
    signHere: 'Sign here',
    clear: 'Clear',
    natLabel: 'Your nationality',
    natSelect: 'Select…',
    natHint: 'Used by your host for the mandatory guest declaration of your stay (a legal requirement in most European countries).',
    consentPrefix: 'I, the undersigned',
    consentBody: ', acknowledge that I have read the entire rental contract above and accept its terms. I consent to its electronic signature, valid under the eIDAS Regulation (EU) 910/2014. This signature has the same legal value as a handwritten one.',
    submitting: 'Signing…',
    submit: 'Sign the contract definitively',
    legalNote: 'By signing, you confirm your identity through your email address. Your IP address, timestamp and browser characteristics are recorded for evidentiary purposes (eIDAS audit trail). This data is kept for 5 years.',
    errSign: 'Please sign in the frame above.',
    errConsent: 'Please tick the consent box.',
    errCanvas: 'Initialisation error. Please refresh the page.',
    errNetwork: 'Network error. Please try again.',
    alreadyTitle: 'This contract is already signed',
    alreadyText: 'The page will refresh to show the signed contract…',
    successTitle: 'Contract signed successfully!',
    successText: 'Your signature has been recorded and the contract is now valid. A confirmation email has been sent to all parties.',
    successMeta: 'The page will refresh automatically so you can finalise your file (payment of the booking and/or security deposit if required).',
    printBtn: 'Print / Save as PDF',
  },
  es: {
    signTitle: 'Añada su firma',
    signSubtitle: 'Dibuje su firma en el recuadro con el ratón o el dedo.',
    officialNote: 'El contrato anterior es vinculante en su idioma oficial.',
    signHere: 'Firme aquí',
    clear: 'Borrar',
    natLabel: 'Su nacionalidad',
    natSelect: 'Seleccionar…',
    natHint: 'Su anfitrión la utiliza para la declaración obligatoria de viajeros de su estancia (obligación legal en la mayoría de los países europeos).',
    consentPrefix: 'Yo, el/la abajo firmante',
    consentBody: ', reconozco haber leído íntegramente el contrato de alquiler anterior y acepto sus términos. Consiento su firma electrónica, válida según el Reglamento eIDAS (UE) 910/2014. Esta firma tiene el mismo valor jurídico que una firma manuscrita.',
    submitting: 'Firmando…',
    submit: 'Firmar el contrato definitivamente',
    legalNote: 'Al firmar, confirma su identidad mediante su correo electrónico. Su dirección IP, la fecha/hora y las características de su navegador se registran con fines probatorios (auditoría eIDAS). Estos datos se conservan 5 años.',
    errSign: 'Firme en el recuadro de arriba, por favor.',
    errConsent: 'Marque la casilla de consentimiento, por favor.',
    errCanvas: 'Error de inicialización. Actualice la página.',
    errNetwork: 'Error de red. Inténtelo de nuevo.',
    alreadyTitle: 'Este contrato ya está firmado',
    alreadyText: 'La página se actualizará para mostrar el contrato firmado…',
    successTitle: '¡Contrato firmado con éxito!',
    successText: 'Su firma se ha registrado y el contrato ya es válido. Se ha enviado un correo de confirmación a todas las partes.',
    successMeta: 'La página se actualizará automáticamente para que pueda finalizar su expediente (pago de la reserva y/o de la fianza si procede).',
    printBtn: 'Imprimir / Guardar en PDF',
  },
  pt: {
    signTitle: 'Aponha a sua assinatura',
    signSubtitle: 'Desenhe a sua assinatura no quadro abaixo com o rato ou o dedo.',
    officialNote: 'O contrato acima faz fé na sua língua oficial.',
    signHere: 'Assine aqui',
    clear: 'Apagar',
    natLabel: 'A sua nacionalidade',
    natSelect: 'Selecionar…',
    natHint: 'Utilizada pelo seu anfitrião para a declaração obrigatória de alojamento da sua estadia (obrigação legal na maioria dos países europeus).',
    consentPrefix: 'Eu, abaixo assinado(a)',
    consentBody: ', reconheço ter lido integralmente o contrato de arrendamento acima e aceito os seus termos. Consinto na sua assinatura eletrónica, válida nos termos do Regulamento eIDAS (UE) 910/2014. Esta assinatura tem o mesmo valor jurídico que uma assinatura manuscrita.',
    submitting: 'A assinar…',
    submit: 'Assinar o contrato definitivamente',
    legalNote: 'Ao assinar, confirma a sua identidade através do seu e-mail. O seu endereço IP, a data/hora e as características do seu navegador são registados para fins probatórios (auditoria eIDAS). Estes dados são conservados durante 5 anos.',
    errSign: 'Assine no quadro acima, por favor.',
    errConsent: 'Assinale a caixa de consentimento, por favor.',
    errCanvas: 'Erro de inicialização. Atualize a página.',
    errNetwork: 'Erro de rede. Tente novamente.',
    alreadyTitle: 'Este contrato já está assinado',
    alreadyText: 'A página será atualizada para mostrar o contrato assinado…',
    successTitle: 'Contrato assinado com sucesso!',
    successText: 'A sua assinatura foi registada e o contrato é agora válido. Foi enviado um e-mail de confirmação a todas as partes.',
    successMeta: 'A página será atualizada automaticamente para poder finalizar o seu processo (pagamento da reserva e/ou da caução, se aplicável).',
    printBtn: 'Imprimir / Guardar em PDF',
  },
  de: {
    signTitle: 'Setzen Sie Ihre Unterschrift',
    signSubtitle: 'Zeichnen Sie Ihre Unterschrift im Feld unten mit Maus oder Finger.',
    officialNote: 'Der obige Vertrag ist in seiner Amtssprache rechtsverbindlich.',
    signHere: 'Hier unterschreiben',
    clear: 'Löschen',
    natLabel: 'Ihre Staatsangehörigkeit',
    natSelect: 'Auswählen…',
    natHint: 'Wird von Ihrem Gastgeber für die gesetzliche Gästemeldung Ihres Aufenthalts verwendet (Pflicht in den meisten europäischen Ländern).',
    consentPrefix: 'Ich, der/die Unterzeichnende',
    consentBody: ', bestätige, den gesamten obigen Mietvertrag gelesen zu haben, und akzeptiere seine Bedingungen. Ich stimme der elektronischen Signatur zu, gültig gemäß der eIDAS-Verordnung (EU) 910/2014. Diese Unterschrift hat denselben rechtlichen Wert wie eine handschriftliche.',
    submitting: 'Wird signiert…',
    submit: 'Vertrag endgültig unterschreiben',
    legalNote: 'Mit Ihrer Unterschrift bestätigen Sie Ihre Identität über Ihre E-Mail-Adresse. Ihre IP-Adresse, der Zeitstempel und Ihre Browser-Merkmale werden zu Beweiszwecken gespeichert (eIDAS-Audit-Trail). Diese Daten werden 5 Jahre aufbewahrt.',
    errSign: 'Bitte unterschreiben Sie im Feld oben.',
    errConsent: 'Bitte kreuzen Sie das Einverständnis-Kästchen an.',
    errCanvas: 'Initialisierungsfehler. Bitte laden Sie die Seite neu.',
    errNetwork: 'Netzwerkfehler. Bitte versuchen Sie es erneut.',
    alreadyTitle: 'Dieser Vertrag ist bereits unterschrieben',
    alreadyText: 'Die Seite wird aktualisiert, um den unterschriebenen Vertrag anzuzeigen…',
    successTitle: 'Vertrag erfolgreich unterschrieben!',
    successText: 'Ihre Unterschrift wurde gespeichert und der Vertrag ist nun gültig. Eine Bestätigungs-E-Mail wurde an alle Parteien gesendet.',
    successMeta: 'Die Seite wird automatisch aktualisiert, damit Sie Ihre Unterlagen abschließen können (Zahlung der Buchung und/oder Kaution, falls erforderlich).',
    printBtn: 'Drucken / Als PDF speichern',
  },
}

export default function SignaturePage({ token, locataireName }: Props) {
  const router = useRouter()
  // Langue de l'interface de signature (auto-détectée, modifiable)
  const [slang, setSlang] = useState<SLang>('fr')
  useEffect(() => {
    if (typeof navigator === 'undefined') return
    const nav = (navigator.language ?? '').toLowerCase().slice(0, 2)
    if (['fr', 'en', 'es', 'pt', 'de'].includes(nav)) setSlang(nav as SLang)
    else setSlang('en')
  }, [])
  const t = SIGN_T[slang]
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [agreed, setAgreed] = useState(false)
  // Nationalité (ISO-2) déclarée par le locataire : alimente la fiche
  // voyageur de l'hôte + la détection de déclaration réglementaire
  // (SIBA au Portugal, fiche de police en France…). Optionnelle.
  const [nationalite, setNationalite] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [alreadySigned, setAlreadySigned] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // Cleanup fallback timer on unmount (router.refresh unmounts this component)
  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current)
    }
  }, [])

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
    ctx.strokeStyle = 'var(--success-1)'
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
    if (!hasSignature) { setError(t.errSign); return }
    if (!agreed) { setError(t.errConsent); return }

    const canvas = canvasRef.current
    if (!canvas) return

    // Vérifier que le canvas a des dimensions valides
    if (canvas.width === 0 || canvas.height === 0) {
      setError(t.errCanvas)
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Ajouter un fond blanc derrière la signature pour qu'elle soit visible sur tous les fonds
    ctx.save()
    ctx.globalCompositeOperation = 'destination-over'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.restore()

    const signatureImage = canvas.toDataURL('image/png')

    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signature_image: signatureImage,
          ...(nationalite ? { nationalite } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        // Afficher l'erreur détaillée si disponible (code d'erreur pour debug)
        const detail = data.debug ? ` [${data.debug}]` : ''
        setError((data.error ?? 'Une erreur est survenue.') + detail)
      } else if (data.already_signed) {
        // Contrat déjà signé (idempotent), rafraîchir pour afficher l'état signé
        setAlreadySigned(true)
        router.refresh()
        fallbackTimerRef.current = setTimeout(() => {
          window.location.href = window.location.pathname + '?t=' + Date.now()
        }, 2000)
      } else {
        setSuccess(true)
        // router.refresh() demande au serveur de re-rendre le composant avec les données fraîches
        // (statut='signe' en DB), remplace le formulaire par le bloc signé sans rechargement complet.
        // Le fallback avec timestamp bust le cache CDN/navigateur au cas où le refresh échoue.
        router.refresh()
        fallbackTimerRef.current = setTimeout(() => {
          window.location.href = window.location.pathname + '?t=' + Date.now()
        }, 3000)
      }
    } catch {
      setError(t.errNetwork)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (alreadySigned) {
    return (
      <div style={successBox}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h2 style={successTitle}>{t.alreadyTitle}</h2>
        <p style={successText}>{t.alreadyText}</p>
      </div>
    )
  }

  if (success) {
    return (
      <div style={successBox}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h2 style={successTitle}>{t.successTitle}</h2>
        <p style={successText}>{t.successText}</p>
        <p style={successMeta}>{t.successMeta}</p>
        <button
          onClick={() => window.print()}
          style={printBtnStyle}
        >
          {t.printBtn}
        </button>
      </div>
    )
  }

  return (
    <div style={signBlock}>
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', marginBottom: '10px' }}>
        {(['fr', 'en', 'es', 'pt', 'de'] as SLang[]).map(l => (
          <button
            key={l}
            type="button"
            onClick={() => setSlang(l)}
            style={{
              padding: '4px 9px', borderRadius: '7px', fontSize: '11.5px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              background: slang === l ? 'rgba(255,213,107,0.15)' : 'transparent',
              border: `1px solid ${slang === l ? 'rgba(255,213,107,0.45)' : 'rgba(255,255,255,0.15)'}`,
              color: slang === l ? '#FFD56B' : 'rgba(255,255,255,0.55)',
            }}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <h3 style={signTitle}>{t.signTitle}</h3>
      <p style={signSubtitle}>{t.signSubtitle}</p>
      <p style={{ ...signSubtitle, fontSize: '12px', opacity: 0.8 }}>{t.officialNote}</p>

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
            {t.signHere}
          </div>
        )}
        <button onClick={clearSignature} style={clearBtn} type="button">
          {t.clear}
        </button>
      </div>

      {/* Nationalité : requise par la réglementation locale pour les hôtes
          (déclaration SIBA au Portugal, fiche de police en France, registre
          SES en Espagne). Select natif = fiable sur mobile. */}
      <div style={natField}>
        <label htmlFor="sign-nationalite" style={natLabel}>
          {t.natLabel}
        </label>
        <select
          id="sign-nationalite"
          value={nationalite}
          onChange={e => setNationalite(e.target.value)}
          style={natSelect}
        >
          <option value="">{t.natSelect}</option>
          {NATIONALITES.map(n => (
            <option key={n.code} value={n.code}>{n.name}</option>
          ))}
        </select>
        <p style={natHint}>{t.natHint}</p>
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
          {t.consentPrefix} <strong style={{ color: '#f0ebe1' }}>{locataireName}</strong>{t.consentBody}
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
        {isSubmitting ? t.submitting : t.submit}
      </button>

      <p style={legalNote}>{t.legalNote}</p>
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

const natField: React.CSSProperties = {
  marginBottom: '20px',
}

const natLabel: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: '#f0ebe1',
  marginBottom: '8px',
}

const natSelect: React.CSSProperties = {
  width: '100%',
  padding: '11px 12px',
  borderRadius: '10px',
  border: '1px solid #1e3d2f',
  background: '#0a1a13',
  color: '#f0ebe1',
  fontSize: '14px',
  fontFamily: 'inherit',
  outline: 'none',
  appearance: 'auto',
}

const natHint: React.CSSProperties = {
  fontSize: '11.5px',
  color: '#6b9a7e',
  lineHeight: 1.5,
  margin: '8px 0 0',
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
  color: 'var(--danger)',
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
  accentColor: 'var(--success-1)',
}

const consentText: React.CSSProperties = {
  fontSize: '13px',
  color: '#a5c4b0',
  lineHeight: 1.7,
}

const errorStyle: React.CSSProperties = {
  color: 'var(--danger)',
  fontSize: '13px',
  margin: '0 0 16px',
}

const submitBtn: React.CSSProperties = {
  width: '100%',
  padding: '16px',
  background: 'var(--success-1)',
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
  background: 'var(--success-bg)',
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
  color: 'var(--success-1)',
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
