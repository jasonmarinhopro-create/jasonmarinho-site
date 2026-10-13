// Supabase (PostgREST) ne renvoie jamais plus de 1 000 lignes par requête,
// même avec `.limit(5000)` : au-delà, il faut lire page par page avec
// `.range()`. Le 13/10/2026, le pipeline de Prospection n'affichait que les
// 1 000 contacts les plus récents (560 photographes + 440 équipes de ménage,
// tous « À contacter ») : les contacts déjà écrits étaient hors de la page.
// Toujours trier sur une colonne stable (id en dernier) pour que les pages
// ne se chevauchent pas.

export const PAGE_SIZE = 1000

type DbError = { code?: string; message: string }

export async function allRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: DbError | null }>,
  max = 50_000,
): Promise<{ rows: T[]; error: DbError | null }> {
  const rows: T[] = []
  for (let from = 0; from < max; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1)
    if (error) return { rows, error }
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) break
  }
  return { rows, error: null }
}
