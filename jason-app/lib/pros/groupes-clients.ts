// « Trouver des clients » des pros (07/11/2026, Jason : « comme avec les hôtes
// trouver des voyageurs, là c'est trouver des clients »). Les groupes viennent
// de community_groups (colonne audiences, migration 180) ; le clic « Rejoindre »
// passe par /api/groupes/ouvrir (lien suivi gfb-…, statistiques dans
// Provenance). Pur et testé : groupes-clients.test.ts.

export type GroupAudience = 'hote' | 'photographe' | 'menage' | 'depannage' | 'recrutement'
export type ProMetierSlug = 'photographe' | 'menage' | 'depannage'

export const GROUP_AUDIENCES: Array<{ key: GroupAudience; label: string }> = [
  { key: 'hote', label: 'Hôtes (trouver des voyageurs)' },
  { key: 'photographe', label: 'Photographes' },
  { key: 'menage', label: 'Équipes de ménage' },
  { key: 'depannage', label: 'Dépannage' },
  { key: 'recrutement', label: 'Recruter des pros (toi)' },
]

const KNOWN = new Set<string>(GROUP_AUDIENCES.map(a => a.key))

/** Publics d'un groupe ; sans la colonne (migration 180 absente) : hôtes seulement */
export function audiencesOf(g: { audiences?: string[] | null }): GroupAudience[] {
  const list = (g.audiences ?? ['hote']).filter(a => KNOWN.has(a)) as GroupAudience[]
  return list.length ? list : ['hote']
}

export function groupsFor<T extends { audiences?: string[] | null }>(groups: T[], audience: GroupAudience): T[] {
  return groups.filter(g => audiencesOf(g).includes(audience))
}

/** Code du lien suivi d'un groupe (tracked_links.code) */
export function groupLinkCode(groupId: string): string {
  return `gfb-${groupId.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 12)}`
}

/** Adresse de l'app qui compte le clic puis ouvre le groupe */
export function groupOpenUrl(groupId: string, metier?: GroupAudience): string {
  return `/api/groupes/ouvrir?g=${encodeURIComponent(groupId)}${metier ? `&m=${metier}` : ''}`
}

export function facebookGroupSearchUrl(q: string): string {
  return `https://www.facebook.com/search/groups/?q=${encodeURIComponent(q.trim())}`
}

/** Recherches Facebook proposées au pro pour trouver les groupes de sa ville */
export function clientSearches(metier: ProMetierSlug, ville: string | null): Array<{ label: string; url: string }> {
  const v = (ville ?? '').trim()
  if (!v) return []
  const metierQ: Record<ProMetierSlug, string> = {
    photographe: `cherche photographe ${v}`,
    menage: `ménage airbnb ${v}`,
    depannage: `artisan ${v}`,
  }
  return [`airbnb ${v}`, `conciergerie ${v}`, `location saisonnière ${v}`, metierQ[metier]]
    .map(q => ({ label: q, url: facebookGroupSearchUrl(q) }))
}

const SITE = 'https://jasonmarinho.com'
const FICHE_PATH: Record<ProMetierSlug, string> = {
  photographe: '/annuaires/photographes/',
  menage: '/annuaires/menage/',
  depannage: '/annuaires/depannage/',
}

/** Lien de la fiche à mettre dans un post (la visite est rangée en « groupe Facebook ») */
export function ficheShareUrl(metier: ProMetierSlug, slug: string | null): string | null {
  if (!slug) return null
  return `${SITE}${FICHE_PATH[metier]}${encodeURIComponent(slug)}?utm_source=facebook&utm_medium=groupe&utm_campaign=fiche-pro`
}

export interface PostTemplate { key: string; title: string; text: string }

/**
 * Messages prêts à publier dans un groupe. Écrits pour les membres du groupe
 * (vouvoiement), sans chiffre ni promesse : le pro complète les crochets.
 */
