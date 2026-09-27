import Link from 'next/link'
import {
  MagnifyingGlass, ArrowRight, ArrowUpRight, WhatsappLogo, ChatsCircle,
  Heart, Star, Lifebuoy, ChatCircleDots, CaretRight, EnvelopeSimple,
} from '@phosphor-icons/react/dist/ssr'
import { HELP_CATEGORIES } from '@/lib/help/categories'
import { listArticlesByCategory, getArticle } from '@/lib/help/loader'
import HubHero, { HeroEm, heroCard } from '@/components/dashboard/HubHero'
import InlineStyle from '@/components/ui/InlineStyle'

export const metadata = { title: 'Centre d\'aide, Jason Marinho' }

// Centre d'aide (refonte sept. 2026). Articles réécrits à partir du code
// (content/help/**), catégories alignées sur le menu actuel. Chaque carte de
// catégorie liste directement ses articles : un clic de moins. Colonne de
// droite (≥ 1200 px) : contact direct, Questions & réponses, « Tu aimes l'app ? ».

// Questions les plus fréquentes, en tête de page
const TOP: [category: string, slug: string][] = [
  ['logements-voyageurs', 'synchroniser-airbnb-ical'],
  ['contrats-paiements', 'generer-contrat-signature-electronique'],
  ['contrats-paiements', 'encaisser-loyer-caution'],
  ['menage-declarations', 'planning-menage'],
  ['menage-declarations', 'declarations-voyageurs'],
]

const CSS = `
.aide-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; align-items: start; }
.aide-side { display: flex; flex-direction: column; gap: 16px; }
@media (min-width: 1200px) {
  .aide-layout { grid-template-columns: minmax(0, 1fr) 340px; }
  .aide-side { position: sticky; top: 20px; }
}
.aide-link:hover { color: var(--accent-text) !important; }
`

