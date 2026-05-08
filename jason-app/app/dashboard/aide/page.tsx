import Link from 'next/link'
import {
  MagnifyingGlass, ArrowRight, ArrowUpRight, WhatsappLogo, ChatsCircle,
  BookOpen, Sparkle,
} from '@phosphor-icons/react/dist/ssr'
import { HELP_CATEGORIES, getCategory } from '@/lib/help/categories'
import { listAllArticles } from '@/lib/help/loader'

export const metadata = { title: 'Centre d\'aide, Jason Marinho' }

export default async function AidePage() {
  // Articles populaires : on prend les top 5 selon `order` dans le frontmatter
  const popularArticles = listAllArticles()
    .filter(a => (a.order ?? 999) <= 3)
    .slice(0, 5)

  return (
    <div style={s.page} className="aide-no-fade">

      {/* Hero + recherche */}
      <div style={s.hero}>
        <h1 style={s.heroTitle}>
          Comment <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>t'aider</em> ?
        </h1>
        <p style={s.heroSub}>
          Trouve ta réponse en 30 secondes. Recherche un mot-clé ou explore par thème.
        </p>

        <Link href="/dashboard/aide/recherche" style={s.searchTrigger}>
          <MagnifyingGlass size={16} weight="bold" />
          <span style={s.searchPlaceholder}>Rechercher dans l'aide…</span>
          <span style={s.searchKbd}>↵</span>
        </Link>
      </div>

      {/* Catégories */}
      <div style={s.categoriesGrid}>
        {HELP_CATEGORIES.map(cat => (
          <Link
            key={cat.slug}
            href={`/dashboard/aide/${cat.slug}`}
            style={s.categoryCard}
            className="aide-cat-card"
          >
            <div style={{ ...s.categoryIcon, background: cat.bg, color: cat.color }}>
              <cat.Icon size={22} weight="fill" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={s.categoryTitle}>{cat.title}</div>
              <div style={s.categoryDesc}>{cat.description}</div>
            </div>
            <ArrowRight size={15} weight="bold" style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          </Link>
        ))}
      </div>

      {/* Articles populaires */}
      {popularArticles.length > 0 && (
        <section style={s.popularSection}>
          <div style={s.sectionHeader}>
            <Sparkle size={14} weight="fill" style={{ color: 'var(--accent-text)' }} />
            <span style={s.sectionLabel}>Les essentiels pour démarrer</span>
          </div>
          <div style={s.popularList}>
            {popularArticles.map(article => {
              const cat = getCategory(article.category)
              return (
                <Link
                  key={`${article.category}-${article.slug}`}
                  href={`/dashboard/aide/${article.category}/${article.slug}`}
                  style={s.popularItem}
                  className="aide-article-card"
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.popularTitle}>{article.title}</div>
                    {cat && (
                      <div style={{ ...s.popularCat, color: cat.color }}>
                        {cat.title}
                      </div>
                    )}
                  </div>
                  <ArrowRight size={13} weight="bold" style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Contact direct */}
      <section style={s.contactBox} className="glass-card">
        <div style={s.contactLeft}>
          <div style={s.contactAvatar}>JM</div>
          <div>
            <div style={s.contactName}>Jason Marinho</div>
            <div style={s.contactRole}>Disponible lun–ven, 9h–18h</div>
          </div>
        </div>
        <div style={s.contactDesc}>
          Tu n'as pas trouvé ? Écris-moi directement, je te réponds dans la journée.
        </div>
        <div style={s.contactActions}>
          <a
            href="https://wa.me/33630212592"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ fontSize: '13px', padding: '10px 16px' }}
          >
            <WhatsappLogo size={15} weight="fill" />
            WhatsApp
          </a>
          <a
            href="mailto:jason@jasonmarinho.com"
            className="btn-ghost"
            style={{ fontSize: '13px', padding: '10px 16px' }}
          >
            <ChatsCircle size={15} />
            Email
          </a>
        </div>
      </section>

      {/* Liens secondaires */}
      <section style={s.linksRow}>
        <Link href="/dashboard/formations" style={s.secondaryLink}>
          <BookOpen size={15} />
          <span>Voir les formations</span>
          <ArrowRight size={12} weight="bold" />
        </Link>
        <a
          href="https://jasonmarinho.com/blog"
          target="_blank"
          rel="noopener noreferrer"
          style={s.secondaryLink}
        >
          <BookOpen size={15} />
          <span>Blog jasonmarinho.com</span>
          <ArrowUpRight size={12} weight="bold" />
        </a>
      </section>

    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: 'clamp(20px,3vw,44px)',
    width: '100%',
  },

  /* Hero */
  hero: { marginBottom: '32px' },
  heroTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(28px,3.4vw,42px)',
    fontWeight: 400,
    color: 'var(--text)',
    lineHeight: 1.15,
    marginBottom: '10px',
    letterSpacing: '-0.5px',
  },
  heroSub: {
    fontSize: '15px',
    fontWeight: 300,
    color: 'var(--text-2)',
    lineHeight: 1.65,
    marginBottom: '24px',
    maxWidth: '500px',
  },

  /* Search trigger (looks like input, opens search page) */
  searchTrigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    maxWidth: '560px',
    padding: '14px 18px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    color: 'var(--text-3)',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'border-color 0.15s, transform 0.15s',
  },
  searchPlaceholder: { flex: 1, fontSize: '14px', fontWeight: 300 },
  searchKbd: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--text-3)',
    background: 'var(--surface-2)',
    padding: '3px 7px',
    borderRadius: '6px',
    border: '1px solid var(--border)',
  },

  /* Categories grid */
  categoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '12px',
    marginBottom: '36px',
  },
  categoryCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '18px 20px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'border-color 0.15s, transform 0.15s',
  },
  categoryIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '16px',
    fontWeight: 400,
    color: 'var(--text)',
    marginBottom: '3px',
    lineHeight: 1.3,
  },
  categoryDesc: {
    fontSize: '12.5px',
    fontWeight: 300,
    color: 'var(--text-3)',
    lineHeight: 1.5,
  },

  /* Popular section */
  popularSection: { marginBottom: '32px' },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    marginBottom: '14px',
  },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-3)',
    letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
  },
  popularList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  popularItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    textDecoration: 'none',
    transition: 'border-color 0.15s',
  },
  popularTitle: {
    fontSize: '13px',
    fontWeight: 400,
    color: 'var(--text)',
    marginBottom: '2px',
  },
  popularCat: {
    fontSize: '11px',
    fontWeight: 500,
  },

  /* Contact box */
  contactBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '20px 22px',
    borderRadius: '16px',
    flexWrap: 'wrap',
    marginBottom: '24px',
  },
  contactLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: '180px',
  },
  contactAvatar: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    background: 'rgba(255,213,107,0.12)',
    border: '1.5px solid rgba(255,213,107,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--accent-text)',
    flexShrink: 0,
  },
  contactName: { fontSize: '14px', fontWeight: 500, color: 'var(--text)' },
  contactRole: { fontSize: '11.5px', color: 'var(--text-3)', marginTop: '2px' },
  contactDesc: {
    flex: 1,
    fontSize: '13px',
    fontWeight: 300,
    color: 'var(--text-2)',
    lineHeight: 1.6,
    minWidth: '180px',
  },
  contactActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },

  /* Secondary links */
  linksRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  secondaryLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 14px',
    fontSize: '12.5px',
    fontWeight: 400,
    color: 'var(--text-2)',
    textDecoration: 'none',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    transition: 'border-color 0.15s',
  },
}
