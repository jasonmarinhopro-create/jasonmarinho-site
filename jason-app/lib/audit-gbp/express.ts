// Audit express d'une fiche Google (15/11/2026, demande de Jason : « la même
// chose que l'analyse d'annonce Airbnb » pour /services/audit-gbp). Pur et
// testé (express.test.ts) : reçoit ce que Google Places rend d'une fiche et
// donne une note sur 100, des priorités classées et ce qui est déjà bien.
//
// Le barème est le nôtre : il ne note que ce que Google laisse lire (identité,
// avis, photos, état de la fiche). Les posts, les réponses aux avis, les
// questions-réponses et la description ne sont pas visibles par cet accès :
// ils restent dans l'audit complet du dashboard (questions.ts).
import type { PlaceDetails } from './places-api'

export interface ExpressConseil { section: string; perte: number; titre: string; texte: string; lien?: { href: string; label: string } }
export interface ExpressSection { id: string; label: string; score: number; max: number }
export interface ExpressFiche {
  nom: string
  ville: string
  categorie: string
  note: number | null
  avis: number
  /** Photos rendues par Google : 10 au plus, donc « 10 » veut dire « 10 ou plus » */
  photos: number
  site: string | null
  telephone: boolean
}
export interface ExpressResult { score: number; verdict: string; fiche: ExpressFiche; sections: ExpressSection[]; conseils: ExpressConseil[]; forts: string[] }

const HEBERGEMENT = /lodging|hotel|motel|hostel|guest_house|bed_and_breakfast|cottage|vacation|holiday|aparthotel|apartment|country_house|resort|camp|inn|villa|chalet|g[iî]te|chambre|location|appartement|maison/i
const PLATEFORMES = /(^|\.)(airbnb|booking|abritel|vrbo|expedia|tripadvisor|gites-de-france|leboncoin)\./i
const fr = (n: number) => String(n).replace('.', ',')

export function expressVerdict(score: number): string {
  if (score >= 85) return 'Fiche solide'
  if (score >= 65) return 'Bonne base, quelques réglages'
  if (score >= 40) return 'Du potentiel à aller chercher'
  return 'Fiche à retravailler'
}

function hote(url: string): string | null {
  try { return new URL(url).hostname.toLowerCase() } catch { return null }
}

