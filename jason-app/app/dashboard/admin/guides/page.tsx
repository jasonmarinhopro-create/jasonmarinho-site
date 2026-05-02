import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  HouseLine, Coffee, Buildings, Handshake,
  Scales, CurrencyEur, ClipboardText, Globe, Briefcase, FileText, Megaphone, ShieldCheck, Gavel,
  ArrowRight, ArrowSquareOut, Newspaper,
} from '@phosphor-icons/react/dist/ssr'

export const metadata = { title: 'Guide LCD, Admin, Jason Marinho' }

type ProfileId = 'gites' | 'chambres' | 'conciergerie' | 'direct'

const PROFILES: {
  id: ProfileId
  label: string
  desc: string
  color: string
  bg: string
  Icon: React.ElementType
}[] = [
  { id: 'gites',        label: 'Gîtes',               desc: 'Logement entier · EI ou SASU',           color: '#d97706', bg: 'rgba(245,158,11,0.12)',   Icon: HouseLine },
  { id: 'chambres',     label: "Chambres d'hôtes",     desc: 'PDJ obligatoire · Présence propriétaire', color: '#db2777', bg: 'rgba(236,72,153,0.12)',   Icon: Coffee },
  { id: 'conciergerie', label: 'Conciergeries',        desc: 'Prestation de services · Multi-biens',   color: '#7c3aed', bg: 'rgba(139,92,246,0.12)',   Icon: Buildings },
  { id: 'direct',       label: 'Réservation directe',  desc: 'Sans Airbnb · Contrats & paiements',     color: '#059669', bg: 'rgba(16,185,129,0.12)',   Icon: Handshake },
]

