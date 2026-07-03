'use client'

import { useState, Suspense, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  ArrowRight, Eye, EyeSlash, CheckCircle, UserPlus,
  GraduationCap, Calculator, ChatText, UsersThree, Megaphone, ShieldCheck,
  HouseLine, Camera, Sparkle,
} from '@phosphor-icons/react/dist/ssr'
import JmLogo from '@/components/JmLogo'

const PERKS = [
  { icon: GraduationCap, label: 'Formations et guides LCD' },
  { icon: Calculator,    label: 'Simulateurs et outils exclusifs' },
  { icon: ChatText,      label: "Gabarits de messages prêts à l'emploi" },
  { icon: UsersThree,    label: "Communauté d'hôtes Entre Hôtes" },
  { icon: Megaphone,     label: 'Veille et actualités LCD' },
]

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const strength = password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const colors = ['', 'var(--danger)', 'var(--warning)', 'var(--success-1)']
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
  return (
    <Suspense fallback={null}>
      <RegisterEntry />
    </Suspense>
  )
}

/**
 * Etape 0 : selecteur de role. Sans ?role= dans l'URL, on affiche 3 cartes
 * pour orienter l'utilisateur vers le bon flow d'inscription :
 *  - Hote LCD  → formulaire in-app classique (RegisterForm)
 *  - Photographe → redirect vers /annuaires/photographes/inscription
 *  - Menage → redirect vers /annuaires/menage/inscription
 *
 * Les inscriptions photographe/menage passent par le site public parce
 * qu'elles impliquent un paiement Stripe (39,98€/79,98€ / an) + validation
 * fiche — c'est un flow different de l'inscription hote gratuite.
 */
function RegisterEntry() {
  const searchParams = useSearchParams()
  const role = searchParams?.get('role') ?? null
  // Compatibilite : les liens ?ref=USER (invitation) forcent role=host
  const isInvited = !!searchParams?.get('ref')
  if (role === 'host' || isInvited) return <RegisterForm />
  return <RoleChooser />
}

/**
 * Choix du role d'inscription — cartes cliquables. Coherent visuellement
 * avec la page de login (meme brand panel, meme background).
 */
function RoleChooser() {
  // Preconnect vers le site marketing pour warm-up TCP + TLS quand
  // l'utilisateur choisit photographe/menage. Reduit la latence de la
  // premiere requete cross-domain de 200-500ms.
  const roles = [
    {
      key: 'host',
      icon: HouseLine,
      title: 'Hôte LCD',
      desc: 'Je gère 1 ou plusieurs biens en location courte durée. Je veux les outils, formations et la communauté.',
      cta: 'Créer mon compte hôte',
      accent: '#63D683',
      href: '/auth/register?role=host',
      external: false,
      pricing: 'Gratuit à vie',
    },
    {
      key: 'photographe',
      icon: Camera,
      title: 'Photographe LCD',
      desc: "J'accompagne les hôtes en photo/vidéo/drone. Je crée ma fiche dans l'annuaire pour être trouvé.",
      cta: 'Créer ma fiche photographe',
      accent: '#FFD56B',
      href: 'https://jasonmarinho.com/annuaires/photographes/inscription',
      external: true,
      pricing: '39,98 €/an à vie (fondateur) puis 79,98 €/an',
    },
    {
      key: 'menage',
      icon: Sparkle,
      title: 'Équipe ménage',
      desc: 'Je fais du turnover pro pour les hôtes. Je crée ma fiche dans l\'annuaire pour être contacté.',
      cta: 'Créer ma fiche équipe',
      accent: '#93C5FD',
      href: 'https://jasonmarinho.com/annuaires/menage/inscription',
      external: true,
      pricing: '39,98 €/an à vie (fondateur) puis 79,98 €/an',
    },
  ] as const

  return (
    <div data-theme="light" style={rc.wrap}>
      <style>{ROLE_CHOOSER_CSS}</style>
      {/* PERF : preconnect vers jasonmarinho.com (site marketing) pour warm
          up le handshake TCP+TLS avant clic. Reduit la latence de la premiere
          requete cross-domain de ~200-500ms — evite l'impression de "double
          chargement" quand on clique photographe/menage. */}
      <link rel="preconnect" href="https://jasonmarinho.com" crossOrigin="" />
      <link rel="dns-prefetch" href="https://jasonmarinho.com" />
      {/* Bandeau haut */}
      <div style={rc.topBar}>
        <a href="https://jasonmarinho.com" style={rc.brandLogo}>
          <div style={rc.brandLogoIcon}><JmLogo size={20} /></div>
          <span style={rc.brandLogoText}>Jason <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>Marinho</em></span>
        </a>
        <Link href="/auth/login" style={rc.loginLink}>Déjà un compte ? <strong>Se connecter</strong></Link>
      </div>

      <div style={rc.inner} className="fade-up">
        <span style={rc.tag}>Créer un compte</span>
        <h1 style={rc.title}>Qui es-tu <em style={rc.titleEm}>dans le LCD ?</em></h1>
        <p style={rc.sub}>Choisis le profil qui te correspond pour rejoindre le bon espace. Tu pourras cumuler plusieurs profils plus tard depuis ton dashboard.</p>

        <div style={rc.grid} className="role-grid">
          {roles.map(r => {
            const Icon = r.icon
            const inner = (
              <>
                <div style={{ ...rc.cardIco, background: `color-mix(in oklab, ${r.accent} 12%, transparent)`, borderColor: `color-mix(in oklab, ${r.accent} 30%, transparent)`, color: r.accent }}>
                  <Icon size={22} weight="duotone" />
                </div>
                <div style={rc.cardBody}>
                  <h3 style={rc.cardTitle}>{r.title}</h3>
                  <p style={rc.cardDesc}>{r.desc}</p>
                  <div style={rc.cardPricing}>{r.pricing}</div>
                </div>
                <span style={rc.cardCta}>
                  {r.cta} <ArrowRight size={13} weight="bold" />
                </span>
              </>
            )
            // Rendu explicite : <a> pour l'externe (navigation directe
            // browser, pas de tentative de client-side nav ni prefetch de
            // Next.js), <Link> pour l'interne (client-side + prefetch auto).
            if (r.external) {
              return (
                <a
                  key={r.key}
                  href={r.href}
                  style={rc.card}
                  className="role-card"
                  rel="external noopener"
                >
                  {inner}
                </a>
              )
            }
            return (
              <Link
                key={r.key}
                href={r.href}
                style={rc.card}
                className="role-card"
                prefetch
              >
                {inner}
              </Link>
            )
          })}
        </div>

        <div style={rc.trustRow}>
          <ShieldCheck size={13} color="rgba(11,29,15,0.35)" weight="bold" />
          <span style={rc.trustText}>Données sécurisées · RGPD · Aucun partage avec des tiers</span>
        </div>
      </div>
    </div>
  )
}

function RegisterForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isDriingMember, setIsDriingMember] = useState(false)
  const [newsletterConsent, setNewsletterConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  // Honeypot (champ caché qu'un humain ne remplit jamais) + timestamp d'ouverture
  // du form pour détecter les bots ultra-rapides (anti-spam Brevo).
  const [website, setWebsite] = useState('')
  const formLoadedAtRef = useRef<number>(Date.now())

  // Détection d'une invitation (?ref=USERID&from=NAME)
  const searchParams = useSearchParams()
  const inviterRef   = searchParams?.get('ref') ?? null
  const inviterFrom  = searchParams?.get('from') ?? null
  const isInvited    = !!inviterRef

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
        body: JSON.stringify({
          email, password, fullName, isDriingMember, newsletterConsent,
          website, ts: formLoadedAtRef.current,
        }),
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
        {/* Mobile top bar : visible only on small screens */}
        <div className="auth-mobile-bar" style={s.mobileBar}>
          <a href="https://jasonmarinho.com" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
            <div style={s.brandLogoIcon}><JmLogo size={18} /></div>
            <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '16px', fontWeight: 600, color: '#fff' }}>
              Jason <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>Marinho</em>
            </span>
          </a>
        </div>

        <div style={s.formCard} className="fade-up">
          {isInvited && (
            <div style={s.inviteBanner}>
              <div style={s.inviteBannerIcon}>
                <UserPlus size={18} weight="fill" color="#FFD56B" />
              </div>
              <div>
                <p style={s.inviteBannerTitle}>
                  {inviterFrom
                    ? <>👋 <strong>{inviterFrom}</strong> t&apos;invite à rejoindre</>
                    : <>👋 Tu es invité(e) à rejoindre</>
                  }{' '}<em style={{ color: '#004C3F', fontStyle: 'italic' }}>Entre Hôtes</em>
                </p>
                <p style={s.inviteBannerDesc}>
                  La communauté privée des hôtes en location courte durée. Crée ton compte
                  gratuit ci-dessous pour accéder à l&apos;entraide et au partage d&apos;expériences.
                </p>
              </div>
            </div>
          )}

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
                  <span style={s.driingBadge}>Standard inclus</span>
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
                <span style={s.consentNote}> Pas de spam, résiliable en 1 clic.</span>
              </span>
            </label>

            {error && <p style={s.errorBox}>{error}</p>}

            {/* Honeypot anti-bot : champ caché qu'un humain ne remplit jamais */}
            <input
              type="text"
              name="website"
              value={website}
              onChange={e => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{
                position: 'absolute', left: '-9999px', top: '-9999px',
                opacity: 0, pointerEvents: 'none', height: 0, width: 0,
                border: 0, padding: 0,
              }}
            />

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
    animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
  },
  formTitle: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '28px', fontWeight: 400,
    color: '#0B1D0F', letterSpacing: '-0.5px', marginBottom: '8px',
  },
  formSub: {
    fontSize: '14px', color: 'rgba(11,29,15,0.55)',
    marginBottom: '32px', fontWeight: 400, lineHeight: 1.55,
  },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  label: { fontSize: '13px', fontWeight: 600, color: 'rgba(11,29,15,0.65)' },
  eyeBtn: {
    position: 'absolute' as const, right: '12px', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(11,29,15,0.4)', padding: '6px',
    display: 'flex', alignItems: 'center',
    borderRadius: '6px',
    transition: 'color 0.2s, background 0.2s',
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

  // Bandeau invitation (?ref=…)
  inviteBanner: {
    display: 'flex', alignItems: 'flex-start', gap: '12px',
    background: 'linear-gradient(135deg, rgba(255,213,107,0.12), rgba(0,76,63,0.06))',
    border: '1px solid rgba(255,213,107,0.35)',
    borderRadius: '12px',
    padding: '14px 16px',
    marginBottom: '20px',
  },
  inviteBannerIcon: {
    width: '34px', height: '34px', borderRadius: '50%',
    background: 'rgba(255,213,107,0.15)',
    border: '1px solid rgba(255,213,107,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  inviteBannerTitle: {
    fontSize: '14px', color: '#0B1D0F', fontWeight: 500,
    margin: '0 0 4px', lineHeight: 1.4,
  },
  inviteBannerDesc: {
    fontSize: '12px', color: 'rgba(11,29,15,0.55)', lineHeight: 1.55,
    margin: 0,
  },
}

