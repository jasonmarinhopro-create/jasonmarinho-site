'use client'

import { Warning, ArrowSquareOut, CheckCircle, Clock } from '@phosphor-icons/react/dist/ssr'
import { getCountry } from '@/lib/countries'
import { nationaliteName } from '@/lib/nationalites'

const AMBER = '#B7791F'
const AMBER_DARK = '#8A5A12'

type Props = {
  /** Pays du logement (ISO-2) */
  logementPays: string | null | undefined
  /** Nationalité du voyageur (ISO-2). Null = inconnue. */
  voyageurNationalite: string | null | undefined
  /** Date d'arrivée pour afficher la deadline */
  dateArrivee: string | null
  /** Nom du voyageur pour personnaliser */
  voyageurNom?: string
  /** true si guest_declarations.statut === 'faite' pour ce séjour */
  declared?: boolean
}

// Affiche une alerte légale rappelant l'obligation de déclarer un voyageur
// étranger : SIBA au Portugal, fiche police en France, registres locaux
// pour les autres pays. La règle se déclenche quand la nationalité du
// voyageur diffère du pays du logement (et qu'on a les deux infos).
export default function ForeignGuestAlert({ logementPays, voyageurNationalite, dateArrivee, voyageurNom, declared = false }: Props) {
  const pays = logementPays ?? 'FR'

  // Cas où on ne peut pas évaluer : on ne montre rien (pas d'alerte spam).
  if (!voyageurNationalite) return null

  // PT exige une déclaration SIBA même pour les ressortissants UE (tous).
  // FR : uniquement les ressortissants HORS UE.
  // Sécurité par défaut : si nationalité ≠ pays du logement → on alerte.
  // (l'hôte décidera ; mieux vaut une alerte de trop qu'une omission)
  if (voyageurNationalite === pays) return null

  const config = getCountry(pays)
  const decl = config.foreignGuestDeclaration

  if (declared) {
    return (
      <div style={s.doneBox}>
        <CheckCircle size={15} weight="fill" color="var(--accent-text)" />
        <span style={s.doneText}>{decl.label} déjà envoyée pour ce séjour.</span>
      </div>
    )
  }

  // Calcul de la deadline si on a la date d'arrivée
  let deadlineLabel: string | null = null
  if (dateArrivee) {
    // En français (l'hôte utilise l'app en français, même pour un logement
    // portugais : avant, la date s'affichait en portugais) et en UTC pour
    // que le serveur et le navigateur affichent la même chose.
    const arrivee = new Date(dateArrivee.slice(0, 10) + 'T12:00:00Z')
    const deadline = new Date(arrivee.getTime() + decl.deadlineHours * 3600 * 1000)
    deadlineLabel = deadline.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
    })
  }

  return (
    <div style={s.box}>
      <div style={s.head}>
        <Warning size={16} weight="fill" color={AMBER} />
        <span style={s.title}>{decl.label}</span>
        <span style={s.badge}>{decl.deadlineHours} h max</span>
      </div>
      <p style={s.text}>
        {voyageurNom ? <strong>{voyageurNom}</strong> : 'Le voyageur'} (nationalité : <strong>{nationaliteName(voyageurNationalite) ?? voyageurNationalite}</strong>)
        {' '}séjourne dans ton logement {pays === 'PT' ? 'au Portugal' : pays === 'FR' ? 'en France' : `(${config.name})`}.
        {' '}{decl.note}
      </p>
      {deadlineLabel && (
        <p style={s.deadline}>
          <Clock size={13} weight="bold" style={{ verticalAlign: '-2px' }} /> À déclarer avant le <strong>{deadlineLabel}</strong> ({decl.deadlineHours} h après l&apos;arrivée).
        </p>
      )}
      {decl.portalUrl && (
        <a href={decl.portalUrl} target="_blank" rel="noopener noreferrer" style={s.link}>
          Accéder au portail officiel <ArrowSquareOut size={11} />
        </a>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  doneBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: '10px',
    padding: '10px 14px',
    marginTop: '10px',
  },
  doneText: {
    fontSize: '12px', fontWeight: 600, color: 'var(--text-2)',
  },
  box: {
    background: `color-mix(in srgb, ${AMBER} 8%, var(--surface))`,
    border: `1px solid color-mix(in srgb, ${AMBER} 28%, transparent)`,
    borderRadius: '10px',
    padding: '12px 14px',
    marginTop: '10px',
  },
  head: {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginBottom: '6px', flexWrap: 'wrap' as const,
  },
  title: { fontSize: '13px', fontWeight: 700, color: AMBER_DARK },
  badge: {
    fontSize: '10px', fontWeight: 700,
    padding: '2px 7px', borderRadius: '999px',
    background: `color-mix(in srgb, ${AMBER} 16%, transparent)`, color: AMBER_DARK,
    letterSpacing: '0.3px',
  },
  text: {
    fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.55,
    margin: '0 0 6px',
  },
  deadline: {
    fontSize: '12px', color: 'var(--text)', fontWeight: 600,
    margin: '6px 0',
  },
  link: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '12px', fontWeight: 600,
    color: 'var(--accent-text)', textDecoration: 'none',
    marginTop: '4px',
  },
}
