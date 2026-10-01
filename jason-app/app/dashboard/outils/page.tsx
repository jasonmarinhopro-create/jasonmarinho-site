import Link from 'next/link'
import {
  Calculator, ChartLineUp, Printer, ArrowRight, Wrench, CaretRight,
} from '@phosphor-icons/react/dist/ssr'
import HubHero, { HeroEm, heroCard } from '@/components/dashboard/HubHero'
import AskQuestionCard from '@/components/chez-nous/AskQuestionCard'

export const metadata = { title: 'Outils & calculs' }

/**
 * Hub « Outils & calculs » (refonte sept. 2026, même esprit que les autres
 * hubs : HubHero vert, pleine largeur). Avant : 4 cartes génériques qui
 * renvoyaient chacune vers un outil à plusieurs onglets, sans dire ce qu'on
 * pouvait y calculer. Désormais chaque carte liste ses outils, avec un lien
 * direct vers l'onglet (#fiscal, #mes-prix…, hash gérés par SimulateursUI et
 * CalculateursUI), et la colonne de droite répond aux questions les plus
 * fréquentes en un clic. Les sous-pages gardent leur URL (liens du blog).
 */

type Tool = { label: string; href: string }
type Group = {
  href: string
  label: string
  Icon: React.ElementType
  question: string
  desc: string
  tools: Tool[]
}

const GROUPS: Group[] = [
  {
    href: '/dashboard/simulateurs',
    label: 'Simulateurs fiscaux',
    Icon: Calculator,
    question: 'Combien vais-je payer, et sous quel statut ?',
    desc: 'Préremplis avec les revenus de tes logements. Règles 2026, loi Le Meur comprise.',
    tools: [
      { label: 'Micro-BIC ou réel', href: '/dashboard/simulateurs#fiscal' },
      { label: 'EI ou SASU', href: '/dashboard/simulateurs#statut' },
      { label: 'Rentabilité', href: '/dashboard/simulateurs#rentabilite' },
      { label: 'Taxe de séjour', href: '/dashboard/simulateurs#taxe' },
      { label: 'Franchise TVA', href: '/dashboard/simulateurs#tva' },
    ],
  },
  {
    href: '/dashboard/calculateurs',
    label: 'Prix & marché',
    Icon: ChartLineUp,
    question: 'À quel prix louer mes nuits ?',
    desc: 'Compare tes tarifs aux prix de ta ville et estime ce que ton logement peut rapporter.',
    tools: [
      { label: 'Mes prix', href: '/dashboard/calculateurs#mes-prix' },
      { label: 'Estimer mes revenus', href: '/dashboard/calculateurs#revenus' },
      { label: 'Prix du marché', href: '/dashboard/calculateurs#prix' },
      { label: 'Comparer mes villes', href: '/dashboard/calculateurs#mesvilles' },
    ],
  },
  {
    href: '/dashboard/outils-impression',
    label: 'QR codes & affiches',
    Icon: Printer,
    question: 'Que mettre au mur de mon logement ?',
    desc: 'QR code WiFi ou vers ton livret d’accueil, et affiches A4 prêtes à imprimer pour ton logement.',
    tools: [
      { label: 'QR code', href: '/dashboard/outils-impression#qr' },
      { label: 'Affiche A4', href: '/dashboard/outils-impression#affiche' },
    ],
  },
]

// Les questions qu'on se pose le plus souvent, chacune vers l'onglet qui y répond
const QUICK: Tool[] = [
  { label: 'Combien d’impôts sur mes locations ?', href: '/dashboard/simulateurs#fiscal' },
  { label: 'Combien de taxe de séjour ?', href: '/dashboard/simulateurs#taxe' },
  { label: 'Mes prix sont-ils dans le marché ?', href: '/dashboard/calculateurs#mes-prix' },
  { label: 'Combien peut rapporter un logement ?', href: '/dashboard/calculateurs#revenus' },
]

export default function OutilsHubPage() {
  return (
    <div style={s.page}>
      <HubHero
        eyebrowIcon={<Wrench size={13} weight="fill" />}
        eyebrow="Outils & calculs"
        title={<>Les bons chiffres, <HeroEm>sans tableur</HeroEm></>}
        desc="Impôts, prix, taxe de séjour, affiches : les outils pour décider vite, déjà remplis avec les données de tes logements."
        aside={
          <div style={heroCard}>
            <span style={s.quickTitle}>Réponse en un clic</span>
            {QUICK.map(q => (
              <Link key={q.label} href={q.href} style={s.quickLink}>
                <span>{q.label}</span>
                <CaretRight size={13} weight="bold" style={{ flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        }
      />

      <div className="ot-grid" style={s.grid}>
        {GROUPS.map(({ href, label, Icon, question, desc, tools }) => (
          <section key={href} style={s.card}>
            <Link href={href} style={s.cardHead}>
              <span style={s.cardIco}><Icon size={22} weight="duotone" /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={s.cardTitle}>{label}</span>
                <span style={s.cardQuestion}>{question}</span>
              </span>
              <ArrowRight size={16} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
            </Link>
            <p style={s.cardDesc}>{desc}</p>
            <div style={s.chips}>
              {tools.map(t => (
                <Link key={t.label} href={t.href} style={s.chip}>{t.label}</Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div style={{ marginTop: '24px' }}>
        <AskQuestionCard
          category="reglementation"
          title="Un calcul que ces outils ne font pas ?"
          text="Pose ta question à Jason et aux autres hôtes : réponse sous 48 h, par email."
        />
      </div>

      <style>{`
        .ot-grid { grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 900px) { .ot-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (min-width: 1300px) { .ot-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
      `}</style>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  quickTitle: { fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' },
  quickLink: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
    padding: '9px 12px', borderRadius: '10px', textDecoration: 'none',
    background: 'var(--accent-bg)', color: 'var(--accent-text)', fontSize: '13.5px', fontWeight: 600,
  },
  grid: { display: 'grid', gap: '16px' },
  card: {
    display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px 22px',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
  },
  cardHead: { display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', color: 'var(--text)' },
  cardIco: {
    width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)',
  },
  cardTitle: { display: 'block', fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', fontWeight: 500, color: 'var(--text)' },
  cardQuestion: { display: 'block', fontSize: '13.5px', color: 'var(--text-2)', marginTop: '2px' },
  cardDesc: { fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.55, margin: 0 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'auto' },
  chip: {
    padding: '7px 12px', borderRadius: '999px', fontSize: '12.5px', fontWeight: 600, textDecoration: 'none',
    color: 'var(--text)', background: 'var(--bg)', border: '1px solid var(--border)',
  },
}
