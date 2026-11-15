// Carte « Analyses d'annonce Airbnb » (15/11/2026, demande de Jason) : combien
// de fois l'outil public /services/analyse-annonce-airbnb a servi. Affichée
// sur la Vue d'ensemble et l'onglet Partenaires de la page Visibilité.
import { MagnifyingGlass, ArrowRight } from '@phosphor-icons/react/dist/ssr'
import RelativeTime from '@/components/ui/RelativeTime'
import { loadAnnonceAnalysesStats, loadAnnonceAnalysesRecentes } from '@/lib/admin/annonce-analyses'
import { fmtInt } from '@/lib/visibility/admin-rules'
import { v, ACCENT } from './ui'

const num: React.CSSProperties = { fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 30, color: 'var(--text)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }
const lab: React.CSSProperties = { fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.45 }
const SECTIONS: Record<string, string> = { titre: 'Titre', description: 'Description', photos: 'Photos', equipements: 'Équipements', confiance: 'Avis et hôte' }
const cell: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }

export default async function AnalysesCard() {
  const [s, recentes] = await Promise.all([loadAnnonceAnalysesStats(), loadAnnonceAnalysesRecentes()])
  return (
    <section style={{ ...v.card, marginBottom: 16 }}>
      <div style={v.head}>
        <span style={v.icon}><MagnifyingGlass size={18} weight="bold" /></span>
        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          <h2 style={v.title}>Analyses d’annonce Airbnb</h2>
          <p style={v.sub}>Analyses réussies sur la page publique. On garde l’annonce analysée et sa note, rien sur le visiteur.</p>
        </div>
        <a href="https://jasonmarinho.com/services/analyse-annonce-airbnb" target="_blank" rel="noopener" style={v.btn}>
          Voir la page <ArrowRight size={14} weight="bold" />
        </a>
      </div>
      {!s ? (
        <p style={v.text}>Compteur indisponible pour l’instant (migration en attente ou base injoignable).</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 18 }}>
          <div style={cell}><strong style={num}>{fmtInt(s.jours7)}</strong><span style={lab}>sur 7 jours</span></div>
          <div style={cell}>
            <strong style={num}>{fmtInt(s.jours30)}</strong>
            <span style={lab}>sur 30 jours{s.jours30Avant > 0 ? ` (${fmtInt(s.jours30Avant)} les 30 jours d’avant)` : ''}</span>
          </div>
          <div style={cell}><strong style={num}>{fmtInt(s.total)}</strong><span style={lab}>depuis le lancement</span></div>
          <div style={cell}>
            <strong style={{ ...num, color: ACCENT }}>{s.noteMoyenne30 === null ? '–' : `${s.noteMoyenne30} / 100`}</strong>
            <span style={lab}>note moyenne sur 30 jours</span>
          </div>
          <div style={cell}>
            <strong style={num}>{fmtInt(s.partielles30)}</strong>
            <span style={lab}>lectures partielles sur 30 jours (Airbnb n’a pas livré photos et équipements)</span>
          </div>
          <div style={cell}>
            <strong style={{ ...num, fontSize: 20, lineHeight: 1.5 }}>{s.derniere ? <RelativeTime iso={s.derniere} /> : 'Aucune'}</strong>
            <span style={lab}>dernière analyse</span>
          </div>
        </div>
      )}
      {recentes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <span style={v.colHead}>Dernières analyses</span>
          {recentes.map((a, i) => (
            <div key={i} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 16px', padding: '10px 12px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <strong style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 22, color: ACCENT, minWidth: 74, fontVariantNumeric: 'tabular-nums' }}>{a.score} / 100</strong>
              <span style={{ ...lab, flex: '1 1 260px', minWidth: 0 }}>
                {a.sections.length > 0
                  ? a.sections.map(sec => `${SECTIONS[sec.id] ?? sec.id} ${sec.score}/${sec.max}`).join(' · ')
                  : 'Détail non enregistré'}
                {!a.complet && ' · lecture partielle'}
              </span>
              <span style={{ ...lab, whiteSpace: 'nowrap' }}><RelativeTime iso={a.date} /></span>
              {a.lien
                ? <a href={a.lien} target="_blank" rel="noopener noreferrer" style={v.btn}>Ouvrir l’annonce <ArrowRight size={14} weight="bold" /></a>
                : <span style={lab}>Lien non enregistré</span>}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
