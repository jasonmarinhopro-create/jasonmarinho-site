import Link from 'next/link'
import { HouseSimple, Camera, Broom, ChartLineUp, ArrowRight, CheckCircle } from '@phosphor-icons/react/dist/ssr'
import { getUserSpaces, type UserSpace } from '@/lib/queries/spaces'

export const metadata = { title: 'Mes espaces' }

// « Ajouter un espace » du menu du compte (sept. 2026) : remplace les trois
// liens « + Créer ma fiche photographe / équipe ménage / Analyser un
// investissement » qui encombraient le menu de chaque hôte. Un même compte
// peut avoir plusieurs espaces ; on bascule ensuite depuis le menu.

const SPACES: Array<{ key: UserSpace['key']; Icon: React.ElementType; title: string; desc: string; create: string; createLabel: string }> = [
  { key: 'host', Icon: HouseSimple, title: 'Hôte LCD', desc: 'Contrats, ménage, voyageurs, revenus : la gestion de tes locations au quotidien.', create: '/dashboard/logements', createLabel: 'Ajouter un logement' },
  { key: 'photographer', Icon: Camera, title: 'Photographe', desc: "Ta fiche dans l'annuaire des photographes LCD, ton portfolio et les demandes des hôtes.", create: '/dashboard/creer-fiche-photographe', createLabel: 'Créer ma fiche photographe' },
  { key: 'cleaner', Icon: Broom, title: 'Équipe ménage', desc: "Ta fiche dans l'annuaire, et le planning des hôtes avec qui tu travailles, photos de fin de ménage comprises.", create: '/dashboard/creer-fiche-menage', createLabel: 'Créer ma fiche équipe ménage' },
  { key: 'investor', Icon: ChartLineUp, title: 'Investisseur', desc: "Estime ce qu'un bien peut rapporter avant de l'acheter, avec la réglementation de la ville et un prévisionnel pour ta banque.", create: '/dashboard/investir', createLabel: 'Analyser un investissement' },
]

export default async function EspacesPage() {
  const { spaces } = await getUserSpaces()
  const byKey = new Map(spaces.map(s => [s.key, s]))
  return (
    <div style={s.page}>
      <h1 style={s.title}>Mes <em style={s.titleEm}>espaces</em></h1>
      <p style={s.sub}>Un même compte peut être hôte, photographe, équipe de ménage ou investisseur. Tu passes de l&apos;un à l&apos;autre depuis le menu de ton compte, en bas à gauche.</p>
      <div className="esp-grid" style={s.grid}>
        {SPACES.map(({ key, Icon, title, desc, create, createLabel }) => {
          const space = byKey.get(key)
          const active = !!space?.active
          return (
            <div key={key} style={s.card}>
              <div style={s.head}>
                <span style={s.ico}><Icon size={22} weight="duotone" /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={s.cardTitle}>{title}</span>
                  {active && space?.subtitle && <span style={s.cardSub}>{space.subtitle}</span>}
                </span>
                {active && <span style={s.badge}><CheckCircle size={13} weight="fill" /> Actif</span>}
              </div>
              <p style={s.desc}>{desc}</p>
              <Link href={active ? space!.href : create} style={active ? s.linkGhost : s.linkPrimary}>
                {active ? 'Ouvrir cet espace' : createLabel} <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          )
        })}
      </div>
      <style>{`
        .esp-grid { grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 900px) { .esp-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      `}</style>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(24px,3vw,32px)', fontWeight: 400, color: 'var(--text)', margin: '0 0 8px' },
  titleEm: { fontStyle: 'italic', color: 'var(--accent-text)' },
  sub: { fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 24px', maxWidth: '640px' },
  grid: { display: 'grid', gap: '16px' },
  card: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px 22px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)' },
  head: { display: 'flex', alignItems: 'center', gap: '14px' },
  ico: { width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' },
  cardTitle: { display: 'block', fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', color: 'var(--text)' },
  cardSub: { display: 'block', fontSize: '12.5px', color: 'var(--text-3)', marginTop: '2px' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: 'var(--accent-text)', background: 'var(--accent-bg)', padding: '4px 10px', borderRadius: '999px' },
  desc: { fontSize: '13.5px', color: 'var(--text-2)', lineHeight: 1.55, margin: 0, flex: 1 },
  linkPrimary: { alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: 'var(--accent-text)', color: 'var(--bg)', fontWeight: 700, fontSize: '13.5px', textDecoration: 'none' },
  linkGhost: { alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 15px', borderRadius: '10px', border: '1px solid var(--border)', color: 'var(--text)', fontWeight: 600, fontSize: '13.5px', textDecoration: 'none' },
}