// ─── Styles Role Chooser (etape 0 : choix hote/photo/menage) ──────────────

const ROLE_CHOOSER_CSS = `
  .role-grid { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 900px) { .role-grid { grid-template-columns: 1fr !important; } }
  .role-card {
    transition: transform 0.18s var(--ease-spring, cubic-bezier(0.34,1.56,0.64,1)),
                border-color 0.18s,
                box-shadow 0.18s;
  }
  .role-card:hover {
    transform: translateY(-3px);
    border-color: rgba(0,76,63,0.28) !important;
    box-shadow: 0 12px 32px rgba(0,76,63,0.10);
  }
`

const rc: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100svh',
    background: '#FDFCF9',
    display: 'flex', flexDirection: 'column' as const,
  },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px clamp(20px, 4vw, 40px)',
    background: '#004C3F',
    color: '#fff',
  },
  brandLogo: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' },
  brandLogoIcon: {
    width: 34, height: 34, borderRadius: 10,
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,213,107,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  brandLogoText: { fontFamily: 'var(--font-fraunces), serif', fontSize: 18, fontWeight: 600, color: '#fff' },
  loginLink: { fontSize: 13.5, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' },
  inner: {
    flex: 1,
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center',
    padding: 'clamp(40px, 5vh, 72px) clamp(20px, 4vw, 48px)',
    maxWidth: 1200, width: '100%', margin: '0 auto',
  },
  tag: {
    display: 'inline-block',
    fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    color: '#004C3F',
    background: 'rgba(0,76,63,0.06)',
    border: '1px solid rgba(0,76,63,0.15)',
    borderRadius: 100, padding: '5px 12px',
    marginBottom: 18,
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 400,
    letterSpacing: '-0.03em', lineHeight: 1.15,
    color: '#0B1D0F', margin: 0, marginBottom: 14,
    textAlign: 'center' as const,
  },
  titleEm: { color: '#004C3F', fontStyle: 'italic', fontWeight: 300 },
  sub: {
    fontSize: 15, color: 'rgba(11,29,15,0.6)', lineHeight: 1.65,
    maxWidth: 620, textAlign: 'center' as const,
    margin: '0 0 40px',
  },
  grid: {
    display: 'grid',
    gap: 16,
    width: '100%', maxWidth: 1000,
    marginBottom: 24,
  },
  card: {
    display: 'flex', flexDirection: 'column' as const, gap: 14,
    padding: '26px 22px',
    background: '#fff',
    border: '1px solid rgba(0,76,63,0.12)',
    borderRadius: 16,
    textDecoration: 'none',
    color: '#0B1D0F',
    cursor: 'pointer',
    height: '100%',
  },
  cardIco: {
    width: 46, height: 46, borderRadius: 12,
    border: '1px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 8 },
  cardTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 20, fontWeight: 500, letterSpacing: '-0.01em',
    color: '#0B1D0F', margin: 0,
  },
  cardDesc: {
    fontSize: 13.5, color: 'rgba(11,29,15,0.62)',
    lineHeight: 1.6, margin: 0,
  },
  cardPricing: {
    fontSize: 11.5, fontWeight: 600, letterSpacing: 0.3,
    color: 'rgba(11,29,15,0.55)',
    padding: '5px 10px',
    background: 'rgba(0,76,63,0.05)',
    border: '1px solid rgba(0,76,63,0.10)',
    borderRadius: 8,
    display: 'inline-block',
    width: 'fit-content',
    marginTop: 4,
  },
  cardCta: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 13, fontWeight: 600,
    color: '#004C3F',
    marginTop: 4,
  },
  trustRow: {
    display: 'flex', alignItems: 'center', gap: 7,
    marginTop: 28,
  },
  trustText: { fontSize: 11.5, color: 'rgba(11,29,15,0.4)', letterSpacing: 0.2 },
}
