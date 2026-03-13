'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Eye, EyeSlash, CheckCircle } from '@phosphor-icons/react'
import JmLogo from '@/components/JmLogo'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    // The #access_token in the URL is already a valid JWT — use setSession directly
    const hash = window.location.hash
    if (hash.includes('access_token') && hash.includes('type=recovery')) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ error: sessionError }) => {
            if (sessionError) {
              setError('Lien expiré ou invalide. Demande un nouveau lien de réinitialisation.')
            } else {
              setSessionReady(true)
            }
          })
        return
      }
    }

    // Fallback: check for existing session in cookies
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setSessionReady(true)
      }
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      const msg = error.message.toLowerCase()
      let friendlyError = 'Une erreur est survenue. Réessaie.'
      if (msg.includes('session') || msg.includes('auth session missing')) {
        friendlyError = 'Lien expiré ou invalide. Demande un nouveau lien de réinitialisation.'
      } else if (msg.includes('same password') || msg.includes('different from the old')) {
        friendlyError = 'Le nouveau mot de passe doit être différent de l\'ancien.'
      }
      setError(friendlyError)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  if (success) {
    return (
      <div style={{ ...styles.card, textAlign: 'center' }} className="fade-up">
        <CheckCircle size={52} color="#34D399" weight="fill" style={{ marginBottom: '20px' }} />
        <h1 style={{ ...styles.title, marginBottom: '12px' }}>Mot de passe mis à jour</h1>
        <p style={{ ...styles.subtitle, marginBottom: '0' }}>
          Redirection vers ton espace dans quelques secondes...
        </p>
      </div>
    )
  }

  return (
    <div style={styles.card} className="fade-up">
      <a href="https://jasonmarinho.com" style={styles.logo}>
        <div style={styles.logoIcon}>
          <JmLogo size={22} />
        </div>
        <span style={styles.logoText}>Jason <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>Marinho</em></span>
      </a>

      <h1 style={styles.title}>Nouveau mot de passe</h1>
      <p style={styles.subtitle}>Choisis un mot de passe sécurisé</p>

      <form onSubmit={handleReset} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>Nouveau mot de passe</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field"
              placeholder="8 caractères minimum"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              style={{ paddingRight: '44px' }}
            />
            <button type="button" onClick={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
              {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Confirmer le mot de passe</label>
          <input
            type={showPassword ? 'text' : 'password'}
            className="input-field"
            placeholder="Même mot de passe"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !sessionReady}
          style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
        >
          {loading ? 'Mise à jour...' : !sessionReady ? 'Chargement...' : 'Mettre à jour'}
          {!loading && sessionReady && <ArrowRight size={16} weight="bold" />}
        </button>
      </form>

      <p style={styles.footer}>
        <Link href="/auth/forgot-password" style={styles.link}>Demander un nouveau lien</Link>
      </p>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div style={styles.page}>
      <div style={styles.bg1} />
      <div style={styles.bg2} />
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
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
  footer: { marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'rgba(240,244,255,0.4)' },
  link: { color: '#FFD56B', textDecoration: 'none', fontWeight: 500 },
}
