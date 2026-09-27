// Encadré « Réglementation » affiché à côté d'une estimation de revenus.
// Données : lib/lcd/regulation.ts (faits vérifiés et sourcés).
import { Scales, Warning, WarningOctagon, Info } from '@phosphor-icons/react/dist/ssr'
import {
  findRegulation, COUNTRY_NOTES, LEVEL_LABELS, REGULATION_VERIFIED_AT,
  type RegulationLevel,
} from '@/lib/lcd/regulation'

const TONES: Record<RegulationLevel, { bg: string; border: string; text: string; Icon: typeof Warning }> = {
  bloquant:   { bg: 'var(--danger-bg)',  border: 'var(--danger-border)',  text: 'var(--danger-text)',  Icon: WarningOctagon },
  restrictif: { bg: 'var(--warning-bg)', border: 'var(--warning-border)', text: 'var(--warning-text)', Icon: Warning },
  encadre:    { bg: 'var(--info-bg)',    border: 'var(--info-border)',    text: 'var(--info-text)',    Icon: Scales },
}

const eur = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' €'

export default function RegulationAlert({
  ville, pays, nuitsEstimees, revenuAnnuel, compact = false,
}: {
  ville: string | null | undefined
  pays: string
  /** Nuits louées par an dans l'estimation, pour signaler un dépassement du plafond résidence principale */
  nuitsEstimees?: number
  revenuAnnuel?: number
  compact?: boolean
}) {
  const reg = findRegulation(ville, pays)

  if (!reg) {
    const note = COUNTRY_NOTES[pays]
    if (!note || compact) return null
    return (
      <div style={{ ...box, background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
        <div style={{ ...head, color: 'var(--text-2)' }}><Info size={16} weight="fill" /> Réglementation</div>
        <p style={{ ...txt, color: 'var(--text-2)' }}>{note}</p>
      </div>
    )
  }

  const t = TONES[reg.niveau]
  const depasse = reg.plafondRP != null && nuitsEstimees != null && nuitsEstimees > reg.plafondRP
  return (
    <div style={{ ...box, background: t.bg, borderColor: t.border }}>
      <div style={{ ...head, color: t.text }}>
        <t.Icon size={16} weight="fill" /> Réglementation à {reg.ville} : {LEVEL_LABELS[reg.niveau]}
      </div>
      <p style={{ ...txt, color: 'var(--text)', fontWeight: 500 }}>{reg.resume}</p>
      {!compact && (
        <ul style={{ margin: '8px 0 0', paddingLeft: '18px' }}>
          {reg.points.map(p => <li key={p} style={{ ...txt, color: 'var(--text-2)', marginBottom: '4px' }}>{p}</li>)}
        </ul>
      )}
      {depasse && (
        <p style={{ ...txt, marginTop: '8px', color: t.text, fontWeight: 600 }}>
          Si c'est ta résidence principale : {reg.plafondRP} nuits par an maximum, alors que l'estimation en compte {nuitsEstimees}.
          {revenuAnnuel != null && nuitsEstimees ? ` Revenu plafonné autour de ${eur(revenuAnnuel * reg.plafondRP! / nuitsEstimees)} par an.` : ''}
        </p>
      )}
      <p style={{ ...txt, marginTop: '8px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
        Vérifié en {REGULATION_VERIFIED_AT} ·{' '}
        <a href={reg.source.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{reg.source.label}</a>
        {' '}· Les règles évoluent : confirme auprès de la mairie avant d'acheter.
      </p>
    </div>
  )
}

const box: React.CSSProperties = { border: '1px solid', borderRadius: '12px', padding: '12px 14px', marginTop: '14px' }
const head: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, letterSpacing: '.2px', marginBottom: '6px' }
const txt: React.CSSProperties = { fontSize: '13px', lineHeight: 1.55, margin: 0 }
