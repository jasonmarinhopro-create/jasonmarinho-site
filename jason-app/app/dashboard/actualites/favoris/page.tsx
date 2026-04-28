import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { ArrowLeft, BookmarkSimple, ArrowUpRight, Newspaper } from '@phosphor-icons/react/dist/ssr'

export const metadata = { title: 'Mes favoris — Actualités LCD' }

const CAT_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  reglementation:     { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  label: 'Réglementation' },
  fiscalite:          { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  label: 'Fiscalité' },
  gites:              { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Gîtes & Meublés' },
  'chambres-hotes':   { color: '#ec4899', bg: 'rgba(236,72,153,0.12)',  label: "Chambres d'hôtes" },
  conciergerie:       { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  label: 'Conciergeries' },
  'reservation-directe': { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Réserv. directe' },
  marche:             { color: '#f472b6', bg: 'rgba(244,114,182,0.12)', label: 'Marché' },
  communes:           { color: '#64748b', bg: 'rgba(100,116,139,0.12)', label: 'Communes & Villes' },
  plateformes:        { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  label: 'Plateformes OTA' },
  outils:             { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'Outils & Tech' },
  general:            { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: 'Général' },
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}
function getDomain(url: string | null) {
  if (!url) return null
  try { return new URL(url).hostname.replace('www.', '') } catch { return null }
}

export default async function FavorisActualitesPage() {
  const profile = await getProfile()
  if (!profile?.userId) return null

  const supabase = await createClient()

  const { data: favRows } = await supabase
    .from('user_actualite_favorites')
    .select('actualite_id, created_at, actualite:actualites(id, title, summary, source_url, category, published_at, created_at)')
    .eq('user_id', profile.userId)
    .order('created_at', { ascending: false })

  const articles = ((favRows ?? []) as Array<{ actualite: { id: string; title: string; summary: string; source_url: string | null; category: string; published_at: string | null; created_at: string } | { id: string; title: string; summary: string; source_url: string | null; category: string; published_at: string | null; created_at: string }[] | null }>)
    .map(r => Array.isArray(r.actualite) ? r.actualite[0] : r.actualite)
    .filter((a): a is NonNullable<typeof a> => a !== null)

  return (
    <>
      <Header title="Mes favoris" userName={profile.full_name ?? undefined} />
      <div style={s.page}>
        <Link href="/dashboard/actualites" style={s.backLink}>
          <ArrowLeft size={14} weight="bold" />
          Toutes les actualités
        </Link>

        <div style={s.intro}>
          <h1 style={s.title}>
            Mes <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>favoris</em>
          </h1>
          <p style={s.desc}>
            Tes articles sauvegardés pour les retrouver facilement.
          </p>
        </div>

        {articles.length === 0 ? (
          <div style={s.empty}>
            <BookmarkSimple size={32} color="var(--text-muted)" weight="duotone" />
            <h3 style={s.emptyTitle}>Aucun favori pour l&apos;instant</h3>
            <p style={s.emptyDesc}>
              Marque un article ⭐ depuis la liste pour le retrouver ici.
            </p>
            <Link href="/dashboard/actualites" style={s.emptyCta}>
              Parcourir les actualités <ArrowUpRight size={13} weight="bold" />
            </Link>
          </div>
        ) : (
          <div style={s.list}>
            {articles.map(a => {
              const cat = CAT_COLORS[a.category] ?? CAT_COLORS.general
              const domain = getDomain(a.source_url)
              return (
                <div key={a.id} style={s.card} className="glass-card">
                  <div style={s.cardMeta}>
                    <span style={{ ...s.badge, color: cat.color, background: cat.bg, borderColor: `${cat.color}25` }}>
                      {cat.label}
                    </span>
                    <span style={s.dateLabel}>{formatDate(a.published_at ?? a.created_at)}</span>
                  </div>
                  <h3 style={s.cardTitle}>{a.title}</h3>
                  <p style={s.cardSummary}>{a.summary}</p>
                  {a.source_url && (
                    <a href={a.source_url} target="_blank" rel="noopener noreferrer" style={s.sourceLink}>
                      {domain ?? 'Lire la source'} <ArrowUpRight size={12} />
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  backLink: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', textDecoration: 'none', marginBottom: '20px' },
  intro: { marginBottom: '24px' },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(24px,3vw,38px)', fontWeight: 400, color: 'var(--text)', marginBottom: '8px' },
  desc: { fontSize: '14px', color: 'var(--text-2)', maxWidth: '520px', lineHeight: 1.6 },

  empty: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
    gap: '12px', padding: '48px 24px',
    background: 'var(--surface)', border: '1px dashed var(--border-2)', borderRadius: '16px',
    textAlign: 'center' as const,
  },
  emptyTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', fontWeight: 500, color: 'var(--text)', margin: 0 },
  emptyDesc: { fontSize: '13.5px', color: 'var(--text-2)', margin: 0, maxWidth: '380px', lineHeight: 1.5 },
  emptyCta: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '10px 16px', borderRadius: '10px',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' as const,
  },

  list: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' },
  card: { padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  cardMeta: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' as const },
  badge: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' as const, padding: '3px 8px', borderRadius: '100px', border: '1px solid' },
  dateLabel: { fontSize: '12px', color: 'var(--text-muted)', fontWeight: 300 },
  cardTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '16px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.4, margin: 0 },
  cardSummary: { fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, margin: 0 },
  sourceLink: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '12px', fontWeight: 500, padding: '5px 10px', borderRadius: '8px',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    color: 'var(--text-2)', textDecoration: 'none' as const,
    alignSelf: 'flex-start' as const, marginTop: 'auto',
  },
}
