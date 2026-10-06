// Voyageurs à qui l'hôte peut écrire une newsletter (encart Brevo de Mes
// voyageurs, 06/10/2026). Pur et testé : newsletter.test.ts.
//
// Règles (vérifiées en octobre 2026) : Airbnb, Booking.com et les autres
// plateformes interdisent d'utiliser les coordonnées de leurs voyageurs pour
// du marketing ; seuls les voyageurs venus en direct peuvent recevoir une
// offre pour un nouveau séjour (exception « clients » de l'article L34-5 du
// CPCE : possibilité de refuser à la collecte puis dans chaque message).
// Origine inconnue = exclu, l'hôte la renseigne dans la fiche du voyageur.

export const DIRECT_SOURCES = ['direct', 'driing', 'recommandation'] as const
export const PLATFORM_SOURCES = ['airbnb', 'booking', 'vrbo', 'abritel', 'gites_de_france'] as const

export interface NewsletterVoyageur {
  prenom: string
  nom: string
  email: string | null
  source: string | null
  bloque: boolean | null
}

export interface NewsletterAudience<T> {
  eligible: T[]
  /** Venus d'une plateforme : jamais dans la liste */
  platform: number
  /** Origine non renseignée */
  unknownSource: number
  /** Venus en direct mais sans e-mail */
  noEmail: number
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function newsletterAudience<T extends NewsletterVoyageur>(list: T[]): NewsletterAudience<T> {
  const out: NewsletterAudience<T> = { eligible: [], platform: 0, unknownSource: 0, noEmail: 0 }
  const seen = new Set<string>()
  for (const v of list) {
    if (v.bloque) continue
    const src = (v.source ?? '').toLowerCase()
    if ((PLATFORM_SOURCES as readonly string[]).includes(src)) { out.platform++; continue }
    if (!(DIRECT_SOURCES as readonly string[]).includes(src)) { out.unknownSource++; continue }
    const email = (v.email ?? '').trim().toLowerCase()
    if (!EMAIL.test(email) || email.endsWith('@guest.booking.com') || email.includes('airbnb.com')) { out.noEmail++; continue }
    if (seen.has(email)) continue
    seen.add(email)
    out.eligible.push(v)
  }
  return out
}

/** Une cellule CSV : guillemets doublés, formule de tableur neutralisée */
function cell(s: string): string {
  const v = /^[=+\-@]/.test(s) ? `'${s}` : s
  return `"${v.replace(/"/g, '""')}"`
}

/** CSV à importer dans Brevo (colonnes EMAIL, PRENOM, NOM reconnues à l'import) */
export function toBrevoCsv(list: NewsletterVoyageur[]): string {
  const rows = [['EMAIL', 'PRENOM', 'NOM'], ...list.map(v => [(v.email ?? '').trim().toLowerCase(), v.prenom.trim(), v.nom.trim()])]
  return rows.map(r => r.map(cell).join(';')).join('\r\n') + '\r\n'
}
