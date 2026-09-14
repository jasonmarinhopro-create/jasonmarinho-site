import Link from 'next/link'
import { Waves, Compass, ArrowLeft } from '@phosphor-icons/react/dist/ssr'

export default function NotFound() {
  return (
    <div style={styles.page}>
      <div style={styles.bg1} />
      <div style={styles.bg2} />
      <div style={styles.bg3} />

      <div style={styles.card} className="fade-up">
        {/* Icône animée */}
        <div style={styles.iconWrap}>
          <Compass size={52} color="var(--accent-text)" weight="thin" />
        </div>

        <p style={styles.code}>4 0 4</p>
        <h1 style={styles.title}>
          Vous êtes <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>perdus en mer</em>
        </h1>
        <p style={styles.desc}>
          Cette page a été emportée par les vagues. Le cap que vous cherchez n'existe pas (ou n'existe plus).
        </p>

        <div style={styles.waves}>
          <Waves size={20} color="var(--accent-border-2)" />
          <Waves size={20} color="var(--accent-border)" />
          <Waves size={20} color="var(--accent-bg-2)" />
        </div>

        <Link href="/dashboard" className="btn-primary" style={styles.btn}>
          <ArrowLeft size={16} weight="bold" />
          Regagner le port
        </Link>

        <p style={styles.hint}>
          ou <Link href="/auth/login" style={styles.link}>se connecter</Link>
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
    background: 'var(--bg)',
  },
  bg1: {
    position: 'fixed', top: '-15%', left: '50%', transform: 'translateX(-50%)',
    width: '700px', height: '700px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,76,63,0.18) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  bg2: {
    position: 'fixed', bottom: '-20%', right: '-10%',
    width: '500px', height: '500px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,213,107,0.05) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  bg3: {
    position: 'fixed', top: '30%', left: '-10%',
    width: '400px', height: '400px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,90,74,0.1) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  card: {
    textAlign: 'center', position: 'relative', zIndex: 2,
    maxWidth: '460px', width: '100%',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
  },
  iconWrap: {
    width: '80px', height: '80px', borderRadius: '20px',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '8px',
  },
  code: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '72px', fontWeight: 300,
    color: 'var(--text-muted)', letterSpacing: '12px', lineHeight: 1,
    marginBottom: '-16px',
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px, 4vw, 36px)',
    fontWeight: 400, color: 'var(--text)', lineHeight: 1.25,
  },
  desc: {
    fontSize: '15px', fontWeight: 300,
    color: 'var(--text-2)',
    lineHeight: 1.65, maxWidth: '360px',
  },
  waves: {
    display: 'flex', gap: '6px', alignItems: 'center',
    margin: '8px 0',
  },
  btn: { marginTop: '12px' },
  hint: {
    fontSize: '13px', color: 'var(--text-muted)',
  },
  link: { color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 500 },
}
