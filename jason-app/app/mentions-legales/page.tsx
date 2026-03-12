import Link from 'next/link'
import { ArrowLeft, Waves } from '@phosphor-icons/react/dist/ssr'

export default function MentionsLegales() {
  return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.container} className="fade-up">

        <Link href="/" style={styles.back}>
          <ArrowLeft size={15} /> Retour
        </Link>

        <div style={styles.header}>
          <div style={styles.logoIcon}><Waves size={20} color="#FFD56B" weight="bold" /></div>
          <span style={styles.logoText}>Jason <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>Marinho</em></span>
        </div>

        <h1 style={styles.title}>Mentions légales</h1>
        <p style={styles.updated}>Dernière mise à jour : mars 2025</p>

        <Section title="Éditeur du site">
          <p>Le site <strong>app.jasonmarinho.com</strong> est édité par :</p>
          <ul>
            <li><strong>Nom :</strong> Jason Marinho</li>
            <li><strong>Statut :</strong> Entrepreneur individuel</li>
            <li><strong>SIRET :</strong> 83289193100012</li>
            <li><strong>SIREN :</strong> 832 891 931</li>
            <li><strong>Adresse :</strong> Paris, 75015, France</li>
            <li><strong>Email :</strong> contact@jasonmarinho.com</li>
          </ul>
        </Section>

        <Section title="Directeur de la publication">
          <p>Jason Marinho</p>
        </Section>

        <Section title="Hébergement">
          <ul>
            <li><strong>Hébergeur :</strong> Vercel Inc.</li>
            <li><strong>Adresse :</strong> 440 N Barranca Ave #4133, Covina, CA 91723, USA</li>
            <li><strong>Site :</strong> vercel.com</li>
          </ul>
        </Section>

        <Section title="Propriété intellectuelle">
          <p>
            L'ensemble du contenu de ce site (textes, images, vidéos, formations, gabarits) est la propriété exclusive de Jason Marinho, sauf mention contraire. Toute reproduction, distribution ou utilisation sans autorisation écrite préalable est interdite.
          </p>
        </Section>

        <Section title="Données personnelles">
          <p>
            Les informations collectées font l'objet d'un traitement informatique destiné à la gestion des comptes membres et à l'envoi de communications. Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour l'exercer : <a href="mailto:contact@jasonmarinho.com" style={styles.link}>contact@jasonmarinho.com</a>
          </p>
          <p>Pour plus d'informations, consultez notre <Link href="/politique-de-confidentialite" style={styles.link}>Politique de confidentialité</Link>.</p>
        </Section>

        <Section title="Cookies">
          <p>
            Ce site utilise des cookies strictement nécessaires au fonctionnement du service d'authentification (Supabase). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
          </p>
        </Section>

        <Section title="Droit applicable">
          <p>Les présentes mentions légales sont soumises au droit français. Tout litige sera de la compétence exclusive des tribunaux français.</p>
        </Section>

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={sectionStyles.wrap}>
      <h2 style={sectionStyles.title}>{title}</h2>
      <div style={sectionStyles.content}>{children}</div>
    </section>
  )
}

const sectionStyles: Record<string, React.CSSProperties> = {
  wrap: {
    borderTop: '1px solid rgba(255,255,255,0.07)',
    paddingTop: '28px', marginTop: '28px',
  },
  title: {
    fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 400,
    color: '#f0f4ff', marginBottom: '14px',
  },
  content: {
    fontSize: '14px', fontWeight: 300, color: 'rgba(240,244,255,0.6)',
    lineHeight: 1.75, display: 'flex', flexDirection: 'column', gap: '10px',
  },
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100svh', background: 'var(--bg)',
    padding: '40px 16px 80px', position: 'relative',
  },
  bg: {
    position: 'fixed', top: 0, left: 0, right: 0, height: '300px',
    background: 'radial-gradient(ellipse at 50% -20%, rgba(0,76,63,0.2) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  container: {
    maxWidth: '720px', margin: '0 auto', position: 'relative', zIndex: 2,
  },
  back: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', color: 'rgba(240,244,255,0.4)', textDecoration: 'none',
    marginBottom: '32px', transition: 'color 0.2s',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px',
  },
  logoIcon: {
    width: '32px', height: '32px', borderRadius: '9px',
    background: 'rgba(0,76,63,0.5)', border: '1px solid rgba(255,213,107,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 600, color: '#f0f4ff' },
  title: {
    fontFamily: 'Fraunces, serif', fontSize: 'clamp(28px,4vw,40px)',
    fontWeight: 400, color: '#f0f4ff', marginBottom: '8px',
  },
  updated: { fontSize: '13px', color: 'rgba(240,244,255,0.3)', marginBottom: '8px' },
  link: { color: '#FFD56B', textDecoration: 'none' },
}
