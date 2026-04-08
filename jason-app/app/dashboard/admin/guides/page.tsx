import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import {
  Scales, CurrencyEur, Armchair, Wrench, Star, ChartLine, ShieldCheck,
  ArrowRight, ArrowSquareOut, Newspaper,
} from '@phosphor-icons/react/dist/ssr'

export const metadata = { title: 'Guide LCD — Admin — Jason Marinho' }

const GUIDE_CATEGORIES = [
  { id: 'reglementation', icon: Scales,      color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',   title: 'Réglementation',      profiles: ['debutant'] },
  { id: 'fiscalite',      icon: CurrencyEur, color: '#34d399', bg: 'rgba(52,211,153,0.12)',   title: 'Fiscalité',           profiles: ['debutant'] },
  { id: 'decoration',     icon: Armchair,    color: '#f472b6', bg: 'rgba(244,114,182,0.12)',  title: 'Décoration & Aménagement', profiles: ['debutant'] },
  { id: 'gestion',        icon: Wrench,      color: '#fb923c', bg: 'rgba(251,146,60,0.12)',   title: 'Gestion Locative',    profiles: ['intermediaire', 'pro'] },
  { id: 'visibilite',     icon: Star,        color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',   title: 'Réputation & Avis',   profiles: ['intermediaire'] },
  { id: 'assurances',     icon: ShieldCheck, color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',   title: 'Assurances & Protection', profiles: ['pro'] },
  { id: 'revenus',        icon: ChartLine,   color: '#a78bfa', bg: 'rgba(167,139,250,0.12)',  title: 'Revenus & Tarification', profiles: ['intermediaire', 'pro'] },
]

const PROFILE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  debutant:      { label: '🌱 Débutant',      color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  intermediaire: { label: '🌿 Intermédiaire', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  pro:           { label: '🏢 Pro',           color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
}

export default async function AdminGuidesPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Actualités par catégorie guide pour cross-link
  const { data: actuCategories } = await supabase
    .from('actualites')
    .select('category, is_published')

  const catCounts: Record<string, { total: number; published: number }> = {}
  for (const a of actuCategories ?? []) {
    if (!catCounts[a.category]) catCounts[a.category] = { total: 0, published: 0 }
    catCounts[a.category].total++
    if (a.is_published) catCounts[a.category].published++
  }

  return (
    <>
      <Header title="Guide LCD" userName={profile?.full_name ?? ''} currentPlan="Administrateur" />
      <div style={{ padding: 'clamp(24px,3vw,40px)', maxWidth: '900px' }}>

        {/* Intro */}
        <div style={s.intro} className="fade-up">
          <h2 style={s.pageTitle}>Guide LCD</h2>
          <p style={s.pageDesc}>
            Vue d&apos;ensemble de la structure du Guide LCD et des profils associés à chaque thème.
            Le contenu (statistiques) est maintenu dans le code — les actualités par thème sont gérées via la section Actualités.
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
              <div style={s.actionDesc}>Ajouter / publier des articles par thème</div>
            </div>
          </Link>
        </div>

        {/* Profils section */}
        <div className="fade-up d2">
          <div style={s.sectionLabel}>Profils de navigation</div>
          <div style={s.profilesGrid} className="admin-profiles-grid">
            {Object.entries(PROFILE_LABELS).map(([key, p]) => {
              const cats = GUIDE_CATEGORIES.filter(c => c.profiles.includes(key))
              return (
                <div key={key} style={{ ...s.profileCard, borderColor: `${p.color}20` }} className="glass-card">
                  <div style={{ ...s.profilePill, color: p.color, background: p.bg }}>{p.label}</div>
                  <div style={s.profileCats}>
                    {cats.map(cat => {
                      const Icon = cat.icon
                      return (
                        <div key={cat.id} style={s.profileCatRow}>
                          <Icon size={14} weight="fill" style={{ color: cat.color, flexShrink: 0 }} />
                          <span style={s.profileCatName}>{cat.title}</span>
                          <span style={{ ...s.priorityBadge, color: p.color, background: p.bg }}>Prioritaire</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Categories overview */}
        <div className="fade-up d3">
          <div style={s.sectionLabel}>Thèmes du Guide ({GUIDE_CATEGORIES.length})</div>
          <div style={s.catList}>
            {GUIDE_CATEGORIES.map(cat => {
              const Icon = cat.icon
              const counts = catCounts[cat.id] ?? { total: 0, published: 0 }
              const profilePills = cat.profiles.map(p => PROFILE_LABELS[p])
              return (
                <div key={cat.id} style={s.catRow} className="glass-card">
                  <div style={{ ...s.catIcon, color: cat.color, background: cat.bg }}>
                    <Icon size={18} weight="fill" />
                  </div>
                  <div style={s.catBody}>
                    <div style={s.catTitle}>{cat.title}</div>
                    <div style={s.catProfiles}>
                      {profilePills.map((p, i) => (
                        <span key={i} style={{ ...s.miniPill, color: p.color, background: p.bg }}>{p.label}</span>
                      ))}
                    </div>
                  </div>
                  <div style={s.catActu}>
                    <span style={{ fontSize: '12px', color: counts.published > 0 ? '#34d399' : 'var(--text-muted)', fontWeight: 500 }}>
                      {counts.published} actu{counts.published !== 1 ? 's' : ''} publiée{counts.published !== 1 ? 's' : ''}
                    </span>
                    {counts.total > counts.published && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        +{counts.total - counts.published} brouillon{counts.total - counts.published > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <Link
                    href="/dashboard/admin/actualites"
                    style={s.catLink}
                    title="Gérer les actualités de ce thème"
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
  pageTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 400, color: 'var(--text)', marginBottom: '8px' },
  pageDesc: { fontSize: '13px', fontWeight: 300, color: 'var(--text-3)', lineHeight: 1.65, maxWidth: '680px' },

  actions: { display: 'flex', gap: '12px', marginBottom: '36px', flexWrap: 'wrap' as const },
  actionCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '13px', textDecoration: 'none', color: 'var(--text)', transition: 'border-color 0.15s, background 0.15s', flex: '1 1 220px' },
  actionTitle: { fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' },
  actionDesc: { fontSize: '12px', color: 'var(--text-3)', fontWeight: 300 },

  sectionLabel: { fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: '14px' },

  profilesGrid: {},
  profileCard: { padding: '18px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid' },
  profilePill: { display: 'inline-flex', alignItems: 'center', fontSize: '13px', fontWeight: 600, padding: '5px 10px', borderRadius: '8px', alignSelf: 'flex-start' },
  profileCats: { display: 'flex', flexDirection: 'column', gap: '8px' },
  profileCatRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  profileCatName: { fontSize: '12px', fontWeight: 400, color: 'var(--text-2)', flex: 1, minWidth: 0 },
  priorityBadge: { fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '100px', flexShrink: 0 },

  catList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  catRow: { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', borderRadius: '13px' },
  catIcon: { width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  catBody: { flex: 1, minWidth: 0 },
  catTitle: { fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' },
  catProfiles: { display: 'flex', gap: '6px', flexWrap: 'wrap' as const },
  miniPill: { fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '100px' },
  catActu: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 },
  catLink: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-3)', textDecoration: 'none', flexShrink: 0 },
}
