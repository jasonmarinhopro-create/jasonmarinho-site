'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Eye, EyeSlash, Waves, CheckCircle } from '@phosphor-icons/react'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? 'Un compte existe déjà avec cet email.'
        : 'Une erreur est survenue. Réessaie.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.bg1} />
        <div style={styles.card} className="fade-up" style2={{ textAlign: 'center' }}>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <CheckCircle size={52} color="#34D399" weight="fill" style={{ marginBottom: '20px' }} />
            <h1 style={{ ...styles.title, marginBottom: '12px' }}>Compte créé</h1>
            <p style={{ ...styles.subtitle, marginBottom: '28px' }}>
              Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.
            </p>
            <Link href="/auth/login" className="btn-primary" style={{ justifyContent: 'center' }}>
              Aller à la connexion <ArrowRight size={16} weight="bold" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.bg1} />
      <div style={styles.bg2} />

      <div style={styles.card} className="fade-up">
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <Waves size={22} color="#FFD56B" weight="bold" />
          </div>
          <span style={styles.logoText}>Jason <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>Marinho</em></span>
        </div>

        <h1 style={styles.title}>Créer un compte</h1>
        <p style={styles.subtitle}>Accède aux formations, gabarits et partenaires</p>

        <form onSubmit={handleRegister} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Prénom et nom</label>
            <input
              type="text"
              className="input-field"
              placeholder="Marie Dupont"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

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
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Mot de passe</label>
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
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={styles.eyeBtn}
              >
                {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
            {loading ? 'Création...' : 'Créer mon compte'}
            {!loading && <ArrowRight size={16} weight="bold" />}
          </button>
        </form>

        <p style={styles.footer}>
          Déjà un compte ?{' '}
          <Link href="/auth/login" style={styles.link}>Se connecter</Link>
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
  logo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' },
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
