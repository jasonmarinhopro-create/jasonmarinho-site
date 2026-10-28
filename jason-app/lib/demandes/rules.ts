// Demande inversée (12/10/2026) : règles pures, testées (rules.test.ts).
// L'hôte décrit son besoin, la demande part aux pros les plus proches de
// l'annuaire (3 au plus par vague). Sans réponse au bout de 48 h (aucun des
// pros n'a changé le statut de la demande dans « Demandes reçues »), elle part
// à 3 autres ; sans pro dans la zone, aux pros qui s'inscrivent dans les 30
// jours. Le besoin peut être présenté ailleurs SANS les coordonnées de l'hôte
// (`anonymizedNeed`, décision de Jason).

import { citySlugOf } from '@/lib/visibility/city-page'
import { readEtablissement, CLIENTELES, type Clientele } from '@/lib/pros/clienteles'

export type DemandeMetier = 'photographe' | 'menage'

export const PROS_PAR_VAGUE = 3
/** Une demande peut viser plusieurs villes (29/10/2026, conciergerie multi-secteurs) : 5 au plus en tout */
export const VILLES_MAX = 5
export const VAGUES_MAX = 3
export const RELANCE_APRES_H = 48
export const NOUVEAUX_PROS_JOURS = 30
export const CONSERVATION_MOIS = 12

export const LOGEMENTS = ['Studio ou T1', 'T2 ou T3', 'T4 et plus', 'Maison', 'Plusieurs logements'] as const
/** Taille d'un hôtel ou d'une conciergerie (24/10/2026), rangée dans `logement` */
export const TAILLES_HOTEL = ['Moins de 15 chambres', '15 à 50 chambres', 'Plus de 50 chambres'] as const
export const TAILLES_CONCIERGERIE = ['2 à 5 logements', '6 à 20 logements', 'Plus de 20 logements'] as const
/** Tailles proposées selon le type d'hébergement (gîte et logement Airbnb : les tailles d'un logement) */
export function taillesPour(etablissement: string | null | undefined): readonly string[] {
  return etablissement === 'hotel' ? TAILLES_HOTEL : etablissement === 'conciergerie' ? TAILLES_CONCIERGERIE : LOGEMENTS
}
export const QUAND = ['Au plus vite', 'Dans le mois', 'Dans 1 à 3 mois', 'Je me renseigne'] as const
export const FREQUENCES = ['Des ménages réguliers entre deux voyageurs', 'Un ménage ponctuel (remise en état, fin de saison)'] as const
/** Besoin d'un hôte qui cherche un photographe (17/10/2026 : vidéastes dans l'annuaire), rangé dans `frequence` */
export const PRESTATIONS_PHOTO = ['Des photos', 'Une vidéo', 'Des photos et une vidéo', 'Des photos avec vues au drone', 'Une vidéo avec vues au drone'] as const

export interface DemandeInput {
  metier: DemandeMetier
  /** Type d'hébergement (lib/pros/clienteles.ts) ; null = logement d'un hôte (demandes d'avant le 24/10/2026) */
  etablissement?: Clientele | null
  ville: string
  logement: string | null
  quand: string | null
  frequence: string | null
  budget: string | null
  message: string | null
  nom: string
  email: string
  telephone: string | null
  source: string | null
  /** Villes en plus de `ville`, même demande (une demande par ville à l'envoi) */
  autresVilles?: string[]
}

const txt = (v: unknown, max: number) => (typeof v === 'string' ? v : '').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, max)
const oneOf = (v: unknown, list: readonly string[]) => (typeof v === 'string' && list.includes(v) ? v : null)
const villeKey = (v: string) => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()

/** Villes en plus de la ville principale : sans doublon (accents et casse ignorés), 2 à 80 caractères, VILLES_MAX - 1 au plus */
export function cleanAutresVilles(raw: unknown, ville: string): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set([villeKey(ville)])
  const out: string[] = []
  for (const v of raw) {
    const c = txt(v, 80)
    const k = villeKey(c)
    if (c.length < 2 || !k || seen.has(k)) continue
    seen.add(k)
    out.push(c)
    if (out.length >= VILLES_MAX - 1) break
  }
  return out
}

