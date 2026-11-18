// Règle pure (testée) : erreur PostgREST « fonction absente de la base ».
/** La fonction home_state manque dans la base (migration 149 pas appliquée). */
export function isMissingFunction(error: { code?: string | null; message?: string | null } | null | undefined): boolean {
  if (!error) return false
  if (error.code === 'PGRST202' || error.code === '42883') return true
  return /could not find the function|function .* does not exist/i.test(error.message ?? '')
}
