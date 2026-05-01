import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import {
  getCachedContributors,
  getCachedRoadmapItems,
  getCachedRoadmapComments,
  getCachedRoadmapVotes,
} from '@/lib/queries/cache'
import MurDesBatisseurs, { type ContributorTile } from '@/components/MurDesBatisseurs'
import Roadmap, { type RoadmapItemData, type RoadmapCommentData } from '@/components/Roadmap'
import { Heart, ArrowRight, Star, ChatCircle, Rocket, Medal, Lightbulb, CheckCircle, Camera, EnvelopeSimple } from '@phosphor-icons/react/dist/ssr'

export const dynamic   = 'force-dynamic'
export const metadata  = { title: 'Contributeurs, Jason Marinho' }

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
        <div style={s.page}>
          <div style={s.teasing}>
            <div style={s.teasingGlow} />

            <div style={s.teasingBadge}>
              <Heart size={14} color="var(--accent-text)" weight="fill" />
              Espace Contributeurs
            </div>

            <h2 style={s.teasingTitle}>
              Un espace pour ceux qui souhaitent<br />
              <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>soutenir et proposer des idées.</em>
            </h2>

            <p style={s.teasingDesc}>
              Contribue librement, et accède à un espace communautaire exclusif pour
              proposer des fonctionnalités, voter sur la roadmap et construire la plateforme avec moi.
            </p>

            <div style={s.perksGrid}>
              {[
                { icon: Medal,      color: 'var(--accent-text)', label: 'Badge Contributeur permanent sur ton profil' },
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
              Contribution libre, même 1 € suffit · Accès activé sous 24h
            </p>

            {/* ── Séparateur ── */}
            <div style={s.orDivider}>
              <span style={s.orLine} />
              <span style={s.orText}>ou</span>
              <span style={s.orLine} />
            </div>

            {/* ── Alternative avis Google ── */}
            <div style={s.reviewBlock}>
              <div style={s.reviewHeader}>
                <div style={s.reviewStars}>
                  {[0,1,2,3,4].map(i => (
                    <Star key={i} size={16} color="var(--accent-text)" weight="fill" />
                  ))}
                </div>
                <span style={s.reviewTitle}>Laisse un avis Google, c'est gratuit 🙌</span>
              </div>
              <p style={s.reviewDesc}>
                Tu apprécies la plateforme et tu veux soutenir le projet sans sortir ta carte ?
                Ton avis Google me fait vraiment chaud au cœur, et il aide d'autres hôtes à découvrir la communauté.
                C'est tout aussi précieux qu'une contribution financière.
              </p>

              <div style={s.reviewSteps}>
                {[
                  { icon: Star,          color: 'var(--accent-text)', text: 'Laisse un avis 5 étoiles sur Google' },
                  { icon: Camera,        color: '#a78bfa', text: 'Prends une capture d\'écran de ton avis publié' },
                  { icon: EnvelopeSimple,color: '#34d399', text: 'Envoie-la à contact@jasonmarinho.com avec ton prénom' },
                ].map(({ icon: Icon, color, text }, i) => (
                  <div key={i} style={s.reviewStep}>
                    <div style={{ ...s.reviewStepNum, background: `${color}18`, color }}>
                      <Icon size={14} weight="fill" />
                    </div>
                    <span style={s.reviewStepText}>{text}</span>
                  </div>
                ))}
              </div>

              <a
                href="https://g.page/r/CcLzE7IbhS5_EAE/review"
                target="_blank"
                rel="noopener noreferrer"
                style={s.reviewCta}
              >
                <Star size={15} weight="fill" color="var(--accent-text)" />
                Écrire mon avis Google
                <ArrowRight size={14} weight="bold" />
              </a>

              <p style={s.reviewNote}>
                Je t'active manuellement en contributeur dès réception, hâte de lire tes retours ! 🚀
              </p>
            </div>
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
      <div style={s.page}>

        {/* ── Intro ── */}
        <div style={s.intro} className="fade-up">
          <div style={s.introBadge}>
            <Heart size={13} color="var(--accent-text)" weight="fill" />
            Le Cercle · Espace exclusif
          </div>
          <h1 style={s.introTitle}>
            Bienvenue,{' '}
            <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>{firstName}</em>
          </h1>
          <p style={s.introDesc}>
            Tu fais partie des personnes qui construisent la plateforme avec moi.
            Propose tes idées, vote sur celles des autres, commente et échange.
          </p>
        </div>

        {/* ── Layout 2 colonnes desktop ── */}
        <div style={s.layout}>

          {/* Colonne principale : Roadmap */}
          <div style={s.mainCol}>
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

          {/* Aside : Mur des Bâtisseurs + Stats */}
          <aside style={s.asideCol}>
            <section style={s.section} className="fade-up">
              <MurDesBatisseurs contributors={contributors} />
            </section>

            <div style={s.statsRow} className="fade-up">
              <div style={s.statItem}>
                <Heart size={15} color="var(--accent-text)" weight="fill" />
                <span style={{ ...s.statNum, color: 'var(--accent-text)' }}>{contributors.length}</span>
                <span style={s.statLabel}>bâtisseur{contributors.length > 1 ? 's' : ''}</span>
              </div>
              <div style={s.statItem}>
                <Lightbulb size={15} color="#60a5fa" weight="fill" />
                <span style={{ ...s.statNum, color: '#60a5fa' }}>{roadmapItems.length}</span>
                <span style={s.statLabel}>idée{roadmapItems.length > 1 ? 's' : ''}</span>
              </div>
              <div style={s.statItem}>
                <CheckCircle size={15} color="#34d399" weight="fill" />
                <span style={{ ...s.statNum, color: '#34d399' }}>{doneCount}</span>
                <span style={s.statLabel}>livrée{doneCount > 1 ? 's' : ''}</span>
              </div>
            </div>
          </aside>

        </div>

      </div>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  layout: { display: 'flex', gap: '24px', flexWrap: 'wrap' as const, alignItems: 'flex-start', marginTop: '20px' },
  mainCol: { flex: '1 1 600px', minWidth: 0, display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  asideCol: { flex: '0 0 340px', display: 'flex', flexDirection: 'column' as const, gap: '16px', position: 'sticky' as const, top: '20px' },

  /* ── Teasing ── */
  teasing: {
    position: 'relative', overflow: 'hidden',
    maxWidth: '560px', margin: '40px auto 0',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: '24px', padding: 'clamp(32px,5vw,56px)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '20px', textAlign: 'center',
  },
  teasingGlow: {
    position: 'absolute', top: '-80px', right: '-80px',
    width: '280px', height: '280px', borderRadius: '50%',
    background: 'radial-gradient(circle, var(--accent-bg-2) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  teasingBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase',
    color: 'var(--accent-text)', background: 'var(--accent-bg-2)',
    border: '1px solid var(--accent-border)',
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
    background: '#ffd56b',
    color: '#1a1a0e', fontWeight: 700, fontSize: '14px',
    padding: '13px 26px', borderRadius: '12px',
    textDecoration: 'none', boxShadow: '0 8px 24px rgba(255,213,107,0.2)',
    marginTop: '4px',
  },
  teasingNote: { fontSize: '12px', color: 'var(--text-muted)', margin: 0 },

  /* ── Séparateur ou ── */
  orDivider: {
    display: 'flex', alignItems: 'center', gap: '12px',
    width: '100%', margin: '4px 0',
  },
  orLine: {
    flex: 1, height: '1px',
    background: 'rgba(255,255,255,0.08)',
    display: 'block',
  },
  orText: {
    fontSize: '11px', fontWeight: 500,
    color: 'var(--text-muted)', textTransform: 'uppercase' as const,
    letterSpacing: '1px', flexShrink: 0,
  },

  /* ── Bloc avis Google ── */
  reviewBlock: {
    width: '100%',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex', flexDirection: 'column' as const, gap: '14px',
    textAlign: 'left' as const,
  },
  reviewHeader: {
    display: 'flex', flexDirection: 'column' as const, gap: '6px',
  },
  reviewStars: {
    display: 'flex', gap: '2px',
  },
  reviewTitle: {
    fontSize: '14px', fontWeight: 600, color: 'var(--text)',
    lineHeight: 1.4,
  },
  reviewDesc: {
    fontSize: '13px', lineHeight: 1.7,
    color: 'var(--text-2)', margin: 0,
  },
  reviewSteps: {
    display: 'flex', flexDirection: 'column' as const, gap: '8px',
  },
  reviewStep: {
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  reviewStepNum: {
    width: '28px', height: '28px', borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  reviewStepText: {
    fontSize: '13px', color: 'var(--text-2)', fontWeight: 400,
  },
  reviewCta: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    background: 'var(--accent-bg-2)',
    border: '1px solid var(--accent-border-2)',
    color: 'var(--accent-text)', fontWeight: 600, fontSize: '13px',
    padding: '10px 18px', borderRadius: '10px',
    textDecoration: 'none', alignSelf: 'flex-start' as const,
    transition: 'background 0.15s',
  },
  reviewNote: {
    fontSize: '12px', color: 'var(--text-muted)',
    margin: 0, lineHeight: 1.5,
  },

  /* ── Contributor view ── */
  intro:      { marginBottom: '10px' },
  introBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase',
    color: 'var(--accent-text)', background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
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

  /* ── Stats row (vertical dans l'aside) ── */
  statsRow: {
    display: 'flex', flexDirection: 'column' as const, gap: '14px',
    borderRadius: '16px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    padding: '18px',
  },
  statItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  statNum:   { fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif' },
  statLabel: { fontSize: '12px', color: 'var(--text-3)', fontWeight: 400 },
}
