import Link from 'next/link'
import { ArrowLeft, CheckCircle, IdentificationCard } from '@phosphor-icons/react/dist/ssr'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import { getCountry } from '@/lib/countries'
import { nationaliteFlag } from '@/lib/nationalites'
import DeclarationsWidget, { type PendingDeclaration } from '@/components/dashboard/DeclarationsWidget'
import PoliceFicheButton from './PoliceFicheButton'

export const metadata = { title: 'Déclarations voyageurs' }

// Déclarations obligatoires (fiche de police FR, SIBA PT…) : accès fixe
// depuis Mes voyageurs (sept. 2026). Avant, elles n'apparaissaient que dans
// le widget de l'accueil, qui disparaît une fois tout déclaré : impossible
// de retrouver une fiche de police déjà faite (à conserver 6 mois en France).
export default async function DeclarationsPage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])
  if (!profile) return null

  const since = new Date(Date.now() - 180 * 86_400_000).toISOString().slice(0, 10)
  const [{ data: pending }, { data: history }] = await Promise.all([
    supabase
      .from('guest_declarations')
      .select('id, voyageur_id, voyageur_nom, voyageur_nationalite, logement_nom, logement_pays, date_arrivee, deadline_at')
      .eq('user_id', profile.userId)
      .eq('statut', 'a_faire')
      .order('deadline_at')
      .limit(100),
    supabase
      .from('guest_declarations')
      .select('id, voyageur_id, voyageur_nom, voyageur_nationalite, logement_nom, logement_pays, date_arrivee, statut, declared_at')
      .eq('user_id', profile.userId)
      .in('statut', ['faite', 'ignoree'])
      .gte('date_arrivee', since)
      .order('date_arrivee', { ascending: false })
      .limit(200),
  ])

  const todo = (pending ?? []) as PendingDeclaration[]
  const done = (history ?? []) as Array<{
    id: string; voyageur_id: string | null; voyageur_nom: string; voyageur_nationalite: string | null
    logement_nom: string | null; logement_pays: string; date_arrivee: string; statut: string; declared_at: string | null
  }>
  const fmt = (d: string) => new Date(d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div style={s.page}>
      <Link href="/dashboard/voyageurs" style={s.back}><ArrowLeft size={13} weight="bold" /> Mes voyageurs</Link>
      <h1 style={s.title}>Déclarations voyageurs</h1>
      <p style={s.desc}>
        Créées automatiquement quand un séjour l&apos;exige (voyageur étranger) : fiche individuelle de police en France
        (à conserver 6 mois), déclaration SIBA au Portugal (sous 3 jours).
      </p>

      {todo.length > 0 ? (
        <DeclarationsWidget declarations={todo} />
      ) : (
        <div style={s.ok}>
          <CheckCircle size={18} weight="fill" color="var(--success-1)" />
          Aucune déclaration en attente.
        </div>
      )}

      <h2 style={s.h2}>Historique (6 derniers mois)</h2>
      {done.length === 0 ? (
        <p style={s.empty}>
          <IdentificationCard size={16} weight="duotone" /> Les déclarations faites apparaîtront ici.
        </p>
      ) : (
        <div style={s.list}>
          {done.map(d => {
            const c = getCountry(d.logement_pays)
            return (
              <div key={d.id} style={s.row}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.rowName}>
                    {nationaliteFlag(d.voyageur_nationalite)}{' '}
                    {d.voyageur_id
                      ? <Link href={`/dashboard/voyageurs/${d.voyageur_id}`} style={s.link}>{d.voyageur_nom}</Link>
                      : d.voyageur_nom}
                  </div>
                  <div style={s.rowSub}>
                    {c.flag} {c.foreignGuestDeclaration.label}{d.logement_nom ? ` · ${d.logement_nom}` : ''} · arrivée {fmt(d.date_arrivee)}
                  </div>
                </div>
                {d.logement_pays === 'FR' && d.statut === 'faite' && <PoliceFicheButton id={d.id} voyageurNom={d.voyageur_nom} />}
                <span style={d.statut === 'faite' ? s.badgeDone : s.badgeIgnored}>
                  {d.statut === 'faite' ? `Déclarée${d.declared_at ? ` le ${fmt(d.declared_at)}` : ''}` : 'Ignorée'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '1100px' },
  back: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '12px',
    fontSize: '13px', color: 'var(--text-2)', textDecoration: 'none',
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: 'var(--text)', margin: '0 0 6px',
  },
  desc: { fontSize: '14px', color: 'var(--text-3)', margin: '0 0 22px', lineHeight: 1.6, maxWidth: '720px' },
  ok: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', marginBottom: '28px',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px',
    fontSize: '14px', color: 'var(--text)', fontWeight: 600,
  },
  h2: {
    fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase',
    color: 'var(--text-2)', margin: '8px 0 10px',
  },
  empty: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: 'var(--text-3)' },
  list: { display: 'flex', flexDirection: 'column', gap: '6px' },
  row: {
    display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '11px 14px',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px',
  },
  rowName: { fontSize: '14px', fontWeight: 600, color: 'var(--text)' },
  rowSub: { fontSize: '12.5px', color: 'var(--text-3)', marginTop: '2px' },
  link: { color: 'var(--accent-text)', textDecoration: 'none' },
  badgeDone: {
    padding: '4px 10px', borderRadius: '999px', fontSize: '11.5px', fontWeight: 600,
    color: '#10b981', background: 'rgba(16,185,129,0.12)', whiteSpace: 'nowrap',
  },
  badgeIgnored: {
    padding: '4px 10px', borderRadius: '999px', fontSize: '11.5px', fontWeight: 600,
    color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)', whiteSpace: 'nowrap',
  },
}
