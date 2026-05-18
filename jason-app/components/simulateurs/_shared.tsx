'use client'

// Module partagé entre les 5 simulateurs fiscaux et les 3 calculateurs marché.
// Centralise les styles + helpers + composants utilitaires pour qu'on puisse
// lazy-loader chaque simulateur dans son propre chunk JS sans dupliquer le code.

// ─── Helpers format ──────────────────────────────────────────────────
// Conserve EXACTEMENT le même comportement que les helpers locaux qu'on
// remplace dans SimulateursUI.tsx :
//   fmtEur(n) → "12 345 €" (toLocaleString fr-FR avec suffixe espace + €)
//   fmtPct(n) → "25,5 %"   (n est DÉJÀ en pourcentage, pas en ratio 0-1)
export function fmtEur(n: number, decimals: number = 0): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: decimals }) + ' €'
}

export function fmtPct(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' %'
}

export function normalizeType(raw: string | null | undefined): string {
  if (!raw) return 't2'
  const v = raw.toLowerCase().trim()
  if (v.includes('studio')) return 'studio'
  if (v.includes('t1') || v.includes('1 chambre') || v.includes('1 piece') || v.includes('1 pièce')) return 't1'
  if (v.includes('t2') || v.includes('2 piece') || v.includes('2 pièce')) return 't2'
  if (v.includes('t3') || v.includes('3 piece') || v.includes('3 pièce')) return 't3'
  if (v.includes('maison') || v.includes('villa') || v.includes('house')) return 'maison'
  return 't2'
}

// ─── MiniBox (résultats sous-cards) ──────────────────────────────────
export function MiniBox({ label, value, sub, highlight }: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div style={{
      padding: '10px 12px', borderRadius: '10px',
      background: highlight ? 'linear-gradient(135deg, rgba(99,214,131,0.10) 0%, var(--bg-2) 100%)' : 'var(--bg-2)',
      border: '1px solid ' + (highlight ? 'rgba(99,214,131,0.25)' : 'var(--border)'),
    }}>
      <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif', color: highlight ? 'var(--success-1)' : 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

// ─── BenchmarkRow (comparaison toi vs marché) ────────────────────────
export function BenchmarkRow({ label, toi, marche, toiNum, marcheNum }: {
  label: string
  toi: string
  marche: string
  toiNum: number
  marcheNum: number
}) {
  const ecart = toiNum - marcheNum
  const ecartPct = marcheNum > 0 ? (ecart / marcheNum) * 100 : 0
  const isAbove = ecart > 0
  return (
    <div style={{
      padding: '10px 12px', borderRadius: '10px',
      background: 'var(--bg-2)', border: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '2px' }}>
        <span style={{ fontSize: '17px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)' }}>{toi}</span>
        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>vs {marche}</span>
      </div>
      {marcheNum > 0 && (
        <div style={{ fontSize: '10.5px', fontWeight: 600, color: isAbove ? 'var(--success-1)' : 'var(--text-2)' }}>
          {isAbove ? '↑' : '↓'} {Math.abs(Math.round(ecartPct))} % vs marché
        </div>
      )}
    </div>
  )
}

// ─── Styles partagés (s.field, s.input, s.row, etc.) ─────────────────
export const s: Record<string, React.CSSProperties> = {
  /* ── Shared calc styles ── */
  calc: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '11px' },
  label: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px',
    textTransform: 'uppercase' as const, color: 'var(--text-3)',
    marginBottom: '1px',
  },
  inputWrap: { position: 'relative' as const },
  input: {
    width: '100%', padding: '11px 36px 11px 14px',
    fontSize: '15px', fontWeight: 500, color: 'var(--text)',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', fontFamily: 'inherit', outline: 'none',
  },
  suffix: {
    position: 'absolute' as const, right: '14px', top: '50%',
    transform: 'translateY(-50%)', fontSize: '13px', fontWeight: 400,
    color: 'var(--text-3)', pointerEvents: 'none' as const,
  },
  range: { width: '100%', accentColor: 'var(--accent-text)' },
  helper: { fontSize: '11px', fontWeight: 300, color: 'var(--text-3)' },

  toggleRow: {
    display: 'flex', gap: '6px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    padding: '4px', borderRadius: '10px',
  },
  toggleBtn: {
    flex: 1, padding: '8px 10px',
    fontSize: '12px', fontWeight: 500, color: 'var(--text-2)',
    background: 'transparent', border: 'none', borderRadius: '7px',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  toggleActive: {
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
  },

  results: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '10px', marginTop: '4px',
  },
  resultBox: {
    padding: '14px 16px', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: '12px',
  },
  resultLabel: {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-3)',
    textTransform: 'uppercase' as const, letterSpacing: '0.4px',
    marginBottom: '6px',
  },
  resultValue: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '24px', fontWeight: 400, color: 'var(--text)',
    marginBottom: '6px',
  },
  resultHint: {
    fontSize: '11.5px', fontWeight: 300, color: 'var(--text-2)',
    lineHeight: 1.5,
  },

  disclaimer: {
    display: 'flex', alignItems: 'flex-start', gap: '7px',
    padding: '10px 12px',
    background: 'var(--info-bg)',
    border: '1px solid rgba(96,165,250,0.18)',
    borderRadius: '9px',
    fontSize: '11.5px', fontWeight: 300, color: 'var(--text-2)',
    lineHeight: 1.5, marginTop: '4px',
  },

  // ─── Estimateur / Calculateur (onglets marché) ──────────────────────
  sectionTitle: {
    display: 'flex', alignItems: 'center', gap: '10px',
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '22px', fontWeight: 400,
    color: 'var(--text)', margin: '0 0 6px',
    letterSpacing: '-0.01em',
  },
  sectionDesc: {
    fontSize: '13.5px', fontWeight: 300, color: 'var(--text-2)',
    lineHeight: 1.6, margin: '0 0 22px',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
    gap: 'clamp(14px, 2.5vw, 18px)',
    alignItems: 'flex-start',
  },
  formCard: {
    padding: '20px 22px', borderRadius: '14px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column' as const, gap: '18px',
  },
  resultCard: {
    padding: '20px 22px', borderRadius: '14px',
    background: 'linear-gradient(135deg, var(--accent-bg) 0%, var(--surface) 100%)',
    border: '1px solid var(--accent-border)',
  },
  resultBigVal: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '36px', fontWeight: 400,
    color: 'var(--text)', letterSpacing: '-0.02em',
    margin: '4px 0',
  },
}
