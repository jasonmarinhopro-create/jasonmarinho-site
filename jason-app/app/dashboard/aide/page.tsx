import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import {
  GraduationCap, FileText, Handshake, UsersThree,
  ChatsCircle, ArrowRight, ArrowUpRight, Question, Article, WhatsappLogo,
} from '@phosphor-icons/react/dist/ssr'

const helpCategories = [
  {
    icon: GraduationCap,
    label: 'Mes formations',
    description: 'Accéder à vos formations et suivre votre progression',
    href: '/dashboard/formations',
  },
  {
    icon: FileText,
    label: 'Mes gabarits',
    description: 'Utiliser et personnaliser les gabarits professionnels',
    href: '/dashboard/gabarits',
  },
  {
    icon: Handshake,
    label: 'Offres partenaires',
    description: 'Activer vos avantages exclusifs avec Driing et nos partenaires',
    href: '/dashboard/partenaires',
  },
  {
    icon: UsersThree,
    label: 'La communauté',
    description: "Rejoindre les groupes et échanger avec d'autres hôtes",
    href: '/dashboard/communaute',
  },
]

const faqs = [
  {
    q: 'Comment accéder à mes formations ?',
    a: 'Rendez-vous dans la section "Formations" via le menu latéral. Chaque module est déverrouillé progressivement.',
  },
  {
    q: 'Comment obtenir le code promo Driing ?',
    a: 'Le code promo est affiché directement sur la carte Driing dans la section "Partenaires". Copiez-le et utilisez-le lors de votre inscription.',
  },
  {
    q: 'Je ne reçois pas les emails de confirmation.',
    a: 'Vérifiez votre dossier spam. Si le problème persiste, contactez Jason directement via WhatsApp.',
  },
  {
    q: 'Comment modifier mon abonnement ?',
    a: "Rendez-vous dans \"Changer d'offre\" dans le menu latéral pour voir les plans disponibles et contacter Jason.",
  },
]

export default async function AidePage() {
  const profile = await getProfile()

  return (
    <>
      <Header title="Centre d'aide" userName={profile?.full_name ?? undefined} />

      <div style={styles.page}>
        <div style={styles.intro} className="fade-up">
          <h2 style={styles.pageTitle}>Centre d'<em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>aide</em></h2>
          <p style={styles.pageDesc}>Comment pouvons-nous vous aider ?</p>
        </div>

        {/* Quick links */}
        <div style={styles.section} className="fade-up">
          {helpCategories.map(({ icon: Icon, label, description, href }) => (
            <Link key={href} href={href} style={styles.helpRow} className="dash-help-row">
              <div style={styles.helpIcon}>
                <Icon size={20} color="var(--text-2)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={styles.helpLabel}>{label}</div>
                <div style={styles.helpDesc}>{description}</div>
              </div>
              <ArrowRight size={16} color="var(--text-muted)" />
            </Link>
          ))}
        </div>

        {/* Contact Jason */}
        <div style={styles.contactBox} className="fade-up">
          <div style={styles.contactLeft}>
            <div style={styles.contactAvatar}>JM</div>
            <div>
              <div style={styles.contactName}>Jason Marinho</div>
              <div style={styles.contactRole}>Votre coach · disponible lun–ven, 9h–18h</div>
            </div>
          </div>
          <div style={styles.contactDesc}>
            Une question urgente ou un blocage ? Jason vous répond directement.
          </div>
          <div style={styles.contactActions}>
            <a
              href="https://wa.me/33630212592"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <WhatsappLogo size={16} weight="fill" />
              WhatsApp
            </a>
            <a
              href="mailto:jason@jasonmarinho.com"
              className="btn-ghost"
            >
              <ChatsCircle size={16} />
              Email
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div style={styles.faqSection} className="fade-up">
          <div style={styles.faqTitle}>
            <Question size={18} color="var(--text-3)" />
            Questions fréquentes
          </div>
          <div style={styles.faqList}>
            {faqs.map((item, i) => (
              <div key={i} style={styles.faqItem} className="glass-card">
                <div style={styles.faqQ}>{item.q}</div>
                <div style={styles.faqA}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* More resources */}
        <div style={styles.moreSection} className="fade-up">
          <div style={styles.moreTitle}>Pour aller plus loin</div>
          <a
            href="https://jasonmarinho.com/blog"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.moreRow}
            className="dash-help-row"
          >
            <div style={styles.helpIcon}>
              <Article size={18} color="var(--text-2)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={styles.helpLabel}>Blog & ressources</div>
              <div style={styles.helpDesc}>Conseils et stratégies pour les hôtes professionnels</div>
            </div>
            <ArrowUpRight size={16} color="var(--text-muted)" />
          </a>
        </div>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '860px' },
  intro: { marginBottom: '32px' },
  pageTitle: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: 'var(--text)', marginBottom: '8px',
  },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'var(--text-3)' },

  section: {
    background: 'var(--surface)',
    border: '1px solid var(--surface-2)',
    borderRadius: '16px',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  helpRow: {
    display: 'flex', alignItems: 'center', gap: '16px',
    padding: '18px 20px',
    borderBottom: '1px solid var(--border)',
    textDecoration: 'none',
    transition: 'background 0.18s',
    cursor: 'pointer',
  },
  helpIcon: {
    width: '40px', height: '40px', flexShrink: 0,
    background: 'var(--border)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  helpLabel: { fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '3px' },
  helpDesc: { fontSize: '12px', fontWeight: 300, color: 'var(--text-3)' },

  /* Contact box */
  contactBox: {
    background: 'linear-gradient(135deg, rgba(0,76,63,0.4) 0%, rgba(0,51,42,0.25) 100%)',
    border: '1px solid rgba(255,213,107,0.15)',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap',
    marginBottom: '24px',
  },
  contactLeft: { display: 'flex', alignItems: 'center', gap: '14px', minWidth: '180px' },
  contactAvatar: {
    width: '44px', height: '44px', borderRadius: '50%',
    background: 'rgba(255,213,107,0.15)',
    border: '2px solid rgba(255,213,107,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: 600, color: 'var(--accent-text)', flexShrink: 0,
  },
  contactName: { fontSize: '15px', fontWeight: 600, color: 'var(--text)' },
  contactRole: { fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' },
  contactDesc: {
    flex: 1, fontSize: '14px', fontWeight: 300,
    color: 'var(--text-2)', lineHeight: 1.6, minWidth: '200px',
  },
  contactActions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },

  /* FAQ */
  faqSection: { marginBottom: '24px' },
  faqTitle: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '13px', fontWeight: 500, color: 'var(--text-3)',
    letterSpacing: '0.4px', textTransform: 'uppercase',
    marginBottom: '14px',
  },
  faqList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  faqItem: { padding: '18px 20px', borderRadius: '12px' },
  faqQ: { fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' },
  faqA: { fontSize: '13px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.65 },

  /* More */
  moreSection: {},
  moreTitle: {
    fontSize: '13px', fontWeight: 500, color: 'var(--text-3)',
    letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: '12px',
  },
  moreRow: {
    display: 'flex', alignItems: 'center', gap: '16px',
    padding: '16px 20px',
    background: 'var(--surface)',
    border: '1px solid var(--surface-2)',
    borderRadius: '12px',
    textDecoration: 'none', cursor: 'pointer',
    transition: 'background 0.18s',
  },
}
