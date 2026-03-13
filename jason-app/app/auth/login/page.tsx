'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowRight, Eye, EyeSlash, Waves } from '@phosphor-icons/react'
import { loginAction } from './actions'

const MAX_ATTEMPTS = 5
const BLOCK_DURATION_MS = 10 * 60 * 1000

export default function LoginPage() {
  const supabase = createClient()

  // Handle Supabase tokens redirected to this page
  useEffect(() => {
    const hash = window.location.hash
    const isRecovery = hash.includes('type=recovery')
    const isSignup = hash.includes('type=signup')
    if (!isRecovery && !isSignup) return

    if (isRecovery) {
      // Pass the hash to reset-password so it can call setSession() directly with the JWT
      window.location.replace('/auth/reset-password' + hash)
      return
    }

    // type=signup: email confirmed → wait for session then go to dashboard
    let redirected = false
    const redirect = () => {
      if (redirected) return
      redirected = true
      window.location.replace('/dashboard')
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

    const result = await loginAction(email, password)

    if (result?.error === 'EMAIL_NOT_CONFIRMED') {
      setEmailNotConfirmed(true)
      setError('Tu dois confirmer ton email avant de te connecter. Vérifie ta boîte mail (et tes spams).')
      setLoading(false)
      return
    }

    if (result?.error) {
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

    // loginAction redirects server-side on success, no need to handle here
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
      setError('Impossible de renvoyer l\'email. Réessaie dans quelques minutes.')
    } else {
      setResendSent(true)
    }
  }

  const isBlocked = blockedUntil !== null && Date.now() < blockedUntil

  return (
    <div style={styles.page}>
      <div style={styles.bg1} />
      <div style={styles.bg2} />

      <div style={styles.card} className="fade-up">
        <a href="https://jasonmarinho.com" style={styles.logo}>
          <div style={styles.logoIcon}>
            <Waves size={22} color="#FFD56B" weight="bold" />
          </div>
          <span style={styles.logoText}>Jason <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>Marinho</em></span>
        </a>

        <h1 style={styles.title}>Bon retour</h1>
        <p style={styles.subtitle}>Connecte-toi à ton espace membre</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="toi@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isBlocked}
            />
          </div>

          <div style={styles.field}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={styles.label}>Mot de passe</label>
              <Link href="/auth/forgot-password" style={styles.forgotLink}>
                Mot de passe oublié ?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '44px' }}
                disabled={isBlocked}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={styles.eyeBtn}
              >
                {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div>
              <p style={styles.error}>{error}</p>
              {emailNotConfirmed && !resendSent && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resendLoading}
                  style={styles.resendBtn}
                >
                  {resendLoading ? 'Envoi...' : 'Renvoyer l\'email de confirmation'}
                </button>
              )}
              {resendSent && (
                <p style={styles.resendSuccess}>Email de confirmation renvoyé ! Vérifie ta boîte mail.</p>
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || isBlocked}
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
            {!loading && <ArrowRight size={16} weight="bold" />}
          </button>
        </form>

        <p style={styles.footer}>
          Pas encore de compte ?{' '}
          <Link href="/auth/register" style={styles.link}>Créer un compte</Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100svh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px 16px', position: 'relative', overflow: 'hidden',
  },
  bg1: {
    position: 'fixed', top: '-10%', right: '-10%',
    width: '500px', height: '500px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,76,63,0.25) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  bg2: {
    position: 'fixed', bottom: '-10%', left: '-10%',
    width: '400px', height: '400px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,213,107,0.06) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  card: {
    width: '100%', maxWidth: '420px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '20px', padding: '40px 36px',
    backdropFilter: 'blur(20px)',
    position: 'relative', zIndex: 2,
  },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', textDecoration: 'none' },
  logoIcon: {
    width: '36px', height: '36px',
    background: 'rgba(0,76,63,0.5)',
    border: '1px solid rgba(255,213,107,0.2)',
    borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 600, color: '#f0f4ff' },
  title: {
    fontFamily: 'Fraunces, serif', fontSize: '28px', fontWeight: 400,
    color: '#f0f4ff', letterSpacing: '-0.5px', marginBottom: '6px',
  },
  subtitle: { fontSize: '14px', fontWeight: 300, color: 'rgba(240,244,255,0.5)', marginBottom: '32px' },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  field: { display: 'flex', flexDirection: 'column', gap: '7px' },
  label: { fontSize: '13px', fontWeight: 500, color: 'rgba(240,244,255,0.7)' },
  forgotLink: { fontSize: '12px', color: 'rgba(255,213,107,0.7)', textDecoration: 'none', fontWeight: 400 },
  eyeBtn: {
    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(240,244,255,0.4)', padding: '4px',
    display: 'flex', alignItems: 'center',
  },
  error: {
    fontSize: '13px', color: '#F87171',
    background: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: '8px', padding: '10px 14px',
  },
  resendBtn: {
    marginTop: '8px', background: 'none',
    border: '1px solid rgba(248,113,113,0.4)',
    borderRadius: '8px', color: '#F87171',
    fontSize: '12px', padding: '7px 12px',
    cursor: 'pointer', width: '100%',
  },
  resendSuccess: {
    marginTop: '8px', fontSize: '13px', color: '#4ade80',
    background: 'rgba(74,222,128,0.08)',
    border: '1px solid rgba(74,222,128,0.2)',
    borderRadius: '8px', padding: '10px 14px',
  },
  footer: { marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'rgba(240,244,255,0.4)' },
  link: { color: '#FFD56B', textDecoration: 'none', fontWeight: 500 },
}
