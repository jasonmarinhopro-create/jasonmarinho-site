'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowRight, Eye, EyeSlash,
  GraduationCap, Calculator, ChatText, UsersThree, Megaphone, ShieldCheck,
  Camera, Sparkle, ChartBar, CreditCard, PencilSimple, Image as ImageIcon, Broom, Tag,
} from '@phosphor-icons/react/dist/ssr'
import JmLogo from '@/components/JmLogo'
import { getPostLoginPathAction } from './actions'

type Profile = 'host' | 'photographe' | 'menage'

const PROFILES: Record<Profile, {
  brandTitle: string
  brandDesc: string
  perks: Array<{ icon: any; label: string }>
  formTitle: string
  formSub: string
  noAccountText: string
  registerLabel: string
  registerHref: string
  quote: string
}> = {
  host: {
    brandTitle: 'Content de te revoir parmi nous.',
    brandDesc: 'Retrouve tes formations, outils et la communauté LCD. Tout est là.',
    perks: [
      { icon: GraduationCap, label: 'Formations et guides LCD' },
      { icon: Calculator,    label: 'Simulateurs et outils exclusifs' },
      { icon: ChatText,      label: "Gabarits de messages prêts à l'emploi" },
      { icon: UsersThree,    label: "Communauté d'hôtes Entre Hôtes" },
      { icon: Megaphone,     label: 'Veille et actualités LCD' },
    ],
    formTitle: 'Bon retour',
    formSub: 'Connecte-toi à ton espace hôte LCD',
    noAccountText: 'Pas encore de compte ?',
    registerLabel: 'Créer un compte gratuit',
    registerHref: '/auth/register',
    quote: '"Mon objectif : te donner les meilleurs outils pour développer ton activité, honnêtement."',
  },
  photographe: {
    brandTitle: 'Bon retour dans ton espace photographe.',
    brandDesc: 'Édite ta fiche, suis tes stats et gère ton abonnement annuel en quelques clics.',
    perks: [
      { icon: PencilSimple, label: 'Édite ta fiche à tout moment (bio, tarifs, zone, portfolio)' },
      { icon: ChartBar,     label: 'Stats : vues de fiche, contacts reçus, ancienneté' },
      { icon: ImageIcon,    label: 'Aperçu en direct de ta fiche publique' },
      { icon: CreditCard,   label: "Gère ton abonnement (factures, carte, résiliation) via le portail Stripe" },
      { icon: ShieldCheck,  label: 'Membre vérifié de l\'annuaire Jason Marinho' },
    ],
    formTitle: 'Mon espace photographe',
    formSub: 'Connecte-toi avec l\'email et le mot de passe choisis à l\'inscription',
    noAccountText: 'Pas encore de fiche photographe ?',
    registerLabel: 'Créer ma fiche en 2 minutes',
    registerHref: 'https://jasonmarinho.com/annuaires/photographes/inscription',
    quote: '"Un mini-site pro hébergé sur jasonmarinho.com, vérifié, accessible à vie tant que ton abonnement reste actif."',
  },
  menage: {
    brandTitle: 'Bon retour dans ton espace équipe ménage.',
    brandDesc: 'Édite ta fiche équipe, suis tes stats et gère ton abonnement annuel en quelques clics.',
    perks: [
      { icon: PencilSimple, label: 'Édite ta fiche à tout moment (prestations, tarifs, équipe, garanties)' },
      { icon: ChartBar,     label: 'Stats : vues de fiche, contacts reçus, ancienneté' },
      { icon: Broom,        label: 'Affiche tes prestations (linge, EDL photo, réappro…)' },
      { icon: Tag,          label: 'Mets en avant ton tarif horaire OU ton forfait turnover' },
      { icon: CreditCard,   label: 'Gère ton abonnement (factures, carte, résiliation) via le portail Stripe' },
    ],
    formTitle: 'Mon espace équipe ménage',
    formSub: 'Connecte-toi avec l\'email et le mot de passe choisis à l\'inscription',
    noAccountText: 'Pas encore de fiche équipe ?',
    registerLabel: 'Créer ma fiche en 2 minutes',
    registerHref: 'https://jasonmarinho.com/annuaires/menage/inscription',
    quote: '"Un mini-site pro hébergé sur jasonmarinho.com, vérifié, accessible à vie tant que ton abonnement reste actif."',
  },
}