/** Valide le formulaire. Erreur en clair pour l'hôte, sinon la demande propre. */
export function cleanDemande(body: Record<string, unknown>): { value: DemandeInput } | { error: string } {
  const metier = body.metier === 'menage' ? 'menage' : body.metier === 'photographe' ? 'photographe' : null
  if (!metier) return { error: 'Choisis ce que tu cherches : un photographe ou une équipe de ménage.' }
  const ville = txt(body.ville, 80)
  if (ville.length < 2) return { error: 'Indique la ville de ton logement.' }
  const nom = txt(body.nom, 80)
  if (nom.length < 2) return { error: 'Indique ton prénom et ton nom.' }
  const email = txt(body.email, 160).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: 'Ton adresse e-mail semble incorrecte.' }
  if (body.consent !== true) return { error: 'Coche la case pour que ta demande puisse être transmise aux pros.' }
  const message = txt(body.message, 1500) || null
  const tel = txt(body.telephone, 30).replace(/[^\d+ .()-]/g, '')
  const etablissement = readEtablissement(body.etablissement)
  return {
    value: {
      metier,
      etablissement,
      ville,
      logement: oneOf(body.logement, taillesPour(etablissement)),
      quand: oneOf(body.quand, QUAND),
      frequence: oneOf(body.frequence, metier === 'menage' ? FREQUENCES : PRESTATIONS_PHOTO),
      budget: txt(body.budget, 60) || null,
      message,
      nom,
      email,
      telephone: tel.replace(/\D/g, '').length >= 9 ? tel : null,
      source: txt(body.source, 200) || null,
      autresVilles: cleanAutresVilles(body.villes, ville),
    },
  }
}

// ── Rapprochement avec les pros ─────────────────────────────────────

export interface ProCandidat {
  id: string
  ville: string | null
  zone_couverte: string | null
  villes_couvertes?: string[] | null
  contacts_count?: number | null
  created_at?: string | null
  /** Photographes : photo, video ou photo_video, et options (drone…) */
  metier?: string | null
  options?: string[] | null
  /** Clientèles cochées sur la fiche (hôtels, conciergeries…) */
  clienteles?: string[] | null
}

/** 1 si le pro indique travailler pour ce type d'hébergement (hôtel, conciergerie, gîte) ; le logement Airbnb n'ordonne rien */
export function clienteleDuPro(pro: ProCandidat, etablissement: string | null | undefined): 0 | 1 {
  return etablissement && etablissement !== 'lcd' && (pro.clienteles ?? []).includes(etablissement) ? 1 : 0
}

/** Ce que demande l'hôte (photo, vidéo, drone), lu dans `frequence` ; null = rien de précis */
export function besoinPhoto(besoin: string | null | undefined): { photo: boolean; video: boolean; drone: boolean } | null {
  switch (besoin) {
    case 'Des photos': return { photo: true, video: false, drone: false }
    case 'Une vidéo': return { photo: false, video: true, drone: false }
    case 'Des photos et une vidéo': return { photo: true, video: true, drone: false }
    case 'Des photos avec vues au drone': return { photo: true, video: false, drone: true }
    case 'Une vidéo avec vues au drone': return { photo: false, video: true, drone: true }
    default: return null
  }
}

function faitPar(pro: ProCandidat) {
  const m = pro.metier ?? 'photo'
  return { photo: m !== 'video', video: m !== 'photo', drone: (pro.options ?? []).includes('drone') }
}

/** 2 = fait tout ce que l'hôte demande, 1 = en partie, 0 = ne fait pas ce qui est demandé */
export type Adequation = 0 | 1 | 2

/**
 * Le pro fait-il ce que l'hôte demande, d'après le métier et les options de sa fiche ?
 * - 0 : aucun des supports demandés (photographe seul pour « Une vidéo », vidéaste seul pour « Des photos ») :
 *   jamais envoyé automatiquement, Jason peut le transmettre à la main depuis le QG
 * - 1 : en partie (photos et vidéo demandées, il n'en fait qu'une ; drone demandé, pas indiqué sur sa fiche)
 * - 2 : tout ce qui est demandé ; sans besoin précis, 2 pour qui fait de la photo, 1 pour un vidéaste seul
 */
