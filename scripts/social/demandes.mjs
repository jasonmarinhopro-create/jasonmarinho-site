// Stories « Nouvelle demande » (19/11/2026, demande de Jason : « dès que je
// reçois une demande, une story : nous venons de recevoir une demande dans tel
// secteur pour un photographe, une équipe de ménage ou un dépannage »).
// Le workflow « Réseaux sociaux » lit les demandes récentes (demandes_hotes),
// fait une série de stories par demande (une seule pour une demande envoyée
// dans plusieurs villes) et la publie au prochain passage, hors calendrier.
// Ce qui est montré : le métier, la ou les villes, le type d'hébergement, la
// taille du logement, le besoin coché, le délai, et à combien de pros elle est
// partie. Jamais le nom, l'e-mail, le téléphone, le message ni le budget.
// Règles pures, testées par jason-app/lib/social/demandes.test.ts.

import { PHOTOS_VILLES } from '../data/photos-villes.mjs'

export const DEMANDES_FENETRE_H = 36
export const DEMANDES_PAR_JOUR = 4

const METIER = {
  photographe: { qui: 'un *photographe*', pros: 'photographes', recherche: 'appartement lumineux salon' },
  menage: { qui: 'une *équipe de ménage*', pros: 'équipes de ménage', recherche: 'chambre lit linge blanc' },
  depannage: { qui: 'un pro du *dépannage*', pros: 'pros du dépannage', recherche: 'artisan outils réparation' },
}
const POUR = { hotel: 'Pour un hôtel ou une résidence', conciergerie: 'Pour une conciergerie', gite: 'Pour un gîte ou une chambre d’hôtes' }

export const villeSlug = v => String(v ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
// « saint-malo » ou « annecy » saisis par l'hôte : capitales aux mots
const villeNom = v => String(v ?? '').trim().toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase()).replace(/\b(Sur|Sous|En|Les|La|Le|De|Du|Des)\b/g, m => m.toLowerCase()).replace(/^./, c => c.toUpperCase())
const sansEtoiles = s => String(s ?? '').replace(/\*/g, '')
// Texte saisi : jamais d'astérisque (italique jaune du gabarit) ni de tiret cadratin
const propre = s => sansEtoiles(s).replace(/—/g, ',').trim()

/** Regroupe les lignes d'une même demande (envoyée dans plusieurs villes, colonne groupe). */
export function regrouper(rows) {
  const map = new Map()
  for (const r of rows ?? []) {
    const k = r.groupe || r.id
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(r)
  }
  return [...map.entries()].map(([k, list]) => ({ key: k, rows: list.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))) }))
}

/** Slug de la série : « demande- » + 8 caractères de l'identifiant (aucune donnée de l'hôte). */
export const demandeSlug = key => `demande-${String(key).replace(/[^a-z0-9]/gi, '').slice(0, 8).toLowerCase()}`

/**
 * Série de stories d'une demande regroupée. Renvoie un fichier « stories »
 * (format de data/social-queue) avec maintenant: true.
 */
export function demandeStories({ key, rows }) {
  const d = rows[0]
  const m = METIER[d.metier] ?? METIER.photographe
  const villes = [...new Set(rows.map(r => villeNom(propre(r.ville))).filter(Boolean))]
  const lieu = villes.length === 1 ? villes[0] : villes.length === 2 ? `${villes[0]} et ${villes[1]}` : `${villes.slice(0, -1).join(', ')} et ${villes.at(-1)}`
  const slugV = villeSlug(villes[0])
  const photo = PHOTOS_VILLES[slugV] ? `pexels:${PHOTOS_VILLES[slugV]}` : `pexels:${m.recherche}`
  const pros = new Set(rows.flatMap(r => (Array.isArray(r.sent_to) ? r.sent_to : []).map(x => x?.id).filter(Boolean))).size
  const sansPro = !pros || rows.every(r => r.status === 'sans_pro')

  const titre = `${m.qui.charAt(0).toUpperCase()}${m.qui.slice(1)} recherché${d.metier === 'menage' ? 'e' : ''} à *${lieu}*`
  const frames = [{
    type: 'couverture',
    kicker: 'Nouvelle demande',
    titre: titre.length <= 90 ? titre : `${m.qui.charAt(0).toUpperCase()}${m.qui.slice(1)} recherché${d.metier === 'menage' ? 'e' : ''} dans ${villes.length} villes`,
    sous_titre: POUR[d.etablissement] ?? 'Pour un logement en location courte durée',
    photo,
  }]
  const items = [
    d.logement && propre(d.logement),
    d.frequence && propre(d.frequence),
    d.quand && propre(d.quand),
  ].filter(Boolean).slice(0, 4)
  if (items.length >= 2) frames.push({ type: 'liste', kicker: 'La demande', titre: 'Ce qu’il *faut*', items })
  else if (items.length === 1) frames.push({ type: 'point', titre: 'La *demande*', texte: items[0] })
  frames.push(sansPro
    ? { type: 'point', titre: `Pas encore ${/^[aeéiou]/i.test(m.pros) ? 'd’' : 'de '}${m.pros} *dans le secteur*`, texte: `Tu es dans le coin ? Crée ta fiche sur jasonmarinho.com : les prochaines demandes de ${villes.length === 1 ? 'ta ville' : 'ton secteur'} arriveront chez toi.` }
    : { type: 'point', titre: pros > 1 ? `Envoyée aux *${pros} ${m.pros}* les plus proches` : 'Envoyée à *un pro* du secteur', texte: 'En direct, sans commission. Tu es pro dans le secteur ? Crée ta fiche pour recevoir les prochaines.' })
  frames.push({ type: 'astuce', kicker: 'Tu cherches un pro ?', titre: 'Décris ton besoin *une fois*', texte: 'Sur jasonmarinho.com, rubrique Trouver un pro : ta demande part aux pros les plus proches, gratuitement.' })
  return { format: 'stories', slug: demandeSlug(key), maintenant: true, frames: frames.slice(0, 4) }
}

/** Demandes à annoncer : récentes, pas encore annoncées, au plus `place` (plafond du jour). */
export function aAnnoncer(groupes, dejaFaits, place) {
  // Demande déjà close (doublon, essai, spam fermé par Jason) ou sans ville : pas d'annonce
  const annoncable = g => g.rows.some(r => r.status !== 'close' && String(r.ville ?? '').trim())
  return groupes.filter(g => annoncable(g) && !dejaFaits.has(demandeSlug(g.key))).slice(0, Math.max(0, place))
}