export default async function AidePage() {
  const categories = HELP_CATEGORIES
    .map(cat => ({ cat, articles: listArticlesByCategory(cat.slug) }))
    .filter(c => c.articles.length > 0)
  const total = categories.reduce((n, c) => n + c.articles.length, 0)
  const top = TOP
    .map(([c, slug]) => getArticle(c, slug))
    .filter((a): a is NonNullable<typeof a> => a !== null)

  return (
    <div style={s.page} className="aide-no-fade">
      <InlineStyle css={CSS} />

      <HubHero
        eyebrowIcon={<Lifebuoy size={13} weight="fill" />}
        eyebrow="Centre d'aide"
        title={<>Comment <HeroEm>t&apos;aider</HeroEm> ?</>}
        desc={`${total} articles pour utiliser l'app au quotidien, écrits à partir de l'app telle qu'elle est aujourd'hui. Cherche un mot-clé ou choisis un thème.`}
        aside={top.length > 0 ? (
          <div style={heroCard}>
            <span style={s.quickTitle}>Les plus consultés</span>
            {top.map(a => (
              <Link key={a.slug} href={`/dashboard/aide/${a.category}/${a.slug}`} style={s.quickLink}>
                <span>{a.title}</span>
                <CaretRight size={13} weight="bold" style={{ flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        ) : undefined}
      >
        <Link href="/dashboard/aide/recherche" style={s.searchTrigger}>
          <MagnifyingGlass size={16} weight="bold" />
          <span style={{ flex: 1 }}>Rechercher dans l&apos;aide, ex. caution, iCal, facture…</span>
          <ArrowRight size={14} weight="bold" />
        </Link>
      </HubHero>

      <div className="aide-layout">
        {/* Thèmes, avec leurs articles */}
        <div style={s.catGrid}>
          {categories.map(({ cat, articles }) => (
            <section key={cat.slug} style={s.catCard}>
              <Link href={`/dashboard/aide/${cat.slug}`} style={s.catHead} className="aide-link">
                <span style={{ ...s.catIcon, background: cat.bg, color: cat.color }}>
                  <cat.Icon size={20} weight="fill" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={s.catTitle}>{cat.title}</span>
                  <span style={s.catDesc}>{cat.description}</span>
                </span>
              </Link>
              <ul style={s.articleList}>
                {articles.map(a => (
                  <li key={a.slug}>
                    <Link href={`/dashboard/aide/${cat.slug}/${a.slug}`} style={s.articleLink} className="aide-link">
                      <span style={{ flex: 1, minWidth: 0 }}>{a.title}</span>
                      <CaretRight size={12} weight="bold" style={{ flexShrink: 0, color: 'var(--text-3)' }} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <aside className="aide-side">
          {/* Contact direct */}
          <section style={s.sideCard}>
            <div style={s.contactHead}>
              <div style={s.contactAvatar}>JM</div>
              <div>
                <div style={s.sideTitle}>Tu n&apos;as pas trouvé ?</div>
                <div style={s.sideMeta}>Jason, du lundi au vendredi, 9 h à 18 h</div>
              </div>
            </div>
            <p style={s.sideDesc}>Un blocage ou un bug : écris-moi directement, je te réponds dans la journée.</p>
            <div style={s.btnRow}>
              <a href="https://wa.me/33630212592" target="_blank" rel="noopener noreferrer" style={s.btnPrimary}>
                <WhatsappLogo size={15} weight="fill" /> WhatsApp
              </a>
              <a href="mailto:jason@jasonmarinho.com" style={s.btnGhost}>
                <EnvelopeSimple size={15} /> Email
              </a>
            </div>
          </section>

          {/* Questions & réponses */}
          <section style={s.sideCard}>
            <div style={s.sideTitleRow}><ChatCircleDots size={16} weight="fill" style={{ color: 'var(--accent-text)' }} /> Une question de métier ?</div>
            <p style={s.sideDesc}>Fiscalité, règles, voyageurs, prix : pose-la dans Questions &amp; réponses, Jason ou un hôte te répond sous 48 h.</p>
            <Link href="/dashboard/entre-hotes/forum?ask=1" style={s.sideLink}>
              <ChatsCircle size={14} weight="bold" /> Poser ma question
            </Link>
          </section>

          {/* Tu aimes l'app ? (sortis du menu du compte, sept. 2026) */}
          <section style={{ ...s.sideCard, background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
            <div style={s.sideTitleRow}><Heart size={16} weight="fill" style={{ color: 'var(--accent-text)' }} /> Tu aimes l&apos;app ?</div>
            <p style={s.sideDesc}>Un avis Google aide d&apos;autres hôtes à la trouver. Pour aller plus loin, tu peux soutenir le projet en devenant contributeur.</p>
            <div style={s.btnRow}>
              <a href="https://g.page/r/CcLzE7IbhS5_EAE/review" target="_blank" rel="noopener noreferrer" style={s.btnPrimary}>
                <Star size={15} weight="fill" /> Laisser un avis
              </a>
              <Link href="/dashboard/contributeurs" style={s.btnGhost}>Devenir contributeur</Link>
            </div>
          </section>

          {/* Pour aller plus loin */}
          <nav style={s.moreLinks} aria-label="Pour aller plus loin">
            <Link href="/dashboard/apprendre/formations" style={s.moreLink} className="aide-link">Formations <ArrowRight size={12} weight="bold" /></Link>
            <Link href="/dashboard/apprendre/guide" style={s.moreLink} className="aide-link">Guide LCD <ArrowRight size={12} weight="bold" /></Link>
            <a href="https://jasonmarinho.com/blog" target="_blank" rel="noopener noreferrer" style={s.moreLink} className="aide-link">Blog <ArrowUpRight size={12} weight="bold" /></a>
            <a href="https://jasonmarinho.com" target="_blank" rel="noopener noreferrer" style={s.moreLink} className="aide-link">jasonmarinho.com <ArrowUpRight size={12} weight="bold" /></a>
          </nav>
        </aside>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' },

  quickTitle: { fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '2px' },
  quickLink: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
    fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', textDecoration: 'none',
    padding: '8px 0', borderTop: '1px solid var(--border)',
  },

  searchTrigger: {
    display: 'flex', alignItems: 'center', gap: '12px', width: '100%', maxWidth: '560px', marginTop: '18px',
    padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--accent-border)', borderRadius: '14px',
    color: 'var(--text-3)', fontSize: '14px', textDecoration: 'none',
  },

  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '16px', alignItems: 'start' },
  catCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' },
  catHead: { display: 'flex', alignItems: 'flex-start', gap: '12px', textDecoration: 'none', color: 'var(--text)' },
  catIcon: { width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  catTitle: { display: 'block', fontFamily: 'var(--font-fraunces), serif', fontSize: '17px', fontWeight: 400, lineHeight: 1.3, marginBottom: '3px' },
  catDesc: { display: 'block', fontSize: '12.5px', color: 'var(--text-3)', lineHeight: 1.5 },
  articleList: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' },
  articleLink: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderTop: '1px solid var(--border)',
    fontSize: '13.5px', color: 'var(--text-2)', textDecoration: 'none', lineHeight: 1.45,
  },

  sideCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' },
  contactHead: { display: 'flex', alignItems: 'center', gap: '12px' },
  contactAvatar: {
    width: '42px', height: '42px', borderRadius: '50%', background: 'var(--accent-bg)', border: '1.5px solid var(--accent-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'var(--accent-text)', flexShrink: 0,
  },
  sideTitle: { fontSize: '15px', fontWeight: 700, color: 'var(--text)' },
  sideTitleRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: 'var(--text)' },
  sideMeta: { fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' },
  sideDesc: { fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55, margin: 0 },
  btnRow: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 16px', borderRadius: '11px',
    background: 'var(--accent-text)', color: 'var(--bg)', fontSize: '13px', fontWeight: 700, textDecoration: 'none',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 16px', borderRadius: '11px',
    background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
  },
  sideLink: { display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '13.5px', fontWeight: 700, color: 'var(--accent-text)', textDecoration: 'none' },
  moreLinks: { display: 'flex', flexWrap: 'wrap', gap: '8px 18px', padding: '4px 4px 0' },
  moreLink: { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', textDecoration: 'none' },
}
