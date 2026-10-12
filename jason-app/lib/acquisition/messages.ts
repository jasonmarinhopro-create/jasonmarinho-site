// Messages privés aux photographes et aux équipes de ménage (12/10/2026) :
// texte prêt à coller dans Instagram, Facebook, LinkedIn ou WhatsApp, avec le
// lien court suivi de la messagerie choisie. Pur et testé (messages.test.ts).
//
// Faits repris des séquences de prospection (lib/outreach/playbook.ts),
// vérifiés dans le site : contact direct sans commission, tarif fondateur
// 39,98 € par an à vie pour les 20 premiers, guides de plus de 60 villes,
// planning partagé des ménages. Hôtes : app gratuite pour commencer, sans
// carte bancaire (planning ménage, fiches de police) ; contrats en ligne
// seulement en Standard, dès 19,98 € par an (jamais présentés comme gratuits). Plus court qu'un e-mail : une messagerie se lit
// sur un téléphone. Pas de tiret cadratin.
import { privateLinkCode, shortLinkUrl, type PrivateAudience, type PrivatePlatform } from './rules'

export type PrivateKind = 'premier' | 'relance'

export const PRIVATE_KINDS: Array<{ key: PrivateKind; label: string; hint: string }> = [
  { key: 'premier', label: 'Premier message', hint: 'Te présente en deux phrases et pose une seule question.' },
  { key: 'relance', label: 'Relance', hint: 'Une seule fois, 3 ou 4 jours plus tard, sans réponse.' },
]

export interface PrivateMessageInput {
  audience: PrivateAudience
  platform: PrivatePlatform
  kind: PrivateKind
  prenom?: string
  ville?: string
  /** Vouvoiement (par défaut : tutoiement, comme le reste de la marque) */
  vous?: boolean
}

const clean = (s: string | undefined, max: number) => (s ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

/** Prénom avec une majuscule (« marie-claire » → « Marie-Claire ») */
export function formatPrenom(raw: string | undefined): string {
  return clean(raw, 40).toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, sep: string, l: string) => sep + l.toUpperCase())
}

/** « à Lyon », « au Mans », « aux Sables-d'Olonne », « à La Rochelle » ; vide sans ville */
export function aVille(raw: string | undefined): string {
  const v = clean(raw, 60)
  if (!v) return ''
  if (/^les\s/i.test(v)) return ` aux ${v.slice(4)}`
  if (/^le\s/i.test(v)) return ` au ${v.slice(3)}`
  return ` à ${v}`
}

export function privateMessageUrl(audience: PrivateAudience, platform: PrivatePlatform): string {
  return shortLinkUrl(privateLinkCode(audience, platform))
}

