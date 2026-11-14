'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NATIONALITES } from '@/lib/nationalites'
import { Dancing_Script } from 'next/font/google'

// Écriture manuscrite pour la signature « Écrire mon nom » (15/11/2026)
const hand = Dancing_Script({ subsets: ['latin', 'latin-ext'], weight: ['600'], display: 'swap' })

// Encre de la signature : foncée sur fond blanc, lisible à l'écran et dans
// l'image enregistrée. Avant : 'var(--success-1)', qu'un canvas ne comprend
// pas (il dessinait en noir sur un fond presque noir : on ne voyait rien).
const INK = '#10241B'
type Mode = 'draw' | 'type' | 'upload'

interface Props {
  token: string
  contractId: string
  locataireName: string
  /** Le contrat reproduit les CGV du bailleur : la case de consentement les vise aussi */
  withCgv?: boolean
}

// ── i18n du bloc de signature ──────────────────────────────────────────
// Seule l'INTERFACE de signature est traduite : le corps du contrat reste
// dans sa langue officielle (c'est lui qui fait foi juridiquement) — une
// note le rappelle dans la langue du voyageur.
type SLang = 'fr' | 'en' | 'es' | 'pt' | 'de'

const SIGN_T: Record<SLang, Record<string, string>> = {
  fr: {
    signTitle: 'Apposez votre signature',
    signSubtitle: "Dessinez votre signature avec la souris ou le doigt, écrivez votre nom ou importez une image de votre signature.",
    modeDraw: "Dessiner",
    modeType: "Écrire mon nom",
    modeUpload: "Importer une image",
    typeLabel: "Votre nom, tel qu’il apparaîtra comme signature",
    uploadBtn: "Choisir une image de ma signature",
    uploadHint: "Photo ou scan de votre signature sur papier blanc (JPG ou PNG).",
    errImage: "Image illisible. Essayez une photo JPG ou PNG.",
    officialNote: 'Le contrat ci-dessus fait foi dans sa langue officielle.',
    signHere: 'Signez ici',
    clear: 'Effacer',
    natLabel: 'Votre nationalité',
    natSelect: 'Sélectionner…',
    natHint: 'Utilisée par votre hôte pour la déclaration réglementaire de votre séjour (obligation légale dans la plupart des pays européens).',
    consentPrefix: 'Je, soussigné(e)',
    consentBody: ", reconnais avoir lu l'intégralité du contrat de location ci-dessus et accepte ses termes. Je consens à sa signature électronique, valide au sens du règlement eIDAS (UE) 910/2014. Cette signature a la même valeur juridique qu'une signature manuscrite.",
    consentCgv: " J'ai lu et j'accepte les conditions générales de vente du bailleur reproduites dans le contrat.",
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
    signSubtitle: "Draw your signature with your mouse or finger, type your name or upload an image of your signature.",
    modeDraw: "Draw",
    modeType: "Type my name",
    modeUpload: "Upload an image",
    typeLabel: "Your name, as it will appear as your signature",
    uploadBtn: "Choose an image of my signature",
    uploadHint: "Photo or scan of your signature on white paper (JPG or PNG).",
    errImage: "Unreadable image. Try a JPG or PNG photo.",
    officialNote: 'The contract above is legally binding in its official language.',
    signHere: 'Sign here',
    clear: 'Clear',
    natLabel: 'Your nationality',
    natSelect: 'Select…',
    natHint: 'Used by your host for the mandatory guest declaration of your stay (a legal requirement in most European countries).',
    consentPrefix: 'I, the undersigned',
    consentBody: ', acknowledge that I have read the entire rental contract above and accept its terms. I consent to its electronic signature, valid under the eIDAS Regulation (EU) 910/2014. This signature has the same legal value as a handwritten one.',
    consentCgv: " I have read and accept the landlord's general terms and conditions reproduced in the contract.",
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
    signSubtitle: "Dibuje su firma con el ratón o el dedo, escriba su nombre o suba una imagen de su firma.",
    modeDraw: "Dibujar",
    modeType: "Escribir mi nombre",
    modeUpload: "Subir una imagen",
    typeLabel: "Su nombre, tal como aparecerá como firma",
    uploadBtn: "Elegir una imagen de mi firma",
    uploadHint: "Foto o escaneo de su firma sobre papel blanco (JPG o PNG).",
    errImage: "Imagen ilegible. Pruebe con una foto JPG o PNG.",
    officialNote: 'El contrato anterior es vinculante en su idioma oficial.',
    signHere: 'Firme aquí',
    clear: 'Borrar',
    natLabel: 'Su nacionalidad',
    natSelect: 'Seleccionar…',
    natHint: 'Su anfitrión la utiliza para la declaración obligatoria de viajeros de su estancia (obligación legal en la mayoría de los países europeos).',
    consentPrefix: 'Yo, el/la abajo firmante',
    consentBody: ', reconozco haber leído íntegramente el contrato de alquiler anterior y acepto sus términos. Consiento su firma electrónica, válida según el Reglamento eIDAS (UE) 910/2014. Esta firma tiene el mismo valor jurídico que una firma manuscrita.',
    consentCgv: ' He leído y acepto las condiciones generales de venta del arrendador reproducidas en el contrato.',
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
    signSubtitle: "Desenhe a sua assinatura com o rato ou o dedo, escreva o seu nome ou importe uma imagem da sua assinatura.",
    modeDraw: "Desenhar",
    modeType: "Escrever o meu nome",
    modeUpload: "Importar uma imagem",
    typeLabel: "O seu nome, tal como aparecerá como assinatura",
    uploadBtn: "Escolher uma imagem da minha assinatura",
    uploadHint: "Foto ou digitalização da sua assinatura em papel branco (JPG ou PNG).",
    errImage: "Imagem ilegível. Experimente uma foto JPG ou PNG.",
    officialNote: 'O contrato acima faz fé na sua língua oficial.',
    signHere: 'Assine aqui',
    clear: 'Apagar',
    natLabel: 'A sua nacionalidade',
    natSelect: 'Selecionar…',
    natHint: 'Utilizada pelo seu anfitrião para a declaração obrigatória de alojamento da sua estadia (obrigação legal na maioria dos países europeus).',
    consentPrefix: 'Eu, abaixo assinado(a)',
    consentBody: ', reconheço ter lido integralmente o contrato de arrendamento acima e aceito os seus termos. Consinto na sua assinatura eletrónica, válida nos termos do Regulamento eIDAS (UE) 910/2014. Esta assinatura tem o mesmo valor jurídico que uma assinatura manuscrita.',
    consentCgv: ' Li e aceito as condições gerais de venda do senhorio reproduzidas no contrato.',
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
    signSubtitle: "Zeichnen Sie Ihre Unterschrift mit Maus oder Finger, tippen Sie Ihren Namen ein oder laden Sie ein Bild Ihrer Unterschrift hoch.",
    modeDraw: "Zeichnen",
    modeType: "Namen eintippen",
    modeUpload: "Bild hochladen",
    typeLabel: "Ihr Name, wie er als Unterschrift erscheint",
    uploadBtn: "Bild meiner Unterschrift wählen",
    uploadHint: "Foto oder Scan Ihrer Unterschrift auf weißem Papier (JPG oder PNG).",
    errImage: "Bild nicht lesbar. Versuchen Sie ein JPG- oder PNG-Foto.",
    officialNote: 'Der obige Vertrag ist in seiner Amtssprache rechtsverbindlich.',
    signHere: 'Hier unterschreiben',
    clear: 'Löschen',
    natLabel: 'Ihre Staatsangehörigkeit',
    natSelect: 'Auswählen…',
    natHint: 'Wird von Ihrem Gastgeber für die gesetzliche Gästemeldung Ihres Aufenthalts verwendet (Pflicht in den meisten europäischen Ländern).',
    consentPrefix: 'Ich, der/die Unterzeichnende',
    consentBody: ', bestätige, den gesamten obigen Mietvertrag gelesen zu haben, und akzeptiere seine Bedingungen. Ich stimme der elektronischen Signatur zu, gültig gemäß der eIDAS-Verordnung (EU) 910/2014. Diese Unterschrift hat denselben rechtlichen Wert wie eine handschriftliche.',
    consentCgv: ' Ich habe die im Vertrag wiedergegebenen Allgemeinen Geschäftsbedingungen des Vermieters gelesen und akzeptiere sie.',
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

export default function SignaturePage({ token, locataireName, withCgv = false }: Props) {
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

  // Cleanup fallback timer on unmount (router.refresh unmounts this component)
  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current)
    }
  }, [])

  // 3 façons de signer (15/11/2026, retour d'une hôte : « les personnes
  // n'arrivent pas à signer ») : dessiner, écrire son nom, importer une image.
  // Les trois aboutissent à la même image PNG envoyée à /api/contracts/sign.
  const [mode, setMode] = useState<Mode>('draw')
  const [typed, setTyped] = useState(locataireName)
  const [uploadName, setUploadName] = useState('')
  const drawing = useRef(false)
  const pts = useRef<{ x: number; y: number }[]>([])
  const cssW = useRef(0)

  /** Taille réelle du canvas = taille affichée x densité de l'écran. Garde le
   *  dessin si la largeur change (rotation du téléphone, barre d'adresse). */
  function fitCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || Math.abs(rect.width - cssW.current) < 1) return
    const dpr = window.devicePixelRatio || 1
    const prev = cssW.current && canvas.width ? canvas.toDataURL() : null
    cssW.current = rect.width
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    paper(ctx, rect.width, rect.height)
    if (prev) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height)
      img.src = prev
    }
  }

  function paper(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.restore()
    ctx.strokeStyle = INK
    ctx.fillStyle = INK
    ctx.lineWidth = 2.6
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    void w; void h
  }

  useEffect(() => {
    fitCanvas()
    const canvas = canvasRef.current
    if (!canvas || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => fitCanvas())
    ro.observe(canvas)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function ctx2d() {
    const canvas = canvasRef.current
    if (!canvas) return null
    if (!cssW.current) fitCanvas()
    return canvas.getContext('2d')
  }

  function posOf(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (mode !== 'draw') return
    e.preventDefault()
    const ctx = ctx2d()
    if (!ctx) return
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* ancien navigateur */ }
    drawing.current = true
    const p = posOf(e)
    pts.current = [p]
    // Un simple appui laisse un point
    ctx.beginPath(); ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2); ctx.fill()
    setHasSignature(true)
    setError('')
  }

  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = ctx2d()
    if (!ctx) return
    // Points intermédiaires (souris et stylet rapides) pour un trait continu
    const events = typeof e.nativeEvent.getCoalescedEvents === 'function' ? e.nativeEvent.getCoalescedEvents() : []
    const rect = e.currentTarget.getBoundingClientRect()
    const list = events.length ? events.map(ev => ({ x: ev.clientX - rect.left, y: ev.clientY - rect.top })) : [posOf(e)]
    for (const p of list) {
      const arr = pts.current
      arr.push(p)
      if (arr.length < 3) {
        const a = arr[0]
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(p.x, p.y); ctx.stroke()
        continue
      }
      const [p0, p1, p2] = arr.slice(-3)
      const m1 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 }
      const m2 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
      ctx.beginPath(); ctx.moveTo(m1.x, m1.y); ctx.quadraticCurveTo(p1.x, p1.y, m2.x, m2.y); ctx.stroke()
      if (arr.length > 3) arr.shift()
    }
  }

  function onUp() {
    drawing.current = false
    pts.current = []
  }

  function clearCanvas() {
    const ctx = ctx2d()
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    const rect = canvas.getBoundingClientRect()
    paper(ctx, rect.width, rect.height)
  }

  function clearSignature() {
    clearCanvas()
    setHasSignature(false)
    setUploadName('')
  }

  // « Écrire mon nom » : le nom tapé, en écriture manuscrite
  useEffect(() => {
    if (mode !== 'type') return
    let cancelled = false
    const name = typed.trim()
    const run = async () => {
      const family = hand.style.fontFamily
      try { await document.fonts.load(`600 48px ${family}`) } catch { /* police de repli */ }
      if (cancelled) return
      const ctx = ctx2d()
      const canvas = canvasRef.current
      if (!ctx || !canvas) return
      const rect = canvas.getBoundingClientRect()
      paper(ctx, rect.width, rect.height)
      if (!name) { setHasSignature(false); return }
      let size = Math.min(56, rect.height * 0.5)
      ctx.font = `600 ${size}px ${family}`
      while (ctx.measureText(name).width > rect.width - 40 && size > 18) {
        size -= 2
        ctx.font = `600 ${size}px ${family}`
      }
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(name, rect.width / 2, rect.height / 2)
      setHasSignature(true)
    }
    run()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, typed])

  // « Importer une image » : photo ou scan, posé sur fond blanc et centré
  function onFile(file: File | undefined) {
    if (!file) return
    setError('')
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const ctx = ctx2d()
      const canvas = canvasRef.current
      if (!ctx || !canvas) { URL.revokeObjectURL(url); return }
      const rect = canvas.getBoundingClientRect()
      paper(ctx, rect.width, rect.height)
      const pad = 10
      const k = Math.min((rect.width - pad * 2) / img.width, (rect.height - pad * 2) / img.height)
      const w = img.width * k, h = img.height * k
      ctx.drawImage(img, (rect.width - w) / 2, (rect.height - h) / 2, w, h)
      URL.revokeObjectURL(url)
      setUploadName(file.name)
      setHasSignature(true)
    }
    img.onerror = () => { URL.revokeObjectURL(url); setError(t.errImage); setHasSignature(false) }
    img.src = url
  }

  function switchMode(m: Mode) {
    if (m === mode) return
    clearSignature()
    setMode(m)
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

      {/* Façon de signer */}
      <div role="tablist" style={modeRow}>
        {(['draw', 'type', 'upload'] as Mode[]).map(m => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => switchMode(m)}
            style={{ ...modeBtn, ...(mode === m ? modeBtnOn : {}) }}>
            {m === 'draw' ? t.modeDraw : m === 'type' ? t.modeType : t.modeUpload}
          </button>
        ))}
      </div>

      {mode === 'type' && (
        <div style={{ marginBottom: '12px' }}>
          <label htmlFor="sign-typed" style={natLabel}>{t.typeLabel}</label>
          <input id="sign-typed" type="text" value={typed} maxLength={80} autoComplete="name"
            onChange={e => setTyped(e.target.value)} style={natSelect} />
        </div>
      )}

      {mode === 'upload' && (
        <div style={{ marginBottom: '12px' }}>
          <label style={uploadLabel}>
            <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }}
              onChange={e => { onFile(e.target.files?.[0]); e.target.value = '' }} />
            {uploadName || t.uploadBtn}
          </label>
          <p style={natHint}>{t.uploadHint}</p>
        </div>
      )}

      {/* Zone de signature (fond blanc, encre foncée) */}
      <div style={canvasWrapper}>
        <canvas
          ref={canvasRef}
          style={{ ...canvasStyle, cursor: mode === 'draw' ? 'crosshair' : 'default' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={onUp}
        />
        {!hasSignature && mode === 'draw' && (
          <div style={canvasPlaceholder}>
            <span style={{ fontSize: '28px', marginBottom: '8px', display: 'block' }}>✍️</span>
            {t.signHere}
          </div>
        )}
        <div style={signLine} aria-hidden="true" />
        {hasSignature && mode !== 'type' && (
          <button onClick={clearSignature} style={clearBtn} type="button">
            {t.clear}
          </button>
        )}
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
          {t.consentPrefix} <strong style={{ color: '#f0ebe1' }}>{locataireName}</strong>{t.consentBody}{withCgv ? t.consentCgv : ''}
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
  height: '170px',
  background: '#ffffff',
  border: '2px dashed rgba(52,211,153,0.45)',
  borderRadius: '14px',
  display: 'block',
  touchAction: 'none',
  userSelect: 'none',
  WebkitUserSelect: 'none',
}

const signLine: React.CSSProperties = {
  position: 'absolute', left: '24px', right: '24px', bottom: '34px',
  borderBottom: '1px solid rgba(16,36,27,0.15)', pointerEvents: 'none',
}

const modeRow: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px',
}

const modeBtn: React.CSSProperties = {
  flex: '1 1 auto', padding: '9px 12px', borderRadius: '10px', cursor: 'pointer',
  fontFamily: 'inherit', fontSize: '13px', fontWeight: 600,
  background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.65)',
}

const modeBtnOn: React.CSSProperties = {
  background: 'rgba(255,213,107,0.15)', border: '1px solid rgba(255,213,107,0.5)', color: '#FFD56B',
}

const uploadLabel: React.CSSProperties = {
  display: 'block', textAlign: 'center', padding: '12px', borderRadius: '10px', cursor: 'pointer',
  border: '1px dashed rgba(255,213,107,0.5)', color: '#FFD56B', fontSize: '14px', fontWeight: 600,
  marginBottom: '8px', wordBreak: 'break-all',
}

const canvasPlaceholder: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  color: 'rgba(16,36,27,0.35)',
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
