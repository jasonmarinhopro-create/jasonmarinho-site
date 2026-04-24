import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import {
  getCachedContributors,
  getCachedRoadmapItems,
  getCachedRoadmapComments,
  getCachedRoadmapVotes,
} from '@/lib/queries/cache'
import Header from '@/components/layout/Header'
import MurDesBatisseurs, { type ContributorTile } from '@/components/MurDesBatisseurs'
import Roadmap, { type RoadmapItemData, type RoadmapCommentData } from '@/components/Roadmap'
import { Heart, ArrowRight, Star, ChatCircle, Rocket, Medal, Lightbulb, CheckCircle } from '@phosphor-icons/react/dist/ssr'

export const dynamic   = 'force-dynamic'
export const metadata  = { title: 'Contributeurs — Jason Marinho' }

export default async function ContributeursPage() {
  const profile      = await getProfile()
  const isContributor = profile?.is_contributor ?? false
  const isAdmin       = profile?.role === 'admin'
  const planLabel     = isAdmin ? 'Administrateur'
    : profile?.plan === 'driing'    ? 'Membre Driing'
    : profile?.plan === 'standard'  ? 'Standard'
    : 'Découverte'

  /* ── Non-contributeur : teasing ── */
  if (!isContributor && !isAdmin) {
    return (
      <>
        <Header title="Contributeurs" userName={profile?.full_name ?? undefined} currentPlan={planLabel} />
        <div style={s.page}>
          <div style={s.teasing}>
            <div style={s.teasingGlow} />

            <div style={s.teasingBadge}>
              <Heart size={14} color="#FFD56B" weight="fill" />
              Espace Contributeurs
            </div>

            <h2 style={s.teasingTitle}>
              Un espace pour ceux qui souhaitent<br />
              <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>soutenir et proposer des idées.</em>
            </h2>

            <p style={s.teasingDesc}>
              Contribue librement, et accède à un espace communautaire exclusif pour
              proposer des fonctionnalités, voter sur la roadmap et construire la plateforme avec moi.
            </p>

            <div style={s.perksGrid}>
              {[
                { icon: Medal,      color: '#FFD56B', label: 'Badge Contributeur permanent sur ton profil' },
                { icon: Star,       color: '#a78bfa', label: 'Tes idées rejoignent la roadmap officielle' },
                { icon: ChatCircle, color: '#34d399', label: 'Espace discussion exclusif pour les bâtisseurs' },
                { icon: Rocket,     color: '#60a5fa', label: 'Accès anticipé à chaque nouveauté' },
              ].map(({ icon: Icon, color, label }) => (
                <div key={label} style={{ ...s.perk, borderColor: `${color}22` }}>
                  <Icon size={16} color={color} weight="duotone" />
                  <span style={s.perkLabel}>{label}</span>
                </div>
              ))}
            </div>

            <a href="/soutenir" style={s.cta}>
              Rejoindre les bâtisseurs
              <ArrowRight size={15} weight="bold" />
            </a>

            <p style={s.teasingNote}>
              Contribution libre — même 1 € suffit · Accès activé sous 24h
            </p>
          </div>
        </div>
      </>
    )
  }

  /* ── Contributeur : espace complet ── */
  const supabase = await createClient()
  const userId   = profile?.userId ?? null

  const [contributorsData, roadmapData, commentsData, allVotesData, userVotesRes] = await Promise.all([
    getCachedContributors(),
    getCachedRoadmapItems(),
    getCachedRoadmapComments(),
    getCachedRoadmapVotes(),
    userId
      ? supabase.from('roadmap_votes').select('item_id').eq('user_id', userId)
      : Promise.resolve({ data: [] as { item_id: string }[], error: null }),
  ])

  const contributors: ContributorTile[] = contributorsData.map(c => ({
    userId:     c.id,
    full_name:  c.full_name,
    created_at: c.created_at,
  }))

  const roadmapItems  = roadmapData  as RoadmapItemData[]
  const comments      = commentsData as RoadmapCommentData[]
  const userVotesList = (userVotesRes.data ?? []).map(v => v.item_id)

  const voteCounts: Record<string, number> = {}
  allVotesData.forEach(v => {
    voteCounts[v.item_id] = (voteCounts[v.item_id] ?? 0) + 1
  })

  const doneCount = roadmapItems.filter(i => i.status === 'done').length
  const firstName = profile?.full_name?.split(/\s+/)[0] ?? 'ami(e)'

  return (
    <>
      <Header title="Contributeurs" userName={profile?.full_name ?? undefined} currentPlan={planLabel} />
      <div style={s.page}>

        {/* ── Intro ── */}
        <div style={s.intro} className="fade-up">
          <div style={s.introBadge}>
            <Heart size={13} color="#FFD56B" weight="fill" />
            Le Cercle · Espace exclusif
          </div>
          <h1 style={s.introTitle}>
            Bienvenue,{' '}
            <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>{firstName}</em>
          </h1>
          <p style={s.introDesc}>
            Tu fais partie des personnes qui construisent la plateforme avec moi.
            Propose tes idées, vote sur celles des autres, commente et échange.
          </p>
        </div>

        {/* ── Mur des Bâtisseurs ── */}
        <section style={s.section} className="fade-up">
          <MurDesBatisseurs contributors={contributors} />
        </section>

        {/* ── Stats : remplace Les Coulisses ── */}
        <div style={s.statsRow} className="fade-up">
          <div style={s.statItem}>
            <Heart size={15} color="#FFD56B" weight="fill" />
            <span style={{ ...s.statNum, color: '#FFD56B' }}>{contributors.length}</span>
            <span style={s.statLabel}>bâtisseur{contributors.length > 1 ? 's' : ''}</span>
          </div>
          <div style={s.statDiv} />
          <div style={s.statItem}>
            <Lightbulb size={15} color="#60a5fa" weight="fill" />
            <span style={{ ...s.statNum, color: '#60a5fa' }}>{roadmapItems.length}</span>
            <span style={s.statLabel}>idée{roadmapItems.length > 1 ? 's' : ''} soumise{roadmapItems.length > 1 ? 's' : ''}</span>
          </div>
          <div style={s.statDiv} />
          <div style={s.statItem}>
            <CheckCircle size={15} color="#34d399" weight="fill" />
            <span style={{ ...s.statNum, color: '#34d399' }}>{doneCount}</span>
            <span style={s.statLabel}>fonctionnalité{doneCount > 1 ? 's' : ''} livrée{doneCount > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* ── Roadmap ── */}
        <section style={s.section} className="fade-up">
          <Roadmap
            items={roadmapItems}
            comments={comments}
            voteCounts={voteCounts}
            userVotes={userVotesList}
            userId={userId}
            isAdmin={isAdmin}
          />
        </section>

      </div>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '960px' },

  /* ── Teasing ── */
  teasing: {
    position: 'relative', overflow: 'hidden',
    maxWidth: '560px', margin: '40px auto 0',
    background: 'linear-gradient(135deg, rgba(255,213,107,0.07) 0%, rgba(255,213,107,0.02) 100%)',
    border: '1px solid rgba(255,213,107,0.18)',
    borderRadius: '24px', padding: 'clamp(32px,5vw,56px)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '20px', textAlign: 'center',
  },
  teasingGlow: {
    position: 'absolute', top: '-80px', right: '-80px',
    width: '280px', height: '280px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,213,107,0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  teasingBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase',
    color: '#FFD56B', background: 'rgba(255,213,107,0.1)',
    border: '1px solid rgba(255,213,107,0.2)',
    borderRadius: '999px', padding: '5px 14px',
  },
  teasingTitle: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(20px,3vw,28px)',
    fontWeight: 400, lineHeight: 1.35, color: 'var(--text)', margin: 0,
  },
  teasingDesc: { fontSize: '14px', lineHeight: 1.7, color: 'var(--text-2)', margin: 0, maxWidth: '440px' },
  perksGrid:   { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', textAlign: 'left' },
  perk: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '11px 14px', background: 'var(--surface)', border: '1px solid', borderRadius: '12px',
  },
  perkLabel: { fontSize: '13px', color: 'var(--text-2)', fontWeight: 400 },
  cta: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    background: 'linear-gradient(135deg, #FFD56B 0%, #f59e0b 100%)',
    color: '#1a1a0e', fontWeight: 700, fontSize: '14px',
    padding: '13px 26px', borderRadius: '12px',
    textDecoration: 'none', boxShadow: '0 8px 24px rgba(255,213,107,0.2)',
    marginTop: '4px',
  },
  teasingNote: { fontSize: '12px', color: 'var(--text-muted)', margin: 0 },

  /* ── Contributor view ── */
  intro:      { marginBottom: '10px' },
  introBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase',
    color: '#FFD56B', background: 'rgba(255,213,107,0.08)',
    border: '1px solid rgba(255,213,107,0.15)',
    borderRadius: '999px', padding: '4px 12px', marginBottom: '14px',
  },
  introTitle: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(24px,3vw,34px)',
    fontWeight: 400, color: 'var(--text)', marginBottom: '10px', marginTop: 0,
  },
  introDesc: { fontSize: '14px', lineHeight: 1.7, color: 'var(--text-2)', maxWidth: '520px', margin: 0 },

  section: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '20px', padding: 'clamp(20px,3vw,28px)', marginTop: '16px',
  },

  /* ── Stats row ── */
  statsRow: {
    display: 'flex', alignItems: 'center', gap: '0',
    marginTop: '16px', borderRadius: '16px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    padding: '16px 24px', flexWrap: 'wrap' as const,
  },
  statItem: {
    display: 'flex', alignItems: 'center', gap: '8px',
    flex: 1, minWidth: '120px',
  },
  statNum:   { fontSize: '20px', fontWeight: 700 },
  statLabel: { fontSize: '12px', color: 'var(--text-3)', fontWeight: 400 },
  statDiv: {
    width: '1px', height: '32px',
    background: 'var(--border)', flexShrink: 0,
    margin: '0 20px',
  },
}