export function proPostTemplates(metier: ProMetierSlug, o: { prenom?: string | null; ville?: string | null; lien?: string | null }): PostTemplate[] {
  const prenom = (o.prenom ?? '').trim() || '[TON PRÉNOM]'
  const ville = (o.ville ?? '').trim() || '[TA VILLE]'
  const lien = o.lien || '[LIEN DE TA FICHE]'
  const t: Record<ProMetierSlug, PostTemplate[]> = {
    photographe: [
      { key: 'presentation', title: 'Me présenter', text:
`Bonjour à tous,

Je suis ${prenom}, photographe et vidéaste à ${ville}. Je photographie les locations courte durée (Airbnb, Booking, gîtes, chambres d'hôtes) pour que l'annonce donne envie de réserver.

Mes formules, mes tarifs et des exemples de mon travail sont sur ma fiche :
${lien}

Je me déplace autour de ${ville}. Écrivez-moi en message privé si vous avez une question.` },
      { key: 'annonce', title: 'Annonce à rafraîchir', text:
`Bonjour à tous,

Votre annonce a des photos sombres, prises au téléphone ou qui datent ? Ce sont elles que les voyageurs voient en premier dans les résultats.

Je suis ${prenom}, photographe à ${ville}, spécialisé dans les locations courte durée. Je peux refaire vos photos et, si vous le souhaitez, une courte vidéo du logement.

Exemples et tarifs sur ma fiche : ${lien}` },
      { key: 'creneaux', title: 'Créneaux disponibles', text:
`Bonjour à tous,

Je suis ${prenom}, photographe à ${ville}. J'ai encore des créneaux en [MOIS] pour photographier des locations saisonnières : appartements, maisons, gîtes et chambres d'hôtes.

Tout est sur ma fiche (formules, tarifs, exemples) : ${lien}

Répondez sous ce message ou écrivez-moi en privé pour réserver un créneau.` },
    ],
    menage: [
      { key: 'presentation', title: 'Me présenter', text:
`Bonjour à tous,

Je suis ${prenom} et je m'occupe du ménage des locations courte durée à ${ville} et autour : ménage entre deux voyageurs et préparation du logement avant l'arrivée.

Mes prestations et mes tarifs sont sur ma fiche :
${lien}

Propriétaires et conciergeries, écrivez-moi en message privé pour en parler.` },
      { key: 'conciergeries', title: 'Pour les conciergeries', text:
`Bonjour,

Conciergeries et hôtes de ${ville} : vous cherchez une équipe de ménage régulière pour vos logements ?

Je suis ${prenom}, je travaille pour des locations courte durée et je peux m'organiser avec votre planning de réservations.

Prestations et tarifs sur ma fiche : ${lien}` },
      { key: 'renfort', title: 'Renfort de dernière minute', text:
`Bonjour à tous,

Votre équipe de ménage n'est pas disponible pour un départ et une arrivée le même jour ? J'ai des disponibilités à ${ville} [JOURS ET HORAIRES].

Je suis ${prenom}, ménage de locations courte durée. Ma fiche : ${lien}

Écrivez-moi en privé, je vous réponds rapidement.` },
    ],
    depannage: [
      { key: 'presentation', title: 'Me présenter', text:
`Bonjour à tous,

Je suis ${prenom}, artisan à ${ville} ([TON MÉTIER : plomberie, électricité, serrurerie…]). J'interviens pour les propriétaires et les conciergeries de locations courte durée, y compris entre deux voyageurs.

Mes services et ma zone d'intervention sont sur ma fiche :
${lien}

Écrivez-moi en message privé pour une intervention ou un devis.` },
      { key: 'urgence', title: 'Panne entre deux voyageurs', text:
`Bonjour à tous,

Une fuite, une panne de courant ou une serrure bloquée juste avant l'arrivée de vos voyageurs ?

Je suis ${prenom}, artisan à ${ville}, et je travaille avec des hôtes et des conciergeries. Gardez mon contact pour la prochaine fois : ${lien}` },
      { key: 'conciergeries', title: 'Pour les conciergeries', text:
`Bonjour,

Conciergeries de ${ville} : vous cherchez un artisan de confiance pour l'entretien et les dépannages de vos logements ?

Je suis ${prenom} ([TON MÉTIER]). Mes services et ma zone d'intervention : ${lien}

Je suis ouvert à un partenariat régulier, écrivez-moi en privé.` },
    ],
  }
  return t[metier]
}