const MAX_ATTEMPTS = 5
const BLOCK_DURATION_MS = 10 * 60 * 1000

export default function LoginPage() {
  // useSearchParams() requires a Suspense boundary pour passer le
  // prerender statique Next.js (sinon le build échoue avec
  // "missing-suspense-with-csr-bailout").
  return (
    <Suspense fallback={<div style={{ minHeight: '100svh', background: '#fff' }} />}>
      <LoginInner />
    </Suspense>
  )
}

function LoginInner() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const asParam = searchParams?.get('as') ?? ''
  const profileKey: Profile = asParam === 'photographe' ? 'photographe' : asParam === 'menage' ? 'menage' : 'host'
  const ctx = PROFILES[profileKey]

  // NB : PAS de router.prefetch(/dashboard) ici. Prefetcher une route
  // protegee AVANT l'authentification met en cache la reponse anonyme
  // (= redirect middleware vers /auth/login). Au submit, router.replace
  // reutilisait cette entree polluee → rebond sur la page de connexion
  // ("je n'arrive pas a me connecter", surtout mobile). Le refresh()
  // post-login purge le Router Cache avant de naviguer.

  // Si l'utilisateur visite /auth/login?as=photographe ou ?as=menage en
  // étant déjà connecté, on redirige directement vers l'espace ciblé
  // (le sélecteur d'espace du header lui permet ensuite de switcher).
  useEffect(() => {
    if (asParam !== 'photographe' && asParam !== 'menage') return
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const target = asParam === 'photographe' ? '/dashboard/ma-fiche-photographe' : '/dashboard/ma-fiche-menage'
      // router.replace utilise le prefetch (client-side nav), pas de reload
      router.replace(target)
    })
  }, [asParam])


  useEffect(() => {
    const hash = window.location.hash
    const isRecovery = hash.includes('type=recovery')
    const isSignup = hash.includes('type=signup')
    if (!isRecovery && !isSignup) return

    if (isRecovery) {
      window.location.replace('/auth/reset-password' + hash)
      return
    }

    let redirected = false
    const redirect = () => {
      if (redirected) return
      redirected = true
      // refresh() purge le Router Cache client : sans ca, une entree
      // /dashboard mise en cache AVANT l'auth (redirect anonyme) ferait
      // rebondir la navigation vers /auth/login.
      router.refresh()
      router.replace('/dashboard')
      // Trigger le multi-espace redirect en arriere-plan (non bloquant)
      resolveOptimalDestination()
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        subscription.unsubscribe()
        redirect()
      }
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) redirect()
    })

    return () => subscription.unsubscribe()
  }, [])

  // Determine la vraie page d'atterrissage APRES la redirection optimiste.
  // Si l'utilisateur est pro-only (aucun logement, une fiche photo/menage),
  // on ajuste vers sa fiche. Sinon on reste sur /dashboard.
  async function resolveOptimalDestination() {
    try {
      const path = await getPostLoginPathAction()
      if (path !== '/dashboard' && typeof window !== 'undefined' && window.location.pathname === '/dashboard') {
        router.replace(path)
      }
    } catch {
      // Ignore : l'utilisateur reste sur /dashboard, c'est un fallback safe
    }
  }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null)
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  // Refs pour lire la VRAIE valeur des champs au submit — l'autofill Chrome
  // remplit le DOM sans toujours déclencher onChange, donc l'état React peut
  // rester vide (→ 1er clic qui envoie du vide, "il faut cliquer 2 fois").
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    if (blockedUntil && Date.now() < blockedUntil) {
      const minutesLeft = Math.ceil((blockedUntil - Date.now()) / 60000)
      setError(`Trop de tentatives. Réessaie dans ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`)
      return
    }

    setLoading(true)
    setError('')
    setEmailNotConfirmed(false)

    // Lit la valeur réelle du DOM (autofill inclus) et resynchronise l'état :
    // évite le "clic dans le vide" quand Chrome a rempli sans onChange.
    const emailVal = (emailRef.current?.value ?? email).trim()
    const passwordVal = passwordRef.current?.value ?? password
    if (emailVal !== email) setEmail(emailVal)
    if (passwordVal !== password) setPassword(passwordVal)

    if (!emailVal || !passwordVal) {
      setError('Saisis ton email et ton mot de passe.')
      setLoading(false)
      return
    }

    let signInError: Error | null = null
    let isUnconfirmed = false
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: emailVal, password: passwordVal })
      if (error) {
        if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
          isUnconfirmed = true
        } else {
          signInError = error
        }
      }
    } catch {
      setError('Une erreur inattendue est survenue. Réessaie dans quelques instants.')
      setLoading(false)
      return
    }

    if (isUnconfirmed) {
      setEmailNotConfirmed(true)
      setError('Tu dois confirmer ton email avant de te connecter. Vérifie ta boîte mail (et tes spams).')
      setLoading(false)
      return
    }

    if (signInError) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (newAttempts >= MAX_ATTEMPTS) {
        setBlockedUntil(Date.now() + BLOCK_DURATION_MS)
        setAttempts(0)
        setError('Trop de tentatives. Compte temporairement bloqué pendant 10 minutes.')
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts
        setError(`Email ou mot de passe incorrect. ${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`)
      }
      setLoading(false)
      return
    }

    // NB : on garde loading=true pendant la redirection — le bouton reste
    // sur "Connexion..." jusqu'au changement de page. Avant, il repassait
    // a "Se connecter" alors que la nav etait en cours → sensation d'echec
    // sur mobile (l'utilisateur re-tapait le bouton).
    //
    // refresh() purge le Router Cache : une visite anonyme de /dashboard
    // (ou un ancien prefetch) y avait mis en cache le redirect vers
    // /auth/login — router.replace reutilisait cette entree polluee et
    // ramenait l'utilisateur sur la page de connexion.
    router.refresh()
    router.replace('/dashboard')
    // Le multi-espace redirect (getPostLoginPathAction, 500-1500ms) tourne
    // en arriere-plan et n'attend PAS avant de rediriger.
    resolveOptimalDestination()
  }

  async function handleResendConfirmation() {
    if (!email) {
      setError('Saisis ton email pour renvoyer la confirmation.')
      return
    }
    setResendLoading(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResendLoading(false)
    if (error) {
      setError("Impossible de renvoyer l'email. Réessaie dans quelques minutes.")
    } else {
      setResendSent(true)
    }
  }

  const isBlocked = blockedUntil !== null && Date.now() < blockedUntil

  const brandPanel = (
    <div className="auth-brand" style={s.brand}>
      <div style={s.brandInner}>
        <a href="https://jasonmarinho.com" style={s.brandLogo}>
          <div style={s.brandLogoIcon}><JmLogo size={20} /></div>
          <span style={s.brandLogoText}>
            Jason <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>Marinho</em>
          </span>
        </a>

        <div>
          <h1 style={s.brandTitle}>{ctx.brandTitle}</h1>
          <p style={s.brandDesc}>{ctx.brandDesc}</p>
        </div>

        <ul style={s.perksList}>
          {ctx.perks.map(({ icon: Icon, label }) => (
            <li key={label} style={s.perkItem}>
              <div style={s.perkIcon}><Icon size={15} weight="bold" color="#FFD56B" /></div>
              <span>{label}</span>
            </li>
          ))}
        </ul>

        <div style={s.quote}>
          <p style={s.quoteText}>{ctx.quote}</p>
          <p style={s.quoteAuthor}>Jason Marinho</p>
        </div>
      </div>
    </div>
  )

  return (
    <div data-theme="light" className="auth-wrap" style={s.wrap}>
      <style>{MEDIA_CSS}</style>
      {brandPanel}

      <div className="auth-form-side" style={s.formSide}>
        {/* Mobile top bar */}
        <div className="auth-mobile-bar" style={s.mobileBar}>
          <a href="https://jasonmarinho.com" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
            <div style={s.brandLogoIcon}><JmLogo size={18} /></div>
            <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '16px', fontWeight: 600, color: '#fff' }}>
              Jason <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>Marinho</em>
            </span>
          </a>
        </div>

        <div style={s.formCard} className="fade-up">
          <h2 style={s.formTitle}>{ctx.formTitle}</h2>
          <p style={s.formSub}>{ctx.formSub}</p>

          <form onSubmit={handleLogin} style={s.form}>
            <div style={s.field}>
              <label htmlFor="login-email" style={s.label}>Adresse email</label>
              <input
                ref={emailRef}
                id="login-email" name="email" type="email"
                className="input-field" placeholder="toi@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="username" inputMode="email"
                spellCheck={false} autoCapitalize="none"
                disabled={isBlocked}
              />
            </div>

            <div style={s.field}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="login-password" style={s.label}>Mot de passe</label>
                <Link href="/auth/forgot-password" style={s.forgotLink}>
                  Mot de passe oublié ?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  ref={passwordRef}
                  id="login-password" name="password"
                  type={showPassword ? 'text' : 'password'} className="input-field"
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required autoComplete="current-password"
                  style={{ paddingRight: '44px' }} disabled={isBlocked}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={s.eyeBtn}>
                  {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div>
                <p style={s.errorBox}>{error}</p>
                {emailNotConfirmed && !resendSent && (
                  <button
                    type="button" onClick={handleResendConfirmation}
                    disabled={resendLoading} style={s.resendBtn}
                  >
                    {resendLoading ? 'Envoi...' : "Renvoyer l'email de confirmation"}
                  </button>
                )}
                {resendSent && (
                  <p style={s.resendSuccess}>Email de confirmation renvoyé ! Vérifie ta boîte mail.</p>
                )}
              </div>
            )}

            <button
              type="submit" className="btn-primary" disabled={loading || isBlocked}
              style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
              {!loading && <ArrowRight size={16} weight="bold" />}
            </button>
          </form>

          <p style={s.footerText}>
            {ctx.noAccountText}{' '}
            {ctx.registerHref.startsWith('http') ? (
              <a href={ctx.registerHref} style={s.footerLink}>{ctx.registerLabel}</a>
            ) : (
              <Link href={ctx.registerHref} style={s.footerLink}>{ctx.registerLabel}</Link>
            )}
          </p>

          <div style={s.trustRow}>
            <ShieldCheck size={13} color="rgba(0,76,63,0.35)" weight="bold" />
            <span style={s.trustText}>Données sécurisées · RGPD · Aucun partage avec des tiers</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const MEDIA_CSS = `
  .auth-brand { display: flex; }
  .auth-mobile-bar { display: none !important; }
  .auth-form-side { min-height: 100svh; }
  @media (max-width: 1023px) {
    .auth-brand {
      width: 38% !important;
      min-width: 280px !important;
      padding: clamp(32px,4vh,48px) clamp(24px,3vw,40px) !important;
    }
  }
  @media (max-width: 767px) {
    .auth-wrap { flex-direction: column !important; }
    .auth-brand { display: none !important; }
    .auth-mobile-bar { display: flex !important; }
    .auth-form-side {
      min-height: auto !important;
      padding: 0 20px 48px !important;
      justify-content: flex-start !important;
    }
  }
`

