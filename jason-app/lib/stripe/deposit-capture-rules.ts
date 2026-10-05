// Retenue sur une caution (05/10/2026) : montant au choix (jamais plus que la
// caution, le reste est libéré par Stripe) et motif obligatoire, envoyé au
// voyageur. Pur et testé, utilisé par /api/stripe/deposit/capture.

export type RetenueResult =
  | { ok: true; kept: number; keptCents: number; partial: boolean; reason: string }
  | { ok: false; error: string }

export function parseRetenue(input: { amount: unknown; motif: unknown; caution: number }): RetenueResult {
  const reason = String(input.motif ?? '').replace(/\s+/g, ' ').trim().slice(0, 300)
  if (reason.length < 3) return { ok: false, error: 'Indique le motif de la retenue : il est envoyé au voyageur.' }
  const caution = Math.round(Number(input.caution) * 100) / 100
  if (!Number.isFinite(caution) || caution <= 0) return { ok: false, error: 'Aucune caution sur ce contrat.' }
  const raw = input.amount
  const parsed = raw == null || raw === '' ? caution : Number(String(raw).replace(',', '.'))
  const kept = Math.round(parsed * 100) / 100
  if (!Number.isFinite(kept) || kept <= 0 || kept > caution) {
    return { ok: false, error: `Montant à retenir entre 0,01 € et ${caution.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €.` }
  }
  const keptCents = Math.round(kept * 100)
  return { ok: true, kept, keptCents, partial: keptCents < Math.round(caution * 100), reason }
}
