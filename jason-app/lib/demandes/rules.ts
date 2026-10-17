// Demande inversée (12/10/2026) : règles pures, testées (rules.test.ts).
// L'hôte décrit son besoin, la demande part aux pros les plus proches de
// l'annuaire (3 au plus par vague). Sans réponse au bout de 48 h (aucun des
// pros n'a changé le statut de la demande dans « Demandes reçues »), elle part
// à 3 autres ; sans pro dans la zone, aux pros qui s'inscrivent dans les 30
// jours. Le besoin peut être présenté ailleurs SANS les coordonnées de l'hôte
// (`anonymizedNeed`, décision de Jason).

import { citySlugOf } from '@/lib/visibility/city-page'

export type DemandeMetier = 'photographe' | 'menage'

export const PROS_PAR_VAGUE = 3
export const VAGUES_MAX = 3
export const RELANCE_APRES_H = 48
export const NOUVEAUX_PROS_JOURS = 30
export const CONSERVATION_MOIS = 12

export const LOGEMENTS = ['Studio ou T1', 'T2 ou T3', 'T4 et plus', 'Maison', 'Plusieurs logements'] as const
export const QUAND = ['Au plus vite', 'Dans le mois', 'Dans 1 à 3 mois', 'Je me renseigne'] as const
export const FREQUENCES = ['Des ménages réguliers entre deux voyageurs', 'Un ménage ponctuel (remise en état, fin de saison)'] as const
/** Besoin d'un hôte qui cherche un photographe (17/10/2026 : vidéastes dans l'annuaire), rangé dans `frequence` */
export const PRESTATIONS_PHOTO = ['Des photos', 'Une vidéo', 'Des photos et une vidéo', 'Des photos avec vues au drone'] as const

export interface DemandeInput {
  metier: DemandeMetier
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
}

const txt = (v: unknown, max: number) => (typeof v === 'string' ? v : '').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, max)
const oneOf = (v: unknown, list: readonly string[]) => (typeof v === 'string' && list.includes(v) ? v : null)

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
  return {
    value: {
      metier,
      ville,
      logement: oneOf(body.logement, LOGEMENTS),
      quand: oneOf(body.quand, QUAND),
      frequence: oneOf(body.frequence, metier === 'menage' ? FREQUENCES : PRESTATIONS_PHOTO),
      budget: txt(body.budget, 60) || null,
      message,
      nom,
      email,
      telephone: tel.replace(/\D/g, '').length >= 9 ? tel : null,
      source: txt(body.source, 200) || null,
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
}

/**
 * Le pro correspond-il au besoin (vidéo, drone) ? 1 = oui ou rien de précis
 * demandé, 0 = non. Un pro qui ne correspond pas reste possible, après les autres.
 */
export function convientAuBesoin(pro: ProCandidat, besoin: string | null | undefined): 0 | 1 {
  const video = besoin === 'Une vidéo' || besoin === 'Des photos et une vidéo'
  const photo = besoin !== 'Une vidéo'
  const m = pro.metier ?? 'photo'
  if (video && m === 'photo') return 0
  if (besoin && photo && m === 'video') return 0
  if (besoin === 'Des photos avec vues au drone' && !(pro.options ?? []).includes('drone')) return 0
  return 1
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

/** Les pros les plus proches, hors ceux déjà sollicités ; à proximité égale, les moins sollicités d'abord */
export function choisirPros<T extends ProCandidat>(pros: T[], ville: string, exclude: Set<string>, n = PROS_PAR_VAGUE, besoin?: string | null): T[] {
  return pros
    .filter(p => !exclude.has(p.id))
    .map(p => ({ p, s: proximite(p, ville), f: convientAuBesoin(p, besoin) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.f - a.f || b.s - a.s || (a.p.contacts_count ?? 0) - (b.p.contacts_count ?? 0) || String(a.p.created_at ?? '').localeCompare(String(b.p.created_at ?? '')))
    .slice(0, n)
    .map(x => x.p)
}

// ── Textes ──────────────────────────────────────────────────────────

const LIBELLE: Record<DemandeMetier, string> = { photographe: 'un photographe', menage: 'une équipe de ménage' }

/** Message rangé dans « Demandes reçues » du pro (avec les détails, sans redire le contact) */
export function messagePourPro(d: DemandeInput): string {
  return [
    `Demande envoyée depuis jasonmarinho.com : cet hôte cherche ${LIBELLE[d.metier]} à ${d.ville}, et tu fais partie des pros les plus proches.`,
    d.logement && `Logement : ${d.logement}`,
    d.frequence && `Besoin : ${d.frequence}`,
    d.quand && `Quand : ${d.quand}`,
    d.budget && `Budget indiqué : ${d.budget}`,
    d.telephone && `Téléphone : ${d.telephone}`,
    d.message && `\n${d.message}`,
  ].filter(Boolean).join('\n')
}

/** Besoin présentable ailleurs (prospection, réseaux) : jamais le nom, l'e-mail, le téléphone ni le message libre */
export function anonymizedNeed(d: Pick<DemandeInput, 'metier' | 'ville' | 'logement' | 'quand' | 'frequence' | 'budget'>): string {
  const bits = [d.logement, d.frequence ? d.frequence.charAt(0).toLowerCase() + d.frequence.slice(1) : null, d.quand?.toLowerCase(), d.budget ? `budget ${d.budget}` : null].filter(Boolean)
  return `Un hôte cherche ${LIBELLE[d.metier]} à ${d.ville}${bits.length ? ` : ${bits.join(', ')}` : ''}.`
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
