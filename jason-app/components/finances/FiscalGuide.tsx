// Repères fiscaux sourcés (lib/finances/fiscal-guide.ts) dans les écrans de
// saisie de Mes finances : liste dépliable et lien « Source » à côté d'un conseil.
import { ArrowSquareOut, BookOpen } from '@phosphor-icons/react/dist/ssr'
import { FISCAL_RULES, fiscalRule, type FiscalSource } from '@/lib/finances/fiscal-guide'

export function SourceLink({ source, style }: { source: FiscalSource; style?: React.CSSProperties }) {
  return (
    <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11.5, fontWeight: 600, color: 'var(--accent-text)', textDecoration: 'none', whiteSpace: 'nowrap', ...style }}>
      Source : {source.label} <ArrowSquareOut size={11} weight="bold" />
    </a>
  )
}

export function RuleSource({ k, style }: { k: string; style?: React.CSSProperties }) {
  return <SourceLink source={fiscalRule(k).source} style={style} />
}

/** « Déductible ou amortissable ? » : toutes les règles, chacune avec sa source */
export default function FiscalGuide({ keys, title = 'Déductible ou amortissable ? Les règles' }: { keys?: string[]; title?: string }) {
  const rules = keys ? FISCAL_RULES.filter(r => keys.includes(r.key)) : FISCAL_RULES
  return (
    <details style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-2)', padding: '10px 13px' }}>
      <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 7 }}>
        <BookOpen size={15} color="var(--accent-text)" /> {title}
      </summary>
      <ul style={{ listStyle: 'none', margin: '10px 0 2px', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rules.map(r => (
          <li key={r.key} style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-3)' }}>
            <strong style={{ display: 'block', color: 'var(--text)', fontSize: 13 }}>{r.title}</strong>
            {r.text}
            <div style={{ marginTop: 2 }}><SourceLink source={r.source} /></div>
          </li>
        ))}
      </ul>
      <p style={{ margin: '8px 0 0', fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>Repères généraux, pas un conseil personnalisé : pour un cas précis, demande à ton comptable.</p>
    </details>
  )
}