const s: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100svh',
    display: 'flex',
    background: '#fff',
  },
  brand: {
    width: '42%',
    minWidth: '360px',
    background: '#004C3F',
    padding: 'clamp(40px,6vh,72px) clamp(36px,4vw,64px)',
    alignItems: 'flex-start',
    flexShrink: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  brandInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
    maxWidth: '380px',
    position: 'sticky',
    top: '48px',
  },
  brandLogo: {
    display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none',
  },
  brandLogoIcon: {
    width: '34px', height: '34px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,213,107,0.25)',
    borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  brandLogoText: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', fontWeight: 600, color: '#fff',
  },
  brandTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(22px,2.4vw,30px)', fontWeight: 400,
    color: '#fff', lineHeight: 1.25, letterSpacing: '-0.5px', marginBottom: '14px',
  },
  brandDesc: {
    fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65,
  },
  perksList: {
    listStyle: 'none', padding: 0, margin: 0,
    display: 'flex', flexDirection: 'column', gap: '13px',
  },
  perkItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    fontSize: '14px', color: 'rgba(255,255,255,0.72)',
  },
  perkIcon: {
    width: '28px', height: '28px', borderRadius: '8px',
    background: 'rgba(255,213,107,0.1)', border: '1px solid rgba(255,213,107,0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  quote: {
    borderLeft: '2px solid rgba(255,213,107,0.3)',
    paddingLeft: '18px',
  },
  quoteText: {
    fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7,
    marginBottom: '8px', fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: '12px', color: 'rgba(255,213,107,0.6)', fontWeight: 500,
  },
  // Form side
  formSide: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'clamp(40px,6vh,80px) clamp(24px,5vw,80px)',
    background: '#fff',
    overflowY: 'auto',
  },
  mobileBar: {
    display: 'flex',
    background: '#004C3F',
    padding: '16px 20px',
    marginLeft: '-20px',
    marginRight: '-20px',
    width: 'calc(100% + 40px)',
    marginBottom: '36px',
    alignItems: 'center',
  } as React.CSSProperties,
  formCard: {
    width: '100%',
    maxWidth: '440px',
    animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
  },
  formTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '28px', fontWeight: 400,
    color: '#0B1D0F', letterSpacing: '-0.5px', marginBottom: '8px',
  },
  formSub: {
    fontSize: '14px', color: 'rgba(11,29,15,0.55)',
    marginBottom: '32px', fontWeight: 400, lineHeight: 1.55,
  },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  label: { fontSize: '13px', fontWeight: 600, color: 'rgba(11,29,15,0.65)' },
  forgotLink: {
    fontSize: '12px', color: 'rgba(0,76,63,0.75)',
    textDecoration: 'none', fontWeight: 600,
    transition: 'color 0.2s',
  },
  eyeBtn: {
    position: 'absolute' as const, right: '12px', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(11,29,15,0.4)', padding: '6px',
    display: 'flex', alignItems: 'center',
    borderRadius: '6px',
    transition: 'color 0.2s, background 0.2s',
  },
  errorBox: {
    fontSize: '13px', color: '#DC2626',
    background: 'rgba(220,38,38,0.06)',
    border: '1px solid rgba(220,38,38,0.20)',
    borderRadius: '10px', padding: '11px 14px',
  },
  resendBtn: {
    marginTop: '8px', background: 'none',
    border: '1px solid rgba(220,38,38,0.3)',
    borderRadius: '8px', color: '#DC2626',
    fontSize: '12px', padding: '7px 12px',
    cursor: 'pointer', width: '100%',
  },
  resendSuccess: {
    marginTop: '8px', fontSize: '13px', color: '#059669',
    background: 'rgba(5,150,105,0.06)',
    border: '1px solid rgba(5,150,105,0.15)',
    borderRadius: '8px', padding: '10px 14px',
  },
  footerText: {
    marginTop: '22px', textAlign: 'center', fontSize: '13px', color: 'rgba(11,29,15,0.38)',
  },
  footerLink: { color: '#004C3F', textDecoration: 'none', fontWeight: 500 },
  trustRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    marginTop: '14px',
  },
  trustText: { fontSize: '11px', color: 'rgba(11,29,15,0.28)', letterSpacing: '0.1px' },
}
