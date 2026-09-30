import type { Metadata } from 'next'
import Link from 'next/link'
import InstallGuide from '@/components/pwa/InstallGuide'

// Page publique (hors connexion) : lien à partager aux hôtes, QR code depuis un
// ordinateur, bouton « Installer l'app » du menu, de la connexion et du site.
export const metadata: Metadata = {
  title: 'Installer l\'app, Jason Marinho',
  description: 'Installe ton espace Jason Marinho comme une app sur ton téléphone, en quelques secondes.',
}

export default function InstallerPage() {
  return (
    <main style={s.page}>
      <div style={s.wrap}>
        <Link href="/dashboard" style={s.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="" width={40} height={40} style={s.logo} />
          <span>Jason Marinho</span>
        </Link>

        <header style={s.head}>
          <div style={s.eyebrow}>Application mobile</div>
          <h1 style={s.title}>Installe l&apos;app sur ton <em style={s.em}>téléphone</em></h1>
          <p style={s.desc}>
            Une icône sur ton écran d&apos;accueil, qui s&apos;ouvre en plein écran comme une vraie app : ton calendrier,
            tes arrivées et tes contrats sous la main, et les notifications quand une réservation arrive. Gratuit, rien à
            télécharger sur un store, 30 secondes.
          </p>
        </header>

        <InstallGuide />

        <p style={s.foot}>
          Besoin d&apos;aide ? Écris à <a href="mailto:contact@jasonmarinho.com" style={s.footLink}>contact@jasonmarinho.com</a>.{' '}
          <Link href="/dashboard" style={s.footLink}>Aller à mon espace</Link>
        </p>
      </div>
    </main>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100svh', background: 'radial-gradient(1200px 500px at 50% -10%, color-mix(in srgb, var(--accent-text) 12%, transparent), transparent), var(--bg)', padding: '24px 16px calc(40px + env(safe-area-inset-bottom))' },
  wrap: { maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 },
  brand: { display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--text)', textDecoration: 'none', fontFamily: 'var(--font-fraunces), serif', fontSize: 18, alignSelf: 'flex-start' },
  logo: { width: 40, height: 40, borderRadius: 11 },
  head: { display: 'flex', flexDirection: 'column', gap: 10 },
  eyebrow: { fontSize: 12, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--accent-text)' },
  title: { fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 'clamp(28px, 6vw, 40px)', lineHeight: 1.12, color: 'var(--text)', margin: 0 },
  em: { fontStyle: 'italic', color: 'var(--accent-text)' },
  desc: { fontSize: 15.5, lineHeight: 1.6, color: 'var(--text-2)', margin: 0, maxWidth: 620 },
  foot: { fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, textAlign: 'center', margin: 0 },
  footLink: { color: 'var(--accent-text)', fontWeight: 600 },
}
