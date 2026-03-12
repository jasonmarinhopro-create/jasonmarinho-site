import Link from 'next/link'
import { ArrowLeft, Waves } from '@phosphor-icons/react/dist/ssr'

export default function CGV() {
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

        <h1 style={styles.title}>Conditions Générales de Vente & d'Utilisation</h1>
        <p style={styles.updated}>Dernière mise à jour : mars 2025</p>

        <Section title="1. Objet et acceptation">
          <p>
            Les présentes Conditions Générales de Vente et d'Utilisation (ci-après «&nbsp;CGV/CGU&nbsp;») régissent l'accès et l'utilisation de la plateforme <strong>app.jasonmarinho.com</strong>, éditée par Jason Marinho (SIRET 83289193100012).
          </p>
          <p>
            Toute inscription sur la plateforme vaut acceptation sans réserve des présentes conditions. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser la plateforme.
          </p>
        </Section>

        <Section title="2. Description des services">
          <p>La plateforme donne accès aux services suivants :</p>
          <ul>
            <li><strong>Formations</strong> : contenus vidéo et texte pour optimiser votre activité de location courte durée (LCD)</li>
            <li><strong>Gabarits</strong> : modèles de messages prêts à l'emploi pour la gestion de vos séjours</li>
            <li><strong>Partenaires</strong> : accès à des offres exclusives avec des prestataires sélectionnés</li>
            <li><strong>Communauté</strong> : accès à des groupes et ressources communautaires</li>
          </ul>
        </Section>

        <Section title="3. Inscription et compte">
          <p>L'accès à la plateforme nécessite la création d'un compte. Vous vous engagez à :</p>
          <ul>
            <li>Fournir des informations exactes lors de l'inscription</li>
            <li>Maintenir la confidentialité de vos identifiants</li>
            <li>Ne pas partager votre accès avec des tiers</li>
            <li>Nous notifier immédiatement en cas d'utilisation non autorisée de votre compte</li>
          </ul>
          <p>Jason Marinho se réserve le droit de suspendre ou supprimer tout compte en cas de non-respect des présentes conditions.</p>
        </Section>

        <Section title="4. Tarification et paiement">
          <p>
            Les tarifs des accès payants sont indiqués sur la plateforme lors de la souscription. Tout paiement effectué est définitif et non remboursable sauf disposition légale contraire.
          </p>
          <p>
            Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation de 14 jours ne s'applique pas aux contenus numériques fournis immédiatement après l'achat, si vous avez expressément renoncé à votre droit de rétractation.
          </p>
        </Section>

        <Section title="5. Propriété intellectuelle">
          <p>
            L'ensemble des contenus de la plateforme (formations, textes, gabarits, images, vidéos) sont protégés par le droit d'auteur et appartiennent exclusivement à Jason Marinho.
          </p>
          <p>
            Toute reproduction, diffusion, revente ou exploitation commerciale des contenus sans autorisation écrite préalable est strictement interdite et constitue une contrefaçon.
          </p>
          <p>
            L'accès aux contenus est accordé à titre personnel et non cessible.
          </p>
        </Section>

        <Section title="6. Obligations de l'utilisateur">
          <p>En utilisant la plateforme, vous vous engagez à ne pas :</p>
          <ul>
            <li>Utiliser la plateforme à des fins illicites</li>
            <li>Partager ou revendre l'accès aux contenus</li>
            <li>Tenter de compromettre la sécurité de la plateforme</li>
            <li>Publier des contenus offensants, diffamatoires ou illégaux</li>
            <li>Utiliser des systèmes automatisés pour accéder à la plateforme</li>
          </ul>
        </Section>

        <Section title="7. Responsabilité">
          <p>
            Jason Marinho s'engage à fournir un service de qualité mais ne peut garantir l'absence d'interruptions techniques. La plateforme est fournie «&nbsp;en l'état&nbsp;» sans garantie de résultats financiers.
          </p>
          <p>
            Les résultats obtenus dans votre activité de location courte durée dépendent de nombreux facteurs indépendants de notre volonté. Jason Marinho ne pourra être tenu responsable des résultats obtenus par les membres.
          </p>
        </Section>

        <Section title="8. Modification des conditions">
          <p>
            Jason Marinho se réserve le droit de modifier les présentes CGV/CGU à tout moment. Les modifications entrent en vigueur dès leur publication sur la plateforme. L'utilisation continue de la plateforme après modification vaut acceptation des nouvelles conditions.
          </p>
        </Section>

        <Section title="9. Résiliation">
          <p>
            Vous pouvez résilier votre compte à tout moment en envoyant un email à <a href="mailto:contact@jasonmarinho.com" style={styles.link}>contact@jasonmarinho.com</a>. La résiliation entraîne la suppression de votre accès aux contenus.
          </p>
        </Section>

        <Section title="10. Droit applicable et juridiction">
          <p>
            Les présentes CGV/CGU sont régies par le droit français. Tout litige relatif à leur interprétation ou exécution sera soumis aux tribunaux compétents de Paris, après tentative de résolution amiable.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>Pour toute question relative aux présentes conditions :</p>
          <p><a href="mailto:contact@jasonmarinho.com" style={styles.link}>contact@jasonmarinho.com</a></p>
        </Section>

        <div style={styles.links}>
          <Link href="/mentions-legales" style={styles.link}>Mentions légales</Link>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
          <Link href="/politique-de-confidentialite" style={styles.link}>Politique de confidentialité</Link>
        </div>

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
  wrap: { borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '28px', marginTop: '28px' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 400, color: '#f0f4ff', marginBottom: '14px' },
  content: { fontSize: '14px', fontWeight: 300, color: 'rgba(240,244,255,0.6)', lineHeight: 1.75, display: 'flex', flexDirection: 'column', gap: '10px' },
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100svh', background: 'var(--bg)', padding: '40px 16px 80px', position: 'relative' },
  bg: {
    position: 'fixed', top: 0, left: 0, right: 0, height: '300px',
    background: 'radial-gradient(ellipse at 50% -20%, rgba(0,76,63,0.2) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  container: { maxWidth: '720px', margin: '0 auto', position: 'relative', zIndex: 2 },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(240,244,255,0.4)', textDecoration: 'none', marginBottom: '32px' },
  header: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' },
  logoIcon: { width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(0,76,63,0.5)', border: '1px solid rgba(255,213,107,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 600, color: '#f0f4ff' },
  title: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(24px,4vw,36px)', fontWeight: 400, color: '#f0f4ff', marginBottom: '8px' },
  updated: { fontSize: '13px', color: 'rgba(240,244,255,0.3)', marginBottom: '8px' },
  link: { color: '#FFD56B', textDecoration: 'none' },
  links: { display: 'flex', gap: '16px', alignItems: 'center', marginTop: '48px', paddingTop: '28px', borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: '13px' },
}
