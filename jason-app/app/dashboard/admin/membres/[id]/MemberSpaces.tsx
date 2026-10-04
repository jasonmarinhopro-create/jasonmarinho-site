// Bloc « Ses espaces » de la fiche membre (04/10/2026, demande de Jason :
// comprendre sur le téléphone quels comptes un membre a créés). Un compte
// peut être hôte, photographe, équipe de ménage et investisseur à la fois.

import Link from 'next/link'
import { House, Camera, Broom, Briefcase, ArrowSquareOut, Eye } from '@phosphor-icons/react/dist/ssr'
import { PRICES, isPaidPro, proAnnualPrice } from '@/lib/admin/revenue'
import type { MemberProSpace } from '../../actions'

const AMBER = '#B7791F'
const PINK = '#B83A7C'
const BROWN = '#6E5446'

const FICHE: Record<string, string> = {
  active: 'En ligne', pending: 'À valider', pending_payment: 'En attente de paiement',
  approved_pending_payment: 'Validée, en attente de paiement', hidden: 'Masquée', cancelled: 'Résiliée', suspended: 'Suspendue',
}
const SUB: Record<string, string> = {
  active: 'payé', trialing: 'en essai', past_due: 'paiement en retard', canceled: 'résilié', incomplete: 'paiement inachevé', unpaid: 'impayé',
}
const PLAN: Record<string, { label: string; price: number }> = {
  decouverte: { label: 'Découverte (gratuit)', price: 0 },
  standard: { label: 'Standard', price: PRICES.standard },
  driing: { label: 'Driing (offert)', price: 0 },
}

const eur = (n: number) => `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
const date = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Paris' })

export default function MemberSpaces({ plan, host, sejours, voyageurs, pros, isInvestor, projects }: {
  plan: string
  host: { logements: number; contrats: number }
  sejours: number
  voyageurs: number
  pros: MemberProSpace[]
  isInvestor: boolean
  projects: number
}) {
  const p = PLAN[plan] ?? PLAN.decouverte
  const hostUsed = host.logements + sejours + voyageurs + host.contrats > 0
  const annual = p.price + pros.filter(isPaidPro).reduce((n, r) => n + proAnnualPrice(r.tier), 0)

  return (
    <section style={s.section} className="fade-up">
      <div style={s.head}>
        <div style={s.title}>Ses espaces</div>
        <span style={s.total}>{annual > 0 ? `Te rapporte ${eur(annual)} par an` : 'Aucun abonnement payant'}</span>
      </div>
      <div style={s.grid}>
        <Card icon={<House size={18} weight="duotone" />} color="var(--accent-text)" title="Espace hôte" badge={hostUsed ? 'Utilisé' : 'Pas encore utilisé'} badgeOn={hostUsed}>
          <Line k="Formule" v={p.price > 0 ? `${p.label} · ${eur(p.price)} / an` : p.label} />
          <Line k="Activité" v={`${host.logements} logement${host.logements > 1 ? 's' : ''} · ${sejours} séjour${sejours > 1 ? 's' : ''} · ${host.contrats} contrat${host.contrats > 1 ? 's' : ''}`} />
        </Card>

        {pros.map(r => {
          const photo = r.kind === 'photographe'
          const paid = isPaidPro(r)
          const online = r.status === 'active' && r.is_public && r.slug
          const name = (!photo && r.pseudo) || r.full_name
          return (
            <Card
              key={r.id}
              icon={photo ? <Camera size={18} weight="duotone" /> : <Broom size={18} weight="duotone" />}
              color={photo ? PINK : BROWN}
              title={photo ? 'Fiche photographe' : 'Fiche équipe de ménage'}
              badge={FICHE[r.status ?? ''] ?? r.status ?? '?'}
              badgeOn={r.status === 'active'}
            >
              {name && <Line k="Nom" v={`${name}${r.ville ? `, ${r.ville}` : ''}`} />}
              <Line k="Abonnement" v={`${r.tier === 'fondateur' ? 'Fondateur' : 'Standard'} · ${eur(proAnnualPrice(r.tier))} / an · ${paid ? SUB[r.stripe_subscription_status ?? ''] ?? 'payé' : r.stripe_subscription_status ? SUB[r.stripe_subscription_status] ?? r.stripe_subscription_status : 'pas encore payé'}`} />
              <Line k="Résultats" v={`${r.views_count ?? 0} vue${(r.views_count ?? 0) > 1 ? 's' : ''} · ${r.contacts_count ?? 0} demande${(r.contacts_count ?? 0) > 1 ? 's' : ''}`} />
              <Line k="Créée le" v={date(r.created_at)} />
              <div style={s.actions}>
                <Link href={`/dashboard/ma-fiche-${photo ? 'photographe' : 'menage'}?id=${r.id}`} style={s.btn}><Eye size={14} weight="bold" /> Voir sa fiche</Link>
                {online && (
                  <a href={`https://jasonmarinho.com/annuaires/${photo ? 'photographes' : 'menage'}/${r.slug}`} target="_blank" rel="noopener" style={s.btnGhost}>
                    <ArrowSquareOut size={14} weight="bold" /> Sur le site
                  </a>
                )}
              </div>
            </Card>
          )
        })}

        {isInvestor && (
          <Card icon={<Briefcase size={18} weight="duotone" />} color={AMBER} title="Espace investisseur" badge={projects > 0 ? 'Utilisé' : 'Pas encore utilisé'} badgeOn={projects > 0}>
            <Line k="Projets" v={`${projects} projet${projects > 1 ? 's' : ''} d'achat enregistré${projects > 1 ? 's' : ''}`} />
          </Card>
        )}
      </div>
    </section>
  )
}

function Card({ icon, color, title, badge, badgeOn, children }: {
  icon: React.ReactNode; color: string; title: string; badge: string; badgeOn: boolean; children: React.ReactNode
}) {
  return (
    <div style={s.card}>
      <div style={s.cardHead}>
        <span style={{ ...s.icon, color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}>{icon}</span>
        <span style={s.cardTitle}>{title}</span>
        <span style={{ ...s.badge, ...(badgeOn ? s.badgeOn : {}) }}>{badge}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  )
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div style={s.line}>
      <span style={s.k}>{k}</span>
      <span style={s.v}>{v}</span>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  section: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 'clamp(16px, 2vw, 22px)' },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 19, color: 'var(--text)' },
  total: { fontSize: 12.5, fontWeight: 700, color: 'var(--accent-text)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', padding: '4px 10px', borderRadius: 999 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))', gap: 12 },
  card: { display: 'flex', flexDirection: 'column', gap: 12, padding: 14, borderRadius: 14, background: 'var(--bg)', border: '1px solid var(--border)', minWidth: 0 },
  cardHead: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  icon: { width: 34, height: 34, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitle: { fontSize: 14.5, fontWeight: 700, color: 'var(--text)', flex: 1, minWidth: 0 },
  badge: { fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--border)', whiteSpace: 'nowrap' },
  badgeOn: { color: 'var(--accent-text)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' },
  line: { display: 'flex', gap: 10, fontSize: 13, lineHeight: 1.45 },
  k: { color: 'var(--text-muted)', minWidth: 86, flexShrink: 0 },
  v: { color: 'var(--text)', minWidth: 0, overflowWrap: 'anywhere' },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 13, fontWeight: 700, textDecoration: 'none' },
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, border: '1px solid var(--accent-border)', color: 'var(--accent-text)', fontSize: 13, fontWeight: 700, textDecoration: 'none' },
}
