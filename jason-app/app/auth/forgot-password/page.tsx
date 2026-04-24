'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, CheckCircle } from '@phosphor-icons/react'
import JmLogo from '@/components/JmLogo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/send-reset-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue.')
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch {
      setError('Erreur réseau. Réessaie.')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.bg1} />
        <div style={{ ...styles.card, textAlign: 'center' }} className="fade-up">
          <CheckCircle size={52} color="#34D399" weight="fill" style={{ marginBottom: '20px' }} />
          <h1 style={{ ...styles.title, marginBottom: '12px' }}>Email envoyé</h1>
          <p style={{ ...styles.subtitle, marginBottom: '28px' }}>
            Si un compte existe avec cet email, tu recevras un lien pour réinitialiser ton mot de passe.
          </p>
          <Link href="/auth/login" style={styles.link}>
            <ArrowLeft size={14} /> Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.bg1} />
      <div style={styles.bg2} />

      <div style={styles.card} className="fade-up">
        <a href="https://jasonmarinho.com" style={styles.logo}>
          <div style={styles.logoIcon}>
            <JmLogo size={22} />
          </div>
          <span style={styles.logoText}>Jason <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>Marinho</em></span>
        </a>

        <h1 style={styles.title}>Mot de passe oublié</h1>
        <p style={styles.subtitle}>Saisis ton email pour recevoir un lien de réinitialisation</p>

        <form onSubmit={handleSubmit} style={styles.form}>
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

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
          >
            {loading ? 'Envoi...' : 'Envoyer le lien'}
            {!loading && <ArrowRight size={16} weight="bold" />}
          </button>
        </form>

        <p style={styles.footer}>
          <Link href="/auth/login" style={styles.link}>
            <ArrowLeft size={13} style={{ verticalAlign: 'middle' }} /> Retour à la connexion
          </Link>
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
    background: 'var(--surface)',
    border: '1px solid var(--border)',
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
  logoText: { fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', fontWeight: 600, color: 'var(--text)' },
  title: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '28px', fontWeight: 400,
    color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: '6px',
  },
  subtitle: { fontSize: '14px', fontWeight: 300, color: 'var(--text-2)', marginBottom: '32px' },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  field: { display: 'flex', flexDirection: 'column', gap: '7px' },
  label: { fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' },
  error: {
    fontSize: '13px', color: '#F87171',
    background: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: '8px', padding: '10px 14px',
  },
  footer: { marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-3)' },
  link: { color: '#FFD56B', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' },
}
