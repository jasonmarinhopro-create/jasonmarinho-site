// Fiches d'exemple (06/10/2026, Jason : « Éclat Ménage Bordeaux est fictif,
// pourquoi je le retrouve dans l'admin et dans Visibilité ? ») : une fiche
// rattachée à un compte admin est une démonstration (Camille Sénéchal,
// Éclat Ménage Bordeaux). Jamais publiée (scripts/lib/admin-owned.mjs côté
// site), jamais comptée dans les chiffres, les places Fondateur ni la
// Visibilité ; montrée à part dans l'admin. Tri pur testé : demo.test.ts.

type Db = { from: (t: string) => any }

/** Comptes admin. En cas d'erreur, ensemble vide (rien n'est écarté). */
export async function adminUserIds(db: Db): Promise<Set<string>> {
  const { data, error } = await db.from('profiles').select('id').eq('role', 'admin')
  if (error) return new Set()
  return new Set(((data ?? []) as Array<{ id: string }>).map(r => r.id))
}

export function isDemoFiche(row: { user_id?: string | null }, admins: Set<string>): boolean {
  return !!row.user_id && admins.has(row.user_id)
}

export function splitDemo<T extends { user_id?: string | null }>(rows: T[], admins: Set<string>): { real: T[]; demo: T[] } {
  const real: T[] = []
  const demo: T[] = []
  for (const r of rows) (isDemoFiche(r, admins) ? demo : real).push(r)
  return { real, demo }
}
