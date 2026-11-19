// Badge « Référencé sur l'annuaire Jason Marinho » que le pro colle sur son
// site (19/11/2026, audit SEO : un lien depuis le site de chaque pro vers sa
// fiche, c'est un lien local par client). Images : /badge/<métier>.svg du site
// statique. Libellé « référencé » et non « vérifié » : aucune vérification
// n'est faite derrière.

export type BadgeMetier = 'photographe' | 'menage' | 'depannage'

const SITE = 'https://jasonmarinho.com'

export const BADGE_LABELS: Record<BadgeMetier, string> = {
  photographe: 'Photographe et vidéaste Airbnb',
  menage: 'Équipe de ménage Airbnb',
  depannage: 'Dépannage et maintenance Airbnb',
}

/** « photographe », « ménage », « dépannage » (prop metier de FicheOverview) → clé du badge */
export function badgeMetier(metier: string): BadgeMetier | null {
  const m = metier.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  if (m.startsWith('photo')) return 'photographe'
  if (m.startsWith('menage')) return 'menage'
  if (m.startsWith('depannage')) return 'depannage'
  return null
}

const attr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Fiche publique sur jasonmarinho.com uniquement (le badge ne pointe jamais ailleurs) */
export function isFicheUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && u.hostname === 'jasonmarinho.com' && !u.search && !u.hash && /^\/annuaires\/(photographes|menage|depannage)\/[a-z0-9-]+$/.test(u.pathname)
  } catch { return false }
}

/** Code HTML à coller sur le site du pro : l'image du badge, liée à sa fiche */
export function badgeHtml(metier: BadgeMetier, ficheUrl: string, nom: string): string {
  if (!isFicheUrl(ficheUrl)) throw new Error('Adresse de fiche invalide')
  const label = BADGE_LABELS[metier]
  const ref = metier === 'menage' ? 'référencée' : 'référencé'
  const titre = nom.trim() ? `${nom.trim()} sur l'annuaire Jason Marinho` : "Ma fiche sur l'annuaire Jason Marinho"
  return `<a href="${attr(ficheUrl)}" title="${attr(titre)}"><img src="${SITE}/badge/${metier}.svg" alt="${attr(`${label} ${ref} sur l'annuaire Jason Marinho`)}" width="240" height="72" loading="lazy" style="border:0"></a>`
}

/** Version texte, pour Instagram, une fiche Google ou une signature d'e-mail */
export function badgeTexte(ficheUrl: string): string {
  if (!isFicheUrl(ficheUrl)) throw new Error('Adresse de fiche invalide')
  return `Retrouve-moi sur l'annuaire Jason Marinho : ${ficheUrl}`
}
