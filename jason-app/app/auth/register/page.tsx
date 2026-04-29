'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Eye, EyeSlash, CheckCircle,
  GraduationCap, Calculator, ChatText, UsersThree, Megaphone, ShieldCheck,
} from '@phosphor-icons/react'
import JmLogo from '@/components/JmLogo'

const PERKS = [
  { icon: GraduationCap, label: 'Formations et guides LCD' },
  { icon: Calculator,    label: 'Simulateurs et outils exclusifs' },
  { icon: ChatText,      label: "Gabarits de messages prêts à l'emploi" },
  { icon: UsersThree,    label: "Communauté d'hôtes Chez Nous" },
  { icon: Megaphone,     label: 'Veille et actualités LCD' },
]

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const strength = password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const colors = ['', '#ef4444', '#f59e0b', '#10b981']
  const labels = ['', 'Faible', 'Moyen', 'Fort']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          flex: 1, height: '3px', borderRadius: '99px', transition: 'background 0.25s',
          background: i <= strength ? colors[strength] : 'rgba(0,76,63,0.1)',
        }} />
      ))}
      <span style={{ fontSize: '11px', color: colors[strength], fontWeight: 600, width: '34px', textAlign: 'right' }}>
        {labels[strength]}
      </span>
    </div>
  )
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isDriingMember, setIsDriingMember] = useState(false)
  const [newsletterConsent, setNewsletterConsent] = useState(false)
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
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, isDriingMember, newsletterConsent }),
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
          <h1 style={s.brandTitle}>L'espace des hôtes qui veulent aller plus loin.</h1>
          <p style={s.brandDesc}>
            Formations, outils et communauté pour développer ton activité LCD. Honnêtement.
          </p>
        </div>

        <ul style={s.perksList}>
          {PERKS.map(({ icon: Icon, label }) => (
            <li key={label} style={s.perkItem}>
              <div style={s.perkIcon}><Icon size={15} weight="bold" color="#FFD56B" /></div>
              <span>{label}</span>
            </li>
          ))}
        </ul>

        <div style={s.quote}>
          <p style={s.quoteText}>
            "Je construis cet espace pour les hôtes sérieux. L'accès de base est 100% gratuit."
          </p>
          <p style={s.quoteAuthor}>Jason Marinho</p>
        </div>
      </div>
    </div>
  )

  if (success) {
    return (
      <div data-theme="light" className="auth-wrap" style={s.wrap}>
        <style>{MEDIA_CSS}</style>
        {brandPanel}
        <div className="auth-form-side" style={{ ...s.formSide, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: '360px', padding: '40px 0' }} className="fade-up">
            <CheckCircle size={56} weight="fill" color="#10b981" style={{ marginBottom: '20px' }} />
            <h2 style={s.formTitle}>Compte créé !</h2>
            <p style={{ fontSize: '15px', color: 'rgba(11,29,15,0.5)', lineHeight: 1.65, marginBottom: '32px' }}>
              Un email de confirmation t'a été envoyé. Vérifie ta boîte mail (et tes spams), puis connecte-toi.
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
    <div data-theme="light" className="auth-wrap" style={s.wrap}>
      <style>{MEDIA_CSS}</style>
      {brandPanel}

      <div className="auth-form-side" style={s.formSide}>
        {/* Mobile top bar — visible only on small screens */}
        <div className="auth-mobile-bar" style={s.mobileBar}>
          <a href="https://jasonmarinho.com" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
            <div style={s.brandLogoIcon}><JmLogo size={18} /></div>
            <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '16px', fontWeight: 600, color: '#fff' }}>
              Jason <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>Marinho</em>
            </span>
          </a>
        </div>

        <div style={s.formCard} className="fade-up">
          <h2 style={s.formTitle}>Créer mon compte</h2>
          <p style={s.formSub}>Accès gratuit · Prêt en 30 secondes</p>

          <form onSubmit={handleRegister} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Prénom et nom</label>
              <input
                type="text" className="input-field" placeholder="Marie Dupont"
                value={fullName} onChange={e => setFullName(e.target.value)}
                required autoComplete="name"
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Adresse email</label>
              <input
                type="email" className="input-field" placeholder="toi@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email"
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'} className="input-field"
                  placeholder="8 caractères minimum"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required autoComplete="new-password" style={{ paddingRight: '44px' }}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={s.eyeBtn}>
                  {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {/* Driing membership */}
            <div style={isDriingMember ? s.driingBoxActive : s.driingBox}>
              <label style={s.driingLabel}>
                <input
                  type="checkbox" checked={isDriingMember}
                  onChange={e => setIsDriingMember(e.target.checked)} style={s.checkbox}
                />
                <span>
                  Je suis membre <strong style={{ color: '#004C3F' }}>Driing</strong>
                  <span style={s.driingBadge}>Accès gratuit</span>
                </span>
              </label>
              {isDriingMember && (
                <p style={s.driingNote}>
                  Utilise l'adresse email de ton compte Driing. Jason activera tes accès sous 24h.
                </p>
              )}
            </div>

            {/* Newsletter consent */}
            <label style={s.consentLabel}>
              <input
                type="checkbox" checked={newsletterConsent}
                onChange={e => setNewsletterConsent(e.target.checked)} style={s.checkbox}
              />
              <span>
                Je veux recevoir les conseils et ressources LCD de Jason par email.
                <span style={s.consentNote}> Pas de spam — résiliable en 1 clic.</span>
              </span>
            </label>

            {error && <p style={s.errorBox}>{error}</p>}

            <button
              type="submit" className="btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
            >
              {loading ? 'Création en cours...' : 'Créer mon compte gratuit'}
              {!loading && <ArrowRight size={16} weight="bold" />}
            </button>
          </form>

          <p style={s.footerText}>
            Déjà un compte ?{' '}
            <Link href="/auth/login" style={s.footerLink}>Se connecter</Link>
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
  },
  formTitle: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '26px', fontWeight: 400,
    color: '#0B1D0F', letterSpacing: '-0.4px', marginBottom: '6px',
  },
  formSub: {
    fontSize: '14px', color: 'rgba(11,29,15,0.4)', marginBottom: '32px', fontWeight: 300,
  },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  field: { display: 'flex', flexDirection: 'column', gap: '7px' },
  label: { fontSize: '13px', fontWeight: 500, color: 'rgba(11,29,15,0.55)' },
  eyeBtn: {
    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(11,29,15,0.3)', padding: '4px',
    display: 'flex', alignItems: 'center',
  },
  driingBox: {
    background: 'rgba(0,76,63,0.04)',
    border: '1px solid rgba(0,76,63,0.1)',
    borderRadius: '10px', padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  driingBoxActive: {
    background: 'rgba(0,76,63,0.07)',
    border: '1px solid rgba(0,76,63,0.2)',
    borderRadius: '10px', padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  driingLabel: {
    display: 'flex', alignItems: 'center', gap: '10px',
    cursor: 'pointer', fontSize: '14px', color: '#0B1D0F',
    userSelect: 'none' as const,
  },
  driingBadge: {
    marginLeft: '8px',
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.4px',
    background: 'rgba(0,76,63,0.1)', color: '#004C3F',
    border: '1px solid rgba(0,76,63,0.18)',
    borderRadius: '99px', padding: '2px 8px',
    verticalAlign: 'middle',
  },
  driingNote: {
    fontSize: '12px', color: 'rgba(11,29,15,0.42)', lineHeight: 1.6,
    margin: 0, paddingLeft: '26px',
  },
  checkbox: {
    width: '16px', height: '16px', accentColor: '#004C3F', cursor: 'pointer', flexShrink: 0,
  },
  consentLabel: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    cursor: 'pointer', fontSize: '13px', color: 'rgba(11,29,15,0.48)',
    userSelect: 'none' as const, lineHeight: 1.55,
  },
  consentNote: { color: 'rgba(11,29,15,0.3)' },
  errorBox: {
    fontSize: '13px', color: '#DC2626',
    background: 'rgba(220,38,38,0.05)',
    border: '1px solid rgba(220,38,38,0.15)',
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
