// Public d'une actualité (17/10/2026, Jason : « faut-il aussi des actualités
// pour les équipes de ménage et les photographes ? »). Colonne
// `actualites.audience` (text[], migration 20261017_137) : hôtes,
// photographes / vidéastes, équipes de ménage. Une actualité peut concerner
// plusieurs publics (ex. facture électronique). Sans la colonne ou vide : hôtes.
// Pur et testé (audience.test.ts).

export type ActuAudience = 'hote' | 'photographe' | 'menage'
export const ACTU_AUDIENCES: ActuAudience[] = ['hote', 'photographe', 'menage']

/** Lit le champ envoyé par la veille ou lu en base : chaîne ou tableau, valeurs connues seulement */
export function readAudience(raw: unknown): ActuAudience[] {
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/[,\s]+/) : []
  const out = ACTU_AUDIENCES.filter(a => list.some(v => String(v).trim().toLowerCase() === a))
  return out.length ? out : ['hote']
}

/** Vrai si l'actualité est pour ce public (sans public enregistré : hôtes) */
export function concernsAudience(a: { audience?: unknown }, who: ActuAudience): boolean {
  return readAudience(a.audience).includes(who)
}

/** Actualités d'un public, dans l'ordre reçu */
export function forAudience<T extends { audience?: unknown }>(list: T[], who: ActuAudience): T[] {
  return list.filter(a => concernsAudience(a, who))
}

/**
 * Actualités d'une édition de la lettre : celles du public d'abord, puis, pour
 * les pros, celles des hôtes (plateformes, marché : leurs clients), pour que
 * leur lettre reste remplie les mois calmes. Investisseurs : comme les hôtes.
 */
export function actusForEdition<T extends { audience?: unknown }>(list: T[], edition: 'hote' | 'investisseur' | 'photographe' | 'menage'): T[] {
  if (edition === 'hote' || edition === 'investisseur') return forAudience(list, 'hote')
  const own = forAudience(list, edition)
  return [...own, ...list.filter(a => !own.includes(a) && concernsAudience(a, 'hote'))]
}

/** Point « du neuf » d'un espace : une actu de ce public publiée après la dernière visite */
export function hasNewFor(list: Array<{ audience?: unknown; published_at?: string | null }>, who: ActuAudience, lastSeen: string | null | undefined): boolean {
  const latest = forAudience(list, who)[0]?.published_at
  return !!latest && latest > (lastSeen ?? '1970-01-01T00:00:00Z')
}
