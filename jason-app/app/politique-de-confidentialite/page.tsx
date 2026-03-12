import Link from 'next/link'
import { ArrowLeft, Waves } from '@phosphor-icons/react/dist/ssr'

export default function PolitiqueConfidentialite() {
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

        <h1 style={styles.title}>Politique de confidentialité</h1>
        <p style={styles.updated}>Dernière mise à jour : mars 2025</p>

        <Section title="1. Responsable du traitement">
          <p>
            Jason Marinho, entrepreneur individuel (SIRET 83289193100012), est responsable du traitement des données personnelles collectées via la plateforme <strong>app.jasonmarinho.com</strong>.
          </p>
          <p>Contact : <a href="mailto:contact@jasonmarinho.com" style={styles.link}>contact@jasonmarinho.com</a></p>
        </Section>

        <Section title="2. Données collectées">
          <p>Lors de la création d'un compte et de l'utilisation de la plateforme, nous collectons :</p>
          <ul>
            <li><strong>Données d'identification :</strong> prénom, nom, adresse email</li>
            <li><strong>Données de connexion :</strong> adresse IP, date et heure de connexion</li>
            <li><strong>Données d'utilisation :</strong> formations suivies, gabarits copiés, progression</li>
            <li><strong>Données de newsletter :</strong> email et consentement (si vous y souscrivez)</li>
          </ul>
        </Section>

        <Section title="3. Finalités du traitement">
          <p>Vos données sont utilisées pour :</p>
          <ul>
            <li>Créer et gérer votre compte membre</li>
            <li>Vous donner accès aux formations, gabarits et ressources</li>
            <li>Vous envoyer des communications relatives à la plateforme</li>
            <li>Vous envoyer la newsletter (uniquement avec votre consentement explicite)</li>
            <li>Améliorer la plateforme et ses fonctionnalités</li>
            <li>Respecter nos obligations légales</li>
          </ul>
        </Section>

        <Section title="4. Base légale">
          <ul>
            <li><strong>Exécution du contrat</strong> : gestion de votre compte et accès aux services</li>
            <li><strong>Consentement</strong> : newsletter et communications marketing</li>
            <li><strong>Intérêt légitime</strong> : amélioration de la plateforme et sécurité</li>
          </ul>
        </Section>

        <Section title="5. Durée de conservation">
          <ul>
            <li><strong>Compte membre :</strong> pendant toute la durée de la relation, puis 3 ans après la dernière activité</li>
            <li><strong>Données de newsletter :</strong> jusqu'au désabonnement</li>
            <li><strong>Logs de connexion :</strong> 12 mois</li>
          </ul>
        </Section>

        <Section title="6. Sous-traitants et transferts">
          <p>Nous faisons appel aux prestataires suivants qui traitent vos données en notre nom :</p>
          <ul>
            <li><strong>Supabase</strong> (authentification et base de données) — données hébergées en Europe (Union Européenne)</li>
            <li><strong>Vercel</strong> (hébergement) — États-Unis, couvert par les clauses contractuelles types de l'UE</li>
          </ul>
        </Section>

        <Section title="7. Vos droits (RGPD)">
          <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
          <ul>
            <li><strong>Droit d'accès</strong> : obtenir une copie de vos données</li>
            <li><strong>Droit de rectification</strong> : corriger des données inexactes</li>
            <li><strong>Droit à l'effacement</strong> : supprimer votre compte et vos données</li>
            <li><strong>Droit d'opposition</strong> : vous opposer au traitement pour des raisons légitimes</li>
            <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
            <li><strong>Droit de retirer votre consentement</strong> à tout moment (newsletter)</li>
          </ul>
          <p>Pour exercer ces droits : <a href="mailto:contact@jasonmarinho.com" style={styles.link}>contact@jasonmarinho.com</a></p>
          <p>Vous pouvez également introduire une réclamation auprès de la <strong>CNIL</strong> : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={styles.link}>cnil.fr</a></p>
        </Section>

        <Section title="8. Cookies">
          <p>
            La plateforme utilise uniquement des cookies techniques strictement nécessaires au fonctionnement du système d'authentification. Ces cookies ne nécessitent pas votre consentement car ils sont indispensables au service.
          </p>
          <p>Aucun cookie publicitaire, de tracking ou d'analyse tiers n'est utilisé.</p>
        </Section>

        <Section title="9. Sécurité">
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : connexions chiffrées (HTTPS/TLS), authentification sécurisée, accès restreint aux données.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>Pour toute question relative à cette politique :</p>
          <p><a href="mailto:contact@jasonmarinho.com" style={styles.link}>contact@jasonmarinho.com</a></p>
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
  title: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 400, color: '#f0f4ff', marginBottom: '8px' },
  updated: { fontSize: '13px', color: 'rgba(240,244,255,0.3)', marginBottom: '8px' },
  link: { color: '#FFD56B', textDecoration: 'none' },
}