const GUIDE_CARDS: {
  id: string
  profile: ProfileId
  title: string
  Icon: React.ElementType
  color: string
  bg: string
}[] = [
  // Gîtes
  { id: 'gites-statut',        profile: 'gites',        title: 'Statut juridique : EI ou SASU ?',                   Icon: Scales,       color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { id: 'gites-fiscalite',     profile: 'gites',        title: 'Classement & impact fiscal (loi Le Meur 2025)',      Icon: CurrencyEur,  color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  { id: 'gites-obligations',   profile: 'gites',        title: 'Obligations légales du gîte',                       Icon: ClipboardText, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  // Chambres
  { id: 'chambres-regles',     profile: 'chambres',     title: 'Les règles légales strictes (loi 2006)',             Icon: Gavel,        color: '#fb7185', bg: 'rgba(251,113,133,0.12)' },
  { id: 'chambres-fiscalite',  profile: 'chambres',     title: "Fiscalité spécifique chambres d'hôtes",             Icon: CurrencyEur,  color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  { id: 'chambres-plateformes',profile: 'chambres',     title: 'Canaux de réservation adaptés',                     Icon: Globe,        color: '#2dd4bf', bg: 'rgba(45,212,191,0.12)' },
  // Conciergeries
  { id: 'concierge-hoguet',    profile: 'conciergerie', title: "Loi Hoguet : quand s'applique-t-elle ?",            Icon: Scales,       color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  { id: 'concierge-statut',    profile: 'conciergerie', title: 'Statuts recommandés & TVA',                         Icon: Briefcase,    color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  { id: 'concierge-contrats',  profile: 'conciergerie', title: 'Contrats & tarification',                           Icon: FileText,     color: '#2dd4bf', bg: 'rgba(45,212,191,0.12)' },
  // Direct
  { id: 'direct-contrat',      profile: 'direct',       title: 'Contrat obligatoire sans plateforme',               Icon: FileText,     color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  { id: 'direct-assurance',    profile: 'direct',       title: "Assurance : pas d'AirCover hors Airbnb",            Icon: ShieldCheck,  color: '#fb7185', bg: 'rgba(251,113,133,0.12)' },
  { id: 'direct-visibilite',   profile: 'direct',       title: 'Se rendre visible sans Airbnb',                     Icon: Megaphone,    color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
]

export default async function AdminGuidesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Actualités par profil-catégorie
  const { data: actuData } = await supabase
    .from('actualites')
    .select('category, is_published')

  const catCounts: Record<string, { total: number; published: number }> = {}
  for (const a of actuData ?? []) {
    if (!catCounts[a.category]) catCounts[a.category] = { total: 0, published: 0 }
    catCounts[a.category].total++
    if (a.is_published) catCounts[a.category].published++
  }

  return (
    <>
      <div style={{ padding: 'clamp(24px,3vw,40px)', maxWidth: '960px' }}>

        {/* Intro */}
        <div style={s.intro} className="fade-up">
          <h2 style={s.pageTitle}>Guide LCD</h2>
          <p style={s.pageDesc}>
            Structure du Guide LCD par profil : 4 activités couvertes, 12 fiches de règles.
            Le contenu est maintenu dans le code, les actualités par profil sont gérées via la section Actualités.
          </p>
        </div>

        {/* Quick actions */}
        <div style={s.actions} className="fade-up d1">
          <Link href="/dashboard/guide" target="_blank" style={s.actionCard}>
            <ArrowSquareOut size={18} />
            <div>
              <div style={s.actionTitle}>Voir le Guide LCD</div>
              <div style={s.actionDesc}>Prévisualiser côté membre</div>
            </div>
          </Link>
          <Link href="/dashboard/admin/actualites" style={s.actionCard}>
            <Newspaper size={18} />
            <div>
              <div style={s.actionTitle}>Gérer les Actualités</div>
              <div style={s.actionDesc}>Ajouter / publier des articles par profil</div>
            </div>
          </Link>
        </div>

        {/* Profiles overview */}
        <div className="fade-up d2" style={{ marginBottom: '36px' }}>
          <div style={s.sectionLabel}>4 profils couverts</div>
          <div style={s.profilesGrid}>
            {PROFILES.map(p => {
              const cards = GUIDE_CARDS.filter(c => c.profile === p.id)
              const counts = catCounts[p.id] ?? { total: 0, published: 0 }
              const Icon = p.Icon
              return (
                <div key={p.id} style={{ ...s.profileCard, borderColor: `${p.color}20` }} className="glass-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ ...s.profileIconBox, background: p.bg, color: p.color }}>
                      <Icon size={18} weight="fill" />
                    </div>
                    <div>
                      <div style={{ ...s.profilePill, color: p.color }}>{p.label}</div>
                      <div style={s.profileDesc}>{p.desc}</div>
                    </div>
                  </div>
                  <div style={s.profileCards}>
                    {cards.map(card => {
                      const CardIcon = card.Icon
                      return (
                        <div key={card.id} style={s.profileCardRow}>
                          <CardIcon size={13} weight="fill" style={{ color: card.color, flexShrink: 0 }} />
                          <span style={s.profileCardName}>{card.title}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div style={s.profileFooter}>
                    <span style={{ fontSize: '11px', color: counts.published > 0 ? '#34d399' : 'var(--text-muted)', fontWeight: 500 }}>
                      {counts.published} actu{counts.published !== 1 ? 's' : ''} publiée{counts.published !== 1 ? 's' : ''}
                    </span>
                    {counts.total > counts.published && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        +{counts.total - counts.published} brouillon{counts.total - counts.published > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* All cards list */}
        <div className="fade-up d3">
          <div style={s.sectionLabel}>Toutes les fiches ({GUIDE_CARDS.length})</div>
          <div style={s.cardList}>
            {GUIDE_CARDS.map(card => {
              const CardIcon = card.Icon
              const prof = PROFILES.find(p => p.id === card.profile)!
              const ProfileIcon = prof.Icon
              return (
                <div key={card.id} style={s.cardRow} className="glass-card">
                  <div style={{ ...s.cardIconBox, color: card.color, background: card.bg }}>
                    <CardIcon size={17} weight="fill" />
                  </div>
                  <div style={s.cardBody}>
                    <div style={s.cardTitle}>{card.title}</div>
                    <div style={{ ...s.cardProfilePill, color: prof.color, background: prof.bg }}>
                      <ProfileIcon size={11} weight="fill" />
                      {prof.label}
                    </div>
                  </div>
                  <Link
                    href="/dashboard/admin/actualites"
                    style={s.cardLink}
                    title="Gérer les actualités de ce profil"
                  >
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  intro: { marginBottom: '28px' },
  pageTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 400, color: 'var(--text)', marginBottom: '8px' },
  pageDesc: { fontSize: '13px', fontWeight: 300, color: 'var(--text-3)', lineHeight: 1.65, maxWidth: '680px' },

  actions: { display: 'flex', gap: '12px', marginBottom: '36px', flexWrap: 'wrap' as const },
  actionCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '13px', textDecoration: 'none', color: 'var(--text)', transition: 'border-color 0.15s', flex: '1 1 220px' },
  actionTitle: { fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' },
  actionDesc: { fontSize: '12px', color: 'var(--text-3)', fontWeight: 300 },

  sectionLabel: { fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: '14px' },

  profilesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '12px' },
  profileCard: { padding: '18px', borderRadius: '14px', display: 'flex', flexDirection: 'column' as const, gap: '0', border: '1px solid' },
  profileIconBox: { width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  profilePill: { fontSize: '13px', fontWeight: 600, marginBottom: '2px' },
  profileDesc: { fontSize: '11px', fontWeight: 300, color: 'var(--text-3)' },
  profileCards: { display: 'flex', flexDirection: 'column' as const, gap: '7px', marginBottom: '14px' },
  profileCardRow: { display: 'flex', alignItems: 'flex-start', gap: '7px' },
  profileCardName: { fontSize: '11.5px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.4, flex: 1 },
  profileFooter: { display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border)' },

  cardList: { display: 'flex', flexDirection: 'column' as const, gap: '7px' },
  cardRow: { display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderRadius: '12px' },
  cardIconBox: { width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody: { flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const },
  cardTitle: { fontSize: '13px', fontWeight: 500, color: 'var(--text)', flex: '1 1 200px' },
  cardProfilePill: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px', flexShrink: 0 },
  cardLink: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-3)', textDecoration: 'none', flexShrink: 0 },
}