export function auditExpress(place: PlaceDetails): ExpressResult {
  const conseils: ExpressConseil[] = []
  const forts: string[] = []
  const nom = place.displayName?.text?.trim() ?? ''
  const ville = place.addressComponents?.find(c => c.types?.includes('locality'))?.longText ?? ''
  const categorie = place.primaryTypeDisplayName?.text ?? ''
  const note = typeof place.rating === 'number' ? place.rating : null
  const avis = place.userRatingCount ?? 0
  const photos = place.photos?.length ?? 0
  const site = place.websiteUri ? hote(place.websiteUri) : null
  const telephone = !!(place.nationalPhoneNumber || place.internationalPhoneNumber)

  // ─── Identité (30) ───
  let identite = 0
  const typesTexte = `${place.primaryType ?? ''} ${categorie} ${(place.types ?? []).join(' ')}`
  if (HEBERGEMENT.test(typesTexte)) { identite += 10; if (categorie) forts.push(`Ta catégorie principale est un hébergement (${categorie}).`) }
  else conseils.push({ section: 'identite', perte: 10, titre: 'Choisis une catégorie d’hébergement', texte: `Ta catégorie principale${categorie ? ` (« ${categorie} »)` : ''} n’est pas reconnue comme un hébergement. Location de vacances, gîte, chambres d’hôtes : c’est elle qui te fait apparaître quand on cherche où dormir.` })
  if (!place.websiteUri) conseils.push({ section: 'identite', perte: 8, titre: 'Ajoute un lien de réservation', texte: 'Ta fiche n’affiche aucun site. Sans lien, le voyageur qui te trouve sur Google ne peut pas réserver : il repart chercher ailleurs.', lien: { href: 'https://www.driing.co/', label: 'Créer ma page de réservation sans commission sur Driing' } })
  else if (site && PLATEFORMES.test(site)) { identite += 5; conseils.push({ section: 'identite', perte: 3, titre: 'Fais pointer ta fiche vers ta réservation en direct', texte: `Le lien de ta fiche mène vers ${site}. Un voyageur arrivé par Google peut réserver chez toi en direct, sans commission de plateforme.`, lien: { href: 'https://www.driing.co/', label: 'Créer ma page de réservation sans commission sur Driing' } }) }
  else { identite += 8; forts.push('Ta fiche mène vers ton propre site.') }
  if (telephone) identite += 6
  else conseils.push({ section: 'identite', perte: 6, titre: 'Ajoute un numéro de téléphone', texte: 'Aucun numéro n’apparaît sur ta fiche. C’est un signe de sérieux, et le bouton « Appeler » est le premier que voit un voyageur sur mobile.' })
  if (place.formattedAddress) identite += 6
  else conseils.push({ section: 'identite', perte: 6, titre: 'Renseigne ton adresse ou ta zone', texte: 'Google ne montre pas d’adresse pour ta fiche : elle a peu de chances de sortir dans les recherches « près de moi ».' })

  // ─── Avis (40) ───
  let ptsAvis = 0
  if (!avis || note === null) {
    conseils.push({ section: 'avis', perte: 40, titre: 'Obtiens tes premiers avis Google', texte: 'Ta fiche n’a pas encore d’avis. Envoie le lien « Donner un avis » de ta fiche à chaque voyageur le jour du départ : c’est le levier le plus fort sur Google.' })
  } else {
    const ptsNote = note >= 4.8 ? 20 : note >= 4.5 ? 16 : note >= 4.2 ? 10 : note >= 4 ? 6 : 2
    ptsAvis += ptsNote
    if (ptsNote === 20) forts.push(`Ta note Google est excellente (${fr(note)} sur 5).`)
    else conseils.push({ section: 'avis', perte: 20 - ptsNote, titre: 'Remonte ta note Google', texte: `Ta note est de ${fr(note)} sur 5. Réponds à chaque avis, surtout aux mauvais, et corrige le reproche qui revient le plus souvent.` })
    const ptsNb = avis >= 100 ? 20 : avis >= 50 ? 17 : avis >= 20 ? 13 : avis >= 10 ? 9 : avis >= 5 ? 6 : 3
    ptsAvis += ptsNb
    if (ptsNb === 20) forts.push(`Tu as beaucoup d’avis (${avis}).`)
    else conseils.push({ section: 'avis', perte: 20 - ptsNb, titre: 'Récolte plus d’avis Google', texte: `Tu as ${avis} avis. Chaque avis récent compte : envoie le lien « Donner un avis » de ta fiche à chaque voyageur le jour du départ.` })
  }

  // ─── Photos (15) ───
  let ptsPhotos = 0
  if (photos >= 10) { ptsPhotos = 15; forts.push('Ta fiche compte au moins 10 photos.') }
  else if (photos >= 5) { ptsPhotos = 9; conseils.push({ section: 'photos', perte: 6, titre: 'Ajoute des photos à ta fiche', texte: `Google montre ${photos} photos sur ta fiche. Vise au moins 10 : chaque pièce, l’extérieur, la vue.`, lien: { href: '/trouver-un-pro', label: 'Trouver un photographe près de chez toi' } }) }
  else if (photos >= 1) { ptsPhotos = 4; conseils.push({ section: 'photos', perte: 11, titre: 'Ajoute des photos à ta fiche', texte: `Google montre ${photos} photo${photos > 1 ? 's' : ''} sur ta fiche. Vise au moins 10 : chaque pièce, l’extérieur, la vue.`, lien: { href: '/trouver-un-pro', label: 'Trouver un photographe près de chez toi' } }) }
  else conseils.push({ section: 'photos', perte: 15, titre: 'Mets des photos sur ta fiche', texte: 'Ta fiche n’a aucune photo. Une fiche sans image est presque toujours ignorée.', lien: { href: '/trouver-un-pro', label: 'Trouver un photographe près de chez toi' } })

  // ─── État de la fiche (15) ───
  let etat = 0
  if (!place.businessStatus || place.businessStatus === 'OPERATIONAL') etat += 7
  else conseils.push({ section: 'etat', perte: 7, titre: 'Ta fiche est marquée comme fermée', texte: 'Google affiche ton établissement comme fermé. Rouvre-le depuis ton profil d’établissement, sinon il disparaît des recherches.' })
  if (place.regularOpeningHours?.periods?.length || place.regularOpeningHours?.weekdayDescriptions?.length) { etat += 4; forts.push('Tes horaires sont renseignés.') }
  else conseils.push({ section: 'etat', perte: 4, titre: 'Renseigne tes horaires d’accueil', texte: 'Google ne montre pas d’horaires sur ta fiche. Indique tes heures d’arrivée et de départ, ou « ouvert 24 h/24 » si l’arrivée est autonome.' })
  if ((place.types?.length ?? 0) >= 2) etat += 4
  else conseils.push({ section: 'etat', perte: 4, titre: 'Ajoute des catégories secondaires', texte: 'Ta fiche n’a qu’une catégorie. Ajoute celles qui te décrivent aussi (location de vacances, gîte, chambres d’hôtes) pour sortir sur plus de recherches.' })

  const sections: ExpressSection[] = [
    { id: 'identite', label: 'Identité', score: identite, max: 30 },
    { id: 'avis', label: 'Avis', score: ptsAvis, max: 40 },
    { id: 'photos', label: 'Photos', score: ptsPhotos, max: 15 },
    { id: 'etat', label: 'État de la fiche', score: etat, max: 15 },
  ]
  const score = sections.reduce((s, x) => s + x.score, 0)
  conseils.sort((a, b) => b.perte - a.perte)
  return { score, verdict: expressVerdict(score), fiche: { nom, ville, categorie, note, avis, photos, site, telephone }, sections, conseils, forts }
}

/** Lien Google Maps ou partage Google : seuls ces hôtes sont suivis (jamais une adresse quelconque). */
export function isGoogleMapsUrl(raw: string): boolean {
  let u: URL
  try { u = new URL(raw) } catch { return false }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
  const h = u.hostname.toLowerCase()
  return /^(www\.|maps\.)?google\.[a-z.]{2,6}$/.test(h) || h === 'maps.app.goo.gl' || h === 'goo.gl' || h === 'g.co' || h === 'share.google' || h === 'g.page'
}
