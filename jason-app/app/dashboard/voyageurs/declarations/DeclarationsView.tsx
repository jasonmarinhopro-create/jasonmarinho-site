import Link from 'next/link'
import { ArrowLeft, CheckCircle, IdentificationCard } from '@phosphor-icons/react/dist/ssr'
import { getCountry } from '@/lib/countries'
import { nationaliteFlag } from '@/lib/nationalites'
import DeclarationsWidget, { type PendingDeclaration } from '@/components/dashboard/DeclarationsWidget'
import PoliceFicheButton from './PoliceFicheButton'

export type DoneDeclaration = {
  id: string; voyageur_id: string | null; voyageur_nom: string; voyageur_nationalite: string | null
  logement_nom: string | null; logement_pays: string; date_arrivee: string; statut: string; declared_at: string | null
}

const fmt = (d: string) => new Date(d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

// Rendu de la page Déclarations voyageurs (données chargées par page.tsx).
export default function DeclarationsView({ todo, done }: { todo: PendingDeclaration[]; done: DoneDeclaration[] }) {
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
                <div style={{ flex: '1 1 240px', minWidth: 0 }}>
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
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
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
  // Grands écrans : l'historique se répartit sur plusieurs colonnes
  list: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 480px), 1fr))', gap: '8px' },
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