export function convientAuBesoin(pro: ProCandidat, besoin: string | null | undefined): Adequation {
  const b = besoinPhoto(besoin)
  const f = faitPar(pro)
  if (!b) return f.photo ? 2 : 1
  const voulus = [b.photo && 'photo', b.video && 'video'].filter(Boolean) as Array<'photo' | 'video'>
  const faits = voulus.filter(k => f[k])
  if (!faits.length) return 0
  if (faits.length < voulus.length) return 1
  if (b.drone && !f.drone) return 1
  return 2
}

const QUOI = { photo: 'la photo', video: 'la vidéo', drone: 'les vues au drone' } as const
const liste = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} et ${xs[xs.length - 1]}`)

/** Ce que l'hôte demande et que le pro ne propose pas d'après sa fiche (vide si tout correspond) */
export function manquesDuPro(pro: ProCandidat, besoin: string | null | undefined): string[] {
  const b = besoinPhoto(besoin)
  if (!b) return []
  const f = faitPar(pro)
  return (['photo', 'video', 'drone'] as const).filter(k => b[k] && !f[k]).map(k => QUOI[k])
}

/** Phrase pour l'e-mail du pro : pourquoi il reçoit la demande, ou ce qui manque à sa fiche */
export function pourquoiCePro(pro: ProCandidat, besoin: string | null | undefined): string | null {
  const b = besoinPhoto(besoin)
  if (!b) return null
  const demande = liste((['photo', 'video', 'drone'] as const).filter(k => b[k]).map(k => QUOI[k]))
  const manque = manquesDuPro(pro, besoin)
  return manque.length
    ? `L’hôte demande ${demande}. Ta fiche n’indique pas ${liste(manque)} : dis-lui ce que tu peux faire.`
    : `L’hôte demande ${demande}, et ta fiche indique que tu le proposes.`
}

/** Libellé court pour le QG */
export function adequationLabel(a: Adequation): string {
  return a === 2 ? 'Fait ce qui est demandé' : a === 1 ? 'En partie' : 'Ne fait pas ce qui est demandé'
}

export const normCity = (s: string | null | undefined) =>
  (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\bst\b/g, 'saint').replace(/[^a-z0-9]+/g, ' ').trim()

/** Proximité d'un pro avec la ville de l'hôte : 0 = hors zone */
export function proximite(pro: ProCandidat, ville: string): number {
  const v = normCity(ville)
  if (!v) return 0
  const pv = normCity(pro.ville)
  if (pv === v) return 100
  if (pv.startsWith(`${v} `)) return 90
  if ((pro.villes_couvertes ?? []).some(c => normCity(c) === v)) return 80
  const slugHote = citySlugOf(ville)
  if (slugHote && slugHote === citySlugOf(pro.ville, pro.zone_couverte)) return 60
  if ((pro.villes_couvertes ?? []).some(c => slugHote && citySlugOf(c) === slugHote)) return 55
  const zone = ` ${normCity(pro.zone_couverte)} `
  if (zone.includes(` ${v} `)) return 50
  return 0
}

/**
 * Les pros à qui envoyer la demande : d'abord ceux qui font tout ce que l'hôte demande, puis ceux qui le font
 * en partie, jamais ceux qui ne le font pas (0) ; à adéquation égale les plus proches, puis les moins sollicités.
 */
export function choisirPros<T extends ProCandidat>(pros: T[], ville: string, exclude: Set<string>, n = PROS_PAR_VAGUE, besoin?: string | null, etablissement?: string | null): T[] {
  // À adéquation égale, d'abord les pros qui travaillent pour ce type d'hébergement (hôtels, conciergeries, gîtes)
  return pros
    .filter(p => !exclude.has(p.id))
    .map(p => ({ p, s: proximite(p, ville), f: convientAuBesoin(p, besoin), c: clienteleDuPro(p, etablissement) }))
    .filter(x => x.s > 0 && x.f > 0)
    .sort((a, b) => b.f - a.f || b.c - a.c || b.s - a.s || (a.p.contacts_count ?? 0) - (b.p.contacts_count ?? 0) || String(a.p.created_at ?? '').localeCompare(String(b.p.created_at ?? '')))
    .slice(0, n)
    .map(x => x.p)
}

// ── Textes ──────────────────────────────────────────────────────────

const LIBELLE: Record<DemandeMetier, string> = { photographe: 'un photographe', menage: 'une équipe de ménage' }
/** Qui fait la demande, selon le type d'hébergement */
export function demandeur(etablissement: string | null | undefined): string {
  return etablissement === 'hotel' ? 'un hôtel ou une résidence' : etablissement === 'conciergerie' ? 'une conciergerie' : etablissement === 'gite' ? 'un gîte ou une chambre d’hôtes' : 'un hôte'
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
/** Libellé du type d'hébergement pour les fiches et e-mails (vide pour un logement Airbnb ou une demande d'avant) */
export function typeHebergement(etablissement: string | null | undefined): string {
  return CLIENTELES.find(c => c.key === etablissement)?.demande ?? ''
}

/** Message rangé dans « Demandes reçues » du pro (avec les détails, sans redire le contact) */
export function messagePourPro(d: DemandeInput): string {
  return [
    `Demande envoyée depuis jasonmarinho.com : ${d.etablissement && d.etablissement !== 'lcd' ? demandeur(d.etablissement) : 'cet hôte'} cherche ${LIBELLE[d.metier]} à ${d.ville}, et tu fais partie des pros les plus proches.`,
    d.etablissement && `Type : ${typeHebergement(d.etablissement)}`,
    d.logement && `${d.etablissement === 'hotel' || d.etablissement === 'conciergerie' ? 'Taille' : 'Logement'} : ${d.logement}`,
    d.frequence && `Besoin : ${d.frequence}`,
    d.quand && `Quand : ${d.quand}`,
    d.budget && `Budget indiqué : ${d.budget}`,
    d.telephone && `Téléphone : ${d.telephone}`,
    d.message && `\n${d.message}`,
  ].filter(Boolean).join('\n')
}

/** Besoin présentable ailleurs (prospection, réseaux) : jamais le nom, l'e-mail, le téléphone ni le message libre */
export function anonymizedNeed(d: Pick<DemandeInput, 'metier' | 'ville' | 'logement' | 'quand' | 'frequence' | 'budget' | 'etablissement'>): string {
  const bits = [d.logement, d.frequence ? d.frequence.charAt(0).toLowerCase() + d.frequence.slice(1) : null, d.quand?.toLowerCase(), d.budget ? `budget ${d.budget}` : null].filter(Boolean)
  return `${cap(demandeur(d.etablissement))} cherche ${LIBELLE[d.metier]} à ${d.ville}${bits.length ? ` : ${bits.join(', ')}` : ''}.`
}

// ── Relances ────────────────────────────────────────────────────────

export interface DemandeEtat {
  status: 'envoyee' | 'elargie' | 'sans_pro' | 'close'
  created_at: string
  last_round_at: string | null
  sent_to: Array<{ id: string; contact_id?: string | null; round: number }>
}

/**
 * Que faire d'une demande au passage du cron ?
 * - « elargir » : 48 h après la dernière vague, aucun pro n'a touché à la demande (tous « nouvelle »)
 * - « nouveaux_pros » : demande sans pro de moins de 30 jours, à proposer aux pros arrivés depuis
 * - « rien » sinon
 */
export function prochaineAction(d: DemandeEtat, statutsContacts: Map<string, string>, now: Date): 'elargir' | 'nouveaux_pros' | 'rien' {
  const ageJours = (now.getTime() - new Date(d.created_at).getTime()) / 86_400_000
  if (d.status === 'sans_pro') return ageJours <= NOUVEAUX_PROS_JOURS ? 'nouveaux_pros' : 'rien'
  if (d.status !== 'envoyee' && d.status !== 'elargie') return 'rien'
  const vagues = Math.max(0, ...d.sent_to.map(s => s.round))
  if (vagues >= VAGUES_MAX) return 'rien'
  const depuis = d.last_round_at ? (now.getTime() - new Date(d.last_round_at).getTime()) / 3_600_000 : Infinity
  if (depuis < RELANCE_APRES_H) return 'rien'
  const derniers = d.sent_to.filter(s => s.round === vagues)
  const personneNaRepondu = derniers.every(s => !s.contact_id || (statutsContacts.get(s.contact_id) ?? 'nouvelle') === 'nouvelle')
  return personneNaRepondu ? 'elargir' : 'rien'
}