export function buildPrivateMessage(input: PrivateMessageInput): string {
  const { audience, kind, vous = false } = input
  const t = (tu: string, vs: string) => (vous ? vs : tu)
  const prenom = formatPrenom(input.prenom)
  const hello = prenom ? `Bonjour ${prenom},` : 'Bonjour,'
  const ville = aVille(input.ville)
  const url = privateMessageUrl(audience, input.platform)
  const me = 'Je suis Jason Marinho : j\'accompagne des hôtes Airbnb et Booking et je leur ai construit une app pour gérer leur location.'

  if (audience === 'hote') {
    if (kind === 'premier') {
      return [
        hello,
        'Je suis Jason Marinho : je loue moi aussi en courte durée et j\'accompagne des hôtes Airbnb et Booking.',
        `J'ai construit une app pour tout ce que les plateformes ne font pas : ${t('tes', 'vos')} ménages calculés tout seuls à partir de ${t('tes', 'vos')} calendriers Airbnb et Booking, avec un planning à partager à ${t('ton', 'votre')} équipe, les fiches de police des voyageurs et, pour les réservations en direct, des contrats signés en ligne (formule Standard). L'essentiel est gratuit.`,
        `${t('Tu peux', 'Vous pouvez')} jeter un œil ici : ${url}`,
        `${t('Tu loues', 'Vous louez')}${ville} depuis longtemps ?`,
      ].join('\n\n')
    }
    return [
      hello,
      `Je ${t('me permets de revenir vers toi', 'me permets de revenir vers vous')} pour l'app dont je ${t('te', 'vous')} parlais.`,
      `En bref : gratuite pour commencer, sans carte bancaire. ${t('Tu connectes tes', 'Vous connectez vos')} calendriers Airbnb et Booking, et les ménages, arrivées et départs se rangent tout seuls ; ${t('ton', 'votre')} équipe de ménage reçoit son planning par un simple lien. Pour les réservations en direct, la formule Standard ajoute les contrats signés en ligne, dès 19,98 € par an.`,
      `Le lien : ${url}`,
      `Si ce n'est pas pour ${t('toi', 'vous')}, ${t('dis-le-moi', 'dites-le-moi')} simplement, je ne ${t('te', 'vous')} relancerai pas.`,
    ].join('\n\n')
  }

  if (audience === 'photographe') {
    if (kind === 'premier') {
      return [
        hello,
        me,
        `Ils me demandent souvent un bon photographe${ville}. J'ai donc ouvert un annuaire de photographes spécialisés en location courte durée : les hôtes ${t('te', 'vous')} contactent directement, sans commission.`,
        `Voici à quoi ressemble une fiche : ${url}`,
        `${t('Tu fais', 'Vous faites')} ce type de shooting (intérieurs, logements de vacances) ?`,
      ].join('\n\n')
    }
    return [
      hello,
      `Je ${t('me permets de revenir vers toi', 'me permets de revenir vers vous')} pour l'annuaire des photographes de locations de vacances.`,
      `En bref : une page à ${t('ton', 'votre')} nom avec ${t('ton', 'votre')} portfolio, ${t('ta', 'votre')} zone et ${t('tes', 'vos')} tarifs, les demandes des hôtes directement chez ${t('toi', 'vous')}, et l'annuaire mis en avant sur nos guides de plus de 60 villes. Les 20 premiers gardent le tarif fondateur : 39,98 € par an, à vie.`,
      `La fiche d'exemple : ${url}`,
      `Si ce n'est pas pour ${t('toi', 'vous')}, ${t('dis-le-moi', 'dites-le-moi')} simplement, je ne ${t('te', 'vous')} relancerai pas.`,
    ].join('\n\n')
  }

  if (kind === 'premier') {
    return [
      hello,
      me,
      `Leur casse-tête numéro un, c'est de trouver une équipe de ménage fiable${ville}. J'ai donc ouvert un annuaire d'équipes spécialisées en location courte durée : les hôtes ${t('te', 'vous')} contactent directement, sans commission. Et ${t('tes', 'vos')} clients peuvent ${t('te', 'vous')} partager leur planning : ${t('tu vois', 'vous voyez')} tous leurs ménages, calculés à partir de leurs réservations Airbnb et Booking.`,
      `Voici à quoi ressemble une fiche : ${url}`,
      `${t('Tu fais', 'Vous faites')} déjà des ménages de locations de vacances ?`,
    ].join('\n\n')
  }
  return [
    hello,
    `Je ${t('me permets de revenir vers toi', 'me permets de revenir vers vous')} pour l'annuaire des équipes de ménage de locations de vacances.`,
    `En bref : une page à ${t('ton', 'votre')} nom (prestations, zone, tarifs, langues), les demandes des hôtes directement chez ${t('toi', 'vous')}, et l'annuaire mis en avant sur nos guides de plus de 60 villes. Les 20 premières équipes gardent le tarif fondateur : 39,98 € par an, à vie.`,
    `La fiche d'exemple : ${url}`,
    `Si ce n'est pas pour ${t('toi', 'vous')}, ${t('dis-le-moi', 'dites-le-moi')} simplement, je ne ${t('te', 'vous')} relancerai pas.`,
  ].join('\n\n')
}
